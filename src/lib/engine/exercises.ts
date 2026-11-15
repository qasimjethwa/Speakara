import type { Course, Lesson, Sentence, Word } from "../content/types";
import { allLessons, allSentences, allWords } from "../content";
import { compareText, speechScore, tokens, type Verdict } from "./text";

export type ExerciseType = "choose" | "wordbank" | "translate" | "listen" | "dictation" | "speak" | "match" | "fill";
interface Base { id: string; type: ExerciseType; wordIds: string[]; sentenceId?: string; difficulty: 1 | 2 | 3; instruction: string; vars?: Record<string, string> }
export interface ChooseEx extends Base { type: "choose"; prompt: string; promptIsTarget: boolean; options: string[]; answer: number }
export interface WordBankEx extends Base { type: "wordbank"; prompt: string; promptIsTarget: boolean; tiles: string[]; accepted: string[] }
export interface TranslateEx extends Base { type: "translate"; prompt: string; promptIsTarget: boolean; accepted: string[] }
export interface ListenEx extends Base { type: "listen"; audio: string; tiles: string[]; accepted: string[]; translation: string }
export interface DictationEx extends Base { type: "dictation"; audio: string; accepted: string[]; translation: string }
export interface SpeakEx extends Base { type: "speak"; text: string; translation: string }
export interface MatchEx extends Base { type: "match"; pairs: { id: string; t: string; n: string }[] }
export interface FillEx extends Base { type: "fill"; before: string; after: string; options: string[]; answer: number; translation: string; full: string }
export type Exercise = ChooseEx | WordBankEx | TranslateEx | ListenEx | DictationEx | SpeakEx | MatchEx | FillEx;

export type Answer =
  | { type: "choose" | "fill"; index: number }
  | { type: "wordbank" | "translate" | "listen" | "dictation"; text: string }
  | { type: "speak"; transcript: string }
  | { type: "match"; mistakes: number };

export const SPEAK_PASS = 0.6;

/** Central evaluation layer: every exercise type is graded here, deterministically. */
export function evaluate(ex: Exercise, a: Answer): Verdict {
  switch (ex.type) {
    case "choose":
    case "fill": {
      const expected = ex.type === "fill" ? ex.full : ex.options[ex.answer];
      return { correct: a.type === ex.type && a.index === ex.answer, expected };
    }
    case "wordbank": case "translate": case "listen": case "dictation":
      return compareText(a.type === ex.type ? a.text : "", ex.accepted);
    case "speak":
      return { correct: a.type === "speak" && speechScore(a.transcript, ex.text) >= SPEAK_PASS, expected: ex.text };
    case "match":
      return { correct: a.type === "match" && a.mistakes <= 2, expected: ex.pairs.map((p) => `${p.t} = ${p.n}`).join(", ") };
  }
}

/* ---------- deterministic randomness ---------- */
export type Rng = () => number;
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const pick = <T,>(arr: T[], n: number, rng: Rng) => shuffle(arr, rng).slice(0, n);
const uniq = <T,>(arr: T[]) => [...new Set(arr)];

