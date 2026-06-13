# Return-To-Form Tier 0 Detector 0 Annotation Review Goal Loop Prompt

Mission 3AE-N prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Review or correct the first Detector 0 localization seed packet for the
selected Tier 0 labels:

- `please`
- `table`
- `dad`
- `grandpa`
- `hat`

This slice is annotation review/provenance only. It may update review status,
reviewer fields, notes, and target boxes in
[`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json)
only when a row is actually checked against retained visual evidence. Do not
train Detector 0 or the recognizer, and do not run a crop-normalization
ablation in this slice.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-N.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-N in the Milestone Ladder and the Mutable Tactical Overlay.
4. M3AE-M annotation packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
5. M3AE-M packet review:
   [`docs/validation/return-to-form-tier0-detector0-annotation-packet-v0-review.md`](../validation/return-to-form-tier0-detector0-annotation-packet-v0-review.md).
6. M3AE-L bootstrap report:
   [`docs/validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json`](../validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json).
7. M3AE-K label/split remediation and M3AE-J smoke reports.
8. M3AC/M3AD fixed-crop, gate, source, manifest, and dataloader artifacts.
9. Source register:
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
  docs/validation/return-to-form-tier0-learnability-smoke.json \
  docs/validation/return-to-form-tier0-remediation-diagnostic.json \
  docs/validation/return-to-form-tier0-tensor-contract.json \
  docs/validation/return-to-form-tier0-learnability-smoke-rerun.json \
  docs/validation/return-to-form-tier0-failure-remediation-triage.json \
  docs/validation/return-to-form-tier0-model-architecture-microprobe.json \
  docs/validation/return-to-form-tier0-microprobe-config-smoke.json \
  docs/validation/return-to-form-tier0-label-split-remediation.json \
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

Then complete exactly one annotation-review slice:

1. Inspect the 15 `frame_rows` in the packet and their retained visual evidence
   or tensor frame references.
2. Verify or correct seed boxes only when the visual evidence supports the
   change. Preserve stable `row_id`, `clip_id`, split, source, signer, tensor,
   and frame provenance.
3. For each reviewed row, set reviewer fields and one review status:
   `manual_verified`, `manual_corrected`, `needs_manual_verification`, or
   `rejected_for_insufficient_visual_evidence`.
4. Keep label sources no-pretrained: allowed values remain
   `project_manual_box_label` and `manual_verified_from_fixed_crop_context`.
   Do not use generated detector, landmark, or pose labels.
5. Write
   [`docs/validation/return-to-form-tier0-detector0-annotation-review-v1.md`](../validation/return-to-form-tier0-detector0-annotation-review-v1.md)
   with row counts, corrected/rejected counts, evidence inspected, packet hash
   before/after, no-pretrained boundary checks, ready/not-ready classification,
   Brev status, final-promotion blocker separation, and exactly one next action.
6. Update the Mutable Tactical Overlay with the review report and exactly one
   next action.
7. Write a numbered session log.

## Next-Action Choices

Choose exactly one next action in the review report:

- `detector0_annotation_review_continue`: use when some rows were checked but
  more manual verification/correction is required before training.
- `detector0_training_smoke`: use only if enough rows are manual-verified or
  manually corrected across train and held-out validation/test to run a tiny
  scratch Detector 0 smoke without source approval, pretrained labels, or new
  media.
- `source_distribution_before_detector`: use only if review proves the current
  seed packet cannot support localization coverage without source/signer
  remediation.
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

1. `GOAL.md` points at this prompt and names Mission 3AE-N.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. M3AC/M3AD/M3AE/M3AE-R/M3AE-F/M3AE-G/M3AE-H/M3AE-I/M3AE-J/M3AE-K/M3AE-L/M3AE-M
   artifacts remain valid JSON, and `scripts/run_return_to_form_tier0_decode_dataloader.py`
   still reports `status=passed`, `missing_file_count=0`, and one dataloader
   batch shape per split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. The annotation packet remains valid JSON, preserves row/source/tensor
   provenance, and records review statuses for every checked row.
6. The review report exists at
   [`docs/validation/return-to-form-tier0-detector0-annotation-review-v1.md`](../validation/return-to-form-tier0-detector0-annotation-review-v1.md)
   and records row-by-row status, corrected/rejected counts, packet hash
   before/after, evidence inspected, no-pretrained checks, Brev worker status,
   final-promotion negative-challenge blocker separation, readiness
   classification, and exactly one next action.
7. The Mutable Tactical Overlay links to the review report and records exactly
   one next action.
8. A numbered session log records commands, selected signs, manifest/source/
   crop/gate/bootstrap/packet hashes, review counts, corrected/rejected rows,
   Brev worker status, manual stop command `brev stop asl-pilot-rawframe-001`,
   and the next action.
9. No Detector 0 training, recognizer training, crop-normalization ablation,
   label expansion, controlled clip-heldout evaluation, source approval,
   unapproved media import, ONNX export, model-card promotion,
   final-readiness claim, broad-run redirect, Brev stop, duplicate Brev worker,
   final-gate weakening, pretrained detector/landmark use, or push occurs.

When all nine are true, continue the goal loop according to the review report's
single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-N Detector 0 annotation review.
Completed:            <review/correction evidence or exact blocker>.
Evidence:             <artifact paths, hashes, review counts, corrected/rejected rows, and audit statuses>.
Remaining:            <single next action from the review report>.
Blockers:             <none, or exact review/provenance/data blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
