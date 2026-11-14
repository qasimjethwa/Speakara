"use client";
import { Flame, Gem, Snowflake } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Button, Card, ProgressBar } from "@/components/ui";
import { useStore } from "@/lib/state/store";
import { ACHIEVEMENTS, GEM_RULES, QUEST_LABELS, dayKey, liveStreak, questsFor } from "@/lib/engine/gamification";
import { buyStreakFreeze } from "@/lib/state/actions";

export default function Quests() {
  const { state, update } = useStore(); const now = Date.now();
  const quests = state.quests.day === dayKey(now) ? state.quests.items : questsFor(dayKey(now));
  const canBuy = state.gems >= GEM_RULES.freezeCost && state.streak.freezes < GEM_RULES.maxFreezes;
  return (
    <AppShell>
      <PageTitle title="Quests & rewards" sub="New quests every day. Rewards are earned by learning — nothing here is for sale." />
      <Card className="mb-5">
        <h2 className="mb-3 text-lg">Today’s quests</h2>
        <ul className="space-y-4">{quests.map((q) => (
          <li key={q.id}><div className="mb-1 flex justify-between"><span className="font-extrabold">{QUEST_LABELS[q.id](q.target)}</span><span className="flex items-center gap-1 text-sm text-sky-dark">{q.claimed ? "Done ✓" : <><Gem size={14} />+{q.reward}</>}</span></div>
            <ProgressBar value={q.progress / q.target} color={q.claimed ? "bg-brand" : "bg-sky"} label={QUEST_LABELS[q.id](q.target)} /><p className="mt-1 text-xs text-sub">{q.progress} / {q.target}</p></li>
        ))}</ul>
      </Card>
      <Card className="mb-5">
        <div className="flex items-center gap-4"><Flame size={44} className="fill-sun text-sun-dark" /><div className="flex-1"><h2 className="text-lg">{liveStreak(state.streak, now)}-day streak</h2><p className="text-sm text-sub">Longest: {state.streak.longest} days · Any session keeps it alive.</p></div></div>
        <div className="mt-4 flex items-center gap-4 rounded-2xl bg-sky-soft/60 p-4"><Snowflake size={32} className="text-sky-dark" /><div className="flex-1"><p className="font-extrabold">Streak freeze · {state.streak.freezes}/{GEM_RULES.maxFreezes} equipped</p><p className="text-sm text-sub">Protects your streak for one missed day. Costs {GEM_RULES.freezeCost} gems; you have {state.gems}.</p></div>
          <Button variant="sky" disabled={!canBuy} onClick={() => update(buyStreakFreeze)} className="!min-h-10 !px-4 !text-sm">Get</Button></div>
      </Card>
      <h2 className="mb-3 text-lg">Achievements · {Object.keys(state.achievements).length}/{ACHIEVEMENTS.length}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">{ACHIEVEMENTS.map((a) => { const got = !!state.achievements[a.id]; return (
        <li key={a.id} className={`flex items-center gap-3 rounded-2xl border-2 p-3 ${got ? "border-sun bg-sun-soft" : "border-line bg-mist text-sub"}`}><span className={`grid h-12 w-12 place-items-center rounded-2xl text-2xl ${got ? "bg-paper" : "bg-line grayscale"}`} aria-hidden="true">{a.icon}</span><span><span className="block font-extrabold">{a.title}</span><span className="block text-sm">{a.description}{got && ` · ${new Date(state.achievements[a.id]).toLocaleDateString()}`}</span></span></li>); })}</ul>
    </AppShell>
  );
}
