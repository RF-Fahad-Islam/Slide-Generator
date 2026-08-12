# Exam Mode — Implementation Specification

> **Status:** approved blueprint, not yet implemented. Written 2026-08-12.
> **Branch:** `feat/exam-mode`
> **Audience:** the worker model that will implement this. You may have no prior
> context. Read this document top to bottom before writing any code.
>
> This document supersedes the earlier draft at `.agents/plans/phase-6-exam-mode.md`
> (deleted — it contained a security defect in the question-exposure design that is
> corrected here in §5.3).

---

## 0. Read this first — orientation for the worker

### 0.1 The repo is not what its docs say

`CLAUDE.md` and `AGENTS.md` open with "This is NOT the Next.js you know" and instruct
you to read `node_modules/next/dist/docs/`. **Ignore that. There is no Next.js in this
project.** It is:

- **Vite 6 + React 19 + Express** (`server.ts` runs Vite in middleware mode in dev and
  serves `dist/` in prod)
- No router. Navigation is `activeTab` state inside `src/App.tsx:55`
- Storage is **Dexie/IndexedDB** (`src/db/dexie.ts`, currently version 3)
- Tailwind v4 via `@tailwindcss/vite`, **no shadcn/ui installed** despite what
  `context/ui-rules.md` claims

`context/project-overview.md` describes a greenfield Next.js repo that does not exist.
Fixing these docs is Phase 6.9 — do not fix them early, and do not let them mislead you
in the meantime.

### 0.2 Rules from CLAUDE.md that still apply

- **Branch for every unit of work.** You are on `feat/exam-mode`.
- **Load a library's installed skill before first use.** For anything Supabase, read
  `.agents/skills/supabase/SKILL.md` and the relevant files under
  `.agents/skills/supabase-postgres-best-practices/references/`. This is not optional —
  §5 of this document exists because that skill caught three defects in the first draft.
- **Update `context/progress-tracker.md` and `context/ui-registry.md` after every
  feature.**
- **If the same problem persists after one corrective prompt, stop and run `/recover`.**
- After implementation: `/review` from `.agents`, then `git commit`.

### 0.3 Supabase-specific standing order

**Do not trust your training data for Supabase APIs.** Before implementing any Supabase
feature:

1. Fetch `https://supabase.com/changelog.md` and scan for `breaking-change` tags.
2. Look up the specific topic via docs (any docs URL + `.md` returns markdown).
3. Discover CLI commands with `--help`. Never guess a CLI invocation.

Function signatures, `config.toml` keys, and API conventions change between versions.

---

## 1. What we are building

A **timed, server-graded MCQ mock-exam app for Bangladeshi SSC/HSC students**, served as
a second entry point of this existing Vite app at `/exam`, with a warm "cozy" visual
identity distinct from the dark studio shell.

A student signs in, picks a published exam, answers questions one screen at a time under
a clock the server owns, submits once, and sees a score plus per-chapter accuracy and a
review of every question with explanations.

The existing teacher-facing studio (deck authoring, slide rendering, PPTX/PNG export)
is **not modified** except for one new action: "Publish to bank", which pushes questions
from local IndexedDB up to Postgres.

---

## 2. Language — use these terms exactly

Do not invent synonyms. `context/code-standards.md` mandates consistent domain
vocabulary.

| Term | Means |
|---|---|
| **Studio** | The existing teacher-facing app at `/` (`src/App.tsx`). Local-first. |
| **Exam app** | The new student-facing entry at `/exam` (`src/exam/`). Supabase-backed. |
| **Bank** | The shared question pool in Postgres (`public.questions`). NOT the existing local `QuestionBankView`, which is a *deck browser*. |
| **Publish** | The one-way push of questions from local IndexedDB → Postgres bank. |
| **Exam** | A named, timed set of questions a teacher assembles from the bank (`public.exams`). |
| **Attempt** | One student's single run at one exam (`public.attempts`). |
| **Response** | One student's answer to one question within an attempt (`public.responses`). |
| **Answer key** | `questions.answer_key` — the correct option key. **Server-only.** |
| **MCQItem** | The existing local TypeScript shape in `src/types.ts`. Unchanged except for optional new tag fields. |

---

## 3. Locked decisions

Decided with the developer across two structured sessions. **Locked** — if one appears
wrong, stop and ask; do not silently re-open.

