import { MCQItem, MCQOption, MCQTags, QuestionType } from '../types';

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
  const sourceTags: string[] = [];
  let explanation = '';
  let tags: MCQTags = {};

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
      const tag = sourceMatch[1].trim();
      if (tag && !sourceTags.includes(tag)) {
        sourceTags.push(tag);
      }
      continue;
    }

    // Tags line: subject: <value>, class: <value>, paper: <value>.
    // MUST run before the option check — `class:` starts with "c" which the
    // option regex would otherwise read as option key "C".
    const subjectMatch = line.match(/^subject:\s*(.+)$/i);
    if (subjectMatch) {
      tags = { ...tags, subject: subjectMatch[1].trim() };
      continue;
    }
    const classNameMatch = line.match(/^class:\s*(.+)$/i);
    if (classNameMatch) {
      tags = { ...tags, className: classNameMatch[1].trim() };
      continue;
    }
    const paperMatch = line.match(/^paper:\s*(.+)$/i);
    if (paperMatch) {
      tags = { ...tags, paper: paperMatch[1].trim() };
      continue;
    }

    // Check Option Line
    // Also check for trailing asterisk indicating correct answer e.g. "B) cos(x) *"
    const hasAsterisk = line.endsWith('*') || line.endsWith('(correct)');
    const cleanLine = line.replace(/[\*]|(\(correct\))$/i, '').trim();

    const optMatch = cleanLine.match(optionRegex);
    if (optMatch) {
      const keyRaw = optMatch[1] || optMatch[2];
      const key = normalizeKey(keyRaw);
      const isNumericKey = /^[1-4]$/.test(keyRaw || '');
      // "1. What is the capital of France?" is a numbered QUESTION line, not an
      // option — numeric keys only count as options once the options section has
      // begun, or when the line clearly isn't a question (first line of a block
      // is the stem, and question lines end in "?").
      const isNumberedQuestion = isNumericKey && !isReadingOptions && (i === 0 || /[?؟]\s*$/.test(line));
      if (!isNumberedQuestion) {
        isReadingOptions = true;
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
    }

    // Check Roman Statement Line e.g. "i. ইউরেটেরোস্কোপিক"
    const romanMatch = line.match(romanRegex);
    if (romanMatch && !isReadingOptions && stem && !/[?؟]\s*$/.test(line)) {
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
      source: sourceTags.length > 0 ? sourceTags : undefined,
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
    // Only honor an explicitly-marked option — never default to the first one.
    // Removing the "*" must remove the answer mark (option 0 stays unmarked).
    const correctOpt = options.find(o => o.isCorrect);
    if (correctOpt) {
      answerKey = correctOpt.key;
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
    source: sourceTags.length > 0 ? sourceTags : undefined,
    explanation: explanation || undefined,
    tags,
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
        source: ['চট্টগ্রাম বোর্ড ২০১৭'],
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
        source: ['ঢাকা বোর্ড ২০২৪'],
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
        source: ['রাজশাহী বোর্ড ২০২৩'],
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
        source: ['DU Admission 2022'],
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
        source: ['BUET Admission 2021'],
        explanation: '$\\lim_{x \\to 0} \\frac{\\sin(3x)}{x} = 3 \\cdot \\lim_{x \\to 0} \\frac{\\sin(3x)}{3x} = 3 \\cdot 1 = 3$'
      }
    ]
  },
  {
    name: 'উচ্চতর গণিত (Matrices, Integrals & Calculus)',
    description: 'Features 10 Higher Secondary Math MCQs with Matrices, Determinants, Calculus & Trigonometry.',
    items: [
      {
        id: 'hsc_math_1',
        questionType: 'standard',
        stem: '$A=\\begin{bmatrix}a&2&5\\\\ -2&b&-3\\\\ -5&3&c\\end{bmatrix}$ একটি বক্র প্রতিসম ম্যাট্রিক্স হলে a, b, c এর মানগুলো-',
        options: [
          { key: 'A', text: '-2, -5, 3' },
          { key: 'B', text: '0, 0, 0', isCorrect: true },
          { key: 'C', text: '1, 1, 1' },
          { key: 'D', text: '2, 5, 3' }
        ],
        answer: 'B',
        source: ['17-18'],
        explanation: 'বক্র প্রতিসম Matrix এর শর্ত হয় $A^{T}=-A$ এক্ষেত্রে $a_{ij}=0$ যখন $i=j$ অর্থাৎ কর্ণের উপাদানগুলো শূন্য হতে হবে। $\\therefore a=0, b=0, c=0$'
      },
      {
        id: 'hsc_math_2',
        questionType: 'standard',
        stem: '$\\begin{vmatrix}\\alpha&\\alpha&x\\\\ \\beta&\\beta&\\beta\\\\ 0&x&\\theta\\end{vmatrix}=0$ হলে, x=?',
        options: [
          { key: 'A', text: '$\\alpha, \\beta, \\theta$' },
          { key: 'B', text: '$\\alpha, \\theta$', isCorrect: true },
          { key: 'C', text: '$\\beta, \\theta$' },
          { key: 'D', text: '$\\alpha, \\beta$' }
        ],
        answer: 'B',
        source: ['14-15'],
        explanation: '$\\beta\\begin{vmatrix}\\alpha&\\alpha&x\\\\ 1&1&1\\\\ 0&x&\\theta\\end{vmatrix}=0 \\Rightarrow \\beta[\\alpha(\\theta-x)-\\alpha(\\theta-\\theta)]+x(x-\\theta)=0 \\Rightarrow \\beta(\\alpha-x)(\\theta-x)=0 \\therefore x=\\theta, \\alpha$'
      },
      {
        id: 'hsc_math_3',
        questionType: 'standard',
        stem: '$\\begin{pmatrix}\\cos\\theta&\\sin\\theta\\\\ -\\sin\\theta&\\cos\\theta\\end{pmatrix}$ এর বিপরীত ম্যাট্রিক্স-',
        options: [
          { key: 'A', text: '$\\begin{pmatrix}\\cos\\theta&-\\sin\\theta\\\\ -\\sin\\theta&\\cos\\theta\\end{pmatrix}$' },
          { key: 'B', text: '$\\begin{pmatrix}\\cos\\theta&-\\sin\\theta\\\\ \\sin\\theta&-\\cos\\theta\\end{pmatrix}$' },
          { key: 'C', text: '$\\begin{pmatrix}\\cos\\theta&-\\sin\\theta\\\\ \\sin\\theta&\\cos\\theta\\end{pmatrix}$', isCorrect: true },
          { key: 'D', text: '$\\begin{pmatrix}\\cos\\theta&\\sin\\theta\\\\ \\sin\\theta&\\cos\\theta\\end{pmatrix}$' }
        ],
        answer: 'C',
        source: ['13-14'],
        explanation: '$|A|=\\cos^{2}\\theta-(-\\sin^{2}\\theta)=\\cos^{2}\\theta+\\sin^{2}\\theta=1 \\therefore Adj(A)=\\begin{pmatrix}\\cos\\theta&-\\sin\\theta\\\\ \\sin\\theta&\\cos\\theta\\end{pmatrix}$ $A^{-1}=\\frac{1}{|A|}Adj(A)=\\frac{1}{1}\\begin{pmatrix}\\cos\\theta&-\\sin\\theta\\\\ \\sin\\theta&\\cos\\theta\\end{pmatrix}$'
      },
      {
        id: 'hsc_math_4',
        questionType: 'standard',
        stem: '$\\begin{vmatrix}a&1&b+c\\\\ b&1&c+a\\\\ c&1&a+b\\end{vmatrix}$ এর মান হবে-',
        options: [
          { key: 'A', text: '0', isCorrect: true },
          { key: 'B', text: '$abc(a+b)(b+c)(c+a)$' },
          { key: 'C', text: '$abc$' },
          { key: 'D', text: '$(a+b)(b+c)(c+a)$' }
        ],
        answer: 'A',
        source: ['12-13'],
        explanation: '$\\begin{vmatrix}a&1&b+c\\\\ b&1&c+a\\\\ c&1&a+b\\end{vmatrix}=\\begin{vmatrix}a-b&0&b-c\\\\ b-c&0&c-a\\\\ c&1&a+b\\end{vmatrix}=\\begin{vmatrix}a-b&b-c\\\\ b-c&c-a\\end{vmatrix}=-\\begin{vmatrix}a-b&a-b\\\\ b-c&b-c\\end{vmatrix}=-[(a-b)(b-c)-(a-b)(b-c)]=0$'
      },
      {
        id: 'hsc_math_5',
        questionType: 'standard',
        stem: '$\\int\\frac{e^{x}(1+x)}{\\cos^{2}(xe^{x})}dx=?$',
        options: [
          { key: 'A', text: '$xe^{x}+c$' },
          { key: 'B', text: '$\\tan(xe^{x})+c$', isCorrect: true },
          { key: 'C', text: '$\\cot(xe^{x})+c$' },
          { key: 'D', text: '$\\cos(xe^{x})+c$' }
        ],
        answer: 'B',
        source: ['14-15']
      },
      {
        id: 'hsc_math_6',
        questionType: 'standard',
        stem: '$\\lim_{x\\rightarrow0}\\frac{e^{x}-e^{-x}-2\\ln(1+x)}{x\\sin x}$ এর মান-',
        options: [
          { key: 'A', text: '0' },
          { key: 'B', text: '-1' },
          { key: 'C', text: '1', isCorrect: true },
          { key: 'D', text: '2' }
        ],
        answer: 'C',
        source: ['10-11']
      },
      {
        id: 'hsc_math_7',
        questionType: 'standard',
        stem: '$(2x^{2}-\\frac{1}{2x^{3}})^{10}$ এর বিস্তৃতিতে x-বর্জিত পদটি কততম এবং এর মান কত?',
        options: [
          { key: 'A', text: 'পঞ্চম এবং 840', isCorrect: true },
          { key: 'B', text: 'চতুর্থ এবং 1920' },
          { key: 'C', text: 'ষষ্ঠ এবং 252' },
          { key: 'D', text: 'সপ্তম এবং 30' }
        ],
        answer: 'A',
        source: ['12-13']
      },
      {
        id: 'hsc_math_8',
        questionType: 'standard',
        stem: '$(2x^{2}+\\frac{k}{x^{3}})^{10}$ এর বিস্তৃতিতে $x^{5}$ এবং $x^{15}$ এর সহগদ্বয় সমান হলে k এর ধনাত্মক মান-',
        options: [
          { key: 'A', text: '$\\frac{1}{\\sqrt{2}}$' },
          { key: 'B', text: '$\\frac{1}{\\sqrt{3}}$', isCorrect: true },
          { key: 'C', text: '$\\frac{1}{2}$' },
          { key: 'D', text: '$\\frac{1}{\\sqrt{5}}$' }
        ],
        answer: 'B',
        source: ['11-12']
      },
      {
        id: 'hsc_math_9',
        questionType: 'standard',
        stem: '$\\arctan\\{\\sin(\\arccos\\frac{\\sqrt{2}}{\\sqrt{3}})\\} = ?$',
        options: [
          { key: 'A', text: '$\\frac{\\pi}{2}$' },
          { key: 'B', text: '$\\frac{\\pi}{3}$' },
          { key: 'C', text: '$\\frac{\\pi}{4}$' },
          { key: 'D', text: '$\\frac{\\pi}{6}$', isCorrect: true }
        ],
        answer: 'D',
        source: ['13-14']
      },
      {
        id: 'hsc_math_10',
        questionType: 'standard',
        stem: '$\\frac{x+17}{(x-3)(x+2)}=\\frac{a}{x-3}+\\frac{b}{x+2}$ হলে (a, b) = ?',
        options: [
          { key: 'A', text: '$a=2, b=-5$' },
          { key: 'B', text: '$a=4, b=-3$', isCorrect: true },
          { key: 'C', text: '$a=-3, b=4$' },
          { key: 'D', text: '$a=b, b=-2$' }
        ],
        answer: 'B',
        source: ['08-09']
      }
    ]
  }
];
