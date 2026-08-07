import React from 'react';
import { X, Database, PenTool, Edit3, ArrowUpRight, Plus, CheckCircle2 } from 'lucide-react';

interface AddQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFromQuestionBank: () => void;
  onFromManualEditor: () => void;
  onFromQuestionForm: () => void;
  appTheme?: 'dark' | 'light';
}

// Beautiful "Add Questions" chooser opened from the wide button in Slide Studio.
// Three source cards with mini mockups: Question Bank / Manual Editor /
// Question Creator Form — each navigates to its tool or opens the form.
export const AddQuestionsModal: React.FC<AddQuestionsModalProps> = ({
  isOpen,
  onClose,
  onFromQuestionBank,
  onFromManualEditor,
  onFromQuestionForm,
  appTheme = 'dark',
}) => {
  if (!isOpen) return null;
  const isAppLight = appTheme === 'light';

  const cardClass = (active: boolean) =>
    `group relative text-left p-5 rounded-3xl border transition-all cursor-pointer flex flex-col gap-4 ${
      active
        ? isAppLight
          ? 'bg-white border-slate-200 shadow-lg hover:border-amber-400 hover:shadow-amber-500/10'
          : 'bg-slate-900 border-slate-800 shadow-lg hover:border-amber-500/50 hover:shadow-amber-500/10'
        : isAppLight
        ? 'bg-white border-slate-200 shadow-lg hover:border-amber-400 hover:shadow-amber-500/10'
        : 'bg-slate-900 border-slate-800 shadow-lg hover:border-amber-500/50 hover:shadow-amber-500/10'
    }`;

  const iconTileClass = `p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25 w-fit`;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md ${
        isAppLight ? 'bg-black/40' : 'bg-black/80'
      }`}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-4xl border rounded-3xl overflow-hidden shadow-2xl ${
          isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b ${
          isAppLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className={`text-lg font-black ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                Add Questions
              </h3>
              <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Choose how you want to bring MCQs into your deck
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
              isAppLight
                ? 'bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 source cards with mockups */}
        <div className="p-5 sm:p-7 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">

          {/* CARD 1 — Question Bank */}
          <button type="button" onClick={onFromQuestionBank} className={cardClass(false)}>
            {/* Mockup: mini question-bank list */}
            <div className={`rounded-2xl border p-3 space-y-1.5 ${isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Database className="w-3 h-3 text-slate-950" />
                </div>
                <div className="h-2 flex-1 rounded-full bg-slate-400/40" />
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="h-2 rounded-full bg-slate-400/25 w-4/5" />
              <div className="h-2 rounded-full bg-slate-400/20 w-3/5" />
              <div className="h-2 rounded-full bg-slate-400/20 w-2/3" />
            </div>
            <div className="flex items-center gap-3">
              <div className={iconTileClass}>
                <Database className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <h4 className={`text-sm font-black ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                  From Question Bank
                </h4>
                <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Browse saved questions by subject, board &amp; type
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-black mt-auto ${isAppLight ? 'text-amber-600' : 'text-amber-400'}`}>
              Open Question Bank <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </button>

          {/* CARD 2 — Manual Editor */}
          <button type="button" onClick={onFromManualEditor} className={cardClass(false)}>
            {/* Mockup: bulk paste textarea with lines */}
            <div className={`rounded-2xl border p-3 font-mono space-y-1.5 text-[9px] ${isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <div className="flex items-center gap-1">
                <span className="text-amber-500">১.</span>
                <span className={`h-1.5 flex-1 rounded-full ${isAppLight ? 'bg-slate-300' : 'bg-slate-700'}`} />
              </div>
              <div className="flex items-center gap-1 pl-3">
                <span className="text-slate-400">ক)</span>
                <span className={`h-1.5 w-3/5 rounded-full ${isAppLight ? 'bg-slate-200' : 'bg-slate-800'}`} />
              </div>
              <div className="flex items-center gap-1 pl-3">
                <span className="text-slate-400">খ)</span>
                <span className={`h-1.5 w-1/2 rounded-full ${isAppLight ? 'bg-slate-200' : 'bg-slate-800'}`} />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-amber-500">২.</span>
                <span className={`h-1.5 flex-1 rounded-full ${isAppLight ? 'bg-slate-300' : 'bg-slate-700'}`} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={iconTileClass}>
                <PenTool className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <h4 className={`text-sm font-black ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                  From Manual Editor
                </h4>
                <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Paste bulk Bangla text or import a CSV in one go
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-black mt-auto ${isAppLight ? 'text-amber-600' : 'text-amber-400'}`}>
              Open Bulk Editor <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </button>

          {/* CARD 3 — Question Creator Form */}
          <button type="button" onClick={onFromQuestionForm} className={cardClass(false)}>
            {/* Mockup: single-question form */}
            <div className={`rounded-2xl border p-3 space-y-2 ${isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
              <div className={`h-2 rounded-full w-full ${isAppLight ? 'bg-slate-300' : 'bg-slate-700'}`} />
              <div className="grid grid-cols-2 gap-1.5">
                <div className={`h-4 rounded-lg border flex items-center justify-center text-[8px] font-bold ${isAppLight ? 'bg-white border-slate-200 text-slate-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>ক)</div>
                <div className={`h-4 rounded-lg border flex items-center justify-center text-[8px] font-bold ${isAppLight ? 'bg-amber-50 border-amber-300 text-amber-600' : 'bg-amber-500/10 border-amber-500/40 text-amber-400'}`}>খ)</div>
                <div className={`h-4 rounded-lg border flex items-center justify-center text-[8px] font-bold ${isAppLight ? 'bg-white border-slate-200 text-slate-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>গ)</div>
                <div className={`h-4 rounded-lg border flex items-center justify-center text-[8px] font-bold ${isAppLight ? 'bg-white border-slate-200 text-slate-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>ঘ)</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={iconTileClass}>
                <Edit3 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <h4 className={`text-sm font-black ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                  Question Creator Form
                </h4>
                <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Hand-write a single question step by step
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-black mt-auto ${isAppLight ? 'text-amber-600' : 'text-amber-400'}`}>
              Open Question Form <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
