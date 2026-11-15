# Final product audit — six-language release

Everything under "Verified" was run on the final build. Tools: `e2e/languages.mjs` (audit mode and language
journeys), `e2e/smoke.mjs`, `e2e/cloud.mts`, unit tests. Screenshots: `docs/quality/audit-screenshots/`.

## Responsive audit
`E2E_AUDIT=1 node e2e/languages.mjs` walks home, log-in, sign-up, onboarding, the path, a whole lesson (all eight
exercise types), summary, practice, vocabulary, stories, tutor (list and chat), profile, settings, quests, leaderboard
and guidebook at twelve sizes: 1280×800, 1366×768, 1440×900, 1920×1080, 768×1024, 820×1180, 1024×768, 320×720,
360×800, 375×812, 390×844, 430×932. On each screen it measures horizontal overflow, elements past the right edge,
touch targets under 40 px (touch sizes), console errors, and whether the fixed footer covers any control once the
page is scrolled to its end.

| | Before | After |
|---|---|---|
| Findings across all sizes | ~130 on phones and tablets, 0 on desktop | **0 at all twelve sizes** |

### Fixed
| Problem | Where | Fix |
|---|---|---|
| Horizontal scrolling on every phone width (up to +141 px) | Home header: the language picker was meant to be hidden on phones but was not, and logo + buttons did not fit | Picker display fixed; icon-only logo below 400 px; buttons no longer wrap |
| Horizontal scrolling at 320 px | Leaderboard league tiers | Tiers wrap and use smaller type on narrow phones |
| Touch targets of 18–36 px | Quit/Back/Close icons, tutor "hear this message" and back, profile links, home header and footer links, language select, one-letter word tiles | All at least 44 px |
| Lesson footer | Checked on every exercise type at every size | No control is covered; no change needed |

## Sound and speech
| Check | Result |
|---|---|
| Tap, correct, wrong and finish effects fire during a lesson; exactly one finish, last | Verified per language in the browser run (effect log) |
| Double playback on the last matching pair (pair chime + answer chime) | Fixed; duplicate triggers within 120 ms are also dropped |
| Overlapping effects | A new effect fades out the previous one; speech stops when an answer is checked |
| Safari / mobile suspended audio | Shared context (with `webkitAudioContext`) resumed on every gesture and when the tab returns |
| Sound switched off in Settings | Verified: a whole lesson produces no effect |
| Text-to-speech locales | es-ES, fr-FR, de-DE, ko-KR, it-IT, ru-RU requested correctly (verified per language) |
| No matching voice | Verified: a warning is shown, nothing is read in another language's voice, listening is skipped and reported as skipped, the lesson still completes |
| Speech that never reports finishing | Guard timer so replay never gets stuck |
| Microphone: granted, blocked, recording with no recogniser (manual self-check) | Verified in `e2e/smoke.mjs` with Chromium's fake capture device |

Not verifiable here: how real voices sound, and real speech recognition, on real phones — headless Chromium has
neither, so stand-ins record what is requested. Whether a device has a Korean, Russian, German or Italian voice
depends on the device.

## Languages and exercises
- Six target languages with a registry (`src/lib/content/languages.ts`); language cards in onboarding and Settings.
- Each of the six journeys passes: onboarding → lesson with all eight exercise types and one re-asked miss → XP →
  reload → switch course → return → progress intact.
- Answer checking keeps ñ, umlauts and non-Latin marks; diacritic-only differences are not typos; ё = е; Korean in NFC.
- Multiple-choice distractors can no longer be a second correct answer; matching no longer shows identical or
  duplicate pairs (for example no = no).
- Tutor: "Meeting new people" and "Restaurant" are scripted for German, Korean, Italian and Russian; the other seven
  scenes are shown as unavailable in those courses.

## Remaining limitations
- All new course content, and the Spanish/Hindi interface text, is author-written and awaits native-speaker review.
- Each new course is a small beginner set (two units, six lessons), not a complete CEFR level.
- Russian stress marks are shown on vocabulary; typed answers are accepted without them.
- Tested in Chromium only. Safari and Firefox behaviour follows from code paths, not from test runs.
