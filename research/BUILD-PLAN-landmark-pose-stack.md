# Build Plan: From-Scratch Landmark + Pose Stack

Status: set in stone for the planning lane. This document authorizes no
download, no training, no GPU spend, no promotion, and no browser weight
distribution by itself.

## 0. Goals & Purpose

### Problem

The current from-scratch hand-landmark path was trained on PopSign and
ASL-Citizen frames auto-labeled by MediaPipe in one narrow ASL video domain. A
live webcam test showed it hallucinates hands on a real user at rest in a new
room. That is a hard failure for guided practice: if no hands are visible, the
tracker must say "no hands", not draw plausible fingers.

The root cause is data, not GPU scale or model size. Repo evidence already points
the same way:

- `research/detector0-hand-push-findings.md` found that hand boxes plateaued
  around `0.55` crop IoU even on train data, which is the signature of noisy
  labels.
- `research/recognizer-v2-our-models-findings.md` showed the recognizer is gated
  by landmark discriminability: clean MediaPipe landmarks reached `0.367` top-1
  on clean inputs, but our runtime landmarks drove the deployable recognizer to
  `0.176` top-1 / `0.439` top-5.
- `research/recognizer-v4-landmark-improvement-results.md` showed a small
  landmark PCK gain propagated into a real recognizer gain, so better landmarks
  are a product lever.
- `research/recognizer-v5-heatmap64-findings.md` showed heatmap resolution alone
  was flat, so the next lever is ground-truth data rather than more tuning on
  MediaPipe-derived labels.

### Goal

Build an `#arch-no-pretrained` stack that tracks a real webcam user's:

1. hands,
2. body posture,
3. head/face,

well enough for an academic ASL guided-practice pilot in normal webcam
conditions.

Runtime must use only our models. Training may use public ground-truth datasets.
This plan explicitly forbids training the promoted stack on MediaPipe outputs,
DWPose outputs, MMPose outputs, RTMW outputs, YOLO outputs, SSD outputs, or any
other pretrained model output. Those systems can be research comparators only,
never supervision for the promoted lane.

### Non-Goal

Do not chase MediaPipe's full mobile, occlusion, outdoor, multi-camera,
low-light, and 60 FPS robustness. The target is solid webcam tracking in decent
lighting for an academic guided-practice pilot.

### Measurable Success Criteria

The stack is successful only when all gates pass:

| Area | Required gate |
| --- | --- |
| Hand benchmark | FreiHAND/RHD/COCO-WholeBody visible-hand PCK@0.1 >= `0.85`; palm-size-normalized coordinate error <= `0.16`; stretch target <= `0.134` to match the MediaPipe Hands mixed real+synthetic result. |
| Hand no-hallucination | Real-webcam rest/no-hand false hand-present rate <= `2%` over at least `600` reviewed frames. |
| Hand visible tracking | Real-webcam visible-hand pass rate >= `90%` over at least `600` reviewed frames, with no more than `5%` severe left/right swaps. |
| Body posture | COCO-WholeBody body/feet PCK@0.2 >= `0.80` for Lite and >= `0.84` for Full, matching the documented BlazePose Full-class bar. |
| Head/face | COCO-WholeBody face/head normalized mean error <= `0.08` of face-box size and head/face box recall@IoU0.50 >= `0.90`. |
| End-to-end recognizer | Retrained guided-practice recognizer must beat the current locked `recognizer-distill` baseline: recall@FAR10 > `0.715`, with target >= `0.765`; top-5 > `0.567`. No pilot swap on regression. |
| Browser runtime | Total FP32 ONNX payload <= `30 MiB`, target quantized payload <= `12 MiB`; detector at camera rate, landmark/body/head stack at `10-15 FPS`; no raw learner video upload. |
| Compliance | Runtime contains only project-trained models; every dataset source has a license receipt before training and a separate weight-distribution gate before public or third-party model release. |

## 1. Background: Failure and Feasibility

### Why the current model fails

The current path learned to approximate MediaPipe on PopSign/ASL-Citizen-style
clips. That can validate a from-scratch runtime lane, but it cannot exceed the
teacher or its domain. The live webcam hallucination proves the key missing
negative class and domain gap: a real person in a different room, at rest, is
outside the label distribution.

Repo evidence:

- The existing Detector 0 is real and useful: `research/detector0-trained-evidence.md`
  reports `detector0-grid-final.pt`, `245,400` params, `96x96x5` input, a
  `12x12` spatial grid, and head/signing-space recall@IoU0.30 of `0.984` and
  `0.999`.
