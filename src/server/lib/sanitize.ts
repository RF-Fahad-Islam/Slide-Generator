import type { MCQItem, QuestionType } from '../../types.js';

const BANGLA_DIGITS: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

export function normalizeBanglaNumerals(input: string): string {
  return input.replace(/[০-৯]/g, (d) => BANGLA_DIGITS[d] ?? d);
}

export interface SanitizeResult {
  items: MCQItem[];
  skipped: number;
  errors: string[];
}

let idCounter = 0;

export function sanitizeMCQs(rawQuestions: unknown[], startIndex = 0): SanitizeResult {
  if (!Array.isArray(rawQuestions)) {
    return { items: [], skipped: 0, errors: ['AI returned a non-array result for this chunk.'] };
  }

  const items: MCQItem[] = [];
  let skipped = 0;
  const errors: string[] = [];

  rawQuestions.forEach((raw, idx) => {
    const q = (raw ?? {}) as Record<string, unknown>;
    const options = Array.isArray(q.options) ? (q.options as Record<string, unknown>[]) : [];

    const validOptions = options
      .map((opt, oi) => ({
        key: String(normalizeBanglaNumerals(String(opt.key ?? String.fromCharCode(65 + oi)))),
        text: String(opt.text ?? '').trim(),
        isCorrect: opt.isCorrect === true || opt.isCorrect === 'true',
      }))
      .filter((o) => o.text.length > 0);

    if (validOptions.length < 2) {
      skipped += 1;
      errors.push(`Chunk ${startIndex + 1}, item ${idx + 1}: fewer than 2 usable options — skipped.`);
      return;
    }

    const stem = String(q.stem ?? '').trim();
    if (!stem) {
      skipped += 1;
      errors.push(`Chunk ${startIndex + 1}, item ${idx + 1}: missing stem — skipped.`);
      return;
    }

    const rawType = String(q.questionType ?? '');
    const hasRoman = Array.isArray(q.romanItems) && (q.romanItems as unknown[]).length > 0;
    const questionType: QuestionType =
      rawType === 'roman_statements' || rawType === 'passage'
        ? (rawType as QuestionType)
        : hasRoman
          ? 'roman_statements'
          : 'standard';

    const rawAnswer = normalizeBanglaNumerals(String(q.answer ?? '').trim());
    const answerKeys = validOptions.map((o) => o.key);
    let answer = answerKeys.includes(rawAnswer) ? rawAnswer : rawAnswer.toUpperCase();
    if (!answerKeys.includes(answer) && answerKeys.length > 0) {
      answer = answerKeys[0];
    }

    idCounter += 1;
    items.push({
      id: `ai_mcq_${Date.now()}_${startIndex + 1}_${idx}_${idCounter}_${Math.random().toString(36).substr(2, 4)}`,
      questionType,
      stem,
      romanItems: Array.isArray(q.romanItems)
        ? (q.romanItems as unknown[]).map((r) => String(r)).filter((r) => r.trim())
        : undefined,
      prompt: q.prompt ? String(q.prompt).trim() : hasRoman ? 'নিচের কোনটি সঠিক?' : undefined,
      options: validOptions,
      answer,
      source: q.source ? String(q.source).trim() : undefined,
      explanation: q.explanation ? String(q.explanation).trim() : undefined,
      confidence: q.confidence === 'low' ? 'low' : 'high',
    });
  });

  return { items, skipped, errors };
}
