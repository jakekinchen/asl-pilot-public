# Recognizer v3 — ASL Citizen data scale: ~FLAT. The bottleneck is landmark quality, not data quantity.

Scaled the recognizer's training data with ASL Citizen (the chosen "scale data"
direction) and measured the lift. It is essentially zero.

## Result (PopSign test, 95-way, chance 0.011)

| recognizer | training data | top-1 | top-5 |
|---|---|---|---|
| v2 | PopSign only (our-model landmarks) | 0.176 | 0.439 |
| **v3** | **PopSign + ASL Citizen (our-model landmarks)** | **0.183** | **0.450** |

+3,216 ASL Citizen clips (90/95 words, 64k frames) → **+0.007 top-1.** Noise.

## Why — the diagnosis (triangulated)

Adding clips didn't help because each clip's landmarks come from the SAME
landmark model, and **that model's output quality is the ceiling**:
- our-model landmarks: PCK 0.76, only 20-29% of frames have a confident hand.
- recognizer on OUR landmarks (v2): 0.176; recognizer on CLEAN MediaPipe
  landmarks (v1): 0.367. **That 0.176→0.367 gap IS the landmark-quality gap.**
- ASL Citizen relabeled through our models is even sparser (20.2% presence vs
  29.4% on PopSign) — domain shift — so it adds noisy, not cleaner, signal.

More clips with equally-noisy landmarks ≈ same recognizer. **Data quantity at the
recognizer is not the lever; landmark-model quality is.**

## Implication

To actually use ASL Citizen, it must feed the **landmark model** (and detector),
not the recognizer: relabel AC clips with MediaPipe (clean targets) → retrain the
from-scratch landmark model on PopSign+AC → higher PCK / presence → the recognizer
rises toward its ~0.37 clean-landmark ceiling.

**Fundamental tension:** even with maxed landmarks the clean-landmark ceiling on
this vocab is ~0.37 top-1 / ~0.67 top-5, and a from-scratch landmark model is hard
to push to MediaPipe's pretrained quality — that is the cost of the
`#arch-no-pretrained` runtime constraint. v3 (`recognizer-v3-aslcitizen.pt`)
retained; the AC clips + manifest are ready to retarget at the landmark model.
