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
import { hasAnswerDisplayStyle } from '../utils/answerSlides';
import { MathText } from './MathText';
import { Check, User, Sparkles, BookOpen, Award } from 'lucide-react';

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

  // Granular display feature evaluation — on dedicated Answer Slides (isAnswerVariant = true),
  // answer highlight, answer pill, and explanation card ALWAYS show.
  const isRevealActive = isAnswerVariant || showAnswerHighlight;
  const showOptionHighlight = isAnswerVariant || (isRevealActive && hasAnswerDisplayStyle(config, 'highlight_option'));
  const showAnswerPill = isAnswerVariant || (isRevealActive && hasAnswerDisplayStyle(config, 'answer_pill'));
  const showExplanationCard =
    showExplanation !== undefined
      ? showExplanation
      : (isAnswerVariant || (isRevealActive && hasAnswerDisplayStyle(config, 'explanation_card')));

  const cardBox = boxes.find(b => b.bind === 'free' && (b.shape === 'card' || b.shape === 'banner')) || boxes.find(b => b.bind === 'stem');
  const stemBox = boxes.find(b => b.bind === 'stem');
  const romanBox = boxes.find(b => b.bind === 'roman');
  const promptBox = boxes.find(b => b.bind === 'prompt');
  const optionsBoxForMetrics = boxes.find(b => b.bind === 'options');
  const is2Column = !!(cardBox && optionsBoxForMetrics && optionsBoxForMetrics.x > cardBox.x + 300);

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
        if (box.bind === 'explanation' && !isAnswerVariant && !showExplanationCard && !item.explanation) return null;
        if (box.bind === 'answer' && !showAnswerPill && !isAnswerVariant) return null;
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
        const boxHeight = isTargetCard && cardMetrics ? cardMetrics.cardH : box.h;

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

        // IMAGE ELEMENT (banner / uploaded picture)
        if (box.bind === 'image') {
          return box.imageUrl ? (
            <div
              key={box.id}
              className="absolute rounded-3xl overflow-hidden"
              style={{
                ...base,
                height: box.h || 380,
                backgroundColor: box.bg,
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
              }}
            >
              <img
                src={box.imageUrl}
                alt="Slide Banner"
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          ) : null;
        }

        // CUSTOM BINDINGS RENDERING (questionNumber, source, explanation, watermark)
        if (box.bind === 'source') {
          const sources = getSourceTags(item);
          return (
            <div key={box.id} className="absolute flex items-center justify-end flex-wrap gap-2" style={{ left: box.x, top: box.y, width: box.w }}>
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
          const is2Col = (config.optionsLayout || '2col') === '2col';
          const gridClass = box.shape === 'pill'
            ? 'flex flex-wrap gap-3'
            : is2Col
            ? 'grid grid-cols-2 gap-4'
            : 'space-y-2.5';

          return (
            <div key={box.id} className={`absolute ${box.bold ? 'font-black' : 'font-bold'}`} style={{ ...base, top: boxTop }}>
              <div className={gridClass}>
                {item.options.map((opt, oIdx) => {
                  const isCorrectOption = checkIsOptionCorrect(opt, item.answer, oIdx);
                  const highlight = showOptionHighlight && isCorrectOption;
                  const containerStyle: React.CSSProperties = highlight
                    ? {
                        backgroundColor: theme.colors.optionSelectedBg,
                        border: `2px solid ${theme.colors.optionSelectedBorder}`,
                        color: theme.colors.optionSelectedText,
                        boxShadow: '0 10px 25px rgba(245,158,11,0.2)',
                        fontSize: box.fontSize ? `${box.fontSize}px` : undefined,
                      }
                    : {
                        backgroundColor: box.bg,
                        border: isLight ? '2px solid rgba(226,232,240,0.9)' : '1px solid rgba(255,255,255,0.15)',
                        color: isLight ? '#0f172a' : '#f8fafc',
                        fontSize: box.fontSize ? `${box.fontSize}px` : undefined,
                      };
                  if (box.shape === 'pill') {
                    return (
                      <span
                        key={opt.key}
                        className="inline-flex items-center gap-3 px-6 py-3 rounded-full shadow-lg"
                        style={containerStyle}
                      >
                        <span className={`w-8 h-8 rounded-full font-black text-lg flex items-center justify-center shrink-0 ${
                          highlight ? 'bg-amber-400 text-slate-950' : isLight ? 'bg-slate-900 text-white' : 'bg-white/10 text-white'
                        }`}>
                          {opt.key}
                        </span>
                        <span className="flex-1 min-w-0 font-bold" style={{ fontSize: box.fontSize ? `${box.fontSize}px` : undefined }}><MathText text={opt.text} /></span>
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
                        className="flex items-center gap-4 px-5 py-4 rounded-2xl shadow-xl backdrop-blur-md"
                        style={containerStyle}
                      >
                        <div className={`w-11 h-11 rounded-2xl font-black text-xl flex items-center justify-center shrink-0 shadow-md ${
                          highlight
                            ? 'bg-amber-400 text-slate-950'
                            : isLight
                            ? 'bg-slate-900 text-white'
                            : 'bg-white/10 text-white border border-white/15'
                        }`}>
                          {opt.key}
                        </div>
                        <span className="flex-1 min-w-0 font-extrabold leading-snug" style={{ fontSize: box.fontSize ? `${box.fontSize}px` : undefined }}><MathText text={opt.text} /></span>
                        {highlight && (
                          <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-lg animate-pulse">
                            <Check className="w-6 h-6 stroke-[3.5]" />
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div key={opt.key} className="flex items-center gap-3" style={highlight ? { color: theme.colors.optionSelectedText, fontSize: box.fontSize ? `${box.fontSize}px` : undefined } : { fontSize: box.fontSize ? `${box.fontSize}px` : undefined }}>
                      <span className="font-black shrink-0">{opt.key}.</span>
                      <span className="flex-1 min-w-0" style={{ fontSize: box.fontSize ? `${box.fontSize}px` : undefined }}><MathText text={opt.text} /></span>
                      {highlight && <Check className="w-6 h-6 stroke-[3.5] shrink-0 ml-auto" />}
                    </div>
                  );
                })}
              </div>
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
              className={`absolute whitespace-pre-wrap leading-snug ${box.bold ? 'font-black' : 'font-bold'}`}
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

        // TEXT BINDS WITH PRE-DESIGNED SHAPES
        const content = getSlideBoxContent(box, item, config, currentIndex, totalCount);
        const textBase = {
          fontSize: box.fontSize,
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
          if (!showExplanationCard && !isAnswerVariant) return null;

          return (
            <div
              key={box.id}
              className="absolute p-6 rounded-3xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-100 shadow-2xl backdrop-blur-md"
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
            <div key={box.id} className="absolute flex items-center gap-4" style={{ left: box.x, top: box.y }}>
              {config.watermarkAvatar ? (
                <img
                  src={config.watermarkAvatar}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-xl shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-amber-400 bg-slate-900 text-amber-300 flex items-center justify-center font-black shadow-lg shrink-0">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div>
                <p className="text-xl font-extrabold text-white tracking-wide leading-tight">
                  {content}
                </p>
                <p className="text-sm font-bold text-amber-300/90 mt-0.5">
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
          return (
            <div key={box.id} className="absolute flex justify-end" style={{ left: box.x, top: box.y, width: box.w }}>
              <div
                className="inline-flex items-center px-6 py-2.5 rounded-full whitespace-pre-wrap leading-snug border border-amber-500/40 text-amber-300 font-extrabold shadow-lg backdrop-blur-md"
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
              }`}
              style={{ ...base, ...textBase, height: boxHeight || undefined, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
            >
              <MathText text={content} />
            </div>
          );
        }

        return (
          <div key={box.id} className={`absolute whitespace-pre-wrap leading-snug ${box.bold ? 'font-black' : 'font-bold'}`} style={{ ...base, height: box.h || undefined }}>
            <MathText text={content} />
          </div>
        );
      })}
    </div>
  );
};
