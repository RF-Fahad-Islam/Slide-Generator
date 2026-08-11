import React, { useRef, useState, useEffect } from 'react';
import { MCQItem, DeckConfig, CustomThemeColors } from '../types';
import { SAMPLE_DECKS } from '../utils/bulkParser';
import { getTemplateById, TEMPLATES } from '../templates/registry';
import { getTemplatePresets } from '../utils/templatePresets';
import { SlideCanvas } from './SlideCanvas';
import { DeckCard } from './DeckCard';
import {
  Presentation,
  Share2,
  Plus,
  Layers,
  Sliders,
  Sparkles,
  Edit3,
  BookOpen,
  Calculator,
  CheckCircle2,
  ArrowRight,
  Database,
  FileText,
  Palette,
  Zap,
  PlayCircle,
  Sigma,
  Wand2,
  Target,
  RefreshCw,
  Compass,
} from 'lucide-react';

// A theme selection for the ACTIVE slide: a built-in preset theme, a saved custom
// template preset, or both (a saved preset carries its own design fields).
export interface ThemeSelection {
  templateId: string;
  customTheme?: CustomThemeColors;
  design?: Partial<DeckConfig>;
}

interface SlideDecksHomeProps {
  currentItems: MCQItem[];
  currentConfig: DeckConfig;
  activeSlideConfig?: Partial<DeckConfig>;
  onOpenDeck: (items: MCQItem[], deckTitle?: string) => void;
  onOpenDeckSettings: (items: MCQItem[], config?: DeckConfig) => void;
  onOpenSocialGenerator: (items: MCQItem[]) => void;
  onNavigateTab: (tab: 'home' | 'decks' | 'social' | 'preview' | 'bank' | 'ai' | 'workspaces' | 'settings' | 'templates' | 'ai-keys') => void;
  onSelectTheme?: (selection: ThemeSelection) => void;
  onResetSlideTheme?: () => void;
  onLoadSample?: (sampleIndex: number) => void;
  onStartTour?: () => void;
  appTheme: 'dark' | 'light';
}

