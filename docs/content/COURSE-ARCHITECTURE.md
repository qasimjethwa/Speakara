# Course architecture

## Hierarchy
`Course (target, native) → Section → Unit → Lesson → { Words, Sentences }`, plus per unit: guidebook **Tips** and one
**Story**. Exercises are generated from words and sentences (`docs/engineering/EXERCISE-ENGINE.md`), so authors write
language, not screens. Types: `src/lib/content/types.ts`.

| Level | Size rule (enforced by the linter where marked ✓) | Example |
|---|---|---|
| Unit | One communicative objective; ≥ 2 lessons ✓; ≥ 1 tip ✓ | "Order food and say what you eat and drink" |
| Lesson | ≥ 5 words ✓, ≥ 4 sentences ✓; every sentence built from words already taught | "At the café" |
| Sentence | 2–8 words; natural; with listed alternative translations | "Quiero té con leche." |
| Story | 6–8 lines, 3 comprehension questions, only taught vocabulary plus glossed extras | "Una mesa para dos" |

## What exists

| Course | Status | Units | Lessons | Words | Sentences | Stories | Review |
|---|---|---|---|---|---|---|---|
| Spanish for English speakers (`es-en`) | Complete unit set (A1, section 1) | 3 | 12 | 71 | 48 | 3 | Author-reviewed; native review pending |
| French for English speakers (`fr-en`) | Starter | 1 | 2 | 12 | 8 | 0 | Author-reviewed; native review pending |
| English for Spanish speakers (`en-es`) | Starter | 1 | 2 | 12 | 8 | 0 | Author-reviewed; native review pending |
| English for Hindi speakers (`en-hi`) | Starter | 1 | 2 | 12 | 8 | 0 | **Needs native Hindi review** |

### Spanish A1 syllabus
| Unit | Objective (CEFR A1 can-do) | Grammar | Lessons |
|---|---|---|---|
| 1 Greetings | Greet, thank, introduce yourself, ask how someone is | ¿…? punctuation, time-of-day greetings, dropping *yo*, *soy / estoy* as chunks | Hello and thanks · Times of day · Your name · How are you? |
| 2 People and family | Identify people, describe family, say what you have | Noun gender and articles, *ser* (soy/eres/es), *tener* (tengo/tienes/tiene) | Who is who · My family · I have… · Describing people |
| 3 Food and drink | Say what you eat and drink, order politely, ask for the bill | -er verbs (*comer, beber*), *quiero*, *con / sin*, *el agua* | Eat and drink · At the café · Meals · At the restaurant |

Each lesson practises reading (choose, fill), writing (word bank, typed), listening (tap what you hear) and speaking
(say the sentence); revision comes from spaced repetition and the practice hub.

## Identifiers
`<unit>.<lesson>.<w|s><n>` (e.g. `es2.3.s4`). Ids are positional, so **append** new items; never reorder or delete
published ones — learner progress and review schedules reference them.

## Known gaps
- Interface text is English for every course; the Spanish- and Hindi-speaker courses need a translated interface.
- One section only; no A2 content; no checkpoint/unit-review node.
- Sentences are not tagged with the grammar point they illustrate, so mastery is tracked per word only.
