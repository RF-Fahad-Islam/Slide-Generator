# Code Standards

## Language & types

- TypeScript **strict** everywhere. No `any` unless unavoidable and commented.
- **Zod schemas are the single source of truth** for all domain types
  (`src/lib/schemas/*`). Types are `z.infer<...>` — never hand-write a parallel
  interface that can drift from the schema.
- Every external input (AI output, pasted text, CSV rows, imported JSON, IndexedDB
  reads) is parsed through Zod at the boundary. Trust nothing.

## Module boundaries

- `src/lib/**` — pure logic, no React, no JSX: schemas, render pipeline, export,
  parsers, AI client, storage. Unit-testable with Vitest.
- `src/components/**` — React components.
- `src/app/**` — routes, pages, route handlers only; keep them thin (call into `lib`).
- Feature folders over type folders within `components/`.

## Naming

- Files: kebab-case (`build-slides.ts`, `class-mode-bangla.ts`).
- Exports: PascalCase for components/types, camelCase for functions.
- Domain terms exactly as defined in `plan.md` §3 (Deck, BrandKit, Template, Variant,
  slideKind, stemType). Do not invent synonyms (no "Quiz", no "Theme" for BrandKit).

## API key & security (see `auth-plan.md`)

- Gemini key: localStorage → per-request header → per-call client construction.
  Never stored server-side, never logged, stripped from all error paths.
- Route handler maps upstream errors to safe generic messages.

## Error handling

- Guard AI finish reasons explicitly (`refusal`/safety, `max_tokens`, empty) — never
  assume `candidates[0]`.
- Parsers never throw on bad input; they return partial results + per-item errors for
  the validation panel.
- Every stored object carries `schemaVersion`; reads run migrations.

## Testing

- **Vitest** for pure logic. Required coverage:
  - `parse/plain-text.ts` — fixture set of messy real-world Bangla formats
    (`A)`, `ক)`, `1.`, `*`, `Ans:`, `উত্তর:`, mixed numerals ০-৯/0-9).
  - `render/build-slides.ts` — expansion (question+answer per MCQ, answer-key
    pagination), resolve-once autofit shrink.
  - normalized→inches coordinate conversion.
  - Snapshot: built-in template's pptxgenjs element list stays stable.
- Tests live next to the unit (`*.test.ts`) or in `__tests__/`.

## Git & workflow (per CLAUDE.md / AGENTS.md)

- Branch per unit of work: `feat/phase-N-<slug>`. Commit after each phase passes
  `npm run build` clean + `/review`. `/architect` before each phase; `/remember save`
  after.
- Commits: concise imperative messages matching repo history style.
- **Never commit secrets.** The BYOK key must not appear in any file.

## Dependency rules

- Before using any third-party library for the first time: load its installed skill
  (if any), then read `context/library-docs.md` for project-specific rules.
- Do not add dependencies not listed in `library-docs.md` without user approval.
- This is **NOT the Next.js you know**: read the relevant guide in
  `node_modules/next/dist/docs/` before writing routes/components; heed deprecations.

## Comments

- Comment the WHY, not the what. Locked decisions referenced in code as e.g.
  `// D6: fixed sizes from build-slides — do not re-fit here`.