- Hands are still below spec: the same report gives left/first hand `0.880`
  recall@IoU0.30 and right/second hand `0.782`, with mean IoU about `0.52` and
  `0.50`.
- The hand-landmark heatmap path is the right family of model: `research/detector0-landmark-results.md`
  shows global regression at `0.299` PCK@0.1, naive heatmap MSE failing at
  `0.076`, and heatmap plus soft-argmax coordinate supervision reaching `0.636`.
- The best later landmark model in `research/recognizer-v4-landmark-improvement-results.md`
  reached `0.778` PCK@0.1 on PopSign-style labels, but those labels are still
  MediaPipe-derived and the live webcam failure remains outside that metric.

### Feasibility argument

The documented successful systems are small:

- MediaPipe Hands uses `1.0M`, `1.98M`, or `4.02M` parameter landmark models.
- BlazePose uses `1.3M` Lite and `3.5M` Full.
- Our current repo already has a `245K` detector, a `1.30M` HeatmapNet landmark
  model, and a `510K` recognizer in `research/browser-export-plan.md`.

The data is also feasible:

- MediaPipe Hands reports `16K` real images plus `100K` synthetic hands.
- BlazePose reports `85K` images.
- The minimal hand plan here uses FreiHAND at about `130K` real training images
  plus RHD at `41,258` synthetic training images and COCO-WholeBody hand labels.

The $400 Brev budget is ample for this model class. The real work is data
engineering, source gating, coordinate unification, real-webcam evaluation, and
not confusing auto-label agreement with truth.

## 2. Documented Recipe We Follow

### MediaPipe Hands, arXiv:2006.10214

Use the MediaPipe Hands recipe as the hand-stack template:

- Two-stage pipeline: palm/hand detector, then a cropped hand landmark model.
- Landmark input: aligned hand crop.
- Landmark outputs: `21` hand landmarks as `(x, y, relative_depth)`, presence,
  and handedness.
- Training data: `6K` in-the-wild images, `10K` gesture images, and `100K`
  synthetic images from a rigged 3D hand with `24` bones and `36` blendshapes,
  random HDR lighting, and `3` cameras.
- Parameter counts: Light `1.0M`, Full `1.98M`, Heavy `4.02M`.
- Metric: MSE normalized by palm size.
- Reported result: real-only `16.1%`, synthetic-only `25.7%`, mixed
  real+synthetic `13.4%`. Mixed data wins.
- Crop alignment reduces the augmentation burden.

Project decision: the hand model will be a cropped per-hand model trained on
public ground-truth data, not a two-hand signing-space model trained on
MediaPipe labels. The repo's `HeatmapNet` architecture and `soft_argmax`
training mechanism are reused, but the final model contract changes to a
MediaPipe-style hand crop with depth, presence, and handedness.

### BlazePose, arXiv:2006.10204

Use the BlazePose recipe as the body/head pose template:

- Detector to tracker pipeline.
- Square crop input.
- `33` keypoint reference design.
- Heatmap and offset losses are used only during training; those output layers
  are removed before inference so only the lightweight regression head runs.
- Training data: `85K` images, split as `60K` common poses and `25K` fitness
  poses.
- Parameter counts: Lite `1.3M`, Full `3.5M`.
- Augmentation: `10%` scale/shift and occlusion-rectangle augmentation.
- PCK@0.2: Lite about `77-80%`, Full about `84%`, human about `97%`.
- Runtime reference: `102 FPS` on Pixel 2.

Project decision: train auxiliary heatmap/offset heads, export regression-only
inference heads. This is stricter than the current browser path, where
`web-pilot/pipeline.js` still runs heatmap soft-argmax in JavaScript.

## 3. Data Plan

### Set-in-stone minimal mix

Use exactly this minimal mix first:

1. COCO-WholeBody for shared detector boxes, body posture, face/head, and hands.
2. FreiHAND for real, sharp, 3D hand supervision.
3. RHD for synthetic hand scale and depth coverage.

Skip InterHand2.6M for the bare-minimum stack. It is the scale-later option only.

### Dataset table

