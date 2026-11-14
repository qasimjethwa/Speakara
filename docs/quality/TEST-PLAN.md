# Test plan

## Automated suites
| Suite | Command | Covers | Last result (2026-11-14) |
|---|---|---|---|
| Unit tests (Vitest) | `npm test` | Answer checking, session generation for every lesson of every course, spaced repetition, XP/streak/quests, learner model, unlock rules, scripted tutor, content linter | 27 passed |
| Type check | `npm run typecheck` | Whole codebase, strict mode | Clean |
| Content linter | `npm run content:check` | Structure of all four courses | Clean |
| Production build | `npm run build` | 22 routes generated | Succeeds |
| Database | `bash supabase/tests/run-local.sh` | Migration applies; signup trigger; RLS isolation; XP cap and immutability; RPCs; cascade delete | All checks passed on local Postgres 16 with a stub `auth` schema |
| End to end (Playwright) | `node e2e/smoke.mjs` against `npm start` | Full guest journey on desktop (1440×900) and Pixel 7: landing → sign-up page → onboarding (+ placement on desktop) → lesson with a deliberate wrong answer → summary → persistence across reload → practice → vocabulary → guidebook → scripted tutor → leaderboard → quests → profile → stories → (desktop) story completion and course switch | All checks passed, no page errors |

## What the end-to-end run asserts
First lesson is current and later ones locked; a wrong answer is asked again; XP on the summary matches the formula;
streak starts; the completed lesson and the next unlock show on the path; state survives reload and the stored learner
model is consistent; practice completes; the notebook lists met words; the tutor coaches on a miss and advances on a
good reply; AI-only scenarios are disabled rather than dead; the transcript is saved; bots are labelled; a perfect
100% placement puts the learner in Unit 3; a story pays 12 + 5 XP; switching course shows the French path.

## Not tested — treat as unverified
| Area | Why | Risk |
|---|---|---|
| Sign-up, login, cloud sync, guest-to-account migration, live leaderboard, friends | No Supabase project was available | **High** — client adapter is untested against real PostgREST |
| AI provider path | No API key | Medium — parsing is unit-tested; prompts and quality are not |
| Listening and speaking with real audio | Headless browser has no voices or microphone; the test uses the skip buttons | Medium — manual check needed in Chrome, Safari, Firefox |
| Safari, Firefox, iOS | Only Chromium was run | Medium — Web Speech support differs (Firefox has no recognition) |
| Screen readers, keyboard-only full journey | Manual work | See `ACCESSIBILITY.md` |
| Performance, load | Not measured | Low for static pages |
| Tablet widths, landscape | Not run | Low |

## Manual test script for go-live
1. Sign up with a new email; confirm the profile appears and onboarding starts.
2. Complete a lesson; check rows in `lesson_completions`, `xp_events`, `review_items`.
3. Log in on a second browser; progress matches.
4. Learn as a guest, then sign up; guest progress appears in the account.
5. Two accounts: follow, see each other on the leaderboard after earning XP.
6. With an AI key: run each scenario in each course; check corrections are accurate.
7. Speaking and listening on a phone with real audio.
8. Throttle the network to offline mid-lesson; confirm the sync banner and recovery.

## Regression policy
Every bug fixed gets a unit test where the logic lives in `src/lib`, or an assertion in `e2e/smoke.mjs` when it is a
workflow bug.
