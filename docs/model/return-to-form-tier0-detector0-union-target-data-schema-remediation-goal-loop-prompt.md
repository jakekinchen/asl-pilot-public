# Return-To-Form Tier 0 Detector 0 Union-Target Data/Schema Remediation Prompt

Mission 3AE-AH prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run one smallest useful **local, no-spend** diagnostic for the failed M3AE-AG
`table_two_hand_union_or_contact_region` smoke.

This is a data/schema remediation diagnostic, not a packet mutation, Detector
0 training run, crop-normalization ablation, recognizer training run, model
export, product claim, or final-promotion gate. The purpose is to explain why
the union-target smoke failed train-path localization sanity before any
ablation rerun or recognizer work.

The diagnostic must stay local on CPU/MPS. Do not use Brev for sync, SSH
training, remote data transfer, or compute. `brev ls --json` is allowed only
as a read-only status check because the user said they will stop the existing
worker.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-AH.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-AH in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-AG smoke receipt:
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json).
5. M3AE-AG session log:
   [`docs/session-logs/244-return-to-form-tier0-detector0-two-hand-union-training-smoke.md`](../session-logs/244-return-to-form-tier0-detector0-two-hand-union-training-smoke.md).
6. Current approved Detector 0 packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
7. M3AE-AF margin packet mutation receipt, M3AE-AE schema revision, M3AE-AD
   remediation receipt, M3AE-AC packet mutation receipt, and M3AE-AB schema.
8. M3AE-AA expanded-packet smoke, M3AE-Z packet mutation, and M3AE-Y
   candidate review.
9. Tier 0 manifests under
   [`data/manifests/return-to-form-tier0/`](../../data/manifests/return-to-form-tier0/).
10. Source register:
    [`docs/model/dataset-source-register.json`](dataset-source-register.json).
11. Observer localization memo:
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

Then complete exactly one diagnostic slice:

1. Preserve the M3AE-AG smoke receipt as the failure source of truth.
2. Inspect the current approved packet rows that carry
   `table_two_hand_union_or_contact_region`, including target coordinates,
   frame indices, tensor paths, tensor hashes, split labels, signer hashes, and
   source records.
3. Check whether the smoke consumed the intended packet rows, frame indices,
   tensor payloads, target ids, and normalized `xyxy` target values.
4. Compare the union/contact target geometry against the retained source
   left/right boxes, the M3AE-AE bounded adaptive context-margin semantics, and
   M3AE-AA independent-hand smoke behavior.
5. Classify the failure as exactly one of: packet data issue, tensor/frame
   alignment issue, target schema issue, smoke implementation/instrumentation
   issue, insufficient no-new-source support, or stop/reduced-claim condition.
6. Do not run Detector 0 training, crop-normalization ablation, recognizer
   training, broad evaluation, or another training smoke in this slice.
7. Do not mutate the Detector 0 packet, add rows, approve/import sources, or
   weaken schema/gates in this slice.
8. Write
   [`docs/validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json`](../validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json)
   with schema version, command, packet/smoke/schema/source hashes,
   frame/tensor/target-alignment checks, geometry summary, classification,
   no-pretrained/source boundaries, Brev no-spend boundary, final-promotion
   blocker separation, and exactly one next action.
9. Update the Mutable Tactical Overlay with the remediation receipt and exactly
   one next action.
10. Write a numbered session log.

If local execution is infeasible in one reviewable slice, do not use Brev to
force progress. Write a precise blocker report and select a no-spend next
action.

## Next-Action Choices

Choose exactly one next action in the remediation receipt:

- `detector0_two_hand_union_schema_revision`: use when the smoke failure points
  to union/contact target semantics, margin policy, box geometry, or target
  definition needing a design-only revision before any packet correction,
  ablation, or training.
- `detector0_two_hand_union_packet_mutation_continue`: use when the exact fix
  is bounded to existing packet target metadata and can be completed later
  without row additions, source approval/import, schema weakening, or training.
- `detector0_union_target_training_smoke_continue`: use when the failure is in
  smoke instrumentation or metric plumbing and another bounded local smoke is
  needed after fixing that local path.
- `crop_normalization_union_target_ablation_design`: use only if the diagnostic
  proves the packet, tensor alignment, and schema are coherent enough that the
  M3AE-AG train-path failure is not a data/schema blocker and a future
  fixed-crop versus detector-normalized design is justified. This does not run
  the ablation.
- `stop_reduced_claim`: use when no bounded no-new-source Detector 0 path is
  justified without human sign/data review, Brev spend, new source approval, or
  a changed product claim.

## Hard Boundaries

- Do not run Detector 0 training or another training smoke.
- Do not run crop-normalization ablation.
- Do not run recognizer training.
- Do not mutate the Detector 0 packet.
- Do not add rows.
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

1. `GOAL.md` points at this prompt and names Mission 3AE-AH.
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
   [`docs/validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json`](../validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json)
   and records packet/smoke/schema/source hashes, frame/tensor/target-alignment
   checks, geometry summary, classification, no-pretrained/source boundaries,
   Brev no-spend status, final-promotion blocker separation, and exactly one
   next action.
6. The Mutable Tactical Overlay links to the remediation receipt and records
   exactly one next action.
7. A numbered session log records commands, selected signs, source/manifest/
   crop/gate/bootstrap/packet/smoke/remediation/schema/mutation hashes, Brev
   worker status, manual stop command `brev stop asl-pilot-rawframe-001`, Brev
   no-spend boundary, and the next action.
8. No Detector 0 training, training-smoke rerun, crop-normalization ablation,
   recognizer training, packet mutation, row addition, Brev sync/training/spend,
   label expansion, controlled clip-heldout evaluation, source approval/import,
   unapproved media import, ONNX export, model-card promotion, final-readiness
   claim, broad-run redirect, Brev stop, duplicate Brev worker, final-gate
   weakening, product-runtime code change, pretrained detector/landmark use,
   generated pseudo-label use, or push occurs.

When all eight are true, continue the goal loop according to the remediation
receipt's single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-AH Detector 0 union-target data/schema remediation.
Completed:            <remediation receipt or exact no-spend blocker>.
Evidence:             <artifact paths, hashes, classification, no-spend status, and audit statuses>.
Remaining:            <single next action from the remediation receipt>.
Blockers:             <none, or exact packet/tensor/schema/provenance blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
