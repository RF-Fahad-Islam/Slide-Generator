import React, { forwardRef } from 'react';
import { DeckConfig, MCQItem, getSourceTags, getEffectiveBadgeTag } from '../types';
import { hasAnswerDisplayStyle } from '../utils/answerSlides';
import { resolveTheme } from '../utils/themeResolver';
import { formatSlideQNumber } from '../utils/slideTextBoxes';
import { SlideTextBoxLayer } from './SlideTextBoxLayer';
import { MathText } from './MathText';
import { Check, Award, BookOpen, User, Sparkles } from 'lucide-react';

interface SlideCanvasProps {
  item: MCQItem;
  config: DeckConfig;
  currentIndex: number;
  totalCount: number;
  isAnswerRevealMode?: boolean;
  // 'answer' renders a dedicated answer slide (correct option highlighted +
  // visible "উত্তর" label + explanation). Defaults to 'question'.
  slideVariant?: 'question' | 'answer';
  scale?: number; // CSS scale transform for viewport scaling
  // Export override — when provided (true/false) it forces the explanation box
  // on/off regardless of config/answer-variant. Undefined keeps default behavior.
  forceShowExplanation?: boolean;
  // 'backgroundOnly' renders just the background stack (gradient/color, bg
  // image, readability tint, ambient glows) with no header/content/footer/text
  // boxes — used by PPTX export to rasterize an exact background picture layer
  // that is then layered under native editable text/shape layers.
  mode?: 'full' | 'backgroundOnly';
}

