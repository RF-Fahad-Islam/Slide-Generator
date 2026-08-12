import { DeckConfig, CustomThemeColors, BgImageFit, TemplateDefinition } from '../types';
import { getTemplateById } from '../templates/registry';
import { getBackgroundPresetUrl } from './backgroundPresets';

export interface ResolvedColors {
  // Theme polarity — mirrors ResolvedTheme.isLight for renderers that only
  // receive the colors object (e.g. PPTX export).
  isLight: boolean;

  // Raw 6-digit hex string without '#' (e.g. "0F172A"), useful for PPTX export & native canvas
  bgHex: string;
  cardBgHex: string;
  cardBorderHex: string;
  titleColorHex: string;
  textColorHex: string;
  badgeFillHex: string;
  badgeTextHex: string;
  optionBgHex: string;
  optionBorderHex: string;
  optionSelectedBgHex: string;
  optionSelectedBorderHex: string;
  optionSelectedTextHex: string;
  accentColorHex: string;

  // Formatted CSS colors with '#' (e.g. "#0f172a"), useful for DOM inline styles & Tailwind
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
  accentColor: string;

  // Contextual Ink & UI helper colors
  ink: string;             // '#0f172a' for light theme, '#f8fafc' for dark
  inkMuted: string;        // '#475569' for light theme, '#94a3b8' for dark
  titleInk: string;        // '#0f172a' for light theme, '#ffffff' for dark
  cardBorderInk: string;   // '#e2e8f0' for light theme, '#334155' for dark
  romanBadgeBg: string;
  romanBadgeBorder: string;
}

export interface ResolvedBackground {
  presetId: DeckConfig['bgPreset'];
  url: string;              // Resolved Data URL or image path
  opacity: number;          // 0.0 to 1.0 (default 0.85)
  overlayDarkness: number;  // 0.0 to 0.9 (default 0.4)
  fit: BgImageFit;          // 'cover' | 'contain' | 'stretch'
  cssSize: string;          // 'cover' | 'contain' | '100% 100%'
  cssPosition: string;      // 'center'
  gradientStops?: [string, string, string]; // 6-digit hex stops if gradient
  bgClass: string;          // Tailwind background class
  cardBgClass: string;      // Tailwind card background class
  style: React.CSSProperties; // Pre-calculated background CSS properties for container elements
}

export interface ResolvedFonts {
  defaultFont: string;      // Global base font e.g. "'Hind Siliguri', sans-serif"
  headerFont: string;
  bodyFont: string;
  optionsFont: string;
  footerFont: string;
}

export interface ResolvedTheme {
  template: TemplateDefinition;
  templateId: string;
  templateName: string;
  themeType: 'dark' | 'light';
  isLight: boolean;
  colors: ResolvedColors;
  background: ResolvedBackground;
  fonts: ResolvedFonts;
  cssVariables: Record<string, string>;
}

// Clean any hex string to 6-digit uppercase hex without '#'
const normalizeHex = (hex: string | undefined, fallback: string = '0F172A'): string => {
  if (!hex) return fallback.toUpperCase();
  const clean = hex.replace('#', '').trim();
  if (/^[0-9A-Fa-f]{6}$/.test(clean)) return clean.toUpperCase();
  if (/^[0-9A-Fa-f]{3}$/.test(clean)) {
    return (clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2]).toUpperCase();
  }
  return fallback.toUpperCase();
};

const toCssHex = (hex: string): string => `#${normalizeHex(hex).toLowerCase()}`;

/**
 * Single authoritative theme resolution function.
 * Merges global DeckConfig with slide-level customConfig overrides, resolves template,
 * normalizes colors, backgrounds, fonts, and generates CSS variables.
 */
