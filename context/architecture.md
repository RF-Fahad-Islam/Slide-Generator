# Architecture

> The central constraint and every structural rule. Decisions referenced as D1–D16
> are locked in `plan.md` §4 — do not re-open them.

## 1. The central constraint: one layout, two renderers

A template must produce a pixel-faithful PNG **and** an editable PPTX from the SAME
definition. That rules out "design in CSS, screenshot into PowerPoint" (PPTX text must
be editable — D3) and rules out free-form HTML/CSS templates (pptxgenjs can't consume
them). Solution: a **declarative template descriptor** with a deliberately restricted
element vocabulary that BOTH renderers implement.

```
                ┌─────────────────────────────────────────────┐
                │          TEMPLATE DESCRIPTOR (JSON)           │
                │  elements: x,y,w,h ∈ 0..1 + style + binding   │
                │  + tokens.json (colors, fonts, spacing)       │
                └───────┬─────────────────────────┬────────────┘
                        │                         │
              ┌─────────▼─────────┐     ┌─────────▼─────────────────┐
              │ DOM renderer       │     │ pptxgenjs renderer        │
              │ SlideStage.tsx     │     │ src/lib/export/pptx.ts    │
              │ → preview          │     │ → native text boxes       │
              │ → PNG (html-to-    │     │   (editable Bangla, D3)   │
              │   image, D2)       │     │ → KaTeX PNGs via addImage │
              └───────────────────┘     │   at element coords (D5)  │
                                        └───────────────────────────┘
        ▲ BOTH receive FIXED per-slide font sizes from build-slides.ts (D6) ▲
```

## 2. Element vocabulary (the ONLY allowed types)

| Element | DOM rendering | PPTX rendering |
|---|---|---|
| `text` (bound to a data field) | absolutely-positioned `<div>` | `slide.addText` |
| `optionsList` (repeater over options) | flex/grid of text boxes | one `addText` per option |
| `rect` / `line` | `<div>` with border/fill | `slide.addShape` |
| `image` (logo, question figure) | `<img>` | `slide.addImage` |
| `writingArea` | outlined blank box | `addShape` outline |
| `answerKeyList` (repeater Q#→letter) | table-like rows | one `addText` per row |

**Rule:** any new element type or style property must be implemented in BOTH renderers
in the same PR, or it is rejected at the Zod schema level. This is the parity rule —
the project's #1 maintenance risk (plan.md §9.2).

## 3. Coordinate system

- All element geometry is **normalized**: `x, y, w, h ∈ 0..1` fractions of the canvas.
- DOM renderer: logical canvas 1920×1080 (16:9), wrapped in `transform: scale()` so
  preview/editor/export share one code path at any display size.
- PPTX renderer: `LAYOUT_16x9` = 10in × 5.625in; multiply normalized coords by those.
- Other ratios (Phase 4): 1080×1080, 1080×1350, 1080×1920 logical canvases.
- **No rescaling logic in either renderer** — normalized coords only.

## 4. Resolve-once autofit (D6) — read carefully

Text fit is computed **once**, in `src/lib/render/build-slides.ts`, per slide instance:

1. Lay out the slide's bound content against the logical canvas (measure via canvas
   `measureText` or an offscreen DOM node with the real Bengali/math fonts loaded).
2. If content overflows its element box, shrink the font size stepwise until it fits
   (min size floor from template tokens).
3. Emit the slide with **fixed, resolved font sizes** on every text-bearing element.

Both renderers then just draw what they're given. **Never** call pptxgenjs
`fit: 'shrink'` and never re-measure in the DOM renderer. One algorithm, one result,
zero drift.

## 5. Slide expansion — `build-slides.ts`: `Deck → Slide[]`

Per question, emit:
- a `question` slide (stem, options, source/tags per template bindings), and
- an `answer` slide (same layout family; correct option styled with BrandKit accent;
  explanation element present).

Template-level toggles: optional `title` slide (bound `quiz.title`, brand) and
optional trailing `answerKey` slides via the `answerKeyList` repeater — **paginated**:
rows-per-slide is derived from the repeater element's height ÷ row height; emit as many
answer-key slides as needed (D13).

