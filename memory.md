# Memory — Local Big-Document AI Ingestion + Live Streaming (OCR-first Bangla)

Last updated: 2026-08-06

## What was built

**This session — committed on `feat/ingestion-local-stream` as `d794f41`, merged to `main` as merge `72110ad`** (after a plan-review pass + fix round). All committed and green.

**Post-merge follow-up (2026-08-06):** (1) `GlobalSettings.tsx` de-nested — the wrapping mega-card removed; now a header row + four flat sections (Default Deck Name / Default Slide Template grid / Default Question Numbering + App Shell Theme side-by-side / footer note), still auto-saving via `update()`. (2) Slide Studio toolbar rebuilt as a **compact 2-row strip** (`App.tsx` `data-tour="studio-toolbar"`): ROW 1 = View All Slides + slide name/stem, plus **Theme toggle · Deck Settings · Download · Prev/Next**; ROW 2 (`border-t`) = Font selector (now always visible) · Apply Slide Design to All · Templates · Answer Reveal · Edit Text Boxes. Labels icon-only below `2xl` (tooltips), so both rows fit one physical line at laptop widths (171px vs 272px at 1366×768). (3) **Deck Settings stays the committed modal** — the full-page/DeckSettingsPage experiment was abandoned and reverted; the modal preview is strict 16:9 (`aspect-[16/9]`, width-scaled). Verified headless Chrome (strip rows, modal open/live-edit/Apply/Cancel-confirm/Classroom-View, flattened settings); `tsc --noEmit` + `vite build` green.

- **`src/server/lib/` (new server-side ingestion pipeline, bundled into `dist/server.cjs`):**
  - `extract-text.ts` — local PDF/DOCX/TXT text extraction. `pdf-parse` **v2** (new API: `new PDFParse({ data })` → `getText()`/`getScreenshot()`/`destroy()`, bundled `@napi-rs/canvas` prebuilt native) + `mammoth` (`extractRawText`). Bangla quality gate: PDF text layer trusted only when clean Unicode Bangla (U+0980–09FF ratio ≥ 0.3 AND ≥ 100 non-space chars); otherwise treated as scanned/legacy-Bijoy and routed to vision OCR. Legacy `.doc` throws a clear "save as .docx" error.
  - `rasterize.ts` — server-side PDF page rasterization via `getScreenshot({ scale: 2 })`.
  - `ocr.ts` — high-accuracy Bangla OCR system prompt (conjuncts, ০-৯ numerals preserved, LaTeX, multi-column order). Hybrid batching: per-page up to 10 pages, then 3-page batches. **One result per batch** (C-L2a fix — batches no longer emit per-page duplicated text). Gemini (`abortSignal`) + OpenRouter both supported.
  - `chunk.ts` — Bangla-aware token estimate (`bangla/2 + other/4`, target ~4000).
  - `sanitize.ts` — shared MCQ sanitize moved out of `server.ts`: `normalizeBanglaNumerals` (০-৯→0-9, D15 now actually applied), per-item skip with reasons, answer-key matching.
  - `ai-stream.ts` — `streamParseMCQs()` orchestrator emitting NDJSON `StreamEvent`s. **C-L3a fix:** malformed/truncated structured JSON now **throws** → surfaces as `chunk_error` (no more silent empty `mcqs`). Sanitize skip reasons now shipped on the `mcqs` event (`skipReasons`). Abort: checks `signal.aborted` between chunks; Gemini passes `abortSignal`.
- **`server.ts`** — `/api/ai/parse-mcqs` rewritten: `Content-Type: application/x-ndjson`, `res.flushHeaders()`, `X-Accel-Buffering: no`, **abort-on-disconnect** via `res.on('close')` → AbortController (checks `res.writableEnded`), `wroteError` guard suppresses post-error events, key-redaction regex on all error paths. Events: `stage1_start` / `stage1_page` (pageNumber is a `number[]` for batches) / `stage1_done` / `chunk_start` / `mcqs` / `chunk_error` / `done` / `error`.
- **`src/components/AIUploader.tsx`** — rewritten as a `ReadableStream` NDJSON consumer: live progress bar (OCR pages done → chunk counter), growing MCQ list (live append, key = `mcq.id`), Cancel button (AbortController), scanned-doc warning banner, "Items Skipped (N)" card with per-chunk reasons, "Inspect Stage 1 Extracted Text" toggle, `stage1_page` label `[Page N]` / `[Pages 1, 2, 3]`. Uses `isAppLight` ternary pattern exclusively (no `dark:` prefix).
- **Docs updated:** `context/library-docs.md` (pdf-parse v2 + mammoth sections), `context/progress-tracker.md` (feature row), `context/ui-registry.md` (AIUploader live-streaming section).

