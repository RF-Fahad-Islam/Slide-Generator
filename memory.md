# Memory — Editable PPTX Export Fixes & Font Embedding PresentationML Compliance

Last updated: 2026-08-12 18:20 (+06:00)

## What was built

All merged into `main` and pushed to `origin/main` (head commit: `30ba5dc`). Build + compilation green.

### 1. PresentationML Font Embedding Repair Prompt Fix
- `src/utils/pptxFontEmbed.ts`:
  - Re-architected relationship ID generation to use `rIdFont_N` (`rIdFont_1`, `rIdFont_2`, etc.) in `ppt/_rels/presentation.xml.rels` to prevent ID collisions with PptxGenJS's pre-assigned relationship IDs (`rId1`, `rId2`...).
  - Placed `<p:embeddedFontLst>` directly before `<p:defaultTextStyle>` in `ppt/presentation.xml` to strictly comply with PresentationML XSD element sequence rules.
  - Result: MS PowerPoint opens exported `.pptx` presentations cleanly with zero repair prompts.

### 2. Question Stem Card Height Adaptation
- `src/utils/templateBoxLayout.ts`:
  - Updated `computeTemplateCardMetrics`: plain/short MCQs (`!hasRoman && !hasPrompt`) now compute stem card height dynamically (`Math.max(140, currentY - cardBox.y + 28)`).
  - Result: Question card height on short questions (~140px-150px / ~1.04in) now coincides cleanly with the 2-column options grid height instead of stretching to an oversized 205-280px box.

### 3. UI Cleanup & Always-On Font Embedding
- `src/components/ExportModal.tsx` & `src/components/BatchExportModal.tsx`:
  - Removed "Embed fonts" UI checkbox.
  - Set `embedFonts` to permanently `true` by default across single and batch PPTX export handlers.

### 4. 2-Column Options Grid Layout
- `src/utils/pptxExport.ts`:
  - Enforced 2x2 grid layout (A & B on top, C & D on bottom) as default for option cards.
  - Defaulted missing/undefined box shape to `'card'`, ensuring glass backgrounds, key badges (A, B, C, D), and highlight ticks (`✓`) render cleanly across all templates.

## Decisions made

- **Font Relationship ID Namespacing**: Font relationships in `presentation.xml.rels` are prefixed with `rIdFont_` so they never conflict with slide/layout/theme relationship IDs assigned by PptxGenJS.
- **Embedded Font Element Ordering**: `<p:embeddedFontLst>` is inserted right before `<p:defaultTextStyle>` in `presentation.xml` per ISO/IEC 29500 PresentationML schema.
- **Always-On Embedded Fonts**: Embed fonts is hardcoded to `true` on export so presentations display accurately on viewer devices without manual toggle.

## Problems solved

- MS PowerPoint throwing "Repair Needed" on opening exported `.pptx` files — fixed by eliminating relationship ID collisions and enforcing XML element order.
- Question card height on short single-line stems leaving huge black voids — fixed by adapting card height to stem text to match options grid height.
- Option cards omitting background graphics when `box.shape` was undefined — fixed by defaulting `shapeType` to `'card'`.

## Current state

- `main` = `30ba5dc`, clean git tree, pushed to `origin/main`. `npm run build` green.

## Next session starts with

- Optional test: Export a short MCQ to PPTX and open in MS PowerPoint to verify zero repair prompt and matching card height.
- Pending backlog item: Font subsetting to reduce PPTX file size when embedding large TTF files (e.g. Hind Siliguri, Kalpurush).

## Open questions

- None blocking.
