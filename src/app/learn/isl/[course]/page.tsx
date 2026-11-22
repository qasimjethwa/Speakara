"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Notice } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { getIslCourse } from "@/lib/isl/courses";
import { ACTIVITIES, itemId, useIslProgress } from "@/lib/isl/data";

export default function IslCoursePage() {
  const { t } = useT(); const params = useParams<{ course: string }>(); const course = getIslCourse(params.course); const { progress } = useIslProgress();
  if (!course) return <AppShell><Notice tone="error">{t("That course doesn’t exist.")}</Notice></AppShell>;
  return (
    <AppShell>
      <Link href="/learn/isl" className="mb-3 inline-flex min-h-11 items-center text-sm font-extrabold uppercase text-sky-dark">← {t("ISL courses")}</Link>
      <PageTitle title={`${course.flag} ${t(course.title)}`} sub={`${course.level} · ${t(course.tagline)}`} />
      <ol className="space-y-3">{course.units.map((u, i) => {
        const done = ACTIVITIES.filter((a) => progress[itemId(course.id, u.id, a)]).length;
        return (
          <li key={u.id}><Link href={`/learn/isl/${course.id}/${u.id}`} className="key flex items-center gap-4 rounded-2xl border-2 border-b-4 border-line bg-paper p-4 hover:bg-mist">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-grape-soft text-3xl" aria-hidden="true">{u.emoji}</span>
            <span className="min-w-0 flex-1"><span className="block text-xs font-extrabold uppercase text-sub">{t("Unit {n}", { n: i + 1 })}</span>
              <span className="block font-extrabold" lang={course.id === "spanish" ? "es" : "en"}>{u.title}</span>
              {course.id === "spanish" && <span className="block text-sm text-sub">{u.titleMeaning}</span>}
              <span className="mt-1 block text-xs font-bold text-sub">{done === ACTIVITIES.length ? <span className="text-brand-dark"><Check size={14} className="inline" aria-hidden="true" /> {t("Completed")}</span> : t("{done} of {total} activities", { done, total: ACTIVITIES.length })}</span></span>
            <ChevronRight className="text-sub" aria-hidden="true" />
          </Link></li>
        );
      })}</ol>
    </AppShell>
  );
}
