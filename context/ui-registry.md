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

### `AIUploader` — `src/components/AIUploader.tsx`
- **Background:** `glass-card-fatty-light` (light) | `glass-card-fatty` (dark) for main panel + result panel
- **Border:** `border-slate-200` (light) | `border-slate-800` (dark) — glass class provides the border internally
- **Radius:** `rounded-3xl` (panel), `rounded-2xl` (inputs, result cards)
- **Text:** `text-slate-900` (light) | `text-white` (dark)
- **Shadow:** `shadow-2xl`
- **Accent:** `bg-gradient-to-tr from-amber-500 to-amber-300` (header icon)

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
- **Picker filter bar:** Question picker (step 4) has a fatty search input (`py-3 pl-11`, `w-5 h-5` icon) + 3 filter selects (`px-3 py-2.5 text-sm`) mirroring the Question Bank filter (subject/board/type). Picker items `p-3.5 text-sm` with `w-5 h-5` check icon; count shows `filtered / total`; empty state with `Filter` icon.
- **Preselection from Question Bank:** accepts `preselectedItemId` prop; on mount it jumps `selectedQuestionIndex` + `selectedItemIds` to that question so a shared card opens directly in the post.
- **Section labels:** `text-sm font-black uppercase tracking-wider` (numbered steps 1–4).
- **Custom Design Editor:** 5th left-panel card with a toggle (`Enable Custom Mode` / `🎨 Custom Mode ON`; active state `bg-amber-500 text-slate-950 ring-2 ring-amber-400/50`). When ON: background-image card (`bg-amber-50/60 border-amber-200` light | `bg-slate-950 border-amber-500/30` dark) with Upload Image button (`rounded-xl border`, `hidden` file input), image URL text input, and clear ✕ badge; Add Text Box buttons (`px-3 py-2 rounded-xl text-xs font-bold border hover:scale-105`, amber text); selected-box style panel (`bg-amber-50/70 border-amber-300` light | `bg-slate-950 border-amber-500/40` dark) with bind `<select>`, free-text `<textarea>`, font-size slider (`accent-amber-500`), 8 color swatches (`w-6 h-6 rounded-lg`, active `ring-2 ring-amber-400 scale-110`) + native color input, align pills (active `bg-amber-500 text-slate-950`), bold toggle, Delete button (`border-rose-300 text-rose-600` light | `border-rose-500/40 text-rose-300` dark). Canvas in custom mode: boxes are drag handles with a `%`-positioned overlay — selected box `border-amber-400 ring-2 ring-amber-400/40`, label chip `bg-amber-500 text-slate-950 text-[9px] font-black uppercase`, resize handle `w-4 h-4 bg-amber-500 border-2 border-slate-950 cursor-nwse-resize`. Hint text: `text-xs` slate in both themes.
- **Export boundary (custom mode):** the `postCanvasRef` export node is a sibling of the editor overlay (overlay `absolute inset-0 z-20`), so `html2canvas` captures the card only — overlay handles/chips never appear in the exported PNG.

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

