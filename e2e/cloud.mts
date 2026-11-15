/**
 * Integration test against a LIVE Supabase project and a running app server.
 * Needs two confirmed accounts. Usage:
 *   NODE_USE_ENV_PROXY=1 E2E_PASSWORD=… npx tsx e2e/cloud.mts [baseUrl]
 * Env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (read from .env.local if unset),
 *      E2E_EMAIL_A / E2E_EMAIL_B (default e2e-ana@speakara.test / e2e-ben@speakara.test), E2E_PASSWORD.
 * It resets nothing: run it against accounts created for testing. Account B is deleted at the end.
 */
import { readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getCourse } from "../src/lib/content";
import { buildSession, type SessionPlan } from "../src/lib/engine/plan";
import type { Attempt } from "../src/lib/engine/grade";
import type { Exercise } from "../src/lib/engine/exercises";
import { initialState } from "../src/lib/state/types";

try { for (const line of readFileSync(".env.local", "utf8").split("\n")) { const m = line.match(/^(NEXT_PUBLIC_[A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; } } catch { /* no env file */ }
const BASE = process.argv[2] ?? "http://localhost:3000";
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!, KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const PASSWORD = process.env.E2E_PASSWORD!;
let failures = 0;
const ok = (cond: unknown, msg: string) => { if (cond) console.log("• ok:", msg); else { failures++; console.error("✗ FAIL:", msg); } };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const right = (e: Exercise): Attempt => ({ id: e.id, answer: e.type === "choose" || e.type === "fill" ? { type: e.type, index: e.answer } : e.type === "match" ? { type: "match", mistakes: 0 } : e.type === "speak" ? { type: "speak", transcript: e.text } : { type: e.type, text: e.accepted[0] } });
const opId = () => `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

async function login(email: string): Promise<{ db: SupabaseClient; token: string; id: string }> {
  const db = createClient(URL_, KEY, { auth: { persistSession: false } });
  const { data, error } = await db.auth.signInWithPassword({ email, password: PASSWORD });
  if (error || !data.session) throw new Error(`login failed for ${email}: ${error?.message}`);
  return { db, token: data.session.access_token, id: data.user.id };
}
async function progress(token: string, body: object) {
  const r = await fetch(`${BASE}/api/progress`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  return { status: r.status, body: (await r.json()) as { error?: string; code?: string; duplicate?: boolean; summary?: { xp: number; perfect: boolean; streak: number; achievements: string[] }; state?: { xp: number; gems: number; streak: { count: number; freezes: number }; completed: Record<string, unknown>; achievements: Record<string, number>; conversations: unknown[]; review: Record<string, unknown> } } };
}

const course = getCourse("es-en");
const lessonPlan = (lessonId: string, seed: number): SessionPlan => ({ type: "lesson", courseId: "es-en", lessonId, seed, speech: true, reviewWordIds: [] });
const answers = (plan: SessionPlan) => buildSession(course, plan)!.exercises.map(right);

const A = await login(process.env.E2E_EMAIL_A ?? "e2e-ana@speakara.test");
const B = await login(process.env.E2E_EMAIL_B ?? "e2e-ben@speakara.test");
ok(true, "both accounts log in with email and password");
ok((await createClient(URL_, KEY, { auth: { persistSession: false } }).auth.signInWithPassword({ email: "e2e-ana@speakara.test", password: "wrong-password" })).error, "wrong password is rejected");

const before = (await A.db.from("profiles").select("xp, gems, version, username").eq("id", A.id).single()).data!;
ok(before.username, "sign-up trigger created a profile row readable by its owner");

console.log("\n— direct writes are refused —");
const r1 = await A.db.from("profiles").update({ xp: 99999 }).eq("id", A.id).select();
ok(r1.error, `learner cannot set their own XP (${r1.error?.message?.slice(0, 50)})`);
ok((await A.db.from("profiles").update({ role: "admin" }).eq("id", A.id).select()).error, "learner cannot make themselves admin");
ok((await A.db.from("xp_events").insert({ id: "forged", user_id: A.id, amount: 50, source: "lesson" })).error, "learner cannot insert XP events");
ok((await A.db.from("lesson_completions").insert({ user_id: A.id, course_id: "es-en", lesson_id: "es3.4", best_accuracy: 1 })).error, "learner cannot insert lesson completions");
ok((await A.db.from("user_achievements").insert({ user_id: A.id, achievement_id: "streak-30" })).error, "learner cannot insert achievements");
ok((await A.db.rpc("apply_progress", { p_payload: JSON.stringify({ user_id: A.id, operation_id: "forged-op-1", kind: "lesson", base_version: before.version, issued_at: Date.now(), profile: { xp: 5000 } }), p_signature: "0".repeat(64) })).error, "unsigned progress payload is rejected by the database");
ok((await A.db.rpc("admin_overview")).error, "learner cannot call admin functions");
ok((await A.db.from("profiles").update({ display_name: "Ana Test", is_public: true, onboarded: true }).eq("id", A.id).select()).data?.length === 1, "learner can edit their own non-reward profile fields");

console.log("\n— the server is the authority —");
ok((await progress("not-a-token", { op: "freeze", operationId: opId() })).status === 401, "invalid session token → 401");
const p1 = lessonPlan("es1.1", 4242); const id1 = opId();
const alreadyDone = !!(await A.db.from("lesson_completions").select("lesson_id").eq("user_id", A.id).eq("lesson_id", "es1.1").maybeSingle()).data;
const s1 = await progress(A.token, { op: "session", operationId: id1, tzOffsetMin: 0, plan: p1, attempts: answers(p1), seconds: 95 });
ok(s1.status === 200 && s1.body.summary, `server graded a lesson (${s1.status} ${s1.body.error ?? ""})`);
ok(s1.body.summary?.xp === (alreadyDone ? 15 : 20) && s1.body.summary?.perfect, `server awarded the formula XP: ${s1.body.summary?.xp}`);
const after1 = (await A.db.from("profiles").select("xp, gems, version, streak_count").eq("id", A.id).single()).data!;
ok(after1.xp === before.xp + s1.body.summary!.xp && after1.version === before.version + 1 && after1.streak_count >= 1, "database reflects the award exactly once");
ok(((await A.db.from("review_items").select("word_key").eq("user_id", A.id)).data?.length ?? 0) >= 5, "review schedule rows were written");
const replay = await progress(A.token, { op: "session", operationId: id1, tzOffsetMin: 0, plan: p1, attempts: answers(p1), seconds: 95 });
ok(replay.status === 200 && replay.body.duplicate, "replaying the same request awards nothing (duplicate)");
ok((await A.db.from("profiles").select("xp").eq("id", A.id).single()).data!.xp === after1.xp, "XP unchanged after replay");
const fast = await progress(A.token, { op: "session", operationId: opId(), tzOffsetMin: 0, plan: lessonPlan("es1.2", 7), attempts: answers(lessonPlan("es1.2", 7)), seconds: 60 });
ok(fast.status === 429, `back-to-back sessions are throttled (${fast.status})`);
// A lesson the account has not reached. Account B is new on every run, so the last Spanish lesson is always locked for it.
const lockedPlan = lessonPlan("es3.4", 7);
const locked = await progress(B.token, { op: "session", operationId: opId(), tzOffsetMin: 0, plan: lockedPlan, attempts: answers(lockedPlan), seconds: 60 });
ok(locked.status === 403, `a locked lesson cannot be completed (${locked.status})`);
const partial = await progress(A.token, { op: "session", operationId: opId(), tzOffsetMin: 0, plan: p1, attempts: answers(p1).slice(0, 3), seconds: 60 });
ok(partial.status === 400, `an incomplete answer sheet is rejected (${partial.status})`);
const wrongSeed = lessonPlan("es1.2", 1); const mismatched = await progress(A.token, { op: "session", operationId: opId(), tzOffsetMin: 0, plan: wrongSeed, attempts: answers(lessonPlan("es1.2", 999)), seconds: 60 });
ok(mismatched.status === 400 || (mismatched.status === 429), `answers for a different session do not grade (${mismatched.status})`);
const noGems = await progress(B.token, { op: "freeze", operationId: opId() });   // B is new and has no gems
ok(noGems.status === 409, `a streak freeze cannot be bought without 50 gems (${noGems.status})`);
ok((await progress(A.token, { op: "import", operationId: opId(), tzOffsetMin: 0, guest: { ...initialState(Date.now()), xp: 5000 } })).status === 409, "import is refused once an account has progress");

console.log("  (waiting 11 s for the session throttle)"); await sleep(11_000);
const p2 = lessonPlan("es1.2", 31337); const wrongFirst = answers(p2).map((a, i) => (i === 0 ? { id: a.id, answer: { type: "choose" as const, index: -1 } } : a));
const s2 = await progress(A.token, { op: "session", operationId: opId(), tzOffsetMin: 330, plan: p2, attempts: wrongFirst, seconds: 120 });
ok(s2.status === 200 && s2.body.summary && !s2.body.summary.perfect, `second lesson graded with one miss: +${s2.body.summary?.xp} XP (${s2.body.error ?? "ok"})`);
ok(s2.body.state?.completed["es-en:es1.2"], "returned state includes the new completion");
const conv = await progress(A.token, { op: "conversation", operationId: opId(), conversation: { id: "c-e2e", scenario: "restaurant", courseId: "es-en", at: Date.now(), messages: [{ role: "tutor", text: "¿Una mesa para dos?" }, { role: "learner", text: "Sí, por favor" }, { role: "tutor", text: "Muy bien." }] } });
ok(conv.status === 200 && (await A.db.from("tutor_conversations").select("id").eq("user_id", A.id)).data?.some((c) => c.id === "c-e2e"), "tutor transcript is stored through the server");

console.log("\n— privacy between learners —");
ok((await B.db.from("lesson_completions").select("*").eq("user_id", A.id)).data?.length === 0, "B cannot read A's completions");
ok((await B.db.from("xp_events").select("*")).data?.every((e) => e.user_id === B.id), "B sees only their own XP events");
ok((await B.db.from("profiles").select("id")).data?.length === 1, "B sees only their own profile row");
ok((await B.db.from("tutor_conversations").select("id").eq("user_id", A.id)).data?.length === 0, "B cannot read A's tutor transcripts");
const board = (await B.db.rpc("weekly_leaderboard", { max_rows: 30 })).data as { user_id: string; display_name: string; weekly_xp: number }[];
ok(board?.some((r) => r.user_id === A.id && r.weekly_xp >= 20) && Object.keys(board[0]).length === 3, "leaderboard is backed by stored XP and exposes only id, name and weekly XP");
const found = (await B.db.rpc("find_profiles", { q: "e2e_a" })).data as { id: string }[];
ok(found?.some((p) => p.id === A.id), "user discovery finds A by username");
await B.db.from("follows").delete().eq("follower_id", B.id); await A.db.from("follows").delete().eq("follower_id", A.id);
ok(!(await B.db.from("follows").insert({ follower_id: B.id, followee_id: A.id })).error, "B follows A");
ok((await B.db.from("follows").insert({ follower_id: A.id, followee_id: B.id })).error, "B cannot create a follow on A's behalf");
await A.db.from("follows").insert({ follower_id: A.id, followee_id: B.id });
const fq = (await B.db.rpc("friend_quests")).data as { friend_id: string; combined_xp: number; target: number }[];
ok(fq?.length === 1 && fq[0].combined_xp >= 20, `mutual follow creates a friends quest (${fq?.[0]?.combined_xp}/${fq?.[0]?.target} XP)`);
{ const claim = (await progress(B.token, { op: "friend_claim", operationId: opId(), friendId: A.id })).status;
  if (fq[0].combined_xp < fq[0].target) ok(claim === 409, "friends quest reward cannot be claimed early");
  else { ok(claim === 200, "a completed friends quest pays out"); ok((await progress(B.token, { op: "friend_claim", operationId: opId(), friendId: A.id })).status === 409, "a friends quest pays out only once"); } }
await A.db.from("profiles").update({ is_public: false }).eq("id", A.id);
ok(((await B.db.rpc("find_profiles", { q: "e2e_a" })).data as unknown[]).length === 0, "a private profile is not discoverable");
ok(((await B.db.rpc("weekly_leaderboard", { max_rows: 30 })).data as { user_id: string; display_name: string }[]).find((r) => r.user_id === A.id)?.display_name === "Private learner", "a private profile is anonymised on the leaderboard");
await A.db.from("profiles").update({ is_public: true }).eq("id", A.id);

console.log("\n— guest progress import is validated —");
const guest = { ...initialState(Date.now() - 86_400_000), xp: 777777, gems: 55555, completed: { "es-en:es1.1": { count: 1, bestAccuracy: 0.9, at: Date.now() - 3600_000 }, "es-en:es3.4": { count: 1, bestAccuracy: 1, at: Date.now() } }, streak: { count: 300, lastDay: new Date().toISOString().slice(0, 10), freezes: 9, longest: 300 } };
const bHas = (await B.db.from("profiles").select("xp, imported").eq("id", B.id).single()).data!;
const imp = await progress(B.token, { op: "import", operationId: `import-${B.id.replace(/-/g, "").slice(0, 24)}`, tzOffsetMin: 0, guest });
if (bHas.xp === 0 && !bHas.imported) {
  ok(imp.status === 200 && imp.body.state!.xp <= 45 && imp.body.state!.gems <= 20 && imp.body.state!.streak.count <= 1 && !imp.body.state!.completed["es-en:es3.4"] && !!imp.body.state!.completed["es-en:es1.1"], `fabricated guest totals were cut down to what is verifiable (xp ${imp.body.state?.xp}, gems ${imp.body.state?.gems})`);
  ok((await progress(B.token, { op: "import", operationId: opId(), tzOffsetMin: 0, guest })).status === 409, "a second import is refused");
} else ok(imp.status === 409 || imp.body.duplicate, "import refused for an account that already imported");

console.log("\n— account deletion —");
ok(!(await B.db.rpc("delete_my_account")).error, "B deletes their account");
ok((await createClient(URL_, KEY, { auth: { persistSession: false } }).auth.signInWithPassword({ email: process.env.E2E_EMAIL_B ?? "e2e-ben@speakara.test", password: PASSWORD })).error, "deleted account can no longer log in");
ok((await A.db.from("follows").select("*")).data?.length === 0, "deleting B removed the follow rows");

console.log(failures ? `\n${failures} failure(s)` : "\nAll live-backend checks passed");
process.exit(failures ? 1 : 0);
