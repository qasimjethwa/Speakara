# Feature prioritisation

Scored with RICE-style judgement (Reach, Impact, Confidence, Effort; no usage data exists yet, so Reach and Impact are
estimates). MoSCoW column is what was decided for the MVP.

| Feature | Reach | Impact | Confidence | Effort | MoSCoW | Outcome |
|---|---|---|---|---|---|---|
| Lesson engine + path | All | Very high | High | L | Must | Built |
| Unlimited mistakes, re-queue | All | Very high | High | S | Must | Built |
| Guest mode | All new users | High | High | S | Must | Built |
| Spaced review + vocabulary | Returning | High | Medium | M | Must | Built |
| Streak, XP, quests | All | High | Medium | M | Must | Built |
| One complete beginner course | All | Very high | High | L | Must | Built (Spanish A1: 3 units, 12 lessons, 3 stories) |
| Scripted tutor | Most | Medium | Medium | M | Must | Built |
| Accounts + sync | Returning | High | High | M | Must | Built, awaiting a Supabase project |
| Provider-backed AI tutor | Most | High | Medium | M | Should | Built, untested against a live provider |
| Leaderboard, friends | Some | Medium | Low | M | Should | Built on Supabase |
| Stories | Most | Medium | Medium | S | Should | Built |
| Native-language UI for en-es / en-hi | Asha, Miguel | High | High | M | Should | **Not built — top of next release** |
| Content editors (admin) | Authors | Medium | Medium | L | Could | Deferred; PR-based authoring works |
| Timed challenges, dictation | Some | Low | Low | M | Could | Deferred |
| Video call, phoneme scoring | Some | Medium | Low | XL | Won't (now) | Deferred |
| Native apps | Many | High | Medium | XL | Won't (now) | Deferred; PWA first |

## Rule used for trade-offs
A coherent, working learning loop beats a wide set of shallow screens. Anything that could not be made to work honestly
in guest mode or behind a clear "needs backend" message was deferred rather than faked.
