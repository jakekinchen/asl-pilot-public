# Return-To-Form Tier 0 Policy-Aware Crop Normalization Ablation Smoke Goal Loop Prompt

Mission 3AE-V prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run one bounded local no-spend fixed-crop versus detector-normalized ablation
smoke using the M3AE-U optional-target fallback policy.

This is a local validation slice. It may add or update one focused local
helper/script for policy-aware fallback accounting and receipt generation. It
must not mutate the Detector 0 packet, expand labels, import or approve sources,
touch product runtime code, use Brev compute, export ONNX, promote a model card,
or claim final readiness.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-V.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-V in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-U policy artifact:
   [`docs/validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md`](../validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md).
5. M3AE-S ablation smoke receipt:
   [`docs/validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json`](../validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json).
6. M3AE-T remediation receipt:
   [`docs/validation/return-to-form-tier0-detector0-data-target-remediation-v1.json`](../validation/return-to-form-tier0-detector0-data-target-remediation-v1.json).
7. M3AE-Q design:
   [`docs/validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md`](../validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md).
8. M3AE-P Detector 0 smoke:
   [`docs/validation/return-to-form-tier0-detector0-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-training-smoke-v1.json).
9. Current Detector 0 packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
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
test -s docs/validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md
./.venv/bin/python scripts/run_return_to_form_tier0_decode_dataloader.py
./.venv/bin/python scripts/audit_return_to_form_tier0_tensor_contract.py
git diff --check
brev ls --json
```

The user said not to stop `asl-pilot-rawframe-001`; record `brev stop
asl-pilot-rawframe-001` as the manual stop command, but do not run it. Do not
create a duplicate worker. Do not sync to Brev or launch remote training.

Then complete exactly one policy-aware ablation smoke:

1. Preserve the M3AE-U policy artifact as the accounting contract.
2. Reuse or update the focused local M3AE-S ablation helper
   [`scripts/run_return_to_form_tier0_crop_norm_ablation_smoke.py`](../../scripts/run_return_to_form_tier0_crop_norm_ablation_smoke.py)
   only as needed to apply policy-aware fallback accounting and write a new
   receipt.
3. Keep raw fallback accounting from M3AE-S visible beside policy-aware
   fallback accounting.
4. Treat verified absent optional `right_or_second_hand` fallback as report-only
   when the packet/support map marks the target expected absent.
5. Treat missed-present optional `right_or_second_hand` fallback as
   gate-affecting when the packet/support map marks the target expected
   present, especially for `table`.
6. Keep required-target fallback accounting unchanged and gate-affecting.
7. Run exactly one local smoke command against the same Tier 0 manifests and
   packet, writing
   [`docs/validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json`](../validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json).
8. Update the Mutable Tactical Overlay with the new receipt and exactly one
   next action.
9. Write a numbered session log.

## Required Receipt Fields

The JSON receipt must include:

- `schema_version`, `mission`, `status`, and `next_action`;
- exact command, local device, script hash, and output path;
- source/design/smoke/remediation/policy/packet/manifest hashes;
- selected labels and split counts;
- raw fallback counts/rates from the M3AE-S-style accounting;
- policy-aware fallback counts/rates;
- verified absent optional-target counts;
- missed present optional-target counts and rates;
- `table` expected-present right/second-hand support and miss rate;
- required-target fallback counts/rates unchanged from the policy;
- fixed-crop baseline recognizer metrics;
- detector-normalized recognizer metrics;
- comparison against M3AE-S and M3AE-Q stop rules;
- no-pretrained/source boundaries, including `pretrained_components: []`;
- Brev no-spend status and manual stop command;
- final-promotion negative-challenge blocker separation.

## Next-Action Choices

Choose exactly one next action in the receipt:

- `policy_aware_crop_normalization_ablation_continue`: use only if the local
  policy-aware smoke could not be completed in one slice and the blocker is
  mechanical, not strategic.
- `detector0_optional_target_support_remediation`: use when policy-aware
  accounting still exposes missed-present optional `right_or_second_hand`
  failures or sparse `table` positive support blocks a fair crop-normalization
  conclusion.
- `crop_normalization_transform_or_accounting_bug_fix`: use when the smoke
  exposes a concrete transform or fallback-accounting bug that must be fixed
  before another comparison.
- `crop_normalization_followup_design`: use only if the policy-aware smoke
  passes the crop-normalization gates and the detector-normalized arm shows a
  bounded, evidence-backed reason for one more local follow-up.
- `source_distribution_or_reduced_claim_triage`: use when the
  crop-normalization mechanics are clean but recognizer validation/test signal
  remains governed by the M3AE-K source/signer distribution gap.
- `stop_reduced_claim`: use when no bounded no-new-source crop-normalization or
  recognition path is justified without human sign/data review, new source
  approval, Brev spend, label expansion, or a changed product claim.

## Hard Boundaries

- Do not mutate the Detector 0 packet.
- Do not train Detector 0 again.
- Do not run more than one policy-aware ablation smoke.
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

1. `GOAL.md` points at this prompt and names Mission 3AE-V.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. If the local helper/script changes, it passes `py_compile`, `git diff
   --check`, and the no-pretrained audits.
6. The receipt exists at
   [`docs/validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json`](../validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json)
   and records the required fields above plus exactly one next action.
7. The Mutable Tactical Overlay links to the receipt and records exactly one
   next action.
8. A numbered session log records commands, selected signs,
   manifest/source/crop/gate/bootstrap/packet/smoke/remediation/policy hashes,
   receipt path/hash, Brev worker status, manual stop command
   `brev stop asl-pilot-rawframe-001`, Brev no-spend boundary, and the next
   action.
9. No packet mutation, Detector 0 retraining, extra smoke run, label expansion,
   controlled clip-heldout evaluation, source approval, unapproved media import,
   ONNX export, model-card promotion, final-readiness claim, broad-run redirect,
   Brev stop, duplicate Brev worker, final-gate weakening, product-runtime code
   change, pretrained detector/landmark use, or push occurs.

When all nine are true, continue the goal loop according to the receipt's
single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-V policy-aware crop-normalization ablation smoke.
Completed:            <receipt path or exact blocker>.
Evidence:             <artifact paths, hashes, policy-aware accounting, and audit statuses>.
Remaining:            <single next action from the receipt>.
Blockers:             <none, or exact local/Brev/source/data blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
