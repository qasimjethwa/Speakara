"use client";
/** Browser speech + synthesised sound effects. No recorded third-party audio is shipped. */
export const canSpeakAloud = () => typeof window !== "undefined" && "speechSynthesis" in window;
export function say(text: string, lang: string, rate = 1): boolean {
  if (!canSpeakAloud()) return false;
  const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = rate;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang === lang) ?? window.speechSynthesis.getVoices().find((v) => v.lang.startsWith(lang.slice(0, 2)));
  if (voice) u.voice = voice;
  window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
  return true;
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
/** Resolves with the transcript, or rejects with a reason the UI can show. */
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
