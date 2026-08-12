import React, { useRef, useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Check } from 'lucide-react';
import { DeckConfig, SlideTextBox, SlideTextBoxBind } from '../types';
import { SLIDE_BOX_BINDS, SLIDE_BOX_COLOR_PRESETS } from '../utils/slideTextBoxes';
import { FONT_PRESETS } from '../utils/fontPresets';
import {
  SLIDE_ICON_LIBRARY,
  SLIDE_ELEMENT_DEFS,
  SLIDE_LAYOUTS,
  SLIDE_SHAPE_OPTIONS,
} from '../utils/slideElements';
import { LayoutPreviewMockup } from './LayoutPreviewMockup';
import {
  Layers,
  Palette,
  ImagePlus,
  Wand2,
  SquareStack,
  LayoutTemplate,
  Shapes,
  FileImage,
  Plus,
  Trash2,
  Copy,
  Globe,
  Target,
  Download,
  RotateCcw,
  X,
  CheckSquare,
  ChevronUp,
  ChevronDown,
  Type,
  Image as ImageIcon,
  Quote,
  HelpCircle,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';

const BIND_ICONS: Record<SlideTextBoxBind, typeof Layers> = {
  stem: Layers,
  options: Shapes,
  answer: Layers,
  explanation: Layers,
  passage: Layers,
  prompt: Layers,
  roman: Layers,
  source: Layers,
  questionNumber: Layers,
  brand: Layers,
  headerTitle: Layers,
  badgeTag: Layers,
  footerTag: Layers,
  watermark: Layers,
  slideCounter: Layers,
  free: Plus,
  icon: Shapes,
  image: FileImage,
};

// Design images already saved in the deck configuration (Deck & Font Settings)
// that can be dropped straight into the slide as banner/image boxes.
const CONFIG_IMAGE_SOURCES: { label: string; hint: string; get: (c: DeckConfig) => string | undefined }[] = [
  { label: 'Brand Logo', hint: 'logoUrl', get: c => c.logoUrl || undefined },
  { label: 'Header Banner', hint: 'headerBannerUrl', get: c => c.headerBannerUrl },
  { label: 'Footer Banner', hint: 'footerBannerUrl', get: c => c.footerBannerUrl },
  { label: 'Watermark Avatar', hint: 'watermarkAvatar', get: c => c.watermarkAvatar || undefined },
  { label: 'Background Image', hint: 'bgImageUrl', get: c => c.bgImageUrl },
];

type PanelTab = 'style' | 'text' | 'elements' | 'photos' | 'layouts';

interface SlideTextBoxPanelProps {
  boxes: SlideTextBox[];
  selectedId: string | null;
  selectedIds?: string[];
  appTheme: 'dark' | 'light';
  config: DeckConfig; // effective config (global + active-slide overrides)
  textBoxScope: 'global' | 'slide';
  hasTextBoxOverride: boolean;
  onChangeTextBoxScope: (scope: 'global' | 'slide') => void;
  onRevertTextBoxOverride: () => void;
  onApplySlideLayoutToAll: () => void;
  onAddBox: (bind: SlideTextBoxBind) => void;
  onAddElement: (elementId: string, extra?: { imageUrl?: string; iconName?: string }) => void;
  onAddLayout: (layoutId: string) => void;
  onUpdateBox: (id: string, patch: Partial<SlideTextBox>) => void;
  onUpdateBoxes?: (ids: string[], patch: Partial<SlideTextBox>) => void;
  onDeleteBox: (id: string) => void;
  onDeleteBoxes?: (ids: string[]) => void;
  onDuplicateBox: (id: string) => void;
  onDuplicateBoxes?: (ids: string[]) => void;
  onReorderBox: (id: string, dir: 'up' | 'down') => void;
  onMoveBox?: (dragId: string, overId: string) => void;
  onMoveBoxes?: (updates: { id: string; x: number; y: number }[]) => void;
  onSelectBox: (id: string | null) => void;
  onSelectIds?: (ids: string[]) => void;
  onReset: () => void;
  onClearAll: () => void;
  onClose: () => void;
}

interface SortableLayerRowProps {
  box: SlideTextBox;
  arrIdx: number;
  isSel: boolean;
  isTop: boolean;
  isBottom: boolean;
  isAppLight: boolean;
  onSelectBox: (id: string) => void;
  onReorderBox: (id: string, dir: 'up' | 'down') => void;
}

const SortableLayerRow: React.FC<SortableLayerRowProps> = ({
  box,
  arrIdx,
  isSel,
  isTop,
  isBottom,
  isAppLight,
  onSelectBox,
  onReorderBox,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: box.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={() => onSelectBox(box.id)}
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
        isDragging ? 'opacity-40' : ''
      } ${
        isSel
          ? isAppLight
            ? 'bg-amber-50 border-amber-400'
            : 'bg-amber-500/10 border-amber-500/50'
          : isAppLight
          ? 'bg-white border-slate-200 hover:border-slate-300'
          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        title="Drag to reorder layer"
        className={`p-1 rounded-md shrink-0 cursor-grab active:cursor-grabbing touch-none ${
          isAppLight ? 'text-slate-400 hover:bg-slate-200 hover:text-slate-700' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <span className={`w-5 h-5 rounded-md text-[9px] font-black flex items-center justify-center shrink-0 ${
        isSel ? 'bg-amber-500 text-slate-950' : isAppLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-slate-400'
      }`}>
        {arrIdx + 1}
      </span>
      <span className={`text-[11px] font-extrabold uppercase flex-1 min-w-0 truncate ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
        {box.bind}
      </span>
      <span className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onReorderBox(box.id, 'down')}
          disabled={isTop}
          className={`p-1 rounded-md transition-colors disabled:opacity-20 cursor-pointer ${
            isAppLight ? 'text-slate-500 hover:bg-slate-200' : 'text-slate-400 hover:bg-slate-800'
          }`}
          title="Move up in layer (bring to front)"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onReorderBox(box.id, 'up')}
          disabled={isBottom}
          className={`p-1 rounded-md transition-colors disabled:opacity-20 cursor-pointer ${
            isAppLight ? 'text-slate-500 hover:bg-slate-200' : 'text-slate-400 hover:bg-slate-800'
          }`}
          title="Move down in layer (send to back)"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </span>
    </div>
  );
};

