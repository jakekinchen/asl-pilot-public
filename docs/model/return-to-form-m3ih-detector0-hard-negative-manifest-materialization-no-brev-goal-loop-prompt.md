# Return-To-Form M3IH Detector0 Hard-Negative Manifest Materialization No Brev Goal Loop Prompt

Mission 3IH prompt after M3IG wrote the Detector 0 hard-negative/no-hand
manifest contract and selected
`continue_m3ih_detector0_hard_negative_manifest_materialization_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 hard-negative/no-hand manifest materialization slice.

The goal is to materialize the validation-only hard-negative/no-hand manifest
defined by the M3IG contract from already tracked approved fixture evidence.
This slice may write the one materialized validation manifest named by the
contract. It must not import media, add new source authority, author new
labels, generate pseudo-labels, run training, start Brev, export, promote,
activate browser recognition, change final gates, or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3IG manifest-contract evidence:
   - [`docs/model/return-to-form-detector0-hard-negative-manifest-contract-v1.json`](return-to-form-detector0-hard-negative-manifest-contract-v1.json)
   - [`docs/validation/return-to-form-m3ig-detector0-hard-negative-manifest-contract-no-brev-v1.json`](../validation/return-to-form-m3ig-detector0-hard-negative-manifest-contract-no-brev-v1.json)
   - [`docs/session-logs/788-mission-3ig-detector0-hard-negative-manifest-contract-no-brev.md`](../session-logs/788-mission-3ig-detector0-hard-negative-manifest-contract-no-brev.md)
5. M3IF source-review evidence:
   - [`docs/model/return-to-form-detector0-hard-negative-source-review-v1.json`](return-to-form-detector0-hard-negative-source-review-v1.json)
   - [`docs/validation/return-to-form-m3if-detector0-hard-negative-source-review-no-brev-v1.json`](../validation/return-to-form-m3if-detector0-hard-negative-source-review-no-brev-v1.json)
   - [`docs/session-logs/786-mission-3if-detector0-hard-negative-source-review-no-brev.md`](../session-logs/786-mission-3if-detector0-hard-negative-source-review-no-brev.md)
6. Existing negative challenge evidence:
   - [`data/manifests/negative-challenge.json`](../../data/manifests/negative-challenge.json)
   - [`docs/review/online-negative-challenge-final-review.json`](../review/online-negative-challenge-final-review.json)
7. Upstream gap and packet evidence:
   - [`docs/model/return-to-form-detector0-evaluation-gap-contract-v1.json`](return-to-form-detector0-evaluation-gap-contract-v1.json)
   - [`data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json`](../../data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json)
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/model/return-to-form-detector0-fixed-baseline-gate-contract-v1.json`](return-to-form-detector0-fixed-baseline-gate-contract-v1.json)
8. Claim surfaces:
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Current Detector 0 State

- Detector 0 is not trained, accurate, exported, promoted, or spec-fit today.
- M3IG defines the future validation-only hard-negative/no-hand manifest path:
  `data/annotations/detector0/return-to-form-detector0-hard-negative-validation-manifest-v1.json`.
- M3IG keeps all external negative challenge rows validation-only and
  `allowed_for_training: false`.
- Training-ready hard-negative rows remain absent until first-party clip-level
  consent, hashes, visual review, and project-authored labels exist.
- Brev is not needed for this materialization slice.

## Required Slice

