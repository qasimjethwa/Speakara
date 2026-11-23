/**
 * Speakara Personal Learning Twin — the learner model.
 *
 * Pure, deterministic and testable. Four kinds of knowledge are kept apart and labelled as such:
 *  - EXPLICIT: what the learner told us (goals, interests, preferences) — `TwinPrefs`.
 *  - SELF-REPORTED: how confident they say they feel — `TwinPrefs.confidence`.
 *  - MEASURED: answers graded by the exercise answer key — `LearningEvent`s.
 *  - ESTIMATED: mastery inferred from measured events, always shown with its evidence and an uncertainty label.
 *
 * Mastery uses a recency-weighted Beta estimate (prior 1 right / 1 wrong, half-life 14 days), so one quiz never
 * classifies a learner permanently and old results fade as new evidence arrives.
 */
import type { Answer, Exercise } from "../engine/exercises";
import { evaluate } from "../engine/exercises";

export type Skill = "vocabulary" | "grammar" | "reading" | "writing" | "listening" | "speaking" | "isl";
export const SKILLS: Skill[] = ["vocabulary", "grammar", "reading", "writing", "listening", "speaking", "isl"];
export const SKILL_LABEL: Record<Skill, string> = {
  vocabulary: /*i18n*/ "Vocabulary", grammar: /*i18n*/ "Grammar and sentence building", reading: /*i18n*/ "Reading",
  writing: /*i18n*/ "Writing", listening: /*i18n*/ "Listening", speaking: /*i18n*/ "Speaking practice", isl: /*i18n*/ "ISL comprehension",
};

/** One graded answer. `item` is a word or sentence id when there is one (used to find repeated mistakes). */
export interface LearningEvent { at: number; course: string; skill: Skill; correct: boolean; item?: string; topic?: string; source: "lesson" | "practice" | "story" | "placement" | "testout" | "isl" | "diagnostic" }

export type Interest = "travel" | "study" | "work" | "food" | "social" | "everyday";
export type TeachingStyle = "visual" | "explain" | "practice" | "conversation";
export type Correction = "gentle" | "balanced" | "detailed";
export interface TwinPrefs {
  personalise: boolean;                 // recommendations on/off
  companionContext: boolean;            // share a short learning summary with the AI companion (consent)
  goal?: "travel" | "study" | "work" | "family" | "culture" | "other";
  selfLevel?: "new" | "beginner" | "intermediate";
  style?: TeachingStyle;
  difficulty?: "easier" | "standard" | "challenge";
  correction?: Correction;
  interests: Interest[];
  hardAreas: Skill[];                   // self-reported difficult areas
  confidence: Partial<Record<"speaking" | "writing" | "listening", 1 | 2 | 3 | 4 | 5>>;
  frequency?: "daily" | "few" | "weekly";
  explanationLang?: "en" | "es" | "hi";
  onboarded: boolean;
}
export const defaultPrefs = (): TwinPrefs => ({ personalise: true, companionContext: false, interests: [], hardAreas: [], confidence: {}, onboarded: false });

/* ---------------- capture ---------------- */

/** Which skill an exercise measures. The mapping is fixed and documented, not learned. */
export function skillOf(ex: Exercise, source: LearningEvent["source"]): Skill {
  if (source === "story") return "reading";
  switch (ex.type) {
    case "choose": case "match": return ex.type === "choose" && ex.promptIsTarget ? "reading" : "vocabulary";
    case "wordbank": case "fill": return "grammar";
    case "translate": return ex.promptIsTarget ? "reading" : "writing";
    case "listen": case "dictation": return "listening";
    case "speak": return "speaking";
  }
}

