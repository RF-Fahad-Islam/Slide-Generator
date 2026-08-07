import React, { useState, useEffect } from 'react';
import { MCQItem, DeckConfig, SavedDeck, QuestionType, getSourceTags } from '../types';
import { db } from '../db/dexie';
import { SAMPLE_DECKS } from '../utils/bulkParser';
import { getTemplateById } from '../templates/registry';
import { downloadJSON } from '../utils/mcqJson';
import { MathText } from './MathText';
import { QuestionBankPdfModal } from './QuestionBankPdfModal';
import { AddQuestionsBanner } from './AddQuestionsBanner';
import {
  Database,
  Search,
  Filter,
  Plus,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
  Trash2,
  Download,
  FolderPlus,
  ArrowRight,
  CheckCircle2,
  Tag,
  Bookmark,
  RefreshCw,
  Sun,
  Moon,
  Share2,
  FileText,
  X,
} from 'lucide-react';

interface QuestionBankViewProps {
  currentItems: MCQItem[];
  currentConfig: DeckConfig;
  onImportToCurrentDeck: (itemsToAdd: MCQItem[]) => void;
  onCreateNewDeckFromSelection: (selectedItems: MCQItem[]) => void;
  onOpenInSocial: (question: MCQItem) => void;
  onAddQuestions: () => void;
  appTheme?: 'dark' | 'light';
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  currentItems,
  currentConfig,
  onImportToCurrentDeck,
  onCreateNewDeckFromSelection,
  onOpenInSocial,
  onAddQuestions,
  appTheme = 'dark',
}) => {
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | 'all'>('all');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [isSavingCurrent, setIsSavingCurrent] = useState<boolean>(false);
  const [newDeckName, setNewDeckName] = useState<string>('');
  const [newDeckSubject, setNewDeckSubject] = useState<string>('Biology');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isPdfExportOpen, setIsPdfExportOpen] = useState<boolean>(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [boardFilter, setBoardFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [paperFilter, setPaperFilter] = useState<string>('all');

  // Load Saved Decks from IndexedDB on mount
  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      let decks = await db.questionDecks.toArray();
      // If IndexedDB has no decks yet, seed with sample decks
      if (decks.length === 0) {
        const initialDecks: SavedDeck[] = SAMPLE_DECKS.map((sample, idx) => ({
          id: `sample_deck_${idx + 1}`,
          name: sample.name,
          description: sample.description,
          subject: idx === 0 ? 'Biology' : 'Higher Math',
          badgeTag: idx === 0 ? 'SSC/HSC Biology' : 'HSC Math',
          items: sample.items,
          config: currentConfig,
          createdAt: Date.now() - (idx * 86400000),
          updatedAt: Date.now() - (idx * 86400000),
        }));
        await db.questionDecks.bulkPut(initialDecks);
        decks = await db.questionDecks.toArray();
      }
      setSavedDecks(decks);
    } catch (err) {
      console.error('Failed to load decks from IndexedDB:', err);
    }
  };

  // Save current active presentation deck to library
  const handleSaveCurrentDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;

    if (currentItems.length === 0) {
      alert('Current presentation has no questions to save!');
      return;
    }

    try {
      const newDeck: SavedDeck = {
        id: `deck_${Date.now()}`,
        name: newDeckName.trim(),
        subject: newDeckSubject,
        badgeTag: currentConfig.badgeTag || newDeckSubject,
        items: [...currentItems],
        config: { ...currentConfig },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.questionDecks.put(newDeck);
      setSavedDecks(prev => [newDeck, ...prev]);
      setNewDeckName('');
      setIsSavingCurrent(false);
      showTemporarySuccess('Current presentation saved to your Deck Library!');
    } catch (err) {
      console.error('Failed to save deck:', err);
      alert('Error saving deck to storage.');
    }
  };

  const handleDeleteDeck = async (deckId: string, deckName: string) => {
    if (window.confirm(`Are you sure you want to delete "${deckName}" from your bank?`)) {
      try {
        await db.questionDecks.delete(deckId);
        setSavedDecks(prev => prev.filter(d => d.id !== deckId));
        if (selectedDeckId === deckId) setSelectedDeckId('all');
        showTemporarySuccess(`Deleted deck "${deckName}"`);
      } catch (err) {
        console.error('Failed to delete deck:', err);
      }
    }
  };

  // Export a saved deck as re-importable JSON
  const handleExportDeckJson = (deck: SavedDeck) => {
    downloadJSON(
      { name: deck.name, subject: deck.subject, badgeTag: deck.badgeTag, items: deck.items },
      `${deck.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_mcqs.json`
    );
  };

  const showTemporarySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Aggregate all questions across all decks in the library
  const allBankQuestions: { question: MCQItem; deckName: string; deckId: string }[] = [];
  savedDecks.forEach(deck => {
    if (selectedDeckId === 'all' || selectedDeckId === deck.id) {
      deck.items.forEach(q => {
        allBankQuestions.push({ question: q, deckName: deck.name, deckId: deck.id });
      });
    }
  });

  // Derive distinct tag values present in the bank for the filter dropdowns
  const distinctSubjectTags = Array.from(new Set(allBankQuestions.map(q => q.question.tags?.subject?.trim()).filter((v): v is string => !!v)));
  const distinctClassTags = Array.from(new Set(allBankQuestions.map(q => q.question.tags?.className?.trim()).filter((v): v is string => !!v)));
  const distinctPaperTags = Array.from(new Set(allBankQuestions.map(q => q.question.tags?.paper?.trim()).filter((v): v is string => !!v)));

  // Apply Search & Tag Filters
  const filteredQuestions = allBankQuestions.filter(({ question, deckName }) => {
    const srcTags = getSourceTags(question);

    // 1. Text Search
    if (searchQuery.trim()) {
      const qText = (question.stem + ' ' + (question.passage || '') + ' ' + srcTags.join(' ') + ' ' + (question.explanation || '') + ' ' + question.options.map(o => o.text).join(' ')).toLowerCase();
      if (!qText.includes(searchQuery.toLowerCase().trim())) {
        return false;
      }
    }

    // 2. Subject Filter
    if (subjectFilter !== 'all') {
      const isMatch = srcTags.some(t => t.toLowerCase().includes(subjectFilter.toLowerCase())) ||
                      deckName.toLowerCase().includes(subjectFilter.toLowerCase()) ||
                      (question.tags?.subject || '').toLowerCase().includes(subjectFilter.toLowerCase());
      if (!isMatch) return false;
    }

    // 3. Board Filter
    if (boardFilter !== 'all') {
      if (!srcTags.some(t => t.toLowerCase().includes(boardFilter.toLowerCase()))) return false;
    }

    // 4. Class Filter
    if (classFilter !== 'all') {
      if ((question.tags?.className || '').toLowerCase() !== classFilter.toLowerCase()) return false;
    }

    // 5. Paper Filter
    if (paperFilter !== 'all') {
      if ((question.tags?.paper || '').toLowerCase() !== paperFilter.toLowerCase()) return false;
    }

    // 6. Type Filter
    if (typeFilter !== 'all') {
      if (question.questionType !== typeFilter) return false;
    }

    return true;
  });

  // Selection Handlers
  const toggleQuestionSelect = (id: string) => {
    setSelectedQuestionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    const next = new Set(selectedQuestionIds);
    filteredQuestions.forEach(({ question }) => next.add(question.id));
    setSelectedQuestionIds(next);
  };

  const clearSelection = () => {
    setSelectedQuestionIds(new Set());
  };

  const getSelectedQuestionsList = (): MCQItem[] => {
    const map = new Map<string, MCQItem>();
    allBankQuestions.forEach(({ question }) => {
      if (selectedQuestionIds.has(question.id)) {
        map.set(question.id, question);
      }
    });
    return Array.from(map.values());
  };

  const handleImportSelected = () => {
    const selected = getSelectedQuestionsList();
    if (selected.length === 0) {
      alert('Please check at least one question from the bank to import.');
      return;
    }
    onImportToCurrentDeck(selected);
  };

  const handleCreateNewFromSelected = () => {
    const selected = getSelectedQuestionsList();
    if (selected.length === 0) {
      alert('Please check at least one question from the bank.');
      return;
    }
    onCreateNewDeckFromSelection(selected);
  };

  const isAppLight = appTheme === 'light';

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Top Banner & Header */}
      <div className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-6 lg:p-8 border flex flex-wrap items-center justify-between gap-6 ${
        isAppLight ? 'border-slate-200' : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25 flex items-center justify-center">
            <Database className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div>
            <h2 className={`text-xl lg:text-2xl font-black flex items-center gap-2 ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
              Question Bank & Deck Library
              <span className={`text-sm px-2.5 py-0.5 rounded-full font-mono font-black border ${
                isAppLight ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {savedDecks.length} Decks • {allBankQuestions.length} Questions
              </span>
            </h2>
            <p className={`text-sm mt-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Browse saved decks, search questions across subjects & boards, and import selected questions directly into your slides.
            </p>
          </div>
        </div>

        {/* Action: Save Current Active Slide Deck as Card */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSavingCurrent(prev => !prev)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 hover:brightness-110 cursor-pointer transition-all"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Save Current Presentation to Library</span>
          </button>
        </div>
      </div>

      {/* ADD QUESTIONS — green banner (shared with Slide Studio) opens the source chooser modal */}
      <AddQuestionsBanner onClick={onAddQuestions} count={currentItems.length} appTheme={appTheme} />

      {/* Success Notification */}
      {successMsg && (
        <div className={`p-4 rounded-2xl border text-sm flex items-center justify-between font-semibold animate-fadeIn ${
          isAppLight ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {/* Save Deck Form Modal / Dropdown Card */}
      {isSavingCurrent && (
        <form onSubmit={handleSaveCurrentDeck} className={`p-6 rounded-3xl border shadow-2xl space-y-4 animate-fadeIn ${
          isAppLight ? 'bg-white border-amber-300 shadow-amber-200/30' : 'bg-slate-900 border-amber-500/40 shadow-2xl'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${isAppLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <h3 className={`text-sm font-extrabold flex items-center gap-2 ${isAppLight ? 'text-amber-700' : 'text-amber-300'}`}>
              <Bookmark className="w-4 h-4 text-amber-400" />
              Save Active Slide Presentation ({currentItems.length} Questions)
            </h3>
            <span className={`text-sm ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Card will be added to your Deck Library</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-bold mb-1 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>Deck Title Name</label>
              <input
                type="text"
                value={newDeckName}
                onChange={e => setNewDeckName(e.target.value)}
                placeholder="e.g. HSC Biology Ch 8 - Excretory System MCQs"
                required
                className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:border-amber-500 ${
                  isAppLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-bold mb-1 ${isAppLight ? 'text-slate-700' : 'text-slate-300'}`}>Subject Category</label>
              <select
                value={newDeckSubject}
                onChange={e => setNewDeckSubject(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:border-amber-500 cursor-pointer ${
                  isAppLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-amber-300'
                }`}
              >
                <option value="Biology">Biology (জীববিজ্ঞান)</option>
                <option value="Higher Math">Higher Math (উচ্চতর গণিত)</option>
                <option value="Physics">Physics (পদার্থবিজ্ঞান)</option>
                <option value="Chemistry">Chemistry (রসায়ন)</option>
                <option value="General Science">General Science (বিজ্ঞান)</option>
                <option value="English">English</option>
                <option value="ICT">ICT</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsSavingCurrent(false)}
              className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer ${
                isAppLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-extrabold shadow-md cursor-pointer"
            >
              Confirm Save Deck
            </button>
          </div>
        </form>
      )}

      {/* SECTION 1: SAVED DECK CARDS GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`text-base font-extrabold uppercase tracking-wider flex items-center gap-2 ${isAppLight ? 'text-slate-700' : 'text-slate-200'}`}>
            <Layers className="w-5 h-5 text-amber-400" />
            Saved Deck Cards ({savedDecks.length})
          </h3>
          <span className="text-sm text-slate-400">Click a deck to view questions or import</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Option to show All Decks */}
          <div
            onClick={() => setSelectedDeckId('all')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              isAppLight
                ? selectedDeckId === 'all'
                  ? 'bg-amber-50 border-amber-500 shadow-xl ring-2 ring-amber-400/50'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                : selectedDeckId === 'all'
                  ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className={`px-2.5 py-0.5 rounded-md text-sm font-bold font-mono ${
                  isAppLight
                    ? 'bg-amber-100 text-amber-700 border border-amber-300'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  All Questions
                </span>
                <span className={`p-2 rounded-xl ${
                  isAppLight ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/15 text-amber-400'
                }`}>
                  <Database className="w-5 h-5" />
                </span>
              </div>
              <h4 className={`text-base font-extrabold leading-snug ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
                Entire Question Bank
              </h4>
              <p className={`text-sm ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                View &amp; filter all {allBankQuestions.length} stored questions across all decks
              </p>
            </div>
            <div className={`mt-4 pt-3 border-t flex items-center justify-between text-sm font-bold ${
              isAppLight ? 'border-slate-200 text-amber-700' : 'border-slate-800/80 text-amber-300'
            }`}>
              <span className="font-mono font-extrabold">{allBankQuestions.length} Total MCQs</span>
              <span className="flex items-center gap-1">Browse All →</span>
            </div>
          </div>

          {/* Stored Deck Cards */}
          {savedDecks.map(deck => {
            const isSelected = selectedDeckId === deck.id;
            const tmpl = getTemplateById(deck.config?.templateId || 'nobel-dark');
            const isLightTmpl = tmpl.themeType === 'light';

            return (
              <div
                key={deck.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  appTheme === 'light'
                    ? isSelected
                      ? 'bg-amber-50/90 border-amber-500 shadow-xl ring-2 ring-amber-400/50'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    : isSelected
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Top Badges: Subject + Theme Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Subject Tag */}
                      <span className={`px-2.5 py-0.5 rounded-md text-sm font-bold font-mono border ${
                        appTheme === 'light' ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-slate-950 text-amber-300 border-slate-800'
                      }`}>
                        📚 {deck.subject || 'Subject'}
                      </span>

                      {/* Theme Badge */}
                      <span className={`px-2 py-0.5 rounded-md text-sm font-bold border flex items-center gap-1 ${
                        isLightTmpl
                          ? 'bg-amber-400/20 text-amber-800 border-amber-300'
                          : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      }`}>
                        <span>{isLightTmpl ? '☀️' : '🌙'}</span>
                        <span className="truncate max-w-[120px]">{tmpl.name}</span>
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDeck(deck.id, deck.name);
                      }}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                      title="Delete Deck"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Deck Title */}
                  <h4
                    onClick={() => setSelectedDeckId(deck.id)}
                    className={`text-base font-extrabold leading-snug hover:text-amber-500 cursor-pointer ${
                      appTheme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {deck.name}
                  </h4>

                  {/* Slide Preview Card Box */}
                  <div className={`p-2.5 rounded-xl border ${
                    appTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/80'
                  } space-y-1.5`}>
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span className={appTheme === 'light' ? 'text-slate-600' : 'text-slate-400'}>
                        {deck.badgeTag || deck.subject || 'Subject Badge'}
                      </span>
                      <span className="text-amber-500 font-mono font-extrabold">
                        {deck.items.length} Questions
                      </span>
                    </div>

                    {/* First question sample */}
                    {deck.items[0] && (
                      <div className={`text-sm font-semibold line-clamp-2 ${appTheme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                        <MathText text={deck.items[0].stem} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Bar Actions */}
                <div className={`mt-3 pt-3 border-t flex items-center justify-between gap-2 ${
                  appTheme === 'light' ? 'border-slate-200' : 'border-slate-800/80'
                }`}>
                  <span className={`text-sm font-mono font-bold ${appTheme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                    {deck.items.length} MCQs
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onImportToCurrentDeck(deck.items)}
                      className={`px-2.5 py-1 rounded-lg text-sm font-bold border transition-colors cursor-pointer ${
                        appTheme === 'light'
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                      }`}
                      title="Append all questions into active presentation"
                    >
                      + Append
                    </button>
                    <button
                      onClick={() => onCreateNewDeckFromSelection(deck.items)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-extrabold shadow-sm cursor-pointer"
                      title="Open this deck as active presentation"
                    >
                      Open Slide Deck
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportDeckJson(deck);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-sm font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                        appTheme === 'light'
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700'
                      }`}
                      title="Download this deck as re-importable JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                      JSON
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: QUESTION BANK FILTER & SEARCH BAR */}
      <div className={`p-6 lg:p-8 rounded-3xl border space-y-6 shadow-2xl ${
        isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className={`flex flex-wrap items-center justify-between gap-4 border-b pb-5 ${isAppLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="flex items-center gap-3">
            <Filter className="w-6 h-6 text-amber-500" />
            <h3 className={`text-lg font-extrabold uppercase tracking-wider ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
              Filter Questions in Bank ({filteredQuestions.length} Found)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={selectAllFiltered}
              className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer border transition-colors ${
                isAppLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              Select All Filtered ({filteredQuestions.length})
            </button>
            {selectedQuestionIds.size > 0 && (
              <button
                onClick={clearSelection}
                className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer border transition-colors ${
                  isAppLight ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200' : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border-slate-700'
                }`}
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className={`w-5 h-5 absolute left-4 top-3.5 ${isAppLight ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Bangla/English questions..."
              className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-amber-500 ${
                isAppLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400' : 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
              }`}
            />
          </div>

          <select
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
            className={`w-full px-3.5 py-3 rounded-xl border text-sm font-semibold focus:outline-none focus:border-amber-500 cursor-pointer ${
              isAppLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-amber-300'
            }`}
          >
            <option value="all">📚 All Subjects</option>
            <option value="biology">Biology (জীববিজ্ঞান)</option>
            <option value="math">Higher Math (উচ্চতর গণিত)</option>
            <option value="physics">Physics (পদার্থবিজ্ঞান)</option>
            <option value="chemistry">Chemistry (রসায়ন)</option>
            {distinctSubjectTags.filter(t => !['biology', 'math', 'physics', 'chemistry'].includes(t.toLowerCase())).map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>

          <select
            value={boardFilter}
            onChange={e => setBoardFilter(e.target.value)}
            className={`w-full px-3.5 py-3 rounded-xl border text-sm font-semibold focus:outline-none focus:border-amber-500 cursor-pointer ${
              isAppLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-amber-300'
            }`}
          >
            <option value="all">🏛️ All Boards & Sources</option>
            <option value="চট্টগ্রাম">Chittagong Board (চট্টগ্রাম)</option>
            <option value="ঢাকা">Dhaka Board (ঢাকা)</option>
            <option value="রাজশাহী">Rajshahi Board (রাজশাহী)</option>
            <option value="admission">University Admission (DU/BUET)</option>
          </select>

          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className={`w-full px-3.5 py-3 rounded-xl border text-sm font-semibold focus:outline-none focus:border-amber-500 cursor-pointer ${
              isAppLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-amber-300'
            }`}
          >
            <option value="all">🏫 All Classes</option>
            {distinctClassTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
            {distinctClassTags.length === 0 && (
              <>
                <option value="SSC">SSC</option>
                <option value="HSC">HSC</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
              </>
            )}
          </select>

          <select
            value={paperFilter}
            onChange={e => setPaperFilter(e.target.value)}
            className={`w-full px-3.5 py-3 rounded-xl border text-sm font-semibold focus:outline-none focus:border-amber-500 cursor-pointer ${
              isAppLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-amber-300'
            }`}
          >
            <option value="all">📄 All Papers</option>
            {distinctPaperTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
            {distinctPaperTags.length === 0 && (
              <>
                <option value="1st Paper">1st Paper</option>
                <option value="2nd Paper">2nd Paper</option>
              </>
            )}
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className={`w-full px-3.5 py-3 rounded-xl border text-sm font-semibold focus:outline-none focus:border-amber-500 cursor-pointer ${
              isAppLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-amber-300'
            }`}
          >
            <option value="all">🧩 All Question Types</option>
            <option value="standard">Standard MCQ (সাধারণ)</option>
            <option value="roman_statements">Roman Statements (বহুপদী i/ii/iii)</option>
            <option value="passage">Shared Passage (উদ্দীপক)</option>
          </select>
        </div>

        {/* Selected Items Floating Command Bar */}
        {selectedQuestionIds.size > 0 && (
          <div className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 animate-fadeIn ${
            isAppLight
              ? 'bg-amber-50 border-amber-300'
              : 'bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/20 border-amber-500/40'
          }`}>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-sm font-mono">
                {selectedQuestionIds.size} Selected
              </span>
              <span className={`text-sm font-bold ${isAppLight ? 'text-slate-700' : 'text-slate-200'}`}>
                Ready to import into slide presentation deck
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleImportSelected}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm border cursor-pointer flex items-center gap-2 transition-colors ${
                  isAppLight ? 'bg-white hover:bg-slate-50 text-amber-700 border-amber-300' : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                }`}
              >
                <Plus className="w-5 h-5" />
                <span>+ Append to Current Presentation ({selectedQuestionIds.size})</span>
              </button>
              <button
                onClick={() => setIsPdfExportOpen(true)}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm border cursor-pointer flex items-center gap-2 transition-colors ${
                  isAppLight ? 'bg-white hover:bg-slate-50 text-indigo-700 border-indigo-300' : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700'
                }`}
                title="Export the selected MCQs as a printable PDF paper with slide header/footer branding"
              >
                <FileText className="w-5 h-5" />
                <span>Export Selected as PDF ({selectedQuestionIds.size})</span>
              </button>
              <button
                onClick={handleCreateNewFromSelected}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-md cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>Create New Slide Presentation ({selectedQuestionIds.size}) →</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 3: QUESTION CARDS LIST */}
        <div className="space-y-3 pt-2">
          {filteredQuestions.length === 0 ? (
            <div className={`text-center py-12 space-y-3 ${isAppLight ? 'text-slate-400' : 'text-slate-500'}`}>
              <Database className={`w-12 h-12 mx-auto stroke-[1.2] ${isAppLight ? 'text-slate-300' : 'text-slate-600'}`} />
              <p className={`text-base font-semibold ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>No questions match your current search or filters.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                 setSubjectFilter('all');
                 setBoardFilter('all');
                 setClassFilter('all');
                 setPaperFilter('all');
                 setTypeFilter('all');
                }}
                className={`text-sm px-4 py-2 rounded-lg font-bold border transition-colors ${
                  isAppLight ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' : 'bg-slate-800 text-amber-300 border-slate-700'
                }`}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredQuestions.map(({ question, deckName }, idx) => {
              const isChecked = selectedQuestionIds.has(question.id);

              return (
                <div
                  key={`${question.id}_${idx}`}
                  onClick={() => toggleQuestionSelect(question.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    isChecked
                      ? isAppLight
                        ? 'bg-amber-50 border-amber-400 shadow-md ring-1 ring-amber-400/30'
                        : 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                      : isAppLight
                        ? 'bg-white border-slate-200 hover:border-slate-300'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleQuestionSelect(question.id);
                        }}
                        className="hover:scale-110 transition-transform cursor-pointer shrink-0"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-6 h-6 text-amber-500 fill-amber-500/20" />
                        ) : (
                          <Square className={`w-6 h-6 ${isAppLight ? 'text-slate-300' : 'text-slate-600'}`} />
                        )}
                      </button>

                      <span className={`px-2.5 py-1 rounded font-mono text-sm font-bold border shrink-0 ${
                        isAppLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-900 text-amber-300 border-slate-800'
                      }`}>
                        #{idx + 1}
                      </span>

                      <span className={`text-sm font-medium truncate ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        Deck: <strong className={isAppLight ? 'text-slate-900' : 'text-slate-200'}>{deckName}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <button
                        type="button"
                        title="Open in Social Post Generator"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenInSocial(question);
                        }}
                        className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer font-bold shrink-0 hover:scale-105 ${
                          isAppLight
                            ? 'bg-white text-amber-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300'
                            : 'bg-slate-900 text-amber-300 border-slate-800 hover:border-amber-500/40'
                        }`}
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                      {getSourceTags(question).map(tag => (
                        <span key={tag} className={`px-2.5 py-1 rounded-full font-bold border ${
                          isAppLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {tag}
                        </span>
                      ))}
                      {/* Optional tag chips */}
                      {question.tags?.subject && (
                        <span className={`px-2.5 py-1 rounded-full font-mono text-xs border ${
                          isAppLight ? 'bg-slate-50 text-slate-600 border-slate-300' : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}>
                          📌 {question.tags.subject}
                        </span>
                      )}
                      {question.tags?.className && (
                        <span className={`px-2.5 py-1 rounded-full font-mono text-xs border ${
                          isAppLight ? 'bg-slate-50 text-slate-600 border-slate-300' : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}>
                          🏫 {question.tags.className}
                        </span>
                      )}
                      {question.tags?.paper && (
                        <span className={`px-2.5 py-1 rounded-full font-mono text-xs border ${
                          isAppLight ? 'bg-slate-50 text-slate-600 border-slate-300' : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}>
                          📄 {question.tags.paper}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded uppercase font-mono text-sm border ${
                        isAppLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}>
                        {question.questionType}
                      </span>
                    </div>
                  </div>

                  <div className={`pl-8 text-base font-bold leading-relaxed ${isAppLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    <MathText text={question.stem} />
                  </div>

                  {question.romanItems && question.romanItems.length > 0 && (
                    <div className={`ml-8 p-3 rounded-xl border text-sm space-y-1 font-medium ${
                      isAppLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800/80 text-slate-300'
                    }`}>
                      {question.romanItems.map((r, rIdx) => (
                        <div key={rIdx} className="flex items-center gap-2">
                          <MathText text={r} />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="ml-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
                    {question.options.map(opt => {
                      const isCorrect = opt.isCorrect || opt.key.toLowerCase() === question.answer?.toLowerCase();
                      return (
                        <div
                          key={opt.key}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 font-semibold ${
                            isCorrect
                              ? isAppLight
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                              : isAppLight
                                ? 'bg-white border-slate-200 text-slate-700'
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-sm font-mono ${
                            isCorrect ? 'bg-emerald-500 text-white' : isAppLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {opt.key}
                          </span>
                          <MathText text={opt.text} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Selected MCQs → PDF export modal */}
      <QuestionBankPdfModal
        isOpen={isPdfExportOpen}
        onClose={() => setIsPdfExportOpen(false)}
        items={getSelectedQuestionsList()}
        config={currentConfig}
        appTheme={appTheme}
      />
    </div>
  );
};
