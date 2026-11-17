// Real on-device Arabic voice (nabra-tts / Nabra-7M-Distill): no stubs for the voice itself.
//   E2E_BROWSER=chromium|firefox|webkit node e2e/arabic-voice.mjs [baseUrl] [outDir]
// Writes WAV files of course sentences to outDir for listening and speech-recognition checks.
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { execSync, spawn } from "node:child_process";
const require = createRequire(import.meta.url);
const pw = require("playwright"); const ENGINE = process.env.E2E_BROWSER ?? "chromium";
const BASE = process.argv[2] ?? "http://localhost:3000"; const OUT = process.argv[3] ?? "/tmp/arabic-voice"; mkdirSync(OUT, { recursive: true });
let failures = 0; const notes = [];
const expect = (c, m) => { console.log(c ? "• ok:" : "✗ FAIL:", m); if (!c) failures++; };
const note = (m) => { console.log("•", m); notes.push(m); };

const seed = JSON.stringify({ version: 1, profile: { name: "Ari", courseId: "ar-en", onboarded: true, sound: false, speech: true, motion: false, dailyGoalXp: 20, slowAudio: false }, xp: 0, gems: 0, streak: { count: 0, lastDay: null, freezes: 0, longest: 0 }, completed: {}, unlockedUnits: {}, stories: {}, review: {}, mistakes: [], xpEvents: [], quests: { day: "", items: [] }, achievements: {}, conversations: [], stats: { lessons: 0, perfect: 0, practice: 0, minutes: 0, tutorTurns: 0 } });
const SENTENCES = [
  ["ar1.1.w1", "مَرْحَبًا"], ["ar1.3.s2", "أَنا بِخَيْرٍ، الحَمْدُ لِلَّهِ."], ["ar1.4.s1", "ما اسْمُكَ؟"], ["ar2.1.s1", "أنا من مصر."],
  ["ar2.5.s2", "أسكن في القاهرة."], ["ar5.1.s1", "أريد قهوة من فضلك."], ["ar7.1.s2", "أين المستشفى من فضلك؟"], ["ar10.4.s1", "ذهبت إلى السوق أمس."],
];
const launch = { chromium: { args: ["--enable-unsafe-webgpu", "--autoplay-policy=no-user-gesture-required"] }, firefox: {}, webkit: {} }[ENGINE];
const browser = await pw[ENGINE].launch(launch);
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript((s) => { if (!localStorage.getItem("speakara:learner:v1")) localStorage.setItem("speakara:learner:v1", s); }, seed);
const page = await ctx.newPage(); const errs = [];
page.on("pageerror", (e) => errs.push(e.message)); page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|_rsc=/.test(m.text())) errs.push(m.text().slice(0, 200)); });

