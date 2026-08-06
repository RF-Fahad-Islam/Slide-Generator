import React from 'react';
import { MCQItem } from '../../types';
import { MathText } from '../MathText';
import { NavArrowButton } from './NavArrowButton';
import { ReactionOptionCard } from './ReactionOptionCard';
import { ReactionEmojiSet, REACTION_ORDER, REACTION_BADGE_COLORS } from './types';

interface QuizTimeCardProps {
  item: MCQItem;
  aspectClass: string;
  brandName: string;
  logoUrl?: string;
  titleText: string;
  ctaText: string;
  subCtaText: string;
  showAnswerKey: boolean;
  reactionEmojis: ReactionEmojiSet;
  fontFamily?: string;
}

// "Quiz Time" reaction-post template — dark navy/gold branded card with a
// 2x2 emoji-reaction answer grid (engagement-bait format: viewers react with
// the emoji matching their chosen option instead of the answer being shown).
export const QuizTimeCard = React.forwardRef<HTMLDivElement, QuizTimeCardProps>(
  ({ item, aspectClass, brandName, logoUrl, titleText, ctaText, subCtaText, showAnswerKey, reactionEmojis, fontFamily }, ref) => {
    const words = titleText.trim().split(/\s+/).filter(Boolean);
    const lastWord = words.pop() || 'Time';
    const leadWords = words.join(' ') || 'Quiz';
    const options = item.options.slice(0, 4);

    return (
      <div
        ref={ref}
        style={{ fontFamily: fontFamily || "'Kalpurush', serif" }}
        className={`w-full mx-auto ${aspectClass} rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden select-none flex flex-col bg-gradient-to-br from-[#0b1130] via-[#141b45] to-[#1c1454]`}
      >
        <NavArrowButton direction="left" />
        <NavArrowButton direction="right" />

        {/* Brand header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between gap-3 relative z-[1]">
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] text-slate-300/70 uppercase">
              {brandName || 'Your Brand'} Presents
            </p>
            <h2 className="text-2xl sm:text-3xl font-black leading-none tracking-tight drop-shadow">
              <span className="text-white">{leadWords} </span>
              <span className="text-amber-400">{lastWord}</span>
            </h2>
          </div>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-11 h-11 rounded-full object-cover border-2 border-white/20 shadow shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-white font-black text-sm shrink-0">
              {brandName ? brandName.charAt(0).toUpperCase() : 'Q'}
            </div>
          )}
        </div>
        <div className="h-[3px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        {/* Question stem */}
        <div className="px-6 pt-5 relative z-[1]">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl px-5 py-4 text-center">
            <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
              <MathText text={item.stem} />
            </p>
          </div>
        </div>

        {/* 2x2 reaction option grid */}
        <div className="px-6 pt-5 grid grid-cols-2 gap-3 relative z-[1]">
          {options.map((opt, i) => {
            const letter = REACTION_ORDER[i];
            if (!letter) return null;
            const isCorrect = !!opt.isCorrect || opt.key === item.answer;
            return (
              <ReactionOptionCard
                key={opt.key}
                option={opt}
                emoji={reactionEmojis[letter]}
                badgeColor={REACTION_BADGE_COLORS[letter]}
                badgeLabel={letter}
                isCorrect={isCorrect}
                highlightCorrect={showAnswerKey}
              />
            );
          })}
        </div>

        {/* CTA footer */}
        <div className="mt-auto px-6 pt-5 pb-3 text-center relative z-[1]">
          <p className="text-amber-400 font-black text-sm sm:text-base leading-snug">{ctaText}</p>
        </div>
        <div className="bg-slate-950/70 border-t border-white/10 py-2.5 text-center relative z-[1]">
          <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase">{subCtaText}</p>
        </div>
      </div>
    );
  }
);
QuizTimeCard.displayName = 'QuizTimeCard';