| Dataset | Use | Size | Labels | License/access | Gate |
| --- | --- | ---: | --- | --- | --- |
| FreiHAND | Primary real hand landmark data | about `130K` train images, from `32,560` unique samples on `4` backgrounds, plus about `4K` eval | `21` keypoint 3D hand pose plus MANO shape | Research-only; download from `lmb.informatik.uni-freiburg.de`; exact terms must be copied into a source receipt | Confirm exact current terms and whether trained weights can be distributed. Record exact download size before fetch. |
| RHD, Rendered Hand Pose | Synthetic hand landmark data | `41,258` train, `2,728` eval, `320x320`, `7.1GB` | `21` keypoints in 2D and 3D | Research only, commercial prohibited; cite Zimmermann and Brox 2017 | Allowed for academic training only; public weights need license review. |
| COCO-WholeBody | Shared detector, body, face/head, and extra hand supervision | `200K` images on COCO2017 split | `133` keypoints: `17` body, `6` feet, `68` face, `42` hands, plus person/face/left-hand/right-hand boxes | User-provided verified fact: CC-BY-4.0 research/non-commercial annotations from SenseTime; images are COCO2017 with Flickr terms; annotations via GDrive/OneDrive | Repo currently has an older fail-closed note saying COCO-WholeBody license was unverified/refuted. Resolve by creating a source-register receipt from primary terms before training. Public weights remain gated. |
| InterHand2.6M | Optional hand scale later | `2.59M` frames at 5 FPS, `80GB`; or `12.4M` frames at 30 FPS, `365GB` | `21` keypoint 3D hands, single and interacting hands | License unstated; contact authors; commonly treated as CC-BY-NC research | Skip until M1-M5 are complete and license is written down. |

### Storage budget

Reserve `150GB` before the minimal run:

- RHD: `7.1GB` compressed source plus about `15GB` processed tensors/cache.
- COCO2017 images plus COCO-WholeBody annotations: reserve `35GB`.
- FreiHAND: reserve `50GB` until exact download size is recorded from the source
  page.
- Unified processed manifests/crops/shards: reserve `40GB`.
- Receipts, eval packets, and ONNX exports: reserve `5GB`.

Do not start downloads until the source-register gate records exact source URLs,
license text, checksums where available, expected sizes, and local storage paths.

### Coordinate and format unification

Create one canonical training manifest format before training any model:

```json
{
  "source_id": "frei_hand|rhd|coco_wholebody",
  "split": "train|validation|test",
  "image_path": "...",
  "person_box_xyxy_norm": [0, 0, 1, 1],
  "face_box_xyxy_norm": null,
  "left_hand_box_xyxy_norm": null,
  "right_hand_box_xyxy_norm": null,
  "body_keypoints_xyv": [],
  "face_keypoints_xyv": [],
  "left_hand_keypoints_xyzv": [],
  "right_hand_keypoints_xyzv": [],
  "license_gate": "local_training_only|distribution_pending|distribution_allowed"
}
```

Rules:

- Store all coordinates in normalized top-left-origin image coordinates before
  crop transforms.
- Store per-crop coordinates normalized to the square crop for model training.
- Keep `visibility` masks. Do not train losses on unlabeled or invalid points.
- Normalize hand depth root-relative to the wrist and scale by palm size.
- Normalize body coordinates by square crop size and body torso size for metrics.
- Convert COCO-WholeBody anatomical left/right into the project schema
  deliberately. The existing repo target names are `left_or_first_hand` and
  `right_or_second_hand`; the old detector used viewer-side conventions. This
  plan uses anatomical handedness for hand landmark model training and records
  any viewer-mirror transform at the browser boundary.
- Horizontal flip augmentation must swap left/right hand boxes, hand keypoints,
  handedness labels, and body side keypoints.
- Derive `upper_body_or_signing_space` from COCO body keypoints by enclosing
  shoulders, elbows, wrists, hips, and visible hands, then padding by `20%`
  horizontally and `15%` vertically. Clip to image bounds.

### Weight-distribution gate

All minimal datasets are research/non-commercial or have image-rights caveats.
This is acceptable for a local academic pilot, but not enough by itself for
public model weights.

Use the same fail-closed stance as `research/asl-citizen-license-and-register.md`:

- Training allowed only after source-register approval.
- Browser/runtime weight distribution blocked until each contributing dataset
  explicitly permits trained-weight distribution or written permission is in
  hand.
- Never distribute raw videos, images, crops, landmarks, manifests, or feature
  caches unless the source receipt explicitly permits it.

## 4. Architecture

### Runtime stack

The final runtime stack is:

