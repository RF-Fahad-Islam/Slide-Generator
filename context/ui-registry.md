# UI Registry

> CLAUDE.md mandates updating this after EVERY feature (run `/imprint` after building
> a UI component). Purpose: every new component matches what came before.

## Baseline — Established 2026-08-06

[Note: This baseline was established via /imprint audit]

### Theme System

All components accept `appTheme?: 'dark' | 'light'` prop and derive `const isAppLight = appTheme === 'light'`.
Conditional classes use ternary: `isAppLight ? '[light-class]' : '[dark-class]'`.
**Do NOT use Tailwind `dark:` prefix** — use the prop-based `isAppLight` pattern exclusively.

### Color Tokens

| Property | Dark Mode | Light Mode |
|---|---|---|
| Panel background | `bg-slate-900` | `bg-white` |
| Inset/nested background | `bg-slate-950` | `bg-slate-50` |
| Hover/active background | `bg-slate-800` | `bg-slate-100` |
| Card border | `border-slate-800` | `border-slate-200` |
| Input border | `border-slate-800` | `border-slate-300` |
| Divider border | `border-slate-800` | `border-slate-200` |
| Text — primary | `text-white` | `text-slate-900` |
| Text — secondary | `text-slate-300` | `text-slate-700` |
| Text — muted | `text-slate-400` | `text-slate-600` |
| Text — tertiary | `text-slate-500` | `text-slate-500` |
| Accent — primary | `text-amber-500`, `bg-amber-500` | `text-amber-600`, `bg-amber-500` |
| Accent badge (dark) | `bg-amber-500/20 text-amber-500 border-amber-500/30` | — |
| Accent badge (light) | — | `bg-amber-100 text-amber-800 border-amber-300` |
| Success | `bg-emerald-500/10 border-emerald-500/30 text-emerald-300` | `bg-emerald-50 border-emerald-300 text-emerald-800` |
| Error | `bg-rose-500/10 border-rose-500/30 text-rose-400` | `bg-rose-50 border-rose-300 text-rose-700` |
| Warning | `bg-amber-500/10 border-amber-500/30 text-amber-300` | `bg-amber-50 border-amber-300 text-amber-800` |

### Spacing & Radius

| Element | Class |
|---|---|
| Main panel/card | `rounded-3xl p-6 lg:p-8` |
| Inner section card | `rounded-2xl p-4` or `rounded-3xl p-5` |
| Button (primary) | `rounded-xl` or `rounded-2xl` |
| Button (small/icon) | `rounded-lg` or `rounded-xl` |
| Input / Select | `rounded-xl` |
| Badge / Pill | `rounded-full` or `rounded-lg` |
| Shadow (main panel) | `shadow-2xl` |
| Shadow (button) | `shadow-lg` or `shadow-md` |
| Shadow (light card) | `shadow-sm` |

### Button Patterns

| Type | Dark | Light |
|---|---|---|
| Primary (amber) | `bg-amber-500 text-slate-950 hover:brightness-110` | `bg-amber-500 text-slate-950 hover:brightness-110` |
| Secondary | `bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700` | `bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200` |
| Ghost/outline | `bg-transparent text-slate-300 hover:text-white` | `bg-transparent text-slate-700 hover:text-slate-900` |
| Selected/active | `bg-amber-500/10 border-amber-400 text-amber-300 ring-1 ring-amber-400/50` | `bg-amber-50 border-amber-400 ring-1 ring-amber-400/30` |
| Danger | `bg-rose-500/10 text-rose-400 hover:bg-rose-500/20` | `bg-rose-50 text-rose-500 hover:bg-rose-100` |

### CSS Utility Classes (index.css)

| Class | Purpose |
|---|---|
| `.glass-card-fatty` | Dark mode glassmorphism card (bg: rgba(15,23,42,0.85), blur 24px) |
| `.glass-card-fatty-light` | Light mode glassmorphism card (bg: rgba(255,255,255,0.95), blur 20px) |
| `.btn-fatty-primary` | Gradient amber primary button with glow shadow |
| `.bg-mesh-gradient` | Dark ambient background mesh |
| `.bg-mesh-gradient-light` | Light ambient background mesh |
| `.animate-fadeIn` | Fade + slide-up entrance animation |

