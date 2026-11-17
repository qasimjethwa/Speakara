"use client";
/** Browser speech, recording and synthesised sound effects. No third-party recordings are shipped. */

export const canSpeakAloud = () => typeof window !== "undefined" && "speechSynthesis" in window;
const remoteTts = process.env.NEXT_PUBLIC_TTS_REMOTE === "1";
import { getVoiceState, speakArabic, stopArabic, voiceDownloaded } from "./arabic-voice";
const clips = new Map<string, HTMLAudioElement>();

/** Picks the most natural installed voice for a locale: exact locale first, then enhanced/neural voices. */
/** Primary language subtag, lower-case: "ko-KR" → "ko", "fr_BE" → "fr". */
export const langOf = (tag: string) => tag.replace("_", "-").split("-")[0].toLowerCase();

export function pickVoice(lang: string): SpeechSynthesisVoice | null {
  if (!canSpeakAloud()) return null;
  const voices = window.speechSynthesis.getVoices();
  // Compare the primary language subtag exactly: "ko" must not match Konkani ("kok"), nor "it" a hypothetical "ita".
  const base = langOf(lang);
  const pool = voices.filter((v) => langOf(v.lang) === base);
  const score = (v: SpeechSynthesisVoice) => (v.lang.replace("_", "-").toLowerCase() === lang.toLowerCase() ? 4 : 0) + (/natural|neural|enhanced|premium|google|siri/i.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1);
  return pool.sort((a, b) => score(b) - score(a))[0] ?? null;
}
/** "ok" when a voice for the language exists; "no-voice" when the browser can speak but lacks that language. */
export function ttsStatus(lang: string): "ok" | "no-voice" | "unsupported" {
  if (remoteTts) return "ok";
  if (langOf(lang) === "ar" && voiceDownloaded()) return "ok";
  if (!canSpeakAloud()) return "unsupported";
  return window.speechSynthesis.getVoices().length === 0 || pickVoice(lang) ? "ok" : "no-voice";
}
/** Resolves when voices have loaded (they arrive asynchronously in Chromium). */
export function voicesReady(): Promise<void> {
  if (!canSpeakAloud() || window.speechSynthesis.getVoices().length) return Promise.resolve();
  return new Promise((resolve) => { const done = () => resolve(); window.speechSynthesis.addEventListener("voiceschanged", done, { once: true }); setTimeout(done, 1200); });
}

/** Speaks text. Resolves true when playback finished, false if it could not be played. */
export async function say(text: string, lang: string, rate = 1): Promise<boolean> {
  // Arabic uses the downloaded on-device voice when there is one. If that engine fails, fall back to a system voice.
  if (langOf(lang) === "ar" && voiceDownloaded()) {
    if (canSpeakAloud()) window.speechSynthesis.cancel();
    const ok = await speakArabic(text, rate);
    if (ok || getVoiceState().status !== "error") return ok;
  }
  if (remoteTts) {
    const key = `${lang}|${text}`;
    let clip = clips.get(key);
    if (!clip) { clip = new Audio(`/api/tts?lang=${encodeURIComponent(lang)}&text=${encodeURIComponent(text)}`); clips.set(key, clip); if (clips.size > 80) clips.delete(clips.keys().next().value!); }
    clip.playbackRate = rate; clip.currentTime = 0;
    return clip.play().then(() => true, () => sayLocal(text, lang, rate));
  }
  return sayLocal(text, lang, rate);
}
let speakToken = 0;
async function sayLocal(text: string, lang: string, rate: number): Promise<boolean> {
  if (!canSpeakAloud()) return false;
  await voicesReady();
  const voice = pickVoice(lang);
  // Voices are known and none speaks this language: say nothing rather than read it in an unrelated voice.
  if (!voice && window.speechSynthesis.getVoices().length) { window.dispatchEvent(new CustomEvent("speakara:no-voice", { detail: lang })); return false; }
  const mine = ++speakToken;
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = rate; if (voice) u.voice = voice;
    let settled = false; const done = (ok: boolean) => { if (!settled) { settled = true; clearTimeout(guard); resolve(ok); } };
    // Some browsers never fire onend (Chrome on long text, iOS after backgrounding): never leave the caller waiting.
    const guard = setTimeout(() => done(mine === speakToken), Math.min(20000, 2500 + text.length * 180 / Math.max(0.4, rate)));
    u.onend = () => done(true); u.onerror = () => done(false);
    window.speechSynthesis.cancel(); window.speechSynthesis.resume(); window.speechSynthesis.speak(u);
  });
}
export function stopSpeaking() { stopArabic(); if (canSpeakAloud()) { speakToken++; window.speechSynthesis.cancel(); } }

