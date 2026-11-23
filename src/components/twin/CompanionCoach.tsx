"use client";
import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/state/store";
import { band, SKILL_LABEL } from "@/lib/twin/model";
import { useTwinView } from "@/lib/twin/view";

/** Gemini-written coaching that explains the Twin's (rule-based) decisions. Optional: the page works without it. */
export function CompanionCoach() {
  const { t } = useT(); const v = useTwinView(); const { state } = useStore();
  const [text, setText] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [q, setQ] = useState(""); const [err, setErr] = useState(false);
  if (!v.ready || !v.prefs.personalise) return null;
  const top = v.recommendations[0];
  const ask = async (question?: string) => {
    setBusy(true); setErr(false); setText(null);
    try {
      const r = await fetch("/api/twin/explain", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
        course: v.course.id, lang: v.prefs.explanationLang ?? state.profile.uiLang, question,
        skills: v.estimates.filter((e) => e.skill !== "isl" && e.recent.total > 0).map((e) => ({ skill: e.skill, band: band(e), correct: e.recent.correct, total: e.recent.total })),
        mistakes: v.mistakes.slice(0, 5).map((m) => m.label), recommendation: top ? { title: t(top.title), reason: t(top.reason, top.reasonParams) } : undefined,
        goal: v.prefs.goal, style: v.prefs.style, correction: v.prefs.correction, interests: v.prefs.interests,
      }) });
      const j = await r.json(); if (r.ok && j.text) setText(j.text); else setErr(true);
    } catch { setErr(true); }
    setBusy(false);
  };
  const weakest = v.estimates.filter((e) => e.skill !== "isl" && band(e) === "needs work").sort((a, b) => a.mastery - b.mastery)[0];
  const chip = "min-h-11 rounded-full border border-line bg-paper px-4 text-sm font-bold hover:border-brand hover:text-brand-dark disabled:opacity-50";
  return (
    <section aria-labelledby="coach-title" className="rounded-3xl border border-line bg-paper p-5 shadow-[0_1px_2px_rgba(16,24,40,.04),0_8px_24px_-12px_rgba(16,24,40,.12)] sm:p-6" data-testid="companion-coach">
      <h2 id="coach-title" className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.12em] text-sub"><Sparkles size={16} className="text-brand" aria-hidden="true" />{t("Ask your learning companion")}</h2>
      <div className="mb-3 flex flex-wrap gap-2">
        {top && <button type="button" disabled={busy} onClick={() => void ask()} className={chip}>{t("Explain my next step")}</button>}
        {weakest && <button type="button" disabled={busy} onClick={() => void ask(`Give me a short tip to improve my ${weakest.skill}.`)} className={chip}>{t("Coach me on {skill}", { skill: t(SKILL_LABEL[weakest.skill]).toLowerCase() })}</button>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) void ask(q.trim()); }} className="flex gap-2">
        <label htmlFor="coach-q" className="sr-only">{t("Ask a question about your learning")}</label>
        <input id="coach-q" value={q} onChange={(e) => setQ(e.target.value)} maxLength={300} placeholder={t("Ask a question about your learning…")} className="min-h-12 min-w-0 flex-1 rounded-2xl border border-line-dark bg-mist/60 px-4 focus:bg-paper" />
        <button type="submit" disabled={busy || !q.trim()} aria-label={t("Send question")} className="grid min-h-12 min-w-12 place-items-center rounded-2xl bg-brand text-white disabled:opacity-40"><Send size={18} aria-hidden="true" /></button>
      </form>
      <div aria-live="polite" className="mt-3">
        {busy && <p className="text-sm text-sub">{t("Thinking…")}</p>}
        {text && <p className="whitespace-pre-line rounded-2xl bg-brand-soft/50 p-4 leading-relaxed">{text}</p>}
        {err && <p className="rounded-2xl bg-mist p-4 text-sm text-sub">{t("The AI companion isn’t available right now.")}{top ? ` ${t(top.reason, top.reasonParams)}` : ""}</p>}
        {(text || err) && <p className="mt-2 text-xs text-sub">{t("Written by AI from your measured results and preferences. It explains Speakara’s suggestions; it doesn’t change your scores.")}</p>}
      </div>
    </section>
  );
}
