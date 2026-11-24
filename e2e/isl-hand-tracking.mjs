// ISL hand-tracking release: a real video is fed in as the webcam, so MediaPipe tracking runs for real.
//   BASE=http://localhost:3000 HANDS_VIDEO=clip.y4m [SHOTS=dir] node e2e/isl-hand-tracking.mjs
import { createRequire } from "node:module";
const require = createRequire(import.meta.url); const { chromium } = require("playwright");
const BASE = process.env.BASE ?? "http://localhost:3000"; const SHOTS = process.env.SHOTS;
let failures = 0; const expect = (c, m) => { console.log(c ? "• ok:" : "✗ FAIL:", m); if (!c) failures++; };
const seed = JSON.stringify({ version: 1, profile: { name: "T", username: "", nativeLang: "en", courseId: "es-en", goal: "", level: "new", dailyGoalXp: 20, onboarded: true, sound: false, speech: false, motion: false, createdAt: Date.now(), uiLang: "en", isPublic: false, role: "learner", slowAudio: false, savedPhrases: [] }, xp: 0, gems: 0, streak: { count: 0, lastDay: null, freezes: 0, longest: 0 }, completed: {}, unlockedUnits: {}, stories: {}, review: {}, mistakes: [], xpEvents: [], quests: { day: "", items: [] }, achievements: {}, conversations: [], stats: { lessons: 0, perfect: 0, practice: 0, minutes: 0, tutorTurns: 0 } });

const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-video-capture=${process.env.HANDS_VIDEO}`] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, permissions: ["camera"] });
await ctx.addInitScript((s) => { localStorage.setItem("speakara:learner:v1", s); }, seed);
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto(`${BASE}/learn/isl`, { waitUntil: "networkidle" });
await p.getByTestId("isl-hand-tracking").waitFor();
const text = await p.locator("main").innerText();
expect(/Live hand tracking/.test(text) && /does not check signs yet/.test(text), "the page is a hand-tracking demo and says it does not check signs");
expect(!/score|accuracy|correct!|recognis/i.test(text.replace(/Sign recognition and feedback|check your signs/g, "")), "no scores, accuracy or recognition claims");
expect(await p.locator("canvas[data-engine], [data-mood], video[src*='/isl-classroom/signs/']").count() === 0, "no teacher, avatar or sign demonstration is shown");
expect(await p.locator("[data-soon]").count() === 6, "six future features are shown as Coming soon");
await p.getByRole("button", { name: "Turn on camera" }).click();
await p.waitForFunction(() => /hands? tracked/.test(document.querySelector("[data-testid=isl-hand-tracking]")?.textContent ?? ""), null, { timeout: 60000 });
expect(true, "live hand landmarks are detected from the camera");
if (SHOTS) await p.screenshot({ path: `${SHOTS}/hands-live.png` });
await p.getByTestId("record").click();
await p.getByTestId("replay-stats").waitFor({ timeout: 30000 });
const stats = await p.getByTestId("replay-stats").innerText(); console.log("  ", stats);
const [, n, m] = stats.match(/(\d+) of (\d+)/) ?? [];
expect(Number(m) >= 15 && Number(n) > 0, "a 5-second recording captured frames with hands in them");
expect(await p.getByTestId("replay-hands").count() === 1, "the recorded hand movement replays");
if (SHOTS) await p.screenshot({ path: `${SHOTS}/hands-replay.png` });
expect(errs.length === 0, `no page errors ${errs.join(" | ")}`); await b.close();

const b2 = await chromium.launch(); const c2 = await b2.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await c2.addInitScript((s) => { localStorage.setItem("speakara:learner:v1", s); }, seed);
const m2 = await c2.newPage(); await m2.goto(`${BASE}/learn/isl`, { waitUntil: "networkidle" }); await m2.getByTestId("isl-hand-tracking").waitFor();
expect(await m2.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, "fits a 390px phone");
if (SHOTS) await m2.screenshot({ path: `${SHOTS}/hands-mobile.png`, fullPage: true });
await b2.close();
for (const old of ["/learn/isl/english/en1", "/learn/isl/practice"]) {
  const r = await fetch(BASE + old, { redirect: "manual" }); expect([307, 308].includes(r.status), `${old} redirects to the hand-tracking page`);
}
console.log(failures ? `${failures} FAILED` : "ALL ISL HAND-TRACKING CHECKS PASSED"); process.exit(failures ? 1 : 0);
