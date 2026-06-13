# Return-To-Form M3IJ Detector0 Negative Evaluation Harness No Brev Goal Loop Prompt

Mission 3IJ prompt after M3II wrote the Detector 0 negative-evaluation metric
contract and selected
`continue_m3ij_detector0_negative_evaluation_harness_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 negative-evaluation harness slice.

The goal is to implement or wire the smallest local harness that can validate
and score future scratch Detector 0 prediction artifacts against the M3II metric
contract. Because no trained scratch Detector 0 prediction artifact exists
today, this slice may run only contract/schema validation and a clearly labeled
synthetic harness smoke. It must not invoke a detector, run a real evaluation,
train, import media, add source authority, author labels, generate pseudo-labels,
start Brev, export, promote, activate browser recognition, change final gates,
or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3II metric-contract evidence:
   - [`docs/model/return-to-form-detector0-negative-evaluation-metric-contract-v1.json`](return-to-form-detector0-negative-evaluation-metric-contract-v1.json)
   - [`docs/validation/return-to-form-m3ii-detector0-negative-evaluation-metric-contract-no-brev-v1.json`](../validation/return-to-form-m3ii-detector0-negative-evaluation-metric-contract-no-brev-v1.json)
   - [`docs/session-logs/792-mission-3ii-detector0-negative-evaluation-metric-contract-no-brev.md`](../session-logs/792-mission-3ii-detector0-negative-evaluation-metric-contract-no-brev.md)
5. M3IH negative manifest evidence:
   - [`data/annotations/detector0/return-to-form-detector0-hard-negative-validation-manifest-v1.json`](../../data/annotations/detector0/return-to-form-detector0-hard-negative-validation-manifest-v1.json)
   - [`docs/validation/return-to-form-m3ih-detector0-hard-negative-manifest-materialization-no-brev-v1.json`](../validation/return-to-form-m3ih-detector0-hard-negative-manifest-materialization-no-brev-v1.json)
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
- M3II defines metric semantics for 49 positive rows, 20 strict no-hand
  negative rows, and 5 `non_target_asl_sign` context rows.
- No trained scratch Detector 0 artifact or real prediction artifact exists.
- A real evaluation result cannot be claimed in this slice.
- Brev is not needed for this harness slice.

## Required Slice

Complete one local/no-remote/no-Brev/no-training Detector 0 negative-evaluation
harness slice.

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
python3 -m json.tool docs/model/return-to-form-detector0-negative-evaluation-metric-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ii-detector0-negative-evaluation-metric-contract-no-brev-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-detector0-hard-negative-validation-manifest-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json >/dev/null
brev ls --json
git diff --check
```

Read-only `brev ls --json` is allowed only to prove no unexpected paid worker
is running. Do not start, stop, sync, exec, or copy from Brev in this mission.

2. Write the smallest local harness surface.

Prefer an existing local script pattern if one already fits. If none fits, add
one scoped script:

`scripts/evaluate_detector0_negative_metrics.mjs`

The harness must:

- read the M3II metric contract;
- read one future Detector 0 prediction artifact matching the M3II prediction
  schema;
- validate row ids, source split/category metadata, threshold profile fields,
  no-pretrained/no-generated-label attestations, and prediction artifact hashes;
- compute positive false-no-hand metrics, positive hand recall at the contract
  IoU thresholds, strict no-hand false-trigger metrics, category-level
  false-trigger counts, and separate `non_target_asl_sign` context reporting;
- fail closed when required inputs are missing, row ids mismatch, thresholds are
  not frozen, pretrained/generated-label attestations are missing, or a row is
  assigned to the wrong metric family;
- write a JSON evaluation receipt only when invoked with an explicit output
  path;
- label synthetic fixture-smoke output as harness validation, not model
  performance.

3. Add one tracked synthetic harness-smoke fixture and one smoke output if the
   harness needs executable proof:

`docs/validation/return-to-form-m3ij-detector0-negative-evaluation-harness-smoke-predictions-v1.json`

`docs/validation/return-to-form-m3ij-detector0-negative-evaluation-harness-smoke-v1.json`

The smoke fixture must be hand-authored or programmatically derived from the
contract schema only. It must not be detector output, pretrained output,
generated labels, pseudo-labels, or evidence of model performance.

4. Write the tracked receipt:

`docs/validation/return-to-form-m3ij-detector0-negative-evaluation-harness-no-brev-v1.json`

The receipt must include command statuses, Brev read-only inventory, changed
files, harness behavior proof, synthetic-smoke disclaimer, no-real-evaluation
proof, no-pretrained/no-generated-label proof, claim-surface proof,
forbidden-action proof, blockers if any, and exactly one next action.

5. Verify:

```sh
python3 -m json.tool docs/validation/return-to-form-m3ij-detector0-negative-evaluation-harness-no-brev-v1.json >/dev/null
git diff --check
```

If a harness script and smoke fixture are written, also run the harness smoke
and JSON-parse its output. Do not run a real detector evaluation.

6. Write:

`docs/session-logs/794-mission-3ij-detector0-negative-evaluation-harness-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3ik_detector0_training_readiness_gap_contract_no_brev`
- `continue_m3ik_detector0_first_party_negative_capture_contract_no_brev`
- `continue_m3ik_detector0_local_training_smoke_compute_receipt_no_brev`
- `escalate_detector0_evaluation_harness_strategy_with_local_evidence`
- `stop_for_human_negative_evaluation_harness_review`

Do not select direct Brev fitting, Detector 0 training, export, promotion,
browser activation, final-gate change, or claim expansion from M3IJ.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-training only.
- No real evaluation run, trained-detector invocation, Brev lifecycle, remote
  command, source/media import, new source authority, label authoring,
  generated labels, pseudo-labels, pretrained detector, landmark, feature,
  backbone, or label outputs.
- No mutation of the M3II metric contract, M3IH manifest, M3ID packet, source
  register, source manifests, tensors, vocabulary, model cards, runtime code,
  final gates, claim surfaces, or side-worktree files.
- No training, export, ONNX, promotion, browser recognition activation, push,
  amend, or no-verify.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and does not park on the old M3IA blocker.
2. M3II metric contract and receipt parse and are referenced.
3. A local negative-evaluation harness exists or an exact blocker is recorded.
4. The harness validates the M3II prediction schema and separates positive,
   strict no-hand negative, and `non_target_asl_sign` context metrics.
5. Any executed smoke uses only synthetic fixture predictions and is labeled as
   harness validation, not model performance.
6. Claim surfaces remain fail-closed.
7. No Brev lifecycle, remote, training, real evaluation run, trained-detector
   invocation, source/media import, new source authority, label authoring,
   export, promotion, browser activation, final-gate, or claim-expansion work
   occurs.
8. The receipt and numbered session log exist and select exactly one allowed
   next action.
9. The change is committed with a message beginning `mission-3ij:`.

## Observer Guidance

- CONTINUE if the executor writes a scoped harness or exact blocker, proves
  schema/metric-family validation, keeps any smoke synthetic and clearly
  labeled, keeps claims fail-closed, records exact proofs, and selects one
  allowed next action.
- NUDGE if it misses row-family separation, smoke disclaimer, fail-closed input
  validation, changed-file accounting, forbidden-action proof, or exactly one
  next action.
- REDIRECT if it mutates manifests/tensors/claims, starts Brev/remote/training,
  runs real detector evaluation, imports media, authors labels, uses pretrained
  or generated labels, or expands claims.
- STOP if a negative-evaluation harness cannot be specified without a human
  project decision.
