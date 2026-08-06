import React, { useState, useEffect } from 'react';
import { MCQItem, DeckConfig } from '../types';
import { TEMPLATES } from '../templates/registry';
import { FONT_PRESETS } from '../utils/fontPresets';
import { BACKGROUND_PRESETS } from '../utils/backgroundPresets';
import {
  getTemplatePresets,
  saveTemplatePreset,
  deleteTemplatePreset,
  DeckTemplatePreset,
} from '../utils/templatePresets';
import { SlideThumb } from './SlideThumb';
import {
  LayoutTemplate,
  Save,
  Trash2,
  CheckCircle2,
  Wand2,
  Palette,
  Type,
  Image as ImageIcon,
  Check,
  Sparkles,
} from 'lucide-react';

const ACCENT_COLORS = ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#eab308', '#64748b'];

const FALLBACK_ITEM: MCQItem = {
  id: 'sample',
  questionType: 'standard',
  stem: 'সালোকসংশ্লেষণের প্রধান রঞ্জক কোনটি?',
  options: [
    { key: 'ক', text: 'ক্লোরোফিল', isCorrect: true },
    { key: 'খ', text: 'ক্যারোটিন', isCorrect: false },
    { key: 'গ', text: 'জ্যান্থোফিল', isCorrect: false },
    { key: 'ঘ', text: 'ফাইকোসায়ানিন', isCorrect: false },
  ],
  answer: 'ক',
  confidence: 'high',
};

interface TemplateCreatorProps {
  config: DeckConfig;
  items: MCQItem[];
  appTheme: 'dark' | 'light';
  onApplyTemplate: (preset: DeckTemplatePreset) => void;
  onApplyConfig: (config: DeckConfig) => void;
}

