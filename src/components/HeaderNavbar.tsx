import React, { useState, useRef, useEffect } from 'react';
import { Presentation, Edit3, Sparkles, Sliders, Layers, Download, Database, CheckCircle2, Loader2, Sun, Moon, Share2, LayoutGrid, ChevronDown, Menu } from 'lucide-react';

interface HeaderNavbarProps {
  activeTab: 'home' | 'decks' | 'social' | 'preview' | 'bank' | 'ai' | 'workspaces' | 'manual' | 'settings' | 'templates' | 'ai-keys';
  setActiveTab: (tab: 'home' | 'decks' | 'social' | 'preview' | 'bank' | 'ai' | 'workspaces' | 'manual' | 'settings' | 'templates' | 'ai-keys') => void;
  questionCount: number;
  templateId: string;
  onSelectTemplate: (id: string) => void;
  onLoadSample: (sampleIndex: number) => void;
  onOpenExportModal: () => void;
  isSyncing?: boolean;
  lastSavedTime?: Date | null;
  appTheme?: 'dark' | 'light';
  onToggleAppTheme?: () => void;
  onOpenMobileMenu?: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  activeTab,
  setActiveTab,
  questionCount,
  templateId,
  onSelectTemplate,
  onLoadSample,
  onOpenExportModal,
  isSyncing,
  lastSavedTime,
  appTheme = 'dark',
  onToggleAppTheme,
  onOpenMobileMenu,
}) => {
  const isAppLight = appTheme === 'light';
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToolSelect = (tab: 'bank' | 'ai' | 'manual' | 'settings') => {
    setActiveTab(tab);
    setIsToolsOpen(false);
  };

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-2xl border-b px-4 lg:px-8 py-3.5 transition-all ${
      isAppLight ? 'bg-white/95 border-slate-200 text-slate-900 shadow-md' : 'bg-slate-950/85 border-slate-800/80 text-slate-100 shadow-xl'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Mobile Hamburger — opens the sidebar drawer (replaces SidebarNav's mobile top bar) */}
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            aria-label="Open menu"
            data-tour="mobile-menu"
            className={`lg:hidden p-2.5 rounded-xl transition-all cursor-pointer border shrink-0 ${
              isAppLight
                ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                : 'bg-white/5 text-amber-300 border-white/10 hover:bg-white/10'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Brand Logo & Name */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform flex items-center justify-center">
            <Presentation className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className={`text-lg font-black tracking-tight flex items-center gap-2 ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
              EdTech Slide Generator
              <span className={`text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 font-mono font-black tracking-wide ${isAppLight ? 'text-amber-700' : 'text-amber-400'}`}>
                MCQs
              </span>
            </h1>
            {/* Subtext */}
            <div className="text-[11px] text-slate-400 font-medium tracking-tight">
              Coaching Class Slide Builder &amp; Automated Exporter
            </div>
          </div>
        </div>

        {/* Top Navigation Bar */}
        <nav className={`hidden lg:flex items-center gap-2 p-1.5 rounded-2xl border ${
          isAppLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/90 border-slate-800/80 shadow-inner'
        }`}>
          {/* 1. Manual & Bulk Paste */}
          <button
            onClick={() => setActiveTab('workspaces')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'workspaces' || activeTab === 'manual'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : isAppLight ? 'text-slate-700 hover:bg-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Edit3 className="w-4 h-4 text-slate-900" />
            <span>Manual &amp; Bulk Paste</span>
          </button>

          {/* 2. AI Parser (PDF/Text) */}
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : isAppLight ? 'text-slate-700 hover:bg-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AI Parser (PDF/Text)</span>
          </button>

          {/* 3. Slide Preview (Active Tab) */}
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer relative ${
              activeTab === 'preview'
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
                : isAppLight ? 'text-slate-700 hover:bg-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Slide Preview</span>
            {questionCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                activeTab === 'preview' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/25 text-amber-400 border border-amber-500/30'
              }`}>
                {questionCount}
              </span>
            )}
          </button>

          {/* 4. More Settings Button */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-2 rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow'
                : isAppLight ? 'text-slate-700 hover:bg-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Global Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </nav>

        {/* Right Action Controls: Theme Switch & Export Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* App Light/Dark Theme Switcher */}
          {onToggleAppTheme && (
            <button
              onClick={onToggleAppTheme}
              className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isAppLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-slate-950 hover:bg-slate-800 text-amber-300 border-slate-800'
              }`}
              title="Toggle App Shell Light/Dark Theme"
            >
              {isAppLight ? (
                <Moon className="w-4 h-4 text-indigo-600" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>
          )}

          {/* Quick Export Slides Button */}
          <button
            onClick={onOpenExportModal}
            disabled={questionCount === 0}
            data-tour="mobile-export"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-extrabold text-xs shadow-md transition-all ${
              questionCount > 0
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:brightness-110 shadow-amber-500/20 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Export Slides</span>
          </button>
        </div>
      </div>
    </header>
  );
};

