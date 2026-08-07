import { CustomThemeColors, DeckConfig } from '../types';

// ---------------------------------------------------------------------------
// Saved custom template presets — a reusable snapshot of the design settings
// (theme, fonts, layout, background, banners, logo) that can be saved under a
// name and switched back to with one click. Persisted in localStorage.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'edtech_template_presets_v1';

export interface DeckDesignSnapshot {
  templateId: string;
  customTheme?: CustomThemeColors;
  accentColorCustom?: string;
  fontFamily?: string;
  headerType?: 'manual' | 'banner';
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
  layoutMode?: DeckConfig['layoutMode'];
  bgPreset: DeckConfig['bgPreset'];
  bgImageUrl?: string;
  bgImageFit?: DeckConfig['bgImageFit'];
  bgImageOpacity: number;
  bgOverlayDarkness: number;
  useHeaderBanner?: boolean;
  headerBannerUrl?: string;
  useFooterBanner?: boolean;
  footerBannerUrl?: string;
  logoUrl: string;
  logoSize: DeckConfig['logoSize'];
  logoPosition: DeckConfig['logoPosition'];
}

export interface DeckTemplatePreset {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  design: DeckDesignSnapshot;
}

const cloneConfigForSnap = (c: DeckConfig) => ({ ...c });

export const captureDesign = (config: DeckConfig): DeckDesignSnapshot => {
  const c = cloneConfigForSnap(config);
  return {
    templateId: c.templateId,
    customTheme: c.customTheme,
    accentColorCustom: c.accentColorCustom,
    fontFamily: c.fontFamily,
    headerType: c.headerType,
    headerFont: c.headerFont,
    headerFontSize: c.headerFontSize,
    bodyFont: c.bodyFont,
    bodyFontSize: c.bodyFontSize,
    bodyFontWeight: c.bodyFontWeight,
    questionAlignment: c.questionAlignment,
    questionPosition: c.questionPosition,
    optionsFont: c.optionsFont,
    optionsFontSize: c.optionsFontSize,
    optionsFontWeight: c.optionsFontWeight,
    optionsLayout: c.optionsLayout,
    optionsAlignment: c.optionsAlignment,
    footerFont: c.footerFont,
    footerFontSize: c.footerFontSize,
    layoutMode: c.layoutMode,
    bgPreset: c.bgPreset,
    bgImageUrl: c.bgImageUrl,
    bgImageFit: c.bgImageFit,
    bgImageOpacity: c.bgImageOpacity,
    bgOverlayDarkness: c.bgOverlayDarkness,
    useHeaderBanner: c.useHeaderBanner,
    headerBannerUrl: c.headerBannerUrl,
    useFooterBanner: c.useFooterBanner,
    footerBannerUrl: c.footerBannerUrl,
    logoUrl: c.logoUrl,
    logoSize: c.logoSize,
    logoPosition: c.logoPosition,
  };
};

export const applyDesign = (design: DeckDesignSnapshot): Partial<DeckConfig> => ({ ...design });

export const applyDesignToConfig = (preset: DeckTemplatePreset, config: DeckConfig): DeckConfig => ({
  ...config,
  ...preset.design,
});

export const getTemplatePresets = (): DeckTemplatePreset[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as DeckTemplatePreset[]) : [];
  } catch {
    return [];
  }
};

const persistPresets = (presets: DeckTemplatePreset[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // storage full / unavailable — keep silently
  }
};

export const saveTemplatePreset = (
  name: string,
  config: DeckConfig,
  description?: string
): DeckTemplatePreset => {
  const presets = getTemplatePresets();
  const trimmedName = name.trim() || 'Untitled Preset';
  const existing = presets.find(p => p.name.trim().toLowerCase() === trimmedName.toLowerCase());
  const preset: DeckTemplatePreset = {
    id: existing?.id ?? `preset_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: trimmedName,
    description: description?.trim() || existing?.description,
    createdAt: existing?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
    design: captureDesign(config),
  };
  persistPresets([...presets.filter(p => p.id !== preset.id), preset]);
  return preset;
};

export const deleteTemplatePreset = (id: string) => {
  persistPresets(getTemplatePresets().filter(p => p.id !== id));
};

export const renameTemplatePreset = (id: string, name: string, description?: string) => {
  persistPresets(getTemplatePresets().map(p => (p.id === id ? { ...p, name: name.trim() || p.name, description, updatedAt: Date.now() } : p)));
};
