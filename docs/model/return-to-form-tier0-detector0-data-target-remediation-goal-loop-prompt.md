# Return-To-Form Tier 0 Detector 0 Data/Target Remediation Goal Loop Prompt

Mission 3AE-T prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Diagnose the M3AE-S `right_or_second_hand` fallback-gate failure before any
ablation rerun, Detector 0 retraining, recognizer training, or packet mutation.

This is a local, no-spend remediation triage slice. It must classify whether
the failure is caused by Detector 0 packet target support, target
schema/optional-target semantics, presence threshold or fallback policy,
transform accounting, or by the absence of a bounded no-new-source path. It
must write one tracked remediation receipt with exactly one next action.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-T.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-T in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-S smoke receipt:
   [`docs/validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json`](../validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json).
5. M3AE-S session log:
   [`docs/session-logs/214-return-to-form-tier0-crop-normalization-ablation-smoke.md`](../session-logs/214-return-to-form-tier0-crop-normalization-ablation-smoke.md).
6. Current Detector 0 packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
7. M3AE-Q design:
   [`docs/validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md`](../validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md).
8. M3AE-P Detector 0 smoke:
   [`docs/validation/return-to-form-tier0-detector0-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-training-smoke-v1.json).
9. M3AE-L bootstrap:
   [`docs/validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json`](../validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json).
10. Source register:
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
jq empty docs/research/return-to-form-tier0-source-coverage.json \
  docs/model/return-to-form-fixed-crop-config.json \
  docs/validation/return-to-form-tier0-gates.json \
  docs/validation/return-to-form-tier0-decode-dataloader.json \
  docs/validation/return-to-form-tier0-remediation-diagnostic.json \
  docs/validation/return-to-form-tier0-tensor-contract.json \
  docs/validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json \
  docs/validation/return-to-form-tier0-detector0-training-smoke-v1.json \
  docs/validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json \
  data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json \
  data/manifests/return-to-form-tier0/train.json \
  data/manifests/return-to-form-tier0/validation.json \
  data/manifests/return-to-form-tier0/test.json
./.venv/bin/python scripts/run_return_to_form_tier0_decode_dataloader.py
./.venv/bin/python scripts/audit_return_to_form_tier0_tensor_contract.py
git diff --check
brev ls --json
```

The user said not to stop `asl-pilot-rawframe-001`; record `brev stop
asl-pilot-rawframe-001` as the manual stop command, but do not run it. Do not
create a duplicate worker. Do not sync to Brev or launch remote training.

Then complete exactly one remediation triage slice:

1. Preserve the M3AE-S smoke receipt as the failure source of truth.
2. Inspect `gate_classifications.fallback_rate_gate` and
   `transform_integrity.summary` in the M3AE-S receipt.
3. Compare fallback counts by target, reason, split, and label against the
   Detector 0 packet's target presence/support for `right_or_second_hand`.
4. Check whether high fallback is concentrated in `below_presence_threshold`,
   absent-target rows, optional second-hand semantics, one-label patterns, or a
   transform/accounting bug.
5. Do not rerun the ablation smoke or any Detector 0/recognizer training.
6. Do not mutate
   `data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`
   in this slice. If packet edits are needed, select that as the next action.
7. Write
   [`docs/validation/return-to-form-tier0-detector0-data-target-remediation-v1.json`](../validation/return-to-form-tier0-detector0-data-target-remediation-v1.json)
   with source/smoke/packet hashes, target-support counts, fallback accounting,
   root-cause classification, no-pretrained/source boundaries, Brev no-spend
   boundary, final-promotion blocker separation, and exactly one next action.
8. Update the Mutable Tactical Overlay with the remediation receipt and exactly
   one next action.
9. Write a numbered session log.

## Next-Action Choices

Choose exactly one next action in the remediation receipt:

- `detector0_data_target_remediation_continue`: use only if the triage could
  not fully classify the failure in one local read-only slice.
- `detector0_packet_target_support_remediation`: use when the verified packet
  lacks enough right/second-hand present targets, needs more manual rows, or
  has target labels that must be corrected before another ablation.
- `crop_normalization_optional_target_policy_revision`: use when the
  right/second-hand target is legitimately optional for many Tier 0 clips and
  the fallback gate or transform policy is counting valid absence as failure.
- `crop_normalization_transform_bug_fix`: use when the retained transform
  fallback accounting or tensor generation is inconsistent with packet targets,
  manifests, or source tensor evidence.
- `crop_normalization_ablation_smoke_rerun_after_remediation`: use only if the
  triage proves no data/schema/policy change is required and a rerun is the
  smallest justified next check.
- `stop_reduced_claim`: use when no bounded no-new-source remediation is
  justified without human sign/data review, new source approval, Brev spend,
  label expansion, or a changed product claim.

## Hard Boundaries

- Do not rerun the M3AE-S ablation smoke.
- Do not run Detector 0 training or recognizer training.
- Do not mutate the Detector 0 packet in this slice.
- Do not use Brev for sync, SSH, remote training, or compute.
- Do not stop Brev or create a duplicate worker.
- Do not expand labels.
- Do not evaluate the controlled clip-heldout checkpoint.
- Do not import or approve sources.
- Do not use MediaPipe, OpenPose, RTMPose, YOLO, pretrained landmarks,
  pretrained detector outputs, pretrained backbones, pretrained embeddings, or
  pretrained-generated labels in the promoted lane.
- Do not export ONNX, promote a model card, or claim final readiness.
- Do not weaken final gates.
- Do not push or start a broad-run redirect.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AE-T.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. The remediation receipt exists at
   [`docs/validation/return-to-form-tier0-detector0-data-target-remediation-v1.json`](../validation/return-to-form-tier0-detector0-data-target-remediation-v1.json)
   and records source/smoke/packet hashes, target-support counts, fallback
   counts/rates by target/reason/split/label, root-cause classification,
   no-pretrained/source boundaries, Brev no-spend status, final-promotion
   blocker separation, and exactly one next action.
6. The Mutable Tactical Overlay links to the remediation receipt and records
   exactly one next action.
7. A numbered session log records commands, selected signs,
   manifest/source/crop/gate/bootstrap/packet/smoke hashes, remediation
   receipt path/hash, Brev worker status, manual stop command
   `brev stop asl-pilot-rawframe-001`, Brev no-spend boundary, and the next
   action.
8. No ablation rerun, Detector 0 training, recognizer training, packet
   mutation, Brev sync/training/spend, label expansion, controlled
   clip-heldout evaluation, source approval, unapproved media import, ONNX
   export, model-card promotion, final-readiness claim, broad-run redirect,
   Brev stop, duplicate Brev worker, final-gate weakening, pretrained
   detector/landmark use, or push occurs.

When all eight are true, continue the goal loop according to the remediation
receipt's single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-T Detector 0 data/target remediation triage.
Completed:            <remediation receipt or exact blocker>.
Evidence:             <artifact paths, hashes, fallback accounting, and audit statuses>.
Remaining:            <single next action from the remediation receipt>.
Blockers:             <none, or exact local/Brev/source/data blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
