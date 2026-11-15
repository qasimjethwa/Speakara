"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Button, Card, Field, Loading, Notice } from "@/components/ui";
import { useStore } from "@/lib/state/store";
import { supabase } from "@/lib/supabase";

interface Overview { learners: number; onboarded: number; active_7d: number; sessions_7d: number; xp_7d: number; tutor_conversations: number; open_suggestions: number;
  by_day: { day: string; sessions: number; signups: number }[]; by_course: { course: string; learners: number }[]; top_lessons: { lesson: string; course: string; learners: number; accuracy: number }[] }
interface UserRow { id: string; username: string; display_name: string; role: string; xp: number; streak_count: number; course_id: string; created_at: string; last_active: string | null }

/** Staff area (English only). Every number comes from admin-only database functions; nothing here is sample data. */
export default function Admin() {
  const { state, mode, userId } = useStore(); const db = supabase();
  const [o, setO] = useState<Overview | null>(null); const [users, setUsers] = useState<UserRow[] | null>(null); const [q, setQ] = useState(""); const [err, setErr] = useState<string | null>(null);
  const admin = state.profile.role === "admin";
  const loadUsers = async (query = q) => { const { data, error } = await db!.rpc("admin_users", { q: query.trim(), max_rows: 50 }); if (error) setErr(error.message); else setUsers(data as UserRow[]); };
  useEffect(() => { if (!db || !admin) return; db.rpc("admin_overview").then(({ data, error }) => (error ? setErr(error.message) : setO(data as Overview))); void loadUsers(""); }, [admin]); // eslint-disable-line react-hooks/exhaustive-deps
  const setRole = async (u: UserRow, role: string) => { const { error } = await db!.rpc("admin_set_role", { target: u.id, new_role: role }); if (error) setErr(error.message); else void loadUsers(); };
  const maxDay = Math.max(1, ...(o?.by_day.map((d) => d.sessions) ?? [1]));
  return (
    <AppShell rail={false}>
      <PageTitle title="Admin" sub="Analytics, learners and content review." />
      {mode !== "cloud" || state.profile.role === "learner" ? <Notice tone="warn">This area is for Speakara staff. Log in with an editor or admin account.</Notice> : <>
        {err && <div className="mb-4"><Notice tone="error">{err}</Notice></div>}
        <div className="mb-5 flex flex-wrap gap-3"><Link href="/admin/content" className="key rounded-2xl border-2 border-b-4 border-line-dark px-4 py-3 font-extrabold">Content review{o ? ` · ${o.open_suggestions} open` : ""}</Link></div>
        {!admin ? <Notice>Editors can review content. Analytics and learner management need the admin role.</Notice> : !o ? <Loading /> : <>
          <h2 className="mb-3 text-lg">Last 7 days</h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[["Learners", o.learners], ["Finished onboarding", o.onboarded], ["Active learners", o.active_7d], ["Sessions", o.sessions_7d], ["XP earned", o.xp_7d], ["Tutor conversations (all time)", o.tutor_conversations]].map(([l, v]) => <div key={l} className="rounded-2xl border-2 border-line p-3"><dd className="text-xl font-extrabold">{v}</dd><dt className="text-sm text-sub">{l}</dt></div>)}</dl>
          <Card className="my-5"><h2 className="mb-4 text-lg">Sessions per day (14 days)</h2>
            <table className="sr-only"><caption>Sessions and sign-ups per day</caption><thead><tr><th>Day</th><th>Sessions</th><th>Sign-ups</th></tr></thead><tbody>{o.by_day.map((d) => <tr key={d.day}><td>{d.day}</td><td>{d.sessions}</td><td>{d.signups}</td></tr>)}</tbody></table>
            <div className="flex h-32 items-end gap-1" aria-hidden="true">{o.by_day.map((d) => <div key={d.day} title={`${d.day}: ${d.sessions} sessions, ${d.signups} sign-ups`} className="flex-1 rounded-t bg-sky" style={{ height: `${Math.max(3, (d.sessions / maxDay) * 100)}%` }} />)}</div></Card>
          <div className="grid gap-5 sm:grid-cols-2">
            <Card><h2 className="mb-2 text-lg">Learners by course</h2>{o.by_course.length ? <ul className="space-y-1 text-sm">{o.by_course.map((c) => <li key={c.course} className="flex justify-between"><span>{c.course}</span><strong>{c.learners}</strong></li>)}</ul> : <p className="text-sm text-sub">No onboarded learners yet.</p>}</Card>
            <Card><h2 className="mb-2 text-lg">Most-completed lessons</h2>{o.top_lessons.length ? <ul className="space-y-1 text-sm">{o.top_lessons.map((l) => <li key={l.course + l.lesson} className="flex justify-between gap-2"><span>{l.course} · {l.lesson}</span><span><strong>{l.learners}</strong> · {Math.round(l.accuracy * 100)}%</span></li>)}</ul> : <p className="text-sm text-sub">No completed lessons yet.</p>}</Card>
          </div>
          <h2 className="mb-3 mt-8 text-lg">Learners</h2>
          <form onSubmit={(e) => { e.preventDefault(); void loadUsers(); }} className="mb-3 flex items-end gap-2"><div className="flex-1"><Field label="Search by username or name" value={q} onChange={(e) => setQ(e.target.value)} /></div><Button type="submit" variant="sky">Search</Button></form>
          <div className="overflow-x-auto rounded-2xl border-2 border-line"><table className="w-full text-left text-sm"><caption className="sr-only">Learners</caption>
            <thead className="bg-mist text-sub"><tr><th scope="col" className="p-2">Learner</th><th scope="col" className="p-2">XP</th><th scope="col" className="p-2">Course</th><th scope="col" className="p-2">Last active</th><th scope="col" className="p-2">Role</th></tr></thead>
            <tbody>{(users ?? []).map((u) => <tr key={u.id} className="border-t-2 border-line"><td className="p-2"><strong>{u.display_name}</strong><br /><span className="text-sub">@{u.username}</span></td><td className="p-2">{u.xp}</td><td className="p-2">{u.course_id}</td><td className="p-2">{u.last_active ? new Date(u.last_active).toLocaleDateString() : "—"}</td>
              <td className="p-2"><select aria-label={`Role for ${u.display_name}`} value={u.role} disabled={u.id === userId} onChange={(e) => setRole(u, e.target.value)} className="rounded-lg border-2 border-line-dark bg-paper px-2 py-1 font-bold"><option value="learner">learner</option><option value="editor">editor</option><option value="admin">admin</option></select></td></tr>)}
              {users?.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-sub">No learners match.</td></tr>}</tbody></table></div>
          <p className="mt-2 text-sm text-sub">Emails and passwords are managed in the Supabase dashboard and are deliberately not shown here.</p>
        </>}
      </>}
    </AppShell>
  );
}
