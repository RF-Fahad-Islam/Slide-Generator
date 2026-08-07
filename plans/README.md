# Animation Plans

Plans written by `improve-animations`. Each plan is self-contained for a zero-context
executor — commit stamp, exact file:line references, verbatim target CSS, and verification.

| # | Title | Severity | Category | Status |
| --- | --- | --- | --- | --- |
| 001 | Animate modal entrances with fade + scale(0.96) | HIGH (leverage) | Missed opportunity / jarring change | DONE (merged `92d18fd`) |
| 002 | Add reduced-motion handling and gate hover transforms | MEDIUM | Accessibility | DONE (merged `92d18fd`) |
| 003 | Symmetric mobile drawer exit | MEDIUM | Spatial consistency | DONE (merged `92d18fd`) |
| 004 | IngestionToast entrance/exit (symmetric bottom-edge path) | MEDIUM | Missed opportunity / spatial consistency | DONE (merged `92d18fd`) |
| 005 | Press feedback on icon action buttons | LOW | Missed opportunity / feedback | DONE (merged `92d18fd`) |
| 006 | Onboarding tour tooltip entrance (per-step) | LOW | Missed opportunity / delight | DONE (merged `92d18fd`) |

## Recommended execution order

1. **001 → 003 → 002** — executed in worktree `anims/001-003`, merged to main (`92d18fd`).
2. **004 → 005 → 006** — the second sweep's survivors. 004 and 005 both edit
   `IngestionToast.tsx` (005 also touches the Dismiss button's `onClick` site that 004
   rewires) — run 004 first, then 005 in the same pass so the button gets both the
   `closeToast` handler and the `btn-icon` class. 006 is independent. All three executed in
   worktree `anims/001-003`, merged to main (`92d18fd`).

## Notes from the merge (commit `92d18fd`)

- **Plan 003 adapted post-audit**: while the worktree was in flight, `main` advanced to
  `7e7fd8b` which lifted the mobile drawer state from `SidebarNav` into `App` (controlled
  prop). The rebase resolved plan 003 against that: `SidebarNav` keeps the local `isClosing`
  state + `closeTimer` for the exit animation but now calls the parent `onCloseMobileDrawer`
  after the 200ms exit (instead of `setIsMobileDrawerOpen(false)`). `EditQuestionModal`
  auto-merged cleanly.
- Plan 004 used `React.useState` (the file has no named `useState` import) — behavior identical.

## Dependencies

- 001–003 each ship their own reduced-motion overrides; 002 additionally provides the
  app-wide `prefers-reduced-motion` + `(hover: none)` blocks. 004–006 add their own small
  reduced-motion overrides for their own selectors — no conflicts (multiple media blocks in
  `index.css` are fine).
- 004 and 005 share `IngestionToast.tsx` — same execution pass, 004 first.
- Deferred (passed the gate, not planned): deck-question list add/remove entrance —
  `DeckManager.tsx:222-239` keys cards `${item.id}_${idx}`, so search filtering would replay
  a mount animation on every keystroke. Would need a keying change first.
- No plan depends on the `motion` package (it remains unused in the app).

## Execution

Run each with any agent that can read `plans/NNN-*.md` and write code, e.g.
`improve-animations execute 001-modal-entrances` or hand the file to a coding agent directly.
Implement in worktree `anims/001-003`, verify with `npm run lint` + `npm run build` there,
and after merge mark the row **DONE** and update the `**Commit**` stamp to the new HEAD.
