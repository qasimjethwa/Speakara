"use client";
/**
 * Current ISL release: live hand tracking only (MediaPipe, on-device). It shows hand and finger landmarks,
 * camera guidance, and lets the learner record and replay their hand movements. It does NOT recognise or grade signs.
 * Everything else is presented as "Coming soon"; that code stays in this module, unused, until it is ready.
 */
import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Check, Circle, Eye, GraduationCap, Hand, Languages, Play, Sparkles, Square, Sun, UserRound, Users } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { RawFrame } from "./recognition/features";
import { useSignCamera } from "./recognition/camera";
import s from "./classroom.module.css";

const BONES = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]];
const RECORD_MS = 5000;

const SOON = [
  { icon: GraduationCap, title: /*i18n*/ "Realistic AI signing teacher", text: /*i18n*/ "A lifelike teacher who demonstrates signs reviewed by Deaf ISL educators." },
  { icon: UserRound, title: /*i18n*/ "Choose your teacher", text: /*i18n*/ "Pick a female or male teacher." },
  { icon: Sparkles, title: /*i18n*/ "Interactive AI teaching", text: /*i18n*/ "Lessons that respond to you, explain and adapt as you go." },
  { icon: Eye, title: /*i18n*/ "Sign recognition and feedback", text: /*i18n*/ "Speakara will check your signs and help you correct them." },
  { icon: Languages, title: /*i18n*/ "English and Spanish through ISL", text: /*i18n*/ "A1 courses in written English and Spanish, taught in Indian Sign Language." },
  { icon: Users, title: /*i18n*/ "Personalised ISL sessions", text: /*i18n*/ "Practice planned around your progress." },
] as const;

export function HandTrackingDemo() {
  const { t } = useT(); const cam = useSignCamera();
  const [phase, setPhase] = useState<"idle" | "count" | "rec">("idle"); const [count, setCount] = useState(0);
  const [take, setTake] = useState<{ frames: RawFrame[]; video: string | null } | null>(null);
  const on = cam.status === "on";

  const record = async () => {
    setPhase("count"); for (let i = 3; i > 0; i--) { setCount(i); await new Promise((r) => setTimeout(r, 700)); }
    setPhase("rec"); const r = await cam.capture(RECORD_MS);
    setTake((old) => { if (old?.video) URL.revokeObjectURL(old.video); return { frames: r.frames, video: r.replay }; }); setPhase("idle");
  };
  useEffect(() => () => { if (take?.video) URL.revokeObjectURL(take.video); }, [take]);

  return (
    <div className={s.room} data-testid="isl-hand-tracking">
      <header className="mb-4">
        <p className={s.eyebrow}>{t("Indian Sign Language")}</p>
        <h1 className="mt-1 text-2xl sm:text-3xl">{t("Live hand tracking")}</h1>
        <p className={`mt-1 max-w-2xl ${s.muted}`}>{t("See your hands and fingers tracked in real time, then record and replay your movements. This shows hand positions only; it does not check signs yet.")}</p>
      </header>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className={s.panel} aria-label={t("Your camera")}>
          <div className={s.stage}>
            <video ref={cam.video} muted playsInline className={`${s.mirror} h-full w-full object-cover ${on ? "" : "hidden"}`} />
            <canvas ref={cam.overlay} className={`${s.mirror} pointer-events-none absolute inset-0 h-full w-full object-cover ${on ? "" : "hidden"}`} aria-hidden="true" />
            {!on && <Consent status={cam.status} onStart={() => void cam.start()} />}
            {on && <div className="absolute left-3 top-3 flex flex-wrap gap-1.5" aria-live="polite">
              <Chip ok={cam.guide.hands > 0} label={cam.guide.hands === 2 ? t("2 hands tracked") : cam.guide.hands === 1 ? t("1 hand tracked") : t("Show your hands")} />
              <Chip ok={cam.guide.body} label={t("Upper body")} />
              {cam.guide.light !== "ok" && <Chip ok={false} label={t(cam.guide.light === "dark" ? "Too dark" : "Too bright")} icon={<Sun size={13} aria-hidden="true" />} />}
              {cam.guide.body && !cam.guide.framed && <Chip ok={false} label={t("Move a little closer or further")} />}
            </div>}
            {phase !== "idle" && <span className={s.rec} data-testid="rec-badge">{phase === "count" ? count : <><span className={s.recDot} aria-hidden="true" />{t("Recording…")}</>}</span>}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {on && <button type="button" className={s.primary} disabled={phase !== "idle"} onClick={() => void record()} data-testid="record"><Circle size={16} aria-hidden="true" />{t("Record 5 seconds")}</button>}
            {on && <button type="button" className={s.ghost} onClick={cam.stop}><CameraOff size={16} aria-hidden="true" />{t("Turn camera off")}</button>}
          </div>
        </section>

        <section className={s.panel} aria-label={t("Replay")}>
          <div className={s.stage}>
            {take ? <Replay take={take} /> : <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div><span className={s.camIcon}><Play size={24} aria-hidden="true" /></span><p className={`mt-3 text-sm ${s.muted}`}>{t("Record your hands to replay the movement here.")}</p></div></div>}
          </div>
          <ul className={`mt-3 space-y-1.5 px-1 text-sm ${s.muted}`}>
            <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[var(--isl-green)]" aria-hidden="true" />{t("Sit so your head, shoulders and both hands are in view.")}</li>
            <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[var(--isl-green)]" aria-hidden="true" />{t("Face a window or lamp; avoid bright light behind you.")}</li>
            <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[var(--isl-green)]" aria-hidden="true" />{t("Your video stays on this device and is never uploaded or saved.")}</li>
          </ul>
        </section>
      </div>

      <section className="mt-8" aria-labelledby="soon-title">
        <div className="mb-3 flex items-center gap-2"><h2 id="soon-title" className="text-xl">{t("Coming soon")}</h2><span className={`${s.chip} ${s.chipOk}`}>{t("The future of ISL on Speakara")}</span></div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SOON.map(({ icon: I, title, text }) => (
            <li key={title} className={`${s.panel} p-4`} data-soon>
              <div className="flex items-center gap-2"><span className={s.soonIcon}><I size={18} aria-hidden="true" /></span><span className="font-extrabold">{t(title)}</span></div>
              <p className={`mt-2 text-sm ${s.muted}`}>{t(text)}</p>
              <span className={s.soonTag}>{t("Coming soon")}</span>
            </li>))}
        </ul>
      </section>
    </div>
  );
}

