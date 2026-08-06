import React, { useState, useEffect } from 'react';
import { MCQItem, DeckConfig, SavedDeck } from '../types';
import { db } from '../db/dexie';
import { SAMPLE_DECKS } from '../utils/bulkParser';
import { downloadJSON } from '../utils/mcqJson';
import { DeckCard } from './DeckCard';
import {
  Library,
  Plus,
  CheckCircle2,
  FolderPlus,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface MyDecksViewProps {
  currentItems: MCQItem[];
  currentConfig: DeckConfig;
  onOpenDeck: (items: MCQItem[], deckTitle?: string) => void;
  onOpenDeckSettings: (items: MCQItem[], config?: DeckConfig, savedDeckId?: string) => void;
  onOpenSocialGenerator: (items: MCQItem[]) => void;
  onDownloadDeck: (deck: { items: MCQItem[]; config: DeckConfig }) => void;
  onNavigateTab: (tab: 'home' | 'decks' | 'social' | 'preview' | 'bank' | 'ai' | 'manual' | 'settings' | 'templates' | 'ai-keys') => void;
  appTheme?: 'dark' | 'light';
}

export const MyDecksView: React.FC<MyDecksViewProps> = ({
  currentItems,
  currentConfig,
  onOpenDeck,
  onOpenDeckSettings,
  onOpenSocialGenerator,
  onDownloadDeck,
  onNavigateTab,
  appTheme = 'dark',
}) => {
  const isAppLight = appTheme === 'light';
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSavingCurrent, setIsSavingCurrent] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckSubject, setNewDeckSubject] = useState('Biology');
  const [successMsg, setSuccessMsg] = useState('');

  const loadDecks = async () => {
    try {
      let decks = await db.questionDecks.toArray();
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
      decks.sort((a, b) => b.updatedAt - a.updatedAt);
      setSavedDecks(decks);
    } catch (err) {
      console.error('Failed to load decks from IndexedDB:', err);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    loadDecks();
  }, []);

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
      showTemporarySuccess('Current presentation saved to My Decks!');
    } catch (err) {
      console.error('Failed to save deck:', err);
      alert('Error saving deck to storage.');
    }
  };

  const handleDeleteDeck = async (deckId: string, deckName: string) => {
    if (window.confirm(`Are you sure you want to delete "${deckName}" from your decks?`)) {
      try {
        await db.questionDecks.delete(deckId);
        setSavedDecks(prev => prev.filter(d => d.id !== deckId));
        showTemporarySuccess(`Deleted deck "${deckName}"`);
      } catch (err) {
        console.error('Failed to delete deck:', err);
      }
    }
  };

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

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-6 lg:p-8 border flex flex-wrap items-center justify-between gap-6 ${
        isAppLight ? 'border-slate-200' : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25 flex items-center justify-center">
            <Library className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div>
            <h2 className={`text-xl lg:text-2xl font-black flex items-center gap-2 ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
              My Presentation Decks
              <span className={`text-sm px-2.5 py-0.5 rounded-full font-mono font-black border ${
                isAppLight ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {savedDecks.length} Decks
              </span>
            </h2>
            <p className={`text-sm mt-1 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Open any deck in Slide Studio, make social media posts, or download it as PPTX / PDF / PNG / ZIP.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('manual')}
            className="px-5 py-3 rounded-2xl border font-black text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-amber-500/25 hover:brightness-110"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Deck</span>
          </button>
          <button
            onClick={() => setIsSavingCurrent(prev => !prev)}
            className={`px-5 py-3 rounded-2xl border text-sm font-black flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
              isAppLight
                ? 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 hover:border-amber-400'
                : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-amber-500/40 hover:text-white'
            }`}
          >
            <FolderPlus className="w-4 h-4 text-amber-400" />
            <span>Save Current Deck</span>
          </button>
        </div>
      </div>

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

      {/* Save Current Deck Form */}
      {isSavingCurrent && (
        <form onSubmit={handleSaveCurrentDeck} className={`p-6 rounded-3xl border shadow-2xl space-y-4 animate-fadeIn ${
          isAppLight ? 'bg-white border-amber-300 shadow-amber-200/30' : 'bg-slate-900 border-amber-500/40 shadow-2xl'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${isAppLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <h3 className={`text-sm font-extrabold flex items-center gap-2 ${isAppLight ? 'text-amber-700' : 'text-amber-300'}`}>
              <FolderPlus className="w-4 h-4 text-amber-400" />
              Save Active Slide Presentation ({currentItems.length} Questions)
            </h3>
            <span className={`text-sm ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>Card will be added to My Decks</span>
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

      {/* Decks Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`text-base font-extrabold uppercase tracking-wider flex items-center gap-2 ${isAppLight ? 'text-slate-700' : 'text-slate-200'}`}>
            <Library className="w-5 h-5 text-amber-400" />
            Your Decks ({savedDecks.length})
          </h3>
          <span className={`text-sm ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Download or open any deck
          </span>
        </div>

        {!isLoaded ? (
          <div className={`flex items-center justify-center gap-2 py-16 text-sm font-bold ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading your decks...
          </div>
        ) : savedDecks.length === 0 ? (
          <div className={`text-center py-16 space-y-4 rounded-3xl border ${
            isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <Library className={`w-12 h-12 mx-auto stroke-[1.2] ${isAppLight ? 'text-slate-300' : 'text-slate-600'}`} />
            <p className={`text-base font-semibold ${isAppLight ? 'text-slate-500' : 'text-slate-400'}`}>
              No saved decks yet. Save your current presentation or create a new one.
            </p>
            <button
              onClick={() => onNavigateTab('manual')}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow cursor-pointer transition-all"
            >
              Create New Deck
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedDecks.map((deck) => (
              <DeckCard
                key={deck.id}
                id={deck.id}
                title={deck.name}
                badgeTag={deck.badgeTag || deck.subject || 'Presentation Deck'}
                questionCount={deck.items.length}
                items={deck.items}
                config={deck.config}
                lastUpdated={`Updated ${new Date(deck.updatedAt).toLocaleDateString()}`}
                subject={deck.subject}
                appTheme={appTheme}
                onOpen={() => onOpenDeck(deck.items, deck.name)}
                onSettings={() => onOpenDeckSettings(deck.items, deck.config, deck.id)}
                onSocial={() => onOpenSocialGenerator(deck.items)}
                onDownload={() => onDownloadDeck({ items: deck.items, config: deck.config })}
                downloadDisabled={deck.items.length === 0}
                downloadTitle={
                  deck.items.length === 0
                    ? 'This deck has no slides to export'
                    : `Download "${deck.name}" as PPTX / PDF / PNG / ZIP`
                }
                onExportJson={() => handleExportDeckJson(deck)}
                onDelete={() => handleDeleteDeck(deck.id, deck.name)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick action banner */}
      <div className={`p-6 rounded-3xl border flex flex-wrap items-center justify-between gap-4 ${
        isAppLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${isAppLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400'}`}>
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className={`text-sm font-extrabold ${isAppLight ? 'text-slate-900' : 'text-white'}`}>
              Got a question paper? Parse it with AI.
            </h4>
            <p className={`text-xs mt-0.5 ${isAppLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Upload a PDF or image and Gemini extracts the MCQs automatically into a new deck.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('ai')}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 cursor-pointer transition-all"
        >
          Open AI Parser
        </button>
      </div>
    </div>
  );
};
