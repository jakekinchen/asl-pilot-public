# Return-To-Form M3IG Detector0 Hard-Negative Manifest Contract No Brev Goal Loop Prompt

Mission 3IG prompt after M3IF wrote the Detector 0 hard-negative/no-hand source
review and selected
`continue_m3ig_detector0_hard_negative_manifest_contract_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 hard-negative/no-hand manifest contract slice.

The goal is to define the exact validation-only hard-negative manifest contract
that a later slice may materialize from already tracked approved source
evidence. This is contract work only. It must not import media, create manifest
rows, author labels, generate pseudo-labels, run training, start Brev, export,
promote, activate browser recognition, change final gates, or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3IF source-review evidence:
   - [`docs/model/return-to-form-detector0-hard-negative-source-review-v1.json`](return-to-form-detector0-hard-negative-source-review-v1.json)
   - [`docs/validation/return-to-form-m3if-detector0-hard-negative-source-review-no-brev-v1.json`](../validation/return-to-form-m3if-detector0-hard-negative-source-review-no-brev-v1.json)
   - [`docs/session-logs/786-mission-3if-detector0-hard-negative-source-review-no-brev.md`](../session-logs/786-mission-3if-detector0-hard-negative-source-review-no-brev.md)
5. Existing negative challenge evidence:
   - [`data/manifests/negative-challenge.json`](../../data/manifests/negative-challenge.json)
   - [`docs/review/online-negative-challenge-final-review.json`](../review/online-negative-challenge-final-review.json)
6. Upstream gap and packet evidence:
   - [`docs/model/return-to-form-detector0-evaluation-gap-contract-v1.json`](return-to-form-detector0-evaluation-gap-contract-v1.json)
   - [`data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json`](../../data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json)
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/model/return-to-form-detector0-fixed-baseline-gate-contract-v1.json`](return-to-form-detector0-fixed-baseline-gate-contract-v1.json)
7. Claim surfaces:
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Current Detector 0 State

- Detector 0 is not trained, accurate, or spec-fit today.
- M3IF found approved validation-only negative challenge sources and local
  fixtures for a future manifest contract.
- M3IF also records that training-ready hard-negative rows are absent.
- The next useful local slice is to define the validation-only manifest
  contract before any materialization.
- Brev is not needed for this contract slice.

## Required Slice

Complete one local/no-remote/no-Brev/no-training hard-negative/no-hand manifest
contract slice.

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
python3 -m json.tool docs/model/return-to-form-detector0-hard-negative-source-review-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3if-detector0-hard-negative-source-review-no-brev-v1.json >/dev/null
python3 -m json.tool data/manifests/negative-challenge.json >/dev/null
python3 -m json.tool docs/review/online-negative-challenge-final-review.json >/dev/null
python3 -m json.tool docs/model/dataset-source-register.json >/dev/null
brev ls --json
git diff --check
```

Read-only `brev ls --json` is allowed only to prove no unexpected paid worker
is running. Do not start, stop, sync, exec, or copy from Brev in this mission.

2. Write exactly one tracked manifest contract:

`docs/model/return-to-form-detector0-hard-negative-manifest-contract-v1.json`

The contract must include:

- schema/status that clearly says manifest contract, not manifest
  materialization and not training-ready;
- source artifact paths and hashes for M3IF, negative challenge manifest,
  online negative challenge review, source register, fixed-baseline gate, and
  claim surfaces;
- current commit and active prompt;
- validation-only source boundary: external negative challenge sources may
  support hard-negative/no-hand validation or pilot gates only, not training
  rows;
- first-party training boundary: training-capable hard-negative rows remain
  blocked until actual clip-level consent, hashes, and visual review evidence
  exist;
- future materialized manifest schema, required row identity fields, allowed
  negative categories, split/use semantics, source/provenance fields,
  no-pretrained/no-generated-label attestations, and duplicate/conflict checks;
- exact constraints for preserving or referencing the existing
  `data/manifests/negative-challenge.json` fixture without importing new media
  or creating rows in this slice;
- readiness matrix that keeps Detector 0 training, evaluation, export,
  browser promotion, final gates, and claim expansion blocked until future
  materialization and evaluation evidence exist;
- fail-closed claim proof from detector card, browser bundle, model card, and
  active vocabulary claim surfaces;
- exactly one recommended next action from the allowed list below.

If the manifest contract cannot be written from tracked evidence, record the
exact blocker instead of inventing source authority or rows.

3. Write the tracked receipt:

`docs/validation/return-to-form-m3ig-detector0-hard-negative-manifest-contract-no-brev-v1.json`

The receipt must include command statuses, Brev read-only inventory, source
artifact hashes, manifest-contract proof, validation-only/training-boundary
proof, claim-surface proof, forbidden-action proof, blockers if any, and
exactly one next action.

4. Verify:

```sh
python3 -m json.tool docs/model/return-to-form-detector0-hard-negative-manifest-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ig-detector0-hard-negative-manifest-contract-no-brev-v1.json >/dev/null
git diff --check
```

5. Write:

`docs/session-logs/788-mission-3ig-detector0-hard-negative-manifest-contract-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3ih_detector0_hard_negative_manifest_materialization_no_brev`
- `continue_m3ih_detector0_empty_camera_low_light_source_review_no_brev`
- `continue_m3ih_detector0_first_party_negative_capture_contract_no_brev`
- `escalate_detector0_negative_data_strategy_with_local_evidence`
- `stop_for_human_hard_negative_manifest_authority_review`

Do not select direct Brev fitting, Detector 0 training, export, promotion,
browser activation, final-gate change, or claim expansion from M3IG.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-training only.
- No Brev lifecycle, remote commands, source/media import, manifest row
  creation, label authoring, generated labels, pseudo-labels, pretrained
  detector, landmark, feature, backbone, or label outputs.
- No mutation of M3IF source review, M3IE contract, M3ID packet, source
  register, manifests, tensors, vocabulary, model cards, runtime code, final
  gates, claim surfaces, or side-worktree files.
- No export, ONNX, promotion, browser recognition activation, push, amend, or
  no-verify.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and does not park on the old M3IA blocker.
2. M3IF source review and receipt parse and are referenced.
3. The hard-negative/no-hand manifest contract is written, or an exact blocker
   is recorded.
4. The contract preserves the validation-only boundary for external negative
   challenge sources and the blocked training-ready row status.
5. The contract defines future manifest identity, category, provenance,
   duplicate/conflict, and no-pretrained/no-generated-label requirements
   without creating/importing rows.
6. Claim surfaces remain fail-closed.
7. No Brev lifecycle, remote, training, source/media import, manifest row
   creation, label authoring, export, promotion, browser activation,
   final-gate, or claim-expansion work occurs.
8. The receipt and numbered session log exist and select exactly one allowed
   next action.
9. The change is committed with a message beginning `mission-3ig:`.

## Observer Guidance

- CONTINUE if the executor writes the manifest contract from tracked evidence,
  keeps validation/training boundaries explicit, keeps claims fail-closed,
  records exact proofs, and selects one allowed next action.
- NUDGE if it misses source-boundary proof, future manifest schema details,
  claim-surface proof, changed-file accounting, forbidden-action proof, or
  exactly one next action.
- REDIRECT if it mutates source register/manifests/tensors/claims, starts
  Brev/remote/training, imports media, authors rows or labels, uses pretrained
  or generated labels, or expands claims.
- STOP if hard-negative/no-hand manifest authority cannot be resolved without
  a human rights/provenance decision.
