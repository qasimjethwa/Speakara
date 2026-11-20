# Speakara — project handoff (read this first in a new chat)

Last updated 2026-11-20. Production: **https://speakara.vercel.app**, branch `claude/wizardly-wozniak-9582qa`, last
commit `037176f` (the last code change is `e511c32`). Everything below was checked against the repository on that date.

## 1. What Speakara is

A free language-learning web app in the style of Duolingo, with no paywall, no lives and no subscription. Learners take
bite-sized lessons, read stories, practise speaking, review with spaced repetition and chat with a scripted tutor.
Seven target languages are taught **to English speakers**: Spanish, French, German, Korean, Italian, Russian and Arabic
(Modern Standard Arabic). There are also two small reverse starter courses (English for Spanish speakers, English for
Hindi speakers). The interface itself is available in English, Spanish and Hindi.

Works as a **guest** (progress saved in the browser) or with an **account** (progress synced through Supabase).

## 2. Hard rules from the owner (keep following these)

- Preserve existing courses, lesson/word/sentence IDs, user progress and Supabase data. IDs are positional
  (`unit.lessonIndex.w|s index`, for example `ar3.2.s1`). **Only ever append; never renumber or reorder.**
- No emails, subscriptions, payment systems or unnecessary redesigns. The scripted tutor (/tutor) works without any AI API and must stay
  that way. **Exception approved by the owner on 2026-11-20:** Speakara Live (section 15) uses Gemini Live, Anam and LiveKit.
- Never delete production test accounts or real user records. Account deletion in tests runs only with `E2E_ALLOW_DELETE=1`.
- Never put the Supabase service-role key in the browser; never expose secrets. No service-role key is used anywhere.
- Never report a test, review or deployment as successful unless it actually happened. Mark untestable things
  **NOT VERIFIED**. Never claim native-speaker review has happened (it has not, for any course).
- Release process: feature branch → all checks → Vercel preview → verify → promote only if every gate passes → verify
  production. Do not open a pull request unless asked.
- Keep the owner's email and personal details out of repo files and external requests.
- Commit trailer: `Co-Authored-By: <current model> <noreply@anthropic.com>` then
  `Claude-Session: https://claude.ai/code/session_01EPKBs42rYoX8s6BopUh9Bp`. Do not put model IDs in repo files.

## 3. Where everything lives

| Thing | Value |
|---|---|
| GitHub repo | `qasimjethwa/Speakara` (the old `qasimjethwa/rea` name redirects) |
| Production branch | `claude/wizardly-wozniak-9582qa` (Vercel deploys it to production on every push) |
| Other branches | `claude/arabic-neural-voice` (Arabic voice work, same code as production), `claude/speakara-six-language-release`, `claude/speakara-quality-pass` (older) |
| Vercel | team `nexora-4383`, project `prj_Ck6dgUlSmfN87jV6MKO4WmKTFc8y`. Previews are protected by Vercel login; use the Vercel MCP `get_access_to_vercel_url` for a share link |
| Supabase | project `mpgldpkxfhxvbdoouqjw` (accounts, progress, leagues, friends). Migrations in `supabase/migrations/` |
| Env vars on Vercel | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `PROGRESS_SIGNING_SECRET` (must equal the `progress_hmac` row in `private.app_secrets`). No AI or server-TTS keys are set |
| Test accounts | `e2e-ana`, `e2e-ben`, `e2e-cara` at `@speakara.test`, created by SQL insert into `auth.users` and `auth.identities`; the password is in `E2E_PASSWORD`, not in the repo. One real user account exists: never touch it |

**The owner also pushes to the production branch** (Vercel Web Analytics was merged there as pull request #1 while work
was in progress). Always `git fetch` and merge before pushing; never force-push.

## 4. Stack

Next.js 16 (Turbopack, App Router), React 19, TypeScript (strict), Tailwind 4, Supabase (Postgres + Auth + row-level
security), Vercel, `@vercel/analytics`. Tests: Vitest (91 unit tests), Playwright, axe-core. Fonts: Nunito, Noto Sans
Devanagari and Noto Sans Arabic (`@fontsource-variable`).

