# Return-To-Form Tier 0 Detector 0 Two-Hand Union Packet Mutation Continue Prompt

Mission 3AE-AF prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Apply the M3AE-AE bounded adaptive context-margin schema to the existing
approved Detector 0 packet so every current `table` row has a resolved
`table_two_hand_union_or_contact_region` target before any union-target
Detector 0 smoke.

This is a local, no-spend packet-mutation slice. It may mutate only existing
`table_two_hand_union_or_contact_region` target objects in
[`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json),
write one mutation receipt, update the mutable tactical overlay, and write a
numbered session log. It must not add rows, run Detector 0 training, rerun the
crop-normalization ablation, train the recognizer, import or approve sources,
touch product runtime code, use Brev compute, export ONNX, promote a model
card, weaken final gates, or claim final readiness.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-AF.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-AF in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-AE schema revision artifact:
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-v1.md`](../validation/return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-v1.md).
5. M3AE-AD remediation receipt:
   [`docs/validation/return-to-form-tier0-detector0-union-target-remediation-v1.json`](../validation/return-to-form-tier0-detector0-union-target-remediation-v1.json).
6. M3AE-AC mutation receipt:
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json).
7. M3AE-AB union/contact schema artifact:
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md`](../validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md).
8. Current approved Detector 0 packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
9. M3AE-AA expanded-packet smoke receipt, M3AE-Z packet mutation receipt, and
   M3AE-Y candidate review.
10. Tier 0 source coverage, fixed-crop config, manifests, source register, and
    observer localization memo.

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

Then complete exactly one bounded packet-mutation continuation:

1. Preserve the M3AE-AE schema revision as the active derivation policy.
2. Mutate only existing packet rows and only the
   `table_two_hand_union_or_contact_region` target objects.
3. Do not add rows, approve new source boxes, or reinterpret reviewed left/right
   boxes as independent generated labels.
4. Resolve `det0-v0-train-table-000376-f010` using the bounded adaptive
   context-margin semantics unless a current read-only derivation check proves a
   contradiction.
5. Keep non-`table` rows absent by label applicability.
6. Write
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-margin-packet-mutation-v1.json)
   with pre/post packet hashes, schema revision hash, changed target ids,
   effective context margins for reduced-margin rows, unresolved row counts,
   support counts by split, no-pretrained/source/Brev boundaries,
   final-promotion blocker separation, and exactly one next action.
7. Update the Mutable Tactical Overlay with the mutation receipt and exactly one
   next action.
8. Write a numbered session log.

## Next-Action Choices

Choose exactly one next action in the mutation receipt:

- `detector0_two_hand_union_training_smoke`: use only when all existing packet
  rows have resolved union/contact targets under the revised schema, present
  support is at least train 5 / validation 5 / test 5, and no boundary or source
  violation remains.
- `detector0_two_hand_union_packet_mutation_continue`: use when mutation remains
  mechanically incomplete but still bounded to existing rows and approved
  sources.
- `detector0_union_target_packet_support_remediation`: use when packet support
  or row evidence remains insufficient even after the revised schema is applied.
- `detector0_two_hand_union_schema_revision_continue`: use when the M3AE-AE
  schema semantics are internally inconsistent under current packet evidence.
- `stop_reduced_claim`: use when no bounded no-new-source Detector 0 path is
  justified without human sign/data review, Brev spend, new source approval, or
  a changed product claim.

## Hard Boundaries

- Do not add rows to the Detector 0 packet.
- Do not mutate non-union/contact targets except as needed to preserve JSON
  validity around the targeted existing objects.
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

1. `GOAL.md` points at this prompt and names Mission 3AE-AF.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. The approved Detector 0 packet is mutated only for existing
   `table_two_hand_union_or_contact_region` targets under the M3AE-AE bounded
   adaptive context-margin semantics, with no row additions.
6. The mutation receipt exists at
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-margin-packet-mutation-v1.json)
   and records pre/post hashes, changed target ids, effective margins,
   unresolved row counts, split support, no-pretrained/source boundaries, Brev
   no-spend status, final-promotion blocker separation, and exactly one next
   action.
7. The Mutable Tactical Overlay links to the mutation receipt and records
   exactly one next action.
8. A numbered session log records commands, selected signs, source/manifest/
   crop/gate/bootstrap/packet/smoke/remediation/schema hashes, Brev worker
   status, manual stop command `brev stop asl-pilot-rawframe-001`, Brev
   no-spend boundary, and the next action.
9. No row addition, Detector 0 training, crop-normalization ablation, recognizer
   training, Brev sync/training/spend, label expansion, controlled clip-heldout
   evaluation, source approval/import, unapproved media import, ONNX export,
   model-card promotion, final-readiness claim, broad-run redirect, Brev stop,
   duplicate Brev worker, final-gate weakening, product runtime code change,
   pretrained detector/landmark use, generated pseudo-label use, or push occurs.

When all nine are true, continue the goal loop according to the mutation
receipt's single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-AF Detector 0 two-hand union packet mutation continue.
Completed:            <mutation receipt or exact blocker>.
Evidence:             <artifact paths, hashes, changed target ids, support counts, no-spend status, and audit statuses>.
Remaining:            <single next action from the mutation receipt>.
Blockers:             <none, or exact schema/source/data blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
