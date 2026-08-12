import React, { useState } from 'react';
import { useExportQueue, ExportTask } from '../context/ExportQueueContext';
import { Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp, X, Download, Presentation, FileText, FileArchive, FileJson, Trash2 } from 'lucide-react';

interface ExportQueueWidgetProps {
  appTheme?: 'dark' | 'light';
}

export const ExportQueueWidget: React.FC<ExportQueueWidgetProps> = ({ appTheme = 'dark' }) => {
  const isAppLight = appTheme === 'light';
  const { tasks, activeTask, cancelTask, removeTask, clearCompleted } = useExportQueue();
  const [isExpanded, setIsExpanded] = useState(false);

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

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end max-w-sm w-full animate-fadeIn pointer-events-auto">
      {/* Collapsed Bar / Trigger Pill */}
      <div
        className={`w-full flex items-center justify-between gap-3 p-3 rounded-2xl border shadow-xl backdrop-blur-xl transition-all cursor-pointer ${
          isAppLight
            ? 'bg-white/90 border-slate-200 text-slate-900 shadow-slate-200/50 hover:bg-slate-50'
            : 'bg-slate-900/90 border-slate-800 text-white shadow-black/60 hover:bg-slate-900'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {activeTask ? (
            <div className="relative flex items-center justify-center shrink-0">
              <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
            </div>
          ) : completedTasks.length > 0 ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black truncate">
                {activeTask
                  ? activeTask.title
                  : completedTasks.length > 0
                  ? `${completedTasks.length} Download${completedTasks.length === 1 ? '' : 's'} Ready`
                  : 'Export Queue'}
              </span>
              {activeTask && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-extrabold font-mono shrink-0 border border-amber-500/30">
                  {activeTask.progress}%
                </span>
              )}
            </div>
            <p className={`text-[11px] truncate mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {activeTask
                ? activeTask.progressMsg
                : queuedTasks.length > 0
                ? `${queuedTasks.length} queued...`
                : 'Click to view history'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {activeTask && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                cancelTask(activeTask.id);
              }}
              title="Cancel Export"
              className={`p-1.5 rounded-lg transition-colors ${
                isAppLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            className={`p-1.5 rounded-lg transition-colors ${
              isAppLight ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Popover Details */}
      {isExpanded && (
        <div
          className={`mt-2 w-full rounded-2xl border shadow-2xl backdrop-blur-2xl p-4 space-y-3 max-h-[70vh] overflow-y-auto animate-modal-card ${
            isAppLight ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/40' : 'bg-slate-900/95 border-slate-800 text-white shadow-black/80'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Export Queue ({tasks.length})</h4>
            {completedTasks.length > 0 && (
              <button
                onClick={clearCompleted}
                className="text-[11px] font-bold text-amber-500 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Clear Done
              </button>
            )}
          </div>

          {/* Active Task Card */}
          {activeTask && (
            <div className={`p-3 rounded-xl border space-y-2 ${
              isAppLight ? 'bg-amber-50/80 border-amber-200' : 'bg-amber-500/10 border-amber-500/30'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {getTaskIcon(activeTask.type)}
                  <span className="text-xs font-bold truncate">{activeTask.title}</span>
                </div>
                <button
                  onClick={() => cancelTask(activeTask.id)}
                  className="text-rose-400 hover:text-rose-300 text-[11px] font-bold shrink-0"
                >
                  Cancel
                </button>
              </div>

              <div className="w-full bg-slate-800/40 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${activeTask.progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="truncate">{activeTask.progressMsg}</span>
                <span className="font-extrabold text-amber-400 shrink-0">{activeTask.progress}%</span>
              </div>
            </div>
          )}

          {/* Queued Tasks */}
          {queuedTasks.map((t, idx) => (
            <div
              key={t.id}
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 shrink-0">
                  #{idx + 1}
                </span>
                {getTaskIcon(t.type)}
                <div className="min-w-0">
                  <p className="font-bold truncate">{t.title}</p>
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
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                isAppLight ? 'bg-emerald-50/60 border-emerald-200' : 'bg-emerald-950/30 border-emerald-500/30'
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
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                isAppLight ? 'bg-rose-50/60 border-rose-200' : 'bg-rose-950/30 border-rose-500/30'
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
  );
};
