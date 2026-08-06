import React, { useState, useRef, useEffect } from 'react';
import { DeckConfig, MCQItem } from './types';
import { SAMPLE_DECKS } from './utils/bulkParser';
import { useIndexedDBSync } from './hooks/useIndexedDBSync';
import { db } from './db/dexie';
import { SidebarNav } from './components/SidebarNav';
import { SlideCanvas } from './components/SlideCanvas';
import { ManualEditor } from './components/ManualEditor';
import { AIUploader } from './components/AIUploader';
import { DeckManager } from './components/DeckManager';
import { DeckSettingsModal } from './components/DeckSettingsModal';
import { ExportModal } from './components/ExportModal';
import { TemplateLibraryModal } from './components/TemplateLibraryModal';
import { EditQuestionModal } from './components/EditQuestionModal';
import { TemplateCreator } from './components/TemplateCreator';
import { QuestionBankView } from './components/QuestionBankView';
import { MyDecksView } from './components/MyDecksView';
import { SlideDecksHome, ThemeSelection } from './components/SlideDecksHome';
import { SocialPostGenerator } from './components/SocialPostGenerator';
import { SlideTextBoxOverlay } from './components/SlideTextBoxOverlay';
import { SlideTextBoxPanel } from './components/SlideTextBoxPanel';
import { SlideThumb } from './components/SlideThumb';
import { SettingsView } from './components/SettingsView';
import { GlobalSettings } from './components/GlobalSettings';
import { MathText } from './components/MathText';
import { OnboardingTour, defaultTourSteps, TourTab } from './components/OnboardingTour';
import { getTemplateById } from './templates/registry';
import { defaultSlideTextBoxes } from './utils/slideTextBoxes';
import { classroomTextBoxes } from './utils/slideElements';
import { loadGlobalDefaults } from './utils/globalDefaults';
import { SLIDE_ELEMENT_DEFS, SLIDE_LAYOUTS } from './utils/slideElements';
import { SlideTextBox, SlideTextBoxBind } from './types';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Presentation, LayoutGrid, ArrowLeft, CheckCircle2, Type, Sun, Moon, PenTool, LayoutTemplate, Copy, FileText, Download, Sliders } from 'lucide-react';
import { FONT_PRESETS } from './utils/fontPresets';
import { applyDesignToConfig } from './utils/templatePresets';

