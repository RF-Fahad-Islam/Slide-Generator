# Memory — Codebase Scan & Context Update

Last updated: 2026-08-06

## What was built

**Full-stack MCQ slide generator application** (Vite + React 19 + Express):

- **Core components**: `App.tsx` (main shell with tab navigation), `SlideCanvas.tsx` (1920x1080 responsive renderer), `HeaderNavbar.tsx`, `DeckManager.tsx`, `ManualEditor.tsx`, `AIUploader.tsx`, `ExportModal.tsx`, `DeckSettings.tsx`, `QuestionBankView.tsx`, `SocialPostGenerator.tsx`, `SettingsView.tsx`, `SlideDecksHome.tsx`, `ValidationPanel.tsx`, `MathText.tsx`
- **Backend**: `server.ts` with Express routes for health check, AI test connection, and 2-stage vision OCR pipeline (`/api/ai/parse-mcqs`)
- **Template system**: 8 preset themes in `src/templates/registry.ts` (rakib-dark, quiztime-blue, classroom-green, minimal-light, pure-white-light, warm-paper-light, pastel-study-light, neon-cyber) with custom theme builder
- **Data layer**: IndexedDB via Dexie (`src/db/dexie.ts`) with auto-sync hook
- **Utilities**: PPTX export (`pptxExport.ts`), bulk parser (`bulkParser.ts`), CSV parser (`csvParser.ts`), background presets, font presets
- **Features**: Dark/light app theme, BYOK (Bring Your Own Key) for Gemini + OpenRouter, multi-format export (PPTX/PNG/PDF/ZIP), social media post generator, question bank with tagging

## Decisions made

- **Stack choice**: Vite 6 + React 19 + Tailwind CSS 4 + Express 4 (not Next.js as originally planned in architecture docs). Current stack is working well with clean builds.
- **AI pipeline**: 2-stage vision OCR approach — Stage 1 extracts text from images/PDFs, Stage 2 structures into JSON MCQs. Supports both Gemini and OpenRouter providers.
- **PPTX export**: Hybrid approach using pre-rendered slide images (from `html-to-image`) for visual fidelity, with native PPTX fallback. LaTeX rendered as KaTeX snapshots.
- **Template architecture**: Template registry with both Tailwind classes (for DOM rendering) and hex colors (for PPTX export parity). Custom theme builder allows user color customization.
- **Storage**: IndexedDB via Dexie with schema versioning. Whole-deck JSON import/export for round-trip fidelity.

## Problems solved

- **Build configuration**: Resolved TypeScript type issues with React 19 + Vite setup. Build now passes cleanly (`npm run build` and `tsc --noEmit`).
- **BYOK security**: API keys passed via headers (`x-gemini-key`, `x-openrouter-key`), never stored server-side, sanitized from error messages with regex replacement.
- **Responsive canvas**: `ResizeObserver` calculates scale factor to fit 1920x1080 canvas into any container size without layout shifts.
- **Bangla numeral handling**: AI pipeline normalizes Bengali numerals (০-৯) to Arabic (0-9) for consistent key generation.

## Current state

**Working features**:
- All 8 template themes render correctly in both dark and light modes
- AI ingestion pipeline (text paste + file upload) with Gemini/OpenRouter BYOK
- Manual question editor with standard, bohupodi (roman_statements), and passage types
- Slide preview with answer reveal toggle, keyboard navigation, overview grid mode
- Export to PPTX (hybrid), PNG (single/ZIP), PDF
- Social media post generator with 4 aspect ratios
- Question bank with search, filter, bulk import
- IndexedDB auto-save with sync indicator
- Deck settings with custom branding, fonts, backgrounds, per-slide overrides

**Known issues / incomplete**:
- Drag-and-drop reordering not implemented (needs `dnd-kit`)
- Paginated answer-key slides not implemented
- Bengali fonts loaded from Google Fonts CDN (should bundle woff2 locally)
- Architecture doc specifies declarative `Element[]` renderer but current implementation is imperative

## Next session starts with

1. **Add drag-and-drop reordering**: Install `dnd-kit` and implement sortable question list in `DeckManager.tsx`
2. **Implement paginated answer-key slides**: Add `answerKeyList` element type to export pipeline
3. **Bundle Bengali fonts**: Download Hind Siliguri + Noto Sans Bengali woff2 to `public/fonts/` for offline support
4. **(Optional) Refactor to declarative renderer**: If pursuing architecture parity with `Element[]` descriptor schema per Decision D6

## Open questions

- **Framework migration**: Current Vite + Express stack works well. Should we migrate to Next.js App Router as originally planned, or stay with current stack?
- **Declarative renderer**: Architecture doc specifies `Element[]` descriptor schema for dual-renderer parity. Is this refactor worth the effort given current hybrid PPTX approach works?
- **Supabase integration**: Architecture mentions future Supabase layer. When to start implementing the tenant-shaped schema with `org_id` columns?
