# Return-To-Form Tier 0 Detector 0 Union-Target Median Baseline Diagnostic Prompt

Mission 3AE-AJ prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Write one reproducible **local, no-spend, no-training** diagnostic for the
`table_two_hand_union_or_contact_region` target-local median/mean constant-box
baseline.

M3AE-AI completed row-level instrumentation and one local CPU smoke rerun, but
the scratch MLP still failed to beat a no-training median constant box even on
train rows. The observer-249 API diagnostic says another generic training-smoke
continuation is not justified. This mission establishes the median-box baseline
as a standalone reviewable reference before any future trainable Detector 0
formulation, crop-normalization ablation, or recognizer work.

This is not Detector 0 training, a training-smoke retry, crop-normalization
ablation, recognizer training, model export, product claim, or final-promotion
gate.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-AJ.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-AJ in the Milestone Ladder and Mutable Tactical Overlay.
4. Observer-249 API diagnostic:
   [`artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md`](../../artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md).
5. M3AE-AI smoke-continue receipt:
   [`docs/validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json`](../validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json).
6. M3AE-AI session log:
   [`docs/session-logs/248-return-to-form-tier0-detector0-union-target-training-smoke-continue.md`](../session-logs/248-return-to-form-tier0-detector0-union-target-training-smoke-continue.md).
7. M3AE-AH remediation receipt:
   [`docs/validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json`](../validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json).
8. M3AE-AG smoke receipt:
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json).
9. Current approved Detector 0 packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
10. M3AE-AF margin packet mutation receipt, M3AE-AE schema revision, M3AE-AD
    remediation receipt, M3AE-AC packet mutation receipt, and M3AE-AB schema.
11. Tier 0 manifests under
    [`data/manifests/return-to-form-tier0/`](../../data/manifests/return-to-form-tier0/).
12. Source register:
    [`docs/model/dataset-source-register.json`](dataset-source-register.json).
13. Observer localization memo:
    [`artifacts/research/observer-201-localization-strategy-api-response.md`](../../artifacts/research/observer-201-localization-strategy-api-response.md).

## First Reviewable Slice

Start with read-only checks:

```sh
git status --short --branch
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_loop_premise.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
jq empty docs/validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json \
  docs/validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json \
  docs/validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json \
  docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-packet-mutation-v1.json \
  docs/validation/return-to-form-tier0-detector0-union-target-remediation-v1.json \
  docs/validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json \
  docs/validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json \
  data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json \
  data/manifests/return-to-form-tier0/train.json \
  data/manifests/return-to-form-tier0/validation.json \
  data/manifests/return-to-form-tier0/test.json
test -s docs/validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md
test -s docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-v1.md
test -s artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md
test -s artifacts/research/observer-201-localization-strategy-api-response.md
./.venv/bin/python scripts/run_return_to_form_tier0_decode_dataloader.py
./.venv/bin/python scripts/audit_return_to_form_tier0_tensor_contract.py
git diff --check
brev ls --json
```

The user said not to stop `asl-pilot-rawframe-001`; record `brev stop
asl-pilot-rawframe-001` as the manual stop command, but do not run it. Do not
create a duplicate worker. Do not sync to Brev or launch remote training.

Then complete exactly one no-training diagnostic slice:

1. Preserve M3AE-AI and the observer-249 API diagnostic as the current failure
   evidence.
2. Compute target-local mean and median constant boxes using only present
   `table_two_hand_union_or_contact_region` targets from the train split.
3. Score those train-derived constant boxes on train, validation, and test rows
   without any trainable model, model checkpoint, or gradient update.
4. Record per-split and per-row presence behavior, box MAE, IoU, and absolute
   coordinate errors for present target rows.
5. Compare the baseline metrics directly with M3AE-AG and M3AE-AI, including
   train box MAE and held-out table union/contact presence behavior.
6. State the minimum bar for any future trainable Detector 0 formulation:
   it must beat the train-derived median-box baseline on train before any
   crop-normalization ablation or recognizer training can be considered.
7. Write
   [`docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json`](../validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json)
   with schema version, command, local device, packet/remediation/smoke/schema/
   source hashes, baseline definitions, per-row/per-split metrics, comparisons,
   no-training/no-pretrained/source boundaries, Brev no-spend boundary,
   final-promotion blocker separation, and exactly one next action.
8. Update the Mutable Tactical Overlay with the baseline receipt and exactly one
   next action.
9. Write a numbered session log.

If the diagnostic cannot be reproduced in one reviewable slice, do not run
training to force progress. Write a precise blocker report and select a
no-spend next action.

## Next-Action Choices

Choose exactly one next action in the median-baseline diagnostic receipt:

- `detector0_union_target_architecture_reformulation_design`: use when the
  no-training median-box baseline is reproduced and remains stronger than
  M3AE-AG/M3AE-AI, so the next step must be design-only before any model rerun.
- `detector0_union_target_data_or_schema_remediation`: use when the standalone
  baseline exposes a concrete packet, split, target, tensor, or schema mismatch
  that invalidates the current comparison.
- `stop_reduced_claim`: use when no bounded no-new-source Detector 0 path is
  justified without human sign/data review, Brev spend, new source approval, or
  a changed product claim.

Do not select `detector0_union_target_training_smoke_continue` from this
mission. The observer-249 escalation explicitly blocks another generic
training-smoke continuation until the no-training baseline has been accepted as
the reference bar.

## Hard Boundaries

- Do not run Detector 0 training or a training-smoke retry.
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

1. `GOAL.md` points at this prompt and names Mission 3AE-AJ.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. The median-baseline diagnostic receipt exists at
   [`docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json`](../validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json)
   and records command, local device, packet/remediation/smoke/schema/source
   hashes, train-derived mean and median constant boxes, per-row/per-split MAE
   and IoU, comparison to M3AE-AG and M3AE-AI, no-training/no-pretrained/source
   boundaries, Brev no-spend status, final-promotion blocker separation, and
   exactly one next action.
6. The receipt proves no training run, gradient update, model artifact export,
   or model-card promotion occurred.
7. The Mutable Tactical Overlay links to the median-baseline diagnostic receipt
   and records exactly one next action.
8. A numbered session log records commands, selected signs, source/manifest/
   crop/gate/bootstrap/packet/smoke/remediation/schema/mutation hashes,
   observer-249 API memo path/hash, Brev worker status, manual stop command
   `brev stop asl-pilot-rawframe-001`, Brev no-spend boundary, and the next
   action.
9. No Detector 0 training, training-smoke retry, Brev sync/training/spend,
   crop-normalization ablation, recognizer training, packet mutation, row
   addition, label expansion, controlled clip-heldout evaluation, source
   approval/import, unapproved media import, ONNX export, model-card promotion,
   final-readiness claim, broad-run redirect, Brev stop, duplicate Brev worker,
   final-gate weakening, product-runtime code change, pretrained
   detector/landmark use, generated pseudo-label use, or push occurs.

When all nine are true, continue the goal loop according to the
median-baseline diagnostic receipt's single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-AJ Detector 0 union-target median-box baseline diagnostic.
Completed:            <median-baseline diagnostic receipt or exact no-spend blocker>.
Evidence:             <artifact paths, hashes, baseline metrics, M3AE-AG/AH/AI comparison, no-training status>.
Remaining:            <single next action from the median-baseline diagnostic receipt>.
Blockers:             <none, or exact baseline/schema/provenance blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
