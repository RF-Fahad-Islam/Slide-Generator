# Progress Tracker

> Update this after EVERY task and feature (CLAUDE.md mandate). Format: one row per
> task with status, phase, date, and the file(s) touched. Keep current phase's tasks
> at the top.

## Status legend
`[ ]` pending · `[~]` in progress · `[x]` done · `[!]` blocked (note why)

---

## Planning & docs (DONE)
- [x] 2026-08-05 — Write `plan.md` (final plan + decision log D1–D16) — root
- [x] 2026-08-05 — Write `context/project-overview.md`
- [x] 2026-08-05 — Write `context/architecture.md`
- [x] 2026-08-05 — Write `context/auth-plan.md`
- [x] 2026-08-05 — Write `context/ui-tokens.md`
- [x] 2026-08-05 — Write `context/ui-rules.md`
- [x] 2026-08-05 — Write `context/ui-registry.md`
- [x] 2026-08-05 — Write `context/code-standards.md`
- [x] 2026-08-05 — Write `context/library-docs.md`
- [x] 2026-08-05 — Write `context/build-plan.md`
- [x] 2026-08-05 — Write `context/progress-tracker.md`

## Phase 0 — Scaffold (branch: `feat/phase-0-scaffold`) — NOT STARTED
- [ ] git init + .gitignore + initial commit + phase branch
- [ ] `create-next-app` (TS, Tailwind, ESLint, App Router) — temp+copy if it rejects non-empty dir
- [ ] Read `node_modules/next/dist/docs/` for installed conventions
- [ ] Install deps (exact list, `library-docs.md`)
- [ ] shadcn/ui + base components (load `/shadcn` skill first)
- [ ] Add semantic tokens incl. `--success`/`--warning`/`--info` to theme CSS
- [ ] Bundle Bengali woff2 (Hind Siliguri, Noto Sans Bengali), self-hosted
- [ ] Folder skeleton per `architecture.md` §9
- [ ] `npm run build` clean
- [ ] Commit + `/remember save`

## Phase 1 — One template + renderer (`feat/phase-1-renderer`) — NOT STARTED
- [ ] Zod schemas: deck, brand-kit, template (with `.refine` exactly-one-correct)
- [ ] `build-slides.ts` — expand + resolve-once autofit (D6) + unit tests
- [ ] `SlideStage.tsx` — logical canvas, transform:scale, KaTeX, `<img>`, brand CSS vars, fonts.ready
- [ ] built-in `class-mode-bangla.ts` (writing area + right options + answer layout)
- [ ] `storage/` interface + idb-keyval impl + JSON export/import
- [ ] dev page rendering fixture deck (plain + bohupodi + LaTeX)
- [ ] `export/png.ts` (offscreen render, fonts.ready, html-to-image)
- [ ] Done-when: PNG matches preview; autofit/coords tests pass; build clean
- [ ] Commit + `/remember save`

## Phase 2 — AI SPINE (`feat/phase-2-ai-spine`) — NOT STARTED ⚑ milestone #1
- [ ] Settings — BYOK key (localStorage, namespaced) + BrandKit CRUD + privacy copy
- [ ] `ai/constants.ts` — verify model ID from Google docs (no memory trust); chunk size 15
- [ ] `app/api/extract/route.ts` — structured output (responseSchema), streaming, finish-reason guards, safe errors, countTokens estimate
- [ ] `lib/ai/` — prompt (bohupodi+LaTeX+tags, never-silent-answer), chunking, numeral normalization (D15), Zod validation
- [ ] Review screen — accept/edit/discard, live KaTeX preview, confidence-flagged answers must-confirm (D10)
- [ ] Deck editor (minimal) — list/select, per-question form, live SlideStage preview, zustand+immer
- [ ] `export/katex-raster.ts` + `pptx.ts` — hybrid (native text + KaTeX PNGs + raw LaTeX in notes), LAYOUT_16x9
- [ ] Paste-text input UI with chunk progress
- [ ] **Key-hygiene test** + **AI-spine acceptance** (plan.md §8) incl. PPTX in PowerPoint
- [ ] Save Gemini API excerpts → `context/library-docs-gemini.md`
- [ ] Commit + `/remember save`

## Phase 3 — Editor depth + manual mode (`feat/phase-3-editor-manual`) — NOT STARTED
- [ ] dnd-kit sortable (keyboard sensor), multi-select, bulk dup/delete
- [ ] Full per-question form incl. passage type, stemType picker, image upload
- [ ] `parse/plain-text.ts` Bangla bulk-paste parser + Vitest messy fixtures
- [ ] `parse/csv.ts` fixed-header import + example CSV
- [ ] Validation panel (missing correct, dup options, overflow, numeral mismatch, jump-to)
- [ ] Deck settings: pick BrandKit + template inline token tweaks (token-swap, D7)
- [ ] Offline acceptance: network off → bulk-paste → slides
- [ ] Commit + `/remember save`

## Phase 4 — Export breadth (`feat/phase-4-export`) — NOT STARTED
- [ ] Ratios 1:1/4:5/9:16 + warn/seed "from 16:9" (D12)
- [ ] `answerKeyList` repeater + paginated build-slides (D13)
- [ ] ZIP (JSZip, `01_q.png`/`01_ans.png`)
- [ ] PDF (image-per-page)
- [ ] Export dialog (format/ratio/kinds/filename/determinate progress)
- [ ] Ratio acceptance: no clipped text at 1:1 and 9:16
- [ ] Commit + `/remember save`

## Phase 5 — Template management (`feat/phase-5-templates`) — NOT STARTED (no drag editor, D7)
- [ ] Template studio: clone/fork built-ins, token editor, live preview, JSON export/import
- [ ] Per-ratio variant tabs + "copy from 16:9"
- [ ] Built-ins: `standard-grid`, `social-square` (Bangla+LaTeX, all slideKinds)
- [ ] Update `ui-registry.md`
- [ ] Commit + `/remember save`

## Phase 6 — SaaS seam — LATER (not v1; needs fresh /architect)

---

## Open questions / blockers
_None._

## Notes for the next session
- Repo has NO git yet — Phase 0 task 1 (`git init`) is the first code action.
- This session wrote docs only (per explicit instruction "your task is not code").
- `plan.md` in the repo was previously corrupted (two concatenated truncated copies);
  it has been overwritten with the clean final plan.
- The 9 context files required by `CLAUDE.md` now exist (read order in `CLAUDE.md`).
- Decisions D1–D16 in `plan.md` §4 are locked; do not re-open without explicit
  user approval. If one seems wrong in practice, stop and ask.