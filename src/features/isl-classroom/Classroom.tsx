"use client";
/**
 * ISL Live Classroom: teacher on the left, the learner's camera on the right, captions and controls below.
 * Isolated module: everything it needs lives in src/features/isl-classroom; it only *uses* shared helpers.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ArrowRight, Camera, CameraOff, Captions, Check, ChevronLeft, Eye, Lightbulb, Pause, Play, RotateCcw, Settings2, SkipForward, Snail, Sun, Video } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useIslProgress } from "@/lib/isl/data";
import { recordEvents } from "@/lib/twin/store";
import { LESSONS, phrase, progressId, signById, SIGNS, type CourseId } from "./content";
import { current, lessonScore, moodOf, reduce, startClass, teacherLine, type ClassState } from "./engine";
import { classify, loadModel, type SignModel } from "./recognition/classifier";
import { useSignCamera } from "./recognition/camera";
import { activeTeacher } from "./teacher";
import { usePrefs } from "./prefs";
import s from "./classroom.module.css";

const MOOD_LABEL = { warm: /*i18n*/ "Teaching", signing: /*i18n*/ "Signing", attentive: /*i18n*/ "Your turn", thinking: /*i18n*/ "Checking", celebrate: /*i18n*/ "Well done", encourage: /*i18n*/ "Let’s try again", guide: /*i18n*/ "Adjusting" } as const;

export function Classroom() {
  const { t } = useT(); const [prefs, setPrefs] = usePrefs();
  const course: CourseId = prefs.course;
  if (!prefs.started) return <Welcome onStart={(c) => setPrefs({ ...prefs, course: c, started: true })} />;
  return <Lesson key={course + prefs.lesson} course={course} lessonId={prefs.lesson} onLesson={(l) => setPrefs({ ...prefs, lesson: l })} onExit={() => setPrefs({ ...prefs, started: false })} t={t} />;
}

function Welcome({ onStart }: { onStart: (c: CourseId) => void }) {
  const { t } = useT();
  return (
    <div className={`${s.room} grid min-h-[70vh] place-items-center p-6`}>
      <div className="w-full max-w-2xl text-center">
        <p className={s.eyebrow}>{t("Indian Sign Language")}</p>
        <h1 className="mt-2 text-3xl sm:text-4xl">{t("Your live ISL classroom")}</h1>
        <p className={`mx-auto mt-3 max-w-lg ${s.muted}`}>{t("Watch each sign, copy it on camera, and get feedback straight away.")}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {([["english", "English through ISL", "Learn written English"], ["spanish", "Spanish through ISL", "Learn written Spanish"]] as const).map(([c, title, sub]) => (
            <button key={c} type="button" onClick={() => onStart(c)} className={`${s.choice} text-left`} data-course={c}>
              <span className="block text-lg font-extrabold">{t(title)}</span><span className={`block text-sm ${s.muted}`}>{t(sub)} · A1</span>
              <ArrowRight size={20} className={s.choiceArrow} aria-hidden="true" />
            </button>))}
        </div>
      </div>
    </div>
  );
}

