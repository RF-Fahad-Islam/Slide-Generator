import { MCQItem, MCQOption, QuestionType } from '../types';

export interface CSVParseResult {
  items: MCQItem[];
  errors: { row: number; message: string }[];
}

/**
 * Parses CSV text into MCQItems
 * Header support: stem, type, A, B, C, D, correct, explanation, source
 */
export function parseCSVToMCQs(csvText: string): CSVParseResult {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  const result: CSVParseResult = { items: [], errors: [] };

  if (lines.length < 2) {
    result.errors.push({ row: 0, message: 'CSV file is empty or missing headers.' });
    return result;
  }

  // Parse header
  const header = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  const stemIdx = header.findIndex(h => h.includes('stem') || h.includes('question') || h.includes('প্রশ্ন'));
  const typeIdx = header.findIndex(h => h.includes('type'));
  const aIdx = header.findIndex(h => h === 'a' || h.includes('opt1') || h === 'ক');
  const bIdx = header.findIndex(h => h === 'b' || h.includes('opt2') || h === 'খ');
  const cIdx = header.findIndex(h => h === 'c' || h.includes('opt3') || h === 'গ');
  const dIdx = header.findIndex(h => h === 'd' || h.includes('opt4') || h === 'ঘ');
  const correctIdx = header.findIndex(h => h.includes('correct') || h.includes('answer') || h.includes('উত্তর'));
  const expIdx = header.findIndex(h => h.includes('exp') || h.includes('explanation') || h.includes('ব্যাখ্যা'));
  const sourceIdx = header.findIndex(h => h.includes('source') || h.includes('board') || h.includes('বোর্ড'));

  if (stemIdx === -1) {
    result.errors.push({ row: 0, message: 'Could not find "stem" or "question" column in header.' });
    return result;
  }

  for (let rowIdx = 1; rowIdx < lines.length; rowIdx++) {
    const cols = parseCSVLine(lines[rowIdx]);
    if (cols.length === 0) continue;

    const stem = cols[stemIdx] ? cols[stemIdx].trim() : '';
    if (!stem) {
      result.errors.push({ row: rowIdx + 1, message: 'Row skipped: Question stem is empty.' });
      continue;
    }

    const typeRaw = typeIdx !== -1 && cols[typeIdx] ? cols[typeIdx].trim().toLowerCase() : 'standard';
    const qType: QuestionType = typeRaw.includes('roman') || typeRaw.includes('statement') ? 'roman_statements' : 'standard';

    const optA = aIdx !== -1 && cols[aIdx] ? cols[aIdx].trim() : 'Option 1';
    const optB = bIdx !== -1 && cols[bIdx] ? cols[bIdx].trim() : 'Option 2';
    const optC = cIdx !== -1 && cols[cIdx] ? cols[cIdx].trim() : 'Option 3';
    const optD = dIdx !== -1 && cols[dIdx] ? cols[dIdx].trim() : 'Option 4';

    const correctRaw = correctIdx !== -1 && cols[correctIdx] ? cols[correctIdx].trim().toUpperCase() : 'A';
    const exp = expIdx !== -1 && cols[expIdx] ? cols[expIdx].trim() : undefined;
    const source = sourceIdx !== -1 && cols[sourceIdx] ? cols[sourceIdx].trim() : undefined;

    // Determine option keying (Bangla vs English)
    const usesBangla = ['ক', 'খ', 'গ', 'ঘ'].includes(correctRaw);
    const keys = usesBangla ? ['ক', 'খ', 'গ', 'ঘ'] : ['A', 'B', 'C', 'D'];

    let mappedCorrect = correctRaw;
    if (correctRaw === '1' || correctRaw === 'A' || correctRaw === 'ক') mappedCorrect = keys[0];
    else if (correctRaw === '2' || correctRaw === 'B' || correctRaw === 'খ') mappedCorrect = keys[1];
    else if (correctRaw === '3' || correctRaw === 'C' || correctRaw === 'গ') mappedCorrect = keys[2];
    else if (correctRaw === '4' || correctRaw === 'D' || correctRaw === 'ঘ') mappedCorrect = keys[3];

    const options: MCQOption[] = [
      { key: keys[0], text: optA, isCorrect: mappedCorrect === keys[0] },
      { key: keys[1], text: optB, isCorrect: mappedCorrect === keys[1] },
      { key: keys[2], text: optC, isCorrect: mappedCorrect === keys[2] },
      { key: keys[3], text: optD, isCorrect: mappedCorrect === keys[3] },
    ];

    result.items.push({
      id: `csv_mcq_${Date.now()}_${rowIdx}`,
      questionType: qType,
      stem,
      options,
      answer: mappedCorrect,
      source,
      explanation: exp,
      confidence: 'high',
    });
  }

  return result;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

export function generateSampleCSV(): string {
  return `stem,type,A,B,C,D,correct,explanation,source
"মানবদেহের বৃক্কে নেফ্রনের প্রধান কাজ কোনটি?",standard,"রক্ত ছাঁকন ও মূত্র তৈরি","পিত্তরস নিঃসরণ","ইনসুলিন তৈরি","হরমোন পরিহন",ক,"নেফ্রন হলো বৃর্কের গঠনগত ও কার্যগত একক","ঢাকা বোর্ড ২০২৪"
"যদি $f(x) = x^3 - 3x^2 + 4$ হয়, তবে $f'(x) = 0$ এর মূলদ্বয় কত?",standard,"$x = 0, 2","$x = 1, 3","$x = -1, 2","$x = 0, -2",A,"$f'(x) = 3x^2 - 6x = 0 \\implies x = 0, 2$","DU Admission 2022"`;
}