## 5. Code map

```
src/app/            pages: learn, lesson, practice, stories, story, tutor, vocabulary, guidebook, quests, leaderboard,
                    profile, settings, onboarding, login, signup, forgot/reset-password, about, features, licenses, admin
src/app/api/        progress (server re-grades and signs results), tutor (scripted or optional AI), tts (optional server voices)
src/components/     AppShell, CourseCards, ArabicVoiceCard (Settings), ArabicKeyboard (in lesson/), VoiceNotice,
                    ServiceWorker, lesson/{ExerciseViews, LessonPlayer, SessionSummary}, ui.tsx (Button, Card, Dialog, Confetti...)
src/lib/content/    types.ts, index.ts (COURSES), languages.ts (TARGET_LANGUAGES), lint.ts, courses/{es-en, starters, languages, ar-en}.ts
src/lib/engine/     exercises.ts (generators + grading), text.ts (normalisation), plan.ts, srs.ts, gamification.ts, grade.ts
src/lib/state/      store.tsx, persistence.ts, actions.ts, delta.ts, types.ts (guest local storage and cloud sync)
src/lib/tutor/      scenarios.ts (9 scenes, scripts per language), engine.ts (scripted reply), providers.ts (optional AI)
src/lib/audio.ts    say(), stopSpeaking(), voice picking, speech recognition, sound effects (single entry point for speech)
src/lib/arabic-voice.ts   on-device Arabic voice (see section 8)
src/lib/i18n/       translations.json (every UI string needs a Spanish and Hindi entry; a test enforces it)
src/lib/server/     progress.ts (server-side grading)
src/vendor/nabra-tts/     vendored Arabic voice engine (do not edit; see PROVENANCE.md)
public/sw.js        offline service worker (production only)
scripts/            check-content.ts, content-audit.ts, i18n-keys.ts, voice-assets.mjs
e2e/                languages.mjs, arabic-voice.mjs, smoke.mjs, cloud.mts, speech-fallback.mjs, real-voices.mjs, dump-content.ts
supabase/           migrations (learner_core, server_authority), tests (rls_test.sql, run-local.sh)
docs/               product, design, engineering, quality, content, research (see section 12)
```

## 6. Courses (verified 2026-11-20)

| Course | Units | Lessons | Words | Sentences | Stories | Review status |
|---|---|---|---|---|---|---|
| es-en Spanish | 3 | 12 | 71 | 48 | 3 | author-reviewed, native review pending |
| fr-en French | 2 | 6 | 36 | 24 | 1 | native review pending |
| de-en German | 2 | 6 | 36 | 24 | 1 | native review pending |
| ko-en Korean | 2 | 6 | 36 | 24 | 1 | native review pending |
| it-en Italian | 2 | 6 | 36 | 24 | 1 | native review pending |
| ru-en Russian | 2 | 6 | 36 | 24 | 1 | native review pending |
| **ar-en Arabic (MSA)** | **10** | **50** | **300** | **200** | **10** | native review pending |
| en-es, en-hi (reverse starters) | 1 each | 2 each | 12 | 8 | 0 | en-hi needs Hindi review |

- A course is built with `buildCourse(meta, rawUnits)` in `src/lib/content/types.ts`. Each unit has tips (guidebook),
  lessons (words + sentences with optional accepted alternatives) and optionally a story with comprehension questions.
- Arabic: units 1–6 are A1, 7–10 are A2. Unit 1 is fully vowel-marked (harakat); later sentences are unmarked as in
  everyday print. Answer checking ignores vowel marks.
- Content checks: `npm run content:check` (lint all courses), `npm run content:audit [-- --sheets]` (quality audit plus
  native-review sheets in `docs/content/review/`, each marked NOT REVIEWED).
- Adding a language: add a course file, register it in `COURSES`, add an entry in `TARGET_LANGUAGES`
  (`code`, `courseId`, `tts`/`stt` locale, `script`, optional `rtl`), add `LangCode` in `types.ts`, add tutor scripts, add
  the flag to the e2e course lists, add any new UI strings to `translations.json`.

