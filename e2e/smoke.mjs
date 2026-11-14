// End-to-end smoke test of the real learner workflow in guest mode.
// Usage: npm run build && npm start (port 3000), then: node e2e/smoke.mjs [baseUrl] [screenshotDir]
import { createRequire } from "node:module";
// Resolved with require so a globally installed Playwright (NODE_PATH) works without adding a dependency.
const { chromium, devices } = createRequire(import.meta.url)("playwright");
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3000";
const SHOTS = process.argv[3]; if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const content = JSON.parse(execSync("npx tsx e2e/dump-content.ts", { encoding: "utf8" }))["es-en"];
const toks = (s) => s.replace(/[¿?¡!.,;:"“”।]/g, " ").split(/\s+/).filter(Boolean);
const norm = (s) => toks(s).join(" ").toLowerCase();
const log = (...a) => console.log("•", ...a);
let failures = 0;
const expect = (cond, msg) => { if (cond) log("ok:", msg); else { failures++; console.error("✗ FAIL:", msg); } };
const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` }); };

async function clickTiles(page, answer) {
  for (const tok of toks(answer)) {
    const bank = page.locator('[aria-label="Word bank"] button');
    const n = await bank.count(); let hit = false;
    for (let i = 0; i < n; i++) if ((await bank.nth(i).innerText()).toLowerCase() === tok.toLowerCase()) { await bank.nth(i).click(); hit = true; break; }
    if (!hit) throw new Error(`tile “${tok}” missing for “${answer}”`);
  }
}
/** Solves whatever exercise is on screen. `sabotage` answers one multiple-choice item wrongly on purpose. */
async function solve(page, state) {
  const title = await page.locator("main h1").innerText();
  const seen = (state.types[title.replace(/^Let’s try again\s*/, "")] ??= 0); state.types[title.replace(/^Let’s try again\s*/, "")] = seen + 1;
  if (/Tap what you hear|Speak this sentence/.test(title)) { await page.getByRole("button", { name: /Can’t (listen|speak) now/ }).click(); state.skipped++; return; }
  if (/Tap the matching pairs/.test(title)) {
    const left = page.locator("main .grid > div").first().locator("button"); const right = page.locator("main .grid > div").nth(1).locator("button");
    const n = await left.count();
    for (let i = 0; i < n; i++) { const native = await left.nth(i).innerText(); const t = content.pairs.find(([, nn]) => nn === native)[0]; await left.nth(i).click(); await right.filter({ hasText: new RegExp(`^${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) }).first().click(); }
  } else if (/Fill in the blank/.test(title)) {
    const box = await page.locator('main [lang]').first().innerText(); const opts = page.getByRole("radio"); const n = await opts.count();
    for (let i = 0; i < n; i++) { const o = await opts.nth(i).innerText(); const candidate = norm(box.split("\n")[0].replace(/_+/, o)); if (content.sentences.some((s) => norm(s.t) === candidate)) { await opts.nth(i).click(); break; } }
    await page.getByRole("button", { name: "Check" }).click();
  } else {
    const prompt = (await page.locator("main .relative.mb-4 span").last().innerText()).trim();
    if (/What does this mean|How do you say/.test(title)) {
      const pair = content.pairs.find(([t, n]) => t === prompt || n === prompt); const want = pair[0] === prompt ? pair[1] : pair[0];
      const opts = page.getByRole("radio"); const n = await opts.count(); let idx = -1;
      for (let i = 0; i < n; i++) if ((await opts.nth(i).innerText()).replace(/^\d\s*/, "").trim() === want) idx = i;
      if (state.sabotage) { state.sabotage = false; state.wrong++; idx = (idx + 1) % n; }
      await opts.nth(idx).click();
    } else {
      const s = content.sentences.find((x) => x.t === prompt || x.n === prompt); const want = s.t === prompt ? s.n : s.t;
      if (/Translate this sentence/.test(title)) await clickTiles(page, want); else await page.getByRole("textbox").fill(want);
    }
    await page.getByRole("button", { name: "Check" }).click();
  }
  await page.getByRole("button", { name: "Continue" }).click();
}
async function runSession(page, state) {
  for (let guard = 0; guard < 60; guard++) {
    if (await page.getByRole("heading", { name: /session|Perfect|Not yet/i }).count() || await page.getByText(/Placement done/).count()) return;
    await page.locator("main h1").waitFor(); await solve(page, state); await page.waitForTimeout(120);
  }
  throw new Error("session did not finish");
}

