import { createHmac } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { allLessons, allSentences, allWords, COURSES, getCourse, lessonKey, wordKey } from "../content";
import { buildSession, type SessionPlan } from "../engine/plan";
import { gradeAttempts, GradeError, type Attempt } from "../engine/grade";
import { GEM_RULES, newAchievements, withDayOffset, weekKey } from "../engine/gamification";
import { buyStreakFreeze, completeSession, isLessonUnlocked, saveConversation, type SessionSummary } from "../state/actions";
import { buildDelta } from "../state/delta";
import { loadCloud } from "../state/persistence";
import { initialState, type Conversation, type LearnerState } from "../state/types";

export class ProgressError extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }

export type ProgressRequest =
  | { op: "session"; operationId: string; tzOffsetMin: number; plan: SessionPlan; attempts: Attempt[]; seconds: number }
  | { op: "freeze"; operationId: string }
  | { op: "conversation"; operationId: string; conversation: Conversation }
  | { op: "import"; operationId: string; tzOffsetMin: number; guest: LearnerState }
  | { op: "friend_claim"; operationId: string; friendId: string };
export interface ProgressResponse { state: LearnerState; version: number; summary?: SessionSummary; duplicate?: boolean }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const serverConfigured = () => !!(url && key && process.env.PROGRESS_SIGNING_SECRET);

/** A Supabase client that acts as the calling learner (their JWT), so RLS still applies to everything the server reads. */
export async function asLearner(token: string): Promise<{ db: SupabaseClient; userId: string }> {
  if (!url || !key) throw new ProgressError(503, "not_configured", "Accounts are not configured on this deployment.");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new ProgressError(401, "unauthenticated", "Your session has expired. Please log in again.");
  return { db, userId: data.user.id };
}

const clampOffset = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? Math.max(-840, Math.min(840, Math.round(n))) : 0);
const opId = (s: unknown) => { if (typeof s !== "string" || !/^[A-Za-z0-9_-]{8,80}$/.test(s)) throw new ProgressError(400, "bad_request", "Invalid operation id."); return s; };

/** Rebuilds a guest's device progress into something the server is willing to vouch for. */
export function sanitizeGuest(g: LearnerState, now: number): LearnerState {
  const s = initialState(now);
  let sessions = 0;
  for (const c of COURSES) {
    const words = new Set(allWords(c).map((w) => wordKey(c.id, w.id))), sentences = new Set(allSentences(c).map((x) => x.id));
    const order = allLessons(c).map((x) => ({ lessonId: x.lesson.id, unitIndex: c.units.indexOf(x.unit) }));
    const unlocked = Number.isInteger(g.unlockedUnits?.[c.id]) ? Math.max(0, Math.min(c.units.length - 1, g.unlockedUnits[c.id])) : 0;
    if (unlocked) s.unlockedUnits[c.id] = unlocked;
    order.forEach((o, i) => {
      const done = g.completed?.[lessonKey(c.id, o.lessonId)];
      if (done && isLessonUnlocked(s, c.id, order, i)) { const count = Math.max(1, Math.min(50, Math.floor(done.count) || 1)); sessions += count; s.completed[lessonKey(c.id, o.lessonId)] = { count, bestAccuracy: Math.max(0, Math.min(1, Number(done.bestAccuracy) || 0)), at: Math.min(now, Number(done.at) || now) }; }
    });
    for (const [k, it] of Object.entries(g.review ?? {})) if (words.has(k) && it) s.review[k] = { reps: Math.max(0, Math.min(50, it.reps | 0)), interval: Math.max(0, Math.min(365, it.interval | 0)), ease: Math.max(1.3, Math.min(2.8, Number(it.ease) || 2.3)), due: Number(it.due) || now, lapses: Math.max(0, it.lapses | 0), seen: Math.max(0, it.seen | 0), last: Math.min(now, Number(it.last) || now) };
    s.mistakes.push(...(g.mistakes ?? []).filter((m) => m.courseId === c.id && sentences.has(m.sentenceId)).slice(0, 60).map((m) => ({ courseId: c.id, sentenceId: m.sentenceId, at: now })));
    for (const u of c.units) if (u.story && g.stories?.[u.story.id] && u.lessons.every((l) => s.completed[lessonKey(c.id, l.id)])) { s.stories[u.story.id] = now; sessions++; }
  }
  const practice = Math.max(0, Math.min(sessions * 3, g.stats?.practice | 0));
  sessions += practice;
  // XP and gems cannot exceed what the verifiable sessions could have paid at the published maximum rates.
  s.xp = Math.max(0, Math.min(g.xp | 0, sessions * 25 + 20));
  s.gems = Math.max(0, Math.min(g.gems | 0, sessions * 20));
  const days = Math.max(1, Math.ceil((now - (Number(g.profile?.createdAt) || now)) / 86_400_000) + 1);
  const streak = Math.max(0, Math.min(g.streak?.count | 0, days, sessions));
  s.streak = { count: streak, lastDay: streak && /^\d{4}-\d{2}-\d{2}$/.test(g.streak?.lastDay ?? "") ? g.streak.lastDay : null, freezes: Math.max(0, Math.min(GEM_RULES.maxFreezes, g.streak?.freezes | 0)), longest: Math.max(streak, Math.min(g.streak?.longest | 0, days)) };
  if (!s.streak.lastDay) s.streak.count = 0;
  s.stats = { lessons: Object.values(s.completed).reduce((n, c) => n + c.count, 0), perfect: Math.min(g.stats?.perfect | 0, sessions), practice, minutes: Math.max(0, Math.min(sessions * 15, g.stats?.minutes | 0)), tutorTurns: 0 };
  if (s.xp > 0) s.xpEvents = [{ id: `import-${now.toString(36)}`, at: now, amount: Math.min(50, s.xp), source: "lesson" }];
  s.achievements = newAchievements(s, now);
  return s;
}

