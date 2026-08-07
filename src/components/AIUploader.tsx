import React, { useState } from 'react';
import { MCQItem } from '../types';
import { useIngestion } from '../ingestion/ingestionStore';
import { Sparkles, Upload, FileText, AlertCircle, CheckCircle2, Edit3, KeyRound, X, ScanText, Hash, Layers, Copy, ClipboardCheck, Database } from 'lucide-react';

interface AIUploaderProps {
  onAddMCQs: (items: MCQItem[]) => void;
  onReviewMCQs?: (items: MCQItem[]) => void;
  onImportToQuestionBank?: (items: MCQItem[]) => Promise<boolean>;
  appTheme?: 'dark' | 'light';
}

export const AIUploader: React.FC<AIUploaderProps> = ({
  onAddMCQs,
  onReviewMCQs,
  onImportToQuestionBank,
  appTheme = 'dark',
}) => {
  const isAppLight = appTheme === 'light';
  const { state, startExtract, approve, cancel, discard } = useIngestion();
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
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 75 * 1024 * 1024) {
        setFile(null);
        setFileBase64(null);
        setErrorMsg('File is too large (max ~75 MB). Try a smaller file or split the PDF into parts.');
        return;
      }
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

  const handleRunExtract = async () => {
    if (!promptText.trim() && !fileBase64) {
      setErrorMsg('Please paste text or attach a file/PDF to parse.');
      return;
    }
    if (!hasAnyKey) {
      setErrorMsg('No API key saved yet. Add one in the Keys tab first.');
      return;
    }
    setErrorMsg(null);
    await startExtract({
      promptText,
      fileBase64,
      mimeType: file?.type,
      fileName: file?.name,
    });
  };

  const handleCopyRawText = async () => {
    try {
      await navigator.clipboard.writeText(state.rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  const isProcessing = state.status === 'extracting' || state.status === 'structuring';

  const overallPercent = (() => {
    if (state.status === 'extracting') {
      if (state.kind === 'vision' && state.pageCount > 0) {
        return Math.round((state.rasterDone / state.pageCount) * 100);
      }
      return state.pageCount > 0 ? Math.round((state.pagesDone / state.pageCount) * 100) : 0;
    }
    if (state.status === 'structuring') {
      return state.totalChunks > 0 ? Math.round((state.chunksDone / state.totalChunks) * 100) : 0;
    }
    return 0;
  })();

  const liveRawText = state.rawText;
  const parsedResult = state.results;

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
            Big PDFs/DOCX/raw text are extracted locally and streamed to slides live. Bangla scans run high-accuracy per-page OCR. Raw text appears first — you approve before AI structuring.
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
              className={`w-full h-40 p-4 rounded-2xl border focus:outline-none focus:border-amber-500 text-sm leading-relaxed resize-none transition-all ${
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
                    Text-layer docs parsed locally; scanned Bangla papers use per-page vision OCR. Raw text streams in live before AI parsing.
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
              onClick={cancel}
              className="w-full py-4 text-base rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-500 font-black flex items-center justify-center gap-2 cursor-pointer hover:bg-rose-500/20 transition-all"
            >
              <X className="w-5 h-5" />
              <span>Cancel Processing</span>
            </button>
          ) : (
            <button
              onClick={handleRunExtract}
              disabled={state.status === 'awaiting_approval'}
              className="btn-fatty-primary w-full py-4 text-base rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.status === 'awaiting_approval' ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Text Extracted — Approve Below or Start Over</span>
                </>
              ) : state.status === 'done' || state.status === 'aborted' || state.status === 'error' ? (
                <>
                  <Sparkles className="w-5 h-5 fill-slate-950" />
                  <span>Process Another Document with AI</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 fill-slate-950" />
                  <span>Extract Raw Text with AI</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Right Column: Live Extraction + Approve Gate + Results */}
        <div
          className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-8 border flex flex-col justify-between ${
            isAppLight
              ? 'border-slate-200'
              : 'bg-slate-950/80 border-slate-800'
          }`}
        >
          <div>
            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Live Extraction & Output</span>
              {parsedResult && parsedResult.length > 0 && (
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
                    {state.status === 'extracting' ? (
                      <>
                        <ScanText className="w-3.5 h-3.5" />
                        {state.kind === 'vision' ? (
                          state.rasterDone > 0 && state.rasterDone < state.pageCount
                            ? `Stage 1 · Rasterizing ${state.rasterDone}/${state.pageCount} pages`
                            : `Stage 1 · Vision OCR — Page ${state.pagesDone}/${state.pageCount}`
                        ) : 'Stage 1 · Local Text Extraction'}
                      </>
                    ) : (
                      <>
                        <Layers className="w-3.5 h-3.5" />
                        Stage 2 · Structuring — Chunk {Math.min(state.chunksDone + 1, state.totalChunks)}/{state.totalChunks}
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
                    <Hash className="w-3 h-3" /> {state.mcqCount} MCQs so far
                  </span>
                  {state.failedChunks > 0 && (
                    <span className="text-rose-400">{state.failedChunks} chunk(s) failed</span>
                  )}
                  {state.skippedTotal > 0 && (
                    <span className="text-amber-500">{state.skippedTotal} skipped</span>
                  )}
                </div>
              </div>
            )}

            {/* Approve gate — Stage 1 finished, ask before AI parsing */}
            {state.status === 'awaiting_approval' && (
              <div className={`mb-4 p-4 rounded-2xl border ${isAppLight ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-900/60 border-amber-500/30'}`}>
                <p className={`font-black uppercase tracking-wider text-xs mb-2 flex items-center gap-1.5 ${isAppLight ? 'text-amber-700' : 'text-amber-400'}`}>
                  <FileText className="w-4 h-4" />
                  Stage 1 Complete — {state.rawText.length.toLocaleString()} chars extracted
                </p>
                <p className={`text-xs leading-relaxed mb-3 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Review the raw text below, then choose. Bangla conjuncts, numerals and LaTeX are preserved.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={approve}
                    className="flex-1 min-w-[180px] py-3 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-110 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Approve & Run AI Parsing</span>
                  </button>
                  <button
                    onClick={handleCopyRawText}
                    className={`py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border cursor-pointer transition-all ${
                      isAppLight
                        ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {copied ? <ClipboardCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Text'}
                  </button>
                  <button
                    onClick={discard}
                    className={`py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border cursor-pointer transition-all ${
                      isAppLight
                        ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <X className="w-4 h-4" />
                    Close & Discard
                  </button>
                </div>
              </div>
            )}

            {/* Raw text pane — auto-open while extracting or awaiting approval */}
            {(state.status === 'extracting' || state.status === 'awaiting_approval') && (
              <div className={`mb-4 p-4 rounded-2xl border ${isAppLight ? 'bg-slate-50/60 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                <p className={`text-[10px] font-black uppercase tracking-wider mb-2 flex items-center justify-between ${isAppLight ? 'text-amber-600' : 'text-amber-400'}`}>
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {state.status === 'extracting' ? 'Raw Text — Streaming Live' : 'Raw Extracted Text'}
                  </span>
                  <span className="font-mono text-slate-500">{liveRawText.length.toLocaleString()} chars</span>
                </p>
                <div
                  className={`p-3 rounded-xl border text-[11px] font-mono max-h-56 overflow-y-auto whitespace-pre-wrap ${
                    isAppLight
                      ? 'bg-white border-slate-200 text-slate-800'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  {liveRawText || (
                    <span className="text-slate-500">
                      {state.kind === 'vision'
                        ? 'Waiting for OCR… pages will appear here as each batch completes.'
                        : 'Waiting for text extraction…'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Warnings */}
            {state.status !== 'idle' && state.warnings.length > 0 && (
              <div className={`mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-sm font-semibold flex items-start gap-3 ${isAppLight ? 'text-amber-700' : 'text-amber-400'}`}>
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div className="space-y-1">
                  {state.warnings.map((w, i) => (
                    <p key={i} className="leading-snug">{w}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Aborted */}
            {state.status === 'aborted' && (
              <div className="mb-4 p-4 rounded-2xl bg-slate-500/10 border border-slate-400/30 text-slate-500 text-sm font-semibold flex items-center gap-3">
                <X className="w-5 h-5 shrink-0" />
                <span>Processing cancelled. {state.results.length ? `Partial results (${state.results.length} MCQs) are ready.` : 'No results were kept.'}</span>
              </div>
            )}

            {/* Error */}
            {state.status === 'error' && (
              <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-sm font-semibold flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                <span>{state.errorMsg}</span>
              </div>
            )}

            {/* Empty state */}
            {!parsedResult.length && !isProcessing && state.status === 'idle' && (
              <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-5">
                <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl text-left">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                      <ScanText className="w-3.5 h-3.5" /> Stage 1 · Bangla OCR / Local Extract
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">big-doc.pdf</span>
                  </div>
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
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <div className="flex-1 h-px bg-gradient-to-l from-emerald-500/60 to-transparent" />
                  </div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Stage 2 · Approve then structure
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">N MCQs</span>
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
                    Upload a PDF or paste text on the left. Raw text streams in live first — you approve before AI structuring.
                  </p>
                </div>
              </div>
            )}

            {/* Parsed MCQs */}
            {parsedResult.length > 0 && (
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

          {parsedResult.length > 0 && state.status === 'done' && (
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => {
                  if (onReviewMCQs) {
                    onReviewMCQs(parsedResult);
                  } else {
                    onAddMCQs(parsedResult);
                  }
                  discard();
                }}
                className="w-full py-3.5 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-110 cursor-pointer"
              >
                <Edit3 className="w-5 h-5" />
                <span>Review & Edit in Question Creator ({parsedResult.length} MCQs) →</span>
              </button>
              <button
                onClick={() => {
                  onAddMCQs(parsedResult);
                  discard();
                }}
                className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border cursor-pointer ${
                  isAppLight
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Directly Load into Deck (Skip Review)</span>
              </button>
              {onImportToQuestionBank && (
                <button
                  onClick={async () => {
                    const saved = await onImportToQuestionBank(parsedResult);
                    if (saved) discard();
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border cursor-pointer ${
                    isAppLight
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>Save to Question Bank ({parsedResult.length} MCQs)</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
