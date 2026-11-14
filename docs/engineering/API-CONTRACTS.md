# API contracts

Speakara has one custom HTTP endpoint; everything else is Supabase (PostgREST tables under RLS, and three RPCs).

## `GET /api/tutor`
Reports which tutor backend is active. Response `200`: `{ "provider": "scripted" | "anthropic" | "openai-compatible" }`.

## `POST /api/tutor`
Request body:

| Field | Type | Rules |
|---|---|---|
| `scenario` | string | One of the ids in `src/lib/tutor/scenarios.ts` |
| `target` | `"es" \| "en" \| "fr" \| "hi"` | Language being learned |
| `targetName`, `nativeName` | string | ≤ 30 chars |
| `level` | string | ≤ 40 chars, free text used in the prompt |
| `history` | `{ role: "tutor" \| "learner", text }[]` | Last 16 kept; each text cut to 500 chars. Empty history asks the tutor to open the scene |
| `step`, `retry` | integer, boolean | Echo the values from the previous response (scripted-scene cursor) |

Response `200` (`TutorReply`):

| Field | Type | Meaning |
|---|---|---|
| `reply` | string | Tutor line in the target language |
| `translation` | string? | In the learner's language |
| `correction` | string? | Corrected version of the learner's last message (AI providers) |
| `tip` | string? | One teaching note or a model answer |
| `vocab` | `{ t, n }[]`? | Useful phrases (≤ 5) |
| `step`, `retry`, `done` | | Cursor and end-of-scene flag |
| `provider` | string | Which backend answered |

Errors (JSON `{ "error": string }`, written to be shown to the learner): `400` invalid body/scenario/language;
`429` more than 40 requests per 10 minutes from one client; `503` scenario needs an AI provider and none is available.
If a configured provider fails or returns unparseable output, the route silently falls back to the scripted scene.

## Supabase RPCs
| Call | Arguments | Row shape |
|---|---|---|
| `rpc("weekly_leaderboard", { max_rows })` | 1–100 | `{ user_id, display_name, weekly_xp }` |
| `rpc("find_profiles", { q })` | ≥ 2 chars, username prefix | `{ id, username, display_name, xp, streak_count, following }` |
| `rpc("my_friends")` | — | `{ id, username, display_name, xp, streak_count }` |

## Supabase table access used by the client
Reads: one `select *` per learner table on sign-in (`loadCloud`). Writes: `update` on `profiles`; `upsert` on
`lesson_completions`, `course_unlocks`, `story_completions`, `review_items`, `user_achievements`, `xp_events`,
`quest_days`, `tutor_conversations`, `mistakes`; `delete` on `mistakes` and `follows`; `insert` on `follows`.
Column names are documented in `DATABASE-SCHEMA.md`.

## Internal TypeScript contracts
`Exercise`, `Answer`, `Verdict` (`src/lib/engine`), `SessionResult`, `SessionSummary` (`src/lib/state/actions.ts`) and
`LearnerState` (`src/lib/state/types.ts`) are the contracts a future server-side session service must keep.

## Planned
`POST /api/sessions/complete` (server-authoritative XP), `POST /api/speech/assess`, content CRUD for editors.
