// Speech-recognition fallbacks in a real browser.
//   node e2e/speech-fallback.mjs [baseUrl]        (E2E_BROWSER=chromium|firefox|webkit)
// Case 1 uses the browser's real recogniser: in Chromium builds without a speech service it never answers, which is
// exactly the hang the 12-second watchdog exists for. Cases 2–4 replace the recogniser or microphone with a stand-in
// that reproduces one specific failure; they test the app's handling, not real recognition.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pw = require("playwright"); const ENGINE = process.env.E2E_BROWSER ?? "chromium";
const BASE = process.argv[2] ?? "http://localhost:3000";
let failures = 0; const log = (...a) => console.log("•", ...a);
const expect = (c, m) => { if (c) log("ok:", m); else { failures++; console.error("✗ FAIL:", m); } };
const SEED = JSON.stringify({ version: 1, profile: { name: "Mic", courseId: "es-en", onboarded: true, sound: false, speech: true, motion: false, dailyGoalXp: 20 }, xp: 10, gems: 0, streak: { count: 0, lastDay: null, freezes: 0, longest: 0 }, completed: { "es-en:es1.1": { count: 1, bestAccuracy: 1, at: 1 } }, unlockedUnits: {}, stories: {}, review: {}, mistakes: [], xpEvents: [], quests: { day: "", items: [] }, achievements: {}, conversations: [], stats: { lessons: 1, perfect: 0, practice: 0, minutes: 0, tutorTurns: 0 } });
const browser = await pw[ENGINE].launch(ENGINE === "chromium" ? { args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] } : ENGINE === "firefox" ? { firefoxUserPrefs: { "media.navigator.streams.fake": true, "media.navigator.permission.disabled": true } } : {});
async function open(init, perms = ["microphone"]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ...(ENGINE === "chromium" ? { permissions: perms } : {}) });
  await ctx.addInitScript(({ seed }) => localStorage.setItem("speakara:learner:v1", seed), { seed: SEED });
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage(); await page.goto(`${BASE}/lesson?mode=speak`); await page.locator('main h1[data-ex-type="speak"]').waitFor();
  return { ctx, page, mic: page.locator("main button.rounded-full") };
}
const fallbackShown = (page) => page.getByText(/Record yourself instead/).count();

const canRecord = await (async () => { const { ctx, page } = await open(null); const r = await page.evaluate(() => typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia); await ctx.close(); return r; })();
log(`${ENGINE}: MediaRecorder ${canRecord ? "present" : "absent"}`);
const hasRecogniser = await (async () => { const { ctx, page } = await open(null); const r = await page.evaluate(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition)); await ctx.close(); return r; })();
log(`${ENGINE}: speech recognition API ${hasRecogniser ? "present" : "absent"}`);

if (hasRecogniser) {
  // 1. real recogniser that never answers → watchdog → recording fallback
  { const { ctx, page, mic } = await open(null);
    await mic.click(); const t0 = Date.now();
    await page.getByText(/Record yourself instead/).waitFor({ timeout: 20000 }).catch(() => {});
    const secs = Math.round((Date.now() - t0) / 1000);
    if (await fallbackShown(page)) {
      expect(true, `real recogniser gave no answer; after ${secs}s the app switched to recording (watchdog)`);
      await mic.click(); await page.waitForTimeout(900); await mic.click(); await page.locator("main audio").waitFor({ timeout: 10000 });
      expect(await page.getByRole("button").filter({ hasText: /I said it well/ }).count() === 1, "the recording fallback captures audio and offers self-assessment");
    } else {
      const heard = await page.locator("main").innerText();
      expect(/%|heard|Not quite|Great/i.test(heard), `real recogniser answered within ${secs}s (real recognition available here)`);
    }
    await ctx.close(); }
}
// 2. repeated no-speech → after two misses, recording is offered
{ const { ctx, page, mic } = await open(() => { class R { start() { setTimeout(() => this.onend?.(), 300); } stop() {} } window.SpeechRecognition = window.webkitSpeechRecognition = R; });
  await mic.click(); await page.getByText(/didn’t catch that/).waitFor({ timeout: 5000 });
  expect(await fallbackShown(page) === 0, "first no-speech: asks to try again, recogniser still in use");
  await mic.click(); await page.waitForTimeout(800); await page.getByText(/Record yourself instead/).waitFor({ timeout: canRecord ? 5000 : 500 }).catch(() => {});
  if (canRecord) expect(await fallbackShown(page) === 1, "second no-speech: recording is offered instead");
  else expect(await fallbackShown(page) === 0 && !(await mic.isDisabled()), "second no-speech without recording support: keeps the recogniser (no recording offered that cannot work)");
  await ctx.close(); }
// 3. recogniser refused permission → accurate message, retry and skip still available
{ const { ctx, page, mic } = await open(() => { class R { start() { setTimeout(() => this.onerror?.({ error: "not-allowed" }), 200); } stop() {} } window.SpeechRecognition = window.webkitSpeechRecognition = R; });
  await mic.click(); await page.waitForTimeout(700);
  const txt = await page.locator("main").innerText();
  expect(/Microphone access is blocked/i.test(txt), "denied permission is explained as blocked microphone access");
  expect(!(await mic.isDisabled()) && await page.locator("footer button").filter({ hasText: /Can’t speak now/ }).count() === 1, "after a denial the learner can retry or skip");
  await ctx.close(); }
// 4. no microphone at all (recording path)
if (!canRecord) { const { ctx, page, mic } = await open(() => { window.SpeechRecognition = window.webkitSpeechRecognition = undefined; });
  expect(await mic.isDisabled() && /can’t record or recognise speech/.test(await page.locator("main").innerText()), "no recogniser and no recorder: microphone disabled with an accurate explanation");
  expect(await page.locator("footer button").filter({ hasText: /Can’t speak now/ }).count() === 1, "and the learner can continue");
  await ctx.close(); } else
{ const { ctx, page, mic } = await open(() => { window.SpeechRecognition = window.webkitSpeechRecognition = undefined; navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("none", "NotFoundError")); });
  await mic.click(); await page.waitForTimeout(700);
  expect(/No microphone was found/i.test(await page.locator("main").innerText()), "a device without a microphone is told so");
  expect(await page.locator("footer button").filter({ hasText: /Can’t speak now/ }).count() === 1, "and can skip speaking");
  await ctx.close(); }
// 5. real microphone recording on this engine (fake capture device), recogniser removed
if (canRecord) { const { ctx, page, mic } = await open(() => { window.SpeechRecognition = window.webkitSpeechRecognition = undefined; });
  await mic.click(); await page.waitForTimeout(1200); await mic.click(); const ok = await page.locator("main audio").waitFor({ timeout: 10000 }).then(() => true, () => false);
  expect(ok, `${ENGINE}: getUserMedia + MediaRecorder produce a playable recording`);
  await ctx.close(); }
await browser.close();
if (failures) { console.error(`${failures} failure(s)`); process.exit(1); }
console.log("All speech fallback checks passed");
