import { describe, it, expect } from 'vitest';
import { resolveTheme, areThemesEqual } from '../themeResolver';
import { DeckConfig } from '../../types';

describe('themeResolver', () => {
  const baseConfig: DeckConfig = {
    templateId: 'nobel-dark',
    brandName: "NOBEL'S CLASSROOM",
    logoUrl: '',
    logoSize: 'md',
    logoPosition: 'top-left',
    headerTitle: 'Biology Chapter 1',
    badgeTag: 'SSC | Biology',
    footerTag: 'BIOMISSION',
    watermarkAvatar: '',
    watermarkHandle: 'Instructor',
    aspectRatio: '16:9',
    showAnswerInSlide: true,
    showExplanationInSlide: false,
    questionNumberFormat: 'bangla',
    bgPreset: 'none',
    bgImageOpacity: 0.85,
    bgOverlayDarkness: 0.4,
  };

  it('resolves a built-in dark template correctly', () => {
    const theme = resolveTheme(baseConfig);
    expect(theme.templateId).toBe('nobel-dark');
    expect(theme.themeType).toBe('dark');
    expect(theme.isLight).toBe(false);
    expect(theme.colors.bgHex).toBe('020617');
    expect(theme.colors.bg).toBe('#020617');
    expect(theme.colors.ink).toBe('#f8fafc');
    expect(theme.fonts.defaultFont).toBe("'Hind Siliguri', sans-serif");
    expect(theme.cssVariables['--brand-bg']).toBe('#020617');
  });

  it('resolves a built-in light template correctly', () => {
    const lightConfig: DeckConfig = { ...baseConfig, templateId: 'minimal-light' };
    const theme = resolveTheme(lightConfig);
    expect(theme.themeType).toBe('light');
    expect(theme.isLight).toBe(true);
    expect(theme.colors.ink).toBe('#0f172a');
    expect(theme.colors.cardBorderInk).toBe('#e2e8f0');
  });

  it('respects custom accent color override', () => {
    const overrideConfig: DeckConfig = { ...baseConfig, accentColorCustom: '#ff0055' };
    const theme = resolveTheme(overrideConfig);
    expect(theme.colors.accentColorHex).toBe('FF0055');
    expect(theme.colors.accentColor).toBe('#ff0055');
    expect(theme.cssVariables['--brand-accent']).toBe('#ff0055');
  });

  it('resolves customTheme object properly', () => {
    const customConfig: DeckConfig = {
      ...baseConfig,
      templateId: 'custom-theme',
      customTheme: {
        bg: '#121212',
        cardBg: '#1e1e1e',
        cardBorder: '#333333',
        titleColor: '#00ffcc',
        textColor: '#ffffff',
        badgeBg: '#00ffcc',
        badgeText: '#000000',
        optionBg: '#252525',
        optionBorder: '#444444',
        optionSelectedBg: '#005544',
        optionSelectedBorder: '#00ffcc',
        optionSelectedText: '#ffffff',
        accentColor: '#00ffcc',
      },
    };
    const theme = resolveTheme(customConfig);
    expect(theme.colors.bgHex).toBe('121212');
    expect(theme.colors.titleColor).toBe('#00ffcc');
    expect(theme.colors.accentColor).toBe('#00ffcc');
  });

  it('resolves background presets and custom font overrides', () => {
    const bgConfig: DeckConfig = {
      ...baseConfig,
      bgPreset: 'dark_chalkboard',
      fontFamily: "'Poppins', sans-serif",
      headerFont: "'Playfair Display', serif",
    };
    const theme = resolveTheme(bgConfig);
    expect(theme.background.presetId).toBe('dark_chalkboard');
    expect(theme.background.url).toContain('data:image/svg+xml');
    expect(theme.fonts.defaultFont).toBe("'Poppins', sans-serif");
    expect(theme.fonts.headerFont).toBe("'Playfair Display', serif");
    expect(theme.fonts.bodyFont).toBe("'Poppins', sans-serif");
  });

  it('correctly compares theme equality with areThemesEqual', () => {
    const configA = { ...baseConfig };
    const configB = { ...baseConfig };
    const configC = { ...baseConfig, accentColorCustom: '#123456' };

    expect(areThemesEqual(configA, configB)).toBe(true);
    expect(areThemesEqual(configA, configC)).toBe(false);
  });
});
