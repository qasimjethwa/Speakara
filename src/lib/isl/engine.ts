/**
 * Adaptive lesson engine for the ISL teacher.
 *
 * A pure state machine: every learner action (answer, "explain again", "harder", …) produces the next teaching step,
 * including the teacher's mood. It keeps a learner model — words taught, answers, repeated mistakes, difficulty,
 * preferred pace, revision queue — and chooses the next activity from it. No network, no randomness outside a seeded
 * hash, so it is fully testable and works offline. It never produces signs: a step names a word, and the UI plays that
 * word's sign only if a reviewed clip exists.
 */
import type { IslCourse, IslUnit, VocabItem } from "./courses";
import { checkWritten } from "./courses";
import type { Mood } from "./expression";

export type Difficulty = 1 | 2 | 3;
export interface Answer { wordId: string; ok: boolean; kind: QuestionKind }
export interface LearnerModel {
  taught: string[]; answers: Answer[]; mistakes: Record<string, number>; streak: number; misses: number;
  difficulty: Difficulty; speed: 1 | 0.5 | 0.25; revision: string[]; completed: string[];
}
export type QuestionKind = "meaning" | "word" | "type";
export interface Question { kind: QuestionKind; wordId: string; options: string[] }
/** A line for the caption strip: an i18n key with params; `target` marks text in the target language. */
export interface Line { key: string; params?: Record<string, string | number>; target?: string }
export type StepKind = "greet" | "intro" | "teach" | "example" | "check" | "feedback" | "meaning" | "practice" | "recap" | "done";
export interface Step { kind: StepKind; mood: Mood; wordId?: string; lines: Line[]; question?: Question; correct?: boolean; given?: string }
export interface LessonState { courseId: string; unitId: string; queue: string[]; current: number; exampleIdx: number; attempt: number; model: LearnerModel; step: Step }

export type Action =
  | { type: "continue" } | { type: "answer"; value: string } | { type: "explain" } | { type: "example" }
  | { type: "easier" } | { type: "harder" } | { type: "repeat" } | { type: "slower" } | { type: "meaning" } | { type: "practice" };

export const newModel = (): LearnerModel => ({ taught: [], answers: [], mistakes: {}, streak: 0, misses: 0, difficulty: 1, speed: 1, revision: [], completed: [] });

const hash = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
function word(unit: IslUnit, id?: string): VocabItem { return unit.vocab.find((w) => w.id === id) ?? unit.vocab[0]; }

/** Example sentences for a word, from the unit's own content (no generated text). */
export function examplesFor(unit: IslUnit, w: VocabItem): { text: string; meaning: string }[] {
  const needle = w.text.toLowerCase();
  const out = [{ text: w.example, meaning: w.exampleMeaning }];
  for (const s of unit.reading.sentences) if (s.text.toLowerCase().includes(needle)) out.push({ text: s.text, meaning: s.meaning });
  for (const g of unit.grammar) for (const e of g.examples) if (e.text.toLowerCase().includes(needle)) out.push({ text: e.text, meaning: e.meaning });
  return out.filter((e, i) => out.findIndex((x) => x.text === e.text) === i);
}

/** Builds a question for the learner's difficulty: 1 = 2 choices, 2 = 3 choices both directions, 3 = type the word. */
export function makeQuestion(unit: IslUnit, wordId: string, d: Difficulty, salt: number): Question {
  const kind: QuestionKind = d === 3 ? "type" : d === 2 && (hash(wordId + salt) & 1) ? "word" : "meaning";
  if (kind === "type") return { kind, wordId, options: [] };
  const others = unit.vocab.filter((w) => w.id !== wordId).sort((a, b) => hash(a.id + salt) - hash(b.id + salt)).slice(0, d === 1 ? 1 : 2).map((w) => w.id);
  const options = [wordId, ...others].sort((a, b) => hash(a + "o" + salt) - hash(b + "o" + salt));
  return { kind, wordId, options };
}

const PRAISE = [/*i18n*/ "Exactly right!", /*i18n*/ "Well done, that’s correct.", /*i18n*/ "Yes! You’ve got it."];
const GENTLE = [/*i18n*/ "Not quite, and that’s fine. Let’s look again.", /*i18n*/ "Close! Let’s go over it once more.", /*i18n*/ "Good try. Watch it again with me."];

