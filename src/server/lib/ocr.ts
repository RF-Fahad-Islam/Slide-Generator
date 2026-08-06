import { GoogleGenAI } from '@google/genai';
import type { RasterizedPage } from './rasterize.js';

export type AiProvider = 'gemini' | 'openrouter';

export interface ProviderKeys {
  geminiKey?: string;
  openrouterKey?: string;
  openrouterModel?: string;
}

export const OCR_SYSTEM_PROMPT = `You are a high-precision Bangla (Bengali) optical character recognition engine specializing in Bangladeshi SSC/HSC board exam question papers and coaching materials.

Transcribe ALL text exactly as printed. Accuracy is the ONLY goal.

CRITICAL BANGLA ACCURACY RULES:
1. Preserve Bengali conjuncts (যুক্তাক্ষর) exactly — e.g. ক্ষ, শ্র, ক্ল, প্র, স্ত্র, ক্স. Never split or drop them.
2. Keep Bengali numerals ০১২৩৪৫৬৭৮৯ as-is where printed (they are normalized later).
3. Preserve LaTeX math exactly: $f(x) = x^2$, $\\frac{dy}{dx}$, $\\sqrt{}$ etc.
4. Preserve multi-column reading order: top-to-bottom, left column first, then right column.
5. Do NOT merge options from different questions. Keep each option's key (ক/খ/গ/ঘ, A/B/C/D, i/ii/iii) attached to its text.
6. Do NOT skip, invent, translate, or reword any text. Output exactly what is printed.
7. Preserve the exact question numbers and option labels.
8. If a region is illegible, write [?] in that exact spot — never guess.

Return only the transcribed linear text as plain text. Do NOT output JSON.`;

const OCR_USER_PROMPT =
  'Transcribe every MCQ stem, statement, option, prompt, source tag, and LaTeX formula from this document exactly as printed. Preserve Bangla conjuncts and numerals.';

function assertKey(key: string | undefined, label: string): asserts key is string {
  if (!key) throw new Error(`Missing ${label}. Add it in the Keys tab first.`);
}

export interface OcrBatchResult {
  pageNumbers: number[];
  text: string;
}

export async function ocrPages(
  provider: AiProvider,
  keys: ProviderKeys,
  pages: RasterizedPage[],
  signal?: AbortSignal,
): Promise<OcrBatchResult[]> {
  const results: OcrBatchResult[] = [];

  // Hybrid batching (per-plan decision D-OCR-2): per-page up to 10 pages,
  // then 3-page batches so very long scanned bundles don't run forever.
  const batches = buildBatches(pages);

  for (const batch of batches) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const text = await ocrBatch(provider, keys, batch, signal);
    // One result per batch — a 2-4 page batch produces a single combined OCR
    // pass; returning it once prevents the same MCQs being emitted N times.
    results.push({ pageNumbers: batch.map((p) => p.pageNumber), text });
  }

  return results;
}

function buildBatches(pages: RasterizedPage[]): RasterizedPage[][] {
  if (pages.length <= 10) return pages.map((p) => [p]);
  const firstTen = pages.slice(0, 10).map((p) => [p]);
  const rest: RasterizedPage[][] = [];
  for (let i = 10; i < pages.length; i += 3) {
    rest.push(pages.slice(i, i + 3));
  }
  return [...firstTen, ...rest];
}

async function ocrBatch(
  provider: AiProvider,
  keys: ProviderKeys,
  batch: RasterizedPage[],
  signal?: AbortSignal,
): Promise<string> {
  if (provider === 'gemini') {
    assertKey(keys.geminiKey, 'Gemini API key');
    const ai = new GoogleGenAI({ apiKey: keys.geminiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          ...batch.map((p) => ({
            inlineData: { mimeType: 'image/png', data: p.dataUrl.split(',')[1] ?? '' },
          })),
          { text: OCR_USER_PROMPT },
        ],
      },
      config: {
        systemInstruction: OCR_SYSTEM_PROMPT,
        abortSignal: signal,
      },
    });
    return response.text || '';
  }

  assertKey(keys.openrouterKey, 'OpenRouter API key');
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
        { role: 'system', content: OCR_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            ...batch.map((p) => ({ type: 'image_url' as const, image_url: { url: p.dataUrl } })),
            { type: 'text', text: OCR_USER_PROMPT },
          ],
        },
      ],
    }),
    signal,
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || 'OpenRouter Vision OCR failed.');
  }
  return data.choices?.[0]?.message?.content || '';
}
