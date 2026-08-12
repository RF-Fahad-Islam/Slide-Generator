import React from 'react';
import { Hash } from 'lucide-react';

export type QuestionNumberFormat = 'bangla' | 'english' | 'q_prefix';

interface QuestionNumberChangerProps {
  value: QuestionNumberFormat;
  onChange: (format: QuestionNumberFormat) => void;
  appTheme?: 'dark' | 'light';
  className?: string;
  label?: string;
}

export const QuestionNumberChanger: React.FC<QuestionNumberChangerProps> = ({
  value,
  onChange,
  appTheme = 'dark',
  className = '',
  label = 'Question Number Format',
}) => {
  const isLight = appTheme === 'light';

  const formats: { id: QuestionNumberFormat; label: string; preview: string }[] = [
    { id: 'bangla', label: 'Bangla (১, ২, ৩)', preview: '১, ২, ৩' },
    { id: 'english', label: 'English (1, 2, 3)', preview: '1, 2, 3' },
    { id: 'q_prefix', label: 'Prefix (Q1, Q2, Q3)', preview: 'Q1, Q2, Q3' },
  ];

  return (
    <div className={`space-y-2 select-none ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
            isLight ? 'text-slate-700' : 'text-amber-400'
          }`}>
            <Hash className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{label}</span>
          </label>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {formats.find((f) => f.id === value)?.preview || '১, ২, ৩'}
          </span>
        </div>
      )}

      {/* Segmented Control Tool design matching Answer Key / Bulk Tooling */}
      <div className={`p-1.5 rounded-2xl border grid grid-cols-3 gap-1.5 ${
        isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}>
        {formats.map((fmt) => {
          const isActive = value === fmt.id;
          return (
            <button
              key={fmt.id}
              type="button"
              onClick={() => onChange(fmt.id)}
              className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer border ${
                isActive
                  ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                  : isLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <span className="font-black text-sm tracking-wide">{fmt.preview}</span>
              <span className={`text-[9px] font-bold ${isActive ? 'text-slate-950/80' : 'text-slate-400'}`}>
                {fmt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
