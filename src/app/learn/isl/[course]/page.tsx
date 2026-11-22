"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, ChevronRight, MessagesSquare } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Notice } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { getIslCourse } from "@/lib/isl/courses";
import { ACTIVITIES, itemId, useIslProgress } from "@/lib/isl/data";

export default function IslCoursePage() {
  const { t } = useT(); const params = useParams<{ course: string }>(); const course = getIslCourse(params.course); const { progress } = useIslProgress();
  if (!course) return <AppShell><Notice tone="error">{t("That course doesn’t exist.")}</Notice></AppShell>;
  return (
    <AppShell wide rail={false}>
      <Link href="/learn/isl" className="mb-2 inline-flex min-h-11 items-center text-sm font-bold text-sub hover:text-ink">← {t("ISL courses")}</Link>
      <PageTitle title={t(course.title)} sub={`${course.level} · ${t(course.tagline)}`} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ol className="space-y-3">{course.units.map((u, i) => {
          const done = ACTIVITIES.filter((a) => progress[itemId(course.id, u.id, a)]).length;
          return (
            <li key={u.id}><Link href={`/learn/isl/${course.id}/${u.id}`} className="group flex items-center gap-4 rounded-3xl border border-line bg-paper p-5 hover:border-ink">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f5f1e8] text-lg font-black text-ink" aria-hidden="true">{i + 1}</span>
              <span className="min-w-0 flex-1"><span className="block text-xs font-bold uppercase tracking-wider text-sub">{t("Unit {n}", { n: i + 1 })}</span>
                <span className="block text-lg font-extrabold" lang={course.id === "spanish" ? "es" : "en"}>{u.title}</span>
                {course.id === "spanish" && <span className="block text-sm text-sub">{u.titleMeaning}</span>}
                <span className="mt-1 block text-xs font-bold text-sub">{done === ACTIVITIES.length ? <span className="text-brand-dark"><Check size={14} className="inline" aria-hidden="true" /> {t("Completed")}</span> : t("{done} of {total} activities", { done, total: ACTIVITIES.length })}</span></span>
              <ChevronRight className="text-sub group-hover:text-ink" aria-hidden="true" />
            </Link></li>
          );
        })}</ol>
        <Link href={`/learn/isl/${course.id}/scenarios`} className="flex h-fit flex-col gap-2 rounded-3xl bg-ink p-6 text-white">
          <MessagesSquare aria-hidden="true" /><span className="text-lg font-extrabold">{t("Real-world scenarios")}</span>
          <span className="text-sm text-white/75">{t("Order at a café, check in at the airport, meet new friends — eight everyday situations.")}</span>
        </Link>
      </div>
    </AppShell>
  );
}
