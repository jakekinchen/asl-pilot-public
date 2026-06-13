# Return-To-Form Tier 0 Detector 0 Two-Hand Union Margin Schema Revision Prompt

Mission 3AE-AE prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Revise the M3AE-AB `table_two_hand_union_or_contact_region` schema semantics
for the fixed-margin width edge case found in M3AE-AD before any packet
correction or union-target Detector 0 smoke.

This is a design-only, local, no-spend schema slice. It may write one schema
revision artifact, update the mutable tactical overlay, and write a numbered
session log. It must not mutate the Detector 0 packet, add rows, run Detector
0 training, rerun crop-normalization ablation, train the recognizer, import or
approve sources, touch product runtime code, use Brev compute, export ONNX,
promote a model card, weaken final gates, or claim final readiness.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-AE.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-AE in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-AD remediation receipt:
   [`docs/validation/return-to-form-tier0-detector0-union-target-remediation-v1.json`](../validation/return-to-form-tier0-detector0-union-target-remediation-v1.json).
5. M3AE-AB schema artifact:
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md`](../validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md).
6. M3AE-AC mutation receipt:
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json).
7. Current approved Detector 0 packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
8. M3AE-AA expanded-packet smoke receipt, M3AE-Z packet mutation receipt, and
   M3AE-Y candidate review.
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
  docs/validation/return-to-form-tier0-detector0-union-target-remediation-v1.json \
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

Then complete exactly one design-only schema revision slice:

1. Preserve the M3AE-AD remediation receipt as the failure source of truth.
2. Analyze whether the fixed `0.02` context margin should be clipped,
   conditionally reduced, evaluated before clipping, or bounded by a revised
   width/area policy for wide but valid reviewed `table` rows.
3. Keep reviewed left/right boxes as derivation evidence only; do not introduce
   generated pseudo-labels or pretrained detector/landmark outputs.
4. Do not mutate the Detector 0 packet in this slice.
5. Do not run Detector 0 training, crop-normalization ablation, recognizer
   training, or broad evaluation.
6. Write
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-v1.md`](../validation/return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-v1.md)
   with the selected margin/threshold semantics, row applicability, how the
   M3AE-AD edge case is handled, no-pretrained/source/Brev boundaries,
   final-promotion blocker separation, and exactly one next action.
7. Update the Mutable Tactical Overlay with the schema revision artifact and
   exactly one next action.
8. Write a numbered session log.

## Next-Action Choices

Choose exactly one next action in the schema revision artifact:

- `detector0_two_hand_union_packet_mutation_continue`: use when the revised
  schema defines a bounded existing-row packet correction before any training.
- `detector0_two_hand_union_schema_revision_continue`: use when the revision
  cannot fully resolve the margin/threshold policy in one design slice.
- `detector0_union_target_packet_support_remediation`: use when the schema is
  sound but the current packet support or row evidence is insufficient.
- `stop_reduced_claim`: use when no bounded no-new-source Detector 0 path is
  justified without human sign/data review, Brev spend, new source approval, or
  a changed product claim.

## Hard Boundaries

- Do not mutate the Detector 0 packet.
- Do not add rows to the Detector 0 packet.
- Do not run Detector 0 training.
- Do not run crop-normalization ablation.
- Do not run recognizer training.
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

1. `GOAL.md` points at this prompt and names Mission 3AE-AE.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. The schema revision artifact exists at
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-v1.md`](../validation/return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-v1.md)
   and records the selected margin/threshold semantics, M3AE-AD edge-case
   handling, no-pretrained/source boundaries, Brev no-spend status,
   final-promotion blocker separation, and exactly one next action.
6. The Mutable Tactical Overlay links to the schema revision artifact and
   records exactly one next action.
7. A numbered session log records commands, selected signs, source/manifest/
   crop/gate/bootstrap/packet/smoke/remediation/schema hashes, Brev worker
   status, manual stop command `brev stop asl-pilot-rawframe-001`, Brev
   no-spend boundary, and the next action.
8. No packet mutation, row addition, Detector 0 training, crop-normalization
   ablation, recognizer training, Brev sync/training/spend, label expansion,
   controlled clip-heldout evaluation, source approval/import, unapproved media
   import, ONNX export, model-card promotion, final-readiness claim, broad-run
   redirect, Brev stop, duplicate Brev worker, final-gate weakening, product
   runtime code change, pretrained detector/landmark use, generated
   pseudo-label use, or push occurs.

When all eight are true, continue the goal loop according to the schema
revision artifact's single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-AE Detector 0 two-hand union margin schema revision.
Completed:            <schema revision artifact or exact blocker>.
Evidence:             <artifact paths, hashes, selected semantics, no-spend status, and audit statuses>.
Remaining:            <single next action from the schema artifact>.
Blockers:             <none, or exact schema/source/data blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
