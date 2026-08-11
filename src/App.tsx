import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DeckConfig, MCQItem, SavedDeck } from './types';
import { SAMPLE_DECKS } from './utils/bulkParser';
import { useIndexedDBSync } from './hooks/useIndexedDBSync';
import { db } from './db/dexie';
import { getOrCreateDefaultWorkspace, saveReviewQueue } from './utils/workspaceStore';
import { migrateLegacyDraftToDefaultWorkspace } from './utils/workspaceMigration';
import { SidebarNav } from './components/SidebarNav';
import { HeaderNavbar } from './components/HeaderNavbar';
import { SlideCanvas } from './components/SlideCanvas';
import { ManualEditor } from './components/ManualEditor';
import { WorkspacesHome } from './components/workspaces/WorkspacesHome';
import { WorkspaceEditor } from './components/workspaces/WorkspaceEditor';
import { AIUploader } from './components/AIUploader';
import { DeckManager } from './components/DeckManager';
import { DeckSettingsPage } from './components/DeckSettingsPage';
import { ExportModal } from './components/ExportModal';
import { BatchExportModal } from './components/BatchExportModal';
import { TemplateLibraryModal } from './components/TemplateLibraryModal';
import { TemplateStudioModal } from './components/TemplateStudioModal';
import { EditQuestionModal } from './components/EditQuestionModal';
import { AddQuestionsModal } from './components/AddQuestionsModal';
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
import { IngestionToast } from './components/IngestionToast';
import { IngestionProvider } from './ingestion/ingestionStore';
import { MathText } from './components/MathText';
import { OnboardingTour, defaultTourSteps, TourTab } from './components/OnboardingTour';
import { getTemplateById, resolveTheme, TEMPLATES } from './templates/registry';
import { templateToTextBoxes } from './utils/templateToTextBoxes';
import { classroomTextBoxes } from './utils/slideElements';
import { loadGlobalDefaults, createDefaultDeckConfig } from './utils/globalDefaults';
import { SLIDE_ELEMENT_DEFS, SLIDE_LAYOUTS } from './utils/slideElements';
import { SlideTextBox, SlideTextBoxBind } from './types';
import { SlidePreviewModal } from './components/SlidePreviewModal';
import { LayoutLibraryModal } from './components/LayoutLibraryModal';
import { AnswerModeModal } from './components/AnswerModeModal';
import { SavePresetModal } from './components/SavePresetModal';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Presentation, LayoutGrid, ArrowLeft, CheckCircle2, Type, Sun, Moon, PenTool, PenLine, LayoutTemplate, Copy, FileText, Download, Sliders, Maximize2, SquareStack, BookmarkPlus, Plus, Sparkles, Database } from 'lucide-react';
import { FONT_PRESETS } from './utils/fontPresets';
import { applyDesignToConfig } from './utils/templatePresets';
import { expandDeckSlides, questionSlideIndex, SlideRef } from './utils/answerSlides';

