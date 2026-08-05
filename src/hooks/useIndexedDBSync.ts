import { useEffect, useState, useRef, Dispatch, SetStateAction } from 'react';
import { db } from '../db/dexie';
import { DeckConfig, MCQItem } from '../types';

export function useIndexedDBSync(
  items: MCQItem[],
  setItems: Dispatch<SetStateAction<MCQItem[]>>,
  config: DeckConfig,
  setConfig: Dispatch<SetStateAction<DeckConfig>>
) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  // 1. On initial mount, load saved state from IndexedDB if present
  useEffect(() => {
    async function loadSavedState() {
      try {
        const saved = await db.savedState.get('current_deck');
        if (saved) {
          if (Array.isArray(saved.items) && saved.items.length > 0) {
            setItems(saved.items);
          }
          if (saved.config) {
            setConfig(prev => ({ ...prev, ...saved.config }));
          }
          if (saved.updatedAt) {
            setLastSavedTime(new Date(saved.updatedAt));
          }
        }
      } catch (err) {
        console.error('Failed to load deck from IndexedDB:', err);
      } finally {
        setIsLoaded(true);
      }
    }

    loadSavedState();
  }, []);

  // 2. Sync state to IndexedDB whenever items or config change (after initial load)
  useEffect(() => {
    if (!isLoaded) return;

    setIsSyncing(true);
    const timer = setTimeout(async () => {
      try {
        await db.savedState.put({
          id: 'current_deck',
          items,
          config,
          updatedAt: Date.now(),
        });
        setLastSavedTime(new Date());
      } catch (err) {
        console.error('Failed to save deck to IndexedDB:', err);
      } finally {
        setIsSyncing(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [items, config, isLoaded]);

  return { isLoaded, isSyncing, lastSavedTime };
}
