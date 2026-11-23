"use client";
/** Learning Twin onboarding: six optional questions + an optional starting check. Everything can be skipped and edited later. */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { COURSES } from "@/lib/content";
import { useStore } from "@/lib/state/store";
import { SKILL_LABEL, type Interest, type Skill, type TwinPrefs } from "@/lib/twin/model";
import { savePrefs, useTwin } from "@/lib/twin/store";

const GOALS = [["travel", /*i18n*/ "Travel"], ["study", /*i18n*/ "Study or university"], ["work", /*i18n*/ "Work"], ["family", /*i18n*/ "Family and friends"], ["culture", /*i18n*/ "Culture and media"], ["other", /*i18n*/ "Something else"]] as const;
const LEVELS = [["new", /*i18n*/ "Completely new"], ["beginner", /*i18n*/ "I know a little"], ["intermediate", /*i18n*/ "I can hold simple conversations"]] as const;
const STYLES = [["visual", /*i18n*/ "Visual: pictures, cards and matching"], ["explain", /*i18n*/ "Explanations first, then practice"], ["practice", /*i18n*/ "Lots of practice exercises"], ["conversation", /*i18n*/ "Conversation and roleplay"]] as const;
const INTERESTS: [Interest, string][] = [["travel", /*i18n*/ "Travel"], ["food", /*i18n*/ "Food"], ["study", /*i18n*/ "Study"], ["work", /*i18n*/ "Work"], ["social", /*i18n*/ "Meeting people"], ["everyday", /*i18n*/ "Everyday life"]];
const HARD: Skill[] = ["vocabulary", "grammar", "reading", "writing", "listening", "speaking"];

function Q({ n, title, optional, children }: { n: number; title: string; optional: string; children: React.ReactNode }) {
  return <fieldset className="mb-6"><legend className="mb-2 text-lg font-extrabold">{n}. {title} <span className="text-sm font-semibold text-sub">({optional})</span></legend>{children}</fieldset>;
}

