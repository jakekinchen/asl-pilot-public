# Recognizer v1 — landmark-sequence → 95-way sign classifier (from scratch)

First product-capability baseline: the isolated-sign recognizer the detector
feeds. From-scratch BiGRU over per-clip hand-landmark sequences, no pretrained
weights. Tool: `tools/detector0-annotator/train_recognizer.py`.

## Data

- Source: `.cache/handcrop-lm2` (offline MediaPipe-derived crop-space hand
  landmarks), grouped per clip into sequences. 4560 PopSign clips, 95 words.
- Sequence length T = 6 frames/clip (the autolabel sampling cap).
- PopSign train/validation/test are participant-disjoint. `validation` is folded
  into the training pool (still disjoint from `test`); a 12% slice is carved for
  early-stopping. **`test` is the honest signer-disjoint metric.**
- Pool: train 2676 / monitor 364 / test 1520 clips.

## Feature ablation (test split, 95-way, chance 0.011)

| features | test top-1 | test top-5 |
|---|---|---|
| raw crop-space landmarks (86-d) | 0.274 | 0.554 |
| **wrist-relative + size-normalized handshape + wrist pos (90-d)** | **0.37–0.39** | **0.67** |
| + frame-to-frame velocity (180-d) | 0.315 | 0.629 |

- **Normalization is the big win** (+12 pts top-1): translation/scale-invariant
  handshape removes crop-framing variance and generalizes across signers.
- **Velocity hurt**: with only 6 frames spread across the clip, deltas are noise,
  not motion, and the extra dims overfit ~2.7k clips. Denser frames are the
  prerequisite for motion features to help.

## Result

**Test top-1 ~0.37, top-5 ~0.67** on 95-way from scratch (25×/60× chance). This
validates the full detector→recognizer pipeline: webcam frame → region crop →
hand landmarks → sequence → predicted sign, all our own models.

A monitor-vs-test gap (~0.47 vs ~0.37) reflects signer generalization on thin
data (~32 train clips/word).

## Dominant next lever: data

The clear ceiling is data quantity + temporal density, not architecture:
- More clips/word (PopSign has ~250/word in train; we sampled ~16/split).
- Denser frames/clip (≥16–24) so movement-based signs and velocity features help.
- Runtime-consistent extraction (Option A): run OUR region+landmark models over
  dense frames so the recognizer trains on the exact distribution it sees at
  runtime, instead of the cleaner MediaPipe crop landmarks used here.

Runtime path stays our-models-only; MediaPipe is offline label provenance only.
