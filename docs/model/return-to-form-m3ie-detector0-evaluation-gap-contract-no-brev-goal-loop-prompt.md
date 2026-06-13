# Return-To-Form M3IE Detector0 Evaluation Gap Contract No Brev Goal Loop Prompt

Mission 3IE prompt after M3ID materialized the Detector 0 combined packet and
selected `continue_m3ie_detector0_evaluation_gap_contract_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 evaluation-gap contract slice.

The goal is to turn the materialized M3ID combined packet and the known
promotion blockers into one auditable gap contract that states what evidence is
still missing before Detector 0 can be trained, evaluated, exported, promoted,
activated in the browser, or used to expand claims.

This is contract work only. It must not run Detector 0 training, recognizer
training, Brev lifecycle, remote commands, source/media import, tensor
generation or mutation, label authoring, export, promotion, browser activation,
final-gate change, or claim expansion.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3ID combined-packet materialization evidence:
   - [`data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json`](../../data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json)
   - [`docs/validation/return-to-form-m3id-detector0-combined-packet-materialization-no-brev-v1.json`](../validation/return-to-form-m3id-detector0-combined-packet-materialization-no-brev-v1.json)
   - [`docs/session-logs/782-mission-3id-detector0-combined-packet-materialization-no-brev.md`](../session-logs/782-mission-3id-detector0-combined-packet-materialization-no-brev.md)
5. Preceding Detector 0 contracts and source evidence:
   - [`docs/model/return-to-form-detector0-combined-packet-training-contract-v1.json`](return-to-form-detector0-combined-packet-training-contract-v1.json)
   - [`docs/validation/return-to-form-m3ic-detector0-combined-packet-training-contract-no-brev-v1.json`](../validation/return-to-form-m3ic-detector0-combined-packet-training-contract-no-brev-v1.json)
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
- The M3ID packet is materialized but not training-ready, evaluation-ready,
  browser-promotion-ready, final-gate-ready, or claim-expansion-ready.
- The packet has 49 included reviewed rows and one excluded
  `blocked_insufficient_visual_evidence` row.
- The target policy remains: learn `left_or_first_hand` and
  `right_or_second_hand`; keep `head_or_face` and
  `upper_body_or_signing_space` as fixed anchors; keep
  `table_two_hand_union_or_contact_region` diagnostic-only.
- The fixed-baseline beat-it gate remains binding: learned left hand IoU must
  exceed `0.4073` and learned right hand IoU must exceed `0.6476` before any
  improvement, export, promotion, browser activation, or claim language.
- Claim surfaces must stay fail-closed.

## Required Slice

Complete one local/no-remote/no-Brev/no-training evaluation-gap contract
slice.

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
python3 -m json.tool data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3id-detector0-combined-packet-materialization-no-brev-v1.json >/dev/null
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

2. Write exactly one tracked evaluation-gap contract:

`docs/model/return-to-form-detector0-evaluation-gap-contract-v1.json`

The contract must include:

- schema/status that clearly says evaluation-gap contract, not training-ready;
- source artifact paths and hashes for M3ID, M3IC, M3IB, V0, fixed-baseline
  gate, source register, and claim surfaces;
- current commit and active prompt;
- M3ID packet summary counts and target policy copied from the packet without
  mutating rows or targets;
- a gap inventory that covers at minimum:
  - hard-negative/no-hand rows;
  - empty-camera rows;
  - low-light rows;
  - temporal jitter metrics;
  - recall at IoU `0.30`;
  - recall at IoU `0.50`;
  - false no-hand rate;
  - false trigger rate;
  - browser latency;
  - held-out learned hand IoU beating fixed baselines: left `>0.4073`, right
    `>0.6476`;
- for each gap: current evidence, missing evidence, minimum future acceptance
  proof, allowed source/provenance route, and forbidden shortcuts;
- a readiness matrix that keeps Detector 0 training, evaluation, export,
  browser promotion, final gates, and claim expansion blocked until their
  exact evidence requirements are met;
- fail-closed claim proof from detector card, browser bundle, model card, and
  active vocabulary claim surfaces;
- exactly one recommended next action from the allowed list below.

Do not create, infer, hand-author, repair, normalize, import, or select new
training/evaluation rows. If the gap contract cannot be written from existing
tracked evidence, write the receipt and session log with the exact blocker
instead of inventing evidence.

3. Write the tracked receipt:

`docs/validation/return-to-form-m3ie-detector0-evaluation-gap-contract-no-brev-v1.json`

The receipt must include command statuses, Brev read-only inventory, source
artifact hashes, packet-count proof, gap inventory proof, readiness
classification, claim-surface proof, forbidden-action proof, blockers if any,
and exactly one next action.

4. Verify:

```sh
python3 -m json.tool docs/model/return-to-form-detector0-evaluation-gap-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ie-detector0-evaluation-gap-contract-no-brev-v1.json >/dev/null
git diff --check
```

5. Write:

`docs/session-logs/784-mission-3ie-detector0-evaluation-gap-contract-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3if_detector0_hard_negative_source_review_no_brev`
- `continue_m3if_detector0_empty_camera_low_light_source_review_no_brev`
- `continue_m3if_detector0_temporal_jitter_metric_contract_no_brev`
- `continue_m3if_detector0_local_training_smoke_contract_no_brev`
- `escalate_detector0_annotation_strategy_with_local_evidence`
- `stop_for_human_detector0_evaluation_authority_review`

Do not select direct Brev fitting, Detector 0 training, export, promotion,
browser activation, final-gate change, or claim expansion from M3IE.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-training only.
- No Brev lifecycle, remote commands, source/media import, tensor mutation,
  label authoring, generated labels, pseudo-labels, pretrained detector,
  landmark, feature, backbone, or label outputs.
- No mutation of M3ID packet, M3IC contract, V0 packet, M3IB ingestion
  artifact, source register, manifests, tensors, vocabulary, model cards,
  runtime code, final gates, claim surfaces, or side-worktree files.
- No export, ONNX, promotion, browser recognition activation, push, amend, or
  no-verify.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and does not park on the old M3IA blocker.
2. M3ID packet and receipt parse and are referenced.
3. The evaluation-gap contract is written, or an exact blocker is recorded.
4. The contract inventories all required gaps listed in this prompt and ties
   each gap to missing evidence and future acceptance proof.
5. The contract preserves M3ID counts, target policy, and fixed-baseline
   beat-it gate without mutating source rows or labels.
6. Claim surfaces remain fail-closed.
7. No Brev lifecycle, remote, training, source/media import, tensor mutation,
   label authoring, export, promotion, browser activation, final-gate, or
   claim-expansion work occurs.
8. The receipt and numbered session log exist and select exactly one allowed
   next action.
9. The change is committed with a message beginning `mission-3ie:`.

## Observer Guidance

- CONTINUE if the executor writes the gap contract from existing tracked
  evidence, keeps readiness blocked where evidence is missing, keeps claims
  fail-closed, records exact proofs, and selects one allowed next action.
- NUDGE if it misses gap coverage, packet-count proof, target-policy proof,
  claim-surface proof, changed-file accounting, forbidden-action proof, or
  exactly one next action.
- REDIRECT if it changes target policy, mutates source packets/tensors/claims,
  starts Brev/remote/training, imports media, authors labels, uses pretrained
  or generated labels, or expands claims.
- STOP if the evaluation-gap contract cannot be written without a human
  evaluation-authority decision.
