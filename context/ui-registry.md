# UI Registry

> CLAUDE.md mandates updating this after EVERY feature (run `/imprint` after building
> a UI component). Purpose: every new component matches what came before.

## Entry format (copy this block per component)

```
### <ComponentName> — src/components/<path>
- Purpose: one line.
- Built: Phase N, date.
- Tokens used: bg-*, text-*, border-* (semantic only).
- Patterns: layout approach, keyboard handling, states (empty/loading/error).
- Reuse notes: when to use vs. not; variants.
```

## Established patterns (fill in as components land)

| Pattern | Decision | First used in |
|---|---|---|
| App shell | — pending Phase 2 — | |
| Lists (questions, review) | — pending — | |
| Dialogs | — pending — | |
| Forms | — pending — | |
| Feedback (confidence flags) | `--warning` + must-confirm (D10) | planned: review screen |
| Validation panel | persistent list + jump-to links | planned: deck editor |
| Progress | determinate bar + label | planned: export dialog |

## Registered components

_None yet — repo is pre-scaffold. First entries expected in Phase 2 (review screen,
deck editor shell, settings)._

## Planned components (from build plan — move above when built)

| Component | Phase | Notes |
|---|---|---|
| `SlideStage` | 1 | THE one DOM renderer; preview + PNG source. `role="img"`, fonts.ready guard |
| Review list + item | 2 | accept/edit/discard; confidence flag styling (D10) |
| Deck editor shell | 2→3 | question list + per-question form; minimal in 2, full in 3 |
| Settings (BYOK) | 2 | key input, privacy copy, AI Studio link |
| Export dialog | 2→4 | format/ratio/kinds/filename + determinate progress |
| Validation panel | 3 | jump-to-problem links |
| Bulk-paste textarea | 3 | paste → parse preview → commit |
| Template/token studio | 5 | clone built-in, token fields, live preview |
