# Master Prompt: Bulk MCQ Ingestion, Parser, JSON Cross-Compatibility & Two-Way Sync System

> **Target Tool / Agent**: Antigravity, Claude Code, Cursor Agent, Codex, or any advanced autonomous coding agent.  
> **Domain**: EdTech / Exam Preparation / Slide & Question Bank Generator  
> **Primary Tech Stack**: React (v18/19), TypeScript, Tailwind CSS, KaTeX (Math/LaTeX), Lucide Icons, LocalStorage / IndexedDB  
> **File Location**: [`docs/mcq-bulk-insertion-master-prompt.md`](file:///c:/Users/User/Documents/Slide_Generator/Slide-Generator/docs/mcq-bulk-insertion-master-prompt.md)

---

## Mission & Goal

Build a production-ready, 100% offline-capable **Bulk Multiple Choice Question (MCQ) Ingestion, Parsing, JSON Cross-Compatibility, Two-Way Sync, and Review System**.

The system enables educators and developers to:
1. **Bulk Paste Raw Text**: Paste exam questions copied from documents, PDFs, or external AI outputs (in Bengali, English, or mixed formats with LaTeX formulas).
2. **Deterministic Regex & Heuristic Parsing**: Automatically detect and structure question stems, multi-statement Roman numerals (বহুপদী প্রশ্ন: `i, ii, iii`), prompts (`নিচের কোনটি সঠিক?`), options (`A-D` or `ক-ঘ`), correct answers (marked by `*` or `উত্তর:` lines), source tags (e.g. `[ঢাকা বোর্ড ২০২৪]`), explanations, and metadata (`subject:`, `class:`, `paper:`).
3. **Universal JSON Import & Export Cross-Compatibility**:
   - **Cross-Format Ingestion**: Ingests JSON from any external product or schema (e.g., `{ products: [...] }`, `{ items: [...] }`, `{ questions: [...] }`, `{ data: [...] }`, `{ mcqs: [...] }`, or flat array `[...]`). Automatically maps loose field names (`question`/`stem`, `choices`/`options`, `correctAnswer`/`answer`).
   - **Multi-Format Export**: Exports as Canonical `FullDeckPackage` v2.0 (with slide deck configs & layouts), Universal Products/LMS JSON, or Flat Question Arrays.
   - **Smart Paste Auto-Detection**: If a user pastes raw JSON into the text area, the system detects it automatically, normalizes the questions, and can cross-convert it into raw block text or load it into the review queue.
4. **Two-Way Bidirectional Sync**: Users can edit raw text in a code-style editor OR switch to interactive visual cards. Edits made to any individual card serialize back into the exact raw-text block without disturbing other questions.
5. **External AI Prompt Integration**: Built-in, copy-ready prompt to feed into ChatGPT, Gemini, or Claude to transcribe question-paper photos or PDFs directly into this exact parser-ready format.
6. **Review Queue & Staging**: Batch tag applicator, answer key toggles, confidence indicators, KaTeX math preview, and one-click commitment to the active deck or question bank.

---

## 1. System Architecture & File Structure

Generate the system adhering to this file structure:

```
src/
├── types/
│   ├── mcq.ts                      # Core TypeScript interfaces & types
│   └── package.ts                  # Full deck package & universal product export types
├── utils/
│   ├── bulkParser.ts               # Regex parser, tokenizers, block splitter & serializer
│   ├── mcqJson.ts                  # Universal JSON normalizer, product adapter & exporter
│   ├── katexRenderer.ts            # Math formula rendering helper with LaTeX fallbacks
│   └── tagMemory.ts                # Auto-suggestion tag memory (subjects, classes, boards)
├── components/
│   ├── math/
│   │   └── MathText.tsx            # Inline ($...$) and block ($$...$$) KaTeX renderer
│   ├── bulk/
│   │   ├── BulkTextEditor.tsx      # Dual-mode container (Raw Text vs Interactive Cards)
│   │   ├── EditableMCQCard.tsx     # Card component for editing a single block
│   │   ├── SourceTagsInput.tsx     # Multi-tag badge input for board/exam sources
│   │   ├── BatchTagToolbar.tsx     # Bulk tag applicator (Subject, Class, Paper, Source)
│   │   ├── JsonExportModal.tsx     # Modal to export Deck Package v2.0 or Products JSON
│   │   └── AIPromptModal.tsx       # Modal with 1-click copy of external AI prompt
│   └── review/
│       ├── ReviewQueue.tsx         # Staging queue with bulk select, delete, and approve
│       └── ValidationBadge.tsx     # High/low confidence tags and parsing warning alerts
└── pages/
    └── MCQBulkStudio.tsx           # Main page / view orchestrating the complete flow
```

---

## 2. Core Data Models (`src/types/mcq.ts` & `src/types/package.ts`)

### `src/types/mcq.ts`
```typescript
export type QuestionType = 'standard' | 'roman_statements' | 'passage';

export interface MCQOption {
  key: string;            // 'A' | 'B' | 'C' | 'D' or 'ক' | 'খ' | 'গ' | 'ঘ'
  text: string;           // Option content (may contain LaTeX like '$x^2$')
  isCorrect?: boolean;    // True if this option is the verified answer
}

export interface MCQTags {
  subject?: string;       // e.g. "Biology", "জীববিজ্ঞান", "Physics"
  className?: string;     // e.g. "SSC", "HSC", "Class 10"
  paper?: string;         // e.g. "1st Paper", "2nd Paper"
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface MCQItem {
  id: string;
  questionType: QuestionType;
  stem: string;                   // Question title/body
  romanItems?: string[];          // For multi-statement: ['i. ...', 'ii. ...', 'iii. ...']
  prompt?: string;                // e.g. 'নিচের কোনটি সঠিক?' or 'Which of the following is correct?'
  options: MCQOption[];           // Always strictly 4 options
  answer: string;                 // Correct key: 'A', 'B', 'C', 'D' or 'ক', 'খ', 'গ', 'ঘ'
  explanation?: string;           // Detailed answer explanation
  source?: string[];              // Board / Year tags e.g. ['ঢাকা বোর্ড ২০২৪']
  tags?: MCQTags;                 // Subject/Class metadata
  confidence: 'high' | 'low';     // Low if answer is missing or options < 4
  warnings?: string[];            // Parsing warnings
}

export interface ParsedBlockPair {
  blockText: string;              // Exact raw string block for this question
  item: MCQItem;                  // Parsed structured object
}
```

### `src/types/package.ts`
```typescript
import { MCQItem } from './mcq';

// Canonical Deck Package (Full fidelity with presentation styles)
export interface FullDeckPackage {
  version: '2.0';
  type: 'slide_deck_package';
  name: string;
  subject?: string;
  description?: string;
  badgeTag?: string;
  createdAt?: number;
  updatedAt?: number;
  config?: Record<string, any>;
  items: MCQItem[];
}

// Cross-Product Universal Export (Compatible with external tools, LMS & New Products)
export interface UniversalProductPackage {
  version: '1.0';
  type: 'product_mcq_package';
  metadata: {
    productName: string;
    totalCount: number;
    exportedAt: string;
  };
  products?: Array<{
    id: string;
    title: string;
    items: MCQItem[];
  }>;
  questions: MCQItem[];
}
```

---

## 3. JSON Cross-Compatibility Layer (`src/utils/mcqJson.ts`)

This engine guarantees 100% two-way interoperability between this tool, external products, and various AI output formats.

### A. Permissive Loose JSON Ingestion (`normalizeMCQs`):
The importer must automatically detect and unwrap all known envelopes:
```typescript
export const normalizeMCQs = (raw: unknown): MCQItem[] => {
  let list: any[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === 'object') {
    const obj = raw as any;
    // Unwrap all common wrapper formats & new product envelopes
    if (Array.isArray(obj.items)) list = obj.items;
    else if (Array.isArray(obj.questions)) list = obj.questions;
    else if (Array.isArray(obj.mcqs)) list = obj.mcqs;
    else if (Array.isArray(obj.data)) list = obj.data;
    else if (Array.isArray(obj.questionBank)) list = obj.questionBank;
    else if (Array.isArray(obj.products)) {
      // Handles { products: [{ items: [...] }, ...] } or { products: [MCQ, MCQ] }
      list = obj.products.flatMap((p: any) => Array.isArray(p.items) ? p.items : (Array.isArray(p.questions) ? p.questions : [p]));
    } else if (obj.product && Array.isArray(obj.product.items)) {
      list = obj.product.items;
    } else if (obj.deck && Array.isArray(obj.deck.items)) {
      list = obj.deck.items;
    }
  }

  return list
    .map((item, idx) => normalizeSingleMCQ(item, idx))
    .filter((q): q is MCQItem => q !== null);
};
```

### B. Tolerant Field Normalizer (`normalizeSingleMCQ`):
Maps inconsistent naming conventions across platforms into strict `MCQItem`:
```typescript
export const normalizeSingleMCQ = (raw: any, idx: number): MCQItem | null => {
  if (!raw || typeof raw !== 'object') return null;

  // Stem mapping
  const stem = String(raw.stem ?? raw.question ?? raw.title ?? raw.text ?? raw.q ?? raw.prompt ?? '').trim();
  if (!stem) return null;

  // Options mapping (handles strings array ["Option 1", "Option 2"] or object array)
  const rawOptions = Array.isArray(raw.options) ? raw.options : (Array.isArray(raw.choices) ? raw.choices : (Array.isArray(raw.answers) ? raw.answers : []));
  const defaultKeys = ['A', 'B', 'C', 'D'];
  
  const options: MCQOption[] = rawOptions.map((opt: any, optIdx: number) => {
    if (typeof opt === 'string') {
      return { key: defaultKeys[optIdx] || String(optIdx + 1), text: opt, isCorrect: false };
    }
    const key = String(opt.key ?? opt.label ?? opt.id ?? defaultKeys[optIdx] ?? 'A');
    const text = String(opt.text ?? opt.value ?? opt.option ?? opt.choice ?? '');
    return { key, text, isCorrect: !!opt.isCorrect };
  });

  // Ensure 4 options
  while (options.length < 4) {
    const k = defaultKeys[options.length] || `Opt ${options.length + 1}`;
    options.push({ key: k, text: `Option ${options.length + 1}` });
  }

  // Answer resolution
  const explicitAnswer = String(raw.answer ?? raw.correct ?? raw.correctAnswer ?? raw.answerKey ?? raw.correctOption ?? raw.solution ?? '').trim();
  let answerKey = explicitAnswer;
  if (!answerKey) {
    const marked = options.find(o => o.isCorrect);
    if (marked) answerKey = marked.key;
  }
  if (answerKey) {
    const matched = options.find(o => o.key.toLowerCase() === answerKey.toLowerCase());
    if (matched) matched.isCorrect = true;
  }

  // Tags resolution
  const tags: MCQTags = {
    subject: raw.tags?.subject ?? raw.subject,
    className: raw.tags?.className ?? raw.class ?? raw.grade,
    paper: raw.tags?.paper ?? raw.paper,
    topic: raw.tags?.topic ?? raw.topic,
    difficulty: raw.tags?.difficulty ?? raw.difficulty,
  };

  return {
    id: raw.id ? String(raw.id) : `mcq_${Date.now()}_${idx}`,
    questionType: ['standard', 'roman_statements', 'passage'].includes(raw.questionType) ? raw.questionType : (Array.isArray(raw.romanItems) && raw.romanItems.length > 0 ? 'roman_statements' : 'standard'),
    stem,
    romanItems: Array.isArray(raw.romanItems) ? raw.romanItems.map(String) : undefined,
    prompt: raw.prompt ? String(raw.prompt) : undefined,
    options,
    answer: answerKey,
    source: raw.source ? (Array.isArray(raw.source) ? raw.source.map(String) : [String(raw.source)]) : undefined,
    explanation: raw.explanation ?? raw.rationale ?? raw.exp,
    tags,
    confidence: answerKey && options.length === 4 ? 'high' : 'low',
  };
};
```

### C. Multi-Format JSON Exporter:
1. **Slide Deck Package v2.0**:
   - Includes presentation theme tokens, aspect ratio, typography config, and item array.
2. **New Products / LMS Universal JSON**:
   - Outputs:
     ```json
     {
       "version": "1.0",
       "type": "product_mcq_package",
       "metadata": { "productName": "Biology Chapter 3", "totalCount": 25 },
       "products": [
         { "id": "prod_1", "title": "Main Quiz", "items": [...] }
       ],
       "questions": [...]
     }
     ```
3. **Raw Text Block Transpiler**:
   - Converts any imported JSON package into the canonical raw text format using `serializeMCQToBlockText` so users can seamlessly edit imported JSON inside the text editor.

---

## 4. Parsing & Serializer Engine (`src/utils/bulkParser.ts`)

### A. Auto-Splitting & Normalization:
1. **Detect Pasted JSON Automatically**:
   - If `rawText.trim().startsWith('{')` or `rawText.trim().startsWith('[')`, attempt `JSON.parse`.
   - If valid, run `normalizeMCQs(jsonObj)`.
   - If user prefers raw text view, auto-transpile the parsed objects to text using `items.map(serializeMCQToBlockText).join('\n\n')`.
2. **Handle Missing Blank Lines in Text**:
   - Automatically insert double newlines before numbered questions ending in `?` or `؟`:
   ```typescript
   const withNumberedSplits = rawText.replace(
     /([^\n])\n((?:\d+|[০-৯]+)[.)]\s+.+[?؟])/g,
     '$1\n\n$2'
   );
   const rawBlocks = withNumberedSplits.split(/\n\s*\n+/);
   ```

### B. Line-by-Line Token Extraction (`parseSingleBlock`):
- **Answer Line**: `/^(?:Ans(?:wer)?|উত্তর|উঃ|Sol(?:ution)?)\s*[:=\-]?\s*([A-D|a-d|ক-ঘ|1-4]|\(?i+\)?)/i` -> `normalizeKey(match[1])`.
- **Source Tag**: `/^[\[\(\{](.+?)[\]\)\} ]$/` -> Add string to `sourceTags[]`.
- **Category Metadata** (*MUST run before options to prevent `class:` matching option `C`*):
  - `subject:\s*(.+)` -> `tags.subject`
  - `class:\s*(.+)` -> `tags.className`
  - `paper:\s*(.+)` -> `tags.paper`
- **Option Lines & Asterisk Marker**:
  - `/^(?:([A-D|a-d|ক-ঘ|1-4])[\.\)\:-]|(?:Option\s+)?([A-D|ক-ঘ]))\s*(.+)$/i`
  - Trailing `*` or `(correct)` marks `isCorrect: true`.
- **Roman Statements**:
  - `/^(?:i|ii|iii|iv|v|১|২|৩)\.?\s+(.+)$/i` before options begin.
  - Sets `questionType = 'roman_statements'`.
- **Explanation Line**: `/^(?:exp:|ব্যাখ্যা:|explanation:)\s*(.+)/i`.
- **Key Normalization**:
  - Bengali: `ক` -> `A`, `খ` -> `B`, `গ` -> `C`, `ঘ` -> `D` (or preserves original script if desired).

### C. Reverse Serializer (`serializeMCQToBlockText`):
```typescript
export function serializeMCQToBlockText(item: MCQItem): string {
  const lines: string[] = [];
  lines.push(item.stem);

  if (item.questionType === 'roman_statements' && item.romanItems) {
    for (const ri of item.romanItems) lines.push(ri);
    if (item.prompt) lines.push(item.prompt);
  }

  for (const opt of item.options) {
    const isCorrect = opt.isCorrect || opt.key.toLowerCase() === (item.answer || '').toLowerCase();
    lines.push(`${opt.key}) ${opt.text}${isCorrect ? ' *' : ''}`);
  }

  if (item.explanation) lines.push(`ব্যাখ্যা: ${item.explanation}`);
  if (item.source && item.source.length > 0) lines.push(`[${item.source.join(' | ')}]`);
  if (item.tags?.subject) lines.push(`subject: ${item.tags.subject}`);
  if (item.tags?.className) lines.push(`class: ${item.tags.className}`);
  if (item.tags?.paper) lines.push(`paper: ${item.tags.paper}`);

  return lines.join('\n');
}
```

