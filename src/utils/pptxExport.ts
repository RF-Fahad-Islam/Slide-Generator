import pptxgen from 'pptxgenjs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DeckConfig, MCQItem, SlideTextBox } from '../types';
import { getSlideBoxContent, getBoxFontFamily } from './slideTextBoxes';
import { getBackgroundPresetUrl } from './backgroundPresets';
import { getTemplateById } from '../templates/registry';
import { getSlideIcon } from './slideElements';

export interface PptxSlideSpec {
  item: MCQItem;
  questionIndex: number;
  isAnswerSlide: boolean;
}

export const exportDeckToPPTX = async (
  items: MCQItem[],
  config: DeckConfig,
  onProgress?: (msg: string) => void,
  slideDataUrls?: string[],
  useImages?: boolean,
  slides?: PptxSlideSpec[],
  includeExplanation = true
) => {
  onProgress?.('Initializing 16:9 PowerPoint Presentation...');

  const pptx = new pptxgen();
  pptx.defineLayout({ name: 'LAYOUT_16x9', width: 13.333, height: 7.5 });
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = `${config.brandName || 'EdTech'} - MCQ Deck`;
  pptx.company = config.brandName || "RAKIB'S CLASSROOM";
  pptx.author = config.watermarkHandle || 'Instructor';

  const template = getTemplateById(config.templateId);
  const colors = template.styles.hexColors;

  // Physical slide list — explicit (question + answer pairs) or one per item.
  const slideSpecs: PptxSlideSpec[] = slides ?? items.map((item, i) => ({ item, questionIndex: i, isAnswerSlide: false }));
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

  // Render one slide text-box as a native editable PPTX layer (so fields and
  // shapes stay editable after import — no flattened image).
  const renderTextBox = (
    slide: any,
    box: SlideTextBox,
    item: MCQItem,
    cfg: DeckConfig,
    curIdx: number,
    highlight: boolean
  ) => {
    if (box.bind === 'icon') {
      // Decorative lucide icon — embed as an SVG image layer (matches SlideCanvas)
      const iconW = (box.w || box.fontSize * 1.5) * PX_TO_IN;
      const iconH = (box.h || box.fontSize * 1.5) * PX_TO_IN;
      // Container shape (pill / card / banner) behind the icon — editable layer
      if (box.shape && box.shape !== 'plain' && box.bg) {
        slide.addShape(pptx.ShapeType?.roundRect || 'roundRect', {
          x: box.x * PX_TO_IN,
          y: box.y * PX_TO_IN,
          w: iconW,
          h: iconH,
          fill: { color: cssColorToHex(box.bg, colors.bg) },
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
    if (box.bind === 'explanation' && !includeExplanation) return;

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
      // like the canvas flex-wrap row (~0.55 * fontSize per character).
      const estimateOptWidth = (opt: MCQItem['options'][number]): number => {
        const textW = (cleanLatex(opt.text).length + 1) * box.fontSize * 0.55;
        const keyW = box.fontSize * 1.1;
        const pad = box.fontSize * 1.6;
        const tickW = 0;
        return Math.min(Math.max(textW + keyW + pad + tickW, box.fontSize * 3), (box.w || 600));
      };

      const placed = opts.map((opt, oi) => {
        if (oi >= 4) return { opt, oi, x: 0, y: 0, w: 0, h: 0 };
        const isCorrect = opt.isCorrect || opt.key.toLowerCase() === item.answer?.toLowerCase();
        const highlighted = highlight && isCorrect;

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
        const hl = highlight && isCorrect;

        // Option graphic — an editable rounded-rect pill/card (or no shape for plain)
        if (box.shape && box.shape !== 'plain') {
          slide.addShape(pptx.ShapeType?.roundRect || 'roundRect', {
            x,
            y,
            w,
            h,
            fill: {
              color: hl
                ? colors.optionSelectedBg
                : (box.bg ? cssColorToHex(box.bg, colors.bg) : colors.optionBg),
            },
            line: hl
              ? { color: colors.optionSelectedBorder, width: 2 }
              : { color: 'FFFFFF', transparency: 92, width: 0.75 },
            rectRadius: radius,
          });
        }

        slide.addText(
          [
            {
              text: `${opt.key}) `,
              options: { bold: true, color: hl ? colors.optionSelectedText : colors.titleColor },
            },
            {
              text: cleanLatex(opt.text),
              options: { color: hl ? colors.optionSelectedText : cssColorToHex(box.color || '#ffffff', colors.bg) },
            },
          ],
          {
            x: x + (box.shape !== 'plain' ? 0.18 : 0),
            y,
            w: w - (hl ? 0.7 : 0.3),
            h,
            fontSize: fontPt,
            bold: box.bold,
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
            color: colors.optionSelectedText,
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
    const boxH = (box.h || lineCount * box.fontSize * 1.45 + 16) * PX_TO_IN;
    const fill = box.bg ? cssColorToHex(box.bg, colors.bg) : undefined;

    // Container shape (pill / card / banner) behind the text — an editable layer
    if (box.shape && box.shape !== 'plain' && fill) {
      slide.addShape(pptx.ShapeType?.roundRect || 'roundRect', {
        x: box.x * PX_TO_IN,
        y: box.y * PX_TO_IN,
        w: boxW,
        h: boxH,
        fill: { color: fill },
        line: { color: 'FFFFFF', transparency: 92, width: 0.75 },
        rectRadius: box.shape === 'pill' ? 0.5 : box.shape === 'card' ? 0.09 : 0,
        shadow: box.shape === 'card' ? { type: 'outer', opacity: 0.2, blur: 8, angle: 90, distance: 4 } : undefined,
      });
    }

    if (!text) return;

    slide.addText(cleanLatex(text), {
      x: box.x * PX_TO_IN,
      y: box.y * PX_TO_IN,
      w: boxW,
      h: boxH,
      fontSize: box.fontSize * PX_TO_PT,
      color: cssColorToHex(box.color || '#ffffff', colors.bg),
      bold: box.bold,
      align: box.align,
      fontFace: getBoxFontFamily(box, cfg).replace(/'/g, '').split(',')[0].trim(),
      valign: 'top',
    });
  };

  // Render the slide background as editable layers (mirrors SlideCanvas):
  // 1) base canvas color as the slide background, 2) the deck's background
  // preset/uploaded image as a full-bleed selectable picture, 3) the
  // readability tint as a translucent rectangle, 4) the decorative ambient
  // radial glows. All are real PowerPoint objects so the user can select,
  // move, resize or delete them. Uses the per-slide effective config so
  // slide-level (customConfig) background overrides are respected.
  const renderSlideBackground = (slide: any, cfg: DeckConfig) => {
    const slideTemplate = getTemplateById(cfg.templateId, cfg.customTheme);
    const slideColors = slideTemplate.styles.hexColors;
    const slideBgUrl = getBackgroundPresetUrl(cfg.bgPreset, cfg.bgImageUrl);
    const slideIsLight = slideTemplate.themeType === 'light';
    const gradientStops = slideTemplate.styles.bgGradientStops;

    slide.background = {
      color: slideBgUrl ? '0F172A' : gradientStops ? gradientStops[1] : slideColors.bg,
    };

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

    // Per-slide design override (mirrors SlideCanvas) + boxed-design detection
    const effectiveConfig: DeckConfig = { ...config, ...(item.customConfig || {}) };
    const boxes: SlideTextBox[] = effectiveConfig.slideTextBoxes || [];
    const isBoxedDesign = boxes.length > 0;
    // Correct option is highlighted on answer slides (and when the deck's
    // in-place highlight mode is on) — mirrors SlideCanvas's isAnswerVariant.
    const highlightAnswers = isAnswerSlide || effectiveConfig.showAnswerInSlide;

    // Check if we have pre-rendered high-res slide images from SlideCanvas for exact visual match
    const shouldUseImages = useImages === undefined ? !!(slideDataUrls && slideDataUrls.length > 0) : useImages;

    if (shouldUseImages && slideDataUrls && slideDataUrls[pos]) {
      slide.addImage({
        data: slideDataUrls[pos],
        x: 0,
        y: 0,
        w: 13.333,
        h: 7.5,
      });
    } else {
      if (isBoxedDesign) {
        // Boxed-design mode — background layer + slide text boxes only (mirrors SlideCanvas)
        renderSlideBackground(slide, effectiveConfig);
        // Answer slide indicator strip (top-center, mirrors SlideCanvas overlay)
        if (isAnswerSlide && item.answer) {
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
        for (const box of boxes) {
          renderTextBox(slide, box, item, effectiveConfig, questionIndex, highlightAnswers);
        }
      } else {
      // Native PPTX shape fallback
      renderSlideBackground(slide, effectiveConfig);

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

      const brandX = config.logoUrl ? 1.3 : 0.5;
      slide.addText(
        [
          {
            text: (config.brandName || "RAKIB'S CLASSROOM").toUpperCase(),
            options: { fontSize: 16, bold: true, color: colors.titleColor },
          },
          ...(config.headerTitle
            ? [
                {
                  text: `\n${cleanLatex(config.headerTitle)}`,
                  options: { fontSize: 12, color: colors.textColor === '0F172A' ? '475569' : 'CBD5E1' },
                },
              ]
            : []),
        ],
        { x: brandX, y: 0.35, w: 7.0, h: 0.8, align: 'left', valign: 'top' }
      );

      if (config.badgeTag) {
        slide.addText(config.badgeTag, {
          x: 8.8,
          y: 0.4,
          w: 2.8,
          h: 0.45,
          fontSize: 12,
          bold: true,
          color: colors.badgeText,
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

      // Question Badge Number Pill + Title
      slide.addText(` [${qNum}]  প্রশ্ন`, {
        x: 0.7,
        y: 1.55,
        w: 4.0,
        h: 0.35,
        fontSize: 14,
        bold: true,
        color: colors.titleColor,
      });

      // Source Tag Badge Pill on top right of question card
      if (item.source) {
        slide.addText(item.source, {
          x: 9.8,
          y: 1.55,
          w: 2.8,
          h: 0.35,
          fontSize: 11,
          bold: true,
          color: colors.titleColor,
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

        slide.addShape(pptx.ShapeType?.roundRect || 'roundRect', {
          x: pos.x,
          y: pos.y,
          w: 6.0,
          h: 0.95,
          fill: { color: isCorrect && highlightAnswers ? colors.optionSelectedBg : colors.optionBg },
          line: { color: isCorrect && highlightAnswers ? colors.optionSelectedBorder : colors.optionBorder, width: isCorrect && highlightAnswers ? 2 : 1 },
          rectRadius: 0.12,
        });

        slide.addText(opt.key, {
          x: pos.x + 0.15,
          y: pos.y + 0.15,
          w: 0.65,
          h: 0.65,
          fontSize: 16,
          bold: true,
          color: isCorrect && highlightAnswers ? colors.badgeText : colors.textColor,
          fill: { color: isCorrect && highlightAnswers ? colors.badgeFill : colors.cardBg },
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
          color: isCorrect && highlightAnswers ? colors.optionSelectedText : colors.textColor,
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
          { text: config.watermarkHandle || 'Instructor', options: { fontSize: 13, bold: true, color: colors.textColor } },
          { text: '  • Senior Instructor', options: { fontSize: 11, color: colors.textColor === '0F172A' ? '64748B' : '94A3B8' } },
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
        align: 'right',
        valign: 'middle',
      });
      }
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

  onProgress?.('Generating .pptx file...');
  const fileName = `${(config.brandName || 'MCQ_Deck').replace(/[^a-zA-Z0-9_-]/g, '_')}_16x9_Presentation.pptx`;
  await pptx.writeFile({ fileName });
  onProgress?.('Presentation generated successfully!');
};
