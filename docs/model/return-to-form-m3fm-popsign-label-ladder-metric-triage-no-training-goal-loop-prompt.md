# Return-To-Form M3FM PopSign Label-Ladder Metric Triage No Training Goal Loop Prompt

Mission 3FM prompt for the Codex executor after Mission 3FL completed one
local/no-spend/no-training PopSign label-ladder evaluator probe.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Perform one local/no-spend/no-training metric triage over the M3FL receipt,
session log, and scoped ignored evaluator report if present. This is an
evidence and decision packet only. It must classify what the weak M3FL metrics
mean, whether any no-training local contract/accounting issue remains, and
which bounded next action is honest.

This prompt does not authorize another evaluator run, training/fitting,
checkpoint creation, Brev lifecycle/spend, remote execution, source/data
mutation, export, promotion, browser activation, model-card promotion, active
vocabulary promotion, final-readiness claim, product-readiness claim,
trainability claim, or ASL correctness claim.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3FL receipt:
   [`docs/validation/return-to-form-m3fl-popsign-label-ladder-post-repair-evaluation-probe-no-training-v1.json`](../validation/return-to-form-m3fl-popsign-label-ladder-post-repair-evaluation-probe-no-training-v1.json).
4. M3FL session log:
   [`docs/session-logs/581-mission-3fl-popsign-label-ladder-post-repair-evaluation-probe-no-training.md`](../session-logs/581-mission-3fl-popsign-label-ladder-post-repair-evaluation-probe-no-training.md).
5. M3FL scoped ignored evaluator output, if present:
   [`output/m3ff-popsign-label-ladder-local-sanity/validation-report.json`](../../output/m3ff-popsign-label-ladder-local-sanity/validation-report.json).
6. M3FI fitting/evaluation receipt:
   [`docs/validation/return-to-form-m3fi-popsign-label-ladder-local-fitting-sanity-after-approval-v1.json`](../validation/return-to-form-m3fi-popsign-label-ladder-local-fitting-sanity-after-approval-v1.json).
7. M3FJ result diagnosis receipt:
   [`docs/validation/return-to-form-m3fj-popsign-label-ladder-result-diagnosis-no-training-v1.json`](../validation/return-to-form-m3fj-popsign-label-ladder-result-diagnosis-no-training-v1.json).
8. M3FK evaluator evidence-contract repair receipt:
   [`docs/validation/return-to-form-m3fk-popsign-label-ladder-evaluation-manifest-evidence-contract-repair-no-training-v1.json`](../validation/return-to-form-m3fk-popsign-label-ladder-evaluation-manifest-evidence-contract-repair-no-training-v1.json).
9. Current PopSign label-ladder manifest summary:
   [`docs/validation/popsign-label-ladder-manifests.json`](../validation/popsign-label-ladder-manifests.json).
10. Fail-closed claim surfaces:
    - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
    - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Starting Evidence

- M3FL executor commit `4cecedd` ran exactly one local evaluator probe against
  the existing M3FI checkpoint/provenance and selected
  `continue_popsign_label_ladder_metric_triage_no_training`.
- The evaluator passed the previous `vocabulary_review` gate and wrote the
  scoped ignored report
  `output/m3ff-popsign-label-ladder-local-sanity/validation-report.json`
  with hash
  `24cc76caec4453d8a7ea266f9eb39108c368aa5df5858981d344c59160928065`.
- The evaluator did not write
  `output/m3ff-popsign-label-ladder-local-sanity/calibrated-provenance.json`.
  The receipt records `calibrated_provenance: null` because no negative-
  challenge manifest was provided, so the probe is not threshold-calibration
  evidence.
- Metrics are weak diagnostic evidence only: validation top-1
  `0.010105263157894737`, validation macro-F1 `0.0006163321188634017`,
  validation zero-recall labels `92`, test top-1 `0.012742382271468145`, test
  macro-F1 `0.0017700006858916142`, and test zero-recall labels `91`.
- The selected threshold was `0.54`; test threshold false-pass rate and
  threshold coverage were both `0.009972299168975069`, with accepted accuracy
  `0.0` and no negative-challenge false-pass rate.
- M3FL has an accounting caveat: the shell metadata wrapper attempted to assign
  to zsh's read-only `status` parameter after report/stdout creation, so the
  direct evaluator exit status was not captured. The evaluator must not be
  rerun in this mission.
