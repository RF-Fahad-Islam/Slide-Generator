import React from 'react';
import { Check } from 'lucide-react';
import { MathText } from '../MathText';
import { MCQOption } from '../../types';

interface ReactionOptionCardProps {
  option: MCQOption;
  emoji: string;
  badgeColor: string;
  badgeLabel: string;
  isCorrect: boolean;
  highlightCorrect: boolean;
}

export const ReactionOptionCard: React.FC<ReactionOptionCardProps> = ({
  option,
  emoji,
  badgeColor,
  badgeLabel,
  isCorrect,
  highlightCorrect,
}) => {
  const highlighted = highlightCorrect && isCorrect;
  return (
    <div
      className={`relative bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 shadow-lg border-2 transition-all ${
        highlighted ? 'border-emerald-400 ring-4 ring-emerald-400/30' : 'border-transparent'
      }`}
    >
      <span
        className="absolute -top-2.5 -left-2.5 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shadow-md border-2 border-white"
        style={{ backgroundColor: badgeColor }}
      >
        {badgeLabel}
      </span>
      {highlighted && (
        <span className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-md">
          <Check className="w-4 h-4 text-white stroke-[3]" />
        </span>
      )}
      <span className="text-3xl leading-none">{emoji}</span>
      <span className="text-sm sm:text-base font-bold text-slate-800 text-center leading-snug">
        <MathText text={option.text} />
      </span>
    </div>
  );
};
