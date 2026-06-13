# Return-To-Form M3IF Detector0 Hard-Negative Source Review No Brev Goal Loop Prompt

Mission 3IF prompt after M3IE wrote the Detector 0 evaluation-gap contract and
selected `continue_m3if_detector0_hard_negative_source_review_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 hard-negative/no-hand source review slice.

The goal is to determine, from tracked local evidence and the source register,
which approved sources or local fixtures can lawfully and technically support
future hard-negative/no-hand Detector 0 evidence. This is a source-review and
planning contract only. It must not import media, create rows, author labels,
generate pseudo-labels, run training, start Brev, export, promote, activate
browser recognition, change final gates, or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3IE gap contract evidence:
   - [`docs/model/return-to-form-detector0-evaluation-gap-contract-v1.json`](return-to-form-detector0-evaluation-gap-contract-v1.json)
   - [`docs/validation/return-to-form-m3ie-detector0-evaluation-gap-contract-no-brev-v1.json`](../validation/return-to-form-m3ie-detector0-evaluation-gap-contract-no-brev-v1.json)
   - [`docs/session-logs/784-mission-3ie-detector0-evaluation-gap-contract-no-brev.md`](../session-logs/784-mission-3ie-detector0-evaluation-gap-contract-no-brev.md)
5. M3ID combined-packet evidence:
   - [`data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json`](../../data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json)
   - [`docs/validation/return-to-form-m3id-detector0-combined-packet-materialization-no-brev-v1.json`](../validation/return-to-form-m3id-detector0-combined-packet-materialization-no-brev-v1.json)
6. Source and target-policy evidence:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/model/return-to-form-detector0-combined-packet-training-contract-v1.json`](return-to-form-detector0-combined-packet-training-contract-v1.json)
   - [`docs/model/return-to-form-detector0-fixed-baseline-gate-contract-v1.json`](return-to-form-detector0-fixed-baseline-gate-contract-v1.json)
   - [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json)
   - [`data/annotations/detector0/return-to-form-targeted-annotation-workbench-ingestion-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-workbench-ingestion-v1.json)
7. Claim surfaces:
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Current Detector 0 State

- Detector 0 is not trained, accurate, or spec-fit today.
- M3IE keeps hard-negative/no-hand rows as a blocking evidence gap before
  training/evaluation/export/browser promotion/final gates/claims.
- The only materialized positive-ish packet is still the 49-row M3ID packet.
- Future hard-negative/no-hand evidence must preserve source rights,
  provenance, no-pretrained/no-generated-label boundaries, and fail-closed
  claims.
- Brev is not needed for this source-review slice.

## Required Slice

Complete one local/no-remote/no-Brev/no-training hard-negative/no-hand source
review slice.

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
python3 -m json.tool docs/model/return-to-form-detector0-evaluation-gap-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ie-detector0-evaluation-gap-contract-no-brev-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json >/dev/null
python3 -m json.tool docs/model/dataset-source-register.json >/dev/null
brev ls --json
git diff --check
```

Read-only `brev ls --json` is allowed only to prove no unexpected paid worker
is running. Do not start, stop, sync, exec, or copy from Brev in this mission.

2. Write exactly one tracked source-review artifact:

`docs/model/return-to-form-detector0-hard-negative-source-review-v1.json`

The artifact must include:

- schema/status that clearly says source review, not data import and not
  training-ready;
- source artifact paths and hashes for M3IE, M3ID, source register,
  fixed-baseline gate, and claim surfaces;
- current commit and active prompt;
- the required hard-negative/no-hand evidence need copied from M3IE;
- candidate source review entries for every tracked source or local fixture
  that plausibly could provide no-hand, empty-hand, non-signing-hand,
  background-only, or false-trigger challenge evidence;
- for each candidate: source id/path, current approval status, allowed use,
  rights/provenance status, whether raw media or derived labels are allowed,
  whether no-hand/hard-negative use is in scope, missing approvals, and
  recommended next handling;
- a clear classification of one of:
  - `approved_sources_available_for_future_manifest_contract`;
  - `candidate_sources_need_human_rights_review`;
  - `no_approved_hard_negative_sources_found`;
- no row creation, no source import, no label authoring, no generated labels,
  and no target mutation;
- fail-closed claim proof from detector card, browser bundle, model card, and
  active vocabulary claim surfaces;
- exactly one recommended next action from the allowed list below.

If no approved hard-negative/no-hand source route exists in tracked evidence,
record that exact blocker instead of inventing a route.

3. Write the tracked receipt:

`docs/validation/return-to-form-m3if-detector0-hard-negative-source-review-no-brev-v1.json`

The receipt must include command statuses, Brev read-only inventory, source
artifact hashes, source-review classification, claim-surface proof,
forbidden-action proof, blockers if any, and exactly one next action.

4. Verify:

```sh
python3 -m json.tool docs/model/return-to-form-detector0-hard-negative-source-review-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3if-detector0-hard-negative-source-review-no-brev-v1.json >/dev/null
git diff --check
```

5. Write:

`docs/session-logs/786-mission-3if-detector0-hard-negative-source-review-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3ig_detector0_hard_negative_manifest_contract_no_brev`
- `continue_m3ig_detector0_empty_camera_low_light_source_review_no_brev`
- `continue_m3ig_detector0_annotation_workbench_hard_negative_queue_no_brev`
- `escalate_detector0_negative_data_strategy_with_local_evidence`
- `stop_for_human_hard_negative_source_authority_review`

Do not select direct Brev fitting, Detector 0 training, export, promotion,
browser activation, final-gate change, or claim expansion from M3IF.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-training only.
- No Brev lifecycle, remote commands, source/media import, tensor mutation,
  row creation, label authoring, generated labels, pseudo-labels, pretrained
  detector, landmark, feature, backbone, or label outputs.
- No mutation of M3IE contract, M3ID packet, M3IC contract, V0 packet, M3IB
  ingestion artifact, source register, manifests, tensors, vocabulary, model
  cards, runtime code, final gates, claim surfaces, or side-worktree files.
- No export, ONNX, promotion, browser recognition activation, push, amend, or
  no-verify.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and does not park on the old M3IA blocker.
2. M3IE contract and receipt parse and are referenced.
3. The hard-negative/no-hand source-review artifact is written, or an exact
   blocker is recorded.
4. The source review classifies every plausible tracked source/local fixture it
   used and does not create/import rows or labels.
5. The artifact states whether approved hard-negative/no-hand sources are
   available, need human review, or are absent from tracked evidence.
6. Claim surfaces remain fail-closed.
7. No Brev lifecycle, remote, training, source/media import, tensor mutation,
   row creation, label authoring, export, promotion, browser activation,
   final-gate, or claim-expansion work occurs.
8. The receipt and numbered session log exist and select exactly one allowed
   next action.
9. The change is committed with a message beginning `mission-3if:`.

## Observer Guidance

- CONTINUE if the executor writes the source review from tracked evidence,
  classifies source availability honestly, keeps claims fail-closed, records
  exact proofs, and selects one allowed next action.
- NUDGE if it misses source-rights proof, candidate classification,
  claim-surface proof, changed-file accounting, forbidden-action proof, or
  exactly one next action.
- REDIRECT if it mutates source register/packets/tensors/claims, starts
  Brev/remote/training, imports media, authors labels, uses pretrained or
  generated labels, or expands claims.
- STOP if hard-negative/no-hand source authority cannot be resolved without a
  human rights/provenance decision.