```text
webcam frame
  -> shared GridDetectorV2
  -> square crops
  -> HandLandmarkNetV2 per hand
  -> BodyPoseNetV1 for posture
  -> FaceHeadNetV1 for head/face
  -> feature adapter
  -> retrained guided-practice recognizer
```

No pretrained model runs in this path.

### Reuse from repo

Reuse these existing contracts:

- `tools/detector0-annotator/train_detector_grid.py`
  - `GridDetector`
  - `gather_cell`
  - spatial grid objectness plus normalized box head
  - best-val checkpointing
- `tools/detector0-annotator/train_detector.py`
  - `make_xy` 5-channel RGB plus coordconv preprocessing
  - `iou_xyxy`
  - flip and brightness augmentation pattern
- `tools/detector0-annotator/train_hands_landmarks_heatmap.py`
  - `HeatmapNet` encoder/decoder family
  - `--width`
  - `--heatmap-g`
  - `soft_argmax`
  - direct coordinate supervision to avoid the all-zero heatmap failure
- `tools/detector0-annotator/extract_recognizer_sequences.py`
  - runtime-consistent sequence extraction
  - continuous hand presence probabilities
  - same `rows.json` schema for recognizer retraining
- `tools/detector0-annotator/export_models_web.py`
  - ONNX export
  - fail-closed dependency checks
  - ONNX Runtime CPU parity threshold `1e-3`
- `tools/detector0-annotator/web-pilot/pipeline.js`
  - browser preprocessing parity
  - coordconv tensor construction
  - model pipeline wiring
  - recognizer feature normalization

### Build new

Build these new pieces:

1. `GridDetectorV2` data adapter and trainer over public ground-truth detector
   boxes.
2. `HandLandmarkNetV2` per-hand cropped landmark model.
3. `BodyPoseNetV1` square-crop posture model.
4. `FaceHeadNetV1` head/face model.
5. Unified public-dataset manifest builder and source receipts.
6. Real-webcam human-verified eval packet for no-hallucination and tracking.
7. New browser feature adapter and recognizer retrain extraction path.

### Shared detector

Base architecture: current `GridDetector` from `train_detector_grid.py`.

Targets:

- `left_hand_box`
- `right_hand_box`
- `head_or_face_box`
- `upper_body_or_signing_space_box`

Input:

- `96x96x5` first, matching current browser path.
- Escalate to `128x128x5` only if human-verified hand box recall is below gate
  and error analysis shows tiny-hand misses rather than label/domain failures.

Parameter target:

- Initial: <= `0.5M`, current model is `245,400`.
- Hard cap: `1.0M`.

Loss:

- Objectness BCE per target/cell.
- SmoothL1 box loss at positive cell.
- IoU loss for present targets.
- Hard-negative mining for no-hand/rest frames after M1 live-webcam eval.

### HandLandmarkNetV2

Base architecture: `HeatmapNet` family, changed from two-hand signing-space crop
to one-hand aligned crop.

Input:

- `128x128x5` per-hand crop for M1.
- Escalate to `160x160x5` only if FreiHAND/RHD PCK misses gate while detector
  crops are correct.

Outputs at inference:

- `21` landmarks as `(x, y, z_relative)` in crop coordinates.
- presence logit.
- handedness logit.

Training-only outputs:

- `21` heatmaps.
- `21` local offset fields or coordinate soft-argmax auxiliaries.

Inference rule:

- Export regression-only outputs. Heatmap/offset heads are training scaffolding,
  following the BlazePose trick. Browser JavaScript must not soft-argmax large
  heatmaps in the final stack.

Parameter target:

- Lite: `1.0-1.5M`.
- Full: `1.8-2.2M`.
- Hard cap: `4.0M`, matching MediaPipe Hands Heavy scale.

### BodyPoseNetV1

Build a new model. The repo has no body-pose trainer today.

Input:

- `192x192x5` square upper-body/person crop.
- Crop source: detector `upper_body_or_signing_space_box`, expanded to square.

Outputs:

- M1-M5 output schema is `body23`: COCO-WholeBody `17` body plus `6` feet
  keypoints with visibility.
- Do not claim BlazePose `33` semantics until a public, approved `33`-keypoint
  ground-truth source is in the register.
- Include a torso-facing/head-alignment derived feature downstream, computed
  from visible shoulders, nose/face box, elbows, wrists, and hips.

Training-only outputs:

