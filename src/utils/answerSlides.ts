import { DeckConfig, MCQItem } from '../types';

// Answer display modes. 'separate_slide' doubles the slide count — every question
// slide is followed by a dedicated answer slide (correct option highlighted,
// optional explanation). Kept optional on DeckConfig so saved decks without it
// fall back to the legacy `showAnswerInSlide` boolean (no data migration needed).
export type AnswerMode = 'hidden' | 'highlight' | 'separate_slide';
export type AnswerDisplayStyle = 'highlight_option' | 'answer_pill' | 'explanation_card';

export const DEFAULT_ANSWER_DISPLAY_STYLES: AnswerDisplayStyle[] = [
  'highlight_option',
  'answer_pill',
  'explanation_card',
];

export const getEffectiveAnswerDisplayStyles = (
  config: Pick<DeckConfig, 'answerDisplayStyles' | 'showExplanationInSlide'>
): AnswerDisplayStyle[] => {
  if (config.answerDisplayStyles && Array.isArray(config.answerDisplayStyles)) {
    return config.answerDisplayStyles;
  }
  const styles: AnswerDisplayStyle[] = ['highlight_option', 'answer_pill'];
  if (config.showExplanationInSlide) {
    styles.push('explanation_card');
  }
  return styles;
};

export const hasAnswerDisplayStyle = (
  config: Pick<DeckConfig, 'answerDisplayStyles' | 'showExplanationInSlide'>,
  style: AnswerDisplayStyle
): boolean => {
  return getEffectiveAnswerDisplayStyles(config).includes(style);
};

export const effectiveAnswerMode = (config: Pick<DeckConfig, 'answerMode' | 'showAnswerInSlide'>): AnswerMode => {
  if (config.answerMode) return config.answerMode;
  return config.showAnswerInSlide ? 'highlight' : 'hidden';
};

// In-place highlight on the QUESTION slide — only true for the 'highlight' mode.
// (A 'separate_slide' deck keeps its question slides clean and shows the answer
// only on the dedicated answer slides.)
export const effectiveShowAnswerInSlide = (config: Pick<DeckConfig, 'answerMode' | 'showAnswerInSlide'>): boolean =>
  effectiveAnswerMode(config) === 'highlight';

// Answer-reveal gating for a single physical slide — the ONE source of truth
// for which answer features (option highlight / answer pill / explanation card)
// are visible on this slide. SlideCanvas (the DOM reference), pptxExport (the
// native editable exporter) and ExportModal's math-overlay rasterizer must all
// resolve the same flags, or the exported PPTX drifts from the preview.
export interface SlideAnswerFlags {
  showOptionHighlight: boolean;
  showAnswerPill: boolean;
  showExplanationCard: boolean;
}

export const resolveSlideAnswerFlags = (
  config: Pick<DeckConfig, 'answerMode' | 'showAnswerInSlide' | 'answerDisplayStyles' | 'showExplanationInSlide'>,
  isAnswerSlide: boolean
): SlideAnswerFlags => {
  const mode = effectiveAnswerMode(config);
  const allowRevealOnCurrentSlide = mode === 'separate_slide'
    ? isAnswerSlide
    : mode === 'highlight'
    ? true
    : isAnswerSlide;
  return {
    showOptionHighlight: allowRevealOnCurrentSlide && hasAnswerDisplayStyle(config, 'highlight_option'),
    showAnswerPill: allowRevealOnCurrentSlide && hasAnswerDisplayStyle(config, 'answer_pill'),
    showExplanationCard: allowRevealOnCurrentSlide && hasAnswerDisplayStyle(config, 'explanation_card'),
  };
};

export interface SlideRef {
  item: MCQItem;
  questionIndex: number; // index into the deck items (question-number badge + answer lookup)
  totalQuestions: number;
  isAnswerSlide: boolean; // true → render the answer variant of this question
  physicalIndex: number; // position in the expanded slide list (prev/next + counter)
  totalSlides: number;
}

// Expands a deck into the ordered list of physical slides. In 'separate_slide'
// mode every question emits two slides: question then answer. Otherwise one.
export const expandDeckSlides = (items: MCQItem[], config: Pick<DeckConfig, 'answerMode' | 'showAnswerInSlide'>): SlideRef[] => {
  const separate = effectiveAnswerMode(config) === 'separate_slide';
  const totalQuestions = items.length;
  const out: SlideRef[] = [];
  items.forEach((item, qi) => {
    const questionRef: SlideRef = {
      item,
      questionIndex: qi,
      totalQuestions,
      isAnswerSlide: false,
      physicalIndex: out.length,
      totalSlides: 0, // patched below
    };
    out.push(questionRef);
    if (separate) {
      out.push({
        item,
        questionIndex: qi,
        totalQuestions,
        isAnswerSlide: true,
        physicalIndex: out.length,
        totalSlides: 0,
      });
    }
  });
  const total = out.length;
  for (const ref of out) ref.totalSlides = total;
  return out;
};

// Physical index of a question's QUESTION slide (used when a question is clicked
// in the deck list — jump to its question slide, not its answer slide).
export const questionSlideIndex = (slides: SlideRef[], questionIndex: number): number => {
  const idx = slides.findIndex(s => s.questionIndex === questionIndex && !s.isAnswerSlide);
  return idx >= 0 ? idx : questionIndex;
};
