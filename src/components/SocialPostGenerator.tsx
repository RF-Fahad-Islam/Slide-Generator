import React, { useState, useRef, useEffect } from 'react';
import { MCQItem, DeckConfig, SlideTextBox, SlideTextBoxBind } from '../types';
import { MathText } from './MathText';
import {
  Share2,
  Download,
  CheckCircle2,
  Image as ImageIcon,
  Layers,
  PenTool,
  Eye,
  Sparkles,
  Sliders,
  Type,
  RefreshCw,
  User,
  BookOpen,
  Search,
  X,
  Upload,
  Smile,
  Check,
  Palette,
  LayoutTemplate,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { toPng } from 'html-to-image';
import { SlideTextBoxLayer } from './SlideTextBoxLayer';
import { SlideTextBoxOverlay } from './SlideTextBoxOverlay';
import { SlideTextBoxPanel } from './SlideTextBoxPanel';
import { SLIDE_ELEMENT_DEFS, SLIDE_LAYOUTS } from '../utils/slideElements';
import { PostTemplateSelector } from './social-post/PostTemplateSelector';
import { ClassicQuizCard } from './social-post/ClassicQuizCard';
import { QuizTimeCard } from './social-post/QuizTimeCard';
import { PostModeSelector, SocialPostMode } from './social-post/PostModeSelector';
import { PostTemplateId, ReactionEmojiSet, DEFAULT_REACTION_EMOJIS, REACTION_ORDER } from './social-post/types';

interface SocialPostGeneratorProps {
  items: MCQItem[];
  config: DeckConfig;
  appTheme: 'dark' | 'light';
  preselectedItemId?: string | null;
}

interface CustomPostDesign {
  bgImageUrl: string;
  boxes: SlideTextBox[];
}

const POST_DESIGN_HEIGHT = 1080;
const POST_DESIGN_WIDTH: Record<'1:1' | '4:5' | '9:16', number> = {
  '1:1': 1080,
  '4:5': 864,
  '9:16': 608,
};

const CUSTOM_DESIGN_STORAGE_KEY = 'social_post_custom_design_v1';

const pct = (v: number, size: number) => Math.max(0, Math.round((v / 100) * size));

const defaultCustomBoxes = (w: number, h: number): SlideTextBox[] => [
  { id: 'b_brand', bind: 'brand', x: pct(8, w), y: pct(6, h), w: pct(70, w), fontSize: pct(3.4, w), color: '#fbbf24', align: 'left', bold: true },
  { id: 'b_header', bind: 'headerTitle', x: pct(8, w), y: pct(12, h), w: pct(84, w), fontSize: pct(2.8, w), color: '#ffffff', align: 'left', bold: false },
  { id: 'b_stem', bind: 'stem', x: pct(8, w), y: pct(26, h), w: pct(84, w), fontSize: pct(4.2, w), color: '#ffffff', align: 'left', bold: true },
  { id: 'b_options', bind: 'options', x: pct(8, w), y: pct(56, h), w: pct(84, w), fontSize: pct(3, w), color: '#ffffff', align: 'left', bold: false },
  { id: 'b_footer', bind: 'footerTag', x: pct(8, w), y: pct(90, h), w: pct(60, w), fontSize: pct(2.4, w), color: '#fbbf24', align: 'left', bold: true },
];

interface StoredPostDesign {
  version?: number;
  bgImageUrl: string;
  boxes: SlideTextBox[];
}

const loadSavedDesign = (w: number, h: number): CustomPostDesign => {
  try {
    const raw = localStorage.getItem(CUSTOM_DESIGN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredPostDesign;
      if (parsed && Array.isArray(parsed.boxes)) {
        const isLegacy = parsed.version !== 2;
        const boxes: SlideTextBox[] = parsed.boxes
          .filter((b: any) => b && typeof b.x === 'number')
          .map((b: any): SlideTextBox => {
            if (!isLegacy) return b as SlideTextBox;
            return {
              id: b.id || `b_${b.bind}_${Date.now()}`,
              bind: (b.bind || 'free') as SlideTextBoxBind,
              text: b.bind === 'free' ? (b.text || 'Type your text here...') : undefined,
              x: pct(b.x, w),
              y: pct(b.y, h),
              w: pct(b.w, w),
              fontSize: Math.max(14, pct(b.fontSize, w)),
              color: b.color || '#ffffff',
              align: (b.align || 'left') as 'left' | 'center' | 'right',
              bold: !!b.bold,
            };
          });
        if (boxes.length > 0) {
          return { bgImageUrl: parsed.bgImageUrl || '', boxes };
        }
      }
    }
  } catch {
    // ignore corrupted storage
  }
  return { bgImageUrl: '', boxes: defaultCustomBoxes(w, h) };
};

export type StudioDrawerTab = 'templates' | 'content' | 'deck' | 'branding' | 'reactions' | 'theme' | 'layers';

export const SocialPostGenerator: React.FC<SocialPostGeneratorProps> = ({
  items,
  config,
  appTheme,
  preselectedItemId = null,
}) => {
  const isAppLight = appTheme === 'light';

  // Social Post State
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(
    items.length > 0 ? [items[0].id] : []
  );

  // Jump straight to a question shared from the Question Bank
  useEffect(() => {
    if (!preselectedItemId) return;
    const idx = items.findIndex(q => q.id === preselectedItemId);
    if (idx >= 0) {
      setSelectedQuestionIndex(idx);
      setSelectedItemIds([preselectedItemId]);
    }
  }, [preselectedItemId, items]);

  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '9:16'>('1:1');
  const [postTemplate, setPostTemplate] = useState<PostTemplateId>('classic');
  const [postBgColor, setPostBgColor] = useState<string>('gradient_amber');
  const [customHeaderTitle, setCustomHeaderTitle] = useState<string>('আজকের কুইজ');
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(true);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Editable Brand Name & Logo
  const [customBrandName, setCustomBrandName] = useState<string>(config.brandName || "NOBEL'S CLASSROOM");
  const [customLogoUrl, setCustomLogoUrl] = useState<string>(config.logoUrl || "");

  // "Quiz Time" reaction-post template state
  const [quizTitleText, setQuizTitleText] = useState<string>('Quiz Time');
  const [quizCtaText, setQuizCtaText] = useState<string>('React to give your answer!');
  const [quizSubCtaText, setQuizSubCtaText] = useState<string>('COMMENT YOUR ANSWER BELOW');
  const [reactionEmojis, setReactionEmojis] = useState<ReactionEmojiSet>(DEFAULT_REACTION_EMOJIS);

  // Custom Design Editor State
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [isBoxEditMode, setIsBoxEditMode] = useState<boolean>(false);
  const postDesignW = POST_DESIGN_WIDTH[aspectRatio];
  const postDesignH = POST_DESIGN_HEIGHT;
  const [customDesign, setCustomDesign] = useState<CustomPostDesign>(() =>
    loadSavedDesign(POST_DESIGN_WIDTH[aspectRatio], POST_DESIGN_HEIGHT)
  );
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [canvasWidth, setCanvasWidth] = useState<number>(500);

  // Studio Drawer Active Tab State (Full Left Drawer)
  const [activeTab, setActiveTab] = useState<StudioDrawerTab>('templates');

  // Auto-switch tabs when mode changes to ensure no orphaned tabs
  useEffect(() => {
    if (postTemplate === 'quiz_time' && !isCustomMode && activeTab === 'layers') {
      setActiveTab('reactions');
    } else if (postTemplate === 'classic' && !isCustomMode && (activeTab === 'reactions' || activeTab === 'layers')) {
      setActiveTab('content');
    } else if (isCustomMode && activeTab === 'reactions') {
      setActiveTab('layers');
    }
  }, [postTemplate, isCustomMode, activeTab]);

  const postCanvasRef = useRef<HTMLDivElement>(null);
  const postFrameRef = useRef<HTMLDivElement>(null);

  const currentItem = items[selectedQuestionIndex] || {
    id: 'sample',
    questionType: 'standard',
    stem: 'রুই মাছের হৃদপিণ্ডে কয়টি প্রকোষ্ঠ থাকে?',
    options: [
      { key: 'ক', text: '২টি' },
      { key: 'খ', text: '৪টি' },
      { key: 'গ', text: '৩টি' },
      { key: 'ঘ', text: '১টি' },
    ],
    answer: 'ক',
    explanation: 'রুই মাছের হৃদপিণ্ড দুই প্রকোষ্ঠ বিশিষ্ট (এক অলিন্দ ও এক নিলয়)।',
  };

  // Editable Question Stem & Options (A, B, C, D)
  const [customStem, setCustomStem] = useState<string>('');
  const [customOptions, setCustomOptions] = useState<{ key: string; text: string; isCorrect?: boolean }[]>([]);
  const [customAnswerKey, setCustomAnswerKey] = useState<string>('');

  useEffect(() => {
    const item = items[selectedQuestionIndex] || currentItem;
    setCustomStem(item.stem || '');
    setCustomOptions(
      (item.options || []).map((o, idx) => ({
        key: o.key || String.fromCharCode(65 + idx),
        text: o.text || '',
        isCorrect: !!o.isCorrect || (item.answer && o.key.toLowerCase() === item.answer.toLowerCase()),
      }))
    );
    setCustomAnswerKey(item.answer || 'ক');
  }, [selectedQuestionIndex, items]);

  const effectiveItem: MCQItem = {
    ...currentItem,
    stem: customStem !== undefined ? customStem : currentItem.stem,
    options: customOptions.length > 0 ? customOptions.map(o => ({ key: o.key, text: o.text, isCorrect: o.isCorrect })) : currentItem.options,
    answer: customAnswerKey || currentItem.answer,
  };

  // Measure canvas width (the actual card, not its wrapper, so the scale matches
  // the visible canvas even when the card is capped at a narrower max-width)
  useEffect(() => {
    const el = isCustomMode ? postCanvasRef.current : postFrameRef.current;
    if (!el) return;
    const update = () => setCanvasWidth(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isCustomMode, aspectRatio]);

  // Persist custom design
  useEffect(() => {
    try {
      const stored: StoredPostDesign = { version: 2, bgImageUrl: customDesign.bgImageUrl, boxes: customDesign.boxes };
      localStorage.setItem(CUSTOM_DESIGN_STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // ignore
    }
  }, [customDesign]);

  // Question picker filters
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [pickerSubject, setPickerSubject] = useState<string>('all');
  const [pickerBoard, setPickerBoard] = useState<string>('all');
  const [pickerType, setPickerType] = useState<string>('all');

  const updateBox = (id: string, patch: Partial<SlideTextBox>) => {
    setCustomDesign(prev => ({
      ...prev,
      boxes: prev.boxes.map(b => (b.id === id ? { ...b, ...patch } : b)),
    }));
  };

  const addBox = (bind: SlideTextBoxBind) => {
    const id = `b_${bind}_${Date.now()}`;
    const newBox: SlideTextBox = {
      id,
      bind,
      text: bind === 'free' ? 'Type your text here...' : undefined,
      x: pct(8, postDesignW),
      y: pct(40, postDesignH) + (customDesign.boxes.length % 4) * pct(12, postDesignH),
      w: pct(84, postDesignW),
      fontSize: bind === 'stem' ? pct(4.2, postDesignW) : bind === 'options' ? pct(3, postDesignW) : pct(3, postDesignW),
      color: '#ffffff',
      align: 'left',
      bold: bind === 'stem' || bind === 'brand',
    };
    setCustomDesign(prev => ({ ...prev, boxes: [...prev.boxes, newBox] }));
    setSelectedBoxId(id);
  };

  const addElement = (elementId: string, extra?: { imageUrl?: string; iconName?: string }) => {
    const def = SLIDE_ELEMENT_DEFS.find(d => d.id === elementId);
    if (!def) return;
    const built = def.build(extra);
    const scaleX = postDesignW / 1920;
    const scaleY = postDesignH / 1080;
    const scaled: SlideTextBox = {
      ...built,
      x: Math.round(built.x * scaleX),
      y: Math.round(built.y * scaleY),
      w: Math.round((built.w || 300) * scaleX),
      h: built.h ? Math.round(built.h * scaleY) : built.h,
      fontSize: Math.round(built.fontSize * scaleX),
    };
    setCustomDesign(prev => ({ ...prev, boxes: [...prev.boxes, scaled] }));
    setSelectedBoxId(scaled.id);
  };

  const addLayout = (layoutId: string) => {
    const def = SLIDE_LAYOUTS.find(l => l.id === layoutId);
    if (!def) return;
    const scaleX = postDesignW / 1920;
    const scaleY = postDesignH / 1080;
    const scaled: SlideTextBox[] = def.build().map(b => ({
      ...b,
      x: Math.round(b.x * scaleX),
      y: Math.round(b.y * scaleY),
      w: Math.round((b.w || 600) * scaleX),
      h: b.h ? Math.round(b.h * scaleY) : b.h,
      fontSize: Math.round(b.fontSize * scaleX),
    }));
    setCustomDesign(prev => ({ ...prev, boxes: scaled }));
    setSelectedBoxId(null);
  };

  const deleteBox = (id: string) => {
    setCustomDesign(prev => ({ ...prev, boxes: prev.boxes.filter(b => b.id !== id) }));
    setSelectedBoxId(prev => (prev === id ? null : prev));
  };

  const duplicateBox = (id: string) => {
    setCustomDesign(prev => {
      const src = prev.boxes.find(b => b.id === id);
      if (!src) return prev;
      const copy: SlideTextBox = { ...src, id: `b_${src.bind}_${Date.now()}`, y: Math.min(src.y + 5, postDesignH - 40) };
      return { ...prev, boxes: [...prev.boxes, copy] };
    });
  };

  const reorderBox = (id: string, dir: 'up' | 'down') => {
    setCustomDesign(prev => {
      const idx = prev.boxes.findIndex(b => b.id === id);
      if (idx < 0) return prev;
      const target = dir === 'up' ? idx + 1 : idx - 1;
      if (target < 0 || target >= prev.boxes.length) return prev;
      const boxes = [...prev.boxes];
      [boxes[idx], boxes[target]] = [boxes[target], boxes[idx]];
      return { ...prev, boxes };
    });
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setCustomDesign(prev => ({ ...prev, bgImageUrl: evt.target.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setCustomLogoUrl(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetDesign = () => {
    if (!window.confirm('Reset the custom design to its default layout? This clears your background image and all text boxes.')) return;
    setCustomDesign({ bgImageUrl: '', boxes: defaultCustomBoxes(postDesignW, postDesignH) });
    setSelectedBoxId(null);
  };

  const filteredPickerItems: { question: MCQItem; fullIndex: number }[] = items
    .map((q, idx) => ({ question: q, fullIndex: idx }))
    .filter(({ question }) => {
      if (pickerSearch.trim()) {
        const qText = (question.stem + ' ' + (question.passage || '') + ' ' + (question.source || '') + ' ' + (question.explanation || '') + ' ' + question.options.map(o => o.text).join(' ')).toLowerCase();
        if (!qText.includes(pickerSearch.toLowerCase().trim())) return false;
      }
      if (pickerSubject !== 'all') {
        if (!(question.source || '').toLowerCase().includes(pickerSubject.toLowerCase())) return false;
      }
      if (pickerBoard !== 'all') {
        if (!(question.source || '').toLowerCase().includes(pickerBoard.toLowerCase())) return false;
      }
      if (pickerType !== 'all') {
        if (question.questionType !== pickerType) return false;
      }
      return true;
    });

  const handleExportSinglePNG = async () => {
    if (!postCanvasRef.current) return;
    setIsExporting(true);

    const downloadDataUrl = (dataUrl: string) => {
      const link = document.createElement('a');
      link.download = `social_post_q${selectedQuestionIndex + 1}_${aspectRatio.replace(':', 'x')}.png`;
      link.href = dataUrl;
      link.click();
    };

    try {
      try {
        const canvas = await html2canvas(postCanvasRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
        });
        downloadDataUrl(canvas.toDataURL('image/png'));
      } catch (html2canvasErr) {
        console.warn('html2canvas failed, falling back to html-to-image:', html2canvasErr);
        const dataUrl = await toPng(postCanvasRef.current, {
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: null,
        });
        downloadDataUrl(dataUrl);
      }
    } catch (err) {
      console.error('Error exporting social post image:', err);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getBgStyle = () => {
    switch (postBgColor) {
      case 'gradient_amber':
        return 'bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/80 text-white';
      case 'gradient_blue':
        return 'bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white';
      case 'gradient_emerald':
        return 'bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 text-white';
      case 'clean_light':
        return 'bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50 text-slate-950';
      case 'pure_dark':
        return 'bg-slate-950 text-white';
      default:
        return 'bg-slate-900 text-white';
    }
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square max-w-[500px]';
      case '4:5':
        return 'aspect-[4/5] max-w-[450px]';
      case '9:16':
        return 'aspect-[9/16] max-w-[360px]';
      default:
        return 'aspect-square max-w-[500px]';
    }
  };

  // Dynamic drawer tabs based on active mode
  const drawerTabs: { id: StudioDrawerTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'templates', label: 'Preset', icon: LayoutTemplate },
    { id: 'content', label: 'Question', icon: Type },
    { id: 'deck', label: 'Deck MCQs', icon: BookOpen },
    { id: 'branding', label: 'Brand', icon: User },
    ...(postTemplate === 'quiz_time' && !isCustomMode
      ? [{ id: 'reactions' as StudioDrawerTab, label: 'Emojis', icon: Smile }]
      : []),
    { id: 'theme', label: 'Theme', icon: Palette },
    ...(isCustomMode
      ? [{ id: 'layers' as StudioDrawerTab, label: 'Boxes', icon: Layers }]
      : []),
  ];

  return (
    <div className="space-y-5 animate-fadeIn relative">
      {/* STUDIO TOP HEADER BAR (PAGE-FLAT PANEL) */}
      <div
        className={`p-4 lg:p-5 border rounded-3xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isAppLight
            ? 'bg-white/80 border-slate-200 shadow-sm'
            : 'bg-slate-900/60 border-slate-800/80 shadow-xl text-white'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25">
            <Share2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-lg lg:text-xl font-black ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                Social Post Studio
              </h2>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-black border ${
                isAppLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                PRO CANVAS
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Full-featured tool drawer on the left · Fixed live preview on the right
            </p>
          </div>
        </div>

        {/* Header Right Actions & Quick Format Selector */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Quick Format Pills */}
          <div className={`hidden md:flex items-center p-1 rounded-xl border ${isAppLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
            {[
              { id: '1:1', label: '1:1 Square' },
              { id: '4:5', label: '4:5 Feed' },
              { id: '9:16', label: '9:16 Story' },
            ].map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setAspectRatio(r.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  aspectRatio === r.id
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : isAppLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportSinglePNG}
            disabled={isExporting || items.length === 0}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer disabled:opacity-50 transition-all shrink-0"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>{isExporting ? 'Generating Image...' : 'Export Social Image'}</span>
          </button>
        </div>
      </div>

      {/* DEDICATED SOCIAL POST MODE SELECTOR (COLLAPSIBLE CARD STRIP) */}
      <PostModeSelector
        mode={isCustomMode ? 'custom' : postTemplate}
        isAppLight={isAppLight}
        onSelect={(m: SocialPostMode) => {
          if (m === 'custom') {
            setIsCustomMode(true);
            setIsBoxEditMode(true);
          } else {
            setPostTemplate(m);
            setIsCustomMode(false);
            setIsBoxEditMode(false);
          }
        }}
      />

      {/* 2-COLUMN STUDIO GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN (xl:col-span-5): FULL TOOL DRAWER / SIDEBAR (PAGE-FLAT)        */}
        {/* ========================================================================= */}
        <div className={`xl:col-span-5 border rounded-3xl overflow-hidden flex flex-col min-h-[640px] backdrop-blur-xl ${
          isAppLight
            ? 'bg-white/80 border-slate-200 shadow-sm'
            : 'bg-slate-900/60 border-slate-800/80 shadow-xl text-white'
        }`}>
          {/* Tool Drawer Header */}
          <div className={`p-4 border-b flex items-center justify-between ${
            isAppLight ? 'bg-slate-100/80 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-black">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-xs font-black uppercase tracking-wider ${isAppLight ? 'text-amber-600' : 'text-amber-400'}`}>
                  Design Tools
                </h3>
                <p className={`text-[11px] ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Active mode: <span className="font-bold text-amber-500">{isCustomMode ? 'Free-Form Drag & Drop' : postTemplate === 'quiz_time' ? 'Quiz Time Reactions' : 'Classic Quiz Card'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Tool Drawer Scrollable Tab Rail */}
          <div className={`flex items-center border-b p-2 gap-1 overflow-x-auto no-scrollbar ${
            isAppLight ? 'bg-slate-100/50 border-slate-200' : 'bg-slate-950/40 border-slate-800'
          }`}>
            {drawerTabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/40'
                      : isAppLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tool Drawer Body Content */}
          <div className="p-5 flex-1 overflow-y-auto space-y-5 max-h-[calc(100vh-16rem)]">
            {/* --------------------------------------------------------------------- */}
            {/* TAB 1: TEMPLATES & ASPECT RATIO                                       */}
            {/* --------------------------------------------------------------------- */}
            {activeTab === 'templates' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-1">
                  <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${isAppLight ? 'text-amber-600' : 'text-amber-400'}`}>
                    <LayoutTemplate className="w-4 h-4" />
                    1. Post Template Preset & Aspect Ratio
                  </h4>
                  <p className={`text-xs ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Choose a template layout preset or adjust post dimensions.
                  </p>
                </div>

                {!isCustomMode ? (
                  <PostTemplateSelector selected={postTemplate} onSelect={setPostTemplate} isAppLight={isAppLight} />
                ) : (
                  <div className={`p-4 rounded-2xl border space-y-2 ${
                    isAppLight ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}>
                    <p className="text-xs font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Custom Canvas Drag & Drop Mode Active</span>
                    </p>
                    <p className={`text-[11px] leading-relaxed ${isAppLight ? 'text-amber-800' : 'text-slate-300'}`}>
                      You are in free-form canvas mode. Add text boxes, custom images, and resize layers freely. Switch off Custom Mode in the mode strip to return to preset cards.
                    </p>
                  </div>
                )}

                {/* Aspect Ratio Selector */}
                <div className={`space-y-2 pt-3 border-t ${isAppLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <label className={`block text-xs font-bold ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Aspect Ratio (Post Dimension):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '1:1', name: '1:1 Square', desc: 'Instagram / FB Feed' },
                      { id: '4:5', name: '4:5 Portrait', desc: 'Vertical Mobile Feed' },
                      { id: '9:16', name: '9:16 Story', desc: 'Reels & Stories' },
                    ].map((ratio) => (
                      <button
                        key={ratio.id}
                        type="button"
                        onClick={() => setAspectRatio(ratio.id as any)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          aspectRatio === ratio.id
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-400/50 font-bold'
                            : isAppLight
                            ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="block text-xs font-black">{ratio.name}</span>
                        <span className={`block text-[10px] mt-0.5 ${
                          aspectRatio === ratio.id ? 'text-slate-900 font-bold' : isAppLight ? 'text-slate-500' : 'text-slate-500'
                        }`}>{ratio.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------------- */}
            {/* TAB 2: EDIT QUESTION & OPTIONS A–D                                    */}
            {/* --------------------------------------------------------------------- */}
            {activeTab === 'content' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-1">
                  <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${isAppLight ? 'text-amber-600' : 'text-amber-400'}`}>
                    <Type className="w-4 h-4" />
                    Question Stem & Options A, B, C, D
                  </h4>
                  <p className={`text-xs ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Live editable inputs — changes render immediately on the right preview.
                  </p>
                </div>

                {/* Question Stem */}
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Question Stem Text (LaTeX & Bangla aware):
                  </label>
                  <textarea
                    value={customStem}
                    onChange={(e) => setCustomStem(e.target.value)}
                    rows={3}
                    className={`w-full border rounded-xl px-4 py-3 text-xs font-bold focus:border-amber-500 focus:outline-none leading-relaxed ${
                      isAppLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                {/* Options A, B, C, D */}
                <div className="space-y-3">
                  <label className={`block text-xs font-bold ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Options A / B / C / D Text & Correct Answer Mark:
                  </label>
                  {customOptions.map((opt, idx) => {
                    const isCorr = opt.isCorrect || customAnswerKey.toLowerCase() === opt.key.toLowerCase();
                    return (
                      <div key={idx} className={`p-3 rounded-2xl border space-y-2 ${
                        isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-black flex items-center gap-1.5 ${isAppLight ? 'text-amber-700' : 'text-amber-400'}`}>
                            <span className="w-5 h-5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                              {opt.key || String.fromCharCode(65 + idx)}
                            </span>
                            <span>Option {opt.key || String.fromCharCode(65 + idx)}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomAnswerKey(opt.key);
                              setCustomOptions(prev => prev.map((o, i) => ({ ...o, isCorrect: i === idx })));
                            }}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer flex items-center gap-1 ${
                              isCorr
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                                : isAppLight
                                ? 'bg-white text-slate-600 border-slate-300 hover:text-slate-900'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            {isCorr && <Check className="w-3 h-3 stroke-[3]" />}
                            <span>{isCorr ? '✓ Correct' : 'Mark Correct'}</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomOptions(prev => prev.map((o, i) => i === idx ? { ...o, text: val } : o));
                          }}
                          className={`w-full border rounded-xl px-3 py-2 text-xs font-bold focus:border-amber-500 focus:outline-none ${
                            isAppLight
                              ? 'bg-white border-slate-300 text-slate-900'
                              : 'bg-slate-900 border-slate-800 text-white'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Display Toggles (Mode-specific) */}
                <div className={`pt-3 border-t space-y-2 ${isAppLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <label className={`block text-xs font-bold ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Card Display Options:
                  </label>
                  <div className={`flex items-center justify-between p-3 rounded-xl border ${
                    isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <span className={`text-xs font-bold ${isAppLight ? 'text-slate-800' : 'text-slate-300'}`}>Highlight Correct Answer on Card</span>
                    <button
                      type="button"
                      onClick={() => setShowAnswerKey(v => !v)}
                      className={`px-3 py-1 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                        showAnswerKey
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : isAppLight
                          ? 'bg-white text-slate-600 border-slate-300'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {showAnswerKey ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Show Explanation toggle ONLY for Classic Quiz Card mode */}
                  {postTemplate === 'classic' && !isCustomMode && (
                    <div className={`flex items-center justify-between p-3 rounded-xl border ${
                      isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                    }`}>
                      <span className={`text-xs font-bold ${isAppLight ? 'text-slate-800' : 'text-slate-300'}`}>Show Explanation Box</span>
                      <button
                        type="button"
                        onClick={() => setShowExplanation(v => !v)}
                        className={`px-3 py-1 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                          showExplanation
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : isAppLight
                            ? 'bg-white text-slate-600 border-slate-300'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {showExplanation ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------------- */}
            {/* TAB 3: CHOOSE FROM DECK                                               */}
            {/* --------------------------------------------------------------------- */}
            {activeTab === 'deck' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-1">
                  <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${isAppLight ? 'text-amber-600' : 'text-amber-400'}`}>
                    <BookOpen className="w-4 h-4" />
                    Select Question From Active Deck ({filteredPickerItems.length} / {items.length})
                  </h4>
                  <p className={`text-xs ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Click any question to load its stem and options into the social post.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Search stems, options, topics..."
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-amber-500 ${
                      isAppLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                        : 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                    }`}
                  />
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {filteredPickerItems.map(({ question: q, fullIndex }) => {
                    const isSelected = fullIndex === selectedQuestionIndex;
                    return (
                      <button
                        key={q.id || fullIndex}
                        type="button"
                        onClick={() => setSelectedQuestionIndex(fullIndex)}
                        className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 text-xs cursor-pointer ${
                          isSelected
                            ? isAppLight
                              ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold shadow-sm'
                              : 'bg-amber-500/15 border-amber-400 text-amber-300 font-bold shadow-md'
                            : isAppLight
                            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <span className="truncate font-semibold flex-1">
                          #{fullIndex + 1}. <MathText text={q.stem} />
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------------- */}
            {/* TAB 4: BRANDING & LOGO                                                */}
            {/* --------------------------------------------------------------------- */}
            {activeTab === 'branding' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-1">
                  <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${isAppLight ? 'text-amber-600' : 'text-amber-400'}`}>
                    <User className="w-4 h-4" />
                    Brand Identity & Header Logo
                  </h4>
                  <p className={`text-xs ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Customize your channel brand name, header title, and custom logo image.
                  </p>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Brand Name / Channel Name:
                  </label>
                  <input
                    type="text"
                    value={customBrandName}
                    onChange={(e) => setCustomBrandName(e.target.value)}
                    placeholder="e.g. Nobel's Classroom / SSC Science Studio"
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs font-bold focus:border-amber-500 focus:outline-none ${
                      isAppLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Brand Logo Image:
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {customLogoUrl ? (
                        <div className="relative shrink-0">
                          <img src={customLogoUrl} alt="Logo" className="w-14 h-14 rounded-2xl object-contain border border-amber-400 bg-black/40 p-1" />
                          <button
                            type="button"
                            onClick={() => setCustomLogoUrl('')}
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white text-xs font-black flex items-center justify-center shadow cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-500 font-black text-lg flex items-center justify-center shrink-0">
                          {customBrandName ? customBrandName.charAt(0).toUpperCase() : 'B'}
                        </div>
                      )}
                      <label className="flex-1 px-4 py-3 rounded-xl text-xs font-black cursor-pointer flex items-center justify-center gap-2 border bg-amber-500 text-slate-950 border-amber-400 shadow-md hover:brightness-110 transition-all">
                        <Upload className="w-4 h-4 stroke-[2.5]" />
                        <span>Upload Logo File</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                    </div>

                    <input
                      type="text"
                      value={customLogoUrl.startsWith('data:') ? '' : customLogoUrl}
                      onChange={(e) => setCustomLogoUrl(e.target.value)}
                      placeholder="...or paste image URL"
                      className={`w-full border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-500 ${
                        isAppLight
                          ? 'bg-slate-50 border-slate-300 text-slate-800'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Header Subtitle / Wordmark Title:
                  </label>
                  <input
                    type="text"
                    value={postTemplate === 'quiz_time' ? quizTitleText : customHeaderTitle}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomHeaderTitle(val);
                      setQuizTitleText(val);
                    }}
                    placeholder="e.g. Quiz Time / আজকের কুইজ"
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs font-bold focus:border-amber-500 focus:outline-none ${
                      isAppLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------------- */}
            {/* TAB 5: QUIZ TIME REACTION EMOJIS (Shown in Quiz Time mode)           */}
            {/* --------------------------------------------------------------------- */}
            {activeTab === 'reactions' && postTemplate === 'quiz_time' && !isCustomMode && (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-1">
                  <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${isAppLight ? 'text-amber-600' : 'text-amber-400'}`}>
                    <Smile className="w-4 h-4" />
                    Quiz Time Reaction Grid Settings
                  </h4>
                  <p className={`text-xs ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Customize titles and 4 reaction emojis for the Quiz Time template card.
                  </p>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Wordmark Header Title:
                  </label>
                  <input
                    type="text"
                    value={quizTitleText}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuizTitleText(val);
                      setCustomHeaderTitle(val);
                    }}
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs font-bold focus:border-amber-500 focus:outline-none ${
                      isAppLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Reaction Call-To-Action:
                  </label>
                  <input
                    type="text"
                    value={quizCtaText}
                    onChange={(e) => setQuizCtaText(e.target.value)}
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs font-bold focus:border-amber-500 focus:outline-none ${
                      isAppLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Comment Prompt Footer:
                  </label>
                  <input
                    type="text"
                    value={quizSubCtaText}
                    onChange={(e) => setQuizSubCtaText(e.target.value)}
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs font-bold focus:border-amber-500 focus:outline-none ${
                      isAppLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-2 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Reaction Emojis for Options A / B / C / D:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {REACTION_ORDER.map((letter) => (
                      <div key={letter} className="text-center space-y-1">
                        <span className={`text-[10px] font-mono uppercase font-black ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Option {letter}</span>
                        <input
                          type="text"
                          value={reactionEmojis[letter]}
                          onChange={(e) => setReactionEmojis(prev => ({ ...prev, [letter]: e.target.value }))}
                          className={`w-full text-center border rounded-xl px-2 py-2 text-lg focus:border-amber-500 focus:outline-none ${
                            isAppLight
                              ? 'bg-slate-50 border-slate-300 text-slate-900'
                              : 'bg-slate-950 border-slate-800 text-white'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------------- */}
            {/* TAB 6: THEME & BACKGROUND GRADIENTS                                   */}
            {/* --------------------------------------------------------------------- */}
            {activeTab === 'theme' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-1">
                  <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${isAppLight ? 'text-amber-600' : 'text-amber-400'}`}>
                    <Palette className="w-4 h-4" />
                    Background Theme & Custom Image
                  </h4>
                  <p className={`text-xs ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Pick background color presets or upload custom background graphics.
                  </p>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-2 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Background Color Presets:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'gradient_amber', name: 'Midnight Gold', desc: 'Dark Amber Sweep' },
                      { id: 'gradient_blue', name: 'Cyber Blue', desc: 'Deep Royal Blue' },
                      { id: 'gradient_emerald', name: 'Forest Emerald', desc: 'Emerald Teal' },
                      { id: 'clean_light', name: 'Warm Light', desc: 'Bright Clean Light' },
                      { id: 'pure_dark', name: 'Pure Dark', desc: 'Deep Obsidian' },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setPostBgColor(b.id);
                          setCustomDesign(prev => ({ ...prev, bgImageUrl: '' }));
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          postBgColor === b.id && !customDesign.bgImageUrl
                            ? isAppLight
                              ? 'bg-amber-100 text-amber-900 border-amber-400 ring-2 ring-amber-400/40 font-bold'
                              : 'bg-amber-500/20 text-amber-300 border-amber-400 ring-2 ring-amber-400/40 font-bold'
                            : isAppLight
                            ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="block text-xs font-black">{b.name}</span>
                        <span className={`block text-[10px] mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>{b.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`pt-3 border-t space-y-3 ${isAppLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <div className="flex items-center justify-between">
                    <label className={`block text-xs font-bold ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Upload Custom Background Image:
                    </label>
                    {customDesign.bgImageUrl && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        ✓ Custom Image Active
                      </span>
                    )}
                  </div>

                  {customDesign.bgImageUrl ? (
                    <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                      isAppLight ? 'bg-amber-50 border-amber-300' : 'bg-slate-950 border-amber-500/40'
                    }`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={customDesign.bgImageUrl} alt="Custom Background" className="w-12 h-12 rounded-xl object-cover border border-amber-400 shrink-0" />
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isAppLight ? 'text-slate-900' : 'text-white'}`}>Custom BG Graphic</p>
                          <p className={`text-[10px] ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>Applied live to card</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCustomDesign(prev => ({ ...prev, bgImageUrl: '' }))}
                        className="px-3 py-1.5 rounded-xl text-xs font-black text-rose-500 border border-rose-300 bg-rose-50 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 cursor-pointer shrink-0"
                      >
                        Clear Image
                      </button>
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    <label className="w-full px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer flex items-center justify-center gap-2 border bg-amber-500 text-slate-950 border-amber-400 shadow-md hover:brightness-110 transition-all">
                      <Upload className="w-4 h-4 stroke-[2.5]" />
                      <span>Upload Custom BG Image File</span>
                      <input type="file" accept="image/*" onChange={handleCustomBgUpload} className="hidden" />
                    </label>

                    <input
                      type="text"
                      value={customDesign.bgImageUrl.startsWith('data:') ? '' : customDesign.bgImageUrl}
                      onChange={(e) => setCustomDesign(prev => ({ ...prev, bgImageUrl: e.target.value }))}
                      placeholder="...or paste background image URL"
                      className={`w-full border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-500 ${
                        isAppLight
                          ? 'bg-slate-50 border-slate-300 text-slate-800'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* --------------------------------------------------------------------- */}
            {/* TAB 7: LAYERS & TEXT BOXES (Shown in Custom Drag & Drop mode)          */}
            {/* --------------------------------------------------------------------- */}
            {activeTab === 'layers' && isCustomMode && (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-1">
                  <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${isAppLight ? 'text-amber-600' : 'text-amber-400'}`}>
                    <Layers className="w-4 h-4" />
                    Layer & Text Box Controls
                  </h4>
                  <p className={`text-xs ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Add custom text boxes, logos, and adjust layer ordering.
                  </p>
                </div>

                <SlideTextBoxPanel
                  boxes={customDesign.boxes}
                  selectedId={selectedBoxId}
                  appTheme={appTheme}
                  config={{ ...config, brandName: customBrandName, logoUrl: customLogoUrl, headerTitle: customHeaderTitle }}
                  textBoxScope="global"
                  hasTextBoxOverride={false}
                  onChangeTextBoxScope={() => {}}
                  onRevertTextBoxOverride={() => {}}
                  onApplySlideLayoutToAll={() => {}}
                  onAddBox={addBox}
                  onAddElement={addElement}
                  onAddLayout={addLayout}
                  onUpdateBox={updateBox}
                  onDeleteBox={deleteBox}
                  onDuplicateBox={duplicateBox}
                  onReorderBox={reorderBox}
                  onSelectBox={setSelectedBoxId}
                  onReset={resetDesign}
                  onClearAll={() => setCustomDesign(prev => ({ ...prev, boxes: [] }))}
                  onClose={() => setActiveTab('templates')}
                />
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN (xl:col-span-7): FIXED / STICKY LIVE CANVAS PREVIEW         */}
        {/* ========================================================================= */}
        <div className="xl:col-span-7 flex flex-col items-center justify-start space-y-4 xl:sticky xl:top-20">
          {/* Canvas Top Bar */}
          <div className="flex items-center justify-between w-full max-w-[500px] px-1">
            <span className={`text-xs font-bold flex items-center gap-1.5 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Live Social Canvas ({aspectRatio})</span>
            </span>

            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                isAppLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}>
                {postDesignW}×{postDesignH}px
              </span>

              {isCustomMode && (
                <button
                  type="button"
                  onClick={() => setIsBoxEditMode(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                    isBoxEditMode
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : isAppLight
                      ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  {isBoxEditMode ? <Eye className="w-3 h-3" /> : <PenTool className="w-3 h-3" />}
                  {isBoxEditMode ? 'Preview Mode' : 'Edit Box Handles'}
                </button>
              )}
            </div>
          </div>

          {/* Live Scaled Canvas Card Container */}
          <div className="w-full max-w-[500px] relative">
            {!isCustomMode ? (
              postTemplate === 'quiz_time' ? (
                <QuizTimeCard
                  ref={postCanvasRef}
                  item={effectiveItem}
                  aspectClass={getAspectClass()}
                  bgStyle={getBgStyle()}
                  customBgImageUrl={customDesign.bgImageUrl}
                  brandName={customBrandName}
                  logoUrl={customLogoUrl}
                  titleText={quizTitleText}
                  ctaText={quizCtaText}
                  subCtaText={quizSubCtaText}
                  showAnswerKey={showAnswerKey}
                  reactionEmojis={reactionEmojis}
                  fontFamily={config.fontFamily}
                  customStem={customStem}
                  customOptions={customOptions}
                />
              ) : (
                <ClassicQuizCard
                  ref={postCanvasRef}
                  item={effectiveItem}
                  config={{ ...config, brandName: customBrandName, logoUrl: customLogoUrl }}
                  customHeaderTitle={customHeaderTitle}
                  questionNumber={selectedQuestionIndex + 1}
                  aspectClass={getAspectClass()}
                  bgStyle={getBgStyle()}
                  customBgImageUrl={customDesign.bgImageUrl}
                  showAnswerKey={showAnswerKey}
                  showExplanation={showExplanation}
                  brandName={customBrandName}
                  logoUrl={customLogoUrl}
                  customStem={customStem}
                  customOptions={customOptions}
                />
              )
            ) : (
              <div className="space-y-4">
                <div className="relative" ref={postFrameRef}>
                  <div
                    style={{
                      fontFamily: config.fontFamily || "'Kalpurush', serif",
                      ...(customDesign.bgImageUrl
                        ? {
                            backgroundImage: `url("${customDesign.bgImageUrl}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                          }
                        : {}),
                    }}
                    className={`w-full mx-auto ${getAspectClass()} ${customDesign.bgImageUrl ? 'bg-slate-900' : getBgStyle()} rounded-3xl border border-slate-700/80 shadow-2xl relative overflow-hidden select-none`}
                    ref={postCanvasRef}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: postDesignW,
                        height: postDesignH,
                        transform: `scale(${canvasWidth > 0 ? canvasWidth / postDesignW : 1})`,
                        transformOrigin: 'top left',
                      }}
                    >
                      <SlideTextBoxLayer
                        boxes={customDesign.boxes}
                        item={effectiveItem}
                        config={{ ...config, brandName: customBrandName, logoUrl: customLogoUrl, headerTitle: customHeaderTitle }}
                        currentIndex={selectedQuestionIndex}
                        showAnswerHighlight={showAnswerKey}
                      />

                      {isBoxEditMode && (
                        <SlideTextBoxOverlay
                          boxes={customDesign.boxes}
                          selectedId={selectedBoxId}
                          item={effectiveItem}
                          config={{ ...config, brandName: customBrandName, logoUrl: customLogoUrl, headerTitle: customHeaderTitle }}
                          currentIndex={selectedQuestionIndex}
                          scale={canvasWidth > 0 ? canvasWidth / postDesignW : 1}
                          onSelect={setSelectedBoxId}
                          onMove={(id, x, y) => updateBox(id, { x, y })}
                          onResize={(id, patch) => updateBox(id, patch)}
                          designW={postDesignW}
                          designH={postDesignH}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
