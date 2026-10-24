import { FONT_PRESETS, FontPreset } from './fontPresets';

export interface CustomFontItem {
  id: string;
  name: string;
  family: string;
  category: 'bangla_clean' | 'bangla_traditional' | 'bangla_display' | 'english_modern' | 'english_serif' | 'custom_imported';
  description: string;
  sampleBangla: string;
  sampleEnglish: string;
  isCustom?: boolean;
  dataUrl?: string;
}

const STORAGE_KEY = 'social_post_custom_fonts_v1';

// Additional popular web & system fonts
export const EXTENDED_BUILTIN_FONTS: CustomFontItem[] = [
  ...FONT_PRESETS.map((p) => ({
    id: p.id,
    name: p.name,
    family: p.family,
    category: p.category,
    description: p.description,
    sampleBangla: p.sampleBangla,
    sampleEnglish: p.sampleEnglish,
  })),
  {
    id: 'inter',
    name: 'Inter (Clean UI Sans)',
    family: "'Inter', sans-serif",
    category: 'english_modern',
    description: 'World-standard modern interface font, extremely readable at small sizes.',
    sampleBangla: '১. মানবদেহের রক্তের স্বাভাবিক pH কত?',
    sampleEnglish: 'Normal Blood pH Level: 7.35 - 7.45',
  },
  {
    id: 'outfit',
    name: 'Outfit (Modern Geometric)',
    family: "'Outfit', sans-serif",
    category: 'english_modern',
    description: 'Sharp, modern geometric sans-serif that looks crisp on social media posts.',
    sampleBangla: '২. ক্লোরোপ্লাস্টের প্রধান কাজ কোনটি?',
    sampleEnglish: 'Photosynthesis & Energy Synthesis',
  },
  {
    id: 'montserrat',
    name: 'Montserrat (Bold Headline)',
    family: "'Montserrat', sans-serif",
    category: 'english_modern',
    description: 'High impact headline font for striking quiz banners and slide headers.',
    sampleBangla: '৩. জীববিজ্ঞানের জনক কে?',
    sampleEnglish: 'Aristotle: The Father of Biology',
  },
  {
    id: 'roboto',
    name: 'Roboto (Google Standard)',
    family: "'Roboto', sans-serif",
    category: 'english_modern',
    description: 'Balanced Android & YouTube standard font with broad language support.',
    sampleBangla: '৪. পরমাণুর নিউক্লিয়াসে কী থাকে?',
    sampleEnglish: 'Protons and Neutrons in Nucleus',
  },
  {
    id: 'fira-code',
    name: 'Fira Code (Monospace & Tech)',
    family: "'Fira Code', monospace",
    category: 'english_modern',
    description: 'Monospace font with programming ligatures, great for coding and math.',
    sampleBangla: '৫. বাইনারি কোড ও অ্যালগরিদম',
    sampleEnglish: 'const result = calculateEnergy(m, c);',
  },
];

/**
 * Retrieve saved custom fonts from localStorage
 */
export function getSavedCustomFonts(): CustomFontItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Register a font data URL with the browser via CSS FontFace API
 */
export async function registerFontFace(name: string, dataUrl: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('FontFace' in window)) return false;
  try {
    const cleanFamily = name.replace(/['"]/g, '').trim();
    const font = new FontFace(cleanFamily, `url("${dataUrl}")`);
    const loaded = await font.load();
    document.fonts.add(loaded);
    return true;
  } catch (err) {
    console.warn(`[CustomFont] Failed to load FontFace: ${name}`, err);
    return false;
  }
}

/**
 * Load a Google Font dynamically via <link> injection
 */
export function injectGoogleFont(fontName: string): string {
  if (typeof document === 'undefined') return `'${fontName}', sans-serif`;
  const cleanName = fontName.trim();
  const linkId = `gfont-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    const familyQuery = cleanName.replace(/\s+/g, '+') + ':wght@400;600;700;800';
    link.href = `https://fonts.googleapis.com/css2?family=${familyQuery}&display=swap`;
    document.head.appendChild(link);
  }
  return `'${cleanName}', sans-serif`;
}

/**
 * Import a custom font from a user-uploaded File (.ttf, .otf, .woff, .woff2)
 */
export async function importCustomFontFromFile(file: File): Promise<CustomFontItem> {
  const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
  const cleanFamily = baseName.replace(/['"]/g, '');
  const fontId = `custom-font-${Date.now()}-${cleanFamily.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read font file'));
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        reject(new Error('Empty font file'));
        return;
      }

      await registerFontFace(cleanFamily, dataUrl);

      const newFont: CustomFontItem = {
        id: fontId,
        name: cleanFamily,
        family: `'${cleanFamily}', sans-serif`,
        category: 'custom_imported',
        description: `Imported font file: ${file.name}`,
        sampleBangla: '১. আমার সোনার বাংলা, আমি তোমায় ভালোবাসি।',
        sampleEnglish: 'The quick brown fox jumps over the lazy dog.',
        isCustom: true,
        dataUrl,
      };

      // Save to localStorage
      try {
        const existing = getSavedCustomFonts();
        const updated = [newFont, ...existing.filter((f) => f.name !== cleanFamily)];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('[CustomFont] LocalStorage save limit reached', err);
      }

      resolve(newFont);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Get all available fonts (Extended built-in + Saved custom user fonts)
 */
export function getAllAvailableFonts(): CustomFontItem[] {
  const custom = getSavedCustomFonts();
  // Ensure all saved custom fonts are loaded into document.fonts
  if (typeof window !== 'undefined') {
    custom.forEach((cf) => {
      if (cf.dataUrl) {
        registerFontFace(cf.name, cf.dataUrl).catch(() => {});
      }
    });
  }
  return [...custom, ...EXTENDED_BUILTIN_FONTS];
}
