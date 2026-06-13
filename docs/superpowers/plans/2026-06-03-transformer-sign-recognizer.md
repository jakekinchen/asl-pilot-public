# Transformer Sign Recognizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Train a from-scratch Transformer-encoder sign recognizer (landmark-sequence student, distilled from the existing teacher) that beats the current CNN+BiGRU student (top-1 0.232 / top-5 0.567) and reports verification recall@FAR10 — the MVP "given-a-word, did you sign it" metric.

**Architecture:** Drop-in **student-architecture swap** in the existing `train_recognizer_distill.py` distillation pipeline. The teacher (GRU `Recognizer`) and the distillation loss/data are unchanged; only the student becomes a `SeqTransformer`. The student data (`.cache/recog-seq-w64-merged`) is already OUR-landmark sequences, so test metrics are already runtime-realistic. Add a pure verification metric (recall@FAR per word) used both inline and standalone.

**Tech Stack:** Python, PyTorch, NumPy. Working repo: `/Users/kelly/Developer/asl-pilot-annotator`, dir `tools/detector0-annotator/`. Run everything with `/Users/kelly/Developer/asl-pilot/.venv/bin/python`. No pytest assumed — tests are standalone assert scripts run with the venv python. Heavy training on Brev; smoke runs local (`--device mps`).

**Baseline to beat (from `output/recognizer-distill.json`):** test top-1 `0.2322`, top-5 `0.5673`, chance `0.0105`, 95 classes.

---

## File Structure

- `tools/detector0-annotator/verification.py` — NEW. Pure `recall_at_far(probs, y, n_classes, far)` metric. No torch import; NumPy only. Used by the trainer and any eval script.
- `tools/detector0-annotator/test_verification.py` — NEW. Asserts for the metric on synthetic data.
- `tools/detector0-annotator/seq_transformer.py` — NEW. `SeqTransformer(nn.Module)` matching the `Recognizer` interface `forward(x, lengths) -> logits`, plus a `--self-test`.
- `tools/detector0-annotator/train_recognizer_distill.py` — MODIFY. Add a student-arch factory + transformer CLI args; compute and persist verification recall@FAR10 in the receipt; save `student_arch` in the checkpoint.

All paths below are relative to `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/` unless absolute.

---

### Task 1: Verification metric (pure function, TDD)

**Files:**
- Create: `tools/detector0-annotator/verification.py`
- Test: `tools/detector0-annotator/test_verification.py`

- [ ] **Step 1: Write the failing test**

Create `test_verification.py`:

```python
import numpy as np
from verification import recall_at_far


def test_perfect_separation_gives_recall_1():
    # 2 classes, 4 clips each. Class-w prob is high for true-w, low otherwise.
    probs = np.array([
        [0.9, 0.1], [0.8, 0.2], [0.85, 0.15], [0.95, 0.05],  # true 0
        [0.1, 0.9], [0.2, 0.8], [0.15, 0.85], [0.05, 0.95],  # true 1
    ], dtype=np.float32)
    y = np.array([0, 0, 0, 0, 1, 1, 1, 1])
    assert recall_at_far(probs, y, n_classes=2, far=0.10) == 1.0


def test_random_scores_near_far():
    # Identical distributions -> recall should be roughly the far level, not 1.0
    rng = np.random.RandomState(0)
    probs = rng.rand(400, 2).astype(np.float32)
    y = rng.randint(0, 2, size=400)
    r = recall_at_far(probs, y, n_classes=2, far=0.10)
    assert 0.0 <= r <= 0.35  # near chance/far, well below 1.0


def test_skips_classes_without_pos_or_neg():
    probs = np.array([[0.9, 0.1], [0.8, 0.2]], dtype=np.float32)
    y = np.array([0, 0])  # class 1 has no positives -> skipped, no crash
    r = recall_at_far(probs, y, n_classes=2, far=0.10)
    assert r == 1.0


if __name__ == "__main__":
    test_perfect_separation_gives_recall_1()
    test_random_scores_near_far()
    test_skips_classes_without_pos_or_neg()
    print("verification: all tests passed")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator && /Users/kelly/Developer/asl-pilot/.venv/bin/python test_verification.py`
