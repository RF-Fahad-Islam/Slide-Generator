import { GoogleGenAI, Type } from '@google/genai';
import type { MCQItem } from '../../types.js';
import { extractTextFromBuffer, normalizeMime } from './extract-text.js';
import { rasterizePdfPages } from './rasterize.js';
import { ocrPages, type AiProvider, type ProviderKeys } from './ocr.js';
import { chunkText } from './chunk.js';
import { sanitizeMCQs } from './sanitize.js';

export type StreamEvent =
  | { type: 'stage1_start'; kind: 'text' | 'vision'; sourceName: string; pageCount: number }
  | { type: 'stage1_raster'; pageNumber: number }
  | { type: 'stage1_page'; pageNumber: number[]; text: string }
  | { type: 'stage1_done'; kind: 'text' | 'vision'; text: string; warnings: string[]; totalChars: number }
  | { type: 'chunk_start'; chunkIndex: number; totalChunks: number; approxTokens: number }
  | { type: 'mcqs'; chunkIndex: number; items: MCQItem[]; skipped: number; skipReasons: string[] }
  | { type: 'chunk_error'; chunkIndex: number; message: string }
  | { type: 'done'; totalMCQs: number; failedChunks: number; totalChunks: number; skippedTotal: number }
  | { type: 'error'; message: string };

export type EmitFn = (event: StreamEvent) => void;

export interface ParseRequest {
  promptText?: string;
  mimeType?: string;
  fileBase64?: string;
  fileName?: string;
  text?: string;
  provider: AiProvider;
  keys: ProviderKeys;
  signal?: AbortSignal;
}

export async function streamStage1(req: ParseRequest, emit: EmitFn): Promise<void> {
  const { promptText, mimeType, fileBase64, fileName, provider, keys, signal } = req;
  const sourceName = fileName || mimeType?.split('/')[1] || 'pasted text';

  if (!promptText?.trim() && !fileBase64) {
    emit({ type: 'error', message: 'Please provide either text or a document file to parse.' });
    return;
  }

  let stage1Text = promptText?.trim() || '';
  const warnings: string[] = [];

  try {
    if (fileBase64) {
      const buffer = Buffer.from(fileBase64, 'base64');
      const doc = await extractTextFromBuffer(buffer, normalizeMime(mimeType, fileName), fileName);

      if (doc.kind === 'text') {
        stage1Text = [stage1Text, doc.text].filter(Boolean).join('\n\n').trim();
        warnings.push(...doc.warnings);
        emit({ type: 'stage1_start', kind: 'text', sourceName, pageCount: doc.pages.length || 1 });
        emit({ type: 'stage1_done', kind: 'text', text: stage1Text, warnings, totalChars: stage1Text.length });
      } else {
        let pages: { pageNumber: number; dataUrl: string }[];
        if (normalizeMime(mimeType, fileName) === 'application/pdf') {
          const pageCount = doc.pages.length || 0;
          emit({ type: 'stage1_start', kind: 'vision', sourceName, pageCount });
          pages = await rasterizePdfPages(buffer, pageCount, (pageNumber) => {
            emit({ type: 'stage1_raster', pageNumber });
          });
        } else {
          emit({ type: 'stage1_start', kind: 'vision', sourceName, pageCount: 1 });
          pages = [{ pageNumber: 1, dataUrl: `data:${mimeType || 'image/png'};base64,${fileBase64}` }];
        }

        warnings.push(...doc.warnings);
        const ocrResults = await ocrPages(provider, keys, pages, signal);
        for (const r of ocrResults) {
          emit({ type: 'stage1_page', pageNumber: r.pageNumbers, text: r.text });
        }
        stage1Text = [stage1Text, ...ocrResults.map((r) => r.text)]
          .filter(Boolean)
          .join('\n\n')
          .trim();
        emit({ type: 'stage1_done', kind: 'vision', text: stage1Text, warnings, totalChars: stage1Text.length });
      }
    } else {
      emit({ type: 'stage1_start', kind: 'text', sourceName, pageCount: 1 });
      emit({ type: 'stage1_done', kind: 'text', text: stage1Text, warnings, totalChars: stage1Text.length });
    }
  } catch (err: any) {
    if (signal?.aborted) return;
    emit({ type: 'error', message: safeError(err) });
  }
}