export default function App() {
  // Application State
  const [items, setItems] = useState<MCQItem[]>(SAMPLE_DECKS[0].items);
  const [reviewItems, setReviewItems] = useState<MCQItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'home' | 'decks' | 'social' | 'preview' | 'bank' | 'ai' | 'manual' | 'settings' | 'templates' | 'ai-keys'>('home');
  const [isAnswerRevealMode, setIsAnswerRevealMode] = useState<boolean>(false);
  const [isOverviewMode, setIsOverviewMode] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  // Export scope per entry point — sidebar "Export Slides" = all, Slide Studio Download = current slide only
  const [exportScope, setExportScope] = useState<'all' | 'current'>('all');
  // Export override — when downloading a saved deck from "My Decks", the modal
  // exports THAT deck's items/config instead of the active workspace deck.
  const [exportDeckOverride, setExportDeckOverride] = useState<{ items: MCQItem[]; config: DeckConfig } | null>(null);
  // Saved-deck id currently being edited in Deck Settings — edits made there get
  // persisted back to that deck's row in db.questionDecks (see effect below).
  const [editingSavedDeckId, setEditingSavedDeckId] = useState<string | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);

  // Deck-scoped settings modal — opened from Slide Studio (or Home / My Decks).
  // Edits a draft config with a live preview; applied only on "Apply to All".
  const [isDeckSettingsModalOpen, setIsDeckSettingsModalOpen] = useState<boolean>(false);

  // Inline question edit modal (opened from the deck list) + handoff to the dedicated editor
  const [editingQuestion, setEditingQuestion] = useState<MCQItem | null>(null);
  const [dedicatedEditItem, setDedicatedEditItem] = useState<MCQItem | null>(null);

  // Slide text box edit mode (overlay layer) + edit scope (deck-wide vs active slide only)
  const [isTextBoxEditMode, setIsTextBoxEditMode] = useState<boolean>(false);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState<string | null>(null);
  const [textBoxScope, setTextBoxScope] = useState<'global' | 'slide'>('global');

  // Question shared from the Question Bank → preselected in Social Post Generator
  const [socialTargetId, setSocialTargetId] = useState<string | null>(null);

  // App Shell Theme (Dark / Light)
  const [appTheme, setAppTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('edtech_app_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('edtech_app_theme', appTheme);
  }, [appTheme]);

  // Onboarding Tour — auto-launch on first visit, reopenable via Start Tour buttons
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [tourDone] = useState<boolean>(() => {
    try {
      return localStorage.getItem('edtech_tour_done') === 'true';
    } catch {
      return false;
    }
  });
  const tourDoneRef = useRef<boolean>(tourDone);

  useEffect(() => {
    if (tourDoneRef.current) return;
    const t = setTimeout(() => setIsTourOpen(true), 900);
    return () => clearTimeout(t);
  }, []);

  const handleCloseTour = () => {
    tourDoneRef.current = true;
    try {
      localStorage.setItem('edtech_tour_done', 'true');
    } catch {
      // localStorage unavailable — in-memory flag still prevents repeat auto-launch this session
    }
    setIsTourOpen(false);
  };

  // Deck Branding Config State
  const globalDefaults = loadGlobalDefaults();
  const [config, setConfig] = useState<DeckConfig>({
    templateId: globalDefaults.defaultTemplateId,
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
    questionNumberFormat: globalDefaults.defaultQuestionNumberFormat,
    fontFamily: "'Kalpurush', serif",
    bgPreset: 'none',
    bgImageOpacity: 1.0,
    bgOverlayDarkness: 0.0,
    slideTextBoxes: defaultSlideTextBoxes(),
  });

  // Current deck's display name (shown at the top of Slide Studio).
  const [deckName, setDeckName] = useState<string>(SAMPLE_DECKS[0]?.name || 'Untitled Deck');

  // IndexedDB Auto-Sync Hook
  const { isSyncing, lastSavedTime } = useIndexedDBSync(
    items,
    setItems,
    config,
    setConfig
  );

  // Persist Deck Settings edits back to the saved deck row in the library.
  // When a deck was opened into Settings from "My Decks", any items/config
  // change is written to that deck's db.questionDecks entry (debounced).
  useEffect(() => {
    if (!editingSavedDeckId) return;
    const timer = setTimeout(async () => {
      try {
        await db.questionDecks.update(editingSavedDeckId, {
          items,
          config,
          updatedAt: Date.now(),
        });
      } catch (err) {
        console.error('Failed to persist settings edits to saved deck:', err);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [editingSavedDeckId, items, config]);

  // Canvas DOM ref for PNG screenshot export
  const slideRef = useRef<HTMLDivElement>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const [slideScale, setSlideScale] = useState<number>(0.4);

  // Slide text box overlay actions (deck-wide stored in config.slideTextBoxes;
  // slide-scope stored on the active MCQItem's customConfig.slideTextBoxes)
  const slideTextBoxOverride = items[selectedIndex]?.customConfig?.slideTextBoxes;
  const hasTextBoxOverride = !!slideTextBoxOverride;
  const activeTextBoxes: SlideTextBox[] = slideTextBoxOverride ?? config.slideTextBoxes ?? [];
  const effectiveTextBoxConfig: DeckConfig = { ...config, ...(items[selectedIndex]?.customConfig || {}) };

  const setTextBoxes = (updater: (boxes: SlideTextBox[]) => SlideTextBox[]) => {
    if (textBoxScope === 'slide' && items[selectedIndex]) {
      const slideIdx = selectedIndex;
      setItems(prev => {
        const updated = [...prev];
        const cur = updated[slideIdx];
        if (!cur) return prev;
        const base = cur.customConfig?.slideTextBoxes ?? config.slideTextBoxes ?? [];
        updated[slideIdx] = {
          ...cur,
          customConfig: { ...(cur.customConfig || {}), slideTextBoxes: updater(base) },
        };
        return updated;
      });
    } else {
      setConfig(prev => ({ ...prev, slideTextBoxes: updater(prev.slideTextBoxes || []) }));
    }
  };

  const changeTextBoxScope = (scope: 'global' | 'slide') => {
    // Switching to slide scope snapshots the deck-wide boxes so the active slide
    // starts from exactly what is on screen (later edits no longer touch other slides)
    if (scope === 'slide' && items[selectedIndex] && !items[selectedIndex]?.customConfig?.slideTextBoxes) {
      const slideIdx = selectedIndex;
      setItems(prev => {
        const updated = [...prev];
        const cur = updated[slideIdx];
        if (!cur) return prev;
        updated[slideIdx] = {
          ...cur,
          customConfig: { ...(cur.customConfig || {}), slideTextBoxes: config.slideTextBoxes || [] },
        };
        return updated;
      });
    }
    setTextBoxScope(scope);
  };

  const revertTextBoxOverride = () => {
    if (!window.confirm("Remove this slide's custom text boxes and go back to the deck-wide (all slides) layout?")) return;
    const slideIdx = selectedIndex;
    setItems(prev => {
      const updated = [...prev];
      const cur = updated[slideIdx];
      if (!cur) return prev;
      const copy = { ...cur };
      if (copy.customConfig) {
        const cc = { ...copy.customConfig };
        delete cc.slideTextBoxes;
        if (Object.keys(cc).length === 0) delete copy.customConfig;
        else copy.customConfig = cc;
      }
      updated[slideIdx] = copy;
      return updated;
    });
    setSelectedTextBoxId(null);
  };

  const updateSlideBox = (id: string, patch: Partial<SlideTextBox>) => {
    setTextBoxes(boxes => boxes.map(b => (b.id === id ? { ...b, ...patch } : b)));
  };

  const addSlideBox = (bind: SlideTextBoxBind) => {
    const id = `b_${bind}_${Date.now()}`;
    const newBox: SlideTextBox = {
      id,
      bind,
      text: bind === 'free' ? 'Type your text here...' : undefined,
      x: 120,
      y: 300 + (activeTextBoxes.length % 5) * 80,
      w: 900,
      fontSize: bind === 'stem' ? 56 : 40,
      color: '#ffffff',
      align: 'left',
      bold: bind === 'stem' || bind === 'brand',
    };
    setTextBoxes(boxes => [...boxes, newBox]);
    setSelectedTextBoxId(id);
  };

  const addElementBox = (elementId: string, extra?: { imageUrl?: string; iconName?: string }) => {
    const def = SLIDE_ELEMENT_DEFS.find(d => d.id === elementId);
    if (!def) return;
    const newBox = def.build(extra);
    setTextBoxes(boxes => [...boxes, newBox]);
    setSelectedTextBoxId(newBox.id);
  };

  const addLayoutToDeck = (layoutId: string) => {
    const layout = SLIDE_LAYOUTS.find(l => l.id === layoutId);
    if (!layout) return;
    const scopeLabel = textBoxScope === 'slide' ? 'the current slide' : 'every slide';
    if (window.confirm(`Apply the "${layout.name}" layout? This replaces the current text boxes on ${scopeLabel}.`)) {
      setTextBoxes(() => layout.build());
      setSelectedTextBoxId(null);
    }
  };

  const deleteSlideBox = (id: string) => {
    setTextBoxes(boxes => boxes.filter(b => b.id !== id));
    setSelectedTextBoxId(prev => (prev === id ? null : prev));
  };

  const duplicateSlideBox = (id: string) => {
    setTextBoxes(boxes => {
      const src = boxes.find(b => b.id === id);
      if (!src) return boxes;
      const copy: SlideTextBox = { ...src, id: `b_${src.bind}_${Date.now()}`, y: Math.min(src.y + 60, 1020) };
      return [...boxes, copy];
    });
  };

  const reorderSlideBox = (id: string, dir: 'up' | 'down') => {
    setTextBoxes(boxes => {
      const idx = boxes.findIndex(b => b.id === id);
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (idx < 0 || target < 0 || target >= boxes.length) return boxes;
      const next = [...boxes];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const resetSlideTextBoxes = () => {
    if (!window.confirm('Reset the slide text boxes to the default layout?')) return;
    setTextBoxes(() => defaultSlideTextBoxes());
    setSelectedTextBoxId(null);
  };

  const clearSlideTextBoxes = () => {
    if (!window.confirm('Remove all text boxes in this scope?')) return;
    setTextBoxes(() => []);
    setSelectedTextBoxId(null);
  };

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
    setEditingSavedDeckId(null);
    setItems(ensureUniqueIds(selectedItems));
    setSelectedIndex(0);
    setActiveTab('preview');
    setDeckName(globalDefaults.defaultDeckName);
    setConfig((prev) => ({
      ...prev,
      templateId: globalDefaults.defaultTemplateId,
      questionNumberFormat: globalDefaults.defaultQuestionNumberFormat,
    }));
    alert(`Created new presentation deck with ${selectedItems.length} selected questions!`);
  };

  const handleLoadSample = (sampleIndex: number) => {
    const sample = SAMPLE_DECKS[sampleIndex] || SAMPLE_DECKS[0];
    setEditingSavedDeckId(null);
    setItems(ensureUniqueIds(sample.items));
    setSelectedIndex(0);
    setActiveTab('preview');
    setDeckName(sample.name || 'Untitled Deck');
  };

  const handleOpenDeck = (deckItems: MCQItem[], deckTitle?: string) => {
    setEditingSavedDeckId(null);
    setItems(ensureUniqueIds(deckItems));
    setSelectedIndex(0);
    if (deckTitle) {
      setConfig(prev => ({ ...prev, headerTitle: deckTitle }));
      setDeckName(deckTitle);
    }
    setActiveTab('preview');
  };

  const handleOpenDeckSettings = (deckItems: MCQItem[], newConfig?: DeckConfig, savedDeckId?: string) => {
    setItems(ensureUniqueIds(deckItems));
    if (newConfig) {
      setConfig(newConfig);
    }
    // Track which library deck is being edited so Settings changes persist back
    // to it. Opening settings from Home (no id) clears any prior target.
    setEditingSavedDeckId(savedDeckId ?? null);
    setActiveTab('preview');
    setIsDeckSettingsModalOpen(true);
  };

  // Classroom View quick action (Deck Settings → Layout) — enforce class_mode +
  // classroom text boxes on the whole deck, then hand off to the box editor so
  // the user can immediately start changing text boxes. Keeps editingSavedDeckId
  // intact so the change still persists back to the saved library deck.
  const handleEnforceClassroomView = () => {
    setConfig((prev) => ({
      ...prev,
      layoutMode: 'class_mode',
      slideTextBoxes: classroomTextBoxes(),
    }));
    setIsDeckSettingsModalOpen(false);
    setActiveTab('preview');
    setIsTextBoxEditMode(true);
    setTextBoxScope('global');
    setSelectedTextBoxId(null);
  };

  // Slide-specific theme application — writes theme fields into the ACTIVE slide's
  // customConfig only, so other slides keep the deck theme (SlideCanvas merges
  // item.customConfig over config when rendering every slide).
  const applyThemeToActiveSlide = (selection: ThemeSelection) => {
    if (!items[selectedIndex]) return;
    const slideIdx = selectedIndex;
    setItems(prev => {
      const updated = [...prev];
      const cur = updated[slideIdx];
      if (!cur) return prev;
      const cc = { ...(cur.customConfig || {}) };
      cc.templateId = selection.templateId;
      if (selection.customTheme) cc.customTheme = selection.customTheme;
      if (selection.design) {
        const { templateId, customTheme, ...rest } = selection.design;
        Object.assign(cc, rest);
      }
      updated[slideIdx] = { ...cur, customConfig: cc };
      return updated;
    });
  };

  const resetActiveSlideTheme = () => {
    if (!items[selectedIndex]) return;
    const slideIdx = selectedIndex;
    setItems(prev => {
      const updated = [...prev];
      const cur = updated[slideIdx];
      if (!cur) return prev;
      const copy = { ...cur };
      if (copy.customConfig) {
        const cc = { ...copy.customConfig };
        delete cc.templateId;
        delete cc.customTheme;
        delete cc.accentColorCustom;
        if (Object.keys(cc).length === 0) delete copy.customConfig;
        else copy.customConfig = cc;
      }
      updated[slideIdx] = copy;
      return updated;
    });
  };

  // Promotes the ACTIVE slide's design (theme + text-box layout) to the whole
  // deck: its customConfig becomes the deck-wide config, and every per-slide
  // override is cleared so all slides render exactly like the current one.
  const applyActiveSlideDesignToAll = () => {
    const slideIdx = selectedIndex;
    const slide = items[slideIdx];
    if (!slide) return;
    const cc = slide.customConfig || {};
    if (
      !window.confirm(
        'Apply this slide\u2019s theme and text-box layout to every slide?\n\nThis makes the active slide the deck-wide design and clears any other per-slide overrides.'
      )
    ) {
      return;
    }
    setConfig(prev => ({ ...prev, ...cc }));
    setItems(prev => prev.map(it => (it.customConfig ? { ...it, customConfig: undefined } : it)));
    setTextBoxScope('global');
    setSelectedTextBoxId(null);
  };

  const handleOpenSocialGenerator = (deckItems: MCQItem[]) => {
    setEditingSavedDeckId(null);
    setItems(ensureUniqueIds(deckItems));
    setActiveTab('social');
  };

  const handleOpenInSocial = (question: MCQItem) => {
    // Ensure the shared question exists in the active deck so the picker can find it
    setItems(prev => (prev.some(q => q.id === question.id) ? prev : ensureUniqueIds([...prev, question])));
    setSocialTargetId(question.id);
    setActiveTab('social');
  };

  // Download a saved deck from "My Decks" — export modal targets that deck's items/config
  const handleDownloadDeck = ({ items: deckItems, config: deckConfig }: { items: MCQItem[]; config: DeckConfig }) => {
    setExportDeckOverride({ items: deckItems, config: deckConfig });
    setExportScope('all');
    setIsExportModalOpen(true);
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

  // Active slide's effective theme (deck config + slide-level override) — used by
  // the quick Light/Dark toggle so theme choices stay slide-specific.
  const activeSlideConfigOverride = items[selectedIndex]?.customConfig;
  const activeSlideTemplateId = activeSlideConfigOverride?.templateId || config.templateId;
  const activeSlideTheme = getTemplateById(activeSlideTemplateId, activeSlideConfigOverride?.customTheme);
  const isActiveSlideLight = activeSlideTheme.themeType === 'light';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isAppLight ? 'bg-slate-50 text-slate-900 bg-mesh-gradient-light' : 'bg-slate-950 text-slate-100 bg-mesh-gradient'
    } flex flex-col lg:flex-row font-['Plus_Jakarta_Sans','Hind_Siliguri',sans-serif]`}>
      {/* Sidebar Navigation (Desktop) + Mobile Drawer */}
      <SidebarNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        questionCount={items.length}
        onOpenExportModal={() => {
          setExportScope('all');
          setIsExportModalOpen(true);
        }}
        isSyncing={isSyncing}
        lastSavedTime={lastSavedTime}
        appTheme={appTheme}
        onToggleAppTheme={() => setAppTheme(t => t === 'dark' ? 'light' : 'dark')}
        onStartTour={() => setIsTourOpen(true)}
      />

      {/* Main Content View Container */}
      <main className="flex-1 min-w-0 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-10 space-y-10">
        {/* TAB 0: HOME - SLIDE DECKS LIST & TOOL SELECTOR */}
        {activeTab === 'home' && (
          <SlideDecksHome
            currentItems={items}
            currentConfig={config}
            activeSlideConfig={items[selectedIndex]?.customConfig}
            onOpenDeck={handleOpenDeck}
            onOpenDeckSettings={handleOpenDeckSettings}
            onOpenSocialGenerator={handleOpenSocialGenerator}
            onNavigateTab={setActiveTab}
            onSelectTheme={applyThemeToActiveSlide}
            onResetSlideTheme={resetActiveSlideTheme}
            onLoadSample={handleLoadSample}
            appTheme={appTheme}
            onStartTour={() => setIsTourOpen(true)}
          />
        )}

        {/* TAB 0.5: MY PRESENTATION DECKS */}
        {activeTab === 'decks' && (
          <MyDecksView
            currentItems={items}
            currentConfig={config}
            onOpenDeck={handleOpenDeck}
            onOpenDeckSettings={handleOpenDeckSettings}
            onOpenSocialGenerator={handleOpenSocialGenerator}
            onDownloadDeck={handleDownloadDeck}
            onNavigateTab={setActiveTab}
            appTheme={appTheme}
          />
        )}

        {/* TAB 0.5: SOCIAL MEDIA POST GENERATOR */}
        {activeTab === 'social' && (
          <SocialPostGenerator
            items={items}
            config={config}
            appTheme={appTheme}
            preselectedItemId={socialTargetId}
          />
        )}

        {/* TAB 0.6: AI PROVIDER & KEY SETTINGS */}
        {activeTab === 'ai-keys' && (
          <SettingsView appTheme={appTheme} />
        )}

        {/* TAB 1: SLIDE PREVIEW & DECK MANAGER */}
        {activeTab === 'preview' && (
          <div className="space-y-6">
            {/* DECK NAME — shown on top of the studio, always visible */}
            <div className={`p-5 rounded-3xl border shadow-xl flex flex-wrap items-center gap-x-4 gap-y-2 ${
              isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className={`p-3 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-slate-950 shadow-lg shadow-amber-500/25 flex items-center justify-center shrink-0`}>
                <FileText className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isAppLight ? 'text-amber-600' : 'text-amber-500'}`}>
                    Active Deck
                  </span>
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                    isAppLight ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}>
                    {items.length} slide{items.length === 1 ? '' : 's'}
                  </span>
                </div>
                <h1 className={`text-base sm:text-lg font-black tracking-tight leading-tight truncate ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                  {deckName}
                </h1>
              </div>
              <div className={`hidden md:flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border ${
                isAppLight ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-slate-950 text-slate-300 border-slate-800'
              }`}>
                <Presentation className={`w-3.5 h-3.5 ${isLightTemplate ? 'text-amber-500' : 'text-indigo-400'}`} />
                <span className="text-slate-400 font-medium">Theme:</span>
                <span className="text-amber-500">{activeTemplate.name}</span>
              </div>
            </div>

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

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsTemplateModalOpen(true)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                        isAppLight
                          ? 'bg-white text-slate-700 border-slate-300 hover:text-slate-900'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                      }`}
                      title="Switch the whole deck design to a saved template"
                    >
                      <LayoutTemplate className="w-3.5 h-3.5 text-amber-500" />
                      Switch Template
                    </button>
                    <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border ${
                      isAppLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-slate-950 text-amber-300 border-slate-800'
                    }`}>
                      Active Slide: #{selectedIndex + 1} of {items.length}
                    </span>
                  </div>
                </div>

                {/* Slides Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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

                          {/* Exact real slide render — identical to the Slide Studio preview */}
                          <SlideThumb
                            item={item}
                            config={config}
                            index={idx}
                            totalCount={items.length}
                            isAnswerRevealMode={isAnswerRevealMode}
                            className="group-hover:scale-[1.02] transition-transform"
                          />
                        </div>

                        {/* Action Link Footer */}
                        <div className={`pt-3 border-t flex items-center justify-between text-xs font-bold ${
                          isAppLight ? 'border-slate-200 text-amber-600' : 'border-slate-800/80 text-amber-400'
                        }`}>
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
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-10 items-start">
                {/* LEFT: LIVE CANVAS DISPLAY (wider when the Canva-style side panel is open) */}
                <div className={`flex flex-col gap-8 ${isTextBoxEditMode ? 'xl:col-span-8' : 'xl:col-span-7'}`}>
                  {/* Slide Name & Controls Bar */}
                  <div
                    data-tour="studio-toolbar"
                    className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-5 rounded-3xl border shadow-2xl ${
                    isAppLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/90 border-slate-800 text-white'
                  }`}>
                    {/* Current Slide Name & Back Button to All Slides */}
                    <div className="flex flex-wrap items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => setIsOverviewMode(true)}
                        className="px-4 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0"
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
                    <div className="flex flex-wrap items-center gap-3">
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

                      {/* Quick Theme Toggle (Minimal Light vs Rakib Dark) — applies to the ACTIVE slide only */}
                      <button
                        onClick={() => {
                          applyThemeToActiveSlide({
                            templateId: isActiveSlideLight ? 'rakib-dark' : 'minimal-light',
                          });
                        }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                          isActiveSlideLight
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20'
                            : isAppLight
                            ? 'bg-white text-slate-700 border-slate-300 hover:text-slate-900'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                        }`}
                        title="Toggle Light / Dark Theme (active slide only)"
                      >
                        {isActiveSlideLight ? (
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

                      {/* Apply the active slide's design (theme + box layout) to every slide */}
                      <button
                        onClick={applyActiveSlideDesignToAll}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                          isAppLight
                            ? 'bg-white text-slate-700 border-slate-300 hover:border-amber-400 hover:text-amber-700'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-500/60 hover:text-amber-300'
                        }`}
                        title="Make this slide's theme and text-box layout the design for every slide in the deck"
                      >
                        <Copy className="w-3.5 h-3.5 text-amber-500" />
                        <span className="hidden xl:inline">Apply Slide Design to All</span>
                      </button>

                      {/* Template Store Modal Opener */}
                      <button
                        onClick={() => setIsTemplateModalOpen(true)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                          isAppLight
                            ? 'bg-white text-slate-700 border-slate-300 hover:text-slate-900'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                        }`}
                        title="Open the template store — save the current slide format or switch to a saved template"
                      >
                        <LayoutTemplate className="w-3.5 h-3.5 text-amber-500" />
                        <span className="hidden sm:inline">Templates</span>
                      </button>

                      {/* Deck Settings — deck-scoped branding/layout modal (draft + live preview + Apply to All) */}
                      <button
                        onClick={() => {
                          setEditingSavedDeckId(null);
                          setIsDeckSettingsModalOpen(true);
                        }}
                        data-tour="studio-deck-settings"
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                          isAppLight
                            ? 'bg-white text-slate-700 border-slate-300 hover:text-slate-900'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                        }`}
                        title="Open Deck Settings — branding, fonts, layout mode, background & banners for this deck"
                      >
                        <Sliders className="w-3.5 h-3.5 text-amber-500" />
                        <span className="hidden sm:inline">Deck Settings</span>
                      </button>

                      {/* Download Current Slide — Export modal scoped to the active slide only */}
                      <button
                        onClick={() => {
                          setExportScope('current');
                          setIsExportModalOpen(true);
                        }}
                        disabled={items.length === 0}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                          isAppLight
                            ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                        title="Download the current slide — PPTX, PDF, PNG, ZIP (current slide only)"
                        data-tour="studio-download"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-500" />
                        <span className="hidden sm:inline">Download</span>
                      </button>

                      {/* Previous / Next Slide Nav */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedIndex(prev => Math.max(0, prev - 1))}
                          disabled={selectedIndex === 0 || items.length === 0}
                          className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
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
                          className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                          title="Next Slide (Right Arrow)"
                        >
                          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Answer Reveal Toggle Button */}
                      <button
                        onClick={() => setIsAnswerRevealMode(prev => !prev)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                          isAnswerRevealMode
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                            : isAppLight
                            ? 'bg-slate-100 text-slate-700 border-slate-300 hover:text-slate-900'
                            : 'bg-slate-800 text-slate-200 border-slate-700 hover:text-white'
                        }`}
                      >
                        {isAnswerRevealMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span className="hidden md:inline">{isAnswerRevealMode ? 'Answer Revealed' : 'Hide Answer'}</span>
                      </button>

                      {/* Slide Text Box Edit Mode Toggle */}
                      <button
                        onClick={() => {
                          setIsTextBoxEditMode(prev => !prev);
                          if (isTextBoxEditMode) setSelectedTextBoxId(null);
                        }}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                          isTextBoxEditMode
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                            : isAppLight
                            ? 'bg-slate-100 text-slate-700 border-slate-300 hover:text-slate-900'
                            : 'bg-slate-800 text-slate-200 border-slate-700 hover:text-white'
                        }`}
                        title="Add/Edit draggable text boxes over every slide"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">{isTextBoxEditMode ? 'Editing Text Boxes' : 'Edit Text Boxes'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Responsive Slide Canvas Container — generous top padding keeps slide-top boxes clear of the controls bar */}
                  <div className={`relative w-full border rounded-3xl pt-8 sm:pt-10 lg:pt-12 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 shadow-2xl overflow-hidden flex items-center justify-center ${
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
                            className={`px-4 py-2 rounded-xl font-bold text-xs border ${
                              isAppLight ? 'bg-slate-100 text-amber-700 border-slate-300' : 'bg-slate-800 text-amber-300 border-slate-700'
                            }`}
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
                          {isTextBoxEditMode && (
                            <SlideTextBoxOverlay
                              boxes={activeTextBoxes}
                              selectedId={selectedTextBoxId}
                              item={currentItem}
                              config={config}
                              currentIndex={selectedIndex}
                              scale={slideScale}
                              onSelect={setSelectedTextBoxId}
                              onMove={(id, x, y) => updateSlideBox(id, { x, y })}
                              onResize={(id, patch) => updateSlideBox(id, patch)}
                            />
                          )}
                        </div>
                      </div>
                    )}

                  </div>

                </div>

                {/* RIGHT COLUMN: Canva-style side panel while editing boxes, else the deck question list */}
                <div className={isTextBoxEditMode ? 'xl:col-span-4' : 'xl:col-span-5'}>
                  {isTextBoxEditMode ? (
                    <div className="xl:sticky xl:top-20">
                      <SlideTextBoxPanel
                        boxes={activeTextBoxes}
                        selectedId={selectedTextBoxId}
                        appTheme={appTheme}
                        config={effectiveTextBoxConfig}
                        textBoxScope={textBoxScope}
                        hasTextBoxOverride={hasTextBoxOverride}
                        onChangeTextBoxScope={changeTextBoxScope}
                        onRevertTextBoxOverride={revertTextBoxOverride}
                        onApplySlideLayoutToAll={applyActiveSlideDesignToAll}
                        onAddBox={addSlideBox}
                        onAddElement={addElementBox}
                        onAddLayout={addLayoutToDeck}
                        onUpdateBox={updateSlideBox}
                        onDeleteBox={deleteSlideBox}
                        onDuplicateBox={duplicateSlideBox}
                        onReorderBox={reorderSlideBox}
                        onSelectBox={setSelectedTextBoxId}
                        onReset={resetSlideTextBoxes}
                        onClearAll={clearSlideTextBoxes}
                        onClose={() => setIsTextBoxEditMode(false)}
                      />
                    </div>
                  ) : (
                    <DeckManager
                      items={items}
                      onUpdateItems={setItems}
                      onSelectIndex={(idx) => {
                        setSelectedIndex(idx);
                        setIsOverviewMode(false);
                      }}
                      selectedIndex={selectedIndex}
                      appTheme={appTheme}
                      onEditQuestion={(item) => setEditingQuestion(item)}
                    />
                  )}
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
            prefillEditItem={dedicatedEditItem}
            onPrefillConsumed={() => setDedicatedEditItem(null)}
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
            onOpenInSocial={handleOpenInSocial}
            appTheme={appTheme}
          />
        )}

        {/* TAB 5: GLOBAL SETTINGS — app-wide defaults (deck settings live in Slide Studio modal) */}
        {activeTab === 'settings' && (
          <GlobalSettings
            appTheme={appTheme}
            onToggleAppTheme={() => setAppTheme(t => t === 'dark' ? 'light' : 'dark')}
          />
        )}

        {/* TAB 6: TEMPLATE CREATOR — design & save custom slide formats */}
        {activeTab === 'templates' && (
          <TemplateCreator
            config={config}
            items={items}
            appTheme={appTheme}
            onApplyTemplate={(preset) => setConfig(applyDesignToConfig(preset, config))}
            onApplyConfig={setConfig}
          />
        )}
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setExportDeckOverride(null);
        }}
        items={exportDeckOverride?.items ?? items}
        config={exportDeckOverride?.config ?? config}
        currentIndex={exportDeckOverride ? 0 : selectedIndex}
        slideRef={slideRef}
        appTheme={appTheme}
        scope={exportScope}
      />

      {/* Deck Settings Modal — deck-scoped branding/layout with draft + live preview */}
      <DeckSettingsModal
        isOpen={isDeckSettingsModalOpen}
        onClose={() => setIsDeckSettingsModalOpen(false)}
        config={config}
        onApplyConfig={setConfig}
        activeSlideIndex={selectedIndex}
        activeSlideConfig={items[selectedIndex]?.customConfig}
        onApplyActiveSlideConfig={(slideConfigOverride) => {
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
        items={items}
        appTheme={appTheme}
        onEnforceClassroomView={handleEnforceClassroomView}
      />

      {/* Template Store Modal */}
      <TemplateLibraryModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        config={config}
        appTheme={appTheme}
        onApply={(preset) => setConfig(applyDesignToConfig(preset, config))}
      />

      {/* Inline Question Edit Modal */}
      <EditQuestionModal
        isOpen={!!editingQuestion}
        onClose={() => setEditingQuestion(null)}
        item={editingQuestion}
        onSave={(updated) => {
          setItems(prev => prev.map(q => (q.id === updated.id ? updated : q)));
        }}
        onOpenInDedicatedEditor={(item) => {
          setItems(prev => prev.map(q => (q.id === item.id ? item : q)));
          setEditingQuestion(null);
          setDedicatedEditItem(item);
          setActiveTab('manual');
        }}
        appTheme={appTheme}
      />

      {/* Onboarding Tour */}
      <OnboardingTour
        open={isTourOpen}
        onClose={handleCloseTour}
        onNavigate={(tab) => setActiveTab(tab)}
        steps={defaultTourSteps}
      />
    </div>
  );
}
