import React, { useState, useEffect } from 'react';
import { 
  Presentation, 
  Edit3, 
  Sparkles, 
  Sliders, 
  Layers, 
  Download, 
  Database, 
  CheckCircle2, 
  Loader2, 
  Sun, 
  Moon, 
  Share2, 
  LayoutGrid, 
  X,
  Menu,
  Key,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarNavProps {
  activeTab: 'home' | 'social' | 'preview' | 'bank' | 'ai' | 'manual' | 'settings' | 'ai-keys';
  setActiveTab: (tab: 'home' | 'social' | 'preview' | 'bank' | 'ai' | 'manual' | 'settings' | 'ai-keys') => void;
  questionCount: number;
  onOpenExportModal: () => void;
  isSyncing?: boolean;
  lastSavedTime?: Date | null;
  appTheme?: 'dark' | 'light';
  onToggleAppTheme?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab,
  questionCount,
  onOpenExportModal,
  isSyncing,
  lastSavedTime,
  appTheme = 'dark',
  onToggleAppTheme,
}) => {
  const isAppLight = appTheme === 'light';
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Desktop sidebar collapse state — persisted in localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sidebar_collapsed', String(isCollapsed));
    } catch {
      // localStorage unavailable — state still works in-memory
    }
  }, [isCollapsed]);

  // Close drawer on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileDrawerOpen(false);
      }
    };
    if (isMobileDrawerOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isMobileDrawerOpen]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileDrawerOpen]);

  const handleNavClick = (tab: 'home' | 'social' | 'preview' | 'bank' | 'ai' | 'manual' | 'settings' | 'ai-keys') => {
    setActiveTab(tab);
    setIsMobileDrawerOpen(false);
  };

  const navItems = [
    { id: 'home' as const, label: 'Home', icon: LayoutGrid, badge: null },
    { id: 'preview' as const, label: 'Slide Studio', icon: Layers, badge: questionCount > 0 ? questionCount : null },
    { id: 'social' as const, label: 'Social Posts', icon: Share2, badge: null },
    { id: 'bank' as const, label: 'Question Bank', icon: Database, badge: null },
    { id: 'ai' as const, label: 'AI PDF Parser', icon: Sparkles, badge: null },
    { id: 'manual' as const, label: 'Manual Editor', icon: Edit3, badge: null },
    { id: 'settings' as const, label: 'Deck Settings', icon: Sliders, badge: null },
    { id: 'ai-keys' as const, label: 'AI Keys', icon: Key, badge: null },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand Logo Section */}
      <div className={`border-b ${isAppLight ? 'border-slate-200' : 'border-slate-800/80'} ${isCollapsed ? 'p-3' : 'p-6'}`}>
        <div
          onClick={() => handleNavClick('home')}
          className={`flex items-center cursor-pointer group ${isCollapsed ? 'justify-center' : 'gap-3'}`}
        >
          <div className={`rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0 ${isCollapsed ? 'p-2 w-10 h-10' : 'p-2.5'}`}>
            <Presentation className={`${isCollapsed ? 'w-5 h-5' : 'w-6 h-6'} stroke-[2.5]`} />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h1 className={`text-lg font-black tracking-tight ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                EdTech Studio
              </h1>
              <div className="flex items-center gap-1.5 text-xs mt-0.5">
                {isSyncing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                    <span className="text-amber-500 font-bold">Syncing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className={isAppLight ? 'text-slate-600 font-semibold' : 'text-slate-400 font-medium'}>Synced</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className={`flex-1 space-y-1.5 overflow-y-auto ${isCollapsed ? 'p-2' : 'p-4'}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center rounded-2xl font-bold text-sm transition-all cursor-pointer ${
                isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'
              } ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                  : isAppLight
                  ? 'text-slate-700 hover:bg-slate-100'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`${isCollapsed ? 'w-5 h-5' : 'w-5 h-5'} stroke-[2]`} />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                      isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/25 text-amber-400 border border-amber-500/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className={`border-t space-y-3 ${isAppLight ? 'border-slate-200' : 'border-slate-800/80'} ${isCollapsed ? 'p-2' : 'p-4'}`}>
        {/* Theme Toggle */}
        {onToggleAppTheme && (
          <button
            onClick={onToggleAppTheme}
            className={`w-full flex items-center rounded-2xl font-bold text-sm transition-all cursor-pointer ${
              isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'
            } ${
              isAppLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                : 'bg-slate-950 hover:bg-slate-800 text-amber-300'
            }`}
            title={isCollapsed ? (isAppLight ? 'Dark Mode' : 'Light Mode') : undefined}
          >
            {isAppLight ? (
              <Moon className="w-5 h-5 text-indigo-600" />
            ) : (
              <Sun className="w-5 h-5 text-amber-400" />
            )}
            {!isCollapsed && <span>{isAppLight ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>
        )}

        {/* Export Button */}
        <button
          onClick={onOpenExportModal}
          disabled={questionCount === 0}
          className={`w-full flex items-center rounded-2xl font-bold text-sm transition-all ${
            isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'
          } ${
            questionCount > 0
              ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 cursor-pointer'
              : isAppLight
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-slate-950 text-slate-600 cursor-not-allowed'
          }`}
          title={isCollapsed ? 'Export Slides' : undefined}
        >
          <Download className="w-5 h-5 stroke-[2.5]" />
          {!isCollapsed && <span>Export Slides</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (lg+) — collapsible to icon-only strip */}
      <aside className={`hidden lg:flex flex-col h-screen sticky top-0 border-r relative transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      } ${
        isAppLight
          ? 'bg-white/95 border-slate-200 shadow-md'
          : 'bg-slate-950/85 border-slate-800/80 shadow-xl'
      } backdrop-blur-2xl`}>
        <SidebarContent />

        {/* Collapse/Expand Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-amber-500 text-slate-950 shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-10 border-2 ${
            isAppLight ? 'border-white' : 'border-slate-950'
          }`}
          style={{ right: '-12px' }}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* Mobile Top Bar */}
      <header className={`lg:hidden sticky top-0 z-40 backdrop-blur-2xl border-b px-4 py-3 ${
        isAppLight ? 'bg-white/95 border-slate-200 shadow-md' : 'bg-slate-950/85 border-slate-800/80 shadow-xl'
      }`}>
        <div className="flex items-center justify-between gap-3">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              isAppLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                : 'bg-slate-950 hover:bg-slate-800 text-amber-300'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand Logo */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 cursor-pointer group flex-1 min-w-0"
          >
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-slate-950 font-black shadow-md group-hover:scale-105 transition-transform flex items-center justify-center shrink-0">
              <Presentation className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h1 className={`text-sm font-black tracking-tight ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                EdTech Studio
              </h1>
              <div className="flex items-center gap-1 text-[10px]">
                {isSyncing ? (
                  <>
                    <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                    <span className="text-amber-500 font-bold">Syncing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className={isAppLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}>Synced</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Export Button */}
          <button
            onClick={onOpenExportModal}
            disabled={questionCount === 0}
            className={`p-2.5 rounded-xl transition-all ${
              questionCount > 0
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md cursor-pointer'
                : isAppLight
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-slate-950 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Download className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className={`absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] shadow-2xl ${
            isAppLight ? 'bg-white' : 'bg-slate-950'
          } animate-slideInLeft`}>
            {/* Close Button */}
            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className={`absolute top-4 right-4 p-2 rounded-xl transition-all cursor-pointer z-10 ${
                isAppLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
};
