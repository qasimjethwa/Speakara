// Personal Learning Twin acceptance test: two guest learners use the same product and get different experiences.
//   node e2e/twin.mjs [baseUrl] [screenshotDir]
// Both learners answer REAL lessons in the browser; the app grades every answer with its own answer key. Learner A
// deliberately misses sentence-building items (grammar/writing), Learner B misses word-meaning items (vocabulary).
// Nothing about their skills is seeded.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const BASE = process.argv[2] ?? "http://localhost:3000"; const SHOTS = process.argv[3]; if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const content = JSON.parse(execSync("npx tsx e2e/dump-content.ts", { encoding: "utf8" }))["es-en"];
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const toks = (s) => s.replace(/[¿?¡!.,;:"“”।]/g, " ").split(/\s+/).filter(Boolean);
let failures = 0; const expect = (c, m) => { console.log(c ? "• ok:" : "✗ FAIL:", m); if (!c) failures++; };
const shot = async (p, n) => { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${n}.png`, fullPage: true }); };
const seed = (name) => JSON.stringify({ version: 1, profile: { name, username: "", nativeLang: "en", courseId: "es-en", goal: "", level: "new", dailyGoalXp: 20, onboarded: true, sound: false, speech: false, motion: false, createdAt: Date.now(), uiLang: "en", isPublic: false, role: "learner", slowAudio: false, savedPhrases: [] }, xp: 0, gems: 0, streak: { count: 0, lastDay: null, freezes: 0, longest: 0 }, completed: {}, unlockedUnits: {}, stories: {}, review: {}, mistakes: [], xpEvents: [], quests: { day: "", items: [] }, achievements: {}, conversations: [], stats: { lessons: 0, perfect: 0, practice: 0, minutes: 0, tutorTurns: 0 } });

async function tiles(page, answer) {
  for (const tok of toks(answer)) { const bank = page.locator("[data-bank] button"); const n = await bank.count(); for (let i = 0; i < n; i++) if ((await bank.nth(i).innerText()).toLowerCase() === tok.toLowerCase()) { await bank.nth(i).click(); break; } }
}
/** Answers the exercise on screen; `miss(type)` decides whether to answer it wrong on purpose. */
async function solve(page, miss) {
  const h1 = page.locator("main h1[data-ex-type]"); await h1.waitFor();
  const type = await h1.getAttribute("data-ex-type"); const instruction = await h1.getAttribute("data-instruction");
  const check = page.locator("footer button").last();
  // miss only the first time an exercise is seen (the Twin records first attempts; retries must succeed to finish)
  const key = `${type}|${await page.locator("main").innerText().catch(() => "")}`.slice(0, 400);
  const wrong = miss(type) && !page.seen.has(key); page.seen.add(key);
  if (type === "listen" || type === "dictation" || type === "speak") { await page.locator("footer button").first().click(); return; }   // speech off: skipped (not graded)
  if (type === "match") {
    const left = page.locator("[data-match] [role=group]").first().locator("button"), right = page.locator("[data-match] [role=group]").nth(1).locator("button");
    const n = await left.count();
    for (let i = 0; i < n; i++) { const native = await left.nth(i).innerText(); const ts = content.pairs.filter(([, nn]) => nn === native).map(([tt]) => tt);
      if (wrong) { for (let k = 0; k < 3; k++) { await left.nth(i).click(); const rn = await right.count(); for (let j = 0; j < rn; j++) if (!ts.includes(await right.nth(j).innerText()) && !(await right.nth(j).isDisabled())) { await right.nth(j).click(); break; } } }
      await left.nth(i).click(); const rn = await right.count(); for (let j = 0; j < rn; j++) if (ts.includes(await right.nth(j).innerText()) && !(await right.nth(j).isDisabled())) { await right.nth(j).click(); break; } }
  } else if (type === "fill") {
    const opts = page.getByRole("radio"); const n = await opts.count(); const box = (await page.locator("[data-fill]").innerText()).toLowerCase();
    let right = 0; for (let i = 0; i < n; i++) { const o = (await opts.nth(i).innerText()).toLowerCase(); if (content.sentences.some((s) => s.t.toLowerCase().includes(o) && toks(s.t.toLowerCase()).filter((w) => w !== o).every((w) => box.includes(w)))) { right = i; break; } }
    await opts.nth(wrong ? (right + 1) % n : right).click(); await check.click();
  } else {
    const prompt = (await page.locator("[data-prompt]").innerText()).trim();
    if (type === "choose") {
      const pair = content.pairs.find(([t, n]) => t === prompt || n === prompt); const want = instruction === "What does this mean?" ? pair[1] : pair[0];
      const opts = page.getByRole("radio"); const n = await opts.count(); let idx = 0;
      for (let i = 0; i < n; i++) if ((await opts.nth(i).innerText()).replace(/^\d\s*/, "").trim() === want) idx = i;
      await opts.nth(wrong ? (idx + 1) % n : idx).click();
    } else {
      const s = content.sentences.find((x) => x.t === prompt || x.n === prompt); const want = s.t === prompt ? s.n : s.t;
      if (type === "wordbank") { if (wrong) await page.locator("[data-bank] button").first().click(); else await tiles(page, want); }
      else await page.getByRole("textbox").fill(wrong ? "no sé" : want);
    }
    await check.click();
  }
  await page.locator("footer button").last().click();
}
async function lesson(page, href, miss) {
  page.seen = new Set(); await page.goto(BASE + href, { waitUntil: "networkidle" });
  for (const end = Date.now() + 120000; Date.now() < end;) {
    if (await page.locator("[data-summary]").count()) return;
    if (await page.locator("[data-start]").count()) { await page.locator("[data-start]").click(); continue; }
    if (!(await page.locator("main h1[data-ex-type]").count())) { await page.waitForTimeout(150); continue; }
    await solve(page, miss); await page.waitForTimeout(80);
  }
  throw new Error("lesson did not finish");
}
async function learner(browser, name) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript((s) => { if (!localStorage.getItem("speakara:learner:v1")) localStorage.setItem("speakara:learner:v1", s); }, seed(name));
  const p = await ctx.newPage(); p.seen = new Set(); p.errs = []; p.on("pageerror", (e) => p.errs.push(e.message)); return p;
}
async function setup(p, answers) {
  await p.goto(`${BASE}/profile/learning-twin/setup`, { waitUntil: "networkidle" });
  // "@Label" picks the topic chip when a goal button has the same name
  for (const label of answers.buttons) { const b = p.getByRole("button", { name: label.replace(/^@/, ""), exact: true }); await (label.startsWith("@") ? b.last() : b.first()).click(); }
  await p.getByRole("slider").fill(String(answers.speaking));
  await p.getByRole("button", { name: "Save", exact: true }).click(); await p.waitForURL(/learning-twin$/);
}
const recIds = async (p) => p.locator("[data-testid=next-best-step] [data-rec]").evaluateAll((els) => els.map((e) => e.getAttribute("data-rec")));
const events = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("speakara:twin:v1:guest") ?? '{"events":[]}').events ?? []);
async function enable(p) {
  await p.goto(`${BASE}/profile/learning-twin`, { waitUntil: "networkidle" });
  const on = p.getByRole("button", { name: "Turn on personalised learning" });
  expect(await on.isDisabled(), "turning it on needs the consent box ticked first");
  await p.getByLabel(/I agree to Speakara using my exercise results/).check(); await on.click();
  await p.locator("[data-testid=twin-status][data-on=true]").waitFor();
}
const bandOf = async (p, skill) => p.locator(`[data-skill=${skill}]`).getAttribute("data-band");

const browser = await chromium.launch();
const A = await learner(browser, "Asha"), B = await learner(browser, "Ben");

// 0. default: the original Learn experience, personalisation OFF until the learner consents
await A.goto(`${BASE}/learn`, { waitUntil: "networkidle" });
expect(await A.locator("[data-testid=next-best-step]").count() === 0, "the Learn path has no recommendation panel (original layout)");
expect(await A.locator("main a[href='/learn/isl']").count() === 0 && await A.locator("main a[href^='/lesson']").count() > 0, "the course path and lessons are shown; no ISL box on the Learn tab");
const btn = A.getByTestId("learning-companion-button"); const bb = await btn.boundingBox(); const mb = await A.locator("main").boundingBox();
expect(bb && mb && bb.x + bb.width > mb.x + mb.width * 0.6 && bb.y < mb.y + 140, "a small Learning Companion button sits in the top-right of the Learn page");
await shot(A, "learn-default");
await btn.click(); await A.waitForURL(/learning-twin$/);
expect(await A.locator("[data-testid=twin-status][data-on=false]").count() === 1, "the button opens the Personal Learning Twin page, off by default");
expect(await A.locator("#map-title").count() === 0, "while off, no personalised learning map is shown");
await shot(A, "twin-off");
await lesson(A, "/lesson?lesson=es1.1", () => false);
expect((await events(A)).length === 0, "while off (no consent yet), no learning events are recorded");
const t0 = await A.evaluate(() => JSON.parse(localStorage.getItem("speakara:learner:v1")));
expect(t0.xp > 0 && Object.keys(t0.completed).length === 1, "lessons, XP and progress work normally while it is off");
await enable(A); await enable(B);
await shot(A, "twin-on");

// 1–2. different goals and preferences (through the real onboarding form)
await setup(A, { buttons: ["I know a little", "Travel", "Explanations first, then practice", "Detailed corrections", "@Travel"], speaking: 4 });
await setup(B, { buttons: ["Completely new", "Family and friends", "Visual: pictures, cards and matching", "Gentle corrections", "Food", "Meeting people"], speaking: 1 });
expect(/travel/i.test(await A.locator("#you-title").locator("xpath=../..").innerText()), "Asha’s stated goal is saved and shown");

// 3. the optional starting check is offered to someone with no measured answers
expect((await recIds(A))[0] === "diagnostic", "with no measured answers, the first suggestion is the optional starting check");

// 4. real exercise performance: A misses sentence building, B misses word meaning
const firstLessons = ["es1.1", "es1.2"];
for (const id of [firstLessons[0], firstLessons[0], firstLessons[1] ?? firstLessons[0]]) {
  await lesson(A, `/lesson?lesson=${id}`, (t) => ["wordbank", "translate", "fill"].includes(t));
  await lesson(B, `/lesson?lesson=${id}`, (t) => ["choose", "match"].includes(t));
}
const evA = await A.evaluate(() => JSON.parse(localStorage.getItem("speakara:twin:v1:guest")).events), evB = await B.evaluate(() => JSON.parse(localStorage.getItem("speakara:twin:v1:guest")).events);
expect(evA.length >= 20 && evB.length >= 20, `real answers were graded and recorded (Asha ${evA.length}, Ben ${evB.length})`);
expect(evA.filter((e) => e.skill === "grammar" && !e.correct).length > 0 && evA.filter((e) => e.skill === "vocabulary").every((e) => e.correct), "Asha’s misses are recorded under grammar, her vocabulary answers are right");
expect(evB.filter((e) => e.skill === "vocabulary" && !e.correct).length > 0 && evB.filter((e) => e.skill === "grammar").every((e) => e.correct), "Ben’s misses are recorded under vocabulary, his grammar answers are right");

// 5 + 9. different skill profiles / learning maps
await A.goto(`${BASE}/profile/learning-twin`, { waitUntil: "networkidle" }); await B.goto(`${BASE}/profile/learning-twin`, { waitUntil: "networkidle" });
const [ag, av, bg, bv] = [await bandOf(A, "grammar"), await bandOf(A, "vocabulary"), await bandOf(B, "grammar"), await bandOf(B, "vocabulary")];
expect(ag === "needs work" && bv === "needs work", `weak areas measured: Asha grammar=${ag}, Ben vocabulary=${bv}`);
expect(["strength", "steady"].includes(av) && ["strength", "steady"].includes(bg), `strengths measured: Asha vocabulary=${av}, Ben grammar=${bg}`);
expect(/Measured: \d+ of \d+ answers right/.test(await A.locator("[data-skill=grammar]").innerText()), "every estimate shows its underlying measurement");
await shot(A, "twin-asha"); await shot(B, "twin-ben");

// 6 + 8. different next steps and revision, each with a reason
const ra = await recIds(A), rb = await recIds(B);
console.log("  Asha:", ra.join(", ")); console.log("  Ben: ", rb.join(", "));
expect(ra.includes("weak-grammar") && !ra.includes("weak-vocabulary"), "Asha is sent to targeted grammar practice");
expect(rb.includes("weak-vocabulary") && !rb.includes("weak-grammar"), "Ben is sent to vocabulary practice");
expect(JSON.stringify(ra) !== JSON.stringify(rb), "the two learners get different learning paths");
expect(/Recommended because you got \d+ of \d+ grammar/i.test(await A.locator("[data-testid=next-best-step]").innerText()), "Asha’s grammar suggestion explains itself with her real numbers");
await A.goto(`${BASE}/learn`, { waitUntil: "networkidle" }); expect(await A.locator("[data-testid=next-best-step]").count() === 0 && await A.getByTestId("learning-companion-button").count() === 1, "even when on, the Learn path keeps its original layout");

// 7. different AI teaching instructions (the tutor request carries the Twin's brief)
async function tutorLevel(p) {
  let body = null; p.on("request", (r) => { if (r.url().endsWith("/api/tutor") && r.method() === "POST") body = r.postDataJSON(); });
  await p.goto(`${BASE}/tutor?scenario=restaurant`, { waitUntil: "networkidle" }); for (let i = 0; i < 40 && !body; i++) await p.waitForTimeout(150);
  return body?.level ?? "";
}
const la = await tutorLevel(A), lb = await tutorLevel(B);
console.log("  tutor brief A:", la.slice(0, 160)); console.log("  tutor brief B:", lb.slice(0, 160));
expect(/grammar/i.test(la) && /in detail/i.test(la), "Asha’s tutor is told grammar is weaker and to correct in detail");
expect(/vocabulary/i.test(lb) && /gently/i.test(lb) && /speaking feels hard/i.test(lb), "Ben’s tutor is told vocabulary is weaker, to correct gently and keep speaking easy");

// community: private plan differs, stories and roleplays reordered by interest
await A.goto(`${BASE}/live/community`, { waitUntil: "networkidle" }); await B.goto(`${BASE}/live/community`, { waitUntil: "networkidle" });
const pa = await A.locator("[data-testid=conversation-plan]").innerText().catch(() => ""), pb = await B.locator("[data-testid=conversation-plan]").innerText().catch(() => "");
expect(pa && pb && pa !== pb && /trip|visit/i.test(pa) && /dishes|restaurant|Introduce/i.test(pb), "each learner gets a private conversation plan matching their interests");

// 10. edit and reset preferences; switch personalisation off
await B.goto(`${BASE}/profile/learning-twin`, { waitUntil: "networkidle" });
await B.getByRole("button", { name: "Reset preferences" }).click(); await B.getByRole("button", { name: "Reset", exact: true }).click();
expect(/preferences were reset/i.test(await B.locator("main").innerText()), "preferences can be reset");
expect(await bandOf(B, "vocabulary") === "needs work", "resetting preferences keeps measured skills (they are separate)");
await B.getByRole("button", { name: "Turn off" }).click(); await B.locator("[data-testid=twin-status][data-on=false]").waitFor();
expect(await B.locator("[data-testid=next-best-step] [data-rec]").count() === 0, "turning personalisation off removes recommendations");
const lbOff = await tutorLevel(B);
expect(!/vocabulary|gently|speaking feels hard/i.test(lbOff), `with it off the tutor gets no learning context: "${lbOff.slice(0, 80)}"`);
await B.goto(`${BASE}/live/community`, { waitUntil: "networkidle" }); expect(await B.locator("[data-testid=conversation-plan]").count() === 0, "with it off there is no personalised conversation plan");
await B.goto(`${BASE}/profile/learning-twin`, { waitUntil: "networkidle" });
const before = (await B.evaluate(() => JSON.parse(localStorage.getItem("speakara:twin:v1:guest")).events)).length;
await lesson(B, `/lesson?lesson=${firstLessons[0]}`, () => false);
expect((await B.evaluate(() => JSON.parse(localStorage.getItem("speakara:twin:v1:guest")).events)).length === before, "with personalisation off, no learning events are recorded");
await enable(B); expect(await bandOf(B, "vocabulary") === "needs work", "it can be turned on again; the earlier measurements are still there");
await B.getByRole("button", { name: "Delete learning history" }).click(); await B.getByRole("button", { name: "Delete", exact: true }).click();
expect(await bandOf(B, "vocabulary") === "unknown", "learning history can be deleted");

// 11. guest progress still works: the course progress (XP, completions) is untouched by the Twin
const st = await A.evaluate(() => JSON.parse(localStorage.getItem("speakara:learner:v1")));
expect(st.xp > 0 && Object.keys(st.completed).length >= 1, "existing guest progress (XP, completed lessons) is saved as before");

// sidebar entry + AI coach panel (without a Gemini key it must fall back to the rule-based reason)
await A.goto(`${BASE}/learn`, { waitUntil: "networkidle" });
await A.locator("nav").getByRole("link", { name: "Learning companion" }).first().click(); await A.waitForURL(/learning-twin$/);
expect(true, "the sidebar has a Learning companion entry that opens the dashboard");
await A.getByRole("button", { name: "Explain my next step" }).click();
await A.waitForFunction(() => { const t = document.querySelector("[data-testid=companion-coach] [aria-live]")?.textContent ?? ""; return t.length > 0 && !/Thinking/.test(t); }, null, { timeout: 25000 });
const coach = await A.locator("[data-testid=companion-coach]").innerText();
expect(/Recommended because|\w{20,}/.test(coach), "the AI coach answers, or falls back to the rule-based reason when AI is unavailable");

// accessibility of the new pages
for (const [p, path] of [[A, "/profile/learning-twin"], [B, "/profile/learning-twin"], [A, "/profile/learning-twin/setup"]]) {
  await p.goto(BASE + path, { waitUntil: "networkidle" }); await p.addScriptTag({ content: axeSource });
  const r = await p.evaluate(async () => await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } }));
  expect(r.violations.length === 0, `axe ${path}: ${r.violations.map((v) => v.id + " " + v.nodes.map((n) => n.html.slice(0, 90)).join(" / ")).join(", ") || "clean"}`);
}
const mctx = await browser.newContext({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });
await mctx.addInitScript((x) => { if (!localStorage.getItem("speakara:learner:v1")) localStorage.setItem("speakara:learner:v1", x); }, seed("Mia"));
const m = await mctx.newPage();
await m.goto(`${BASE}/learn`, { waitUntil: "networkidle" }); expect(await m.getByTestId("learning-companion-button").isVisible(), "the Learning Companion button is visible on a 360px phone"); await shot(m, "learn-mobile");
await m.goto(`${BASE}/profile/learning-twin`, { waitUntil: "networkidle" }); await shot(m, "twin-off-mobile");
for (const path of ["/learn", "/profile/learning-twin", "/profile/learning-twin/setup"]) { await m.goto(BASE + path, { waitUntil: "networkidle" }); const o = await m.evaluate(() => document.documentElement.scrollWidth - innerWidth); expect(o <= 0, `${path} fits 360px`); }
expect(A.errs.length + B.errs.length === 0, `no page errors ${[...A.errs, ...B.errs].join(" | ")}`);
await browser.close();
console.log(failures ? `${failures} FAILED` : "ALL LEARNING TWIN CHECKS PASSED"); process.exit(failures ? 1 : 0);
