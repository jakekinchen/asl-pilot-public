# Return-To-Form M3ID Detector0 Combined Packet Materialization No Brev Goal Loop Prompt

Mission 3ID prompt after M3IC wrote the Detector 0 combined-packet training
contract and selected
`continue_m3id_detector0_combined_packet_materialization_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 combined-packet materialization slice.

The goal is to materialize the M3IC combined-packet contract into one audited
training/evaluation input packet artifact without changing the target policy,
fixed-baseline gate, source rows, tensors, model cards, browser runtime, final
gates, or claim surfaces.

This is packet materialization only. It must not run Detector 0 training,
recognizer training, Brev lifecycle, remote commands, source/media import,
tensor generation or mutation, export, promotion, browser activation,
final-gate change, or claim expansion.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3IC combined-packet contract evidence:
   - [`docs/model/return-to-form-detector0-combined-packet-training-contract-v1.json`](return-to-form-detector0-combined-packet-training-contract-v1.json)
   - [`docs/validation/return-to-form-m3ic-detector0-combined-packet-training-contract-no-brev-v1.json`](../validation/return-to-form-m3ic-detector0-combined-packet-training-contract-no-brev-v1.json)
   - [`docs/session-logs/780-mission-3ic-detector0-combined-packet-training-contract-no-brev.md`](../session-logs/780-mission-3ic-detector0-combined-packet-training-contract-no-brev.md)
5. Source label evidence:
   - [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json)
   - [`data/annotations/detector0/return-to-form-targeted-annotation-workbench-ingestion-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-workbench-ingestion-v1.json)
   - [`docs/validation/return-to-form-m3ib-detector0-reviewed-manual-overlay-ingestion-no-brev-v1.json`](../validation/return-to-form-m3ib-detector0-reviewed-manual-overlay-ingestion-no-brev-v1.json)
   - [`docs/model/return-to-form-detector0-fixed-baseline-gate-contract-v1.json`](return-to-form-detector0-fixed-baseline-gate-contract-v1.json)
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
6. Claim surfaces:
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Current Detector 0 State

- Detector 0 is not trained, accurate, or spec-fit today.
- M3IC resolved the current reviewed row inclusion/exclusion contract:
  32 V0 rows plus 17 reviewed supplemental M3IB rows are included, and one
  supplemental `blocked_insufficient_visual_evidence` row remains excluded.
- The M3IC contract says the combined packet is ready for materialization, not
  ready for training/evaluation/browser promotion.
- The fixed-baseline beat-it gate remains binding: learned left hand IoU must
  exceed `0.4073` and learned right hand IoU must exceed `0.6476` before any
  improvement, export, promotion, browser activation, or claim language.
- Claim surfaces must stay fail-closed.

## Required Slice

