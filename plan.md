# MCQ Slide Generator — Master Plan

> **Status:** APPROVED. This is the single source of truth for scope and decisions.
> Worker agents: do not re-open any decision in the Decision Log. If a decision
> appears to conflict with reality, stop and ask — do not improvise a new direction.
> Phase-by-phase executable tasks live in `context/build-plan.md`. This file is the "why";
> `context/build-plan.md` is the "what, step by step".

---

## 1. Product in one paragraph

A **personal, local-first tool** that turns MCQs into presentation-ready slides for
**Bangladeshi edtech (SSC / HSC / university admission)**. The primary input path is
**AI mode**: paste raw text (later: upload PDF) → **Gemini** extracts structured,
fully-editable MCQs (Bangla + LaTeX, three question types, board/exam tags) → a review
screen → an editor → export as **PNG** and **editable-hybrid PPTX**. A secondary
**manual mode** (offline bulk-paste parser, CSV import, hand entry) needs no API.
SaaS (auth, organizations, shared question bank, HD export) is a **later layer** on
the same render pipeline — v1 builds none of it.

## 2. Who it is for

- **v1:** one user (the author). Local-first, no accounts, no server-side persistence.
- **Later (not v1):** coaching centers as tenants (Organization → BrandKits, shared
  QuestionBank, Decks). The v1 schema is already tenant-shaped (`org_id` can be added
  without changing any field), so the SaaS migration is additive, not a rewrite.

## 3. Domain vocabulary (use these exact terms everywhere)

| Term | Meaning |
|---|---|
| **Deck** | A set of questions + a BrandKit + a Template → exports. The v1 unit of work. |
| **BrandKit** | Reusable visual identity: accent/background/surface/text colors, logo, footer, watermark, font stack. Local in v1. |
| **Template** | A **declarative layout descriptor** (constrained element vocabulary + normalized coords + bindings) **plus `tokens.json`**. NOT free-form HTML/CSS — the same descriptor feeds both renderers. |
| **Variant** | One layout set per aspect ratio inside a template. v1 ships 16:9; more ratios in Phase 4. |
| **slideKind** | `title \| question \| answer \| answerKey`. Every question produces a `question` slide and an `answer` (answer-reveal) slide. |
| **stemType** | `text \| latex \| image` — how a question stem is rendered (plain text / KaTeX / `<img>`). |
| **Question type** | `plain` (normal MCQ) \| `statement` (bohupodi — roman-numeral statements i/ii/iii, options are combinations) \| `passage` (shared stem across N questions). Spine ships `plain` + `statement`; `passage` in Phase 3. |
| **Tags** | Per-question metadata for the BD edtech domain: `examLevel` (`SSC`/`HSC`/`Admission`), `board` (Dhaka, Chattogram, Rajshahi, …), `subject`, `chapter`, `year`, `difficulty`. `source` free text (e.g. `"চট্টগ্রাম বোর্ড ২০১৭"`) is kept too. Present in v1 so the later shared QuestionBank needs no schema change. |
| **BYOK** | Bring Your Own Key — user pastes their own Gemini API key; it lives in `localStorage`, is sent per-request to our route handler, and is never stored or logged server-side. |

## 4. Decision Log (locked — with rationale)

Each decision lists **why**, so future agents don't re-litigate it.

