import React, { useState } from 'react';
import { MCQItem, DeckConfig, CustomThemeColors } from '../types';
import { TEMPLATES, getTemplateById, resolveTheme, areThemesEqual } from '../templates/registry';
import { FONT_PRESETS } from '../utils/fontPresets';
import { BACKGROUND_PRESETS, getBackgroundPresetUrl } from '../utils/backgroundPresets';
import {
  getTemplatePresets,
  saveTemplatePreset,
  deleteTemplatePreset,
  renameTemplatePreset,
  applyDesignToConfig,
  DeckTemplatePreset,
} from '../utils/templatePresets';
import { SlideCanvas } from './SlideCanvas';
import { SlideThumb } from './SlideThumb';
import { BackgroundImageEditor } from './BackgroundImageEditor';
import { QuestionNumberChanger } from './QuestionNumberChanger';
import {
  Palette,
  Save,
  Trash2,
  Check,
  Sparkles,
  LayoutTemplate,
  Type,
  ImageIcon,
  Sliders,
  CheckCircle2,
  Layers,
  Wand2,
  Award,
  BookOpen,
  Image as ImageGraphicIcon,
  SlidersHorizontal,
  Edit3,
  Globe,
  Grid,
} from 'lucide-react';

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
      optionSelectedBg: '#164e63',
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

const SAMPLE_PREVIEW_ITEMS: { name: string; item: MCQItem }[] = [
  {
    name: 'Biology (Biology / SSC)',
    item: {
      id: 'prev_bio',
      questionType: 'standard',
      stem: 'সালোকসংশ্লেষণ প্রক্রিয়ায় সৌরশক্তি কোন শক্তিতে রূপান্তরিত হয়?',
      options: [
        { key: 'ক', text: 'তাপশক্তি' },
        { key: 'খ', text: 'রাসায়নিক শক্তি', isCorrect: true },
        { key: 'গ', text: 'যান্ত্রিক শক্তি' },
        { key: 'ঘ', text: 'বিদ্যুৎ শক্তি' },
      ],
      answer: 'খ',
      source: ['জীববিজ্ঞান অধ্যায় ৪'],
    },
  },
  {
    name: 'Physics (Math & Formulas)',
    item: {
      id: 'prev_phy',
      questionType: 'standard',
      stem: 'একটি বস্তু $v = 10\\text{ ms}^{-1}$ বেগে গতিশীল হলে $t = 5\\text{ s}$ পর বস্তুটির অতিক্রান্ত দূরত্ব কত?',
      options: [
        { key: 'A', text: '$20\\text{ m}$' },
        { key: 'B', text: '$50\\text{ m}$', isCorrect: true },
        { key: 'C', text: '$100\\text{ m}$' },
        { key: 'D', text: '$2.5\\text{ m}$' },
      ],
      answer: 'B',
      source: ['পদার্থবিজ্ঞান অধ্যায় ২'],
    },
  },
  {
    name: 'Chemistry (Elements)',
    item: {
      id: 'prev_chem',
      questionType: 'standard',
      stem: 'নিচের কোনটি ক্ষারীয় মৃত্তিকা ধাতু (Alkaline Earth Metal)?',
      options: [
        { key: 'ক', text: 'সোডিয়াম (Na)' },
        { key: 'খ', text: 'ম্যাগনেসিয়াম (Mg)', isCorrect: true },
        { key: 'গ', text: 'পটাশিয়াম (K)' },
        { key: 'ঘ', text: 'কপার (Cu)' },
      ],
      answer: 'খ',
      source: ['রসায়ন অধ্যায় ৪'],
    },
  },
];

interface TemplateCreatorProps {
  config: DeckConfig;
  items?: MCQItem[];
  appTheme?: 'dark' | 'light';
  onApplyConfig: (updatedConfig: DeckConfig) => void;
  onApplyTemplate?: (preset: DeckTemplatePreset) => void;
}

