import React, { useRef } from 'react';
import { MCQItem, DeckConfig, SlideTextBox } from '../types';
import { getSlideBoxContent, clamp, SLIDE_W, SLIDE_H } from '../utils/slideTextBoxes';

interface SlideTextBoxOverlayProps {
  boxes: SlideTextBox[];
  selectedId: string | null;
  item: MCQItem;
  config: DeckConfig;
  currentIndex: number;
  scale: number; // slideScale — converts client px deltas into 1920x1080 canvas px
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, w: number) => void;
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
}) => {
  const dragRef = useRef<{ type: 'move' | 'resize'; boxId: string; startX: number; startY: number; orig: SlideTextBox } | null>(null);

  const startDrag = (e: React.PointerEvent, boxId: string, type: 'move' | 'resize') => {
    e.stopPropagation();
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
        onMove(d.boxId, clamp(d.orig.x + dx, 0, SLIDE_W - d.orig.w), clamp(d.orig.y + dy, 0, SLIDE_H - 40));
      } else {
        onResize(d.boxId, clamp(d.orig.w + dx, 60, SLIDE_W - d.orig.x));
      }
    };
    const handleUp = () => {
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
    return getSlideBoxContent(box, item, config, currentIndex);
  };

  return (
    <div className="absolute inset-0 z-30">
      {boxes.map(box => {
        const selected = box.id === selectedId;
        return (
          <div
            key={box.id}
            onPointerDown={(e) => startDrag(e, box.id, 'move')}
            className="absolute cursor-move"
            style={{ left: box.x, top: box.y, width: box.w }}
          >
            <div
              className={`relative w-full h-full border rounded-lg pointer-events-none transition-colors ${selected ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-white/40'}`}
              style={{ fontSize: box.fontSize }}
            >
              <div className="invisible whitespace-pre-wrap leading-snug font-bold">
                {renderInvisible(box)}
              </div>
              <span className={`absolute -top-7 left-0 text-xs font-black uppercase px-2 py-1 rounded leading-none ${
                selected ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-amber-300 border border-white/20'
              }`}>
                {box.bind}
              </span>
            </div>
            <span
              onPointerDown={(e) => startDrag(e, box.id, 'resize')}
              className={`absolute -bottom-3 -right-3 w-6 h-6 rounded-md cursor-nwse-resize border-2 border-slate-950 shadow ${
                selected ? 'bg-amber-400' : 'bg-amber-500'
              }`}
            />
          </div>
        );
      })}
    </div>
  );
};
