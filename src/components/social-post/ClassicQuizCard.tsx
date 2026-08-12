import React from 'react';
import { CheckCircle2, User } from 'lucide-react';
import { MathText } from '../MathText';
import { DeckConfig, MCQItem, BgImageFit, getEffectiveBadgeTag } from '../../types';
import { resolveTheme } from '../../utils/themeResolver';

interface ClassicQuizCardProps {
  item: MCQItem;
  config: DeckConfig;
  customHeaderTitle: string;
  questionNumber: number;
  totalCount?: number;
  aspectClass: string;
  bgStyle: string;
  customBgImageUrl?: string;
  customBgImageFit?: BgImageFit;
  showAnswerKey: boolean;
  showExplanation: boolean;
  brandName?: string;
  logoUrl?: string;
  customStem?: string;
  customOptions?: { key: string; text: string; isCorrect?: boolean }[];
}

// The original branded quiz card layout — brand header, stem, stacked option
// grid, footer watermark. Extracted verbatim from SocialPostGenerator so it
// can sit alongside other selectable post templates.
export const ClassicQuizCard = React.forwardRef<HTMLDivElement, ClassicQuizCardProps>(
  (
    {
      item,
      config,
      customHeaderTitle,
      questionNumber,
      totalCount = 1,
      aspectClass,
      bgStyle,
      customBgImageUrl,
      customBgImageFit,
      showAnswerKey,
      showExplanation,
      brandName,
      logoUrl,
      customStem,
      customOptions,
    },
    ref
  ) => {
    const theme = resolveTheme(config);
    const activeBrand = brandName !== undefined ? brandName : (config.brandName || "NOBEL'S CLASSROOM");
    const activeLogo = logoUrl !== undefined ? logoUrl : config.logoUrl;
    const stemText = customStem !== undefined ? customStem : item.stem;
    const optionsList = customOptions && customOptions.length > 0 ? customOptions : item.options;

    const showBrandLogo = config.showBrandLogo !== false;
    const showPagingCounter = config.showPagingCounter !== false;
    const showQuestionNumber = config.showQuestionNumber !== false;
    const showInstructorInfo = config.showInstructorInfo !== false;

    return (
      <div
        ref={ref}
        style={{
          fontFamily: theme.fonts.defaultFont,
          ...(customBgImageUrl
            ? {
                backgroundImage: `url("${customBgImageUrl}")`,
                backgroundSize: customBgImageFit === 'contain' ? 'contain' : customBgImageFit === 'stretch' ? '100% 100%' : 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }
            : {}),
        }}
        className={`w-full mx-auto ${aspectClass} ${customBgImageUrl ? 'bg-slate-950 text-white' : bgStyle} rounded-3xl p-6 lg:p-8 shadow-2xl border border-slate-700/80 flex flex-col justify-between relative overflow-hidden select-none transition-all`}
      >
        {/* Top Brand Banner Bar */}
        <div className="flex items-center justify-between border-b border-white/15 pb-4 z-10">
          {showBrandLogo ? (
            <div className="flex items-center gap-3">
              {activeLogo ? (
                <img
                  src={activeLogo}
                  alt="Logo"
                  className="w-10 h-10 object-contain rounded-xl bg-black/20 p-1 border border-white/20"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
                  {activeBrand ? activeBrand.charAt(0).toUpperCase() : 'R'}
                </div>
              )}
              <div>
                <h3 className="text-sm font-black tracking-wide uppercase leading-tight drop-shadow-sm">
                  {activeBrand}
                </h3>
                <p className="text-xs font-bold text-amber-400 mt-0.5">
                  {customHeaderTitle || config.headerTitle || 'আজকের কুইজ'}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold text-amber-400">
                {customHeaderTitle || config.headerTitle || 'আজকের কুইজ'}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            {getEffectiveBadgeTag(config, item) && (
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                {getEffectiveBadgeTag(config, item)}
              </span>
            )}
            {showPagingCounter && (
              <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-slate-900/80 border border-white/20 text-amber-300 shrink-0">
                {questionNumber} / {totalCount}
              </span>
            )}
          </div>
        </div>

        {/* Question Stem Box */}
        <div className="my-auto py-4 space-y-4 z-10">
          {showQuestionNumber && (
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shadow">
                {questionNumber}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                প্রশ্নঃ
              </span>
            </div>
          )}

          <h2 className="text-lg sm:text-xl font-extrabold leading-relaxed text-white drop-shadow">
            <MathText text={stemText} />
          </h2>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {optionsList.map((opt) => {
              const isCorrect = showAnswerKey && (opt.isCorrect || opt.key.toLowerCase() === item.answer?.toLowerCase());
              return (
                <div
                  key={opt.key}
                  className={`p-3 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between transition-all ${
                    isCorrect
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg font-black'
                      : 'bg-white/10 border-white/15 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center font-mono ${
                      isCorrect ? 'bg-slate-950 text-amber-300 font-bold' : 'bg-white/15 text-white'
                    }`}>
                      {opt.key}
                    </span>
                    <span><MathText text={opt.text} /></span>
                  </div>
                  {isCorrect && <CheckCircle2 className="w-4 h-4 text-slate-950" />}
                </div>
              );
            })}
          </div>

          {/* Optional Explanation */}
          {showExplanation && item.explanation && (
            <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-xs text-amber-200 mt-2">
              <strong>ব্যাখ্যা:</strong> <MathText text={item.explanation} />
            </div>
          )}
        </div>

        {/* Footer Watermark Bar */}
        <div className="flex items-center justify-between border-t border-white/15 pt-3 text-xs font-bold z-10">
          {showInstructorInfo ? (
            <span className="flex items-center gap-1.5 text-slate-300">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>{config.watermarkHandle || 'Hasnat Shuvro'}</span>
            </span>
          ) : <span />}
          <span className="font-mono text-amber-400 font-extrabold tracking-widest uppercase">
            {config.footerTag || 'BIOMISSION'}
          </span>
        </div>
      </div>
    );
  }
);
ClassicQuizCard.displayName = 'ClassicQuizCard';