- Heatmap and offset heads.

Inference outputs:

- Regression-only keypoints and visibility logits.

Parameter target:

- Lite: `1.3M`.
- Full: `3.0-3.5M`.

### FaceHeadNetV1

Purpose: head/face alignment and robust no-face/head feedback, not identity.

Input:

- `128x128x5` face/head crop.

Outputs:

- `68` COCO-WholeBody face landmarks where labeled.
- head/face presence.
- face box refinement.
- derived head center, face scale, and rough orientation features for feedback.

Parameter target:

- `0.5-1.0M`.

Privacy rule:

- Do not add face identity, face recognition, or biometric classification.

### Recognizer interface

The current recognizer feature width is `90`:

- per hand: wrist absolute xy, `21` wrist-relative xy pairs normalized by mean
  wrist-relative distance, plus presence.
- two hands: `2 * 45`.

The new recognizer feature vector will be versioned:

- `hands_v2`: two hands, each `21 * 3` plus presence and handedness.
- `body23_v1`: normalized shoulders, elbows, wrists, hips, torso center, and
  visible mask.
- `head_v1`: head center, face scale, face orientation proxy, presence.

Do not silently change `train_recognizer.py`'s existing `FEAT=90` contract.
Create a new feature schema and retrain from scratch.

## 5. Training Plan

### Phase ordering

Train in this order:

1. Source-register and manifest smoke.
2. Shared detector.
3. HandLandmarkNetV2.
4. BodyPoseNetV1.
5. FaceHeadNetV1.
6. Runtime extraction.
7. Recognizer retrain.

Do not train recognizer before M1-M3 tracking gates pass. A recognizer trained
on unstable landmarks only hides tracking failures.

### Detector training

Data:

- COCO-WholeBody boxes: person, face, left hand, right hand.
- Derived upper-body/signing-space boxes from visible body and hand keypoints.
- Negative/rest webcam frames added only after human review, not auto-labeled.

Schedule:

- MPS smoke: `1,000` images, `2` epochs, CPU/MPS, receipt only.
- Brev full: `200K` COCO-WholeBody images, `80-120` epochs, best validation
  checkpoint.

Augmentation:

- Brightness jitter from current repo.
- Horizontal flip with side-keypoint swap.
- `10%` scale/shift.
- Occlusion rectangles on `20%` of crops, with visibility masks preserved.

Loss:

- BCE objectness.
- SmoothL1 box.
- IoU loss.
- Optional focal weighting if no-hand false positives exceed the M1 gate.

### Hand training

Data mix:

- `50%` FreiHAND real hand crops.
- `20%` COCO-WholeBody hand crops.
- `30%` RHD synthetic hand crops.

This implements the MediaPipe Hands lesson that mixed real+synthetic beats
real-only and synthetic-only.

Coordinate normalization:

- Crop aligned to the detected or ground-truth hand box.
- Add `25%` context around the hand.
- Square crop, pad with edge/mean color, resize to `128x128`.
- Normalize `x,y` to crop.
- Normalize `z` root-relative to wrist and divide by palm size.

Loss:

- Presence BCE.
- Handedness BCE.
- Visible keypoint SmoothL1 on `x,y`.
- 3D depth SmoothL1 on FreiHAND and RHD only.
- Palm-size-normalized coordinate MSE for reporting.
- Training-only heatmap CE/MSE plus local offset or soft-argmax auxiliary.
- Peak concentration auxiliary retained from `train_hands_landmarks_heatmap.py`
  only if it improves validation.

Schedule:

- MPS smoke: `2,000` samples, `3` epochs, verify loss decreases and export
  shapes.
- Brev Lite: `80` epochs, width `48`, crop `128`, select by FreiHAND eval.
- Brev Full: `120-160` epochs, width `64`, crop `128`, select by mixed
  validation plus FreiHAND eval.
- Stop if real-webcam no-hallucination fails; add reviewed negative/rest frames
  before any capacity escalation.

### Body training

Data:

- COCO-WholeBody body and foot keypoints.

Output:

- `body23` keypoints plus visibility logits.

Loss:

- Visibility BCE.
- SmoothL1 coordinate loss on visible keypoints.
- Auxiliary heatmap and offset losses during training only.
- PCK@0.2 validation metric normalized by torso/crop size.

Schedule:

- Lite first: `80` epochs, about `1.3M` params.
- Full only if Lite misses body PCK gate: `120` epochs, `3.0-3.5M` params.

