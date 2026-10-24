import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SlideTextBox, BgImageFit, MCQItem } from '../../types';
import { TemplateZoneCalibratorModal } from './TemplateZoneCalibratorModal';
import { SavedCustomTemplate, SocialAspectRatio } from './types';
import {
  Save,
  Trash2,
  Copy,
  Download,
  Upload,
  LayoutTemplate,
  Sparkles,
  Check,
  Plus,
  Box,
  Image as ImageIcon,
  Layers,
  ArrowRight,
  Crop,
  Sliders,
} from 'lucide-react';

interface CustomTemplateManagerProps {
  currentBoxes: SlideTextBox[];
  currentBgImageUrl: string;
  currentBgImageFit?: BgImageFit;
  currentBgColorPreset?: string;
  currentAspectRatio: SocialAspectRatio;
  currentDesignW: number;
  currentDesignH: number;
  defaultFontFamily?: string;
  isAppLight: boolean;
  sampleQuestion?: MCQItem;
  allQuestions?: MCQItem[];
  currentQuestionIndex?: number;
  onSelectQuestionIndex?: (idx: number) => void;
  onUpdateQuestion?: (item: MCQItem) => void;
  onApplyTemplate: (template: SavedCustomTemplate) => void;
  onOpenCalibrator?: (image?: string, boxes?: SlideTextBox[]) => void;
}

const TEMPLATES_STORAGE_KEY = 'social_post_custom_templates_v2';

