import type { LearnerState, Quest } from "../state/types";
import { DAY } from "./srs";

export const dayKey = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const dayNumber = (key: string) => { const [y, m, d] = key.split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / DAY); };
export const daysBetween = (a: string, b: string) => dayNumber(b) - dayNumber(a);
/** Monday-based week key, used for weekly leagues. */
export const weekKey = (t: number) => { const d = new Date(t); const day = (d.getDay() + 6) % 7; return dayKey(t - day * DAY); };

export type SessionKind = "lesson" | "practice" | "story" | "testout" | "tutor" | "placement";
export const XP_RULES = { lesson: 10, practice: 10, story: 12, testout: 20, tutor: 8, placement: 15, perfectBonus: 5, firstTimeBonus: 5 } as const;
export const GEM_RULES = { perSession: 5, freezeCost: 50, maxFreezes: 2 } as const;

/** XP is a fixed, published formula — never variable-reward gambling and never purchasable. */
export function xpFor(kind: SessionKind, accuracy: number, firstTime: boolean): number {
  return XP_RULES[kind] + (accuracy >= 1 ? XP_RULES.perfectBonus : 0) + (firstTime && kind === "lesson" ? XP_RULES.firstTimeBonus : 0);
}

export interface StreakResult { streak: LearnerState["streak"]; extended: boolean; frozeDays: number; lost: number }
export function applyStreak(s: LearnerState["streak"], now: number): StreakResult {
  const today = dayKey(now);
  if (s.lastDay === today) return { streak: s, extended: false, frozeDays: 0, lost: 0 };
  const gap = s.lastDay ? daysBetween(s.lastDay, today) : 1;
  const missed = Math.max(0, gap - 1);
  if (missed === 0 || missed <= s.freezes) {
    const count = s.count + 1;
    return { streak: { count, lastDay: today, freezes: s.freezes - missed, longest: Math.max(s.longest, count) }, extended: true, frozeDays: missed, lost: 0 };
  }
  return { streak: { count: 1, lastDay: today, freezes: s.freezes, longest: Math.max(s.longest, 1) }, extended: true, frozeDays: 0, lost: s.count };
}
/** Streak as it should be displayed right now (0 if it has already lapsed beyond what freezes cover). */
export function liveStreak(s: LearnerState["streak"], now: number): number {
  if (!s.lastDay) return 0;
  const missed = daysBetween(s.lastDay, dayKey(now)) - 1;
  return missed <= s.freezes ? s.count : 0;
}

const QUEST_POOL: Omit<Quest, "progress" | "claimed">[] = [
  { id: "xp", target: 30, reward: 10 }, { id: "lessons", target: 2, reward: 10 }, { id: "perfect", target: 1, reward: 15 },
  { id: "practice", target: 1, reward: 10 }, { id: "story", target: 1, reward: 10 }, { id: "words", target: 8, reward: 10 },
];
export const QUEST_LABELS: Record<string, (n: number) => string> = {
  xp: (n) => `Earn ${n} XP`, lessons: (n) => `Complete ${n} lessons`, perfect: () => "Finish a lesson with no mistakes",
  practice: () => "Do one practice session", story: () => "Read a story", words: (n) => `Practise ${n} words`,
};
export const questTitle = (id: string) => QUEST_LABELS[id]?.(QUEST_POOL.find((q) => q.id === id)?.target ?? 1) ?? id;
/** Three quests a day, rotating deterministically so every learner sees the same set on the same date. */
export function questsFor(day: string): Quest[] {
  const start = dayNumber(day) % QUEST_POOL.length;
  return [QUEST_POOL[0], QUEST_POOL[1 + (start % 5)], QUEST_POOL[1 + ((start + 2) % 5)]].map((q) => ({ ...q, progress: 0, claimed: false }));
}
export interface QuestEvent { xp: number; lessons: number; perfect: number; practice: number; story: number; words: number }
export function advanceQuests(q: LearnerState["quests"], ev: QuestEvent, now: number): { quests: LearnerState["quests"]; gems: number; completed: string[] } {
  const day = dayKey(now);
  const items = (q.day === day ? q.items : questsFor(day)).map((x) => ({ ...x }));
  let gems = 0; const completed: string[] = [];
  for (const it of items) {
    it.progress = Math.min(it.target, it.progress + (ev[it.id as keyof QuestEvent] ?? 0));
    if (it.progress >= it.target && !it.claimed) { it.claimed = true; gems += it.reward; completed.push(it.id); }
  }
  return { quests: { day, items }, gems, completed };
}

