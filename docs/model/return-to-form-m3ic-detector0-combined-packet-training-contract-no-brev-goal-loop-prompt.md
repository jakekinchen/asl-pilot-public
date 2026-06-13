# Return-To-Form M3IC Detector0 Combined Packet Training Contract No Brev Goal Loop Prompt

Mission 3IC prompt after the direct M3IB repair materialized reviewed manual
overlay rows into
`data/annotations/detector0/return-to-form-targeted-annotation-workbench-ingestion-v1.json`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-promotion
Detector 0 combined-packet training contract slice.

The goal is to turn the current reviewed label evidence into a concrete,
auditable next training/evaluation input contract without weakening the fixed
baseline gate or claim surfaces. The base evidence is:

- 32 V0 rows from
  [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json).
- 17 supplemental reviewed hand rows from
  [`data/annotations/detector0/return-to-form-targeted-annotation-workbench-ingestion-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-workbench-ingestion-v1.json).
- 1 preserved insufficient-visual-evidence supplemental row that must stay
  blocked and excluded from training labels.

This mission may create one combined packet contract artifact, one validation
receipt, and one numbered session log. It must not run Detector 0 training,
recognizer training, Brev lifecycle, remote commands, source/media import,
tensor mutation, model-card promotion, browser activation, final-gate change,
or claim expansion.

## Required Checks

Run or record exact blockers for:

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
node scripts/ingest_detector0_reviewed_manual_overlays.mjs
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-workbench-ingestion-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ib-detector0-reviewed-manual-overlay-ingestion-no-brev-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json >/dev/null
brev ls --json
git diff --check
```

Read-only `brev ls --json` is allowed only to prove no unexpected paid worker
is running. Do not start, stop, sync, exec, or copy from Brev in this mission.

## Contract Requirements

The contract must state:

- exact source artifact paths and hashes;
- combined row counts by split, label, source, and target;
- preserved source split boundaries and signer/source identity fields;
- which rows are included in future training/evaluation input and which rows
  are excluded as blockers;
- target policy: learn `left_or_first_hand` and `right_or_second_hand`, keep
  `head_or_face` and `upper_body_or_signing_space` fixed anchors, and keep
  `table_two_hand_union_or_contact_region` diagnostic-only;
- fixed-baseline beat-it gate: left hand IoU must exceed `0.4073`, right hand
  IoU must exceed `0.6476` before improvement/export/promotion/activation or
  claim language;
- evaluation gaps still required before promotion: hard negatives/no-hand,
  empty-camera, low-light, temporal jitter, recall at IoU `0.30` and `0.50`,
  false no-hand, false trigger, and browser latency;
- fail-closed claim proof from model-card, detector card, browser bundle, and
  active vocabulary claim surfaces.

## Allowed Next Actions

Select exactly one:

- `continue_m3id_detector0_combined_packet_materialization_no_brev`
- `continue_m3id_detector0_hard_negative_source_review_no_brev`
- `continue_m3id_detector0_local_training_smoke_contract_no_brev`
- `escalate_detector0_annotation_strategy_with_local_evidence`
- `stop_for_human_detector0_label_authority_review`

Do not select direct Brev fitting, export, promotion, browser activation,
final-gate change, or claim expansion from M3IC.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and does not park on the old M3IA missing
   draft-export blocker.
2. M3IB supplemental ingestion artifact and receipt parse and are referenced.
3. The combined-packet training/evaluation contract is written, or an exact
   blocker is recorded.
4. The contract preserves the one insufficient-visual-evidence blocked row and
   does not silently promote it.
5. Claim surfaces remain fail-closed.
6. No Brev lifecycle, remote, training, source/media import, tensor mutation,
   export, promotion, browser activation, final-gate, or claim-expansion work
   occurs.
7. The receipt and numbered session log exist and select exactly one allowed
   next action.
8. The change is committed with a message beginning `mission-3ic:`.
