/**
 * Classroom teaching engine (pure, testable). Drives what the teacher does next from what the learner actually did.
 * welcome → demo → your_turn → recording → analysing → feedback → (check) → next sign … → complete
 * Adapts: two misses on a sign → demos switch to slow; signs missed at least once come back for review at the end.
 */
import type { Outcome } from "./recognition/classifier";

export type Phase = "welcome" | "demo" | "your_turn" | "recording" | "analysing" | "feedback" | "check" | "complete";
export type Mood = "warm" | "signing" | "attentive" | "thinking" | "celebrate" | "encourage" | "guide";
export interface Attempt { sign: string; outcome: Outcome | "self"; at: number }
export interface ClassState {
  lesson: string; queue: string[]; index: number; phase: Phase;
  slow: boolean; tries: number; last: Outcome | "self" | null; lookedLike?: string;
  history: Attempt[]; reviewAdded: string[]; demoKey: number;
}
export type Act =
  | { type: "start" } | { type: "demo_end" } | { type: "show_again"; slow?: boolean } | { type: "toggle_slow" }
  | { type: "begin_attempt" } | { type: "analysing" }
  | { type: "verdict"; outcome: Outcome; lookedLike?: string } | { type: "self_check" }
  | { type: "try_again" } | { type: "continue" } | { type: "check_done" } | { type: "skip" };

export function startClass(lesson: string, signs: string[]): ClassState {
  return { lesson, queue: [...signs], index: 0, phase: "welcome", slow: false, tries: 0, last: null, history: [], reviewAdded: [], demoKey: 0 };
}
export const current = (s: ClassState) => s.queue[s.index];

function advance(s: ClassState): ClassState {
  let queue = s.queue; let reviewAdded = s.reviewAdded;
  // at the end of the lesson, bring back signs that needed help (once each)
  if (s.index === queue.length - 1) {
    const missed = [...new Set(s.history.filter((h) => h.outcome === "incorrect").map((h) => h.sign))].filter((x) => !reviewAdded.includes(x));
    if (missed.length) { queue = [...queue, ...missed]; reviewAdded = [...reviewAdded, ...missed]; }
  }
  if (s.index + 1 >= queue.length) return { ...s, queue, reviewAdded, phase: "complete" };
  return { ...s, queue, reviewAdded, index: s.index + 1, phase: "demo", tries: 0, last: null, lookedLike: undefined, slow: false, demoKey: s.demoKey + 1 };
}

export function reduce(s: ClassState, a: Act): ClassState {
  switch (a.type) {
    case "start": return { ...s, phase: "demo", demoKey: s.demoKey + 1 };
    case "demo_end": return s.phase === "demo" ? { ...s, phase: "your_turn" } : s;
    case "show_again": return { ...s, phase: "demo", slow: a.slow ?? s.slow, demoKey: s.demoKey + 1 };
    case "toggle_slow": return { ...s, slow: !s.slow, phase: "demo", demoKey: s.demoKey + 1 };
    case "begin_attempt": return s.phase === "your_turn" || s.phase === "feedback" ? { ...s, phase: "recording" } : s;
    case "analysing": return { ...s, phase: "analysing" };
    case "verdict": {
      const tries = s.tries + (a.outcome === "correct" || a.outcome === "incorrect" ? 1 : 0);
      const history = [...s.history, { sign: current(s), outcome: a.outcome, at: Date.now() }];
      const misses = history.filter((h) => h.sign === current(s) && h.outcome === "incorrect").length;
      return { ...s, phase: "feedback", last: a.outcome, lookedLike: a.lookedLike, tries, history, slow: s.slow || misses >= 2 };
    }
    case "self_check": return { ...s, phase: "feedback", last: "self", history: [...s.history, { sign: current(s), outcome: "self", at: Date.now() }] };
    case "try_again": return { ...s, phase: "your_turn", last: null };
    case "continue":
      if (s.phase === "feedback" && (s.last === "correct" || s.last === "self")) return { ...s, phase: "check" };
      if (s.phase === "feedback" && s.last === "incorrect") return { ...s, phase: "demo", demoKey: s.demoKey + 1 };   // show the sign again
      return s;
    case "check_done": return advance(s);
    case "skip": return advance(s);
  }
}

export function moodOf(s: ClassState): Mood {
  switch (s.phase) {
    case "welcome": case "complete": return s.phase === "complete" ? "celebrate" : "warm";
    case "demo": return "signing";
    case "your_turn": case "recording": return "attentive";
    case "analysing": return "thinking";
    case "check": return "warm";
    case "feedback": return s.last === "correct" || s.last === "self" ? "celebrate" : s.last === "incorrect" ? "encourage" : "guide";
  }
}

/** What the teacher says (captioned). Keys are translated by the UI. */
export function teacherLine(s: ClassState, phraseText: string): { key: string; params?: Record<string, string> } {
  switch (s.phase) {
    case "welcome": return { key: "Welcome to class. I’ll show you each sign, then you try it." };
    case "demo": return { key: s.slow ? "Watch slowly: “{p}”." : "Watch: “{p}”.", params: { p: phraseText } };
    case "your_turn": return { key: "Your turn. Sign “{p}” when you’re ready.", params: { p: phraseText } };
    case "recording": return { key: "I’m watching…" };
    case "analysing": return { key: "Let me look at that…" };
    case "check": return { key: "Quick check: which phrase did you just sign?" };
    case "complete": return { key: "Lesson complete. Lovely signing today." };
    case "feedback":
      if (s.last === "correct") return { key: "Yes! That’s “{p}”.", params: { p: phraseText } };
      if (s.last === "self") return { key: "Well done for practising. Camera checking is off, so I couldn’t check it." };
      if (s.last === "incorrect") return { key: "Not quite — that looked like a different sign. Let’s watch it again." };
      if (s.last === "poor_capture") return { key: "I couldn’t see you clearly. Keep your upper body and both hands in the frame, then try again." };
      return { key: "I’m not sure about that one. Could you try once more?" };
  }
}

/** Lesson score: share of signs finished correctly on the first or second attempt (camera-checked only). */
export function lessonScore(s: ClassState) {
  const signs = [...new Set(s.history.map((h) => h.sign))]; if (!signs.length) return 0;
  const good = signs.filter((x) => s.history.some((h) => h.sign === x && (h.outcome === "correct" || h.outcome === "self"))).length;
  return Math.round((good / signs.length) * 100);
}
