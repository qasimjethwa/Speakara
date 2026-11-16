/**
 * Course quality audit and native-review sheets.
 *   npx tsx scripts/content-audit.ts            → prints findings; exits 1 on errors
 *   npx tsx scripts/content-audit.ts --sheets   → also writes docs/content/review/<course>.md
 * Errors block a release (ambiguous answer keys, duplicates). Notes are for the human reviewer.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { COURSES } from "../src/lib/content";
import { TARGET_LANGUAGES } from "../src/lib/content/languages";
import { normalize, tokens } from "../src/lib/engine/text";

const errors: string[] = []; const notes: Record<string, string[]> = {};
for (const lang of TARGET_LANGUAGES) {
  const c = COURSES.find((x) => x.id === lang.courseId)!; const n: string[] = (notes[c.id] = []);
  const words = c.units.flatMap((u) => u.lessons.flatMap((l) => l.words.map((w) => ({ ...w, lesson: l.id }))));
  const sentences = c.units.flatMap((u) => u.lessons.flatMap((l) => l.sentences.map((s) => ({ ...s, lesson: l.id }))));
  // 1. The same target word taught with different meanings, or the same meaning with different target words
  const byT = new Map<string, Set<string>>(), byN = new Map<string, Set<string>>();
  for (const w of words) { const t = normalize(w.t), m = normalize(w.n); (byT.get(t) ?? byT.set(t, new Set()).get(t)!).add(w.n); (byN.get(m) ?? byN.set(m, new Set()).get(m)!).add(w.t); }
  for (const [t, ms] of byT) if (ms.size > 1) n.push(`“${t}” is glossed in ${ms.size} ways: ${[...ms].join(" / ")}`);
  for (const [m, ts] of byN) if (ts.size > 1) n.push(`“${m}” is taught as ${[...ts].join(" / ")} — choice questions exclude these from each other's distractors`);
  // 2. Duplicate sentences (same target text in two places)
  const seenS = new Map<string, string>();
  for (const s of sentences) { const k = normalize(s.t); if (seenS.has(k)) errors.push(`${c.id}: sentence “${s.t}” appears in ${seenS.get(k)} and ${s.lesson}`); else seenS.set(k, s.lesson); }
  // 3. Ambiguous translate-into-target keys: two sentences share an English meaning but differ in the target language
  const enToT = new Map<string, Set<string>>();
  for (const s of sentences) for (const m of [s.n, ...(s.alt ?? [])]) { const k = normalize(m); (enToT.get(k) ?? enToT.set(k, new Set()).get(k)!).add(s.t); }
  for (const [m, ts] of enToT) if (ts.size > 1) errors.push(`${c.id}: English “${m}” maps to several target sentences (${[...ts].join(" | ")}) — translating into ${c.targetName} would reject a correct answer`);
  // 4. Identical pairs and empty alternatives
  for (const w of words) if (normalize(w.t) === normalize(w.n)) n.push(`“${w.t}” (${w.id}) is the same in both languages`);
  const redundant = sentences.filter((s) => (s.alt ?? []).some((a) => normalize(a) === normalize(s.n))).map((s) => s.id);
  if (redundant.length) n.push(`${redundant.length} alternatives only differ by a contraction or punctuation, which the checker already accepts (harmless): ${redundant.join(", ")}`);
  // 5. Sentence words never taught as vocabulary (for the reviewer: are they guessable?)
  const known = new Set(words.flatMap((w) => tokens(normalize(w.t)))); const untaught = new Set<string>();
  for (const s of sentences) for (const tok of tokens(normalize(s.t))) if (!known.has(tok) && !/^[0-9]/.test(tok)) untaught.add(tok);
  if (untaught.size) n.push(`${untaught.size} sentence words are not in any vocabulary list: ${[...untaught].slice(0, 40).join(", ")}${untaught.size > 40 ? " …" : ""}`);
}
for (const c of TARGET_LANGUAGES) { console.log(`\n${c.flag} ${c.courseId}`); for (const x of notes[c.courseId]) console.log("  note:", x); }
if (errors.length) { console.log("\nERRORS"); for (const e of errors) console.log("  ✗", e); }
else console.log("\nNo blocking content errors.");

if (process.argv.includes("--sheets")) {
  mkdirSync("docs/content/review", { recursive: true });
  for (const lang of TARGET_LANGUAGES) {
    const c = COURSES.find((x) => x.id === lang.courseId)!;
    const rows: string[] = [];
    for (const u of c.units) {
      rows.push(`\n## ${u.id} · ${u.title} — ${u.objective}\n\n### Guidebook tips\n`);
      for (const t of u.tips) rows.push(`- **${t.title}** — ${t.body} ${t.examples.map((e) => `_${e.t}_ = ${e.n}`).join("; ")}  \n  Reviewer verdict: ☐ correct ☐ needs change — comment:`);
      for (const l of u.lessons) {
        rows.push(`\n### ${l.id} · ${l.title}\n\n| ID | ${lang.name} | English | Also accepted | Verdict | Comment |\n|---|---|---|---|---|---|`);
        for (const w of l.words) rows.push(`| ${w.id} | ${w.t} | ${w.n} | | ☐ | |`);
        for (const s of l.sentences) rows.push(`| ${s.id} | ${s.t} | ${s.n} | ${(s.alt ?? []).join(" · ")} | ☐ | |`);
      }
      if (u.story) {
        rows.push(`\n### Story ${u.story.id} · ${u.story.title}\n\n| Line | Speaker | ${lang.name} | English | Verdict |\n|---|---|---|---|---|`);
        u.story.lines.forEach((l, i) => rows.push(`| ${i + 1} | ${l.speaker} | ${l.t} | ${l.n} | ☐ |`));
        for (const q of u.story.questions) rows.push(`\nQuestion after line ${q.afterLine + 1}: ${q.prompt} — options: ${q.options.map((o, i) => (i === q.answer ? `**${o}** (answer)` : o)).join(" · ")} ☐`);
      }
    }
    const body = `# Native-speaker review — ${lang.flag} ${lang.name} (${c.id})

**Review status: NOT REVIEWED.** No qualified native speaker has reviewed this course. The app labels it
“native review pending” until this sheet is completed and signed below.

Reviewer name: ________________ Qualification / native variety: ________________ Date: ________

How to review: tick a verdict for every row. For anything wrong, write the corrected ${lang.name} or English in the
comment column. Check spelling and marks, naturalness for a beginner, the English meaning, and whether other common
answers should be accepted (add them under “Also accepted”). IDs must not change.

Automated findings for the reviewer:
${(notes[c.id] ?? []).map((x) => `- ${x}`).join("\n") || "- none"}
${rows.join("\n")}

## Sign-off

☐ I have reviewed every row above and all items marked correct are accurate and natural for A1 learners.

Signature: ________________
`;
    writeFileSync(`docs/content/review/${c.id}.md`, body);
  }
  console.log("Review sheets written to docs/content/review/");
}
process.exit(errors.length ? 1 : 0);
