import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { DeckConfig, MCQItem, SavedDeck } from '../types';
import { exportDeckToPPTX, PptxSlideSpec } from '../utils/pptxExport';
import { SlideCanvas } from '../components/SlideCanvas';
import { SlideTextBoxLayer } from '../components/SlideTextBoxLayer';
import { boxContentHasMath, ensureAnswerBox } from '../utils/slideTextBoxes';
import { expandDeckSlides, resolveSlideAnswerFlags, SlideRef } from '../utils/answerSlides';
import { safeToPng } from '../utils/cleanExport';
import { getFontEmbedCSS } from '../utils/fontEmbed';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { downloadJSON, exportFullDeckPackage } from '../utils/mcqJson';
import jsPDF from 'jspdf';

export type ExportTaskType =
  | 'pptx'
  | 'google_slides'
  | 'pdf'
  | 'zip'
  | 'png'
  | 'json_deck'
  | 'json_mcqs'
  | 'batch_pptx';

export type ExportTaskStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ExportJobParams {
  items: MCQItem[];
  config: DeckConfig;
  scopeSlides?: SlideRef[];
  currentSlide?: SlideRef | null;
  currentIndex?: number;
  renderAsImages?: boolean;
  includeExplanation?: boolean;
  includeAnswerKeySlides?: boolean;
  embedFonts?: boolean;
  isCurrentScope?: boolean;
  selectedDecks?: SavedDeck[];
}

export interface ExportTask {
  id: string;
  title: string;
  subtitle?: string;
  type: ExportTaskType;
  status: ExportTaskStatus;
  progress: number; // 0 - 100
  progressMsg: string;
  errorMsg?: string;
  createdAt: number;
  params: ExportJobParams;
}

interface ExportQueueContextValue {
  tasks: ExportTask[];
  activeTask: ExportTask | null;
  enqueueExport: (type: ExportTaskType, title: string, subtitle: string, params: ExportJobParams) => string;
  cancelTask: (id: string) => void;
  removeTask: (id: string) => void;
  clearCompleted: () => void;
}

const ExportQueueContext = createContext<ExportQueueContextValue | undefined>(undefined);

export const useExportQueue = (): ExportQueueContextValue => {
  const context = useContext(ExportQueueContext);
  if (!context) {
    throw new Error('useExportQueue must be used within an ExportQueueProvider');
  }
  return context;
};

interface OffscreenRenderState {
  item: MCQItem;
  config: DeckConfig;
  questionIndex: number;
  isAnswerSlide: boolean;
  includeExplanation?: boolean;
}