/** Grades first attempts with the real answer key (the same `evaluate` the server uses) and returns events. */
export function eventsFromSession(exercises: Exercise[], attempts: { id: string; answer?: Answer; skipped?: boolean }[], course: string, source: LearningEvent["source"], now: number, topic?: string): LearningEvent[] {
  const byId = new Map(attempts.map((a) => [a.id, a]));
  const out: LearningEvent[] = [];
  for (const ex of exercises) {
    const a = byId.get(ex.id); if (!a || a.skipped || !a.answer) continue;
    out.push({ at: now, course, skill: skillOf(ex, source), correct: evaluate(ex, a.answer).correct, item: ex.sentenceId ?? ex.wordIds[0], topic, source });
  }
  return out;
}

/* ---------------- estimate ---------------- */

const HALF_LIFE_DAYS = 14;
export interface SkillEstimate {
  skill: Skill; mastery: number; low: number; high: number;  // estimate with an approximate 80% interval
  evidence: number;                                          // recency-weighted number of observations
  recent: { correct: number; total: number };                // plain counts in the last 30 days (the measurement shown)
  label: "no data" | "early estimate" | "developing estimate" | "well measured";
  trend: "up" | "down" | "flat" | "unknown";
}

export function estimate(events: LearningEvent[], skill: Skill, now: number, course?: string): SkillEstimate {
  const es = events.filter((e) => e.skill === skill && (!course || e.course === course));
  let a = 1, b = 1, n = 0;
  for (const e of es) { const w = Math.pow(0.5, (now - e.at) / 86_400_000 / HALF_LIFE_DAYS); n += w; if (e.correct) a += w; else b += w; }
  const mastery = a / (a + b), sd = Math.sqrt((a * b) / ((a + b) ** 2 * (a + b + 1)));
  const last30 = es.filter((e) => now - e.at < 30 * 86_400_000);
  const half = (from: number, to: number) => { const s = es.filter((e) => now - e.at >= from && now - e.at < to); return s.length >= 4 ? s.filter((e) => e.correct).length / s.length : null; };
  const recentRate = half(0, 7 * 86_400_000), olderRate = half(7 * 86_400_000, 60 * 86_400_000);
  const trend = recentRate === null || olderRate === null ? "unknown" : recentRate - olderRate > 0.1 ? "up" : olderRate - recentRate > 0.1 ? "down" : "flat";
  return {
    skill, mastery, low: Math.max(0, mastery - 1.28 * sd), high: Math.min(1, mastery + 1.28 * sd), evidence: n,
    recent: { correct: last30.filter((e) => e.correct).length, total: last30.length },
    label: es.length === 0 ? "no data" : n < 6 ? "early estimate" : n < 20 ? "developing estimate" : "well measured", trend,
  };
}

/** Items (words/sentences) answered wrong at least twice recently and not since fixed (2 right in a row). */
export function repeatedMistakes(events: LearningEvent[], now: number, course?: string): { item: string; skill: Skill; misses: number }[] {
  const by = new Map<string, LearningEvent[]>();
  for (const e of events) if (e.item && now - e.at < 45 * 86_400_000 && (!course || e.course === course)) by.set(e.item, [...(by.get(e.item) ?? []), e]);
  const out: { item: string; skill: Skill; misses: number }[] = [];
  for (const [item, es] of by) {
    es.sort((x, y) => x.at - y.at);
    const misses = es.filter((e) => !e.correct).length; const tail = es.slice(-2);
    if (misses >= 2 && !(tail.length === 2 && tail.every((e) => e.correct))) out.push({ item, skill: es[es.length - 1].skill, misses });
  }
  return out.sort((x, y) => y.misses - x.misses);
}

export type Band = "strength" | "steady" | "needs work" | "unknown";
export function band(e: SkillEstimate): Band {
  if (e.label === "no data" || e.evidence < 4) return "unknown";
  if (e.low >= 0.7) return "strength";
  if (e.high < 0.6 || e.mastery < 0.55) return "needs work";
  return "steady";
}

/* ---------------- recommend ---------------- */

