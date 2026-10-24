import React from 'react';
import { DeckConfig, MCQItem, SlideTextBox, getSourceTags } from '../types';
import { getSlideBoxContent, getBoxFontFamily, formatSlideQNumber, checkIsOptionCorrect } from '../utils/slideTextBoxes';
import { getSlideIcon } from '../utils/slideElements';
import { resolveTheme } from '../utils/themeResolver';
import {
  TPL_CARD_ID,
  TPL_STEM_ID,
  TPL_ROMAN_ID,
  TPL_PROMPT_ID,
  TPL_OPTIONS_ID,
  computeTemplateCardMetrics,
  splitRomanLabel,
} from '../utils/templateBoxLayout';
import { hasAnswerDisplayStyle, resolveSlideAnswerFlags } from '../utils/answerSlides';
import { MathText } from './MathText';
import { calculateFittedFontSize, calculateFittedOptionsLayout } from '../utils/textHeightEstimate';
import { Check, User, Sparkles, BookOpen, Award, QrCode } from 'lucide-react';

interface SlideTextBoxLayerProps {
  boxes: SlideTextBox[];
  item: MCQItem;
  config: DeckConfig; // effective config (deck + per-slide overrides)
  currentIndex: number;
  totalCount?: number;
  showAnswerHighlight: boolean;
  // 'answer' renders a dedicated answer slide — adds the "উত্তর" strip above
  // the boxes, matching SlideCanvas's answer variant.
  isAnswerVariant?: boolean;
  // Resolved explanation-card visibility from the renderer (SlideCanvas).
  // When provided it wins over the config-derived gate so the boxed-design
  // explanation card matches the preview even when ONLY the explanation toggle
  // is enabled (reveal gate must not require the answer highlight).
  showExplanation?: boolean;
  // Optional: only render boxes with these ids. Used to rasterize just the
  // boxes PPTX can't reproduce natively (LaTeX/math content) as images.
  renderBoxIds?: string[];
}