export function resolveTheme(
  config: DeckConfig,
  itemCustomConfig?: Partial<DeckConfig>
): ResolvedTheme {
  const effectiveConfig: DeckConfig = {
    ...config,
    ...(itemCustomConfig || {}),
  };

  const template = getTemplateById(effectiveConfig.templateId, effectiveConfig.customTheme);
  const styles = template.styles;
  const isLight = template.themeType === 'light';
  const rawHex = styles.hexColors;

  // Accent color precedence: effectiveConfig.accentColorCustom > customTheme.accentColor > styles.accentColor
  const resolvedAccentHex = normalizeHex(
    effectiveConfig.accentColorCustom ||
      effectiveConfig.customTheme?.accentColor ||
      styles.accentColor ||
      '#f59e0b',
    'F59E0B'
  );

  const bgHex = normalizeHex(rawHex.bg, isLight ? 'FFFFFF' : '020617');
  const cardBgHex = normalizeHex(rawHex.cardBg, isLight ? 'F8FAFC' : '0F172A');
  const cardBorderHex = normalizeHex(rawHex.cardBorder, isLight ? 'CBD5E1' : '334155');
  const titleColorHex = normalizeHex(rawHex.titleColor, isLight ? '312E81' : 'F59E0B');
  const textColorHex = normalizeHex(rawHex.textColor, isLight ? '0F172A' : 'FFFFFF');
  const badgeFillHex = normalizeHex(rawHex.badgeFill, resolvedAccentHex);
  const badgeTextHex = normalizeHex(rawHex.badgeText, isLight ? 'FFFFFF' : '020617');
  const optionBgHex = normalizeHex(rawHex.optionBg, isLight ? 'FFFFFF' : '1E293B');
  const optionBorderHex = normalizeHex(rawHex.optionBorder, isLight ? 'CBD5E1' : '334155');
  const optionSelectedBgHex = normalizeHex(rawHex.optionSelectedBg, isLight ? 'EEF2FF' : '78350F');
  const optionSelectedBorderHex = normalizeHex(rawHex.optionSelectedBorder, resolvedAccentHex);
  const optionSelectedTextHex = normalizeHex(rawHex.optionSelectedText, isLight ? '312E81' : 'FEF3C7');

  const colors: ResolvedColors = {
    isLight,

    bgHex,
    cardBgHex,
    cardBorderHex,
    titleColorHex,
    textColorHex,
    badgeFillHex,
    badgeTextHex,
    optionBgHex,
    optionBorderHex,
    optionSelectedBgHex,
    optionSelectedBorderHex,
    optionSelectedTextHex,
    accentColorHex: resolvedAccentHex,

    bg: toCssHex(bgHex),
    cardBg: toCssHex(cardBgHex),
    cardBorder: toCssHex(cardBorderHex),
    titleColor: toCssHex(titleColorHex),
    textColor: toCssHex(textColorHex),
    badgeFill: toCssHex(badgeFillHex),
    badgeText: toCssHex(badgeTextHex),
    optionBg: toCssHex(optionBgHex),
    optionBorder: toCssHex(optionBorderHex),
    optionSelectedBg: toCssHex(optionSelectedBgHex),
    optionSelectedBorder: toCssHex(optionSelectedBorderHex),
    optionSelectedText: toCssHex(optionSelectedTextHex),
    accentColor: toCssHex(resolvedAccentHex),

    ink: isLight ? '#0f172a' : '#f8fafc',
    inkMuted: isLight ? '#475569' : '#94a3b8',
    titleInk: isLight ? '#0f172a' : '#ffffff',
    cardBorderInk: isLight ? '#e2e8f0' : '#334155',
    romanBadgeBg: `#${resolvedAccentHex}26`,
    romanBadgeBorder: `#${resolvedAccentHex}55`,
  };

  // Background resolution
  const bgPreset = effectiveConfig.bgPreset || 'none';
  const bgUrl = getBackgroundPresetUrl(bgPreset, effectiveConfig.bgImageUrl);
  const bgOpacity = effectiveConfig.bgImageOpacity !== undefined ? effectiveConfig.bgImageOpacity : 0.85;
  const overlayDarkness = effectiveConfig.bgOverlayDarkness !== undefined ? effectiveConfig.bgOverlayDarkness : 0.4;
  const bgFit: BgImageFit = effectiveConfig.bgImageFit || 'cover';
  const cssSize = bgFit === 'contain' ? 'contain' : bgFit === 'stretch' ? '100% 100%' : 'cover';

  const bgStyle: React.CSSProperties = {
    backgroundColor: colors.bg,
    fontFamily: effectiveConfig.fontFamily || styles.fontFamily || "'Hind Siliguri', sans-serif",
    ...(bgUrl
      ? {
          backgroundImage: `url("${bgUrl}")`,
          backgroundSize: cssSize,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }
      : {}),
  };

  const background: ResolvedBackground = {
    presetId: bgPreset,
    url: bgUrl,
    opacity: bgOpacity,
    overlayDarkness,
    fit: bgFit,
    cssSize,
    cssPosition: 'center',
    gradientStops: styles.bgGradientStops,
    bgClass: styles.bgClass,
    cardBgClass: styles.cardBg,
    style: bgStyle,
  };

  // Font resolution
  const defaultFont = effectiveConfig.fontFamily || styles.fontFamily || "'Hind Siliguri', sans-serif";
  const fonts: ResolvedFonts = {
    defaultFont,
    headerFont: effectiveConfig.headerFont || defaultFont,
    bodyFont: effectiveConfig.bodyFont || defaultFont,
    optionsFont: effectiveConfig.optionsFont || defaultFont,
    footerFont: effectiveConfig.footerFont || defaultFont,
  };

  // CSS variables for slide stage root
  const cssVariables: Record<string, string> = {
    '--brand-bg': colors.bg,
    '--brand-card-bg': colors.cardBg,
    '--brand-card-border': colors.cardBorder,
    '--brand-title-color': colors.titleColor,
    '--brand-text': colors.textColor,
    '--brand-accent': colors.accentColor,
    '--brand-badge-fill': colors.badgeFill,
    '--brand-badge-text': colors.badgeText,
    '--brand-font': fonts.defaultFont,
    '--brand-header-font': fonts.headerFont,
    '--brand-body-font': fonts.bodyFont,
    '--brand-options-font': fonts.optionsFont,
    '--brand-footer-font': fonts.footerFont,
  };

  return {
    template,
    templateId: template.id,
    templateName: template.name,
    themeType: template.themeType,
    isLight,
    colors,
    background,
    fonts,
    cssVariables,
  };
}

/**
 * Checks if two deck configs resolve to the exact same visual theme settings.
 */
export function areThemesEqual(a: DeckConfig, b: DeckConfig): boolean {
  if (a.templateId !== b.templateId) return false;
  if (a.accentColorCustom !== b.accentColorCustom) return false;
  if (a.bgPreset !== b.bgPreset) return false;
  if (a.bgImageUrl !== b.bgImageUrl) return false;
  if (a.bgImageFit !== b.bgImageFit) return false;
  if (a.fontFamily !== b.fontFamily) return false;
  if (JSON.stringify(a.customTheme) !== JSON.stringify(b.customTheme)) return false;
  return true;
}
