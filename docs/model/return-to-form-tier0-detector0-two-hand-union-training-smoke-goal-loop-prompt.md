# Return-To-Form Tier 0 Detector 0 Two-Hand Union Training Smoke Prompt

Mission 3AE-AG prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run one smallest useful **local, no-spend** scratch Detector 0 training smoke
against the resolved `table_two_hand_union_or_contact_region` target from
M3AE-AF.

This is a training-smoke receipt, not a crop-normalization ablation,
recognizer training run, model export, browser promotion, product claim, or
final-promotion gate. The purpose is to test whether the resolved two-hand
union/contact target is usable enough to justify the next crop-normalization
comparison step while keeping the no-pretrained and source-provenance
boundaries intact.

The smoke must stay local on CPU/MPS. Do not use Brev for sync, SSH training,
remote data transfer, or compute. `brev ls --json` is allowed only as a
read-only status check because the user said they will stop the existing
worker.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-AG.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-AG in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-AF mutation receipt:
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-margin-packet-mutation-v1.json).
5. Current approved Detector 0 packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
6. M3AE-AE schema revision, M3AE-AD remediation, M3AE-AC union packet mutation,
   and M3AE-AB union/contact schema.
7. M3AE-AA expanded-packet smoke, M3AE-Z packet mutation, and M3AE-Y candidate
   review.
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
  docs/validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json \
  docs/validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json \
  docs/validation/return-to-form-tier0-detector0-union-target-remediation-v1.json \
  docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-packet-mutation-v1.json \
  data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json \
  data/manifests/return-to-form-tier0/train.json \
  data/manifests/return-to-form-tier0/validation.json \
  data/manifests/return-to-form-tier0/test.json
test -s docs/validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md
test -s docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-v1.md
test -s artifacts/research/observer-201-localization-strategy-api-response.md
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
   reuse of the existing M3AE-P / M3AE-AA smoke path over broad training
   framework changes.
2. Load only approved packet rows from
   `data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`
   with packet hash
   `6d7079caf7daf7f6675b4c2340b0cb5bc89c90a514103504edba87f4241bb29d`.
3. Consume the resolved `table_two_hand_union_or_contact_region` target as the
   relevant `table` hand/contact target for this smoke. Preserve other existing
   target semantics unless the smoke path documents a bounded local adapter.
4. Train locally on CPU/MPS only for a bounded number of steps or epochs
   sufficient to test the packet/target/loss/metric path. Keep the model
   random-initialized and small.
5. Report train, validation, and test localization metrics, including a
   `table_two_hand_union_or_contact_region` slice and a comparison against the
   retained M3AE-AA expanded-packet smoke where metric definitions allow it.
6. Write
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json)
   with schema version, command, local device, packet hash, split counts, model
   summary, loss/metric summaries, table union/contact metrics, no-pretrained
   boundary checks, Brev no-spend boundary, final-promotion blocker separation,
   and exactly one next action.
7. Update the Mutable Tactical Overlay with the smoke report and exactly one
   next action.
8. Write a numbered session log.

If local execution is infeasible in one reviewable slice, do not use Brev to
force progress. Write a precise blocker report and select a no-spend next
action.

## Next-Action Choices

Choose exactly one next action in the smoke report:

- `crop_normalization_union_target_ablation_design`: use only if the local
  union-target smoke shows the Detector 0 path and `table` union/contact
  behavior are usable enough to design one bounded local fixed-crop versus
  detector-normalized comparison.
- `detector0_two_hand_union_training_smoke_continue`: use when the local smoke
  path is partially built but not yet enough to classify the union target.
- `detector0_union_target_data_or_schema_remediation`: use when the smoke
  exposes a concrete packet, tensor, split, target, or schema issue that should
  be fixed before any ablation.
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
- Do not mutate the Detector 0 packet.
- Do not use MediaPipe, OpenPose, RTMPose, YOLO, pretrained landmarks,
  pretrained detector outputs, pretrained backbones, pretrained embeddings, or
  pretrained-generated labels in the promoted lane.
- Do not export ONNX, promote a model card, or claim final readiness.
- Do not weaken final gates.
- Do not touch product runtime code.
- Do not push or start a broad-run redirect.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AE-AG.
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
   from packet hash
   `6d7079caf7daf7f6675b4c2340b0cb5bc89c90a514103504edba87f4241bb29d`,
   with no source import, no pretrained detector/landmark/feature dependency,
   and no Brev compute.
6. The smoke report exists at
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json)
   and records schema version, command, local device, packet hash, split counts,
   model summary, loss/metric summaries, table union/contact metrics,
   no-pretrained checks, Brev no-spend status, final-promotion
   negative-challenge blocker separation, readiness classification, and exactly
   one next action.
7. The Brev no-spend block records `brev ls --json`, instance type, planned
   remote command `none`, max runtime `0`, max spend `0`, kill condition
   `not_applicable_no_remote_training`, expected metric signal, and
   `human_spend_approval=false`.
8. The Mutable Tactical Overlay links to the smoke report and records exactly
   one next action.
9. A numbered session log records commands, selected signs, manifest/source/
   crop/gate/bootstrap/packet/smoke/remediation/schema/mutation hashes, smoke
   report hash, local device, Brev worker status, manual stop command
   `brev stop asl-pilot-rawframe-001`, Brev no-spend boundary, and the next
   action.
10. No Brev sync/training/spend, crop-normalization ablation, recognizer
    training, label expansion, controlled clip-heldout evaluation, source
    approval, unapproved media import, Detector 0 packet mutation, ONNX export,
    model-card promotion, final-readiness claim, broad-run redirect, Brev stop,
    duplicate Brev worker, final-gate weakening, product-runtime code change,
    pretrained detector/landmark use, or push occurs.

When all ten are true, continue the goal loop according to the smoke report's
single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-AG Detector 0 two-hand union training smoke.
Completed:            <local union-target smoke receipt or exact no-spend blocker>.
Evidence:             <artifact paths, hashes, local device, metrics, readiness status, and audit statuses>.
Remaining:            <single next action from the smoke report>.
Blockers:             <none, or exact local/schema/provenance blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
