import { DeckConfig, SlideTextBox } from '../types';
import { getTemplateById } from '../templates/registry';
import { classroomTextBoxes } from './slideElements';

// Builds the deck's text-box layer from the active preset template so the
// template's default layout IS editable text boxes. Mirrors the geometry and
// colors SlideCanvas uses when it renders the template chrome directly, so
// toggling into the box editor does not visually change the slide.

export const SLIDE_W = 1920;
export const SLIDE_H = 1080;
const PAD = 40;

let seq = 0;
const bid = (prefix: string) => `${prefix}_tpl${Date.now().toString(36)}${seq++}`;

const hexToRgba = (hex: string, alpha: number): string => {
  const clean = hex.replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Tailwind font-size classes (text-lg … text-6xl) as px — matches the classes
// SlideCanvas maps the DeckConfig size fields to.
const HEADER_SIZES: Record<string, number> = { xs: 20, sm: 24, md: 30, lg: 36, xl: 48 };
const BODY_SIZES: Record<string, number> = { sm: 20, md: 24, lg: 30, xl: 36, '2xl': 48, '3xl': 60 };
const OPTIONS_SIZES: Record<string, number> = { xs: 18, sm: 20, md: 24, lg: 30, xl: 36 };
const FOOTER_SIZES: Record<string, number> = { xs: 18, sm: 20, md: 24 };

export const templateToTextBoxes = (config: DeckConfig): SlideTextBox[] => {
  // Classroom view already has its own enforced box layout.
  if (config.layoutMode === 'class_mode') return classroomTextBoxes();

  const template = getTemplateById(config.templateId, config.customTheme);
  const styles = template.styles;
  const isLight = template.themeType === 'light';
  const hc = styles.hexColors;

  const textColor = `#${hc.textColor}`;
  const accent = styles.accentColor;
  const headerFont = config.headerFont || config.fontFamily || styles.fontFamily;
  const bodyFont = config.bodyFont || config.fontFamily || styles.fontFamily;
  const optionsFont = config.optionsFont || config.fontFamily || styles.fontFamily;
  const footerFont = config.footerFont || config.fontFamily || styles.fontFamily;

  const headerSize = HEADER_SIZES[config.headerFontSize || 'md'] || 30;
  const bodySize = BODY_SIZES[config.bodyFontSize || 'lg'] || 30;
  const optionsSize = OPTIONS_SIZES[config.optionsFontSize || 'md'] || 24;
  const footerSize = FOOTER_SIZES[config.footerFontSize || 'sm'] || 20;

  const boxes: SlideTextBox[] = [];
  const headerX = config.logoUrl ? PAD + 64 + 20 : PAD;

  // -------------------------------------------------------------------------
  // Header — banner image, or logo + brand + title + badge
  // -------------------------------------------------------------------------
  if ((config.headerType === 'banner' || config.useHeaderBanner) && config.headerBannerUrl) {
    boxes.push({
      id: bid('hdr_banner'),
      bind: 'image',
      x: PAD,
      y: PAD,
      w: SLIDE_W - PAD * 2,
      h: 140,
      fontSize: 0,
      color: '#ffffff',
      align: 'center',
      bold: false,
      imageUrl: config.headerBannerUrl,
    });
  } else {
    if (config.logoUrl) {
      boxes.push({
        id: bid('hdr_logo'),
        bind: 'image',
        x: PAD,
        y: PAD,
        w: 64,
        h: 64,
        fontSize: 0,
        color: '#ffffff',
        align: 'center',
        bold: false,
        imageUrl: config.logoUrl,
        shape: 'card',
        bg: 'rgba(255,255,255,0.08)',
      });
    }
    boxes.push({
      id: bid('hdr_brand'),
      bind: 'brand',
      x: headerX,
      y: PAD,
      w: 1000,
      fontSize: headerSize,
      color: textColor,
      align: 'left',
      bold: true,
      fontFamily: headerFont,
    });
    boxes.push({
      id: bid('hdr_title'),
      bind: 'headerTitle',
      x: headerX,
      y: PAD + headerSize + 14,
      w: 1000,
      fontSize: 18,
      color: accent,
      align: 'left',
      bold: false,
      fontFamily: headerFont,
    });
    if (config.badgeTag) {
      boxes.push({
        id: bid('hdr_badge'),
        bind: 'badgeTag',
        x: SLIDE_W - PAD - 640,
        y: 44,
        w: 640,
        fontSize: 18,
        color: `#${hc.badgeText}`,
        align: 'center',
        bold: true,
        fontFamily: headerFont,
        shape: 'pill',
        bg: hexToRgba(hc.badgeFill, isLight ? 0.9 : 0.22),
      });
    }
  }

  // -------------------------------------------------------------------------
  // Middle — stem card (number chip + stem + source + roman + prompt)
  // -------------------------------------------------------------------------
  const cardX = PAD;
  const cardW = SLIDE_W - PAD * 2;
  boxes.push({
    id: bid('mdl_card'),
    bind: 'free',
    text: '',
    x: cardX,
    y: 180,
    w: cardW,
    h: 470,
    fontSize: bodySize,
    color: textColor,
    align: 'left',
    bold: false,
    fontFamily: bodyFont,
    shape: 'card',
    bg: hexToRgba(hc.cardBg, isLight ? 0.95 : 0.9),
  });
  boxes.push({
    id: bid('mdl_qnum'),
    bind: 'questionNumber',
    x: cardX + 28,
    y: 204,
    w: 64,
    h: 48,
    fontSize: 26,
    color: isLight ? '#ffffff' : '#0f172a',
    align: 'center',
    bold: true,
    fontFamily: bodyFont,
    shape: 'card',
    bg: accent,
  });
  boxes.push({
    id: bid('mdl_stem'),
    bind: 'stem',
    x: cardX + 108,
    y: 208,
    w: cardW - 108 - 28,
    fontSize: bodySize,
    color: textColor,
    align: 'left',
    bold: true,
    fontFamily: bodyFont,
  });
  boxes.push({
    id: bid('mdl_source'),
    bind: 'source',
    x: SLIDE_W - PAD - 620,
    y: 214,
    w: 600,
    fontSize: 18,
    color: accent,
    align: 'right',
    bold: true,
    fontFamily: bodyFont,
  });
  boxes.push({
    id: bid('mdl_roman'),
    bind: 'roman',
    x: cardX + 28,
    y: 430,
    w: cardW - 56,
    fontSize: 20,
    color: textColor,
    align: 'left',
    bold: false,
    fontFamily: bodyFont,
    shape: 'card',
    bg: isLight ? 'rgba(15,23,42,0.06)' : 'rgba(0,0,0,0.25)',
  });
  boxes.push({
    id: bid('mdl_prompt'),
    bind: 'prompt',
    x: cardX + 28,
    y: 560,
    w: 1200,
    fontSize: 22,
    color: accent,
    align: 'left',
    bold: true,
    fontFamily: bodyFont,
  });

  // -------------------------------------------------------------------------
  // Options — vertical card stack (box renderer has no grid)
  // -------------------------------------------------------------------------
  boxes.push({
    id: bid('mdl_options'),
    bind: 'options',
    x: cardX,
    y: 670,
    w: cardW,
    fontSize: optionsSize,
    color: textColor,
    align: 'left',
    bold: false,
    fontFamily: optionsFont,
    shape: 'card',
    bg: hexToRgba(hc.optionBg, isLight ? 0.9 : 0.55),
  });

  // -------------------------------------------------------------------------
  // Explanation — shown when the deck has it enabled
  // -------------------------------------------------------------------------
  if (config.showExplanationInSlide) {
    boxes.push({
      id: bid('mdl_explanation'),
      bind: 'explanation',
      x: cardX,
      y: 960,
      w: cardW,
      fontSize: 20,
      color: textColor,
      align: 'left',
      bold: false,
      fontFamily: bodyFont,
      shape: 'card',
      bg: 'rgba(16,185,129,0.12)',
    });
  }

  // -------------------------------------------------------------------------
  // Footer — banner image, or watermark + footer tag
  // -------------------------------------------------------------------------
  if (config.useFooterBanner && config.footerBannerUrl) {
    boxes.push({
      id: bid('ftr_banner'),
      bind: 'image',
      x: PAD,
      y: SLIDE_H - PAD - 110,
      w: SLIDE_W - PAD * 2,
      h: 110,
      fontSize: 0,
      color: '#ffffff',
      align: 'center',
      bold: false,
      imageUrl: config.footerBannerUrl,
    });
  } else {
    boxes.push({
      id: bid('ftr_watermark'),
      bind: 'watermark',
      x: PAD,
      y: SLIDE_H - PAD - 44,
      w: 900,
      fontSize: footerSize,
      color: textColor,
      align: 'left',
      bold: true,
      fontFamily: footerFont,
    });
    boxes.push({
      id: bid('ftr_tag'),
      bind: 'footerTag',
      x: SLIDE_W - PAD - 700,
      y: SLIDE_H - PAD - 44,
      w: 700,
      fontSize: footerSize,
      color: accent,
      align: 'right',
      bold: true,
      fontFamily: footerFont,
    });
  }

  return boxes;
};
