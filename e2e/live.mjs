/**
 * Speakara Live end-to-end checks against a LOCAL stack (never production):
 *   bash e2e/live/stack.sh > /tmp/stack.env && source /tmp/stack.env && npx next build && npx next start -p 3100
 *   source /tmp/stack.env && node e2e/live.mjs http://127.0.0.1:3100
 * Real Next.js routes and the real migration in Postgres; LiveKit is not running, so media connections are expected to
 * fail and the tests check that failure is handled safely (clear message, minutes settled, nothing left running).
 * Real audio/video, Gemini and Anam need real keys and are covered by agent/README.md's manual checklist.
 */
import { createHmac } from "node:crypto";
import { readFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fakeToken } from "./live/fake-supabase.mjs";

const require = createRequire(import.meta.url);
const { chromium, webkit } = require("playwright");
const BASE = process.argv[2] ?? "http://127.0.0.1:3100";
const API = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54400";
const OUT = process.env.E2E_SHOTS ?? "/tmp/live-shots"; mkdirSync(OUT, { recursive: true });
const USERS = { ana: "00000000-0000-4000-8000-0000000000a1", ben: "00000000-0000-4000-8000-0000000000b1", cara: "00000000-0000-4000-8000-0000000000c1" };
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
let failures = 0; const results = []; let step = "start"; const openPages = [];
const check = (name, ok, extra = "") => { results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`); if (!ok) failures++; };
const sql = (q) => execFileSync("psql", ["-h", process.env.PGHOST, "-p", process.env.PGPORT, "-U", "postgres", "-tAc", q], { encoding: "utf8" }).trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browserType = process.env.E2E_BROWSER === "webkit" ? webkit : chromium;
const browser = await browserType.launch(browserType === chromium ? { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] } : {});

async function session(who, viewport = { width: 1280, height: 900 }) {
  const ctx = await browser.newContext({ viewport, ...(browserType === chromium ? { permissions: ["microphone", "camera"] } : {}) });
  if (!who) await ctx.addInitScript(() => localStorage.setItem("speakara:learner:v1", JSON.stringify({ version: 1, profile: { name: "Guest", courseId: "es-en", onboarded: true, sound: false, speech: true, motion: false, dailyGoalXp: 20 } })));
  if (who) {
    const token = fakeToken(USERS[who], `${who}@speakara.test`);
    const s = { access_token: token, refresh_token: "e2e", token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400,
      user: { id: USERS[who], email: `${who}@speakara.test`, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {} } };
    await ctx.addInitScript(([k, v]) => { localStorage.setItem(k, v); }, [`sb-${new URL(API).hostname.split(".")[0]}-auth-token`, JSON.stringify(s)]);
  }
  const page = await ctx.newPage(); openPages.push([who ?? "guest", page]);
  page.on("pageerror", (e) => check(`no page errors (${who ?? "guest"})`, false, e.message));
  return { ctx, page };
}
const api = (path, who, body) => fetch(`${BASE}${path}`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${fakeToken(USERS[who])}` }, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, json: await r.json() }));
const worker = (body, secret = process.env.LIVE_WORKER_SECRET) => { const raw = JSON.stringify(body); const ts = String(Date.now()); return fetch(`${BASE}/api/live/worker`, { method: "POST", headers: { "content-type": "application/json", "x-speakara-ts": ts, "x-speakara-signature": createHmac("sha256", secret).update(`${ts}.${raw}`).digest("hex") }, body: raw }).then(async (r) => ({ status: r.status, json: await r.json() })); };
const usedSeconds = () => Number(sql("select coalesce(sum(used_seconds),0) from public.avatar_usage"));

