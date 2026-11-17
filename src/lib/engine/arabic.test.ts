import { describe, expect, it } from "vitest";
import { arEn } from "../content/courses/ar-en";
import { getCourse, COURSES, allLessons, allSentences } from "../content";
import { lintCourse } from "../content/lint";
import { TARGET_LANGUAGES, courseCard } from "../content/languages";
import { compareText, normalize, tokens, speechScore } from "./text";
import { evaluate, generateLesson, generatePractice, generateUnitTest, mulberry32, PRACTICE_MODES, type Exercise } from "./exercises";
import { buildSession } from "./plan";
import { SCENARIOS } from "../tutor/scenarios";
import { pickVoice } from "../audio";

const ARABIC = /[؀-ۿ]/;
const LATIN = /[A-Za-z]/;

describe("Arabic course: size and structure", () => {
  it("is registered with the ar-SA locale and right-to-left script", () => {
    expect(getCourse("ar-en").id).toBe("ar-en");
    const l = TARGET_LANGUAGES.find((x) => x.code === "ar")!;
    expect(l).toMatchObject({ courseId: "ar-en", tts: "ar-SA", stt: "ar-SA", script: "Arabic", rtl: true });
    expect(arEn.ttsLang).toBe("ar-SA");
    expect(courseCard("ar-en").rtl).toBe(true);
  });
  it("has at least 10 units of 5 lessons, every unit with tips and a story", () => {
    expect(arEn.units.length).toBeGreaterThanOrEqual(10);
    for (const u of arEn.units) {
      expect(u.lessons.length, u.id).toBeGreaterThanOrEqual(5);
      expect(u.tips.length, u.id).toBeGreaterThanOrEqual(2);
      expect(u.story, u.id).toBeDefined();
      expect(u.story!.questions.length).toBeGreaterThanOrEqual(2);
    }
    expect(allLessons(arEn).length).toBeGreaterThanOrEqual(50);
  });
  it("passes the shared content lint", () => { expect(lintCourse(arEn)).toEqual([]); });
  it("target text is Arabic script and English text is Latin", () => {
    for (const { lesson } of allLessons(arEn)) for (const x of [...lesson.words, ...lesson.sentences]) {
      expect(ARABIC.test(x.t) && !LATIN.test(x.t), `${x.id} target “${x.t}”`).toBe(true);
      expect(LATIN.test(x.n) && !ARABIC.test(x.n), `${x.id} English “${x.n}”`).toBe(true);
    }
    for (const u of arEn.units) for (const l of u.story!.lines) expect(ARABIC.test(l.t) && !LATIN.test(l.t)).toBe(true);
  });
  it("uses stable ids in unit.lesson form", () => {
    expect(arEn.units.map((u) => u.id)).toEqual(Array.from({ length: arEn.units.length }, (_, i) => `ar${i + 1}`));
    expect(arEn.units[9].lessons[4].id).toBe("ar10.5");
  });
  it("leaves every existing course, unit and lesson in place", () => {
    expect(COURSES.map((c) => c.id)).toEqual(["es-en", "fr-en", "de-en", "ko-en", "it-en", "ru-en", "ar-en", "en-es", "en-hi"]);
  });
});

describe("Arabic answer checking", () => {
  it("ignores vowel marks, shadda, tanwin and tatweel", () => {
    expect(normalize("أَنا بِخَيْرٍ جِدًّا.")).toBe("أنا بخير جدا");
    expect(normalize("مـرحـبـا")).toBe("مرحبا");
    expect(compareText("انا بخير جدا", ["أَنا بِخَيْرٍ جِدًّا."]).correct).toBe(true);
    const v = compareText("أَنا بِخَيْرٍ جِدًّا", ["أنا بخير جدا."]); expect(v.correct).toBe(true); expect(v.note).toBeUndefined();
  });
  it("treats Arabic punctuation as punctuation", () => {
    expect(tokens("نعم، شكرا. وأنت؟")).toEqual(["نعم", "شكرا", "وأنت"]);
    expect(compareText("كيف حالك", ["كَيْفَ حالُكَ؟"]).correct).toBe(true);
  });
  it("accepts hamza-seat, alef maqsura and ta marbuta variants with a spelling note", () => {
    const v = compareText("انا اسكن في القاهره", ["أنا أسكن في القاهرة."]);
    expect(v).toMatchObject({ correct: true, note: "accent" });
    expect(compareText("مستشفي", ["مُسْتَشْفَى"]).correct).toBe(true);
  });
  it("still rejects a different word", () => {
    expect(compareText("أنا من لبنان", ["أنا من مصر."]).correct).toBe(false);
    expect(compareText("كلب", ["قلب"]).correct).toBe(false);
  });
  it("scores speech without depending on vowel marks", () => {
    expect(speechScore("انا من مصر", "أَنا مِنْ مِصْر.")).toBe(1);
  });
});

