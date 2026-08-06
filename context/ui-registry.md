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
- **Batch edit toolbar:** "Batch Edit All in Editor" button (indigo pill, `ListChecks`) in the Active Deck Questions header loads every deck question into a `batchQueue`; while active the form shows an indigo toolbar (`bg-indigo-50 border-indigo-300` light / `bg-slate-950 border-indigo-500/40` dark) with a `X / N` mono counter + Prev/Next wraparound buttons + Done. `prefillEditItem`/`onPrefillConsumed` props let the `EditQuestionModal`'s "Open in Question Editor" hand a specific question straight into the form.

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
- **Action buttons:** Pencil Edit (indigo hover, opens the inline `EditQuestionModal`), Duplicate (`Copy`, amber hover), Delete (`Trash2`, rose) — all `p-2 rounded-xl` icons; drag handle first. Same pattern as the pre-drag action row
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
- **Category tabs:** pill tab bar under the scope selector (`p-2 rounded-3xl border`, buttons `px-4 py-2.5 rounded-2xl text-sm font-black`); active tab `bg-amber-500 text-slate-950 ring-2 ring-amber-400/50`, inactive `text-slate-600 hover:bg-slate-100` (light) / `text-slate-400 hover:bg-slate-900` (dark). Tabs: Typography · Layout & Banners · Background · Theme & Preview · Header & Branding · Templates.
- **Banner-mode hint:** when Custom Banner header is active, the 3 manual text cards are replaced by an amber hint card (`bg-amber-50 border-amber-300` light / `bg-slate-900 border-amber-500/30` dark) with `ImageIcon` and two `text-sm` lines.
- **Templates tab (saved preset templates):** section card `p-6 rounded-3xl` with `LayoutTemplate` amber section header. **Save Current Design card:** `p-5 rounded-2xl border` (`bg-amber-50 border-amber-300` light / `bg-slate-900 border-amber-500/40` dark) — name input (`px-4 py-2.5`), Save button `bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20`, optional description input, footnote (`text-[11px]`) noting presets are visual-design-only (content not saved). **Saved grid:** `md:grid-cols-2 gap-4`; card `p-4 rounded-2xl border` with theme swatch tile (`w-14 h-14 rounded-2xl`, bg from design, `w-6 h-6 rounded-full` accent dot) + name + description/date; active state `bg-amber-50 border-amber-400 ring-2 ring-amber-400/50` (light) / `bg-amber-500/10 border-amber-500/50 ring-2 ring-amber-500/40` (dark) + `CheckCircle2` "Active" badge; actions: "Switch to This Template" (`bg-amber-500 text-slate-950 font-black`, disabled+`cursor-default` when active) + Delete (`border-rose-300 text-rose-600` light / `border-rose-500/40 text-rose-300` dark, confirm-guarded). Empty state: dashed `p-6 rounded-2xl` card with `LayoutTemplate` icon + two lines.
- **App toolbar quick switcher:** "Switch Template…" dropdown (LayoutTemplate icon, `px-2.5 py-1.5 rounded-xl border`, `hidden xl:flex`) in the Slide Studio controls bar — selects a saved preset and applies `applyDesignToConfig(preset, config)`.

### `SlideThumb` — `src/components/SlideThumb.tsx`
- **Purpose:** real slide thumbnail — renders the exact `SlideCanvas` render (template + text boxes + per-slide `customConfig` overrides) at card scale via the ResizeObserver technique (`clientWidth / 1920`, `origin-top-left` scaled wrapper in `aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-slate-950`). Props: `item`, `config`, `index`, `totalCount`, `isAnswerRevealMode?`, `className?`. Used in the "View All Slides" overview grid (replacing the abstract stem/options mock) and the Template Creator live preview.

