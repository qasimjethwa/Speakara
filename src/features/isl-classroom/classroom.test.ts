import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import fixtures from "./__fixtures__/parity.json";
import { sequence, type RawFrame } from "./recognition/features";
import { classify, type SignModel } from "./recognition/classifier";
import { current, lessonScore, moodOf, reduce, startClass, teacherLine } from "./engine";
import { LESSONS, SIGNS, progressId } from "./content";

describe("recognition features", () => {
  it("match the Python trainer exactly (same input → same features)", () => {
    for (const f of (fixtures as unknown) as { frames: RawFrame[]; seqSum: number; seq0: number[]; seq12: number[] }[]) {
      const s = sequence(f.frames)!;
      expect(s).not.toBeNull();
      s[0].forEach((v, i) => expect(v).toBeCloseTo(f.seq0[i], 6));
      s[12].forEach((v, i) => expect(v).toBeCloseTo(f.seq12[i], 6));
      expect(s.flat().reduce((a, v) => a + v, 0)).toBeCloseTo(f.seqSum, 3);
    }
  });
  it("returns nothing to judge when no hands are seen", () => {
    expect(sequence(Array.from({ length: 30 }, () => ({ pose: null, hands: [] })))).toBeNull();
  });
});

const MODEL = "public/isl-classroom/model.json";
describe.skipIf(!existsSync(MODEL))("recogniser verdicts", () => {
  const model = JSON.parse(readFileSync(MODEL, "utf8")) as SignModel;
  const [gm, hello] = (fixtures as unknown) as { label: string; frames: RawFrame[] }[];
  it("poor camera capture is never judged right or wrong", () => {
    expect(classify(model, gm.frames.map((f) => ({ ...f, hands: [] })), "Good Morning").outcome).toBe("poor_capture");
    expect(classify(model, [], "Good Morning").outcome).toBe("poor_capture");
  });
  it("a real Good Morning (a training clip) is accepted for Good Morning and not for Hello", () => {
    expect(classify(model, gm.frames, "Good Morning").outcome).toBe("correct");
    expect(classify(model, gm.frames, "Hello").outcome).not.toBe("correct");
    expect(classify(model, hello.frames, "Hello").outcome).toBe("correct");
  });
  it("only claims 'incorrect' when another known sign is confidently recognised", () => {
    const v = classify(model, hello.frames, "Good Morning");
    if (v.outcome === "incorrect") expect(v.lookedLike).toBe("Hello");
    else expect(v.outcome).toBe("uncertain");
  });
  it("every sign taught in a lesson has a demonstration video", () => {
    for (const l of LESSONS) for (const id of l.signs) expect(existsSync(`public/isl-classroom/signs/${id}.mp4`), id).toBe(true);
  });
});

describe("teaching engine", () => {
  const start = () => reduce(startClass("greet", ["hello", "goodmorning"]), { type: "start" });
  it("demonstrates, invites, judges and moves on after a correct attempt", () => {
    let s = start(); expect(s.phase).toBe("demo"); expect(moodOf(s)).toBe("signing");
    s = reduce(s, { type: "demo_end" }); expect(s.phase).toBe("your_turn"); expect(moodOf(s)).toBe("attentive");
    s = reduce(s, { type: "begin_attempt" }); s = reduce(s, { type: "analysing" }); expect(moodOf(s)).toBe("thinking");
    s = reduce(s, { type: "verdict", outcome: "correct" }); expect(moodOf(s)).toBe("celebrate");
    s = reduce(s, { type: "continue" }); expect(s.phase).toBe("check");
    s = reduce(s, { type: "check_done" }); expect(current(s)).toBe("goodmorning"); expect(s.phase).toBe("demo");
  });
  it("an incorrect attempt shows the sign again, and two misses slow it down", () => {
    let s = reduce(reduce(start(), { type: "demo_end" }), { type: "begin_attempt" });
    s = reduce(s, { type: "verdict", outcome: "incorrect", lookedLike: "Hello" }); expect(moodOf(s)).toBe("encourage");
    s = reduce(s, { type: "continue" }); expect(s.phase).toBe("demo"); expect(s.slow).toBe(false);
    s = reduce(reduce(reduce(s, { type: "demo_end" }), { type: "begin_attempt" }), { type: "verdict", outcome: "incorrect" });
    expect(s.slow).toBe(true);
  });
  it("uncertain and poor capture never count as mistakes", () => {
    let s = reduce(reduce(start(), { type: "demo_end" }), { type: "begin_attempt" });
    s = reduce(s, { type: "verdict", outcome: "uncertain" }); expect(s.tries).toBe(0); expect(moodOf(s)).toBe("guide");
    expect(teacherLine(s, "Hello").key).toMatch(/not sure/);
    s = reduce(s, { type: "verdict", outcome: "poor_capture" }); expect(teacherLine(s, "Hello").key).toMatch(/couldn’t see you/);
  });
  it("signs missed during the lesson come back once for review", () => {
    let s = reduce(reduce(start(), { type: "demo_end" }), { type: "begin_attempt" });
    s = reduce(s, { type: "verdict", outcome: "incorrect" });
    s = reduce(s, { type: "skip" }); expect(current(s)).toBe("goodmorning");
    s = reduce(s, { type: "skip" }); expect(current(s)).toBe("hello"); expect(s.queue).toHaveLength(3);
    s = reduce(s, { type: "skip" }); expect(s.phase).toBe("complete");
    expect(lessonScore(s)).toBe(0);
  });
  it("progress ids fit the existing isl_progress format", () => {
    for (const x of SIGNS) for (const c of ["english", "spanish"] as const) expect(progressId(c, x.id)).toMatch(/^(english|spanish):[a-z0-9]{2,8}:[a-z]{3,20}$/);
  });
});