export const ExportQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<ExportTask[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Offscreen rendering refs & active slide states
  const [fullRenderState, setFullRenderState] = useState<OffscreenRenderState | null>(null);
  const [bgRenderState, setBgRenderState] = useState<OffscreenRenderState | null>(null);
  const [mathOverlayRenderState, setMathOverlayRenderState] = useState<OffscreenRenderState | null>(null);

  const fullCanvasRef = useRef<HTMLDivElement | null>(null);
  const bgCanvasRef = useRef<HTMLDivElement | null>(null);
  const mathOverlayCanvasRef = useRef<HTMLDivElement | null>(null);

  // Track cancelled task IDs to break loops quickly
  const cancelledTaskIdsRef = useRef<Set<string>>(new Set());

  const activeTask = tasks.find(t => t.id === activeTaskId) || null;

  const enqueueExport = useCallback((
    type: ExportTaskType,
    title: string,
    subtitle: string,
    params: ExportJobParams
  ): string => {
    const id = `export_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newTask: ExportTask = {
      id,
      title,
      subtitle,
      type,
      status: 'queued',
      progress: 0,
      progressMsg: 'Queued in background...',
      createdAt: Date.now(),
      params,
    };
    setTasks(prev => [...prev, newTask]);
    return id;
  }, []);

  const cancelTask = useCallback((id: string) => {
    cancelledTaskIdsRef.current.add(id);
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, status: 'cancelled', progressMsg: 'Cancelled' } : t))
    );
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setTasks(prev => prev.filter(t => t.status === 'processing' || t.status === 'queued'));
  }, []);

  const updateTaskState = useCallback((id: string, updates: Partial<ExportTask>) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  // Check if a task was cancelled mid-flight
  const isTaskCancelled = (id: string) => cancelledTaskIdsRef.current.has(id);

  // Helper for Math Box IDs in a slide
  const getMathBoxIds = (ref: SlideRef, config: DeckConfig): string[] => {
    const effConfig: DeckConfig = { ...config, ...(ref.item.customConfig || {}) };
    const boxes = ensureAnswerBox(effConfig.slideTextBoxes || [], effConfig);
    return boxes
      .filter(b => boxContentHasMath(b, ref.item, effConfig, ref.questionIndex))
      .map(b => b.id);
  };

  // Process a single task
  const processTask = async (task: ExportTask) => {
    const { id, type, params } = task;
    updateTaskState(id, { status: 'processing', progress: 5, progressMsg: 'Preparing export...' });

    try {
      if (type === 'json_deck') {
        const { config, items } = params;
        exportFullDeckPackage({
          name: config.deckName || config.brandName || 'Deck',
          subject: config.badgeTag,
          badgeTag: config.badgeTag,
          config,
          items,
        });
        updateTaskState(id, { status: 'completed', progress: 100, progressMsg: 'Full slide deck JSON package saved' });
        return;
      }

      if (type === 'json_mcqs') {
        const { items, config } = params;
        const cleanItems = items.map(({ customConfig, ...q }) => q);
        const deckPrefix = (config.deckName || config.brandName || 'MCQ').replace(/\s+/g, '_');
        downloadJSON(cleanItems, `${deckPrefix}_mcqs.json`);
        updateTaskState(id, { status: 'completed', progress: 100, progressMsg: 'MCQs exported successfully' });
        return;
      }

      // Font pre-warming
      await document.fonts.ready;
      const fontEmbedCSS = await getFontEmbedCSS();
      const scopeSlides = params.scopeSlides || [];
      const config = params.config;
      const items = params.items;

      if (type === 'png') {
        const currentSlide = params.currentSlide;
        if (!currentSlide) throw new Error('No slide selected for PNG export');

        updateTaskState(id, { progress: 30, progressMsg: 'Rendering active slide PNG (1920x1080)...' });
        setFullRenderState({
          item: currentSlide.item,
          config,
          questionIndex: currentSlide.questionIndex,
          isAnswerSlide: currentSlide.isAnswerSlide,
        });

        await new Promise(r => setTimeout(r, 150));
        if (isTaskCancelled(id)) return;

        const targetEl = fullCanvasRef.current;
        if (!targetEl) throw new Error('Canvas element not ready');

        const dataUrl = await safeToPng(targetEl, { pixelRatio: 2, fontEmbedCSS });
        const deckPrefix = (config.deckName || config.brandName || 'Slide').replace(/\s+/g, '_');
        const fileName = `${deckPrefix}_q${currentSlide.questionIndex + 1}${currentSlide.isAnswerSlide ? '_ans' : ''}.png`;
        saveAs(dataUrl, fileName);

        updateTaskState(id, { status: 'completed', progress: 100, progressMsg: 'PNG image saved' });
        return;
      }

      if (type === 'pptx' || type === 'google_slides') {
        const renderAsImages = !!params.renderAsImages;
        const includeExplanation = params.includeExplanation ?? true;
        const includeAnswerKeySlides = params.includeAnswerKeySlides ?? false;
        const embedFonts = params.embedFonts ?? true;

        const specs: PptxSlideSpec[] = scopeSlides.map(s => ({
          item: s.item,
          questionIndex: s.questionIndex,
          isAnswerSlide: s.isAnswerSlide,
        }));

        let backgroundDataUrls: string[] = [];
        let fullSlideDataUrls: string[] | undefined = undefined;
        let mathOverlayDataUrls: string[] | undefined = undefined;

        if (renderAsImages) {
          fullSlideDataUrls = [];
          for (let i = 0; i < scopeSlides.length; i++) {
            if (isTaskCancelled(id)) return;
            const ref = scopeSlides[i];
            setFullRenderState({
              item: ref.item,
              config,
              questionIndex: ref.questionIndex,
              isAnswerSlide: ref.isAnswerSlide,
              includeExplanation: ref.isAnswerSlide ? includeExplanation : undefined,
            });
            const pct = Math.round(10 + (i / scopeSlides.length) * 70);
            updateTaskState(id, { progress: pct, progressMsg: `Rendering slide image ${i + 1} of ${scopeSlides.length}...` });
            await new Promise(r => setTimeout(r, 150));
            const el = fullCanvasRef.current;
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
        } else {
          // Render backgrounds
          for (let i = 0; i < scopeSlides.length; i++) {
            if (isTaskCancelled(id)) return;
            const ref = scopeSlides[i];
            setBgRenderState({
              item: ref.item,
              config,
              questionIndex: ref.questionIndex,
              isAnswerSlide: ref.isAnswerSlide,
            });
            const pct = Math.round(10 + (i / scopeSlides.length) * 35);
            updateTaskState(id, { progress: pct, progressMsg: `Rendering background ${i + 1} of ${scopeSlides.length}...` });
            await new Promise(r => setTimeout(r, 120));
            const el = bgCanvasRef.current;
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

          // Render math overlays
          mathOverlayDataUrls = [];
          for (let i = 0; i < scopeSlides.length; i++) {
            if (isTaskCancelled(id)) return;
            const ref = scopeSlides[i];
            const mathBoxIds = getMathBoxIds(ref, config);
            if (mathBoxIds.length === 0) {
              mathOverlayDataUrls.push('');
              continue;
            }
            setMathOverlayRenderState({
              item: ref.item,
              config,
              questionIndex: ref.questionIndex,
              isAnswerSlide: ref.isAnswerSlide,
            });
            const pct = Math.round(45 + (i / scopeSlides.length) * 35);
            updateTaskState(id, { progress: pct, progressMsg: `Rendering math overlay ${i + 1} of ${scopeSlides.length}...` });
            await new Promise(r => setTimeout(r, 150));
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
        }

        if (isTaskCancelled(id)) return;
        updateTaskState(id, { progress: 85, progressMsg: 'Building PowerPoint presentation file...' });

        await exportDeckToPPTX(
          items,
          config,
          (msg) => updateTaskState(id, { progressMsg: msg }),
          specs,
          includeExplanation,
          backgroundDataUrls,
          includeAnswerKeySlides,
          fullSlideDataUrls,
          mathOverlayDataUrls,
          embedFonts
        );

        if (type === 'google_slides') {
          updateTaskState(id, {
            status: 'completed',
            progress: 100,
            progressMsg: 'PPTX downloaded for Google Slides!',
          });
          window.open('https://slides.new', '_blank');
        } else {
          updateTaskState(id, { status: 'completed', progress: 100, progressMsg: 'PowerPoint PPTX saved!' });
        }
        return;
      }

      if (type === 'zip') {
        const zip = new JSZip();
        const deckPrefix = (config.deckName || config.brandName || 'Slides').replace(/\s+/g, '_');
        const folder = zip.folder(`${deckPrefix}_MCQs`);

        for (let i = 0; i < scopeSlides.length; i++) {
          if (isTaskCancelled(id)) return;
          const ref = scopeSlides[i];
          setFullRenderState({
            item: ref.item,
            config,
            questionIndex: ref.questionIndex,
            isAnswerSlide: ref.isAnswerSlide,
          });
          const padIndex = (ref.questionIndex + 1).toString().padStart(2, '0');
          const pct = Math.round(10 + (i / scopeSlides.length) * 75);
          updateTaskState(id, { progress: pct, progressMsg: `Rendering ZIP slide ${i + 1} of ${scopeSlides.length}...` });
          await new Promise(r => setTimeout(r, 150));

          const targetEl = fullCanvasRef.current;
          if (targetEl) {
            const dataUrl = await safeToPng(targetEl, { pixelRatio: 2, fontEmbedCSS });
            const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
            folder?.file(`${padIndex}_${ref.isAnswerSlide ? 'ans' : 'q'}.png`, base64, { base64: true });
          }
        }

        if (isTaskCancelled(id)) return;
        updateTaskState(id, { progress: 90, progressMsg: 'Packaging ZIP archive...' });
        const blob = await zip.generateAsync({ type: 'blob' });
        saveAs(
          blob,
          params.isCurrentScope
            ? `${deckPrefix}_Slide_${(params.currentSlide?.questionIndex ?? 0) + 1}.zip`
            : `${deckPrefix}_MCQ_Slides.zip`
        );
        updateTaskState(id, { status: 'completed', progress: 100, progressMsg: 'ZIP package saved!' });
        return;
      }

      if (type === 'pdf') {
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1920, 1080] });

        for (let i = 0; i < scopeSlides.length; i++) {
          if (isTaskCancelled(id)) return;
          const ref = scopeSlides[i];
          setFullRenderState({
            item: ref.item,
            config,
            questionIndex: ref.questionIndex,
            isAnswerSlide: ref.isAnswerSlide,
          });
          const pct = Math.round(10 + (i / scopeSlides.length) * 80);
          updateTaskState(id, { progress: pct, progressMsg: `Rendering PDF page ${i + 1} of ${scopeSlides.length}...` });
          await new Promise(r => setTimeout(r, 150));

          const targetEl = fullCanvasRef.current;
          if (targetEl) {
            const dataUrl = await safeToPng(targetEl, { fontEmbedCSS });
            if (i > 0) pdf.addPage([1920, 1080], 'landscape');
            pdf.addImage(dataUrl, 'PNG', 0, 0, 1920, 1080);
          }
        }

        if (isTaskCancelled(id)) return;
        updateTaskState(id, { progress: 95, progressMsg: 'Saving PDF presentation...' });
        const deckPrefix = (config.deckName || config.brandName || 'MCQ_Deck').replace(/\s+/g, '_');
        pdf.save(`${deckPrefix}_Slides.pdf`);
        updateTaskState(id, { status: 'completed', progress: 100, progressMsg: 'PDF document saved!' });
        return;
      }

      if (type === 'batch_pptx') {
        const selectedDecks = params.selectedDecks || [];
        const renderAsImages = !!params.renderAsImages;

        for (let di = 0; di < selectedDecks.length; di++) {
          if (isTaskCancelled(id)) return;
          const deck = selectedDecks[di];
          const physicalSlides = expandDeckSlides(deck.items, deck.config);
          const specs: PptxSlideSpec[] = physicalSlides.map(s => ({
            item: s.item,
            questionIndex: s.questionIndex,
            isAnswerSlide: s.isAnswerSlide,
          }));

          const renderedUrls: string[] = [];

          for (let si = 0; si < physicalSlides.length; si++) {
            if (isTaskCancelled(id)) return;
            const slideRef = physicalSlides[si];
            setBgRenderState({
              item: slideRef.item,
              config: deck.config,
              questionIndex: slideRef.questionIndex,
              isAnswerSlide: slideRef.isAnswerSlide,
            });

            const currentDeckProgress = di / selectedDecks.length;
            const currentSlideProgress = (si / physicalSlides.length) / selectedDecks.length;
            const pct = Math.round((currentDeckProgress + currentSlideProgress) * 90);

            const modeLabel = renderAsImages ? 'exact slide' : 'background';
            updateTaskState(id, {
              progress: pct,
              progressMsg: `Deck ${di + 1}/${selectedDecks.length}: Rendering ${modeLabel} ${si + 1}/${physicalSlides.length} for "${deck.name}"...`,
            });

            await new Promise(r => setTimeout(r, 120));
            const el = bgCanvasRef.current;
            if (el) {
              try {
                const dataUrl = await safeToPng(el, { fontEmbedCSS });
                renderedUrls.push(dataUrl);
              } catch {
                renderedUrls.push('');
              }
            } else {
              renderedUrls.push('');
            }
          }

          if (isTaskCancelled(id)) return;
          updateTaskState(id, {
            progressMsg: `Exporting PowerPoint file for "${deck.name}"...`,
          });

          await exportDeckToPPTX(
            deck.items,
            deck.config,
            (msg) => updateTaskState(id, { progressMsg: `"${deck.name}": ${msg}` }),
            specs,
            params.includeExplanation ?? true,
            renderAsImages ? [] : renderedUrls,
            undefined,
            renderAsImages ? renderedUrls : undefined,
            undefined,
            params.embedFonts ?? true
          );
        }

        updateTaskState(id, { status: 'completed', progress: 100, progressMsg: `Batch export of ${selectedDecks.length} deck(s) finished!` });
        return;
      }
    } catch (err: any) {
      console.error('Export Queue Error:', err);
      updateTaskState(id, { status: 'failed', errorMsg: err.message || 'Export failed' });
    } finally {
      setFullRenderState(null);
      setBgRenderState(null);
      setMathOverlayRenderState(null);
    }
  };

  // Sequential Queue Loop Runner
  useEffect(() => {
    if (activeTaskId) return; // Currently processing a task

    const nextTask = tasks.find(t => t.status === 'queued');
    if (nextTask) {
      setActiveTaskId(nextTask.id);
      processTask(nextTask).finally(() => {
        setActiveTaskId(null);
      });
    }
  }, [tasks, activeTaskId]);

  return (
    <ExportQueueContext.Provider
      value={{
        tasks,
        activeTask,
        enqueueExport,
        cancelTask,
        removeTask,
        clearCompleted,
      }}
    >
      {children}

      {/* Hidden Offscreen 1920x1080 Container for HD Full Slide Snapshot Export */}
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
        {fullRenderState && (
          <SlideCanvas
            ref={fullCanvasRef}
            item={fullRenderState.item}
            config={fullRenderState.config}
            currentIndex={fullRenderState.questionIndex}
            totalCount={fullRenderState.config.slideTextBoxes?.length || 1}
            isAnswerRevealMode={false}
            slideVariant={fullRenderState.isAnswerSlide ? 'answer' : 'question'}
            forceShowExplanation={fullRenderState.includeExplanation}
          />
        )}
      </div>

      {/* Hidden Offscreen 1920x1080 Container for PPTX Background-only Rasters */}
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
        {bgRenderState && (
          <SlideCanvas
            ref={bgCanvasRef}
            item={bgRenderState.item}
            config={bgRenderState.config}
            currentIndex={bgRenderState.questionIndex}
            totalCount={bgRenderState.config.slideTextBoxes?.length || 1}
            mode="backgroundOnly"
          />
        )}
      </div>

      {/* Hidden Offscreen 1920x1080 Transparent Container for PPTX LaTeX/Math Overlays */}
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
        {mathOverlayRenderState && (() => {
          const effConfig: DeckConfig = { ...mathOverlayRenderState.config, ...(mathOverlayRenderState.item.customConfig || {}) };
          const boxes = ensureAnswerBox(effConfig.slideTextBoxes || [], effConfig);
          const mathBoxIds = boxes
            .filter(b => boxContentHasMath(b, mathOverlayRenderState.item, effConfig, mathOverlayRenderState.questionIndex))
            .map(b => b.id);
          const revealFlags = resolveSlideAnswerFlags(effConfig, mathOverlayRenderState.isAnswerSlide);
          return (
            <div ref={mathOverlayCanvasRef} style={{ width: '1920px', height: '1080px', position: 'relative' }}>
              <SlideTextBoxLayer
                boxes={boxes}
                item={mathOverlayRenderState.item}
                config={effConfig}
                currentIndex={mathOverlayRenderState.questionIndex}
                totalCount={effConfig.slideTextBoxes?.length || 1}
                showAnswerHighlight={revealFlags.showOptionHighlight}
                isAnswerVariant={mathOverlayRenderState.isAnswerSlide}
                showExplanation={revealFlags.showExplanationCard}
                renderBoxIds={mathBoxIds}
              />
            </div>
          );
        })()}
      </div>
    </ExportQueueContext.Provider>
  );
};
