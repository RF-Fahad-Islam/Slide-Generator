# Phase 6 — Exam Mode (student-facing timed MCQ app)

> Branch: `feat/exam-mode`. Written 2026-08-12 after a `/grill-me` session.
> Supersedes the "no auth / no server persistence" v1 non-goals in
> `context/project-overview.md` and pulls forward the SaaS seam described in
> `context/auth-plan.md` §"The SaaS seam".

## 0. Locked decisions (D17–D24)

These were decided in the grilling session and are **locked** the same way D1–D16 are.
If one seems wrong, stop and ask — do not silently re-open.

| # | Decision | Rationale |
|---|---|---|
| **D17** | Supabase is the backend for exam mode. Students sign in with **email + password**, plus **Google OAuth** as a one-tap path. | BD students are on Android with an existing Google account; SMS OTP costs money per message and delivers unreliably in BD. |
| **D18** | **Server-authoritative** grading and timing. Correct answers are NEVER in the client payload during an attempt. | A score that a student can forge with devtools is not a score. This is the whole reason to have a backend. |
| **D19** | **Supabase is the source of truth for questions**; the local studio keeps authoring in IndexedDB and **publishes upward** via an explicit action. One-way. No merge. | Zero rewrite of the 48 existing studio components, no conflict resolution, and the drift is visible and user-triggered. |
| **D20** | The teacher studio (decks, templates, brand kits, slides, exports) **stays local**. Only `questions`, `exams`, `attempts`, and identity move to Postgres. | Bounds this project. Full multi-tenant migration is a separate, larger phase. |
| **D21** | v1 exam experience is a **timed mock exam** only: configure → locked timer → answer → submit once → score + review. No untimed practice drill in v1. | One state machine. Practice mode is additive later and reuses the same grader. |
| **D22** | The exam UI is a **separate Vite entry** (`exam.html` → `src/exam/`), sharing `src/types.ts`, `src/db/`, and `MathText`. It does not enter `App.tsx`. | `App.tsx` is 84 KB / ~35 `useState`. Adding a full app to it is the wrong move, and the exam needs its own mobile-first layout tree and theme root. |
| **D23** | "Cozy" = **warm island in the dark shell**. The exam entry gets its own warm token set; the studio is untouched. | Contained blast radius. Re-skinning 48 components is unrelated to shipping an exam. |
| **D24** | The exam entry is the **first surface built with real semantic tokens** (`--exam-*` CSS custom properties + Tailwind theme mapping), per `context/ui-tokens.md`. New code follows the rule even though old code doesn't. | Stops the docs from being fiction going forward, without a 500-class refactor. |

---

## 1. Reality check on the existing codebase

Facts confirmed by reading the repo, not assumed:

- Stack is **Vite 6 + React 19 + Express**, NOT Next.js. `context/project-overview.md`
  describing a greenfield Next.js repo is **stale and must be rewritten** (task 7.1).
- No router. Navigation is `activeTab` state at `src/App.tsx:55`.
- `src/db/dexie.ts` is at **version 3** (`savedState`, `questionDecks`, `workspaces`).
- `MCQTags` = `{subject, className, paper}` only. **No chapter / year / board /
  difficulty fields exist.** `source` is free text (`"রাজশাহী বোর্ড ২০২৩"`).
- `MCQItem` carries **two answer representations**: `answer: string` (option key) and
  `options[].isCorrect`. They can disagree.
- `server.ts:194` has `app.get('*')` → `index.html`. This will swallow `/exam` in
  production and must be branched.
- Bengali fonts ARE self-hosted in `public/fonts/` (the `[!]` row in
  `progress-tracker.md` is stale) — but **three files are 0 bytes**:
  `NotoSansBengali-{Bold,Regular,Variable}.ttf`, and `src/fonts.css` references them.
- Most Bangla fonts are **unsubsetted `.ttf`** (Hind Siliguri Regular 250 KB, Bold
  288 KB, Anek 1.3 MB). Acceptable for a desktop studio; **not** acceptable for a
  student on a 2G-ish mobile connection.

---

## 2. Architecture

```
                     ┌─────────────────────────────┐
  TEACHER (local)    │  index.html → src/App.tsx   │   unchanged studio
                     │  IndexedDB (Dexie v4)       │
                     └──────────────┬──────────────┘
                                    │  "Publish to bank"  (D19, one-way)
                                    ▼
                     ┌─────────────────────────────────────────┐
                     │            SUPABASE (Postgres)          │
                     │  profiles · questions · exams ·         │
                     │  exam_questions · attempts · responses  │
                     │  + RLS on every table                   │
                     │  + Edge Functions: start / submit       │
                     └──────────────┬──────────────────────────┘
                                    │  question text WITHOUT answers (D18)
                                    ▼
                     ┌─────────────────────────────┐
  STUDENT (mobile)   │  exam.html → src/exam/      │   cozy warm island
                     │  session cache in IndexedDB │
                     └─────────────────────────────┘
```

