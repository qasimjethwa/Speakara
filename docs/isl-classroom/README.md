# ISL Live Classroom

The only learner-facing ISL experience, at `/learn/isl`. Old ISL course, scenario, practice and fingerspelling
URLs redirect there. The educator Sign Studio (`/learn/isl/studio`) is unchanged.

## Isolation

| Piece | Where |
|---|---|
| UI, state, styles | `src/features/isl-classroom/` (`Classroom.tsx`, `prefs.ts`, `classroom.module.css`) |
| Teaching engine (pure) | `src/features/isl-classroom/engine.ts` |
| Recognition engine | `src/features/isl-classroom/recognition/` (camera, features, classifier) |
| Teacher (pluggable) | `src/features/isl-classroom/teacher/` — `TeacherAdapter` interface; `teacher/index.ts` selects the active one |
| Content | `src/features/isl-classroom/content.ts` |
| AI explanations (optional) | `src/app/api/isl-classroom/explain/route.ts` (Gemini, text only) |
| Assets | `public/isl-classroom/` (sign videos, `model.json`, `CREDITS.txt`) |
| Offline training | `tools/isl-recognition/` |
| Kill switch | `NEXT_PUBLIC_ISL_CLASSROOM=off` → a calm "taking a break" message; nothing else depends on the module |
| Error boundary | `ClassroomBoundary.tsx` |

Shared code is only *used*: `AppShell`, `useT`, `useIslProgress` (existing `isl_progress` table, item ids
`<course>:cls:<sign>`), and the Learning Twin's `recordEvents` (camera-checked results only, and only when the learner
has turned the Twin on). No database migration was needed.

To remove ISL completely: delete `src/features/isl-classroom`, `src/app/learn/isl`, `src/app/api/isl-classroom`,
`public/isl-classroom` and the sidebar entry.

## Teacher

Today the teacher panel shows real Deaf ISL signers from the INCLUDE dataset (CC BY 4.0) demonstrating each sign.
To attach an AI avatar, implement `TeacherAdapter` (`teacher/types.ts`) and point `teacher/index.ts` at it. An avatar must
play only approved sign data for the requested sign; `mood` drives emotional expression only.

## Recognition

Same MediaPipe Hand + Pose Landmarker models offline (Python) and in the browser. Features are body-normalised
(`features.py` ⇄ `features.ts`, parity-tested). A softmax classifier over the 9 greeting signs plus an "unrelated sign"
class (INCLUDE Seasons), with a distance check for movements unlike anything trained.

Outcomes: `correct` (target confidently recognised), `incorrect` (confidently a different known or unrelated sign),
`uncertain` (anything else — the teacher asks for another try), `poor_capture` (body/hands not visible enough, or too
few frames). Only signs whose evaluation passed (≥80% accepted, ≤3% wrongly accepted) get camera checking; others fall
back to "I've practised it", which is never counted as recognised. See `RECOGNITION.md` for the evaluation.

Limits (honest): isolated words only, no sentences; trained on a small number of signers filmed in one setting; not yet
validated with learners' own webcams or reviewed by a Deaf ISL educator.

## Rebuilding the model

```
python -I tools/isl-recognition/extract.py <INCLUDE category dir> landmarks.jsonl <mediapipe models dir>
python -I tools/isl-recognition/train.py greetings.jsonl public/isl-classroom/model.json docs/isl-classroom/RECOGNITION.md 15 unrelated.jsonl
python -I tools/isl-recognition/pick_clips.py greetings.jsonl <INCLUDE videos root> public/isl-classroom/signs
```
