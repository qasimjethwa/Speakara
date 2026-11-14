# Speakara

A free language-learning platform: bite-sized lessons, spaced review, stories, speaking practice and a tutor —
with no paywalls, no lives and no subscription. Independent project; original content, mascot and design.

> **Status: working MVP, not yet deployed.** The full learner journey works today in guest mode (progress saved in the
> browser). Accounts, sync, real leagues and friends are implemented against Supabase but have not been run against a
> live project. See [Known limitations](#known-limitations).

## Quick start
```bash
npm install
npm run dev          # http://localhost:3000
```
No configuration is needed. To enable accounts or the AI tutor, copy `.env.example` to `.env.local` and fill it in.

Requires Node.js 20+ (built and tested on 22).

## What's inside
- **Courses**: Spanish for English speakers (A1: 3 units, 12 lessons, 3 stories) plus starter units for French,
  English for Spanish speakers and English for Hindi speakers.
- **Exercise engine**: seven exercise types generated from reviewed words and sentences; deterministic grading with
  typo and accent tolerance; missed items come back until you get them.
- **Adaptive review**: transparent spaced repetition, mistakes list, vocabulary notebook.
- **Practice hub, stories, guidebooks, placement test, jump-ahead tests.**
- **Tutor**: nine role-play scenarios — scripted scenes that work anywhere, open-ended AI conversation when a provider
  key is configured (Anthropic or any OpenAI-compatible endpoint).
- **Motivation**: XP with a published formula, streaks and earned streak freezes, gems (never sold), daily quests,
  achievements, weekly leaderboard, friends.
- **Responsive**: three-column desktop layout; purpose-built phone layout.

## Commands
| Command | Purpose |
|---|---|
| `npm run dev` / `npm run build` / `npm start` | Develop, build, serve |
| `npm test` | Unit tests (27) |
| `npm run typecheck` | TypeScript, strict |
| `npm run content:check` | Lint course content |
| `bash supabase/tests/run-local.sh` | Apply the migration to a throwaway local Postgres and test access rules |
| `NODE_PATH=$(npm root -g) node e2e/smoke.mjs [url] [screenshot-dir]` | End-to-end journey on desktop and mobile (needs Playwright installed globally and the app running) |

## Environment variables
See [`.env.example`](.env.example) and [`docs/engineering/INFRASTRUCTURE.md`](docs/engineering/INFRASTRUCTURE.md).
All are optional. AI keys are read only on the server.

## Deploying
1. Create a Supabase project and apply `supabase/migrations/` (`supabase db push`).
2. Import this repository into Vercel and set the environment variables.
3. Add the deployment URL to Supabase Auth settings.
4. Follow the manual go-live script in [`docs/quality/TEST-PLAN.md`](docs/quality/TEST-PLAN.md).

## Project layout
```
src/app/            routes (marketing, onboarding, learn, lesson, practice, tutor, …) and /api/tutor
src/components/     AppShell, lesson player and exercise views, mascot, UI kit
src/lib/content/    course data, types, linter
src/lib/engine/     exercises, answer checking, spaced repetition, gamification (+ tests)
src/lib/state/      learner model, actions, local and Supabase persistence
src/lib/tutor/      scenarios, scripted engine, AI providers
supabase/           migration and database tests
e2e/                end-to-end smoke test
docs/               research, product, design, engineering, content, quality
```

## Documentation
| Area | Documents |
|---|---|
| Research | [Product research](docs/research/01-duolingo-product-research.md) · [Feature inventory](docs/research/02-feature-inventory.md) · [UI/UX analysis](docs/research/03-ui-ux-reference-analysis.md) · [Technical research](docs/research/04-technical-research.md) · [Competitive matrix](docs/research/05-competitive-feature-matrix.md) · [Evidence log](docs/research/research-evidence.md) |
| Product | [PRD](docs/product/PRD.md) · [Vision](docs/product/product-vision.md) · [Personas](docs/product/user-personas.md) · [Prioritisation](docs/product/feature-prioritisation.md) · [Roadmap](docs/product/roadmap.md) |
| Design | [Design system](docs/design/DESIGN-SYSTEM.md) · [UI reference guide](docs/design/UI-REFERENCE-GUIDE.md) · [Screen inventory](docs/design/screen-inventory.md) · [Workflows](docs/design/user-workflows.md) · [Responsive](docs/design/responsive-design.md) |
| Engineering | [Architecture](docs/engineering/SYSTEM-ARCHITECTURE.md) · [Database](docs/engineering/DATABASE-SCHEMA.md) · [API](docs/engineering/API-CONTRACTS.md) · [Exercise engine](docs/engineering/EXERCISE-ENGINE.md) · [Adaptive engine](docs/engineering/ADAPTIVE-LEARNING-ENGINE.md) · [AI](docs/engineering/AI-ARCHITECTURE.md) · [Infrastructure](docs/engineering/INFRASTRUCTURE.md) |
| Content | [Course architecture](docs/content/COURSE-ARCHITECTURE.md) · [Authoring](docs/content/CONTENT-AUTHORING.md) · [Licensing](docs/content/CONTENT-LICENSING.md) |
| Quality | [Test plan](docs/quality/TEST-PLAN.md) · [Acceptance criteria](docs/quality/ACCEPTANCE-CRITERIA.md) · [Accessibility](docs/quality/ACCESSIBILITY.md) |

## Feature checklist
- [x] Landing, features, about, sign-up, log-in
- [x] Onboarding with placement test
- [x] Learning path, guidebooks, jump-ahead tests
- [x] Lesson engine: multiple choice, word bank, translation, listening, speaking, matching, fill-in-the-blank
- [x] Lesson summary, XP, gems, streak, streak freeze, daily quests, achievements
- [x] Practice hub, mistakes review, vocabulary notebook
- [x] Stories
- [x] Scripted tutor and role-play; AI provider abstraction
- [x] Profile, statistics, settings
- [x] Guest persistence; Supabase schema with row-level security (tested on local Postgres)
- [ ] Live Supabase project and deployment (accounts, sync, leagues, friends unverified until then)
- [ ] AI tutor verified against a live provider
- [ ] Interface translations for Spanish and Hindi speakers
- [ ] Native-speaker review of all course content
- [ ] Colour-contrast fixes and accessibility audit
- [ ] Admin dashboard and content editors
- [ ] Server-side XP authority, league cohorts with promotion, friend challenges
- [ ] Dictation, error correction, timed challenges, pronunciation scoring, video call
- [ ] Analytics, error reporting, CI workflow, account deletion and export

## Known limitations
1. **Cloud features are unverified.** No Supabase project existed during the build. The schema and access rules pass
   on local Postgres; the browser-side sync code has never talked to a real project.
2. **XP is computed in the browser.** The database caps and logs it, but a determined user can forge progress.
3. **Speech depends on the browser.** Voices vary; Firefox has no speech recognition; speaking is checked by word
   overlap, not pronunciation.
4. **Content is small and not independently reviewed.** One complete beginner unit set; the Hindi course in particular
   needs a native reviewer.
5. **Interface is English only**, including for the Spanish- and Hindi-speaker courses.
6. **Accessibility is not yet AA** — see the defect list.
7. **No source-code licence file yet.** Course content is CC BY-SA 4.0.

## Research note
Product research used [REA](https://github.com/morluto/rea) to inspect Duolingo's public, logged-out web pages and
first-party blog posts. REA is a development-time research tool and is not a dependency of this app. No Duolingo code,
artwork, characters, audio or course content is used.
