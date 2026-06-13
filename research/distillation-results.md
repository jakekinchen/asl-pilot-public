# Distillation result — the recognizer's best, and the pilot's locked model

The Codex-built distillation harness (`train_recognizer_distill.py`) delivered the
biggest recognizer gain since the w64 landmark jump — by transferring the
clean-MediaPipe-landmark teacher's class structure into the runtime student that
eats our (noisy) landmarks.

## Setup
- Teacher: `recognizer-v1.pt` (trained on CLEAN MediaPipe landmark sequences;
  0.367/0.671 on clean inputs, useless ~0.03 on ours).
- Student: BiGRU on OUR-model sequences `.cache/recog-seq-w64-merged`.
- Loss: 0.55·CE(hard) + 0.45·T²·KL(student‖teacher) on clip-aligned PopSign clips
  (AC clips: CE only) + landmark-noise aug (jitter 0.02, frame-drop 0.10), T=3, 80 ep.

## Results (PopSign signer-disjoint test, 95-way, chance 0.011)

| recognizer | top-1 | top-5 | recall@FAR10 | recall@FAR5 |
|---|---|---|---|---|
| v4 (best pre-distill) | 0.208 | 0.523 | 0.671 | 0.517 |
| v5 (hm64) | 0.219 | 0.504 | — | — |
| **distilled** | **0.232** | **0.567** | **0.715** | **0.569** |

+0.024 top-1 / +0.044 top-5 / **+0.044 recall@FAR10** over v4. The
target-verification framing means the guided "practice THIS word" UX verifies the
correct target **~72% of the time at a 10% false-accept rate** — a solid,
demonstrable academic-pilot capability from a fully from-scratch, our-models-only
runtime.

## Status
`recognizer-distill.pt` is the **new locked recognizer** for the pilot (replaces
v4). Full recognizer ladder: 0.176 → 0.183 → 0.208 → **0.232** top-1
(0.439 → 0.450 → 0.523 → **0.567** top-5). Pilot stack: region `detector0-grid-big2`
+ landmark `detector0-hand-landmarks-merged-w64` + recognizer `recognizer-distill`.
Distillation worked where data-scaling and resolution did not — class-structure
transfer, not more landmark fidelity, was the unlock.
