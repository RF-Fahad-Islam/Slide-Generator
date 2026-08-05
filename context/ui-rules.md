# UI Rules

> How UI gets built here. Tokens are defined in `ui-tokens.md`; every component built
> must be registered in `ui-registry.md` (CLAUDE.md mandates updating it per feature).

## Component sourcing

1. **shadcn/ui first.** Use the installed shadcn component before writing anything
   custom. Load the `/shadcn` skill before adding/fixing/styling shadcn components.
2. Custom components only when shadcn has no equivalent (e.g. `SlideStage`, the
   review-list item, the validation panel).
3. One component, one responsibility; editor feature components live under
   `src/components/<feature>/`; primitives in `src/components/ui/`.

## Styling

- Semantic tokens only (see `ui-tokens.md`) — no raw hex, no raw Tailwind palette
  classes (`red-500`, `slate-200`) in components.
- Slide brand colors are runtime BrandKit data via CSS custom properties on the stage
  (D16) — never confuse with app chrome.
- No arbitrary values (`p-[13px]`) unless truly one-off; repeated magic numbers belong
  in the theme.

## Interaction & accessibility

- **Keyboard-first editor flows** (this is a data-entry-heavy tool): Tab between
  fields, Ctrl+Enter commits a question and starts a new one, arrow keys move between
  questions, Delete removes with confirm, Escape cancels.
- Focus management on dialogs and on the review screen (focus moves to the first
  flagged item after extraction completes).
- ARIA roles/labels on interactive lists (question list, review list); the slide
  canvas/preview is `role="img"` with a descriptive label.
- All destructive actions (delete question, discard extracted item, clear storage)
  require confirmation.

## Feedback patterns (project-specific)

- **AI confidence flags (D10):** AI-inferred answers render with `--warning` styling
  and a "confirm answer" affordance; they cannot be merged until confirmed. Accepted
  items use `--success`.
- **Validation panel:** a persistent list of problems (missing correct answer,
  duplicate options, over-long stem, numeral mismatch) with click-to-jump links.
  Never block silently; always show where the problem is.
- **Empty states:** every list (questions, review items, decks, templates) has a
  designed empty state with the next action ("Paste text to extract", "Add question").
- **Progress:** exports show determinate progress (a 40-question deck = 80 renders);
  AI extraction shows chunk progress ("questions 16–30 of ~45").
- **Errors:** plain-language, actionable, never containing API key material
  (see `auth-plan.md`).

## Rendering-stage rules

- `await document.fonts.ready` before any rasterization (D14).
- The preview IS the export source (same `SlideStage`, `transform: scale()` wrapper) —
  never maintain a separate preview renderer.
- KaTeX renders with `throwOnError: false`; a broken formula shows the raw source
  inline plus a validation warning, not a crash.

## Copy

- Concise, plain English UI copy; Bangla appears in CONTENT (stems, options), not in
  app chrome labels (v1).
