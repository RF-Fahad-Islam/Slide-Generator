import React, { useRef, useState, useEffect } from 'react';
import { DeckConfig, SlideTextBox, SlideTextBoxBind } from '../types';
import { SLIDE_BOX_BINDS, SLIDE_BOX_COLOR_PRESETS } from '../utils/slideTextBoxes';
import { FONT_PRESETS } from '../utils/fontPresets';
import {
  SLIDE_ICON_LIBRARY,
  SLIDE_ELEMENT_DEFS,
  SLIDE_LAYOUTS,
  SLIDE_SHAPE_OPTIONS,
} from '../utils/slideElements';
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
  ChevronUp,
  ChevronDown,
  Type,
  Image as ImageIcon,
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
  onDeleteBox: (id: string) => void;
  onDuplicateBox: (id: string) => void;
  onReorderBox: (id: string, dir: 'up' | 'down') => void;
  onSelectBox: (id: string | null) => void;
  onReset: () => void;
  onClearAll: () => void;
  onClose: () => void;
}

export const SlideTextBoxPanel: React.FC<SlideTextBoxPanelProps> = ({
  boxes,
  selectedId,
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
  onDeleteBox,
  onDuplicateBox,
  onReorderBox,
  onSelectBox,
  onReset,
  onClearAll,
  onClose,
}) => {
  const isAppLight = appTheme === 'light';
  const selectedBox = boxes.find(b => b.id === selectedId) || null;
  const imageInputRef = useRef<HTMLInputElement>(null);
  const availableImportSources = CONFIG_IMAGE_SOURCES.filter(src => src.get(config));

  // Studio-like behavior: selecting a box on the canvas jumps to the Style tab.
  const prevSelected = useRef<string | null>(null);
  const [activeTab, setActiveTab] = useState<PanelTab>('text');
  useEffect(() => {
    if (selectedId && prevSelected.current !== selectedId) setActiveTab('style');
    prevSelected.current = selectedId;
  }, [selectedId]);

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
      className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} border rounded-3xl flex flex-col ${
        isAppLight ? 'border-slate-200' : 'bg-slate-900/80 border-slate-800'
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
                {selectedBox ? `Editing: ${selectedBox.bind}` : `${boxes.length} box${boxes.length === 1 ? '' : 'es'} on the slide`}
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

        {/* Compact scope segmented control */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeTextBoxScope('global')}
            title="Apply changes to every slide"
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
          <button
            type="button"
            onClick={() => onChangeTextBoxScope('slide')}
            title="Apply changes to the current slide only"
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
                {[...boxes].reverse().map((box, ri) => {
                  const arrIdx = boxes.length - 1 - ri;
                  const isSel = box.id === selectedBox.id;
                  const isTop = arrIdx === boxes.length - 1;
                  const isBottom = arrIdx === 0;
                  return (
                    <div
                      key={box.id}
                      onClick={() => onSelectBox(box.id)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        isSel
                          ? isAppLight
                            ? 'bg-amber-50 border-amber-400'
                            : 'bg-amber-500/10 border-amber-500/50'
                          : isAppLight
                          ? 'bg-white border-slate-200 hover:border-slate-300'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
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
                })}
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
                <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Bind To:</label>
                <select
                  value={selectedBox.bind}
                  onChange={(e) => onUpdateBox(selectedBox.id, { bind: e.target.value as SlideTextBoxBind })}
                  className={`w-full border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500 ${
                    isAppLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                >
                  {SLIDE_BOX_BINDS.map(opt => (
                    <option key={opt.bind} value={opt.bind}>{opt.label.replace('+ ', '')}</option>
                  ))}
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

              {selectedBox.bind === 'free' && (
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Text Content:</label>
                  <textarea
                    value={selectedBox.text || ''}
                    onChange={(e) => onUpdateBox(selectedBox.id, { text: e.target.value })}
                    rows={3}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                      isAppLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
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
            <div className="grid grid-cols-2 gap-2">
              {SLIDE_BOX_BINDS.map(btn => {
                const Icon = BIND_ICONS[btn.bind];
                return (
                  <button
                    key={btn.bind}
                    type="button"
                    onClick={() => onAddBox(btn.bind)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer hover:scale-[1.02] flex items-center gap-1.5 ${
                      isAppLight
                        ? 'bg-white border-slate-300 text-amber-700 hover:bg-amber-50 hover:border-amber-300'
                        : 'bg-slate-900 border-slate-700 text-amber-300 hover:border-amber-500/40'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {btn.label}
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
            <div className="grid grid-cols-2 gap-2">
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
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer hover:scale-[1.03] group ${
                    isAppLight
                      ? 'bg-white border-slate-300 hover:border-amber-300 hover:bg-amber-50/60'
                      : 'bg-slate-900 border-slate-700 hover:border-amber-500/40'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg w-fit mb-1.5 ${isAppLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/10 text-amber-400'}`}>
                    <el.icon className="w-4 h-4" />
                  </div>
                  <span className={`block text-xs font-extrabold ${isAppLight ? 'text-slate-800' : 'text-slate-100'}`}>{el.label}</span>
                  <span className={`block text-[10px] font-semibold leading-tight mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>{el.desc}</span>
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
            <div className="grid grid-cols-1 gap-2">
              {SLIDE_LAYOUTS.map(layout => (
                <button
                  key={layout.id}
                  type="button"
                  onClick={() => onAddLayout(layout.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer hover:scale-[1.02] group flex items-center gap-3 ${
                    isAppLight
                      ? 'bg-white border-slate-300 hover:border-amber-300 hover:bg-amber-50/60'
                      : 'bg-slate-900 border-slate-700 hover:border-amber-500/40'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${isAppLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/10 text-amber-400'}`}>
                    <SquareStack className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <span className={`block text-xs font-extrabold ${isAppLight ? 'text-slate-800' : 'text-slate-100'}`}>{layout.name}</span>
                    <span className={`block text-[10px] font-semibold leading-tight mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>{layout.desc}</span>
                  </div>
                  <Plus className={`w-4 h-4 shrink-0 ${isAppLight ? 'text-amber-600' : 'text-amber-500'} group-hover:rotate-90 transition-transform`} />
                </button>
              ))}
            </div>
            <p className={`text-[10px] leading-relaxed ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
              Applying a layout replaces the {textBoxScope === 'slide' ? 'active slide\'s' : 'deck-wide'} text boxes with a complete pre-designed set.
            </p>
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
