import React, { useState, useRef } from 'react';
import { MCQItem } from '../types';
import { Sparkles, Upload, FileText, AlertCircle, CheckCircle2, Loader2, Edit3, KeyRound, Wand2, X, ScanText, Hash, Layers } from 'lucide-react';

interface AIUploaderProps {
  onAddMCQs: (items: MCQItem[]) => void;
  onReviewMCQs?: (items: MCQItem[]) => void;
  appTheme?: 'dark' | 'light';
}

type StreamEvent =
  | { type: 'stage1_start'; kind: 'text' | 'vision'; sourceName: string; pageCount: number }
  | { type: 'stage1_page'; pageNumber: number[]; text: string }
  | { type: 'stage1_done'; kind: 'text' | 'vision'; text: string; warnings: string[]; totalChars: number }
  | { type: 'chunk_start'; chunkIndex: number; totalChunks: number; approxTokens: number }
  | { type: 'mcqs'; chunkIndex: number; items: MCQItem[]; skipped: number; skipReasons: string[] }
  | { type: 'chunk_error'; chunkIndex: number; message: string }
  | { type: 'done'; totalMCQs: number; failedChunks: number; totalChunks: number; skippedTotal: number }
  | { type: 'error'; message: string };

interface StreamState {
  status: 'idle' | 'stage1' | 'chunking' | 'done' | 'error' | 'aborted';
  kind: 'text' | 'vision';
  sourceName: string;
  pageCount: number;
  pagesDone: number;
  totalChunks: number;
  chunksDone: number;
  failedChunks: number;
  skippedTotal: number;
  mcqCount: number;
  warnings: string[];
  skipReasons: string[];
}

const IDLE_STREAM: StreamState = {
  status: 'idle',
  kind: 'text',
  sourceName: '',
  pageCount: 0,
  pagesDone: 0,
  totalChunks: 0,
  chunksDone: 0,
  failedChunks: 0,
  skippedTotal: 0,
  mcqCount: 0,
  warnings: [],
  skipReasons: [],
};

