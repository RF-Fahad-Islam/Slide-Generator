import React, { useState, useRef, useEffect } from 'react';
import { MCQItem, DeckConfig } from '../types';
import { MathText } from './MathText';
import {
  Share2,
  Download,
  CheckCircle2,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Smartphone,
  Square,
  Maximize,
  Sliders,
  Type,
  Award,
  RefreshCw,
  Copy,
  User,
  BookOpen,
  Search,
  Filter,
} from 'lucide-react';
import html2canvas from 'html2canvas';

interface SocialPostGeneratorProps {
  items: MCQItem[];
  config: DeckConfig;
  appTheme: 'dark' | 'light';
  preselectedItemId?: string | null;
}

type CustomBoxBind =
  | 'stem'
  | 'options'
  | 'answer'
  | 'explanation'
  | 'brand'
  | 'headerTitle'
  | 'footerTag'
  | 'free';

interface CustomTextBox {
  id: string;
  bind: CustomBoxBind;
  text?: string;
  x: number;         // % left of canvas
  y: number;         // % top of canvas
  w: number;         // % width of canvas
  fontSize: number;  // % of canvas width
  color: string;
  align: 'left' | 'center' | 'right';
  bold: boolean;
}

interface CustomPostDesign {
  bgImageUrl: string;
  boxes: CustomTextBox[];
}

const CUSTOM_DESIGN_STORAGE_KEY = 'social_post_custom_design_v1';

const defaultCustomBoxes = (): CustomTextBox[] => [
  { id: 'b_brand', bind: 'brand', x: 8, y: 6, w: 70, fontSize: 3.4, color: '#fbbf24', align: 'left', bold: true },
  { id: 'b_header', bind: 'headerTitle', x: 8, y: 12, w: 84, fontSize: 2.8, color: '#ffffff', align: 'left', bold: false },
  { id: 'b_stem', bind: 'stem', x: 8, y: 26, w: 84, fontSize: 4.2, color: '#ffffff', align: 'left', bold: true },
  { id: 'b_options', bind: 'options', x: 8, y: 56, w: 84, fontSize: 3, color: '#ffffff', align: 'left', bold: false },
  { id: 'b_footer', bind: 'footerTag', x: 8, y: 90, w: 60, fontSize: 2.4, color: '#fbbf24', align: 'left', bold: true },
];

