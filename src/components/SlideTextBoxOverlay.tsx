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
  selectedId?: string | null;
  selectedIds?: string[];
  item: MCQItem;
  config: DeckConfig;
  currentIndex: number;
  scale: number; // slideScale — converts client px deltas into 1920x1080 canvas px
  onSelect: (id: string | null, isMulti?: boolean) => void;
  onSelectIds?: (ids: string[]) => void;
  onMove: (id: string, x: number, y: number) => void;
  onMoveBoxes?: (updates: { id: string; x: number; y: number }[]) => void;
  onResize: (id: string, patch: ResizePatch) => void;
  // Optional design-space bounds for canvases that are NOT 1920x1080
  // (e.g. the social post generator uses a square/portrait canvas).
  designW?: number;
  designH?: number;
}

export const SlideTextBoxOverlay: React.FC<SlideTextBoxOverlayProps> = ({
  boxes,
  selectedId,
  selectedIds,
  item,
  config,
  currentIndex,
  scale,
  onSelect,
  onSelectIds,
  onMove,
  onMoveBoxes,
  onResize,
  designW = SLIDE_W,
  designH = SLIDE_H,
}) => {
  const activeSelectedIds = selectedIds ?? (selectedId ? [selectedId] : []);
  const dragRef = useRef<{
    type: 'move' | 'resize';
    boxId: string;
    startX: number;
    startY: number;
    orig: SlideTextBox;
    origBoxes: SlideTextBox[];
  } | null>(null);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  const startCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (scale || 1);
    const y = (e.clientY - rect.top) / (scale || 1);
    setMarquee({ startX: x, startY: y, currentX: x, currentY: y });

    const handlePointerMove = (ev: PointerEvent) => {
      const curX = (ev.clientX - rect.left) / (scale || 1);
      const curY = (ev.clientY - rect.top) / (scale || 1);
      setMarquee(m => (m ? { ...m, currentX: curX, currentY: curY } : null));
    };

    const handlePointerUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      setMarquee(m => {
        if (m) {
          const x1 = Math.min(m.startX, m.currentX);
          const x2 = Math.max(m.startX, m.currentX);
          const y1 = Math.min(m.startY, m.currentY);
          const y2 = Math.max(m.startY, m.currentY);
          const isDrag = Math.abs(x2 - x1) > 5 || Math.abs(y2 - y1) > 5;
          if (isDrag) {
            const hit = boxes
              .filter(box => {
                const bX1 = box.x;
                const bX2 = box.x + box.w;
                const bY1 = box.y;
                const bY2 = box.y + (box.h || 40);
                return bX1 < x2 && bX2 > x1 && bY1 < y2 && bY2 > y1;
              })
              .map(b => b.id);

            if (onSelectIds) onSelectIds(hit);
            else if (hit.length > 0) onSelect(hit[0]);
            else onSelect(null);
          } else {
            if (onSelectIds) onSelectIds([]);
            else onSelect(null);
          }
        }
        return null;
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const startDrag = (e: React.PointerEvent, boxId: string, type: 'move' | 'resize') => {
    e.stopPropagation();
    const targetEl = e.currentTarget as HTMLElement;
    if (targetEl.setPointerCapture && e.pointerId !== undefined) {
      try { targetEl.setPointerCapture(e.pointerId); } catch {}
    }
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;

    let currentSelected = [...activeSelectedIds];
    if (e.shiftKey) {
      if (currentSelected.includes(boxId)) {
        currentSelected = currentSelected.filter(id => id !== boxId);
      } else {
        currentSelected.push(boxId);
      }
      if (onSelectIds) onSelectIds(currentSelected);
      else onSelect(boxId, true);
    } else {
      if (!currentSelected.includes(boxId)) {
        currentSelected = [boxId];
        if (onSelectIds) onSelectIds(currentSelected);
        else onSelect(boxId);
      }
    }

    const origBoxes = boxes.filter(b => currentSelected.includes(b.id)).map(b => ({ ...b }));
    dragRef.current = { type, boxId, startX: e.clientX, startY: e.clientY, orig: { ...box }, origBoxes };

    const handleMove = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d || scale <= 0) return;
      const dx = (ev.clientX - d.startX) / scale;
      const dy = (ev.clientY - d.startY) / scale;

      if (d.type === 'move') {
        if (d.origBoxes.length > 1) {
          const updates = d.origBoxes.map(b => ({
            id: b.id,
            x: clamp(Math.round(b.x + dx), 0, designW - b.w),
            y: clamp(Math.round(b.y + dy), 0, designH - 40),
          }));
          if (onMoveBoxes) {
            onMoveBoxes(updates);
          } else {
            updates.forEach(u => onMove(u.id, u.x, u.y));
          }
        } else {
          onMove(d.boxId, clamp(Math.round(d.orig.x + dx), 0, designW - d.orig.w), clamp(Math.round(d.orig.y + dy), 0, designH - 40));
        }
      } else {
        const isElement = d.orig.bind === 'icon' || d.orig.bind === 'image';
        const newW = clamp(Math.round(d.orig.w + dx), 60, designW - d.orig.x);
        if (isElement) {
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

  const cardBox = boxes.find(b => b.id.startsWith(TPL_CARD_ID));
  const stemBox = boxes.find(b => b.id.startsWith(TPL_STEM_ID));
  const romanBoxForMetrics = boxes.find(b => b.id.startsWith(TPL_ROMAN_ID));
  const optionsBoxForMetrics = boxes.find(b => b.id.startsWith(TPL_OPTIONS_ID));
  const is2ColMode = (config.optionsLayout || '2col') === '2col';
  const cardMetrics = cardBox
    ? computeTemplateCardMetrics(item, cardBox, stemBox, romanBoxForMetrics, optionsBoxForMetrics?.y ?? cardBox.y, is2ColMode)
    : undefined;

  return (
    <div className="absolute inset-0 z-30" onPointerDown={startCanvasPointerDown}>
      {marquee && (() => {
        const left = Math.min(marquee.startX, marquee.currentX);
        const top = Math.min(marquee.startY, marquee.currentY);
        const width = Math.abs(marquee.currentX - marquee.startX);
        const height = Math.abs(marquee.currentY - marquee.startY);
        return (
          <div
            className="absolute border-2 border-amber-400 bg-amber-500/20 rounded-md pointer-events-none z-40 shadow-lg"
            style={{ left, top, width, height }}
          />
        );
      })()}

      {boxes.map(box => {
        const selected = activeSelectedIds.includes(box.id);
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
                selected ? 'border-amber-400 ring-2 ring-amber-400/40 bg-amber-400/5' : active ? 'border-amber-400/70' : 'border-white/25'
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
                  selected ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-amber-300 border border-white/20'
                }`}>
                  {box.bind} {activeSelectedIds.length > 1 && selected ? `(#${activeSelectedIds.indexOf(box.id) + 1})` : ''}
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
