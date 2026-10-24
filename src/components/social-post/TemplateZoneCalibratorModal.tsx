import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SlideTextBox, MCQItem, SlideBoxShape, SlideTextBoxBind } from '../../types';
import { SavedCustomTemplate, SocialAspectRatio } from './types';
import { calculateFittedFontSize, calculateFittedOptionsLayout } from '../../utils/textHeightEstimate';
import { MathText } from '../MathText';
import { safeToPng } from '../../utils/cleanExport';
import {
  getAllAvailableFonts,
  importCustomFontFromFile,
  injectGoogleFont,
  CustomFontItem,
} from '../../utils/customFontManager';
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
  Download,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  FileText,
  CheckCircle2,
  Image as ImageIcon,
  FolderOpen,
  Paintbrush,
  CheckSquare,
} from 'lucide-react';

interface TemplateZoneCalibratorModalProps {
  open: boolean;
  initialImageUrl?: string;
  initialBoxes?: SlideTextBox[];
  sampleQuestion?: MCQItem;
  allQuestions?: MCQItem[];
  currentQuestionIndex?: number;
  onSelectQuestionIndex?: (idx: number) => void;
  onUpdateQuestion?: (item: MCQItem) => void;
  isAppLight: boolean;
  onClose: () => void;
  onSaveAndApply: (template: SavedCustomTemplate) => void;
}

type ActiveHandle = 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w' | 'move' | null;
type ZoneTarget = 'stem' | 'options' | 'opt_a' | 'opt_b' | 'opt_c' | 'opt_d';
type OptionsMode = 'combined' | 'separate';
type ModalTab = 'content' | 'style' | 'layout';
type FontCategoryFilter = 'all' | 'bangla' | 'english' | 'imported';

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
  fontFamily?: string;
  hideOptionBadges?: boolean;
  optionsLayout?: '1col' | '2col';
}

const DEFAULT_SAMPLE_ITEM: MCQItem = {
  id: 'preview_sample',
  questionType: 'standard',
  stem: 'যে সকল রাসায়নিক পদার্থ স্নায়ুতন্ত্রের মাধ্যমে সংকেত আদান-প্রদান করে তাদের কী বলে?',
  options: [
    { key: 'ক', text: 'হরমোন ও জৈব অনুঘটক' },
    { key: 'খ', text: 'নিউরোট্রান্সমিটার' },
    { key: 'গ', text: 'এনজাইম ও প্রোটিন' },
    { key: 'ঘ', text: 'অ্যান্টিবডি' },
  ],
  answer: 'খ',
};

const COLOR_PALETTE = [
  { label: 'Dark Slate', val: '#0f172a', bg: 'bg-slate-900 border-white/20' },
  { label: 'Pure White', val: '#ffffff', bg: 'bg-white border-slate-300' },
  { label: 'Amber Gold', val: '#f59e0b', bg: 'bg-amber-500 border-amber-600' },
  { label: 'Cyber Yellow', val: '#facc15', bg: 'bg-yellow-400 border-yellow-500' },
  { label: 'Emerald Green', val: '#10b981', bg: 'bg-emerald-500 border-emerald-600' },
  { label: 'Electric Cyan', val: '#06b6d4', bg: 'bg-cyan-500 border-cyan-600' },
  { label: 'Rose Pink', val: '#f43f5e', bg: 'bg-rose-500 border-rose-600' },
  { label: 'Violet', val: '#8b5cf6', bg: 'bg-violet-500 border-violet-600' },
];