Complete one local/no-remote/no-Brev/no-training combined-packet
materialization slice.

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_detector0_manifest_contract.mjs
node --test scripts/ingest_detector0_reviewed_manual_overlays.test.mjs
python3 -m json.tool docs/model/return-to-form-detector0-combined-packet-training-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ic-detector0-combined-packet-training-contract-no-brev-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-workbench-ingestion-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ib-detector0-reviewed-manual-overlay-ingestion-no-brev-v1.json >/dev/null
python3 -m json.tool docs/model/dataset-source-register.json >/dev/null
brev ls --json
git diff --check
```

Read-only `brev ls --json` is allowed only to prove no unexpected paid worker
is running. Do not start, stop, sync, exec, or copy from Brev in this mission.

2. Materialize exactly one combined packet artifact:

`data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json`

The artifact must include:

- schema/status that clearly says materialized but not training-ready;
- source artifact paths and hashes from M3IC;
- current commit and active prompt;
- all 49 included row references from the M3IC contract, with source artifact,
  source row id, source split, source/source-record identity fields, label,
  clip, frame, timestamp, tensor/path/hash identity when present in the source
  row, target payloads, review/provenance fields, and source-rights/no-pretrained
  attestations carried forward without changing source rows;
- exactly one excluded blocked row entry for
  `det0-exp1-validation-table-000376-f004`, with
  `blocked_insufficient_visual_evidence` preserved and no target promotion;
- counts by split, label, source, source split, review status, label source,
  target payload, and included/excluded status that match the M3IC contract;
- target policy: learn `left_or_first_hand` and `right_or_second_hand`, keep
  `head_or_face` and `upper_body_or_signing_space` as fixed anchors, and keep
  `table_two_hand_union_or_contact_region` diagnostic-only;
- fixed-baseline beat-it gate and remaining evaluation gaps;
- fail-closed claim proof from detector card, browser bundle, model card, and
  active vocabulary claim surfaces;
- readiness classification that separates packet materialization from Detector
  0 training/evaluation, browser promotion, final gates, or claim expansion.

Do not create, infer, hand-author, repair, or normalize boxes beyond carrying
forward reviewed source fields. If any source row is missing or conflicts with
the M3IC contract, write the receipt and session log with the exact blocker
instead of materializing a partial packet.

3. Write the tracked receipt:

`docs/validation/return-to-form-m3id-detector0-combined-packet-materialization-no-brev-v1.json`

The receipt must include command statuses, Brev read-only inventory, source
artifact hashes, row-count validation, duplicate/conflict validation, blocked
row preservation proof, target-policy proof, claim-surface proof,
forbidden-action proof, readiness classification, blockers if any, and exactly
one next action.

4. Verify:

```sh
python3 -m json.tool data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3id-detector0-combined-packet-materialization-no-brev-v1.json >/dev/null
git diff --check
```

5. Write:

`docs/session-logs/782-mission-3id-detector0-combined-packet-materialization-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3ie_detector0_hard_negative_source_review_no_brev`
- `continue_m3ie_detector0_local_training_smoke_contract_no_brev`
- `continue_m3ie_detector0_evaluation_gap_contract_no_brev`
- `escalate_detector0_annotation_strategy_with_local_evidence`
- `stop_for_human_detector0_label_authority_review`

Do not select direct Brev fitting, Detector 0 training, export, promotion,
browser activation, final-gate change, or claim expansion from M3ID.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-training only.
- No Brev lifecycle, remote commands, source/media import, tensor mutation,
  hand-authored labels, generated labels, pseudo-labels, pretrained detector,
  landmark, feature, backbone, or label outputs.
- No mutation of V0 packet, M3IB ingestion artifact, source register,
  manifests, tensors, vocabulary, model cards, runtime code, final gates,
  claim surfaces, or side-worktree files.
- No export, ONNX, promotion, browser recognition activation, push, amend, or
  no-verify.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and does not park on the old M3IA blocker.
2. M3IC contract and receipt parse and are referenced.
3. The combined packet artifact is written, or an exact blocker is recorded.
4. The packet includes exactly the 49 M3IC included rows and preserves the one
   blocked insufficient-visual-evidence row as excluded.
5. Counts and row identities match the M3IC contract.
6. Claim surfaces remain fail-closed.
7. No Brev lifecycle, remote, training, source/media import, tensor mutation,
   export, promotion, browser activation, final-gate, or claim-expansion work
   occurs.
8. The receipt and numbered session log exist and select exactly one allowed
   next action.
9. The change is committed with a message beginning `mission-3id:`.

## Observer Guidance

- CONTINUE if the executor materializes the packet from reviewed source rows,
  preserves the blocked row as excluded, keeps claims fail-closed, records
  exact counts/proofs, and selects one allowed next action.
- NUDGE if it misses row-count proof, blocked-row proof, source/provenance proof,
  claim-surface proof, changed-file accounting, forbidden-action proof, or
  exactly one next action.
- REDIRECT if it changes target policy, promotes the blocked row, mutates source
  packets/tensors/claims, starts Brev/remote/training, imports media, uses
  pretrained/generated labels, or expands claims.
- STOP if the combined packet cannot be materialized without a human label
  authority decision.
