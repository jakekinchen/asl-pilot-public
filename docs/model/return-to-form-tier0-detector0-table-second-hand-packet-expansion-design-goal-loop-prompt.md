# Return-To-Form Tier 0 Detector 0 Table Second-Hand Packet Expansion Design Goal Loop Prompt

Mission 3AE-X prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Design a bounded expansion path for additional `table` `right_or_second_hand`
packet support from already approved Tier 0 PopSign manifests before any packet
mutation, approved box annotation, Detector 0 retraining, recognizer retraining,
or ablation rerun.

This is a local, no-spend, design-only slice. It may write one tracked design
artifact and update the tactical overlay. It must not mutate the Detector 0
packet, approve boxes, train Detector 0, train the recognizer, rerun the
ablation smoke, import or approve sources, touch product runtime code, use Brev
compute, export ONNX, promote a model card, or claim final readiness.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-X.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-X in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-W remediation receipt:
   [`docs/validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json`](../validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json).
5. M3AE-W session log:
   [`docs/session-logs/222-return-to-form-tier0-detector0-optional-target-support-remediation.md`](../session-logs/222-return-to-form-tier0-detector0-optional-target-support-remediation.md).
6. M3AE-V policy-aware receipt:
   [`docs/validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json`](../validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json).
7. M3AE-U policy artifact:
   [`docs/validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md`](../validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md).
8. Current Detector 0 packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
9. Tier 0 manifests under [`data/manifests/return-to-form-tier0/`](../../data/manifests/return-to-form-tier0/).
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
  docs/validation/return-to-form-tier0-detector0-data-target-remediation-v1.json \
  docs/validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json \
  docs/validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json \
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

Then complete exactly one design slice:

1. Preserve M3AE-W as the current blocker source of truth:
   `packet_positive_support_scarcity`.
2. Define candidate-selection criteria for additional `table`
   `right_or_second_hand` packet rows from approved Tier 0 manifests only.
3. Define split-balance targets that improve support beyond the current one
   positive row per split without expanding labels or importing media.
4. Define manual/manual-corrected review criteria for future rows, including
   visual evidence requirements, box-quality expectations, provenance fields,
   and rejection conditions.
5. Keep M3AE-V expected-present miss accounting (`928/1104`,
   `0.8405797101449275`) as the baseline for later comparison.
6. Write
   [`docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md`](../validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md)
   with source hashes, candidate criteria, split targets, manual-review rules,
   boundaries, and exactly one next action.
7. Update the Mutable Tactical Overlay with the design artifact and exactly one
   next action.
8. Write a numbered session log.

## Required Design Fields

The design artifact must include:

- source/remediation/policy/policy-aware/packet/manifest hashes;
- current support baseline: three reviewed `table` right/second-hand rows and
  928/1104 missed-present decisions;
- candidate selection criteria constrained to approved Tier 0 PopSign manifests;
- split-balance target and minimum support target for train/validation/test;
- manual/manual-corrected review workflow and acceptance/rejection rules;
- explicit statement that candidate rows are not approved annotations yet;
- how later packet mutation, if selected, will preserve provenance and hashes;
- no-pretrained/source boundaries;
- Brev no-spend status and manual stop command;
- final-promotion negative-challenge blocker separation;
- exactly one next action.

## Next-Action Choices

Choose exactly one next action in the design artifact:

- `detector0_table_second_hand_packet_expansion_design_continue`: use only if
  the design could not be completed in one local read-only slice.
- `detector0_table_second_hand_candidate_packet_review`: use when the design is
  complete and the next useful slice is to create or review a bounded candidate
  packet without training or ablation rerun.
- `detector0_table_second_hand_source_frame_triage`: use when the current Tier
  0 manifests do not provide enough visible candidate frames and the next slice
  must classify that source limitation before any packet mutation.
- `detector0_optional_target_threshold_or_schema_revision`: use when the design
  work shows packet expansion is not the right next move and the target
  definition/threshold should be revised instead.
- `stop_reduced_claim`: use when no bounded no-new-source remediation is
  justified without human sign/data review, new source approval, Brev spend,
  label expansion, or a changed product claim.

## Hard Boundaries

- Do not mutate the Detector 0 packet.
- Do not create approved boxes or mark candidates verified/corrected.
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

1. `GOAL.md` points at this prompt and names Mission 3AE-X.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. The design artifact exists at
   [`docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md`](../validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md)
   and records the required fields above plus exactly one next action.
6. The Mutable Tactical Overlay links to the design artifact and records
   exactly one next action.
7. A numbered session log records commands, selected signs,
   manifest/source/crop/gate/bootstrap/packet/smoke/remediation/policy/policy-aware
   hashes, design path/hash, Brev worker status, manual stop command
   `brev stop asl-pilot-rawframe-001`, Brev no-spend boundary, and the next
   action.
8. No packet mutation, approved box annotation, Detector 0 retraining,
   recognizer training, ablation rerun, label expansion, controlled
   clip-heldout evaluation, source approval, unapproved media import, ONNX
   export, model-card promotion, final-readiness claim, broad-run redirect,
   Brev stop, duplicate Brev worker, final-gate weakening, product-runtime code
   change, pretrained detector/landmark use, or push occurs.

When all eight are true, continue the goal loop according to the design
artifact's single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-X Detector 0 table second-hand packet expansion design.
Completed:            <design path or exact blocker>.
Evidence:             <artifact paths, hashes, selection criteria, and audit statuses>.
Remaining:            <single next action from the design>.
Blockers:             <none, or exact local/Brev/source/data blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
