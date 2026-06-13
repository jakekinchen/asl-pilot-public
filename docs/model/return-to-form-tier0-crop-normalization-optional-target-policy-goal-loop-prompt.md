# Return-To-Form Tier 0 Crop Normalization Optional-Target Policy Goal Loop Prompt

Mission 3AE-U prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Write one bounded policy revision for crop-normalization fallback accounting so
verified absent optional Detector 0 targets are not counted as transform
failures, while missed present targets remain reportable before any ablation
rerun.

This is a local, no-spend, policy-only slice. It may write one tracked policy
artifact and update the tactical overlay. It must not edit implementation code,
mutate the Detector 0 packet, rerun the ablation smoke, train Detector 0, or
train the recognizer.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-U.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-U in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-T remediation receipt:
   [`docs/validation/return-to-form-tier0-detector0-data-target-remediation-v1.json`](../validation/return-to-form-tier0-detector0-data-target-remediation-v1.json).
5. M3AE-T session log:
   [`docs/session-logs/216-return-to-form-tier0-detector0-data-target-remediation.md`](../session-logs/216-return-to-form-tier0-detector0-data-target-remediation.md).
6. M3AE-S smoke receipt:
   [`docs/validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json`](../validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json).
7. Current Detector 0 packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
8. M3AE-Q design:
   [`docs/validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md`](../validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md).
9. M3AE-P Detector 0 smoke:
   [`docs/validation/return-to-form-tier0-detector0-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-training-smoke-v1.json).
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

Then complete exactly one policy slice:

1. Preserve M3AE-T as the failure classification source of truth:
   `optional_second_hand_target_policy_mismatch`.
2. Define policy-aware fallback accounting for optional targets, including:
   verified absent optional target, predicted absent optional target, missed
   present target, predicted present target with usable box, and malformed or
   source-invalid target.
3. Define which counts affect transform-integrity failure gates and which are
   retained as diagnostic caveats only.
4. Keep real missed-present right/second-hand failures reportable, with a
   clear rate or count cap for future smoke runs.
5. Keep sparse positive support visible: current `right_or_second_hand`
   positive support is 3 of 15 packet rows and table-only.
6. Write
   [`docs/validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md`](../validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md)
   with source/smoke/remediation/packet hashes, policy semantics, gates,
   caveats, no-pretrained/source boundaries, Brev no-spend boundary,
   final-promotion blocker separation, and exactly one next action.
7. Update the Mutable Tactical Overlay with the policy artifact and exactly one
   next action.
8. Write a numbered session log.

## Next-Action Choices

Choose exactly one next action in the policy artifact:

- `crop_normalization_optional_target_policy_continue`: use only if the policy
  could not be completed in one local policy-only slice.
- `crop_normalization_policy_aware_ablation_smoke`: use when the policy is
  clear enough to rerun one bounded local ablation smoke with policy-aware
  fallback accounting and no source/label/final-claim changes.
- `detector0_packet_target_support_remediation`: use when the policy cannot be
  made meaningful without more or corrected right/second-hand positive support.
- `crop_normalization_transform_bug_fix`: use when the policy review exposes a
  concrete transform/accounting bug that must be fixed before any rerun.
- `stop_reduced_claim`: use when no bounded no-new-source crop-normalization
  path is justified without human sign/data review, new source approval, Brev
  spend, label expansion, or a changed product claim.

## Hard Boundaries

- Do not rerun the M3AE-S ablation smoke.
- Do not run Detector 0 training or recognizer training.
- Do not edit implementation code.
- Do not mutate the Detector 0 packet.
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

1. `GOAL.md` points at this prompt and names Mission 3AE-U.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. The policy artifact exists at
   [`docs/validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md`](../validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md)
   and records source/smoke/remediation/packet hashes, optional-target
   semantics, missed-present versus verified-absent accounting, transform-gate
   rules, right/second-hand positive-support caveats, no-pretrained/source
   boundaries, Brev no-spend status, final-promotion blocker separation, and
   exactly one next action.
6. The Mutable Tactical Overlay links to the policy artifact and records
   exactly one next action.
7. A numbered session log records commands, selected signs,
   manifest/source/crop/gate/bootstrap/packet/smoke/remediation hashes, policy
   artifact path/hash, Brev worker status, manual stop command
   `brev stop asl-pilot-rawframe-001`, Brev no-spend boundary, and the next
   action.
8. No ablation rerun, Detector 0 training, recognizer training,
   implementation-code edit, packet mutation, Brev sync/training/spend, label
   expansion, controlled clip-heldout evaluation, source approval, unapproved
   media import, ONNX export, model-card promotion, final-readiness claim,
   broad-run redirect, Brev stop, duplicate Brev worker, final-gate weakening,
   pretrained detector/landmark use, or push occurs.

When all eight are true, continue the goal loop according to the policy
artifact's single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-U crop-normalization optional-target policy revision.
Completed:            <policy artifact or exact blocker>.
Evidence:             <artifact paths, hashes, policy accounting, and audit statuses>.
Remaining:            <single next action from the policy artifact>.
Blockers:             <none, or exact local/Brev/source/data blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
