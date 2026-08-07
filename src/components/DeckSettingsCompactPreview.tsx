import React, { useState, useEffect, useRef } from 'react';
import { DeckConfig, MCQItem } from '../types';
import { SlideCanvas } from './SlideCanvas';
import { Eye, Maximize2 } from 'lucide-react';

interface DeckSettingsCompactPreviewProps {
  config: DeckConfig;
  slideConfig?: Partial<DeckConfig>;
  item?: MCQItem;
  activeSlideIndex: number;
  totalCount: number;
  appTheme?: 'dark' | 'light';
  onExpand: () => void;
}

// Sticky compact slide preview on the right of the Deck Settings page — a live
// 16:9 render of the DRAFT config (deck draft + slide draft), toggleable from
// the page header. "Expand" opens the same slide in the full Preview modal.
export const DeckSettingsCompactPreview: React.FC<DeckSettingsCompactPreviewProps> = ({
  config,
  slideConfig,
  item,
  activeSlideIndex,
  totalCount,
  appTheme = 'dark',
  onExpand,
}) => {
  const isAppLight = appTheme === 'light';

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
      className={`rounded-3xl border shadow-xl overflow-hidden ${
        isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between gap-2 px-4 py-3 border-b ${
        isAppLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
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
        <button
          type="button"
          onClick={onExpand}
          className={`shrink-0 p-2 rounded-lg cursor-pointer transition-colors ${
            isAppLight
              ? 'bg-slate-100 text-slate-500 hover:text-amber-600 border border-slate-200'
              : 'bg-slate-950 text-slate-400 hover:text-amber-400 border border-slate-800'
          }`}
          title="Open full-size preview"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Slide body — compact 16:9 render */}
      <div className="p-3 sm:p-4">
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
      </div>
    </div>
  );
};
