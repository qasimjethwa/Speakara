"use client";
import Link from "next/link";
import { BookOpen, Check, Lock } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { useStore } from "@/lib/state/store";
import { getCourse, lessonKey } from "@/lib/content";

export default function Stories() {
  const { state } = useStore(); const course = getCourse(state.profile.courseId);
  const stories = course.units.filter((u) => u.story).map((u) => ({ u, s: u.story!, open: u.lessons.every((l) => state.completed[lessonKey(course.id, l.id)]) }));
  return (
    <AppShell>
      <PageTitle title="Stories" sub="Short dialogues that use what you’ve learned. Finish a unit to open its story." />
      {stories.length === 0 && <p className="rounded-2xl bg-sun-soft p-4">This starter course doesn’t have stories yet. They’re added as each unit passes content review.</p>}
      <div className="grid gap-4 sm:grid-cols-2">{stories.map(({ u, s, open }) => {
        const done = !!state.stories[s.id];
        const inner = <><span className={`mb-3 grid h-16 w-16 place-items-center rounded-2xl ${open ? "bg-sun-soft text-sun-dark" : "bg-line text-sub"}`}>{done ? <Check size={30} strokeWidth={3} /> : open ? <BookOpen size={30} /> : <Lock size={26} />}</span><span className="block text-lg font-extrabold" lang={course.ttsLang}>{s.title}</span><span className="block text-sm text-sub">{s.summary}</span><span className="mt-2 block text-xs font-extrabold uppercase text-sub">{open ? (done ? "Read again · +12 XP" : "+12 XP") : `Finish Unit ${course.units.indexOf(u) + 1} to open`}</span></>;
        return open ? <Link key={s.id} href={`/story?id=${s.id}`} className="key rounded-2xl border-2 border-b-4 border-line-dark p-5">{inner}</Link> : <div key={s.id} className="rounded-2xl border-2 border-line bg-mist p-5">{inner}</div>;
      })}</div>
    </AppShell>
  );
}