// Renders the deck-wide text-box overlay layer for a slide. Shared between
// SlideCanvas (Slide Studio preview/export) and the Social Post Generator so
// the exact same box rendering (icons, images, pills/cards, roman lists,
// option highlight) appears everywhere.
export const SlideTextBoxLayer: React.FC<SlideTextBoxLayerProps> = ({
  boxes,
  item,
  config,
  currentIndex,
  totalCount = 1,
  showAnswerHighlight,
  isAnswerVariant = false,
  showExplanation,
  renderBoxIds,
}) => {
  if (boxes.length === 0) return null;

  // Optional id filter (raster-only renders) — everything else stays the same
  // so a single box renders at its exact coordinates for offscreen capture.
  const visibleBoxes = renderBoxIds ? boxes.filter(b => renderBoxIds.includes(b.id)) : boxes;
  if (visibleBoxes.length === 0) return null;

  const theme = resolveTheme(config);
  const isLight = theme.isLight;
  const romanBadgeBg = theme.colors.romanBadgeBg;
  const romanBadgeBorder = theme.colors.romanBadgeBorder;

  const resolvedFlags = resolveSlideAnswerFlags(config, isAnswerVariant);
  const showOptionHighlight = showAnswerHighlight !== undefined ? showAnswerHighlight : resolvedFlags.showOptionHighlight;
  const showAnswerPill = resolvedFlags.showAnswerPill;
  const showExplanationCard =
    showExplanation !== undefined
      ? showExplanation
      : resolvedFlags.showExplanationCard;

  const cardBox = boxes.find(b => b.bind === 'free' && (b.shape === 'card' || b.shape === 'banner')) || boxes.find(b => b.bind === 'stem');
  const stemBox = boxes.find(b => b.bind === 'stem');
  const romanBox = boxes.find(b => b.bind === 'roman');
  const promptBox = boxes.find(b => b.bind === 'prompt');
  const optionsBoxForMetrics = boxes.find(b => b.bind === 'options');
  const is2Column = (config.optionsLayout || '2col') === '2col';

  const cardMetrics = cardBox
    ? computeTemplateCardMetrics(item, cardBox, stemBox, romanBox, optionsBoxForMetrics?.y ?? cardBox.y, is2Column)
    : undefined;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      {!renderBoxIds && showAnswerPill && item.answer && !boxes.some(b => b.bind === 'answer') && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 top-5 flex items-center gap-2.5 px-6 py-2.5 rounded-full border-2 shadow-xl ${
            isLight
              ? 'bg-emerald-100 border-emerald-500 text-emerald-900'
              : 'bg-emerald-500/20 border-emerald-400 text-emerald-100'
          }`}
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span className="text-2xl font-black">উত্তর: {item.answer}</span>
        </div>
      )}
      {visibleBoxes.map(box => {
        // Skip optional structural boxes that have no content on this slide
        if (box.bind === 'roman' && !(item.romanItems || []).length) return null;
        if (box.bind === 'prompt' && !item.prompt) return null;
        if (box.bind === 'explanation' && !showExplanationCard) return null;
        if (box.bind === 'answer' && !showAnswerPill) return null;
        if (box.bind === 'brand' && config.showBrandLogo === false) return null;
        if (box.bind === 'slideCounter' && config.showPagingCounter === false) return null;
        if (box.bind === 'questionNumber' && config.showQuestionNumber === false) return null;
        if (box.bind === 'watermark' && config.showInstructorInfo === false) return null;

        // Adaptive-layout overrides for card/roman/prompt/options boxes
        const isTargetCard = cardBox && box.id === cardBox.id;
        const isTargetOptions = box.bind === 'options';
        const isTargetRoman = box.bind === 'roman';
        const isTargetPrompt = box.bind === 'prompt';
        let boxTop = box.y;
        if (isTargetOptions && cardMetrics) boxTop = cardMetrics.optionsY;
        else if (isTargetRoman && cardMetrics?.romanY !== undefined) boxTop = cardMetrics.romanY;
        else if (isTargetPrompt && cardMetrics?.promptY !== undefined) boxTop = cardMetrics.promptY;
        // Explicit box.h always takes precedence so resizing down never leaves a lingering empty card
        const boxHeight = (typeof box.h === 'number' && box.h > 0)
          ? box.h
          : (isTargetCard && cardMetrics ? cardMetrics.cardH : box.h);

        const base: React.CSSProperties = {
          left: box.x,
          top: boxTop,
          width: box.w,
          fontSize: box.fontSize,
          color: box.color,
          textAlign: box.align,
          fontFamily: getBoxFontFamily(box, config),
        };

        // ICON ELEMENT (decorative lucide icon, sized by fontSize)
        if (box.bind === 'icon') {
          const IconComp = getSlideIcon(box.iconName || '');
          return (
            <div
              key={box.id}
              className={`absolute flex items-center justify-center ${box.shape === 'card' || box.shape === 'banner' ? 'rounded-3xl' : ''}`}
              style={{
                ...base,
                height: box.h || box.fontSize * 1.4,
                backgroundColor: box.shape === 'card' || box.shape === 'banner' ? box.bg : undefined,
                border: box.shape === 'card' || box.shape === 'banner' ? '1px solid rgba(255,255,255,0.12)' : undefined,
                boxShadow: box.shape === 'card' || box.shape === 'banner' ? '0 20px 40px rgba(0,0,0,0.15)' : undefined,
              }}
            >
              {IconComp && <IconComp size={box.fontSize} style={{ color: box.color }} />}
            </div>
          );
        }

        // IMAGE / LOGO / QR ELEMENT (banner, brand logo or QR graphic)
        if (box.bind === 'image') {
          const activeSrc = box.imageUrl || config.logoUrl;
          const imgH = box.h || 135;
          return (
            <div
              key={box.id}
              className="absolute rounded-2xl overflow-hidden flex items-center justify-center transition-all select-none"
              style={{
                ...base,
                height: imgH,
                backgroundColor: box.bg || 'rgba(15,23,42,0.85)',
                border: '1px solid rgba(255,255,255,0.18)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              }}
            >
              {activeSrc ? (
                <img
                  src={activeSrc}
                  alt="Logo / QR / Graphic"
                  className="w-full h-full object-contain p-2 img-crisp pointer-events-none"
                  draggable={false}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-1.5 p-3 text-center select-none w-full h-full">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow">
                    <QrCode className="w-6 h-6 stroke-[2]" />
                  </div>
                  <span className="text-[11px] font-black tracking-wider text-amber-300 uppercase leading-none">
                    LOGO / QR
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    {box.w} × {imgH}px
                  </span>
                </div>
              )}
            </div>
          );
        }

        // CUSTOM BINDINGS RENDERING (questionNumber, source, explanation, watermark)
        if (box.bind === 'source') {
          const sources = getSourceTags(item);
          const sourceJustify = box.align === 'left' ? 'justify-start' : box.align === 'center' ? 'justify-center' : 'justify-end';
          return (
            <div key={box.id} className={`absolute flex items-center ${sourceJustify} flex-wrap gap-2`} style={{ left: box.x, top: box.y, width: box.w }}>
              {sources.map((srcTag) => (
                <div
                  key={srcTag}
                  className="inline-flex items-center gap-2.5 px-5 py-1.5 rounded-full border border-amber-500/50 bg-amber-950/70 text-amber-300 font-extrabold text-lg shadow-md backdrop-blur-md"
                >
                  <Award className="w-5 h-5 text-amber-400 shrink-0 stroke-[2.5]" />
                  <span>{srcTag}</span>
                </div>
              ))}
            </div>
          );
        }

        if (box.bind === 'questionNumber') {
          return (
            <div
              key={box.id}
              className="absolute flex items-center gap-3"
              style={{ left: box.x, top: box.y }}
            >
              <span className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                {box.text || formatSlideQNumber(currentIndex, config.questionNumberFormat)}
              </span>
            </div>
          );
        }

        // OPTIONS with pre-designed shapes & 2-column card grid support
        if (box.bind === 'options') {
          const is2Col = (box.optionsLayout || config.optionsLayout || '2col') === '2col';
          const isBounded = typeof box.h === 'number' && box.h > 0;
          const fittedMetrics = isBounded
            ? calculateFittedOptionsLayout(
                item.options,
                box.w,
                box.h!,
                box.fontSize,
                is2Col,
                box.minFontSize || 12
              )
            : null;

          const optFontSize = fittedMetrics ? fittedMetrics.fontSize : box.fontSize;
          const cardH = fittedMetrics ? fittedMetrics.rowHeight : undefined;
          const badgePx = fittedMetrics ? fittedMetrics.badgeSize : (box.shape === 'card' ? 48 : 36);
          const badgeTextClass = fittedMetrics ? fittedMetrics.badgeTextSize : 'text-2xl';
          const padClass = fittedMetrics ? fittedMetrics.paddingClass : (box.shape === 'card' ? 'px-6 py-5 min-h-[82px]' : 'px-6 py-3.5');

          const gridClass = box.shape === 'pill'
            ? 'flex flex-wrap gap-3.5'
            : is2Col
            ? 'grid grid-cols-2 gap-4'
            : 'space-y-3';

          return (
            <div
              key={box.id}
              className={`absolute ${box.bold ? 'font-black' : 'font-bold'}`}
              style={{
                ...base,
                top: boxTop,
                height: box.h || undefined,
                maxHeight: box.h || undefined,
                overflow: isBounded ? 'hidden' : undefined,
              }}
            >
              <div className={`${gridClass} ${isBounded ? 'h-full' : ''}`}>
                {item.options.map((opt, oIdx) => {
                  const isCorrectOption = checkIsOptionCorrect(opt, item.answer, oIdx);
                  const highlight = showOptionHighlight && isCorrectOption;
                  const containerStyle: React.CSSProperties = highlight
                    ? {
                        backgroundColor: theme.colors.optionSelectedBg,
                        border: `2px solid ${theme.colors.optionSelectedBorder}`,
                        color: theme.colors.optionSelectedText,
                        boxShadow: '0 10px 25px rgba(245,158,11,0.2)',
                        fontSize: optFontSize ? `${optFontSize}px` : undefined,
                        height: cardH,
                        minHeight: cardH,
                      }
                    : {
                        backgroundColor: box.bg,
                        border: isLight ? '2px solid rgba(226,232,240,0.9)' : '1px solid rgba(255,255,255,0.15)',
                        color: isLight ? '#0f172a' : '#f8fafc',
                        fontSize: optFontSize ? `${optFontSize}px` : undefined,
                        height: cardH,
                        minHeight: cardH,
                      };
                  if (box.shape === 'pill') {
                    return (
                      <span
                        key={opt.key}
                        className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full shadow-lg"
                        style={containerStyle}
                      >
                        {!box.hideOptionBadges && (
                        <span
                          className={`rounded-full font-black flex items-center justify-center shrink-0 ${badgeTextClass} ${
                            highlight ? 'bg-amber-400 text-slate-950' : isLight ? 'bg-slate-900 text-white' : 'bg-white/10 text-white'
                          }`}
                          style={{ width: badgePx, height: badgePx }}
                        >
                          {opt.key}
                        </span>
                      )}
                        <span className="flex-1 min-w-0 font-bold" style={{ fontSize: optFontSize ? `${optFontSize}px` : undefined }}><MathText text={opt.text} /></span>
                        {highlight && (
                          <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                            <Check className="w-5 h-5 stroke-[3.5]" />
                          </div>
                        )}
                      </span>
                    );
                  }
                  if (box.shape === 'card') {
                    return (
                      <div
                        key={opt.key}
                        className={`flex items-center gap-3.5 ${padClass} rounded-2xl shadow-xl backdrop-blur-md slide-box-option-bg overflow-hidden`}
                        style={containerStyle}
                      >
                        {!box.hideOptionBadges && (
                        <div
                          className={`rounded-2xl font-black flex items-center justify-center shrink-0 shadow-md ${badgeTextClass} ${
                            highlight
                              ? 'bg-amber-400 text-slate-950'
                              : isLight
                              ? 'bg-slate-900 text-white'
                              : 'bg-white/10 text-white border border-white/15'
                          }`}
                          style={{ width: badgePx, height: badgePx }}
                        >
                          {opt.key}
                        </div>
                      )}
                        <span className="flex-1 min-w-0 font-extrabold leading-snug" style={{ fontSize: optFontSize ? `${optFontSize}px` : undefined }}><MathText text={opt.text} /></span>
                        {highlight && (
                          <div className="w-9 h-9 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-lg animate-pulse">
                            <Check className="w-6 h-6 stroke-[3.5]" />
                          </div>
                        )}
                      </div>
                    );
                  }
                  const plainColor = highlight
                    ? theme.colors.optionSelectedText
                    : (box.color || (isLight ? '#0f172a' : '#f8fafc'));
                  return (
                    <div
                      key={opt.key}
                      className="flex items-center gap-2.5 overflow-hidden"
                      style={{
                        height: cardH,
                        minHeight: cardH,
                        color: plainColor,
                        fontSize: optFontSize ? `${optFontSize}px` : undefined,
                      }}
                    >
                      {!box.hideOptionBadges && (
                        <span className="font-black shrink-0">{opt.key}.</span>
                      )}
                      <span className="flex-1 min-w-0 font-bold leading-snug" style={{ fontSize: optFontSize ? `${optFontSize}px` : undefined }}>
                        <MathText text={opt.text} />
                      </span>
                      {highlight && <Check className="w-5 h-5 stroke-[3.5] shrink-0 ml-auto text-amber-400" />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // INDIVIDUAL SEPARATE OPTIONS (Option A, B, C, D)
        if (box.bind === 'opt_a' || box.bind === 'opt_b' || box.bind === 'opt_c' || box.bind === 'opt_d') {
          const optIndex =
            box.bind === 'opt_a' ? 0 :
            box.bind === 'opt_b' ? 1 :
            box.bind === 'opt_c' ? 2 : 3;

          const opt = item.options[optIndex];
          const rawText = (box.text !== undefined && box.text !== null && box.text !== '') ? box.text : (opt ? opt.text : '');
          if (!opt && !rawText) return null;

          const isCorrectOption = opt ? checkIsOptionCorrect(opt, item.answer, optIndex) : false;
          const highlight = showOptionHighlight && isCorrectOption;
          const isBounded = typeof box.h === 'number' && box.h > 0;
          const padX = box.shape === 'card' ? 28 : box.shape === 'pill' ? 36 : 8;
          const padY = box.shape === 'card' ? 20 : box.shape === 'pill' ? 16 : 6;
          const badgeWidth = box.hideOptionBadges ? 0 : 36;

          const effectiveFontSize = (box.autoFit !== false && isBounded)
            ? calculateFittedFontSize(
                rawText,
                Math.max(40, box.w - badgeWidth),
                box.h!,
                box.fontSize,
                box.minFontSize || 12,
                padX,
                padY
              )
            : box.fontSize;

          const optKey = opt ? opt.key : String.fromCharCode(65 + optIndex);

          if (box.shape === 'pill') {
            return (
              <div
                key={box.id}
                className={`absolute flex items-center justify-between px-6 py-2.5 rounded-full shadow-lg ${box.bold ? 'font-black' : 'font-bold'}`}
                style={{
                  ...base,
                  height: box.h || undefined,
                  maxHeight: box.h || undefined,
                  overflow: isBounded ? 'hidden' : undefined,
                  backgroundColor: highlight ? theme.colors.optionSelectedBg : (box.bg || 'rgba(15,23,42,0.85)'),
                  border: highlight ? `2px solid ${theme.colors.optionSelectedBorder}` : '1px solid rgba(255,255,255,0.15)',
                  color: highlight ? theme.colors.optionSelectedText : (box.color || (isLight ? '#0f172a' : '#f8fafc')),
                  fontSize: `${effectiveFontSize}px`,
                }}
              >
                {!box.hideOptionBadges && (
                  <span
                    className={`rounded-full font-black flex items-center justify-center shrink-0 mr-2.5 ${
                      highlight ? 'bg-amber-400 text-slate-950' : isLight ? 'bg-slate-900 text-white' : 'bg-white/10 text-white'
                    }`}
                    style={{ width: Math.max(20, effectiveFontSize * 1.2), height: Math.max(20, effectiveFontSize * 1.2) }}
                  >
                    {optKey}
                  </span>
                )}
                <span className="flex-1 min-w-0 leading-snug"><MathText text={rawText} /></span>
                {highlight && <Check className="w-5 h-5 stroke-[3.5] shrink-0 ml-2 text-amber-400" />}
              </div>
            );
          }

          if (box.shape === 'card') {
            return (
              <div
                key={box.id}
                className={`absolute flex items-center justify-between px-6 py-4 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden ${box.bold ? 'font-black' : 'font-bold'}`}
                style={{
                  ...base,
                  height: box.h || undefined,
                  maxHeight: box.h || undefined,
                  overflow: isBounded ? 'hidden' : undefined,
                  backgroundColor: highlight ? theme.colors.optionSelectedBg : (box.bg || 'rgba(15,23,42,0.85)'),
                  border: highlight ? `2px solid ${theme.colors.optionSelectedBorder}` : '1px solid rgba(255,255,255,0.15)',
                  color: highlight ? theme.colors.optionSelectedText : (box.color || (isLight ? '#0f172a' : '#f8fafc')),
                  fontSize: `${effectiveFontSize}px`,
                }}
              >
                {!box.hideOptionBadges && (
                  <div
                    className={`rounded-xl font-black flex items-center justify-center shrink-0 shadow-md mr-3 ${
                      highlight ? 'bg-amber-400 text-slate-950' : isLight ? 'bg-slate-900 text-white' : 'bg-white/10 text-white border border-white/15'
                    }`}
                    style={{ width: Math.max(24, effectiveFontSize * 1.3), height: Math.max(24, effectiveFontSize * 1.3) }}
                  >
                    {optKey}
                  </div>
                )}
                <span className="flex-1 min-w-0 leading-snug"><MathText text={rawText} /></span>
                {highlight && <Check className="w-5 h-5 stroke-[3.5] shrink-0 ml-2 text-amber-400" />}
              </div>
            );
          }

          // Plain Transparent Text Only
          const alignJustify = box.align === 'center' ? 'justify-center text-center' : box.align === 'right' ? 'justify-end text-right' : 'justify-start text-left';
          return (
            <div
              key={box.id}
              className={`absolute flex items-center ${alignJustify} ${box.bold ? 'font-black' : 'font-bold'}`}
              style={{
                ...base,
                height: box.h || undefined,
                maxHeight: box.h || undefined,
                overflow: isBounded ? 'hidden' : undefined,
                backgroundColor: box.bg && box.bg !== 'transparent' ? box.bg : 'transparent',
                color: highlight ? theme.colors.optionSelectedText : (box.color || (isLight ? '#0f172a' : '#f8fafc')),
                fontSize: `${effectiveFontSize}px`,
              }}
            >
              {!box.hideOptionBadges && (
                <span className="font-black shrink-0 mr-2">{optKey}.</span>
              )}
              <span className="min-w-0 leading-snug"><MathText text={rawText} /></span>
              {highlight && <Check className="w-5 h-5 stroke-[3.5] shrink-0 ml-2 text-amber-400" />}
            </div>
          );
        }

        // ROMAN STATEMENTS
        if (box.bind === 'roman') {
          const cardStyle: React.CSSProperties =
            box.shape === 'card' || box.shape === 'pill' || box.shape === 'banner'
              ? {
                  backgroundColor: box.bg,
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                  borderRadius: box.shape === 'pill' ? 999 : box.shape === 'card' ? 16 : 24,
                  padding: box.shape === 'pill' ? '10px 28px' : '16px 28px',
                }
              : undefined;
          return (
            <div
              key={box.id}
              className={`absolute whitespace-pre-wrap leading-snug ${box.bold ? 'font-black' : 'font-bold'} slide-box-card-bg`}
              style={{ ...base, ...cardStyle, height: box.h || undefined }}
            >
              {(item.romanItems || []).map((stmt, i) => {
                const parsed = splitRomanLabel(stmt);
                if (!parsed) {
                  return <div key={i} className="my-1"><MathText text={stmt} /></div>;
                }
                return (
                  <div key={i} className="my-1 flex items-start gap-3">
                    <span
                      className="shrink-0 inline-flex items-center justify-center rounded-full font-black uppercase"
                      style={{
                        fontSize: '0.72em',
                        minWidth: '2em',
                        height: '1.6em',
                        padding: '0 0.55em',
                        backgroundColor: romanBadgeBg,
                        color: theme.colors.accentColor,
                        border: `1px solid ${romanBadgeBorder}`,
                      }}
                    >
                      {parsed.label}
                    </span>
                    <span className="flex-1 min-w-0"><MathText text={parsed.rest} /></span>
                  </div>
                );
              })}
            </div>
          );
        }

        // TEXT BINDS WITH PRE-DESIGNED SHAPES & AUTO-FIT
        const content = getSlideBoxContent(box, item, config, currentIndex, totalCount);
        const isBounded = typeof box.h === 'number' && box.h > 0;
        const padX = box.shape === 'card' || box.shape === 'banner' ? 56 : 0;
        const padY = box.shape === 'card' || box.shape === 'banner' ? 40 : 0;
        const shouldAutoFit = box.autoFit !== false && isBounded;

        const effectiveFontSize = shouldAutoFit
          ? calculateFittedFontSize(
              content,
              box.w,
              box.h!,
              box.fontSize,
              box.minFontSize || (box.bind === 'stem' ? 14 : 12),
              padX,
              padY
            )
          : box.fontSize;

        const textBase = {
          fontSize: effectiveFontSize,
          color: box.color,
          textAlign: box.align,
          fontFamily: getBoxFontFamily(box, config),
          backgroundColor: box.bg,
          border: box.shape && box.shape !== 'plain' ? '1px solid rgba(255,255,255,0.12)' : undefined,
        } as React.CSSProperties;

        // CUSTOM BINDINGS RENDERING (explanation, watermark)

        if (box.bind === 'answer') {
          const ansContent = content;
          return (
            <div
              key={box.id}
              className={`absolute flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-full border-2 shadow-xl ${
                isLight
                  ? 'bg-emerald-100 border-emerald-500 text-emerald-900'
                  : 'bg-emerald-500/20 border-emerald-400 text-emerald-100'
              }`}
              style={{
                left: box.x,
                top: box.y,
                width: box.w,
                fontSize: box.fontSize,
                backgroundColor: box.bg || undefined,
                color: box.color || undefined,
                fontFamily: getBoxFontFamily(box, config),
              }}
            >
              <Check className="w-5 h-5 stroke-[3] shrink-0" />
              <span className="font-black"><MathText text={ansContent} /></span>
            </div>
          );
        }

        if (box.bind === 'explanation') {
          if (!showExplanationCard) return null;

          return (
            <div
              key={box.id}
              className="absolute p-6 rounded-3xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-100 shadow-2xl backdrop-blur-md slide-box-card-bg"
              style={{
                left: box.x,
                top: box.y,
                width: box.w,
                backgroundColor: box.bg || undefined,
                color: box.color || undefined,
                fontFamily: getBoxFontFamily(box, config),
              }}
            >
              <div className="flex items-center gap-2 text-emerald-300 font-black text-xl mb-1.5 tracking-wide">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Explanation:</span>
              </div>
              <div className="text-emerald-100 font-extrabold text-xl leading-relaxed">
                <MathText text={content} />
              </div>
            </div>
          );
        }

        if (box.bind === 'watermark') {
          return (
            <div
              key={box.id}
              className="absolute flex items-center gap-4"
              style={{ left: box.x, top: box.y, width: box.w, height: box.h || undefined }}
            >
              {config.watermarkAvatar ? (
                <img
                  src={config.watermarkAvatar}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-xl shrink-0 img-crisp"
                />
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-amber-400 bg-slate-900 text-amber-300 flex items-center justify-center font-black shadow-lg shrink-0">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xl font-extrabold text-white tracking-wide leading-tight truncate">
                  {content}
                </p>
                <p className="text-sm font-bold text-amber-300/90 mt-0.5 truncate">
                  Senior Instructor & Mentor
                </p>
              </div>
            </div>
          );
        }

        if (box.bind === 'slideCounter') {
          return (
            <div
              key={box.id}
              className="absolute px-5 py-2.5 rounded-2xl bg-slate-900/90 border border-white/20 text-amber-300 font-mono font-extrabold text-lg shadow-md flex items-center justify-center"
              style={{ left: box.x, top: box.y, width: box.w, height: box.h || undefined }}
            >
              <span>{content}</span>
            </div>
          );
        }

        if (box.shape === 'pill') {
          const pillJustify = box.align === 'left' ? 'justify-start' : box.align === 'right' ? 'justify-end' : 'justify-center';
          return (
            <div key={box.id} className={`absolute flex ${pillJustify}`} style={{ left: box.x, top: box.y, width: box.w }}>
              <div
                className="inline-flex items-center px-6 py-2.5 rounded-full whitespace-pre-wrap leading-snug border border-amber-500/40 text-amber-300 font-extrabold shadow-lg backdrop-blur-md slide-box-card-bg"
                style={{ ...textBase, textAlign: box.align || 'center', boxShadow: '0 12px 28px rgba(0,0,0,0.12)' }}
              >
                <MathText text={content} />
              </div>
            </div>
          );
        }

        if (box.shape === 'card' || box.shape === 'banner') {
          return (
            <div
              key={box.id}
              className={`absolute px-7 py-5 whitespace-pre-wrap leading-snug ${box.bold ? 'font-black' : 'font-bold'} ${
                box.shape === 'card' ? 'rounded-2xl' : 'rounded-3xl'
              } slide-box-card-bg`}
              style={{
                ...base,
                ...textBase,
                height: boxHeight || undefined,
                maxHeight: boxHeight || undefined,
                overflow: isBounded ? 'hidden' : undefined,
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              }}
            >
              <MathText text={content} />
            </div>
          );
        }

        return (
          <div
            key={box.id}
            className={`absolute whitespace-pre-wrap leading-snug ${box.bold ? 'font-black' : 'font-bold'}`}
            style={{
              ...base,
              fontSize: effectiveFontSize,
              height: box.h || undefined,
              maxHeight: box.h || undefined,
              overflow: isBounded ? 'hidden' : undefined,
              backgroundColor: (box.shape === 'plain' || box.bg === 'transparent') ? 'transparent' : (box.bg || undefined),
            }}
          >
            <MathText text={content} />
          </div>
        );
      })}
    </div>
  );
};
