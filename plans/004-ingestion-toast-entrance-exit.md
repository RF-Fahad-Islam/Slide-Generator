# 004 — IngestionToast entrance/exit (symmetric bottom-edge path)

- **Status**: TODO
- **Commit**: a4948ab
- **Severity**: MEDIUM
- **Category**: Missed opportunity (spatial consistency)
- **Estimated scope**: `src/index.css` (2 keyframes + 2 classes) + `src/components/IngestionToast.tsx` (a `closing` state + swap the discard calls)

## Problem

The ingestion toast (`src/components/IngestionToast.tsx`) is the one surface the user
watches for the entire duration of every PDF/OCR import. It pops into the `bottom-4 right-4`
dock **instantly** when `status` leaves `idle`, and vanishes **instantly** when the user
clicks Dismiss / Discard / Close (`discard()`). Entering and exiting from the dock with no
bridge is a jarring change; a dismissable surface must enter and exit through the same edge.

Current structure (verified at `a4948ab`):
```tsx
// IngestionToast.tsx:83-90
<div className="fixed bottom-4 right-4 z-[9998] w-[340px] max-w-[calc(100vw-2rem)]">
  <div
    role="status"
    aria-live="polite"
    className={`rounded-3xl border overflow-hidden ${
      isAppLight ? 'bg-white' : 'bg-slate-900'
    } ${borderClass}`}
  >
```
The three unmounting close paths all call `discard()` directly: the X dismiss button
(`:139`), the "Discard" button (`:264`), and the "Close" button (`:273`). (`Cancel` `:230`
leads to the `aborted` state and does NOT unmount — leave it alone.)

## Target

**`src/index.css`** — add after the `.animate-slideInRight` block (~line 38):
```css
@keyframes toastIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes toastOut {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(16px); }
}

.animate-toast-in  { animation: toastIn  250ms cubic-bezier(0.4, 0, 0.2, 1); }
.animate-toast-out { animation: toastOut 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }

@media (prefers-reduced-motion: reduce) {
  .animate-toast-in  { animation: none; }
  .animate-toast-out { animation-duration: 150ms; }
}
```

**`src/components/IngestionToast.tsx`**:
```tsx
const [isClosing, setIsClosing] = useState(false);

const closeToast = () => {
  if (isClosing) return;
  setIsClosing(true);
  setTimeout(() => discard(), 200);
};
```
- Apply `animate-toast-in` to the inner card (`:87`), and swap it for `animate-toast-out`
  while `isClosing`.
- Replace `onClick={discard}` with `onClick={closeToast}` on the three close buttons
  (`:139`, `:264`, `:273`).

Values: entrance 250ms, exit 200ms, repo easing `cubic-bezier(0.4, 0, 0.2, 1)`, exit mirrors
the entrance exactly (`translateY(16px)` = down toward the dock edge it entered from).
Reduced motion: entrance collapses to an instant appear, exit shortens (keeps the fade).

## Repo conventions to follow

- Same pattern as plan 001/003: keyframes + `.animate-*` utility classes in `src/index.css`,
  using the repo's single easing `cubic-bezier(0.4, 0, 0.2, 1)`.
- The `closing`-state pattern is the same one plan 003 introduced in `SidebarNav.tsx`:
  set a flag, play the exit class, unmount after the exit duration.

## Steps

1. Append the toast keyframes/classes/reduced-motion block to `src/index.css` (after the
   `.animate-slideInRight` block, ~line 38; or at the end of the file — either is fine, keep
   it grouped with the other animation utilities).
2. In `IngestionToast.tsx`, add the `isClosing` state and `closeToast()` near the existing
   `copied` state (`:12`). `useState` is already imported (`:1,12`).
3. Add `animate-toast-in` to the card `className` (`:87`), switching to `animate-toast-out`
   when `isClosing`:
   ```tsx
   className={`rounded-3xl border overflow-hidden ${isClosing ? 'animate-toast-out' : 'animate-toast-in'} ${
     isAppLight ? 'bg-white' : 'bg-slate-900'
   } ${borderClass}`}
   ```
4. Change the three close buttons' `onClick` from `discard` to `closeToast` (`:139`, `:264`, `:273`).
5. Do NOT touch the `Cancel` button (`:230`) or the `approve` flow.

## Boundaries

- Do NOT change the toast's layout, the progress bar, the store (`ingestionStore`), or any
  status-morphing logic — the internal status swaps (extracting → awaiting_approval → done)
  stay as they are; only the mount and the discard exit animate.
- Do NOT introduce the `motion` package.
- If `IngestionToast.tsx` has drifted since `a4948ab`, STOP and report.

## Verification

- **Mechanical**: `npm run lint` passes; `npm run build` passes (pre-existing chunk-size warning only).
- **Feel check**: upload a PDF so the toast appears — it slides up 16px into its dock over
  250ms (watch at 10% in the Animations panel). Click Dismiss / Discard / Close — it slides
  back down to the bottom edge and fades over 200ms, never vanishing mid-frame.
  - Confirm `Cancel` does NOT dismiss the toast (it still transitions to the aborted state).
  - Toggle `prefers-reduced-motion: reduce` — toast appears instantly; exit is a 150ms fade.
- **Done when**: the toast enters and exits through the bottom-right dock edge symmetrically,
  and Cancel still leaves it mounted.