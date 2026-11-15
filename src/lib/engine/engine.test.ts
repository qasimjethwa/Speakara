import { describe, expect, it } from "vitest";
import { COURSES, getCourse, allLessons, allSentences } from "../content";
import { compareText, normalize, speechScore, tokens } from "./text";
import { evaluate, generateLesson, generatePractice, generateUnitTest, mulberry32 } from "./exercises";
import { review, strength, DAY } from "./srs";
import { applyStreak, advanceQuests, questsFor, xpFor, liveStreak, dayKey } from "./gamification";
import { completeSession, isLessonUnlocked, buyStreakFreeze, type SessionResult } from "../state/actions";
import { initialState } from "../state/types";

const T0 = new Date(2026, 10, 14, 10).getTime();

describe("answer checking", () => {
  it("ignores case and punctuation", () => expect(compareText("hola buenos dias", ["Hola, buenos días."]).correct).toBe(true));
  it("flags missing accents but accepts", () => expect(compareText("Como estas", ["¿Cómo estás?"])).toMatchObject({ correct: true, note: "accent" }));
  it("accepts one typo in longer answers", () => expect(compareText("My name is Anna", ["My name is Ana."])).toMatchObject({ correct: true, note: "typo" }));
  it("rejects wrong answers and short-word typos", () => { expect(compareText("Good night", ["Good morning"]).correct).toBe(false); expect(compareText("si", ["no"]).correct).toBe(false); });
  it("accepts listed alternatives and contractions", () => { expect(compareText("The bill, please", ["The check, please.", "The bill, please."]).correct).toBe(true); expect(compareText("I'm Luis", ["I am Luis."]).correct).toBe(true); });
  it("keeps Devanagari vowel signs", () => { expect(normalize("मेरा नाम रवि है।")).toBe("मेरा नाम रवि है"); expect(compareText("मेरा नाम रवि है", ["मेरा नाम रवि है।"]).correct).toBe(true); expect(compareText("मर नम रव ह", ["मेरा नाम रवि है।"]).correct).toBe(false); });
  it("scores speech by word overlap", () => { expect(speechScore("hola buenos dias", "Hola, buenos días.")).toBe(1); expect(speechScore("hola", "Hola, buenos días.")).toBeCloseTo(1 / 3); });
});

describe("session generation", () => {
  for (const c of COURSES) it(`${c.id}: every lesson yields solvable exercises`, () => {
    for (const { lesson } of allLessons(c)) {
      const exs = generateLesson(c, lesson, { rng: mulberry32(7), speech: true });
      expect(exs.length).toBeGreaterThanOrEqual(10);
      expect(new Set(exs.map((e) => e.type)).size).toBeGreaterThanOrEqual(6);
      for (const e of exs) {
        if (e.type === "choose" || e.type === "fill") { expect(e.answer).toBeGreaterThanOrEqual(0); expect(new Set(e.options).size).toBe(e.options.length); expect(evaluate(e, { type: e.type, index: e.answer }).correct).toBe(true); }
        if (e.type === "wordbank" || e.type === "listen") { const pool = e.tiles.map((t) => t.toLowerCase()); for (const tok of tokens(e.accepted[0])) expect(pool).toContain(tok.toLowerCase()); expect(evaluate(e, { type: e.type, text: tokens(e.accepted[0]).join(" ") }).correct).toBe(true); }
        if (e.type === "translate") expect(evaluate(e, { type: "translate", text: e.accepted[0] }).correct).toBe(true);
        if (e.type === "fill") expect(`${e.before} ${e.options[e.answer]}${e.after}`.replace(/\s+/g, " ").toLowerCase()).toContain(e.options[e.answer]);
      }
    }
  });
  it("is deterministic for a seed", () => { const c = getCourse("es-en"); const l = c.units[0].lessons[0]; expect(generateLesson(c, l, { rng: mulberry32(3), speech: false })).toEqual(generateLesson(c, l, { rng: mulberry32(3), speech: false })); });
  it("drops speaking when speech is off", () => { const c = getCourse("es-en"); expect(generateLesson(c, c.units[0].lessons[0], { rng: mulberry32(1), speech: false }).some((e) => e.type === "speak")).toBe(false); });
  it("builds practice and unit tests", () => {
    const c = getCourse("es-en"); const material = { words: c.units[0].lessons[0].words, sentences: allSentences(c).slice(0, 6) };
    for (const m of ["review", "mistakes", "listen", "speak"] as const) expect(generatePractice(c, m, material, { rng: mulberry32(2), speech: true }).length).toBeGreaterThan(3);
    expect(generateUnitTest(c, [0, 1], mulberry32(5)).length).toBe(12);
  });
});

