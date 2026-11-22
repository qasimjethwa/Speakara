"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, Check, ExternalLink, GraduationCap, Hand, Layers, PenLine, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, Loading, Notice } from "@/components/ui";
import { Flashcards, GrammarView, QuizView, ReadingView, StatusBadge, WritingView } from "@/components/isl/Activities";
import { useT } from "@/lib/i18n";
import { getIslCourse, getIslUnit, ISLRTC_DICTIONARY } from "@/lib/isl/courses";
import { ACTIVITIES, itemId, useIslProgress, useValidatedClips, type Activity } from "@/lib/isl/data";
import { MOTION_TEST } from "@/lib/isl/rig";

const SignTeacher = dynamic(() => import("@/components/isl/SignTeacher").then((m) => m.SignTeacher), { ssr: false, loading: () => <Loading text="Loading the signing teacher…" /> });
const TABS: { id: Activity; label: string; icon: typeof Hand }[] = [
  { id: "signs", label: /*i18n*/ "Signs", icon: Hand }, { id: "vocab", label: /*i18n*/ "Flashcards", icon: Layers },
  { id: "grammar", label: /*i18n*/ "Grammar", icon: GraduationCap }, { id: "reading", label: /*i18n*/ "Reading", icon: BookOpen },
  { id: "writing", label: /*i18n*/ "Writing", icon: PenLine }, { id: "quiz", label: /*i18n*/ "Quiz", icon: Trophy },
];

export default function IslUnitPage() {
  const { t } = useT(); const params = useParams<{ course: string; unit: string }>();
  const course = getIslCourse(params.course); const unit = course && getIslUnit(course, params.unit);
  const { clips } = useValidatedClips(); const { progress, complete } = useIslProgress();
  const [tab, setTab] = useState<Activity>("signs"); const [wi, setWi] = useState(0); const [seen, setSeen] = useState<Set<string>>(new Set());
  const [demo, setDemo] = useState(false);
  const word = unit?.vocab[wi];
  useEffect(() => { if (!word || !course || !unit) return; setSeen((s) => { const n = new Set(s).add(word.id); if (n.size === unit.vocab.length) complete(itemId(course.id, unit.id, "signs"), 100); return n; }); }, [word, course, unit, complete]);
  if (!course || !unit || !word) return <AppShell><Notice tone="error">{t("That lesson doesn’t exist.")}</Notice></AppShell>;
  const lang = course.id === "spanish" ? "es" : "en";
  const done = (a: Activity, score = 100) => complete(itemId(course.id, unit.id, a), score);
  const clip = demo ? MOTION_TEST : clips[word.sign] ?? null;

  return (
    <AppShell rail={false} wide>
      <Link href={`/learn/isl/${course.id}`} className="mb-2 inline-flex min-h-11 items-center text-sm font-extrabold uppercase text-sky-dark">← {t(course.title)}</Link>
      <h1 className="mb-1 text-2xl" lang={lang}><span aria-hidden="true">{unit.emoji} </span>{unit.title}</h1>
      {course.id === "spanish" && <p className="mb-3 text-sub">{unit.titleMeaning}</p>}
      <div className="mb-4 flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label={t("Learning modes")}>
        {TABS.map(({ id, label, icon: Icon }) => { const ok = !!progress[itemId(course.id, unit.id, id)]; return (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border-2 px-3 text-sm font-extrabold ${tab === id ? "border-sky bg-sky-soft text-sky-dark" : "border-line"}`}>
            <Icon size={16} aria-hidden="true" />{t(label)}{ok && <Check size={14} className="text-brand-dark" aria-label={t("Completed")} />}
          </button>); })}
      </div>

      {tab === "signs" && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <SignTeacher clip={clip} targetLang={lang} fallback={{ start: 0, end: 1, text: word.text, meaning: word.meaning, hi: word.hi }} />
            <label className="mt-3 flex min-h-11 items-center gap-2 text-sm text-sub"><input type="checkbox" className="h-5 w-5" checked={demo} onChange={(e) => setDemo(e.target.checked)} />{t("Preview the player with a motion test (not a sign)")}</label>
          </div>
          <aside className="space-y-3" aria-label={t("Word details")}>
            <Card className="space-y-2 text-center">
              <span className="text-6xl" role="img" aria-label={word.meaning}>{word.emoji}</span>
              <p className="text-2xl font-black" lang={lang}>{word.text}</p>
              <p className="font-bold">{word.meaning}</p><p className="text-sub" lang="hi">{word.hi}</p>
              <StatusBadge clip={clips[word.sign]} />
              <p className="rounded-xl bg-mist p-2 text-left text-sm"><span lang={lang} className="font-bold">“{word.example}”</span><span className="block text-sub">{word.exampleMeaning}</span></p>
              <a href={ISLRTC_DICTIONARY} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-sm font-extrabold text-sky-dark underline">{t("Official sign in the ISLRTC dictionary")}<ExternalLink size={14} aria-hidden="true" /></a>
            </Card>
            <ol className="grid grid-cols-4 gap-2 lg:grid-cols-2" aria-label={t("Words in this unit")}>{unit.vocab.map((w, i) => (
              <li key={w.id}><button type="button" onClick={() => { setWi(i); setDemo(false); }} aria-current={i === wi} className={`flex min-h-16 w-full flex-col items-center justify-center rounded-xl border-2 p-1 text-xs font-bold ${i === wi ? "border-sky bg-sky-soft" : "border-line"} ${seen.has(w.id) ? "" : "opacity-80"}`}>
                <span className="text-2xl" aria-hidden="true">{w.emoji}</span><span lang={lang} className="line-clamp-1">{w.text}</span></button></li>))}</ol>
          </aside>
        </div>
      )}
      {tab === "vocab" && <Flashcards vocab={unit.vocab} lang={lang} onDone={() => done("vocab")} />}
      {tab === "grammar" && <GrammarView points={unit.grammar} lang={lang} onDone={() => done("grammar")} />}
      {tab === "reading" && <ReadingView reading={unit.reading} lang={lang} onDone={(s) => done("reading", s)} />}
      {tab === "writing" && <WritingView tasks={unit.writing} lang={lang} onDone={(s) => done("writing", s)} />}
      {tab === "quiz" && <QuizView quiz={unit.quiz} vocab={unit.vocab} clips={clips} lang={lang} onDone={(s) => done("quiz", s)}
        renderSign={(c) => <SignTeacher clip={c} targetLang={lang} hideCaptions fallback={{ start: 0, end: 1, text: "?" }} />} />}
    </AppShell>
  );
}
