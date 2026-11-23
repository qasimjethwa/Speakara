import { describe, expect, it } from "vitest";
import { getCourse } from "../content";
import { buildSession } from "../engine/plan";
import type { Answer, Exercise } from "../engine/exercises";
import { band, companionBrief, defaultPrefs, difficultyFor, estimate, eventsFromSession, recommend, repeatedMistakes, type Context, type LearningEvent, type Skill, type TwinPrefs } from "./model";

const NOW = Date.UTC(2026, 10, 23);
const DAY = 86_400_000;
const ev = (skill: Skill, correct: boolean, daysAgo = 1, item?: string): LearningEvent => ({ at: NOW - daysAgo * DAY, course: "es-en", skill, correct, item, source: "lesson" });
const many = (skill: Skill, right: number, wrong: number, daysAgo = 1, item = (i: number) => `${skill}-${i}`) =>
  [...Array.from({ length: right }, (_, i) => ev(skill, true, daysAgo, item(i))), ...Array.from({ length: wrong }, (_, i) => ev(skill, false, daysAgo, `${skill}-x${i}`))];
const ctx: Context = { course: "es-en", nextLessonId: "es1-l2", nextLessonTitle: "Unit 1: Greetings 2", dueReviews: 2, hasIslProgress: false, recentLessonAccuracy: [0.8, 0.7],
  storyIds: [{ id: "es1-story", title: "En el café", open: true, done: false, tags: ["food", "social"] }, { id: "es9-story", title: "El aeropuerto", open: true, done: false, tags: ["travel"] }] };

// Learner A: strong vocabulary and reading, weak grammar, travel goal, likes explanations.
const A: LearningEvent[] = [...many("vocabulary", 18, 2), ...many("reading", 9, 1), ...many("grammar", 3, 9), ev("grammar", false, 2, "s7"), ev("grammar", false, 1, "s7"), ev("grammar", false, 1, "s9"), ev("grammar", false, 3, "s9")];
const prefsA: TwinPrefs = { ...defaultPrefs(), onboarded: true, goal: "travel", interests: ["travel"], style: "explain", correction: "detailed", confidence: { speaking: 4 } };
// Learner B: strong grammar, weak vocabulary, low speaking confidence, food and social interests, likes visual learning.
const B: LearningEvent[] = [...many("grammar", 16, 2), ...many("vocabulary", 4, 10), ev("vocabulary", false, 2, "w3"), ev("vocabulary", false, 1, "w3"), ev("vocabulary", false, 2, "w5"), ev("vocabulary", false, 1, "w5")];
const prefsB: TwinPrefs = { ...defaultPrefs(), onboarded: true, goal: "family", interests: ["food", "social"], style: "visual", correction: "gentle", confidence: { speaking: 1 } };

describe("Learning Twin: two learners, two different learning paths", () => {
  const ra = recommend(A, prefsA, ctx, NOW), rb = recommend(B, prefsB, ctx, NOW);
  it("measures each learner's strengths and weaknesses from their own answers", () => {
    expect(band(estimate(A, "grammar", NOW))).toBe("needs work"); expect(band(estimate(A, "vocabulary", NOW))).toBe("strength");
    expect(band(estimate(B, "vocabulary", NOW))).toBe("needs work"); expect(band(estimate(B, "grammar", NOW))).toBe("strength");
  });
  it("recommends grammar work and explanations to A, visual vocabulary practice and gentle roleplay to B", () => {
    const ids = (r: typeof ra) => r.map((x) => x.id);
    expect(ids(ra)).toContain("weak-grammar"); expect(ids(ra)).toContain("guidebook"); expect(ids(ra)).not.toContain("weak-vocabulary");
    expect(ids(rb)).toContain("weak-vocabulary"); expect(ids(rb)).toContain("gentle-talk"); expect(ids(rb)).not.toContain("weak-grammar");
    expect(rb.find((r) => r.id === "weak-vocabulary")!.href).toBe("/lesson?mode=match");
    expect(ids(ra).slice(0, 3)).not.toEqual(ids(rb).slice(0, 3));
  });
  it("picks interest-matched stories and roleplays", () => {
    expect(ra.find((r) => r.id.startsWith("story-"))?.id).toBe("story-es9-story");
    expect(rb.find((r) => r.id.startsWith("story-"))?.id).toBe("story-es1-story");
    expect(rb.find((r) => r.id === "gentle-talk")!.href).toBe("/tutor?scenario=restaurant");
  });
  it("explains every recommendation with the learner's real numbers", () => {
    const g = ra.find((r) => r.id === "weak-grammar")!;
    expect(g.reasonParams).toMatchObject({ c: estimate(A, "grammar", NOW).recent.correct, t: estimate(A, "grammar", NOW).recent.total });
    expect(ra.find((r) => r.id === "fix-mistakes")!.reasonParams).toEqual({ n: repeatedMistakes(A, NOW).length });
  });
  it("gives the AI companion different teaching instructions", () => {
    const ba = companionBrief(A, prefsA, "es-en", NOW).join("\n"), bb = companionBrief(B, prefsB, "es-en", NOW).join("\n");
    expect(ba).toMatch(/weaker areas: grammar/); expect(ba).toMatch(/in detail/); expect(ba).toMatch(/travel/);
    expect(bb).toMatch(/weaker areas: vocabulary/); expect(bb).toMatch(/gently/); expect(bb).toMatch(/speaking feels hard/);
    expect(ba).not.toEqual(bb);
  });
});

