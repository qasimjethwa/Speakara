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
  const synth = { getVoices: () => [{ lang: "es-ES", name: "Stub ES", localService: true }, { lang: "fr-FR", name: "Stub FR", localService: true }, { lang: "en-US", name: "Stub EN", localService: true }, ...(window.__noVoices ?? []).length ? [] : ["de-DE", "ko-KR", "it-IT", "ru-RU"].map((lang) => ({ lang, name: "Stub " + lang, localService: true }))], cancel() {}, resume() {}, addEventListener() {}, removeEventListener() {},
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
  if (globalThis.AUDIT) await globalThis.AUDIT(page);
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

// ---------------------------------------------------------------- responsive audit (E2E_AUDIT=1)
//   E2E_AUDIT=1 node e2e/languages.mjs [baseUrl] [screenshotDir]
// Twelve viewports. On every screen: horizontal overflow, elements past the right edge, small touch targets on touch
// sizes, console errors; in lessons, whether the fixed footer covers any control once scrolled to the end.
if (process.env.E2E_AUDIT) {
  const VIEWPORTS = [[1280, 800], [1366, 768], [1440, 900], [1920, 1080], [768, 1024], [820, 1180], [1024, 768], [320, 720], [360, 800], [375, 812], [390, 844], [430, 932]];
  const only = process.env.E2E_VIEWPORT; const findings = [];
  const browser = await chromium.launch();
  for (const [w, h] of VIEWPORTS.filter(([vw]) => !only || String(vw) === only)) {
    const tag = `${w}x${h}`; const touch = w < 1024; const before = findings.length;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: w < 768 });
    await ctx.addInitScript(speechStubs);
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", (e) => errs.push(e.message)); page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 160)); });
    const inspect = async (name, opts = {}) => {
      await page.waitForTimeout(350);
      const r = await page.evaluate(({ touch, lesson }) => {
        const vw = document.documentElement.clientWidth; const out = { overflow: document.documentElement.scrollWidth - vw, past: [], small: [], covered: [] };
        const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
        const desc = (e) => `${e.tagName.toLowerCase()}${e.className && typeof e.className === "string" ? "." + e.className.split(" ").slice(0, 2).join(".") : ""} “${(e.innerText || e.getAttribute("aria-label") || "").slice(0, 28).replace(/\n/g, " ")}”`;
        for (const e of document.querySelectorAll("body *")) { if (!vis(e)) continue; const r = e.getBoundingClientRect(); if (r.right > vw + 1 && r.left < vw && !e.closest(".sr-only") && getComputedStyle(e).position !== "fixed") { if (![...out.past].some((x) => x === desc(e))) out.past.push(desc(e)); } }
        if (touch) for (const e of document.querySelectorAll("a, button, input, textarea, [role=radio], [role=switch]")) { if (!vis(e) || e.closest(".sr-only") || e.classList.contains("sr-only-focusable")) continue; const r = e.getBoundingClientRect(); if (r.height < 40 || r.width < 40) { const inline = e.tagName === "A" && getComputedStyle(e).display === "inline"; if (!inline) out.small.push(`${desc(e)} ${Math.round(r.width)}×${Math.round(r.height)}`); } }
        if (lesson) { const f = document.querySelector("footer"); if (f) { window.scrollTo(0, document.documentElement.scrollHeight); const fr = f.getBoundingClientRect(); for (const e of document.querySelectorAll("main button, main input, main textarea, main [data-prompt], main h1, main audio")) { if (!vis(e)) continue; const r = e.getBoundingClientRect(); if (r.bottom > fr.top + 1 && r.top < fr.bottom) out.covered.push(desc(e)); } window.scrollTo(0, 0); } }
        return out;
      }, { touch, lesson: !!opts.lesson });
      if (r.overflow > 1) findings.push(`${tag} ${name}: horizontal scroll +${r.overflow}px — ${r.past.slice(0, 3).join("; ")}`);
      else if (r.past.length) findings.push(`${tag} ${name}: clipped past right edge — ${r.past.slice(0, 3).join("; ")}`);
      if (r.small.length) findings.push(`${tag} ${name}: small touch targets — ${[...new Set(r.small)].slice(0, 4).join("; ")}`);
      if (r.covered.length) findings.push(`${tag} ${name}: footer covers — ${[...new Set(r.covered)].slice(0, 4).join("; ")}`);
      if (SHOTS && opts.shot !== false) await page.screenshot({ path: `${SHOTS}/${tag}-${name}.png` });
    };
    const seen = new Set();
    globalThis.AUDIT = async (pg) => { const type = await pg.locator("main h1[data-ex-type]").getAttribute("data-ex-type"); await inspect(`lesson-${type}`, { lesson: true, shot: !seen.has(type) }); seen.add(type); };
    try {
      await page.goto(BASE); await page.locator("h1").waitFor(); await inspect("home");
      for (const r of ["login", "signup"]) { await page.goto(`${BASE}/${r}`); await page.locator("h1").first().waitFor(); await inspect(r); }
      await page.goto(`${BASE}/onboarding`); await page.getByRole("textbox").fill("Tess"); await inspect("onboarding-welcome"); await nextBtn(page);
      await inspect("onboarding-language"); await page.getByRole("radio").nth(0).click(); await nextBtn(page);
      await page.locator('[data-course="es-en"]').click(); await inspect("onboarding-course", { lesson: true }); await nextBtn(page);
      await page.getByRole("radio").first().click(); await inspect("onboarding-goal", { lesson: true }); await nextBtn(page);
      await nextBtn(page); await nextBtn(page); await nextBtn(page); await page.waitForURL(/learn/, { timeout: 20000 });
      await page.locator('[data-state="current"]').waitFor(); await inspect("path");
      content = DUMP["es-en"]; const st = newState(true);
      await page.locator('[data-state="current"]').click(); await page.locator("[data-start]").waitFor(); await inspect("lesson-intro", { lesson: true });
      await runSession(page, st); await inspect("lesson-summary");
      for (const r of ["learn", "practice", "vocabulary", "stories", "tutor", "profile", "settings", "quests", "leaderboard", "guidebook?unit=es1"]) {
        await page.goto(`${BASE}/${r}`); await page.locator("main h1, main h2").first().waitFor({ timeout: 15000 }); await inspect(r.split("?")[0]);
      }
      await page.goto(`${BASE}/tutor`); await page.locator("main .grid button:not([disabled])").first().click(); await page.locator("input").waitFor(); await inspect("tutor-chat", { lesson: true });
    } catch (e) { findings.push(`${tag}: journey stopped — ${String(e.message).split("\n")[0].slice(0, 160)}`); if (SHOTS) await page.screenshot({ path: `${SHOTS}/${tag}-STOPPED.png` }).catch(() => {}); }
    for (const e of new Set(errs)) findings.push(`${tag}: console — ${e}`);
    log(`${tag}: ${findings.length - before} finding(s); exercise types seen: ${[...seen].join(", ")}`);
    await ctx.close();
  }
  await browser.close();
  console.log(findings.length ? "FINDINGS\n" + findings.join("\n") : "No findings at any viewport");
  process.exit(findings.length ? 1 : 0);
}

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
  await page.locator(`[data-course="${courseId}"]`).click(); await nextBtn(page);                  // course
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
  expect(st.listened >= 2 && st.spoke >= 1 && st.skipped === 0, `${courseId}: listening and speaking answered with the ${courseId.slice(0, 2)} voice and recogniser (not skipped)`);
  const spoken = await page.evaluate(() => window.__spoken); const locale = { de: "de-DE", ko: "ko-KR", it: "it-IT", ru: "ru-RU", fr: "fr-FR", es: "es-ES" }[courseId.slice(0, 2)];
  expect(spoken.length >= 3 && spoken.every((x) => x.lang === locale), `${courseId}: text-to-speech requested ${spoken.length} times, always as ${locale}`);
  const fx = await page.evaluate(() => [...window.__sfx]);
  expect(fx.includes("tap") && fx.includes("correct") && fx.filter((x) => x === "wrong").length >= 1 && fx.filter((x) => x === "finish").length === 1 && fx.at(-1) === "finish", `${courseId}: sound effects fired — tap, correct, wrong, and one finish at the end (${fx.length} in total)`);
  await page.goto(`${BASE}/learn`); await page.locator('[data-state="done"]').first().waitFor({ timeout: 15000 });
  await page.reload(); await page.locator('[data-state="done"]').first().waitFor({ timeout: 15000 });
  expect(await page.locator('[data-state="done"]').count() === 1, `${courseId}: completion survives a reload`);
  // switch to another course and back
  const otherId = courseId === "de-en" ? "ko-en" : "de-en";
  await page.goto(`${BASE}/settings`); await page.locator(`[data-course="${otherId}"]`).click();
  await page.goto(`${BASE}/learn`); await sleep(500);
  await page.goto(`${BASE}/settings`); await page.locator(`[data-course="${courseId}"]`).click();
  await page.goto(`${BASE}/learn`); await page.locator('[data-state="current"], [data-state="done"]').first().waitFor();
  expect(await page.locator('[data-state="done"]').count() === 1, `${courseId}: returning to the course keeps its progress`);
  await ctx.close();
}
if (!ONLY_LANG || ONLY_LANG === "novoice") {
  log("=== sound off, and a device with no German voice ===");
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => { window.__noVoices = [1]; }); await ctx.addInitScript(speechStubs);
  const page = await ctx.newPage(); watch(page, "no-voice"); content = DUMP["de-en"];
  await page.goto(`${BASE}/onboarding`); await page.getByRole("textbox").fill("Tess"); await nextBtn(page);
  await page.getByRole("radio").nth(0).click(); await nextBtn(page); await page.locator('[data-course="de-en"]').click(); await nextBtn(page);
  await page.getByRole("radio").first().click(); await nextBtn(page); await nextBtn(page); await nextBtn(page); await nextBtn(page); await page.waitForURL(/learn/);
  await page.goto(`${BASE}/settings`); const soundSwitch = page.getByRole("switch").first(); await soundSwitch.waitFor();
  await soundSwitch.uncheck({ force: true }); await sleep(300);
  expect(!(await soundSwitch.isChecked()), "sound effects switched off in Settings");
  await page.goto(`${BASE}/learn`); await page.locator('[data-state="current"]').click(); await page.locator("[data-start]").click();
  let sawWarning = false; const st = newState();
  globalThis.AUDIT = async (pg) => { if (await pg.getByText(/has no German voice installed/).count()) sawWarning = true; };
  await runSession(page, st); globalThis.AUDIT = null;
  expect(sawWarning, "a missing German voice is explained on listening exercises");
  expect((await page.evaluate(() => window.__spoken.length)) === 0, "nothing is read aloud in an unrelated voice when the language has none");
  expect(st.skipped >= 1 && (await page.locator("[data-summary]").count()) === 1, `the lesson still completes; ${st.skipped} listening exercise(s) were skipped and reported as skipped`);
  expect((await page.evaluate(() => window.__sfx.length)) === 0, "with sound off, no sound effect plays during a whole lesson");
  await ctx.close();
}
await browser.close();
if (errors.length) { failures += errors.length; console.error("Browser errors:\n" + [...new Set(errors)].join("\n")); }
if (failures) { console.error(`${failures} failure(s)`); process.exit(1); }
console.log("All language checks passed");
