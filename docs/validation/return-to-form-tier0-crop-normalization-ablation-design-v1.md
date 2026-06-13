# Return-To-Form Tier 0 Crop Normalization Ablation Design V1

Mission: M3AE-Q crop-normalization ablation design.
Generated: 2026-05-26T00:16:18Z.
Status: `ready_for_one_local_ablation_smoke_design`.

## Purpose

Define one bounded fixed-crop versus detector-normalized comparison before any
crop-normalization ablation run or recognizer retraining. This document is a
design artifact only. It does not implement the transform, run Detector 0
again, train the recognizer, export a model, or claim final readiness.

The design treats the M3AE-P Detector 0 smoke as proof that packet loading,
target encoding, local scratch loss, and localization metrics are wired. It
does not treat that smoke as detector-quality proof.

## Source Artifacts

| Artifact | Path | SHA-256 |
| --- | --- | --- |
| M3AE-P Detector 0 smoke | `docs/validation/return-to-form-tier0-detector0-training-smoke-v1.json` | `ba8871964ba24bae88935bcad24c132af90dcd8d607bef04df54f56ebdd3b611` |
| M3AE-L Detector 0 bootstrap | `docs/validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json` | `bd17e32bc7d4adbd195d1a26173740163e314a54577a9d9245a38dce752331e5` |
| Detector 0 packet | `data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json` | `ecbd0a53d46cdcc302cbc6c2cb5bb2c7f2049abda0e24328fe82c68118c48f34` |
| M3AE-J fixed-crop recognizer smoke | `docs/validation/return-to-form-tier0-microprobe-config-smoke.json` | `f83977b53910dbb51e71e6175048565b1643ac9699ad89f24ee2c989e3df98f4` |
| M3AE-K label/split remediation | `docs/validation/return-to-form-tier0-label-split-remediation.json` | `2fa1ea2b45f374c26c6dff91fa4805234025d1d1911a1f33ab937596663402ba` |
| Fixed-crop config | `docs/model/return-to-form-fixed-crop-config.json` | `dbc735dad34fa9df1174a40374037976f9c88d789012634b2b22743ae0802b29` |
| Source register | `docs/model/dataset-source-register.json` | `b02c73fce978b348166df54080541851612445ecd9d01e83bed0a9538620b8e8` |
| Source coverage | `docs/research/return-to-form-tier0-source-coverage.json` | `1ff7da89a51e62f9efbeb08cf6361784e160ed862ac579f9e40db332fa576378` |
| Pre-training gates | `docs/validation/return-to-form-tier0-gates.json` | `2cc000d3f90e9be236cf64768530bf9786fc61fe6605c774b9c1e8ab123d9d97` |
| Decode/dataloader receipt | `docs/validation/return-to-form-tier0-decode-dataloader.json` | `d64c0b46500075d94207ef2197a6f6d8f1570cf548da8b08ca16dc520ba386c2` |
| Tensor contract receipt | `docs/validation/return-to-form-tier0-tensor-contract.json` | `0f2ea12cf9a6517bafb67876ba4b0e4951ce821b61b27a740d45f6d1e36b3cd3` |
| Train manifest | `data/manifests/return-to-form-tier0/train.json` | `03ae563a5f2ef0d5b868f6c80f50acb64ae642e782cd541faa5c022d4d0af1de` |
| Validation manifest | `data/manifests/return-to-form-tier0/validation.json` | `23da15a80ce2eee1dab1a7e64c08e2aefcf5d7dd48263677fdc49d1efb0ad808` |
| Test manifest | `data/manifests/return-to-form-tier0/test.json` | `b0c771b612ebb52beb375a98b4180ccd465aa642312a8c6c29d7ff225febd8ed` |

Selected labels: `please`, `table`, `dad`, `grandpa`, `hat`.

The packet has 15 rows total: five train, five validation, and five test rows.
All rows use `manual_verified_from_fixed_crop_context`; review statuses are
six `manual_verified` and nine `manual_corrected`. No rejected row remains.

## Comparison Arms

### Fixed-Crop Baseline

Use the existing M3AD fixed-crop tensor contract and the M3AE-J
crop-identity-preserving recognizer configuration as the baseline arm:

- input tensor key: `rgb_regions`;
- region order:
  `viewer_left_hand_context`, `viewer_right_hand_context`,
  `upper_body_signing_space`, `head_context`, `full_frame_reference`;
