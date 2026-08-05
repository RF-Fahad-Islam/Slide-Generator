# BrainSum — Agent Rules

## Git Workflow (MANDATORY)

After completing **every phase or significant feature**, run a git commit:

```bash
git add -A
git commit -m "feat: <short description of what was done>"
```

Use conventional commit prefixes:
- `feat:` — new feature
- `fix:` — bug fix
- `chore:` — migrations, config, tooling
- `refactor:` — code restructure without behavior change
- `docs:` — documentation / context file updates

**Never leave a completed phase uncommitted.** If a build is clean and a feature is working, commit immediately before starting the next task.

---

## Read Before Anything Else

Read in this exact order before any implementation:

1. context/project-overview.md
2. context/architecture.md
3. context/auth-plan.md
4. context/ui-tokens.md
5. context/ui-rules.md
6. context/ui-registry.md
7. context/code-standards.md
8. context/library-docs.md
9. context/build-plan.md
10. context/progress-tracker.md

## Rules That Never Change

- Never use hardcoded hex values or raw Tailwind color classes
- Update `progress-tracker.md` and `ui-registry.md` after every feature
- Before any third party library — load its installed skill first,
  then read `context/library-docs.md` for project-specific rules
- If the same problem persists after one corrective prompt —
  stop immediately and run /recover
- **Commit with git after every completed phase** (see Git Workflow above)

## Available Skills

- `/architect` — before any complex feature. Think before building.
- `/imprint` — after any new UI component. Capture patterns.
- `/review` — before demo or when something feels off.
- `/recover` — when something breaks after one failed correction.
- `/remember save` — when a feature spans multiple sessions.
- `/remember restore` — when returning after a multi-session feature.

### Frontend & Design
- `/frontend-design` — create distinctive, production-grade UI with typography, color, motion, and composition guidance
- `/shadcn` — manage shadcn components, search, fix, style, and compose UI
- `/next-best-practices` — Next.js file conventions, RSC boundaries, data patterns, async APIs, metadata, error handling

### Backend & Database
- `/backend-architect` — think through backend architecture before building
- `/supabase` — Supabase agent skills for database CRUD, auth, storage, RLS, functions, and realtime
- `/supabase-postgres-best-practices` — Postgres performance optimization, query tuning, schema design

### Reference Docs
- `docs/nextjs-llms.txt` — Next.js CLI commands, API route patterns, testing setup, migration guide
