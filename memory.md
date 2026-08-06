# Memory — Slide-Specific Themes, Question Paper PDF, Onboarding Tour

Last updated: 2026-08-06

## What was built

**Session 6 (this session)** — 6 commits on `main` (`cacd697`, `8d426cd`, `4ee3e1c`, `5509139`, `41d0b86`), HEAD `41d0b86`, working tree clean. `npm run lint` (= `tsc --noEmit`) and `npx vite build` both green. Dev server on http://localhost:9000.

- **WS1 — Template Creator fixes** (`src/components/TemplateCreator.tsx`, `src/components/SlideCanvas.tsx`): "Theme Gallery" cards now preview with their OWN theme; background presets blend over the base theme (~55% opacity, readability/opacity sliders shown only when `bgPreset !== 'none'`); accent swatch applies only on user pick with a "✕ Default" reset chip. `SlideCanvas` consumes `accentColorCustom` for brand logo box, number badges, prompt text, source badges, correct-option highlight + badge key + checkmark, footer watermark avatar border + tag — zero change when no accent override.
- **WS2 — slide-specific theme application** (`src/App.tsx`, `src/components/DeckSettings.tsx`, `src/components/SlideDecksHome.tsx`): ALL theme choosers now write to the active slide's `items[i].customConfig` only — Home "Active Slide Theme Picker" (`onSelectTheme`/`onResetSlideTheme`, Preset Themes grid + My Templates via `getTemplatePresets()`, "Reset Slide to Deck Theme" chip), Deck Settings Theme & Preview tab (always slide-scope via `onUpdateActiveSlideConfig`, "apply to active slide only (Slide #N)" banner, `themeEffectiveConfig = { ...config, ...(activeSlideConfig || {}) }`), and the Slide Studio quick Light/Dark toggle. `App.tsx` helpers: `applyThemeToActiveSlide(ThemeSelection)`, `resetActiveSlideTheme()`.
- **WS3 — Question Paper PDF + JSON export**: new `src/utils/mcqJson.ts` (`sanitizeOption`, `normalizeMCQ`, `normalizeMCQs` accepting `MCQItem[]` / `{items}` / `{questions}` / `{data}` / `{mcqs}` / `{questionBank}`, `downloadJSON`). `src/components/QuestionPaperPage.tsx` (new): hidden A4 portrait 794×1123 renders, `forwardRef` + `useImperativeHandle` exposing `renderPdf(onProgress)`; uses slide header/footer branding (brandName/headerTitle/badgeTag/watermarkHandle/footerTag, page x/y, optional answer-key page, MathText, jsPDF via `toPng` pixelRatio 2). `QuestionBankView.tsx`: JSON import (unique IDs, name-your-deck form → `db.questionDecks.put`) + per-deck "JSON" export. `ExportModal.tsx`: "Question Paper (PDF)" card (2/3/4/6 MCQs-per-page selector + Include Answer Key toggle) and "Extract MCQs (JSON)" card (clean `MCQItem[]` minus `customConfig`).
- **WS4 — onboarding tour**: new `src/components/OnboardingTour.tsx` (hand-rolled spotlight, no new deps) with `data-tour="<id>"` anchors, `defaultTourSteps` (11 steps, `TourTab` union, tab navigation via `onNavigate`), scrim + amber spotlight cut-out (`box-shadow` ring), positioned tooltip card, keyboard nav (Enter/→/←/Esc). `App.tsx` auto-launches on first visit (`edtech_tour_done` flag, 900ms delay, `handleCloseTour`), Start Tour buttons on Home hero (`SlideDecksHome` `onStartTour` prop) + SidebarNav bottom help button. Anchors: `home-hero`, `nav-<tab>` on every sidebar item, `studio-toolbar`, `studio-export`, `bank-import`.
- **Review fixes** (`41d0b86`): tour now polls for target elements (20×150ms) instead of fixed timeouts and falls back to a centered tooltip when the element never appears (mobile nav anchors live in the desktop-only aside); removed dead refs (`pendingNavigate`, `measuringRef`) + unused `FileCode` import; quick Light/Dark toggle uses `getTemplateById(...).themeType === 'light'` instead of `templateId.includes('light')`; `normalizeMCQ` no longer fabricates `options[0]` as answer (empty string when no marker); paper settle time 130→150ms.

## Decisions made

- **Themes are slide-scoped everywhere**: no theme chooser applies deck-wide anymore (user-reported bug: "choosing a theme applies to all slides"). Slides without an override inherit the deck theme; `SlideCanvas` merges `{ ...config, ...(item.customConfig || {}) }`.
- **Question Paper PDF is a single deck-themed document** (deliberately not per-slide themed): it reuses slide header/footer branding VALUES but uses its own print styling (white background, amber accent `#f59e0b`, hardcoded hex inline styles) — independent of app theme; acceptable because it's a self-contained printable doc.
- **Tour tooltip is always dark** (`bg-slate-900 text-white`) regardless of app theme — standard spotlight-tour convention.
- Per AGENTS.md: docs updated (`context/progress-tracker.md` + `context/ui-registry.md`), commit per feature on `main`.

## Problems solved

- "Choosing a theme applies the changes to all the slides" — the Slide Studio quick Light/Dark toggle was the last deck-wide writer; now routed through `applyThemeToActiveSlide`.
- Tour spotlight not appearing on tab-navigation steps (Question Bank mounts from IndexedDB slower than a fixed 320ms timeout) — replaced with element polling + centered fallback.
- `isActiveSlideLight` used `templateId.includes('light')` which misclassified `custom-theme`/preset slides — now uses the registry `themeType`.
- Imported JSON with no correct-answer marker was silently marking `options[0]` correct — now leaves the answer empty.
- Backup Deck JSON card `<h4>` header was accidentally dropped while inserting the two new export cards — restored.

## Current state

All WS1–WS4 features complete, reviewed, and committed. `npm run lint` + `npx vite build` green. Docs updated. Working tree clean, HEAD `41d0b86` on `main`.

## Next session starts with

1. **Browser-verify (manual, agent cannot)** — dev server http://localhost:9000:
   - Theme picker on Home + Deck Settings Theme tab + Slide Studio Light/Dark toggle affect ONLY the active slide; other slides keep the deck theme; "Reset Slide to Deck Theme" works.
   - Question Paper PDF export: pick 2/3/4/6 per page + answer key, confirm A4 portrait pages with slide header/footer and no per-slide theme bleeding.
   - Question Bank JSON import (all shapes) + Extract MCQs round-trip re-import.
   - Onboarding tour: auto-launch on first visit (clear `edtech_tour_done` to retrigger), spotlight follows each step, Start Tour buttons reopen it.
2. If all pass, remaining backlog: bundle self-hosted Bengali woff2 fonts; declarative `Element[]` renderer refactor (architecture parity, deferred).

## Open questions

- None blocking. Browser verification of export paths (toPng capture, per-page PDF rasterization) and tour animation remains the highest-risk unverified area.