---

## 5. Two-Way Sync Algorithm

- State stores `bulkText: string` and `parsedBlocks: ParsedBlockPair[]`.
- **When user edits in Raw Textarea**:
  - Debounce 150ms -> `parseBulkTextToBlocks(rawText)` -> updates `parsedBlocks`.
- **When user edits Card `k` in Cards Mode**:
  - Call `serializeMCQToBlockText(updatedItem)`.
  - Splice re-serialized text into `rawBlocks[k]`.
  - Rejoin with `\n\n` -> updates `bulkText`.
  - Zero cursor jumping, zero loss of untouched blocks!

---

## 6. UI/UX & Component Details

1. **Dual Mode View**:
   - `[Raw Text (chars)]` vs `[Cards (count)]`.
   - In Raw Text: Monospace editor (`font-mono`), line numbers, character & question counter, and drag-and-drop file upload supporting `.txt`, `.csv`, and `.json`.
   - In Cards View: List of interactive cards with inline editing for stem, options, answer key, source tags, and explanation.
2. **Math & Formula Rendering (`MathText.tsx`)**:
   - Renders inline (`$...$`) and block (`$$...$$`) LaTeX via KaTeX with Bengali font fallback (`Hind Siliguri`).
3. **JSON Import/Export Hub (`JsonExportModal.tsx`)**:
   - **Import**: Drop any JSON file from old or new products; parses instantly into the review queue.
   - **Export**: Choose between:
     - Full Deck Package (`.json` v2.0)
     - Products Ecosystem JSON (`{ products: [...], questions: [...] }`)
     - Formatted Raw Text (`.txt`)
     - Standard CSV (`.csv`)
