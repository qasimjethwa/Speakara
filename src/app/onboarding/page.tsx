"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useStore } from "@/lib/state/store";
import { COURSES, getCourse } from "@/lib/content";
import { buildSession, PLACEMENT_SEED, type SessionPlan } from "@/lib/engine/plan";
import { UI_LANGS, useT, useUiLang } from "@/lib/i18n";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { Mascot, type Mood } from "@/components/Mascot";
import { Button, Field, Loading, Notice, ProgressBar } from "@/components/ui";

const GOALS = [["travel", "✈️", "Travel"], ["people", "🧑‍🤝‍🧑", "Connect with people"], ["work", "💼", "Boost my career"], ["school", "🎓", "Support my studies"], ["brain", "🧠", "Keep my mind sharp"], ["fun", "🎉", "Just for fun"]];
const TARGETS = [[10, "Casual", 3], [20, "Regular", 6], [30, "Serious", 10], [50, "Intense", 15]] as const;
const STEPS = ["welcome", "language", "course", "goal", "level", "placement", "target", "plan"] as const;
const NATIVE_OF: Record<string, string> = { en: "en", es: "es", hi: "hi" };

export default function Onboarding() {
  const router = useRouter(); const { state, ready, setProfile, finishSession, mode } = useStore(); const { t } = useT(); const [uiLang, setUiLang] = useUiLang();
  const [step, setStep] = useState<(typeof STEPS)[number]>("welcome");
  const [name, setName] = useState(""); const [courseId, setCourseId] = useState<string | null>(null);
  const [goal, setGoal] = useState(""); const [level, setLevel] = useState<"new" | "some">("new"); const [target, setTarget] = useState(20);
  const [placed, setPlaced] = useState<number | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  // Courses taught in the learner's interface language come first, but every course stays available.
  const courses = useMemo(() => [...COURSES].sort((a, b) => Number(b.native === NATIVE_OF[uiLang]) - Number(a.native === NATIVE_OF[uiLang])), [uiLang]);
  const course = getCourse(courseId ?? courses[0].id);
  const plan: SessionPlan = { type: "placement", courseId: course.id, seed: PLACEMENT_SEED };
  const test = useMemo(() => buildSession(course, plan), [course.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!ready) return <Loading />;
  const idx = STEPS.indexOf(step);
  const go = (s: (typeof STEPS)[number]) => { setError(null); setStep(s); };
  const choice = (on: boolean) => `key flex w-full items-center gap-4 rounded-2xl border-2 border-b-4 px-4 py-3 text-left text-lg font-bold ${on ? "border-sky-dark bg-sky-soft text-sky-dark" : "border-line-dark bg-paper"}`;

  if (step === "placement" && test) {
    if (busy) return <Loading text={t("Saving your progress…")} />;
    return <LessonPlayer course={course} exercises={test.exercises} sound={state.profile.sound} slow={state.profile.slowAudio} exitHref="/onboarding" onFinish={async (attempts, seconds) => {
      setBusy(true); setProfile({ courseId: course.id });
      try { await finishSession(plan, attempts, seconds); } catch (e) { setError((e as Error).message); }
      setBusy(false); setPlaced(-1); go("target");
    }} />;
  }
  const say: Record<string, [Mood, string]> = {
    welcome: ["wave", "Hi, I’m Kiko! I change colour when you learn something new."], language: ["happy", "Which language should I speak to you in?"], course: ["happy", "What would you like to learn?"],
    goal: ["think", "Why are you learning? I’ll keep it in mind."], level: ["think", "How much {lang} do you know?"], target: ["happy", "Pick a daily target. Small and steady wins."], plan: ["cheer", "Your plan is ready!"],
  };
  const startUnit = placed === null ? 0 : (state.unlockedUnits[course.id] ?? 0);
  const next = () => {
    if (step === "welcome") go("language"); else if (step === "language") go("course");
    else if (step === "course") go("goal"); else if (step === "goal") go("level");
    else if (step === "level") go(level === "some" && course.units.length > 1 ? "placement" : "target");
    else if (step === "target") go("plan");
    else { setProfile({ name: name.trim() || state.profile.name || "Learner", nativeLang: course.native, courseId: course.id, goal, level, dailyGoalXp: target, onboarded: true, uiLang }); router.replace("/learn"); }
  };
  const canNext = step !== "goal" || !!goal;
  return (
    <div className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-5">
      <header className="flex items-center gap-4 py-5">
        <button type="button" aria-label={t("Back")} disabled={idx === 0} onClick={() => go(STEPS[Math.max(0, idx - (step === "target" ? 2 : 1))])} className="rounded-lg p-1 text-sub disabled:opacity-40"><ArrowLeft size={26} /></button>
        <ProgressBar value={(idx + 1) / STEPS.length} label={t("Setup progress")} />
      </header>
      <main className="flex-1 pb-32">
        <div className="mb-6 flex items-end gap-3"><Mascot mood={say[step][0]} size={110} /><h1 className="mb-6 rounded-2xl border-2 border-line-dark px-4 py-3 text-lg font-bold">{t(say[step][1], { lang: t(course.targetName) })}</h1></div>
        {error && <div className="mb-4"><Notice tone="error">{t(error)}</Notice></div>}
        {step === "welcome" && (
          <div className="space-y-4"><p className="text-sub">{t("Speakara is free — every lesson, story and tutor chat. No lives to run out, nothing to buy.")}</p>
            {(mode === "guest" || !state.profile.name || state.profile.name === "Learner") && <Field label={t("What should I call you?")} value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder={t("Your name")} autoComplete="given-name" />}</div>
        )}
        {step === "language" && <div role="radiogroup" aria-label={t("Interface language")} className="space-y-3">{UI_LANGS.map((l) => <button key={l.code} role="radio" aria-checked={uiLang === l.code} onClick={() => setUiLang(l.code)} className={choice(uiLang === l.code)} lang={l.locale}><span className="text-2xl" aria-hidden="true">🌐</span>{l.label}</button>)}
          <p className="pt-2 text-sm text-sub">{t("This changes menus and instructions. You can learn any course in any interface language.")}</p></div>}
        {step === "course" && <div role="radiogroup" aria-label={t("Course")} className="space-y-3">{courses.map((c) => (
          <button key={c.id} role="radio" aria-checked={course.id === c.id} onClick={() => setCourseId(c.id)} className={choice(course.id === c.id)}><span className="text-3xl" aria-hidden="true">{c.flag}</span><span><span className="block">{t(c.targetName)}</span><span className="block text-sm font-semibold text-sub">{t("Taught in {lang}", { lang: t(c.nativeName) })} · {t("{n} lessons", { n: c.units.reduce((n, u) => n + u.lessons.length, 0) })}{c.status === "starter" ? ` · ${t("starter course")}` : ""}</span></span></button>
        ))}</div>}
        {step === "goal" && <div role="radiogroup" aria-label={t("Learning goal")} className="grid gap-3 sm:grid-cols-2">{GOALS.map(([id, icon, label]) => <button key={id} role="radio" aria-checked={goal === id} onClick={() => setGoal(id)} className={choice(goal === id)}><span className="text-2xl" aria-hidden="true">{icon}</span>{t(label)}</button>)}</div>}
        {step === "level" && <div role="radiogroup" aria-label={t("Prior knowledge")} className="space-y-3">
          <button role="radio" aria-checked={level === "new"} onClick={() => setLevel("new")} className={choice(level === "new")}><span className="text-2xl" aria-hidden="true">🌱</span><span>{t("I’m new to {lang}", { lang: t(course.targetName) })}<span className="block text-sm font-semibold text-sub">{t("Start from the very first lesson")}</span></span></button>
          <button role="radio" aria-checked={level === "some"} onClick={() => setLevel("some")} className={choice(level === "some")}><span className="text-2xl" aria-hidden="true">🧭</span><span>{t("I know some already")}<span className="block text-sm font-semibold text-sub">{course.units.length > 1 ? t("Take a 2-minute placement test to skip ahead") : t("This starter course has one unit, so everyone begins at lesson one")}</span></span></button>
        </div>}
        {step === "target" && <div role="radiogroup" aria-label={t("Daily target")} className="space-y-3">
          {placed !== null && !error && <Notice tone="success">{t("Placement done — you start at Unit {n}.", { n: startUnit + 1 })}</Notice>}
          {TARGETS.map(([xp, label, min]) => <button key={xp} role="radio" aria-checked={target === xp} onClick={() => setTarget(xp)} className={`${choice(target === xp)} justify-between`}><span>{t(label)}<span className="block text-sm font-semibold text-sub">{t("about {n} min a day", { n: min })}</span></span><span className="text-sun-dark">{xp} XP</span></button>)}
        </div>}
        {step === "plan" && <ul className="space-y-3 text-lg">
          <li className="rounded-2xl border-2 border-line p-4">{course.flag} <strong>{t(course.targetName)}</strong> · {t("starting at Unit {n}", { n: startUnit + 1 })}</li>
          <li className="rounded-2xl border-2 border-line p-4">🎯 <strong>{target} XP</strong> {t("a day")}</li>
          <li className="rounded-2xl border-2 border-line p-4">🔁 {t("Words you miss come back for review automatically")}</li>
          <li className="rounded-2xl border-2 border-line p-4">💚 {t("Free forever: unlimited mistakes, all features")}</li>
        </ul>}
      </main>
      <footer className="fixed inset-x-0 bottom-0 border-t-2 border-line bg-paper"><div className="mx-auto max-w-[640px] px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4"><Button className="w-full" disabled={!canNext} onClick={next}>{step === "plan" ? t("Start learning") : step === "level" && level === "some" && course.units.length > 1 ? t("Take the placement test") : t("Continue")}</Button></div></footer>
    </div>
  );
}
