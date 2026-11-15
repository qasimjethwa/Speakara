"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Settings, UserPlus, UserMinus, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Field, Notice, ProgressBar } from "@/components/ui";
import { useStore } from "@/lib/state/store";
import { supabase } from "@/lib/supabase";
import { allLessons, getCourse, lessonKey } from "@/lib/content";
import { ACHIEVEMENTS, dayKey, leagueFor, liveStreak } from "@/lib/engine/gamification";
import { strength } from "@/lib/engine/srs";
import { useT } from "@/lib/i18n";

interface Person { id: string; username: string; display_name: string; xp: number; streak_count: number; following?: boolean }
interface FriendQuest { friend_id: string; display_name: string; combined_xp: number; target: number; claimed: boolean }
function Friends() {
  const { mode, cloudConfigured, claimFriendQuest } = useStore(); const { t, num } = useT(); const db = supabase();
  const [friends, setFriends] = useState<Person[]>([]); const [suggested, setSuggested] = useState<Person[]>([]); const [quests, setQuests] = useState<FriendQuest[]>([]);
  const [q, setQ] = useState(""); const [found, setFound] = useState<Person[] | null>(null); const [err, setErr] = useState<string | null>(null);
  const load = async () => {
    if (!db) return;
    const [a, b, c] = await Promise.all([db.rpc("my_friends"), db.rpc("suggested_learners"), db.rpc("friend_quests")]);
    const e = a.error ?? b.error ?? c.error; if (e) { setErr(e.message); return; }
    setFriends((a.data ?? []) as Person[]); setSuggested((b.data ?? []) as Person[]); setQuests((c.data ?? []) as FriendQuest[]);
  };
  useEffect(() => { if (mode === "cloud") void load(); }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps
  if (mode !== "cloud" || !db) return <Card><h2 className="text-lg">{t("Friends")}</h2><p className="mt-1 text-sm text-sub">{cloudConfigured ? t("Log in to follow friends and compare progress.") : t("Friends need an account, and this site isn’t connected to an account server.")}</p>{cloudConfigured && <Link href="/signup" className="mt-2 block text-sm font-extrabold uppercase text-sky-dark">{t("Create a free account")}</Link>}</Card>;
  const search = async (e: React.FormEvent) => { e.preventDefault(); setErr(null); const { data, error } = await db.rpc("find_profiles", { q: q.trim().toLowerCase() }); if (error) setErr(error.message); else setFound((data ?? []) as Person[]); };
  const follow = async (p: Person, on: boolean) => {
    const { data: u } = await db.auth.getUser(); if (!u.user) return;
    const { error } = on ? await db.from("follows").insert({ follower_id: u.user.id, followee_id: p.id }) : await db.from("follows").delete().eq("follower_id", u.user.id).eq("followee_id", p.id);
    if (error) setErr(error.message); else { await load(); setFound((f) => f?.map((x) => (x.id === p.id ? { ...x, following: on } : x)) ?? null); }
  };
  const row = (p: Person, following: boolean) => (
    <li key={p.id} className="flex items-center gap-3 p-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mist font-extrabold" aria-hidden="true">{p.display_name.slice(0, 1).toUpperCase()}</span>
      <span className="min-w-0 flex-1"><span className="block truncate font-extrabold">{p.display_name}</span><span className="block truncate text-sm text-sub">@{p.username} · {num(p.xp)} XP · 🔥 {num(p.streak_count)}</span></span>
      <button onClick={() => follow(p, !following)} aria-label={following ? t("Unfollow {name}", { name: p.display_name }) : t("Follow {name}", { name: p.display_name })} className={`grid h-11 w-11 place-items-center rounded-xl border-2 ${following ? "border-line-dark text-sub" : "border-sky-dark text-sky-dark"}`}>{following ? <UserMinus size={18} /> : <UserPlus size={18} />}</button></li>
  );
  return (
    <Card>
      <h2 className="text-lg">{t("Friends")}</h2>
      <form onSubmit={search} className="mt-3 flex items-end gap-2"><div className="flex-1"><Field label={t("Find by username")} value={q} onChange={(e) => setQ(e.target.value)} maxLength={20} autoCapitalize="off" /></div><Button type="submit" variant="sky" disabled={q.trim().length < 2}>{t("Search")}</Button></form>
      {err && <div className="mt-2"><Notice tone="error">{err}</Notice></div>}
      {found && <ul className="mt-3 divide-y-2 divide-line rounded-2xl border-2 border-line">{found.length ? found.map((p) => row(p, !!p.following)) : <li className="p-3 text-sub">{t("No learner with that username.")}</li>}</ul>}
      {quests.length > 0 && <><h3 className="mb-2 mt-5 flex items-center gap-2 font-extrabold"><Users size={18} aria-hidden="true" />{t("Friends quests")}</h3><ul className="space-y-3">{quests.map((fq) => (
        <li key={fq.friend_id} className="rounded-2xl border-2 border-line p-3"><p className="mb-1 flex justify-between text-sm"><span>{t("Earn {n} XP together with {name} this week", { n: fq.target, name: fq.display_name })}</span><span className="text-sub">{num(Math.min(fq.combined_xp, fq.target))}/{num(fq.target)}</span></p>
          <ProgressBar value={fq.combined_xp / fq.target} color="bg-grape" label={t("Friends quests")} />
          {fq.claimed ? <p className="mt-2 text-sm font-bold text-brand-dark">{t("Reward claimed")} ✓</p> : fq.combined_xp >= fq.target && <Button variant="sun" className="mt-2 !min-h-10 !text-sm" onClick={async () => { const e = await claimFriendQuest(fq.friend_id); if (e) setErr(e); await load(); }}>{t("Claim 20 gems")}</Button>}</li>))}</ul></>}
      <h3 className="mb-2 mt-5 font-extrabold">{t("Following")} · {friends.length}</h3>
      {friends.length ? <ul className="divide-y-2 divide-line rounded-2xl border-2 border-line">{friends.map((p) => row(p, true))}</ul> : <p className="text-sm text-sub">{t("Follow a friend to see their XP and streak here. When you follow each other you get a weekly friends quest.")}</p>}
      {suggested.length > 0 && <><h3 className="mb-2 mt-5 font-extrabold">{t("Learners you could follow")}</h3><ul className="divide-y-2 divide-line rounded-2xl border-2 border-line">{suggested.map((p) => row(p, false))}</ul></>}
    </Card>
  );
}

export default function Profile() {
  const { state, mode, email } = useStore(); const { t, num, date } = useT(); const now = Date.now(); const course = getCourse(state.profile.courseId);
  const lessons = allLessons(course); const done = lessons.filter((x) => state.completed[lessonKey(course.id, x.lesson.id)]);
  const days = Array.from({ length: 7 }, (_, i) => { const at = now - (6 - i) * 86_400_000; const key = dayKey(at); return { label: date(at, { weekday: "short" }), xp: state.xpEvents.filter((e) => dayKey(e.at) === key).reduce((n, e) => n + e.amount, 0) }; });
  const max = Math.max(state.profile.dailyGoalXp, ...days.map((d) => d.xp));
  const accuracy = done.length ? Math.round((done.reduce((n, x) => n + state.completed[lessonKey(course.id, x.lesson.id)].bestAccuracy, 0) / done.length) * 100) : null;
  const words = Object.entries(state.review).filter(([k]) => k.startsWith(`${course.id}:`)).map(([, v]) => strength(v));
  const stat = (v: string | number, l: string) => <div className="rounded-2xl border-2 border-line p-3"><p className="text-xl font-extrabold">{v}</p><p className="text-sm text-sub">{l}</p></div>;
  return (
    <AppShell>
      <div className="mb-6 flex items-center gap-4">
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-brand text-3xl font-extrabold text-white" aria-hidden="true">{(state.profile.name || "L").slice(0, 1).toUpperCase()}</span>
        <div className="min-w-0 flex-1"><h1 className="truncate text-2xl">{state.profile.name || t("Learner")}</h1><p className="truncate text-sub">{mode === "cloud" ? `@${state.profile.username} · ${email}` : t("Guest · saved on this device")}</p><p className="text-sm text-sub">{t("Joined {date}", { date: date(state.profile.createdAt, { month: "long", year: "numeric" }) })}</p></div>
        <Link href="/settings" aria-label={t("Settings")} className="grid h-11 w-11 place-items-center rounded-xl border-2 border-line-dark text-sub"><Settings /></Link>
      </div>
      <h2 className="mb-3 text-lg">{t("Statistics")}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stat(`🔥 ${num(liveStreak(state.streak, now))}`, t("Day streak"))}{stat(`⚡ ${num(state.xp)}`, t("Total XP"))}{stat(`🏆 ${t(leagueFor(state.xp))}`, t("League"))}
        {stat(`${done.length}/${lessons.length}`, t("Lessons completed"))}{stat(accuracy === null ? "—" : `${accuracy}%`, t("Best-attempt accuracy"))}{stat(t("{n} min", { n: num(state.stats.minutes) }), t("Time learning"))}
      </div>
      <Card className="my-5">
        <h2 className="mb-4 text-lg">{t("XP this week")}</h2>
        <div className="flex h-36 items-end gap-2" role="img" aria-label={`${t("XP this week")}: ${days.map((d) => `${d.label} ${d.xp}`).join(", ")}`}>
          {days.map((d, i) => <div key={i} className="flex flex-1 flex-col items-center gap-1"><span className="text-xs text-sub">{d.xp || ""}</span><div className={`w-full rounded-t-lg ${d.xp >= state.profile.dailyGoalXp ? "bg-brand" : "bg-sky"}`} style={{ height: `${Math.max(4, (d.xp / max) * 100)}px` }} /><span className="text-xs font-bold text-sub">{d.label}</span></div>)}
        </div>
        <p className="mt-3 text-sm text-sub">{t("Green bars are days you reached your daily goal.")}</p>
      </Card>
      <Card className="mb-5">
        <h2 className="mb-3 text-lg">{t("Word strength")}</h2>
        {words.length === 0 ? <p className="text-sm text-sub">{t("Your notebook fills up as you learn.")}</p> : <ul className="space-y-2">{[[4, "Mastered"], [3, "Strong"], [2, "Growing"], [1, "New"], [0, "Needs review"]].map(([lvl, label]) => { const n = words.filter((w) => w === lvl).length; return (
          <li key={lvl} className="flex items-center gap-3 text-sm"><span className="w-28 shrink-0 font-bold">{t(label as string)}</span><ProgressBar value={n / words.length} color={lvl === 0 ? "bg-coral" : "bg-brand"} className="!h-3" label={t(label as string)} /><span className="w-8 text-right text-sub">{n}</span></li>); })}</ul>}
      </Card>
      <Card className="mb-5"><div className="flex items-center justify-between"><h2 className="text-lg">{t("Achievements")}</h2><Link href="/quests" className="text-sm font-extrabold uppercase text-sky-dark">{t("View all")}</Link></div>
        <ul className="mt-3 flex flex-wrap gap-2">{ACHIEVEMENTS.filter((a) => state.achievements[a.id]).map((a) => <li key={a.id} className="rounded-xl bg-sun-soft px-3 py-2 text-sm font-extrabold text-sun-dark">{a.icon} {t(a.title)}</li>)}{Object.keys(state.achievements).length === 0 && <li className="text-sm text-sub">{t("Finish a lesson to earn your first badge.")}</li>}</ul></Card>
      <Friends />
    </AppShell>
  );
}
