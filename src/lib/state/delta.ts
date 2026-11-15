import type { LearnerState } from "./types";

const iso = (t: number) => new Date(t).toISOString();
const split = (k: string) => { const i = k.indexOf(":"); return [k.slice(0, i), k.slice(i + 1)]; };
const diff = <T,>(a: Record<string, T>, b: Record<string, T>) => Object.entries(b).filter(([k, v]) => JSON.stringify(a[k]) !== JSON.stringify(v));

/** The rows that changed between two learner models, in the shape apply_progress() expects. */
export function buildDelta(prev: LearnerState, next: LearnerState) {
  const key = (m: { courseId: string; sentenceId: string }) => `${m.courseId}:${m.sentenceId}`;
  const before = new Set(prev.mistakes.map(key)), after = new Set(next.mistakes.map(key));
  const seenXp = new Set(prev.xpEvents.map((e) => e.id));
  const xpEvents = next.xpEvents.filter((e) => !seenXp.has(e.id));
  return {
    xp: xpEvents.reduce((n, e) => n + e.amount, 0),
    profile: { xp: next.xp, gems: next.gems, streak_count: next.streak.count, streak_last_day: next.streak.lastDay, streak_freezes: next.streak.freezes, longest_streak: next.streak.longest, stats: next.stats },
    completions: diff(prev.completed, next.completed).map(([k, v]) => ({ course_id: split(k)[0], lesson_id: split(k)[1], count: v.count, best_accuracy: v.bestAccuracy, completed_at: iso(v.at) })),
    unlocks: diff(prev.unlockedUnits, next.unlockedUnits).map(([k, v]) => ({ course_id: k, unit_index: v })),
    stories: diff(prev.stories, next.stories).map(([k, v]) => ({ story_id: k, completed_at: iso(v) })),
    review: diff(prev.review, next.review).map(([k, v]) => ({ word_key: k, reps: v.reps, interval_days: v.interval, ease: v.ease, due_at: iso(v.due), lapses: v.lapses, seen: v.seen, last_at: iso(v.last) })),
    achievements: diff(prev.achievements, next.achievements).map(([k, v]) => ({ achievement_id: k, earned_at: iso(v) })),
    xp_events: xpEvents.map((e) => ({ id: e.id, amount: e.amount, source: e.source })),
    mistakes_add: next.mistakes.filter((m) => !before.has(key(m))).map((m) => ({ course_id: m.courseId, sentence_id: m.sentenceId })),
    mistakes_remove: prev.mistakes.filter((m) => !after.has(key(m))).map((m) => ({ course_id: m.courseId, sentence_id: m.sentenceId })),
    ...(next.quests.day && JSON.stringify(prev.quests) !== JSON.stringify(next.quests) ? { quests: next.quests } : {}),
    conversations: next.conversations.filter((c) => JSON.stringify(prev.conversations.find((p) => p.id === c.id)) !== JSON.stringify(c))
      .map((c) => ({ id: c.id, scenario: c.scenario, course_id: c.courseId, messages: c.messages, created_at: iso(c.at) })),
  };
}
