import React, { useState } from 'react';
import { Sliders, FileText, Palette, Hash, Sun, Moon, CheckCircle2 } from 'lucide-react';
import { TEMPLATES } from '../templates/registry';
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

  const update = (patch: Partial<GlobalDefaults>) => {
    const next = { ...defaults, ...patch };
    setDefaults(next);
    saveGlobalDefaults(next);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Flat page header — no wrapping card, keeps the page airy */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25 shrink-0">
          <Sliders className="w-8 h-8 stroke-[2.5]" />
        </div>
        <div>
          <h2 className={`text-2xl lg:text-3xl font-black tracking-tight ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
            Global Settings
          </h2>
          <p className={`text-sm mt-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
            App-wide defaults applied to every new deck. Deck-specific branding & layout live inside Slide Studio's Deck Settings.
          </p>
        </div>
      </div>

      {/* Default Deck Name */}
      <div className={`p-6 rounded-3xl border space-y-3 ${
        isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}>
        <label className={`block text-sm font-black uppercase tracking-widest flex items-center gap-2 ${
          isAppLight ? 'text-slate-600' : 'text-slate-400'
        }`}>
          <FileText className="w-4 h-4 text-amber-400" />
          Default Deck Name
        </label>
        <input
          type="text"
          value={defaults.defaultDeckName}
          onChange={(e) => update({ defaultDeckName: e.target.value })}
          placeholder={DEFAULT_GLOBAL_DEFAULTS.defaultDeckName}
          className={`w-full border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-amber-500 transition-all ${
            isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}
        />
        <p className={`text-xs ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
          Used when creating a new deck from Question Bank selections.
        </p>
      </div>

      {/* Default Slide Template */}
      <div className={`p-6 rounded-3xl border space-y-4 ${
        isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}>
        <label className={`block text-sm font-black uppercase tracking-widest flex items-center gap-2 ${
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
                <div>
                  <h4 className={`text-sm font-extrabold ${
                    isSelected ? 'text-amber-300' : isAppLight ? 'text-slate-900' : 'text-slate-100'
                  }`}>
                    {tmpl.name}
                  </h4>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 mt-1" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Default Numbering + App Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-3xl border space-y-3 ${
          isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <label className={`block text-sm font-black uppercase tracking-widest flex items-center gap-2 ${
            isAppLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            <Hash className="w-4 h-4 text-amber-400" />
            Default Question Numbering
          </label>
          <select
            value={defaults.defaultQuestionNumberFormat}
            onChange={(e) => update({ defaultQuestionNumberFormat: e.target.value as GlobalDefaults['defaultQuestionNumberFormat'] })}
            className={`w-full border rounded-xl px-4 py-3 text-sm font-mono font-bold focus:outline-none focus:border-amber-500 cursor-pointer ${
              isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          >
            <option value="bangla">Bangla (১, ২, ৩...)</option>
            <option value="english">English (1, 2, 3...)</option>
            <option value="q_prefix">Q Prefix (Q1, Q2, Q3...)</option>
          </select>
          <p className={`text-xs ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
            New decks start with this question numbering format.
          </p>
        </div>

        <div className={`p-6 rounded-3xl border space-y-4 ${
          isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <label className={`block text-sm font-black uppercase tracking-widest ${
            isAppLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            App Shell Theme
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => !isAppLight && onToggleAppTheme?.()}
              disabled={isAppLight}
              className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                isAppLight
                  ? 'bg-amber-500/10 border-amber-400 ring-1 ring-amber-400/50'
                  : isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-400" />
              <div>
                <div className={`text-sm font-bold ${isAppLight ? 'text-amber-300' : isAppLight ? 'text-slate-900' : 'text-slate-200'}`}>Light</div>
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
                  : isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400" />
              <div>
                <div className={`text-sm font-bold ${!isAppLight ? 'text-amber-300' : isAppLight ? 'text-slate-900' : 'text-slate-200'}`}>Dark</div>
                {!isAppLight && <div className="text-[10px] text-amber-400 font-bold">Active</div>}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className={`pt-2 text-xs font-semibold ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
        Global defaults are saved locally in your browser. Per-deck branding, fonts, layout mode, banners & themes are configured in <strong className={isAppLight ? 'text-amber-600' : 'text-amber-400'}>Slide Studio → Deck Settings</strong>.
      </div>
    </div>
  );
};
