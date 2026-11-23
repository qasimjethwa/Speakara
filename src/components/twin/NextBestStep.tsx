"use client";
import Link from "next/link";
import { ArrowRight, Brain, Settings2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useTwinView } from "@/lib/twin/view";

/** "Your next best step": the Learning Twin's top recommendations, each with the reason it was chosen. */
export function NextBestStep({ max = 3, compact = false }: { max?: number; compact?: boolean }) {
  const { t } = useT(); const v = useTwinView();
  if (!v.ready) return null;
  if (!v.prefs.personalise) return compact ? null : (
    <p className="rounded-2xl border-2 border-line p-4 text-sm text-sub">{t("Personalised recommendations are off.")} <Link href="/profile/learning-twin" className="font-extrabold text-sky-dark underline">{t("Turn them on")}</Link></p>
  );
  const recs = v.recommendations.slice(0, max);
  if (!recs.length) return null;
  return (
    <section aria-labelledby="nbs-title" className="mb-6 rounded-3xl border-2 border-line bg-paper p-4" data-testid="next-best-step">
      <div className="mb-3 flex items-center gap-2">
        <Brain size={20} className="text-grape-dark" aria-hidden="true" />
        <h2 id="nbs-title" className="flex-1 text-lg">{t("Your next best step")}</h2>
        <Link href="/profile/learning-twin" className="flex min-h-11 items-center gap-1 text-sm font-extrabold text-sky-dark"><Settings2 size={16} aria-hidden="true" />{t("Learning Twin")}</Link>
      </div>
      <ol className="space-y-2">{recs.map((r, i) => (
        <li key={r.id}>
          <Link href={r.href} data-rec={r.id} className={`flex items-start gap-3 rounded-2xl border-2 p-3 hover:bg-mist ${i === 0 ? "border-grape bg-grape-soft/50" : "border-line"}`}>
            <span className="min-w-0 flex-1">
              <span className="block font-extrabold">{t(r.title)}</span>
              <span className="block text-sm text-sub">{t(r.reason, Object.fromEntries(Object.entries(r.reasonParams ?? {}).map(([k, x]) => [k, typeof x === "string" ? t(x).toLowerCase() : x])))}</span>
            </span>
            <ArrowRight size={18} className="mt-1 shrink-0 text-sub" aria-hidden="true" />
          </Link>
        </li>))}</ol>
    </section>
  );
}