describe("spaced repetition", () => {
  it("grows intervals on success and resets on a miss", () => {
    let it1 = review(undefined, true, T0); expect(it1.interval).toBe(1);
    it1 = review(it1, true, T0 + DAY); expect(it1.interval).toBe(3);
    it1 = review(it1, true, T0 + 4 * DAY); expect(it1.interval).toBeGreaterThanOrEqual(7); expect(strength(it1)).toBe(3);
    const missed = review(it1, false, T0 + 12 * DAY); expect(missed).toMatchObject({ reps: 0, interval: 0, lapses: 1 }); expect(missed.ease).toBeLessThan(it1.ease); expect(missed.due).toBeLessThan(T0 + 13 * DAY);
  });
});

describe("gamification", () => {
  it("applies the published XP formula", () => { expect(xpFor("lesson", 0.8, false)).toBe(10); expect(xpFor("lesson", 1, true)).toBe(20); expect(xpFor("story", 1, false)).toBe(17); });
  it("extends, freezes and resets streaks", () => {
    const d1 = applyStreak({ count: 0, lastDay: null, freezes: 0, longest: 0 }, T0); expect(d1.streak.count).toBe(1);
    expect(applyStreak(d1.streak, T0 + 3600_000).extended).toBe(false);
    const d2 = applyStreak(d1.streak, T0 + DAY); expect(d2.streak.count).toBe(2);
    const lost = applyStreak(d2.streak, T0 + 3 * DAY); expect(lost.streak.count).toBe(1); expect(lost.lost).toBe(2);
    const frozen = applyStreak({ ...d2.streak, freezes: 1 }, T0 + 3 * DAY); expect(frozen.streak).toMatchObject({ count: 3, freezes: 0 }); expect(frozen.frozeDays).toBe(1);
    expect(liveStreak(d2.streak, T0 + 2 * DAY)).toBe(2); expect(liveStreak(d2.streak, T0 + 3 * DAY)).toBe(0);
  });
  it("advances and pays quests once", () => {
    const day = dayKey(T0); const base = { day, items: questsFor(day) }; expect(base.items).toHaveLength(3);
    const a = advanceQuests(base, { xp: 30, lessons: 2, perfect: 1, practice: 1, story: 1, words: 8 }, T0); expect(a.completed).toHaveLength(3); expect(a.gems).toBeGreaterThan(0);
    expect(advanceQuests(a.quests, { xp: 30, lessons: 2, perfect: 1, practice: 1, story: 1, words: 8 }, T0).gems).toBe(0);
    expect(advanceQuests(a.quests, { xp: 5, lessons: 0, perfect: 0, practice: 0, story: 0, words: 0 }, T0 + DAY).quests.items.every((q) => !q.claimed)).toBe(true);
  });
});

