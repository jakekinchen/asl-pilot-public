# Return-To-Form Tier 0 Detector 0 Optional-Target Support Remediation Goal Loop Prompt

Mission 3AE-W prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Classify the remaining expected-present `table` right/second-hand missed-present
fallback blocker before any packet mutation, Detector 0 retraining, recognizer
training, or ablation rerun.

This is a local, no-spend, read-only remediation triage slice. It may write one
tracked remediation receipt and update the tactical overlay. It must not mutate
the Detector 0 packet, train Detector 0, train the recognizer, rerun the
ablation smoke, import or approve sources, touch product runtime code, use Brev
compute, export ONNX, promote a model card, or claim final readiness.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-W.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-W in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-V policy-aware receipt:
   [`docs/validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json`](../validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json).
5. M3AE-V session log:
   [`docs/session-logs/220-return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke.md`](../session-logs/220-return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke.md).
6. M3AE-U policy artifact:
   [`docs/validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md`](../validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md).
7. M3AE-S ablation smoke receipt:
   [`docs/validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json`](../validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json).
8. M3AE-T remediation receipt:
   [`docs/validation/return-to-form-tier0-detector0-data-target-remediation-v1.json`](../validation/return-to-form-tier0-detector0-data-target-remediation-v1.json).
9. M3AE-Q design:
   [`docs/validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md`](../validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md).
10. Current Detector 0 packet:
    [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
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
jq empty docs/research/return-to-form-tier0-source-coverage.json \
  docs/model/return-to-form-fixed-crop-config.json \
  docs/validation/return-to-form-tier0-gates.json \
  docs/validation/return-to-form-tier0-decode-dataloader.json \
  docs/validation/return-to-form-tier0-remediation-diagnostic.json \
  docs/validation/return-to-form-tier0-tensor-contract.json \
  docs/validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json \
  docs/validation/return-to-form-tier0-detector0-training-smoke-v1.json \
  docs/validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json \
  docs/validation/return-to-form-tier0-detector0-data-target-remediation-v1.json \
  docs/validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json \
  data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json \
  data/manifests/return-to-form-tier0/train.json \
  data/manifests/return-to-form-tier0/validation.json \
  data/manifests/return-to-form-tier0/test.json
test -s docs/validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md
./.venv/bin/python scripts/run_return_to_form_tier0_decode_dataloader.py
./.venv/bin/python scripts/audit_return_to_form_tier0_tensor_contract.py
git diff --check
brev ls --json
```

The user said not to stop `asl-pilot-rawframe-001`; record `brev stop
asl-pilot-rawframe-001` as the manual stop command, but do not run it. Do not
create a duplicate worker. Do not sync to Brev or launch remote training.

Then complete exactly one remediation triage:

1. Preserve M3AE-V as the current blocker source of truth:
   `detector0_optional_target_support_remediation`.
2. Inspect the three `table` rows in the Detector 0 packet with
   `right_or_second_hand` expected present and their manual/corrected box
   provenance.
3. Compare packet support against the M3AE-V expected-present decisions:
   `928` misses across `1104` expected-present decisions, miss rate
   `0.8405797101449275`.
4. Classify whether the blocker is primarily one of:
   packet positive-support scarcity, incorrect/missing table second-hand boxes,
   optional-target schema/threshold policy, retained Detector 0 localization
   weakness, transform/accounting defect, source/signer distribution gap, or
   no bounded path.
5. Write
   [`docs/validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json`](../validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json)
   with source hashes, packet-support evidence, expected-present miss evidence,
   classification, recommendation, boundaries, and exactly one next action.
6. Update the Mutable Tactical Overlay with the remediation receipt and exactly
   one next action.
7. Write a numbered session log.

## Required Receipt Fields

The JSON receipt must include:

- `schema_version`, `mission`, `status`, and `next_action`;
- command/provenance and local-only status;
- source/design/smoke/remediation/policy/policy-aware/packet/manifest hashes;
- selected labels and split counts;
- table-positive packet row ids and provenance states;
- table `right_or_second_hand` present/absent support counts;
- M3AE-V expected-present decision count, miss count, and miss rate;
- root-cause classification and alternatives considered;
- concrete remediation recommendation;
- whether packet expansion, box review, threshold/schema adjustment, transform
  fix, or stop/reduced-claim triage is recommended next;
- no-pretrained/source boundaries;
- Brev no-spend status and manual stop command;
- final-promotion negative-challenge blocker separation.

## Next-Action Choices

Choose exactly one next action in the receipt:

- `detector0_optional_target_support_remediation_continue`: use only if the
  triage could not be completed in one local read-only slice.
- `detector0_table_second_hand_packet_expansion_design`: use when the blocker
  is sparse positive support and the next useful slice is a bounded design for
  adding or selecting more verified `table` right/second-hand rows.
- `detector0_table_second_hand_box_review`: use when the existing three table
  positive rows have suspect or inconsistent second-hand boxes that need a
  focused manual review before any retraining or ablation rerun.
- `detector0_optional_target_threshold_or_schema_revision`: use when the
  evidence points to target definition, presence threshold, or optional-target
  schema rather than packet support scarcity.
- `crop_normalization_transform_or_accounting_bug_fix`: use when the retained
  evidence exposes a concrete transform or fallback-accounting defect.
- `source_distribution_or_reduced_claim_triage`: use when Detector 0 optional
  target support is not the binding blocker and the remaining evidence points
  back to M3AE-K source/signer distribution limits.
- `stop_reduced_claim`: use when no bounded no-new-source remediation is
  justified without human sign/data review, new source approval, Brev spend,
  label expansion, or a changed product claim.

## Hard Boundaries

- Do not mutate the Detector 0 packet.
- Do not train Detector 0.
- Do not train the recognizer.
- Do not rerun the ablation smoke.
- Do not expand labels.
- Do not evaluate the controlled clip-heldout checkpoint.
- Do not import or approve sources.
- Do not use Brev for sync, SSH, remote training, or compute.
- Do not stop Brev or create a duplicate worker.
- Do not touch product runtime code.
- Do not use MediaPipe, OpenPose, RTMPose, YOLO, pretrained landmarks,
  pretrained detector outputs, pretrained backbones, pretrained embeddings, or
  pretrained-generated labels in the promoted lane.
- Do not export ONNX, promote a model card, or claim final readiness.
- Do not weaken final gates.
- Do not push or start a broad-run redirect.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AE-W.
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
   [`docs/validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json`](../validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json)
   and records the required fields above plus exactly one next action.
6. The Mutable Tactical Overlay links to the receipt and records exactly one
   next action.
7. A numbered session log records commands, selected signs,
   manifest/source/crop/gate/bootstrap/packet/smoke/remediation/policy/policy-aware
   hashes, receipt path/hash, Brev worker status, manual stop command
   `brev stop asl-pilot-rawframe-001`, Brev no-spend boundary, and the next
   action.
8. No packet mutation, Detector 0 retraining, recognizer training, ablation
   rerun, label expansion, controlled clip-heldout evaluation, source approval,
   unapproved media import, ONNX export, model-card promotion,
   final-readiness claim, broad-run redirect, Brev stop, duplicate Brev worker,
   final-gate weakening, product-runtime code change, pretrained
   detector/landmark use, or push occurs.

When all eight are true, continue the goal loop according to the receipt's
single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-W Detector 0 optional-target support remediation triage.
Completed:            <receipt path or exact blocker>.
Evidence:             <artifact paths, hashes, table-support accounting, and audit statuses>.
Remaining:            <single next action from the receipt>.
Blockers:             <none, or exact local/Brev/source/data blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