4. **Batch Tagging Toolbar**:
   - Apply Subject, Class, Paper, or Source Tags across all parsed items with one click.
5. **Auto-Save Resilience**:
   - Synchronizes draft to `localStorage['mcq_bulk_draft']` on every keystroke to prevent data loss.

---

## 7. Built-In External AI Transcription Prompt

Include this prompt inside `AIPromptModal.tsx` for one-click copy:

```text
You are an expert exam question transcription assistant.

Look at the image/PDF I am giving you and transcribe every multiple-choice question into EXACTLY the raw text format below. Output ONLY the raw text, no commentary.

Rules:
1. One question per block, separated by a blank line.
2. Start each question with its number, e.g. "১." or "1.".
3. Write the question stem as plain text.
4. Write each option on its own line using Bangla keys "ক)" "খ)" "গ)" "ঘ)" (or A) B) C) D) if the paper uses English). Do NOT number the options.
5. Mark the correct option with an asterisk "*" right after that option's text.
6. If the paper is a "বহুপদী" (i/ii/iii statements) question, write the statements as "i." "ii." "iii." lines, then a prompt line like "নিচের কোনটি সঠিক?", then the options.
7. If a question has an explanation, add a line starting with "ব্যাখ্যা:" followed by the explanation text.
8. If a question shows a source (e.g. a board name / year like "ঢাকা বোর্ড ২০২৪"), put it on its own line inside square brackets like "[ঢাকা বোর্ড ২০২৪]".
9. Optional category fields — add these lines ONLY when you can infer them confidently from the paper:
   subject: <subject name, e.g. Biology / জীববিজ্ঞান>
   class: <class level, e.g. SSC / HSC / Class 9>
   paper: <paper number, e.g. 1st Paper / 2nd Paper>
10. Keep LaTeX math ($...$) exactly as written. Keep Bangla text exact.

Example output:
১. মানবদেহের বৃক্কে নেফ্রনের প্রধান কাজ কোনটি?
ক) রক্ত ছাঁকন *
খ) পিত্ত তৈরি
গ) শ্বেতকণিকা তৈরি
ঘ) পরিপাক
ব্যাখ্যা: নেফ্রন হলো বৃক্কের গঠনগত ও কার্যগত একক।
[ঢাকা বোর্ড ২০২৪]
subject: জীববিজ্ঞান
class: SSC
paper: 1st Paper

২. বৃক্কের পাথর অপসারণে আধুনিক পদ্ধতি—
i. ইউরেটেরোস্কোপিক
ii. আল্ট্রাসনিক লিথোট্রিপসি
iii. অস্ত্রোপচার
নিচের কোনটি সঠিক?
ক) i ও ii
খ) ii ও iii *
গ) i ও iii
ঘ) i, ii ও iii
[চট্টগ্রাম বোর্ড ২০১৭]
```

