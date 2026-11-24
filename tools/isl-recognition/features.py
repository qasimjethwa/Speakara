"""Turns raw landmark frames into a fixed-length, body-normalised feature sequence.

MUST stay identical to src/features/isl-classroom/recognition/features.ts (the browser computes the same features
from the learner's webcam). Tests compare both on the same input.

Per frame (D = 2*(1 + 2 + 40) + 8 = 94):
  for the dominant (signer's right) and non-dominant hand:
    present flag, wrist x,y relative to the shoulder midpoint / shoulder width,
    21 points minus wrist, scaled by hand size (wrist→middle-finger base), x,y only (z is too noisy)
  elbows and wrists from the pose model (x,y), same normalisation
Hands are assigned to the signer's left/right by which pose wrist they are nearest, not by MediaPipe's handedness
label (that label flips with mirrored video).
"""
import math

T = 24
POSE_L_SH, POSE_R_SH, POSE_L_EL, POSE_R_EL, POSE_L_WR, POSE_R_WR = 11, 12, 13, 14, 15, 16
D = 2 * (1 + 2 + 40) + 8

def frame_features(fr, mirror=False):
    pose = fr.get("pose")
    if not pose:
        return None
    fx = (lambda x: 1 - x) if mirror else (lambda x: x)
    ls, rs = pose[POSE_L_SH], pose[POSE_R_SH]
    cx, cy = (fx(ls[0]) + fx(rs[0])) / 2, (ls[1] + rs[1]) / 2
    sw = math.hypot(fx(ls[0]) - fx(rs[0]), ls[1] - rs[1]) or 1e-3
    nx = lambda x: (fx(x) - cx) / sw
    ny = lambda y: (y - cy) / sw
    # signer's right wrist (pose index 16) is the dominant hand
    wr = {"R": (nx(pose[POSE_R_WR][0]), ny(pose[POSE_R_WR][1])), "L": (nx(pose[POSE_L_WR][0]), ny(pose[POSE_L_WR][1]))}
    slots = {"R": None, "L": None}
    for h in fr.get("hands", []):
        w = h["pts"][0]; p = (nx(w[0]), ny(w[1]))
        side = min(("R", "L"), key=lambda s: math.hypot(p[0] - wr[s][0], p[1] - wr[s][1]))
        if slots[side] is None or h["score"] > slots[side]["score"]:
            slots[side] = h
    out = []
    for side in ("R", "L"):
        h = slots[side]
        if h is None:
            out += [0.0] * 43; continue
        pts = [(nx(x), ny(y)) for x, y, _ in h["pts"]]
        wx, wy = pts[0]; size = math.hypot(pts[9][0] - wx, pts[9][1] - wy) or 1e-3
        out += [1.0, wx, wy]
        for x, y in pts[1:]:
            out += [(x - wx) / size, (y - wy) / size]
    for i in (POSE_R_EL, POSE_L_EL, POSE_R_WR, POSE_L_WR):
        out += [nx(pose[i][0]), ny(pose[i][1])]
    return out

def sequence(frames, mirror=False):
    """Fixed-length sequence (T x D) by linear resampling over the frames that have a body; None if unusable."""
    fs = [f for f in (frame_features(x, mirror) for x in frames) if f is not None]
    # keep only the active part: frames where at least one hand is visible (trim idle start/end)
    act = [i for i, f in enumerate(fs) if f[0] or f[43]]
    if len(act) < 4:
        return None
    fs = fs[act[0]:act[-1] + 1]
    n = len(fs); seq = []
    for k in range(T):
        t = k * (n - 1) / (T - 1); a = int(t); b = min(n - 1, a + 1); u = t - a
        seq.append([fs[a][j] * (1 - u) + fs[b][j] * u for j in range(D)])
    return seq

def quality(frames):
    """Share of sampled frames with a visible body and at least one hand (used for the 'poor capture' outcome)."""
    if not frames: return 0.0
    ok = sum(1 for f in frames if f.get("pose") and f.get("hands"))
    return ok / len(frames)
