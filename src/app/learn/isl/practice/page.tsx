"use client";
/**
 * Camera practice with MediaPipe Hand Landmarker (Apache-2.0). Landmarks are drawn on the learner's own video to help
 * with positioning. This is hand TRACKING, not sign recognition: Speakara gives no accuracy score, because no validated
 * ISL classification model exists here. Video never leaves the device.
 */
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Circle, Square, Play } from "lucide-react";
import { AppShell, PageTitle } from "@/components/AppShell";
import { Button, Card, Loading, Notice } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { ISL_COURSES } from "@/lib/isl/courses";
import { useValidatedClips } from "@/lib/isl/data";

const SignTeacher = dynamic(() => import("@/components/isl/SignTeacher").then((m) => m.SignTeacher), { ssr: false, loading: () => <Loading text="Loading the signing teacher…" /> });
const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm";
const MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const BONES = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]];

type Guidance = "start" | "nohands" | "close" | "edge" | "good";
const GUIDE: Record<Guidance, string> = {
  start: /*i18n*/ "Starting hand tracking…", nohands: /*i18n*/ "Show both hands in front of your chest.",
  close: /*i18n*/ "Move back a little so your hands and face fit in the frame.", edge: /*i18n*/ "Move to the centre of the frame.",
  good: /*i18n*/ "Good position. Your hands are clearly visible.",
};