export default function TwinSetup() {
  const { t } = useT(); const router = useRouter(); const { state, userId, setProfile } = useStore(); const twin = useTwin(userId);
  const [p, setP] = useState<TwinPrefs>(twin.prefs); const [course, setCourse] = useState(state.profile.courseId);
  useEffect(() => { setP(twin.prefs); }, [twin.prefs]);
  useEffect(() => { setCourse(state.profile.courseId); }, [state.profile.courseId]);
  const set = (patch: Partial<TwinPrefs>) => setP((x) => ({ ...x, ...patch }));
  const chip = (on: boolean) => `min-h-11 rounded-2xl border-2 px-3 py-2 text-left font-bold ${on ? "border-sky bg-sky-soft text-sky-dark" : "border-line"}`;
  const save = async (then: string) => { if (course !== state.profile.courseId) setProfile({ courseId: course }); await savePrefs({ ...p, onboarded: true }); router.push(then); };

  return (
    <AppShell>
      <PageTitle title={t("Set up your Learning Twin")} sub={t("Answer what you like and skip the rest. You can change any answer later.")} />
      <Q optional={t("optional")} n={1} title={t("Which language do you want to learn?")}>
        <select value={course} onChange={(e) => setCourse(e.target.value)} aria-label={t("Course")} className="min-h-12 w-full rounded-2xl border-2 border-line-dark bg-mist px-3 font-semibold">
          {COURSES.map((c) => <option key={c.id} value={c.id}>{t(c.targetName)} — {t("for {lang} speakers", { lang: t(c.nativeName) })}</option>)}</select>
      </Q>
      <Q optional={t("optional")} n={2} title={t("What is your current level?")}><div className="grid gap-2 sm:grid-cols-3">{LEVELS.map(([id, l]) => <button key={id} type="button" aria-pressed={p.selfLevel === id} onClick={() => set({ selfLevel: p.selfLevel === id ? undefined : id })} className={chip(p.selfLevel === id)}>{t(l)}</button>)}</div></Q>
      <Q optional={t("optional")} n={3} title={t("Why do you want to learn it?")}><div className="grid gap-2 sm:grid-cols-3">{GOALS.map(([id, l]) => <button key={id} type="button" aria-pressed={p.goal === id} onClick={() => set({ goal: p.goal === id ? undefined : id })} className={chip(p.goal === id)}>{t(l)}</button>)}</div></Q>
      <Q optional={t("optional")} n={4} title={t("Which language should explanations use?")}><div className="grid gap-2 sm:grid-cols-3">{([["en", "English"], ["es", "Español"], ["hi", "हिन्दी"]] as const).map(([id, l]) => <button key={id} type="button" aria-pressed={p.explanationLang === id} onClick={() => { set({ explanationLang: id }); setProfile({ uiLang: id }); }} className={chip(p.explanationLang === id)} lang={id}>{l}</button>)}</div></Q>
      <Q optional={t("optional")} n={5} title={t("How do you like to be taught?")}><div className="grid gap-2 sm:grid-cols-2">{STYLES.map(([id, l]) => <button key={id} type="button" aria-pressed={p.style === id} onClick={() => set({ style: p.style === id ? undefined : id })} className={chip(p.style === id)}>{t(l)}</button>)}</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">{([["easier", /*i18n*/ "Keep it easy"], ["standard", /*i18n*/ "Standard"], ["challenge", /*i18n*/ "Challenge me"]] as const).map(([id, l]) => <button key={id} type="button" aria-pressed={p.difficulty === id} onClick={() => set({ difficulty: id })} className={chip(p.difficulty === id)}>{t(l)}</button>)}</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">{([["gentle", /*i18n*/ "Gentle corrections"], ["balanced", /*i18n*/ "Balanced corrections"], ["detailed", /*i18n*/ "Detailed corrections"]] as const).map(([id, l]) => <button key={id} type="button" aria-pressed={p.correction === id} onClick={() => set({ correction: id })} className={chip(p.correction === id)}>{t(l)}</button>)}</div>
        <p className="mb-1 mt-3 text-sm font-bold text-sub">{t("Topics you enjoy")}</p>
        <div className="flex flex-wrap gap-2">{INTERESTS.map(([id, l]) => <button key={id} type="button" aria-pressed={p.interests.includes(id)} onClick={() => set({ interests: p.interests.includes(id) ? p.interests.filter((x) => x !== id) : [...p.interests, id] })} className={chip(p.interests.includes(id))}>{t(l)}</button>)}</div>
      </Q>
      <Q optional={t("optional")} n={6} title={t("Which areas do you find most difficult?")}>
        <div className="flex flex-wrap gap-2">{HARD.map((s) => <button key={s} type="button" aria-pressed={p.hardAreas.includes(s)} onClick={() => set({ hardAreas: p.hardAreas.includes(s) ? p.hardAreas.filter((x) => x !== s) : [...p.hardAreas, s] })} className={chip(p.hardAreas.includes(s))}>{t(SKILL_LABEL[s])}</button>)}</div>
        <label className="mt-3 block text-sm font-bold"><span className="mb-1 block text-sub">{t("How confident do you feel speaking? (1 = not at all, 5 = very)")}</span>
          <input type="range" min={1} max={5} step={1} value={p.confidence.speaking ?? 3} onChange={(e) => set({ confidence: { ...p.confidence, speaking: +e.target.value as 1 | 2 | 3 | 4 | 5 } })} className="w-full max-w-xs" aria-valuetext={`${p.confidence.speaking ?? 3}/5`} />
          <span className="ml-2">{p.confidence.speaking ?? "—"}/5</span></label>
      </Q>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void save("/profile/learning-twin")}>{t("Save")}</Button>
        <Button variant="secondary" onClick={() => void save("/lesson?placement=1")}>{t("Save and take the 3-minute starting check")}</Button>
        <Link href="/profile/learning-twin" className="flex min-h-11 items-center px-3 font-extrabold text-sub underline">{t("Skip for now")}</Link>
      </div>
    </AppShell>
  );
}
