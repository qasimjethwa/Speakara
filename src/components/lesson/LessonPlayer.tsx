"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, CheckCircle2, XCircle, HelpCircle, Timer, Sparkles } from "lucide-react";
import type { Course } from "@/lib/content/types";
import { allWords } from "@/lib/content";
import { evaluate, type Answer, type Exercise } from "@/lib/engine/exercises";
import { SKIPPABLE, type Attempt } from "@/lib/engine/grade";
import type { Verdict } from "@/lib/engine/text";
import { sfx } from "@/lib/audio";
import { useT } from "@/lib/i18n";
import { Button, Dialog, ProgressBar } from "../ui";
import { ExerciseView } from "./ExerciseViews";

interface Props { course: Course; exercises: Exercise[]; sound: boolean; slow: boolean; exitHref: string; timeLimit?: number; aiExplain?: boolean; onFinish: (attempts: Attempt[], seconds: number) => void }
const PRAISE = ["Nice!", "Great job!", "Exactly!", "You got it!", "Well done!"];

/** Runs one session. Missed items come back at the end until answered — mistakes cost nothing but a second look. */
export function LessonPlayer({ course, exercises, sound, slow, exitHref, timeLimit, aiExplain, onFinish }: Props) {
  const { t } = useT();
  const [queue, setQueue] = useState(exercises);
  const [i, setI] = useState(0);
  const [draft, setDraft] = useState<Answer | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [why, setWhy] = useState(false); const [ai, setAi] = useState<{ text?: string; loading?: boolean; error?: string } | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [left, setLeft] = useState(timeLimit ?? 0);
  const first = useRef(new Map<string, Attempt>()); const solved = useRef(new Set<string>()); const given = useRef<Answer | null>(null);
  const started = useRef(Date.now()); const skipTypes = useRef(new Set<string>()); const finished = useRef(false);
  const ex = queue[i];
  const total = useMemo(() => new Set(exercises.map((e) => e.id)).size, [exercises]);
  const words = useMemo(() => new Map(allWords(course).map((w) => [w.id, w])), [course]);
  const skippedCount = () => [...first.current.values()].filter((a) => a.skipped).length;

  const finish = useCallback(() => {
    if (finished.current) return; finished.current = true;
    // Anything never reached (time ran out) is recorded as a miss so the session is complete and gradable.
    const attempts = exercises.map((e) => first.current.get(e.id) ?? (SKIPPABLE.includes(e.type) ? { id: e.id, skipped: true } : { id: e.id, answer: e.type === "match" ? { type: "match" as const, mistakes: 99 } : e.type === "choose" || e.type === "fill" ? { type: e.type, index: -1 } : { type: e.type as "translate", text: "" } }));
    if (sound) sfx.finish();
    onFinish(attempts, Math.round((Date.now() - started.current) / 1000));
  }, [exercises, onFinish, sound]);

  const advance = useCallback((q: Exercise[], from: number) => {
    let n = from + 1;
    while (n < q.length && skipTypes.current.has(q[n].type)) { if (!first.current.has(q[n].id)) first.current.set(q[n].id, { id: q[n].id, skipped: true }); n++; }
    setDraft(null); setVerdict(null); setWhy(false); setAi(null);
    if (n >= q.length) finish(); else setI(n);
  }, [finish]);

  const check = useCallback((a: Answer | null) => {
    if (!a || verdict) return;
    const v = evaluate(ex, a); given.current = a;
    if (!first.current.has(ex.id)) first.current.set(ex.id, { id: ex.id, answer: a });
    if (v.correct) solved.current.add(ex.id); else setQueue((q) => [...q, ex]);
    if (sound) (v.correct ? sfx.correct : sfx.wrong)();
    setVerdict(v);
  }, [ex, verdict, sound]);

  const skip = () => { skipTypes.current.add(ex.type); if (!first.current.has(ex.id)) first.current.set(ex.id, { id: ex.id, skipped: true }); advance(queue, i); };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key !== "Enter" || e.shiftKey || confirmQuit) return; if (verdict) { e.preventDefault(); advance(queue, i); } else if (draft) { e.preventDefault(); check(draft); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [verdict, draft, queue, i, advance, check, confirmQuit]);
  useEffect(() => {
    if (!timeLimit) return;
    const id = setInterval(() => setLeft((s) => { if (s <= 1) { clearInterval(id); finish(); return 0; } return s - 1; }), 1000);
    return () => clearInterval(id);
  }, [timeLimit, finish]);

  const askAi = async () => {
    setAi({ loading: true });
    try {
      const g = given.current; const said = !g ? "" : "text" in g ? g.text : "transcript" in g ? g.transcript : "index" in g && "options" in ex ? ex.options[g.index] ?? "" : "";
      const res = await fetch("/api/tutor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "explain", target: course.target, targetName: course.targetName, nativeName: course.nativeName, expected: verdict?.expected ?? "", given: said, prompt: "prompt" in ex ? ex.prompt : "" }) });
      const data = (await res.json()) as { explanation?: string; error?: string };
      setAi(res.ok && data.explanation ? { text: data.explanation } : { error: data.error ?? t("The tutor couldn’t answer. Please try again.") });
    } catch { setAi({ error: t("You seem to be offline. Check your connection and try again.") }); }
  };

  if (!ex) return null;
  const gloss = ex.wordIds.map((id) => words.get(id)).filter((w) => !!w);
  const canSkip = SKIPPABLE.includes(ex.type);
  const retry = queue.indexOf(ex) !== i;
  return (
    <div className="mx-auto flex min-h-dvh max-w-[720px] flex-col">
      <header className="flex items-center gap-4 px-4 pb-2 pt-5">
        <button type="button" aria-label={t("Quit session")} onClick={() => setConfirmQuit(true)} className="rounded-lg p-1 text-sub hover:bg-mist"><X size={28} strokeWidth={2.6} /></button>
        <ProgressBar value={solved.current.size / Math.max(1, total - skippedCount())} label={t("Lesson progress")} />
        {!!timeLimit && <span className={`flex items-center gap-1 font-extrabold tabular-nums ${left <= 10 ? "text-coral-dark" : "text-sub"}`} role="timer" aria-label={t("{n} seconds left", { n: left })}><Timer size={20} />{left}</span>}
      </header>
      <main className="flex-1 px-4 pb-56 pt-4">
        <h1 className="mb-6 text-2xl" data-instruction={ex.instruction} data-ex-type={ex.type}>{retry && <span className="mr-2 rounded-lg bg-sun-soft px-2 py-1 align-middle text-sm text-sun-dark">{t("Let’s try again")}</span>}{t(ex.instruction, ex.vars && Object.fromEntries(Object.entries(ex.vars).map(([k, v]) => [k, t(v)])))}</h1>
        <ExerciseView key={`${ex.id}-${i}`} ex={ex} course={course} locked={!!verdict} sound={sound} slow={slow} onDraft={setDraft} onAutoSubmit={check} />
      </main>
      <footer className={`fixed inset-x-0 bottom-0 z-40 border-t-2 ${verdict ? (verdict.correct ? "anim-rise border-brand bg-brand-soft" : "anim-rise border-coral bg-coral-soft") : "border-line bg-paper"}`}>
        <div className="mx-auto max-w-[720px] px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
          <div aria-live="assertive">
            {verdict && (
              <div className={`mb-3 ${verdict.correct ? "text-brand-dark" : "text-coral-dark"}`}>
                <p className="flex items-center gap-2 text-xl font-extrabold">{verdict.correct ? <CheckCircle2 aria-hidden="true" /> : <XCircle aria-hidden="true" />}{verdict.correct ? t(PRAISE[i % PRAISE.length]) : t("Not quite — here’s the answer")}</p>
                {(!verdict.correct || verdict.note) && <p className="mt-1 text-[17px]"><span className="font-extrabold">{verdict.correct ? (verdict.note === "accent" ? t("Mind the accents:") : t("You have a small typo:")) : t("Correct answer:")} </span><span lang={ex.type === "speak" || ex.type === "listen" || ex.type === "dictation" || ex.type === "fill" ? course.ttsLang : undefined}>{verdict.expected}</span></p>}
              </div>
            )}
          </div>
          {verdict && (gloss.length > 0 || aiExplain) && (
            <div className={`mb-3 ${verdict.correct ? "text-brand-dark" : "text-coral-dark"}`}>
              <div className="flex flex-wrap gap-4">
                {gloss.length > 0 && <button type="button" onClick={() => setWhy(!why)} aria-expanded={why} className="flex items-center gap-1 text-sm font-extrabold uppercase"><HelpCircle size={16} />{why ? t("Hide explanation") : t("Explain")}</button>}
                {aiExplain && !verdict.correct && !ai && <button type="button" onClick={askAi} className="flex items-center gap-1 text-sm font-extrabold uppercase"><Sparkles size={16} />{t("Ask Kiko why")}</button>}
              </div>
              {why && <ul className="mt-2 space-y-1 rounded-xl bg-paper p-3 text-[15px] text-ink">{gloss.map((w) => <li key={w.id}><strong lang={course.ttsLang}>{w.t}</strong> — {w.n}</li>)}</ul>}
              {ai && <p role="status" className="mt-2 rounded-xl bg-paper p-3 text-[15px] text-ink">{ai.loading ? t("Kiko is thinking…") : ai.text ?? ai.error}</p>}
            </div>
          )}
          <div className="flex gap-3">
            {!verdict && canSkip && <Button variant="secondary" onClick={skip} className="!normal-case">{ex.type === "speak" ? t("Can’t speak now") : t("Can’t listen now")}</Button>}
            {verdict ? <Button autoFocus variant={verdict.correct ? "primary" : "danger"} onClick={() => advance(queue, i)} className="flex-1">{t("Continue")}</Button>
              : ex.type !== "match" && <Button disabled={!draft} onClick={() => check(draft)} className="flex-1">{t("Check")}</Button>}
          </div>
        </div>
      </footer>
      <Dialog open={confirmQuit} onClose={() => setConfirmQuit(false)} labelledBy="quit-title">
        <h2 id="quit-title" className="text-xl">{t("Leave this session?")}</h2>
        <p className="mt-2 text-sub">{t("You can come back any time — there’s no penalty, but this session’s progress won’t be saved.")}</p>
        <div className="mt-5 space-y-3"><Button autoFocus className="w-full" onClick={() => setConfirmQuit(false)}>{t("Keep learning")}</Button><Link href={exitHref} className="block py-2 text-sm font-extrabold uppercase text-coral-dark">{t("End session")}</Link></div>
      </Dialog>
    </div>
  );
}
