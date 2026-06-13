# Return-To-Form M3FK PopSign Label-Ladder Evaluation Manifest Evidence Contract Repair No Training Goal Loop Prompt

Mission 3FK prompt for the Codex executor after M3FJ diagnosed the M3FI
evaluation failure as a PopSign label-ladder evaluator/manifest evidence
contract mismatch.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Repair or precisely block the local/no-spend/no-training evaluator evidence
contract for `--popsign-label-ladder-training-smoke`.

The goal is to make the evaluator's post-checkpoint provenance/current-manifest
evidence gate agree with the already-approved PopSign label-ladder diagnostic
manifest contract, or record exactly why that cannot be done safely. This is a
source-contract repair slice only. It is not approval to rerun evaluation,
train, fit, write a new report, export, promote, activate browser recognition,
or mutate manifests.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3FJ diagnosis:
   - [`docs/validation/return-to-form-m3fj-popsign-label-ladder-result-diagnosis-no-training-v1.json`](../validation/return-to-form-m3fj-popsign-label-ladder-result-diagnosis-no-training-v1.json)
   - [`docs/session-logs/577-mission-3fj-popsign-label-ladder-result-diagnosis-no-training.md`](../session-logs/577-mission-3fj-popsign-label-ladder-result-diagnosis-no-training.md)
4. M3FI fitting/evaluation result:
   - [`docs/validation/return-to-form-m3fi-popsign-label-ladder-local-fitting-sanity-after-approval-v1.json`](../validation/return-to-form-m3fi-popsign-label-ladder-local-fitting-sanity-after-approval-v1.json)
   - [`output/m3ff-popsign-label-ladder-local-sanity/training-provenance.json`](../../output/m3ff-popsign-label-ladder-local-sanity/training-provenance.json), if still present
5. M3FG/M3FF command/evaluator contract receipts:
   - [`docs/validation/return-to-form-m3fg-popsign-label-ladder-evaluation-contract-fix-no-training-v1.json`](../validation/return-to-form-m3fg-popsign-label-ladder-evaluation-contract-fix-no-training-v1.json)
   - [`docs/validation/return-to-form-m3ff-popsign-label-ladder-command-contract-fix-no-training-v1.json`](../validation/return-to-form-m3ff-popsign-label-ladder-command-contract-fix-no-training-v1.json)
6. Current PopSign label-ladder manifests under
   [`data/manifests/diagnostics/popsign-label-ladder/`](../../data/manifests/diagnostics/popsign-label-ladder/).
7. Training/evaluation code paths:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
8. Fail-closed claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Current Evidence

M3FJ executor commit `ec8e412` diagnosed the M3FI failure:

- all 15 PopSign label-ladder manifests pass current source-register and
  diagnostic finality checks;
- all 15 lack `vocabulary_review`, including the 095-label
  train/validation/test manifests used by M3FI;
- `scripts/train_rawframe_model.py` intentionally permits missing
  `vocabulary_review` for PopSign label-ladder diagnostic manifests and writes
  `null` into training provenance;
- `scripts/evaluate_rawframe_model.py` accepts the label-ladder manifests in
  `validate_evaluation_manifest`, but a later training-provenance/current-
  manifest comparison still requires `current_manifest.vocabulary_review` to
  be a dict unless `--allow-smoke-eval` is set;
- M3FG/M3FH no-checkpoint probes missed the later gate because they stopped
  before loading checkpoint/provenance.

The M3FI one-epoch fitting signal remains weak diagnostic evidence only and
does not justify training-style continuation, Brev compute, export, promotion,
or product claims.

## Required Checks

Run or record blockers for:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
.venv/bin/python -m json.tool docs/validation/return-to-form-m3fj-popsign-label-ladder-result-diagnosis-no-training-v1.json >/dev/null
.venv/bin/python -m json.tool docs/validation/return-to-form-m3fi-popsign-label-ladder-local-fitting-sanity-after-approval-v1.json >/dev/null
.venv/bin/python -m json.tool docs/validation/return-to-form-m3fg-popsign-label-ladder-evaluation-contract-fix-no-training-v1.json >/dev/null
.venv/bin/python -m json.tool docs/validation/return-to-form-m3ff-popsign-label-ladder-command-contract-fix-no-training-v1.json >/dev/null
.venv/bin/python -m json.tool docs/validation/popsign-label-ladder-manifests.json >/dev/null
.venv/bin/python -m json.tool web/public/model/model-card.json >/dev/null
.venv/bin/python -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
git diff --check
```

Also run a structured source-register/finality/vocabulary-review check over
all 15 PopSign label-ladder manifests, matching M3FJ. `brev ls --json` is
allowed only as read-only default-off evidence; no Brev lifecycle or remote
command is allowed.

## Allowed Work

- Inspect `scripts/evaluate_rawframe_model.py`,
  `scripts/train_rawframe_model.py`, and M3FJ/M3FI/M3FG/M3FF receipts.
- Repair the narrow evaluator contract so `--popsign-label-ladder-training-smoke`
  treats missing `vocabulary_review` consistently with the training-side
  label-ladder diagnostic manifest policy, or record the exact source blocker.
- Keep final, lesson, reduced-real-data, region-grid, PopSign fresh5,
  controlled-pilot, controlled-clip-heldout, and generic evaluation gates
  unchanged unless the receipt proves they are unaffected by a narrow shared
  helper refactor.
- Prove the repair without a completed evaluator rerun: prefer parser/help
  checks, py-compile, direct function-level guard checks, or a local helper
  snippet that exercises the provenance/current-manifest/finality logic without
  writing `validation-report.json`, writing `calibrated-provenance.json`,
  iterating evaluation dataloaders, or producing held-out metrics.
- If the contract cannot be proven without a full evaluator rerun, stop at a
  precise blocker and select the appropriate next action instead of running the
  evaluator.
- Write one focused receipt and one numbered executor session log.

Suggested no-report proof shape:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python - <<'PY'
# Import only local evaluator/train helpers needed to exercise the
# vocabulary_review/provenance/finality guard. Do not call main(), construct
# dataloaders, load model weights for evaluation, or write reports.
PY
```

