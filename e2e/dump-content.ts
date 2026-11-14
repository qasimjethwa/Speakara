import { COURSES } from "../src/lib/content";
const out: Record<string, { pairs: [string, string][]; sentences: { t: string; n: string }[] }> = {};
for (const c of COURSES) out[c.id] = { pairs: c.units.flatMap((u) => u.lessons.flatMap((l) => l.words.map((w) => [w.t, w.n] as [string, string]))), sentences: c.units.flatMap((u) => u.lessons.flatMap((l) => l.sentences.map((s) => ({ t: s.t, n: s.n })))) };
console.log(JSON.stringify(out));