export interface AchievementDef { id: string; title: string; description: string; icon: string; test: (s: LearnerState) => boolean }
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-lesson", title: "First steps", description: "Complete your first lesson", icon: "🌱", test: (s) => s.stats.lessons >= 1 },
  { id: "streak-3", title: "Warming up", description: "Reach a 3-day streak", icon: "🔥", test: (s) => s.streak.longest >= 3 },
  { id: "streak-7", title: "One whole week", description: "Reach a 7-day streak", icon: "📅", test: (s) => s.streak.longest >= 7 },
  { id: "streak-30", title: "Habit formed", description: "Reach a 30-day streak", icon: "🏔️", test: (s) => s.streak.longest >= 30 },
  { id: "xp-100", title: "Century", description: "Earn 100 XP", icon: "⚡", test: (s) => s.xp >= 100 },
  { id: "xp-500", title: "Powerhouse", description: "Earn 500 XP", icon: "🚀", test: (s) => s.xp >= 500 },
  { id: "perfect-1", title: "Flawless", description: "Finish a lesson with no mistakes", icon: "🎯", test: (s) => s.stats.perfect >= 1 },
  { id: "perfect-5", title: "Sharpshooter", description: "Finish 5 lessons with no mistakes", icon: "🏹", test: (s) => s.stats.perfect >= 5 },
  { id: "words-25", title: "Word collector", description: "Meet 25 words", icon: "📚", test: (s) => Object.keys(s.review).length >= 25 },
  { id: "words-50", title: "Walking dictionary", description: "Meet 50 words", icon: "🗂️", test: (s) => Object.keys(s.review).length >= 50 },
  { id: "story-1", title: "Bookworm", description: "Read your first story", icon: "📖", test: (s) => Object.keys(s.stories).length >= 1 },
  { id: "tutor-1", title: "Ice breaker", description: "Have a conversation with the tutor", icon: "💬", test: (s) => s.stats.tutorTurns >= 3 },
  { id: "practice-5", title: "Sharpening the saw", description: "Complete 5 practice sessions", icon: "🛠️", test: (s) => s.stats.practice >= 5 },
];
export function newAchievements(s: LearnerState, now: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of ACHIEVEMENTS) if (!s.achievements[a.id] && a.test(s)) out[a.id] = now;
  return out;
}

export const weeklyXp = (s: LearnerState, now: number) => { const wk = weekKey(now); return s.xpEvents.filter((e) => weekKey(e.at) === wk).reduce((n, e) => n + e.amount, 0); };
export const todayXp = (s: LearnerState, now: number) => { const d = dayKey(now); return s.xpEvents.filter((e) => dayKey(e.at) === d).reduce((n, e) => n + e.amount, 0); };

export const LEAGUES = ["Seedling", "Sprout", "Bloom", "Grove", "Canopy"] as const;
/** League tier is derived from lifetime XP so it is explainable and cannot be bought. */
export const leagueFor = (xp: number) => LEAGUES[Math.min(LEAGUES.length - 1, Math.floor(xp / 300))];

/** Practice-partner bots for offline / guest mode. Always labelled as bots in the UI. */
export function practiceBots(week: string, now: number): { name: string; xp: number; bot: true }[] {
  const names = ["Mango", "Pixel", "Juniper", "Atlas", "Nova", "Biscuit", "Zephyr", "Olive", "Comet"];
  const elapsed = Math.min(7, Math.max(0.2, (now - new Date(week).getTime()) / DAY));
  return names.map((name, i) => ({ name, bot: true as const, xp: Math.round(elapsed * (6 + ((dayNumber(week) + i * 7) % 23))) }));
}
