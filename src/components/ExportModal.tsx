import React, { useState, useRef } from 'react';
import { DeckConfig, MCQItem } from '../types';
import { exportDeckToPPTX } from '../utils/pptxExport';
import { SlideCanvas } from './SlideCanvas';
import { SlideThumb } from './SlideThumb';
import { DeckQuestionPaperModal } from './DeckQuestionPaperModal';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { downloadJSON } from '../utils/mcqJson';
import jsPDF from 'jspdf';
import { Download, FileArchive, CheckCircle2, Loader2, X, Sparkles, Presentation, ExternalLink, FileText } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MCQItem[];
  config: DeckConfig;
  currentIndex: number;
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
  slideRef,
  appTheme = 'dark',
  scope = 'all',
}) => {
  const isAppLight = appTheme === 'light';
  const [isExporting, setIsExporting] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [showGoogleSlidesGuide, setShowGoogleSlidesGuide] = useState(false);
  const [bulkRenderIndex, setBulkRenderIndex] = useState<number>(currentIndex);
  const exportCanvasRef = useRef<HTMLDivElement | null>(null);

  // Export scope: 'all' exports the whole deck; 'current' exports only the active slide.
  // (Scope is fixed per entry point — sidebar "Export Slides" = all, Slide Studio Download = current.)
  const isCurrentScope = scope === 'current';
  const scopeIndices = isCurrentScope
    ? items.length > 0
      ? [currentIndex]
      : []
    : items.map((_, i) => i);
  const scopedItems = isCurrentScope
    ? items.length > 0
      ? [items[currentIndex]]
      : []
    : items;

  // Question Paper PDF modal (opens separately — file name, template, MCQs per page, answer key)
  const [isDeckPaperOpen, setIsDeckPaperOpen] = useState(false);
  const [renderAnswerRevealState, setRenderAnswerRevealState] = useState<boolean>(false);
  const [includeAnswerSlides, setIncludeAnswerSlides] = useState<boolean>(true);
  // PPTX: native editable layers (text boxes / shapes as layers) by default —
  // the flattened exact-image fallback is opt-in.
  const [pptxEditable, setPptxEditable] = useState<boolean>(true);

  if (!isOpen) return null;

  // Helper to render high-res slide images for exact PPTX visual reproduction
  const renderSlideDataUrls = async (): Promise<string[]> => {
    const slideDataUrls: string[] = [];
    for (let i = 0; i < scopeIndices.length; i++) {
      setBulkRenderIndex(scopeIndices[i]);
      setProgressMsg(`Rendering high-res slide ${i + 1} of ${scopeIndices.length} for PPTX...`);
      await new Promise(r => setTimeout(r, 150));

      const targetEl = exportCanvasRef.current || slideRef.current;
      if (targetEl) {
        const dataUrl = await toPng(targetEl, {
          pixelRatio: 2,
          cacheBust: true,
        });
        slideDataUrls.push(dataUrl);
      }
    }
    return slideDataUrls;
  };

  // Export to PowerPoint PPTX (16:9 Widescreen) - native editable layers (default) or exact visual image
  const downloadPPTX = async () => {
    if (items.length === 0) return;
    setIsExporting(true);
    try {
      if (pptxEditable) {
        await exportDeckToPPTX(scopedItems, config, (msg) => setProgressMsg(msg), undefined, false);
      } else {
        const slideDataUrls = await renderSlideDataUrls();
        await exportDeckToPPTX(scopedItems, config, (msg) => setProgressMsg(msg), slideDataUrls, true);
      }
    } catch (err: any) {
      console.error('PPTX Export Error:', err);
      alert('Failed to generate PowerPoint presentation: ' + err.message);
    } finally {
      setIsExporting(false);
      setProgressMsg('');
      setBulkRenderIndex(currentIndex);
    }
  };

  // Export for Google Slides: Downloads exact visual PPTX & opens Google Drive upload prompt
  const handleExportGoogleSlides = async () => {
    if (items.length === 0) return;
    setIsExporting(true);
    try {
      if (pptxEditable) {
        await exportDeckToPPTX(scopedItems, config, (msg) => setProgressMsg(msg), undefined, false);
      } else {
        const slideDataUrls = await renderSlideDataUrls();
        await exportDeckToPPTX(scopedItems, config, (msg) => setProgressMsg(msg), slideDataUrls, true);
      }
      setShowGoogleSlidesGuide(true);
    } catch (err: any) {
      console.error('Google Slides PPTX Export Error:', err);
      alert('Failed to generate presentation file: ' + err.message);
    } finally {
      setIsExporting(false);
      setProgressMsg('');
      setBulkRenderIndex(currentIndex);
    }
  };

  // Download Current Active Slide PNG
  const downloadSingleSlide = async () => {
    setIsExporting(true);
    setProgressMsg('Rendering active slide PNG (1920x1080)...');
    setBulkRenderIndex(currentIndex);

    try {
      await new Promise(r => setTimeout(r, 100));
      const targetEl = exportCanvasRef.current || slideRef.current;
      if (!targetEl) throw new Error('Slide element not ready');

      const dataUrl = await toPng(targetEl, {
        pixelRatio: 2,
        cacheBust: true,
      });

      const fileName = `${(config.brandName || 'Slide').replace(/\s+/g, '_')}_q${currentIndex + 1}.png`;
      saveAs(dataUrl, fileName);
    } catch (err: any) {
      console.error('Single Slide Export Error:', err);
      alert('Failed to render slide image: ' + err.message);
    } finally {
      setIsExporting(false);
      setProgressMsg('');
    }
  };

  // Bulk Export All Slides to ZIP with exact template applied to every slide
  const downloadBulkZip = async () => {
    if (items.length === 0) return;
    setIsExporting(true);
    const zip = new JSZip();

    try {
      const folder = zip.folder(`${config.brandName || 'Slides'}_MCQs`);

      for (let i = 0; i < scopeIndices.length; i++) {
        setBulkRenderIndex(scopeIndices[i]);
        const padIndex = (scopeIndices[i] + 1).toString().padStart(2, '0');

        // 1. Render Question Slide (Unanswered)
        setRenderAnswerRevealState(false);
        setProgressMsg(`Rendering Question Slide ${i + 1} of ${scopeIndices.length}...`);
        await new Promise(r => setTimeout(r, 150));

        const targetEl = exportCanvasRef.current || slideRef.current;
        if (targetEl) {
          const qDataUrl = await toPng(targetEl, {
            pixelRatio: 2,
            cacheBust: true,
          });
          const qBase64 = qDataUrl.replace(/^data:image\/png;base64,/, '');
          folder?.file(`${padIndex}_q.png`, qBase64, { base64: true });
        }

        // 2. Render Answer Reveal Slide (if enabled)
        if (includeAnswerSlides) {
          setRenderAnswerRevealState(true);
          setProgressMsg(`Rendering Answer Slide ${i + 1} of ${scopeIndices.length}...`);
          await new Promise(r => setTimeout(r, 150));

          if (targetEl) {
            const ansDataUrl = await toPng(targetEl, {
              pixelRatio: 2,
              cacheBust: true,
            });
            const ansBase64 = ansDataUrl.replace(/^data:image\/png;base64,/, '');
            folder?.file(`${padIndex}_ans.png`, ansBase64, { base64: true });
          }
        }
      }

      setProgressMsg('Packaging ZIP file...');
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(
        blob,
        isCurrentScope
          ? `${config.brandName || 'EdTech'}_Slide_${currentIndex + 1}.zip`
          : `${config.brandName || 'EdTech'}_MCQ_Slides.zip`
      );
    } catch (err: any) {
      console.error('Bulk ZIP Export Error:', err);
      alert('Failed to generate ZIP export: ' + err.message);
    } finally {
      setIsExporting(false);
      setProgressMsg('');
      setRenderAnswerRevealState(false);
      setBulkRenderIndex(currentIndex);
    }
  };

  // Download PDF Presentation Document
  const downloadPDF = async () => {
    if (items.length === 0) return;
    setIsExporting(true);
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1920, 1080],
      });

      for (let i = 0; i < scopeIndices.length; i++) {
        setBulkRenderIndex(scopeIndices[i]);
        setProgressMsg(`Rendering PDF slide ${i + 1} of ${scopeIndices.length}...`);
        await new Promise(r => setTimeout(r, 150));

        const targetEl = exportCanvasRef.current || slideRef.current;
        if (!targetEl) continue;

        const dataUrl = await toPng(targetEl, {
          pixelRatio: 1.5,
          cacheBust: true,
        });

        if (i > 0) pdf.addPage([1920, 1080], 'landscape');
        pdf.addImage(dataUrl, 'PNG', 0, 0, 1920, 1080);
      }

      setProgressMsg('Saving PDF presentation document...');
      pdf.save(`${(config.brandName || 'MCQ_Deck').replace(/\s+/g, '_')}_Slides.pdf`);
    } catch (err: any) {
      console.error('PDF Export Error:', err);
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      setIsExporting(false);
      setProgressMsg('');
      setBulkRenderIndex(currentIndex);
    }
  };

  // Export Deck JSON Backup
  const downloadDeckJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ config, items }, null, 2));
    saveAs(dataStr, `${config.brandName || 'Deck'}_mcq_backup.json`);
  };

  // Extract MCQs only (clean question array — no config/slide overrides) as re-importable JSON
  const downloadMCQsJSON = () => {
    if (items.length === 0) return;
    const cleanItems = items.map(({ customConfig, ...q }) => q);
    downloadJSON(cleanItems, `${config.brandName || 'MCQ'}_mcqs.json`);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md ${
      isAppLight ? 'bg-black/40' : 'bg-black/80'
    }`}>
      <div className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} relative w-full max-w-2xl border p-6 lg:p-8 space-y-6 max-h-[90vh] overflow-y-auto ${
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
                {isCurrentScope ? `Current Slide #${currentIndex + 1}` : `Full Deck (${items.length} slide${items.length === 1 ? '' : 's'})`}
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
                {isCurrentScope
                  ? pptxEditable
                    ? `Generates a single 16:9 PowerPoint slide for slide #${currentIndex + 1} with editable text fields & layers.`
                    : `Generates a single 16:9 PowerPoint slide for slide #${currentIndex + 1} as a flattened image.`
                  : pptxEditable
                  ? 'Generates editable 16:9 PowerPoint slides — text fields, shapes & backgrounds stay as editable layers.'
                  : 'Generates 16:9 PowerPoint slides as flattened images (exact visual match, not editable).'}
              </p>
              <label
                className={`mt-2.5 inline-flex items-center gap-2 text-xs font-bold cursor-pointer select-none ${
                  isAppLight ? 'text-amber-800' : 'text-amber-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={pptxEditable}
                  onChange={(e) => setPptxEditable(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                Export as editable layers (native text boxes)
              </label>
            </div>
            <button
              onClick={downloadPPTX}
              disabled={isExporting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 shrink-0 cursor-pointer disabled:opacity-50 transition-all"
            >
              Export PPTX
            </button>
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
                  ? `Downloads a 16:9 .pptx of slide #${currentIndex + 1} and opens Google Drive / Slides to import in 1 click.`
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
                  ? `Generates a print-ready vector PDF document of slide #${currentIndex + 1}`
                  : 'Generates a print-ready vector PDF document with 1 slide per page'}
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
                {isCurrentScope ? 'Current Slide ZIP (1 PNG Slide)' : `Bulk Images ZIP (${scopeIndices.length} PNG Slides)`}
              </h4>
              <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isCurrentScope
                  ? `Generates a high-resolution 1920x1080 PNG of slide #${currentIndex + 1}`
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
                  Download current active slide #{currentIndex + 1} at 1920x1080 resolution
                </p>
              </div>
              <button
                onClick={downloadSingleSlide}
                disabled={isExporting || items.length === 0}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs border shrink-0 cursor-pointer disabled:opacity-50 transition-colors ${
                  isAppLight ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                Export PNG
              </button>
            </div>

            {/* Live PNG preview of the current slide — exact render that will be downloaded */}
            <div className={`rounded-xl overflow-hidden border ${isAppLight ? 'border-slate-200' : 'border-slate-800'}`}>
              {items.length > 0 && (
                <SlideThumb
                  item={items[currentIndex]}
                  config={config}
                  index={currentIndex}
                  totalCount={items.length}
                  isAnswerRevealMode={config.showAnswerInSlide}
                />
              )}
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
                  : `A4 portrait paper with ${scopeIndices.length} MCQs using the slide header & footer branding — pick file name, template, MCQs per page & answer key`}
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
        {items.length > 0 && (
          <SlideCanvas
            ref={exportCanvasRef}
            item={items[bulkRenderIndex] || items[0]}
            config={config}
            currentIndex={bulkRenderIndex}
            totalCount={items.length}
            isAnswerRevealMode={renderAnswerRevealState || config.showAnswerInSlide}
          />
        )}
      </div>

      {/* Question Paper modal — opens separately with file name, template, MCQs per page & answer key */}
      <DeckQuestionPaperModal
        isOpen={isDeckPaperOpen}
        onClose={() => setIsDeckPaperOpen(false)}
        items={scopedItems}
        config={config}
        appTheme={appTheme}
      />
    </div>
  );
};
