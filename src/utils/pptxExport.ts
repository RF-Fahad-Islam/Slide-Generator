import pptxgen from 'pptxgenjs';
import { DeckConfig, MCQItem } from '../types';
import { getBackgroundPresetUrl } from './backgroundPresets';
import { getTemplateById } from '../templates/registry';

export const exportDeckToPPTX = async (
  items: MCQItem[],
  config: DeckConfig,
  onProgress?: (msg: string) => void,
  slideDataUrls?: string[]
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
  const bgUrl = getBackgroundPresetUrl(config.bgPreset, config.bgImageUrl);

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

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    onProgress?.(`Building PPTX slide ${idx + 1} of ${items.length}...`);

    const slide = pptx.addSlide();

    // Check if we have pre-rendered high-res slide images from SlideCanvas for exact visual match
    if (slideDataUrls && slideDataUrls[idx]) {
      slide.addImage({
        data: slideDataUrls[idx],
        x: 0,
        y: 0,
        w: 13.333,
        h: 7.5,
      });
    } else {
      // Native PPTX shape fallback
      if (bgUrl && bgUrl.startsWith('data:image')) {
        slide.background = { data: bgUrl };
      } else if (bgUrl && (bgUrl.startsWith('http') || bgUrl.startsWith('data:image'))) {
        slide.background = { path: bgUrl };
      } else {
        slide.background = { color: colors.bg };
      }

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

      slide.addText(`${idx + 1} / ${items.length}`, {
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
          ? ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'][idx + 1] || `${idx + 1}`
          : config.questionNumberFormat === 'q_prefix'
          ? `Q${idx + 1}`
          : `${idx + 1}`;

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
      const optionsY = 1.45 + cardHeight + 0.15;
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
          fill: { color: isCorrect && config.showAnswerInSlide ? colors.optionSelectedBg : colors.optionBg },
          line: { color: isCorrect && config.showAnswerInSlide ? colors.optionSelectedBorder : colors.optionBorder, width: isCorrect && config.showAnswerInSlide ? 2 : 1 },
          rectRadius: 0.12,
        });

        slide.addText(opt.key, {
          x: pos.x + 0.15,
          y: pos.y + 0.15,
          w: 0.65,
          h: 0.65,
          fontSize: 16,
          bold: true,
          color: isCorrect && config.showAnswerInSlide ? colors.badgeText : colors.textColor,
          fill: { color: isCorrect && config.showAnswerInSlide ? colors.badgeFill : colors.cardBg },
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
          color: isCorrect && config.showAnswerInSlide ? colors.optionSelectedText : colors.textColor,
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

    // Always attach Speaker Notes with clean structured text
    const notesLines = [
      `Question Stem: ${cleanLatex(item.stem)}`,
      ...(item.romanItems?.length ? [`Statements:\n${item.romanItems.map((r, i) => `  ${i+1}. ${cleanLatex(r)}`).join('\n')}`] : []),
      ...(item.prompt ? [`Prompt: ${cleanLatex(item.prompt)}`] : []),
      `Options:\n${item.options.map(o => `  [${o.key}] ${cleanLatex(o.text)} ${o.isCorrect ? '(Correct)' : ''}`).join('\n')}`,
      item.answer ? `Correct Answer: ${item.answer}` : '',
      item.explanation ? `Explanation: ${cleanLatex(item.explanation)}` : '',
    ].filter(Boolean).join('\n\n');

    slide.addNotes(notesLines);
  }

  onProgress?.('Generating .pptx file...');
  const fileName = `${(config.brandName || 'MCQ_Deck').replace(/[^a-zA-Z0-9_-]/g, '_')}_16x9_Presentation.pptx`;
  await pptx.writeFile({ fileName });
  onProgress?.('Presentation generated successfully!');
};
