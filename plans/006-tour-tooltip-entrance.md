# 006 — Onboarding tour tooltip entrance (per-step)

- **Status**: TODO
- **Commit**: a4948ab
- **Severity**: LOW
- **Category**: Missed opportunity (delight — rare / first-time tier)
- **Estimated scope**: `src/index.css` (1 keyframe + 1 class) + `src/components/OnboardingTour.tsx` (2 attribute additions)

## Problem

The onboarding tour tooltip (`src/components/OnboardingTour.tsx`) appears **instantly** on
the first step and **instantly swaps** on every subsequent step. The tour is the app's one
first-run, high-emotion moment — the single place the delight budget is allowed — and the
dim quadrants + focus ring around it already transition smoothly (`transition-all
duration-300`, `:319`, `:331`). The tooltip card itself is the only dead spot: it snaps in,
out of step with everything around it.

Current code (verified at `a4948ab`):
```tsx
// OnboardingTour.tsx:344-348
<div
  ref={tipRef}
  className="fixed w-[360px] max-w-[90vw] rounded-3xl border border-amber-500/30 bg-slate-900 text-white shadow-2xl shadow-black/50 overflow-hidden"
  style={{ top: tipRect.top, left: tipRect.left }}
>
```

## Target

**`src/index.css`** — add after the `.animate-slideInRight` block (~line 38):
```css
@keyframes tourTipIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-tour-tip {
  animation: tourTipIn 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  .animate-tour-tip { animation-duration: 150ms; }
}
```

**`src/components/OnboardingTour.tsx`** — add the animation class to the tooltip card and
key it by step so the entrance replays on every step change (otherwise it would only play on
first open):
```tsx
<div
  key={current}
  ref={tipRef}
  className="fixed w-[360px] max-w-[90vw] rounded-3xl border border-amber-500/30 bg-slate-900 text-white shadow-2xl shadow-black/50 overflow-hidden animate-tour-tip"
  style={{ top: tipRect.top, left: tipRect.left }}
>
```

Values: 200ms, `translateY(6px)` rise (not scale — the card is anchored to the spotlight, a
small rise reads as "arriving in place"), repo easing. Reduced motion shortens to 150ms and
the 6px rise is negligible (kept, per "gentler, not zero" — the movement is only 6px).
Re-keying by `current` is safe: the tooltip repositions on every step anyway (its `style.top`
is computed from `tipRect`, which changes per step), and `tipRef` re-attaches on remount
(the existing `useLayoutEffect` `:264-274` clamps `top` on mount, so this is already handled).

## Repo conventions to follow

- Same keyframe + `.animate-*` utility pattern and single easing as plans 001–004.
- The dim quadrants and focus ring already use `transition-all duration-300` — this
  entrance (200ms) stays within that visual rhythm and slightly ahead of it.

## Steps

1. Append the `tourTipIn` keyframe + `.animate-tour-tip` class + reduced-motion override to
   `src/index.css`.
2. In `OnboardingTour.tsx`, add `key={current}` and `animate-tour-tip` to the tooltip card
   (`:344-348`), exactly as in **Target**.
3. Do NOT touch the dim quadrants, the focus ring, the step counter chip, or any navigation logic.

## Boundaries

- Do NOT change the tooltip's position math, placement logic, or `TIP_H`/`MAX_TIP_W` estimates.
- Do NOT re-key any element other than the tooltip card.
- Do NOT add new dependencies.
- If the tooltip structure has drifted since `a4948ab`, STOP and report.

## Verification

- **Mechanical**: `npm run lint` passes; `npm run build` passes.
- **Feel check**: start the tour (Sidebar → Start Tour, or first run). Each step's tooltip
  rises 6px and fades in over 200ms, in step with the focus-ring transition — no instant snap
  on the first step or between steps.
  - Rapidly press Next several times — each tooltip replays a clean 200ms entrance; no stuck
    or half-faded card (remount resets the animation cleanly).
  - Toggle `prefers-reduced-motion: reduce` — the entrance shortens to a 150ms fade.
- **Done when**: the tooltip animates on the first step AND on every step change, and rapid
  stepping never leaves a stuck card.