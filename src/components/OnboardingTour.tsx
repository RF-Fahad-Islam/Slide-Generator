import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Presentation } from 'lucide-react';

// ---------------------------------------------------------------------------
// OnboardingTour — hand-rolled spotlight tour (no new dependencies).
// Anchors target elements via data-tour="<id>" attributes; each step can also
// navigate the app to a specific tab before highlighting.
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

const SPOT_RADIUS = 14;
const GAP = 14;

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ open, onClose, onNavigate, steps = defaultTourSteps }) => {
  const [current, setCurrent] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [tipRect, setTipRect] = useState<{ top: number; left: number; placement: string } | null>(null);
  const pendingNavigate = useRef<TourTab | null>(null);
  const measuringRef = useRef(false);

  const step = steps[Math.min(current, steps.length - 1)];

  const measure = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pad = 8;
    setRect({
      top: r.top - pad,
      left: r.left - pad,
      width: r.width + pad * 2,
      height: r.height + pad * 2,
    });
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    requestAnimationFrame(() => {
      const r2 = el.getBoundingClientRect();
      setRect({
        top: r2.top - pad,
        left: r2.left - pad,
        width: r2.width + pad * 2,
        height: r2.height + pad * 2,
      });
    });
  }, [step]);

  // Jump to a step (handles tab navigation before measuring)
  const goTo = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(steps.length - 1, index));
      const s = steps[next];
      setCurrent(next);
      if (s && s.navigateTab) {
        onNavigate(s.navigateTab);
      }
      setTimeout(measure, 420);
    },
    [steps, onNavigate, measure]
  );

  // Measure position when step changes
  useEffect(() => {
    if (!open) return;
    const s = steps[current];
    if (!s) return;
    if (s.navigateTab) {
      onNavigate(s.navigateTab);
    }
    const t = setTimeout(measure, 320);
    return () => clearTimeout(t);
  }, [current, open, steps, onNavigate, measure]);

  // Reposition on resize / scroll
  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, measure]);

  // Position the tooltip near the spotlight
  useEffect(() => {
    if (!rect) {
      setTipRect(null);
      return;
    }
    const pl = step?.placement || 'bottom';
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tipW = Math.min(360, vw - 24);
    let left = rect.left + rect.width / 2 - tipW / 2;
    left = Math.max(12, Math.min(vw - tipW - 12, left));
    let top: number;
    let placement = pl;
    if (pl === 'bottom' && rect.top + rect.height + GAP + 150 > vh) placement = 'top';
    if (pl === 'top' && rect.top - GAP - 150 < 0) placement = 'bottom';
    if (placement === 'bottom') top = rect.top + rect.height + GAP;
    else if (placement === 'top') top = rect.top - GAP - 150;
    else top = rect.top + rect.height / 2 - 75;
    setTipRect({ top, left, placement });
  }, [rect, step]);

  // Keyboard controls
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'Enter' || e.key === 'ArrowRight') goTo(current + 1);
      else if (e.key === 'ArrowLeft') goTo(current - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, current, goTo, onClose]);

  if (!open || !step) return null;

  const isLast = current === steps.length - 1;
  const isFirst = current === 0;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Dark backdrop — clicking advances the tour */}
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px]" onClick={() => (isLast ? onClose() : goTo(current + 1))} />

      {/* Spotlight cut-out */}
      {rect && (
        <div
          className="absolute rounded-3xl border-2 border-amber-400 transition-all duration-300"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: '0 0 0 9999px rgba(2,6,23,0.78), 0 0 0 4px rgba(245,158,11,0.25), 0 24px 60px rgba(0,0,0,0.55)',
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
                  onClick={() => (isLast ? onClose() : goTo(current + 1))}
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
