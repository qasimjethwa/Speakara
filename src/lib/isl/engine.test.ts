import { describe, expect, it } from "vitest";
import { ISL_COURSES } from "./courses";
import { lessonScore, makeQuestion, reduce, startLesson, type LessonState } from "./engine";
import { EXPRESSIONS, initialExpression, MOODS, stepExpression } from "./expression";
import { scenariosFor } from "./scenarios";

const course = ISL_COURSES[0], unit = course.units[0];
const go = (s: LessonState, ...a: Parameters<typeof reduce>[2][]) => a.reduce((x, y) => reduce(x, unit, y), s);

describe("lesson engine", () => {
  it("greets, introduces, teaches and asks", () => {
    let s = startLesson(course, unit); expect(s.step.kind).toBe("greet"); expect(s.step.mood).toBe("welcoming");
    s = go(s, { type: "continue" }, { type: "continue" }); expect(s.step.kind).toBe("teach"); expect(s.step.wordId).toBe(unit.vocab[0].id);
    s = go(s, { type: "continue" }); expect(s.step.kind).toBe("check"); expect(s.step.question?.options).toContain(unit.vocab[0].id);
  });
  it("celebrates a right answer and moves on", () => {
    let s = go(startLesson(course, unit), { type: "continue" }, { type: "continue" }, { type: "continue" });
    s = go(s, { type: "answer", value: s.step.question!.wordId }); expect(s.step.mood).toBe("celebrating"); expect(s.step.correct).toBe(true);
    s = go(s, { type: "continue" }); expect(s.step.kind).toBe("teach"); expect(s.step.wordId).toBe(unit.vocab[1].id);
  });
  it("corrects gently, re-teaches, and queues repeated mistakes for revision", () => {
    let s = go(startLesson(course, unit), { type: "continue" }, { type: "continue" }, { type: "continue" });
    s = go(s, { type: "answer", value: "wrong" }); expect(s.step.mood).toBe("correcting"); expect(s.step.correct).toBe(false);
    s = go(s, { type: "continue" }); expect(s.step.kind).toBe("teach"); expect(s.step.wordId).toBe(unit.vocab[0].id);
    s = go(s, { type: "continue" }, { type: "answer", value: "wrong" }); expect(s.step.correct).toBe(true); // moves on, never stuck
    expect(s.model.revision).toContain(unit.vocab[0].id);
  });
  it("adapts difficulty to a streak and to misses", () => {
    let s = go(startLesson(course, unit), { type: "continue" }, { type: "continue" });
    for (let i = 0; i < 3; i++) { s = go(s, { type: "continue" }); s = go(s, { type: "answer", value: s.step.question!.kind === "type" ? unit.vocab[i].text : s.step.question!.wordId }, { type: "continue" }); }
    expect(s.model.difficulty).toBe(2);
    expect(go(s, { type: "easier" }).model.difficulty).toBe(1);
    expect(makeQuestion(unit, unit.vocab[0].id, 3, 0).kind).toBe("type");
    expect(makeQuestion(unit, unit.vocab[0].id, 1, 0).options).toHaveLength(2);
  });
  it("finishes with a recap and a score", () => {
    let s = go(startLesson(course, unit), { type: "continue" }, { type: "continue" });
    for (let i = 0; i < 40 && s.step.kind !== "recap"; i++) s = s.step.kind === "check" ? go(s, { type: "answer", value: s.step.question!.kind === "type" ? unit.vocab.find((w) => w.id === s.step.wordId)!.text : s.step.question!.wordId }) : go(s, { type: "continue" });
    expect(s.step.kind).toBe("recap"); expect(lessonScore(s.model)).toBe(100);
    expect(go(s, { type: "continue" }).step.kind).toBe("done");
  });
  it("explains again and shows other examples from the course content", () => {
    const s = go(startLesson(course, unit), { type: "continue" }, { type: "continue" });
    expect(go(s, { type: "explain" }).step.lines.some((l) => l.params?.e === unit.vocab[0].example)).toBe(true);
    expect(go(s, { type: "slower" }).model.speed).toBe(0.5);
  });
});

describe("expressions", () => {
  it("blends smoothly instead of switching", () => {
    let e = initialExpression(); e = stepExpression(e, "celebrating", false, 1 / 60);
    const w = e.face.AK_44_MouthSmileLeft; expect(w).toBeGreaterThan(0); expect(w).toBeLessThan(EXPRESSIONS.celebrating.face.AK_44_MouthSmileLeft / 4);
    for (let i = 0; i < 120; i++) e = stepExpression(e, "celebrating", false, 1 / 60);
    expect(e.face.AK_44_MouthSmileLeft).toBeCloseTo(EXPRESSIONS.celebrating.face.AK_44_MouthSmileLeft, 2);
  });
  it("fades out entirely while a sign plays, so signs keep their own facial grammar", () => {
    let e = initialExpression(); for (let i = 0; i < 120; i++) e = stepExpression(e, "welcoming", true, 1 / 60);
    expect(e.weight).toBeLessThan(0.01);
  });
  it("never moves the mouth like speech and stays restrained", () => {
    for (const m of MOODS) { const f = EXPRESSIONS[m].face; expect(f.AK_25_JawOpen ?? 0).toBeLessThanOrEqual(0.1); expect(Math.max(...Object.values(f))).toBeLessThanOrEqual(1); }
  });
});

describe("scenarios", () => {
  it.each(["english", "spanish"] as const)("%s has 8 complete scenarios with one right reply per turn", (c) => {
    const list = scenariosFor(c); expect(list).toHaveLength(8);
    for (const s of list) { expect(s.turns.length).toBeGreaterThanOrEqual(3); for (const t of s.turns) expect(t.choices.filter((x) => x.ok)).toHaveLength(1); }
  });
  it("progress ids fit the database format", () => {
    for (const c of ["english", "spanish"] as const) for (const s of scenariosFor(c)) expect(`${c}:scene:${s.id}`).toMatch(/^(english|spanish):[a-z0-9]{2,8}:[a-z]{3,20}$/);
    for (const c of ISL_COURSES) for (const u of c.units) expect(`${c.id}:${u.id}:lesson`).toMatch(/^(english|spanish):[a-z0-9]{2,8}:[a-z]{3,20}$/);
  });
  it("picture writing tasks can be shown as a meaning (no emoji pictures)", () => {
    for (const c of ISL_COURSES) for (const u of c.units) for (const w of u.writing) if (w.kind === "picture")
      expect(u.vocab.some((v) => v.text.toLowerCase() === w.answer[0].toLowerCase().replace(/^(a|an) /, ""))).toBe(true);
  });
});