Complete one local/no-remote/no-Brev/no-training hard-negative/no-hand manifest
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
python3 -m json.tool docs/model/return-to-form-detector0-hard-negative-manifest-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ig-detector0-hard-negative-manifest-contract-no-brev-v1.json >/dev/null
python3 -m json.tool data/manifests/negative-challenge.json >/dev/null
python3 -m json.tool docs/review/online-negative-challenge-final-review.json >/dev/null
python3 -m json.tool docs/model/dataset-source-register.json >/dev/null
brev ls --json
git diff --check
```

Read-only `brev ls --json` is allowed only to prove no unexpected paid worker
is running. Do not start, stop, sync, exec, or copy from Brev in this mission.

2. Write exactly one tracked materialized manifest:

`data/annotations/detector0/return-to-form-detector0-hard-negative-validation-manifest-v1.json`

The manifest must follow the M3IG contract and include:

- schema/status that clearly says validation-only hard-negative/no-hand
  manifest, not a training manifest and not training-ready;
- current commit and active prompt;
- source artifact paths and hashes for the M3IG contract, M3IG receipt, M3IF
  source review, negative challenge manifest, online negative challenge review,
  source register, fixed-baseline gate, and claim surfaces;
- top-level validation-only split/use semantics;
- one row per retained eligible tracked fixture entry, or an exact blocker if
  tracked evidence is insufficient to materialize any row honestly;
- required row identity fields from the M3IG contract;
- allowed negative categories only:
  `empty_camera`, `no_hands_visible`, `low_light`, `off_center`,
  `non_target_asl_sign`;
- source/provenance fields that preserve exact fixture identity, source id,
  review authority, source rights status, hashes, and local relative paths
  where available;
- `allowed_for_training: false` for every external validation-only row;
- no-pretrained/no-generated-label attestations for every row;
- duplicate/conflict check results;
- explicit separation between external validation-only rows and missing
  first-party training-capable hard-negative rows;
- readiness matrix that keeps Detector 0 training, evaluation, export, browser
  promotion, final gates, and claim expansion blocked until later evaluation
  evidence exists;
- fail-closed claim proof from detector card, browser bundle, model card, and
  active vocabulary claim surfaces;
- exactly one recommended next action from the allowed list below.

Do not mutate `data/manifests/negative-challenge.json`, source register,
review packets, tensors, vocabulary, model cards, runtime code, claim surfaces,
or side-worktree files.

3. Write the tracked receipt:

`docs/validation/return-to-form-m3ih-detector0-hard-negative-manifest-materialization-no-brev-v1.json`

The receipt must include command statuses, Brev read-only inventory, source
artifact hashes, row counts by negative category, validation-only/training
boundary proof, duplicate/conflict proof, no-pretrained/no-generated-label
proof, claim-surface proof, forbidden-action proof, blockers if any, and
exactly one next action.

4. Verify:

```sh
python3 -m json.tool data/annotations/detector0/return-to-form-detector0-hard-negative-validation-manifest-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ih-detector0-hard-negative-manifest-materialization-no-brev-v1.json >/dev/null
git diff --check
```

5. Write:

`docs/session-logs/790-mission-3ih-detector0-hard-negative-manifest-materialization-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3ii_detector0_negative_evaluation_metric_contract_no_brev`
- `continue_m3ii_detector0_empty_camera_low_light_source_review_no_brev`
- `continue_m3ii_detector0_first_party_negative_capture_contract_no_brev`
- `escalate_detector0_negative_data_strategy_with_local_evidence`
- `stop_for_human_hard_negative_manifest_materialization_review`

Do not select direct Brev fitting, Detector 0 training, export, promotion,
browser activation, final-gate change, or claim expansion from M3IH.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-training only.
- No Brev lifecycle, remote commands, source/media import, new source
  authority, label authoring, generated labels, pseudo-labels, pretrained
  detector, landmark, feature, backbone, or label outputs.
- No mutation of M3IG contract, M3IF source review, M3IE contract, M3ID packet,
  source register, source manifests, tensors, vocabulary, model cards, runtime
  code, final gates, claim surfaces, or side-worktree files.
- The only data artifact this slice may write is the validation-only manifest
  path named above.
- No training, export, ONNX, promotion, browser recognition activation, push,
  amend, or no-verify.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and does not park on the old M3IA blocker.
2. M3IG contract and receipt parse and are referenced.
3. The hard-negative/no-hand validation-only manifest is materialized at the
   M3IG contract path, or an exact blocker is recorded.
4. Every materialized external row is validation-only and
   `allowed_for_training: false`.
5. The manifest preserves source/provenance, category, identity,
   duplicate/conflict, and no-pretrained/no-generated-label requirements.
6. First-party training-capable hard-negative rows remain explicitly absent.
7. Claim surfaces remain fail-closed.
8. No Brev lifecycle, remote, training, source/media import, new source
   authority, label authoring, export, promotion, browser activation,
   final-gate, or claim-expansion work occurs.
9. The receipt and numbered session log exist and select exactly one allowed
   next action.
10. The change is committed with a message beginning `mission-3ih:`.

## Observer Guidance

- CONTINUE if the executor materializes the manifest from tracked evidence,
  keeps validation/training boundaries explicit, keeps claims fail-closed,
  records exact proofs, and selects one allowed next action.
- NUDGE if it misses source-boundary proof, row/category counts,
  duplicate/conflict proof, claim-surface proof, changed-file accounting,
  forbidden-action proof, or exactly one next action.
- REDIRECT if it mutates source register/source manifests/tensors/claims,
  starts Brev/remote/training, imports media, authors new labels, uses
  pretrained or generated labels, or expands claims.
- STOP if hard-negative/no-hand manifest materialization authority cannot be
  resolved without a human rights/provenance decision.