| # | Decision | Rationale (why) |
|---|---|---|
| D1 | **Personal v1, SaaS later.** No auth, no RLS, no multi-tenancy in v1. IndexedDB persistence behind a `storage/` interface. | The user works alone first. Auth/tenancy is weeks of work that buys a solo user nothing. The interface seam + tenant-shaped schema make the later Supabase swap additive. |
| D2 | **100% client-side export in v1.** PNG via `html-to-image`; PPTX via `pptxgenjs`. No Playwright/server worker. | A server rasterizer exists to guarantee Bangla shaping for *many customers*. For one user it's pure overhead and a second deployable. Deferred to a later "HD export" tier. KaTeX is also rasterized client-side (see D5), so no server is needed at all. |
| D3 | **Bangla = native pptxgenjs text boxes** in PPTX. | The user's #1 priority is *editable* text fields. Native PPTX text is selectable/editable in PowerPoint. Caveat: conjunct shaping depends on the viewer's installed Bengali font — accepted, documented, mitigated by setting a common Bengali font face. |
| D4 | **LaTeX = typeset KaTeX image on the slide; raw source preserved** in (a) the editor field and (b) the PPTX speaker notes. | Typeset math and PowerPoint-editable math don't coexist cheaply (native OMML needs PPTX XML surgery — rejected for v1). Students must see typeset math; the author re-edits in the tool, which is where editing actually happens. Source in speaker notes means it's never lost. |
| D5 | **KaTeX → PNG client-side** (render one DOM node, `html-to-image`), embed into PPTX via `addImage` at the element's coordinates. | Removes the last reason for a server worker. Keeps v1 fully client-side (D2). |
| D6 | **Autofit is resolved ONCE in the shared pipeline** (`build-slides.ts`), producing fixed font sizes handed to both renderers. Never rely on pptxgenjs `fit:'shrink'` or per-renderer measuring. | Two independent fit algorithms WILL diverge on edge cases (long stems, 6 options). Resolve-once makes both renderers dumb and guarantees parity — this was flagged as the project's #1 maintenance risk. |
| D7 | **Template = descriptor + tokens. v1 editing = token-swap only.** No drag-canvas layout editor in v1. | A full canvas editor is as much work as everything else combined. Token-swap (clone a built-in, change colors/logo/spacing) delivers 90% of the branding value for a fraction of the cost. Full editor is a later paid tier. |
| D8 | **AI = Gemini-first, BYOK.** Structured output via `responseSchema`, streaming, chunked (~15 questions/call), `countTokens` estimate before commit. OpenRouter adapter stubbed, not built. | User's explicit choice. Gemini has structured output + multimodal (scanned PDFs later) + generous free tier for personal use. One provider keeps the spine small; the adapter interface keeps OpenRouter possible. |
| D9 | **First working state = the AI spine** (paste text → MCQs → edit → slides), not manual mode. | User's explicit priority. Acceptable because the renderer (Phase 1) precedes it and the review screen is the safety net for AI errors. Manual mode (Phase 3) then becomes the offline fallback. |
| D10 | **AI-inferred answers are confidence-flagged** (distinct color, must-confirm) and nothing bypasses the review screen. | A wrong answer key published to students is the one failure mode that kills trust in an edtech tool. |
| D11 | **Three question types from the start** (plain, statement/bohupodi, passage); spine ships plain + statement. | The user's real content is Bangla board-exam MCQs, which are heavily bohupodi. Retrofitting a question type later means touching schema, renderer, parser, and AI prompt — painful. Passage is the only one safely deferrable to Phase 3. |
| D12 | **Aspect ratios: PNG 16:9/1:1/4:5/9:16 (Phase 4); PPTX fixed 16:9.** Missing variant → warn + one-click "seed from 16:9". | A 9:16 story card is not a squeezed 16:9 slide; each ratio gets its own variant. v1 spine ships 16:9 only. |
| D13 | **Answer-key slide = real element layout** with an `answerKeyList` repeater binding, **paginated** across as many slides as the row count needs. | Listed as a "toggle" early on but needs a schema home; a 40-question key doesn't fit one slide. |
| D14 | **Bengali fonts bundled self-hosted** (Hind Siliguri + Noto Sans Bengali, woff2); `document.fonts.ready` awaited before ANY rasterization. | Bangla conjuncts (ক্ষ, ন্ত্র) break if capture happens before fonts load — blank-glyph exports. Never fetch fonts from a CDN at runtime. |
| D15 | **Bangla numeral normalization** (০-৯ ↔ 0-9) in the parser, AI output validation, and CSV import. | Bengali source text mixes numeral systems; keys like "উত্তর: ২" must map to option B deterministically. |
| D16 | **App chrome uses semantic design tokens only** (no raw hex in components). **Slide brand colors are runtime data** on the BrandKit, applied via CSS custom properties / inline style on the render stage. | Keeps the "no hardcoded colors" rule without banning the user's slide color picker. Two different things; documented so the rule isn't misread. |

## 5. Architecture summary (details in `context/architecture.md`)

```
                ┌─────────────────────────────────────────────┐
                │              ONE TEMPLATE DESCRIPTOR          │
                │   elements (normalized 0..1 coords) + tokens  │
                └───────┬─────────────────────────┬────────────┘
                        │                         │
              ┌─────────▼─────────┐     ┌─────────▼─────────┐
              │  DOM renderer      │     │  pptxgenjs        │
              │  SlideStage.tsx    │     │  export/pptx.ts   │
              │  (preview + PNG    │     │  native text      │
              │   via html-to-image│     │  + KaTeX PNGs     │
              └───────────────────┘     └───────────────────┘
        Both receive FIXED font sizes from build-slides.ts (resolve-once, D6)
```

- **Storage:** IndexedDB via `idb-keyval`, behind `src/lib/storage/` interface. Supabase later (D1).
- **AI:** `POST /api/extract` (Node runtime) — BYOK header → `@google/genai` → structured output → validated MCQ JSON → review screen.
- **No server persistence. No auth. No telemetry.**

## 6. Data model (Zod = single source of truth)

