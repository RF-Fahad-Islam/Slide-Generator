import React, { useState, useRef, useEffect } from 'react';
import { DeckConfig, MCQItem, CustomThemeColors } from '../types';
import { getTemplateById } from '../templates/registry';
import { SlideCanvas } from './SlideCanvas';
import { downloadJSON } from '../utils/mcqJson';
import { saveTemplatePreset, getTemplatePresets, deleteTemplatePreset, DeckTemplatePreset } from '../utils/templatePresets';
import { Palette, Download, Upload, Plus, Trash2, Check, X, Sliders, Eye } from 'lucide-react';

export interface CustomTemplateJSON {
  version: 1;
  id: string;
  name: string;
  description?: string;
  styles: {
    fontFamily?: string;
    hexColors: CustomThemeColors;
  };
}

interface TemplateStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DeckConfig;
  onApplyTemplate: (templateId: string, customThemeOverride?: CustomThemeColors) => void;
  appTheme?: 'dark' | 'light';
}

const SAMPLE_STUDIO_MCQ: MCQItem = {
  id: 'studio_sample_1',
  questionType: 'standard',
  stem: 'প্রোটিন সংশ্লেষণের সময় রাইবোসোম কোন প্রক্রিয়ায় অংশগ্রহণ করে?',
  options: [
    { key: 'A', text: 'ট্রান্সক্রিপশন' },
    { key: 'B', text: 'ট্রান্সলেশন', isCorrect: true },
    { key: 'C', text: 'রেপ্লিকেশন' },
    { key: 'D', text: 'রিভার্স ট্রান্সক্রিপশন' },
  ],
  answer: 'B',
  explanation: 'mRNA থেকে প্রোটিন সংশ্লেষণের প্রক্রিয়াকে ট্রান্সলেশন বলে। এটি রাইবোসোমে সংঘটিত হয়।',
  tags: {
    subject: 'জীববিজ্ঞান',
    className: '৯ম-১০ম শ্রেণি',
    paper: '১ম পত্র',
  },
};