describe("learner model", () => {
  const c = getCourse("es-en"); const order = allLessons(c).map((x) => ({ lessonId: x.lesson.id, unitIndex: c.units.indexOf(x.unit) }));
  const result = (over: Partial<SessionResult> = {}): SessionResult => ({ kind: "lesson", courseId: "es-en", lessonId: "es1.1", total: 10, correctFirstTry: 10, seconds: 120,
    words: [{ wordId: "es1.1.w1", correct: true }, { wordId: "es1.1.w2", correct: false }], missedSentences: ["es1.1.s2"], fixedSentences: [], ...over });
  it("completing a lesson updates XP, streak, review, mistakes, quests and achievements", () => {
    const { state, summary } = completeSession(initialState(T0), result(), T0);
    expect(summary).toMatchObject({ xp: 20, perfect: true, streak: 1, firstTime: true }); expect(state.xp).toBe(20); expect(state.gems).toBeGreaterThanOrEqual(5);
    expect(state.completed["es-en:es1.1"].count).toBe(1); expect(state.review["es-en:es1.1.w1"].interval).toBe(1); expect(state.review["es-en:es1.1.w2"].lapses).toBe(1);
    expect(state.mistakes).toHaveLength(1); expect(state.achievements["first-lesson"]).toBe(T0); expect(summary.achievements).toContain("perfect-1");
    const again = completeSession(state, result({ fixedSentences: ["es1.1.s2"], missedSentences: [] }), T0 + 60_000);
    expect(again.summary.firstTime).toBe(false); expect(again.state.mistakes).toHaveLength(0); expect(again.state.streak.count).toBe(1);
  });
  it("unlocks lessons in order and through placement", () => {
    let s = initialState(T0); expect(isLessonUnlocked(s, "es-en", order, 0)).toBe(true); expect(isLessonUnlocked(s, "es-en", order, 1)).toBe(false);
    s = completeSession(s, result(), T0).state; expect(isLessonUnlocked(s, "es-en", order, 1)).toBe(true); expect(isLessonUnlocked(s, "es-en", order, 4)).toBe(false);
    const fail = completeSession(s, result({ kind: "testout", lessonId: undefined, unlockUnit: 1, correctFirstTry: 5 }), T0); expect(fail.summary.passed).toBe(false); expect(isLessonUnlocked(fail.state, "es-en", order, 4)).toBe(false);
    const pass = completeSession(s, result({ kind: "testout", lessonId: undefined, unlockUnit: 1, correctFirstTry: 9 }), T0); expect(isLessonUnlocked(pass.state, "es-en", order, 4)).toBe(true); expect(isLessonUnlocked(pass.state, "es-en", order, 5)).toBe(false);
  });
  it("sells streak freezes for gems only, capped at two", () => {
    let s = { ...initialState(T0), gems: 160 }; s = buyStreakFreeze(buyStreakFreeze(buyStreakFreeze(s))); expect(s.streak.freezes).toBe(2); expect(s.gems).toBe(60);
    expect(buyStreakFreeze({ ...initialState(T0), gems: 10 }).streak.freezes).toBe(0);
  });
});

import { scriptedReply, parseModelJson } from "../tutor/engine";
import { SCENARIOS } from "../tutor/scenarios";
describe("scripted tutor", () => {
  const base = { scenario: "restaurant", target: "es" as const, targetName: "Spanish", nativeName: "English", level: "beginner" };
  it("opens, coaches once on a miss, then advances and finishes", () => {
    const open = scriptedReply({ ...base, history: [], step: 0, retry: false })!; expect(open.reply).toContain("mesa");
    const miss = scriptedReply({ ...base, history: [{ role: "learner", text: "xyz" }], step: 0, retry: false })!; expect(miss).toMatchObject({ step: 0, retry: true }); expect(miss.tip).toContain("mesa");
    const hit = scriptedReply({ ...base, history: [{ role: "learner", text: "Sí, por favor" }], step: 0, retry: false })!; expect(hit.step).toBe(1);
    expect(scriptedReply({ ...base, history: [{ role: "learner", text: "la cuenta" }], step: 3, retry: false })!.done).toBe(true);
    expect(scriptedReply({ ...base, target: "hi", history: [], step: 0, retry: false })).toBeNull();
    for (const sc of SCENARIOS) for (const lang of ["es", "fr", "en"] as const) expect(scriptedReply({ ...base, scenario: sc.id, target: lang, history: [], step: 0, retry: false }), `${sc.id}/${lang}`).not.toBeNull();
    expect(scriptedReply({ ...base, target: "en", nativeName: "Hindi", history: [], step: 0, retry: false })!.translation).not.toContain(" / ");
  });
  it("parses model JSON defensively", () => { expect(parseModelJson('ok {"reply":"Hola","vocab":[{"t":"hola","n":"hello"},3]}')).toMatchObject({ reply: "Hola", vocab: [{ t: "hola", n: "hello" }] }); expect(parseModelJson("nope")).toBeNull(); expect(parseModelJson('{"reply":""}')).toBeNull(); });
});

import { lintCourse } from "../content/lint";
describe("content", () => { for (const c of COURSES) it(`${c.id} passes automated content checks`, () => expect(lintCourse(c)).toEqual([])); });

