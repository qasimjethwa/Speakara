"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Volume2 } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { LinkButton, Loading } from "@/components/ui";
import { useStore } from "@/lib/state/store";
import { getCourse } from "@/lib/content";
import { say } from "@/lib/audio";
import { useT } from "@/lib/i18n";

function Guide() {
  const { state } = useStore(); const { t: tr } = useT(); const course = getCourse(state.profile.courseId);
  const unit = course.units.find((u) => u.id === useSearchParams().get("unit")) ?? course.units[0];
  const Row = ({ t, n }: { t: string; n: string }) => (
    <li className="flex items-center gap-3 p-3"><button aria-label={tr("Hear {word}", { word: t })} onClick={() => void say(t, course.ttsLang, state.profile.slowAudio ? 0.75 : 1)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-soft text-sky-dark"><Volume2 size={18} /></button><span><span className="block font-extrabold" lang={course.ttsLang}>{t}</span><span className="block text-sm text-sub">{n}</span></span></li>
  );
  return (
    <>
      <PageTitle title={`${tr("Guidebook")} · ${unit.title}`} sub={`${unit.objective} · CEFR ${unit.cefr}`} />
      <h2 className="mb-3 text-lg">{tr("Tips")}</h2>
      <div className="space-y-4">{unit.tips.map((t) => (
        <section key={t.title} className="rounded-2xl border-2 border-line p-4"><h3 className="text-lg text-brand-dark">{t.title}</h3><p className="mt-1">{t.body}</p><ul className="mt-3 divide-y-2 divide-line rounded-xl bg-mist">{t.examples.map((e) => <Row key={e.t} {...e} />)}</ul></section>
      ))}</div>
      <h2 className="mb-3 mt-8 text-lg">{tr("Key phrases")}</h2>
      <ul className="divide-y-2 divide-line rounded-2xl border-2 border-line">{unit.lessons.flatMap((l) => l.sentences).map((s) => <Row key={s.id} t={s.t} n={s.n} />)}</ul>
      <LinkButton href="/learn" variant="secondary" className="mt-6 w-full">{tr("Back to the path")}</LinkButton>
    </>
  );
}
export default function Guidebook() { return <AppShell rail={false}><Suspense fallback={<Loading />}><Guide /></Suspense></AppShell>; }