Expected: FAIL — `ModuleNotFoundError: No module named 'verification'`.

- [ ] **Step 3: Write minimal implementation**

Create `verification.py`:

```python
"""Per-word verification metric for the sign recognizer.

recall_at_far: for each class w, treat the model's softmax prob for w as a
detector score for "is this attempt the sign w?". Pick the threshold where the
false-accept rate over non-w clips equals `far`, then measure the recall over
true-w clips. Mean across classes that have both positives and negatives.

This is the MVP "given the word, did you sign it correctly?" operating metric.
"""
from __future__ import annotations

import numpy as np


def recall_at_far(probs: np.ndarray, y: np.ndarray, n_classes: int, far: float = 0.10) -> float:
    probs = np.asarray(probs, dtype=np.float64)
    y = np.asarray(y)
    recalls = []
    for w in range(n_classes):
        pw = probs[:, w]
        pos = pw[y == w]
        neg = pw[y != w]
        if pos.size == 0 or neg.size == 0:
            continue
        tau = np.quantile(neg, 1.0 - far)  # threshold admitting `far` of negatives
        recalls.append(float((pos >= tau).mean()))
    return float(np.mean(recalls)) if recalls else 0.0


def per_word_recall_at_far(probs: np.ndarray, y: np.ndarray, n_classes: int, far: float = 0.10) -> dict:
    """Same as recall_at_far but returns {class_index: recall} for reporting."""
    probs = np.asarray(probs, dtype=np.float64)
    y = np.asarray(y)
    out = {}
    for w in range(n_classes):
        pos = probs[y == w, w]
        neg = probs[y != w, w]
        if pos.size == 0 or neg.size == 0:
            continue
        tau = np.quantile(neg, 1.0 - far)
        out[w] = float((pos >= tau).mean())
    return out
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator && /Users/kelly/Developer/asl-pilot/.venv/bin/python test_verification.py`
Expected: `verification: all tests passed`

- [ ] **Step 5: Commit**

```bash
cd /Users/kelly/Developer/asl-pilot-annotator
git add tools/detector0-annotator/verification.py tools/detector0-annotator/test_verification.py
git commit -m "feat(recognizer): per-word recall@FAR verification metric"
```

---

### Task 2: Transformer student model

**Files:**
- Create: `tools/detector0-annotator/seq_transformer.py`

The model MUST match the existing student interface used in `train_recognizer_distill.py`: constructed as a module and called `model(x, lengths)` where `x` is `(B, T, feat)` float32 and `lengths` is `(B,)` int; returns logits `(B, n_classes)`.

- [ ] **Step 1: Write the model with a built-in self-test**

Create `seq_transformer.py`:

