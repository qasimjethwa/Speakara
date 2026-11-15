# API contracts

Speakara has three custom HTTP endpoints; everything else is Supabase (tables under RLS and the RPCs listed in
`DATABASE-SCHEMA.md`).

## `POST /api/progress`
The only way a signed-in learner's rewards or progress change. Header `Authorization: Bearer <Supabase access token>`.

| `op` | Body | Effect |
|---|---|---|
| `session` | `operationId`, `tzOffsetMin`, `plan` (`SessionPlan`), `attempts` (`{id, answer \| skipped}[]`), `seconds` | Server rebuilds and grades the session, applies XP, streak, quests, achievements, review schedule |
| `freeze` | `operationId` | Spends 50 gems on a streak freeze (max 2) |
| `conversation` | `operationId`, `conversation` | Stores a tutor transcript |
| `friend_claim` | `operationId`, `friendId` | Pays 20 gems for a completed friends quest |
| `import` | `operationId`, `tzOffsetMin`, `guest` (device learner state) | One-time validated import into an empty account |

Response `200`: `{ state, version, summary?, duplicate? }`. Errors `{ error, code }`: `400 bad_request/incomplete`,
`401 unauthenticated`, `403 locked`, `409 stale/not_allowed/already_imported`, `429 too_fast`, `503 not_configured`.
`operationId` makes every call idempotent. Details: [SERVER-AUTHORITY.md](SERVER-AUTHORITY.md).

## `GET /api/tts?lang=&text=`
Optional server text-to-speech proxy (OpenAI-compatible `/audio/speech`). `404` unless `TTS_*` variables are set.
Responses are cached for a year (`immutable`). Not exercised against a live provider.

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

Explain mode: `{ "mode": "explain", target, targetName, nativeName, prompt, expected, given }` → `{ explanation }`
(needs an AI provider; cached per distinct mistake). Opening lines of AI scenes are cached for six hours.

Errors (JSON `{ "error": string }`, written to be shown to the learner): `400` invalid body/scenario/language;
`429` more than 40 requests per 10 minutes from one client; `503` no scripted scene exists for that course and no provider is available.
If a configured provider fails or returns unparseable output, the route silently falls back to the scripted scene.

## Supabase RPCs
| Call | Arguments | Row shape |
|---|---|---|
| `rpc("weekly_leaderboard", { max_rows })` | 1–100 | `{ user_id, display_name, weekly_xp }` |
| `rpc("find_profiles", { q })` | ≥ 2 chars, username prefix | `{ id, username, display_name, xp, streak_count, following }` |
| `rpc("my_friends")` | — | `{ id, username, display_name, xp, streak_count }` |

## Supabase table access used by the client
Reads: one `select` per learner table on sign-in (`loadCloud`). Writes: `update` of the allow-listed `profiles`
columns, `insert`/`delete` on `follows`, `insert` on `content_suggestions` (and `update` for staff). Nothing else.

## Internal TypeScript contracts
`Exercise`, `Answer`, `Verdict` (`src/lib/engine`), `SessionResult`, `SessionSummary` (`src/lib/state/actions.ts`) and
`LearnerState` (`src/lib/state/types.ts`) are the contracts a future server-side session service must keep.

## Planned
`POST /api/speech/assess` (phoneme-level scoring), content CRUD for editors.
