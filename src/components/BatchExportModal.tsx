import React, { useState, useEffect, useRef } from 'react';
import { DeckConfig, MCQItem, SavedDeck } from '../types';
import { db } from '../db/dexie';
import { SAMPLE_DECKS } from '../utils/bulkParser';
import { exportDeckToPPTX } from '../utils/pptxExport';
import { SlideCanvas } from './SlideCanvas';
import { toPng } from 'html-to-image';
import { getFontEmbedCSS } from '../utils/fontEmbed';
import { X, Download, Check, RefreshCw, CheckCircle2, Layers, CheckSquare } from 'lucide-react';

interface BatchExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  seedConfig: DeckConfig;
  appTheme?: 'dark' | 'light';
}

// Batch deck export — opened from the navbar "Export Slides" buttons. Lists the
// saved decks (db.questionDecks) with a checkbox each; selecting one or many and
// hitting Download exports each selected deck as its own PPTX file (single deck
// works too). Reuses exportDeckToPPTX which triggers its own file download.
export const BatchExportModal: React.FC<BatchExportModalProps> = ({
  isOpen,
  onClose,
  seedConfig,
  appTheme = 'dark',
}) => {
  const isAppLight = appTheme === 'light';
  const [decks, setDecks] = useState<SavedDeck[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportIndex, setExportIndex] = useState(0);
  const [exportTotal, setExportTotal] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  // Item/config currently rasterized offscreen for a background-only PPTX capture.
  const [bgRenderSlide, setBgRenderSlide] = useState<{ item: MCQItem; config: DeckConfig; questionIndex: number } | null>(null);
  const bgCanvasRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds([]);
    setIsExporting(false);
    setDoneCount(0);
    setExportIndex(0);
    setExportTotal(0);
    setProgressMsg('');
    loadDecks();
  }, [isOpen]);

  const loadDecks = async () => {
    try {
      let stored = await db.questionDecks.toArray();
      if (stored.length === 0) {
        const initialDecks: SavedDeck[] = SAMPLE_DECKS.map((sample, idx) => ({
          id: `sample_deck_${idx + 1}`,
          name: sample.name,
          description: sample.description,
          subject: idx === 0 ? 'Biology' : 'Higher Math',
          badgeTag: idx === 0 ? 'SSC/HSC Biology' : 'HSC Math',
          items: sample.items,
          config: seedConfig,
          createdAt: Date.now() - (idx * 86400000),
          updatedAt: Date.now() - (idx * 86400000),
        }));
        await db.questionDecks.bulkPut(initialDecks);
        stored = await db.questionDecks.toArray();
      }
      stored.sort((a, b) => b.updatedAt - a.updatedAt);
      setDecks(stored);
    } catch (err) {
      console.error('Failed to load decks:', err);
    } finally {
      setIsLoaded(true);
    }
  };

  if (!isOpen) return null;

  const toggle = (id: string) => {
    if (isExporting) return;
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const allSelected = decks.length > 0 && selectedIds.length === decks.length;
  const toggleAll = () => {
    if (isExporting) return;
    setSelectedIds(allSelected ? [] : decks.map(d => d.id));
  };

  const selectedDecks = decks.filter(d => selectedIds.includes(d.id));
  const totalQuestions = selectedDecks.reduce((sum, d) => sum + d.items.length, 0);

  const handleDownload = async () => {
    if (selectedDecks.length === 0) return;
    setIsExporting(true);
    setExportTotal(selectedDecks.length);
    setDoneCount(0);
    setExportIndex(0);
    setProgressMsg('');
    try {
      for (let i = 0; i < selectedDecks.length; i++) {
        const deck = selectedDecks[i];
        setExportIndex(i + 1);

        // Rasterize the exact background stack (gradient/image/tint/glows) for
        // every slide so the PPTX gets a pixel-accurate picture layer instead
        // of an approximated gradient shape — mirrors ExportModal's PPTX flow.
        const fontEmbedCSS = await getFontEmbedCSS();
        const backgroundDataUrls: string[] = [];
        for (let qi = 0; qi < deck.items.length; qi++) {
          setBgRenderSlide({ item: deck.items[qi], config: deck.config, questionIndex: qi });
          setProgressMsg(`Rendering background ${qi + 1} of ${deck.items.length} for "${deck.name}"...`);
          await new Promise(r => setTimeout(r, 100));
          const el = bgCanvasRef.current;
          if (el) {
            const dataUrl = await toPng(el, { cacheBust: true, fontEmbedCSS });
            backgroundDataUrls.push(dataUrl);
          }
        }

        setProgressMsg('');
        await exportDeckToPPTX(deck.items, deck.config, (msg) => setProgressMsg(msg), undefined, true, backgroundDataUrls);
        setDoneCount(i + 1);
      }
    } catch (err: any) {
      console.error('Batch PPTX Export Error:', err);
      alert('Failed to generate PowerPoint for one of the decks: ' + err.message);
    } finally {
      setIsExporting(false);
      setProgressMsg('');
      setBgRenderSlide(null);
    }
  };

  const progressPct = exportTotal > 0 ? Math.round((doneCount / exportTotal) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className={`absolute inset-0 ${isAppLight ? 'bg-black/40' : 'bg-black/80'} backdrop-blur-sm animate-modal-backdrop`} onClick={isExporting ? undefined : onClose} />
      <div className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} relative w-full max-w-3xl border flex flex-col max-h-[92vh] overflow-hidden animate-modal-card ${
        isAppLight ? 'border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between gap-3 p-5 border-b ${isAppLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 shadow-lg">
              <Download className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className={`text-lg font-black ${isAppLight ? 'text-slate-900' : 'text-white'}`}>Batch Export Decks</h3>
              <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Select one or more decks to download each as its own PowerPoint (.pptx)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className={`p-2 rounded-xl cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              isAppLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Deck list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {!isLoaded ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm font-bold text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading decks...
            </div>
          ) : decks.length === 0 ? (
            <div className={`py-12 text-center rounded-2xl border border-dashed ${
              isAppLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <p className="text-sm font-bold text-slate-400">No decks saved yet. Save a deck in My Decks first.</p>
            </div>
          ) : (
            <>
              {/* Select All / Clear */}
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleAll}
                  disabled={isExporting}
                  className={`text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    isAppLight ? 'text-amber-700 hover:text-amber-900' : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  {allSelected ? (
                    <><CheckSquare className="w-4 h-4" /> Clear All</>
                  ) : (
                    <><CheckSquare className="w-4 h-4" /> Select All</>
                  )}
                </button>
                <span className={`text-[11px] font-mono font-bold ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  {selectedIds.length} / {decks.length} selected
                </span>
              </div>

              {decks.map((deck) => {
                const isSelected = selectedIds.includes(deck.id);
                return (
                  <div
                    key={deck.id}
                    onClick={() => toggle(deck.id)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all select-none ${
                      isSelected
                        ? isAppLight
                          ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400/40'
                          : 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
                        : isAppLight
                        ? 'bg-white hover:border-amber-300 border-slate-200'
                        : 'bg-slate-950 hover:border-slate-700 border-slate-800'
                    } ${isExporting ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    {/* Checkbox */}
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-amber-500 border-amber-500 text-slate-950'
                        : isAppLight
                        ? 'bg-white border-slate-300'
                        : 'bg-slate-900 border-slate-700'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-extrabold truncate ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                          {deck.name}
                        </span>
                        {deck.subject && (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border ${
                            isAppLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {deck.subject}
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] mt-0.5 flex items-center gap-1 font-medium ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        <Layers className="w-3 h-3" />
                        {deck.items.length} Questions · Updated {new Date(deck.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`p-5 border-t flex flex-wrap items-center justify-between gap-3 ${isAppLight ? 'border-slate-200' : 'border-slate-800'}`}>
          {isExporting ? (
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <RefreshCw className="w-4 h-4 text-amber-500 animate-spin shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-500">
                  Exporting deck {exportIndex} of {exportTotal}...
                </p>
                <div className="h-1.5 mt-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {progressMsg && (
                  <p className={`text-[11px] mt-1 truncate font-medium ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {progressMsg}
                  </p>
                )}
              </div>
            </div>
          ) : doneCount > 0 ? (
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
              {doneCount} deck{doneCount === 1 ? '' : 's'} exported
            </div>
          ) : (
            <span className={`text-[11px] font-mono font-bold ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
              {selectedIds.length === 0
                ? 'Select at least one deck to export'
                : `${selectedDecks.length} deck${selectedDecks.length === 1 ? '' : 's'} · ${totalQuestions} total questions`}
            </span>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              disabled={isExporting}
              className={`px-4 py-2.5 rounded-xl border text-xs font-extrabold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                isAppLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              {doneCount > 0 ? 'Done' : 'Cancel'}
            </button>
            <button
              onClick={handleDownload}
              disabled={selectedIds.length === 0 || isExporting}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow cursor-pointer transition-all ${
                selectedIds.length === 0 || isExporting
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
              title={
                selectedIds.length === 0
                  ? 'Select at least one deck first'
                  : `Download ${selectedDecks.length} deck${selectedDecks.length === 1 ? '' : 's'} as PowerPoint`
              }
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>{isExporting ? 'Exporting...' : `Download PPTX (${selectedIds.length})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden offscreen 1920x1080 container for PPTX background-only rasters
          (gradient/image/tint/glow stack, no text/shape layers). */}
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
        {bgRenderSlide && (
          <SlideCanvas
            ref={bgCanvasRef}
            item={bgRenderSlide.item}
            config={bgRenderSlide.config}
            currentIndex={bgRenderSlide.questionIndex}
            totalCount={1}
            mode="backgroundOnly"
          />
        )}
      </div>
    </div>
  );
};
