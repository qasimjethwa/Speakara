# Content authoring

## Workflow (human-reviewable by design)
1. **Draft** a unit in `src/lib/content/courses/<course>.ts` following the syllabus and the rules below.
2. **Check**: `npm run content:check` (structure) and `npm test` (every lesson generates solvable exercises of ≥ 6 types).
3. **Preview**: `npm run dev` → `/admin/content` lists every string side by side; play the lessons.
4. **Pull request** with the reviewer checklist. A unit stays `starter` / "review pending" until a qualified native or
   near-native reviewer approves it.
5. **Promote** by updating the course's `review` field in the same PR that records the reviewer in `CONTENT-LICENSING.md`.

## Writing rules
- Teach words before using them in sentences; keep sentences inside the vocabulary taught so far (plus proper names).
- Prefer high-frequency, practical language tied to the unit's can-do objective.
- One canonical translation in `n`; put every other natural translation in `alt` (e.g. "bill"/"check", "mom"/"mum").
  If a learner could reasonably type it, it belongs in `alt`.
- Glosses for function words must disambiguate: `un → "a (masculine)"`.
- Avoid culture-specific assumptions, stereotypes and anything unsuitable for younger learners.
- Stories reuse taught language; questions test understanding, not memory of wording.
- Never add machine-generated sentences without a human check of accuracy and naturalness.

## Reviewer checklist
- [ ] Target-language text is correct and natural (spelling, accents, punctuation, register).
- [ ] Translations are accurate; all reasonable alternatives are listed.
- [ ] Guidebook tips are true and match the examples.
- [ ] Difficulty progresses; nothing appears before it is taught.
- [ ] Linter and tests pass; the lessons were played end to end.

## AI assistance policy
AI may propose drafts or alternative translations. A human author is responsible for every published string, and a
second human reviews it. Record AI assistance in the PR description.

## Audio
Currently synthesised in the browser from the text, so authors supply no audio. When recorded or generated audio assets
are introduced, each needs a voice credit and licence entry.

## Planned tooling
In-app editors with draft → review → publish states and version history (`content_versions`), bulk import from
spreadsheets, and reviewer assignment.