describe("Arabic exercises", () => {
  const types = new Set<string>();
  it("every lesson builds a session whose model answers are all graded correct", () => {
    for (const [i, { lesson }] of allLessons(arEn).entries()) {
      const ex = generateLesson(arEn, lesson, { rng: mulberry32(i + 1), speech: true });
      expect(ex.length, lesson.id).toBeGreaterThanOrEqual(8);
      for (const e of ex) { types.add(e.type); expect(evaluate(e, modelAnswer(e)).correct, `${lesson.id} ${e.id}`).toBe(true); }
    }
    expect([...types].sort()).toEqual(["choose", "dictation", "fill", "listen", "match", "speak", "translate", "wordbank"]);
  });
  it("tile distractors and fill-in options never differ from the answer only by vowel marks", () => {
    for (const [i, { lesson }] of allLessons(arEn).entries()) for (const e of generateLesson(arEn, lesson, { rng: mulberry32(i + 7), speech: false })) {
      if (e.type === "fill") { const n = e.options.map(normalize); expect(new Set(n).size, e.id).toBe(n.length); }
      if (e.type === "wordbank" && !e.promptIsTarget || e.type === "listen") {
        const own = new Set(tokens(e.accepted[0]).map(normalize));
        const extra = e.tiles.filter((x) => !tokens(e.accepted[0]).includes(x));
        for (const x of extra) expect(own.has(normalize(x)), `${e.id} distractor ${x}`).toBe(false);
      }
    }
  });
  it("revision: every practice mode, the unit test-out and story sessions build", () => {
    const words = arEn.units[0].lessons.flatMap((l) => l.words), sentences = allSentences(arEn).slice(0, 20);
    for (const m of PRACTICE_MODES) expect(generatePractice(arEn, m, { words, sentences }, { rng: mulberry32(3), speech: true }).length, m).toBeGreaterThan(0);
    expect(generateUnitTest(arEn, [0, 1, 2], mulberry32(5)).length).toBeGreaterThan(5);
    for (const u of arEn.units) {
      const s = buildSession(arEn, { type: "story", courseId: "ar-en", storyId: u.story!.id, seed: 1 })!;
      expect(s.exercises.length).toBe(u.story!.questions.length);
    }
    expect(buildSession(arEn, { type: "placement", courseId: "ar-en", seed: 1 })).not.toBeNull();
  });
});

describe("Arabic tutor and voice", () => {
  it("has at least six scripted scenes", () => { expect(SCENARIOS.filter((s) => s.script?.ar?.length).length).toBeGreaterThanOrEqual(6); });
  it("picks only an Arabic voice and never another language's", () => {
    const v = (lang: string) => ({ lang, name: lang, localService: true, default: false, voiceURI: lang });
    const g = globalThis as unknown as { window?: unknown };
    const had = g.window;
    try {
      g.window = { speechSynthesis: { getVoices: () => [v("en-US"), v("ar-EG"), v("fr-FR")] } };
      expect(pickVoice("ar-SA")?.lang).toBe("ar-EG");
      g.window = { speechSynthesis: { getVoices: () => [v("en-US"), v("fr-FR")] } };
      expect(pickVoice("ar-SA")).toBeNull();
    } finally { g.window = had; }
  });
});

function modelAnswer(e: Exercise) {
  switch (e.type) {
    case "choose": case "fill": return { type: e.type, index: e.answer } as const;
    case "wordbank": case "translate": case "listen": case "dictation": return { type: e.type, text: e.accepted[0] } as const;
    case "speak": return { type: "speak", transcript: e.text } as const;
    case "match": return { type: "match", mistakes: 0 } as const;
  }
}
