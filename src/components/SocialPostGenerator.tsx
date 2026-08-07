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
  Smartphone,
  Square,
  Maximize,
  Sliders,
  Type,
  RefreshCw,
  User,
  BookOpen,
  Search,
  Filter,
  Landmark,
  LayoutGrid,
  X,
  Upload,
  Smile,
  Check,
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

  // Canva-Style Studio Right Drawer State
  const [isCanvaDrawerOpen, setIsCanvaDrawerOpen] = useState<boolean>(false);
  const [canvaTab, setCanvaTab] = useState<'branding' | 'content' | 'reactions' | 'layers' | 'background'>('content');

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

  // Measure canvas width
  useEffect(() => {
    const el = postFrameRef.current;
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

  return (
    <div className="space-y-8 animate-fadeIn relative">
      {/* Top Banner */}
      <div
        className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-6 lg:p-8 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ${
          isAppLight
            ? 'border-slate-200'
            : 'bg-slate-900/80 border-white/10 text-white shadow-2xl'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25">
            <Share2 className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <h2 className={`text-xl lg:text-2xl font-black flex items-center gap-2 ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
              <span>Social Media Post Studio</span>
              <span className="text-xs px-3 py-1 rounded-full font-mono font-black border bg-amber-500/20 text-amber-300 border-amber-500/30">
                Canva Mode · Fully Editable
              </span>
            </h2>
            <p className={`text-xs mt-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Create & edit custom brand logos, stem text, options A–D, emojis, and Canva-style layouts!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCanvaDrawerOpen(prev => !prev)}
            className="px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/40 font-black text-sm flex items-center gap-2.5 shadow-lg shadow-amber-500/10 cursor-pointer transition-all shrink-0"
          >
            <Sliders className="w-5 h-5 text-amber-400" />
            <span>{isCanvaDrawerOpen ? 'Close Canva Drawer' : '🎨 Canva Studio Drawer'}</span>
          </button>

          <button
            onClick={handleExportSinglePNG}
            disabled={isExporting || items.length === 0}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-slate-950 font-black text-sm flex items-center gap-2.5 shadow-lg shadow-amber-500/25 cursor-pointer disabled:opacity-50 transition-all shrink-0"
          >
            {isExporting ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5 stroke-[2.5]" />
            )}
            <span>{isExporting ? 'Generating Image...' : 'Download Social Image'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT 5 COLUMNS: EDITABLE CONTROLS */}
        <div className="xl:col-span-5 space-y-6">
          {/* Custom Mode Switch Card */}
          <div
            className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-6 border space-y-4 ${
              isAppLight ? 'border-slate-200' : 'bg-slate-900/80 border-white/10'
            }`}
          >
            <label className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-amber-400">
              <Layers className="w-4 h-4" />
              0. Custom Layout Mode
            </label>
            <div className={`flex items-center justify-between gap-4 p-4 rounded-2xl border ${
              isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="space-y-1">
                <p className={`text-sm font-extrabold ${isAppLight ? 'text-slate-800' : 'text-slate-100'}`}>
                  Canva Drag & Drop Mode
                </p>
                <p className={`text-xs leading-relaxed ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Enable free-form text boxes, custom images & drag-and-drop layer position control.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomMode(v => !v)}
                className={`px-4 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                  isCustomMode
                    ? 'bg-amber-500 text-slate-950 shadow-lg ring-2 ring-amber-400/50'
                    : isAppLight
                    ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {isCustomMode ? '🎨 Custom Mode ON' : 'Enable Custom Mode'}
              </button>
            </div>
          </div>

          {/* Template Picker */}
          {!isCustomMode && (
            <PostTemplateSelector selected={postTemplate} onSelect={setPostTemplate} isAppLight={isAppLight} />
          )}

          {/* Editable Brand Logo & Brand Name */}
          <div
            className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-6 border space-y-4 ${
              isAppLight ? 'border-slate-200' : 'bg-slate-900/80 border-white/10'
            }`}
          >
            <label className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-amber-400">
              <User className="w-4 h-4" />
              1. Brand Name & Custom Logo
            </label>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 mb-1">
                  Brand Name Text:
                </label>
                <input
                  type="text"
                  value={customBrandName}
                  onChange={(e) => setCustomBrandName(e.target.value)}
                  placeholder="e.g. Physics Plus / Nobel's Classroom"
                  className="w-full border rounded-xl px-4 py-3 text-xs font-bold bg-slate-950 border-slate-800 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 mb-1">
                  Brand Logo Image:
                </label>
                <div className="flex items-center gap-3">
                  {customLogoUrl ? (
                    <div className="relative shrink-0">
                      <img src={customLogoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-cover border border-amber-400 bg-black/40 p-1" />
                      <button
                        type="button"
                        onClick={() => setCustomLogoUrl('')}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white text-xs font-black flex items-center justify-center shadow"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black text-sm flex items-center justify-center shrink-0">
                      {customBrandName ? customBrandName.charAt(0).toUpperCase() : 'B'}
                    </div>
                  )}

                  <div className="flex-1 flex flex-col gap-2">
                    <label className="px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer flex items-center justify-center gap-2 border bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 transition-all">
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>Upload Logo File</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                    <input
                      type="text"
                      value={customLogoUrl.startsWith('data:') ? '' : customLogoUrl}
                      onChange={(e) => setCustomLogoUrl(e.target.value)}
                      placeholder="...or paste image URL"
                      className="w-full border rounded-xl px-3 py-1.5 text-xs font-mono bg-slate-950 border-slate-800 text-slate-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Editable Question Stem & Options A, B, C, D */}
          <div
            className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-6 border space-y-4 ${
              isAppLight ? 'border-slate-200' : 'bg-slate-900/80 border-white/10'
            }`}
          >
            <label className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-amber-400">
              <Type className="w-4 h-4" />
              2. Edit Question & Options A, B, C, D
            </label>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 mb-1">
                  Question Stem:
                </label>
                <textarea
                  value={customStem}
                  onChange={(e) => setCustomStem(e.target.value)}
                  rows={2}
                  className="w-full border rounded-xl px-4 py-2.5 text-xs font-bold bg-slate-950 border-slate-800 text-white focus:border-amber-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 mb-2">
                  Options A / B / C / D (Live Editable):
                </label>
                <div className="space-y-2">
                  {customOptions.map((opt, idx) => {
                    const isCorr = opt.isCorrect || customAnswerKey.toLowerCase() === opt.key.toLowerCase();
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow">
                          {opt.key || String.fromCharCode(65 + idx)}
                        </span>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomOptions(prev => prev.map((o, i) => i === idx ? { ...o, text: val } : o));
                          }}
                          className="flex-1 border rounded-xl px-3 py-2 text-xs font-bold bg-slate-950 border-slate-800 text-white focus:border-amber-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCustomAnswerKey(opt.key);
                            setCustomOptions(prev => prev.map((o, i) => ({ ...o, isCorrect: i === idx })));
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-extrabold border flex items-center gap-1 transition-all cursor-pointer ${
                            isCorr
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-md'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {isCorr && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          <span>Correct</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Question Selector */}
          <div
            className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-6 border space-y-4 ${
              isAppLight ? 'border-slate-200' : 'bg-slate-900/80 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-amber-400">
                <BookOpen className="w-5 h-5" />
                3. Choose From Deck ({filteredPickerItems.length} / {items.length})
              </label>
            </div>

            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search questions in this deck..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {filteredPickerItems.map(({ question: q, fullIndex }) => {
                const isSelected = fullIndex === selectedQuestionIndex;
                return (
                  <button
                    key={q.id || fullIndex}
                    type="button"
                    onClick={() => setSelectedQuestionIndex(fullIndex)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 text-sm ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-bold shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span className="truncate font-semibold">
                      #{fullIndex + 1}. <MathText text={q.stem} />
                    </span>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT 7 COLUMNS: LIVE CANVAS PREVIEW & CANVA DRAWER TOGGLE */}
        <div className="xl:col-span-7 flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center justify-between w-full max-w-[500px]">
            <span className="text-xs font-bold flex items-center gap-1.5 text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Live Social Canvas ({aspectRatio})</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCanvaDrawerOpen(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Open Canva Drawer</span>
              </button>

              {isCustomMode && (
                <button
                  type="button"
                  onClick={() => setIsBoxEditMode(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                    isBoxEditMode
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  {isBoxEditMode ? <Eye className="w-3 h-3" /> : <PenTool className="w-3 h-3" />}
                  {isBoxEditMode ? 'Preview' : 'Edit Boxes'}
                </button>
              )}
            </div>
          </div>

          {/* Live Scaled Canvas Card */}
          <div className="w-full max-w-[500px] relative">
            {!isCustomMode ? (
              postTemplate === 'quiz_time' ? (
                <QuizTimeCard
                  ref={postCanvasRef}
                  item={effectiveItem}
                  aspectClass={getAspectClass()}
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
                    </div>
                  </div>

                  {isBoxEditMode && (
                    <div className="absolute inset-0 z-20">
                      <SlideTextBoxOverlay
                        boxes={customDesign.boxes}
                        selectedId={selectedBoxId}
                        item={effectiveItem}
                        config={{ ...config, brandName: customBrandName, logoUrl: customLogoUrl, headerTitle: customHeaderTitle }}
                        currentIndex={selectedQuestionIndex}
                        scale={canvasWidth > 0 ? postDesignW / canvasWidth : 1}
                        onSelect={setSelectedBoxId}
                        onMove={(id, x, y) => updateBox(id, { x, y })}
                        onResize={(id, patch) => updateBox(id, patch)}
                        designW={postDesignW}
                        designH={postDesignH}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CANVA-STYLE COLLAPSIBLE RIGHT STUDIO PANEL (NON-MODAL) */}
      {isCanvaDrawerOpen && (
        <div className="fixed right-4 top-24 bottom-6 w-[430px] max-w-[92vw] z-40 bg-slate-950/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl flex flex-col animate-slideInRight pointer-events-auto overflow-hidden">
          {/* Panel Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Canva Studio Panel</h3>
                <p className="text-[11px] text-slate-400">Live edit options A–D, brand & layout</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCanvaDrawerOpen(false)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-all cursor-pointer"
              title="Collapse Side Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

            {/* Tab Navigation */}
            <div className="flex items-center border-b border-white/10 p-2 gap-1 overflow-x-auto bg-slate-900/50">
              {[
                { id: 'branding', label: 'Brand', icon: User },
                { id: 'content', label: 'Question', icon: Type },
                { id: 'reactions', label: 'Emojis', icon: Smile },
                { id: 'background', label: 'Theme', icon: Sliders },
                { id: 'layers', label: 'Boxes', icon: Layers },
              ].map((t) => {
                const Icon = t.icon;
                const isActive = canvaTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setCanvaTab(t.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* TAB 1: BRANDING */}
              {canvaTab === 'branding' && (
                <div className="space-y-5">
                  <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">
                    Brand Logo & Name Settings
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Brand Name:
                    </label>
                    <input
                      type="text"
                      value={customBrandName}
                      onChange={(e) => setCustomBrandName(e.target.value)}
                      className="w-full border rounded-xl px-4 py-3 text-xs font-bold bg-slate-900 border-slate-800 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Brand Logo Image:
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        {customLogoUrl ? (
                          <img src={customLogoUrl} alt="Logo" className="w-14 h-14 rounded-2xl object-cover border border-amber-400 bg-black/40 p-1" />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black text-lg flex items-center justify-center">
                            {customBrandName ? customBrandName.charAt(0).toUpperCase() : 'B'}
                          </div>
                        )}
                        <label className="px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer flex items-center gap-2 border bg-amber-500 text-slate-950 border-amber-400 shadow-md hover:brightness-110 transition-all">
                          <Upload className="w-4 h-4 stroke-[2.5]" />
                          <span>Upload Image File</span>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                      </div>

                      <input
                        type="text"
                        value={customLogoUrl.startsWith('data:') ? '' : customLogoUrl}
                        onChange={(e) => setCustomLogoUrl(e.target.value)}
                        placeholder="...or paste image URL"
                        className="w-full border rounded-xl px-3 py-2 text-xs font-mono bg-slate-900 border-slate-800 text-slate-300 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Header Tagline / Subtitle:
                    </label>
                    <input
                      type="text"
                      value={customHeaderTitle}
                      onChange={(e) => setCustomHeaderTitle(e.target.value)}
                      className="w-full border rounded-xl px-4 py-3 text-xs font-bold bg-slate-900 border-slate-800 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: CONTENT & OPTIONS */}
              {canvaTab === 'content' && (
                <div className="space-y-5">
                  <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">
                    Question Stem & Options A, B, C, D
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Question Stem:
                    </label>
                    <textarea
                      value={customStem}
                      onChange={(e) => setCustomStem(e.target.value)}
                      rows={3}
                      className="w-full border rounded-xl px-4 py-3 text-xs font-bold bg-slate-900 border-slate-800 text-white focus:border-amber-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-300">
                      Options A / B / C / D Text & Correct Answer:
                    </label>
                    {customOptions.map((opt, idx) => {
                      const isCorr = opt.isCorrect || customAnswerKey.toLowerCase() === opt.key.toLowerCase();
                      return (
                        <div key={idx} className="space-y-1 p-3 rounded-2xl bg-slate-900 border border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-amber-400">
                              Option {opt.key || String.fromCharCode(65 + idx)}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomAnswerKey(opt.key);
                                setCustomOptions(prev => prev.map((o, i) => ({ ...o, isCorrect: i === idx })));
                              }}
                              className={`px-3 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                                isCorr
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                              }`}
                            >
                              {isCorr ? '✓ Correct Answer' : 'Mark Correct'}
                            </button>
                          </div>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomOptions(prev => prev.map((o, i) => i === idx ? { ...o, text: val } : o));
                            }}
                            className="w-full border rounded-xl px-3 py-2 text-xs font-bold bg-slate-950 border-slate-800 text-white focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: REACTIONS */}
              {canvaTab === 'reactions' && (
                <div className="space-y-5">
                  <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">
                    Quiz Time Reaction Grid Settings
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Wordmark Header Title:
                    </label>
                    <input
                      type="text"
                      value={quizTitleText}
                      onChange={(e) => setQuizTitleText(e.target.value)}
                      className="w-full border rounded-xl px-4 py-3 text-xs font-bold bg-slate-900 border-slate-800 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Reaction Call-To-Action:
                    </label>
                    <input
                      type="text"
                      value={quizCtaText}
                      onChange={(e) => setQuizCtaText(e.target.value)}
                      className="w-full border rounded-xl px-4 py-3 text-xs font-bold bg-slate-900 border-slate-800 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Comment Prompt Footer:
                    </label>
                    <input
                      type="text"
                      value={quizSubCtaText}
                      onChange={(e) => setQuizSubCtaText(e.target.value)}
                      className="w-full border rounded-xl px-4 py-3 text-xs font-bold bg-slate-900 border-slate-800 text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      Reaction Emojis (A / B / C / D):
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {REACTION_ORDER.map((letter) => (
                        <div key={letter} className="text-center space-y-1">
                          <span className="text-[10px] font-mono text-slate-400 uppercase">{letter}</span>
                          <input
                            type="text"
                            value={reactionEmojis[letter]}
                            onChange={(e) => setReactionEmojis(prev => ({ ...prev, [letter]: e.target.value }))}
                            className="w-full text-center border rounded-xl px-2 py-2 text-lg bg-slate-900 border-slate-800 text-white focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: LAYERS */}
              {canvaTab === 'layers' && (
                <div className="space-y-5">
                  <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">
                    Text Box Layers (Custom Mode)
                  </h4>
                  {isCustomMode ? (
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
                      onClose={() => setIsCanvaDrawerOpen(false)}
                    />
                  ) : (
                    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-center">
                      <p className="text-xs text-slate-400">
                        Enable Custom Canva Drag & Drop mode to edit individual text boxes and layers.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsCustomMode(true)}
                        className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-md"
                      >
                        Enable Custom Mode
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: BACKGROUND & THEME */}
              {canvaTab === 'background' && (
                <div className="space-y-5">
                  <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">
                    Aspect Ratio & Background Theme
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      Aspect Ratio:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: '1:1', name: '1:1 Square' },
                        { id: '4:5', name: '4:5 Feed' },
                        { id: '9:16', name: '9:16 Story' },
                      ].map((ratio) => (
                        <button
                          key={ratio.id}
                          type="button"
                          onClick={() => setAspectRatio(ratio.id as any)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-black transition-all ${
                            aspectRatio === ratio.id
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {ratio.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      Background Gradient Preset:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'gradient_amber', name: 'Midnight Gold' },
                        { id: 'gradient_blue', name: 'Cyber Blue' },
                        { id: 'gradient_emerald', name: 'Forest Emerald' },
                        { id: 'clean_light', name: 'Warm Light' },
                      ].map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setPostBgColor(b.id)}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                            postBgColor === b.id
                              ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
      )}
    </div>
  );
};