/* ---------- exercise builders ---------- */
function choose(c: Course, w: Word, toNative: boolean, rng: Rng, n: number): ChooseEx {
  const correct = toNative ? w.n : w.t;
  // A distractor must not be another right answer: skip words that share this word's prompt side (soy / estoy → "I am").
  const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  const pool = uniq(allWords(c).filter((x) => !(toNative ? same(x.t, w.t) : same(x.n, w.n))).map((x) => (toNative ? x.n : x.t)).filter((x) => !same(x, correct)));
  const options = shuffle([correct, ...pick(pool, 2, rng)], rng);
  return { id: `choose-${w.id}-${n}`, type: "choose", wordIds: [w.id], difficulty: 1, prompt: toNative ? w.t : w.n, promptIsTarget: toNative,
    instruction: toNative ? "What does this mean?" : "How do you say this in {lang}?", vars: { lang: c.targetName }, options, answer: options.indexOf(correct) };
}
function wordsIn(c: Course, s: Sentence): string[] {
  const lesson = allLessons(c).find((x) => x.lesson.sentences.some((y) => y.id === s.id))?.lesson;
  const low = ` ${tokens(s.t).join(" ").toLowerCase()} `;
  return (lesson?.words ?? []).filter((w) => low.includes(` ${w.t.toLowerCase()} `)).map((w) => w.id);
}
function tilesFor(c: Course, s: Sentence, target: boolean, rng: Rng): string[] {
  const own = tokens(target ? s.t : s.n);
  const lower = new Set(own.map((x) => x.toLowerCase()));
  const others = uniq(allSentences(c).filter((x) => x.id !== s.id).flatMap((x) => tokens(target ? x.t : x.n))).filter((x) => !lower.has(x.toLowerCase()));
  return shuffle([...own, ...pick(others, Math.min(4, Math.max(2, 7 - own.length)), rng)], rng);
}
function wordbank(c: Course, s: Sentence, toNative: boolean, rng: Rng): WordBankEx {
  return { id: `wordbank-${s.id}-${toNative ? "n" : "t"}`, type: "wordbank", sentenceId: s.id, wordIds: wordsIn(c, s), difficulty: 2,
    instruction: "Translate this sentence", prompt: toNative ? s.t : s.n, promptIsTarget: toNative,
    tiles: tilesFor(c, s, !toNative, rng), accepted: toNative ? [s.n, ...(s.alt ?? [])] : [s.t] };
}
function translate(c: Course, s: Sentence, toNative: boolean): TranslateEx {
  return { id: `translate-${s.id}-${toNative ? "n" : "t"}`, type: "translate", sentenceId: s.id, wordIds: wordsIn(c, s), difficulty: 3,
    instruction: "Write this in {lang}", vars: { lang: toNative ? c.nativeName : c.targetName }, prompt: toNative ? s.t : s.n, promptIsTarget: toNative,
    accepted: toNative ? [s.n, ...(s.alt ?? [])] : [s.t] };
}
function listen(c: Course, s: Sentence, rng: Rng): ListenEx {
  return { id: `listen-${s.id}`, type: "listen", sentenceId: s.id, wordIds: wordsIn(c, s), difficulty: 2, instruction: "Tap what you hear",
    audio: s.t, tiles: tilesFor(c, s, true, rng), accepted: [s.t], translation: s.n };
}
function dictation(c: Course, s: Sentence): DictationEx {
  return { id: `dictation-${s.id}`, type: "dictation", sentenceId: s.id, wordIds: wordsIn(c, s), difficulty: 3, instruction: "Type what you hear", audio: s.t, accepted: [s.t], translation: s.n };
}
function speak(c: Course, s: Sentence): SpeakEx {
  return { id: `speak-${s.id}`, type: "speak", sentenceId: s.id, wordIds: wordsIn(c, s), difficulty: 2, instruction: "Speak this sentence", text: s.t, translation: s.n };
}
/** Drops pairs a learner cannot tell apart: identical on both sides (no = no) or sharing a side with an earlier pair. */
function clearPairs(words: Word[]): Word[] {
  const ts = new Set<string>(), ns = new Set<string>(); const out: Word[] = [];
  for (const w of words) { const t = w.t.toLowerCase(), n = w.n.toLowerCase(); if (t === n || ts.has(t) || ns.has(n) || ts.has(n) || ns.has(t)) continue; ts.add(t); ns.add(n); out.push(w); }
  return out.length >= 2 ? out : words;
}
function match(words: Word[], n: number): MatchEx {
  return { id: `match-${words[0].id}-${n}`, type: "match", wordIds: words.map((w) => w.id), difficulty: 1, instruction: "Tap the matching pairs",
    pairs: clearPairs(words).map((w) => ({ id: w.id, t: w.t, n: w.n })) };
}
function fill(c: Course, s: Sentence, rng: Rng): FillEx | null {
  const toks = s.t.split(/\s+/);
  const candidates = toks.map((tok, i) => ({ tok, i, bare: tokens(tok)[0] ?? "" })).filter((x) => x.bare.length >= 2 && !/^[A-ZÁÉÍÓÚÑ]/.test(x.bare) || x.i === 0 && x.bare.length >= 3);
  if (!candidates.length) return null;
  const target = candidates[Math.floor(rng() * candidates.length)];
  const pool = uniq(allSentences(c).flatMap((x) => tokens(x.t)).map((x) => x.toLowerCase())).filter((x) => x !== target.bare.toLowerCase() && x.length >= 2);
  const options = shuffle([target.bare.toLowerCase(), ...pick(pool, 2, rng)], rng);
  const lead = target.tok.slice(0, target.tok.indexOf(target.bare));
  const trail = target.tok.slice(target.tok.indexOf(target.bare) + target.bare.length);
  return { id: `fill-${s.id}-${target.i}`, type: "fill", sentenceId: s.id, wordIds: wordsIn(c, s), difficulty: 2, instruction: "Fill in the blank",
    before: [...toks.slice(0, target.i), lead].join(" ").trim(), after: [trail, ...toks.slice(target.i + 1)].join(" ").replace(/^ (?=[?!.,])/, ""),
    options, answer: options.indexOf(target.bare.toLowerCase()), translation: s.n, full: s.t };
}

