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
- [x] 2026-08-05 — Install dependencies (`@google/genai`, `pptxgenjs`, `jspdf`, `html-to-image`, `dexie`, `katex`, `lucide-react`, `jszip`, `motion`, `file-saver`)
- [x] 2026-08-05 — Fix TypeScript type definitions (`@types/react`, `@types/react-dom`, `@types/node`)
- [x] 2026-08-05 — Clean TypeScript build (`tsc --noEmit` & `npm run build` green)
- [x] 2026-08-05 — Dark/Light app shell theme toggle with localStorage persistence
- [!] Bundle Bengali woff2 self-hosted fonts in `public/fonts/` (currently relying on Google Fonts / web fonts)

## Phase 1 — Template & Canvas Renderer
- [x] 2026-08-05 — `SlideCanvas.tsx`: Responsive 1920x1080 canvas with `ResizeObserver` scale calculation & KaTeX formula support (`MathText.tsx`)
- [x] 2026-08-05 — Preset template registry in `src/templates/registry.ts` (8 templates: rakib-dark, quiztime-blue, classroom-green, minimal-light, pure-white-light, warm-paper-light, pastel-study-light, neon-cyber)
- [x] 2026-08-05 — IndexedDB sync via Dexie in `src/db/dexie.ts` & `src/hooks/useIndexedDBSync.ts`
- [x] 2026-08-05 — PNG export using `html-to-image`
- [!] Refactor renderer to declarative `Element[]` descriptor schema with resolve-once autofit (Decision D6)

## Phase 2 — AI Spine (Gemini Ingestion)
- [x] 2026-08-05 — `AIUploader.tsx`: Raw text paste & file/PDF upload interface
- [x] 2026-08-05 — `server.ts`: `/api/ai/parse-mcqs` Express route handler using `@google/genai` structured outputs
- [x] 2026-08-05 — 2-stage vision OCR pipeline: Stage 1 (Vision OCR) → Stage 2 (Structured MCQ JSON)
- [x] 2026-08-05 — BYOK Header Proxying: `x-gemini-key` / `x-openrouter-key` client header passing, browser `localStorage` key persistence, and API key error sanitization
- [x] 2026-08-05 — Multi-provider support: Google Gemini + OpenRouter (BYOK)
- [x] 2026-08-05 — `SettingsView.tsx`: Multi-provider API key configuration with test connection endpoint
- [x] 2026-08-05 — Hybrid PPTX export with embedded KaTeX canvas snapshots & raw LaTeX in speaker notes (Decision D4/D5)

## Phase 3 — Editor Depth & Manual Mode
- [x] 2026-08-05 — `ManualEditor.tsx`: Full per-question form (standard, bohupodi statement, passage stem)
- [x] 2026-08-05 — `src/utils/bulkParser.ts`: Bangla-aware regex bulk parser with sample decks
- [x] 2026-08-05 — `src/utils/csvParser.ts`: CSV import & template generator
- [x] 2026-08-05 — `ValidationPanel.tsx`: Live question validation & error detection drawer
- [x] 2026-08-05 — `DeckManager.tsx`: Reorderable question deck list with search, delete, duplicate controls
- [x] 2026-08-06 — `@dnd-kit/core` + `@dnd-kit/sortable` drag-and-drop sortable question reordering (`SortableQuestionCard.tsx`): grip-handle drag, PointerSensor (5px) + KeyboardSensor (`sortableKeyboardCoordinates`), drag disabled while search filter active, MoveUp/MoveDown buttons removed, dragged card gets `opacity-50 shadow-2xl`

## Phase 4 — Export Breadth
- [x] 2026-08-05 — `ExportModal.tsx`: PPTX presentation export, multi-slide PNG image download, and PDF export (`jspdf`)
- [x] 2026-08-05 — `SocialPostGenerator.tsx`: Multi-aspect ratio templates (1:1, 4:5, 9:16, 16:9) with reaction quiz formats
- [x] 2026-08-05 — ZIP archive download (`jszip`) with dual question (`01_q.png`) and answer reveal (`01_ans.png`) slide PNG packaging
- [x] 2026-08-05 — `src/utils/pptxExport.ts`: Hybrid PPTX with pre-rendered slide images + native fallback
- [x] 2026-08-05 — Background image presets (`src/utils/backgroundPresets.ts`)
- [x] 2026-08-05 — Font presets system (`src/utils/fontPresets.ts`)
- [ ] Paginated standalone answer-key slides (`answerKeyList`)

