"use client";
import Link from "next/link";
import { Camera, ChevronRight, MessagesSquare, PenTool, Type } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { TeacherPicker } from "@/components/isl/TeacherPicker";
import { useT } from "@/lib/i18n";
import { ISL_COURSES, ISLRTC_DICTIONARY } from "@/lib/isl/courses";
import { ACTIVITIES, itemId, useIslProgress, useTeacherPref } from "@/lib/isl/data";
import { useStore } from "@/lib/state/store";

/** ISL learning home: choose a teacher, then English or Spanish, both taught through Indian Sign Language. */
export default function IslHome() {
  const { t } = useT(); const { progress } = useIslProgress(); const { state } = useStore(); const [, , chosen] = useTeacherPref();
  const staff = state.profile.role !== "learner";
  const teacherCard = (
    <section className="rounded-[28px] border border-line bg-paper p-5" aria-labelledby="teacher-h">
      <h2 id="teacher-h" className="text-lg font-extrabold">{chosen ? t("Your teacher") : t("Choose your teacher")}</h2>
      <p className="mb-4 text-sm text-sub">{t("Both teachers sign the same reviewed lessons. You can change this any time.")}</p>
      <TeacherPicker />
    </section>
  );
  return (
    <AppShell wide rail={false}>
      <PageTitle title={t("Learn through Indian Sign Language")} sub={t("Every Deaf person deserves the opportunity to learn a new language.")} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          {!chosen && <div className="lg:hidden">{teacherCard}</div>}
          {ISL_COURSES.map((c) => {
            const total = c.units.length * ACTIVITIES.length; const done = c.units.reduce((n, u) => n + ACTIVITIES.filter((a) => progress[itemId(c.id, u.id, a)]).length, 0);
            return (
              <Link key={c.id} href={`/learn/isl/${c.id}`} className="group flex items-center gap-5 rounded-[28px] border border-line bg-paper p-6 hover:border-ink">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-ink text-xl font-black tracking-wide text-white" aria-hidden="true">{c.id === "spanish" ? "ES" : "EN"}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xl font-extrabold">{t(c.title)}</span>
                  <span className="block text-sub">{t(c.tagline)}</span>
                  <span className="mt-3 flex items-center gap-3 text-xs font-bold text-sub"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line" aria-hidden="true"><span className="block h-full rounded-full bg-brand" style={{ width: `${(done / total) * 100}%` }} /></span><span>{t("{done} of {total} activities", { done, total })}</span></span>
                </span>
                <ChevronRight className="text-sub group-hover:text-ink" aria-hidden="true" />
              </Link>
            );
          })}
          <div className="grid gap-3 sm:grid-cols-3">
            {[["/learn/isl/english/scenarios", MessagesSquare, t("Real-world scenarios")], ["/learn/isl/fingerspelling", Type, t("Fingerspelling")], ["/learn/isl/practice", Camera, t("Camera practice")]].map(([href, Icon, label]) => {
              const I = Icon as typeof Camera; return <Link key={href as string} href={href as string} className="flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-paper p-4 font-bold hover:border-ink"><I size={20} aria-hidden="true" />{label as string}</Link>; })}
            {staff && <Link href="/learn/isl/studio" className="flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-paper p-4 font-bold hover:border-ink sm:col-span-3"><PenTool size={20} aria-hidden="true" />{t("Sign Studio (ISL educators)")}</Link>}
          </div>
          <section className="rounded-[28px] bg-[#f5f1e8] p-6 text-sm">
            <h2 className="mb-2 text-base font-extrabold">{t("About the signs")}</h2>
            <p className="text-sub">{t("Indian Sign Language is the language of instruction. Every sign your teacher shows has been recorded by ISL educators and reviewed by Deaf ISL signers. Words are always shown in writing too, with captions you can resize.")}</p>
            <p className="mt-2 text-sub">{t("You can always look up the official sign in the ISL Dictionary by the Indian Sign Language Research and Training Centre (ISLRTC), DEPwD, Government of India.")} <a className="font-bold text-ink underline underline-offset-4" href={ISLRTC_DICTIONARY} target="_blank" rel="noopener noreferrer">{t("Open the ISLRTC dictionary")}</a></p>
          </section>
        </div>
        <aside className={chosen ? "" : "hidden lg:block"}>{teacherCard}</aside>
      </div>
    </AppShell>
  );
}
