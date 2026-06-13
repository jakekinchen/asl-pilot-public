# ASL Pilot Summary and Model Card

Date: 2026-05-31

## Executive summary

This pilot demonstrates a constrained, academic ASL recognition stack whose
browser inference path uses only project-trained, from-scratch models. The best
current stack is:

1. A scratch region detector for head/face, upper-body signing space, and hands.
2. A signing-space crop.
3. A scratch 21-point hand-landmark model.
4. A scratch BiGRU sign recognizer over 95 beginner PopSign words.
5. A guided target-verification product gate: "practice this word" rather than
   open-ended ASL recognition.

The strongest product metric is target-verification recall: the distilled
runtime recognizer accepts true prompted attempts with recall@FAR10 = 0.715 and
recall@FAR5 = 0.569 on the PopSign signer-disjoint test set. Its open-vocabulary
95-way classifier score remains modest at top-1 = 0.232 and top-5 = 0.567. That
is not a production ASL recognizer, but it is a credible academic pilot: fully
client-side, roughly 8 MiB of model payload, no raw learner-video upload during
normal practice, and no pretrained model in the runtime lane.

The technical story is clear. Data-only scaling was mostly flat. The wins were
better from-scratch landmark capacity and recognizer distillation from a clean
offline-label teacher. The honest ceiling is also clear: recognition with clean
MediaPipe landmark inputs reaches about 0.37 top-1 / 0.67 top-5 on this 95-word
task, while the current from-scratch landmark model plateaus around PCK@0.1 =
0.78. The remaining accuracy path is better from-scratch landmarks and more
carefully licensed, in-domain supervision, not simply more recognizer epochs.

Sources: `research/detector0-data-strategy.md`,
`research/detector0-trained-evidence.md`, `research/detector0-landmark-results.md`,
`research/detector0-hand-push-findings.md`, `research/recognizer-v1-results.md`,
`research/recognizer-v2-our-models-findings.md`,
`research/recognizer-crop-pixel-findings.md`,
`research/recognizer-v3-asl-citizen-findings.md`,
`research/recognizer-v4-landmark-improvement-results.md`,
`research/recognizer-v5-heatmap64-findings.md`,
`research/distillation-results.md`, `research/target-verification-metric.md`,
`research/browser-export-plan.md`, `research/asl-citizen-license-and-register.md`,
and JSON receipts under `tools/detector0-annotator/output/*.json`.

## 1. Goal and hard constraint

The goal is an academic, non-commercial, from-scratch ASL recognition pilot for
guided beginner practice. The project constraint is `#arch-no-pretrained`:

- Only our own from-scratch models run at inference.
- MediaPipe and other pretrained tools may be used only offline as labelers for
  training and evaluation targets.
- Runtime/browser artifacts must not bundle pretrained CV, sign, pose,
  landmark, embedding, feature, or recognition models.
- Normal learner practice must keep raw camera frames local in the browser; no
  raw learner video upload is part of the product path.
- ASL-Citizen-derived model weights are local academic artifacts only unless
  Microsoft confirms in writing that weight distribution is allowed.

This summary therefore distinguishes between label provenance and inference
provenance. The training labels can be MediaPipe-derived. The shipped inference
graph cannot be MediaPipe-derived code or weights.

## 2. Pipeline

The end-to-end runtime pipeline is:

1. **Region detector.** A small scratch `GridDetector` takes a `96x96` RGB frame
   plus coordconv channels and predicts four regions: `head_or_face`,
   `upper_body_or_signing_space`, `left_or_first_hand`, and
   `right_or_second_hand`.
2. **Signing-space crop.** The browser selects the upper-body/signing-space
   region, applies the same crop expansion as the Python inference path, and
   crops the original camera frame.
3. **Hand landmarks.** A scratch `HeatmapNet` runs on the `128x128` signing-space
   crop and predicts 21 keypoints per hand plus presence logits. Soft-argmax
   converts heatmaps to crop-normalized coordinates.
4. **Recognizer features.** Each hand contributes wrist position, wrist-relative
   normalized keypoints, and continuous sigmoid presence. The recognizer feature
   width is 90.
5. **Sign recognizer.** A scratch BiGRU consumes a rolling sequence, trained at
   `T=20`, and predicts 95 PopSign beginner words.
6. **Product decision.** The browser already knows the prompted target word. It
   accepts an attempt when the target's softmax probability is above a calibrated
   threshold `tau`, instead of asking users to trust arbitrary open-vocabulary
   predictions.

