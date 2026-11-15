"use client";
import { useState } from "react";
import { Flame, Gem, Snowflake } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Button, Card, Notice, ProgressBar } from "@/components/ui";
import { useStore } from "@/lib/state/store";
import { ACHIEVEMENTS, GEM_RULES, QUEST_LABELS, dayKey, liveStreak, questsFor } from "@/lib/engine/gamification";
import { useT } from "@/lib/i18n";

export default function Quests() {
  const { state, buyFreeze } = useStore(); const { t, num, date } = useT(); const now = Date.now();
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<string | null>(null);
  const quests = state.quests.day === dayKey(now) ? state.quests.items : questsFor(dayKey(now));
  const canBuy = state.gems >= GEM_RULES.freezeCost && state.streak.freezes < GEM_RULES.maxFreezes;
  return (
    <AppShell>
      <PageTitle title={t("Quests & rewards")} sub={t("New quests every day. Rewards are earned by learning — nothing here is for sale.")} />
      <Card className="mb-5">
        <h2 className="mb-3 text-lg">{t("Today’s quests")}</h2>
        <ul className="space-y-4">{quests.map((q) => (
          <li key={q.id}><div className="mb-1 flex justify-between"><span className="font-extrabold">{t(QUEST_LABELS[q.id], { n: q.target })}</span><span className="flex items-center gap-1 text-sm text-sky-dark">{q.claimed ? `${t("Done")} ✓` : <><Gem size={14} aria-hidden="true" />+{q.reward}</>}</span></div>
            <ProgressBar value={q.progress / q.target} color={q.claimed ? "bg-brand" : "bg-sky"} label={t(QUEST_LABELS[q.id], { n: q.target })} /><p className="mt-1 text-xs text-sub">{num(q.progress)} / {num(q.target)}</p></li>
        ))}</ul>
      </Card>
      <Card className="mb-5">
        <div className="flex items-center gap-4"><Flame size={44} className="fill-sun text-sun-edge" aria-hidden="true" /><div className="flex-1"><h2 className="text-lg">{t("{n}-day streak", { n: num(liveStreak(state.streak, now)) })}</h2><p className="text-sm text-sub">{t("Longest: {n} days · Any session keeps it alive.", { n: num(state.streak.longest) })}</p></div></div>
        <div className="mt-4 flex items-center gap-4 rounded-2xl bg-sky-soft p-4"><Snowflake size={32} className="text-sky-dark" aria-hidden="true" /><div className="flex-1"><p className="font-extrabold">{t("Streak freeze")} · {state.streak.freezes}/{GEM_RULES.maxFreezes}</p><p className="text-sm text-sub">{t("Protects your streak for one missed day. Costs {cost} gems; you have {have}.", { cost: GEM_RULES.freezeCost, have: num(state.gems) })}</p></div>
          <Button variant="sky" disabled={!canBuy || busy} aria-busy={busy} onClick={async () => { setBusy(true); setMsg(await buyFreeze()); setBusy(false); }} className="!min-h-11 !px-4 !text-sm">{t("Get")}</Button></div>
        {msg && <div className="mt-3"><Notice tone="error">{t(msg)}</Notice></div>}
      </Card>
      <h2 className="mb-3 text-lg">{t("Achievements")} · {Object.keys(state.achievements).length}/{ACHIEVEMENTS.length}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">{ACHIEVEMENTS.map((a) => { const got = !!state.achievements[a.id]; return (
        <li key={a.id} className={`flex items-center gap-3 rounded-2xl border-2 p-3 ${got ? "border-sun-edge bg-sun-soft text-sun-dark" : "border-line bg-mist text-sub"}`}><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl ${got ? "bg-paper" : "bg-line grayscale"}`} aria-hidden="true">{a.icon}</span><span><span className="block font-extrabold">{t(a.title)}{!got && <span className="sr-only"> ({t("locked")})</span>}</span><span className="block text-sm">{t(a.description)}{got && ` · ${date(state.achievements[a.id])}`}</span></span></li>); })}</ul>
    </AppShell>
  );
}
