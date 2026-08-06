import { MCQItem, SlideTextBox, SlideTextBoxBind, DeckConfig } from '../types';

export const SLIDE_BOX_BINDS: { bind: SlideTextBoxBind; label: string }[] = [
  { bind: 'stem', label: '+ Question' },
  { bind: 'options', label: '+ Options' },
  { bind: 'answer', label: '+ Answer' },
  { bind: 'explanation', label: '+ Explanation' },
  { bind: 'passage', label: '+ Passage' },
  { bind: 'prompt', label: '+ Prompt' },
  { bind: 'roman', label: '+ Roman Items' },
  { bind: 'source', label: '+ Source' },
  { bind: 'questionNumber', label: '+ Question No.' },
  { bind: 'brand', label: '+ Brand Name' },
  { bind: 'headerTitle', label: '+ Header Title' },
  { bind: 'footerTag', label: '+ Footer Tag' },
  { bind: 'watermark', label: '+ Watermark' },
  { bind: 'free', label: '+ Free Text' },
];

export const SLIDE_BOX_COLOR_PRESETS = ['#ffffff', '#fbbf24', '#f59e0b', '#38bdf8', '#34d399', '#fb7185', '#a78bfa', '#000000'];

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const SLIDE_W = 1920;
export const SLIDE_H = 1080;

// Resolve the effective font for a text box — per-box override first, then the
// deck's role font for that bind (set in Deck Settings), then the deck base font.
export const getBoxFontFamily = (box: SlideTextBox, config: DeckConfig): string => {
  if (box.fontFamily) return box.fontFamily;
  const def = config.fontFamily || "'Kalpurush', serif";
  switch (box.bind) {
    case 'headerTitle':
    case 'brand':
      return config.headerFont || def;
    case 'options':
    case 'answer':
      return config.optionsFont || def;
    case 'footerTag':
    case 'watermark':
      return config.footerFont || def;
    default:
      return config.bodyFont || def;
  }
};

export const defaultSlideTextBoxes = (): SlideTextBox[] => [
  { id: 'b_brand', bind: 'brand', x: 80, y: 60, w: 900, fontSize: 44, color: '#fbbf24', align: 'left', bold: true },
  { id: 'b_header', bind: 'headerTitle', x: 80, y: 120, w: 1200, fontSize: 34, color: '#ffffff', align: 'left', bold: false },
  { id: 'b_stem', bind: 'stem', x: 120, y: 360, w: 1400, fontSize: 56, color: '#ffffff', align: 'left', bold: true },
  { id: 'b_options', bind: 'options', x: 120, y: 620, w: 1300, fontSize: 40, color: '#ffffff', align: 'left', bold: false },
  { id: 'b_footer', bind: 'footerTag', x: 80, y: 980, w: 700, fontSize: 32, color: '#fbbf24', align: 'left', bold: true },
];

export const formatSlideQNumber = (idx: number, format: string) => {
  const num = idx + 1;
  if (format === 'bangla') {
    const banglaNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map(d => banglaNums[parseInt(d)] || d).join('');
  } else if (format === 'q_prefix') {
    return `Q${num}`;
  }
  return `${num}`;
};

export const getSlideBoxContent = (
  box: SlideTextBox,
  item: MCQItem,
  config: DeckConfig,
  currentIndex: number
): string => {
  switch (box.bind) {
    case 'stem': return item.stem;
    case 'answer': return item.answer || '';
    case 'explanation': return item.explanation || '';
    case 'passage': return item.passage || '';
    case 'prompt': return item.prompt || '';
    case 'roman': return (item.romanItems || []).join('\n');
    case 'source': return item.source || '';
    case 'questionNumber': return formatSlideQNumber(currentIndex, config.questionNumberFormat);
    case 'brand': return config.brandName || "RAKIB'S CLASSROOM";
    case 'headerTitle': return config.headerTitle || 'অধ্যায় ৮ঃ রেচন প্রক্রিয়া';
    case 'footerTag': return config.footerTag || 'BIOMISSION';
    case 'watermark': return config.watermarkHandle || 'Hasnat Shuvro';
    case 'free': return box.text || '';
    case 'options': return '';
    case 'icon': return '';
    case 'image': return '';
  }
};