The locked academic stack after distillation is:

| Stage | Artifact | Notes |
|---|---|---|
| Region | `detector0-grid-big2` / `detector0-grid-final` family | Scratch grid detector; browser export plan uses `detector0-grid-big2`; trained-evidence/spec receipt reports the final recall table for `detector0-grid-final`. |
| Landmarks | `detector0-hand-landmarks-merged-w64` | Scratch heatmap/soft-argmax hand landmark model, PopSign plus ASL Citizen local training. |
| Recognizer | `recognizer-distill` | Scratch BiGRU student trained on runtime landmark sequences with clean-landmark teacher distillation. |

## 3. Data and provenance

The main in-domain source is PopSign ASL v1.0. It is approved and CC BY 4.0, and
the detector strategy argues that offline-derived labels should be allowed while
preserving the runtime no-pretrained constraint. The detector evidence reports
18,189 PopSign frames across 2,280 clips for the final detector run. The
recognizer v1 clean-landmark baseline used 4,560 PopSign clips, with
participant-disjoint train/validation/test splits. Runtime-consistent recognizer
training later used our region and landmark models over 142,380 frames / 7,119
clips.

ASL Citizen is useful for local academic scale and diversity, but its Microsoft
Research terms are restrictive. The local license review concludes that trained
weights derived from ASL Citizen should not be distributed publicly or to third
parties without written Microsoft permission. In this summary, ASL Citizen
therefore counts as local non-commercial academic supervision, not as a release
source for public browser weights.

## 4. Results ladder

### Detector regions

The trained region detector clearly beats the fixed-box baseline. Head/face and
signing-space meet the aspirational recall spec. Hands are usable and roughly
double the fixed-box IoU, but they do not reach the 0.98 recall@IoU0.30 hand
spec. The hand ceiling appears tied to noisy auto-label boxes, not a lack of
model resolution.

| Target | Mean IoU | Recall@0.30 | Recall@0.50 | Presence acc | Fixed-box IoU | Source |
|---|---:|---:|---:|---:|---:|---|
| Head/face | 0.804 | 0.984 | 0.965 | 0.976 | 0.551 | `detector0-trained-evidence.md`, `detector0-spec-eval.json` |
| Upper-body/signing-space | 0.872 | 0.999 | 0.986 | 0.997 | 0.863 | `detector0-trained-evidence.md`, `detector0-spec-eval.json` |
| Left/first hand | 0.523 | 0.880 | 0.630 | 0.710 | 0.251 | `detector0-trained-evidence.md`, `detector0-spec-eval.json` |
| Right/second hand | 0.495 | 0.782 | 0.621 | 0.766 | 0.232 | `detector0-trained-evidence.md`, `detector0-spec-eval.json` |

The browser/export candidate `detector0-grid-big2.json` reports stronger mean
hand IoU on its receipt, 0.574 versus fixed 0.240, but the spec recall table
above is the conservative detector evidence used for reviewer-facing claims.

### Hand landmarks

Landmark quality is the main recognition bottleneck. The early finding was that
soft-argmax coordinate supervision, not naive heatmap MSE, made from-scratch
keypoints usable. Later experiments showed that ASL Citizen data alone was flat,
model width/capacity helped, and 64x64 heatmaps were effectively flat.

| Step | Data / architecture change | PCK@0.1 | Left / right | Interpretation | Source |
|---|---|---:|---|---|---|
| Coordinate regression | Global FC coordinate head | 0.299 | 0.322 / 0.277 | Weak pooled-vector baseline. | `detector0-landmark-results.md`, `detector0-hand-landmarks.json` |
| Heatmap MSE | Gaussian heatmap target with MSE | 0.076 | 0.050 / 0.103 | Failed; mostly-zero targets allow collapse. | `detector0-landmark-results.md`, `detector0-hand-landmarks-heatmap.json` |
| Soft-argmax | Heatmap plus integral coordinate loss | 0.636 | 0.740 / 0.532 | First usable from-scratch keypoint model. | `detector0-landmark-results.md`, `detector0-hand-landmarks-softargmax.json` |
| Big2 | PopSign, width 32 | 0.759 | 0.784 / 0.735 | Stronger model/data baseline. | `recognizer-v4-landmark-improvement-results.md`, `detector0-hand-landmarks-big2.json` |
| Merged | PopSign plus ASL Citizen, width 32 | 0.763 | 0.769 / 0.757 | Data-only increase was essentially flat. | `recognizer-v4-landmark-improvement-results.md`, `detector0-hand-landmarks-merged.json` |
| Merged-w64 | PopSign plus ASL Citizen, width 64 | 0.778 | 0.794 / 0.762 | Capacity moved PCK and recognition. | `recognizer-v4-landmark-improvement-results.md`, `detector0-hand-landmarks-merged-w64.json` |
| W64 HM64 | Same width, 64x64 heatmaps | 0.779 | 0.798 / 0.759 | Heatmap resolution was flat. | `recognizer-v5-heatmap64-findings.md`, `detector0-hand-landmarks-w64hm64.json` |

