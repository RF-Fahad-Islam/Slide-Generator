import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import { MCQItem } from '../types';

export type IngestionStatus = 'idle' | 'extracting' | 'awaiting_approval' | 'structuring' | 'done' | 'error' | 'aborted';

export interface IngestionJob {
  promptText: string;
  fileBase64?: string | null;
  mimeType?: string;
  fileName?: string;
}

export interface IngestionState {
  status: IngestionStatus;
  kind: 'text' | 'vision';
  sourceName: string;
  pageCount: number;
  rasterDone: number;
  pagesDone: number;
  totalChunks: number;
  chunksDone: number;
  failedChunks: number;
  skippedTotal: number;
  mcqCount: number;
  warnings: string[];
  skipReasons: string[];
  rawText: string;
  results: MCQItem[];
  errorMsg: string | null;
  job: IngestionJob | null;
  startedAt: number | null;
  elapsed: number;
}

const IDLE_STATE: IngestionState = {
  status: 'idle',
  kind: 'text',
  sourceName: '',
  pageCount: 0,
  rasterDone: 0,
  pagesDone: 0,
  totalChunks: 0,
  chunksDone: 0,
  failedChunks: 0,
  skippedTotal: 0,
  mcqCount: 0,
  warnings: [],
  skipReasons: [],
  rawText: '',
  results: [],
  errorMsg: null,
  job: null,
  startedAt: null,
  elapsed: 0,
};

type Action =
  | { type: 'START_EXTRACT'; job: IngestionJob; sourceName: string }
  | { type: 'STAGE1_START'; kind: 'text' | 'vision'; sourceName: string; pageCount: number }
  | { type: 'STAGE1_RASTER'; pageNumber: number }
  | { type: 'STAGE1_PAGE'; pageNumbers: number[]; text: string }
  | { type: 'STAGE1_DONE'; kind: 'text' | 'vision'; text: string; warnings: string[] }
  | { type: 'APPROVE' }
  | { type: 'CHUNK_START'; totalChunks: number }
  | { type: 'MCQS'; items: MCQItem[]; skipped: number; skipReasons: string[] }
  | { type: 'CHUNK_ERROR' }
  | { type: 'DONE'; totalMCQs: number; failedChunks: number; totalChunks: number; skippedTotal: number }
  | { type: 'ERROR'; message: string }
  | { type: 'ABORTED' }
  | { type: 'DISCARD' }
  | { type: 'TICK'; elapsed: number };

function reducer(state: IngestionState, action: Action): IngestionState {
  switch (action.type) {
    case 'START_EXTRACT':
      return {
        ...IDLE_STATE,
        status: 'extracting',
        job: action.job,
        sourceName: action.sourceName,
        startedAt: Date.now(),
      };
    case 'STAGE1_START':
      return { ...state, status: 'extracting', kind: action.kind, sourceName: action.sourceName, pageCount: action.pageCount };
    case 'STAGE1_RASTER':
      return { ...state, rasterDone: Math.max(state.rasterDone, action.pageNumber) };
    case 'STAGE1_PAGE': {
      const rawText = `${state.rawText}\n\n[Pages ${action.pageNumbers.join(', ')}]\n${action.text}`.trim();
      return { ...state, pagesDone: state.pagesDone + action.pageNumbers.length, rawText };
    }
    case 'STAGE1_DONE':
      return { ...state, status: 'awaiting_approval', kind: action.kind, rawText: action.text, warnings: action.warnings };
    case 'APPROVE':
      return { ...state, status: 'structuring', results: [], skipReasons: [], failedChunks: 0, skippedTotal: 0 };
    case 'CHUNK_START':
      return { ...state, status: 'structuring', totalChunks: action.totalChunks };
    case 'MCQS':
      return {
        ...state,
        chunksDone: state.chunksDone + 1,
        mcqCount: state.mcqCount + action.items.length,
        skippedTotal: state.skippedTotal + action.skipped,
        skipReasons: [...state.skipReasons, ...action.skipReasons],
        results: [...state.results, ...action.items],
      };
    case 'CHUNK_ERROR':
      return { ...state, chunksDone: state.chunksDone + 1, failedChunks: state.failedChunks + 1 };
    case 'DONE':
      return {
        ...state,
        status: 'done',
        mcqCount: action.totalMCQs,
        failedChunks: action.failedChunks,
        skippedTotal: action.skippedTotal,
        totalChunks: action.totalChunks,
      };
    case 'ERROR':
      return { ...state, status: 'error', errorMsg: action.message };
    case 'ABORTED':
      return { ...state, status: 'aborted' };
    case 'DISCARD':
      return IDLE_STATE;
    case 'TICK':
      return { ...state, elapsed: action.elapsed };
    default:
      return state;
  }
}

function buildHeaders() {
  const activeProvider = (localStorage.getItem('mcqgen.provider') as 'gemini' | 'openrouter') || 'gemini';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-ai-provider': activeProvider,
  };
  if (activeProvider === 'gemini') {
    headers['x-gemini-key'] = (localStorage.getItem('mcqgen.geminiKey') || '').trim();
  } else {
    headers['x-openrouter-key'] = (localStorage.getItem('mcqgen.openrouterKey') || '').trim();
    headers['x-openrouter-model'] = localStorage.getItem('mcqgen.openrouterModel') || 'google/gemini-2.5-flash';
  }
  return headers;
}