### Face/head training

Data:

- COCO-WholeBody face boxes and `68` face keypoints.

Loss:

- Presence BCE.
- Box refinement SmoothL1 and IoU.
- Visible landmark SmoothL1.
- Normalized face-box mean error.

Schedule:

- `60-100` epochs.
- Full model only if head/face false negatives block browser feedback.

### Recognizer retraining

Data:

- Re-extract PopSign and approved local ASL practice clips through our new
  models using an updated version of `extract_recognizer_sequences.py`.
- Do not use MediaPipe landmarks as teacher inputs for the promoted recognizer.
- Distillation from a MediaPipe-label teacher is not part of this build unless a
  separate source-gate decision explicitly allows it. This plan's promoted
  recognizer trains on our model outputs and human/public ground-truth derived
  features only.

Loss:

- Cross-entropy over sign labels.
- Landmark-noise augmentation only if it matches real-webcam error profiles.
- Frame-drop augmentation up to `10%`.

Metrics:

- top-1/top-5 for continuity.
- recall@FAR10 and recall@FAR5 for guided practice.
- Per-word recall table, using `research/target-verification-metric.md` as the
  reporting template.

## 6. Eval Plan

### Benchmark evaluation

Every model gets a held-out benchmark receipt.

Hand:

- FreiHAND eval PCK@0.1.
- RHD eval PCK@0.1.
- COCO-WholeBody hand visible-keypoint PCK@0.1.
- Palm-size-normalized MSE, matching MediaPipe Hands reporting.
- Mean keypoint error.
- Presence false-positive and false-negative rates.
- Handedness accuracy.

Detector:

- Per-target recall@IoU0.30 and recall@IoU0.50.
- Mean IoU.
- False-trigger rate on absent hands.
- Compare to current repo baselines:
  - left/first hand `0.880` recall@IoU0.30,
  - right/second hand `0.782`,
  - head/face `0.984`,
  - signing-space `0.999`.

Body:

- COCO-WholeBody PCK@0.2.
- Visibility accuracy.
- Shoulder/elbow/wrist subset PCK, because ASL posture feedback depends on upper
  body more than feet.

Face/head:

- Face-box recall@IoU0.50.
- `68`-point normalized mean error.
- Head-center error.

Recognizer:

- PopSign signer-disjoint test top-1/top-5.
- target verification recall@FAR10 and recall@FAR5.
- Per-word recall.
- Compare to `recognizer-distill`: `0.232` top-1, `0.567` top-5,
  `0.715` recall@FAR10, `0.569` recall@FAR5.

### Real-webcam human-verified evaluation

This is mandatory. The previous stack missed this gap.

Build a real-webcam eval packet inspired by `prepare_eval.py` and
`eval_vs_human.py`, but for live webcam frames and all landmark/pose heads.

Protocol:

- At least `3` real users if available; minimum `1` real user for M1 no-go.
- At least `3` rooms/backgrounds.
- At least `3` lighting conditions: daylight, normal indoor, dim indoor.
- At least `600` no-hand/rest frames.
- At least `600` visible-hand frames.
- At least `300` two-hand frames.
- At least `300` body/head posture frames.

Required scenarios:

- no hands visible, relaxed rest pose,
- hands down but person visible,
- one open palm,
- one fist,
- fingers spread,
- two hands,
- one hand near face,
- hand partly outside frame,
- signer leaning left/right,
- signer closer/farther from camera.

Human review labels:

- no-hand versus visible-hand presence,
- left/right handedness correctness,
- severe skeleton failure yes/no,
- body/head visible yes/no,
- crop correctness,
- notes for lighting/domain failure.

Go/no-go:

- Any rest/no-hand hallucination rate above `2%` blocks M1.
- Any visible-hand pass rate below `90%` blocks M1.
- Any body/head visible pass rate below `95%` blocks M3 integration.
- Any browser-only mismatch against Python outputs above `1e-3` blocks M5.

### End-to-end pilot eval

Run the browser stack in `web-pilot/` after ONNX parity:

- Check no raw video upload.
- Check camera permission and local inference.
- Run guided target verification on the same target list.
- Record latency, frame cadence, dropped frames, and user-visible feedback.
- Compare to Python outputs on saved frames at every boundary:
  detector boxes, crops, landmarks, body points, face points, feature vector,
  recognizer logits.

## 7. Compute Plan

### Hardware