import { collectKeys } from "../../../scripts/i18n-keys";
import { es as esDict } from "../i18n/es";
import { hi as hiDict } from "../i18n/hi";
import { translate } from "../i18n/translate";
describe("interface translations", () => {
  const keys = collectKeys("src");
  it("every interface string has a Spanish and a Hindi translation", () => {
    expect(keys.filter((k) => !esDict[k])).toEqual([]);
    expect(keys.filter((k) => !hiDict[k])).toEqual([]);
  });
  it("translations keep every {placeholder}", () => {
    const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
    for (const k of keys) { expect(vars(esDict[k]), k).toBe(vars(k)); expect(vars(hiDict[k]), k).toBe(vars(k)); }
  });
  it("fills placeholders and falls back to English", () => {
    expect(translate("es", "Unit {n}", { n: 2 })).toBe("Unidad 2"); expect(translate("hi", "Unit {n}", { n: 2 })).toBe("इकाई 2"); expect(translate("es", "not a key")).toBe("not a key");
  });
});

import { buildSession, placementUnit, PLACEMENT_SEED, type SessionPlan } from "./plan";
import { gradeAttempts, GradeError, type Attempt } from "./grade";
import { withDayOffset } from "./gamification";
import { assessSpeech } from "./text";
import { buildDelta } from "../state/delta";
import { sanitizeGuest } from "../server/progress";
import type { Exercise } from "./exercises";

const rightAnswer = (e: Exercise): Attempt => ({ id: e.id, answer:
  e.type === "choose" || e.type === "fill" ? { type: e.type, index: e.answer } : e.type === "match" ? { type: "match", mistakes: 0 }
  : e.type === "speak" ? { type: "speak", transcript: e.text } : { type: e.type, text: e.accepted[0] } });

describe("server-side grading", () => {
  const c = getCourse("es-en");
  const plan: SessionPlan = { type: "lesson", courseId: "es-en", lessonId: "es1.1", seed: 99, speech: true, reviewWordIds: [] };
  it("rebuilds identical exercises from a plan, so the server grades what the learner saw", () => {
    expect(buildSession(c, plan)).toEqual(buildSession(c, plan));
    expect(buildSession(c, { ...plan, seed: 100 })!.exercises).not.toEqual(buildSession(c, plan)!.exercises);
    expect(buildSession(c, plan)!.exercises.some((e) => e.type === "dictation")).toBe(true);
    expect(buildSession(c, { ...plan, lessonId: "nope" })).toBeNull();
    expect(buildSession(c, { type: "testout", courseId: "es-en", unit: 9, seed: 1 })).toBeNull();
    expect(buildSession(getCourse("fr-en"), { type: "placement", courseId: "fr-en", seed: PLACEMENT_SEED })).toBeNull();
  });
  it("grades first attempts and reports words, misses and accuracy", () => {
    const built = buildSession(c, plan)!;
    const all = built.exercises.map(rightAnswer);
    const perfect = gradeAttempts(c, built, all, 120);
    expect(perfect).toMatchObject({ kind: "lesson", lessonId: "es1.1", total: built.exercises.length, correctFirstTry: built.exercises.length, missedSentences: [] });
    const wrong = all.map((a, i) => (i === 0 ? { id: a.id, answer: { type: "choose" as const, index: -1 } } : a));
    expect(gradeAttempts(c, built, wrong, 120).correctFirstTry).toBe(built.exercises.length - 1);
  });
  it("rejects incomplete or illegitimately skipped sessions", () => {
    const built = buildSession(c, plan)!; const all = built.exercises.map(rightAnswer);
    expect(() => gradeAttempts(c, built, all.slice(1), 60)).toThrow(GradeError);
    expect(() => gradeAttempts(c, built, all.map((a, i) => (i === 0 ? { id: a.id, skipped: true } : a)), 60)).toThrow(/cannot be skipped/);
    const skipSpeech = all.map((a) => (["speak", "listen", "dictation"].includes(built.exercises.find((e) => e.id === a.id)!.type) ? { id: a.id, skipped: true } : a));
    expect(gradeAttempts(c, built, skipSpeech, 60).total).toBe(built.exercises.length - 3);
  });
  it("places learners from the placement score and grades stories as questions", () => {
    expect([placementUnit(c, 1), placementUnit(c, 0.6), placementUnit(c, 0.2)]).toEqual([2, 1, 0]);
    const p = buildSession(c, { type: "placement", courseId: "es-en", seed: 7 })!;
    expect(gradeAttempts(c, p, p.exercises.map(rightAnswer), 90).unlockUnit).toBe(2);
    const story = buildSession(c, { type: "story", courseId: "es-en", storyId: "es1-story", seed: 1 })!;
    expect(gradeAttempts(c, story, story.exercises.map((e, i) => (i === 0 ? { id: e.id, answer: { type: "choose" as const, index: -1 } } : rightAnswer(e))), 30)).toMatchObject({ kind: "story", storyId: "es1-story", total: 3, correctFirstTry: 2 });
  });
  it("builds every practice mode, including timed matching and writing", () => {
    const words = c.units[0].lessons.flatMap((l) => l.words.map((w) => w.id)), sentences = c.units[0].lessons.flatMap((l) => l.sentences.map((s) => s.id));
    for (const mode of ["review", "mistakes", "listen", "speak", "write", "match"] as const) expect(buildSession(c, { type: "practice", courseId: "es-en", mode, seed: 5, speech: true, wordIds: words, sentenceIds: sentences })!.exercises.length, mode).toBeGreaterThan(2);
    expect(buildSession(c, { type: "practice", courseId: "es-en", mode: "review", seed: 5, speech: true, wordIds: [], sentenceIds: [] })).toBeNull();
  });
});