export const BUILTIN_BOUNDED_PRESETS: SavedCustomTemplate[] = [
  {
    id: 'preset_comic_quiz_time_4_5',
    name: 'Comic Quiz Time (4:5 Bounded Graphic)',
    description: '864×1080 Custom imported comic graphic with bounded question card & auto-fitted options.',
    aspectRatio: '4:5',
    designW: 864,
    designH: 1080,
    bgImageUrl: '/templates/comic_quiz_time.jpg',
    bgImageFit: 'cover',
    isPreset: true,
    createdAt: 1700000004000,
    updatedAt: 1700000004000,
    boxes: [
      {
        id: 'b_stem',
        bind: 'stem',
        x: 95,
        y: 460,
        w: 674,
        h: 210,
        fontSize: 38,
        color: '#0f172a',
        align: 'center',
        bold: true,
        autoFit: true,
        isBoundedZone: true,
        shape: 'plain',
      },
      {
        id: 'b_options',
        bind: 'options',
        x: 95,
        y: 690,
        w: 674,
        h: 270,
        fontSize: 28,
        color: '#0f172a',
        align: 'left',
        bold: false,
        autoFit: true,
        isBoundedZone: true,
        shape: 'plain',
        optionsLayout: '2col',
      },
    ],
  },
  {
    id: 'preset_canva_quiz_square',
    name: 'Canva Modern Bounded Quiz (1:1)',
    description: '1080×1080 Square with bounded question card & 2×2 options grid.',
    aspectRatio: '1:1',
    designW: 1080,
    designH: 1080,
    bgColorPreset: 'gradient_amber',
    bgImageFit: 'cover',
    isPreset: true,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    boxes: [
      { id: 'b_brand', bind: 'brand', x: 86, y: 64, w: 908, h: 54, fontSize: 34, color: '#fbbf24', align: 'left', bold: true },
      { id: 'b_header', bind: 'headerTitle', x: 86, y: 130, w: 908, h: 44, fontSize: 26, color: '#94a3b8', align: 'left', bold: false },
      {
        id: 'b_stem',
        bind: 'stem',
        x: 86,
        y: 200,
        w: 908,
        h: 270,
        fontSize: 42,
        color: '#ffffff',
        align: 'left',
        bold: true,
        autoFit: true,
        isBoundedZone: true,
        shape: 'card',
        bg: 'rgba(15,23,42,0.7)',
      },
      {
        id: 'b_options',
        bind: 'options',
        x: 86,
        y: 504,
        w: 908,
        h: 440,
        fontSize: 32,
        color: '#ffffff',
        align: 'left',
        bold: false,
        autoFit: true,
        isBoundedZone: true,
        shape: 'card',
      },
      { id: 'b_footer', bind: 'footerTag', x: 86, y: 976, w: 908, h: 40, fontSize: 22, color: '#fbbf24', align: 'center', bold: true },
    ],
  },
  {
    id: 'preset_canva_feed_portrait',
    name: 'Feed Portrait Bounded Pro (4:5)',
    description: '864×1080 Mobile vertical feed with bounded question zone & 2×2 options.',
    aspectRatio: '4:5',
    designW: 864,
    designH: 1080,
    bgColorPreset: 'gradient_blue',
    bgImageFit: 'cover',
    isPreset: true,
    createdAt: 1700000001000,
    updatedAt: 1700000001000,
    boxes: [
      { id: 'b_brand', bind: 'brand', x: 60, y: 56, w: 744, h: 50, fontSize: 32, color: '#38bdf8', align: 'left', bold: true },
      { id: 'b_header', bind: 'headerTitle', x: 60, y: 116, w: 744, h: 40, fontSize: 24, color: '#cbd5e1', align: 'left', bold: false },
      {
        id: 'b_stem',
        bind: 'stem',
        x: 60,
        y: 176,
        w: 744,
        h: 300,
        fontSize: 40,
        color: '#ffffff',
        align: 'left',
        bold: true,
        autoFit: true,
        isBoundedZone: true,
        shape: 'card',
        bg: 'rgba(15,23,42,0.75)',
      },
      {
        id: 'b_options',
        bind: 'options',
        x: 60,
        y: 506,
        w: 744,
        h: 460,
        fontSize: 30,
        color: '#ffffff',
        align: 'left',
        bold: false,
        autoFit: true,
        isBoundedZone: true,
        shape: 'card',
      },
      { id: 'b_footer', bind: 'footerTag', x: 60, y: 996, w: 744, h: 36, fontSize: 22, color: '#38bdf8', align: 'center', bold: true },
    ],
  },
  {
    id: 'preset_canva_story_vertical',
    name: 'Story & Reels Quiz Time (9:16)',
    description: '608×1080 Full-screen story with bounded question and vertical options stack.',
    aspectRatio: '9:16',
    designW: 608,
    designH: 1080,
    bgColorPreset: 'gradient_emerald',
    bgImageFit: 'cover',
    isPreset: true,
    createdAt: 1700000002000,
    updatedAt: 1700000002000,
    boxes: [
      { id: 'b_brand', bind: 'brand', x: 44, y: 64, w: 520, h: 48, fontSize: 28, color: '#34d399', align: 'left', bold: true },
      {
        id: 'b_stem',
        bind: 'stem',
        x: 44,
        y: 140,
        w: 520,
        h: 330,
        fontSize: 36,
        color: '#ffffff',
        align: 'left',
        bold: true,
        autoFit: true,
        isBoundedZone: true,
        shape: 'card',
        bg: 'rgba(6,78,59,0.7)',
      },
      {
        id: 'b_options',
        bind: 'options',
        x: 44,
        y: 500,
        w: 520,
        h: 460,
        fontSize: 26,
        color: '#ffffff',
        align: 'left',
        bold: false,
        autoFit: true,
        isBoundedZone: true,
        shape: 'card',
      },
      { id: 'b_footer', bind: 'footerTag', x: 44, y: 994, w: 520, h: 36, fontSize: 20, color: '#34d399', align: 'center', bold: true },
    ],
  },
  {
    id: 'preset_canva_landscape_banner',
    name: 'Banner & Video Slide Quiz (16:9)',
    description: '1920×1080 2-column layout: bounded stem on left, bounded options on right.',
    aspectRatio: '16:9',
    designW: 1920,
    designH: 1080,
    bgColorPreset: 'gradient_amber',
    bgImageFit: 'cover',
    isPreset: true,
    createdAt: 1700000003000,
    updatedAt: 1700000003000,
    boxes: [
      { id: 'b_brand', bind: 'brand', x: 100, y: 64, w: 820, h: 56, fontSize: 44, color: '#fbbf24', align: 'left', bold: true },
      {
        id: 'b_stem',
        bind: 'stem',
        x: 100,
        y: 160,
        w: 820,
        h: 760,
        fontSize: 48,
        color: '#ffffff',
        align: 'left',
        bold: true,
        autoFit: true,
        isBoundedZone: true,
        shape: 'card',
        bg: 'rgba(15,23,42,0.7)',
      },
      {
        id: 'b_options',
        bind: 'options',
        x: 980,
        y: 160,
        w: 840,
        h: 760,
        fontSize: 36,
        color: '#ffffff',
        align: 'left',
        bold: false,
        autoFit: true,
        isBoundedZone: true,
        shape: 'card',
      },
      { id: 'b_footer', bind: 'footerTag', x: 100, y: 970, w: 1720, h: 40, fontSize: 26, color: '#fbbf24', align: 'left', bold: true },
    ],
  },
];

