"use client";
import { Flame, Gem, Target, Zap } from "lucide-react";
import type { SessionSummary } from "@/lib/state/actions";
import { ACHIEVEMENTS, questTitle } from "@/lib/engine/gamification";
import { Mascot } from "../Mascot";
import { Confetti, LinkButton } from "../ui";

export function SessionSummaryView({ s, title, nextHref, gated = false }: { s: SessionSummary; title: string; nextHref: string; gated?: boolean }) {
  const failed = gated && !s.passed;
  const stat = (label: string, value: string, Icon: typeof Zap, cls: string) => (
    <div className={`anim-pop flex-1 rounded-2xl border-2 p-1 ${cls}`}><p className="py-1 text-center text-xs font-extrabold uppercase text-white">{label}</p><p className="flex items-center justify-center gap-1.5 rounded-xl bg-paper py-3 text-xl font-extrabold"><Icon size={22} />{value}</p></div>
  );
  return (
    <div className="mx-auto flex min-h-dvh max-w-[560px] flex-col items-center justify-center px-5 py-10 text-center">
      {!failed && <Confetti />}
      <Mascot mood={failed ? "think" : s.perfect ? "cheer" : "happy"} size={170} className="anim-bob" />
      <h1 className="mt-4 text-3xl text-sun-dark">{failed ? "Not yet — and that’s useful to know" : s.perfect ? "Perfect session!" : "Session complete!"}</h1>
      <p className="mt-2 text-sub">{failed ? "You need 80% to jump ahead. The lessons before this point will get you there quickly." : title}</p>
      <div className="mt-7 flex w-full gap-3">
        {stat("Total XP", `+${s.xp}`, Zap, "border-sun bg-sun text-sun-dark")}
        {stat("Accuracy", `${Math.round(s.accuracy * 100)}%`, Target, "border-brand bg-brand text-brand-dark")}
        {stat("Gems", `+${s.gems}`, Gem, "border-sky bg-sky text-sky-dark")}
      </div>
      <ul className="mt-6 w-full space-y-2 text-left">
        {s.streakExtended && <li className="anim-pop flex items-center gap-3 rounded-2xl bg-sun-soft p-3"><Flame className="fill-sun text-sun-dark" /><span><strong>{s.streak}-day streak!</strong>{s.frozeDays > 0 && ` A streak freeze covered ${s.frozeDays} missed day${s.frozeDays > 1 ? "s" : ""}.`}</span></li>}
        {s.questsCompleted.map((q) => <li key={q} className="anim-pop rounded-2xl bg-sky-soft p-3">🎯 Quest complete: <strong>{questTitle(q)}</strong></li>)}
        {s.achievements.map((a) => { const d = ACHIEVEMENTS.find((x) => x.id === a); return d && <li key={a} className="anim-pop rounded-2xl bg-grape-soft p-3">{d.icon} Achievement unlocked: <strong>{d.title}</strong></li>; })}
      </ul>
      <LinkButton href={nextHref} className="mt-8 w-full">Continue</LinkButton>
    </div>
  );
}
