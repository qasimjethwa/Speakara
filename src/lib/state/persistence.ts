import type { SupabaseClient } from "@supabase/supabase-js";
import { initialState, type LearnerState } from "./types";

const LOCAL_KEY = "speakara:learner:v1";
export function loadLocal(now: number): LearnerState {
  try { const raw = localStorage.getItem(LOCAL_KEY); if (raw) { const s = JSON.parse(raw) as LearnerState; if (s.version === 1) return { ...initialState(now), ...s, profile: { ...initialState(now).profile, ...s.profile } }; } } catch { /* storage blocked or corrupt: start fresh */ }
  return initialState(now);
}
export function saveLocal(s: LearnerState) { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(s)); } catch { /* private mode */ } }
export function clearLocal() { try { localStorage.removeItem(LOCAL_KEY); } catch { /* ignore */ } }

const iso = (t: number) => new Date(t).toISOString();
const ms = (s: string) => new Date(s).getTime();
function must<T>(r: { data: T | null; error: { message: string } | null }): T { if (r.error) throw new Error(r.error.message); return r.data as T; }

/** Reads the learner model from Supabase's relational tables. Returns null if the profile row does not exist yet. */
export async function loadCloud(db: SupabaseClient, userId: string, now: number): Promise<LearnerState | null> {
  const [p, lc, cu, sc, ri, mi, xe, qd, ua, tc] = await Promise.all([
    db.from("profiles").select("*").eq("id", userId).maybeSingle(),
    db.from("lesson_completions").select("*").eq("user_id", userId),
    db.from("course_unlocks").select("*").eq("user_id", userId),
    db.from("story_completions").select("*").eq("user_id", userId),
    db.from("review_items").select("*").eq("user_id", userId),
    db.from("mistakes").select("*").eq("user_id", userId),
    db.from("xp_events").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(400),
    db.from("quest_days").select("*").eq("user_id", userId).order("day", { ascending: false }).limit(1),
    db.from("user_achievements").select("*").eq("user_id", userId),
    db.from("tutor_conversations").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
  ]);
  const prof = must(p);
  if (!prof) return null;
  const base = initialState(now);
  const s: LearnerState = {
    ...base,
    profile: { ...base.profile, name: prof.display_name ?? "", username: prof.username ?? "", nativeLang: prof.native_lang, courseId: prof.course_id, goal: prof.goal ?? "",
      level: prof.level, dailyGoalXp: prof.daily_goal_xp, onboarded: prof.onboarded, ...(prof.settings ?? {}), createdAt: ms(prof.created_at) },
    xp: prof.xp, gems: prof.gems,
    streak: { count: prof.streak_count, lastDay: prof.streak_last_day, freezes: prof.streak_freezes, longest: prof.longest_streak },
    stats: { ...base.stats, ...(prof.stats ?? {}) },
  };
  for (const r of must(lc) ?? []) s.completed[`${r.course_id}:${r.lesson_id}`] = { count: r.count, bestAccuracy: r.best_accuracy, at: ms(r.completed_at) };
  for (const r of must(cu) ?? []) s.unlockedUnits[r.course_id] = r.unit_index;
  for (const r of must(sc) ?? []) s.stories[r.story_id] = ms(r.completed_at);
  for (const r of must(ri) ?? []) s.review[r.word_key] = { reps: r.reps, interval: r.interval_days, ease: r.ease, due: ms(r.due_at), lapses: r.lapses, seen: r.seen, last: ms(r.last_at) };
  s.mistakes = (must(mi) ?? []).map((r) => ({ courseId: r.course_id, sentenceId: r.sentence_id, at: ms(r.created_at) }));
  s.xpEvents = (must(xe) ?? []).map((r) => ({ id: r.id, at: ms(r.created_at), amount: r.amount, source: r.source })).reverse();
  const q = (must(qd) ?? [])[0]; if (q) s.quests = { day: q.day, items: q.items };
  for (const r of must(ua) ?? []) s.achievements[r.achievement_id] = ms(r.earned_at);
  s.conversations = (must(tc) ?? []).map((r) => ({ id: r.id, scenario: r.scenario, courseId: r.course_id, at: ms(r.created_at), messages: r.messages }));
  return s;
}