## Decisions made

- **OCR-first for Bangla (user priority):** vision OCR is the primary path, not the fallback. PDFs with scanned or legacy-Bijoy text layers + image uploads → per-page vision OCR. Local text extraction only when the PDF already has clean Unicode Bangla.
- **Hybrid page batching:** per-page vision calls up to 10 pages, then 3-page batches (accuracy on the front pages, speed on long bundles).
- **NDJSON over a single POST** (not SSE) — one JSON object per line, consumed via `fetch` + `ReadableStream`. Kept the existing single-endpoint shape.
- **Token-estimate chunking** sequential (~4000 tokens), no parallelism (rate-limit safety).
- **Scan bundles stay capped** at `express.json` 50mb (≈37MB base64) — known limit, not raised this session.
- **Untrusted text layers are OCR'd:** an English-only PDF (no Bangla chars) also routes to vision — the price of "clean Unicode Bangla" being the only local-extraction shortcut.

## Problems solved

- **"Can't process big docs / no live output"** — old flow base64'd the whole file to Gemini in one call, returned one JSON at the end. Now: local extraction where possible, per-page OCR for scans, chunked structuring, everything streamed live.
- **Bangla OCR accuracy** — dedicated OCR system prompt (conjuncts, numerals, LaTeX, column order) on small per-page inputs instead of one huge vision call.
- **Batched OCR duplicated MCQs** (C-L2a) — `ocrPages` returned combined batch text once **per page** in the batch → same MCQs emitted N times. Fixed: one `OcrBatchResult` per batch.
- **Truncated JSON silently dropped questions** (C-L3a) — `JSON.parse` failure returned `[]` and emitted a benign empty `mcqs`. Now throws → `chunk_error` so the client shows `failedChunks`.
- **`normalizeBanglaNumerals` was declared but never applied** (D15) — now applied in the shared sanitize.
- **PowerShell test-harness UTF-8 mangling** — `Invoke-WebRequest` + `Set-Content` default encodings turn Bangla into `?`. Test clients must be Node `fetch` with UTF-8 bodies (verified Bangla end-to-end: stems, options, Bangla keys, correct answers all preserved).

## Current state

- On `main`, HEAD = `72110ad` (merge of `d794f41`). My feature is committed and green (`tsc --noEmit` 0 errors, `vite build` + esbuild server bundle clean). Live-verified: EN + Bangla text extraction (2 MCQs each), per-chunk error on bad key, vision routing + rasterize + OCR.
- **A parallel session is actively working in this repo** (settings-restructure continued: `App.tsx`, `MyDecksView.tsx`, `OnboardingTour.tsx`, `SidebarNav.tsx`, `SlideDecksHome.tsx` modified, new `DeckSettingsPage.tsx`). They fixed the `GlobalDefaults.defaultTemplateId` type errors from earlier. **Do not pop the stash** — `stash@{0}` holds their earlier WIP snapshot and they are still working.
- Known non-blocking: html-to-image `SecurityError` for cross-origin Google Fonts/KaTeX CSS during raster exports (pre-existing).

## Next session starts with

1. **Browser-verify (manual, agent cannot):** upload a real scanned Bangla board-exam PDF → confirm per-page OCR progress, live MCQ stream, Bangla accuracy; upload a text-layer Bangla PDF → confirm local shortcut (no OCR); test Cancel mid-run stops the server loop; confirm "Items Skipped" reasons render.
2. Re-check repo state — the parallel settings-restructure session may have merged or rewritten things; reconcile before starting new work.
3. Remaining backlog (unchanged): bundle self-hosted Bengali woff2 fonts; declarative `Element[]` renderer refactor; interactive template studio JSON import/export.

## Open questions

- None blocking for this feature. Highest-risk unverified: real-world scanned-Bangla OCR accuracy (page-by-page) in the browser, and whether `express.json` 50mb needs raising for very large scans.
