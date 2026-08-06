# Memory — Configure Tabs, Banner Mode, Share-to-Social, Custom Post Editor

Last updated: 2026-08-06

## What was built

**Session 3 (this session)** — three features committed on `main`:

- `6df2659` — **Configure tab categories + banner mode** (`DeckSettings.tsx`, `SettingsView.tsx`): pill tab bar under the scope selector (Typography · Layout & Banners · Background · Theme & Preview · Header & Branding) via `settingsTab` state (default `typography`); each section renders only when its tab is active. In banner mode (`headerType === 'banner' || useHeaderBanner`) the 3 manual text cards (Brand Logo & Name, Subject Header & Badge, Instructor Watermark) are hidden behind `{!isBannerMode && (...)}` and replaced by an amber hint card; banner upload controls stay visible. `SettingsView.tsx` had a fatty-text pass (AI settings tab). DeckSettings.tsx must stay CRLF no-BOM (normalized: 1985 CRLF, 0 lone LF); its thumbnail preview (micro-fonts `text-[7px]`–`text-[11px]`) is a scaled 16:9 canvas — never touch.
- `85c4bb5` — **Share question to Social Post Generator** (`QuestionBankView.tsx`, `App.tsx`, `SocialPostGenerator.tsx`): compact Share button per question card (`stopPropagation`). `App.tsx` `handleOpenInSocial` appends the question to the active deck if missing (id preserved via `ensureUniqueIds` — dedupe only assigns new ids, existing ids untouched), sets `socialTargetId`, switches to the `social` tab. `SocialPostGenerator` accepts `preselectedItemId?: string | null`; a `useEffect` jumps `selectedQuestionIndex` + `selectedItemIds` to it.
- `6f42370` — **Custom design editor (5th mode)** (`SocialPostGenerator.tsx`): toggle card in the left column. In custom mode the preview canvas becomes a user-designed post: upload background image (FileReader data-URL or paste URL, clearable), add draggable/resizable text boxes bound to question fields (`stem`, `options` auto-rendered as keyed list, `answer`, `explanation`, `brand`, `headerTitle`, `footerTag`, `free` text). Style panel: bind dropdown, font-size slider (% of canvas width), 8 color presets + native picker, align, bold, duplicate, delete. Positions are `%` (`x/y/w`); drag + bottom-right resize via pointer events. Persists to `localStorage` (`social_post_custom_design_v1`) with corrupt-data fallback; quota-full catches are ignored.
- `4566199` — docs: `context/progress-tracker.md` + `context/ui-registry.md` updated for all three features.

## Decisions made

- **Export boundary**: in custom mode the `postCanvasRef` export node is a sibling of the editor overlay (`absolute inset-0` + `z-20` overlay inside the aspect card), so `handleExportSinglePNG` (html2canvas) captures only the card — handles/chips never leak into the PNG. Do not nest the overlay inside the export node.
- **Font sizing**: box `fontSize` is a % of canvas width; `canvasWidth` is measured from the export node via ResizeObserver (a 500px wrapper is NOT used — 4:5 and 9:16 cards are narrower, so measuring the wrapper would be wrong). `fs = max(8, round(fontSize/100 * canvasWidth))`.
- **Raw hex is the sanctioned exception**: box/bg color storage is user data, so hex values (`BOX_COLOR_PRESETS`, native picker) are required; presets match Tailwind semantic palette (e.g. `#fbbf24` = amber-400). Rest of the UI still follows `isAppLight` ternary + semantic tokens.
- **Existing 4 template layouts are untouched** — they render when custom mode is OFF; the custom editor is a strict add-on 5th mode (user-confirmed).

## Problems solved

- Duplicated `postCanvasRef` declaration (stale original kept from before refactor) — removed.
- `addBox` originally had a convoluted double-`setCustomDesign` for options placement; simplified to a single clean add.
- `canvasMeasureRef` was initially on a `max-w-[500px]` wrapper, which mis-measures 4:5 (450px) / 9:16 (360px) cards — moved measurement to `postCanvasRef.current` which in custom mode is `inset-0`, so its rect equals the card width.

## Current state

All green: `npx tsc --noEmit` + `npm run build` pass. All work committed on `main`. Working tree has only `memory.md` modified (this file, previous sessions 1–2 dnd-kit + laptop responsiveness — see git log `d32235f`, `f433862`).

## Next session starts with

1. `git commit` this `memory.md` (it supersedes the sessions 1–2 memory that was still uncommitted), or fold it into the next feature commit.
2. Open the app and manually verify the custom design editor end-to-end: toggle custom mode, upload a bg image, drag/resize a box, change the selected question (bound boxes should update), and export a PNG — html2canvas with an `absolute inset-0` export node was NOT visually verified in a browser and is the highest-risk unverified behavior.
3. Optional polish: add `onerror` handler to the background-image `FileReader` (currently silent on bad files) — flagged Minor in review.

## Open questions

- None blocking. The two Minor review notes (FileReader `onerror`, raw-hex exception documented) are captured above.
