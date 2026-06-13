# Detector 0 — trained-model evidence (2026-05-29)

A from-scratch coarse region detector for the 4 primary landmark regions is now
**trained and working**, far beyond the fixed-box baseline. Head/face and
upper-body/signing-space **meet** the aspirational spec; hands are usable and
2× the baseline but below the 0.98 bar.

## Final metrics (held-out PopSign test split, 6,077 frames)

| Target | mean IoU | recall@IoU0.30 | recall@IoU0.50 | presence acc | fixed-box IoU |
|---|---|---|---|---|---|
| head_or_face | 0.804 | **0.984** ✅ | 0.965 | 0.976 | 0.551 |
| upper_body_or_signing_space | 0.872 | **0.999** ✅ | 0.986 | 0.997 | 0.863 |
| left_or_first_hand | 0.523 | 0.880 | 0.630 | 0.710 | 0.251 |
| right_or_second_hand | 0.495 | 0.782 | 0.621 | 0.766 | 0.232 |

Aspirational spec: recall@IoU0.30 ≥ 0.98, @0.50 ≥ 0.90, false no-hand ≤ 0.02.
**Met for head + signing-space.** Hands clear the bake-off gate (learned > fixed
baseline) by ~2× but do not yet reach 0.98@0.30.

## The trained artifact

- `output/detector0-grid-final.pt` — **245,400 params**, 96×96×5 input (RGB +
  coordconv), spatial 12×12 grid head, 4 targets. Tiny and browser-ready.
- **From scratch**: random init, no pretrained weights in the model. The only
  pretrained component (MediaPipe) was used **offline to generate labels** and
  is never part of the model or runtime.
- Receipts: `output/detector0-grid-final.json` (train), `output/detector0-spec-eval.json` (spec).

## How we got here (the method)

1. **Bake-off finding:** at 32 hand-labeled frames a learned detector *lost* to
   a fixed box (overfit). Data, not architecture, was the wall.
2. **Unlock:** project owner relaxed the constraint to "any label method;
   runtime must be our own model." This let us auto-label in-domain video.
3. **Auto-label:** MediaPipe Holistic (offline, v0.10.14) on full-res PopSign
   frames → 4 region boxes (normalized), with the 96px detector input from the
   same frame. `autolabel.py`.
4. **Scale + diversity:** 32 → 5,504 (5 words) → **18,189 frames across 95
   words** (native PopSign train/val/test). Each scale-up improved generalization.
5. **Architecture:** global-FC head (hands 0.37) → **spatial grid head (hands
   0.49–0.51)** — the decisive lever for small-object localization.
6. **Resolution 96→128:** no gain (0.497 vs 0.493) → confirmed the limit is
   generalization, not pixels; finalized at 96px (lighter for browser).
7. **Best-val checkpointing** → final hands 0.509 mean.

Hand-IoU progression: FC 0.37 → grid 0.49 → grid best-val **0.51** (2.1× the
0.24 fixed baseline).

## Provenance & constraint compliance

- **No pretrained model at runtime / in the artifact.** MediaPipe is an offline
  labeler only. Satisfies the one hard runtime constraint.
- **Source:** PopSign ASL v1.0 (CC BY 4.0), already approved in the register.
  Needs the derived-labels amendment (drafted in
  `detector0-source-register-candidates.json`) since the current decision says
  "derived pose/landmark/detector artifacts disallowed."
- **Dataset:** 18,189 frames, 2,280 clips, 95 words; `.cache/autolabel-big/`.
- Label assignment: viewer-x convention (image-left half → left_or_first_hand);
  matches the viewer_left/right crop regions.

## Honest gaps & next levers (to reach hand spec)

- Hand **presence accuracy** (0.71–0.77) is the weakest link — the presence head
  mispredicts on absent/occluded hands. Tuning the objectness threshold +
  hard-negative mining would help.
- Hand **localization** (rec@0.30 0.78–0.88) → more data (more clips/word),
  hand-region crop refinement (two-stage detect→refine), or temporal smoothing.
- Right-hand test set is small (280) → noisier; more two-handed signs would help.

## Artifacts (all in this worktree, branch `annotator-tool`)

- Model: `tools/detector0-annotator/output/detector0-grid-final.pt`
- Training: `train_detector_grid.py` (grid, winner), `train_detector.py` (FC)
- Labeling: `autolabel.py`, `rerender.py`; labeling venv `.labelvenv` (mediapipe)
- Data: `.cache/autolabel-big/` (96px), `.cache/autolabel-big-128/` (128px)

## Handoff to the project

This is isolated from the live loop (which kept running). To bring it into the
project: (1) apply the PopSign source-register derived-labels amendment;
(2) port the labeling+training scripts + the trained `.pt`; (3) wire a browser
inference path for the 245k-param grid detector; (4) keep claim surfaces
fail-closed until promotion gates (incl. the hand-spec gap) are explicitly
accepted. None of that was done autonomously — it's a promotion decision.
