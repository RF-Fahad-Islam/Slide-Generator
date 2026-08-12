import { MCQItem, SlideTextBox, SlideTextBoxBind, DeckConfig, getSourceTags, getEffectiveBadgeTag } from '../types';
import { textContainsMath } from './latexFormatter';
import { resolveTheme } from './themeResolver';

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
  { bind: 'badgeTag', label: '+ Badge Tag' },
  { bind: 'footerTag', label: '+ Footer Tag' },
  { bind: 'watermark', label: '+ Watermark' },
  { bind: 'slideCounter', label: '+ Page Number' },
  { bind: 'free', label: '+ Free Text' },
];

export const SLIDE_BOX_COLOR_PRESETS = ['#ffffff', '#fbbf24', '#f59e0b', '#38bdf8', '#34d399', '#fb7185', '#a78bfa', '#000000'];

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const SLIDE_W = 1920;
export const SLIDE_H = 1080;

export const checkIsOptionCorrect = (opt: { key: string; isCorrect?: boolean }, answer?: string, optIndex?: number): boolean => {
  if (opt.isCorrect) return true;
  if (!answer) return false;
  const cleanAns = answer.trim().toLowerCase();
  const cleanKey = opt.key.trim().toLowerCase();
  if (cleanKey === cleanAns) return true;

  const banglaKeys = ['ক', 'খ', 'গ', 'ঘ'];
  const englishKeys = ['a', 'b', 'c', 'd'];
  const numericKeys = ['1', '2', '3', '4'];

  const ansIdxBangla = banglaKeys.indexOf(cleanAns);
  const ansIdxEng = englishKeys.indexOf(cleanAns);
  const ansIdxNum = numericKeys.indexOf(cleanAns);
  const targetIdx = ansIdxBangla >= 0 ? ansIdxBangla : ansIdxEng >= 0 ? ansIdxEng : ansIdxNum >= 0 ? ansIdxNum : -1;

  if (optIndex !== undefined && targetIdx >= 0 && optIndex === targetIdx) return true;

  const keyIdxBangla = banglaKeys.indexOf(cleanKey);
  const keyIdxEng = englishKeys.indexOf(cleanKey);
  const keyIdxNum = numericKeys.indexOf(cleanKey);
  const currentKeyIdx = keyIdxBangla >= 0 ? keyIdxBangla : keyIdxEng >= 0 ? keyIdxEng : keyIdxNum >= 0 ? keyIdxNum : -1;

  if (targetIdx >= 0 && currentKeyIdx >= 0 && targetIdx === currentKeyIdx) return true;

  return false;
};

// Resolve the effective font for a text box — per-box override first, then the
// deck's role font for that bind (set in Deck Settings), then the deck base font.
export const getBoxFontFamily = (box: SlideTextBox, config: DeckConfig): string => {
  if (box.fontFamily) return box.fontFamily;
  const def = config.fontFamily || "'Kalpurush', serif";
  switch (box.bind) {
    case 'headerTitle':
    case 'brand':
    case 'badgeTag':
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
  item?: MCQItem,
  config?: DeckConfig,
  currentIndex: number = 0,
  totalCount: number = 1
): string => {
  if (box.bind !== 'options' && box.text !== undefined && box.text !== null && box.text !== '') {
    return box.text;
  }
  const fmt = config?.questionNumberFormat || 'bangla';
  const dummyItem: MCQItem = { id: 'dummy', questionType: 'standard', stem: '', options: [], answer: '' };
  const targetItem = item || dummyItem;

  switch (box.bind) {
    case 'stem': return targetItem.stem || '';
    case 'answer': return targetItem.answer ? `উত্তর: ${targetItem.answer}` : 'উত্তর: খ';
    case 'explanation': return targetItem.explanation || 'ব্যাখ্যা: (এখানে উত্তর ব্যাখ্যা থাকবে)';
    case 'passage': return targetItem.passage || '';
    case 'prompt': return targetItem.prompt || '';
    case 'roman': return (targetItem.romanItems || []).join('\n');
    case 'source': return getSourceTags(targetItem).join(' · ');
    case 'questionNumber': return formatSlideQNumber(currentIndex, fmt);
    case 'brand': return config?.brandName || "NOBEL'S CLASSROOM";
    case 'headerTitle': return config?.headerTitle || 'অধ্যায় ৮ঃ রেচন প্রক্রিয়া';
    case 'badgeTag': return config ? getEffectiveBadgeTag(config, targetItem) : '';
    case 'footerTag': return config?.footerTag || 'BIOMISSION';
    case 'watermark': return config?.watermarkHandle || 'Hasnat Shuvro';
    case 'slideCounter': return `${formatSlideQNumber(currentIndex, fmt)} / ${formatSlideQNumber(Math.max(1, totalCount), fmt)}`;
    case 'free': return box.text || '';
    case 'options': return '';
    case 'icon': return '';
    case 'image': return '';
    default: return box.text || '';
  }
};

// True if a text box's rendered content contains LaTeX/math that the DOM
// typesets via KaTeX but PPTX native text cannot reproduce — such boxes must
// be rasterized to an image for the editable export to stay faithful.
// Options boxes check every option's text (each option is typeset separately).
export const boxContentHasMath = (
  box: SlideTextBox,
  item?: MCQItem,
  config?: DeckConfig,
  currentIndex: number = 0,
  totalCount: number = 1
): boolean => {
  if (box.bind === 'options') {
    const opts = item?.options || [];
    return opts.some(o => textContainsMath(o.text));
  }
  if (box.bind === 'roman') {
    return (item?.romanItems || []).some(r => textContainsMath(r));
  }
  const content = getSlideBoxContent(box, item, config, currentIndex, totalCount);
  return textContainsMath(content);
};

export const ensureAnswerBox = (boxes: SlideTextBox[], config: DeckConfig): SlideTextBox[] => {
  const hasAnswer = boxes.some(b => b.bind === 'answer');
  if (hasAnswer || boxes.length === 0) return boxes;

  const theme = resolveTheme(config);
  return [
    ...boxes,
    {
      id: 'ans_pill_injected',
      bind: 'answer',
      x: 760,
      y: 35,
      w: 400,
      fontSize: 24,
      color: theme.isLight ? '#065f46' : '#ecfdf5',
      align: 'center',
      bold: true,
      fontFamily: theme.fonts.bodyFont || 'sans-serif',
      shape: 'pill',
      bg: theme.isLight ? 'rgba(209,250,229,0.95)' : 'rgba(16,185,129,0.25)',
    } as SlideTextBox
  ];
};
