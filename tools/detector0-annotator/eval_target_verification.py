#!/usr/bin/env python3
"""Evaluate guided target-verification for the isolated-sign recognizer.

The pilot UX is "practice THIS word -> did you get it?", so the relevant
decision is binary for a known prompt word. For each test clip with true label t,
accept t when softmax(t) >= tau. False accepts are measured over wrong prompt
attempts: every non-target word w for the same clip is one negative attempt.

  PYTHONDONTWRITEBYTECODE=1 /Users/kelly/Developer/asl-pilot/.venv/bin/python \
      eval_target_verification.py --device cpu
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import torch

from train_recognizer import Recognizer, hand_feat, load

HERE = Path(__file__).resolve().parent


def infer_arch(state):
    feat = int(state["gru.weight_ih_l0"].shape[1])
    hidden = int(state["gru.weight_hh_l0"].shape[1])
    return feat, hidden


def predict(model, X, L, idx, dev, batch):
    model.eval()
    probs = []
    with torch.inference_mode():
        for k in range(0, len(idx), batch):
            ii = idx[k:k + batch]
            xb = torch.from_numpy(X[ii]).to(dev)
            lb = torch.from_numpy(L[ii]).to(dev)
            logits = model(xb, lb)
            probs.append(torch.softmax(logits, dim=-1).cpu().numpy())
    return np.concatenate(probs, axis=0)


def tau_for_far(wrong_probs, far_limit):
    """Return the lowest tau whose wrong-prompt accept rate is <= far_limit."""
    m = int(wrong_probs.size)
    allowed = int(np.floor(far_limit * m + 1e-12))
    if allowed >= m:
        return 0.0
    desc = np.sort(wrong_probs)[::-1]
    # Accept uses >= tau, so step just above the first disallowed wrong score.
    return float(np.nextafter(float(desc[allowed]), float("inf")))


def metrics_at_tau(true_probs, wrong_probs, tau):
    recall = float((true_probs >= tau).mean())
    far = float((wrong_probs >= tau).mean())
    return recall, far


def format_pct(x):
    return f"{100.0 * x:.1f}%"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ckpt", type=Path, default=HERE / "output/recognizer-v4-w64.pt")
    ap.add_argument("--data", type=Path, default=HERE / ".cache/recog-seq-w64-merged")
    ap.add_argument("--device", default="cpu")
    ap.add_argument("--batch", type=int, default=256)
    ap.add_argument("--velocity", action="store_true",
                    help="append frame-to-frame motion before eval; must match the checkpoint")
    args = ap.parse_args()

    dev = torch.device(args.device if (args.device != "mps" or torch.backends.mps.is_available()) else "cpu")
    ck = torch.load(args.ckpt, map_location="cpu", weights_only=False)
    labels = list(ck["labels"])
    state = ck["state_dict"]
    feat, hidden = infer_arch(state)

    # Keep the imported feature helper explicit: train_recognizer.load() builds
    # every frame through frame_feat(), which calls this hand_feat() definition.
    assert callable(hand_feat)
    X, L, y_data, sp, data_labels, T = load(args.data, velocity=args.velocity)
    if X.shape[-1] != feat:
        raise SystemExit(f"feature mismatch: data feat {X.shape[-1]} vs checkpoint feat {feat}")
    if set(data_labels) != set(labels):
        missing = sorted(set(labels) ^ set(data_labels))
        raise SystemExit(f"label mismatch between data and checkpoint: {missing[:10]}")
    data_to_model = {lab: i for i, lab in enumerate(labels)}
    y = np.array([data_to_model[data_labels[i]] for i in y_data], dtype=np.int64)
    te = np.where(sp == "test")[0]
    if len(te) == 0:
        raise SystemExit("no test split clips found")

    model = Recognizer(feat=feat, hidden=hidden, n_classes=len(labels)).to(dev)
    model.load_state_dict(state)
    probs = predict(model, X, L, te, dev, args.batch)
    yt = y[te]

    top = np.argsort(-probs, axis=1)[:, :5]
    top1 = float((top[:, 0] == yt).mean())
    top5 = float((top == yt[:, None]).any(axis=1).mean())

    rows = np.arange(len(yt))
    true_probs = probs[rows, yt]
    wrong_mask = np.ones(probs.shape, dtype=bool)
    wrong_mask[rows, yt] = False
    wrong_probs = probs[wrong_mask]

    far10_tau = tau_for_far(wrong_probs, 0.10)
    far05_tau = tau_for_far(wrong_probs, 0.05)
    recall10, actual_far10 = metrics_at_tau(true_probs, wrong_probs, far10_tau)
    recall05, actual_far05 = metrics_at_tau(true_probs, wrong_probs, far05_tau)

    print("# Target-Verification Evaluation")
    print()
    print(f"checkpoint: `{args.ckpt}`")
    print(f"data: `{args.data}`")
    print(f"device: `{dev}`")
    print(f"test clips: {len(te)} | classes: {len(labels)} | T: {T} | feat: {X.shape[-1]}")
    print()
    print("## Headline")
    print()
    print("| metric | tau | recall / top-k | actual FAR |")
    print("|---|---:|---:|---:|")
    print(f"| target verification @ FAR<=10% | {far10_tau:.8f} | {recall10:.4f} | {actual_far10:.4f} |")
    print(f"| target verification @ FAR<=5% | {far05_tau:.8f} | {recall05:.4f} | {actual_far05:.4f} |")
    print(f"| top-1 reference | n/a | {top1:.4f} | n/a |")
    print(f"| top-5 reference | n/a | {top5:.4f} | n/a |")
    print()
    print("## Per-Word Recall At FAR10")
    print()
    print(f"Global tau: `{far10_tau:.8f}`. FAR is global over wrong prompt attempts;")
    print("per-word recall is the fraction of true clips for that word accepted at this tau.")
    print()
    print("| word | test clips | recall@FAR10 | mean p(target) | median p(target) |")
    print("|---|---:|---:|---:|---:|")
    word_rows = []
    for li, word in enumerate(labels):
        m = yt == li
        if not np.any(m):
            continue
        p = true_probs[m]
        rec = float((p >= far10_tau).mean())
        word_rows.append((rec, int(m.sum()), word, float(p.mean()), float(np.median(p))))
    word_rows.sort(key=lambda r: (-r[0], -r[1], r[2]))
    for rec, n, word, mean_p, med_p in word_rows:
        print(f"| {word} | {n} | {rec:.4f} | {mean_p:.4f} | {med_p:.4f} |")
    print()
    print("## Notes")
    print()
    print(f"- FAR10 means {format_pct(actual_far10)} of wrong prompted words would be accepted.")
    print(f"- FAR5 means {format_pct(actual_far05)} of wrong prompted words would be accepted.")
    print("- Top-k is reported only as a reference classification metric, not as the pilot gate.")


if __name__ == "__main__":
    main()