export default function App() {
  // Application State
  const [items, setItems] = useState<MCQItem[]>(SAMPLE_DECKS[0].items);
  const [selectedIndex, setSelectedIndex] = useState<number>(2);
  const [activeTab, setActiveTab] = useState<'home' | 'decks' | 'social' | 'preview' | 'bank' | 'ai' | 'workspaces' | 'manual' | 'settings' | 'templates' | 'ai-keys'>('preview');
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  // One-time, idempotent: seeds a "Default" workspace from the pre-Workspaces
  // Manual Editor draft (if any was still pending), so upgrading never loses
  // pasted-but-unapproved questions.
  useEffect(() => {
    migrateLegacyDraftToDefaultWorkspace();
  }, []);
  const [isAnswerRevealMode, setIsAnswerRevealMode] = useState<boolean>(false);
  const [isOverviewMode, setIsOverviewMode] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isLargePreviewOpen, setIsLargePreviewOpen] = useState<boolean>(false);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState<boolean>(false);
  const [isAnswerModeModalOpen, setIsAnswerModeModalOpen] = useState<boolean>(false);
  // Export scope per entry point — My Decks card download = all, Slide Studio Download = whole active deck
  const [exportScope, setExportScope] = useState<'all' | 'current'>('all');
  // Batch deck export modal — opened from the navbar "Export Slides" buttons; lets the
  // user pick multiple saved decks and download each as its own PPTX.
  const [isBatchExportModalOpen, setIsBatchExportModalOpen] = useState<boolean>(false);
  // Export override — when downloading a saved deck from "My Decks", the modal
  // exports THAT deck's items/config instead of the active workspace deck.
  const [exportDeckOverride, setExportDeckOverride] = useState<{ items: MCQItem[]; config: DeckConfig } | null>(null);
  // Saved-deck id currently being edited in Deck Settings — edits made there get
  // persisted back to that deck's row in db.questionDecks (see effect below).
  const [editingSavedDeckId, setEditingSavedDeckId] = useState<string | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [isTemplateStudioOpen, setIsTemplateStudioOpen] = useState<boolean>(false);
  const [isSavePresetOpen, setIsSavePresetOpen] = useState<boolean>(false);

  // "Add Questions" chooser modal — wide Slide Studio button → 3 source cards
  // (Question Bank / Manual Editor / Question Creator Form).
  const [isAddQuestionsOpen, setIsAddQuestionsOpen] = useState<boolean>(false);

  // Deck-scoped settings page — opened from Slide Studio (or Home / My Decks).
  // Edits a draft config with a preview modal; applied only on "Apply to All".
  const [isDeckSettingsOpen, setIsDeckSettingsOpen] = useState<boolean>(false);

  // Inline question edit modal (opened from the deck list) + handoff to the dedicated editor
  const [editingQuestion, setEditingQuestion] = useState<MCQItem | null>(null);
  // True when editingQuestion was created from "Add Questions → Question Creator
  // Form" (a fresh empty question) — saving appends it to the deck instead of
  // updating an existing one.
  const [isCreatingQuestion, setIsCreatingQuestion] = useState<boolean>(false);

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

  // Mobile drawer state — lifted here so the onboarding tour can auto-open/close
  // it for sidebar steps and the SidebarNav mobile hamburger opens the same drawer.
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

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

  // Deck Branding Config State — initialized with user's saved global app defaults
  const [config, setConfig] = useState<DeckConfig>(() => {
    const base: DeckConfig = createDefaultDeckConfig({
      deckName: SAMPLE_DECKS[0]?.name || 'Untitled Deck',
      headerTitle: 'অধ্যায় ৮ঃ রেচন প্রক্রিয়া',
      footerTag: 'BIOMISSION',
      watermarkHandle: 'Hasnat Shuvro',
      aspectRatio: '16:9',
      showAnswerInSlide: false,
      answerMode: 'hidden',
      showExplanationInSlide: false,
    });
    return { ...base, slideTextBoxes: templateToTextBoxes(base) };
  });

  // Deck rename UI — deckName lives on the config so it persists via autosave
  // and with the saved library deck row.
  const [isEditingDeckName, setIsEditingDeckName] = useState(false);
  const [deckNameDraft, setDeckNameDraft] = useState('');
  const startEditingDeckName = () => {
    setDeckNameDraft(config.deckName || '');
    setIsEditingDeckName(true);
  };
  const commitDeckName = () => {
    setIsEditingDeckName(false);
    const name = deckNameDraft.trim();
    if (!name) return;
    setConfig(prev => (prev.deckName === name ? prev : { ...prev, deckName: name }));
  };

  // Expanded physical slides — in 'separate_slide' answer mode every question is
  // followed by its answer slide, so selectedIndex addresses THIS expanded list.
  const expandedSlides = useMemo(() => expandDeckSlides(items, config), [items, config]);
  const activeSlideRef: SlideRef | undefined = expandedSlides[selectedIndex];
  const activeQuestionIndex =
    activeSlideRef?.questionIndex ?? Math.min(selectedIndex, Math.max(0, items.length - 1));

  // Keep selectedIndex inside the expanded slide list — covers deleting a question
  // while on its (answer) slide and answer-mode changes that shrink the deck.
  useEffect(() => {
    setSelectedIndex(prev => Math.min(prev, Math.max(0, expandedSlides.length - 1)));
  }, [expandedSlides.length]);

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
          ...(config.deckName ? { name: config.deckName } : {}),
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
  const slideTextBoxOverride = items[activeQuestionIndex]?.customConfig?.slideTextBoxes;
  const hasTextBoxOverride = !!slideTextBoxOverride;
  const activeTextBoxes: SlideTextBox[] = slideTextBoxOverride ?? config.slideTextBoxes ?? [];
  const effectiveTextBoxConfig: DeckConfig = { ...config, ...(items[activeQuestionIndex]?.customConfig || {}) };

  const setTextBoxes = (updater: (boxes: SlideTextBox[]) => SlideTextBox[]) => {
    if (textBoxScope === 'slide' && items[activeQuestionIndex]) {
      const slideIdx = activeQuestionIndex;
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
    if (scope === 'slide' && items[activeQuestionIndex] && !items[activeQuestionIndex]?.customConfig?.slideTextBoxes) {
      const slideIdx = activeQuestionIndex;
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
    const slideIdx = activeQuestionIndex;
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

  const moveSlideBox = (dragId: string, overId: string) => {
    setTextBoxes(boxes => {
      const from = boxes.findIndex(b => b.id === dragId);
      const to = boxes.findIndex(b => b.id === overId);
      if (from < 0 || to < 0 || from === to) return boxes;
      const next = [...boxes];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const resetSlideTextBoxes = () => {
    if (!window.confirm('Reset the slide text boxes to the preset template layout?')) return;
    setTextBoxes(() => templateToTextBoxes(config));
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
        if (selectedIndex < expandedSlides.length - 1) {
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
  }, [activeTab, selectedIndex, expandedSlides.length]);

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

  // "Add Questions" chooser → three source cards. Question Bank / Manual Editor
  // just navigate to their tabs; the Question Creator Form opens the inline
  // edit modal in CREATE mode with a fresh empty question.
  const handleFromQuestionBank = () => {
    setIsAddQuestionsOpen(false);
    setActiveTab('bank');
  };

  const handleFromManualEditor = async () => {
    setIsAddQuestionsOpen(false);
    // If exactly one workspace exists, jump straight into it; otherwise land on
    // the Workspaces home so the user picks or creates one.
    const workspaces = await db.workspaces.toArray();
    if (workspaces.length === 1) {
      setActiveWorkspaceId(workspaces[0].id);
    } else {
      setActiveWorkspaceId(null);
    }
    setActiveTab('workspaces');
  };

  const createEmptyQuestion = (): MCQItem => ({
    id: `q_new_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    questionType: 'standard',
    stem: '',
    options: [
      { key: 'ক', text: '', isCorrect: false },
      { key: 'খ', text: '', isCorrect: false },
      { key: 'গ', text: '', isCorrect: false },
      { key: 'ঘ', text: '', isCorrect: false },
    ],
    answer: '',
  });

  const handleFromQuestionForm = () => {
    setIsAddQuestionsOpen(false);
    setIsCreatingQuestion(true);
    setEditingQuestion(createEmptyQuestion());
  };

  // AI Parser hand-off — lands the parsed batch in the currently open workspace's
  // review queue, or the Default workspace if none is open, then navigates there.
  const handleReviewMCQs = async (newItems: MCQItem[]) => {
    const targetId = activeWorkspaceId ?? (await getOrCreateDefaultWorkspace()).id;
    const target = await db.workspaces.get(targetId);
    if (target) {
      const existingIds = new Set(target.reviewQueue.map((q) => q.id));
      const incoming = newItems.filter((q) => !existingIds.has(q.id));
      await saveReviewQueue(target, [...target.reviewQueue, ...incoming]);
    }
    setActiveWorkspaceId(targetId);
    setActiveTab('workspaces');
  };

  const handleImportToCurrentDeck = (itemsToAdd: MCQItem[]) => {
    setItems(prev => ensureUniqueIds([...prev, ...itemsToAdd]));
    setActiveTab('preview');
    alert(`Successfully added ${itemsToAdd.length} questions to your active presentation!`);
  };

  // Save parsed/imported MCQs straight into the Question Bank (deck library)
  // instead of the active deck — used by the bulk editor + every import source.
  // Returns true only when the deck was actually saved (user confirmed the name),
  // so callers know whether to clear their queue/results.
  const handleImportToQuestionBank = async (itemsToAdd: MCQItem[]): Promise<boolean> => {
    if (itemsToAdd.length === 0) return false;
    const defaultName = `${itemsToAdd.length} Imported MCQs`;
    const name = (window.prompt('Name this new Question Bank deck:', defaultName) || '').trim();
    if (!name) return false;
    const newDeck: SavedDeck = {
      id: `deck_${Date.now()}`,
      name,
      subject: config.badgeTag || 'General',
      badgeTag: config.badgeTag,
      items: ensureUniqueIds(itemsToAdd),
      config: { ...config, deckName: name },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.questionDecks.put(newDeck);
    alert(`Saved ${itemsToAdd.length} questions to the Question Bank as "${name}"!`);
    return true;
  };

  const handleCreateNewDeckFromSelection = (selectedItems: MCQItem[]) => {
    setEditingSavedDeckId(null);
    setItems(ensureUniqueIds(selectedItems));
    setSelectedIndex(0);
    setActiveTab('preview');
    setConfig((prev) => {
      const merged = createDefaultDeckConfig({
        ...prev,
      });
      return { ...merged, slideTextBoxes: templateToTextBoxes(merged) };
    });
    alert(`Created new presentation deck with ${selectedItems.length} selected questions!`);
  };

  const handleLoadSample = (sampleIndex: number) => {
    const sample = SAMPLE_DECKS[sampleIndex] || SAMPLE_DECKS[0];
    setEditingSavedDeckId(null);
    setItems(ensureUniqueIds(sample.items));
    setSelectedIndex(0);
    setActiveTab('preview');
    setConfig((prev) => {
      const merged = { ...prev, deckName: sample.name || 'Untitled Deck' };
      return { ...merged, slideTextBoxes: templateToTextBoxes(merged) };
    });
  };

  const handleOpenDeck = (deckItems: MCQItem[], deckTitle?: string) => {
    setEditingSavedDeckId(null);
    setItems(ensureUniqueIds(deckItems));
    setSelectedIndex(0);
    // Deck name only — the header must keep the chapter title (headerTitle),
    // not be clobbered by the deck/library title.
    if (deckTitle) {
      setConfig(prev => (prev.deckName === deckTitle ? prev : { ...prev, deckName: deckTitle }));
    }
    setActiveTab('preview');
  };

  const handleOpenDeckSettings = (deckItems: MCQItem[], newConfig?: DeckConfig, savedDeckId?: string) => {
    setItems(ensureUniqueIds(deckItems));
    if (newConfig) {
      setConfig(prev => ({ ...newConfig, deckName: newConfig.deckName || prev.deckName }));
    }
    // Track which library deck is being edited so Settings changes persist back
    // to it. Opening settings from Home (no id) clears any prior target.
    setEditingSavedDeckId(savedDeckId ?? null);
    setActiveTab('preview');
    setIsDeckSettingsOpen(true);
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
    setIsDeckSettingsOpen(false);
    setActiveTab('preview');
    setIsTextBoxEditMode(true);
    setTextBoxScope('global');
    setSelectedTextBoxId(null);
  };

  // Slide-specific theme application — writes theme fields into the ACTIVE slide's
  // customConfig only, so other slides keep the deck theme (SlideCanvas merges
  // item.customConfig over config when rendering every slide).
  const applyThemeToActiveSlide = (selection: ThemeSelection) => {
    if (!items[activeQuestionIndex]) return;
    const slideIdx = activeQuestionIndex;
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
    if (!items[activeQuestionIndex]) return;
    const slideIdx = activeQuestionIndex;
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
    const slideIdx = activeQuestionIndex;
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

  const handleApplyDeckConfig = (updated: DeckConfig) => {
    let nextConfig = updated;
    if (nextConfig.slideTextBoxes && nextConfig.slideTextBoxes.length > 0) {
      nextConfig = {
        ...nextConfig,
        slideTextBoxes: templateToTextBoxes(nextConfig),
      };
    }
    setConfig(nextConfig);
    setItems(prev => prev.map(it => {
      if (!it.customConfig) return it;
      const cc = { ...it.customConfig };
      delete cc.templateId;
      delete cc.customTheme;
      delete cc.accentColorCustom;
      if (nextConfig.slideTextBoxes && nextConfig.slideTextBoxes.length > 0) {
        delete cc.slideTextBoxes;
      }
      return Object.keys(cc).length > 0 ? { ...it, customConfig: cc } : { ...it, customConfig: undefined };
    }));
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

  const placeholderItem: MCQItem = {
    id: 'placeholder',
    questionType: 'standard',
    stem: 'কোন প্রশ্ন পাওয়া যায়নি। প্রশ্ন যোগ করতে "Manual Editor" বা "AI Parser" ট্যাব ব্যবহার করুন।',
    options: [
      { key: 'ক', text: 'অপশন ১' },
      { key: 'খ', text: 'অপশন ২' },
      { key: 'গ', text: 'অপশন ৩' },
      { key: 'ঘ', text: 'অপশন ৪' },
    ],
    answer: 'ক',
  };

  const currentItem = items[activeQuestionIndex] || placeholderItem;

  const activeDeckTheme = resolveTheme(config);
  const activeTemplate = activeDeckTheme.template;
  const isLightTemplate = activeDeckTheme.isLight;
  const isAppLight = appTheme === 'light';

  // Active slide's effective theme (deck config + slide-level override) — used by
  // the quick Light/Dark toggle so theme choices stay slide-specific.
  const activeSlideResolvedTheme = resolveTheme(config, items[activeQuestionIndex]?.customConfig);
  const activeSlideTheme = activeSlideResolvedTheme.template;
  const isActiveSlideLight = activeSlideResolvedTheme.isLight;

  return (
    <IngestionProvider>
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isAppLight ? 'bg-slate-50 text-slate-900 bg-mesh-gradient-light' : 'bg-slate-950 text-slate-100 bg-mesh-gradient'
      } flex flex-col font-['Plus_Jakarta_Sans','Hind_Siliguri',sans-serif]`}
    >
      {/* Top Header Navbar */}
      <HeaderNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        questionCount={items.length}
        templateId={config.templateId || 'nobel-dark'}
        onSelectTemplate={(id) => setConfig(prev => ({ ...prev, templateId: id }))}
        onLoadSample={handleLoadSample}
        onOpenExportModal={() => setIsBatchExportModalOpen(true)}
        isSyncing={isSyncing}
        lastSavedTime={lastSavedTime}
        appTheme={appTheme}
        onToggleAppTheme={() => setAppTheme(t => t === 'dark' ? 'light' : 'dark')}
        onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
      />

      {/* Main Content View Container */}
      <main className="flex-1 min-w-0 max-w-7xl xl:max-w-[1700px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* TAB 0: HOME - SLIDE DECKS LIST & TOOL SELECTOR */}
        {activeTab === 'home' && (
          <SlideDecksHome
            currentItems={items}
            currentConfig={config}
            activeSlideConfig={items[activeQuestionIndex]?.customConfig}
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
          isDeckSettingsOpen ? (
            <DeckSettingsPage
              onClose={() => setIsDeckSettingsOpen(false)}
              config={config}
              onApplyConfig={handleApplyDeckConfig}
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
          ) : (
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
                    {expandedSlides.length} slide{expandedSlides.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  {isEditingDeckName ? (
                    <input
                      autoFocus
                      value={deckNameDraft}
                      onChange={(e) => setDeckNameDraft(e.target.value)}
                      onBlur={commitDeckName}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitDeckName();
                        if (e.key === 'Escape') setIsEditingDeckName(false);
                      }}
                      className={`w-full max-w-md text-base sm:text-lg font-black tracking-tight rounded-lg px-2 py-1 border outline-none ${
                        isAppLight ? 'bg-white border-amber-300 text-slate-900' : 'bg-slate-950 border-amber-500/50 text-white'
                      }`}
                    />
                  ) : (
                    <h1 className={`text-base sm:text-lg font-black tracking-tight leading-tight truncate ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                      {config.deckName || 'Untitled Deck'}
                    </h1>
                  )}
                  <button
                    onClick={startEditingDeckName}
                    title="Rename deck"
                    className={`shrink-0 p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isAppLight ? 'text-slate-400 hover:text-amber-600 hover:bg-slate-100' : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'
                    }`}
                  >
                    <PenLine className="w-4 h-4" />
                  </button>
                </div>
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
                        <span>All Created Slides Deck ({expandedSlides.length})</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 font-mono border border-amber-500/30">
                          {items.length} Questions
                        </span>
                      </h2>
                      <div className="flex items-center gap-3 text-xs mt-1 flex-wrap">
                        <span className={isAppLight ? 'text-slate-600' : 'text-slate-400'}>
                          Subject: <strong className={isAppLight ? 'text-slate-900' : 'text-slate-200'}>{config.badgeTag || config.chapterName || config.headerTitle || 'Biology'}</strong>
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
                      Active Slide: #{selectedIndex + 1} of {expandedSlides.length}
                    </span>
                  </div>
                </div>

                {/* Slides Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {expandedSlides.map((ref) => {
                    const isSelected = ref.physicalIndex === selectedIndex;
                    return (
                      <div
                        key={`${ref.item.id}_${ref.physicalIndex}`}
                        onClick={() => {
                          setSelectedIndex(ref.physicalIndex);
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
                          {/* Card Header Bar: Slide number + Answer badge + Theme Indicator */}
                          <div className={`flex items-center justify-between gap-2 border-b pb-2 ${
                            isAppLight ? 'border-slate-200' : 'border-slate-800/80'
                          }`}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono ${
                                isSelected ? 'bg-amber-500 text-slate-950' : isAppLight ? 'bg-slate-100 text-slate-800 border' : 'bg-slate-800 text-amber-300'
                              }`}>
                                Slide #{ref.physicalIndex + 1} of {ref.totalSlides}
                              </span>
                              {ref.isAnswerSlide && (
                                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/40">
                                  Answer
                                </span>
                              )}
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
                            item={ref.item}
                            config={config}
                            index={ref.questionIndex}
                            totalCount={ref.totalQuestions}
                            isAnswerRevealMode={ref.isAnswerSlide || isAnswerRevealMode}
                            slideVariant={ref.isAnswerSlide ? 'answer' : 'question'}
                            className="group-hover:scale-[1.02] transition-transform"
                          />
                        </div>

                        {/* Action Link Footer */}
                        <div className={`pt-3 border-t flex items-center justify-between text-xs font-bold ${
                          isAppLight ? 'border-slate-200 text-amber-600' : 'border-slate-800/80 text-amber-400'
                        }`}>
                          <span>Select to Preview</span>
                          <span className="flex items-center gap-1 hover:translate-x-1 transition-transform">
                            Preview Slide #{ref.physicalIndex + 1} →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* TOOLBAR SUB-BAR: Preset Buttons, Theme Dropdown, Export Button */}
                <div className={`p-4 rounded-3xl border shadow-xl flex flex-wrap items-center justify-between gap-4 ${
                  isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800/80'
                }`}>
                  {/* Left: Quick Sample Buttons + Theme Selector */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => { handleLoadSample(0); setSelectedIndex(2); }}
                      className={`px-4 py-2 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isAppLight ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200' : 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-500" />
                      <span>Biology Sample</span>
                    </button>

                    <button
                      onClick={() => { handleLoadSample(1); setSelectedIndex(0); }}
                      className={`px-4 py-2 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isAppLight ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200' : 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-500" />
                      <span>Math/Physics Sample</span>
                    </button>

                    {/* Theme Selector Dropdown */}
                    <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border text-xs font-extrabold ${
                      isAppLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                    }`}>
                      <span className="text-amber-400">🌸</span>
                      <select
                        value={config.templateId || 'nobel-dark'}
                        onChange={(e) => setConfig(prev => ({ ...prev, templateId: e.target.value }))}
                        className="bg-transparent font-black focus:outline-none cursor-pointer"
                      >
                        {TEMPLATES.map((t) => (
                          <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Right: Export Slides Button */}
                  <button
                    onClick={() => {
                      setExportScope('all');
                      setIsExportModalOpen(true);
                    }}
                    disabled={items.length === 0}
                    className="px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer disabled:opacity-40"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Export Slides</span>
                  </button>
                </div>

                {/* SINGLE SLIDE PREVIEW & DECK MANAGER SIDE-BY-SIDE */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-10 items-start">
                  {/* LEFT: LIVE CANVAS DISPLAY */}
                  <div className={`flex flex-col gap-5 ${isTextBoxEditMode ? 'xl:col-span-8' : 'xl:col-span-7'}`}>
                    {/* Left Column Controls Bar: Slide Navigation + Hide Answer Key */}
                    <div className={`flex items-center justify-between p-3.5 rounded-2xl border shadow-md ${
                      isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800/80'
                    }`}>
                      {/* Left: Slide navigation < Slide 3 of 3 > */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedIndex(prev => Math.max(0, prev - 1))}
                          disabled={selectedIndex === 0 || expandedSlides.length === 0}
                          className="p-2 rounded-xl bg-slate-950 text-amber-400 hover:bg-slate-800 border border-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
                          title="Previous Slide"
                        >
                          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                        </button>
                        <span className="text-xs font-black px-3 font-mono">
                          Slide {expandedSlides.length > 0 ? selectedIndex + 1 : 0} of {expandedSlides.length}
                        </span>
                        <button
                          onClick={() => setSelectedIndex(prev => Math.min(expandedSlides.length - 1, prev + 1))}
                          disabled={selectedIndex >= expandedSlides.length - 1 || expandedSlides.length === 0}
                          className="p-2 rounded-xl bg-slate-950 text-amber-400 hover:bg-slate-800 border border-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
                          title="Next Slide"
                        >
                          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Right: Hide Answer Key toggle */}
                      <button
                        onClick={() => setIsAnswerRevealMode(prev => !prev)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                          isAnswerRevealMode
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : isAppLight
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                        }`}
                      >
                        {isAnswerRevealMode ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-amber-400" />}
                        <span>{isAnswerRevealMode ? 'Show Answer Key' : 'Hide Answer Key'}</span>
                      </button>
                    </div>

                  {/* Responsive Slide Canvas Preview — clean direct container for max width and size */}
                  <div className="relative w-full overflow-hidden flex items-center justify-center">
                    {expandedSlides.length === 0 ? (
                      <div className={`w-full text-center p-12 text-slate-400 space-y-4 rounded-3xl border ${
                        isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                      }`}>
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
                        className="w-full relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800/80 shadow-2xl flex justify-center items-start group"
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
                            currentIndex={activeQuestionIndex}
                            totalCount={items.length}
                            isAnswerRevealMode={isAnswerRevealMode}
                            slideVariant={activeSlideRef?.isAnswerSlide ? 'answer' : 'question'}
                          />
                          {isTextBoxEditMode && (
                            <SlideTextBoxOverlay
                              boxes={activeTextBoxes}
                              selectedId={selectedTextBoxId}
                              item={currentItem}
                              config={config}
                              currentIndex={activeQuestionIndex}
                              scale={slideScale}
                              onSelect={setSelectedTextBoxId}
                              onMove={(id, x, y) => updateSlideBox(id, { x, y })}
                              onResize={(id, patch) => updateSlideBox(id, patch)}
                            />
                          )}
                        </div>

                        {/* Hover Overlay Icon for Large Modal Preview */}
                        <button
                          onClick={() => setIsLargePreviewOpen(true)}
                          className="absolute top-4 right-4 z-30 p-3 rounded-2xl bg-slate-950/80 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/40 shadow-xl transition-all cursor-pointer opacity-70 group-hover:opacity-100 flex items-center gap-2 text-xs font-bold"
                          title="Open Large Slide Review Modal"
                        >
                          <Maximize2 className="w-4 h-4" />
                          <span>Review Large</span>
                        </button>
                      </div>
                    )}

                  </div>

                </div>

                {/* RIGHT COLUMN: Canva-style side panel while editing boxes, else the deck question list */}
                <div className={isTextBoxEditMode ? 'xl:col-span-4' : 'xl:col-span-4'}>
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
                        setSelectedIndex(questionSlideIndex(expandedSlides, idx));
                        setIsOverviewMode(false);
                      }}
                      selectedIndex={activeQuestionIndex}
                      appTheme={appTheme}
                      onEditQuestion={(item) => setEditingQuestion(item)}
                      onAddQuestions={() => setIsAddQuestionsOpen(true)}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        )
      )}

        {/* TAB 2: WORKSPACES — paste, review, and approve questions per project */}
        {activeTab === 'workspaces' && (
          activeWorkspaceId ? (
            <WorkspaceEditor
              workspaceId={activeWorkspaceId}
              onBack={() => setActiveWorkspaceId(null)}
              appTheme={appTheme}
            />
          ) : (
            <WorkspacesHome
              appTheme={appTheme}
              onOpenWorkspace={(id) => setActiveWorkspaceId(id)}
            />
          )
        )}

        {/* TAB 3: AI PDF & TEXT PARSER */}
        {activeTab === 'ai' && (
          <AIUploader
            onAddMCQs={handleAddMCQs}
            onReviewMCQs={handleReviewMCQs}
            onImportToQuestionBank={handleImportToQuestionBank}
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
            onAddQuestions={() => setIsAddQuestionsOpen(true)}
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
            onApplyTemplate={(preset) => handleApplyDeckConfig(applyDesignToConfig(preset, config))}
            onApplyConfig={handleApplyDeckConfig}
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
        currentSlideRef={exportDeckOverride ? null : activeSlideRef}
        slideRef={slideRef}
        appTheme={appTheme}
        scope={exportScope}
      />

      {/* Batch Deck Export Modal — sidebar "Export Slides": pick multiple decks → PPTX each */}
      <BatchExportModal
        isOpen={isBatchExportModalOpen}
        onClose={() => setIsBatchExportModalOpen(false)}
        seedConfig={config}
        appTheme={appTheme}
      />

      {/* Template Store Modal */}
      <TemplateLibraryModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        config={config}
        appTheme={appTheme}
        onApply={(preset) => handleApplyDeckConfig(applyDesignToConfig(preset, config))}
      />

      {/* Inline Question Edit Modal */}
      <EditQuestionModal
        isOpen={!!editingQuestion}
        onClose={() => {
          setEditingQuestion(null);
          setIsCreatingQuestion(false);
        }}
        item={editingQuestion}
        onSave={(updated) => {
          setItems(prev => {
            if (isCreatingQuestion) {
              // Append the brand-new question to the deck and jump to it.
              const added = ensureUniqueIds([...prev, updated]);
              return added;
            }
            return prev.map(q => (q.id === updated.id ? updated : q));
          });
          if (isCreatingQuestion) {
            setIsCreatingQuestion(false);
            setEditingQuestion(null);
            setActiveTab('preview');
            setSelectedIndex(items.length);
          }
        }}
        onSaveToQuestionBank={handleImportToQuestionBank}
        previousTags={items.length > 0 ? items[items.length - 1] : null}
        appTheme={appTheme}
      />

      {/* Add Questions chooser modal — 3 source cards (Bank / Manual / Form) */}
      <AddQuestionsModal
        isOpen={isAddQuestionsOpen}
        onClose={() => setIsAddQuestionsOpen(false)}
        onFromQuestionBank={handleFromQuestionBank}
        onFromManualEditor={handleFromManualEditor}
        onFromQuestionForm={handleFromQuestionForm}
        appTheme={appTheme}
      />

      {/* Onboarding Tour */}
      <OnboardingTour
        open={isTourOpen}
        onClose={handleCloseTour}
        onNavigate={(tab) => setActiveTab(tab)}
        onSetMobileDrawerOpen={(open) => setIsMobileDrawerOpen(open)}
        steps={defaultTourSteps}
      />

      {/* Large Slide Review Modal */}
      <SlidePreviewModal
        isOpen={isLargePreviewOpen}
        onClose={() => setIsLargePreviewOpen(false)}
        items={items}
        config={config}
        selectedIndex={selectedIndex}
        onSelectIndex={setSelectedIndex}
        isAnswerRevealMode={isAnswerRevealMode}
        onToggleAnswerReveal={() => setIsAnswerRevealMode(prev => !prev)}
        appTheme={appTheme}
      />

      {/* Layout Library Modal */}
      <LayoutLibraryModal
        isOpen={isLayoutModalOpen}
        onClose={() => setIsLayoutModalOpen(false)}
        onSelectLayout={addLayoutToDeck}
        appTheme={appTheme}
      />

      {/* Interactive Template Studio Modal (JSON Import/Export) */}
      <TemplateStudioModal
        isOpen={isTemplateStudioOpen}
        onClose={() => setIsTemplateStudioOpen(false)}
        config={config}
        onApplyTemplate={(templateId, customThemeOverride) => {
          handleApplyDeckConfig({
            ...config,
            templateId,
            customTheme: customThemeOverride || config.customTheme,
            accentColorCustom: customThemeOverride?.accentColor || config.accentColorCustom,
          });
        }}
        appTheme={appTheme}
      />

      {/* Answer Mode Settings Modal */}
      <AnswerModeModal
        isOpen={isAnswerModeModalOpen}
        onClose={() => setIsAnswerModeModalOpen(false)}
        config={config}
        activeSlideConfig={items[activeQuestionIndex]?.customConfig}
        onApplyConfig={handleApplyDeckConfig}
        onApplyActiveSlideConfig={(updatedOverride) => {
          if (items[activeQuestionIndex]) {
            setItems(prev => {
              const updated = [...prev];
              const cur = updated[activeQuestionIndex];
              if (!cur) return prev;
              updated[activeQuestionIndex] = {
                ...cur,
                customConfig: { ...(cur.customConfig || {}), ...updatedOverride },
              };
              return updated;
            });
          }
        }}
        totalQuestions={items.length}
        appTheme={appTheme}
      />

      {/* Save Current Design as Preset Modal */}
      <SavePresetModal
        isOpen={isSavePresetOpen}
        onClose={() => setIsSavePresetOpen(false)}
        config={config}
        activeSlideConfigOverride={items[selectedIndex]?.customConfig}
        appTheme={appTheme}
      />

      {/* AI Ingestion progress toast — bottom-right, survives tab changes */}
      <IngestionToast appTheme={appTheme} />
    </div>
    </IngestionProvider>
  );
}
