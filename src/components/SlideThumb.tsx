import React, { useRef, useState, useEffect } from 'react';
import { MCQItem, DeckConfig } from '../types';
import { SlideCanvas } from './SlideCanvas';

interface SlideThumbProps {
  item: MCQItem;
  config: DeckConfig;
  index: number;
  totalCount: number;
  isAnswerRevealMode?: boolean;
  slideVariant?: 'question' | 'answer';
  className?: string;
}

// Real slide thumbnail — renders the exact slide (template + text boxes) at card scale,
// matching what the Slide Studio / generator produces. Uses the same ResizeObserver
// scale technique as the home-page deck library thumbnails.
export const SlideThumb: React.FC<SlideThumbProps> = ({
  item,
  config,
  index,
  totalCount,
  isAnswerRevealMode = false,
  slideVariant = 'question',
  className = '',
}) => {
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
      className={`relative aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-slate-950 ${className}`}
    >
      {scale > 0 && (
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{ width: 1920, height: 1080, transform: `scale(${scale})` }}
        >
          <SlideCanvas
            item={item}
            config={config}
            currentIndex={index}
            totalCount={totalCount}
            isAnswerRevealMode={isAnswerRevealMode}
            slideVariant={slideVariant}
          />
        </div>
      )}
    </div>
  );
};
