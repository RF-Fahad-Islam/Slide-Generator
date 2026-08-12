/**
 * Smart LaTeX & Chemistry Auto-Formatter and Preprocessor
 * Converts raw LaTeX macros, matrices, determinants, chemical formulas, and units
 * into clean, standard KaTeX-compatible expressions.
 */

// True if the text contains anything the DOM renderer would typeset via KaTeX
// (MathText): $...$, $$...$$, \(...\) / \[...\] delimiters, or bare math
// macros like \frac \sqrt \int \lim that MathText auto-wraps. PPTX native text
// CANNOT reproduce these — such elements must be rasterized as images instead.
export function textContainsMath(text: string | null | undefined): boolean {
  if (!text) return false;
  return (
    /\$\$[\s\S]*?\$\$/.test(text) ||
    /\$[^$]+\$/.test(text) ||
    /\\\([\s\S]*?\\\)/.test(text) ||
    /\\\[[\s\S]*?\\\]/.test(text) ||
    /\\(?:frac|sqrt|int|sum|prod|lim|sin|cos|tan|ln|log|cdot|times|div|pm|alpha|beta|gamma|delta|theta|lambda|pi|sigma|omega|Rightarrow|rightarrow|leftarrow|begin\{)/.test(text)
  );
}

export function preprocessLatex(raw: string): string {
  if (!raw) return raw;

  return raw
    // Convert \vert{}\begin{matrix} ... \end{matrix}\vert{} to standard \begin{vmatrix} ... \end{vmatrix}
    .replace(/\\vert\{\}\s*\\begin\{matrix\}/g, '\\begin{vmatrix}')
    .replace(/\\end\{matrix\}\s*\\vert\{\}/g, '\\end{vmatrix}')
    // Convert (\begin{matrix} ... \end{matrix}) to standard \begin{pmatrix} ... \end{pmatrix}
    .replace(/\(\s*\\begin\{matrix\}/g, '\\begin{pmatrix}')
    .replace(/\\end\{matrix\}\s*\)/g, '\\end{pmatrix}')
    // Convert [\begin{matrix} ... \end{matrix}] to standard \begin{bmatrix} ... \end{bmatrix}
    .replace(/\[\s*\\begin\{matrix\}/g, '\\begin{bmatrix}')
    .replace(/\\end\{matrix\}\s*\]/g, '\\end{bmatrix}')
    // Clean \vert{} to vertical bar |
    .replace(/\\vert\{\}/g, '|')
    // Clean multiple spaces inside LaTeX delimiters
    .trim();
}

/**
 * Automatically formats chemical species, units, and un-delimited LaTeX macros.
 */
export function formatMathAndChemistry(text: string): string {
  if (!text || typeof text !== 'string') return '';

  let formatted = preprocessLatex(text);

  // 1. Convert equilibrium symbol ⇌ to \rightleftharpoons if not in math mode
  if (formatted.includes('⇌')) {
    formatted = formatted.replace(/(?<!\$)\s*⇌\s*(?!\$)/g, ' $\\rightleftharpoons$ ');
  }

  // 2. Auto-wrap un-delimited standalone LaTeX macro commands (e.g. \lim_{x\rightarrow0}, \int, \frac, \sqrt, \arctan)
  const macroRegex = /(?<!\$)(?:\\(?:lim|int|frac|sqrt|arctan|arccos|arcsin|sin|cos|tan|cot|sec|csc|log|ln|sum|prod|alpha|beta|gamma|delta|theta|lambda|pi|sigma|omega|Delta|Theta|Lambda|Pi|Sigma|Omega|rightleftharpoons|rightarrow|leftarrow|implies|iff|pm|times|div|cdot|approx|neq|leq|geq|infty|partial))(?![a-zA-Z\$])/g;

  if (macroRegex.test(formatted) && !formatted.includes('$')) {
    // If the string is a pure LaTeX expression without $, wrap the whole string in $...$
    formatted = `$${formatted.trim()}$`;
  }

  // 3. Auto-format chemical formulas like H2SO4, Na2SO4, 2NaOH(aq), 2H2O(l), HClO4, H3PO4
  // Matches element symbols followed by numbers: e.g. H2, SO4, Na2, ClO4, H3, PO4
  const chemFormulaRegex = /\b([A-Z][a-z]?)(\d+)([A-Z][a-z]?\d*|\([a-z]+\))*/g;
  if (chemFormulaRegex.test(formatted) && !formatted.includes('$') && !formatted.includes('\\')) {
    formatted = formatted.replace(/\b([A-Z][a-z]?\d+(?:[A-Z][a-z]?\d*|\([a-z]+\))*)\b/g, (match) => {
      // Convert chemical numbers into LaTeX subscripts
      const sub = match.replace(/([A-Za-z]+)(\d+)/g, '$1_{$2}');
      return `$\\mathrm{${sub}}$`;
    });
  }

  // 4. Auto-format scientific units with negative powers e.g. "kJ mol-1" or "mol-1" or "m s-1"
  if (!formatted.includes('$')) {
    formatted = formatted.replace(/\b([kMGTmµn]?J|[kMGTmµn]?g|mol|m|s|Pa|N|V|A|W|Hz)\s*[-−](\d+)\b/g, '$\\mathrm{$1^{-$2}}$');
  }

  return formatted;
}