export interface Context {
  course: string; nextLessonId?: string; nextLessonTitle?: string; dueReviews: number; storyIds: { id: string; title: string; open: boolean; done: boolean; tags: Interest[] }[];
  hasIslProgress: boolean; recentLessonAccuracy: number[];   // best accuracy of the last completed lessons, newest last
}
export interface Recommendation { id: string; title: string; href: string; reason: string; reasonParams?: Record<string, string | number>; kind: "revise" | "practise" | "learn" | "challenge" | "converse" | "connect" | "assess"; priority: number }

const PRACTICE_FOR: Partial<Record<Skill, { mode: string; title: string }>> = {
  vocabulary: { mode: "match", title: /*i18n*/ "Practise vocabulary with quick matching" },
  grammar: { mode: "write", title: /*i18n*/ "Build sentences: targeted grammar practice" },
  writing: { mode: "write", title: /*i18n*/ "Writing practice: type full sentences" },
  listening: { mode: "listen", title: /*i18n*/ "Listening and dictation practice" },
  speaking: { mode: "speak", title: /*i18n*/ "Speaking practice with feedback" },
  reading: { mode: "review", title: /*i18n*/ "Reading review of sentences you’ve learned" },
};
const TUTOR_FOR: Record<Interest, string> = { travel: "travel", study: "university", work: "interview", food: "restaurant", social: "meet", everyday: "everyday" };

/**
 * The rule-based engine. Every recommendation carries a reason built only from measured data or explicit preferences.
 * Rules (highest priority first, each fires only when its evidence exists):
 *  1 repeated mistakes → fix them    2 weakest measured skill → targeted practice    3 due reviews → review
 *  4 next lesson (or a harder test-out when the last lessons were near perfect)    5 interest-matched story/roleplay
 *  6 speaking confidence/skill → gentle or stretching conversation    7 similar-level partner    0 no data → diagnostic
 */