### Recognizer

The recognizer ladder should be read in two ways. The clean MediaPipe-landmark v1
model is a useful upper bound for this vocabulary, but it is not deployable
because it collapses on our runtime landmark distribution. The deployable ladder
starts at v2, where both training and testing use our own runtime landmark
sequences.

| Recognizer | Runtime-valid? | Training signal | Test top-1 | Test top-5 | Finding | Source |
|---|---|---|---:|---:|---|---|
| v1 clean-landmark upper bound | No | Clean offline MediaPipe landmarks | 0.367 | 0.671 | Shows the approximate clean-landmark ceiling on this 95-word task. | `recognizer-v1-results.md`, `recognizer-v1.json` |
| v1 on runtime landmarks | No | Clean training, runtime test | 0.031 | 0.108 | Distribution mismatch collapses near chance. | `recognizer-v2-our-models-findings.md` |
| v2 | Yes | PopSign, our-model landmarks | 0.176 | 0.439 | Honest deployable baseline. | `recognizer-v2-our-models-findings.md`, `recognizer-v2.json` |
| v2 plus velocity | Yes | Runtime landmarks plus deltas | 0.138 | 0.366 | Velocity amplified landmark noise. | `recognizer-v2-our-models-findings.md`, `recognizer-v2-vel.json` |
| Crop-pixel fork | Yes | From-scratch CNN+GRU pixels | 0.013 | 0.067 | Chance-level; PopSign is too small for pixel feature learning from scratch. | `recognizer-crop-pixel-findings.md`, `recognizer-crop.json` |
| v3 | Yes | PopSign plus ASL Citizen, same landmarks | 0.183 | 0.450 | Data-only recognizer scaling was flat. | `recognizer-v3-asl-citizen-findings.md`, `recognizer-v3-aslcitizen.json` |
| v4 | Yes | W64 landmark model | 0.208 | 0.523 | Landmark capacity improved recognition. | `recognizer-v4-landmark-improvement-results.md`, `recognizer-v4-w64.json` |
| v5 | Yes | W64 plus 64x64 heatmaps | 0.219 | 0.504 | Top-1 noise up, top-5 down; resolution not a lever. | `recognizer-v5-heatmap64-findings.md`, `recognizer-v5.json` |
| Distilled | Yes | Runtime student plus clean teacher class structure | 0.232 | 0.567 | Best current deployable recognizer. | `distillation-results.md`, `recognizer-distill.json` |

The core deployable recognizer ladder is therefore:

| Model | Top-1 | Top-5 |
|---|---:|---:|
| v2 | 0.176 | 0.439 |
| v3 | 0.183 | 0.450 |
| v4 | 0.208 | 0.523 |
| v5 | 0.219 | 0.504 |
| Distilled | 0.232 | 0.567 |

### Product target-verification metric

Open-vocabulary top-1 is not the right first product metric. The pilot asks the
learner to practice a known target word, so the model only needs to verify the
prompted class. False accepts are measured by evaluating every wrong prompt for
each test clip.

| Recognizer | Tau | Recall | FAR | Notes | Source |
|---|---:|---:|---:|---|---|
| v4 target verification @ FAR <= 10% | 0.00043080 | 0.6707 | 0.1000 | First calibrated product gate. | `target-verification-metric.md` |
| v4 target verification @ FAR <= 5% | 0.00534033 | 0.5167 | 0.0500 | Stricter gate. | `target-verification-metric.md` |
| Distilled target verification @ FAR <= 10% | model-specific threshold not listed in note | 0.715 | <=0.1000 | Best product metric. | `distillation-results.md` |
| Distilled target verification @ FAR <= 5% | model-specific threshold not listed in note | 0.569 | <=0.0500 | Best strict product metric. | `distillation-results.md` |

