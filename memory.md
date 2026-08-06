# Memory — Shared DeckCard + Batch Deck Export + MCQ Strip Preview

Last updated: 2026-08-06

## What was built

All committed on `feat/answer-slides` (three commits this session):

1. **`6d1540b` — Shared `DeckCard` (visual parity Home ↔ My Decks)** — new `src/components/DeckCard.tsx` is THE single deck-card design, used by BOTH `SlideDecksHome.tsx` Section 4 and `MyDecksView.tsx`. Card = `p-5 rounded-3xl` glass card → real first-slide `DeckSlideThumb` (`getTemplateById(config?.templateId || 'rakib-dark')`), "N Questions" + optional subject chips, optional `lastUpdated`, `line-clamp-2` title, `badgeTag` line, Theme row, solid-amber **Open Slide Studio** CTA, optional 2-col `Deck Settings`/`Social Posts` row (renders only when handler given), and My Decks-only tertiary controls (`onDownload`/`onExportJson`/`onDelete` → `Download Deck` subtle amber, `N MCQs` + `Export JSON` + `Trash2`). Both call sites pass `appTheme`; My Decks keeps the **3-arg** `onOpenDeckSettings(items, config, deck.id)` so `editingSavedDeckId` auto-sync survives, Home keeps **2-arg**.
2. **`48dbea2` — Navbar batch deck export + Studio whole-deck download** — new `src/components/BatchExportModal.tsx` opened from the navbar "Export Slides" buttons (`SidebarNav` bottom action; `HeaderNavbar` is defined but NOT rendered — only SidebarNav is live). Lists saved decks from `db.questionDecks` (auto-seeds 2 `SAMPLE_DECKS` via `seedConfig` prop when empty, sorted `updatedAt` desc) with checkboxes + Select All/Clear; **Download PPTX (N)** sequentially calls `exportDeckToPPTX(deck.items, deck.config, onProgress)` per selected deck (each triggers its own `.pptx` via `writeFile`), with progress bar + success state; single selection works. `App.tsx`: new `isBatchExportModalOpen` state; `SidebarNav.onOpenExportModal` now opens the batch modal; `<BatchExportModal>` rendered next to `<ExportModal>`. **Slide Studio toolbar Download** flipped `exportScope` `'current'` → **`'all'`** (whole active deck through the existing ExportModal); `'current'` scope remains in ExportModal but no entry point uses it.
3. **`9f2cc47` — Manual Editor "Live Parse Preview" as MCQ strip** — `ManualEditor.tsx` preview changed from `aspect-video` (16:9, stacked stem + 2×2 options) to a **wide strip** `aspect-[21/6]` (3.5:1): left zone = number chip + `line-clamp-2` stem (42% width), right zone = 4 option pills in one `grid-cols-4` row. Shows only the parsed MCQ, no slide chrome.

Docs updated each time: `context/progress-tracker.md` + `context/ui-registry.md` (new `BatchExportModal` section; `ExportModal` scope-model entry and ManualEditor Live Parse Preview entry updated; DeckCard section added earlier).

## Decisions made

- **One shared `DeckCard`** is the single source of truth for deck cards — no more hand-maintained duplicates.
- **Two `onOpenDeckSettings` signatures must stay distinct**: Home = `(items, config?)`, My Decks = `(items, config?, savedDeckId?)`. `DeckCard` only forwards the handler.
- **Single solid CTA per card** — "Open Slide Studio" is the solid amber button; Download Deck is deliberately subtle (amber-500/15).
- **Navbar download = batch selector; Slide Studio download = whole active deck** (via the ExportModal at scope `all`); studio stays scoped to the active working deck only, NOT a batch.
- **Design system compliance**: `glass-card-fatty`/`light`, `isAppLight` ternaries, amber accents only — no hardcoded hex/raw colors.

## Problems solved

- **Deck cards looked different between Home and My Decks** — two hand-maintained copies of the same markup; fixed by extracting `DeckCard` and deleting both duplicates.
- **Navbar export only exported the active deck** — added a real multi-deck selector (single or batch), reusing the existing `exportDeckToPPTX` (which already downloads via `pptx.writeFile`).
- **Slide Studio Download only exported the current slide** — flipped to whole deck; user confirmed it should remain deck-scoped.
- **Parallel-session note**: the answer-slides parallel session committed (`cba3b74`, `d4b3596`, `4916cd2`) and the old pre-existing `App.tsx` `slideVariant` type error is GONE (their `SlideThumb` now accepts it). tsc is fully clean now. They still have UNCOMMITTED edits in the tree (`DeckQuestionPaperModal.tsx`, `ExportModal.tsx`, `QuestionBankPdfModal.tsx`, `SlideCanvas.tsx`, `SlideThumb.tsx`, `pptxExport.ts`) — do NOT commit those.

## Current state

- On branch `feat/answer-slides`, HEAD = `9f2cc47`. All three features committed and green (`tsc --noEmit` clean project-wide, `vite build` green).
- CDP-verified: batch modal opens from sidebar (2 deck rows, Select All → "2 / 2 selected" + "Download PPTX (2)", deselect → single, Cancel), studio Download tooltip = "Download the whole deck — PPTX, PDF, PNG, ZIP", Manual Editor strip renders 3.50:1 (717×205) with stem + A–D options.
- Known non-blocking: html-to-image `SecurityError` for cross-origin Google Fonts/KaTeX during raster exports (pre-existing). PPTX batch download relies on the browser allowing sequential multi-downloads.

## Next session starts with

1. **Browser-verify the batch PPTX actually downloads** (manual, agent cannot): open navbar Export Slides → select 1 deck → Download → confirm a real `.pptx` lands; then select 2 decks → confirm 2 files (browser may prompt "allow multiple downloads"). Eyeball the batch modal in light theme.
2. Reconcile with the parallel session — their answer-slides edits are still uncommitted on this branch; confirm before starting new work.
3. Remaining backlog (unchanged): bundle self-hosted Bengali woff2 fonts; declarative `Element[]` renderer refactor; interactive template studio JSON import/export.

## Open questions

- None blocking. The actual `.pptx` download inside the batch loop is the only unverified behavior (logic is identical to the working ExportModal path, but a human should confirm the browser's multi-download handling).