```python
"""Transformer-encoder student for the landmark-sequence sign recognizer.

Drop-in replacement for the GRU `Recognizer`: same forward(x, lengths) -> logits
interface. A learned [CLS] token is prepended; padded frames are masked out via
src_key_padding_mask derived from `lengths`. Sized small to stay browser-deployable.
"""
from __future__ import annotations

import math

import torch
import torch.nn as nn


class SeqTransformer(nn.Module):
    def __init__(self, feat, n_classes, d_model=192, n_layers=4, n_heads=6,
                 dropout=0.2, max_len=512):
        super().__init__()
        self.input_proj = nn.Linear(feat, d_model)
        self.cls = nn.Parameter(torch.zeros(1, 1, d_model))
        nn.init.normal_(self.cls, std=0.02)
        self.register_buffer("pe", self._sinusoidal(max_len, d_model), persistent=False)
        layer = nn.TransformerEncoderLayer(
            d_model, n_heads, dim_feedforward=4 * d_model, dropout=dropout,
            batch_first=True, activation="gelu",
        )
        self.encoder = nn.TransformerEncoder(layer, n_layers)
        self.norm = nn.LayerNorm(d_model)
        self.head = nn.Sequential(
            nn.Linear(d_model, d_model), nn.GELU(), nn.Dropout(dropout),
            nn.Linear(d_model, n_classes),
        )

    @staticmethod
    def _sinusoidal(max_len, d_model):
        pos = torch.arange(max_len).unsqueeze(1).float()
        div = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe = torch.zeros(max_len, d_model)
        pe[:, 0::2] = torch.sin(pos * div)
        pe[:, 1::2] = torch.cos(pos * div)
        return pe

    def forward(self, x, lengths):
        b, t, _ = x.shape
        h = self.input_proj(x) + self.pe[:t].unsqueeze(0)
        cls = self.cls.expand(b, -1, -1)
        h = torch.cat([cls, h], dim=1)                       # (B, T+1, d)
        frame_pad = torch.arange(t, device=x.device)[None, :] >= lengths[:, None]
        cls_pad = torch.zeros(b, 1, dtype=torch.bool, device=x.device)
        pad = torch.cat([cls_pad, frame_pad], dim=1)         # (B, T+1) True=ignore
        h = self.encoder(h, src_key_padding_mask=pad)
        return self.head(self.norm(h[:, 0]))                 # CLS token


def _self_test():
    torch.manual_seed(0)
    feat, n_classes = 88, 95
    model = SeqTransformer(feat=feat, n_classes=n_classes, d_model=64, n_layers=2, n_heads=4).eval()
    x = torch.randn(3, 12, feat)
    lengths = torch.tensor([12, 7, 3])
    with torch.no_grad():
        out = model(x, lengths)
    assert out.shape == (3, n_classes), out.shape
    # Padding invariance: zeroing frames beyond a clip's length must not change its logits.
    x2 = x.clone()
    x2[1, 7:] = 999.0  # garbage in padded region of clip 1
    x2[2, 3:] = -999.0
    with torch.no_grad():
        out2 = model(x2, lengths)
    assert torch.allclose(out, out2, atol=1e-4), (out - out2).abs().max().item()
    print("seq_transformer: self-test passed (shape + padding invariance)")


if __name__ == "__main__":
    _self_test()
```

- [ ] **Step 2: Run the self-test**

Run: `cd /Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator && /Users/kelly/Developer/asl-pilot/.venv/bin/python seq_transformer.py`
Expected: `seq_transformer: self-test passed (shape + padding invariance)`

If the padding-invariance assert fails, the mask is wrong — re-check that `frame_pad` is `True` for indices `>= lengths` and that the CLS column is `False`.

- [ ] **Step 3: Commit**

```bash
cd /Users/kelly/Developer/asl-pilot-annotator
git add tools/detector0-annotator/seq_transformer.py
git commit -m "feat(recognizer): SeqTransformer student (masked CLS encoder)"
```

---

### Task 3: Wire the transformer into the distillation trainer

**Files:**
- Modify: `tools/detector0-annotator/train_recognizer_distill.py`

- [ ] **Step 1: Add imports and a student factory**

In `train_recognizer_distill.py`, after the existing import line `from train_recognizer import Recognizer, hand_feat, load` (line 25), add:

```python
from seq_transformer import SeqTransformer


def build_student(arch, feat, n_classes, args):
    if arch == "gru":
        return Recognizer(feat=feat, hidden=args.student_hidden, n_classes=n_classes)
    if arch == "transformer":
        return SeqTransformer(
            feat=feat, n_classes=n_classes, d_model=args.d_model,
            n_layers=args.n_layers, n_heads=args.n_heads, dropout=args.dropout,
        )
    raise ValueError(f"unknown student arch: {arch}")
```

- [ ] **Step 2: Use the factory in `train_student`**

In `train_student` (currently line 228), replace:

```python
    model = Recognizer(feat=student["X"].shape[-1], hidden=args.student_hidden, n_classes=len(student["labels"])).to(dev)
```

with:

```python
    model = build_student(args.student_arch, student["X"].shape[-1], len(student["labels"]), args).to(dev)
```

- [ ] **Step 3: Add the CLI args**

In `main()`, immediately after the `--student-hidden` argument (line 294), add:

