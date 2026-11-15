# Content licensing and provenance

## Licences
| Asset | Licence | Notes |
|---|---|---|
| Course content (`src/lib/content`) | CC BY-SA 4.0 | Original to Speakara |
| Source code | Not yet chosen | A `LICENSE` file must be added by the project owner (MIT or AGPL are the usual candidates) |
| Kiko mascot and logo (`src/components/Mascot.tsx`) | Original artwork; follows the code licence until decided | Not derived from any third-party character |
| Nunito typeface | SIL Open Font License 1.1 | Via `@fontsource-variable/nunito` |
| Icons | ISC (Lucide) | |
| Sound effects | Generated at runtime with Web Audio | No recordings shipped |
| Speech audio | Produced by the learner's browser voices | Not redistributed by Speakara |

## Provenance register
| Content | Source | Author | Reviewer | Date | Status |
|---|---|---|---|---|---|
| `es-en` units 1–3, stories | Written from scratch for Speakara | AI-assisted draft (Claude), checked by the same author | **None yet** | 2026-11-14 | Native review pending |
| `fr-en` unit 1 | Written from scratch | AI-assisted draft | None yet | 2026-11-14 | Native review pending |
| `en-es` unit 1 | Written from scratch | AI-assisted draft | None yet | 2026-11-14 | Native review pending |
| `en-hi` unit 1 | Written from scratch | AI-assisted draft | None yet | 2026-11-14 | **Needs native Hindi review before promotion** |
| Tutor scenario scripts (9 scenarios × es / fr / en) | Written from scratch | AI-assisted draft | None yet | 2026-11-15 | Review with course content |
| Interface translations — Spanish (472 strings, `src/lib/i18n/translations.json`) | Translated for Speakara | AI-assisted draft | None yet | 2026-11-15 | Native review pending |
| Interface translations — Hindi (472 strings) | Translated for Speakara | AI-assisted draft | None yet | 2026-11-15 | **Needs native Hindi review**; automated checks cover completeness and placeholders only |

Be clear with learners and funders: as of this date **no content has been reviewed by a second human**. The content is
basic A1 material and was checked carefully, but independent native review is the first content task on the roadmap.

## What was not used
No text, audio, images, characters or course structure were copied from Duolingo or any other product. Research
captures of Duolingo pages were used only to understand interaction patterns and are not stored in this repository.

## Using open resources later
Acceptable sources with attribution: Tatoeba sentences (CC BY 2.0 FR / CC0 subset), Wiktionary (CC BY-SA), Common Voice
audio (CC0), CEFR descriptors (Council of Europe, cite). Record source, licence and any modification in the register
above before merging.
