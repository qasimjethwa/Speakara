import { COURSES } from "../src/lib/content";
import { lintCourse } from "../src/lib/content/lint";
let bad = 0;
for (const c of COURSES) { const issues = lintCourse(c); bad += issues.length; console.log(`${issues.length ? "✗" : "✓"} ${c.id} — ${c.units.length} unit(s), ${c.units.reduce((n, u) => n + u.lessons.length, 0)} lesson(s)${issues.length ? `\n  ${issues.join("\n  ")}` : ""}`); }
process.exit(bad ? 1 : 0);
