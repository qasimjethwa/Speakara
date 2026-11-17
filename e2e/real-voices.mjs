// Real text-to-speech: no stand-ins. Plays the first word of each target course's first lesson through the
// browser's own speechSynthesis and reports the voice the browser actually used and whether the engine finished.
//   E2E_BROWSER=firefox node e2e/real-voices.mjs [baseUrl]
// The utterance is observed (speak() is wrapped to read its fields) but not replaced: the real engine speaks it.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pw = require("playwright"); const ENGINE = process.env.E2E_BROWSER ?? "firefox";
const BASE = process.argv[2] ?? "http://localhost:3000";
const COURSES = [["es-en", "es1.1", "es-ES"], ["fr-en", "fr1.1", "fr-FR"], ["de-en", "de1.1", "de-DE"], ["ko-en", "ko1.1", "ko-KR"], ["it-en", "it1.1", "it-IT"], ["ru-en", "ru1.1", "ru-RU"], ["ar-en", "ar1.1", "ar-SA"]];
const base = { version: 1, profile: { name: "Mic", courseId: "es-en", onboarded: true, sound: false, speech: true, motion: false, dailyGoalXp: 20 }, xp: 10, gems: 0, streak: { count: 0, lastDay: null, freezes: 0, longest: 0 }, completed: { "es-en:es1.1": { count: 1, bestAccuracy: 1, at: 1 } }, unlockedUnits: {}, stories: {}, review: {}, mistakes: [], xpEvents: [], quests: { day: "", items: [] }, achievements: {}, conversations: [], stats: { lessons: 1, perfect: 0, practice: 0, minutes: 0, tutorTurns: 0 } };
const browser = await pw[ENGINE].launch(); let failures = 0; const rows = [];
for (const [courseId, lessonId, locale] of COURSES) {
  const ctx = await browser.newContext();
  const seed = JSON.stringify({ ...base, profile: { ...base.profile, courseId, sound: true }, completed: {} });
  await ctx.addInitScript(({ seed }) => {
    localStorage.setItem("speakara:learner:v1", seed); window.__utt = [];
    const real = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (u) => { const rec = { text: u.text, lang: u.lang, voice: u.voice ? `${u.voice.name} (${u.voice.lang})` : "browser default", started: false, ended: false, error: null, t0: performance.now(), ms: 0 };
      window.__utt.push(rec); u.addEventListener("start", () => { rec.started = true; }); u.addEventListener("end", () => { rec.ended = true; rec.ms = Math.round(performance.now() - rec.t0); }); u.addEventListener("error", (e) => { rec.error = e.error; }); real(u); };
  }, { seed });
  const page = await ctx.newPage(); await page.goto(`${BASE}/lesson?lesson=${lessonId}`);
  const voices = await page.evaluate(async (loc) => { await new Promise((r) => { if (speechSynthesis.getVoices().length) r(); speechSynthesis.onvoiceschanged = r; setTimeout(r, 4000); }); const b = loc.slice(0, 2); return speechSynthesis.getVoices().filter((v) => v.lang.replace("_", "-").split("-")[0].toLowerCase() === b).map((v) => v.lang + ":" + v.name).slice(0, 3); }, locale);
  const hear = page.getByRole("button", { name: /^Hear / }).first(); await hear.waitFor({ timeout: 15000 });
  await hear.click();
  const noticedNow = !voices.length && await page.getByText(/has no .* voice, so it can’t be read aloud/).waitFor({ timeout: 5000 }).then(() => 1, () => 0);
  await page.waitForFunction(() => window.__utt.length && (window.__utt[0].ended || window.__utt[0].error), null, { timeout: 15000 }).catch(() => {});
  const u = (await page.evaluate(() => window.__utt))[0];
  const voiceLang = u?.voice.match(/\(([^()]+)\)$/)?.[1] ?? "";   // the last group is the language tag
  // With no voice for this language the correct result is: nothing spoken (no wrong-language voice) and an explanation.
  if (!voices.length) {
    const noticed = noticedNow;
    const silent = !u;
    if (!(noticed && silent)) failures++;
    rows.push(`| ${courseId} | ${locale} | none | nothing spoken${u ? " — FAILED: spoke with " + u.voice : ""} | — | — | ${noticed && silent ? "PASS (missing voice explained, nothing spoken)" : "FAIL"} |`);
    await ctx.close(); continue;
  }
  const ok = !!u && u.lang === locale && u.ended && !u.error && voiceLang.replace("_", "-").split("-")[0].toLowerCase() === locale.slice(0, 2).toLowerCase();
  if (!ok) failures++;
  rows.push(`| ${courseId} | ${locale} | ${voices.length ? voices.join(", ") : "none"} | ${u ? u.voice : "—"} | ${u?.started ? "yes" : "no"} | ${u?.ended ? `yes (${u.ms} ms)` : "no"} | ${ok ? "PASS" : "FAIL"} |`);
  await ctx.close();
}
await browser.close();
console.log(`${ENGINE} ${browser.version?.() ?? ""}\n| Course | Requested | Matching voices on this engine | Voice the browser used | Started | Finished | Result |\n|---|---|---|---|---|---|---|\n` + rows.join("\n"));
process.exit(failures ? 1 : 0);
