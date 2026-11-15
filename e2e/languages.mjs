// Browser journeys for the six target languages (desktop, guest mode).
//   node e2e/languages.mjs [baseUrl]            (E2E_LANG=de-en to run one course)
// Shared helpers and the answer solver are the same as e2e/smoke.mjs.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium, devices } = require("playwright");
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const BASE = process.argv[2] ?? "http://localhost:3000";
const SHOTS = process.argv[3]; if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const PASSWORD = process.env.E2E_PASSWORD;
const DUMP = JSON.parse(execSync("npx tsx e2e/dump-content.ts", { encoding: "utf8" }));
let content = DUMP["es-en"];
const toks = (s) => s.replace(/[¿?¡!.,;:"“”।]/g, " ").split(/\s+/).filter(Boolean);
const norm = (s) => toks(s).join(" ").toLowerCase();
const log = (...a) => console.log("•", ...a);
let failures = 0; const errors = []; const a11y = [];
const expect = (cond, msg) => { if (cond) log("ok:", msg); else { failures++; console.error("✗ FAIL:", msg); } };
const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` }); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Replaces speech APIs with stubs that record what was spoken and "hear" the sentence shown on screen. */
const speechStubs = () => {
  window.__spoken = [];
  const synth = { getVoices: () => [{ lang: "es-ES", name: "Stub ES", localService: true }, { lang: "fr-FR", name: "Stub FR", localService: true }, { lang: "en-US", name: "Stub EN", localService: true }], cancel() {}, addEventListener() {}, removeEventListener() {},
    speak(u) { window.__spoken.push({ text: u.text, lang: u.lang, rate: u.rate }); setTimeout(() => u.onend && u.onend(), 5); } };
  Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
  window.SpeechSynthesisUtterance = function (text) { this.text = text; };
  // Chromium ships both the prefixed and unprefixed constructors; the app prefers the unprefixed one.
  window.SpeechRecognition = window.webkitSpeechRecognition = function () {
    this.start = () => setTimeout(() => { const el = document.querySelector("[data-prompt]"); this.onresult && this.onresult({ results: [[{ transcript: (el?.textContent ?? "").replace(/[¿?¡!.,]/g, "") }]] }); this.onend && this.onend(); }, 30);
    this.stop = () => {};
  };
};

async function axe(page, name) {
  await page.addScriptTag({ content: axeSource });
  const r = await page.evaluate(async () => await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } }));
  for (const v of r.violations) { const m = `${name}: ${v.id} (${v.impact}) ×${v.nodes.length} — ${v.nodes[0].target.join(" ")} ${v.nodes[0].any?.[0]?.message ?? ""}`.slice(0, 260); a11y.push(m); log("  ✗ " + m); }
  log(`axe ${name}: ${r.violations.length} violation(s), ${r.passes.length} rules passed`);
}
async function clickTiles(page, answer) {
  for (const tok of toks(answer)) {
    const bank = page.locator("[data-bank] button"); const n = await bank.count(); let hit = false;
    for (let i = 0; i < n; i++) if ((await bank.nth(i).innerText()).toLowerCase() === tok.toLowerCase()) { await bank.nth(i).click(); hit = true; break; }
    if (!hit) throw new Error(`tile “${tok}” missing for “${answer}”`);
  }
}
/** Solves whatever exercise is on screen using selectors that do not depend on the interface language. */
async function solve(page, st) {
  const h1 = page.locator("main h1[data-ex-type]"); await h1.waitFor();
  const type = await h1.getAttribute("data-ex-type"); const instruction = await h1.getAttribute("data-instruction");
  st.types[type] = (st.types[type] ?? 0) + 1;
  const check = page.locator("footer button").last();
  if (type === "match") {
    const left = page.locator("[data-match] [role=group]").first().locator("button"), right = page.locator("[data-match] [role=group]").nth(1).locator("button");
    const n = await left.count();
    for (let i = 0; i < n; i++) { const native = await left.nth(i).innerText(); const ts = content.pairs.filter(([, nn]) => nn === native).map(([tt]) => tt); await left.nth(i).click(); const rn = await right.count(); for (let j = 0; j < rn; j++) if (ts.includes(await right.nth(j).innerText()) && !(await right.nth(j).isDisabled())) { await right.nth(j).click(); break; } }
  } else if (type === "fill") {
    const box = await page.locator("[data-fill]").innerText(); const opts = page.getByRole("radio"); const n = await opts.count();
    const cand = norm(box.replace(/blank|hueco|खाली जगह/gu, " ").replace(/\u00a0/g, " "));
    let picked = false;
    for (let i = 0; i < n && !picked; i++) {
      const o = (await opts.nth(i).innerText()).toLowerCase();
      for (const s of content.sentences) { const w = norm(s.t).split(" "); const k = w.indexOf(o); if (k >= 0 && [...w.slice(0, k), ...w.slice(k + 1)].join(" ") === cand) { await opts.nth(i).click(); picked = true; break; } }
    }
    if (!picked) await opts.nth(0).click();
    await check.click();
  } else if (type === "listen" || type === "dictation") {
    const heard = await page.evaluate(() => window.__spoken?.at(-1)?.text);
    if (!heard) { await page.locator("footer button").first().click(); st.skipped++; return; }
    st.listened++;
    if (type === "listen") await clickTiles(page, heard); else await page.getByRole("textbox").fill(heard);
    await check.click();
  } else if (type === "speak") {
    if (!(await page.evaluate(() => !!window.SpeechRecognition))) { await page.locator("footer button").first().click(); st.skipped++; return; }
    await page.locator("main button.rounded-full").click(); await page.getByText("%").first().waitFor(); st.spoke++;
    await check.click();
  } else {
    const prompt = (await page.locator("[data-prompt]").innerText()).trim();
    if (type === "choose") {
      const pair = content.pairs.find(([t, n]) => t === prompt || n === prompt); const want = instruction === "What does this mean?" ? pair[1] : pair[0];
      const opts = page.getByRole("radio"); const n = await opts.count(); let idx = -1;
      for (let i = 0; i < n; i++) if ((await opts.nth(i).innerText()).replace(/^\d\s*/, "").trim() === want) idx = i;
      if (st.sabotage) { st.sabotage = false; st.wrong++; idx = (idx + 1) % n; }
      await opts.nth(idx).click();
    } else {
      const s = content.sentences.find((x) => x.t === prompt || x.n === prompt); const want = s.t === prompt ? s.n : s.t;
      if (type === "wordbank") await clickTiles(page, want); else await page.getByRole("textbox").fill(want);
    }
    await check.click();
  }
  await page.locator("footer button").last().click();   // Continue
}
async function runSession(page, st, until = "[data-summary]") {
  for (let guard = 0; guard < 80; guard++) {
    if (await page.locator(`${until}, [data-save-error]`).count()) return;
    if (await page.locator("[data-start]").count()) { await page.locator("[data-start]").click(); continue; }
    if (!(await page.locator("main h1[data-ex-type]").count())) { await page.waitForTimeout(150); continue; }
    try { await solve(page, st); } catch (e) { await shot(page, "failure"); log("  stuck on: " + (await page.locator("main").innerText().catch(() => "?")).replace(/\s+/g, " ").slice(0, 300) + " | footer: " + (await page.locator("footer").innerText().catch(() => "none")).replace(/\s+/g, " ")); throw e; }
    await page.waitForTimeout(100);
  }
  throw new Error("session did not finish");
}
const newState = (sabotage = false) => ({ types: {}, skipped: 0, wrong: 0, listened: 0, spoke: 0, sabotage });
function watch(page, label) {
  page.on("pageerror", (e) => errors.push(`${label}: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|net::ERR_FAILED/i.test(m.text())) errors.push(`${label} console: ${m.text().slice(0, 200)}`); });
}
const nextBtn = (page) => page.locator("footer button").click();