- tensor layout: `T,R,H,W,C`;
- region size: `96x96`;
- temporal sample count: `16`;
- train/validation/test manifests: `data/manifests/return-to-form-tier0/*.json`;
- recognizer configuration: random-init region-identity MLP from
  `scripts/run_return_to_form_tier0_microprobe_config_smoke.py`.

Retained baseline evidence from M3AE-J:

```text
train_top1=1.0
train_macro_recall=1.0
validation_top1=0.216
validation_macro_recall=0.21600000000000003
test_top1=0.2736842105263158
test_macro_recall=0.27368421052631575
validation_zero_recall_labels=grandpa
test_zero_recall_labels=table
```

The ablation smoke may either bind to the retained M3AE-J metrics or rerun the
same fixed-crop baseline locally in the same script as the detector-normalized
candidate. If rerun, the script must record the new baseline hash, command,
device, seed, and metrics; it must not use Brev.

### Detector-Normalized Candidate

Use the packet and M3AE-P smoke path to build a detector-normalized tensor stack
from existing `rgb_regions` `full_frame_reference` frames only.

Planned candidate transform:

1. Train a scratch Detector 0 model locally from the 15 packet rows, or reuse a
   model trained inside the same local ablation script. Do not load pretrained
   detector, landmark, pose, backbone, or embedding weights.
2. For every Tier 0 manifest clip, load the existing packet-bound M3AD tensor
   payload from `relative_frame_tensor_path` and read `rgb_regions`.
3. Use the `full_frame_reference` region for each of the 16 frames as the
   detector input. Its coordinate space is normalized full frame `xyxy` with
   top-left origin, matching the Detector 0 packet.
4. Predict the four Detector 0 targets per frame:
   `left_or_first_hand`, `right_or_second_hand`, `head_or_face`, and
   `upper_body_or_signing_space`.
5. Convert predictions into the same five-region recognizer tensor contract:
   `viewer_left_hand_context`, `viewer_right_hand_context`,
   `upper_body_signing_space`, `head_context`, `full_frame_reference`.
6. Crop each region from the `full_frame_reference` frame, resize to `96x96`,
   and preserve the output layout `T,R,H,W,C`.

Normalization rules:

- Expand hand boxes by `0.18` normalized units in x/y before cropping, then
  clamp to `[0, 1]`.
- Expand head boxes by `0.12`.
- Expand upper-body/signing-space boxes by `0.08`, while preserving torso and
  shoulder context.
- If a target prediction is absent, invalid, or below the selected confidence
  threshold, fall back to that frame's fixed-crop region from
  `return-to-form-fixed-crop-config.json`.
- Keep `full_frame_reference` unchanged.
- Record fallback counts by split, label, target id, and reason.

The candidate must write ignored/generated tensors or a temporary artifact only
inside an explicit output directory, with tracked receipt hashes. It must not
mutate the M3AD manifests, fixed-crop tensors, packet, source register, or final
model artifacts.

## Planned Command Template

The next implementation slice should introduce one local smoke command shaped
like:

```sh
./.venv/bin/python scripts/run_return_to_form_tier0_crop_norm_ablation_smoke.py \
  --device cpu \
  --packet data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json \
  --train-manifest data/manifests/return-to-form-tier0/train.json \
  --validation-manifest data/manifests/return-to-form-tier0/validation.json \
  --test-manifest data/manifests/return-to-form-tier0/test.json \
  --output docs/validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json
```

Expected tracked receipt:
`docs/validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json`.

Expected unpromoted local output directory:
`output/return-to-form-tier0-crop-normalization-ablation-smoke/`.

The command must be local CPU/MPS only. It may check `brev ls --json` for
status but must not run Brev sync, SSH, training, or stop commands.

## Metrics And Gates

### Detector Localization Sanity

Report on packet rows:

- train, validation, and test presence accuracy;
- present-target box MAE;
- present-target mean IoU;
- per-target support and fallback rate;
- tensor hash count checked.

Minimum local sanity to continue to recognizer comparison:

```text
train_presence_accuracy=1.0
train_present_box_mae<=0.15
loss_drop_fraction_from_initial_to_best>=0.75
tensor_hashes_checked=15
```

Validation/test localization remain report-only in this small proof. They must
not be described as detector quality.

