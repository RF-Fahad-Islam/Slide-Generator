import React, { useState, useEffect } from 'react';
import { MCQItem, DeckConfig, SavedDeck, QuestionType } from '../types';
import { db } from '../db/dexie';
import { SAMPLE_DECKS } from '../utils/bulkParser';
import { getTemplateById } from '../templates/registry';
import { MathText } from './MathText';
import {
  Database,
  Search,
  Filter,
  Plus,
  BookOpen,
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
} from 'lucide-react';

interface QuestionBankViewProps {
  currentItems: MCQItem[];
  currentConfig: DeckConfig;
  onImportToCurrentDeck: (itemsToAdd: MCQItem[]) => void;
  onCreateNewDeckFromSelection: (selectedItems: MCQItem[]) => void;
  appTheme?: 'dark' | 'light';
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  currentItems,
  currentConfig,
  onImportToCurrentDeck,
  onCreateNewDeckFromSelection,
  appTheme = 'dark',
}) => {
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | 'all'>('all');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [isSavingCurrent, setIsSavingCurrent] = useState<boolean>(false);
  const [newDeckName, setNewDeckName] = useState<string>('');
  const [newDeckSubject, setNewDeckSubject] = useState<string>('Biology');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [boardFilter, setBoardFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

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
        await db.questionDecks.bulkAdd(initialDecks);
        decks = initialDecks;
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

  // Apply Search & Tag Filters
  const filteredQuestions = allBankQuestions.filter(({ question, deckName }) => {
    // 1. Text Search
    if (searchQuery.trim()) {
      const qText = (question.stem + ' ' + (question.passage || '') + ' ' + (question.source || '') + ' ' + (question.explanation || '') + ' ' + question.options.map(o => o.text).join(' ')).toLowerCase();
      if (!qText.includes(searchQuery.toLowerCase().trim())) {
        return false;
      }
    }

    // 2. Subject Filter
    if (subjectFilter !== 'all') {
      const isMatch = (question.source || '').toLowerCase().includes(subjectFilter.toLowerCase()) ||
                      deckName.toLowerCase().includes(subjectFilter.toLowerCase());
      if (!isMatch) return false;
    }

    // 3. Board Filter
    if (boardFilter !== 'all') {
      const src = (question.source || '').toLowerCase();
      if (!src.includes(boardFilter.toLowerCase())) return false;
    }

    // 4. Type Filter
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
      <div className={`p-6 rounded-3xl border shadow-2xl flex flex-wrap items-center justify-between gap-6 ${
        isAppLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Database className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              Question Bank & Deck Library
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                {savedDecks.length} Decks • {allBankQuestions.length} Questions
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Browse saved decks, search questions across subjects & boards, and import selected questions directly into your slides.
            </p>
          </div>
        </div>

        {/* Action: Save Current Active Slide Deck as Card */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSavingCurrent(prev => !prev)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:brightness-110 cursor-pointer transition-all"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Save Current Presentation to Library</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between font-semibold animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {/* Save Deck Form Modal / Dropdown Card */}
      {isSavingCurrent && (
        <form onSubmit={handleSaveCurrentDeck} className="p-6 rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold text-amber-300 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-400" />
              Save Active Slide Presentation ({currentItems.length} Questions)
            </h3>
            <span className="text-xs text-slate-400">Card will be added to your Deck Library</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Deck Title Name</label>
              <input
                type="text"
                value={newDeckName}
                onChange={e => setNewDeckName(e.target.value)}
                placeholder="e.g. HSC Biology Ch 8 - Excretory System MCQs"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Subject Category</label>
              <select
                value={newDeckSubject}
                onChange={e => setNewDeckSubject(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300 focus:outline-none focus:border-amber-500 cursor-pointer"
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
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md cursor-pointer"
            >
              Confirm Save Deck
            </button>
          </div>
        </form>
      )}

      {/* SECTION 1: SAVED DECK CARDS GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            Saved Deck Cards ({savedDecks.length})
          </h3>
          <span className="text-xs text-slate-400">Click a deck to view questions or import</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Option to show All Decks */}
          <div
            onClick={() => setSelectedDeckId('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedDeckId === 'all'
                ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider font-mono">
                  All Questions
                </span>
                <h4 className="text-sm font-extrabold text-white mt-1">Entire Question Bank</h4>
                <p className="text-xs text-slate-400">View & filter all {allBankQuestions.length} stored questions across all decks</p>
              </div>
              <BookOpen className="w-5 h-5 text-amber-400 shrink-0 mt-1" />
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-300 font-bold">
              <span>{allBankQuestions.length} Total MCQs</span>
              <span className="flex items-center gap-1">Browse All →</span>
            </div>
          </div>

          {/* Stored Deck Cards */}
          {savedDecks.map(deck => {
            const isSelected = selectedDeckId === deck.id;
            const tmpl = getTemplateById(deck.config?.templateId || 'rakib-dark');
            const isLightTmpl = tmpl.themeType === 'light';

            return (
              <div
                key={deck.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
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
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold font-mono border ${
                        appTheme === 'light' ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-slate-950 text-amber-300 border-slate-800'
                      }`}>
                        📚 {deck.subject || 'Subject'}
                      </span>

                      {/* Theme Badge */}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${
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
                    className={`text-sm font-extrabold leading-snug hover:text-amber-500 cursor-pointer ${
                      appTheme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {deck.name}
                  </h4>

                  {/* Slide Preview Card Box */}
                  <div className={`p-2.5 rounded-xl border ${
                    appTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800/80'
                  } space-y-1.5`}>
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className={appTheme === 'light' ? 'text-slate-600' : 'text-slate-400'}>
                        {deck.badgeTag || deck.subject || 'Subject Badge'}
                      </span>
                      <span className="text-amber-500 font-mono font-extrabold">
                        {deck.items.length} Questions
                      </span>
                    </div>

                    {/* First question sample */}
                    {deck.items[0] && (
                      <div className={`text-[11px] font-semibold line-clamp-2 ${appTheme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                        <MathText text={deck.items[0].stem} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Bar Actions */}
                <div className={`mt-3 pt-3 border-t flex items-center justify-between gap-2 ${
                  appTheme === 'light' ? 'border-slate-200' : 'border-slate-800/80'
                }`}>
                  <span className={`text-xs font-mono font-bold ${appTheme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                    {deck.items.length} MCQs
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onImportToCurrentDeck(deck.items)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
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
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-extrabold shadow-sm cursor-pointer"
                      title="Open this deck as active presentation"
                    >
                      Open Slide Deck
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: QUESTION BANK FILTER & SEARCH BAR */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Filter Questions in Bank ({filteredQuestions.length} Found)
            </h3>
          </div>

          {/* Multi-Select Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={selectAllFiltered}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700"
            >
              Select All Filtered ({filteredQuestions.length})
            </button>
            {selectedQuestionIds.size > 0 && (
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold cursor-pointer border border-slate-700"
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Bangla/English questions..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Subject Filter Dropdown */}
          <select
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">📚 All Subjects</option>
            <option value="biology">Biology (জীববিজ্ঞান)</option>
            <option value="math">Higher Math (উচ্চতর গণিত)</option>
            <option value="physics">Physics (পদার্থবিজ্ঞান)</option>
            <option value="chemistry">Chemistry (রসায়ন)</option>
          </select>

          {/* Board / Source Filter */}
          <select
            value={boardFilter}
            onChange={e => setBoardFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">🏛️ All Boards & Sources</option>
            <option value="চট্টগ্রাম">Chittagong Board (চট্টগ্রাম)</option>
            <option value="ঢাকা">Dhaka Board (ঢাকা)</option>
            <option value="রাজশাহী">Rajshahi Board (রাজশাহী)</option>
            <option value="admission">University Admission (DU/BUET)</option>
          </select>

          {/* Question Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">🧩 All Question Types</option>
            <option value="standard">Standard MCQ (সাধারণ)</option>
            <option value="roman_statements">Roman Statements (বহুপদী i/ii/iii)</option>
            <option value="passage">Shared Passage (উদ্দীপক)</option>
          </select>
        </div>

        {/* Selected Items Floating Command Bar */}
        {selectedQuestionIds.size > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/20 border border-amber-500/40 flex flex-wrap items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs font-mono">
                {selectedQuestionIds.size} Selected
              </span>
              <span className="text-xs font-bold text-slate-200">
                Ready to import into slide presentation deck
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleImportSelected}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Append to Current Presentation ({selectedQuestionIds.size})</span>
              </button>
              <button
                onClick={handleCreateNewFromSelected}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create New Slide Presentation ({selectedQuestionIds.size}) →</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 3: QUESTION CARDS LIST */}
        <div className="space-y-3 pt-2">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-3">
              <Database className="w-12 h-12 mx-auto stroke-[1.2] text-slate-600" />
              <p className="text-sm font-semibold text-slate-400">No questions match your current search or filters.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSubjectFilter('all');
                  setBoardFilter('all');
                  setTypeFilter('all');
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-amber-300 border border-slate-700 font-bold"
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
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    isChecked
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Bar: Checkbox + Badges */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleQuestionSelect(question.id);
                        }}
                        className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-amber-400 fill-amber-500/20" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-600" />
                        )}
                      </button>

                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] font-bold text-amber-300">
                        #{idx + 1}
                      </span>

                      <span className="text-xs text-slate-400 font-medium">
                        Deck: <strong className="text-slate-200">{deckName}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      {question.source && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                          {question.source}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                        {question.questionType}
                      </span>
                    </div>
                  </div>

                  {/* Question Stem */}
                  <div className="pl-8 text-sm font-bold text-slate-100 leading-relaxed">
                    <MathText text={question.stem} />
                  </div>

                  {/* Roman Items (if bohupodi) */}
                  {question.romanItems && question.romanItems.length > 0 && (
                    <div className="ml-8 p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs text-slate-300 space-y-1 font-medium">
                      {question.romanItems.map((r, rIdx) => (
                        <div key={rIdx} className="flex items-center gap-2">
                          <MathText text={r} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Options 2x2 or List Grid */}
                  <div className="ml-8 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {question.options.map(opt => {
                      const isCorrect = opt.isCorrect || opt.key.toLowerCase() === question.answer?.toLowerCase();
                      return (
                        <div
                          key={opt.key}
                          className={`p-2 rounded-xl border flex items-center gap-2 font-semibold ${
                            isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-300'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] font-mono ${
                            isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
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
    </div>
  );
};