| # | Decision | Why |
|---|---|---|
| **D17** | Supabase backend. Auth = **email + password**, plus **Google OAuth**. | BD students are on Android with an existing Google account. SMS OTP costs per message and delivers unreliably in BD. |
| **D18** | **Server-authoritative** grading and timing. Answer keys and explanations never reach the client during an attempt. | A score a student can forge with devtools is worthless. This is the entire justification for having a backend. |
| **D19** | Postgres is the source of truth for questions. The studio authors locally and **publishes upward** on an explicit action. One-way, no merge. | Zero rewrite of the 48 existing studio components; drift is user-triggered and visible. |
| **D20** | The studio (decks, templates, brand kits, exports) **stays local**. Only questions, exams, attempts, and identity go to Postgres. | Bounds the project. Full multi-tenant migration is a separate, larger phase. |
| **D21** | v1 is a **timed mock exam only**. No untimed practice drill. | One state machine. Practice mode is additive later and reuses the same grader. |
| **D22** | Exam app is a **separate Vite entry** (`exam.html` → `src/exam/`). It must not be added to `App.tsx`. | `App.tsx` is 84 KB with ~35 `useState` hooks. The exam needs its own mobile-first layout tree and theme root. |
| **D23** | "Cozy" = **warm island inside the dark shell**. Exam app gets its own warm palette; the studio is untouched. | Contained blast radius. |
| **D24** | The exam app is the **first surface built on real semantic tokens** (`--exam-*` custom properties). New code obeys `context/ui-tokens.md` even though old code doesn't. | Stops the docs being fiction, without a 500-class refactor. |

### 3.1 Assumptions (not explicitly confirmed — flag if wrong)

- **A1 — Bangla-first chrome.** `context/ui-rules.md` says app chrome is English. That
  rule was written for a teacher's tool. The exam app chrome will be **Bangla-first**
  ("প্রশ্ন ১২ / ২৫", "জমা দিন", "সঠিক উত্তর") via `src/exam/i18n.ts`, with English
  fallback strings. The studio keeps English. **Confirm before Phase 6.6** — it changes
  every label in the exam app.
- **A2** — Only teachers author exams; there is no student-created exam in v1.
- **A3** — One exam is attemptable once per student in v1 (enforced by a partial unique
  index). Retakes are out of scope.
- **A4** — Question images (`stemImage`) are out of scope for v1 publishing; questions
  with `stemType === 'image'` are rejected at publish with a clear reason. Supabase
  Storage integration is a later phase.

---

## 4. Architecture

```
                     ┌─────────────────────────────┐
  TEACHER (local)    │  index.html → src/App.tsx   │   unchanged studio
                     │  Dexie v4 / IndexedDB       │
                     └──────────────┬──────────────┘
                                    │  "Publish to bank" — one-way (D19)
                                    │  upsert on (owner_id, local_id)
                                    ▼
                     ┌──────────────────────────────────────────┐
                     │             SUPABASE (Postgres)          │
                     │  profiles · questions · exams ·          │
                     │  exam_questions · attempts · responses   │
                     │  RLS on every table + column-level GRANT │
                     │  Edge Functions: start-attempt,          │
                     │                  submit-attempt          │
                     └──────────────┬───────────────────────────┘
                                    │  stem + options only.
                                    │  NO answer_key, NO explanation (D18)
                                    ▼
                     ┌─────────────────────────────┐
  STUDENT (mobile)   │  exam.html → src/exam/      │   cozy warm island
                     │  response queue in Dexie    │
                     └─────────────────────────────┘
```

### 4.1 File layout to create

```
exam.html                              # second Vite entry (see §8.1)

src/exam/
  main.tsx                             # mounts <ExamApp/>
  ExamApp.tsx                          # screen switch — no router dependency
  theme.css                            # --exam-* tokens ONLY (D24)
  i18n.ts                              # bn strings + en fallback (A1)
  screens/
    SignIn.tsx
    ExamLobby.tsx
    ExamRunner.tsx
    Submitting.tsx
    Results.tsx
    Review.tsx
  components/
    QuestionCard.tsx                   # handles all 3 questionType values
    OptionButton.tsx
    TimerRing.tsx
    QuestionPalette.tsx
    ProgressBar.tsx
    ChapterBreakdown.tsx
  state/
    examMachine.ts                     # pure reducer
    useExamSession.ts                  # reducer + Dexie persistence + sync

src/lib/exam/
  grade.ts                             # PURE. imported by browser AND Deno. See §4.2
  normalize.ts                         # numeral + option-key normalization
  schemas.ts                           # Zod: ExamConfig, Attempt, Response, PublishPayload
  backfill.ts                          # parse board/year out of free-text `source`

src/lib/supabase/
  client.ts                            # browser client — publishable key only
  queries.ts                           # typed query helpers, explicit column lists
  publish.ts                           # studio → Postgres upsert (D19)

supabase/
  migrations/                          # generated, see §5.6
  functions/
    start-attempt/index.ts
    submit-attempt/index.ts
```