---

## 8. Execution Checklist for the Agent

- [ ] **Phase 1: Domain Types & JSON Architecture**
  - Implement `src/types/mcq.ts` and `src/types/package.ts`.
  - Implement `src/utils/mcqJson.ts` with `normalizeMCQs`, `normalizeSingleMCQ`, and multi-format exporters.
- [ ] **Phase 2: Core Text Parser & Serializer**
  - Implement `src/utils/bulkParser.ts` with auto-splitting, regex tokenizers, and `serializeMCQToBlockText`.
  - Unit tests verifying:
    - Ingesting `{ products: [...] }` envelopes
    - Ingesting `{ items: [...] }` and loose field aliases (`choices`, `question`)
    - Pasting JSON text into text parser
    - Two-way block serialization
- [ ] **Phase 3: Math & UI Primitives**
  - Implement `MathText.tsx` with KaTeX.
  - Implement `SourceTagsInput.tsx` and `BatchTagToolbar.tsx`.
- [ ] **Phase 4: Bulk Studio & Two-Way Sync**
  - Implement `BulkTextEditor.tsx` and `EditableMCQCard.tsx`.
  - Wire bidirectional sync between raw text and block card state.
  - Implement `JsonExportModal.tsx` supporting both Deck Package v2.0 and New Products JSON formats.
- [ ] **Phase 5: Build Verification**
  - Verify typecheck (`tsc --noEmit`), run test suite, and ensure dark/light mode responsive layout.