describe("server authority helpers", () => {
  it("uses the learner's clock for day boundaries", () => {
    const t = Date.UTC(2026, 10, 14, 23, 30);
    expect(withDayOffset(0, () => dayKey(t))).toBe("2026-11-14"); expect(withDayOffset(330, () => dayKey(t))).toBe("2026-11-15"); expect(withDayOffset(-480, () => dayKey(t))).toBe("2026-11-14");
  });
  it("turns a state change into a delta with only what changed", () => {
    const a = initialState(T0); const { state: b } = completeSession(a, { kind: "lesson", courseId: "es-en", lessonId: "es1.1", total: 10, correctFirstTry: 9, seconds: 100, words: [{ wordId: "es1.1.w1", correct: true }], missedSentences: ["es1.1.s1"], fixedSentences: [] }, T0);
    const d = buildDelta(a, b);
    expect(d).toMatchObject({ xp: 15, profile: { xp: 15, streak_count: 1 }, completions: [{ course_id: "es-en", lesson_id: "es1.1", count: 1 }], review: [{ word_key: "es-en:es1.1.w1" }], mistakes_add: [{ sentence_id: "es1.1.s1" }], mistakes_remove: [] });
    expect(d.xp_events).toHaveLength(1); expect(buildDelta(b, b)).toMatchObject({ xp: 0, completions: [], review: [], xp_events: [], achievements: [] });
  });
  it("refuses to import fabricated guest progress", () => {
    const fake = { ...initialState(T0), xp: 999999, gems: 999999, streak: { count: 400, lastDay: "2026-11-14", freezes: 9, longest: 999 },
      completed: { "es-en:es1.1": { count: 1, bestAccuracy: 1, at: T0 }, "es-en:es3.4": { count: 1, bestAccuracy: 1, at: T0 }, "es-en:made.up": { count: 1, bestAccuracy: 1, at: T0 } },
      review: { "es-en:es1.1.w1": { reps: 2, interval: 3, ease: 2.4, due: T0, lapses: 0, seen: 2, last: T0 }, "es-en:fake.w9": { reps: 9, interval: 99, ease: 9, due: T0, lapses: 0, seen: 9, last: T0 } } };
    const s = sanitizeGuest(fake, T0 + 1000);
    expect(Object.keys(s.completed)).toEqual(["es-en:es1.1"]);                       // locked and invented lessons are dropped
    expect(Object.keys(s.review)).toEqual(["es-en:es1.1.w1"]);
    expect(s.xp).toBeLessThanOrEqual(45); expect(s.gems).toBeLessThanOrEqual(20); expect(s.streak.count).toBeLessThanOrEqual(1); expect(s.streak.freezes).toBeLessThanOrEqual(2);
    expect(s.xpEvents.reduce((n, e) => n + e.amount, 0)).toBeLessThanOrEqual(50);
  });
  it("gives word-level speaking feedback", () => {
    const r = assessSpeech("hola buenas dias", "Hola, buenos días."); expect(r.words.map((w) => w.heard)).toEqual([true, false, true]); expect(r.score).toBeCloseTo(2 / 3);
  });
});