### `TemplateCreator` — `src/components/TemplateCreator.tsx`
- **Purpose:** dedicated "Template Creator" page (sidebar nav item, `LayoutTemplate` icon) for designing and saving custom slide formats separately. Tab union extended with `'templates'`.
- **Shell:** `glass-card-fatty-light`/`glass-card-fatty` panel, page identity bar (amber gradient `LayoutTemplate` tile, "Custom Templates" mono badge), `lg:grid-cols-12` split — designer controls (`lg:col-span-5`) + preview/saved (`lg:col-span-7`).
- **Designer cards** (each `p-5 rounded-2xl border` on `bg-slate-50`/`bg-slate-950`): Template Name & Notes (name + optional desc inputs); Base Theme (2-col grid of `TEMPLATES` minus custom-theme, `previewGradient` strip + name + ☀️/🌙 badge, active `bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/40`); Accent Color (swatches + native picker); Font Family (select of `FONT_PRESETS`); Slide Background (2-col grid of `BACKGROUND_PRESETS` with `previewGradient` strip). Actions: indigo "Apply to Current Deck" (`onApplyConfig`) + amber "Save as Template" (`saveTemplatePreset`, disabled until named).
- **Live Preview:** `SlideThumb` with `candidateConfig = { ...config, templateId, accentColorCustom, fontFamily, bgPreset }` and `previewItem = items[0] || FALLBACK_ITEM` (hardcoded Bangla sample MCQ).
- **My Templates:** `md:grid-cols-2` grid, card with name + Active badge + desc, "Use Template" (amber, disabled when active, `onApplyTemplate`) + Delete (rose, confirm). Active detection = same `templateId` + equal `customTheme` against the real deck config.

### `ExportModal` — `src/components/ExportModal.tsx`
- **Background:** `glass-card-fatty-light` (light) | `glass-card-fatty` (dark) for modal panel
- **Backdrop:** `bg-black/40` (light) | `bg-black/80` (dark)
- **Border:** `border-slate-200` (light) | `border-slate-800` (dark) — glass class provides the border internally
- **Radius:** `rounded-3xl` (modal), `rounded-2xl` (export option cards)
- **Text:** `text-slate-900` (light) | `text-white` (dark)
- **Shadow:** `shadow-2xl`
- **Accent:** `bg-gradient-to-r from-amber-500 to-amber-400` (PPTX button)

### `TemplateLibraryModal` — `src/components/TemplateLibraryModal.tsx`
- **Purpose:** Template store — save the current slide format as a template and switch between saved templates. Opened from the Slide Studio controls-bar "Templates" button (`App` `isTemplateModalOpen`).
- **Shell:** ExportModal-style fixed overlay (`z-50`, backdrop-blur, `max-w-3xl`, `max-h-[92vh] overflow-y-auto`), header tile `p-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300` (`LayoutTemplate`), title "Template Store".
- **Save card:** `p-5 rounded-2xl` amber (`bg-amber-50 border-amber-300` light / `bg-slate-950 border-amber-500/40` dark) — name input + amber Save button + optional description + `text-[11px]` note that content isn't saved and same-name overwrites. Calls `saveTemplatePreset(name, config, desc)` then refreshes.
- **My Templates grid:** `md:grid-cols-2 gap-4`; card `p-4 rounded-2xl` with theme swatch (`w-14 h-14 rounded-2xl` bg + accent dot) + name + desc/date; Active badge (`bg-amber-500 text-slate-950`, `CheckCircle2`); actions "Use This Template" (amber, disabled when active) + Delete (rose, confirm). Active detection = same `templateId` + equal `customTheme`. Empty state = dashed card with `Sparkles`.

