"use client";
/** Joins the learner state (courses, SRS, completions) with the Twin to produce the personalised view used across the app. */
import { useMemo } from "react";
import { allLessons, allSentences, allWords, getCourse, lessonKey, wordKey } from "@/lib/content";
import type { Course } from "@/lib/content/types";
import { isDue } from "@/lib/engine/srs";
import { isLessonUnlocked } from "@/lib/state/actions";
import { useStore } from "@/lib/state/store";
import type { LearnerState } from "@/lib/state/types";
import { companionBrief, difficultyFor, estimate, recommend, repeatedMistakes, SKILLS, type Context, type Interest, type LearningEvent, type TwinPrefs } from "./model";
import { useTwin } from "./store";

const TAGS: [Interest, RegExp][] = [
  ["travel", /travel|airport|train|hotel|ticket|trip|station|direction|holiday|viaje|aeropuerto/i],
  ["food", /caf[eé]|food|dinner|restaurant|mesa|menu|eat|cook|comida|market/i],
  ["study", /school|class|universit|college|study|student|escuela|clase/i],
  ["work", /work|job|office|interview|trabajo/i],
  ["social", /meet|friend|family|foto|photo|party|amig/i],
  ["everyday", /day|home|weather|time|morning|casa/i],
];
export const tagsOf = (text: string): Interest[] => TAGS.filter(([, r]) => r.test(text)).map(([t]) => t);

export function contextFor(state: LearnerState, course: Course, now: number, hasIsl: boolean): Context {
  const order = allLessons(course).map((x) => ({ lessonId: x.lesson.id, unitIndex: course.units.indexOf(x.unit), title: `${x.unit.title}: ${x.lesson.title}` }));
  const next = order.find((o, i) => isLessonUnlocked(state, course.id, order, i) && !state.completed[lessonKey(course.id, o.lessonId)]);
  const dueReviews = allWords(course).filter((w) => { const it = state.review[wordKey(course.id, w.id)]; return it && isDue(it, now); }).length;
  const storyIds = course.units.map((u) => u.story && { id: u.story.id, title: u.story.title, open: u.lessons.every((l) => state.completed[lessonKey(course.id, l.id)]), done: !!state.stories[u.story.id], tags: tagsOf(`${u.story.title} ${u.story.summary} ${u.title}`) }).filter((x): x is NonNullable<typeof x> => !!x);
  const recentLessonAccuracy = order.map((o) => state.completed[lessonKey(course.id, o.lessonId)]).filter((c) => !!c).sort((a, b) => a.at - b.at).map((c) => c.bestAccuracy);
  return { course: course.id, nextLessonId: next?.lessonId, nextLessonTitle: next?.title, dueReviews, storyIds, hasIslProgress: hasIsl, recentLessonAccuracy };
}

/** Human-readable label for a word or sentence id (target text), used in mistake lists and the companion brief. */
export function itemLabeller(course: Course) {
  const m = new Map<string, string>([...allWords(course).map((w) => [w.id, `${w.t} (${w.n})`] as const), ...allSentences(course).map((s) => [s.id, `${s.t} (${s.n})`] as const)]);
  return (id: string) => m.get(id);
}

export function useTwinView() {
  const { state, userId, ready } = useStore();
  const twin = useTwin(userId);
  const course = getCourse(state.profile.courseId);
  return useMemo(() => {
    const now = Date.now();
    let hasIsl = false; try { hasIsl = !!localStorage.getItem("speakara:isl:progress:v1"); } catch { /* ignore */ }
    const ctx = contextFor(state, course, now, hasIsl);
    const events: LearningEvent[] = twin.events; const prefs: TwinPrefs = twin.prefs;
    const label = itemLabeller(course);
    return {
      ready, userId, course, prefs, events, ctx,
      estimates: SKILLS.map((s) => estimate(events, s, now, s === "isl" ? undefined : course.id)),
      mistakes: repeatedMistakes(events, now, course.id).map((m) => ({ ...m, label: label(m.item) ?? m.item })),
      recommendations: prefs.personalise ? recommend(events, prefs, ctx, now) : [],
      difficulty: difficultyFor(events, prefs, course.id, now),
      brief: companionBrief(events, prefs, course.id, now, label),
    };
  }, [state, course, twin, ready, userId]);
}
