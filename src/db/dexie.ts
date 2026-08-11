import Dexie, { Table } from 'dexie';
import { DeckConfig, MCQItem, SavedDeck, Workspace } from '../types';

export interface SavedState {
  id: string; // 'current_deck'
  items: MCQItem[];
  config: DeckConfig;
  updatedAt: number;
}

export class MCQDeckDatabase extends Dexie {
  savedState!: Table<SavedState, string>;
  questionDecks!: Table<SavedDeck, string>;
  workspaces!: Table<Workspace, string>;

  constructor() {
    super('MCQDeckStudioDB');
    this.version(2).stores({
      savedState: 'id, updatedAt',
      questionDecks: 'id, name, subject, createdAt, updatedAt',
    });
    this.version(3).stores({
      savedState: 'id, updatedAt',
      questionDecks: 'id, name, subject, createdAt, updatedAt',
      workspaces: 'id, name, createdAt, updatedAt',
    });
  }
}

export const db = new MCQDeckDatabase();

