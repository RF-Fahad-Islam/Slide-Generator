import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { streamStage1, streamStage2, type StreamEvent } from './src/server/lib/ai-stream.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '100mb' }));

  // Return JSON (not Express's HTML error page) for body-parser failures like 413
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err?.type === 'entity.too.large') {
      return res.status(413).json({
        error: 'Uploaded file is too large. The AI pipeline accepts files up to ~75 MB. Try a smaller file or split the PDF into parts.',
      });
    }
    next(err);
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Test API Connection Endpoint
  app.post('/api/ai/test-connection', async (req, res) => {
    const startTime = Date.now();
    try {
      const provider = (req.headers['x-ai-provider'] as string) || 'gemini';

      if (provider === 'gemini') {
        const apiKey = (req.headers['x-gemini-key'] as string) || process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return res.status(401).json({ success: false, error: 'Gemini API Key is missing.' });
        }

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: 'Respond with OK if connection is successful.',
        });

        const latencyMs = Date.now() - startTime;
        return res.json({
          success: true,
          providerName: 'Google Gemini API',
          model: 'gemini-2.5-flash',
          latencyMs,
          message: response.text?.trim() || 'OK',
        });
      } else if (provider === 'openrouter') {
        const apiKey = (req.headers['x-openrouter-key'] as string) || process.env.OPENROUTER_API_KEY;
        const model = (req.headers['x-openrouter-model'] as string) || 'google/gemini-2.5-flash';

        if (!apiKey) {
          return res.status(401).json({ success: false, error: 'OpenRouter API Key is missing.' });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'EdTech MCQ Slide Generator',
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: 'Respond with OK.' }],
            max_tokens: 20,
          }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          throw new Error(data.error?.message || 'OpenRouter API test failed.');
        }

        const latencyMs = Date.now() - startTime;
        return res.json({
          success: true,
          providerName: `OpenRouter (${model})`,
          model,
          latencyMs,
          message: data.choices?.[0]?.message?.content?.trim() || 'OK',
        });
      } else {
        return res.status(400).json({ success: false, error: 'Unknown provider specified.' });
      }
    } catch (err: any) {
      const rawErrorMsg = err?.message || 'Connection test failed.';
      const sanitizedError = rawErrorMsg.replace(/(AIzaSy|sk-or-)[A-Za-z0-9_-]+/g, '[REDACTED_API_KEY]');
      return res.status(500).json({ success: false, error: sanitizedError });
    }
  });

  // NDJSON stream helper — shared wire format for both ingestion stages.
  // Aborts the pipeline when the client disconnects (saves API quota mid-run).
  const streamHandler =
    (
      run: (
        body: any,
        emit: (event: StreamEvent) => void,
        signal: AbortSignal,
        provider: 'gemini' | 'openrouter',
        keys: { geminiKey?: string; openrouterKey?: string; openrouterModel?: string },
      ) => Promise<void>,
    ) =>
    async (req: express.Request, res: express.Response) => {
      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      const abort = new AbortController();
      const onClose = () => {
        if (!res.writableEnded) abort.abort();
      };
      res.on('close', onClose);

      let wroteError = false;
      const emit = (event: StreamEvent) => {
        if (wroteError && event.type !== 'error') return;
        if (event.type === 'error') wroteError = true;
        if (res.writableEnded) return;
        res.write(`${JSON.stringify(event)}\n`);
      };

      const provider = ((req.headers['x-ai-provider'] as string) || 'gemini') as 'gemini' | 'openrouter';
      const geminiKey = (req.headers['x-gemini-key'] as string) || process.env.GEMINI_API_KEY;
      const openrouterKey = (req.headers['x-openrouter-key'] as string) || process.env.OPENROUTER_API_KEY;
      const openrouterModel = (req.headers['x-openrouter-model'] as string) || 'google/gemini-2.5-flash';

      if (provider === 'gemini' && !geminiKey) {
        emit({ type: 'error', message: 'Gemini API Key is missing. Add one in the Keys tab.' });
        return res.end();
      }
      if (provider === 'openrouter' && !openrouterKey) {
        emit({ type: 'error', message: 'OpenRouter API Key is missing. Add one in the Keys tab.' });
        return res.end();
      }

      try {
        await run(req.body || {}, emit, abort.signal, provider, { geminiKey, openrouterKey, openrouterModel });
      } catch (err: any) {
        const rawErrorMsg = err?.message || 'AI parsing failed.';
        const sanitizedError = rawErrorMsg.replace(/(AIzaSy|sk-or-)[A-Za-z0-9_-]+/g, '[REDACTED_API_KEY]');
        console.error('AI Ingestion Error:', sanitizedError);
        emit({ type: 'error', message: sanitizedError });
      } finally {
        res.off('close', onClose);
        if (!res.writableEnded) res.end();
      }
    };

  // Stage 1 — raw text extraction / OCR. Streams raw text live, ends at stage1_done.
  // The client shows this text and asks the user to approve before Stage 2 runs.
  app.post('/api/ai/extract', streamHandler(async (body, emit, signal, provider, keys) => {
    const { promptText, mimeType, fileBase64, fileName } = body;
    console.log(`[Ingestion] Stage 1 extract via ${provider} — source: ${fileName || mimeType || 'pasted text'}`);
    await streamStage1({ promptText, mimeType, fileBase64, fileName, provider, keys, signal }, emit);
  }));

  // Stage 2 — structured MCQ extraction from approved raw text. Streams chunk events.
  app.post('/api/ai/structure', streamHandler(async (body, emit, signal, provider, keys) => {
    const { text } = body;
    console.log(`[Ingestion] Stage 2 structure via ${provider} — ${(text || '').length} chars`);
    await streamStage2({ text, provider, keys, signal }, emit);
  }));

  // Vite development middleware or production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '::', () => {
    console.log(`EdTech MCQ Slide Generator Server running on http://[::]:${PORT}`);
  });
}

startServer();
