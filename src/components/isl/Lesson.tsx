"use client";
/**
 * Interactive lesson: the teacher greets, teaches, asks, reacts and adapts, driven by the lesson engine.
 * Signs are only shown from reviewed clips; any word without one is taught with a written word card and a link to the
 * official dictionary entry instead.
 */
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ArrowRight, BookOpenText, Camera, ChevronsDown, ChevronsUp, ExternalLink, Lightbulb, MessageCircleQuestion, Repeat2, Send, Snail, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";
import { checkWritten, ISLRTC_DICTIONARY, type IslCourse, type IslUnit } from "@/lib/isl/courses";
import { recordEvents } from "@/lib/twin/store";
import { itemId, useIslProgress, useValidatedClips } from "@/lib/isl/data";
import { lessonScore, newModel, reduce, startLesson, type Action, type LearnerModel, type LessonState } from "@/lib/isl/engine";
import type { Mood } from "@/lib/isl/expression";
import { Loading } from "@/components/ui";

const SignTeacher = dynamic(() => import("@/components/isl/SignTeacher").then((m) => m.SignTeacher), { ssr: false, loading: () => <div className="aspect-[4/5] max-h-[78dvh] animate-pulse rounded-[28px] bg-[#ece6da]"><Loading text="Loading your teacher…" /></div> });

const MODEL_KEY = (c: string) => `speakara:isl:learner:${c}`;
function loadModel(course: string): LearnerModel {
  try { const m = JSON.parse(localStorage.getItem(MODEL_KEY(course)) ?? "null"); if (m && typeof m === "object") return { ...newModel(), difficulty: m.difficulty ?? 1, speed: m.speed ?? 1, mistakes: m.mistakes ?? {} }; } catch { /* ignore */ }
  return newModel();
}

