import type { Course } from "./types";
/** Automated content checks shared by the review page, the CLI (`npm run content:check`) and the test suite. */
export function lintCourse(c: Course): string[] {
  const issues: string[] = []; const ids = new Set<string>();
  const id = (x: string) => { if (ids.has(x)) issues.push(`duplicate id ${x}`); ids.add(x); };
  if (!c.units.length) issues.push("course has no units");
  for (const u of c.units) {
    id(u.id);
    if (!u.tips.length) issues.push(`${u.id}: no guidebook tips`);
    if (u.lessons.length < 2) issues.push(`${u.id}: fewer than 2 lessons`);
    for (const l of u.lessons) {
      if (l.words.length < 5) issues.push(`${l.id}: fewer than 5 words`);
      if (l.sentences.length < 4) issues.push(`${l.id}: fewer than 4 sentences`);
      for (const x of [...l.words, ...l.sentences]) { id(x.id); if (!x.t.trim() || !x.n.trim()) issues.push(`${x.id}: empty text`); if (x.t !== x.t.trim() || x.n !== x.n.trim()) issues.push(`${x.id}: stray whitespace`); }
      const seen = new Set<string>(); for (const w of l.words) { if (seen.has(w.t)) issues.push(`${l.id}: word “${w.t}” repeated`); seen.add(w.t); }
    }
    if (u.story) { id(u.story.id); for (const q of u.story.questions) { if (q.afterLine < 0 || q.afterLine >= u.story.lines.length) issues.push(`${u.story.id}: question after missing line ${q.afterLine}`); if (q.answer < 0 || q.answer >= q.options.length) issues.push(`${u.story.id}: answer index out of range`); } }
  }
  return issues;
}