### `EditQuestionModal` — `src/components/EditQuestionModal.tsx`
- **Purpose:** Inline edit of a deck question, opened from the new Pencil icon on every `SortableQuestionCard` (via `DeckManager onEditQuestion` → `App editingQuestion`).
- **Shell:** ExportModal-style overlay (`max-w-2xl`), header tile `Edit3` gradient, title "Edit Question".
- **Form:** question-type pills, stem input, bohupodi roman-items block (indigo/amber), 4-option grid (amber key badge, transparent text input, "✓ Correct"/"Answer" toggle button), source + explanation inputs.
- **Actions:** indigo "Open in Question Editor" (`ArrowUpRight`, saves changes, closes, switches App to the `manual` tab and hands the item to `ManualEditor` via `prefillEditItem`); amber "Save Changes" updates `items` in place.

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
- **Edit scope:** boxes are deck-wide (`config.slideTextBoxes`) by default; "Current Slide Only" mode stores per-slide boxes in `items[selectedIndex].customConfig.slideTextBoxes`. Panel scope selector card ("Apply Box Changes To"): All Slides active `bg-amber-500 text-slate-950` + `Globe` icon; Current Slide Only active `bg-indigo-600 text-white` + `Target` icon. When a slide override is active a "Reset Slide to All-Slides" button (amber outline, `RotateCcw` icon) reverts to the deck-wide boxes. Switching to slide scope snapshots the deck-wide boxes onto the active slide so the visible layout doesn't change.
- **Box layer (SlideCanvas):** `absolute inset-0 z-20 pointer-events-none`, box text `fontSize`/`color`/`textAlign` via inline style, `whitespace-pre-wrap leading-snug`, bold via `font-black`/`font-bold`. Rendered INSIDE the exported slide.
- **Element rendering (SlideCanvas):** `icon` bind → centered lucide icon sized by `fontSize`, optional card/banner container (`rounded-3xl`, `bg`, 1px `rgba(255,255,255,0.12)` border, `0 20px 40px` shadow). `image` bind → `rounded-3xl` overflow-hidden `<img object-cover>` at `box.h`. `options` bind with `shape:'pill'` → `flex flex-wrap gap-3` chip rows (`px-6 py-2.5 rounded-full`); `shape:'card'` → `px-5 py-3.5 rounded-2xl` option rows. Text binds with `shape:'pill'` → inline-flex capsule (`px-7 py-2.5 rounded-full`); `card`/`banner` → padded container (`rounded-2xl`/`rounded-3xl`). All fills use `box.bg`, borders `rgba(255,255,255,0.12)`.
- **Edit overlay (not exported):** `absolute inset-0 z-30`, sibling of SlideCanvas inside the scaled wrapper. Selected box `border-amber-400 ring-2 ring-amber-400/40`; label chip `-top-7 text-xs font-black uppercase`, `bg-amber-500 text-slate-950` (selected) / `bg-slate-900 text-amber-300 border-white/20`; resize handle `w-6 h-6 bg-amber-500 border-2 border-slate-950 cursor-nwse-resize`. Icon/image boxes get a fixed `box.h`; the resize drag does **aspect-locked** w+h (ratio from the original box, 16:9 fallback) via `onResize(id, patch)`. **Chip-below rule:** label chip flips to `top-full mt-1` when `chipBelow = box.y < 56 || box.y + boxH + 28 <= SLIDE_H` so it never pokes toward the controls bar above the canvas; only uses `-top-7` when below the box would clip at the slide bottom.
- **Import from Deck Config:** panel section "Import from Deck Config" — 2-col grid (`grid-cols-2 gap-2`) of the deck's saved images; each tile `p-2.5 rounded-xl border` with thumbnail (`h-12 w-full object-cover rounded-lg`), `text-xs font-extrabold` label + `text-[10px]` source hint (`logoUrl`, `headerBannerUrl`, …); active tile `bg-amber-500/10 border-amber-400`; click sets the selected image box's `imageUrl` or adds a banner element (`onAddElement('banner_image', { imageUrl })`); empty state shows "No images saved in deck config yet". Sources: Brand Logo (`logoUrl`), Header Banner (`headerBannerUrl`), Footer Banner (`footerBannerUrl`), Watermark Avatar (`watermarkAvatar`), Background Image (`bgImageUrl`).
- **Panel (Canva-style side rail):** `glass-card-fatty-light`/`glass-card-fatty` card, `rounded-3xl flex flex-col`, internally scrollable (`xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto`), rendered in the right grid column when edit mode is ON (sticky via `xl:sticky xl:top-20`). Header: `p-2.5 rounded-2xl` amber gradient tile (`Layers` icon) + title "Text Box Editor" + live subtitle (`Editing: {bind}` / box count) + close ✕ (`onClose`). Scope: compact segmented control ("All Slides" amber active + Globe / "This Slide" indigo active + Target) with a `RotateCcw` revert button shown when a slide override exists. **Promote button:** when a slide override is active a full-width "Use This Layout for All Slides" button (`Copy` icon, amber outline) renders under the scope control → `onApplySlideLayoutToAll` (promotes theme + box layout to every slide). Tab bar: `p-1 rounded-2xl border` row of pill tabs (Style · Text · Elements · Photos · Layouts), active `bg-amber-500 text-slate-950`, Style only appears when a box is selected — selecting a box on canvas auto-jumps to Style (`prevSelected` ref). Body renders one tab at a time.
  - **Style tab:** Layers list (`p-4 rounded-2xl`, reversed top-first rows: number badge, bind label, ↑/↓ reorder via `onReorderBox` — up = bring-forward/down = send-back in the array, disabled at bounds, click row → `onSelectBox`) + the full selected-box style sub-panel (bind select, free text, icon picker, image preview/replace/URL, Shape pills, Container Fill, font-size slider, height slider for icon/image, text-color swatches + picker, align pills, bold B, Duplicate/Delete).
  - **Text tab:** "Add Text Box" grid (`grid-cols-2`) of `SLIDE_BOX_BINDS` with per-bind icons.
  - **Elements tab:** Design Elements 2-col grid + "Upload Image / Banner" button (shared hidden file input).
  - **Photos tab:** "Import from Deck Config" 2-col thumbnail grid (`CONFIG_IMAGE_SOURCES`) + Upload button.
  - **Layouts tab:** Quick Layouts 1-col list + scope-aware note.
  - **Footer:** Reset to Default Layout / Clear All row.
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
- **Overview cards:** each card now renders the **exact real slide** via `SlideThumb` (header bar with slide number/Active/theme badge kept, abstract stem/options mock removed). Header has a "Switch Template" button (neutral bordered pill, `LayoutTemplate` amber icon) that opens the `TemplateLibraryModal`.

