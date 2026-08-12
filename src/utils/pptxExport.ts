import pptxgen from 'pptxgenjs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DeckConfig, MCQItem, SlideTextBox, getSourceTags, getEffectiveBadgeTag } from '../types';
import { getSlideBoxContent, getBoxFontFamily, boxContentHasMath } from './slideTextBoxes';
import { getBackgroundPresetUrl } from './backgroundPresets';
import { getTemplateById } from '../templates/registry';
import { getSlideIcon } from './slideElements';
import { chunkAnswerKeyPages, AnswerKeyPage } from './answerKeySlides';
import { resolveTheme } from './themeResolver';
import { expandDeckSlides, resolveSlideAnswerFlags } from './answerSlides';
import {
  TPL_CARD_ID,
  TPL_STEM_ID,
  TPL_ROMAN_ID,
  TPL_PROMPT_ID,
  TPL_OPTIONS_ID,
  computeTemplateCardMetrics,
  splitRomanLabel,
} from './templateBoxLayout';

export interface PptxSlideSpec {
  item: MCQItem;
  questionIndex: number;
  isAnswerSlide: boolean;
}

export const exportDeckToPPTX = async (
  items: MCQItem[],
  config: DeckConfig,
  onProgress?: (msg: string) => void,
  slides?: PptxSlideSpec[],
  includeExplanation = true,
  // Pre-rendered background-only rasters (gradient/color + bg image + tint +
  // ambient glows), one per slide in `slides` order — embedded as a single
  // full-bleed picture layer so the exported gradient is pixel-identical to
  // the live preview. Falls back to an approximated shape/gradient render
  // when a slide has no corresponding raster.
  backgroundDataUrls?: string[],
  includeAnswerKeySlides = false,
  // Pre-rendered FULL-slide rasters (the exact slide as it renders in the
  // editor — background + text + shapes + icons), one per slide in `slides`
  // order. When present for a position, that slide is embedded as a single
  // full-bleed picture layer and ALL native editable layers are skipped, so
  // the PPTX is pixel-identical to the live preview (D3 parity trade-off is
  // explicit: this mode is non-editable by design).
  slideImageDataUrls?: string[],
  // Pre-rendered transparent overlays for boxes that PPTX native text CANNOT
  // reproduce faithfully — LaTeX/KaTeX math (which native text would strip to
  // plain). One full-bleed transparent raster per slide in `slides` order,
  // rendered by the DOM renderer so math typesets exactly like the preview.
  // Native layers are drawn beneath, and the boxes these overlays cover are
  // skipped from the native path so nothing doubles up.
  mathOverlayDataUrls?: string[]
) => {
  onProgress?.('Initializing 16:9 PowerPoint Presentation...');

  const pptx = new pptxgen();
  pptx.defineLayout({ name: 'LAYOUT_16x9', width: 13.333, height: 7.5 });
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = `${config.brandName || 'EdTech'} - MCQ Deck`;
  pptx.company = config.brandName || "NOBEL'S CLASSROOM";
  pptx.author = config.watermarkHandle || 'Instructor';

  const globalTheme = resolveTheme(config);
  const colors = globalTheme.colors;

  // Physical slide list — explicit (question + answer pairs) or expanded from answerMode config.
  const slideSpecs: PptxSlideSpec[] = slides ?? expandDeckSlides(items, config).map(s => ({
    item: s.item,
    questionIndex: s.questionIndex,
    isAnswerSlide: s.isAnswerSlide,
  }));
  const totalQuestions = items.length;
  const totalSlides = slideSpecs.length;

  // Helper to strip simple LaTeX delimiters for clean presentation text
  const cleanLatex = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\\\((.*?)\\\)/g, '$1')
      .replace(/\$\$(.*?)\$\$/g, '$1')
      .replace(/\$(.*?)\$/g, '$1')
      .replace(/\\mathrm\{(.*?)\}/g, '$1')
      .replace(/\\mathbf\{(.*?)\}/g, '$1')
      .replace(/\\text\{(.*?)\}/g, '$1')
      .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, '($1/$2)')
      .replace(/\\times/g, '×')
      .replace(/\\div/g, '÷')
      .replace(/\\pm/g, '±')
      .replace(/\\alpha/g, 'α')
      .replace(/\\beta/g, 'β')
      .replace(/\\theta/g, 'θ');
  };

  // 1920x1080 canvas -> 13.333x7.5in slide
  const PX_TO_IN = 13.333 / 1920;
  const PX_TO_PT = PX_TO_IN * 72;

  // Convert a CSS color (hex, hex8, rgb, rgba) to a solid 6-digit hex for PPTX.
  // rgba() is composited over the slide's base background so the editable shape
  // approximates the translucent tint SlideCanvas renders.
  const cssColorToHex = (css: string, baseBg: string = '0F172A'): string => {
    const s = (css || '').trim();
    const hex6 = s.match(/^#([0-9a-fA-F]{6})/);
    if (hex6) return hex6[1].toUpperCase();
    const hex3 = s.match(/^#([0-9a-fA-F]{3})\b/);
    if (hex3) {
      const [r, g, b] = hex3[1];
      return (r + r + g + g + b + b).toUpperCase();
    }
    const rgba = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/i);
    if (rgba) {
      const [r, g, b] = [parseFloat(rgba[1]), parseFloat(rgba[2]), parseFloat(rgba[3])];
      const a = rgba[4] === undefined ? 1 : (rgba[4].endsWith('%') ? parseFloat(rgba[4]) / 100 : parseFloat(rgba[4]));
      const base = [parseInt(baseBg.slice(0, 2), 16), parseInt(baseBg.slice(2, 4), 16), parseInt(baseBg.slice(4, 6), 16)];
      const blend = base.map((c, i) => Math.round(([r, g, b][i] * a) + c * (1 - a)));
      return blend.map(c => c.toString(16).padStart(2, '0')).join('').toUpperCase();
    }
    return s.replace(/^#/, '').toUpperCase();
  };

  // True translucency for an rgba() fill — returns the raw hex + a pptxgenjs
  // `transparency` (0-100) so the shape stays translucent and the real slide
  // background (or background raster) shows through, exactly like the DOM's
  // `background-color: rgba(...)`. Solid colors return undefined transparency.
  // This matters for "glass" pill/card elements (badge tag, counter, etc.).
  const cssFillTransparency = (css: string): number | undefined => {
    const s = (css || '').trim();
    const rgba = s.match(/rgba\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)[,\s/]+([\d.]+%?)\s*\)/i);
    if (!rgba) return undefined;
    const a = rgba[4].endsWith('%') ? parseFloat(rgba[4]) / 100 : parseFloat(rgba[4]);
    if (a >= 1) return undefined;
    return Math.round((1 - a) * 100);
  };

  // Parse a CSS color (hex / rgb / rgba) to its RAW rgb as a 6-digit hex,
  // IGNORING alpha. Used when a transparency value is applied too: pre-blending
  // rgba over the base background (cssColorToHex) AND then adding transparency
  // darkens the fill twice; the raw color + pptxgenjs transparency reproduces
  // the DOM's translucent rgba over whatever is actually behind the shape.
  const cssRgbHex = (css: string): string | null => {
    const s = (css || '').trim();
    const hex6 = s.match(/^#([0-9a-fA-F]{6})/);
    if (hex6) return hex6[1].toUpperCase();
    const hex3 = s.match(/^#([0-9a-fA-F]{3})\b/);
    if (hex3) {
      const [r, g, b] = hex3[1];
      return (r + r + g + g + b + b).toUpperCase();
    }
    const rgb = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+[\d.]+%?)?\s*\)/i);
    if (rgb) {
      const [r, g, b] = [
        Math.round(parseFloat(rgb[1])),
        Math.round(parseFloat(rgb[2])),
        Math.round(parseFloat(rgb[3])),
      ];
      return [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('').toUpperCase();
    }
    return null;
  };

  // Render a lucide icon as an inline SVG data URL so decorative icon elements
  // export as real, selectable picture layers (matches SlideCanvas visuals).
  // Must be base64-encoded — PptxGenJS's addImage() rejects (with a silent
  // console error, no thrown exception) any `data:` URI without a `base64,`
  // marker, so a plain `;utf8,` + encodeURIComponent URL never renders.
  const iconToDataUrl = (iconName: string, color: string, size: number): string | null => {
    const IconComp = getSlideIcon(iconName);
    if (!IconComp) return null;
    const svg = renderToStaticMarkup(React.createElement(IconComp, { size, color }));
    const bytes = new TextEncoder().encode(svg);
    let binary = '';
    bytes.forEach(b => { binary += String.fromCharCode(b); });
    return `data:image/svg+xml;base64,${btoa(binary)}`;
  };

  // Answer-display flags — mirrors the exact two-stage gating SlideCanvas →
  // SlideTextBoxLayer uses so a granular answerDisplayStyles config (which of
  // highlight_option / answer_pill / explanation_card are enabled) produces
  // identical visibility in the export as it does in the live preview.
  interface AnswerFlags {
    isAnswerSlide: boolean;
    showOptionHighlight: boolean;
    showAnswerPill: boolean;
    explanationVisible: boolean;
  }

  // Render one slide text-box as a native editable PPTX layer (so fields and
  // shapes stay editable after import — no flattened image).
  const renderTextBox = (
    slide: any,
    box: SlideTextBox,
    item: MCQItem,
    cfg: DeckConfig,
    curIdx: number,
    flags: AnswerFlags,
    slideColors: typeof colors
  ) => {
    // Estimated glyph width (em) used to approximate content-hugging DOM pills
    // and chips — Bangla conjuncts render wider than latin lowercase.
    const estCharW = (ch: string): number => {
      const c = ch.charCodeAt(0);
      if (c >= 0x0980 && c <= 0x09ff) return 0.62; // Bangla
      if (c >= 0x0900 && c <= 0x097f) return 0.62; // Devanagari
      if (c >= 65 && c <= 90) return 0.78;         // A-Z
      if (c >= 97 && c <= 122) return 0.5;         // a-z
      if (c >= 48 && c <= 57) return 0.55;         // 0-9
      return 0.52;
    };

    if (box.bind === 'icon') {
      // Decorative lucide icon — embed as an SVG image layer (matches SlideCanvas)
      const iconW = (box.w || box.fontSize * 1.5) * PX_TO_IN;
      const iconH = (box.h || box.fontSize * 1.5) * PX_TO_IN;
      // Container shape (pill / card / banner) behind the icon — editable layer
      if (box.shape && box.shape !== 'plain' && box.bg) {
        const iconFillTransparency = cssFillTransparency(box.bg);
        slide.addShape(pptx.ShapeType?.roundRect || 'roundRect', {
          x: box.x * PX_TO_IN,
          y: box.y * PX_TO_IN,
          w: iconW,
          h: iconH,
          fill: {
            color: iconFillTransparency !== undefined
              ? (cssRgbHex(box.bg) || cssColorToHex(box.bg, slideColors.bg))
              : cssColorToHex(box.bg, slideColors.bg),
            ...(iconFillTransparency !== undefined ? { transparency: iconFillTransparency } : {}),
          },
          line: { color: 'FFFFFF', transparency: 92, width: 0.75 },
          rectRadius: box.shape === 'pill' ? 0.5 : box.shape === 'card' ? 0.16 : 0.16,
          shadow: { type: 'outer', opacity: 0.2, blur: 8, angle: 90, distance: 4 },
        });
      }
      const iconUrl = iconToDataUrl(box.iconName || 'GraduationCap', box.color || '#fbbf24', box.fontSize);
      if (iconUrl) {
        const iconSize = Math.min(box.fontSize, box.w || box.fontSize) * PX_TO_IN;
        slide.addImage({
          data: iconUrl,
          x: box.x * PX_TO_IN + (iconW - iconSize) / 2,
          y: box.y * PX_TO_IN + (iconH - iconSize) / 2,
          w: iconSize,
          h: iconSize,
        });
      }
      return;
    }
    if (box.bind === 'image') {
      if (box.imageUrl) {
        slide.addImage({
          ...(box.imageUrl.startsWith('data:') ? { data: box.imageUrl } : { path: box.imageUrl }),
          x: box.x * PX_TO_IN,
          y: box.y * PX_TO_IN,
          w: (box.w || 320) * PX_TO_IN,
          h: (box.h || 180) * PX_TO_IN,
        });
      }
      return;
    }
    if (box.bind === 'answer') {
      // Mirrors SlideTextBoxLayer's box.bind === 'answer' branch — only
      // visible when the deck's 'answer_pill' display style is active on
      // this slide (dedicated answer slides always show it).
      if (!flags.showAnswerPill) return;
      const ansText = getSlideBoxContent(box, item, cfg, curIdx);
      const fontPt = (box.fontSize || 24) * PX_TO_PT;
      const fontFace = getBoxFontFamily(box, cfg).replace(/'/g, '').split(',')[0].trim();
      const radius = box.shape === 'pill' ? 0.5 : 0.16;
      // Uses the box's OWN configured bg/color (same as preview) — falls back
      // to the badge tokens only when the box has none set.
      const fillColor = box.bg ? cssColorToHex(box.bg, slideColors.bg) : (slideColors.badgeFill || 'D1FAE5');
      const textColor = box.color ? cssColorToHex(box.color, slideColors.bg) : (slideColors.badgeText || '065F46');

      slide.addShape(pptx.ShapeType?.roundRect || 'roundRect', {
        x: box.x * PX_TO_IN,
        y: box.y * PX_TO_IN,
        w: (box.w || 400) * PX_TO_IN,
        h: (box.h || (box.fontSize || 24) * 1.8) * PX_TO_IN,
        fill: { color: fillColor },
        line: { color: '10B981', width: 1.5 },
        rectRadius: radius,
      });

      slide.addText(`✓  ${ansText}`, {
        x: box.x * PX_TO_IN,
        y: box.y * PX_TO_IN,
        w: (box.w || 400) * PX_TO_IN,
        h: (box.h || (box.fontSize || 24) * 1.8) * PX_TO_IN,
        fontSize: fontPt,
        fontFace,
        color: textColor,
        bold: true,
        align: 'center',
        valign: 'middle',
      });
      return;
    }

    if (box.bind === 'explanation') {
      // Mirrors SlideTextBoxLayer's box.bind === 'explanation' branch — an
      // emerald card with a "Explanation:" label above the body text.
      if (!flags.explanationVisible) return;
      const text = getSlideBoxContent(box, item, cfg, curIdx);
      const padIn = 24 * PX_TO_IN;
      const boxW = (box.w || 600) * PX_TO_IN;
      const lineCount = Math.max(1, text.split('\n').length);
      const estH = box.fontSize * 1.9 + lineCount * box.fontSize * 1.45 + 24;
      const boxH = (box.h || estH) * PX_TO_IN;
      const fillColor = box.bg ? cssColorToHex(box.bg, slideColors.bg) : '064E3B';
      const textColor = box.color ? cssColorToHex(box.color, slideColors.bg) : 'D1FAE5';
      const fontFace = getBoxFontFamily(box, cfg).replace(/'/g, '').split(',')[0].trim();

      slide.addShape(pptx.ShapeType?.roundRect || 'roundRect', {
        x: box.x * PX_TO_IN,
        y: box.y * PX_TO_IN,
        w: boxW,
        h: boxH,
        fill: { color: fillColor },
        line: { color: '10B981', transparency: 60, width: 1 },
        rectRadius: 0.12,
        shadow: { type: 'outer', opacity: 0.2, blur: 8, angle: 90, distance: 4 },
      });

      const iconUrl = iconToDataUrl('Sparkles', '34D399', 22);
      if (iconUrl) {
        slide.addImage({
          data: iconUrl,
          x: box.x * PX_TO_IN + padIn,
          y: box.y * PX_TO_IN + padIn * 0.55,
          w: 0.22,
          h: 0.22,
        });
      }

      slide.addText('Explanation:', {
        x: box.x * PX_TO_IN + padIn + 0.3,
        y: box.y * PX_TO_IN + padIn * 0.42,
        w: boxW - padIn * 2 - 0.3,
        h: 0.32,
        fontSize: 16,
        bold: true,
        color: '34D399',
        fontFace,
        valign: 'middle',
      });

      slide.addText(cleanLatex(text), {
        x: box.x * PX_TO_IN + padIn,
        y: box.y * PX_TO_IN + padIn + 0.35,
        w: boxW - padIn * 2,
        h: boxH - padIn - 0.45,
        fontSize: box.fontSize * PX_TO_PT,
        bold: true,
        color: textColor,
        fontFace,
        valign: 'top',
      });
      return;
    }

    if (box.bind === 'watermark') {
      // Mirrors SlideTextBoxLayer's box.bind === 'watermark' branch —
      // avatar circle + name + fixed "Senior Instructor & Mentor" subtitle.
      const text = getSlideBoxContent(box, item, cfg, curIdx);
      const avatarSize = 0.5;
      const gap = 0.14;
      let textX = box.x * PX_TO_IN;
      if (cfg.watermarkAvatar) {
        slide.addImage({
          ...(cfg.watermarkAvatar.startsWith('data:') ? { data: cfg.watermarkAvatar } : { path: cfg.watermarkAvatar }),
          x: box.x * PX_TO_IN,
          y: box.y * PX_TO_IN,
          w: avatarSize,
          h: avatarSize,
        });
        textX += avatarSize + gap;
      } else {
        slide.addShape(pptx.ShapeType?.ellipse || 'ellipse', {
          x: box.x * PX_TO_IN,
          y: box.y * PX_TO_IN,
          w: avatarSize,
          h: avatarSize,
          fill: { color: slideColors.bg },
          line: { color: 'FBBF24', width: 2 },
        });
        textX += avatarSize + gap;
      }
      const fontFace = getBoxFontFamily(box, cfg).replace(/'/g, '').split(',')[0].trim();
      slide.addText(
        [
          { text, options: { fontSize: box.fontSize * PX_TO_PT, bold: true, color: cssColorToHex(box.color || '#ffffff', slideColors.bg) } },
          { text: '\nSenior Instructor & Mentor', options: { fontSize: box.fontSize * PX_TO_PT * 0.6, bold: true, color: 'FCD34D' } },
        ],
        {
          x: textX,
          y: box.y * PX_TO_IN,
          w: Math.max(0.5, (box.w || 900) * PX_TO_IN - (textX - box.x * PX_TO_IN)),
          h: (box.h || 70) * PX_TO_IN,
          fontFace,
          valign: 'middle',
        }
      );
      return;
    }

    // SOURCE TAGS — amber glass chips (mirrors SlideTextBoxLayer's source
    // branch: rounded-full amber-950/70 chips with an Award icon, amber border,
    // right-aligned and wrapping within the box). Each chip is an editable
    // roundRect + icon image + text run.
    if (box.bind === 'source') {
      const sources = getSourceTags(item);
      if (sources.length === 0) return;
      const chipFontSize = box.fontSize || 18;
      const chipPadX = 20; // px-5
      const chipPadY = 6;  // py-1.5
      const chipGap = 10;  // gap-2.5
      const iconSize = 20; // w-5 h-5
      const chipH = chipFontSize * 1.375 + chipPadY * 2;
      const chipTextW = (s: string) => [...s].reduce((sum, ch) => sum + estCharW(ch) * chipFontSize, 0);
      const boxX = box.x * PX_TO_IN;
      const boxWidth = (box.w || 600) * PX_TO_IN;
      const startY = box.y * PX_TO_IN;
      const gap = 8 * PX_TO_IN;
      const rowH = chipH * PX_TO_IN + gap;

      // Right-aligned wrapping flow (DOM uses justify-end + flex-wrap).
      const placed: { srcTag: string; x: number; y: number; w: number }[] = [];
      let rowRight = boxX + boxWidth;
      let rowY = startY;
      sources.forEach((srcTag) => {
        const chipW = (chipTextW(srcTag) + chipPadX * 2 + iconSize + chipGap) * PX_TO_IN;
        if (rowRight - chipW < boxX) {
          rowRight = boxX + boxWidth;
          rowY += rowH;
        }
        rowRight -= chipW;
        placed.push({ srcTag, x: rowRight, y: rowY, w: chipW });
      });

      placed.forEach((chip) => {
        // Glass chip background — raw amber-950 rgb + transparency over the real
        // background, exactly like the DOM's rgba(69,26,3,0.7).
        slide.addShape(pptx.ShapeType?.roundRect || 'roundRect', {
          x: chip.x,
          y: chip.y,
          w: chip.w,
          h: chipH * PX_TO_IN,
          fill: { color: '451A03', transparency: 30 },
          line: { color: 'F59E0B', transparency: 50, width: 1 },
          rectRadius: 0.5,
          shadow: { type: 'outer', opacity: 0.15, blur: 8, angle: 90, distance: 3 },
        });
        const iconUrl = iconToDataUrl('Award', '#fbbf24', iconSize);
        if (iconUrl) {
          slide.addImage({
            data: iconUrl,
            x: chip.x + chipPadX * PX_TO_IN,
            y: chip.y + (chipH * PX_TO_IN - iconSize * PX_TO_IN) / 2,
            w: iconSize * PX_TO_IN,
            h: iconSize * PX_TO_IN,
          });
        }
        slide.addText(chip.srcTag, {
          x: chip.x + (chipPadX + iconSize + chipGap) * PX_TO_IN,
          y: chip.y,
          w: chip.w - (chipPadX + iconSize + chipGap) * PX_TO_IN,
          h: chipH * PX_TO_IN,
          fontSize: chipFontSize * PX_TO_PT,
          bold: true,
          color: 'FCD34D',
          fontFace: getBoxFontFamily(box, cfg).replace(/'/g, '').split(',')[0].trim(),
          align: 'left',
          valign: 'middle',
        });
      });
      return;
    }

    // OPTIONS — render each option as its own editable pill/card graphic, and
    // on answer slides give the correct option a highlighted card box + ✓ tick.
    // Mirrors SlideCanvas: 'pill' options flow left-to-right in a wrapping row,
    // 'card'/'plain' options stack vertically.
    if (box.bind === 'options') {
      const opts = item.options || [];
      if (opts.length === 0) return;

      const boxW = (box.w || 600) * PX_TO_IN;
      const optH = Math.max(0.5, (box.fontSize * 1.8 + 16) * PX_TO_IN);
      const radius = box.shape === 'pill' ? 0.5 : box.shape === 'card' ? 0.12 : 0;
      const fontPt = box.fontSize * PX_TO_PT;
      const fontFace = getBoxFontFamily(box, cfg).replace(/'/g, '').split(',')[0].trim();
      const isPills = box.shape === 'pill';

      // Estimate the rendered width of an option's text so pills wrap exactly
      // like the canvas flex-wrap row (per-character glyph widths + key badge +
      // padding).
      const estimateOptWidth = (opt: MCQItem['options'][number]): number => {
        const textW = [...cleanLatex(opt.text)].reduce((sum, ch) => sum + estCharW(ch) * box.fontSize, 0);
        const keyW = box.fontSize * 1.1;
        const pad = box.fontSize * 1.6;
        const tickW = 0;
        return Math.min(Math.max(textW + keyW + pad + tickW, box.fontSize * 3), (box.w || 600));
      };

      const placed = opts.map((opt, oi) => {
        if (oi >= 4) return { opt, oi, x: 0, y: 0, w: 0, h: 0 };
        const isCorrect = opt.isCorrect || opt.key.toLowerCase() === item.answer?.toLowerCase();
        const highlighted = flags.showOptionHighlight && isCorrect;

        if (isPills) {
          // Wrapping row layout — pill width is estimated, then flowed left-to-right
          const pillW = estimateOptWidth(opt) * PX_TO_IN;
          const pillH = optH;
          const gapX = 12 * PX_TO_IN;
          const gapY = 10 * PX_TO_IN;
          const boxX = box.x * PX_TO_IN;
          // Walk the current row to find where this pill lands
          let rowStart = boxX;
          let rowY = box.y * PX_TO_IN;
          for (let pi = 0; pi < oi; pi++) {
            const prevW = estimateOptWidth(opts[pi]) * PX_TO_IN;
            if (rowStart + prevW + gapX + pillW > boxX + boxW) {
              rowStart = boxX;
              rowY += pillH + gapY;
            }
            rowStart += prevW + gapX;
          }
          if (rowStart + pillW > boxX + boxW) {
            rowStart = boxX;
            rowY += pillH + gapY;
          }
          return { opt, oi, x: rowStart, y: rowY, w: pillW, h: pillH, highlighted };
        }

        // Vertical stack (card / plain) — full box width rows
        const y = box.y * PX_TO_IN + oi * (optH + 0.09);
        return { opt, oi, x: box.x * PX_TO_IN, y, w: boxW, h: optH, highlighted };
      });

      placed.forEach(({ opt, oi, x, y, w, h, highlighted }) => {
        if (oi >= 4) return;
        const isCorrect = opt.isCorrect || opt.key.toLowerCase() === item.answer?.toLowerCase();
        const hl = flags.showOptionHighlight && isCorrect;

        // Option graphic — an editable rounded-rect pill/card (or no shape for plain)
        if (box.shape && box.shape !== 'plain') {
          slide.addShape(pptx.ShapeType?.roundRect || 'roundRect', {
            x,
            y,
            w,
            h,
            fill: {
              color: hl
                ? slideColors.optionSelectedBg
                : (box.bg ? cssColorToHex(box.bg, slideColors.bg) : slideColors.optionBg),
            },
            line: hl
              ? { color: slideColors.optionSelectedBorder, width: 2 }
              : { color: 'FFFFFF', transparency: 92, width: 0.75 },
            rectRadius: radius,
          });
        }

        slide.addText(
          [
            {
              text: `${opt.key}) `,
              options: { bold: true, color: hl ? slideColors.optionSelectedText : slideColors.titleColor },
            },
            {
              text: cleanLatex(opt.text),
              options: { color: hl ? slideColors.optionSelectedText : cssColorToHex(box.color || '#ffffff', slideColors.bg) },
            },
          ],
            {
              x: x + (box.shape !== 'plain' ? 0.18 : 0),
              y,
              w: w - (hl ? 0.7 : 0.3),
              h,
              fontSize: fontPt,
              // DOM renders every option at min font-bold (700) — never regular.
              bold: true,
              align: box.align,
              fontFace,
              valign: 'middle',
          }
        );

        // Answer tick for the highlighted correct option
        if (hl) {
          slide.addText('✓', {
            x: x + w - 0.5,
            y,
            w: 0.38,
            h,
            fontSize: fontPt,
            bold: true,
            color: slideColors.optionSelectedText,
            align: 'center',
            valign: 'middle',
          });
        }
      });
      return;
    }

    let text = getSlideBoxContent(box, item, cfg, curIdx);
    // Container-only boxes (e.g. a template card behind the stem) have no text
    // but still render their shape layer.
    const isContainerOnly = !text && box.shape && box.shape !== 'plain' && box.bg;
    if (!text && !isContainerOnly) return;

    const lineCount = text ? text.split('\n').length : 0;
    const boxW = (box.w || 600) * PX_TO_IN;
    const isPill = box.shape === 'pill';
    // DOM pill = content-hugging inline-flex with px-6 py-2.5 and leading-snug
    // text, so height ≈ fontSize * 1.375 + 20px. Cards/banners keep their
    // explicit height or a looser line-based estimate.
    const boxH = (box.h || (isPill ? lineCount * box.fontSize * 1.375 + 20 : lineCount * box.fontSize * 1.45 + 16)) * PX_TO_IN;
    // True glass fill — keep rgba() translucency (DOM renders a translucent
    // badge/counter over the slide background, not a flat solid). When the
    // background is rgba, use the RAW un-blended rgb with pptxgenjs
    // `transparency` so the real background layer shows through — matching the
    // DOM. Pre-blending (cssColorToHex) is only used for solid colors, where it
    // is a no-op anyway.
    const fillTransparency = box.bg ? cssFillTransparency(box.bg) : undefined;
    const fill = box.bg
      ? (fillTransparency !== undefined
        ? (cssRgbHex(box.bg) || cssColorToHex(box.bg, slideColors.bg))
        : cssColorToHex(box.bg, slideColors.bg))
      : undefined;
    // DOM renders pills content-hugging (inline-flex) right-aligned in the box
    // — estimate width from per-character glyph widths (Bangla conjuncts are
    // wider than latin) plus the px-6 (48px) horizontal padding, so the exported
    // pill isn't a full-width stretched slab.
    const pillText = cleanLatex(text || '');
    const pillTextW = [...pillText].reduce((sum, ch) => sum + estCharW(ch) * box.fontSize, 0);
    const estPillW = pillText.length
      ? Math.min(Math.max(pillTextW + 48, box.fontSize * 3), (box.w || 600))
      : (box.w || 600);
    const shapeX = isPill ? (box.x + (box.w || 600) - estPillW) * PX_TO_IN : box.x * PX_TO_IN;
    const shapeW = isPill ? estPillW * PX_TO_IN : boxW;

    // Container shape (pill / card / banner) behind the text — an editable layer.
    // Mirrors SlideTextBoxLayer: pill = content-hugging translucent rounded pill
    // with a soft glass shadow + faint light border; card/banner = rounded box.
    if (box.shape && box.shape !== 'plain' && fill) {
      slide.addShape(pptx.ShapeType?.roundRect || 'roundRect', {
        x: shapeX,
        y: box.y * PX_TO_IN,
        w: shapeW,
        h: boxH,
        fill: {
          color: fill,
          ...(fillTransparency !== undefined ? { transparency: fillTransparency } : {}),
        },
        line: { color: 'FFFFFF', transparency: 88, width: 0.75 },
        rectRadius: isPill ? 0.5 : box.shape === 'card' ? 0.09 : 0,
        shadow:
          isPill || box.shape === 'card'
            ? { type: 'outer', opacity: isPill ? 0.12 : 0.15, blur: 9, angle: 90, distance: 3 }
            : undefined,
      });
    }

    if (!text) return;

    slide.addText(cleanLatex(text), {
      x: shapeX,
      y: box.y * PX_TO_IN,
      w: shapeW,
      h: boxH,
      fontSize: box.fontSize * PX_TO_PT,
      color: cssColorToHex(box.color || '#ffffff', slideColors.bg),
      // DOM renders every text box at min font-bold (700) — font-black (900)
      // when bold — never regular, so always export as bold for parity.
      bold: true,
      align: box.align,
      fontFace: getBoxFontFamily(box, cfg).replace(/'/g, '').split(',')[0].trim(),
      valign: isPill ? 'middle' : 'top',
    });
  };

  // Render the slide background as editable layers (mirrors SlideCanvas):
  // 1) base canvas color as the slide background, 2) the deck's background
  // preset/uploaded image as a full-bleed selectable picture, 3) the
  // readability tint as a translucent rectangle, 4) the decorative ambient
  // radial glows. All are real PowerPoint objects so the user can select,
  // move, resize or delete them. Uses the per-slide effective config so
  // slide-level (customConfig) background overrides are respected.
  const renderSlideBackground = (slide: any, cfg: DeckConfig, bgDataUrl?: string) => {
    const slideTheme = resolveTheme(cfg);
    const slideColors = slideTheme.colors;
    const slideBgUrl = slideTheme.background.url;
    const slideIsLight = slideTheme.isLight;
    const gradientStops = slideTheme.background.gradientStops;

    slide.background = {
      color: slideBgUrl ? '0F172A' : gradientStops ? gradientStops[1] : slideColors.bgHex,
    };

    // A pre-rendered raster of the exact background stack (gradient/color,
    // bg image, tint, ambient glows — see SlideCanvas's `backgroundOnly`
    // mode) is available: use it as a single full-bleed picture layer and
    // skip the shape-based approximation below entirely.
    if (bgDataUrl) {
      slide.addImage({ data: bgDataUrl, x: 0, y: 0, w: 13.333, h: 7.5 });
      return;
    }

    const bgOpacity = cfg.bgImageOpacity !== undefined ? cfg.bgImageOpacity : 0.85;
    const overlayDarkness = cfg.bgOverlayDarkness !== undefined ? cfg.bgOverlayDarkness : 0.4;

    if (slideBgUrl) {
      slide.addImage({
        ...(slideBgUrl.startsWith('data:') ? { data: slideBgUrl } : { path: slideBgUrl }),
        x: 0,
        y: 0,
        w: 13.333,
        h: 7.5,
        transparency: Math.round((1 - bgOpacity) * 100),
      });
    } else if (gradientStops) {
      // Approximate bgClass's diagonal (to-br) 3-stop gradient — PptxGenJS has
      // no native gradient-fill API, so two right-triangle washes split along
      // the anti-diagonal (top-right to bottom-left) layer the `from` and `to`
      // stops over the `via` base fill set above: a flipV triangle covers the
      // top-left half (from-color), a flipH triangle covers the bottom-right
      // half (to-color), softened with transparency so the seam blends.
      const [fromHex, , toHex] = gradientStops;
      slide.addShape(pptx.ShapeType?.rtTriangle || 'rtTriangle', {
        x: 0,
        y: 0,
        w: 13.333,
        h: 7.5,
        flipV: true,
        fill: { color: fromHex, transparency: 45 },
        line: { type: 'none' },
      });
      slide.addShape(pptx.ShapeType?.rtTriangle || 'rtTriangle', {
        x: 0,
        y: 0,
        w: 13.333,
        h: 7.5,
        flipH: true,
        fill: { color: toHex, transparency: 45 },
        line: { type: 'none' },
      });
    }

    // Readability tint — editable translucent rectangle over the image
    slide.addShape(pptx.ShapeType?.rect || 'rect', {
      x: 0,
      y: 0,
      w: 13.333,
      h: 7.5,
      fill: {
        color: slideIsLight ? 'FFFFFF' : '0F172A',
        transparency: Math.round((slideIsLight ? overlayDarkness * 0.4 : overlayDarkness) * 100),
      },
      line: { type: 'none' },
    });

    // Decorative ambient radial glows — theme decoration, hidden when a
    // background image replaces the theme (mirrors SlideCanvas).
    if (!slideBgUrl) {
      slide.addShape(pptx.ShapeType?.ellipse || 'ellipse', {
        x: 13.333 - 650 * PX_TO_IN,
        y: 0,
        w: 650 * PX_TO_IN,
        h: 650 * PX_TO_IN,
        fill: { color: slideIsLight ? 'FBBF24' : 'F59E0B', transparency: 90 },
        line: { type: 'none' },
      });
      slide.addShape(pptx.ShapeType?.ellipse || 'ellipse', {
        x: 0,
        y: 7.5 - 550 * PX_TO_IN,
        w: 550 * PX_TO_IN,
        h: 550 * PX_TO_IN,
        fill: { color: slideIsLight ? '3B82F6' : '60A5FA', transparency: 90 },
        line: { type: 'none' },
      });
    }
  };

  slideSpecs.forEach(({ item, questionIndex, isAnswerSlide }, pos) => {
    onProgress?.(`Building PPTX slide ${pos + 1} of ${totalSlides}...`);

    const slide = pptx.addSlide();

    // FULL-SLIDE IMAGE MODE — the caller pre-rendered the exact slide (DOM
    // renderer → PNG, pixel-identical to the editor). Embed it as one
    // full-bleed picture and skip every native editable layer. Speaker notes
    // are still attached so the structured content stays extractable.
    const fullSlideImage = slideImageDataUrls?.[pos];
    if (fullSlideImage) {
      slide.addImage({ data: fullSlideImage, x: 0, y: 0, w: 13.333, h: 7.5 });
      const notesLines = [
        `Question Stem: ${cleanLatex(item.stem)}`,
        item.stem !== cleanLatex(item.stem) ? `Raw LaTeX Stem: ${item.stem}` : '',
        ...(item.romanItems?.length ? [`Statements:\n${item.romanItems.map((r, i) => `  ${i+1}. ${cleanLatex(r)}`).join('\n')}`] : []),
        ...(item.prompt ? [`Prompt: ${cleanLatex(item.prompt)}`] : []),
        `Options:\n${item.options.map(o => `  [${o.key}] ${cleanLatex(o.text)} ${o.isCorrect ? '(Correct Answer)' : ''}`).join('\n')}`,
        item.answer ? `Correct Answer Key: ${item.answer}` : '',
        item.explanation ? `Explanation: ${cleanLatex(item.explanation)}` : '',
      ].filter(Boolean).join('\n\n');
      slide.addNotes(notesLines);
      return;
    }

    // Per-slide design override (mirrors SlideCanvas) + boxed-design detection
    const effectiveConfig: DeckConfig = { ...config, ...(item.customConfig || {}) };
    const boxes: SlideTextBox[] = effectiveConfig.slideTextBoxes || [];
    const isBoxedDesign = boxes.length > 0;
    // Per-slide theme (customConfig can override brand colors per question) —
    // mirrors renderSlideBackground's own resolveTheme(cfg) call below.
    const slideColors = resolveTheme(effectiveConfig).colors;

    // Answer-display gating — resolved by the SHARED resolver (answerSlides.ts)
    // so the granular answerDisplayStyles config (highlight_option / answer_pill
    // / explanation_card) produces identical visibility in the PPTX, the DOM
    // preview, and the math-overlay rasterizer — one source of truth, no drift.
    const revealFlags = resolveSlideAnswerFlags(effectiveConfig, isAnswerSlide);
    // includeExplanation (export-time toggle) only force-overrides on dedicated
    // answer slides — mirrors ExportModal's forceShowExplanation semantics.
    const explanationVisible = isAnswerSlide ? includeExplanation : revealFlags.showExplanationCard;
    const answerFlags = { isAnswerSlide, showOptionHighlight: revealFlags.showOptionHighlight, showAnswerPill: revealFlags.showAnswerPill, explanationVisible };

    const bgDataUrl = backgroundDataUrls?.[pos];

    if (isBoxedDesign) {
      // Boxed-design mode — background layer + slide text boxes only (mirrors SlideCanvas)
      renderSlideBackground(slide, effectiveConfig, bgDataUrl);
        // Fallback top-center answer strip — ONLY when no box already owns the
        // 'answer' bind (mirrors SlideTextBoxLayer's exact same condition).
        // Default templates always include their own answer-pill box, so this
        // previously rendered as a duplicate/mismatched pill on every answer slide.
        if (answerFlags.showAnswerPill && item.answer && !boxes.some(b => b.bind === 'answer')) {
          slide.addShape(pptx.ShapeType?.roundRect || 'roundRect', {
            x: (13.333 - 4.2) / 2,
            y: 0.3,
            w: 4.2,
            h: 0.5,
            fill: { color: '10B981' },
            line: { color: '34D399', width: 1.5 },
            rectRadius: 0.25,
          });
          slide.addText(`✓  উত্তর: ${item.answer}`, {
            x: (13.333 - 4.2) / 2,
            y: 0.32,
            w: 4.2,
            h: 0.46,
            fontSize: 13,
            bold: true,
            color: 'FFFFFF',
            align: 'center',
            valign: 'middle',
          });
        }
        // Adaptive geometry for the preset template card/roman/prompt/options
        // boxes — mirrors SlideTextBoxLayer.tsx (browser preview) so the
        // exported PPTX doesn't overlap the roman-statements/prompt boxes
        // that a fixed 280px card can't always fit (see templateBoxLayout.ts).
        const cardBox = boxes.find(b => b.id.startsWith(TPL_CARD_ID));
        const stemBox = boxes.find(b => b.id.startsWith(TPL_STEM_ID));
        const romanBox = boxes.find(b => b.id.startsWith(TPL_ROMAN_ID));
        const optionsBoxForMetrics = boxes.find(b => b.id.startsWith(TPL_OPTIONS_ID));
        const cardMetrics = cardBox
          ? computeTemplateCardMetrics(item, cardBox, stemBox, romanBox, optionsBoxForMetrics?.y ?? cardBox.y)
          : undefined;

        for (const box of boxes) {
          // Skip optional structural boxes that have no content on this slide
          // — otherwise a deck-wide template box (e.g. an empty roman card)
          // renders as a stray shape on plain MCQs (mirrors SlideTextBoxLayer).
          if (box.bind === 'roman' && !(item.romanItems || []).length) continue;
          if (box.bind === 'prompt' && !item.prompt) continue;
          if (box.bind === 'source' && getSourceTags(item).length === 0) continue;

          // LaTeX/math content is rasterized as a transparent image overlay
          // (see mathOverlayDataUrls) because PPTX native text would strip the
          // math to plain text. Skip those boxes in the native path so the
          // typeset image layer renders them instead — no double draw.
          if (boxContentHasMath(box, item, effectiveConfig, questionIndex)) continue;

          let renderBox = box;
          if (cardMetrics) {
            if (box.id.startsWith(TPL_CARD_ID)) {
              renderBox = { ...box, h: cardMetrics.cardH };
            } else if (box.id.startsWith(TPL_ROMAN_ID) && cardMetrics.romanY !== undefined) {
              renderBox = { ...box, y: cardMetrics.romanY };
            } else if (box.id.startsWith(TPL_PROMPT_ID) && cardMetrics.promptY !== undefined) {
              renderBox = { ...box, y: cardMetrics.promptY };
            } else if (box.id.startsWith(TPL_OPTIONS_ID)) {
              renderBox = { ...box, y: cardMetrics.optionsY };
            }
          }
          renderTextBox(slide, renderBox, item, effectiveConfig, questionIndex, answerFlags, slideColors);
        }

        // Typeset math overlay — a transparent full-bleed raster of just the
        // LaTeX boxes, rendered by the DOM (KaTeX) so math appears exactly as
        // in the preview. Drawn last so it sits on top of the native layers.
        const mathOverlay = mathOverlayDataUrls?.[pos];
        if (mathOverlay) {
          slide.addImage({ data: mathOverlay, x: 0, y: 0, w: 13.333, h: 7.5 });
        }
    } else {
      // Native PPTX shape fallback
      renderSlideBackground(slide, effectiveConfig, bgDataUrl);

      // TOP HEADER BAR: Brand Logo + Brand Name + Chapter Header + Badge
      if (config.logoUrl) {
        slide.addImage({
          data: config.logoUrl.startsWith('data:') ? config.logoUrl : undefined,
          path: !config.logoUrl.startsWith('data:') ? config.logoUrl : undefined,
          x: 0.5,
          y: 0.4,
          w: config.logoSize === 'xl' ? 0.9 : config.logoSize === 'lg' ? 0.8 : config.logoSize === 'sm' ? 0.5 : 0.65,
          h: config.logoSize === 'xl' ? 0.9 : config.logoSize === 'lg' ? 0.8 : config.logoSize === 'sm' ? 0.5 : 0.65,
        });
      }

      const fallbackHeaderFont = globalTheme.fonts.headerFont.replace(/'/g, '').split(',')[0].trim();
      const fallbackBodyFont = globalTheme.fonts.bodyFont.replace(/'/g, '').split(',')[0].trim();
      const fallbackOptionsFont = globalTheme.fonts.optionsFont.replace(/'/g, '').split(',')[0].trim();
      const fallbackFooterFont = globalTheme.fonts.footerFont.replace(/'/g, '').split(',')[0].trim();

      const brandX = config.logoUrl ? 1.3 : 0.5;
      slide.addText(
        [
          {
            text: (config.brandName || "NOBEL'S CLASSROOM").toUpperCase(),
            options: { fontSize: 16, bold: true, color: colors.titleColor, fontFace: fallbackHeaderFont },
          },
          ...(config.headerTitle
            ? [
                {
                  text: `\n${cleanLatex(config.headerTitle)}`,
                  options: { fontSize: 12, color: colors.textColor === '0F172A' ? '475569' : 'CBD5E1', fontFace: fallbackHeaderFont },
                },
              ]
            : []),
        ],
        { x: brandX, y: 0.35, w: 7.0, h: 0.8, align: 'left', valign: 'top' }
      );

      if (getEffectiveBadgeTag(config)) {
        slide.addText(getEffectiveBadgeTag(config), {
          x: 8.8,
          y: 0.4,
          w: 2.8,
          h: 0.45,
          fontSize: 12,
          bold: true,
          color: colors.badgeText,
          fontFace: fallbackHeaderFont,
          fill: { color: colors.badgeFill },
          align: 'center',
          valign: 'middle',
          rectRadius: 0.1,
        });
      }

      slide.addText(`${questionIndex + 1} / ${totalQuestions}`, {
        x: 11.8,
        y: 0.4,
        w: 1.0,
        h: 0.45,
        fontSize: 12,
        bold: true,
        color: colors.titleColor,
        fontFace: fallbackHeaderFont,
        fill: { color: colors.cardBg },
        line: { color: colors.cardBorder, width: 1 },
        align: 'center',
        valign: 'middle',
        rectRadius: 0.1,
      });

      // Separator line under header
      slide.addShape(pptx.ShapeType?.line || 'line', {
        x: 0.5,
        y: 1.25,
        w: 12.33,
        h: 0,
        line: { color: colors.cardBorder, width: 1.5 },
      });

      // MIDDLE CONTENT: Question Box
      const qNum =
        config.questionNumberFormat === 'bangla'
          ? ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'][questionIndex + 1] || `${questionIndex + 1}`
          : config.questionNumberFormat === 'q_prefix'
          ? `Q${questionIndex + 1}`
          : `${questionIndex + 1}`;

      // Calculate dynamic question box height based on contents
      const hasRoman = item.romanItems && item.romanItems.length > 0;
      const hasPrompt = !!item.prompt;
      const cardHeight = hasRoman ? 2.5 : 2.1;

      slide.addShape(pptx.ShapeType?.roundRect || 'roundRect', {
        x: 0.5,
        y: 1.45,
        w: 12.33,
        h: cardHeight,
        fill: { color: colors.cardBg },
        line: { color: colors.cardBorder, width: 1 },
        rectRadius: 0.15,
      });

      // Question Badge Number Pill
      slide.addText(` [${qNum}]`, {
        x: 0.7,
        y: 1.55,
        w: 4.0,
        h: 0.35,
        fontSize: 14,
        bold: true,
        color: colors.titleColor,
        fontFace: fallbackBodyFont,
      });

      // Source Tag Badge Pill on top right of question card
      const pptxSourceTags = getSourceTags(item);
      if (pptxSourceTags.length > 0) {
        slide.addText(pptxSourceTags.join(' · '), {
          x: 9.8,
          y: 1.55,
          w: 2.8,
          h: 0.35,
          fontSize: 11,
          bold: true,
          color: colors.titleColor,
          fontFace: fallbackBodyFont,
          fill: { color: colors.optionSelectedBg },
          align: 'center',
          valign: 'middle',
          rectRadius: 0.1,
        });
      }

      // Passage (if any)
      if (item.passage) {
        slide.addText(cleanLatex(item.passage), {
          x: 0.7,
          y: 1.9,
          w: 11.9,
          h: 0.35,
          fontSize: 13,
          italic: true,
          color: colors.textColor === '0F172A' ? '334155' : 'CBD5E1',
          fontFace: fallbackBodyFont,
        });
      }

      // Stem Main Text
      const stemY = item.passage ? 2.25 : 1.95;
      slide.addText(cleanLatex(item.stem), {
        x: 0.7,
        y: stemY,
        w: 11.9,
        h: 0.55,
        fontSize: 16,
        bold: true,
        color: colors.textColor,
        fontFace: fallbackBodyFont,
        valign: 'top',
      });

      // Roman Statements (i, ii, iii) Box
      if (hasRoman) {
        const romanY = stemY + 0.55;
        const romanText = item.romanItems!.map(r => cleanLatex(r)).join('\n');
        slide.addShape(pptx.ShapeType?.roundRect || 'roundRect', {
          x: 0.7,
          y: romanY,
          w: 11.9,
          h: 0.7,
          fill: { color: '000000', transparency: 40 },
          line: { color: colors.cardBorder, width: 1 },
          rectRadius: 0.1,
        });
        slide.addText(romanText, {
          x: 0.85,
          y: romanY + 0.05,
          w: 11.6,
          h: 0.6,
          fontSize: 13,
          bold: true,
          color: colors.textColor,
          fontFace: fallbackBodyFont,
          valign: 'middle',
        });
      }

      // Prompt Line (e.g. "নিচের কোনটি সঠিক?")
      if (hasPrompt) {
        const promptY = hasRoman ? stemY + 1.3 : stemY + 0.6;
        slide.addText(cleanLatex(item.prompt!), {
          x: 0.7,
          y: promptY,
          w: 11.9,
          h: 0.3,
          fontSize: 13,
          bold: true,
          italic: true,
          color: colors.titleColor,
          fontFace: fallbackBodyFont,
        });
      }

      // OPTIONS 2x2 GRID
      const options = item.options || [];
      let optionsY = 1.45 + cardHeight + 0.15;

      // Answer slide indicator strip — emerald banner above the options
      if (isAnswerSlide && item.answer) {
        slide.addShape(pptx.ShapeType?.roundRect || 'roundRect', {
          x: 0.5,
          y: optionsY,
          w: 12.33,
          h: 0.5,
          fill: { color: '10B981' },
          line: { color: '34D399', width: 1.5 },
          rectRadius: 0.12,
        });
        slide.addText(`✓  উত্তর: ${item.answer}`, {
          x: 0.5,
          y: optionsY + 0.02,
          w: 12.33,
          h: 0.46,
          fontSize: 14,
          bold: true,
          color: 'FFFFFF',
          fontFace: fallbackBodyFont,
          align: 'center',
          valign: 'middle',
        });
        optionsY += 0.65;
      }

      const positions = [
        { x: 0.5, y: optionsY },
        { x: 6.8, y: optionsY },
        { x: 0.5, y: optionsY + 1.05 },
        { x: 6.8, y: optionsY + 1.05 },
      ];

      options.forEach((opt, oIdx) => {
        if (oIdx >= 4) return;
        const pos = positions[oIdx];
        const isCorrect = opt.isCorrect || opt.key.toLowerCase() === item.answer?.toLowerCase();
        const hl = isCorrect && answerFlags.showOptionHighlight;

        slide.addShape(pptx.ShapeType?.roundRect || 'roundRect', {
          x: pos.x,
          y: pos.y,
          w: 6.0,
          h: 0.95,
          fill: { color: hl ? colors.optionSelectedBg : colors.optionBg },
          line: { color: hl ? colors.optionSelectedBorder : colors.optionBorder, width: hl ? 2 : 1 },
          rectRadius: 0.12,
        });

        slide.addText(opt.key, {
          x: pos.x + 0.15,
          y: pos.y + 0.15,
          w: 0.65,
          h: 0.65,
          fontSize: 16,
          bold: true,
          color: hl ? colors.badgeText : colors.textColor,
          fontFace: fallbackOptionsFont,
          fill: { color: hl ? colors.badgeFill : colors.cardBg },
          align: 'center',
          valign: 'middle',
          rectRadius: 0.08,
        });

        slide.addText(cleanLatex(opt.text), {
          x: pos.x + 0.95,
          y: pos.y + 0.1,
          w: 4.8,
          h: 0.75,
          fontSize: 15,
          bold: true,
          color: hl ? colors.optionSelectedText : colors.textColor,
          fontFace: fallbackOptionsFont,
          valign: 'middle',
        });
      });

      // BOTTOM FOOTER
      slide.addShape(pptx.ShapeType?.line || 'line', {
        x: 0.5,
        y: 6.8,
        w: 12.33,
        h: 0,
        line: { color: colors.cardBorder, width: 1.5 },
      });

      if (config.watermarkAvatar) {
        slide.addImage({
          data: config.watermarkAvatar.startsWith('data:') ? config.watermarkAvatar : undefined,
          path: !config.watermarkAvatar.startsWith('data:') ? config.watermarkAvatar : undefined,
          x: 0.5,
          y: 6.9,
          w: 0.5,
          h: 0.5,
        });
      }

      const instrX = config.watermarkAvatar ? 1.1 : 0.5;
      slide.addText(
        [
          { text: config.watermarkHandle || 'Instructor', options: { fontSize: 13, bold: true, color: colors.textColor, fontFace: fallbackFooterFont } },
          { text: '  • Senior Instructor', options: { fontSize: 11, color: colors.textColor === '0F172A' ? '64748B' : '94A3B8', fontFace: fallbackFooterFont } },
        ],
        { x: instrX, y: 6.9, w: 6.0, h: 0.5, valign: 'middle' }
      );

      slide.addText((config.footerTag || 'BIOMISSION').toUpperCase(), {
        x: 9.5,
        y: 6.9,
        w: 3.3,
        h: 0.5,
        fontSize: 14,
        bold: true,
        color: colors.titleColor,
        fontFace: fallbackFooterFont,
        align: 'right',
        valign: 'middle',
      });
    }

    // Always attach Speaker Notes with clean structured text & raw LaTeX source
    const notesLines = [
      `Question Stem: ${cleanLatex(item.stem)}`,
      item.stem !== cleanLatex(item.stem) ? `Raw LaTeX Stem: ${item.stem}` : '',
      ...(item.romanItems?.length ? [`Statements:\n${item.romanItems.map((r, i) => `  ${i+1}. ${cleanLatex(r)}`).join('\n')}`] : []),
      ...(item.prompt ? [`Prompt: ${cleanLatex(item.prompt)}`] : []),
      `Options:\n${item.options.map(o => `  [${o.key}] ${cleanLatex(o.text)} ${o.isCorrect ? '(Correct Answer)' : ''}`).join('\n')}`,
      item.answer ? `Correct Answer Key: ${item.answer}` : '',
      item.explanation ? `Explanation: ${cleanLatex(item.explanation)}` : '',
    ].filter(Boolean).join('\n\n');

    slide.addNotes(notesLines);
  });

  // Standalone Answer Key Slides (if requested)
  if (includeAnswerKeySlides && items.length > 0) {
    onProgress?.('Generating Standalone Answer Key Slides...');
    const akPages = chunkAnswerKeyPages(items, 20);

    akPages.forEach((page) => {
      const akSlide = pptx.addSlide();
      akSlide.background = { color: colors.bg.replace('#', '') };

      // Header Banner
      akSlide.addShape(pptx.ShapeType?.rect || 'rect', {
        x: 0.5,
        y: 0.4,
        w: 12.33,
        h: 0.9,
        fill: { color: colors.cardBg.replace('#', '') },
        line: { color: colors.cardBorder.replace('#', ''), width: 1 },
      });

      akSlide.addText(`ANSWER KEY SLIDE (${page.startIndex}–${page.endIndex} / ${items.length})`, {
        x: 0.7,
        y: 0.45,
        w: 8.0,
        h: 0.4,
        fontSize: 18,
        bold: true,
        color: colors.titleColor.replace('#', ''),
      });

      akSlide.addText(config.headerTitle || 'MCQ Exam Answer Sheet', {
        x: 0.7,
        y: 0.85,
        w: 8.0,
        h: 0.3,
        fontSize: 12,
        color: colors.textColor.replace('#', ''),
      });

      // 4-Column Grid of Answer Keys
      const cols = 4;
      const rowsPerCol = 5;
      const colWidth = 2.9;
      const startX = 0.5;
      const startY = 1.6;

      page.entries.forEach((entry, idx) => {
        const colIdx = Math.floor(idx / rowsPerCol);
        const rowIdx = idx % rowsPerCol;
        const cellX = startX + colIdx * (colWidth + 0.2);
        const cellY = startY + rowIdx * 0.95;
        const accentHex = (((colors as any).accentColor || colors.badgeFill || colors.titleColor) || '10B981').replace('#', '');

        // Entry Cell Box
        akSlide.addShape(pptx.ShapeType?.rect || 'rect', {
          x: cellX,
          y: cellY,
          w: colWidth,
          h: 0.85,
          fill: { color: colors.cardBg.replace('#', '') },
          line: { color: accentHex, width: 1.5 },
        });

        // Question Number & Key Badge
        akSlide.addText(`Q${entry.questionNumber}. [ ${entry.answerKey} ]`, {
          x: cellX + 0.1,
          y: cellY + 0.1,
          w: colWidth - 0.2,
          h: 0.35,
          fontSize: 14,
          bold: true,
          color: accentHex,
        });

        // Answer Snippet
        const cleanAnswerText = cleanLatex(entry.answerText || '');
        akSlide.addText(cleanAnswerText.slice(0, 35) + (cleanAnswerText.length > 35 ? '...' : ''), {
          x: cellX + 0.1,
          y: cellY + 0.45,
          w: colWidth - 0.2,
          h: 0.3,
          fontSize: 11,
          color: colors.textColor.replace('#', ''),
        });
      });

      akSlide.addNotes(`Answer Key Slide - Questions ${page.startIndex} to ${page.endIndex}`);
    });
  }

  onProgress?.('Generating .pptx file...');
  const baseTitle = config.deckName || 'MCQ_Deck';
  const fileName = `${baseTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pptx`;
  await pptx.writeFile({ fileName });
  onProgress?.('Presentation generated successfully!');
};