type TFn = ReturnType<typeof useT>["t"];
function Lesson({ course, lessonId, onLesson, onExit, t }: { course: CourseId; lessonId: string; onLesson: (l: string) => void; onExit: () => void; t: TFn }) {
  const lesson = LESSONS.find((l) => l.id === lessonId) ?? LESSONS[0];
  const [st, dispatch] = useReducer(reduce, null, () => startClass(lesson.id, lesson.signs));
  const [prefs, setPrefs] = usePrefs();
  const [model, setModel] = useState<SignModel | null>(null);
  const cam = useSignCamera();
  const { complete } = useIslProgress();
  const [replay, setReplay] = useState<string | null>(null); const [count, setCount] = useState(0);
  const [explain, setExplain] = useState<string | null>(null); const [settings, setSettings] = useState(false); const [transcript, setTranscript] = useState<string[]>([]);
  const [checkPick, setCheckPick] = useState<string | null>(null);
  useEffect(() => { void loadModel().then(setModel); }, []);

  const sign = signById(current(st) ?? "")!;
  const target = phrase(sign, course);
  const meaning = course === "spanish" ? sign.en : null;
  const supported = !!model?.signs[sign.label]?.supported;
  const canCheck = supported && cam.status === "on";
  const line = teacherLine(st, target); const lineText = t(line.key, line.params);
  const mood = moodOf(st); const Teacher = activeTeacher.Component;
  useEffect(() => { setTranscript((x) => (x[x.length - 1] === lineText ? x : [...x.slice(-40), lineText])); }, [lineText]);
  useEffect(() => { setExplain(null); setCheckPick(null); }, [st.index]);

  // progress + learning record (camera-checked outcomes only)
  const recorded = useRef(0);
  useEffect(() => {
    const h = st.history[st.history.length - 1]; if (!h || st.history.length === recorded.current) return; recorded.current = st.history.length;
    if (h.outcome === "correct" || h.outcome === "self") complete(progressId(course, h.sign), h.outcome === "correct" ? 100 : 60);
    if (h.outcome === "correct" || h.outcome === "incorrect") recordEvents([{ at: h.at, course: `isl-${course === "english" ? "en" : "es"}`, skill: "isl", correct: h.outcome === "correct", item: h.sign, topic: lesson.title.en, source: "isl" }]);
  }, [st.history, complete, course, lesson.title.en]);

  const attempt = useCallback(async () => {
    if (!model) return;
    dispatch({ type: "begin_attempt" });
    for (let i = 3; i > 0; i--) { setCount(i); await new Promise((r) => setTimeout(r, 700)); }
    setCount(0);
    const { frames, replay: url } = await cam.capture(st.slow ? 5000 : 3600);
    setReplay((old) => { if (old) URL.revokeObjectURL(old); return url; });
    dispatch({ type: "analysing" }); await new Promise((r) => setTimeout(r, 350));
    const v = classify(model, frames, sign.label);
    document.querySelector("[data-testid=isl-classroom]")?.setAttribute("data-verdict", `${v.outcome} p=${v.confidence.toFixed(2)} q=${v.quality.toFixed(2)} n=${frames.length}${v.distance ? ` d=${v.distance.toFixed(1)}` : ""}`);
    const looked = v.lookedLike ? SIGNS.find((x) => x.label === v.lookedLike) : undefined;
    dispatch({ type: "verdict", outcome: v.outcome, lookedLike: looked ? phrase(looked, course) : undefined });
  }, [cam, model, sign.label, st.slow, course]);

  const askExplain = async () => {
    setExplain(t("Thinking…"));
    try {
      const r = await fetch("/api/isl-classroom/explain", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ course, sign: sign.id, misses: st.history.filter((h) => h.sign === sign.id && h.outcome === "incorrect").length }) });
      const j = await r.json(); setExplain(r.ok && j.text ? j.text : sign.note[course === "english" ? "en" : "es"]);
    } catch { setExplain(sign.note[course === "english" ? "en" : "es"]); }
  };

  const options = useMemo(() => {
    const pool = SIGNS.filter((x) => x.id !== sign.id && phrase(x, course) !== target).sort(() => Math.random() - 0.5).slice(0, 2);
    return [sign, ...pool].sort(() => Math.random() - 0.5);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sign.id, course]);

  const capStyle = `${s.caption} ${prefs.captionBg === "solid" ? s.captionSolid : prefs.captionBg === "none" ? s.captionNone : ""}`;
  const done = st.phase === "complete";
  const nextLesson = LESSONS[LESSONS.findIndex((l) => l.id === lesson.id) + 1];

  return (
    <div className={`${s.room} ${prefs.contrast ? s.contrast : ""}`} data-phase={st.phase} data-testid="isl-classroom" style={{ ["--cap-size" as string]: `${prefs.captionSize}px` }}>
      {/* top bar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onExit} className={s.iconBtn} aria-label={t("Back")}><ChevronLeft size={20} aria-hidden="true" /></button>
        <div className="min-w-0 flex-1">
          <p className={s.eyebrow}>{t(course === "english" ? "English through ISL" : "Spanish through ISL")} · A1</p>
          <h1 className="truncate text-xl">{t(lesson.title.en)}</h1>
        </div>
        <ol className="flex items-center gap-1.5" aria-label={t("Lesson progress")}>
          {st.queue.map((id, i) => <li key={i} className={`${s.dot} ${i < st.index || done ? s.dotDone : i === st.index ? s.dotNow : ""}`} title={phrase(signById(id)!, course)}><span className="sr-only">{phrase(signById(id)!, course)}</span></li>)}
        </ol>
        <button type="button" onClick={() => setSettings((x) => !x)} className={s.iconBtn} aria-expanded={settings} aria-label={t("Caption settings")}><Settings2 size={20} aria-hidden="true" /></button>
      </div>
      {settings && <Settings t={t} />}

      {/* stage: teacher | learner */}
      <div className="grid gap-3 md:grid-cols-2">
        <section className={s.panel} aria-label={t("Teacher")}>
          <div className={s.stage}>
            <Teacher sign={sign.id} demoKey={st.demoKey} demonstrating={st.phase === "demo"} slow={st.slow} mood={mood} choice={prefs.teacher} onDemoEnd={() => dispatch({ type: "demo_end" })} />
            <span className={s.badge} data-mood={mood}><span className={s.badgeDot} aria-hidden="true" />{t(MOOD_LABEL[mood])}</span>
          </div>
          <p className={s.credit}>{t(activeTeacher.credit)}</p>
        </section>

        <section className={s.panel} aria-label={t("You")}>
          <div className={s.stage}>
            <video ref={cam.video} muted playsInline className={`${s.mirror} h-full w-full object-cover ${cam.status === "on" ? "" : "hidden"}`} />
            <canvas ref={cam.overlay} className={`${s.mirror} pointer-events-none absolute inset-0 h-full w-full object-cover ${cam.status === "on" ? "" : "hidden"}`} aria-hidden="true" />
            {cam.status !== "on" && <CameraConsent status={cam.status} onStart={() => void cam.start()} t={t} />}
            {cam.status === "on" && <div className="absolute left-3 top-3 flex flex-wrap gap-1.5" aria-live="polite">
              <Chip ok={cam.guide.body} label={t("Upper body")} /><Chip ok={cam.guide.hands > 0} label={t("Hands")} />
              {cam.guide.light !== "ok" && <Chip ok={false} label={t(cam.guide.light === "dark" ? "Too dark" : "Too bright")} icon={<Sun size={13} aria-hidden="true" />} />}
              {cam.guide.body && !cam.guide.framed && <Chip ok={false} label={t("Move a little closer or further")} />}
            </div>}
            {st.phase === "recording" && <span className={s.rec}>{count ? count : <><span className={s.recDot} aria-hidden="true" />{t("Signing…")}</>}</span>}
          </div>
          <div className="mt-2 flex min-h-11 items-center gap-2">
            {replay && <ReplayButton url={replay} t={t} />}
            {cam.status === "on" && <button type="button" onClick={cam.stop} className={s.ghost}><CameraOff size={16} aria-hidden="true" />{t("Turn camera off")}</button>}
          </div>
        </section>
      </div>

      {/* caption + target, never over the panels */}
      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
        <div>
          <p className={capStyle} aria-live="polite" data-testid="teacher-caption">{lineText}</p>
          {!done && <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className={s.target} lang={course === "english" ? "en" : "es"} data-testid="target-phrase">{target}</span>
            {meaning && <span className={s.muted}>{meaning}</span>}
            {prefs.hindi && <span className={s.muted} lang="hi">{sign.hi}</span>}
          </div>}
          {explain && <p className={`${s.note} mt-3`}>{explain}</p>}
        </div>
      </div>

      {/* actions */}
      <div className="mt-4">
        {st.phase === "welcome" && <button type="button" className={s.primary} onClick={() => dispatch({ type: "start" })}><Play size={18} aria-hidden="true" />{t("Start the lesson")}</button>}

        {(st.phase === "your_turn" || (st.phase === "feedback" && st.last !== "correct" && st.last !== "self")) && (
          canCheck ? <button type="button" className={s.primary} onClick={() => void attempt()} data-testid="try-sign"><Video size={18} aria-hidden="true" />{st.phase === "feedback" ? t("Try again") : t("I’m ready — watch me")}</button>
            : <div className="flex flex-wrap items-center gap-2">
                <button type="button" className={s.primary} onClick={() => dispatch({ type: "self_check" })}><Check size={18} aria-hidden="true" />{t("I’ve practised it")}</button>
                <span className={`text-sm ${s.muted}`}>{cam.status !== "on" ? t("Turn on your camera to get feedback.") : t("Camera feedback isn’t available for this sign yet.")}</span>
              </div>)}

        {st.phase === "feedback" && (st.last === "correct" || st.last === "self") && <button type="button" className={s.primary} onClick={() => dispatch({ type: "continue" })}>{t("Continue")}<ArrowRight size={18} aria-hidden="true" /></button>}

        {st.phase === "check" && <div>
          <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label={t("Which phrase did you just sign?")}>
            {options.map((o) => { const p = phrase(o, course); const picked = checkPick === o.id; const right = o.id === sign.id;
              return <button key={o.id} type="button" disabled={!!checkPick} onClick={() => setCheckPick(o.id)} className={`${s.option} ${picked ? (right ? s.optRight : s.optWrong) : checkPick && right ? s.optRight : ""}`} lang={course === "english" ? "en" : "es"}>{p}</button>; })}
          </div>
          {checkPick && <button type="button" className={`${s.primary} mt-3`} onClick={() => dispatch({ type: "check_done" })}>{t("Next sign")}<ArrowRight size={18} aria-hidden="true" /></button>}
        </div>}

        {done && <div className={s.done}>
          <p className="text-2xl font-extrabold">{t("Lesson complete")}</p>
          <p className={s.muted}>{t("{n}% of signs completed", { n: lessonScore(st) })}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button type="button" className={s.secondary} onClick={() => onLesson(lesson.id === LESSONS[0].id ? LESSONS[0].id + "" : lesson.id)}><RotateCcw size={16} aria-hidden="true" />{t("Practise again")}</button>
            {nextLesson && <button type="button" className={s.primary} onClick={() => onLesson(nextLesson.id)}>{t("Next lesson")}<ArrowRight size={18} aria-hidden="true" /></button>}
          </div>
        </div>}

        {!done && st.phase !== "welcome" && <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t("Teaching controls")}>
          <button type="button" className={s.ghost} onClick={() => dispatch({ type: "show_again" })}><RotateCcw size={16} aria-hidden="true" />{t("Show again")}</button>
          <button type="button" className={s.ghost} aria-pressed={st.slow} onClick={() => dispatch({ type: "toggle_slow" })}><Snail size={16} aria-hidden="true" />{st.slow ? t("Normal speed") : t("Slow down")}</button>
          <button type="button" className={s.ghost} onClick={() => void askExplain()}><Lightbulb size={16} aria-hidden="true" />{t("Explain")}</button>
          {st.phase === "feedback" && st.last !== "correct" && st.last !== "self" && <button type="button" className={s.ghost} onClick={() => dispatch({ type: "try_again" })}><Pause size={16} aria-hidden="true" />{t("Try again")}</button>}
          <button type="button" className={s.ghost} onClick={() => dispatch({ type: "skip" })}><SkipForward size={16} aria-hidden="true" />{t("Skip")}</button>
          <details className="w-full"><summary className={`${s.ghost} inline-flex cursor-pointer`}><Captions size={16} aria-hidden="true" />{t("Transcript")}</summary>
            <ol className={`mt-2 space-y-1 text-sm ${s.muted}`}>{transcript.map((x, i) => <li key={i}>{x}</li>)}</ol></details>
        </div>}
      </div>
    </div>
  );
}

