"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Brain, ChevronRight, Pencil, Power, RotateCcw, ShieldCheck, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CompanionCoach } from "@/components/twin/CompanionCoach";
import { Button, Notice } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { band, SKILL_LABEL, type SkillEstimate } from "@/lib/twin/model";
import { deleteAiMemory, deleteHistory, resetPrefs, saveBrief, savePrefs, setPersonalisation } from "@/lib/twin/store";
import { useTwinView } from "@/lib/twin/view";

const BAND_LABEL = { strength: /*i18n*/ "Strength", steady: /*i18n*/ "Steady", "needs work": /*i18n*/ "Needs practice", unknown: /*i18n*/ "Not enough data" } as const;
const BAND_COLOR = { strength: "var(--color-brand)", steady: "var(--color-sky)", "needs work": "var(--color-sun-edge)", unknown: "var(--color-line-dark)" } as const;
const BAND_TEXT = { strength: "text-brand-dark", steady: "text-sky-dark", "needs work": "text-sun-dark", unknown: "text-sub" } as const;
const SHORT: Record<string, string> = { grammar: /*i18n*/ "Grammar", speaking: /*i18n*/ "Speaking", isl: /*i18n*/ "ISL" };
const card = "rounded-3xl border border-line bg-paper shadow-[0_1px_2px_rgba(16,24,40,.04),0_8px_24px_-12px_rgba(16,24,40,.12)]";

/** Ring: filled arc = estimate, faint arc = the upper end of its uncertainty range. */
function Ring({ e }: { e: SkillEstimate }) {
  const b = band(e), r = 22, c = 2 * Math.PI * r, none = e.label === "no data";
  return (
    <svg viewBox="0 0 56 56" className="h-14 w-14 shrink-0 -rotate-90" aria-hidden="true">
      <circle cx="28" cy="28" r={r} fill="none" stroke="var(--color-mist)" strokeWidth="6" />
      {!none && <circle cx="28" cy="28" r={r} fill="none" stroke={BAND_COLOR[b]} strokeOpacity=".18" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${c * e.high} ${c}`} />}
      {!none && <circle cx="28" cy="28" r={r} fill="none" stroke={BAND_COLOR[b]} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${c * Math.max(0.02, e.mastery)} ${c}`} />}
    </svg>
  );
}

function SkillTile({ e }: { e: SkillEstimate }) {
  const { t } = useT(); const b = band(e); const none = e.label === "no data";
  const name = t(SHORT[e.skill] ?? SKILL_LABEL[e.skill]);
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-mist/70 p-3" data-skill={e.skill} data-band={b}
      aria-label={none ? `${name}: ${t("Not measured yet")}` : `${name}: ${t(BAND_LABEL[b])}. ${t("Estimated range {lo}–{hi}%", { lo: Math.round(e.low * 100), hi: Math.round(e.high * 100) })}`}>
      <Ring e={e} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-extrabold">{name}</p>
        <p className={`flex items-center gap-1 text-sm font-bold ${BAND_TEXT[b]}`}>{none ? t("Not measured yet") : t(BAND_LABEL[b])}
          {e.trend === "up" && <TrendingUp size={14} className="text-brand" aria-label={t("Improving")} />}
          {e.trend === "down" && <TrendingDown size={14} className="text-coral" aria-label={t("Slipping")} />}</p>
        {!none && <p className="text-xs text-sub" title={t("Measured: {c} of {n} answers right in the last 30 days.", { c: e.recent.correct, n: e.recent.total })}>{e.recent.correct}/{e.recent.total}<span className="sr-only"> — {t("Measured: {c} of {n} answers right in the last 30 days.", { c: e.recent.correct, n: e.recent.total })}</span></p>}
      </div>
    </li>
  );
}