export const TemplateStudioModal: React.FC<TemplateStudioModalProps> = ({
  isOpen,
  onClose,
  config,
  onApplyTemplate,
  appTheme = 'dark',
}) => {
  const isAppLight = appTheme === 'light';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const baseTemplate = getTemplateById(config.templateId);
  const baseHex = baseTemplate.styles.hexColors;

  const initialTheme: CustomThemeColors = config.customTheme || {
    name: baseTemplate.name,
    bg: baseHex.bg ? `#${baseHex.bg}` : '#0f172a',
    cardBg: baseHex.cardBg ? `#${baseHex.cardBg}` : '#1e293b',
    cardBorder: baseHex.cardBorder ? `#${baseHex.cardBorder}` : '#334155',
    titleColor: baseHex.titleColor ? `#${baseHex.titleColor}` : '#38bdf8',
    textColor: baseHex.textColor ? `#${baseHex.textColor}` : '#f8fafc',
    badgeBg: baseHex.badgeFill ? `#${baseHex.badgeFill}` : '#38bdf8',
    badgeText: baseHex.badgeText ? `#${baseHex.badgeText}` : '#0f172a',
    optionBg: baseHex.optionBg ? `#${baseHex.optionBg}` : '#1e293b',
    optionBorder: baseHex.optionBorder ? `#${baseHex.optionBorder}` : '#334155',
    optionSelectedBg: baseHex.optionSelectedBg ? `#${baseHex.optionSelectedBg}` : '#78350f',
    optionSelectedBorder: baseHex.optionSelectedBorder ? `#${baseHex.optionSelectedBorder}` : '#f59e0b',
    optionSelectedText: baseHex.optionSelectedText ? `#${baseHex.optionSelectedText}` : '#fef3c7',
    accentColor: config.accentColorCustom || baseTemplate.styles.accentColor || '#10b981',
  };

  const [templateName, setTemplateName] = useState<string>(`Custom ${baseTemplate.name}`);
  const [fontFamily, setFontFamily] = useState<string>(config.fontFamily || 'Hind Siliguri');
  const [bg, setBg] = useState<string>(initialTheme.bg || '#0f172a');
  const [cardBg, setCardBg] = useState<string>(initialTheme.cardBg || '#1e293b');
  const [cardBorder, setCardBorder] = useState<string>(initialTheme.cardBorder || '#334155');
  const [textColor, setTextColor] = useState<string>(initialTheme.textColor || '#f8fafc');
  const [titleColor, setTitleColor] = useState<string>(initialTheme.titleColor || '#38bdf8');
  const [accentColor, setAccentColor] = useState<string>(initialTheme.accentColor || '#10b981');

  const [savedPresets, setSavedPresets] = useState<DeckTemplatePreset[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadSavedPresets();
    }
  }, [isOpen]);

  const loadSavedPresets = async () => {
    try {
      const presets = getTemplatePresets();
      setSavedPresets(presets || []);
    } catch (e) {
      console.error('Failed to load saved template presets:', e);
    }
  };

  if (!isOpen) return null;

  const liveCustomTheme: CustomThemeColors = {
    name: templateName,
    bg,
    cardBg,
    cardBorder,
    textColor,
    titleColor,
    badgeBg: accentColor,
    badgeText: '#0f172a',
    optionBg: cardBg,
    optionBorder: cardBorder,
    optionSelectedBg: '#78350f',
    optionSelectedBorder: accentColor,
    optionSelectedText: '#fef3c7',
    accentColor,
  };

  const previewConfig: DeckConfig = {
    ...config,
    customTheme: liveCustomTheme,
    accentColorCustom: accentColor,
    fontFamily: fontFamily,
  };

  // Export current template as JSON
  const handleExportJSON = () => {
    const jsonObj: CustomTemplateJSON = {
      version: 1,
      id: `custom_template_${Date.now()}`,
      name: templateName.trim() || 'Custom Slide Template',
      description: 'Exported from EdTech MCQ Studio Template Studio',
      styles: {
        fontFamily,
        hexColors: liveCustomTheme,
      },
    };
    downloadJSON(jsonObj, `${templateName.replace(/\s+/g, '_').toLowerCase()}_template.json`);
  };

  // Import JSON Template
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string) as CustomTemplateJSON;
        if (!parsed.styles || !parsed.styles.hexColors) {
          throw new Error('Invalid template format: missing styles or hexColors');
        }

        if (parsed.name) setTemplateName(parsed.name);
        if (parsed.styles.fontFamily) setFontFamily(parsed.styles.fontFamily);
        const hex = parsed.styles.hexColors;
        if (hex.bg) setBg(hex.bg);
        if (hex.cardBg) setCardBg(hex.cardBg);
        if (hex.cardBorder) setCardBorder(hex.cardBorder);
        if (hex.textColor) setTextColor(hex.textColor);
        if (hex.titleColor) setTitleColor(hex.titleColor);
        if (hex.accentColor) setAccentColor(hex.accentColor);

        // Auto save to local presets
        const targetConfig: DeckConfig = {
          ...config,
          customTheme: hex,
          accentColorCustom: hex.accentColor,
          fontFamily: parsed.styles.fontFamily || fontFamily,
        };
        saveTemplatePreset(parsed.name || 'Imported Template', targetConfig, parsed.description);
        loadSavedPresets();

        setSaveSuccessMsg('Template JSON imported and saved to presets!');
        setTimeout(() => setSaveSuccessMsg(''), 3000);
      } catch (err: any) {
        alert('Failed to import JSON template: ' + err.message);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save current template preset
  const handleSavePreset = () => {
    try {
      saveTemplatePreset(templateName.trim() || 'Custom Preset', previewConfig, 'User created in Template Studio');
      loadSavedPresets();
      setSaveSuccessMsg('Template preset saved to local library!');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (e: any) {
      alert('Failed to save preset: ' + e.message);
    }
  };

  // Apply to active deck
  const handleApplyToActiveDeck = () => {
    onApplyTemplate('custom-theme', liveCustomTheme);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-modal-backdrop">
      <div
        className={`w-full max-w-5xl max-h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-modal-card ${
          isAppLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-6 border-b flex items-center justify-between gap-4 ${
          isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">Interactive Template Studio</h3>
              <p className={`text-xs ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Build, fork, customize & export/import JSON design templates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-colors ${
                isAppLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              <Upload className="w-4 h-4 text-emerald-500" />
              Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />

            <button
              onClick={handleExportJSON}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-colors ${
                isAppLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              <Download className="w-4 h-4 text-sky-500" />
              Export JSON
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isAppLight ? 'hover:bg-slate-100 border-slate-200 text-slate-500' : 'hover:bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Color & Style Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {saveSuccessMsg && (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                {saveSuccessMsg}
              </div>
            )}

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Template Name
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm font-bold ${
                  isAppLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Font Stack
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm font-bold ${
                  isAppLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
              >
                <option value="Hind Siliguri">Hind Siliguri (Bengali Standard)</option>
                <option value="Kalpurush">Kalpurush</option>
                <option value="Noto Sans Bengali">Noto Sans Bengali</option>
                <option value="Anek Bangla">Anek Bangla</option>
                <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                <option value="Poppins">Poppins</option>
              </select>
            </div>

            {/* Color Palette Grid */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> Color Tokens
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Background
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bg}
                      onChange={(e) => setBg(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={bg}
                      onChange={(e) => setBg(e.target.value)}
                      className={`w-full px-2 py-1 text-xs font-mono rounded-lg border ${
                        isAppLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Card Container
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cardBg}
                      onChange={(e) => setCardBg(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={cardBg}
                      onChange={(e) => setCardBg(e.target.value)}
                      className={`w-full px-2 py-1 text-xs font-mono rounded-lg border ${
                        isAppLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Card Border
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cardBorder}
                      onChange={(e) => setCardBorder(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={cardBorder}
                      onChange={(e) => setCardBorder(e.target.value)}
                      className={`w-full px-2 py-1 text-xs font-mono rounded-lg border ${
                        isAppLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Stem & Text
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className={`w-full px-2 py-1 text-xs font-mono rounded-lg border ${
                        isAppLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Title & Headers
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={titleColor}
                      onChange={(e) => setTitleColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={titleColor}
                      onChange={(e) => setTitleColor(e.target.value)}
                      className={`w-full px-2 py-1 text-xs font-mono rounded-lg border ${
                        isAppLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-bold mb-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className={`w-full px-2 py-1 text-xs font-mono rounded-lg border ${
                        isAppLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleSavePreset}
                className={`w-full py-2.5 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isAppLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                <Plus className="w-4 h-4 text-amber-500" />
                Save Preset to Library
              </button>

              <button
                onClick={handleApplyToActiveDeck}
                className="w-full py-3 rounded-xl font-black text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Check className="w-4 h-4" />
                Apply Template to Active Deck
              </button>
            </div>
          </div>

          {/* Right Panel: Live 16:9 Slide Canvas Preview (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-sky-500 flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> Live 16:9 Template Canvas Preview
              </h4>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                isAppLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}>
                1920 x 1080 Aspect
              </span>
            </div>

            <div className={`rounded-2xl border overflow-hidden p-2 shadow-xl ${
              isAppLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <SlideCanvas
                item={SAMPLE_STUDIO_MCQ}
                config={previewConfig}
                currentIndex={0}
                totalCount={1}
              />
            </div>

            {/* Saved User Presets List */}
            {savedPresets.length > 0 && (
              <div className="pt-2">
                <h5 className={`text-xs font-bold mb-2 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Saved Library Presets ({savedPresets.length})
                </h5>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                  {savedPresets.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        const theme = p.design?.customTheme;
                        if (theme) {
                          if (theme.bg) setBg(theme.bg);
                          if (theme.cardBg) setCardBg(theme.cardBg);
                          if (theme.cardBorder) setCardBorder(theme.cardBorder);
                          if (theme.textColor) setTextColor(theme.textColor);
                          if (theme.titleColor) setTitleColor(theme.titleColor);
                          if (theme.accentColor) setAccentColor(theme.accentColor);
                        }
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] ${
                        isAppLight
                          ? 'bg-white hover:bg-slate-50 border-slate-200'
                          : 'bg-slate-950 hover:bg-slate-800 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20"
                          style={{ backgroundColor: p.design?.customTheme?.accentColor || p.design?.accentColorCustom || '#10b981' }}
                        />
                        <span className="text-xs font-bold truncate">{p.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTemplatePreset(p.id);
                          loadSavedPresets();
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
