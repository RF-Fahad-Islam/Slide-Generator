# 002 — Add reduced-motion handling and gate hover transforms

- **Status**: TODO
- **Commit**: a4948ab
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: `src/index.css` only (two media-query blocks appended)

## Problem

The app has **zero** `prefers-reduced-motion` handling — a pure-grep of `src` returns no
occurrences. Every entrance (`animate-fadeIn`, `animate-slideInLeft`, `animate-slideInRight`),
every hover lift (`.glass-card-fatty:hover` `index.css:51-55`, `.btn-fatty-primary:hover`
`index.css:93-97`), and the body theme-color transition (`index.css:9`) all run at full
motion for users who asked for less.

Additionally, **hover transforms are not gated for touch** — 32 `hover:scale-*` /
`hover:-translate-*` instances across components (e.g. `SlideDecksHome.tsx:208,321,332`,
`AddQuestionsBanner.tsx:28,43`, `SidebarNav.tsx:136,393,426`). On a touch device the
`:hover` state sticks after the first tap, so a card or button stays visually scaled/translated
until the next tap — a false-hover artifact. Per the accessibility rule, hover motion must be
scoped to `(hover: hover) and (pointer: fine)`.

This plan is pure CSS in `src/index.css`. It does not modify any component.

## Target

Append two media blocks to the end of `src/index.css` (after the `.light-scrollbar…` rules,
~line 150).

```css
/* Reduced motion — keep opacity/color feedback, drop movement */
@media (prefers-reduced-motion: reduce) {
  body {
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .animate-fadeIn,
  .animate-slideInLeft,
  .animate-slideInRight {
    animation-duration: 200ms;
  }

  .glass-card-fatty:hover,
  .glass-card-fatty-light:hover {
    transform: none;
  }

  .btn-fatty-primary:hover {
    transform: none;
    filter: none;
  }

  /* plan 001 owns the modal classes (.animate-modal-*) — do not add them here */
}

/* Touch devices — neutralise sticky hover transforms (false hover after tap) */
@media (hover: none) {
  *:hover {
    transform: none !important;
  }
}
```

Rationale for each rule:
- **`body`** — theme switch moves color, not spatial layout; keep a short opacity/color
  transition (feedback) at 0.2s instead of the full 0.3s crossfade. Do not zero it out.
- **`animate-fadeIn/slideInLeft/slideInRight`** — these only fade / move `transform` +
  `opacity`. Under reduced motion, shorten (200ms) but keep them: they aid comprehension.
  Removing position is handled naturally because these keyframes only use `translateY`/`translateX`
  + `opacity`; the entry-class approach is acceptable — a smaller duration reduces the movement feel.
- **Hover lifts** (`transform: none`) — remove the translateY/scale movement; keep the
  `border-color`/`box-shadow`/`filter` hover affordance (comprehension). `filter` is dropped
  on the button because it re-renders the glyph; with the lift gone the brightness is superfluous.
- **`@media (hover: none) *:hover`** — on coarse pointers there is no genuine hover, so the
  sticky transform is the only effect; `transform: none !important` removes it app-wide with
  one rule instead of touching 32 component sites. It does not affect `:active` press feedback.

## Repo conventions to follow

- All motion lives in `src/index.css`; append these blocks there rather than per-component.
- Reuses the app's existing 200ms/`ease` durations already present in `index.css:9`.
- No component markup or class changes — purely global CSS, matching how the file already
  centralizes `transition` rules on `body` (`:9`) and the card/button classes.

## Steps

1. Append the `@media (prefers-reduced-motion: reduce)` block to the end of `src/index.css`.
2. Append the `@media (hover: none)` block after it.
3. Confirm you did NOT edit any `.animate-modal-*` selector (that belongs to plan 001).

## Boundaries

- Do NOT edit components, props, or JSX. This is a CSS-only change.
- Do NOT add a global `transition: none` on `*` — reduced motion is "fewer/gentler", not zero.
- Do NOT gate with an overly broad `prefers-reduced-motion` that wipes opacity/color feedback.
- Do NOT change `:active` press feedback (it is a good feedback signal and should remain).
- If you later run this without plan 001, the block simply has no effect on the modal classes
  (they don't exist yet) — harmless.

## Verification

- **Mechanical**: `npm run lint` passes; `npm run build` passes.
- **Feel check**:
  - DevTools → Rendering → **Emulate CSS media `prefers-reduced-motion: reduce`**: hover over a
    glass card — it must NOT lift (`translateY`), but the border/glow change must still appear;
    hover over `.btn-fatty-primary` — no lift and no brightness flash; switch app theme — the
    color crossfade is noticeably shorter.
  - DevTools device toolbar (a touch profile, e.g. iPhone): tap a `hover:scale-110` icon tile
    (e.g. Add Questions banner icon) — after the tap it must NOT stay zoomed.
  - Re-enable reduced motion and confirm normal hover lifts still work (regression check).
- **Done when**: reduced-motion drops all lift/zoom but retains color affordances and opacity
  fades; on a touch emulation, no `:hover` transform sticks after a tap.