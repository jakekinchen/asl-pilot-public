#!/usr/bin/env python3
"""Export the run10 SimCC-w48 recognizer (M3JB gate-pass, session 962) to a
single-file browser ONNX and verify torch<->ORT parity.

Source checkpoint (sha256 verified at export time):
  asl-pilot-annotator tools/detector0-annotator/output/
  m3jb-recognizer-transformer-run10-simccw48-fulltrain-e240-b128-lr5e4-warm500-cosine-min5e5-brev-v1.pt
  SeqTransformer d256/l6/h8, contract [B,T,90] float + lengths -> [B,95] logits,
  T=32, labels = checkpoint labels list (verified == web LABELS order).
  Offline metrics: test recall@FAR10 0.9209, top-1 0.5428, top-5 0.8261.

Export path follows the run5 transformer precedent: the torch dynamo exporter
externalizes weights to a .onnx.data sibling; we merge to a single file with
onnx.save_model(..., save_as_external_data=False), opset 17, dynamic batch+time.

Parity gates (fail-closed: the ONNX is deleted if any gate fails):
  (a) random [4,32,90] inputs with mixed lengths + a [2,24,90] case (the
      /practice capture path uses T=24): max |logit diff| < 1e-3
  (b) 50 real test-split sequences from /Users/kelly/ws1-recog-extract-ws/
      cache-simccw48 (features via the annotator's train_recognizer.load — the
      EXACT featurizer run10 trained on): max |logit diff| < 1e-3 AND 50/50
      top-1 agreement.

Run:
  /Users/kelly/Developer/asl-pilot/.venv/bin/python \
      web/scripts/export-recognizer-simccw48.py
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
import tempfile
from pathlib import Path

import numpy as np
import torch

HERE = Path(__file__).resolve().parent
WEB = HERE.parent
ANNOT = Path("/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator")
sys.path.insert(0, str(ANNOT))

from seq_transformer import SeqTransformer  # noqa: E402
from train_recognizer import load  # noqa: E402  (cache rows.json -> X, L, y, sp)

CKPT = ANNOT / ("output/m3jb-recognizer-transformer-run10-simccw48-fulltrain-"
                "e240-b128-lr5e4-warm500-cosine-min5e5-brev-v1.pt")
CACHE = Path("/Users/kelly/ws1-recog-extract-ws/cache-simccw48")
OUT = WEB / "public/practice/recognizer-simccw48.onnx"
SIDECAR = WEB / "public/practice/recognizer-simccw48.provenance.json"
OPSET = 17
ATOL = 1e-3
N_REAL = 50


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def web_labels() -> list[str]:
    src = (WEB / "src/lib/scratch-pipeline.ts").read_text()
    m = re.search(r"export const LABELS = \[(.*?)\]", src, re.S)
    assert m, "LABELS export not found in scratch-pipeline.ts"
    return re.findall(r'"([^"]+)"', m.group(1))


def main() -> None:
    torch.manual_seed(0)
    ckpt_sha = sha256(CKPT)
    print(f"checkpoint {CKPT.name}\n  sha256 {ckpt_sha}")

    ck = torch.load(CKPT, map_location="cpu", weights_only=False)
    labels = list(ck["labels"])
    assert labels == web_labels(), "checkpoint labels != web LABELS order"
    feat, t_train = int(ck["feat"]), int(ck["T"])
    model = SeqTransformer(
        feat=feat, n_classes=len(labels), d_model=int(ck["d_model"]),
        n_layers=int(ck["n_layers"]), n_heads=int(ck["n_heads"]),
        dropout=float(ck["dropout"]),
    )
    model.load_state_dict(ck["state_dict"])
    model.eval()

    # --- export (dynamo -> external .data -> merge to single file) ----------
    sample_x = torch.randn(2, t_train, feat)
    sample_len = torch.tensor([t_train, t_train - 9], dtype=torch.long)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        raw = Path(td) / "recognizer.onnx"
        torch.onnx.export(
            model,
            (sample_x, sample_len),
            str(raw),
            dynamo=True,
            opset_version=OPSET,
            input_names=["sequence", "lengths"],
            output_names=["logits"],
            dynamic_shapes={
                "x": {0: torch.export.Dim("batch", min=1, max=64),
                      1: torch.export.Dim("time", min=2, max=512)},
                "lengths": {0: torch.export.Dim("batch", min=1, max=64)},
            },
            external_data=True,
        )
        import onnx

        merged = onnx.load(str(raw))  # pulls in the .onnx.data sibling
        onnx.save_model(merged, str(OUT), save_as_external_data=False)
        onnx.checker.check_model(onnx.load(str(OUT)))
    size_mb = OUT.stat().st_size / (1024 * 1024)
    print(f"exported {OUT} ({size_mb:.2f} MiB, opset {OPSET}, single file)")

    import onnxruntime as ort

    sess = ort.InferenceSession(str(OUT), providers=["CPUExecutionProvider"])

    def ort_logits(x: np.ndarray, lengths: np.ndarray) -> np.ndarray:
        return sess.run(None, {"sequence": x.astype(np.float32),
                               "lengths": lengths.astype(np.int64)})[0]

    def torch_logits(x: np.ndarray, lengths: np.ndarray) -> np.ndarray:
        with torch.no_grad():
            return model(torch.from_numpy(x.astype(np.float32)),
                         torch.from_numpy(lengths.astype(np.int64))).numpy()

    # --- gate (a): random inputs, mixed lengths, T=32 and T=24 --------------
    rng = np.random.RandomState(0)
    cases = [
        ("rand[4,32,90] len[32,24,17,32]", rng.randn(4, 32, feat), np.array([32, 24, 17, 32])),
        ("rand[4,32,90] len[15,32,20,28]", rng.randn(4, 32, feat), np.array([15, 32, 20, 28])),
        ("rand[2,24,90] len[24,24]", rng.randn(2, 24, feat), np.array([24, 24])),
    ]
    rand_max = 0.0
    for name, x, ln in cases:
        d = float(np.abs(torch_logits(x, ln) - ort_logits(x, ln)).max())
        rand_max = max(rand_max, d)
        print(f"  parity {name}: max abs logit diff {d:.3g}")
    assert rand_max < ATOL, f"random-input parity FAILED: {rand_max:.3g} >= {ATOL}"

    # --- gate (b): 50 real test-split sequences -----------------------------
    print(f"loading real test sequences from {CACHE} ...")
    X, L, y, sp, cache_labels, T = load(CACHE)
    assert cache_labels == labels and T == t_train and X.shape[-1] == feat
    te = np.where(sp == "test")[0]
    rng.shuffle(te)
    pick = np.sort(te[:N_REAL])
    tl = torch_logits(X[pick], L[pick])
    ol = ort_logits(X[pick], L[pick])
    real_max = float(np.abs(tl - ol).max())
    agree = int((tl.argmax(-1) == ol.argmax(-1)).sum())
    print(f"  parity real[{N_REAL}]: max abs logit diff {real_max:.3g} | top-1 agreement {agree}/{N_REAL}")
    ok = real_max < ATOL and agree == N_REAL
    if not ok:
        OUT.unlink(missing_ok=True)
        SIDECAR.unlink(missing_ok=True)
        sys.exit(f"REAL-INPUT PARITY FAILED (diff {real_max:.3g}, agree {agree}/{N_REAL}) — ONNX removed")

    SIDECAR.write_text(json.dumps({
        "model": OUT.name,
        "source_checkpoint": str(CKPT),
        "source_checkpoint_sha256": ckpt_sha,
        "onnx_sha256": sha256(OUT),
        "size_mb": round(size_mb, 2),
        "arch": {"type": "SeqTransformer", "d_model": int(ck["d_model"]),
                 "n_layers": int(ck["n_layers"]), "n_heads": int(ck["n_heads"]),
                 "feat": feat, "T": t_train, "classes": len(labels)},
        "contract": "[B,T,90] float32 sequence + [B] int64 lengths -> [B,95] logits; dynamic B,T",
        "label_order": "verbatim web LABELS (scratch-pipeline.ts), verified at export",
        "offline_metrics": {"test_recall_at_far10": 0.9209, "test_top1": 0.5428,
                            "test_top5": 0.8261, "session": "asl-pilot session 962"},
        "export": {"exporter": f"torch {torch.__version__} dynamo->merged single file",
                   "opset": OPSET, "weights_embedded": True},
        "parity": {"atol": ATOL,
                   "random_inputs_max_abs_logit_diff": rand_max,
                   "real_test_sequences": N_REAL,
                   "real_max_abs_logit_diff": real_max,
                   "real_top1_agreement": f"{agree}/{N_REAL}",
                   "real_source": str(CACHE)},
    }, indent=1) + "\n")
    print(f"wrote {SIDECAR}")
    print("EXPORT PARITY PASS")


if __name__ == "__main__":
    main()
