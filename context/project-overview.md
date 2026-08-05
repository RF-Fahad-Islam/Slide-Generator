# Project Overview

> Read this first. It tells you what exists, what we're building, and what NOT to build.

## What this is

An MCQ → slide generator for **Bangladeshi edtech** (SSC, HSC, university admission
prep). The user pastes raw question text; **Gemini** extracts structured MCQs; the user
reviews/edits them; the app renders slides (Bangla + LaTeX aware) and exports **PNG**
and **editable-hybrid PPTX**.

**v1 is a personal, local-first tool.** No accounts, no server persistence, no tenants.
SaaS comes later as an additive layer (see `auth-plan.md`).

## Repository state

Greenfield. As of this writing the repo contains only: `plan.md`, `context/` (these
docs), `AGENTS.md`, `CLAUDE.md`, `.agents/`, `.claude/`, `.opencode/`, `docs/nextjs-llms.txt`.
There is **no `package.json`, no `src/`, no git repo yet** — Phase 0 creates them.

## The two input modes (one shared editor)

1. **AI mode (primary, built first):** paste text → `POST /api/extract` → Gemini
   structured output → review screen (accept/edit/discard, confidence flags) → editor.
2. **Manual mode (Phase 3):** offline bulk-paste parser (Bangla-aware regex), CSV
   import, hand entry. Zero API calls. This is the fallback when AI misfires and the
   "no network" path.

Both land in the **same Deck editor** and the **same render pipeline**.

## Domain: BD edtech specifics that shape the data model

- **Question types:** `plain` MCQ; `statement` (bohupodi — statements i/ii/iii where
  options are combinations like "i ও ii"); `passage` (shared stem, Phase 3).
- **Stems may be** plain text, **LaTeX** (math: `y = ln(x)`, `dy/dx`), or an **image**.
- **Every question carries tags:** `examLevel` (SSC/HSC/Admission), `board` (Dhaka,
  Chattogram, Rajshahi, Jessore, Comilla, Barisal, Sylhet, Dinajpur, Mymensingh),
  `subject`, `chapter`, `year`, `difficulty`, plus free-text `source`
  (e.g. `"চট্টগ্রাম বোর্ড ২০১৭"`). Tags exist in v1 so the later shared QuestionBank
  needs no schema change.
- **Bangla numerals** (০-৯) appear in source text and must normalize to 0-9 for keys.
- **Correct answer must never be silently AI-inferred** — confidence flag + human confirm.

## Outputs

- **PNG** per slide (16:9 in the spine; 1:1/4:5/9:16 in Phase 4), single or ZIP.
- **PPTX** (16:9 fixed): Bangla as native editable text boxes; LaTeX as embedded
  typeset images; raw LaTeX source in speaker notes; question + answer-reveal slide
  per MCQ; optional title and paginated answer-key slides.

## Vocabulary

Defined once in `plan.md` §3 — Deck, BrandKit, Template, Variant, slideKind, stemType,
question type, Tags, BYOK. Use those exact terms in code, schemas, file names, and UI copy.

## Non-goals for v1 (do not build)

Auth/accounts, organizations/tenants, RLS, shared question bank, server-side export
workers, OpenRouter (interface stub only), drag-canvas layout editor, MP4 export,
Tesseract OCR, XLSX import, collaboration, telemetry.

## How to work in this repo (for worker agents)

1. Read `plan.md` (the why) then `context/build-plan.md` (the what) for your phase.
2. Decisions in `plan.md` §4 are **locked**. If one seems wrong, stop and ask.
3. Follow the phase workflow in `CLAUDE.md`: `/architect` before a phase → implement →
   `/review` → commit → `/remember save`. Branch per phase (`feat/phase-N-...`).
4. Update `context/progress-tracker.md` and `context/ui-registry.md` after every feature.
