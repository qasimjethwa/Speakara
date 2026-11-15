# Final product audit — six-language release

Scope of this pass: the six target languages (Spanish, French, German, Korean, Italian, Russian), answer checking,
speech locales and the course registry. Everything listed under "Verified" was run; everything under "Not verified"
was not run in this pass.

## Verified
| Area | Evidence |
|---|---|
| Course content | `npm run content:check`: all eight courses pass the linter (≥2 units, ≥3 lessons per unit in the new courses, ≥6 words and ≥4 sentences per lesson, unique IDs). |
| Unit tests | 54 passing (`npm test`), including the six-language registry, solvability of every generated exercise, Korean NFC, Russian ё/е, diacritic handling and the existing grading tests. |
| Browser journey per language | `node e2e/languages.mjs` (desktop, guest): onboarding → first lesson with every exercise type and one deliberate miss re-asked → 15 XP → completion survives a reload → switch course and back → progress unchanged. Passed for de-en, ko-en, it-en, ru-en, fr-en and es-en. |
| Answer checking | Accent tolerance limited to French/Italian-style marks; ñ, umlauts and non-Latin marks kept; diacritic-only differences are not counted as typos. |
| Existing progress | Stable lesson, unit and course IDs; French lessons 1.1–1.2 and unit 1 unchanged, new lesson and unit appended. No database migration was needed (course IDs are unrestricted text). |

## Changed in this pass
- Added German, Korean, Italian and Russian courses, and expanded French to two units.
- Added a language registry with TTS and speech-recognition locales (`es-ES`, `fr-FR`, `de-DE`, `ko-KR`, `it-IT`, `ru-RU`).
- Voice selection already refuses unrelated voices (it only matches the same base language), so a missing voice shows the existing warning.
- Spaced-repetition gaps are capped at one year (fix shipped earlier in `67ab08f`).

## Not verified in this pass
- **Responsive audit** at the eleven viewports in the brief (320 px to 1920 px), with before/after screenshots. Not done.
- **Mobile lesson footer** overlap checks. Not done.
- **Browser speech for the four new languages.** The headless browser has no voices or recogniser; the journey stubs them. Real voice quality, and whether each platform has a Korean, Russian, German or Italian voice, must be checked on real devices.
- **Tutor scripts** exist only for the original languages. The tutor scenarios for the four new languages are therefore disabled with a reason, as the product already does for untranslated scenarios.
- **Native-speaker review** of all new content. Every new course is labelled "Author-written; native-speaker review pending".
- **Interface translations** for the new course screens are limited to the language names. Other new text is English.
- **Language cards** with flags, native names, writing system and availability are not redesigned; the existing course lists show the new courses.
- **Course size.** Each new course is a small beginner set (two units, six lessons). It is not a complete CEFR course.
