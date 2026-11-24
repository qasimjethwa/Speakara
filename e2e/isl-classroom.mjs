// ISL Live Classroom acceptance: a real signer's video is fed in as the webcam, so recognition runs for real.
//   BASE=http://localhost:3000 SIGN_HELLO=hello.y4m SIGN_GM=gm.y4m [SHOTS=dir] node e2e/isl-classroom.mjs
import { createRequire } from "node:module";
const require = createRequire(import.meta.url); const { chromium } = require("playwright");
const BASE = process.env.BASE ?? "http://localhost:3000"; const SHOTS = process.env.SHOTS;
let failures = 0; const expect = (c, m) => { console.log(c ? "• ok:" : "✗ FAIL:", m); if (!c) failures++; };
const seed = JSON.stringify({ version: 1, profile: { name: "T", username: "", nativeLang: "en", courseId: "es-en", goal: "", level: "new", dailyGoalXp: 20, onboarded: true, sound: false, speech: false, motion: false, createdAt: Date.now(), uiLang: "en", isPublic: false, role: "learner", slowAudio: false, savedPhrases: [] }, xp: 0, gems: 0, streak: { count: 0, lastDay: null, freezes: 0, longest: 0 }, completed: {}, unlockedUnits: {}, stories: {}, review: {}, mistakes: [], xpEvents: [], quests: { day: "", items: [] }, achievements: {}, conversations: [], stats: { lessons: 0, perfect: 0, practice: 0, minutes: 0, tutorTurns: 0 } });

async function room(video, course = "english", viewport = { width: 1280, height: 900 }) {
  const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-video-capture=${video}`] });
  const ctx = await b.newContext({ viewport, permissions: ["camera"] });
  await ctx.addInitScript((s) => { localStorage.setItem("speakara:learner:v1", s); }, seed);
  const p = await ctx.newPage(); p.errs = []; p.on("pageerror", (e) => p.errs.push(e.message)); p.browser = b;
  await p.goto(`${BASE}/learn/isl`, { waitUntil: "networkidle" });
  await p.locator(`[data-course=${course}]`).click();
  await p.getByTestId("isl-classroom").waitFor();
  return p;
}
const caption = (p) => p.getByTestId("teacher-caption").innerText();
async function attempt(p) {
  await p.waitForFunction(() => /Your turn/.test(document.querySelector("[data-testid=teacher-caption]")?.textContent ?? ""), null, { timeout: 20000 });
  await p.getByRole("button", { name: "Turn on camera" }).click();
  await p.getByTestId("try-sign").waitFor({ timeout: 60000 });
  await p.getByTestId("try-sign").click();
  await p.waitForFunction(() => document.querySelector("[data-testid=isl-classroom]")?.getAttribute("data-phase") === "feedback", null, { timeout: 30000 });
  console.log("  detail:", await p.getByTestId("isl-classroom").getAttribute("data-verdict"));
  return caption(p);
}

// 1. Hello signed correctly (English course)
const A = await room(process.env.SIGN_HELLO);
expect(/Welcome to class/.test(await caption(A)), "the teacher welcomes the learner");
expect(await A.getByTestId("target-phrase").innerText() === "Hello", "the English target phrase is shown under the panels");
await A.getByRole("button", { name: "Start the lesson" }).click();
expect(await A.locator("video[src*='/isl-classroom/signs/hello.mp4']").count() === 1, "the teacher demonstrates Hello with a real signer's recording");
const ra = await attempt(A); console.log("  verdict:", ra);
expect(/Yes! That’s “Hello”/.test(ra), "a real Hello on camera is recognised as correct");
if (SHOTS) await A.screenshot({ path: `${SHOTS}/classroom-correct.png` });
await A.getByRole("button", { name: "Continue" }).click();
await A.getByRole("group", { name: "Which phrase did you just sign?" }).getByRole("button", { name: "Hello", exact: true }).click();
await A.getByRole("button", { name: "Next sign" }).click();
expect(await A.getByTestId("target-phrase").innerText() === "Good morning", "a correct attempt advances to the next sign (Good morning)");
const prog = await A.evaluate(() => JSON.parse(localStorage.getItem("speakara:isl:progress:v1") ?? "{}"));
expect(prog["english:cls:hello"]?.score === 100, "progress is saved for the recognised sign");
expect(A.errs.length === 0, `no page errors ${A.errs.join(" | ")}`); await A.browser.close();

// 2. Wrong sign for the target (Good Morning video while the target is Hello, Spanish course)
const B = await room(process.env.SIGN_GM, "spanish");
expect(await B.getByTestId("target-phrase").innerText() === "Hola", "the Spanish course shows the Spanish phrase");
expect(/Hello/.test(await B.locator("[data-testid=isl-classroom]").innerText()), "the English meaning is shown");
await B.getByRole("button", { name: "Start the lesson" }).click();
const rb = await attempt(B); console.log("  verdict:", rb);
expect(!/Yes!/.test(rb) && /different sign|not sure|couldn’t see/.test(rb), "a different sign is NOT accepted (marked as a different sign, or uncertain)");
if (SHOTS) await B.screenshot({ path: `${SHOTS}/classroom-incorrect.png` });
await B.getByRole("button", { name: "Skip" }).click();
expect(await B.getByTestId("target-phrase").innerText() === "Buenos días", "skipping moves to the next sign");
await B.waitForFunction(() => /Your turn/.test(document.querySelector("[data-testid=teacher-caption]")?.textContent ?? ""), null, { timeout: 20000 });
await B.getByTestId("try-sign").click();
await B.waitForFunction(() => document.querySelector("[data-testid=isl-classroom]")?.getAttribute("data-phase") === "feedback", null, { timeout: 30000 });
console.log("  detail:", await B.getByTestId("isl-classroom").getAttribute("data-verdict"));
expect(/Yes! That’s “Buenos días”/.test(await caption(B)), "the same real Good Morning IS accepted when it is the target");
expect(B.errs.length === 0, `no page errors ${B.errs.join(" | ")}`); await B.browser.close();

// 3. No camera: the lesson still works, nothing is marked as recognised
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await ctx.addInitScript((s) => { localStorage.setItem("speakara:learner:v1", s); }, seed);
const C = await ctx.newPage(); await C.goto(`${BASE}/learn/isl`, { waitUntil: "networkidle" }); await C.locator("[data-course=english]").click();
await C.getByRole("button", { name: "Start the lesson" }).click();
await C.waitForFunction(() => /Your turn/.test(document.querySelector("[data-testid=teacher-caption]")?.textContent ?? ""), null, { timeout: 20000 });
await C.getByRole("button", { name: "I’ve practised it" }).click();
expect(/Camera checking is off/.test(await caption(C)), "without a camera the teacher says it could not check, instead of claiming a result");
const o = await C.evaluate(() => document.documentElement.scrollWidth - innerWidth); expect(o <= 0, "the classroom fits a 390px phone");
const [t, l] = await Promise.all([C.locator("section[aria-label=Teacher]").boundingBox(), C.locator("section[aria-label=You]").boundingBox()]);
expect(t && l && t.width > 300 && l.width > 300, "on a phone both teacher and learner panels stay full width (stacked)");
if (SHOTS) await C.screenshot({ path: `${SHOTS}/classroom-mobile.png`, fullPage: true });
await b.close();
console.log(failures ? `${failures} FAILED` : "ALL ISL CLASSROOM CHECKS PASSED"); process.exit(failures ? 1 : 0);
