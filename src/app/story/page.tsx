"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Volume2, X } from "lucide-react";
import { useStore } from "@/lib/state/store";
import { getCourse } from "@/lib/content";
import type { SessionSummary } from "@/lib/state/actions";
import { say, sfx } from "@/lib/audio";
import { SessionSummaryView } from "@/components/lesson/SessionSummary";
import { Button, LinkButton, Loading, ProgressBar } from "@/components/ui";

function Reader() {
  const { state, ready, finishSession } = useStore(); const course = getCourse(state.profile.courseId);
  const story = course.units.map((u) => u.story).find((s) => s?.id === useSearchParams().get("id"));
  const [shown, setShown] = useState(1); const [picked, setPicked] = useState<Record<number, number>>({}); const [wrongFirst, setWrongFirst] = useState<Set<number>>(new Set());
  const [reveal, setReveal] = useState<Set<number>>(new Set()); const [summary, setSummary] = useState<SessionSummary | null>(null);
  const started = useRef(Date.now()); const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [shown, picked]);
  useEffect(() => { if (story && ready && state.profile.sound) say(story.lines[shown - 1].t, course.ttsLang); }, [shown, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!ready) return <Loading />;
  if (!story) return <div className="grid min-h-dvh place-items-center p-6 text-center"><div><p className="mb-4 text-lg">That story isn’t part of this course.</p><LinkButton href="/stories">All stories</LinkButton></div></div>;
  if (summary) return <SessionSummaryView s={summary} title={`You read “${story.title}”.`} nextHref="/stories" />;
  const pendingQ = story.questions.findIndex((q) => q.afterLine === shown - 1 && picked[q.afterLine] !== q.answer);
  const atEnd = shown >= story.lines.length;
  const answer = (qi: number, opt: number) => {
    const q = story.questions[qi];
    if (opt !== q.answer) { setWrongFirst((s) => new Set(s).add(qi)); if (state.profile.sound) sfx.wrong(); } else if (state.profile.sound) sfx.correct();
    setPicked((p) => ({ ...p, [q.afterLine]: opt }));
  };
  const finish = () => setSummary(finishSession({ kind: "story", courseId: course.id, storyId: story.id, total: story.questions.length, correctFirstTry: story.questions.length - wrongFirst.size, seconds: Math.round((Date.now() - started.current) / 1000), words: [], missedSentences: [], fixedSentences: [] }));
  return (
    <div className="mx-auto flex min-h-dvh max-w-[640px] flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-4 bg-paper px-4 pb-2 pt-5"><Link href="/stories" aria-label="Close story" className="rounded-lg p-1 text-sub"><X size={28} /></Link><ProgressBar value={shown / story.lines.length} color="bg-sun" label="Story progress" /></header>
      <main className="flex-1 space-y-4 px-4 pb-40 pt-4">
        <h1 className="text-2xl" lang={course.ttsLang}>{story.title}</h1>
        {story.lines.slice(0, shown).map((l, i) => (
          <div key={i}>
            <div className={`anim-pop flex items-start gap-3 ${i % 2 ? "flex-row-reverse text-right" : ""}`}>
              <button aria-label={`Hear ${l.speaker}'s line`} onClick={() => say(l.t, course.ttsLang)} className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-soft text-sky-dark"><Volume2 size={20} /></button>
              <div className="rounded-2xl border-2 border-line px-4 py-3"><p className="text-xs font-extrabold uppercase text-sub">{l.speaker}</p>
                <button className="text-left text-lg decoration-dotted underline-offset-4 hover:underline" aria-expanded={reveal.has(i)} onClick={() => setReveal((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; })} lang={course.ttsLang}>{l.t}</button>
                {reveal.has(i) && <p className="mt-1 text-sm text-sub">{l.n}</p>}</div>
            </div>
            {story.questions.map((q, qi) => q.afterLine === i && shown > i && (
              <fieldset key={qi} className="anim-pop my-4 rounded-2xl bg-mist p-4"><legend className="float-left mb-3 w-full text-lg font-extrabold">{q.prompt}</legend>
                <div className="clear-both space-y-2">{q.options.map((o, oi) => { const chosen = picked[q.afterLine] === oi, right = oi === q.answer; return (
                  <button key={o} disabled={picked[q.afterLine] === q.answer} onClick={() => answer(qi, oi)} className={`key w-full rounded-xl border-2 border-b-4 px-4 py-2.5 text-left font-bold ${chosen && right ? "border-brand bg-brand-soft text-brand-dark" : chosen ? "border-coral bg-coral-soft text-coral-dark" : "border-line-dark bg-paper"}`}>{o}{chosen && !right && " — try another"}</button>); })}</div>
              </fieldset>
            ))}
          </div>
        ))}
        <p className="text-center text-sm text-sub">Tap any line to see its translation.</p>
        <div ref={end} />
      </main>
      <footer className="fixed inset-x-0 bottom-0 border-t-2 border-line bg-paper"><div className="mx-auto max-w-[640px] px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
        {atEnd && pendingQ < 0 ? <Button className="w-full" onClick={finish}>Finish story</Button> : <Button className="w-full" disabled={pendingQ >= 0} onClick={() => setShown(shown + 1)}>{pendingQ >= 0 ? "Answer to continue" : "Continue"}</Button>}
      </div></footer>
    </div>
  );
}
export default function StoryPage() { return <Suspense fallback={<Loading />}><Reader /></Suspense>; }
