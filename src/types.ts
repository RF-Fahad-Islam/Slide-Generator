export type QuestionType = 'standard' | 'roman_statements' | 'passage';

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
  source?: string; // e.g., "চট্টগ্রাম বোর্ড ২০১৭" / "DU Admission 2023"
  explanation?: string; // Detailed answer explanation
  confidence?: 'high' | 'low';
  warnings?: string[];
  customConfig?: Partial<DeckConfig>; // Slide-level scope settings override
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
  | 'image';

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