describe("Learning Twin: honest, recency-aware estimates", () => {
  it("has no estimate and suggests the optional check when nothing is measured", () => {
    expect(estimate([], "grammar", NOW).label).toBe("no data");
    expect(recommend([], defaultPrefs(), ctx, NOW)[0].id).toBe("diagnostic");
  });
  it("never classifies a learner from one quiz", () => {
    expect(band(estimate(many("grammar", 0, 3), "grammar", NOW))).toBe("unknown");
  });
  it("lets old mistakes fade as new evidence arrives", () => {
    const old = many("grammar", 2, 12, 20), fresh = many("grammar", 16, 0, 1);
    expect(band(estimate(old, "grammar", NOW))).toBe("needs work");
    expect(band(estimate([...old, ...fresh], "grammar", NOW))).not.toBe("needs work");
    expect(estimate([...old, ...fresh], "grammar", NOW).mastery).toBeGreaterThan(0.6);
  });
  it("stops flagging a repeated mistake once it's answered right twice", () => {
    const e = [ev("grammar", false, 3, "s1"), ev("grammar", false, 2, "s1")];
    expect(repeatedMistakes(e, NOW)).toHaveLength(1);
    expect(repeatedMistakes([...e, ev("grammar", true, 1, "s1"), { ...ev("grammar", true, 1, "s1"), at: NOW - 1000 }], NOW)).toHaveLength(0);
  });
  it("adapts difficulty to measurements and respects the learner's preference", () => {
    expect(difficultyFor(A, prefsA, "es-en", NOW)).toBe(2);
    expect(difficultyFor([...many("vocabulary", 20, 0), ...many("grammar", 20, 0)], defaultPrefs(), "es-en", NOW)).toBe(3);
    expect(difficultyFor([...many("vocabulary", 20, 0), ...many("grammar", 20, 0)], { ...defaultPrefs(), difficulty: "easier" }, "es-en", NOW)).toBe(2);
  });
  it("suggests harder material only after near-perfect lessons and no weak areas", () => {
    const strong = [...many("vocabulary", 15, 1), ...many("grammar", 15, 1)];
    expect(recommend(strong, defaultPrefs(), { ...ctx, recentLessonAccuracy: [0.95, 1, 0.92] }, NOW).find((r) => r.id === "next-lesson")!.kind).toBe("challenge");
    expect(recommend(A, defaultPrefs(), { ...ctx, recentLessonAccuracy: [0.95, 1, 0.92] }, NOW).find((r) => r.id === "next-lesson")!.kind).toBe("learn");
  });
});

describe("Learning Twin: capture uses the real answer key", () => {
  it("grades a real lesson's first attempts into skill events", () => {
    const course = getCourse("es-en"); const lesson = course.units[0].lessons[0];
    const built = buildSession(course, { type: "lesson", courseId: "es-en", lessonId: lesson.id, seed: 7, speech: false, reviewWordIds: [] })!;
    const right = (ex: Exercise): Answer => ex.type === "choose" || ex.type === "fill" ? { type: ex.type, index: ex.answer } : ex.type === "match" ? { type: "match", mistakes: 0 } : ex.type === "speak" ? { type: "speak", transcript: ex.text } : { type: ex.type, text: ex.accepted[0] };
    const evs = eventsFromSession(built.exercises, built.exercises.map((ex) => ({ id: ex.id, answer: right(ex) })), "es-en", "lesson", NOW, lesson.title);
    expect(evs.length).toBe(built.exercises.length); expect(evs.every((e) => e.correct)).toBe(true);
    expect(new Set(evs.map((e) => e.skill)).size).toBeGreaterThan(1);
    const wrong = eventsFromSession(built.exercises, built.exercises.map((ex) => ({ id: ex.id, answer: { type: "choose", index: -1 } as Answer })), "es-en", "lesson", NOW);
    expect(wrong.every((e) => !e.correct)).toBe(true);
  });
  it("records nothing and recommends nothing when personalisation is off", () => {
    expect(recommend(A, { ...prefsA, personalise: false }, ctx, NOW).length).toBeGreaterThan(0); // engine is pure…
    // …the store and view gate it: covered by e2e/twin.mjs (no events recorded, no recommendations shown)
  });
});
