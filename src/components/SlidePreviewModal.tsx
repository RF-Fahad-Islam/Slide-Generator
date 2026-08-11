import React, { useEffect, useRef, useState } from 'react';
import { DeckConfig, MCQItem } from '../types';
import { SlideCanvas } from './SlideCanvas';
import { MathText } from './MathText';
import { expandDeckSlides, SlideRef } from '../utils/answerSlides';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Sparkles,
  Presentation,
  CheckCircle2,
} from 'lucide-react';

interface SlidePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MCQItem[];
  config: DeckConfig;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  isAnswerRevealMode: boolean;
  onToggleAnswerReveal: () => void;
  appTheme: 'dark' | 'light';
}

export const SlidePreviewModal: React.FC<SlidePreviewModalProps> = ({
  isOpen,
  onClose,
  items,
  config,
  selectedIndex,
  onSelectIndex,
  isAnswerRevealMode,
  onToggleAnswerReveal,
  appTheme,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0.7);

  const expandedSlides = expandDeckSlides(items, config);
  const activeSlideRef: SlideRef | undefined = expandedSlides[selectedIndex];
  const activeQuestionIndex =
    activeSlideRef?.questionIndex ?? Math.min(selectedIndex, Math.max(0, items.length - 1));
  const currentItem = items[activeQuestionIndex] || items[0];

  // Auto scale to maximize canvas size inside modal viewport
  useEffect(() => {
    if (!isOpen) return;

    const updateScale = () => {
      const el = containerRef.current;
      if (!el) return;
      const maxW = el.clientWidth - 40;
      const maxH = el.clientHeight - 40;
      if (maxW > 0 && maxH > 0) {
        const scaleX = maxW / 1920;
        const scaleY = maxH / 1080;
        setScale(Math.min(scaleX, scaleY, 0.95));
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isOpen, selectedIndex]);

  // Listen for keyboard navigation in large preview mode
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (selectedIndex < expandedSlides.length - 1) {
          onSelectIndex(selectedIndex + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (selectedIndex > 0) {
          onSelectIndex(selectedIndex - 1);
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        onToggleAnswerReveal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, expandedSlides.length, onClose, onSelectIndex, onToggleAnswerReveal]);

  if (!isOpen || !currentItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-2xl text-white animate-fadeIn">
      {/* TOP HEADER BAR */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/80 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
            <Maximize2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-mono text-xs font-black">
                Slide #{selectedIndex + 1} of {expandedSlides.length}
              </span>
              {activeSlideRef?.isAnswerSlide && (
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500 text-slate-950 font-mono text-xs font-black">
                  Answer Slide
                </span>
              )}
            </div>
            <h2 className="text-sm sm:text-base font-extrabold truncate max-w-[400px] mt-0.5 text-slate-200">
              <MathText text={currentItem.stem} />
            </h2>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-3">
          {/* Answer Toggle */}
          <button
            onClick={onToggleAnswerReveal}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer border ${
              isAnswerRevealMode
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-200 border-white/10 hover:border-amber-500/40'
            }`}
          >
            {isAnswerRevealMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{isAnswerRevealMode ? 'Answer Revealed' : 'Hide Answer'}</span>
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-white/10 hover:border-rose-500/40 transition-all cursor-pointer"
            title="Close modal (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* CANVAS PREVIEW AREA */}
      <div
        ref={containerRef}
        className="flex-1 relative w-full h-full flex items-center justify-center p-6 overflow-hidden select-none"
      >
        {/* Floating Previous Slide Button */}
        <button
          onClick={() => onSelectIndex(Math.max(0, selectedIndex - 1))}
          disabled={selectedIndex === 0}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-slate-900/90 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xl"
          title="Previous slide (Left arrow)"
        >
          <ChevronLeft className="w-8 h-8 stroke-[3]" />
        </button>

        {/* Floating Next Slide Button */}
        <button
          onClick={() => onSelectIndex(Math.min(expandedSlides.length - 1, selectedIndex + 1))}
          disabled={selectedIndex >= expandedSlides.length - 1}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-slate-900/90 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xl"
          title="Next slide (Right arrow)"
        >
          <ChevronRight className="w-8 h-8 stroke-[3]" />
        </button>

        {/* 16:9 Scaled Slide Canvas */}
        <div
          className="relative overflow-hidden rounded-3xl bg-slate-950 shadow-2xl border border-white/10 flex items-center justify-center transition-transform duration-200"
          style={{
            width: `${Math.round(1920 * scale)}px`,
            height: `${Math.round(1080 * scale)}px`,
          }}
        >
          <div
            style={{
              width: '1920px',
              height: '1080px',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <SlideCanvas
              item={currentItem}
              config={config}
              currentIndex={activeQuestionIndex}
              totalCount={items.length}
              isAnswerRevealMode={isAnswerRevealMode}
              slideVariant={activeSlideRef?.isAnswerSlide ? 'answer' : 'question'}
            />
          </div>
        </div>
      </div>

      {/* FOOTER BAR */}
      <div className="flex items-center justify-between px-8 py-3 border-t border-white/10 bg-slate-900/90 text-xs text-slate-400 shrink-0 font-medium">
        <div className="flex items-center gap-6">
          <span>Keyboard: <strong className="text-amber-400 font-mono">← / →</strong> navigate</span>
          <span><strong className="text-amber-400 font-mono">Space</strong> toggle answer</span>
          <span><strong className="text-amber-400 font-mono">Esc</strong> close preview</span>
        </div>
        <div className="font-mono text-amber-400/90 font-bold">
          {selectedIndex + 1} / {expandedSlides.length} Slides
        </div>
      </div>
    </div>
  );
};
