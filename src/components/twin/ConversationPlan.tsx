"use client";
import { Lock, Target } from "lucide-react";
import { useT } from "@/lib/i18n";
import { band } from "@/lib/twin/model";
import { useTwinView } from "@/lib/twin/view";

const TOPICS: Record<string, string[]> = {
  travel: [/*i18n*/ "Plan a trip together", /*i18n*/ "Your favourite place to visit"], food: [/*i18n*/ "Favourite dishes", /*i18n*/ "Ordering in a restaurant"],
  study: [/*i18n*/ "What you study and why", /*i18n*/ "A typical day at college"], work: [/*i18n*/ "Your job or dream job", /*i18n*/ "A typical working day"],
  social: [/*i18n*/ "Introduce yourselves", /*i18n*/ "Family and friends"], everyday: [/*i18n*/ "Your weekend", /*i18n*/ "Your daily routine"],
};
const LEVEL = [/*i18n*/ "Look for a partner who is also a beginner.", /*i18n*/ "A partner at an early-intermediate level suits you.", /*i18n*/ "You’re ready for a more confident partner."];

/** Private suggestions for a language-exchange call. Built from your own Twin; never shown to the other learner. */
export function ConversationPlan() {
  const { t } = useT(); const v = useTwinView();
  if (!v.ready || !v.prefs.personalise) return null;
  const topics = [...new Set((v.prefs.interests.length ? v.prefs.interests : ["social", "everyday"]).flatMap((i) => TOPICS[i] ?? []))].slice(0, 3);
  const words = v.mistakes.filter((m) => m.skill === "vocabulary" || m.skill === "grammar").slice(0, 3).map((m) => m.label.split(" (")[0]);
  const speakWeak = band(v.estimates.find((e) => e.skill === "speaking")!) === "needs work" || (v.prefs.confidence.speaking ?? 3) <= 2;
  return (
    <section aria-labelledby="plan-title" className="mb-5 rounded-3xl border-2 border-line p-4" data-testid="conversation-plan">
      <h2 id="plan-title" className="flex items-center gap-2 text-lg"><Target size={20} aria-hidden="true" />{t("Your conversation plan")}</h2>
      <p className="mb-3 flex items-center gap-1 text-xs text-sub"><Lock size={12} aria-hidden="true" />{t("Only you can see this. It comes from your Learning Twin.")}</p>
      <p className="text-sm"><strong>{t("Partner level")}:</strong> {t(LEVEL[v.difficulty - 1])}</p>
      <p className="mt-1 text-sm"><strong>{t("Topics")}:</strong> {topics.map((x) => t(x)).join(" · ")}</p>
      <p className="mt-1 text-sm"><strong>{t("Mission")}:</strong> {words.length ? t("Use these in the call: {w}", { w: words.join(", ") }) : speakWeak ? t("Ask three simple questions and listen to the answers.") : t("Tell a short story about your week.")}</p>
    </section>
  );
}