// Pill-style CTA link for tool cards (replaces the old underline links)
const CtaPill: React.FC<{ label: string; accent: 'amber' | 'indigo' | 'emerald' | 'violet' }> = ({ label, accent }) => {
  const accents = {
    amber: 'bg-amber-500/15 border-amber-500/40 text-amber-500 group-hover:bg-amber-500 group-hover:text-slate-950',
    indigo: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white',
    emerald: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-slate-950',
    violet: 'bg-violet-500/15 border-violet-500/40 text-violet-400 group-hover:bg-violet-500 group-hover:text-white',
  }[accent];

  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-black transition-all duration-200 cursor-pointer shadow-md ${accents}`}
    >
      <span>{label}</span>
      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
    </span>
  );
};

export const SlideDecksHome: React.FC<SlideDecksHomeProps> = ({
  currentItems,
  currentConfig,
  activeSlideConfig,
  onOpenDeck,
  onOpenDeckSettings,
  onOpenSocialGenerator,
  onNavigateTab,
  onSelectTheme,
  onResetSlideTheme,
  onLoadSample,
  onStartTour,
  appTheme,
}) => {
  const isAppLight = appTheme === 'light';

  // Effective config for the ACTIVE slide = deck config + slide-level override
  const effectiveHomeConfig: DeckConfig = { ...currentConfig, ...(activeSlideConfig || {}) };
  const savedPresets = getTemplatePresets();
  const activeSavedPreset = savedPresets.find(
    (p) =>
      effectiveHomeConfig.templateId === p.design.templateId &&
      JSON.stringify(effectiveHomeConfig.customTheme) === JSON.stringify(p.design.customTheme)
  );
  const isSavedPresetActive = !!activeSavedPreset;
  const hasThemeOverride = !!(
    activeSlideConfig &&
    (activeSlideConfig.templateId || activeSlideConfig.customTheme || activeSlideConfig.accentColorCustom)
  );

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

  const heroChips = [
    { icon: Presentation, label: '1920×1080 HD' },
    { icon: Sigma, label: 'LaTeX Math' },
    { icon: FileText, label: 'PNG · PPTX · PDF' },
    { icon: Wand2, label: '2-Stage Vision AI' },
  ];

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* SECTION 1: HERO DASHBOARD HEADER HUB */}
      <div
        data-tour="home-hero"
        className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-8 lg:p-12 relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 ${
          isAppLight ? 'border-amber-200 text-slate-900' : 'bg-slate-900/80 border-white/10 text-white shadow-2xl shadow-black/80'
        }`}
      >
        {/* Ambient aurora glows */}
        <div
          className={`absolute -top-28 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
            isAppLight ? 'bg-amber-200/60' : 'bg-amber-500/20'
          }`}
        />
        <div
          className={`absolute -bottom-32 -left-20 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
            isAppLight ? 'bg-indigo-200/50' : 'bg-indigo-500/15'
          }`}
        />
        <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

        <div className="space-y-5 max-w-2xl z-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3.5 py-1 rounded-full text-xs font-black font-mono bg-amber-500 text-slate-950 uppercase tracking-wider shadow-md shadow-amber-500/20">
              EdTech Studio Central Hub
            </span>
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 fill-amber-400" />
              All-In-One Slide Generator
            </span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight">
            Create HD Presentation Slides{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
              & Social Media Graphics
            </span>
          </h1>
          <p className={`text-sm lg:text-base leading-relaxed ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
            Welcome! Convert raw question papers into 16:9 HD presentation slides, social media graphics, or parse Board exam PDFs with 2-Stage Vision AI!
          </p>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-2">
            {heroChips.map((chip) => (
              <span
                key={chip.label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${
                  isAppLight
                    ? 'bg-white text-slate-700 border-slate-200'
                    : 'bg-slate-950/80 text-slate-200 border-white/10 backdrop-blur-md shadow-sm'
                }`}
              >
                <chip.icon className="w-3.5 h-3.5 text-amber-400" />
                {chip.label}
              </span>
            ))}
          </div>

          {/* Quick Preset Sample Loaders */}
          {onLoadSample && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                Quick Samples:
              </span>
              <button
                type="button"
                onClick={() => onLoadSample(0)}
                className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-amber-500/10 hover:scale-105"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Biology Sample</span>
              </button>
              <button
                type="button"
                onClick={() => onLoadSample(1)}
                className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-amber-500/10 hover:scale-105"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Math / Physics LaTeX</span>
              </button>
            </div>
          )}

          {/* Primary + secondary CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => onNavigateTab('workspaces')}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Start a New Deck</span>
            </button>
            <button
              onClick={() => onNavigateTab('preview')}
              className={`px-5 py-2.5 rounded-2xl border font-black text-xs flex items-center gap-2 cursor-pointer transition-all ${
                isAppLight
                  ? 'bg-white hover:bg-amber-50 text-slate-800 border-slate-300'
                  : 'bg-slate-950/80 hover:bg-slate-900 text-slate-200 border-white/15 backdrop-blur-md hover:border-amber-500/40'
              }`}
            >
              <PlayCircle className="w-4 h-4 text-amber-400" />
              <span>Open Slide Studio</span>
            </button>
            {onStartTour && (
              <button
                onClick={onStartTour}
                className={`px-5 py-2.5 rounded-2xl border font-black text-xs flex items-center gap-2 cursor-pointer transition-all ${
                  isAppLight
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Start Tour</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Active Deck Stats Box */}
        <div className={`p-6 rounded-3xl border shrink-0 space-y-5 z-10 min-w-[260px] ${
          isAppLight
            ? 'bg-white/80 backdrop-blur border-amber-300 shadow-xl'
            : 'bg-slate-900/90 backdrop-blur-xl border border-amber-500/35 shadow-2xl shadow-amber-500/10'
        }`}>
          <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Active Workspace Deck
          </div>
          <div>
            <div className="text-4xl font-black text-amber-400 flex items-baseline gap-2">
              <span>{currentItems.length}</span>
              <span className="text-sm font-semibold text-slate-400">Questions</span>
            </div>
            <p className={`text-xs mt-1 line-clamp-2 font-medium ${isAppLight ? 'text-slate-600' : 'text-slate-300'}`}>
              {currentConfig.headerTitle || 'No title set yet'}
            </p>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => onNavigateTab('preview')}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/25 cursor-pointer transition-all"
            >
              <Presentation className="w-4 h-4 stroke-[2.5]" />
              <span>Open Slide Studio</span>
            </button>
            <button
              onClick={() => onOpenSocialGenerator(currentItems)}
              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                isAppLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                  : 'bg-slate-950 hover:bg-slate-900 text-indigo-300 border-white/10 hover:border-indigo-400/40'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Social Posts</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: MAIN STUDIO TOOL MODULES (BENTO GRID) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-black flex items-center gap-2.5">
            <Zap className="w-6 h-6 text-amber-400" />
            <span>Main Studio Tools & Modules</span>
          </h2>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-extrabold shadow-sm">
              5 Tools
            </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {/* Tool 1 (FEATURED): 16:9 Slide Presentation Generator */}
          <div
            onClick={() => onNavigateTab('preview')}
            className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} md:col-span-2 lg:col-span-4 p-7 lg:p-8 border transition-all duration-300 cursor-pointer group overflow-hidden relative ${
              isAppLight
                ? 'hover:border-amber-400'
                : 'bg-slate-900/60 border-white/10 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1.5'
            }`}
          >
            <div
              className={`absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none ${
                isAppLight ? 'bg-amber-200/40' : 'bg-amber-500/15'
              }`}
            />
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="flex-1 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black shadow-lg shadow-amber-500/15 group-hover:scale-110 group-hover:bg-amber-400 group-hover:text-slate-950 transition-all duration-300">
                    <Presentation className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-mono font-black px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/35">
                    16:9 HD Slides
                  </span>
                </div>
                <div>
                  <h3 className={`text-xl font-black flex items-center gap-2 group-hover:text-amber-300 transition-colors ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                    <span>16:9 Slide Studio</span>
                    <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className={`text-sm mt-1.5 leading-relaxed ${isAppLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    Full-screen 1920x1080 slide deck generator with answer reveal, live writing classroom mode, LaTeX math, and PNG export.
                  </p>
                </div>
                <div>
                  <CtaPill label="Open Slide Studio" accent="amber" />
                </div>
              </div>

              {/* Mini slide mock */}
              <div className="w-full max-w-sm flex-shrink-0">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 border border-white/15 shadow-2xl ring-1 ring-white/10 group-hover:scale-[1.02] transition-transform duration-300">
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-500/25 blur-3xl" />
                  <div className="absolute inset-0 p-3.5 flex flex-col justify-center gap-2">
                    <div className="flex items-center justify-between">
                      <div className="h-1.5 w-1/3 rounded-full bg-amber-400/90" />
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      </div>
                    </div>
                    <div className="h-3 w-2/3 rounded-md bg-white/15" />
                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                      <div className="h-3 rounded-lg bg-white/10 border border-white/15" />
                      <div className="h-3 rounded-lg bg-amber-400/20 border border-amber-400/40" />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="h-3 rounded-lg bg-white/10 border border-white/15" />
                      <div className="h-3 rounded-lg bg-white/10 border border-white/15" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tool 2 (FEATURED): Social Media Posting Card Generator */}
          <div
            onClick={() => onNavigateTab('social')}
            className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} md:col-span-2 lg:col-span-2 p-7 lg:p-8 border transition-all cursor-pointer group overflow-hidden relative flex flex-col justify-between gap-6 ${
              isAppLight
                ? 'hover:border-indigo-400'
                : 'bg-slate-900/80 border-slate-800 hover:border-indigo-500/50 shadow-xl'
            }`}
          >
            <div
              className={`absolute -top-20 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none ${
                isAppLight ? 'bg-indigo-200/50' : 'bg-indigo-500/15'
              }`}
            />
            <div className="space-y-4 relative z-10">
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
                  <span>Social Posts</span>
                  <ArrowRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className={`text-sm mt-1.5 leading-relaxed ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Viral Facebook & Instagram feed cards and 9:16 Story graphics with custom watermarks.
                </p>
              </div>
            </div>

            {/* Mini portrait post mock */}
            <div className="relative z-10 self-end">
              <div className="w-24 aspect-[4/5] rounded-xl overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-800 to-slate-900 border border-white/15 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-300">
                <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-white/15 blur-2xl" />
                <div className="absolute inset-0 p-2.5 flex flex-col justify-center gap-1.5">
                  <div className="h-1.5 w-3/4 rounded-full bg-white/70" />
                  <div className="h-1 w-1/2 rounded-full bg-white/40" />
                  <div className="h-1.5 w-full rounded bg-white/15 mt-1" />
                  <div className="h-1.5 w-5/6 rounded bg-white/15" />
                  <div className="mt-1 flex gap-1">
                    <span className="h-2 w-6 rounded-full bg-indigo-300/70" />
                    <span className="h-2 w-4 rounded-full bg-amber-300/70" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10">
              <CtaPill label="Open Social Generator" accent="indigo" />
            </div>
          </div>

          {/* Tool 3: AI PDF & Image Parser */}
          <div
            onClick={() => onNavigateTab('ai')}
            className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-6 border transition-all cursor-pointer flex flex-col justify-between space-y-6 group lg:col-span-2 ${
              isAppLight
                ? 'hover:border-emerald-400'
                : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50 shadow-xl'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3.5 rounded-2xl bg-emerald-600 text-white font-black shadow-lg group-hover:scale-110 transition-transform">
                  <Sparkles className="w-7 h-7 stroke-[2.5]" />
                </div>
                <span className="text-xs font-mono font-black px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  AI PDF Extract
                </span>
              </div>
              <div>
                <h3 className={`text-xl font-black flex items-center gap-2 ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                  <span>AI PDF / Image Parser</span>
                  <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className={`text-sm mt-1.5 leading-relaxed ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Upload coaching question papers, PDFs, or photos. Gemini AI extracts questions, options & answers automatically!
                </p>
              </div>
            </div>
            <div>
              <CtaPill label="Upload PDF or Text" accent="emerald" />
            </div>
          </div>

          {/* Tool 4: Bulk MCQ Input & Editor */}
          <div
            onClick={() => onNavigateTab('workspaces')}
            className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-6 border transition-all cursor-pointer flex flex-col justify-between space-y-6 group lg:col-span-2 ${
              isAppLight
                ? 'hover:border-amber-400'
                : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/50 shadow-xl'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3.5 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-lg group-hover:scale-110 transition-transform">
                  <Edit3 className="w-7 h-7 stroke-[2.5]" />
                </div>
                <span className="text-xs font-mono font-black px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Bulk Editor
                </span>
              </div>
              <div>
                <h3 className={`text-xl font-black flex items-center gap-2 ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                  <span>Bulk MCQ Editor</span>
                  <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className={`text-sm mt-1.5 leading-relaxed ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Manual text input & Multiselect. Paste raw questions with full Bangla support.
                </p>
              </div>
            </div>
            <div>
              <CtaPill label="Open Bulk Editor" accent="amber" />
            </div>
          </div>

          {/* Tool 5: Question Bank Archive */}
          <div
            onClick={() => onNavigateTab('bank')}
            className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-6 border transition-all cursor-pointer flex flex-col justify-between space-y-6 group lg:col-span-2 ${
              isAppLight
                ? 'hover:border-indigo-400'
                : 'bg-slate-900/80 border-slate-800 hover:border-indigo-500/50 shadow-xl'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3.5 rounded-2xl bg-indigo-600 text-white font-black shadow-lg group-hover:scale-110 transition-transform">
                  <Database className="w-7 h-7 stroke-[2.5]" />
                </div>
                <span className="text-xs font-mono font-black px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  MCQ Archive
                </span>
              </div>
              <div>
                <h3 className={`text-xl font-black flex items-center gap-2 ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                  <span>Question Bank</span>
                  <ArrowRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className={`text-sm mt-1.5 leading-relaxed ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Saved questions archive with subject tags, search filters, and bulk import to any active deck.
                </p>
              </div>
            </div>
            <div>
              <CtaPill label="Open Question Bank" accent="indigo" />
            </div>
          </div>

          {/* Tool 6 (BANNER): Deck Branding & Font Customization — opens the current deck's settings modal */}
          <div
            onClick={() => onOpenDeckSettings(currentItems, currentConfig)}
            className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} md:col-span-2 lg:col-span-6 p-6 lg:p-8 border transition-all cursor-pointer group relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ${
              isAppLight
                ? 'hover:border-violet-400'
                : 'bg-slate-900/80 border-slate-800 hover:border-violet-500/50 shadow-xl'
            }`}
          >
            <div
              className={`absolute -bottom-24 -left-16 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
                isAppLight ? 'bg-violet-200/40' : 'bg-violet-500/10'
              }`}
            />
            <div className="flex items-center gap-5 relative z-10">
              <div className="p-4 rounded-2xl bg-violet-600 text-white font-black shadow-lg group-hover:scale-110 transition-transform">
                <Sliders className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <h3 className={`text-xl font-black flex items-center gap-2 ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                  <span>Branding & Fonts</span>
                  <ArrowRight className="w-5 h-5 text-violet-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className={`text-sm mt-1.5 leading-relaxed max-w-xl ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Custom Bangla fonts, logo positioning, header/footer banners, background presets & per-slide overrides.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 relative z-10">
              <div className="flex gap-1.5">
                {['bg-amber-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-violet-500'].map((dot, i) => (
                  <span
                    key={i}
                    className={`w-8 h-8 rounded-full ${dot} shadow-lg ${
                      isAppLight ? 'ring-2 ring-white' : 'ring-2 ring-slate-900'
                    } group-hover:scale-110 transition-transform`}
                  />
                ))}
              </div>
              <div>
                <CtaPill label="Configure Branding" accent="violet" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: QUICK THEME STYLE SELECTOR DIRECTLY ON HOME */}
      {onSelectTheme && (
        <div className={`p-6 rounded-3xl border shadow-xl space-y-5 ${
          isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-400" />
              Active Slide Theme Picker
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">
                Current: {getTemplateById(effectiveHomeConfig.templateId, effectiveHomeConfig.customTheme).name}
              </span>
              {hasThemeOverride && onResetSlideTheme && (
                <button
                  type="button"
                  onClick={onResetSlideTheme}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer flex items-center gap-1 ${
                    isAppLight
                      ? 'bg-rose-50 border-rose-300 text-rose-600 hover:bg-rose-100'
                      : 'bg-rose-500/10 border-rose-500/40 text-rose-300 hover:bg-rose-500/20'
                  }`}
                  title="Remove this slide's custom theme and revert to the deck theme"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset Slide to Deck Theme
                </button>
              )}
            </div>
          </div>

          {/* Slide-scope notice */}
          <div className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-start gap-2 ${
            isAppLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <Target className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Theme selections apply to the <strong>active slide only</strong> — every other slide keeps the deck
              theme. Use Deck Settings → Theme &amp; Preview for per-slide custom color palettes.
            </span>
          </div>

          {/* Group A: Built-in Preset Themes */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Preset Themes
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              {TEMPLATES.map((tmpl) => {
                const isSelected = effectiveHomeConfig.templateId === tmpl.id && !isSavedPresetActive;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => onSelectTheme({ templateId: tmpl.id })}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-extrabold ring-2 ring-amber-400/40 shadow-lg'
                        : isAppLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className={`h-8 w-full rounded-lg bg-gradient-to-br ${tmpl.previewGradient} border border-white/20`} />
                    <span className="text-[11px] font-bold truncate w-full">{tmpl.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group B: My Saved Templates */}
          {savedPresets.length > 0 && (
            <div className={`space-y-2.5 pt-4 border-t ${
              isAppLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  My Templates
                </h4>
                <button
                  type="button"
                  onClick={() => onNavigateTab('templates')}
                  className="text-[10px] font-extrabold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Manage in Template Creator <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {savedPresets.map((preset) => {
                  const tmpl = getTemplateById(preset.design.templateId, preset.design.customTheme);
                  const isSelected =
                    effectiveHomeConfig.templateId === preset.design.templateId &&
                    JSON.stringify(effectiveHomeConfig.customTheme) === JSON.stringify(preset.design.customTheme);
                  const accent = preset.design.customTheme?.accentColor || tmpl.styles.accentColor;
                  const bg = preset.design.customTheme?.bg || `#${tmpl.styles.hexColors.bg}`;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        onSelectTheme({
                          templateId: preset.design.templateId,
                          customTheme: preset.design.customTheme,
                          design: preset.design,
                        })
                      }
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-2.5 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                          : isAppLight
                          ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                      title={preset.description || tmpl.name}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-9 h-9 rounded-xl border border-white/15 shadow flex items-center justify-center shrink-0"
                          style={{ backgroundColor: bg }}
                        >
                          <span
                            className="w-4 h-4 rounded-full border-2 border-white/40 shadow"
                            style={{ backgroundColor: accent }}
                          />
                        </div>
                        <span className="text-[11px] font-bold truncate">{preset.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </div>
                      {preset.description && (
                        <p className="text-[10px] leading-snug line-clamp-2 text-slate-500">{preset.description}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
              onClick={() => onNavigateTab('workspaces')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create New Deck</span>
            </button>
          </div>
        </div>

        {/* Decks Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decksList.map((deck) => (
            <DeckCard
              key={deck.id}
              id={deck.id}
              title={deck.title}
              badgeTag={deck.badgeTag}
              questionCount={deck.questionCount}
              items={deck.items}
              config={deck.config}
              isCurrent={deck.isCurrent}
              lastUpdated={deck.lastUpdated}
              appTheme={appTheme}
              onOpen={() => onOpenDeck(deck.items, deck.title)}
              onSettings={() => onOpenDeckSettings(deck.items, deck.config)}
              onSocial={() => onOpenSocialGenerator(deck.items)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
