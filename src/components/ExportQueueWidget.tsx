import React, { useState } from 'react';
import { useExportQueue } from '../context/ExportQueueContext';
import { useIngestion } from '../ingestion/ingestionStore';
import { Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp, X, Download, Presentation, FileText, FileArchive, FileJson, Trash2, Layers } from 'lucide-react';

interface ExportQueueWidgetProps {
  appTheme?: 'dark' | 'light';
}

export const ExportQueueWidget: React.FC<{ appTheme?: 'dark' | 'light' }> = ({ appTheme = 'dark' }) => {
  const isAppLight = appTheme === 'light';
  const { tasks, activeTask, cancelTask, removeTask, clearCompleted } = useExportQueue();
  const [isExpanded, setIsExpanded] = useState(false);

  let isIngestionActive = false;
  try {
    const { state: ingestionState } = useIngestion();
    isIngestionActive = ingestionState.status !== 'idle';
  } catch {
    /* fallback if unmounted */
  }

  if (tasks.length === 0) return null;

  const queuedTasks = tasks.filter(t => t.status === 'queued');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const failedTasks = tasks.filter(t => t.status === 'failed' || t.status === 'cancelled');

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'pptx':
      case 'google_slides':
      case 'batch_pptx':
        return <Presentation className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'zip':
        return <FileArchive className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'json_deck':
      case 'json_mcqs':
        return <FileJson className="w-4 h-4 text-blue-400 shrink-0" />;
      default:
        return <Download className="w-4 h-4 text-amber-500 shrink-0" />;
    }
  };

  const containerAccent = activeTask
    ? 'amber'
    : completedTasks.length > 0
    ? 'emerald'
    : 'rose';

  const accentBarClass =
    containerAccent === 'emerald'
      ? isAppLight ? 'bg-emerald-500' : 'bg-emerald-400'
      : containerAccent === 'rose'
      ? isAppLight ? 'bg-rose-500' : 'bg-rose-400'
      : 'bg-gradient-to-r from-amber-500 to-amber-300';

  return (
    <div className={`fixed ${isIngestionActive ? 'bottom-[195px]' : 'bottom-4'} right-4 z-[9999] w-[340px] max-w-[calc(100vw-2rem)] flex flex-col items-end pointer-events-auto transition-all duration-300`}>
      {/* Toast Card (AI Ingestion style) */}
      <div
        className={`w-full rounded-3xl border overflow-hidden shadow-2xl backdrop-blur-xl transition-all animate-toast-in ${
          isAppLight ? 'bg-white border-slate-200 shadow-slate-300/50' : 'bg-slate-900 border-slate-800 shadow-black/80'
        }`}
      >
        {/* Top Accent / Progress Line */}
        <div className={`h-1 ${accentBarClass}`} />

        {/* Card Header & Compact State */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div
              className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className={`p-2 rounded-xl shrink-0 ${
                isAppLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {activeTask ? (
                  <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                ) : completedTasks.length > 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500" />
                )}
              </div>

              <div className="min-w-0">
                <p className={`text-xs font-black uppercase tracking-wider truncate ${
                  isAppLight ? 'text-slate-900' : 'text-white'
                }`}>
                  {activeTask
                    ? activeTask.title
                    : completedTasks.length > 0
                    ? `${completedTasks.length} Download${completedTasks.length === 1 ? '' : 's'} Ready`
                    : 'Export Queue'}
                </p>
                <p className={`text-[11px] font-mono truncate mt-0.5 ${
                  isAppLight ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {activeTask
                    ? activeTask.progressMsg
                    : queuedTasks.length > 0
                    ? `${queuedTasks.length} queued in background`
                    : 'Click to expand queue'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {activeTask ? (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {activeTask.progress}%
                </span>
              ) : (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg ${
                  isAppLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-950 text-slate-300'
                }`}>
                  {tasks.length} Job{tasks.length === 1 ? '' : 's'}
                </span>
              )}

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`p-1.5 rounded-lg cursor-pointer btn-icon ${
                  isAppLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-500 hover:text-white hover:bg-slate-800'
                }`}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>

              {activeTask && (
                <button
                  onClick={() => cancelTask(activeTask.id)}
                  title="Cancel Export"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Active Task Progress Bar */}
          {activeTask && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="truncate">{activeTask.progressMsg}</span>
                <span className="font-extrabold text-amber-400">{activeTask.progress}%</span>
              </div>
              <div className={`h-1.5 rounded-full overflow-hidden ${isAppLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
                  style={{ width: `${activeTask.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Expanded Queue History Details */}
        {isExpanded && (
          <div className={`p-4 border-t space-y-3 max-h-[50vh] overflow-y-auto ${
            isAppLight ? 'border-slate-200 bg-slate-50/60' : 'border-slate-800 bg-slate-950/60'
          }`}>
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Queue Tasks ({tasks.length})</h4>
              {completedTasks.length > 0 && (
                <button
                  onClick={clearCompleted}
                  className="text-[11px] font-bold text-amber-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear Done
                </button>
              )}
            </div>

            {/* Queued Tasks */}
            {queuedTasks.map((t, idx) => (
              <div
                key={t.id}
                className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 text-xs ${
                  isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 shrink-0">
                    #{idx + 1}
                  </span>
                  {getTaskIcon(t.type)}
                  <div className="min-w-0">
                    <p className="font-bold truncate text-slate-200">{t.title}</p>
                    <p className="text-[10px] text-slate-500 truncate">Queued in background</p>
                  </div>
                </div>
                <button
                  onClick={() => removeTask(t.id)}
                  className="p-1 text-slate-500 hover:text-slate-300 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Completed Tasks */}
            {completedTasks.map(t => (
              <div
                key={t.id}
                className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 text-xs ${
                  isAppLight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-emerald-950/30 border-emerald-500/30'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold truncate">{t.title}</p>
                    <p className="text-[10px] text-emerald-400 font-semibold truncate">{t.progressMsg}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeTask(t.id)}
                  className="p-1 text-slate-500 hover:text-slate-300 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Failed / Cancelled Tasks */}
            {failedTasks.map(t => (
              <div
                key={t.id}
                className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 text-xs ${
                  isAppLight ? 'bg-rose-50/70 border-rose-200' : 'bg-rose-950/30 border-rose-500/30'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold truncate">{t.title}</p>
                    <p className="text-[10px] text-rose-400 font-semibold truncate">
                      {t.errorMsg || t.progressMsg}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeTask(t.id)}
                  className="p-1 text-slate-500 hover:text-slate-300 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
