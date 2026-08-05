import React from 'react';
import { MCQItem, DeckConfig } from '../types';
import { SAMPLE_DECKS } from '../utils/bulkParser';
import { getTemplateById, TEMPLATES } from '../templates/registry';
import {
  Presentation,
  Share2,
  Plus,
  Layers,
  Sliders,
  Sparkles,
  Edit3,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Database,
  Calendar,
  FileText,
  Palette,
  FolderPlus,
  Zap,
  HelpCircle,
  Code2
} from 'lucide-react';

interface SlideDecksHomeProps {
  currentItems: MCQItem[];
  currentConfig: DeckConfig;
  onOpenDeck: (items: MCQItem[], deckTitle?: string) => void;
  onOpenDeckSettings: (items: MCQItem[], config?: DeckConfig) => void;
  onOpenSocialGenerator: (items: MCQItem[]) => void;
  onNavigateTab: (tab: 'home' | 'social' | 'preview' | 'bank' | 'ai' | 'manual' | 'settings') => void;
  onSelectTemplate?: (templateId: string) => void;
  onLoadSample?: (sampleIndex: number) => void;
  appTheme: 'dark' | 'light';
}

export const SlideDecksHome: React.FC<SlideDecksHomeProps> = ({
  currentItems,
  currentConfig,
  onOpenDeck,
  onOpenDeckSettings,
  onOpenSocialGenerator,
  onNavigateTab,
  onSelectTemplate,
  onLoadSample,
  appTheme,
}) => {
  const isAppLight = appTheme === 'light';

  // Sample + Active Slide Decks List
  const decksList = [
    {
      id: 'active_deck',
      title: currentConfig.headerTitle || 'Active Presentation Deck',
      badgeTag: currentConfig.badgeTag || '৯ম-১০ম শ্রেণি | জীববিজ্ঞান',
      questionCount: currentItems.length,
      items: currentItems,
      config: currentConfig,
      isCurrent: true,
      lastUpdated: 'Just Now',
    },
    ...SAMPLE_DECKS.map((sample, idx) => ({
      id: `sample_deck_${idx}`,
      title: sample.name,
      badgeTag: 'কোচিং স্পেশাল',
      questionCount: sample.items.length,
      items: sample.items,
      config: {
        ...currentConfig,
        headerTitle: sample.name,
        badgeTag: 'কোচিং স্পেশাল',
      },
      isCurrent: false,
      lastUpdated: 'Preset Deck',
    })),
  ];

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* SECTION 1: HERO DASHBOARD HEADER HUB */}
      <div
        className={`glass-card-fatty p-8 lg:p-10 relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 ${
          isAppLight
            ? 'bg-gradient-to-r from-amber-500/15 via-amber-100/50 to-white border-amber-200 text-slate-900 shadow-xl'
            : 'bg-gradient-to-r from-amber-500/20 via-slate-950 to-slate-900 border-amber-500/30 text-white'
        }`}
      >
        <div className="space-y-4 max-w-2xl z-10">
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1 rounded-full text-xs font-black font-mono bg-amber-500 text-slate-950 uppercase tracking-wider shadow-md">
              EdTech Studio Central Hub
            </span>
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 fill-amber-400" />
              All-In-One Slide Generator
            </span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight">
            Create HD Presentation Slides & Social Media Graphics
          </h1>
          <p className={`text-sm lg:text-base leading-relaxed ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
            Welcome! Convert raw question papers into 16:9 HD presentation slides, social media graphics, or parse Board exam PDFs with 2-Stage Vision AI!
          </p>

          {/* Quick Preset Sample Loaders */}
          {onLoadSample && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                Quick Samples:
              </span>
              <button
                type="button"
                onClick={() => onLoadSample(0)}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <span>🧬 Biology Sample</span>
              </button>
              <button
                type="button"
                onClick={() => onLoadSample(1)}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <span>📐 Math / Physics LaTeX</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Active Deck Stats Box */}
        <div className={`p-6 rounded-3xl border shrink-0 space-y-4 z-10 min-w-[240px] ${
          isAppLight ? 'bg-white border-amber-300 shadow-xl' : 'bg-slate-950 border-slate-800 shadow-2xl'
        }`}>
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Active Workspace Deck
          </div>
          <div className="text-3xl font-black text-amber-400 flex items-baseline gap-2">
            <span>{currentItems.length}</span>
            <span className="text-sm font-semibold text-slate-400">Questions</span>
          </div>
          <button
            onClick={() => onNavigateTab('preview')}
            className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer transition-all"
          >
            <Presentation className="w-4 h-4 stroke-[2.5]" />
            <span>Open Slide Studio →</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: MAIN STUDIO TOOL MODULES (ALL TOOLS DIRECTLY ACCESSIBLE) */}
      <div className="space-y-6">
        <h2 className="text-xl font-black flex items-center gap-2.5">
          <Zap className="w-6 h-6 text-amber-400" />
          <span>Main Studio Tools & Modules</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tool 1: 16:9 Slide Presentation Generator */}
          <div
            onClick={() => onNavigateTab('preview')}
            className={`glass-card-fatty p-6 border transition-all cursor-pointer flex flex-col justify-between space-y-6 group ${
              isAppLight
                ? 'bg-white/95 border-slate-200 hover:border-amber-400 shadow-lg'
                : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/50 shadow-xl'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3.5 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-lg group-hover:scale-110 transition-transform">
                  <Presentation className="w-7 h-7 stroke-[2.5]" />
                </div>
                <span className="text-xs font-mono font-black px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  16:9 HD Slides
                </span>
              </div>
              <div>
                <h3 className={`text-xl font-black flex items-center gap-2 ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                  <span>16:9 Slide Studio</span>
                  <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className={`text-sm mt-1.5 leading-relaxed ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Full-screen 1920x1080 slide deck generator with answer reveal, live writing classroom mode, LaTeX math, and PNG export.
                </p>
              </div>
            </div>
            <div className="text-sm font-black text-amber-400 group-hover:underline pt-3 border-t border-slate-800/80 flex items-center gap-1">
              <span>Open Slide Studio</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Tool 2: Social Media Posting Card Generator */}
          <div
            onClick={() => onNavigateTab('social')}
            className={`glass-card-fatty p-6 border transition-all cursor-pointer flex flex-col justify-between space-y-6 group ${
              isAppLight
                ? 'bg-white/95 border-slate-200 hover:border-indigo-400 shadow-lg'
                : 'bg-slate-900/80 border-slate-800 hover:border-indigo-500/50 shadow-xl'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3.5 rounded-2xl bg-indigo-600 text-white font-black shadow-lg group-hover:scale-110 transition-transform">
                  <Share2 className="w-7 h-7 stroke-[2.5]" />
                </div>
                <span className="text-xs font-mono font-black px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  1:1 / 4:5 / 9:16
                </span>
              </div>
              <div>
                <h3 className={`text-xl font-black flex items-center gap-2 ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                  <span>Social Posts Generator</span>
                  <ArrowRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className={`text-sm mt-1.5 leading-relaxed ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Create viral Facebook, Instagram feed cards & 9:16 Story graphics with custom watermarks, branding & explanations.
                </p>
              </div>
            </div>
            <div className="text-sm font-black text-indigo-400 group-hover:underline pt-3 border-t border-slate-800/80 flex items-center gap-1">
              <span>Open Social Generator</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Tool 3: AI PDF & Image Parser */}
          <div
            onClick={() => onNavigateTab('ai')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 group ${
              isAppLight
                ? 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-xl'
                : 'bg-slate-900 border-slate-800 hover:border-emerald-500 shadow-xl'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-emerald-600 text-white font-black shadow-md group-hover:scale-105 transition-transform">
                  <Sparkles className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  AI PDF Extract
                </span>
              </div>
              <div>
                <h3 className={`text-base font-extrabold flex items-center gap-2 ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                  <span>AI PDF / Image Parser</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className={`text-xs mt-1 leading-relaxed ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Upload coaching question papers, PDFs, or photos. Gemini AI extracts questions, options & answers automatically!
                </p>
              </div>
            </div>
            <div className="text-xs font-bold text-emerald-400 group-hover:underline pt-2 border-t border-slate-800/80">
              Upload PDF or Text →
            </div>
          </div>

          {/* Tool 4: Bulk MCQ Input & Editor */}
          <div
            onClick={() => onNavigateTab('manual')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 group ${
              isAppLight
                ? 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-xl'
                : 'bg-slate-900 border-slate-800 hover:border-amber-500 shadow-xl'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl font-bold ${
                  isAppLight ? 'bg-amber-100 text-amber-800' : 'bg-slate-800 text-amber-400'
                }`}>
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-sm font-extrabold ${isAppLight ? 'text-slate-900' : 'text-white'}`}>Bulk MCQ Editor</h4>
                  <p className={`text-[11px] ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Manual text input & Multiselect (বহুপদী)</p>
                </div>
              </div>
            </div>
            <div className="text-xs font-bold text-amber-500 group-hover:underline pt-2 border-t border-slate-800/80">
              Open Bulk Editor →
            </div>
          </div>

          {/* Tool 5: Question Bank Archive */}
          <div
            onClick={() => onNavigateTab('bank')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 group ${
              isAppLight
                ? 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-xl'
                : 'bg-slate-900 border-slate-800 hover:border-amber-500 shadow-xl'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl font-bold ${
                  isAppLight ? 'bg-amber-100 text-amber-800' : 'bg-slate-800 text-amber-400'
                }`}>
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-sm font-extrabold ${isAppLight ? 'text-slate-900' : 'text-white'}`}>Question Bank</h4>
                  <p className={`text-[11px] ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Saved questions archive & tag builder</p>
                </div>
              </div>
            </div>
            <div className="text-xs font-bold text-amber-500 group-hover:underline pt-2 border-t border-slate-800/80">
              Open Question Bank →
            </div>
          </div>

          {/* Tool 6: Deck Branding & Font Customization */}
          <div
            onClick={() => onNavigateTab('settings')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 group ${
              isAppLight
                ? 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-xl'
                : 'bg-slate-900 border-slate-800 hover:border-amber-500 shadow-xl'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl font-bold ${
                  isAppLight ? 'bg-amber-100 text-amber-800' : 'bg-slate-800 text-amber-400'
                }`}>
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-sm font-extrabold ${isAppLight ? 'text-slate-900' : 'text-white'}`}>Branding & Fonts</h4>
                  <p className={`text-[11px] ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Custom Bangla fonts, headers & footers</p>
                </div>
              </div>
            </div>
            <div className="text-xs font-bold text-amber-500 group-hover:underline pt-2 border-t border-slate-800/80">
              Configure Branding →
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: QUICK THEME STYLE SELECTOR DIRECTLY ON HOME */}
      {onSelectTemplate && (
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
          isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-400" />
              Active Slide Theme Picker
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Current: {getTemplateById(currentConfig.templateId).name}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {TEMPLATES.map((tmpl) => {
              const isSelected = tmpl.id === currentConfig.templateId;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => onSelectTemplate(tmpl.id)}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-extrabold ring-2 ring-amber-400/40 shadow-lg'
                      : isAppLight
                      ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-[11px] font-bold truncate w-full">{tmpl.name}</span>
                  <span className={`w-3 h-3 rounded-full border ${tmpl.themeType === 'light' ? 'bg-amber-100 border-amber-300' : 'bg-slate-900 border-slate-700'}`} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 4: SLIDE DECKS COLLECTION LIST */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <span>Your Presentation Slide Decks</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold">
                {decksList.length} Decks
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Select a deck to open slide generator preview or customize its branding & fonts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('manual')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create New Deck</span>
            </button>
          </div>
        </div>

        {/* Decks Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decksList.map((deck) => {
            const tmpl = getTemplateById(deck.config.templateId);

            return (
              <div
                key={deck.id}
                className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-6 group ${
                  deck.isCurrent
                    ? isAppLight
                      ? 'bg-amber-50/90 border-amber-400 shadow-xl ring-2 ring-amber-400/40'
                      : 'bg-slate-900 border-amber-500/60 shadow-2xl ring-2 ring-amber-500/30'
                    : isAppLight
                    ? 'glass-card-fatty-light bg-white/95 border-slate-200 hover:border-amber-400 shadow-lg'
                    : 'glass-card-fatty bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-4">
                  {/* Card Top Badge Header */}
                  <div className={`flex items-center justify-between gap-2 border-b pb-3 ${isAppLight ? 'border-slate-200' : 'border-slate-800/60'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono ${
                        deck.isCurrent
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : isAppLight
                          ? 'bg-slate-100 text-amber-700 border border-amber-300'
                          : 'bg-slate-800 text-amber-300'
                      }`}>
                        {deck.questionCount} Questions
                      </span>
                      {deck.isCurrent && (
                        <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active Deck
                        </span>
                      )}
                    </div>

                    <span className={`text-[10px] font-bold flex items-center gap-1 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      <Calendar className="w-3 h-3" />
                      {deck.lastUpdated}
                    </span>
                  </div>

                  {/* Title & Subject */}
                  <div>
                    <h3 className={`text-base font-extrabold line-clamp-2 leading-snug ${
                      isAppLight ? 'text-slate-900' : 'text-white'
                    }`}>
                      {deck.title}
                    </h3>
                    <p className="text-xs font-bold text-amber-500 mt-1">
                      {deck.badgeTag}
                    </p>
                  </div>

                  {/* Theme Info */}
                  <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                    isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <span className="text-slate-400 font-medium">Theme:</span>
                    <span className="font-bold text-amber-400">{tmpl.name}</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => onOpenDeck(deck.items, deck.title)}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow cursor-pointer transition-all"
                  >
                    <Presentation className="w-4 h-4 stroke-[2.5]" />
                    <span>Open Slide Studio</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onOpenDeckSettings(deck.items, deck.config)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        isAppLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Deck Settings</span>
                    </button>

                    <button
                      onClick={() => onOpenSocialGenerator(deck.items)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        isAppLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                          : 'bg-slate-950 hover:bg-slate-800 text-indigo-400 border-slate-800'
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Social Posts</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
