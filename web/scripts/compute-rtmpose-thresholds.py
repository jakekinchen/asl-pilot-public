#!/usr/bin/env python3
"""Compute per-class FAR10/FAR5 accept thresholds for recognizer-rtmpose.onnx.

Scores the signer-disjoint TEST split of the feasibility RTMPose cache with the
trained checkpoint (results/rtmpose.pt — the exact weights exported to
web/public/analyze/recognizer-rtmpose.onnx) and derives, per class, the softmax
threshold at a fixed false-accept rate over NEGATIVE clips (other-class test
clips scored against this class). Semantics replicate
asl-pilot-annotator/tools/detector0-annotator/verification.py
(recall_at_far_details): tau_w = quantile(neg_scores_w, 1 - FAR), so FAR10 picks
the threshold where 10% of negatives score AT OR ABOVE it, FAR5 where 5% do.

Outputs:
  web/public/practice/recognizer-rtmpose-thresholds.json  (sidecar consumed by
      SignPracticeApp.tsx at model-load time)
  /tmp/accept-rule-simulation.json  (old vs new accept rule on the 8 demo words)

Run (CPU, ~1 min):
  /Users/kelly/Developer/asl-pilot/.venv/bin/python \
      web/scripts/compute-rtmpose-thresholds.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import numpy as np
import torch

HERE = Path(__file__).resolve().parent
WEB = HERE.parent
FEAS = Path("/Users/kelly/feasibility-rtmpose-ws")
sys.path.insert(0, str(FEAS / "code"))

from train_recognizer import load  # noqa: E402  (cache rows.json -> X, L, y, sp)
from seq_transformer import SeqTransformer  # noqa: E402

DEMO_WORDS = ["man", "please", "frog", "grandpa", "happy", "hello", "table", "bad"]
ACCEPT_TOPK = 5
OLD_FLOOR = 0.003
GENERATED = "2026-06-09"
# "Wildly off" guard: scoring bugs (label permutation, wrong split, bad softmax)
# crater this toward chance; the prior estimate was ~0.93 and the measured value
# is 0.9635 with test top-1 exactly matching the offline 0.6323 reference.
EXPECTED_MEAN_RECALL_FAR10 = (0.88, 0.99)
REFERENCE_TOP1 = 0.6323


def web_labels() -> list[str]:
    """Parse the LABELS export from scratch-pipeline.ts to confirm label order."""
    src = (WEB / "src/lib/scratch-pipeline.ts").read_text()
    m = re.search(r"export const LABELS = \[(.*?)\]", src, re.S)
    assert m, "LABELS export not found in scratch-pipeline.ts"
    return re.findall(r'"([^"]+)"', m.group(1))


def rank_of_target(probs_row: np.ndarray, target: int) -> int:
    """Number of classes with strictly higher probability (matches the TSX)."""
    return int((probs_row > probs_row[target]).sum())


def simulate(probs: np.ndarray, y: np.ndarray, labels: list[str], far10: dict[str, float]) -> dict:
    """Old vs new accept rule, demo words as prompts, over all test clips."""
    out = {}
    for rule in ("old", "new"):
        true_acc = wrong_acc = true_n = wrong_n = 0
        per_word = {}
        for word in DEMO_WORDS:
            w = labels.index(word)
            thr = max(far10[word], OLD_FLOOR)
            w_true = w_true_n = w_wrong = w_wrong_n = 0
            for i in range(len(y)):
                p = probs[i, w]
                rank = rank_of_target(probs[i], w)
                if rule == "old":
                    accepted = rank < ACCEPT_TOPK and p > OLD_FLOOR
                else:
                    accepted = rank < ACCEPT_TOPK and p >= thr
                if y[i] == w:
                    w_true_n += 1
                    w_true += accepted
                else:
                    w_wrong_n += 1
                    w_wrong += accepted
            per_word[word] = {
                "true_accept": round(w_true / max(w_true_n, 1), 4),
                "wrong_prompt_accept": round(w_wrong / max(w_wrong_n, 1), 4),
                "positives": w_true_n,
            }
            true_acc += w_true; true_n += w_true_n
            wrong_acc += w_wrong; wrong_n += w_wrong_n
        out[rule] = {
            "true_accept_rate": round(true_acc / true_n, 4),
            "wrong_prompt_accept_rate": round(wrong_acc / wrong_n, 4),
            "true_accept_counts": f"{true_acc}/{true_n}",
            "wrong_prompt_accept_counts": f"{wrong_acc}/{wrong_n}",
            "per_word": per_word,
        }
    return out


def main() -> None:
    cfg = json.loads((FEAS / "results/rtmpose.json").read_text())["config"]
    ck = torch.load(FEAS / "results/rtmpose.pt", map_location="cpu", weights_only=False)
    labels = list(ck["labels"])
    assert labels == web_labels(), "checkpoint labels != web LABELS order"

    X, L, y, sp, cache_labels, T = load(FEAS / "cache-rtmpose")
    assert cache_labels == labels and T == ck["T"] and X.shape[-1] == ck["feat"]

    model = SeqTransformer(
        feat=ck["feat"], n_classes=len(labels), d_model=cfg["d_model"],
        n_layers=cfg["n_layers"], n_heads=cfg["n_heads"], dropout=cfg["dropout"],
    )
    model.load_state_dict(ck["state_dict"])
    model.eval()

    te = np.where(sp == "test")[0]
    print(f"test clips {len(te)} | classes {len(labels)} | T {T}")
    probs_rows = []
    with torch.no_grad():
        for k in range(0, len(te), 256):
            bi = te[k:k + 256]
            logits = model(torch.from_numpy(X[bi]), torch.from_numpy(L[bi]))
            probs_rows.append(torch.softmax(logits, dim=-1).numpy())
    probs = np.concatenate(probs_rows).astype(np.float64)
    yt = y[te]

    top1 = float((probs.argmax(-1) == yt).mean())
    print(f"test top-1 {top1:.4f} (offline reference {REFERENCE_TOP1})")
    if abs(top1 - REFERENCE_TOP1) > 0.005:
        sys.exit(f"SANITY FAIL: test top-1 {top1:.4f} != offline reference {REFERENCE_TOP1}")

    # Per-class FAR thresholds + recall, exactly per verification.py.
    far_thresholds = {"far10": {}, "far5": {}}
    recall10, recall5 = {}, {}
    for w, label in enumerate(labels):
        pos = probs[yt == w, w]
        neg = probs[yt != w, w]
        assert pos.size > 0 and neg.size > 0, f"class {label} not evaluable"
        for far, bucket, rec in ((0.10, "far10", recall10), (0.05, "far5", recall5)):
            tau = float(np.quantile(neg, 1.0 - far))
            far_thresholds[bucket][label] = tau
            rec[label] = float((pos >= tau).mean())

    mean10 = float(np.mean(list(recall10.values())))
    mean5 = float(np.mean(list(recall5.values())))
    print(f"mean recall@FAR10 {mean10:.4f} | mean recall@FAR5 {mean5:.4f}")
    lo, hi = EXPECTED_MEAN_RECALL_FAR10
    if not (lo <= mean10 <= hi):
        sys.exit(f"SANITY FAIL: mean recall@FAR10 {mean10:.4f} outside [{lo}, {hi}] — not shipping thresholds")

    sidecar = {
        "model": "recognizer-rtmpose.onnx",
        "source": "feasibility-rtmpose-ws test split",
        "far": {"far10": {k: round(v, 6) for k, v in far_thresholds["far10"].items()},
                "far5": {k: round(v, 6) for k, v in far_thresholds["far5"].items()}},
        "per_class_recall_far10": {k: round(v, 4) for k, v in recall10.items()},
        "mean_recall_far10": round(mean10, 4),
        "mean_recall_far5": round(mean5, 4),
        "test_top1": round(top1, 4),
        "generated": GENERATED,
    }
    out = WEB / "public/practice/recognizer-rtmpose-thresholds.json"
    out.write_text(json.dumps(sidecar, indent=1) + "\n")
    print(f"wrote {out}")

    sim = simulate(probs, yt, labels, far_thresholds["far10"])
    sim_out = Path("/tmp/accept-rule-simulation.json")
    sim_out.write_text(json.dumps({
        "model": "recognizer-rtmpose.onnx",
        "eval": "feasibility-rtmpose-ws test split, 8 demo words as prompts",
        "rules": {
            "old": f"rank<{ACCEPT_TOPK} AND p>{OLD_FLOOR}",
            "new": f"rank<{ACCEPT_TOPK} AND p>=max(far10[label], {OLD_FLOOR})",
        },
        "results": sim,
    }, indent=1) + "\n")
    print(f"wrote {sim_out}")
    for rule in ("old", "new"):
        r = sim[rule]
        print(f"{rule:>3}: true-accept {r['true_accept_rate']:.3f} ({r['true_accept_counts']}) | "
              f"wrong-prompt accept {r['wrong_prompt_accept_rate']:.4f} ({r['wrong_prompt_accept_counts']})")


if __name__ == "__main__":
    main()