export const TemplateCreator: React.FC<TemplateCreatorProps> = ({
  config,
  items = [],
  appTheme = 'dark',
  onApplyConfig,
  onApplyTemplate,
}) => {
  const isAppLight = appTheme === 'light';
  const [activeTab, setActiveTab] = useState<'theme' | 'fonts' | 'background' | 'branding' | 'layout' | 'presets'>('theme');
  const [sampleIdx, setSampleIdx] = useState(0);
  const [presetName, setPresetName] = useState('');
  const [presetDesc, setPresetDesc] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);
  const [presets, setPresets] = useState<DeckTemplatePreset[]>(getTemplatePresets());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const previewItem = items[0] || SAMPLE_PREVIEW_ITEMS[sampleIdx].item;

  const activeTemplate = getTemplateById(config.templateId, config.customTheme);

  const currentCustomTheme: CustomThemeColors = config.customTheme || {
    bg: activeTemplate.styles.hexColors.bg.startsWith('#')
      ? activeTemplate.styles.hexColors.bg
      : `#${activeTemplate.styles.hexColors.bg}`,
    cardBg: activeTemplate.styles.hexColors.cardBg.startsWith('#')
      ? activeTemplate.styles.hexColors.cardBg
      : `#${activeTemplate.styles.hexColors.cardBg}`,
    cardBorder: activeTemplate.styles.hexColors.cardBorder.startsWith('#')
      ? activeTemplate.styles.hexColors.cardBorder
      : `#${activeTemplate.styles.hexColors.cardBorder}`,
    titleColor: activeTemplate.styles.hexColors.titleColor.startsWith('#')
      ? activeTemplate.styles.hexColors.titleColor
      : `#${activeTemplate.styles.hexColors.titleColor}`,
    textColor: activeTemplate.styles.hexColors.textColor.startsWith('#')
      ? activeTemplate.styles.hexColors.textColor
      : `#${activeTemplate.styles.hexColors.textColor}`,
    badgeBg: activeTemplate.styles.hexColors.badgeFill.startsWith('#')
      ? activeTemplate.styles.hexColors.badgeFill
      : `#${activeTemplate.styles.hexColors.badgeFill}`,
    badgeText: activeTemplate.styles.hexColors.badgeText.startsWith('#')
      ? activeTemplate.styles.hexColors.badgeText
      : `#${activeTemplate.styles.hexColors.badgeText}`,
    optionBg: activeTemplate.styles.hexColors.optionBg.startsWith('#')
      ? activeTemplate.styles.hexColors.optionBg
      : `#${activeTemplate.styles.hexColors.optionBg}`,
    optionBorder: activeTemplate.styles.hexColors.optionBorder.startsWith('#')
      ? activeTemplate.styles.hexColors.optionBorder
      : `#${activeTemplate.styles.hexColors.optionBorder}`,
    optionSelectedBg: activeTemplate.styles.hexColors.optionSelectedBg.startsWith('#')
      ? activeTemplate.styles.hexColors.optionSelectedBg
      : `#${activeTemplate.styles.hexColors.optionSelectedBg}`,
    optionSelectedBorder: activeTemplate.styles.hexColors.optionSelectedBorder.startsWith('#')
      ? activeTemplate.styles.hexColors.optionSelectedBorder
      : `#${activeTemplate.styles.hexColors.optionSelectedBorder}`,
    optionSelectedText: activeTemplate.styles.hexColors.optionSelectedText.startsWith('#')
      ? activeTemplate.styles.hexColors.optionSelectedText
      : `#${activeTemplate.styles.hexColors.optionSelectedText}`,
    accentColor: config.accentColorCustom || activeTemplate.styles.accentColor,
  };

  const handleColorChange = (field: keyof CustomThemeColors, hex: string) => {
    const updatedTheme: CustomThemeColors = {
      ...currentCustomTheme,
      [field]: hex,
    };
    onApplyConfig({
      ...config,
      templateId: 'custom-theme',
      customTheme: updatedTheme,
      accentColorCustom: field === 'accentColor' ? hex : config.accentColorCustom,
    });
  };

  const handleApplyPalette = (paletteColors: CustomThemeColors) => {
    onApplyConfig({
      ...config,
      templateId: 'custom-theme',
      customTheme: paletteColors,
      accentColorCustom: paletteColors.accentColor,
    });
  };

  const handleSelectBuiltinBase = (baseTmplId: string) => {
    const tmpl = getTemplateById(baseTmplId);
    onApplyConfig({
      ...config,
      templateId: tmpl.id,
      customTheme: undefined,
      accentColorCustom: tmpl.styles.accentColor,
      fontFamily: tmpl.styles.fontFamily,
    });
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName.trim()) return;
    saveTemplatePreset(presetName, config, presetDesc);
    setPresets(getTemplatePresets());
    setPresetName('');
    setPresetDesc('');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleDeletePreset = (id: string) => {
    deleteTemplatePreset(id);
    setPresets(getTemplatePresets());
  };

  const handleSaveRename = (id: string) => {
    if (editName.trim()) {
      renameTemplatePreset(id, editName);
      setPresets(getTemplatePresets());
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Identity Header */}
      <div className={`p-6 sm:p-8 rounded-3xl border-2 shadow-2xl ${
        isAppLight ? 'glass-card-fatty-light border-slate-200 text-slate-900' : 'glass-card-fatty border-slate-800 text-slate-100'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-slate-950 shadow-lg shadow-amber-500/25 shrink-0">
              <Wand2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                Template Creator & Design Studio
              </h2>
              <p className={`text-xs sm:text-sm font-semibold mt-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Full-suite design studio: customize palettes, typography, background graphics, branding & layouts with live 16:9 canvas preview
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-mono font-black px-4 py-2 rounded-2xl border-2 ${
              isAppLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              Active Base: {activeTemplate.name}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: SLIDE EDITING CONTROLS (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Navigation Tabs */}
          <div className={`flex items-center gap-2 p-2 rounded-3xl border-2 overflow-x-auto shadow-lg ${
            isAppLight ? 'glass-card-fatty-light border-slate-200' : 'glass-card-fatty border-slate-800'
          }`}>
            {[
              { id: 'theme' as const, label: 'Theme & Colors', icon: Palette },
              { id: 'fonts' as const, label: 'Typography', icon: Type },
              { id: 'background' as const, label: 'Background', icon: ImageGraphicIcon },
              { id: 'branding' as const, label: 'Branding & Logo', icon: Award },
              { id: 'layout' as const, label: 'Layout & Options', icon: Grid },
              { id: 'presets' as const, label: `My Presets (${presets.length})`, icon: Layers },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === id
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 border-2 border-amber-400'
                    : isAppLight
                    ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 border-2 border-transparent'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white border-2 border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* TAB 1: THEMES & COLOR PALETTES */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              {/* Built-in Theme Selector */}
              <div className={`p-5 rounded-3xl border space-y-4 ${
                isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4" /> 1. Select Base Built-in Theme
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TEMPLATES.filter((t) => t.id !== 'custom-theme').map((tmpl) => {
                    const isSel = config.templateId === tmpl.id && !config.customTheme;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => handleSelectBuiltinBase(tmpl.id)}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSel
                            ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40'
                            : isAppLight
                            ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className={`h-6 rounded-lg mb-1.5 ${tmpl.previewGradient} border border-white/10`} />
                        <span className="text-xs font-bold block truncate">{tmpl.name}</span>
                        <span className={`text-[10px] ${tmpl.themeType === 'dark' ? 'text-indigo-400' : 'text-amber-600'}`}>
                          {tmpl.themeType === 'dark' ? '🌙 Dark' : '☀️ Light'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Preset Color Palettes */}
              <div className={`p-5 rounded-3xl border space-y-3 ${
                isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> 2. One-Click Custom Palettes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {CUSTOM_THEME_PALETTES.map((pal) => (
                    <button
                      key={pal.name}
                      type="button"
                      onClick={() => handleApplyPalette(pal.colors)}
                      className={`p-3 rounded-2xl border text-left transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-3 ${
                        isAppLight
                          ? 'bg-slate-50 border-slate-200 hover:border-amber-400'
                          : 'bg-slate-950 border-slate-800 hover:border-amber-500/50'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-xl border border-white/20 shadow shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: pal.colors.bg }}
                      >
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: pal.colors.accentColor }} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate">{pal.name}</span>
                        <span className="text-[10px] text-slate-500 block">Apply complete palette</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Granular Color Tokens */}
              <div className={`p-5 rounded-3xl border space-y-4 ${
                isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Palette className="w-4 h-4" /> 3. Detailed Color Tokens
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  {[
                    { label: 'Slide Background', field: 'bg' as const },
                    { label: 'Card Container Fill', field: 'cardBg' as const },
                    { label: 'Card Border', field: 'cardBorder' as const },
                    { label: 'Title / Header Ink', field: 'titleColor' as const },
                    { label: 'Stem Text Ink', field: 'textColor' as const },
                    { label: 'Brand Accent', field: 'accentColor' as const },
                    { label: 'Badge Fill', field: 'badgeBg' as const },
                    { label: 'Badge Text', field: 'badgeText' as const },
                    { label: 'Option Card Fill', field: 'optionBg' as const },
                    { label: 'Option Card Border', field: 'optionBorder' as const },
                    { label: 'Correct Option Fill', field: 'optionSelectedBg' as const },
                    { label: 'Correct Option Border', field: 'optionSelectedBorder' as const },
                  ].map(({ label, field }) => (
                    <div key={field} className="space-y-1">
                      <label className={`text-[11px] font-semibold block ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {label}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={currentCustomTheme[field] || '#ffffff'}
                          onChange={(e) => handleColorChange(field, e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={currentCustomTheme[field] || '#ffffff'}
                          onChange={(e) => handleColorChange(field, e.target.value)}
                          className={`w-full px-2 py-1 rounded-lg text-xs font-mono border ${
                            isAppLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TYPOGRAPHY & FONT PAIRINGS */}
          {activeTab === 'fonts' && (
            <div className="space-y-6">
              {/* Primary Font Preset Grid */}
              <div className={`p-5 rounded-3xl border space-y-4 ${
                isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Type className="w-4 h-4" /> 1. Primary Bengali / English Font
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {FONT_PRESETS.map((font) => {
                    const isSel = config.fontFamily === font.family;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => onApplyConfig({ ...config, fontFamily: font.family })}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSel
                            ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40'
                            : isAppLight
                            ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold block truncate" style={{ fontFamily: font.family }}>
                            {font.name}
                          </span>
                          {isSel && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                        </div>
                        <span className="text-xs text-slate-400 block truncate mt-1" style={{ fontFamily: font.family }}>
                          {font.sampleBangla}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Size & Weight Adjustments */}
              <div className={`p-5 rounded-3xl border space-y-4 ${
                isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" /> 2. Section Font Sizes & Weights
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Stem Body Font Size */}
                  <div className="space-y-1.5">
                    <label className={`font-bold block ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Question Stem Size
                    </label>
                    <select
                      value={config.bodyFontSize || 'md'}
                      onChange={(e) => onApplyConfig({ ...config, bodyFontSize: e.target.value as any })}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isAppLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <option value="sm">Small (Compact)</option>
                      <option value="md">Medium (Default)</option>
                      <option value="lg">Large (Prominent)</option>
                      <option value="xl">Extra Large (Broadcast)</option>
                    </select>
                  </div>

                  {/* Stem Body Weight */}
                  <div className="space-y-1.5">
                    <label className={`font-bold block ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Question Stem Weight
                    </label>
                    <select
                      value={config.bodyFontWeight || 'bold'}
                      onChange={(e) => onApplyConfig({ ...config, bodyFontWeight: e.target.value as any })}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isAppLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <option value="normal">Normal (400)</option>
                      <option value="bold">Bold (700)</option>
                      <option value="black">Black (900)</option>
                    </select>
                  </div>

                  {/* Options Font Size */}
                  <div className="space-y-1.5">
                    <label className={`font-bold block ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Option Cards Text Size
                    </label>
                    <select
                      value={config.optionsFontSize || 'md'}
                      onChange={(e) => onApplyConfig({ ...config, optionsFontSize: e.target.value as any })}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isAppLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <option value="sm">Small</option>
                      <option value="md">Medium (Default)</option>
                      <option value="lg">Large</option>
                    </select>
                  </div>

                  {/* Options Font Weight */}
                  <div className="space-y-1.5">
                    <label className={`font-bold block ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Option Cards Weight
                    </label>
                    <select
                      value={config.optionsFontWeight || 'bold'}
                      onChange={(e) => onApplyConfig({ ...config, optionsFontWeight: e.target.value as any })}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isAppLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <option value="bold">Bold (700)</option>
                      <option value="black">Black (900)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BACKGROUND GRAPHICS & OVERLAYS */}
          {activeTab === 'background' && (
            <div className="space-y-6">
              {/* Graphic Preset Grid */}
              <div className={`p-5 rounded-3xl border space-y-4 ${
                isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <ImageGraphicIcon className="w-4 h-4" /> 1. Background Graphic Presets
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BACKGROUND_PRESETS.map((preset) => {
                    const isSel = config.bgPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => onApplyConfig({ ...config, bgPreset: preset.id })}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSel
                            ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40'
                            : isAppLight
                            ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs font-bold block truncate">{preset.name}</span>
                        <span className="text-[10px] text-slate-500 block truncate">{preset.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image Upload & Sliders */}
              <div className={`p-5 rounded-3xl border space-y-4 ${
                isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Sliders className="w-4 h-4" /> 2. Image Upload, Opacity & Overlay Darkness
                </h3>

                <div className="space-y-4 text-xs">
                  {/* Custom Background Image URL */}
                  <div className="space-y-1">
                    <label className={`font-bold block ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Custom Background Image URL / Data URL
                    </label>
                    <input
                      type="text"
                      value={config.bgImageUrl || ''}
                      onChange={(e) => onApplyConfig({ ...config, bgImageUrl: e.target.value, bgPreset: e.target.value ? 'custom' : 'none' })}
                      placeholder="https://example.com/background.jpg"
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isAppLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                      }`}
                    />
                  </div>

                  {/* Image Fit Mode */}
                  <div className="space-y-1">
                    <label className={`font-bold block ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Background Image Fit
                    </label>
                    <select
                      value={config.bgImageFit || 'cover'}
                      onChange={(e) => onApplyConfig({ ...config, bgImageFit: e.target.value as any })}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isAppLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <option value="cover">Cover (Fill entire 16:9 canvas)</option>
                      <option value="contain">Contain (Fit inside bounds)</option>
                      <option value="stretch">Stretch (Fit exactly 100% 100%)</option>
                    </select>
                  </div>

                  {/* Image Opacity Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className={isAppLight ? 'text-slate-700' : 'text-slate-300'}>Background Image Opacity</span>
                      <span className="font-mono text-amber-400">{Math.round((config.bgImageOpacity ?? 0.85) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.bgImageOpacity ?? 0.85}
                      onChange={(e) => onApplyConfig({ ...config, bgImageOpacity: parseFloat(e.target.value) })}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>

                  {/* Overlay Darkness Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className={isAppLight ? 'text-slate-700' : 'text-slate-300'}>Readability Tint / Overlay Darkness</span>
                      <span className="font-mono text-amber-400">{Math.round((config.bgOverlayDarkness ?? 0.4) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.9"
                      step="0.05"
                      value={config.bgOverlayDarkness ?? 0.4}
                      onChange={(e) => onApplyConfig({ ...config, bgOverlayDarkness: parseFloat(e.target.value) })}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BRANDING, LOGO & BANNERS */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              {/* Channel Identity */}
              <div className={`p-5 rounded-3xl border space-y-4 ${
                isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Award className="w-4 h-4" /> 1. Channel Identity & Watermark
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className={`font-bold block ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Brand / Coaching Name
                    </label>
                    <input
                      type="text"
                      value={config.brandName || ''}
                      onChange={(e) => onApplyConfig({ ...config, brandName: e.target.value })}
                      placeholder="e.g. NOBEL'S CLASSROOM"
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isAppLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`font-bold block ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Subject / Badge Tag
                    </label>
                    <input
                      type="text"
                      value={config.badgeTag || ''}
                      onChange={(e) => onApplyConfig({ ...config, badgeTag: e.target.value })}
                      placeholder="e.g. SSC Biology (অধ্যায় ৪)"
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isAppLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Logo Settings */}
              <div className={`p-5 rounded-3xl border space-y-4 ${
                isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> 2. Channel Logo Upload & Position
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="sm:col-span-3 space-y-1">
                    <label className={`font-bold block ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Logo Image URL / Data URL
                    </label>
                    <input
                      type="text"
                      value={config.logoUrl || ''}
                      onChange={(e) => onApplyConfig({ ...config, logoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isAppLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`font-bold block ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Logo Size
                    </label>
                    <select
                      value={config.logoSize || 'medium'}
                      onChange={(e) => onApplyConfig({ ...config, logoSize: e.target.value as any })}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isAppLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className={`font-bold block ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Logo Position
                    </label>
                    <select
                      value={config.logoPosition || 'top-left'}
                      onChange={(e) => onApplyConfig({ ...config, logoPosition: e.target.value as any })}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isAppLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <option value="top-left">Top Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-right">Bottom Right</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LAYOUT & OPTIONS */}
          {activeTab === 'layout' && (
            <div className="space-y-6">
              {/* Options Grid Layout */}
              <div className={`p-5 rounded-3xl border space-y-4 ${
                isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Grid className="w-4 h-4" /> 1. Options Grid Layout
                </h3>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: '1col' as const, label: '1 Column (Vertical Stack)' },
                    { id: '2col' as const, label: '2 Columns (2x2 Grid)' },
                    { id: '4col' as const, label: '4 Columns (Horizontal Strip)' },
                  ].map(({ id, label }) => {
                    const isSel = (config.optionsLayout || '2col') === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onApplyConfig({ ...config, optionsLayout: id })}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSel
                            ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40 font-black'
                            : isAppLight
                            ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question Number Digits & Alignment */}
              <div className={`p-5 rounded-3xl border space-y-4 ${
                isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> 2. Numbering Digits & Text Alignment
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <QuestionNumberChanger
                    value={config.questionNumberFormat || 'bangla'}
                    onChange={(fmt) => onApplyConfig({ ...config, questionNumberFormat: fmt })}
                    appTheme={isAppLight ? 'light' : 'dark'}
                  />

                  <div className="space-y-1">
                    <label className={`font-bold block ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Stem Alignment
                    </label>
                    <select
                      value={config.questionAlignment || 'left'}
                      onChange={(e) => onApplyConfig({ ...config, questionAlignment: e.target.value as any })}
                      className={`w-full px-3 py-2 rounded-xl border ${
                        isAppLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <option value="left">Left Aligned</option>
                      <option value="center">Center Aligned</option>
                      <option value="right">Right Aligned</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: MY SAVED PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Saved Template Presets ({presets.length})
                </span>
              </div>

              {presets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {presets.map((preset) => {
                    const presetConfig = { templateId: preset.design.templateId, customTheme: preset.design.customTheme } as DeckConfig;
                    const presetTheme = resolveTheme(presetConfig);
                    const isCurrent = areThemesEqual(config, presetConfig);
                    const accent = presetTheme.colors.accentColor;
                    const bg = presetTheme.colors.bg;
                    return (
                      <div
                        key={preset.id}
                        className={`p-4 rounded-2xl border space-y-3 transition-all ${
                          isCurrent
                            ? isAppLight
                              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30'
                              : 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/30'
                            : isAppLight
                            ? 'bg-white border-slate-200 hover:border-slate-300'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Title Row */}
                        <div className="flex items-center justify-between">
                          {editingId === preset.id ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(preset.id)}
                              onBlur={() => handleSaveRename(preset.id)}
                              autoFocus
                              className={`px-2 py-1 text-xs rounded border font-bold ${
                                isAppLight ? 'bg-white border-slate-300' : 'bg-slate-950 border-slate-700'
                              }`}
                            />
                          ) : (
                            <h4 className="font-bold text-sm flex items-center gap-2">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/20"
                                style={{ backgroundColor: accent }}
                              />
                              {preset.name}
                            </h4>
                          )}
                          <span className={`text-[10px] ${isAppLight ? 'text-slate-400' : 'text-slate-500'}`}>
                            Base: {presetTheme.templateName}
                          </span>
                        </div>

                        {/* Swatches */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400">Swatches:</span>
                            <span className="w-4 h-4 rounded border border-black/30 shadow-sm" style={{ backgroundColor: bg }} />
                            <span className="w-4 h-4 rounded border border-black/30 shadow-sm" style={{ backgroundColor: accent }} />
                          </div>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black flex items-center gap-1">
                              <Check className="w-3 h-3" /> Active
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(preset.id);
                                setEditName(preset.name);
                              }}
                              className="p-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-400"
                              title="Rename preset"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePreset(preset.id)}
                              className="p-1.5 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10"
                              title="Delete preset"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => onApplyConfig(applyDesignToConfig(preset, config))}
                            disabled={isCurrent}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-amber-500/20 text-amber-400 cursor-default'
                                : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                            }`}
                          >
                            {isCurrent ? 'Active' : 'Apply Preset'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`p-8 text-center rounded-3xl border ${
                  isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <LayoutTemplate className="w-10 h-10 mx-auto mb-2 text-slate-500 opacity-40" />
                  <p className="text-xs font-semibold text-slate-400">No custom template presets saved yet.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Design your template in the tabs above and click "Save Preset"!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: LIVE 16:9 CANVAS PREVIEW & SAVE PRESET FORM (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`p-5 rounded-3xl border space-y-4 sticky top-6 ${
            isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            {/* Header + Sample Content Switcher */}
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Sliders className="w-4 h-4" /> Live 16:9 Canvas Preview
              </h3>
              <select
                value={sampleIdx}
                onChange={(e) => setSampleIdx(Number(e.target.value))}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                  isAppLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800 text-amber-300'
                }`}
              >
                {SAMPLE_PREVIEW_ITEMS.map((s, idx) => (
                  <option key={s.name} value={idx}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 16:9 Scaled Slide Canvas */}
            <SlideThumb
              item={previewItem}
              config={config}
              index={0}
              totalCount={1}
              forceShowExplanation={true}
              className="w-full aspect-video rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl bg-slate-950"
            />

            {/* Save Current Design as Preset Form */}
            <form onSubmit={handleSavePreset} className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold flex items-center gap-1.5">
                  <Save className="w-4 h-4 text-amber-400" /> Save Design as Preset Template
                </h4>
                {savedNotice && (
                  <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Saved!
                  </span>
                )}
              </div>

              <input
                type="text"
                placeholder="Preset Name (e.g. My SSC Biology Gold Theme)"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                required
                className={`w-full px-3 py-2 text-xs rounded-xl border font-medium ${
                  isAppLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />

              <input
                type="text"
                placeholder="Description / Notes (Optional)"
                value={presetDesc}
                onChange={(e) => setPresetDesc(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border ${
                  isAppLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Preset Template
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
