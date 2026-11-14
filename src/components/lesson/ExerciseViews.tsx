"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Square, Volume2, Snail } from "lucide-react";
import type { Course } from "@/lib/content/types";
import type { Answer, ChooseEx, Exercise, FillEx, ListenEx, MatchEx, SpeakEx, TranslateEx, WordBankEx } from "@/lib/engine/exercises";
import { mulberry32, shuffle } from "@/lib/engine/exercises";
import { canSpeakAloud, listenOnce, say, sfx, speechRecognizer } from "@/lib/audio";
import { Mascot } from "../Mascot";

export interface ViewProps<E extends Exercise = Exercise> { ex: E; course: Course; locked: boolean; sound: boolean; onDraft: (a: Answer | null) => void; onAutoSubmit: (a: Answer) => void }

function AudioButton({ text, lang, big = false, label = "Play audio" }: { text: string; lang: string; big?: boolean; label?: string }) {
  return (
    <button type="button" aria-label={label} onClick={() => say(text, lang)} className={`key grid shrink-0 place-items-center rounded-2xl border-sky-dark bg-sky text-white ${big ? "h-28 w-28" : "h-11 w-11"}`}>
      <Volume2 size={big ? 52 : 22} strokeWidth={2.5} />
    </button>
  );
}
function Bubble({ text, lang, speak }: { text: string; lang?: string; speak: boolean }) {
  return (
    <div className="flex items-end gap-3">
      <Mascot size={88} mood="happy" className="shrink-0" />
      <div className="relative mb-4 flex items-center gap-3 rounded-2xl border-2 border-line px-4 py-3 text-lg">
        {speak && lang && <AudioButton text={text} lang={lang} />}
        <span lang={lang}>{text}</span>
      </div>
    </div>
  );
}
const optionCls = (on: boolean) => `key w-full rounded-2xl border-2 border-b-4 px-4 py-3 text-left text-lg font-bold ${on ? "border-sky bg-sky-soft text-sky-dark" : "border-line-dark bg-paper"}`;

