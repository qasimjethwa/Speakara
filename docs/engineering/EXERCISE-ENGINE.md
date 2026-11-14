# Exercise engine

Code: `src/lib/engine/exercises.ts` (contract, generation, evaluation), `text.ts` (comparison),
`src/components/lesson/` (renderer and player). Tests: `src/lib/engine/engine.test.ts`.

## Data contract
Every exercise extends:

| Field | Meaning |
|---|---|
| `id` | Stable within a session: `<type>-<content id>-<variant>` |
| `type` | `choose` · `wordbank` · `translate` · `listen` · `speak` · `match` · `fill` |
| `wordIds` | Vocabulary practised — feeds spaced repetition |
| `sentenceId` | Source sentence — feeds the mistakes list |
| `difficulty` | 1 recognition · 2 guided production · 3 free production |
| `instruction` | Heading shown to the learner |
| type-specific | prompt, options/tiles, `accepted` answers, audio text, pairs, blank position |

Course, unit and lesson are derivable from the content ids (`es1.2.s3` = unit `es1`, lesson 2, sentence 3). Hints are
the "Explain" glossary built from `wordIds`. Audio is text for the speech synthesiser. Expected completion time and
per-exercise scoring weights are **not** modelled yet (every exercise counts equally).

## Generation
`generateLesson(course, lesson, { rng, speech, reviewWords })` builds 12 exercises from a lesson's 5–6 words and 4
sentences, ordered recognition → production:

`choose ×2 → wordbank (to native) → match → choose (to target) → listen → wordbank → fill → wordbank (to target) → speak → translate (to native) → translate (to target)`

Up to two due review words are inserted as extra `choose` items. With speaking turned off the `speak` slot becomes a
`choose`. Distractors come from the same course; word-bank tiles include 2–4 distractor words. A seeded PRNG
(`mulberry32`) makes sessions reproducible in tests.

Other generators: `generatePractice` (review, mistakes, listen-only, speak-only) and `generateUnitTest` (placement and
jump-ahead: 6 items per unit).

## Evaluation
`evaluate(exercise, answer) → { correct, expected, note? }` — pure and deterministic; no LLM.

| Type | Rule |
|---|---|
| `choose`, `fill` | Selected index equals the answer index |
| `wordbank`, `translate`, `listen` | Normalise (case, punctuation, apostrophes, common English contractions) then: exact match with any accepted answer → correct; match ignoring Latin accents → correct with note `accent`; within 1 edit (answers ≥ 6 chars) or 2 edits (≥ 16 chars) → correct with note `typo`; else incorrect |
| `speak` | ≥ 60% of the expected words appear in the recogniser's transcript |
| `match` | Completed with ≤ 2 wrong pairings |

Devanagari vowel signs are preserved during normalisation (tested).

## Session rules (`LessonPlayer`)
- Only the **first** attempt at each exercise counts toward accuracy and spaced repetition.
- A missed exercise is appended to the queue and repeats until answered correctly. There is no fail state.
- Skipping speaking/listening removes that type from the session and from the score.
- Result → `completeSession` → new learner state + summary.

## Scoring (published formula)
| Session | Base XP | Bonuses |
|---|---|---|
| Lesson | 10 | +5 first completion, +5 no mistakes |
| Practice | 10 | +5 no mistakes |
| Story | 12 | +5 no mistakes |
| Jump-ahead test | 20 | +5 no mistakes |
| Placement | 15 | +5 no mistakes |

Gems: +5 per session, +10–15 per quest.

## Adding an exercise type
1. Add an interface to the `Exercise` union and a builder. 2. Add a case to `evaluate`. 3. Add a view and a case in
`ExerciseView`. 4. Extend the generator and the tests. TypeScript's exhaustive `switch` flags any step you miss.

## Not built
Typed dictation, error correction, free writing, timed challenges, per-exercise hints beyond the glossary, difficulty-
adaptive selection within a lesson.