**CRITICAL — `glass-card-fatty` Tailwind v4 gotcha:** The `.glass-card-fatty*` classes are defined as unlayered CSS in `index.css`. In Tailwind v4, unlayered rules have higher specificity than `@layer utilities`. Therefore:
- Putting `glass-card-fatty` (dark) in the base className and adding `bg-white/95` in the light branch → the DARK background wins → light cards render grey.
- Correct pattern: put the glass class itself inside the `isAppLight` ternary, e.g.
  ```jsx
  className={`${isAppLight ? 'glass-card-fatty-light' : 'glass-card-fatty'} p-6 ... ${
    isAppLight ? 'border-slate-200' : 'bg-slate-900/80 border-slate-800'
  }`}
  ```
- Same trap applies in reverse: `glass-card-fatty` in dark mode will override `bg-slate-950/85` AND its built-in `border: 1px solid rgba(255,255,255,0.08)` will override `border-slate-800/80`. For dark mode, either use `glass-card-fatty` alone (accept the white-ish border) or use `bg-slate-900/80 border-slate-800` without the glass class.

---

## Established patterns

| Pattern | Decision | First used in |
|---|---|---|
| App shell | Single-page tab navigation with theme toggle (dark/light) | `App.tsx`, `HeaderNavbar.tsx` |
| Lists (questions, review) | Reorderable list with search, delete, duplicate | `DeckManager.tsx` |
| Dialogs | Modal overlay with backdrop blur | `ExportModal.tsx` |
| Forms | Multi-section form with validation panel | `ManualEditor.tsx`, `DeckSettings.tsx` |
| Feedback (confidence flags) | `--warning` + must-confirm (D10) | `ValidationPanel.tsx` |
| Validation panel | Persistent list + jump-to links | `ValidationPanel.tsx` |
| Progress | Determinate bar + label | `ExportModal.tsx` |
| Cards | Chunky rounded-3xl cards with shadow-2xl | All components |
| Theme system | Template registry with hex colors for PPTX parity | `src/templates/registry.ts` |
| Grid overview | 3-column responsive grid for slide thumbnails | `App.tsx` (overview mode) |

## Registered components

### `HeaderNavbar` — `src/components/HeaderNavbar.tsx`
- **Background:** `bg-white/95` (light) | `bg-slate-950/85` (dark)
- **Border:** `border-slate-200` (light) | `border-slate-800/80` (dark)
- **Radius:** `rounded-2xl` (nav container), `rounded-xl` (buttons)
- **Text:** `text-slate-900` (light) | `text-slate-100` (dark)
- **Hover:** `hover:bg-white` (light nav) | `hover:bg-slate-800/80` (dark nav)
- **Shadow:** `shadow-md` (light) | `shadow-xl` (dark)
- **Accent:** `bg-amber-500 text-slate-950` (active tab)

