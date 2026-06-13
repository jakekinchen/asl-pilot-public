# Return-To-Form Tier 0 Detector 0 Union-Target Architecture Microprobe Prompt

Mission 3AE-AL prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run exactly one **local, no-spend** train-fit microprobe for the M3AE-AK selected
Detector 0 union-target formulation:

```text
anchor_residual_coordconv_union_target_microprobe_v1
```

This is the only training-style work allowed in this mission. It must be
bounded to the current approved packet and current local tensor paths for
`table_two_hand_union_or_contact_region`. It must prove whether the selected
formulation can beat the M3AE-AJ train-derived median constant-box baseline on
train before any held-out behavior check, crop-normalization ablation,
recognizer training, export, promotion, or product claim.

Do not run a generic Detector 0 training-smoke retry.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-AL.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-AK/M3AE-AL in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-AK architecture design:
   [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md).
5. M3AE-AK session log:
   [`docs/session-logs/252-return-to-form-tier0-detector0-union-target-architecture-reformulation-design.md`](../session-logs/252-return-to-form-tier0-detector0-union-target-architecture-reformulation-design.md).
6. M3AE-AJ median-baseline diagnostic receipt:
   [`docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json`](../validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json).
7. Observer-249 API diagnostic:
   [`artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md`](../../artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md).
8. M3AE-AI smoke-continue receipt, M3AE-AH remediation receipt, and M3AE-AG
   union-target smoke receipt.
9. Current approved Detector 0 packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
10. Tier 0 manifests under
    [`data/manifests/return-to-form-tier0/`](../../data/manifests/return-to-form-tier0/).
11. Source register:
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
jq empty docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json \
  docs/validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json \
  docs/validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json \
  docs/validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json \
  data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json \
  data/manifests/return-to-form-tier0/train.json \
  data/manifests/return-to-form-tier0/validation.json \
  data/manifests/return-to-form-tier0/test.json