## Phase 5 — Template Management
- [x] 2026-08-05 — `DeckSettings.tsx`: Custom branding, logo positioning, background overlays, typography presets, header/footer banners
- [x] 2026-08-05 — Custom theme color builder with live preview
- [x] 2026-08-05 — Per-slide configuration overrides
- [x] 2026-08-05 — `SlideDecksHome.tsx`: Deck library home view with quick actions
- [x] 2026-08-05 — `QuestionBankView.tsx`: Local question bank with tagging, subject filter, search, bulk deck import
- [ ] Interactive template studio with JSON template import/export

## UI Polish
- [x] 2026-08-06 — **Collapsible desktop sidebar** — `SidebarNav.tsx` now collapses to icon-only strip (`w-20`) on desktop with floating amber toggle button, localStorage persistence (`sidebar_collapsed`), smooth `duration-300` transition. Labels hide, icons stay with `title` tooltips.
- [x] 2026-08-06 — **Fatty slide studio** — `App.tsx` preview tab: main content `max-w-[1600px]` (from `max-w-7xl`), grid gap `gap-10`, canvas container padding `p-4 sm:p-6 lg:p-8`, control bar `p-5`, nav buttons `p-2.5`, answer reveal `px-4 py-2.5`.
- [x] 2026-08-06 — **Fatty question deck** — `DeckManager.tsx`: panel `p-8`, cards `p-5`, number badges `w-9 h-9 rounded-xl text-sm`, stems `text-base`, action buttons `p-2` with `w-4 h-4` icons, list gap `space-y-4`, search `py-2.5 pl-10`, bulk tools `p-4`, max-height `600px`.
- [x] 2026-08-06 — **Fatty question bank filter + deck library** — `QuestionBankView.tsx`: filter panel `p-6 lg:p-8`, section headers `text-lg`/`text-base`, search input `py-3 pl-11` with `w-5 h-5` icon, filter selects `px-3.5 py-3`, "Select All Filtered" buttons `px-4 py-2`, question cards `p-5` with `w-6 h-6` checkboxes + `text-base` stems + `p-2.5` option pills, deck cards `p-5` with `text-base` titles, command bar buttons `px-5/6 py-2.5`. All labels bumped `text-xs`→`text-sm`, `text-[10px]`→`text-xs`.
- [x] 2026-08-06 — **Social post picker filter** — `SocialPostGenerator.tsx`: question picker now has the same search + subject/board/type filter bar as the Question Bank (state `pickerSearch`/`pickerSubject`/`pickerBoard`/`pickerType`), filtering against the full deck while preserving the real index into `items` (`filteredPickerItems: { question, fullIndex }[]`), count shows `filtered / total`, picker items bumped to `p-3.5 text-sm` with `w-5 h-5` check icon, section labels `text-sm`.
- [x] 2026-08-06 — **Fatty Configure tab** — `DeckSettings.tsx` (form region only, thumbnail preview untouched): `text-[10px]`/`text-xs`/`text-[11px]` labels & controls bumped to `text-sm`, section headers `text-sm`→`text-base`, main heading `text-lg`, selects `px-2.5 py-1.5`→`px-3 py-2.5`, inputs `px-3 py-2`→`px-4 py-2.5`.
- [x] 2026-08-06 — **Fatty AI settings tab** — `SettingsView.tsx`: `text-xs` labels/descriptions bumped to `text-sm`, inputs `px-4 py-3.5`→`px-4 py-4`, security banner `text-base`.
- [x] 2026-08-06 — **Configure tab categories** — `DeckSettings.tsx`: added a pill tab bar (Typography · Layout & Banners · Background · Theme & Preview · Header & Branding) under the scope selector; each section renders only when its tab is active via `settingsTab` state (default `typography`). All fields persist since settings live in the shared `config`.
- [x] 2026-08-06 — **Banner mode hides manual fields** — `DeckSettings.tsx`: when `headerType === 'banner' || useHeaderBanner`, the 3 manual text cards (Brand Logo & Name, Subject Header & Badge, Instructor Watermark) are hidden and replaced by a hint card; banner upload controls + Slide Interactive Display Settings stay visible.
- [x] 2026-08-06 — **Share question to Social Post Generator** — `QuestionBankView.tsx`: each question card now has a compact Share button (`Share2` icon + label) with `stopPropagation` so it doesn't toggle selection. New `onOpenInSocial(question)` prop → `App.tsx` `handleOpenInSocial`: appends the question to the active deck if missing (id preserved via `ensureUniqueIds`), sets `socialTargetId`, switches to the `social` tab. `SocialPostGenerator.tsx` accepts `preselectedItemId?: string | null` and a `useEffect` selects it (sets `selectedQuestionIndex` + `selectedItemIds`) when present.
- [x] 2026-08-06 — **Custom design editor (5th mode)** — `SocialPostGenerator.tsx`: new `Custom Design Editor` card in the left column with an on/off toggle. In custom mode the preview canvas switches to a user-designed post: upload a background image (FileReader data-URL or paste URL, clearable), add draggable/resizable text boxes bound to question fields (`stem`, `options` list auto-rendered with keys, `answer`, `explanation`, `brand`, `headerTitle`, `footerTag`, `free` custom text). Style panel per selected box: bind dropdown, font size slider (as % of canvas width), 8 color presets + native color picker, align (left/center/right), bold, delete. Boxes are positioned as `%` of the canvas (`x/y/w`), resized via a bottom-right handle using pointer events; `canvasWidth` measured from the export node via ResizeObserver so `%` fonts resolve to real px for html2canvas. Design persists to `localStorage` (`social_post_custom_design_v1`), reloaded on mount with corrupt-data fallback. Export: the `postCanvasRef` export node stays a sibling of the editor overlay (`absolute inset-0` + `z-20`), so `handleExportSinglePNG` continues capturing only the card. All existing 4 template layouts untouched (rendered when custom mode is OFF). `tsc --noEmit` + `npm run build` green.

