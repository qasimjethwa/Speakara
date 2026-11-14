# Accessibility

Target: WCAG 2.2 level AA. **Current state: not conformant** — the foundations are in place, there are known colour
contrast failures, and no assistive-technology audit has been done.

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

## Known defects
| # | Issue | WCAG | Proposed fix |
|---|---|---|---|
| 1 | White button labels on `brand`, `sky`, `coral` are 2.6–3.0:1 | 1.4.3 | Use `brand-dark`/`sky-dark`/`coral-dark` as fills with a still-darker edge, or dark text on the bright fills |
| 2 | `sun-dark` text on white / `sun-soft` is 2.4–2.7:1 (streak count, summary title) | 1.4.3 | Add a darker amber text token (about `#8A5A00`) |
| 3 | `*-dark` text on `*-soft` tints is 3.7–3.8:1 at body size (feedback sheet, notices) | 1.4.3 | Darken the three text shades by ~15% |
| 4 | Word-bank tiles move between regions without focus management; the answer order is not announced | 2.4.3, 4.1.3 | Move focus predictably and announce the built sentence |
| 5 | Matching pairs rely on two visual columns | 1.3.1 | Add group labels and "matched" announcements |
| 6 | Quit dialog does not trap focus or close on Escape | 2.1.2, 2.4.3 | Use `<dialog>` or a focus trap |
| 7 | The path's zig-zag uses CSS transforms; at 400% zoom nodes may clip on narrow screens | 1.4.10 | Reduce offsets under 360 px |
| 8 | Interface is English only | 3.1.2 (partially) | Translate for en-es and en-hi courses |
| 9 | Listening exercises have no non-audio equivalent beyond skipping | 1.2.1 | Offer "show text" as an alternative mode |
| 10 | Timing: speech recognition ends on silence with no extension | 2.2.1 | Allow retry without penalty (present) and a longer window |

## Audit plan
1. Fix defects 1–3 (token change) and re-compute ratios.
2. Automated scan (axe) on every route in CI.
3. Manual keyboard pass and screen-reader pass (NVDA + Firefox, VoiceOver + Safari, TalkBack + Chrome) over workflows W1–W6.
4. Test at 200% and 400% zoom and with Windows high-contrast mode.
5. Recruit learners with disabilities for the lesson loop specifically.
