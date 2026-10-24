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

/**
 * Computes optimal font size using binary search so dynamic text (Bangla / LaTeX stems)
 * fits strictly inside a bounded box (width & height) without overflowing.
 */
export function calculateFittedFontSize(
  text: string,
  boxW: number,
  boxH: number,
  targetFontSize: number,
  minFontSize: number = 14,
  paddingX: number = 0,
  paddingY: number = 0,
  lineHeightMultiplier: number = 1.35
): number {
  if (!text || !boxH || boxH <= 0 || !boxW || boxW <= 0) return targetFontSize;
  const innerW = Math.max(40, boxW - paddingX);
  const innerH = Math.max(20, boxH - paddingY);

  const low = Math.max(8, minFontSize);
  let high = Math.max(low, targetFontSize);
  let best = low;

  // If text already fits comfortably at target font size, keep it!
  const targetLines = estimateWrappedLines(text, high, innerW);
  if (targetLines * (high * lineHeightMultiplier) <= innerH) {
    return high;
  }

  // Binary search for highest font size that fits inside innerH
  let l = low;
  let r = high;
  while (l <= r) {
    const mid = Math.floor((l + r) / 2);
    const lines = estimateWrappedLines(text, mid, innerW);
    const neededH = lines * (mid * lineHeightMultiplier);

    if (neededH <= innerH) {
      best = mid;
      l = mid + 1; // Try a larger font size
    } else {
      r = mid - 1; // Too tall, scale down
    }
  }

  return best;
}

export interface FittedOptionsMetrics {
  fontSize: number;
  rowHeight: number;
  badgeSize: number; // in px
  badgeTextSize: string; // Tailwind class
  paddingClass: string; // Tailwind class
}

/**
 * Computes optimal font size, card height, badge dimensions, and padding
 * for a 2x2 or 1x4 options grid when bounded inside a box (boxW x boxH).
 */
export function calculateFittedOptionsLayout(
  options: { key: string; text: string }[],
  boxW: number,
  boxH: number,
  targetFontSize: number,
  is2Col: boolean = true,
  minFontSize: number = 12
): FittedOptionsMetrics {
  const rowCount = is2Col ? 2 : Math.max(1, options.length);
  const rowGap = is2Col ? 14 : 10;
  const totalGaps = (rowCount - 1) * rowGap;
  const availableRowH = Math.max(34, Math.floor((boxH - totalGaps) / rowCount));
  const colW = is2Col ? (boxW - 16) / 2 : boxW;

  let badgeSize = 48;
  let badgeTextSize = 'text-2xl';
  let paddingClass = 'px-6 py-4';
  let internalHPad = 80;

  if (availableRowH < 56) {
    badgeSize = 28;
    badgeTextSize = 'text-xs';
    paddingClass = 'px-3 py-1';
    internalHPad = 46;
  } else if (availableRowH < 75) {
    badgeSize = 36;
    badgeTextSize = 'text-sm';
    paddingClass = 'px-4 py-2';
    internalHPad = 58;
  } else if (availableRowH < 95) {
    badgeSize = 42;
    badgeTextSize = 'text-lg';
    paddingClass = 'px-5 py-3';
    internalHPad = 70;
  }

  // Find longest option text among all options
  const longestText = options.reduce((longest, o) => (o.text.length > longest.length ? o.text : longest), '');
  const availableTextW = Math.max(40, colW - internalHPad);
  const availableTextH = Math.max(18, availableRowH - 10);

  const fittedFontSize = calculateFittedFontSize(
    longestText,
    availableTextW,
    availableTextH,
    targetFontSize,
    minFontSize,
    0,
    0,
    1.25
  );

  return {
    fontSize: fittedFontSize,
    rowHeight: availableRowH,
    badgeSize,
    badgeTextSize,
    paddingClass,
  };
}
