/**
 * Bounded-vocabulary sign recogniser (trained offline by tools/isl-recognition/train.py on INCLUDE, CC BY 4.0).
 * It only judges signs the evaluation marked "supported". Four honest outcomes:
 *   correct      – the attempt is confidently the target sign
 *   incorrect    – the attempt is confidently a DIFFERENT known sign (never claimed otherwise)
 *   uncertain    – anything in between; the teacher asks for another try, never marks it wrong
 *   poor_capture – body or hands were not visible enough to judge
 */
import { quality, sequence, vectorise, type RawFrame } from "./features";

export interface SignModel {
  version: number; T: number; D: number; tau: number; labels: string[];
  mu: number[]; sd: number[]; W: number[][]; b: number[];
  centroids?: number[][]; radius?: number[];            // per-sign typical distance, to spot movements unlike anything trained
  signs: Record<string, { clips: number; recall: number; false_accept: number; supported: boolean }>;
}
export type Outcome = "correct" | "incorrect" | "uncertain" | "poor_capture";
export interface Verdict { outcome: Outcome; target: string; confidence: number; lookedLike?: string; quality: number; distance?: number }

export const MIN_QUALITY = 0.5, MIN_FRAMES = 12, WRONG_MAX = 0.15, OTHER_MIN = 0.6;

export function classify(model: SignModel, frames: RawFrame[], target: string): Verdict {
  const q = quality(frames);
  const seq = sequence(frames);
  // too few frames (very slow device or a dropped camera) cannot show a movement reliably
  if (q < MIN_QUALITY || !seq || frames.length < MIN_FRAMES) return { outcome: "poor_capture", target, confidence: 0, quality: q };
  const x = vectorise(seq);
  for (let i = 0; i < x.length; i++) x[i] = (x[i] - model.mu[i]) / model.sd[i];
  const z = model.W.map((w, c) => { let s = model.b[c]; for (let i = 0; i < x.length; i++) s += w[i] * x[i]; return s; });
  const m = Math.max(...z); const e = z.map((v) => Math.exp(v - m)); const sum = e.reduce((a, v) => a + v, 0); const p = e.map((v) => v / sum);
  const ti = model.labels.indexOf(target); const top = p.indexOf(Math.max(...p));
  const pt = ti >= 0 ? p[ti] : 0;
  // far from every trained example of the predicted sign → not something the model can judge
  if (model.centroids && model.radius) {
    const c = model.centroids[ti >= 0 && pt >= model.tau ? ti : top]; let d = 0; for (let i = 0; i < x.length; i++) d += (x[i] - c[i]) ** 2;
    if (Math.sqrt(d) > model.radius[ti >= 0 && pt >= model.tau ? ti : top]) return { outcome: "uncertain", target, confidence: pt, quality: q, distance: Math.sqrt(d) };
  }
  if (pt >= model.tau) return { outcome: "correct", target, confidence: pt, quality: q };
  if (pt <= WRONG_MAX && top !== ti && p[top] >= OTHER_MIN) return { outcome: "incorrect", target, confidence: pt, lookedLike: model.labels[top], quality: q };
  return { outcome: "uncertain", target, confidence: pt, quality: q };
}

let cached: Promise<SignModel | null> | null = null;
export const loadModel = () => (cached ??= fetch("/isl-classroom/model.json").then((r) => (r.ok ? (r.json() as Promise<SignModel>) : null)).catch(() => null));
