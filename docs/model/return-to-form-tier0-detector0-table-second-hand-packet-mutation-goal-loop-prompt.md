# Return-To-Form Tier 0 Detector 0 Table Second-Hand Packet Mutation Goal Loop Prompt

Mission 3AE-Z prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Mutate the approved Detector 0 packet in one bounded, reviewable step by adding
the accepted `table` `right_or_second_hand` candidate rows from M3AE-Y.

This is a local, no-spend packet-data mutation slice. It may edit only the
approved Detector 0 packet, write one mutation receipt, update the tactical
overlay, and write a numbered session log. It must not train Detector 0, train
the recognizer, rerun the crop-normalization ablation, expand labels, import or
approve sources, touch product runtime code, use Brev compute, export ONNX,
promote a model card, weaken final gates, or claim final readiness.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-Z.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-Z in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-Y candidate-review artifact:
   [`docs/validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md`](../validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md).
5. Current approved Detector 0 packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
6. M3AE-X design artifact:
   [`docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md`](../validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md).
7. M3AE-W remediation receipt:
   [`docs/validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json`](../validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json).
8. M3AE-V policy-aware receipt and M3AE-U optional-target policy.
9. Tier 0 manifests under [`data/manifests/return-to-form-tier0/`](../../data/manifests/return-to-form-tier0/).
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
  docs/validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json \
  docs/validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json \
  data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json \
  data/manifests/return-to-form-tier0/train.json \
  data/manifests/return-to-form-tier0/validation.json \
  data/manifests/return-to-form-tier0/test.json
test -s docs/validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md
test -s docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md
test -s docs/validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md
./.venv/bin/python scripts/run_return_to_form_tier0_decode_dataloader.py
./.venv/bin/python scripts/audit_return_to_form_tier0_tensor_contract.py
git diff --check
brev ls --json
```

The user said not to stop `asl-pilot-rawframe-001`; record `brev stop
asl-pilot-rawframe-001` as the manual stop command, but do not run it. Do not
create a duplicate worker. Do not sync to Brev or launch remote training.

Then complete exactly one packet-mutation slice:

1. Record the pre-mutation packet hash.
2. Add only the accepted M3AE-Y candidate rows with status
   `candidate_manual_corrected` or `candidate_manual_verified`. Do not add
   rejected candidates or any row not listed in the M3AE-Y artifact.
3. Convert candidate row ids from `cand-<split>-table-<clip>-f<frame>` to
   stable packet row ids `det0-v0-<split>-table-<clip>-f<frame>`, unless that
   id already exists. If any id collides, stop and choose a continue/rework
   next action instead of inventing a hidden convention.
4. Map `candidate_manual_corrected` to approved packet review status
   `manual_corrected`; map `candidate_manual_verified` to `manual_verified`.
5. Preserve source, split, clip, source record, source video hash, signer hash,
   frame index, timestamp, tensor path, tensor hash, and tensor digest exactly
   from the M3AE-Y candidate-review artifact.
6. Populate `left_or_first_hand` and `right_or_second_hand` targets from the
   candidate boxes. Compute each center as the midpoint of its `xyxy` box and
   use conservative visibility confidence unless the candidate artifact records
   a more specific value.
7. Preserve the full target schema by populating `head_or_face` and
   `upper_body_or_signing_space` using the existing approved `table` packet row
   for the same split as the fixed-crop context anchor. Record this derivation
   in each added row's notes and in the mutation receipt.
8. Update packet `review_summary` counts, target presence counts, and readiness
   text to reflect the expanded table second-hand support, while keeping final
   promotion blockers separate.
9. Write
   [`docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json)
   with pre/post packet hashes, added row ids, counts before/after, source and
   candidate-review hashes, no-pretrained/source boundaries, Brev no-spend
   status, final-promotion blocker separation, and exactly one next action.
10. Update the Mutable Tactical Overlay with the packet mutation receipt and
    exactly one next action.
11. Write a numbered session log.

## Next-Action Choices

Choose exactly one next action in the mutation receipt:

- `detector0_expanded_packet_training_smoke`: use only if the packet mutation
  succeeds, the expanded packet remains valid JSON, all added rows are
  provenance-bound, and the next useful slice is one local no-spend scratch
  Detector 0 training smoke on the expanded packet.
- `detector0_table_second_hand_packet_mutation_continue`: use when mutation
  began but one local slice cannot safely finish the packet update and receipt.
- `detector0_table_second_hand_candidate_review_rework`: use when the M3AE-Y
  candidate artifact is insufficient, ambiguous, or inconsistent with the
  packet schema.
- `detector0_optional_target_threshold_or_schema_revision`: use when packet
  mutation exposes a target schema or optional-target gate mismatch that should
  be revised before training.
- `stop_reduced_claim`: use when no bounded no-new-source remediation is
  justified without human sign/data review, new source approval, Brev spend,
  label expansion, or a changed product claim.

## Hard Boundaries

- Do not train Detector 0.
- Do not train the recognizer.
- Do not rerun the crop-normalization ablation.
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

1. `GOAL.md` points at this prompt and names Mission 3AE-Z.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid before mutation, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. The approved Detector 0 packet is valid JSON after mutation and contains
   only existing rows plus accepted M3AE-Y candidate rows converted to stable
   packet row ids.
6. Packet summary counts are updated and record at least five reviewed `table`
   `right_or_second_hand` positives per split after mutation.
7. The mutation receipt exists at
   [`docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json)
   and records pre/post packet hashes, added row ids, counts before/after,
   candidate-review hash, source boundaries, Brev status, manual stop command,
   final-promotion blocker separation, and exactly one next action.
8. The Mutable Tactical Overlay links to the mutation receipt and records
   exactly one next action.
9. A numbered session log records commands, selected signs, packet hashes,
   added row ids/counts, manifest/source/crop/gate/bootstrap/packet/smoke/
   remediation/policy/policy-aware/design/candidate-review hashes, Brev worker
   status, manual stop command `brev stop asl-pilot-rawframe-001`, and the
   next action.
10. No Detector 0 retraining, recognizer training, ablation rerun, label
    expansion, controlled clip-heldout evaluation, source approval, unapproved
    media import, ONNX export, model-card promotion, final-readiness claim,
    broad-run redirect, Brev stop, duplicate Brev worker, final-gate weakening,
    product-runtime code change, pretrained detector/landmark use, or push
    occurs.

When all ten are true, continue the goal loop according to the mutation
receipt's single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-Z Detector 0 table second-hand packet mutation.
Completed:            <packet mutation receipt or exact blocker>.
Evidence:             <packet hashes, added row ids/counts, target status, and audit statuses>.
Remaining:            <single next action from the mutation receipt>.
Blockers:             <none, or exact local/schema/provenance blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
