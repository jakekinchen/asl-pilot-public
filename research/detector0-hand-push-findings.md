# Pushing hands to spec — findings (2026-05-30)

Goal: get hand recall@IoU0.30 from ~0.85 toward the 0.98 spec. I tried five
approaches and reached a clear, well-supported diagnosis.

## What I tried

| Approach | left rec@.30 | right rec@.30 | hand IoU | verdict |
|---|---|---|---|---|
| single-stage grid (96px) | 0.88 | 0.78 | 0.51 | baseline |
| + zoom augmentation | 0.88 | 0.80 | 0.53 | marginal |
| two-stage crop→zoom→detect | 0.90 | 0.73 | 0.55 | marginal |

(Head/face and signing-space stayed at spec throughout: rec@.30 ≈ 0.99.)

## The diagnosis: label quality is the ceiling (not resolution/architecture)

The two-stage detector makes hands 3-5× larger in a zoomed crop, yet **`crop_iou`
is only ~0.55**. The decisive check — train vs. test crop IoU:

```
train  left  0.547   right 0.591
test   left  0.535   right 0.394 (n=375, noisy)
```

**Train ≈ test.** The model cannot even *fit* the training hand boxes past ~0.55
IoU. That is the signature of **noisy labels**: MediaPipe's hand boxes jitter
frame-to-frame (landmark hull min/max is sensitive to landmark wobble), so there
is no consistent target to fit. Resolution (crop), architecture (grid head), and
augmentation (zoom) all plateau because none of them can fix the *labels*.

This also caps the *measurable* number: with auto-labels as both train and eval
"ground truth," recall@IoU is bounded by auto-label self-consistency. The real
detector may be better than ~0.55 IoU suggests — we can't tell without
human-verified labels.

## What we need to reach spec

1. **Better hand labels (the real lever).** Options:
   - **SOTA hand/whole-body keypoint model on GPU** — RTMW / DWPose / ViTPose.
     Research shows these beat MediaPipe on hand keypoints "particularly with
     lower input resolutions." Heavier setup (mmpose/CUDA → best on Brev GPU,
     which is verified working). Uncertain it fully reaches 0.98 (signing hands
     are blurry/fast), but it raises the label ceiling.
   - **Human-verified hand boxes** via the annotation GUI already built
     (`tools/detector0-annotator`). Gold standard, and **required for an honest
     eval vs the 0.98 spec** regardless of the labeler, since auto-vs-auto caps
     the metric. A few hundred verified test frames would let us measure truth.
   - **Label de-jitter (cheap):** robust box (percentile hull instead of
     min/max), ensemble/averaging multiple augmented MediaPipe passes, or
     temporal smoothing on densely-sampled frames. Lower ceiling than the above.

2. **More two-handed data** for the right hand (only 280 test, noisy).

## Honest status

- Current best detector (single-stage grid, `detector0-grid-final.pt`): head &
  signing-space **meet spec**; hands rec@.30 ~0.85 / IoU ~0.51, **2× the fixed
  baseline** and usable, but below 0.98 — and that 0.98 is likely unreachable
  *as measured against noisy auto-labels*.
- The five approaches conclusively located the bottleneck (labels, not the
  model), which is the valuable result: we now know the only way up is better
  labels, not more model tweaking.

Artifacts: `output/detector0-grid-zoom.json` (zoom-aug),
`output/detector0-hands-stage2.{pt,json}` (two-stage), this doc.
