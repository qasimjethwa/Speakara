"use client";
/**
 * On-device Arabic speech with Nabra-7M-Distill (nabra-tts, vendored at a pinned commit). Runs in a Web Worker on
 * WebGPU, falling back to WebAssembly; nothing is generated on a server. The engine and model are only fetched after
 * the learner chooses "Download Arabic voice" in Settings, then cached for offline use.
 *
 * Status: CANDIDATE voice. Its pronunciation has not yet been approved by an Arabic speaker.
 */
import type { NabraTTS } from "@/vendor/nabra-tts/index.js";

const REPO = "oddadmix/Nabra-7M-Distill-ONNX";
const REVISION = "bbac0f1e6b001bfae89871be366a4b000180deb2";
const ORT = "1.30.0";
/** Model files are self-hosted (scripts/voice-assets.mjs downloads and verifies them at build time). */
const hf = (f: string) => `/vendor/nabra/${REVISION.slice(0, 7)}/${f}`;
/** SHA-256 of every pinned file: a changed or corrupted download is rejected, never played. */
const FILES = {
  fp16: { url: hf("onnx/model_fp16.onnx"), sha: "cafb38ee0d39629c1e228fd7f120bb8dbec896342880f3ac8318cfc10e3f19ff", size: 15969086 },
  fp32: { url: hf("onnx/model.onnx"), sha: "08c1df048f2decbff3f86dc8e625e10ff3c8d5f66dfc97881c6974272f41ca5e", size: 30542978 },
  voice: { url: hf("voices/af_msa.bin"), sha: "129d447a7c9bdce1d5b6cb5ecb789bbfd9f427b7775131a97dfa5638583b3b92", size: 522240 },
} as const;
const RUNTIME = ["ort-wasm-simd-threaded.jsep.mjs", "ort-wasm-simd-threaded.jsep.wasm"].map((f) => `/vendor/ort/${ORT}/${f}`);
const RUNTIME_SIZE = 28_360_000;
const CACHE = "nabra-tts";            // the library reads model files from this cache by URL
const FLAG = "speakara:arabic-voice:v1";

export type VoiceStatus = "unsupported" | "not-downloaded" | "downloading" | "loading" | "ready" | "error";
export interface VoiceState { status: VoiceStatus; progress: number; error?: string; device?: "webgpu" | "wasm"; dtype?: "fp16" | "fp32"; lowMemory?: boolean; generating?: boolean }

let state: VoiceState = { status: "not-downloaded", progress: 0 };
const listeners = new Set<(s: VoiceState) => void>();
const set = (patch: Partial<VoiceState>) => { state = { ...state, ...patch }; for (const l of listeners) l(state); };
export const getVoiceState = () => state;
export function subscribeVoice(fn: (s: VoiceState) => void) { listeners.add(fn); fn(state); return () => { listeners.delete(fn); }; }

const read = (): { dtype: "fp16" | "fp32" } | null => { try { return JSON.parse(localStorage.getItem(FLAG) ?? "null"); } catch { return null; } };
const write = (v: { dtype: "fp16" | "fp32" } | null) => { try { if (v) localStorage.setItem(FLAG, JSON.stringify(v)); else localStorage.removeItem(FLAG); } catch { /* storage blocked */ } };

/** What this browser can do. Without WebAssembly or Workers the voice cannot run at all. */
export function voiceSupport(): { ok: boolean; reason?: string; lowMemory: boolean } {
  if (typeof window === "undefined") return { ok: false, reason: "server", lowMemory: false };
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const lowMemory = typeof mem === "number" && mem <= 2;
  if (typeof WebAssembly === "undefined" || typeof Worker === "undefined") return { ok: false, reason: "This browser cannot run on-device speech (no WebAssembly or Web Workers).", lowMemory };
  return { ok: true, lowMemory };
}
/** True when the learner has downloaded the voice on this device (files verified and cached). */
export const voiceDownloaded = () => !!read();

/** Refreshes the state from storage; call once on the client. Detects a cache cleared by the browser. */
export async function initVoice() {
  const sup = voiceSupport();
  if (!sup.ok) return set({ status: "unsupported", error: sup.reason, lowMemory: sup.lowMemory });
  const saved = read();
  if (state.status === "downloading" || state.status === "loading" || state.status === "ready") return;
  if (saved && typeof caches !== "undefined") {
    const c = await caches.open(CACHE).catch(() => null);
    const have = c && (await Promise.all([FILES[saved.dtype].url, FILES.voice.url].map((u) => c.match(abs(u))))).every(Boolean);
    if (!have) { write(null); return set({ status: "not-downloaded", progress: 0, lowMemory: sup.lowMemory, error: "The saved Arabic voice was removed by the browser. Download it again." }); }
  }
  set({ status: saved ? "loading" : "not-downloaded", dtype: saved?.dtype, progress: saved ? 1 : 0, lowMemory: sup.lowMemory, error: undefined });
  if (saved) set({ status: "ready" });   // files are cached; the engine itself starts on first use
}

