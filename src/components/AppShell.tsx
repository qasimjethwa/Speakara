"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { BookOpen, Dumbbell, Video, Flame, Gem, Home, MessagesSquare, NotebookText, Shield, Target, Trophy, User, Zap, CloudOff, Wrench } from "lucide-react";
import { useStore } from "@/lib/state/store";
import { getCourse } from "@/lib/content";
import { liveStreak, todayXp, QUEST_LABELS, questsFor, dayKey, weeklyXp, leagueFor } from "@/lib/engine/gamification";
import { useT } from "@/lib/i18n";
import { Logo } from "./Mascot";
import { Card, Loading, ProgressBar } from "./ui";

const NAV = [
  { href: "/learn", label: "Learn", icon: Home }, { href: "/practice", label: "Practice", icon: Dumbbell }, { href: "/stories", label: "Stories", icon: BookOpen },
  { href: "/tutor", label: "Tutor", icon: MessagesSquare }, { href: "/live", label: "Live", icon: Video }, { href: "/leaderboard", label: "Leagues", icon: Shield }, { href: "/quests", label: "Quests", icon: Target },
  { href: "/vocabulary", label: "Words", icon: NotebookText }, { href: "/profile", label: "Profile", icon: User },
];
const MOBILE = ["/learn", "/practice", "/tutor", "/live", "/leaderboard", "/profile"];

export function StatChips() {
  const { state } = useStore(); const { t, num } = useT(); const now = Date.now(); const c = getCourse(state.profile.courseId);
  const streak = liveStreak(state.streak, now);
  const chip = "flex min-h-11 items-center gap-1 rounded-xl px-2 py-1 hover:bg-mist";
  return (
    <div className="flex items-center justify-between gap-2 text-[15px] font-extrabold">
      <Link href="/settings" className={chip} aria-label={t("Course: {course}. Change course", { course: t(c.targetName) })}><span className="text-2xl" aria-hidden="true">{c.flag}</span></Link>
      <Link href="/quests" className={`${chip} text-sun-dark`} aria-label={t("{n}-day streak", { n: num(streak) })}><Flame className="fill-sun text-sun-edge" size={22} aria-hidden="true" />{num(streak)}</Link>
      <Link href="/quests" className={`${chip} text-sky-dark`} aria-label={t("{n} gems", { n: num(state.gems) })}><Gem className="fill-sky-soft" size={22} aria-hidden="true" />{num(state.gems)}</Link>
      <Link href="/profile" className={`${chip} text-grape-dark`} aria-label={t("{n} total XP", { n: num(state.xp) })}><Zap className="fill-grape-soft" size={22} aria-hidden="true" />{num(state.xp)}</Link>
    </div>
  );
}

function RightRail() {
  const { state, mode, cloudConfigured } = useStore(); const { t, num } = useT(); const now = Date.now();
  const today = todayXp(state, now); const goal = state.profile.dailyGoalXp;
  const quests = state.quests.day === dayKey(now) ? state.quests.items : questsFor(dayKey(now));
  return (
    <aside aria-label={t("Your progress")} className="hidden w-[340px] shrink-0 space-y-5 py-6 pr-6 xl:block">
      <StatChips />
      <Card>
        <div className="mb-2 flex items-center justify-between"><h2 className="text-lg">{t("Daily goal")}</h2><span className="text-sm text-sub">{num(Math.min(today, goal))} / {num(goal)} XP</span></div>
        <ProgressBar value={today / goal} color="bg-sun" label={t("Daily goal")} />
        <p className="mt-2 text-sm text-sub">{today >= goal ? t("Goal reached — anything more is a bonus! 🎉") : t("A few minutes is all it takes.")}</p>
      </Card>
      <Card>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg">{t("Daily quests")}</h2><Link href="/quests" className="text-sm font-extrabold uppercase text-sky-dark">{t("View all")}</Link></div>
        <ul className="space-y-3">{quests.map((q) => (
          <li key={q.id}><div className="mb-1 flex justify-between text-sm"><span>{t(QUEST_LABELS[q.id], { n: q.target })}</span><span className="text-sub">{q.claimed ? "✓" : `${q.progress}/${q.target}`}</span></div><ProgressBar value={q.progress / q.target} color="bg-sky" className="!h-3" label={t(QUEST_LABELS[q.id], { n: q.target })} /></li>
        ))}</ul>
      </Card>
      <Card>
        <div className="flex items-center gap-3"><Trophy className="text-sun-dark" aria-hidden="true" /><div><h2 className="text-lg leading-tight">{t("{league} League", { league: t(leagueFor(state.xp)) })}</h2><p className="text-sm text-sub">{t("{n} XP this week", { n: num(weeklyXp(state, now)) })}</p></div></div>
        <Link href="/leaderboard" className="mt-3 block text-sm font-extrabold uppercase text-sky-dark">{t("See the leaderboard")}</Link>
      </Card>
      {mode === "guest" && (
        <Card className="bg-sky-soft">
          <h2 className="text-lg">{cloudConfigured ? t("Save your progress") : t("Guest mode")}</h2>
          <p className="mt-1 text-sm text-sub">{cloudConfigured ? t("Create a free account to keep your streak on every device.") : t("Progress is saved on this device.")}</p>
          {cloudConfigured && <Link href="/signup" className="mt-3 block text-sm font-extrabold uppercase text-sky-dark">{t("Create a free account")}</Link>}
        </Card>
      )}
    </aside>
  );
}