## Bug fixes
- [x] 2026-08-06 — **Light theme grey cards on home** — `SlideDecksHome.tsx` was applying `glass-card-fatty` (unlayered CSS, dark `rgba(15,23,42,0.85)` background) alongside `bg-white/95` in light mode. In Tailwind v4 the unlayered rule wins, so the dark background bled through and the hero + 6 tool cards rendered grey. Swapped to `glass-card-fatty-light` in light mode (white `rgba(255,255,255,0.95)`); removed redundant `bg-white/95` Tailwind classes. Section 4 deck cards already used `glass-card-fatty-light` correctly — only dropped the redundant `bg-white/95` there.
- [x] 2026-08-06 — **Light theme grey cards — rest of app** — Same `glass-card-fatty` + `bg-white/95` bug affected 14 more card roots across 8 files: `DeckManager.tsx` (1), `ExportModal.tsx` (1), `QuestionBankView.tsx` (1), `DeckSettings.tsx` (1), `ManualEditor.tsx` (3), `AIUploader.tsx` (2), `SettingsView.tsx` (1), `SocialPostGenerator.tsx` (5). All fixed by moving the glass class into the `isAppLight` ternary and dropping the redundant Tailwind background classes. `SettingsView.tsx` also had a dark-mode side-effect (`glass-card-fatty` overriding `border-slate-800/80` with a white-ish border) — fixed by removing `glass-card-fatty` in dark mode.

---

## Open questions / blockers
- **Framework alignment**: Currently running Vite SPA + Express stack (working well). Original plan was Next.js App Router. Decision needed: maintain current stack or migrate to Next.js?
- **Declarative renderer**: Architecture doc specifies `Element[]` descriptor schema (Decision D6) but current `SlideCanvas.tsx` uses imperative rendering. Refactor needed for true dual-renderer parity.

## Notes for the next session
- Build commands are passing (`npx typescript --noEmit` and `npm run build` clean).
- Stack: Vite 6 + React 19 + Tailwind CSS 4 + Express 4 + TypeScript 5.8
- 8 template themes implemented (4 dark, 4 light)
- AI pipeline: 2-stage vision OCR (Gemini/OpenRouter) → structured JSON → review → deck
- Export: PPTX (hybrid with pre-rendered images), PNG, PDF, ZIP
- Priorities remaining:
  1. Implement paginated answer-key slides
  2. Bundle self-hosted Bengali woff2 fonts
  3. Refactor to declarative `Element[]` renderer (if pursuing architecture parity)