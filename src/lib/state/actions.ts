import type { Conversation, LearnerState, Profile } from "./types";
import { wordKey, lessonKey } from "../content";
import { review as srsReview } from "../engine/srs";
import { advanceQuests, applyStreak, GEM_RULES, newAchievements, xpFor, type SessionKind } from "../engine/gamification";

export interface SessionResult {
  kind: SessionKind; courseId: string; lessonId?: string; storyId?: string; unlockUnit?: number;
  total: number; correctFirstTry: number; seconds: number;
  words: { wordId: string; correct: boolean }[]; missedSentences: string[]; fixedSentences: string[];
}
export interface SessionSummary {
  xp: number; gems: number; accuracy: number; perfect: boolean; streak: number; streakExtended: boolean; frozeDays: number;
  questsCompleted: string[]; achievements: string[]; firstTime: boolean; passed: boolean;
}
const uid = (now: number) => `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
export const TESTOUT_PASS = 0.8;

/** The single place where finishing any session changes the learner model. Pure: (state, result, now) → state. */
export function completeSession(s: LearnerState, r: SessionResult, now: number): { state: LearnerState; summary: SessionSummary } {
  const accuracy = r.total ? r.correctFirstTry / r.total : 1;
  const key = r.lessonId ? lessonKey(r.courseId, r.lessonId) : undefined;
  const firstTime = !!key && !s.completed[key];
  const gated = r.kind === "testout"; // placement: the caller decides the unit from the score
  const passed = !gated || accuracy >= TESTOUT_PASS;
  const xp = xpFor(r.kind, accuracy, firstTime);

  const review = { ...s.review };
  for (const w of r.words) review[wordKey(r.courseId, w.wordId)] = srsReview(review[wordKey(r.courseId, w.wordId)], w.correct, now);

  const fixed = new Set(r.fixedSentences);
  const mistakes = [
    ...s.mistakes.filter((m) => !(m.courseId === r.courseId && (fixed.has(m.sentenceId) || r.missedSentences.includes(m.sentenceId)))),
    ...r.missedSentences.map((sentenceId) => ({ courseId: r.courseId, sentenceId, at: now })),
  ].slice(-60);

  const st = applyStreak(s.streak, now);
  const perfect = accuracy >= 1 && r.total > 0;
  const q = advanceQuests(s.quests, {
    xp, lessons: r.kind === "lesson" ? 1 : 0, perfect: perfect && r.kind === "lesson" ? 1 : 0,
    practice: r.kind === "practice" ? 1 : 0, story: r.kind === "story" ? 1 : 0, words: new Set(r.words.map((w) => w.wordId)).size,
  }, now);

  let next: LearnerState = {
    ...s, xp: s.xp + xp, gems: s.gems + GEM_RULES.perSession + q.gems, streak: st.streak, review, mistakes, quests: q.quests,
    xpEvents: [...s.xpEvents, { id: uid(now), at: now, amount: xp, source: r.kind }].slice(-400),
    completed: key ? { ...s.completed, [key]: { count: (s.completed[key]?.count ?? 0) + 1, bestAccuracy: Math.max(s.completed[key]?.bestAccuracy ?? 0, accuracy), at: now } } : s.completed,
    stories: r.storyId ? { ...s.stories, [r.storyId]: now } : s.stories,
    unlockedUnits: (r.kind === "placement" || (gated && passed)) && r.unlockUnit !== undefined ? { ...s.unlockedUnits, [r.courseId]: Math.max(s.unlockedUnits[r.courseId] ?? 0, r.unlockUnit) } : s.unlockedUnits,
    stats: { ...s.stats, lessons: s.stats.lessons + (r.kind === "lesson" ? 1 : 0), perfect: s.stats.perfect + (perfect && r.kind === "lesson" ? 1 : 0),
      practice: s.stats.practice + (r.kind === "practice" ? 1 : 0), minutes: s.stats.minutes + Math.round(r.seconds / 60) },
  };
  const earned = newAchievements(next, now);
  next = { ...next, achievements: { ...next.achievements, ...earned } };
  return { state: next, summary: { xp, gems: GEM_RULES.perSession + q.gems, accuracy, perfect, streak: st.streak.count, streakExtended: st.extended,
    frozeDays: st.frozeDays, questsCompleted: q.completed, achievements: Object.keys(earned), firstTime, passed } };
}

export function buyStreakFreeze(s: LearnerState): LearnerState {
  if (s.gems < GEM_RULES.freezeCost || s.streak.freezes >= GEM_RULES.maxFreezes) return s;
  return { ...s, gems: s.gems - GEM_RULES.freezeCost, streak: { ...s.streak, freezes: s.streak.freezes + 1 } };
}
export const updateProfile = (s: LearnerState, patch: Partial<Profile>): LearnerState => ({ ...s, profile: { ...s.profile, ...patch } });

export function saveConversation(s: LearnerState, c: Conversation, now: number): LearnerState {
  const learnerTurns = c.messages.filter((m) => m.role === "learner").length;
  const prev = s.conversations.find((x) => x.id === c.id);
  const newTurns = learnerTurns - (prev?.messages.filter((m) => m.role === "learner").length ?? 0);
  let next: LearnerState = { ...s, conversations: [c, ...s.conversations.filter((x) => x.id !== c.id)].slice(0, 20), stats: { ...s.stats, tutorTurns: s.stats.tutorTurns + Math.max(0, newTurns) } };
  next = { ...next, achievements: { ...next.achievements, ...newAchievements(next, now) } };
  return next;
}

/** A lesson opens when it is first in the course, follows a completed lesson, or sits in a unit opened by placement. */
export function isLessonUnlocked(s: LearnerState, courseId: string, order: { lessonId: string; unitIndex: number }[], index: number): boolean {
  if (index === 0) return true;
  const opened = s.unlockedUnits[courseId] ?? 0;
  if (order[index].unitIndex < opened) return true; // units the learner tested out of are fully open
  if (order[index].unitIndex === opened && order[index - 1].unitIndex < opened) return true;
  return !!s.completed[lessonKey(courseId, order[index - 1].lessonId)];
}
