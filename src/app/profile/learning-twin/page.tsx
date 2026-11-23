"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Info, Pencil, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { NextBestStep } from "@/components/twin/NextBestStep";
import { Button, Card, Notice } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { band, SKILL_LABEL, type SkillEstimate } from "@/lib/twin/model";
import { deleteAiMemory, deleteHistory, resetPrefs, saveBrief, savePrefs } from "@/lib/twin/store";
import { useTwinView } from "@/lib/twin/view";

const BAND_STYLE = { strength: "bg-brand-soft text-brand-dark", steady: "bg-sky-soft text-sky-dark", "needs work": "bg-sun-soft text-sun-dark", unknown: "bg-mist text-sub" } as const;
const BAND_LABEL = { strength: /*i18n*/ "Strength", steady: /*i18n*/ "Steady", "needs work": /*i18n*/ "Needs practice", unknown: /*i18n*/ "Not enough data" } as const;
const CONF_LABEL = { "no data": /*i18n*/ "Not measured yet", "early estimate": /*i18n*/ "Early estimate", "developing estimate": /*i18n*/ "Developing estimate", "well measured": /*i18n*/ "Well measured" } as const;

function SkillRow({ e }: { e: SkillEstimate }) {
  const { t } = useT(); const b = band(e);
  return (
    <li className="rounded-2xl border-2 border-line p-3" data-skill={e.skill} data-band={b}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex-1 font-extrabold">{t(SKILL_LABEL[e.skill])}</span>
        {e.trend === "up" && <span className="flex items-center gap-1 text-xs font-bold text-brand-dark"><ArrowUp size={14} aria-hidden="true" />{t("Improving")}</span>}
        {e.trend === "down" && <span className="flex items-center gap-1 text-xs font-bold text-coral-dark"><ArrowDown size={14} aria-hidden="true" />{t("Slipping")}</span>}
        <span className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${BAND_STYLE[b]}`}>{t(BAND_LABEL[b])}</span>
      </div>
      {e.label === "no data" ? <p className="mt-1 text-sm text-sub">{t("Not measured yet. Complete exercises of this type to see an estimate.")}</p> : <>
        {/* the bar shows the estimate's uncertainty range, not a single score */}
        <div className="relative mt-2 h-3 rounded-full bg-line" role="img" aria-label={t("Estimated range {lo}–{hi}%", { lo: Math.round(e.low * 100), hi: Math.round(e.high * 100) })}>
          <span className="absolute h-3 rounded-full bg-grape/40" style={{ left: `${e.low * 100}%`, width: `${Math.max(2, (e.high - e.low) * 100)}%` }} />
          <span className="absolute top-[-2px] h-4 w-1 rounded bg-grape-dark" style={{ left: `calc(${e.mastery * 100}% - 2px)` }} />
        </div>
        <p className="mt-1 text-sm text-sub">{t("Measured: {c} of {n} answers right in the last 30 days.", { c: e.recent.correct, n: e.recent.total })} · {t(CONF_LABEL[e.label])}</p>
      </>}
    </li>
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

  return (
    <AppShell>
      <PageTitle title={t("Your Learning Twin")} sub={t("How Speakara adapts to you, based on your answers and what you’ve told us.")} />
      {done && <div className="mb-4"><Notice tone="success">{done}</Notice></div>}
      {!p.onboarded && <div className="mb-4 rounded-2xl border-2 border-grape bg-grape-soft p-4"><p className="font-extrabold text-grape-dark">{t("Tell Speakara about your goals")}</p><p className="mb-3 text-sm">{t("Six quick questions, all optional. Your answers shape your recommendations.")}</p><Link href="/profile/learning-twin/setup" className="font-extrabold text-sky-dark underline">{t("Set up my Learning Twin")}</Link></div>}

      <NextBestStep max={4} />

      <section aria-labelledby="map-title" className="mb-6">
        <h2 id="map-title" className="mb-1 text-lg">{t("Learning map: {course}", { course: t(v.course.targetName) })}</h2>
        <p className="mb-3 flex items-start gap-1 text-sm text-sub"><Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{t("Estimates come only from your graded answers, weighted towards recent ones. The shaded band shows how certain the estimate is.")}</p>
        <ul className="grid gap-2 sm:grid-cols-2">{est.map((e) => <SkillRow key={e.skill} e={e} />)}</ul>
      </section>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><h3 className="mb-1 text-base">{t("Strengths")}</h3><p className="text-sm">{strengths.length ? strengths.map((e) => t(SKILL_LABEL[e.skill])).join(", ") : t("None measured yet")}</p></Card>
        <Card><h3 className="mb-1 text-base">{t("Needs practice")}</h3><p className="text-sm">{weak.length ? weak.map((e) => t(SKILL_LABEL[e.skill])).join(", ") : t("Nothing flagged")}</p></Card>
        <Card><h3 className="mb-1 text-base">{t("Recently improved")}</h3><p className="text-sm">{improving.length ? improving.map((e) => t(SKILL_LABEL[e.skill])).join(", ") : t("No change measured yet")}</p></Card>
      </div>

      <section aria-labelledby="mis-title" className="mb-6">
        <h2 id="mis-title" className="mb-2 text-lg">{t("Repeated mistakes")}</h2>
        {v.mistakes.length ? <ul className="divide-y-2 divide-line rounded-2xl border-2 border-line">{v.mistakes.slice(0, 8).map((m) => (
          <li key={m.item} className="flex items-center gap-3 p-3"><span className="flex-1 font-bold">{m.label}</span><span className="text-sm text-sub">{t("{n} misses", { n: m.misses })} · {t(SKILL_LABEL[m.skill])}</span></li>))}</ul>
          : <p className="text-sm text-sub">{t("No item has been missed twice recently.")}</p>}
      </section>

      <section aria-labelledby="time-title" className="mb-6">
        <h2 id="time-title" className="mb-2 text-lg">{t("Progress over time")}</h2>
        <div className="flex h-32 items-end gap-2 rounded-2xl border-2 border-line p-3" role="img" aria-label={t("Answers per week for the last six weeks")}>
          {weekly.map((w) => <div key={w.i} className="flex flex-1 flex-col items-center justify-end gap-1 text-xs text-sub">
            <div className="flex w-full flex-col justify-end" style={{ height: `${(w.n / max) * 80}px` }}><div className="rounded-t bg-coral-soft" style={{ height: `${w.n ? ((w.n - w.c) / w.n) * 100 : 0}%` }} /><div className="rounded-b bg-brand" style={{ height: `${w.n ? (w.c / w.n) * 100 : 0}%` }} /></div>
            <span>{w.c}/{w.n}</span></div>)}
        </div>
        <p className="mt-1 text-xs text-sub">{t("Right / total answers per week, oldest on the left.")}</p>
      </section>

      <section aria-labelledby="you-title" className="mb-6">
        <div className="mb-2 flex items-center gap-2"><h2 id="you-title" className="flex-1 text-lg">{t("What you told us")}</h2><Link href="/profile/learning-twin/setup" className="flex min-h-11 items-center gap-1 text-sm font-extrabold text-sky-dark"><Pencil size={16} aria-hidden="true" />{t("Edit")}</Link></div>
        <dl className="grid gap-2 rounded-2xl border-2 border-line p-3 text-sm sm:grid-cols-2">
          {[[t("Goal"), p.goal ? t(p.goal) : "—"], [t("Your level (self-reported)"), p.selfLevel ? t(p.selfLevel) : "—"], [t("Teaching style"), p.style ? t(p.style) : "—"], [t("Difficulty"), p.difficulty ? t(p.difficulty) : "—"],
            [t("Corrections"), p.correction ? t(p.correction) : "—"], [t("Interests"), p.interests.length ? p.interests.map((i) => t(i)).join(", ") : "—"], [t("Areas you find hard (self-reported)"), p.hardAreas.length ? p.hardAreas.map((s) => t(SKILL_LABEL[s])).join(", ") : "—"],
            [t("Speaking confidence (self-reported)"), p.confidence.speaking ? `${p.confidence.speaking}/5` : "—"]].map(([k, x]) => <div key={k}><dt className="text-sub">{k}</dt><dd className="font-bold">{x}</dd></div>)}
        </dl>
        <p className="mt-1 text-xs text-sub">{t("Self-reported answers guide recommendations but never change your measured estimates.")}</p>
      </section>

      <section aria-labelledby="priv-title" className="mb-6 space-y-3">
        <h2 id="priv-title" className="flex items-center gap-2 text-lg"><ShieldCheck size={20} aria-hidden="true" />{t("Privacy and control")}</h2>
        <label className="flex min-h-11 items-start gap-3 rounded-2xl border-2 border-line p-3"><input type="checkbox" className="mt-1 h-5 w-5" checked={p.personalise} onChange={(e) => void savePrefs({ personalise: e.target.checked })} />
          <span><span className="block font-extrabold">{t("Personalised recommendations")}</span><span className="block text-sm text-sub">{t("When off, Speakara stops recording learning events and shows the standard course.")}</span></span></label>
        <label className="flex min-h-11 items-start gap-3 rounded-2xl border-2 border-line p-3"><input type="checkbox" className="mt-1 h-5 w-5" checked={p.companionContext} disabled={!v.userId} onChange={(e) => void savePrefs({ companionContext: e.target.checked })} />
          <span><span className="block font-extrabold">{t("Share a learning summary with the AI companion")}</span><span className="block text-sm text-sub">{v.userId ? t("Sends only your measured strengths and weaker areas, repeated mistakes and stated preferences, so it can adapt. No audio or transcripts.") : t("Sign in to use the AI companion.")}</span>
            {p.companionContext && v.brief.length > 0 && <details className="mt-1 text-sm"><summary className="cursor-pointer font-bold text-sky-dark">{t("See exactly what is shared")}</summary><ul className="mt-1 list-disc pl-5 text-sub">{v.brief.map((b) => <li key={b}>{b}</li>)}</ul></details>}</span></label>
        <p className="text-sm text-sub">{t("Your learning data is private. Other learners never see your weaker areas or mistakes.")}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setConfirm("prefs")}><RotateCcw size={18} aria-hidden="true" />{t("Reset preferences")}</Button>
          <Button variant="secondary" onClick={() => setConfirm("history")}><Trash2 size={18} aria-hidden="true" />{t("Delete learning history")}</Button>
          {v.userId && <Button variant="secondary" onClick={() => setConfirm("memory")}><Trash2 size={18} aria-hidden="true" />{t("Delete AI learning memory")}</Button>}
        </div>
        {confirm && <div role="alertdialog" aria-labelledby="cf-t" className="rounded-2xl border-2 border-coral bg-coral-soft p-4">
          <p id="cf-t" className="mb-3 font-extrabold">{confirm === "history" ? t("Delete all graded answers the Twin has recorded? Your lessons, XP and streak are not affected.") : confirm === "prefs" ? t("Reset everything you told the Twin (goals, interests, preferences)?") : t("Delete what the AI companion remembers about your learning?")}</p>
          <div className="flex gap-2"><Button variant="danger" onClick={() => void run(confirm)}>{confirm === "prefs" ? t("Reset") : t("Delete")}</Button><Button variant="secondary" onClick={() => setConfirm(null)}>{t("Cancel")}</Button></div></div>}
      </section>
    </AppShell>
  );
}
