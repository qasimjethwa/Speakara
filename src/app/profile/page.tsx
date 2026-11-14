"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Settings, UserPlus, UserMinus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Field } from "@/components/ui";
import { useStore } from "@/lib/state/store";
import { supabase } from "@/lib/supabase";
import { allLessons, getCourse, lessonKey } from "@/lib/content";
import { ACHIEVEMENTS, dayKey, leagueFor, liveStreak } from "@/lib/engine/gamification";

interface Person { id: string; username: string; display_name: string; xp: number; streak_count: number; following?: boolean }
function Friends() {
  const { mode, cloudConfigured } = useStore(); const db = supabase();
  const [friends, setFriends] = useState<Person[]>([]); const [q, setQ] = useState(""); const [found, setFound] = useState<Person[] | null>(null); const [err, setErr] = useState<string | null>(null);
  const load = () => db?.rpc("my_friends").then(({ data, error }) => (error ? setErr(error.message) : setFriends((data ?? []) as Person[])));
  useEffect(() => { if (mode === "cloud") void load(); }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps
  if (mode !== "cloud" || !db) return <Card><h2 className="text-lg">Friends</h2><p className="mt-1 text-sm text-sub">{cloudConfigured ? "Log in to follow friends and compare progress." : "Friends need accounts, which switch on when this deployment is connected to Supabase."}</p>{cloudConfigured && <Link href="/signup" className="mt-2 block text-sm font-extrabold uppercase text-sky">Create a free account</Link>}</Card>;
  const search = async (e: React.FormEvent) => { e.preventDefault(); setErr(null); const { data, error } = await db.rpc("find_profiles", { q: q.trim().toLowerCase() }); if (error) setErr(error.message); else setFound((data ?? []) as Person[]); };
  const follow = async (p: Person, on: boolean) => {
    const { data: u } = await db.auth.getUser(); if (!u.user) return;
    const { error } = on ? await db.from("follows").insert({ follower_id: u.user.id, followee_id: p.id }) : await db.from("follows").delete().eq("follower_id", u.user.id).eq("followee_id", p.id);
    if (error) setErr(error.message); else { await load(); setFound((f) => f?.map((x) => (x.id === p.id ? { ...x, following: on } : x)) ?? null); }
  };
  const row = (p: Person, following: boolean) => (
    <li key={p.id} className="flex items-center gap-3 p-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-mist font-extrabold" aria-hidden="true">{p.display_name.slice(0, 1).toUpperCase()}</span>
      <span className="flex-1"><span className="block font-extrabold">{p.display_name}</span><span className="block text-sm text-sub">@{p.username} · {p.xp} XP · 🔥 {p.streak_count}</span></span>
      <button onClick={() => follow(p, !following)} aria-label={following ? `Unfollow ${p.display_name}` : `Follow ${p.display_name}`} className={`rounded-xl border-2 p-2 ${following ? "border-line text-sub" : "border-sky text-sky"}`}>{following ? <UserMinus size={18} /> : <UserPlus size={18} />}</button></li>
  );
  return (
    <Card>
      <h2 className="text-lg">Friends</h2>
      <form onSubmit={search} className="mt-3 flex items-end gap-2"><div className="flex-1"><Field label="Find by username" value={q} onChange={(e) => setQ(e.target.value)} maxLength={20} /></div><Button type="submit" variant="sky" disabled={q.trim().length < 2}>Search</Button></form>
      {err && <p role="alert" className="mt-2 text-sm text-coral-dark">{err}</p>}
      {found && <ul className="mt-3 divide-y-2 divide-line rounded-2xl border-2 border-line">{found.length ? found.map((p) => row(p, !!p.following)) : <li className="p-3 text-sub">No learner with that username.</li>}</ul>}
      <h3 className="mb-2 mt-5 font-extrabold">Following · {friends.length}</h3>
      {friends.length ? <ul className="divide-y-2 divide-line rounded-2xl border-2 border-line">{friends.map((p) => row(p, true))}</ul> : <p className="text-sm text-sub">Follow a friend to see their XP and streak here.</p>}
    </Card>
  );
}

export default function Profile() {
  const { state, mode, email } = useStore(); const now = Date.now(); const course = getCourse(state.profile.courseId);
  const lessons = allLessons(course); const done = lessons.filter((x) => state.completed[lessonKey(course.id, x.lesson.id)]).length;
  const days = Array.from({ length: 7 }, (_, i) => { const t = now - (6 - i) * 86_400_000; const key = dayKey(t); return { label: new Date(t).toLocaleDateString(undefined, { weekday: "short" }), xp: state.xpEvents.filter((e) => dayKey(e.at) === key).reduce((n, e) => n + e.amount, 0) }; });
  const max = Math.max(state.profile.dailyGoalXp, ...days.map((d) => d.xp));
  const stat = (v: string | number, l: string) => <div className="rounded-2xl border-2 border-line p-3"><p className="text-xl font-extrabold">{v}</p><p className="text-sm text-sub">{l}</p></div>;
  return (
    <AppShell>
      <div className="mb-5 flex items-center gap-4">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-brand text-3xl font-extrabold text-white" aria-hidden="true">{(state.profile.name || "L").slice(0, 1).toUpperCase()}</span>
        <div className="flex-1"><h1 className="text-2xl">{state.profile.name || "Learner"}</h1><p className="text-sub">{mode === "cloud" ? `@${state.profile.username} · ${email}` : "Guest · saved on this device"}</p><p className="text-sm text-sub">Joined {new Date(state.profile.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p></div>
        <Link href="/settings" aria-label="Settings" className="rounded-xl border-2 border-line p-2 text-sub"><Settings /></Link>
      </div>
      <h2 className="mb-3 text-lg">Statistics</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stat(`🔥 ${liveStreak(state.streak, now)}`, "Day streak")}{stat(`⚡ ${state.xp}`, "Total XP")}{stat(`🏆 ${leagueFor(state.xp)}`, "League")}
        {stat(`${done}/${lessons.length}`, `${course.targetName} lessons`)}{stat(Object.keys(state.review).length, "Words met")}{stat(`${state.stats.minutes} min`, "Time learning")}
      </div>
      <Card className="my-5">
        <h2 className="mb-4 text-lg">XP this week</h2>
        <div className="flex h-36 items-end gap-2" role="img" aria-label={`XP over the last 7 days: ${days.map((d) => `${d.label} ${d.xp}`).join(", ")}`}>
          {days.map((d, i) => <div key={i} className="flex flex-1 flex-col items-center gap-1"><span className="text-xs text-sub">{d.xp || ""}</span><div className={`w-full rounded-t-lg ${d.xp >= state.profile.dailyGoalXp ? "bg-brand" : "bg-sky"}`} style={{ height: `${Math.max(4, (d.xp / max) * 100)}px` }} /><span className="text-xs font-bold text-sub">{d.label}</span></div>)}
        </div>
        <p className="mt-3 text-sm text-sub">Green bars are days you reached your {state.profile.dailyGoalXp} XP goal.</p>
      </Card>
      <Card className="mb-5"><div className="flex items-center justify-between"><h2 className="text-lg">Achievements</h2><Link href="/quests" className="text-sm font-extrabold uppercase text-sky">View all</Link></div>
        <ul className="mt-3 flex flex-wrap gap-2">{ACHIEVEMENTS.filter((a) => state.achievements[a.id]).map((a) => <li key={a.id} title={a.description} className="rounded-xl bg-sun-soft px-3 py-2 text-sm font-extrabold">{a.icon} {a.title}</li>)}{Object.keys(state.achievements).length === 0 && <li className="text-sm text-sub">Finish a lesson to earn your first badge.</li>}</ul></Card>
      <Friends />
    </AppShell>
  );
}