/** Writes only what changed between two learner models. Each table write is independent and idempotent (upserts). */
export async function saveCloud(db: SupabaseClient, userId: string, prev: LearnerState, next: LearnerState): Promise<void> {
  const ops: PromiseLike<{ error: { message: string } | null }>[] = [];
  const changed = <K extends keyof LearnerState>(k: K) => prev[k] !== next[k];
  if (changed("profile") || changed("xp") || changed("gems") || changed("streak") || changed("stats")) {
    const { name, username, nativeLang, courseId, goal, level, dailyGoalXp, onboarded, sound, speech, motion } = next.profile;
    ops.push(db.from("profiles").update({ display_name: name, ...(username ? { username } : {}), native_lang: nativeLang, course_id: courseId, goal, level, daily_goal_xp: dailyGoalXp, onboarded,
      settings: { sound, speech, motion }, xp: next.xp, gems: next.gems, streak_count: next.streak.count, streak_last_day: next.streak.lastDay, streak_freezes: next.streak.freezes,
      longest_streak: next.streak.longest, stats: next.stats }).eq("id", userId));
  }
  const diff = <T,>(a: Record<string, T>, b: Record<string, T>) => Object.entries(b).filter(([k, v]) => a[k] !== v);
  const split = (k: string) => { const i = k.indexOf(":"); return [k.slice(0, i), k.slice(i + 1)]; };
  const comp = diff(prev.completed, next.completed).map(([k, v]) => ({ user_id: userId, course_id: split(k)[0], lesson_id: split(k)[1], count: v.count, best_accuracy: v.bestAccuracy, completed_at: iso(v.at) }));
  if (comp.length) ops.push(db.from("lesson_completions").upsert(comp));
  const unl = diff(prev.unlockedUnits, next.unlockedUnits).map(([k, v]) => ({ user_id: userId, course_id: k, unit_index: v }));
  if (unl.length) ops.push(db.from("course_unlocks").upsert(unl));
  const sto = diff(prev.stories, next.stories).map(([k, v]) => ({ user_id: userId, story_id: k, completed_at: iso(v) }));
  if (sto.length) ops.push(db.from("story_completions").upsert(sto));
  const rev = diff(prev.review, next.review).map(([k, v]) => ({ user_id: userId, word_key: k, reps: v.reps, interval_days: v.interval, ease: v.ease, due_at: iso(v.due), lapses: v.lapses, seen: v.seen, last_at: iso(v.last) }));
  if (rev.length) ops.push(db.from("review_items").upsert(rev));
  const ach = diff(prev.achievements, next.achievements).map(([k, v]) => ({ user_id: userId, achievement_id: k, earned_at: iso(v) }));
  if (ach.length) ops.push(db.from("user_achievements").upsert(ach));
  if (changed("xpEvents")) {
    const seen = new Set(prev.xpEvents.map((e) => e.id));
    const rows = next.xpEvents.filter((e) => !seen.has(e.id)).map((e) => ({ id: e.id, user_id: userId, amount: e.amount, source: e.source, created_at: iso(e.at) }));
    if (rows.length) ops.push(db.from("xp_events").upsert(rows));
  }
  if (changed("mistakes")) {
    const key = (m: { courseId: string; sentenceId: string }) => `${m.courseId}:${m.sentenceId}`;
    const now = new Set(next.mistakes.map(key)), before = new Set(prev.mistakes.map(key));
    const add = next.mistakes.filter((m) => !before.has(key(m))).map((m) => ({ user_id: userId, course_id: m.courseId, sentence_id: m.sentenceId, created_at: iso(m.at) }));
    if (add.length) ops.push(db.from("mistakes").upsert(add));
    for (const m of prev.mistakes.filter((x) => !now.has(key(x)))) ops.push(db.from("mistakes").delete().eq("user_id", userId).eq("course_id", m.courseId).eq("sentence_id", m.sentenceId));
  }
  if (changed("quests") && next.quests.day) ops.push(db.from("quest_days").upsert({ user_id: userId, day: next.quests.day, items: next.quests.items }));
  if (changed("conversations")) {
    const rows = next.conversations.filter((c) => prev.conversations.find((p) => p.id === c.id) !== c).map((c) => ({ id: c.id, user_id: userId, scenario: c.scenario, course_id: c.courseId, messages: c.messages, created_at: iso(c.at) }));
    if (rows.length) ops.push(db.from("tutor_conversations").upsert(rows));
  }
  const results = await Promise.all(ops);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
}