## 7. Learning engine

- Eight exercise types: choose, wordbank (tiles), translate, listen, dictation, speak, match, fill. Lessons mix them
  from easy recognition to production, re-asking misses.
- Grading is deterministic (`exercises.ts` and `text.ts`): normalises case, punctuation, Russian ё/е and stress marks,
  Arabic vowel marks and tatweel; accepts missing Latin accents and small typos with a note; Arabic hamza/ya/ta-marbuta
  variants are accepted with a spelling note. A different word is never accepted.
- The browser builds a session from a plan; **the server rebuilds the same session and re-grades the submitted answers**
  (`/api/progress`) then signs the result; the database verifies the signature before changing XP, gems, streaks or
  completions. Generated sessions are deterministic from a seed, so changing generator code changes every existing
  course's exercises. Arabic-specific behaviour is isolated behind `keyFor(course)`; a regression check showed
  existing courses generate byte-identical sessions.
- Spaced repetition, quests, streaks, gems, leagues, friends and achievements are in `srs.ts`, `gamification.ts`, the
  store and the Supabase schema.
- Arabic UI: right-to-left text (`:lang(ar)` CSS), RTL tiles and answer boxes, a built-in on-screen Arabic keyboard
  (letters, hamza forms, optional vowel marks) in typed answers and the tutor, and joined-letter rendering via Noto Sans Arabic.

## 8. Audio and speech

- **One entry point:** `say(text, lang, rate)` in `src/lib/audio.ts`. Lessons, vocabulary, guidebook, stories and the
  tutor all call it. Other languages use the browser's own voices (`speechSynthesis`), picked by exact language subtag
  (so Korean never matches Konkani). If no voice exists for the language, **nothing is spoken** (never a wrong-language
  voice) and a notice explains why (`VoiceNotice`).
- Speech recognition uses the browser API with a 12 s watchdog; after repeated no-speech, timeout, permission denial or
  unsupported errors it falls back to recording the learner. Chromium builds without a speech service, Firefox and
  WebKit have no recognition API.
- Sound effects are synthesised with Web Audio (no recordings shipped); toggled in Settings.
- **Arabic on-device voice** (opt-in): Settings → Arabic voice → Download. Engine `nabra-tts`, vendored at commit
  `16b5281` (not on npm); model Nabra-7M-Distill-ONNX at revision `bbac0f1`; `onnxruntime-web` pinned to exactly
  `1.30.0`. Runs in a Web Worker so the UI never freezes. Model and runtime are self-hosted from `/vendor/...`
  (prepared by `scripts/voice-assets.mjs` before `dev` and `build`, SHA-256 verified; `public/vendor` is git-ignored).
  Cached in Cache Storage plus a production service worker so it works offline after the first download.
  **Synthesis runs on WebAssembly by default.** WebGPU/FP16 on real GPUs crackled for a learner and failed for another
  before the fixes; WebGPU is behind `localStorage["speakara:arabic-voice:webgpu"]="1"`, falls back to WASM on failure
  and remembers it. Playback: `latencyHint: "playback"`, invalid samples dropped, peak limited, 10 ms edge fades,
  in-memory replay cache, 25 s watchdog, cancel on new tap, slow mode uses the model's speed 0.75.
- Full evaluation, licences and measured results: `docs/quality/ARABIC-VOICE.md` and `src/vendor/nabra-tts/PROVENANCE.md`.
- **Licence caution:** the Arabic voice bundles eSpeak NG (**GPL-3.0-or-later**) as WebAssembly in its worker. The owner
  approved shipping it; the notice and corresponding-source links are on `/licenses`. Speakara has no licence file of its own.

## 9. Tutor

Nine scenarios: meet, restaurant, everyday, shopping, airport, hotel, interview, university, travel. Scripted scenes
(deterministic phrase matching, no AI) exist per language: es 9, fr 9, de/ko/it/ru 6 each, ar 7 (all but interview and
university). Optional AI is wired but **not configured** (`AI_PROVIDER` etc. empty). `/api/tutor` accepts every course
language (it previously rejected de/ko/it/ru).

