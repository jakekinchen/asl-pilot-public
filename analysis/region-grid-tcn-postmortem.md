# Post-mortem: why the region-grid TCN recognizer failed

**Date:** 2026-06-03
**Scope:** The `true_temporal_convnet_region_grid` ("TCN") recognizer campaign,
missions M3AU → M3GL (`output/m3aw … m3gl`). Why it never learned, and what
replaced it.

---

## TL;DR

The TCN didn't fail because it was a TCN. It failed because it was a
**from-scratch, raw-pixel spatiotemporal model trained on 84 clips across 7
classes, under a no-pretrained constraint.** That is a data/representation
problem, not a tuning problem. The model overfit the train set and collapsed its
predictions onto 1–2 majority classes — exactly what theory predicts for a
high-capacity vision model with ~12 examples per class. Hyperparameter and seed
retries moved the metric only within its own sampling noise.

The fix was to change lanes entirely: **normalized hand-landmark sequences +
distillation, trained on ~7,000 clips.** Same vocabulary, far better result.

---

## What the TCN actually was

- **Architecture:** `true_temporal_convnet_region_grid` — a from-scratch
  temporal convnet over raw pixels (no pretraining permitted in the promoted
  lane).
- **Input contract (`rgb_regions_grid_v1`):** per frame, 3 **fixed** crop boxes
  — `viewer_left_hand_context`, `viewer_right_hand_context`,
  `upper_body_signing_space` — each resized to 96×96 RGB and stacked over 16
  frames → tensor `[T=16, R=3, H=96, W=96, C=3]` (axis order `T,R,H,W,C`). The
  regions were **fixed normalized boxes, not detected.**
- **Data:** ASL Citizen subset (`data/manifests/lesson/high-signal-region-grid/`),
  7 classes — `table, please, black, hello, uncle, white, sad`.
  - train: **84 clips** (12 per class)
  - validation: **27 clips** (~4 per class)
  - test: **28 clips** (4 per class)
- **Training (m3gl, representative):** 16 frames, image-size 96, lr 1e-3, 12
  epochs, batch 8, mild augmentation, CUDA on Brev (L40S), seed-varied.

## What it produced

| run | best val acc | test top-1 | test macro-F1 | selected epoch |
|-----|-------------|-----------|---------------|----------------|
| m3ev/m3ew | 0.222 | 0.179 | 0.116 | 3 |
| m3gl (seed) | 0.296 | ~0.18–0.22 | ~0.13 | 10 |

- Train accuracy climbed to 0.43–1.0 (memorization) while val/test stayed near
  chance-plus-noise.
- **Prediction collapse:** validation predictions concentrated on `white` (15/27)
  and `uncle`; `black`, `please`, `table`, `sad` got **zero recall**. Test showed
  the same shape (`white` 21/28).

---

## Root causes, in order of impact

### 1. Data starvation (dominant cause)

Twelve training clips per class is far below what a from-scratch spatiotemporal
CNN needs. The model cannot learn invariance to signer identity, clothing,
lighting, or background from 12 examples, so it memorizes the training set and
the held-out splits collapse onto whichever class has the most distinctive
low-level pixel statistics. The **no-pretrained constraint makes this fatal**:
ImageNet/Kinetics pretraining is precisely the mechanism that lets small-data
video models work, and it was disallowed in the promoted lane.

### 2. Wrong representation — raw RGB instead of pose

The TCN had to learn, from pixels and from 84 clips, to simultaneously (a)
locate the hands, (b) suppress face / clothing / background, and (c) read the
gesture. Worse, the crop regions were **fixed boxes, not detections** — a hand
drifting outside its box simply disappears, while the box stays full of
confounding torso/background pixels. Raw pixels carry large nuisance variance the
model must spend capacity suppressing, and it had nowhere near enough data to do
so.

### 3. Shortcut learning on a confounded tiny set

With 12 clips/class and fixed regions, the cheapest thing to fit is a per-signer
or per-background shortcut, not the sign. Collapse-to-majority plus zero-recall
classes is the signature of shortcut learning. The observer triage flagged this
explicitly: `region-grid representation limitation: true` and
`source/split/label separability limitation: true`.

### 4. Retries chased noise

The campaign ran ~10 variants (`m3aw`, `m3ax` tiny-overfit, `m3bv`, `m3cf`
late-fusion, `m3ck`, `m3dq`, `m3er`, `m3gb`, `m3gl` seed). Seed/epoch/aug tweaks
moved val accuracy between 0.22 and 0.30 — but on **27 validation samples, one
example = 3.7%**, so that band is sampling noise, not signal. None of the
variants addressed the actual bottleneck (data + representation).

### 5. Evaluation was noise-dominated

27 val / 28 test → every reported metric carried a ±10–20% confidence interval.
"Best validation at epoch 3" vs "epoch 10" is mostly which noisy snapshot won.
Part of the campaign was chasing ghosts in the metric.

---

## The contrast that proves the diagnosis

Same 7 words, different lane. The **landmark-sequence recognizer**
(`recognizer-distill`, GRU/transformer student) fed 2-hand, wrist-relative,
scale-normalized landmarks — a representation where nuisance variance is already
factored out — trained on **7,011 clips across 95 classes** with distillation:

| | region-grid TCN | landmark-seq distill |
|---|---|---|
| input | raw RGB, fixed crops | normalized 2-hand landmarks |
| train clips | 84 | 7,011 (~83×) |
| classes | 7 | 95 |
| test top-1 | ~0.18–0.22 | **0.232** |
| test top-5 | — | **0.567** |
| recall@FAR10 | — | **~0.72** |

The landmark lane reaches a *usable* recall on a 95-way problem; the TCN couldn't
clear noise on a 7-way one. Representation + data, not architecture, was the
difference.

---

## Lesson / what we acted on

1. **Do not train from-scratch raw-pixel video classifiers under a no-pretrained
   constraint with small data.** It is the worst-case quadrant: high-variance
   model, high-nuisance input, no transfer, few samples.
2. **Move the invariance into the representation.** Extract pose/landmarks first
   (RTMPose tracker → wrist-relative, scale-normalized features), then run a
   small sequence model. The hard perception work is done by the keypoint stage,
   not relearned per sign from pixels.
3. **Scale the data and distill.** Distillation was the unlock once raw
   data/resolution scaling alone plateaued.
4. **Read the failure signature.** Collapse-to-majority + zero-recall classes +
   train-memorization = overfit/data problem. That is a "stop retrying, change
   lanes" signal, not a "tune harder" one. The observer eventually classified it
   correctly as `repeated weak learnability without clear local repair`.

The landmark-sequence recognizer is the lane that ships in the current demo.

---

## Source receipts

- TCN runs: `output/m3{aw,ax,bv,cf,ck,dq,er,gb,gl}-*-region-grid-tcn-*/`
  (`training-provenance.json`, `validation-report.json`,
  `prediction-sidecar.json`).
- Manifest: `data/manifests/lesson/high-signal-region-grid/{train,validation,test}.json`.
- Observer triage: `artifacts/research/observer-547-m3ew-post-tcn-strategy/`.
- Receipt: `docs/validation/return-to-form-m3ew-m3ev-metric-triage-no-remote-v1.json`.
- Landmark lane: `tools/detector0-annotator/output/recognizer-distill.json`
  (in the `asl-pilot-annotator` repo).