// Protected Vercel previews: E2E_SHARE=<token> sets the access cookie first.
const share = async (pg) => { if (process.env.E2E_SHARE) await pg.goto(`${BASE}/?_vercel_share=${process.env.E2E_SHARE}`); };
await share(page);
// 1. Settings: first attempt fails (model host blocked), retry succeeds; progress is shown.
await page.goto(`${BASE}/settings`); await page.locator("[data-arabic-voice]").waitFor();
const sw = await page.evaluate(async () => { const r = await navigator.serviceWorker?.ready.catch(() => null); return !!r?.active; });
note(`service worker active: ${sw}`);
await ctx.setOffline(true);   // the network drops: the first download attempt must fail cleanly
await page.getByRole("button", { name: "Download Arabic voice" }).click();
await page.locator('[data-arabic-voice="error"]').waitFor({ timeout: 120000 });
expect(await page.getByRole("button", { name: "Retry download" }).isVisible(), "a failed download shows an error and a Retry button");
await ctx.setOffline(false);
const progress = new Set();
const poll = setInterval(async () => { const v = await page.locator('[role="progressbar"]').getAttribute("aria-valuenow").catch(() => null); if (v) progress.add(Number(v)); }, 150);
const t0 = Date.now();
await page.getByRole("button", { name: "Retry download" }).click();
await page.locator('[data-arabic-voice="ready"]').waitFor({ timeout: 300000 }); clearInterval(poll);
await page.getByText(/Arabic voice ready on this device\. \(/).waitFor({ timeout: 120000 });
const st = await page.evaluate(() => window.__arabicVoice.getVoiceState());
expect(progress.size >= 3, `download progress reported (${[...progress].sort((a, b) => a - b).slice(0, 6).join(", ")}… %), ready in ${Math.round((Date.now() - t0) / 1000)} s`);
note(`engine: device=${st.device}, dtype=${st.dtype}`);

// 2. Main thread stays responsive while speech is generated (worker), and audio is real.
const resp = await page.evaluate(async (text) => {
  let maxGap = 0, last = performance.now(), run = true; const loop = () => { const n = performance.now(); maxGap = Math.max(maxGap, n - last); last = n; if (run) requestAnimationFrame(loop); }; requestAnimationFrame(loop);
  const t = performance.now(); const a = await window.__arabicVoice.synthArabic(text, 1); const ms = performance.now() - t; run = false;
  let peak = 0, sq = 0; for (const x of a) { peak = Math.max(peak, Math.abs(x)); sq += x * x; }
  return { ms: Math.round(ms), seconds: a.length / 24000, peak, rms: Math.sqrt(sq / a.length), maxGap: Math.round(maxGap) };
}, "أريد أن أدفع الآن. الحساب من فضلك.");
expect(resp.seconds > 1 && resp.rms > 0.01, `real audio generated: ${resp.seconds.toFixed(2)} s of speech in ${resp.ms} ms (rms ${resp.rms.toFixed(3)})`);
expect(resp.maxGap < 200, `main thread stayed responsive during generation (longest frame gap ${resp.maxGap} ms)`);

// 3. Pronunciation samples from the course, written as WAV for listening and recognition checks.
const wav = (f) => { const n = f.length, b = Buffer.alloc(44 + n * 2); b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(24000, 24); b.writeUInt32LE(48000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40); for (let i = 0; i < n; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(f[i] * 32767))), 44 + i * 2); return b; };
const manifest = [];
for (const [id, text] of SENTENCES) {
  const r = await page.evaluate(async (t) => { const a = await window.__arabicVoice.synthArabic(t, 1); const p = await window.__arabicVoice.phonemesArabic(t); return { a: Array.from(a), p }; }, text);
  writeFileSync(`${OUT}/${ENGINE}-${id}.wav`, wav(r.a)); manifest.push({ id, text, phonemes: r.p.join(" | "), seconds: +(r.a.length / 24000).toFixed(2) });
}
writeFileSync(`${OUT}/${ENGINE}-manifest.json`, JSON.stringify(manifest, null, 1));
expect(manifest.every((m) => m.seconds > 0.3), `${manifest.length} course sentences synthesised (${manifest.map((m) => m.seconds + "s").join(", ")})`);

// 4. Slow speech is longer; replay is served from memory; stop cancels.
const sp = await page.evaluate(async () => { const t = "أسكن في مدينة صغيرة."; const n = (await window.__arabicVoice.synthArabic(t, 1)).length, s = (await window.__arabicVoice.synthArabic(t, 0.75)).length; return { ratio: s / n }; });
expect(sp.ratio > 1.15, `slow mode produces slower speech (${sp.ratio.toFixed(2)}× longer)`);

