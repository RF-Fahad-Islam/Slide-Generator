import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '25mb' }));

  // Initialize Gemini AI SDK
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // AI MCQ Parser Endpoint (BYOK Header Enabled)
  app.post('/api/ai/parse-mcqs', async (req, res) => {
    try {
      const { promptText, mimeType, fileBase64 } = req.body;
      const userApiKey = (req.headers['x-gemini-key'] as string) || req.body.geminiKey || process.env.GEMINI_API_KEY;

      if (!promptText && !fileBase64) {
        return res.status(400).json({ error: 'Please provide either text or a file to parse.' });
      }

      if (!userApiKey) {
        return res.status(401).json({
          error: 'Gemini API Key is missing. Please enter your API key in the AI Uploader or Settings.',
        });
      }

      // Initialize Gemini AI Client dynamically per request (BYOK)
      const ai = new GoogleGenAI({
        apiKey: userApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `You are an expert EdTech exam question parser specializing in Multiple Choice Questions (MCQs) for Bengali and English coaching centers, school board exams, and admission tests.

Your task is to parse raw text, documents, or question bank screenshots into a structured list of MCQs.

Guidelines:
1. Question Types:
   - "standard": Standard 4-option question.
   - "roman_statements": Questions with numbered statements (i., ii., iii. or ১, ২, ৩) followed by a prompt like "নিচের কোনটি সঠিক?" and options combining statements (e.g. "i ও ii", "ii ও iii").
   - "passage": Context or stem passage shared across questions.

2. Structure each question strictly matching the JSON schema provided:
   - stem: The main question statement. Include LaTeX formatting if formulas exist (e.g., $f(x) = x^2$, $\\frac{dy}{dx}$).
   - romanItems: Array of statement strings if roman_statements type (e.g., ["i. ইউরেটেরোস্কোপিক", "ii. আল্ট্রাসনিক লিথোট্রিপসি", "iii. অস্ত্রোপচার"]).
   - prompt: Prompt line if applicable (e.g., "নিচের কোনটি সঠিক?").
   - options: Array of exactly 4 options. Each option must have:
     - key: "A", "B", "C", "D" or "ক", "খ", "গ", "ঘ".
     - text: The option choice text.
     - isCorrect: boolean (true if this is the correct answer).
   - answer: The key corresponding to the correct answer (e.g., "B" or "খ").
   - source: Board exam tag or admission source if present (e.g. "ঢাকা বোর্ড ২০২৪").
   - explanation: Brief explanation of the answer if provided in text.
   - confidence: "high" if questions and options are clearly resolved, "low" if missing keys/unclear.

Return a valid JSON array of question objects.`;

      const contentsParts: any[] = [];

      if (fileBase64 && mimeType) {
        contentsParts.push({
          inlineData: {
            mimeType,
            data: fileBase64,
          },
        });
      }

      if (promptText) {
        contentsParts.push({
          text: `Parse all MCQs from the following content:\n\n${promptText}`,
        });
      } else {
        contentsParts.push({
          text: 'Parse all MCQs contained in this attached file or image.',
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: contentsParts },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questionType: { type: Type.STRING, description: 'standard | roman_statements | passage' },
                stem: { type: Type.STRING, description: 'Main question stem text' },
                romanItems: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'List of Roman numeral statements i, ii, iii if bohupodi question',
                },
                prompt: { type: Type.STRING, description: 'Prompt line like "নিচের কোনটি সঠিক?"' },
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
                answer: { type: Type.STRING, description: 'Correct key (A/B/C/D or ক/খ/গ/ঘ)' },
                source: { type: Type.STRING, description: 'Source board exam tag e.g. "চট্টগ্রাম বোর্ড ২০১৭"' },
                explanation: { type: Type.STRING, description: 'Explanation text if available' },
                confidence: { type: Type.STRING, description: 'high | low' },
              },
              required: ['stem', 'options', 'answer'],
            },
          },
        },
      });

      const responseText = response.text || '[]';
      let parsedMCQs: any[] = [];
      try {
        parsedMCQs = JSON.parse(responseText);
      } catch {
        parsedMCQs = [];
      }

      // Add unique IDs and sanitize
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

      res.json({ success: true, count: sanitized.length, items: sanitized });
    } catch (err: any) {
      const rawErrorMsg = err?.message || 'Failed to parse MCQs using Gemini AI.';
      // Strip potential key fragments from error string
      const sanitizedError = rawErrorMsg.replace(/AIzaSy[A-Za-z0-9_-]{33}/g, '[REDACTED_API_KEY]');
      console.error('Gemini MCQ Parsing Error:', sanitizedError);
      res.status(500).json({
        error: sanitizedError,
      });
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
