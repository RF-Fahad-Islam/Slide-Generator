import React from 'react';
import { PlusCircle, ArrowRight } from 'lucide-react';

interface AddQuestionsBannerProps {
  onClick: () => void;
  count: number;
  appTheme?: 'dark' | 'light';
}

// Wide green "Add Questions" banner that opens the source-chooser modal
// (Question Bank / Manual Editor / Question Creator Form). Shared between the
// Slide Studio deck panel and the Question Bank page.
export const AddQuestionsBanner: React.FC<AddQuestionsBannerProps> = ({
  onClick,
  count,
  appTheme = 'dark',
}) => {
  const isAppLight = appTheme === 'light';

  return (
    <button
      onClick={onClick}
      data-tour="bank-import"
      className={`w-full rounded-3xl border shadow-2xl p-4 sm:p-5 flex items-center justify-between gap-4 transition-all cursor-pointer group hover:-translate-y-0.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 border-emerald-400 text-slate-950 hover:shadow-emerald-500/30 ${
        isAppLight ? 'shadow-emerald-500/20' : ''
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <span className="p-3 rounded-2xl bg-slate-950/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
          <PlusCircle className="w-6 h-6 stroke-[2.5]" />
        </span>
        <div className="text-left min-w-0">
          <div className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
            Add Questions
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-950 text-emerald-300">
              {count} in deck
            </span>
          </div>
          <div className="text-xs sm:text-sm font-semibold text-slate-900/70 truncate">
            Question Bank · Manual Editor · Question Creator Form
          </div>
        </div>
      </div>
      <span className="shrink-0 px-4 py-2 rounded-xl bg-slate-950 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-transform group-hover:translate-x-1">
        Choose Source <ArrowRight className="w-4 h-4" />
      </span>
    </button>
  );
};