/** FP16 halves the download; it is used where the GPU supports 16-bit float shaders. Elsewhere FP32 is used. */
type Adapter = { features: Set<string>; isFallbackAdapter?: boolean; info?: { isFallbackAdapter?: boolean; architecture?: string; vendor?: string } };
async function gpuAdapter(): Promise<Adapter | null> {
  try { const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<Adapter | null> } }).gpu; return gpu ? await gpu.requestAdapter() : null; } catch { return null; }
}
/** A software ("fallback") WebGPU adapter such as SwiftShader is many times slower than WebAssembly: skip it. */
const realGpu = (a: Adapter | null) => !!a && !a.isFallbackAdapter && !a.info?.isFallbackAdapter && !/swiftshader/i.test(`${a.info?.architecture ?? ""} ${a.info?.vendor ?? ""}`);
async function pickDtype(): Promise<"fp16" | "fp32"> {
  const a = await gpuAdapter();
  return realGpu(a) && a!.features.has("shader-f16") ? "fp16" : "fp32";
}

const abs = (u: string) => new URL(u, location.href).href;
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
async function fetchVerified(url: string, sha: string | null, onBytes: (n: number) => void, signal: AbortSignal): Promise<ArrayBuffer> {
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok || !res.body) throw new Error(`Download failed (${res.status})`);
  const reader = res.body.getReader(); const parts: Uint8Array[] = []; let n = 0;
  for (;;) { const { done, value } = await reader.read(); if (done) break; parts.push(value); n += value.byteLength; onBytes(value.byteLength); }
  const buf = new Uint8Array(n); let o = 0; for (const p of parts) { buf.set(p, o); o += p.byteLength; }
  if (sha && hex(await crypto.subtle.digest("SHA-256", buf)) !== sha) throw new Error("The downloaded voice file did not match its checksum, so it was discarded.");
  return buf.buffer;
}

let abort: AbortController | null = null;
/** Downloads, verifies and caches the runtime, model and voice, then starts the engine. Safe to call again to retry. */
export async function downloadVoice(): Promise<boolean> {
  const sup = voiceSupport();
  if (!sup.ok) { set({ status: "unsupported", error: sup.reason }); return false; }
  if (state.status === "downloading") return false;
  abort?.abort(); abort = new AbortController();
  const dtype = await pickDtype();
  const model = FILES[dtype];
  const total = model.size + FILES.voice.size + RUNTIME_SIZE; let got = 0;
  set({ status: "downloading", progress: 0, error: undefined, dtype });
  try {
    if (typeof caches === "undefined") throw new Error("This browser blocks offline storage (private mode?), so the voice cannot be saved.");
    const est = await navigator.storage?.estimate?.().catch(() => undefined);
    if (est?.quota && est.usage !== undefined && est.quota - est.usage < total * 1.5) throw new Error("Not enough free storage on this device for the Arabic voice (about 45–75 MB needed).");
    const cache = await caches.open(CACHE);
    const tick = (n: number) => { got += n; set({ progress: Math.min(0.99, got / total) }); };
    // Runtime files are same-origin; the service worker serves them from this cache when offline.
    for (const u of RUNTIME) { const abs = new URL(u, location.href).href; const b = await fetchVerified(abs, null, tick, abort.signal); await cache.put(abs, new Response(b, { headers: { "Content-Type": u.endsWith(".wasm") ? "application/wasm" : "text/javascript" } })); }
    for (const f of [model, FILES.voice]) { const b = await fetchVerified(abs(f.url), f.sha, tick, abort.signal); await cache.put(abs(f.url), new Response(b, { headers: { "Content-Type": "application/octet-stream", "Content-Length": String(b.byteLength) } })); }
    write({ dtype });
    void navigator.storage?.persist?.().catch(() => false);
    set({ status: "loading", progress: 1 });
    await engine();
    return true;
  } catch (e) {
    const msg = (e as Error).name === "AbortError" ? "Download cancelled." : (e as Error).message || "Download failed.";
    write(null); set({ status: "error", error: msg }); return false;
  }
}
export function cancelDownload() { abort?.abort(); }

/** Removes the voice and its cached files from this device. */
export async function removeVoice() {
  stopArabic(); const t = tts; tts = null; loading = null; await t?.then((x) => x.dispose()).catch(() => {});
  write(null); await caches?.delete(CACHE).catch(() => false);
  set({ status: "not-downloaded", progress: 0, error: undefined, device: undefined });
}

