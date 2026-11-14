# Speakara design system

Source of truth in code: `src/app/globals.css` (`@theme` tokens), `src/components/ui.tsx`, `src/components/Mascot.tsx`.

## 1. Brand
Playful, warm, never scolding. Speakara is green-led like much of the genre, but with its own emerald and its own
character. **Kiko** the chameleon is the brand's voice.

## 2. Colour tokens

| Token | HEX | Edge (dark) | Soft (tint) | Use |
|---|---|---|---|---|
| `brand` | `#12B76A` | `#0B8F52` | `#DCF7E9` | Primary actions, correct state, progress |
| `sky` | `#2E9BFF` | `#1B78D6` | `#DCEEFF` | Selection, audio, links, secondary actions |
| `sun` | `#FFB224` | `#D98E04` | `#FFF2D1` | Completed nodes, streak, goals, celebration |
| `coral` | `#FF5D5D` | `#D93F3F` | `#FFE3E3` | Incorrect state, destructive actions, recording |
| `grape` | `#9163F2` | `#6F42D4` | `#ECE4FF` | XP, third unit colour, achievements |
| `ink` | `#2F3540` | — | — | Primary text |
| `sub` | `#6A7282` | — | — | Secondary text |
| `line` / `line-dark` | `#E3E6EB` / `#C9CED6` | — | — | Borders, disabled fills, key edges |
| `paper` / `mist` | `#FFFFFF` / `#F6F7F9` | — | — | Surfaces |

Contrast ratios (WCAG 2 formula, computed from the HEX values above):

| Pair | Ratio | Verdict |
|---|---|---|
| `ink` on `paper` | 12.3:1 | Passes AA/AAA |
| `sub` on `paper` / on `mist` | 4.8:1 / 4.5:1 | Passes AA |
| `ink` on `sun` | 6.8:1 | Passes AA |
| `grape-dark` on `paper` | 6.2:1 | Passes AA |
| white on `sky-dark` / `brand-dark` | 4.5:1 / 4.2:1 | Large text only |
| `sub` on `line` (disabled buttons) | 3.9:1 | Exempt (disabled), still legible |
| `brand-dark` on `brand-soft`, `sky-dark` on `sky-soft`, `coral-dark` on `coral-soft` | 3.7–3.8:1 | **Fails AA for body text**; passes for large bold text only |
| white on `coral` / `sky` / `brand` (button labels) | 3.0 / 2.9 / 2.6:1 | **Fails AA** |
| `sun-dark` on `paper` / `sun-soft` | 2.7 / 2.4:1 | **Fails AA** |

The failing pairs are a known defect, tracked in `docs/quality/ACCESSIBILITY.md` with the proposed fix (darker button
fills and darker text shades on tints).

These differ from the reference palette in the brief (`#58CC02` etc.) on purpose: same energy, distinct identity.

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