const loadSavedDesign = (): CustomPostDesign => {
  try {
    const raw = localStorage.getItem(CUSTOM_DESIGN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CustomPostDesign;
      if (parsed && Array.isArray(parsed.boxes)) return parsed;
    }
  } catch {
    // ignore corrupted storage
  }
  return { bgImageUrl: '', boxes: defaultCustomBoxes() };
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
  const [customHeaderTitle, setCustomHeaderTitle] = useState<string>('আজকের কুইজ');
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(true);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Custom Design Editor State
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customDesign, setCustomDesign] = useState<CustomPostDesign>(loadSavedDesign);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [canvasWidth, setCanvasWidth] = useState<number>(500);

  const postCanvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ type: 'move' | 'resize'; boxId: string; startX: number; startY: number; orig: CustomTextBox } | null>(null);

  // Measure canvas width so %-font sizes resolve to real px for html2canvas
  useEffect(() => {
    const el = postCanvasRef.current;
    if (!el) return;
    const update = () => setCanvasWidth(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isCustomMode]);

  // Persist the custom design across tab switches (component remounts each visit)
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_DESIGN_STORAGE_KEY, JSON.stringify(customDesign));
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

  const selectedBox = customDesign.boxes.find(b => b.id === selectedBoxId) || null;

  const updateBox = (id: string, patch: Partial<CustomTextBox>) => {
    setCustomDesign(prev => ({
      ...prev,
      boxes: prev.boxes.map(b => (b.id === id ? { ...b, ...patch } : b)),
    }));
  };

  const addBox = (bind: CustomBoxBind) => {
    const id = `b_${bind}_${Date.now()}`;
    const newBox: CustomTextBox = {
      id,
      bind,
      text: bind === 'free' ? 'Type your text here...' : undefined,
      x: 8,
      y: 40 + (customDesign.boxes.length % 4) * 12,
      w: 84,
      fontSize: bind === 'stem' ? 4.2 : bind === 'options' ? 3 : 3,
      color: '#ffffff',
      align: 'left',
      bold: bind === 'stem' || bind === 'brand',
    };
    setCustomDesign(prev => ({ ...prev, boxes: [...prev.boxes, newBox] }));
    setSelectedBoxId(id);
  };

  const deleteBox = (id: string) => {
    setCustomDesign(prev => ({ ...prev, boxes: prev.boxes.filter(b => b.id !== id) }));
    setSelectedBoxId(prev => (prev === id ? null : prev));
  };

  const duplicateBox = (id: string) => {
    setCustomDesign(prev => {
      const src = prev.boxes.find(b => b.id === id);
      if (!src) return prev;
      const copy: CustomTextBox = { ...src, id: `b_${src.bind}_${Date.now()}`, y: Math.min(src.y + 5, 92) };
      return { ...prev, boxes: [...prev.boxes, copy] };
    });
  };

  const getBoxContent = (box: CustomTextBox): string => {
    switch (box.bind) {
      case 'stem': return currentItem.stem;
      case 'answer': return currentItem.answer || '';
      case 'explanation': return currentItem.explanation || '';
      case 'brand': return config.brandName || "RAKIB'S CLASSROOM";
      case 'headerTitle': return customHeaderTitle || config.headerTitle || 'আজকের কুইজ';
      case 'footerTag': return config.footerTag || 'BIOMISSION';
      case 'free': return box.text || '';
      case 'options': return '';
    }
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
    setCustomDesign({ bgImageUrl: '', boxes: defaultCustomBoxes() });
    setSelectedBoxId(null);
  };

  const startBoxDrag = (e: React.PointerEvent, boxId: string, type: 'move' | 'resize') => {
    e.stopPropagation();
    const box = customDesign.boxes.find(b => b.id === boxId);
    if (!box) return;
    setSelectedBoxId(boxId);
    dragRef.current = { type, boxId, startX: e.clientX, startY: e.clientY, orig: { ...box } };

    const onMove = (ev: PointerEvent) => {
      const d = dragRef.current;
      const el = postCanvasRef.current;
      if (!d || !el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0) return;
      const dx = ((ev.clientX - d.startX) / rect.width) * 100;
      const dy = ((ev.clientY - d.startY) / rect.height) * 100;
      if (d.type === 'move') {
        updateBox(d.boxId, {
          x: clamp(d.orig.x + dx, 0, 100 - d.orig.w),
          y: clamp(d.orig.y + dy, 0, 96),
        });
      } else {
        updateBox(d.boxId, { w: clamp(d.orig.w + dx, 12, 100 - d.orig.x) });
      }
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
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

    try {
      const canvas = await html2canvas(postCanvasRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `social_post_q${selectedQuestionIndex + 1}_${aspectRatio.replace(':', 'x')}.png`;
      link.href = dataUrl;
      link.click();
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
                {isCustomMode ? '🎨 Custom Mode ON' : 'Enable Custom Mode'}
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
                        ✕
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

                {/* Add text box buttons */}
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <span className={`text-sm font-extrabold block ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Add Text Box (auto-fills from selected question)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { bind: 'stem', label: '+ Question' },
                      { bind: 'options', label: '+ Options' },
                      { bind: 'answer', label: '+ Answer' },
                      { bind: 'explanation', label: '+ Explanation' },
                      { bind: 'brand', label: '+ Brand Name' },
                      { bind: 'headerTitle', label: '+ Header Title' },
                      { bind: 'free', label: '+ Free Text' },
                    ] as const).map(btn => (
                      <button
                        key={btn.bind}
                        type="button"
                        onClick={() => addBox(btn.bind)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer hover:scale-105 ${
                          isAppLight
                            ? 'bg-white border-slate-300 text-amber-700 hover:bg-amber-50 hover:border-amber-300'
                            : 'bg-slate-900 border-slate-700 text-amber-300 hover:border-amber-500/40'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset design */}
                <button
                  type="button"
                  onClick={resetDesign}
                  className={`w-full px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
                    isAppLight ? 'bg-white border-rose-300 text-rose-600 hover:bg-rose-50' : 'bg-slate-900 border-rose-500/40 text-rose-300 hover:border-rose-500'
                  }`}
                >
                  Reset Design to Defaults
                </button>

                {/* Selected box style panel */}
                {selectedBox && (
                  <div className={`p-4 rounded-2xl border space-y-4 ${
                    isAppLight ? 'bg-amber-50/70 border-amber-300' : 'bg-slate-950 border-amber-500/40'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-extrabold ${isAppLight ? 'text-amber-700' : 'text-amber-300'}`}>
                        Style: <span className="uppercase">{selectedBox.bind}</span> box
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => duplicateBox(selectedBox.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isAppLight ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100' : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBox(selectedBox.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isAppLight ? 'bg-white border-rose-300 text-rose-600 hover:bg-rose-50' : 'bg-slate-900 border-rose-500/40 text-rose-300 hover:border-rose-500'
                          }`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Bind To:</label>
                      <select
                        value={selectedBox.bind}
                        onChange={(e) => updateBox(selectedBox.id, { bind: e.target.value as CustomBoxBind })}
                        className={`w-full border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500 ${
                          isAppLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                      >
                        <option value="stem">Question Stem</option>
                        <option value="options">Options List</option>
                        <option value="answer">Answer</option>
                        <option value="explanation">Explanation</option>
                        <option value="brand">Brand Name</option>
                        <option value="headerTitle">Header Title</option>
                        <option value="footerTag">Footer Tag</option>
                        <option value="free">Free Text</option>
                      </select>
                    </div>

                    {selectedBox.bind === 'free' && (
                      <div>
                        <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Text Content:</label>
                        <textarea
                          value={selectedBox.text || ''}
                          onChange={(e) => updateBox(selectedBox.id, { text: e.target.value })}
                          rows={2}
                          className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                            isAppLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                          }`}
                        />
                      </div>
                    )}

                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        Font Size: {selectedBox.fontSize.toFixed(1)}% width
                      </label>
                      <input
                        type="range"
                        min={1.5}
                        max={9}
                        step={0.1}
                        value={selectedBox.fontSize}
                        onChange={(e) => updateBox(selectedBox.id, { fontSize: parseFloat(e.target.value) })}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Text Color:</label>
                      <div className="flex flex-wrap items-center gap-2">
                        {BOX_COLOR_PRESETS.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => updateBox(selectedBox.id, { color: c })}
                            className={`w-6 h-6 rounded-lg border transition-transform hover:scale-110 ${
                              selectedBox.color === c ? 'ring-2 ring-amber-400 scale-110' : ''
                            } ${c === '#000000' ? 'border-slate-500' : 'border-white/20'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        <input
                          type="color"
                          value={selectedBox.color}
                          onChange={(e) => updateBox(selectedBox.id, { color: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-white/20 bg-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className={`flex items-center gap-1 p-1 rounded-xl border ${
                        isAppLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}>
                        {(['left', 'center', 'right'] as const).map(a => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => updateBox(selectedBox.id, { align: a })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                              selectedBox.align === a ? 'bg-amber-500 text-slate-950' : isAppLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => updateBox(selectedBox.id, { bold: !selectedBox.bold })}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          selectedBox.bold
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : isAppLight
                            ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        B
                      </button>
                    </div>

                    <p className={`text-[10px] leading-relaxed ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
                      Drag a box on the canvas to move it. Use the corner handle to resize. Bound boxes update automatically when you change the selected question.
                    </p>
                  </div>
                )}

                {!selectedBox && (
                  <p className={`text-xs text-center py-2 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Click a box on the canvas to edit its style.
                  </p>
                )}
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
                { id: 'gradient_amber', name: '🌙 Midnight Gold', bg: 'from-slate-950 to-amber-950' },
                { id: 'gradient_blue', name: '📘 Cyber Blue', bg: 'from-slate-950 to-indigo-950' },
                { id: 'gradient_emerald', name: '🌿 Forest Emerald', bg: 'from-slate-950 to-emerald-950' },
                { id: 'clean_light', name: '☀️ Warm Light', bg: 'from-slate-50 to-amber-50' },
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
                  placeholder="e.g. আজকের কুইজ | এইচএসসি জীববিজ্ঞান"
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

            {/* Question picker filter bar — mirrors the Question Bank filter */}
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
                <select
                  value={pickerSubject}
                  onChange={(e) => setPickerSubject(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:border-amber-500 cursor-pointer ${
                    isAppLight
                      ? 'bg-slate-50 border-slate-300 text-slate-800'
                      : 'bg-slate-950 border-slate-800 text-amber-300'
                  }`}
                >
                  <option value="all">📚 All Subjects</option>
                  <option value="biology">Biology</option>
                  <option value="math">Higher Math</option>
                  <option value="physics">Physics</option>
                  <option value="chemistry">Chemistry</option>
                </select>

                <select
                  value={pickerBoard}
                  onChange={(e) => setPickerBoard(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:border-amber-500 cursor-pointer ${
                    isAppLight
                      ? 'bg-slate-50 border-slate-300 text-slate-800'
                      : 'bg-slate-950 border-slate-800 text-amber-300'
                  }`}
                >
                  <option value="all">🏛️ All Boards</option>
                  <option value="চট্টগ্রাম">Chittagong Board</option>
                  <option value="ঢাকা">Dhaka Board</option>
                  <option value="রাজশাহী">Rajshahi Board</option>
                  <option value="admission">Admission</option>
                </select>

                <select
                  value={pickerType}
                  onChange={(e) => setPickerType(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:border-amber-500 cursor-pointer ${
                    isAppLight
                      ? 'bg-slate-50 border-slate-300 text-slate-800'
                      : 'bg-slate-950 border-slate-800 text-amber-300'
                  }`}
                >
                  <option value="all">🧩 All Types</option>
                  <option value="standard">Standard MCQ</option>
                  <option value="roman_statements">Roman Statements</option>
                  <option value="passage">Shared Passage</option>
                </select>
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
            <span className={`text-[10px] font-mono font-black px-2.5 py-1 rounded border ${
              isAppLight
                ? 'text-amber-700 bg-amber-100 border-amber-300'
                : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
            }`}>
              High Res Export
            </span>
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
                        {customHeaderTitle || config.headerTitle || 'আজকের কুইজ'}
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
                      প্রশ্নঃ
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
                      <strong>ব্যাখ্যা:</strong> <MathText text={currentItem.explanation} />
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
                <div className={`w-full mx-auto ${getAspectClass()} rounded-3xl border border-slate-700/80 shadow-2xl relative overflow-hidden select-none`}>
                  {/* Export node: the custom card (captured by html2canvas) */}
                  <div
                    ref={postCanvasRef}
                    style={{ fontFamily: config.fontFamily || "'Kalpurush', serif" }}
                    className="absolute inset-0"
                  >
                    {customDesign.bgImageUrl ? (
                      <img
                        src={customDesign.bgImageUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        draggable={false}
                      />
                    ) : (
                      <div className={`absolute inset-0 ${getBgStyle()}`} />
                    )}
                    <div className="relative w-full h-full p-4">
                      {customDesign.boxes.map(box => {
                        const fs = Math.max(8, Math.round((box.fontSize / 100) * canvasWidth));
                        const style: React.CSSProperties = {
                          left: `${box.x}%`,
                          top: `${box.y}%`,
                          width: `${box.w}%`,
                          fontSize: fs,
                          textAlign: box.align,
                          color: box.color,
                        };
                        if (box.bind === 'options') {
                          return (
                            <div key={box.id} className={`absolute leading-snug ${box.bold ? 'font-black' : 'font-bold'}`} style={style}>
                              <div className="space-y-1.5">
                                {currentItem.options.map(opt => (
                                  <div key={opt.key} className="flex items-start gap-1.5">
                                    <span className="font-black shrink-0">{opt.key}.</span>
                                    <span><MathText text={opt.text} /></span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={box.id} className={`absolute whitespace-pre-wrap leading-snug ${box.bold ? 'font-black' : 'font-bold'}`} style={style}>
                            <MathText text={getBoxContent(box)} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Editor overlay (NOT captured on export) */}
                  <div className="absolute inset-0 z-20">
                    {customDesign.boxes.map(box => {
                      const selected = box.id === selectedBoxId;
                      const fs = Math.max(8, Math.round((box.fontSize / 100) * canvasWidth));
                      return (
                        <div
                          key={box.id}
                          onPointerDown={(e) => startBoxDrag(e, box.id, 'move')}
                          className="absolute cursor-move"
                          style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%` }}
                        >
                          <div
                            className={`relative w-full h-full border rounded-md pointer-events-none transition-colors ${selected ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-white/30'}`}
                            style={{ fontSize: fs }}
                          >
                            <div className="invisible whitespace-pre-wrap leading-snug font-bold">
                              {box.bind === 'options'
                                ? (
                                  <div className="space-y-1.5">
                                    {currentItem.options.map(o => (
                                      <div key={o.key}>{o.key}. {o.text}</div>
                                    ))}
                                  </div>
                                )
                                : getBoxContent(box)}
                            </div>
                            <span className={`absolute -top-3 left-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded leading-none ${
                              selected ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-amber-300 border border-white/20'
                            }`}>
                              {box.bind}
                            </span>
                          </div>
                          <span
                            onPointerDown={(e) => startBoxDrag(e, box.id, 'resize')}
                            className={`absolute -bottom-2 -right-2 w-4 h-4 rounded-md cursor-nwse-resize border-2 border-slate-950 shadow ${
                              selected ? 'bg-amber-400' : 'bg-amber-500'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <p className={`text-xs text-center leading-relaxed ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Drag a box to move it — resize from the bottom-right handle. Click a box to edit its style. Your design saves automatically in this browser.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
