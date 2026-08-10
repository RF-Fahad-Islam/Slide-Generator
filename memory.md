# Memory — Background Image Resize/Crop/Fit Editor + Form Staged-Batch Flow

Last updated: 2026-08-07

## What was built

All committed on `main`. HEAD = `fb5ce5e` ("feat: background image resize/crop/fit editor everywhere + form staged-batch flow + ManualEditor crash fix"). Working tree clean; 24 files changed.

1. **New `src/components/BackgroundImageEditor.tsx`** — reusable canvas-based modal (no new deps) for **Resize · Crop · Fit** of any uploaded background image. Opens right after a bg image file is selected in `DeckSettings` (bg upload) and `SocialPostGenerator` (custom canvas bg upload).
   - **Aspect Ratio** chips (DeckSettings: 16:9/4:3/1:1/9:16, default 16:9; SocialPost: 1:1/4:5/9:16, default = current aspect).
   - Interactive **crop frame**: drag anywhere to pan (`applyDrag mode 'move'`), 4 corner handles resize aspect-locked, rule-of-thirds guides, live `W × Hpx` readout, dimmed outside regions. Pointer events use `setPointerCapture`; coords converted via `toImgCoords` (client px → natural image px).
   - **Fit mode**: Cover (bake cropped region), Contain (whole image letterboxed into ratio), Stretch (distort to fill). **Critical**: `contain` output is baked as **PNG** (alpha) so letterbox bars stay transparent and the slide theme shows through; cover/stretch use JPEG 0.92.
   - **Output Size** presets: Original/720/1080/1920/4096. `handleApply` → canvas `drawImage` → `BgImageEditorResult { dataUrl, fit, ratioId, width, height }`.
   - Props: `open`, `imageUrl`, `isAppLight`, `ratios: BgRatioOption[]` (`{ id, label, value (w/h), hint }`), `defaultRatioId`, `onClose`, `onApply(result)`.
2. **`types.ts`** — new `BgImageFit = 'cover' | 'contain' | 'stretch'` + `DeckConfig.bgImageFit?`. `templatePresets.ts` snapshot captures `bgImageFit`.
3. **Renderers honor fit** (map `bgImageFit` → `backgroundSize`: cover/contain/`100% 100%`, center, no-repeat) — was hardcoded `bg-cover bg-center` before: `SlideCanvas`, `DeckSettings` preview, `DeckQuestionPaperModal`, `QuestionBankPdfModal`, `ClassicQuizCard` (`customBgImageFit` prop), `QuizTimeCard` (same), and the `SocialPostGenerator` custom canvas.
4. **DeckSettings** — bg upload handler opens the editor instead of directly patching; `handleBgEditorApply` → `handlePatch({ bgImageUrl, bgPreset: 'custom', bgImageFit })`; "Re-edit Image" button next to Clear; Clear resets fit.
5. **SocialPostGenerator** — custom-bg upload opens the editor; `CustomPostDesign` + `StoredPostDesign` gained `bgImageFit` (persisted to `social_post_custom_design_v1`, loaded, default `'cover'`); "Re-edit" button on the active-bg card; `backgroundSize` honors fit on the custom canvas.
6. **Manual Editor page crash fixed** — `parsedPreview` (ManualEditor.tsx) referenced batch-tag state (`batchSourceTags`/`batchSubject`/`batchClass`/`batchPaper`) declared LATER in the same render scope → `ReferenceError: Cannot access before initialization` at render → whole Manual Editor tab white-screened. Fixed by moving the batch-tag state block ABOVE `parsedPreview`.
7. **Form Question Creator staged-batch flow** (ManualEditor) — submit no longer commits straight to the deck. "Save Question to Batch" appends the built MCQ to `stagedItems` and clears the form with an emerald success notice (`formNotice`). Below the form, a **Staged Batch (N)** indigo panel lists staged questions (numbered, stem, Ans/source chips, per-row ✕ remove) with **Commit All (N) → Active Deck** (`commitStagedToDeck` → `onAddMCQs(stagedItems)` + clear + `✓ N MCQs added`) and **Commit All (N) → Question Bank** (`commitStagedToBank` → async `onImportToQuestionBank` + clear + `✓ N MCQs saved`), plus Discard All. Editing existing deck/queue questions still updates in place ("Question updated…" notice). Batch-tab buttons clear `formNotice`; `startBatchEditAll` clears `stagedItems` + notice.

## Decisions made

- `BgImageFit` is the single fit contract: renderers map it to `backgroundSize` (`cover` → `'cover'`, `contain` → `'contain'`, `stretch` → `'100% 100%'`), `backgroundPosition: center`, `backgroundRepeat: no-repeat`.
- `contain` MUST be baked as PNG (transparency) — JPEG has no alpha and would bake solid-black letterbox bars (double-letterbox bug caught in `/review`).
- The editor is fully client-side canvas — no new dependency approved/needed (react-image-crop etc. would have required approval).
- Staged batch keeps `onAddMCQs(stagedItems)` (App `handleAddMCQs` already `ensureUniqueIds`).

## Problems solved

- **ManualEditor TDZ crash** (see #6 above) — a `const` read before its declaration in the same render scope crashes React at render. Symptom: whole Manual Editor tab blank. Always keep derived values AFTER the state they read.
- **Contain double-letterbox** — baking `contain` as JPEG produced opaque black bars that then got letterboxed again by the renderer. PNG fix.
- **Stale-closure in the editor's image-load effect** — `ratioId` read inside `el.onload` could be stale; computed `targetRatioId` from props instead.
- **Ratio-reset effect loop risk** — effect depended on `activeRatio` (recomputed from inline `ratios` array, new identity per parent render); narrowed deps to `[ratioId, img]` (review fix).

## Current state

- On `main`, HEAD = `fb5ce5e`. `npx tsc --noEmit` clean, `vite build` green (only pre-existing chunk-size warning). Lint script is `tsc --noEmit` (no eslint config exists).
- Known minor (pre-existing, still open): create-mode `setSelectedIndex(items.length)` lands on the wrong slide under `separate_slide` answer mode (`App.tsx` EditQuestionModal `onSave`).
- Backlog unchanged: bundle self-hosted Bengali woff2 fonts; declarative `Element[]` renderer refactor; interactive template studio JSON import/export; paginated standalone answer-key slides (`answerKeyList`).

## Next session starts with

1. Verify in-browser (dev server on :3000): upload a bg in Deck Settings + Social Post custom canvas → editor opens, crop/drag/fit/output all work, `contain` shows theme through transparent bars.
2. Optionally fix the known minor: create-mode `setSelectedIndex(items.length)` → use `questionSlideIndex(expandDeckSlides(...), items.length)` for `separate_slide` mode.
3. Run `git fetch`/`pull` if parallel sessions pushed more commits.

## Open questions

- None blocking. Only the minor `separate_slide` create-mode nav target is knowingly unresolved.
