# Roadmap

Dates are intentionally absent: there is no team capacity estimate yet. Order is by dependency and learner impact.

## Release 0.1 — MVP (this repository)
Exercise engine, Spanish A1 course (3 units), three starter courses, practice hub, stories, scripted tutor, gamification,
guest persistence, Supabase schema with RLS, unit and end-to-end tests, documentation.

## Release 0.2 — Go live
- [ ] Create the Supabase project, apply `supabase/migrations`, set env vars, deploy to Vercel.
- [ ] Verify sign-up, sync, guest-to-account migration, leaderboard and friends against the live project.
- [ ] Configure an AI provider; review tutor output quality with native speakers for all four courses.
- [ ] Translate interface strings into Spanish and Hindi (string catalogue + `lang` routing).
- [ ] Error reporting and privacy-respecting analytics for the PRD metrics.
- [ ] Manual accessibility audit with screen readers.

## Release 0.3 — Trustworthy progress
- [ ] Move XP awarding and session completion into a Postgres function / Edge Function; client becomes optimistic only.
- [ ] League cohorts of 30 with weekly promotion and demotion (scheduled job).
- [ ] Friend challenges; weekly report.
- [ ] Offline queue with retry for cloud writes; PWA install.

## Release 0.4 — Content scale
- [ ] Content tables + admin editors (course, lesson, exercise) with review workflow and version history.
- [ ] Spanish A1 to 10 units; French, en-es, en-hi to 5 units each, all native-reviewed.
- [ ] Recorded or high-quality synthesised audio assets cached in Supabase Storage.
- [ ] New exercise types: typed dictation, error correction, timed match, free writing with AI feedback.

## Release 0.5 — Speaking
- [ ] Server-side speech assessment provider (phoneme-level scores); pronunciation drills for new scripts.
- [ ] Real-time voice conversation with the tutor.

## Open questions
1. Which funding route is pursued first, and who owns it?
2. Minimum age and consent model (affects accounts, leaderboards and AI chat).
3. Who are the native-speaker reviewers for Hindi and French?
