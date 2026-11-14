# UI/UX reference analysis

What we learned from the reference product's interface, and what Speakara takes from it. Speakara adopts **interaction
patterns** common to the genre; it does not reproduce Duolingo's brand assets, characters, illustrations, exact palette or copy.

## Observed patterns

| Pattern | Evidence | Why it works | Speakara decision |
|---|---|---|---|
| One dominant CTA per screen, full-width, fixed to the bottom in lessons | [V E2, screenshots] | Removes choice paralysis; thumb-reachable | Adopted (`Button`, sticky lesson footer) |
| Chunky "pressable" controls with a darker bottom edge | [V E7, screenshots] | Tactile affordance; reads as a game, not a form | Adopted as the `.key` utility with our own colours and radii |
| Uppercase, heavy-weight button labels; rounded sans typeface | [V E7] | Friendly and legible at small sizes | Adopted with Nunito (OFL licence) |
| Vertical path with a small set of node states | [V screenshot] | Always answers "what next?" | Adopted: done / current / open / locked, zig-zag offset |
| Unit header as a coloured banner with guidebook access | [V screenshot] | Chunks the course; reference material one tap away | Adopted; colour rotates per unit |
| Character + speech bubble presenting the prompt | [V screenshot] | Makes a drill feel like a conversation | Adopted with our own mascot, Kiko |
| Progress bar + close at the top of a lesson | [V screenshots] | Constant sense of nearing the end | Adopted |
| Bottom feedback sheet tinted for right/wrong, with the answer | [P] | Feedback where the eye already is | Adopted, plus an "Explain" disclosure |
| Skip affordance for audio/speaking | [V screenshot "I can't use a microphone right now"] | Accessibility and context (public transport) | Adopted for speaking *and* listening; disables that type for the session |
| Course grid with social proof numbers | [V E3, E4] | Reassures choice | **Not adopted** — we have no such numbers and will not invent them |
| Paid-tier upsell on the homepage and in navigation | [V E2, E5] | Revenue | **Rejected** by product principle |

## Where Speakara intentionally differs

- **Identity**: emerald `#12b76a` rather than Duolingo's lime green; a chameleon who changes colour with feedback state rather than an owl and cast; our own logo mark.
- **No scarcity UI**: the top bar shows streak, gems and XP — there is no hearts/energy slot at all.
- **Honest states**: features that need a backend (friends, real leagues, open-ended AI) say so in plain language instead of showing dead buttons or fake data.
- **Three-column desktop**: left navigation, 640 px content column, 340 px right rail (goal, quests, league). On phones the rail collapses into a sticky stat bar and a five-item bottom tab bar.

## Screens studied vs. confidence

| Screen | Source | Confidence in our description |
|---|---|---|
| Homepage, register (course grid), courses, Super page | REA captures E2–E7 | High |
| Path, word bank, speaking | Owner-supplied screenshots (undated) | Medium — layout yes, current styling uncertain |
| Lesson completion, quests, leagues, shop, profile | Not observed | Low — Speakara's versions are original designs |
