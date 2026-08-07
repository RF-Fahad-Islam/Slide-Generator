# 005 — Press feedback on icon action buttons

- **Status**: TODO
- **Commit**: a4948ab
- **Severity**: LOW
- **Category**: Missed opportunity (feedback)
- **Estimated scope**: `src/index.css` (1 utility) + `src/components/SortableQuestionCard.tsx` (3 buttons) + `src/components/IngestionToast.tsx` (1 button)

## Problem

The highest-traffic icon buttons in the app — the Edit / Duplicate / Delete actions on every
question card and the toast's Dismiss — have hover color states but **no `:active` press
feedback**. They are `transition-colors`-only, so pressing feels dead; the user gets no
confirmation the click registered. These run tens of times a day, so the press must be
near-imperceptible (fast, subtle) — never a big scale.

Current code (verified at `a4948ab`):
```tsx
// SortableQuestionCard.tsx:120-151 — three action buttons, e.g. Edit
<button
  onClick={onEdit}
  className={`p-2 rounded-xl transition-colors ${
    isAppLight
      ? 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700'
      : 'bg-slate-800 text-slate-300 hover:text-indigo-400'
  }`}
>
  <Pencil className="w-4 h-4" />
</button>
```
And the toast Dismiss (`IngestionToast.tsx:138`):
```tsx
<button
  onClick={discard}  // plan 004 changes this to closeToast
  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
    isAppLight
      ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
      : 'text-slate-500 hover:text-white hover:bg-slate-800'
  }`}
>
```

## Target

**`src/index.css`** — add one utility that composes the press scale INTO the existing color
transition (a bare `:active` rule without a matching `transition` would snap; replacing
`transition-colors` with this keeps both the color AND the transform animating):
```css
.btn-icon {
  transition: transform 120ms cubic-bezier(0.4, 0, 0.2, 1),
    color 150ms ease,
    background-color 150ms ease,
    border-color 150ms ease;
}

.btn-icon:active {
  transform: scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .btn-icon:active { transform: none; }
}
```

Values: press scale `0.96` (inside the 0.95–0.98 subtle band), 120ms (inside the 100–160ms
press budget), repo easing. Reduced motion drops the transform, keeps the color feedback.
`transform` + colors are all GPU/cheap properties.

**`SortableQuestionCard.tsx`** — replace `transition-colors` with `btn-icon` on the **Edit**
(`:121`), **Duplicate** (`:132`), and **Delete** (`:143`) buttons. Do NOT touch the drag
handle (`:108`) — it is a drag affordance and scale-on-press fights the grab gesture.

**`IngestionToast.tsx`** — replace `transition-colors` with `btn-icon` on the Dismiss (`X`)
button (`:138`). (This button's `onClick` is already being changed to `closeToast` by plan
004 — apply both changes in the same pass.)

## Repo conventions to follow

- Reuses the repo's single easing and the app's existing 150ms color-transition feel
  (`transition-colors` duration is the default Tailwind 150ms).
- Utility class in `src/index.css`, same pattern as `.animate-*` / `.btn-fatty-primary`
  (`:76-101`) which already defines an `:active` press (`scale(0.98)` `:99-101`) — this plan
  extends that same idea to the icon tier.

## Steps

1. Append the `.btn-icon` block to `src/index.css`.
2. `SortableQuestionCard.tsx`: swap `transition-colors` → `btn-icon` on the three action
   buttons (`:121`, `:132`, `:143`). Leave the drag handle at `:108` untouched.
3. `IngestionToast.tsx`: swap `transition-colors` → `btn-icon` on the Dismiss button (`:138`),
   in the same pass as plan 004's `closeToast` change.

## Boundaries

- Do NOT add `.btn-icon` to the modal close (`X`) buttons or any other component — scope is
  the four buttons named above. (Broadening is a separate decision.)
- Do NOT touch the drag handle (`SortableQuestionCard.tsx:108`) or any `:hover` styles.
- Do NOT add new dependencies.
- If a button no longer matches, STOP and report.

## Verification

- **Mechanical**: `npm run lint` passes; `npm run build` passes.
- **Feel check**: press-and-hold the Edit / Duplicate / Delete buttons on a question card —
  they scale to 0.96 within 120ms and release smoothly; the hover color change still works.
  Pressing and dragging over them never triggers the scale (only true `:active` does).
  - On the toast, Dismiss scales on press.
  - Toggle `prefers-reduced-motion: reduce` — press no longer scales but hover colors remain.
- **Done when**: the four named buttons give a subtle 0.96 press with a smooth 120ms return,
  and reduced-motion removes the scale.