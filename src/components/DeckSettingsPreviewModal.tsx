import React, { useState, useEffect, useRef } from 'react';
import { DeckConfig, MCQItem } from '../types';
import { SlideCanvas } from './SlideCanvas';
import { X, Eye } from 'lucide-react';

interface DeckSettingsPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DeckConfig;
  slideConfig?: Partial<DeckConfig>;
  item?: MCQItem;
  activeSlideIndex: number;
  totalCount: number;
  appTheme?: 'dark' | 'light';
}

// Large focused preview of the active slide rendered from the deck-settings
// DRAFT config (deck draft + slide draft) — opened from the "Preview Slide"
// button on the Deck Settings page. Uses the same ResizeObserver-scaled
// 1920x1080 SlideCanvas as the old inline preview panel.
export const DeckSettingsPreviewModal: React.FC<DeckSettingsPreviewModalProps> = ({
  isOpen,
  onClose,
  config,
  slideConfig,
  item,
  activeSlideIndex,
  totalCount,
  appTheme = 'dark',
}) => {
  const isAppLight = appTheme === 'light';

  const previewRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState<number>(0);
  useEffect(() => {
    if (!isOpen) return;
    const el = previewRef.current;
    if (!el) return;
    const update = () => {
      if (el.clientWidth > 0) setPreviewScale(el.clientWidth / 1920);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen]);

  if (!isOpen) return null;

  // The real item, but its per-slide override is the DRAFT slide config so the
  // preview reflects not-yet-applied slide-scope edits.
  const previewItem: MCQItem | undefined = item
    ? { ...item, customConfig: slideConfig }
    : item;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md animate-modal-backdrop ${
        isAppLight ? 'bg-black/40' : 'bg-black/80'
      }`}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-5xl border rounded-3xl overflow-hidden shadow-2xl animate-modal-card ${
          isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b ${
          isAppLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25">
              <Eye className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className={`text-base font-black ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                Slide Preview
              </h3>
              <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Live preview of Slide #{activeSlideIndex + 1} with your pending settings.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
              isAppLight
                ? 'bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
            title="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slide body */}
        <div className="p-4 sm:p-6">
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
          <p className={`text-[11px] font-semibold mt-3 flex items-center gap-1.5 ${
            isAppLight ? 'text-slate-500' : 'text-slate-500'
          }`}>
            <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            Preview only — changes are not applied to the deck yet.
          </p>
        </div>
      </div>
    </div>
  );
};
