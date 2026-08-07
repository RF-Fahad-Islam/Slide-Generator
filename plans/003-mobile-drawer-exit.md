# 003 — Symmetric mobile drawer exit

- **Status**: TODO
- **Commit**: a4948ab
- **Severity**: MEDIUM
- **Category**: Interruptibility / spatial consistency
- **Estimated scope**: `src/index.css` (two exit utilities) + `src/components/SidebarNav.tsx` (a `closing` state + swap the close calls)

## Problem

The mobile navigation drawer (`SidebarNav.tsx`) opens with a slide-in entrance
(`animate-slideInLeft`, 0.25s, applied at `SidebarNav.tsx:482`) but **closes by unmounting
instantly**. Opening and closing take different visual paths — the panel slides in from the
left, then teleports away. There is also no backdrop treatment on close (`:473`
`bg-black/60 backdrop-blur-sm` vanishes at once). For a dismissable surface, entrance and
exit must be a single symmetric path.

Current markup (`SidebarNav.tsx:470-499`):
```tsx
{isMobileDrawerOpen && (
  <div className="lg:hidden fixed inset-0 z-50">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileDrawerOpen(false)} />
    <div className={`absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] shadow-2xl ${
      isAppLight ? 'bg-white' : 'bg-slate-950'
    } animate-slideInLeft`}>
      …
```
Close call sites (all currently `setIsMobileDrawerOpen(false)`):
- `:102-105` Escape key handler
- `:124-127` `handleNavClick` (nav item click)
- `:474` backdrop `onClick`
- `:491` close (`X`) button `onClick`

## Target

Keep the drawer mounted for one 200ms exit beat, then unmount: the panel slides out to the
left (the mirror of its slide-in), the backdrop fades out, then state clears.

**`src/index.css`** — add two exit utilities alongside the existing entrance ones:

```css
/* src/index.css — add after the .animate-slideInLeft block (~line 29) */
@keyframes slideOutLeft {
  from { transform: translateX(0); opacity: 1; }
  to   { transform: translateX(-100%); opacity: 0; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to   { opacity: 0; }
}

.animate-slideOutLeft {
  animation: slideOutLeft 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.animate-fadeOut {
  animation: fadeOut 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@media (prefers-reduced-motion: reduce) {
  .animate-slideOutLeft,
  .animate-fadeOut { animation-duration: 0.15s; }
}
```

Values: 200ms (inside the 200–250ms drawer budget), the repo's shared easing
`cubic-bezier(0.4, 0, 0.2, 1)`, `animation-fill-mode: forwards` so the panel stays
translated-out until the component unmounts. The exit mirrors the existing entrance
(`slideInLeft` = from `translateX(-100%) → 0`; `slideOutLeft` = `0 → translateX(-100%)`),
giving a symmetric path. Reduced motion shortens (keeps opacity feedback).

**`SidebarNav.tsx`** — introduce a `closing` flag and a single `closeDrawer()`:
```tsx
import React, { useState, useEffect, useRef } from 'react'; // add useRef

const [isClosing, setIsClosing] = useState(false);
const closeTimer = useRef<number | null>(null);

const closeDrawer = () => {
  if (!isMobileDrawerOpen) return;
  setIsClosing(true);
  closeTimer.current = window.setTimeout(() => {
    setIsClosing(false);
    setIsMobileDrawerOpen(false);
  }, 200);
};
```
Replace the four `setIsMobileDrawerOpen(false)` close call sites with `closeDrawer()`. Clear
the timer on unmount so a late timeout never fires after the component is gone:
```tsx
useEffect(() => () => { if (closeTimer.current) window.clearTimeout(closeTimer.current); }, []);
```
Apply the exit classes while `isClosing` is true — the backdrop swaps to `animate-fadeOut`,
the panel swaps `animate-slideInLeft` for `animate-slideOutLeft`:
```tsx
<div
  className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
  onClick={closeDrawer}
/>
<div
  className={`absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] shadow-2xl ${
    isAppLight ? 'bg-white' : 'bg-slate-950'
  } ${isClosing ? 'animate-slideOutLeft' : 'animate-slideInLeft'}`}
>
```
(Backdrop entrance adds `animate-fadeIn` so open and close are symmetric; `animate-fadeIn`
is opacity+8px rise — the 8px rise on a full-screen backdrop is imperceptible but harmless,
and it already exists in the repo.)

## Repo conventions to follow

- Mirrors the existing entrance: `animate-slideInLeft` (`SidebarNav.tsx:482`) and its
  keyframe `index.css:22-29`. The new `slideOutLeft`/`fadeOut` are the exact inverse shape.
- Reuses the shared easing and the 0.2s duration the app already uses for slide/backdrop work.
- The `useState`/`useEffect` component-state pattern is already used throughout
  `SidebarNav.tsx` (`useState` at `:80`); `useRef` is added by this plan and is the standard
  React pattern for timer handles.

## Steps

1. In `src/index.css`, after the `.animate-slideInLeft` block (ends ~line 29), insert
   `@keyframes slideOutLeft`, `@keyframes fadeOut`, `.animate-slideOutLeft`, `.animate-fadeOut`,
   and the reduced-motion override.
2. In `SidebarNav.tsx`, add `useRef` to the React import.
3. Add the `isClosing` state, the `closeTimer` ref, and the `closeDrawer()` function (with the
   200ms unmount timeout) inside the component, near the existing `useState` declarations.
4. Replace `setIsMobileDrawerOpen(false)` with `closeDrawer()` at the four call sites
   (`:102-105` Escape, `:124-127` handleNavClick, `:474` backdrop, `:491` close button).
5. Add the unmount cleanup effect for `closeTimer`.
6. Update the two drawer element class strings so they swap their animation class based on
   `isClosing`, as in **Target** above.

## Boundaries

- Do NOT change the drawer's layout classes, width, panel markup, or the body-scroll lock logic.
- Do NOT touch the desktop sidebar (`aside` at `:376-401`) — this is mobile-only.
- Do NOT introduce the `motion` library; pure CSS + React state keeps it dependency-free.
- Do NOT add an exit to the unrelated inline modals — those are covered by plan 001 (entrance-only).
- If the drawer structure or close handlers have drifted since `a4948ab`, STOP and report.

## Verification

- **Mechanical**: `npm run lint` passes; `npm run build` passes.
- **Feel check** (narrow the viewport below 1024px, or use DevTools device mode):
  - Open the drawer: slides in over 250ms. Tap the backdrop or X: the panel slides **out to the
    left** over 200ms and the backdrop fades — symmetric with the entrance, no instant vanish.
  - Press Escape: same 200ms exit.
  - Click a nav item: drawer exits 200ms, then the destination tab is active (regression —
    navigation still happens immediately, the exit is visual only, not blocking).
  - Rapidly tap a nav item twice mid-exit: no crash, no stuck overlay (the 200ms timer + timer
    cleanup hold this).
  - Toggle `prefers-reduced-motion`: exit shortens to ~150ms.
- **Done when**: every close path (backdrop, X, Escape, nav click) exits with the 200ms
  slide-left + fade and never leaves a stuck overlay.