The practical reading is: the distilled model verifies true prompted attempts
about 72% of the time when the false-accept budget is 10%, and about 57% of the
time at a 5% false-accept budget. Some words remain much weaker than others; the
v4 target-verification note identifies `dog`, `food`, `airplane`, `child`,
`person`, and `listen` as poor pilot targets until the landmark/recognizer path
improves.

## 5. What moved the needle

The meaningful wins were:

- **Offline auto-labeling under a strict runtime constraint.** Allowing MediaPipe
  only as an offline labeler unlocked in-domain detector and landmark
  supervision without shipping MediaPipe.
- **Spatial grid detector heads.** Detector hand IoU rose from weak fixed/FC
  baselines to usable hand localization, while head and signing-space reached
  spec-level recall.
- **Soft-argmax coordinate supervision.** This converted landmark heatmaps from
  a failed all-zero/MSE setup to a usable from-scratch keypoint model.
- **Landmark capacity, w32 to w64.** PCK moved from about 0.759/0.763 to 0.778,
  and recognizer top-5 moved from roughly 0.45 to 0.523.
- **Distillation.** A clean-landmark teacher transferred class structure into
  the runtime student, raising top-1/top-5 to 0.232/0.567 and product
  recall@FAR10 to 0.715.

The flat or negative routes were:

- **Recognizer data quantity alone.** Adding 3,216 ASL Citizen clips to the
  recognizer path moved top-1 only from 0.176 to 0.183.
- **Landmark data quantity alone.** PopSign plus ASL Citizen at width 32 moved
  PCK only from 0.759 to 0.763.
- **Heatmap resolution 32 to 64.** PCK changed only from 0.778 to 0.779, and
  recognizer top-5 fell from 0.523 to 0.504.
- **Velocity features.** Runtime landmark jitter made frame-to-frame deltas
  worse than coordinates alone.
- **Crop-pixel recognition.** A scratch pixel CNN+GRU was data-starved and stayed
  near chance on PopSign scale.
- **Detector hand-spec pushing with current labels.** Zoom augmentation and
  two-stage crop refiners were marginal because noisy MediaPipe hull boxes cap
  the measurable hand IoU.

The current from-scratch ceiling is not a mystery. Clean MediaPipe landmarks
support about 0.37 top-1 / 0.67 top-5 on the 95-word signer-disjoint test, but
our from-scratch landmarks plateau around PCK@0.1 = 0.78. Closing that gap is the
accuracy path.

## 6. Deliverable

The reviewer-facing product deliverable is a fully client-side
`onnxruntime-web` guided-practice pilot. It should not be presented as general
ASL recognition. It is a "practice this word" verifier:

- Camera frames are captured with `getUserMedia` and kept local.
- The browser runs region detection, signing-space crop, hand landmarks, feature
  construction, sequence recognition, and target verification.
- The UI can give bounded feedback such as body alignment, hand presence,
  hold-longer prompts, and matched-target state.
- The app uses a calibrated target threshold rather than raw top-1 claims.

The browser export plan measured the model family at about 8 MiB:

| Component | Existing size evidence |
|---|---:|
| Region ONNX `detector0-grid-big2.onnx` | 979,799 bytes, about 0.93 MiB |
| Landmark ONNX `detector0-hand-landmarks-merged-w64.onnx` | 5,185,909 bytes, about 4.95 MiB |
| Recognizer ONNX `recognizer-v4-w64.onnx` | 2,047,641 bytes, about 1.95 MiB |
| Distilled recognizer checkpoint `recognizer-distill.pt` | 2,050,693 bytes, same recognizer scale |

Before any public review bundle, the recognizer ONNX should be regenerated from
`recognizer-distill.pt` and its calibrated `tau` should be recorded next to the
manifest. The size should remain essentially unchanged because the distilled
student uses the same recognizer architecture. If the review package must be
distributed outside the local academic setting, use a PopSign-only model or get
written Microsoft permission for any ASL-Citizen-derived weights.

## 7. Limitations and future accuracy paths

This pilot has meaningful limitations:

- **Not production ASL.** It covers 95 beginner isolated words, not continuous
  signing, sentences, grammar, regional variants, or full ASL fluency.
- **Open-vocabulary accuracy is low.** The best runtime recognizer is
  0.232 top-1. The product viability comes from target verification, not from
  free-form classification.
- **Landmarks are the bottleneck.** Current scratch landmarks plateau near
  PCK@0.1 = 0.78, below clean MediaPipe quality.
