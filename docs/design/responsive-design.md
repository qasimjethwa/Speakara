# Responsive design

Mobile is designed first; desktop is a different arrangement, not a stretched phone.

| Breakpoint | Navigation | Content | Right rail | Stats |
|---|---|---|---|---|
| < 768 px (phones) | Bottom tab bar, 5 items (Learn, Practice, Tutor, Leagues, Profile); other sections via Practice hub | Full width, 16 px gutters, 112 px bottom padding | Hidden | Sticky top bar: flag, streak, gems, XP |
| 768–1023 px (tablets) | Left rail, 88 px, icons only | 640 px column | Hidden | Sticky top bar |
| 1024–1279 px (small laptops) | Left nav, 240 px, icons + labels | 640 px column | Hidden | Sticky top bar |
| ≥ 1280 px (desktop) | Left nav 240 px | 640 px column | 340 px: stats, daily goal, quests, league, account card | In the rail |

## Focused screens
Lessons, stories, onboarding and auth drop all navigation: one column (max 720/640/420 px), header progress, sticky
footer action. This holds at every width.

## Touch and type
- Interactive targets ≥ 48 px high (buttons, options, tiles, tabs); path nodes 76×70 px; the microphone is 160 px.
- Footers use `env(safe-area-inset-bottom)`; viewport heights use `dvh` so mobile browser chrome doesn't hide actions.
- Body 16 px minimum (prevents iOS zoom on focus); prompts 18–20 px; landing headline 36 → 48 px at `md`.

## Component behaviour by width
| Component | Phone | Desktop |
|---|---|---|
| Path mascot | Hidden | Beside the current node |
| Guidebook key | Icon only | Icon + label |
| Summary / quit dialog | Bottom sheet | Centred modal |
| Tutor composer | Above the tab bar | Between nav and rail |
| Feature / scenario / achievement grids | 1 column | 2–3 columns |

## Verified
`e2e/smoke.mjs` runs the full journey at 1440×900 and with Playwright's Pixel 7 profile. Tablet widths and landscape
phones were not tested.
