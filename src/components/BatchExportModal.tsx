import React, { useState, useEffect, useRef } from 'react';
import { DeckConfig, MCQItem, SavedDeck } from '../types';
import { db } from '../db/dexie';
import { SAMPLE_DECKS } from '../utils/bulkParser';
import { exportDeckToPPTX } from '../utils/pptxExport';
import { SlideCanvas } from './SlideCanvas';
import { toPng } from 'html-to-image';
import { safeToPng } from '../utils/cleanExport';
import { getFontEmbedCSS } from '../utils/fontEmbed';
import { X, Download, Check, RefreshCw, CheckCircle2, Layers, CheckSquare } from 'lucide-react';
import { expandDeckSlides } from '../utils/answerSlides';

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
import { useExportQueue } from '../context/ExportQueueContext';

export const BatchExportModal: React.FC<BatchExportModalProps> = ({
  isOpen,
  onClose,
  seedConfig,
  appTheme = 'dark',
}) => {
  const isAppLight = appTheme === 'light';
  const { enqueueExport } = useExportQueue();
  const [decks, setDecks] = useState<SavedDeck[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [renderAsImages, setRenderAsImages] = useState<boolean>(false);
  const embedFonts = true;
  const [includeExplanation, setIncludeExplanation] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds([]);
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
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const allSelected = decks.length > 0 && selectedIds.length === decks.length;
  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : decks.map(d => d.id));
  };

  const selectedDecks = decks.filter(d => selectedIds.includes(d.id));
  const totalQuestions = selectedDecks.reduce((sum, d) => sum + d.items.length, 0);

  const handleDownload = () => {
    if (selectedDecks.length === 0) return;
    enqueueExport(
      'batch_pptx',
      `Batch Export (${selectedDecks.length} Deck${selectedDecks.length === 1 ? '' : 's'})`,
      `${totalQuestions} total questions`,
      {
        items: [],
        config: seedConfig,
        selectedDecks,
        renderAsImages,
        includeExplanation,
        embedFonts,
      }
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className={`absolute inset-0 ${isAppLight ? 'bg-black/40' : 'bg-black/80'} backdrop-blur-sm animate-modal-backdrop`} onClick={onClose} />
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
            className={`p-2 rounded-xl cursor-pointer transition-colors ${
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
                  className={`text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
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
                    }`}
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

        {/* Options */}
        {decks.length > 0 && (
          <div className={`px-5 py-3.5 border-t flex items-center gap-6 ${isAppLight ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-950/20 border-slate-800'}`}>
            <span className={`text-[10px] font-black uppercase tracking-wider ${isAppLight ? 'text-slate-400' : 'text-slate-500'}`}>Export Options:</span>
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
                checked={includeExplanation}
                onChange={(e) => setIncludeExplanation(e.target.checked)}
                className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
              />
              Include explanation
            </label>
          </div>
        )}

        {/* Footer */}
        <div className={`p-5 border-t flex flex-wrap items-center justify-between gap-3 ${isAppLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <span className={`text-[11px] font-mono font-bold ${isAppLight ? 'text-slate-500' : 'text-slate-500'}`}>
            {selectedIds.length === 0
              ? 'Select at least one deck to export'
              : `${selectedDecks.length} deck${selectedDecks.length === 1 ? '' : 's'} · ${totalQuestions} total questions`}
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${
                isAppLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              disabled={selectedIds.length === 0}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow cursor-pointer transition-all ${
                selectedIds.length === 0
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
              <span>Download PPTX ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
