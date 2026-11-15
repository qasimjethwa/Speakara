"use client";
import Link from "next/link";
import { BookOpen, Check, Lock } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Notice } from "@/components/ui";
import { useStore } from "@/lib/state/store";
import { getCourse, lessonKey } from "@/lib/content";
import { useT } from "@/lib/i18n";

export default function Stories() {
  const { state } = useStore(); const { t } = useT(); const course = getCourse(state.profile.courseId);
  const stories = course.units.filter((u) => u.story).map((u) => ({ u, s: u.story!, open: u.lessons.every((l) => state.completed[lessonKey(course.id, l.id)]) }));
  return (
    <AppShell>
      <PageTitle title={t("Stories")} sub={t("Short dialogues that use what you’ve learned. Finish a unit to open its story.")} />
      {stories.length === 0 && <Notice tone="warn">{t("This starter course doesn’t have stories yet. They’re added as each unit passes content review.")}</Notice>}
      <ul className="grid gap-4 sm:grid-cols-2">{stories.map(({ u, s, open }) => {
        const done = !!state.stories[s.id];
        const inner = <><span className={`mb-3 grid h-16 w-16 place-items-center rounded-2xl ${open ? "bg-sun-soft text-sun-dark" : "bg-line text-sub"}`} aria-hidden="true">{done ? <Check size={30} strokeWidth={3} /> : open ? <BookOpen size={30} /> : <Lock size={26} />}</span><span className="block text-lg font-extrabold" lang={course.ttsLang}>{s.title}</span><span className="block text-sm text-sub">{s.summary}</span><span className="mt-2 block text-xs font-extrabold uppercase text-sub">{open ? (done ? t("Read again") : "+12 XP") : t("Finish Unit {n} to open", { n: course.units.indexOf(u) + 1 })}</span></>;
        return <li key={s.id}>{open ? <Link href={`/story?id=${s.id}`} className="key block h-full rounded-2xl border-2 border-b-4 border-line-dark p-5">{inner}</Link> : <div className="h-full rounded-2xl border-2 border-line bg-mist p-5">{inner}</div>}</li>;
      })}</ul>
    </AppShell>
  );
}
