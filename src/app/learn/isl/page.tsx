"use client";
import dynamic from "next/dynamic";
import { AppShell } from "@/components/AppShell";
import { Loading } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { ISL_CLASSROOM_ENABLED } from "@/features/isl-classroom/config";
import { ClassroomBoundary } from "@/features/isl-classroom/ClassroomBoundary";

// Current release: live hand tracking only. The full classroom (src/features/isl-classroom/Classroom.tsx) is kept for later.
const HandTrackingDemo = dynamic(() => import("@/features/isl-classroom/HandTrackingDemo").then((m) => m.HandTrackingDemo), { ssr: false, loading: () => <Loading text="Loading hand tracking…" /> });

export default function IslPage() {
  const { t } = useT();
  const off = <div className="rounded-3xl border border-line p-8 text-center"><p className="text-xl font-extrabold">{t("The ISL classroom is taking a short break")}</p><p className="mt-1 text-sub">{t("Please check back soon. Everything else in Speakara works as usual.")}</p></div>;
  return <AppShell rail={false} wide>{ISL_CLASSROOM_ENABLED ? <ClassroomBoundary fallback={off}><HandTrackingDemo /></ClassroomBoundary> : off}</AppShell>;
}
