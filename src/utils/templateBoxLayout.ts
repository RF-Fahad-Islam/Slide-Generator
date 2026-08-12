import { MCQItem, SlideTextBox } from '../types';
import { estimateWrappedLines } from './textHeightEstimate';

// Id prefixes assigned by templateToTextBoxes.ts (see bid() there) — used to
// find the template-generated card/stem/roman/prompt/options boxes at render
// time so their geometry can adapt to the current question's content. A
// deck-wide box list only knows the deck's config, not any one question's
// stem length or statement count, so this adaptation has to happen per-slide,
// here, rather than when the boxes are generated.
export const TPL_CARD_ID = 'mdl_card';
export const TPL_STEM_ID = 'mdl_stem';
export const TPL_ROMAN_ID = 'mdl_roman';
export const TPL_PROMPT_ID = 'mdl_prompt';
export const TPL_OPTIONS_ID = 'mdl_options';

// Compact question-card height for plain MCQs (no roman statements / prompt):
// the 280px template card leaves a large empty region under a short stem.
export const COMPACT_CARD_H = 205;
export const COMPACT_CARD_GAP = 26;
const BASE_CARD_H = 280;
const STEM_TOP_OFFSET = 86; // matches templateToTextBoxes: stem box y = cardY + 86
const ROMAN_TOP_GAP = 22; // gap between the stem's estimated bottom and the roman card top
const ROMAN_PAD_Y = 32; // vertical padding inside the roman card (16 top + 16 bottom)
const ROMAN_LINE_H = 36; // ~20px roman font * line-height + row margin (measured headroom-padded)
const PROMPT_GAP = 26;
const PROMPT_LINE_H = 34;
const CARD_BOTTOM_PAD = 30;

export interface TemplateCardMetrics {
  cardH: number;
  romanY?: number;
  promptY?: number;
  optionsY: number;
}

/**
 * Computes adaptive geometry for the template-generated question card so
 * bohupodi (roman-statement) questions get a card tall enough to hold their
 * stem + statements + prompt without the prompt line overlapping the
 * statements box, and the options list is pushed down to clear it. Plain
 * MCQs keep the existing compact card (no roman items — nothing to adapt).
 */
export function computeTemplateCardMetrics(
  item: Pick<MCQItem, 'stem' | 'romanItems' | 'prompt'>,
  cardBox: SlideTextBox,
  stemBox: SlideTextBox | undefined,
  romanBox: SlideTextBox | undefined,
  baseOptionsY: number,
  is2Column: boolean = false
): TemplateCardMetrics {
  const hasRoman = (item.romanItems || []).length > 0;
  const hasPrompt = !!item.prompt;

  const stemY = stemBox?.y ?? (cardBox.y + STEM_TOP_OFFSET);
  const stemFontSize = stemBox?.fontSize || 30;
  const stemW = stemBox?.w || cardBox.w - 72;
  const stemLines = estimateWrappedLines(item.stem, stemFontSize, stemW);
  const stemH = Math.max(1, stemLines) * (stemFontSize * 1.3);

  let currentY = stemY + stemH;
  let romanTop: number | undefined;

  if (hasRoman) {
    romanTop = currentY + 14;
    const romanFontSize = romanBox?.fontSize || 20;
    const romanW = (romanBox?.w || stemW) - 8;
    const romanLines = (item.romanItems || []).reduce(
      (sum, stmt) => sum + estimateWrappedLines(stmt, romanFontSize, romanW),
      0
    );
    const romanH = ROMAN_PAD_Y + romanLines * ROMAN_LINE_H;
    currentY = romanTop + romanH;
  }

  let promptY: number | undefined;
  if (hasPrompt) {
    promptY = currentY + 14;
    currentY = promptY + PROMPT_LINE_H;
  }

  const defaultMinH = cardBox.h || BASE_CARD_H;
  const cardH = (!hasRoman && !hasPrompt && stemLines <= 2)
    ? Math.min(COMPACT_CARD_H, defaultMinH)
    : Math.max(defaultMinH, currentY - cardBox.y + CARD_BOTTOM_PAD);

  const optionsY = is2Column
    ? baseOptionsY
    : Math.max(baseOptionsY, cardBox.y + cardH + COMPACT_CARD_GAP);

  return { cardH, romanY: romanTop, promptY, optionsY };
}

// Roman statements store their numeral inline in the text itself
// (e.g. "i. ইউরেটেরোস্কোপি" — see MCQItem.romanItems). Splitting it out lets
// the renderer show it as a small badge instead of plain leading text, for
// the same scannable-key look the options list already has. Falls back to
// `null` (render the raw string unchanged) for text that doesn't match the
// expected "<roman numeral>. " / "<roman numeral>) " prefix.
export function splitRomanLabel(stmt: string): { label: string; rest: string } | null {
  const m = /^\s*([ivxIVX]{1,4})[.)]\s*/.exec(stmt);
  if (!m) return null;
  const rest = stmt.slice(m[0].length);
  if (!rest.trim()) return null;
  return { label: m[1].toLowerCase(), rest };
}