/** Off (default): identity, three plain promises, explicit consent. */
function Consent() {
  const { t } = useT(); const [agree, setAgree] = useState(false);
  return (
    <section aria-labelledby="consent-title" data-testid="twin-status" data-on="false" className={`${card} overflow-hidden`}>
      <div className="bg-gradient-to-br from-brand-soft via-paper to-paper p-6 sm:p-8">
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-paper text-brand shadow-sm ring-1 ring-brand/15"><Brain size={28} aria-hidden="true" /></span>
        <h2 id="consent-title" className="text-2xl sm:text-3xl">{t("Personalised learning is off")}</h2>
        <p className="mt-2 max-w-xl text-sub">{t("Your lessons, XP, gems, streaks and quests work exactly the same either way. Turn this on if you want Speakara to adapt to you.")}</p>
      </div>
      <div className="space-y-5 p-6 pt-2 sm:p-8 sm:pt-2">
        <ul className="grid gap-3 text-sm sm:grid-cols-3">
          {[t("Suggest your next lesson and revision, with the reason for each suggestion."), t("Adjust the AI tutor’s difficulty and conversation suggestions to your progress."), t("Record whether each exercise answer was right or wrong, and which skill it practised.")].map((x) =>
            <li key={x} className="rounded-2xl bg-mist/70 p-3">{x}</li>)}
        </ul>
        <p className="flex items-start gap-2 text-xs text-sub"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />{t("No audio, video or transcripts are stored for this. Other learners never see your results. You can turn it off or delete the history at any time.")}</p>
        <label className="flex min-h-11 items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5 accent-brand" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span className="font-bold">{t("I agree to Speakara using my exercise results to personalise my learning.")}</span></label>
        <Button disabled={!agree} onClick={() => void setPersonalisation(true)} className="w-full sm:w-auto"><Power size={18} aria-hidden="true" />{t("Turn on personalised learning")}</Button>
      </div>
    </section>
  );
}