### `App.tsx` (Slide Studio / Preview Tab — fatty)
- **Grid gap:** `gap-10` between canvas column and deck manager column
- **Deck-name header (top of studio):** `p-5 rounded-3xl border shadow-xl` bar — amber gradient `FileText` tile, "Active Deck" label (`text-[10px] uppercase tracking-widest`) + `{N} slide(s)` mono badge, `deckName` as `text-base sm:text-lg font-black truncate` headline, and a hidden-md Theme chip (`Presentation` icon + `activeTemplate.name`). Always visible in the preview tab (above the overview/single toggle).
- **Apply Slide Design to All:** toolbar button (`Copy` amber icon, neutral bordered pill, label hidden below `xl`) calls `applyActiveSlideDesignToAll()` — promotes the active slide's `customConfig` (theme + design fields + `slideTextBoxes`) into the deck `config`, strips every per-slide `customConfig` override, resets box scope to `global`, confirm-guarded.
- **Canvas container padding:** `pt-8 sm:pt-10 lg:pt-12 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8` — generous top padding keeps slide-top boxes clear of the controls bar.
- **Control bar padding:** `p-5 rounded-3xl`
- **Nav buttons:** `p-2.5 rounded-xl` (prev/next), `px-4 py-2.5` (view all, answer reveal)
- **Theme toggle button:** `px-3 py-2 rounded-xl`
- **Templates button:** "Templates" toolbar button (`LayoutTemplate` amber icon, neutral bordered pill) opens the `TemplateLibraryModal`.
- **Edit-mode grid restructure:** when "Edit Text Boxes" is ON the grid re-balances — canvas column `xl:col-span-8` (from 7) and the right column becomes `xl:col-span-4` holding the Canva-style `SlideTextBoxPanel` in a sticky wrapper (`xl:sticky xl:top-20`); when OFF the right column is `xl:col-span-5` with the `DeckManager`. Closing the panel (`onClose`) toggles edit mode off and restores the question list.
- **Control bar wrapping (anti-overlap):** outer `flex flex-wrap items-center justify-between gap-x-4 gap-y-3`; left group `flex flex-wrap items-center gap-3 min-w-0 flex-1`; right controls group `flex flex-wrap items-center gap-3` — **never `shrink-0`** on the controls group, or the buttons overflow the card at narrow widths instead of wrapping.

### Text-box overlay pattern (slide + social, shared look)
- **Editor overlay:** sibling of the export node (never captured). `absolute inset-0` layer; each box a draggable wrapper + an inner border box.
- **Box outline:** `border-white/40 rounded-lg` (unselected) → `border-amber-400 ring-2 ring-amber-400/40` (selected).
- **Label chip:** `absolute -top-7 left-0 text-xs font-black uppercase px-2 py-1 rounded leading-none`; `bg-amber-500 text-slate-950` selected, `bg-slate-900 text-amber-300 border border-white/20` unselected. Slide overlay flips to `top-full mt-1` when `box.y < 40` to avoid clipping against the preview's `overflow-hidden`.
- **Resize handle:** `absolute -bottom-3 -right-3 w-6 h-6 rounded-md border-2 border-slate-950 shadow cursor-nwse-resize`, `bg-amber-400` selected / `bg-amber-500` unselected.
- **Edit-mode toggle pattern:** design content renders ALWAYS (it is the export); the editor chrome (overlay + panel) renders only when a toggle is ON. Slide Studio: "Edit Text Boxes". Social custom mode: "Edit Design"/"Preview" (default OFF = clean preview). Exports go through the un-chromed node.

