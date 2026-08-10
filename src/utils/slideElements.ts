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
  icon: LucideIcon;
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
  text: 'Tip: highlight an important note here…',
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
  { id: 'pill_header', label: 'Pill Header', desc: 'Rounded capsule title bar', icon: PanelTop, build: () => makePillHeaderBox() },
  { id: 'rounded_options', label: 'Rounded Options', desc: 'Each option as a soft card', icon: SquareStack, build: () => makeRoundedOptionsBox() },
  { id: 'option_pills', label: 'Option Pills', desc: 'Chip-style answer choices', icon: Shapes, build: () => makeOptionPillsBox() },
  { id: 'callout', label: 'Callout Box', desc: 'Highlight a key note', icon: Info, build: () => makeCalloutBox() },
  { id: 'banner_image', label: 'Banner Image', desc: 'Full-width picture bar', icon: LayoutTemplate, build: extra => (extra?.imageUrl ? makeBannerImageBox(extra.imageUrl) : makeBannerImageBox('')) },
  { id: 'icon', label: 'Icon Badge', desc: 'Decorative lucide icon', icon: Star, build: extra => makeIconBox(extra?.iconName || 'GraduationCap') },
];

// ---------------------------------------------------------------------------
// Composed layouts — replace the deck's text boxes with a full pre-designed set
// ---------------------------------------------------------------------------

export interface SlideLayoutDef {
  id: string;
  name: string;
  desc: string;
  accent: string; // UI accent hint for the preset button
  build: () => SlideTextBox[];
}

export const SLIDE_LAYOUTS: SlideLayoutDef[] = [
  {
    id: 'modern_quiz',
    name: 'Modern Quiz',
    desc: 'Pill brand bar, card stem, 2-col rounded options, footer chips',
    accent: 'amber',
    build: () => [
      { id: eid('mo_brand'), bind: 'brand', x: 80, y: 60, w: 640, fontSize: 40, color: '#fbbf24', align: 'left', bold: true, shape: 'pill', bg: 'rgba(251,191,36,0.16)' },
      { id: eid('mo_title'), bind: 'headerTitle', x: 80, y: 150, w: 1300, fontSize: 34, color: '#ffffff', align: 'left', bold: false },
      { id: eid('mo_stem'), bind: 'stem', x: 120, y: 340, w: 1500, fontSize: 54, color: '#ffffff', align: 'left', bold: true, shape: 'card', bg: 'rgba(255,255,255,0.06)' },
      { id: eid('mo_icon'), bind: 'icon', x: 1520, y: 320, w: 260, h: 260, fontSize: 160, color: '#fbbf24', align: 'center', bold: false, iconName: 'Lightbulb', shape: 'card', bg: 'rgba(251,191,36,0.10)' },
      { id: eid('mo_options'), bind: 'options', x: 120, y: 680, w: 1300, fontSize: 36, color: '#ffffff', align: 'left', bold: false, shape: 'card', bg: 'rgba(255,255,255,0.07)' },
      { id: eid('mo_footer'), bind: 'footerTag', x: 80, y: 960, w: 700, fontSize: 30, color: '#fbbf24', align: 'left', bold: true, shape: 'pill', bg: 'rgba(251,191,36,0.14)' },
    ],
  },
  {
    id: 'clean_card',
    name: 'Clean Card',
    desc: 'Minimal pills, airy stem card, one-column rounded options',
    accent: 'sky',
    build: () => [
      { id: eid('cc_brand'), bind: 'brand', x: 80, y: 70, w: 600, fontSize: 38, color: '#fbbf24', align: 'left', bold: true, shape: 'pill', bg: 'rgba(251,191,36,0.14)' },
      { id: eid('cc_title'), bind: 'headerTitle', x: 80, y: 150, w: 1200, fontSize: 32, color: '#ffffff', align: 'left', bold: false },
      { id: eid('cc_stem'), bind: 'stem', x: 160, y: 340, w: 1400, fontSize: 52, color: '#ffffff', align: 'left', bold: true, shape: 'card', bg: 'rgba(56,189,248,0.08)' },
      { id: eid('cc_options'), bind: 'options', x: 160, y: 660, w: 1300, fontSize: 36, color: '#ffffff', align: 'left', bold: false, shape: 'card', bg: 'rgba(255,255,255,0.06)' },
      { id: eid('cc_footer'), bind: 'footerTag', x: 80, y: 970, w: 600, fontSize: 30, color: '#38bdf8', align: 'left', bold: true, shape: 'pill', bg: 'rgba(56,189,248,0.12)' },
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    desc: 'Plain centered text, no containers, classic slide feel',
    accent: 'emerald',
    build: () => [
      { id: eid('mi_brand'), bind: 'brand', x: 80, y: 60, w: 900, fontSize: 44, color: '#fbbf24', align: 'left', bold: true },
      { id: eid('mi_header'), bind: 'headerTitle', x: 80, y: 120, w: 1200, fontSize: 34, color: '#ffffff', align: 'left', bold: false },
      { id: eid('mi_stem'), bind: 'stem', x: 120, y: 360, w: 1400, fontSize: 56, color: '#ffffff', align: 'left', bold: true },
      { id: eid('mi_options'), bind: 'options', x: 120, y: 620, w: 1300, fontSize: 40, color: '#ffffff', align: 'left', bold: false },
      { id: eid('mi_footer'), bind: 'footerTag', x: 80, y: 980, w: 700, fontSize: 32, color: '#fbbf24', align: 'left', bold: true },
    ],
  },
];

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
  { id: 'cl_stem', bind: 'stem', x: 80, y: 280, w: 1080, fontSize: 44, color: '#ffffff', align: 'left', bold: true, shape: 'card', bg: 'rgba(255,255,255,0.06)' },
  { id: 'cl_source', bind: 'source', x: 100, y: 300, w: 900, fontSize: 26, color: '#fbbf24', align: 'left', bold: false },
  { id: 'cl_options', bind: 'options', x: 1210, y: 280, w: 630, fontSize: 26, color: '#ffffff', align: 'left', bold: false, shape: 'card', bg: 'rgba(255,255,255,0.06)' },
  { id: 'cl_footer', bind: 'footerTag', x: 80, y: 990, w: 700, fontSize: 28, color: '#fbbf24', align: 'left', bold: true },
];

export const SLIDE_SHAPE_OPTIONS: { value: 'plain' | 'pill' | 'card' | 'banner'; label: string }[] = [
  { value: 'plain', label: 'Plain' },
  { value: 'pill', label: 'Pill' },
  { value: 'card', label: 'Card' },
  { value: 'banner', label: 'Banner' },
];
