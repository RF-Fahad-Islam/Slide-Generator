# Memory — Settings Restructure (Global Prefs Page + Deck Settings Modal)

Last updated: 2026-08-06

## What was built

**This session — committed on `feat/ingestion-local-stream`** as `bca8246` (also carried the previously-uncommitted Session 8 work: export scope, Deck Question Paper modal, editable-PPTX-layers default, Question Bank card theme fix, My Decks page, bulk parser fixes).

- **Settings tab → global preferences page** (`src/components/GlobalSettings.tsx` + `src/utils/globalDefaults.ts`): default deck name, default template grid, default question numbering (bangla/english/prefix), app light/dark shell toggle. Persisted to localStorage `mcqgen.globalDefaults` (`GlobalDefaults = { defaultDeckName, defaultTemplateId, defaultQuestionNumberFormat }`, defaults `'Untitled Deck'` / `'rakib-dark'` / `'bangla'`). `App.tsx` seeds fresh-deck config (`templateId`, `questionNumberFormat`) + new-deck name from them.
- **AI keys stay on the separate AI Keys tab** (`SettingsView.tsx` untouched) — user decision.
- **Deck-scoped settings moved out of the tab into a Slide Studio modal** (`src/components/DeckSettingsModal.tsx`). Opened from: Slide Studio toolbar "Deck Settings" button (`data-tour="studio-deck-settings"`), My Decks card Settings (`Sliders`, passes `deck.id` as 3rd arg → `editingSavedDeckId` persist), home "Branding & Fonts" bento card (`onOpenDeckSettings(currentItems, currentConfig)`).
  - Modal edits a **draft** `config`/`activeSlideConfig`; nothing commits until **Apply to All**.
  - **Live preview**: 1920×1080 `SlideCanvas` scaled via ResizeObserver into an `aspect-[16/9]` panel; preview item = real `items[activeSlideIndex]` with `customConfig` = draft slide config, `config` = draft config (SlideCanvas merges `item.customConfig` over `config` itself).
  - **Unsaved Changes** badge (amber pill) appears on any draft edit; Cancel → `window.confirm('Discard your unsaved Deck Settings changes?')`.
  - Apply commits `onApplyConfig(draftConfig)` + `onApplyActiveSlideConfig(draftSlideConfig)` (or `onResetActiveSlideConfig()` when the slide draft is empty). Per-slide Theme scope preserved (Theme tab always writes to active slide).
- **"Classroom / Live Writing Mode" → "📐 Classroom View"** (`DeckSettings.tsx` Layout tab) with a pure-CSS slide-mock graphic (brand strip, dashed writing space, stacked options) — NO image asset file. Clicking calls `onEnforceClassroomView` → `App.handleEnforceClassroomView`: sets `layoutMode:'class_mode'` + `slideTextBoxes: classroomTextBoxes()`, closes modal, opens text-box editor in All-Slides scope. `classroomTextBoxes()` is a new factory in `src/utils/slideElements.ts` (brand/header/stem top-left, wide `✏️ Live Teacher Writing / Stylus Space` center, options right column, footer).
- **Rewired**: `SidebarNav.tsx` "Deck Settings" → "Settings"; `HeaderNavbar.tsx` tool card "Deck & Font Settings" → "Global Settings"; `OnboardingTour.tsx` settings step retitled/rewritten; `SlideDecksHome.tsx` "Branding & Fonts" card now opens the modal instead of the settings tab.

## Decisions made

- Settings tab = global-only prefs; deck branding/layout config lives in the modal (user decisions from the clarifying Q&A).
- Modal keeps BOTH scopes: deck-wide AND per-active-slide (Theme tab writes to active slide only).
- Classroom View selection = apply class_mode + classroom text boxes to the deck AND immediately hand off to the box editor (no confirm).
- Global defaults live in localStorage, seeded only into NEW decks (changing them doesn't alter the current deck).
- `handleEnforceClassroomView` deliberately KEEPS `editingSavedDeckId` so Classroom View persists back to the saved library deck.
- New UI follows the `appTheme`/`isAppLight` ternary pattern; no Tailwind `dark:`; no hardcoded hex in app chrome.

## Problems solved

- Old "Settings" tab mixed global (AI keys) with deck-scoped branding; deck config is now reachable from within Slide Studio, and the tab is a clean global prefs page.
- `window.innerText`/`innerText` in CDP tests silently omits content clipped by the modal's `overflow-y-auto` scroll container — use `textContent` for clipped-modal assertions.
- Modal live preview: passing `config=draftConfig` + `item.customConfig=draftSlideConfig` gives correct merge without a second manual spread.
- Classroom View CDP test initially clicked a `div` wrapper with `cursor-pointer` instead of the actual `<button>` card — click the button element directly.

## Current state

All committed (`bca8246`). `npm run lint` (`tsc --noEmit`) + `npm run build` green. Verified end-to-end in headless Chrome (CDP): global prefs page renders; modal opens with live preview + tabs; dirty badge; Apply-to-All commits + persists selection on reopen; Cancel shows confirm; Classroom View closes modal, applies class_mode, opens box editor, canvas shows classroom layout. Dev server http://localhost:9000.

**Known open item:** `src/server/lib/extract-text.ts` + `rasterize.ts` are orphaned, unreferenced experiment files (import a non-bundled `pdf-parse`) — left untracked and excluded from the commit. Delete or wire up.

## Next session starts with

1. Manual browser pass (agent can't verify import fidelity): open an exported PPTX in real PowerPoint — confirm editable layers (text/shapes), then the "flattened image" checkbox path; try Google Slides.
2. Decide on the Classroom View card graphic: CSS mock is in place — confirm acceptable or provide a real PNG/SVG asset.
3. Clean up `src/server/lib/` orphans (delete or wire into the server).
4. Remaining backlog: self-hosted Bengali woff2 fonts; declarative `Element[]` renderer refactor.

## Open questions

- Classroom View card graphic: CSS mock vs. real image asset?
- Should the two `src/server/lib/*.ts` orphans be deleted?
