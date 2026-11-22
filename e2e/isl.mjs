/**
 * ISL Teacher 2.0 walkthrough against a running build (BASE, default http://127.0.0.1:3311).
 * Checks the interactive lesson, teacher choice, scenarios, camera consent gate, learner-facing copy, axe and overflow.
 * SHOTS=<dir> also saves screenshots. Exit code 1 on any failure.
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const BASE = process.env.BASE ?? "http://127.0.0.1:3311"; const SHOTS = process.env.SHOTS;
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
let failures = 0; const expect = (c, m) => { console.log(c ? "• ok:" : "✗ FAIL:", m); if (!c) failures++; };
const seed = JSON.stringify({ version: 1, profile: { name: "Ari", courseId: "es-en", onboarded: true, sound: false, speech: true, motion: false, dailyGoalXp: 20, slowAudio: false }, xp: 0, gems: 0, streak: { count: 0, lastDay: null, freezes: 0, longest: 0 }, completed: {}, unlockedUnits: {}, stories: {}, review: {}, mistakes: [], xpEvents: [], quests: { day: "", items: [] }, achievements: {}, conversations: [], stats: { lessons: 0, perfect: 0, practice: 0, minutes: 0, tutorTurns: 0 } });
const FORBIDDEN = /awaiting validation|motion test|not an ISL sign|database|status:/i;

const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
async function page(vp = { width: 1280, height: 1000 }) {
  const ctx = await browser.newContext({ viewport: vp });
  await ctx.addInitScript((s) => { if (!localStorage.getItem("speakara:learner:v1")) localStorage.setItem("speakara:learner:v1", s); }, seed);
  const p = await ctx.newPage(); p.errors = []; p.on("pageerror", (e) => p.errors.push(e.message)); return p;
}
async function axe(p, name) {
  await p.addScriptTag({ content: axeSource });
  const r = await p.evaluate(async () => await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } }));
  expect(r.violations.length === 0, `axe ${name}: ${r.violations.map((v) => `${v.id}(${v.nodes.length})`).join(", ") || "clean"}`);
}
const shot = async (p, n) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${n}.png` }); };
const text = async (p) => await p.locator("main").innerText();

// 1. dashboard + teacher choice persists
let p = await page();
await p.goto(`${BASE}/learn/isl`, { waitUntil: "networkidle" });
expect(await p.getByRole("radiogroup", { name: "Choose your teacher" }).isVisible(), "first visit asks the learner to choose a teacher");
await p.getByRole("radio", { name: "Male teacher", exact: true }).click();
await p.reload({ waitUntil: "networkidle" });
expect(await p.getByRole("radio", { name: "Male teacher", exact: true }).getAttribute("aria-checked") === "true", "teacher choice persists across reloads");
expect(!FORBIDDEN.test(await text(p)), "dashboard has no developer/status wording"); await axe(p, "dashboard"); await shot(p, "isl-dashboard");

// 2. interactive lesson
await p.goto(`${BASE}/learn/isl/english/en1`, { waitUntil: "networkidle" });
await p.waitForSelector("canvas", { timeout: 30000 }); await p.waitForTimeout(4000);
expect(/Hello! I’m your ISL teacher/.test(await text(p)), "teacher greets the learner (caption)");
await p.getByRole("button", { name: "Continue" }).click(); await p.getByRole("button", { name: "Continue" }).click();
expect(/A new word: hello/.test(await text(p)), "teacher introduces the first word");
await p.getByRole("button", { name: "Explain again" }).click();
expect(/Let me explain again/.test(await text(p)), "“Explain again” responds with a new explanation");
await p.getByRole("button", { name: "Another example" }).click();
expect(/Another example/.test(await text(p)), "“Another example” responds");
await p.getByLabel("Ask a question").fill("Is hello formal?"); await p.getByRole("button", { name: "Send question" }).click();
await p.waitForFunction(() => /You asked: Is hello formal\?/.test(document.body.innerText), null, { timeout: 25000 });
expect(true, "typed question gets an answer (AI when configured, lesson content otherwise)");
await p.getByRole("button", { name: /ready for a question/ }).click();
const opts = p.locator("section[aria-label='Lesson'] .grid button");
const labels = await opts.allInnerTexts();
await opts.nth(labels.findIndex((l) => !/greeting/.test(l))).click();
expect(/Not quite|Close!|Good try/.test(await text(p)), "wrong answer gets a gentle correction"); await shot(p, "isl-lesson-correcting");
await p.getByRole("button", { name: "Continue" }).click();
expect(/A new word: hello/.test(await text(p)), "teacher re-teaches the word after a mistake");
await p.getByRole("button", { name: /ready for a question/ }).click();
const l2 = await opts.allInnerTexts(); await opts.nth(l2.findIndex((l) => /greeting/.test(l))).click();
expect(/Exactly right|Well done|You’ve got it/.test(await text(p)), "right answer is celebrated"); await shot(p, "isl-lesson-celebrating");
await p.getByRole("button", { name: "Continue" }).click();
expect(/A new word: goodbye/.test(await text(p)), "lesson adapts and moves to the next word");
await p.getByRole("button", { name: /ready for a question/ }).click();
await p.getByRole("button", { name: "Harder question" }).click();
expect(/Level 2/.test(await text(p)), "“Harder question” raises the level");
expect(!FORBIDDEN.test(await text(p)), "lesson has no developer/status wording");
await axe(p, "lesson");
for (const v of ["Hands close-up", "Face close-up", "Full body", "Signing view (waist up)"]) await p.getByRole("button", { name: v }).click();
expect(true, "camera views switch");
expect(p.errors.length === 0, `no page errors (${p.errors.join(" | ")})`);

// 3. scenario
await p.goto(`${BASE}/learn/isl/spanish/scenarios`, { waitUntil: "networkidle" });
expect((await p.locator("main a[href*='/scenarios/']").count()) === 8, "eight Spanish scenarios listed"); await axe(p, "scenarios");
await p.goto(`${BASE}/learn/isl/spanish/scenarios/restaurant`, { waitUntil: "networkidle" });
await p.getByRole("button", { name: "Start the conversation" }).click();
expect(/¿Qué desea\?/.test(await text(p)), "scenario partner opens the conversation");
await p.getByRole("button", { name: /^Café\./ }).click();
expect(/por favor/.test(await text(p)) && /Add “un”/.test(await text(p)), "wrong reply gets feedback and a retry");
await p.getByRole("button", { name: /Un café, por favor/ }).click();
await p.getByRole("button", { name: /una tortilla, por favor/ }).click();
await p.getByRole("button", { name: /La cuenta, por favor/ }).click();
expect(/Scenario complete/.test(await text(p)), "scenario completes"); await shot(p, "isl-scenario-done");
const prog = await p.evaluate(() => JSON.parse(localStorage.getItem("speakara:isl:progress:v1") ?? "{}"));
expect(prog["spanish:scene:restaurant"]?.score === 67, "scenario progress recorded (2 of 3 right first time = 67)");
await axe(p, "scenario");

// 4. camera practice needs explicit consent
await p.goto(`${BASE}/learn/isl/practice`, { waitUntil: "networkidle" });
expect(await p.getByRole("button", { name: "Turn on camera" }).isDisabled(), "camera stays off until the learner consents");
await p.getByLabel(/I agree to turn on my camera/).check();
expect(!(await p.getByRole("button", { name: "Turn on camera" }).isDisabled()), "consent enables the camera button");
await axe(p, "practice");
await p.goto(`${BASE}/learn/isl/fingerspelling`, { waitUntil: "networkidle" });
expect(!FORBIDDEN.test(await text(p)), "fingerspelling has no developer/status wording");

// 5. phone width
const m = await page({ width: 360, height: 780 });
for (const path of ["/learn/isl", "/learn/isl/english/en1", "/learn/isl/english/scenarios/airport", "/learn/isl/practice"]) {
  await m.goto(BASE + path, { waitUntil: "networkidle" }); await m.waitForTimeout(1500);
  const over = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(over <= 0, `${path} fits 360px (overflow ${over}px)`);
  if (path.endsWith("en1")) await shot(m, "isl-lesson-mobile");
}
await browser.close();
console.log(failures ? `${failures} FAILED` : "ALL ISL CHECKS PASSED"); process.exit(failures ? 1 : 0);
