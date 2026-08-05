import Dexie, { Table } from 'dexie';
import { DeckConfig, MCQItem, SavedDeck } from '../types';

export interface SavedState {
  id: string; // 'current_deck'
  items: MCQItem[];
  config: DeckConfig;
  updatedAt: number;
}

export class MCQDeckDatabase extends Dexie {
  savedState!: Table<SavedState, string>;
  questionDecks!: Table<SavedDeck, string>;

  constructor() {
    super('MCQDeckStudioDB');
    this.version(2).stores({
      savedState: 'id, updatedAt',
      questionDecks: 'id, name, subject, createdAt, updatedAt',
    });
  }
}

export const db = new MCQDeckDatabase();

