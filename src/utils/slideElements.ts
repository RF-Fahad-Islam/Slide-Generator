import {
  type LucideIcon,
  GraduationCap,
  BookOpen,
  Lightbulb,
  Target,
  Brain,
  Atom,
  FlaskConical,
  Trophy,
  Award,
  Star,
  Zap,
  Rocket,
  Compass,
  Crown,
  Medal,
  Sparkles,
  Timer,
  CheckCircle2,
  Heart,
  HelpCircle,
  Info,
  Quote,
  List,
  ListChecks,
  MessageSquare,
  Hash,
  Tag,
  Shapes,
  Wand2,
  PenLine,
  LayoutTemplate,
  SquareStack,
  PanelTop,
} from 'lucide-react';
import { SlideTextBox } from '../types';

// ---------------------------------------------------------------------------
// Curated lucide icon library for slide elements (rendered as decorative icons)
// ---------------------------------------------------------------------------

export interface SlideIconDef {
  name: string;
  label: string;
  icon: LucideIcon;
}

export const SLIDE_ICON_LIBRARY: SlideIconDef[] = [
  { name: 'GraduationCap', label: 'Graduation', icon: GraduationCap },
  { name: 'BookOpen', label: 'Book', icon: BookOpen },
  { name: 'Lightbulb', label: 'Idea', icon: Lightbulb },
  { name: 'Target', label: 'Target', icon: Target },
  { name: 'Brain', label: 'Brain', icon: Brain },
  { name: 'Atom', label: 'Atom', icon: Atom },
  { name: 'FlaskConical', label: 'Lab Flask', icon: FlaskConical },
  { name: 'Trophy', label: 'Trophy', icon: Trophy },
  { name: 'Award', label: 'Award', icon: Award },
  { name: 'Star', label: 'Star', icon: Star },
  { name: 'Zap', label: 'Lightning', icon: Zap },
  { name: 'Rocket', label: 'Rocket', icon: Rocket },
  { name: 'Compass', label: 'Compass', icon: Compass },
  { name: 'Crown', label: 'Crown', icon: Crown },
  { name: 'Medal', label: 'Medal', icon: Medal },
  { name: 'Sparkles', label: 'Sparkles', icon: Sparkles },
  { name: 'Timer', label: 'Timer', icon: Timer },
  { name: 'CheckCircle2', label: 'Verified', icon: CheckCircle2 },
  { name: 'Heart', label: 'Heart', icon: Heart },
  { name: 'HelpCircle', label: 'Help', icon: HelpCircle },
  { name: 'Info', label: 'Info', icon: Info },
  { name: 'Quote', label: 'Quote', icon: Quote },
  { name: 'List', label: 'List', icon: List },
  { name: 'ListChecks', label: 'Checklist', icon: ListChecks },
  { name: 'MessageSquare', label: 'Chat', icon: MessageSquare },
  { name: 'Hash', label: 'Hashtag', icon: Hash },
  { name: 'Tag', label: 'Tag', icon: Tag },
  { name: 'Shapes', label: 'Shapes', icon: Shapes },
  { name: 'Wand2', label: 'Magic Wand', icon: Wand2 },
  { name: 'PenLine', label: 'Pen', icon: PenLine },
];

export const getSlideIcon = (name: string): LucideIcon | undefined =>
  SLIDE_ICON_LIBRARY.find(d => d.name === name)?.icon;

// ---------------------------------------------------------------------------
// Element factories — single pre-designed elements appended to the deck
// ---------------------------------------------------------------------------

