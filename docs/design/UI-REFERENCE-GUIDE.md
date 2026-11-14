# UI reference guide

How the genre's reference interface informed each key Speakara screen. Reference observations cite
`docs/research/research-evidence.md`; Duolingo screenshots are **not** redistributed here — open the URLs to see them.
Speakara screenshots can be regenerated with `node e2e/smoke.mjs http://localhost:3000 ./shots`.

| Screen | Public reference | What the reference demonstrates | Speakara implementation |
|---|---|---|---|
| Landing | https://en.duolingo.com/ (E2, E7) | Illustration beside one headline and two stacked CTAs; language strip under the fold | `/`: Kiko in a tinted circle with floating greetings; headline + "Get started" / "I already have an account"; course strip; six feature cards; pledge banner |
| Course choice | https://en.duolingo.com/register (E3) | Choosing a course *before* any form | `/onboarding` steps 2–3: native language then course cards with honest unit/lesson counts |
| Path | Owner screenshot 1 | Unit banner, node states, START tag, mascot beside the path | `/learn`: see below |
| Word bank | Owner screenshot 2 | Bubble prompt, answer lines, tile bank, sticky CHECK | `WordBank` view |
| Speaking | Owner screenshot 3 | Large mic, opt-out link | `Speak` view with live transcript and reasons for failure |
| Paid comparison | https://en.duolingo.com/super (E5) | What is withheld from free learners | Inverted into our "promises" list on `/about` |

## Path (`/learn`)
- **Layout**: 640 px column. Caption (flag · course · section · CEFR), then per unit: banner → optional "Jump here" key → ordered list of nodes → story node.
- **Hierarchy**: the current node is the only animated element (pulse + bobbing START); completed nodes are gold; everything else recedes to grey.
- **Spacing**: 20 px between nodes; horizontal offsets cycle `0, 44, 70, 44, 0, −44, −70, −44` px to draw a gentle S-curve; 40 px between units.
- **Interactions**: open nodes are links to `/lesson?lesson=<id>`; locked nodes are non-interactive images with an accessible name; guidebook key opens `/guidebook?unit=`.
- **Responsive**: Kiko beside the current node is hidden under 640 px; banner label collapses to an icon.

## Lesson player (`/lesson`)
- **Layout**: 720 px column, full viewport height. Header (close, progress). Body (instruction h1, exercise view). Fixed footer (skip + CHECK, or feedback sheet + CONTINUE).
- **Component structure**: `LessonPlayer` → `ExerciseView` switch → one view per type; the footer is shared so every type feels the same.
- **Interactions**: number keys choose options; Enter checks/continues; tiles move between bank and answer; matching auto-submits; wrong items return tagged "Let's try again".
- **Feedback**: sheet colour + icon + text (never colour alone), chime, optional Explain list of the words involved.
- **Responsive**: footer respects the safe-area inset; tiles wrap; the two matching columns stay side by side down to 320 px.

## Summary (`SessionSummaryView`)
Kiko (cheer/happy/think), headline, three stat tiles (XP, accuracy, gems) that pop in, then reward rows (streak, quests,
achievements) and one CONTINUE. Confetti unless the learner failed a test-out or prefers reduced motion.

## Dashboard frame (`AppShell`)
Left navigation (icons only 768–1023 px; icons + labels ≥ 1024 px), content, right rail ≥ 1280 px (stat chips, daily goal,
quests, league, save-progress card). Under 768 px: sticky stat bar + five-item bottom tabs.

## Tutor (`/tutor`)
Scenario grid (emoji, title, one line). Chat: tutor bubbles left with Kiko, audio and translation; learner bubbles right
in `sky`; corrections attach under the learner's own message; tips in a `sun-soft` note. Composer fixed above the tab bar
with mic (if supported), input and send.
