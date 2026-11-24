"""Extract body + hand landmark sequences from ISL sign videos (INCLUDE dataset, CC BY 4.0).

Uses the same MediaPipe Hand and Pose Landmarker models the browser uses, so features computed
here match what the classroom computes from the learner's webcam.

usage: python -I extract.py <videos_dir> <out.jsonl> <models_dir>
Writes one JSON line per video: {"label", "file", "frames": [[feature...], ...]}
"""
import json, os, sys
import cv2
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import HandLandmarker, HandLandmarkerOptions, PoseLandmarker, PoseLandmarkerOptions, RunningMode

SRC, OUT, MODELS = sys.argv[1], sys.argv[2], sys.argv[3]
FPS = 15

def make():
    h = HandLandmarker.create_from_options(HandLandmarkerOptions(base_options=BaseOptions(model_asset_path=os.path.join(MODELS, "hand_landmarker.task")), running_mode=RunningMode.VIDEO, num_hands=2, min_hand_detection_confidence=0.4))
    p = PoseLandmarker.create_from_options(PoseLandmarkerOptions(base_options=BaseOptions(model_asset_path=os.path.join(MODELS, "pose_landmarker_lite.task")), running_mode=RunningMode.VIDEO))
    return h, p

def frame_record(hr, pr):
    """Raw per-frame landmarks (image-normalised x,y); normalisation happens in features.py so it can change without re-extracting."""
    pose = pr.pose_landmarks[0] if pr.pose_landmarks else None
    rec = {"pose": [[round(l.x, 4), round(l.y, 4), round(l.visibility or 0, 2)] for l in pose[:25]] if pose else None, "hands": []}
    for lms, hd in zip(hr.hand_landmarks, hr.handedness):
        rec["hands"].append({"side": hd[0].category_name, "score": round(hd[0].score, 2), "pts": [[round(l.x, 4), round(l.y, 4), round(l.z, 4)] for l in lms]})
    return rec

def videos(root):
    for d, _, fs in os.walk(root):
        for f in sorted(fs):
            if f.lower().endswith((".mov", ".mp4", ".avi")):
                yield os.path.join(d, f)

done = set()
if os.path.exists(OUT):
    with open(OUT) as fh:
        done = {json.loads(l)["file"] for l in fh}
with open(OUT, "a") as out:
    for path in videos(SRC):
        rel = os.path.relpath(path, SRC)
        if rel in done: continue
        label = os.path.basename(os.path.dirname(path))   # INCLUDE layout: <Category>/<n. Word>/<clip>
        cap = cv2.VideoCapture(path); fps = cap.get(cv2.CAP_PROP_FPS) or 25
        step = max(1, round(fps / FPS)); i = 0; frames = []
        h, p = make()
        while True:
            ok, img = cap.read()
            if not ok: break
            if i % step == 0:
                small = cv2.resize(img, (640, int(img.shape[0] * 640 / img.shape[1])))
                im = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(small, cv2.COLOR_BGR2RGB))
                ts = int(i * 1000 / fps)
                frames.append(frame_record(h.detect_for_video(im, ts), p.detect_for_video(im, ts)))
            i += 1
        cap.release(); h.close(); p.close()
        out.write(json.dumps({"label": label, "file": rel, "fps": FPS, "frames": frames}) + "\n"); out.flush()
        print(rel, len(frames), flush=True)
