# Screen inventory

Status of the 49 screens in the brief. **Built** = implemented and reachable; **Merged** = delivered inside another
screen; **Planned** = not built.

| # | Screen | Route / component | Status |
|---|---|---|---|
| 1 | Landing | `/` | Built |
| 2 | Features | `/features` | Built |
| 3 | About | `/about` | Built |
| 4 | Sign up | `/signup` | Built — live Supabase Auth |
| 5 | Log in, forgot password, reset password | `/login`, `/forgot-password`, `/reset-password` | Built — live Supabase Auth |
| 6–13 | Welcome, interface language, course, goal, prior knowledge, placement test, daily target, plan | `/onboarding` (8 steps) | Built |
| 14–15 | Dashboard, learning path | `/learn` + `AppShell` right rail | Built (one screen) |
| 16 | Section overview | caption on `/learn` | Merged — one section exists |
| 17 | Unit overview | unit banner + `/guidebook?unit=` | Built |
| 18 | Lesson introduction | first screen of `/lesson?lesson=` | Built |
| 19 | Multiple choice | `Choose` view | Built |
| 20 | Word bank | `WordBank` view | Built |
| 21 | Translation | `Translate` view | Built |
| 22 | Listening and dictation | `Listen`, `Dictation` views | Built |
| 23 | Speaking | `Speak` view | Built |
| 24 | Matching | `Match` view | Built |
| 25 | Fill in the blank | `Fill` view | Built |
| 26, 28 | Lesson success, XP and rewards | `SessionSummaryView` | Built (one screen) |
| 27 | Learning feedback | feedback sheet in `LessonPlayer`; failed test-out summary | Built (there is no "lesson failure" — sessions cannot be failed) |
| 29 | Practice hub | `/practice` | Built |
| 30 | Vocabulary notebook | `/vocabulary` | Built |
| 31 | Grammar guidebook | `/guidebook` | Built |
| 32 | Stories | `/stories`, `/story?id=` | Built |
| 33–34 | AI conversation, role-play | `/tutor` | Built (one screen; scenarios are role-plays) |
| 35 | Pronunciation practice | `/lesson?mode=speak` | Partial (word-by-word feedback and self-recording; no phoneme-level scoring) |
| 36 | Leaderboards | `/leaderboard` | Built |
| 37 | Friends, discovery, friends quests | section of `/profile` | Built on Supabase; explanatory card in guest mode |
| 38–39 | Daily quests, achievements | `/quests` | Built |
| 40–41 | Profile, statistics | `/profile` | Built |
| 42 | Settings | `/settings` | Built |
| 43 | Admin dashboard | `/admin` | Built (admin role): live analytics from the database |
| 44–46 | Course, lesson, exercise editors | — | Planned (content is edited as code via pull requests) |
| 47 | Content review | `/admin/content` | Built: listing, automated checks, learner suggestions, staff approve/reject |
| 48 | User management | `/admin` | Partial: search learners, change roles. Email and password management stays in the Supabase dashboard |
| 49 | Reports and analytics | `/admin` | Partial: 7-day totals, sessions per day, learners by course, most-completed lessons |

Also built beyond the original list: writing practice and 90-second match rush (`/lesson?mode=write|match`), interface
language picker (English, Spanish, Hindi), privacy setting and account deletion in Settings.

**Totals:** 43 built or merged, 3 partial, 3 planned (course, lesson and exercise editors).
