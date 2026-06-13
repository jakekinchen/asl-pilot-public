# Design: Transformer sign recognizer (verification-first)

Date: 2026-06-03
Status: proposed (awaiting review)
Scope: **Phase 1 — train the recognizer.** Browser integration is Phase 2 (separate spec).

## Goal

Train a from-scratch **Transformer encoder** sign recognizer over hand-landmark
sequences for the beginner vocabulary (~80–95 words), optimized for the MVP
product flow: **"given a word, did the user sign it correctly?"** — i.e.
single-word **verification** (accept/reject), not open-vocabulary classification.

Beat the current best (landmark-sequence CNN+BiGRU student, `recognizer-distill`):
- test top-1 **0.232**, top-5 **0.567** (95-way, chance 0.0105)
- verification ~**recall@FAR10 0.7** (prior eval; to be re-confirmed as the primary gate)

## Why this framing

95-way classification is hard at this data scale (~75 PopSign clips/word) and is
landmark-quality-limited. **Verification** — score the attempt against the one
known target word and threshold — is the usable operating mode and matches the
product ("practice CAT → did that look like CAT?"). We therefore train as a
classifier (for the distillation signal) but **gate and report on verification
metrics** (recall@FAR per word).

## Reuse (do not rebuild)

- **`tools/detector0-annotator/train_recognizer_distill.py`** — the distillation
  pipeline (teacher → landmark-sequence student, alpha 0.55, T 3.0, jitter 0.02,
  frame-drop 0.1). We swap only the **student architecture**.
- **Teacher checkpoint + `teacher_data` (`.cache/handcrop-lm2`)** — keep as the
  distillation teacher.
- **Student feature cache (`.cache/recog-seq-w64-*`)** — wrist/scale-normalized
  landmark-sequence features (both hands × 21 kpts × xy [+velocity], T frames).
  Confirm/extend the exact feature vector during planning.
- **Datasets:** PopSign v1 (95 words, signer-disjoint) + ASL Citizen, both
  rights-cleared in `dataset-source-register.json`. **SemLex excluded** until a
  rights review clears it.
- **Runtime landmark pipeline** (M3JB detector + per-hand landmark model) — the
  source of landmarks at inference time; its noise is what training must be
  robust to.
- **Practice flow** (`PracticeApp.tsx`, `pass-fail-decision.ts`) — the Phase-2
  integration target; not touched in Phase 1.

## Architecture

Transformer encoder over per-frame landmark features:

1. **Input** per frame: both hands × 21 keypoints × (x, y) wrist-relative +
   scale-normalized, plus per-keypoint velocity (Δ from previous frame), plus a
   visibility/confidence scalar per hand. Sequence length T ≈ 16–32 (sampled to
   a fixed window; pad/mask short clips).
2. **Embed**: linear projection of the per-frame feature vector → d_model
   (e.g. 128–256). Additive sinusoidal (or learned) positional encoding.
3. **Encoder**: N transformer encoder layers (e.g. 3–4), multi-head self-attn,
   with a key-padding mask for padded frames.
4. **Pool**: masked mean (or a [CLS] token) → sequence embedding.
5. **Head**: linear → 95-way logits. Softmax for classification; per-word
   threshold on the target-word probability for verification.

Sized to stay browser-deployable (small d_model / few layers; target ≲ a few MB
ONNX, comparable to the CNN+BiGRU student).

## Training (Approach A — distill on clean landmarks + runtime-noise aug)

- **Loss**: distillation KL to teacher logits (α=0.55, T=3.0) + cross-entropy to
  labels — same recipe as `recognizer-distill`.
- **Augmentation**: existing jitter (0.02) + frame-drop (0.1), **plus a new
  runtime-noise augmentation**: inject landmark noise at the magnitude/shape of
  our scratch landmark model's error (calibrated from its PCK@0.10/0.05 residuals)
  so the student is robust to the noisy landmarks it sees live. This is the key
  guard against the offline-great / live-bad failure.
- **Honest runtime eval**: in addition to the clean-landmark test split, build a
  test set of **our-scratch-landmark sequences** (run the M3JB detector +
  landmark pipeline over the held-out PopSign clips) and report verification on
  *that* — it is the number that predicts live behavior.
- **Compute**: Brev. Redirect the running loop from the landmark-PCK campaign to
  this recognizer training (landmark quality remains the underlying ceiling, but
  the transformer is the priority now).

## Metrics & gates

- **Primary (MVP / verification):** mean per-word **recall@FAR10** on the
  *runtime-landmark* eval set. Gate: beat the 0.7 baseline; target ≥ 0.80.
- **Secondary (classification):** top-1 (beat 0.232), top-5 (beat 0.567).
- **Report both** clean-landmark and runtime-landmark numbers; the gap is the
  train/runtime mismatch we are managing.
- **Calibration:** per-word verification thresholds calibrated on a held-out
  split (feeds the Phase-2 model card).

## Decomposition (independently buildable units)

1. **Feature contract** — confirm/extend the `recog-seq` landmark-sequence schema
   (dims, normalization, velocity, masking). One source of truth for train + runtime.
2. **Transformer student model** — new architecture module, drop-in for the
   student in `train_recognizer_distill.py`.
3. **Runtime-noise augmentation** — noise model calibrated to our landmark error.
4. **Distillation training run** — reuse the existing loop; Brev.
5. **Verification eval** — recall@FAR-per-word metric + threshold calibration (new).
6. **Runtime-landmark eval set** — run our pipeline over held-out clips to get the
   honest test sequences.

## Risks

- **Landmark-limited ceiling.** If runtime landmarks (PCK ~0.66–0.75) are too
  noisy, verification recall plateaus regardless of the recognizer. Mitigation:
  runtime-noise aug + honest runtime eval *early*; M3JB landmark quality still
  matters.
- **Train/runtime gap.** Addressed by training on noise-augmented landmarks and
  gating on the runtime-landmark eval, not the clean one.
- **Data scale.** ~75 clips/word caps the achievable ceiling; ASL Citizen adds
  scale where words overlap.
- **Verification calibration.** Per-word thresholds need enough held-out attempts;
  thin words may need conservative defaults.

## Out of scope (this spec)

- Browser integration, ONNX export, model-card promotion, `activeLabels`
  population (Phase 2, separate spec).
- Open-vocabulary top-1 product flow (revisit only if verification is strong).
- SemLex or any new dataset (needs rights review first).
