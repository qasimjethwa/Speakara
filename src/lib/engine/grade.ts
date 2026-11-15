import type { SessionResult } from "../state/actions";
import { evaluate, type Answer, type Exercise } from "./exercises";
import { placementUnit, type BuiltSession } from "./plan";
import type { Course } from "../content/types";

/** The learner's first response to each exercise. Later retries never change the score. */
export interface Attempt { id: string; answer?: Answer; skipped?: boolean }
export const SKIPPABLE: Exercise["type"][] = ["speak", "listen", "dictation"];

export class GradeError extends Error {}

/** Turns first attempts into a session result. Used unchanged by the browser (guest mode) and by the server. */
export function gradeAttempts(course: Course, built: BuiltSession, attempts: Attempt[], seconds: number): SessionResult {
  const byId = new Map(attempts.map((a) => [a.id, a]));
  const graded: { ex: Exercise; ok: boolean }[] = [];
  for (const ex of built.exercises) {
    const a = byId.get(ex.id);
    if (!a) throw new GradeError(`Exercise ${ex.id} was not answered.`);
    if (a.skipped) { if (!SKIPPABLE.includes(ex.type)) throw new GradeError(`Exercise ${ex.id} cannot be skipped.`); continue; }
    if (!a.answer) throw new GradeError(`Exercise ${ex.id} has no answer.`);
    graded.push({ ex, ok: evaluate(ex, a.answer).correct });
  }
  const sentence = (ok: boolean) => [...new Set(graded.filter((g) => g.ex.sentenceId && g.ok === ok).map((g) => g.ex.sentenceId!))];
  const missed = sentence(false);
  const correct = graded.filter((g) => g.ok).length;
  return {
    kind: built.kind, courseId: course.id, lessonId: built.lessonId, storyId: built.storyId,
    unlockUnit: built.kind === "placement" ? placementUnit(course, graded.length ? correct / graded.length : 0) : built.unlockUnit,
    total: graded.length, correctFirstTry: correct, seconds: Math.max(0, Math.min(3600, Math.round(seconds))),
    words: graded.flatMap((g) => g.ex.wordIds.map((wordId) => ({ wordId, correct: g.ok }))),
    missedSentences: missed, fixedSentences: sentence(true).filter((s) => !missed.includes(s)),
  };
}
