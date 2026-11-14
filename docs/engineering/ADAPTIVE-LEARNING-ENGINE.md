# Adaptive learning engine

Deliberately simple and explainable. It does **not** reproduce Duolingo's Birdbrain or half-life regression (see
`docs/research/04-technical-research.md` D2–D3).

## Learner model (`LearnerState`)
| Signal | Stored as | Used for |
|---|---|---|
| Accuracy | `completed[lesson].bestAccuracy`, first-try results per session | Summary, perfect bonus, test-out gate |
| Previous mistakes | `mistakes[]` (sentence ids, last 60) | "Fix my mistakes" sessions; removed once answered right first try |
| Recall performance | `review[wordKey]` (`reps`, `lapses`, `seen`) | Scheduling |
| Recency | `review[wordKey].last`, `due` | What is due now |
| Skill mastery | `review[wordKey].interval` → strength 0–4 | Vocabulary notebook bars |
| Difficulty | `review[wordKey].ease` | Hard words come back sooner |

## Scheduling algorithm (`src/lib/engine/srs.ts`)
A simplified SM-2. For each word practised in a session (first attempt only):

- **Correct**: `reps += 1`; interval = 1 day (first success), 3 days (second), then `round(interval × ease)`;
  `ease = min(2.8, ease + 0.05)`.
- **Incorrect**: `reps = 0`, `lapses += 1`, due again in 10 minutes, `ease = max(1.3, ease − 0.2)`.
- New words start at `ease = 2.3`.

Example: correct on days 0, 1, 4 → intervals 1, 3, 7 days; a miss on day 11 resets to "due now" with ease 2.2.

Strength shown to learners: 0 = not yet recalled, 1 = interval < 3 days, 2 = < 7, 3 = < 21, 4 = 21+.

## How sessions adapt
1. **New lessons** weave in up to two due words from earlier lessons.
2. **Smart review** uses due words when at least three exist, otherwise a sample of everything met.
3. **Fix my mistakes** draws only from missed sentences.
4. **Placement / jump-ahead** set the starting unit from a score threshold.

## Explainability
The notebook shows each word's strength and "review in N days"; this document and `EXERCISE-ENGINE.md` publish every
constant. Nothing is hidden or randomised except distractor choice.

## Known limits
- Scheduling is per word, not per grammar concept or per skill (listening vs. production).
- A word is credited whenever an exercise containing it is answered correctly, even if that word was not the hard part.
- No forgetting-curve fitting; constants are conventional defaults, not tuned on data.

## Next steps
Log every answer (`lesson_sessions`/`answers` tables), then evaluate half-life regression or FSRS against the logged
data; track mastery per skill; choose exercise difficulty by word strength.
