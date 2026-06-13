# Return-To-Form Tier 0 Detector 0 Table Second-Hand Candidate Packet Review Goal Loop Prompt

Mission 3AE-Y prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Create and review one bounded candidate packet for additional `table`
`right_or_second_hand` support from already approved Tier 0 PopSign manifests.

This is a local, no-spend, candidate-review slice. It may write one tracked
candidate-review artifact and a numbered session log. It must not mutate the
approved Detector 0 packet, mark candidates as approved packet annotations,
train Detector 0, train the recognizer, rerun the crop-normalization ablation,
import or approve sources, touch product runtime code, use Brev compute, export
ONNX, promote a model card, weaken final gates, or claim final readiness.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-Y.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-Y in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-X design artifact:
   [`docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md`](../validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md).
5. M3AE-W remediation receipt:
   [`docs/validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json`](../validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json).
6. M3AE-V policy-aware receipt:
   [`docs/validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json`](../validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json).
7. M3AE-U optional-target policy:
   [`docs/validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md`](../validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md).
8. Current approved Detector 0 packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
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
./.venv/bin/python scripts/run_return_to_form_tier0_decode_dataloader.py
./.venv/bin/python scripts/audit_return_to_form_tier0_tensor_contract.py
git diff --check
brev ls --json
```

The user said not to stop `asl-pilot-rawframe-001`; record `brev stop
asl-pilot-rawframe-001` as the manual stop command, but do not run it. Do not
create a duplicate worker. Do not sync to Brev or launch remote training.

Then complete exactly one candidate-review slice:

1. Preserve the approved Detector 0 packet unchanged and record its pre/post
   hash to prove no packet mutation occurred.
2. Use only approved Tier 0 PopSign `table` manifest rows, existing tensor
   paths, `full_frame_reference` evidence, and retained contact-sheet evidence.
3. Exclude the three current reviewed packet-positive `table`
   `right_or_second_hand` rows except as non-mutating anchors.
4. Review up to six new candidate rows per split. Prefer signer/source-record
   diversity before repeated signer hashes, especially in validation and test.
5. For each candidate, record split, clip id, source record id, source video
   hash, signer identity hash, frame index, timestamp, tensor path, tensor file
   hash, tensor digest hash, source register hash, evidence inspected,
   candidate `left_hand` box, candidate `right_or_second_hand` box, and one
   candidate-review status.
6. Candidate-review statuses must be candidate-scoped, not approved packet
   statuses: `candidate_manual_verified`, `candidate_manual_corrected`,
   `candidate_rejected_for_insufficient_visual_evidence`,
   `candidate_rejected_for_ambiguous_hand_identity`,
   `candidate_rejected_for_missing_provenance`, or
   `candidate_rejected_for_duplicate_packet_row`.
7. Keep M3AE-V's `928/1104` expected-present miss baseline and M3AE-X's target
   of at least five total reviewed positives per split as the comparison point
   for the next action.
8. Write
   [`docs/validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md`](../validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md)
   with source/design/policy/policy-aware/packet/manifest hashes, reviewed
   candidate rows, accepted/rejected counts by split, target status, boundaries,
   and exactly one next action.
9. Update the Mutable Tactical Overlay with the candidate-review artifact and
   exactly one next action.
10. Write a numbered session log.

## Next-Action Choices

Choose exactly one next action in the candidate-review artifact:

- `detector0_table_second_hand_packet_mutation`: use only if the review has at
  least five total candidate-or-existing reviewed positives in train,
  validation, and test, and the next useful slice is to mutate the approved
  Detector 0 packet in a separate committed step.
- `detector0_table_second_hand_candidate_packet_review_continue`: use when
  candidate review started but the bounded local review is incomplete.
- `detector0_table_second_hand_source_frame_triage`: use when current approved
  Tier 0 manifests do not provide enough visible candidate frames in any split
  to reach at least five total reviewed positives per split.
- `detector0_optional_target_threshold_or_schema_revision`: use when review
  evidence shows packet expansion is not the right next move and the optional
  target definition, threshold, or gate should be revised instead.
- `stop_reduced_claim`: use when no bounded no-new-source remediation is
  justified without human sign/data review, new source approval, Brev spend,
  label expansion, or a changed product claim.

## Hard Boundaries

- Do not mutate `data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`.
- Do not mark candidates as approved annotations.
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

1. `GOAL.md` points at this prompt and names Mission 3AE-Y.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. The approved Detector 0 packet hash is unchanged before and after the slice.
6. The candidate-review artifact exists at
   [`docs/validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md`](../validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md)
   and records candidate rows, evidence inspected, candidate-review statuses,
   accepted/rejected counts by split, packet unchanged proof, M3AE-V baseline,
   M3AE-X target status, no-pretrained/source boundaries, Brev status, manual
   stop command, final-promotion blocker separation, and exactly one next
   action.
7. The Mutable Tactical Overlay links to the candidate-review artifact and
   records exactly one next action.
8. A numbered session log records commands, selected signs, manifest/source/
   crop/gate/bootstrap/packet/smoke/remediation/policy/policy-aware/design
   hashes, candidate-review artifact path/hash, accepted/rejected counts, Brev
   worker status, manual stop command `brev stop asl-pilot-rawframe-001`, and
   the next action.
9. No approved packet mutation, approved box annotation, Detector 0 retraining,
   recognizer training, ablation rerun, label expansion, controlled
   clip-heldout evaluation, source approval, unapproved media import, ONNX
   export, model-card promotion, final-readiness claim, broad-run redirect,
   Brev stop, duplicate Brev worker, final-gate weakening, product-runtime code
   change, pretrained detector/landmark use, or push occurs.

When all nine are true, continue the goal loop according to the
candidate-review artifact's single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-Y Detector 0 table second-hand candidate packet review.
Completed:            <candidate-review path or exact blocker>.
Evidence:             <artifact paths, hashes, candidate counts, split target status, and audit statuses>.
Remaining:            <single next action from the candidate-review artifact>.
Blockers:             <none, or exact local/source/provenance blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
