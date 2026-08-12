# Memory — Export fidelity: self-hosted fonts, glass badges, PPTX font embedding

Last updated: 2026-08-12

## What was built

All committed on `main`. Latest HEAD = `089acc2` (includes `8697b6d`). Working tree has a parallel feature's uncommitted WIP (see Current state).

### 1. Self-hosted fonts + deterministic font embedding in ALL raster exports (PNG/PDF/ZIP/PPTX rasters)
- Removed every external font CDN `<link>` from `index.html` (fonts.maateen.me, Google Fonts, KaTeX CDN). `src/fonts.css` + `public/fonts/` is now the single source of truth.
- Added self-hosted `FiraCode-Regular.ttf` (+ `@font-face` in fonts.css); replaced 0-byte Noto Sans Bengali TTFs; deleted broken files. Added real `NotoSansBengali-Regular.ttf` (463KB `[wdth,wght]` variable TTF — needed because PPTX can't embed woff2).
- New `src/utils/fontEmbed.ts`: `getFontEmbedCSS()` — memoized CSS string declaring every self-hosted face as a base64 data URI. Passed as the explicit `fontEmbedCSS` option to EVERY `toPng` call (ExportModal PNG/ZIP/PDF + PPTX background/full-slide/math rasters, BatchExportModal, QuestionPaperPage, DeckQuestionPaperModal, QuestionBankPdfModal, SocialPostGenerator fallback). Bypasses html-to-image's stylesheet-scan path which silently dropped cross-origin fonts.
- Verified headless-Chrome: exported PNG glyph bbox 2023px vs DOM Kalpurush 2026.6px (serif would be 2274.8px).

### 2. Glass badges exact in the editable PPTX (`src/utils/pptxExport.ts`)
- New `cssRgbHex()`: rgba fills export as RAW un-blended rgb + pptxgenjs `transparency` (fixes double-darkened pills from `cssColorToHex` pre-blend + transparency). Applied to generic pill/card path + icon containers.
- `bind === 'source'` now exports as amber glass chips (451A03 @30% transparency, F59E0B border @50%, Award SVG icon, FCD34D text, right-aligned wrapping) instead of plain joined text.
- Pill height = leading-snug (fontSize*1.375) + 20px; shadows opacity 0.12/0.15; option-pill widths use per-glyph `estCharW` (Bangla ~0.62em vs latin ~0.5em).

### 3. Editable PPTX font embedding — PowerPoint "Embed fonts" (`src/utils/pptxFontEmbed.ts`)
- `getUsedFontFamilies(config, items)`: scans deck role fonts (default/header/body/options/footer via `resolveTheme`) + every text box's resolved font (`getBoxFontFamily`), across deck + per-slide `customConfig`, returning only families with a self-hosted TTF.
- `embedFontsInPptx(data, families)`: post-processes the generated .pptx with JSZip — adds TTF binaries (`ppt/fonts/fntdataN.ttf`), writes `ppt/fontTable.xml` (`<p:font typeface=...><p:embedRegular/embedBold r:id=.../>`), `ppt/_rels/fontTable.xml.rels`, wires `ppt/_rels/presentation.xml.rels` + `<p:embeddedFontLst r:id=.../>` into `ppt/presentation.xml` (after `notesSz`, schema order) + `[Content_Types].xml`. Accepts `Blob | ArrayBuffer | Uint8Array` (JSZip can't load a Node Blob).
- `exportDeckToPPTX` gained `embedFonts = true` param — writes blob (`pptx.write({outputType:'blob'})`), embeds, `saveAs`.
- ExportModal: "Embed fonts" checkbox (default ON) beside "Exact slide images", applied to PPTX + Google Slides. BatchExportModal embeds automatically (default).
- Verified end-to-end in headless Chrome (captured real blob ~917KB: font binaries + fontTable.xml + embeddedFontLst + rels + content types + Bangla with `a:cs typeface="Kalpurush"`).

## Decisions made

- PPTX font strategy changed from reference-only to **embedding** (user's decision): "Embed fonts" checkbox default ON, embed only deck-used families, applies to PPTX + Google Slides, batch always embeds.
- PNG/PDF/ZIP: self-hosted fonts + explicit `fontEmbedCSS` data-URI bundle (deterministic, offline-capable).
- Glass badges: fixed the NATIVE PPTX approximation (raw rgb + true transparency); NOT rasterized as images (keeps editability).
- Files for export logic kept in `src/utils/` (pure browser logic), following existing layout.

## Problems solved

- html-to-image silently dropped cross-origin CDN fonts → removed CDNs + explicit `fontEmbedCSS` (its `fontEmbedCSS` option is used verbatim, verified in source).
- Glass badge double-blend: `cssColorToHex` pre-blends rgba over bg AND `cssFillTransparency` added transparency → double-dark; fixed with `cssRgbHex` (raw rgb + alpha).
- pptxgenjs has NO font-embedding API → JSZip OOXML post-processing (fontTable.xml + binaries + embeddedFontLst + rels + content types).
- `fontEmbedCSS` base64 building: chunked `String.fromCharCode.apply` to avoid stack overflow on multi-MB fonts.
- Headless-Chrome download capture is unreliable → verified by hooking `URL.createObjectURL` in CDP to capture the exact Blob.

## Current state

- `main` = `089acc2`, export-fidelity work fully committed + verified (lint `tsc --noEmit` + `vite build` green).
- **Uncommitted parallel work (NOT mine):** a Math-helper LaTeX-snippet feature is WIP on branch `feat/math-latex-helper` — modified `EditQuestionModal.tsx`, `ManualEditor.tsx`, `SlideTextBoxPanel.tsx`, `workspaces/EditableMCQCard.tsx`; new `src/components/math/` (`MathHelperButton.tsx`, `mathSnippets.ts`) + `src/utils/cursorInsert.ts`. A parallel process owns it; leave untouched. The branch HEAD is `089acc2` (same as main), so future commits apply cleanly.
- Deleted merged branch `feat/export-font-fidelity`.

## Next session starts with

- The Math-helper feature is the active in-progress work on `feat/math-latex-helper`. Check `git status` / `git branch --show-current` before touching anything; that work may need committing/merging/review.
- If continuing export work: consider (minor) subsetting embedded fonts to shrink PPTX, and whether "Embed fonts" should be skipped in Exact-slide-images mode.

## Open questions

- None blocking. Minor follow-ups: font subsetting for smaller PPTX files; verify Noto Sans Bengali variable-font embedding renders in older PowerPoint.