/** Three-part app frame: left navigation, central content, right rail. Collapses to a top bar + bottom tabs on phones. */
export function AppShell({ children, rail = true }: { children: ReactNode; rail?: boolean }) {
  const path = usePathname(); const router = useRouter(); const { state, ready, syncError } = useStore(); const { t } = useT();
  useEffect(() => { if (ready && !state.profile.onboarded) router.replace("/onboarding"); }, [ready, state.profile.onboarded, router]);
  useEffect(() => { document.documentElement.dataset.motion = state.profile.motion ? "on" : "off"; }, [state.profile.motion]);
  if (!ready || !state.profile.onboarded) return <Loading text={t("Loading…")} />;
  const nav = state.profile.role === "learner" ? NAV : [...NAV, { href: "/admin", label: "Admin", icon: Wrench }];
  return (
    <div className="mx-auto flex min-h-dvh max-w-[1360px]">
      <a href="#main" className="sr-only-focusable fixed left-3 top-3 z-50 rounded-xl bg-ink px-4 py-2 font-bold text-white">{t("Skip to content")}</a>
      <nav aria-label={t("Main")} className="sticky top-0 hidden h-dvh w-[88px] shrink-0 flex-col gap-1 overflow-y-auto border-r-2 border-line px-3 py-6 md:flex lg:w-[240px]">
        <Link href="/learn" className="mb-5 px-3" aria-label="Speakara"><span className="hidden lg:inline"><Logo /></span><span className="lg:hidden"><Logo size={36} iconOnly /></span></Link>
        {nav.map(({ href, label, icon: Icon }) => {
          const on = path.startsWith(href);
          return <Link key={href} href={href} aria-current={on ? "page" : undefined} aria-label={t(label)} className={`flex items-center gap-4 rounded-xl border-2 px-3 py-2.5 text-[15px] font-extrabold uppercase tracking-wide ${on ? "border-sky bg-sky-soft text-sky-dark" : "border-transparent text-sub hover:bg-mist"}`}><Icon size={26} strokeWidth={2.4} aria-hidden="true" /><span className="hidden lg:inline">{t(label)}</span></Link>;
        })}
      </nav>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b-2 border-line bg-paper px-4 py-1.5 xl:hidden"><StatChips /></header>
        {syncError && <div role="alert" className="flex items-center gap-2 bg-coral-soft px-4 py-2 text-sm text-coral-dark"><CloudOff size={16} aria-hidden="true" />{t("Couldn’t sync with the server:")} {t(syncError)}</div>}
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[640px] flex-1 px-4 pb-28 pt-6 outline-none md:pb-12 md:pt-8">{children}</main>
      </div>
      {rail && <RightRail />}
      <nav aria-label={t("Main")} className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t-2 border-line bg-paper px-1 pb-[max(6px,env(safe-area-inset-bottom))] pt-1.5 md:hidden">
        {NAV.filter((n) => MOBILE.includes(n.href)).map(({ href, label, icon: Icon }) => {
          const on = path.startsWith(href);
          return <Link key={href} href={href} aria-current={on ? "page" : undefined} className={`flex min-h-12 min-w-14 flex-col items-center justify-center rounded-xl border-2 px-2 text-[11px] font-extrabold ${on ? "border-sky bg-sky-soft text-sky-dark" : "border-transparent text-sub"}`}><Icon size={24} strokeWidth={2.4} aria-hidden="true" />{t(label)}</Link>;
        })}
      </nav>
    </div>
  );
}
export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return <div className="mb-6"><h1 className="text-2xl">{title}</h1>{sub && <p className="mt-1 text-sub">{sub}</p>}</div>;
}
