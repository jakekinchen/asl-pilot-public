# Hand-landmark model results (2026-05-30)

The "primary landmarks" goal — a from-scratch model that predicts hand keypoints
(finger positioning) for the recognizer. Built in the supervisor worktree; the
runtime uses only our scratch model (MediaPipe is an offline labeler only).

## Progression (held-out PopSign test, in-crop 21 keypoints/hand)

| Approach | HAND PCK@0.1 | left / right | notes |
|---|---|---|---|
| global FC coordinate regression | 0.299 | 0.32 / 0.28 | weak; coords from a pooled vector |
| heatmap + Gaussian-MSE | 0.076 | 0.05 / 0.10 | **failed** — MSE on mostly-zero targets has a trivial all-zero solution; soft-argmax collapses to center |
| **heatmap + soft-argmax (integral) coord loss** | **0.636** | **0.74 / 0.53** | **winner** — supervise the soft-argmax coordinates directly; no trivial solution |

Best model: `output/detector0-hand-landmarks-softargmax.pt` (HeatmapNet, 32x32
heatmaps, soft-argmax). Left-hand mean keypoint error ~0.09 (of crop width),
right-hand ~0.15. Right hand is weaker (only 1,697 vs 6,103 present examples).

## Takeaways

- The decisive fix was the **loss**, not the architecture: integral/soft-argmax
  regression beats both global FC and naive heatmap-MSE for from-scratch
  keypoints on noisy auto-labels.
- PCK 0.64 is a usable handshape signal for a downstream recognizer (which is
  temporally robust to per-frame landmark noise — the PopSign Kaggle approach).
- Next levers if more is needed: more right-hand (two-handed) data, higher
  heatmap resolution (64x64), and a human-verified landmark eval (auto-labels
  cap the measurable ceiling).

## Pipeline (all from-scratch, no pretrained at runtime)

frame -> scratch region detector (`detector0-grid-final.pt`) -> signing-space
crop -> scratch landmark model (`detector0-hand-landmarks-softargmax.pt`) -> 21
hand keypoints mapped to the full frame. MediaPipe appears only in the offline
labeling scripts, never in this inference path.
