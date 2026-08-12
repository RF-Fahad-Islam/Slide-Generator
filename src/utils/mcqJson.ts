import { MCQItem, DeckConfig } from '../types';

// ---------------------------------------------------------------------------
// MCQ JSON import / export helpers — used by the Question Bank (JSON import),
// My Decks (Deck Package Backup/Restore), and Export Modal.
// ---------------------------------------------------------------------------

export interface FullDeckPackage {
  version: '2.0';
  type: 'slide_deck_package';
  name: string;
  subject?: string;
  description?: string;
  badgeTag?: string;
  createdAt?: number;
  updatedAt?: number;
  config: DeckConfig;
  items: MCQItem[];
}

const sanitizeOption = (raw: any): { key: string; text: string; isCorrect?: boolean } => {
  if (!raw) return { key: 'A', text: '' };
  if (typeof raw === 'string') return { key: 'A', text: raw };
  const key = String(raw.key ?? raw.label ?? 'A');
  const text = String(raw.text ?? raw.value ?? raw.option ?? '');
  return { key, text, isCorrect: !!raw.isCorrect };
};

export const normalizeMCQ = (raw: any, idx: number): MCQItem | null => {
  if (!raw || typeof raw !== 'object') return null;
  const stem = String(raw.stem ?? raw.question ?? raw.text ?? raw.q ?? '');
  if (!stem.trim()) return null;

  const rawOptions = Array.isArray(raw.options) ? raw.options : [];
  const options = rawOptions.map(sanitizeOption);
  if (options.length === 0) return null;

  const correctKey = String(raw.answer ?? raw.correct ?? raw.answerKey ?? raw.correctOption ?? '').trim();
  const answer = correctKey || options.find((o) => o.isCorrect)?.key || '';

  return {
    id: raw.id ? String(raw.id) : `q_${Date.now().toString(36)}_${idx}`,
    questionType: ['standard', 'roman_statements', 'passage'].includes(raw.questionType)
      ? raw.questionType
      : 'standard',
    stem,
    stemType: raw.stemType,
    stemImage: raw.stemImage ? String(raw.stemImage) : undefined,
    passage: raw.passage ? String(raw.passage) : undefined,
    romanItems: Array.isArray(raw.romanItems) ? raw.romanItems.map(String) : undefined,
    prompt: raw.prompt ? String(raw.prompt) : undefined,
    options,
    answer,
    source: raw.source
      ? Array.isArray(raw.source)
        ? raw.source.map(String).filter(Boolean)
        : [String(raw.source)]
      : undefined,
    explanation: raw.explanation ? String(raw.explanation) : undefined,
    customConfig: raw.customConfig && typeof raw.customConfig === 'object' ? raw.customConfig : undefined,
    tags: raw.tags && typeof raw.tags === 'object' ? raw.tags : undefined,
  };
};

// Accepts many common shapes: MCQItem[], { items: [] }, { questions: [] },
// { config, items }, { data: [] }, { mcqs: [] }, { questionBank: [] }.
export const normalizeMCQs = (raw: unknown): MCQItem[] => {
  let list: any[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === 'object') {
    const obj = raw as any;
    if (Array.isArray(obj.items)) list = obj.items;
    else if (Array.isArray(obj.questions)) list = obj.questions;
    else if (Array.isArray(obj.data)) list = obj.data;
    else if (Array.isArray(obj.mcqs)) list = obj.mcqs;
    else if (Array.isArray(obj.questionBank)) list = obj.questionBank;
  }
  return list
    .map((item, idx) => normalizeMCQ(item, idx))
    .filter((q): q is MCQItem => q !== null);
};

export const downloadJSON = (data: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Packages a complete slide deck (config, custom slide layouts, and items) into an exact JSON backup file.
 */
export const exportFullDeckPackage = (
  deck: {
    name: string;
    subject?: string;
    description?: string;
    badgeTag?: string;
    config: DeckConfig;
    items: MCQItem[];
  },
  customFilename?: string
) => {
  const pkg: FullDeckPackage = {
    version: '2.0',
    type: 'slide_deck_package',
    name: deck.name || 'Slide Deck',
    subject: deck.subject,
    description: deck.description,
    badgeTag: deck.badgeTag || deck.config?.badgeTag,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    config: deck.config,
    items: deck.items,
  };

  const safeTitle = (deck.name || 'Deck').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  const filename = customFilename || `${safeTitle}_full_deck.json`;
  downloadJSON(pkg, filename);
};

/**
 * Parses an uploaded JSON payload into a full deck package (config, items, metadata).
 */
export const parseFullDeckPackage = (
  raw: unknown,
  fallbackConfig: DeckConfig
): {
  name: string;
  subject?: string;
  description?: string;
  badgeTag?: string;
  config: DeckConfig;
  items: MCQItem[];
} | null => {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as any;

  const items = normalizeMCQs(obj);
  if (items.length === 0) return null;

  const name = String(obj.name || obj.deckName || obj.title || 'Imported Slide Deck');
  const subject = obj.subject ? String(obj.subject) : undefined;
  const description = obj.description ? String(obj.description) : undefined;
  const badgeTag = obj.badgeTag ? String(obj.badgeTag) : undefined;

  let config: DeckConfig = { ...fallbackConfig };
  if (obj.config && typeof obj.config === 'object') {
    config = {
      ...fallbackConfig,
      ...obj.config,
    };
  }

  return {
    name,
    subject,
    description,
    badgeTag,
    config,
    items,
  };
};
