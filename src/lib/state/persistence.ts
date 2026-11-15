import type { SupabaseClient } from "@supabase/supabase-js";
import { initialState, type LearnerState, type Profile } from "./types";

const LOCAL_KEY = "speakara:learner:v1";
export function loadLocal(now: number): LearnerState {
  try { const raw = localStorage.getItem(LOCAL_KEY); if (raw) { const s = JSON.parse(raw) as LearnerState; if (s.version === 1) return { ...initialState(now), ...s, profile: { ...initialState(now).profile, ...s.profile } }; } } catch { /* storage blocked or corrupt: start fresh */ }
  return initialState(now);
}
export function saveLocal(s: LearnerState) { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(s)); } catch { /* private mode */ } }
export function clearLocal() { try { localStorage.removeItem(LOCAL_KEY); } catch { /* ignore */ } }

const ms = (s: string) => new Date(s).getTime();
function must<T>(r: { data: T | null; error: { message: string } | null }): T { if (r.error) throw new Error(r.error.message); return r.data as T; }

/** Reads the learner model from Supabase. Returns null if the profile row does not exist yet. `version` guards writes. */
export async function loadCloud(db: SupabaseClient, userId: string, now: number): Promise<{ state: LearnerState; version: number } | null> {
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
  const set = (prof.settings ?? {}) as Partial<Profile>;
  const s: LearnerState = {
    ...base,
    profile: { ...base.profile, name: prof.display_name ?? "", username: prof.username ?? "", nativeLang: prof.native_lang, courseId: prof.course_id, goal: prof.goal ?? "",
      level: prof.level, dailyGoalXp: prof.daily_goal_xp, onboarded: prof.onboarded, createdAt: ms(prof.created_at), uiLang: prof.ui_lang, isPublic: prof.is_public, role: prof.role,
      sound: set.sound ?? true, speech: set.speech ?? true, motion: set.motion ?? true, slowAudio: set.slowAudio ?? false, savedPhrases: Array.isArray(set.savedPhrases) ? set.savedPhrases : [] },
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
  return { state: s, version: prof.version };
}

/** Learners may write only their own non-reward profile fields; everything else goes through /api/progress. */
export async function saveProfile(db: SupabaseClient, userId: string, p: Profile): Promise<void> {
  const { error } = await db.from("profiles").update({
    display_name: p.name || "Learner", native_lang: p.nativeLang, course_id: p.courseId, goal: p.goal, level: p.level, daily_goal_xp: p.dailyGoalXp, onboarded: p.onboarded,
    ui_lang: p.uiLang, is_public: p.isPublic, settings: { sound: p.sound, speech: p.speech, motion: p.motion, slowAudio: p.slowAudio, savedPhrases: p.savedPhrases.slice(0, 100) },
  }).eq("id", userId);
  if (error) throw new Error(error.message);
}
