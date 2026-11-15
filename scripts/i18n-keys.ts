/** Collects every interface string that must exist in the Spanish and Hindi dictionaries. */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { ACHIEVEMENTS, LEAGUES, QUEST_LABELS } from "../src/lib/engine/gamification";
import { SCENARIOS } from "../src/lib/tutor/scenarios";
import { COURSES } from "../src/lib/content";
import dynamic from "../src/lib/i18n/dynamic-keys.json";

const SKIP = [/src\/app\/admin\//, /src\/app\/(features|about)\//, /\.test\.ts$/, /src\/lib\/i18n\//];
function files(dir: string): string[] { return readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(p) ? [p] : []; }); }

export function collectKeys(root = "src"): string[] {
  const keys = new Set<string>();
  for (const f of files(root)) {
    if (SKIP.some((r) => r.test(f.replaceAll("\\", "/")))) continue;
    const src = readFileSync(f, "utf8");
    // t("literal"…) / tr("literal"…) calls
    for (const m of src.matchAll(/\b(?:t|tr)\(\s*"((?:[^"\\]|\\.)+)"/g)) keys.add(JSON.parse(`"${m[1]}"`));
    // strings marked for translation where they are passed through t(variable): /*i18n*/ "…"
    for (const m of src.matchAll(/\/\*i18n\*\/\s*"((?:[^"\\]|\\.)+)"/g)) keys.add(JSON.parse(`"${m[1]}"`));
  }
  for (const a of ACHIEVEMENTS) { keys.add(a.title); keys.add(a.description); }
  for (const v of Object.values(QUEST_LABELS)) keys.add(v);
  for (const l of LEAGUES) keys.add(l);
  for (const c of COURSES) { keys.add(c.targetName); keys.add(c.nativeName); }
  for (const s of SCENARIOS) { keys.add(s.title); keys.add(s.description); }
  for (const k of dynamic as string[]) keys.add(k); // strings passed through t(variable): nav labels, errors, instructions
  return [...keys].sort();
}
if (process.argv[1]?.endsWith("i18n-keys.ts")) console.log(JSON.stringify(collectKeys(), null, 0));
