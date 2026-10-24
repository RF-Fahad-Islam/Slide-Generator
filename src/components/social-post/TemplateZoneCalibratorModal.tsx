import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SlideTextBox, MCQItem, SlideBoxShape } from '../../types';
import { SavedCustomTemplate, SocialAspectRatio } from './types';
import { calculateFittedFontSize, calculateFittedOptionsLayout } from '../../utils/textHeightEstimate';
import {
  X,
  Upload,
  Check,
  Move,
  Maximize2,
  Type,
  LayoutGrid,
  Sparkles,
  Sliders,
  AlignLeft,
  AlignCenter,
  Eye,
  Layers,
  HelpCircle,
  Crop,
  Palette,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface TemplateZoneCalibratorModalProps {
  open: boolean;
  initialImageUrl?: string;
  initialBoxes?: SlideTextBox[];
  sampleQuestion?: MCQItem;
  isAppLight: boolean;
  onClose: () => void;
  onSaveAndApply: (template: SavedCustomTemplate) => void;
}

type ActiveHandle = 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w' | 'move' | null;

interface EditableZone {
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize: number;
  color: string;
  align: 'left' | 'center' | 'right';
  bold: boolean;
  shape: SlideBoxShape;
  bg?: string;
  hideOptionBadges?: boolean;
  optionsLayout?: '1col' | '2col';
}

const DEFAULT_SAMPLE_ITEM: MCQItem = {
  id: 'preview_sample',
  questionType: 'standard',
  stem: 'যে সকল রাসায়নিক পদার্থ স্নায়ুতন্ত্রের মাধ্যমে সংকেত আদান-প্রদান করে তাদের কী বলে?',
  options: [
    { key: 'ক', text: 'হরমোন' },
    { key: 'খ', text: 'নিউরোট্রান্সমিটার' },
    { key: 'গ', text: 'এনজাইম' },
    { key: 'ঘ', text: 'অ্যান্টিবডি' },
  ],
  answer: 'খ',
};

export const TemplateZoneCalibratorModal: React.FC<TemplateZoneCalibratorModalProps> = ({
  open,
  initialImageUrl,
  initialBoxes,
  sampleQuestion = DEFAULT_SAMPLE_ITEM,
  isAppLight,
  onClose,
  onSaveAndApply,
}) => {
  const [imageUrl, setImageUrl] = useState<string>(initialImageUrl || '');
  const [imageNatW, setImageNatW] = useState<number>(864);
  const [imageNatH, setImageNatH] = useState<number>(1080);
  const [designW, setDesignW] = useState<number>(864);
  const [designH, setDesignH] = useState<number>(1080);
  const [aspectRatio, setAspectRatio] = useState<SocialAspectRatio>('custom');
  const [templateName, setTemplateName] = useState<string>('Custom Graphic Quiz Template');
  const [activeZoneTab, setActiveZoneTab] = useState<'stem' | 'options'>('stem');

  // Question Stem Zone
  const [stemZone, setStemZone] = useState<EditableZone>({
    x: 80,
    y: 450,
    w: 704,
    h: 210,
    fontSize: 40,
    color: '#0f172a',
    align: 'center',
    bold: true,
    shape: 'plain',
    bg: 'transparent',
  });

  // Options Zone
  const [optionsZone, setOptionsZone] = useState<EditableZone>({
    x: 80,
    y: 680,
    w: 704,
    h: 270,
    fontSize: 30,
    color: '#0f172a',
    align: 'left',
    bold: false,
    shape: 'plain',
    bg: 'transparent',
    hideOptionBadges: false,
    optionsLayout: '2col',
  });

  // Interaction dragging / resizing state
  const [dragTarget, setDragTarget] = useState<'stem' | 'options' | null>(null);
  const [activeHandle, setActiveHandle] = useState<ActiveHandle>(null);
  const [dragStartPos, setDragStartPos] = useState<{ mouseX: number; mouseY: number; box: EditableZone } | null>(null);

  const previewViewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(440);

  // Load natural dimensions whenever imageUrl changes
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.onload = () => {
      const natW = img.naturalWidth || 864;
      const natH = img.naturalHeight || 1080;
      setImageNatW(natW);
      setImageNatH(natH);

      const ratio = natW / natH;
      const targetH = 1080;
      const targetW = Math.round(targetH * ratio);
      setDesignW(targetW);
      setDesignH(targetH);

      // Check standard aspect ratios
      if (Math.abs(ratio - 1) < 0.03) {
        setAspectRatio('1:1');
      } else if (Math.abs(ratio - 0.8) < 0.03) {
        setAspectRatio('4:5');
      } else if (Math.abs(ratio - 9 / 16) < 0.03) {
        setAspectRatio('9:16');
      } else if (Math.abs(ratio - 16 / 9) < 0.03) {
        setAspectRatio('16:9');
      } else {
        setAspectRatio('custom');
      }

      // If initial boxes were provided, map them
      if (initialBoxes && initialBoxes.length > 0) {
        const foundStem = initialBoxes.find((b) => b.bind === 'stem');
        if (foundStem) {
          setStemZone((prev) => ({
            ...prev,
            x: foundStem.x,
            y: foundStem.y,
            w: foundStem.w,
            h: foundStem.h || prev.h,
            fontSize: foundStem.fontSize || prev.fontSize,
            color: foundStem.color || prev.color,
            align: foundStem.align || prev.align,
            bold: foundStem.bold !== undefined ? foundStem.bold : prev.bold,
            shape: foundStem.shape || prev.shape,
            bg: foundStem.bg || prev.bg,
          }));
        }
        const foundOptions = initialBoxes.find((b) => b.bind === 'options');
        if (foundOptions) {
          setOptionsZone((prev) => ({
            ...prev,
            x: foundOptions.x,
            y: foundOptions.y,
            w: foundOptions.w,
            h: foundOptions.h || prev.h,
            fontSize: foundOptions.fontSize || prev.fontSize,
            color: foundOptions.color || prev.color,
            align: foundOptions.align || prev.align,
            bold: foundOptions.bold !== undefined ? foundOptions.bold : prev.bold,
            shape: foundOptions.shape || prev.shape,
            bg: foundOptions.bg || prev.bg,
            hideOptionBadges: foundOptions.hideOptionBadges ?? prev.hideOptionBadges,
            optionsLayout: foundOptions.optionsLayout || prev.optionsLayout,
          }));
        }
      } else {
        // Smart defaults positioned nicely inside the detected aspect ratio
        const marginX = Math.round(targetW * 0.09);
        const zoneW = targetW - marginX * 2;
        setStemZone((prev) => ({
          ...prev,
          x: marginX,
          y: Math.round(targetH * 0.40),
          w: zoneW,
          h: Math.round(targetH * 0.22),
        }));
        setOptionsZone((prev) => ({
          ...prev,
          x: marginX,
          y: Math.round(targetH * 0.64),
          w: zoneW,
          h: Math.round(targetH * 0.26),
        }));
      }
    };
    img.src = imageUrl;
  }, [imageUrl, initialBoxes]);

  // Track viewport width for scaling design coordinates to DOM px
  useEffect(() => {
    const el = previewViewportRef.current;
    if (!el) return;
    const updateSize = () => {
      setViewportWidth(el.getBoundingClientRect().width);
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, imageUrl]);

  // Scale factor between DOM preview px and design coordinate px
  const scale = viewportWidth > 0 && designW > 0 ? viewportWidth / designW : 1;

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setImageUrl(evt.target.result as string);
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTemplateName(`${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)} Template`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Pointer interaction: Start Drag / Resize
  const handlePointerDown = (
    e: React.PointerEvent,
    target: 'stem' | 'options',
    handle: ActiveHandle
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const currentBox = target === 'stem' ? stemZone : optionsZone;
    setDragTarget(target);
    setActiveHandle(handle);
    setDragStartPos({
      mouseX: e.clientX,
      mouseY: e.clientY,
      box: { ...currentBox },
    });
    setActiveZoneTab(target);
  };

  // Pointer move: update zone coordinates in design coordinates
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragTarget || !activeHandle || !dragStartPos) return;

      const deltaScreenX = e.clientX - dragStartPos.mouseX;
      const deltaScreenY = e.clientY - dragStartPos.mouseY;
      const deltaX = Math.round(deltaScreenX / scale);
      const deltaY = Math.round(deltaScreenY / scale);

      const start = dragStartPos.box;
      let newX = start.x;
      let newY = start.y;
      let newW = start.w;
      let newH = start.h;

      const MIN_W = 140;
      const MIN_H = 60;

      if (activeHandle === 'move') {
        newX = Math.max(0, Math.min(designW - start.w, start.x + deltaX));
        newY = Math.max(0, Math.min(designH - start.h, start.y + deltaY));
      } else {
        // Horizontal resizing
        if (activeHandle.includes('e')) {
          newW = Math.max(MIN_W, Math.min(designW - start.x, start.w + deltaX));
        }
        if (activeHandle.includes('w')) {
          const maxLeftShift = start.w - MIN_W;
          const shiftX = Math.max(-start.x, Math.min(maxLeftShift, deltaX));
          newX = start.x + shiftX;
          newW = start.w - shiftX;
        }

        // Vertical resizing
        if (activeHandle.includes('s')) {
          newH = Math.max(MIN_H, Math.min(designH - start.y, start.h + deltaY));
        }
        if (activeHandle.includes('n')) {
          const maxTopShift = start.h - MIN_H;
          const shiftY = Math.max(-start.y, Math.min(maxTopShift, deltaY));
          newY = start.y + shiftY;
          newH = start.h - shiftY;
        }
      }

      if (dragTarget === 'stem') {
        setStemZone((prev) => ({ ...prev, x: newX, y: newY, w: newW, h: newH }));
      } else {
        setOptionsZone((prev) => ({ ...prev, x: newX, y: newY, w: newW, h: newH }));
      }
    },
    [dragTarget, activeHandle, dragStartPos, scale, designW, designH]
  );

  const handlePointerUp = useCallback(() => {
    setDragTarget(null);
    setActiveHandle(null);
    setDragStartPos(null);
  }, []);

  useEffect(() => {
    if (dragTarget) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [dragTarget, handlePointerMove, handlePointerUp]);

  // Center alignment helpers
  const handleCenterStem = () => {
    setStemZone((prev) => ({
      ...prev,
      x: Math.max(0, Math.round((designW - prev.w) / 2)),
    }));
  };

  const handleCenterOptions = () => {
    setOptionsZone((prev) => ({
      ...prev,
      x: Math.max(0, Math.round((designW - prev.w) / 2)),
    }));
  };

  const handleMatchWidths = () => {
    const avgW = Math.round((stemZone.w + optionsZone.w) / 2);
    setStemZone((prev) => ({
      ...prev,
      w: avgW,
      x: Math.max(0, Math.round((designW - avgW) / 2)),
    }));
    setOptionsZone((prev) => ({
      ...prev,
      w: avgW,
      x: Math.max(0, Math.round((designW - avgW) / 2)),
    }));
  };

  // Reset to auto-detected card locations
  const handleResetZones = () => {
    const marginX = Math.round(designW * 0.09);
    const zoneW = designW - marginX * 2;
    setStemZone((prev) => ({
      ...prev,
      x: marginX,
      y: Math.round(designH * 0.42),
      w: zoneW,
      h: Math.round(designH * 0.21),
    }));
    setOptionsZone((prev) => ({
      ...prev,
      x: marginX,
      y: Math.round(designH * 0.65),
      w: zoneW,
      h: Math.round(designH * 0.26),
    }));
  };

  // Save and apply template
  const handleSaveAndApply = () => {
    const templateId = `custom_tpl_${Date.now()}`;
    const newTemplate: SavedCustomTemplate = {
      id: templateId,
      name: templateName.trim() || 'My Custom Bounded Template',
      aspectRatio,
      designW,
      designH,
      bgImageUrl: imageUrl,
      bgImageFit: 'cover',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      boxes: [
        {
          id: 'b_stem',
          bind: 'stem',
          x: stemZone.x,
          y: stemZone.y,
          w: stemZone.w,
          h: stemZone.h,
          fontSize: stemZone.fontSize,
          color: stemZone.color,
          align: stemZone.align,
          bold: stemZone.bold,
          shape: stemZone.shape,
          bg: stemZone.bg,
          autoFit: true,
          isBoundedZone: true,
        },
        {
          id: 'b_options',
          bind: 'options',
          x: optionsZone.x,
          y: optionsZone.y,
          w: optionsZone.w,
          h: optionsZone.h,
          fontSize: optionsZone.fontSize,
          color: optionsZone.color,
          align: optionsZone.align,
          bold: optionsZone.bold,
          shape: optionsZone.shape,
          bg: optionsZone.bg,
          hideOptionBadges: optionsZone.hideOptionBadges,
          optionsLayout: optionsZone.optionsLayout,
          autoFit: true,
          isBoundedZone: true,
        },
      ],
    };

    // Save to localStorage
    try {
      const STORAGE_KEY = 'social_post_custom_templates_v2';
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const updated = [newTemplate, ...list.filter((t: SavedCustomTemplate) => t.id !== templateId)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    onSaveAndApply(newTemplate);
    onClose();
  };

  if (!open) return null;

  // Live auto-fit calculations for preview inside the modal
  const liveStemFontSize = calculateFittedFontSize(
    sampleQuestion.stem,
    stemZone.w,
    stemZone.h,
    stemZone.fontSize,
    14,
    stemZone.shape === 'card' ? 32 : 12,
    stemZone.shape === 'card' ? 24 : 12
  );

  const liveOptionsMetrics = calculateFittedOptionsLayout(
    sampleQuestion.options,
    optionsZone.w,
    optionsZone.h,
    optionsZone.fontSize,
    optionsZone.optionsLayout !== '1col',
    12
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-6xl max-h-[94vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isAppLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* HEADER BAR */}
        <div className="px-6 py-4 border-b flex items-center justify-between shrink-0 gap-4 bg-slate-950/20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 shadow-md">
              <Crop className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black truncate">
                  Import Custom Template & Bound Zones
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {imageNatW} × {imageNatH} px
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Ratio { (imageNatW / imageNatH).toFixed(2) } ({aspectRatio})
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                The studio window automatically catches this size. Drag & resize the green and blue boxes over your graphic.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all">
              <Upload className="w-3.5 h-3.5" />
              <span>Change Image</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MAIN BODY: 2-COLUMN LAYOUT */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* LEFT: VISUAL INTERACTIVE STAGE (7 COLS) */}
          <div className="lg:col-span-7 p-4 sm:p-6 flex flex-col items-center justify-center bg-slate-950/60 overflow-y-auto relative">
            <div className="w-full flex items-center justify-between mb-3 text-xs text-slate-400 px-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-bold text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                  Question Stem Zone
                </span>
                <span className="flex items-center gap-1 font-bold text-sky-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
                  Options Zone
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                Design: {designW} × {designH}
              </span>
            </div>

            {/* CANVAS VIEWPORT CONTAINER */}
            <div
              ref={previewViewportRef}
              className="w-full max-w-[480px] shadow-2xl rounded-2xl border border-slate-700/80 relative overflow-hidden select-none bg-slate-900"
              style={{
                aspectRatio: `${designW} / ${designH}`,
              }}
            >
              {/* Template Graphic Background */}
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Template Graphic"
                  className="w-full h-full object-cover pointer-events-none absolute inset-0"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <Upload className="w-10 h-10 text-amber-400 mb-2 animate-bounce" />
                  <p className="font-bold text-sm">Upload or Drop a Template Graphic</p>
                  <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, WEBP of any dimension</p>
                </div>
              )}

              {/* OVERLAY: QUESTION STEM ZONE */}
              <div
                className={`absolute rounded-xl transition-shadow cursor-move ${
                  activeZoneTab === 'stem'
                    ? 'ring-2 ring-emerald-400 shadow-xl shadow-emerald-500/20 bg-emerald-500/10'
                    : 'border-2 border-emerald-500/60 bg-emerald-500/5 hover:border-emerald-400'
                }`}
                style={{
                  left: `${(stemZone.x / designW) * 100}%`,
                  top: `${(stemZone.y / designH) * 100}%`,
                  width: `${(stemZone.w / designW) * 100}%`,
                  height: `${(stemZone.h / designH) * 100}%`,
                }}
                onPointerDown={(e) => handlePointerDown(e, 'stem', 'move')}
              >
                {/* Zone Top Pill Badge */}
                <div className="absolute -top-6 left-1 px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-black text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-md pointer-events-none">
                  <span>🟢 Question Stem</span>
                  <span className="font-mono opacity-80">({stemZone.w}×{stemZone.h})</span>
                </div>

                {/* Auto-fit Preview Content */}
                <div
                  className={`w-full h-full flex items-center justify-center p-2.5 overflow-hidden leading-snug ${
                    stemZone.align === 'center' ? 'text-center' : stemZone.align === 'right' ? 'text-right' : 'text-left'
                  } ${stemZone.shape === 'card' ? 'rounded-lg backdrop-blur-sm' : ''}`}
                  style={{
                    color: stemZone.color,
                    backgroundColor: stemZone.shape === 'card' ? 'rgba(15,23,42,0.65)' : 'transparent',
                    fontSize: `${liveStemFontSize * scale}px`,
                    fontWeight: stemZone.bold ? 800 : 600,
                  }}
                >
                  <span className="w-full line-clamp-4 pointer-events-none">
                    {sampleQuestion.stem}
                  </span>
                </div>

                {/* 8 Resize Handles */}
                {activeZoneTab === 'stem' && (
                  <>
                    {(['nw', 'ne', 'se', 'sw', 'n', 's', 'e', 'w'] as const).map((h) => {
                      const posClass =
                        h === 'nw' ? '-top-1.5 -left-1.5 cursor-nwse-resize' :
                        h === 'ne' ? '-top-1.5 -right-1.5 cursor-nesw-resize' :
                        h === 'se' ? '-bottom-1.5 -right-1.5 cursor-nwse-resize' :
                        h === 'sw' ? '-bottom-1.5 -left-1.5 cursor-nesw-resize' :
                        h === 'n' ? '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' :
                        h === 's' ? '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' :
                        h === 'e' ? 'top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize' :
                        'top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize';
                      return (
                        <div
                          key={h}
                          onPointerDown={(e) => handlePointerDown(e, 'stem', h)}
                          className={`absolute w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-md ${posClass}`}
                        />
                      );
                    })}
                  </>
                )}
              </div>

              {/* OVERLAY: OPTIONS ZONE */}
              <div
                className={`absolute rounded-xl transition-shadow cursor-move ${
                  activeZoneTab === 'options'
                    ? 'ring-2 ring-sky-400 shadow-xl shadow-sky-500/20 bg-sky-500/10'
                    : 'border-2 border-sky-500/60 bg-sky-500/5 hover:border-sky-400'
                }`}
                style={{
                  left: `${(optionsZone.x / designW) * 100}%`,
                  top: `${(optionsZone.y / designH) * 100}%`,
                  width: `${(optionsZone.w / designW) * 100}%`,
                  height: `${(optionsZone.h / designH) * 100}%`,
                }}
                onPointerDown={(e) => handlePointerDown(e, 'options', 'move')}
              >
                {/* Zone Top Pill Badge */}
                <div className="absolute -top-6 left-1 px-2 py-0.5 rounded-md bg-sky-500 text-slate-950 font-black text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-md pointer-events-none">
                  <span>🔵 Options (A/B/C/D)</span>
                  <span className="font-mono opacity-80">({optionsZone.w}×{optionsZone.h})</span>
                </div>

                {/* Auto-fit Options Content */}
                <div
                  className={`w-full h-full p-2 overflow-hidden ${
                    optionsZone.optionsLayout === '1col'
                      ? 'flex flex-col justify-between'
                      : 'grid grid-cols-2 gap-2 content-between'
                  }`}
                  style={{
                    color: optionsZone.color,
                    fontSize: `${liveOptionsMetrics.fontSize * scale}px`,
                  }}
                >
                  {sampleQuestion.options.map((opt) => (
                    <div
                      key={opt.key}
                      className={`flex items-center gap-2 overflow-hidden px-2 rounded-lg pointer-events-none ${
                        optionsZone.shape === 'card'
                          ? 'bg-slate-950/60 border border-white/10 shadow-sm'
                          : optionsZone.shape === 'pill'
                          ? 'bg-slate-950/60 border border-white/10 rounded-full'
                          : ''
                      }`}
                      style={{
                        height: `${liveOptionsMetrics.rowHeight * scale}px`,
                      }}
                    >
                      {!optionsZone.hideOptionBadges && (
                        <span
                          className={`rounded-full font-black flex items-center justify-center shrink-0 ${
                            optionsZone.shape === 'card'
                              ? 'bg-slate-800 text-white'
                              : 'bg-amber-400 text-slate-950'
                          }`}
                          style={{
                            width: `${Math.max(16, liveOptionsMetrics.badgeSize * scale)}px`,
                            height: `${Math.max(16, liveOptionsMetrics.badgeSize * scale)}px`,
                            fontSize: `${Math.max(9, liveOptionsMetrics.fontSize * scale * 0.85)}px`,
                          }}
                        >
                          {opt.key}
                        </span>
                      )}
                      <span className="flex-1 truncate font-bold">
                        {opt.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 8 Resize Handles */}
                {activeZoneTab === 'options' && (
                  <>
                    {(['nw', 'ne', 'se', 'sw', 'n', 's', 'e', 'w'] as const).map((h) => {
                      const posClass =
                        h === 'nw' ? '-top-1.5 -left-1.5 cursor-nwse-resize' :
                        h === 'ne' ? '-top-1.5 -right-1.5 cursor-nesw-resize' :
                        h === 'se' ? '-bottom-1.5 -right-1.5 cursor-nwse-resize' :
                        h === 'sw' ? '-bottom-1.5 -left-1.5 cursor-nesw-resize' :
                        h === 'n' ? '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' :
                        h === 's' ? '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' :
                        h === 'e' ? 'top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize' :
                        'top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize';
                      return (
                        <div
                          key={h}
                          onPointerDown={(e) => handlePointerDown(e, 'options', h)}
                          className={`absolute w-3 h-3 rounded-full bg-sky-400 border-2 border-slate-950 shadow-md ${posClass}`}
                        />
                      );
                    })}
                  </>
                )}
              </div>
            </div>

            {/* QUICK ALIGNMENT TOOLBAR */}
            <div className="w-full max-w-[480px] mt-4 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCenterStem}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1 border border-slate-700"
                >
                  <AlignCenter className="w-3 h-3 text-emerald-400" />
                  <span>Center Stem</span>
                </button>
                <button
                  type="button"
                  onClick={handleCenterOptions}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1 border border-slate-700"
                >
                  <AlignCenter className="w-3 h-3 text-sky-400" />
                  <span>Center Options</span>
                </button>
                <button
                  type="button"
                  onClick={handleMatchWidths}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1 border border-slate-700"
                >
                  <Maximize2 className="w-3 h-3 text-amber-400" />
                  <span>Match Widths</span>
                </button>
              </div>
              <button
                type="button"
                onClick={handleResetZones}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* RIGHT: CONTROL PANEL & ZONE SETTINGS (5 COLS) */}
          <div className="lg:col-span-5 p-5 border-t lg:border-t-0 lg:border-l overflow-y-auto space-y-5 bg-slate-950/20">
            {/* Template Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-amber-400" />
                <span>Template Name</span>
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Comic Quiz Time (4:5)"
                className={`w-full px-3 py-2 text-xs font-bold rounded-xl border focus:outline-none focus:border-amber-400 ${
                  isAppLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>

            {/* ZONE SELECTOR TABS */}
            <div className="flex rounded-xl bg-slate-950/40 p-1 border border-slate-800/80">
              <button
                type="button"
                onClick={() => setActiveZoneTab('stem')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition-all ${
                  activeZoneTab === 'stem'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Question Zone</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveZoneTab('options')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition-all ${
                  activeZoneTab === 'options'
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Options Zone</span>
              </button>
            </div>

            {/* TAB 1: QUESTION ZONE SETTINGS */}
            {activeZoneTab === 'stem' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    Text auto-scales down dynamically to fit inside <strong>{stemZone.w} × {stemZone.h}px</strong>.
                  </span>
                </div>

                {/* Text Color */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Question Text Color</span>
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { label: 'Dark Slate', val: '#0f172a', bg: 'bg-slate-900 border-white/20' },
                      { label: 'Pure White', val: '#ffffff', bg: 'bg-white border-slate-300' },
                      { label: 'Amber', val: '#fbbf24', bg: 'bg-amber-400 border-amber-500' },
                      { label: 'Sky Blue', val: '#38bdf8', bg: 'bg-sky-400 border-sky-500' },
                    ].map((c) => (
                      <button
                        key={c.val}
                        type="button"
                        onClick={() => setStemZone((prev) => ({ ...prev, color: c.val }))}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                          stemZone.color === c.val
                            ? 'ring-2 ring-emerald-400 border-transparent bg-emerald-500/15 text-white'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full border ${c.bg}`} />
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alignment & Weight */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400">Alignment</label>
                    <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-0.5">
                      <button
                        type="button"
                        onClick={() => setStemZone((prev) => ({ ...prev, align: 'left' }))}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold ${
                          stemZone.align === 'left' ? 'bg-slate-800 text-white' : 'text-slate-400'
                        }`}
                      >
                        Left
                      </button>
                      <button
                        type="button"
                        onClick={() => setStemZone((prev) => ({ ...prev, align: 'center' }))}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold ${
                          stemZone.align === 'center' ? 'bg-slate-800 text-white' : 'text-slate-400'
                        }`}
                      >
                        Center
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400">Card Background</label>
                    <button
                      type="button"
                      onClick={() =>
                        setStemZone((prev) => ({
                          ...prev,
                          shape: prev.shape === 'card' ? 'plain' : 'card',
                        }))
                      }
                      className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                        stemZone.shape === 'card'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700'
                      }`}
                    >
                      {stemZone.shape === 'card' ? 'Card Glass' : 'Transparent (None)'}
                    </button>
                  </div>
                </div>

                {/* Max Font Size Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold">Max Font Size</span>
                    <span className="font-mono text-emerald-400 font-bold">{stemZone.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={24}
                    max={64}
                    value={stemZone.fontSize}
                    onChange={(e) =>
                      setStemZone((prev) => ({ ...prev, fontSize: Number(e.target.value) }))
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: OPTIONS ZONE SETTINGS */}
            {activeZoneTab === 'options' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-sky-400" />
                  <span>
                    Options scale height & font size automatically to fit <strong>{optionsZone.w} × {optionsZone.h}px</strong>.
                  </span>
                </div>

                {/* Option Container Style */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span>Options Style / Rendering</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'plain', label: 'Transparent', hint: 'Text over artwork' },
                      { id: 'card', label: 'Glass Cards', hint: 'Backdrop cards' },
                      { id: 'pill', label: 'Pill Buttons', hint: 'Curved pills' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() =>
                          setOptionsZone((prev) => ({ ...prev, shape: s.id as SlideBoxShape }))
                        }
                        className={`p-2 rounded-xl text-left border transition-all ${
                          optionsZone.shape === s.id
                            ? 'bg-sky-500/20 border-sky-500/50 text-white'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-black">{s.label}</div>
                        <div className="text-[10px] text-slate-400 truncate">{s.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid Layout & Key Badges */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400">Grid Layout</label>
                    <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-0.5">
                      <button
                        type="button"
                        onClick={() => setOptionsZone((prev) => ({ ...prev, optionsLayout: '2col' }))}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold ${
                          optionsZone.optionsLayout !== '1col'
                            ? 'bg-sky-500 text-slate-950'
                            : 'text-slate-400'
                        }`}
                      >
                        2×2 Grid
                      </button>
                      <button
                        type="button"
                        onClick={() => setOptionsZone((prev) => ({ ...prev, optionsLayout: '1col' }))}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold ${
                          optionsZone.optionsLayout === '1col'
                            ? 'bg-sky-500 text-slate-950'
                            : 'text-slate-400'
                        }`}
                      >
                        1 Column
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400">Key Badges (A/B/C/D)</label>
                    <button
                      type="button"
                      onClick={() =>
                        setOptionsZone((prev) => ({
                          ...prev,
                          hideOptionBadges: !prev.hideOptionBadges,
                        }))
                      }
                      className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                        optionsZone.hideOptionBadges
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700'
                      }`}
                    >
                      {optionsZone.hideOptionBadges ? 'Hidden (Text Only)' : 'Shown (A/B/C/D)'}
                    </button>
                  </div>
                </div>

                {/* Text Color for Options */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-sky-400" />
                    <span>Options Text Color</span>
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { label: 'Dark Slate', val: '#0f172a', bg: 'bg-slate-900 border-white/20' },
                      { label: 'Pure White', val: '#ffffff', bg: 'bg-white border-slate-300' },
                      { label: 'Amber', val: '#fbbf24', bg: 'bg-amber-400 border-amber-500' },
                    ].map((c) => (
                      <button
                        key={c.val}
                        type="button"
                        onClick={() => setOptionsZone((prev) => ({ ...prev, color: c.val }))}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                          optionsZone.color === c.val
                            ? 'ring-2 ring-sky-400 border-transparent bg-sky-500/15 text-white'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full border ${c.bg}`} />
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FOOTER ACTIONS */}
            <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAndApply}
                className="flex-[2] py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save & Apply Template</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