function Chip({ ok, label, icon }: { ok: boolean; label: string; icon?: React.ReactNode }) {
  return <span className={`${s.chip} ${ok ? s.chipOk : s.chipWarn}`}>{icon ?? (ok ? <Check size={13} aria-hidden="true" /> : <Eye size={13} aria-hidden="true" />)}{label}</span>;
}

function CameraConsent({ status, onStart, t }: { status: string; onStart: () => void; t: TFn }) {
  return (
    <div className="absolute inset-0 grid place-items-center p-5 text-center">
      <div className="max-w-xs">
        <span className={s.camIcon}><Camera size={26} aria-hidden="true" /></span>
        <p className="mt-3 font-extrabold">{t("Practise with your camera")}</p>
        <p className={`mt-1 text-sm ${s.muted}`}>{t("Your video stays on this device. Only hand and body positions are used to check your sign, and nothing is saved.")}</p>
        {status === "denied" && <p className="mt-2 text-sm font-bold text-[var(--isl-warn)]">{t("Camera access was blocked. Allow it in your browser settings to get feedback.")}</p>}
        {status === "error" && <p className="mt-2 text-sm font-bold text-[var(--isl-warn)]">{t("The camera couldn’t start. You can still practise without it.")}</p>}
        <button type="button" onClick={onStart} disabled={status === "starting"} className={`${s.primary} mt-4`}>{status === "starting" ? t("Starting…") : t("Turn on camera")}</button>
      </div>
    </div>
  );
}