try {
  // ---------- guests ----------
  {
    const { ctx, page } = await session(null);
    await page.goto(`${BASE}/live/companion`);
    await page.getByText("Live practice needs a free account").waitFor({ timeout: 15000 });
    check("guest sees the sign-up gate on the AI companion", await page.getByRole("link", { name: "Create a free account" }).first().isVisible());
    await page.goto(`${BASE}/live/community`); await page.getByText("Live practice needs a free account").waitFor();
    check("guest sees the sign-up gate on the community exchange", true);
    await ctx.close();
  }

  // ---------- AI companion (staff learner) ----------
  {
    const { ctx, page } = await session("ana");
    await page.goto(`${BASE}/live`);
    await page.getByText("AI companion").first().waitFor({ timeout: 15000 });
    await page.getByText("28 min left").waitFor({ timeout: 10000 });
    check("hub shows the shared monthly allowance (28 of Anam's 30 minutes)", true);
    await page.screenshot({ path: `${OUT}/hub-desktop.png` });
    await page.getByRole("link", { name: /AI companion/ }).click();
    await page.getByText("Choose your companion").waitFor();
    check("staff preview notice shown", await page.getByText("limited preview").isVisible());
    await page.getByRole("button", { name: /Playful/ }).click();
    await page.getByRole("button", { name: /Strict/ }).click();
    await page.getByRole("button", { name: /Restaurant/ }).click();
    await page.getByLabel("Remember what I learn").check();
    await sleep(500);
    check("memory consent stored", sql(`select granted from public.consents where user_id = '${USERS.ana}' and kind = 'ai_memory'`) === "t");
    await page.screenshot({ path: `${OUT}/companion-setup-desktop.png`, fullPage: true });
    const before = usedSeconds();
    await page.getByRole("button", { name: "Start conversation" }).click();
    await page.getByText("We couldn’t connect").waitFor({ timeout: 20000 });
    check("failed media connection is reported to the learner", true);
    await sleep(500);
    const s = sql(`select status || ',' || charged_seconds || ',' || (config->>'personality') || ',' || (config->>'scenario') from public.call_sessions where user_id = '${USERS.ana}' order by started_at desc limit 1`);
    check("session was reserved with the chosen settings and then ended", s === "ended,165,playful,restaurant", s);
    check("unconfirmed room close keeps the full charge (no undercounting)", usedSeconds() - before === 165, `${usedSeconds() - before}s`);
    check("no session left active", sql("select count(*) from public.call_sessions where status = 'active'") === "0");
    check("preferences saved", sql(`select teaching_style from public.avatar_preferences where user_id = '${USERS.ana}'`) === "strict");
    await page.screenshot({ path: `${OUT}/companion-connect-failed.png` });
    await ctx.close();
  }
  {
    const r = await api("/api/companion/start", "ben", { avatar_id: "071b0286-4cce-4808-bee2-e642f1062de3", companion_name: "Kiko", personality: "friendly", teaching_style: "balanced", voice: "Puck", target_lang: "es", level: 1, scenario: "meet" });
    check("non-staff learners are refused during the limited preview", r.status === 403 && r.json.code === "preview_only", JSON.stringify(r.json));
    const bad = await api("/api/companion/start", "ana", { avatar_id: "my-own-face", companion_name: "X", personality: "friendly", teaching_style: "balanced", voice: "Puck", target_lang: "es", level: 1, scenario: "meet" });
    check("custom (non-catalog) avatars are refused", bad.status === 400, JSON.stringify(bad.json));
    const anon = await fetch(`${BASE}/api/companion/start`, { method: "POST", body: "{}" });
    check("unauthenticated start refused", anon.status === 401);
  }

  // ---------- worker endpoint ----------
  {
    const start = await api("/api/companion/start", "ana", { avatar_id: "071b0286-4cce-4808-bee2-e642f1062de3", companion_name: "Kiko", personality: "calm", teaching_style: "gentle", voice: "Kore", target_lang: "es", level: 2, scenario: "hotel" });
    check("start returns a five-minute room token", start.status === 200 && typeof start.json.token === "string" && start.json.room_name.startsWith("ai_"), JSON.stringify({ ...start.json, token: "…" }));
    const second = await api("/api/companion/start", "ana", { avatar_id: "071b0286-4cce-4808-bee2-e642f1062de3", companion_name: "Kiko", personality: "calm", teaching_style: "gentle", voice: "Kore", target_lang: "es", level: 2, scenario: "hotel" });
    check("a second simultaneous avatar session is refused", second.status === 409 && second.json.code === "avatar_busy", JSON.stringify(second.json));
    const forged = await worker({ op: "claim", session_id: start.json.session_id, room_name: start.json.room_name }, "wrong-secret-wrong-secret-wrong-secret");
    check("worker requests with the wrong secret are refused", forged.status === 401);
    const claim = await worker({ op: "claim", session_id: start.json.session_id, room_name: start.json.room_name });
    check("worker claims the session and gets its settings", claim.status === 200 && claim.json.config?.scenario === "hotel" && claim.json.seconds_left > 150, JSON.stringify(claim.json).slice(0, 200));
    const again = await worker({ op: "claim", session_id: start.json.session_id, room_name: start.json.room_name });
    check("a session can only be claimed once (no re-dispatch)", again.status === 409);
    const report = { summary: "Muy bien.", vocabulary: [{ term: "la llave", meaning: "the key" }], mistakes: [{ said: "yo es", better: "yo soy", why: "Use ser with yo." }], pronunciation: [], next_steps: ["Practise ser."], fluency: 3 };
    const rep = await worker({ op: "report", session_id: start.json.session_id, room_name: start.json.room_name, report, memory: [{ kind: "vocabulary", content: report.vocabulary[0] }, { kind: "mistake", content: report.mistakes[0] }] });
    check("worker report settles the session", rep.status === 200 && rep.json.status === "ended", JSON.stringify(rep.json));
    check("consented memory saved from the report", sql(`select count(*) from public.ai_memory where user_id = '${USERS.ana}'`) === "2");

    const { ctx, page } = await session("ana", { width: 390, height: 844 });
    await page.goto(`${BASE}/live/memory`);
    await page.getByText("la llave — the key").waitFor({ timeout: 15000 });
    check("learning memory lists saved words and corrections", await page.getByText("yo es → yo soy").isVisible());
    await page.screenshot({ path: `${OUT}/memory-mobile.png`, fullPage: true });
    await page.getByRole("button", { name: "Delete" }).first().click();
    await sleep(600);
    check("learner deletes one memory item", sql(`select count(*) from public.ai_memory where user_id = '${USERS.ana}'`) === "1");
    await page.getByRole("button", { name: "Delete everything" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete everything" }).click();
    await page.getByText("Nothing saved yet").waitFor();
    check("learner deletes all memory", sql(`select count(*) from public.ai_memory where user_id = '${USERS.ana}'`) === "0");
    await ctx.close();
  }

  // ---------- allowance exhausted ----------
  {
    sql("update private.live_config set value = 300 where name = 'avatar_monthly_seconds'");
    const { ctx, page } = await session("ana", { width: 390, height: 844 });
    await page.goto(`${BASE}/live/companion`);
    await page.getByRole("button", { name: "No free minutes left this month" }).waitFor({ timeout: 15000 });
    check("start is disabled when the monthly allowance is spent", await page.getByRole("button", { name: "No free minutes left this month" }).isDisabled());
    const r = await api("/api/companion/start", "ana", { avatar_id: "071b0286-4cce-4808-bee2-e642f1062de3", companion_name: "Kiko", personality: "calm", teaching_style: "gentle", voice: "Kore", target_lang: "es", level: 2, scenario: "hotel" });
    check("server refuses to start past the allowance", r.status === 429 && r.json.code === "quota_exhausted");
    await page.screenshot({ path: `${OUT}/companion-quota-exhausted-mobile.png`, fullPage: true });
    sql("update private.live_config set value = 1680 where name = 'avatar_monthly_seconds'");
    await ctx.close();
  }

  // ---------- community exchange ----------
  {
    const used = usedSeconds();
    const a = await session("ana"); const b = await session("ben", { width: 390, height: 844 }); const c = await session("cara", { width: 390, height: 844 });
    const setup = async (p, native, target, adult) => {
      step = `community setup ${native}->${target}`;
      await p.goto(`${BASE}/live/community`); await p.getByText("Your languages").waitFor({ timeout: 15000 });
      await p.getByLabel("I speak").selectOption(native); await p.getByLabel("I’m learning").selectOption(target);
      await p.getByRole("button", { name: "Food" }).click();
      await p.getByLabel("I agree to the community rules").check(); if (adult) await p.getByLabel("I am 18 or older").check();
    };
    await setup(c.page, "en", "es", false);
    check("under-18 / unconfirmed learners cannot continue to matching", await c.page.getByRole("button", { name: "Continue" }).isDisabled());
    await c.page.screenshot({ path: `${OUT}/community-setup-mobile.png`, fullPage: true });
    await setup(a.page, "en", "es", true); await a.page.getByRole("button", { name: "Continue" }).click();
    await setup(b.page, "es", "en", true); await b.page.getByRole("button", { name: "Continue" }).click();
    await a.page.getByRole("button", { name: "Find a partner" }).click();
    await a.page.getByText("Looking for a partner…").waitFor();
    await b.page.getByRole("button", { name: "Find a partner" }).click();
    await a.page.getByText("Ben wants to practise with you").waitFor({ timeout: 10000 });
    await b.page.getByText("Ana wants to practise with you").waitFor({ timeout: 10000 });
    check("reciprocal learners both receive an invitation", true);
    check("no room exists before both accept", sql("select count(*) from public.matches where room_name is not null") === "0");
    await b.page.screenshot({ path: `${OUT}/community-invitation-mobile.png` });
    step = "community accept";
    await a.page.getByRole("button", { name: "Accept" }).click();
    await a.page.getByText("Waiting for Ben to accept…").waitFor({ timeout: 8000 });
    await b.page.getByRole("button", { name: "Accept" }).click();
    await b.page.getByText("We couldn’t connect").waitFor({ timeout: 20000 });
    await a.page.getByText(/We couldn’t connect|This call has ended/).waitFor({ timeout: 20000 });
    check("after mutual acceptance the call starts; a failed connection is reported and the partner is told", true);
    await sleep(1500);
    check("the failed call is closed in the database", sql("select count(*) from public.matches where status = 'active'") === "0");
    check("community calls used no avatar minutes", usedSeconds() === used);
    // decline path
    await a.page.getByRole("button", { name: "Find a partner" }).click();
    await b.page.reload(); await b.page.getByRole("button", { name: "Continue" }).click().catch(() => {});
    await b.page.getByRole("button", { name: "Find a partner" }).click();
    await b.page.getByRole("button", { name: "Decline" }).click({ timeout: 10000 });
    await a.page.getByText("That invitation was declined").waitFor({ timeout: 10000 });
    check("a declined invitation is shown to the other learner", true);
    for (const s of [a, b, c]) await s.ctx.close();
  }

  // ---------- layout and accessibility ----------
  for (const width of [360, 768, 1280]) {
    const { ctx, page } = await session("ana", { width, height: 900 });
    for (const path of ["/live", "/live/companion", "/live/community", "/live/memory"]) {
      await page.goto(`${BASE}${path}`); await sleep(1500);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`${path} at ${width}px has no horizontal overflow`, overflow <= 0, `${overflow}px`);
      await page.addScriptTag({ content: AXE });
      const v = await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations.filter((x) => ["serious", "critical"].includes(x.impact)).map((x) => `${x.id} (${x.nodes.length})`));
      check(`${path} at ${width}px has no serious accessibility violations`, v.length === 0, v.join(", "));
      const small = await page.evaluate(() => [...document.querySelectorAll("main button, main a, main select, main input[type=checkbox]")].filter((e) => { const r = (e.closest("label") ?? e).getBoundingClientRect(); return r.width > 0 && (r.height < 44 && r.width < 44); }).length);
      check(`${path} at ${width}px touch targets are at least 44px`, small === 0, `${small} small`);
    }
    await ctx.close();
  }
} catch (e) {
  check("test run completed", false, `${step}: ${e.message.split("\n")[0]}`);
  for (const [who, p] of openPages) await p.screenshot({ path: `${OUT}/failure-${who}-${openPages.indexOf(openPages.find((x) => x[1] === p))}.png` }).catch(() => {});
}
finally { await browser.close(); }
console.log(results.join("\n"));
console.log(failures ? `\n${failures} FAILED` : `\nALL ${results.length} LIVE CHECKS PASSED`);
process.exit(failures ? 1 : 0);