const ElementMockupPreview: React.FC<{ elId: string; isAppLight: boolean }> = ({ elId, isAppLight }) => {
  switch (elId) {
    case 'callout':
      return (
        <div className="w-full h-12 rounded-xl bg-amber-950/40 border border-amber-500/40 p-2 flex items-center gap-2 overflow-hidden shadow-inner">
          <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-md">💡</div>
          <div className="flex-1 space-y-1">
            <div className="h-1.5 w-3/4 rounded bg-amber-300/90" />
            <div className="h-1 w-1/2 rounded bg-amber-200/50" />
          </div>
        </div>
      );
    case 'formula':
      return (
        <div className="w-full h-12 rounded-xl bg-slate-950 border border-sky-500/40 p-2 flex items-center justify-center overflow-hidden font-mono text-[10px] text-sky-400 font-extrabold shadow-inner">
          E = mc²  |  f(x) = ∫₀^∞
        </div>
      );
    case 'quote':
      return (
        <div className="w-full h-12 rounded-xl bg-slate-900/90 border border-white/20 p-2 flex items-center gap-2 overflow-hidden shadow-inner">
          <Quote className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex-1 italic text-[9px] text-slate-200 truncate">
            "Education is the training of mind..."
          </div>
        </div>
      );
    case 'takeaway':
      return (
        <div className="w-full h-12 rounded-xl bg-emerald-950/90 border border-emerald-500/50 p-2 flex items-center gap-1.5 overflow-hidden shadow-inner">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="flex-1 text-[9px] font-black text-emerald-200 truncate">
            KEY TAKEAWAY: Core Concept...
          </div>
        </div>
      );
    case 'instructor':
      return (
        <div className="w-full h-12 rounded-xl bg-slate-950 border border-amber-500/40 p-2 flex items-center gap-2 overflow-hidden shadow-inner">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-md">HS</div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-black text-white truncate">Hasnat Shuvro</div>
            <div className="text-[8px] font-bold text-amber-300 truncate">Senior Instructor</div>
          </div>
        </div>
      );
    case 'stathighlight':
      return (
        <div className="w-full h-12 rounded-xl bg-sky-950/80 border border-sky-400/40 p-2 flex items-center justify-center gap-1.5 overflow-hidden shadow-inner">
          <Zap className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-[10px] font-black text-sky-300 tracking-wide">98% SUCCESS</span>
        </div>
      );
    case 'alert':
      return (
        <div className="w-full h-12 rounded-xl bg-rose-950/90 border border-rose-500/50 p-2 flex items-center gap-2 overflow-hidden shadow-inner">
          <HelpCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <div className="flex-1 text-[9px] font-black text-rose-200 truncate">⚠️ EXAM WARNING...</div>
        </div>
      );
    case 'divider':
      return (
        <div className="w-full h-12 rounded-xl bg-slate-950 border border-slate-800 p-2 flex items-center justify-center overflow-hidden shadow-inner">
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
        </div>
      );
    case 'pill_header':
      return (
        <div className="w-full h-12 rounded-xl bg-slate-950 border border-slate-800 p-2 flex items-center justify-center overflow-hidden shadow-inner">
          <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-[9px] font-black text-amber-300">HEADER PILL</div>
        </div>
      );
    case 'rounded_options':
      return (
        <div className="w-full h-12 rounded-xl bg-slate-950 border border-slate-800 p-1.5 grid grid-cols-2 gap-1 overflow-hidden shadow-inner">
          <div className="rounded-lg bg-amber-500/20 border border-amber-400/40 p-1 flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-400 text-[7px] font-black text-slate-950 flex items-center justify-center">ক</div><div className="h-1 flex-1 bg-amber-200/50 rounded" /></div>
          <div className="rounded-lg bg-white/10 p-1 flex items-center gap-1"><div className="w-3 h-3 rounded bg-white/20 text-[7px] font-black text-white flex items-center justify-center">খ</div><div className="h-1 flex-1 bg-white/30 rounded" /></div>
        </div>
      );
    case 'option_pills':
      return (
        <div className="w-full h-12 rounded-xl bg-slate-950 border border-slate-800 p-1.5 flex items-center gap-1.5 overflow-hidden shadow-inner">
          <div className="px-2 py-1 rounded-full bg-amber-500/30 border border-amber-400 text-[8px] font-black text-amber-200 truncate">Option A</div>
          <div className="px-2 py-1 rounded-full bg-white/10 text-[8px] font-bold text-slate-300 truncate">Option B</div>
        </div>
      );
    case 'banner_image':
      return (
        <div className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-sky-500/20 border border-white/20 p-2 flex items-center justify-center gap-1.5 shadow-inner">
          <LayoutTemplate className="w-4 h-4 text-purple-300" />
          <span className="text-[9px] font-bold text-purple-200">Banner Image</span>
        </div>
      );
    case 'icon':
      return (
        <div className="w-full h-12 rounded-xl bg-slate-950 border border-amber-500/40 p-2 flex items-center justify-center shadow-inner">
          <Star className="w-6 h-6 text-amber-400 fill-amber-400/20" />
        </div>
      );
    default:
      return null;
  }
};

