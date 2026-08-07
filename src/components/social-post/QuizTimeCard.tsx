import React from 'react';
import { MCQItem, BgImageFit } from '../../types';
import { MathText } from '../MathText';
import { ReactionOptionCard } from './ReactionOptionCard';
import { ReactionEmojiSet, REACTION_ORDER, REACTION_BADGE_COLORS } from './types';

interface QuizTimeCardProps {
  item: MCQItem;
  aspectClass: string;
  bgStyle?: string;
  customBgImageUrl?: string;
  customBgImageFit?: BgImageFit;
  brandName: string;
  logoUrl?: string;
  titleText: string;
  ctaText: string;
  subCtaText: string;
  showAnswerKey: boolean;
  reactionEmojis: ReactionEmojiSet;
  fontFamily?: string;
  customStem?: string;
  customOptions?: { key: string; text: string; isCorrect?: boolean }[];
}

// "Quiz Time" reaction-post template — dark navy/gold or custom theme branded card
// with a 2x2 emoji-reaction answer grid (engagement-bait format).
export const QuizTimeCard = React.forwardRef<HTMLDivElement, QuizTimeCardProps>(
  (
    {
      item,
      aspectClass,
      bgStyle,
      customBgImageUrl,
      customBgImageFit,
      brandName,
      logoUrl,
      titleText,
      ctaText,
      subCtaText,
      showAnswerKey,
      reactionEmojis,
      fontFamily,
      customStem,
      customOptions,
    },
    ref
  ) => {
    const rawTitle = titleText.trim() || 'Quiz Time';
    const words = rawTitle.split(/\s+/).filter(Boolean);
    const lastWord = words.length > 1 ? words.pop()! : words[0] || 'Time';
    const leadWords = words.length > 1 ? words.join(' ') : (rawTitle.length > 10 ? '' : '');
    const stemText = customStem !== undefined ? customStem : item.stem;
    const optionsList = customOptions && customOptions.length > 0 ? customOptions.slice(0, 4) : item.options.slice(0, 4);

    const isLightBg = bgStyle?.includes('clean_light') || bgStyle?.includes('text-slate-950');
    const defaultBgClass = 'bg-gradient-to-br from-[#0b1130] via-[#141b45] to-[#1c1454] text-white';
    const cardBgClass = customBgImageUrl ? 'bg-slate-950 text-white' : (bgStyle || defaultBgClass);

    return (
      <div
        ref={ref}
        style={{
          fontFamily: fontFamily || "'Kalpurush', serif",
          ...(customBgImageUrl
            ? {
                backgroundImage: `url("${customBgImageUrl}")`,
                backgroundSize: customBgImageFit === 'contain' ? 'contain' : customBgImageFit === 'stretch' ? '100% 100%' : 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }
            : {}),
        }}
        className={`w-full mx-auto ${aspectClass} rounded-3xl shadow-2xl border ${
          isLightBg ? 'border-slate-300' : 'border-white/10'
        } relative overflow-hidden select-none flex flex-col ${cardBgClass} transition-all`}
      >
        {/* Brand header bar */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between gap-3 relative z-[1]">
          <div>
            <p className={`text-[10px] font-bold tracking-[0.25em] uppercase ${
              isLightBg ? 'text-slate-600' : 'text-slate-300/70'
            }`}>
              {brandName || 'Your Brand'} Presents
            </p>
            <h2 className="text-2xl sm:text-3xl font-black leading-none tracking-tight drop-shadow">
              {leadWords ? (
                <>
                  <span className={isLightBg ? 'text-slate-900' : 'text-white'}>{leadWords} </span>
                  <span className="text-amber-500">{lastWord}</span>
                </>
              ) : (
                <span className="text-amber-500">{rawTitle}</span>
              )}
            </h2>
          </div>

          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="w-12 h-12 rounded-2xl object-contain border-2 border-white/20 shadow shrink-0 bg-black/30 p-1"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 border-2 border-amber-300 flex items-center justify-center font-black text-base shadow shrink-0">
              {brandName ? brandName.charAt(0).toUpperCase() : 'Q'}
            </div>
          )}
        </div>

        <div className={`h-[3px] ${isLightBg ? 'bg-amber-400' : 'bg-gradient-to-r from-transparent via-amber-400 to-transparent'}`} />

        {/* Question stem container */}
        <div className="px-6 pt-5 relative z-[1]">
          <div className={`border rounded-2xl px-5 py-4 text-center ${
            isLightBg ? 'bg-white/80 border-slate-300/80 shadow-sm' : 'bg-slate-900/60 border-white/10'
          }`}>
            <p className={`text-sm sm:text-base font-semibold leading-relaxed ${
              isLightBg ? 'text-slate-900' : 'text-white'
            }`}>
              <MathText text={stemText} />
            </p>
          </div>
        </div>

        {/* 2x2 reaction option grid */}
        <div className="px-6 pt-5 grid grid-cols-2 gap-3 relative z-[1]">
          {optionsList.map((opt, i) => {
            const letter = REACTION_ORDER[i];
            if (!letter) return null;
            const isCorrect = !!opt.isCorrect || opt.key.toLowerCase() === item.answer?.toLowerCase();
            return (
              <ReactionOptionCard
                key={opt.key || letter}
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
          <p className="text-amber-400 font-black text-sm sm:text-base leading-snug drop-shadow-sm">{ctaText}</p>
        </div>

        {/* Comment prompt footer bar */}
        <div className={`py-2.5 text-center relative z-[1] border-t ${
          isLightBg ? 'bg-slate-200/80 border-slate-300' : 'bg-slate-950/70 border-white/10'
        }`}>
          <p className={`text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase ${
            isLightBg ? 'text-slate-700' : 'text-slate-400'
          }`}>{subCtaText}</p>
        </div>
      </div>
    );
  }
);
QuizTimeCard.displayName = 'QuizTimeCard';
