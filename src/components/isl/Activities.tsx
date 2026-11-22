"use client";
import { useMemo, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { Button, Card, Notice } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { checkWritten, type GrammarPoint, type QuizItem, type Reading, type VocabItem, type WritingTask } from "@/lib/isl/courses";
import type { SignClip } from "@/lib/isl/rig";

const opt = (on: boolean, ok?: boolean) => `min-h-12 w-full rounded-2xl border-2 border-b-4 px-4 py-2 text-left font-bold ${ok === true ? "border-brand bg-brand-soft" : ok === false ? "border-coral bg-coral-soft" : on ? "border-sky bg-sky-soft" : "border-line bg-paper"}`;

function MultipleChoice({ items, lang, onDone }: { items: QuizItem[]; lang: string; onDone: (score: number) => void }) {
  const { t } = useT();
  const [i, setI] = useState(0); const [pick, setPick] = useState<number | null>(null); const [right, setRight] = useState(0); const [done, setDone] = useState(false);
  if (done) return <Card className="text-center"><p className="text-2xl font-black">{right} / {items.length}</p><p className="text-sub">{t("Finished!")}</p><Button className="mt-3" variant="secondary" onClick={() => { setI(0); setPick(null); setRight(0); setDone(false); }}><RotateCcw size={18} aria-hidden="true" />{t("Try again")}</Button></Card>;
  const q = items[i];
  return (
    <Card>
      <p className="mb-1 text-sm font-bold text-sub">{i + 1} / {items.length}</p>
      <p className="mb-3 text-lg font-extrabold" lang={lang}>{q.q}</p>
      <div className="space-y-2">{q.options.map((o, k) => <button key={k} type="button" disabled={pick !== null} onClick={() => { setPick(k); if (k === q.answer) setRight((r) => r + 1); }} className={opt(pick === k, pick === null ? undefined : k === q.answer ? true : pick === k ? false : undefined)} lang={lang}>{o}</button>)}</div>
      {pick !== null && <div className="mt-3 space-y-2">
        <Notice tone={pick === q.answer ? "success" : "error"}>{pick === q.answer ? t("Correct!") : t("Not quite. The answer is: {a}", { a: q.options[q.answer] })}{q.why ? ` ${q.why}` : ""}</Notice>
        <Button onClick={() => { if (i + 1 >= items.length) { setDone(true); onDone(Math.round(((right) / items.length) * 100)); } else { setI(i + 1); setPick(null); } }}>{i + 1 >= items.length ? t("Finish") : t("Next")}</Button>
      </div>}
    </Card>
  );
}

export function Flashcards({ vocab, lang, onDone }: { vocab: VocabItem[]; lang: string; onDone: () => void }) {
  const { t } = useT();
  const [i, setI] = useState(0); const [flip, setFlip] = useState(false); const [again, setAgain] = useState<string[]>([]);
  const deck = vocab; const w = deck[i % deck.length];
  const next = (knew: boolean) => { if (!knew) setAgain((a) => [...new Set([...a, w.id])]); setFlip(false); if (i + 1 >= deck.length) onDone(); setI(i + 1); };
  return (
    <div className="space-y-3">
      <button type="button" onClick={() => setFlip(!flip)} aria-label={t("Flip card")} className="key flex min-h-64 w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-b-4 border-line bg-paper p-6 text-center">
        <span className="text-6xl" aria-hidden="true">{w.emoji}</span>
        {!flip ? <span className="text-3xl font-black" lang={lang}>{w.text}</span> : <>
          <span className="text-xl font-extrabold">{w.meaning}</span><span className="text-lg text-sub" lang="hi">{w.hi}</span>
          <span className="mt-2 text-base" lang={lang}>“{w.example}”</span><span className="text-sm text-sub">{w.exampleMeaning}</span>
        </>}
        <span className="text-xs text-sub">{flip ? t("Tap to see the word") : t("Tap to see the meaning")}</span>
      </button>
      <div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={() => next(false)}>{t("Again later")}</Button><Button className="flex-1" onClick={() => next(true)}>{t("I know it")}</Button></div>
      <p className="text-center text-sm text-sub">{Math.min(i + 1, deck.length)} / {deck.length}{again.length ? ` · ${t("{n} to revise", { n: again.length })}` : ""}</p>
    </div>
  );
}

export function GrammarView({ points, lang, onDone }: { points: GrammarPoint[]; lang: string; onDone: () => void }) {
  const { t } = useT();
  return (
    <div className="space-y-4">
      {points.map((g, i) => (
        <Card key={i} className="space-y-3">
          <h3 className="text-lg" lang={lang}>{g.title}</h3>
          <p>{g.target}</p>
          <div className="rounded-2xl bg-grape-soft p-3"><p className="text-sm font-extrabold text-grape-dark">{t("How ISL does it")}</p><p className="text-sm">{g.isl}</p></div>
          <ul className="space-y-2">{g.examples.map((e, k) => <li key={k} className="rounded-xl border-2 border-line p-2"><span className="font-extrabold" lang={lang}>{e.text}</span><span className="block text-sm text-sub">{e.meaning}</span>{e.isl && <span className="block text-xs font-bold text-grape-dark">{t("ISL gloss (word order, not a translation)")}: {e.isl}</span>}</li>)}</ul>
        </Card>
      ))}
      <Notice tone="info">{t("A signed ISL explanation of this grammar will appear here once Deaf ISL educators have recorded and reviewed it.")}</Notice>
      <Button onClick={onDone}><Check size={18} aria-hidden="true" />{t("I’ve studied this")}</Button>
    </div>
  );
}

export function ReadingView({ reading, lang, onDone }: { reading: Reading; lang: string; onDone: (score: number) => void }) {
  const { t } = useT();
  const [show, setShow] = useState<"none" | "en" | "hi">("none");
  return (
    <div className="space-y-4">
      <Card>
        <h3 className="mb-3 text-xl" lang={lang}><span aria-hidden="true">{reading.emoji} </span>{reading.title}</h3>
        <div className="mb-3 flex flex-wrap gap-2 text-sm">{(["none", "en", "hi"] as const).map((m) => <button key={m} type="button" aria-pressed={show === m} onClick={() => setShow(m)} className={`min-h-11 rounded-xl border-2 px-3 font-bold ${show === m ? "border-sky bg-sky-soft" : "border-line"}`}>{m === "none" ? t("Text only") : m === "en" ? t("With English") : t("With Hindi")}</button>)}</div>
        <div className="space-y-3">{reading.sentences.map((s, i) => <p key={i} className="text-lg leading-relaxed"><span lang={lang}>{s.text}</span>{show === "en" && <span className="block text-sm text-sub">{s.meaning}</span>}{show === "hi" && <span className="block text-sm text-sub" lang="hi">{s.hi}</span>}</p>)}</div>
      </Card>
      <h3 className="text-lg">{t("Check your understanding")}</h3>
      <MultipleChoice items={reading.questions} lang={lang} onDone={onDone} />
    </div>
  );
}

function ArrangeTask({ task, lang, onResult }: { task: Extract<WritingTask, { kind: "arrange" }>; lang: string; onResult: (ok: boolean) => void }) {
  const { t } = useT();
  const [picked, setPicked] = useState<number[]>([]); const [checked, setChecked] = useState<boolean | null>(null);
  const built = picked.map((k) => task.words[k]).join(" ");
  return (<div className="space-y-3">
    <div className="min-h-14 rounded-2xl border-2 border-dashed border-line-dark p-2" lang={lang}>{picked.map((k, j) => <button key={j} type="button" onClick={() => { setPicked(picked.filter((_, x) => x !== j)); setChecked(null); }} className="m-1 min-h-11 rounded-xl border-2 border-b-4 border-line bg-paper px-3 font-bold">{task.words[k]}</button>)}</div>
    <div lang={lang}>{task.words.map((w, k) => <button key={k} type="button" disabled={picked.includes(k)} onClick={() => { setPicked([...picked, k]); setChecked(null); }} className="m-1 min-h-11 rounded-xl border-2 border-b-4 border-line bg-paper px-3 font-bold disabled:opacity-30">{w}</button>)}</div>
    <Button disabled={!picked.length} onClick={() => { const ok = checkWritten(built, [task.answer]); setChecked(ok); onResult(ok); }}>{t("Check")}</Button>
    {checked !== null && <Notice tone={checked ? "success" : "error"}>{checked ? t("Correct!") : t("Not quite. The answer is: {a}", { a: task.answer })}</Notice>}
  </div>);
}

function TypedTask({ task, lang, onResult }: { task: Exclude<WritingTask, { kind: "arrange" }>; lang: string; onResult: (ok: boolean) => void }) {
  const { t } = useT();
  const [val, setVal] = useState(""); const [checked, setChecked] = useState<boolean | null>(null);
  return (<div className="space-y-3">
    {task.kind === "fill" && <p className="text-xl font-bold" lang={lang}>{task.before} <span className="inline-block min-w-16 border-b-4 border-sky text-center">{val || "…"}</span> {task.after}</p>}
    {task.kind === "correct" && <p className="text-xl font-bold text-coral-dark line-through" lang={lang}>{task.wrong}</p>}
    {task.kind === "picture" && <p className="text-7xl" role="img" aria-label={t("Picture")}>{task.emoji}</p>}
    <label className="block"><span className="sr-only">{t("Your answer")}</span>
      <input value={val} onChange={(e) => { setVal(e.target.value); setChecked(null); }} lang={lang} autoCapitalize="none" autoComplete="off" spellCheck={false}
        className="w-full rounded-2xl border-2 border-line-dark bg-mist px-4 py-3 text-lg font-semibold focus:border-sky-dark focus:bg-paper focus:outline-none" placeholder={t("Type your answer")} /></label>
    <Button disabled={!val.trim()} onClick={() => { const ok = checkWritten(val, task.answer); setChecked(ok); onResult(ok); }}>{t("Check")}</Button>
    {checked !== null && <Notice tone={checked ? "success" : "error"}>{checked ? t("Correct!") : t("Not quite. The answer is: {a}", { a: task.answer[0] })}{task.kind === "correct" && !checked ? ` ${task.why}` : ""}{task.kind === "fill" && !checked ? ` (${task.hint})` : ""}</Notice>}
  </div>);
}

export function WritingView({ tasks, lang, onDone }: { tasks: WritingTask[]; lang: string; onDone: (score: number) => void }) {
  const { t } = useT();
  const [i, setI] = useState(0); const [results, setResults] = useState<Record<number, boolean>>({});
  const task = tasks[i]; const answered = results[i] !== undefined;
  return (
    <Card className="space-y-3">
      <p className="text-sm font-bold text-sub">{i + 1} / {tasks.length}</p>
      <p className="text-lg font-extrabold">{task.prompt}</p>
      {task.kind === "arrange" ? <ArrangeTask key={i} task={task} lang={lang} onResult={(ok) => setResults((r) => ({ ...r, [i]: r[i] ?? ok }))} />
        : <TypedTask key={i} task={task} lang={lang} onResult={(ok) => setResults((r) => ({ ...r, [i]: r[i] ?? ok }))} />}
      {answered && <Button variant="secondary" onClick={() => { if (i + 1 >= tasks.length) onDone(Math.round((Object.values(results).filter(Boolean).length / tasks.length) * 100)); else setI(i + 1); }}>{i + 1 >= tasks.length ? t("Finish") : t("Next")}</Button>}
    </Card>
  );
}

export function QuizView({ quiz, vocab, clips, lang, onDone, renderSign }: { quiz: QuizItem[]; vocab: VocabItem[]; clips: Record<string, SignClip>; lang: string; onDone: (score: number) => void; renderSign: (clip: SignClip) => React.ReactNode }) {
  const { t } = useT();
  // Sign comprehension questions only for signs that Deaf reviewers have validated.
  const signed = useMemo(() => vocab.filter((w) => clips[w.sign]), [vocab, clips]);
  const [stage, setStage] = useState<"signs" | "written">(signed.length ? "signs" : "written");
  const [si, setSi] = useState(0); const [pick, setPick] = useState<string | null>(null); const [signScore, setSignScore] = useState(0);
  if (stage === "signs" && signed.length) {
    const w = signed[si]; const options = [w, ...vocab.filter((x) => x.id !== w.id).slice(0, 3)].sort((a, b) => a.id.localeCompare(b.id));
    return (<div className="space-y-3">
      <h3 className="text-lg">{t("Watch the sign and choose its meaning")}</h3>
      {renderSign(clips[w.sign])}
      <div className="space-y-2">{options.map((o) => <button key={o.id} type="button" disabled={!!pick} onClick={() => { setPick(o.id); if (o.id === w.id) setSignScore((s) => s + 1); }} className={opt(pick === o.id, pick ? (o.id === w.id ? true : pick === o.id ? false : undefined) : undefined)} lang={lang}><span aria-hidden="true">{o.emoji} </span>{o.text}</button>)}</div>
      {pick && <Button onClick={() => { setPick(null); if (si + 1 >= signed.length) setStage("written"); else setSi(si + 1); }}>{t("Next")}</Button>}
    </div>);
  }
  return (<div className="space-y-3">
    {!signed.length && <Notice tone="info">{t("Sign comprehension questions appear here once this unit’s signs have been reviewed by Deaf ISL signers.")}</Notice>}
    <MultipleChoice items={quiz} lang={lang} onDone={(s) => onDone(signed.length ? Math.round((s + (signScore / signed.length) * 100) / 2) : s)} />
  </div>);
}

export function StatusBadge({ clip }: { clip: SignClip | undefined }) {
  const { t } = useT();
  return clip?.status === "validated"
    ? <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-extrabold text-brand-dark"><Check size={14} aria-hidden="true" />{t("Reviewed by {name}", { name: clip.reviewedBy ?? "" })}</span>
    : <span className="inline-flex items-center gap-1 rounded-full bg-sun-soft px-2 py-0.5 text-xs font-extrabold text-sun-dark"><X size={14} aria-hidden="true" />{t("Sign awaiting validation")}</span>;
}
