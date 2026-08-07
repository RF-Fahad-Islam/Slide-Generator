import { MCQItem } from '../types';

// ---------------------------------------------------------------------------
// MCQ JSON import / export helpers — used by the Question Bank (JSON import)
// and the Export modal ("Extract MCQs (.json)").
// ---------------------------------------------------------------------------

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