export async function streamStage2(req: ParseRequest, emit: EmitFn): Promise<void> {
  const { text, provider, keys, signal } = req;

  if (!text?.trim()) {
    emit({ type: 'error', message: 'No extracted text to structure. Run Stage 1 first.' });
    return;
  }

  try {
    const chunks = chunkText(text);
    if (chunks.length === 0) {
      emit({ type: 'error', message: 'No usable text was extracted from this document.' });
      return;
    }

    let totalMCQs = 0;
    let failedChunks = 0;
    let skippedTotal = 0;

    for (const chunk of chunks) {
      if (signal?.aborted) return;
      emit({ type: 'chunk_start', chunkIndex: chunk.index, totalChunks: chunks.length, approxTokens: chunk.approxTokens });

      try {
        const raw = await extractMCQsFromText(chunk.text, provider, keys, signal);
        const { items, skipped, errors } = sanitizeMCQs(raw, chunk.index);
        totalMCQs += items.length;
        skippedTotal += skipped;
        emit({ type: 'mcqs', chunkIndex: chunk.index, items, skipped, skipReasons: errors });
      } catch (err: any) {
        failedChunks += 1;
        emit({ type: 'chunk_error', chunkIndex: chunk.index, message: safeError(err) });
      }
    }

    emit({ type: 'done', totalMCQs, failedChunks, totalChunks: chunks.length, skippedTotal });
  } catch (err: any) {
    if (signal?.aborted) return;
    emit({ type: 'error', message: safeError(err) });
  }
}

function safeError(err: any): string {
  let msg = String(err?.message || 'Failed to parse MCQs using AI.').replace(
    /(AIzaSy|sk-or-)[A-Za-z0-9_-]+/g,
    '[REDACTED_API_KEY]',
  );
  if (/credit|afford|insufficient|top up|balance/i.test(msg)) {
    msg =
      'Your AI provider is out of credits. Switch to Gemini in the Keys tab (Google free tier), or top up your OpenRouter account, then try again.';
  }
  return msg;
}

const STRUCTURER_SYSTEM_INSTRUCTION = `You are an expert EdTech exam question parser specializing in Multiple Choice Questions (MCQs) for Bengali and English coaching centers, school board exams, and admission tests.

Parse the raw text into a JSON array of MCQs.

Guidelines:
1. Question types:
   - "standard": Standard 4-option question.
   - "roman_statements": Numbered statements (i., ii., iii. or ১, ২, ৩) followed by a prompt like "নিচের কোনটি সঠিক?" and options combining statements (e.g. "i ও ii", "ii ও iii").
   - "passage": Context or stem passage shared across questions.
2. Structure each question matching the JSON schema exactly:
   - questionType: one of the types above.
   - stem: Main question statement. Keep LaTeX exactly ($f(x) = x^2$, $\\frac{dy}{dx}$).
   - romanItems: Array of statement strings for roman_statements.
   - prompt: Prompt line when applicable.
   - options: Exactly 4 options with key ("A"/"B"/"C"/"D" or "ক"/"খ"/"গ"/"ঘ"), text, and isCorrect boolean.
   - answer: Key of the correct option.
   - source: Board/admission source tag if present (e.g. "ঢাকা বোর্ড ২০২৪").
   - explanation: Brief explanation if provided.
   - confidence: "high" or "low".
3. Mark confidence "low" when the correct answer is not explicitly stated in the source — never silently guess an answer.
4. If a question is cut off or incomplete, omit it entirely rather than returning a broken object.
5. Return ONLY a valid JSON array. No prose, no markdown fences.`;

const SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      questionType: { type: Type.STRING },
      stem: { type: Type.STRING },
      romanItems: { type: Type.ARRAY, items: { type: Type.STRING } },
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
} as const;

async function extractMCQsFromText(
  text: string,
  provider: AiProvider,
  keys: ProviderKeys,
  signal?: AbortSignal,
): Promise<unknown[]> {
  if (provider === 'gemini') {
    if (!keys.geminiKey) throw new Error('Missing Gemini API key. Add it in the Keys tab first.');
    const ai = new GoogleGenAI({ apiKey: keys.geminiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Parse all MCQs from the following content into structured JSON:\n\n${text}`,
      config: {
        systemInstruction: STRUCTURER_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: SCHEMA,
        abortSignal: signal,
      },
    });
    try {
      return JSON.parse(response.text || '[]');
    } catch {
      throw new Error('AI returned malformed JSON for this chunk — questions may be lost.');
    }
  }

  if (!keys.openrouterKey) throw new Error('Missing OpenRouter API key. Add it in the Keys tab first.');
  const model = keys.openrouterModel || 'google/gemini-2.5-flash';
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${keys.openrouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'EdTech MCQ Slide Generator',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: STRUCTURER_SYSTEM_INSTRUCTION },
        { role: 'user', content: `Parse all MCQs from the following content into structured JSON array:\n\n${text}` },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 8192,
    }),
    signal,
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || 'OpenRouter MCQ structuring failed.');
  }

  const rawContent = data.choices?.[0]?.message?.content || '[]';
  try {
    const parsed = JSON.parse(rawContent);
    return Array.isArray(parsed) ? parsed : parsed.questions || parsed.items || [];
  } catch {
    throw new Error('AI returned malformed JSON for this chunk — questions may be lost.');
  }
}
