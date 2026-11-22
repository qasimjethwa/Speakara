"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Notice } from "@/components/ui";
import { SCENE_ICONS, sceneItemId } from "@/components/isl/ScenarioPlayer";
import { useT } from "@/lib/i18n";
import { getIslCourse } from "@/lib/isl/courses";
import { useIslProgress } from "@/lib/isl/data";
import { scenariosFor } from "@/lib/isl/scenarios";

export default function IslScenarios() {
  const { t } = useT(); const params = useParams<{ course: string }>(); const course = getIslCourse(params.course); const { progress } = useIslProgress();
  if (!course) return <AppShell><Notice tone="error">{t("That course doesn’t exist.")}</Notice></AppShell>;
  return (
    <AppShell wide rail={false}>
      <Link href={`/learn/isl/${course.id}`} className="mb-2 inline-flex min-h-11 items-center text-sm font-bold text-sub hover:text-ink">← {t(course.title)}</Link>
      <PageTitle title={t("Real-world scenarios")} sub={t("Practise {lang} in everyday situations, with your teacher beside you.", { lang: t(course.target) })} />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{scenariosFor(course.id).map((s) => { const Icon = SCENE_ICONS[s.icon]; const done = progress[sceneItemId(course.id, s.id)]; return (
        <li key={s.id}><Link href={`/learn/isl/${course.id}/scenarios/${s.id}`} className="flex h-full min-h-40 flex-col rounded-3xl border border-line bg-paper p-5 hover:border-ink">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f1e8] text-ink"><Icon size={24} aria-hidden="true" /></span>
          <span className="mt-4 text-lg font-extrabold">{t(s.title)}</span><span className="text-sm text-sub">{t(s.place)}</span>
          <span className="mt-auto flex items-center pt-3 text-sm font-bold">{done ? <span className="flex items-center gap-1 text-brand-dark"><Check size={16} aria-hidden="true" />{t("Completed")}</span> : <span className="text-sub">{t("Start")}</span>}<ChevronRight size={16} className="ml-auto text-sub" aria-hidden="true" /></span>
        </Link></li>); })}</ul>
    </AppShell>
  );
}
