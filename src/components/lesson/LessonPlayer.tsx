"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import type { Course } from "@/lib/content/types";
import { allWords } from "@/lib/content";
import { evaluate, type Answer, type Exercise } from "@/lib/engine/exercises";
import type { Verdict } from "@/lib/engine/text";
import type { SessionResult } from "@/lib/state/actions";
import type { SessionKind } from "@/lib/engine/gamification";
import { sfx } from "@/lib/audio";
import { Button, ProgressBar } from "../ui";
import { ExerciseView } from "./ExerciseViews";

interface Props { course: Course; exercises: Exercise[]; kind: SessionKind; sound: boolean; exitHref: string; base: Pick<SessionResult, "lessonId" | "unlockUnit">; onFinish: (r: SessionResult) => void }
const PRAISE = ["Nice!", "Great job!", "Exactly!", "You got it!", "Well done!"];

/** Runs one session. Missed items come back at the end until answered — mistakes cost nothing but a second look. */
export function LessonPlayer({ course, exercises, kind, sound, exitHref, base, onFinish }: Props) {
  const [queue, setQueue] = useState(exercises);
  const [i, setI] = useState(0);
  const [draft, setDraft] = useState<Answer | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [why, setWhy] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const first = useRef(new Map<string, boolean>()); const skipped = useRef(new Set<string>()); const solved = useRef(new Set<string>());
  const started = useRef(Date.now()); const skipTypes = useRef(new Set<string>());
  const ex = queue[i];
  const total = useMemo(() => new Set(exercises.map((e) => e.id)).size, [exercises]);
  const words = useMemo(() => new Map(allWords(course).map((w) => [w.id, w])), [course]);

  const finish = useCallback(() => {
    const done = exercises.filter((e) => first.current.has(e.id));
    const sentence = (ok: boolean) => [...new Set(done.filter((e) => e.sentenceId && first.current.get(e.id) === ok).map((e) => e.sentenceId!))];
    const missed = sentence(false);
    onFinish({ kind, courseId: course.id, ...base, total: done.length, correctFirstTry: done.filter((e) => first.current.get(e.id)).length, seconds: Math.round((Date.now() - started.current) / 1000),
      words: done.flatMap((e) => e.wordIds.map((wordId) => ({ wordId, correct: !!first.current.get(e.id) }))), missedSentences: missed, fixedSentences: sentence(true).filter((s) => !missed.includes(s)) });
  }, [exercises, kind, course.id, base, onFinish]);

  const advance = useCallback((q: Exercise[], from: number) => {
    let n = from + 1;
    while (n < q.length && skipTypes.current.has(q[n].type)) { skipped.current.add(q[n].id); n++; }
    setDraft(null); setVerdict(null); setWhy(false);
    if (n >= q.length) finish(); else setI(n);
  }, [finish]);

  const check = useCallback((a: Answer | null) => {
    if (!a || verdict) return;
    const v = evaluate(ex, a);
    if (!first.current.has(ex.id)) first.current.set(ex.id, v.correct);
    if (v.correct) solved.current.add(ex.id); else setQueue((q) => [...q, ex]);
    if (sound) (v.correct ? sfx.correct : sfx.wrong)();
    setVerdict(v);
  }, [ex, verdict, sound]);

  const skip = () => { skipTypes.current.add(ex.type); skipped.current.add(ex.id); advance(queue, i); };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key !== "Enter" || e.shiftKey) return; if (verdict) { e.preventDefault(); advance(queue, i); } else if (draft) { e.preventDefault(); check(draft); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [verdict, draft, queue, i, advance, check]);

  if (!ex) return null;
  const gloss = ex.wordIds.map((id) => words.get(id)).filter((w) => !!w);
  const canSkip = ex.type === "speak" || ex.type === "listen";
  return (
    <div className="mx-auto flex min-h-dvh max-w-[720px] flex-col">
      <header className="flex items-center gap-4 px-4 pb-2 pt-5">
        <button type="button" aria-label="Quit session" onClick={() => setConfirmQuit(true)} className="rounded-lg p-1 text-sub hover:bg-mist"><X size={28} strokeWidth={2.6} /></button>
        <ProgressBar value={solved.current.size / Math.max(1, total - skipped.current.size)} label="Lesson progress" />
      </header>
      <main className="flex-1 px-4 pb-48 pt-4">
        <h1 className="mb-6 text-2xl">{queue.indexOf(ex) !== i && <span className="mr-2 rounded-lg bg-sun-soft px-2 py-1 align-middle text-sm text-sun-dark">Let’s try again</span>}{ex.instruction}</h1>
        <ExerciseView key={`${ex.id}-${i}`} ex={ex} course={course} locked={!!verdict} sound={sound} onDraft={setDraft} onAutoSubmit={check} />
      </main>
      <footer className={`fixed inset-x-0 bottom-0 z-40 border-t-2 ${verdict ? (verdict.correct ? "anim-rise border-brand-soft bg-brand-soft" : "anim-rise border-coral-soft bg-coral-soft") : "border-line bg-paper"}`}>
        <div className="mx-auto max-w-[720px] px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4" aria-live="polite">
          {verdict && (
            <div className={`mb-3 ${verdict.correct ? "text-brand-dark" : "text-coral-dark"}`}>
              <p className="flex items-center gap-2 text-xl font-extrabold">{verdict.correct ? <CheckCircle2 /> : <XCircle />}{verdict.correct ? PRAISE[i % PRAISE.length] : "Not quite — here’s the answer"}</p>
              {(!verdict.correct || verdict.note) && <p className="mt-1 text-[17px]"><span className="font-extrabold">{verdict.correct ? (verdict.note === "accent" ? "Mind the accents: " : "You have a small typo: ") : "Correct answer: "}</span>{verdict.expected}</p>}
              {gloss.length > 0 && <button type="button" onClick={() => setWhy(!why)} aria-expanded={why} className="mt-2 flex items-center gap-1 text-sm font-extrabold uppercase"><HelpCircle size={16} />{why ? "Hide explanation" : "Explain"}</button>}
              {why && <ul className="mt-2 space-y-1 rounded-xl bg-paper/70 p-3 text-[15px] text-ink">{gloss.map((w) => <li key={w.id}><strong lang={course.ttsLang}>{w.t}</strong> — {w.n}</li>)}</ul>}
            </div>
          )}
          <div className="flex gap-3">
            {!verdict && canSkip && <Button variant="secondary" onClick={skip} className="!normal-case">{ex.type === "speak" ? "Can’t speak now" : "Can’t listen now"}</Button>}
            {verdict ? <Button autoFocus variant={verdict.correct ? "primary" : "danger"} onClick={() => advance(queue, i)} className="flex-1">Continue</Button>
              : ex.type !== "match" && <Button disabled={!draft} onClick={() => check(draft)} className="flex-1">Check</Button>}
          </div>
        </div>
      </footer>
      {confirmQuit && (
        <div role="dialog" aria-modal="true" aria-labelledby="quit-title" className="fixed inset-0 z-50 grid place-items-end bg-ink/50 sm:place-items-center">
          <div className="anim-rise w-full max-w-md rounded-t-3xl bg-paper p-6 text-center sm:rounded-3xl">
            <h2 id="quit-title" className="text-xl">Leave this session?</h2>
            <p className="mt-2 text-sub">You can come back any time — there’s no penalty, but this session’s progress won’t be saved.</p>
            <div className="mt-5 space-y-3"><Button autoFocus className="w-full" onClick={() => setConfirmQuit(false)}>Keep learning</Button><Link href={exitHref} className="block py-2 text-sm font-extrabold uppercase text-coral-dark">End session</Link></div>
          </div>
        </div>
      )}
    </div>
  );
}