// ---------------------------------------------------------------- every target language, end to end (guest, desktop)
// Each language: onboarding → first lesson (every exercise type, one deliberate miss) → summary → reload → switch to
// another course and back → the first course's progress must be unchanged. Listening and speaking use the browser's
// speech engines: where the headless browser has none, the exercise is skipped and reported as skipped, not passed.
const LANGS = [
  ["de-en", "🇩🇪"], ["ko-en", "🇰🇷"], ["it-en", "🇮🇹"], ["ru-en", "🇷🇺"], ["fr-en", "🇫🇷"], ["es-en", "🇪🇸"],
];
const ONLY_LANG = process.env.E2E_LANG;
const browser = await chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
for (const [courseId, flag] of LANGS.filter(([id]) => !ONLY_LANG || id === ONLY_LANG)) {
  content = DUMP[courseId];
  log(`=== ${courseId} ===`);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(speechStubs);
  const page = await ctx.newPage(); watch(page, courseId);
  await page.goto(`${BASE}/onboarding`);
  await page.getByRole("textbox").fill("Tess"); await nextBtn(page);                               // welcome
  await page.getByRole("radio").nth(0).click(); await nextBtn(page);                               // interface: English
  await page.getByRole("radio").filter({ hasText: flag }).click(); await nextBtn(page);            // course
  await page.getByRole("radio").first().click(); await nextBtn(page);                              // goal
  await nextBtn(page); await nextBtn(page); await nextBtn(page);                                   // level, plan, start
  await page.waitForURL(/learn/, { timeout: 20000 });
  await page.locator('[data-state="current"]').waitFor();
  expect(await page.locator('[data-state="current"]').count() === 1, `${courseId}: the first lesson is current`);
  const st = newState(true);
  await page.locator('[data-state="current"]').click();
  await runSession(page, st);
  const xp = Number(await page.locator("[data-summary]").getAttribute("data-xp"));
  expect(xp > 0 && st.wrong === 1, `${courseId}: lesson completed with XP ${xp} and one miss re-asked`);
  expect(Object.keys(st.types).length >= 4, `${courseId}: exercise types answered ${JSON.stringify(st.types)}`);
  await page.goto(`${BASE}/learn`); await page.locator('[data-state="done"]').first().waitFor({ timeout: 15000 });
  await page.reload(); await page.locator('[data-state="done"]').first().waitFor({ timeout: 15000 });
  expect(await page.locator('[data-state="done"]').count() === 1, `${courseId}: completion survives a reload`);
  // switch to another course and back
  const other = courseId === "de-en" ? "🇰🇷" : "🇩🇪";
  await page.goto(`${BASE}/settings`); await page.locator('[role=radio]').filter({ hasText: other }).first().click();
  await page.goto(`${BASE}/learn`); await sleep(500);
  await page.goto(`${BASE}/settings`); await page.locator('[role=radio]').filter({ hasText: flag }).first().click();
  await page.goto(`${BASE}/learn`); await page.locator('[data-state="current"], [data-state="done"]').first().waitFor();
  expect(await page.locator('[data-state="done"]').count() === 1, `${courseId}: returning to the course keeps its progress`);
  await ctx.close();
}
await browser.close();
if (errors.length) { failures += errors.length; console.error("Browser errors:\n" + [...new Set(errors)].join("\n")); }
if (failures) { console.error(`${failures} failure(s)`); process.exit(1); }
console.log("All language checks passed");
