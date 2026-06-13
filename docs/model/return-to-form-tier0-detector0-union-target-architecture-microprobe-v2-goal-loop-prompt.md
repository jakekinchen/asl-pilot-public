# Return-To-Form Tier 0 Detector 0 Union-Target Architecture Microprobe V2 Prompt

Mission 3AE-AP prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run exactly one **local, no-spend** microprobe for the M3AE-AO selected Detector
0 union-target remediation formulation:

```text
spatial_objectness_anchor_residual_union_target_microprobe_v2
```

This is the only training-style work allowed in this mission. It must stay
bounded to the current approved Detector 0 packet, current local approved tensor
payloads, and the `table_two_hand_union_or_contact_region` target. It must
answer whether the spatial objectness plus anchor-residual formulation fixes
the M3AE-AN held-out presence and box behavior while still beating the M3AE-AJ
median baseline on train.

Do not run a generic Detector 0 training-smoke retry.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-AP.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-AO/M3AE-AP in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-AO remediation design:
   [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-remediation-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-remediation-v1.md).
5. M3AE-AN held-out behavior check receipt:
   [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json`](../validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json).
6. M3AE-AL architecture-microprobe receipt:
   [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json).
7. M3AE-AK architecture design:
   [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md).
8. M3AE-AJ median-baseline diagnostic receipt:
   [`docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json`](../validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json).
9. Observer-249 API diagnostic:
   [`artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md`](../../artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md).
10. Current approved Detector 0 packet:
    [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
11. Tier 0 manifests under
    [`data/manifests/return-to-form-tier0/`](../../data/manifests/return-to-form-tier0/).
12. Source register:
    [`docs/model/dataset-source-register.json`](dataset-source-register.json).

## First Reviewable Slice

Start with read-only checks:

```sh
git status --short --branch
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_loop_premise.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
jq empty docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json \
  docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json \
  docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json \
  data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json \
  data/manifests/return-to-form-tier0/train.json \
  data/manifests/return-to-form-tier0/validation.json \
  data/manifests/return-to-form-tier0/test.json
test -s docs/validation/return-to-form-tier0-detector0-union-target-architecture-remediation-v1.md
test -s docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md
test -s artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md
./.venv/bin/python scripts/run_return_to_form_tier0_decode_dataloader.py
./.venv/bin/python scripts/audit_return_to_form_tier0_tensor_contract.py
git diff --check
brev ls --json
```

Latest user instruction supersedes the earlier "do not stop Brev" boundary.
Default policy: if no human-approved remote training job is queued or actively
running, stop `asl-pilot-rawframe-001` and verify the stopped state with
`brev ls --json`. Before stopping, check for active training processes when
possible. If `brev stop` returns but `brev ls --json` still reports `RUNNING`,
retry by workspace id and then `brev stop --all`; do not delete/reset without
explicit human approval. Do not create a duplicate worker. Do not sync to Brev
or launch remote training.

Then complete exactly one bounded microprobe:

1. Use the M3AE-AO selected formulation exactly:
   `spatial_objectness_anchor_residual_union_target_microprobe_v2`.
2. Use current approved packet rows only. Do not mutate the packet, add rows,
   approve sources, or import media.
3. Use source tensor `rgb_regions`, frame `frame_index`, region
   `full_frame_reference`, retained `96x96` resolution, RGB float values in
   `[0, 1]`, and deterministic coordinate channels `x_norm` and `y_norm`.
4. Use a local scratch model only: no pretrained weights, detectors, landmarks,
   embeddings, backbones, generated pseudo-labels, or pretrained outputs.
5. Use a `12 x 12` spatial objectness map and anchor-residual box head. Presence
   is the max sigmoid objectness at fixed threshold `0.5`; box prediction is
   from the selected/target cell plus the M3AE-AJ median anchor.
6. Use the M3AE-AJ train median box anchor:
   `[0.11999999731779099, 0.47999998927116394, 0.8199999928474426, 0.7200000286102295]`.
7. Keep the run local CPU by default; local MPS is allowed if available. Brev
   compute is not allowed.
8. Cap the run at 300 epochs with a fixed recorded seed, full train-split batch
   unless local memory requires deterministic mini-batching, AdamW learning rate
   `0.001`, weight decay `0.0001`, and gradient clipping max norm `1.0`.
9. Record train/validation/test row-level predictions, fixed-threshold
   false-positive/false-negative behavior, per-row box errors and IoU, per-split
   metrics, direct comparison to M3AE-AJ, and no-pretrained/Brev boundaries.
10. Write
    [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json).
11. Update the Mutable Tactical Overlay with the receipt and exactly one next
    action.
12. Write a numbered session log.

## Pass Gates

The microprobe passes only if all of these are true:

```text
train_presence_accuracy == 1.0
train_present_box_mae < 0.04107142239809036
train_present_box_mean_iou > 0.6165503859519958
validation_presence_accuracy >= 0.80
test_presence_accuracy >= 0.80
validation_false_positives <= 1
validation_false_negatives <= 1
test_false_positives <= 1
test_false_negatives <= 1
validation_present_box_mae <= 0.02607143111526966
test_present_box_mae <= 0.03791666775941849
validation_present_box_mean_iou >= 0.7486294507980347
test_present_box_mean_iou >= 0.6775339245796204
row_level_predictions_recorded == true
median_baseline_comparison_recorded == true
training_or_export_boundaries_preserved == true
```

The threshold sweep, if recorded, is diagnostic only. Do not select or promote a
product threshold.

## Next-Action Choices

Choose exactly one next action in the microprobe receipt:

- `crop_normalization_ablation_design`: use only if every train and held-out
  pass gate succeeds and no packet/tensor/schema blocker is found.
- `detector0_union_target_data_or_schema_remediation`: use only if the run
  finds a concrete packet, split, target, tensor, or schema problem that
  invalidates the architecture comparison.
- `stop_reduced_claim`: use if the model fits train but repeats the M3AE-AN
  held-out failure without concrete data/schema invalidation, if train gates
  fail, or if no bounded no-new-source Detector 0 path remains justified.

Do not choose another immediate v2 retry, crop-normalization ablation smoke,
recognizer training, export, or model promotion directly from this mission.

## Hard Boundaries

- Do not run a generic Detector 0 training-smoke retry.
- Do not use Brev for sync, SSH, remote training, or compute.
- Do not create a duplicate worker. Stop unused Brev workers only under the
  default-off policy above, and verify stopped state.
- Do not run crop-normalization ablation in this slice.
- Do not run recognizer training.
- Do not run broad 75/95-label training or evaluation.
- Do not expand labels.
- Do not evaluate the controlled clip-heldout checkpoint.
- Do not import or approve sources.
- Do not mutate the Detector 0 packet.
- Do not add rows.
- Do not select or promote a product threshold.
- Do not use MediaPipe, OpenPose, RTMPose, YOLO, pretrained landmarks,
  pretrained detector outputs, pretrained backbones, pretrained embeddings, or
  pretrained-generated labels in the promoted lane.
- Do not export ONNX, promote a model card, or claim final readiness.
- Do not weaken final gates.
- Do not touch product runtime code.
- Do not push or start a broad-run redirect.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AE-AP.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. The architecture microprobe v2 receipt exists at
   [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json)
   and records command, device, seed, selected formulation, input
   representation, architecture summary, anchor box, objectness/box loss terms,
   epoch/batch bounds, row-level predictions, fixed-threshold presence behavior,
   per-split metrics, direct M3AE-AJ comparison, pass/fail gates,
   no-pretrained/source boundaries, Brev no-spend status, final-promotion
   blocker separation, and exactly one next action.
6. The receipt proves no generic training-smoke retry, Brev compute, model
   artifact export, model-card promotion, product threshold promotion, or
   product claim occurred.
7. The Mutable Tactical Overlay links to the microprobe v2 receipt and records
   exactly one next action.
8. A numbered session log records commands, selected signs, source/manifest/
   crop/gate/bootstrap/packet/smoke/remediation/schema/mutation hashes,
   observer-249 API memo path/hash, M3AE-AJ receipt hash, M3AE-AK design hash,
   M3AE-AL microprobe receipt hash, M3AE-AN held-out behavior receipt hash,
   M3AE-AO remediation design hash, microprobe v2 receipt path/hash, Brev
   worker status, stop command/status verification, Brev no-spend boundary,
   and the next action.
9. No generic Detector 0 training-smoke retry, Brev sync/training/spend,
   crop-normalization ablation, recognizer training, packet mutation, row
   addition, label expansion, controlled clip-heldout evaluation, source
   approval/import, unapproved media import, ONNX export, model-card promotion,
   final-readiness claim, broad-run redirect, duplicate Brev worker,
   final-gate weakening, product-runtime code change, product threshold
   promotion, pretrained detector/landmark use, generated pseudo-label use, or
   push occurs.

When all nine are true, continue the goal loop according to the microprobe v2
receipt's single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-AP Detector 0 union-target architecture microprobe v2.
Completed:            <microprobe v2 receipt or exact no-spend blocker>.
Evidence:             <receipt path/hash, pass/fail gates, M3AE-AJ comparison, no-pretrained/Brev boundaries>.
Remaining:            <single next action from the microprobe v2 receipt>.
Blockers:             <none, or exact architecture/schema/provenance blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
