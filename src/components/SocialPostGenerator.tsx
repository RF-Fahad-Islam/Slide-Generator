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
  Award,
  RefreshCw,
  User,
  BookOpen,
  Search,
  Filter,
  List,
  Heading,
  PenLine,
  GraduationCap,
  Landmark,
  LayoutGrid,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { toPng } from 'html-to-image';
import { SlideTextBoxLayer } from './SlideTextBoxLayer';
import { SlideTextBoxOverlay } from './SlideTextBoxOverlay';
import { SlideTextBoxPanel } from './SlideTextBoxPanel';
import { getSlideBoxContent } from '../utils/slideTextBoxes';
import { SLIDE_ELEMENT_DEFS, SLIDE_LAYOUTS } from '../utils/slideElements';

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

// Social posts use a fixed 1080px-tall design space so the exact same
// SlideTextBox px-coordinate system (fonts, box positions) as Slide Studio is
// reused. Width derives from the chosen aspect ratio.
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

// Older saved designs stored boxes as %-based CustomTextBox entries. Migrate
// them into the px-based SlideTextBox space so existing designs keep working.
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

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const BOX_COLOR_PRESETS = ['#ffffff', '#fbbf24', '#f59e0b', '#38bdf8', '#34d399', '#fb7185', '#a78bfa', '#000000'];

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedItemId]);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '9:16'>('1:1');
  const [postTemplate, setPostTemplate] = useState<
    'edtech_quiz' | 'minimal_card' | 'flashcard' | 'exam_highlight'
  >('edtech_quiz');
  const [postBgColor, setPostBgColor] = useState<string>('gradient_amber');
  const [customHeaderTitle, setCustomHeaderTitle] = useState<string>('à¦†à¦œà¦•à§‡à¦° à¦•à§à¦‡à¦œ');
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(true);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

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

  const postCanvasRef = useRef<HTMLDivElement>(null);
  const postFrameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ type: 'move' | 'resize'; boxId: string; startX: number; startY: number; orig: SlideTextBox } | null>(null);

  // Measure the preview frame width so the fixed-size design space (px) can be
  // scaled to fit, and %-font equivalents resolve for html2canvas.
  useEffect(() => {
    const el = postFrameRef.current;
    if (!el) return;
    const update = () => setCanvasWidth(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isCustomMode, aspectRatio]);

  // Persist the custom design across tab switches (component remounts each visit)
  useEffect(() => {
    try {
      const stored: StoredPostDesign = { version: 2, bgImageUrl: customDesign.bgImageUrl, boxes: customDesign.boxes };
      localStorage.setItem(CUSTOM_DESIGN_STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // storage may be full from data-URL images; ignore
    }
  }, [customDesign]);

  // Question picker filters (mirrors the Question Bank filter bar)
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [pickerSubject, setPickerSubject] = useState<string>('all');
  const [pickerBoard, setPickerBoard] = useState<string>('all');
  const [pickerType, setPickerType] = useState<string>('all');

  const currentItem = items[selectedQuestionIndex] || {
    id: 'sample',
    questionType: 'standard',
    stem: 'à¦°à§à¦‡ à¦®à¦¾à¦›à§‡à¦° à¦¹à§ƒà¦¦à¦ªà¦¿à¦£à§à¦¡à§‡ à¦•à¦¯à¦¼à¦Ÿà¦¿ à¦ªà§à¦°à¦•à§‹à¦·à§à¦  à¦¥à¦¾à¦•à§‡?',
    options: [
      { key: 'à¦•', text: 'à§¨à¦Ÿà¦¿' },
      { key: 'à¦–', text: 'à§ªà¦Ÿà¦¿' },
      { key: 'à¦—', text: 'à§©à¦Ÿà¦¿' },
      { key: 'à¦˜', text: 'à§§à¦Ÿà¦¿' },
    ],
    answer: 'à¦•',
    explanation: 'à¦°à§à¦‡ à¦®à¦¾à¦›à§‡à¦° à¦¹à§ƒà¦¦à¦ªà¦¿à¦£à§à¦¡ à¦¦à§à¦‡ à¦ªà§à¦°à¦•à§‹à¦·à§à¦  à¦¬à¦¿à¦¶à¦¿à¦·à§à¦Ÿ (à¦à¦• à¦…à¦²à¦¿à¦¨à§à¦¦ à¦“ à¦à¦• à¦¨à¦¿à¦²à¦¯à¦¼)à¥¤',
  };

  const selectedBox = customDesign.boxes.find(b => b.id === selectedBoxId) || null;

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
    // The SlideTextBox system is designed for a 1920x1080 space â€” rescale the
    // factory-produced boxes to the post's design space.
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
    reader.onerror = () => {
      alert('Failed to read the image file. Please try another file.');
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const resetDesign = () => {
    if (!window.confirm('Reset the custom design to its default layout? This clears your background image and all text boxes.')) return;
    setCustomDesign({ bgImageUrl: '', boxes: defaultCustomBoxes(postDesignW, postDesignH) });
    setSelectedBoxId(null);
  };

  // Filter the picker list using the same search/filter rules as the Question Bank
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

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllItems = () => {
    setSelectedItemIds(items.map((item) => item.id));
  };

  const deselectAllItems = () => {
    setSelectedItemIds([]);
  };

  // Export single social post PNG image
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

  // Background Styles Mapping
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

  // Aspect ratio container dimensions
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
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div
        className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-6 lg:p-8 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ${
          isAppLight
            ? 'border-slate-200'
            : 'bg-slate-900/80 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25">
            <Share2 className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <h2 className={`text-xl lg:text-2xl font-black flex items-center gap-2 ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
              <span>Social Media Post Generator</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-black border ${
                isAppLight
                  ? 'bg-amber-100 text-amber-700 border-amber-300'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                FB / Instagram / Story
              </span>
            </h2>
            <p className={`text-xs mt-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Create high-engagement social media cards, daily quiz posts & story banners from your MCQs!
            </p>
          </div>
        </div>

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

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT 5 COLUMNS: POST CONFIGURATION & CONTROLS */}
        <div className="xl:col-span-5 space-y-6">
          {/* Custom Design Editor Toggle */}
          <div
            className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-6 border space-y-4 ${
              isAppLight
                ? 'border-slate-200'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <label className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${
              isAppLight ? 'text-amber-600' : 'text-amber-400'
            }`}>
              <Layers className="w-4 h-4" />
              0. Custom Design Editor
            </label>
            <div className={`flex items-center justify-between gap-4 p-4 rounded-2xl border ${
              isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="space-y-1">
                <p className={`text-sm font-extrabold ${isAppLight ? 'text-slate-800' : 'text-slate-100'}`}>
                  Upload Your Own Image & Text Boxes
                </p>
                <p className={`text-xs leading-relaxed ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Design a fully custom post: background image + draggable boxes that auto-fill question, options & answers.
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
                {isCustomMode ? 'ðŸŽ¨ Custom Mode ON' : 'Enable Custom Mode'}
              </button>
            </div>

            {isCustomMode && (
              <div className="space-y-5">
                {/* Background image */}
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isAppLight ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-950 border-amber-500/30'
                }`}>
                  <span className={`text-sm font-extrabold block ${isAppLight ? 'text-amber-700' : 'text-amber-300'}`}>
                    Background Image
                  </span>
                  {customDesign.bgImageUrl ? (
                    <div className="relative inline-block">
                      <img
                        src={customDesign.bgImageUrl}
                        alt="Custom Background"
                        className="h-20 max-w-[220px] object-contain rounded-xl border border-amber-400/50 bg-black/30"
                      />
                      <button
                        type="button"
                        onClick={() => setCustomDesign(prev => ({ ...prev, bgImageUrl: '' }))}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white text-sm font-bold leading-none hover:bg-rose-600 shadow"
                      >
                        âœ•
                      </button>
                    </div>
                  ) : (
                    <div className={`h-20 w-48 rounded-xl border border-dashed flex items-center justify-center text-xs text-center p-2 ${
                      isAppLight ? 'bg-white border-slate-300 text-slate-400' : 'bg-slate-900 border-slate-700 text-slate-500'
                    }`}>
                      No background image
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <label className={`px-3.5 py-2 rounded-xl text-sm font-bold cursor-pointer flex items-center gap-1.5 border transition-all ${
                      isAppLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                    }`}>
                      <ImageIcon className="w-4 h-4" />
                      Upload Image
                      <input type="file" accept="image/*" onChange={handleCustomBgUpload} className="hidden" />
                    </label>
                    <input
                      type="text"
                      value={customDesign.bgImageUrl.startsWith('data:') ? '' : customDesign.bgImageUrl}
                      onChange={(e) => setCustomDesign(prev => ({ ...prev, bgImageUrl: e.target.value }))}
                      placeholder="...or paste image URL"
                      className={`flex-1 min-w-[140px] border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-500 ${
                        isAppLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>

                {/* The SAME text editor as Slide Studio â€” text box panel with
                    Style / Text / Elements / Photos / Layouts tabs. Boxes live in
                    the shared SlideTextBox coordinate space (scaled to the post). */}
                <SlideTextBoxPanel
                  boxes={customDesign.boxes}
                  selectedId={selectedBoxId}
                  appTheme={appTheme}
                  config={{ ...config, headerTitle: customHeaderTitle }}
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
                  onClose={() => setIsBoxEditMode(false)}
                />

              </div>
            )}
          </div>

          {/* Aspect Ratio Selector */}
          <div
            className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-6 border space-y-5 ${
              isAppLight
                ? 'border-slate-200'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <label className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${
              isAppLight ? 'text-amber-600' : 'text-amber-400'
            }`}>
              <Smartphone className="w-4 h-4" />
              1. Select Aspect Ratio & Platform
            </label>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setAspectRatio('1:1')}
                className={`p-4 rounded-2xl border font-bold flex flex-col items-center gap-2 transition-all ${
                  aspectRatio === '1:1'
                    ? isAppLight
                      ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-md ring-2 ring-amber-400/40'
                      : 'bg-amber-500/10 border-amber-400 text-amber-400 shadow-md ring-1 ring-amber-400/50'
                    : isAppLight
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Square className="w-5 h-5" />
                <span className="font-black">1:1 Square</span>
                <span className={`text-[9px] font-mono ${isAppLight ? 'text-slate-500' : 'opacity-80'}`}>(FB / Insta Post)</span>
              </button>

              <button
                type="button"
                onClick={() => setAspectRatio('4:5')}
                className={`p-4 rounded-2xl border font-bold flex flex-col items-center gap-2 transition-all ${
                  aspectRatio === '4:5'
                    ? isAppLight
                      ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-md ring-2 ring-amber-400/40'
                      : 'bg-amber-500/10 border-amber-400 text-amber-400 shadow-md ring-1 ring-amber-400/50'
                    : isAppLight
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Maximize className="w-5 h-5" />
                <span className="font-black">4:5 Portrait</span>
                <span className={`text-[9px] font-mono ${isAppLight ? 'text-slate-500' : 'opacity-80'}`}>(Insta Feed)</span>
              </button>

              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`p-4 rounded-2xl border font-bold flex flex-col items-center gap-2 transition-all ${
                  aspectRatio === '9:16'
                    ? isAppLight
                      ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-md ring-2 ring-amber-400/40'
                      : 'bg-amber-500/10 border-amber-400 text-amber-400 shadow-md ring-1 ring-amber-400/50'
                    : isAppLight
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span className="font-black">9:16 Story</span>
                <span className={`text-[9px] font-mono ${isAppLight ? 'text-slate-500' : 'opacity-80'}`}>(Reels / Story)</span>
              </button>
            </div>
          </div>

          {/* Background Theme Selector */}
          <div
            className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-6 border space-y-5 ${
              isAppLight
                ? 'border-slate-200'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <label className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${
              isAppLight ? 'text-amber-600' : 'text-amber-400'
            }`}>
              <Sliders className="w-4 h-4" />
              2. Post Background Color & Gradient
            </label>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { id: 'gradient_amber', name: 'ðŸŒ™ Midnight Gold', bg: 'from-slate-950 to-amber-950' },
                { id: 'gradient_blue', name: 'ðŸ“˜ Cyber Blue', bg: 'from-slate-950 to-indigo-950' },
                { id: 'gradient_emerald', name: 'ðŸŒ¿ Forest Emerald', bg: 'from-slate-950 to-emerald-950' },
                { id: 'clean_light', name: 'â˜€ï¸ Warm Light', bg: 'from-slate-50 to-amber-50' },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setPostBgColor(b.id)}
                  className={`p-4 rounded-2xl border font-bold text-left transition-all flex items-center gap-3 ${
                    postBgColor === b.id
                      ? isAppLight
                        ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-md ring-2 ring-amber-400/40'
                        : 'bg-amber-500/10 border-amber-400 text-amber-300 shadow-md'
                      : isAppLight
                      ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full bg-gradient-to-r ${b.bg} border shrink-0`} />
                  <span className="truncate font-black">{b.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Text Controls */}
          <div
            className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-6 border space-y-5 ${
              isAppLight
                ? 'border-slate-200'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <label className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${
              isAppLight ? 'text-amber-600' : 'text-amber-400'
            }`}>
              <Type className="w-4 h-4" />
              3. Post Banner Header & Display Settings
            </label>

            <div className="space-y-4">
              <div>
                <label className={`block text-[11px] font-bold mb-2 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Post Header Banner Title:
                </label>
                <input
                  type="text"
                  value={customHeaderTitle}
                  onChange={(e) => setCustomHeaderTitle(e.target.value)}
                  placeholder="e.g. à¦†à¦œà¦•à§‡à¦° à¦•à§à¦‡à¦œ | à¦à¦‡à¦šà¦à¦¸à¦¸à¦¿ à¦œà§€à¦¬à¦¬à¦¿à¦œà§à¦žà¦¾à¦¨"
                  className={`w-full border rounded-xl px-4 py-3 text-xs font-bold transition-all focus:outline-none focus:ring-2 ${
                    isAppLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500 focus:ring-amber-500/20'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-amber-500 focus:ring-amber-500/20'
                  }`}
                />
              </div>

              <div className={`flex items-center justify-between pt-2 text-xs font-bold ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <span>Highlight Correct Answer Option</span>
                <input
                  type="checkbox"
                  checked={showAnswerKey}
                  onChange={(e) => setShowAnswerKey(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <div className={`flex items-center justify-between text-xs font-bold ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <span>Include Short Explanation Text</span>
                <input
                  type="checkbox"
                  checked={showExplanation}
                  onChange={(e) => setShowExplanation(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Question Selector List */}
          <div
            className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-6 border space-y-4 ${
              isAppLight
                ? 'border-slate-200'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <label className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${
                isAppLight ? 'text-amber-600' : 'text-amber-400'
              }`}>
                <BookOpen className="w-5 h-5" />
                4. Select Question To Post ({filteredPickerItems.length} / {items.length})
              </label>
            </div>

            {/* Question picker filter bar â€” mirrors the Question Bank filter */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className={`w-5 h-5 absolute left-3.5 top-3.5 ${isAppLight ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search questions in this deck..."
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-amber-500 ${
                    isAppLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                      : 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="relative">
                  <BookOpen className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isAppLight ? 'text-slate-400' : 'text-slate-500'}`} />
                  <select
                    value={pickerSubject}
                    onChange={(e) => setPickerSubject(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:border-amber-500 cursor-pointer ${
                      isAppLight
                        ? 'bg-slate-50 border-slate-300 text-slate-800'
                        : 'bg-slate-950 border-slate-800 text-amber-300'
                    }`}
                  >
                    <option value="all">All Subjects</option>
                    <option value="biology">Biology</option>
                    <option value="math">Higher Math</option>
                    <option value="physics">Physics</option>
                    <option value="chemistry">Chemistry</option>
                  </select>
                </div>

                <div className="relative">
                  <Landmark className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isAppLight ? 'text-slate-400' : 'text-slate-500'}`} />
                  <select
                    value={pickerBoard}
                    onChange={(e) => setPickerBoard(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:border-amber-500 cursor-pointer ${
                      isAppLight
                        ? 'bg-slate-50 border-slate-300 text-slate-800'
                        : 'bg-slate-950 border-slate-800 text-amber-300'
                    }`}
                  >
                    <option value="all">All Boards</option>
                    <option value="à¦šà¦Ÿà§à¦Ÿà¦—à§à¦°à¦¾à¦®">Chittagong Board</option>
                    <option value="à¦¢à¦¾à¦•à¦¾">Dhaka Board</option>
                    <option value="à¦°à¦¾à¦œà¦¶à¦¾à¦¹à§€">Rajshahi Board</option>
                    <option value="admission">Admission</option>
                  </select>
                </div>

                <div className="relative">
                  <LayoutGrid className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isAppLight ? 'text-slate-400' : 'text-slate-500'}`} />
                  <select
                    value={pickerType}
                    onChange={(e) => setPickerType(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:border-amber-500 cursor-pointer ${
                      isAppLight
                        ? 'bg-slate-50 border-slate-300 text-slate-800'
                        : 'bg-slate-950 border-slate-800 text-amber-300'
                    }`}
                  >
                    <option value="all">All Types</option>
                    <option value="standard">Standard MCQ</option>
                    <option value="roman_statements">Roman Statements</option>
                    <option value="passage">Shared Passage</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {filteredPickerItems.length === 0 ? (
                <div className={`text-center py-10 ${isAppLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Filter className="w-8 h-8 mx-auto mb-2 opacity-60" />
                  <p className="text-sm font-semibold">No questions match your filters.</p>
                </div>
              ) : (
                filteredPickerItems.map(({ question: q, fullIndex }) => {
                  const isSelected = fullIndex === selectedQuestionIndex;
                  return (
                    <button
                      key={q.id || fullIndex}
                      type="button"
                      onClick={() => setSelectedQuestionIndex(fullIndex)}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 text-sm ${
                        isSelected
                          ? isAppLight
                            ? 'bg-amber-50 border-amber-400 text-amber-700 font-bold ring-2 ring-amber-400/40'
                            : 'bg-amber-500/10 border-amber-400 text-amber-300 font-bold'
                          : isAppLight
                          ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <span className="truncate font-semibold">
                        #{fullIndex + 1}. <MathText text={q.stem} />
                      </span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT 7 COLUMNS: LIVE SOCIAL POST CARD CANVAS PREVIEW */}
        <div className="xl:col-span-7 flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center justify-between w-full max-w-[500px]">
            <span className={`text-xs font-bold flex items-center gap-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Live Social Post Preview ({aspectRatio})</span>
            </span>
            <div className="flex items-center gap-2">
              {isCustomMode && (
                <button
                  type="button"
                  onClick={() => setIsBoxEditMode(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
                    isBoxEditMode
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                      : isAppLight
                      ? 'bg-white text-slate-700 border-slate-300 hover:text-slate-900'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                  title="Toggle the text box editor handles on/off"
                >
                  {isBoxEditMode ? <Eye className="w-3 h-3" /> : <PenTool className="w-3 h-3" />}
                  {isBoxEditMode ? 'Preview' : 'Edit Design'}
                </button>
              )}
              <span className={`text-[10px] font-mono font-black px-2.5 py-1 rounded border ${
                isAppLight
                  ? 'text-amber-700 bg-amber-100 border-amber-300'
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              }`}>
                High Res Export
              </span>
            </div>
          </div>

          {/* Live Scaled Canvas Card */}
          <div className="w-full max-w-[500px] relative">
            {!isCustomMode ? (
              <div
                ref={postCanvasRef}
                style={{ fontFamily: config.fontFamily || "'Kalpurush', serif" }}
                className={`w-full mx-auto ${getAspectClass()} ${getBgStyle()} rounded-3xl p-6 lg:p-8 shadow-2xl border border-slate-700/80 flex flex-col justify-between relative overflow-hidden select-none transition-all`}
              >
                {/* Top Brand Banner Bar */}
                <div className="flex items-center justify-between border-b border-white/15 pb-4 z-10">
                  <div className="flex items-center gap-3">
                    {config.logoUrl ? (
                      <img
                        src={config.logoUrl}
                        alt="Logo"
                        className="w-10 h-10 object-contain rounded-xl bg-black/20 p-1 border border-white/20"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
                        {config.brandName ? config.brandName.charAt(0).toUpperCase() : 'R'}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-black tracking-wide uppercase leading-tight drop-shadow-sm">
                        {config.brandName || "RAKIB'S CLASSROOM"}
                      </h3>
                      <p className="text-xs font-bold text-amber-400 mt-0.5">
                        {customHeaderTitle || config.headerTitle || 'à¦†à¦œà¦•à§‡à¦° à¦•à§à¦‡à¦œ'}
                      </p>
                    </div>
                  </div>

                  {config.badgeTag && (
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                      {config.badgeTag}
                    </span>
                  )}
                </div>

                {/* Question Stem Box */}
                <div className="my-auto py-4 space-y-4 z-10">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shadow">
                      {selectedQuestionIndex + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      à¦ªà§à¦°à¦¶à§à¦¨à¦ƒ
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-extrabold leading-relaxed text-white drop-shadow">
                    <MathText text={currentItem.stem} />
                  </h2>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {currentItem.options.map((opt) => {
                      const isCorrect = showAnswerKey && (opt.isCorrect || opt.key.toLowerCase() === currentItem.answer?.toLowerCase());
                      return (
                        <div
                          key={opt.key}
                          className={`p-3 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between transition-all ${
                            isCorrect
                              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg font-black'
                              : 'bg-white/10 border-white/15 text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center font-mono ${
                              isCorrect ? 'bg-slate-950 text-amber-300 font-bold' : 'bg-white/15 text-white'
                            }`}>
                              {opt.key}
                            </span>
                            <span><MathText text={opt.text} /></span>
                          </div>
                          {isCorrect && <CheckCircle2 className="w-4 h-4 text-slate-950" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Optional Explanation */}
                  {showExplanation && currentItem.explanation && (
                    <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-xs text-amber-200 mt-2">
                      <strong>à¦¬à§à¦¯à¦¾à¦–à§à¦¯à¦¾:</strong> <MathText text={currentItem.explanation} />
                    </div>
                  )}
                </div>

                {/* Footer Watermark Bar */}
                <div className="flex items-center justify-between border-t border-white/15 pt-3 text-xs font-bold z-10">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>{config.watermarkHandle || 'Hasnat Shuvro'}</span>
                  </span>
                  <span className="font-mono text-amber-400 font-extrabold tracking-widest uppercase">
                    {config.footerTag || 'BIOMISSION'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative" ref={postFrameRef}>
                  {/* Export node: static in-flow card (captured by html2canvas â€” same structure as the 4 template cards) */}
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
                    {/* Boxes render in the shared SlideTextBoxLayer (exact same
                        text-box engine as Slide Studio), scaled from the fixed
                        design space into the displayed card. */}
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
                        item={currentItem}
                        config={{ ...config, headerTitle: customHeaderTitle }}
                        currentIndex={selectedQuestionIndex}
                        showAnswerHighlight={showAnswerKey}
                      />
                    </div>
                  </div>

                  {/* Editor overlay (NOT captured on export) â€” only visible in Edit Design mode */}
                  {isBoxEditMode && (
                    <div className="absolute inset-0 z-20">
                      <SlideTextBoxOverlay
                        boxes={customDesign.boxes}
                        selectedId={selectedBoxId}
                        item={currentItem}
                        config={{ ...config, headerTitle: customHeaderTitle }}
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
                {isBoxEditMode ? (
                  <p className={`text-xs text-center leading-relaxed ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Drag a box to move it â€” resize from the bottom-right handle. Click a box to edit its style. Your design saves automatically in this browser.
                  </p>
                ) : (
                  <p className={`text-xs text-center leading-relaxed ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Clean preview of your custom design â€” click "Edit Design" to show and adjust the text boxes.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
