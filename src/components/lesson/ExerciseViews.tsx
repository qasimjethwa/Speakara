"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Square, Volume2, Snail, Play, RotateCcw } from "lucide-react";
import type { Course } from "@/lib/content/types";
import type { Answer, ChooseEx, DictationEx, Exercise, FillEx, ListenEx, MatchEx, SpeakEx, TranslateEx, WordBankEx } from "@/lib/engine/exercises";
import { mulberry32, shuffle, SPEAK_PASS } from "@/lib/engine/exercises";
import { assessSpeech } from "@/lib/engine/text";
import { canRecord, listenOnce, say, sfx, speechRecognizer, startRecording, ttsStatus, voicesReady } from "@/lib/audio";
import { useT } from "@/lib/i18n";
import { Mascot } from "../Mascot";
import { Notice } from "../ui";

export interface ViewProps<E extends Exercise = Exercise> { ex: E; course: Course; locked: boolean; sound: boolean; slow: boolean; onDraft: (a: Answer | null) => void; onAutoSubmit: (a: Answer) => void }

/** Plays a sentence and reports problems (no voice installed, playback failed) instead of failing silently. */
function useSpeech(lang: string, slow: boolean) {
  const [status, setStatus] = useState<"idle" | "playing" | "failed">("idle");
  const [voice, setVoice] = useState<"ok" | "no-voice" | "unsupported">("ok");
  useEffect(() => { let live = true; void voicesReady().then(() => { if (live) setVoice(ttsStatus(lang)); }); return () => { live = false; }; }, [lang]);
  const play = (text: string, rate = slow ? 0.75 : 1) => { setStatus("playing"); void say(text, lang, rate).then((ok) => setStatus(ok ? "idle" : "failed")); };
  return { play, status, voice };
}
function AudioProblem({ voice, status, lang }: { voice: string; status: string; lang: string }) {
  const { t } = useT();
  if (voice === "unsupported") return <Notice tone="warn">{t("This browser can’t play speech. Use “Can’t listen now” to skip listening exercises.")}</Notice>;
  if (voice === "no-voice") return <Notice tone="warn">{t("Your device has no {lang} voice installed, so Speakara won’t read {lang} aloud here (it never substitutes another language’s voice). Use “Can’t listen now” to skip listening, or install a {lang} voice in your device settings.", { lang: t(lang) })}</Notice>;
  if (status === "failed") return <Notice tone="warn">{t("The audio didn’t play. Tap the speaker to try again, or skip listening for now.")}</Notice>;
  return null;
}
function AudioButton({ onPlay, big = false, label, playing }: { onPlay: () => void; big?: boolean; label: string; playing?: boolean }) {
  return (
    <button type="button" aria-label={label} onClick={onPlay} className={`key grid shrink-0 place-items-center rounded-2xl border-sky-dark bg-sky text-white ${big ? "h-28 w-28" : "h-11 w-11"} ${playing ? "animate-pulse" : ""}`}>
      <Volume2 size={big ? 52 : 22} strokeWidth={2.5} />
    </button>
  );
}
function Bubble({ text, lang, onPlay }: { text: string; lang?: string; onPlay?: () => void }) {
  const { t } = useT();
  return (
    <div className="flex items-end gap-3">
      <Mascot size={88} mood="happy" className="shrink-0" />
      <div className="relative mb-4 flex items-center gap-3 rounded-2xl border-2 border-line-dark px-4 py-3 text-lg">
        {onPlay && <AudioButton onPlay={onPlay} label={t("Play audio")} />}
        <span lang={lang} data-prompt>{text}</span>
      </div>
    </div>
  );
}
const optionCls = (on: boolean) => `key w-full rounded-2xl border-2 border-b-4 px-4 py-3 text-left text-lg font-bold ${on ? "border-sky-dark bg-sky-soft text-sky-dark" : "border-line-dark bg-paper"}`;

