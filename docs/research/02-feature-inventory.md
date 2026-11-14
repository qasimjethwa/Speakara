# Feature inventory

Duolingo column: evidence tag per [research-evidence.md](research-evidence.md). Speakara column: status in this repository
(**Built** = implemented and exercised by tests or the end-to-end run; **Partial**; **Planned**).

| Area | Feature | Duolingo (evidence) | Duolingo access | Speakara status |
|---|---|---|---|---|
| Acquisition | Landing page with primary CTA | [V E2] | Free | Built (`/`) |
| Acquisition | Delayed sign-up / try first | [V E3] course choice before form | Free | Built (guest mode) |
| Onboarding | Course picker with from-language | [V E3, E4] | Free | Built |
| Onboarding | Motivation, daily goal | [P] | Free | Built |
| Onboarding | Placement test | [P] | Free | Built (adaptive by score: unit 1/2/3) |
| Path | Vertical path, unit headers, guidebook | [V screenshot] | Free | Built (`/learn`, `/guidebook`) |
| Path | Jump ahead by test | [P] | Free | Built (`/lesson?testout=n`, 80% to pass) |
| Path | Stories in the path | [V screenshot, B1] | Free | Built (unlock on unit completion) |
| Lessons | Multiple choice | [P] | Free | Built |
| Lessons | Word bank translation | [V screenshot] | Free | Built |
| Lessons | Typed translation | [P] | Free | Built (typo and accent tolerance) |
| Lessons | Listening (tap what you hear) | [P] | Free | Built (browser speech synthesis, slow replay) |
| Lessons | Speaking | [V screenshot, B2] | Free | Built (Web Speech API; skip option) |
| Lessons | Matching pairs | [P] | Free | Built |
| Lessons | Fill in the blank | [P] | Free | Built |
| Lessons | Dictation by typing, error correction, timed challenge | [P] | Mixed | Planned |
| Lessons | Mistake limit (hearts/energy) | [V E5, B3] | Unlimited is paid | **Deliberately absent** |
| Practice | Mistakes review | [V E5] | Paid | Built, free |
| Practice | Personalised practice | [V E5, B3] | Paid | Built, free (spaced repetition) |
| Practice | Speaking-only / listening-only sessions | [V B2] | [U] | Built, free |
| Practice | Vocabulary list | [V E6 `/words`] | [U] | Built (`/vocabulary`, strength bars) |
| Practice | Pronunciation drills for new scripts | [V B2] | [U] | Planned (needs phoneme-level scoring) |
| AI | Roleplay | [V B3] | Paid (Max) | Built: scripted free everywhere; open-ended when a provider is configured |
| AI | Video call | [V B3] | Paid (Max) | Planned (voice in/out exists; no avatar/real-time loop) |
| AI | Explain my answer | [P] | [U] | Partial: deterministic word-by-word explanation; AI explanation planned |
| Gamification | XP | [V B4, B5] | Free | Built (published formula) |
| Gamification | Streak + freeze | [V B5]; freeze [P] | Free | Built (freeze costs earned gems, max 2) |
| Gamification | Gems | [V screenshot] | Earned and sold | Built — earned only |
| Gamification | Daily quests | [P] | Free | Built (3/day, deterministic rotation) |
| Gamification | Leagues / leaderboards | [V B4] | Free | Built (real weekly board on Supabase; labelled bots in guest mode). Promotion/demotion planned |
| Gamification | Achievements | [P] | Free | Built (13) |
| Social | Follow friends | [V B4 "follow buttons"] | Free | Built on Supabase (search, follow, compare) |
| Social | Friends quests / challenges | [P] | Free | Planned |
| Reports | Weekly report, year in review | [V E6 routes] | [U] | Partial (7-day XP chart); reports planned |
| Account | Email sign-up, login | [V E6 `/login`, `/register`] | Free | Built (Supabase Auth) |
| Account | Settings | [P] | Free | Built (course, goal, sound, speech, motion, reset) |
| Admin | Content tooling | [U] | Internal | Partial: read-only review page + linter; editors planned |
| Platform | Native mobile apps | [V E2 store badges] | Free | Planned (responsive web today) |
