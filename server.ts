import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '50mb' }));

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

  // AI MCQ Parser Endpoint (2-Stage Vision Pipeline + Multi-Provider BYOK)
  app.post('/api/ai/parse-mcqs', async (req, res) => {
    try {
      const { promptText, mimeType, fileBase64 } = req.body;
      const provider = (req.headers['x-ai-provider'] as string) || 'gemini';
      const geminiKey = (req.headers['x-gemini-key'] as string) || req.body.geminiKey || process.env.GEMINI_API_KEY;
      const openrouterKey = (req.headers['x-openrouter-key'] as string) || req.body.openrouterKey || process.env.OPENROUTER_API_KEY;
      const openrouterModel = (req.headers['x-openrouter-model'] as string) || 'google/gemini-2.5-flash';

      if (!promptText && !fileBase64) {
        return res.status(400).json({ error: 'Please provide either text or a document file to parse.' });
      }

      if (provider === 'gemini' && !geminiKey) {
        return res.status(401).json({
          error: 'Gemini API Key is missing. Please enter your API key in Settings.',
        });
      }

      if (provider === 'openrouter' && !openrouterKey) {
        return res.status(401).json({
          error: 'OpenRouter API Key is missing. Please enter your API key in Settings.',
        });
      }

      let stage1ExtractedText = promptText || '';

      // =========================================================================
      // STAGE 1: VISION OCR & LAYOUT EXTRACTION PASS (If File/Image/PDF Attached)
      // =========================================================================
      if (fileBase64 && mimeType) {
        console.log(`[2-Stage Pipeline] Running Stage 1: Vision OCR Pass via ${provider}...`);

        const ocrSystemInstruction = `You are an expert OCR and document layout transcriber specializing in Bangladeshi SSC/HSC exam question papers and coaching materials.

Your task is to transcribe ALL text, stems, options, and mathematical formulas from this document image/PDF into clean, linear Markdown text.

Rules:
1. Preserve top-to-bottom reading order across multi-column layouts.
2. Keep LaTeX mathematical expressions exact (e.g., $f(x) = x^2$, $\\frac{dy}{dx}$).
3. Do NOT skip any question, option, or text block.
4. Output clean linear Markdown text. Do NOT generate JSON in this stage.`;

        if (provider === 'gemini') {
          const ai = new GoogleGenAI({ apiKey: geminiKey });
          const ocrResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
              parts: [
                {
                  inlineData: { mimeType, data: fileBase64 },
                },
                {
                  text: 'Transcribe all MCQs, text, and LaTeX math formulas from this document.',
                },
              ],
            },
            config: {
              systemInstruction: ocrSystemInstruction,
            },
          });

          stage1ExtractedText = `${stage1ExtractedText}\n\n${ocrResponse.text || ''}`.trim();
        } else if (provider === 'openrouter') {
          // OpenRouter Multimodal Vision Payload
          const imageUrl = `data:${mimeType};base64,${fileBase64}`;
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${openrouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:3000',
              'X-Title': 'EdTech MCQ Slide Generator',
            },
            body: JSON.stringify({
              model: openrouterModel,
              messages: [
                { role: 'system', content: ocrSystemInstruction },
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: 'Transcribe all MCQs, text, and LaTeX math formulas from this document.' },
                    { type: 'image_url', image_url: { url: imageUrl } },
                  ],
                },
              ],
            }),
          });

          const data = await response.json();
          if (!response.ok || data.error) {
            throw new Error(data.error?.message || 'OpenRouter Vision OCR failed.');
          }

          stage1ExtractedText = `${stage1ExtractedText}\n\n${data.choices?.[0]?.message?.content || ''}`.trim();
        }
      }

      // =========================================================================
      // STAGE 2: STRUCTURED MCQ NORMALIZER & ZOD SCHEMATIZER PASS
      // =========================================================================
      console.log(`[2-Stage Pipeline] Running Stage 2: MCQ Structuring Pass on ${stage1ExtractedText.length} characters of text...`);

      const structurerSystemInstruction = `You are an expert EdTech exam question parser specializing in Multiple Choice Questions (MCQs) for Bengali and English coaching centers, school board exams, and admission tests.

Your task is to parse raw text into a structured JSON array of MCQs.

Guidelines:
1. Question Types:
   - "standard": Standard 4-option question.
   - "roman_statements": Questions with numbered statements (i., ii., iii. or ১, ২, ৩) followed by a prompt like "নিচের কোনটি সঠিক?" and options combining statements (e.g. "i ও ii", "ii ও iii").
   - "passage": Context or stem passage shared across questions.

2. Structure each question strictly matching the JSON schema:
   - stem: Main question statement text. Include LaTeX formatting if formulas exist (e.g., $f(x) = x^2$, $\\frac{dy}{dx}$).
   - romanItems: Array of statement strings if roman_statements type.
   - prompt: Prompt line if applicable (e.g., "নিচের কোনটি সঠিক?").
   - options: Array of exactly 4 options with key ("A"/"B"/"C"/"D" or "ক"/"খ"/"গ"/"ঘ"), text, and isCorrect boolean.
   - answer: Key of correct answer (e.g. "B" or "খ").
   - source: Board exam tag or admission source if present (e.g. "ঢাকা বোর্ড ২০২৪").
   - explanation: Brief explanation of the answer if provided.
   - confidence: "high" or "low".

Return ONLY a valid JSON array of question objects.`;

      let parsedMCQs: any[] = [];

      if (provider === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Parse all MCQs from the following content into structured JSON:\n\n${stage1ExtractedText}`,
          config: {
            systemInstruction: structurerSystemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionType: { type: Type.STRING },
                  stem: { type: Type.STRING },
                  romanItems: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  prompt: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        key: { type: Type.STRING },
                        text: { type: Type.STRING },
                        isCorrect: { type: Type.BOOLEAN },
                      },
                      required: ['key', 'text'],
                    },
                  },
                  answer: { type: Type.STRING },
                  source: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  confidence: { type: Type.STRING },
                },
                required: ['stem', 'options', 'answer'],
              },
            },
          },
        });

        try {
          parsedMCQs = JSON.parse(response.text || '[]');
        } catch {
          parsedMCQs = [];
        }
      } else if (provider === 'openrouter') {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'EdTech MCQ Slide Generator',
          },
          body: JSON.stringify({
            model: openrouterModel,
            messages: [
              { role: 'system', content: structurerSystemInstruction },
              { role: 'user', content: `Parse all MCQs from the following content into structured JSON array:\n\n${stage1ExtractedText}` },
            ],
            response_format: { type: 'json_object' },
          }),
        });

        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error?.message || 'OpenRouter MCQ structuring failed.');
        }

        const rawContent = data.choices?.[0]?.message?.content || '[]';
        try {
          const parsedObj = JSON.parse(rawContent);
          parsedMCQs = Array.isArray(parsedObj) ? parsedObj : parsedObj.questions || parsedObj.items || [];
        } catch {
          parsedMCQs = [];
        }
      }

      // Add unique IDs, normalize Bangla numerals, and sanitize items
      const sanitized = parsedMCQs.map((q, idx) => ({
        id: `ai_mcq_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
        questionType: q.questionType || (q.romanItems && q.romanItems.length > 0 ? 'roman_statements' : 'standard'),
        stem: q.stem || `Question ${idx + 1}`,
        romanItems: q.romanItems || undefined,
        prompt: q.prompt || (q.romanItems && q.romanItems.length > 0 ? 'নিচের কোনটি সঠিক?' : undefined),
        options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : [
          { key: 'A', text: 'Option A' },
          { key: 'B', text: 'Option B' },
          { key: 'C', text: 'Option C' },
          { key: 'D', text: 'Option D' },
        ],
        answer: q.answer || (q.options && q.options[0]?.key) || 'A',
        source: q.source || undefined,
        explanation: q.explanation || undefined,
        confidence: q.confidence || 'high',
      }));

      res.json({
        success: true,
        count: sanitized.length,
        items: sanitized,
        stage1Text: stage1ExtractedText,
      });
    } catch (err: any) {
      const rawErrorMsg = err?.message || 'Failed to parse MCQs using AI.';
      const sanitizedError = rawErrorMsg.replace(/(AIzaSy|sk-or-)[A-Za-z0-9_-]+/g, '[REDACTED_API_KEY]');
      console.error('AI MCQ Parsing Error:', sanitizedError);
      res.status(500).json({ error: sanitizedError });
    }
  });

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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EdTech MCQ Slide Generator Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
