# Speakara

A free language-learning platform: bite-sized lessons, spaced review, stories, speaking practice and a tutor —
with no paywalls, no lives and no subscription. Independent project; original content, mascot and design.

> **Status:** the app is complete and tested locally against the live Supabase project. Production deployment on Vercel is pending team authorisation — see [Feature status](#feature-status).

## Quick start
```bash
npm install
npm run dev          # http://localhost:3000
```
With no configuration the app runs in guest mode (progress saved in the browser). To enable accounts, copy
`.env.example` to `.env.local` and fill in the three Supabase values. Behind an HTTP proxy start the server with
`NODE_USE_ENV_PROXY=1`.

Requires Node.js 20+ (built and tested on 22).

## What's inside
- **Courses**: Spanish for English speakers (A1: 3 units, 12 lessons, 3 stories) plus starter units for French,
  English for Spanish speakers and English for Hindi speakers.
- **Exercise engine**: eight exercise types (multiple choice, word bank, translation, listening, dictation, speaking,
  matching, fill-in-the-blank) generated from course words and sentences; deterministic grading with typo and accent
  tolerance; missed items come back until you get them.
- **Server authority**: for signed-in learners the server re-builds each session, grades it and signs the result; the
  database refuses anything unsigned, replayed or stale. See [`SERVER-AUTHORITY.md`](docs/engineering/SERVER-AUTHORITY.md).
- **Accounts**: sign-up, log-in, log-out, password reset, account deletion, sync across devices, and a one-time import
  of guest progress when a guest creates an account.
- **Practice hub** (review, mistakes, listening, speaking, writing, timed matching), stories, guidebooks, placement
  test, jump-ahead tests, vocabulary notebook with saved phrases.
- **Tutor**: nine role-play scenarios, scripted so they work with no API key; open-ended AI conversation and
  "explain my mistake" when a provider key is configured (Anthropic or any OpenAI-compatible endpoint).
- **Audio**: browser speech synthesis with voice selection, replay and slow speed; microphone recording; speech
  recognition where the browser has it, with record-and-self-check as the fallback.
- **Motivation**: XP with a published formula, streaks and earned streak freezes, gems (never sold), daily quests,
  achievements, weekly leaderboard, friends, friends quests, profile privacy.
- **Interface languages**: English, Spanish, Hindi — independent of the course being studied.
- **Admin**: `/admin` (usage numbers, user roles) and `/admin/content` (review learner content suggestions), staff only.

## Commands
| Command | Purpose |
|---|---|
| `npm run dev` / `npm run build` / `npm start` | Develop, build, serve |
| `npm test` | Unit tests (39) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, strict |
| `npm run content:check` | Lint course content |
| `bash supabase/tests/run-local.sh` | Apply the migrations to a throwaway local Postgres and test access rules |
| `npx tsx e2e/cloud.mts [url]` | Integration checks against the live backend (needs the test accounts and `E2E_PASSWORD`) |
| `NODE_PATH=$(npm root -g) node e2e/smoke.mjs [url] [screenshot-dir]` | Browser journeys on desktop, tablet and phone with accessibility scans (needs Playwright; set `E2E_PASSWORD` to include the account journeys) |

## Environment variables
See [`.env.example`](.env.example) and [`docs/engineering/INFRASTRUCTURE.md`](docs/engineering/INFRASTRUCTURE.md).

| Variable | Needed for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Accounts (safe in the browser; row-level security applies) |
| `PROGRESS_SIGNING_SECRET` | Accounts — server only; must equal the `progress_hmac` row in `private.app_secrets` |
| `AI_PROVIDER`, `ANTHROPIC_API_KEY` or `AI_BASE_URL` + `AI_API_KEY`, `AI_TUTOR_MODEL` | Optional AI tutor — server only |
| `TTS_API_URL`, `TTS_API_KEY` | Optional server voices — server only |

No service-role key is used anywhere.

## Deploying
1. Create a Supabase project and apply `supabase/migrations/` in order.
2. Insert a signing secret: `insert into private.app_secrets values ('progress_hmac', encode(extensions.gen_random_bytes(32), 'hex'));`
3. Import this repository into Vercel and set the variables above (`PROGRESS_SIGNING_SECRET` = that value).
4. In Supabase Auth → URL configuration set the site URL to the deployment and allow `<site>/reset-password`.
5. Configure SMTP in Supabase Auth (the built-in mailer is limited to a few emails per hour).

## Project layout
```
src/app/            routes (marketing, onboarding, learn, lesson, practice, tutor, admin, …) and /api/{progress,tutor,tts}
src/components/     AppShell, lesson player and exercise views, mascot, UI kit
src/lib/content/    course data, types, linter
src/lib/engine/     exercises, answer checking, spaced repetition, gamification (+ tests)
src/lib/state/      learner model, actions, local and Supabase persistence
src/lib/server/     session grading and signed progress updates
src/lib/i18n/       interface translations (English keys → Spanish, Hindi)
src/lib/tutor/      scenarios, scripted engine, AI providers
supabase/           migrations and database tests
e2e/                browser journeys and live-backend checks
docs/               research, product, design, engineering, content, quality
```

## Documentation
| Area | Documents |
|---|---|
| Research | [Product research](docs/research/01-duolingo-product-research.md) · [Feature inventory](docs/research/02-feature-inventory.md) · [UI/UX analysis](docs/research/03-ui-ux-reference-analysis.md) · [Technical research](docs/research/04-technical-research.md) · [Competitive matrix](docs/research/05-competitive-feature-matrix.md) · [Evidence log](docs/research/research-evidence.md) |
| Product | [PRD](docs/product/PRD.md) · [Vision](docs/product/product-vision.md) · [Personas](docs/product/user-personas.md) · [Prioritisation](docs/product/feature-prioritisation.md) · [Roadmap](docs/product/roadmap.md) |
| Design | [Design system](docs/design/DESIGN-SYSTEM.md) · [UI reference guide](docs/design/UI-REFERENCE-GUIDE.md) · [Screen inventory](docs/design/screen-inventory.md) · [Workflows](docs/design/user-workflows.md) · [Responsive](docs/design/responsive-design.md) |
| Engineering | [Architecture](docs/engineering/SYSTEM-ARCHITECTURE.md) · [Database](docs/engineering/DATABASE-SCHEMA.md) · [API](docs/engineering/API-CONTRACTS.md) · [Exercise engine](docs/engineering/EXERCISE-ENGINE.md) · [Adaptive engine](docs/engineering/ADAPTIVE-LEARNING-ENGINE.md) · [Server authority](docs/engineering/SERVER-AUTHORITY.md) · [AI](docs/engineering/AI-ARCHITECTURE.md) · [Infrastructure](docs/engineering/INFRASTRUCTURE.md) |
| Content | [Course architecture](docs/content/COURSE-ARCHITECTURE.md) · [Authoring](docs/content/CONTENT-AUTHORING.md) · [Licensing](docs/content/CONTENT-LICENSING.md) |
| Quality | [Test plan](docs/quality/TEST-PLAN.md) · [Acceptance criteria](docs/quality/ACCEPTANCE-CRITERIA.md) · [Accessibility](docs/quality/ACCESSIBILITY.md) |

## Feature status
Done and tested:
- Landing, features, about; sign-up, log-in, log-out, password reset screens, account deletion
- Onboarding with interface-language choice and placement test
- Learning path, lesson intro, guidebooks, jump-ahead tests
- Eight exercise types incl. dictation; timed matching; writing, listening and speaking practice modes
- Lesson summary, XP, gems, streak, streak freeze, daily quests, achievements — server-graded for accounts
- Mistakes review, vocabulary notebook, saved phrases, word-strength statistics
- Stories; tutor with nine scripted role-plays and saved transcripts
- Friends, user search, suggestions, friends quests, persistent weekly leaderboard, profile privacy
- English / Spanish / Hindi interface
- Colour contrast and automated accessibility scans (axe, WCAG 2.2 AA rule set) on every main screen
- Admin overview, role management and content-suggestion review

Partial:
- **AI tutor and server voices** — implemented behind a provider interface, never run against a live provider (no key).
- **Sign-up email** — works, but confirmation and reset emails depend on Supabase's mailer; not tested with a real inbox.
- **Speaking** — word-level feedback from speech recognition; no phoneme-level pronunciation scoring.
- **Admin** — no course, lesson or exercise editors; course content lives in the repository.
- **Translations and course content** — written without a native reviewer; Hindi and Spanish need one before launch.

Not built: league tiers with promotion, video call, native apps, data export, analytics/error reporting.

## Known limitations
1. **Speech depends on the browser.** Voices vary by device; Firefox and some mobile browsers have no speech
   recognition, where speaking falls back to record, listen back and self-check.
2. **Content is small.** One complete beginner unit set for Spanish and starter units for the other three courses.
3. **Marketing sub-pages (`/features`, `/about`) and the admin area are English only.**
4. **Accessibility** passes automated checks; no screen-reader or user testing has been done.
5. **No source-code licence file yet.** Course content is CC BY-SA 4.0.

## Research note
Product research used [REA](https://github.com/morluto/rea) to inspect Duolingo's public, logged-out web pages and
first-party blog posts. REA is a development-time research tool and is not a dependency of this app. No Duolingo code,
artwork, characters, audio or course content is used.
