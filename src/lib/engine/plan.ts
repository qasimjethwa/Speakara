import type { Course } from "../content/types";
import { allSentences, allWords, findLesson } from "../content";
import { generateLesson, generatePractice, generateUnitTest, mulberry32, PRACTICE_MODES, type Exercise, type PracticeMode } from "./exercises";
import type { SessionKind } from "./gamification";

/**
 * A session plan is everything needed to rebuild a session's exercises deterministically. The browser builds the
 * exercises from it to show them; the server rebuilds the same exercises from it to grade the submitted answers.
 */
export type SessionPlan =
  | { type: "lesson"; courseId: string; lessonId: string; seed: number; speech: boolean; reviewWordIds: string[] }
  | { type: "practice"; courseId: string; mode: PracticeMode; seed: number; speech: boolean; wordIds: string[]; sentenceIds: string[] }
  | { type: "testout"; courseId: string; unit: number; seed: number }
  | { type: "placement"; courseId: string; seed: number }
  | { type: "story"; courseId: string; storyId: string; seed: number };

export interface BuiltSession { exercises: Exercise[]; kind: SessionKind; lessonId?: string; unlockUnit?: number; storyId?: string }
export const PLACEMENT_SEED = 42;

export function buildSession(course: Course, plan: SessionPlan): BuiltSession | null {
  const rng = mulberry32(plan.seed);
  if (plan.type === "lesson") {
    const hit = findLesson(course, plan.lessonId);
    if (!hit) return null;
    const byId = new Map(allWords(course).map((w) => [w.id, w]));
    const reviewWords = plan.reviewWordIds.slice(0, 2).map((id) => byId.get(id)).filter((w) => !!w);
    return { exercises: generateLesson(course, hit.lesson, { rng, speech: plan.speech, reviewWords }), kind: "lesson", lessonId: plan.lessonId };
  }
  if (plan.type === "practice") {
    if (!PRACTICE_MODES.includes(plan.mode)) return null;
    const wId = new Set(plan.wordIds.slice(0, 200)), sId = new Set(plan.sentenceIds.slice(0, 200));
    const words = allWords(course).filter((w) => wId.has(w.id)), sentences = allSentences(course).filter((s) => sId.has(s.id));
    const exercises = generatePractice(course, plan.mode, { words, sentences }, { rng, speech: plan.speech });
    return exercises.length ? { exercises, kind: "practice" } : null;
  }
  if (plan.type === "testout") {
    if (!Number.isInteger(plan.unit) || plan.unit < 1 || plan.unit >= course.units.length) return null;
    return { exercises: generateUnitTest(course, Array.from({ length: plan.unit }, (_, i) => i), rng), kind: "testout", unlockUnit: plan.unit };
  }
  if (plan.type === "story") {
    const story = course.units.map((u) => u.story).find((x) => x?.id === plan.storyId);
    if (!story) return null;
    // Comprehension questions are graded as multiple-choice items so stories share the grading path.
    return { kind: "story", storyId: story.id, exercises: story.questions.map((q, i) => ({ id: `q${i}`, type: "choose" as const, wordIds: [], difficulty: 1 as const, instruction: q.prompt, prompt: q.prompt, promptIsTarget: false, options: q.options, answer: q.answer })) };
  }
  if (course.units.length < 2) return null;
  return { exercises: generateUnitTest(course, [0, 1], mulberry32(PLACEMENT_SEED)), kind: "placement" };
}

/** Placement: 80%+ starts at the third unit, 50%+ at the second, otherwise at the beginning. */
export const placementUnit = (course: Course, accuracy: number) => (accuracy >= 0.8 ? Math.min(2, course.units.length - 1) : accuracy >= 0.5 ? 1 : 0);
