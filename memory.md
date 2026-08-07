# Memory — Add Questions Banner Relocation + Question Bank JSON Removal

Last updated: 2026-08-07

## What was built

All committed on `main`. HEAD = `45f31a4` (this session's docs commit). Source changes were swept into the parallel session's `b036e3d` ("fix: remove hover-lift effects…") which touched the same files — my work is IN that commit. Working tree is clean except my two docs commits were already made (`45f31a4`); nothing uncommitted remains.

1. **New shared `src/components/AddQuestionsBanner.tsx`** — the green emerald "Add Questions" banner extracted from `App.tsx` into a reusable component (props: `onClick` / `count` / `appTheme`; `from-emerald-500 via-emerald-400 to-teal-400` gradient, `PlusCircle` tile, "N in deck" badge, subtitle "Question Bank · Manual Editor · Question Creator Form", "Choose Source →" CTA).
2. **Slide Studio: banner moved INSIDE `DeckManager`** — now renders right after the Deck Health `ValidationPanel` and before the Bulk Transformation Bar (`src/components/DeckManager.tsx`). New optional `onAddQuestions?: () => void` prop (App passes `() => setIsAddQuestionsOpen(true)`); `count = items.length`. Removed the sibling banner + `flex flex-col gap-4` wrapper from `App.tsx`; also removed now-unused `PlusCircle`/`ArrowRight` from App's lucide import.
3. **Question Bank page: JSON import REMOVED** — deleted the "Import MCQs (JSON)" header button, hidden file input, JSON confirm form, `handleImportJsonFile`/`handleConfirmJsonImport` handlers, and `importPending`/`importDeckName`/`importDeckSubject`/`jsonFileInputRef` state from `QuestionBankView.tsx`. Cleaned imports (`normalizeMCQs`, `UploadCloud`, `X`, `useRef`). Per-deck "Download as JSON" export (`handleExportDeckJson`/`downloadJSON`) stays. New required `onAddQuestions: () => void` prop; the shared banner renders right after the page header.
4. **Home bento cleanup (`SlideDecksHome.tsx`)** — removed the duplicate "16:9 Slide Studio" tool card (a stale copy that navigated to social but rendered identical studio content; the real Social Posts card was kept). "6 Tools" badge → "5 Tools". Removed the extra 16:9 card requested earlier this session.

## Decisions made

- The Add Questions banner is **green + lives inside `DeckManager` right after Deck Health** (user-requested location), and is reused on the Question Bank page via a shared component instead of duplicated markup.
- JSON import was removed from the Question Bank **header flow** (user request) — per-deck JSON **export** retained. The AddQuestionsModal remains the single entry point for choosing a question source.
- `DeckManager.onAddQuestions` is optional (banner only renders when the prop is passed) so the component stays reusable.

## Problems solved

- Duplicate/confusing home card: Tool 2 was labeled "Social Media Posting Card Generator" but rendered a copy of the 16:9 Slide Studio card and navigated to social — removed; the real Social Posts card (indigo, Share2, 1:1/4:5/9:16) remains.
- Orphaned imports after removal (`normalizeMCQs`, `UploadCloud`, `X`, `useRef`, `PlusCircle`, `ArrowRight`) all cleaned; verified `tsc --noEmit` + `vite build` green.
- /review ran before commit: 0 issues found.

## Current state

- On `main`, HEAD = `45f31a4`. `npx tsc --noEmit` clean, `vite build` green (only pre-existing chunk-size warning).
- Working tree clean (source committed in parallel session's `b036e3d`; docs committed in this session's `45f31a4`).
- Still true from earlier: known minor = create-mode `setSelectedIndex(items.length)` lands on the wrong slide under `separate_slide` answer mode (`App.tsx` EditQuestionModal `onSave`). Backlog unchanged: bundle self-hosted Bengali woff2 fonts; declarative `Element[]` renderer refactor; interactive template studio JSON import/export.

## Next session starts with

1. Optionally fix the known minor: create-mode `setSelectedIndex(items.length)` navigates to the wrong slide under `separate_slide` answer mode — use `questionSlideIndex(expandDeckSlides(...), items.length)`.
2. If adding CSV / JSON-backup source cards to the AddQuestionsModal (mentioned earlier as a possible follow-up), reuse `parseCSVToMCQs` (`src/utils/csvParser.ts`) and `normalizeMCQs` (`src/utils/mcqJson.ts`).
3. Run `git pull`/fetch if the parallel social-post session pushes more commits before you continue.

## Open questions

- None blocking. Only the minor `separate_slide` create-mode nav target is knowingly unresolved.
