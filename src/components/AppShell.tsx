"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { BookOpen, Dumbbell, Flame, Gem, Home, MessagesSquare, NotebookText, Shield, Target, Trophy, User, Zap, CloudOff } from "lucide-react";
import { useStore } from "@/lib/state/store";
import { getCourse } from "@/lib/content";
import { liveStreak, todayXp, QUEST_LABELS, questsFor, dayKey, weeklyXp, leagueFor } from "@/lib/engine/gamification";
import { Logo } from "./Mascot";
import { Card, Loading, ProgressBar } from "./ui";

const NAV = [
  { href: "/learn", label: "Learn", icon: Home }, { href: "/practice", label: "Practice", icon: Dumbbell }, { href: "/stories", label: "Stories", icon: BookOpen },
  { href: "/tutor", label: "Tutor", icon: MessagesSquare }, { href: "/leaderboard", label: "Leagues", icon: Shield }, { href: "/quests", label: "Quests", icon: Target },
  { href: "/vocabulary", label: "Words", icon: NotebookText }, { href: "/profile", label: "Profile", icon: User },
];
const MOBILE = ["/learn", "/practice", "/tutor", "/leaderboard", "/profile"];

export function useNow() { return Date.now(); }

export function StatChips() {
  const { state } = useStore(); const now = useNow(); const c = getCourse(state.profile.courseId);
  return (
    <div className="flex items-center justify-between gap-3 text-[15px] font-extrabold">
      <Link href="/settings" className="flex items-center gap-1.5 rounded-xl px-2 py-1 hover:bg-mist" aria-label={`Course: ${c.targetName}. Change course`}><span className="text-2xl">{c.flag}</span></Link>
      <Link href="/quests" className="flex items-center gap-1 rounded-xl px-2 py-1 text-sun-dark hover:bg-mist" aria-label={`${liveStreak(state.streak, now)} day streak`}><Flame className="fill-sun text-sun-dark" size={22} />{liveStreak(state.streak, now)}</Link>
      <Link href="/quests" className="flex items-center gap-1 rounded-xl px-2 py-1 text-sky-dark hover:bg-mist" aria-label={`${state.gems} gems`}><Gem className="fill-sky-soft text-sky" size={22} />{state.gems}</Link>
      <Link href="/profile" className="flex items-center gap-1 rounded-xl px-2 py-1 text-grape-dark hover:bg-mist" aria-label={`${state.xp} total XP`}><Zap className="fill-grape-soft text-grape" size={22} />{state.xp}</Link>
    </div>
  );
}

function RightRail() {
  const { state, mode, cloudConfigured } = useStore(); const now = useNow();
  const today = todayXp(state, now); const goal = state.profile.dailyGoalXp;
  const quests = state.quests.day === dayKey(now) ? state.quests.items : questsFor(dayKey(now));
  return (
    <aside className="hidden w-[340px] shrink-0 space-y-4 py-6 pr-6 xl:block">
      <StatChips />
      <Card>
        <div className="mb-2 flex items-center justify-between"><h2 className="text-lg">Daily goal</h2><span className="text-sm text-sub">{Math.min(today, goal)} / {goal} XP</span></div>
        <ProgressBar value={today / goal} color="bg-sun" label="Daily XP goal" />
        <p className="mt-2 text-sm text-sub">{today >= goal ? "Goal reached — anything more is a bonus! 🎉" : "A few minutes is all it takes."}</p>
      </Card>
      <Card>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg">Daily quests</h2><Link href="/quests" className="text-sm font-extrabold uppercase text-sky">View all</Link></div>
        <ul className="space-y-3">{quests.map((q) => (
          <li key={q.id}><div className="mb-1 flex justify-between text-sm"><span>{QUEST_LABELS[q.id](q.target)}</span><span className="text-sub">{q.claimed ? "✓" : `${q.progress}/${q.target}`}</span></div><ProgressBar value={q.progress / q.target} color="bg-sky" className="!h-3" label={QUEST_LABELS[q.id](q.target)} /></li>
        ))}</ul>
      </Card>
      <Card>
        <div className="flex items-center gap-3"><Trophy className="text-sun-dark" /><div><h2 className="text-lg leading-tight">{leagueFor(state.xp)} League</h2><p className="text-sm text-sub">{weeklyXp(state, now)} XP this week</p></div></div>
        <Link href="/leaderboard" className="mt-3 block text-sm font-extrabold uppercase text-sky">See the leaderboard</Link>
      </Card>
      {mode === "guest" && (
        <Card className="bg-sky-soft/50">
          <h2 className="text-lg">{cloudConfigured ? "Save your progress" : "Guest mode"}</h2>
          <p className="mt-1 text-sm text-sub">{cloudConfigured ? "Create a free account to keep your streak on every device." : "Progress is saved on this device. Accounts switch on when the deployment is connected to Supabase."}</p>
          {cloudConfigured && <Link href="/signup" className="mt-3 block text-sm font-extrabold uppercase text-sky">Create a free account</Link>}
        </Card>
      )}
    </aside>
  );
}