```python
    ap.add_argument("--student-arch", choices=["gru", "transformer"], default="gru")
    ap.add_argument("--d-model", type=int, default=192)
    ap.add_argument("--n-layers", type=int, default=4)
    ap.add_argument("--n-heads", type=int, default=6)
    ap.add_argument("--dropout", type=float, default=0.2)
```

- [ ] **Step 4: Save the arch in the checkpoint and receipt**

In `main()`, in the `torch.save({...}, weights)` dict (line 342-344), add `"student_arch": args.student_arch,` to the saved dict. In the receipt `json.dumps({...})` (line 346), add `"student_arch": args.student_arch,` after the `"classes"` line.

- [ ] **Step 5: py_compile to verify no syntax errors**

Run: `cd /Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator && /Users/kelly/Developer/asl-pilot/.venv/bin/python -m py_compile train_recognizer_distill.py seq_transformer.py verification.py && echo OK`
Expected: `OK`

- [ ] **Step 6: Commit**

```bash
cd /Users/kelly/Developer/asl-pilot-annotator
git add tools/detector0-annotator/train_recognizer_distill.py
git commit -m "feat(recognizer): --student-arch transformer in distill trainer"
```

---

### Task 4: Add verification eval to the trainer + local smoke run

**Files:**
- Modify: `tools/detector0-annotator/train_recognizer_distill.py`

- [ ] **Step 1: Add a verification helper that returns recall@FAR10 on an index set**

In `train_recognizer_distill.py`, after the existing `evaluate(...)` function (ends line 219), add:

```python
def verification_recall(model, X, L, y, idx, n_classes, batch, dev, far=0.10):
    from verification import recall_at_far
    model.eval()
    Xt = torch.from_numpy(X).to(dev)
    Lt = torch.from_numpy(L).to(dev)
    probs = np.zeros((len(idx), n_classes), dtype=np.float32)
    with torch.no_grad():
        for k in range(0, len(idx), batch):
            bi = torch.as_tensor(idx[k:k + batch], device=dev)
            p = torch.softmax(model(Xt[bi], Lt[bi]), dim=-1)
            probs[k:k + len(bi)] = p.detach().cpu().numpy()
    return recall_at_far(probs, y[idx], n_classes, far)
```

- [ ] **Step 2: Compute it after training and print + persist it**

In `main()`, after the line that computes `model, history, t1, t5 = train_student(...)` (line 332), add:

```python
    vr = verification_recall(model, student["X"], student["L"], student["y"], te,
                             len(student["labels"]), args.batch, dev)
    print(f"=== VERIFICATION recall@FAR10 (test, runtime landmarks): {vr:.3f} ===")
```

Then add `"verification_recall_at_far10": round(vr, 4),` to the receipt `json.dumps({...})` dict (after `"test_top5"`).

- [ ] **Step 3: py_compile**

Run: `cd /Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator && /Users/kelly/Developer/asl-pilot/.venv/bin/python -m py_compile train_recognizer_distill.py && echo OK`
Expected: `OK`

- [ ] **Step 4: Local smoke run (tiny, transformer, no save) — proves the whole path runs and beats chance**

Run:
```bash
cd /Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator
/Users/kelly/Developer/asl-pilot/.venv/bin/python train_recognizer_distill.py \
  --student-arch transformer --d-model 96 --n-layers 2 --n-heads 4 \
  --epochs 6 --limit-train 600 --limit-monitor 200 --limit-test 300 \
  --device mps --no-save
```
Expected: it loads student + teacher, prints per-epoch `mon top1` rising above chance (`> ~0.01`), and prints both `=== DISTILLED RECOGNIZER TEST: top1 ... ===` and `=== VERIFICATION recall@FAR10 ... ===` lines without error. (Absolute numbers will be low on this tiny subset; the gate is "runs end-to-end, top1 > chance, both metric lines print".)

If `.cache/recog-seq-w64-merged` or `.cache/handcrop-lm2` is missing, STOP and report — the feature caches must be present (they are the inputs the baseline `recognizer-distill` already used). Do not regenerate them in this task.

