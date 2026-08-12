import { DeckConfig, CustomThemeColors, AspectRatio } from '../types';

export interface GlobalDefaults {
  defaultDeckName: string;
  defaultTemplateId: string;
  defaultQuestionNumberFormat: 'bangla' | 'english' | 'q_prefix';

  // Brand Identity & Logo
  brandName: string;
  badgeTag: string;
  logoUrl: string;
  logoSize: DeckConfig['logoSize'];
  logoPosition: DeckConfig['logoPosition'];

  // Channel Footer Tag & Instructor Watermark
  footerTag: string;
  watermarkHandle: string;
  watermarkAvatar: string;

  // Background Graphics & Overlays
  bgPreset: DeckConfig['bgPreset'];
  bgImageUrl?: string;
  bgImageFit?: DeckConfig['bgImageFit'];
  bgImageOpacity: number;
  bgOverlayDarkness: number;

  // Banners & Watermarks
  useHeaderBanner?: boolean;
  headerBannerUrl?: string;
  useFooterBanner?: boolean;
  footerBannerUrl?: string;

  // Typography & Themes
  fontFamily: string;
  accentColorCustom?: string;
  customTheme?: CustomThemeColors;

  // Layout & Header Mode
  layoutMode: DeckConfig['layoutMode'];
  headerType: DeckConfig['headerType'];
  aspectRatio: AspectRatio;

  // Granular Typography Controls (mirrors DeckSettings "Typography" tab)
  headerFont?: string;
  headerFontSize?: DeckConfig['headerFontSize'];
  bodyFont?: string;
  bodyFontSize?: DeckConfig['bodyFontSize'];
  bodyFontWeight?: DeckConfig['bodyFontWeight'];
  questionAlignment?: DeckConfig['questionAlignment'];
  questionPosition?: DeckConfig['questionPosition'];
  optionsFont?: string;
  optionsFontSize?: DeckConfig['optionsFontSize'];
  optionsFontWeight?: DeckConfig['optionsFontWeight'];
  optionsLayout?: DeckConfig['optionsLayout'];
  optionsAlignment?: DeckConfig['optionsAlignment'];
  footerFont?: string;
  footerFontSize?: DeckConfig['footerFontSize'];

  // Default Answer Reveal Behavior
  answerMode: DeckConfig['answerMode'];
  showAnswerInSlide: boolean;
  answerDisplayStyles?: DeckConfig['answerDisplayStyles'];
  showExplanationInSlide: boolean;

  // Mandatory Element Visibility Toggles
  showQuestionNumber: boolean;
  showInstructorInfo: boolean;
  showBrandLogo: boolean;
  showPagingCounter: boolean;
}

const GLOBAL_DEFAULTS_KEY = 'mcqgen.globalDefaults_v2';

export const DEFAULT_GLOBAL_DEFAULTS: GlobalDefaults = {
  defaultDeckName: 'Untitled Deck',
  defaultTemplateId: 'nobel-dark',
  defaultQuestionNumberFormat: 'bangla',
  brandName: "RAKIB'S CLASSROOM",
  badgeTag: '৯ম-১০ম শ্রেণি | জীববিজ্ঞান',
  logoUrl: '',
  logoSize: 'md',
  logoPosition: 'top-left',
  footerTag: 'BIOMISSION',
  watermarkHandle: 'Hasnat Shuvro',
  watermarkAvatar: '',
  bgPreset: 'none',
  bgImageUrl: undefined,
  bgImageFit: 'cover',
  bgImageOpacity: 0.85,
  bgOverlayDarkness: 0.4,
  useHeaderBanner: false,
  headerBannerUrl: undefined,
  useFooterBanner: false,
  footerBannerUrl: undefined,
  fontFamily: "'Hind Siliguri', sans-serif",
  accentColorCustom: undefined,
  customTheme: undefined,
  layoutMode: 'standard',
  headerType: 'manual',
  aspectRatio: '16:9',
  headerFont: undefined,
  headerFontSize: undefined,
  bodyFont: undefined,
  bodyFontSize: undefined,
  bodyFontWeight: undefined,
  questionAlignment: undefined,
  questionPosition: undefined,
  optionsFont: undefined,
  optionsFontSize: undefined,
  optionsFontWeight: undefined,
  optionsLayout: undefined,
  optionsAlignment: undefined,
  footerFont: undefined,
  footerFontSize: undefined,
  answerMode: 'hidden',
  showAnswerInSlide: false,
  answerDisplayStyles: undefined,
  showExplanationInSlide: false,
  showQuestionNumber: true,
  showInstructorInfo: true,
  showBrandLogo: true,
  showPagingCounter: true,
};

