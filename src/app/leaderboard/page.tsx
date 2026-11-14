"use client";
import { useEffect, useState } from "react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { useStore } from "@/lib/state/store";
import { supabase } from "@/lib/supabase";
import { LEAGUES, leagueFor, practiceBots, weekKey, weeklyXp } from "@/lib/engine/gamification";

interface Row { name: string; xp: number; me?: boolean; bot?: boolean }
export default function Leaderboard() {
  const { state, mode, userId } = useStore(); const now = Date.now(); const mine = weeklyXp(state, now);
  const [rows, setRows] = useState<Row[] | null>(null); const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    const me: Row = { name: state.profile.name || "You", xp: mine, me: true };
    const db = supabase();
    if (mode === "cloud" && db) {
      db.rpc("weekly_leaderboard", { max_rows: 30 }).then(({ data, error }) => {
        if (error) { setErr(error.message); setRows([me]); return; }
        const list = (data as { user_id: string; display_name: string; weekly_xp: number }[]).map((r) => ({ name: r.display_name, xp: r.weekly_xp, me: r.user_id === userId }));
        setRows(list.some((r) => r.me) ? list : [...list, me].sort((a, b) => b.xp - a.xp));
      });
    } else setRows([...practiceBots(weekKey(now), now), me].sort((a, b) => b.xp - a.xp));
  }, [mode, userId, mine]); // eslint-disable-line react-hooks/exhaustive-deps
  const league = leagueFor(state.xp);
  return (
    <AppShell>
      <PageTitle title={`${league} League`} sub="Weekly XP, reset every Monday. Leagues are for fun — nothing is ever locked behind them." />
      <ol className="mb-5 flex justify-between" aria-label="League tiers">{LEAGUES.map((l) => <li key={l} className={`rounded-xl px-2 py-1 text-xs font-extrabold uppercase sm:text-sm ${l === league ? "bg-sun text-ink" : "text-sub"}`}>{l}</li>)}</ol>
      {mode === "guest" && <p className="mb-4 rounded-2xl bg-sun-soft p-3 text-sm">You’re in guest mode, so this board shows <strong>practice bots</strong>, not real learners. Sign in on a connected deployment to join real weekly leagues.</p>}
      {err && <p role="alert" className="mb-4 rounded-2xl bg-coral-soft p-3 text-sm text-coral-dark">Couldn’t load the leaderboard: {err}</p>}
      <ol className="divide-y-2 divide-line rounded-2xl border-2 border-line">
        {(rows ?? []).map((r, i) => (
          <li key={`${r.name}-${i}`} className={`flex items-center gap-4 p-3 ${r.me ? "bg-brand-soft" : ""}`}>
            <span className={`w-7 text-center text-lg font-extrabold ${i === 0 ? "text-sun-dark" : i < 3 ? "text-sky-dark" : "text-sub"}`}>{i + 1}</span>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-mist text-lg font-extrabold" aria-hidden="true">{r.bot ? "🤖" : r.name.slice(0, 1).toUpperCase()}</span>
            <span className="flex-1 font-extrabold">{r.name}{r.me && " (you)"}{r.bot && <span className="ml-2 text-xs font-bold text-sub">practice bot</span>}</span>
            <span className="text-sub">{r.xp} XP</span>
          </li>
        ))}
        {rows === null && <li className="p-5 text-center text-sub">Loading…</li>}
      </ol>
    </AppShell>
  );
}
