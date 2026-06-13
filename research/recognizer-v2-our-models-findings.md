# Recognizer v2 — runtime-consistency experiment (NEGATIVE) + the real bottleneck

Tested the hypothesis that training the recognizer on OUR scratch landmark
model's outputs (runtime-consistent, "Option A") beats training on cleaner
offline MediaPipe labels. **It does not — and the experiment exposed that our
landmark quality, not the recognizer, is the gate.**

## Setup

`extract_recognizer_sequences.py` ran our scratch region + landmark models over
**142,380 frames / 7,119 clips** (all 95 PopSign words, 20 frames/clip, dense,
our-models-only). Retrained the recognizer on it; cross-evaluated v1 across
distributions with `cross_eval.py`.

## Results (honest signer-disjoint test, 95-way, chance 0.011)

| recognizer | trained on | tested on | top-1 | top-5 |
|---|---|---|---|---|
| v1 | MediaPipe labels | MediaPipe (clean) | **0.367** | 0.671 |
| v1 | MediaPipe labels | **our-model (runtime)** | **0.031** | 0.108 |
| v2 | our-model | our-model (runtime) | 0.176 | 0.439 |
| v2 +velocity | our-model | our-model | 0.138 | 0.366 |

## What this means

1. **v1's 0.367 was a mirage for deployment.** A recognizer trained on clean
   MediaPipe landmarks collapses to **chance (0.031)** on our model's actual
   runtime landmarks — the two landmark distributions barely overlap.
2. **The honest end-to-end number with today's models is v2 ≈ 0.176 top-1 /
   0.44 top-5** (train and test both our-model). Weak, but 16× / 8× chance.
3. **It is NOT a presence/quantity problem.** Our-model data is actually denser
   in usable hands (96% of clips have ≥3 hand-frames vs 39% for MediaPipe). The
   limiter is **landmark discriminability**: MediaPipe landmarks are sharp enough
   that 1-2 frames classify a sign; our PCK-0.76 landmarks are not, even when
   present and dense.
4. **Velocity still hurt** even on dense frames — our per-frame landmark noise
   makes frame-to-frame deltas noisier than the motion signal.

## Implication — the fork

A usable recognizer needs landmarks that are BOTH runtime-available (our model)
AND discriminative. Today's PCK-0.76 landmarks aren't. Options:
- **(A) Raise landmark quality** to ~MediaPipe sharpness — the root cause. More
  data (ASL Citizen scale) / better head / higher-res crops. Biggest lever,
  slowest.
- **(B) Bypass landmark argmax** — feed the recognizer the landmark model's
  heatmaps/penultimate features (less lossy than argmax coords), or train a
  scratch CNN+GRU directly on the signing-space CROP PIXELS. Stays
  our-models-only at runtime; sidesteps the landmark-coordinate bottleneck.
- **(C) Accept current capability** — top-5 0.44 can drive a guided "practice
  THIS word — did you get it?" flow (check target in top-k), with product
  expectations set accordingly.

v2 (`recognizer-v2.pt`) is the honest deployable baseline; v1 is retained only as
the clean-label upper bound, NOT a deployable model.
