#!/usr/bin/env python3
"""Honest runtime cross-eval: load a recognizer checkpoint and evaluate it on a
DIFFERENT dataset's test split. Used to measure how the clean-label-trained v1
recognizer performs on our-model (noisy) runtime landmark sequences."""
from __future__ import annotations
import argparse
from pathlib import Path
import numpy as np, torch
import train_recognizer as T

HERE = Path(__file__).resolve().parent

ap = argparse.ArgumentParser()
ap.add_argument("--ckpt", type=Path, default=HERE / "output/recognizer-v1.pt")
ap.add_argument("--data", type=Path, default=HERE / ".cache/recog-seq")
ap.add_argument("--velocity", action="store_true")
ap.add_argument("--device", default="mps")
args = ap.parse_args()
dev = torch.device("mps") if (args.device == "mps" and torch.backends.mps.is_available()) else torch.device("cpu")

ck = torch.load(args.ckpt, map_location="cpu", weights_only=False)
X, L, y, sp, labels, Tlen = T.load(args.data, velocity=args.velocity)
assert labels == ck["labels"], "label set mismatch between checkpoint and data"

model = T.Recognizer(feat=X.shape[-1], n_classes=len(labels)).to(dev)
model.load_state_dict(ck["state_dict"]); model.eval()
te = np.where(sp == "test")[0]
Xt = torch.from_numpy(X[te]).to(dev); Lt = torch.from_numpy(L[te]).to(dev); yt = torch.from_numpy(y[te]).to(dev)
with torch.no_grad():
    logits = model(Xt, Lt)
    top1 = (logits.argmax(-1) == yt).float().mean().item()
    top5 = (logits.topk(5, -1).indices == yt[:, None]).any(-1).float().mean().item()
print(f"CROSS-EVAL {args.ckpt.name} on {args.data.name} test ({len(te)} clips): top1 {top1:.3f}  top5 {top5:.3f}")
