import React, { useRef, useState, useEffect } from 'react';
import { MCQItem, DeckConfig } from '../types';
import { SlideCanvas } from './SlideCanvas';
import { CheckCircle2 } from 'lucide-react';

// Real first-slide thumbnail — renders the deck's slide 1 at card scale.
// Shared by the Home deck cards and the My Decks library cards.
interface DeckSlideThumbProps {
  items: MCQItem[];
  config: DeckConfig;
  templateName: string;
  isCurrent?: boolean;
}

export const DeckSlideThumb: React.FC<DeckSlideThumbProps> = ({ items, config, templateName, isCurrent }) => {
  const thumbRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = thumbRef.current;
    if (!el) return;
    const update = () => {
      if (el.clientWidth > 0) setScale(el.clientWidth / 1920);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={thumbRef}
      className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-lg group-hover:scale-[1.02] transition-transform"
    >
      {items.length > 0 && scale > 0 ? (
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{ width: 1920, height: 1080, transform: `scale(${scale})` }}
        >
          <SlideCanvas item={items[0]} config={config} currentIndex={0} totalCount={items.length} />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-950">
          <span className="text-[11px] font-bold text-slate-500">No slides yet</span>
        </div>
      )}

      {/* Active deck badge */}
      {isCurrent && (
        <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black shadow-md z-10">
          <CheckCircle2 className="w-3 h-3" /> Active
        </span>
      )}

      {/* Template name badge */}
      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/55 text-white backdrop-blur text-[10px] font-bold z-10">
        {templateName}
      </span>
    </div>
  );
};