/** Validates one request, computes the new learner model on the server and applies it through a signed database call. */
export async function handleProgress(token: string, body: ProgressRequest, now = Date.now()): Promise<ProgressResponse> {
  const secret = process.env.PROGRESS_SIGNING_SECRET;
  if (!secret) throw new ProgressError(503, "not_configured", "Progress saving is not configured on this deployment.");
  const { db, userId } = await asLearner(token);
  const operationId = opId(body.operationId);
  const loaded = await loadCloud(db, userId, now);
  if (!loaded) throw new ProgressError(409, "no_profile", "Your profile is not ready yet. Please reload.");
  const prev = loaded.state;
  let next: LearnerState, summary: SessionSummary | undefined, kind: string, extra: Record<string, unknown> = {};

  if (body.op === "session") {
    const plan = body.plan;
    const course = COURSES.find((c) => c.id === plan?.courseId);
    if (!course) throw new ProgressError(400, "bad_request", "Unknown course.");
    const built = buildSession(course, plan);
    if (!built) throw new ProgressError(400, "bad_request", "That session does not exist.");
    if (plan.type === "lesson") {
      const order = allLessons(course).map((x) => ({ lessonId: x.lesson.id, unitIndex: course.units.indexOf(x.unit) }));
      if (!isLessonUnlocked(prev, course.id, order, order.findIndex((o) => o.lessonId === plan.lessonId))) throw new ProgressError(403, "locked", "That lesson is still locked.");
    }
    if (plan.type === "story") {
      const unit = course.units.find((u) => u.story?.id === plan.storyId)!;
      if (!unit.lessons.every((l) => prev.completed[lessonKey(course.id, l.id)])) throw new ProgressError(403, "locked", "Finish the unit to open its story.");
    }
    if (!Array.isArray(body.attempts) || body.attempts.length > 80) throw new ProgressError(400, "bad_request", "Invalid answers.");
    let result;
    try { result = gradeAttempts(course, built, body.attempts, Number(body.seconds) || 0); }
    catch (e) { if (e instanceof GradeError) throw new ProgressError(400, "incomplete", e.message); throw e; }
    if (result.total === 0) throw new ProgressError(400, "incomplete", "Answer at least one exercise to finish a session.");
    const done = withDayOffset(clampOffset(body.tzOffsetMin), () => completeSession(prev, result, now));
    next = done.state; summary = done.summary; kind = result.kind;
  } else if (body.op === "freeze") {
    next = buyStreakFreeze(prev); kind = "freeze";
    if (next === prev) throw new ProgressError(409, "not_allowed", "You need 50 gems and a free freeze slot.");
  } else if (body.op === "conversation") {
    const c = body.conversation;
    if (!c || typeof c.id !== "string" || !Array.isArray(c.messages) || c.messages.length > 60) throw new ProgressError(400, "bad_request", "Invalid conversation.");
    const clean: Conversation = { id: c.id.slice(0, 40), scenario: String(c.scenario).slice(0, 40), courseId: getCourse(c.courseId).id, at: prev.conversations.find((x) => x.id === c.id)?.at ?? now,
      messages: c.messages.map((m) => ({ role: m.role === "learner" ? "learner" as const : "tutor" as const, text: String(m.text).slice(0, 600), translation: m.translation?.slice(0, 600), correction: m.correction?.slice(0, 600), tip: m.tip?.slice(0, 600) })) };
    next = saveConversation(prev, clean, now); kind = "conversation";
  } else if (body.op === "import") {
    if (prev.xp > 0 || Object.keys(prev.completed).length) throw new ProgressError(409, "already_imported", "This account already has progress.");
    const guest = withDayOffset(clampOffset(body.tzOffsetMin), () => sanitizeGuest(body.guest, now));
    next = { ...guest, profile: prev.profile, conversations: prev.conversations }; kind = "import";
  } else if (body.op === "friend_claim") {
    const { data, error } = await db.rpc("friend_quests");
    if (error) throw new ProgressError(500, "database", error.message);
    const q = (data as { friend_id: string; combined_xp: number; target: number; claimed: boolean; week: string }[]).find((x) => x.friend_id === body.friendId);
    if (!q || q.claimed || q.combined_xp < q.target) throw new ProgressError(409, "not_allowed", "That friends quest isn’t ready to claim.");
    next = { ...prev, gems: prev.gems + 20 }; kind = "friend_claim"; extra = { friend_claim: { friend_id: q.friend_id, week: q.week } };
  } else throw new ProgressError(400, "bad_request", "Unknown operation.");

  const payload = JSON.stringify({ user_id: userId, operation_id: operationId, kind, base_version: loaded.version, issued_at: now, ...buildDelta(prev, next), ...extra });
  const signature = createHmac("sha256", secret).update(payload, "utf8").digest("hex");
  const { data, error } = await db.rpc("apply_progress", { p_payload: payload, p_signature: signature });
  if (error) {
    if (/too_fast/.test(error.message)) throw new ProgressError(429, "too_fast", "That was quick! Give it a few seconds and try again.");
    if (/stale_state/.test(error.message)) throw new ProgressError(409, "stale", "Your progress changed on another device. Please try again.");
    if (/already_imported/.test(error.message)) throw new ProgressError(409, "already_imported", "This account already has progress.");
    throw new ProgressError(500, "database", error.message);
  }
  if (data === "duplicate") return { state: prev, version: loaded.version, duplicate: true };
  const fresh = await loadCloud(db, userId, now);
  return { state: fresh?.state ?? next, version: fresh?.version ?? loaded.version + 1, summary };
}
export { weekKey };
