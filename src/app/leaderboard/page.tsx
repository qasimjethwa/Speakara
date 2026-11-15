"use client";
import { useEffect, useState } from "react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Notice } from "@/components/ui";
import { useStore } from "@/lib/state/store";
import { supabase } from "@/lib/supabase";
import { LEAGUES, leagueFor, practiceBots, weekKey, weeklyXp } from "@/lib/engine/gamification";
import { useT } from "@/lib/i18n";

interface Row { name: string; xp: number; me?: boolean; bot?: boolean }
export default function Leaderboard() {
  const { state, mode, userId, ready } = useStore(); const { t, num } = useT(); const now = Date.now(); const mine = weeklyXp(state, now);
  const [rows, setRows] = useState<Row[] | null>(null); const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!ready) return;
    const me: Row = { name: state.profile.name || "You", xp: mine, me: true };
    const db = supabase();
    if (mode === "cloud" && db) {
      setRows(null);
      db.rpc("weekly_leaderboard", { max_rows: 30 }).then(({ data, error }) => {
        if (error) { setErr(error.message); setRows([me]); return; }
        const list = (data as { user_id: string; display_name: string; weekly_xp: number }[]).map((r) => ({ name: r.display_name, xp: r.weekly_xp, me: r.user_id === userId }));
        setRows(list.some((r) => r.me) ? list : [...list, me].sort((a, b) => b.xp - a.xp));
      });
    } else setRows([...practiceBots(weekKey(now), now), me].sort((a, b) => b.xp - a.xp));
  }, [ready, mode, userId, mine]); // eslint-disable-line react-hooks/exhaustive-deps
  const league = leagueFor(state.xp);
  return (
    <AppShell>
      <PageTitle title={t("{league} League", { league: t(league) })} sub={t("Weekly XP, reset every Monday. Leagues are for fun — nothing is ever locked behind them.")} />
      <ol className="mb-5 flex justify-between" aria-label={t("League tiers")}>{LEAGUES.map((l) => <li key={l} aria-current={l === league ? "true" : undefined} className={`rounded-xl px-2 py-1 text-xs font-extrabold uppercase sm:text-sm ${l === league ? "bg-sun text-ink" : "text-sub"}`}>{t(l)}</li>)}</ol>
      {mode === "guest" && <div className="mb-4"><Notice tone="warn">{t("You’re in guest mode, so this board shows practice bots, not real learners. Log in to join real weekly leagues.")}</Notice></div>}
      {err && <div className="mb-4"><Notice tone="error">{t("Couldn’t load the leaderboard.")} {err}</Notice></div>}
      <ol className="divide-y-2 divide-line rounded-2xl border-2 border-line">
        {(rows ?? []).map((r, i) => (
          <li key={`${r.name}-${i}`} className={`flex items-center gap-4 p-3 ${r.me ? "bg-brand-soft" : ""}`}>
            <span className={`w-7 text-center text-lg font-extrabold ${i === 0 ? "text-sun-dark" : i < 3 ? "text-sky-dark" : "text-sub"}`}>{num(i + 1)}</span>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mist text-lg font-extrabold" aria-hidden="true">{r.bot ? "🤖" : r.name.slice(0, 1).toUpperCase()}</span>
            <span className="min-w-0 flex-1 truncate font-extrabold">{r.name}{r.me && ` (${t("you")})`}{r.bot && <span className="ml-2 text-xs font-bold text-sub">{t("practice bot")}</span>}</span>
            <span className="text-sub">{num(r.xp)} XP</span>
          </li>
        ))}
        {rows === null && <li className="p-5 text-center text-sub" role="status">{t("Loading…")}</li>}
        {rows?.length === 1 && mode === "cloud" && <li className="p-5 text-center text-sub">{t("No one else has earned XP this week yet. You’re first!")}</li>}
      </ol>
    </AppShell>
  );
}