export const AIUploader: React.FC<AIUploaderProps> = ({
  onAddMCQs,
  onReviewMCQs,
  appTheme = 'dark',
}) => {
  const isAppLight = appTheme === 'light';
  const storedProvider = (localStorage.getItem('mcqgen.provider') as 'gemini' | 'openrouter') || 'gemini';
  const storedModel = localStorage.getItem('mcqgen.openrouterModel') || 'google/gemini-2.5-flash';
  const hasAnyKey = !!(
    (localStorage.getItem('mcqgen.geminiKey') || '').trim() ||
    (localStorage.getItem('mcqgen.openrouterKey') || '').trim()
  );
  const [promptText, setPromptText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<MCQItem[] | null>(null);
  const [stream, setStream] = useState<StreamState>(IDLE_STREAM);
  const [stage1Text, setStage1Text] = useState<string | null>(null);
  const [showStage1Preview, setShowStage1Preview] = useState<boolean>(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        if (result) {
          const base64Data = result.split(',')[1];
          setFileBase64(base64Data);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setStream((s) => ({ ...s, status: 'aborted' }));
  };

  const handleRunAI = async () => {
    if (!promptText.trim() && !fileBase64) {
      setErrorMsg('Please paste text or attach a file/PDF to parse.');
      return;
    }

    const abort = new AbortController();
    abortRef.current = abort;

    setErrorMsg(null);
    setParsedResult(null);
    setStage1Text(null);
    setShowStage1Preview(false);
    setStream({ ...IDLE_STREAM, status: 'stage1' });

    try {
      const activeProvider = (localStorage.getItem('mcqgen.provider') as 'gemini' | 'openrouter') || 'gemini';
      const storedGeminiKey = localStorage.getItem('mcqgen.geminiKey') || '';
      const storedOpenrouterKey = localStorage.getItem('mcqgen.openrouterKey') || '';
      const storedOpenrouterModel = localStorage.getItem('mcqgen.openrouterModel') || 'google/gemini-2.5-flash';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-ai-provider': activeProvider,
      };

      if (activeProvider === 'gemini') {
        if (!storedGeminiKey.trim()) {
          throw new Error('No Gemini API Key found. Add one in the Keys tab first.');
        }
        headers['x-gemini-key'] = storedGeminiKey.trim();
      } else {
        if (!storedOpenrouterKey.trim()) {
          throw new Error('No OpenRouter API Key found. Add one in the Keys tab first.');
        }
        headers['x-openrouter-key'] = storedOpenrouterKey.trim();
        headers['x-openrouter-model'] = storedOpenrouterModel;
      }

      const response = await fetch('/api/ai/parse-mcqs', {
        method: 'POST',
        headers,
        signal: abort.signal,
        body: JSON.stringify({
          promptText: promptText || undefined,
          mimeType: file?.type || undefined,
          fileBase64: fileBase64 || undefined,
          fileName: file?.name || undefined,
        }),
      });

      if (!response.ok || !response.body) {
        let errText = 'Failed to parse questions with AI.';
        try {
          const errData = await response.json();
          errText = errData?.error || errText;
        } catch {
          /* ignore non-JSON error body */
        }
        throw new Error(errText);
      }

      // Consume NDJSON stream line-by-line for live output.
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accItems: MCQItem[] = [];
      let accStage1 = '';
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

          let event: StreamEvent;
          try {
            event = JSON.parse(line) as StreamEvent;
          } catch {
            continue;
          }

          if (event.type === 'stage1_start') {
            setStream((s) => ({ ...s, kind: event.kind, sourceName: event.sourceName, pageCount: event.pageCount }));
          } else if (event.type === 'stage1_page') {
            setStream((s) => ({ ...s, pagesDone: s.pagesDone + event.pageNumber.length, status: 'stage1' }));
            const label = event.pageNumber.length > 1
              ? `Pages ${event.pageNumber.join(', ')}`
              : `Page ${event.pageNumber[0]}`;
            accStage1 = `${accStage1}\n\n[${label}]\n${event.text}`.trim();
            setStage1Text(accStage1);
          } else if (event.type === 'stage1_done') {
            setStream((s) => ({
              ...s,
              warnings: event.warnings || [],
              status: 'chunking',
              kind: event.kind,
            }));
            if (event.text) {
              accStage1 = event.text;
              setStage1Text(event.text);
            }
          } else if (event.type === 'chunk_start') {
            setStream((s) => ({ ...s, totalChunks: event.totalChunks, status: 'chunking' }));
          } else if (event.type === 'mcqs') {
            accItems = [...accItems, ...event.items];
            setStream((s) => ({
              ...s,
              chunksDone: s.chunksDone + 1,
              mcqCount: s.mcqCount + event.items.length,
              skippedTotal: s.skippedTotal + event.skipped,
              skipReasons: [...s.skipReasons, ...(event.skipReasons || [])],
            }));
            setParsedResult(accItems);
          } else if (event.type === 'chunk_error') {
            setStream((s) => ({
              ...s,
              chunksDone: s.chunksDone + 1,
              failedChunks: s.failedChunks + 1,
            }));
          } else if (event.type === 'done') {
            setStream((s) => ({
              ...s,
              mcqCount: event.totalMCQs,
              failedChunks: event.failedChunks,
              skippedTotal: event.skippedTotal,
              totalChunks: event.totalChunks,
              status: 'done',
            }));
            if (accItems.length > 0) setParsedResult(accItems);
          } else if (event.type === 'error') {
            throw new Error(event.message);
          }
        }
      }

      if (abort.signal.aborted) {
        setStream((s) => ({ ...s, status: 'aborted' }));
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || abort.signal.aborted) {
        setStream((s) => ({ ...s, status: 'aborted' }));
      } else {
        setErrorMsg(err.message || 'An unexpected error occurred during AI parsing.');
        setStream((s) => ({ ...s, status: 'error' }));
      }
    } finally {
      abortRef.current = null;
    }
  };

  const handleLoadParsedDirect = () => {
    if (parsedResult && parsedResult.length > 0) {
      onAddMCQs(parsedResult);
      setParsedResult(null);
      setPromptText('');
      setFile(null);
      setFileBase64(null);
      setStream(IDLE_STREAM);
    }
  };

  const handleSendToReview = () => {
    if (parsedResult && parsedResult.length > 0) {
      if (onReviewMCQs) {
        onReviewMCQs(parsedResult);
      } else {
        onAddMCQs(parsedResult);
      }
      setParsedResult(null);
      setPromptText('');
      setFile(null);
      setFileBase64(null);
      setStream(IDLE_STREAM);
    }
  };

  const isProcessing = stream.status === 'stage1' || stream.status === 'chunking';

  const overallPercent = (() => {
    if (stream.status === 'stage1') {
      return stream.pageCount > 0 ? Math.round((stream.pagesDone / stream.pageCount) * 100) : 0;
    }
    if (stream.status === 'chunking') {
      return stream.totalChunks > 0 ? Math.round((stream.chunksDone / stream.totalChunks) * 100) : 0;
    }
    return 0;
  })();

  return (
    <div
      className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-8 lg:p-10 border ${
        isAppLight
          ? 'border-slate-200'
          : 'bg-slate-900/80 border-slate-800'
      }`}
    >
      <div className={`flex items-center gap-4 pb-6 border-b mb-8 ${isAppLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
        <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25">
          <Sparkles className="w-8 h-8 stroke-[2.5]" />
        </div>
        <div>
          <h2 className={`text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-3 ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
            AI Automated MCQ Ingestion
            <span className={`text-xs px-3 py-1 rounded-full font-mono font-black uppercase border ${
              isAppLight
                ? 'bg-amber-100 text-amber-700 border-amber-300'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              OCR-first Bangla
            </span>
          </h2>
          <p className={`text-sm mt-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Big PDFs/DOCX/raw text are extracted locally and streamed to slides live. Bangla scans run high-accuracy per-page OCR.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left Column: Input Form */}
        <div className="flex flex-col gap-6">
          {/* AI Provider / Key Status (from Keys tab) */}
          <div
            className={`p-4 rounded-2xl border text-sm flex items-start gap-3 ${
              isAppLight
                ? 'bg-amber-50/70 border-amber-200'
                : 'bg-slate-950/60 border-amber-500/20'
            }`}
          >
            <div className={`p-2 rounded-xl shrink-0 ${isAppLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/10 text-amber-400'}`}>
              <KeyRound className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className={`font-black text-xs uppercase tracking-wider ${isAppLight ? 'text-amber-700' : 'text-amber-400'}`}>
                AI Provider: {storedProvider === 'gemini' ? 'Google Gemini' : 'OpenRouter'}
              </p>
              <p className={`mt-1 text-xs leading-relaxed ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {hasAnyKey ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    API key connected from the Keys tab. {storedProvider === 'gemini' ? 'Uses ' : 'Uses model '}
                    <code className={`px-1 py-0.5 rounded font-mono text-[10px] ${isAppLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-900 text-slate-300'}`}>
                      {storedProvider === 'gemini' ? 'gemini-2.5-flash' : storedModel || 'google/gemini-2.5-flash'}
                    </code>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    No API key saved yet. Add one in the Keys tab to enable AI parsing.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Text Input */}
          <div>
            <label className={`block text-sm font-extrabold mb-2.5 ${isAppLight ? 'text-slate-800' : 'text-slate-300'}`}>
              Paste Raw Question Text or Exam Content:
            </label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Paste raw unformatted exam text, notes, or math formulas here..."
              className={`w-full h-48 p-4 rounded-2xl border focus:outline-none focus:border-amber-500 text-sm leading-relaxed resize-none transition-all ${
                isAppLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  : 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600'
              }`}
            />
          </div>

          {/* Fatty File Upload Zone */}
          <div>
            <label className={`block text-sm font-extrabold mb-2.5 ${isAppLight ? 'text-slate-800' : 'text-slate-300'}`}>
              Or Attach Question Paper (PDF, DOCX, TXT, PNG, JPG):
            </label>
            <div
              className={`relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-3 transition-all text-center cursor-pointer group ${
                isAppLight
                  ? 'bg-slate-50/80 border-slate-300 hover:border-amber-500 hover:bg-amber-50/60 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 hover:border-amber-500/50 hover:bg-slate-950'
              }`}
            >
              <input
                type="file"
                accept=".pdf,image/*,.txt,.doc,.docx"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className={`p-4 rounded-2xl bg-amber-500/10 group-hover:scale-110 transition-transform ${isAppLight ? 'text-amber-700' : 'text-amber-400'}`}>
                <Upload className="w-8 h-8" />
              </div>
              {file ? (
                <div>
                  <p className={`text-base font-black ${isAppLight ? 'text-amber-700' : 'text-amber-400'}`}>{file.name}</p>
                  <p className={`text-xs font-mono mt-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Document'}
                  </p>
                </div>
              ) : (
                <div>
                  <p className={`text-base font-black ${isAppLight ? 'text-slate-900' : 'text-white'}`}>Click to browse or drag & drop file</p>
                  <p className={`text-xs font-medium mt-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Text-layer docs parsed locally; scanned Bangla papers use high-accuracy per-page vision OCR
                  </p>
                </div>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-sm font-semibold flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isProcessing ? (
            <button
              onClick={handleCancel}
              className="w-full py-4 text-base rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-500 font-black flex items-center justify-center gap-2 cursor-pointer hover:bg-rose-500/20 transition-all"
            >
              <X className="w-5 h-5" />
              <span>Cancel Processing</span>
            </button>
          ) : (
            <button
              onClick={handleRunAI}
              disabled={isProcessing}
              className="btn-fatty-primary w-full py-4 text-base rounded-2xl"
            >
              {stream.status === 'done' || stream.status === 'aborted' || stream.status === 'error' ? (
                <>
                  <Sparkles className="w-5 h-5 fill-slate-950" />
                  <span>Process Another Document with AI</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 fill-slate-950" />
                  <span>Process Document with AI</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Right Column: Live AI Extraction Results */}
        <div
          className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-8 border flex flex-col justify-between ${
            isAppLight
              ? 'border-slate-200'
              : 'bg-slate-950/80 border-slate-800'
          }`}
        >
          <div>
            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Live Parsed Output</span>
              {parsedResult && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-mono">
                  {parsedResult.length} MCQs Identified
                </span>
              )}
            </h3>

            {/* Live streaming status bar */}
            {isProcessing && (
              <div className={`mb-4 p-4 rounded-2xl border ${isAppLight ? 'bg-slate-50/60 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${isAppLight ? 'text-amber-600' : 'text-amber-400'}`}>
                    {stream.status === 'stage1' ? (
                      <>
                        <ScanText className="w-3.5 h-3.5" />
                        {stream.kind === 'vision' ? `Stage 1 · Vision OCR — Page ${stream.pagesDone}/${stream.pageCount}` : 'Stage 1 · Local Text Extraction'}
                      </>
                    ) : (
                      <>
                        <Layers className="w-3.5 h-3.5" />
                        Stage 2 · Structuring — Chunk {Math.min(stream.chunksDone + 1, stream.totalChunks)}/{stream.totalChunks}
                      </>
                    )}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{overallPercent}%</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isAppLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
                    style={{ width: `${overallPercent}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-emerald-500">
                    <Hash className="w-3 h-3" /> {stream.mcqCount} MCQs so far
                  </span>
                  {stream.failedChunks > 0 && (
                    <span className="text-rose-400">{stream.failedChunks} chunk(s) failed</span>
                  )}
                  {stream.skippedTotal > 0 && (
                    <span className="text-amber-500">{stream.skippedTotal} skipped</span>
                  )}
                </div>
              </div>
            )}

            {/* Per-chunk skip reasons (stay visible after processing) */}
            {stream.skipReasons.length > 0 && (
              <div className={`mb-4 p-3 rounded-2xl border text-[11px] ${isAppLight ? 'bg-amber-50/50 border-amber-200 text-slate-600' : 'bg-slate-900/60 border-slate-800 text-slate-400'}`}>
                <p className={`font-black uppercase tracking-wider mb-1.5 text-[10px] ${isAppLight ? 'text-amber-700' : 'text-amber-400'}`}>
                  Items Skipped ({stream.skippedTotal})
                </p>
                <div className="space-y-0.5">
                  {stream.skipReasons.map((r, i) => (
                    <p key={i} className="leading-snug">— {r}</p>
                  ))}
                </div>
              </div>
            )}

            {stream.status === 'aborted' && (
              <div className="mb-4 p-4 rounded-2xl bg-slate-500/10 border border-slate-400/30 text-slate-500 text-sm font-semibold flex items-center gap-3">
                <X className="w-5 h-5 shrink-0" />
                <span>Processing cancelled. {parsedResult?.length ? `Partial results (${parsedResult.length} MCQs) are ready.` : 'No results were kept.'}</span>
              </div>
            )}

            {/* Scanned / legacy-encoded document warning */}
            {stream.status !== 'idle' && stream.warnings.length > 0 && (
              <div className={`mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-sm font-semibold flex items-start gap-3 ${isAppLight ? 'text-amber-700' : 'text-amber-400'}`}>
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div className="space-y-1">
                  {stream.warnings.map((w, i) => (
                    <p key={i} className="leading-snug">{w}</p>
                  ))}
                </div>
              </div>
            )}

            {!parsedResult && !isProcessing && stream.status === 'idle' && (
              <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-5">
                {/* Mock: OCR-first extraction pipeline preview */}
                <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl text-left">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                      <ScanText className="w-3.5 h-3.5" /> Stage 1 · Bangla OCR / Local Extract
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">big-doc.pdf</span>
                  </div>
                  {/* Mock scanned question paper page */}
                  <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <div className="h-1.5 w-2/3 rounded bg-slate-700" />
                    <div className="h-1.5 w-full rounded bg-slate-700" />
                    <div className="h-1.5 w-5/6 rounded bg-slate-700" />
                    <div className="flex gap-1.5 pt-1">
                      <div className="flex-1 h-1.5 rounded bg-slate-800" />
                      <div className="flex-1 h-1.5 rounded bg-slate-800" />
                      <div className="flex-1 h-1.5 rounded bg-slate-800" />
                      <div className="flex-1 h-1.5 rounded bg-amber-500/60" />
                    </div>
                    <div className="pt-1 space-y-1">
                      <div className="h-px w-1/2 bg-gradient-to-r from-amber-500/80 to-transparent" />
                      <div className="h-px w-2/3 bg-gradient-to-r from-amber-500/80 to-transparent" />
                    </div>
                  </div>
                  <div className="my-3 flex items-center gap-2">
                    <div className="flex-1 h-px bg-gradient-to-r from-amber-500/60 to-transparent" />
                    <Wand2 className="w-4 h-4 text-amber-400" />
                    <div className="flex-1 h-px bg-gradient-to-l from-emerald-500/60 to-transparent" />
                  </div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Stage 2 · Structuring (chunked, live)
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">4 MCQs</span>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1.5">
                    <div className="h-2 w-3/4 rounded bg-slate-200/80" />
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <div className="h-2 rounded bg-slate-800" />
                      <div className="h-2 rounded bg-slate-800" />
                      <div className="h-2 rounded bg-slate-800" />
                      <div className="h-2 rounded bg-emerald-500/60" />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-300">No items processed yet.</p>
                  <p className="text-xs mt-1 text-slate-400 max-w-[240px]">
                    Upload a PDF or paste text on the left. Results stream in live as each chunk completes.
                  </p>
                </div>
              </div>
            )}

            {stage1Text && (
              <div className="mb-4">
                <button
                  onClick={() => setShowStage1Preview(!showStage1Preview)}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer mb-2"
                >
                  {showStage1Preview ? 'Hide Stage 1 Extracted Text' : 'Inspect Stage 1 Extracted Text ↗'}
                </button>
                {showStage1Preview && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {stage1Text}
                  </div>
                )}
              </div>
            )}

            {parsedResult && parsedResult.length > 0 && (
              <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                {parsedResult.map((mcq, idx) => (
                  <div
                    key={mcq.id || idx}
                    className={`p-4 rounded-xl border text-xs ${
                      isAppLight
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-amber-500 mb-1">
                      <span>
                        Q{idx + 1}: {mcq.stem.substring(0, 45)}...
                      </span>
                      {mcq.confidence === 'low' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
                          Review Needed
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1 font-mono">
                      {mcq.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={opt.isCorrect ? 'text-emerald-500 font-bold' : 'text-slate-400'}
                        >
                          {opt.key}: {opt.text} {opt.isCorrect && '✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {parsedResult && parsedResult.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={handleSendToReview}
                className="w-full py-3.5 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-110 cursor-pointer"
              >
                <Edit3 className="w-5 h-5" />
                <span>Review & Edit in Question Creator ({parsedResult.length} MCQs) →</span>
              </button>
              <button
                onClick={handleLoadParsedDirect}
                className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border cursor-pointer ${
                  isAppLight
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Directly Load into Deck (Skip Review)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
