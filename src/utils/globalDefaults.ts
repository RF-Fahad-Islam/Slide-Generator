import { DeckConfig, CustomThemeColors } from '../types';

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
}

const GLOBAL_DEFAULTS_KEY = 'mcqgen.globalDefaults_v2';

export const DEFAULT_GLOBAL_DEFAULTS: GlobalDefaults = {
  defaultDeckName: 'Untitled Deck',
  defaultTemplateId: 'nobel-dark',
  defaultQuestionNumberFormat: 'bangla',
  brandName: "NOBEL'S CLASSROOM",
  badgeTag: '৯ম-১০ম শ্রেণি | জীববিজ্ঞান',
  logoUrl: '',
  logoSize: 'md',
  logoPosition: 'top-left',
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
    headerTitle: overrides?.headerTitle || 'অধ্যায় ৮ঃ রেচন প্রক্রিয়া',
    footerTag: overrides?.footerTag || 'BIOMISSION',
    watermarkAvatar: overrides?.watermarkAvatar || '',
    watermarkHandle: overrides?.watermarkHandle || 'Hasnat Shuvro',
    aspectRatio: overrides?.aspectRatio || '16:9',
    showAnswerInSlide: overrides?.showAnswerInSlide ?? false,
    answerMode: overrides?.answerMode || 'hidden',
    showExplanationInSlide: overrides?.showExplanationInSlide ?? false,
    ...overrides,
  };
};