let elementSeq = 0;
const eid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${elementSeq++}`;

export interface SlideElementDef {
  id: string;
  label: string;
  desc: string;
  category?: 'headers' | 'content' | 'highlights' | 'media';
  icon: LucideIcon;
  accentColor?: string;
  previewBg?: string;
  build: (extra?: { imageUrl?: string; iconName?: string }) => SlideTextBox;
}

export const makePillHeaderBox = (): SlideTextBox => ({
  id: eid('el_pill'),
  bind: 'headerTitle',
  x: 120,
  y: 80,
  w: 700,
  fontSize: 42,
  color: '#fbbf24',
  align: 'center',
  bold: true,
  shape: 'pill',
  bg: 'rgba(251,191,36,0.16)',
});

export const makeRoundedOptionsBox = (): SlideTextBox => ({
  id: eid('el_options_card'),
  bind: 'options',
  x: 120,
  y: 560,
  w: 1300,
  fontSize: 38,
  color: '#ffffff',
  align: 'left',
  bold: false,
  shape: 'card',
  bg: 'rgba(255,255,255,0.07)',
});

export const makeOptionPillsBox = (): SlideTextBox => ({
  id: eid('el_options_pills'),
  bind: 'options',
  x: 120,
  y: 620,
  w: 1200,
  fontSize: 34,
  color: '#ffffff',
  align: 'center',
  bold: false,
  shape: 'pill',
  bg: 'rgba(148,163,184,0.14)',
});

export const makeCalloutBox = (): SlideTextBox => ({
  id: eid('el_callout'),
  bind: 'free',
  text: '💡 PRO TIP: Read the question stem carefully before checking options!',
  x: 120,
  y: 780,
  w: 1150,
  fontSize: 34,
  color: '#fde68a',
  align: 'left',
  bold: true,
  shape: 'card',
  bg: 'rgba(245,158,11,0.16)',
});

export const makeFormulaBox = (): SlideTextBox => ({
  id: eid('el_formula'),
  bind: 'free',
  text: 'E = mc²  |  f(x) = ∫₀^∞ x² e^(-x) dx',
  x: 120,
  y: 760,
  w: 1200,
  fontSize: 36,
  color: '#38bdf8',
  fontFamily: "'Fira Code', 'Courier New', monospace",
  align: 'center',
  bold: true,
  shape: 'card',
  bg: 'rgba(15,23,42,0.95)',
});

export const makeQuoteBox = (): SlideTextBox => ({
  id: eid('el_quote'),
  bind: 'free',
  text: '"Education is not the learning of facts, but the training of the mind to think." — Albert Einstein',
  x: 120,
  y: 780,
  w: 1300,
  fontSize: 32,
  color: '#e2e8f0',
  align: 'center',
  bold: false,
  shape: 'card',
  bg: 'rgba(255,255,255,0.06)',
});

export const makeTakeawayBox = (): SlideTextBox => ({
  id: eid('el_takeaway'),
  bind: 'explanation',
  text: '❇️ KEY TAKEAWAY: Master the core metabolic pathways for board exams.',
  x: 120,
  y: 820,
  w: 1680,
  fontSize: 30,
  color: '#a7f3d0',
  align: 'left',
  bold: true,
  shape: 'card',
  bg: 'rgba(16,185,129,0.16)',
});

export const makeInstructorBox = (): SlideTextBox => ({
  id: eid('el_instructor'),
  bind: 'watermark',
  text: 'Hasnat Shuvro — Senior Instructor & Mentor',
  x: 120,
  y: 980,
  w: 800,
  fontSize: 24,
  color: '#fbbf24',
  align: 'left',
  bold: true,
  shape: 'pill',
  bg: 'rgba(15,23,42,0.9)',
});

export const makeStatHighlightBox = (): SlideTextBox => ({
  id: eid('el_stathighlight'),
  bind: 'free',
  text: '⚡ 98% SUCCESS RATE  ·  500+ SOLVED MCQS',
  x: 120,
  y: 840,
  w: 1000,
  fontSize: 28,
  color: '#38bdf8',
  align: 'center',
  bold: true,
  shape: 'pill',
  bg: 'rgba(56,189,248,0.18)',
});

export const makeDividerBox = (): SlideTextBox => ({
  id: eid('el_divider'),
  bind: 'free',
  text: '━━━━━━━━━━━━━━━ ★ ━━━━━━━━━━━━━━━',
  x: 120,
  y: 500,
  w: 1680,
  fontSize: 28,
  color: '#f59e0b',
  align: 'center',
  bold: true,
  shape: 'plain',
});

export const makeAlertBox = (): SlideTextBox => ({
  id: eid('el_alert'),
  bind: 'free',
  text: '⚠️ EXAM WARNING: Watch out for negative markings on multi-option questions!',
  x: 120,
  y: 780,
  w: 1400,
  fontSize: 32,
  color: '#fca5a5',
  align: 'left',
  bold: true,
  shape: 'card',
  bg: 'rgba(244,63,94,0.18)',
});

export const makeBannerImageBox = (imageUrl: string): SlideTextBox => ({
  id: eid('el_banner'),
  bind: 'image',
  x: 120,
  y: 140,
  w: 1680,
  h: 380,
  fontSize: 0,
  color: '#ffffff',
  align: 'center',
  bold: false,
  imageUrl,
});

export const makeIconBox = (iconName: string): SlideTextBox => ({
  id: eid('el_icon'),
  bind: 'icon',
  x: 120,
  y: 120,
  w: 150,
  h: 150,
  fontSize: 100,
  color: '#fbbf24',
  align: 'center',
  bold: false,
  iconName,
  shape: 'card',
  bg: 'rgba(251,191,36,0.10)',
});

export const SLIDE_ELEMENT_DEFS: SlideElementDef[] = [
  { id: 'callout', label: 'Callout Tip Box', desc: 'Amber glow card for key tips & notes', category: 'highlights', icon: Lightbulb, accentColor: '#f59e0b', previewBg: 'rgba(245,158,11,0.16)', build: () => makeCalloutBox() },
  { id: 'formula', label: 'Formula / Code Container', desc: 'Monospace code & equation box', category: 'content', icon: Atom, accentColor: '#38bdf8', previewBg: 'rgba(15,23,42,0.95)', build: () => makeFormulaBox() },
  { id: 'quote', label: 'Teacher Quote Panel', desc: 'Translucent glass quote card', category: 'content', icon: Quote, accentColor: '#cbd5e1', previewBg: 'rgba(255,255,255,0.06)', build: () => makeQuoteBox() },
  { id: 'takeaway', label: 'Key Takeaway Card', desc: 'Emerald green summary banner', category: 'highlights', icon: Sparkles, accentColor: '#10b981', previewBg: 'rgba(16,185,129,0.16)', build: () => makeTakeawayBox() },
  { id: 'instructor', label: 'Instructor Card', desc: 'Mentor name & avatar badge', category: 'headers', icon: GraduationCap, accentColor: '#fbbf24', previewBg: 'rgba(15,23,42,0.9)', build: () => makeInstructorBox() },
  { id: 'stathighlight', label: 'Stat Highlight Pill', desc: 'Large capsule stat badge', category: 'highlights', icon: Zap, accentColor: '#38bdf8', previewBg: 'rgba(56,189,248,0.18)', build: () => makeStatHighlightBox() },
  { id: 'alert', label: 'Alert Warning Banner', desc: 'High-priority rose warning card', category: 'highlights', icon: HelpCircle, accentColor: '#f43f5e', previewBg: 'rgba(244,63,94,0.18)', build: () => makeAlertBox() },
  { id: 'divider', label: 'Accent Divider', desc: 'Gold gradient section rule', category: 'headers', icon: PenLine, accentColor: '#f59e0b', build: () => makeDividerBox() },
  { id: 'pill_header', label: 'Pill Header', desc: 'Rounded capsule title bar', category: 'headers', icon: PanelTop, accentColor: '#f59e0b', build: () => makePillHeaderBox() },
  { id: 'rounded_options', label: 'Rounded Options', desc: 'Soft cards for choices', category: 'content', icon: SquareStack, accentColor: '#94a3b8', build: () => makeRoundedOptionsBox() },
  { id: 'option_pills', label: 'Option Pills', desc: 'Chip-style answer choices', category: 'content', icon: Shapes, accentColor: '#94a3b8', build: () => makeOptionPillsBox() },
  { id: 'banner_image', label: 'Banner Image', desc: 'Full-width picture bar', category: 'media', icon: LayoutTemplate, accentColor: '#a78bfa', build: extra => (extra?.imageUrl ? makeBannerImageBox(extra.imageUrl) : makeBannerImageBox('')) },
  { id: 'icon', label: 'Icon Badge', desc: 'Decorative lucide icon', category: 'media', icon: Star, accentColor: '#fbbf24', build: extra => makeIconBox(extra?.iconName || 'GraduationCap') },
];

// ---------------------------------------------------------------------------
// Composed layouts — replace the deck's text boxes with a full pre-designed set
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Classroom View — the classroom / live-writing text-box layout enforced onto
// the deck when "Classroom View" is chosen in Deck Settings. Question stem sits
// top-left, a wide blank writing space stays in the center for stylus work, and
// the options stack vertically on the right.
// ---------------------------------------------------------------------------

export const classroomTextBoxes = (): SlideTextBox[] => [
  { id: 'cl_brand', bind: 'brand', x: 80, y: 70, w: 900, fontSize: 40, color: '#fbbf24', align: 'left', bold: true },
  { id: 'cl_header', bind: 'headerTitle', x: 80, y: 140, w: 1100, fontSize: 32, color: '#ffffff', align: 'left', bold: false },
  { id: 'cl_badge', bind: 'badgeTag', x: 1210, y: 70, w: 630, fontSize: 18, color: '#ffffff', align: 'center', bold: true, shape: 'pill', bg: 'rgba(245,158,11,0.2)' },
  { id: 'cl_card', bind: 'free', text: '', x: 80, y: 240, w: 1080, h: 320, fontSize: 30, color: '#ffffff', align: 'left', bold: false, shape: 'card', bg: 'rgba(255,255,255,0.06)' },
  { id: 'cl_source', bind: 'source', x: 100, y: 256, w: 1040, fontSize: 22, color: '#fbbf24', align: 'left', bold: true },
  { id: 'cl_stem', bind: 'stem', x: 100, y: 300, w: 1040, fontSize: 36, color: '#ffffff', align: 'left', bold: true },
  { id: 'cl_roman', bind: 'roman', x: 100, y: 380, w: 1040, fontSize: 22, color: '#ffffff', align: 'left', bold: false, shape: 'card', bg: 'rgba(0,0,0,0.25)' },
  { id: 'cl_prompt', bind: 'prompt', x: 100, y: 460, w: 1040, fontSize: 24, color: '#fbbf24', align: 'left', bold: true },
  { id: 'cl_options', bind: 'options', x: 1210, y: 240, w: 630, fontSize: 26, color: '#ffffff', align: 'left', bold: false, shape: 'card', bg: 'rgba(255,255,255,0.06)' },
  { id: 'cl_footer', bind: 'footerTag', x: 80, y: 990, w: 700, fontSize: 28, color: '#fbbf24', align: 'left', bold: true },
];

export interface SlideLayoutDef {
  id: string;
  name: string;
  desc: string;
  accent: string; // UI accent hint for the preset button
  build: () => SlideTextBox[];
}

export const SLIDE_LAYOUTS: SlideLayoutDef[] = [
  {
    id: 'enterprise_2col_grid',
    name: 'Enterprise 2x2 EdTech (Default)',
    desc: 'Structured stem card with badge tags, 2-column option grid, explanation banner & branding footer',
    accent: 'amber',
    build: () => [
      { id: eid('ed_brand'), bind: 'brand', x: 80, y: 50, w: 800, fontSize: 34, color: '#ffffff', align: 'left', bold: true },
      { id: eid('ed_header'), bind: 'headerTitle', x: 80, y: 100, w: 800, fontSize: 18, color: '#f59e0b', align: 'left', bold: false },
      { id: eid('ed_badge'), bind: 'badgeTag', x: 1240, y: 44, w: 600, fontSize: 18, color: '#ffffff', align: 'center', bold: true, shape: 'pill', bg: 'rgba(245,158,11,0.2)' },
      { id: eid('ed_card'), bind: 'free', text: '', x: 40, y: 150, w: 1840, h: 280, fontSize: 30, color: '#ffffff', align: 'left', bold: false, shape: 'card', bg: 'rgba(15,23,42,0.9)' },
      { id: eid('ed_qnum'), bind: 'questionNumber', x: 76, y: 172, w: 72, h: 52, fontSize: 28, color: '#0f172a', align: 'center', bold: true, shape: 'card', bg: '#f59e0b' },
      { id: eid('ed_source'), bind: 'source', x: 1446, y: 178, w: 354, fontSize: 18, color: '#f59e0b', align: 'right', bold: true },
      { id: eid('ed_stem'), bind: 'stem', x: 76, y: 236, w: 1768, fontSize: 30, color: '#ffffff', align: 'left', bold: true },
      { id: eid('ed_roman'), bind: 'roman', x: 76, y: 305, w: 1768, fontSize: 20, color: '#ffffff', align: 'left', bold: false, shape: 'card', bg: 'rgba(0,0,0,0.25)' },
      { id: eid('ed_prompt'), bind: 'prompt', x: 76, y: 375, w: 1768, fontSize: 22, color: '#f59e0b', align: 'left', bold: true },
      { id: eid('ed_options'), bind: 'options', x: 40, y: 460, w: 1840, fontSize: 24, color: '#ffffff', align: 'left', bold: false, shape: 'card', bg: 'rgba(30,41,59,0.75)' },
      { id: eid('ed_explanation'), bind: 'explanation', x: 40, y: 840, w: 1840, fontSize: 20, color: '#ffffff', align: 'left', bold: false, shape: 'card', bg: 'rgba(16,185,129,0.14)' },
      { id: eid('ed_watermark'), bind: 'watermark', x: 40, y: 1010, w: 800, fontSize: 20, color: '#ffffff', align: 'left', bold: true },
      { id: eid('ed_footer'), bind: 'footerTag', x: 1080, y: 1010, w: 800, fontSize: 20, color: '#f59e0b', align: 'right', bold: true },
    ],
  },
  {
    id: 'classroom_live',
    name: 'Classroom Live Writing',
    desc: 'Stem & multi-statement cards on left, wide teacher stylus workspace in center, options stack on right',
    accent: 'amber',
    build: classroomTextBoxes,
  },
  {
    id: 'split_focus',
    name: 'Split Focus 2-Column',
    desc: 'Wide question stem card on left column, single-column options stack on right',
    accent: 'sky',
    build: () => [
      { id: eid('sf_brand'), bind: 'brand', x: 80, y: 60, w: 800, fontSize: 38, color: '#38bdf8', align: 'left', bold: true },
      { id: eid('sf_header'), bind: 'headerTitle', x: 80, y: 130, w: 800, fontSize: 28, color: '#ffffff', align: 'left', bold: false },
      { id: eid('sf_badge'), bind: 'badgeTag', x: 1200, y: 60, w: 640, fontSize: 20, color: '#38bdf8', align: 'center', bold: true, shape: 'pill', bg: 'rgba(56,189,248,0.15)' },
      { id: eid('sf_card'), bind: 'free', text: '', x: 80, y: 240, w: 860, h: 320, fontSize: 30, color: '#ffffff', align: 'left', bold: false, shape: 'card', bg: 'rgba(15,23,42,0.85)' },
      { id: eid('sf_stem'), bind: 'stem', x: 100, y: 260, w: 820, fontSize: 38, color: '#ffffff', align: 'left', bold: true },
      { id: eid('sf_roman'), bind: 'roman', x: 100, y: 340, w: 820, fontSize: 20, color: '#ffffff', align: 'left', bold: false, shape: 'card', bg: 'rgba(0,0,0,0.25)' },
      { id: eid('sf_prompt'), bind: 'prompt', x: 100, y: 420, w: 820, fontSize: 22, color: '#38bdf8', align: 'left', bold: true },
      { id: eid('sf_options'), bind: 'options', x: 980, y: 240, w: 860, fontSize: 28, color: '#ffffff', align: 'left', bold: false, shape: 'card', bg: 'rgba(30,41,59,0.7)' },
      { id: eid('sf_footer'), bind: 'footerTag', x: 80, y: 980, w: 700, fontSize: 26, color: '#38bdf8', align: 'left', bold: true },
    ],
  },
  {
    id: 'modern_quiz',
    name: 'Modern Quiz',
    desc: 'Pill brand bar, card stem with roman items support, 2-col rounded options, footer chips',
    accent: 'amber',
    build: () => [
      { id: eid('mo_brand'), bind: 'brand', x: 80, y: 60, w: 640, fontSize: 40, color: '#fbbf24', align: 'left', bold: true, shape: 'pill', bg: 'rgba(251,191,36,0.16)' },
      { id: eid('mo_title'), bind: 'headerTitle', x: 80, y: 150, w: 1300, fontSize: 34, color: '#ffffff', align: 'left', bold: false },
      { id: eid('mo_card'), bind: 'free', text: '', x: 120, y: 260, w: 1360, h: 320, fontSize: 30, color: '#ffffff', align: 'left', bold: false, shape: 'card', bg: 'rgba(255,255,255,0.06)' },
      { id: eid('mo_stem'), bind: 'stem', x: 150, y: 280, w: 1300, fontSize: 44, color: '#ffffff', align: 'left', bold: true },
      { id: eid('mo_roman'), bind: 'roman', x: 150, y: 360, w: 1300, fontSize: 22, color: '#ffffff', align: 'left', bold: false, shape: 'card', bg: 'rgba(0,0,0,0.25)' },
      { id: eid('mo_prompt'), bind: 'prompt', x: 150, y: 440, w: 1300, fontSize: 24, color: '#fbbf24', align: 'left', bold: true },
      { id: eid('mo_icon'), bind: 'icon', x: 1520, y: 260, w: 260, h: 260, fontSize: 160, color: '#fbbf24', align: 'center', bold: false, iconName: 'Lightbulb', shape: 'card', bg: 'rgba(251,191,36,0.10)' },
      { id: eid('mo_options'), bind: 'options', x: 120, y: 620, w: 1300, fontSize: 34, color: '#ffffff', align: 'left', bold: false, shape: 'card', bg: 'rgba(255,255,255,0.07)' },
      { id: eid('mo_footer'), bind: 'footerTag', x: 80, y: 960, w: 700, fontSize: 30, color: '#fbbf24', align: 'left', bold: true, shape: 'pill', bg: 'rgba(251,191,36,0.14)' },
    ],
  },
  {
    id: 'cyber_hud',
    name: 'Cyberpunk HUD EdTech',
    desc: 'Futuristic neon accent borders, icon badge cards, 2-column option pills',
    accent: 'cyan',
    build: () => [
      { id: eid('ch_brand'), bind: 'brand', x: 80, y: 60, w: 700, fontSize: 40, color: '#06b6d4', align: 'left', bold: true, shape: 'pill', bg: 'rgba(6,182,212,0.15)' },
      { id: eid('ch_header'), bind: 'headerTitle', x: 80, y: 150, w: 1100, fontSize: 32, color: '#ffffff', align: 'left', bold: false },
      { id: eid('ch_card'), bind: 'free', text: '', x: 80, y: 260, w: 1400, h: 320, fontSize: 30, color: '#ffffff', align: 'left', bold: false, shape: 'card', bg: 'rgba(9,5,20,0.9)' },
      { id: eid('ch_stem'), bind: 'stem', x: 110, y: 280, w: 1340, fontSize: 42, color: '#ffffff', align: 'left', bold: true },
      { id: eid('ch_roman'), bind: 'roman', x: 110, y: 360, w: 1340, fontSize: 22, color: '#ffffff', align: 'left', bold: false, shape: 'card', bg: 'rgba(6,182,212,0.15)' },
      { id: eid('ch_prompt'), bind: 'prompt', x: 110, y: 440, w: 1340, fontSize: 24, color: '#06b6d4', align: 'left', bold: true },
      { id: eid('ch_icon'), bind: 'icon', x: 1530, y: 260, w: 310, h: 310, fontSize: 180, color: '#06b6d4', align: 'center', bold: false, iconName: 'Atom', shape: 'card', bg: 'rgba(6,182,212,0.12)' },
      { id: eid('ch_options'), bind: 'options', x: 80, y: 650, w: 1760, fontSize: 32, color: '#ffffff', align: 'left', bold: false, shape: 'pill', bg: 'rgba(6,182,212,0.12)' },
      { id: eid('ch_footer'), bind: 'footerTag', x: 80, y: 980, w: 800, fontSize: 28, color: '#06b6d4', align: 'left', bold: true },
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal Academic',
    desc: 'Plain text layout with statement support, classic slide feel for printing',
    accent: 'emerald',
    build: () => [
      { id: eid('mi_brand'), bind: 'brand', x: 80, y: 60, w: 900, fontSize: 44, color: '#fbbf24', align: 'left', bold: true },
      { id: eid('mi_header'), bind: 'headerTitle', x: 80, y: 120, w: 1200, fontSize: 34, color: '#ffffff', align: 'left', bold: false },
      { id: eid('mi_stem'), bind: 'stem', x: 120, y: 260, w: 1400, fontSize: 48, color: '#ffffff', align: 'left', bold: true },
      { id: eid('mi_roman'), bind: 'roman', x: 120, y: 340, w: 1400, fontSize: 24, color: '#ffffff', align: 'left', bold: false },
      { id: eid('mi_prompt'), bind: 'prompt', x: 120, y: 420, w: 1400, fontSize: 26, color: '#fbbf24', align: 'left', bold: true },
      { id: eid('mi_options'), bind: 'options', x: 120, y: 520, w: 1300, fontSize: 36, color: '#ffffff', align: 'left', bold: false },
      { id: eid('mi_footer'), bind: 'footerTag', x: 80, y: 980, w: 700, fontSize: 32, color: '#fbbf24', align: 'left', bold: true },
    ],
  },
];



export const SLIDE_SHAPE_OPTIONS: { value: 'plain' | 'pill' | 'card' | 'banner'; label: string }[] = [
  { value: 'plain', label: 'Plain' },
  { value: 'pill', label: 'Pill' },
  { value: 'card', label: 'Card' },
  { value: 'banner', label: 'Banner' },
];