export const SlideCanvas = forwardRef<HTMLDivElement, SlideCanvasProps>(({
  item,
  config,
  currentIndex,
  totalCount,
  isAnswerRevealMode = false,
  slideVariant = 'question',
  scale = 1,
  forceShowExplanation,
  mode = 'full',
}, ref) => {
  // Single authoritative theme resolution for colors, bg, fonts, and CSS vars
  const theme = resolveTheme(config, item.customConfig);
  const effectiveConfig: DeckConfig = {
    ...config,
    ...(item.customConfig || {}),
  };

  const template = theme.template;
  const styles = template.styles;
  const isLight = theme.isLight;
  const defaultFont = theme.fonts.defaultFont;
  const headerFont = theme.fonts.headerFont;
  const bodyFont = theme.fonts.bodyFont;
  const optionsFont = theme.fonts.optionsFont;
  const footerFont = theme.fonts.footerFont;

  // Font Size Mappings
  const headerSizeClass = {
    xs: 'text-xl',
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  }[effectiveConfig.headerFontSize || 'md'];

  const bodySizeClass = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
    '2xl': 'text-5xl',
    '3xl': 'text-6xl',
  }[effectiveConfig.bodyFontSize || 'lg'];

  const optionsSizeClass = {
    xs: 'text-lg',
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  }[effectiveConfig.optionsFontSize || 'md'];

  const footerSizeClass = {
    xs: 'text-lg',
    sm: 'text-xl',
    md: 'text-2xl',
  }[effectiveConfig.footerFontSize || 'sm'];

  // Font Weight Mappings
  const bodyWeightClass = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold',
  }[effectiveConfig.bodyFontWeight || 'extrabold'];

  const optionsWeightClass = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold',
  }[effectiveConfig.optionsFontWeight || 'extrabold'];

  // Question Alignment & Position Mappings
  const questionAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[effectiveConfig.questionAlignment || 'left'];

  const questionPosClass = {
    top: 'justify-start',
    center: 'justify-center',
  }[effectiveConfig.questionPosition || 'top'];

  // Options Layout (1col, 2col, 4col) & Alignment
  const optionsGridClass = {
    '1col': 'grid-cols-1 gap-3.5',
    '2col': 'grid-cols-2 gap-4',
    '4col': 'grid-cols-4 gap-3',
  }[effectiveConfig.optionsLayout || '2col'];

  const optionsAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[effectiveConfig.optionsAlignment || 'left'];

  // Header Mode Detection
  const isHeaderBannerMode = effectiveConfig.headerType === 'banner' || (effectiveConfig.useHeaderBanner && !!effectiveConfig.headerBannerUrl);

  // Enforce 16:9 canvas dimensions (1920x1080) for presentation slides
  const aspectStyle = {
    width: '1920px',
    height: '1080px',
    fontFamily: defaultFont,
  };

  // Resolved Background configuration from unified theme
  const bgImageUrl = theme.background.url;
  const bgOpacity = theme.background.opacity;
  const overlayDarkness = theme.background.overlayDarkness;
  const bgSizeStyle = theme.background.cssSize;
  const bgPosStyle = theme.background.cssPosition;

  // Logo Size mapping
  const logoDimensions = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24',
  }[effectiveConfig.logoSize || 'md'];

  const isAnswerVariant = slideVariant === 'answer';
  const isSeparateSlideMode = effectiveConfig.answerMode === 'separate_slide';

  // If separate_slide mode is active, question slides (isAnswerVariant = false) stay clean.
  // Dedicated answer slides (isAnswerVariant = true) get all configured answer settings.
  // If separate_slide mode is off, reveal settings apply in-place on the question slide when reveal is active.
  const allowRevealOnCurrentSlide = isSeparateSlideMode
    ? isAnswerVariant
    : (isAnswerVariant || effectiveConfig.showAnswerInSlide || isAnswerRevealMode);

  const showAnswerHighlight = allowRevealOnCurrentSlide && hasAnswerDisplayStyle(effectiveConfig, 'highlight_option');
  const showAnswerPill = allowRevealOnCurrentSlide && hasAnswerDisplayStyle(effectiveConfig, 'answer_pill');
  const showExplanation =
    forceShowExplanation !== undefined
      ? forceShowExplanation
      : (allowRevealOnCurrentSlide && hasAnswerDisplayStyle(effectiveConfig, 'explanation_card'));
  const isClassMode = effectiveConfig.layoutMode === 'class_mode';

  const slideTextBoxes = effectiveConfig.slideTextBoxes || [];

  // Boxed-design mode: when text boxes are present they ARE the slide content
  // (template header/middle/footer are hidden — only background + boxes render).
  const isBoxedDesign = slideTextBoxes.length > 0;

  // Custom accent color override (Template Creator accent picker) — applied via
  // inline styles so it overrides the default amber branding whenever set.
  const accentColor = effectiveConfig.accentColorCustom;
  const accentBgStyle: React.CSSProperties | undefined = accentColor
    ? { backgroundColor: accentColor }
    : undefined;
  const accentTextStyle: React.CSSProperties | undefined = accentColor
    ? { color: accentColor }
    : undefined;
  const accentBorderStyle: React.CSSProperties | undefined = accentColor
    ? { borderColor: accentColor }
    : undefined;
  const accentBgSoft =
    accentColor && /^#[0-9A-Fa-f]{6}$/.test(accentColor) ? `${accentColor}26` : undefined;
  const accentBorderSoft =
    accentColor && /^#[0-9A-Fa-f]{6}$/.test(accentColor) ? `${accentColor}66` : undefined;

  return (
    <div
      ref={ref}
      id="slide-canvas-root"
      style={aspectStyle}
      className={`relative w-[1920px] h-[1080px] flex flex-col justify-between p-10 select-none overflow-hidden box-border ${bgImageUrl ? 'bg-slate-950' : styles.bgClass}`}
    >
      {/* IMAGE BASE BACKGROUND FOR SLIDES — when set (preset or custom upload)
          it REPLACES the template theme background entirely. */}
      {bgImageUrl && (
        <div
          className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300"
          style={{
            backgroundImage: `url("${bgImageUrl}")`,
            backgroundSize: bgSizeStyle,
            backgroundPosition: bgPosStyle,
            backgroundRepeat: 'no-repeat',
            opacity: bgOpacity,
          }}
        />
      )}

      {/* Readability Overlay Tint */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundColor: isLight
            ? `rgba(255, 255, 255, ${overlayDarkness * 0.4})`
            : `rgba(15, 23, 42, ${overlayDarkness})`,
        }}
      />

      {/* Decorative Ambient Radial Glows — theme decoration, hidden when a
          background image replaces the theme */}
      {!bgImageUrl && (
        <>
          <div className={`absolute top-0 right-0 w-[650px] h-[650px] rounded-full blur-3xl pointer-events-none z-0 ${isLight ? 'bg-amber-400/10' : 'bg-amber-500/10'}`} />
          <div className={`absolute bottom-0 left-0 w-[550px] h-[550px] rounded-full blur-3xl pointer-events-none z-0 ${isLight ? 'bg-blue-400/10' : 'bg-blue-500/10'}`} />
        </>
      )}

      {mode === 'backgroundOnly' ? null : (
      <>
      {/* Boxed-design mode: when text boxes are present they ARE the slide content — template header/middle/footer are hidden */}
      {!isBoxedDesign && (
        <>
      {/* TOP HEADER BAR (Full Width Image Banner OR Default Structured Header) */}
      <div className="relative z-10 shrink-0">
        {isHeaderBannerMode ? (
          <div className="w-full flex items-center justify-between pb-2 border-b border-white/10">
            {effectiveConfig.headerBannerUrl ? (
              <img
                src={effectiveConfig.headerBannerUrl}
                alt="Custom Header Banner"
                className="w-full max-h-[140px] object-contain rounded-2xl shadow-xl border border-white/20"
              />
            ) : (
              /* Graphic Header Banner Fallback Preview */
              <div className="w-full h-[120px] rounded-2xl bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 border-2 border-emerald-400/60 flex items-center justify-between px-8 shadow-2xl">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 font-black text-3xl flex items-center justify-center shadow-lg">
                    R
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-wide">
                      {effectiveConfig.brandName || "NOBEL'S CLASSROOM"}
                    </h2>
                    <p className="text-xl font-bold text-amber-300 mt-0.5">
                      {effectiveConfig.headerTitle || "অধ্যায় ৮ঃ রেচন প্রক্রিয়া"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="px-6 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xl shadow-md">
                    {getEffectiveBadgeTag(effectiveConfig, item) || "৯ম-১০ম শ্রেণি | জীববিজ্ঞান"}
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-slate-900 text-white border border-slate-700 font-mono font-bold text-lg">
                    {currentIndex + 1} / {totalCount}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{ fontFamily: headerFont }}
            className={`flex items-center justify-between pb-5 border-b backdrop-blur-xs ${isLight ? 'border-slate-300/80' : 'border-white/15'}`}
          >
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-5">
              {effectiveConfig.logoUrl ? (
                <div className="shrink-0 flex items-center justify-center">
                  <img
                    src={effectiveConfig.logoUrl}
                    alt="Brand Logo"
                    className={`${logoDimensions} object-contain rounded-2xl bg-black/10 p-1.5 border border-slate-300 shadow-xl`}
                  />
                </div>
              ) : (
                <div className={`${logoDimensions} rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black text-3xl flex items-center justify-center shadow-xl shadow-amber-500/20 shrink-0`} style={accentBgStyle}>
                  {effectiveConfig.brandName ? effectiveConfig.brandName.charAt(0).toUpperCase() : 'R'}
                </div>
              )}
              <div>
                <h2 className={`${headerSizeClass} font-black tracking-wider uppercase drop-shadow-sm ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  {effectiveConfig.brandName || "NOBEL'S CLASSROOM"}
                </h2>
                {effectiveConfig.headerTitle && (
                  <p className={`text-lg font-bold flex items-center gap-2 mt-1 drop-shadow-sm ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                    <BookOpen className={`w-5 h-5 shrink-0 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} style={accentTextStyle} />
                    <span style={accentTextStyle}>{effectiveConfig.headerTitle}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Badge Tag & Slide Count */}
            <div className="flex items-center gap-4">
              {getEffectiveBadgeTag(effectiveConfig, item) && (
                <div className={`px-6 py-2.5 rounded-2xl text-xl font-extrabold shadow-lg backdrop-blur-md border ${styles.badgeBg} ${styles.badgeText}`}>
                  {getEffectiveBadgeTag(effectiveConfig, item)}
                </div>
              )}
              <div className={`px-5 py-2.5 rounded-2xl border text-lg font-extrabold shadow-md ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 font-mono'
                  : 'bg-slate-900/80 border-white/20 text-amber-300 font-mono'
              }`}>
                {currentIndex + 1} / {totalCount}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MIDDLE CONTENT AREA */}
      {isClassMode ? (
        /* CLASSROOM / LIVE TEACHING MODE */
        <div className="relative z-10 my-auto py-2 flex-1 grid grid-cols-12 gap-8 items-start overflow-hidden">
          {/* LEFT 7 COLUMNS: Question Stem */}
          <div className={`col-span-7 flex flex-col gap-4 h-full ${questionPosClass}`}>
            <div
              style={{ fontFamily: bodyFont }}
              className={`p-6 rounded-3xl ${styles.cardBg} backdrop-blur-md border border-white/10 shadow-2xl space-y-3`}
            >
              {/* Question Stem Text */}
              <div className={`flex items-start gap-3 ${bodySizeClass} ${bodyWeightClass} ${questionAlignClass} leading-relaxed tracking-wide drop-shadow-sm ${
                isLight ? 'text-slate-950' : 'text-white'
              }`}>
                <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xl shrink-0" style={accentBgStyle}>
                  {formatSlideQNumber(currentIndex, effectiveConfig.questionNumberFormat)}
                </span>
                <div className="flex-1">
                  <MathText text={item.stem} />
                </div>
              </div>

              {/* Source Tag Badge */}
              {getSourceTags(item).length > 0 && (
                <div className="pt-2 flex items-center flex-wrap gap-2">
                  {getSourceTags(item).map((tag) => (
                    <div key={tag} className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-extrabold text-base shadow-sm border ${
                      isLight
                        ? 'bg-amber-100 border-amber-300 text-amber-950'
                        : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    }`} style={accentColor ? { backgroundColor: accentBgSoft, borderColor: accentBorderSoft, color: accentColor } : undefined}>
                      <Award className="w-5 h-5" />
                      <span>{tag}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Roman Statements */}
              {item.romanItems && item.romanItems.length > 0 && (
                <div className={`p-4 rounded-2xl flex flex-col gap-2 border ${
                  isLight ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-black/40 border-white/15 text-slate-100'
                }`}>
                  {item.romanItems.map((stmt, sIdx) => (
                    <div key={sIdx} className="text-xl font-bold">
                      <MathText text={stmt} />
                    </div>
                  ))}
                </div>
              )}

              {/* Prompt line (e.g. "নিচের কোনটি সঠিক?") */}
              {item.prompt && (
                <p className={`pt-2 text-xl font-bold italic ${
                  isLight ? 'text-amber-800' : 'text-amber-300'
                }`} style={accentTextStyle}>
                  {item.prompt}
                </p>
              )}
            </div>
          </div>

          {/* RIGHT 5 COLUMNS: Options */}
          <div className="col-span-5 flex flex-col justify-center gap-4 py-2" style={{ fontFamily: optionsFont }}>
            {/* Answer slide indicator strip */}
            {showAnswerPill && item.answer && (
              <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 shadow-lg ${
                isLight
                  ? 'bg-emerald-100 border-emerald-500 text-emerald-900'
                  : 'bg-emerald-500/20 border-emerald-400 text-emerald-100'
              }`}>
                <span className="p-1.5 rounded-xl bg-emerald-500 text-slate-950">
                  <Check className="w-5 h-5 stroke-[3]" />
                </span>
                <span className="text-2xl font-black">উত্তর: {item.answer}</span>
              </div>
            )}

            {item.options.map((opt, oIdx) => {
              const isCorrect = showAnswerHighlight && (opt.isCorrect || opt.key.toLowerCase() === item.answer?.toLowerCase());

              return (
                <div
                  key={oIdx}
                  className={`relative flex items-center gap-5 p-5 rounded-2xl transition-all border backdrop-blur-md shadow-xl ${
                    isCorrect
                      ? (isLight
                          ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-950 shadow-emerald-400/30'
                          : 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-200 shadow-emerald-500/20')
                      : (isLight
                          ? 'bg-white border-2 border-slate-200 text-slate-950 shadow-md'
                          : 'bg-slate-900/90 border border-slate-800 text-slate-100 shadow-md')
                  }`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black shrink-0 shadow-lg ${
                    isCorrect
                      ? 'bg-emerald-400 text-slate-950'
                      : 'bg-slate-950 text-white'
                  }`}>
                    {opt.key}
                  </div>

                  <div className={`${optionsSizeClass} ${optionsWeightClass} ${optionsAlignClass} flex-1 ${isLight ? 'text-slate-950' : 'text-slate-100'}`}>
                    <MathText text={opt.text} />
                  </div>

                  {isCorrect && (
                    <div className="w-10 h-10 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 shadow-lg">
                      <Check className="w-6 h-6 stroke-[3.5]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* STANDARD CENTER LAYOUT MODE */
        <div className={`relative z-10 my-auto py-4 flex flex-col gap-5 overflow-hidden shrink-0 ${questionPosClass}`}>
          {/* Passage or Stem Context */}
          {item.passage && (
            <div className={`p-5 rounded-2xl border text-xl leading-relaxed italic shadow-lg ${
              isLight
                ? 'bg-slate-100/90 border-slate-300 text-slate-900'
                : 'bg-slate-900/80 border-white/15 text-slate-200'
            }`}>
              <MathText text={item.passage} />
            </div>
          )}

          {/* Question Stem Box */}
          <div
            style={{ fontFamily: bodyFont }}
            className={`p-7 rounded-3xl ${styles.cardBg} backdrop-blur-md transition-all shadow-xl`}
          >
            {/* Header: Number, Source */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/30" style={accentBgStyle}>
                  {formatSlideQNumber(currentIndex, effectiveConfig.questionNumberFormat)}
                </span>
                <span className={`text-3xl font-extrabold ${styles.titleColor}`}>
                  প্রশ্ন
                </span>
              </div>

              {getSourceTags(item).length > 0 && (
                <div className="flex items-center flex-wrap gap-2">
                  {getSourceTags(item).map((tag) => (
                    <div key={tag} className={`flex items-center gap-2 px-5 py-1.5 rounded-full font-bold text-lg shadow-sm border ${
                      isLight
                        ? 'bg-amber-100 border-amber-300 text-amber-950'
                        : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    }`} style={accentColor ? { backgroundColor: accentBgSoft, borderColor: accentBorderSoft, color: accentColor } : undefined}>
                      <Award className="w-5 h-5" />
                      <span>{tag}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stem Text */}
            <div className={`${bodySizeClass} ${bodyWeightClass} ${questionAlignClass} leading-relaxed tracking-wide drop-shadow-sm ${
              isLight ? 'text-slate-950' : 'text-white'
            }`}>
              <MathText text={item.stem} />
            </div>

            {/* Stem Image (if present) */}
            {item.stemImage && (
              <div className="mt-3 my-1 flex justify-center">
                <img
                  src={item.stemImage}
                  alt="Question Diagram"
                  className="max-h-56 object-contain rounded-2xl border border-slate-300 bg-white p-2.5 shadow-2xl"
                />
              </div>
            )}

            {/* Roman Statements (bohupodi i., ii., iii.) */}
            {item.romanItems && item.romanItems.length > 0 && (
              <div className={`mt-4 p-5 rounded-2xl flex flex-col gap-2.5 border ${
                isLight
                  ? 'bg-slate-100/90 border-slate-300 text-slate-900'
                  : 'bg-black/40 border-white/15 text-slate-100'
              }`}>
                {item.romanItems.map((stmt, sIdx) => (
                  <div key={sIdx} className={`text-2xl font-bold flex items-start gap-3 ${
                    isLight ? 'text-slate-900' : 'text-slate-100'
                  }`}>
                    <MathText text={stmt} />
                  </div>
                ))}
              </div>
            )}

            {/* Prompt line (e.g. "নিচের কোনটি সঠিক?") */}
            {item.prompt && (
              <p className={`mt-4 text-2xl font-bold italic ${
                isLight ? 'text-amber-800' : 'text-amber-300'
              }`} style={accentTextStyle}>
                {item.prompt}
              </p>
            )}
          </div>

          {/* OPTIONS GRID (CONFIGURABLE 1-COL, 2-COL, 4-COL GRID) */}
          {showAnswerPill && item.answer && (
            <div className="flex justify-center">
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl border-2 shadow-lg ${
                isLight
                  ? 'bg-emerald-100 border-emerald-500 text-emerald-900'
                  : 'bg-emerald-500/20 border-emerald-400 text-emerald-100'
              }`}>
                <span className="p-1.5 rounded-xl bg-emerald-500 text-slate-950">
                  <Check className="w-5 h-5 stroke-[3]" />
                </span>
                <span className="text-2xl font-black">উত্তর: {item.answer}</span>
              </div>
            </div>
          )}
          <div className={`grid ${optionsGridClass}`} style={{ fontFamily: optionsFont }}>
            {item.options.map((opt, oIdx) => {
              const isCorrect = showAnswerHighlight && (opt.isCorrect || opt.key.toLowerCase() === item.answer?.toLowerCase());

              return (
                <div
                  key={oIdx}
                  className={`relative flex items-center gap-4 p-5 rounded-2xl transition-all border backdrop-blur-md shadow-lg ${
                    isCorrect
                      ? (isLight
                          ? 'bg-amber-100 border-2 border-amber-500 text-slate-950 shadow-amber-300/40 ring-2 ring-amber-400'
                          : styles.optionSelectedBg + ' border-amber-400/80 shadow-amber-500/20')
                      : (isLight
                          ? 'bg-white border-2 border-slate-200 text-slate-950 shadow-md'
                          : styles.optionBg + ' border-slate-300/40')
                  }`}
                  style={accentColor && isCorrect ? { backgroundColor: accentBgSoft, borderColor: accentColor } : undefined}
                >
                  {/* Option Badge Key */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0 shadow-md ${
                      isCorrect
                        ? 'bg-amber-400 text-slate-950 shadow-amber-400/30'
                        : isLight
                        ? 'bg-slate-900 text-white border border-slate-800'
                        : 'bg-white/10 text-slate-100 border border-white/15'
                    }`}
                    style={accentColor && isCorrect ? accentBgStyle : undefined}
                  >
                    {opt.key}
                  </div>

                  {/* Option Text */}
                  <div className={`${optionsSizeClass} ${optionsWeightClass} ${optionsAlignClass} flex-1 ${
                    isCorrect
                      ? (isLight ? 'text-slate-950 font-black' : 'text-amber-100 font-black')
                      : (isLight ? 'text-slate-950' : 'text-slate-100')
                  }`}>
                    <MathText text={opt.text} />
                  </div>

                  {/* Correct Checkmark Indicator */}
                  {isCorrect && (
                    <div className="w-11 h-11 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xl animate-pulse" style={accentBgStyle}>
                      <Check className="w-7 h-7 stroke-[3.5]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* EXPLANATION BOX */}
          {showExplanation && item.explanation && (
            <div className={`p-5 rounded-2xl border backdrop-blur-md shadow-2xl flex items-start gap-4 ${
              isLight
                ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-100'
            }`}>
              <div className={`p-2.5 rounded-xl shrink-0 ${
                isLight ? 'bg-emerald-200 text-emerald-900' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className={`text-lg font-black uppercase tracking-wider mb-0.5 ${
                  isLight ? 'text-emerald-900' : 'text-emerald-300'
                }`}>
                  ব্যাখ্যা (Explanation):
                </h4>
                <div className={`text-xl font-semibold leading-relaxed ${
                  isLight ? 'text-slate-950' : 'text-slate-100'
                }`}>
                  <MathText text={item.explanation} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM FOOTER BAR (Full Width Image Banner OR Default Structured Footer) */}
      <div className="relative z-10 shrink-0">
        {effectiveConfig.useFooterBanner && effectiveConfig.footerBannerUrl ? (
          <div className="w-full flex justify-center pt-2">
            <img
              src={effectiveConfig.footerBannerUrl}
              alt="Custom Footer Banner"
              className="w-full max-h-[110px] object-contain rounded-2xl shadow-xl"
            />
          </div>
        ) : (
          <div
            style={{ fontFamily: footerFont }}
            className={`flex items-center justify-between pt-5 border-t backdrop-blur-xs ${
              isLight ? 'border-slate-300/80' : 'border-white/15'
            }`}
          >
            {/* Watermark / Instructor Info */}
            <div className="flex items-center gap-4">
              {effectiveConfig.watermarkAvatar ? (
                <img
                  src={effectiveConfig.watermarkAvatar}
                  alt="Instructor Avatar"
                  className="w-13 h-13 rounded-full object-cover border-2 border-amber-400 shadow-xl"
                  style={accentBorderStyle}
                />
              ) : (
                <div className={`w-13 h-13 rounded-full border-2 border-amber-400 flex items-center justify-center font-bold shadow-lg ${
                  isLight ? 'bg-slate-200 text-slate-900' : 'bg-slate-900 text-amber-300'
                }`} style={accentBorderStyle}>
                  <User className="w-6 h-6" />
                </div>
              )}
              <div>
                <p className={`${footerSizeClass} font-bold tracking-wide ${
                  isLight ? 'text-slate-950' : 'text-white'
                }`}>
                  {effectiveConfig.watermarkHandle || "Hasnat Shuvro"}
                </p>
                <p className={`text-base font-semibold ${
                  isLight ? 'text-amber-800' : 'text-amber-300/90'
                }`}>
                  Senior Instructor & Mentor
                </p>
              </div>
            </div>

            {/* Footer Tag Brand Watermark */}
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-black tracking-widest uppercase font-mono drop-shadow-md ${
                isLight ? 'text-amber-800' : 'text-amber-400'
              }`} style={accentTextStyle}>
                {effectiveConfig.footerTag || "BIOMISSION"}
              </span>
            </div>
          </div>
        )}
      </div>
        </>
      )}

      {/* DECK-WIDE TEXT BOX OVERLAY LAYER — rendered with the slide so it appears in PNG/PPTX exports */}
      <SlideTextBoxLayer
        boxes={slideTextBoxes}
        item={item}
        config={effectiveConfig}
        currentIndex={currentIndex}
        totalCount={totalCount}
        showAnswerHighlight={showAnswerHighlight}
        isAnswerVariant={isAnswerVariant}
      />
      </>
      )}
    </div>
  );
});

SlideCanvas.displayName = 'SlideCanvas';
