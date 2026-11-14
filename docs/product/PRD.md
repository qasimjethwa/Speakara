# Speakara — Product Requirements Document

Version 0.1 · 2026-11-14 · Status: MVP implemented in this repository; sections marked *Planned* are not built.

## 1. Vision
See [product-vision.md](product-vision.md). One sentence: the complete language-learning experience, free for everyone.

## 2. Problem statement
Learners using the dominant free app are (a) stopped mid-practice by a depleting mistake allowance, (b) denied mistake
review, personalised practice and AI conversation unless they subscribe, and (c) shown ads and upsells
(evidence: research doc 01 §6–7). These limits fall hardest on people for whom a new language is an economic necessity.

## 3. Target audience
Beginner (CEFR A1–A2) self-learners on phones and laptops; see [user-personas.md](user-personas.md). Initial pairs:
Spanish/French for English speakers, English for Spanish and Hindi speakers.

## 4. User journeys
Detailed in `docs/design/user-workflows.md`. Core loop: open app → path shows one next lesson → 12-exercise session with
instant feedback → summary (XP, streak, quests) → back to path. Secondary loops: practice hub, stories, tutor.

## 5. Functional requirements

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-01 | Visitor can start learning without creating an account; progress persists on the device | Must | Built |
| FR-02 | Email/password accounts; guest progress migrates into a new account | Must | Built (needs a Supabase project; migration path untested against live Supabase) |
| FR-03 | Onboarding: name, native language, course, goal, level, optional placement, daily target, plan | Must | Built |
| FR-04 | Learning path with unit headers, lesson states, guidebook, stories, jump-ahead test | Must | Built |
| FR-05 | Exercise engine with a single data contract and central renderer | Must | Built (7 types) |
| FR-06 | Deterministic grading with accent/typo tolerance and listed alternatives | Must | Built |
| FR-07 | Wrong answers are re-queued until correct; no session is ever blocked | Must | Built |
| FR-08 | Learner model: completions, per-word review schedule, mistakes, XP ledger | Must | Built |
| FR-09 | Practice hub: smart review, mistakes, listening, speaking | Must | Built |
| FR-10 | Vocabulary notebook with strength and next review date | Should | Built |
| FR-11 | Stories with comprehension questions | Should | Built (3 Spanish stories) |
| FR-12 | Tutor/role-play with scenario templates, corrections, transcript, saved phrases | Must | Built: scripted (4 scenes) + provider-backed (9 scenes; not exercised against a live provider) |
| FR-13 | XP, streak, streak freeze, gems, daily quests, achievements | Must | Built |
| FR-14 | Weekly leaderboard | Should | Built (Supabase RPC; labelled bots in guest mode). Cohorts and promotion *Planned* |
| FR-15 | Friends: search, follow, compare | Should | Built on Supabase. Friend challenges *Planned* |
| FR-16 | Profile statistics and settings (course, goal, sound, speech, motion, reset) | Must | Built |
| FR-17 | Content review tooling | Should | Partial: linter + read-only review page. Editors *Planned* |
| FR-18 | Admin: user management, analytics | Could | *Planned* |
| FR-19 | Timed challenges, typed dictation, error correction, free writing | Could | *Planned* |
| FR-20 | Pronunciation assessment at phoneme level; AI video call | Could | *Planned* |

## 6. Non-functional requirements

| ID | Requirement | Target | Status |
|---|---|---|---|
| NFR-01 | No learner-facing payment, ads or purchasable currency | Absolute | Met |
| NFR-02 | Works with no AI provider and no backend | Core loop fully usable | Met (guest mode + scripted tutor) |
| NFR-03 | Accessibility | WCAG 2.2 AA | Designed for; manual audit pending (`docs/quality/ACCESSIBILITY.md`) |
| NFR-04 | Responsive | 360 px phones to 1440 px desktops, distinct layouts | Met (end-to-end run on Pixel 7 and 1440×900) |
| NFR-05 | Security | RLS on every table; secrets server-side only | Met in migration; verified on local Postgres |
| NFR-06 | Performance | Marketing pages static; lesson interaction < 100 ms | Static generation confirmed; not benchmarked |
| NFR-07 | Cost | Ordinary grading uses no LLM; AI rate-limited | Met |
| NFR-08 | Privacy | No third-party trackers; speech handled by the browser | Met (note: browser vendors may process speech remotely) |

## 7. Dependencies
Supabase project (accounts, sync, leagues, friends); an AI provider key (open-ended tutor); browser Web Speech API
(audio and speaking); native-speaker reviewers (content promotion).

## 8. Success metrics (to instrument — analytics are *Planned*)
Activation: % of visitors completing a first lesson (target 50%). Habit: day-7 retention (25%), median weekly sessions (5).
Learning: review accuracy on words ≥ 7 days old (80%). Equity: share of sessions on low-end devices; zero blocked sessions.

## 9. MVP scope and acceptance
MVP = FR-01…FR-16 as marked Built. Acceptance criteria per feature: `docs/quality/ACCEPTANCE-CRITERIA.md`.

## 10. Future releases
See [roadmap.md](roadmap.md).
