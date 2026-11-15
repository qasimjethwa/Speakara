"use client";
import Link from "next/link";
import { BookOpen, Ear, Mic, NotebookText, PenLine, RefreshCcw, Target, Timer, Wrench } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { useStore } from "@/lib/state/store";
import { isDue } from "@/lib/engine/srs";
import { useT } from "@/lib/i18n";

export default function Practice() {
  const { state } = useStore(); const { t } = useT(); const cid = state.profile.courseId; const now = Date.now();
  const due = Object.entries(state.review).filter(([k, it]) => k.startsWith(`${cid}:`) && isDue(it, now)).length;
  const mistakes = state.mistakes.filter((m) => m.courseId === cid).length;
  const item = (href: string, Icon: typeof Ear, title: string, sub: string, tone: string, badge?: number) => (
    <li><Link href={href} className="key flex items-center gap-4 rounded-2xl border-2 border-b-4 border-line-dark p-4">
      <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${tone}`} aria-hidden="true"><Icon size={28} /></span>
      <span className="flex-1"><span className="block text-lg font-extrabold">{t(title)}</span><span className="block text-sm text-sub">{sub}</span></span>
      {!!badge && <span className="rounded-full bg-coral px-2.5 py-0.5 text-sm font-extrabold text-white">{badge}<span className="sr-only"> {t("waiting")}</span></span>}
    </Link></li>
  );
  return (
    <AppShell>
      <PageTitle title={t("Practice hub")} sub={t("Every practice mode is free and unlimited.")} />
      <ul className="space-y-3">
        {item("/lesson?mode=review", RefreshCcw, "Smart review", due ? t("{n} words are due for review", { n: due }) : t("Strengthen what you’ve learned"), "bg-brand-soft text-brand-dark", due)}
        {item("/lesson?mode=mistakes", Wrench, "Fix my mistakes", mistakes ? t("Retry the sentences you missed") : t("Nothing to fix right now"), "bg-coral-soft text-coral-dark", mistakes)}
        {item("/lesson?mode=listen", Ear, "Listening & dictation", t("Train your ear: tap or type what you hear"), "bg-sky-soft text-sky-dark")}
        {item("/lesson?mode=speak", Mic, "Speaking & pronunciation", t("Say sentences aloud and get word-by-word feedback"), "bg-grape-soft text-grape-dark")}
        {item("/lesson?mode=write", PenLine, "Writing", t("Type full sentences in both directions"), "bg-sun-soft text-sun-dark")}
        {item("/lesson?mode=match", Timer, "Match rush", t("Match as many pairs as you can in 90 seconds"), "bg-brand-soft text-brand-dark")}
      </ul>
      <h2 className="mb-3 mt-8 text-lg">{t("More ways to learn")}</h2>
      <ul className="space-y-3">
        {item("/stories", BookOpen, "Stories", t("Read short dialogues"), "bg-sun-soft text-sun-dark")}
        {item("/vocabulary", NotebookText, "Vocabulary notebook", t("Every word you’ve met, with strength"), "bg-brand-soft text-brand-dark")}
        {item("/quests", Target, "Quests & rewards", t("Today’s goals and your badges"), "bg-sky-soft text-sky-dark")}
      </ul>
    </AppShell>
  );
}