const BindMockupPreview: React.FC<{ bind: SlideTextBoxBind; isAppLight: boolean }> = ({ bind, isAppLight }) => {
  switch (bind) {
    case 'stem':
      return (
        <div className="w-full h-10 rounded-lg bg-slate-900 border border-amber-500/30 p-1.5 flex flex-col justify-center space-y-1 overflow-hidden shadow-inner">
          <div className="w-3/4 h-1.5 rounded bg-white font-black" />
          <div className="w-1/2 h-1 rounded bg-slate-400" />
        </div>
      );
    case 'options':
      return (
        <div className="w-full h-10 rounded-lg bg-slate-900 border border-slate-700 p-1 grid grid-cols-2 gap-1 overflow-hidden shadow-inner">
          <div className="rounded bg-amber-500/20 border border-amber-400/40 p-0.5 flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-amber-400 text-[6px] font-black text-slate-950 flex items-center justify-center">ক</div><div className="h-0.5 flex-1 bg-amber-200/60 rounded" /></div>
          <div className="rounded bg-white/10 p-0.5 flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-white/20 text-[6px] font-black text-white flex items-center justify-center">খ</div><div className="h-0.5 flex-1 bg-white/40 rounded" /></div>
        </div>
      );
    case 'answer':
      return (
        <div className="w-full h-10 rounded-lg bg-emerald-950/80 border border-emerald-500/50 p-1.5 flex items-center justify-center gap-1 text-[9px] font-black text-emerald-300 shadow-inner">
          <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
          <span>উত্তর: ক</span>
        </div>
      );
    case 'explanation':
      return (
        <div className="w-full h-10 rounded-lg bg-emerald-950/90 border border-emerald-500/40 p-1.5 flex items-center gap-1 overflow-hidden shadow-inner">
          <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="text-[8px] font-extrabold text-emerald-200 truncate">EXPLANATION: ব্যাখ্যা...</span>
        </div>
      );
    case 'passage':
      return (
        <div className="w-full h-10 rounded-lg bg-slate-900 border border-sky-500/40 p-1.5 flex flex-col justify-center space-y-1 overflow-hidden shadow-inner">
          <div className="w-full h-1 bg-sky-300/80 rounded" />
          <div className="w-4/5 h-1 bg-slate-400/60 rounded" />
        </div>
      );
    case 'prompt':
      return (
        <div className="w-full h-10 rounded-lg bg-slate-950 border border-amber-400/40 p-1.5 flex items-center justify-center text-[9px] font-black text-amber-300 shadow-inner">
          নিচের কোনটি সঠিক?
        </div>
      );
    case 'roman':
      return (
        <div className="w-full h-10 rounded-lg bg-slate-950 border border-slate-800 p-1 flex items-center gap-1 overflow-hidden shadow-inner">
          <span className="px-1 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[7px] font-black">i</span>
          <div className="h-1 flex-1 bg-slate-300 rounded" />
        </div>
      );
    case 'source':
      return (
        <div className="w-full h-10 rounded-lg bg-slate-900 border border-amber-500/30 p-1.5 flex items-center justify-end text-[8px] font-black text-amber-400 shadow-inner">
          চট্টগ্রাম বোর্ড ২০১৭
        </div>
      );
    case 'questionNumber':
      return (
        <div className="w-full h-10 rounded-lg bg-amber-400 text-slate-950 p-1 flex items-center justify-center font-black text-xs shadow-inner">
          <span>১</span>
        </div>
      );
    case 'brand':
      return (
        <div className="w-full h-10 rounded-lg bg-slate-950 border border-amber-500/30 p-1.5 flex items-center text-[9px] font-black text-amber-400 shadow-inner">
          NOBEL'S CLASSROOM
        </div>
      );
    case 'headerTitle':
      return (
        <div className="w-full h-10 rounded-lg bg-slate-950 border border-slate-800 p-1.5 flex items-center text-[9px] font-bold text-white shadow-inner">
          অধ্যায় ৮ঃ রেচন প্রক্রিয়া
        </div>
      );
    case 'badgeTag':
      return (
        <div className="w-full h-10 rounded-lg bg-amber-500/15 border border-amber-400/40 p-1 flex items-center justify-center text-[8px] font-black text-amber-300 rounded-full shadow-inner">
          biology badge
        </div>
      );
    case 'footerTag':
      return (
        <div className="w-full h-10 rounded-lg bg-slate-950 border border-amber-500/20 p-1.5 flex items-center justify-end text-[8px] font-black text-amber-400 shadow-inner">
          BIOMISSION
        </div>
      );
    case 'watermark':
      return (
        <div className="w-full h-10 rounded-lg bg-slate-950 border border-amber-400/30 p-1 flex items-center gap-1.5 shadow-inner">
          <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-[7px]">HS</div>
          <span className="text-[8px] font-bold text-white truncate">Hasnat Shuvro</span>
        </div>
      );
    case 'slideCounter':
      return (
        <div className="w-full h-10 rounded-lg bg-slate-950 border border-slate-800 p-1 flex items-center justify-center font-mono text-[9px] font-black text-amber-300 shadow-inner">
          ১ / ১
        </div>
      );
    case 'free':
    default:
      return (
        <div className="w-full h-10 rounded-lg bg-slate-900 border border-slate-700 p-1.5 flex items-center text-[9px] font-semibold text-slate-300 shadow-inner">
          Custom Written Text...
        </div>
      );
  }
};