### `SlideCanvas` — `src/components/SlideCanvas.tsx`
- **Background:** `bg-slate-950` (always dark — it's the slide surface)
- **Border:** `border-slate-800`
- **Radius:** `rounded-2xl`
- **Note:** Canvas is always dark regardless of app theme (slide content renders on dark surface)

### `ManualEditor` — `src/components/ManualEditor.tsx`
- **Background:** `glass-card-fatty-light` (light) | `glass-card-fatty` (dark) for panel + side cards
- **Border:** `border-slate-200` (light) | `border-slate-800` (dark) — glass class provides the border internally
- **Radius:** `rounded-3xl` (panel), `rounded-2xl` (inner cards), `rounded-xl` (buttons/inputs)
- **Text:** `text-slate-900` (light) | `text-white` (dark)
- **Shadow:** `shadow-2xl`
- **Accent:** `bg-amber-500 text-slate-950` (primary button, active tab)
- **Page header:** `Edit3` amber gradient tile (`p-4 rounded-2xl from-amber-500 to-amber-300`) + `text-2xl lg:text-3xl font-black` title + mono badge (`Bangla · LaTeX · CSV`) + subtitle.
- **Live Parse Preview:** `p-4 rounded-2xl` card under the parse button — `Eye` emerald label + live MCQ count (`font-mono`); when `parsedPreview.length > 0` renders an `aspect-video` mock slide (`bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950`, amber glow blob, `MathText` stem, 2×2 option pills with correct answer `bg-amber-500/20 border-amber-500/50 text-amber-300`), else a dashed empty hint. `parsedPreview = parseBulkTextToMCQs(bulkText)` recomputed each render and reused by the parse button count.

### `AIUploader` — `src/components/AIUploader.tsx`
- **Background:** `glass-card-fatty-light` (light) | `glass-card-fatty` (dark) for main panel + result panel
- **Border:** `border-slate-200` (light) | `border-slate-800` (dark) — glass class provides the border internally
- **Radius:** `rounded-3xl` (panel), `rounded-2xl` (inputs, result cards)
- **Text:** `text-slate-900` (light) | `text-white` (dark)
- **Shadow:** `shadow-2xl`
- **Accent:** `bg-gradient-to-tr from-amber-500 to-amber-300` (header icon)
- **Key-status banner:** `p-4 rounded-2xl border` (`bg-amber-50/70 border-amber-200` light / `bg-slate-950/60 border-amber-500/20` dark) — `KeyRound` tile (`p-2 rounded-xl`), provider label (`text-xs font-black uppercase`), connected state with `CheckCircle2` + model code chip, or `AlertCircle` "No API key saved yet — add one in the Keys tab" warning. Reads localStorage only (no key input on this page).
- **Empty-state pipeline mock:** `min-h-[320px]` centered card — mock scan page (`bg-slate-950 p-3` skeleton bars + amber OCR highlight beams) → `Wand2` divider (`h-px bg-gradient` + icon) → structured output (`text-slate-200/80` stem bar + 2×2 option chips with `bg-emerald-500/60` correct one). Header chips "Stage 1 · Vision OCR" (amber) / "Stage 2 · Structuring" (emerald), `text-[10px] font-black uppercase tracking-widest`.

### `DeckManager` — `src/components/DeckManager.tsx`
- **Background:** `glass-card-fatty-light` (light) | `glass-card-fatty` (dark) for main panel
- **Border:** `border-slate-200` (light) | `border-slate-800` (dark) — glass class provides the border internally
- **Radius:** `rounded-3xl` (panel), `rounded-2xl` (question cards), `rounded-xl` (action buttons)
- **Text:** `text-slate-900` (light) | `text-white` (dark)
- **Shadow:** `shadow-2xl`
- **Accent:** `bg-amber-500 text-slate-950` (question number badge)
- **Selected:** `bg-amber-50 border-amber-400 ring-1 ring-amber-400/30` (light) | `bg-amber-500/10 border-amber-500/60` (dark)
- **Spacing (fatty):** Panel `p-8`, cards `p-5`, badges `w-9 h-9 rounded-xl text-sm`, stems `text-base`, action buttons `p-2`, icons `w-4 h-4`, list gap `space-y-4`, search `py-2.5 pl-10`, bulk tools `p-4`
- **Reordering:** `@dnd-kit/core` + `@dnd-kit/sortable` drag-and-drop. `DndContext` (PointerSensor with 5px activation distance + KeyboardSensor with `sortableKeyboardCoordinates`) wraps a `SortableContext` (vertical strategy) around the question cards. Drag disabled while search filter is active (`dragEnabled = searchQuery.trim() === ''`). MoveUp/MoveDown buttons removed — drag-and-drop is the only reorder mechanism.

### `SortableQuestionCard` — `src/components/SortableQuestionCard.tsx`
- **Purpose:** Sortable wrapper around each question card in `DeckManager`; uses `useSortable({ id, disabled })` from `@dnd-kit/sortable`
- **Background:** `bg-slate-50` (light) | `bg-slate-950/60` (dark) for unselected cards
- **Border:** `border-slate-200` (light) | `border-slate-800` (dark) — `border` with hover `hover:border-slate-300` / `hover:border-slate-700`
- **Radius:** `rounded-2xl`
- **Drag feedback:** `opacity-50 shadow-2xl z-50` applied via `isDragging` from `useSortable`; transform + transition applied inline from `CSS.Transform.toString(transform)`
- **Drag handle:** `GripVertical` icon (`w-4 h-4`) in `p-2 rounded-xl` button with `touch-none` + `cursor-grab active:cursor-grabbing`; listeners + attributes from `useSortable` spread onto the handle. Disabled state: `opacity-30 cursor-default` with title "Drag disabled while searching".
- **Action buttons:** Duplicate (`Copy`, amber hover), Delete (`Trash2`, rose) — same pattern as the pre-drag action row
- **Text:** `text-slate-800` (light) | `text-slate-300` (dark); stems `text-base font-bold`
- **Number badge:** `w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm`
- **Keyboard a11y:** handle is focusable (`role="button"`, `tabIndex`, `aria-roledescription="sortable"` from dnd-kit attributes); Space/Enter to pick up, arrows to move, Space/Enter to drop

### `DeckSettings` — `src/components/DeckSettings.tsx`
- **Background:** `glass-card-fatty-light` (light) | `glass-card-fatty` (dark) for main panel
- **Border:** `border-slate-200` (light) | `border-slate-800` (dark) — glass class provides the border internally
- **Radius:** `rounded-3xl` (sections), `rounded-2xl` (inner cards), `rounded-xl` (inputs)
- **Text:** `text-slate-900` (light) | `text-white` (dark)
- **Shadow:** `shadow-2xl`
- **Accent:** `bg-amber-500 text-slate-950` (selected font, scope button)
- **Typography (fatty):** form labels/controls `text-sm` minimum (section headers `text-base`, main heading `text-lg`); selects `px-3 py-2.5`, inputs `px-4 py-2.5`. The 16:9 `TemplateThumbnailPreview` keeps micro-fonts (`text-[7px]`–`text-[11px]`) because it is a scaled-down slide canvas.
- **Category tabs:** pill tab bar under the scope selector (`p-2 rounded-3xl border`, buttons `px-4 py-2.5 rounded-2xl text-sm font-black`); active tab `bg-amber-500 text-slate-950 ring-2 ring-amber-400/50`, inactive `text-slate-600 hover:bg-slate-100` (light) / `text-slate-400 hover:bg-slate-900` (dark). Tabs: Typography · Layout & Banners · Background · Theme & Preview · Header & Branding.
- **Banner-mode hint:** when Custom Banner header is active, the 3 manual text cards are replaced by an amber hint card (`bg-amber-50 border-amber-300` light / `bg-slate-900 border-amber-500/30` dark) with `ImageIcon` and two `text-sm` lines.

### `ExportModal` — `src/components/ExportModal.tsx`
- **Background:** `glass-card-fatty-light` (light) | `glass-card-fatty` (dark) for modal panel
- **Backdrop:** `bg-black/40` (light) | `bg-black/80` (dark)
- **Border:** `border-slate-200` (light) | `border-slate-800` (dark) — glass class provides the border internally
- **Radius:** `rounded-3xl` (modal), `rounded-2xl` (export option cards)
- **Text:** `text-slate-900` (light) | `text-white` (dark)
- **Shadow:** `shadow-2xl`
- **Accent:** `bg-gradient-to-r from-amber-500 to-amber-400` (PPTX button)

### `QuestionBankView` — `src/components/QuestionBankView.tsx`
- **Background:** `glass-card-fatty-light` (light) | `glass-card-fatty` (dark) for top banner
- **Border:** `border-slate-200` (light) | `border-slate-800` (dark) — glass class provides the border internally
- **Radius:** `rounded-3xl` (sections), `rounded-2xl` (deck cards, question cards)
- **Text:** `text-slate-900` (light) | `text-white` (dark)
- **Shadow:** `shadow-2xl`
- **Accent:** `bg-gradient-to-r from-amber-500 to-amber-400` (save button)
- **Selected:** `bg-amber-50 border-amber-500 ring-2 ring-amber-400/50` (light) | `bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/40` (dark)
- **Spacing (fatty):** Filter panel `p-6 lg:p-8`, section headers `text-lg`/`text-base`, search `py-3 pl-11` with `w-5 h-5` icon, filter selects `px-3.5 py-3`, action buttons `px-4 py-2`, question cards `p-5` with `w-6 h-6` checkboxes, stems `text-base`, option pills `p-2.5` with `w-6 h-6` key badges, deck cards `p-5` with `text-base` titles, command bar buttons `px-5 py-2.5` / `px-6 py-2.5`. All form text is `text-sm`+ (no `text-xs`/`text-[10px]` in the filter/card UI).
- **Share action:** every question card has a compact Share button (`px-3 py-1.5 rounded-xl border`, `Share2` `w-4 h-4` + label, `hover:scale-105`) wired to `onOpenInSocial(question)` — opens the question in the Social Post Generator. Amber text in both themes (`text-amber-700` light / `text-amber-300` dark).

### `SocialPostGenerator` — `src/components/SocialPostGenerator.tsx`
- **Background:** `glass-card-fatty-light` (light) | `glass-card-fatty` (dark) for header banner + 4 selector cards
- **Border:** `border-slate-200` (light) | `border-slate-800` (dark) — glass class provides the border internally
- **Radius:** `rounded-3xl` (panels), `rounded-2xl` (selector buttons)
- **Text:** `text-slate-900` (light) | `text-white` (dark)
- **Shadow:** `shadow-2xl` (panels), `shadow-xl` (sub-panels)
- **Accent:** `bg-amber-500 text-slate-950` (export button, header icon)
- **Picker filter bar:** Question picker (step 4) has a fatty search input (`py-3 pl-11`, `w-5 h-5` icon) + 3 filter selects (`px-3 py-2.5 text-sm`) mirroring the Question Bank filter (subject/board/type). Each select is icon-wrapped (`absolute left-3 top-1/2 -translate-y-1/2`, `pl-9` on the select) — `BookOpen`/`Landmark`/`LayoutGrid` — and emoji options (📚/🏛️/🧩) were removed. Picker items `p-3.5 text-sm` with `w-5 h-5` check icon; count shows `filtered / total`; empty state with `Filter` icon.
- **Add-box buttons (custom editor):** each button now carries a lucide icon — `Type` (stem), `List` (options), `CheckCircle2` (answer), `Sparkles` (explanation), `GraduationCap` (brand), `Heading` (headerTitle), `PenLine` (free) — pattern `flex items-center gap-1.5`.
- **Preselection from Question Bank:** accepts `preselectedItemId` prop; on mount it jumps `selectedQuestionIndex` + `selectedItemIds` to that question so a shared card opens directly in the post.
- **Section labels:** `text-sm font-black uppercase tracking-wider` (numbered steps 1–4).
- **Custom Design Editor:** 5th left-panel card with a toggle (`Enable Custom Mode` / `🎨 Custom Mode ON`; active state `bg-amber-500 text-slate-950 ring-2 ring-amber-400/50`). When ON: background-image card (`bg-amber-50/60 border-amber-200` light | `bg-slate-950 border-amber-500/30` dark) with Upload Image button (`rounded-xl border`, `hidden` file input), image URL text input, and clear ✕ badge; Add Text Box buttons (`px-3 py-2 rounded-xl text-xs font-bold border hover:scale-105`, amber text); selected-box style panel (`bg-amber-50/70 border-amber-300` light | `bg-slate-950 border-amber-500/40` dark) with bind `<select>`, free-text `<textarea>`, font-size slider (`accent-amber-500`), 8 color swatches (`w-6 h-6 rounded-lg`, active `ring-2 ring-amber-400 scale-110`) + native color input, align pills (active `bg-amber-500 text-slate-950`), bold toggle, Delete button (`border-rose-300 text-rose-600` light | `border-rose-500/40 text-rose-300` dark). Canvas in custom mode: boxes are drag handles with a `%`-positioned overlay — selected box `border-amber-400 ring-2 ring-amber-400/40`, label chip `bg-amber-500 text-slate-950 text-[9px] font-black uppercase`, resize handle `w-4 h-4 bg-amber-500 border-2 border-slate-950 cursor-nwse-resize`. Hint text: `text-xs` slate in both themes.
- **Export boundary (custom mode):** the `postCanvasRef` export node is a sibling of the editor overlay (overlay `absolute inset-0 z-20`), so `html2canvas` captures the card only — overlay handles/chips never appear in the exported PNG.

### `SlideTextBoxOverlay` / `SlideTextBoxPanel` — `src/components/`
- **Purpose:** deck-wide editable text-box overlay for slides (1920×1080 px coordinate system). Edit toggle lives in the preview toolbar next to Answer Reveal (active: `bg-amber-500 text-slate-950 border-amber-400`).
- **Box layer (SlideCanvas):** `absolute inset-0 z-20 pointer-events-none`, box text `fontSize`/`color`/`textAlign` via inline style, `whitespace-pre-wrap leading-snug`, bold via `font-black`/`font-bold`. Rendered INSIDE the exported slide.
- **Element rendering (SlideCanvas):** `icon` bind → centered lucide icon sized by `fontSize`, optional card/banner container (`rounded-3xl`, `bg`, 1px `rgba(255,255,255,0.12)` border, `0 20px 40px` shadow). `image` bind → `rounded-3xl` overflow-hidden `<img object-cover>` at `box.h`. `options` bind with `shape:'pill'` → `flex flex-wrap gap-3` chip rows (`px-6 py-2.5 rounded-full`); `shape:'card'` → `px-5 py-3.5 rounded-2xl` option rows. Text binds with `shape:'pill'` → inline-flex capsule (`px-7 py-2.5 rounded-full`); `card`/`banner` → padded container (`rounded-2xl`/`rounded-3xl`). All fills use `box.bg`, borders `rgba(255,255,255,0.12)`.
- **Edit overlay (not exported):** `absolute inset-0 z-30`, sibling of SlideCanvas inside the scaled wrapper. Selected box `border-amber-400 ring-2 ring-amber-400/40`; label chip `-top-7 text-xs font-black uppercase`, `bg-amber-500 text-slate-950` (selected) / `bg-slate-900 text-amber-300 border-white/20`; resize handle `w-6 h-6 bg-amber-500 border-2 border-slate-950 cursor-nwse-resize`. Icon/image boxes get a fixed `box.h`; the resize drag does **aspect-locked** w+h (ratio from the original box, 16:9 fallback) via `onResize(id, patch)`.
- **Panel:** `glass-card-fatty-light`/`glass-card-fatty` card; add-box buttons `px-3 py-2 rounded-xl text-xs font-bold` (amber text) now with a small lucide icon per bind (`BIND_ICONS` map). New sections (all `p-4 rounded-2xl border` on `bg-slate-50`/`bg-slate-950`):
  - **Design Elements:** 2-col grid of 6 element cards (`p-3 rounded-xl border`, amber icon tile `p-1.5 rounded-lg`, `text-xs font-extrabold` + `text-[10px]` desc) → `onAddElement(id, extra)`. Plus an "Upload Image / Banner" button (hidden file input → data-URL).
  - **Icon Library:** 6-col grid (`max-h-36 overflow-y-auto`), `p-2 rounded-lg` tiles, active `bg-amber-500 border-amber-400 text-slate-950`; click sets selected icon box or adds a new one.
  - **Quick Layouts:** 1-col list of 3 composed presets (`p-3 rounded-xl border`, `SquareStack` tile, `Plus` rotate-on-hover) → `onAddLayout(id)` replaces the deck's boxes (confirm in App).
  - **Style sub-panel** (`bg-amber-50/70 border-amber-300` light / `bg-slate-950 border-amber-500/40` dark): bind select, free-text textarea, icon sub-picker (when `bind==='icon'`), image preview + replace/URL input (when `bind==='image'`), Shape pills (Plain/Pill/Card/Banner), Container Fill (native color + Subtle White / Amber Glow / Sky Glow presets, shown when shape ≠ plain or image), font slider, height slider for icon/image, 8 color swatches (active `ring-2 ring-amber-400 scale-110`) + native picker, align pills (active `bg-amber-500 text-slate-950`), bold `B` toggle, Duplicate/Delete (rose).
- **Element data (slideElements.ts):** `SlideTextBox` extras `h?`, `shape?`, `bg?`, `iconName?`, `imageUrl?`; binds `'icon'`/`'image'`. `SLIDE_ICON_LIBRARY` = 30 curated lucide icons. `SLIDE_LAYOUTS` presets build full box sets (Modern Quiz amber / Clean Card sky / Minimal emerald).
- **Keys-tab sourcing (AIUploader):** no API-key input on the AI page — a read-only banner (`KeyRound` tile, provider + model code chip) mirrors `mcqgen.provider`/`mcqgen.geminiKey`/`mcqgen.openrouterKey`/`mcqgen.openrouterModel` from `SettingsView`.

### `SettingsView` — `src/components/SettingsView.tsx`
- **Background:** `glass-card-fatty-light` (light) | `bg-slate-950/85` (dark) — dark mode uses plain Tailwind because `glass-card-fatty` would override the slate-800 border
- **Border:** `border-slate-200` (light) | `border-slate-800/80` (dark)
- **Radius:** `rounded-3xl` (sections), `rounded-2xl` (provider cards, inputs)
- **Text:** `text-slate-900` (light) | `text-white` (dark)
- **Shadow:** `shadow-2xl`
- **Accent:** `bg-gradient-to-tr from-amber-500 to-amber-300` (header icon)
- **Typography (fatty):** labels/descriptions `text-sm` minimum, security banner `text-base`, API key inputs `px-4 py-4`.

### `ValidationPanel` — `src/components/ValidationPanel.tsx`
- **Background:** `bg-slate-50` (light) | `bg-slate-900` (dark)
- **Border:** `border-slate-200` (light) | `border-slate-800` (dark)
- **Radius:** `rounded-2xl`
- **Text:** `text-slate-900` (light) | `text-slate-100` (dark)
- **Accent:** `text-amber-700` (light) | `text-amber-300` (dark) for section header
- **Success:** `bg-emerald-50 border-emerald-300 text-emerald-800` (light) | `bg-emerald-500/10 border-emerald-500/30 text-emerald-300` (dark)

### `MathText` — `src/components/MathText.tsx`
- **Purpose:** KaTeX inline formula parser. No own styling — inherits from parent.

### `SlideDecksHome` — `src/components/SlideDecksHome.tsx`
- **Background:** `glass-card-fatty-light` (light) | `glass-card-fatty` (dark) for hero + tool cards
- **Border:** `border-slate-200` (light) | `border-slate-800` (dark) — `glass-card-fatty-light` provides the slate-200 border + shadow internally
- **Radius:** `rounded-3xl` (all cards)
- **Text:** `text-slate-900` (light) | `text-white` (dark)
- **Shadow:** provided by `glass-card-fatty-light` (light) | `shadow-xl` (dark, via `glass-card-fatty` + Tailwind)
- **Accent:** `bg-amber-500 text-slate-950` (primary buttons), `bg-indigo-600 text-white` (social tool)
- **Gotcha:** Never combine `glass-card-fatty` (dark) with `bg-white/95` in light mode — the unlayered CSS class wins over Tailwind v4 utilities, producing a grey bleed-through. Always swap to `glass-card-fatty-light` in light mode.
- **DeckSlideThumb (module-level):** real first-slide thumbnail — `aspect-video rounded-2xl overflow-hidden border border-white/10` container with `ResizeObserver`-scaled `SlideCanvas` (origin-top-left, `width:1920;height:1080;transform:scale(w/1920)`). Renders each deck's `items[0]` (guard for empty decks + zero-scale). Active badge `top-2 right-2 bg-amber-500 text-slate-950`, template badge `bottom-2 left-2 bg-black/55 backdrop-blur`, both `z-10`.
- **CtaPill (module-level):** tool-card link pill — `inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-black shadow-md` + `ArrowRight` (translate-x on group hover). Accent presets fill + swap label color on card hover: amber `group-hover:bg-amber-500 group-hover:text-slate-950`, indigo/emerald/violet variants.
- **Hero dashboard:** aurora glows (`-top-28 -right-20 blur-3xl`), "EdTech Studio Central Hub" pill, gradient headline (`bg-clip-text text-transparent`), 4 `heroChips` pills, Quick Sample buttons (`bg-amber-500/20 border-amber-500/40`), dual CTAs, Active Workspace stats card (`min-w-[260px]`).
- **Bento tool grid:** `lg:grid-cols-6`; Slide Studio `lg:col-span-4` (with mini slide mock), Social Posts `lg:col-span-2` (rotating portrait mock `rotate-3 group-hover:rotate-0`), AI/Bulk/QuestionBank `lg:col-span-2`, Branding `lg:col-span-6` (color dots `w-8 h-8 rounded-full`). Each card carries `group` + hover border tint.

### `App.tsx` (Overview Mode)
- **Background:** `bg-white` (light) | `bg-slate-900` (dark)
- **Border:** `border-slate-200` (light) | `border-slate-800` (dark)
- **Radius:** `rounded-3xl` (grid cards), `rounded-2xl` (controls)
- **Text:** `text-slate-900` (light) | `text-white` (dark)
- **Shadow:** `shadow-2xl`
- **Selected:** `bg-amber-50 border-amber-500 ring-2 ring-amber-400/50` (light) | `bg-amber-500/10 border-amber-500/60 ring-2 ring-amber-500/40` (dark)
- **Main content max-width:** `max-w-[1600px]` (bumped from `max-w-7xl` for more breathing room)

### `App.tsx` (Slide Studio / Preview Tab — fatty)
- **Grid gap:** `gap-10` between canvas column and deck manager column
- **Canvas container padding:** `p-4 sm:p-6 lg:p-8`
- **Control bar padding:** `p-5 rounded-3xl`
- **Nav buttons:** `p-2.5 rounded-xl` (prev/next), `px-4 py-2.5` (view all, answer reveal)
- **Theme toggle button:** `px-3 py-2 rounded-xl`
- **Control bar wrapping (anti-overlap):** outer `flex flex-wrap items-center justify-between gap-x-4 gap-y-3`; left group `flex flex-wrap items-center gap-3 min-w-0 flex-1`; right controls group `flex flex-wrap items-center gap-3` — **never `shrink-0`** on the controls group, or the buttons overflow the card at narrow widths instead of wrapping.

### Text-box overlay pattern (slide + social, shared look)
- **Editor overlay:** sibling of the export node (never captured). `absolute inset-0` layer; each box a draggable wrapper + an inner border box.
- **Box outline:** `border-white/40 rounded-lg` (unselected) → `border-amber-400 ring-2 ring-amber-400/40` (selected).
- **Label chip:** `absolute -top-7 left-0 text-xs font-black uppercase px-2 py-1 rounded leading-none`; `bg-amber-500 text-slate-950` selected, `bg-slate-900 text-amber-300 border border-white/20` unselected. Slide overlay flips to `top-full mt-1` when `box.y < 40` to avoid clipping against the preview's `overflow-hidden`.
- **Resize handle:** `absolute -bottom-3 -right-3 w-6 h-6 rounded-md border-2 border-slate-950 shadow cursor-nwse-resize`, `bg-amber-400` selected / `bg-amber-500` unselected.
- **Edit-mode toggle pattern:** design content renders ALWAYS (it is the export); the editor chrome (overlay + panel) renders only when a toggle is ON. Slide Studio: "Edit Text Boxes". Social custom mode: "Edit Design"/"Preview" (default OFF = clean preview). Exports go through the un-chromed node.

### `SidebarNav` — `src/components/SidebarNav.tsx`
- **Background:** `bg-white/95` (light) | `bg-slate-950/85` (dark) with `backdrop-blur-2xl`
- **Border:** `border-slate-200` (light) | `border-slate-800/80` (dark)
- **Width:** `w-64` (expanded) | `w-20` (collapsed) — transition `duration-300`
- **Collapse toggle:** Floating amber circle button (`w-6 h-6 rounded-full bg-amber-500`) on right edge, vertically centered
- **Collapsed mode:** Icons only (`w-5 h-5`), labels hidden, `title` attribute for tooltip
- **Expanded mode:** Icons + labels + badges
- **Persistence:** `localStorage` key `sidebar_collapsed` (boolean)
- **Accent:** `bg-amber-500 text-slate-950` (active nav item), `bg-gradient-to-r from-amber-500 to-amber-400` (export button)

---

## Planned components

| Component | Phase | Notes |
|---|---|---|
| Declarative `SlideStage` | 1 | Refactor renderer to declarative `Element[]` descriptor schema |
| ZIP Export Progress Dialog | 4 | Determinate progress dialog for multi-slide JSZip PNG package |