/** Sound effects: one shared Web Audio context, one effect at a time, consistent loudness. */
let ctx: AudioContext | null = null; let master: GainNode | null = null; let lastAt = 0; let lastName = "";
function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!C) return null;
  try { ctx ??= new C(); } catch { return null; }
  // Safari and mobile browsers start (and re-enter) the context suspended until a user gesture.
  if (ctx.state !== "running") void ctx.resume().catch(() => {});
  return ctx;
}
/** Call from any user gesture so the first effect is not swallowed on iOS/Safari. */
export function unlockAudio() { audioCtx(); }
if (typeof window !== "undefined") {
  const unlock = () => unlockAudio();
  window.addEventListener("pointerdown", unlock, { passive: true }); window.addEventListener("keydown", unlock, { passive: true });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && ctx) void ctx.resume().catch(() => {}); });
}
export const sfxLog: string[] = [];
function play(name: string, freqs: number[], step: number, type: OscillatorType, peak: number) {
  const c = audioCtx(); if (!c) return;
  const now = performance.now();
  if (name === lastName && now - lastAt < 120) return;   // the same effect fired twice by one action
  lastAt = now; lastName = name; sfxLog.push(name); if (sfxLog.length > 50) sfxLog.shift();
  try {
    // Fade out whatever is still ringing so effects never pile up.
    if (master) { const old = master; old.gain.cancelScheduledValues(c.currentTime); old.gain.setTargetAtTime(0.0001, c.currentTime, 0.01); setTimeout(() => old.disconnect(), 150); }
    const bus = (master = c.createGain()); bus.gain.value = 1; bus.connect(c.destination);
    const t0 = c.currentTime + 0.01;
    freqs.forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain(), t = t0 + i * step;
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + step * 1.7);
      o.connect(g).connect(bus); o.start(t); o.stop(t + step * 1.9);
    });
  } catch { /* audio unavailable */ }
}
export const sfx = {
  tap: () => play("tap", [520], 0.045, "sine", 0.07),
  correct: () => play("correct", [587, 880], 0.1, "sine", 0.16),
  wrong: () => play("wrong", [220, 174], 0.13, "triangle", 0.18),
  finish: () => play("finish", [523, 659, 784, 1047], 0.12, "sine", 0.16),
};
if (typeof window !== "undefined") (window as unknown as { __sfx?: string[] }).__sfx = sfxLog;

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
    // Some browsers expose the API but never answer (Chromium builds without a speech service): give up after 12 s.
    const watchdog = setTimeout(() => { if (!got) { try { rec.stop(); } catch { /* ignore */ } reject(new Error("timeout")); } }, 12000);
    rec.onresult = (e) => { got = true; clearTimeout(watchdog); resolve(e.results[0][0].transcript); };
    rec.onerror = (e) => { clearTimeout(watchdog); reject(new Error(e.error)); };
    rec.onend = () => { clearTimeout(watchdog); if (!got) reject(new Error("no-speech")); };
    try { rec.start(); onStart?.(); } catch (e) { clearTimeout(watchdog); reject(e as Error); }
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
