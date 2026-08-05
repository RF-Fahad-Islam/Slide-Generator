# Build Plan — worker-executable phases

> How to use this file: work exactly ONE phase at a time, top to bottom. Each phase
> lists: Goal → Why (rationale, so you don't second-guess) → Tasks (in order) →
> Files → Done-when (the gate; all boxes must pass) → Commit.
> Locked decisions are referenced as D1–D16 (see `plan.md` §4) — do not re-open them.
> Workflow per phase (CLAUDE.md): `/architect` → implement → `npm run build` clean →
> `/review` → commit → `/remember save`. Update `progress-tracker.md` after each task.

---

## Phase 0 — Scaffold (branch: `feat/phase-0-scaffold`)

**Goal:** runnable Next.js shell with deps, fonts, and conventions in place.
**Why:** every later phase assumes these exist; the docs (context/) are already
written — this phase creates the code skeleton they describe.

Tasks:
1. `git init`, `.gitignore` (node_modules, .next, .env*), initial commit on `main`,
   then create the phase branch. *(Repo has no git yet — this is the first repo action.)*
2. `npx create-next-app@latest .` (TS, Tailwind, ESLint, App Router). If it refuses
   the non-empty dir (existing `CLAUDE.md`, `docs/`, `.agents/` are usually fine;
   conflicts are only on app files), scaffold into a temp dir and copy in.
3. **Read `node_modules/next/dist/docs/`** for the installed version's conventions
   before writing any route/component (this Next.js differs from training data).
4. Install deps (exact list in `library-docs.md` — nothing more).
5. Install shadcn/ui + base set (button, input, textarea, dialog, select, badge,
   card, tabs, toast/sonner). Load `/shadcn` skill first.
6. Add semantic tokens to the theme CSS incl. `--success`, `--warning`, `--info`
   (see `ui-tokens.md`). No raw hex outside this file.
7. Bundle Bengali fonts: Hind Siliguri + Noto Sans Bengali woff2 (self-hosted,
   `@font-face` in theme CSS, `display: swap`). D14.
8. Create the folder skeleton from `architecture.md` §9 (empty `src/lib/*` dirs with
   `.gitkeep` or stub index files).
9. `npm run build` clean.

Files: `package.json`, app shell, theme CSS, `public/fonts/*`, `src/lib/**` skeleton.
**Done-when:** `npm run dev` serves the default page with tokens + Bengali fonts
loading (check `document.fonts` in devtools); build clean.
**Commit:** `chore: phase 0 — next.js scaffold, deps, fonts, tokens`.

---

## Phase 1 — One template + renderer (branch: `feat/phase-1-renderer`)

**Goal:** render one hardcoded question (incl. a LaTeX stem and a bohupodi statement
item) to screen and to PNG, from a real template descriptor.
**Why:** the renderer is the foundation both input modes feed; the draft rule is
"never point AI at a shaky renderer" — so this lands before any AI.

Tasks:
1. Zod schemas: `src/lib/schemas/deck.ts` (Option, Question w/ 3 types + stemType +
   Tags + exactly-one-correct `.refine()`), `brand-kit.ts`, `template.ts` (Template,
   Variant, Layout, Element incl. `optionsListLayout`). Types via `z.infer`.
2. `src/lib/render/build-slides.ts`: `Deck → Slide[]` — question + answer slide per
   MCQ; **resolve-once autofit** (measure against logical canvas with real fonts,
   shrink-to-fit with a floor; emit fixed font sizes). D6. Unit-test the expansion
   and the shrink.
3. `src/components/render/SlideStage.tsx`: logical canvas 1920×1080 +
   `transform: scale()` wrapper; renders resolved `Slide` elements absolutely
   positioned; KaTeX `renderToString` for `stemType:'latex'`; `<img>` for
   `stemType:'image'`; brand via CSS custom properties from BrandKit (D16);
   `await document.fonts.ready` exposed as a readiness hook (D14).
4. Built-in template `src/lib/templates/builtin/class-mode-bangla.ts`: 16:9 variant,
   question + answer layouts; stem across top, **left ~55% `writingArea`** (blank,
   for classroom working), options stacked right ~40%, source/tag line, brand
   footer/watermark slots. Answer layout: correct option gets `--brand-accent`.
5. `src/lib/storage/` idb-keyval behind the interface (decks/brandKits/templates
   CRUD, `schemaVersion`, JSON export/import of a deck). D1.
6. Dev page (temporary route) rendering the fixture deck: one plain Bangla MCQ, one
   bohupodi, one LaTeX stem.
7. `src/lib/export/png.ts`: offscreen render → `document.fonts.ready` →
   `html-to-image.toPng`. Button on the dev page downloads slide PNGs.

Files: `src/lib/schemas/*`, `src/lib/render/build-slides.ts`,
`src/components/render/SlideStage.tsx`, `src/lib/templates/builtin/class-mode-bangla.ts`,
`src/lib/storage/*`, `src/lib/export/png.ts`, dev page.
**Done-when:** fixture deck renders in browser (Bangla conjuncts correct, KaTeX
typeset, writing area blank, options right); PNG download matches preview pixel-for-
pixel; `build-slides` + autofit + coords unit tests pass; build clean.
**Commit:** `feat: phase 1 — template descriptor, SlideStage, class-mode-bangla, PNG export`.

---

## Phase 2 — THE AI SPINE (branch: `feat/phase-2-ai-spine`) ⚑ first working state

**Goal:** paste text → Gemini extracts editable MCQs → review → deck → PNG + hybrid
PPTX. **This is the user's #1 milestone — the phase is done only when the end-to-end
acceptance (plan.md §8) passes with a real Bangla bohupodi paste.**
**Why this before manual mode:** user's explicit priority (D9); the review screen is
the safety net that makes AI-first safe (D10).

Tasks:
1. **Settings page** (`src/app/settings/page.tsx`): Gemini key input → localStorage
   (`mcqgen.geminiKey`); privacy copy + AI Studio link (`auth-plan.md`); BrandKit
   management (create/edit the one default BrandKit for now).
2. `src/lib/ai/constants.ts`: model ID constants (verify current ID from Google docs —
   do NOT trust memory), chunk size 15.
3. `src/app/api/extract/route.ts` (`runtime='nodejs'`): accepts `{ text, hints? }`
   (hints: examLevel, board, subject, chapter, expected count); key from
   `x-gemini-key` header; per-call client; **structured output** (responseSchema from
   the Zod Question[] shape); **streaming**; explicit finish-reason guards; safe
   error mapping (no key fragments — test this). `countTokens` estimate endpoint or
   inline before commit.
4. `src/lib/ai/`: prompt (extract MCQs incl. bohupodi romanItems + LaTeX stems +
   tags; NEVER invent an answer silently — set confidence), chunking iterator,
   **numeral normalization** ০-৯→0-9 (D15), Zod validation of every chunk.
5. **Review screen** (`src/app/(editor)/import/review/page.tsx`): staging list —
   per-item accept/edit/discard; editable stem (with live KaTeX preview for latex),
   options, correct flag, explanation, tags; **AI-inferred answers styled `--warning`,
   must-confirm before merge** (D10); "Add N questions" → merge into deck.
6. **Deck editor — minimal** (`src/app/(editor)/deck/[id]/page.tsx`): question list
   (select/edit/delete/duplicate — dnd reorder is Phase 3), per-question form,
   live `SlideStage` preview beside it. Zustand+Immer store.
7. `src/lib/export/katex-raster.ts` + `pptx.ts`: hybrid PPTX (D3–D6) — native
   `addText` with resolved sizes + KaTeX PNGs via `addImage` at coords; speaker notes
   = answer + explanation + raw LaTeX; `LAYOUT_16x9`. Also title-slide toggle if the
   template has one.
8. Paste-text input page/dialog feeding `/api/extract` with chunk progress UI.
9. **Key-hygiene test** + **AI-spine acceptance test** (plan.md §8), incl. PPTX
   opened in PowerPoint.
10. Save verified Gemini API excerpts → `context/library-docs-gemini.md`.

Files: settings, `src/lib/ai/*`, `src/app/api/extract/route.ts`, review page, deck
editor minimal, `src/lib/export/{pptx,katex-raster}.ts`, input UI.
**Done-when:** full acceptance in plan.md §8 (items 1–5) + key hygiene + persistence
round-trip; unit tests for normalization/validation; build clean.
**Commit:** `feat: phase 2 — AI spine: gemini extract, review, deck editor, hybrid pptx`.

---

## Phase 3 — Editor depth + manual mode (branch: `feat/phase-3-editor-manual`)

**Goal:** the offline-capable authoring path and a production-grade editor.
**Why:** manual mode is the zero-API fallback (and works offline); editor polish is
where daily usability lives.

Tasks:
1. dnd-kit sortable question list (keyboard sensor), multi-select, bulk
   duplicate/delete.
2. Full per-question form: 3 types (add **passage** type now: shared stem group),
   stemType picker, image upload (→ `imageDataUrl`), 2–6 options add/remove,
   explanation, tags editor (examLevel/board/subject/chapter/year/difficulty/source).
3. **Bulk-paste parser** `src/lib/parse/plain-text.ts`: Bangla-aware regex over
   `1. stem / A) opt / ক) opt / * or Ans: C or উত্তর: ২`; numeral normalization;
   bohupodi detection (i/ii/iii lines → romanItems); returns questions + per-item
   errors. Vitest fixture set of messy real formats. Paste box UI → parse preview →
   commit. No API anywhere in this path.
4. **CSV import** `src/lib/parse/csv.ts`: fixed header
   `stem,type,A,B,C,D,E,F,correct,explanation,examLevel,board,subject,chapter,year,difficulty`;
   per-row errors to the validation panel; downloadable example CSV.
5. **Validation panel**: missing correct answer, duplicate options, over-long stems
   (vs. template fit), numeral mismatches — click-to-jump. Live.
6. Deck settings panel: pick BrandKit, pick template, inline token tweaks
   (accent/logo/footer/watermark) with live preview. D7 (token-swap, no drag canvas).
7. Offline check: disable network → bulk-paste 10 MCQs → slides → PNG/PPTX works.

**Done-when:** manual path acceptance (plan.md §8 persistence + offline flow);
parser tests green; build clean.
**Commit:** `feat: phase 3 — full editor, bulk-paste parser, csv import, validation`.

---

## Phase 4 — Export breadth (branch: `feat/phase-4-export`)

**Goal:** ratios, answer-key slides, ZIP, PDF, export dialog.
**Why:** the spine shipped 16:9 only; social/print formats and classroom answer keys
are the remaining export surface.

Tasks:
1. Aspect-ratio variants in template schema usage: 1:1, 4:5, 9:16 canvases; export
   dialog warns when the active template lacks the chosen variant + one-click
   **"seed from 16:9"** (D12). Seed = copy layout, keep coords (user adjusts after).
2. **Answer-key slides**: `answerKeyList` repeater element + pagination in
   `build-slides` (D13); template toggle; `answerKey` layout for class-mode-bangla.
3. ZIP export via JSZip (`01_q.png`, `01_ans.png`, …; filename pattern setting).
4. PDF export (image-per-page from the PNG pipeline).
5. Export dialog: format, ratio (PNG only), slide-kinds to include (questions /
   answers / title / answer-key), filename pattern, determinate progress (80 renders
   for 40 questions).
6. Ratio acceptance: export same deck at 1:1 and 9:16 — no clipped text, no overflow
   (autofit handles; visually verify).

**Done-when:** ratio + answer-key + ZIP/PDF all pass on a 10-question deck; build clean.
**Commit:** `feat: phase 4 — aspect ratios, answer-key slides, zip/pdf, export dialog`.

---

## Phase 5 — Template management (branch: `feat/phase-5-templates`)

**Goal:** token-swap studio + more built-ins. **No drag-canvas editor (D7).**
**Why:** branding is the future SaaS moat; token-swap delivers it at low cost.

Tasks:
1. Template studio: clone a built-in (built-ins are read-only; editing forks), edit
   tokens (colors, fonts, logo slot, padding, optional slots) with live preview,
   save as user template, rename/delete, export/import template JSON.
2. Per-ratio variant tabs in the studio; "copy from 16:9" seeding.
3. Two more built-ins: `standard-grid` (2×2 options) and `social-square` (1:1/4:5
   first), both Bangla+LaTeX capable, all with answer + answerKey layouts.
4. Update `ui-registry.md` with studio patterns.

**Done-when:** fork class-mode → retokenize → re-export PPTX reflects new brand;
template JSON round-trips; build clean.
**Commit:** `feat: phase 5 — template studio, variants, standard-grid + social-square`.

---

## Phase 6 — SaaS seam (LATER — not v1; plan.md §10)

Supabase auth+RLS, Org/BrandKit/shared-QuestionBank promotion, Playwright/Browserless
HD export worker, OpenRouter adapter, MP4. Requires a fresh `/architect` session with
the user before starting. Do not pre-build.

---

## Standing rules for every phase

- `/architect` before, `/review` after, then commit, then `/remember save`.
- `npm run build` clean is part of done, not an afterthought.
- Update `progress-tracker.md` (per task) and `ui-registry.md` (per UI component).
- New dependency? Stop — needs user approval (`library-docs.md` is the approved list).
- A locked decision seems wrong? Stop and ask. Don't improvise.