### 4.2 The one hard constraint on `src/lib/exam/grade.ts`

This module is imported by **both** the browser bundle and the Deno Edge Function
runtime. It must therefore:

- have **zero dependencies** (no React, no Zod, no Node built-ins)
- use only standard ES syntax importable from Deno via a relative path or a copied file
- export a single pure function with no I/O

```ts
export interface GradeInput {
  responses: { questionId: string; chosenKey: string | null }[];
  answerKeys: Record<string, string>;   // questionId -> correct option key
  negativeMark: number;                 // 0 for SSC/HSC, 0.25 for admission
}
export interface GradeResult {
  perQuestion: { questionId: string; chosenKey: string | null;
                 correctKey: string; isCorrect: boolean; delta: number }[];
  score: number;
  maxScore: number;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
}
export function grade(input: GradeInput): GradeResult;
```

**Rules:** a blank answer scores 0 and is never penalised. A wrong answer scores
`-negativeMark`. The final score floors at 0 (never report a negative total to a
student). All comparisons happen on already-normalized keys — `grade()` does not
normalize; `normalize.ts` does, at the boundary.

---

## 5. Database

### 5.1 The answer-key conflict — resolve before anything else

`MCQItem` carries **two** representations of the correct answer: `answer: string` and
`options[].isCorrect`. They can and do disagree — `bulkParser.ts` and the AI path both
write them.

Implement this resolution once, in `src/lib/exam/normalize.ts`, and enforce it **at the
publish boundary**:

1. Normalize Bangla numerals `০-৯ → 0-9` and option keys `ক→A, খ→B, গ→C, ঘ→D`.
2. If exactly one `options[].isCorrect === true` **and** it matches `answer` → valid.
3. If they disagree → **`answer` wins**, and the question is **refused at publish**.
4. If zero or multiple options are marked correct → refused at publish.
5. If `stemType === 'image'` → refused at publish (A4).

