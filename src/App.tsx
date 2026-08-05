import React, { useState, useRef, useEffect } from 'react';
import { DeckConfig, MCQItem } from './types';
import { SAMPLE_DECKS } from './utils/bulkParser';
import { useIndexedDBSync } from './hooks/useIndexedDBSync';
import { HeaderNavbar } from './components/HeaderNavbar';
import { SlideCanvas } from './components/SlideCanvas';
import { ManualEditor } from './components/ManualEditor';
import { AIUploader } from './components/AIUploader';
import { DeckManager } from './components/DeckManager';
import { DeckSettings } from './components/DeckSettings';
import { ExportModal } from './components/ExportModal';
import { QuestionBankView } from './components/QuestionBankView';
import { SlideDecksHome } from './components/SlideDecksHome';
import { SocialPostGenerator } from './components/SocialPostGenerator';
import { SettingsView } from './components/SettingsView';
import { MathText } from './components/MathText';
import { getTemplateById } from './templates/registry';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Presentation, LayoutGrid, ArrowLeft, CheckCircle2, Type, Sun, Moon } from 'lucide-react';
import { FONT_PRESETS } from './utils/fontPresets';

export default function App() {
  // Application State
  const [items, setItems] = useState<MCQItem[]>(SAMPLE_DECKS[0].items);
  const [reviewItems, setReviewItems] = useState<MCQItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'home' | 'social' | 'preview' | 'bank' | 'ai' | 'manual' | 'settings'>('home');
  const [isAnswerRevealMode, setIsAnswerRevealMode] = useState<boolean>(false);
  const [isOverviewMode, setIsOverviewMode] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // App Shell Theme (Dark / Light)
  const [appTheme, setAppTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('edtech_app_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('edtech_app_theme', appTheme);
  }, [appTheme]);

  // Deck Branding Config State
  const [config, setConfig] = useState<DeckConfig>({
    templateId: 'rakib-dark',
    brandName: "RAKIB'S CLASSROOM",
    logoUrl: '',
    logoSize: 'md',
    logoPosition: 'top-left',
    headerTitle: 'অধ্যায় ৮ঃ রেচন প্রক্রিয়া',
    badgeTag: '৯ম-১০ম শ্রেণি | জীববিজ্ঞান',
    footerTag: 'BIOMISSION',
    watermarkAvatar: '',
    watermarkHandle: 'Hasnat Shuvro',
    aspectRatio: '16:9',
    showAnswerInSlide: false,
    showExplanationInSlide: false,
    questionNumberFormat: 'bangla',
    fontFamily: "'Kalpurush', serif",
    bgPreset: 'none',
    bgImageOpacity: 1.0,
    bgOverlayDarkness: 0.0,
  });

  // IndexedDB Auto-Sync Hook
  const { isSyncing, lastSavedTime } = useIndexedDBSync(
    items,
    setItems,
    config,
    setConfig
  );

  // Canvas DOM ref for PNG screenshot export
  const slideRef = useRef<HTMLDivElement>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const [slideScale, setSlideScale] = useState<number>(0.4);

  // Auto-recalculate slide scale to fit 1920x1080 canvas into container perfectly
  useEffect(() => {
    const container = slideContainerRef.current;
    if (!container) return;

    const updateScale = () => {
      const width = container.clientWidth;
      if (width > 0) {
        setSlideScale(width / 1920);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [activeTab]);

  // Keyboard arrow listener for fast slide navigation in preview tab
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'preview') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (selectedIndex < items.length - 1) {
          setSelectedIndex(prev => prev + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (selectedIndex > 0) {
          setSelectedIndex(prev => prev - 1);
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsAnswerRevealMode(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, selectedIndex, items.length]);

  const ensureUniqueIds = (itemsList: MCQItem[]): MCQItem[] => {
    const seenIds = new Set<string>();
    return itemsList.map((item, idx) => {
      let uniqueId = item.id || `q_${Date.now()}_${idx}`;
      if (seenIds.has(uniqueId)) {
        uniqueId = `q_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`;
      }
      seenIds.add(uniqueId);
      return { ...item, id: uniqueId };
    });
  };

  const handleAddMCQs = (newItems: MCQItem[]) => {
    setItems(prev => ensureUniqueIds([...prev, ...newItems]));
    setActiveTab('preview');
    if (items.length === 0) {
      setSelectedIndex(0);
    }
  };

  const handleReviewMCQs = (newItems: MCQItem[]) => {
    setReviewItems(newItems);
    setActiveTab('manual');
  };

  const handleImportToCurrentDeck = (itemsToAdd: MCQItem[]) => {
    setItems(prev => ensureUniqueIds([...prev, ...itemsToAdd]));
    setActiveTab('preview');
    alert(`Successfully added ${itemsToAdd.length} questions to your active presentation!`);
  };

  const handleCreateNewDeckFromSelection = (selectedItems: MCQItem[]) => {
    setItems(ensureUniqueIds(selectedItems));
    setSelectedIndex(0);
    setActiveTab('preview');
    alert(`Created new presentation deck with ${selectedItems.length} selected questions!`);
  };

  const handleLoadSample = (sampleIndex: number) => {
    const sample = SAMPLE_DECKS[sampleIndex] || SAMPLE_DECKS[0];
    setItems(ensureUniqueIds(sample.items));
    setSelectedIndex(0);
    setActiveTab('preview');
  };

  const handleOpenDeck = (deckItems: MCQItem[], deckTitle?: string) => {
    setItems(ensureUniqueIds(deckItems));
    setSelectedIndex(0);
    if (deckTitle) {
      setConfig(prev => ({ ...prev, headerTitle: deckTitle }));
    }
    setActiveTab('preview');
  };

  const handleOpenDeckSettings = (deckItems: MCQItem[], newConfig?: DeckConfig) => {
    setItems(ensureUniqueIds(deckItems));
    if (newConfig) {
      setConfig(newConfig);
    }
    setActiveTab('settings');
  };

  const handleOpenSocialGenerator = (deckItems: MCQItem[]) => {
    setItems(ensureUniqueIds(deckItems));
    setActiveTab('social');
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all questions in the current deck?')) {
      setItems([]);
      setSelectedIndex(0);
    }
  };

  const currentItem = items[selectedIndex] || {
    id: 'placeholder',
    questionType: 'standard',
    stem: 'কোন প্রশ্ন পাওয়া যায়নি। প্রশ্ন যোগ করতে "Manual Editor" বা "AI Parser" ট্যাব ব্যবহার করুন।',
    options: [
      { key: 'ক', text: 'অপশন ১' },
      { key: 'খ', text: 'অপশন ২' },
      { key: 'গ', text: 'অপশন ৩' },
      { key: 'ঘ', text: 'অপশন ৪' },
    ],
    answer: 'ক',
  };

  const activeTemplate = getTemplateById(config.templateId);
  const isLightTemplate = activeTemplate.themeType === 'light';
  const isAppLight = appTheme === 'light';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isAppLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100 bg-mesh-gradient'
    } flex flex-col font-['Plus_Jakarta_Sans','Hind_Siliguri',sans-serif]`}>
      {/* Top Header Navbar */}
      <HeaderNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        questionCount={items.length}
        templateId={config.templateId}
        onSelectTemplate={(id) => setConfig(prev => ({ ...prev, templateId: id }))}
        onLoadSample={handleLoadSample}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        isSyncing={isSyncing}
        lastSavedTime={lastSavedTime}
        appTheme={appTheme}
        onToggleAppTheme={() => setAppTheme(t => t === 'dark' ? 'light' : 'dark')}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-10 space-y-10">
        {/* TAB 0: HOME - SLIDE DECKS LIST & TOOL SELECTOR */}
        {activeTab === 'home' && (
          <SlideDecksHome
            currentItems={items}
            currentConfig={config}
            onOpenDeck={handleOpenDeck}
            onOpenDeckSettings={handleOpenDeckSettings}
            onOpenSocialGenerator={handleOpenSocialGenerator}
            onNavigateTab={setActiveTab}
            onSelectTemplate={(id) => setConfig(prev => ({ ...prev, templateId: id }))}
            onLoadSample={handleLoadSample}
            appTheme={appTheme}
          />
        )}

        {/* TAB 0.5: SOCIAL MEDIA POST GENERATOR */}
        {activeTab === 'social' && (
          <SocialPostGenerator
            items={items}
            config={config}
            appTheme={appTheme}
          />
        )}

        {/* TAB 0.6: SETTINGS VIEW */}
        {activeTab === 'settings' && (
          <SettingsView appTheme={appTheme} />
        )}

        {/* TAB 1: SLIDE PREVIEW & DECK MANAGER */}
        {activeTab === 'preview' && (
          <div className="space-y-6">
            {/* OVERVIEW GRID MODE vs SINGLE SLIDE PREVIEW MODE */}
            {isOverviewMode ? (
              /* ALL CREATED SLIDES GRID OVERVIEW */
              <div className="space-y-6 animate-fadeIn">
                <div className={`p-6 rounded-3xl border shadow-2xl flex flex-wrap items-center justify-between gap-4 ${
                  isAppLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
                }`}>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsOverviewMode(false)}
                      className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
                    >
                      <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                      <span>Back to Slide #{selectedIndex + 1} Preview</span>
                    </button>
                    <div>
                      <h2 className="text-lg font-extrabold flex items-center gap-2">
                        <span>All Created Slides Deck ({items.length})</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 font-mono border border-amber-500/30">
                          {items.length} Questions
                        </span>
                      </h2>
                      <div className="flex items-center gap-3 text-xs mt-1 flex-wrap">
                        <span className={isAppLight ? 'text-slate-600' : 'text-slate-400'}>
                          Subject: <strong className={isAppLight ? 'text-slate-900' : 'text-slate-200'}>{config.badgeTag || config.headerTitle || 'Biology'}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-bold text-amber-500">
                          <span>{isLightTemplate ? '☀️' : '🌙'}</span>
                          <span>Theme: {activeTemplate.name}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border ${
                    isAppLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-slate-950 text-amber-300 border-slate-800'
                  }`}>
                    Active Slide: #{selectedIndex + 1} of {items.length}
                  </span>
                </div>

                {/* Slides Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={`${item.id}_${idx}`}
                        onClick={() => {
                          setSelectedIndex(idx);
                          setIsOverviewMode(false);
                        }}
                        className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                          isAppLight
                            ? isSelected
                              ? 'bg-amber-50 border-amber-500 shadow-xl ring-2 ring-amber-400/50'
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                            : isSelected
                              ? 'bg-amber-500/10 border-amber-500/60 shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/40'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Card Header Bar: Slide number + Subject + Theme Indicator */}
                          <div className={`flex items-center justify-between gap-2 border-b pb-2 ${
                            isAppLight ? 'border-slate-200' : 'border-slate-800/80'
                          }`}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono ${
                                isSelected ? 'bg-amber-500 text-slate-950' : isAppLight ? 'bg-slate-100 text-slate-800 border' : 'bg-slate-800 text-amber-300'
                              }`}>
                                Slide #{idx + 1} of {items.length}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] font-extrabold uppercase text-emerald-500 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Active
                                </span>
                              )}
                            </div>

                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border truncate max-w-[110px] ${
                              isLightTemplate ? 'bg-amber-400/20 text-amber-800 border-amber-300' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            }`}>
                              {activeTemplate.name}
                            </span>
                          </div>

                          {/* Stem Text */}
                          <div className={`text-sm font-bold line-clamp-3 leading-relaxed ${
                            isAppLight ? 'text-slate-900' : 'text-white'
                          }`}>
                            <MathText text={item.stem} />
                          </div>

                          {/* Roman items if present */}
                          {item.romanItems && item.romanItems.length > 0 && (
                            <div className={`p-2 rounded-xl border text-[11px] space-y-0.5 ${
                              isAppLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800/80 text-slate-300'
                            }`}>
                              {item.romanItems.map((r, rIdx) => (
                                <div key={rIdx} className="line-clamp-1">
                                  <MathText text={r} />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Options grid summary */}
                          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                            {item.options.slice(0, 4).map(opt => {
                              const isCorrect = opt.isCorrect || opt.key.toLowerCase() === item.answer?.toLowerCase();
                              return (
                                <div
                                  key={opt.key}
                                  className={`p-1.5 rounded-lg border flex items-center gap-1.5 font-medium truncate ${
                                    isCorrect && isAnswerRevealMode
                                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600'
                                      : isAppLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-300'
                                  }`}
                                >
                                  <span className="font-bold text-amber-500 font-mono text-[10px]">{opt.key}.</span>
                                  <span className="truncate"><MathText text={opt.text} /></span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Action Link Footer */}
                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-400">
                          <span>Select to Preview</span>
                          <span className="flex items-center gap-1 hover:translate-x-1 transition-transform">
                            Preview Slide #{idx + 1} →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* SINGLE SLIDE PREVIEW & DECK MANAGER SIDE-BY-SIDE */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT 8 COLUMNS: LIVE CANVAS DISPLAY */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  {/* Slide Name & Controls Bar */}
                  <div className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl border shadow-2xl ${
                    isAppLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/90 border-slate-800 text-white'
                  }`}>
                    {/* Current Slide Name & Back Button to All Slides */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => setIsOverviewMode(true)}
                        className="px-3.5 py-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0"
                        title="View all created slides in grid view"
                      >
                        <LayoutGrid className="w-4 h-4 text-amber-500" />
                        <span className="hidden sm:inline">View All Slides ({items.length})</span>
                      </button>

                      {items.length > 0 && (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-mono text-xs font-bold border border-amber-400 shrink-0">
                            Slide #{selectedIndex + 1}
                          </span>
                          <h3 className="text-xs sm:text-sm font-bold truncate max-w-[200px] sm:max-w-[320px]">
                            <MathText text={currentItem.stem} />
                          </h3>
                        </div>
                      )}
                    </div>

                    {/* Nav, Font & Theme Quick Controls */}
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      {/* Quick Font Family Selector */}
                      <div className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${
                        isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                      }`}>
                        <Type className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <select
                          value={config.fontFamily || "'Kalpurush', serif"}
                          onChange={(e) => setConfig(prev => ({ ...prev, fontFamily: e.target.value }))}
                          className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer max-w-[150px] truncate"
                          title="Change Slide Font"
                        >
                          {FONT_PRESETS.map((f) => (
                            <option key={f.id} value={f.family} className="bg-slate-900 text-white">
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quick Theme Toggle (Minimal Light vs Rakib Dark) */}
                      <button
                        onClick={() => {
                          const isCurrentlyLight = config.templateId.includes('light');
                          setConfig(prev => ({
                            ...prev,
                            templateId: isCurrentlyLight ? 'rakib-dark' : 'minimal-light'
                          }));
                        }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                          config.templateId.includes('light')
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                        }`}
                        title="Toggle Light / Dark Theme"
                      >
                        {config.templateId.includes('light') ? (
                          <>
                            <Sun className="w-3.5 h-3.5 text-slate-950" />
                            <span className="hidden sm:inline">☀️ Light Theme</span>
                          </>
                        ) : (
                          <>
                            <Moon className="w-3.5 h-3.5 text-amber-400" />
                            <span className="hidden sm:inline">🌙 Dark Theme</span>
                          </>
                        )}
                      </button>

                      {/* Previous / Next Slide Nav */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedIndex(prev => Math.max(0, prev - 1))}
                          disabled={selectedIndex === 0 || items.length === 0}
                          className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                          title="Previous Slide (Left Arrow)"
                        >
                          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                        </button>

                        <span className="text-xs font-bold px-2 font-mono">
                          {items.length > 0 ? selectedIndex + 1 : 0} / {items.length}
                        </span>

                        <button
                          onClick={() => setSelectedIndex(prev => Math.min(items.length - 1, prev + 1))}
                          disabled={selectedIndex >= items.length - 1 || items.length === 0}
                          className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                          title="Next Slide (Right Arrow)"
                        >
                          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Answer Reveal Toggle Button */}
                      <button
                        onClick={() => setIsAnswerRevealMode(prev => !prev)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                          isAnswerRevealMode
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                            : 'bg-slate-800 text-slate-200 border-slate-700 hover:text-white'
                        }`}
                      >
                        {isAnswerRevealMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span className="hidden md:inline">{isAnswerRevealMode ? 'Answer Revealed' : 'Hide Answer'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Responsive Slide Canvas Container */}
                  <div className={`relative w-full border rounded-3xl p-3 sm:p-5 lg:p-6 shadow-2xl overflow-hidden flex items-center justify-center ${
                    isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}>
                    {items.length === 0 ? (
                      <div className="text-center p-12 text-slate-400 space-y-4">
                        <Presentation className="w-16 h-16 mx-auto stroke-[1.2] text-amber-500" />
                        <div>
                          <h3 className="text-lg font-bold">No Questions in Deck</h3>
                          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                            Paste raw questions into the "Question Creator" or upload a PDF using the "AI Parser" tab to generate slide decks.
                          </p>
                        </div>
                        <div className="flex justify-center gap-3 pt-2">
                          <button
                            onClick={() => handleLoadSample(0)}
                            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                          >
                            + Load Biology Sample
                          </button>
                          <button
                            onClick={() => handleLoadSample(1)}
                            className="px-4 py-2 rounded-xl bg-slate-800 text-amber-300 font-bold text-xs border border-slate-700"
                          >
                            + Load Math Sample
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        ref={slideContainerRef}
                        className="w-full relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800/80 shadow-2xl flex justify-center items-start"
                        style={{ height: `${Math.round(1080 * slideScale)}px` }}
                      >
                        <div
                          style={{
                            width: '1920px',
                            height: '1080px',
                            transform: `scale(${slideScale})`,
                            transformOrigin: 'top left',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                          }}
                        >
                          <SlideCanvas
                            ref={slideRef}
                            item={currentItem}
                            config={config}
                            currentIndex={selectedIndex}
                            totalCount={items.length}
                            isAnswerRevealMode={isAnswerRevealMode}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT 4 COLUMNS: DECK QUESTION LIST MANAGER */}
                <div className="lg:col-span-4">
                  <DeckManager
                    items={items}
                    onUpdateItems={setItems}
                    onSelectIndex={(idx) => {
                      setSelectedIndex(idx);
                      setIsOverviewMode(false);
                    }}
                    selectedIndex={selectedIndex}
                    appTheme={appTheme}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANUAL EDITOR / QUESTION CREATOR */}
        {activeTab === 'manual' && (
          <ManualEditor
            onAddMCQs={handleAddMCQs}
            onClearAll={handleClearAll}
            appTheme={appTheme}
            items={items}
            onUpdateItems={setItems}
            reviewItems={reviewItems}
            onClearReviewItems={() => setReviewItems([])}
          />
        )}

        {/* TAB 3: AI PDF & TEXT PARSER */}
        {activeTab === 'ai' && (
          <AIUploader
            onAddMCQs={handleAddMCQs}
            onReviewMCQs={handleReviewMCQs}
            appTheme={appTheme}
          />
        )}

        {/* TAB 4: QUESTION BANK & DECK LIBRARY */}
        {activeTab === 'bank' && (
          <QuestionBankView
            currentItems={items}
            currentConfig={config}
            onImportToCurrentDeck={handleImportToCurrentDeck}
            onCreateNewDeckFromSelection={handleCreateNewDeckFromSelection}
            appTheme={appTheme}
          />
        )}

        {/* TAB 5: DECK BRANDING & TEMPLATE SETTINGS */}
        {activeTab === 'settings' && (
          <DeckSettings
            config={config}
            onUpdateConfig={setConfig}
            activeSlideIndex={selectedIndex}
            activeSlideConfig={items[selectedIndex]?.customConfig}
            onUpdateActiveSlideConfig={(slideConfigOverride) => {
              setItems((prev) => {
                const updated = [...prev];
                if (updated[selectedIndex]) {
                  updated[selectedIndex] = {
                    ...updated[selectedIndex],
                    customConfig: slideConfigOverride,
                  };
                }
                return updated;
              });
            }}
            onResetActiveSlideConfig={() => {
              setItems((prev) => {
                const updated = [...prev];
                if (updated[selectedIndex]) {
                  const copy = { ...updated[selectedIndex] };
                  delete copy.customConfig;
                  updated[selectedIndex] = copy;
                }
                return updated;
              });
            }}
            appTheme={appTheme}
          />
        )}
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        items={items}
        config={config}
        currentIndex={selectedIndex}
        slideRef={slideRef}
        appTheme={appTheme}
      />
    </div>
  );
}
