export type QuestionType = 'standard' | 'roman_statements' | 'passage';

/** How a background image maps onto the canvas: crop to fill (cover),
 *  fit the whole image with letterboxing (contain), or distort to fill (stretch). */
export type BgImageFit = 'cover' | 'contain' | 'stretch';

export interface MCQOption {
  key: string; // e.g. "A", "B", "C", "D" or "ক", "খ", "গ", "ঘ"
  text: string;
  isCorrect?: boolean;
}

export interface CustomThemeColors {
  name?: string;
  bg: string;
  cardBg: string;
  cardBorder: string;
  titleColor: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
  optionBg: string;
  optionBorder: string;
  optionSelectedBg: string;
  optionSelectedBorder: string;
  optionSelectedText: string;
  accentColor: string;
}

export interface MCQTags {
  subject?: string;
  className?: string;
  paper?: string;
}

export interface MCQItem {
  id: string;
  questionType: QuestionType;
  stem: string; // Main question text
  stemType?: 'text' | 'latex' | 'image';
  stemImage?: string; // Optional base64 or image URL
  passage?: string; // Shared stimulus or reading passage
  romanItems?: string[]; // e.g., ["i. ইউরেটেরোস্কোপিক", "ii. আল্ট্রাসনিক লিথোট্রিপসি", "iii. অস্ত্রোপচার"]
  prompt?: string; // e.g., "নিচের কোনটি সঠিক?" or "Which of the following is correct?"
  options: MCQOption[];
  answer: string; // Key of correct option (e.g. "B" or "খ")
  source?: string[] | string; // One or more board/exam source tags, e.g. ["চট্টগ্রাম বোর্ড ২০১৭", "DU Admission 2023"]
  explanation?: string; // Detailed answer explanation
  tags?: MCQTags; // Optional filter tags (subject, class, paper, etc.)
  confidence?: 'high' | 'low';
  warnings?: string[];
  customConfig?: Partial<DeckConfig>; // Slide-level scope settings override
}

/**
 * Resolves the badge shown on a slide. `badgeTag` holds the base
 * class/subject tag (e.g. "৯ম-১০ম শ্রেণি | জীববিজ্ঞান"); when an optional
 * `chapterName` is set it is auto-appended so the badge reads
 * "৯ম-১০ম শ্রেণি | জীববিজ্ঞান | অধ্যায় ৮". The chapter is not duplicated if
 * it is already a segment of the base badge.
 */
export function getEffectiveBadgeTag(
  config: Pick<DeckConfig, 'badgeTag' | 'chapterName'>,
  item?: Pick<MCQItem, 'tags'>
): string {
  let base = (config.badgeTag || '').trim();

  // If item carries item-level class / subject tags, auto-compose "Class | Subject"
  if (item?.tags?.className || item?.tags?.subject) {
    const itemClass = (item.tags.className || '').trim();
    const itemSubject = (item.tags.subject || '').trim();
    if (itemClass && itemSubject) {
      base = `${itemClass} | ${itemSubject}`;
    } else if (itemClass) {
      base = itemClass;
    } else if (itemSubject) {
      base = itemSubject;
    }
  }

  const chapter = (config.chapterName || '').trim();
  if (!chapter) return base;
  if (!base) return chapter;

  const segments = base.split('|').map((s) => s.trim());
  if (segments.includes(chapter)) return base;
  return `${base} | ${chapter}`;
}

/**
 * Normalizes an MCQ's source into a string[] of source tags.
 * Handles legacy single-string `source` values from older saved decks.
 */
export function getSourceTags(item: Pick<MCQItem, 'source'>): string[] {
  if (Array.isArray(item.source)) {
    return item.source.filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
  }
  if (typeof item.source === 'string' && item.source.trim().length > 0) {
    return [item.source.trim()];
  }
  return [];
}

export interface SavedDeck {
  id: string;
  name: string;
  description?: string;
  subject?: string;
  badgeTag?: string;
  items: MCQItem[];
  config: DeckConfig;
  createdAt: number;
  updatedAt: number;
}

/**
 * A named container for the paste -> review -> approve flow (e.g. "SSC Questions").
 * Each workspace owns its own review queue and permanent approved history, and
 * mirrors approved items into `linkedDeckId` so they're also usable as a normal
 * SavedDeck in the Question Bank.
 */
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  defaultTags?: MCQTags; // Opt-in per paste batch — never applied automatically
  linkedDeckId: string; // SavedDeck.id in questionDecks, auto-created with the workspace
  reviewQueue: MCQItem[]; // Pasted/parsed, not yet approved
  approvedItems: MCQItem[]; // Permanent history, editable in place
  createdAt: number;
  updatedAt: number;
}

export type AspectRatio = '16:9' | '4:5' | '9:16';