export function recommend(events: LearningEvent[], prefs: TwinPrefs, ctx: Context, now: number): Recommendation[] {
  const recs: Recommendation[] = [];
  const est = Object.fromEntries(SKILLS.map((s) => [s, estimate(events, s, now, s === "isl" ? undefined : ctx.course)])) as Record<Skill, SkillEstimate>;
  const measured = SKILLS.filter((s) => s !== "isl" && band(est[s]) !== "unknown");
  const style = prefs.style ?? "practice";

  if (!events.some((e) => e.course === ctx.course && e.skill !== "isl"))
    recs.push({ id: "diagnostic", kind: "assess", priority: 95, title: /*i18n*/ "Take the 3-minute starting check", href: "/lesson?placement=1",
      reason: /*i18n*/ "Recommended because Speakara has no measured answers from you in this course yet. It’s optional and helps pick your starting point." });

  const mistakes = repeatedMistakes(events, now, ctx.course);
  if (mistakes.length >= 2)
    recs.push({ id: "fix-mistakes", kind: "revise", priority: 90, title: /*i18n*/ "Fix your repeated mistakes", href: "/lesson?mode=mistakes",
      reason: /*i18n*/ "Recommended because you answered {n} items wrong at least twice in recent exercises.", reasonParams: { n: mistakes.length } });

  const weak = measured.filter((s) => band(est[s]) === "needs work").sort((x, y) => est[x].mastery - est[y].mastery);
  for (const [i, s] of weak.slice(0, 2).entries()) {
    const p = PRACTICE_FOR[s]; if (!p) continue;
    recs.push({ id: `weak-${s}`, kind: "practise", priority: 85 - i * 5 + (prefs.hardAreas.includes(s) ? 3 : 0), title: p.title, href: `/lesson?mode=${p.mode}`,
      reason: /*i18n*/ "Recommended because you got {c} of {t} {skill} answers right in the last 30 days, your lowest measured area.", reasonParams: { c: est[s].recent.correct, t: est[s].recent.total, skill: SKILL_LABEL[s] } });
  }
  if (weak.includes("grammar") && (style === "explain" || style === "visual"))
    recs.push({ id: "guidebook", kind: "practise", priority: 78, title: /*i18n*/ "Read the grammar tips for your current unit", href: "/guidebook",
      reason: /*i18n*/ "Recommended because grammar is your lowest measured area and you prefer explanations before practice." });

  if (ctx.dueReviews >= 5)
    recs.push({ id: "review", kind: "revise", priority: 70 + Math.min(10, ctx.dueReviews / 2), title: /*i18n*/ "Review words before you forget them", href: "/lesson?mode=review",
      reason: /*i18n*/ "Recommended because {n} words you learned are due for spaced review.", reasonParams: { n: ctx.dueReviews } });

  const last = ctx.recentLessonAccuracy.slice(-3);
  const cruising = last.length === 3 && last.every((a) => a >= 0.9) && measured.length > 0 && weak.length === 0;
  if (ctx.nextLessonId)
    recs.push({ id: "next-lesson", kind: cruising || prefs.difficulty === "challenge" ? "challenge" : "learn", priority: weak.length ? 60 : 75,
      title: ctx.nextLessonTitle ?? /*i18n*/ "Continue your course", href: `/lesson?lesson=${ctx.nextLessonId}`,
      reason: cruising ? /*i18n*/ "Recommended because your last three lessons were 90% or better, so you’re ready for new material." : weak.length ? /*i18n*/ "Your next lesson in the course, after some targeted practice." : /*i18n*/ "Your next lesson in the course." });

  const interestStory = ctx.storyIds.find((s) => s.open && !s.done && s.tags.some((t) => prefs.interests.includes(t))) ?? (band(est.reading) === "needs work" ? ctx.storyIds.find((s) => s.open && !s.done) : undefined);
  if (interestStory)
    recs.push({ id: `story-${interestStory.id}`, kind: "practise", priority: band(est.reading) === "needs work" ? 72 : 55, title: interestStory.title, href: `/story?id=${interestStory.id}`,
      reason: interestStory.tags.some((t) => prefs.interests.includes(t)) ? /*i18n*/ "Recommended because it matches an interest you chose: {i}." : /*i18n*/ "Recommended because reading is one of your lower measured areas.",
      reasonParams: { i: interestStory.tags.find((t) => prefs.interests.includes(t)) ?? "" } });

  const conf = prefs.confidence.speaking;
  const scenario = TUTOR_FOR[prefs.interests[0] ?? (prefs.goal === "study" ? "study" : prefs.goal === "travel" ? "travel" : prefs.goal === "work" ? "work" : "everyday")];
  if (conf !== undefined && conf <= 2)
    recs.push({ id: "gentle-talk", kind: "converse", priority: 58, title: /*i18n*/ "A short, simple text roleplay", href: `/tutor?scenario=${scenario}`,
      reason: /*i18n*/ "Recommended because you said speaking feels hard right now. Text roleplay lets you build up gradually." });
  else if (band(est.speaking) === "strength" || (conf !== undefined && conf >= 4))
    recs.push({ id: "speak-challenge", kind: "challenge", priority: 52, title: /*i18n*/ "Live conversation with the AI companion", href: "/live/companion",
      reason: band(est.speaking) === "strength" ? /*i18n*/ "Recommended because your measured speaking answers are strong." : /*i18n*/ "Recommended because you said you feel confident speaking." });
  else if (prefs.interests.length || prefs.goal)
    recs.push({ id: "roleplay", kind: "converse", priority: 50, title: /*i18n*/ "Roleplay a real situation", href: `/tutor?scenario=${scenario}`,
      reason: /*i18n*/ "Recommended because it matches your goal or interests." });

  const vocabOk = band(est.vocabulary) === "strength" || band(est.vocabulary) === "steady";
  if (vocabOk && (style === "conversation" || prefs.goal === "travel" || prefs.goal === "family"))
    recs.push({ id: "partner", kind: "connect", priority: 45, title: /*i18n*/ "Practise with a learner at a similar level", href: "/live/community",
      reason: /*i18n*/ "Recommended because your vocabulary is measured as steady or better and you prefer conversation practice." });

  if (ctx.hasIslProgress && band(est.isl) === "needs work")
    recs.push({ id: "isl", kind: "revise", priority: 64, title: /*i18n*/ "Revise your ISL lesson", href: "/learn/isl",
      reason: /*i18n*/ "Recommended because fewer than half of your recent ISL lesson answers were right." });

  // teaching-style nudges reorder, never invent reasons
  for (const r of recs) {
    if (style === "visual" && r.href.includes("mode=match")) r.priority += 4;
    if (style === "conversation" && (r.kind === "converse" || r.kind === "connect")) r.priority += 6;
    if (style === "practice" && r.kind === "practise") r.priority += 3;
    if (prefs.difficulty === "easier" && r.kind === "challenge") r.priority -= 10;
    if (prefs.difficulty === "challenge" && r.kind === "challenge") r.priority += 8;
  }
  return recs.sort((x, y) => y.priority - x.priority);
}

