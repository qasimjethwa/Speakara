# Accessibility

Target: WCAG 2.2 level AA. **Current state:** every main screen passes the axe-core WCAG 2.0/2.1/2.2 A and AA rule
set in the browser test run (landing, onboarding, path, lesson intro, exercise, summary, practice, vocabulary,
guidebook, tutor, quests, profile, settings, stories, speaking feedback, log-in, sign-up, signed-in profile). Automated
rules cover only part of WCAG; no screen-reader or user testing has been done, so conformance is not claimed.

## Built in
| Area | Implementation |
|---|---|
| Semantics | Landmarks (`header`, `nav` with labels, `main`, `footer`); one `h1` per screen; lists for paths and boards |
| Names | Icon-only controls have `aria-label`; path nodes announce title and state ("Your name (locked)") |
| Roles | Options use `radiogroup`/`radio` with `aria-checked`; filters use tabs; toggles are `role="switch"`; progress bars expose values |
| Live regions | Lesson feedback, speech status and tutor messages use `aria-live="polite"`; errors use `role="alert"` |
| Keyboard | All controls are native buttons/links; number keys pick options; Enter checks and continues; visible 3 px focus ring |
| Language | Target-language text carries `lang` so screen readers switch voice |
| Not colour alone | Right/wrong feedback has icon + text + colour; path states differ by icon |
| Motion | `prefers-reduced-motion` and a Settings switch disable animations and confetti |
| Alternatives | Speaking and listening can be skipped; stories and audio prompts show text; slow audio button |
| Targets | 48 px minimum height on primary controls |
| Zoom | Relative layout; no fixed-height text containers; 16 px inputs |

## Fixed since the first build
| Issue | Fix |
|---|---|
| White labels on bright fills, amber and tinted text below 4.5:1 | New colour tokens (see `DESIGN-SYSTEM.md`); all text pairs are 4.5:1 or better, checked by axe |
| Word bank gave no feedback to screen readers | Answer and bank are labelled groups; the sentence so far is announced |
| Matching relied on two visual columns | Labelled groups, pressed state, matches announced |
| Quit dialog did not trap focus | Native `<dialog>`: focus trapped, Escape closes, focus returns |
| Interface English only | English, Spanish, Hindi; `lang` set on the document |
| Listening had no alternative | "Can't listen now" turns listening off for the session without counting it as answered |

## Open
| # | Issue | WCAG |
|---|---|---|
| 1 | The path's zig-zag offsets have not been checked at 400% zoom on very narrow screens | 1.4.10 |
| 2 | Speech recognition ends on silence; retry is free but the window cannot be extended | 2.2.1 |
| 3 | No manual screen-reader pass (NVDA, VoiceOver, TalkBack) | — |
| 4 | Hindi and Spanish interface text has not had native review | 3.1 |
