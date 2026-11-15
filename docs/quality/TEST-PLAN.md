# Test plan

## Automated suites
| Suite | Command | Covers | Last result (2026-11-15) |
|---|---|---|---|
| Unit tests (Vitest) | `npm test` | Answer checking, session generation for every lesson of every course, server grading, guest-import sanitising, progress deltas, spaced repetition, XP/streak/quests, tutor scripts for all nine scenarios, speech assessment, translation coverage, content linter | 39 passed |
| Type check | `npm run typecheck` | Whole codebase, strict mode | Clean |
| Lint | `npm run lint` | ESLint (Next.js rules) over `src`, `e2e`, `scripts` | Clean |
| Content linter | `npm run content:check` | Structure of all four courses | Clean |
| Production build | `npm run build` | All routes | Succeeds |
| Database | `bash supabase/tests/run-local.sh` | Both migrations on a throwaway Postgres 16: signup trigger, RLS isolation, revoked client writes, signature / owner / freshness / version / replay / throttle checks in `apply_progress`, privacy, friends quests, admin functions, account deletion | All checks passed |
| Live backend | `npx tsx e2e/cloud.mts` | Against the real Supabase project through the running app: log-in, forged table writes refused, server-graded XP, replay returns the same result once, throttling (429), locked lesson (403), incomplete session (400), guest import sanitised and one-time, profile privacy, friends quest, account deletion | All checks passed |
| Browser (Playwright, Chromium) | `node e2e/smoke.mjs` | See below | See the latest run in the pull request or commit message |

## What the browser run covers
**Guest journeys** on desktop 1440×900 (English), tablet 820×1180 (Spanish interface) and phone (Hindi interface):
landing → onboarding with language choice (+ placement test on desktop) → path → lesson intro → a full lesson answering
every exercise type, including listening, dictation and speaking through a stubbed speech engine, with one deliberate
wrong answer → summary → reload → practice → vocabulary → guidebook → tutor role-play → leaderboard → quests → profile
→ settings → stories. Axe (WCAG 2.0/2.1/2.2 A + AA rules) runs on each screen on desktop. No console or page errors
are allowed.

**Microphone**: a real `getUserMedia` + `MediaRecorder` recording using Chromium's fake capture device, with speech
recognition removed, to exercise the record → play back → self-check fallback.

**Account journeys** against the live Supabase project (pre-created test accounts): invalid email and wrong password
messages; username validation; log-in restores cloud progress; a network failure while saving keeps the answers and
retry succeeds; the server-awarded XP appears; the path shows the new completion; stored leaderboard; friend search;
an expired session is reported; log-out clears the session; a second device sees the same progress; guest progress
is imported into an account once; account deletion.

## Not tested — treat as unverified
| Area | Why | Risk |
|---|---|---|
| Sign-up confirmation and password-reset emails end to end | Needs a real inbox; the built-in Supabase mailer is rate-limited | **High** until SMTP is configured and tried |
| AI tutor and "explain my mistake" with a live provider | No API key | Medium — request/response parsing is unit-tested; quality is not |
| Server TTS (`/api/tts`) | No provider configured | Low — browser voices are the default |
| Real speech recognition and real voices | Headless Chromium has neither; a stub stands in | Medium — manual check needed on phones |
| Safari, Firefox, iOS, Android browsers | Only Chromium was run | Medium |
| Screen readers | Manual work | See `ACCESSIBILITY.md` |
| Performance and load | Not measured | Low for static pages |

## Manual checks before inviting users
1. Sign up with a real email; follow the confirmation link; complete onboarding.
2. Request a password reset; follow the link; set a new password.
3. Speaking and listening on an iPhone and an Android phone with real audio.
4. With an AI key: run each scenario in each course; check corrections with a native speaker.

## Regression policy
Every bug fixed gets a unit test where the logic lives in `src/lib`, or an assertion in `e2e/smoke.mjs` when it is a
workflow bug.