function Choose({ ex, course, locked, sound, onDraft }: ViewProps<ChooseEx>) {
  const [sel, setSel] = useState<number | null>(null);
  useEffect(() => { if (ex.promptIsTarget && sound) say(ex.prompt, course.ttsLang); }, [ex, course, sound]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { const n = Number(e.key); if (!locked && n >= 1 && n <= ex.options.length) { setSel(n - 1); onDraft({ type: "choose", index: n - 1 }); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [ex, locked, onDraft]);
  return (
    <div className="space-y-6">
      <Bubble text={ex.prompt} lang={ex.promptIsTarget ? course.ttsLang : undefined} speak={ex.promptIsTarget} />
      <div role="radiogroup" aria-label="Answer choices" className="space-y-3">
        {ex.options.map((o, i) => (
          <button key={o} type="button" role="radio" aria-checked={sel === i} disabled={locked} onClick={() => { setSel(i); onDraft({ type: "choose", index: i }); if (sound) sfx.tap(); }} className={optionCls(sel === i)}>
            <span className="mr-3 inline-grid h-7 w-7 place-items-center rounded-lg border-2 border-line-dark text-sm text-sub">{i + 1}</span>{o}
          </button>
        ))}
      </div>
    </div>
  );
}

function Tiles({ tiles, locked, sound, lang, onText }: { tiles: string[]; locked: boolean; sound: boolean; lang?: string; onText: (t: string) => void }) {
  const [picked, setPicked] = useState<number[]>([]);
  const set = (next: number[]) => { setPicked(next); onText(next.map((i) => tiles[i]).join(" ")); };
  const tile = "key rounded-xl border-2 border-b-4 border-line-dark bg-paper px-3 py-2 text-[17px] font-bold";
  return (
    <div>
      <div aria-label="Your answer" className="mb-6 flex min-h-[112px] flex-wrap content-start gap-2 border-y-2 border-line py-3" style={{ backgroundImage: "linear-gradient(to bottom, transparent 54px, var(--color-line) 54px, var(--color-line) 56px, transparent 56px)" }}>
        {picked.map((i) => <button key={i} type="button" disabled={locked} onClick={() => set(picked.filter((x) => x !== i))} className={tile} lang={lang}>{tiles[i]}</button>)}
      </div>
      <div aria-label="Word bank" className="flex flex-wrap justify-center gap-2">
        {tiles.map((t, i) => picked.includes(i)
          ? <span key={i} aria-hidden="true" className="rounded-xl border-2 border-line bg-line px-3 py-2 text-[17px] font-bold text-transparent">{t}</span>
          : <button key={i} type="button" disabled={locked} onClick={() => { set([...picked, i]); if (sound) sfx.tap(); if (sound && lang) say(t, lang); }} className={tile} lang={lang}>{t}</button>)}
      </div>
    </div>
  );
}
function WordBank({ ex, course, locked, sound, onDraft }: ViewProps<WordBankEx>) {
  useEffect(() => { if (ex.promptIsTarget && sound) say(ex.prompt, course.ttsLang); }, [ex, course, sound]);
  return (
    <div className="space-y-5">
      <Bubble text={ex.prompt} lang={ex.promptIsTarget ? course.ttsLang : undefined} speak={ex.promptIsTarget} />
      <Tiles tiles={ex.tiles} locked={locked} sound={sound} lang={ex.promptIsTarget ? undefined : course.ttsLang} onText={(t) => onDraft(t ? { type: "wordbank", text: t } : null)} />
    </div>
  );
}
function Translate({ ex, course, locked, sound, onDraft }: ViewProps<TranslateEx>) {
  useEffect(() => { if (ex.promptIsTarget && sound) say(ex.prompt, course.ttsLang); }, [ex, course, sound]);
  return (
    <div className="space-y-5">
      <Bubble text={ex.prompt} lang={ex.promptIsTarget ? course.ttsLang : undefined} speak={ex.promptIsTarget} />
      <textarea autoFocus disabled={locked} rows={3} aria-label="Your translation" placeholder={`Type in ${ex.promptIsTarget ? course.nativeName : course.targetName}`} lang={ex.promptIsTarget ? undefined : course.ttsLang} spellCheck={false}
        onChange={(e) => onDraft(e.target.value.trim() ? { type: "translate", text: e.target.value } : null)}
        className="w-full resize-none rounded-2xl border-2 border-line bg-mist p-4 text-lg font-semibold focus:border-sky focus:bg-paper focus:outline-none" />
    </div>
  );
}
function Listen({ ex, course, locked, sound, onDraft }: ViewProps<ListenEx>) {
  useEffect(() => { say(ex.audio, course.ttsLang); }, [ex, course]);
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-center gap-4">
        <AudioButton text={ex.audio} lang={course.ttsLang} big label="Play the sentence" />
        <button type="button" aria-label="Play slowly" onClick={() => say(ex.audio, course.ttsLang, 0.6)} className="key grid h-16 w-16 place-items-center rounded-2xl border-sky-dark bg-sky text-white"><Snail size={30} /></button>
      </div>
      {!canSpeakAloud() && <p role="status" className="rounded-xl bg-sun-soft p-3 text-center text-sm">This browser has no speech voice. Use “Can’t listen now” below to skip listening exercises.</p>}
      <Tiles tiles={ex.tiles} locked={locked} sound={sound} onText={(t) => onDraft(t ? { type: "listen", text: t } : null)} />
    </div>
  );
}
function Speak({ ex, course, locked, onDraft }: ViewProps<SpeakEx>) {
  const [phase, setPhase] = useState<"idle" | "listening" | "heard" | "error">("idle");
  const [heard, setHeard] = useState(""); const [err, setErr] = useState("");
  const stop = useRef<() => void>(() => {});
  const supported = !!speechRecognizer();
  useEffect(() => () => stop.current(), []);
  const start = () => {
    setErr(""); const s = listenOnce(course.sttLang, () => setPhase("listening")); stop.current = s.stop;
    s.promise.then((t) => { setHeard(t); setPhase("heard"); onDraft({ type: "speak", transcript: t }); },
      (e: Error) => { setPhase("error"); setErr(e.message === "not-allowed" ? "Microphone access was blocked. Allow it in your browser, or skip speaking for now." : e.message === "no-speech" ? "I didn’t catch that — tap the mic and try again." : "Speech recognition isn’t available right now."); });
  };
  return (
    <div className="space-y-8 text-center">
      <div className="flex items-center justify-center gap-3 text-xl"><AudioButton text={ex.text} lang={course.ttsLang} label="Hear the sentence" /><span lang={course.ttsLang}>{ex.text}</span></div>
      <p className="text-sub">{ex.translation}</p>
      <button type="button" disabled={locked || !supported} aria-label={phase === "listening" ? "Stop recording" : "Start recording"} onClick={() => (phase === "listening" ? stop.current() : start())}
        className={`key mx-auto grid h-40 w-40 place-items-center rounded-full border-b-8 text-white ${phase === "listening" ? "border-coral-dark bg-coral" : "border-sky-dark bg-sky"}`}>
        {phase === "listening" ? <Square size={56} fill="currentColor" /> : <Mic size={72} strokeWidth={2.2} />}
      </button>
      <p role="status" aria-live="polite" className="min-h-6 text-sub">
        {!supported ? "Speech recognition isn’t supported in this browser (try Chrome or Edge). Tap “Can’t speak now” to continue." : phase === "listening" ? "Listening…" : phase === "heard" ? <>I heard: <strong className="text-ink">“{heard}”</strong></> : phase === "error" ? err : "Tap the microphone and say the sentence"}
      </p>
    </div>
  );
}
function Match({ ex, locked, sound, onAutoSubmit }: ViewProps<MatchEx>) {
  const cols = useMemo(() => { const r = mulberry32(ex.pairs.length * 7919 + ex.id.length); return { left: shuffle(ex.pairs, r), right: shuffle(ex.pairs, r) }; }, [ex]);
  const [done, setDone] = useState<string[]>([]); const [l, setL] = useState<string | null>(null); const [r, setR] = useState<string | null>(null);
  const [bad, setBad] = useState<[string, string] | null>(null); const mistakes = useRef(0);
  useEffect(() => {
    if (!l || !r) return;
    if (l === r) { const next = [...done, l]; setDone(next); setL(null); setR(null); if (sound) sfx.correct(); if (next.length === ex.pairs.length) onAutoSubmit({ type: "match", mistakes: mistakes.current }); }
    else { mistakes.current++; setBad([l, r]); if (sound) sfx.wrong(); const t = setTimeout(() => { setBad(null); setL(null); setR(null); }, 380); return () => clearTimeout(t); }
  }, [l, r]); // eslint-disable-line react-hooks/exhaustive-deps
  const cls = (id: string, sel: string | null, side: 0 | 1) => `key min-h-14 w-full rounded-2xl border-2 border-b-4 px-3 py-2 text-[17px] font-bold ${done.includes(id) ? "border-brand/40 bg-brand-soft text-brand-dark opacity-60" : bad?.[side] === id ? "anim-shake border-coral bg-coral-soft text-coral-dark" : sel === id ? "border-sky bg-sky-soft text-sky-dark" : "border-line-dark bg-paper"}`;
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-3">{cols.left.map((p) => <button key={p.id} type="button" disabled={locked || done.includes(p.id)} onClick={() => setL(p.id)} className={cls(p.id, l, 0)}>{p.n}</button>)}</div>
      <div className="space-y-3">{cols.right.map((p) => <button key={p.id} type="button" disabled={locked || done.includes(p.id)} onClick={() => setR(p.id)} className={cls(p.id, r, 1)}>{p.t}</button>)}</div>
    </div>
  );
}
function Fill({ ex, course, locked, sound, onDraft }: ViewProps<FillEx>) {
  const [sel, setSel] = useState<number | null>(null);
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-line p-5 text-xl leading-loose" lang={course.ttsLang}>
        {ex.before} <span className={`mx-1 inline-block min-w-20 border-b-4 px-2 text-center ${sel === null ? "border-line-dark text-transparent" : "border-sky text-sky-dark"}`}>{sel === null ? "____" : ex.options[sel]}</span>{ex.after}
        <p className="mt-2 text-base text-sub">{ex.translation}</p>
      </div>
      <div role="radiogroup" aria-label="Words to fill the blank" className="flex flex-wrap justify-center gap-3">
        {ex.options.map((o, i) => <button key={o} type="button" role="radio" aria-checked={sel === i} disabled={locked} onClick={() => { setSel(i); onDraft({ type: "fill", index: i }); if (sound) sfx.tap(); }} className={`${optionCls(sel === i)} !w-auto`}>{o}</button>)}
      </div>
    </div>
  );
}

/** Central exercise renderer: picks the UI from the exercise type. Adding a type means adding one view here. */
export function ExerciseView(p: ViewProps) {
  switch (p.ex.type) {
    case "choose": return <Choose {...(p as ViewProps<ChooseEx>)} />;
    case "wordbank": return <WordBank {...(p as ViewProps<WordBankEx>)} />;
    case "translate": return <Translate {...(p as ViewProps<TranslateEx>)} />;
    case "listen": return <Listen {...(p as ViewProps<ListenEx>)} />;
    case "speak": return <Speak {...(p as ViewProps<SpeakEx>)} />;
    case "match": return <Match {...(p as ViewProps<MatchEx>)} />;
    case "fill": return <Fill {...(p as ViewProps<FillEx>)} />;
  }
}