/* ---------------- adaptation outputs used by other features ---------------- */

/** Difficulty knob for exercises/companion, from measurements first, then the learner's own preference. */
export function difficultyFor(events: LearningEvent[], prefs: TwinPrefs, course: string, now: number): 1 | 2 | 3 {
  const core = (["vocabulary", "grammar", "reading"] as Skill[]).map((s) => estimate(events, s, now, course)).filter((e) => e.evidence >= 4);
  let d: 1 | 2 | 3 = prefs.selfLevel === "intermediate" ? 2 : 1;
  if (core.length) { const m = core.reduce((x, e) => x + e.mastery, 0) / core.length; d = m >= 0.8 ? 3 : m >= 0.6 ? 2 : 1; }
  if (prefs.difficulty === "easier" && d > 1) d = (d - 1) as 1 | 2;
  if (prefs.difficulty === "challenge" && d < 3) d = (d + 1) as 2 | 3;
  return d;
}

/**
 * Short teaching brief for the AI companion — only measured facts and explicit preferences, no raw answers,
 * nothing sensitive. Shared only when `companionContext` is on.
 */
export function companionBrief(events: LearningEvent[], prefs: TwinPrefs, course: string, now: number, labelOf: (item: string) => string | undefined = () => undefined): string[] {
  const lines: string[] = [];
  const bands = SKILLS.filter((s) => s !== "isl").map((s) => [s, band(estimate(events, s, now, course))] as const);
  const weak = bands.filter(([, b]) => b === "needs work").map(([s]) => SKILL_LABEL[s].toLowerCase());
  const strong = bands.filter(([, b]) => b === "strength").map(([s]) => SKILL_LABEL[s].toLowerCase());
  const d = difficultyFor(events, prefs, course, now);
  lines.push(`Pitch the conversation at difficulty ${d} of 3 (${["very simple words and short sentences", "everyday words, short sentences", "richer vocabulary and longer sentences"][d - 1]}).`);
  if (weak.length) lines.push(`Measured weaker areas: ${weak.join(", ")}. Give extra support there.`);
  if (strong.length) lines.push(`Measured strengths: ${strong.join(", ")}. You can stretch these a little.`);
  const errs = repeatedMistakes(events, now, course).slice(0, 5).map((m) => labelOf(m.item)).filter(Boolean);
  if (errs.length) lines.push(`Items they repeatedly got wrong (give natural chances to use them correctly): ${errs.join("; ")}.`);
  if (prefs.interests.length) lines.push(`Topics they enjoy: ${prefs.interests.join(", ")}.`);
  if (prefs.goal) lines.push(`Their learning goal: ${prefs.goal}.`);
  if (prefs.correction) lines.push({ gentle: "Correct gently and only the most important mistakes.", balanced: "Correct clear mistakes briefly.", detailed: "Correct mistakes in detail with a short explanation." }[prefs.correction]);
  if (prefs.style === "explain") lines.push("They like short explanations before practising.");
  if (prefs.confidence.speaking !== undefined && prefs.confidence.speaking <= 2) lines.push("They say speaking feels hard: speak slowly, keep turns very short and praise effort.");
  return lines;
}