export function Lesson({ course, unit }: { course: IslCourse; unit: IslUnit }) {
  const { t } = useT(); const { clips } = useValidatedClips(); const { complete } = useIslProgress();
  const lang = course.id === "spanish" ? "es" : "en";
  const [s, dispatch] = useReducer((st: LessonState, a: Action | { type: "reset"; model: LearnerModel }) => a.type === "reset" ? startLesson(course, unit, a.model) : reduce(st, unit, a), null, () => startLesson(course, unit));
  const [replay, setReplay] = useState(0);
  const [typed, setTyped] = useState("");
  const [ask, setAsk] = useState(""); const [reply, setReply] = useState<{ q: string; a: string } | null>(null); const [asking, setAsking] = useState(false);
  const recorded = useRef(false);
  useEffect(() => { dispatch({ type: "reset", model: loadModel(course.id) }); }, [course.id, unit.id]);
  useEffect(() => { try { localStorage.setItem(MODEL_KEY(course.id), JSON.stringify({ difficulty: s.model.difficulty, speed: s.model.speed, mistakes: s.model.mistakes })); } catch { /* ignore */ } }, [s.model, course.id]);
  useEffect(() => { if (s.step.kind === "recap" && !recorded.current) { recorded.current = true; complete(itemId(course.id, unit.id, "lesson"), lessonScore(s.model)); } }, [s.step.kind, s.model, complete, course.id, unit.id]);

  const w = unit.vocab.find((x) => x.id === (s.step.wordId ?? s.queue[s.current]));
  const clip = w && ["teach", "example", "meaning", "practice"].includes(s.step.kind) ? clips[w.sign] ?? null : null;
  const mood: Mood = asking ? "thinking" : reply ? "explaining" : s.step.mood;
  const lines = useMemo(() => s.step.lines.map((l, i) => ({ text: t(l.key, l.params), lang: l.target ? lang : undefined, strong: i === 0 })), [s.step.lines, t, lang]);
  const act = (a: Action) => {
    setReply(null); setTyped("");
    if (a.type === "answer" && s.step.kind === "check" && s.step.question && w) {   // Learning Twin: graded ISL answer
      const ok = s.step.question.kind === "type" ? checkWritten(a.value, [w.text]) : a.value === s.step.question.wordId;
      recordEvents([{ at: Date.now(), course: `isl-${lang}`, skill: "isl", correct: ok, item: w.id, topic: unit.title, source: "isl" }]);
    }
    dispatch(a); if (a.type === "repeat") setReplay((r) => r + 1);
  };
  const progress = Math.min(1, s.current / s.queue.length);
  const q = s.step.question;

  const askTeacher = async () => {
    const question = ask.trim(); if (!question) return; setAsking(true); setReply(null);
    let answer = "";
    try {
      const r = await fetch("/api/isl/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ course: course.id, unit: unit.id, word: w?.id, question }) });
      const j = await r.json(); if (r.ok && typeof j.answer === "string") answer = j.answer;
    } catch { /* offline: fall through */ }
    if (!answer && w) answer = t("“{w}” means “{m}”. Example: {e} ({em})", { w: w.text, m: w.meaning, e: w.example, em: w.exampleMeaning });
    setReply({ q: question, a: answer || t("I couldn’t answer that right now. Try “Explain again” or “Show another example”.") }); setAsk(""); setAsking(false);
  };

  const pill = "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-paper px-4 text-sm font-bold text-ink hover:bg-mist disabled:opacity-40";
  const canHelp = !!w && !["greet", "intro", "recap", "done"].includes(s.step.kind);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div>
        <SignTeacher clip={clip} mood={mood} speed={s.model.speed} replayKey={replay} targetLang={lang} fallback={{ start: 0, end: 1, text: w?.text ?? "" }}
          captionLines={reply ? [{ text: reply.a, strong: true }] : lines} />
      </div>

      <section className="space-y-4" aria-label={t("Lesson")}>
        <div className="flex items-center gap-3 text-sm font-bold text-sub">
          <span>{t("Word {n} of {t}", { n: Math.min(s.current + 1, s.queue.length), t: s.queue.length })}</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label={t("Lesson progress")}><span className="block h-full rounded-full bg-brand" style={{ width: `${progress * 100}%` }} /></span>
          <span className="rounded-full bg-mist px-2 py-0.5 text-xs">{t("Level {d}", { d: s.model.difficulty })}</span>
        </div>

        {w && ["teach", "example", "meaning", "practice", "feedback"].includes(s.step.kind) && (
          <div className="rounded-3xl border border-line bg-paper p-6">
            <p className="text-xs font-extrabold uppercase tracking-wider text-sub">{t("Word")}</p>
            <p className="mt-1 text-5xl font-black leading-tight tracking-tight text-ink" lang={lang}>{w.text}</p>
            <p className="mt-2 text-lg text-ink">{w.meaning}</p>
            <p className="text-sub" lang="hi">{w.hi}</p>
            <div className="mt-4 border-t border-line pt-4"><p className="font-bold" lang={lang}>{w.example}</p><p className="text-sm text-sub">{w.exampleMeaning}</p></div>
            {!clips[w.sign] && <a href={ISLRTC_DICTIONARY} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-brand-dark underline underline-offset-4">{t("See the official sign in the ISLRTC dictionary")}<ExternalLink size={14} aria-hidden="true" /></a>}
          </div>
        )}

        {s.step.kind === "check" && q && w && (
          <div className="rounded-3xl border border-line bg-paper p-6">
            <p className="mb-4 text-lg font-extrabold">{t(s.step.lines[0].key, s.step.lines[0].params)}</p>
            {q.kind === "meaning" && <p className="mb-4 text-4xl font-black tracking-tight" lang={lang}>{w.text}</p>}
            {q.kind === "type" ? (
              <form onSubmit={(e) => { e.preventDefault(); if (typed.trim()) act({ type: "answer", value: typed }); }} className="flex gap-2">
                <input value={typed} onChange={(e) => setTyped(e.target.value)} lang={lang} autoComplete="off" aria-label={t("Your answer")} className="min-h-12 flex-1 rounded-2xl border border-line-dark bg-paper px-4 text-lg" />
                <button type="submit" className="min-h-12 rounded-2xl bg-ink px-5 font-extrabold text-white">{t("Check")}</button>
              </form>
            ) : (
              <div className="grid gap-2">{q.options.map((id) => { const o = unit.vocab.find((x) => x.id === id)!; return (
                <button key={id} type="button" onClick={() => act({ type: "answer", value: id })} className="min-h-14 rounded-2xl border border-line bg-paper px-4 text-left text-lg font-bold hover:border-ink" lang={q.kind === "word" ? lang : undefined}>
                  {q.kind === "meaning" ? o.meaning : o.text}</button>); })}</div>
            )}
          </div>
        )}

        {s.step.kind === "feedback" && (
          <p className={`rounded-2xl p-4 font-bold ${s.model.answers.at(-1)?.ok ? "bg-brand-soft text-brand-dark" : "bg-sun-soft text-sun-dark"}`} role="status">{t(s.step.lines[0].key)}</p>
        )}
        {s.step.kind === "practice" && (
          <Link href="/learn/isl/practice" className="flex min-h-12 items-center gap-2 rounded-2xl border border-line bg-paper px-4 font-bold hover:bg-mist"><Camera size={18} aria-hidden="true" />{t("Open camera practice")}</Link>
        )}
        {s.step.kind === "done" && (
          <div className="rounded-3xl border border-line bg-paper p-6 text-center">
            <Sparkles className="mx-auto text-brand" aria-hidden="true" />
            <p className="mt-2 text-2xl font-extrabold">{t("Lesson complete")}</p>
            <p className="text-sub">{t("Score: {s}%", { s: lessonScore(s.model) })}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button type="button" className={pill} onClick={() => { recorded.current = false; dispatch({ type: "reset", model: loadModel(course.id) }); }}><Repeat2 size={16} aria-hidden="true" />{t("Start again")}</button>
              <Link href={`/learn/isl/${course.id}/scenarios`} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-bold text-white">{t("Try a real-world scenario")}<ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          </div>
        )}

        {s.step.kind !== "check" && s.step.kind !== "done" && (
          <button type="button" onClick={() => act({ type: "continue" })} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-lg font-extrabold text-white hover:bg-black">
            {s.step.kind === "teach" || s.step.kind === "example" || s.step.kind === "meaning" || s.step.kind === "practice" ? t("I’m ready for a question") : t("Continue")}<ArrowRight size={20} aria-hidden="true" /></button>
        )}

        {canHelp && (
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("Ask the teacher")}>
            <button type="button" className={pill} onClick={() => act({ type: "explain" })}><Lightbulb size={16} aria-hidden="true" />{t("Explain again")}</button>
            <button type="button" className={pill} onClick={() => act({ type: "example" })}><BookOpenText size={16} aria-hidden="true" />{t("Another example")}</button>
            <button type="button" className={pill} onClick={() => act({ type: "meaning" })}>{t("Show the meaning")}</button>
            {clip && <button type="button" className={pill} onClick={() => act({ type: "repeat" })}><Repeat2 size={16} aria-hidden="true" />{t("Repeat the sign")}</button>}
            <button type="button" className={pill} onClick={() => act({ type: "slower" })} aria-pressed={s.model.speed < 1}><Snail size={16} aria-hidden="true" />{s.model.speed < 1 ? t("Speed {s}×", { s: s.model.speed }) : t("Slow down")}</button>
            <button type="button" className={pill} disabled={s.model.difficulty === 1} onClick={() => act({ type: "easier" })}><ChevronsDown size={16} aria-hidden="true" />{t("Make it easier")}</button>
            <button type="button" className={pill} disabled={s.model.difficulty === 3} onClick={() => act({ type: "harder" })}><ChevronsUp size={16} aria-hidden="true" />{t("Harder question")}</button>
            <button type="button" className={pill} onClick={() => act({ type: "practice" })}><Camera size={16} aria-hidden="true" />{t("Practise this word")}</button>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); void askTeacher(); }} className="flex gap-2">
          <label className="sr-only" htmlFor="isl-ask">{t("Ask a question")}</label>
          <div className="relative flex-1"><MessageCircleQuestion size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sub" aria-hidden="true" />
            <input id="isl-ask" value={ask} onChange={(e) => setAsk(e.target.value)} maxLength={300} placeholder={t("Ask a question about this word…")} className="min-h-12 w-full rounded-2xl border border-line bg-paper pl-10 pr-3" /></div>
          <button type="submit" disabled={asking || !ask.trim()} className="min-h-12 min-w-12 rounded-2xl bg-ink px-4 text-white disabled:opacity-40" aria-label={t("Send question")}><Send size={18} aria-hidden="true" /></button>
        </form>
        {reply && <p className="text-sm text-sub">{t("You asked: {q}", { q: reply.q })}</p>}
      </section>
    </div>
  );
}
