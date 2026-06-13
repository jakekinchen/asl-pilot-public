# Return-To-Form M3II Detector0 Negative Evaluation Metric Contract No Brev Goal Loop Prompt

Mission 3II prompt after M3IH materialized the Detector 0 hard-negative/no-hand
validation manifest and selected
`continue_m3ii_detector0_negative_evaluation_metric_contract_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 negative-evaluation metric contract slice.

The goal is to define the evaluator contract and metric semantics that a later
slice may use to evaluate a future scratch-trained Detector 0 artifact against
the newly materialized validation-only hard-negative/no-hand manifest and the
existing positive Detector 0 packet. This is metric-contract work only. It must
not run evaluation, train, import media, add source authority, author labels,
generate pseudo-labels, start Brev, export, promote, activate browser
recognition, change final gates, or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3IH materialized manifest evidence:
   - [`data/annotations/detector0/return-to-form-detector0-hard-negative-validation-manifest-v1.json`](../../data/annotations/detector0/return-to-form-detector0-hard-negative-validation-manifest-v1.json)
   - [`docs/validation/return-to-form-m3ih-detector0-hard-negative-manifest-materialization-no-brev-v1.json`](../validation/return-to-form-m3ih-detector0-hard-negative-manifest-materialization-no-brev-v1.json)
   - [`docs/session-logs/790-mission-3ih-detector0-hard-negative-manifest-materialization-no-brev.md`](../session-logs/790-mission-3ih-detector0-hard-negative-manifest-materialization-no-brev.md)
5. Upstream negative/evaluation contracts:
   - [`docs/model/return-to-form-detector0-hard-negative-manifest-contract-v1.json`](return-to-form-detector0-hard-negative-manifest-contract-v1.json)
   - [`docs/model/return-to-form-detector0-evaluation-gap-contract-v1.json`](return-to-form-detector0-evaluation-gap-contract-v1.json)
   - [`docs/model/return-to-form-detector0-hard-negative-source-review-v1.json`](return-to-form-detector0-hard-negative-source-review-v1.json)
6. Positive and gate evidence:
   - [`data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json`](../../data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json)
   - [`docs/model/return-to-form-detector0-fixed-baseline-gate-contract-v1.json`](return-to-form-detector0-fixed-baseline-gate-contract-v1.json)
   - [`docs/validation/return-to-form-detector0-fullvshortcut-bakeoff-v1.json`](../validation/return-to-form-detector0-fullvshortcut-bakeoff-v1.json)
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
7. Claim surfaces:
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Current Detector 0 State

- Detector 0 is not trained, accurate, exported, promoted, or spec-fit today.
- M3IH materialized 25 validation-only negative rows: 5 each for
  `empty_camera`, `no_hands_visible`, `low_light`, `off_center`, and
  `non_target_asl_sign`.
- Every M3IH external row is `allowed_for_training: false`.
- The `non_target_asl_sign` rows are context rows, not strict no-hand absence
  rows.
- First-party training-capable hard-negative rows remain absent.
- No trained scratch Detector 0 artifact is available for a real evaluation
  run in this slice.
- Brev is not needed for this metric-contract slice.

## Required Slice

Complete one local/no-remote/no-Brev/no-training Detector 0 negative-evaluation
metric contract slice.

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
python3 -m json.tool data/annotations/detector0/return-to-form-detector0-hard-negative-validation-manifest-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ih-detector0-hard-negative-manifest-materialization-no-brev-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-evaluation-gap-contract-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-fixed-baseline-gate-contract-v1.json >/dev/null
brev ls --json
git diff --check
```

Read-only `brev ls --json` is allowed only to prove no unexpected paid worker
is running. Do not start, stop, sync, exec, or copy from Brev in this mission.

2. Write exactly one tracked metric contract:

`docs/model/return-to-form-detector0-negative-evaluation-metric-contract-v1.json`

The contract must include:

- schema/status that clearly says metric contract only, not evaluation run and
  not training-ready;
- current commit and active prompt;
- source artifact paths and hashes for the M3IH manifest, M3IH receipt, M3IG
  contract, M3IE evaluation-gap contract, M3ID combined packet, fixed-baseline
  gate, bake-off receipt, source register, and claim surfaces;
