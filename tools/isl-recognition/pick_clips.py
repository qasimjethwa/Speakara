"""Picks one clear demonstration video per sign and encodes it for the classroom teacher panel.

usage: python -I pick_clips.py <landmarks.jsonl> <videos_root> <out_dir>
Choice: the clip where body and hands are visible in the most frames (ties: the shorter clip).
Output: <id>.mp4 (H.264, 4:3 crop around the signer, no audio) and <id>.jpg poster. Sign ids follow content.ts.
"""
import json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from features import quality

SRC, ROOT, OUT = sys.argv[1:4]
os.makedirs(OUT, exist_ok=True)
best = {}
for line in open(SRC):
    r = json.loads(line); label = re.sub(r"^\d+\.\s*", "", r["label"]).strip()
    score = (round(quality(r["frames"]), 2), -len(r["frames"]))
    if label not in best or score > best[label][0]:
        best[label] = (score, r)
for label, (_, r) in sorted(best.items()):
    sid = re.sub(r"[^a-z]", "", label.lower())
    path = next((os.path.join(d, f) for d, _, fs in os.walk(ROOT) for f in fs if os.path.basename(d) == r["label"] and f == os.path.basename(r["file"])), None)
    if not path: print("missing", label); continue
    # centre on the signer: horizontal centre of the shoulders across the clip
    xs = [(f["pose"][11][0] + f["pose"][12][0]) / 2 for f in r["frames"] if f.get("pose")]
    cx = sorted(xs)[len(xs) // 2] if xs else 0.5
    # waist-up 4:3 window: 72% of the frame height from just above the head, centred on the signer
    vf = f"crop=ih*0.72*4/3:ih*0.72:max(0\\,min(iw-ih*0.96\\,{cx:.3f}*iw-ih*0.48)):ih*0.04,scale=720:540"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-an", "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart", os.path.join(OUT, f"{sid}.mp4")], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "0.2", "-i", os.path.join(OUT, f"{sid}.mp4"), "-frames:v", "1", "-q:v", "4", os.path.join(OUT, f"{sid}.jpg")], check=True)
    print(sid, r["file"], f"q={_[0]}")
