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
  Type,
  Check,
  Save,
  Sparkles,
  SlidersHorizontal,
  User,
  Eye,
  LayoutTemplate,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { TEMPLATES } from '../templates/registry';
import { FONT_PRESETS } from '../utils/fontPresets';
import { BackgroundPicker } from './BackgroundPicker';
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

      {/* SECTION 2: DEFAULT BACKGROUND GRAPHICS & OVERLAYS — shared with per-deck
          Background tab so preset vs. custom-image selection always behaves
          identically (mutually exclusive) everywhere in the app. */}
      <BackgroundPicker
        title="2. Default Background Graphics & Overlays"
        description="Select or upload the default background image applied to every newly created deck"
        value={{
          bgPreset: defaults.bgPreset,
          bgImageUrl: defaults.bgImageUrl,
          bgImageFit: defaults.bgImageFit,
          bgImageOpacity: defaults.bgImageOpacity,
          bgOverlayDarkness: defaults.bgOverlayDarkness,
        }}
        onPatch={(patch) => update(patch)}
        isAppLight={isAppLight}
      />

      {/* SECTION 3: DEFAULT SLIDE LAYOUT & HEADER MODE */}
      <div className={`p-6 sm:p-8 rounded-3xl border-2 space-y-6 shadow-2xl ${
        isAppLight ? 'glass-card-fatty-light border-slate-200' : 'glass-card-fatty border-slate-800'
      }`}>
        <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" /> 3. Default Slide Layout & Header Mode
        </h3>

        <div className="space-y-2">
          <label className={`text-xs font-bold block uppercase tracking-wider ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
            Default Layout Format
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => update({ layoutMode: 'standard' })}
              className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-2 ${
                (defaults.layoutMode || 'standard') === 'standard'
                  ? 'bg-amber-500/10 border-amber-400 text-amber-300 shadow-lg'
                  : isAppLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span className={`text-sm font-bold ${isAppLight ? 'text-slate-900' : 'text-white'}`}>🖥️ Standard Center Presentation</span>
              {(defaults.layoutMode || 'standard') === 'standard' && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
            </button>
            <button
              type="button"
              onClick={() => update({ layoutMode: 'class_mode' })}
              className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-2 ${
                defaults.layoutMode === 'class_mode'
                  ? 'bg-amber-500/10 border-amber-400 text-amber-300 shadow-lg'
                  : isAppLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span className={`text-sm font-bold ${isAppLight ? 'text-slate-900' : 'text-white'}`}>📐 Classroom View</span>
              {defaults.layoutMode === 'class_mode' && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={`text-xs font-bold block uppercase tracking-wider ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Default Header Mode
            </label>
            <select
              value={defaults.headerType || 'manual'}
              onChange={(e) => update({ headerType: e.target.value as GlobalDefaults['headerType'] })}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer ${
                isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
              }`}
            >
              <option value="manual">Manual Text Header</option>
              <option value="banner">Custom Banner Image</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className={`text-xs font-bold block uppercase tracking-wider ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Default Aspect Ratio
            </label>
            <select
              value={defaults.aspectRatio || '16:9'}
              onChange={(e) => update({ aspectRatio: e.target.value as GlobalDefaults['aspectRatio'] })}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer ${
                isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
              }`}
            >
              <option value="16:9">16:9 (Widescreen)</option>
              <option value="4:5">4:5 (Portrait Post)</option>
              <option value="9:16">9:16 (Story / Reel)</option>
            </select>
          </div>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t ${isAppLight ? 'border-slate-200' : 'border-slate-900'}`}>
          <div className={`p-4 rounded-2xl border space-y-3 ${isAppLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold ${isAppLight ? 'text-slate-700' : 'text-slate-200'}`}>Full-Width Header Banner</span>
              <label className={`flex items-center gap-2 cursor-pointer text-xs font-bold ${isAppLight ? 'text-amber-700' : 'text-amber-300'}`}>
                <input
                  type="checkbox"
                  checked={!!defaults.useHeaderBanner}
                  onChange={(e) => update({ useHeaderBanner: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                Enable by default
              </label>
            </div>
            {defaults.useHeaderBanner && (
              <input
                type="text"
                value={defaults.headerBannerUrl || ''}
                onChange={(e) => update({ headerBannerUrl: e.target.value })}
                placeholder="Default header banner image URL"
                className={`w-full border rounded-xl px-3 py-2 text-xs font-mono ${
                  isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            )}
          </div>

          <div className={`p-4 rounded-2xl border space-y-3 ${isAppLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-bold ${isAppLight ? 'text-slate-700' : 'text-slate-200'}`}>Full-Width Footer Banner</span>
              <label className={`flex items-center gap-2 cursor-pointer text-xs font-bold ${isAppLight ? 'text-amber-700' : 'text-amber-300'}`}>
                <input
                  type="checkbox"
                  checked={!!defaults.useFooterBanner}
                  onChange={(e) => update({ useFooterBanner: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                Enable by default
              </label>
            </div>
            {defaults.useFooterBanner && (
              <input
                type="text"
                value={defaults.footerBannerUrl || ''}
                onChange={(e) => update({ footerBannerUrl: e.target.value })}
                placeholder="Default footer banner image URL"
                className={`w-full border rounded-xl px-3 py-2 text-xs font-mono ${
                  isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: DEFAULT GRANULAR TYPOGRAPHY CONTROLS */}
      <div className={`p-6 sm:p-8 rounded-3xl border-2 space-y-6 shadow-2xl ${
        isAppLight ? 'glass-card-fatty-light border-slate-200' : 'glass-card-fatty border-slate-800'
      }`}>
        <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Type className="w-4 h-4" /> 4. Default Typography Per Slide Section
        </h3>
        <p className={`text-xs ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
          Independent font, size, weight & alignment defaults for every newly created deck — matches the per-deck Typography tab.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Header Font & Size */}
          <div className={`p-4 rounded-xl border space-y-2 ${isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
            <span className={`text-sm font-bold block ${isAppLight ? 'text-slate-900' : 'text-white'}`}>Header Title & Brand Font</span>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={defaults.headerFont || defaults.fontFamily}
                onChange={(e) => update({ headerFont: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 ${isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
              >
                {FONT_PRESETS.map((f) => <option key={f.id} value={f.family}>{f.name}</option>)}
              </select>
              <select
                value={defaults.headerFontSize || 'md'}
                onChange={(e) => update({ headerFontSize: e.target.value as GlobalDefaults['headerFontSize'] })}
                className={`w-full border rounded-lg px-3 py-2 font-mono font-bold ${isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
              >
                <option value="xs">Small (XS)</option>
                <option value="sm">Medium (SM)</option>
                <option value="md">Standard (MD)</option>
                <option value="lg">Large (LG)</option>
                <option value="xl">Extra Large (XL)</option>
              </select>
            </div>
          </div>

          {/* Question Body Font, Size, Weight, Alignment, Position */}
          <div className={`p-4 rounded-xl border space-y-2 ${isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
            <span className={`text-sm font-bold block uppercase tracking-wider ${isAppLight ? 'text-amber-700' : 'text-amber-300'}`}>Question Body / Stem</span>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={defaults.bodyFont || defaults.fontFamily}
                onChange={(e) => update({ bodyFont: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 ${isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
              >
                {FONT_PRESETS.map((f) => <option key={f.id} value={f.family}>{f.name}</option>)}
              </select>
              <select
                value={defaults.bodyFontSize || 'lg'}
                onChange={(e) => update({ bodyFontSize: e.target.value as GlobalDefaults['bodyFontSize'] })}
                className={`w-full border rounded-lg px-3 py-2 font-mono font-bold ${isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Standard</option>
                <option value="xl">Large</option>
                <option value="2xl">2XL</option>
                <option value="3xl">3XL</option>
              </select>
              <select
                value={defaults.bodyFontWeight || 'bold'}
                onChange={(e) => update({ bodyFontWeight: e.target.value as GlobalDefaults['bodyFontWeight'] })}
                className={`w-full border rounded-lg px-3 py-2 font-mono font-bold ${isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
              >
                <option value="normal">Normal</option>
                <option value="medium">Medium</option>
                <option value="semibold">SemiBold</option>
                <option value="bold">Bold</option>
                <option value="extrabold">ExtraBold</option>
              </select>
              <select
                value={defaults.questionAlignment || 'left'}
                onChange={(e) => update({ questionAlignment: e.target.value as GlobalDefaults['questionAlignment'] })}
                className={`w-full border rounded-lg px-3 py-2 font-mono font-bold ${isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
              >
                <option value="left">Left Align</option>
                <option value="center">Center Align</option>
                <option value="right">Right Align</option>
              </select>
            </div>
          </div>

          {/* Options Font, Size, Weight, Layout, Alignment */}
          <div className={`p-4 rounded-xl border space-y-2 ${isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
            <span className={`text-sm font-bold block uppercase tracking-wider ${isAppLight ? 'text-amber-700' : 'text-amber-300'}`}>MCQ Options (A, B, C, D)</span>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={defaults.optionsFont || defaults.fontFamily}
                onChange={(e) => update({ optionsFont: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 ${isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
              >
                {FONT_PRESETS.map((f) => <option key={f.id} value={f.family}>{f.name}</option>)}
              </select>
              <select
                value={defaults.optionsFontSize || 'md'}
                onChange={(e) => update({ optionsFontSize: e.target.value as GlobalDefaults['optionsFontSize'] })}
                className={`w-full border rounded-lg px-3 py-2 font-mono font-bold ${isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
              >
                <option value="xs">Small</option>
                <option value="sm">Medium</option>
                <option value="md">Standard</option>
                <option value="lg">Large</option>
                <option value="xl">XL</option>
                <option value="2xl">2XL</option>
              </select>
              <select
                value={defaults.optionsFontWeight || 'bold'}
                onChange={(e) => update({ optionsFontWeight: e.target.value as GlobalDefaults['optionsFontWeight'] })}
                className={`w-full border rounded-lg px-3 py-2 font-mono font-bold ${isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
              >
                <option value="normal">Normal</option>
                <option value="medium">Medium</option>
                <option value="semibold">SemiBold</option>
                <option value="bold">Bold</option>
                <option value="extrabold">ExtraBold</option>
              </select>
              <select
                value={defaults.optionsLayout || '2col'}
                onChange={(e) => update({ optionsLayout: e.target.value as GlobalDefaults['optionsLayout'] })}
                className={`w-full border rounded-lg px-3 py-2 font-mono font-bold ${isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
              >
                <option value="1col">1-Column Stack</option>
                <option value="2col">2-Column Grid</option>
                <option value="4col">4-Column Row</option>
              </select>
              <select
                value={defaults.optionsAlignment || 'left'}
                onChange={(e) => update({ optionsAlignment: e.target.value as GlobalDefaults['optionsAlignment'] })}
                className={`w-full border rounded-lg px-3 py-2 font-mono font-bold col-span-2 ${isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
              >
                <option value="left">Left Align</option>
                <option value="center">Center Align</option>
                <option value="right">Right Align</option>
              </select>
            </div>
          </div>

          {/* Footer Font & Size */}
          <div className={`p-4 rounded-xl border space-y-2 ${isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
            <span className={`text-sm font-bold block ${isAppLight ? 'text-slate-900' : 'text-white'}`}>Footer Tag Font</span>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={defaults.footerFont || defaults.fontFamily}
                onChange={(e) => update({ footerFont: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 ${isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
              >
                {FONT_PRESETS.map((f) => <option key={f.id} value={f.family}>{f.name}</option>)}
              </select>
              <select
                value={defaults.footerFontSize || 'sm'}
                onChange={(e) => update({ footerFontSize: e.target.value as GlobalDefaults['footerFontSize'] })}
                className={`w-full border rounded-lg px-3 py-2 font-mono font-bold ${isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`}
              >
                <option value="xs">Small (XS)</option>
                <option value="sm">Medium (SM)</option>
                <option value="md">Standard (MD)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: CHANNEL FOOTER TAG & INSTRUCTOR WATERMARK */}
      <div className={`p-6 sm:p-8 rounded-3xl border-2 space-y-6 shadow-2xl ${
        isAppLight ? 'glass-card-fatty-light border-slate-200' : 'glass-card-fatty border-slate-800'
      }`}>
        <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <User className="w-4 h-4" /> 5. Channel Footer Tag & Instructor Watermark
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs sm:text-sm">
          <div className="space-y-1.5">
            <label className={`font-black block ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
              Default Footer Tag
            </label>
            <input
              type="text"
              value={defaults.footerTag}
              onChange={(e) => update({ footerTag: e.target.value })}
              placeholder="e.g. BIOMISSION"
              className={`w-full border-2 rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all ${
                isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <label className={`font-black block ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
              Default Instructor Handle / Channel
            </label>
            <input
              type="text"
              value={defaults.watermarkHandle}
              onChange={(e) => update({ watermarkHandle: e.target.value })}
              placeholder="e.g. Hasnat Shuvro"
              className={`w-full border-2 rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all ${
                isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <label className={`font-black block ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
              Default Instructor Avatar URL / Data URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={defaults.watermarkAvatar}
                onChange={(e) => update({ watermarkAvatar: e.target.value })}
                placeholder="https://example.com/avatar.png"
                className={`w-full border-2 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all ${
                  isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
              <label className="px-4 py-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-sm font-bold cursor-pointer shrink-0 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const r = new FileReader();
                      r.onload = (evt) => evt.target?.result && update({ watermarkAvatar: evt.target.result as string });
                      r.readAsDataURL(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6: DEFAULT ANSWER REVEAL BEHAVIOR */}
      <div className={`p-6 sm:p-8 rounded-3xl border-2 space-y-6 shadow-2xl ${
        isAppLight ? 'glass-card-fatty-light border-slate-200' : 'glass-card-fatty border-slate-800'
      }`}>
        <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Eye className="w-4 h-4" /> 6. Default Answer Reveal Behavior
        </h3>

        <div className="space-y-2">
          <label className={`text-xs font-bold block uppercase tracking-wider ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
            Default Answer Display Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              { id: 'hidden', label: 'Hidden', desc: 'Question only, no answer shown' },
              { id: 'highlight', label: 'Highlight In-Place', desc: 'Correct option highlighted on the same slide' },
              { id: 'separate_slide', label: 'Separate Answer Slide', desc: 'Extra slide right after each question' },
            ] as const).map((opt) => {
              const isSelected = (defaults.answerMode || 'hidden') === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => update({ answerMode: opt.id, showAnswerInSlide: opt.id === 'highlight' })}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-1 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                      : isAppLight
                      ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${isSelected ? 'text-amber-300' : isAppLight ? 'text-slate-900' : 'text-slate-100'}`}>{opt.label}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                  </div>
                  <p className={`text-xs ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <label className={`flex items-center gap-2 cursor-pointer text-sm font-bold ${isAppLight ? 'text-slate-700' : 'text-slate-200'}`}>
          <input
            type="checkbox"
            checked={!!defaults.showExplanationInSlide}
            onChange={(e) => update({ showExplanationInSlide: e.target.checked })}
            className="w-4 h-4 accent-amber-500 rounded"
          />
          Show explanation box by default
        </label>
      </div>

      {/* SECTION 7: DEFAULT FONT FAMILY & DECK NAMING */}
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
