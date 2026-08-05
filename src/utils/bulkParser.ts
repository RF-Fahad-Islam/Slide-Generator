import { MCQItem, MCQOption, QuestionType } from '../types';

/**
 * Smart Regex & Heuristic Parser for Bulk Text Paste of MCQs
 * Works 100% offline without API.
 */
export function parseBulkTextToMCQs(rawText: string): MCQItem[] {
  if (!rawText || !rawText.trim()) return [];

  // Split into candidate blocks by double newlines or numbered lines
  const rawBlocks = rawText.split(/\n\s*\n+/);
  const items: MCQItem[] = [];

  for (let blockIdx = 0; blockIdx < rawBlocks.length; blockIdx++) {
    const block = rawBlocks[blockIdx].trim();
    if (!block) continue;

    const parsed = parseSingleBlock(block, blockIdx + 1);
    if (parsed) {
      items.push(parsed);
    }
  }

  return items;
}

function parseSingleBlock(blockText: string, defaultNum: number): MCQItem | null {
  const lines = blockText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  let stem = '';
  let prompt = '';
  const romanItems: string[] = [];
  const options: MCQOption[] = [];
  let answerKey = '';
  let sourceTag = '';
  let explanation = '';

  // Patterns
  const romanRegex = /^(?:i|ii|iii|iv|v|১|২|৩)\.?\s+(.+)$/i;
  const optionRegex = /^(?:([A-D|a-d|ক-ঘ|1-4])[\.\)\:-]|(?:(?:Option\s+)?([A-D|ক-ঘ])))\s*(.+)$/i;
  const answerRegex = /^(?:Ans(?:wer)?|উত্তর|উঃ|Sol(?:ution)?)\s*[:=\-]?\s*([A-D|a-d|ক-ঘ|1-4]|\(?i+\)?)/i;
  const sourceRegex = /^[\[\(\{](.+?)[\]\)\} ]$/;

  let isReadingOptions = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check Answer Line
    const ansMatch = line.match(answerRegex);
    if (ansMatch) {
      answerKey = normalizeKey(ansMatch[1]);
      continue;
    }

    // Check Source Tag Line e.g. [ঢাকা বোর্ড ২০২৪]
    const sourceMatch = line.match(sourceRegex);
    if (sourceMatch && !sourceMatch[1].match(/^(A|B|C|D|ক|খ|গ|ঘ)$/i)) {
      sourceTag = sourceMatch[1];
      continue;
    }

    // Check Option Line
    // Also check for trailing asterisk indicating correct answer e.g. "B) cos(x) *"
    const hasAsterisk = line.endsWith('*') || line.endsWith('(correct)');
    const cleanLine = line.replace(/[\*]|(\(correct\))$/i, '').trim();

    const optMatch = cleanLine.match(optionRegex);
    if (optMatch) {
      isReadingOptions = true;
      const keyRaw = optMatch[1] || optMatch[2];
      const key = normalizeKey(keyRaw);
      const text = optMatch[3].trim();

      options.push({
        key,
        text,
        isCorrect: hasAsterisk,
      });

      if (hasAsterisk) {
        answerKey = key;
      }
      continue;
    }

    // Check Roman Statement Line e.g. "i. ইউরেটেরোস্কোপিক"
    const romanMatch = line.match(romanRegex);
    if (romanMatch && !isReadingOptions) {
      romanItems.push(line); // keep whole line or content
      continue;
    }

    // Check Prompt Line e.g. "নিচের কোনটি সঠিক?"
    if (line.includes('নিচের কোনটি সঠিক') || line.toLowerCase().includes('which of the following') || line.includes('কোনটি সঠিক?')) {
      prompt = line;
      continue;
    }

    // Explanation line
    if (line.toLowerCase().startsWith('exp:') || line.startsWith('ব্যাখ্যা:') || line.startsWith('Explanation:')) {
      explanation = line.replace(/^(exp:|ব্যাখ্যা:|explanation:)/i, '').trim();
      continue;
    }

    // Otherwise, append to stem
    if (!isReadingOptions) {
      if (stem) stem += ' ' + line;
      else stem = line;
    }
  }

  // Strip leading question numbers e.g. "১. বৃক্কের কাজ কোনটি?" -> "বৃক্কের কাজ কোনটি?"
  stem = stem.replace(/^(?:\d+|[০-৯]+)[\.\)\:-]\s*/, '').trim();

  // Determine question type
  let questionType: QuestionType = 'standard';
  if (romanItems.length > 0) {
    questionType = 'roman_statements';
  }

  // Ensure options have default keys if missing
  const defaultKeys = ['A', 'B', 'C', 'D'];
  const banglaKeys = ['ক', 'খ', 'গ', 'ঘ'];

  // Detect if options use Bangla keying
  const usesBangla = options.some(o => ['ক', 'খ', 'গ', 'ঘ'].includes(o.key));
  const keySet = usesBangla ? banglaKeys : defaultKeys;

  if (options.length === 0) {
    // If block failed to parse cleanly, return a draft standard item with the raw text in stem
    return {
      id: `mcq_${Date.now()}_${defaultNum}`,
      questionType: 'standard',
      stem: stem || blockText,
      options: [
        { key: keySet[0], text: 'Option 1' },
        { key: keySet[1], text: 'Option 2' },
        { key: keySet[2], text: 'Option 3' },
        { key: keySet[3], text: 'Option 4' },
      ],
      answer: keySet[0],
      source: sourceTag,
      confidence: 'low',
      warnings: ['Could not detect options automatically. Please check layout.'],
    };
  }

  // Ensure 4 options
  while (options.length < 4) {
    const nextIdx = options.length;
    options.push({
      key: keySet[nextIdx] || `Opt ${nextIdx + 1}`,
      text: `Option ${nextIdx + 1}`,
    });
  }

  // Match answer key
  if (answerKey) {
    const matchedOpt = options.find(o => o.key.toLowerCase() === answerKey.toLowerCase());
    if (matchedOpt) {
      matchedOpt.isCorrect = true;
    }
  } else {
    // Default first option or marked option
    const correctOpt = options.find(o => o.isCorrect);
    if (correctOpt) {
      answerKey = correctOpt.key;
    } else {
      answerKey = options[0].key;
      options[0].isCorrect = true;
    }
  }

  return {
    id: `mcq_${Date.now()}_${defaultNum}_${Math.random().toString(36).substr(2, 4)}`,
    questionType,
    stem: stem || `Question ${defaultNum}`,
    romanItems: romanItems.length > 0 ? romanItems : undefined,
    prompt: prompt || (romanItems.length > 0 ? 'নিচের কোনটি সঠিক?' : undefined),
    options,
    answer: answerKey,
    source: sourceTag || undefined,
    explanation: explanation || undefined,
    confidence: options.length === 4 ? 'high' : 'low',
  };
}