export default function IslPractice() {
  const { t } = useT(); const { clips } = useValidatedClips();
  const words = ISL_COURSES.flatMap((c) => c.units.flatMap((u) => u.vocab.map((w) => ({ ...w, course: c.id }))));
  const [wi, setWi] = useState(0); const word = words[wi];
  const video = useRef<HTMLVideoElement>(null); const canvas = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null); const raf = useRef(0); const lm = useRef<import("@mediapipe/tasks-vision").HandLandmarker | null>(null);
  const rec = useRef<MediaRecorder | null>(null); const chunks = useRef<Blob[]>([]);
  const [on, setOn] = useState(false); const [err, setErr] = useState<string | null>(null); const [guide, setGuide] = useState<Guidance>("start");
  const [consent, setConsent] = useState(false); const [recording, setRecording] = useState(false); const [clipUrl, setClipUrl] = useState<string | null>(null);

  const stop = useCallback(() => { cancelAnimationFrame(raf.current); stream.current?.getTracks().forEach((tr) => tr.stop()); stream.current = null; setOn(false); }, []);
  useEffect(() => () => { stop(); lm.current?.close(); }, [stop]);
  useEffect(() => () => { if (clipUrl) URL.revokeObjectURL(clipUrl); }, [clipUrl]);

  const start = async () => {
    setErr(null);
    try { stream.current = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: false }); }
    catch { setErr(/*i18n*/ "Camera access is blocked or unavailable. Allow the camera for this site in your browser’s address bar, then try again."); return; }
    const v = video.current!; v.srcObject = stream.current; await v.play(); setOn(true);
    try {
      if (!lm.current) {
        const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
        const files = await FilesetResolver.forVisionTasks(WASM);
        lm.current = await HandLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL, delegate: "GPU" }, runningMode: "VIDEO", numHands: 2 });
      }
    } catch { setErr(/*i18n*/ "Hand tracking couldn’t start on this device. You can still record and replay yourself."); }
    const loop = () => {
      const c = canvas.current; const vid = video.current; if (!c || !vid || !stream.current) return;
      c.width = vid.videoWidth; c.height = vid.videoHeight; const g = c.getContext("2d")!; g.clearRect(0, 0, c.width, c.height);
      if (lm.current && vid.readyState >= 2) {
        const res = lm.current.detectForVideo(vid, performance.now());
        const hands = res.landmarks ?? [];
        if (!hands.length) setGuide("nohands");
        else {
          const xs = hands.flat().map((p) => p.x), ys = hands.flat().map((p) => p.y);
          const w = Math.max(...xs) - Math.min(...xs), edge = Math.min(...xs) < 0.04 || Math.max(...xs) > 0.96 || Math.min(...ys) < 0.04 || Math.max(...ys) > 0.96;
          setGuide(w > 0.75 ? "close" : edge ? "edge" : "good");
        }
        for (const h of hands) {
          g.strokeStyle = "#12b76a"; g.lineWidth = 4; g.fillStyle = "#ffb224";
          for (const [a, b] of BONES) { g.beginPath(); g.moveTo(h[a].x * c.width, h[a].y * c.height); g.lineTo(h[b].x * c.width, h[b].y * c.height); g.stroke(); }
          for (const p of h) { g.beginPath(); g.arc(p.x * c.width, p.y * c.height, 5, 0, Math.PI * 2); g.fill(); }
        }
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  };

  const record = () => {
    if (!stream.current) return; chunks.current = [];
    const r = new MediaRecorder(stream.current); rec.current = r;
    r.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
    r.onstop = () => { setClipUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(new Blob(chunks.current, { type: r.mimeType })); }); };
    r.start(); setRecording(true); setTimeout(() => { if (r.state === "recording") { r.stop(); setRecording(false); } }, 15000);
  };

  return (
    <AppShell rail={false} wide>
      <Link href="/learn/isl" className="mb-2 inline-flex min-h-11 items-center text-sm font-extrabold uppercase text-sky-dark">← {t("ISL courses")}</Link>
      <PageTitle title={t("Camera practice")} sub={t("Practise a sign, record yourself and compare with the teacher.")} />
      <Notice tone="info">{t("Hand tracking shows where your hands are. It does not recognise signs, so Speakara does not score your signing. Your video stays on this device and is never uploaded.")}</Notice>
      <label className="mt-4 block max-w-sm"><span className="mb-1 block text-sm font-bold text-sub">{t("Sign to practise")}</span>
        <select value={wi} onChange={(e) => setWi(+e.target.value)} className="min-h-12 w-full rounded-2xl border-2 border-line-dark bg-mist px-3 font-semibold">
          {words.map((w, i) => <option key={w.id} value={i}>{w.text} ({w.course === "spanish" ? "ES" : "EN"}) · {w.meaning}</option>)}</select></label>
      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <section aria-label={t("Reference")}><h2 className="mb-2 text-lg">{t("Reference")}</h2>
          <SignTeacher compact mood={recording ? "listening" : clipUrl ? "encouraging" : "explaining"} clip={clips[word.sign] ?? null} targetLang={word.course === "spanish" ? "es" : "en"} fallback={{ start: 0, end: 1, text: word.text, meaning: word.meaning, hi: word.hi }} />
        </section>
        <section aria-label={t("You")} className="space-y-3"><h2 className="text-lg">{t("You")}</h2>
          <div className="relative overflow-hidden rounded-[28px] bg-ink" style={{ aspectRatio: "4 / 3" }}>
            <video ref={video} playsInline muted className="h-full w-full -scale-x-100 object-cover" aria-label={t("Your camera")} />
            <canvas ref={canvas} className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover" aria-hidden="true" />
            {!on && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white"><Camera size={40} aria-hidden="true" /><p>{t("Your camera is off.")}</p><p className="text-sm opacity-80">{t("You can learn every lesson without a camera.")}</p></div>}
            {recording && <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-coral px-3 py-1 text-sm font-extrabold text-white"><Circle size={12} className="fill-white" aria-hidden="true" />{t("Recording")}</span>}
          </div>
          {on && <Notice tone={guide === "good" ? "success" : "warn"}>{t(GUIDE[guide])}</Notice>}
          {err && <Notice tone="error">{t(err)}</Notice>}
          <div className="flex flex-wrap gap-2">
            {!on && <label className="flex min-h-11 w-full items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5 h-5 w-5 accent-ink" checked={consent} onChange={(e) => setConsent(e.target.checked)} />{t("I agree to turn on my camera for practice. The video is processed on this device and is not uploaded or saved.")}</label>}
            {!on ? <Button disabled={!consent} onClick={() => void start()}><Camera size={18} aria-hidden="true" />{t("Turn on camera")}</Button> : <Button variant="secondary" onClick={stop}><CameraOff size={18} aria-hidden="true" />{t("Turn off camera")}</Button>}
            {on && !recording && <Button variant="danger" onClick={record}><Circle size={18} aria-hidden="true" />{t("Record (up to 15 s)")}</Button>}
            {recording && <Button variant="secondary" onClick={() => { rec.current?.stop(); setRecording(false); }}><Square size={18} aria-hidden="true" />{t("Stop")}</Button>}
          </div>
          {clipUrl && <Card><h3 className="mb-2 flex items-center gap-2 text-lg"><Play size={18} aria-hidden="true" />{t("Your attempt")}</h3><video src={clipUrl} controls playsInline className="w-full -scale-x-100 rounded-2xl" aria-label={t("Your recorded attempt")} /><p className="mt-2 text-sm text-sub">{t("Compare your handshape, movement and facial expression with the reference.")}</p></Card>}
        </section>
      </div>
    </AppShell>
  );
}