function Choose({ ex, course, locked, sound, slow, onDraft }: ViewProps<ChooseEx>) {
  const { t } = useT(); const sp = useSpeech(course.ttsLang, slow);
  const [sel, setSel] = useState<number | null>(null);
  useEffect(() => { if (ex.promptIsTarget && sound) sp.play(ex.prompt); }, [ex]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const h = (e: KeyboardEvent) => { const n = Number(e.key); if (!locked && n >= 1 && n <= ex.options.length) { setSel(n - 1); onDraft({ type: "choose", index: n - 1 }); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [ex, locked, onDraft]);
  return (
    <div className="space-y-6">
      <Bubble text={ex.prompt} lang={ex.promptIsTarget ? course.ttsLang : undefined} onPlay={ex.promptIsTarget ? () => sp.play(ex.prompt) : undefined} />
      <div role="radiogroup" aria-label={t("Answer choices")} className="space-y-3">
        {ex.options.map((o, i) => (
          <button key={o} type="button" role="radio" aria-checked={sel === i} disabled={locked} onClick={() => { setSel(i); onDraft({ type: "choose", index: i }); if (sound) sfx.tap(); }} className={optionCls(sel === i)}>
            <span aria-hidden="true" className="mr-3 inline-grid h-7 w-7 place-items-center rounded-lg border-2 border-line-dark text-sm text-sub">{i + 1}</span>{o}
          </button>
        ))}
      </div>
    </div>
  );
}

function Tiles({ tiles, locked, sound, lang, onText }: { tiles: string[]; locked: boolean; sound: boolean; lang?: string; onText: (t: string) => void }) {
  const { t } = useT();
  const [picked, setPicked] = useState<number[]>([]);
  const set = (next: number[]) => { setPicked(next); onText(next.map((i) => tiles[i]).join(" ")); };
  const tile = "key rounded-xl border-2 border-b-4 border-line-dark bg-paper min-w-11 min-h-11 px-3 py-2 text-[17px] font-bold";
  return (
    <div>
      <p className="sr-only" aria-live="polite">{picked.length ? t("Your answer so far: {answer}", { answer: picked.map((i) => tiles[i]).join(" ") }) : t("Your answer is empty.")}</p>
      <div role="group" aria-label={t("Your answer — tap a word to remove it")} className="mb-6 flex min-h-[112px] flex-wrap content-start gap-2 border-y-2 border-line py-3">
        {picked.map((i) => <button key={i} type="button" disabled={locked} onClick={() => set(picked.filter((x) => x !== i))} className={tile} lang={lang}>{tiles[i]}</button>)}
      </div>
      <div role="group" aria-label={t("Word bank")} data-bank className="flex flex-wrap justify-center gap-2">
        {tiles.map((w, i) => picked.includes(i)
          ? <span key={i} aria-hidden="true" className="rounded-xl border-2 border-line bg-line px-3 py-2 text-[17px] font-bold text-transparent">{w}</span>
          : <button key={i} type="button" disabled={locked} onClick={() => { set([...picked, i]); if (sound) sfx.tap(); }} className={tile} lang={lang}>{w}</button>)}
      </div>
    </div>
  );
}
function WordBank({ ex, course, locked, sound, slow, onDraft }: ViewProps<WordBankEx>) {
  const sp = useSpeech(course.ttsLang, slow);
  useEffect(() => { if (ex.promptIsTarget && sound) sp.play(ex.prompt); }, [ex]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="space-y-5">
      <Bubble text={ex.prompt} lang={ex.promptIsTarget ? course.ttsLang : undefined} onPlay={ex.promptIsTarget ? () => sp.play(ex.prompt) : undefined} />
      <Tiles tiles={ex.tiles} locked={locked} sound={sound} lang={ex.promptIsTarget ? undefined : course.ttsLang} onText={(x) => onDraft(x ? { type: "wordbank", text: x } : null)} />
    </div>
  );
}
function TextAnswer({ label, placeholder, lang, locked, onText }: { label: string; placeholder: string; lang?: string; locked: boolean; onText: (s: string) => void }) {
  return <textarea autoFocus disabled={locked} rows={3} aria-label={label} placeholder={placeholder} lang={lang} spellCheck={false} autoCapitalize="off" autoCorrect="off"
    onChange={(e) => onText(e.target.value)} className="w-full resize-none rounded-2xl border-2 border-line-dark bg-mist p-4 text-lg font-semibold placeholder:text-sub focus:border-sky-dark focus:bg-paper focus:outline-none" />;
}
function Translate({ ex, course, locked, sound, slow, onDraft }: ViewProps<TranslateEx>) {
  const { t } = useT(); const sp = useSpeech(course.ttsLang, slow);
  useEffect(() => { if (ex.promptIsTarget && sound) sp.play(ex.prompt); }, [ex]); // eslint-disable-line react-hooks/exhaustive-deps
  const lang = t(ex.promptIsTarget ? course.nativeName : course.targetName);
  return (
    <div className="space-y-5">
      <Bubble text={ex.prompt} lang={ex.promptIsTarget ? course.ttsLang : undefined} onPlay={ex.promptIsTarget ? () => sp.play(ex.prompt) : undefined} />
      <TextAnswer label={t("Your translation")} placeholder={t("Type in {lang}", { lang })} lang={ex.promptIsTarget ? undefined : course.ttsLang} locked={locked} onText={(v) => onDraft(v.trim() ? { type: "translate", text: v } : null)} />
    </div>
  );
}
function ListenControls({ audio, course, slow }: { audio: string; course: Course; slow: boolean }) {
  const { t } = useT(); const sp = useSpeech(course.ttsLang, slow);
  useEffect(() => { sp.play(audio); }, [audio]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <div className="flex items-end justify-center gap-4">
        <AudioButton onPlay={() => sp.play(audio, 1)} big label={t("Play the sentence")} playing={sp.status === "playing"} />
        <button type="button" aria-label={t("Play slowly")} onClick={() => sp.play(audio, 0.55)} className="key grid h-16 w-16 place-items-center rounded-2xl border-sky-dark bg-sky text-white"><Snail size={30} /></button>
      </div>
      <AudioProblem voice={sp.voice} status={sp.status} lang={course.targetName} />
    </>
  );
}
function Listen({ ex, course, locked, sound, slow, onDraft }: ViewProps<ListenEx>) {
  return <div className="space-y-6"><ListenControls audio={ex.audio} course={course} slow={slow} /><Tiles tiles={ex.tiles} locked={locked} sound={sound} onText={(x) => onDraft(x ? { type: "listen", text: x } : null)} /></div>;
}
function Dictation({ ex, course, locked, slow, onDraft }: ViewProps<DictationEx>) {
  const { t } = useT();
  return <div className="space-y-6"><ListenControls audio={ex.audio} course={course} slow={slow} /><TextAnswer label={t("Type what you hear")} placeholder={t("Type in {lang}", { lang: t(course.targetName) })} lang={course.ttsLang} locked={locked} onText={(v) => onDraft(v.trim() ? { type: "dictation", text: v } : null)} /></div>;
}

/**
 * Speaking: uses speech recognition where the browser has it and shows word-by-word feedback. Where it does not
 * (Firefox, some Safari versions) the learner records themselves, compares with the model audio and self-assesses.
 */
function Speak({ ex, course, locked, slow, onDraft }: ViewProps<SpeakEx>) {
  const { t } = useT(); const sp = useSpeech(course.ttsLang, slow);
  const [phase, setPhase] = useState<"idle" | "listening" | "heard" | "recorded" | "error">("idle");
  const [heard, setHeard] = useState(""); const [err, setErr] = useState(""); const [clip, setClip] = useState<string | null>(null);
  const [fallback, setFallback] = useState(!speechRecognizer());
  const misses = useRef(0);
  const stop = useRef<() => void>(() => {}); const recorder = useRef<{ stop: () => Promise<string> } | null>(null);
  useEffect(() => () => { stop.current(); void recorder.current?.stop(); }, []);
  const explain = (code: string) => code === "not-allowed" || code === "service-not-allowed" ? t("Microphone access is blocked. Allow the microphone for this site in your browser’s address bar, then try again.")
    : code === "no-speech" ? t("I didn’t catch that — tap the microphone and try again.") : code === "no-mic" || code === "audio-capture" ? t("No microphone was found on this device.") : t("Speech recognition isn’t available right now.");
  const recognise = () => {
    setErr(""); setHeard(""); onDraft(null);
    const s = listenOnce(course.sttLang, () => setPhase("listening")); stop.current = s.stop;
    s.promise.then((text) => { setHeard(text); setPhase("heard"); onDraft({ type: "speak", transcript: text }); },
      (e: Error) => { if (e.message === "no-speech") misses.current++; if ((["network", "language-not-supported", "service-not-allowed", "timeout"].includes(e.message) || misses.current >= 2) && canRecord()) { setFallback(true); setPhase("idle"); setErr(t("Speech recognition isn’t available right now.") + " " + t("Record yourself instead and compare with the model.")); } else { setPhase("error"); setErr(explain(e.message)); } });
  };
  const record = async () => {
    setErr(""); setClip(null); onDraft(null);
    try { recorder.current = await startRecording(); setPhase("listening"); } catch (e) { setPhase("error"); setErr(explain((e as Error).message)); }
  };
  const finishRecording = async () => { const url = await recorder.current!.stop(); recorder.current = null; setClip(url); setPhase("recorded"); };
  const supported = !fallback || canRecord();
  const result = phase === "heard" ? assessSpeech(heard, ex.text) : null;
  return (
    <div className="space-y-6 text-center">
      <div className="flex items-center justify-center gap-3 text-xl"><AudioButton onPlay={() => sp.play(ex.text)} label={t("Hear the sentence")} /><span lang={course.ttsLang} data-prompt>{ex.text}</span></div>
      <p className="text-sub">{ex.translation}</p>
      <button type="button" disabled={locked || !supported} aria-label={phase === "listening" ? t("Stop recording") : t("Start recording")} aria-pressed={phase === "listening"}
        onClick={() => (phase === "listening" ? (fallback ? void finishRecording() : stop.current()) : fallback ? void record() : recognise())}
        className={`key mx-auto grid h-36 w-36 place-items-center rounded-full border-b-8 text-white disabled:border-line-dark disabled:bg-line disabled:text-sub ${phase === "listening" ? "border-coral-dark bg-coral" : "border-sky-dark bg-sky"}`}>
        {phase === "listening" ? <Square size={52} fill="currentColor" /> : <Mic size={66} strokeWidth={2.2} />}
      </button>
      <div role="status" aria-live="polite" className="min-h-6 space-y-3">
        {!supported && <Notice tone="warn">{t("This browser can’t record or recognise speech. Tap “Can’t speak now” to continue — Chrome, Edge and Safari support speaking exercises.")}</Notice>}
        {supported && phase === "idle" && !err && <p className="text-sub">{fallback ? t("Tap the microphone, say the sentence, then tap again to stop.") : t("Tap the microphone and say the sentence")}</p>}
        {phase === "listening" && <p className="font-bold text-coral-dark">{fallback ? t("Recording… tap to stop") : t("Listening…")}</p>}
        {err && <Notice tone={phase === "error" ? "error" : "warn"}>{err}</Notice>}
        {result && (
          <div className="rounded-2xl border-2 border-line p-4">
            <p className="mb-2 text-sm font-bold text-sub">{t("Pronunciation check")} · {Math.round(result.score * 100)}%</p>
            <p className="flex flex-wrap justify-center gap-2 text-lg" lang={course.ttsLang}>{result.words.map((w, i) => <span key={i} className={`rounded-lg px-2 py-0.5 font-bold ${w.heard ? "bg-brand-soft text-brand-dark" : "bg-coral-soft text-coral-dark underline decoration-wavy"}`}>{w.word}<span className="sr-only">{w.heard ? ` (${t("heard")})` : ` (${t("not heard")})`}</span></span>)}</p>
            <p className="mt-2 text-sm text-sub">{t("I heard:")} “{heard}”{result.score < SPEAK_PASS && ` — ${t("try the highlighted words again.")}`}</p>
          </div>
        )}
        {phase === "recorded" && clip && (
          <div className="space-y-3 rounded-2xl border-2 border-line p-4">
            <audio src={clip} controls className="mx-auto w-full max-w-xs" aria-label={t("Your recording")} />
            <p className="text-sm text-sub">{t("Listen to yourself, compare with the model, then tell us how it went.")}</p>
            <div className="flex justify-center gap-2">
              <button type="button" disabled={locked} onClick={() => onDraft({ type: "speak", transcript: ex.text })} className={`${optionCls(false)} !w-auto !py-2 !text-base`}><Play size={16} className="mr-1 inline" />{t("I said it well")}</button>
              <button type="button" disabled={locked} onClick={() => onDraft({ type: "speak", transcript: "" })} className={`${optionCls(false)} !w-auto !py-2 !text-base`}>{t("I need more practice")}</button>
            </div>
          </div>
        )}
        {(phase === "heard" || phase === "recorded" || phase === "error") && !locked && <button type="button" onClick={() => (fallback ? void record() : recognise())} className="inline-flex items-center gap-1 text-sm font-extrabold uppercase text-sky-dark"><RotateCcw size={16} />{t("Try again")}</button>}
      </div>
    </div>
  );
}
function Match({ ex, locked, sound, onAutoSubmit }: ViewProps<MatchEx>) {
  const { t } = useT();
  const cols = useMemo(() => { const r = mulberry32(ex.pairs.length * 7919 + ex.id.length); return { left: shuffle(ex.pairs, r), right: shuffle(ex.pairs, r) }; }, [ex]);
  const [done, setDone] = useState<string[]>([]); const [l, setL] = useState<string | null>(null); const [r, setR] = useState<string | null>(null);
  const [bad, setBad] = useState<[string, string] | null>(null); const [said, setSaid] = useState(""); const mistakes = useRef(0);
  useEffect(() => {
    if (!l || !r) return;
    if (l === r) { const next = [...done, l]; const p = ex.pairs.find((x) => x.id === l)!; setSaid(t("Matched: {a} and {b}", { a: p.n, b: p.t })); setDone(next); setL(null); setR(null); if (next.length === ex.pairs.length) onAutoSubmit({ type: "match", mistakes: mistakes.current }); else if (sound) sfx.correct(); }
    else { mistakes.current++; setSaid(t("Not a match. Try again.")); setBad([l, r]); if (sound) sfx.wrong(); const id = setTimeout(() => { setBad(null); setL(null); setR(null); }, 380); return () => clearTimeout(id); }
  }, [l, r]); // eslint-disable-line react-hooks/exhaustive-deps
  const cls = (id: string, sel: string | null, side: 0 | 1) => `key min-h-14 w-full rounded-2xl border-2 border-b-4 px-3 py-2 text-[17px] font-bold ${done.includes(id) ? "border-brand bg-brand-soft text-brand-dark" : bad?.[side] === id ? "anim-shake border-coral bg-coral-soft text-coral-dark" : sel === id ? "border-sky-dark bg-sky-soft text-sky-dark" : "border-line-dark bg-paper"}`;
  return (
    <div className="grid grid-cols-2 gap-3" data-match>
      <p className="sr-only" aria-live="assertive">{said}</p>
      <div role="group" aria-label={t("Meanings")} className="space-y-3">{cols.left.map((p) => <button key={p.id} type="button" aria-pressed={l === p.id} disabled={locked || done.includes(p.id)} onClick={() => setL(p.id)} className={cls(p.id, l, 0)}>{p.n}</button>)}</div>
      <div role="group" aria-label={t("Words")} className="space-y-3">{cols.right.map((p) => <button key={p.id} type="button" aria-pressed={r === p.id} disabled={locked || done.includes(p.id)} onClick={() => setR(p.id)} className={cls(p.id, r, 1)}>{p.t}</button>)}</div>
    </div>
  );
}
function Fill({ ex, course, locked, sound, onDraft }: ViewProps<FillEx>) {
  const { t } = useT();
  const [sel, setSel] = useState<number | null>(null);
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-line-dark p-5 text-xl leading-loose">
        <p lang={course.ttsLang} data-fill>{ex.before} <span className={`mx-1 inline-block min-w-20 border-b-4 px-2 text-center ${sel === null ? "border-line-dark" : "border-sky-dark text-sky-dark"}`}>{sel === null ? <><span aria-hidden="true">&nbsp;</span><span className="sr-only">{t("blank")}</span></> : ex.options[sel]}</span>{ex.after}</p>
        <p className="mt-2 text-base text-sub">{ex.translation}</p>
      </div>
      <div role="radiogroup" aria-label={t("Words to fill the blank")} className="flex flex-wrap justify-center gap-3">
        {ex.options.map((o, i) => <button key={o} type="button" role="radio" aria-checked={sel === i} disabled={locked} onClick={() => { setSel(i); onDraft({ type: "fill", index: i }); if (sound) sfx.tap(); }} className={`${optionCls(sel === i)} !w-auto`} lang={course.ttsLang}>{o}</button>)}
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
    case "dictation": return <Dictation {...(p as ViewProps<DictationEx>)} />;
    case "speak": return <Speak {...(p as ViewProps<SpeakEx>)} />;
    case "match": return <Match {...(p as ViewProps<MatchEx>)} />;
    case "fill": return <Fill {...(p as ViewProps<FillEx>)} />;
  }
}
