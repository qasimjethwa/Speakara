"use client";
import Link from "next/link";
import { Camera, ChevronRight, Hand, PenTool, Type } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Card, Notice, ProgressBar } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { ISL_COURSES, ISLRTC_DICTIONARY } from "@/lib/isl/courses";
import { ACTIVITIES, itemId, useIslProgress } from "@/lib/isl/data";
import { useStore } from "@/lib/state/store";

/** ISL learning dashboard: English and Spanish, both taught through Indian Sign Language. */
export default function IslHome() {
  const { t } = useT(); const { progress } = useIslProgress(); const { state } = useStore();
  const staff = state.profile.role !== "learner";
  return (
    <AppShell>
      <PageTitle title={t("Learn through Indian Sign Language")} sub={t("Every Deaf person deserves the opportunity to learn a new language.")} />
      <div className="space-y-4">
        {ISL_COURSES.map((c) => {
          const total = c.units.length * ACTIVITIES.length; const done = c.units.reduce((n, u) => n + ACTIVITIES.filter((a) => progress[itemId(c.id, u.id, a)]).length, 0);
          return (
            <Link key={c.id} href={`/learn/isl/${c.id}`} className="key flex items-center gap-4 rounded-3xl border-2 border-b-4 border-line bg-paper p-5 hover:bg-mist">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sky-soft text-4xl" aria-hidden="true">{c.flag}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-extrabold">{t(c.title)}</span>
                <span className="block text-sm text-sub">{t(c.tagline)}</span>
                <span className="mt-2 flex items-center gap-2 text-xs font-bold text-sub"><ProgressBar value={done / total} className="!h-2.5" label={t("Progress")} />{done}/{total}</span>
              </span>
              <ChevronRight className="text-sub" aria-hidden="true" />
            </Link>
          );
        })}
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/learn/isl/fingerspelling" className="flex min-h-16 items-center gap-3 rounded-2xl border-2 border-line p-4 font-extrabold hover:bg-mist"><Type aria-hidden="true" />{t("Fingerspelling")}</Link>
          <Link href="/learn/isl/practice" className="flex min-h-16 items-center gap-3 rounded-2xl border-2 border-line p-4 font-extrabold hover:bg-mist"><Camera aria-hidden="true" />{t("Camera practice")}</Link>
          {staff && <Link href="/learn/isl/studio" className="flex min-h-16 items-center gap-3 rounded-2xl border-2 border-line p-4 font-extrabold hover:bg-mist sm:col-span-2"><PenTool aria-hidden="true" />{t("Sign Studio (ISL educators)")}</Link>}
        </div>
        <Card className="space-y-2">
          <h2 className="flex items-center gap-2 text-lg"><Hand aria-hidden="true" />{t("About the signs")}</h2>
          <p className="text-sm text-sub">{t("Indian Sign Language is the language of instruction. Signs are recorded by ISL educators and only marked as validated after review by Deaf ISL signers. Until a sign is reviewed, it is clearly marked as awaiting validation.")}</p>
          <p className="text-sm text-sub">{t("You can always look up the official sign in the ISL Dictionary by the Indian Sign Language Research and Training Centre (ISLRTC), DEPwD, Government of India.")} <a className="font-extrabold text-sky-dark underline" href={ISLRTC_DICTIONARY} target="_blank" rel="noopener noreferrer">{t("Open the ISLRTC dictionary")}</a></p>
        </Card>
        <Notice tone="info">{t("Every activity works without sound. Captions are always on, and you can change their size and contrast.")}</Notice>
      </div>
    </AppShell>
  );
}