## Hard Boundaries

- No training, fitting, optimizer construction for fitting, backward pass,
  checkpoint creation, sweep, second local fitting attempt, evaluator rerun,
  completed checkpoint evaluation, validation-report creation, calibrated-
  provenance creation, threshold tuning, export, promotion, browser recognition
  activation, model-card promotion, active-vocabulary promotion, final-gate
  weakening, final-readiness claim, product-readiness claim, trainability
  claim, or ASL correctness claim.
- No Brev start/exec/sync/copy/search/spend/stop/delete/reset, remote command,
  worker creation, worker lifecycle change, package install, or artifact
  copyback.
- No source-register edit, new source/media import, manifest write/mutation,
  tensor mutation, vocabulary mutation, packet mutation, package/dependency
  mutation, generated labels, pseudo-labels, pretrained detector/landmark/
  backbone/embedding/teacher path, raw learner upload, push, amend, or
  no-verify.

## Receipt

Write:

`docs/validation/return-to-form-m3fk-popsign-label-ladder-evaluation-manifest-evidence-contract-repair-no-training-v1.json`

The receipt must record:

- current commit and active prompt;
- M3FJ diagnosis hash and selected next action;
- exact source symbols inspected and changed, or exact blocker if unchanged;
- pre-repair and post-repair contract classification for PopSign label-ladder
  missing `vocabulary_review`;
- proof that final/lesson/reduced/region-grid/PopSign fresh5/controlled gates
  were not globally loosened;
- exact no-report proof command(s), exit status, and whether they exercised the
  post-checkpoint vocabulary-review evidence gate without writing reports;
- structured source-register/finality/vocabulary-review check across all 15
  label-ladder manifests;
- fail-closed claim-surface status before/after;
- proof that no training, fitting, evaluator rerun, report/provenance output,
  Brev lifecycle/spend, source/manifest/tensor/vocabulary mutation, export,
  browser activation, promotion, push, or unsupported claim occurred;
- exactly one next action.

Allowed next actions:

- `continue_popsign_label_ladder_evaluation_manifest_evidence_contract_repair_no_training`
- `continue_popsign_label_ladder_post_repair_evaluation_probe_no_training`
- `continue_popsign_label_ladder_source_manifest_review_no_training`
- `continue_detector0_crop_normalization_integration_review_no_training`
- `continue_fail_closed_product_polish_no_recognition`
- `escalate_popsign_label_ladder_training_strategy_research_with_local_evidence`
- `stop_for_human_training_strategy_review`
- `stop_for_human_dataset_scope_review`
- `stop_for_human_brev_spend_approval`

## Session Log

Write:

`docs/session-logs/579-mission-3fk-popsign-label-ladder-evaluation-manifest-evidence-contract-repair-no-training.md`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3FK prompt and names Mission 3FK.
2. Required local audits, JSON validations, py-compile checks,
   source-register/finality/vocabulary-review checks, read-only Brev
   default-off check if run, and fail-closed claim-surface checks pass or
   record exact blockers.
3. A tracked receipt exists at
   `docs/validation/return-to-form-m3fk-popsign-label-ladder-evaluation-manifest-evidence-contract-repair-no-training-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt records the exact evaluator contract repair or exact blocker,
   and proves the label-ladder missing-`vocabulary_review` handling is narrow.
5. The receipt proves no global final/product/fresh5/region/reduced/lesson/
   controlled evaluation gate was loosened.
6. `web/public/model/model-card.json` remains `status: "not_trained"` and
   `docs/model/active-vocabulary-claim.json` keeps `activeLabels: []`.
7. No training/fitting/evaluator rerun/report/provenance output/checkpoint/
   Brev lifecycle/exec/sync/copy/spend/source/manifest/tensor/vocabulary
   mutation/export/browser activation/model-card promotion/final-gate action
   occurs.
8. A numbered session log records evidence, blockers, changed files,
   validations, and exactly one next action.

## Observer Guidance

- CONTINUE if the contract repair/blocker is bounded, no-training/no-spend,
  evidence-backed, preserves fail-closed claims, does not run a full evaluator
  rerun, and selects one allowed next action.
- NUDGE if the receipt lacks source-symbol evidence, narrowness proof,
  no-report proof output, guard-preservation proof, vocabulary-review status,
  forbidden-action proof, fail-closed claim proof, or exactly one next action.
- REDIRECT if the executor trains, reruns evaluation, writes validation or
  calibrated-provenance reports, mutates manifests/tensors/source approvals,
  runs Brev lifecycle/remote work, exports, activates browser recognition,
  promotes claim surfaces, changes final gates, pushes, amends, or bypasses
  hooks.
- ESCALATE if the result proposes another training-style, compute,
  architecture, input-representation, or budget step after the repeated weak
  learning evidence without a current research diagnostic tied to local
  evidence.
- STOP if the next meaningful action requires human Brev spend, source, rights,
  annotation, label, crop, tensor, code-path, training-strategy, or final-claim
  approval.
