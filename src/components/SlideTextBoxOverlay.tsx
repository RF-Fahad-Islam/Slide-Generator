import React, { useRef, useState } from 'react';
import { MCQItem, DeckConfig, SlideTextBox } from '../types';
import { getSlideBoxContent, clamp, SLIDE_W, SLIDE_H } from '../utils/slideTextBoxes';
import {
  TPL_CARD_ID,
  TPL_STEM_ID,
  TPL_ROMAN_ID,
  TPL_PROMPT_ID,
  TPL_OPTIONS_ID,
  computeTemplateCardMetrics,
} from '../utils/templateBoxLayout';

type ResizePatch = Partial<Pick<SlideTextBox, 'w' | 'h'>>;

interface SlideTextBoxOverlayProps {
  boxes: SlideTextBox[];
  selectedId: string | null;
  item: MCQItem;
  config: DeckConfig;
  currentIndex: number;
  scale: number; // slideScale — converts client px deltas into 1920x1080 canvas px
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, patch: ResizePatch) => void;
  // Optional design-space bounds for canvases that are NOT 1920x1080
  // (e.g. the social post generator uses a square/portrait canvas).
  designW?: number;
  designH?: number;
}

export const SlideTextBoxOverlay: React.FC<SlideTextBoxOverlayProps> = ({
  boxes,
  selectedId,
  item,
  config,
  currentIndex,
  scale,
  onSelect,
  onMove,
  onResize,
  designW = SLIDE_W,
  designH = SLIDE_H,
}) => {
  const dragRef = useRef<{ type: 'move' | 'resize'; boxId: string; startX: number; startY: number; orig: SlideTextBox } | null>(null);
  // Only the hovered/selected box shows its bind-name chip + resize handle — with
  // a dense template (a dozen+ boxes packed close together) showing every chip at
  // once buries the actual slide content under overlapping labels.
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const startDrag = (e: React.PointerEvent, boxId: string, type: 'move' | 'resize') => {
    e.stopPropagation();
    const targetEl = e.currentTarget as HTMLElement;
    if (targetEl.setPointerCapture && e.pointerId !== undefined) {
      try { targetEl.setPointerCapture(e.pointerId); } catch {}
    }
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;
    onSelect(boxId);
    dragRef.current = { type, boxId, startX: e.clientX, startY: e.clientY, orig: { ...box } };

    const handleMove = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d || scale <= 0) return;
      const dx = (ev.clientX - d.startX) / scale;
      const dy = (ev.clientY - d.startY) / scale;
      if (d.type === 'move') {
        onMove(d.boxId, clamp(Math.round(d.orig.x + dx), 0, designW - d.orig.w), clamp(Math.round(d.orig.y + dy), 0, designH - 40));
      } else {
        const isElement = d.orig.bind === 'icon' || d.orig.bind === 'image';
        const newW = clamp(Math.round(d.orig.w + dx), 60, designW - d.orig.x);
        if (isElement) {
          // Aspect-locked resize: keep the box's original width:height ratio
          const ratio = d.orig.h && d.orig.h > 0 ? d.orig.w / d.orig.h : 16 / 9;
          const newH = clamp(Math.round(newW / ratio), 40, designH - d.orig.y);
          onResize(d.boxId, { w: newW, h: newH });
        } else {
          onResize(d.boxId, { w: newW });
        }
      }
    };
    const handleUp = (ev: PointerEvent) => {
      if (targetEl.releasePointerCapture && ev.pointerId !== undefined) {
        try { targetEl.releasePointerCapture(ev.pointerId); } catch {}
      }
      dragRef.current = null;
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const renderInvisible = (box: SlideTextBox) => {
    if (box.bind === 'options') {
      return (
        <div className="space-y-2.5">
          {item.options.map(o => (
            <div key={o.key}>{o.key}. {o.text}</div>
          ))}
        </div>
      );
    }
    if (box.bind === 'roman') {
      return (
        <div className="space-y-2.5">
          {(item.romanItems || []).map((s, i) => (
            <div key={i}>{s}</div>
          ))}
        </div>
      );
    }
    if (box.bind === 'icon') return ' ';
    if (box.bind === 'image') return ' ';
    return getSlideBoxContent(box, item, config, currentIndex);
  };

  // The preset template's card/roman/prompt/options boxes render at content-
  // adaptive positions (see templateBoxLayout.ts / SlideTextBoxLayer) instead
  // of their stored x/y for bohupodi (roman-statement) questions — otherwise
  // the drag outline here would float away from the actual slide content.
  // Dragging still reads/writes the real stored box, this only affects where
  // the (non-adaptive) outline for these specific ids is drawn.
  const cardBox = boxes.find(b => b.id.startsWith(TPL_CARD_ID));
  const stemBox = boxes.find(b => b.id.startsWith(TPL_STEM_ID));
  const romanBoxForMetrics = boxes.find(b => b.id.startsWith(TPL_ROMAN_ID));
  const optionsBoxForMetrics = boxes.find(b => b.id.startsWith(TPL_OPTIONS_ID));
  const cardMetrics = cardBox
    ? computeTemplateCardMetrics(item, cardBox, stemBox, romanBoxForMetrics, optionsBoxForMetrics?.y ?? cardBox.y)
    : undefined;

  return (
    <div className="absolute inset-0 z-30">
      {boxes.map(box => {
        const selected = box.id === selectedId;
        const active = selected || box.id === hoveredId;
        const isElement = box.bind === 'icon' || box.bind === 'image';

        let displayY = box.y;
        let displayH = box.h;
        if (cardMetrics) {
          if (box.id.startsWith(TPL_OPTIONS_ID)) displayY = cardMetrics.optionsY;
          else if (box.id.startsWith(TPL_ROMAN_ID) && cardMetrics.romanY !== undefined) displayY = cardMetrics.romanY;
          else if (box.id.startsWith(TPL_PROMPT_ID) && cardMetrics.promptY !== undefined) displayY = cardMetrics.promptY;
          else if (box.id.startsWith(TPL_CARD_ID)) displayH = cardMetrics.cardH;
        }

        // Keep the label chip fully inside the slide canvas: it sits BELOW the box
        // when the box is near the top (so it never pokes toward the controls bar),
        // and above the box only when below would clip at the slide bottom.
        const boxH = displayH || 40;
        const chipBelow = displayY < 56 || displayY + boxH + 28 <= designH;
        return (
          <div
            key={box.id}
            onPointerDown={(e) => startDrag(e, box.id, 'move')}
            onPointerEnter={() => setHoveredId(box.id)}
            onPointerLeave={() => setHoveredId((prev) => (prev === box.id ? null : prev))}
            className="absolute cursor-move"
            style={{ left: box.x, top: displayY, width: box.w, height: displayH || undefined }}
          >
            <div
              className={`relative w-full h-full border rounded-lg pointer-events-none transition-colors ${
                selected ? 'border-amber-400 ring-2 ring-amber-400/40' : active ? 'border-amber-400/70' : 'border-white/25'
              }`}
              style={{ fontSize: box.fontSize }}
            >
              <div className={`${isElement ? 'invisible h-full' : 'invisible whitespace-pre-wrap leading-snug font-bold'}`}>
                {isElement ? (
                  <div className="h-full w-full" />
                ) : (
                  renderInvisible(box)
                )}
              </div>
              {active && (
                <span className={`absolute left-0 text-xs font-black uppercase px-2 py-1 rounded leading-none z-10 ${
                  chipBelow ? 'top-full mt-1' : '-top-7'
                } ${
                  selected ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-amber-300 border border-white/20'
                }`}>
                  {box.bind}
                </span>
              )}
            </div>
            {active && (
              <span
                onPointerDown={(e) => startDrag(e, box.id, 'resize')}
                className={`absolute -bottom-3 -right-3 w-6 h-6 rounded-md cursor-nwse-resize border-2 border-slate-950 shadow z-10 ${
                  selected ? 'bg-amber-400' : 'bg-amber-500'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
