# Return-To-Form Tier 0 Crop Normalization Ablation Smoke Goal Loop Prompt

Mission 3AE-S prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Implement and run exactly one bounded **local, no-spend** crop-normalization
ablation smoke using the M3AE-Q design. The smoke compares the retained
fixed-crop path against a detector-normalized candidate on the same Tier 0
labels, manifests, source approvals, tensor paths, and no-pretrained
constraints.

This is a diagnostic smoke, not a final model claim. It may add focused local
helper code and one tracked receipt, but it must not export ONNX, promote a
model card, weaken final gates, expand labels, import media, or use Brev
compute.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-S.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-S in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-Q design:
   [`docs/validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md`](../validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md).
5. M3AE-P Detector 0 smoke:
   [`docs/validation/return-to-form-tier0-detector0-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-training-smoke-v1.json).
6. Current Detector 0 packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
7. M3AE-J/K fixed-crop recognizer evidence.
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
  docs/validation/return-to-form-tier0-remediation-diagnostic.json \
  docs/validation/return-to-form-tier0-tensor-contract.json \
  docs/validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json \
  docs/validation/return-to-form-tier0-detector0-training-smoke-v1.json \
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

Then complete exactly one smoke slice:

1. Preserve the M3AE-Q design as the ablation contract.
2. Add or reuse one focused local helper/script for the smoke.
3. Build detector-normalized tensors only from existing `rgb_regions`
   `full_frame_reference` frames and the 15-row manual/manual-corrected Detector
   0 packet.
4. Compare against the fixed-crop baseline defined in the design, either by
   binding retained M3AE-J metrics or by rerunning the same baseline locally in
   the same smoke command.
5. Report detector localization sanity, transform integrity, fallback counts,
   fixed-crop recognizer metrics, detector-normalized recognizer metrics, gate
   comparisons, and failure classification.
6. Write
   [`docs/validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json`](../validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json)
   with source/design hashes, command, local device, split counts, metrics,
   no-pretrained/source boundaries, Brev no-spend boundary, final-promotion
   blocker separation, readiness classification, and exactly one next action.
7. Update the Mutable Tactical Overlay with the smoke receipt and exactly one
   next action.
8. Write a numbered session log.

If the implementation cannot run in one local no-spend reviewable slice, do not
use Brev to force progress. Record a precise blocker and select the matching
next action.

## Next-Action Choices

Choose exactly one next action in the smoke receipt:

- `crop_normalization_ablation_smoke_continue`: use only if the local smoke is
  partially built but not complete enough to classify.
- `detector0_data_or_target_remediation`: use when the packet, target schema,
  detector train sanity, or detector-normalized tensor transform fails.
- `source_distribution_or_reduced_claim_triage`: use when train sanity passes
  but validation/test remain near random, preserving the M3AE-K source/signer
  distribution blocker.
- `crop_normalization_followup`: use only if the detector-normalized arm meets
  the design gates and justifies one bounded follow-up without changing
  sources, labels, final gates, or product claims.
- `stop_reduced_claim`: use when no bounded no-new-source crop-normalization
  path is justified without human sign/data review, Brev spend, new source
  approval, label expansion, or a changed product claim.

## Hard Boundaries

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
- Do not run more than one ablation-smoke slice.
- Do not push or start a broad-run redirect.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AE-S.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. The smoke follows the M3AE-Q design and consumes only approved packet rows,
   approved Tier 0 manifests, existing tensor paths, and manual/manual-corrected
   box evidence, with no source import, no pretrained detector/landmark/feature
   dependency, no generated pseudo-label source, and no Brev compute.
6. Any focused helper/script is local-only, random-initialized, no-pretrained,
   and bounded to the Tier 0 crop-normalization comparison.
7. The smoke receipt exists at
   [`docs/validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json`](../validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json)
   and records source/design hashes, command, local device, split counts,
   detector localization sanity, transform integrity, fixed-crop versus
   detector-normalized recognizer metrics, fallback rates, no-pretrained/source
   boundaries, Brev no-spend status, final-promotion negative-challenge blocker
   separation, readiness classification, and exactly one next action.
8. The Mutable Tactical Overlay links to the smoke receipt and records exactly
   one next action.
9. A numbered session log records commands, selected signs, manifest/source/
   crop/gate/bootstrap/packet/smoke/design hashes, receipt hash, local device,
   Brev worker status, manual stop command `brev stop asl-pilot-rawframe-001`,
   Brev no-spend boundary, and the next action.
10. No Brev sync/training/spend, label expansion, controlled clip-heldout
   evaluation, source approval, unapproved media import, ONNX export,
   model-card promotion, final-readiness claim, broad-run redirect, Brev stop,
   duplicate Brev worker, final-gate weakening, pretrained detector/landmark
   use, or push occurs.

When all ten are true, continue the goal loop according to the smoke receipt's
single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-S crop-normalization ablation smoke.
Completed:            <local smoke receipt or exact no-spend/local blocker>.
Evidence:             <artifact paths, hashes, local device, metrics, and audit statuses>.
Remaining:            <single next action from the smoke receipt>.
Blockers:             <none, or exact local/Brev/source/data blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
