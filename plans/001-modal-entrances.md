# 001 — Animate modal entrances with fade + scale(0.96)

- **Status**: TODO
- **Commit**: a4948ab
- **Severity**: HIGH (leverage)
- **Category**: Missed opportunities (preventing a jarring change)
- **Estimated scope**: `src/index.css` (new utilities) + 8 modal components (one class per element) — 9 files, small additions

## Problem

Every modal in the app mounts the dark backdrop and the card **instantly**, with zero
bridge. The modal is the most-felt jarring state change in the product — Export, Add
Questions, Edit Question, Template Store, Question Paper, Slide Preview, Batch Export,
and Question-Bank PDF are all opened routinely. The repo already has entrance keyframes
(`.animate-fadeIn`, `.animate-slideInLeft`), so this is an unfinished pattern rather than
a new design, and it is strictly additive — no existing animation is changed or removed.

The 8 modals and their elements (verified at commit `a4948ab`):

| File | Dim element (root, add `animate-modal-backdrop`) | Card element (add `animate-modal-card`) |
| --- | --- | --- |
| `src/components/ExportModal.tsx` | `:302` root `fixed inset-0 … backdrop-blur-md` | `:305` `glass-card-fatty … relative w-full max-w-2xl border` |
| `src/components/AddQuestionsModal.tsx` | `:37` root `fixed inset-0 … backdrop-blur-md` | `:43` `relative w-full max-w-4xl border rounded-3xl overflow-hidden shadow-2xl` |
| `src/components/EditQuestionModal.tsx` | `:88` root `fixed inset-0 … backdrop-blur-md` | `:91` `glass-card-fatty … border p-6` |
| `src/components/TemplateLibraryModal.tsx` | `:77` root `fixed inset-0 … backdrop-blur-md` | `:80` `glass-card-fatty … border p-6` |
| `src/components/DeckQuestionPaperModal.tsx` | `:467` root `fixed inset-0 … backdrop-blur-md` | `:470` `glass-card-fatty … border p-6` |
| `src/components/DeckSettingsPreviewModal.tsx` | `:58` root `fixed inset-0 … backdrop-blur-md` | `:63` `relative w-full max-w-5xl border rounded-3xl …` |
| `src/components/QuestionBankPdfModal.tsx` | `:369` root `fixed inset-0 … backdrop-blur-md` | `:372` `glass-card-fatty … border p-6` |
| `src/components/BatchExportModal.tsx` | `:117` explicit backdrop child `absolute inset-0 bg-black/80 backdrop-blur-sm` **(not the root `:116`)** | `:118` `glass-card-fatty … flex flex-col` |

**BatchExportModal is structurally different.** Its root `:116` is a bare flex container
with no dim; the dim is a separate child `<div className="absolute inset-0 …">` at `:117`.
Apply `animate-modal-backdrop` to the `:117` child, not the root.

## Target

Two entrance utility classes in `src/index.css`, written exactly like the existing
`.animate-fadeIn` / `.animate-slideInRight` blocks. They animate only `opacity` and
`transform` (GPU-friendly), and never `scale(0)`.

```css
/* src/index.css — insert after the .animate-slideInRight block (~line 38) */
@keyframes modalBackdropIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalCardIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes modalCardFadeOnly {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-modal-backdrop {
  animation: modalBackdropIn 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-modal-card {
  animation: modalCardIn 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  .animate-modal-backdrop { animation: none; }
  .animate-modal-card { animation-name: modalCardFadeOnly; }
}
```

Values:
- **Duration 200ms** — inside the 200–500ms modal budget.
- **Easing `cubic-bezier(0.4, 0, 0.2, 1)`** — the single easing already used across the
  codebase (`index.css:16,37,48,66,85`). Reuse verbatim for cohesion; do not invent a new curve.
- **`scale(0.96)`** — the repo-appropriate floor (from the 0.9–0.97 band); never `0`.
- **Modals are exempt from `transform-origin`** — they appear centered, so
  `transform-origin: center` (the default) is correct. Do NOT add a `transform-origin`.
- **Reduced motion**: drop the movement (backdrop: no animation; card: fade only),
  keep the opacity feedback.

## Repo conventions to follow

- Animation utilities already live as keyframes + `.animate-*` classes in `src/index.css`
  (`.animate-fadeIn` `:13-20`, `.animate-slideInRight` `:31-38`). Imitate that exact shape.
- The shared easing is `cubic-bezier(0.4, 0, 0.2, 1)` — this plan reuses it, it does not
  introduce a token.
- No new wrappers or markup: the classes go directly on the existing dim element and card.

## Steps

1. In `src/index.css`, after the `.animate-slideInRight` block (ends ~line 38), insert the
   four keyframes, two utility classes, and the reduced-motion block shown in **Target**.
2. Add `animate-modal-backdrop` to the dim element of each modal, per the table above
   (the `:117` child for BatchExportModal, the root for the other seven). Example essence:
   ```tsx
   <div className={`fixed inset-0 z-50 … backdrop-blur-md animate-modal-backdrop ${isAppLight ? … : …}`}>
   ```
3. Add `animate-modal-card` to the card element of each modal, per the table above, e.g.:
   ```tsx
   <div className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} … border … animate-modal-card ${isAppLight ? … : …}`}>
   ```

## Boundaries

- Do NOT touch any modal's inner content, z-index, backdrop opacity, or border — only add
  the two animation classes.
- Do NOT add exit animations (that requires a mounted-close state and is a separate plan).
- Do NOT import or use the `motion` dependency.
- If any modal no longer matches the structure above (drift since `a4948ab`), STOP and report.

## Verification

- **Mechanical**: `npm run lint` passes; `npm run build` passes (only the pre-existing
  chunk-size warning).
- **Feel check**: open each modal (Header → Download; Add Questions; edit a question, etc.)
  and watch at 10% speed in the DevTools Animations panel:
  - The dim fades in (~200ms), then the card scales from **centered** 0.96 → 1 — never
    from a corner or from nothing (`scale(0)`).
  - No flash of full-size card, no overshoot.
  - Toggle `prefers-reduced-motion: reduce` (DevTools → Rendering → Emulate CSS media `prefers-reduced-motion: reduce`): the card fades in but does NOT zoom; the dim simply appears.
  - Closing mid-entrance and reopening is always a clean, fresh 200ms.
- **Done when**: all 8 modals show a 200ms fade + centered scale(0.96) entrance, and
  reduced-motion keeps the fade and drops the zoom.