import React from 'react';
import { useIngestion, formatElapsed } from '../ingestion/ingestionStore';
import { ScanText, Layers, X, CheckCircle2, AlertCircle, Hash, Copy, ClipboardCheck } from 'lucide-react';

interface IngestionToastProps {
  appTheme?: 'dark' | 'light';
}

export const IngestionToast: React.FC<IngestionToastProps> = ({ appTheme = 'dark' }) => {
  const { state, cancel, discard, approve } = useIngestion();
  const isAppLight = appTheme === 'light';
  const [copied, setCopied] = React.useState(false);

  const copyRawText = async () => {
    try {
      await navigator.clipboard.writeText(state.rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  const { status } = state;
  if (status === 'idle') return null;

  const isBusy = status === 'extracting' || status === 'structuring';

  const overallPercent = (() => {
    if (status === 'extracting') {
      if (state.kind === 'vision' && state.pageCount > 0) {
        return Math.round((state.rasterDone / state.pageCount) * 100);
      }
      return state.pageCount > 0 ? Math.round((state.pagesDone / state.pageCount) * 100) : 0;
    }
    if (status === 'structuring') {
      return state.totalChunks > 0 ? Math.round((state.chunksDone / state.totalChunks) * 100) : 0;
    }
    return 100;
  })();

  const phaseLabel = (() => {
    if (status === 'extracting') {
      if (state.kind === 'vision') {
        if (state.rasterDone > 0 && state.rasterDone < state.pageCount) {
          return `OCR-prep · Rasterizing ${state.rasterDone}/${state.pageCount} pages`;
        }
        return `Stage 1 · OCR Page ${state.pagesDone}/${state.pageCount}`;
      }
      return 'Stage 1 · Extracting Text';
    }
    if (status === 'awaiting_approval') return 'Stage 1 done — review text';
    if (status === 'structuring') {
      return `Stage 2 · Chunk ${Math.min(state.chunksDone + 1, state.totalChunks)}/${state.totalChunks}`;
    }
    if (status === 'done') return `Done — ${state.mcqCount} MCQs`;
    if (status === 'error') return 'Failed';
    return 'Cancelled';
  })();

  const containerAccent = (() => {
    if (status === 'done') return 'emerald';
    if (status === 'error') return 'rose';
    if (status === 'aborted') return 'slate';
    return 'amber';
  })();

  const borderClass =
    isAppLight
      ? 'border-slate-200 shadow-xl'
      : 'border-slate-800 shadow-2xl';

  const accentBarClass =
    containerAccent === 'emerald'
      ? isAppLight ? 'bg-emerald-500' : 'bg-emerald-400'
      : containerAccent === 'rose'
        ? isAppLight ? 'bg-rose-500' : 'bg-rose-400'
        : containerAccent === 'slate'
          ? 'bg-slate-400'
          : 'bg-gradient-to-r from-amber-500 to-amber-300';

  return (
    <div className="fixed bottom-4 right-4 z-[9998] w-[340px] max-w-[calc(100vw-2rem)]">
      <div
        role="status"
        aria-live="polite"
        className={`rounded-3xl border overflow-hidden ${
          isAppLight ? 'bg-white' : 'bg-slate-900'
        } ${borderClass}`}
      >
        <div className={`h-1 ${accentBarClass}`} />

        <div className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-2 rounded-xl shrink-0 ${
                isAppLight
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-amber-500/10 text-amber-400'
              }`}>
                {status === 'extracting' || status === 'awaiting_approval' ? (
                  <ScanText className="w-4 h-4" />
                ) : status === 'structuring' ? (
                  <Layers className="w-4 h-4" />
                ) : status === 'done' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : status === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-black uppercase tracking-wider truncate ${
                  isAppLight ? 'text-slate-900' : 'text-white'
                }`}>
                  {phaseLabel}
                </p>
                <p className={`text-[11px] font-mono truncate mt-0.5 ${
                  isAppLight ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {state.sourceName || 'AI Ingestion'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className={`text-xs font-mono font-bold px-2 py-1 rounded-lg ${
                isAppLight
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-slate-950 text-slate-300'
              }`}>
                {formatElapsed(state.elapsed)}
              </span>
              <button
                onClick={discard}
                title="Dismiss"
                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                  isAppLight
                    ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                    : 'text-slate-500 hover:text-white hover:bg-slate-800'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Progress bar for busy states */}
          {isBusy && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-mono ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {overallPercent}%
                </span>
                <span className={`text-[10px] font-mono ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {state.mcqCount} MCQs
                </span>
              </div>
              <div className={`h-1.5 rounded-full overflow-hidden ${isAppLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Awaiting approval — approve gate */}
          {status === 'awaiting_approval' && (
            <div className={`p-2.5 rounded-xl border text-[11px] leading-snug ${
              isAppLight
                ? 'bg-amber-50 border-amber-200 text-slate-700'
                : 'bg-slate-950/60 border-amber-500/30 text-slate-300'
            }`}>
              <span className="font-black uppercase tracking-wider text-[10px] block mb-1 text-amber-600">
                {state.kind === 'vision' ? 'Raw OCR text ready' : 'Raw text extracted'}
              </span>
              <p className="flex items-start gap-1">
                <Hash className="w-3 h-3 mt-0.5 shrink-0" />
                <span>
                  {state.rawText.length.toLocaleString()} chars extracted. Review in the AI tab, then approve AI parsing, copy it, or discard.
                </span>
              </p>
            </div>
          )}

          {/* Error / aborted / done footers */}
          {status === 'error' && (
            <div className={`p-2.5 rounded-xl border text-[11px] leading-snug ${
              isAppLight
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {state.errorMsg || 'Processing failed.'}
            </div>
          )}
          {status === 'aborted' && (
            <div className={`p-2.5 rounded-xl border text-[11px] leading-snug ${
              isAppLight
                ? 'bg-slate-50 border-slate-200 text-slate-600'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              Processing cancelled. {state.mcqCount > 0 ? `${state.mcqCount} MCQs were kept.` : 'No results kept.'}
            </div>
          )}
          {status === 'done' && (
            <div className={`p-2.5 rounded-xl border text-[11px] leading-snug flex items-center gap-2 ${
              isAppLight
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>
                {state.mcqCount} MCQs structured{state.failedChunks > 0 ? ` · ${state.failedChunks} chunk(s) failed` : ''}
                {state.skippedTotal > 0 ? ` · ${state.skippedTotal} skipped` : ''}. Load them from the AI tab.
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isBusy && (
              <button
                onClick={cancel}
                className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border cursor-pointer transition-all ${
                  isAppLight
                    ? 'bg-rose-50 border-rose-300 text-rose-600 hover:bg-rose-100'
                    : 'bg-rose-500/10 border-rose-500/40 text-rose-400 hover:bg-rose-500/20'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            )}
            {status === 'awaiting_approval' && (
              <>
                <button
                  onClick={copyRawText}
                  className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border cursor-pointer transition-all ${
                    isAppLight
                      ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                  title="Copy the extracted raw text"
                >
                  {copied ? <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={approve}
                  className="flex-1 py-2 rounded-xl text-xs font-black bg-amber-500 text-slate-950 flex items-center justify-center gap-1.5 shadow-lg hover:brightness-110 cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve & Parse
                </button>
                <button
                  onClick={discard}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                    isAppLight
                      ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Discard
                </button>
              </>
            )}
            {(status === 'done' || status === 'error' || status === 'aborted') && (
              <button
                onClick={discard}
                className="flex-1 py-2 rounded-xl text-xs font-black border cursor-pointer transition-all"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