async function consumeStream(
  response: Response,
  dispatch: React.Dispatch<Action>,
  abort: AbortController,
): Promise<void> {
  if (!response.ok || !response.body) {
    let errText = 'Failed to reach the AI pipeline.';
    try {
      const errData = await response.json();
      errText = errData?.error || errText;
    } catch {
      try {
        const bodyText = await response.text();
        if (/PayloadTooLarge|entity too large|request entity too large/i.test(bodyText)) {
          errText = 'Uploaded file is too large. Try a smaller file or split the PDF into parts.';
        }
      } catch {
        /* ignore unreadable body */
      }
    }
    throw new Error(errText);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let done = false;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    buffer += decoder.decode(value, { stream: !readerDone });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIdx).trim();
      buffer = buffer.slice(newlineIdx + 1);
      if (!line) continue;

      let event: any;
      try {
        event = JSON.parse(line);
      } catch {
        continue;
      }

      switch (event.type) {
        case 'stage1_start':
          dispatch({ type: 'STAGE1_START', kind: event.kind, sourceName: event.sourceName, pageCount: event.pageCount });
          break;
        case 'stage1_raster':
          dispatch({ type: 'STAGE1_RASTER', pageNumber: event.pageNumber });
          break;
        case 'stage1_page':
          dispatch({ type: 'STAGE1_PAGE', pageNumbers: event.pageNumber, text: event.text });
          break;
        case 'stage1_done':
          dispatch({ type: 'STAGE1_DONE', kind: event.kind, text: event.text, warnings: event.warnings || [] });
          break;
        case 'chunk_start':
          dispatch({ type: 'CHUNK_START', totalChunks: event.totalChunks });
          break;
        case 'mcqs':
          dispatch({ type: 'MCQS', items: event.items || [], skipped: event.skipped || 0, skipReasons: event.skipReasons || [] });
          break;
        case 'chunk_error':
          dispatch({ type: 'CHUNK_ERROR' });
          break;
        case 'done':
          dispatch({
            type: 'DONE',
            totalMCQs: event.totalMCQs,
            failedChunks: event.failedChunks,
            totalChunks: event.totalChunks,
            skippedTotal: event.skippedTotal,
          });
          break;
        case 'error':
          throw new Error(event.message);
        default:
          break;
      }
    }
  }

  if (abort.signal.aborted) {
    dispatch({ type: 'ABORTED' });
  }
}

export interface IngestionContextValue {
  state: IngestionState;
  startExtract: (job: IngestionJob) => Promise<void>;
  approve: () => Promise<void>;
  cancel: () => void;
  discard: () => void;
}

const IngestionContext = createContext<IngestionContextValue | null>(null);

export const IngestionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, IDLE_STATE);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (state.status !== 'extracting' && state.status !== 'structuring') return;
    const startedAt = state.startedAt || Date.now();
    const timer = setInterval(() => {
      dispatch({ type: 'TICK', elapsed: Math.floor((Date.now() - startedAt) / 1000) });
    }, 1000);
    return () => clearInterval(timer);
  }, [state.status, state.startedAt]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const startExtract = useCallback(async (job: IngestionJob) => {
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;
    dispatch({ type: 'START_EXTRACT', job, sourceName: job.fileName || job.mimeType?.split('/')[1] || 'pasted text' });
    try {
      const response = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: buildHeaders(),
        signal: abort.signal,
        body: JSON.stringify({
          promptText: job.promptText || undefined,
          mimeType: job.mimeType || undefined,
          fileBase64: job.fileBase64 || undefined,
          fileName: job.fileName || undefined,
        }),
      });
      await consumeStream(response, dispatch, abort);
    } catch (err: any) {
      if (err?.name === 'AbortError' || abort.signal.aborted) {
        dispatch({ type: 'ABORTED' });
      } else {
        dispatch({ type: 'ERROR', message: err?.message || 'Failed to extract text from the document.' });
      }
    }
  }, []);

  const approve = useCallback(async () => {
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;
    dispatch({ type: 'APPROVE' });
    try {
      const response = await fetch('/api/ai/structure', {
        method: 'POST',
        headers: buildHeaders(),
        signal: abort.signal,
        body: JSON.stringify({ text: state.rawText }),
      });
      await consumeStream(response, dispatch, abort);
    } catch (err: any) {
      if (err?.name === 'AbortError' || abort.signal.aborted) {
        dispatch({ type: 'ABORTED' });
      } else {
        dispatch({ type: 'ERROR', message: err?.message || 'Failed to structure MCQs from the extracted text.' });
      }
    }
  }, [state.rawText]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: 'ABORTED' });
  }, []);

  const discard = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: 'DISCARD' });
  }, []);

  return (
    <IngestionContext.Provider value={{ state, startExtract, approve, cancel, discard }}>
      {children}
    </IngestionContext.Provider>
  );
};

export function useIngestion(): IngestionContextValue {
  const ctx = useContext(IngestionContext);
  if (!ctx) throw new Error('useIngestion must be used within IngestionProvider');
  return ctx;
}

export function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
