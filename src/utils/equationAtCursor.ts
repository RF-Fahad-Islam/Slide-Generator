import { preprocessLatex, formatMathAndChemistry } from './latexFormatter';

export interface EquationAtCursor {
  rawMath: string;
  isBlock: boolean;
  startIndex: number;
  endIndex: number;
}

/**
 * Scans text for KaTeX equation regions ($...$, $$...$$, \(...\), \[...\], LaTeX macros, chemical formulas)
 * and returns ONLY the specific equation touching or containing the given caretIndex.
 * Returns null if the caret is in plain non-math text.
 */
export function getEquationAtCursor(text: string, caretIndex: number): EquationAtCursor | null {
  if (text === null || text === undefined || typeof text !== 'string' || !text.trim()) {
    return null;
  }
  if (typeof caretIndex !== 'number' || caretIndex < 0 || caretIndex > text.length) {
    return null;
  }

  const regions: EquationAtCursor[] = [];

  // 1. Double dollar block math: $$ ... $$
  const blockRegex = /\$\$([\s\S]+?)\$\$/g;
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(text)) !== null) {
    const rawMath = match[1].trim();
    if (rawMath) {
      regions.push({
        rawMath,
        isBlock: true,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  // 2. Single dollar inline math: $ ... $ (excluding $$)
  const inlineRegex = /(?<!\$)\$([^\$\n]+?)\$(?!\$)/g;
  while ((match = inlineRegex.exec(text)) !== null) {
    const rawMath = match[1].trim();
    if (rawMath) {
      regions.push({
        rawMath,
        isBlock: false,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  // 3. LaTeX brackets: \( ... \) or \[ ... \]
  const bracketRegex = /(\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\])/g;
  while ((match = bracketRegex.exec(text)) !== null) {
    const isBlock = match[0].startsWith('\\[');
    const rawMath = (isBlock ? match[3] : match[2])?.trim() || '';
    if (rawMath) {
      regions.push({
        rawMath,
        isBlock,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  // 4. Standalone un-delimited LaTeX macros (e.g. \frac{a}{b}, \sqrt{x}, \int, \begin{matrix}...\end{matrix})
  const macroRegex = /\\(?:frac|sqrt|int|sum|prod|lim|sin|cos|tan|cot|sec|csc|log|ln|cdot|times|div|pm|alpha|beta|gamma|delta|theta|lambda|pi|sigma|omega|Delta|Theta|Lambda|Pi|Sigma|Omega|rightleftharpoons|rightarrow|leftarrow|implies|iff|approx|neq|leq|geq|infty|partial|begin\{[a-zA-Z]+\})/g;

  while ((match = macroRegex.exec(text)) !== null) {
    const mStart = match.index;
    const alreadyCovered = regions.some((r) => mStart >= r.startIndex && mStart < r.endIndex);
    if (!alreadyCovered) {
      let mEnd = mStart + match[0].length;
      let depth = 0;
      while (mEnd < text.length) {
        const ch = text[mEnd];
        if (ch === '{') depth++;
        else if (ch === '}') {
          if (depth > 0) depth--;
        } else if (depth === 0 && (/\s/.test(ch) || !/[0-9a-zA-Z\_\^\+\-\*\/\=\\\{\}\(\)\[\]\.\,]/.test(ch))) {
          break;
        }
        mEnd++;
      }
      const rawSlice = text.slice(mStart, mEnd).trim();
      if (rawSlice) {
        regions.push({
          rawMath: preprocessLatex(rawSlice),
          isBlock: false,
          startIndex: mStart,
          endIndex: mEnd,
        });
      }
    }
  }

  // 5. Chemical formulas & units e.g. H2SO4, Na2SO4, 2NaOH(aq), kJ mol-1
  const chemRegex = /\b([A-Z][a-z]?\d+(?:[A-Z][a-z]?\d*|\([a-z]+\))*)\b/g;
  while ((match = chemRegex.exec(text)) !== null) {
    const cStart = match.index;
    const cEnd = cStart + match[0].length;
    const alreadyCovered = regions.some((r) => cStart >= r.startIndex && cStart < r.endIndex);
    if (!alreadyCovered) {
      const formattedChem = formatMathAndChemistry(match[0]);
      const rawMath =
        formattedChem.startsWith('$') && formattedChem.endsWith('$')
          ? formattedChem.slice(1, -1)
          : match[0];
      regions.push({
        rawMath,
        isBlock: false,
        startIndex: cStart,
        endIndex: cEnd,
      });
    }
  }

  // Check if caretIndex touches or falls within any detected equation region
  const touchingRegion = regions.find(
    (r) => caretIndex >= r.startIndex - 1 && caretIndex <= r.endIndex + 1
  );

  return touchingRegion || null;
}

/**
 * Scans text and extracts ALL KaTeX equation regions ($...$, $$...$$, \(...\), \[...\], LaTeX macros, chemical formulas)
 * returning an array of raw math expressions. Filters out all non-equation Bengali/English text.
 */
export function extractAllEquations(text: string): EquationAtCursor[] {
  if (text === null || text === undefined || typeof text !== 'string' || !text.trim()) {
    return [];
  }

  const processed = formatMathAndChemistry(text);
  const regions: EquationAtCursor[] = [];

  // 1. Double dollar block math: $$ ... $$
  const blockRegex = /\$\$([\s\S]+?)\$\$/g;
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(processed)) !== null) {
    const rawMath = match[1].trim();
    if (rawMath) {
      regions.push({
        rawMath,
        isBlock: true,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  // 2. Single dollar inline math: $ ... $ (excluding $$)
  const inlineRegex = /(?<!\$)\$([^\$\n]+?)\$(?!\$)/g;
  while ((match = inlineRegex.exec(processed)) !== null) {
    const rawMath = match[1].trim();
    if (rawMath) {
      regions.push({
        rawMath,
        isBlock: false,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  // 3. LaTeX brackets: \( ... \) or \[ ... \]
  const bracketRegex = /(\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\])/g;
  while ((match = bracketRegex.exec(processed)) !== null) {
    const isBlock = match[0].startsWith('\\[');
    const rawMath = (isBlock ? match[3] : match[2])?.trim() || '';
    if (rawMath) {
      regions.push({
        rawMath,
        isBlock,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  // 4. Standalone un-delimited LaTeX macros if not inside covered regions
  const macroRegex = /\\(?:frac|sqrt|int|sum|prod|lim|sin|cos|tan|cot|sec|csc|log|ln|cdot|times|div|pm|alpha|beta|gamma|delta|theta|lambda|pi|sigma|omega|Delta|Theta|Lambda|Pi|Sigma|Omega|rightleftharpoons|rightarrow|leftarrow|implies|iff|approx|neq|leq|geq|infty|partial|begin\{[a-zA-Z]+\})/g;

  while ((match = macroRegex.exec(processed)) !== null) {
    const mStart = match.index;
    const alreadyCovered = regions.some((r) => mStart >= r.startIndex && mStart < r.endIndex);
    if (!alreadyCovered) {
      let mEnd = mStart + match[0].length;
      let depth = 0;
      while (mEnd < processed.length) {
        const ch = processed[mEnd];
        if (ch === '{') depth++;
        else if (ch === '}') {
          if (depth > 0) depth--;
        } else if (depth === 0 && (/\s/.test(ch) || !/[0-9a-zA-Z\_\^\+\-\*\/\=\\\{\}\(\)\[\]\.\,]/.test(ch))) {
          break;
        }
        mEnd++;
      }
      const rawSlice = processed.slice(mStart, mEnd).trim();
      if (rawSlice) {
        regions.push({
          rawMath: preprocessLatex(rawSlice),
          isBlock: false,
          startIndex: mStart,
          endIndex: mEnd,
        });
      }
    }
  }

  // 5. If no regions found, check if the string itself is a raw math snippet (e.g. "x^2" or "\frac{a}{b}")
  if (regions.length === 0) {
    const trimmed = text.trim();
    if (/[0-9a-zA-Z\_\^\+\-\*\/\=\\\{\}\(\)\[\]]/.test(trimmed) && !/[\u0980-\u09FF]/.test(trimmed)) {
      regions.push({
        rawMath: preprocessLatex(trimmed),
        isBlock: false,
        startIndex: 0,
        endIndex: text.length,
      });
    }
  }

  return regions;
}
