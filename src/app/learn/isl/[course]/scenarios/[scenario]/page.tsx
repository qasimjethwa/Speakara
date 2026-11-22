"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Notice } from "@/components/ui";
import { ScenarioPlayer } from "@/components/isl/ScenarioPlayer";
import { useT } from "@/lib/i18n";
import { getIslCourse } from "@/lib/isl/courses";
import { getScenario } from "@/lib/isl/scenarios";

export default function IslScenario() {
  const { t } = useT(); const params = useParams<{ course: string; scenario: string }>();
  const course = getIslCourse(params.course); const scenario = course && getScenario(course.id, params.scenario);
  if (!course || !scenario) return <AppShell><Notice tone="error">{t("That scenario doesn’t exist.")}</Notice></AppShell>;
  return (
    <AppShell wide rail={false}>
      <Link href={`/learn/isl/${course.id}/scenarios`} className="mb-3 inline-flex min-h-11 items-center text-sm font-bold text-sub hover:text-ink">← {t("Real-world scenarios")}</Link>
      <ScenarioPlayer key={scenario.id} course={course} scenario={scenario} />
    </AppShell>
  );
}
