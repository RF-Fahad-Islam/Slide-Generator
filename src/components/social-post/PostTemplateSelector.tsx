import React from 'react';
import { LayoutTemplate, Sparkles } from 'lucide-react';
import { PostTemplateId } from './types';

interface PostTemplateOption {
  id: PostTemplateId;
  name: string;
  description: string;
  swatchClass: string;
}

const POST_TEMPLATE_OPTIONS: PostTemplateOption[] = [
  {
    id: 'classic',
    name: 'Classic Quiz Card',
    description: 'Brand header, stem & option list',
    swatchClass: 'from-slate-950 to-amber-950',
  },
  {
    id: 'quiz_time',
    name: 'Quiz Time Reactions',
    description: '2x2 emoji-reaction answer grid',
    swatchClass: 'from-[#0b1130] via-[#141b45] to-[#1c1454]',
  },
];

interface PostTemplateSelectorProps {
  selected: PostTemplateId;
  onSelect: (id: PostTemplateId) => void;
  isAppLight: boolean;
}

export const PostTemplateSelector: React.FC<PostTemplateSelectorProps> = ({ selected, onSelect, isAppLight }) => {
  return (
    <div
      className={`p-5 rounded-2xl border space-y-4 ${
        isAppLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/60 border-slate-800'
      }`}
    >
      <label className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${
        isAppLight ? 'text-amber-600' : 'text-amber-400'
      }`}>
        <LayoutTemplate className="w-4 h-4" />
        1. Choose Post Template
      </label>
      <div className="grid grid-cols-2 gap-3">
        {POST_TEMPLATE_OPTIONS.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-2 cursor-pointer ${
                isSelected
                  ? isAppLight
                    ? 'bg-amber-50 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                    : 'bg-amber-500/10 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                  : isAppLight
                  ? 'bg-white border-slate-200 hover:bg-slate-100'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className={`h-12 w-full rounded-xl bg-gradient-to-br ${opt.swatchClass} flex items-center justify-center`}>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </span>
              <span className={`text-xs font-black ${isAppLight ? 'text-slate-800' : 'text-slate-100'}`}>{opt.name}</span>
              <span className={`text-[10px] leading-snug ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>{opt.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
