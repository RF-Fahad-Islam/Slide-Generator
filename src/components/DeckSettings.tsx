import React, { useState, useEffect } from 'react';
import { DeckConfig, CustomThemeColors, getEffectiveBadgeTag } from '../types';
import { TEMPLATES, getTemplateById } from '../templates/registry';
import { getBackgroundPresetUrl } from '../utils/backgroundPresets';
import { FONT_PRESETS, getFontPresetByFamily } from '../utils/fontPresets';
import { saveGlobalDefaults } from '../utils/globalDefaults';
import { BackgroundPicker } from './BackgroundPicker';
import { AnswerModeModal } from './AnswerModeModal';
import {
  getTemplatePresets,
  saveTemplatePreset,
  deleteTemplatePreset,
  applyDesignToConfig,
  DeckTemplatePreset,
} from '../utils/templatePresets';
import { Sliders, Upload, Palette, User, Award, BookOpen, Image as ImageIcon, SlidersHorizontal, CheckCircle2, Eye, Type, Sun, Moon, Sparkles, Layers, RefreshCw, Layers3, Target, Globe, LayoutTemplate, Save, Trash2 } from 'lucide-react';
import { effectiveShowAnswerInSlide } from '../utils/answerSlides';
import { templateToTextBoxes } from '../utils/templateToTextBoxes';
import { LogoUploader } from './settings/LogoUploader';
import { InstructorProfileForm } from './settings/InstructorProfileForm';
import { LayoutBannerControls } from './settings/LayoutBannerControls';
import { QuestionNumberChanger } from './QuestionNumberChanger';

interface DeckSettingsProps {
  config: DeckConfig;
  onUpdateConfig: (updated: DeckConfig) => void;
  activeSlideIndex?: number;
  activeSlideConfig?: Partial<DeckConfig>;
  onUpdateActiveSlideConfig?: (updated: Partial<DeckConfig>) => void;
  onResetActiveSlideConfig?: () => void;
  appTheme?: 'dark' | 'light';
  // Classroom View quick action — enforces class_mode + classroom text boxes on
  // the whole deck and hands off to the box editor (wired by Slide Studio).
  onEnforceClassroomView?: () => void;
  totalQuestions?: number;
}

const CUSTOM_THEME_PALETTES: { name: string; colors: CustomThemeColors }[] = [
  {
    name: '👑 Royal Gold Dark',
    colors: {
      name: 'Royal Gold Dark',
      bg: '#0f172a',
      cardBg: '#1e293b',
      cardBorder: '#f59e0b',
      titleColor: '#f59e0b',
      textColor: '#ffffff',
      badgeBg: '#f59e0b',
      badgeText: '#0f172a',
      optionBg: '#1e293b',
      optionBorder: '#334155',
      optionSelectedBg: '#78350f',
      optionSelectedBorder: '#f59e0b',
      optionSelectedText: '#fef3c7',
      accentColor: '#f59e0b',
    },
  },
  {
    name: '🔮 Midnight Purple',
    colors: {
      name: 'Midnight Purple',
      bg: '#1e1b4b',
      cardBg: '#2e1065',
      cardBorder: '#c084fc',
      titleColor: '#e9d5ff',
      textColor: '#ffffff',
      badgeBg: '#c084fc',
      badgeText: '#1e1b4b',
      optionBg: '#312e81',
      optionBorder: '#4338ca',
      optionSelectedBg: '#581c87',
      optionSelectedBorder: '#c084fc',
      optionSelectedText: '#fae8ff',
      accentColor: '#c084fc',
    },
  },
  {
    name: '🌿 Chalkboard Emerald',
    colors: {
      name: 'Chalkboard Emerald',
      bg: '#022c22',
      cardBg: '#064e3b',
      cardBorder: '#facc15',
      titleColor: '#facc15',
      textColor: '#ecfdf5',
      badgeBg: '#facc15',
      badgeText: '#022c22',
      optionBg: '#042f2e',
      optionBorder: '#047857',
      optionSelectedBg: '#713f12',
      optionSelectedBorder: '#facc15',
      optionSelectedText: '#fef9c3',
      accentColor: '#facc15',
    },
  },
  {
    name: '🌅 Crimson Sunset',
    colors: {
      name: 'Crimson Sunset',
      bg: '#450a0a',
      cardBg: '#7f1d1d',
      cardBorder: '#fde047',
      titleColor: '#fde047',
      textColor: '#fef2f2',
      badgeBg: '#fde047',
      badgeText: '#450a0a',
      optionBg: '#581c87',
      optionBorder: '#991b1b',
      optionSelectedBg: '#854d0e',
      optionSelectedBorder: '#fde047',
      optionSelectedText: '#fef9c3',
      accentColor: '#fde047',
    },
  },
  {
    name: '⚡ Cyber Cyan',
    colors: {
      name: 'Cyber Cyan',
      bg: '#083344',
      cardBg: '#164e63',
      cardBorder: '#22d3ee',
      titleColor: '#22d3ee',
      textColor: '#ecfeff',
      badgeBg: '#22d3ee',
      badgeText: '#083344',
      optionBg: '#0f172a',
      optionBorder: '#155e75',
      optionSelectedBg: '#155e75',
      optionSelectedBorder: '#22d3ee',
      optionSelectedText: '#cffafe',
      accentColor: '#22d3ee',
    },
  },
  {
    name: '📄 Clean Ivory Light',
    colors: {
      name: 'Clean Ivory Light',
      bg: '#fdfbf7',
      cardBg: '#ffffff',
      cardBorder: '#d97706',
      titleColor: '#78350f',
      textColor: '#0f172a',
      badgeBg: '#d97706',
      badgeText: '#ffffff',
      optionBg: '#f8f5ee',
      optionBorder: '#fde68a',
      optionSelectedBg: '#fef3c7',
      optionSelectedBorder: '#d97706',
      optionSelectedText: '#78350f',
      accentColor: '#d97706',
    },
  },
];

