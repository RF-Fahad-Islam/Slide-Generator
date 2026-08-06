import React, { useState, useEffect, useRef } from 'react';
import { DeckConfig, MCQItem } from '../types';
import { DeckSettings } from './DeckSettings';
import { SlideCanvas } from './SlideCanvas';
import { X, Sliders, CheckCircle2, Eye, RefreshCw } from 'lucide-react';

interface DeckSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DeckConfig;
  onApplyConfig: (updated: DeckConfig) => void;
  activeSlideIndex: number;
  activeSlideConfig?: Partial<DeckConfig>;
  onApplyActiveSlideConfig: (updated: Partial<DeckConfig>) => void;
  onResetActiveSlideConfig: () => void;
  items: MCQItem[];
  appTheme?: 'dark' | 'light';
  // Classroom View quick action — enforces class_mode + classroom text boxes on
  // the whole deck, then hands off to the box editor.
  onEnforceClassroomView?: () => void;
}

// Deck-scoped settings modal for Slide Studio. Edits a DRAFT config with a live
// slide preview — nothing is applied to the deck until "Apply to All" is clicked.
export const DeckSettingsModal: React.FC<DeckSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onApplyConfig,
  activeSlideIndex,
  activeSlideConfig,
  onApplyActiveSlideConfig,
  onResetActiveSlideConfig,
  items,
  appTheme = 'dark',
  onEnforceClassroomView,
}) => {
  const isAppLight = appTheme === 'light';

  // Draft state — initialized from the real deck config every time the modal opens.
  const [draftConfig, setDraftConfig] = useState<DeckConfig>(config);
  const [draftSlideConfig, setDraftSlideConfig] = useState<Partial<DeckConfig> | undefined>(activeSlideConfig);
  const [hasPendingChanges, setHasPendingChanges] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setDraftConfig(config);
      setDraftSlideConfig(activeSlideConfig);
      setHasPendingChanges(false);
    }
  }, [isOpen, config, activeSlideConfig]);

  // Live preview scale — fit the 1920x1080 canvas into the preview panel.
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

  const activeItem = items[activeSlideIndex] || items[0];
  // Preview slide — the real item, but its per-slide override is the DRAFT slide
  // config so the live preview reflects not-yet-applied slide-scope edits.
  // SlideCanvas merges item.customConfig over config itself, so pass the deck
  // draft as config and the slide draft as the item's customConfig.
  const previewItem: MCQItem = activeItem
    ? { ...activeItem, customConfig: draftSlideConfig }
    : activeItem;

  const handleDirty = () => setHasPendingChanges(true);

  const handleApply = () => {
    onApplyConfig(draftConfig);
    if (draftSlideConfig && Object.keys(draftSlideConfig).length > 0) {
      onApplyActiveSlideConfig(draftSlideConfig);
    } else {
      onResetActiveSlideConfig();
    }
    onClose();
  };

  const handleClose = () => {
    if (hasPendingChanges) {
      if (!window.confirm('Discard your unsaved Deck Settings changes?')) return;
    }
    onClose();
  };

  const handleClassroomEnforce = () => {
    if (onEnforceClassroomView) {
      onEnforceClassroomView();
    } else {
      setDraftConfig((prev) => ({ ...prev, layoutMode: 'class_mode' }));
      setHasPendingChanges(true);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md ${
      isAppLight ? 'bg-black/40' : 'bg-black/80'
    }`}>
      <div className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} relative w-full max-w-[1400px] border flex flex-col max-h-[94vh] overflow-hidden ${
        isAppLight ? 'border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        {/* Header */}
        <div className={`flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b shrink-0 ${
          isAppLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25">
              <Sliders className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className={`text-lg font-black ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                Deck Settings
              </h3>
              <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Edits are previewed live and applied to the deck only when you hit <strong className={isAppLight ? 'text-amber-600' : 'text-amber-300'}>Apply to All</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasPendingChanges && (
              <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${
                isAppLight ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              }`}>
                <RefreshCw className="w-3 h-3" /> Unsaved Changes
              </span>
            )}
            <button
              onClick={handleClose}
              className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                isAppLight ? 'bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title="Close Deck Settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body: settings content + live preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* DeckSettings content — binds to the draft so nothing is committed until Apply */}
            <div className="xl:col-span-8 min-w-0">
              <DeckSettings
                config={draftConfig}
                onUpdateConfig={(updated) => {
                  setDraftConfig(updated);
                  handleDirty();
                }}
                activeSlideIndex={activeSlideIndex}
                activeSlideConfig={draftSlideConfig}
                onUpdateActiveSlideConfig={(updated) => {
                  setDraftSlideConfig(updated);
                  handleDirty();
                }}
                onResetActiveSlideConfig={() => {
                  setDraftSlideConfig(undefined);
                  handleDirty();
                }}
                appTheme={appTheme}
                onEnforceClassroomView={handleClassroomEnforce}
              />
            </div>

            {/* Sticky live preview panel */}
            <div className="xl:col-span-4 xl:sticky xl:top-0 space-y-3">
              <div className={`p-4 rounded-2xl border space-y-3 shadow-xl ${
                isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    isAppLight ? 'text-amber-600' : 'text-amber-300'
                  }`}>
                    <Eye className="w-3.5 h-3.5" />
                    Live Deck Preview
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    isAppLight ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}>
                    Slide #{activeSlideIndex + 1}
                  </span>
                </div>
                <div ref={previewRef} className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  {previewScale > 0 && activeItem && (
                    <div
                      className="absolute top-0 left-0 origin-top-left"
                      style={{ width: 1920, height: 1080, transform: `scale(${previewScale})` }}
                    >
                      <SlideCanvas
                        item={previewItem}
                        config={draftConfig}
                        currentIndex={activeSlideIndex}
                        totalCount={items.length}
                        isAnswerRevealMode={false}
                      />
                    </div>
                  )}
                </div>
                <p className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                  isAppLight ? 'text-slate-500' : 'text-slate-500'
                }`}>
                  <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  Preview only — changes are not applied to the deck yet.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Cancel + Apply to All */}
        <div className={`px-6 py-4 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isAppLight ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <p className={`text-xs font-semibold ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
            Scope toggles inside the settings work exactly as before — deck-wide vs. this slide only.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className={`px-5 py-2.5 rounded-xl text-xs font-black border cursor-pointer transition-colors ${
                isAppLight
                  ? 'bg-white text-slate-700 border-slate-300 hover:text-slate-900'
                  : 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 hover:brightness-110 cursor-pointer transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              Apply to All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
