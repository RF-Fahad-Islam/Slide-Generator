import { MCQItem, DeckConfig } from '../types';

export interface AnswerKeyEntry {
  questionNumber: number;
  answerKey: string; // 'A' | 'B' | 'C' | 'D' or 'ক' | 'খ' | 'গ' | 'ঘ'
  answerText: string;
  stemSnippet: string;
  hasExplanation: boolean;
}

export interface AnswerKeyPage {
  pageIndex: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  entries: AnswerKeyEntry[];
}

/**
 * Bangla option key mapper: A->ক, B->খ, C->গ, D->ঘ
 */
export function getBanglaOptionKey(key: string): string {
  const normalized = key.trim().toUpperCase();
  switch (normalized) {
    case 'A':
    case '1':
    case 'ক':
      return 'ক';
    case 'B':
    case '2':
    case 'খ':
      return 'খ';
    case 'C':
    case '3':
    case 'গ':
      return 'গ';
    case 'D':
    case '4':
    case 'ঘ':
      return 'ঘ';
    default:
      return key;
  }
}

/**
 * Splits deck items into paginated answer key pages (default 20 items per page).
 */
export function chunkAnswerKeyPages(items: MCQItem[], itemsPerPage: number = 20): AnswerKeyPage[] {
  if (!items || items.length === 0) return [];

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const pages: AnswerKeyPage[] = [];

  for (let i = 0; i < totalPages; i++) {
    const startIndex = i * itemsPerPage;
    const pageItems = items.slice(startIndex, startIndex + itemsPerPage);
    const entries: AnswerKeyEntry[] = pageItems.map((item, idx) => {
      const qNum = startIndex + idx + 1;
      const correctKey = item.answer || (item.options && item.options[0]?.key) || 'A';
      const banglaKey = getBanglaOptionKey(correctKey);
      
      // Find matching option text
      const matchedOpt = item.options?.find(
        (o) => o.key.toUpperCase() === correctKey.toUpperCase() || getBanglaOptionKey(o.key) === banglaKey
      );
      const answerText = matchedOpt ? matchedOpt.text : '';

      return {
        questionNumber: qNum,
        answerKey: banglaKey,
        answerText,
        stemSnippet: item.stem ? item.stem.replace(/<[^>]*>?/gm, '').slice(0, 40) : `প্রশ্ন ${qNum}`,
        hasExplanation: !!item.explanation && item.explanation.trim().length > 0,
      };
    });

    pages.push({
      pageIndex: i,
      totalPages,
      startIndex: startIndex + 1,
      endIndex: startIndex + pageItems.length,
      entries,
    });
  }

  return pages;
}
