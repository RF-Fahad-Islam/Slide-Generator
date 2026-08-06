import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Presentation } from 'lucide-react';

// ---------------------------------------------------------------------------
// OnboardingTour — hand-rolled spotlight tour (no new dependencies).
// Anchors target elements via data-tour="<id>" attributes; each step can also
// navigate the app to a specific tab before highlighting.
//
// The dimming is drawn as four clickable quadrants around the target instead of
// one full-screen backdrop, so the focused element is NEVER covered by a dim or
// blur layer (it stays razor sharp) and clicks inside the focus hole pass
// through to the real UI — interacting with the highlighted control does not
// advance/exit the tour.
// ---------------------------------------------------------------------------

export type TourTab = 'home' | 'social' | 'preview' | 'bank' | 'ai' | 'manual' | 'settings' | 'templates' | 'ai-keys';

export interface TourStep {
  target: string; // CSS selector to highlight
  title: string;
  body: string;
  navigateTab?: TourTab;
  placement?: 'bottom' | 'top' | 'left' | 'right';
}

export const defaultTourSteps: TourStep[] = [
  {
    target: '[data-tour="home-hero"]',
    title: 'Welcome to EdTech Studio!',
    body: 'Create beautiful MCQ decks with study-session style question slides. This quick tour will walk you through the core tabs so you can start building in seconds.',
  },
  {
    target: '[data-tour="nav-home"]',
    title: 'Home',
    body: 'The Home tab is your launchpad — open a saved deck, browse preset themes, or start a fresh deck from the Question Bank.',
  },
  {
    target: '[data-tour="nav-bank"]',
    title: 'Question Bank',
    body: 'Import questions from a PDF, paste them in, or upload a JSON file. Your library is saved right in your browser.',
    navigateTab: 'bank',
  },
  {
    target: '[data-tour="bank-import"]',
    title: 'Import Questions',
    body: 'Hit "Add Questions" to upload a PDF, import a JSON file, or paste questions manually. Everything lands in your question library.',
  },
  {
    target: '[data-tour="nav-ai"]',
    title: 'AI PDF Parser',
    body: 'Let AI read a question paper PDF and extract MCQs automatically. Paste your own AI key, or use the built-in key.',
    navigateTab: 'ai',
  },
  {
    target: '[data-tour="nav-manual"]',
    title: 'Manual Editor',
    body: 'Prefer hands-on control? The Manual Editor lets you type questions and options one by one.',
    navigateTab: 'manual',
  },
  {
    target: '[data-tour="nav-preview"]',
    title: 'Slide Studio',
    body: 'See your questions rendered as real slides. Toggle answer reveal, switch themes, reorder slides, and fine-tune every element.',
    navigateTab: 'preview',
  },
  {
    target: '[data-tour="studio-toolbar"]',
    title: 'Slide Studio Toolbar',
    body: 'Quick actions live here — font picker, slide Light/Dark theme, template library, and text-box editing.',
  },
  {
    target: '[data-tour="studio-export"]',
    title: 'Export Everything',
    body: 'When your deck is ready, export to PowerPoint, PDF, Google Slides, PNG images, or a printable Question Paper with answer key.',
  },
  {
    target: '[data-tour="nav-settings"]',
    title: 'Deck Settings',
    body: 'Tune brand name, header/footer, watermark, colors, and slide layout. Tip: theme edits in the Theme tab apply to the active slide only.',
    navigateTab: 'settings',
  },
  {
    target: '[data-tour="nav-home"]',
    title: 'You are all set!',
    body: 'That is the tour. Open a deck and start creating — have fun!',
    navigateTab: 'home',
  },
];

interface OnboardingTourProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: TourTab) => void;
  steps?: TourStep[];
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 10; // extra padding around the focused element (the "hole")
const GAP = 16; // gap between the hole and the tooltip card
const TIP_H = 168; // estimated tooltip height for placement flips
const MAX_TIP_W = 360;
const POLS_INTERVAL = 150;
const POLS_MAX = 24;