export interface DeckConfig {
  templateId: string;
  deckName?: string; // Active deck display name (persisted with the deck config)
  customTheme?: CustomThemeColors;
  brandName: string;
  logoUrl: string;
  logoSize: 'sm' | 'md' | 'lg' | 'xl'; // e.g., sm=48px, md=64px, lg=80px, xl=100px
  logoPosition: 'top-left' | 'top-right' | 'header-inline';
  headerTitle: string; // Chapter / Subject e.g. "অধ্যায় ৮ঃ রেচন প্রক্রিয়া"
  badgeTag: string; // e.g. "৯ম-১০ম শ্রেণি | জীববিজ্ঞান"
  // Optional chapter name — auto-fills `headerTitle` and auto-appends to the
  // slide badge tag (see `getEffectiveBadgeTag`).
  chapterName?: string;
  footerTag: string; // e.g. "BIOMISSION"
  watermarkAvatar: string; // Instructor avatar URL
  watermarkHandle: string; // Instructor name / channel e.g. "Hasnat Shuvro"
  aspectRatio: AspectRatio;
  showAnswerInSlide: boolean; // Toggle for answer key highlighting on slide
  // Answer display mode — 'hidden' (question only) | 'highlight' (correct option
  // highlighted in-place on the question slide) | 'separate_slide' (an extra
  // answer slide after each question slide). Optional: saved decks without it
  // fall back to the legacy showAnswerInSlide boolean.
  answerMode?: 'hidden' | 'highlight' | 'separate_slide';
  // Granular multi-select display styles for answer reveal/highlight
  answerDisplayStyles?: ('highlight_option' | 'answer_pill' | 'explanation_card')[];
  showExplanationInSlide: boolean; // Toggle for showing explanation box
  questionNumberFormat: 'bangla' | 'english' | 'q_prefix'; // e.g. ১, 1, Q1
  accentColorCustom?: string;
  // Layout Mode: 'standard' (Full Width Center) or 'class_mode' (Left Question + Writing Space + Right Options)
  layoutMode?: 'standard' | 'class_mode';
  // Granular Font & Style Controls
  fontFamily?: string; // Global base font family CSS string
  headerType?: 'manual' | 'banner'; // Choose manual text header or custom uploaded header banner image
  headerFont?: string;
  headerFontSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  bodyFont?: string;
  bodyFontSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  bodyFontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  questionAlignment?: 'left' | 'center' | 'right';
  questionPosition?: 'top' | 'center';
  optionsFont?: string;
  optionsFontSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  optionsFontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  optionsLayout?: '1col' | '2col' | '4col';
  optionsAlignment?: 'left' | 'center' | 'right';
  footerFont?: string;
  footerFontSize?: 'xs' | 'sm' | 'md';
  // Custom Header & Footer Full-Width Banner Images
  useHeaderBanner?: boolean;
  headerBannerUrl?: string; // Base64 or Data URL for custom full-width header graphic
  useFooterBanner?: boolean;
  footerBannerUrl?: string; // Base64 or Data URL for custom full-width footer graphic
  // Background Image Controls
  bgPreset: 'none' | 'dark_chalkboard' | 'tech_mesh' | 'blue_studio' | 'geometric_dark' | 'paper_texture' | 'custom';
  bgImageUrl?: string; // Custom uploaded background image Data URL
  bgImageFit?: BgImageFit; // cover (default) | contain | stretch — how the image maps to the canvas
  bgImageOpacity: number; // 0.0 to 1.0
  bgOverlayDarkness: number; // 0.0 to 0.9 overlay tint for text legibility
  // Deck-wide text box overlay layer (editable in the preview tab, rendered on every slide)
  slideTextBoxes?: SlideTextBox[];
}

export type SlideTextBoxBind =
  | 'stem'
  | 'options'
  | 'answer'
  | 'explanation'
  | 'passage'
  | 'prompt'
  | 'roman'
  | 'source'
  | 'questionNumber'
  | 'brand'
  | 'headerTitle'
  | 'badgeTag'
  | 'footerTag'
  | 'watermark'
  | 'free'
  | 'icon'
  | 'image'
  | 'slideCounter';

// Container styling for pre-designed slide elements
export type SlideBoxShape = 'plain' | 'pill' | 'card' | 'banner';

export interface SlideTextBox {
  id: string;
  bind: SlideTextBoxBind;
  text?: string; // free text content (bind === 'free')
  x: number; // px, 0..1920
  y: number; // px, 0..1080
  w: number; // px
  h?: number; // px height — set for icon/image/styled elements; text boxes stay auto-height
  fontSize: number; // px (icons: rendered size)
  color: string;
  align: 'left' | 'center' | 'right';
  bold: boolean;
  fontFamily?: string; // per-box font override (falls back to deck config.fontFamily)
  // Pre-designed element extras
  shape?: SlideBoxShape; // container style: pill / card / banner (default 'plain' = no container)
  bg?: string; // container fill color for pill/card/banner shapes
  iconName?: string; // lucide icon key (bind === 'icon')
  imageUrl?: string; // image / banner data URL or http(s) (bind === 'image')
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  previewGradient: string;
  themeType: 'dark' | 'light';
  category: 'coaching_dark' | 'vibrant_blue' | 'classroom_green' | 'minimal_light' | 'pure_light' | 'neon_cyber';
  styles: {
    bgClass: string;
    cardBg: string;
    borderClass: string;
    titleColor: string;
    badgeBg: string;
    badgeText: string;
    optionBg: string;
    optionHover: string;
    optionSelectedBg: string;
    optionSelectedBorder: string;
    correctBadgeBg: string;
    accentColor: string;
    fontFamily: string;
    hexColors: {
      bg: string;
      cardBg: string;
      cardBorder: string;
      titleColor: string;
      textColor: string;
      badgeFill: string;
      badgeText: string;
      optionBg: string;
      optionBorder: string;
      optionSelectedBg: string;
      optionSelectedBorder: string;
      optionSelectedText: string;
    };
    // Hex approximation of the diagonal (to-br) 3-stop Tailwind gradient in
    // `bgClass`, for templates whose bgClass is a gradient — [from, via, to].
    // Omitted for flat (non-gradient) bgClass templates.
    bgGradientStops?: [string, string, string];
  };
}
