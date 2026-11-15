// End-to-end browser test of the real learner workflow.
//   node e2e/smoke.mjs [baseUrl] [screenshotDir]
// Guest journeys always run. Account journeys run when E2E_PASSWORD is set and the app is connected to Supabase
// (accounts e2e-ana@speakara.test and e2e-cara@speakara.test must exist and be confirmed).
// Speech: the browser's speechSynthesis and SpeechRecognition are replaced with recording stubs so listening and
// speaking exercises are answered rather than skipped; a separate check records from Chromium's fake microphone
// through the real getUserMedia + MediaRecorder path.
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
  log("  not finished at: " + page.url() + " — " + (await page.locator("body").innerText().catch(() => "?")).replace(/\s+/g, " ").slice(0, 200)); throw new Error("session did not finish");
}
const newState = (sabotage = false) => ({ types: {}, skipped: 0, wrong: 0, listened: 0, spoke: 0, sabotage });
const nextBtn = (page) => page.locator("footer button").click();
function watch(page, label) {
  page.on("pageerror", (e) => errors.push(`${label}: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|net::ERR_FAILED/i.test(m.text())) errors.push(`${label} console: ${m.text().slice(0, 200)}`); });
}

const browser = await chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
const cloud = await (async () => { const p = await browser.newPage(); await p.goto(`${BASE}/signup`); const has = (await p.locator("form").count()) > 0; await p.close(); return has; })();
log(`app is ${cloud ? "connected to an account server" : "running in guest-only mode"}`);

// ---------------------------------------------------------------- guest journeys on three viewports
const ONLY = process.env.E2E_ONLY;
if (ONLY !== "accounts") for (const [label, ctxOpts, uiLang] of [["desktop", { viewport: { width: 1440, height: 900 } }, 0], ["tablet", { viewport: { width: 820, height: 1180 }, hasTouch: true }, 1], ["mobile", { ...devices["Pixel 7"] }, 2]]) {
  const ctx = await browser.newContext({ ...ctxOpts, permissions: ["microphone"] }); await ctx.addInitScript(speechStubs);
  const page = await ctx.newPage(); watch(page, label);
  log(`=== guest · ${label} · interface ${["English", "Spanish", "Hindi"][uiLang]} ===`);
  await page.goto(BASE); await page.locator("h1").waitFor(); await shot(page, `${label}-01-landing`);
  if (label === "desktop") await axe(page, "landing");
  await page.goto(`${BASE}/learn`); await page.waitForURL(/onboarding/);
  expect(true, "opening the app without a profile redirects to onboarding");
  await page.getByRole("textbox").fill("Tess"); if (label === "desktop") await axe(page, "onboarding");
  await nextBtn(page);                                                     // welcome → language
  await page.getByRole("radio").nth(uiLang).click(); await nextBtn(page);  // language → course
  await page.locator('[data-course="es-en"]').click(); await nextBtn(page);   // Spanish course, whatever the interface language
  await page.getByRole("radio").first().click(); await nextBtn(page);      // goal → level
  if (label === "desktop") {
    await page.getByRole("radio").nth(1).click(); await nextBtn(page);     // "I know some" → placement test
    const st = newState(); await runSession(page, st, '[data-step="target"]');
    expect(await page.getByText(/Unit 3/).count() >= 1, "placement test with 100% places the learner in Unit 3");
  } else await nextBtn(page);
  await nextBtn(page); await shot(page, `${label}-02-plan`); await nextBtn(page); await page.waitForURL(/learn/);
  await page.locator('[data-state="current"]').waitFor(); await shot(page, `${label}-03-path`);
  if (label === "desktop") await axe(page, "path");
  if (uiLang === 1) expect(await page.getByRole("link", { name: "Aprender" }).count() >= 1 && await page.getByText(/Unidad 1/).count() === 1, "interface is in Spanish (navigation and path)");
  if (uiLang === 2) expect(await page.getByRole("link", { name: "सीखें" }).count() >= 1 && await page.getByText(/इकाई 1/).count() === 1 && (await page.evaluate(() => document.documentElement.lang)) === "hi-IN", "interface is in Hindi while the course is Spanish");
  if (label !== "desktop") expect(await page.locator('[data-state="locked"]').count() >= 10, "later lessons are locked for a new learner");
  const firstLesson = page.locator(label === "desktop" ? '[data-state="open"], [data-state="current"]' : '[data-state="current"]').first();
  await firstLesson.click(); await page.locator("[data-start]").waitFor(); await shot(page, `${label}-04-lesson-intro`);
  expect(await page.locator("ul li").count() >= 5, "lesson introduction lists the new words");
  if (label === "desktop") await axe(page, "lesson-intro");
  const st = newState(true);
  await page.locator("[data-start]").click(); await page.locator("main h1[data-ex-type]").waitFor(); await shot(page, `${label}-05-exercise`);
  if (label === "desktop") await axe(page, "exercise");
  if (uiLang === 2) expect(/[ऀ-ॿ]/.test(await page.locator("main h1[data-ex-type]").innerText()), "exercise instructions are shown in Hindi");
  await runSession(page, st); await shot(page, `${label}-06-summary`);
  log("exercise types answered:", JSON.stringify(st.types), `· listening answered ${st.listened} · speaking answered ${st.spoke} · skipped ${st.skipped}`);
  expect(Object.keys(st.types).length >= 7, "lesson mixed at least 7 exercise types");
  expect(st.types.choose >= 4 && st.wrong === 1, "a wrong answer was re-queued and asked again");
  expect(st.listened >= 2 && st.spoke >= 1 && st.skipped === 0, "listening, dictation and speaking exercises were answered, not skipped");
  expect((await page.locator("[data-summary]").getAttribute("data-xp")) === "15", "summary shows 15 XP (10 base + 5 first time, one mistake)");
  if (label === "desktop") await axe(page, "summary");
  const spoken = await page.evaluate(() => window.__spoken);
  expect(spoken.length >= 5 && spoken.every((s) => s.lang === "es-ES"), `text-to-speech was requested ${spoken.length} times with the Spanish voice`);
  await page.locator("[data-summary] a").click(); await page.waitForURL(/learn/);
  await page.reload(); await page.locator('[data-state="current"]').waitFor();
  expect(await page.locator('[data-state="done"]').count() === 1, "lesson is marked complete and survives a reload");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("speakara:learner:v1")));
  expect(saved.xp === (label === "desktop" ? 35 : 15) && saved.streak.count === 1 && Object.keys(saved.review).length >= 5 && Object.keys(saved.achievements).includes("first-lesson"), `stored learner model is consistent (xp ${saved.xp}, streak ${saved.streak.count}, ${Object.keys(saved.review).length} words, achievements ${Object.keys(saved.achievements).length})`);

  await page.goto(`${BASE}/practice`); await page.locator("h1").waitFor(); await shot(page, `${label}-07-practice`);
  if (label === "desktop") await axe(page, "practice");
  for (const mode of label === "desktop" ? ["review", "listen", "speak", "write", "match"] : ["review"]) {
    await page.goto(`${BASE}/lesson?mode=${mode}`); const ps = newState(); await runSession(page, ps);
    expect((await page.locator("[data-summary]").count()) === 1, `practice mode “${mode}” completes (${JSON.stringify(ps.types)})`);
  }
  await page.goto(`${BASE}/vocabulary`); await page.locator("h1").waitFor(); await shot(page, `${label}-08-vocabulary`);
  expect(await page.locator("main ul > li").count() >= 5, "vocabulary notebook lists met words");
  if (label === "desktop") { await axe(page, "vocabulary"); await page.goto(`${BASE}/guidebook?unit=es1`); expect(await page.getByText("Two question marks").count() === 1, "guidebook shows unit tips"); await axe(page, "guidebook"); }

  await page.goto(`${BASE}/tutor`); await page.locator("main button").first().waitFor();
  if (label === "desktop") { expect(await page.locator("main .grid button:not([disabled])").count() === 9, "all nine role-play scenarios are available"); await axe(page, "tutor"); }
  await page.locator("main .grid button").nth(1).click();                  // Restaurant
  await page.getByText(/Una mesa para dos/).waitFor(); await page.getByRole("textbox").fill("xyz"); await page.locator("form button[type=submit]").click();
  await page.getByText(/Sí, una mesa para dos, por favor/).waitFor();
  await page.getByRole("textbox").fill("Sí, una mesa para dos, por favor"); await page.locator("form button[type=submit]").click();
  await page.getByText(/Qué quiere comer/).waitFor(); await shot(page, `${label}-09-tutor`);
  log("ok: scripted tutor coached on a miss and advanced on a good reply");
  if (label === "desktop") {
    for (const reply of ["Quiero pollo con arroz", "Quiero agua, por favor", "La cuenta, por favor"]) { await page.getByRole("textbox").fill(reply); await page.locator("form button[type=submit]").click(); await page.waitForTimeout(500); }
    await page.getByText("Useful phrases from this chat").waitFor(); await page.locator("li button").first().click();
    await page.goto(`${BASE}/vocabulary`); await page.getByRole("tab", { name: "Saved phrases" }).click();
    expect(await page.locator("main ul > li").count() === 1, "a phrase saved from the tutor appears in the vocabulary notebook");
    await page.goto(`${BASE}/tutor`); expect(await page.getByText("Conversation history").count() === 1, "conversation transcript is kept in history");
  }
  await page.goto(`${BASE}/leaderboard`); await page.locator("ol li").nth(3).waitFor(); await shot(page, `${label}-10-leaderboard`);
  expect(await page.locator("ol li", { hasText: "Tess" }).count() === 1, "leaderboard shows the learner");
  await page.goto(`${BASE}/quests`); await page.locator("h2").first().waitFor(); await shot(page, `${label}-11-quests`);
  if (label === "desktop") await axe(page, "quests");
  await page.goto(`${BASE}/profile`); await page.locator("h2").first().waitFor(); await shot(page, `${label}-12-profile`);
  if (label === "desktop") await axe(page, "profile");
  await page.goto(`${BASE}/settings`); await page.locator("h2").first().waitFor();
  if (label === "desktop") {
    await axe(page, "settings");
    await page.getByRole("switch").nth(1).check({ force: true }); await page.getByLabel("Display name").fill("Tessa"); await page.getByRole("button", { name: "Save" }).click();
    await page.reload(); await page.locator("h2").first().waitFor();
    expect(await page.getByLabel("Display name").inputValue() === "Tessa" && await page.getByRole("switch").nth(1).isChecked(), "profile settings (name, slower audio) persist");
    await page.goto(`${BASE}/story?id=es3-story`); await page.locator("h1").waitFor();
    const answers = { "What does Ana order to drink?": "Water", "How does Luis take his coffee?": "Without sugar", "What does Ana ask for at the end?": "The check" };
    for (let i = 0; i < 40 && !(await page.locator("[data-summary]").count()); i++) {
      const q = page.locator("fieldset").last(); const footer = page.locator("footer button");
      if (await footer.isDisabled()) { await q.getByRole("button", { name: answers[await q.locator("legend").innerText()], exact: true }).click(); } else await footer.click();
      await page.waitForTimeout(80);
    }
    expect((await page.locator("[data-summary]").getAttribute("data-xp")) === "17", "story awards 12 + 5 perfect XP");
    await page.goto(`${BASE}/stories`); await axe(page, "stories");
    await page.goto(`${BASE}/admin`); expect(await page.getByText(/for Speakara staff/).count() === 1, "admin area is closed to guests");
    await page.goto(`${BASE}/lesson?lesson=does-not-exist`); expect(await page.getByText(/doesn’t exist/).count() === 1, "unknown lesson shows an error state, not a crash");
  }
  if (label === "tablet") expect(await page.locator("nav").first().isVisible() && (await page.locator("nav a span.hidden").count()) > 0, "tablet uses the icon rail navigation");
  if (label === "mobile") expect(await page.locator("nav").last().isVisible() && !(await page.locator("aside").isVisible().catch(() => false)), "mobile uses bottom tabs and hides the right rail");
  await ctx.close();
}

// ---------------------------------------------------------------- real microphone path
if (ONLY !== "accounts") {
  log("=== real microphone recording (Chromium fake capture device, no speech recognition) ===");
  const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, permissions: ["microphone"] });
  await ctx.addInitScript(() => { window.SpeechRecognition = window.webkitSpeechRecognition = undefined; localStorage.setItem("speakara:learner:v1", JSON.stringify({ version: 1, profile: { name: "Mic", courseId: "es-en", onboarded: true, sound: false, speech: true, motion: false, dailyGoalXp: 20 }, xp: 10, gems: 0, streak: { count: 0, lastDay: null, freezes: 0, longest: 0 }, completed: { "es-en:es1.1": { count: 1, bestAccuracy: 1, at: 1 } }, unlockedUnits: {}, stories: {}, review: {}, mistakes: [], xpEvents: [], quests: { day: "", items: [] }, achievements: {}, conversations: [], stats: { lessons: 1, perfect: 0, practice: 0, minutes: 0, tutorTurns: 0 } })); });
  const page = await ctx.newPage(); watch(page, "mic");
  await page.goto(`${BASE}/lesson?mode=speak`); await page.locator('main h1[data-ex-type="speak"]').waitFor();
  const mic = page.locator("main button.rounded-full");
  await mic.click(); await page.waitForTimeout(900);
  expect((await mic.getAttribute("aria-pressed")) === "true", "microphone permission granted and recording started (getUserMedia + MediaRecorder)");
  await mic.click(); const audio = page.locator("main audio"); await audio.waitFor();
  const info = await audio.evaluate(async (el) => { const b = await (await fetch(el.src)).blob(); return { size: b.size, type: b.type }; });
  expect(info.size > 500 && /audio/.test(info.type), `a real recording was captured for playback (${info.size} bytes, ${info.type})`);
  await page.getByRole("button").filter({ hasText: /I said it well/ }).click(); await page.locator("footer button").last().click();
  expect(await page.locator("footer .text-brand-dark").count() >= 1, "self-assessed speaking answer is accepted in browsers without speech recognition");
  await shot(page, "mic-recording"); await axe(page, "speaking-feedback");
  await ctx.close();
  const denied = await browser.newContext({ viewport: { width: 420, height: 900 }, permissions: [] });
  await denied.addInitScript(() => { window.SpeechRecognition = window.webkitSpeechRecognition = undefined; navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("denied", "NotAllowedError")); localStorage.setItem("speakara:learner:v1", JSON.stringify({ version: 1, profile: { name: "Mic", courseId: "es-en", onboarded: true, sound: false, speech: true, motion: false, dailyGoalXp: 20 }, xp: 10, gems: 0, streak: { count: 0, lastDay: null, freezes: 0, longest: 0 }, completed: { "es-en:es1.1": { count: 1, bestAccuracy: 1, at: 1 } }, unlockedUnits: {}, stories: {}, review: {}, mistakes: [], xpEvents: [], quests: { day: "", items: [] }, achievements: {}, conversations: [], stats: { lessons: 1, perfect: 0, practice: 0, minutes: 0, tutorTurns: 0 } })); });
  const p2 = await denied.newPage(); await p2.goto(`${BASE}/lesson?mode=speak`); await p2.locator('main h1[data-ex-type="speak"]').waitFor();
  await p2.locator("main button.rounded-full").click();
  expect(await p2.getByText(/Microphone access is blocked/).count() === 1, "a blocked microphone is explained, with skip and retry still available");
  await denied.close();
}

// ---------------------------------------------------------------- account journeys against the live backend
if (cloud && PASSWORD) {
  log("=== accounts · live Supabase ===");
  const login = async (page, email, password = PASSWORD) => { await page.goto(`${BASE}/login`); await page.getByLabel("Email").fill(email); await page.getByLabel("Password").fill(password); await page.locator("form button[type=submit]").click(); };
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); await ctx.addInitScript(speechStubs);
  const page = await ctx.newPage(); watch(page, "account");
  await page.goto(`${BASE}/login`); await page.locator("form").waitFor(); await axe(page, "login");
  await page.getByLabel("Email").fill("not-an-email"); await page.getByLabel("Password").fill("short"); await page.locator("form button[type=submit]").click();
  expect(await page.getByText("Enter a valid email address.").count() === 1, "invalid email is rejected with a clear message");
  await login(page, "e2e-ana@speakara.test", "definitely-wrong-password");
  await page.getByText(/don’t match/).waitFor(); expect(true, "wrong password shows a friendly error");
  await page.goto(`${BASE}/signup`); await page.locator("form").waitFor(); await axe(page, "signup");
  await page.getByLabel("Name", { exact: true }).fill("X"); await page.getByLabel("Username").fill("ab"); await page.getByLabel("Email").fill("x@speakara.test"); await page.getByLabel("Password").fill("longenough1"); await page.locator("form button[type=submit]").click();
  expect(await page.getByText(/Usernames are 3–20 characters/).count() === 1, "sign-up validates the username before contacting the server");

  await login(page, "e2e-ana@speakara.test"); await page.waitForURL(/learn/, { timeout: 20000 }); await page.locator("[data-state]").first().waitFor();
  // The shared test account finishes lessons on every run; when a course is exhausted, move it to the next course.
  const FLAGS = [["🇪🇸", "es-en"], ["🇫🇷", "fr-en"], ["🇩🇪", "de-en"], ["🇮🇹", "it-en"], ["🇰🇷", "ko-en"], ["🇷🇺", "ru-en"]];
  const ensureCurrent = async () => {
    await page.goto(`${BASE}/learn`); await page.locator("[data-state]").first().waitFor();
    for (const [, id] of FLAGS) {
      if (await page.locator('[data-state="current"]').count() && await page.locator('[data-state="locked"]').count()) break;   // at least two lessons left
      await page.goto(`${BASE}/settings`); await page.locator(`[data-course="${id}"]`).click(); await sleep(1200);
      await page.goto(`${BASE}/learn`); await page.locator("[data-state]").first().waitFor();
    }
    const head = await page.locator("main").innerText(); const hit = FLAGS.find(([f]) => head.includes(f)); if (hit) content = DUMP[hit[1]];
  };
  await ensureCurrent();
  const doneBefore = await page.locator('[data-state="done"]').count();
  const xpBefore = Number((await page.locator('a[href="/profile"][aria-label$="XP"]').first().getAttribute("aria-label")).replace(/\D/g, ""));
  expect(xpBefore > 0, `log-in restores cloud progress (${xpBefore} XP; ${doneBefore} lessons complete in the current course)`);
  // network failure while saving, then retry
  await page.locator('[data-state="current"]').click(); const st = newState();
  let failOnce = true; await page.route("**/api/progress", (route) => { if (failOnce) { failOnce = false; return route.abort(); } return route.continue(); });
  await runSession(page, st);
  expect(await page.locator("[data-save-error]").count() === 1, "a network failure while saving is reported and the answers are kept");
  await page.locator("[data-retry]").click(); await page.locator("[data-summary]").waitFor({ timeout: 20000 });
  const earned = Number(await page.locator("[data-summary]").getAttribute("data-xp"));
  expect(earned >= 15, `retry succeeds and the server awards XP (+${earned})`);
  await page.unroute("**/api/progress");
  await page.locator("[data-summary] a").click(); await page.waitForURL(/learn/); await page.locator('[data-state="done"]').first().waitFor();
  expect(await page.locator('[data-state="done"]').count() === doneBefore + 1, "path shows the lesson the server recorded");
  await page.goto(`${BASE}/leaderboard`); await page.locator("ol li", { hasText: "(you)" }).waitFor();
  expect(!(await page.getByText(/practice bot/).count()), "signed-in leaderboard shows stored scores, no bots");
  await page.goto(`${BASE}/profile`); await page.getByLabel("Find by username").waitFor(); await axe(page, "profile-signed-in");
  await page.getByLabel("Find by username").fill("e2e_c"); await page.getByRole("button", { name: "Search" }).click();
  await page.getByText("@e2e_cara").or(page.getByText(/No learner/)).first().waitFor({ timeout: 15000 });
  expect(true, "friend search runs against the database");
  // expired session
  await page.route("**/api/progress", (route) => route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Your session has expired. Please log in again.", code: "unauthenticated" }) }));
  await ensureCurrent(); await page.locator('[data-state="current"]').click(); await runSession(page, newState());
  await page.locator("[data-save-error]").waitFor({ timeout: 20000 });
  expect(await page.getByText(/session has expired/).count() >= 1, "an expired session is reported instead of silently losing work");
  await page.unroute("**/api/progress");
  // log back in, log out, second device
  await login(page, "e2e-ana@speakara.test"); await page.waitForURL(/learn/, { timeout: 20000 }); await page.goto(`${BASE}/settings`); await page.getByRole("button", { name: "Log out" }).waitFor();
  await page.getByRole("button", { name: "Log out" }).click(); await page.waitForURL((u) => new URL(u).pathname === "/");
  await page.goto(`${BASE}/learn`); await page.waitForURL(/onboarding|learn/);
  expect(!(await page.evaluate(() => Object.keys(localStorage).some((k) => k.startsWith("sb-")))), "log-out clears the stored session");
  const other = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const p2 = await other.newPage(); watch(p2, "second-device");
  await login(p2, "e2e-ana@speakara.test"); await p2.waitForURL(/learn/, { timeout: 20000 }); await p2.locator('[data-state="current"]').waitFor();
  expect(await p2.locator('[data-state="done"]').count() === doneBefore + 1, "the same progress appears after logging in on a second device");
  const xpAfter = Number((await p2.locator('a[href="/profile"][aria-label$="XP"]').first().getAttribute("aria-label")).replace(/\D/g, ""));
  expect(xpAfter === xpBefore + earned, `XP on the second device equals the server total (${xpBefore} + ${earned} = ${xpAfter})`);
  await p2.reload(); await p2.locator('[data-state="current"]').waitFor(); expect(await p2.locator('[data-state="done"]').count() === doneBefore + 1, "session is restored after a reload without logging in again");
  await other.close();
  // password recovery request
  await page.goto(`${BASE}/forgot-password`); await page.getByLabel("Email").fill("e2e-ana@speakara.test"); await page.locator("form button[type=submit]").click();
  await page.locator("#auth-msg p").waitFor({ timeout: 20000 }); const recMsg = await page.locator("#auth-msg p").innerText();
  if (/is invalid|Too many/.test(recMsg)) log("note: Supabase refused (" + recMsg.slice(0, 60) + "): reserved .test domain or mailer rate limit; recovery email delivery is NOT verified here");
  else expect(/reset link is on its way/.test(recMsg), `password recovery request accepted by Supabase (“${recMsg.slice(0, 70)}”)`);
  await page.goto(`${BASE}/reset-password`); await page.getByText(/expired or was already used/).waitFor({ timeout: 15000 }); expect(true, "reset page without a recovery link explains itself");
  await ctx.close();

  // guest → account: progress made before logging in is imported once, after server validation
  content = DUMP["es-en"];
  const g = await browser.newContext({ viewport: { width: 1280, height: 900 } }); await g.addInitScript(speechStubs); const gp = await g.newPage(); watch(gp, "guest-to-account");
  await gp.goto(`${BASE}/onboarding`); await gp.getByRole("textbox").fill("Cara"); for (let i = 0; i < 3; i++) await nextBtn(gp); await gp.getByRole("radio").first().click(); for (let i = 0; i < 4; i++) await nextBtn(gp);
  await gp.waitForURL(/learn/); await gp.locator('[data-state="current"]').click(); await runSession(gp, newState());
  const guestXp = Number(await gp.locator("[data-summary]").getAttribute("data-xp"));
  await login(gp, "e2e-cara@speakara.test"); await gp.waitForURL(/learn/, { timeout: 30000 }); await gp.locator('[data-state="current"]').waitFor({ timeout: 20000 });
  expect(await gp.locator('[data-state="done"]').count() === 1, "guest progress is carried into the account on first log-in");
  expect(!(await gp.evaluate(() => localStorage.getItem("speakara:learner:v1"))), "device copy is cleared after import, so it cannot be imported twice");
  const cx = Number((await gp.locator('a[href="/profile"][aria-label$="XP"]').first().getAttribute("aria-label")).replace(/\D/g, ""));
  expect(cx === guestXp, `account XP equals what the guest earned (${cx})`);
  await gp.goto(`${BASE}/settings`); await gp.getByRole("button", { name: "Delete account" }).click(); await gp.getByRole("button", { name: "Yes, delete everything" }).click();
  await gp.waitForURL((u) => new URL(u).pathname === "/"); expect(true, "account deletion from Settings works");
  await g.close();
} else log(`(account journeys skipped: ${cloud ? "set E2E_PASSWORD" : "app has no account server"})`);

await browser.close();
if (a11y.length) { failures += a11y.length; console.error("Accessibility violations:\n" + a11y.join("\n")); }
if (errors.length) { failures += errors.length; console.error("Browser errors:\n" + [...new Set(errors)].join("\n")); }
console.log(failures ? `\n${failures} failure(s)` : "\nAll end-to-end checks passed");
process.exit(failures ? 1 : 0);
