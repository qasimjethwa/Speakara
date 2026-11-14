# Research evidence log

Captured 2026-11-14 with REA 6.9.0 (`rea` CLI, CDP browser provider v2) driving headless Chromium 153 against Duolingo's
**public, logged-out** pages, plus plain HTTP fetches of public blog posts. No login, no private endpoints, no
anti-bot circumvention. Raw captures were kept out of the repository (they contain Duolingo's copyrighted page content);
what is recorded here is identifiers, hashes and our own observations.

## Evidence classes used across the research docs

| Tag | Meaning |
|---|---|
| **[V]** Verified | Directly observed in a capture below, or stated in a dated first-party publication we fetched |
| **[I]** Inference | Reasoned from verified facts; could be wrong |
| **[P]** Prior knowledge | Widely reported public information recalled by the author, **not** re-verified in this session |
| **[U]** Unknown | Could not be established; not guessed |

## REA captures

| # | Operation | URL | REA evidence id (prefix) | Notes |
|---|---|---|---|---|
| E1 | `list-browser-targets` | https://en.duolingo.com/ | `ev_d96f75e4…` | Title: "Duolingo - The world's most popular way to learn" |
| E2 | `inspect-web-page` (+accessibility text) | https://en.duolingo.com/ | `ev_25b0c6ce…` | 25 scripts, 169 text nodes |
| E3 | `inspect-web-page` | https://en.duolingo.com/register | `ev_d2da5255…` | 18 scripts; title "Learning Goal - Duolingo" |
| E4 | `inspect-web-page` | https://en.duolingo.com/courses | `ev_dde0f1bb…` | 37 scripts |
| E5 | `inspect-web-page` | https://en.duolingo.com/super | `ev_2586da34…` | 37 scripts |
| E6 | `analyze-web-bundle` (static, no execution) | https://en.duolingo.com/ | `ev_ef2e1ea6…` | 21 script sources, 121 route patterns |
| E7 | `capture-web-screenshot` ×4 | home / register / courses / super | PNG SHA-256: `8d56d833…`, `c55bd344…`, `a3c630fd…`, `10142f84…` | 1366×900 viewport |
| E8 | navigation | https://en.duolingo.com/learn | — | Logged-out visitors are redirected to `/` |

## First-party publications fetched

| # | URL | Published | Last modified |
|---|---|---|---|
| B1 | https://blog.duolingo.com/ways-to-practice-in-duolingo/ | 2025-12-16 | 2026-09-23 |
| B2 | https://blog.duolingo.com/covering-all-the-bases-duolingos-approach-to-speaking-skills/ | 2026-02-09 | 2026-09-09 |
| B3 | https://blog.duolingo.com/duolingo-max/ | 2023-03-14 | 2026-03-25 |
| B4 | https://blog.duolingo.com/frontend-prediction/ | 2026-04-15 | 2026-04-15 |
| B5 | https://blog.duolingo.com/new-subjects/ | 2023-10-11 | 2026-11-06 |

## User-supplied references

Three screenshots supplied by the project owner (learning path annotated diagram, word-bank exercise, speaking exercise).
Treated as **[V] for layout at the time of capture, date unknown** — the speaking screenshot shows an older visual style.

## What could not be inspected

| Area | Why | Effect |
|---|---|---|
| Logged-in app: path, lessons, practice hub, leagues, quests, shop, profile | Requires an account; we did not create one or bypass login (E8) | Described from B1–B5 and the supplied screenshots only; details tagged [P]/[U] |
| Mobile apps (iOS/Android) | No device or app binaries in scope | Mobile behaviour is [P]/[U] |
| The 2024 efficacy white paper PDF (`duolingo-papers.s3.amazonaws.com`) | Not fetched in this session | Not cited |
| Network API shapes | Logged-out pages made no observable API calls during the capture window (E2: `network.requests` empty) | No API documentation attempted |
| Exact XP, league and gem rules | Not published in fetched sources | Speakara defines its own (see `EXERCISE-ENGINE.md`) |
