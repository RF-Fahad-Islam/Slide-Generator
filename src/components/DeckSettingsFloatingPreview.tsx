import React, { useState, useEffect, useRef } from 'react';
import { DeckConfig, MCQItem } from '../types';
import { SlideCanvas } from './SlideCanvas';
import { Eye, Maximize2, X, GripHorizontal } from 'lucide-react';

interface DeckSettingsFloatingPreviewProps {
  config: DeckConfig;
  slideConfig?: Partial<DeckConfig>;
  item?: MCQItem;
  activeSlideIndex: number;
  totalCount: number;
  appTheme?: 'dark' | 'light';
  onExpand: () => void;
  onClose: () => void;
}

interface Pos {
  x: number;
  y: number;
}

const POS_KEY = 'mcqgen.dspPosition';
const PREVIEW_W = 560; // preferred window width (px)
const BODY_PAD = 16; // px-4 on the slide body
const MAX_H = 520; // safety cap so the window never overflows tiny screens

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function loadPos(): Pos {
  const defaultX = Math.max(16, window.innerWidth - PREVIEW_W - 24);
  const defaults: Pos = { x: defaultX, y: 96 };
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Pos>;
      return {
        x: clamp(typeof p.x === 'number' ? p.x : defaults.x, 8, Math.max(8, window.innerWidth - PREVIEW_W - 8)),
        y: clamp(typeof p.y === 'number' ? p.y : defaults.y, 8, Math.max(8, window.innerHeight - 180)),
      };
    }
  } catch {
    // fall through to defaults
  }
  return defaults;
}

// Floating, draggable slide preview for the Deck Settings page. Bigger than the old
// sticky column, closes with an X, and can be dragged anywhere on screen by its header.
export const DeckSettingsFloatingPreview: React.FC<DeckSettingsFloatingPreviewProps> = ({
  config,
  slideConfig,
  item,
  activeSlideIndex,
  totalCount,
  appTheme = 'dark',
  onExpand,
  onClose,
}) => {
  const isAppLight = appTheme === 'light';

  const [pos, setPos] = useState<Pos>(() => loadPos());
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const posRef = useRef<Pos>(pos);
  const setBothPos = (next: Pos) => {
    posRef.current = next;
    setPos(next);
  };

  // Effective window width — capped to the viewport on small screens.
  const winW = Math.min(PREVIEW_W, Math.max(240, window.innerWidth - 32));

  // Persist the dragged position.
  const persistPos = (p: Pos) => {
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(p));
    } catch {
      // storage unavailable
    }
  };

  const handleHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleHeaderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const next: Pos = {
      x: clamp(dragRef.current.origX + dx, 8, Math.max(8, window.innerWidth - winW - 8)),
      y: clamp(dragRef.current.origY + dy, 8, Math.max(8, window.innerHeight - 180)),
    };
    setBothPos(next);
  };

  const handleHeaderPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    persistPos(posRef.current);
  };

  const previewRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState<number>(0);
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const update = () => {
      if (el.clientWidth > 0) setPreviewScale(el.clientWidth / 1920);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The real item, but its per-slide override is the DRAFT slide config so the
  // preview reflects not-yet-applied slide-scope edits.
  const previewItem: MCQItem | undefined = item
    ? { ...item, customConfig: slideConfig }
    : item;

  return (
    <div
      className={`fixed z-40 rounded-3xl border shadow-2xl overflow-hidden ${
        isAppLight ? 'bg-white border-slate-200 shadow-black/10' : 'bg-slate-900 border-slate-800 shadow-black/60'
      }`}
      style={{ left: pos.x, top: pos.y, width: winW }}
      role="dialog"
      aria-label="Deck settings live slide preview"
    >
      {/* Draggable header */}
      <div
        onPointerDown={handleHeaderPointerDown}
        onPointerMove={handleHeaderPointerMove}
        onPointerUp={handleHeaderPointerUp}
        className={`flex items-center justify-between gap-2 px-4 py-3 border-b cursor-move touch-none select-none ${
          isAppLight ? 'border-slate-200' : 'border-slate-800'
        }`}
        title="Drag to move the preview"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25 shrink-0">
            <Eye className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h4 className={`text-sm font-black truncate ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
              Slide Preview
            </h4>
            <p className={`text-[10px] font-semibold truncate ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Slide #{activeSlideIndex + 1} · live draft
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <GripHorizontal className={`w-4 h-4 ${isAppLight ? 'text-slate-400' : 'text-slate-600'}`} />
          <button
            type="button"
            onClick={onExpand}
            disabled={!item}
            className={`shrink-0 p-2 rounded-lg cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              isAppLight
                ? 'bg-slate-100 text-slate-500 hover:text-amber-600 border border-slate-200'
                : 'bg-slate-950 text-slate-400 hover:text-amber-400 border border-slate-800'
            }`}
            title={item ? 'Open full-size preview' : 'No slide to preview'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`shrink-0 p-2 rounded-lg cursor-pointer transition-colors ${
              isAppLight
                ? 'bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-200'
                : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
            }`}
            title="Close preview"
            aria-label="Close preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slide body — bigger 16:9 render */}
      <div className="p-4">
        <div
          ref={previewRef}
          className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl"
        >
          {previewScale > 0 && previewItem && (
            <div
              className="absolute top-0 left-0 origin-top-left"
              style={{ width: 1920, height: 1080, transform: `scale(${previewScale})` }}
            >
              <SlideCanvas
                item={previewItem}
                config={config}
                currentIndex={activeSlideIndex}
                totalCount={totalCount}
                isAnswerRevealMode={false}
              />
            </div>
          )}
        </div>
        <p className={`text-[10px] mt-2 text-center font-semibold ${isAppLight ? 'text-slate-400' : 'text-slate-500'}`}>
          Drag the header to move · Maximize for full-size
        </p>
      </div>
    </div>
  );
};