A `Slide` = `{ kind: slideKind, questionRef?, resolvedElements: Element[] }` where
`resolvedElements` already carry fixed font sizes and bound data — renderers are dumb.

## 6. LaTeX and Bangla handling (the priority feature)

**Bangla (editable, D3):**
- Web: bundled self-hosted woff2 (Hind Siliguri + Noto Sans Bengali). `await
  document.fonts.ready` before ANY rasterization (D14) — otherwise blank-glyph exports.
- PPTX: native `addText` with the BrandKit's `pptxFallbackFont` (a widely installed
  Bengali font face). Text stays editable in PowerPoint. Viewer-font caveat is
  documented in plan.md §9.1.

**LaTeX (typeset + source preserved, D4/D5):**
- Editor/preview: KaTeX `renderToString` into the stem element (`throwOnError: false`).
- PPTX: render the KaTeX DOM node → `html-to-image` PNG (client-side) →
  `slide.addImage` at the stem element's normalized coords × slide inches.
- The raw LaTeX source is ALSO written into the slide's speaker notes alongside the
  correct answer + explanation. Never lost, re-editable in the tool.

## 7. Data flow — the AI spine (Phase 2, built before manual mode)

```
paste text ──► /api/extract (BYOK header, route handler, Node runtime)
             ──► @google/genai, structured output (responseSchema), streaming,
                 chunked ~15 q/call, countTokens estimate first
             ──► Zod validation + Bangla numeral normalization (D15)
             ──► REVIEW SCREEN (accept/edit/discard; AI-inferred answers
                 confidence-flagged, must-confirm — D10)
             ──► Deck editor ──► build-slides ──► preview / PNG / PPTX
```

PDF upload comes later (Gemini Files API / inline base64; multimodal covers scans —
no Tesseract in v1). Paste-text is the first working input.

## 8. Storage (D1)

- **v1:** IndexedDB via `idb-keyval`, wrapped in `src/lib/storage/` behind a small
  interface (`getDeck/putDeck/listDecks/deleteDeck`, same for BrandKits/Templates).
  `schemaVersion` field + migration switch on every stored object.
- Whole-deck JSON import/export (round-trip fidelity is an acceptance test).
- **Later:** Supabase implementation of the same interface + `org_id` columns. Schemas
  are already tenant-shaped; the swap is additive. Do NOT build Supabase in v1.

## 9. App/module layout (create in Phase 0–2)

```
src/
  app/
    (editor)/deck/[id]/page.tsx        # deck editor (Phase 2 minimal, Phase 3 full)
    (editor)/import/review/page.tsx    # AI review screen (Phase 2)
    settings/page.tsx                  # BYOK key + BrandKits (Phase 2)
    api/extract/route.ts               # Gemini BYOK proxy (Phase 2)
  lib/
    schemas/        # Zod: deck.ts, brand-kit.ts, template.ts (single source of truth)
    render/         # build-slides.ts (Deck→Slide[], resolve-once autofit)
    export/         # pptx.ts, png.ts, katex-raster.ts
    storage/        # IndexedDB impl behind interface
    templates/builtin/  # class-mode-bangla (Phase 1), others Phase 5
    parse/          # plain-text.ts, csv.ts (Phase 3)
    ai/             # gemini client, prompts, chunking, normalization
  components/
    render/SlideStage.tsx             # the ONE DOM renderer
    ui/                               # shadcn components
```

Pure logic lives in `src/lib/**` (no React). React only in `src/components/**` and
`src/app/**`. This keeps render/export/parse logic unit-testable with Vitest.

## 10. Invariants (never violate)

1. Both renderers consume the same resolved `Slide[]`; neither re-fits text (D6).
2. No raw hex in app components (semantic tokens); slide brand colors are BrandKit
   runtime data via CSS custom properties (D16).
3. `document.fonts.ready` before any rasterization (D14).
4. The Gemini key is never stored server-side, never logged, stripped from errors (see
   `auth-plan.md`).
5. AI output always passes Zod validation + numeral normalization before touching a Deck.
6. Exactly one correct option per question — enforced by schema and editor validation.
7. Every stored object carries `schemaVersion`.
