import React, { useState, useEffect, useRef } from 'react';
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
  ChevronRight,
  LayoutTemplate,
  HelpCircle,
  Library,
  FolderKanban,
} from 'lucide-react';

interface SidebarNavProps {
  activeTab: 'home' | 'decks' | 'social' | 'preview' | 'bank' | 'ai' | 'workspaces' | 'settings' | 'templates' | 'ai-keys';
  setActiveTab: (tab: 'home' | 'decks' | 'social' | 'preview' | 'bank' | 'ai' | 'workspaces' | 'settings' | 'templates' | 'ai-keys') => void;
  questionCount: number;
  onOpenExportModal: () => void;
  isSyncing?: boolean;
  lastSavedTime?: Date | null;
  appTheme?: 'dark' | 'light';
  onToggleAppTheme?: () => void;
  onStartTour?: () => void;
  onOpenMobileMenu?: () => void;
  isMobileDrawerOpen?: boolean;
  onCloseMobileDrawer?: () => void;
}

type NavTab = 'home' | 'decks' | 'social' | 'preview' | 'bank' | 'ai' | 'workspaces' | 'settings' | 'templates' | 'ai-keys';

const NAV_GROUPS: { label: string; items: { id: NavTab; label: string; icon: typeof Layers }[] }[] = [
  {
    label: 'Studio',
    items: [
      { id: 'home', label: 'Home', icon: LayoutGrid },
      { id: 'decks', label: 'My Decks', icon: Library },
      { id: 'preview', label: 'Slide Studio', icon: Layers },
      { id: 'social', label: 'Social Posts', icon: Share2 },
      { id: 'bank', label: 'Question Bank', icon: Database },
    ],
  },
  {
    label: 'Create',
    items: [
      { id: 'ai', label: 'AI PDF Parser', icon: Sparkles },
      { id: 'workspaces', label: 'MCQ Import', icon: FolderKanban },
    ],
  },
  {
    label: 'Manage',
    items: [
      { id: 'settings', label: 'Settings', icon: Sliders },
      { id: 'templates', label: 'Template Creator', icon: LayoutTemplate },
      { id: 'ai-keys', label: 'AI Keys', icon: Key },
    ],
  },
];

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab,
  questionCount,
  onOpenExportModal,
  isSyncing,
  lastSavedTime,
  appTheme = 'dark',
  onToggleAppTheme,
  onStartTour,
  onOpenMobileMenu,
  isMobileDrawerOpen = false,
  onCloseMobileDrawer,
}) => {
  const isAppLight = appTheme === 'light';
  const closeMobileDrawer = () => onCloseMobileDrawer?.();
  const [isClosing, setIsClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const closeDrawer = () => {
    if (!isMobileDrawerOpen) return;
    setIsClosing(true);
    closeTimer.current = window.setTimeout(() => {
      setIsClosing(false);
      closeMobileDrawer();
    }, 200);
  };

  useEffect(() => {
    if (isMobileDrawerOpen) setIsClosing(false);
  }, [isMobileDrawerOpen]);

  useEffect(() => () => { if (closeTimer.current) window.clearTimeout(closeTimer.current); }, []);

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
        closeDrawer();
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

  const handleNavClick = (tab: NavTab) => {
    setActiveTab(tab);
    closeDrawer();
  };

  // ------- Brand lockup -------
  const BrandLockup = ({ compact }: { compact: boolean }) => (
    <div
      onClick={() => handleNavClick('home')}
      className={`flex items-center cursor-pointer group ${compact ? 'justify-center' : 'gap-3'}`}
    >
      <div
        className={`relative rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/30 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${
          compact ? 'p-2 w-11 h-11' : 'p-2.5 w-12 h-12'
        }`}
      >
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/40" />
        <Presentation className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} stroke-[2.5]`} />
      </div>
      {!compact && (
        <div className="flex-1 min-w-0">
          <h1 className={`text-base font-black tracking-tight leading-none ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
            EdTech Studio
          </h1>
          <p className={`text-[10px] font-bold tracking-wide mt-1 uppercase ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
            Slide Generator
          </p>
          <div className="flex items-center gap-1.5 text-xs mt-1.5">
            {isSyncing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                <span className="text-amber-500 font-bold">Syncing…</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className={isAppLight ? 'text-slate-600 font-semibold' : 'text-slate-400 font-medium'}>
                  {lastSavedTime ? `Saved ${lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'All changes saved'}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // ------- Sync status pill (collapsed) -------
  const CollapsedSync = () => (
    <div className={`flex items-center justify-center py-1.5 rounded-xl border ${
      isAppLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
    }`} title={isSyncing ? 'Syncing…' : 'All changes saved'}>
      {isSyncing ? (
        <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
      ) : (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      )}
    </div>
  );

  // ------- Nav item -------
  const renderNavItem = (item: { id: NavTab; label: string; icon: typeof Layers }, badge: number | null, collapsed: boolean) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        data-tour={`nav-${item.id}`}
        onClick={() => handleNavClick(item.id)}
        aria-current={isActive ? 'page' : undefined}
        className={`relative w-full flex items-center rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer outline-none ${
          collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5'
        } ${
          isActive
            ? isAppLight
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-extrabold'
              : 'bg-amber-500/10 text-amber-300 border border-amber-500/35 backdrop-blur-xl shadow-lg shadow-amber-500/10 font-extrabold'
            : collapsed
            ? isAppLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
              : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
            : isAppLight
            ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:translate-x-1'
            : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
        }`}
        title={collapsed ? item.label : undefined}
      >
        {/* Active edge indicator */}
        {isActive && !collapsed && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
        )}

        {/* Icon tile */}
        <span
          className={`flex items-center justify-center rounded-xl shrink-0 transition-all duration-200 ${
            collapsed ? 'w-9 h-9' : 'w-8 h-8'
          } ${
            collapsed
              ? isActive
                ? isAppLight ? 'text-slate-950 bg-amber-400' : 'text-amber-300 bg-amber-500/20 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : isAppLight ? 'text-amber-600' : 'text-amber-400'
              : isActive
              ? isAppLight ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/20 text-amber-300 border border-amber-500/35 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              : isAppLight
              ? 'bg-white text-amber-600 border border-slate-200 shadow-sm'
              : 'bg-white/5 text-amber-400'
          }`}
        >
          <Icon className="stroke-[2]" style={{ width: 18, height: 18 }} />
        </span>

        {!collapsed && (
          <>
            <span className="flex-1 text-left leading-tight">{item.label}</span>
            {badge !== null && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                  isActive
                    ? isAppLight ? 'bg-slate-950/25 text-slate-950' : 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                }`}
              >
                {badge}
              </span>
            )}
          </>
        )}
      </button>
    );
  };

  // ------- Bottom action row (collapsed friendly) -------
  const renderBottomAction = ({
    icon: Icon,
    label,
    onClick,
    accent,
    disabled,
    title,
    dataTour,
    collapsed,
  }: {
    icon: typeof Sun;
    label: string;
    onClick: () => void;
    accent?: 'amber' | 'ghost';
    disabled?: boolean;
    title?: string;
    dataTour?: string;
    collapsed: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      data-tour={dataTour}
      className={`w-full flex items-center rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer ${
        collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5'
      } ${
        accent === 'amber'
          ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110'
          : isAppLight
          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          : 'bg-white/5 hover:bg-white/10 text-slate-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`flex items-center justify-center rounded-xl shrink-0 ${
          collapsed ? 'w-9 h-9' : 'w-8 h-8'
        } ${
          collapsed
            ? accent === 'amber'
              ? 'text-slate-950'
              : isAppLight
              ? 'text-amber-600'
              : 'text-amber-400'
            : accent === 'amber'
            ? 'bg-slate-950/20 text-slate-950'
            : isAppLight
            ? 'bg-white text-amber-600 shadow-sm border border-slate-200'
            : 'bg-white/10 text-amber-400'
        }`}
      >
        <Icon className="stroke-[2]" style={{ width: 18, height: 18 }} />
      </span>
      {!collapsed && <span className="text-left leading-tight">{label}</span>}
    </button>
  );

  // ------- Main sidebar content -------
  const SidebarContent = ({ collapsed }: { collapsed: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Brand Logo Section */}
      <div className={`border-b ${isAppLight ? 'border-slate-200' : 'border-white/5'} ${collapsed ? 'p-4' : 'p-5'}`}>
        <BrandLockup compact={collapsed} />
      </div>

      {/* Navigation Items */}
      <nav className={`flex-1 overflow-y-auto ${collapsed ? 'p-3 space-y-1.5' : 'p-4 space-y-6'}`}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            {!collapsed && (
              <p className={`px-3 pb-1 text-[9px] font-black uppercase tracking-[0.18em] ${
                isAppLight ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const badge = item.id === 'preview' && questionCount > 0 ? questionCount : null;
              return renderNavItem(item, badge, collapsed);
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className={`border-t space-y-1.5 ${isAppLight ? 'border-slate-200' : 'border-white/5'} ${collapsed ? 'p-3' : 'p-4'}`}>
        {/* Start Tour */}
        {onStartTour && renderBottomAction({
          icon: HelpCircle,
          label: 'Start Tour',
          onClick: onStartTour,
          title: 'Start Tour',
          collapsed,
        })}

        {/* Theme Toggle */}
        {onToggleAppTheme &&
          renderBottomAction({
            icon: isAppLight ? Moon : Sun,
            label: isAppLight ? 'Dark Mode' : 'Light Mode',
            onClick: onToggleAppTheme,
            title: isAppLight ? 'Switch to Dark Mode' : 'Switch to Light Mode',
            collapsed,
          })}

        {/* Export Button */}
        {renderBottomAction({
          icon: Download,
          label: 'Export Slides',
          onClick: onOpenExportModal,
          disabled: questionCount === 0,
          accent: 'amber',
          title: 'Export Slides',
          dataTour: 'studio-export',
          collapsed,
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (lg+) — collapsible to icon-only strip */}
      <aside
        className={`hidden lg:flex flex-col h-screen sticky top-0 border-r relative transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-24' : 'w-72'
        } ${
          isAppLight
            ? 'bg-white/85 border-slate-200 shadow-xl'
            : 'bg-slate-950/90 border-white/5 shadow-2xl shadow-black/40'
        } backdrop-blur-2xl`}
      >
        <SidebarContent collapsed={isCollapsed} />

        {/* Collapse/Expand Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/40 flex items-center justify-center hover:scale-110 transition-transform z-10 border-2 ${
            isAppLight ? 'border-white' : 'border-slate-950'
          }`}
          style={{ right: '-12px' }}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* Mobile Top Bar — hamburger opens the app-lifted drawer */}
      <header
        className={`lg:hidden sticky top-0 z-40 backdrop-blur-2xl border-b px-4 py-3 ${
          isAppLight ? 'bg-white/90 border-slate-200 shadow-md' : 'bg-slate-950/90 border-white/5 shadow-xl'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => onOpenMobileMenu?.()}
            aria-label="Open menu"
            data-tour="mobile-menu"
            className={`p-2.5 rounded-xl transition-all cursor-pointer border ${
              isAppLight
                ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                : 'bg-white/5 text-amber-300 border-white/10 hover:bg-white/10'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand Logo */}
          <div onClick={() => handleNavClick('home')} className="flex items-center gap-2.5 cursor-pointer group flex-1 min-w-0">
            <div className="relative p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-slate-950 font-black shadow-md shadow-amber-500/25 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0">
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/40" />
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
                    <span className="text-amber-500 font-bold">Syncing…</span>
                  </>
                ) : (
                  <>
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    <span className={isAppLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}>Saved</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Export Button */}
          <button
            onClick={onOpenExportModal}
            disabled={questionCount === 0}
            aria-label="Export slides"
            data-tour="mobile-export"
            className={`p-2.5 rounded-xl transition-all border ${
              questionCount > 0
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md shadow-amber-500/25 cursor-pointer'
                : isAppLight
                ? 'bg-white text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-white/5 text-slate-600 border-white/10 cursor-not-allowed'
            }`}
          >
            <Download className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay — opened via the mobile top bar hamburger (App-lifted state) */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
            onClick={closeDrawer}
          />

          {/* Drawer Panel */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] shadow-2xl ${
              isAppLight ? 'bg-white' : 'bg-slate-950'
            } ${isClosing ? 'animate-slideOutLeft' : 'animate-slideInLeft'}`}
          >
            {/* Close Button */}
            <button
              onClick={closeDrawer}
              aria-label="Close menu"
              className={`absolute top-4 right-4 p-2 rounded-xl transition-all cursor-pointer z-10 ${
                isAppLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <SidebarContent collapsed={false} />
          </div>
        </div>
      )}
    </>
  );
};
