"use client";
import Link from "next/link";
import { BookOpen, Ear, Mic, NotebookText, RefreshCcw, Target, Wrench } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { useStore } from "@/lib/state/store";
import { isDue } from "@/lib/engine/srs";

export default function Practice() {
  const { state } = useStore(); const cid = state.profile.courseId; const now = Date.now();
  const due = Object.entries(state.review).filter(([k, it]) => k.startsWith(`${cid}:`) && isDue(it, now)).length;
  const mistakes = state.mistakes.filter((m) => m.courseId === cid).length;
  const item = (href: string, Icon: typeof Ear, title: string, sub: string, tone: string, badge?: number) => (
    <Link href={href} className="key flex items-center gap-4 rounded-2xl border-2 border-b-4 border-line-dark p-4">
      <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${tone}`}><Icon size={28} /></span>
      <span className="flex-1"><span className="block text-lg font-extrabold">{title}</span><span className="block text-sm text-sub">{sub}</span></span>
      {!!badge && <span className="rounded-full bg-coral px-2.5 py-0.5 text-sm font-extrabold text-white" aria-label={`${badge} waiting`}>{badge}</span>}
    </Link>
  );
  return (
    <AppShell>
      <PageTitle title="Practice hub" sub="Every practice mode is free and unlimited." />
      <div className="space-y-3">
        {item("/lesson?mode=review", RefreshCcw, "Smart review", due ? `${due} word${due > 1 ? "s are" : " is"} due for review` : "Strengthen what you’ve learned", "bg-brand-soft text-brand-dark", due)}
        {item("/lesson?mode=mistakes", Wrench, "Fix my mistakes", mistakes ? "Retry the sentences you missed" : "Nothing to fix right now", "bg-coral-soft text-coral-dark", mistakes)}
        {item("/lesson?mode=listen", Ear, "Listening", "Train your ear with audio-only exercises", "bg-sky-soft text-sky-dark")}
        {item("/lesson?mode=speak", Mic, "Speaking & pronunciation", "Say sentences aloud and get checked", "bg-grape-soft text-grape-dark")}
      </div>
      <h2 className="mb-3 mt-8 text-lg">More ways to learn</h2>
      <div className="space-y-3">
        {item("/stories", BookOpen, "Stories", "Read short dialogues", "bg-sun-soft text-sun-dark")}
        {item("/vocabulary", NotebookText, "Vocabulary notebook", "Every word you’ve met, with strength", "bg-brand-soft text-brand-dark")}
        {item("/quests", Target, "Quests & achievements", "Today’s goals and your badges", "bg-sky-soft text-sky-dark")}
      </div>
    </AppShell>
  );
}