/** Three-part app frame: left navigation, central content, right rail. Collapses to a top bar + bottom tabs on phones. */
export function AppShell({ children, rail = true }: { children: ReactNode; rail?: boolean }) {
  const path = usePathname(); const router = useRouter(); const { state, ready, syncError } = useStore();
  useEffect(() => { if (ready && !state.profile.onboarded) router.replace("/onboarding"); }, [ready, state.profile.onboarded, router]);
  useEffect(() => { document.documentElement.dataset.motion = state.profile.motion ? "on" : "off"; }, [state.profile.motion]);
  if (!ready || !state.profile.onboarded) return <Loading />;
  return (
    <div className="mx-auto flex min-h-dvh max-w-[1360px]">
      <nav aria-label="Main" className="sticky top-0 hidden h-dvh w-[88px] shrink-0 flex-col gap-1 border-r-2 border-line px-3 py-6 md:flex lg:w-[240px]">
        <Link href="/learn" className="mb-5 px-3" aria-label="Speakara home"><span className="hidden lg:inline"><Logo /></span><span className="lg:hidden"><Logo size={36} /></span></Link>
        {NAV.map(({ href, label, icon: Icon }) => {
          const on = path.startsWith(href);
          return <Link key={href} href={href} aria-current={on ? "page" : undefined} className={`flex items-center gap-4 rounded-xl border-2 px-3 py-2.5 text-[15px] font-extrabold uppercase tracking-wide ${on ? "border-sky/40 bg-sky-soft text-sky-dark" : "border-transparent text-sub hover:bg-mist"}`}><Icon size={26} strokeWidth={2.4} /><span className="hidden lg:inline">{label}</span></Link>;
        })}
      </nav>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b-2 border-line bg-paper/95 px-4 py-2 backdrop-blur xl:hidden"><StatChips /></header>
        {syncError && <div role="alert" className="flex items-center gap-2 bg-coral-soft px-4 py-2 text-sm text-coral-dark"><CloudOff size={16} />Couldn’t sync with the server: {syncError}</div>}
        <main className="mx-auto w-full max-w-[640px] flex-1 px-4 pb-28 pt-6 md:pb-10">{children}</main>
      </div>
      {rail && <RightRail />}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t-2 border-line bg-paper px-1 pb-[max(6px,env(safe-area-inset-bottom))] pt-1.5 md:hidden">
        {NAV.filter((n) => MOBILE.includes(n.href)).map(({ href, label, icon: Icon }) => {
          const on = path.startsWith(href);
          return <Link key={href} href={href} aria-current={on ? "page" : undefined} className={`flex min-h-12 min-w-14 flex-col items-center justify-center rounded-xl border-2 px-2 text-[11px] font-extrabold ${on ? "border-sky/40 bg-sky-soft text-sky-dark" : "border-transparent text-sub"}`}><Icon size={24} strokeWidth={2.4} />{label}</Link>;
        })}
      </nav>
    </div>
  );
}
export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return <div className="mb-5"><h1 className="text-2xl">{title}</h1>{sub && <p className="mt-1 text-sub">{sub}</p>}</div>;
}
