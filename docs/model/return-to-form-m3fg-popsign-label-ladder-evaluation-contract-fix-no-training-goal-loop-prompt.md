# Return-To-Form M3FG PopSign Label-Ladder Evaluation Contract Fix No Training Goal Loop Prompt

Mission 3FG prompt for the Codex executor after M3FF repaired the local
PopSign label-ladder training command contract.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Repair or precisely block the local PopSign label-ladder evaluation invocation
contract so the evaluator can recognize the same bounded evidence mode that
the train script now exposes: `--popsign-label-ladder-training-smoke`.

This mission is local/no-Brev/no-training. It may edit
`scripts/evaluate_rawframe_model.py` and write proof artifacts, but it must not
run fitting, run a real checkpoint evaluation, write checkpoints, tune
thresholds, spend Brev, export, promote, activate browser recognition, or
change final/product claims.

## Current Evidence

- M3FF executor commit `bb99378` added
  `--popsign-label-ladder-training-smoke` to
  `scripts/train_rawframe_model.py`.
- The M3FF receipt
  [`docs/validation/return-to-form-m3ff-popsign-label-ladder-command-contract-fix-no-training-v1.json`](../validation/return-to-form-m3ff-popsign-label-ladder-command-contract-fix-no-training-v1.json)
  records that a 095-label dry-run/check-files command exits `0`, emits
  `training_status: "dry_run_only"`, emits evidence mode
  `popsign_label_ladder_training_smoke`, creates no output directory, rejects
  `--allow-small-label-set`, rejects combining with
  `--popsign-label-ladder-diagnostic`, and supports only `025-labels`,
  `050-labels`, and `095-labels`.
- M3FE already identified the remaining evaluation blocker:
  `scripts/evaluate_rawframe_model.py` has `--popsign-fresh5-training-smoke`
  but no PopSign label-ladder evidence mode.
- Browser recognition remains fail-closed:
  `web/public/model/model-card.json` has `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has `activeLabels: []`.

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
.venv/bin/python -m json.tool docs/validation/return-to-form-m3ff-popsign-label-ladder-command-contract-fix-no-training-v1.json >/dev/null
.venv/bin/python -m json.tool docs/validation/return-to-form-m3fe-popsign-label-ladder-compute-receipt-no-training-v1.json >/dev/null
.venv/bin/python -m json.tool docs/validation/return-to-form-m3fd-popsign-label-ladder-training-mode-contract-repair-no-training-v1.json >/dev/null
.venv/bin/python -m json.tool docs/validation/popsign-label-ladder-manifests.json >/dev/null
.venv/bin/python -m json.tool web/public/model/model-card.json >/dev/null
.venv/bin/python -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
git diff --check
```

Also run a structured local source-register/finality check over all 15
refreshed PopSign label-ladder manifests. `brev ls --json` is allowed only as
read-only no-spend state evidence; no Brev lifecycle, sync, exec, copy, search,
or spend action is allowed.

## Allowed Work

- Inspect `scripts/evaluate_rawframe_model.py`,
  `scripts/train_rawframe_model.py`, and the M3FF/M3FE receipts.
- Add the smallest first-class PopSign label-ladder evaluation/sanity contract
  needed for parser and invocation compatibility, or record the exact source
  blocker.
- Prefer the existing PopSign fresh5 and region-grid evaluation patterns where
  they fit, without loosening final, lesson, reduced, region-grid, controlled
  pilot, or controlled clip-heldout guards.
- If repaired, `scripts/evaluate_rawframe_model.py --help` should list
  `--popsign-label-ladder-training-smoke`.
- Prove compatibility without a checkpoint by running the intended evaluator
  probe against the planned M3FF output paths. An acceptable probe reaches a
  missing-checkpoint or missing-provenance blocker after parsing the new flag.
  An unacceptable probe fails at argparse, requires a final challenge manifest,
  rejects the PopSign label-ladder label set as too small for this bounded
  evidence mode, requires final decode provenance, or globally weakens final
  evaluation gates.
- Keep any report/finality wording explicit that PopSign label-ladder
  evaluation-smoke evidence is not final, product, promotion, browser, or ASL
  correctness evidence.
- Write one focused receipt and the numbered executor session log.

