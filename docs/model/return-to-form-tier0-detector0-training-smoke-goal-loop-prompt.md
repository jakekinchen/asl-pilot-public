# Return-To-Form Tier 0 Detector 0 Training Smoke Goal Loop Prompt

Mission 3AE-P prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run the smallest useful **local, no-spend** scratch Detector 0 training smoke
against the verified 15-row Tier 0 localization packet. This slice should prove
that the packet, tensor loading path, target encoding, scratch model/loss, and
basic train/eval metric reporting are wired before any crop-normalization
ablation or recognizer training.

The smoke must stay local on CPU/MPS. Do not use Brev for sync, SSH training,
remote data transfer, or compute. `brev ls --json` is allowed only as a
read-only status check because the user said they will stop the existing worker.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-P.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-P in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-O follow-up report:
   [`docs/validation/return-to-form-tier0-detector0-annotation-followup-v1.md`](../validation/return-to-form-tier0-detector0-annotation-followup-v1.md).
5. Current Detector 0 packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
6. M3AE-L bootstrap report and M3AE-M/N/O packet-review artifacts.
7. M3AC/M3AD fixed-crop, gate, source, manifest, and dataloader artifacts.
8. Source register:
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

Then complete exactly one local smoke slice:

1. Build or reuse the smallest scratch Detector 0 smoke path. Prefer a focused
   script/helper over broad training-framework changes.
2. Load only the packet's approved PopSign Tier 0 tensor rows and target boxes.
3. Train locally on CPU/MPS only for a bounded number of steps/epochs sufficient
   to prove the loss/metric path. Keep the model random-initialized and small.
4. Evaluate/report train, validation, and test split losses or localization
   metrics. This is a smoke receipt, not a final model claim.
5. Write
   [`docs/validation/return-to-form-tier0-detector0-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-training-smoke-v1.json)
   with schema version, command, local device, packet hash, split counts,
   model summary, loss/metric summaries, no-pretrained boundary checks, Brev
   no-spend boundary, final-promotion blocker separation, and exactly one next
   action.
6. Update the Mutable Tactical Overlay with the smoke report and exactly one
   next action.
7. Write a numbered session log.

If local execution is infeasible in one reviewable slice, do not use Brev to
force progress. Write a precise blocker report and select a no-spend next
action.

## Next-Action Choices

Choose exactly one next action in the smoke report:

- `crop_normalization_ablation_design`: use only if the local smoke proves the
  packet/model/loss path is usable enough to design the next crop-normalization
  comparison without changing sources or product claims.
- `detector0_training_smoke_continue`: use when the local smoke path is
  partially built but not yet enough to classify readiness.
- `detector0_data_or_target_remediation`: use when the smoke exposes a concrete
  packet/target/tensor issue that should be fixed before any ablation.
- `stop_reduced_claim`: use when no bounded no-new-source Detector 0 path is
  justified without human sign/data review, Brev spend, new source approval, or
  a changed product claim.

## Hard Boundaries

- Do not use Brev for sync, SSH, remote training, or compute.
- Do not stop Brev or create a duplicate worker.
- Do not run recognizer training.
- Do not run crop-normalization ablation.
- Do not run another classifier microprobe or broad smoke.
- Do not expand labels.
- Do not evaluate the controlled clip-heldout checkpoint.
- Do not import or approve sources.
- Do not use MediaPipe, OpenPose, RTMPose, YOLO, pretrained landmarks,
  pretrained detector outputs, pretrained backbones, or pretrained-generated
  labels in the promoted lane.
- Do not export ONNX, promote a model card, or claim final readiness.
- Do not weaken final gates.
- Do not push or start a broad-run redirect.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AE-P.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. The local smoke consumes only approved packet rows and existing tensor paths,
   with no source import, no pretrained detector/landmark/feature dependency,
   and no Brev compute.
6. The smoke report exists at
   [`docs/validation/return-to-form-tier0-detector0-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-training-smoke-v1.json)
   and records schema version, command, local device, packet hash, split counts,
   model summary, loss/metric summaries, no-pretrained checks, Brev no-spend
   status, final-promotion negative-challenge blocker separation, readiness
   classification, and exactly one next action.
7. The Mutable Tactical Overlay links to the smoke report and records exactly
   one next action.
8. A numbered session log records commands, selected signs, manifest/source/
   crop/gate/bootstrap/packet hashes, smoke report hash, local device, Brev
   worker status, manual stop command `brev stop asl-pilot-rawframe-001`, Brev
   no-spend boundary, and the next action.
9. No Brev sync/training/spend, recognizer training, crop-normalization
   ablation, label expansion, controlled clip-heldout evaluation, source
   approval, unapproved media import, ONNX export, model-card promotion,
   final-readiness claim, broad-run redirect, Brev stop, duplicate Brev worker,
   final-gate weakening, pretrained detector/landmark use, or push occurs.

When all nine are true, continue the goal loop according to the smoke report's
single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-P Detector 0 local training smoke.
Completed:            <local smoke receipt or exact no-spend blocker>.
Evidence:             <artifact paths, hashes, local device, metrics, and audit statuses>.
Remaining:            <single next action from the smoke report>.
Blockers:             <none, or exact local/Brev/source/data blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
