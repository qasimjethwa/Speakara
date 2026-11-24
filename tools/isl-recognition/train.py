"""Trains and honestly evaluates the bounded-vocabulary ISL sign recogniser.

usage: python -I train.py <landmarks.jsonl> <out_model.json> <report.md> [min_clips_per_sign] [unrelated_signs.jsonl]

Model: per-sign templates are not enough for a correct/incorrect decision, so this trains a small softmax-regression
classifier over [position sequence, velocity sequence] features of ALL extracted signs (the non-target signs act as
"something else" evidence). Everything is plain matrices so the browser runs it with a few multiplications.

Evaluation: stratified k-fold cross-validation on clips the model never saw. The report lists, per sign:
  - acceptance rate on real attempts of that sign (recall at the chosen threshold)
  - false acceptance rate: how often OTHER signs are accepted as this sign
Only signs meeting the bar (recall >= 0.8, false acceptance <= 0.03, >= 15 clips) are marked "supported".
"""
import json, sys, os, math, random, re
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from features import sequence, T, D, quality

SRC, OUT, REPORT = sys.argv[1], sys.argv[2], sys.argv[3]
MIN = int(sys.argv[4]) if len(sys.argv) > 4 else 15
TAU = 0.6

def vec(seq):
    a = np.asarray(seq, dtype=np.float32)
    v = np.diff(a, axis=0, prepend=a[:1])
    return np.concatenate([a.ravel(), v.ravel() * 4])

NEG = sys.argv[5] if len(sys.argv) > 5 else None   # unrelated signs: learned as "_other" (never taught, never a target)
rows = [json.loads(l) for l in open(SRC)] + ([dict(json.loads(l), label="_other") for l in open(NEG)] if NEG else [])
HOLDOUT = set(filter(None, os.environ.get("ISL_HOLDOUT", "").split(",")))   # clips kept out entirely (used by the browser test)
X, y, files, dropped = [], [], [], 0
for r in rows:
    if os.path.basename(r["file"]) in HOLDOUT and r["label"] != "_other": continue
    s = sequence(r["frames"])
    if s is None: dropped += 1; continue
    X.append(vec(s)); y.append(re.sub(r"^\d+\.\s*", "", r["label"]).strip()); files.append(r["file"])
X = np.stack(X); y = np.array(y)
labels = sorted(set(y)); counts = {l: int((y == l).sum()) for l in labels}
keep = np.array([counts[l] >= 5 for l in y]); X, y = X[keep], y[keep]; labels = sorted(set(y))
mu, sd = X.mean(0), X.std(0) + 1e-4
Xs = (X - mu) / sd

def fit(Xa, ya):
    m = LogisticRegression(C=0.05, max_iter=3000)
    m.fit(Xa, ya); return m

k = min(5, min(int((y == l).sum()) for l in labels))
skf = StratifiedKFold(n_splits=k, shuffle=True, random_state=0)
P = np.zeros((len(y), len(labels)))
for tr, te in skf.split(Xs, y):
    m = fit(Xs[tr], y[tr]); P[te] = m.predict_proba(Xs[te])[:, [list(m.classes_).index(l) for l in labels]]
top1 = (np.array(labels)[P.argmax(1)] == y).mean()

stats = {}
for j, l in enumerate(labels):
    pos = y == l; neg = ~pos
    rec = float((P[pos, j] >= TAU).mean()); far = float((P[neg, j] >= TAU).mean())
    stats[l] = {"clips": int(pos.sum()), "recall": round(rec, 3), "false_accept": round(far, 4),
                "supported": bool(l != "_other" and pos.sum() >= MIN and rec >= 0.8 and far <= 0.03)}
    if NEG and l != "_other": stats[l]["unrelated_accept"] = round(float((P[y == "_other", j] >= TAU).mean()), 4)

final = fit(Xs, y)
order = [list(final.classes_).index(l) for l in labels]
cent = np.stack([Xs[y == l].mean(0) for l in labels])
# distance limit calibrated on UNSEEN clips (cross-validation), so real attempts by new people are not rejected:
# the largest held-out distance of each sign, with 50% headroom for webcams and lighting unlike the studio videos
cvd = {l: [] for l in labels}
for tr, te in skf.split(Xs, y):
    for l in labels:
        c = Xs[tr][y[tr] == l].mean(0); cvd[l] += list(np.linalg.norm(Xs[te][y[te] == l] - c, axis=1))
rad = [float(max(cvd[l]) * 1.5) for l in labels]
neg_d = [float(np.linalg.norm(Xs[i] - cent[j])) for j, l in enumerate(labels) for i in np.where(y != l)[0]]
print("held-out distance limits:", {l: round(r, 1) for l, r in zip(labels, rad)}, "median distance to other signs' centre:", round(float(np.median(neg_d)), 1))
model = {"version": 1, "source": "INCLUDE (AI4Bharat, CC BY 4.0) — Deaf signers, St. Louis School for the Deaf, Chennai",
         "T": T, "D": D, "tau": TAU, "labels": labels, "mu": mu.round(5).tolist(), "sd": sd.round(5).tolist(),
         "W": final.coef_[order].round(5).tolist(), "b": final.intercept_[order].round(5).tolist(), "centroids": cent.round(4).tolist(), "radius": [round(r, 3) for r in rad], "signs": stats}
json.dump(model, open(OUT, "w"))
with open(REPORT, "w") as f:
    f.write(f"# ISL recogniser evaluation\n\nClips used: {len(y)} (unusable: {dropped}). Signs: {len(labels)}. {k}-fold cross-validation, unseen clips only.\n\n")
    f.write(f"Top-1 accuracy over all signs: {top1:.3f}. Acceptance threshold: p >= {TAU}.\n\n| Sign | Clips | Accepted when signed | Wrongly accepted (other greetings + unrelated signs) | Unrelated signs accepted | Supported |\n|---|---|---|---|---|---|\n")
    for l in labels:
        s = stats[l]; f.write(f"| {l} | {s['clips']} | {s['recall']:.0%} | {s['false_accept']:.1%} | {s.get('unrelated_accept', 0):.1%} | {'yes' if s['supported'] else 'no'} |\n")
print(open(REPORT).read())
