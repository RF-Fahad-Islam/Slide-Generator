import React, { useRef } from 'react';
import { DeckConfig, SlideTextBox, SlideTextBoxBind } from '../types';
import { SLIDE_BOX_BINDS, SLIDE_BOX_COLOR_PRESETS } from '../utils/slideTextBoxes';
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

interface SlideTextBoxPanelProps {
  boxes: SlideTextBox[];
  selectedId: string | null;
  appTheme: 'dark' | 'light';
  config: DeckConfig; // effective config (global + active-slide overrides)
  textBoxScope: 'global' | 'slide';
  hasTextBoxOverride: boolean;
  onChangeTextBoxScope: (scope: 'global' | 'slide') => void;
  onRevertTextBoxOverride: () => void;
  onAddBox: (bind: SlideTextBoxBind) => void;
  onAddElement: (elementId: string, extra?: { imageUrl?: string; iconName?: string }) => void;
  onAddLayout: (layoutId: string) => void;
  onUpdateBox: (id: string, patch: Partial<SlideTextBox>) => void;
  onDeleteBox: (id: string) => void;
  onDuplicateBox: (id: string) => void;
  onReset: () => void;
  onClearAll: () => void;
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
  onAddBox,
  onAddElement,
  onAddLayout,
  onUpdateBox,
  onDeleteBox,
  onDuplicateBox,
  onReset,
  onClearAll,
}) => {
  const isAppLight = appTheme === 'light';
  const selectedBox = boxes.find(b => b.id === selectedId) || null;
  const imageInputRef = useRef<HTMLInputElement>(null);
  const availableImportSources = CONFIG_IMAGE_SOURCES.filter(src => src.get(config));

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

  return (
    <div
      className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-6 border space-y-4 ${
        isAppLight ? 'border-slate-200' : 'bg-slate-900/80 border-slate-800'
      }`}
    >
      <label className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${isAppLight ? 'text-amber-600' : 'text-amber-400'}`}>
        <Layers className="w-4 h-4" />
        Slide Text Box Editor
      </label>

      {/* Apply scope: deck-wide (all slides) vs active slide only */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        isAppLight ? 'bg-amber-50/70 border-amber-300' : 'bg-slate-950 border-amber-500/40'
      }`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className={`text-sm font-extrabold flex items-center gap-2 ${isAppLight ? 'text-amber-700' : 'text-amber-300'}`}>
            <Target className="w-4 h-4" />
            Apply Box Changes To
          </span>
          {hasTextBoxOverride && (
            <button
              type="button"
              onClick={onRevertTextBoxOverride}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                isAppLight ? 'bg-white border-rose-300 text-rose-600 hover:bg-rose-50' : 'bg-slate-900 border-rose-500/40 text-rose-300 hover:border-rose-500'
              }`}
              title="Remove this slide's custom boxes and use the deck-wide layout again"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Slide to All-Slides
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChangeTextBoxScope('global')}
            className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              textBoxScope === 'global'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg ring-2 ring-amber-400/50'
                : isAppLight
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            All Slides
          </button>
          <button
            type="button"
            onClick={() => onChangeTextBoxScope('slide')}
            className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              textBoxScope === 'slide'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg ring-2 ring-indigo-400/50'
                : isAppLight
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" />
            Current Slide Only
          </button>
        </div>
        <p className={`text-[10px] leading-relaxed ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
          {textBoxScope === 'global'
            ? hasTextBoxOverride
              ? 'This slide has its own layout and keeps it. Switch to "Current Slide Only" to edit it, or reset it above.'
              : 'Boxes are saved deck-wide and appear on every slide.'
            : 'Boxes are saved for the active slide only — other slides keep the deck-wide layout.'}
        </p>
      </div>

      {/* Add text box buttons */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}>
        <span className={`text-sm font-extrabold block ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
          Add Text Box (auto-fills from the current slide)
        </span>
        <div className="flex flex-wrap gap-2">
          {SLIDE_BOX_BINDS.map(btn => {
            const Icon = BIND_ICONS[btn.bind];
            return (
              <button
                key={btn.bind}
                type="button"
                onClick={() => onAddBox(btn.bind)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer hover:scale-105 flex items-center gap-1.5 ${
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

      {/* Design Elements */}
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
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
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

      {/* Import images already saved in the deck configuration */}
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
      </div>

      {/* Icon picker */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}>
        <span className={`text-sm font-extrabold flex items-center gap-2 ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
          <Shapes className="w-4 h-4 text-amber-500" />
          Icon Library
          <span className="text-[10px] font-mono text-slate-500">({SLIDE_ICON_LIBRARY.length} lucide icons)</span>
        </span>
        <div className="grid grid-cols-6 gap-1.5 max-h-36 overflow-y-auto pr-1">
          {SLIDE_ICON_LIBRARY.map(ic => {
            const isActive = selectedBox?.bind === 'icon' && selectedBox.iconName === ic.name;
            return (
              <button
                key={ic.name}
                type="button"
                title={ic.label}
                onClick={() => {
                  if (selectedBox?.bind === 'icon') {
                    onUpdateBox(selectedBox.id, { iconName: ic.name });
                  } else {
                    onAddElement('icon', { iconName: ic.name });
                  }
                }}
                className={`p-2 rounded-lg border transition-all cursor-pointer hover:scale-110 flex flex-col items-center gap-1 ${
                  isActive
                    ? 'bg-amber-500 border-amber-400 text-slate-950'
                    : isAppLight
                    ? 'bg-white border-slate-300 text-slate-600 hover:border-amber-300 hover:text-amber-700'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-500/40 hover:text-amber-300'
                }`}
              >
                <ic.icon className="w-4 h-4" />
                <span className="text-[7px] font-bold uppercase leading-none truncate w-full text-center">{ic.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Layouts */}
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

          {/* Shape control for styled containers */}
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
      )}

      {!selectedBox && (
        <p className={`text-xs text-center py-2 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Click a box on the slide to edit its style.
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onReset}
          className={`flex-1 px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
            isAppLight ? 'bg-white border-amber-300 text-amber-700 hover:bg-amber-50' : 'bg-slate-900 border-amber-500/40 text-amber-300 hover:border-amber-500'
          }`}
        >
          Reset to Default Layout
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