function normalizeKey(rawKey: string): string {
  if (!rawKey) return 'A';
  const k = rawKey.trim().toUpperCase();
  if (['K', 'ক', '1', 'A'].includes(k)) return 'A';
  if (['KH', 'খ', '2', 'B'].includes(k)) return 'B';
  if (['G', 'গ', '3', 'C'].includes(k)) return 'C';
  if (['GH', 'ঘ', '4', 'D'].includes(k)) return 'D';
  return k;
}

/**
 * Pre-populated Sample Data Sets for Instant Testing
 */
export const SAMPLE_DECKS: { name: string; description: string; items: MCQItem[] }[] = [
  {
    name: 'জীববিজ্ঞান (Bangla Bohupodi & Standard)',
    description: 'Includes multi-statement (i, ii, iii) & standard MCQs with board sources.',
    items: [
      {
        id: 'sample_1',
        questionType: 'roman_statements',
        stem: 'বৃক্কের পাথর অপসারণে আধুনিক পদ্ধতি—',
        romanItems: [
          'i. ইউরেটেরোস্কোপিক',
          'ii. আল্ট্রাসনিক লিথোট্রিপসি',
          'iii. অস্ত্রোপচার'
        ],
        prompt: 'নিচের কোনটি সঠিক?',
        options: [
          { key: 'ক', text: 'i ও ii' },
          { key: 'খ', text: 'ii ও iii', isCorrect: true },
          { key: 'গ', text: 'i ও iii' },
          { key: 'ঘ', text: 'i, ii ও iii' }
        ],
        answer: 'খ',
        source: 'চট্টগ্রাম বোর্ড ২০১৭',
        explanation: 'আধুনিক অ-অস্ত্রোপচার পদ্ধতিতে আল্ট্রাসনিক লিথোট্রিপসি ও ইউরেটেরোস্কোপির মাধ্যমে শক ওয়েভ ব্যবহার করে বৃক্কের পাথর গুঁড়ো করা হয়।'
      },
      {
        id: 'sample_2',
        questionType: 'standard',
        stem: 'মানবদেহের বৃক্কে নেফ্রনের প্রধান কাজ কোনটি?',
        options: [
          { key: 'ক', text: 'রক্ত ছাঁকন ও মূত্র তৈরি', isCorrect: true },
          { key: 'খ', text: 'পিত্তরস নিঃসরণ' },
          { key: 'গ', text: 'ইনসুলিন তৈরি' },
          { key: 'ঘ', text: 'হরমোন পরিহন' }
        ],
        answer: 'ক',
        source: 'ঢাকা বোর্ড ২০২৪',
        explanation: 'নেফ্রন হলো বৃক্কের গঠনগত ও কার্যগত একক যা রক্ত থেকে নাইট্রোজেনঘটিত বর্জ্য ছেঁকে মূত্র উৎপন্ন করে।'
      },
      {
        id: 'sample_3',
        questionType: 'standard',
        stem: 'কোন অণুটি কোষের শক্তি মুদ্রা (Energy Currency) হিসেবে পরিচিত?',
        options: [
          { key: 'ক', text: 'DNA' },
          { key: 'খ', text: 'RNA' },
          { key: 'গ', text: 'ATP', isCorrect: true },
          { key: 'ঘ', text: 'NADP' }
        ],
        answer: 'গ',
        source: 'রাজশাহী বোর্ড ২০২৩',
        explanation: 'ATP (Adenosine Triphosphate) কোষে শক্তি সঞ্চয় ও সর্বরাহের কাজ করে বলে একে জৈব মুদ্রা বা শক্তি মুদ্রা বলা হয়।'
      }
    ]
  },
  {
    name: 'Physics & Math (LaTeX Math Formulas)',
    description: 'Features KaTeX equations like calculus, calculus derivatives & vectors.',
    items: [
      {
        id: 'math_1',
        questionType: 'standard',
        stem: 'যদি $f(x) = x^3 - 3x^2 + 4$ হয়, তবে $f\'(x) = 0$ সমীকরণের মূলদ্বয় কত?',
        options: [
          { key: 'A', text: '$x = 0, 2$', isCorrect: true },
          { key: 'B', text: '$x = 1, 3$' },
          { key: 'C', text: '$x = -1, 2$' },
          { key: 'D', text: '$x = 0, -2$' }
        ],
        answer: 'A',
        source: 'DU Admission 2022',
        explanation: '$f\'(x) = 3x^2 - 6x = 3x(x - 2) = 0 \\implies x = 0, 2$'
      },
      {
        id: 'math_2',
        questionType: 'standard',
        stem: 'What is the value of $\\lim_{x \\to 0} \\frac{\\sin(3x)}{x}$?',
        options: [
          { key: 'A', text: '$0$' },
          { key: 'B', text: '$1$' },
          { key: 'C', text: '$3$', isCorrect: true },
          { key: 'D', text: 'Undefined' }
        ],
        answer: 'C',
        source: 'BUET Admission 2021',
        explanation: '$\\lim_{x \\to 0} \\frac{\\sin(3x)}{x} = 3 \\cdot \\lim_{x \\to 0} \\frac{\\sin(3x)}{3x} = 3 \\cdot 1 = 3$'
      }
    ]
  }
];