- Local Mac Studio M3 Ultra with MPS: smoke tests, manifest validation, shape
  checks, short eval, browser parity, no heavy sweeps.
- Brev L40S: default heavy training GPU.
- Brev A100: only if L40S memory blocks body/hand full training.

### Estimated GPU-hours

| Work | GPU | Estimated hours |
| --- | --- | ---: |
| Detector full COCO-WholeBody training | L40S | `4-8` |
| Hand Lite and Full | L40S | `14-24` |
| Body Lite and maybe Full | L40S | `10-18` |
| Face/head | L40S | `4-8` |
| Recognizer retrain and extraction acceleration | L40S or local MPS | `4-8` |
| Ablations, failed runs, eval overhead | L40S | `10-20` |
| Total expected | L40S | `46-86` |

Budget rule:

- This document does not authorize spend.
- Before launch, check live Brev pricing and get explicit human approval.
- Hard stop at `$400`.
- Operational stop target: `$300` or `90` L40S-hours, whichever comes first,
  unless the human explicitly approves more.

### Data footprint

Minimum local footprint target: `150GB`.

Do not put processed image caches into git. Store receipts and manifests, not
raw dataset content.

## 8. Milestones, Deliverables, and Gates

### M1: Hand model

Deliverables:

- Source receipts for FreiHAND, RHD, and COCO-WholeBody hand use.
- Unified hand manifest.
- `HandLandmarkNetV2` trainer.
- Benchmark receipt on FreiHAND/RHD/COCO hands.
- Real-webcam hand eval packet and result.

Go/no-go:

- Benchmark hand PCK@0.1 >= `0.85`.
- Palm-size-normalized error <= `0.16`.
- Rest/no-hand hallucination <= `2%`.
- Visible-hand real-webcam pass >= `90%`.
- No severe left/right swap above `5%`.

If M1 fails, do not proceed to recognizer work. Fix data, negatives, crop
alignment, and source mix first.

### M2: Body pose

Deliverables:

- `BodyPoseNetV1` trainer.
- COCO-WholeBody body/feet receipt.
- Body feature adapter draft.

Go/no-go:

- PCK@0.2 >= `0.80` Lite or >= `0.84` Full.
- Upper-body subset PCK@0.2 >= `0.85`.
- Real-webcam body/head visible pass >= `95%`.

### M3: Face/head plus tracking integration

Deliverables:

- `FaceHeadNetV1` trainer.
- Face/head benchmark receipt.
- Integrated Python runtime over detector, hand, body, and face/head.
- Real-webcam all-heads eval receipt.

Go/no-go:

- Face/head box recall@IoU0.50 >= `0.90`.
- Face/head normalized landmark error <= `0.08`.
- No cross-head crop or coordinate bug in saved-frame parity checks.

### M4: Recognizer retrain on new landmarks

Deliverables:

- New versioned feature schema.
- Updated sequence extraction.
- New recognizer trainer or `train_recognizer.py` v2 path.
- PopSign signer-disjoint evaluation.
- Target-verification report.

Go/no-go:

- Must exceed current locked `recognizer-distill` baseline:
  - top-5 > `0.567`,
  - recall@FAR10 > `0.715`,
  - target recall@FAR10 >= `0.765`.
- Per-word weak targets must be identified before pilot UX claims.

### M5: Pilot swap and ONNX

Deliverables:

- ONNX exports for detector, hand, body, face/head, and recognizer.
- ONNX Runtime CPU parity within `1e-3`.
- `web-pilot/` integration.
- Browser saved-frame parity fixture.
- Browser webcam smoke.
- Runtime model card and license gate receipt.

Go/no-go:

- Total FP32 ONNX payload <= `30 MiB`.
- Quantized target <= `12 MiB`.
- Landmark/body/head cadence >= `10 FPS` in the pilot browser on the target Mac.
- No raw video upload.
- No dataset-derived public weight distribution unless source gates allow it.

## 9. Integration Plan

### Python pipeline

Update the Python path before browser work:

1. Run `GridDetectorV2` on full frame.
2. Decode boxes with the same `gather_cell` semantics.
3. Crop per hand, body, and face/head using recorded square-crop transforms.
4. Run `HandLandmarkNetV2`, `BodyPoseNetV1`, and `FaceHeadNetV1`.
5. Map all outputs back to full-frame normalized coordinates.
6. Write a versioned `rows.json` compatible with a new recognizer feature
   loader.

