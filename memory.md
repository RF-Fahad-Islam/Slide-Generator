# Memory — Answer Display Modes (highlight-in-place / separate answer slides)

Last updated: 2026-08-06

## What was built

**This session — feature + review fixes, both committed on branch `feat/answer-slides`:**
`cba3b74` (feature) and `d4b3596` (review fixes). Branch `feat/answer-slides` also carries the
parallel session's commits in its history (`fb95144` ingestion, `478d0a2` per-box fonts,
`966663c` role fonts, `6d1540b` shared DeckCard).

1. **`answerMode?: 'hidden' | 'highlight' | 'separate_slide'` on `DeckConfig`** (`src/types.ts`) +
   new `src/utils/answerSlides.ts`: `effectiveAnswerMode` (falls back to legacy `showAnswerInSlide`
   boolean — saved decks need no migration), `effectiveShowAnswerInSlide`, `expandDeckSlides`
   (question → [question, answer] expansion, returns `SlideRef[]`), `questionSlideIndex`.
2. **`SlideCanvas`** — new `slideVariant?: 'question' | 'answer'` prop. Answer slides highlight the
   correct option + show a visible emerald "উত্তর: {key}" strip (standard, class-mode, and
   text-box/boxed designs) + explanation. The text-box `options` bind now highlights the correct
   pill/card (template-token colors + ✓) when a highlight/answer slide is active.
3. **`DeckSettings`** (Layout tab, "Slide Interactive Display Settings") — old "Show Answer Key
   Highlight" checkbox replaced by a 3-state **Answer Display Mode** segmented control.
4. **`App.tsx`** — `selectedIndex` now walks `expandDeckSlides()`: preview nav, slide counters,
   overview grid (emerald "Answer" badge), deck-list clicks jump to the question slide.
5. **Exports** — `ExportModal` "Include Answer Slides" checkbox (per-export, defaults to deck mode)
   drives PPTX/PDF/ZIP; `pptxExport` gained `PptxSlideSpec[]` param and emits native editable answer
   slides; `SlideThumb` gained `slideVariant`.
6. Docs updated: `context/progress-tracker.md` + `context/ui-registry.md`.

## Decisions made

- **3-state answer model** (mutually exclusive): No Answer / Highlight on Slide / Separate Answer
  Slide (+1 per question). Replaced the old boolean.
- **Answer slide content** = highlighted option + "উত্তর" label + explanation (when present).
- **Per-export toggles, not forced**: exports keep their own "Include Answer Slides" checkbox; it
  defaults to the deck's answer mode but can be flipped per export.
- **`answerMode` is deck-wide only** (review fix): slide expansion is a deck-level property, so the
  Deck Settings control ignores the Global/Slide scope toggle (with an "Applies to the whole deck"
  hint). A per-slide `answerMode` silently did nothing.
- **Answer slides reuse the same layout** (highlighted) rather than a distinct "উত্তরমালা" design.
- **No hardcoded hex** in the new renderer code (review fix) — textbox highlight derives from
  `styles.hexColors.optionSelectedBg/Border/Text`; answer pills use theme-aware Tailwind emerald
  classes.

## Problems solved

- **Textbox options never highlighted** — the `options` text-box bind rendered every option
  identically even when `showAnswerInSlide` was on; now the correct one is highlighted.
- **Parallel session clobbered my uncommitted edits** — they ran `git add -A` and my `types.ts` +
  `SlideCanvas.tsx` changes were swept into their commit `478d0a2`. Verified intact in HEAD; no data
  lost, but keep re-checking the working tree while they're active.
- **Per-slide "Separate Answer Slide" silently no-oped** (review) — forced deck-wide.
- **Export checkbox was a no-op outside `separate_slide` mode** (review) — it now FORCES
  separate-slide expansion (`answerSlides` list) so it works in hidden/highlight decks too.
- **Stale `selectedIndex` after delete / mode switch** (review) — clamped via an effect on
  `expandedSlides.length`.

## Current state

- Branch `feat/answer-slides` at `d4b3596`. `tsc --noEmit` + `npm run build` green.
- **The parallel session is STILL actively editing this repo** — uncommitted working-tree changes
  right now: `ExportModal.tsx`, `SlideCanvas.tsx`, `SlideThumb.tsx`, `pptxExport.ts`,
  `DeckQuestionPaperModal.tsx`, `QuestionBankPdfModal.tsx`, `context/progress-tracker.md`,
  `context/ui-registry.md` (additive on top of my committed work — my `slideVariant`/`answerMode`/
  `expandDeckSlides` markers verified intact). **Do not commit, stash, or pop their files.**
- `server-log.txt` is a dev-server artifact (untracked, deletable).
- Known non-blocking: html-to-image `SecurityError` for cross-origin Google Fonts/KaTeX CSS during
  raster exports (pre-existing).

## Next session starts with

1. Reconcile with the parallel session — they're mid-edit on files I own (`ExportModal`,
   `pptxExport`, `SlideCanvas`, `SlideThumb`). If they haven't committed yet, wait or coordinate
   before merging `feat/answer-slides` to `main`.
2. Manual browser verification (agent cannot): toggle Answer Display Mode in Deck Settings →
   confirm highlight-in-place on question slides; switch to "Separate Answer Slide" → confirm
   preview navigates question → answer, overview shows Answer badges, PPTX/PDF/ZIP include answer
   slides with the "উত্তর" strip, and the text-box design highlights the correct option.
3. Remaining backlog (unchanged): bundle self-hosted Bengali woff2 fonts; declarative `Element[]`
   renderer refactor; interactive template studio JSON import/export; large-scan `express.json`
   50mb limit.

## Open questions

- Whether the parallel session merges/rebases onto my branch and when they stop editing shared files
  so `feat/answer-slides` can be merged to `main`.
- Real-world visual QA of the answer slide design (strip placement, boxed-mode pill) in the browser
  is unverified.
