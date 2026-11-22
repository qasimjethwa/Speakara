import { describe, expect, it } from "vitest";
import { checkWritten, ISL_COURSES, SIGN_IDS } from "./courses";
import { checkClip, cueAt, MOTION_TEST, poseAt, READY, RELAXED, type SignClip } from "./rig";

describe("ISL courses", () => {
  it("has two distinct courses with the same shape", () => {
    const [en, es] = ISL_COURSES;
    expect(en.id).toBe("english"); expect(es.id).toBe("spanish");
    expect(en.units.length).toBe(es.units.length);
    const enWords = new Set(en.units.flatMap((u) => u.vocab.map((v) => v.text)));
    expect(es.units.flatMap((u) => u.vocab.map((v) => v.text)).some((w) => enWords.has(w))).toBe(false);
  });
  it("uses sign ids the database accepts and unique item ids", () => {
    for (const s of SIGN_IDS) expect(s).toMatch(/^[A-Z0-9][A-Z0-9-]{0,40}$/);
    const ids = ISL_COURSES.flatMap((c) => c.units.flatMap((u) => u.vocab.map((v) => v.id)));
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of ISL_COURSES) for (const u of c.units) expect(`${c.id}:${u.id}:reading`).toMatch(/^(english|spanish):[a-z0-9]{2,8}:[a-z]{3,20}$/);
  });
  it("has answerable exercises", () => {
    for (const c of ISL_COURSES) for (const u of c.units) {
      for (const q of [...u.quiz, ...u.reading.questions]) expect(q.answer).toBeLessThan(q.options.length);
      for (const w of u.writing) {
        if (w.kind === "arrange") expect([...w.words].sort().join(" ")).toBe(w.answer.split(" ").sort().join(" "));
        else expect(w.answer.length).toBeGreaterThan(0);
        if (w.kind === "correct") expect(checkWritten(w.wrong, w.answer)).toBe(false);
      }
      expect(u.vocab.length).toBeGreaterThanOrEqual(8); expect(u.grammar.length).toBeGreaterThan(0);
    }
  });
  it("checks written answers leniently but not loosely", () => {
    expect(checkWritten("  my name is ravi ", ["My name is Ravi."])).toBe(true);
    expect(checkWritten("¿Cómo te llamas?", ["¿Cómo te llamas?"])).toBe(true);
    expect(checkWritten("Cómo te llamas?", ["¿Cómo te llamas?"])).toBe(false);
    expect(checkWritten("la", ["el"])).toBe(false);
  });
});

describe("signing rig", () => {
  it("interpolates between keyframes and clamps at the ends", () => {
    const a = poseAt(MOTION_TEST, 0), b = poseAt(MOTION_TEST, 1.6), c = poseAt(MOTION_TEST, 99);
    expect(a.bones.Bip01_R_Forearm).toEqual(RELAXED.bones.Bip01_R_Forearm);
    expect(b.bones.Bip01_R_Forearm).toEqual(READY.bones.Bip01_R_Forearm);
    expect(c.bones.Bip01_R_Forearm).toEqual(RELAXED.bones.Bip01_R_Forearm);
    const mid = poseAt(MOTION_TEST, 0.55).bones.Bip01_R_Forearm![2];
    expect(mid).toBeLessThan(RELAXED.bones.Bip01_R_Forearm![2]); expect(mid).toBeGreaterThan(READY.bones.Bip01_R_Forearm![2]);
  });
  it("finds the caption cue for a time", () => { expect(cueAt(MOTION_TEST, 1.5)?.text).toMatch(/Signing space/); expect(cueAt(null, 1)).toBeNull(); });
  it("never accepts a validated sign without a named reviewer", () => {
    const c: SignClip = { id: "HELLO", gloss: "hello", duration: 1, keys: [{ t: 0, pose: READY }], status: "validated" };
    expect(checkClip(c)).toMatch(/reviewer/);
    expect(checkClip({ ...c, reviewedBy: "A. Signer (Deaf ISL educator)" })).toBeNull();
    expect(checkClip({ ...c, status: "awaiting_validation", keys: [{ t: 1, pose: READY }, { t: 0, pose: READY }] })).toMatch(/order/);
    expect(MOTION_TEST.notTeaching).toBe(true);
  });
});
