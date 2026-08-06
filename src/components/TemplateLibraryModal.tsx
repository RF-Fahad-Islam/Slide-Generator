import React, { useState, useEffect } from 'react';
import { DeckConfig } from '../types';
import { getTemplateById } from '../templates/registry';
import {
  getTemplatePresets,
  saveTemplatePreset,
  deleteTemplatePreset,
  DeckTemplatePreset,
} from '../utils/templatePresets';
import { LayoutTemplate, Save, Trash2, CheckCircle2, X, FolderOpen, Sparkles } from 'lucide-react';

interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DeckConfig;
  appTheme: 'dark' | 'light';
  onApply: (preset: DeckTemplatePreset) => void;
}

export const TemplateLibraryModal: React.FC<TemplateLibraryModalProps> = ({
  isOpen,
  onClose,
  config,
  appTheme,
  onApply,
}) => {
  const isAppLight = appTheme === 'light';
  const [presets, setPresets] = useState<DeckTemplatePreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [presetDesc, setPresetDesc] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPresets(getTemplatePresets());
      setPresetName('');
      setPresetDesc('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveTemplatePreset(presetName, config, presetDesc);
    setPresets(getTemplatePresets());
    setPresetName('');
    setPresetDesc('');
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this saved template?')) return;
    deleteTemplatePreset(id);
    setPresets(getTemplatePresets());
  };

  const handleApply = (preset: DeckTemplatePreset) => {
    onApply(preset);
    setPresets(getTemplatePresets());
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md ${
      isAppLight ? 'bg-black/40' : 'bg-black/80'
    }`}>
      <div className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} relative w-full max-w-3xl border p-6 lg:p-8 space-y-6 max-h-[92vh] overflow-y-auto ${
        isAppLight ? 'border-slate-200' : 'bg-slate-900/80 border-slate-800'
      }`}>
        <button
          onClick={onClose}
          className={`absolute top-5 right-5 p-2.5 rounded-xl cursor-pointer transition-colors ${
            isAppLight ? 'bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className={`flex items-center gap-4 pb-4 border-b ${isAppLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25">
            <LayoutTemplate className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h3 className={`text-xl font-black ${isAppLight ? 'text-slate-900' : 'text-white'}`}>Template Store</h3>
            <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Save the current slide format as a template, then switch back to it with one click.
            </p>
          </div>
        </div>

        {/* Save current slide format as a template */}
        <div className={`p-5 rounded-2xl border space-y-3 ${
          isAppLight ? 'bg-amber-50 border-amber-300' : 'bg-slate-950 border-amber-500/40'
        }`}>
          <span className={`text-sm font-extrabold flex items-center gap-2 ${isAppLight ? 'text-amber-700' : 'text-amber-300'}`}>
            <Save className="w-4 h-4" />
            Save Current Slide Format as Template
          </span>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Template name (e.g. Rakib Biology Dark)"
              className={`flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 font-bold ${
                isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
              }`}
            />
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Template
            </button>
          </div>
          <input
            type="text"
            value={presetDesc}
            onChange={(e) => setPresetDesc(e.target.value)}
            placeholder="Optional short description (e.g. Dark coaching style with banner header)"
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 ${
              isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          />
          <p className={`text-[11px] ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Captures theme, fonts, layout, background, banners &amp; logo. Question content is NOT saved — saving with an existing name overwrites that template.
          </p>
        </div>

        {/* My templates */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-extrabold flex items-center gap-2 ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
              <FolderOpen className="w-4 h-4 text-amber-500" />
              My Templates ({presets.length})
            </span>
          </div>

          {presets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {presets.map((preset) => {
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
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase flex items-center gap-1 bg-amber-500 text-slate-950">
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
                        onClick={() => handleApply(preset)}
                        disabled={isCurrent}
                        className={`flex-1 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isCurrent
                            ? isAppLight
                              ? 'bg-slate-200 text-slate-500 cursor-default'
                              : 'bg-slate-800 text-slate-500 cursor-default'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow'
                        }`}
                        title={isCurrent ? 'This template is already active' : 'Switch the deck design to this template'}
                      >
                        <LayoutTemplate className="w-3.5 h-3.5" />
                        {isCurrent ? 'Active' : 'Use This Template'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(preset.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          isAppLight ? 'bg-white border-rose-300 text-rose-600 hover:bg-rose-50' : 'bg-slate-950 border-rose-500/40 text-rose-300 hover:border-rose-500'
                        }`}
                        title="Delete this template"
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
              <Sparkles className={`w-8 h-8 ${isAppLight ? 'text-slate-400' : 'text-slate-600'}`} />
              <p className={`text-sm font-bold ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                No saved templates yet
              </p>
              <p className={`text-sm ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
                Tune the design in Deck &amp; Font Settings, then save it above to switch between looks instantly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
