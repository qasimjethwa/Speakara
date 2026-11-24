"use client";
/**
 * On-device camera tracking for the classroom. Video frames never leave the browser: MediaPipe runs locally and only
 * landmark numbers are kept, in memory, for the attempt being judged.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { RawFrame } from "./features";

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm";
const HAND = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const POSE = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const SAMPLE_MS = 1000 / 15;   // same 15 fps the recogniser was trained at

export type CamStatus = "off" | "starting" | "on" | "denied" | "error";
export interface Guidance { body: boolean; hands: number; light: "ok" | "dark" | "bright"; framed: boolean }

type Tasks = { hand: import("@mediapipe/tasks-vision").HandLandmarker; pose: import("@mediapipe/tasks-vision").PoseLandmarker };

export function useSignCamera() {
  const video = useRef<HTMLVideoElement | null>(null);
  const overlay = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<CamStatus>("off");
  const [guide, setGuide] = useState<Guidance>({ body: false, hands: 0, light: "ok", framed: false });
  const stream = useRef<MediaStream | null>(null); const tasks = useRef<Tasks | null>(null);
  const raf = useRef(0); const last = useRef(0);
  const rec = useRef<RawFrame[] | null>(null);
  const probe = useRef<HTMLCanvasElement | null>(null); const small = useRef<HTMLCanvasElement | null>(null); const ts = useRef(0);

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current); stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null;
    if (video.current) video.current.srcObject = null; setStatus("off");
  }, []);
  useEffect(() => stop, [stop]);

  const draw = useCallback((fr: RawFrame) => {
    const c = overlay.current, v = video.current; if (!c || !v) return;
    c.width = v.videoWidth; c.height = v.videoHeight; const g = c.getContext("2d"); if (!g) return;
    g.clearRect(0, 0, c.width, c.height); g.lineWidth = 3; g.strokeStyle = "rgba(10,133,73,.85)"; g.fillStyle = "#fff";
    const B = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]];
    for (const h of fr.hands) {
      for (const [a, b] of B) { g.beginPath(); g.moveTo(h.pts[a][0] * c.width, h.pts[a][1] * c.height); g.lineTo(h.pts[b][0] * c.width, h.pts[b][1] * c.height); g.stroke(); }
      for (const p of h.pts) { g.beginPath(); g.arc(p[0] * c.width, p[1] * c.height, 3.5, 0, 7); g.fill(); }
    }
  }, []);

  const brightness = useCallback(() => {
    const v = video.current; if (!v) return "ok" as const;
    const c = (probe.current ??= document.createElement("canvas")); c.width = 32; c.height = 24;
    const g = c.getContext("2d", { willReadFrequently: true }); if (!g) return "ok" as const;
    g.drawImage(v, 0, 0, 32, 24); const d = g.getImageData(0, 0, 32, 24).data; let s = 0;
    for (let i = 0; i < d.length; i += 4) s += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const m = s / (d.length / 4); return m < 55 ? "dark" as const : m > 225 ? "bright" as const : "ok" as const;
  }, []);

  const tick = useRef<() => void>(() => {});
  const loop = useCallback(() => {
    raf.current = requestAnimationFrame(() => tick.current());
    const v = video.current, t = tasks.current; if (!v || !t || v.readyState < 2) return;
    const now = performance.now(); if (now - last.current < SAMPLE_MS) return; last.current = now; const stamp = Math.max(now, (ts.current += 1));
    // track on a small copy of the frame: landmarks are resolution-independent and this keeps ordinary devices fast
    const sm = (small.current ??= document.createElement("canvas")); sm.width = Math.min(640, v.videoWidth || 640); sm.height = Math.round(sm.width * v.videoHeight / (v.videoWidth || 640)) || 480;
    sm.getContext("2d")?.drawImage(v, 0, 0, sm.width, sm.height);
    ts.current = stamp; const hr = t.hand.detectForVideo(sm, stamp), pr = t.pose.detectForVideo(sm, stamp);
    const pose = pr.landmarks[0]?.slice(0, 25).map((l) => [l.x, l.y, l.visibility ?? 0] as [number, number, number]) ?? null;
    const fr: RawFrame = { pose, hands: hr.landmarks.map((lms, i) => ({ side: hr.handedness[i]?.[0]?.categoryName ?? "", score: hr.handedness[i]?.[0]?.score ?? 0, pts: lms.map((l) => [l.x, l.y, l.z] as [number, number, number]) })) };
    if (rec.current) rec.current.push(fr);
    draw(fr);
    if (Math.round(now / SAMPLE_MS) % 8 === 0) {
      const sh = pose ? Math.abs(pose[11][0] - pose[12][0]) : 0;
      setGuide({ body: !!pose && (pose[11][2] > 0.5 && pose[12][2] > 0.5), hands: fr.hands.length, light: brightness(), framed: sh > 0.18 && sh < 0.6 });
    }
  }, [draw, brightness]);
  useEffect(() => { tick.current = loop; }, [loop]);

  const start = useCallback(async () => {
    setStatus("starting");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: false });
    } catch { setStatus("denied"); return; }
    try {
      const v = video.current!; v.srcObject = stream.current; await v.play();
      if (!tasks.current) {
        const { FilesetResolver, HandLandmarker, PoseLandmarker } = await import("@mediapipe/tasks-vision");
        const fs = await FilesetResolver.forVisionTasks(WASM);
        const make = (delegate: "GPU" | "CPU") => Promise.all([
          HandLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: HAND, delegate }, runningMode: "VIDEO", numHands: 2, minHandDetectionConfidence: 0.4 }),
          PoseLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: POSE, delegate }, runningMode: "VIDEO" }),
        ]);
        // pick whichever is faster on THIS device: software-rendered "GPUs" can be 10x slower than the CPU path
        const bench = ([h, p]: [Tasks["hand"], Tasks["pose"]]) => {
          const c = document.createElement("canvas"); c.width = 320; c.height = 240; const t0 = performance.now();
          for (let i = 1; i <= 3; i++) { h.detectForVideo(c, t0 + i * 70); p.detectForVideo(c, t0 + i * 70); }
          return (performance.now() - t0) / 3;
        };
        let best = await make("CPU"); const cpu = bench(best); ts.current = performance.now() + 1000;
        if (cpu > 40) { const gpu = await make("GPU").catch(() => null); if (gpu && bench(gpu) < cpu) { best[0].close(); best[1].close(); best = gpu; } else gpu?.forEach((x) => x.close()); }
        tasks.current = { hand: best[0], pose: best[1] };
      }
      setStatus("on"); loop();
    } catch { setStatus("error"); stop(); }
  }, [loop, stop]);

  /** Records landmark frames (and a replay clip kept only in this tab's memory) for `ms` milliseconds. Nothing is uploaded. */
  const capture = useCallback((ms: number) => new Promise<{ frames: RawFrame[]; replay: string | null }>((resolve) => {
    rec.current = []; let mr: MediaRecorder | null = null; const chunks: Blob[] = [];
    try { if (stream.current && typeof MediaRecorder !== "undefined") { mr = new MediaRecorder(stream.current); mr.ondataavailable = (e) => chunks.push(e.data); mr.start(); } } catch { mr = null; }
    setTimeout(() => {
      const frames = rec.current ?? []; rec.current = null;
      if (!mr) { resolve({ frames, replay: null }); return; }
      mr.onstop = () => resolve({ frames, replay: chunks.length ? URL.createObjectURL(new Blob(chunks, { type: mr!.mimeType })) : null }); mr.stop();
    }, ms);
  }), []);

  return { video, overlay, status, guide, start, stop, capture };
}
