# Return-To-Form Tier 0 Detector 0 Union-Target Training Smoke Continue Prompt

Mission 3AE-AI prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Repair the local union-target smoke instrumentation or training path identified
by M3AE-AH, then run exactly one bounded **local, no-spend** union-target smoke
against `table_two_hand_union_or_contact_region`.

This is a smoke-path repair and one local rerun. It is not a
crop-normalization ablation, recognizer training run, packet mutation, model
export, product claim, or final-promotion gate. The purpose is to determine
whether the resolved union/contact target can pass train-path sanity once the
smoke records row-level predictions and target-local constant baselines.

The smoke must stay local on CPU/MPS. Do not use Brev for sync, SSH training,
remote data transfer, or compute. `brev ls --json` is allowed only as a
read-only status check because the user said they will stop the existing
worker.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-AI.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-AI in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-AH remediation receipt:
   [`docs/validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json`](../validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json).
5. M3AE-AH session log:
   [`docs/session-logs/246-return-to-form-tier0-detector0-union-target-data-schema-remediation.md`](../session-logs/246-return-to-form-tier0-detector0-union-target-data-schema-remediation.md).
6. M3AE-AG smoke receipt:
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json).
7. Current approved Detector 0 packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
8. M3AE-AF margin packet mutation receipt, M3AE-AE schema revision, M3AE-AD
   remediation receipt, M3AE-AC packet mutation receipt, and M3AE-AB schema.
9. M3AE-AA expanded-packet smoke, M3AE-Z packet mutation, and M3AE-Y candidate
   review.
10. Tier 0 manifests under
    [`data/manifests/return-to-form-tier0/`](../../data/manifests/return-to-form-tier0/).
11. Source register:
    [`docs/model/dataset-source-register.json`](dataset-source-register.json).
12. Observer localization memo:
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
  docs/validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json \
  docs/validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json \
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

Then complete exactly one smoke-continue slice:

1. Preserve the M3AE-AH remediation receipt as the failure-classification source
   of truth.
2. Repair the local union-target smoke path enough to record row-level
   predictions, target-local constant baselines, and per-row/per-split
   error summaries.
3. Before training, compute target-local no-training baselines for present
   `table_two_hand_union_or_contact_region` train rows, including at least
   median constant-box MAE.
4. Run exactly one bounded local CPU/MPS smoke against the current approved
   packet and resolved union/contact target.
5. Report train, validation, and test localization metrics, including a
   `table_two_hand_union_or_contact_region` slice, row-level prediction/error
   summaries, and comparison to M3AE-AG plus the target-local baseline.
6. Write
   [`docs/validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json`](../validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json)
   with schema version, command, local device, packet/remediation/smoke/schema/
   source hashes, model summary, loss/metric summaries, row-level predictions,
   target-local baselines, no-pretrained/source boundaries, Brev no-spend
   boundary, final-promotion blocker separation, and exactly one next action.
7. Update the Mutable Tactical Overlay with the smoke-continue receipt and
   exactly one next action.
8. Write a numbered session log.

If local execution is infeasible in one reviewable slice, do not use Brev to
force progress. Write a precise blocker report and select a no-spend next
action.

## Next-Action Choices

Choose exactly one next action in the smoke-continue receipt:

- `crop_normalization_union_target_ablation_design`: use only if the repaired
  smoke shows the Detector 0 path and `table` union/contact behavior are usable
  enough to design one bounded local fixed-crop versus detector-normalized
  comparison.
- `detector0_union_target_training_smoke_continue`: use when the local smoke
  repair is partially complete but not yet enough to classify the union target.
- `detector0_union_target_data_or_schema_remediation`: use when the repaired
  smoke exposes a concrete packet, tensor, split, target, or schema issue that
  should be fixed before any ablation.
- `stop_reduced_claim`: use when no bounded no-new-source Detector 0 path is
  justified without human sign/data review, Brev spend, new source approval, or
  a changed product claim.

## Hard Boundaries

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

1. `GOAL.md` points at this prompt and names Mission 3AE-AI.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. The smoke-continue receipt exists at
   [`docs/validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json`](../validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json)
   and records command, local device, packet/remediation/smoke/schema/source
   hashes, model summary, loss/metric summaries, row-level predictions,
   target-local baselines, no-pretrained/source boundaries, Brev no-spend
   status, final-promotion blocker separation, and exactly one next action.
6. The receipt proves exactly one local smoke rerun occurred and no model
   artifact was exported or promoted.
7. The Mutable Tactical Overlay links to the smoke-continue receipt and records
   exactly one next action.
8. A numbered session log records commands, selected signs, source/manifest/
   crop/gate/bootstrap/packet/smoke/remediation/schema/mutation hashes, Brev
   worker status, manual stop command `brev stop asl-pilot-rawframe-001`, Brev
   no-spend boundary, and the next action.
9. No Brev sync/training/spend, crop-normalization ablation, recognizer
   training, packet mutation, row addition, label expansion, controlled
   clip-heldout evaluation, source approval/import, unapproved media import,
   ONNX export, model-card promotion, final-readiness claim, broad-run
   redirect, Brev stop, duplicate Brev worker, final-gate weakening,
   product-runtime code change, pretrained detector/landmark use, generated
   pseudo-label use, or push occurs.

When all nine are true, continue the goal loop according to the
smoke-continue receipt's single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-AI Detector 0 union-target smoke instrumentation repair.
Completed:            <smoke-continue receipt or exact no-spend blocker>.
Evidence:             <artifact paths, hashes, metrics, baseline comparison, no-spend status, and audit statuses>.
Remaining:            <single next action from the smoke-continue receipt>.
Blockers:             <none, or exact smoke/path/schema/provenance blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
