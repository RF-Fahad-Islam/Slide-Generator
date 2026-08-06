# Memory — Slide Text Box Editor (Deck-Wide Overlay)

Last updated: 2026-08-06

## What was built

**Session 4 (this session)** — committed on `main`:

- `70517a6` — **Social post export hardening** (`SocialPostGenerator.tsx`): custom-mode export node changed from `absolute inset-0` to a **static in-flow card** carrying the aspect class (same structure as the 4 template cards that export reliably). Background image now applied as CSS `background-image` + `background-size: cover` — html2canvas 1.4.1 does NOT support `object-fit` on `<img>`. Added `html-to-image` `toPng` fallback if html2canvas throws. Also added FileReader `onerror` alert + "Reset Design to Defaults" button. **Note: the user reported "generate image is not working" during this session — this commit was the fix, but it has NOT been browser-verified yet.**
- `5e6d5c2` — **Slide text box editor (deck-wide overlay)**:
  - `types.ts`: `SlideTextBoxBind` (14 binds: stem, options, answer, explanation, passage, prompt, roman, source, questionNumber, brand, headerTitle, footerTag, watermark, free) + `SlideTextBox` (px `x/y/w/fontSize`, `color`, `align`, `bold`, `text?` for free) + `slideTextBoxes?: SlideTextBox[]` in `DeckConfig`.
  - `src/utils/slideTextBoxes.ts` — `defaultSlideTextBoxes()` (1920×1080 px default layout: brand/header/stem/options/footer), `clamp`, `SLIDE_W/SLIDE_H`, `SLIDE_BOX_BINDS`, `SLIDE_BOX_COLOR_PRESETS`, `getSlideBoxContent()`, `formatSlideQNumber()`.
  - `SlideCanvas.tsx` — renders a `pointer-events-none z-20` box layer from `effectiveConfig.slideTextBoxes` (MathText for content binds; options list + roman items rendered with keys). Rendered INSIDE the exported `slideRef` so boxes appear in PNG/PPTX.
  - `SlideTextBoxOverlay.tsx` — edit handles (drag/resize in px, deltas divided by `slideScale`), label chips, amber selection ring. Rendered as a sibling of SlideCanvas in App.tsx's scaled 1920×1080 wrapper → never exported.
  - `SlideTextBoxPanel.tsx` — add-box buttons, bind select, free-text textarea, 16–140px font slider, color presets + picker, align, bold, duplicate, delete, reset.
  - `App.tsx` — `isTextBoxEditMode` + `selectedTextBoxId` state; "Edit Text Boxes" toggle next to Answer Reveal; overlay inside transformed wrapper; panel below the preview (must stay OUTSIDE the `overflow-hidden` flex canvas container); updates via `setConfig` → persists in IndexedDB + deck JSON round-trip.

## Decisions made

- **Deck-wide scope**: one set of boxes per deck in `DeckConfig.slideTextBoxes`, overlaid on every slide; bound boxes fill from each slide's own question. (User-confirmed.) Per-slide overrides can come later through `item.customConfig.slideTextBoxes` — `SlideCanvas` already reads via `effectiveConfig`.
- **px coordinates** (not %) for slides — canvas is fixed 1920×1080; `fontSize` is px (slider 16–140).
- **Overlay only**: no custom background image for slides; boxes float over the existing template background.
- **Export boundary pattern** (shared with the social editor): box CONTENT inside the exported node, edit HANDLES in a sibling overlay outside it.
- **Raw hex** (color presets/picker) is the sanctioned exception — it's user data; presets match Tailwind semantic palette (`#fbbf24` = amber-400).

## Problems solved

- Social custom-mode export: `absolute inset-0` capture node + `<img object-cover>` are both html2canvas hazards → static card + CSS `background-image cover` + `toPng` fallback.
- App.tsx panel placement bug: was initially inside the `overflow-hidden flex` canvas container; moved outside so it lays out full-width below the preview.
- `onMove` prop type mismatch (Patch vs x,y) caught by tsc and fixed with a wrapper in App.tsx.

## Current state

All green: `npx tsc --noEmit` + `npm run build` pass. HEAD `5e6d5c2` on `main`, working tree clean.

## Next session starts with

1. **Browser-verify the social "Download Social Image" export** (the fix from `70517a6`) — toggle Custom Mode, add a bg image + boxes, export; confirm the PNG matches the preview and has no editor handles.
2. **Browser-verify the slide text box editor**: Preview tab → "Edit Text Boxes" → add boxes, drag/resize, change slide (bound boxes update), export PNG/PPTX and confirm boxes appear and handles don't.
3. If both pass, consider per-slide box overrides via `item.customConfig.slideTextBoxes` (already flows through `effectiveConfig`).

## Open questions

- None blocking. Both new features are unverified in a real browser (no browser access in this environment) — export paths (html2canvas/html-to-image, `slideRef` capture) are the highest-risk areas.
