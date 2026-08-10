// Rough wrapped-line estimator for slide text boxes. There is no live DOM
// measurement pass available when template box geometry is computed (box
// positions must be known before layout renders), so this heuristic stands
// in for it — tuned for Bangla/Latin/LaTeX-mixed exam text at typical slide
// font sizes. Good enough to keep template boxes from overlapping; not
// pixel-exact.
export function estimateWrappedLines(text: string, fontSizePx: number, boxWidthPx: number): number {
  if (!text || !text.trim()) return 0;
  // Bangla conjuncts/matras render wider than average Latin glyphs at the
  // same font size — 0.62em per character keeps the estimate conservative
  // (slightly over-estimating height is safer than under-estimating it).
  const avgCharWidth = fontSizePx * 0.62;
  const charsPerLine = Math.max(1, Math.floor(boxWidthPx / avgCharWidth));
  return text
    .split('\n')
    .reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);
}
