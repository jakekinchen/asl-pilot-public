# Return-To-Form Tier 0 Detector 0 Two-Hand Union Schema Goal Loop Prompt

Mission 3AE-AB prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Define a bounded two-hand union/contact-region target schema for `table`
frames before any more Detector 0 training or crop-normalization ablation.

This is a local, no-spend schema-design slice. It may write one schema artifact,
update the mutable tactical overlay, and write a numbered session log. It must
not mutate the approved Detector 0 packet, run Detector 0 training, train the
recognizer, rerun the crop-normalization ablation, expand labels, import or
approve sources, touch product runtime code, use Brev compute, export ONNX,
promote a model card, weaken final gates, or claim final readiness.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-AB.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-AB in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-AA expanded-packet smoke receipt:
   [`docs/validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json).
5. M3AE-Z packet mutation receipt:
   [`docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json).
6. Expanded approved Detector 0 packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
7. M3AE-Y candidate-review artifact and M3AE-X packet-expansion design.
8. M3AE-W remediation, M3AE-V policy-aware receipt, and M3AE-U optional-target
   policy.
9. M3AE-P Detector 0 15-row training smoke and M3AE-Q/S crop-normalization
   ablation evidence.
10. Observer localization memo:
    [`artifacts/research/observer-201-localization-strategy-api-response.md`](../../artifacts/research/observer-201-localization-strategy-api-response.md).
11. Source register:
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
  docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json \
  docs/validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json \
  data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json \
  data/manifests/return-to-form-tier0/train.json \
  data/manifests/return-to-form-tier0/validation.json \
  data/manifests/return-to-form-tier0/test.json
test -s docs/validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md
test -s docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md
test -s docs/validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md
test -s artifacts/research/observer-201-localization-strategy-api-response.md
./.venv/bin/python scripts/run_return_to_form_tier0_decode_dataloader.py
./.venv/bin/python scripts/audit_return_to_form_tier0_tensor_contract.py
git diff --check
brev ls --json
```

The user said not to stop `asl-pilot-rawframe-001`; record `brev stop
asl-pilot-rawframe-001` as the manual stop command, but do not run it. Do not
create a duplicate worker. Do not sync to Brev or launch remote training.

Then complete exactly one schema-design slice:

1. Preserve the M3AE-AA finding: the expanded-packet train path passed, but
   held-out independent `table` `right_or_second_hand` boxes failed the
   presence criterion and remain weak or ambiguous.
2. Define target semantics for a `table_two_hand_union_or_contact_region`
   target. The target should represent the signed contact/overlap area or
   minimum enclosing region for the two active hands in `table` frames, not a
   final product claim and not a pretrained landmark substitute.
3. Define derivation rules from already reviewed `left_or_first_hand` and
   `right_or_second_hand` boxes, including when the union/contact target is
   present, how to record `xyxy`, `center`, visibility, confidence, and notes,
   and when a row should remain unresolved for manual review.
4. Define packet mutation rules for a later slice, but do not mutate the packet
   in this mission. The later mutation must be reviewable, provenance-bound,
   and restricted to approved Tier 0 PopSign rows already in the packet unless
   a future prompt explicitly broadens it.
5. Define validation gates for the first smoke that would use this schema:
   local no-spend only, table union/contact held-out metrics, required-target
   versus optional-target accounting, and stop criteria that prevent forcing a
   crop-normalization ablation when the schema still fails.
6. Write
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md`](../validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md)
   with the trigger evidence, target semantics, derivation rules, review and
   provenance rules, validation gates, no-pretrained/source boundaries, Brev
   no-spend status, final-promotion blocker separation, and exactly one next
   action.
7. Update the Mutable Tactical Overlay with the schema artifact and exactly one
   next action.
8. Write a numbered session log.

## Next-Action Choices

Choose exactly one next action in the schema artifact:

- `detector0_two_hand_union_packet_mutation`: use only if the schema is
  sufficiently specified for a bounded local packet mutation that adds derived
  union/contact targets to existing approved packet rows without training.
- `detector0_two_hand_union_schema_continue`: use when the schema needs another
  no-code design pass before packet mutation.
- `detector0_data_or_target_remediation`: use when the available reviewed boxes
  are not enough to derive honest union/contact targets.
- `stop_reduced_claim`: use when no bounded no-new-source Detector 0 path is
  justified without human sign/data review, Brev spend, new source approval, or
  a changed product claim.

## Hard Boundaries

- Do not mutate `data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`.
- Do not run Detector 0 training.
- Do not run crop-normalization ablation.
- Do not run recognizer training.
- Do not run another classifier microprobe or broad smoke.
- Do not expand labels.
- Do not evaluate the controlled clip-heldout checkpoint.
- Do not import or approve sources.
- Do not use Brev for sync, SSH, remote training, or compute.
- Do not stop Brev or create a duplicate worker.
- Do not use MediaPipe, OpenPose, RTMPose, YOLO, pretrained landmarks,
  pretrained detector outputs, pretrained backbones, pretrained embeddings, or
  pretrained-generated labels in the promoted lane.
- Do not export ONNX, promote a model card, or claim final readiness.
- Do not weaken final gates.
- Do not touch product runtime code.
- Do not push or start a broad-run redirect.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AE-AB.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. The schema artifact exists at
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md`](../validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md)
   and records the M3AE-AA metric trigger, target semantics, derivation rules,
   review/provenance requirements, validation gates, no-pretrained/source
   boundaries, Brev no-spend status, final-promotion blocker separation, and
   exactly one next action.
6. The schema artifact clearly separates "reviewed independent boxes exist"
   from "independent left/right boxes are not the right target for overlapping
   `table` hands", and defines the union/contact target as a remediation target
   rather than final promotion evidence.
7. The schema artifact names the later packet mutation scope, but the packet is
   unchanged in this slice.
8. The Brev no-spend block records `brev ls --json`, instance type, planned
   remote command `none`, max runtime `0`, max spend `0`, kill condition
   `not_applicable_no_remote_training`, expected metric signal, and
   `human_spend_approval=false`.
9. The Mutable Tactical Overlay links to the schema artifact and records exactly
   one next action.
10. A numbered session log records commands, selected signs, manifest/source/
    crop/gate/bootstrap/packet/smoke/remediation/policy/policy-aware/design/
    candidate-review/mutation/expanded-smoke hashes, schema artifact hash, Brev
    worker status, manual stop command `brev stop asl-pilot-rawframe-001`, Brev
    no-spend boundary, and the next action.
11. No packet mutation, Detector 0 training, Brev sync/training/spend,
    crop-normalization ablation, recognizer training, label expansion,
    controlled clip-heldout evaluation, source approval, unapproved media
    import, ONNX export, model-card promotion, final-readiness claim, broad-run
    redirect, Brev stop, duplicate Brev worker, final-gate weakening,
    product-runtime code change, pretrained detector/landmark use, or push
    occurs.

When all eleven are true, continue the goal loop according to the schema
artifact's single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-AB Detector 0 two-hand union schema revision.
Completed:            <schema artifact or exact blocker>.
Evidence:             <artifact paths, hashes, schema trigger, no-spend status, and audit statuses>.
Remaining:            <single next action from the schema artifact>.
Blockers:             <none, or exact schema/provenance blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
