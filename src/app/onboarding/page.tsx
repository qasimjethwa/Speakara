"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useStore } from "@/lib/state/store";
import { COURSES, getCourse } from "@/lib/content";
import { generateUnitTest, mulberry32 } from "@/lib/engine/exercises";
import { updateProfile } from "@/lib/state/actions";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { Mascot, type Mood } from "@/components/Mascot";
import { Button, Field, Loading, ProgressBar } from "@/components/ui";

const NATIVE = [{ code: "en", label: "English", flag: "🇬🇧" }, { code: "es", label: "Español", flag: "🇪🇸" }, { code: "hi", label: "हिन्दी", flag: "🇮🇳" }];
const GOALS = [["travel", "✈️", "Travel"], ["people", "🧑‍🤝‍🧑", "Connect with people"], ["work", "💼", "Boost my career"], ["school", "🎓", "Support my studies"], ["brain", "🧠", "Keep my mind sharp"], ["fun", "🎉", "Just for fun"]];
const TARGETS = [[10, "Casual", "about 3 min a day"], [20, "Regular", "about 6 min a day"], [30, "Serious", "about 10 min a day"], [50, "Intense", "about 15 min a day"]] as const;
const STEPS = ["welcome", "native", "course", "goal", "level", "placement", "target", "plan"] as const;

