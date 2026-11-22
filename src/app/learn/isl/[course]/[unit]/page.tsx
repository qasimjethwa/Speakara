"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, Check, ExternalLink, GraduationCap, Hand, Layers, PenLine, Presentation, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Loading, Notice } from "@/components/ui";
import { Flashcards, GrammarView, QuizView, ReadingView, WritingView } from "@/components/isl/Activities";
import { Lesson } from "@/components/isl/Lesson";
import { TeacherPicker } from "@/components/isl/TeacherPicker";
import { useT } from "@/lib/i18n";
import { getIslCourse, getIslUnit, ISLRTC_DICTIONARY } from "@/lib/isl/courses";
import { itemId, useIslProgress, useValidatedClips, type Activity } from "@/lib/isl/data";

const SignTeacher = dynamic(() => import("@/components/isl/SignTeacher").then((m) => m.SignTeacher), { ssr: false, loading: () => <Loading text="Loading your teacher…" /> });
const TABS: { id: Activity; label: string; icon: typeof Hand }[] = [
  { id: "lesson", label: /*i18n*/ "Lesson", icon: Presentation }, { id: "signs", label: /*i18n*/ "Words", icon: Hand },
  { id: "vocab", label: /*i18n*/ "Flashcards", icon: Layers }, { id: "grammar", label: /*i18n*/ "Grammar", icon: GraduationCap },
  { id: "reading", label: /*i18n*/ "Reading", icon: BookOpen }, { id: "writing", label: /*i18n*/ "Writing", icon: PenLine },
  { id: "quiz", label: /*i18n*/ "Quiz", icon: Trophy },
];

export default function IslUnitPage() {
  const { t } = useT(); const params = useParams<{ course: string; unit: string }>();
  const course = getIslCourse(params.course); const unit = course && getIslUnit(course, params.unit);
  const { clips } = useValidatedClips(); const { progress, complete } = useIslProgress();
  const [tab, setTab] = useState<Activity>("lesson"); const [wi, setWi] = useState(0); const [, setSeen] = useState<Set<string>>(new Set());
  const word = unit?.vocab[wi];
  useEffect(() => { if (tab !== "signs" || !word || !course || !unit) return; setSeen((s) => { const n = new Set(s).add(word.id); if (n.size === unit.vocab.length) complete(itemId(course.id, unit.id, "signs"), 100); return n; }); }, [tab, word, course, unit, complete]);
  if (!course || !unit || !word) return <AppShell><Notice tone="error">{t("That lesson doesn’t exist.")}</Notice></AppShell>;
  const lang = course.id === "spanish" ? "es" : "en";
  const done = (a: Activity, score = 100) => complete(itemId(course.id, unit.id, a), score);

  return (
    <AppShell rail={false} wide>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`/learn/isl/${course.id}`} className="inline-flex min-h-11 items-center text-sm font-bold text-sub hover:text-ink">← {t(course.title)}</Link>
          <h1 className="text-2xl font-extrabold" lang={lang}>{unit.title}</h1>
          {course.id === "spanish" && <p className="text-sub">{unit.titleMeaning}</p>}
        </div>
        <TeacherPicker size="sm" />
      </div>
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-line" role="tablist" aria-label={t("Learning modes")}>
        {TABS.map(({ id, label, icon: Icon }) => { const ok = !!progress[itemId(course.id, unit.id, id)]; return (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`-mb-px flex min-h-12 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm font-bold ${tab === id ? "border-ink text-ink" : "border-transparent text-sub hover:text-ink"}`}>
            <Icon size={16} aria-hidden="true" />{t(label)}{ok && <Check size={14} className="text-brand-dark" aria-label={t("Completed")} />}
          </button>); })}
      </div>

      {tab === "lesson" && <Lesson course={course} unit={unit} />}
      {tab === "signs" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <SignTeacher clip={clips[word.sign] ?? null} mood="explaining" targetLang={lang} fallback={{ start: 0, end: 1, text: word.text, meaning: word.meaning, hi: word.hi }} />
          <aside className="space-y-4" aria-label={t("Word details")}>
            <div className="rounded-3xl border border-line bg-paper p-6">
              <p className="text-5xl font-black tracking-tight" lang={lang}>{word.text}</p>
              <p className="mt-2 text-lg">{word.meaning}</p><p className="text-sub" lang="hi">{word.hi}</p>
              <div className="mt-4 border-t border-line pt-4"><p className="font-bold" lang={lang}>{word.example}</p><p className="text-sm text-sub">{word.exampleMeaning}</p></div>
              {!clips[word.sign] && <a href={ISLRTC_DICTIONARY} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-brand-dark underline underline-offset-4">{t("See the official sign in the ISLRTC dictionary")}<ExternalLink size={14} aria-hidden="true" /></a>}
            </div>
            <ol className="grid grid-cols-2 gap-2" aria-label={t("Words in this unit")}>{unit.vocab.map((w, i) => (
              <li key={w.id}><button type="button" onClick={() => setWi(i)} aria-current={i === wi} className={`min-h-12 w-full rounded-2xl border px-3 text-left font-bold ${i === wi ? "border-ink bg-ink text-white" : "border-line bg-paper hover:border-ink"}`}>
                <span lang={lang} className="line-clamp-1">{w.text}</span></button></li>))}</ol>
          </aside>
        </div>
      )}
      <div className="mx-auto max-w-3xl">
        {tab === "vocab" && <Flashcards vocab={unit.vocab} lang={lang} onDone={() => done("vocab")} />}
        {tab === "grammar" && <GrammarView points={unit.grammar} lang={lang} onDone={() => done("grammar")} />}
        {tab === "reading" && <ReadingView reading={unit.reading} lang={lang} onDone={(s) => done("reading", s)} />}
        {tab === "writing" && <WritingView tasks={unit.writing} vocab={unit.vocab} lang={lang} onDone={(s) => done("writing", s)} />}
        {tab === "quiz" && <QuizView quiz={unit.quiz} vocab={unit.vocab} clips={clips} lang={lang} onDone={(s) => done("quiz", s)}
          renderSign={(c) => <SignTeacher clip={c} targetLang={lang} hideCaptions compact fallback={{ start: 0, end: 1, text: "?" }} />} />}
      </div>
    </AppShell>
  );
}
