/**
 * Body-normalised sign features. MUST match tools/isl-recognition/features.py exactly
 * (the recogniser was trained on features computed by that file). features.test.ts checks both agree.
 */
export interface RawHand { side: string; score: number; pts: [number, number, number][] }
export interface RawFrame { pose: [number, number, number][] | null; hands: RawHand[] }

export const T = 24;
const RAISED = 2.0, PAD = 2;
export const D = 2 * (1 + 2 + 40) + 8;
const L_SH = 11, R_SH = 12, L_EL = 13, R_EL = 14, L_WR = 15, R_WR = 16;

export function frameFeatures(fr: RawFrame): number[] | null {
  const pose = fr.pose; if (!pose) return null;
  const ls = pose[L_SH], rs = pose[R_SH];
  const cx = (ls[0] + rs[0]) / 2, cy = (ls[1] + rs[1]) / 2;
  const sw = Math.hypot(ls[0] - rs[0], ls[1] - rs[1]) || 1e-3;
  const nx = (x: number) => (x - cx) / sw, ny = (y: number) => (y - cy) / sw;
  const wr = { R: [nx(pose[R_WR][0]), ny(pose[R_WR][1])], L: [nx(pose[L_WR][0]), ny(pose[L_WR][1])] } as const;
  const slots: Record<"R" | "L", RawHand | null> = { R: null, L: null };
  for (const h of fr.hands) {
    const p = [nx(h.pts[0][0]), ny(h.pts[0][1])];
    const dR = Math.hypot(p[0] - wr.R[0], p[1] - wr.R[1]), dL = Math.hypot(p[0] - wr.L[0], p[1] - wr.L[1]);
    const side = dR <= dL ? "R" : "L";   // python: min(("R","L")) keeps R on ties
    if (!slots[side] || h.score > slots[side]!.score) slots[side] = h;
  }
  const out: number[] = [];
  for (const side of ["R", "L"] as const) {
    const h = slots[side];
    if (!h) { for (let i = 0; i < 43; i++) out.push(0); continue; }
    const pts = h.pts.map(([x, y]) => [nx(x), ny(y)]);
    const [wx, wy] = pts[0]; const size = Math.hypot(pts[9][0] - wx, pts[9][1] - wy) || 1e-3;
    out.push(1, wx, wy);
    for (let i = 1; i < 21; i++) out.push((pts[i][0] - wx) / size, (pts[i][1] - wy) / size);
  }
  for (const i of [R_EL, L_EL, R_WR, L_WR]) out.push(nx(pose[i][0]), ny(pose[i][1]));
  return out;
}

/** Longest run of hand-visible frames, bridging gaps of up to `gap` frames (one sign = one continuous run). */
export function activeSpan(vis: boolean[], gap = 3): [number, number] {
  let best: [number, number] = [0, -1]; let start: number | null = null, last = -1;
  vis.forEach((v, i) => {
    if (!v) return;
    if (start === null || i - last > gap + 1) start = i;
    last = i;
    if (i - start > best[1] - best[0]) best = [start, i];
  });
  return best;
}

/** T x D sequence over the active (hands-raised) part of the attempt; null when there is too little to judge. */
export function sequence(frames: RawFrame[]): number[][] | null {
  const fs = frames.map(frameFeatures).filter((f): f is number[] => !!f);
  // the sign = hands raised above resting height (wrists at rest sit ~2.8 shoulder-widths below the shoulders)
  const [a0, b0] = activeSpan(fs.map((f) => Math.min(f[D - 3], f[D - 1]) < RAISED));
  if (b0 - a0 + 1 < 4) return null;
  const s = fs.slice(Math.max(0, a0 - PAD), b0 + 1 + PAD); const n = s.length; const seq: number[][] = [];
  for (let k = 0; k < T; k++) {
    const t = (k * (n - 1)) / (T - 1), a = Math.floor(t), b = Math.min(n - 1, a + 1), u = t - a;
    const row: number[] = new Array(D); for (let j = 0; j < D; j++) row[j] = s[a][j] * (1 - u) + s[b][j] * u; seq.push(row);
  }
  return seq;
}

/** Share of frames where the body and at least one hand were visible. */
export const quality = (frames: RawFrame[]) => frames.length ? frames.filter((f) => f.pose && f.hands.length).length / frames.length : 0;

/** Same vector the trainer builds: positions, then 4x velocities. */
export function vectorise(seq: number[][]): Float32Array {
  const out = new Float32Array(T * D * 2);
  for (let k = 0; k < T; k++) for (let j = 0; j < D; j++) {
    out[k * D + j] = seq[k][j];
    out[T * D + k * D + j] = (seq[k][j] - seq[Math.max(0, k - 1)][j]) * 4;
  }
  return out;
}