```ts
Option    { id, label: 'A'|'B'|'C'|'D'|'E'|'F', text, isCorrect }
Question  { id, type: 'plain'|'statement'|'passage',
            stem, stemType: 'text'|'latex'|'image', imageDataUrl?,
            romanItems?: string[],        // statement: i, ii, iii...
            passageId?: string,           // passage: shared stem group
            prompt?,                      // e.g. "নিচের কোনটি সঠিক?"
            options[2..6],                // exactly one isCorrect (validated)
            explanation?, tags: Tags }
Tags      { examLevel: 'SSC'|'HSC'|'Admission',
            board?, subject?, chapter?, year?, difficulty?, source? }
Deck      { id, title, questions[], templateId, brandKitId, createdAt, updatedAt }
BrandKit  { id, name, accent, background, surface, text,
            logoDataUrl?, footer?, watermark?, fontStack, pptxFallbackFont }
Template  { id, name, variants: Record<AspectRatio, Variant>, tokens, fonts, isBuiltIn }
Variant   { slideKinds: { title?: Layout, question: Layout, answer: Layout, answerKey?: Layout } }
Layout    { elements: Element[] }
Element   { id, type, x, y, w, h /* 0..1 */, z, style, binding?,
            optionsListLayout?: 'grid2x2'|'oneColumn'|'twoColumn' }
```

Element types: `text`, `optionsList` (repeater), `rect`, `line`, `image`,
`writingArea`, `answerKeyList` (repeater).

Bindings: `quiz.title`, `question.stem`, `question.prompt`, `question.number`,
`question.image`, `options`, `correctOption`, `question.explanation`,
`question.source`, `brand.logo`, `brand.footer`, `brand.watermark`, `answerKeyList`.

## 7. Phase map (executable detail in `context/build-plan.md`)

| Phase | Deliverable | Gate |
|---|---|---|
| **0** | Repo scaffold, deps, Bengali fonts, context docs (done) | create-next-app clean |
| **1** | One built-in template + DOM renderer + build-slides + IndexedDB | Hardcoded question renders to screen + PNG |
| **2** | **THE AI SPINE** — BYOK settings, `/api/extract`, review screen, PNG + hybrid PPTX export | End-to-end: Bangla bohupodi paste → editable MCQs → correct PNG/PPTX |
| **3** | Editor depth (dnd reorder, full form, image upload) + manual mode (bulk-paste parser, CSV) + validation panel + passage type | Offline: bulk-paste 10 MCQs → slides, no network |
| **4** | Export breadth: ratios + warn/seed, answer-key slides, ZIP, PDF, export dialog | 1:1 and 9:16 exports, no clipped text |
| **5** | Template management: clone/fork, token studio, variant tabs, 2 more built-ins | Fork class-mode, retokenize, re-export |
| **6** | *(Later)* SaaS seam: Supabase auth/RLS, Org + shared QuestionBank, HD export worker, OpenRouter, MP4 | Not v1 |

## 8. Acceptance criteria (the tests that matter)

**AI spine (after Phase 2):**
1. Paste a real Bangla MCQ text containing a bohupodi item and a LaTeX stem.
2. Gemini returns structured JSON with tags + confidence flags.
3. Review screen shows editable Bangla and editable LaTeX source with live KaTeX preview.
4. Generate → PNG: Bangla conjuncts intact, math typeset, layout matches preview.
5. PPTX in PowerPoint: Bangla text selectable/editable; math crisp as image; raw LaTeX in speaker notes; 20 slides for 10 questions; correct option highlighted on every reveal slide.

**Key hygiene:** devtools show the Gemini key only in the outgoing `/api/extract`
request; server logs contain no key material; an invalid-key error contains no key fragment.

**Persistence:** hard-reload survives; export JSON → clear storage → re-import = round-trip fidelity.

**Automated:** Vitest for the bulk-paste parser (messy Bangla fixtures), the
`build-slides` expander, normalized→inches conversion, autofit shrink.

## 9. Known risks (keep visible)

1. **Bangla in native PPTX text** depends on the viewer's machine having a Bengali
   font. KaTeX/image stems are immune (rasterized). Mitigation: set PPTX font face to
   a widely installed Bengali font; document the caveat. If this proves unacceptable
   in practice, the fallback is image-per-slide PPTX (one flag in the exporter, since
   the PNG pipeline already exists) — but that sacrifices D3 editability, so only
   switch with the user's explicit approval.
2. **SlideStage ↔ pptx.ts parity.** Mitigated by D6 (resolve-once) + constrained
   element vocabulary. Every new element type or style property must be implemented
   in BOTH renderers or rejected at the schema level.
3. **Gemini model IDs drift.** Exact model ID is verified at Phase 2 build time from
   Google's docs and stored in one constants file — never hardcoded across the app.

## 10. Explicit non-goals for v1

Accounts, orgs, RLS, shared question bank, server-side export, OpenRouter (stubbed
only), drag-canvas layout editor, MP4 export, OCR via Tesseract (Gemini multimodal
covers scans later), XLSX import, multi-member collaboration, deployment automation
(runs locally via `next dev`; Vercel deploy is trivial but not required for v1).
