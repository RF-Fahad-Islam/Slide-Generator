import React, { useState } from 'react';
import { DeckConfig } from '../types';
import { saveTemplatePreset, DeckTemplatePreset } from '../utils/templatePresets';
import { BookmarkPlus, X, Check, Sparkles, Layers } from 'lucide-react';

interface SavePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DeckConfig;
  activeSlideConfigOverride?: Partial<DeckConfig>;
  appTheme?: 'dark' | 'light';
  onSaved?: (preset: DeckTemplatePreset) => void;
}

export const SavePresetModal: React.FC<SavePresetModalProps> = ({
  isOpen,
  onClose,
  config,
  activeSlideConfigOverride,
  appTheme = 'dark',
  onSaved,
}) => {
  const isAppLight = appTheme === 'light';

  // Effective design = deck config merged with active slide's custom overrides
  const effectiveConfig: DeckConfig = {
    ...config,
    ...(activeSlideConfigOverride || {}),
  };

  const defaultPresetName = config.deckName
    ? `${config.deckName} Preset`
    : `${effectiveConfig.templateId} Custom`;

  const [name, setName] = useState(defaultPresetName);
  const [description, setDescription] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const saved = saveTemplatePreset(name, effectiveConfig, description);
    setIsSuccess(true);
    if (onSaved) onSaved(saved);

    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-modal-backdrop">
      <div
        className={`relative w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden animate-modal-card ${
          isAppLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div
          className={`p-6 border-b flex items-center justify-between ${
            isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <BookmarkPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Save Design as Preset</h3>
              <p className={`text-xs ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Save current slide design (colors, fonts, background & banners) to reuse anytime
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isAppLight
                ? 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className={`text-xs font-extrabold uppercase tracking-wider block ${
              isAppLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              Preset Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My SSC Biology Gold Theme"
              required
              autoFocus
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:border-amber-400 ${
                isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <label className={`text-xs font-extrabold uppercase tracking-wider block ${
              isAppLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              Notes / Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Yellow header, chalkboard green background & Kalpurush font"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-amber-400 ${
                isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
              }`}
            />
          </div>

          {/* Quick Design Summary Badge */}
          <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
            isAppLight ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Current Slide Design Summary:
              </span>
              <span className="font-mono text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500/20">
                {effectiveConfig.templateId}
              </span>
            </div>
            <div className="text-[11px] opacity-90 leading-relaxed">
              Font: {effectiveConfig.fontFamily || 'Hind Siliguri'} • Background: {effectiveConfig.bgPreset || 'None'} • Layout: {effectiveConfig.optionsLayout || '2col'}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isAppLight
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSuccess}
              className="flex-1 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-80"
            >
              {isSuccess ? (
                <>
                  <Check className="w-4 h-4 text-slate-950 stroke-[3]" /> Saved Preset!
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-4 h-4" /> Save Preset
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