- All 15 PopSign label-ladder manifests bind to the current source-register
  hash and have diagnostic-not-final evidence, but all 15 still lack
  `vocabulary_review`.
- Browser recognition remains fail-closed: `web/public/model/model-card.json`
  is `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has no active labels.

## Required Slice

Complete one local metric-triage pass:

1. Verify live state, active prompt, latest commit, git status, and loop
   premise.
2. Validate the M3FL, M3FI, M3FJ, M3FK, label-ladder manifest summary, model
   card, and active-vocabulary JSON files.
3. If the M3FL ignored validation report is present, hash it and inspect it as
   read-only evidence. If it is absent, use the tracked M3FL receipt/session
   summary and record that the ignored output is unavailable. Do not rerun the
   evaluator.
4. Summarize validation/test metrics, threshold coverage, accepted accuracy,
   zero-recall counts, prediction concentration if recorded, missing negative-
   challenge calibration, and the zsh wrapper exit-status caveat.
5. Compare M3FL metrics against the earlier M3FI one-epoch fitting result,
   M3FJ blocker diagnosis, M3FK contract repair, and prior weak learnability
   context recorded in `GOAL.md`.
6. Classify blockers. At minimum distinguish:
   - artifact/accounting or report availability issue;
   - evaluator/report contract issue;
   - missing vocabulary review/source-manifest limitation;
   - source/split/label separability limitation;
   - input representation/crop limitation;
   - architecture/training-budget limitation;
   - repeated weak learnability without a clear local repair.
7. State whether any no-training local contract repair is evident. Do not
   invent a code repair if the evidence is simply weak metrics.
8. State whether the evidence justifies export, promotion, browser activation,
   a product/model/final/readiness claim, trainability claim, or ASL
   correctness claim. The expected answer is no unless the evidence proves
   otherwise.
9. Apply the observer progress-quality boundary: do not select another
   training-style, compute, architecture, input-representation, or budget step
   after this weak metric evidence unless the next action is first routed to
   research or human review.
10. Write the tracked M3FM receipt and numbered session log.
11. Commit only scoped receipt/session-log artifacts.

Required local checks:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
.venv/bin/python -m json.tool docs/validation/return-to-form-m3fl-popsign-label-ladder-post-repair-evaluation-probe-no-training-v1.json >/dev/null
.venv/bin/python -m json.tool docs/validation/return-to-form-m3fi-popsign-label-ladder-local-fitting-sanity-after-approval-v1.json >/dev/null
.venv/bin/python -m json.tool docs/validation/return-to-form-m3fj-popsign-label-ladder-result-diagnosis-no-training-v1.json >/dev/null
.venv/bin/python -m json.tool docs/validation/return-to-form-m3fk-popsign-label-ladder-evaluation-manifest-evidence-contract-repair-no-training-v1.json >/dev/null
.venv/bin/python -m json.tool docs/validation/popsign-label-ladder-manifests.json >/dev/null
.venv/bin/python -m json.tool web/public/model/model-card.json >/dev/null
.venv/bin/python -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
brev ls --json
git diff --check
```

Optional read-only ignored-output checks, only if the file exists:

```sh
shasum -a 256 output/m3ff-popsign-label-ladder-local-sanity/validation-report.json
.venv/bin/python -m json.tool output/m3ff-popsign-label-ladder-local-sanity/validation-report.json >/dev/null
```

## Receipt

Write:

`docs/validation/return-to-form-m3fm-popsign-label-ladder-metric-triage-no-training-v1.json`

The receipt must include:

- current commit and active prompt;
- M3FL receipt/session-log summary;
- local checks and fail-closed claim-surface status;
- read-only Brev default-off state;
- M3FL ignored-output availability and hashes, or exact unavailable reason;
- metric summary and diagnostic/non-final/non-product classification;
- threshold/coverage/accepted-accuracy summary and negative-challenge
  calibration limitation;
- wrapper exit-status capture caveat and whether it changes the blocker
  classification;
- comparison to M3FI/M3FJ/M3FK evidence;
- blocker classification;
- explicit statement that no training, fitting, evaluator rerun, Brev
  lifecycle/exec/sync/copy/spend, source/manifest/tensor/vocabulary mutation,
  export, promotion, browser activation, model-card or active-vocabulary
  promotion, push, or unsupported claim occurred;
- `pretrained_components: []`;
- changed files;
- exactly one next action.

Allowed next actions:

