/**
 * Emotional expression layer for the ISL teacher (non-linguistic).
 *
 * In ISL the face carries grammar (non-manual markers: raised brows for yes/no questions, furrowed brows for
 * wh-questions, mouth patterns, head shakes for negation). Those markers belong ONLY to reviewed sign clips.
 * This layer adds teacher affect — welcoming, listening, thinking, praise, gentle correction — and is designed so it
 * can never change the meaning of a sign:
 *  - while a sign clip is playing, the affect fades to neutral (weight 0) and the clip's own face keys drive the face;
 *  - affect never uses the mouth for speech-like movement (mouthing could be read as words);
 *  - head motion here is small and slow, and is also suppressed during signing.
 */

export type Mood = "neutral" | "welcoming" | "listening" | "thinking" | "encouraging" | "celebrating" | "correcting" | "explaining";
export const MOODS: Mood[] = ["neutral", "welcoming", "listening", "thinking", "encouraging", "celebrating", "correcting", "explaining"];

export interface Expression {
  face: Record<string, number>;
  /** Head offset in radians: nod (down +), turn, tilt. */
  head: [number, number, number];
  /** Nodding amplitude (radians) and rate (Hz); 0 = none. */
  nod: [number, number];
  /** Gaze offset: positive x looks to the teacher's side, positive y looks up. 0 = eye contact. */
  gaze: [number, number];
}

const smile = (w: number, cheek = w * 0.6) => ({ AK_44_MouthSmileLeft: w, AK_45_MouthSmileRight: w, AK_07_CheekSquintLeft: cheek, AK_08_CheekSquintRight: cheek });

/** Restrained presets: real-educator intensity, not cartoon. Values are blendshape weights 0..1. */
export const EXPRESSIONS: Record<Mood, Expression> = {
  neutral: { face: { ...smile(0.08, 0) }, head: [0, 0, 0], nod: [0, 0], gaze: [0, 0] },
  welcoming: { face: { ...smile(0.75), AK_04_BrowOuterUpLeft: 0.25, AK_05_BrowOuterUpRight: 0.25, AK_19_EyeSquintLeft: 0.15, AK_20_EyeSquintRight: 0.15 }, head: [-0.02, 0, 0.05], nod: [0.03, 0.9], gaze: [0, 0] },
  listening: { face: { ...smile(0.28, 0.08), AK_03_BrowInnerUp: 0.12 }, head: [0.03, 0, 0.09], nod: [0, 0], gaze: [0, 0] },
  thinking: { face: { AK_01_BrowDownLeft: 0.18, AK_04_BrowOuterUpLeft: 0, AK_05_BrowOuterUpRight: 0.28, AK_36_MouthPressLeft: 0.2, AK_37_MouthPressRight: 0.2, AK_19_EyeSquintLeft: 0.12, AK_20_EyeSquintRight: 0.12 }, head: [-0.03, 0.07, -0.05], nod: [0, 0], gaze: [0.35, 0.3] },
  encouraging: { face: { ...smile(0.6), AK_03_BrowInnerUp: 0.3, AK_04_BrowOuterUpLeft: 0.12, AK_05_BrowOuterUpRight: 0.12 }, head: [0.02, 0, 0.06], nod: [0.05, 1.1], gaze: [0, 0] },
  celebrating: { face: { ...smile(1, 0.6), AK_04_BrowOuterUpLeft: 0.4, AK_05_BrowOuterUpRight: 0.4, AK_21_EyeWideLeft: 0.12, AK_22_EyeWideRight: 0.12, AK_25_JawOpen: 0.08 }, head: [-0.05, 0, 0.03], nod: [0.06, 1.6], gaze: [0, 0] },
  correcting: { face: { ...smile(0.2, 0.08), AK_03_BrowInnerUp: 0.38, AK_36_MouthPressLeft: 0.1, AK_37_MouthPressRight: 0.1 }, head: [0.03, 0, 0.1], nod: [0, 0], gaze: [0, 0] },
  explaining: { face: { ...smile(0.32, 0.12), AK_04_BrowOuterUpLeft: 0.18, AK_05_BrowOuterUpRight: 0.18 }, head: [0, 0, 0.02], nod: [0.015, 0.5], gaze: [0, 0] },
};

/** Live state that eases toward a target mood. */
export interface ExpressionState { face: Record<string, number>; head: [number, number, number]; gaze: [number, number]; nod: [number, number]; weight: number }
export const initialExpression = (): ExpressionState => ({ face: {}, head: [0, 0, 0], gaze: [0, 0], nod: [0, 0], weight: 1 });

/**
 * Moves `s` toward `mood` with critically-damped-style exponential easing (about 0.35 s to settle 90%), so moods blend
 * instead of switching. `signing` drives the overall weight to 0 so a sign's own non-manual markers are untouched.
 */
export function stepExpression(s: ExpressionState, mood: Mood, signing: boolean, dt: number): ExpressionState {
  const k = 1 - Math.exp(-Math.min(dt, 0.25) * 6.5);
  const target = EXPRESSIONS[mood];
  const face: Record<string, number> = {};
  for (const key of new Set([...Object.keys(s.face), ...Object.keys(target.face)])) {
    const v = (s.face[key] ?? 0) + ((target.face[key] ?? 0) - (s.face[key] ?? 0)) * k;
    if (Math.abs(v) > 1e-3) face[key] = v;
  }
  const lerp3 = (a: number[], b: number[]) => a.map((x, i) => x + (b[i] - x) * k);
  return {
    face,
    head: lerp3(s.head, target.head) as [number, number, number],
    gaze: lerp3(s.gaze, target.gaze) as [number, number],
    nod: lerp3(s.nod, target.nod) as [number, number],
    weight: s.weight + ((signing ? 0 : 1) - s.weight) * (1 - Math.exp(-Math.min(dt, 0.25) * 9)),
  };
}

/** Eye-look blendshapes for a gaze offset (both eyes move together). */
export function gazeShapes([x, y]: [number, number]): Record<string, number> {
  const out: Record<string, number> = {};
  if (x > 0) { out.AK_15_EyeLookOutLeft = x; out.AK_14_EyeLookInRight = x; } else if (x < 0) { out.AK_13_EyeLookInLeft = -x; out.AK_16_EyeLookOutRight = -x; }
  if (y > 0) { out.AK_17_EyeLookUpLeft = y; out.AK_18_EyeLookUpRight = y; } else if (y < 0) { out.AK_11_EyeLookDownLeft = -y; out.AK_12_EyeLookDownRight = -y; }
  return out;
}