### `SidebarNav` — `src/components/SidebarNav.tsx`
- **Background:** `bg-white/85` (light) | `bg-slate-950/90` (dark) with `backdrop-blur-2xl`
- **Border:** `border-slate-200` (light) | `border-white/5` (dark)
- **Width:** `w-72` (expanded) | `w-24` (collapsed) — transition `duration-300`
- **Brand lockup:** amber gradient logo tile (`rounded-2xl`, `ring-1 ring-inset ring-white/40`, `group-hover:scale-105`) + "EdTech Studio" (`text-base font-black`) + "Slide Generator" subtitle (`text-[10px] uppercase`) + live save status (`Loader2` spin "Syncing…" / emerald pulse dot + `"Saved HH:MM"` or "All changes saved").
- **Nav grouping:** three labelled sections (Workspace / Create / Manage) with `text-[9px] font-black uppercase tracking-[0.18em]` section labels (hidden when collapsed). Slide Studio keeps its question-count badge.
- **Nav item:** icon inside a `w-8 h-8 rounded-xl` tile (`bg-white text-amber-600 border-slate-200 shadow-sm` light / `bg-white/5 text-amber-400` dark). Active = amber gradient pill (`bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 text-slate-950 shadow-lg shadow-amber-500/30`) + left edge indicator bar (`w-1 h-7 rounded-r-full bg-slate-950/40`). Inactive hover `hover:bg-slate-100` (light) / `hover:bg-white/5` (dark). `aria-current` set on active.
- **Collapse toggle:** Floating amber gradient circle (`w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-500`, `border-2 border-slate-950` dark) on right edge, vertically centered.
- **Collapsed mode:** Icons only (icon tile `w-9 h-9`), labels hidden, `title` attribute for tooltip. Bottom actions render as icon tiles.
- **Bottom actions:** shared `renderBottomAction` row — Start Tour (`HelpCircle`), Theme toggle (Sun/Moon), and a gradient amber **Export Slides** button (`bg-gradient-to-r from-amber-500 to-amber-400`, disabled + `opacity-50` when no questions). Each with an icon tile.
- **Persistence:** `localStorage` key `sidebar_collapsed` (boolean)
- **Tour anchors:** every nav button carries `data-tour="nav-<id>"`; export button `data-tour="studio-export"`.
- **Collapse toggle placement:** hidden on mobile (`lg:hidden` mobile top bar + slide-in drawer `w-80 max-w-[85vw]`); mobile header mirrors the brand lockup + hamburger + quick export.

### `OnboardingTour` — `src/components/OnboardingTour.tsx`
- **Overlay:** `fixed inset-0 z-[9999] overflow-hidden`.
- **Focus hole (replaces the old full-scrim):** the dimming is **four clickable quadrant divs** (`bg-slate-950/80 backdrop-blur-[2px] transition-all duration-300`) around the target instead of one full-screen backdrop. The hole itself has NO overlay — the focused element stays razor sharp (no dim, no blur over it) and **clicks inside the hole pass through to the real UI**, so interacting with the highlighted control does NOT advance/exit the tour. Each quadrant `onClick` advances (closes on last). When no rect yet / target missing → single full-screen dim + centered tooltip.
- **Focus ring:** `rounded-2xl border-2 border-amber-400 pointer-events-none` with layered glow `boxShadow: '0 0 0 3px rgba(245,158,11,0.35), 0 0 0 9px rgba(245,158,11,0.12), 0 0 42px rgba(245,158,11,0.5)'`.
- **Measure vs reveal split:** `measure()` only reads `getBoundingClientRect()` (padded by `PAD=10`); `scrollIntoView({ block:'center' })` runs ONCE per step change (via `revealAndMeasure`). Resize/scroll listeners call plain `measure` only — no `scrollIntoView` on every scroll (prevents jitter/feedback loops).
- **Element polling:** after a tab navigation the target is polled (24×150ms) then falls back to a centered tooltip when it never appears (e.g. mobile-hidden nav anchors).
- **Keyboard:** Enter/→ next, ← back, Esc close — but the Enter/arrow shortcuts are **ignored while focus is on a real control** (`isInteractiveTarget`: button/a/input/textarea/select/contenteditable) so pressing Enter in a focused button can't randomly advance or exit the tour.
- **Tooltip card:** `w-[360px] max-w-[90vw] rounded-3xl border-amber-500/30 bg-slate-900 text-white shadow-2xl`; amber gradient top strip (`h-1.5`), title row with amber `Presentation` tile, close ✕, `text-xs` body, Back / gradient amber Next-or-Done buttons, progress dots (`w-5 h-1.5` current vs `w-1.5 h-1.5` rest), bottom-right mono step counter chip. Tooltip flips below↔above the hole when it would overflow.
- **State:** auto-launch on first visit gated by `localStorage['edtech_tour_done']`; reopen via `onStartTour` from Home hero + sidebar.

