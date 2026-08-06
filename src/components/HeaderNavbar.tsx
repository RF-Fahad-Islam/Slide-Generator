import React, { useState, useRef, useEffect } from 'react';
import { Presentation, Edit3, Sparkles, Sliders, Layers, Download, Database, CheckCircle2, Loader2, Sun, Moon, Share2, LayoutGrid, ChevronDown, Plus } from 'lucide-react';
import { TEMPLATES } from '../templates/registry';

interface HeaderNavbarProps {
  activeTab: 'home' | 'social' | 'preview' | 'bank' | 'ai' | 'manual' | 'settings';
  setActiveTab: (tab: 'home' | 'social' | 'preview' | 'bank' | 'ai' | 'manual' | 'settings') => void;
  questionCount: number;
  templateId: string;
  onSelectTemplate: (id: string) => void;
  onLoadSample: (sampleIndex: number) => void;
  onOpenExportModal: () => void;
  isSyncing?: boolean;
  lastSavedTime?: Date | null;
  appTheme?: 'dark' | 'light';
  onToggleAppTheme?: () => void;
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
        {/* Brand Logo & Name */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform flex items-center justify-center">
            <Presentation className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className={`text-lg font-black tracking-tight flex items-center gap-2 ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
              EdTech Studio
              <span className={`text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 font-mono font-black tracking-wide ${isAppLight ? 'text-amber-600' : 'text-amber-400'}`}>
                MCQ PRO
              </span>
            </h1>
            {/* Sync Status Subtext */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              {isSyncing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                  <span className="text-amber-500 font-bold">Auto-Syncing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className={isAppLight ? 'text-slate-600 font-semibold' : 'text-slate-400 font-medium'}>Auto-Synced</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Fatty Navigation Bar */}
        <nav className={`flex items-center gap-1.5 p-1.5 rounded-2xl border ${
          isAppLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/90 border-slate-800/80 shadow-inner'
        }`}>
          {/* 1. Home (Dashboard Hub) */}
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'home'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
                : isAppLight ? 'text-slate-700 hover:bg-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Home</span>
          </button>

          {/* 2. Slide Studio (16:9 Presentation Preview) */}
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer relative ${
              activeTab === 'preview'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
                : isAppLight ? 'text-slate-700 hover:bg-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Slide Studio</span>
            {questionCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                activeTab === 'preview' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/25 text-amber-400 border border-amber-500/30'
              }`}>
                {questionCount}
              </span>
            )}
          </button>

          {/* 3. Social Posts (Facebook & Instagram Generator) */}
          <button
            onClick={() => setActiveTab('social')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'social'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
                : isAppLight ? 'text-slate-700 hover:bg-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Social Posts</span>
          </button>

          {/* 4. More Tools Compact Dropdown Menu */}
          <div className="relative" ref={toolsMenuRef}>
            <button
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                ['bank', 'ai', 'manual', 'settings'].includes(activeTab)
                  ? 'bg-amber-500 text-slate-950 shadow font-black'
                  : isAppLight ? 'text-slate-700 hover:bg-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>More Tools</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Content */}
            {isToolsOpen && (
              <div className={`absolute right-0 mt-2 w-52 rounded-2xl border shadow-2xl p-2 space-y-1 z-50 animate-fadeIn ${
                isAppLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
              }`}>
                <button
                  onClick={() => handleToolSelect('bank')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left transition-all ${
                    activeTab === 'bank'
                      ? 'bg-amber-500/20 text-amber-500'
                      : isAppLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800'
                  }`}
                >
                  <Database className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="font-extrabold">Question Bank</div>
                    <div className="text-[10px] text-slate-400 font-normal">Stored MCQ Archive</div>
                  </div>
                </button>

                <button
                  onClick={() => handleToolSelect('ai')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left transition-all ${
                    activeTab === 'ai'
                      ? 'bg-amber-500/20 text-amber-500'
                      : isAppLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-extrabold">AI PDF Parser</div>
                    <div className="text-[10px] text-slate-400 font-normal">Extract from PDF & Images</div>
                  </div>
                </button>

                <button
                  onClick={() => handleToolSelect('manual')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left transition-all ${
                    activeTab === 'manual'
                      ? 'bg-amber-500/20 text-amber-500'
                      : isAppLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800'
                  }`}
                >
                  <Edit3 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-extrabold">Manual Question Editor</div>
                    <div className="text-[10px] text-slate-400 font-normal">Bulk Text & Hand Entry</div>
                  </div>
                </button>

                <button
                  onClick={() => handleToolSelect('settings')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left transition-all ${
                    activeTab === 'settings'
                      ? 'bg-amber-500/20 text-amber-500'
                      : isAppLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800'
                  }`}
                >
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-extrabold">Deck & Font Settings</div>
                    <div className="text-[10px] text-slate-400 font-normal">Typography, Banners & Logo</div>
                  </div>
                </button>
              </div>
            )}
          </div>
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

