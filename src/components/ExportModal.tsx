import React, { useState, useRef } from 'react';
import { DeckConfig, MCQItem } from '../types';
import { exportDeckToPPTX } from '../utils/pptxExport';
import { SlideCanvas } from './SlideCanvas';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import { Download, FileArchive, FileCode, CheckCircle2, Loader2, X, Sparkles, Presentation, ExternalLink, FileText } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MCQItem[];
  config: DeckConfig;
  currentIndex: number;
  slideRef: React.RefObject<HTMLDivElement | null>;
  appTheme?: 'dark' | 'light';
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  items,
  config,
  currentIndex,
  slideRef,
  appTheme = 'dark',
}) => {
  const isAppLight = appTheme === 'light';
  const [isExporting, setIsExporting] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [showGoogleSlidesGuide, setShowGoogleSlidesGuide] = useState(false);
  const [bulkRenderIndex, setBulkRenderIndex] = useState<number>(currentIndex);
  const exportCanvasRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  // Helper to render high-res slide images for exact PPTX visual reproduction
  const renderSlideDataUrls = async (): Promise<string[]> => {
    const slideDataUrls: string[] = [];
    for (let i = 0; i < items.length; i++) {
      setBulkRenderIndex(i);
      setProgressMsg(`Rendering high-res slide ${i + 1} of ${items.length} for PPTX...`);
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

  // Export to PowerPoint PPTX (16:9 Widescreen) - Exact visual match + Speaker Notes
  const downloadPPTX = async () => {
    if (items.length === 0) return;
    setIsExporting(true);
    try {
      const slideDataUrls = await renderSlideDataUrls();
      await exportDeckToPPTX(items, config, (msg) => setProgressMsg(msg), slideDataUrls);
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
      const slideDataUrls = await renderSlideDataUrls();
      await exportDeckToPPTX(items, config, (msg) => setProgressMsg(msg), slideDataUrls);
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

      for (let i = 0; i < items.length; i++) {
        setBulkRenderIndex(i);
        setProgressMsg(`Rendering Question Slide ${i + 1} of ${items.length}...`);
        await new Promise(r => setTimeout(r, 150));

        const targetEl = exportCanvasRef.current || slideRef.current;
        if (!targetEl) continue;

        const dataUrl = await toPng(targetEl, {
          pixelRatio: 2,
          cacheBust: true,
        });

        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
        const padIndex = (i + 1).toString().padStart(2, '0');
        folder?.file(`${padIndex}_question.png`, base64Data, { base64: true });
      }

      setProgressMsg('Packaging ZIP file...');
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${config.brandName || 'EdTech'}_MCQ_Slides.zip`);
    } catch (err: any) {
      console.error('Bulk ZIP Export Error:', err);
      alert('Failed to generate ZIP export: ' + err.message);
    } finally {
      setIsExporting(false);
      setProgressMsg('');
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

      for (let i = 0; i < items.length; i++) {
        setBulkRenderIndex(i);
        setProgressMsg(`Rendering PDF slide ${i + 1} of ${items.length}...`);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className={`relative w-full max-w-2xl border rounded-3xl p-6 lg:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto ${
        isAppLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isExporting}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Presentation className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Export 16:9 Presentation Deck</h3>
            <p className="text-xs text-slate-400">
              Download PowerPoint (.pptx), Google Slides, high-res PNG images or JSON
            </p>
          </div>
        </div>

        {/* Export Options Grid */}
        <div className="space-y-4">
          {/* POWERPOINT PPTX EXPORT */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/40 bg-gradient-to-r from-amber-500/10 to-transparent flex items-center justify-between gap-4 shadow-lg">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                  Recommended
                </span>
                <h4 className="text-base font-extrabold text-amber-300 flex items-center gap-2">
                  <Presentation className="w-4 h-4 text-amber-400" />
                  Download PowerPoint (.pptx)
                </h4>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Generates native 16:9 PowerPoint slides formatted with brand logos, headers & option cards.
              </p>
            </div>
            <button
              onClick={downloadPPTX}
              disabled={isExporting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 shrink-0 cursor-pointer disabled:opacity-50 transition-all"
            >
              Export PPTX
            </button>
          </div>

          {/* GOOGLE SLIDES EXPORT */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-blue-500/40 bg-gradient-to-r from-blue-500/10 to-transparent flex items-center justify-between gap-4 shadow-lg">
            <div>
              <h4 className="text-base font-extrabold text-blue-300 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-blue-400" />
                Export to Google Slides
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Downloads 16:9 .pptx file and opens Google Drive / Slides to import in 1 click.
              </p>
            </div>
            <button
              onClick={handleExportGoogleSlides}
              disabled={isExporting}
              className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-xs shadow-lg shadow-blue-500/20 shrink-0 cursor-pointer disabled:opacity-50 transition-all"
            >
              Google Slides
            </button>
          </div>

          {/* GOOGLE SLIDES STEP GUIDE CARD */}
          {showGoogleSlidesGuide && (
            <div className="p-4 rounded-2xl bg-blue-950/80 border border-blue-500/50 text-blue-100 text-xs space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-blue-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  PPTX Downloaded! Next steps for Google Slides:
                </h5>
                <button
                  onClick={() => setShowGoogleSlidesGuide(false)}
                  className="text-slate-400 hover:text-white text-[10px]"
                >
                  Dismiss
                </button>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-200">
                <li>Click the button below to open Google Drive / Google Slides</li>
                <li>Drag and drop the downloaded <code className="text-amber-300 font-mono">.pptx</code> file into Google Drive</li>
                <li>Double click to open and edit directly as a Google Presentation!</li>
              </ol>
              <div className="pt-1 flex gap-2">
                <a
                  href="https://slides.new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-slate-950 font-bold text-xs hover:bg-blue-400"
                >
                  Open Google Slides (slides.new) <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://drive.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs border border-slate-700 hover:text-white"
                >
                  Open Google Drive <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* EXPORT TO PDF DOCUMENT */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Export PDF Document
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Generates a print-ready vector PDF document with 1 slide per page
              </p>
            </div>
            <button
              onClick={downloadPDF}
              disabled={isExporting}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs border border-slate-700 shrink-0 cursor-pointer disabled:opacity-50"
            >
              Export PDF
            </button>
          </div>

          {/* BULK PNG ZIP EXPORT */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileArchive className="w-4 h-4 text-amber-400" />
                Bulk Images ZIP ({items.length} PNG Slides)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Generates high-resolution 1920x1080 PNG image files for all slides in deck
              </p>
            </div>
            <button
              onClick={downloadBulkZip}
              disabled={isExporting}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 shrink-0 cursor-pointer disabled:opacity-50"
            >
              Export ZIP
            </button>
          </div>

          {/* SINGLE SLIDE PNG EXPORT */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-100">Current Slide Image (PNG)</h4>
              <p className="text-xs text-slate-400">
                Download current active slide #{currentIndex + 1} at 1920x1080 resolution
              </p>
            </div>
            <button
              onClick={downloadSingleSlide}
              disabled={isExporting}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 shrink-0 cursor-pointer disabled:opacity-50"
            >
              Export PNG
            </button>
          </div>

          {/* BACKUP JSON EXPORT */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-100">Backup Deck JSON</h4>
              <p className="text-xs text-slate-400">
                Save full editable deck questions & brand configurations to JSON file
              </p>
            </div>
            <button
              onClick={downloadDeckJSON}
              disabled={isExporting}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 shrink-0 cursor-pointer"
            >
              Export JSON
            </button>
          </div>
        </div>

        {/* Loading Progress State */}
        {isExporting && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin shrink-0 text-amber-400" />
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
            isAnswerRevealMode={config.showAnswerInSlide}
          />
        )}
      </div>
    </div>
  );
};