export const loadGlobalDefaults = (): GlobalDefaults => {
  try {
    const raw = localStorage.getItem(GLOBAL_DEFAULTS_KEY);
    if (!raw) return DEFAULT_GLOBAL_DEFAULTS;
    return { ...DEFAULT_GLOBAL_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_GLOBAL_DEFAULTS;
  }
};

export const saveGlobalDefaults = (defaults: GlobalDefaults): void => {
  try {
    localStorage.setItem(GLOBAL_DEFAULTS_KEY, JSON.stringify(defaults));
  } catch {
    // localStorage unavailable — keep in-memory only
  }
};

/**
 * Creates a complete, fully-hydrated DeckConfig object initialized with the
 * user's saved global defaults for brand identity, logo, background, font, and theme.
 */
export const createDefaultDeckConfig = (overrides?: Partial<DeckConfig>): DeckConfig => {
  const defaults = loadGlobalDefaults();
  return {
    deckName: overrides?.deckName || defaults.defaultDeckName,
    templateId: overrides?.templateId || defaults.defaultTemplateId,
    questionNumberFormat: overrides?.questionNumberFormat || defaults.defaultQuestionNumberFormat,
    brandName: overrides?.brandName ?? defaults.brandName,
    badgeTag: overrides?.badgeTag ?? defaults.badgeTag,
    logoUrl: overrides?.logoUrl ?? defaults.logoUrl,
    logoSize: overrides?.logoSize ?? defaults.logoSize,
    logoPosition: overrides?.logoPosition ?? defaults.logoPosition,
    bgPreset: overrides?.bgPreset ?? defaults.bgPreset,
    bgImageUrl: overrides?.bgImageUrl ?? defaults.bgImageUrl,
    bgImageFit: overrides?.bgImageFit ?? defaults.bgImageFit,
    bgImageOpacity: overrides?.bgImageOpacity ?? defaults.bgImageOpacity,
    bgOverlayDarkness: overrides?.bgOverlayDarkness ?? defaults.bgOverlayDarkness,
    useHeaderBanner: overrides?.useHeaderBanner ?? defaults.useHeaderBanner,
    headerBannerUrl: overrides?.headerBannerUrl ?? defaults.headerBannerUrl,
    useFooterBanner: overrides?.useFooterBanner ?? defaults.useFooterBanner,
    footerBannerUrl: overrides?.footerBannerUrl ?? defaults.footerBannerUrl,
    fontFamily: overrides?.fontFamily ?? defaults.fontFamily,
    accentColorCustom: overrides?.accentColorCustom ?? defaults.accentColorCustom,
    customTheme: overrides?.customTheme ?? defaults.customTheme,
    layoutMode: overrides?.layoutMode ?? defaults.layoutMode,
    headerType: overrides?.headerType ?? defaults.headerType,
    headerFont: overrides?.headerFont ?? defaults.headerFont,
    headerFontSize: overrides?.headerFontSize ?? defaults.headerFontSize,
    bodyFont: overrides?.bodyFont ?? defaults.bodyFont,
    bodyFontSize: overrides?.bodyFontSize ?? defaults.bodyFontSize,
    bodyFontWeight: overrides?.bodyFontWeight ?? defaults.bodyFontWeight,
    questionAlignment: overrides?.questionAlignment ?? defaults.questionAlignment,
    questionPosition: overrides?.questionPosition ?? defaults.questionPosition,
    optionsFont: overrides?.optionsFont ?? defaults.optionsFont,
    optionsFontSize: overrides?.optionsFontSize ?? defaults.optionsFontSize,
    optionsFontWeight: overrides?.optionsFontWeight ?? defaults.optionsFontWeight,
    optionsLayout: overrides?.optionsLayout ?? defaults.optionsLayout,
    optionsAlignment: overrides?.optionsAlignment ?? defaults.optionsAlignment,
    footerFont: overrides?.footerFont ?? defaults.footerFont,
    footerFontSize: overrides?.footerFontSize ?? defaults.footerFontSize,
    headerTitle: overrides?.headerTitle || 'অধ্যায় ৮ঃ রেচন প্রক্রিয়া',
    footerTag: overrides?.footerTag ?? defaults.footerTag,
    watermarkAvatar: overrides?.watermarkAvatar ?? defaults.watermarkAvatar,
    watermarkHandle: overrides?.watermarkHandle ?? defaults.watermarkHandle,
    aspectRatio: overrides?.aspectRatio ?? defaults.aspectRatio,
    showAnswerInSlide: overrides?.showAnswerInSlide ?? defaults.showAnswerInSlide,
    answerMode: overrides?.answerMode ?? defaults.answerMode,
    answerDisplayStyles: overrides?.answerDisplayStyles ?? defaults.answerDisplayStyles,
    showExplanationInSlide: overrides?.showExplanationInSlide ?? defaults.showExplanationInSlide,
    showQuestionNumber: overrides?.showQuestionNumber ?? defaults.showQuestionNumber,
    showInstructorInfo: overrides?.showInstructorInfo ?? defaults.showInstructorInfo,
    showBrandLogo: overrides?.showBrandLogo ?? defaults.showBrandLogo,
    showPagingCounter: overrides?.showPagingCounter ?? defaults.showPagingCounter,
    ...overrides,
  };
};
