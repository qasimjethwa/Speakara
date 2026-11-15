"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Volume2 } from "lucide-react";
import { useStore } from "@/lib/state/store";
import { allLessons, allSentences, allWords, findLesson, getCourse, lessonKey, wordKey } from "@/lib/content";
import { PRACTICE_MODES, type PracticeMode } from "@/lib/engine/exercises";
import { buildSession, type SessionPlan } from "@/lib/engine/plan";
import type { Attempt } from "@/lib/engine/grade";
import { isDue } from "@/lib/engine/srs";
import type { SessionSummary } from "@/lib/state/actions";
import { say } from "@/lib/audio";
import { useT } from "@/lib/i18n";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { SessionSummaryView } from "@/components/lesson/SessionSummary";
import { Mascot } from "@/components/Mascot";
import { Button, LinkButton, Loading, Notice } from "@/components/ui";

function Session() {
  const q = useSearchParams(); const { state, ready, finishSession } = useStore(); const { t } = useT();
  const [seed] = useState(() => Date.now() % 2_000_000_000); const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [started, setStarted] = useState(false); const [pending, setPending] = useState<{ attempts: Attempt[]; seconds: number; plan: SessionPlan; title: string; gated: boolean } | null>(null);
  const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null); const [ai, setAi] = useState(false);
  const lessonId = q.get("lesson"), modeParam = q.get("mode"), testout = q.get("testout");
  const mode = PRACTICE_MODES.includes(modeParam as PracticeMode) ? (modeParam as PracticeMode) : "review";
  const course = getCourse(state.profile.courseId);
  useEffect(() => { fetch("/api/tutor").then((r) => r.json()).then((d: { provider: string }) => setAi(d.provider !== "scripted"), () => {}); }, []);

  const plan = useMemo((): { plan?: SessionPlan; title: string; empty?: string } | null => {
    if (!ready) return null;
    const speech = state.profile.speech, now = Date.now();
    if (lessonId) {
      const hit = findLesson(course, lessonId);
      if (!hit) return { title: "", empty: "That lesson doesn’t exist in this course." };
      const due = allWords(course).filter((w) => { const it = state.review[wordKey(course.id, w.id)]; return it && isDue(it, now) && !hit.lesson.words.some((x) => x.id === w.id); });
      return { plan: { type: "lesson", courseId: course.id, lessonId, seed, speech, reviewWordIds: due.slice(0, 2).map((w) => w.id) }, title: `${hit.unit.title}: ${hit.lesson.title}` };
    }
    if (testout !== null) return { plan: { type: "testout", courseId: course.id, unit: Number(testout), seed }, title: "You jumped ahead!" };
    const done = allLessons(course).filter((x) => state.completed[lessonKey(course.id, x.lesson.id)]).map((x) => x.lesson);
    let words = done.flatMap((l) => l.words), sentences = done.flatMap((l) => l.sentences);
    if (mode === "review") { const dueW = words.filter((w) => { const it = state.review[wordKey(course.id, w.id)]; return it && isDue(it, now); }); if (dueW.length >= 3) words = dueW; }
    if (mode === "mistakes") { const ids = new Set(state.mistakes.filter((m) => m.courseId === course.id).map((m) => m.sentenceId)); sentences = allSentences(course).filter((s) => ids.has(s.id)); }
    if (!sentences.length || !words.length) return { title: "", empty: mode === "mistakes" ? "No mistakes waiting — you’ve cleared them all!" : "Finish your first lesson and practice will be ready for you." };
    return { plan: { type: "practice", courseId: course.id, mode, seed, speech, wordIds: words.map((w) => w.id), sentenceIds: sentences.map((s) => s.id) }, title: "Practice makes it stick." };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, lessonId, mode, testout, seed, course.id]);
  const built = useMemo(() => (plan?.plan ? buildSession(course, plan.plan) : null), [plan, course]);

  // The session being saved is kept with its own plan: if the account session expires while saving, the learner is
  // signed out and the course on screen changes, but the finished answers must still be shown and retried as they were.
  const submit = async (attempts: Attempt[], seconds: number, p = plan?.plan, title = plan?.title ?? "", gated = built?.kind === "testout") => {
    if (!p) return;
    setPending({ attempts, seconds, plan: p, title, gated }); setSaving(true); setError(null);
    try { setSummary(await finishSession(p, attempts, seconds)); } catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  };

  if (!plan) return <Loading text={t("Loading…")} />;
  const back = (pending?.plan ?? plan.plan)?.type === "practice" ? "/practice" : "/learn";
  if (summary && pending) return <SessionSummaryView s={summary} title={pending.plan.type === "lesson" ? pending.title : t(pending.title)} nextHref={back} gated={pending.gated} />;
  if (pending) return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <Mascot mood={error ? "oops" : "think"} size={140} className={saving ? "anim-bob" : ""} />
      {saving ? <Loading text={t("Saving your progress…")} /> : <><h1 className="text-xl" data-save-error>{t("We couldn’t save that session")}</h1><Notice tone="error">{t(error ?? "")}</Notice>
        <Button data-retry onClick={() => submit(pending.attempts, pending.seconds, pending.plan, pending.title, pending.gated)} className="w-full">{t("Try again")}</Button><LinkButton href={back} variant="ghost">{t("Leave without saving")}</LinkButton></>}
    </main>
  );
  if (plan.empty || !built) return <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center"><Mascot mood="think" size={140} /><h1 className="text-lg">{t(plan.empty ?? "That session does not exist.")}</h1><LinkButton href="/learn">{t("Back to learning")}</LinkButton></main>;
  const lesson = lessonId ? findLesson(course, lessonId) : null;
  if (lesson && !started) return (
    <main className="mx-auto flex min-h-dvh max-w-[560px] flex-col px-5 py-8">
      <div className="flex items-end gap-3"><Mascot mood="wave" size={100} /><p className="mb-5 rounded-2xl border-2 border-line-dark px-4 py-3 text-lg">{t("Here’s what you’ll learn in this lesson.")}</p></div>
      <p className="mt-4 text-sm font-extrabold uppercase text-sub">{lesson.unit.title}</p>
      <h1 className="text-2xl">{lesson.lesson.title}</h1>
      <p className="mt-1 text-sub">{t("{n} exercises · about {m} minutes", { n: built.exercises.length, m: 4 })}</p>
      <h2 className="mb-2 mt-6 text-lg">{t("New words")}</h2>
      <ul className="divide-y-2 divide-line rounded-2xl border-2 border-line">{lesson.lesson.words.map((w) => (
        <li key={w.id} className="flex items-center gap-3 p-3"><button aria-label={t("Hear {word}", { word: w.t })} onClick={() => void say(w.t, course.ttsLang, state.profile.slowAudio ? 0.75 : 1)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-soft text-sky-dark"><Volume2 size={20} /></button><span className="flex-1 text-lg font-extrabold" lang={course.ttsLang}>{w.t}</span><span className="text-sub">{w.n}</span></li>
      ))}</ul>
      <div className="mt-8 space-y-3"><Button autoFocus data-start className="w-full" onClick={() => setStarted(true)}>{t("Start lesson")}</Button><LinkButton href={`/guidebook?unit=${lesson.unit.id}`} variant="secondary" className="w-full">{t("Read the guidebook first")}</LinkButton><LinkButton href="/learn" variant="ghost" className="w-full">{t("Back to the path")}</LinkButton></div>
    </main>
  );
  return <LessonPlayer course={course} exercises={built.exercises} sound={state.profile.sound} slow={state.profile.slowAudio} exitHref={back} aiExplain={ai} timeLimit={plan.plan?.type === "practice" && plan.plan.mode === "match" ? 90 : undefined} onFinish={submit} />;
}
export default function LessonPage() { return <Suspense fallback={<Loading />}><Session /></Suspense>; }
