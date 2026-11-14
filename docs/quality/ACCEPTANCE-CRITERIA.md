# Acceptance criteria

Status: ✅ verified by an automated test · ◐ implemented, verified only by code review or partially · ⬜ not verified.

## Learning loop
| # | Given / when / then | Status |
|---|---|---|
| A1 | A new visitor can reach a first exercise without an account | ✅ e2e |
| A2 | Each lesson contains at least six different exercise types and ten exercises | ✅ unit |
| A3 | Every generated exercise is solvable with its own accepted answer | ✅ unit, all courses |
| A4 | A wrong answer shows the correct answer and the exercise returns later in the session | ✅ e2e |
| A5 | No number of mistakes prevents finishing or starting a session | ✅ by design + e2e |
| A6 | Missing accents and single typos are accepted with a note; wrong words are not | ✅ unit |
| A7 | Finishing a lesson unlocks the next one and marks it complete | ✅ unit + e2e |
| A8 | Progress survives a page reload | ✅ e2e (guest) · ⬜ cloud |
| A9 | Learners can skip speaking and listening without penalty | ✅ e2e |
| A10 | Placement can start a learner beyond Unit 1; jump-ahead needs 80% | ✅ unit + e2e |

## Review and practice
| # | Criterion | Status |
|---|---|---|
| B1 | Correct recalls lengthen a word's interval; a miss resets it | ✅ unit |
| B2 | Missed sentences appear in "Fix my mistakes" and leave once answered correctly | ✅ unit |
| B3 | Practice explains itself when there is nothing to practise | ◐ |
| B4 | The notebook shows every met word with strength and next review | ✅ e2e (listing) |

## Gamification
| # | Criterion | Status |
|---|---|---|
| C1 | XP follows the published formula | ✅ unit + e2e |
| C2 | One streak day per calendar day; a freeze covers one missed day; otherwise reset | ✅ unit |
| C3 | Quests advance from session events and pay once | ✅ unit |
| C4 | Achievements unlock from learner state | ✅ unit |
| C5 | Gems cannot be bought with money anywhere | ✅ no payment code exists |
| C6 | Leaderboard bots are labelled as bots | ✅ e2e |

## Tutor
| # | Criterion | Status |
|---|---|---|
| D1 | Scripted scenes work with no provider | ✅ unit + e2e |
| D2 | A miss gets one coaching hint, then the scene moves on | ✅ unit + e2e |
| D3 | Scenarios that cannot run are disabled with a reason | ✅ e2e |
| D4 | With a provider, replies include translation and corrections | ⬜ |
| D5 | Provider failure falls back to scripted or a readable error | ◐ code path only |
| D6 | Requests are rate-limited | ◐ code path only |

## Accounts and data
| # | Criterion | Status |
|---|---|---|
| E1 | A learner can read and write only their own rows | ✅ database test |
| E2 | Anonymous clients can read nothing | ✅ database test |
| E3 | XP events are capped and immutable | ✅ database test |
| E4 | Sign-up creates a profile; bad or taken usernames fall back | ✅ database test |
| E5 | Sign-up / login / sync work in the browser | ⬜ |
| E6 | Guest progress moves into a new account | ⬜ |

## Experience
| # | Criterion | Status |
|---|---|---|
| F1 | Distinct phone and desktop layouts | ✅ e2e on both |
| F2 | No console or page errors in the journey | ✅ e2e |
| F3 | Reduced motion is respected | ◐ CSS + setting; not measured |
| F4 | WCAG 2.2 AA | ⬜ known contrast failures — see `ACCESSIBILITY.md` |
