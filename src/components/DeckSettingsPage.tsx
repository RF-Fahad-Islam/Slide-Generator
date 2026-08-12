import React, { useState, useEffect } from 'react';
import { DeckConfig, MCQItem } from '../types';
import { DeckSettings } from './DeckSettings';
import { DeckSettingsPreviewModal } from './DeckSettingsPreviewModal';
import { DeckSettingsFloatingPreview } from './DeckSettingsFloatingPreview';
import { ChevronLeft, Sliders, CheckCircle2, Eye, RefreshCw, EyeOff } from 'lucide-react';

interface DeckSettingsPageProps {
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

// Deck-scoped settings PAGE for Slide Studio (replaces the old modal). Edits a
// DRAFT config with live state — nothing is applied to the deck until "Apply to
// All" is clicked. The slide preview moved into a modal behind the "Preview
// Slide" button so the settings content gets the full page width.
export const DeckSettingsPage: React.FC<DeckSettingsPageProps> = ({
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

  // Draft state — initialized from the real deck config every time the page mounts.
  const [draftConfig, setDraftConfig] = useState<DeckConfig>(config);
  const [draftSlideConfig, setDraftSlideConfig] = useState<Partial<DeckConfig> | undefined>(activeSlideConfig);
  const [hasPendingChanges, setHasPendingChanges] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  // Bigger, draggable, closable FLOATING slide preview (replaces the old sticky
  // column). Open state persists across page mounts.
  const [showCompactPreview, setShowCompactPreview] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('mcqgen.dspOpen');
      if (raw) return raw === '1';
    } catch {
      // ignore
    }
    return true;
  });

  useEffect(() => {
    try {
      localStorage.setItem('mcqgen.dspOpen', showCompactPreview ? '1' : '0');
    } catch {
      // ignore
    }
  }, [showCompactPreview]);

  const activeItem = items[activeSlideIndex] || items[0];

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

  const handleBack = () => {
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
    <div className="space-y-6">
      {/* Page header bar — back to studio, title, Preview Slide + Apply to All */}
      <div className={`p-5 rounded-3xl border shadow-xl flex flex-wrap items-center justify-between gap-x-4 gap-y-3 ${
        isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleBack}
            className={`shrink-0 p-2.5 rounded-xl cursor-pointer transition-colors ${
              isAppLight
                ? 'bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
            title="Back to Slide Studio"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25 shrink-0">
            <Sliders className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={`text-lg font-black ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                Deck Settings
              </h3>
              {hasPendingChanges && (
                <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${
                  isAppLight ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                }`}>
                  <RefreshCw className="w-3 h-3" /> Unsaved Changes
                </span>
              )}
            </div>
            <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Edits are previewed live and applied to the deck only when you hit{' '}
              <strong className={isAppLight ? 'text-amber-600' : 'text-amber-300'}>Apply to All</strong>.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCompactPreview((v) => !v)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
              isAppLight
                ? showCompactPreview
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:text-slate-900'
                : showCompactPreview
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title={showCompactPreview ? 'Hide the floating slide preview' : 'Show the floating slide preview'}
          >
            {showCompactPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{showCompactPreview ? 'Hide Preview' : 'Show Preview'}</span>
          </button>
          <button
            onClick={() => setIsPreviewOpen(true)}
            disabled={!activeItem}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isAppLight
                ? 'bg-white text-slate-700 border-slate-300 hover:text-slate-900 hover:border-amber-400'
                : 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white hover:border-amber-500'
            }`}
            title="Open a modal preview of the active slide"
          >
            <Eye className="w-4 h-4 text-amber-500" />
            Preview Slide
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 hover:brightness-110 cursor-pointer transition-all"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            Apply to All
          </button>
        </div>
      </div>

      {/* Settings content — full width; the slide preview now floats on top */}
      <div className="grid grid-cols-1 gap-6 items-start">
        <div className="xl:col-span-12">
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
            totalQuestions={items.length}
          />
        </div>
      </div>

      {/* Floating draggable slide preview — bigger than the old column, closable,
          drag by its header, expand to the full modal */}
      {showCompactPreview && activeItem && (
        <DeckSettingsFloatingPreview
          config={draftConfig}
          slideConfig={draftSlideConfig}
          item={activeItem}
          activeSlideIndex={activeSlideIndex}
          totalCount={items.length}
          appTheme={appTheme}
          onExpand={() => setIsPreviewOpen(true)}
          onClose={() => setShowCompactPreview(false)}
        />
      )}

      {/* Preview slide modal — draft config + draft slide config */}
      <DeckSettingsPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        config={draftConfig}
        slideConfig={draftSlideConfig}
        item={activeItem}
        activeSlideIndex={activeSlideIndex}
        totalCount={items.length}
        appTheme={appTheme}
      />
    </div>
  );
};