test -s docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md
test -s artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md
./.venv/bin/python scripts/run_return_to_form_tier0_decode_dataloader.py
./.venv/bin/python scripts/audit_return_to_form_tier0_tensor_contract.py
git diff --check
brev ls --json
```

The user said not to stop `asl-pilot-rawframe-001`; record `brev stop
asl-pilot-rawframe-001` as the manual stop command, but do not run it. Do not
create a duplicate worker. Do not sync to Brev or launch remote training.

Then complete exactly one bounded microprobe:

1. Use the M3AE-AK selected formulation exactly:
   `anchor_residual_coordconv_union_target_microprobe_v1`.
2. Use current approved packet rows only. Do not mutate the packet, add rows,
   approve sources, or import media.
3. Use the source tensor `rgb_regions`, frame `frame_index`, region
   `full_frame_reference`, retained `96x96` resolution, RGB float values in
   `[0, 1]`, and deterministic coordinate channels `x_norm` and `y_norm`.
4. Use the M3AE-AJ train median box anchor:
   `[0.11999999731779099, 0.47999998927116394, 0.8199999928474426, 0.7200000286102295]`.
5. Keep residual prediction bounded by the M3AE-AK residual scale:
   `[0.16, 0.16, 0.08, 0.18]`.
6. Initialize residual output weights and biases to zero so the initial box is
   the M3AE-AJ median box.
7. Use local CPU by default; MPS is allowed only if available locally. Brev
   compute is not allowed.
8. Cap the run at 300 epochs, full train-split batch, AdamW learning rate
   `0.001`, weight decay `0.0001`, gradient clipping max norm `1.0`, and a
   fixed recorded seed.
9. Record train/validation/test row-level predictions, per-row errors, per-split
   metrics, presence metrics, box metrics, direct comparison to M3AE-AJ, and
   no-pretrained/Brev boundaries.
10. Write
    [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json).
11. Update the Mutable Tactical Overlay with the receipt and exactly one next
    action.
12. Write a numbered session log.

## Pass Gate

The microprobe passes only if all of these are true:

```text
train_presence_accuracy == 1.0
train_present_box_mae < 0.04107142239809036
train_present_box_mean_iou > 0.6165503859519958
row_level_predictions_recorded == true
median_baseline_comparison_recorded == true
training_or_export_boundaries_preserved == true
```

Validation/test metrics are report-only in this mission. Passing the train bar
may justify a later held-out behavior check design, not immediate
crop-normalization ablation, recognizer training, export, or product claims.

## Next-Action Choices

Choose exactly one next action in the microprobe receipt:

- `detector0_union_target_heldout_behavior_check_design`: use only if every
  train pass gate succeeds and validation/test report-only metrics do not
  reveal a packet/tensor/schema blocker.
- `detector0_union_target_architecture_remediation`: use when the bounded
  formulation runs but fails the train median-baseline gate for an
  architecture/optimization reason that can be diagnosed locally without a
  generic training-smoke retry.
- `detector0_union_target_data_or_schema_remediation`: use when the microprobe
  finds a concrete packet, split, target, tensor, or schema problem that
  invalidates the architecture comparison.
- `stop_reduced_claim`: use when no bounded no-new-source Detector 0 path is
  justified without human sign/data review, Brev spend, new source approval, or
  a changed product claim.

Do not choose crop-normalization ablation, recognizer training, export, or model
promotion directly from this mission.

## Hard Boundaries

- Do not run a generic Detector 0 training-smoke retry.
- Do not use Brev for sync, SSH, remote training, or compute.
- Do not stop Brev or create a duplicate worker.
- Do not run crop-normalization ablation in this slice.
- Do not run recognizer training.
- Do not run broad 75/95-label training or evaluation.
- Do not expand labels.
- Do not evaluate the controlled clip-heldout checkpoint.
- Do not import or approve sources.
- Do not mutate the Detector 0 packet.
- Do not add rows.
- Do not use MediaPipe, OpenPose, RTMPose, YOLO, pretrained landmarks,
  pretrained detector outputs, pretrained backbones, pretrained embeddings, or
  pretrained-generated labels in the promoted lane.
- Do not export ONNX, promote a model card, or claim final readiness.
- Do not weaken final gates.
- Do not touch product runtime code.
- Do not push or start a broad-run redirect.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AE-AL.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. The architecture-microprobe receipt exists at
   [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json)
   and records command, device, seed, selected formulation, input
   representation, anchor box, residual bounds, initialization, loss terms,
   epoch/batch bounds, row-level predictions, per-split metrics, direct M3AE-AJ
   comparison, pass/fail gates, no-pretrained/source boundaries, Brev no-spend
   status, final-promotion blocker separation, and exactly one next action.
6. The receipt proves no generic training-smoke retry, Brev compute, model
   artifact export, model-card promotion, or product claim occurred.
7. The Mutable Tactical Overlay links to the microprobe receipt and records
   exactly one next action.
8. A numbered session log records commands, selected signs, source/manifest/
   crop/gate/bootstrap/packet/smoke/remediation/schema/mutation hashes,
   observer-249 API memo path/hash, M3AE-AJ receipt hash, M3AE-AK design hash,
   microprobe receipt path/hash, Brev worker status, manual stop command
   `brev stop asl-pilot-rawframe-001`, Brev no-spend boundary, and the next
   action.
9. No generic Detector 0 training-smoke retry, Brev sync/training/spend,
   crop-normalization ablation, recognizer training, packet mutation, row
   addition, label expansion, controlled clip-heldout evaluation, source
   approval/import, unapproved media import, ONNX export, model-card promotion,
   final-readiness claim, broad-run redirect, Brev stop, duplicate Brev worker,
   final-gate weakening, product-runtime code change, pretrained
   detector/landmark use, generated pseudo-label use, or push occurs.

When all nine are true, continue the goal loop according to the microprobe
receipt's single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-AL Detector 0 union-target architecture microprobe.
Completed:            <microprobe receipt or exact no-spend blocker>.
Evidence:             <receipt paths, hashes, train gates, baseline comparison, no-pretrained/Brev boundaries>.
Remaining:            <single next action from the microprobe receipt>.
Blockers:             <none, or exact architecture/schema/provenance blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