export default function LearningTwinPage() {
  const { t } = useT(); const v = useTwinView();
  const [confirm, setConfirm] = useState<null | "history" | "prefs" | "memory">(null); const [done, setDone] = useState<string | null>(null);
  useEffect(() => { if (v.userId && v.prefs.companionContext) void saveBrief(v.brief); }, [v.userId, v.prefs.companionContext, v.brief]);
  const est = v.estimates.filter((e) => e.skill !== "isl" || e.label !== "no data");
  const strengths = est.filter((e) => band(e) === "strength"), weak = est.filter((e) => band(e) === "needs work"), improving = est.filter((e) => e.trend === "up");
  const p = v.prefs;
  const run = async (what: NonNullable<typeof confirm>) => {
    if (what === "history") await deleteHistory(); if (what === "prefs") await resetPrefs(); if (what === "memory") await deleteAiMemory();
    setConfirm(null); setDone(what === "history" ? t("Your learning history was deleted.") : what === "prefs" ? t("Your preferences were reset.") : t("The AI companion’s learning memory was deleted."));
  };
  const weekly = Array.from({ length: 6 }, (_, i) => { const end = Date.now() - i * 7 * 86_400_000, start = end - 7 * 86_400_000; const w = v.events.filter((e) => e.at >= start && e.at < end && (e.course === v.course.id || e.skill === "isl")); return { i, n: w.length, c: w.filter((e) => e.correct).length }; }).reverse();
  const max = Math.max(1, ...weekly.map((w) => w.n));

  const answered = v.events.filter((e) => e.course === v.course.id || e.skill === "isl").length;
  const recs = v.recommendations.slice(0, 4); const top = recs[0];
  const tr = (r: NonNullable<typeof top>) => t(r.reason, Object.fromEntries(Object.entries(r.reasonParams ?? {}).map(([k, x]) => [k, typeof x === "string" ? t(x).toLowerCase() : x])));
  const names = (xs: SkillEstimate[]) => xs.map((e) => t(SHORT[e.skill] ?? SKILL_LABEL[e.skill])).join(", ");
  const h2 = "mb-3 text-xs font-extrabold uppercase tracking-[.12em] text-sub";

  return (
    <AppShell>
      <h1 className="sr-only">{t("Personal Learning Twin")}</h1>
      {done && <div className="mb-4"><Notice tone="success">{done}</Notice></div>}
      {v.ready && !p.personalise && <Consent />}

      {p.personalise && <div className="space-y-6">
        {/* identity + next best step */}
        <section data-testid="twin-status" data-on="true" aria-labelledby="consent-title" className={`${card} overflow-hidden`}>
          <div className="bg-gradient-to-br from-brand-soft via-paper to-paper p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="hidden h-14 w-14 shrink-0 place-items-center rounded-2xl bg-paper text-brand shadow-sm ring-1 ring-brand/15 sm:grid"><Brain size={28} aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.12em] text-brand-dark"><span className="h-2 w-2 rounded-full bg-brand-bright" aria-hidden="true" />{t("Personalised learning is on")}</p>
                <h2 id="consent-title" className="mt-1 text-2xl sm:text-3xl">{t("Personal Learning Twin")}</h2>
                <p className="mt-1 text-sm text-sub">{t(v.course.targetName)} · {t("{n} answers", { n: answered })}</p>
              </div>
              <button type="button" onClick={() => void setPersonalisation(false)} aria-label={t("Turn off")} className="-mr-2 -mt-2 flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-2 text-sm font-bold text-sub hover:bg-mist sm:px-3"><Power size={16} aria-hidden="true" /><span className="hidden sm:inline">{t("Turn off")}</span></button>
            </div>
            {(strengths.length > 0 || weak.length > 0 || improving.length > 0) && <dl className="mt-5 flex flex-wrap gap-2 text-sm">
              {strengths.length > 0 && <div className="rounded-full bg-paper px-3 py-1.5 ring-1 ring-line"><dt className="inline text-sub">{t("Strengths")}: </dt><dd className="inline font-extrabold text-brand-dark">{names(strengths)}</dd></div>}
              {weak.length > 0 && <div className="rounded-full bg-paper px-3 py-1.5 ring-1 ring-line"><dt className="inline text-sub">{t("Needs practice")}: </dt><dd className="inline font-extrabold text-sun-dark">{names(weak)}</dd></div>}
              {improving.length > 0 && <div className="rounded-full bg-paper px-3 py-1.5 ring-1 ring-line"><dt className="inline text-sub">{t("Recently improved")}: </dt><dd className="inline font-extrabold">{names(improving)}</dd></div>}
            </dl>}
          </div>
          {top && <div data-testid="next-best-step" className="border-t border-line p-4 sm:p-6">
            <p className={h2}>{t("Your next best step")}</p>
            <Link href={top.href} data-rec={top.id} className="group flex items-center gap-4 rounded-2xl bg-brand p-4 text-white shadow-[0_8px_20px_-10px_rgba(10,133,73,.7)] hover:bg-brand-dark">
              <span className="min-w-0 flex-1"><span className="block text-lg font-extrabold">{t(top.title)}</span><span className="block text-sm text-white">{tr(top)}</span></span>
              <ArrowRight size={22} className="shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            {recs.length > 1 && <ul className="mt-2 divide-y divide-line">{recs.slice(1).map((r) => <li key={r.id}>
              <Link href={r.href} data-rec={r.id} className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-mist">
                <span className="min-w-0 flex-1"><span className="block font-extrabold">{t(r.title)}</span><span className="block truncate text-xs text-sub">{tr(r)}</span></span>
                <ChevronRight size={18} className="shrink-0 text-sub" aria-hidden="true" /></Link></li>)}</ul>}
          </div>}
          {!p.onboarded && <Link href="/profile/learning-twin/setup" className="flex min-h-12 items-center gap-2 border-t border-line px-6 text-sm font-extrabold text-brand-dark hover:bg-mist">{t("Set up my Learning Twin")}<ArrowUpRight size={16} aria-hidden="true" /></Link>}
        </section>

        <CompanionCoach />

        {/* skills */}
        <section aria-labelledby="map-title" className={`${card} p-5 sm:p-6`}>
          <h2 id="map-title" className={h2}>{t("Learning map: {course}", { course: t(v.course.targetName) })}</h2>
          <ul className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:grid-cols-3">{est.map((e) => <SkillTile key={e.skill} e={e} />)}</ul>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section aria-labelledby="time-title" className={`${card} p-5 sm:p-6`}>
            <h2 id="time-title" className={h2}>{t("Progress over time")}</h2>
            <div className="flex h-28 items-end gap-2" role="img" aria-label={t("Answers per week for the last six weeks")}>
              {weekly.map((w) => <div key={w.i} className="flex flex-1 flex-col items-center justify-end gap-1.5">
                <div className="flex w-full max-w-8 flex-col justify-end overflow-hidden rounded-lg bg-mist" style={{ height: `${Math.max(6, (w.n / max) * 88)}px` }}>
                  <div className="bg-coral/30" style={{ height: `${w.n ? ((w.n - w.c) / w.n) * 100 : 0}%` }} /><div className="bg-brand" style={{ height: `${w.n ? (w.c / w.n) * 100 : 0}%` }} /></div>
                <span className="text-[11px] text-sub">{w.c}/{w.n}</span></div>)}
            </div>
          </section>
          <section aria-labelledby="mis-title" className={`${card} p-5 sm:p-6`}>
            <h2 id="mis-title" className={h2}>{t("Repeated mistakes")}</h2>
            {v.mistakes.length ? <ul className="flex flex-wrap gap-2">{v.mistakes.slice(0, 8).map((m) => (
              <li key={m.item} className="rounded-full bg-sun-soft px-3 py-1.5 text-sm"><span className="font-extrabold">{m.label}</span> <span className="text-sun-dark">×{m.misses}</span></li>))}</ul>
              : <p className="text-sm text-sub">{t("No item has been missed twice recently.")}</p>}
          </section>
        </div>

        <section aria-labelledby="you-title" className={`${card} p-5 sm:p-6`}>
          <div className="mb-3 flex items-center"><h2 id="you-title" className={`${h2} mb-0 flex-1`}>{t("What you told us")}</h2><Link href="/profile/learning-twin/setup" className="flex min-h-11 items-center gap-1 text-sm font-extrabold text-brand-dark"><Pencil size={15} aria-hidden="true" />{t("Edit")}</Link></div>
          <dl className="flex flex-wrap gap-2 text-sm">
            {([[t("Goal"), p.goal && t(p.goal)], [t("Your level (self-reported)"), p.selfLevel && t(p.selfLevel)], [t("Teaching style"), p.style && t(p.style)], [t("Difficulty"), p.difficulty && t(p.difficulty)],
              [t("Corrections"), p.correction && t(p.correction)], [t("Interests"), p.interests.length ? p.interests.map((i) => t(i)).join(", ") : ""], [t("Areas you find hard (self-reported)"), p.hardAreas.length ? p.hardAreas.map((x) => t(SHORT[x] ?? SKILL_LABEL[x])).join(", ") : ""],
              [t("Speaking confidence (self-reported)"), p.confidence.speaking ? `${p.confidence.speaking}/5` : ""]] as [string, string | undefined][]).filter(([, x]) => x).map(([k, x]) =>
              <div key={k} className="rounded-xl bg-mist/70 px-3 py-2"><dt className="text-xs text-sub">{k}</dt><dd className="font-extrabold">{x}</dd></div>)}
          </dl>
        </section>
      </div>}

      <section aria-labelledby="priv-title" className="mt-6 space-y-3 px-1">
        <h2 id="priv-title" className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.12em] text-sub"><ShieldCheck size={16} aria-hidden="true" />{t("Privacy and control")}</h2>
        {p.personalise && <label className="flex min-h-11 items-start gap-3 rounded-2xl border border-line p-3"><input type="checkbox" className="mt-1 h-5 w-5 accent-brand" checked={p.companionContext} disabled={!v.userId} onChange={(e) => void savePrefs({ companionContext: e.target.checked })} />
          <span><span className="block font-extrabold">{t("Share a learning summary with the AI companion")}</span><span className="block text-sm text-sub">{v.userId ? t("Sends only your measured strengths and weaker areas, repeated mistakes and stated preferences, so it can adapt. No audio or transcripts.") : t("Sign in to use the AI companion.")}</span>
            {p.companionContext && v.brief.length > 0 && <details className="mt-1 text-sm"><summary className="cursor-pointer font-bold text-brand-dark">{t("See exactly what is shared")}</summary><ul className="mt-1 list-disc pl-5 text-sub">{v.brief.map((b) => <li key={b}>{b}</li>)}</ul></details>}</span></label>}
        <div className="flex flex-wrap gap-1">
          {([["prefs", RotateCcw, t("Reset preferences")], ["history", Trash2, t("Delete learning history")], ...(v.userId ? [["memory", Trash2, t("Delete AI learning memory")]] : [])] as [NonNullable<typeof confirm>, typeof Trash2, string][]).map(([k, I, l]) =>
            <button key={k} type="button" onClick={() => setConfirm(k)} className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-sub hover:bg-mist hover:text-ink"><I size={15} aria-hidden="true" />{l}</button>)}
        </div>
        {confirm && <div role="alertdialog" aria-labelledby="cf-t" className="rounded-2xl border border-coral/40 bg-coral-soft p-4">
          <p id="cf-t" className="mb-3 font-extrabold">{confirm === "history" ? t("Delete all graded answers the Twin has recorded? Your lessons, XP and streak are not affected.") : confirm === "prefs" ? t("Reset everything you told the Twin (goals, interests, preferences)?") : t("Delete what the AI companion remembers about your learning?")}</p>
          <div className="flex gap-2"><Button variant="danger" onClick={() => void run(confirm)}>{confirm === "prefs" ? t("Reset") : t("Delete")}</Button><Button variant="secondary" onClick={() => setConfirm(null)}>{t("Cancel")}</Button></div></div>}
      </section>
    </AppShell>
  );
}