- [ ] **Step 5: Commit**

```bash
cd /Users/kelly/Developer/asl-pilot-annotator
git add tools/detector0-annotator/train_recognizer_distill.py
git commit -m "feat(recognizer): report verification recall@FAR10 in distill receipt"
```

---

### Task 5: Full transformer distill run on Brev + compare to baseline

This is the real training run. It is heavy GPU work → Brev, under the existing bounded-campaign approval recorded in `GOAL.md`. Do NOT run the full thing locally.

**Files:**
- Output: `tools/detector0-annotator/output/recognizer-transformer-v1.json` (+ `.pt`)

- [ ] **Step 1: Run the full transformer distill on the retained Brev worker**

Command (full scope, no row caps):
```bash
cd /home/ubuntu/asl-pilot/tools/detector0-annotator  # on the Brev worker
.venv/bin/python train_recognizer_distill.py \
  --student-arch transformer --d-model 192 --n-layers 4 --n-heads 6 --dropout 0.2 \
  --epochs 120 --batch 64 --lr 1e-3 --device cuda --seed 0 \
  --out output/recognizer-transformer-v1.json
```
Record the exact command, instance id, and copyback path in the receipt chain per the Compute Policy. Copy back `output/recognizer-transformer-v1.json` and `.pt`, then stop the worker.

- [ ] **Step 2: Compare against the baseline and record the verdict**

Read both receipts:
```bash
cd /Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator
/Users/kelly/Developer/asl-pilot/.venv/bin/python -c "
import json
b=json.load(open('output/recognizer-distill.json'))
t=json.load(open('output/recognizer-transformer-v1.json'))
print('baseline (gru):   top1', b['test_top1'], 'top5', b['test_top5'])
print('transformer:      top1', t['test_top1'], 'top5', t['test_top5'], 'recall@FAR10', t.get('verification_recall_at_far10'))
"
```
Gate: transformer test top-1 should beat `0.232` and/or verification recall@FAR10 should beat the ~0.7 baseline. If it does NOT, the next move is research-guided tuning (d_model / layers / lr / dropout / landmark-noise augmentation) — treat that as a follow-on campaign, not part of this plan.

- [ ] **Step 3: Commit the receipt**

```bash
cd /Users/kelly/Developer/asl-pilot-annotator
git add tools/detector0-annotator/output/recognizer-transformer-v1.json
git commit -m "run(recognizer): transformer distill v1 (top1 X / recall@FAR10 Y vs gru 0.232)"
```

---

## Self-Review

**Spec coverage:**
- Transformer encoder over landmark sequences → Task 2. ✓
- Distillation reuse (teacher unchanged, student swapped) → Task 3. ✓
- Runtime-realistic eval → student data is already our-landmark sequences (noted in header); test metrics are runtime. ✓
- Runtime-noise augmentation → the existing `jitter_std`/`frame_drop` already inject landmark noise; calibrating/raising it is part of the Task-5 tuning follow-on (flagged, not a separate task to avoid speculative scope). ✓ (acceptable scope cut; called out)
- Verification metric (recall@FAR per word, primary gate) → Task 1 + Task 4. ✓
- PopSign + ASL Citizen, SemLex excluded → inputs are the existing caches built from those approved sources; no new data work in this plan. ✓
- Compute on Brev → Task 5. ✓
- Browser integration explicitly out of scope → not in plan. ✓

**Placeholder scan:** No TBD/TODO; all code is complete; the only deferred item (noise-aug tuning) is explicitly scoped to a follow-on campaign, with the mechanism (existing jitter/frame-drop) named.

**Type consistency:** `SeqTransformer(feat, n_classes, d_model, n_layers, n_heads, dropout)` defined in Task 2 is constructed with exactly those kwargs in `build_student` (Task 3). `forward(x, lengths)` matches the trainer's `model(Xt[bi], Lt[bi])` call sites. `recall_at_far(probs, y, n_classes, far)` defined in Task 1 is called with that signature in Task 4's `verification_recall`. ✓
