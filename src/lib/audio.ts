"use client";
/** Browser speech, recording and synthesised sound effects. No third-party recordings are shipped. */

export const canSpeakAloud = () => typeof window !== "undefined" && "speechSynthesis" in window;
const remoteTts = process.env.NEXT_PUBLIC_TTS_REMOTE === "1";
const clips = new Map<string, HTMLAudioElement>();

/** Picks the most natural installed voice for a locale: exact locale first, then enhanced/neural voices. */
export function pickVoice(lang: string): SpeechSynthesisVoice | null {
  if (!canSpeakAloud()) return null;
  const voices = window.speechSynthesis.getVoices();
  const base = lang.slice(0, 2).toLowerCase();
  const pool = voices.filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith(base));
  const score = (v: SpeechSynthesisVoice) => (v.lang.replace("_", "-").toLowerCase() === lang.toLowerCase() ? 4 : 0) + (/natural|neural|enhanced|premium|google|siri/i.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1);
  return pool.sort((a, b) => score(b) - score(a))[0] ?? null;
}
/** "ok" when a voice for the language exists; "no-voice" when the browser can speak but lacks that language. */
export function ttsStatus(lang: string): "ok" | "no-voice" | "unsupported" {
  if (remoteTts) return "ok";
  if (!canSpeakAloud()) return "unsupported";
  return window.speechSynthesis.getVoices().length === 0 || pickVoice(lang) ? "ok" : "no-voice";
}
/** Resolves when voices have loaded (they arrive asynchronously in Chromium). */
export function voicesReady(): Promise<void> {
  if (!canSpeakAloud() || window.speechSynthesis.getVoices().length) return Promise.resolve();
  return new Promise((resolve) => { const done = () => resolve(); window.speechSynthesis.addEventListener("voiceschanged", done, { once: true }); setTimeout(done, 1200); });
}

/** Speaks text. Resolves true when playback finished, false if it could not be played. */
export function say(text: string, lang: string, rate = 1): Promise<boolean> {
  if (remoteTts) {
    const key = `${lang}|${text}`;
    let clip = clips.get(key);
    if (!clip) { clip = new Audio(`/api/tts?lang=${encodeURIComponent(lang)}&text=${encodeURIComponent(text)}`); clips.set(key, clip); if (clips.size > 80) clips.delete(clips.keys().next().value!); }
    clip.playbackRate = rate; clip.currentTime = 0;
    return clip.play().then(() => true, () => sayLocal(text, lang, rate));
  }
  return sayLocal(text, lang, rate);
}
function sayLocal(text: string, lang: string, rate: number): Promise<boolean> {
  if (!canSpeakAloud()) return Promise.resolve(false);
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = rate;
    const voice = pickVoice(lang); if (voice) u.voice = voice;
    u.onend = () => resolve(true); u.onerror = () => resolve(false);
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
  });
}

let ctx: AudioContext | null = null;
function tone(freqs: number[], step = 0.09, type: OscillatorType = "sine") {
  try {
    ctx ??= new AudioContext();
    freqs.forEach((f, i) => {
      const o = ctx!.createOscillator(), g = ctx!.createGain(), t = ctx!.currentTime + i * step;
      o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + step * 1.6);
      o.connect(g).connect(ctx!.destination); o.start(t); o.stop(t + step * 1.8);
    });
  } catch { /* audio unavailable */ }
}
export const sfx = {
  correct: () => tone([587, 880]), wrong: () => tone([233, 185], 0.12, "triangle"), tap: () => tone([440], 0.04),
  finish: () => tone([523, 659, 784, 1047], 0.11),
};

type Rec = { lang: string; interimResults: boolean; maxAlternatives: number; start(): void; stop(): void; onresult: ((e: { results: { 0: { transcript: string } }[] }) => void) | null; onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null };
export function speechRecognizer(): (new () => Rec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
/** Resolves with the transcript, or rejects with the recogniser's reason ("not-allowed", "no-speech", "network", …). */
export function listenOnce(lang: string, onStart?: () => void): { promise: Promise<string>; stop: () => void } {
  const R = speechRecognizer();
  if (!R) return { promise: Promise.reject(new Error("unsupported")), stop: () => {} };
  const rec = new R(); rec.lang = lang; rec.interimResults = false; rec.maxAlternatives = 1;
  const promise = new Promise<string>((resolve, reject) => {
    let got = false;
    rec.onresult = (e) => { got = true; resolve(e.results[0][0].transcript); };
    rec.onerror = (e) => reject(new Error(e.error));
    rec.onend = () => { if (!got) reject(new Error("no-speech")); };
    try { rec.start(); onStart?.(); } catch (e) { reject(e as Error); }
  });
  return { promise, stop: () => { try { rec.stop(); } catch { /* already stopped */ } } };
}

export const canRecord = () => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";
/** Microphone permission as the browser reports it; "unknown" where the Permissions API cannot say. */
export async function micPermission(): Promise<"granted" | "denied" | "prompt" | "unknown"> {
  try { return (await navigator.permissions.query({ name: "microphone" as PermissionName })).state; } catch { return "unknown"; }
}
/** Starts recording the microphone. Rejects with "not-allowed" or "no-mic". stop() resolves with a playable URL. */
export async function startRecording(): Promise<{ stop: () => Promise<string> }> {
  let stream: MediaStream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch (e) { throw new Error((e as DOMException).name === "NotAllowedError" ? "not-allowed" : "no-mic"); }
  const rec = new MediaRecorder(stream); const chunks: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  rec.start();
  return { stop: () => new Promise((resolve) => { rec.onstop = () => { stream.getTracks().forEach((t) => t.stop()); resolve(URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || "audio/webm" }))); }; rec.stop(); }) };
}