// 5. A real lesson: the speaker button plays through the Nabra voice, replay is instant, stop works.
await page.goto(`${BASE}/guidebook?unit=ar1`); const hear = page.getByRole("button", { name: /^Hear / }).nth(1); await hear.waitFor();
await hear.click(); await page.waitForFunction(() => window.__arabicVoice.lastPlayback.length >= 1, null, { timeout: 60000 });
await page.waitForTimeout(2500); await hear.click(); await page.waitForFunction(() => window.__arabicVoice.lastPlayback.length >= 2, null, { timeout: 30000 });
const lp = await page.evaluate(() => window.__arabicVoice.lastPlayback);
expect(!lp[0].cached && lp[1].cached && lp[1].ms < 50, `speaker button uses the on-device voice; replay comes from memory (${lp[0].ms} ms first, ${lp[1].ms} ms replay)`);
const stopRes = await page.evaluate(async () => { const btns = [...document.querySelectorAll('button[aria-label^="Hear"]')]; btns[3].click(); await new Promise((r) => setTimeout(r, 30)); btns[4].click(); await new Promise((r) => setTimeout(r, 6000)); return window.__arabicVoice.lastPlayback.map((x) => x.text); });
expect(!stopRes.includes(await page.getByRole("button", { name: /^Hear / }).nth(3).getAttribute("aria-label").then((l) => l.replace(/^Hear /, ""))), "tapping another speaker while one is generating cancels the first (it never plays)");

// 6. Offline: disconnect, reload, pronounce a sentence not generated before.
await page.evaluate(() => { window.__beforeReload = true; });
// Playwright's emulated offline mode makes WebKit fail every reload, even of cached pages (a harness limitation,
// checked separately). For WebKit against a local server, cut the network for real: stop the server.
const realOffline = ENGINE === "webkit" && /localhost|127\.0\.0\.1/.test(BASE) && process.env.E2E_NO_SERVER_KILL !== "1";
if (realOffline) { execSync('kill $(pgrep -f "^next-server") || true'); await page.waitForTimeout(1500); note("offline: local server stopped (real network loss)"); }
else await ctx.setOffline(true);
await page.reload({ waitUntil: "domcontentloaded" }).catch((e) => note("offline reload error: " + e.message.split("\n")[0]));
const offlineOk = await page.getByRole("button", { name: /^Hear / }).nth(6).waitFor({ timeout: 20000 }).then(() => page.evaluate(() => !window.__beforeReload), () => false);
expect(offlineOk, "the guidebook really reloads (a fresh page) with no network, served by the service worker");
if (offlineOk) {
  const before = await page.evaluate(() => window.__arabicVoice.lastPlayback.length);
  await page.getByRole("button", { name: /^Hear / }).nth(6).click();
  const played = await page.waitForFunction((b) => window.__arabicVoice.lastPlayback.length > b, before, { timeout: 90000 }).then(() => true, () => false);
  const last = await page.evaluate(() => { const l = window.__arabicVoice.lastPlayback.at(-1); return l && { ...l, state: window.__arabicVoice.getVoiceState() }; });
  expect(played && last && !last.cached && last.samples > 12000, `offline: a new sentence is generated and played on-device (${last?.samples ?? 0} samples, ${last?.ms ?? "?"} ms, ${last?.state?.device})`);
}
if (realOffline) { spawn("npx", ["next", "start", "-p", "3000"], { detached: true, stdio: "ignore", env: { ...process.env, NODE_USE_ENV_PROXY: "1" } }).unref(); for (let i = 0; i < 60; i++) { if (await fetch(BASE).then((r) => r.ok, () => false)) break; await new Promise((r) => setTimeout(r, 500)); } }
else await ctx.setOffline(false);

// 7. Low-memory devices get a warning but can still choose.
const low = await browser.newContext(); await low.addInitScript(() => Object.defineProperty(navigator, "deviceMemory", { get: () => 1 }));
const lp2 = await low.newPage(); await lp2.addInitScript((s) => localStorage.setItem("speakara:learner:v1", s), seed); await share(lp2); await lp2.goto(`${BASE}/settings`);
expect(await lp2.getByText(/This device has little memory/).waitFor({ timeout: 15000 }).then(() => true, () => false), "a low-memory device is warned before downloading");
await low.close();

for (const e of new Set(errs)) { console.error("browser error:", e); }
console.log(JSON.stringify({ engine: ENGINE, version: browser.version(), device: st.device, dtype: st.dtype, generation: resp, notes }, null, 1));
await browser.close();
process.exit(failures ? 1 : 0);