function Consent({ status, onStart }: { status: string; onStart: () => void }) {
  const { t } = useT();
  return (
    <div className="absolute inset-0 grid place-items-center p-5 text-center">
      <div className="max-w-xs">
        <span className={s.camIcon}><Hand size={26} aria-hidden="true" /></span>
        <p className="mt-3 font-extrabold">{t("Turn on your camera to start")}</p>
        <p className={`mt-1 text-sm ${s.muted}`}>{t("Hand tracking runs on this device. Your video is never uploaded or saved.")}</p>
        {status === "denied" && <p className="mt-2 text-sm font-bold text-[var(--isl-warn)]">{t("Camera access was blocked. Allow it in your browser settings to get feedback.")}</p>}
        {status === "error" && <p className="mt-2 text-sm font-bold text-[var(--isl-warn)]">{t("The camera couldn’t start. Please try again.")}</p>}
        <button type="button" onClick={onStart} disabled={status === "starting"} className={`${s.primary} mt-4`}><Camera size={18} aria-hidden="true" />{status === "starting" ? t("Starting…") : t("Turn on camera")}</button>
      </div>
    </div>
  );
}

function Chip({ ok, label, icon }: { ok: boolean; label: string; icon?: React.ReactNode }) {
  return <span className={`${s.chip} ${ok ? s.chipOk : s.chipWarn}`}>{icon ?? (ok ? <Check size={13} aria-hidden="true" /> : <Eye size={13} aria-hidden="true" />)}{label}</span>;
}

/** Replays the recorded hand landmarks (and the clip itself, if the browser recorded one). */
function Replay({ take }: { take: { frames: RawFrame[]; video: string | null } }) {
  const { t } = useT(); const c = useRef<HTMLCanvasElement>(null); const [mode, setMode] = useState<"hands" | "video">("hands"); const [run, setRun] = useState(0);
  useEffect(() => {
    if (mode !== "hands") return; const cv = c.current; if (!cv) return; const g = cv.getContext("2d"); if (!g) return;
    let i = 0, raf = 0, last = 0; const step = 1000 / 15;
    // zoom to the area the hands moved through, so movement is easy to see even when the camera is far away
    const all = take.frames.flatMap((f) => f.hands.flatMap((h) => h.pts));
    const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
    const x0 = xs.length ? Math.min(...xs) : 0, x1 = xs.length ? Math.max(...xs) : 1, y0 = ys.length ? Math.min(...ys) : 0, y1 = ys.length ? Math.max(...ys) : 1;
    const k = Math.min(cv.width / ((x1 - x0) * cv.width * 1.3 || 1), cv.height * 0.8 / ((y1 - y0) * cv.height * 1.3 || 1), 6);
    const X = (x: number) => (x - (x0 + x1) / 2) * cv.width * k + cv.width / 2, Y = (y: number) => (y - (y0 + y1) / 2) * cv.height * k + cv.height * 0.42;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw); if (now - last < step) return; last = now;
      const f = take.frames[i]; g.clearRect(0, 0, cv.width, cv.height);
      if (f) for (const h of f.hands) {
        g.strokeStyle = "#0a8549"; g.lineWidth = 4; g.lineCap = "round";
        for (const [a, b] of BONES) { g.beginPath(); g.moveTo(X(h.pts[a][0]), Y(h.pts[a][1])); g.lineTo(X(h.pts[b][0]), Y(h.pts[b][1])); g.stroke(); }
        g.fillStyle = "#23262b"; for (const p of h.pts) { g.beginPath(); g.arc(X(p[0]), Y(p[1]), 4, 0, 7); g.fill(); }
      }
      i = (i + 1) % Math.max(1, take.frames.length);
    };
    raf = requestAnimationFrame(draw); return () => cancelAnimationFrame(raf);
  }, [take, mode, run]);
  const seen = take.frames.filter((f) => f.hands.length).length;
  return <>
    {mode === "hands" ? <canvas ref={c} width={640} height={480} className={`${s.mirror} h-full w-full`} data-testid="replay-hands" aria-label={t("Replay of your hand movement")} />
      : take.video && <video src={take.video} autoPlay loop muted playsInline controls className={`${s.mirror} h-full w-full object-cover`} />}
    <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-1.5">
      <button type="button" className={s.ghost} aria-pressed={mode === "hands"} onClick={() => { setMode("hands"); setRun((x) => x + 1); }}><Hand size={15} aria-hidden="true" />{t("Hand movement")}</button>
      {take.video && <button type="button" className={s.ghost} aria-pressed={mode === "video"} onClick={() => setMode("video")}><Square size={15} aria-hidden="true" />{t("Video")}</button>}
      <span className={`${s.chip} ml-auto`} data-testid="replay-stats">{t("Hands seen in {n} of {m} frames", { n: seen, m: take.frames.length })}</span>
    </div>
  </>;
}
