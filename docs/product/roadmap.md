# Roadmap

Dates are intentionally absent: there is no team capacity estimate yet. Order is by dependency and learner impact.

## Release 0.1 — MVP (this repository)
Exercise engine, Spanish A1 course (3 units), three starter courses, practice hub, stories, scripted tutor, gamification,
guest persistence, Supabase schema with RLS, unit and end-to-end tests, documentation.

## Release 0.2 — Go live
- [x] Supabase project created, migrations applied, environment configured.
- [x] Log-in, sync, guest-to-account import, leaderboard and friends verified against the live project.
- [x] Interface in English, Spanish and Hindi.
- [x] Automated accessibility checks on every main screen; colour tokens meet AA.
- [x] Production deployment on Vercel: https://speakara.vercel.app
- [ ] Custom SMTP for confirmation and reset emails; test with real inboxes.
- [ ] Configure an AI provider; review tutor output with native speakers for all four courses.
- [ ] Native review of Spanish and Hindi interface text.
- [ ] Error reporting and privacy-respecting analytics for the PRD metrics.
- [ ] Manual accessibility audit with screen readers.

## Release 0.3 — Trustworthy progress
- [x] Server-graded sessions with signed, idempotent, versioned updates; clients cannot write progress.
- [x] Friends quests, profile privacy, account deletion.
- [x] Typed dictation, timed matching, writing practice.
- [ ] League cohorts of 30 with weekly promotion and demotion (scheduled job).
- [ ] Offline queue with retry for cloud writes; PWA install; data export.

## Release 0.4 — Content scale
- [ ] Content tables + admin editors (course, lesson, exercise) with version history (review queue exists).
- [ ] Spanish A1 to 10 units; French, en-es, en-hi to 5 units each, all native-reviewed.
- [ ] Recorded or high-quality synthesised audio assets cached in Supabase Storage.
- [ ] Error correction and free writing with AI feedback.

## Release 0.5 — Speaking
- [ ] Server-side speech assessment provider (phoneme-level scores); pronunciation drills for new scripts.
- [ ] Real-time voice conversation with the tutor.

## Open questions
1. Which funding route is pursued first, and who owns it?
2. Minimum age and consent model (affects accounts, leaderboards and AI chat).
3. Who are the native-speaker reviewers for Hindi and French?
