# Return-To-Form Tier 0 Detector 0 Two-Hand Union Packet Mutation Goal Loop Prompt

Mission 3AE-AC prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Mutate the approved Detector 0 packet to add the M3AE-AB
`table_two_hand_union_or_contact_region` target to existing rows only.

This is a local, no-spend packet-mutation slice. It may edit
[`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json),
write one mutation receipt, update the mutable tactical overlay, and write a
numbered session log. It must not add rows, run Detector 0 training, train the
recognizer, rerun the crop-normalization ablation, expand labels, import or
approve sources, touch product runtime code, use Brev compute, export ONNX,
promote a model card, weaken final gates, or claim final readiness.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-AC.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-AC in the Milestone Ladder and Mutable Tactical Overlay.
4. M3AE-AB schema artifact:
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md`](../validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md).
5. Expanded approved Detector 0 packet:
   [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
6. M3AE-AA expanded-packet smoke receipt:
   [`docs/validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json`](../validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json).
7. M3AE-Z packet mutation receipt, M3AE-Y candidate review, and M3AE-X
   packet-expansion design.
8. M3AE-W remediation, M3AE-V policy-aware receipt, and M3AE-U optional-target
   policy.
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
  data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json \
  data/manifests/return-to-form-tier0/train.json \
  data/manifests/return-to-form-tier0/validation.json \
  data/manifests/return-to-form-tier0/test.json
test -s docs/validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md
test -s docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md
test -s docs/validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md
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

Then complete exactly one packet-mutation slice:

1. Verify the current packet pre-hash is
   `b7278f433010c9bfda7a5e8535572a31978162d5429fd3f2968d51ebb5a5e5ec`.
2. Add `table_two_hand_union_or_contact_region` to the packet target schema.
3. For each existing row, add one target object for
   `table_two_hand_union_or_contact_region`.
4. For current `label_id=table` rows, derive present union/contact targets only
   when both reviewed source hand boxes satisfy the M3AE-AB rules.
5. For non-table rows, mark the target absent because the label is not
   applicable.
6. Stop and select remediation if any current table row is unresolved,
   malformed, too broad, or cannot be derived without violating provenance
   rules.
7. Write
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json)
   with pre/post packet hashes, schema artifact hash, derived row ids/counts,
   unresolved counts/reasons, no-pretrained/source boundaries, Brev no-spend
   status, final-promotion blocker separation, and exactly one next action.
8. Update the Mutable Tactical Overlay with the mutation receipt and exactly
   one next action.
9. Write a numbered session log.

## Next-Action Choices

Choose exactly one next action in the mutation receipt:

- `detector0_two_hand_union_training_smoke`: use only if the packet mutation
  succeeds, all current table rows have present derived union/contact targets,
  support is at least train 5, validation 5, and test 5, and no boundary was
  violated. This authorizes only a future prompt for a local no-spend scratch
  smoke; it does not run training in this slice.
- `detector0_two_hand_union_packet_mutation_continue`: use when the mutation is
  mechanically incomplete but still bounded to packet/schema bookkeeping.
- `detector0_data_or_target_remediation`: use when one or more table rows are
  unresolved or the current reviewed boxes cannot honestly derive the
  union/contact target.
- `stop_reduced_claim`: use when no bounded no-new-source Detector 0 path is
  justified without human sign/data review, Brev spend, new source approval, or
  a changed product claim.

## Hard Boundaries

- Do not add rows to the Detector 0 packet.
- Do not import or approve sources.
- Do not use generated pseudo-labels.
- Do not use MediaPipe, OpenPose, RTMPose, YOLO, pretrained landmarks,
  pretrained detector outputs, pretrained backbones, pretrained embeddings, or
  pretrained-generated labels in the promoted lane.
- Do not run Detector 0 training.
- Do not run crop-normalization ablation.
- Do not run recognizer training.
- Do not run another classifier microprobe or broad smoke.
- Do not expand labels.
- Do not evaluate the controlled clip-heldout checkpoint.
- Do not use Brev for sync, SSH, remote training, or compute.
- Do not stop Brev or create a duplicate worker.
- Do not export ONNX, promote a model card, or claim final readiness.
- Do not weaken final gates.
- Do not touch product runtime code.
- Do not push or start a broad-run redirect.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AE-AC.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Required JSON artifacts remain valid, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. The packet pre-hash matches
   `b7278f433010c9bfda7a5e8535572a31978162d5429fd3f2968d51ebb5a5e5ec`.
6. The packet contains `table_two_hand_union_or_contact_region` target objects
   for every existing row, with no row additions.
7. Current `table` rows have present derived union/contact targets unless the
   receipt selects `detector0_data_or_target_remediation` with exact unresolved
   row reasons.
8. The mutation receipt exists at
   [`docs/validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json)
   and records pre/post packet hashes, schema artifact hash, derived row
   ids/counts, unresolved counts/reasons, no-pretrained/source boundaries, Brev
   no-spend status, final-promotion blocker separation, and exactly one next
   action.
9. The Mutable Tactical Overlay links to the mutation receipt and records
   exactly one next action.
10. A numbered session log records commands, selected signs, manifest/source/
    crop/gate/bootstrap/packet/smoke/remediation/policy/policy-aware/design/
    candidate-review/mutation/expanded-smoke/schema hashes, mutation receipt
    hash, Brev worker status, manual stop command
    `brev stop asl-pilot-rawframe-001`, Brev no-spend boundary, and the next
    action.
11. No row addition, Detector 0 training, Brev sync/training/spend,
    crop-normalization ablation, recognizer training, label expansion,
    controlled clip-heldout evaluation, source approval, unapproved media
    import, ONNX export, model-card promotion, final-readiness claim,
    broad-run redirect, Brev stop, duplicate Brev worker, final-gate weakening,
    product-runtime code change, pretrained detector/landmark use, generated
    pseudo-label use, or push occurs.

When all eleven are true, continue the goal loop according to the mutation
receipt's single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-AC Detector 0 two-hand union packet mutation.
Completed:            <mutation receipt or exact blocker>.
Evidence:             <artifact paths, hashes, derived/unresolved counts, no-spend status, and audit statuses>.
Remaining:            <single next action from the mutation receipt>.
Blockers:             <none, or exact packet/provenance blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
