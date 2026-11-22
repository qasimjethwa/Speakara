"use client";
import Link from "next/link";
import { BookOpen, Check, Lock, NotebookText, Star, FastForward } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Mascot } from "@/components/Mascot";
import { useStore } from "@/lib/state/store";
import { allLessons, getCourse, lessonKey } from "@/lib/content";
import { isLessonUnlocked } from "@/lib/state/actions";
import type { UnitColor } from "@/lib/content/types";
import { useT } from "@/lib/i18n";

const TONE: Record<UnitColor, { bg: string; edge: string; text: string }> = {
  brand: { bg: "bg-brand", edge: "border-brand-dark", text: "text-brand-dark" }, sky: { bg: "bg-sky", edge: "border-sky-dark", text: "text-sky-dark" },
  grape: { bg: "bg-grape", edge: "border-grape-dark", text: "text-grape-dark" }, sun: { bg: "bg-sun", edge: "border-sun-edge", text: "text-sun-dark" },
  coral: { bg: "bg-coral", edge: "border-coral-dark", text: "text-coral-dark" },
};
const OFFSETS = [0, 44, 70, 44, 0, -44, -70, -44];

function Path() {
  const { state } = useStore(); const { t } = useT();
  const course = getCourse(state.profile.courseId);
  const order = allLessons(course).map((x) => ({ lessonId: x.lesson.id, unitIndex: course.units.indexOf(x.unit) }));
  const firstOpen = order.findIndex((o, i) => isLessonUnlocked(state, course.id, order, i) && !state.completed[lessonKey(course.id, o.lessonId)]);
  let n = -1;
  return (
    <div>
      <Link href="/learn/isl" className="key mb-5 flex items-center gap-3 rounded-2xl border-2 border-b-4 border-grape bg-grape-soft p-3 text-grape-dark">
        <span className="text-2xl" aria-hidden="true">🤟</span>
        <span className="min-w-0 flex-1"><span className="block font-extrabold">{t("Learn through Indian Sign Language")}</span><span className="block text-sm">{t("English and Spanish courses designed for Deaf learners.")}</span></span>
      </Link>
      <h1 className="mb-5 text-sm font-extrabold uppercase tracking-wide text-sub"><span aria-hidden="true">{course.flag}</span> {t(course.targetName)} · {t("Section {n}", { n: 1 })} · CEFR A1</h1>
      {course.units.map((unit, ui) => {
        const tone = TONE[unit.color];
        const unitOpen = isLessonUnlocked(state, course.id, order, order.findIndex((o) => o.unitIndex === ui));
        const unitDone = unit.lessons.every((l) => state.completed[lessonKey(course.id, l.id)]);
        return (
          <section key={unit.id} aria-labelledby={`${unit.id}-title`} className="mb-12">
            <div className={`flex items-center justify-between gap-3 rounded-2xl border-b-4 p-4 text-white ${unitOpen ? `${tone.bg} ${tone.edge}` : "border-line-dark bg-line !text-ink"}`}>
              <div><h2 id={`${unit.id}-title`} className="text-xl">{t("Unit {n}", { n: ui + 1 })} · {unit.title}</h2><p className="text-[15px] font-semibold">{unit.objective}</p></div>
              <Link href={`/guidebook?unit=${unit.id}`} aria-label={`${t("Guidebook")}: ${unit.title}`} className={`key flex shrink-0 items-center gap-2 rounded-xl border-2 border-b-4 px-3 py-2 text-sm font-extrabold uppercase ${unitOpen ? "border-white/70 bg-black/10" : "border-line-dark bg-paper"}`}><NotebookText size={20} aria-hidden="true" /><span className="hidden sm:inline">{t("Guidebook")}</span></Link>
            </div>
            {!unitOpen && ui > 0 && (
              <Link href={`/lesson?testout=${ui}`} className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-2xl border-2 border-b-4 border-line-dark px-4 py-2 text-sm font-extrabold uppercase text-grape-dark key"><FastForward size={18} aria-hidden="true" />{t("Know this already? Jump here")}</Link>
            )}
            <ol className="relative mt-14 flex flex-col items-center gap-6">
              {unit.lessons.map((lesson) => {
                n++; const idx = n;
                const done = !!state.completed[lessonKey(course.id, lesson.id)], open = isLessonUnlocked(state, course.id, order, idx), current = idx === firstOpen;
                const node = `key grid h-[70px] w-[76px] place-items-center rounded-[50%] border-b-8 ${done ? "border-sun-edge bg-sun text-ink" : open ? `${tone.edge} ${tone.bg} text-white` : "border-line-dark bg-line text-sub"}`;
                return (
                  <li key={lesson.id} className="relative" style={{ transform: `translateX(${OFFSETS[idx % OFFSETS.length]}px)` }}>
                    {current && <span className={`anim-bob absolute -top-11 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-xl border-2 border-line bg-paper px-3 py-1.5 text-sm font-extrabold uppercase ${tone.text}`}>{t("Start")}</span>}
                    {current && idx % 8 < 4 && <Mascot mood="wave" size={92} className="pointer-events-none absolute -right-28 top-0 hidden sm:block" />}
                    {open ? <Link href={`/lesson?lesson=${lesson.id}`} aria-label={`${lesson.title}${done ? ` (${t("completed — practise again")})` : current ? ` (${t("start")})` : ""}`} data-state={done ? "done" : current ? "current" : "open"} className={node} style={current ? { animation: "pulse-ring 1.8s infinite" } : undefined}>{done ? <Check size={34} strokeWidth={4} /> : <Star size={32} fill="currentColor" />}</Link>
                      : <span role="img" aria-label={`${lesson.title} (${t("locked")})`} data-state="locked" className={node}><Lock size={28} /></span>}
                    <p className={`mt-1 w-28 -translate-x-[18px] text-center text-xs font-bold ${open ? "text-ink" : "text-sub"}`}>{lesson.title}</p>
                  </li>
                );
              })}
              {unit.story && (
                <li>{unitDone
                  ? <Link href={`/story?id=${unit.story.id}`} aria-label={`${t("Story")}: ${unit.story.title}`} className={`key grid h-[70px] w-[76px] place-items-center rounded-[50%] border-b-8 ${state.stories[unit.story.id] ? "border-sun-edge bg-sun text-ink" : `${tone.edge} ${tone.bg} text-white`}`}><BookOpen size={30} /></Link>
                  : <span role="img" aria-label={`${t("Story")}: ${unit.story.title} (${t("locked")})`} className="grid h-[70px] w-[76px] place-items-center rounded-[50%] border-b-8 border-line-dark bg-line text-sub"><BookOpen size={30} /></span>}
                  <p className="mt-1 text-center text-xs font-bold text-sub">{t("Story")}</p></li>
              )}
            </ol>
          </section>
        );
      })}
      {course.status === "starter" && <p className="rounded-2xl bg-sun-soft p-4 text-sm text-sun-dark">{t("This is a starter course with one unit. More units are added as they pass content review.")}</p>}
    </div>
  );
}
export default function LearnPage() { return <AppShell><Path /></AppShell>; }
