import { MCQItem, getSourceTags } from '../types';

/**
 * Tag memory — persists every used source tag / subject / class / paper value to
 * localStorage so the next session can suggest them in chip pickers. Pure module,
 * no React. The reactive `useTagMemory` hook lives in `src/hooks/useTagMemory.ts`.
 */

export interface TagMemory {
  sources: string[];
  subjects: string[];
  classes: string[];
  papers: string[];
}

export interface RememberTagInput {
  sources?: string[];
  subject?: string;
  className?: string;
  paper?: string;
}

const STORAGE_KEY = 'mcqgen.tagMemory';
const MAX_ENTRIES = 60;

// Sensible seed suggestions so a fresh session has something to offer.
const DEFAULTS: TagMemory = {
  sources: ['ঢাকা বোর্ড ২০২৪', 'চট্টগ্রাম বোর্ড ২০১৭', 'রাজশাহী বোর্ড ২০২৩', 'DU Admission 2022', 'BUET Admission 2021'],
  subjects: ['Biology', 'Physics', 'Chemistry', 'Math', 'Higher Math', 'জীববিজ্ঞান'],
  classes: ['SSC', 'HSC', 'Class 9', 'Class 10'],
  papers: ['1st Paper', '2nd Paper'],
};

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const trimmed = v.trim();
    const key = trimmed.toLowerCase();
    if (!key) continue;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(trimmed);
    }
  }
  return out;
}

function persist(mem: TagMemory): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mem));
  } catch {
    // storage unavailable (private mode etc.) — suggestions just won't persist
  }
}

export function loadTagMemory(): TagMemory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS, sources: [...DEFAULTS.sources] };
    const parsed = JSON.parse(raw) as Partial<TagMemory>;
    return {
      sources: dedupe([...DEFAULTS.sources, ...(parsed.sources ?? [])]),
      subjects: dedupe([...DEFAULTS.subjects, ...(parsed.subjects ?? [])]),
      classes: dedupe([...DEFAULTS.classes, ...(parsed.classes ?? [])]),
      papers: dedupe([...DEFAULTS.papers, ...(parsed.papers ?? [])]),
    };
  } catch {
    return { ...DEFAULTS, sources: [...DEFAULTS.sources] };
  }
}

export function clearTagMemory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Records new tag values (merged, newest first) and persists the updated memory.
 * Returns the fresh memory so callers can sync their state immediately.
 */
export function rememberTagValues(input: RememberTagInput): TagMemory {
  const mem = loadTagMemory();
  const next: TagMemory = {
    sources: dedupe([...(input.sources ?? []), ...mem.sources]).slice(0, MAX_ENTRIES),
    subjects: dedupe([
      ...(input.subject ? [input.subject] : []),
      ...mem.subjects,
    ]).slice(0, MAX_ENTRIES),
    classes: dedupe([
      ...(input.className ? [input.className] : []),
      ...mem.classes,
    ]).slice(0, MAX_ENTRIES),
    papers: dedupe([
      ...(input.paper ? [input.paper] : []),
      ...mem.papers,
    ]).slice(0, MAX_ENTRIES),
  };
  persist(next);
  return next;
}

/** Records every tag carried by the given questions. */
export function rememberTagsFromItems(items: MCQItem[]): TagMemory {
  if (items.length === 0) return loadTagMemory();
  let mem = loadTagMemory();
  for (const item of items) {
    mem = rememberTagValues({
      sources: getSourceTags(item),
      subject: item.tags?.subject,
      className: item.tags?.className,
      paper: item.tags?.paper,
    });
  }
  return mem;
}

/**
 * Merges a batch tag set (bulk-paste panel) onto a parsed MCQ. Batch values fill in
 * gaps only — per-question tags parsed from the text (e.g. `[ঢাকা বোর্ড ২০২৪]`,
 * `subject:` lines) keep priority. Source tags are unioned.
 */
export function applyBatchTags<T extends MCQItem>(
  item: T,
  batch: { sources?: string[]; subject?: string; className?: string; paper?: string }
): T {
  const existingSources = getSourceTags(item);
  const mergedSources = dedupe([...existingSources, ...(batch.sources ?? [])]);
  return {
    ...item,
    source: mergedSources.length > 0 ? mergedSources : undefined,
    tags: {
      subject: item.tags?.subject || batch.subject || undefined,
      className: item.tags?.className || batch.className || undefined,
      paper: item.tags?.paper || batch.paper || undefined,
    },
  };
}
