# UI Registry

> CLAUDE.md mandates updating this after EVERY feature (run `/imprint` after building
> a UI component). Purpose: every new component matches what came before.

## Entry format (copy this block per component)

```
### <ComponentName> — src/components/<path>
- Purpose: one line.
- Built: Phase N, date.
- Tokens used: bg-*, text-*, border-* (semantic only).
- Patterns: layout approach, keyboard handling, states (empty/loading/error).
- Reuse notes: when to use vs. not; variants.
```

## Established patterns (fill in as components land)

| Pattern | Decision | First used in |
|---|---|---|
| App shell | — pending Phase 2 — | |
| Lists (questions, review) | — pending — | |
| Dialogs | — pending — | |
| Forms | — pending — | |
| Feedback (confidence flags) | `--warning` + must-confirm (D10) | planned: review screen |
| Validation panel | persistent list + jump-to links | planned: deck editor |
| Progress | determinate bar + label | planned: export dialog |

## Registered components

### `HeaderNavbar` — `src/components/HeaderNavbar.tsx`
- Purpose: Main application top navigation bar with tab selector, sample deck loader, app theme toggle, and export trigger.
- Built: 2026-08-05.
- Tokens used: `bg-slate-900`, `text-slate-100`, `border-slate-800`, `text-amber-500`.

### `SlideCanvas` — `src/components/SlideCanvas.tsx`
- Purpose: Primary interactive 1920x1080 slide renderer with automatic aspect scaling (`ResizeObserver`), KaTeX rendering, and visual editing overlays.
- Built: 2026-08-05.
- Tokens used: `bg-slate-950`, `border-slate-800`, `text-slate-100`.

### `ManualEditor` — `src/components/ManualEditor.tsx`
- Purpose: Question authoring form supporting standard MCQs, bohupodi statement questions, and passage stems.
- Built: 2026-08-05.

### `AIUploader` — `src/components/AIUploader.tsx`
- Purpose: Gemini AI question ingestion panel supporting raw text paste and PDF/image file uploads.
- Built: 2026-08-05.

### `DeckManager` — `src/components/DeckManager.tsx`
- Purpose: Reorderable question deck list manager with item search, delete, and duplicate controls.
- Built: 2026-08-05.

### `DeckSettings` — `src/components/DeckSettings.tsx`
- Purpose: Branding, typography, background overlay, logo placement, and header/footer customization drawer.
- Built: 2026-08-05.

### `ExportModal` — `src/components/ExportModal.tsx`
- Purpose: Dialog for exporting decks to 16:9 PPTX presentations, PNG slide images, and PDF document formats.
- Built: 2026-08-05.

### `QuestionBankView` — `src/components/QuestionBankView.tsx`
- Purpose: Local question bank repository view with tagging, subject filter, search, and bulk deck import.
- Built: 2026-08-05.

### `SocialPostGenerator` — `src/components/SocialPostGenerator.tsx`
- Purpose: Multi-aspect ratio social media post slide builder for 1:1, 4:5, 9:16, and 16:9 social formats.
- Built: 2026-08-05.

### `ValidationPanel` — `src/components/ValidationPanel.tsx`
- Purpose: Live question audit panel detecting missing correct options, duplicate choices, and empty question stems.
- Built: 2026-08-05.

### `MathText` — `src/components/MathText.tsx`
- Purpose: KaTeX inline formula parser component converting LaTeX delimiters `\(...\)` and `$...$` to math typography.
- Built: 2026-08-05.

---

## Planned components

| Component | Phase | Notes |
|---|---|---|
| Declarative `SlideStage` | 1 | Refactor renderer to declarative `Element[]` descriptor schema |
| Drag-and-drop sortable | 3 | Add `dnd-kit` keyboard/touch sortable question list |
| ZIP Export Progress Dialog | 4 | Determinate progress dialog for multi-slide JSZip PNG package |

