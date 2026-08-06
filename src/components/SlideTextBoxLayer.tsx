import React from 'react';
import { DeckConfig, MCQItem, SlideTextBox } from '../types';
import { getSlideBoxContent, getBoxFontFamily } from '../utils/slideTextBoxes';
import { getSlideIcon } from '../utils/slideElements';
import { getTemplateById } from '../templates/registry';
import { MathText } from './MathText';
import { Check } from 'lucide-react';

interface SlideTextBoxLayerProps {
  boxes: SlideTextBox[];
  item: MCQItem;
  config: DeckConfig; // effective config (deck + per-slide overrides)
  currentIndex: number;
  showAnswerHighlight: boolean;
  // 'answer' renders a dedicated answer slide — adds the "উত্তর" strip above
  // the boxes, matching SlideCanvas's answer variant.
  isAnswerVariant?: boolean;
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
  showAnswerHighlight,
  isAnswerVariant = false,
}) => {
  if (boxes.length === 0) return null;

  // Mirror SlideCanvas: highlight/accent colors come from the effective template
  // (deck template + customTheme override), not hardcoded classes.
  const template = getTemplateById(config.templateId, config.customTheme);
  const isLight = template.themeType === 'light';
  const hex = template.styles.hexColors;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      {isAnswerVariant && item.answer && (
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
      {boxes.map(box => {
        const base: React.CSSProperties = {
          left: box.x,
          top: box.y,
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

        // OPTIONS with pre-designed shapes
        if (box.bind === 'options') {
          return (
            <div key={box.id} className={`absolute ${box.bold ? 'font-black' : 'font-bold'}`} style={base}>
              <div className={box.shape === 'pill' ? 'flex flex-wrap gap-3' : 'space-y-2.5'}>
                {item.options.map(opt => {
                  const isCorrect = showAnswerHighlight && (opt.isCorrect || opt.key.toLowerCase() === item.answer?.toLowerCase());
                  const highlight = showAnswerHighlight && isCorrect;
                  const containerStyle: React.CSSProperties = highlight
                    ? {
                        backgroundColor: `${hex.optionSelectedBg}38`,
                        border: `2px solid ${hex.optionSelectedBorder}`,
                        color: hex.optionSelectedText,
                      }
                    : { backgroundColor: box.bg, border: '1px solid rgba(255,255,255,0.15)' };
                  if (box.shape === 'pill') {
                    return (
                      <span
                        key={opt.key}
                        className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full"
                        style={containerStyle}
                      >
                        <span className="font-black">{opt.key}.</span>
                        <span><MathText text={opt.text} /></span>
                        {highlight && <Check className="w-6 h-6 stroke-[3.5]" />}
                      </span>
                    );
                  }
                  if (box.shape === 'card') {
                    return (
                      <div
                        key={opt.key}
                        className="flex items-start gap-3 px-5 py-3.5 rounded-2xl"
                        style={containerStyle}
                      >
                        <span className="font-black shrink-0">{opt.key}.</span>
                        <span><MathText text={opt.text} /></span>
                        {highlight && <Check className="w-6 h-6 stroke-[3.5] shrink-0 ml-auto" />}
                      </div>
                    );
                  }
                  return (
                    <div key={opt.key} className="flex items-start gap-3" style={highlight ? { color: hex.optionSelectedText } : undefined}>
                      <span className="font-black shrink-0">{opt.key}.</span>
                      <span><MathText text={opt.text} /></span>
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
              {(item.romanItems || []).map((stmt, i) => (
                <div key={i} className="my-1"><MathText text={stmt} /></div>
              ))}
            </div>
          );
        }

        // TEXT BINDS WITH PRE-DESIGNED SHAPES
        const content = getSlideBoxContent(box, item, config, currentIndex);
        const textBase = {
          fontSize: box.fontSize,
          color: box.color,
          textAlign: box.align,
          fontFamily: getBoxFontFamily(box, config),
          backgroundColor: box.bg,
          border: box.shape && box.shape !== 'plain' ? '1px solid rgba(255,255,255,0.12)' : undefined,
        } as React.CSSProperties;

        if (box.shape === 'pill') {
          return (
            <div key={box.id} className="absolute" style={{ left: box.x, top: box.y, width: box.w }}>
              <div
                className="inline-flex items-center px-7 py-2.5 rounded-full whitespace-pre-wrap leading-snug"
                style={{ ...textBase, textAlign: 'center', boxShadow: '0 12px 28px rgba(0,0,0,0.12)' }}
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
              style={{ ...base, ...textBase, height: box.h || undefined, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
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
