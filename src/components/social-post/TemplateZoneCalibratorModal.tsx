import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SlideTextBox, MCQItem, SlideBoxShape, SlideTextBoxBind } from '../../types';
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
  AlignRight,
  Eye,
  Layers,
  HelpCircle,
  Crop,
  Palette,
  ShieldCheck,
  RefreshCw,
  Split,
  Grid,
  Columns,
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
type ZoneTarget = 'stem' | 'options' | 'opt_a' | 'opt_b' | 'opt_c' | 'opt_d';
type OptionsMode = 'combined' | 'separate';

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

  // Options Mode: 'combined' (1 single zone) or 'separate' (4 distinct zones)
  const [optionsMode, setOptionsMode] = useState<OptionsMode>('combined');
  const [activeZoneTab, setActiveZoneTab] = useState<ZoneTarget>('stem');

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

  // Combined Options Zone (Grid)
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
    hideOptionBadges: true,
    optionsLayout: '2col',
  });

  // 4 Separate Option Zones (Option A, B, C, D)
  const [optAZone, setOptAZone] = useState<EditableZone>({
    x: 80,
    y: 680,
    w: 340,
    h: 120,
    fontSize: 28,
    color: '#0f172a',
    align: 'left',
    bold: false,
    shape: 'plain',
    bg: 'transparent',
    hideOptionBadges: true,
  });

  const [optBZone, setOptBZone] = useState<EditableZone>({
    x: 444,
    y: 680,
    w: 340,
    h: 120,
    fontSize: 28,
    color: '#0f172a',
    align: 'left',
    bold: false,
    shape: 'plain',
    bg: 'transparent',
    hideOptionBadges: true,
  });

  const [optCZone, setOptCZone] = useState<EditableZone>({
    x: 80,
    y: 820,
    w: 340,
    h: 120,
    fontSize: 28,
    color: '#0f172a',
    align: 'left',
    bold: false,
    shape: 'plain',
    bg: 'transparent',
    hideOptionBadges: true,
  });

  const [optDZone, setOptDZone] = useState<EditableZone>({
    x: 444,
    y: 820,
    w: 340,
    h: 120,
    fontSize: 28,
    color: '#0f172a',
    align: 'left',
    bold: false,
    shape: 'plain',
    bg: 'transparent',
    hideOptionBadges: true,
  });

  // Interaction dragging / resizing state
  const [dragTarget, setDragTarget] = useState<ZoneTarget | null>(null);
  const [activeHandle, setActiveHandle] = useState<ActiveHandle>(null);
  const [dragStartPos, setDragStartPos] = useState<{ mouseX: number; mouseY: number; box: EditableZone } | null>(null);

  const previewViewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(440);

  // Helper to access zone by target identifier
  const getZoneByTarget = useCallback((t: ZoneTarget): EditableZone => {
    switch (t) {
      case 'stem': return stemZone;
      case 'options': return optionsZone;
      case 'opt_a': return optAZone;
      case 'opt_b': return optBZone;
      case 'opt_c': return optCZone;
      case 'opt_d': return optDZone;
    }
  }, [stemZone, optionsZone, optAZone, optBZone, optCZone, optDZone]);

  const setZoneByTarget = useCallback((t: ZoneTarget, update: (prev: EditableZone) => EditableZone) => {
    switch (t) {
      case 'stem': setStemZone(update); break;
      case 'options': setOptionsZone(update); break;
      case 'opt_a': setOptAZone(update); break;
      case 'opt_b': setOptBZone(update); break;
      case 'opt_c': setOptCZone(update); break;
      case 'opt_d': setOptDZone(update); break;
    }
  }, []);

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

        // Check for separate option boxes (opt_a, opt_b, opt_c, opt_d)
        const bA = initialBoxes.find((b) => b.bind === 'opt_a');
        const bB = initialBoxes.find((b) => b.bind === 'opt_b');
        const bC = initialBoxes.find((b) => b.bind === 'opt_c');
        const bD = initialBoxes.find((b) => b.bind === 'opt_d');

        if (bA || bB || bC || bD) {
          setOptionsMode('separate');
          if (bA) setOptAZone((p) => ({ ...p, ...bA, h: bA.h || p.h, shape: bA.shape || 'plain', hideOptionBadges: bA.hideOptionBadges ?? true }));
          if (bB) setOptBZone((p) => ({ ...p, ...bB, h: bB.h || p.h, shape: bB.shape || 'plain', hideOptionBadges: bB.hideOptionBadges ?? true }));
          if (bC) setOptCZone((p) => ({ ...p, ...bC, h: bC.h || p.h, shape: bC.shape || 'plain', hideOptionBadges: bC.hideOptionBadges ?? true }));
          if (bD) setOptDZone((p) => ({ ...p, ...bD, h: bD.h || p.h, shape: bD.shape || 'plain', hideOptionBadges: bD.hideOptionBadges ?? true }));
        } else {
          const foundOptions = initialBoxes.find((b) => b.bind === 'options');
          if (foundOptions) {
            setOptionsMode('combined');
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
              hideOptionBadges: foundOptions.hideOptionBadges ?? true,
              optionsLayout: foundOptions.optionsLayout || prev.optionsLayout,
            }));
          }
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
          hideOptionBadges: true,
        }));

        // Default 4 separate option zones
        const halfW = Math.round((zoneW - 16) / 2);
        const halfH = Math.round((targetH * 0.26 - 16) / 2);
        const startY = Math.round(targetH * 0.64);
        setOptAZone((p) => ({ ...p, x: marginX, y: startY, w: halfW, h: halfH, hideOptionBadges: true }));
        setOptBZone((p) => ({ ...p, x: marginX + halfW + 16, y: startY, w: halfW, h: halfH, hideOptionBadges: true }));
        setOptCZone((p) => ({ ...p, x: marginX, y: startY + halfH + 16, w: halfW, h: halfH, hideOptionBadges: true }));
        setOptDZone((p) => ({ ...p, x: marginX + halfW + 16, y: startY + halfH + 16, w: halfW, h: halfH, hideOptionBadges: true }));
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
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Pointer interaction: Start Drag / Resize
  const handlePointerDown = (
    e: React.PointerEvent,
    target: ZoneTarget,
    handle: ActiveHandle
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const currentBox = getZoneByTarget(target);
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

      const MIN_W = 100;
      const MIN_H = 40;

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

      setZoneByTarget(dragTarget, (prev) => ({
        ...prev,
        x: newX,
        y: newY,
        w: newW,
        h: newH,
      }));
    },
    [dragTarget, activeHandle, dragStartPos, scale, designW, designH, setZoneByTarget]
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

  // Switch between Combined Grid and 4 Separate Option Zones
  const handleSwitchToSeparate = () => {
    const is2Col = optionsZone.optionsLayout !== '1col';
    const gap = 16;
    if (is2Col) {
      const w = Math.round((optionsZone.w - gap) / 2);
      const h = Math.round((optionsZone.h - gap) / 2);
      setOptAZone((prev) => ({ ...prev, x: optionsZone.x, y: optionsZone.y, w, h, color: optionsZone.color, align: optionsZone.align, shape: optionsZone.shape, bg: optionsZone.bg, hideOptionBadges: true }));
      setOptBZone((prev) => ({ ...prev, x: optionsZone.x + w + gap, y: optionsZone.y, w, h, color: optionsZone.color, align: optionsZone.align, shape: optionsZone.shape, bg: optionsZone.bg, hideOptionBadges: true }));
      setOptCZone((prev) => ({ ...prev, x: optionsZone.x, y: optionsZone.y + h + gap, w, h, color: optionsZone.color, align: optionsZone.align, shape: optionsZone.shape, bg: optionsZone.bg, hideOptionBadges: true }));
      setOptDZone((prev) => ({ ...prev, x: optionsZone.x + w + gap, y: optionsZone.y + h + gap, w, h, color: optionsZone.color, align: optionsZone.align, shape: optionsZone.shape, bg: optionsZone.bg, hideOptionBadges: true }));
    } else {
      const h = Math.round((optionsZone.h - gap * 3) / 4);
      setOptAZone((prev) => ({ ...prev, x: optionsZone.x, y: optionsZone.y, w: optionsZone.w, h, color: optionsZone.color, align: optionsZone.align, shape: optionsZone.shape, bg: optionsZone.bg, hideOptionBadges: true }));
      setOptBZone((prev) => ({ ...prev, x: optionsZone.x, y: optionsZone.y + (h + gap), w: optionsZone.w, h, color: optionsZone.color, align: optionsZone.align, shape: optionsZone.shape, bg: optionsZone.bg, hideOptionBadges: true }));
      setOptCZone((prev) => ({ ...prev, x: optionsZone.x, y: optionsZone.y + (h + gap) * 2, w: optionsZone.w, h, color: optionsZone.color, align: optionsZone.align, shape: optionsZone.shape, bg: optionsZone.bg, hideOptionBadges: true }));
      setOptDZone((prev) => ({ ...prev, x: optionsZone.x, y: optionsZone.y + (h + gap) * 3, w: optionsZone.w, h, color: optionsZone.color, align: optionsZone.align, shape: optionsZone.shape, bg: optionsZone.bg, hideOptionBadges: true }));
    }
    setOptionsMode('separate');
    setActiveZoneTab('opt_a');
  };

  const handleSwitchToCombined = () => {
    const minX = Math.min(optAZone.x, optBZone.x, optCZone.x, optDZone.x);
    const minY = Math.min(optAZone.y, optBZone.y, optCZone.y, optDZone.y);
    const maxX = Math.max(optAZone.x + optAZone.w, optBZone.x + optBZone.w, optCZone.x + optCZone.w, optDZone.x + optDZone.w);
    const maxY = Math.max(optAZone.y + optAZone.h, optBZone.y + optBZone.h, optCZone.y + optCZone.h, optDZone.y + optDZone.h);
    setOptionsZone((prev) => ({
      ...prev,
      x: minX,
      y: minY,
      w: Math.max(160, maxX - minX),
      h: Math.max(80, maxY - minY),
      color: optAZone.color,
      shape: optAZone.shape,
      bg: optAZone.bg,
      hideOptionBadges: optAZone.hideOptionBadges,
    }));
    setOptionsMode('combined');
    setActiveZoneTab('options');
  };

  // 1-Click Transparent Text Only Preset (Strip shapes, transparent bg, hide badges)
  const handleMakeTransparentTextOnly = () => {
    const applyTrans = (prev: EditableZone) => ({
      ...prev,
      shape: 'plain' as SlideBoxShape,
      bg: 'transparent',
      hideOptionBadges: true,
    });
    setOptionsZone(applyTrans);
    setOptAZone(applyTrans);
    setOptBZone(applyTrans);
    setOptCZone(applyTrans);
    setOptDZone(applyTrans);
  };

  // Center alignment helpers
  const handleCenterStem = () => {
    setStemZone((prev) => ({
      ...prev,
      x: Math.max(0, Math.round((designW - prev.w) / 2)),
    }));
  };

  const handleCenterOptions = () => {
    if (optionsMode === 'combined') {
      setOptionsZone((prev) => ({
        ...prev,
        x: Math.max(0, Math.round((designW - prev.w) / 2)),
      }));
    } else {
      const minX = Math.min(optAZone.x, optBZone.x, optCZone.x, optDZone.x);
      const maxX = Math.max(optAZone.x + optAZone.w, optBZone.x + optBZone.w, optCZone.x + optCZone.w, optDZone.x + optDZone.w);
      const totalW = maxX - minX;
      const targetStartX = Math.max(0, Math.round((designW - totalW) / 2));
      const shiftX = targetStartX - minX;
      setOptAZone((p) => ({ ...p, x: p.x + shiftX }));
      setOptBZone((p) => ({ ...p, x: p.x + shiftX }));
      setOptCZone((p) => ({ ...p, x: p.x + shiftX }));
      setOptDZone((p) => ({ ...p, x: p.x + shiftX }));
    }
  };

  // Layout distribution helpers for 4 separate options
  const handleDistribute2x2 = () => {
    const minX = Math.min(optAZone.x, optCZone.x);
    const minY = Math.min(optAZone.y, optBZone.y);
    const w = optAZone.w;
    const h = optAZone.h;
    const gap = 16;
    setOptAZone((prev) => ({ ...prev, x: minX, y: minY, w, h }));
    setOptBZone((prev) => ({ ...prev, x: minX + w + gap, y: minY, w, h }));
    setOptCZone((prev) => ({ ...prev, x: minX, y: minY + h + gap, w, h }));
    setOptDZone((prev) => ({ ...prev, x: minX + w + gap, y: minY + h + gap, w, h }));
  };

  const handleDistribute1Col = () => {
    const minX = Math.min(optAZone.x, optBZone.x, optCZone.x, optDZone.x);
    const minY = Math.min(optAZone.y, optBZone.y, optCZone.y, optDZone.y);
    const w = Math.max(optAZone.w, optBZone.w);
    const h = optAZone.h;
    const gap = 12;
    setOptAZone((prev) => ({ ...prev, x: minX, y: minY, w, h }));
    setOptBZone((prev) => ({ ...prev, x: minX, y: minY + (h + gap), w, h }));
    setOptCZone((prev) => ({ ...prev, x: minX, y: minY + (h + gap) * 2, w, h }));
    setOptDZone((prev) => ({ ...prev, x: minX, y: minY + (h + gap) * 3, w, h }));
  };

  const handleMatchAllOptionSizes = () => {
    const activeZone = getZoneByTarget(activeZoneTab);
    const w = activeZone.w;
    const h = activeZone.h;
    setOptAZone((prev) => ({ ...prev, w, h }));
    setOptBZone((prev) => ({ ...prev, w, h }));
    setOptCZone((prev) => ({ ...prev, w, h }));
    setOptDZone((prev) => ({ ...prev, w, h }));
  };

  const handleApplyStyleToAllOptions = (source: EditableZone) => {
    const patch = (prev: EditableZone) => ({
      ...prev,
      fontSize: source.fontSize,
      color: source.color,
      align: source.align,
      bold: source.bold,
      shape: source.shape,
      bg: source.bg,
      hideOptionBadges: source.hideOptionBadges,
    });
    setOptAZone(patch);
    setOptBZone(patch);
    setOptCZone(patch);
    setOptDZone(patch);
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
      h: Math.round(designH * 0.22),
    }));
    setOptionsZone((prev) => ({
      ...prev,
      x: marginX,
      y: Math.round(designH * 0.66),
      w: zoneW,
      h: Math.round(designH * 0.26),
    }));
    const halfW = Math.round((zoneW - 16) / 2);
    const halfH = Math.round((designH * 0.26 - 16) / 2);
    const startY = Math.round(designH * 0.66);
    setOptAZone((p) => ({ ...p, x: marginX, y: startY, w: halfW, h: halfH }));
    setOptBZone((p) => ({ ...p, x: marginX + halfW + 16, y: startY, w: halfW, h: halfH }));
    setOptCZone((p) => ({ ...p, x: marginX, y: startY + halfH + 16, w: halfW, h: halfH }));
    setOptDZone((p) => ({ ...p, x: marginX + halfW + 16, y: startY + halfH + 16, w: halfW, h: halfH }));
  };

  // Save and apply template
  const handleSaveAndApply = () => {
    const templateId = `custom_tpl_${Date.now()}`;

    const boxes: SlideTextBox[] = [
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
    ];

    if (optionsMode === 'separate') {
      boxes.push(
        {
          id: 'b_opt_a',
          bind: 'opt_a',
          x: optAZone.x,
          y: optAZone.y,
          w: optAZone.w,
          h: optAZone.h,
          fontSize: optAZone.fontSize,
          color: optAZone.color,
          align: optAZone.align,
          bold: optAZone.bold,
          shape: optAZone.shape,
          bg: optAZone.bg,
          hideOptionBadges: optAZone.hideOptionBadges,
          autoFit: true,
          isBoundedZone: true,
        },
        {
          id: 'b_opt_b',
          bind: 'opt_b',
          x: optBZone.x,
          y: optBZone.y,
          w: optBZone.w,
          h: optBZone.h,
          fontSize: optBZone.fontSize,
          color: optBZone.color,
          align: optBZone.align,
          bold: optBZone.bold,
          shape: optBZone.shape,
          bg: optBZone.bg,
          hideOptionBadges: optBZone.hideOptionBadges,
          autoFit: true,
          isBoundedZone: true,
        },
        {
          id: 'b_opt_c',
          bind: 'opt_c',
          x: optCZone.x,
          y: optCZone.y,
          w: optCZone.w,
          h: optCZone.h,
          fontSize: optCZone.fontSize,
          color: optCZone.color,
          align: optCZone.align,
          bold: optCZone.bold,
          shape: optCZone.shape,
          bg: optCZone.bg,
          hideOptionBadges: optCZone.hideOptionBadges,
          autoFit: true,
          isBoundedZone: true,
        },
        {
          id: 'b_opt_d',
          bind: 'opt_d',
          x: optDZone.x,
          y: optDZone.y,
          w: optDZone.w,
          h: optDZone.h,
          fontSize: optDZone.fontSize,
          color: optDZone.color,
          align: optDZone.align,
          bold: optDZone.bold,
          shape: optDZone.shape,
          bg: optDZone.bg,
          hideOptionBadges: optDZone.hideOptionBadges,
          autoFit: true,
          isBoundedZone: true,
        }
      );
    } else {
      boxes.push({
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
      });
    }

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
      boxes,
    };

    // Save to localStorage
    try {
      const STORAGE_KEY = 'social_post_custom_templates_v2';
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const updated = [newTemplate, ...list.filter((t: SavedCustomTemplate) => t.id !== templateId && !t.isPreset)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    onSaveAndApply(newTemplate);
    onClose();
  };

  if (!open) return null;

  // Live Auto-fit calculation for question stem
  const liveStemFontSize = calculateFittedFontSize(
    sampleQuestion.stem,
    stemZone.w,
    stemZone.h,
    stemZone.fontSize,
    14,
    stemZone.shape === 'card' ? 48 : 16,
    stemZone.shape === 'card' ? 36 : 12
  );

  const liveOptionsMetrics = calculateFittedOptionsLayout(
    sampleQuestion.options,
    optionsZone.w,
    optionsZone.h,
    optionsZone.fontSize,
    optionsZone.optionsLayout !== '1col',
    12
  );

  const activeOptionZone =
    activeZoneTab === 'opt_a' ? optAZone :
    activeZoneTab === 'opt_b' ? optBZone :
    activeZoneTab === 'opt_c' ? optCZone :
    activeZoneTab === 'opt_d' ? optDZone : optionsZone;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/90 backdrop-blur-md animate-fadeIn select-none">
      <div
        className={`w-[98vw] max-w-[1680px] h-[94vh] max-h-[96vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isAppLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* HEADER BAR */}
        <div className="px-6 py-4 border-b flex items-center justify-between shrink-0 gap-4 bg-slate-950/30">
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
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                  optionsMode === 'separate'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {optionsMode === 'separate' ? '4 Separate Option Zones' : 'Combined Options Grid'}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                The studio window automatically catches this size. Position options together or separately with transparent text.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleMakeTransparentTextOnly}
              className="px-3 py-2 rounded-xl text-xs font-black bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Make all options transparent plain text without numbers"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Transparent Text (No Numbers)</span>
            </button>
            <label className="px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all">
              <Upload className="w-3.5 h-3.5" />
              <span>Change Image</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              title="Close Calibrator"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MAIN BODY: 2-COLUMN LAYOUT */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* LEFT: VISUAL INTERACTIVE STAGE (8 COLS on xl, 7 on lg) */}
          <div className="lg:col-span-7 xl:col-span-8 p-4 sm:p-6 flex flex-col items-center justify-between bg-slate-950/70 overflow-hidden relative min-h-0">
            <div className="w-full flex items-center justify-between mb-2 text-xs text-slate-400 px-2 shrink-0">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveZoneTab('stem')}
                  className={`flex items-center gap-1.5 font-bold px-2 py-0.5 rounded-lg border transition-all ${
                    activeZoneTab === 'stem'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                      : 'text-emerald-400/80 border-transparent hover:text-emerald-300'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-400/50" />
                  <span>Question Stem</span>
                </button>

                {optionsMode === 'combined' ? (
                  <button
                    type="button"
                    onClick={() => setActiveZoneTab('options')}
                    className={`flex items-center gap-1.5 font-bold px-2 py-0.5 rounded-lg border transition-all ${
                      activeZoneTab === 'options'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-400'
                        : 'text-sky-400/80 border-transparent hover:text-sky-300'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block shadow-sm shadow-sky-400/50" />
                    <span>Options Grid</span>
                  </button>
                ) : (
                  (['opt_a', 'opt_b', 'opt_c', 'opt_d'] as const).map((optKey, idx) => {
                    const letters = ['A (ক)', 'B (খ)', 'C (গ)', 'D (ঘ)'];
                    const isActive = activeZoneTab === optKey;
                    return (
                      <button
                        key={optKey}
                        type="button"
                        onClick={() => setActiveZoneTab(optKey)}
                        className={`flex items-center gap-1.5 font-bold px-2 py-0.5 rounded-lg border transition-all ${
                          isActive
                            ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-sm'
                            : 'text-sky-400/80 border-transparent hover:text-sky-300'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                        <span>Opt {letters[idx]}</span>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={optionsMode === 'combined' ? handleSwitchToSeparate : handleSwitchToCombined}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-black border transition-all bg-slate-900 border-slate-700 hover:border-amber-400 text-amber-300 flex items-center gap-1.5"
                  title="Toggle between single combined options grid and 4 separate option zones"
                >
                  <Split className="w-3 h-3 text-amber-400" />
                  <span>{optionsMode === 'combined' ? 'Split into 4 Separate Boxes' : 'Combine into 1 Box'}</span>
                </button>
                <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                  {designW} × {designH} px
                </span>
              </div>
            </div>

            {/* Stage Center Area */}
            <div className="flex-1 w-full flex items-center justify-center p-2 min-h-0 overflow-hidden">
              <div
                ref={previewViewportRef}
                className="shadow-2xl rounded-2xl border border-slate-700/80 relative overflow-hidden select-none bg-slate-900 mx-auto"
                style={{
                  aspectRatio: `${designW} / ${designH}`,
                  maxHeight: 'calc(94vh - 200px)',
                  maxWidth: '100%',
                  width: designW > designH ? 'min(100%, 860px)' : 'auto',
                  height: designH >= designW ? 'min(calc(94vh - 200px), 740px)' : 'auto',
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

                {/* OVERLAY: OPTIONS ZONES (Combined OR 4 Separate) */}
                {optionsMode === 'separate' ? (
                  <>
                    {[
                      { key: 'opt_a' as const, label: 'Opt A (ক)', zone: optAZone, optItem: sampleQuestion.options[0] || { key: 'ক', text: 'হরমোন' } },
                      { key: 'opt_b' as const, label: 'Opt B (খ)', zone: optBZone, optItem: sampleQuestion.options[1] || { key: 'খ', text: 'নিউরোট্রান্সমিটার' } },
                      { key: 'opt_c' as const, label: 'Opt C (গ)', zone: optCZone, optItem: sampleQuestion.options[2] || { key: 'গ', text: 'এনজাইম' } },
                      { key: 'opt_d' as const, label: 'Opt D (ঘ)', zone: optDZone, optItem: sampleQuestion.options[3] || { key: 'ঘ', text: 'অ্যান্টিবডি' } },
                    ].map(({ key, label, zone, optItem }) => {
                      const isSelected = activeZoneTab === key;
                      const effectiveSize = calculateFittedFontSize(
                        optItem.text,
                        Math.max(40, zone.w - (zone.hideOptionBadges ? 0 : 36)),
                        zone.h,
                        zone.fontSize,
                        12,
                        zone.shape === 'card' ? 24 : 8,
                        zone.shape === 'card' ? 16 : 4
                      );

                      return (
                        <div
                          key={key}
                          className={`absolute rounded-xl transition-shadow cursor-move ${
                            isSelected
                              ? 'ring-2 ring-sky-400 shadow-xl shadow-sky-500/30 bg-sky-500/10 z-20'
                              : 'border-2 border-sky-500/60 bg-sky-500/5 hover:border-sky-400 z-10'
                          }`}
                          style={{
                            left: `${(zone.x / designW) * 100}%`,
                            top: `${(zone.y / designH) * 100}%`,
                            width: `${(zone.w / designW) * 100}%`,
                            height: `${(zone.h / designH) * 100}%`,
                          }}
                          onPointerDown={(e) => handlePointerDown(e, key, 'move')}
                        >
                          {/* Zone Top Pill Badge */}
                          <div className="absolute -top-6 left-1 px-2 py-0.5 rounded-md bg-sky-500 text-slate-950 font-black text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-md pointer-events-none">
                            <span>🔵 {label}</span>
                            <span className="font-mono opacity-80">({zone.w}×{zone.h})</span>
                          </div>

                          {/* Content */}
                          <div
                            className={`w-full h-full flex items-center p-2.5 overflow-hidden ${
                              zone.align === 'center' ? 'justify-center text-center' :
                              zone.align === 'right' ? 'justify-end text-right' : 'justify-start text-left'
                            } ${
                              zone.shape === 'card' ? 'bg-slate-950/70 rounded-lg border border-white/10' :
                              zone.shape === 'pill' ? 'bg-slate-950/70 rounded-full border border-white/10' : ''
                            }`}
                            style={{
                              color: zone.color,
                              fontSize: `${effectiveSize * scale}px`,
                              fontWeight: zone.bold ? 800 : 600,
                            }}
                          >
                            {!zone.hideOptionBadges && (
                              <span className="font-black shrink-0 mr-1.5">{optItem.key}.</span>
                            )}
                            <span className="truncate min-w-0 font-bold">{optItem.text}</span>
                          </div>

                          {/* 8 Handles */}
                          {isSelected && (
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
                                    onPointerDown={(e) => handlePointerDown(e, key, h)}
                                    className={`absolute w-3 h-3 rounded-full bg-sky-400 border-2 border-slate-950 shadow-md ${posClass}`}
                                  />
                                );
                              })}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </>
                ) : (
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
                      <span>🔵 Options Grid</span>
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
                )}
              </div>
            </div>

            {/* QUICK ALIGNMENT TOOLBAR */}
            <div className="w-full max-w-[560px] mt-4 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleCenterStem}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1 border border-slate-700 cursor-pointer"
                >
                  <AlignCenter className="w-3 h-3 text-emerald-400" />
                  <span>Center Stem</span>
                </button>
                <button
                  type="button"
                  onClick={handleCenterOptions}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1 border border-slate-700 cursor-pointer"
                >
                  <AlignCenter className="w-3 h-3 text-sky-400" />
                  <span>Center Options</span>
                </button>

                {optionsMode === 'separate' ? (
                  <>
                    <button
                      type="button"
                      onClick={handleDistribute2x2}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1 border border-slate-700 cursor-pointer"
                      title="Arrange Option A, B, C, D into a 2x2 grid"
                    >
                      <Grid className="w-3 h-3 text-amber-400" />
                      <span>2×2 Grid</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDistribute1Col}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1 border border-slate-700 cursor-pointer"
                      title="Arrange Option A, B, C, D into a vertical stack"
                    >
                      <Columns className="w-3 h-3 text-amber-400" />
                      <span>1-Col Stack</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleMatchAllOptionSizes}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1 border border-slate-700 cursor-pointer"
                      title="Make all 4 option boxes match active option width and height"
                    >
                      <Maximize2 className="w-3 h-3 text-sky-400" />
                      <span>Match Sizes</span>
                    </button>
                  </>
                ) : null}
              </div>

              <button
                type="button"
                onClick={handleResetZones}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* RIGHT: CONTROL PANEL & ZONE SETTINGS (5 COLS on lg, 4 COLS on xl) */}
          <div className="lg:col-span-5 xl:col-span-4 p-5 sm:p-6 border-t lg:border-t-0 lg:border-l border-slate-800/80 overflow-y-auto space-y-5 bg-slate-950/30 min-h-0">
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

            {/* OPTIONS MODE SWITCHER: COMBINED VS SEPARATE */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Options Arrangement Mode</span>
                <span className="text-[10px] text-amber-400 font-bold">
                  {optionsMode === 'separate' ? 'Independent Positioning' : 'Single Grid Box'}
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleSwitchToCombined}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    optionsMode === 'combined'
                      ? 'bg-sky-500/20 border-sky-400 text-white font-bold ring-1 ring-sky-400/50'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-black">
                    <Grid className="w-3.5 h-3.5 text-sky-400" />
                    <span>Combined Grid</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">1 single box with 2x2 or 1-col options</div>
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToSeparate}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    optionsMode === 'separate'
                      ? 'bg-sky-500/20 border-sky-400 text-white font-bold ring-1 ring-sky-400/50'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-black">
                    <Split className="w-3.5 h-3.5 text-amber-400" />
                    <span>4 Separate Boxes</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Position A, B, C, D anywhere on graphic</div>
                </button>
              </div>
            </div>

            {/* ZONE SELECTOR TABS */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                Active Zone Editor
              </label>
              <div className="flex rounded-xl bg-slate-950/40 p-1 border border-slate-800/80 gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveZoneTab('stem')}
                  className={`flex-1 min-w-[100px] py-1.5 px-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeZoneTab === 'stem'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Question</span>
                </button>

                {optionsMode === 'combined' ? (
                  <button
                    type="button"
                    onClick={() => setActiveZoneTab('options')}
                    className={`flex-1 min-w-[100px] py-1.5 px-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeZoneTab === 'options'
                        ? 'bg-sky-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span>Options Grid</span>
                  </button>
                ) : (
                  (['opt_a', 'opt_b', 'opt_c', 'opt_d'] as const).map((optKey, idx) => {
                    const letters = ['A (ক)', 'B (খ)', 'C (গ)', 'D (ঘ)'];
                    const isTabActive = activeZoneTab === optKey;
                    return (
                      <button
                        key={optKey}
                        type="button"
                        onClick={() => setActiveZoneTab(optKey)}
                        className={`flex-1 min-w-[64px] py-1.5 px-1 rounded-lg text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          isTabActive
                            ? 'bg-sky-500 text-slate-950 shadow-md'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>{letters[idx]}</span>
                      </button>
                    );
                  })
                )}
              </div>
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
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
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
                      className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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

            {/* TAB 2: OPTIONS ZONE SETTINGS (Combined Grid OR Individual A/B/C/D) */}
            {activeZoneTab !== 'stem' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-sky-400" />
                    <span>
                      {optionsMode === 'separate' ? (
                        <>
                          <strong className="uppercase">{activeZoneTab.replace('_', ' ')}</strong> auto-fits inside <strong>{activeOptionZone.w} × {activeOptionZone.h}px</strong>.
                        </>
                      ) : (
                        <>
                          Options scale automatically inside <strong>{optionsZone.w} × {optionsZone.h}px</strong>.
                        </>
                      )}
                    </span>
                  </div>
                  {optionsMode === 'separate' && (
                    <button
                      type="button"
                      onClick={() => handleApplyStyleToAllOptions(activeOptionZone)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-black bg-sky-500 text-slate-950 hover:brightness-110 cursor-pointer shrink-0"
                      title="Copy this option's color, size, and styling to all 4 options"
                    >
                      Apply to All 4
                    </button>
                  )}
                </div>

                {/* Option Container Style */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span>Container Style / Rendering</span>
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
                        onClick={() => {
                          const shape = s.id as SlideBoxShape;
                          if (optionsMode === 'separate') {
                            setZoneByTarget(activeZoneTab, (p) => ({ ...p, shape }));
                          } else {
                            setOptionsZone((prev) => ({ ...prev, shape }));
                          }
                        }}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          activeOptionZone.shape === s.id
                            ? 'bg-sky-500/20 border-sky-500/50 text-white font-bold'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-black">{s.label}</div>
                        <div className="text-[10px] text-slate-400 truncate">{s.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options Numbering / Key Badges Toggle */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400">Option Numbering</label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextHide = !activeOptionZone.hideOptionBadges;
                        if (optionsMode === 'separate') {
                          setZoneByTarget(activeZoneTab, (p) => ({ ...p, hideOptionBadges: nextHide }));
                        } else {
                          setOptionsZone((prev) => ({ ...prev, hideOptionBadges: nextHide }));
                        }
                      }}
                      className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        activeOptionZone.hideOptionBadges
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700'
                      }`}
                    >
                      {activeOptionZone.hideOptionBadges ? 'Hidden (Text Only)' : 'Shown (A/B/C/D)'}
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400">Text Alignment</label>
                    <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-0.5">
                      {(['left', 'center', 'right'] as const).map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => {
                            if (optionsMode === 'separate') {
                              setZoneByTarget(activeZoneTab, (p) => ({ ...p, align: a }));
                            } else {
                              setOptionsZone((p) => ({ ...p, align: a }));
                            }
                          }}
                          className={`flex-1 py-1 rounded-lg text-xs font-bold capitalize cursor-pointer ${
                            activeOptionZone.align === a ? 'bg-slate-800 text-white' : 'text-slate-400'
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Text Color for Options */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-sky-400" />
                    <span>Text Color</span>
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
                        onClick={() => {
                          if (optionsMode === 'separate') {
                            setZoneByTarget(activeZoneTab, (p) => ({ ...p, color: c.val }));
                          } else {
                            setOptionsZone((prev) => ({ ...prev, color: c.val }));
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                          activeOptionZone.color === c.val
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

                {/* Font Size Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold">Max Font Size</span>
                    <span className="font-mono text-sky-400 font-bold">{activeOptionZone.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={18}
                    max={48}
                    value={activeOptionZone.fontSize}
                    onChange={(e) => {
                      const fontSize = Number(e.target.value);
                      if (optionsMode === 'separate') {
                        setZoneByTarget(activeZoneTab, (p) => ({ ...p, fontSize }));
                      } else {
                        setOptionsZone((prev) => ({ ...prev, fontSize }));
                      }
                    }}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* FOOTER ACTIONS */}
            <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer"
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
    </div>,
    document.body
  );
};