// Live 16:9 Mini Thumbnail Preview Component based on active config
const TemplateThumbnailPreview: React.FC<{ config: DeckConfig }> = ({ config }) => {
  const template = getTemplateById(config.templateId, config.customTheme);
  const styles = template.styles;
  const isLight = template.themeType === 'light';
  const activeFont = config.fontFamily || styles.fontFamily || "'Hind Siliguri', sans-serif";
  const bgImageUrl = getBackgroundPresetUrl(config.bgPreset, config.bgImageUrl);
  const overlayDarkness = config.bgOverlayDarkness ?? 0.4;

  const isHeaderBanner = config.headerType === 'banner' || (config.useHeaderBanner && !!config.headerBannerUrl);
  const optionsLayout = config.optionsLayout || '2col';

  const optionsGridClass = {
    '1col': 'grid-cols-1 gap-1',
    '2col': 'grid-cols-2 gap-1',
    '4col': 'grid-cols-4 gap-1',
  }[optionsLayout];

  const questionAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[config.questionAlignment || 'left'];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-300 pb-1">
        <span className="flex items-center gap-1.5 text-amber-300">
          <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Live 16:9 Slide Preview</span>
        </span>
        <span className="text-[10px] text-amber-300 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 truncate max-w-[180px]">
          {template.name}
        </span>
      </div>

      {/* 16:9 Aspect Ratio Mini Scaled Canvas */}
      <div
        style={{ fontFamily: activeFont }}
        className={`relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl flex flex-col justify-between p-2.5 sm:p-3 select-none ${
          isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-slate-100'
        }`}
      >
        {/* Background Image Layer */}
        {bgImageUrl && (
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              backgroundImage: `url("${bgImageUrl}")`,
              backgroundSize: config.bgImageFit === 'contain' ? 'contain' : config.bgImageFit === 'stretch' ? '100% 100%' : 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: config.bgImageOpacity ?? 0.85,
            }}
          />
        )}

        {/* Readability Overlay Tint */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundColor: isLight
              ? `rgba(255, 255, 255, ${overlayDarkness * 0.4})`
              : `rgba(15, 23, 42, ${overlayDarkness})`,
          }}
        />

        {/* Template Theme Applied Card Styling — theme bg steps aside when a
            background image replaces it */}
        <div className={`relative z-10 h-full flex flex-col justify-between ${bgImageUrl ? '' : styles.bgClass} p-2 rounded-xl border ${isLight ? 'border-slate-300/80' : 'border-white/10'}`}>
          {/* Header Bar (Full Width Image Banner vs Manual Structured Header) */}
          {isHeaderBanner ? (
            <div className="w-full flex items-center justify-between pb-1 border-b border-white/15">
              {config.headerBannerUrl ? (
                <img
                  src={config.headerBannerUrl}
                  alt="Header Banner Preview"
                  className="w-full max-h-[38px] object-contain rounded border border-white/20"
                />
              ) : (
                <div className="w-full h-[32px] rounded bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 border border-emerald-400/60 flex items-center justify-between px-2 text-[8px]">
                  <span className="font-black text-white truncate max-w-[130px]">{config.brandName || "NOBEL'S CLASSROOM"}</span>
                  <span className="bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded text-[7px] truncate max-w-[90px]">{getEffectiveBadgeTag(config) || "জীববিজ্ঞান"}</span>
                </div>
              )}
            </div>
          ) : (
            <div className={`flex items-center justify-between pb-1.5 border-b ${isLight ? 'border-slate-300' : 'border-white/15'}`}>
              <div className="flex items-center gap-1.5 min-w-0">
                {config.logoUrl ? (
                  <img
                    src={config.logoUrl}
                    alt="Logo"
                    className="w-4 h-4 sm:w-5 sm:h-5 object-contain rounded bg-black/10 p-0.5 border border-slate-300 shrink-0"
                  />
                ) : (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center shrink-0">
                    {config.brandName ? config.brandName.charAt(0).toUpperCase() : 'R'}
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className={`text-[9px] sm:text-[10px] font-black tracking-wide uppercase leading-none truncate ${isLight ? 'text-slate-950' : 'text-white'}`}>
                    {config.brandName || "NOBEL'S CLASSROOM"}
                  </h4>
                  {config.headerTitle && (
                    <p className={`text-[8px] font-bold leading-tight mt-0.5 truncate max-w-[120px] ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                      {config.headerTitle}
                    </p>
                  )}
                </div>
              </div>

              {getEffectiveBadgeTag(config) && (
                <div className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold border shrink-0 truncate max-w-[100px] ${styles.badgeBg} ${styles.badgeText}`}>
                  {getEffectiveBadgeTag(config)}
                </div>
              )}
            </div>
          )}

          {/* Question Box */}
          <div className={`my-auto p-2 rounded-lg ${styles.cardBg} shadow-md space-y-1 ${isLight ? 'border border-slate-300' : 'border border-white/10'}`}>
            <div className="flex items-center justify-between">
              <span className="px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[8px]">
                ১
              </span>
              <span className={`text-[8px] font-bold ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>জীববিজ্ঞান</span>
            </div>
            <p className={`text-[10px] sm:text-[11px] font-bold ${questionAlignClass} line-clamp-1 ${isLight ? 'text-slate-950' : 'text-white'}`}>
              রুই মাছের হৃদপিণ্ডে কয়টি প্রকোষ্ঠ থাকে?
            </p>

            {/* Options Sample (1col, 2col, 4col) */}
            <div className={`grid ${optionsGridClass} pt-0.5`}>
              <div
                className={`p-1 rounded text-[8px] font-bold flex items-center justify-between border ${
                  effectiveShowAnswerInSlide(config)
                    ? `${styles.optionSelectedBg} border-amber-400`
                    : `${styles.optionBg} ${isLight ? 'border-slate-300' : 'border-white/10'}`
                }`}
              >
                <span>ক) ২টি</span>
                {effectiveShowAnswerInSlide(config) && (
                  <span className="w-3 h-3 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[7px] font-black">
                    ✓
                  </span>
                )}
              </div>
              <div className={`p-1 rounded text-[8px] font-bold border ${styles.optionBg} ${isLight ? 'border-slate-300' : 'border-white/10'}`}>
                <span>খ) ৪টি</span>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className={`flex items-center justify-between pt-1 border-t text-[8px] font-bold ${isLight ? 'border-slate-300 text-slate-900' : 'border-white/15 text-slate-200'}`}>
            <span className="truncate max-w-[110px]">{config.watermarkHandle || 'Hasnat Shuvro'}</span>
            <span className={`font-mono truncate max-w-[90px] ${isLight ? 'text-amber-800 font-extrabold' : 'text-amber-400'}`}>{config.footerTag || 'BIOMISSION'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DeckSettings: React.FC<DeckSettingsProps> = ({
  config,
  onUpdateConfig,
  activeSlideIndex = 0,
  activeSlideConfig,
  onUpdateActiveSlideConfig,
  onResetActiveSlideConfig,
  appTheme = 'dark',
  onEnforceClassroomView,
  totalQuestions = 0,
}) => {
  const isAppLight = appTheme === 'light';
  const [isAnswerModeModalOpen, setIsAnswerModeModalOpen] = useState(false);
  const [themeFilter, setThemeFilter] = useState<'all' | 'light' | 'dark' | 'custom'>('all');
  const [fontCategoryFilter, setFontCategoryFilter] = useState<string>('all');

  // Saved custom template presets (Templates tab)
  const [savedPresets, setSavedPresets] = useState<DeckTemplatePreset[]>(getTemplatePresets());
  const [presetName, setPresetName] = useState('');
  const [presetDesc, setPresetDesc] = useState('');

  const handleSavePreset = () => {
    saveTemplatePreset(presetName, config, presetDesc);
    setSavedPresets(getTemplatePresets());
    setPresetName('');
    setPresetDesc('');
  };

  const handleApplyPreset = (preset: DeckTemplatePreset) => {
    const updated = applyDesignToConfig(preset, config);
    if (updated.slideTextBoxes && updated.slideTextBoxes.length > 0) {
      updated.slideTextBoxes = templateToTextBoxes(updated);
    }
    onUpdateConfig(updated);
  };

  const handleDeletePreset = (id: string) => {
    if (!window.confirm('Delete this saved template preset?')) return;
    deleteTemplatePreset(id);
    setSavedPresets(getTemplatePresets());
  };

  const [globalSavedNotice, setGlobalSavedNotice] = useState(false);

  const handleSaveAsAppDefaults = () => {
    saveGlobalDefaults({
      defaultDeckName: config.deckName || 'Untitled Deck',
      defaultTemplateId: config.templateId || 'nobel-dark',
      defaultQuestionNumberFormat: config.questionNumberFormat || 'bangla',
      brandName: config.brandName || "NOBEL'S CLASSROOM",
      badgeTag: config.badgeTag || 'Biology',
      logoUrl: config.logoUrl || '',
      logoSize: config.logoSize || 'md',
      logoPosition: config.logoPosition || 'top-left',
      footerTag: config.footerTag || 'BIOMISSION',
      watermarkHandle: config.watermarkHandle || 'Hasnat Shuvro',
      watermarkAvatar: config.watermarkAvatar || '',
      bgPreset: config.bgPreset || 'none',
      bgImageUrl: config.bgImageUrl,
      bgImageFit: config.bgImageFit || 'cover',
      bgImageOpacity: config.bgImageOpacity ?? 0.85,
      bgOverlayDarkness: config.bgOverlayDarkness ?? 0.4,
      useHeaderBanner: config.useHeaderBanner,
      headerBannerUrl: config.headerBannerUrl,
      useFooterBanner: config.useFooterBanner,
      footerBannerUrl: config.footerBannerUrl,
      fontFamily: config.fontFamily || "'Hind Siliguri', sans-serif",
      accentColorCustom: config.accentColorCustom,
      customTheme: config.customTheme,
      layoutMode: config.layoutMode || 'standard',
      headerType: config.headerType || 'manual',
      aspectRatio: config.aspectRatio || '16:9',
      headerFont: config.headerFont,
      headerFontSize: config.headerFontSize,
      bodyFont: config.bodyFont,
      bodyFontSize: config.bodyFontSize,
      bodyFontWeight: config.bodyFontWeight,
      questionAlignment: config.questionAlignment,
      questionPosition: config.questionPosition,
      optionsFont: config.optionsFont,
      optionsFontSize: config.optionsFontSize,
      optionsFontWeight: config.optionsFontWeight,
      optionsLayout: config.optionsLayout,
      optionsAlignment: config.optionsAlignment,
      footerFont: config.footerFont,
      footerFontSize: config.footerFontSize,
      answerMode: config.answerMode || 'hidden',
      showAnswerInSlide: config.showAnswerInSlide ?? false,
      answerDisplayStyles: config.answerDisplayStyles,
      showExplanationInSlide: config.showExplanationInSlide ?? false,
    });
    setGlobalSavedNotice(true);
    setTimeout(() => setGlobalSavedNotice(false), 2500);
  };

  // Settings Scope: 'global' applies to all slides without overrides; 'slide' applies to active slide ONLY
  const [settingsScope, setSettingsScope] = useState<'global' | 'slide'>('global');
  const [settingsTab, setSettingsTab] = useState<'typography' | 'layout' | 'background' | 'theme' | 'header' | 'presets'>('typography');

  // Active slide config or global config based on scope
  const themeEffectiveConfig: DeckConfig = { ...config, ...(activeSlideConfig || {}) };

  const hasSlideOverride = !!activeSlideConfig && Object.keys(activeSlideConfig).length > 0;

  // A custom background image is the ONLY background source allowed while it is
  // active — theme templates and background colors are hidden so only one
  // background source can be selected at a time (mutual exclusion).
  const hasCustomBgImage = !!themeEffectiveConfig.bgImageUrl;

  useEffect(() => {
    if (hasCustomBgImage && settingsTab === 'theme') {
      setSettingsTab('background');
    }
  }, [hasCustomBgImage, settingsTab]);

  const isBannerMode = config.headerType === 'banner' || config.useHeaderBanner;

  const handleChange = (field: keyof DeckConfig, value: any) => {
    if (settingsScope === 'slide') {
      onUpdateActiveSlideConfig?.({
        ...(activeSlideConfig || {}),
        [field]: value,
      });
    } else {
      onUpdateConfig({
        ...config,
        [field]: value,
      });
    }
  };

  // Scope-aware multi-field patch — writes several fields in ONE update so none
  // are dropped (two sequential handleChange calls both spread the same stale
  // config and the second would overwrite the first).
  const handlePatch = (patch: Partial<DeckConfig>) => {
    if (settingsScope === 'slide') {
      onUpdateActiveSlideConfig?.({
        ...(activeSlideConfig || {}),
        ...patch,
      });
    } else {
      onUpdateConfig({
        ...config,
        ...patch,
      });
    }
  };

  // Chapter Name — the Header Chapter Title auto-fills from it and the slide
  // badge auto-appends it (see getEffectiveBadgeTag). Writing both fields in
  // one patch keeps the header/badge in sync without stale-clobber.
  const handleChapterNameChange = (value: string) => {
    handlePatch({
      chapterName: value,
      headerTitle: value || config.headerTitle,
    });
  };

  // Answer display mode — 3-state (hidden / highlight / separate_slide). The
  // Theme field change — respects the Global/Slide scope toggle.
  const handleThemeFieldChange = (field: keyof DeckConfig, value: any) => {
    if (settingsScope === 'slide') {
      const updatedSlide = {
        ...(activeSlideConfig || {}),
        [field]: value,
      };
      const effective = { ...config, ...updatedSlide };
      if (effective.slideTextBoxes && effective.slideTextBoxes.length > 0) {
        updatedSlide.slideTextBoxes = templateToTextBoxes(effective);
      }
      onUpdateActiveSlideConfig?.(updatedSlide);
    } else {
      const updatedConfig = {
        ...config,
        [field]: value,
      };
      if (updatedConfig.slideTextBoxes && updatedConfig.slideTextBoxes.length > 0) {
        updatedConfig.slideTextBoxes = templateToTextBoxes(updatedConfig);
      }
      onUpdateConfig(updatedConfig);
    }
  };

  const handleCustomThemeChange = (colorField: keyof CustomThemeColors, value: string) => {
    const existingCustomTheme = themeEffectiveConfig.customTheme || CUSTOM_THEME_PALETTES[0].colors;
    const updatedCustomTheme: CustomThemeColors = {
      ...existingCustomTheme,
      [colorField]: value,
    };

    if (settingsScope === 'slide') {
      const updatedSlide = {
        ...(activeSlideConfig || {}),
        templateId: 'custom-theme',
        customTheme: updatedCustomTheme,
      };
      const effective = { ...config, ...updatedSlide };
      if (effective.slideTextBoxes && effective.slideTextBoxes.length > 0) {
        updatedSlide.slideTextBoxes = templateToTextBoxes(effective);
      }
      onUpdateActiveSlideConfig?.(updatedSlide);
    } else {
      const updatedConfig = {
        ...config,
        templateId: 'custom-theme',
        customTheme: updatedCustomTheme,
      };
      if (updatedConfig.slideTextBoxes && updatedConfig.slideTextBoxes.length > 0) {
        updatedConfig.slideTextBoxes = templateToTextBoxes(updatedConfig);
      }
      onUpdateConfig(updatedConfig);
    }
  };

  const handleApplyCustomPalette = (colors: CustomThemeColors) => {
    if (settingsScope === 'slide') {
      const updatedSlide = {
        ...(activeSlideConfig || {}),
        templateId: 'custom-theme',
        customTheme: colors,
      };
      const effective = { ...config, ...updatedSlide };
      if (effective.slideTextBoxes && effective.slideTextBoxes.length > 0) {
        updatedSlide.slideTextBoxes = templateToTextBoxes(effective);
      }
      onUpdateActiveSlideConfig?.(updatedSlide);
    } else {
      const updatedConfig = {
        ...config,
        templateId: 'custom-theme',
        customTheme: colors,
      };
      if (updatedConfig.slideTextBoxes && updatedConfig.slideTextBoxes.length > 0) {
        updatedConfig.slideTextBoxes = templateToTextBoxes(updatedConfig);
      }
      onUpdateConfig(updatedConfig);
    }
  };

  const handleImageUpload = (field: 'logoUrl' | 'watermarkAvatar' | 'headerBannerUrl' | 'footerBannerUrl', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          handleChange(field, evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredTemplates = TEMPLATES.filter((tmpl) => {
    if (themeFilter === 'light') return tmpl.themeType === 'light';
    if (themeFilter === 'dark') return tmpl.themeType === 'dark';
    return true;
  });

  const filteredFonts = FONT_PRESETS.filter((font) => {
    if (fontCategoryFilter === 'all') return true;
    return font.category === fontCategoryFilter;
  });

  return (
    <div className={`p-6 lg:p-8 space-y-8 ${
      isAppLight ? 'bg-white/40 border border-slate-200' : 'bg-slate-900/40 border border-slate-800'
    }`}>
      {/* SCOPE SELECTION CONTROL HEADER BAR (GLOBAL VS SLIDE SCOPE) */}
      <div className={`p-5 rounded-3xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isAppLight ? 'bg-amber-50/80 border-amber-300' : 'bg-slate-950 border-amber-500/40'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center gap-1.5 shadow">
              <Sliders className="w-3.5 h-3.5" />
              Settings Scope Selector
            </span>
            {hasSlideOverride && (
              <span className={`px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400 text-sm font-extrabold flex items-center gap-1 ${isAppLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                <Target className="w-3 h-3" />
                Slide #{activeSlideIndex + 1} Has Custom Overrides
              </span>
            )}
          </div>
          <h2 className={`text-lg font-extrabold ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
            Configure {settingsScope === 'global' ? 'Global Deck Settings (All Slides)' : `Slide #${activeSlideIndex + 1} Scope (Active Slide Only)`}
          </h2>
          <p className={`text-sm ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Global settings automatically apply to all slides. Changing settings in Slide Scope will customize only Slide #{activeSlideIndex + 1}.
          </p>
        </div>

        {/* Scope Pill Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSettingsScope('global')}
            className={`px-4 py-2 rounded-2xl text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
              settingsScope === 'global'
                ? 'bg-amber-500 text-slate-950 shadow-lg ring-2 ring-amber-400/50'
                : isAppLight
                ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>🌐 Global Deck Scope</span>
          </button>

          <button
            type="button"
            onClick={() => setSettingsScope('slide')}
            className={`px-4 py-2 rounded-2xl text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
              settingsScope === 'slide'
                ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-400/50'
                : isAppLight
                ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4 text-indigo-400" />
            <span>🎯 Slide #{activeSlideIndex + 1} Scope</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAsAppDefaults}
            disabled={globalSavedNotice}
            className="px-4 py-2 rounded-2xl text-sm font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-80"
            title="Save current deck's brand logo, name, background graphic & font as the global app default for all new decks"
          >
            <Save className="w-4 h-4" />
            <span>{globalSavedNotice ? 'Saved as App Defaults!' : 'Set as App Defaults'}</span>
          </button>

          {hasSlideOverride && onResetActiveSlideConfig && (
            <button
              type="button"
              onClick={onResetActiveSlideConfig}
              className={`px-4 py-2.5 rounded-2xl text-sm font-extrabold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 flex items-center gap-1.5 cursor-pointer transition-all ${isAppLight ? 'text-rose-700' : 'text-rose-300'}`}
              title="Clear custom overrides on this slide and revert to global deck settings"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Slide to Global</span>
            </button>
          )}
        </div>
      </div>

      {/* SETTINGS CATEGORY TABS */}
      <div className={`p-2 rounded-3xl border shadow-xl flex flex-wrap items-center gap-1.5 ${
        isAppLight ? 'bg-white/80 border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}>
        {([
          { id: 'typography', icon: Type, label: 'Typography' },
          { id: 'layout', icon: SlidersHorizontal, label: 'Layout & Banners' },
          { id: 'background', icon: ImageIcon, label: 'Background' },
          // Theme tab (templates + background colors) is hidden while a custom
          // background image is active — one background source at a time.
          ...(!hasCustomBgImage ? [{ id: 'theme', icon: Palette, label: 'Theme & Preview' } as const] : []),
          { id: 'header', icon: BookOpen, label: 'Header & Branding' },
          { id: 'presets', icon: LayoutTemplate, label: 'Templates' },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSettingsTab(tab.id)}
            className={`px-4 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
              settingsTab === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-lg ring-2 ring-amber-400/50'
                : isAppLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* SECTION 1: SLIDE TYPOGRAPHY & GRANULAR FONT CONTROLS */}
      {settingsTab === 'typography' && (
      <div className={`p-6 rounded-3xl border space-y-6 ${
        isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}>
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4 ${
          isAppLight ? 'border-slate-200' : 'border-slate-800/80'
        }`}>
          <div>
            <h3 className={`text-base font-extrabold uppercase tracking-wider flex items-center gap-2 ${
              isAppLight ? 'text-amber-700' : 'text-amber-300'
            }`}>
              <Type className="w-4 h-4 text-amber-400" />
              Slide Typography & Granular Font Controls
            </h3>
            <p className={`text-sm mt-0.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Customize fonts & text sizes independently for Header, Question Body, Options & Footer
            </p>
          </div>

          {/* Font Category Filter Tabs */}
          <div className={`flex flex-wrap items-center gap-1 p-1 rounded-xl border ${
            isAppLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-800'
          }`}>
            {[
              { id: 'all', label: 'All Fonts' },
              { id: 'bangla_clean', label: 'Clean Bangla' },
              { id: 'bangla_traditional', label: 'Traditional Serif' },
              { id: 'bangla_display', label: 'Display & Handwritten' },
              { id: 'english_modern', label: 'Sleek English' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFontCategoryFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-sm font-semibold transition-all ${
                  fontCategoryFilter === tab.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : isAppLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Global Primary Font Family Selection */}
        <div className="space-y-3">
          <label className={`text-sm font-extrabold block uppercase tracking-wider ${
            isAppLight ? 'text-slate-700' : 'text-slate-200'
          }`}>
            1. Base Default Font Family
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredFonts.map((font) => {
              const isSelected = (config.fontFamily || "'Kalpurush', serif") === font.family;

              return (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => handleChange('fontFamily', font.family)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 relative group ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                      : isAppLight
                      ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-bold ${
                      isSelected ? 'text-amber-300' : isAppLight ? 'text-slate-900' : 'text-slate-100'
                    }`}>
                      {font.name}
                    </h4>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                  </div>

                  <div
                    style={{ fontFamily: font.family }}
                    className={`p-2.5 rounded-xl border text-slate-100 ${
                      isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/90'
                    }`}
                  >
                    <p className="text-sm font-bold text-amber-300 leading-snug">
                      {font.sampleBangla}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Granular Section Font & Size Overrides */}
        <div className={`p-5 rounded-2xl border space-y-4 ${
          isAppLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <h4 className={`text-base font-extrabold uppercase tracking-wider ${
            isAppLight ? 'text-amber-700' : 'text-amber-300'
          }`}>
            2. Independent Font Family & Size Controls Per Slide Section
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Header Font & Size */}
            <div className={`p-4 rounded-xl border space-y-2 ${
              isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <span className={`text-sm font-bold block ${isAppLight ? 'text-slate-900' : 'text-white'}`}>Header Title & Brand Font</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-sm block mb-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Font Family:</label>
                  <select
                    value={config.headerFont || config.fontFamily || "'Kalpurush', serif"}
                    onChange={(e) => handleChange('headerFont', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm ${
                      isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    {FONT_PRESETS.map((f) => (
                      <option key={f.id} value={f.family}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`text-sm block mb-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Font Size:</label>
                  <select
                    value={config.headerFontSize || 'md'}
                    onChange={(e) => handleChange('headerFontSize', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm font-mono font-bold ${
                      isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    <option value="xs">Small (XS)</option>
                    <option value="sm">Medium (SM)</option>
                    <option value="md">Standard (MD)</option>
                    <option value="lg">Large (LG)</option>
                    <option value="xl">Extra Large (XL)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Question Stem / Body Font, Size, Weight, Alignment & Position */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <span className={`text-sm font-bold block uppercase tracking-wider ${
                isAppLight ? 'text-amber-700' : 'text-amber-300'
              }`}>
                Question Body / Stem Styling & Position
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className={`text-sm block mb-1 font-semibold ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Font Family:</label>
                  <select
                    value={config.bodyFont || config.fontFamily || "'Kalpurush', serif"}
                    onChange={(e) => handleChange('bodyFont', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    {FONT_PRESETS.map((f) => (
                      <option key={f.id} value={f.family}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`text-sm block mb-1 font-semibold ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Font Size:</label>
                  <select
                    value={config.bodyFontSize || 'lg'}
                    onChange={(e) => handleChange('bodyFontSize', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm font-mono font-bold ${
                      isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    <option value="sm">Small (SM)</option>
                    <option value="md">Medium (MD)</option>
                    <option value="lg">Standard (LG)</option>
                    <option value="xl">Large (XL)</option>
                    <option value="2xl">2XL (Huge)</option>
                    <option value="3xl">3XL (Maximum)</option>
                  </select>
                </div>
                <div>
                  <label className={`text-sm block mb-1 font-semibold font-sans ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Font Weight:</label>
                  <select
                    value={config.bodyFontWeight || 'bold'}
                    onChange={(e) => handleChange('bodyFontWeight', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm font-mono font-bold ${
                      isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="semibold">SemiBold</option>
                    <option value="bold">Bold</option>
                    <option value="extrabold">ExtraBold</option>
                  </select>
                </div>
                <div>
                  <label className={`text-sm block mb-1 font-semibold font-sans ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Text Align:</label>
                  <select
                    value={config.questionAlignment || 'left'}
                    onChange={(e) => handleChange('questionAlignment', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm font-mono font-bold ${
                      isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    <option value="left">Left Align ⬅️</option>
                    <option value="center">Center Align ↔️</option>
                    <option value="right">Right Align ➡️</option>
                  </select>
                </div>
                <div>
                  <label className={`text-sm block mb-1 font-semibold font-sans ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Vertical Position:</label>
                  <select
                    value={config.questionPosition || 'top'}
                    onChange={(e) => handleChange('questionPosition', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm font-mono font-bold ${
                      isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    <option value="top">Top (Standard)</option>
                    <option value="center">Center Canvas</option>
                  </select>
                </div>
              </div>
            </div>

            {/* MCQ Options (A, B, C, D) Font, Size, Weight, Layout & Alignment */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <span className={`text-sm font-bold block uppercase tracking-wider ${
                isAppLight ? 'text-amber-700' : 'text-amber-300'
              }`}>
                MCQ Options (A, B, C, D) Font & Layout
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className={`text-sm block mb-1 font-semibold ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Font Family:</label>
                  <select
                    value={config.optionsFont || config.fontFamily || "'Kalpurush', serif"}
                    onChange={(e) => handleChange('optionsFont', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm font-medium ${
                      isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    {FONT_PRESETS.map((f) => (
                      <option key={f.id} value={f.family}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`text-sm block mb-1 font-semibold ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Font Size:</label>
                  <select
                    value={config.optionsFontSize || 'md'}
                    onChange={(e) => handleChange('optionsFontSize', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm font-mono font-bold ${
                      isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    <option value="xs">Small (XS)</option>
                    <option value="sm">Medium (SM)</option>
                    <option value="md">Standard (MD)</option>
                    <option value="lg">Large (LG)</option>
                    <option value="xl">XL (Extra Large)</option>
                    <option value="2xl">2XL (Huge)</option>
                  </select>
                </div>
                <div>
                  <label className={`text-sm block mb-1 font-semibold ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Font Weight:</label>
                  <select
                    value={config.optionsFontWeight || 'bold'}
                    onChange={(e) => handleChange('optionsFontWeight', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm font-mono font-bold ${
                      isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="semibold">SemiBold</option>
                    <option value="bold">Bold</option>
                    <option value="extrabold">ExtraBold</option>
                  </select>
                </div>
                <div>
                  <label className={`text-sm block mb-1 font-semibold ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Grid Layout:</label>
                  <select
                    value={config.optionsLayout || '2col'}
                    onChange={(e) => handleChange('optionsLayout', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm font-mono font-bold ${
                      isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    <option value="1col">1-Column Stack</option>
                    <option value="2col">2-Column Grid (2x2)</option>
                    <option value="4col">4-Column Row (4-across)</option>
                  </select>
                </div>
                <div>
                  <label className={`text-sm block mb-1 font-semibold ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Option Text Align:</label>
                  <select
                    value={config.optionsAlignment || 'left'}
                    onChange={(e) => handleChange('optionsAlignment', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm font-mono font-bold ${
                      isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    <option value="left">Left Align ⬅️</option>
                    <option value="center">Center Align ↔️</option>
                    <option value="right">Right Align ➡️</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer Font & Size */}
            <div className={`p-4 rounded-xl border space-y-2 ${
              isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <span className={`text-sm font-bold block ${isAppLight ? 'text-slate-900' : 'text-white'}`}>Footer & Watermark Font</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-sm block mb-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Font Family:</label>
                  <select
                    value={config.footerFont || config.fontFamily || "'Kalpurush', serif"}
                    onChange={(e) => handleChange('footerFont', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm ${
                      isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    {FONT_PRESETS.map((f) => (
                      <option key={f.id} value={f.family}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`text-sm block mb-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Font Size:</label>
                  <select
                    value={config.footerFontSize || 'sm'}
                    onChange={(e) => handleChange('footerFontSize', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm font-mono font-bold ${
                      isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    <option value="xs">Small (XS)</option>
                    <option value="sm">Standard (SM)</option>
                    <option value="md">Medium (MD)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* SECTION 1.5: LAYOUT MODE & FULL-WIDTH CUSTOM BANNERS */}
      {settingsTab === 'layout' && (
        <LayoutBannerControls
          layoutMode={config.layoutMode}
          useHeaderBanner={config.useHeaderBanner}
          headerBannerUrl={config.headerBannerUrl}
          useFooterBanner={config.useFooterBanner}
          footerBannerUrl={config.footerBannerUrl}
          onLayoutModeChange={(mode) => handleChange('layoutMode', mode)}
          onUseHeaderBannerChange={(val) => handleChange('useHeaderBanner', val)}
          onHeaderBannerUrlChange={(val) => handleChange('headerBannerUrl', val)}
          onUseFooterBannerChange={(val) => handleChange('useFooterBanner', val)}
          onFooterBannerUrlChange={(val) => handleChange('footerBannerUrl', val)}
          onEnforceClassroomView={onEnforceClassroomView}
          isAppLight={isAppLight}
        />
      )}

      {/* SECTION 2: SLIDE BACKGROUND IMAGE & PRESETS */}
      {settingsTab === 'background' && (
        <BackgroundPicker
          value={{
            bgPreset: themeEffectiveConfig.bgPreset,
            bgImageUrl: themeEffectiveConfig.bgImageUrl,
            bgImageFit: themeEffectiveConfig.bgImageFit,
            bgImageOpacity: themeEffectiveConfig.bgImageOpacity,
            bgOverlayDarkness: themeEffectiveConfig.bgOverlayDarkness,
          }}
          onPatch={handlePatch}
          isAppLight={isAppLight}
        />
      )}

      {/* SECTION 3: SLIDE TEMPLATE PALETTE & LIVE 16:9 THUMBNAIL PREVIEW */}
      {settingsTab === 'theme' && (
      <div className={`p-6 rounded-3xl border space-y-6 ${
        isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}>
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4 ${
          isAppLight ? 'border-slate-200' : 'border-slate-800/80'
        }`}>
          <div>
            <h3 className={`text-base font-extrabold uppercase tracking-wider flex items-center gap-2 ${
              isAppLight ? 'text-amber-700' : 'text-amber-300'
            }`}>
              <Palette className="w-4 h-4 text-amber-400" />
              Presentation Theme Palette & Live Thumbnail Preview
            </h3>
            <p className={`text-sm mt-0.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Select a visual theme template (including clean Light Themes and high-contrast Dark Themes)
            </p>
          </div>

          {/* Theme Light vs Dark Category Tabs */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border ${
            isAppLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-800'
          }`}>
            <button
              type="button"
              onClick={() => setThemeFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${
                themeFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : isAppLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Themes
            </button>
            <button
              type="button"
              onClick={() => setThemeFilter('light')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-bold transition-all ${
                themeFilter === 'light'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : isAppLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>☀️ Light Themes</span>
            </button>
            <button
              type="button"
              onClick={() => setThemeFilter('dark')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-bold transition-all ${
                themeFilter === 'dark'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : isAppLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>🌙 Dark Themes</span>
            </button>
          </div>
        </div>

        {/* Slide-scope notice: theme controls always edit the active slide */}
        <div className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-start gap-2 ${
          isAppLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
        }`}>
          <Target className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Theme changes here always apply to the <strong>active slide (Slide #{activeSlideIndex + 1}) only</strong> —
            other slides keep the deck theme. This ignores the Global / Slide scope toggle.
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left: Template Cards Selection Grid */}
          <div className="xl:col-span-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Special Custom Theme Card */}
              <button
                type="button"
                onClick={() => handleThemeFieldChange('templateId', 'custom-theme')}
                className={`relative text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2 group col-span-1 sm:col-span-2 ${
                  themeEffectiveConfig.templateId === 'custom-theme'
                    ? 'bg-gradient-to-r from-amber-500/20 to-purple-500/20 border-amber-400 shadow-xl ring-2 ring-amber-400/50'
                    : isAppLight
                    ? 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <div className="w-full h-9 rounded-xl bg-gradient-to-r from-amber-500 via-purple-500 to-indigo-600 flex items-center justify-between px-3 border border-white/20 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-white animate-pulse" />
                    <span className="text-sm font-black text-white uppercase tracking-wider">
                      ✨ Custom Slide Theme Studio
                    </span>
                  </div>
                  {themeEffectiveConfig.templateId === 'custom-theme' && (
                    <CheckCircle2 className="w-4 h-4 text-amber-300 drop-shadow" />
                  )}
                </div>
                <div>
                  <h4 className={`text-sm font-extrabold ${
                    themeEffectiveConfig.templateId === 'custom-theme' ? 'text-amber-300' : isAppLight ? 'text-slate-900' : 'text-slate-100'
                  }`}>
                    Create Your Own Custom Color Theme
                  </h4>
                  <p className={`text-sm mt-0.5 leading-relaxed ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Build custom hex color combinations for background, cards, borders, text, and answer highlights with instant live preview.
                  </p>
                </div>
              </button>

              {filteredTemplates.map((tmpl) => {
                const isSelected = themeEffectiveConfig.templateId === tmpl.id;
                const isLightTmpl = tmpl.themeType === 'light';

                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleThemeFieldChange('templateId', tmpl.id)}
                    className={`relative text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2 group ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-400 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                        : isAppLight
                        ? 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Gradient Bar Swatch */}
                    <div className={`w-full h-8 rounded-xl bg-gradient-to-r ${tmpl.previewGradient} flex items-center justify-between px-3 border border-white/10 shadow-sm`}>
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm shrink-0"
                        style={{ backgroundColor: tmpl.styles.accentColor }}
                      />
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                          isLightTmpl
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-900/90 text-amber-300'
                        }`}>
                          {isLightTmpl ? '☀️ LIGHT' : '🌙 DARK'}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-amber-400 drop-shadow" />
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-extrabold ${
                          isSelected ? 'text-amber-300' : isAppLight ? 'text-slate-900' : 'text-slate-100'
                        }`}>
                          {tmpl.name}
                        </h4>
                      </div>
                      <p className={`text-sm line-clamp-2 mt-0.5 leading-relaxed ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {tmpl.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* CUSTOM THEME COLOR PICKERS PANEL */}
            {(themeEffectiveConfig.templateId === 'custom-theme' || themeFilter === 'custom') && (
              <div className={`p-5 rounded-2xl border space-y-5 shadow-2xl ${
                isAppLight ? 'bg-amber-50/90 border-amber-300' : 'bg-slate-900/90 border-amber-500/40'
              }`}>
                <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-3 ${
                  isAppLight ? 'border-slate-200' : 'border-slate-800'
                }`}>
                  <div>
                    <h4 className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${
                      isAppLight ? 'text-amber-700' : 'text-amber-300'
                    }`}>
                      <Palette className="w-4 h-4 text-amber-400" />
                      Custom Theme Color Palette Editor
                    </h4>
                    <p className={`text-sm ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Pick custom hex colors for background, cards, borders, text, and MCQ options
                    </p>
                  </div>

                  {/* Preset Quick Swatches */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {CUSTOM_THEME_PALETTES.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleApplyCustomPalette(preset.colors)}
                        className={`px-2.5 py-1 rounded-lg text-sm font-extrabold border transition-all flex items-center gap-1.5 ${
                          isAppLight ? 'bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:border-amber-400' : 'bg-slate-950 border-slate-700 text-slate-200 hover:text-white hover:border-amber-400'
                        }`}
                        title={preset.name}
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.colors.accentColor }} />
                        <span>{preset.name.split(' ')[1]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Fields Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Canvas Background */}
                  <div className={`p-3 rounded-xl border space-y-1.5 ${
                    isAppLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <label className={`text-sm font-bold block ${isAppLight ? 'text-slate-600' : 'text-slate-300'}`}>Canvas Background:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeEffectiveConfig.customTheme?.bg || '#0f172a'}
                        onChange={(e) => handleCustomThemeChange('bg', e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer border border-slate-700 bg-transparent"
                      />
                      <input
                        type="text"
                        value={themeEffectiveConfig.customTheme?.bg || '#0f172a'}
                        onChange={(e) => handleCustomThemeChange('bg', e.target.value)}
                        className={`w-full text-sm font-mono px-2 py-1 rounded border uppercase font-bold ${
                          isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Card Background */}
                  <div className={`p-3 rounded-xl border space-y-1.5 ${
                    isAppLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <label className={`text-sm font-bold block ${isAppLight ? 'text-slate-600' : 'text-slate-300'}`}>Card Box Background:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeEffectiveConfig.customTheme?.cardBg || '#1e293b'}
                        onChange={(e) => handleCustomThemeChange('cardBg', e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer border border-slate-700 bg-transparent"
                      />
                      <input
                        type="text"
                        value={themeEffectiveConfig.customTheme?.cardBg || '#1e293b'}
                        onChange={(e) => handleCustomThemeChange('cardBg', e.target.value)}
                        className={`w-full text-sm font-mono px-2 py-1 rounded border uppercase font-bold ${
                          isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Card Border & Accent */}
                  <div className={`p-3 rounded-xl border space-y-1.5 ${
                    isAppLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <label className={`text-sm font-bold block ${isAppLight ? 'text-slate-600' : 'text-slate-300'}`}>Card Border & Accent:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeEffectiveConfig.customTheme?.cardBorder || '#f59e0b'}
                        onChange={(e) => handleCustomThemeChange('cardBorder', e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer border border-slate-700 bg-transparent"
                      />
                      <input
                        type="text"
                        value={themeEffectiveConfig.customTheme?.cardBorder || '#f59e0b'}
                        onChange={(e) => handleCustomThemeChange('cardBorder', e.target.value)}
                        className={`w-full text-sm font-mono px-2 py-1 rounded border uppercase font-bold ${
                          isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Title & Question Num Color */}
                  <div className={`p-3 rounded-xl border space-y-1.5 ${
                    isAppLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <label className={`text-sm font-bold block ${isAppLight ? 'text-slate-600' : 'text-slate-300'}`}>Header & Num Accent:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeEffectiveConfig.customTheme?.titleColor || '#f59e0b'}
                        onChange={(e) => handleCustomThemeChange('titleColor', e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer border border-slate-700 bg-transparent"
                      />
                      <input
                        type="text"
                        value={themeEffectiveConfig.customTheme?.titleColor || '#f59e0b'}
                        onChange={(e) => handleCustomThemeChange('titleColor', e.target.value)}
                        className={`w-full text-sm font-mono px-2 py-1 rounded border uppercase font-bold ${
                          isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Body Text Color */}
                  <div className={`p-3 rounded-xl border space-y-1.5 ${
                    isAppLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <label className={`text-sm font-bold block ${isAppLight ? 'text-slate-600' : 'text-slate-300'}`}>Question Stem Text:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeEffectiveConfig.customTheme?.textColor || '#ffffff'}
                        onChange={(e) => handleCustomThemeChange('textColor', e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer border border-slate-700 bg-transparent"
                      />
                      <input
                        type="text"
                        value={themeEffectiveConfig.customTheme?.textColor || '#ffffff'}
                        onChange={(e) => handleCustomThemeChange('textColor', e.target.value)}
                        className={`w-full text-sm font-mono px-2 py-1 rounded border uppercase font-bold ${
                          isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Badge Tag Background */}
                  <div className={`p-3 rounded-xl border space-y-1.5 ${
                    isAppLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <label className={`text-sm font-bold block ${isAppLight ? 'text-slate-600' : 'text-slate-300'}`}>Subject Badge Fill:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeEffectiveConfig.customTheme?.badgeBg || '#f59e0b'}
                        onChange={(e) => handleCustomThemeChange('badgeBg', e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer border border-slate-700 bg-transparent"
                      />
                      <input
                        type="text"
                        value={themeEffectiveConfig.customTheme?.badgeBg || '#f59e0b'}
                        onChange={(e) => handleCustomThemeChange('badgeBg', e.target.value)}
                        className={`w-full text-sm font-mono px-2 py-1 rounded border uppercase font-bold ${
                          isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Thumbnail Preview Box */}
          <div className={`xl:col-span-6 border p-4 rounded-3xl shadow-xl space-y-3 ${
            isAppLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <TemplateThumbnailPreview config={themeEffectiveConfig} />
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 font-mono text-sm font-bold text-center flex items-center justify-center gap-2">
              <Eye className="w-3.5 h-3.5" />
              <span>Theme edits apply to Slide #{activeSlideIndex + 1} (slide-specific)</span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* SECTION 4: HEADER TYPE SELECTOR & BRAND LOGO DETAILS */}
      {settingsTab === 'header' && (
      <div className="space-y-6">
        {/* Header Type Mode Selector */}
        <div className={`p-6 rounded-3xl border space-y-4 ${
          isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3 ${
            isAppLight ? 'border-slate-200' : 'border-slate-800/80'
          }`}>
            <div>
              <h3 className={`text-base font-extrabold uppercase tracking-wider flex items-center gap-2 ${
                isAppLight ? 'text-amber-700' : 'text-amber-300'
              }`}>
                <BookOpen className="w-4 h-4 text-amber-400" />
                Select Header Display Mode: Manual Texting vs Custom Header Image Banner
              </h3>
            <p className={`text-sm mt-0.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Choose between individual editable text elements (Logo + Coaching Title + Subject Badge) OR an all-in-one custom banner image.
              </p>
            </div>
            <div className={`flex items-center gap-2 p-1 rounded-2xl border ${
              isAppLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-800'
            }`}>
              <button
                type="button"
                onClick={() => {
                  handleChange('headerType', 'manual');
                  handleChange('useHeaderBanner', false);
                }}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
                  (config.headerType || 'manual') === 'manual' && !config.useHeaderBanner
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : isAppLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📝 Manual Texting Header
              </button>
              <button
                type="button"
                onClick={() => {
                  handleChange('headerType', 'banner');
                  handleChange('useHeaderBanner', true);
                }}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
                  config.headerType === 'banner' || config.useHeaderBanner
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : isAppLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🖼️ Custom Image Header Banner
              </button>
            </div>
          </div>

          {/* Conditional Controls for Banner Mode */}
          {(config.headerType === 'banner' || config.useHeaderBanner) && (
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isAppLight ? 'bg-amber-50 border-amber-300' : 'bg-slate-900 border-amber-500/30'
            }`}>
              <span className={`text-sm font-extrabold block ${isAppLight ? 'text-amber-700' : 'text-amber-300'}`}>
                Upload All-in-One Custom Header Banner Graphic Image
              </span>
              <p className={`text-sm leading-relaxed ${isAppLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Upload a graphic banner image containing your Coaching Logo, Name, Chapter Title, and Subject badge all together.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                {config.headerBannerUrl ? (
                  <div className="relative group shrink-0">
                    <img
                      src={config.headerBannerUrl}
                      alt="Uploaded Header Banner"
                      className="h-16 max-w-xs object-contain rounded-xl border border-amber-400/60 shadow-lg bg-black/40"
                    />
                    <button
                      type="button"
                      onClick={() => handleChange('headerBannerUrl', '')}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white text-sm font-bold flex items-center justify-center hover:bg-rose-600 shadow-md"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className={`h-16 w-48 rounded-xl border border-dashed flex items-center justify-center text-sm text-center p-2 font-mono ${
                    isAppLight ? 'bg-slate-50 border-slate-300 text-slate-500' : 'bg-slate-950 border-slate-700 text-slate-500'
                  }`}>
                    No Banner Uploaded
                  </div>
                )}

                <div className="flex-1 space-y-2 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={config.headerBannerUrl || ''}
                      onChange={(e) => handleChange('headerBannerUrl', e.target.value)}
                      placeholder="Paste image URL or click upload button"
                      className={`w-full border rounded-xl px-3 py-1.5 text-sm font-mono ${
                        isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    />
                    <label className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 text-sm font-bold cursor-pointer shrink-0 shadow-md flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      Upload Banner
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload('headerBannerUrl', e)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      handleChange('headerBannerUrl', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80');
                      handleChange('useHeaderBanner', true);
                      handleChange('headerType', 'banner');
                    }}
                    className="text-sm font-bold text-amber-400 hover:underline flex items-center gap-1"
                  >
                    ✨ Use Sample Biology Header Banner Image
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {isBannerMode && (
          <div className={`p-5 rounded-2xl border flex items-start gap-3 ${
            isAppLight ? 'bg-amber-50 border-amber-300' : 'bg-slate-900 border-amber-500/30'
          }`}>
            <ImageIcon className={`w-5 h-5 mt-0.5 shrink-0 ${isAppLight ? 'text-amber-600' : 'text-amber-400'}`} />
            <div>
              <p className={`text-sm font-extrabold ${isAppLight ? 'text-amber-800' : 'text-amber-300'}`}>Manual text fields hidden in Custom Banner mode</p>
              <p className={`text-sm mt-0.5 ${isAppLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Logo, brand name, chapter title, subject badge, and instructor watermark are replaced by your banner image. Switch back to Manual Texting Header to edit them.
              </p>
            </div>
          </div>
        )}

        {!isBannerMode && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Brand Logo & Name */}
              <LogoUploader
                logoUrl={config.logoUrl}
                logoSize={config.logoSize}
                brandName={config.brandName}
                onLogoUrlChange={(url) => handleChange('logoUrl', url)}
                onLogoSizeChange={(size) => handleChange('logoSize', size)}
                onBrandNameChange={(name) => handleChange('brandName', name)}
                isAppLight={isAppLight}
              />

              {/* Header Chapter & Class Badge */}
              <div className={`p-5 rounded-2xl border space-y-3 ${
                isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <label className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
                  isAppLight ? 'text-amber-700' : 'text-amber-300'
                }`}>
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  Subject Header & Badge
                </label>
                <div>
                  <label className={`block text-sm mb-1 font-semibold ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Chapter Name <span className="font-normal opacity-70">(optional)</span>:</label>
                  <input
                    type="text"
                    value={config.chapterName || ''}
                    onChange={(e) => handleChapterNameChange(e.target.value)}
                    placeholder="e.g. অধ্যায় ৮ঃ রেচন প্রক্রিয়া"
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm ${
                      isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  />
                  <p className={`text-xs mt-1 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Auto-fills the header title below and appends to the slide badge tag.
                  </p>
                </div>
                <div>
                  <label className={`block text-sm mb-1 font-semibold ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Header Chapter Title:</label>
                  <input
                    type="text"
                    value={config.headerTitle}
                    onChange={(e) => handleChange('headerTitle', e.target.value)}
                    placeholder="e.g. অধ্যায় ৮ঃ রেচন প্রক্রিয়া"
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm ${
                      isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-1 font-semibold ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Class / Subject Badge Tag:</label>
                  <input
                    type="text"
                    value={config.badgeTag}
                    onChange={(e) => handleChange('badgeTag', e.target.value)}
                    placeholder="e.g. ৯-১০ম শ্রেণি | জীববিজ্ঞান"
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm ${
                      isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  />
                  {config.chapterName ? (
                    <p className={`text-xs mt-1 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Slide badge: <span className="font-bold">{getEffectiveBadgeTag(config)}</span>
                    </p>
                  ) : (
                    <p className={`text-xs mt-1 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Set a chapter name above to auto-append it to the badge.
                    </p>
                  )}
                </div>
              </div>

              {/* Instructor Avatar & Handle */}
              <InstructorProfileForm
                watermarkHandle={config.watermarkHandle}
                watermarkAvatar={config.watermarkAvatar}
                footerTag={config.footerTag}
                onWatermarkHandleChange={(handle) => handleChange('watermarkHandle', handle)}
                onWatermarkAvatarChange={(avatar) => handleChange('watermarkAvatar', avatar)}
                onFooterTagChange={(tag) => handleChange('footerTag', tag)}
                isAppLight={isAppLight}
              />
            </div>
          </>
        )}

        {/* Toggles: Answer Display Mode & Numbering Format */}
        <div className={`p-5 rounded-2xl border space-y-3 md:col-span-2 lg:col-span-3 ${
          isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <label className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
            isAppLight ? 'text-amber-700' : 'text-amber-300'
          }`}>
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            Slide Interactive Display Settings
          </label>

          {/* Answer Display Mode — opens the shared Answer Mode & Reveal Settings modal */}
          <div className="pt-1">
            <span className={`block text-sm mb-2 font-semibold ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Answer Display Mode:
            </span>
            <button
              type="button"
              onClick={() => setIsAnswerModeModalOpen(true)}
              className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isAppLight
                  ? 'bg-white border-slate-200 hover:border-amber-400'
                  : 'bg-slate-900 border-slate-800 hover:border-amber-500/60'
              }`}
            >
              <span>
                <span className={`block text-sm font-black ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Configure Answer Mode & Reveal Settings
                </span>
                <span className={`block text-xs mt-0.5 font-semibold ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  Highlights, answer pills, explanation cards & dedicated answer slides
                </span>
              </span>
              <Eye className="w-4 h-4 text-amber-400 shrink-0" />
            </button>
            <p className={`text-xs font-semibold flex items-center gap-1.5 mt-2 ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
              <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Applies to the whole deck (answer slides change the total slide count).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <label className={`flex items-center justify-between cursor-pointer p-3 rounded-xl border ${
              isAppLight ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}>
              <span className={`font-semibold ${isAppLight ? 'text-slate-700' : 'text-slate-200'}`}>Show Explanation Box</span>
              <input
                type="checkbox"
                checked={config.showExplanationInSlide}
                onChange={(e) => handleChange('showExplanationInSlide', e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
            </label>

            <QuestionNumberChanger
              value={config.questionNumberFormat}
              onChange={(fmt) => handleChange('questionNumberFormat', fmt)}
              appTheme={appTheme}
            />
          </div>
        </div>
      </div>
      )}

      {/* SECTION 5: SAVED CUSTOM TEMPLATE PRESETS (SAVE / SWITCH / DELETE) */}
      {settingsTab === 'presets' && (
      <div className={`p-6 rounded-3xl border space-y-6 ${
        isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}>
        <div className={`border-b pb-4 ${isAppLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
          <h3 className={`text-base font-extrabold uppercase tracking-wider flex items-center gap-2 ${
            isAppLight ? 'text-amber-700' : 'text-amber-300'
          }`}>
            <LayoutTemplate className="w-4 h-4 text-amber-400" />
            Saved Custom Template Presets
          </h3>
          <p className={`text-sm mt-0.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Capture the current design (theme, fonts, layout, background, banners &amp; logo) as a named template, then switch back to it anytime with one click.
          </p>
        </div>

        {/* Save Current Design Card */}
        <div className={`p-5 rounded-2xl border space-y-3 ${
          isAppLight ? 'bg-amber-50 border-amber-300' : 'bg-slate-900 border-amber-500/40'
        }`}>
          <span className={`text-sm font-extrabold flex items-center gap-2 ${isAppLight ? 'text-amber-700' : 'text-amber-300'}`}>
            <Save className="w-4 h-4" />
            Save Current Design as Preset
          </span>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset name (e.g. Nobel Biology Dark)"
              className={`flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 font-bold ${
                isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            />
            <button
              type="button"
              onClick={handleSavePreset}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Preset
            </button>
          </div>
          <input
            type="text"
            value={presetDesc}
            onChange={(e) => setPresetDesc(e.target.value)}
            placeholder="Optional short description (e.g. Dark coaching style with banner header)"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 ${
              isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
            }`}
          />
          <p className={`text-[11px] ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Saving with an existing name overwrites that preset. Content (brand name, header title, badge, watermark text) is NOT saved — presets are visual design only.
          </p>
        </div>

        {/* Saved Presets Grid */}
        {savedPresets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedPresets.map((preset) => {
              const tmpl = getTemplateById(preset.design.templateId, preset.design.customTheme);
              const isCurrent =
                config.templateId === preset.design.templateId &&
                JSON.stringify(config.customTheme) === JSON.stringify(preset.design.customTheme);
              const accent = preset.design.customTheme?.accentColor || tmpl.styles.accentColor;
              const bg = preset.design.customTheme?.bg || tmpl.styles.hexColors.bg;
              return (
                <div
                  key={preset.id}
                  className={`p-4 rounded-2xl border space-y-3 transition-all ${
                    isCurrent
                      ? isAppLight
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/50'
                        : 'bg-amber-500/10 border-amber-500/50 ring-2 ring-amber-500/40'
                      : isAppLight
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Theme swatch */}
                    <div
                      className="w-14 h-14 rounded-2xl border border-white/15 shadow-lg shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: bg }}
                    >
                      <span className="w-6 h-6 rounded-full border-2 border-white/40 shadow" style={{ backgroundColor: accent }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-sm font-extrabold truncate ${isAppLight ? 'text-slate-900' : 'text-slate-100'}`}>
                          {preset.name}
                        </h4>
                        {isCurrent && (
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase flex items-center gap-1 ${
                            isAppLight ? 'bg-amber-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {preset.description || tmpl.name} · {new Date(preset.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`flex-1 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isCurrent
                          ? isAppLight
                            ? 'bg-slate-200 text-slate-500 cursor-default'
                            : 'bg-slate-800 text-slate-500 cursor-default'
                          : isAppLight
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow'
                      }`}
                      disabled={isCurrent}
                      title={isCurrent ? 'This preset is already active' : 'Switch the deck design to this preset'}
                    >
                      <LayoutTemplate className="w-3.5 h-3.5" />
                      {isCurrent ? 'Active' : 'Switch to This Template'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePreset(preset.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        isAppLight ? 'bg-white border-rose-300 text-rose-600 hover:bg-rose-50' : 'bg-slate-950 border-rose-500/40 text-rose-300 hover:border-rose-500'
                      }`}
                      title="Delete this preset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`p-6 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center gap-2 ${
            isAppLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-700'
          }`}>
            <LayoutTemplate className={`w-8 h-8 ${isAppLight ? 'text-slate-400' : 'text-slate-600'}`} />
            <p className={`text-sm font-bold ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
              No saved templates yet
            </p>
            <p className={`text-sm ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
              Tune your design in the other tabs, then save it above to switch between looks instantly.
            </p>
          </div>
        )}
      </div>
      )}

      <AnswerModeModal
        isOpen={isAnswerModeModalOpen}
        onClose={() => setIsAnswerModeModalOpen(false)}
        config={config}
        activeSlideConfig={activeSlideConfig}
        onApplyConfig={onUpdateConfig}
        onApplyActiveSlideConfig={onUpdateActiveSlideConfig}
        totalQuestions={totalQuestions}
        appTheme={appTheme}
      />
    </div>
);
};