- `continue_popsign_label_ladder_source_manifest_review_no_training` if the
  best next step is local/no-training review of source/manifest/vocabulary
  review evidence, label separability, or split accounting.
- `continue_popsign_label_ladder_evaluator_receipt_accounting_no_training` if
  the only concrete issue is local accounting around report availability,
  direct exit-status capture, or receipt evidence, without rerunning the
  evaluator.
- `continue_detector0_crop_normalization_integration_review_no_training` if
  the metric blocker points toward crop/input representation review without
  training, fitting, or architecture spend.
- `continue_fail_closed_product_polish_no_recognition` if no immediate ML
  repair is justified and deadline value should move to fail-closed learner
  interaction.
- `escalate_popsign_label_ladder_training_strategy_research_with_local_evidence`
  if the next ML move would change architecture, input representation,
  training budget, source strategy, or another training-style slice after
  repeated weak learnability.
- `stop_for_human_training_strategy_review` if human approval is required
  before more ML strategy work.
- `stop_for_human_dataset_scope_review` if source, rights, label, vocabulary,
  or annotation decisions require human scope approval.
- `stop_for_human_brev_spend_approval` if the next meaningful step would
  require paid remote compute.

## Session Log

Write:

`docs/session-logs/583-mission-3fm-popsign-label-ladder-metric-triage-no-training.md`

The session log must record commands, evidence inspected, artifact/report
availability and hashes, metric triage, blocker classification, Brev
default-off status, changed files, and exactly one next action.

## Boundaries

- Local/no-spend/no-training only.
- No evaluator rerun, local or remote training command, fitting, backward pass,
  optimizer step, checkpoint creation, threshold tuning for promotion, export,
  model-card promotion, active-vocabulary promotion, browser recognition
  activation, product-runtime mutation, final-readiness claim, trainability
  claim, or positive ASL correctness claim.
- No Brev start/exec/sync/copy, remote dry-run, remote training, package
  install, worker lifecycle command, duplicate worker, worker delete, or worker
  reset. A read-only `brev ls --json` is required. If it unexpectedly reports a
  running worker and no approved remote command is queued, stop only that
  existing worker as a cost-control action, verify default-off state, and
  record the blocker.
- No source-register edit, source/media import, manifest write/mutation, tensor
  mutation, vocabulary mutation, packet mutation, dependency mutation,
  generated labels, pseudo-labels, pretrained detector/landmark/backbone/
  embedding/teacher path, raw learner upload, push, amend, or no-verify.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3FM prompt and names Mission 3FM.
2. Required local audits, JSON validations, py-compile checks, read-only Brev
   default-off check, ignored-report availability/hash check if present, and
   fail-closed claim-surface checks pass or record exact blockers.
3. A tracked receipt exists at
   `docs/validation/return-to-form-m3fm-popsign-label-ladder-metric-triage-no-training-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt records metric triage, blocker classification, unsupported-claim
   proof, forbidden-action proof, and exactly one next action.
5. `web/public/model/model-card.json` remains `status: "not_trained"` and
   `docs/model/active-vocabulary-claim.json` keeps `activeLabels: []`.
6. No evaluator rerun, training/fitting/checkpoint creation/Brev lifecycle/
   exec/sync/copy/spend, export, promotion, browser activation, source/data/
   manifest/tensor/vocabulary mutation, raw learner upload, push, or
   pretrained/generated-label path occurs.
7. A numbered session log records evidence, blockers, changed files,
   validations, and exactly one next action.

## Observer Guidance

- CONTINUE if the triage is bounded, no-training/no-spend, evidence-backed,
  preserves fail-closed claims, does not rerun evaluation, and selects one
  allowed next action.
- NUDGE if the receipt lacks metric summary, blocker classification,
  ignored-report availability/hash status, unsupported-claim proof, forbidden-
  action proof, Brev default-off evidence, fail-closed claim proof, or exactly
  one next action.
- REDIRECT if the executor trains, fits, reruns the evaluator, mutates
  manifests/tensors/source approvals, runs Brev lifecycle/remote work, exports,
  activates browser recognition, promotes claim surfaces, changes final gates,
  pushes, amends, or bypasses hooks.
- ESCALATE if the result proposes another training-style, compute,
  architecture, input-representation, source-strategy, or budget step after
  the repeated weak learning evidence without a current research diagnostic
  tied to local evidence.
- STOP if the next meaningful action requires human Brev spend, source, rights,
  annotation, label, crop, tensor, code-path, training-strategy, or final-claim
  approval.
