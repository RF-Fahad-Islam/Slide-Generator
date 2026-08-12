import React, { useState, useRef, useMemo, useEffect } from 'react';
import { DeckConfig, MCQItem } from '../types';
import { exportDeckToPPTX, PptxSlideSpec } from '../utils/pptxExport';
import { SlideCanvas } from './SlideCanvas';
import { SlideThumb } from './SlideThumb';
import { SlideTextBoxLayer } from './SlideTextBoxLayer';
import { boxContentHasMath, ensureAnswerBox } from '../utils/slideTextBoxes';
import { DeckQuestionPaperModal } from './DeckQuestionPaperModal';
import { expandDeckSlides, effectiveAnswerMode, effectiveShowAnswerInSlide, SlideRef, resolveSlideAnswerFlags } from '../utils/answerSlides';
import { toPng } from 'html-to-image';
import { safeToPng } from '../utils/cleanExport';
import { getFontEmbedCSS } from '../utils/fontEmbed';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { downloadJSON } from '../utils/mcqJson';
import jsPDF from 'jspdf';
import { FileArchive, CheckCircle2, Loader2, X, Presentation, ExternalLink, FileText } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MCQItem[];
  config: DeckConfig;
  // Physical index into the expanded slide list (question + answer slides).
  currentIndex: number;
  // The exact slide the user is currently viewing (variant-aware) — used by
  // 'current' scope exports so an answer slide exports with its highlight.
  currentSlideRef?: SlideRef | null;
  slideRef: React.RefObject<HTMLDivElement | null>;
  appTheme?: 'dark' | 'light';
  scope?: 'all' | 'current';
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  items,
  config,
  currentIndex,
  currentSlideRef,
  slideRef,
  appTheme = 'dark',
  scope = 'all',
}) => {
  const isAppLight = appTheme === 'light';
  const [isExporting, setIsExporting] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [showGoogleSlidesGuide, setShowGoogleSlidesGuide] = useState(false);
  const [isDeckPaperOpen, setIsDeckPaperOpen] = useState(false);
  const exportCanvasRef = useRef<HTMLDivElement | null>(null);

  // Expanded physical slide lists. `fullSlides` mirrors what the user sees in the
  // preview (deck's answer mode); `answerSlides` FORCES 'separate_slide' expansion
  // so the "Include Answer Slides" checkbox adds question + answer pairs even when
  // the deck itself is in 'hidden' or 'highlight' mode; `questionSlides` is clean
  // question-only. The checkbox defaults to following the deck mode but can be
  // flipped per export.
  const fullSlides = useMemo(() => expandDeckSlides(items, config), [items, config]);
  const answerSlides = useMemo(
    () => expandDeckSlides(items, { ...config, answerMode: 'separate_slide' }),
    [items, config]
  );
  const questionSlides = useMemo(
    () => expandDeckSlides(items, { ...config, answerMode: 'hidden', showAnswerInSlide: false }),
    [items, config]
  );

  const currentSlide: SlideRef | null =
    currentSlideRef ?? fullSlides[Math.min(currentIndex, Math.max(0, fullSlides.length - 1))] ?? null;

  const [includeAnswerSlides, setIncludeAnswerSlides] = useState<boolean>(() => effectiveAnswerMode(config) === 'separate_slide');
  // Sync the per-export default to the deck's answer mode each time the modal
  // OPENS (not on every config change while it's open, which would clobber the
  // user's manual toggle mid-export).
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setIncludeAnswerSlides(effectiveAnswerMode(config) === 'separate_slide');
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, config]);
  // The slide ref currently being rasterized in the offscreen canvas.
  const [renderSlideRef, setRenderSlideRef] = useState<SlideRef | null>(null);
  // The slide ref currently being rasterized for a background-only PPTX capture.
  const [bgRenderSlideRef, setBgRenderSlideRef] = useState<SlideRef | null>(null);
  const bgExportCanvasRef = useRef<HTMLDivElement | null>(null);
  // The slide currently being rasterized for its transparent LaTeX/math box
  // overlay (only math boxes render; everything else is transparent).
  const [mathOverlaySlideRef, setMathOverlaySlideRef] = useState<SlideRef | null>(null);
  const mathOverlayCanvasRef = useRef<HTMLDivElement | null>(null);
  // Whether answer slides include the explanation box (defaults to ON — answer
  // slides always showed it before; the toggle lets exports drop it).
  const [includeExplanation, setIncludeExplanation] = useState<boolean>(true);
  const [includeAnswerKeySlides, setIncludeAnswerKeySlides] = useState<boolean>(false);
  // When true the PPTX embeds each slide as an exact full-bleed image of the
  // live preview (pixel-identical, non-editable layers) instead of native
  // editable text/shape layers.
  const [renderAsImages, setRenderAsImages] = useState<boolean>(false);
  // When true the PPTX bundles the deck's actual font files (PowerPoint
  // embedded fonts) so it renders correctly on machines that don't have the
  // fonts installed. Defaults ON.
  const [embedFonts, setEmbedFonts] = useState<boolean>(true);

  if (!isOpen) return null;

  // Which slides the current export includes.
  const isCurrentScope = scope === 'current';
  const scopeSlides: SlideRef[] = isCurrentScope
    ? currentSlide
      ? [currentSlide]
      : []
    : includeAnswerSlides
    ? answerSlides
    : questionSlides;

  // Question Paper gets the raw items (scoped).
  const paperItems = isCurrentScope ? (currentSlide ? [currentSlide.item] : []) : items;

  // Renders the exact background stack (gradient/color, bg image, tint,
  // ambient glows — no header/content/footer/text boxes) for each slide in
  // scope, so the PPTX export can embed it as one pixel-accurate picture
  // layer instead of approximating gradients with shapes.
  const renderBackgroundDataUrls = async (): Promise<string[]> => {
    // D14 invariant — must await webfonts before ANY rasterization, otherwise
    // a fresh page load can rasterize blank/fallback glyphs (esp. Bangla) into
    // the exported background picture layer.
    await document.fonts.ready;
    const fontEmbedCSS = await getFontEmbedCSS();
    const backgroundDataUrls: string[] = [];
    for (let i = 0; i < scopeSlides.length; i++) {
      const ref = scopeSlides[i];
      setBgRenderSlideRef(ref);
      await new Promise((r) => setTimeout(r, 60));
      const el = bgExportCanvasRef.current;
      if (el) {
        try {
          const url = await safeToPng(el, { fontEmbedCSS });
          backgroundDataUrls.push(url);
        } catch {
          backgroundDataUrls.push('');
        }
      } else {
        backgroundDataUrls.push('');
      }
    }
    return backgroundDataUrls;
  };

  // Renders the EXACT full slide (background + text + shapes + icons — the
  // whole DOM renderer output) for each slide in scope, so the PPTX can embed
  // pixel-identical pictures instead of native layers.
  const renderFullSlideDataUrls = async (): Promise<string[]> => {
    // D14 invariant — must await webfonts before ANY rasterization.
    await document.fonts.ready;
    const fontEmbedCSS = await getFontEmbedCSS();
    const fullSlideDataUrls: string[] = [];
    for (let i = 0; i < scopeSlides.length; i++) {
      const ref = scopeSlides[i];
      setRenderSlideRef(ref);
      setProgressMsg(`Rendering exact slide image ${i + 1} of ${scopeSlides.length}...`);
      await new Promise((r) => setTimeout(r, 150));
      const el = exportCanvasRef.current;
      if (el) {
        try {
          const url = await safeToPng(el, { fontEmbedCSS });
          fullSlideDataUrls.push(url);
        } catch {
          fullSlideDataUrls.push('');
        }
      } else {
        fullSlideDataUrls.push('');
      }
    }
    return fullSlideDataUrls;
  };

  // Boxes whose rendered content contains LaTeX/math that PPTX native text
  // cannot reproduce (it would strip math to plain text). Used both when
  // rasterizing the math overlay and when rendering it offscreen, so the
  // detection can never drift between the two.
  const getMathBoxIds = (ref: SlideRef): string[] => {
    const effConfig: DeckConfig = { ...config, ...(ref.item.customConfig || {}) };
    const boxes = ensureAnswerBox(effConfig.slideTextBoxes || [], effConfig);
    return boxes
      .filter(b => boxContentHasMath(b, ref.item, effConfig, ref.questionIndex))
      .map(b => b.id);
  };

  // Renders a transparent overlay containing ONLY the boxes whose content has
  // LaTeX/math (which PPTX native text can't reproduce — it would strip math
  // to plain text). The overlay is captured from the DOM renderer so KaTeX
  // typesets math exactly like the preview; native layers are drawn beneath.
  // Slides with no math boxes yield '' (no overlay) for that position.
  const renderMathOverlayDataUrls = async (): Promise<string[]> => {
    await document.fonts.ready;
    const fontEmbedCSS = await getFontEmbedCSS();
    const mathOverlayDataUrls: string[] = [];
    for (let i = 0; i < scopeSlides.length; i++) {
      const ref = scopeSlides[i];
      const mathBoxIds = getMathBoxIds(ref);
      if (mathBoxIds.length === 0) {
        mathOverlayDataUrls.push('');
        continue;
      }
      setMathOverlaySlideRef(ref);
      setProgressMsg(`Rendering math overlay ${i + 1} of ${scopeSlides.length}...`);
      await new Promise((r) => setTimeout(r, 150));
      const el = mathOverlayCanvasRef.current;
      if (el) {
        try {
          const url = await safeToPng(el, { fontEmbedCSS });
          mathOverlayDataUrls.push(url);
        } catch {
          mathOverlayDataUrls.push('');
        }
      } else {
        mathOverlayDataUrls.push('');
      }
    }
    return mathOverlayDataUrls;
  };

  const toPptxSpecs = (): PptxSlideSpec[] =>
    scopeSlides.map(s => ({ item: s.item, questionIndex: s.questionIndex, isAnswerSlide: s.isAnswerSlide }));

  // Export to PowerPoint PPTX (16:9 Widescreen) — native editable text/shape
  // layers on top of a pixel-accurate rasterized background picture layer.
  const downloadPPTX = async () => {
    if (scopeSlides.length === 0) return;
    setIsExporting(true);
    try {
      const specs = toPptxSpecs();
      const backgroundDataUrls = renderAsImages ? [] : await renderBackgroundDataUrls();
      const fullSlideDataUrls = renderAsImages ? await renderFullSlideDataUrls() : undefined;
      const mathOverlayDataUrls = renderAsImages ? undefined : await renderMathOverlayDataUrls();
      await exportDeckToPPTX(items, config, (msg) => setProgressMsg(msg), specs, includeExplanation, backgroundDataUrls, includeAnswerKeySlides, fullSlideDataUrls, mathOverlayDataUrls, embedFonts);
    } catch (err: any) {
      console.error('PPTX Export Error:', err);
      alert('Failed to generate PowerPoint presentation: ' + err.message);
    } finally {
      setIsExporting(false);
      setProgressMsg('');
      setBgRenderSlideRef(null);
      setRenderSlideRef(null);
      setMathOverlaySlideRef(null);
    }
  };

  // Export for Google Slides: Downloads the same PPTX & opens Google Drive upload prompt
  const handleExportGoogleSlides = async () => {
    if (scopeSlides.length === 0) return;
    setIsExporting(true);
    try {
      const specs = toPptxSpecs();
      const backgroundDataUrls = renderAsImages ? [] : await renderBackgroundDataUrls();
      const fullSlideDataUrls = renderAsImages ? await renderFullSlideDataUrls() : undefined;
      const mathOverlayDataUrls = renderAsImages ? undefined : await renderMathOverlayDataUrls();
      await exportDeckToPPTX(items, config, (msg) => setProgressMsg(msg), specs, includeExplanation, backgroundDataUrls, undefined, fullSlideDataUrls, mathOverlayDataUrls, embedFonts);
      setShowGoogleSlidesGuide(true);
    } catch (err: any) {
      console.error('Google Slides PPTX Export Error:', err);
      alert('Failed to generate presentation file: ' + err.message);
    } finally {
      setIsExporting(false);
      setProgressMsg('');
      setBgRenderSlideRef(null);
      setRenderSlideRef(null);
      setMathOverlaySlideRef(null);
    }
  };

  // Download Current Active Slide PNG
  const downloadSingleSlide = async () => {
    if (!currentSlide) return;
    setIsExporting(true);
    setProgressMsg('Rendering active slide PNG (1920x1080)...');
    setRenderSlideRef(currentSlide);

    try {
      await document.fonts.ready;
      await new Promise(r => setTimeout(r, 100));
      const targetEl = exportCanvasRef.current || slideRef.current;
      if (!targetEl) throw new Error('Slide element not ready');

      const fontEmbedCSS = await getFontEmbedCSS();
      const dataUrl = await safeToPng(targetEl, {
        pixelRatio: 2,
        fontEmbedCSS,
      });

      const deckPrefix = (config.deckName || config.brandName || 'Slide').replace(/\s+/g, '_');
      const fileName = `${deckPrefix}_q${currentSlide.questionIndex + 1}${currentSlide.isAnswerSlide ? '_ans' : ''}.png`;
      saveAs(dataUrl, fileName);
    } catch (err: any) {
      console.error('Single Slide Export Error:', err);
      alert('Failed to render slide image: ' + err.message);
    } finally {
      setIsExporting(false);
      setProgressMsg('');
      setRenderSlideRef(null);
    }
  };

  // Bulk Export All Slides to ZIP with exact template applied to every slide
  const downloadBulkZip = async () => {
    if (scopeSlides.length === 0) return;
    setIsExporting(true);
    const zip = new JSZip();

    try {
      await document.fonts.ready;
      const deckPrefix = (config.deckName || config.brandName || 'Slides').replace(/\s+/g, '_');
      const folder = zip.folder(`${deckPrefix}_MCQs`);
      const fontEmbedCSS = await getFontEmbedCSS();

      for (let i = 0; i < scopeSlides.length; i++) {
        const ref = scopeSlides[i];
        setRenderSlideRef(ref);
        const padIndex = (ref.questionIndex + 1).toString().padStart(2, '0');
        setProgressMsg(`Rendering slide ${i + 1} of ${scopeSlides.length}...`);
        await new Promise(r => setTimeout(r, 150));

        const targetEl = exportCanvasRef.current || slideRef.current;
        if (targetEl) {
          const dataUrl = await safeToPng(targetEl, {
            pixelRatio: 2,
            fontEmbedCSS,
          });
          const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
          folder?.file(`${padIndex}_${ref.isAnswerSlide ? 'ans' : 'q'}.png`, base64, { base64: true });
        }
      }

      setProgressMsg('Packaging ZIP file...');
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(
        blob,
        isCurrentScope
          ? `${deckPrefix}_Slide_${(currentSlide?.questionIndex ?? 0) + 1}.zip`
          : `${deckPrefix}_MCQ_Slides.zip`
      );
    } catch (err: any) {
      console.error('Bulk ZIP Export Error:', err);
      alert('Failed to generate ZIP export: ' + err.message);
    } finally {
      setIsExporting(false);
      setProgressMsg('');
      setRenderSlideRef(null);
    }
  };

  // Download PDF Presentation Document
  const downloadPDF = async () => {
    if (scopeSlides.length === 0) return;
    setIsExporting(true);
    try {
      await document.fonts.ready;
      const fontEmbedCSS = await getFontEmbedCSS();
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1920, 1080],
      });

      for (let i = 0; i < scopeSlides.length; i++) {
        const ref = scopeSlides[i];
        setRenderSlideRef(ref);
        setProgressMsg(`Rendering PDF slide ${i + 1} of ${scopeSlides.length}...`);
        await new Promise(r => setTimeout(r, 150));

        const targetEl = exportCanvasRef.current || slideRef.current;
        if (!targetEl) continue;

        const dataUrl = await safeToPng(targetEl, {
          fontEmbedCSS,
        });

        if (i > 0) pdf.addPage([1920, 1080], 'landscape');
        pdf.addImage(dataUrl, 'PNG', 0, 0, 1920, 1080);
      }

      setProgressMsg('Saving PDF presentation document...');
      const deckPrefix = (config.deckName || config.brandName || 'MCQ_Deck').replace(/\s+/g, '_');
      pdf.save(`${deckPrefix}_Slides.pdf`);
    } catch (err: any) {
      console.error('PDF Export Error:', err);
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      setIsExporting(false);
      setProgressMsg('');
      setRenderSlideRef(null);
    }
  };

  // Export Deck JSON Backup
  const downloadDeckJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ config, items }, null, 2));
    const deckPrefix = (config.deckName || config.brandName || 'Deck').replace(/\s+/g, '_');
    saveAs(dataStr, `${deckPrefix}_mcq_backup.json`);
  };

  // Extract MCQs only (clean question array — no config/slide overrides) as re-importable JSON
  const downloadMCQsJSON = () => {
    if (items.length === 0) return;
    const cleanItems = items.map(({ customConfig, ...q }) => q);
    const deckPrefix = (config.deckName || config.brandName || 'MCQ').replace(/\s+/g, '_');
    downloadJSON(cleanItems, `${deckPrefix}_mcqs.json`);
  };

  const scopeSlideCount = isCurrentScope ? 1 : scopeSlides.length;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-modal-backdrop ${
      isAppLight ? 'bg-black/40' : 'bg-black/80'
    }`}>
      <div className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} relative w-full max-w-2xl border p-6 lg:p-8 space-y-6 max-h-[90vh] overflow-y-auto animate-modal-card ${
        isAppLight ? 'border-slate-200' : 'bg-slate-900/80 border-slate-800'
      }`}>
        <button
          onClick={onClose}
          disabled={isExporting}
          className={`absolute top-5 right-5 p-2.5 rounded-xl cursor-pointer transition-colors ${
            isAppLight ? 'bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className={`flex items-center gap-4 pb-4 border-b ${isAppLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25">
            <Presentation className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-xl font-black ${isAppLight ? 'text-slate-900' : 'text-white'}`}>Export 16:9 Presentation Deck</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                isCurrentScope
                  ? isAppLight ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                  : isAppLight ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
              }`}>
                {isCurrentScope
                  ? `Current Slide #${(currentSlide?.physicalIndex ?? currentIndex) + 1}`
                  : `${includeAnswerSlides ? 'Question + Answer' : 'Question'} (${scopeSlideCount} slide${scopeSlideCount === 1 ? '' : 's'})`}
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Download PowerPoint (.pptx), Google Slides, high-res PNG images or JSON
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`p-5 rounded-2xl border flex items-center justify-between gap-4 shadow-lg ${
            isAppLight
              ? 'bg-amber-50 border-amber-300 shadow-amber-200/30'
              : 'bg-slate-950 border-amber-500/40 bg-gradient-to-r from-amber-500/10 to-transparent'
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                  Recommended
                </span>
                <h4 className={`text-base font-extrabold flex items-center gap-2 ${isAppLight ? 'text-amber-700' : 'text-amber-300'}`}>
                  <Presentation className="w-4 h-4" />
                  Download PowerPoint (.pptx)
                </h4>
              </div>
              <p className={`text-xs mt-1 ${isAppLight ? 'text-slate-600' : 'text-slate-300'}`}>
                {renderAsImages
                  ? isCurrentScope
                    ? `Embeds slide #${(currentSlide?.physicalIndex ?? currentIndex) + 1} as an exact high-res image — pixel-identical to the preview, non-editable layers.`
                    : 'Embeds every slide as an exact high-res image — pixel-identical to the preview, non-editable layers.'
                  : isCurrentScope
                  ? `Generates a single 16:9 PowerPoint slide for slide #${(currentSlide?.physicalIndex ?? currentIndex) + 1} with editable text fields & layers, over a pixel-accurate background image.`
                  : 'Generates editable 16:9 PowerPoint slides — text fields, shapes & icons stay as selectable native layers, on top of a pixel-accurate background image layer (preserves gradients exactly).'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <label className={`flex items-center gap-2 text-[11px] font-bold cursor-pointer select-none ${
                isAppLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <input
                  type="checkbox"
                  checked={renderAsImages}
                  onChange={(e) => setRenderAsImages(e.target.checked)}
                  className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
                />
                Exact slide images
              </label>
              <label className={`flex items-center gap-2 text-[11px] font-bold cursor-pointer select-none ${
                isAppLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <input
                  type="checkbox"
                  checked={embedFonts}
                  onChange={(e) => setEmbedFonts(e.target.checked)}
                  className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
                />
                Embed fonts
              </label>
              <button
                onClick={downloadPPTX}
              disabled={isExporting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 shrink-0 cursor-pointer disabled:opacity-50 transition-all"
            >
              Export PPTX
            </button>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border flex items-center justify-between gap-4 shadow-lg ${
            isAppLight
              ? 'bg-blue-50 border-blue-300 shadow-blue-200/30'
              : 'bg-slate-950 border-blue-500/40 bg-gradient-to-r from-blue-500/10 to-transparent'
          }`}>
            <div>
              <h4 className={`text-base font-extrabold flex items-center gap-2 ${isAppLight ? 'text-blue-700' : 'text-blue-300'}`}>
                <ExternalLink className="w-4 h-4" />
                Export to Google Slides
              </h4>
              <p className={`text-xs mt-1 ${isAppLight ? 'text-slate-600' : 'text-slate-300'}`}>
                {isCurrentScope
                  ? `Downloads a 16:9 .pptx of slide #${(currentSlide?.physicalIndex ?? currentIndex) + 1} and opens Google Drive / Slides to import in 1 click.`
                  : 'Downloads 16:9 .pptx file and opens Google Drive / Slides to import in 1 click.'}
              </p>
            </div>
            <button
              onClick={handleExportGoogleSlides}
              disabled={isExporting}
              className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-black text-xs shadow-lg shadow-blue-500/20 shrink-0 cursor-pointer disabled:opacity-50 transition-all"
            >
              Google Slides
            </button>
          </div>

          {showGoogleSlidesGuide && (
            <div className={`p-4 rounded-2xl border text-xs space-y-3 animate-fadeIn ${
              isAppLight ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-blue-950/80 border-blue-500/50 text-blue-100'
            }`}>
              <div className="flex items-center justify-between">
                <h5 className={`font-bold flex items-center gap-2 ${isAppLight ? 'text-blue-800' : 'text-blue-300'}`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  PPTX Downloaded! Next steps for Google Slides:
                </h5>
                <button
                  onClick={() => setShowGoogleSlidesGuide(false)}
                  className={`text-[10px] cursor-pointer ${isAppLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'}`}
                >
                  Dismiss
                </button>
              </div>
              <ol className={`list-decimal list-inside space-y-1.5 ${isAppLight ? 'text-slate-700' : 'text-slate-200'}`}>
                <li>Click the button below to open Google Drive / Google Slides</li>
                <li>Drag and drop the downloaded <code className={`font-mono ${isAppLight ? 'text-amber-700' : 'text-amber-300'}`}>.pptx</code> file into Google Drive</li>
                <li>Double click to open and edit directly as a Google Presentation!</li>
              </ol>
              <div className="pt-1 flex gap-2">
                <a
                  href="https://slides.new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white font-bold text-xs hover:bg-blue-400"
                >
                  Open Google Slides (slides.new) <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://drive.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs border ${
                    isAppLight ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-slate-800 text-slate-200 border-slate-700 hover:text-white'
                  }`}
                >
                  Open Google Drive <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {!isCurrentScope && (
            <div className={`p-5 rounded-2xl border space-y-2 ${
              isAppLight ? 'bg-amber-50 border-amber-300' : 'bg-slate-950 border-amber-500/40'
            }`}>
              <label className={`flex items-center gap-2.5 text-xs font-bold cursor-pointer select-none ${
                isAppLight ? 'text-amber-800' : 'text-amber-200'
              }`}>
                <input
                  type="checkbox"
                  checked={includeAnswerSlides}
                  onChange={(e) => setIncludeAnswerSlides(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                Include Answer Slides (question + highlighted answer per MCQ)
              </label>
              <p className={`text-[11px] font-semibold ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
                Adds a dedicated answer slide after every question slide — the correct option is highlighted with a "উত্তর" label. Applies to PPTX, PDF and ZIP exports.
              </p>
            </div>
          )}

          <div className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${
            isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div>
              <h4 className={`text-sm font-bold flex items-center gap-2 ${isAppLight ? 'text-slate-900' : 'text-slate-100'}`}>
                <FileText className="w-4 h-4 text-emerald-500" />
                Export PDF Document
              </h4>
              <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isCurrentScope
                  ? `Generates a print-ready vector PDF document of slide #${(currentSlide?.physicalIndex ?? currentIndex) + 1}`
                  : `Generates a print-ready vector PDF document with ${scopeSlideCount} slide${scopeSlideCount === 1 ? '' : 's'} (1 per page)`}
              </p>
            </div>
            <button
              onClick={downloadPDF}
              disabled={isExporting}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs border shrink-0 cursor-pointer disabled:opacity-50 transition-colors ${
                isAppLight ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-slate-700'
              }`}
            >
              Export PDF
            </button>
          </div>

          <div className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${
            isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div>
              <h4 className={`text-sm font-bold flex items-center gap-2 ${isAppLight ? 'text-slate-900' : 'text-slate-100'}`}>
                <FileArchive className="w-4 h-4 text-amber-500" />
                {isCurrentScope ? 'Current Slide ZIP (1 PNG Slide)' : `Bulk Images ZIP (${scopeSlideCount} PNG Slide${scopeSlideCount === 1 ? '' : 's'})`}
              </h4>
              <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isCurrentScope
                  ? `Generates a high-resolution 1920x1080 PNG of slide #${(currentSlide?.physicalIndex ?? currentIndex) + 1}`
                  : 'Generates high-resolution 1920x1080 PNG image files for all slides in deck'}
              </p>
            </div>
            <button
              onClick={downloadBulkZip}
              disabled={isExporting}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs border shrink-0 cursor-pointer disabled:opacity-50 transition-colors ${
                isAppLight ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100' : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
              }`}
            >
              Export ZIP
            </button>
          </div>

          <div className={`p-5 rounded-2xl border space-y-3 ${
            isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className={`text-sm font-bold ${isAppLight ? 'text-slate-900' : 'text-slate-100'}`}>Current Slide Image (PNG)</h4>
                <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Download current active slide #{(currentSlide?.physicalIndex ?? currentIndex) + 1} at 1920x1080 resolution
                </p>
              </div>
              <button
                onClick={downloadSingleSlide}
                disabled={isExporting || !currentSlide}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs border shrink-0 cursor-pointer disabled:opacity-50 transition-colors ${
                  isAppLight ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                Export PNG
              </button>
            </div>

            {/* Include Explanation toggle */}
            <div className="flex flex-wrap items-center gap-6 pt-1">
              <label className={`flex items-center gap-2.5 text-xs font-bold cursor-pointer select-none ${
                isAppLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <input
                  type="checkbox"
                  checked={includeExplanation}
                  onChange={(e) => setIncludeExplanation(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                Include Explanation on answer slides
              </label>

              {/* Include Paginated Answer Key Slides toggle */}
              <label className={`flex items-center gap-2.5 text-xs font-bold cursor-pointer select-none ${
                isAppLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <input
                  type="checkbox"
                  checked={includeAnswerKeySlides}
                  onChange={(e) => setIncludeAnswerKeySlides(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                Append Paginated Standalone Answer Key Slide(s) to PPTX
              </label>
            </div>

            {/* Live 2-slide preview — question slide + answer slide (answer mark
                graphics / tick / key shown on the answer variant). */}
            <div className="grid grid-cols-2 gap-3">
              {/* Question slide preview */}
              <div>
                <div className={`flex items-center justify-between mb-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <span className="text-[10px] font-black uppercase tracking-wider">Question</span>
                  <span className="text-[10px] font-mono">#{currentSlide ? currentSlide.questionIndex + 1 : ''}</span>
                </div>
                <div className={`rounded-xl overflow-hidden border ${isAppLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  {currentSlide && (
                    <SlideThumb
                      item={currentSlide.item}
                      config={config}
                      index={currentSlide.questionIndex}
                      totalCount={items.length}
                      isAnswerRevealMode={effectiveShowAnswerInSlide(config)}
                      slideVariant="question"
                    />
                  )}
                </div>
              </div>
              {/* Answer slide preview */}
              <div>
                <div className={`flex items-center justify-between mb-1.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                    isAppLight ? 'text-emerald-700' : 'text-emerald-300'
                  }`}>
                    <CheckCircle2 className="w-3 h-3" /> Answer
                  </span>
                  <span className="text-[10px] font-mono">{currentSlide?.item.answer || ''}</span>
                </div>
                <div className={`rounded-xl overflow-hidden border ${isAppLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  {currentSlide && (
                    <SlideThumb
                      item={currentSlide.item}
                      config={config}
                      index={currentSlide.questionIndex}
                      totalCount={items.length}
                      slideVariant="answer"
                      forceShowExplanation={includeExplanation}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${
            isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div>
              <h4 className={`text-sm font-bold flex items-center gap-2 ${isAppLight ? 'text-slate-900' : 'text-slate-100'}`}>
                <FileText className="w-4 h-4 text-violet-500" />
                Question Paper (PDF)
              </h4>
              <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isCurrentScope
                  ? `A4 paper for the current slide — pick file name, template, MCQs per page & answer key`
                  : `A4 portrait paper with ${items.length} MCQs using the slide header & footer branding — pick file name, template, MCQs per page & answer key`}
              </p>
            </div>
            <button
              onClick={() => setIsDeckPaperOpen(true)}
              disabled={items.length === 0}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs border shrink-0 cursor-pointer disabled:opacity-50 transition-colors ${
                isAppLight ? 'bg-violet-50 border-violet-300 text-violet-700 hover:bg-violet-100' : 'bg-slate-800 hover:bg-slate-700 text-violet-300 border-slate-700'
              }`}
            >
              Open Paper
            </button>
          </div>

          <div className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${
            isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div>
              <h4 className={`text-sm font-bold ${isAppLight ? 'text-slate-900' : 'text-slate-100'}`}>Extract MCQs (JSON)</h4>
              <p className={`text-xs ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Download only the questions ({items.length}) as a clean array — re-importable into the Question Bank
              </p>
            </div>
            <button
              onClick={downloadMCQsJSON}
              disabled={isExporting || items.length === 0}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs border shrink-0 cursor-pointer disabled:opacity-50 transition-colors ${
                isAppLight ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              Export MCQs
            </button>
          </div>

          <div className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${
            isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div>
              <h4 className={`text-sm font-bold ${isAppLight ? 'text-slate-900' : 'text-slate-100'}`}>Backup Deck JSON</h4>
              <p className={`text-xs ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Save full editable deck questions & brand configurations to JSON file
              </p>
            </div>
            <button
              onClick={downloadDeckJSON}
              disabled={isExporting}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs border shrink-0 cursor-pointer transition-colors ${
                isAppLight ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              Export JSON
            </button>
          </div>
        </div>

        {isExporting && (
          <div className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
            isAppLight ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <Loader2 className="w-5 h-5 animate-spin shrink-0" />
            <span className="font-semibold">{progressMsg}</span>
          </div>
        )}
      </div>

      {/* Hidden Offscreen 1920x1080 Container for HD PNG Snapshot Export */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '1920px',
          height: '1080px',
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: -100,
        }}
      >
        {renderSlideRef && (
          <SlideCanvas
            ref={exportCanvasRef}
            item={renderSlideRef.item}
            config={config}
            currentIndex={renderSlideRef.questionIndex}
            totalCount={items.length}
            isAnswerRevealMode={false}
            slideVariant={renderSlideRef.isAnswerSlide ? 'answer' : 'question'}
            forceShowExplanation={renderSlideRef.isAnswerSlide ? includeExplanation : undefined}
          />
        )}
      </div>

      {/* Hidden Offscreen 1920x1080 Container for PPTX background-only rasters —
          exact gradient/image/tint/glow stack, no text/shape layers (those are
          added as native editable PPTX layers on top of this picture). */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '1920px',
          height: '1080px',
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: -100,
        }}
      >
        {bgRenderSlideRef && (
          <SlideCanvas
            ref={bgExportCanvasRef}
            item={bgRenderSlideRef.item}
            config={config}
            currentIndex={bgRenderSlideRef.questionIndex}
            totalCount={items.length}
            mode="backgroundOnly"
          />
        )}
      </div>

      {/* Hidden Offscreen 1920x1080 Transparent Container for PPTX LaTeX/math
          box overlays — renders ONLY the boxes whose content contains math
          (KaTeX typesets it exactly like the preview); everything else stays
          transparent so the native editable layers beneath show through. */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '1920px',
          height: '1080px',
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: -100,
        }}
      >
        {mathOverlaySlideRef && (() => {
          const effConfig: DeckConfig = { ...config, ...(mathOverlaySlideRef.item.customConfig || {}) };
          const boxes = ensureAnswerBox(effConfig.slideTextBoxes || [], effConfig);
          const mathBoxIds = getMathBoxIds(mathOverlaySlideRef);
          // Answer-reveal gating resolved by the SHARED resolver so the overlay
          // matches the exact slide variant and the editable native layers.
          const revealFlags = resolveSlideAnswerFlags(effConfig, mathOverlaySlideRef.isAnswerSlide);
          return (
            <div ref={mathOverlayCanvasRef} style={{ width: '1920px', height: '1080px', position: 'relative' }}>
              <SlideTextBoxLayer
                boxes={boxes}
                item={mathOverlaySlideRef.item}
                config={effConfig}
                currentIndex={mathOverlaySlideRef.questionIndex}
                totalCount={items.length}
                showAnswerHighlight={revealFlags.showOptionHighlight}
                isAnswerVariant={mathOverlaySlideRef.isAnswerSlide}
                showExplanation={revealFlags.showExplanationCard}
                renderBoxIds={mathBoxIds}
              />
            </div>
          );
        })()}
      </div>

      {/* Question Paper modal — opens separately with file name, template, MCQs per page & answer key */}
      <DeckQuestionPaperModal
        isOpen={isDeckPaperOpen}
        onClose={() => setIsDeckPaperOpen(false)}
        items={paperItems}
        config={config}
        appTheme={appTheme}
      />
    </div>
  );
};