// Skip the global Enter/Arrow shortcut when the user is interacting with a real
// control (button / input / select / link) — pressing Enter there must not
// accidentally advance or exit the tour.
const isInteractiveTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'BUTTON' ||
    tag === 'A' ||
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
};

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ open, onClose, onNavigate, steps = defaultTourSteps }) => {
  const [current, setCurrent] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [tipRect, setTipRect] = useState<{ top: number; left: number; placement: string } | null>(null);
  const [isMissing, setIsMissing] = useState(false);

  const step = steps[Math.min(current, steps.length - 1)];

  // Plain measurement — no scrollIntoView here. Scrolling is triggered only on
  // step changes, otherwise scroll/resize events (including the smooth-scroll
  // animation itself) would fight the user and cause jitter.
  const measure = useCallback(() => {
    if (!step) return false;
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    setRect({
      top: r.top - PAD,
      left: r.left - PAD,
      width: r.width + PAD * 2,
      height: r.height + PAD * 2,
    });
    return true;
  }, [step]);

  // Poll for the target element (it may not be in the DOM yet after a tab
  // navigation), then fall back to a centered tooltip if it never appears.
  const tryMeasure = useCallback(() => {
    let attempts = 0;
    const poll = () => {
      attempts++;
      if (measure()) {
        setIsMissing(false);
        return;
      }
      if (attempts >= POLS_MAX) {
        setIsMissing(true);
        setRect(null);
        return;
      }
      window.setTimeout(poll, POLS_INTERVAL);
    };
    poll();
  }, [measure]);

  // Scroll the target into view ONCE per step, then measure.
  const revealAndMeasure = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (el) el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    window.setTimeout(tryMeasure, 220);
  }, [step, tryMeasure]);

  const goTo = useCallback(
    (index: number) => {
      setCurrent(Math.max(0, Math.min(steps.length - 1, index)));
    },
    [steps.length]
  );

  // When the step changes: navigate to its tab (if any), reveal + measure
  useEffect(() => {
    if (!open) return;
    const s = steps[current];
    if (!s) return;
    if (s.navigateTab) {
      onNavigate(s.navigateTab);
    }
    const t = window.setTimeout(revealAndMeasure, 260);
    return () => window.clearTimeout(t);
  }, [current, open, steps, onNavigate, revealAndMeasure]);

  // Reposition on resize / scroll (measure only — never scroll into view here)
  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, measure]);

  // Position the tooltip near the spotlight (or centered when the target is missing)
  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tipW = Math.min(MAX_TIP_W, vw - 24);
    if (!rect) {
      if (isMissing) {
        setTipRect({ top: vh / 2 - 110, left: (vw - tipW) / 2, placement: 'center' });
      } else {
        setTipRect(null);
      }
      return;
    }
    const pl = step?.placement || 'bottom';
    let left = rect.left + rect.width / 2 - tipW / 2;
    left = Math.max(12, Math.min(vw - tipW - 12, left));
    let top: number;
    let placement = pl;
    if (pl === 'bottom' && rect.top + rect.height + GAP + TIP_H > vh) placement = 'top';
    if (pl === 'top' && rect.top - GAP - TIP_H < 0) placement = 'bottom';
    if (placement === 'bottom') top = rect.top + rect.height + GAP;
    else if (placement === 'top') top = rect.top - GAP - TIP_H;
    else top = rect.top + rect.height / 2 - 78;
    setTipRect({ top, left, placement });
  }, [rect, step, isMissing]);

  // Keyboard controls — ignored while a real control has focus
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (isInteractiveTarget(e.target)) return;
      if (e.key === 'Enter' || e.key === 'ArrowRight') goTo(current + 1);
      else if (e.key === 'ArrowLeft') goTo(current - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, current, goTo, onClose]);

  if (!open || !step) return null;

  const isLast = current === steps.length - 1;
  const isFirst = current === 0;
  const advance = () => (isLast ? onClose() : goTo(current + 1));

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Four dim quadrants around the focus hole. The hole itself has NO overlay,
  // so the target stays perfectly sharp and is fully interactive.
  const quadrants = rect
    ? [
        { top: 0, left: 0, width: vw, height: Math.max(0, rect.top) },
        { top: rect.top + rect.height, left: 0, width: vw, height: Math.max(0, vh - rect.top - rect.height) },
        { top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height },
        { top: rect.top, left: rect.left + rect.width, width: Math.max(0, vw - rect.left - rect.width), height: rect.height },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Dim + blur, or the four-quadrant mask around the focus hole */}
      {rect ? (
        quadrants.map((q, i) => (
          <div
            key={i}
            className="absolute bg-slate-950/80 backdrop-blur-[2px] transition-all duration-300"
            style={{ top: q.top, left: q.left, width: q.width, height: q.height }}
            onClick={advance}
          />
        ))
      ) : (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px]" onClick={advance} />
      )}

      {/* Sharp focus ring around the hole — layered glow so the target clearly pops */}
      {rect && (
        <div
          className="absolute rounded-2xl border-2 border-amber-400 pointer-events-none transition-all duration-300"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow:
              '0 0 0 3px rgba(245,158,11,0.35), 0 0 0 9px rgba(245,158,11,0.12), 0 0 42px rgba(245,158,11,0.5)',
          }}
        />
      )}

      {/* Tooltip card */}
      {tipRect && (
        <div
          className="fixed w-[360px] max-w-[90vw] rounded-3xl border border-amber-500/30 bg-slate-900 text-white shadow-2xl shadow-black/50 overflow-hidden"
          style={{ top: tipRect.top, left: tipRect.left }}
        >
          <div className="h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300" />
          <div className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <Presentation className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold leading-tight">{step.title}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                aria-label="Close tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">{step.body}</p>

            <div className="pt-1 flex items-center justify-between gap-3">
              {/* Dots */}
              <div className="flex items-center gap-1">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={`rounded-full transition-all ${i === current ? 'w-5 h-1.5 bg-amber-400' : 'w-1.5 h-1.5 bg-slate-600'}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button
                    onClick={() => goTo(current - 1)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                  </button>
                )}
                <button
                  onClick={advance}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all cursor-pointer"
                >
                  {isLast ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Done
                    </>
                  ) : (
                    <>
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step counter chip */}
      <div className="fixed bottom-5 right-5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-slate-400 text-[10px] font-bold font-mono">
        {current + 1} / {steps.length}
      </div>
    </div>
  );
};