Publishing must return a **rejection report** ("12 of 340 questions could not be
published: 8 answer mismatch, 3 no correct option, 1 image stem"). Never silently drop a
question.

### 5.2 Schema

Postgres conventions from the skill references: lowercase identifiers, explicit primary
keys, **and an index on every foreign key column** (Postgres does not create these
automatically).

```sql
-- ── identity ────────────────────────────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  role          text not null default 'student'
                  check (role in ('student','teacher')),
  display_name  text,
  exam_level    text check (exam_level in ('SSC','HSC','Admission')),
  created_at    timestamptz not null default now()
);

-- ── the bank (D19: written only by publish) ─────────────────────────────────
create table public.questions (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references public.profiles(id),
  local_id       text not null,          -- MCQItem.id — makes re-publish idempotent
  question_type  text not null
                   check (question_type in ('standard','roman_statements','passage')),
  stem           text not null,
  stem_type      text not null default 'text',
  passage        text,
  roman_items    jsonb,
  prompt         text,
  options        jsonb not null,         -- [{key,text}] — NEVER include isCorrect
  answer_key     text not null,          -- SERVER ONLY (§5.3)
  explanation    text,                   -- SERVER ONLY until submit (§5.3)
  subject        text,
  class_name     text,
  paper          text,
  chapter        text,
  exam_year      int,
  board          text,
  difficulty     text check (difficulty in ('easy','medium','hard')),
  source_tags    text[] not null default '{}',
  schema_version int not null default 1,
  created_at     timestamptz not null default now(),
  unique (owner_id, local_id)
);
create index questions_owner_id_idx   on public.questions (owner_id);
create index questions_filter_idx     on public.questions (subject, chapter, difficulty);
create index questions_class_idx      on public.questions (class_name, paper);

-- ── exams ───────────────────────────────────────────────────────────────────
create table public.exams (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references public.profiles(id),
  title          text not null,
  exam_level     text,
  subject        text,
  duration_secs  int  not null check (duration_secs between 60 and 21600),
  negative_mark  numeric(3,2) not null default 0 check (negative_mark >= 0),
  is_published   boolean not null default false,
  created_at     timestamptz not null default now()
);
create index exams_owner_id_idx  on public.exams (owner_id);
create index exams_published_idx on public.exams (is_published) where is_published;

create table public.exam_questions (
  exam_id     uuid not null references public.exams on delete cascade,
  question_id uuid not null references public.questions on delete restrict,
  position    int  not null,
  primary key (exam_id, question_id)
);
create index exam_questions_question_id_idx on public.exam_questions (question_id);
create unique index exam_questions_position_idx
  on public.exam_questions (exam_id, position);

-- ── attempts ────────────────────────────────────────────────────────────────
create table public.attempts (
  id           uuid primary key default gen_random_uuid(),
  exam_id      uuid not null references public.exams,
  student_id   uuid not null references public.profiles(id),
  started_at   timestamptz not null default now(),   -- SERVER clock (D18)
  expires_at   timestamptz not null,
  submitted_at timestamptz,
  score        numeric(6,2),
  max_score    numeric(6,2),
  status       text not null default 'in_progress'
                 check (status in ('in_progress','submitted','expired'))
);
create index attempts_student_id_idx on public.attempts (student_id);
create index attempts_exam_id_idx    on public.attempts (exam_id);
-- A3: one open attempt per student per exam
create unique index attempts_one_open_idx
  on public.attempts (exam_id, student_id) where status = 'in_progress';

create table public.responses (
  attempt_id  uuid not null references public.attempts on delete cascade,
  question_id uuid not null references public.questions,
  chosen_key  text,
  is_correct  boolean,      -- written ONLY by submit-attempt (§5.3)
  flagged     boolean not null default false,
  answered_at timestamptz,
  primary key (attempt_id, question_id)
);
create index responses_question_id_idx on public.responses (question_id);
```

### 5.3 Hiding the answer key — **do NOT use a view**

The first draft of this plan exposed a `questions_public` view. **That was wrong.**
Per `.agents/skills/supabase/SKILL.md`: *views bypass RLS by default*, and the
`security_invoker = true` fix would then be blocked by the very revoke that protects the
base table. It is a trap.

**Use column-level `GRANT` instead.** It is enforced by Postgres itself, needs no policy
logic, and cannot be bypassed by a clever client.

```sql
alter table public.questions enable row level security;

-- Blanket revoke, then re-grant only the safe columns.
revoke all on public.questions from anon, authenticated;

grant select (
  id, question_type, stem, stem_type, passage, roman_items,
  prompt, options, subject, class_name, paper, chapter,
  exam_year, board, difficulty, source_tags
) on public.questions to authenticated;

-- answer_key and explanation are deliberately absent from that list.
```

**`explanation` is hidden too.** Explanations routinely state the correct answer
outright; shipping them during an attempt defeats D18. Both `answer_key` and
`explanation` are returned to the client for the first time by `submit-attempt`.

**Client-side corollary (mandatory):** every PostgREST query in `src/lib/supabase/`
must use an **explicit column list**. Never `select('*')` on `questions`. The column
grant is the security boundary; explicit selects are the belt-and-braces that keep the
client from erroring on a column it cannot read.

### 5.4 RLS policies

Standing rules pulled from the skill — apply all of them:

- **Wrap `auth.uid()` in a subselect**: `(select auth.uid())`. Called once and cached
  instead of once per row — 100x on large tables.
- **`TO authenticated` alone is authentication without authorization** (BOLA/IDOR).
  Always pair the `TO` clause with an ownership predicate in `USING`.
- **`auth.role()` is deprecated.** Use the `TO` clause.
- **UPDATE policies need both `USING` and `WITH CHECK`** — without `WITH CHECK` a user
  can reassign a row to someone else.
- **UPDATE requires a SELECT policy** — without one, updates silently affect 0 rows with
  no error.
- **Never read authorization from `user_metadata`** — it is user-editable. `profiles.role`
  is a table column; read it from the table.
- **Index every column referenced in a policy** (done in §5.2).

```sql
-- profiles
alter table public.profiles enable row level security;
create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- questions: teachers write their own; everyone authenticated reads granted columns
create policy questions_select on public.questions
  for select to authenticated using (true);
create policy questions_write_own on public.questions
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- exams: published are readable; owner writes
alter table public.exams enable row level security;
create policy exams_select_published on public.exams
  for select to authenticated
  using (is_published or (select auth.uid()) = owner_id);
create policy exams_write_own on public.exams
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- attempts: student reads own, inserts nothing directly, updates nothing directly
alter table public.attempts enable row level security;
create policy attempts_select_own on public.attempts
  for select to authenticated using ((select auth.uid()) = student_id);
-- No INSERT/UPDATE policy: attempts are created and mutated ONLY by the Edge
-- Functions using the service role. This is what makes the score unforgeable.

-- responses: student may write ONLY their own, ONLY while the attempt is live
alter table public.responses enable row level security;
create policy responses_select_own on public.responses
  for select to authenticated
  using (exists (
    select 1 from public.attempts a
    where a.id = attempt_id and a.student_id = (select auth.uid())
  ));
create policy responses_update_live on public.responses
  for update to authenticated
  using (exists (
    select 1 from public.attempts a
    where a.id = attempt_id
      and a.student_id = (select auth.uid())
      and a.status = 'in_progress'
      and now() < a.expires_at
  ))
  with check (exists (
    select 1 from public.attempts a
    where a.id = attempt_id
      and a.student_id = (select auth.uid())
      and a.status = 'in_progress'
      and now() < a.expires_at
  ));

-- The column grant that stops a student PATCHing themselves a perfect score:
revoke all on public.responses from anon, authenticated;
grant select (attempt_id, question_id, chosen_key, flagged, answered_at)
  on public.responses to authenticated;
grant update (chosen_key, flagged, answered_at)
  on public.responses to authenticated;
-- `is_correct` is readable only after submit, via the Edge Function response,
-- and writable only by the service role.
```

### 5.5 Data API exposure

Newly created tables are **not** necessarily exposed via the Data (REST) API — that is
separate from RLS. After migrating, verify the `anon`/`authenticated` roles have the
grants above, and check the project's Data API settings. If a table is unexpectedly
inaccessible, this is the usual cause.

### 5.6 Migration workflow — imperative

This project has no `supabase/schemas/` directory, so use **imperative migrations**
(Option B in the skill):

1. Iterate freely with MCP `execute_sql` or `supabase db query` (needs CLI ≥ 2.79.0).
   **Do not use `apply_migration` to iterate** — it writes a history entry on every call
   and you will be stuck with your first attempt.
2. When the schema is right: `supabase db advisors` (CLI ≥ 2.81.3) or MCP `get_advisors`.
   **Fix every issue it reports before proceeding.**
3. Generate: `supabase db pull <descriptive-name> --local --yes`
4. Verify: `supabase migration list --local`

---

## 6. Edge Functions

Both run with the **service role**. The service role key must never appear in any client
bundle, `.env` file that Vite reads, or committed file.

### `start-attempt`
Input `{ exam_id }`.
1. Reject if an `in_progress` attempt already exists for this student+exam (A3; the
   partial unique index is the backstop).
2. Insert `attempts` with `started_at = now()`, `expires_at = now() + duration_secs`.
3. Pre-insert one blank `responses` row per exam question, so the student's later writes
   are UPDATEs governed by `responses_update_live` — not INSERTs.
4. Return `{ attempt_id, expires_at, server_now, questions: [...] }` with the granted
   columns only. **No `answer_key`. No `explanation`.**

### `submit-attempt`
Input `{ attempt_id }`.
1. Load the attempt; reject unless `status = 'in_progress'`.
2. Read `responses` joined with the private `questions.answer_key`.
3. Call the shared `grade()` from `src/lib/exam/grade.ts`.
4. Write `is_correct` per response, plus `score`, `max_score`, `submitted_at`, and
   `status`.
5. Return the full result **including** answer keys and explanations. This is the first
   moment the client may see them.

**Expiry:** if `now() > expires_at`, grade whatever is stored and set
`status = 'expired'`. Writes attempted after expiry are already blocked by
`responses_update_live`, so a client-side clock hack buys nothing.

**Timer authority:** the client counts down toward the `expires_at` returned by
`start-attempt`, and re-syncs against `server_now` on every response write. Clock skew,
tab suspension, and device sleep all self-correct.

---

## 7. Local (Dexie) changes

Bump `src/db/dexie.ts` to **version 4 — additive only**. Do not alter the three existing
stores.

```ts
this.version(4).stores({
  savedState:    'id, updatedAt',
  questionDecks: 'id, name, subject, createdAt, updatedAt',
  workspaces:    'id, name, createdAt, updatedAt',
  publishLog:    'localId, questionId, publishedAt',  // NEW — idempotent re-publish
  examSession:   'attemptId, updatedAt',              // NEW — crash-safe response queue
});
```

Extend `MCQTags` in `src/types.ts` with **optional** fields. Optional means no backfill
is required to ship, and no existing deck breaks:

```ts
export interface MCQTags {
  subject?: string;
  className?: string;
  paper?: string;
  chapter?: string;                          // NEW
  year?: number;                             // NEW
  board?: string;                            // NEW
  difficulty?: 'easy' | 'medium' | 'hard';   // NEW
}
```

`src/lib/exam/backfill.ts` parses `board` and `year` out of existing free-text `source`
strings (`"রাজশাহী বোর্ড ২০২৩"` → board `রাজশাহী`, year `2023`) and **proposes** them in
a review UI. It must never auto-apply — same principle as D10 (AI-inferred values
require human confirmation).

### 7.1 Publish must be an atomic upsert

Re-publishing the same question must update, not fail or duplicate. Use
`on conflict … do update`, never select-then-insert (race condition):

```sql
insert into public.questions (owner_id, local_id, stem, options, answer_key, ...)
values (...)
on conflict (owner_id, local_id) do update
  set stem = excluded.stem,
      options = excluded.options,
      answer_key = excluded.answer_key,
      ...
returning id, local_id;
```

Batch these — do not issue one request per question for a 340-question bank.

---

## 8. Build and serving wiring

### 8.1 `vite.config.ts`

Add the second entry. Keep the existing `plugins`, `resolve.alias`, and the
`DISABLE_HMR` server block **exactly as they are** — the comment there warns that file
watching is deliberately disabled during agent edits.

```ts
build: {
  rollupOptions: {
    input: {
      main: path.resolve(__dirname, 'index.html'),
      exam: path.resolve(__dirname, 'exam.html'),
    },
  },
},
```

### 8.2 `server.ts`

At `server.ts:194` there is `app.get('*')` → `index.html`. **It will swallow `/exam` in
production.** Add the exam route immediately before it:

```ts
app.get('/exam*', (_req, res) => res.sendFile(path.join(distPath, 'exam.html')));
app.get('*',      (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
```

Dev needs no change — Vite middleware serves `exam.html` directly.

### 8.3 Dependencies

Add `@supabase/supabase-js`, **version-pinned**, and commit the lockfile (supply-chain
requirement from the skill). Register it in `context/library-docs.md` and remove
"Supabase packages (D1)" from that file's explicitly-NOT-installed list.

Only the **publishable/anon** key goes in the client. Vite inlines anything prefixed
`VITE_` into the browser bundle — the service role key must never carry that prefix.

---

## 9. Cozy design system (D23 / D24)

All colour lives in `src/exam/theme.css` as tokens. **No hex and no raw Tailwind palette
classes anywhere else in `src/exam/`.**

```css
:root {
  /* warm paper ground — never pure white */
  --exam-bg:            hsl(38 44% 96%);
  --exam-surface:       hsl(36 50% 99%);
  --exam-surface-sunk:  hsl(38 36% 93%);
  --exam-border:        hsl(34 26% 86%);

  /* ink */
  --exam-fg:            hsl(28 22% 18%);
  --exam-fg-muted:      hsl(30 12% 45%);

  /* honey accent */
  --exam-accent:        hsl(30 82% 52%);
  --exam-accent-soft:   hsl(34 88% 92%);
  --exam-accent-fg:     hsl(28 60% 16%);

  /* verdicts — muted, not traffic-light */
  --exam-correct:       hsl(150 44% 40%);
  --exam-correct-soft:  hsl(150 48% 93%);
  --exam-wrong:         hsl(8 62% 52%);
  --exam-wrong-soft:    hsl(10 70% 95%);
  --exam-flag:          hsl(268 40% 56%);

  --exam-radius:        1rem;
  --exam-radius-lg:     1.5rem;
  --exam-shadow:        0 1px 2px hsl(30 20% 60% / .12),
                        0 8px 24px -8px hsl(30 25% 45% / .18);
}
```

**What cozy means concretely:**

- Warm cream ground, soft shadows instead of hard borders.
- Generous rounding (16–24 px) and generous leading — Bangla conjuncts need ~1.75
  line-height to breathe. This is legibility, not decoration.
- **One question per screen** on mobile. No dense grids. Options are thumb-reachable.
- **Muted verdicts.** A wrong answer is clay, not alarm red. A student sees this 40
  times in a row; harsh red is punishing.
- Calm motion only: 150–200 ms fades, ~4 px slides. Honour `prefers-reduced-motion` —
  `src/index.css` already does this well; match its patterns.
- Type: `Hind Siliguri` for Bangla content, `Plus Jakarta Sans` for chrome and numerals.
- **Serious where it counts.** The timer is a calm ring that turns amber under 5 minutes
  and only then reads urgent. Cozy shell, honest clock.

**Not in v1:** confetti, XP, streaks, leaderboards (D21 scope). Revisit after a real
cohort uses it.

---

## 10. Screens

| Screen | Contents | Notes |
|---|---|---|
| **SignIn** | Email + password, Google button. Guest mode disabled in v1. | Bangla-first copy (A1). |
| **ExamLobby** | Published exams as warm cards: title, subject, question count, duration, negative-marking badge. Filter by subject / chapter / difficulty. | Empty state: "No exams yet — ask your teacher." |
| **ExamRunner** | Sticky top: timer ring, "১২ / ২৫", flag toggle. Body: `QuestionCard`. Bottom: prev/next + palette sheet. | Responses write optimistically on tap; queued in `examSession` and retried when offline. |
| **Submitting** | Confirm with unanswered count ("৩টি প্রশ্ন খালি আছে। জমা দেবেন?") then a calm spinner. | Irreversible — must confirm (`ui-rules.md`). |
| **Results** | Score ring, correct/wrong/blank, time used, per-chapter accuracy bars. | This is the payoff screen. Make it the best-designed one. |
| **Review** | Per question: your choice, correct choice, explanation. Filter to wrongs only. | See risk R3 — may have to degrade gracefully. |

`QuestionCard` must handle all three `questionType` values from `src/types.ts`:

- **`standard`** — stem, then options.
- **`roman_statements`** (bohupodi) — stem, then `romanItems` as a bordered list, then
  `prompt`, then the combination options ("i ও ii"). **Do not flatten the roman items
  into the stem.**
- **`passage`** — passage in a sunk surface, collapsible and sticky on mobile so it stays
  reachable while options scroll. **Passage questions must occupy adjacent
  `exam_questions.position` values** so the same passage isn't re-shown five times apart.

Accessibility (from `context/ui-rules.md`): ARIA roles on the option list, focus
management on screen transitions, keyboard navigation between questions.

---

## 11. Phases

Each phase ends: `npm run build` green → `/review` from `.agents` → `git commit`.

| Phase | Deliverable | Gate / acceptance | Est. |
|---|---|---|---|
| **6.0** | Supabase project created. `@supabase/supabase-js` pinned + lockfile committed. `src/lib/supabase/client.ts`. Auth screens sign a user up and in. | A real user row exists in `auth.users` and a matching `profiles` row is auto-created. | 1 d |
| **6.1** | Migrations for §5.2–5.4. `supabase db advisors` clean. | **HOSTILE TEST — the phase gate.** Signed in as a student, all four must fail: (a) `select answer_key from questions`, (b) `select explanation from questions`, (c) `update attempts set score = 100`, (d) `update responses set is_correct = true`. Write these as a committed script. | 1–2 d |
| **6.2** | `normalize.ts` + `grade.ts` + Vitest suite. Pure logic, no UI, no network. | Tests cover: Bangla numerals, ক/খ/গ/ঘ keys, answer-vs-isCorrect conflicts, negative marking, blanks, score flooring at 0. | 1 d |
| **6.3** | Publish seam: `publish.ts`, `publishLog`, "Publish to bank" in `QuestionBankView` with rejection report and **tag-coverage report**. | A real deck publishes; re-publishing the same deck updates rather than duplicating. | 1–2 d |
| **6.4** | Teacher exam authoring in the studio: build an `exams` row from a bank filter, set duration + negative marking, publish. | Minimal UI — this is for the teacher, not students. Do not gold-plate it. | 1 d |
| **6.5** | Edge Functions `start-attempt` + `submit-attempt`, deployed. | Verified by curl, including forged submissions: submitting another student's attempt, submitting twice, submitting after expiry. | 1–2 d |
| **6.6** | `exam.html`, `theme.css`, `i18n.ts`, `ExamApp` shell, SignIn + Lobby. | Verified at 375 px viewport. **Confirm A1 with the developer before starting.** | 1–2 d |
| **6.7** | `ExamRunner`: state machine, timer, palette, all 3 question types, offline queue, resume-after-reload. | Kill the tab mid-exam and reopen — the attempt resumes with the correct remaining time. | 2–3 d |
| **6.8** | Results + Review + `ChapterBreakdown`. | — | 1–2 d |
| **6.9** | Font subsetting; fix the 3 zero-byte Noto files; throttled-mobile perf pass; doc rewrites (§13). | Lighthouse on simulated 3G. | 1 d |

**Total ≈ 11–17 working days.** The backend is roughly two-thirds of it; the cozy exam
UI is one-third. That ratio is the honest cost of D17.

---

## 12. Risks

| # | Risk | Mitigation |
|---|---|---|
| **R1** | RLS or grant misconfiguration leaks `answer_key` / `explanation`. This single failure makes the entire product pointless. | §5.3 column grants + the 6.1 hostile test as a hard gate. Run `supabase db advisors` after every schema change. |
| **R2** | Student loses connectivity mid-exam. | Responses queue in `examSession` (Dexie) and flush on reconnect. Server-side expiry means a disconnected student gains no extra time. |
| **R3** | **Explanation coverage.** Review is the payoff screen, and `MCQItem.explanation` is optional — much of the existing bank likely has none. | **Measure it in 6.3 and report the number.** If coverage < 60 %, Review ships with "ব্যাখ্যা শীঘ্রই আসছে" rather than an empty box, and an explanation-authoring pass gets its own phase. |
| **R4** | `chapter` / `difficulty` are new optional fields, so most published questions have them empty and lobby filters look broken. | The 6.3 publish report shows per-field tag coverage. Run `backfill.ts` before the first real publish. |
| **R5** | The two answer representations drift. | §5.1, enforced at the publish boundary with visible rejections. |
| **R6** | Mobile payload. `public/fonts/` holds unsubsetted `.ttf`: Hind Siliguri Regular 250 KB, Bold 288 KB, Anek Bangla 1.3 MB. And **`NotoSansBengali-{Bold,Regular,Variable}.ttf` are 0 bytes** while `src/fonts.css` references them. | 6.9: subset to woff2 (Bangla + Latin + digits), target < 60 KB each; delete or replace the zero-byte files. The exam app must load only the two faces it uses. |
| **R7** | Scope creep back into `App.tsx`. | D22 is a hard boundary. If the exam app needs something from the studio it goes through `src/lib/` or Postgres — **never an import from `App.tsx`**. |
| **R8** | Supabase free tier pauses a project after ~7 days idle; a student hits an opaque failure. | Surface a plain-language "server waking up, try again" state. Consider a keep-alive cron before any real cohort. |
| **R9** | `grade.ts` drifts between the browser copy and the Deno copy. | Single file, imported by both. Never fork it. If the Edge Function cannot import across the boundary, generate the Deno copy in the build and add a CI check that the two are byte-identical. |

---

## 13. Documentation debt this creates

Do these in 6.9. Not "later".

1. **`context/project-overview.md`** — rewrite. It describes a greenfield Next.js repo
   that does not exist, and a non-goals list this work overrides.
2. **`context/auth-plan.md`** — "v1: NO authentication" is now false for the exam app.
   Document the two-surface model: BYOK-only studio, Supabase-auth exam app.
3. **`context/library-docs.md`** — add `@supabase/supabase-js`; drop "Supabase packages
   (D1)" from the NOT-installed list; correct the Next.js rows to Vite.
4. **`context/architecture.md`** — add a section for the exam surface and the publish seam.
5. **`context/ui-registry.md`** — register every new component.
6. **`context/progress-tracker.md`** — clear the stale `[!]` font row (fonts *are*
   self-hosted) and log this phase.
7. **`CLAUDE.md` / `AGENTS.md`** — remove the "This is NOT the Next.js you know"
   preamble. It actively misleads every agent that opens this repo.

---

## 14. Definition of done

> A student signs in on an Android phone, picks "HSC Physics 1st Paper — Chapter 5",
> answers 25 questions under a 25-minute server-enforced clock, submits, and sees their
> score plus per-chapter accuracy — and **cannot see a correct answer or explanation
> before submitting, even with devtools open.**

Explicitly **not** in v1: practice mode, leaderboards, streaks/XP, teacher-side result
dashboards, question image upload, full offline exam download, a Bangla/English toggle,
retakes, multi-tenant studio migration.
