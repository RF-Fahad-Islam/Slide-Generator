# Auth Plan

## v1: NO authentication. Local-only.

There are no user accounts in v1. The app runs locally (`next dev`), persists to
IndexedDB, and the only credential in the system is the user's own **Gemini API key**
(BYOK). Do not add login, signup, sessions, or any auth library in v1.

## BYOK key handling (the only security-sensitive flow in v1)

Rules (invariant — see `architecture.md` §10.4):

1. The key lives in `localStorage` under a namespaced key (e.g. `mcqgen.geminiKey`).
2. It is sent **per request** as a header (`x-gemini-key`) to our own route handler
   `POST /api/extract`.
3. The route handler constructs the `@google/genai` client with that key **for that
   one call only**. The key is never written to disk, never in env vars, never logged.
4. Error paths: any error surfaced to the client must be scrubbed — never include the
   key or any fragment of it in error messages (including upstream Google errors;
   map them to generic messages with status codes).
5. The Settings page states this plainly ("your key is stored only in this browser and
   sent only to Google through this app") and links to Google AI Studio's key page.
6. Streaming responses must not echo request headers.

**Key hygiene acceptance test (Phase 2 gate):** with devtools open, the key appears
only in the outgoing `/api/extract` request headers; server logs contain no key
material; submitting a deliberately invalid key yields an error with no key fragment.

## The SaaS seam (later — do NOT build now)

When the product goes multi-tenant (Phase 6, per plan.md §7):

- **Supabase Auth** (email + OAuth), profiles → `org_id`.
- **Row Level Security** on every table: `org_id = (select org_id from profiles where
  id = auth.uid())`. v1 policies assume single-owner orgs; member invites/roles later.
- Tables: `orgs`, `brand_kits`, `questions` (shared QuestionBank — tags already exist
  in v1 schema, so no field changes), `decks`, `deck_items`, `templates`.
- The `src/lib/storage/` interface gets a Supabase implementation next to the IndexedDB
  one. The render pipeline does not change (D1).
- BYOK key storage moves to Supabase Vault (or stays client-side per session) — decide
  at that time with the user.

## Why this order (rationale)

Auth/RLS/tenancy is weeks of work with zero value for a single user. Building the
render pipeline tenant-shaped but auth-free keeps v1 fast and the migration additive.