## 10. Testing and running

```bash
npm ci && npm run dev                       # predev downloads ~45 MB voice model (needs internet)
npx tsc --noEmit && npm run lint && npm test && npm run content:check   # static gates (91 unit tests)
npx next build && npx next start -p 3000    # then run e2e against http://localhost:3000
node e2e/languages.mjs [url]                # all 7 languages end to end; E2E_LANG=ar-en for one; E2E_LANG=ar-rtl for Arabic RTL/keyboard/tutor
E2E_AUDIT=1 [E2E_AUDIT_COURSE=ar-en] node e2e/languages.mjs [url]   # 12-viewport audit (zero overflow, 44px targets, axe)
node e2e/arabic-voice.mjs [url]             # real Arabic voice: download/retry, speak, replay, slow, offline, low-memory, WebGPU fallback
node e2e/speech-fallback.mjs, node e2e/real-voices.mjs   # recogniser fallbacks; real eSpeak voices (Firefox)
bash supabase/tests/run-local.sh            # database access rules on a throwaway Postgres
npx tsx e2e/cloud.mts [url]                 # live-backend checks (needs test accounts and E2E_PASSWORD)
```

- Browser env: `E2E_BROWSER=chromium|firefox|webkit`, `NODE_PATH=$(npm root -g)` (global Playwright), and
  `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-extra` for Firefox/WebKit (installed in the sandbox; Chromium is in `/opt/pw-browsers`).
- Protected previews: `E2E_SHARE=<token from _vercel_share link>`; `E2E_IGNORE_TLS=1` only for sandboxes with a proxy certificate.
- **Owner decision: Firefox is no longer part of release checks** (it passed on the last runs). Check Chromium and WebKit.
- Sandbox lessons: headless WebKit sometimes crashes (a compositor segfault, "WebKit encountered an internal error"); rerun
  once, it is not an app failure. Playwright's emulated offline mode breaks WebKit reloads, so `arabic-voice.mjs` stops the
  local server for a real network cut. Do not use `pkill -f` with a pattern your own command line contains. The container
  can reset and lose uncommitted work and `node_modules`: **commit and push often**.

## 11. Verification status (be honest about it)

Verified in this project's test environment (headless Linux): static checks; unit tests; language journeys and
12-viewport audits in Chromium and WebKit (Firefox earlier); the Arabic voice end to end in Chromium, Firefox and WebKit
including offline; the production site after each release; one real learner confirmed the voice works after the fixes.

**NOT VERIFIED:** real Safari on Mac/iPhone; real Android or iOS devices; WebGPU and FP16 on real GPUs; real speech
recognition (simulated in tests); any native-speaker review of any course; Arabic-speaker approval of the voice's
pronunciation. The last full regression after the final merge covered voice + Arabic/Spanish journeys; the complete
all-language and WebKit audit matrix was last run fully before the Analytics merge. `smoke.mjs`, `cloud.mts` and the
database tests were not re-run after the Arabic work.

## 12. Known issues and drift

- `README.md` is stale: it says six languages and 61 unit tests, and lists `TTS_API_URL` (the real names are
  `TTS_BASE_URL`, `TTS_API_KEY`, `TTS_MODEL`, `TTS_VOICE`). It does not mention Arabic or the voice. `docs/quality/FINAL-PRODUCT-AUDIT.md` predates Arabic.
- Arabic voice quality: Whisper-based round-trip error was 10–16% on unmarked course text (8.8% with full vowel
  marks, versus 49% for the eSpeak system voice). Unmarked sentences in units 2–10 are the weak point (the voice guesses
  vowels). Needs an Arabic speaker; listening packet in `docs/content/review/ar-voice/`.
- In the tutor, the Arabic keyboard starts collapsed and can cover recent messages when opened until you scroll.
- The service worker (`public/sw.js`) must not intercept `_rsc` data, prefetches or uncached chunks (it caused Firefox
  errors); keep it conservative.
