/**
 * Rig and animation format for Speakara's ISL signing teacher.
 *
 * Avatar: Microsoft Rocketbox "Business_Female_01" (MIT licence), converted to /public/isl/teacher.glb with Blender.
 * It has a 3ds Max Biped skeleton (fully articulated fingers, 3 joints each) and 52 ARKit facial blendshapes.
 *
 * A pose is a set of local Euler rotations (radians, applied X then Y then Z) ADDED to each bone's rest rotation,
 * plus facial blendshape weights. A clip is a list of timed keyframes; playback interpolates between them.
 * Axis notes for this rig (measured): upper arm +Y (left) / -Y (right) lowers the arm, -Z swings it forward;
 * forearm -Z bends the elbow; finger +Z curls; head/neck Z nods.
 *
 * IMPORTANT: this file defines the FORMAT only. It contains no ISL signs. Sign clips are authored by ISL educators in
 * the Sign Studio and only shown as validated after review by Deaf ISL signers.
 */

export type Euler3 = [number, number, number];
export interface Pose { bones: Record<string, Euler3>; face?: Record<string, number> }
export interface Keyframe { t: number; pose: Pose; ease?: "linear" | "smooth" }
export interface CaptionCue { start: number; end: number; text: string; meaning?: string; hi?: string }
export type ValidationStatus = "awaiting_validation" | "in_review" | "validated";
export interface SignClip {
  id: string;
  gloss: string;
  duration: number;               // seconds
  keys: Keyframe[];
  captions?: CaptionCue[];
  status: ValidationStatus;
  reviewedBy?: string;            // name/credential of the Deaf ISL reviewer — required for "validated"
  reviewedAt?: string;
  source?: string;                // e.g. "Authored by … with reference to ISLRTC dictionary entry …"
  notTeaching?: boolean;          // true for technical motion tests that are NOT ISL signs
}

const S = (name: string) => `Bip01_${name}`;
/** Bones exposed for authoring, grouped for the studio UI. */
export const BONE_GROUPS: { label: string; bones: { id: string; label: string }[] }[] = [
  { label: "Head and body", bones: [
    { id: S("Spine2"), label: "Upper back" }, { id: S("Neck"), label: "Neck" }, { id: S("Head"), label: "Head" },
  ] },
  ...(["L", "R"] as const).map((s) => ({
    label: s === "R" ? "Right arm (dominant)" : "Left arm",
    bones: [
      { id: S(`${s}_Clavicle`), label: "Shoulder" }, { id: S(`${s}_UpperArm`), label: "Upper arm" },
      { id: S(`${s}_Forearm`), label: "Forearm" }, { id: S(`${s}_Hand`), label: "Wrist" },
    ],
  })),
  ...(["L", "R"] as const).map((s) => ({
    label: s === "R" ? "Right hand fingers" : "Left hand fingers",
    bones: [0, 1, 2, 3, 4].flatMap((f) => ["", "1", "2"].map((j, ji) => ({
      id: S(`${s}_Finger${f}${j}`), label: `${["Thumb", "Index", "Middle", "Ring", "Little"][f]} ${ji + 1}`,
    }))),
  })),
];
export const ALL_BONES = BONE_GROUPS.flatMap((g) => g.bones.map((b) => b.id));

/** ARKit-style facial blendshapes most used for ISL non-manual markers. */
export const FACE_KEYS = [
  "AK_03_BrowInnerUp", "AK_01_BrowDownLeft", "AK_02_BrowDownRight", "AK_04_BrowOuterUpLeft", "AK_05_BrowOuterUpRight",
  "AK_21_EyeWideLeft", "AK_22_EyeWideRight", "AK_19_EyeSquintLeft", "AK_20_EyeSquintRight", "AK_25_JawOpen",
  "AK_38_MouthPucker", "AK_44_MouthSmileLeft", "AK_45_MouthSmileRight", "AK_06_CheekPuff",
];

