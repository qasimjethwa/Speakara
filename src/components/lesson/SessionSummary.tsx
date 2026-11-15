"use client";
import { Flame, Gem, Target, Zap } from "lucide-react";
import type { SessionSummary } from "@/lib/state/actions";
import { ACHIEVEMENTS, QUEST_LABELS, questTarget } from "@/lib/engine/gamification";
import { useT } from "@/lib/i18n";
import { Mascot } from "../Mascot";
import { Confetti, LinkButton } from "../ui";

export function SessionSummaryView({ s, title, nextHref, gated = false }: { s: SessionSummary; title: string; nextHref: string; gated?: boolean }) {
  const { t, num } = useT();
  const failed = gated && !s.passed;
  const stat = (label: string, value: string, Icon: typeof Zap, cls: string) => (
    <div className={`anim-pop flex-1 rounded-2xl border-2 p-1 ${cls}`}><p className="py-1 text-center text-xs font-extrabold uppercase">{label}</p><p className="flex items-center justify-center gap-1.5 rounded-xl bg-paper py-3 text-xl font-extrabold text-ink"><Icon size={22} aria-hidden="true" />{value}</p></div>
  );
  return (
    <main data-summary data-xp={s.xp} data-passed={String(!failed)} className="mx-auto flex min-h-dvh max-w-[560px] flex-col items-center justify-center px-5 py-10 text-center">
      {!failed && <Confetti />}
      <Mascot mood={failed ? "think" : s.perfect ? "cheer" : "happy"} size={170} className="anim-bob" />
      <h1 className="mt-4 text-3xl text-sun-dark">{failed ? t("Not yet — and that’s useful to know") : s.perfect ? t("Perfect session!") : t("Session complete!")}</h1>
      <p className="mt-2 text-sub">{failed ? t("You need 80% to jump ahead. The lessons before this point will get you there quickly.") : title}</p>
      <div className="mt-7 flex w-full gap-3">
        {stat(t("Total XP"), `+${num(s.xp)}`, Zap, "border-sun bg-sun text-ink")}
        {stat(t("Accuracy"), `${num(Math.round(s.accuracy * 100))}%`, Target, "border-brand bg-brand text-white")}
        {stat(t("Gems"), `+${num(s.gems)}`, Gem, "border-sky bg-sky text-white")}
      </div>
      <ul className="mt-6 w-full space-y-2 text-left">
        {s.streakExtended && <li className="anim-pop flex items-center gap-3 rounded-2xl bg-sun-soft p-3 text-sun-dark"><Flame className="fill-sun text-sun-edge" aria-hidden="true" /><span><strong>{t("{n}-day streak!", { n: num(s.streak) })}</strong>{s.frozeDays > 0 && ` ${t("A streak freeze covered the days you missed.")}`}</span></li>}
        {s.questsCompleted.map((q) => <li key={q} className="anim-pop rounded-2xl bg-sky-soft p-3 text-sky-dark">🎯 {t("Quest complete:")} <strong>{t(QUEST_LABELS[q], { n: questTarget(q) })}</strong></li>)}
        {s.achievements.map((a) => { const d = ACHIEVEMENTS.find((x) => x.id === a); return d && <li key={a} className="anim-pop rounded-2xl bg-grape-soft p-3 text-grape-dark">{d.icon} {t("Achievement unlocked:")} <strong>{t(d.title)}</strong></li>; })}
      </ul>
      <LinkButton href={nextHref} className="mt-8 w-full">{t("Continue")}</LinkButton>
    </main>
  );
}
