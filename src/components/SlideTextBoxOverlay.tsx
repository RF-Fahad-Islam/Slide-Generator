import React, { useRef, useState, useEffect, useCallback } from 'react';
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
type ResizeHandle = 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w';

interface SlideTextBoxOverlayProps {
  boxes: SlideTextBox[];
  selectedId?: string | null;
  selectedIds?: string[];
  item: MCQItem;
  config: DeckConfig;
  currentIndex: number;
  scale: number; // slideScale — converts client px deltas into canvas px
  onSelect: (id: string | null, isMulti?: boolean) => void;
  onSelectIds?: (ids: string[]) => void;
  onMove: (id: string, x: number, y: number) => void;
  onMoveBoxes?: (updates: { id: string; x: number; y: number }[]) => void;
  onResize: (id: string, patch: ResizePatch) => void;
  onDeleteBox?: (id: string) => void;
  designW?: number;
  designH?: number;
}

interface DragState {
  type: 'move' | 'resize';
  handle?: ResizeHandle;
  boxId: string;
  startX: number;
  startY: number;
  orig: SlideTextBox;
  origBoxes: SlideTextBox[];
  origH: number;
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
  onDeleteBox,
  designW = SLIDE_W,
  designH = SLIDE_H,
}) => {
  const activeSelectedIds = selectedIds ?? (selectedId ? [selectedId] : []);
  const dragRef = useRef<DragState | null>(null);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeDragging, setActiveDragging] = useState<boolean>(false);
  const [activeGuides, setActiveGuides] = useState<{ x?: number; y?: number } | null>(null);
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  // Keyboard nudge & delete support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (activeSelectedIds.length === 0) return;

      const step = e.shiftKey ? 10 : 1;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        activeSelectedIds.forEach(id => {
          const b = boxes.find(x => x.id === id);
          if (b) onMove(id, clamp(b.x - step, 0, designW - b.w), b.y);
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        activeSelectedIds.forEach(id => {
          const b = boxes.find(x => x.id === id);
          if (b) onMove(id, clamp(b.x + step, 0, designW - b.w), b.y);
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeSelectedIds.forEach(id => {
          const b = boxes.find(x => x.id === id);
          if (b) onMove(id, b.x, clamp(b.y - step, 0, designH - (b.h || 40)));
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeSelectedIds.forEach(id => {
          const b = boxes.find(x => x.id === id);
          if (b) onMove(id, b.x, clamp(b.y + step, 0, designH - (b.h || 40)));
        });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (onDeleteBox) {
          e.preventDefault();
          activeSelectedIds.forEach(id => onDeleteBox(id));
        }
      } else if (e.key === 'Escape') {
        if (onSelectIds) onSelectIds([]);
        else onSelect(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSelectedIds, boxes, designW, designH, onMove, onDeleteBox, onSelect, onSelectIds]);

  // Marquee multi-select
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

  // Canva-style 8-handle Drag & Resize Gesture
  const startDrag = (e: React.PointerEvent, boxId: string, type: 'move' | 'resize', handle?: ResizeHandle) => {
    e.stopPropagation();
    const targetEl = e.currentTarget as HTMLElement;
    if (targetEl.setPointerCapture && e.pointerId !== undefined) {
      try { targetEl.setPointerCapture(e.pointerId); } catch {}
    }
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;

    let currentSelected = [...activeSelectedIds];
    if (e.shiftKey && type === 'move') {
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
    const origH = box.h || Math.max(48, Math.round(box.fontSize * 2.2));

    dragRef.current = {
      type,
      handle,
      boxId,
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...box },
      origBoxes,
      origH,
    };
    setActiveDragging(true);

    const handleMove = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d || scale <= 0) return;
      const dx = (ev.clientX - d.startX) / scale;
      const dy = (ev.clientY - d.startY) / scale;

      const guides: { x?: number; y?: number } = {};
      const SNAP_THRESHOLD = 7;

      if (d.type === 'move') {
        if (d.origBoxes.length > 1) {
          const updates = d.origBoxes.map(b => ({
            id: b.id,
            x: clamp(Math.round(b.x + dx), 0, designW - b.w),
            y: clamp(Math.round(b.y + dy), 0, designH - (b.h || 40)),
          }));
          if (onMoveBoxes) {
            onMoveBoxes(updates);
          } else {
            updates.forEach(u => onMove(u.id, u.x, u.y));
          }
        } else {
          let newX = Math.round(d.orig.x + dx);
          let newY = Math.round(d.orig.y + dy);

          // Snapping to Canvas Center & Margins
          const boxCenterOffsetX = d.orig.w / 2;
          const boxCenterOffsetY = (d.orig.h || 40) / 2;
          const canvasCenterX = designW / 2;
          const canvasCenterY = designH / 2;

          // Snap to Canvas Center X
          if (Math.abs(newX + boxCenterOffsetX - canvasCenterX) <= SNAP_THRESHOLD) {
            newX = Math.round(canvasCenterX - boxCenterOffsetX);
            guides.x = canvasCenterX;
          }
          // Snap to Canvas Center Y
          if (Math.abs(newY + boxCenterOffsetY - canvasCenterY) <= SNAP_THRESHOLD) {
            newY = Math.round(canvasCenterY - boxCenterOffsetY);
            guides.y = canvasCenterY;
          }

          setActiveGuides(Object.keys(guides).length > 0 ? guides : null);
          onMove(d.boxId, clamp(newX, 0, designW - d.orig.w), clamp(newY, 0, designH - (d.orig.h || 40)));
        }
      } else {
        // RESIZE GESTURE (8 Canva Handles)
        const h = d.handle || 'se';
        const isElement = d.orig.bind === 'icon' || d.orig.bind === 'image';
        const baseH = d.origH;

        let newW = d.orig.w;
        let newH = baseH;
        let newX = d.orig.x;
        let newY = d.orig.y;

        // East / West Width Calculations
        if (h.includes('e')) {
          newW = clamp(Math.round(d.orig.w + dx), 60, designW - d.orig.x);
        } else if (h.includes('w')) {
          const maxDx = d.orig.w - 60;
          const actualDx = Math.min(dx, maxDx);
          newX = clamp(Math.round(d.orig.x + actualDx), 0, designW - 60);
          newW = Math.round(d.orig.w - (newX - d.orig.x));
        }

        // North / South Height Calculations
        if (h.includes('s')) {
          newH = clamp(Math.round(baseH + dy), 24, designH - d.orig.y);
        } else if (h.includes('n')) {
          const maxDy = baseH - 24;
          const actualDy = Math.min(dy, maxDy);
          newY = clamp(Math.round(d.orig.y + actualDy), 0, designH - 24);
          newH = Math.round(baseH - (newY - d.orig.y));
        }

        // Fixed aspect ratio elements (icons & images)
        if (isElement && (h === 'se' || h === 'sw' || h === 'ne' || h === 'nw')) {
          const ratio = d.orig.h && d.orig.h > 0 ? d.orig.w / d.orig.h : 16 / 9;
          newH = clamp(Math.round(newW / ratio), 24, designH - newY);
        }

        // Apply coordinate movement if NW/NE/SW/W/N handles were dragged
        if (newX !== d.orig.x || newY !== d.orig.y) {
          onMove(d.boxId, newX, newY);
        }

        // Apply width and bounded height
        onResize(d.boxId, { w: newW, h: newH });
      }
    };

    const handleUp = (ev: PointerEvent) => {
      if (targetEl.releasePointerCapture && ev.pointerId !== undefined) {
        try { targetEl.releasePointerCapture(ev.pointerId); } catch {}
      }
      dragRef.current = null;
      setActiveDragging(false);
      setActiveGuides(null);
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
      {/* Smart Snapping Guide Lines */}
      {activeGuides?.x !== undefined && (
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] z-50 pointer-events-none"
          style={{ left: activeGuides.x }}
        />
      )}
      {activeGuides?.y !== undefined && (
        <div
          className="absolute left-0 right-0 h-[2px] bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] z-50 pointer-events-none"
          style={{ top: activeGuides.y }}
        />
      )}

      {/* Marquee Multi-Select Rect */}
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

      {/* Box Drag & Resize Overlays */}
      {boxes.map(box => {
        const selected = activeSelectedIds.includes(box.id);
        const active = selected || box.id === hoveredId;
        const isElement = box.bind === 'icon' || box.bind === 'image';
        const isBounded = typeof box.h === 'number' && box.h > 0;

        let displayY = box.y;
        let displayH = box.h;
        if (cardMetrics) {
          if (box.id.startsWith(TPL_OPTIONS_ID)) displayY = cardMetrics.optionsY;
          else if (box.id.startsWith(TPL_ROMAN_ID) && cardMetrics.romanY !== undefined) displayY = cardMetrics.romanY;
          else if (box.id.startsWith(TPL_PROMPT_ID) && cardMetrics.promptY !== undefined) displayY = cardMetrics.promptY;
          else if (box.id.startsWith(TPL_CARD_ID)) displayH = cardMetrics.cardH;
        }

        const boxH = displayH || Math.max(48, Math.round(box.fontSize * 2.2));
        const chipBelow = displayY < 56 || displayY + boxH + 28 <= designH;

        return (
          <div
            key={box.id}
            onPointerDown={(e) => startDrag(e, box.id, 'move')}
            onPointerEnter={() => setHoveredId(box.id)}
            onPointerLeave={() => setHoveredId((prev) => (prev === box.id ? null : prev))}
            className="absolute cursor-move group"
            style={{ left: box.x, top: displayY, width: box.w, height: displayH || undefined }}
          >
            {/* Box Frame & Outline */}
            <div
              className={`relative w-full h-full border rounded-lg transition-colors ${
                selected
                  ? isBounded
                    ? 'border-amber-400 ring-2 ring-amber-400/50 bg-amber-400/10'
                    : 'border-amber-400 ring-2 ring-amber-400/40 bg-amber-400/5'
                  : active
                  ? 'border-amber-400/80 bg-amber-400/5'
                  : isBounded
                  ? 'border-dashed border-amber-400/50 bg-amber-500/[0.02]'
                  : 'border-white/20'
              }`}
              style={{ fontSize: box.fontSize }}
            >
              {/* Invisible Ghost Content to match size */}
              <div className={`${isElement ? 'invisible h-full' : 'invisible whitespace-pre-wrap leading-snug font-bold'}`}>
                {isElement ? <div className="h-full w-full" /> : renderInvisible(box)}
              </div>

              {/* Floating Header Chip: Bind Type + Dimensions */}
              {active && (
                <div
                  className={`absolute left-0 flex items-center gap-1.5 z-20 pointer-events-none ${
                    chipBelow ? 'top-full mt-1.5' : '-top-7'
                  }`}
                >
                  <span
                    className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-md leading-none shadow-md flex items-center gap-1.5 ${
                      selected ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-amber-300 border border-white/20'
                    }`}
                  >
                    <span>{box.bind}</span>
                    {activeSelectedIds.length > 1 && selected && (
                      <span className="opacity-75">#{activeSelectedIds.indexOf(box.id) + 1}</span>
                    )}
                  </span>

                  {/* Dimension pill: e.g. 840×240px */}
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-950/90 text-amber-200 border border-amber-500/30 backdrop-blur-sm">
                    {box.w}×{box.h ? `${box.h}px` : 'auto'}
                  </span>

                  {isBounded && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Bounded Zone (Auto-Fit)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Canva-style 8-Handle Resize System (Visible when Selected) */}
            {selected && (
              <>
                {/* 1. North-West (Top-Left) Corner */}
                <div
                  onPointerDown={(e) => startDrag(e, box.id, 'resize', 'nw')}
                  className="absolute -top-2.5 -left-2.5 w-5 h-5 rounded-md bg-white border-2 border-amber-500 shadow-md cursor-nwse-resize z-30 hover:scale-125 transition-transform"
                  title="Resize Corner"
                />

                {/* 2. North-East (Top-Right) Corner */}
                <div
                  onPointerDown={(e) => startDrag(e, box.id, 'resize', 'ne')}
                  className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-md bg-white border-2 border-amber-500 shadow-md cursor-nesw-resize z-30 hover:scale-125 transition-transform"
                  title="Resize Corner"
                />

                {/* 3. South-East (Bottom-Right) Corner */}
                <div
                  onPointerDown={(e) => startDrag(e, box.id, 'resize', 'se')}
                  className="absolute -bottom-2.5 -right-2.5 w-5 h-5 rounded-md bg-white border-2 border-amber-500 shadow-md cursor-nwse-resize z-30 hover:scale-125 transition-transform"
                  title="Resize Corner"
                />

                {/* 4. South-West (Bottom-Left) Corner */}
                <div
                  onPointerDown={(e) => startDrag(e, box.id, 'resize', 'sw')}
                  className="absolute -bottom-2.5 -left-2.5 w-5 h-5 rounded-md bg-white border-2 border-amber-500 shadow-md cursor-nesw-resize z-30 hover:scale-125 transition-transform"
                  title="Resize Corner"
                />

                {/* 5. North (Top Edge) Handle */}
                <div
                  onPointerDown={(e) => startDrag(e, box.id, 'resize', 'n')}
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-3 rounded-full bg-white border-2 border-amber-500 shadow cursor-ns-resize z-30 hover:scale-125 transition-transform"
                  title="Resize Height (Top)"
                />

                {/* 6. South (Bottom Edge) Handle */}
                <div
                  onPointerDown={(e) => startDrag(e, box.id, 'resize', 's')}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-3 rounded-full bg-white border-2 border-amber-500 shadow cursor-ns-resize z-30 hover:scale-125 transition-transform"
                  title="Resize Height (Bottom)"
                />

                {/* 7. East (Right Edge) Handle */}
                <div
                  onPointerDown={(e) => startDrag(e, box.id, 'resize', 'e')}
                  className="absolute top-1/2 -translate-y-1/2 -right-2 w-3 h-6 rounded-full bg-white border-2 border-amber-500 shadow cursor-ew-resize z-30 hover:scale-125 transition-transform"
                  title="Resize Width (Right)"
                />

                {/* 8. West (Left Edge) Handle */}
                <div
                  onPointerDown={(e) => startDrag(e, box.id, 'resize', 'w')}
                  className="absolute top-1/2 -translate-y-1/2 -left-2 w-3 h-6 rounded-full bg-white border-2 border-amber-500 shadow cursor-ew-resize z-30 hover:scale-125 transition-transform"
                  title="Resize Width (Left)"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
