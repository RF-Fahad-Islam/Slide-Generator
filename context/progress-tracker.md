# Progress Tracker

> Update this after EVERY task and feature (CLAUDE.md mandate). Format: one row per
> task with status, phase, date, and the file(s) touched. Keep current phase's tasks
> at the top.

## Status legend
`[x]` done · `[~]` in progress · `[!]` needs refactor/alignment · `[ ]` pending

---

## Planning & docs (DONE)
- [x] 2026-08-05 — Write `plan.md` (final plan + decision log D1–D16) — root
- [x] 2026-08-05 — Write `context/project-overview.md`
- [x] 2026-08-05 — Write `context/architecture.md`
- [x] 2026-08-05 — Write `context/auth-plan.md`
- [x] 2026-08-05 — Write `context/ui-tokens.md`
- [x] 2026-08-05 — Write `context/ui-rules.md`
- [x] 2026-08-05 — Write `context/ui-registry.md`
- [x] 2026-08-05 — Write `context/code-standards.md`
- [x] 2026-08-05 — Write `context/library-docs.md`
- [x] 2026-08-05 — Write `context/build-plan.md`
- [x] 2026-08-05 — Write `context/progress-tracker.md`

## Phase 0 — Scaffold (Vite + React 19 + Express)
- [x] 2026-08-05 — Vite + React 19 + Tailwind CSS + Express (`server.ts`, `vite.config.ts`)
- [x] 2026-08-05 — Install dependencies (`@google/genai`, `pptxgenjs`, `jspdf`, `html-to-image`, `dexie`, `katex`, `lucide-react`)
- [x] 2026-08-05 — Fix TypeScript type definitions (`@types/react`, `@types/react-dom`, `@types/node`)
- [x] 2026-08-05 — Clean TypeScript build (`tsc --noEmit` & `npm run build` green)
- [!] Bundle Bengali woff2 self-hosted fonts in `public/fonts/` (currently relying on Google Fonts / web fonts)

## Phase 1 — Template & Canvas Renderer
- [x] 2026-08-05 — `SlideCanvas.tsx`: Responsive 1920x1080 canvas with `ResizeObserver` scale calculation & KaTeX formula support (`MathText.tsx`)
- [x] 2026-08-05 — Preset template registry in `src/templates/registry.ts`
- [x] 2026-08-05 — IndexedDB sync via Dexie in `src/db/dexie.ts` & `src/hooks/useIndexedDBSync.ts`
- [x] 2026-08-05 — PNG export using `html-to-image`
- [!] Refactor renderer to declarative `Element[]` descriptor schema with resolve-once autofit (Decision D6)

## Phase 2 — AI Spine (Gemini Ingestion)
- [x] 2026-08-05 — `AIUploader.tsx`: Raw text paste & file/PDF upload interface
- [x] 2026-08-05 — `server.ts`: `/api/ai/parse-mcqs` Express route handler using `@google/genai` structured outputs
- [x] 2026-08-05 — BYOK Header Proxying: `x-gemini-key` client header passing, browser `localStorage` key persistence, and API key error sanitization
- [x] 2026-08-05 — Hybrid PPTX export with embedded KaTeX canvas snapshots & raw LaTeX in speaker notes (Decision D4/D5)

## Phase 3 — Editor Depth & Manual Mode
- [x] 2026-08-05 — `ManualEditor.tsx`: Full per-question form (standard, bohupodi statement, passage stem)
- [x] 2026-08-05 — `src/utils/bulkParser.ts`: Bangla-aware regex bulk parser
- [x] 2026-08-05 — `src/utils/csvParser.ts`: CSV import & template generator
- [x] 2026-08-05 — `ValidationPanel.tsx`: Live question validation & error detection drawer
- [ ] Add `dnd-kit` drag-and-drop sortable question reordering

## Phase 4 — Export Breadth
- [x] 2026-08-05 — `ExportModal.tsx`: PPTX presentation export, multi-slide PNG image download, and PDF export (`jspdf`)
- [x] 2026-08-05 — `SocialPostGenerator.tsx`: Multi-aspect ratio templates (1:1, 4:5, 9:16, 16:9)
- [x] 2026-08-05 — ZIP archive download (`jszip`) with dual question (`01_q.png`) and answer reveal (`01_ans.png`) slide PNG packaging
- [ ] Paginated standalone answer-key slides (`answerKeyList`)

## Phase 5 — Template Management
- [x] 2026-08-05 — `DeckSettings.tsx`: Custom branding, logo positioning, background overlays, and typography presets
- [ ] Interactive template studio with JSON template import/export

---

## Open questions / blockers
- **Framework alignment**: Decide whether to maintain the high-functioning Vite SPA + Express stack or rewrite into Next.js App Router per `context/build-plan.md`.

## Notes for the next session
- Build commands are passing (`npx typescript --noEmit` and `npm run build` clean).
- Priorities remaining:
  1. Fix BYOK key header support in `server.ts`.
  2. Implement KaTeX formula image embedding in `src/utils/pptxExport.ts`.
  3. Add ZIP export for PNG downloads.