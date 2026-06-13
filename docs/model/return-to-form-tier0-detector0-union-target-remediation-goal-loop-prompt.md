# Return-To-Form Tier 0 Detector 0 Union Target Remediation Goal Loop Prompt

Mission 3AE-AD prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Diagnose and remediate the single unresolved M3AE-AC
`table_two_hand_union_or_contact_region` target before any union-target
Detector 0 smoke.

This is a local, no-spend data/target remediation slice. It may inspect the
M3AE-AC mutation receipt, M3AE-AB schema, current approved packet, retained
source evidence, and prior Detector 0 receipts. It must write one remediation
receipt, update the mutable tactical overlay, and write a numbered session
log. It must not run Detector 0 training, rerun a crop-normalization ablation,
train the recognizer, add rows, import or approve sources, touch product
runtime code, use Brev compute, export ONNX, promote a model card, weaken
final gates, or claim final readiness.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-AD.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-AD in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-AC mutation receipt:
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json).
5. M3AE-AC session log:
   [`docs/session-logs/236-return-to-form-tier0-detector0-two-hand-union-packet-mutation.md`](../session-logs/236-return-to-form-tier0-detector0-two-hand-union-packet-mutation.md).
6. M3AE-AB schema artifact:
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md`](../validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md).
7. Expanded approved Detector 0 packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
8. M3AE-AA expanded-packet smoke receipt and M3AE-Z packet mutation receipt.
9. Tier 0 source coverage, fixed-crop config, manifests, and source register.
10. Observer localization memo:
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
  data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json \
  data/manifests/return-to-form-tier0/train.json \
  data/manifests/return-to-form-tier0/validation.json \
  data/manifests/return-to-form-tier0/test.json
test -s docs/validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md
test -s artifacts/research/observer-201-localization-strategy-api-response.md
./.venv/bin/python scripts/run_return_to_form_tier0_decode_dataloader.py
./.venv/bin/python scripts/audit_return_to_form_tier0_tensor_contract.py
git diff --check
brev ls --json
```

The user said not to stop `asl-pilot-rawframe-001`; record `brev stop
asl-pilot-rawframe-001` as the manual stop command, but do not run it. Do not
create a duplicate worker. Do not sync to Brev or launch remote training.

Then complete exactly one remediation slice:

1. Preserve the M3AE-AC mutation receipt as the failure source of truth.
2. Inspect unresolved row `det0-v0-train-table-000376-f010`, its reviewed
   left/right source boxes, the M3AE-AB width threshold, and source evidence
   available in the current repo.
3. Classify whether the unresolved row is a schema-threshold issue, a target
   derivation/provenance issue, a row-quality issue, a packet-support issue, or
   a stop/reduced-claim condition.
4. Do not run Detector 0 training, crop-normalization ablation, recognizer
   training, or broad evaluation.
5. Do not add rows or approve/import sources in this slice.
6. Mutate the Detector 0 packet only if the remediation is a bounded correction
   to existing target metadata for the unresolved row and the receipt proves no
   schema/source boundary changed. Otherwise select the next action that queues
   the needed bounded follow-up.
7. Write
   [`docs/validation/return-to-form-tier0-detector0-union-target-remediation-v1.json`](../validation/return-to-form-tier0-detector0-union-target-remediation-v1.json)
   with source/schema/packet/mutation hashes, unresolved-row analysis,
   classification, any packet correction proof, no-pretrained/source
   boundaries, Brev no-spend status, final-promotion blocker separation, and
   exactly one next action.
8. Update the Mutable Tactical Overlay with the remediation receipt and exactly
   one next action.
9. Write a numbered session log.

## Next-Action Choices

Choose exactly one next action in the remediation receipt:

- `detector0_two_hand_union_training_smoke`: use only if the remediation
  leaves zero unresolved table union/contact targets, preserves the M3AE-AB
  schema, keeps per-split present support at least train 5, validation 5, and
  test 5, and no boundary was violated. This authorizes only a future prompt
  for a local no-spend scratch smoke; it does not run training in this slice.
- `detector0_two_hand_union_packet_mutation_continue`: use when the exact
  resolution is still bounded to existing packet target metadata and can be
  completed without row additions, source approval/import, schema weakening, or
  training.
- `detector0_two_hand_union_schema_revision`: use when the unresolved row shows
  that the M3AE-AB union/contact threshold or target semantics need another
  design-only revision before any packet correction or smoke.
- `detector0_union_target_packet_support_remediation`: use when the current
  approved packet cannot honestly clear the unresolved row and needs a bounded
  candidate-review or replacement-row plan before another mutation.
- `stop_reduced_claim`: use when no bounded no-new-source Detector 0 path is
  justified without human sign/data review, Brev spend, new source approval, or
  a changed product claim.

## Hard Boundaries

- Do not run Detector 0 training.
- Do not run crop-normalization ablation.
- Do not run recognizer training.
- Do not add rows to the Detector 0 packet.
- Do not import or approve sources.
- Do not use generated pseudo-labels.
- Do not use MediaPipe, OpenPose, RTMPose, YOLO, pretrained landmarks,
  pretrained detector outputs, pretrained backbones, pretrained embeddings, or
  pretrained-generated labels in the promoted lane.
- Do not use Brev for sync, SSH, remote training, or compute.
- Do not stop Brev or create a duplicate worker.
- Do not expand labels.
- Do not evaluate the controlled clip-heldout checkpoint.
- Do not export ONNX, promote a model card, or claim final readiness.
- Do not weaken final gates.
- Do not touch product runtime code.
- Do not push or start a broad-run redirect.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AE-AD.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. The remediation receipt exists at
   [`docs/validation/return-to-form-tier0-detector0-union-target-remediation-v1.json`](../validation/return-to-form-tier0-detector0-union-target-remediation-v1.json)
   and records source/schema/packet/mutation hashes, unresolved-row analysis,
   classification, no-pretrained/source boundaries, Brev no-spend status,
   final-promotion blocker separation, and exactly one next action.
6. If the packet is edited, the edit is limited to existing target metadata for
   existing rows and the receipt records pre/post packet hashes, zero row
   additions, no source approval/import, and no schema weakening.
7. The Mutable Tactical Overlay links to the remediation receipt and records
   exactly one next action.
8. A numbered session log records commands, selected signs, source/manifest/
   crop/gate/bootstrap/packet/smoke/remediation/schema/mutation hashes, Brev
   worker status, manual stop command `brev stop asl-pilot-rawframe-001`, Brev
   no-spend boundary, and the next action.
9. No Detector 0 training, crop-normalization ablation, recognizer training,
   row addition, Brev sync/training/spend, label expansion, controlled
   clip-heldout evaluation, source approval/import, unapproved media import,
   ONNX export, model-card promotion, final-readiness claim, broad-run
   redirect, Brev stop, duplicate Brev worker, final-gate weakening, product
   runtime code change, pretrained detector/landmark use, generated
   pseudo-label use, or push occurs.

When all nine are true, continue the goal loop according to the remediation
receipt's single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-AD Detector 0 union target remediation.
Completed:            <remediation receipt or exact blocker>.
Evidence:             <artifact paths, hashes, unresolved-row classification, no-spend status, and audit statuses>.
Remaining:            <single next action from the remediation receipt>.
Blockers:             <none, or exact packet/provenance/schema blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
