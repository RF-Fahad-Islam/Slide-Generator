# Memory — Boxed-Design Mode, Clean Social Preview, Toolbar Fix

Last updated: 2026-08-06

## What was built

**Session 5 (this session)** — committed on `main` as `2876d33` (8 files, +114/−52):

- **Boxed-design mode** (`SlideCanvas.tsx`): when `slideTextBoxes.length > 0` the text boxes ARE the slide — template header/middle/footer are wrapped in `{!isBoxedDesign && (…)}` and hidden; template background/chrome layers + the box layer always render. Box layer stays inside `slideRef`, so PNG/PDF/ZIP/PPTX exports include boxes automatically. `isBoxedDesign` opens ~line 181 and closes ~598; box layer ~601 is outside the wrapper.
- **New decks default to boxed design** (`App.tsx`): fresh config starts with `slideTextBoxes: defaultSlideTextBoxes()`.
- **Old saved decks stay template-mode** (`useIndexedDBSync.ts`): when a saved config lacks `slideTextBoxes`, the merge sets `merged.slideTextBoxes = []` so pre-feature decks are not silently restyled.
- **Clean social custom preview** (`SocialPostGenerator.tsx`): `isBoxEditMode` state defaults OFF; the editor overlay renders only when `isBoxEditMode` is on; new "Edit Design"/"Preview" toggle button in the preview header (PenTool/Eye icons); hint text swaps with mode.
- **Slide Studio toolbar self-overlap fix** (`App.tsx:~466-525`): root cause was the right controls group's `shrink-0` preventing wrap at narrow widths — removed `shrink-0`, added `flex-wrap` to the left group and `gap-x-4 gap-y-3` so the toolbar wraps instead of overlapping.
- **Review polish**: `SlideTextBoxPanel.tsx` — removed dead `item`/`config`/`currentIndex` props, added `onClearAll` prop + Clear All button (with confirm guard in `App.tsx` via `clearSlideTextBoxes`). `SlideTextBoxOverlay.tsx` — label chip flips below the box (`top-full mt-1`) when `box.y < 40` to avoid clipping. `SlideCanvas.tsx` — local `formatQNumber` replaced with shared `utils/slideTextBoxes.formatSlideQNumber` (single formatter).

## Decisions made

- **"Text boxes ARE the design"** (user-confirmed): when a slide has boxes, the template's built-in text is hidden; only template background/chrome + boxes render. Mirrors Social Post Generator behavior.
- **Boxes are deck-wide** (`config.slideTextBoxes`): newly added slides automatically follow the last slide's box positions.
- **Old decks must NOT inherit defaults**: `useIndexedDBSync` forces `slideTextBoxes: []` when the saved config lacks the key.
- **Export boundary pattern** (still the rule): box CONTENT inside the exported node, edit HANDLES in a sibling overlay never exported.

## Problems solved

- Slide Studio toolbar "overlaps itself": the right controls group's `shrink-0` stopped wrapping at narrow widths → removed it and added wrap-friendly gaps.
- Text box label chip clipped at the top of the slide → chip flips below the box when `box.y < 40`.
- `formatQNumber` existed twice → consolidated into `utils/slideTextBoxes.ts`.

## Current state

All green: `npx tsc --noEmit` passes (lint = `tsc --noEmit` per project rules); `npm run build` was green before this session's edits; working tree clean, HEAD `2876d33` on `main`. Docs updated: `context/progress-tracker.md` (4 new dated rows) and `context/ui-registry.md` (control-bar wrapping note + shared text-box overlay/edit-mode toggle section).

## Next session starts with

1. **Browser-verify the boxed-design mode** (agent cannot — must be done by hand): a fresh deck previews with text boxes and NO template header/stem/options/footer; "Edit Text Boxes" toggles handles; PNG/PPTX/PDF export shows boxes but no handles.
2. **Browser-verify old-deck compatibility**: a saved pre-feature deck still shows template text (boxes stay empty).
3. **Browser-verify social custom mode**: clean design preview by default; "Edit Design" toggles the overlay; exported image has no handles. Also confirm the session-4 export fix (`70517a6`, html2canvas → CSS `background-image` cover + `toPng` fallback) actually works in a browser — still unverified.
4. If all pass, consider per-slide box overrides via `item.customConfig.slideTextBoxes` (already flows through `effectiveConfig`).

## Open questions

- None blocking. All new behavior is unverified in a real browser (no browser access in this environment) — export paths (html2canvas/html-to-image, `slideRef` capture) remain the highest-risk areas.