- explicit evaluator input schema for a future scratch Detector 0 prediction
  artifact, including row id, row source, expected outcome, predicted hand
  boxes, confidence thresholds, no-hand decision, and artifact hash fields;
- positive-row metric semantics using the M3ID combined packet, including
  false no-hand rate, left/right hand recall at the active IoU threshold, and
  fixed-baseline beat-it comparison fields;
- negative-row metric semantics using the M3IH manifest, including strict
  no-hand false-trigger rate, category-level false-trigger counts, and
  separation of `non_target_asl_sign` context rows from strict no-hand absence
  rows;
- pass/fail gate semantics that keep Detector 0 export, browser promotion,
  final gates, and claim expansion blocked until a future trained scratch
  detector produces passing positive and negative evaluation evidence;
- no-pretrained/no-generated-label requirements for any future prediction
  artifact;
- fail-closed claim proof from detector card, browser bundle, model card, and
  active vocabulary claim surfaces;
- exactly one recommended next action from the allowed list below.

If the metric contract cannot be written from tracked evidence, record the
exact blocker instead of inventing a metric or changing gates.

3. Write the tracked receipt:

`docs/validation/return-to-form-m3ii-detector0-negative-evaluation-metric-contract-no-brev-v1.json`

The receipt must include command statuses, Brev read-only inventory, source
artifact hashes, metric-contract proof, positive/negative row accounting,
strict no-hand versus non-target context proof, no-pretrained/no-generated
label proof, claim-surface proof, forbidden-action proof, blockers if any, and
exactly one next action.

4. Verify:

```sh
python3 -m json.tool docs/model/return-to-form-detector0-negative-evaluation-metric-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ii-detector0-negative-evaluation-metric-contract-no-brev-v1.json >/dev/null
git diff --check
```

5. Write:

`docs/session-logs/792-mission-3ii-detector0-negative-evaluation-metric-contract-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3ij_detector0_negative_evaluation_harness_no_brev`
- `continue_m3ij_detector0_first_party_negative_capture_contract_no_brev`
- `continue_m3ij_detector0_training_readiness_gap_contract_no_brev`
- `escalate_detector0_negative_metric_strategy_with_local_evidence`
- `stop_for_human_negative_metric_contract_review`

Do not select direct Brev fitting, Detector 0 training, export, promotion,
browser activation, final-gate change, or claim expansion from M3II.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-training only.
- No evaluation run, trained-detector invocation, Brev lifecycle, remote
  command, source/media import, new source authority, label authoring,
  generated labels, pseudo-labels, pretrained detector, landmark, feature,
  backbone, or label outputs.
- No mutation of the M3IH manifest, M3IG contract, M3IE contract, M3ID packet,
  source register, source manifests, tensors, vocabulary, model cards, runtime
  code, final gates, claim surfaces, or side-worktree files.
- No training, export, ONNX, promotion, browser recognition activation, push,
  amend, or no-verify.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and does not park on the old M3IA blocker.
2. M3IH manifest and receipt parse and are referenced.
3. The negative-evaluation metric contract is written, or an exact blocker is
   recorded.
4. The contract separates positive false-no-hand metrics, strict no-hand
   negative false-trigger metrics, and `non_target_asl_sign` context rows.
5. The contract defines future prediction-artifact schema and pass/fail gate
   semantics without running evaluation or training.
6. First-party training-capable hard-negative rows remain explicitly absent.
7. Claim surfaces remain fail-closed.
8. No Brev lifecycle, remote, training, evaluation run, source/media import,
   new source authority, label authoring, export, promotion, browser
   activation, final-gate, or claim-expansion work occurs.
9. The receipt and numbered session log exist and select exactly one allowed
   next action.
10. The change is committed with a message beginning `mission-3ii:`.

## Observer Guidance

- CONTINUE if the executor writes the metric contract from tracked evidence,
  separates positive/negative/context rows correctly, keeps claims fail-closed,
  records exact proofs, and selects one allowed next action.
- NUDGE if it misses row accounting, prediction schema details, strict no-hand
  versus context separation, claim-surface proof, changed-file accounting,
  forbidden-action proof, or exactly one next action.
- REDIRECT if it mutates manifests/tensors/claims, starts Brev/remote/training,
  runs evaluation, imports media, authors labels, uses pretrained or generated
  labels, or expands claims.
- STOP if metric authority or pass/fail gate semantics cannot be resolved
  without a human project decision.
