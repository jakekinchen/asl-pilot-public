# Return-To-Form Tier 0 Detector 0 Union-Target Held-Out Behavior Check Prompt

Mission 3AE-AN prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run one **local, no-spend, no-training** held-out behavior check over the
existing M3AE-AL receipt:

```text
docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json
```

M3AE-AL proved train-set fit for
`anchor_residual_coordconv_union_target_microprobe_v1`. M3AE-AM designed the
held-out behavior check needed before any crop-normalization ablation or
recognizer work. This mission runs that receipt-only check and chooses exactly
one next action from evidence already present in the repo.

Do not rerun the microprobe. Do not train. Do not load image or tensor payloads.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-AN.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-AM/M3AE-AN in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-AM design artifact:
   [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md).
5. M3AE-AL architecture-microprobe receipt:
   [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json).
6. M3AE-AJ median-baseline diagnostic receipt:
   [`docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json`](../validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json).
7. M3AE-AK architecture design:
   [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md`](../validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md).
8. Observer-249 API diagnostic:
   [`artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md`](../../artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md).
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
jq empty docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json \
  docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json \
  data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json \
  data/manifests/return-to-form-tier0/train.json \
  data/manifests/return-to-form-tier0/validation.json \
  data/manifests/return-to-form-tier0/test.json
test -s docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md
test -s docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md
test -s artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md
git diff --check
brev ls --json
```

The user said not to stop `asl-pilot-rawframe-001`; record `brev stop
asl-pilot-rawframe-001` as the manual stop command, but do not run it. Do not
create a duplicate worker. Do not sync to Brev or launch remote training.

Then complete exactly one receipt-only slice:

1. Parse `training.row_level_predictions`, `training.metrics`, and
   `median_baseline_comparison` from the M3AE-AL receipt. Use packet and
   manifest identifiers/hashes only for provenance binding.
2. At the fixed M3AE-AL threshold `0.5`, record validation/test true positives,
   true negatives, false positives, and false negatives with row IDs, labels,
   target-present state, predicted-present state, and presence score.
3. Compare table-present rows against the M3AE-AJ median baseline by split and
   row for MAE and IoU.
4. Report whether non-table rows receive systematically higher presence scores
   than table rows, and whether worst box errors coincide with false negatives.
5. Run a diagnostic threshold sweep over existing presence scores only. Do not
   select or promote a threshold.
6. Write
   [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json`](../validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json)
   with metadata, evidence hashes, split metrics, row-level error tables,
   median-baseline comparisons, threshold-sweep summary, boundary booleans,
   failure classification, and exactly one next action.
7. Update the Mutable Tactical Overlay with the receipt and exactly one next
   action.
8. Write a numbered session log.

## Pass And Stop Gates

The held-out behavior check may select `crop_normalization_ablation_design` only
if all fixed-threshold gates pass:

```text
validation_presence_accuracy >= 0.80
test_presence_accuracy >= 0.80
validation_false_positive_count <= 1
validation_false_negative_count <= 1
test_false_positive_count <= 1
test_false_negative_count <= 1
validation_present_box_mae <= validation_m3ae_aj_median_box_mae
test_present_box_mae <= test_m3ae_aj_median_box_mae
validation_present_box_mean_iou >= validation_m3ae_aj_median_box_mean_iou
test_present_box_mean_iou >= test_m3ae_aj_median_box_mean_iou
row_level_error_table_recorded == true
threshold_sweep_reported_without_selecting_product_threshold == true
no_training_or_export_boundaries_preserved == true
```

The current M3AE-AL summary metrics do not meet these gates. If that pattern
remains, select `detector0_union_target_architecture_remediation`.

Select `detector0_union_target_data_or_schema_remediation` only if the receipt
finds concrete evidence that row labels, split assignment, target presence,
tensor hashes, target boxes, or schema semantics invalidate the held-out
comparison.

Select `stop_reduced_claim` if the only honest continuation requires human
sign/data review, new source approval, Brev spend, generated labels, pretrained
detectors/landmarks, or a weakened product claim.

## Next-Action Choices

Choose exactly one next action in the receipt:

- `crop_normalization_ablation_design`
- `detector0_union_target_architecture_remediation`
- `detector0_union_target_data_or_schema_remediation`
- `stop_reduced_claim`

## Hard Boundaries

- Do not rerun the M3AE-AL microprobe.
- Do not run Detector 0 training or a generic training-smoke retry.
- Do not load image or tensor payloads.
- Do not use Brev for sync, SSH, remote training, or compute.
- Do not stop Brev or create a duplicate worker.
- Do not run crop-normalization ablation in this slice.
- Do not select or promote a new product threshold.
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

1. `GOAL.md` points at this prompt and names Mission 3AE-AN.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid.
4. The held-out behavior check receipt exists at
   [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json`](../validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json)
   and records fixed-threshold validation/test false positives and false
   negatives, row-level table-vs-non-table score behavior, validation/test
   median-baseline comparisons, diagnostic threshold-sweep behavior without
   threshold selection, failure classification, boundary booleans, and exactly
   one next action.
5. The receipt proves no microprobe rerun, training run, image/tensor payload
   load, Brev compute, model artifact export, model-card promotion, product
   threshold promotion, or product claim occurred.
6. The Mutable Tactical Overlay links to the receipt and records exactly one
   next action.
7. A numbered session log records commands, selected signs, source/manifest/
   crop/gate/bootstrap/packet/smoke/remediation/schema/mutation hashes,
   observer-249 API memo path/hash, M3AE-AJ receipt hash, M3AE-AK design hash,
   M3AE-AL microprobe receipt hash, M3AE-AM design artifact path/hash,
   held-out behavior check receipt path/hash, Brev worker status, manual stop
   command `brev stop asl-pilot-rawframe-001`, Brev no-spend boundary, and the
   next action.
8. No microprobe rerun, Detector 0 training, generic training-smoke retry,
   image/tensor payload load, Brev sync/training/spend, crop-normalization
   ablation, recognizer training, packet mutation, row addition, label
   expansion, controlled clip-heldout evaluation, source approval/import,
   unapproved media import, ONNX export, model-card promotion,
   final-readiness claim, broad-run redirect, Brev stop, duplicate Brev worker,
   final-gate weakening, product-runtime code change, threshold promotion,
   pretrained detector/landmark use, generated pseudo-label use, or push
   occurs.

When all eight are true, continue the goal loop according to the receipt's
single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-AN Detector 0 union-target held-out behavior check.
Completed:            <receipt-only check or exact no-spend blocker>.
Evidence:             <receipt path/hash, fixed-threshold FP/FN, median-baseline comparison, no-training/Brev boundaries>.
Remaining:            <single next action from the receipt>.
Blockers:             <none, or exact architecture/schema/provenance blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