### ExportModal — Question Paper & Extract cards
- **Export card pattern:** `p-5 rounded-2xl border` flex row (title + muted subtitle left, bordered accent button right). Colored accents per feature: PPTX amber gradient, Google Slides blue, Question Paper violet (`bg-violet-50 border-violet-300 text-violet-700` light / `bg-slate-800 text-violet-300 border-slate-700` dark), PDF emerald, ZIP amber, PNG slate.
- **Segmented selector:** MCQs-per-page = `[2,3,4,6]` buttons `w-9 h-8 rounded-lg text-xs font-black border`; active = `bg-amber-500 text-slate-950 border-amber-400`, inactive uses the theme palette.
- **Checkbox:** `w-4 h-4 accent-amber-500 rounded` inside a `flex items-center gap-2 text-xs font-bold` label.

### `QuestionBankPdfModal` — `src/components/QuestionBankPdfModal.tsx`
- **Purpose:** export selected Question Bank MCQs as an A4 portrait PDF with slide-style header/footer. Opened from the Question Bank selection command bar ("Export Selected as PDF", indigo accent button, `FileText` icon, counts `({N})`).
- **Modal shell:** same pattern as ExportModal — `fixed inset-0 z-50` backdrop-blur overlay, `glass-card-fatty-light`/`glass-card-fatty` `max-w-4xl` panel, close ✕ top-right, amber gradient `FileText` tile header ("Export Selected MCQs as PDF" + subtitle with selected count).
- **Options grid:** `grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl border` (inset `bg-slate-50`/`bg-slate-950`) — three controls: File Name text input (`px-3.5 py-2.5 rounded-xl`, default `${brandName}_MCQs`), Template `<select>` (option 0 = "Custom Built Theme (current deck)" when `config.customTheme` exists, then all `TEMPLATES`), and MCQs-per-page segmented `[2,3,4,6]` (flex buttons `h-10 rounded-lg`, active `bg-amber-500 text-slate-950 border-amber-400`).
- **Effective config:** `{ ...config, templateId, customTheme: templateId === 'custom-theme' ? config.customTheme : undefined }` — so header/footer accent follows the selected template.
- **Live preview:** "Preview — Page 1 of N (M MCQs)" header with selected template name; scaled page `transform: scale(0.56)` origin-top-left inside a grey `#94a3b8` scroll container (`height = 1123 × 0.56`, `rounded-2xl border overflow-hidden`).
- **A4 page theme:** `PaperPage` (794×1123 white) — header: `borderBottom: 3px solid accent` (accent = `config.accentColorCustom || template.styles.accentColor`), brand name uppercase (`titleInk`), headerTitle in accent, badgeTag pill filled with `#${colors.badgeFill}`/`colors.badgeText`; body: MCQ cards (`border 1px cardBorder`, `rounded-10`, number chip `background: accent`), options 2-col grid with accent keys; footer: watermarkHandle · `Page N of M` · footerTag (both accent).
- **Export flow:** `document.fonts.ready` → per-page `toPng(pixelRatio: 2, cacheBust)` on the offscreen `OffscreenPage` ref → jsPDF A4. The offscreen node's slice is swapped per page via `renderSlice` state; filename sanitized (`[\\/:*?"<>|]` → `_`, `.pdf` suffix enforced). Progress label swaps into the Download button (`Loader2` spinner).

---

## Planned components

| Component | Phase | Notes |
|---|---|---|
| Declarative `SlideStage` | 1 | Refactor renderer to declarative `Element[]` descriptor schema |
| ZIP Export Progress Dialog | 4 | Determinate progress dialog for multi-slide JSZip PNG package |

