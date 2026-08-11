# Memory — KaTeX & Chemistry Auto-Formatter + Option Card Layout + Classroom Stylus Removal + Dynamic Badge Tag + Theme Inheritance & Self-Hosted Font Bundling

Last updated: 2026-08-10

## What was built

All committed on `main`. Latest HEAD = `f6830dd`. Working tree clean.

1. **LaTeX & Chemistry Auto-Formatter (`src/utils/latexFormatter.ts`)**
   - Auto-detects chemical formulas (`H2SO4`, `Na2SO4`, `2NaOH(aq)`, `2H2O(l)`), scientific units (`kJ mol-1`), and un-enclosed LaTeX macros (`\lim`, `\int`, `\frac`, `\sqrt`, `\rightleftharpoons`, `⇌`).
   - Normalizes matrix/determinant shortcuts (`\vert{}\begin{matrix}` → `\begin{vmatrix}`).
   - Updated `MathText.tsx` regex to `(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g` to support multiline matrices/determinants.

2. **KaTeX CSS & Single HTML Output (`src/index.css`, `MathText.tsx`)**
   - Added `@import "katex/dist/katex.min.css";` to `src/index.css` for proper visual rendering of math fonts, fraction bars, square roots, and matrix brackets.
   - Set `output: 'html'` in `katex.renderToString()`, eliminating un-styled raw text and duplicate MathML text strings.

3. **Option Box Layout Geometry (`src/utils/slideElements.ts`, `SlideTextBoxLayer.tsx`)**
   - Widened `cl_options` from 560px to 630px (`x: 1210`, `w: 630`) and set font size to 26px in `classroomTextBoxes()`.
   - Updated option text wrappers in `SlideTextBoxLayer.tsx` to use `flex-1 min-w-0` and `flex items-center` for single-line option fitting.

4. **Classroom View Mode Stylus Removal (`SlideCanvas.tsx`, `slideElements.ts`)**
   - Removed the dashed `✏️ Live Teacher Writing / Stylus Space` container from Classroom Mode layout and preset text boxes (`classroomTextBoxes()`).
   - Added `item.prompt` rendering (e.g., "নিচের কোনটি সঠিক?") inside the left question stem card in Classroom Mode.

5. **Auto Class | Subject Badge Tag (`src/types.ts`, `slideTextBoxes.ts`, `SlideCanvas.tsx`, `ClassicQuizCard.tsx`)**
   - Updated `getEffectiveBadgeTag(config, item)` in `src/types.ts` to accept the active MCQ item.
   - When item-level tags exist (`item.tags.className` and/or `item.tags.subject`), it auto-composes `Class | Subject` (e.g. `SSC | Biology` or `৯ম-১০ম শ্রেণি | জীববিজ্ঞান`).
   - Appends ` | Chapter Name` when `config.chapterName` is set; falls back to `config.badgeTag` when item tags are absent.

6. **Theme Inheritance Bug Fix (`DeckSettings.tsx`, `App.tsx`)**
   - Fixed scope-aware theme settings so changing template presets or custom colors in `DeckSettings.tsx` updates `config` globally when `settingsScope === 'global'`.
   - `App.handleApplyDeckConfig` clears stale per-slide `customConfig` theme overrides (`templateId`, `customTheme`, `accentColorCustom`) while dynamically re-generating `slideTextBoxes` via `templateToTextBoxes(updated)` so text box colors update everywhere.

7. **Self-Hosted Bengali & UI Font Bundling (`public/fonts/`, `src/fonts.css`, `src/index.css`)**
   - Downloaded 13 `.woff2`/`.ttf` font files into `public/fonts/` (Kalpurush, Hind Siliguri, Noto Sans Bengali, Anek Bangla, Tiro Bangla, Atma, Mina, Plus Jakarta Sans, Poppins, Playfair Display).
   - Added `@font-face` definitions in `src/fonts.css` and imported via `@import "./fonts.css";` in `src/index.css`.
   - Ensures HTML-to-Image canvas rasterization and PDF/PPTX exports are 100% CORS-free, instant, and offline-capable.

8. **Enlarged Slide Preview, Large Review Modal, Layout Library & 2x2 Enterprise EdTech Layout (`App.tsx`, `SlidePreviewModal.tsx`, `LayoutLibraryModal.tsx`, `slideElements.ts`)**
   - Removed outer padded card wrapper around the Slide Studio slide canvas preview, maximizing visible preview width (`xl:col-span-8`).
   - Created `SlidePreviewModal.tsx` ("Large Review" button & canvas overlay button) to review high-definition slides in a full-screen modal with keyboard arrow/esc navigation.
   - Created `LayoutLibraryModal.tsx` ("Layouts" toolbar button) for browsing and selecting slide layout presets.
   - Added Enterprise EdTech 2x2 Split Grid layout (`enterprise_2col_grid`) as default layout matching the reference design (2x2 option cards, question badge, stem card, prompt line, explanation callout, branding footer).

9. **Expandable Answer Mode Modal & Multi-Select Display Features (`AnswerModeModal.tsx`, `answerSlides.ts`, `SlideCanvas.tsx`, `SlideTextBoxLayer.tsx`, `App.tsx`)**
   - Created `AnswerModeModal.tsx` opened from the toolbar Answer Mode button group or quick reveal eye toggle.
   - Added `answerDisplayStyles` array (`('highlight_option' | 'answer_pill' | 'explanation_card')[]`) to `DeckConfig` allowing users to multi-select any combination of Option Card Coloring, Answer Badge Pill (`[✓] উত্তর: গ`), and Explanation Box.
   - Added "Include Dedicated Answer Slides in Active Deck" toggle (`separate_slide` mode), dynamically doubling physical slide count (`3 Qs → 6 Slides`).
   - Added Deck-Wide vs Active Slide Only scope switch in the modal.

---

## Current State

- On `main`, latest HEAD = `8da7595`.
- `npx tsc --noEmit` and `npm run build` are 100% clean (0 errors).
- Working tree clean.