- `onnxruntime-web` is pinned exactly and `scripts/voice-assets.mjs` refuses any other version; the model hashes there
  must match `src/lib/arabic-voice.ts` (a unit test checks).
- Next 16 needs the Turbopack alias for Node's `module` in `next.config.ts` (nabra's worker references it).

## 13. Good next steps

1. Get an Arabic speaker to review the course and the voice; add vowel-marked speech forms for units 2–10 so the voice
   pronounces them correctly (append-only data change).
2. Update `README.md` and `FINAL-PRODUCT-AUDIT.md` for Arabic, 91 tests, the voice and the real env var names.
3. Re-run the full regression (`smoke.mjs`, `cloud.mts`, database tests, WebKit audits) on the current production commit.
4. Native review for the other five languages; expand the thin 2-unit courses (fr, de, ko, it, ru) toward the Arabic course's depth.
5. Test the voice on real iPhone, Android and Mac; listen to WebGPU/FP16 before ever re-enabling it by default.
6. Decide whether the GPL component in the voice needs a licence file and source offer process for the repository.

## 14. How to start a new chat

Paste or attach this file and say what to build. A good opening: "Read `docs/HANDOFF.md` in `/home/user/speakara`, work on
a new branch off `claude/wizardly-wozniak-9582qa`, follow its rules and release process, and ask me before anything outward-facing."

## 15. Speakara Live (added 2026-11-20, branch `claude/hopeful-hypatia-19kael`, NOT yet deployed)

Two new experiences under `/live`, for signed-in learners only (guests see a sign-up prompt):

- **AI companion** (`/live/companion`): spoken conversation with a pre-made Anam avatar driven by Gemini Live, in a
  LiveKit room. Personalised name, personality, teaching style, Gemini voice, language, level and scenario; learning
  report afterwards; learning memory (`/live/memory`) saved only with consent, viewable and deletable.
- **Community language exchange** (`/live/community`): one-to-one LiveKit video calls between learners. Live matching
  queue (reciprocal languages first, then same target language at a similar level; interests break ties), mutual
  acceptance, mute/camera/end, prompts, a phrasebook help panel built from course content, call notes, block and
  report. Adults only (self-attested 18+). Uses no Anam minutes.

Architecture: Next.js API routes (`src/app/api/companion`, `src/app/api/community`, `src/app/api/live`) →
`public.live_op()` (HMAC-signed with `PROGRESS_SIGNING_SECRET + ':live'`, nonce, 2-minute expiry) in Supabase. The
Python worker in `agent/` runs on LiveKit Cloud (never Vercel); see `agent/README.md`.

Anam free plan safeguards (all server-side, in `supabase/migrations/20261120000000_live_conversations.sql`): 28 of the
30 monthly minutes are usable (`private.live_config`), shared by the whole app; each conversation reserves at most
165 s up front (ends before Anam's 3-minute cap); one avatar session at a time (row lock); unused time is refunded
only after the room is confirmed closed; abandoned sessions expire fully charged; the worker must claim a session once
before starting Anam. **Public access is off** (`LIVE_AVATAR_ACCESS` unset = editors/admins only) until the owner
confirms Anam's free-plan terms allow it: the pricing page lists commercial use as not included on Free.

Vercel env needed: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVE_WORKER_SECRET` (new), optional
`LIVE_AVATAR_CATALOG` and `LIVE_AVATAR_ACCESS=everyone`. Worker env: see `agent/README.md`. `ANAM_API_KEY` and
`GEMINI_API_KEY` belong only to the worker.

Tests: `bash supabase/tests/run-local.sh` (includes `live_test.sql`); `npx vitest run`; `agent/test_prompts.py`;
`e2e/live.mjs` against a local stack (`e2e/live/stack.sh`: real Postgres + a fake Supabase HTTP layer; LiveKit is
not running there, so media connection failure paths are what is checked). Real audio/video, Gemini and Anam are NOT
VERIFIED until run with real keys (checklist in `agent/README.md`).
