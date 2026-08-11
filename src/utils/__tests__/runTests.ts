import { resolveTheme, areThemesEqual } from '../themeResolver';
import { DeckConfig } from '../../types';
import { createDefaultDeckConfig } from '../globalDefaults';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('--- Running themeResolver tests ---');

// 1. Nobel Dark built-in template
const configDark: DeckConfig = createDefaultDeckConfig({
  templateId: 'nobel-dark',
});
const themeDark = resolveTheme(configDark);
assert(themeDark.templateId === 'nobel-dark', 'Resolves correct templateId');
assert(themeDark.isLight === false, 'nobel-dark is identified as dark theme');
assert(themeDark.colors.bgHex === '020617', 'Hex bg for nobel-dark is 020617');
assert(themeDark.colors.bg === '#020617', 'CSS bg for nobel-dark is #020617');
assert(themeDark.colors.ink === '#f8fafc', 'Ink for dark template is #f8fafc');

// 2. Minimal Light built-in template
const configLight: DeckConfig = createDefaultDeckConfig({
  templateId: 'minimal-light',
});
const themeLight = resolveTheme(configLight);
assert(themeLight.isLight === true, 'minimal-light is identified as light theme');
assert(themeLight.colors.ink === '#0f172a', 'Ink for light template is #0f172a');

// 3. Custom Accent Override
const configCustomAccent: DeckConfig = createDefaultDeckConfig({
  templateId: 'nobel-dark',
  accentColorCustom: '#ec4899',
});
const themeCustomAccent = resolveTheme(configCustomAccent);
assert(themeCustomAccent.colors.accentColor === '#ec4899', 'Custom accent override takes precedence');
assert(themeCustomAccent.colors.accentColorHex === 'EC4899', 'Custom accent hex normalized to EC4899');

// 4. Custom Theme Colors Object
const configCustomTheme: DeckConfig = createDefaultDeckConfig({
  templateId: 'custom-theme',
  customTheme: {
    bg: '#123456',
    cardBg: '#234567',
    cardBorder: '#345678',
    titleColor: '#ffffff',
    textColor: '#e2e8f0',
    badgeBg: '#ec4899',
    badgeText: '#ffffff',
    optionBg: '#1e293b',
    optionBorder: '#334155',
    optionSelectedBg: '#ec4899',
    optionSelectedBorder: '#f472b6',
    optionSelectedText: '#ffffff',
    accentColor: '#ec4899',
  },
});
const themeCustomTheme = resolveTheme(configCustomTheme);
assert(themeCustomTheme.colors.bg === '#123456', 'Custom theme bg resolved correctly');
assert(themeCustomTheme.colors.bgHex === '123456', 'Custom theme bgHex normalized correctly');
assert(themeCustomTheme.colors.accentColor === '#ec4899', 'Custom theme accent color resolved correctly');

// 5. Slide Item Custom Config Override
const itemCustomConfig = {
  accentColorCustom: '#10b981',
};
const themeItemOverride = resolveTheme(configDark, itemCustomConfig);
assert(themeItemOverride.colors.accentColor === '#10b981', 'Item customConfig override takes precedence');

// 6. Theme Equality
assert(areThemesEqual(configDark, createDefaultDeckConfig({ templateId: 'nobel-dark' })) === true, 'Equal configs return true');
assert(areThemesEqual(configDark, configLight) === false, 'Different configs return false');

console.log('🎉 ALL THEMERESOLVER TESTS PASSED CLEANLY!');