const browser = await chromium.launch();
const errors = [];
for (const [label, ctxOpts] of [["desktop", { viewport: { width: 1440, height: 900 } }], ["mobile", { ...devices["Pixel 7"] }]]) {
  const ctx = await browser.newContext(ctxOpts); const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${label}: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !/speech|Failed to load resource/i.test(m.text())) errors.push(`${label} console: ${m.text()}`); });
  log(`=== ${label} ===`);
  await page.goto(BASE); await shot(page, `${label}-01-landing`);
  expect(await page.getByRole("heading", { level: 1 }).innerText().then((t) => /free/i.test(t)), "landing page renders");
  await page.getByRole("link", { name: "Get started" }).first().click(); await page.waitForURL(/signup/);
  await page.getByRole("link", { name: /Start as a guest/ }).click(); await page.waitForURL(/onboarding/);
  await page.getByLabel("What should I call you?").fill("Tess"); await shot(page, `${label}-02-onboarding`);
  const next = () => page.locator("footer button").click();
  await next(); await next(); await next();                                   // welcome → native → course
  await page.getByRole("radio", { name: /Travel/ }).click(); await next();     // goal
  if (label === "desktop") {
    await page.getByRole("radio", { name: /I know some/ }).click(); await next();
    const st = { types: {}, skipped: 0, wrong: 0, sabotage: false }; await runSession(page, st);   // placement test, all correct
    expect(await page.getByText(/you start at Unit 3/).count() === 1, "placement test with 100% places learner in Unit 3");
  } else await next();
  await next(); await shot(page, `${label}-03-plan`); await next(); await page.waitForURL(/learn/);
  await page.getByRole("heading", { name: /Unit 1/ }).waitFor(); await shot(page, `${label}-04-path`);
  expect(await page.getByRole("link", { name: /Hello and thanks \(start\)/ }).count() === 1, "path shows first lesson as current");
  if (label === "mobile") expect(await page.getByRole("img", { name: /Your name \(locked\)/ }).count() === 1, "later lessons are locked for a new learner");

  await page.getByRole("link", { name: /Hello and thanks/ }).click();
  const st = { types: {}, skipped: 0, wrong: 0, sabotage: true };
  await page.locator("main h1").waitFor(); await shot(page, `${label}-05-exercise`);
  await runSession(page, st); await shot(page, `${label}-06-summary`);
  log("exercise screens seen:", JSON.stringify(st.types));
  expect(Object.keys(st.types).length >= 6, "lesson mixed at least 6 exercise prompts/types");
  expect(st.types["What does this mean?"] >= 3, "a wrong answer was re-queued and asked again");
  expect(await page.getByText("+15").count() >= 1, "summary shows +15 XP (10 base + 5 first time, not perfect)");
  if (label === "mobile") expect(await page.getByText(/1-day streak/).count() === 1, "streak started"); // on desktop the placement test already started it
  await page.getByRole("link", { name: "Continue" }).click(); await page.waitForURL(/learn/);
  expect(await page.getByRole("link", { name: /Hello and thanks \(completed/ }).count() === 1, "lesson marked complete on the path");
  expect(await page.getByRole("link", { name: /Times of day \(start\)/ }).count() === 1, "next lesson unlocked");

  await page.reload(); await page.getByRole("heading", { name: /Unit 1/ }).waitFor();
  expect(await page.getByRole("link", { name: /Hello and thanks \(completed/ }).count() === 1, "progress persists across reload");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("speakara:learner:v1")));
  expect(saved.xp === (label === "desktop" ? 35 : 15 /* desktop: +20 from a perfect placement test */) && saved.streak.count === 1 && Object.keys(saved.review).length >= 5 && saved.mistakes.length === 0, `stored learner model is consistent (xp ${saved.xp}, ${Object.keys(saved.review).length} words)`);

  await page.goto(`${BASE}/practice`); await shot(page, `${label}-07-practice`);
  await page.getByRole("link", { name: /Smart review/ }).click(); await runSession(page, { types: {}, skipped: 0, wrong: 0, sabotage: false });
  expect(await page.getByText(/Perfect session/).count() === 1, "practice session completes");
  await page.goto(`${BASE}/vocabulary`); await page.getByRole("heading", { name: "Vocabulary notebook" }).waitFor(); await shot(page, `${label}-08-vocabulary`);
  expect(await page.locator("ul.divide-y-2 > li").count() >= 5, "vocabulary notebook lists met words");
  await page.goto(`${BASE}/guidebook?unit=es1`); expect(await page.getByText("Two question marks").count() === 1, "guidebook shows unit tips");

  await page.goto(`${BASE}/tutor`); await page.getByRole("button", { name: /Restaurant/ }).click();
  await page.getByText(/Una mesa para dos/).waitFor(); await page.getByRole("textbox").fill("xyz"); await page.getByRole("button", { name: "Send" }).click();
  await page.getByText(/Try answering with something like/).waitFor();
  await page.getByRole("textbox").fill("Sí, una mesa para dos, por favor"); await page.getByRole("button", { name: "Send" }).click();
  await page.getByText(/Qué quiere comer/).waitFor(); await shot(page, `${label}-09-tutor`);
  log("ok: scripted tutor coached on a miss and advanced on a good reply");
  await page.getByRole("button", { name: "Back to scenarios" }).click();
  expect(await page.getByRole("button", { name: /Airport/ }).isDisabled(), "AI-only scenario is disabled (not a dead button) without a provider");
  expect(await page.getByText("Conversation history").count() === 1, "conversation transcript saved");

  await page.goto(`${BASE}/leaderboard`); await page.getByText(/practice bot/).first().waitFor(); await shot(page, `${label}-10-leaderboard`);
  expect(await page.getByText(/Tess \(you\)/).count() === 1, "leaderboard shows the learner among labelled bots");
  await page.goto(`${BASE}/quests`); await page.getByRole("heading", { name: /Today’s quests/ }).waitFor(); await shot(page, `${label}-11-quests`);
  expect(await page.getByText("First steps").count() === 1, "achievements listed");
  await page.goto(`${BASE}/profile`); await page.getByRole("heading", { name: "Statistics" }).waitFor(); await shot(page, `${label}-12-profile`);
  await page.goto(`${BASE}/stories`); expect(await page.getByText(/Finish Unit 1 to open/).count() === 1, "story locked until its unit is complete");
  if (label === "desktop") {
    await page.goto(`${BASE}/story?id=es3-story`); await page.getByRole("heading", { name: "Una mesa para dos" }).waitFor();
    for (let i = 0; i < 30 && !(await page.getByRole("button", { name: "Finish story" }).count()); i++) {
      const q = page.locator("fieldset").last();
      if (await page.getByRole("button", { name: "Answer to continue" }).count()) { const answers = { "What does Ana order to drink?": "Water", "How does Luis take his coffee?": "Without sugar", "What does Ana ask for at the end?": "The check" }; const prompt = await q.locator("legend").innerText(); await q.getByRole("button", { name: answers[prompt], exact: true }).click(); }
      else await page.getByRole("button", { name: "Continue" }).click();
      await page.waitForTimeout(80);
    }
    await shot(page, `${label}-13-story`); await page.getByRole("button", { name: "Finish story" }).click();
    expect(await page.getByText("+17").count() >= 1, "story awards 12 + 5 perfect XP");
    await page.goto(`${BASE}/settings`); await page.getByRole("radio", { name: /French/ }).click(); await page.goto(`${BASE}/learn`);
    expect(await page.getByText(/starter course with one reviewed unit/).count() === 1, "switching course shows the French starter path");
  }
  await ctx.close();
}
await browser.close();
if (errors.length) { failures += errors.length; console.error("Browser errors:\n" + [...new Set(errors)].join("\n")); }
console.log(failures ? `\n${failures} failure(s)` : "\nAll end-to-end checks passed");
process.exit(failures ? 1 : 0);
