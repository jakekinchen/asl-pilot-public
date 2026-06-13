# Return-To-Form Tier 0 Detector 0 Annotation Follow-Up Goal Loop Prompt

Mission 3AE-O prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Resolve the one rejected Detector 0 seed row from the M3AE-N packet review:

```text
det0-v0-test-hat-001502-f005
```

The M3AE-N report classified that held-out `hat` row as
`rejected_for_insufficient_visual_evidence`, so the packet is not ready for a
scratch Detector 0 smoke. This slice may replace or independently verify that
single row using only existing approved PopSign Tier 0 evidence. Do not train
Detector 0 or the recognizer, and do not run a crop-normalization ablation.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-O.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-O in the Milestone Ladder and the Mutable Tactical Overlay.
4. M3AE-N review report:
   [`docs/validation/return-to-form-tier0-detector0-annotation-review-v1.md`](../validation/return-to-form-tier0-detector0-annotation-review-v1.md).
5. Current Detector 0 packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
6. M3AE-M packet review and M3AE-L bootstrap report.
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
create a duplicate worker.

Then complete exactly one follow-up slice:

1. Inspect the rejected row and M3AE-N review rationale.
2. Search only existing approved PopSign Tier 0 test-manifest/tensor evidence
   for a usable replacement `hat` test frame, or independently verify the
   rejected frame if retained visual evidence is actually sufficient.
3. Touch only the rejected row unless the follow-up report proves that no
   schema-safe row replacement is possible. Do not mutate the other 14
   reviewed rows.
4. If replacing the row, do not silently reuse the rejected row id for a
   different clip/frame. Record old and new row ids, source record, tensor path,
   frame index, frame hash, and packet hash before/after in the follow-up
   report.
5. Keep label sources no-pretrained: allowed values remain
   `project_manual_box_label` and `manual_verified_from_fixed_crop_context`.
   Do not use generated detector, landmark, or pose labels.
6. Write
   [`docs/validation/return-to-form-tier0-detector0-annotation-followup-v1.md`](../validation/return-to-form-tier0-detector0-annotation-followup-v1.md)
   with rejected-row disposition, packet hash before/after, evidence inspected,
   no-pretrained boundary checks, ready/not-ready classification, Brev status,
   final-promotion blocker separation, and exactly one next action.
7. Update the Mutable Tactical Overlay with the follow-up report and exactly one
   next action.
8. Write a numbered session log.

## Next-Action Choices

Choose exactly one next action in the follow-up report:

- `detector0_training_smoke`: use only if the rejected `hat` test row is
  replaced or independently verified, the packet has usable train/validation/test
  coverage for all five Tier 0 labels, and no source approval, pretrained
  labels, or new media is required.
- `detector0_annotation_review_continue`: use when progress was made but the
  rejected held-out `hat` row still lacks enough approved visual evidence for
  training.
- `source_distribution_before_detector`: use only if approved PopSign Tier 0
  evidence cannot provide held-out `hat` localization coverage without a
  source/signer/distribution remediation step.
- `stop_reduced_claim`: use when no bounded no-new-source Detector 0 path is
  justified without human sign/data review, new source approval, or a changed
  product claim.

## Hard Boundaries

- Do not run Detector 0 training.
- Do not run recognizer training.
- Do not run a crop-normalization ablation.
- Do not run another microprobe or smoke job.
- Do not expand labels.
- Do not evaluate the controlled clip-heldout checkpoint.
- Do not import or approve sources.
- Do not use MediaPipe, OpenPose, RTMPose, YOLO, pretrained landmarks,
  pretrained detector outputs, or pretrained-generated labels in the promoted
  lane.
- Do not export ONNX, promote a model card, or claim final readiness.
- Do not weaken final gates.
- Do not stop Brev, create a duplicate worker, push, or start a broad-run
  redirect.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AE-O.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. The packet remains valid JSON and changes only the rejected held-out `hat`
   row, or the follow-up report documents why no safe replacement/verification
   was possible.
6. The follow-up report exists at
   [`docs/validation/return-to-form-tier0-detector0-annotation-followup-v1.md`](../validation/return-to-form-tier0-detector0-annotation-followup-v1.md)
   and records the rejected-row disposition, packet hash before/after, evidence
   inspected, no-pretrained checks, Brev worker status, final-promotion
   negative-challenge blocker separation, readiness classification, and exactly
   one next action.
7. The Mutable Tactical Overlay links to the follow-up report and records
   exactly one next action.
8. A numbered session log records commands, selected signs, manifest/source/
   crop/gate/bootstrap/packet hashes, rejected-row disposition, evidence
   inspected, Brev worker status, manual stop command
   `brev stop asl-pilot-rawframe-001`, and the next action.
9. No Detector 0 training, recognizer training, crop-normalization ablation,
   label expansion, controlled clip-heldout evaluation, source approval,
   unapproved media import, ONNX export, model-card promotion,
   final-readiness claim, broad-run redirect, Brev stop, duplicate Brev worker,
   final-gate weakening, pretrained detector/landmark use, or push occurs.

When all nine are true, continue the goal loop according to the follow-up
report's single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-O Detector 0 annotation follow-up.
Completed:            <rejected-row replacement/verification evidence or blocker>.
Evidence:             <artifact paths, hashes, rejected-row disposition, and audit statuses>.
Remaining:            <single next action from the follow-up report>.
Blockers:             <none, or exact approved-evidence/source/distribution blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