### Transform Integrity

Every detector-normalized clip must record:

- source manifest path/hash;
- source clip id, label, split, source record id, signer identity hash;
- input tensor path/hash;
- output tensor path/hash;
- `rgb_regions` input shape;
- detector-normalized output shape;
- region order;
- per-target fallback counts.

Hard stop if any split has missing tensors, shape mismatch, source-id mismatch,
or unresolved packet provenance.

### Recognizer Comparison

Use the same selected labels, splits, random-init recognizer architecture,
training budget, optimizer family, and metric code for both arms.

Primary comparison metrics:

- train top-1 and macro recall;
- validation top-1 and macro recall;
- test top-1 and macro recall as report-only;
- per-label recall and zero-recall labels;
- loss drop from initial to best;
- confusion matrix by split.

Minimum gate for the detector-normalized candidate:

```text
train_top1>=0.8
train_macro_recall>=0.8
loss_drop_fraction_from_initial_to_best>=0.4
validation_top1 improves over fixed baseline by >=0.05 OR
validation_macro_recall improves over fixed baseline by >=0.05 OR
zero_recall_labels decreases versus fixed baseline
```

If train sanity fails, classify the result as an implementation or detector
normalization failure, not as source distribution evidence. If train sanity
passes but validation/test remain near random, preserve the M3AE-K
source/signer distribution blocker.

### Final-Promotion Blocker Separation

This ablation must not claim final readiness. It must keep these blockers
separate and unchanged:

- `tier0_hard_negative_far`;
- `no_zero_accepted_true_class`;
- full 17-type final-promotion negative-challenge gate;
- ONNX export;
- model-card promotion.

## Stop Rules

Stop and do not promote the crop-normalization route if any of these occur:

- source artifact hashes drift without explanation;
- any input uses a source outside `popsign-v1-original-videos`;
- any transform uses pretrained detector, landmark, pose, feature, embedding,
  or generated pseudo-label output;
- Detector 0 cannot reproduce the packet train sanity threshold;
- detector-normalized tensors cannot preserve `T,R,H,W,C` with five regions;
- fallback rate exceeds `0.40` overall or `0.60` for any target id;
- recognizer train sanity fails on the candidate;
- validation/test stay near random and no zero-recall label improves;
- the next step would require Brev spend, new source approval, label expansion,
  final-gate weakening, or a changed product claim.

## Boundaries

| Boundary | Status |
| --- | --- |
| Design-only artifact | satisfied |
| Uses only approved PopSign Tier 0 manifests/tensors/packet rows | required |
| New source approval/import | forbidden |
| MediaPipe/OpenPose/RTMPose/YOLO/pretrained landmarks or detector outputs | forbidden |
| Pretrained backbones, embeddings, or generated labels | forbidden |
| Recognizer training in this slice | not performed |
| Detector 0 retraining in this slice | not performed |
| Crop-normalization ablation run in this slice | not performed |
| ONNX export/model-card promotion/final-readiness claim | not performed |
| Final-gate weakening | not performed |
| Brev sync/SSH/training/compute | not performed |
| Brev status check | `brev ls --json` only |
| Manual Brev stop command | `brev stop asl-pilot-rawframe-001` |
| Manual Brev stop command run | false |

Latest read-only Brev status:

```text
workspace=asl-pilot-rawframe-001
status=RUNNING
health_status=HEALTHY
instance_type=massedcompute_A100_sxm4_80G_DGX
```

## Risks

- The M3AE-P detector smoke is deliberately tiny and should not be treated as a
  robust detector.
- The candidate transform uses existing `full_frame_reference` frames rather
  than re-decoding raw video, so it is a bounded local smoke and not the final
  best-quality crop-normalization implementation.
- PopSign validation/test remain signer-disjoint from train; crop
  normalization may not overcome the source/signer distribution blocker.
- Right/second-hand support is sparse in the 15-row packet, so fallback and
  per-target reporting are mandatory.

## Readiness Classification

`ready_for_one_local_no_spend_ablation_smoke`.

The design is bounded enough for one implementation-and-run slice because it
uses only approved existing artifacts, has explicit transform and fallback
rules, preserves no-pretrained boundaries, and carries stop rules that prevent
promotion or broad-route drift.

## Selected Next Action

`crop_normalization_ablation_smoke`
