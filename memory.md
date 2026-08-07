# Memory — Multi Source Tags + Structured Subject/Class/Paper Tags

Last updated: 2026-08-07

## What was built

All committed on `main`. HEAD = `958121d` ("feat: multi source tags + structured subject/class/paper tags across question pipeline"). Working tree clean; 20 files changed.

1. **New `src/components/SourceTagsInput.tsx`** — chip-based multi-tag input for board/exam source tags. Props: `tags: string[]`, `onChange`, `theme?: 'dark' | 'light'`. Enter/comma/pipe/on-blur commit; `|`/`,` splitting; Backspace removes last; X per-chip. (Note: an earlier parallel version of this file with a different API — `value`/`isAppLight`/`inputClassName` — existed on disk; the committed one is the new `tags`/`theme` API.)
2. **`src/types.ts`** — `MCQItem.source?: string[] | string` (was `string[]` only; the union keeps legacy string decks valid). Existing `getSourceTags(item)` helper normalizes both forms.
3. **ManualEditor + EditQuestionModal** — `sourceTag: string` state → `sourceTags: string[]`; `buildUpdatedItem`/`buildFormItem` save `source` as array (only when non-empty) + new structured `tags: { subject, className, paper }` from 3 new inputs.
4. **QuestionBankView** — filter logic rewritten to match against `getSourceTags(question)` (multi-tag aware, not a single `question.source` string). New **Class** + **Paper** filter dropdowns; Subject dropdown appends dynamic bank tag values; Reset clears all 5 filters; filter grid widened to `lg:grid-cols-5`. Question cards render each source tag as its own amber chip + optional mono subject/class/paper chips.
5. **Parsers** — `bulkParser.ts`: multiple `[tag]` source lines accumulate into an array + new `subject:`/`class:`/`paper:` tag lines; sample decks switched to `source: string[]`. `csvParser.ts`: source column splits on `,;，；` into tags + new `subject`/`class`/`paper` header columns (sample CSV updated).
6. **Renderers/exports migrated to multi-tag** — `SlideCanvas` (source badge = one chip per tag), `SortableQuestionCard`, `DeckManager` search, `slideTextBoxes.ts` `source` bind (`join(' · ')`), `pptxExport.ts` source badge pill, question-paper PDFs (`QuestionPaperPage`, `DeckQuestionPaperModal`, `QuestionBankPdfModal` — `join(' · ')`), `SocialPostGenerator` picker search/filters.
7. **Server/JSON normalization** — `sanitize.ts` and `mcqJson.ts` both now normalize `source` to `string[]` (array → strings, string → `[string]`).
8. **Docs** — `context/progress-tracker.md` + `context/ui-registry.md` updated (new `SourceTagsInput` entry, QuestionBank filters note, EditQuestionModal form note).

## Decisions made

- `source` is now a `string[]` as the canonical persisted shape; `getSourceTags()` is the single normalization entry point (legacy single-string decks read fine, no migration needed).
- Structured filters live on `MCQItem.tags` (`MCQTags`: `subject`/`className`/`paper`) — separate from the free-form `source` tags. Class/Paper filter dropdowns are **dynamic** (derived from tags actually present in the bank) with hardcoded SSC/HSC/Class 9/Class 10 + 1st/2nd Paper fallbacks only when no tagged data exists.
- `SourceTagsInput` component API is `tags`/`onChange`/`theme` (not `value`/`isAppLight`).

## Problems solved

- TS errors mid-build: `source: sourceTags.join(' | ')` failed because `source` was already typed `string[]` — fixed by persisting the array directly; the `never` narrowing in `getSourceTags` was fixed by widening the type to `source?: string[] | string`.
- Stale `sourceTag` string state → removed cleanly; no dangling references (verified via `rg`).

## Current state

- On `main`, HEAD = `958121d`. `npx tsc --noEmit` clean, `vite build` green (only pre-existing chunk-size warning). Lint script is `tsc --noEmit` (no eslint config exists).
- Known minor (pre-existing, still open): create-mode `setSelectedIndex(items.length)` lands on the wrong slide under `separate_slide` answer mode (`App.tsx` EditQuestionModal `onSave`).
- Backlog unchanged: bundle self-hosted Bengali woff2 fonts; declarative `Element[]` renderer refactor; interactive template studio JSON import/export; paginated standalone answer-key slides (`answerKeyList`).

## Next session starts with

1. Optionally fix the known minor: create-mode `setSelectedIndex(items.length)` → use `questionSlideIndex(expandDeckSlides(...), items.length)` for `separate_slide` mode.
2. Possible follow-ups for the tag feature: bulk tag-edit UI (set subject/class/paper on many questions at once in the Bank), or CSV import template header row updated in the UI copy (CSV Import box mentions `explanation`/`source` columns — add `subject`/`class`/`paper`).
3. Run `git fetch`/`pull` if parallel sessions pushed more commits.

## Open questions

- None blocking. Only the minor `separate_slide` create-mode nav target is knowingly unresolved.