export const SlideTextBoxPanel: React.FC<SlideTextBoxPanelProps> = ({
  boxes,
  selectedId,
  selectedIds,
  appTheme,
  config,
  textBoxScope,
  hasTextBoxOverride,
  onChangeTextBoxScope,
  onRevertTextBoxOverride,
  onApplySlideLayoutToAll,
  onAddBox,
  onAddElement,
  onAddLayout,
  onUpdateBox,
  onUpdateBoxes,
  onDeleteBox,
  onDeleteBoxes,
  onDuplicateBox,
  onDuplicateBoxes,
  onReorderBox,
  onMoveBox,
  onMoveBoxes,
  onSelectBox,
  onSelectIds,
  onReset,
  onClearAll,
  onClose,
}) => {
  const isAppLight = appTheme === 'light';
  const activeSelectedIds = selectedIds ?? (selectedId ? [selectedId] : []);
  const selectedBox = boxes.find(b => b.id === (activeSelectedIds[0] ?? selectedId)) || null;
  const imageInputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const availableImportSources = CONFIG_IMAGE_SOURCES.filter(src => src.get(config));

  // Studio-like behavior: selecting a box on the canvas jumps to the Style tab.
  const prevSelected = useRef<string | null>(null);
  const [activeTab, setActiveTab] = useState<PanelTab>('text');
  useEffect(() => {
    const curFirst = activeSelectedIds[0] ?? selectedId;
    if (curFirst && prevSelected.current !== curFirst) setActiveTab('style');
    prevSelected.current = curFirst ?? null;
  }, [selectedId, activeSelectedIds]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (selectedBox?.bind === 'image') {
        onUpdateBox(selectedBox.id, { imageUrl: dataUrl });
      } else {
        onAddElement('banner_image', { imageUrl: dataUrl });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleBatchFontSizeDelta = (delta: number) => {
    if (activeSelectedIds.length === 0) return;
    activeSelectedIds.forEach(id => {
      const b = boxes.find(x => x.id === id);
      if (b) {
        const curSize = b.fontSize || 16;
        onUpdateBox(id, { fontSize: Math.max(10, curSize + delta) });
      }
    });
  };

  const handleBatchFontSizeExact = (sz: number) => {
    if (!sz || activeSelectedIds.length === 0) return;
    if (onUpdateBoxes) {
      onUpdateBoxes(activeSelectedIds, { fontSize: sz });
    } else {
      activeSelectedIds.forEach(id => onUpdateBox(id, { fontSize: sz }));
    }
  };

  const handleAlignSelected = (type: 'left' | 'center' | 'right' | 'top' | 'distributeV') => {
    const selBoxes = boxes.filter(b => activeSelectedIds.includes(b.id));
    if (selBoxes.length < 2) return;

    if (type === 'left') {
      const minX = Math.min(...selBoxes.map(b => b.x));
      selBoxes.forEach(b => onUpdateBox(b.id, { x: minX }));
    } else if (type === 'center') {
      const avgCenterX = Math.round(selBoxes.reduce((acc, b) => acc + (b.x + b.w / 2), 0) / selBoxes.length);
      selBoxes.forEach(b => onUpdateBox(b.id, { x: Math.max(0, avgCenterX - Math.round(b.w / 2)) }));
    } else if (type === 'right') {
      const maxRight = Math.max(...selBoxes.map(b => b.x + b.w));
      selBoxes.forEach(b => onUpdateBox(b.id, { x: maxRight - b.w }));
    } else if (type === 'top') {
      const minY = Math.min(...selBoxes.map(b => b.y));
      selBoxes.forEach(b => onUpdateBox(b.id, { y: minY }));
    } else if (type === 'distributeV') {
      const sorted = [...selBoxes].sort((a, b) => a.y - b.y);
      const minY = sorted[0].y;
      const maxY = sorted[sorted.length - 1].y;
      const step = (maxY - minY) / (sorted.length - 1 || 1);
      sorted.forEach((b, idx) => onUpdateBox(b.id, { y: Math.round(minY + idx * step) }));
    }
  };

  const tabBtn = (tab: PanelTab, Icon: typeof Layers, label: string, extra?: React.ReactNode) => (
    <button
      key={tab}
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
        activeTab === tab
          ? 'bg-amber-500 text-slate-950 shadow-md'
          : isAppLight
          ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      {extra}
    </button>
  );

  return (
    <div
      className={`border rounded-3xl flex flex-col ${
        isAppLight ? 'bg-white/60 border-slate-200' : 'bg-slate-900/80 border-slate-800'
      } xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:pr-1`}
    >
      <div className="p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 shadow-lg shadow-amber-500/25 shrink-0">
              <Layers className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-sm font-black uppercase tracking-wider ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                Text Box Editor
              </h3>
              <p className={`text-[10px] font-semibold ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {activeSelectedIds.length > 1
                  ? `${activeSelectedIds.length} items selected (Combined Mode)`
                  : selectedBox
                  ? `Editing: ${selectedBox.bind}`
                  : `${boxes.length} box${boxes.length === 1 ? '' : 'es'} on the slide`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors cursor-pointer shrink-0 ${
              isAppLight ? 'bg-slate-100 text-slate-500 hover:text-slate-900 border-slate-200' : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
            }`}
            title="Close editor and return to the question list"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Multi-Selection Combined Actions Banner */}
        {activeSelectedIds.length > 1 && (
          <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${
            isAppLight ? 'bg-amber-50/90 border-amber-200 text-slate-800' : 'bg-amber-500/10 border-amber-500/30 text-amber-100'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider">{activeSelectedIds.length} Items Selected</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onSelectIds) onSelectIds([]);
                  else onSelectBox(null);
                }}
                className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer"
              >
                Deselect All
              </button>
            </div>

            {/* Batch Font Size Controls */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold opacity-80">Batch Font Size</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBatchFontSizeDelta(-2)}
                  className="px-3 py-1.5 rounded-lg border text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 cursor-pointer"
                >
                  -2px
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchFontSizeDelta(+2)}
                  className="px-3 py-1.5 rounded-lg border text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 cursor-pointer"
                >
                  +2px
                </button>
                <select
                  onChange={(e) => handleBatchFontSizeExact(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-lg border text-xs bg-slate-900 text-white border-slate-700 cursor-pointer"
                >
                  <option value="">Set Exact Size...</option>
                  {[14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64].map(sz => (
                    <option key={sz} value={sz}>{sz}px</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Batch Alignment Tools */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold opacity-80">Batch Alignment & Distribution</label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAlignSelected('left')}
                  title="Align Left Edges"
                  className="px-2.5 py-1 rounded-lg border text-[11px] font-bold bg-slate-800 text-white hover:bg-slate-700 cursor-pointer"
                >
                  Align Left
                </button>
                <button
                  type="button"
                  onClick={() => handleAlignSelected('center')}
                  title="Align Horizontal Center"
                  className="px-2.5 py-1 rounded-lg border text-[11px] font-bold bg-slate-800 text-white hover:bg-slate-700 cursor-pointer"
                >
                  Align Center
                </button>
                <button
                  type="button"
                  onClick={() => handleAlignSelected('right')}
                  title="Align Right Edges"
                  className="px-2.5 py-1 rounded-lg border text-[11px] font-bold bg-slate-800 text-white hover:bg-slate-700 cursor-pointer"
                >
                  Align Right
                </button>
                <button
                  type="button"
                  onClick={() => handleAlignSelected('top')}
                  title="Align Top Edges"
                  className="px-2.5 py-1 rounded-lg border text-[11px] font-bold bg-slate-800 text-white hover:bg-slate-700 cursor-pointer"
                >
                  Align Top
                </button>
                <button
                  type="button"
                  onClick={() => handleAlignSelected('distributeV')}
                  title="Distribute Vertically"
                  className="px-2.5 py-1 rounded-lg border text-[11px] font-bold bg-slate-800 text-white hover:bg-slate-700 cursor-pointer"
                >
                  Distribute Vertically
                </button>
              </div>
            </div>

            {/* Batch Duplicate & Delete */}
            <div className="flex items-center gap-2 pt-2 border-t border-amber-500/20">
              <button
                type="button"
                onClick={() => {
                  if (onDuplicateBoxes) onDuplicateBoxes(activeSelectedIds);
                  else activeSelectedIds.forEach(id => onDuplicateBox(id));
                }}
                className="flex-1 px-3 py-1.5 rounded-xl border text-xs font-black bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer shadow"
              >
                Duplicate Selected ({activeSelectedIds.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteBoxes) onDeleteBoxes(activeSelectedIds);
                  else activeSelectedIds.forEach(id => onDeleteBox(id));
                }}
                className="flex-1 px-3 py-1.5 rounded-xl border text-xs font-black bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 cursor-pointer shadow"
              >
                Delete Selected ({activeSelectedIds.length})
              </button>
            </div>
          </div>
        )}

        {/* Compact scope segmented control — "This Slide" is default/first */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeTextBoxScope('slide')}
            title="Apply changes to the current slide only (default)"
            className={`flex-1 px-3 py-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
              textBoxScope === 'slide'
                ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-400/50'
                : isAppLight
                ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            This Slide
          </button>
          <button
            type="button"
            onClick={() => onChangeTextBoxScope('global')}
            title="Apply changes to every slide in the deck"
            className={`flex-1 px-3 py-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
              textBoxScope === 'global'
                ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/50'
                : isAppLight
                ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            All Slides
          </button>
          {hasTextBoxOverride && (
            <button
              type="button"
              onClick={onRevertTextBoxOverride}
              className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                isAppLight ? 'bg-white border-rose-300 text-rose-500 hover:bg-rose-50' : 'bg-slate-950 border-rose-500/40 text-rose-300 hover:border-rose-500'
              }`}
              title="Remove this slide's custom boxes and use the deck-wide layout again"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Promote this slide's design to every slide */}
        {hasTextBoxOverride && (
          <button
            type="button"
            onClick={onApplySlideLayoutToAll}
            className={`w-full px-3 py-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
              isAppLight
                ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
            }`}
            title="Make this slide's theme and text-box layout the design for every slide in the deck"
          >
            <Copy className="w-3.5 h-3.5" />
            Use This Layout for All Slides
          </button>
        )}

        {/* Studio-style tab bar */}
        <div className={`flex items-center gap-1 p-1 rounded-2xl border overflow-x-auto ${
          isAppLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          {selectedBox && tabBtn('style', Palette, 'Style')}
          {tabBtn('text', Type, 'Text')}
          {tabBtn('elements', Wand2, 'Elements')}
          {tabBtn('photos', ImageIcon, 'Photos')}
          {tabBtn('layouts', LayoutTemplate, 'Layouts')}
        </div>
      </div>

      {/* Body — one tab at a time, studio layout */}
      <div className="px-5 pb-5 space-y-4">
        {/* ============ STYLE TAB (contextual, only when a box is selected) ============ */}
        {activeTab === 'style' && selectedBox && (
          <>
            {/* Layer list */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <span className={`text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                Layers ({boxes.length})
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event: DragEndEvent) => {
                    if (!onMoveBox) return;
                    const { active, over } = event;
                    if (over && active.id !== over.id) {
                      onMoveBox(String(active.id), String(over.id));
                    }
                  }}
                >
                  <SortableContext
                    items={[...boxes].reverse().map(b => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {[...boxes].reverse().map((box, ri) => {
                      const arrIdx = boxes.length - 1 - ri;
                      const isSel = box.id === selectedBox.id;
                      const isTop = arrIdx === boxes.length - 1;
                      const isBottom = arrIdx === 0;
                      return (
                        <SortableLayerRow
                          key={box.id}
                          box={box}
                          arrIdx={arrIdx}
                          isSel={isSel}
                          isTop={isTop}
                          isBottom={isBottom}
                          isAppLight={isAppLight}
                          onSelectBox={onSelectBox}
                          onReorderBox={onReorderBox}
                        />
                      );
                    })}
                  </SortableContext>
                </DndContext>
              </div>
            </div>

            {/* Selected box style controls */}
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
                    onClick={() => onDuplicateBox(selectedBox.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                      isAppLight ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100' : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteBox(selectedBox.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                      isAppLight ? 'bg-white border-rose-300 text-rose-600 hover:bg-rose-50' : 'bg-slate-900 border-rose-500/40 text-rose-300 hover:border-rose-500'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-black mb-1.5 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Data Source / Binding:
                </label>
                <select
                  value={selectedBox.bind}
                  onChange={(e) => onUpdateBox(selectedBox.id, { bind: e.target.value as SlideTextBoxBind })}
                  className={`w-full border rounded-xl px-3 py-2 text-xs font-extrabold focus:outline-none focus:border-amber-500 ${
                    isAppLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                >
                  <optgroup label="Slide Data Fields (Auto-filled)">
                    <option value="stem">Question Stem (stem)</option>
                    <option value="options">Option Cards (options)</option>
                    <option value="answer">Answer Key (answer)</option>
                    <option value="explanation">Explanation (explanation)</option>
                    <option value="passage">Passage Text (passage)</option>
                    <option value="prompt">Prompt Line (prompt)</option>
                    <option value="roman">Roman Statements (roman)</option>
                    <option value="source">Source Tag (source)</option>
                    <option value="questionNumber">Question Number Badge</option>
                    <option value="brand">Brand Name</option>
                    <option value="headerTitle">Header / Chapter Title</option>
                    <option value="badgeTag">Subject / Class Badge Tag</option>
                    <option value="footerTag">Footer Brand Tag</option>
                    <option value="watermark">Watermark / Instructor Handle</option>
                    <option value="slideCounter">Page Counter (1 / 1)</option>
                  </optgroup>
                  <optgroup label="Custom Written Content">
                    <option value="free">Free Text (Custom Written Text)</option>
                    <option value="icon">Decorative Icon</option>
                    <option value="image">Banner / Picture Box</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Font Family: <span className="font-semibold text-[10px] normal-case">(default: deck font)</span>
                </label>
                <select
                  value={selectedBox.fontFamily || ''}
                  onChange={(e) => onUpdateBox(selectedBox.id, { fontFamily: e.target.value || undefined })}
                  className={`w-full border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500 ${
                    isAppLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                >
                  <option value="">
                    {selectedBox.bind === 'headerTitle' || selectedBox.bind === 'brand'
                      ? `Header font (${config.headerFont || config.fontFamily || "'Kalpurush', serif"})`
                      : selectedBox.bind === 'options' || selectedBox.bind === 'answer'
                      ? `Options font (${config.optionsFont || config.fontFamily || "'Kalpurush', serif"})`
                      : selectedBox.bind === 'footerTag' || selectedBox.bind === 'watermark'
                      ? `Footer font (${config.footerFont || config.fontFamily || "'Kalpurush', serif"})`
                      : `Body font (${config.bodyFont || config.fontFamily || "'Kalpurush', serif"})`}
                  </option>
                  {FONT_PRESETS.map(font => (
                    <option key={font.id} value={font.family}>{font.name}</option>
                  ))}
                </select>
              </div>

              {selectedBox.bind !== 'options' && selectedBox.bind !== 'icon' && selectedBox.bind !== 'image' && (
                <div className="space-y-1.5 p-3 rounded-2xl border bg-amber-500/5 border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-extrabold flex items-center gap-1.5 ${isAppLight ? 'text-amber-900' : 'text-amber-300'}`}>
                      <Type className="w-3.5 h-3.5 text-amber-500" />
                      <span>Text Content / Custom Text:</span>
                    </label>
                    {selectedBox.text !== undefined && selectedBox.text !== '' && selectedBox.bind !== 'free' && (
                      <button
                        type="button"
                        onClick={() => onUpdateBox(selectedBox.id, { text: undefined })}
                        className="text-[10px] font-bold text-amber-500 hover:underline flex items-center gap-1 cursor-pointer"
                        title="Revert to dynamic content from deck data"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Revert to Default
                      </button>
                    )}
                  </div>
                  <textarea
                    value={selectedBox.text !== undefined ? selectedBox.text : (selectedBox.bind === 'free' ? '' : selectedBox.text || '')}
                    onChange={(e) => onUpdateBox(selectedBox.id, { text: e.target.value })}
                    rows={selectedBox.bind === 'stem' || selectedBox.bind === 'passage' || selectedBox.bind === 'explanation' || selectedBox.bind === 'free' ? 4 : 2}
                    placeholder={selectedBox.bind === 'free' ? 'Type custom text content here...' : 'Type to override box content...'}
                    className={`w-full border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-amber-500 ${
                      isAppLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                  <p className={`text-[10px] ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {selectedBox.bind === 'free'
                      ? 'Custom text box. Type anything to display on slide.'
                      : `Edit to customize text for this ${selectedBox.bind} text box.`}
                  </p>
                </div>
              )}

              {selectedBox.bind === 'icon' && (
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Icon:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SLIDE_ICON_LIBRARY.map(ic => (
                      <button
                        key={ic.name}
                        type="button"
                        title={ic.label}
                        onClick={() => onUpdateBox(selectedBox.id, { iconName: ic.name })}
                        className={`p-2 rounded-lg border transition-all cursor-pointer ${
                          selectedBox.iconName === ic.name
                            ? 'bg-amber-500 border-amber-400 text-slate-950'
                            : isAppLight
                            ? 'bg-white border-slate-300 text-slate-600 hover:border-amber-300'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-500/40'
                        }`}
                      >
                        <ic.icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedBox.bind === 'image' && (
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Image / Banner:
                  </label>
                  {selectedBox.imageUrl && (
                    <img
                      src={selectedBox.imageUrl}
                      alt="banner preview"
                      className="w-full h-24 object-cover rounded-xl border mb-2"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      isAppLight
                        ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <ImagePlus className="w-4 h-4 text-amber-500" />
                    {selectedBox.imageUrl ? 'Replace Image' : 'Choose Image'}
                  </button>
                  <div className="mt-2">
                    <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Image URL:</label>
                    <input
                      type="text"
                      value={selectedBox.imageUrl || ''}
                      onChange={(e) => onUpdateBox(selectedBox.id, { imageUrl: e.target.value })}
                      placeholder="https://... or data:image/..."
                      className={`w-full border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-500 ${
                        isAppLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>
              )}

              {selectedBox.bind !== 'image' && (
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Shape:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SLIDE_SHAPE_OPTIONS.map(s => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => onUpdateBox(selectedBox.id, { shape: s.value })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          (selectedBox.shape || 'plain') === s.value
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : isAppLight
                            ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(selectedBox.shape && selectedBox.shape !== 'plain' || selectedBox.bind === 'image') && (
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    <span className="inline-flex items-center gap-1"><Palette className="w-3.5 h-3.5" /> Container Fill:</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="color"
                      value={selectedBox.bg || '#1e293b'}
                      onChange={(e) => onUpdateBox(selectedBox.id, { bg: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-white/20 bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateBox(selectedBox.id, { bg: 'rgba(255,255,255,0.06)' })}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        isAppLight ? 'bg-white border-slate-300 text-slate-600' : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      Subtle White
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateBox(selectedBox.id, { bg: 'rgba(251,191,36,0.14)' })}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        isAppLight ? 'bg-white border-slate-300 text-slate-600' : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      Amber Glow
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateBox(selectedBox.id, { bg: 'rgba(56,189,248,0.12)' })}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        isAppLight ? 'bg-white border-slate-300 text-slate-600' : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      Sky Glow
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Font Size: {selectedBox.fontSize}px
                </label>
                <input
                  type="range"
                  min={16}
                  max={140}
                  step={2}
                  value={selectedBox.fontSize}
                  onChange={(e) => onUpdateBox(selectedBox.id, { fontSize: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {(selectedBox.bind === 'icon' || selectedBox.bind === 'image') && (
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Box Height: {selectedBox.h || 'auto'}px
                  </label>
                  <input
                    type="range"
                    min={60}
                    max={900}
                    step={10}
                    value={selectedBox.h || 200}
                    onChange={(e) => onUpdateBox(selectedBox.id, { h: parseInt(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              )}

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <span className="inline-flex items-center gap-1"><Palette className="w-3.5 h-3.5" /> Text Color:</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {SLIDE_BOX_COLOR_PRESETS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onUpdateBox(selectedBox.id, { color: c })}
                      className={`w-6 h-6 rounded-lg border transition-transform hover:scale-110 ${
                        selectedBox.color === c ? 'ring-2 ring-amber-400 scale-110' : ''
                      } ${c === '#000000' ? 'border-slate-500' : 'border-white/20'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={selectedBox.color}
                    onChange={(e) => onUpdateBox(selectedBox.id, { color: e.target.value })}
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
                      onClick={() => onUpdateBox(selectedBox.id, { align: a })}
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
                  onClick={() => onUpdateBox(selectedBox.id, { bold: !selectedBox.bold })}
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
                Drag a box on the slide to move it. Use the corner handle to resize — icon &amp; image boxes scale proportionally. Bound boxes update automatically when you change the selected slide.
              </p>
            </div>
          </>
        )}

        {/* ============ TEXT TAB ============ */}
        {activeTab === 'text' && (
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className={`text-sm font-extrabold block ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
              Add Text Box (auto-fills from the current slide)
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {SLIDE_BOX_BINDS.map(btn => {
                const Icon = BIND_ICONS[btn.bind];
                return (
                  <button
                    key={btn.bind}
                    type="button"
                    onClick={() => onAddBox(btn.bind)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer hover:scale-[1.02] flex flex-col gap-2 group ${
                      isAppLight
                        ? 'bg-white border-slate-300 hover:border-amber-400 hover:bg-amber-50/50'
                        : 'bg-slate-900 border-slate-700 hover:border-amber-500/50'
                    }`}
                  >
                    <BindMockupPreview bind={btn.bind} isAppLight={isAppLight} />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className={`p-1 rounded-md shrink-0 ${isAppLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/10 text-amber-400'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className={`text-xs font-black truncate ${isAppLight ? 'text-slate-800' : 'text-slate-100'}`}>{btn.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ============ ELEMENTS TAB ============ */}
        {activeTab === 'elements' && (
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className={`text-sm font-extrabold flex items-center gap-2 ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
              <Wand2 className="w-4 h-4 text-amber-500" />
              Design Elements
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {SLIDE_ELEMENT_DEFS.map(el => (
                <button
                  key={el.id}
                  type="button"
                  onClick={() => {
                    if (el.id === 'banner_image') {
                      imageInputRef.current?.click();
                    } else if (el.id === 'icon') {
                      onAddElement('icon', { iconName: SLIDE_ICON_LIBRARY[0].name });
                    } else {
                      onAddElement(el.id);
                    }
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer hover:scale-[1.02] flex flex-col gap-2 group ${
                    isAppLight
                      ? 'bg-white border-slate-300 hover:border-amber-400 hover:bg-amber-50/50'
                      : 'bg-slate-900 border-slate-700 hover:border-amber-500/50'
                  }`}
                >
                  <ElementMockupPreview elId={el.id} isAppLight={isAppLight} />
                  <div className="flex items-start gap-1.5 min-w-0">
                    <div className={`p-1 rounded-md shrink-0 mt-0.5 ${isAppLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/10 text-amber-400'}`}>
                      <el.icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className={`block text-xs font-black truncate ${isAppLight ? 'text-slate-800' : 'text-slate-100'}`}>{el.label}</span>
                      <span className={`block text-[10px] font-semibold leading-tight truncate mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>{el.desc}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isAppLight
                  ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              }`}
            >
              <ImagePlus className="w-4 h-4" />
              Upload Image / Banner
            </button>
          </div>
        )}

        {/* ============ PHOTOS TAB ============ */}
        {activeTab === 'photos' && (
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className={`text-sm font-extrabold flex items-center gap-2 ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
              <Download className="w-4 h-4 text-amber-500" />
              Import from Deck Config
            </span>
            <p className={`text-[10px] leading-relaxed ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
              Reuse images already saved in <strong>Header &amp; Branding / Layout &amp; Banners</strong> settings.
              Click to place one on the slide — it fills the selected image box or adds a new banner.
            </p>
            {availableImportSources.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {availableImportSources.map(src => {
                  const url = src.get(config) as string;
                  const isActive = selectedBox?.bind === 'image' && selectedBox.imageUrl === url;
                  return (
                    <button
                      key={src.label}
                      type="button"
                      title={`${src.label} (${src.hint})`}
                      onClick={() => {
                        if (selectedBox?.bind === 'image') {
                          onUpdateBox(selectedBox.id, { imageUrl: url });
                        } else {
                          onAddElement('banner_image', { imageUrl: url });
                        }
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer hover:scale-[1.03] group flex flex-col gap-1.5 ${
                        isActive
                          ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/40'
                          : isAppLight
                          ? 'bg-white border-slate-300 hover:border-amber-300 hover:bg-amber-50/60'
                          : 'bg-slate-900 border-slate-700 hover:border-amber-500/40'
                      }`}
                    >
                      <span className="h-12 w-full overflow-hidden rounded-lg border border-white/10 bg-black/30 flex items-center justify-center">
                        <img src={url} alt={src.label} className="w-full h-full object-cover" draggable={false} />
                      </span>
                      <span className={`block text-[10px] font-extrabold leading-tight ${isAppLight ? 'text-slate-700' : 'text-slate-200'}`}>{src.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className={`text-[10px] rounded-xl border border-dashed p-3 text-center ${isAppLight ? 'bg-white border-slate-300 text-slate-500' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                No images saved yet — add a logo, header/footer banner or background in <strong>Deck &amp; Font Settings</strong> to see them here.
              </p>
            )}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isAppLight
                  ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              }`}
            >
              <ImagePlus className="w-4 h-4" />
              Upload Image / Banner
            </button>
          </div>
        )}

        {/* ============ LAYOUTS TAB ============ */}
        {activeTab === 'layouts' && (
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className={`text-sm font-extrabold flex items-center gap-2 ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
              <LayoutTemplate className="w-4 h-4 text-amber-500" />
              Quick Layouts
            </span>
            <div className="grid grid-cols-1 gap-3">
              {SLIDE_LAYOUTS.map(layout => (
                <button
                  key={layout.id}
                  type="button"
                  onClick={() => onAddLayout(layout.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer hover:scale-[1.02] group flex flex-col gap-2.5 ${
                    isAppLight
                      ? 'bg-white border-slate-300 hover:border-amber-400 hover:bg-amber-50/60'
                      : 'bg-slate-900 border-slate-700 hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg shrink-0 ${isAppLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/10 text-amber-400'}`}>
                        <SquareStack className="w-3.5 h-3.5" />
                      </div>
                      <span className={`text-xs font-black ${isAppLight ? 'text-slate-800' : 'text-slate-100'}`}>{layout.name}</span>
                    </div>
                    <Plus className={`w-4 h-4 shrink-0 ${isAppLight ? 'text-amber-600' : 'text-amber-500'} group-hover:rotate-90 transition-transform`} />
                  </div>

                  {/* Visual Layout Mockup Preview */}
                  <LayoutPreviewMockup layoutId={layout.id} isLight={isAppLight} />

                  <span className={`text-[10px] font-semibold leading-tight ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>{layout.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input shared by Elements + Photos tabs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Footer */}
      <div className="p-5 pt-0 flex gap-2">
        <button
          type="button"
          onClick={onReset}
          className={`flex-1 px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
            isAppLight ? 'bg-white border-amber-300 text-amber-700 hover:bg-amber-50' : 'bg-slate-900 border-amber-500/40 text-amber-300 hover:border-amber-500'
          }`}
        >
          Reset to Template Layout
        </button>
        <button
          type="button"
          onClick={onClearAll}
          className={`px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
            isAppLight ? 'bg-white border-rose-300 text-rose-600 hover:bg-rose-50' : 'bg-slate-900 border-rose-500/40 text-rose-300 hover:border-rose-500'
          }`}
          title="Remove all text boxes from every slide"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};