export const TemplateCreator: React.FC<TemplateCreatorProps> = ({
  config,
  items,
  appTheme,
  onApplyTemplate,
  onApplyConfig,
}) => {
  const isAppLight = appTheme === 'light';

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [templateId, setTemplateId] = useState(config.templateId === 'custom-theme' ? 'rakib-dark' : config.templateId);
  const [accentColor, setAccentColor] = useState(config.accentColorCustom || '#f59e0b');
  const [fontFamily, setFontFamily] = useState(config.fontFamily || FONT_PRESETS[0].family);
  const [bgPreset, setBgPreset] = useState<DeckConfig['bgPreset']>(config.bgPreset || 'none');
  const [presets, setPresets] = useState<DeckTemplatePreset[]>(getTemplatePresets());

  // Rebuild the candidate design whenever a knob changes.
  const candidateConfig: DeckConfig = {
    ...config,
    templateId,
    accentColorCustom: accentColor,
    fontFamily,
    bgPreset,
  };

  const previewItem = items[0] || FALLBACK_ITEM;

  const handleSave = () => {
    if (!name.trim()) return;
    saveTemplatePreset(name, candidateConfig, desc);
    setPresets(getTemplatePresets());
    setName('');
    setDesc('');
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this saved template?')) return;
    deleteTemplatePreset(id);
    setPresets(getTemplatePresets());
  };

  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-amber-500 ${
    isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
  }`;

  return (
    <div
      className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} border p-6 lg:p-8 space-y-8 ${
        isAppLight ? 'border-slate-200' : 'bg-slate-900/80 border-slate-800'
      }`}
    >
      {/* Page header identity bar */}
      <div className="flex items-center gap-4 pb-2">
        <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25 shrink-0">
          <LayoutTemplate className="w-8 h-8 stroke-[2.5]" />
        </div>
        <div>
          <h2 className={`text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-3 ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
            Template Creator
            <span className={`text-xs px-3 py-1 rounded-full font-mono font-black uppercase border ${
              isAppLight ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              Custom Templates
            </span>
          </h2>
          <p className={`text-sm mt-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Design your own slide format (theme, accent, font, background) with a live preview, then save it as a reusable template.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: DESIGNER CONTROLS */}
        <div className="lg:col-span-5 space-y-5">
          {/* Name & description */}
          <div className={`p-5 rounded-2xl border space-y-3 ${
            isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className={`text-sm font-extrabold flex items-center gap-2 ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
              <Wand2 className="w-4 h-4 text-amber-500" />
              Template Name &amp; Notes
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name (e.g. Rakib Biology Dark)"
              className={inputCls}
            />
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Optional description"
              className={inputCls}
            />
          </div>

          {/* Base theme */}
          <div className={`p-5 rounded-2xl border space-y-3 ${
            isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className={`text-sm font-extrabold flex items-center gap-2 ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
              <Palette className="w-4 h-4 text-amber-500" />
              Base Theme
            </span>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.filter((t) => t.id !== 'custom-theme').map((tmpl) => {
                const isSelected = templateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setTemplateId(tmpl.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/40'
                        : isAppLight
                        ? 'bg-white border-slate-300 hover:border-amber-300'
                        : 'bg-slate-900 border-slate-700 hover:border-amber-500/40'
                    }`}
                  >
                    <div className={`h-8 rounded-lg mb-1.5 ${tmpl.previewGradient} border border-white/10`} />
                    <span className={`block text-xs font-extrabold truncate ${isAppLight ? 'text-slate-800' : 'text-slate-100'}`}>{tmpl.name}</span>
                    <span className={`block text-[10px] font-bold uppercase mt-0.5 ${
                      tmpl.themeType === 'light' ? 'text-amber-600' : 'text-indigo-400'
                    }`}>
                      {tmpl.themeType === 'light' ? '☀️ Light' : '🌙 Dark'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent color */}
          <div className={`p-5 rounded-2xl border space-y-3 ${
            isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className={`text-sm font-extrabold flex items-center gap-2 ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
              <Palette className="w-4 h-4 text-amber-500" />
              Accent Color
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAccentColor(c)}
                  className={`w-7 h-7 rounded-lg border transition-transform hover:scale-110 ${
                    accentColor === c ? 'ring-2 ring-amber-400 scale-110' : ''
                  } ${c === '#ffffff' ? 'border-slate-400' : 'border-white/20'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border border-white/20 bg-transparent"
              />
            </div>
          </div>

          {/* Font */}
          <div className={`p-5 rounded-2xl border space-y-3 ${
            isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className={`text-sm font-extrabold flex items-center gap-2 ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
              <Type className="w-4 h-4 text-amber-500" />
              Font Family
            </span>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className={inputCls}
            >
              {FONT_PRESETS.map((f) => (
                <option key={f.id} value={f.family}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Background */}
          <div className={`p-5 rounded-2xl border space-y-3 ${
            isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className={`text-sm font-extrabold flex items-center gap-2 ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
              <ImageIcon className="w-4 h-4 text-amber-500" />
              Slide Background
            </span>
            <div className="grid grid-cols-2 gap-2">
              {BACKGROUND_PRESETS.map((p) => {
                const isSelected = bgPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setBgPreset(p.id)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/40'
                        : isAppLight
                        ? 'bg-white border-slate-300 hover:border-amber-300'
                        : 'bg-slate-900 border-slate-700 hover:border-amber-500/40'
                    }`}
                  >
                    <div className={`h-8 rounded-lg mb-1.5 bg-gradient-to-br ${p.previewGradient} border border-white/10`} />
                    <span className={`block text-[10px] font-extrabold truncate ${isAppLight ? 'text-slate-700' : 'text-slate-200'}`}>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onApplyConfig(candidateConfig)}
              className="flex-1 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Apply to Current Deck
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex-1 px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-40"
            >
              <Save className="w-4 h-4" />
              Save as Template
            </button>
          </div>
        </div>

        {/* RIGHT: LIVE PREVIEW + SAVED TEMPLATES */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live preview */}
          <div className={`p-5 rounded-2xl border space-y-3 ${
            isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className={`text-sm font-extrabold flex items-center gap-2 ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
              <Sparkles className="w-4 h-4 text-amber-500" />
              Live Preview
            </span>
            <SlideThumb item={previewItem} config={candidateConfig} index={0} totalCount={items.length || 1} />
          </div>

          {/* My templates */}
          <div className={`p-5 rounded-2xl border space-y-3 ${
            isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className={`text-sm font-extrabold flex items-center gap-2 ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
              <LayoutTemplate className="w-4 h-4 text-amber-500" />
              My Templates ({presets.length})
            </span>
            {presets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {presets.map((preset) => {
                  const isCurrent =
                    config.templateId === preset.design.templateId &&
                    JSON.stringify(config.customTheme) === JSON.stringify(preset.design.customTheme);
                  return (
                    <div
                      key={preset.id}
                      className={`p-3 rounded-2xl border space-y-2 ${
                        isCurrent
                          ? isAppLight
                            ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/50'
                            : 'bg-amber-500/10 border-amber-500/50 ring-2 ring-amber-500/40'
                          : isAppLight
                          ? 'bg-white border-slate-200'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`flex-1 min-w-0 text-xs font-extrabold truncate ${isAppLight ? 'text-slate-800' : 'text-slate-100'}`}>
                          {preset.name}
                        </span>
                        {isCurrent && (
                          <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-black uppercase bg-amber-500 text-slate-950">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] truncate ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {preset.description || 'Custom template'}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => onApplyTemplate(preset)}
                          disabled={isCurrent}
                          className={`flex-1 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                            isCurrent
                              ? isAppLight ? 'bg-slate-200 text-slate-500 cursor-default' : 'bg-slate-800 text-slate-500 cursor-default'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          }`}
                        >
                          {isCurrent ? 'Active' : 'Use Template'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(preset.id)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                            isAppLight ? 'bg-white border-rose-300 text-rose-600 hover:bg-rose-50' : 'bg-slate-950 border-rose-500/40 text-rose-300 hover:border-rose-500'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={`text-xs rounded-xl border border-dashed p-4 text-center ${isAppLight ? 'bg-white border-slate-300 text-slate-500' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                No templates saved yet — name your design above and click "Save as Template".
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
