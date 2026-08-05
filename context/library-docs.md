# Library Docs — project-specific rules

> CLAUDE.md: before using ANY third-party library for the first time, load its
> installed skill (if one exists), then read this file. Do not add libraries not
> listed here without user approval.

## Approved dependency list (v1)

| Package | Purpose | Phase |
|---|---|---|
| `next`, `react`, `react-dom`, `typescript` | framework | 0 |
| `tailwindcss`, `shadcn/ui` (+ its deps) | app chrome | 0 |
| `zod` | schemas, validation | 0 |
| `zustand` + `immer` | editor state | 2 |
| `katex` (+ its CSS) | LaTeX stems | 1 |
| `pptxgenjs` | PPTX export | 2 |
| `html-to-image` | PNG export + KaTeX raster | 1–2 |
| `jszip` | ZIP batch export | 4 |
| `@google/genai` | Gemini SDK (route handler) | 2 |
| `idb-keyval` | IndexedDB storage | 1 |
| `@dnd-kit/core` + `@dnd-kit/sortable` | question reorder | 3 |
| `vitest` | unit tests | 2 |

**Explicitly NOT installed in v1:** `react-moveable` (drag-canvas editor deferred, D7),
Supabase packages (D1), Playwright (D2), `pdfjs-dist` (PDF input is post-spine), any
OCR package.

## next (App Router)

**This is NOT the Next.js from training data.** Before writing any route, page, or
component, read the relevant guide in `node_modules/next/dist/docs/` and heed
deprecation notices. Reference: `docs/nextjs-llms.txt`. The API route uses
`runtime = 'nodejs'` (needed by `@google/genai` streaming + large bodies).

## @google/genai (Gemini) — Phase 2

- Used ONLY inside `src/app/api/extract/route.ts` (server). Client supplies the key
  via `x-gemini-key` header; construct the client per request (see `auth-plan.md`).
- **Model ID:** verify against Google's current docs at build time (IDs drift — risk
  noted in plan.md §9.3). Store in ONE constants file (`src/lib/ai/constants.ts`),
  never hardcode across files. Default candidate: the current Pro-tier model; a
  Flash-tier fallback constant for cheap runs.
- **Structured output:** use the SDK's JSON-schema response support (`responseSchema`
  / structured output config) with a schema generated from our Zod `Question[]` shape.
  Never free-form-parse model prose.
- **Streaming:** use streaming for long extractions; a 40-question extraction is a
  long generation and non-streaming risks timeouts. Aggregate stream → final object.
- **Guard finish reasons explicitly:** refusal/safety, max_tokens, empty candidates —
  map each to a user-safe message. Never assume `candidates[0]` exists.
- **Chunking:** ~15 questions per call; the client iterates chunks sequentially and
  stitches results into the review staging list. Show `countTokens` cost estimate
  before the user commits.
- **Numeral normalization (D15):** after parsing, normalize ০-৯ → 0-9 in answer keys,
  labels, and numeric fields before Zod validation.
- **TODO at Phase 2:** paste verified API excerpts (structured output config shape,
  streaming usage, countTokens, model ID) into `context/library-docs-gemini.md` so
  later sessions don't work from memory.

## katex — Phase 1

- `renderToString(latex, { throwOnError: false, strict: false })`. Broken formulas
  render the raw source + a validation warning (never crash).
- KaTeX CSS must be loaded wherever stems render (preview AND the offscreen export
  container).
- For PPTX: render the stem's KaTeX DOM node → `html-to-image` PNG → `addImage` (D5).
  Raw LaTeX source goes to speaker notes (D4).

## html-to-image — Phase 1/2

- `await document.fonts.ready` BEFORE every capture (D14) — Bangla conjuncts produce
  blank glyphs otherwise.
- Render into an offscreen container at the logical canvas size (1920×1080 for 16:9),
  `toPng(node, { pixelRatio })` for target resolution.
- Bengali fonts are bundled self-hosted woff2 — never rely on a CDN at capture time.

## pptxgenjs — Phase 2

- `LAYOUT_16x9` (10in × 5.625in). Normalized coords × those dimensions.
- Native `addText` for Bangla/labels/options (editable — D3) with BrandKit
  `pptxFallbackFont`; **never** `fit: 'shrink'` — sizes arrive resolved from
  `build-slides` (D6).
- `addImage` for KaTeX rasters and question figures at element coords.
- Speaker notes: correct answer + explanation + raw LaTeX source.
- Parity rule: any new element/style must be implemented here AND in `SlideStage`
  in the same change (`architecture.md` §2).
- **Acceptance:** text selectable/editable in PowerPoint; conjuncts render given a
  Bengali-capable viewer font (documented caveat, plan.md §9.1).

## idb-keyval — Phase 1

- All persistence goes through `src/lib/storage/` interface functions — UI never
  touches `idb-keyval` directly (this is the Supabase swap seam, D1).
- Every stored object: `schemaVersion` + migration switch on read.

## zustand + immer — Phase 2

- One store per editor surface (deck editor, review staging). Immer for mutations.
- No server state in zustand; async results enter via actions after Zod validation.

## @dnd-kit — Phase 3

- Sortable question list with keyboard sensor (accessibility requirement, ui-rules).

## shadcn/ui + tailwind — Phase 0

- Load the `/shadcn` skill before adding/fixing/styling components.
- Semantic tokens only (`ui-tokens.md`); extend the theme with `--success`,
  `--warning`, `--info` for the confidence-flag system (D10).

## zod

- Schemas in `src/lib/schemas/`; types via `z.infer`. Parse ALL external data at
  boundaries. Exactly-one-correct-option enforced via `.refine()` on Question.

## jszip — Phase 4

- Batch PNG export: `01_q.png`, `01_ans.png`, … naming pattern from the export dialog.
