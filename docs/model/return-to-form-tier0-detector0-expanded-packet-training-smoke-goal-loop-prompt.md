# Return-To-Form Tier 0 Detector 0 Expanded Packet Training Smoke Goal Loop Prompt

Mission 3AE-AA prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run one smallest useful **local, no-spend** scratch Detector 0 training smoke
against the expanded 32-row Detector 0 packet from M3AE-Z.

This is a training-smoke receipt, not a crop-normalization ablation, recognizer
training run, model export, product claim, or final promotion. The purpose is
to test whether the M3AE-Z packet mutation improves `table`
`right_or_second_hand` localization enough to justify the next
crop-normalization step, while preserving the M3AE-Z target-schema warning:
independent left/right boxes are only smoke-usable, and a two-hand
union/contact-region schema revision remains the preferred fallback if the
expanded smoke fails or shows ambiguous second-hand behavior.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-AA.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-AA in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-Z packet mutation receipt:
   [`docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json).
5. Expanded approved Detector 0 packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
6. M3AE-Y candidate-review artifact and M3AE-X packet-expansion design.
7. M3AE-W remediation, M3AE-V policy-aware receipt, and M3AE-U optional-target
   policy.
8. M3AE-P Detector 0 15-row training smoke and M3AE-Q/S crop-normalization
   ablation evidence.
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
  docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json \
  data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json \
  data/manifests/return-to-form-tier0/train.json \
  data/manifests/return-to-form-tier0/validation.json \
  data/manifests/return-to-form-tier0/test.json
test -s docs/validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md
test -s docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md
test -s docs/validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md
./.venv/bin/python scripts/run_return_to_form_tier0_decode_dataloader.py
./.venv/bin/python scripts/audit_return_to_form_tier0_tensor_contract.py
git diff --check
brev ls --json
```

The user said not to stop `asl-pilot-rawframe-001`; record `brev stop
asl-pilot-rawframe-001` as the manual stop command, but do not run it. Do not
create a duplicate worker. Do not sync to Brev or launch remote training.

Then complete exactly one local smoke slice:

1. Build or reuse the smallest scratch Detector 0 smoke path. Prefer focused
   reuse of the existing M3AE-P smoke path over broad training-framework
   changes.
2. Load only approved packet rows from
   `data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`
   with packet hash
   `b7278f433010c9bfda7a5e8535572a31978162d5429fd3f2968d51ebb5a5e5ec`.
3. Train locally on CPU/MPS only for a bounded number of steps or epochs
   sufficient to test the expanded packet target/loss/metric path. Keep the
   model random-initialized and small.
4. Report train, validation, and test localization metrics, including a
   `table` `right_or_second_hand` slice and a comparison against the retained
   M3AE-P 15-row smoke where the metric definitions allow it.
5. Interpret the result against the M3AE-Z `target_schema_assessment`. Do not
   treat a small local smoke pass as final promotion evidence. If independent
   left/right boxes fail or remain ambiguous for overlapping `table` hands,
   select a schema-revision next action rather than forcing a broader run.
6. Write
   [`docs/validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json)
   with schema version, command, local device, packet hash, split counts, model
   summary, loss/metric summaries, table right/second-hand metrics, M3AE-Z
   schema-risk interpretation, no-pretrained boundary checks, Brev no-spend
   boundary, final-promotion blocker separation, and exactly one next action.
7. Update the Mutable Tactical Overlay with the smoke report and exactly one
   next action.
8. Write a numbered session log.

If local execution is infeasible in one reviewable slice, do not use Brev to
force progress. Write a precise blocker report and select a no-spend next
action.

## Next-Action Choices

Choose exactly one next action in the smoke report:

- `crop_normalization_expanded_packet_ablation_smoke`: use only if the local
  expanded-packet smoke shows the Detector 0 path and `table`
  `right_or_second_hand` behavior are usable enough to justify one bounded
  local no-spend crop-normalization comparison rerun.
- `detector0_two_hand_union_schema_revision`: use when independent
  left/right boxes are not honest enough for overlapping `table` hands and the
  next slice should define a two-hand union/contact-region target before more
  training.
- `detector0_expanded_packet_training_smoke_continue`: use when the local smoke
  path is partially built but not yet enough to classify the expanded packet.
- `detector0_data_or_target_remediation`: use when the smoke exposes a concrete
  packet, tensor, split, or target issue that should be fixed before any
  ablation.
- `stop_reduced_claim`: use when no bounded no-new-source Detector 0 path is
  justified without human sign/data review, Brev spend, new source approval, or
  a changed product claim.

## Hard Boundaries

- Do not use Brev for sync, SSH, remote training, or compute.
- Do not stop Brev or create a duplicate worker.
- Do not run crop-normalization ablation in this slice.
- Do not run recognizer training.
- Do not run another classifier microprobe or broad smoke.
- Do not expand labels.
- Do not evaluate the controlled clip-heldout checkpoint.
- Do not import or approve sources.
- Do not use MediaPipe, OpenPose, RTMPose, YOLO, pretrained landmarks,
  pretrained detector outputs, pretrained backbones, pretrained embeddings, or
  pretrained-generated labels in the promoted lane.
- Do not export ONNX, promote a model card, or claim final readiness.
- Do not weaken final gates.
- Do not touch product runtime code.
- Do not push or start a broad-run redirect.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AE-AA.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. The local smoke consumes only approved packet rows and existing tensor paths
   from the expanded packet hash
   `b7278f433010c9bfda7a5e8535572a31978162d5429fd3f2968d51ebb5a5e5ec`,
   with no source import, no pretrained detector/landmark/feature dependency,
   and no Brev compute.
6. The smoke report exists at
   [`docs/validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json)
   and records schema version, command, local device, packet hash, split counts,
   model summary, loss/metric summaries, table right/second-hand metrics,
   M3AE-Z schema-risk interpretation, no-pretrained checks, Brev no-spend
   status, final-promotion negative-challenge blocker separation, readiness
   classification, and exactly one next action.
7. The Brev no-spend block records `brev ls --json`, instance type, planned
   remote command `none`, max runtime `0`, max spend `0`, kill condition
   `not_applicable_no_remote_training`, expected metric signal, and
   `human_spend_approval=false`.
8. The Mutable Tactical Overlay links to the smoke report and records exactly
   one next action.
9. A numbered session log records commands, selected signs, manifest/source/
   crop/gate/bootstrap/packet/smoke/remediation/policy/policy-aware/design/
   candidate-review/mutation hashes, smoke report hash, local device, Brev
   worker status, manual stop command `brev stop asl-pilot-rawframe-001`, Brev
   no-spend boundary, and the next action.
10. No Brev sync/training/spend, crop-normalization ablation, recognizer
    training, label expansion, controlled clip-heldout evaluation, source
    approval, unapproved media import, ONNX export, model-card promotion,
    final-readiness claim, broad-run redirect, Brev stop, duplicate Brev
    worker, final-gate weakening, product-runtime code change, pretrained
    detector/landmark use, or push occurs.

When all ten are true, continue the goal loop according to the smoke report's
single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-AA Detector 0 expanded packet training smoke.
Completed:            <local expanded-packet smoke receipt or exact no-spend blocker>.
Evidence:             <artifact paths, hashes, local device, metrics, schema-risk status, and audit statuses>.
Remaining:            <single next action from the smoke report>.
Blockers:             <none, or exact local/schema/provenance blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
