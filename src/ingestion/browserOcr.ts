import type React from 'react';
import type { Action, PendingOcrPage } from './ingestionStore';

// Lazily loaded and cached for the life of the tab — the Bengali+English
// trained-data download (~a few MB, fetched from Tesseract's CDN) only
// needs to happen once per session, not once per document.
let workerPromise: Promise<any> | null = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js');
      return createWorker('ben+eng');
    })();
  }
  return workerPromise;
}

export async function runBrowserOcr(
  pages: PendingOcrPage[],
  warnings: string[],
  dispatch: React.Dispatch<Action>,
  signal: AbortSignal,
): Promise<void> {
  if (pages.length === 0) {
    dispatch({ type: 'STAGE1_DONE', kind: 'vision', text: '', warnings });
    return;
  }

  const worker = await getWorker();
  const ordered = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
  const texts: string[] = [];

  for (const page of ordered) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const { data } = await worker.recognize(page.dataUrl);
    const text = data?.text || '';
    texts.push(text);
    dispatch({ type: 'STAGE1_PAGE', pageNumbers: [page.pageNumber], text });
  }

  const combined = texts.filter(Boolean).join('\n\n').trim();
  dispatch({
    type: 'STAGE1_DONE',
    kind: 'vision',
    text: combined,
    warnings: [
      ...warnings,
      'Transcribed locally via Browser OCR (Tesseract.js) — accuracy is lower than AI Vision, especially for Bangla conjuncts. Review carefully before approving.',
    ],
  });
}