/** Non-sign resting stances (measured on this rig). */
export const RELAXED: Pose = { bones: {
  [S("L_UpperArm")]: [0.2, 0.85, -0.12], [S("R_UpperArm")]: [-0.2, -0.85, -0.12],
  [S("L_Forearm")]: [0, 0, -0.25], [S("R_Forearm")]: [0, 0, -0.25],
  ...Object.fromEntries((["L", "R"] as const).flatMap((s) => [1, 2, 3, 4].flatMap((f) => [
    [S(`${s}_Finger${f}`), [0, 0, 0.15] as Euler3], [S(`${s}_Finger${f}1`), [0, 0, 0.25] as Euler3],
  ]))),
} };
/** Hands raised into the signing space in front of the chest: the neutral start/end of a signed clip. */
export const READY: Pose = { bones: {
  ...RELAXED.bones,
  [S("L_UpperArm")]: [0.3, 0.95, -0.55], [S("R_UpperArm")]: [-0.3, -0.95, -0.55],
  [S("L_Forearm")]: [0, 0, -1.55], [S("R_Forearm")]: [0, 0, -1.55],
} };

/**
 * A technical motion test for the player (play, pause, slow, loop, captions). It moves between the two resting stances
 * and is NOT an ISL sign; the UI labels it as such.
 */
export const MOTION_TEST: SignClip = {
  id: "_motion_test", gloss: "Player motion test", duration: 3.2, status: "awaiting_validation", notTeaching: true,
  keys: [{ t: 0, pose: RELAXED }, { t: 1.1, pose: READY, ease: "smooth" }, { t: 2.1, pose: READY }, { t: 3.2, pose: RELAXED, ease: "smooth" }],
  captions: [{ start: 0, end: 1.1, text: "Raising hands to the signing space" }, { start: 1.1, end: 2.1, text: "Signing space (no sign shown)" }, { start: 2.1, end: 3.2, text: "Returning to rest" }],
};

const smooth = (x: number) => x * x * (3 - 2 * x);
/** Pose of a clip at time t (seconds), interpolating rotations and blendshapes between keyframes. */
export function poseAt(clip: SignClip, t: number): Pose {
  const k = clip.keys;
  if (!k.length) return RELAXED;
  if (t <= k[0].t) return k[0].pose;
  if (t >= k[k.length - 1].t) return k[k.length - 1].pose;
  let i = 0; while (i < k.length - 1 && k[i + 1].t < t) i++;
  const a = k[i], b = k[i + 1];
  const raw = (t - a.t) / Math.max(1e-6, b.t - a.t);
  const u = b.ease === "linear" ? raw : smooth(raw);
  const bones: Record<string, Euler3> = {};
  for (const id of new Set([...Object.keys(a.pose.bones), ...Object.keys(b.pose.bones)])) {
    const p = a.pose.bones[id] ?? [0, 0, 0], q = b.pose.bones[id] ?? [0, 0, 0];
    bones[id] = [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u, p[2] + (q[2] - p[2]) * u];
  }
  const face: Record<string, number> = {};
  for (const id of new Set([...Object.keys(a.pose.face ?? {}), ...Object.keys(b.pose.face ?? {})])) {
    const p = a.pose.face?.[id] ?? 0, q = b.pose.face?.[id] ?? 0; face[id] = p + (q - p) * u;
  }
  return { bones, face };
}

/** The caption cue active at time t, if any. */
export const cueAt = (clip: SignClip | null, t: number) => clip?.captions?.find((c) => t >= c.start && t < c.end) ?? null;

/** Basic structural validation for clips coming from the database or the studio. */
export function checkClip(c: SignClip): string | null {
  if (!c.id || !c.gloss) return "A sign needs an id and a gloss.";
  if (!(c.duration > 0 && c.duration <= 30)) return "Duration must be between 0 and 30 seconds.";
  if (c.keys.some((k, i) => i > 0 && k.t < c.keys[i - 1].t)) return "Keyframes must be in time order.";
  if (c.status === "validated" && !c.reviewedBy?.trim()) return "A validated sign must name its Deaf ISL reviewer.";
  return null;
}
