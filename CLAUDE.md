<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
ALWAYS MAINTAIN GIT and BRANCH for EVERY WORK.
<!-- END:nextjs-agent-rules -->

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
- **Phase workflow mandatory**: before starting any phase run `/architect`; after implementation run `/review` from `.agents`; then `git commit`; then `/remember save`

## Available Skills

- `/architect` — before any complex feature. Think before building.
- `/imprint` — after any new UI component. Capture patterns.
- `/review` — before demo or when something feels off.
- `/recover` — when something breaks after one failed correction.
- `/remember save` — when a feature spans multiple sessions.
- `/remember restore` — when returning after a multi-session feature.
- 
### Frontend & Design
- `/frontend-design` — create distinctive, production-grade UI with typography, color, motion, and composition guidance
- `/shadcn` — manage shadcn components, search, fix, style, and compose UI
- `/next-best-practices` — Next.js file conventions, RSC boundaries, data patterns, async APIs, metadata, error handling

### Backend & Database
- `/backend-architect` — think through backend architecture before building
- `/supabase` — Supabase agent skills for database CRUD, auth, storage, RLS, functions, and realtime
- `/supabase-postgres-best-practices` — Postgres performance optimization, query tuning, schema design

### Reference Docs
- `docs/nextjs-llms.txt` — Next.js CLI commands, API route patterns, testing setup, migration guid