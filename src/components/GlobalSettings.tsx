import React, { useState } from 'react';
import {
  Sliders,
  FileText,
  Palette,
  Hash,
  Sun,
  Moon,
  CheckCircle2,
  Award,
  Image as ImageIcon,
  Type,
  Check,
  Save,
  Sparkles,
} from 'lucide-react';
import { TEMPLATES } from '../templates/registry';
import { FONT_PRESETS } from '../utils/fontPresets';
import { BACKGROUND_PRESETS } from '../utils/backgroundPresets';
import {
  GlobalDefaults,
  DEFAULT_GLOBAL_DEFAULTS,
  loadGlobalDefaults,
  saveGlobalDefaults,
} from '../utils/globalDefaults';

interface GlobalSettingsProps {
  appTheme?: 'dark' | 'light';
  onToggleAppTheme?: () => void;
}

export const GlobalSettings: React.FC<GlobalSettingsProps> = ({
  appTheme = 'dark',
  onToggleAppTheme,
}) => {
  const isAppLight = appTheme === 'light';

  const [defaults, setDefaults] = useState<GlobalDefaults>(() => loadGlobalDefaults());
  const [savedNotice, setSavedNotice] = useState(false);

  const update = (patch: Partial<GlobalDefaults>) => {
    const next = { ...defaults, ...patch };
    setDefaults(next);
    saveGlobalDefaults(next);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25 shrink-0">
            <Sliders className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <h2 className={`text-2xl lg:text-3xl font-black tracking-tight ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
              Global App Defaults & Brand Identity
            </h2>
            <p className={`text-sm mt-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Configure default brand logo, channel name, background graphics, fonts, and themes used across all newly created decks.
            </p>
          </div>
        </div>

        {savedNotice && (
          <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center gap-2 shadow-lg animate-bounce">
            <Check className="w-4 h-4 stroke-[3]" /> Saved App Defaults!
          </div>
        )}
      </div>

      {/* SECTION 1: BRAND IDENTITY & LOGO */}
      <div className={`p-6 sm:p-8 rounded-3xl border-2 space-y-6 shadow-2xl ${
        isAppLight ? 'glass-card-fatty-light border-slate-200' : 'glass-card-fatty border-slate-800'
      }`}>
        <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Award className="w-5 h-5" /> 1. Default Channel Branding & Logo
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs sm:text-sm">
          <div className="space-y-1.5">
            <label className={`font-black block ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
              Default Brand / Coaching Name
            </label>
            <input
              type="text"
              value={defaults.brandName}
              onChange={(e) => update({ brandName: e.target.value })}
              placeholder="e.g. NOBEL'S CLASSROOM"
              className={`w-full border-2 rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all ${
                isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <label className={`font-black block ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
              Default Subject / Badge Tag
            </label>
            <input
              type="text"
              value={defaults.badgeTag}
              onChange={(e) => update({ badgeTag: e.target.value })}
              placeholder="e.g. Biology"
              className={`w-full border-2 rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all ${
                isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <label className={`font-black block ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
              Default Logo Image URL / Data URL
            </label>
            <input
              type="text"
              value={defaults.logoUrl}
              onChange={(e) => update({ logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
              className={`w-full border-2 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all ${
                isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <label className={`font-black block ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
              Default Logo Size
            </label>
            <select
              value={defaults.logoSize}
              onChange={(e) => update({ logoSize: e.target.value as any })}
              className={`w-full border-2 rounded-2xl px-4 py-3 font-bold text-sm cursor-pointer focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all ${
                isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            >
              <option value="sm">Small (48px)</option>
              <option value="md">Medium (64px)</option>
              <option value="lg">Large (80px)</option>
              <option value="xl">Extra Large (100px)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={`font-black block ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
              Default Logo Position
            </label>
            <select
              value={defaults.logoPosition}
              onChange={(e) => update({ logoPosition: e.target.value as any })}
              className={`w-full border-2 rounded-2xl px-4 py-3 font-bold text-sm cursor-pointer focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all ${
                isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            >
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
              <option value="header-inline">Header Inline</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: DEFAULT BACKGROUND GRAPHICS & OVERLAYS */}
      <div className={`p-6 sm:p-8 rounded-3xl border-2 space-y-6 shadow-2xl ${
        isAppLight ? 'glass-card-fatty-light border-slate-200' : 'glass-card-fatty border-slate-800'
      }`}>
        <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> 2. Default Background Graphics & Overlays
        </h3>

        <div className="space-y-4 text-xs">
          {/* Background Presets Grid */}
          <div className="space-y-1">
            <label className={`font-bold block ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Default Background Graphic Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BACKGROUND_PRESETS.map((preset) => {
                const isSel = defaults.bgPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => update({ bgPreset: preset.id })}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSel
                        ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40'
                        : isAppLight
                        ? 'bg-white border-slate-200 hover:border-slate-300'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold block truncate">{preset.name}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{preset.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Image URL */}
          <div className="space-y-1">
            <label className={`font-bold block ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Custom Background Image URL / Data URL
            </label>
            <input
              type="text"
              value={defaults.bgImageUrl || ''}
              onChange={(e) => update({ bgImageUrl: e.target.value, bgPreset: e.target.value ? 'custom' : defaults.bgPreset })}
              placeholder="https://example.com/custom-bg.jpg"
              className={`w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 ${
                isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
              }`}
            />
          </div>

          {/* Fit & Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className={`font-bold block ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Image Fit Mode
              </label>
              <select
                value={defaults.bgImageFit || 'cover'}
                onChange={(e) => update({ bgImageFit: e.target.value as any })}
                className={`w-full border rounded-xl px-3 py-2 font-bold cursor-pointer ${
                  isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                }`}
              >
                <option value="cover">Cover (Fill canvas)</option>
                <option value="contain">Contain (Fit inside)</option>
                <option value="stretch">Stretch (100% 100%)</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span className={isAppLight ? 'text-slate-700' : 'text-slate-300'}>Background Opacity</span>
                <span className="font-mono text-amber-400">{Math.round((defaults.bgImageOpacity ?? 0.85) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={defaults.bgImageOpacity ?? 0.85}
                onChange={(e) => update({ bgImageOpacity: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span className={isAppLight ? 'text-slate-700' : 'text-slate-300'}>Overlay Darkness</span>
                <span className="font-mono text-amber-400">{Math.round((defaults.bgOverlayDarkness ?? 0.4) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.9"
                step="0.05"
                value={defaults.bgOverlayDarkness ?? 0.4}
                onChange={(e) => update({ bgOverlayDarkness: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: DEFAULT TYPOGRAPHY & THEME */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Default Font Family */}
        <div className={`p-6 rounded-3xl border space-y-3 ${
          isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <label className={`block text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
            isAppLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            <Type className="w-4 h-4 text-amber-400" />
            Default Font Family
          </label>
          <select
            value={defaults.fontFamily}
            onChange={(e) => update({ fontFamily: e.target.value })}
            className={`w-full border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-amber-500 cursor-pointer ${
              isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            {FONT_PRESETS.map((f) => (
              <option key={f.id} value={f.family}>
                {f.name} ({f.sampleBangla})
              </option>
            ))}
          </select>
          <p className={`text-xs ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
            Default font family applied when parsing new questions or building decks.
          </p>
        </div>

        {/* Default Deck Name & Numbering */}
        <div className={`p-6 rounded-3xl border space-y-3 ${
          isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <label className={`block text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
            isAppLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            <Hash className="w-4 h-4 text-amber-400" />
            Default Deck Name & Numbering
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={defaults.defaultDeckName}
              onChange={(e) => update({ defaultDeckName: e.target.value })}
              placeholder={DEFAULT_GLOBAL_DEFAULTS.defaultDeckName}
              className={`w-full border rounded-xl px-3 py-2.5 text-xs font-bold ${
                isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
              }`}
            />
            <select
              value={defaults.defaultQuestionNumberFormat}
              onChange={(e) => update({ defaultQuestionNumberFormat: e.target.value as GlobalDefaults['defaultQuestionNumberFormat'] })}
              className={`w-full border rounded-xl px-3 py-2.5 text-xs font-mono font-bold cursor-pointer ${
                isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
              }`}
            >
              <option value="bangla">Bangla (১, ২, ৩...)</option>
              <option value="english">English (1, 2, 3...)</option>
              <option value="q_prefix">Q Prefix (Q1...)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Default Slide Template */}
      <div className={`p-6 rounded-3xl border space-y-4 ${
        isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}>
        <label className={`block text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
          isAppLight ? 'text-slate-600' : 'text-slate-400'
        }`}>
          <Palette className="w-4 h-4 text-amber-400" />
          Default Slide Template
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TEMPLATES.map((tmpl) => {
            const isSelected = defaults.defaultTemplateId === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => update({ defaultTemplateId: tmpl.id })}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                    : isAppLight
                    ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className={`w-full h-8 rounded-xl bg-gradient-to-r ${tmpl.previewGradient} flex items-center justify-between px-3 border border-white/10 shadow-sm`}>
                    <span className="w-3 h-3 rounded-full border border-white/40" style={{ backgroundColor: tmpl.styles.accentColor }} />
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                      tmpl.themeType === 'light' ? 'bg-amber-400 text-slate-950' : 'bg-slate-900/90 text-amber-300'
                    }`}>
                      {tmpl.themeType === 'light' ? '☀️ LIGHT' : '🌙 DARK'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-extrabold ${
                    isSelected ? 'text-amber-300' : isAppLight ? 'text-slate-900' : 'text-slate-100'
                  }`}>
                    {tmpl.name}
                  </h4>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* App Shell Theme */}
      <div className={`p-6 rounded-3xl border space-y-4 ${
        isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}>
        <label className={`block text-xs font-black uppercase tracking-wider ${
          isAppLight ? 'text-slate-600' : 'text-slate-400'
        }`}>
          App Shell Theme
        </label>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <button
            type="button"
            onClick={() => !isAppLight && onToggleAppTheme?.()}
            disabled={isAppLight}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
              isAppLight
                ? 'bg-amber-500/10 border-amber-400 ring-1 ring-amber-400/50'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-400" />
            <div>
              <div className={`text-sm font-bold ${isAppLight ? 'text-amber-300' : 'text-slate-200'}`}>Light</div>
              {isAppLight && <div className="text-[10px] text-amber-400 font-bold">Active</div>}
            </div>
          </button>
          <button
            type="button"
            onClick={() => isAppLight && onToggleAppTheme?.()}
            disabled={!isAppLight}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
              !isAppLight
                ? 'bg-amber-500/10 border-amber-400 ring-1 ring-amber-400/50'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-400" />
            <div>
              <div className={`text-sm font-bold ${!isAppLight ? 'text-amber-300' : 'text-slate-200'}`}>Dark</div>
              {!isAppLight && <div className="text-[10px] text-amber-400 font-bold">Active</div>}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