export const CustomTemplateManager: React.FC<CustomTemplateManagerProps> = ({
  currentBoxes,
  currentBgImageUrl,
  currentBgImageFit = 'cover',
  currentBgColorPreset = 'gradient_amber',
  currentAspectRatio,
  currentDesignW,
  currentDesignH,
  defaultFontFamily,
  isAppLight,
  sampleQuestion,
  allQuestions,
  currentQuestionIndex,
  onSelectQuestionIndex,
  onUpdateQuestion,
  onApplyTemplate,
  onOpenCalibrator,
}) => {
  const [isCalibratorOpen, setIsCalibratorOpen] = useState(false);
  const [calibratorImage, setCalibratorImage] = useState<string>('');
  const [calibratorBoxes, setCalibratorBoxes] = useState<SlideTextBox[] | undefined>(undefined);
  const [savedTemplates, setSavedTemplates] = useState<SavedCustomTemplate[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [appliedId, setAppliedId] = useState<string | null>(null);

  // Load saved templates from localStorage (with fallback migration from v1)
  useEffect(() => {
    try {
      let raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (!raw) {
        raw = localStorage.getItem('social_post_custom_templates_v1');
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Filter out any canned presets so only user custom templates are loaded
          const userTemplates = parsed.filter((t: any) => !t.isPreset);
          setSavedTemplates(userTemplates);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const saveTemplatesToStorage = (list: SavedCustomTemplate[]) => {
    const cleanList = list.filter(t => !t.isPreset);
    setSavedTemplates(cleanList);
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(cleanList));
    } catch {
      // ignore
    }
  };

  const handleOpenCalibrator = (img?: string, boxes?: SlideTextBox[]) => {
    const targetImg = img || currentBgImageUrl || '';
    const targetBoxes = boxes || currentBoxes;
    if (onOpenCalibrator) {
      onOpenCalibrator(targetImg, targetBoxes);
    } else {
      setCalibratorImage(targetImg);
      setCalibratorBoxes(targetBoxes);
      setIsCalibratorOpen(true);
    }
  };

  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;

    const newTemplate: SavedCustomTemplate = {
      id: `tpl_${Date.now()}`,
      name: templateName.trim(),
      description: templateDesc.trim() || undefined,
      aspectRatio: currentAspectRatio,
      designW: currentDesignW,
      designH: currentDesignH,
      bgImageUrl: currentBgImageUrl || undefined,
      bgImageFit: currentBgImageFit,
      bgColorPreset: currentBgColorPreset,
      boxes: currentBoxes.map(b => ({ ...b })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [newTemplate, ...savedTemplates];
    saveTemplatesToStorage(updated);
    setTemplateName('');
    setTemplateDesc('');
    setIsSaveModalOpen(false);
  };

  const handleDeleteTemplate = (id: string) => {
    if (!window.confirm('Delete this custom template?')) return;
    const updated = savedTemplates.filter(t => t.id !== id);
    saveTemplatesToStorage(updated);
  };

  const handleDuplicateTemplate = (tpl: SavedCustomTemplate) => {
    const copy: SavedCustomTemplate = {
      ...tpl,
      id: `tpl_${Date.now()}`,
      name: `${tpl.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPreset: false,
    };
    saveTemplatesToStorage([copy, ...savedTemplates]);
  };

  const handleExportTemplates = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedTemplates, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `custom-post-templates-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleImportTemplates = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (Array.isArray(parsed)) {
          const merged = [...parsed.filter(p => p && p.id && Array.isArray(p.boxes)), ...savedTemplates];
          // deduplicate by id
          const unique = Array.from(new Map(merged.map(m => [m.id, m])).values());
          saveTemplatesToStorage(unique);
          alert(`Imported ${parsed.length} custom template(s) successfully!`);
        }
      } catch {
        alert('Invalid template JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleSelectTemplate = (tpl: SavedCustomTemplate) => {
    onApplyTemplate(tpl);
    setAppliedId(tpl.id);
    setTimeout(() => setAppliedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Action Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500">
            <LayoutTemplate className="w-4 h-4" />
          </div>
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider ${isAppLight ? 'text-amber-700' : 'text-amber-400'}`}>
              Custom Templates & Bounded Zones
            </h4>
            <p className={`text-[11px] ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Save your custom canvas layout so texts automatically fit inside bounded areas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleOpenCalibrator()}
            className="px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 shadow-md shadow-emerald-500/20 cursor-pointer transition-all"
          >
            <Crop className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Import & Calibrate Graphic</span>
          </button>
          <button
            type="button"
            onClick={() => setIsSaveModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 bg-amber-500 hover:brightness-110 text-slate-950 shadow-md shadow-amber-500/20 cursor-pointer transition-all"
          >
            <Save className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Save Canvas</span>
          </button>
        </div>
      </div>

      {/* Templates Header & Import/Export Actions */}
      <div className="flex items-center justify-between pt-1">
        <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
          isAppLight ? 'text-slate-800' : 'text-slate-200'
        }`}>
          <span>Saved Custom Templates</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
            {savedTemplates.length}
          </span>
        </span>

        {savedTemplates.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleExportTemplates}
              title="Export Templates to JSON"
              className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                isAppLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <label
              title="Import Templates from JSON"
              className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                isAppLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <input type="file" accept=".json" onChange={handleImportTemplates} className="hidden" />
            </label>
          </div>
        )}
      </div>

      {/* Template List */}
      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {savedTemplates.length === 0 ? (
          <div className={`p-6 rounded-2xl border text-center space-y-3 ${
            isAppLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}>
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <LayoutTemplate className="w-6 h-6 stroke-[1.75]" />
            </div>
            <div className="space-y-1">
              <p className={`text-xs font-black uppercase tracking-wider ${isAppLight ? 'text-slate-800' : 'text-slate-200'}`}>
                No Saved Custom Templates
              </p>
              <p className={`text-[11px] leading-relaxed max-w-xs mx-auto ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Upload any template graphic to calibrate bounded question & options zones, or design directly on canvas and save your template.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={() => handleOpenCalibrator()}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 shadow-md cursor-pointer inline-flex items-center gap-1.5"
              >
                <Crop className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Import & Calibrate Graphic</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(true)}
                className="px-3 py-2 rounded-xl text-xs font-black bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Canvas</span>
              </button>
            </div>
          </div>
        ) : (
            savedTemplates.map((tpl) => {
              const isApplied = appliedId === tpl.id;
              const boundedBoxes = tpl.boxes.filter(b => b.h && b.h > 0);
              return (
                <div
                  key={tpl.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    isApplied
                      ? 'border-amber-400 ring-2 ring-amber-400/50 bg-amber-500/10'
                      : isAppLight
                      ? 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-black truncate ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                          {tpl.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {tpl.aspectRatio}
                        </span>
                        {boundedBoxes.length > 0 && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {boundedBoxes.length} Bounded Zone{boundedBoxes.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {tpl.description && (
                        <p className={`text-[11px] truncate ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {tpl.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDuplicateTemplate(tpl)}
                        title="Duplicate"
                        className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          isAppLight ? 'bg-white border-slate-200 text-slate-600 hover:text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        title="Delete"
                        className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          isAppLight ? 'bg-white border-slate-200 text-rose-600 hover:bg-rose-50' : 'bg-slate-900 border-slate-800 text-rose-400 hover:bg-rose-950/30'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <span className={`text-[10px] font-mono ${isAppLight ? 'text-slate-400' : 'text-slate-500'}`}>
                      {tpl.boxes.length} elements · {tpl.designW}×{tpl.designH}px
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenCalibrator(tpl.bgImageUrl, tpl.boxes)}
                        title="Calibrate Bounded Zones"
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 flex items-center gap-1 border border-slate-700 transition-all cursor-pointer"
                      >
                        <Crop className="w-3 h-3 text-amber-400" />
                        <span>Calibrate</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectTemplate(tpl)}
                        className="px-4 py-1.5 rounded-xl text-xs font-black bg-amber-500 hover:brightness-110 text-slate-950 shadow cursor-pointer flex items-center gap-1.5 transition-all"
                      >
                        {isApplied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>{isApplied ? 'Applied!' : 'Apply Template'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
      </div>

      {/* Interactive Zone Calibrator Modal */}
      <TemplateZoneCalibratorModal
        open={isCalibratorOpen}
        defaultFontFamily={defaultFontFamily}
        initialImageUrl={calibratorImage || currentBgImageUrl || ''}
        initialBoxes={calibratorBoxes || currentBoxes}
        sampleQuestion={sampleQuestion}
        allQuestions={allQuestions}
        currentQuestionIndex={currentQuestionIndex}
        onSelectQuestionIndex={onSelectQuestionIndex}
        onUpdateQuestion={onUpdateQuestion}
        isAppLight={isAppLight}
        onClose={() => setIsCalibratorOpen(false)}
        onSaveAndApply={(newTpl) => {
          saveTemplatesToStorage([newTpl, ...savedTemplates.filter(t => t.id !== newTpl.id)]);
          handleSelectTemplate(newTpl);
        }}
      />

      {/* Save Modal */}
      {isSaveModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl border p-6 space-y-4 shadow-2xl ${
            isAppLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-amber-500">
                <Save className="w-4 h-4" />
                Save Custom Template
              </h3>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className={`text-xs ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Save this canvas layout, background image, aspect ratio ({currentAspectRatio}), and bounded text areas as a reusable template.
            </p>

            <form onSubmit={handleSaveCurrentAsTemplate} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. My Biology Quiz Card / Blue Neon Story"
                  className={`w-full border rounded-xl px-4 py-2.5 text-xs font-bold focus:border-amber-500 focus:outline-none ${
                    isAppLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  placeholder="e.g. 1:1 post with bounded stem and 2x2 options"
                  className={`w-full border rounded-xl px-4 py-2 text-xs focus:border-amber-500 focus:outline-none ${
                    isAppLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>

              <div className={`p-3 rounded-2xl border text-xs space-y-1 font-mono ${
                isAppLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}>
                <div>Ratio: <span className="text-amber-500 font-bold">{currentAspectRatio}</span> ({currentDesignW}×{currentDesignH}px)</div>
                <div>Elements: <span className="font-bold">{currentBoxes.length}</span> (Bounded Zones: <span className="text-emerald-400 font-bold">{currentBoxes.filter(b => b.h && b.h > 0).length}</span>)</div>
                <div>Background: <span className="font-bold">{currentBgImageUrl ? 'Custom Image Graphic' : currentBgColorPreset}</span></div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    isAppLight ? 'border-slate-300 text-slate-700 hover:bg-slate-100' : 'border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-black bg-amber-500 text-slate-950 hover:brightness-110 shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Save Template</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