Suggested no-checkpoint probe shape:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/evaluate_rawframe_model.py --checkpoint output/m3ff-popsign-label-ladder-local-sanity/model_state.pt --training-provenance output/m3ff-popsign-label-ladder-local-sanity/training-provenance.json --train-manifest data/manifests/diagnostics/popsign-label-ladder/095-labels/train.json --validation-manifest data/manifests/diagnostics/popsign-label-ladder/095-labels/validation.json --test-manifest data/manifests/diagnostics/popsign-label-ladder/095-labels/test.json --output-report output/m3ff-popsign-label-ladder-local-sanity/validation-report.json --calibrated-provenance output/m3ff-popsign-label-ladder-local-sanity/calibrated-provenance.json --batch-size 4 --num-workers 0 --popsign-label-ladder-training-smoke
```

## Hard Boundaries

- No non-dry-run training/fitting, optimizer construction for fitting,
  backward pass, optimizer step, sweep, checkpoint creation, real checkpoint
  evaluation, local completed evaluation report, threshold tuning, export,
  promotion, browser recognition activation, model-card promotion,
  active-vocabulary promotion, final-gate weakening, final-readiness claim,
  product-readiness claim, or ASL correctness claim.
- No Brev start/exec/sync/copy/search/spend/stop/delete/reset, remote command,
  worker creation, worker lifecycle change, package install, or artifact
  copyback.
- No source-register edit, new source/media import, manifest write/mutation,
  tensor mutation, vocabulary mutation, packet mutation, package/dependency
  mutation, generated labels, pseudo-labels, pretrained detector/landmark/
  backbone/embedding/teacher path, raw learner upload, push, amend, or
  no-verify.
- Do not claim PopSign trainability, promotability, browser readiness, product
  readiness, final readiness, or ASL correctness from evaluation-contract
  repair.

## Receipt

Write:

`docs/validation/return-to-form-m3fg-popsign-label-ladder-evaluation-contract-fix-no-training-v1.json`

The receipt must record:

- current commit and active prompt;
- M3FF receipt hash and selected next action;
- M3FE evaluation blocker summary;
- exact files and symbols inspected;
- exact evaluator contract changed, or exact blocker if unchanged;
- exact pre-fix or pre-change rejection evidence when available;
- exact no-checkpoint evaluator probe command and result;
- `--help` proof if a new flag is added;
- whether parser, manifest, challenge/decode-provenance, training-provenance,
  and report-finality compatibility are repaired or still blocked;
- proof that final/lesson/reduced/region-grid/controlled evaluation guards
  were not globally loosened;
- structured source-register/finality check across all 15 label-ladder
  manifests;
- fail-closed claim-surface status before/after;
- forbidden actions not run;
- exactly one next action.

Allowed next actions:

- `continue_popsign_label_ladder_evaluation_contract_fix_no_training`
- `continue_popsign_label_ladder_compute_receipt_refresh_after_evaluation_contract_fix_no_training`
- `continue_popsign_label_ladder_local_validation_no_training`
- `continue_fail_closed_product_polish_no_recognition`
- `stop_for_human_training_budget_approval`
- `stop_for_human_dataset_scope_review`

## Session Log

Write:

`docs/session-logs/570-mission-3fg-popsign-label-ladder-evaluation-contract-fix-no-training.md`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3FG prompt and names Mission 3FG.
2. Required local audits, JSON validations, py-compile checks,
   source-register checks, and fail-closed claim-surface checks pass or record
   exact blockers.
3. A tracked receipt exists at
   `docs/validation/return-to-form-m3fg-popsign-label-ladder-evaluation-contract-fix-no-training-v1.json`.
4. The PopSign label-ladder evaluation command contract is repaired or
   precisely blocked without relying on final-claim or diagnostic-only
   shortcuts.
5. If repaired, a local no-checkpoint evaluator probe proves the new evidence
   mode parses and reaches only the expected missing-checkpoint/provenance
   blocker, without completed evaluation, report creation, checkpoint creation,
   fitting, Brev, export, promotion, or claim-surface mutation.
6. `web/public/model/model-card.json` remains `status: "not_trained"` and
   `docs/model/active-vocabulary-claim.json` keeps `activeLabels: []`.
7. No training/fitting, real checkpoint evaluation, threshold tuning, Brev
   lifecycle/exec/sync/copy/spend, export, promotion, browser recognition
   activation, source/data/manifest/tensor/vocabulary mutation, raw learner
   upload, push, or pretrained/generated-label path occurs.
8. A numbered session log records commands, evidence inspected, changed files,
   validations, blockers if any, and exactly one next action.

## Observer Guidance

- CONTINUE only if the evaluation-contract repair/blocker is bounded,
  no-training/no-spend, preserves fail-closed claims, and selects one allowed
  next action.
- NUDGE if the receipt lacks exact command evidence, source-symbol evidence,
  source-register proof, forbidden-action proof, fail-closed claim proof, guard
  preservation proof, or exactly one next action.
- REDIRECT if the executor runs fitting/training, completed checkpoint
  evaluation, Brev lifecycle/copy/spend, source or tensor mutation, label
  expansion, export, browser activation, model-card promotion, final-gate
  changes, unsupported claim edits, push, amend, or no-verify.
- STOP if the receipt proves no non-wasteful autonomous next step remains
  without human budget, source, data, training, or scope approval.
