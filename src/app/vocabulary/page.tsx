"use client";
import { useState } from "react";
import { Trash2, Volume2 } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Mascot } from "@/components/Mascot";
import { LinkButton } from "@/components/ui";
import { useStore } from "@/lib/state/store";
import { allWords, getCourse, wordKey } from "@/lib/content";
import { isDue, strength } from "@/lib/engine/srs";
import { say } from "@/lib/audio";
import { useT } from "@/lib/i18n";

const FILTERS = [["all", "All"], ["due", "Due"], ["weak", "Weak"], ["saved", "Saved phrases"]] as const;
export default function Vocabulary() {
  const { state, setProfile } = useStore(); const { t } = useT(); const course = getCourse(state.profile.courseId); const now = Date.now();
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("all");
  const rate = state.profile.slowAudio ? 0.75 : 1;
  const rows = allWords(course).map((w) => ({ w, it: state.review[wordKey(course.id, w.id)] })).filter((r) => !!r.it)
    .filter((r) => filter === "all" || (filter === "due" ? isDue(r.it, now) : strength(r.it) <= 1));
  const met = allWords(course).filter((w) => state.review[wordKey(course.id, w.id)]).length;
  const saved = state.profile.savedPhrases.filter((p) => p.courseId === course.id);
  const when = (due: number) => { const d = Math.ceil((due - now) / 86_400_000); return d <= 0 ? t("Review now") : d === 1 ? t("Review tomorrow") : t("Review in {n} days", { n: d }); };
  const play = (text: string) => <button aria-label={t("Hear {word}", { word: text })} onClick={() => void say(text, course.ttsLang, rate)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-soft text-sky-dark"><Volume2 size={20} /></button>;
  return (
    <AppShell>
      <PageTitle title={t("Vocabulary notebook")} sub={t("{met} of {total} words met", { met, total: allWords(course).length })} />
      {met === 0 && saved.length === 0 ? <div className="py-10 text-center"><Mascot mood="think" size={130} className="mx-auto" /><p className="my-4 text-lg">{t("Your notebook fills up as you learn.")}</p><LinkButton href="/learn">{t("Start a lesson")}</LinkButton></div> : <>
        <div role="tablist" aria-label={t("Filter words")} className="mb-4 flex flex-wrap gap-2">{FILTERS.map(([f, label]) => <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={`min-h-11 rounded-xl border-2 px-4 py-2 text-sm font-extrabold uppercase ${filter === f ? "border-sky-dark bg-sky-soft text-sky-dark" : "border-line-dark text-sub"}`}>{t(label)}</button>)}</div>
        {filter === "saved" ? (
          <ul className="divide-y-2 divide-line rounded-2xl border-2 border-line">
            {saved.length === 0 && <li className="p-5 text-center text-sub">{t("Save useful phrases from tutor chats and they’ll appear here.")}</li>}
            {saved.map((p) => <li key={p.t} className="flex items-center gap-3 p-3">{play(p.t)}<div className="min-w-0 flex-1"><p className="text-lg font-extrabold" lang={course.ttsLang}>{p.t}</p><p className="text-sm text-sub">{p.n}</p></div>
              <button aria-label={t("Remove {word}", { word: p.t })} onClick={() => setProfile({ savedPhrases: state.profile.savedPhrases.filter((x) => !(x.t === p.t && x.courseId === p.courseId)) })} className="grid h-11 w-11 place-items-center rounded-xl text-sub hover:bg-mist"><Trash2 size={18} /></button></li>)}
          </ul>
        ) : (
          <ul className="divide-y-2 divide-line rounded-2xl border-2 border-line">
            {rows.length === 0 && <li className="p-5 text-center text-sub">{t("Nothing here right now.")}</li>}
            {rows.map(({ w, it }) => (
              <li key={w.id} className="flex items-center gap-3 p-3">{play(w.t)}
                <div className="min-w-0 flex-1"><p className="truncate text-lg font-extrabold" lang={course.ttsLang}>{w.t}</p><p className="truncate text-sm text-sub">{w.n}</p></div>
                <div className="text-right"><div className="flex justify-end gap-1" role="img" aria-label={t("Strength {n} of 4", { n: strength(it) })}>{[1, 2, 3, 4].map((b) => <span key={b} className={`h-4 w-2 rounded-sm ${b <= strength(it) ? "bg-brand" : "bg-line-dark"}`} />)}</div><p className="mt-1 text-xs text-sub">{when(it.due)}</p></div>
              </li>
            ))}
          </ul>
        )}
        {met > 0 && <LinkButton href="/lesson?mode=review" className="mt-5 w-full">{t("Practise these words")}</LinkButton>}
      </>}
    </AppShell>
  );
}
