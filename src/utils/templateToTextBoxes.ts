import { DeckConfig, SlideTextBox } from '../types';
import { resolveTheme } from './themeResolver';
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

  const theme = resolveTheme(config);
  const isLight = theme.isLight;
  const hc = theme.colors;

  const textColor = theme.colors.textColor;
  const accent = theme.colors.accentColor;
  const headerFont = theme.fonts.headerFont;
  const bodyFont = theme.fonts.bodyFont;
  const optionsFont = theme.fonts.optionsFont;
  const footerFont = theme.fonts.footerFont;

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
    if (config.badgeTag || config.chapterName) {
      boxes.push({
        id: bid('hdr_badge'),
        bind: 'badgeTag',
        x: SLIDE_W - PAD - 130 - 440,
        y: 44,
        w: 440,
        fontSize: 18,
        color: isLight ? '#78350f' : '#fcd34d',
        align: 'right',
        bold: true,
        fontFamily: headerFont,
        shape: 'pill',
        bg: isLight ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.22)',
      });
    }
    boxes.push({
      id: bid('hdr_counter'),
      bind: 'slideCounter',
      x: SLIDE_W - PAD - 110,
      y: 44,
      w: 110,
      h: 44,
      fontSize: 18,
      color: '#fcd34d',
      align: 'center',
      bold: true,
      fontFamily: headerFont,
      shape: 'card',
      bg: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(15,23,42,0.9)',
    });
  }

  // -------------------------------------------------------------------------
  // Middle — question card. Sized proportionally (280px tall) to host the
  // number chip, stem, source, roman statements, and prompt.
  // -------------------------------------------------------------------------
  const cardX = PAD;
  const cardW = SLIDE_W - PAD * 2;
  const cardY = 150;
  const cardH = 280;
  const innerX = cardX + 36;
  const innerW = cardW - 72;
  boxes.push({
    id: bid('mdl_card'),
    bind: 'free',
    text: '',
    x: cardX,
    y: cardY,
    w: cardW,
    h: cardH,
    fontSize: bodySize,
    color: textColor,
    align: 'left',
    bold: false,
    fontFamily: bodyFont,
    shape: 'card',
    bg: hexToRgba(hc.cardBgHex, isLight ? 0.95 : 0.9),
  });
  boxes.push({
    id: bid('mdl_qnum'),
    bind: 'questionNumber',
    x: innerX,
    y: cardY + 22,
    w: 120,
    h: 46,
    fontSize: 22,
    color: isLight ? '#ffffff' : '#0f172a',
    align: 'center',
    bold: true,
    fontFamily: bodyFont,
    shape: 'card',
    bg: accent,
  });
  boxes.push({
    id: bid('mdl_source'),
    bind: 'source',
    x: SLIDE_W - PAD - 36 - 354,
    y: cardY + 28,
    w: 354,
    fontSize: 18,
    color: accent,
    align: 'right',
    bold: true,
    fontFamily: bodyFont,
  });
  boxes.push({
    id: bid('mdl_stem'),
    bind: 'stem',
    x: innerX,
    y: cardY + 86,
    w: innerW,
    fontSize: bodySize,
    color: textColor,
    align: 'left',
    bold: true,
    fontFamily: bodyFont,
  });
  boxes.push({
    id: bid('mdl_roman'),
    bind: 'roman',
    x: innerX,
    y: cardY + 155,
    w: innerW,
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
    x: innerX,
    y: cardY + 225,
    w: innerW,
    fontSize: 22,
    color: accent,
    align: 'left',
    bold: true,
    fontFamily: bodyFont,
  });

  // -------------------------------------------------------------------------
  // Options — sits directly below the question card (y: 450)
  // -------------------------------------------------------------------------
  boxes.push({
    id: bid('mdl_options'),
    bind: 'options',
    x: cardX,
    y: config.showExplanationInSlide ? 450 : 460,
    w: cardW,
    fontSize: optionsSize,
    color: textColor,
    align: 'left',
    bold: false,
    fontFamily: optionsFont,
    shape: 'card',
    bg: hexToRgba(hc.optionBgHex, isLight ? 0.9 : 0.55),
  });

  // -------------------------------------------------------------------------
  // Explanation — shown when the deck has it enabled. Sits above the footer.
  // -------------------------------------------------------------------------
  if (config.showExplanationInSlide) {
    boxes.push({
      id: bid('mdl_explanation'),
      bind: 'explanation',
      x: cardX,
      y: 840,
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
  // Footer — watermark + footer tag near bottom edge
  // -------------------------------------------------------------------------
  const footerY = config.showExplanationInSlide ? SLIDE_H - 70 : SLIDE_H - PAD - 44;
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
      y: footerY,
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
      y: footerY,
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
