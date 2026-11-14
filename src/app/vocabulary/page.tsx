"use client";
import { useState } from "react";
import { Volume2 } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Mascot } from "@/components/Mascot";
import { LinkButton } from "@/components/ui";
import { useStore } from "@/lib/state/store";
import { allWords, getCourse, wordKey } from "@/lib/content";
import { isDue, strength } from "@/lib/engine/srs";
import { say } from "@/lib/audio";

export default function Vocabulary() {
  const { state } = useStore(); const course = getCourse(state.profile.courseId); const now = Date.now();
  const [filter, setFilter] = useState<"all" | "due" | "weak">("all");
  const rows = allWords(course).map((w) => ({ w, it: state.review[wordKey(course.id, w.id)] })).filter((r) => !!r.it)
    .filter((r) => filter === "all" || (filter === "due" ? isDue(r.it, now) : strength(r.it) <= 1));
  const met = allWords(course).filter((w) => state.review[wordKey(course.id, w.id)]).length;
  const when = (due: number) => { const d = Math.ceil((due - now) / 86_400_000); return d <= 0 ? "due now" : d === 1 ? "tomorrow" : `in ${d} days`; };
  return (
    <AppShell>
      <PageTitle title="Vocabulary notebook" sub={`${met} of ${allWords(course).length} ${course.targetName} words met`} />
      {met === 0 ? <div className="py-10 text-center"><Mascot mood="think" size={130} className="mx-auto" /><p className="my-4 text-lg">Your notebook fills up as you learn.</p><LinkButton href="/learn">Start a lesson</LinkButton></div> : <>
        <div role="tablist" aria-label="Filter words" className="mb-4 flex gap-2">{(["all", "due", "weak"] as const).map((f) => <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={`rounded-xl border-2 px-4 py-2 text-sm font-extrabold uppercase ${filter === f ? "border-sky bg-sky-soft text-sky-dark" : "border-line text-sub"}`}>{f}</button>)}</div>
        <ul className="divide-y-2 divide-line rounded-2xl border-2 border-line">
          {rows.length === 0 && <li className="p-5 text-center text-sub">Nothing here right now.</li>}
          {rows.map(({ w, it }) => (
            <li key={w.id} className="flex items-center gap-3 p-3">
              <button aria-label={`Hear ${w.t}`} onClick={() => say(w.t, course.ttsLang)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-soft text-sky-dark"><Volume2 size={20} /></button>
              <div className="min-w-0 flex-1"><p className="truncate text-lg font-extrabold" lang={course.ttsLang}>{w.t}</p><p className="truncate text-sm text-sub">{w.n}</p></div>
              <div className="text-right"><div className="flex justify-end gap-1" role="img" aria-label={`Strength ${strength(it)} of 4`}>{[1, 2, 3, 4].map((b) => <span key={b} className={`h-4 w-2 rounded-sm ${b <= strength(it) ? "bg-brand" : "bg-line"}`} />)}</div><p className="mt-1 text-xs text-sub">Review {when(it.due)}</p></div>
            </li>
          ))}
        </ul>
        <LinkButton href="/lesson?mode=review" className="mt-5 w-full">Practise these words</LinkButton>
      </>}
    </AppShell>
  );
}