export const TemplateZoneCalibratorModal: React.FC<TemplateZoneCalibratorModalProps> = ({
  open,
  initialImageUrl,
  initialBoxes,
  sampleQuestion = DEFAULT_SAMPLE_ITEM,
  allQuestions,
  currentQuestionIndex = 0,
  onSelectQuestionIndex,
  onUpdateQuestion,
  isAppLight,
  onClose,
  onSaveAndApply,
}) => {
  // Image & canvas dimensions state
  const [imageUrl, setImageUrl] = useState<string>(initialImageUrl || '');
  const [imageNatW, setImageNatW] = useState<number>(864);
  const [imageNatH, setImageNatH] = useState<number>(1080);
  const [designW, setDesignW] = useState<number>(864);
  const [designH, setDesignH] = useState<number>(1080);
  const [aspectRatio, setAspectRatio] = useState<SocialAspectRatio>('custom');
  const [templateName, setTemplateName] = useState<string>('Custom Graphic Quiz Template');
  const [isDraggingFileOverStage, setIsDraggingFileOverStage] = useState<boolean>(false);
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);

  // Active Editor Navigation Tab: 'content' | 'style' | 'layout'
  const [activeTab, setActiveTab] = useState<ModalTab>('content');

  // Options Mode: 'combined' (1 single zone) or 'separate' (4 distinct zones)
  const [optionsMode, setOptionsMode] = useState<OptionsMode>('separate');
  const [activeZoneTab, setActiveZoneTab] = useState<ZoneTarget>('stem');

  // Question & options editing state
  const [currentQuestion, setCurrentQuestion] = useState<MCQItem>(sampleQuestion);

  // Sync current question when sampleQuestion or active question index changes
  useEffect(() => {
    if (sampleQuestion) {
      setCurrentQuestion(sampleQuestion);
    }
  }, [sampleQuestion, currentQuestionIndex]);

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
    fontFamily: "'Hind Siliguri', sans-serif",
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
    fontFamily: "'Hind Siliguri', sans-serif",
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
    fontFamily: "'Hind Siliguri', sans-serif",
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
    fontFamily: "'Hind Siliguri', sans-serif",
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
    fontFamily: "'Hind Siliguri', sans-serif",
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
    fontFamily: "'Hind Siliguri', sans-serif",
    hideOptionBadges: true,
  });

  // Fonts state & management
  const [availableFonts, setAvailableFonts] = useState<CustomFontItem[]>([]);
  const [fontFilter, setFontFilter] = useState<FontCategoryFilter>('all');
  const [fontSearchQuery, setFontSearchQuery] = useState<string>('');
  const [googleFontInput, setGoogleFontInput] = useState<string>('');
  const [isFontLoading, setIsFontLoading] = useState<boolean>(false);
  const fontFileInputRef = useRef<HTMLInputElement>(null);

  // Interaction dragging / resizing state
  const [dragTarget, setDragTarget] = useState<ZoneTarget | null>(null);
  const [activeHandle, setActiveHandle] = useState<ActiveHandle>(null);
  const [dragStartPos, setDragStartPos] = useState<{ mouseX: number; mouseY: number; box: EditableZone } | null>(null);

  const previewViewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(440);

  // Load available fonts
  const refreshFonts = useCallback(() => {
    setAvailableFonts(getAllAvailableFonts());
  }, []);

  useEffect(() => {
    refreshFonts();
  }, [refreshFonts, open]);

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

  // Update image and calculate dimensions
  const handleLoadImageFile = useCallback((file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setImageUrl(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
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
            fontFamily: foundStem.fontFamily || prev.fontFamily,
          }));
        }

        const bA = initialBoxes.find((b) => b.bind === 'opt_a');
        const bB = initialBoxes.find((b) => b.bind === 'opt_b');
        const bC = initialBoxes.find((b) => b.bind === 'opt_c');
        const bD = initialBoxes.find((b) => b.bind === 'opt_d');

        if (bA || bB || bC || bD) {
          setOptionsMode('separate');
          if (bA) setOptAZone((p) => ({ ...p, ...bA, h: bA.h || p.h, shape: bA.shape || 'plain', hideOptionBadges: bA.hideOptionBadges ?? true, fontFamily: bA.fontFamily || p.fontFamily }));
          if (bB) setOptBZone((p) => ({ ...p, ...bB, h: bB.h || p.h, shape: bB.shape || 'plain', hideOptionBadges: bB.hideOptionBadges ?? true, fontFamily: bB.fontFamily || p.fontFamily }));
          if (bC) setOptCZone((p) => ({ ...p, ...bC, h: bC.h || p.h, shape: bC.shape || 'plain', hideOptionBadges: bC.hideOptionBadges ?? true, fontFamily: bC.fontFamily || p.fontFamily }));
          if (bD) setOptDZone((p) => ({ ...p, ...bD, h: bD.h || p.h, shape: bD.shape || 'plain', hideOptionBadges: bD.hideOptionBadges ?? true, fontFamily: bD.fontFamily || p.fontFamily }));
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
              fontFamily: foundOptions.fontFamily || prev.fontFamily,
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

  // Handle local file input change
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleLoadImageFile(file);
    e.target.value = '';
  };

  // Drag and drop image handlers
  const handleStageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFileOverStage(true);
  };

  const handleStageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFileOverStage(false);
  };

  const handleStageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFileOverStage(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLoadImageFile(e.dataTransfer.files[0]);
    }
  };

  // Font Import Handlers
  const handleFontFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setIsFontLoading(true);
    try {
      const imported = await importCustomFontFromFile(file);
      refreshFonts();
      // Apply immediately to the active zone
      handleSetZoneFont(imported.family);
    } catch (err: any) {
      alert(`Font import failed: ${err?.message || 'Unsupported format'}`);
    } finally {
      setIsFontLoading(false);
      e.target.value = '';
    }
  };

  const handleAddGoogleFont = () => {
    if (!googleFontInput.trim()) return;
    const family = injectGoogleFont(googleFontInput.trim());
    handleSetZoneFont(family);
    setGoogleFontInput('');
    refreshFonts();
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

      // Convert screen delta px to design coordinate px
      const deltaDesignX = Math.round(deltaScreenX / scale);
      const deltaDesignY = Math.round(deltaScreenY / scale);

      const orig = dragStartPos.box;
      const minW = 60;
      const minH = 40;

      setZoneByTarget(dragTarget, (prev) => {
        let { x, y, w, h } = orig;

        if (activeHandle === 'move') {
          x = Math.max(0, Math.min(designW - w, orig.x + deltaDesignX));
          y = Math.max(0, Math.min(designH - h, orig.y + deltaDesignY));
        } else {
          // Handle 8 directional resize anchors
          if (activeHandle.includes('e')) {
            w = Math.max(minW, Math.min(designW - orig.x, orig.w + deltaDesignX));
          }
          if (activeHandle.includes('s')) {
            h = Math.max(minH, Math.min(designH - orig.y, orig.h + deltaDesignY));
          }
          if (activeHandle.includes('w')) {
            const proposedW = orig.w - deltaDesignX;
            if (proposedW >= minW) {
              const proposedX = orig.x + deltaDesignX;
              if (proposedX >= 0) {
                x = proposedX;
                w = proposedW;
              }
            }
          }
          if (activeHandle.includes('n')) {
            const proposedH = orig.h - deltaDesignY;
            if (proposedH >= minH) {
              const proposedY = orig.y + deltaDesignY;
              if (proposedY >= 0) {
                y = proposedY;
                h = proposedH;
              }
            }
          }
        }

        return { ...prev, x, y, w, h };
      });
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

  // Mode switchers
  const handleSwitchToSeparate = () => {
    setOptionsMode('separate');
    const halfW = Math.round((optionsZone.w - 16) / 2);
    const halfH = Math.round((optionsZone.h - 16) / 2);
    const startX = optionsZone.x;
    const startY = optionsZone.y;
    const baseStyle = {
      fontSize: optionsZone.fontSize,
      color: optionsZone.color,
      shape: optionsZone.shape,
      bg: optionsZone.bg,
      hideOptionBadges: optionsZone.hideOptionBadges ?? true,
      fontFamily: optionsZone.fontFamily,
    };

    setOptAZone((p) => ({ ...p, ...baseStyle, x: startX, y: startY, w: halfW, h: halfH }));
    setOptBZone((p) => ({ ...p, ...baseStyle, x: startX + halfW + 16, y: startY, w: halfW, h: halfH }));
    setOptCZone((p) => ({ ...p, ...baseStyle, x: startX, y: startY + halfH + 16, w: halfW, h: halfH }));
    setOptDZone((p) => ({ ...p, ...baseStyle, x: startX + halfW + 16, y: startY + halfH + 16, w: halfW, h: halfH }));
    setActiveZoneTab('opt_a');
  };

  const handleSwitchToCombined = () => {
    setOptionsMode('combined');
    const minX = Math.min(optAZone.x, optBZone.x, optCZone.x, optDZone.x);
    const minY = Math.min(optAZone.y, optBZone.y, optCZone.y, optDZone.y);
    const maxR = Math.max(optAZone.x + optAZone.w, optBZone.x + optBZone.w, optCZone.x + optCZone.w, optDZone.x + optDZone.w);
    const maxB = Math.max(optAZone.y + optAZone.h, optBZone.y + optBZone.h, optCZone.y + optCZone.h, optDZone.y + optDZone.h);

    setOptionsZone((prev) => ({
      ...prev,
      x: minX,
      y: minY,
      w: Math.max(200, maxR - minX),
      h: Math.max(100, maxB - minY),
      fontSize: optAZone.fontSize,
      color: optAZone.color,
      shape: optAZone.shape,
      fontFamily: optAZone.fontFamily,
      hideOptionBadges: optAZone.hideOptionBadges ?? true,
    }));
    setActiveZoneTab('options');
  };

  // Quick Alignments
  const handleAlign2x2 = () => {
    const minX = Math.min(optAZone.x, optBZone.x, optCZone.x, optDZone.x);
    const minY = Math.min(optAZone.y, optBZone.y, optCZone.y, optDZone.y);
    const totalW = Math.max(optAZone.w * 2 + 16, 400);
    const halfW = Math.round((totalW - 16) / 2);
    const avgH = Math.round((optAZone.h + optBZone.h + optCZone.h + optDZone.h) / 4);

    setOptAZone((p) => ({ ...p, x: minX, y: minY, w: halfW, h: avgH }));
    setOptBZone((p) => ({ ...p, x: minX + halfW + 16, y: minY, w: halfW, h: avgH }));
    setOptCZone((p) => ({ ...p, x: minX, y: minY + avgH + 16, w: halfW, h: avgH }));
    setOptDZone((p) => ({ ...p, x: minX + halfW + 16, y: minY + avgH + 16, w: halfW, h: avgH }));
  };

  const handleAlign1Col = () => {
    const minX = Math.min(optAZone.x, optBZone.x, optCZone.x, optDZone.x);
    const minY = Math.min(optAZone.y, optBZone.y, optCZone.y, optDZone.y);
    const maxW = Math.max(optAZone.w, optBZone.w, optCZone.w, optDZone.w);
    const h = Math.round(optAZone.h * 0.85);
    const gap = 12;

    setOptAZone((p) => ({ ...p, x: minX, y: minY, w: maxW, h }));
    setOptBZone((p) => ({ ...p, x: minX, y: minY + (h + gap), w: maxW, h }));
    setOptCZone((p) => ({ ...p, x: minX, y: minY + (h + gap) * 2, w: maxW, h }));
    setOptDZone((p) => ({ ...p, x: minX, y: minY + (h + gap) * 3, w: maxW, h }));
  };

  const handleMatchOptionSizes = () => {
    const refW = optAZone.w;
    const refH = optAZone.h;
    setOptBZone((p) => ({ ...p, w: refW, h: refH }));
    setOptCZone((p) => ({ ...p, w: refW, h: refH }));
    setOptDZone((p) => ({ ...p, w: refW, h: refH }));
  };

  const handleCenterOptions = () => {
    if (optionsMode === 'separate') {
      const minX = Math.min(optAZone.x, optBZone.x, optCZone.x, optDZone.x);
      const maxX = Math.max(optAZone.x + optAZone.w, optBZone.x + optBZone.w, optCZone.x + optCZone.w, optDZone.x + optDZone.w);
      const groupW = maxX - minX;
      const newStartX = Math.round((designW - groupW) / 2);
      const shiftX = newStartX - minX;

      setOptAZone((p) => ({ ...p, x: p.x + shiftX }));
      setOptBZone((p) => ({ ...p, x: p.x + shiftX }));
      setOptCZone((p) => ({ ...p, x: p.x + shiftX }));
      setOptDZone((p) => ({ ...p, x: p.x + shiftX }));
    } else {
      setOptionsZone((p) => ({ ...p, x: Math.round((designW - p.w) / 2) }));
    }
  };

  const handleCenterStem = () => {
    setStemZone((p) => ({ ...p, x: Math.round((designW - p.w) / 2) }));
  };

  // Toggle Question Stem transparency (Transparent plain text vs Glass card)
  const handleToggleStemTransparency = () => {
    setStemZone((p) => {
      const willBePlain = p.shape !== 'plain';
      return {
        ...p,
        shape: willBePlain ? 'plain' : 'card',
        bg: willBePlain ? 'transparent' : 'rgba(15,23,42,0.7)',
      };
    });
  };

  // 1-Click All Transparent Text (Question + Options without cards or numbers) Preset
  const handleMakeTransparentTextOnly = () => {
    const transparentProps = {
      shape: 'plain' as SlideBoxShape,
      bg: 'transparent',
      hideOptionBadges: true,
    };
    setStemZone((p) => ({ ...p, shape: 'plain', bg: 'transparent' }));
    setOptionsZone((p) => ({ ...p, ...transparentProps }));
    setOptAZone((p) => ({ ...p, ...transparentProps }));
    setOptBZone((p) => ({ ...p, ...transparentProps }));
    setOptCZone((p) => ({ ...p, ...transparentProps }));
    setOptDZone((p) => ({ ...p, ...transparentProps }));
  };

  // Font application
  const handleSetZoneFont = (family: string) => {
    if (activeZoneTab === 'stem') {
      setStemZone((p) => ({ ...p, fontFamily: family }));
    } else if (optionsMode === 'separate') {
      setZoneByTarget(activeZoneTab, (p) => ({ ...p, fontFamily: family }));
    } else {
      setOptionsZone((p) => ({ ...p, fontFamily: family }));
    }
  };

  const handleApplyFontToAll = (family: string) => {
    setStemZone((p) => ({ ...p, fontFamily: family }));
    setOptionsZone((p) => ({ ...p, fontFamily: family }));
    setOptAZone((p) => ({ ...p, fontFamily: family }));
    setOptBZone((p) => ({ ...p, fontFamily: family }));
    setOptCZone((p) => ({ ...p, fontFamily: family }));
    setOptDZone((p) => ({ ...p, fontFamily: family }));
  };

  // Apply style to all zones (font, color, shape)
  const handleApplyStyleToAllZones = (source: EditableZone) => {
    const copy = {
      color: source.color,
      shape: source.shape,
      bg: source.bg,
      fontFamily: source.fontFamily,
      hideOptionBadges: source.hideOptionBadges,
    };
    setStemZone((p) => ({ ...p, ...copy }));
    setOptionsZone((p) => ({ ...p, ...copy }));
    setOptAZone((p) => ({ ...p, ...copy }));
    setOptBZone((p) => ({ ...p, ...copy }));
    setOptCZone((p) => ({ ...p, ...copy }));
    setOptDZone((p) => ({ ...p, ...copy }));
  };

  // Question editing handlers
  const handleStemChange = (val: string) => {
    const updated = { ...currentQuestion, stem: val };
    setCurrentQuestion(updated);
    onUpdateQuestion?.(updated);
  };

  const handleOptionTextChange = (index: number, val: string) => {
    const newOptions = [...currentQuestion.options];
    if (newOptions[index]) {
      newOptions[index] = { ...newOptions[index], text: val };
      const updated = { ...currentQuestion, options: newOptions };
      setCurrentQuestion(updated);
      onUpdateQuestion?.(updated);
    }
  };

  const handleSetCorrectAnswer = (key: string) => {
    const updated = { ...currentQuestion, answer: key };
    setCurrentQuestion(updated);
    onUpdateQuestion?.(updated);
  };

  // Direct PNG Export from the popup
  const handleDownloadPng = async () => {
    if (!previewViewportRef.current) return;
    setIsExportingPng(true);
    try {
      const dataUrl = await safeToPng(previewViewportRef.current, { pixelRatio: 2 });
      const safeName = templateName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'social_post_calibrated';
      const link = document.createElement('a');
      link.download = `${safeName}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(`Export failed: ${err?.message || 'Could not rasterize canvas'}`);
    } finally {
      setIsExportingPng(false);
    }
  };

  // Save Template & Apply
  const handleSaveAndApply = () => {
    const templateId = `tpl_${Date.now()}`;
    const boxes: SlideTextBox[] = [];

    // 1. Stem Box
    boxes.push({
      id: 'b_stem',
      bind: 'stem',
      x: stemZone.x,
      y: stemZone.y,
      w: stemZone.w,
      h: stemZone.h,
      fontSize: stemZone.fontSize,
      minFontSize: 16,
      maxFontSize: stemZone.fontSize,
      color: stemZone.color,
      align: stemZone.align,
      bold: stemZone.bold,
      shape: stemZone.shape,
      bg: stemZone.bg || (stemZone.shape === 'card' ? 'rgba(15,23,42,0.7)' : 'transparent'),
      fontFamily: stemZone.fontFamily,
      isCustomFontOverride: !!stemZone.fontFamily,
      autoFit: true,
      isBoundedZone: true,
    });

    // 2. Options
    if (optionsMode === 'separate') {
      const mapZoneToBox = (z: EditableZone, bind: SlideTextBoxBind, id: string) => ({
        id,
        bind,
        x: z.x,
        y: z.y,
        w: z.w,
        h: z.h,
        fontSize: z.fontSize,
        minFontSize: 14,
        maxFontSize: z.fontSize,
        color: z.color,
        align: z.align,
        bold: z.bold,
        shape: z.shape,
        bg: z.bg || (z.shape === 'card' ? 'rgba(15,23,42,0.7)' : 'transparent'),
        fontFamily: z.fontFamily,
        isCustomFontOverride: !!z.fontFamily,
        hideOptionBadges: z.hideOptionBadges,
        autoFit: true,
        isBoundedZone: true,
      });

      boxes.push(mapZoneToBox(optAZone, 'opt_a', 'b_opt_a'));
      boxes.push(mapZoneToBox(optBZone, 'opt_b', 'b_opt_b'));
      boxes.push(mapZoneToBox(optCZone, 'opt_c', 'b_opt_c'));
      boxes.push(mapZoneToBox(optDZone, 'opt_d', 'b_opt_d'));
    } else {
      boxes.push({
        id: 'b_options',
        bind: 'options',
        x: optionsZone.x,
        y: optionsZone.y,
        w: optionsZone.w,
        h: optionsZone.h,
        fontSize: optionsZone.fontSize,
        minFontSize: 14,
        maxFontSize: optionsZone.fontSize,
        color: optionsZone.color,
        align: optionsZone.align,
        bold: optionsZone.bold,
        shape: optionsZone.shape,
        bg: optionsZone.bg || (optionsZone.shape === 'card' ? 'rgba(15,23,42,0.7)' : 'transparent'),
        fontFamily: optionsZone.fontFamily,
        isCustomFontOverride: !!optionsZone.fontFamily,
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
    currentQuestion.stem,
    stemZone.w,
    stemZone.h,
    stemZone.fontSize,
    14,
    stemZone.shape === 'card' ? 48 : 16,
    stemZone.shape === 'card' ? 36 : 12
  );

  const liveOptionsMetrics = calculateFittedOptionsLayout(
    currentQuestion.options,
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

  // Filter fonts for font picker
  const filteredFonts = availableFonts.filter((f) => {
    if (fontSearchQuery.trim()) {
      const q = fontSearchQuery.toLowerCase();
      if (!f.name.toLowerCase().includes(q) && !f.category.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (fontFilter === 'bangla') return f.category.startsWith('bangla');
    if (fontFilter === 'english') return f.category.startsWith('english');
    if (fontFilter === 'imported') return f.isCustom || f.category === 'custom_imported';
    return true;
  });

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
        <div className="px-6 py-4 border-b flex items-center justify-between shrink-0 gap-4 bg-slate-950/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 shadow-md">
              <Crop className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black truncate">
                  Social Post Studio & Template Calibrator
                </h3>
                {imageUrl && (
                  <>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {imageNatW} × {imageNatH} px
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {aspectRatio} ({(imageNatW / imageNatH).toFixed(2)})
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                      optionsMode === 'separate'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {optionsMode === 'separate' ? '4 Separate Options' : 'Combined Grid'}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                Drop your graphic, edit question & options live, customize fonts & colors, and download or save as template.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {imageUrl && (
              <>
                <button
                  type="button"
                  onClick={handleToggleStemTransparency}
                  className={`px-3 py-2 rounded-xl text-xs font-black border flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                    stemZone.shape === 'plain'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                  title="Toggle transparent plain text vs card for the question stem"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">
                    {stemZone.shape === 'plain' ? 'Question: Transparent' : 'Make Question Transparent'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleMakeTransparentTextOnly}
                  className="px-3 py-2 rounded-xl text-xs font-black bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Make Question and all options transparent plain text without cards or numbers"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">All Transparent (Q + Opts)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={isExportingPng}
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-500 hover:brightness-110 text-slate-950 shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Download calibrated graphic as high-resolution PNG"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isExportingPng ? 'Exporting...' : 'Download PNG'}</span>
                </button>
                <label className="px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 border border-slate-700 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-all">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Replace Graphic</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="Close Calibrator"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MAIN BODY: 2-COLUMN LAYOUT */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* LEFT: VISUAL STAGE & DROPZONE (8 COLS on xl, 7 on lg) */}
          <div
            onDragOver={handleStageDragOver}
            onDragLeave={handleStageDragLeave}
            onDrop={handleStageDrop}
            className={`lg:col-span-7 xl:col-span-8 p-4 sm:p-6 flex flex-col items-center justify-between overflow-hidden relative min-h-0 transition-colors ${
              isDraggingFileOverStage
                ? 'bg-amber-500/10 border-2 border-dashed border-amber-400'
                : 'bg-slate-950/70'
            }`}
          >
            {/* Visual Stage Controls Toolbar */}
            {imageUrl ? (
              <div className="w-full flex items-center justify-between mb-2 text-xs text-slate-400 px-2 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveZoneTab('stem')}
                    className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      activeZoneTab === 'stem'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-sm'
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
                      className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        activeZoneTab === 'options'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-sm'
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
                          className={`flex items-center gap-1 font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-sm'
                              : 'text-sky-400/80 border-transparent hover:text-sky-300'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                          <span>{letters[idx]}</span>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={optionsMode === 'combined' ? handleSwitchToSeparate : handleSwitchToCombined}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-black border transition-all bg-slate-900 border-slate-700 hover:border-amber-400 text-amber-300 flex items-center gap-1.5 cursor-pointer"
                    title="Toggle between single combined options grid and 4 separate option zones"
                  >
                    <Split className="w-3 h-3 text-amber-400" />
                    <span>{optionsMode === 'combined' ? 'Split 4 Boxes' : 'Combine 1 Box'}</span>
                  </button>
                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                    {designW} × {designH} px
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full text-center py-1">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  Step 1: Import or Drop Your Custom Template Graphic
                </span>
              </div>
            )}

            {/* Stage Center Area */}
            <div className="flex-1 w-full flex items-center justify-center p-2 min-h-0 overflow-hidden relative">
              {imageUrl ? (
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
                  <img
                    src={imageUrl}
                    alt="Template Graphic"
                    className="w-full h-full object-cover pointer-events-none absolute inset-0"
                  />

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
                        fontFamily: stemZone.fontFamily || "'Hind Siliguri', sans-serif",
                        backgroundColor: stemZone.shape === 'card' ? 'rgba(15,23,42,0.65)' : 'transparent',
                        fontSize: `${liveStemFontSize * scale}px`,
                        fontWeight: stemZone.bold ? 800 : 600,
                      }}
                    >
                      <span className="w-full line-clamp-4 pointer-events-none">
                        <MathText text={currentQuestion.stem} />
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
                        { key: 'opt_a' as const, label: 'Opt A (ক)', zone: optAZone, optItem: currentQuestion.options[0] || { key: 'ক', text: 'হরমোন' }, optIdx: 0 },
                        { key: 'opt_b' as const, label: 'Opt B (খ)', zone: optBZone, optItem: currentQuestion.options[1] || { key: 'খ', text: 'নিউরোট্রান্সমিটার' }, optIdx: 1 },
                        { key: 'opt_c' as const, label: 'Opt C (গ)', zone: optCZone, optItem: currentQuestion.options[2] || { key: 'গ', text: 'এনজাইম' }, optIdx: 2 },
                        { key: 'opt_d' as const, label: 'Opt D (ঘ)', zone: optDZone, optItem: currentQuestion.options[3] || { key: 'ঘ', text: 'অ্যান্টিবডি' }, optIdx: 3 },
                      ].map(({ key, label, zone, optItem, optIdx }) => {
                        const isSelected = activeZoneTab === key;
                        const isCorrect = currentQuestion.answer === optItem.key || currentQuestion.answer === String.fromCharCode(65 + optIdx);
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
                              {isCorrect && <span className="bg-emerald-400 text-slate-950 px-1 rounded text-[9px] font-black">✓ Correct</span>}
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
                                fontFamily: zone.fontFamily || "'Hind Siliguri', sans-serif",
                                fontSize: `${effectiveSize * scale}px`,
                                fontWeight: zone.bold ? 800 : 600,
                              }}
                            >
                              {!zone.hideOptionBadges && (
                                <span className="font-black shrink-0 mr-1.5">{optItem.key}.</span>
                              )}
                              <span className="truncate min-w-0 font-bold">
                                <MathText text={optItem.text} />
                              </span>
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
                          fontFamily: optionsZone.fontFamily || "'Hind Siliguri', sans-serif",
                          fontSize: `${liveOptionsMetrics.fontSize * scale}px`,
                        }}
                      >
                        {currentQuestion.options.map((opt) => (
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
                              <span className="rounded-full font-black flex items-center justify-center shrink-0 w-6 h-6 text-xs bg-sky-500 text-slate-950">
                                {opt.key}
                              </span>
                            )}
                            <span className="truncate font-bold">
                              <MathText text={opt.text} />
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* 8 Handles for Combined Options */}
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
              ) : (
                /* INITIAL DROPZONE VIEW WHEN NO GRAPHIC IS LOADED */
                <div className="w-full max-w-xl p-8 rounded-3xl border-2 border-dashed border-amber-500/40 bg-slate-900/60 flex flex-col items-center justify-center text-center space-y-5 shadow-2xl backdrop-blur-sm animate-fadeIn">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Upload className="w-10 h-10 stroke-[2.5] animate-bounce" />
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-xl font-black text-white">
                      Drop Your Template Graphic Here
                    </h4>
                    <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                      Drag and drop any custom quiz flyer, comic background, or template image. The studio automatically catches its exact size!
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="px-6 py-3 rounded-2xl text-sm font-black bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-slate-950 shadow-lg shadow-amber-500/25 cursor-pointer flex items-center gap-2 transition-all">
                      <FolderOpen className="w-4 h-4 stroke-[2.5]" />
                      <span>Browse Files on Computer</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>

                  {/* Starter Samples */}
                  <div className="pt-4 border-t border-slate-800 w-full space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Or Try a Quick Starter Graphic
                    </span>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setImageUrl('/templates/comic_quiz_time.jpg')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Crop className="w-3.5 h-3.5 text-amber-400" />
                        <span>Comic Quiz Time (864×1080)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Alignment Toolbar at Stage Bottom */}
            {imageUrl && (
              <div className="w-full pt-2 flex items-center justify-between text-xs text-slate-400 px-2 shrink-0 border-t border-slate-800/60 mt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase text-slate-500 mr-1">Align:</span>
                  {optionsMode === 'separate' ? (
                    <>
                      <button
                        type="button"
                        onClick={handleAlign2x2}
                        className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                        title="Align 4 options into a clean 2x2 grid"
                      >
                        <Grid className="w-3 h-3 text-sky-400" />
                        <span>2×2 Grid</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAlign1Col}
                        className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                        title="Align 4 options in a single vertical stack"
                      >
                        <Columns className="w-3 h-3 text-sky-400" />
                        <span>1-Col Stack</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleMatchOptionSizes}
                        className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                        title="Match width and height of B, C, D to Option A"
                      >
                        <Maximize2 className="w-3 h-3 text-amber-400" />
                        <span>Match Sizes</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setOptionsZone((p) => ({
                          ...p,
                          optionsLayout: p.optionsLayout === '1col' ? '2col' : '1col',
                        }))
                      }
                      className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                    >
                      <LayoutGrid className="w-3 h-3 text-sky-400" />
                      <span>Layout: {optionsZone.optionsLayout === '1col' ? '1-Column' : '2×2 Grid'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCenterOptions}
                    className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                  >
                    <AlignCenter className="w-3 h-3 text-emerald-400" />
                    <span>Center Options</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCenterStem}
                    className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                  >
                    <AlignCenter className="w-3 h-3 text-emerald-400" />
                    <span>Center Stem</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 font-mono hidden md:inline">
                  Drag box to move · Pull corners to resize
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: FULL-FLEDGED CONTROL PANEL (4-5 COLS) */}
          <div className="lg:col-span-5 xl:col-span-4 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/90 space-y-4">
            <div className="space-y-4">
              {/* PRIMARY 3-TAB SELECTOR */}
              <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800 shadow-inner">
                {[
                  { id: 'content' as const, label: 'Content', icon: FileText, desc: 'Question & Options' },
                  { id: 'style' as const, label: 'Style & Fonts', icon: Palette, desc: 'Fonts, Color, Cards' },
                  { id: 'layout' as const, label: 'Zones', icon: Layers, desc: 'Position & Bounds' },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id)}
                      className={`flex-1 py-2 px-1.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400/40'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* ------------------------------------------------------------- */}
              {/* TAB 1: QUESTION STEM & OPTIONS LIVE CONTENT EDITING            */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'content' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Deck Question Switcher */}
                  {allQuestions && allQuestions.length > 1 && (
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Question Selector</span>
                        </span>
                        <span className="font-mono text-slate-400 text-[11px]">
                          {(currentQuestionIndex || 0) + 1} / {allQuestions.length}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (currentQuestionIndex !== undefined && currentQuestionIndex > 0 && onSelectQuestionIndex) {
                              onSelectQuestionIndex(currentQuestionIndex - 1);
                            }
                          }}
                          disabled={!currentQuestionIndex || currentQuestionIndex <= 0}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 border border-slate-700 cursor-pointer"
                          title="Previous Question"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <select
                          value={currentQuestionIndex || 0}
                          onChange={(e) => {
                            const idx = Number(e.target.value);
                            if (onSelectQuestionIndex) onSelectQuestionIndex(idx);
                          }}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                        >
                          {allQuestions.map((q, i) => (
                            <option key={q.id || i} value={i}>
                              Q{i + 1}: {q.stem.slice(0, 36)}...
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            if (
                              currentQuestionIndex !== undefined &&
                              currentQuestionIndex < allQuestions.length - 1 &&
                              onSelectQuestionIndex
                            ) {
                              onSelectQuestionIndex(currentQuestionIndex + 1);
                            }
                          }}
                          disabled={currentQuestionIndex === undefined || currentQuestionIndex >= allQuestions.length - 1}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 border border-slate-700 cursor-pointer"
                          title="Next Question"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Question Stem Textarea */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                        <span>Question Stem</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleToggleStemTransparency}
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black border transition-all cursor-pointer flex items-center gap-1 ${
                          stemZone.shape === 'plain'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                        title="Toggle transparent plain text vs glass card background for question"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>{stemZone.shape === 'plain' ? 'Transparent Question (Active)' : 'Make Question Transparent'}</span>
                      </button>
                    </div>
                    <textarea
                      value={currentQuestion.stem}
                      onChange={(e) => handleStemChange(e.target.value)}
                      rows={3}
                      placeholder="Type question stem..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs leading-relaxed text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 resize-none font-medium"
                    />
                  </div>

                  {/* Options A, B, C, D Editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                        <span>Options A, B, C, D</span>
                      </span>
                      <span className="text-[10px] text-slate-500">Click circle to set correct answer</span>
                    </div>

                    <div className="space-y-2">
                      {currentQuestion.options.map((opt, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        const isCorrect = currentQuestion.answer === opt.key || currentQuestion.answer === letter;
                        return (
                          <div
                            key={idx}
                            className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all ${
                              isCorrect
                                ? 'bg-emerald-500/10 border-emerald-500/40'
                                : 'bg-slate-950/60 border-slate-800'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSetCorrectAnswer(opt.key)}
                              className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                isCorrect
                                  ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400'
                                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                              }`}
                              title={`Mark Option ${opt.key} (${letter}) as Correct Answer`}
                            >
                              {opt.key}
                            </button>
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                              placeholder={`Option ${letter} text...`}
                              className="flex-1 bg-transparent border-0 text-xs text-white focus:outline-none font-medium px-1"
                            />
                            {isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mr-1" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 2: STYLE, FONTS, AND COLOR EDITING                        */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'style' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Comprehensive Font Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Type className="w-3.5 h-3.5" />
                        <span>Select Font Family</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleApplyFontToAll(activeOptionZone.fontFamily || "'Hind Siliguri', sans-serif")}
                        className="text-[10px] font-black text-amber-400 hover:underline cursor-pointer"
                        title="Apply current font to stem and all options"
                      >
                        Apply Font to All
                      </button>
                    </div>

                    {/* Font Category Filter Tabs */}
                    <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-0.5 gap-1">
                      {[
                        { id: 'all' as const, label: 'All' },
                        { id: 'bangla' as const, label: 'Bangla' },
                        { id: 'english' as const, label: 'English' },
                        { id: 'imported' as const, label: 'Imported' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFontFilter(f.id)}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold capitalize transition-all cursor-pointer ${
                            fontFilter === f.id
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* Search fonts */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fontSearchQuery}
                        onChange={(e) => setFontSearchQuery(e.target.value)}
                        placeholder="Search fonts by name..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Font Dropdown / List */}
                    <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl bg-slate-950 border border-slate-800 p-1.5">
                      {filteredFonts.length === 0 ? (
                        <div className="text-center py-3 text-xs text-slate-500">
                          No matching fonts found.
                        </div>
                      ) : (
                        filteredFonts.map((f) => {
                          const isCurrent =
                            (activeZoneTab === 'stem' ? stemZone.fontFamily : activeOptionZone.fontFamily) ===
                            f.family;
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => handleSetZoneFont(f.family)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-all cursor-pointer ${
                                isCurrent
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                              }`}
                            >
                              <span style={{ fontFamily: f.family }} className="truncate font-semibold">
                                {f.name}
                              </span>
                              <span className="text-[9px] uppercase tracking-wider text-slate-500 px-1 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0 ml-1">
                                {f.category.replace('bangla_', '').replace('english_', '')}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Font Import Options: File & Google Fonts */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="flex-1 py-2 px-3 rounded-xl text-xs font-black bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-all">
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isFontLoading ? 'Loading Font...' : 'Import Font File (.ttf/.woff)'}</span>
                          <input
                            ref={fontFileInputRef}
                            type="file"
                            accept=".ttf,.otf,.woff,.woff2"
                            onChange={handleFontFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Google Font Quick Loader */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={googleFontInput}
                          onChange={(e) => setGoogleFontInput(e.target.value)}
                          placeholder="Or Google Font name (e.g. Baloo Da 2)"
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                        <button
                          type="button"
                          onClick={handleAddGoogleFont}
                          disabled={!googleFontInput.trim()}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:brightness-110 disabled:opacity-40 cursor-pointer"
                        >
                          Load
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Colors: Text Color Palette & Native Picker */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5" />
                        <span>Text Color</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const currentColor = activeZoneTab === 'stem' ? stemZone.color : activeOptionZone.color;
                          setStemZone((p) => ({ ...p, color: currentColor }));
                          setOptionsZone((p) => ({ ...p, color: currentColor }));
                          setOptAZone((p) => ({ ...p, color: currentColor }));
                          setOptBZone((p) => ({ ...p, color: currentColor }));
                          setOptCZone((p) => ({ ...p, color: currentColor }));
                          setOptDZone((p) => ({ ...p, color: currentColor }));
                        }}
                        className="text-[10px] font-black text-emerald-400 hover:underline cursor-pointer"
                        title="Apply this color to question stem and all options"
                      >
                        Apply Color to All
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {COLOR_PALETTE.map((c) => {
                        const currentColor = activeZoneTab === 'stem' ? stemZone.color : activeOptionZone.color;
                        const isSelected = currentColor.toLowerCase() === c.val.toLowerCase();
                        return (
                          <button
                            key={c.val}
                            type="button"
                            onClick={() => {
                              if (activeZoneTab === 'stem') {
                                setStemZone((p) => ({ ...p, color: c.val }));
                              } else if (optionsMode === 'separate') {
                                setZoneByTarget(activeZoneTab, (p) => ({ ...p, color: c.val }));
                              } else {
                                setOptionsZone((p) => ({ ...p, color: c.val }));
                              }
                            }}
                            className={`p-1.5 rounded-xl border flex items-center gap-1 text-[11px] font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-slate-800 border-amber-400 text-white ring-1 ring-amber-400'
                                : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded-full border ${c.bg}`} />
                            <span className="hidden sm:inline">{c.label}</span>
                          </button>
                        );
                      })}

                      {/* Custom Native Color Input */}
                      <label
                        className="p-1 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-1.5 cursor-pointer px-2 text-xs text-slate-300 hover:border-slate-700"
                        title="Pick custom hex color"
                      >
                        <input
                          type="color"
                          value={activeZoneTab === 'stem' ? stemZone.color : activeOptionZone.color}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (activeZoneTab === 'stem') {
                              setStemZone((p) => ({ ...p, color: val }));
                            } else if (optionsMode === 'separate') {
                              setZoneByTarget(activeZoneTab, (p) => ({ ...p, color: val }));
                            } else {
                              setOptionsZone((p) => ({ ...p, color: val }));
                            }
                          }}
                          className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <span className="font-mono text-[11px]">
                          {activeZoneTab === 'stem' ? stemZone.color : activeOptionZone.color}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Container Shape & Option Numbering */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Card / Background Styling</span>
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'plain', label: 'Transparent', hint: 'Text over artwork' },
                        { id: 'card', label: 'Glass Card', hint: 'Translucent back' },
                        { id: 'pill', label: 'Pill Shape', hint: 'Curved buttons' },
                      ].map((s) => {
                        const targetZone = activeZoneTab === 'stem' ? stemZone : activeOptionZone;
                        const isShape = targetZone.shape === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              const shape = s.id as SlideBoxShape;
                              if (activeZoneTab === 'stem') {
                                setStemZone((p) => ({ ...p, shape }));
                              } else if (optionsMode === 'separate') {
                                setZoneByTarget(activeZoneTab, (p) => ({ ...p, shape }));
                              } else {
                                setOptionsZone((p) => ({ ...p, shape }));
                              }
                            }}
                            className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                              isShape
                                ? 'bg-sky-500/20 border-sky-400 text-white font-bold'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            <div className="text-xs font-black">{s.label}</div>
                            <div className="text-[10px] text-slate-400 truncate">{s.hint}</div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Question Background Toggle */}
                    {activeZoneTab === 'stem' && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-xs font-bold text-slate-300">Question Card Background:</span>
                        <button
                          type="button"
                          onClick={handleToggleStemTransparency}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            stemZone.shape === 'plain'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{stemZone.shape === 'plain' ? 'Transparent (No Card)' : 'Glass Card Background'}</span>
                        </button>
                      </div>
                    )}

                    {/* Option Numbering Toggle (Shown vs Hidden) */}
                    {activeZoneTab !== 'stem' && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-xs font-bold text-slate-300">Option Numbering Badges:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const nextHide = !activeOptionZone.hideOptionBadges;
                            if (optionsMode === 'separate') {
                              setZoneByTarget(activeZoneTab, (p) => ({ ...p, hideOptionBadges: nextHide }));
                            } else {
                              setOptionsZone((p) => ({ ...p, hideOptionBadges: nextHide }));
                            }
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            activeOptionZone.hideOptionBadges
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {activeOptionZone.hideOptionBadges ? 'Hidden (Text Only)' : 'Shown (A/B/C/D)'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Font Size & Alignment */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-bold">Max Size</span>
                        <span className="font-mono text-amber-400 font-bold">
                          {activeZoneTab === 'stem' ? stemZone.fontSize : activeOptionZone.fontSize}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={18}
                        max={64}
                        value={activeZoneTab === 'stem' ? stemZone.fontSize : activeOptionZone.fontSize}
                        onChange={(e) => {
                          const size = Number(e.target.value);
                          if (activeZoneTab === 'stem') {
                            setStemZone((p) => ({ ...p, fontSize: size }));
                          } else if (optionsMode === 'separate') {
                            setZoneByTarget(activeZoneTab, (p) => ({ ...p, fontSize: size }));
                          } else {
                            setOptionsZone((p) => ({ ...p, fontSize: size }));
                          }
                        }}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-400 block">Alignment</span>
                      <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-0.5">
                        {(['left', 'center', 'right'] as const).map((a) => {
                          const currentAlign =
                            activeZoneTab === 'stem' ? stemZone.align : activeOptionZone.align;
                          return (
                            <button
                              key={a}
                              type="button"
                              onClick={() => {
                                if (activeZoneTab === 'stem') {
                                  setStemZone((p) => ({ ...p, align: a }));
                                } else if (optionsMode === 'separate') {
                                  setZoneByTarget(activeZoneTab, (p) => ({ ...p, align: a }));
                                } else {
                                  setOptionsZone((p) => ({ ...p, align: a }));
                                }
                              }}
                              className={`flex-1 py-1 rounded-lg text-xs font-bold capitalize cursor-pointer ${
                                currentAlign === a ? 'bg-slate-800 text-white' : 'text-slate-400'
                              }`}
                            >
                              {a}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyStyleToAllZones(activeZoneTab === 'stem' ? stemZone : activeOptionZone)}
                    className="w-full py-2 rounded-xl text-xs font-black bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Paintbrush className="w-3.5 h-3.5" />
                    <span>Apply Style, Font & Color to All Zones</span>
                  </button>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* TAB 3: ZONES & BOUNDED LAYOUT POSITIONING                     */}
              {/* ------------------------------------------------------------- */}
              {activeTab === 'layout' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Mode switcher: Separate vs Combined */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Options Layout Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleSwitchToSeparate}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          optionsMode === 'separate'
                            ? 'bg-sky-500/20 border-sky-400 text-white font-bold ring-1 ring-sky-400/50'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-black">
                          <Split className="w-3.5 h-3.5 text-amber-400" />
                          <span>4 Separate Boxes</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Position A, B, C, D anywhere</div>
                      </button>

                      <button
                        type="button"
                        onClick={handleSwitchToCombined}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          optionsMode === 'combined'
                            ? 'bg-sky-500/20 border-sky-400 text-white font-bold ring-1 ring-sky-400/50'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-black">
                          <Grid className="w-3.5 h-3.5 text-sky-400" />
                          <span>Combined Grid</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">1 single box with 2x2 grid</div>
                      </button>
                    </div>
                  </div>

                  {/* Active Zone Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Select Zone to Move / Resize
                    </label>
                    <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setActiveZoneTab('stem')}
                        className={`flex-1 min-w-[90px] py-1.5 px-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
                          className={`flex-1 min-w-[90px] py-1.5 px-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
                              className={`flex-1 min-w-[60px] py-1.5 px-1 rounded-lg text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
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

                  {/* Coordinate Fine-Tuning */}
                  <div className="space-y-2 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-xs font-bold text-slate-300 block">
                      Fine-Tune Coordinates ({activeZoneTab.replace('_', ' ').toUpperCase()}):
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">X Position (px)</span>
                        <input
                          type="number"
                          value={activeZoneTab === 'stem' ? stemZone.x : activeOptionZone.x}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (activeZoneTab === 'stem') setStemZone((p) => ({ ...p, x: val }));
                            else setZoneByTarget(activeZoneTab, (p) => ({ ...p, x: val }));
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Y Position (px)</span>
                        <input
                          type="number"
                          value={activeZoneTab === 'stem' ? stemZone.y : activeOptionZone.y}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (activeZoneTab === 'stem') setStemZone((p) => ({ ...p, y: val }));
                            else setZoneByTarget(activeZoneTab, (p) => ({ ...p, y: val }));
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Width (px)</span>
                        <input
                          type="number"
                          value={activeZoneTab === 'stem' ? stemZone.w : activeOptionZone.w}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (activeZoneTab === 'stem') setStemZone((p) => ({ ...p, w: val }));
                            else setZoneByTarget(activeZoneTab, (p) => ({ ...p, w: val }));
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Height (px)</span>
                        <input
                          type="number"
                          value={activeZoneTab === 'stem' ? stemZone.h : activeOptionZone.h}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (activeZoneTab === 'stem') setStemZone((p) => ({ ...p, h: val }));
                            else setZoneByTarget(activeZoneTab, (p) => ({ ...p, h: val }));
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* MODAL FOOTER ACTIONS */}
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template Name..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                />
              </div>

              <div className="flex items-center gap-2">
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
                  className="flex-[2] py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Save & Apply Template</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
