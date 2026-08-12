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
import { AnswerModeModal } from './AnswerModeModal';
import { QuestionNumberChanger } from './QuestionNumberChanger';
import { DeckConfig } from '../types';
import { LogoUploader } from './settings/LogoUploader';
import { InstructorProfileForm } from './settings/InstructorProfileForm';
import { LayoutBannerControls } from './settings/LayoutBannerControls';
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
  const [isAnswerModeModalOpen, setIsAnswerModeModalOpen] = useState(false);

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
      <LogoUploader
        logoUrl={defaults.logoUrl}
        logoSize={defaults.logoSize}
        brandName={defaults.brandName}
        onLogoUrlChange={(url) => update({ logoUrl: url })}
        onLogoSizeChange={(size) => update({ logoSize: size })}
        onBrandNameChange={(name) => update({ brandName: name })}
        isAppLight={isAppLight}
      />

      <InstructorProfileForm
        watermarkHandle={defaults.watermarkHandle}
        watermarkAvatar={defaults.watermarkAvatar}
        footerTag={defaults.footerTag}
        onWatermarkHandleChange={(handle) => update({ watermarkHandle: handle })}
        onWatermarkAvatarChange={(avatar) => update({ watermarkAvatar: avatar })}
        onFooterTagChange={(tag) => update({ footerTag: tag })}
        isAppLight={isAppLight}
      />

      {/* SECTION 2: DEFAULT BACKGROUND GRAPHICS & OVERLAYS */}
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
      <LayoutBannerControls
        layoutMode={defaults.layoutMode}
        useHeaderBanner={defaults.useHeaderBanner}
        headerBannerUrl={defaults.headerBannerUrl}
        useFooterBanner={defaults.useFooterBanner}
        footerBannerUrl={defaults.footerBannerUrl}
        onLayoutModeChange={(mode) => update({ layoutMode: mode })}
        onUseHeaderBannerChange={(val) => update({ useHeaderBanner: val })}
        onHeaderBannerUrlChange={(val) => update({ headerBannerUrl: val })}
        onUseFooterBannerChange={(val) => update({ useFooterBanner: val })}
        onFooterBannerUrlChange={(val) => update({ footerBannerUrl: val })}
        isAppLight={isAppLight}
      />

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



      {/* SECTION 6: DEFAULT ANSWER REVEAL BEHAVIOR — opens the same Answer Mode &
          Reveal Settings modal used in Deck Settings, so both surfaces share one
          implementation instead of two independent card UIs drifting apart. */}
      <div className={`p-6 sm:p-8 rounded-3xl border-2 space-y-4 shadow-2xl ${
        isAppLight ? 'glass-card-fatty-light border-slate-200' : 'glass-card-fatty border-slate-800'
      }`}>
        <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Eye className="w-4 h-4" /> 6. Default Answer Reveal Behavior
        </h3>
        <button
          type="button"
          onClick={() => setIsAnswerModeModalOpen(true)}
          className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
            isAppLight ? 'bg-white border-slate-200 hover:border-amber-400' : 'bg-slate-900 border-slate-800 hover:border-amber-500/60'
          }`}
        >
          <span>
            <span className={`block text-sm font-bold ${isAppLight ? 'text-slate-900' : 'text-slate-100'}`}>
              Configure Default Answer Mode & Reveal Settings
            </span>
            <span className={`block text-xs mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
              Current: {defaults.answerMode === 'separate_slide' ? 'Separate Answer Slide' : defaults.answerMode === 'highlight' ? 'Highlight In-Place' : 'Hidden'}
              {defaults.showExplanationInSlide ? ' · Explanation box on' : ''}
            </span>
          </span>
          <Eye className="w-4 h-4 text-amber-400 shrink-0" />
        </button>
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
            <QuestionNumberChanger
              value={defaults.defaultQuestionNumberFormat}
              onChange={(fmt) => update({ defaultQuestionNumberFormat: fmt })}
              appTheme={appTheme}
            />
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

      <AnswerModeModal
        isOpen={isAnswerModeModalOpen}
        onClose={() => setIsAnswerModeModalOpen(false)}
        config={defaults as unknown as DeckConfig}
        onApplyConfig={(updated) => update({
          answerMode: updated.answerMode,
          answerDisplayStyles: updated.answerDisplayStyles,
          showAnswerInSlide: updated.showAnswerInSlide,
          showExplanationInSlide: updated.showExplanationInSlide,
        })}
        totalQuestions={0}
        appTheme={appTheme}
        hideScope
        title="Default Answer Mode & Reveal Settings"
        description="Configure the default answer highlights, badge pills, explanation cards, and dedicated answer slides used by every newly created deck."
        applyButtonLabel="Set as Default"
      />
    </div>
  );
};