### Module layout (new)

```
src/
  exam/
    main.tsx                     # entry, mounts <ExamApp/>
    ExamApp.tsx                  # route switch (5 screens, no router dep needed)
    theme.css                    # --exam-* tokens (D24)
    screens/
      SignIn.tsx
      ExamLobby.tsx              # pick exam / subject / chapter
      ExamRunner.tsx             # the timed surface
      Submitting.tsx
      Results.tsx
      Review.tsx
    components/
      QuestionCard.tsx           # stem + options, handles all 3 questionType values
      OptionButton.tsx
      TimerRing.tsx
      QuestionPalette.tsx        # jump grid, answered/flagged/unseen
      ProgressBar.tsx
      ChapterBreakdown.tsx
    state/
      examMachine.ts             # reducer: idle→configuring→running→submitted→reviewing
      useExamSession.ts          # hook wrapping the reducer + persistence
  lib/
    exam/
      grade.ts                   # PURE. shared by client preview + Edge Function
      normalize.ts               # Bangla numeral ০-৯ → 0-9, answer-key resolution
      schemas.ts                 # Zod: ExamConfig, Attempt, Response, PublishPayload
    supabase/
      client.ts                  # browser client (anon key only)
      queries.ts                 # typed query helpers
      publish.ts                 # studio → Postgres one-way push (D19)
supabase/
  migrations/
    0001_exam_schema.sql
    0002_rls.sql
  functions/
    start-attempt/index.ts
    submit-attempt/index.ts
exam.html                        # second Vite entry
```

**Rule:** `src/lib/exam/grade.ts` is imported by BOTH the browser and the Edge
Function. It must stay dependency-free and React-free so Deno can import it.

---

## 3. The answer-key conflict (fix before anything else)

`MCQItem.answer` and `options[].isCorrect` are two sources of truth. Resolution rule,
implemented once in `src/lib/exam/normalize.ts` and enforced at publish time:

1. Normalize Bangla numerals and option keys (`ক→A`, `খ→B`, `গ→C`, `ঘ→D`; `০-৯→0-9`).
2. If exactly one `options[].isCorrect === true` **and** it matches `answer` → valid.
3. If they disagree → **`answer` wins** (it is what the AI/parser writes most
   reliably), and the question is flagged `needs_review` and **refused at publish**.
4. If zero or multiple correct → refused at publish with a clear reason.