- **Hand detector labels are noisy.** Auto-label hand boxes cap the measured
  detector IoU; human-verified hand boxes are needed for an honest hand-spec
  evaluation.
- **ASL Citizen is local-only unless permission changes.** The best landmark and
  distilled recognizer path uses ASL Citizen-derived supervision, so public
  redistribution is blocked pending written Microsoft confirmation.
- **Per-word behavior is uneven.** A guided pilot should start with stronger
  target words and avoid known weak words until accuracy improves.

High-value next paths are:

1. **Better from-scratch landmarks.** Improve label quality, use human-verified
   hand labels for a small gold eval set, and test stronger scratch keypoint
   formulations.
2. **SimCC or coordinate-classification heads.** A SimCC-style landmark head may
   improve coordinate precision without relying on higher 2D heatmap resolution.
3. **More in-domain data with release-safe provenance.** Additional PopSign-only
   or first-party classroom data avoids the ASL Citizen weight-distribution
   constraint.
4. **Recognizer ensembling and calibration.** Small ensembles or per-word
   thresholds may improve target verification without changing the runtime
   premise.
5. **Temporal smoothing.** Smoothing detector/landmark outputs may reduce jitter
   for both recognition and hand-presence feedback.
6. **Release-specific retraining.** A public demo should prefer PopSign-only
   weights unless Microsoft explicitly authorizes ASL-Citizen-derived weight
   distribution.

## 8. Model card

### Model name

ASL Pilot scratch target-verification stack, draft academic model card.

### Model type

Client-side, multi-stage visual recognition pipeline:

- Scratch grid region detector.
- Scratch hand-landmark HeatmapNet with soft-argmax.
- Scratch BiGRU isolated-word recognizer.
- Binary target-verification decision over a known prompted word.

### Intended use

Academic demonstration of guided beginner ASL practice for a fixed 95-word
PopSign vocabulary. The intended UX is "practice the prompted word, then receive
bounded feedback on whether the attempt matched the target."

### Not intended use

This model is not intended for grading ASL fluency, accessibility-critical
communication, medical/legal/educational placement decisions, continuous ASL
translation, identity inference, surveillance, or open-ended interpretation of
learner video.

### Inputs

Browser camera frames. During normal practice, frames should remain in memory in
the client. The model pipeline expects image preprocessing and coordinate
normalization to match the Python training/export path.

### Outputs

The recognizer outputs probabilities over 95 PopSign words. The product should
surface a target-verification decision and supportive feedback, not an
overconfident open-vocabulary label.

### Training data

- PopSign ASL v1.0 raw video, with offline-derived labels.
- ASL Citizen local non-commercial academic video/labels for some best-model
  runs, subject to non-distribution constraints.
- MediaPipe Holistic used only offline to generate labels/landmarks/boxes.

### Evaluation data

The reported classifier metrics use PopSign signer-disjoint test splits. The
target-verification metric uses wrong-prompt false accepts over 95 classes, with
the FAR denominator defined as `test_clips * (classes - 1)`.

### Best reported metrics

| Metric | Value |
|---|---:|
| Detector head/face recall@IoU0.30 | 0.984 |
| Detector signing-space recall@IoU0.30 | 0.999 |
| Detector left/right hand recall@IoU0.30 | 0.880 / 0.782 |
| Best landmark PCK@0.1 | 0.779 |
| Best runtime recognizer top-1 / top-5 | 0.232 / 0.567 |
| Best target verification recall@FAR10 | 0.715 |
| Best target verification recall@FAR5 | 0.569 |

### Ethical and legal notes

The runtime is designed to avoid raw learner-video upload during normal
practice. That privacy posture is part of the product design, not just a
deployment optimization.

Local non-commercial academic demo/use is the current safe posture. Do not
distribute ASL-Citizen-derived model weights publicly, through a browser bundle,
GitHub release, or third-party static web asset without written Microsoft
permission. A PopSign-only model avoids the ASL Citizen distribution constraint,
at the cost of lower current accuracy.

### Reviewer conclusion

The pilot is technically honest: it satisfies the no-pretrained-runtime
constraint, quantifies the accuracy ladder, and narrows the product claim to a
guided target-verification experience. The result is useful as an academic
from-scratch ASL recognition pilot, not as a general ASL recognizer.

SUMMARY: Wrote `research/PILOT-SUMMARY.md` as the top-level academic summary and model card for the from-scratch ASL pilot.