function ReplayButton({ url, t }: { url: string; t: TFn }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className={s.ghost} onClick={() => setOpen((x) => !x)}><Play size={16} aria-hidden="true" />{open ? t("Hide my attempt") : t("Replay my attempt")}</button>
    {open && <video src={url} controls autoPlay muted playsInline className={`${s.mirror} h-20 rounded-xl`} />}
  </>;
}

function Settings({ t }: { t: TFn }) {
  const [p, set] = usePrefs();
  return (
    <div className={`${s.settings} mb-3`} role="group" aria-label={t("Caption settings")}>
      <label className="flex items-center gap-2 text-sm">{t("Text size")}<input type="range" min={16} max={30} value={p.captionSize} onChange={(e) => set({ ...p, captionSize: Number(e.target.value) })} /></label>
      <label className="flex items-center gap-2 text-sm">{t("Caption background")}
        <select value={p.captionBg} onChange={(e) => set({ ...p, captionBg: e.target.value as typeof p.captionBg })} className={s.select}>
          <option value="soft">{t("Soft")}</option><option value="solid">{t("Solid")}</option><option value="none">{t("None")}</option></select></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.contrast} onChange={(e) => set({ ...p, contrast: e.target.checked })} />{t("High contrast")}</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.hindi} onChange={(e) => set({ ...p, hindi: e.target.checked })} />{t("Show Hindi")}</label>
    </div>
  );
}

export type { ClassState };