### Browser pipeline

Update `tools/detector0-annotator/web-pilot/pipeline.js` only after Python
parity is stable:

- Keep `tensorDataFromRgba` compatible with `make_xy`.
- Keep crop expansion math versioned and mirrored in Python.
- Remove final-stack JavaScript soft-argmax over landmark heatmaps.
- Load regression-only ONNX outputs.
- Keep continuous presence probabilities.
- Keep the target-verification UX; do not market it as open-vocabulary
  recognition.

### ONNX export

Extend `export_models_web.py`:

- Preserve fail-closed dependency behavior.
- Export every model with dynamic batch.
- Verify ONNX Runtime CPU parity against PyTorch CPU at `1e-3`.
- Write one manifest containing model schema versions, feature schema version,
  dataset source receipts, and browser payload sizes.

### Recognizer retrain

Do not reuse old recognizer weights with new feature vectors.

Train a fresh recognizer on new runtime-extracted features. The current
`recognizer-distill` is a baseline, not a compatible checkpoint.

## 10. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Domain gap remains after public datasets | M1 real-webcam eval is a hard gate. Add human-reviewed webcam negatives and visible-hand frames before capacity changes. |
| Dataset license blocks weight distribution | Treat training and public/browser weight distribution as separate gates. Follow the ASL Citizen fail-closed pattern. |
| COCO-WholeBody license conflict between current repo notes and newer planning facts | Resolve with a primary-source source-register receipt before training. Until then, COCO-WholeBody is plan-approved but execution-blocked. |
| Synthetic-to-real hand gap | Mix FreiHAND real, COCO real, and RHD synthetic. Select on real validation and real-webcam eval, not synthetic metrics. |
| Current detector target naming mixes viewer and anatomical left/right | Canonicalize handedness in the manifest and record mirror transforms explicitly at browser input/output boundaries. |
| Heatmap heads make browser too slow | Use heatmap/offset only during training and export regression-only inference heads. |
| Compute creep | L40S default, A100 only for memory, explicit approval before spend, hard stop at `$400`. |
| Scope creep into full MediaPipe clone | Body output is `body23` from approved COCO-WholeBody labels, not an unsupported claim of full BlazePose `33` until a matching ground-truth source is approved. |
| Privacy creep | No face identity, no biometric classifier, no raw learner video upload during normal practice. |
| Metric gaming | Benchmark receipts are necessary but insufficient. Real-webcam human-verified eval is mandatory. |

## 11. Explicit Final Success Criteria

The build is complete only if all of the following are true:

1. `GridDetectorV2`, `HandLandmarkNetV2`, `BodyPoseNetV1`, `FaceHeadNetV1`, and a
   retrained recognizer all run from project-trained weights only.
2. The hand stack reaches PCK@0.1 >= `0.85` and palm-size-normalized error <=
   `0.16` on public ground-truth eval, with stretch target <= `0.134`.
3. Real-webcam rest/no-hand hallucination is <= `2%`.
4. Real-webcam visible-hand tracking pass is >= `90%`.
5. Body posture reaches COCO-WholeBody PCK@0.2 >= `0.80` Lite or >= `0.84` Full.
6. Head/face reaches box recall@IoU0.50 >= `0.90` and normalized mean error <=
   `0.08`.
7. Guided recognizer beats the current locked baseline: top-5 > `0.567`,
   recall@FAR10 > `0.715`, and target recall@FAR10 >= `0.765`.
8. Browser ONNX parity passes at max absolute diff <= `1e-3` for every model.
9. Browser payload stays <= `30 MiB` FP32 and targets <= `12 MiB` quantized.
10. Browser runtime reaches `10-15 FPS` for the landmark/body/head update loop
    on the target Mac and uploads no raw learner video.
11. Every dataset has a training receipt, and any public or third-party weight
    distribution has explicit license clearance.

## Summary

File written: `research/BUILD-PLAN-landmark-pose-stack.md`.
Recommended dataset mix: COCO-WholeBody plus FreiHAND plus RHD; InterHand2.6M is scale-later only.
Phase list: M1 hands, M2 body pose, M3 face/head integration, M4 recognizer retrain, M5 browser/ONNX pilot swap.
Compute estimate: `46-86` L40S GPU-hours expected, `$400` hard cap, explicit human approval required before spend.
Top risk: dataset/domain truth, especially real-webcam no-hallucination and trained-weight distribution rights.