let tts: Promise<NabraTTS> | null = null; let loading: Promise<NabraTTS> | null = null;
/** Starts the engine from the cached files (lazy: the vendored package is a separate chunk). */
function engine(): Promise<NabraTTS> {
  if (tts) return tts;
  const saved = read(); if (!saved) return Promise.reject(new Error("not-downloaded"));
  set({ status: "loading" });
  loading = (async () => {
    const { NabraTTS } = await import("@/vendor/nabra-tts/index.js");
    const device = realGpu(await gpuAdapter()) ? "auto" : "wasm";
    const t = await NabraTTS.load({ repo: REPO, revision: REVISION, dtype: saved.dtype, device, cache: true,
      modelUrl: FILES[saved.dtype].url, voiceUrl: FILES.voice.url, wasmPaths: `/vendor/ort/${ORT}/`, numThreads: 1 });
    set({ status: "ready", device: t.device, error: undefined });
    return t;
  })();
  tts = loading.catch((e: Error) => { tts = null; set({ status: "error", error: /memory|allocate|OOM/i.test(e.message) ? "This device ran out of memory loading the Arabic voice. Close other tabs and try again." : `The Arabic voice could not start: ${e.message}` }); throw e; });
  return tts;
}

/* ---------- playback ---------- */
let actx: AudioContext | null = null; let src: AudioBufferSourceNode | null = null; let token = 0;
const clips = new Map<string, Float32Array>();
function ctx() { const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext; actx ??= new C(); if (actx.state !== "running") void actx.resume().catch(() => {}); return actx; }
export const lastPlayback: { text: string; speed: number; ms: number; samples: number; cached: boolean; device?: string }[] = [];

/** Stops any Arabic speech that is generating or playing. */
export function stopArabic() { token++; try { src?.stop(); } catch { /* already stopped */ } src = null; if (state.generating) set({ generating: false }); }

/**
 * Speaks Arabic text with the on-device voice. Resolves true when it finished playing, false when it was stopped,
 * failed or the voice is not downloaded. Replays come from memory, so they start instantly. Slow uses the model's
 * own speed control (not a pitch-shifting playback rate).
 */
export async function speakArabic(text: string, rate = 1): Promise<boolean> {
  if (!voiceDownloaded()) return false;
  stopArabic(); const mine = token;
  const speed = rate < 0.95 ? 0.75 : 1; const key = `${speed}|${text}`;
  try {
    const c = ctx(); // created inside the user's tap, so Safari lets it play
    let audio = clips.get(key); const cached = !!audio; const t0 = performance.now();
    if (!audio) {
      set({ generating: true });
      const t = await engine(); if (mine !== token) return false;
      const parts: Float32Array[] = [];
      const timeout = setTimeout(() => { if (mine === token) stopArabic(); }, 25000);
      try { for await (const ch of t.stream(text, { speed })) { if (mine !== token) break; parts.push(ch.audio); } } finally { clearTimeout(timeout); }
      if (mine !== token) return false;
      set({ generating: false });
      const n = parts.reduce((a, p) => a + p.length, 0); audio = new Float32Array(n); let o = 0; for (const p of parts) { audio.set(p, o); o += p.length; }
      if (!n) return false;
      clips.set(key, audio); if (clips.size > 40) clips.delete(clips.keys().next().value!);
    }
    lastPlayback.push({ text, speed, ms: Math.round(performance.now() - t0), samples: audio.length, cached, device: state.device }); if (lastPlayback.length > 20) lastPlayback.shift();
    const buf = c.createBuffer(1, audio.length, 24000); buf.copyToChannel(audio as Float32Array<ArrayBuffer>, 0);
    const s = c.createBufferSource(); s.buffer = buf; s.connect(c.destination); src = s;
    return await new Promise<boolean>((resolve) => { s.onended = () => { if (src === s) src = null; resolve(mine === token); }; s.start(); });
  } catch { if (mine === token) set({ generating: false }); return false; }
}
/** Generates audio without playing it (used by the pronunciation tests). Returns 24 kHz mono samples. */
export async function synthArabic(text: string, speed = 1): Promise<Float32Array> {
  const t = await engine(); const parts: Float32Array[] = [];
  for await (const ch of t.stream(text, { speed })) parts.push(ch.audio);
  const out = new Float32Array(parts.reduce((a, p) => a + p.length, 0)); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
export async function phonemesArabic(text: string): Promise<string[]> { return (await engine()).phonemize(text); }
if (typeof window !== "undefined") (window as unknown as { __arabicVoice?: unknown }).__arabicVoice = { lastPlayback, getVoiceState, synthArabic, phonemesArabic };