Publishing must surface a rejection list ("12 of 340 questions can't be published:
…"). Never silently drop.

---

## 4. Database schema

`supabase/migrations/0001_exam_schema.sql`:

```sql
-- identity
create table profiles (
  id            uuid primary key references auth.users on delete cascade,
  role          text not null default 'student' check (role in ('student','teacher')),
  display_name  text,
  exam_level    text check (exam_level in ('SSC','HSC','Admission')),
  created_at    timestamptz not null default now()
);

-- the shared bank (D19: written only by publish, read by everyone)
create table questions (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references profiles(id),
  local_id       text not null,               -- MCQItem.id, for idempotent re-publish
  question_type  text not null check (question_type in ('standard','roman_statements','passage')),
  stem           text not null,
  stem_type      text not null default 'text',
  stem_image_url text,
  passage        text,
  roman_items    jsonb,
  prompt         text,
  options        jsonb not null,              -- [{key,text}] — NO isCorrect (D18)
  answer_key     text not null,               -- server-only, never selected by anon
  explanation    text,
  subject        text,
  class_name     text,
  paper          text,
  chapter        text,                        -- NEW structured field
  exam_year      int,                         -- NEW
  board          text,                        -- NEW
  difficulty     text check (difficulty in ('easy','medium','hard')),
  source_tags    text[] not null default '{}',
  schema_version int not null default 1,
  created_at     timestamptz not null default now(),
  unique (owner_id, local_id)
);
create index on questions (subject, chapter, difficulty);
create index on questions (class_name, paper);

create table exams (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references profiles(id),
  title          text not null,
  exam_level     text,
  subject        text,
  duration_secs  int  not null,
  negative_mark  numeric(3,2) not null default 0,   -- 0 for SSC/HSC, 0.25 admission
  is_published   boolean not null default false,
  created_at     timestamptz not null default now()
);

create table exam_questions (
  exam_id     uuid not null references exams on delete cascade,
  question_id uuid not null references questions on delete restrict,
  position    int  not null,
  primary key (exam_id, question_id)
);

create table attempts (
  id           uuid primary key default gen_random_uuid(),
  exam_id      uuid not null references exams,
  student_id   uuid not null references profiles(id),
  started_at   timestamptz not null default now(),   -- SERVER clock (D18)
  expires_at   timestamptz not null,                 -- started_at + duration
  submitted_at timestamptz,
  score        numeric(6,2),
  max_score    numeric(6,2),
  status       text not null default 'in_progress'
                 check (status in ('in_progress','submitted','expired'))
);
create unique index one_open_attempt
  on attempts (exam_id, student_id) where status = 'in_progress';

create table responses (
  attempt_id  uuid not null references attempts on delete cascade,
  question_id uuid not null references questions,
  chosen_key  text,
  is_correct  boolean,        -- written by submit-attempt only
  flagged     boolean not null default false,
  answered_at timestamptz,
  primary key (attempt_id, question_id)
);
```

**`answer_key` never leaves the server.** Client reads go through a view:

```sql
create view questions_public as
  select id, question_type, stem, stem_type, stem_image_url, passage,
         roman_items, prompt, options, subject, class_name, paper,
         chapter, exam_year, board, difficulty, source_tags
  from questions;
```

### RLS (`0002_rls.sql`) — sketch

| Table | Policy |
|---|---|
| `profiles` | select/update own row only |
| `questions` | **no direct client select** (revoke); insert/update where `owner_id = auth.uid()` and `role='teacher'` |
| `questions_public` | select allowed to authenticated |
| `exams` | select where `is_published`; write where `owner_id = auth.uid()` |
| `attempts` | select/insert where `student_id = auth.uid()`; **update denied to clients** (Edge Function uses service role) |
| `responses` | select/insert/update where the parent attempt is the student's own AND `status='in_progress'` AND `now() < expires_at`; `is_correct` column write **revoked** from `authenticated` |

The `is_correct` column grant revoke is what stops a student from PATCHing themselves
a perfect score. Write it as an explicit `grant update (chosen_key, flagged, answered_at)`.

---

## 5. Edge Functions

### `start-attempt`
Input `{exam_id}`. Service role.
1. Reject if an `in_progress` attempt already exists (the partial unique index also
   enforces it).
2. Insert `attempts` with `started_at = now()`, `expires_at = now() + duration`.
3. Pre-insert one blank `responses` row per exam question.
4. Return `{attempt_id, expires_at, questions: questions_public[...]}` — **no answers**.

### `submit-attempt`
Input `{attempt_id}`. Service role.
1. Load attempt; reject if not `in_progress`.
2. Read `responses` + the private `questions.answer_key`.
3. Call the **shared** `grade()` from `src/lib/exam/grade.ts`.
4. Write `is_correct` per response, `score`, `max_score`, `submitted_at`,
   `status='submitted'`.
5. Return the full result **including** answer keys and explanations — this is the
   first moment the client is allowed to see them.

**Expiry:** if `now() > expires_at`, `submit-attempt` grades whatever is stored and
marks `status='expired'`. Answers submitted after expiry are ignored server-side, so a
client-side clock hack buys nothing.

**Timer authority:** the client counts down from `expires_at` returned by
`start-attempt`, and re-syncs against the server clock on every response POST
(cheap — the response endpoint returns `server_now`). Clock skew and tab-sleep both
self-correct.

---

## 6. Local (Dexie) changes

Bump `src/db/dexie.ts` to **version 4**, additive only:

```ts
this.version(4).stores({
  savedState:    'id, updatedAt',
  questionDecks: 'id, name, subject, createdAt, updatedAt',
  workspaces:    'id, name, createdAt, updatedAt',
  publishLog:    'localId, questionId, publishedAt',   // NEW: idempotent re-publish
  examSession:   'attemptId, updatedAt',               // NEW: crash-safe exam cache
});
```

Extend `MCQTags` in `src/types.ts` with **optional** fields — no backfill, no
migration risk:

```ts
export interface MCQTags {
  subject?: string;
  className?: string;
  paper?: string;
  chapter?: string;     // NEW
  year?: number;        // NEW
  board?: string;       // NEW
  difficulty?: 'easy' | 'medium' | 'hard';  // NEW
}
```

A one-time **backfill helper** (`src/lib/exam/backfill.ts`) parses `board` and `year`
out of existing free-text `source` strings (`"রাজশাহী বোর্ড ২০২৩"` → board `রাজশাহী`,
year `2023`) and proposes them in a review UI. Never auto-applies — same principle as
D10 (AI answers must be confirmed).

---

## 7. Build & serving wiring

`vite.config.ts` — add the second entry:

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

`server.ts:194` — branch the catch-all before it swallows `/exam`:

```ts
app.get('/exam*', (_req, res) => res.sendFile(path.join(distPath, 'exam.html')));
app.get('*',      (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
```

Dev mode needs no change — Vite middleware serves `exam.html` directly.

---

## 8. Cozy design system (D23/D24)

The exam entry gets `src/exam/theme.css` defining semantic tokens. **No raw Tailwind
palette classes and no hex outside this file.**

```css
:root {
  /* warm paper ground */
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

Cozy, concretely:

- **Warm cream ground, never pure white.** Soft shadows instead of hard borders.
- **Generous rounding** (16–24 px) and generous line-height — Bangla conjuncts need
  ~1.75 leading to breathe.
- **One question per screen** on mobile. No dense grids. Thumb-reachable options.
- **Muted verdict colors.** A wrong answer is clay, not alarm red. Students take these
  in a row; harsh red 40 times is punishing.
- **Calm motion only:** 150–200 ms fades and 4 px slides, `prefers-reduced-motion`
  respected (the codebase already does this well — match `src/index.css`).
- **Type:** `Hind Siliguri` for Bangla content, `Plus Jakarta Sans` for chrome/numerals.
- **Serious where it counts:** the timer is a calm ring that turns amber under 5 min
  and only then reads urgent. Cozy shell, honest clock.

**No** confetti, XP, or streaks in v1 (D21 scope). Revisit after the first cohort.

---

## 9. Screen-by-screen

| Screen | Contents | Notes |
|---|---|---|
| **SignIn** | Email + password, Google button, "continue as guest" **disabled** in v1 | Bangla-first chrome copy (see §11) |
| **ExamLobby** | Published exams as warm cards: title, subject, N questions, duration, negative marking badge. Filter by subject/chapter/difficulty. | Empty state: "No exams yet — ask your teacher." |
| **ExamRunner** | Sticky top: timer ring + "12 / 25" + flag toggle. Body: `QuestionCard`. Bottom: prev/next + palette sheet. | Answers POST optimistically on tap; queued and retried if offline. |
| **Submitting** | Confirmation with unanswered count ("You left 3 blank. Submit anyway?") then a calm spinner. | Irreversible — must confirm. |
| **Results** | Score ring, correct/wrong/blank, time used, per-chapter accuracy bars. | This is the payoff screen; make it the best-designed one. |
| **Review** | Question-by-question with your choice, correct choice, and explanation. Filter to wrongs only. | Dies without explanations — see risk R3. |

`QuestionCard` must handle all three `questionType` values:
- `standard` — stem + options.
- `roman_statements` — stem, then `romanItems` as a bordered list, then `prompt`, then
  combination options. Do not flatten into the stem.
- `passage` — passage in a sunk surface, sticky/collapsible on mobile so it stays
  reachable while options scroll. **Passage questions must be kept adjacent** in
  `exam_questions.position` so the passage isn't re-shown 5 times apart.

---

## 10. Phases (each ends: `npm run build` green → `/review` → commit)

| Phase | Deliverable | Est. |
|---|---|---|
| **6.0** | Supabase project, `@supabase/supabase-js` added to `library-docs.md`, `.env` keys, `src/lib/supabase/client.ts`, auth screens working end to end. Load the `/supabase` skill first (CLAUDE.md mandate). | 1 d |
| **6.1** | Migrations `0001` + `0002`. RLS **verified by a hostile test**: an authenticated student attempts to select `questions.answer_key`, update `attempts.score`, and update `responses.is_correct` — all three must fail. This is the phase gate. | 1–2 d |
| **6.2** | `normalize.ts` + `grade.ts` + Vitest suite (Bangla numerals, ক/খ/গ/ঘ keys, answer conflicts, negative marking, blanks). Pure logic, no UI. | 1 d |
| **6.3** | Publish seam: `publish.ts`, `publishLog` table, "Publish to bank" in `QuestionBankView` with a rejection report. Teacher can push real questions up. | 1–2 d |
| **6.4** | Exam authoring (teacher, still in the studio): build an `exams` row from a bank filter, set duration + negative marking, publish. Minimal UI — it's for you, not students. | 1 d |
| **6.5** | Edge Functions `start-attempt` + `submit-attempt`, deployed and callable via curl. Test forged submissions. | 1–2 d |
| **6.6** | `exam.html` entry, `theme.css`, `ExamApp` shell, SignIn + Lobby. Mobile-first, verified at 375 px. | 1–2 d |
| **6.7** | `ExamRunner`: state machine, timer, palette, all 3 question types, offline response queue, resume-after-reload. | 2–3 d |
| **6.8** | Results + Review + chapter breakdown. | 1–2 d |
| **6.9** | Font subsetting to woff2, fix the 3 zero-byte Noto files, lighthouse pass on throttled mobile, `progress-tracker.md` + `ui-registry.md` + doc rewrites (§11). | 1 d |

Roughly **11–17 working days**. The exam UI (6.6–6.8) is about a third of it; the
backend is the rest. That ratio is the honest cost of D17.

---

## 11. Documentation debt this creates

Must be done in 6.9, not "later":

1. `context/project-overview.md` — rewrite. It describes a Next.js greenfield repo that
   does not exist, and a non-goals list this plan overrides.
2. `context/auth-plan.md` — "v1: NO authentication" is now false for the exam entry.
   Document the two-surface model: BYOK-only studio, Supabase-auth exam app.
3. `context/library-docs.md` — add `@supabase/supabase-js`; remove "Supabase packages
   (D1)" from the NOT-installed list; correct the Next.js rows to Vite.
4. `context/architecture.md` — add §11 for the exam surface and the publish seam.
5. `context/ui-registry.md` — register every new component.
6. `context/progress-tracker.md` — clear the stale `[!]` font row (fonts ARE
   self-hosted) and log this phase.
7. `CLAUDE.md` — the "This is NOT the Next.js you know" preamble is misleading; this is
   a Vite app.

## 12. Copy language

`context/ui-rules.md` says app chrome is English, Bangla only in content. **That rule
was written for a teacher's tool.** For SSC/HSC students the exam chrome should be
**Bangla-first** ("প্রশ্ন ১২ / ২৫", "জমা দিন", "সঠিক উত্তর"). Proposal: the exam entry
overrides the rule with a small `src/exam/i18n.ts` string table (bn default, en
fallback); the studio keeps English. **Confirm before 6.6** — it changes every label.

---

## 13. Risks

| # | Risk | Mitigation |
|---|---|---|
| **R1** | RLS misconfiguration leaks `answer_key`. This is the failure that makes the whole product pointless. | 6.1 hostile-test gate. `questions` select revoked outright; clients only ever touch `questions_public`. |
| **R2** | Student loses connectivity mid-exam. | Responses queue in `examSession` (Dexie) and flush on reconnect. Server expiry means a disconnected student still can't gain time. |
| **R3** | **Explanation coverage.** The Review screen is the payoff, and `MCQItem.explanation` is optional — much of the bank likely has none. | Measure coverage in 6.3 and report it. If <60 %, Review ships showing "Explanation coming soon" rather than an empty box, and an authoring pass gets its own phase. |
| **R4** | Chapter/difficulty are new optional fields, so most published questions have them empty → lobby filters look broken. | 6.3 publish report shows tag coverage per field; backfill helper (§6) proposed before first publish. |
| **R5** | Two answer representations drift. | §3 rule, enforced at the publish boundary, with visible rejections. |
| **R6** | Mobile payload: 250 KB + 288 KB of unsubsetted Bangla `.ttf`. | 6.9 subsets to woff2 (Bangla + Latin + digits only), target <60 KB each. Fix the zero-byte Noto files. |
| **R7** | Scope creep back into `App.tsx`. | D22 is a hard boundary. If the exam needs something from the studio, it goes through `src/lib/` or Supabase — never an import from `App.tsx`. |
| **R8** | Supabase free tier pauses after 7 days idle; a student hitting a paused project sees an opaque failure. | Surface a plain-language "server waking up, try again" state; consider a keep-alive cron before any real cohort. |

---

## 14. Definition of done

> A student signs in on an Android phone, picks "HSC Physics 1st Paper — Chapter 5",
> answers 25 questions under a 25-minute server-enforced clock, submits, and sees their
> score plus per-chapter accuracy — and cannot see a correct answer before submitting,
> even with devtools open.

Explicitly **not** in v1: practice mode, leaderboards, streaks/XP, teacher-side result
dashboards, question images upload, offline-first full exam download, Bangla/English
toggle, multi-tenant studio migration.