function teach(s: LessonState, unit: IslUnit): Step {
  const w = word(unit, s.queue[s.current]);
  return { kind: "teach", mood: "explaining", wordId: w.id, lines: [{ key: /*i18n*/ "A new word: {w}", params: { w: w.text }, target: w.text }, { key: /*i18n*/ "It means “{m}”.", params: { m: w.meaning } }] };
}
function check(s: LessonState, unit: IslUnit): Step {
  const id = s.queue[s.current]; const q = makeQuestion(unit, id, s.model.difficulty, s.attempt + s.model.answers.length);
  const key = q.kind === "meaning" ? /*i18n*/ "What does this word mean?" : q.kind === "word" ? /*i18n*/ "Which word means “{m}”?" : /*i18n*/ "Type the word that means “{m}”.";
  return { kind: "check", mood: "listening", wordId: id, question: q, lines: [{ key, params: { m: word(unit, id).meaning } }] };
}
function advance(s: LessonState, unit: IslUnit): LessonState {
  const next = s.current + 1;
  if (next < s.queue.length) { const n = { ...s, current: next, attempt: 0, exampleIdx: 0 }; return { ...n, step: teach(n, unit) }; }
  const rev = s.model.revision.filter((id) => !s.queue.slice(s.current + 1).includes(id));
  if (rev.length) {
    const n = { ...s, queue: [...s.queue, ...rev], current: next, attempt: 0, exampleIdx: 0, model: { ...s.model, revision: [] } };
    return { ...n, step: { kind: "intro", mood: "encouraging", wordId: rev[0], lines: [{ key: /*i18n*/ "Let’s revise the words that were tricky." }] } };
  }
  const total = s.model.answers.length, right = s.model.answers.filter((a) => a.ok).length;
  return { ...s, current: next, step: { kind: "recap", mood: "celebrating", lines: [{ key: /*i18n*/ "You learned {n} words in this lesson.", params: { n: s.model.taught.length } }, { key: /*i18n*/ "You answered {r} of {t} questions correctly.", params: { r: right, t: total } }] } };
}

export function startLesson(course: IslCourse, unit: IslUnit, model: LearnerModel = newModel()): LessonState {
  const queue = unit.vocab.map((w) => w.id);
  return { courseId: course.id, unitId: unit.id, queue, current: 0, exampleIdx: 0, attempt: 0, model,
    step: { kind: "greet", mood: "welcoming", lines: [{ key: /*i18n*/ "Hello! I’m your ISL teacher." }, { key: /*i18n*/ "Today: {u}", params: { u: unit.titleMeaning || unit.title } }] } };
}

/** Score 0..100 for progress records: answers right, with repeated mistakes costing less than a skip. */
export const lessonScore = (m: LearnerModel) => m.answers.length ? Math.round(100 * m.answers.filter((a) => a.ok).length / m.answers.length) : 0;

