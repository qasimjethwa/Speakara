"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, GraduationCap, Handshake, Plane, RotateCcw, School, ShoppingBasket, TrainFront, User, Users, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { IslCourse } from "@/lib/isl/courses";
import { useIslProgress, useValidatedClips } from "@/lib/isl/data";
import type { Mood } from "@/lib/isl/expression";
import type { Scenario, SceneIcon } from "@/lib/isl/scenarios";
import { Loading } from "@/components/ui";

const SignTeacher = dynamic(() => import("@/components/isl/SignTeacher").then((m) => m.SignTeacher), { ssr: false, loading: () => <div className="aspect-square max-h-[56dvh] rounded-[28px] bg-[#ece6da]"><Loading text="Loading your teacher…" /></div> });
export const SCENE_ICONS: Record<SceneIcon, LucideIcon> = { handshake: Handshake, user: User, utensils: UtensilsCrossed, shopping: ShoppingBasket, plane: Plane, train: TrainFront, school: School, users: Users };
export const sceneItemId = (course: string, id: string) => `${course}:scene:${id}`;

type Msg = { who: "them" | "you"; text: string; meaning: string };

export function ScenarioPlayer({ course, scenario }: { course: IslCourse; scenario: Scenario }) {
  const { t } = useT(); const { clips } = useValidatedClips(); const { complete } = useIslProgress();
  const lang = course.id === "spanish" ? "es" : "en";
  const [phase, setPhase] = useState<"intro" | "talk" | "done">("intro");
  const [ti, setTi] = useState(0); const [msgs, setMsgs] = useState<Msg[]>([]); const [fb, setFb] = useState<{ ok: boolean; text: string } | null>(null);
  const [tries, setTries] = useState(0); const [firstTry, setFirstTry] = useState(0); const [vocabSign, setVocabSign] = useState<string | null>(null);
  const log = useRef<HTMLOListElement>(null);
  const Icon = SCENE_ICONS[scenario.icon];
  const turn = scenario.turns[ti];
  useEffect(() => { if (!fb?.ok || phase !== "talk") return; const id = setTimeout(() => setFb(null), 2600); return () => clearTimeout(id); }, [fb, phase]);
  useEffect(() => { log.current?.lastElementChild?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [msgs, fb]);

  const start = () => { setPhase("talk"); setMsgs([{ who: "them", ...turn.partner }]); };
  const choose = (k: number) => {
    const ch = turn.choices[k]; setFb({ ok: ch.ok, text: t(ch.feedback) });
    if (!ch.ok) { setTries((n) => n + 1); return; }
    if (tries === 0) setFirstTry((n) => n + 1);
    setTries(0);
    const next = scenario.turns[ti + 1];
    setMsgs((m) => [...m, { who: "you", text: ch.text, meaning: ch.meaning }, ...(next ? [{ who: "them" as const, ...next.partner }] : [])]);
    if (next) setTi(ti + 1);
    else { setPhase("done"); complete(sceneItemId(course.id, scenario.id), Math.round(((tries === 0 ? firstTry + 1 : firstTry) / scenario.turns.length) * 100)); }
  };
  const restart = () => { setPhase("intro"); setTi(0); setMsgs([]); setFb(null); setTries(0); setFirstTry(0); };

  const mood: Mood = phase === "intro" ? "welcoming" : phase === "done" ? "celebrating" : fb ? (fb.ok ? "encouraging" : "correcting") : "listening";
  const caption = useMemo(() => phase === "intro" ? [{ text: t(scenario.title), strong: true }, { text: t(scenario.intro) }]
    : phase === "done" ? [{ text: t("Scenario complete!"), strong: true }, { text: t("You chose the right reply first time in {n} of {t} turns.", { n: firstTry, t: scenario.turns.length }) }]
    : fb ? [{ text: fb.ok ? t("Well done!") : t("Let’s try that again."), strong: true }, { text: fb.text }]
    : [{ text: turn.partner.text, lang, strong: true }, { text: turn.partner.meaning }], [phase, fb, turn, scenario, t, lang, firstTry]);
  const signClip = vocabSign ? clips[vocabSign] ?? null : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div><SignTeacher compact clip={signClip} mood={mood} targetLang={lang} fallback={{ start: 0, end: 1, text: "" }} captionLines={caption} /></div>

      <section className="flex min-h-[520px] flex-col overflow-hidden rounded-[28px] border border-line bg-paper" aria-label={t(scenario.title)}>
        <header className="flex items-center gap-3 border-b border-line bg-[#f5f1e8] px-5 py-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-paper text-ink shadow-sm"><Icon size={22} aria-hidden="true" /></span>
          <span className="min-w-0"><span className="block text-xs font-extrabold uppercase tracking-wider text-sub">{t(scenario.place)}</span><span className="block truncate text-lg font-extrabold">{t(scenario.title)}</span></span>
          {phase === "talk" && <span className="ml-auto text-sm font-bold text-sub">{ti + 1} / {scenario.turns.length}</span>}
        </header>

        {phase === "intro" ? (
          <div className="flex flex-1 flex-col gap-4 p-5">
            <p className="text-lg">{t(scenario.intro)}</p>
            <div><h3 className="mb-2 text-sm font-extrabold uppercase tracking-wider text-sub">{t("Useful words")}</h3>
              <ul className="divide-y divide-line rounded-2xl border border-line">{scenario.vocab.map((v) => (
                <li key={v.text} className="flex items-center gap-3 px-4 py-3"><span className="min-w-0 flex-1"><span className="block text-lg font-bold" lang={lang}>{v.text}</span><span className="block text-sm text-sub">{v.meaning}</span></span>
                  {v.sign && clips[v.sign] && <button type="button" onClick={() => setVocabSign(v.sign!)} className="min-h-11 rounded-full border border-line px-3 text-sm font-bold hover:bg-mist">{t("Watch the sign")}</button>}</li>))}</ul></div>
            <button type="button" onClick={start} className="mt-auto flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-ink text-lg font-extrabold text-white">{t("Start the conversation")}<ArrowRight size={20} aria-hidden="true" /></button>
          </div>
        ) : (
          <>
            <ol ref={log} className="flex-1 space-y-3 overflow-y-auto p-5" aria-live="polite">
              {msgs.map((m, i) => (
                <li key={i} className={`flex ${m.who === "you" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-3xl px-4 py-3 ${m.who === "you" ? "rounded-br-lg bg-ink text-white" : "rounded-bl-lg bg-[#f5f1e8] text-ink"}`}>
                    <p className="text-lg font-bold" lang={lang}>{m.text}</p><p className={`text-sm ${m.who === "you" ? "text-white/75" : "text-sub"}`}>{m.meaning}</p>
                  </div></li>))}
            </ol>
            <div className="space-y-2 border-t border-line p-4">
              {phase === "talk" ? <>
                {fb && <p className={`rounded-2xl px-4 py-3 text-sm font-bold ${fb.ok ? "bg-brand-soft text-brand-dark" : "bg-sun-soft text-sun-dark"}`} role="status">{fb.text}</p>}
                <p className="text-sm font-bold text-sub">{t("Choose your reply")}</p>
                {turn.choices.map((ch, k) => (
                  <button key={k} type="button" onClick={() => choose(k)} className="block min-h-12 w-full rounded-2xl border border-line bg-paper px-4 py-2 text-left hover:border-ink">
                    <span className="block font-bold" lang={lang}>{ch.text}</span><span className="block text-sm text-sub">{ch.meaning}</span></button>))}
              </> : (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={restart} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-bold hover:bg-mist"><RotateCcw size={16} aria-hidden="true" />{t("Play again")}</button>
                  <Link href={`/learn/isl/${course.id}/scenarios`} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-bold text-white"><GraduationCap size={16} aria-hidden="true" />{t("More scenarios")}</Link>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
