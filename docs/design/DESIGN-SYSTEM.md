# Speakara design system

Source of truth in code: `src/app/globals.css` (`@theme` tokens), `src/components/ui.tsx`, `src/components/Mascot.tsx`.

## 1. Brand
Playful, warm, never scolding. Speakara is green-led like much of the genre, but with its own emerald and its own
character. **Kiko** the chameleon is the brand's voice.

## 2. Colour tokens

Fills carry white text at ≥ 4.5:1. The `-dark` shade is the key edge and the text colour on white and on the `-soft` tint.

| Token | Fill | Dark (edge / text) | Soft (tint) | Use |
|---|---|---|---|---|
| `brand` | `#0A8549` | `#0A6E3F` | `#DCF7E9` | Primary actions, correct state, progress. `brand-bright` `#12B76A` is decorative only (confetti, mascot) |
| `sky` | `#1A73D1` | `#125AA8` | `#DCEEFF` | Selection, audio, links, secondary actions |
| `sun` | `#FFB224` | `#8A5A00` (text) · `#D98E04` (`sun-edge`) | `#FFF2D1` | Completed nodes, streak, goals. Always carries **ink** text, never white |
| `coral` | `#D43838` | `#B02A2A` | `#FFE3E3` | Incorrect state, destructive actions, recording |
| `grape` | `#7A4FE0` | `#5B33B8` | `#ECE4FF` | XP, third unit colour, achievements |
| `ink` | `#2F3540` | — | — | Primary text |
| `sub` | `#566070` | — | — | Secondary text |
| `line` / `line-dark` | `#E3E6EB` / `#868E9C` | — | — | Dividers / control borders (3.3:1 against white) |
| `paper` / `mist` | `#FFFFFF` / `#F6F7F9` | — | — | Surfaces |

Contrast ratios (WCAG 2 formula, computed from the HEX values above):

| Pair | Ratio |
|---|---|
| `ink` on `paper` | 12.3:1 |
| `sub` on `paper` / `mist` / `line` / `sky-soft` | 6.4 / 5.9 / 5.1 / 5.4:1 |
| white on `brand` / `sky` / `coral` / `grape` | 4.7 / 4.8 / 4.7 / 5.2:1 |
| `ink` on `sun` | 6.8:1 |
| `brand-dark` on `brand-soft` · `sky-dark` on `sky-soft` · `coral-dark` on `coral-soft` | 5.6 · 5.8 · 5.4:1 |
| `grape-dark` on `grape-soft` · `sun-dark` on `sun-soft` | 6.6 · 5.3:1 |
| `sky-dark` / `brand-dark` / `sun-dark` text on `paper` | 6.9 / 6.3 / 5.9:1 |

Every text pair meets AA for normal text. The earlier palette (`#12B76A` buttons with white text at 2.6:1) was replaced
for this reason. Automated axe checks run against 18 screens in `e2e/smoke.mjs`.

## 3. Typography
Nunito Variable (SIL OFL), self-hosted via `@fontsource-variable/nunito`. Body weight 600; headings 800; button labels
800 uppercase with `tracking-wide`.

| Role | Size / line | Weight |
|---|---|---|
| Display (landing h1) | 36–48 px / 1.15 | 800 |
| Page title | 24 px / 1.3 | 800 |
| Lesson prompt, options | 18–20 px / 1.5 | 700 |
| Body | 16 px / 1.5 | 600 |
| Caption | 12–14 px | 700 |

## 4. Spacing, radius, elevation
4 px base scale (Tailwind defaults). Radii: 12 px chips/tiles, 16 px inputs/buttons/cards, 20–28 px hero panels, full
for nodes and avatars. There are almost no drop shadows: depth comes from the **key edge** — a 4 px darker bottom border
(8 px on path nodes and the microphone) that collapses to 1 px while pressed and shifts the control down 3 px.

## 5. Components

| Component | Spec |
|---|---|
| **Button** | Min height 48 px, radius 16, uppercase 15 px/800. Variants: `primary` (brand), `sky`, `sun`, `danger` (coral), `secondary` (white, 2 px `line-dark` border), `ghost` (text). Disabled: `line` fill, `sub` text, no press motion |
| **Option / tile** | White, 2 px border + key edge. Selected: `sky` border, `sky-soft` fill, `sky-dark` text. Number badge for keyboard shortcuts |
| **Card** | 2 px `line` border, radius 16, 20 px padding, no shadow |
| **Progress bar** | 16 px tall pill, `line` track, fill with a white 35% highlight stripe; 500 ms width transition; `role="progressbar"` |
| **Path node** | 76×70 px ellipse, 8 px edge. Done: `sun` + check. Open: unit colour + star. Current: pulsing ring + bobbing START tag. Locked: `line` + lock |
| **Unit header** | Full-width banner in the unit colour, title + objective, guidebook key |
| **Feedback sheet** | Slides up 220 ms. Correct: `brand-soft` with `brand-dark` text. Incorrect: `coral-soft` with `coral-dark`. Contains verdict, correct answer, optional Explain, Continue |
| **Field** | `mist` fill, 2 px `line` border, focus → `sky` border on white |
| **Switch** | 56×32 px, `brand` when on |
| **Icons** | Lucide, 2.4 stroke, 22–28 px; emoji for content illustration (flags, achievements) |

## 6. States
Hover: +4% brightness. Active: press animation. Focus-visible: 3 px `sky` outline, 2 px offset — on every interactive
element. Success: `brand` family + rising two-note chime. Error: `coral` family + falling tone + 300 ms shake (matching
pairs). Loading: 20 px spinner with text. Empty: Kiko "think" + one sentence + one action.

## 7. Motion
`pop` 350 ms (rewards), `rise` 220 ms (sheets), `bob` 2.4 s loop (mascot, START tag), `shake` 300 ms, confetti 1.6–3.2 s.
All disabled by `prefers-reduced-motion` and by Settings → Animations.

## 8. Mascot: Kiko
Round chameleon with a curled tail, two-spike crest and large mismatched eyes; drawn as inline SVG.

| Mood | Skin colour | Used for |
|---|---|---|
| `happy` | brand green | Prompts, default |
| `wave` | brand green, arm raised | Welcome, current path node, sign-up |
| `cheer` | sun gold, both arms up, open mouth | Session complete, plan ready |
| `think` | sky blue, eyes up | Empty states, tips, failed test-out |
| `oops` | warm orange, sweat drop | Reserved for error pages |
| `sleepy` | grape purple, eyes closed | Reserved for streak reminders |

Voice: short sentences, encouragement first, never guilt ("Not quite — here's the answer", not "Wrong!").

## 9. Sound
Synthesised with Web Audio (no recorded assets): tap 440 Hz; correct 587→880 Hz; wrong 233→185 Hz triangle; finish
C-E-G-C arpeggio. Controlled by Settings → Sound.