export function reduce(s: LessonState, unit: IslUnit, a: Action): LessonState {
  const w = word(unit, s.queue[s.current]);
  const m = s.model;
  switch (a.type) {
    case "continue": {
      const k = s.step.kind;
      if (k === "greet") return { ...s, step: { kind: "intro", mood: "explaining", lines: [{ key: /*i18n*/ "I’ll show you each word, then ask you about it. Use the buttons any time to slow down or ask for help." }] } };
      if (k === "intro") return { ...s, step: teach(s, unit) };
      if (k === "teach" || k === "example" || k === "meaning" || k === "practice") {
        const taught = m.taught.includes(w.id) ? m.taught : [...m.taught, w.id];
        const n = { ...s, model: { ...m, taught } }; return { ...n, step: check(n, unit) };
      }
      if (k === "check") return s;  // needs an answer
      if (k === "feedback") {
        if (s.step.correct) return advance(s, unit);
        const n = { ...s, attempt: s.attempt + 1 }; return { ...n, step: { ...teach(n, unit), mood: "encouraging" } };
      }
      if (k === "recap") return { ...s, model: { ...m, completed: [...m.completed, `${s.courseId}:${s.unitId}`] }, step: { kind: "done", mood: "celebrating", lines: [{ key: /*i18n*/ "Lesson complete. Great work today!" }] } };
      return s;
    }
    case "answer": {
      if (s.step.kind !== "check" || !s.step.question) return s;
      const q = s.step.question;
      const ok = q.kind === "type" ? checkWritten(a.value, [w.text]) : a.value === q.wordId;
      const answers = [...m.answers, { wordId: w.id, ok, kind: q.kind }];
      const mistakes = ok ? m.mistakes : { ...m.mistakes, [w.id]: (m.mistakes[w.id] ?? 0) + 1 };
      const streak = ok ? m.streak + 1 : 0, misses = ok ? 0 : m.misses + 1;
      let difficulty = m.difficulty;
      if (streak >= 3 && difficulty < 3) difficulty = (difficulty + 1) as Difficulty;
      if (misses >= 2 && difficulty > 1) difficulty = (difficulty - 1) as Difficulty;
      const revision = !ok && (mistakes[w.id] ?? 0) >= 2 && !m.revision.includes(w.id) ? [...m.revision, w.id] : m.revision;
      const model: LearnerModel = { ...m, answers, mistakes, streak: streak >= 3 ? 0 : streak, misses: misses >= 2 ? 0 : misses, difficulty, revision };
      const pick = hash(w.id + answers.length) % 3;
      const lines: Line[] = ok ? [{ key: PRAISE[pick] }, { key: /*i18n*/ "“{w}” means “{m}”.", params: { w: w.text, m: w.meaning }, target: w.text }]
        : [{ key: GENTLE[pick] }, { key: /*i18n*/ "“{w}” means “{m}”.", params: { w: w.text, m: w.meaning }, target: w.text }];
      if (difficulty > m.difficulty) lines.push({ key: /*i18n*/ "You’re doing well, so the next questions will be a little harder." });
      if (difficulty < m.difficulty) lines.push({ key: /*i18n*/ "Let’s make the next questions a little easier." });
      // a wrong answer after a retry moves on (the word is queued for revision) so a learner is never stuck
      const correct = ok || s.attempt >= 1;
      return { ...s, model, step: { kind: "feedback", mood: ok ? "celebrating" : "correcting", wordId: w.id, correct, given: a.value, lines } };
    }
    case "explain": {
      const ex = examplesFor(unit, w)[0];
      return { ...s, step: { kind: "teach", mood: "explaining", wordId: w.id, lines: [{ key: /*i18n*/ "Let me explain again: “{w}” means “{m}”.", params: { w: w.text, m: w.meaning }, target: w.text }, { key: /*i18n*/ "For example: {e}", params: { e: ex.text }, target: ex.text }, { key: ex.meaning }] } };
    }
    case "example": {
      const all = examplesFor(unit, w); const i = (s.exampleIdx + 1) % all.length; const ex = all[i];
      return { ...s, exampleIdx: i, step: { kind: "example", mood: "explaining", wordId: w.id, lines: [{ key: /*i18n*/ "Another example:" }, { key: ex.text, target: ex.text }, { key: ex.meaning }] } };
    }
    case "meaning": return { ...s, step: { kind: "meaning", mood: "explaining", wordId: w.id, lines: [{ key: w.text, target: w.text }, { key: w.meaning }] } };
    case "easier": case "harder": {
      const d = Math.max(1, Math.min(3, m.difficulty + (a.type === "easier" ? -1 : 1))) as Difficulty;
      const n = { ...s, model: { ...m, difficulty: d, streak: 0, misses: 0 } };
      const step = s.step.kind === "check" ? check(n, unit) : s.step;
      return { ...n, step: { ...step, mood: "encouraging", lines: [{ key: a.type === "easier" ? /*i18n*/ "Sure, let’s make it easier." : /*i18n*/ "Great, here’s a harder one." }, ...step.lines.filter((l) => !/easier|harder/.test(l.key))] } };
    }
    case "slower": return { ...s, model: { ...m, speed: m.speed === 1 ? 0.5 : m.speed === 0.5 ? 0.25 : 1 } };
    case "repeat": return { ...s, step: { ...s.step, kind: s.step.kind === "check" ? "check" : s.step.kind, mood: s.step.mood } };
    case "practice": return { ...s, step: { kind: "practice", mood: "encouraging", wordId: w.id, lines: [{ key: /*i18n*/ "Practise “{w}”: copy the sign in front of your camera, then come back.", params: { w: w.text }, target: w.text }] } };
  }
}