export default function Onboarding() {
  const router = useRouter(); const { state, ready, update, finishSession, mode } = useStore();
  const [step, setStep] = useState<(typeof STEPS)[number]>("welcome");
  const [name, setName] = useState(""); const [native, setNative] = useState("en"); const [courseId, setCourseId] = useState("es-en");
  const [goal, setGoal] = useState(""); const [level, setLevel] = useState<"new" | "some">("new"); const [target, setTarget] = useState(20); const [placed, setPlaced] = useState<number | null>(null);
  const course = getCourse(courseId);
  const test = useMemo(() => generateUnitTest(course, [0, 1], mulberry32(42)), [course]);
  if (!ready) return <Loading />;
  const idx = STEPS.indexOf(step);
  const go = (s: (typeof STEPS)[number]) => setStep(s);
  const choice = (on: boolean) => `key flex w-full items-center gap-4 rounded-2xl border-2 border-b-4 px-4 py-3 text-left text-lg font-bold ${on ? "border-sky bg-sky-soft text-sky-dark" : "border-line-dark bg-paper"}`;

  if (step === "placement") {
    return <LessonPlayer course={course} exercises={test} kind="placement" sound={state.profile.sound} exitHref="/onboarding" base={{}} onFinish={(r) => {
      const acc = r.total ? r.correctFirstTry / r.total : 0; const unit = acc >= 0.8 ? Math.min(2, course.units.length - 1) : acc >= 0.5 ? 1 : 0;
      update((s) => updateProfile(s, { courseId })); finishSession({ ...r, unlockUnit: unit }); setPlaced(unit); go("target");
    }} />;
  }
  const say: Record<string, [Mood, string]> = {
    welcome: ["wave", "Hi, I’m Kiko! I change colour when you learn something new."], native: ["happy", "Which language do you speak best?"], course: ["happy", "What would you like to learn?"],
    goal: ["think", "Why are you learning? I’ll keep it in mind."], level: ["think", `How much ${course.targetName} do you know?`], target: ["happy", "Pick a daily target. Small and steady wins."], plan: ["cheer", "Your plan is ready!"],
  };
  const next = () => {
    if (step === "welcome") go("native"); else if (step === "native") { const first = COURSES.find((c) => c.native === native); if (first) setCourseId(first.id); go("course"); }
    else if (step === "course") go("goal"); else if (step === "goal") go("level");
    else if (step === "level") go(level === "some" && course.units.length > 1 ? "placement" : "target");
    else if (step === "target") go("plan");
    else { update((s) => updateProfile(s, { name: name.trim() || s.profile.name || "Learner", nativeLang: native, courseId, goal, level, dailyGoalXp: target, onboarded: true })); router.replace("/learn"); }
  };
  const canNext = step !== "goal" || !!goal;
  return (
    <div className="mx-auto flex min-h-dvh max-w-[640px] flex-col px-5">
      <header className="flex items-center gap-4 py-5">
        <button type="button" aria-label="Back" disabled={idx === 0} onClick={() => go(STEPS[Math.max(0, idx - (step === "target" ? 2 : 1))])} className="rounded-lg p-1 text-sub disabled:opacity-30"><ArrowLeft size={26} /></button>
        <ProgressBar value={(idx + 1) / STEPS.length} label="Setup progress" />
      </header>
      <main className="flex-1 pb-32">
        <div className="mb-6 flex items-end gap-3"><Mascot mood={say[step][0]} size={110} /><p className="mb-6 rounded-2xl border-2 border-line px-4 py-3 text-lg">{say[step][1]}</p></div>
        {step === "welcome" && (
          <div className="space-y-4"><p className="text-sub">Speakara is free — every lesson, story and tutor chat. No lives to run out, nothing to buy.</p>
            {(mode === "guest" || !state.profile.name) && <Field label="What should I call you?" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder="Your name" autoComplete="given-name" />}</div>
        )}
        {step === "native" && <div role="radiogroup" aria-label="Your language" className="space-y-3">{NATIVE.map((n) => <button key={n.code} role="radio" aria-checked={native === n.code} onClick={() => setNative(n.code)} className={choice(native === n.code)}><span className="text-3xl">{n.flag}</span>{n.label}</button>)}</div>}
        {step === "course" && <div role="radiogroup" aria-label="Course" className="space-y-3">{COURSES.filter((c) => c.native === native).map((c) => (
          <button key={c.id} role="radio" aria-checked={courseId === c.id} onClick={() => setCourseId(c.id)} className={choice(courseId === c.id)}><span className="text-3xl">{c.flag}</span><span><span className="block">{c.targetName}</span><span className="block text-sm font-semibold text-sub">{c.units.length} unit{c.units.length > 1 ? "s" : ""} · {c.units.reduce((n, u) => n + u.lessons.length, 0)} lessons{c.status === "starter" ? " · starter course" : ""}</span></span></button>
        ))}</div>}
        {step === "goal" && <div role="radiogroup" aria-label="Learning goal" className="grid gap-3 sm:grid-cols-2">{GOALS.map(([id, icon, label]) => <button key={id} role="radio" aria-checked={goal === id} onClick={() => setGoal(id)} className={choice(goal === id)}><span className="text-2xl">{icon}</span>{label}</button>)}</div>}
        {step === "level" && <div role="radiogroup" aria-label="Prior knowledge" className="space-y-3">
          <button role="radio" aria-checked={level === "new"} onClick={() => setLevel("new")} className={choice(level === "new")}><span className="text-2xl">🌱</span><span>I’m new to {course.targetName}<span className="block text-sm font-semibold text-sub">Start from the very first lesson</span></span></button>
          <button role="radio" aria-checked={level === "some"} onClick={() => setLevel("some")} className={choice(level === "some")}><span className="text-2xl">🧭</span><span>I know some already<span className="block text-sm font-semibold text-sub">{course.units.length > 1 ? "Take a 2-minute placement test to skip ahead" : "This starter course has one unit, so everyone begins at lesson one"}</span></span></button>
        </div>}
        {step === "target" && <div role="radiogroup" aria-label="Daily target" className="space-y-3">
          {placed !== null && <p className="rounded-2xl bg-brand-soft p-3 text-brand-dark">Placement done — you start at <strong>Unit {placed + 1}: {course.units[placed].title}</strong>.</p>}
          {TARGETS.map(([xp, label, time]) => <button key={xp} role="radio" aria-checked={target === xp} onClick={() => setTarget(xp)} className={`${choice(target === xp)} justify-between`}><span>{label}<span className="block text-sm font-semibold text-sub">{time}</span></span><span className="text-sun-dark">{xp} XP</span></button>)}
        </div>}
        {step === "plan" && <ul className="space-y-3 text-lg">
          <li className="rounded-2xl border-2 border-line p-4">{course.flag} <strong>{course.targetName}</strong> for {course.nativeName} speakers, starting at Unit {(placed ?? 0) + 1}</li>
          <li className="rounded-2xl border-2 border-line p-4">🎯 <strong>{target} XP</strong> a day — about {Math.max(1, Math.round(target / 10))} lesson{target > 10 ? "s" : ""}</li>
          <li className="rounded-2xl border-2 border-line p-4">🔁 Words you miss come back for review automatically</li>
          <li className="rounded-2xl border-2 border-line p-4">💚 Free forever: unlimited mistakes, all features</li>
        </ul>}
      </main>
      <footer className="fixed inset-x-0 bottom-0 border-t-2 border-line bg-paper"><div className="mx-auto max-w-[640px] px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4"><Button className="w-full" disabled={!canNext} onClick={next}>{step === "plan" ? "Start learning" : step === "level" && level === "some" && course.units.length > 1 ? "Take the placement test" : "Continue"}</Button></div></footer>
    </div>
  );
}