export interface SessionOptions { rng: Rng; speech: boolean; reviewWords?: Word[] }

/** Session generator: combines several exercise types into one lesson, easy recognition first, production last. */
export function generateLesson(c: Course, lesson: Lesson, o: SessionOptions): Exercise[] {
  const { rng } = o;
  const w = shuffle(lesson.words, rng), s = shuffle(lesson.sentences, rng);
  const at = <T,>(arr: T[], i: number) => arr[i % arr.length];
  const out: (Exercise | null)[] = [
    choose(c, at(w, 0), true, rng, 0), choose(c, at(w, 1), true, rng, 1),
    wordbank(c, at(s, 0), true, rng),
    match(pick(lesson.words, Math.min(5, lesson.words.length), rng), 0),
    choose(c, at(w, 2), false, rng, 2),
    listen(c, at(s, 1), rng),
    dictation(c, at(s, 2)),
    fill(c, at(s, 3), rng),
    wordbank(c, at(s, 1), false, rng),
    o.speech ? speak(c, at(s, 0)) : choose(c, at(w, 3), false, rng, 3),
    translate(c, at(s, 3), true),
    translate(c, at(s, 2), false),
  ];
  (o.reviewWords ?? []).slice(0, 2).forEach((rw, i) => out.splice(4 + i * 3, 0, choose(c, rw, true, rng, 10 + i)));
  return out.filter((x): x is Exercise => !!x);
}

export type PracticeMode = "review" | "mistakes" | "listen" | "speak" | "write" | "match";
export const PRACTICE_MODES: PracticeMode[] = ["review", "mistakes", "listen", "speak", "write", "match"];
/** Practice sessions draw from material the learner has already met. */
export function generatePractice(c: Course, mode: PracticeMode, material: { words: Word[]; sentences: Sentence[] }, o: SessionOptions): Exercise[] {
  const { rng } = o;
  const s = pick(material.sentences, 6, rng), w = pick(material.words, 8, rng);
  if (!s.length || !w.length) return [];
  if (mode === "listen") return s.map((x, i): Exercise => (i % 2 ? dictation(c, x) : listen(c, x, rng)));
  if (mode === "write") return s.map((x, i): Exercise => (i % 3 === 2 ? dictation(c, x) : translate(c, x, i % 3 === 0)));
  if (mode === "match") { const pool = shuffle(material.words, rng); const rounds: Exercise[] = []; for (let i = 0; i + 4 <= pool.length && rounds.length < 4; i += 4) rounds.push(match(pool.slice(i, i + 5 > pool.length ? pool.length : i + 4), i)); return rounds.length ? rounds : [match(pool.slice(0, Math.max(2, pool.length)), 0)]; }
  if (mode === "speak") return s.map((x) => speak(c, x));
  if (mode === "mistakes") return s.flatMap((x, i) => (i % 2 ? [wordbank(c, x, false, rng)] : [wordbank(c, x, true, rng)]));
  const out: Exercise[] = w.slice(0, 5).map((x, i) => choose(c, x, i % 2 === 0, rng, i));
  if (w.length >= 3) out.splice(2, 0, match(w.slice(0, Math.min(5, w.length)), 1));
  s.slice(0, 3).forEach((x, i) => out.push(i === 2 ? translate(c, x, true) : wordbank(c, x, i === 0, rng)));
  return out;
}

/** Placement / test-out: two recognition and one production item per lesson of the units being tested. */
export function generateUnitTest(c: Course, unitIndexes: number[], rng: Rng): Exercise[] {
  return unitIndexes.flatMap((ui) => {
    const u = c.units[ui];
    if (!u) return [];
    return u.lessons.slice(0, 4).flatMap((l, li) => {
      const s = l.sentences[Math.floor(rng() * l.sentences.length)];
      const w = l.words[Math.floor(rng() * l.words.length)];
      return li % 2 === 0 ? [choose(c, w, true, rng, 50 + li), wordbank(c, s, true, rng)] : [wordbank(c, s, false, rng)];
    });
  });
}
