"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/state/store";
import { allLessons, allSentences, allWords, findLesson, getCourse, lessonKey, wordKey } from "@/lib/content";
import { generateLesson, generatePractice, generateUnitTest, mulberry32, type Exercise, type PracticeMode } from "@/lib/engine/exercises";
import { isDue } from "@/lib/engine/srs";
import type { SessionSummary } from "@/lib/state/actions";
import type { SessionKind } from "@/lib/engine/gamification";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { SessionSummaryView } from "@/components/lesson/SessionSummary";
import { Mascot } from "@/components/Mascot";
import { LinkButton, Loading } from "@/components/ui";

function Session() {
  const q = useSearchParams(); const { state, ready, finishSession } = useStore();
  const [seed] = useState(() => Date.now()); const [summary, setSummary] = useState<SessionSummary | null>(null);
  const lessonId = q.get("lesson"), mode = q.get("mode") as PracticeMode | null, testout = q.get("testout");
  const course = getCourse(state.profile.courseId);

  const plan = useMemo((): { exercises: Exercise[]; kind: SessionKind; title: string; base: { lessonId?: string; unlockUnit?: number }; empty?: string } | null => {
    if (!ready) return null;
    const o = { rng: mulberry32(seed), speech: state.profile.speech };
    const now = seed;
    if (lessonId) {
      const hit = findLesson(course, lessonId);
      if (!hit) return { exercises: [], kind: "lesson", title: "", base: {}, empty: "That lesson doesn’t exist in this course." };
      const due = allWords(course).filter((w) => { const it = state.review[wordKey(course.id, w.id)]; return it && isDue(it, now) && !hit.lesson.words.some((x) => x.id === w.id); });
      return { exercises: generateLesson(course, hit.lesson, { ...o, reviewWords: due }), kind: "lesson", title: `${hit.unit.title}: ${hit.lesson.title}`, base: { lessonId } };
    }
    if (testout !== null) {
      const target = Number(testout);
      return { exercises: generateUnitTest(course, Array.from({ length: target }, (_, i) => i), o.rng), kind: "testout", title: `You jumped ahead to ${course.units[target]?.title ?? "the next unit"}!`, base: { unlockUnit: target } };
    }
    const done = allLessons(course).filter((x) => state.completed[lessonKey(course.id, x.lesson.id)]).map((x) => x.lesson);
    let words = done.flatMap((l) => l.words), sentences = done.flatMap((l) => l.sentences);
    if (mode === "review") { const dueW = words.filter((w) => { const it = state.review[wordKey(course.id, w.id)]; return it && isDue(it, now); }); if (dueW.length >= 3) words = dueW; }
    if (mode === "mistakes") { const ids = new Set(state.mistakes.filter((m) => m.courseId === course.id).map((m) => m.sentenceId)); sentences = allSentences(course).filter((s) => ids.has(s.id)); }
    if (!sentences.length || !words.length) return { exercises: [], kind: "practice", title: "", base: {}, empty: mode === "mistakes" ? "No mistakes waiting — you’ve cleared them all!" : "Finish your first lesson and practice will be ready for you." };
    return { exercises: generatePractice(course, mode ?? "review", { words, sentences }, o), kind: "practice", title: "Practice makes it stick.", base: {} };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, lessonId, mode, testout, seed, course.id]);

  if (!plan) return <Loading />;
  if (plan.empty) return <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center"><Mascot mood="think" size={140} /><p className="text-lg">{plan.empty}</p><LinkButton href="/learn">Back to learning</LinkButton></div>;
  if (summary) return <SessionSummaryView s={summary} title={plan.title} nextHref={plan.kind === "practice" ? "/practice" : "/learn"} gated={plan.kind === "testout"} />;
  return <LessonPlayer course={course} exercises={plan.exercises} kind={plan.kind} sound={state.profile.sound} exitHref={plan.kind === "practice" ? "/practice" : "/learn"} base={plan.base} onFinish={(r) => setSummary(finishSession(r))} />;
}
export default function LessonPage() { return <Suspense fallback={<Loading />}><Session /></Suspense>; }
