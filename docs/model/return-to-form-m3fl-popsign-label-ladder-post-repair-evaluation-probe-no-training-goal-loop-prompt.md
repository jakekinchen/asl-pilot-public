# Return-To-Form M3FL PopSign Label-Ladder Post-Repair Evaluation Probe No Training Goal Loop Prompt

Mission 3FL prompt for the Codex executor after M3FK repaired the narrow
PopSign label-ladder evaluator evidence contract.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run or precisely block exactly one local/no-spend/no-training post-repair
evaluation probe for the existing M3FI PopSign label-ladder checkpoint.

The goal is to learn whether the M3FK evaluator contract repair lets the
existing M3FI checkpoint pass the previous `vocabulary_review` gate and produce
bounded diagnostic evaluation evidence. This is not model training, not a new
fitting attempt, not Brev work, not export/promotion, and not browser/product
readiness.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3FK repair:
   - [`docs/validation/return-to-form-m3fk-popsign-label-ladder-evaluation-manifest-evidence-contract-repair-no-training-v1.json`](../validation/return-to-form-m3fk-popsign-label-ladder-evaluation-manifest-evidence-contract-repair-no-training-v1.json)
   - [`docs/session-logs/579-mission-3fk-popsign-label-ladder-evaluation-manifest-evidence-contract-repair-no-training.md`](../session-logs/579-mission-3fk-popsign-label-ladder-evaluation-manifest-evidence-contract-repair-no-training.md)
4. M3FI fitting/evaluation result:
   - [`docs/validation/return-to-form-m3fi-popsign-label-ladder-local-fitting-sanity-after-approval-v1.json`](../validation/return-to-form-m3fi-popsign-label-ladder-local-fitting-sanity-after-approval-v1.json)
   - [`output/m3ff-popsign-label-ladder-local-sanity/model_state.pt`](../../output/m3ff-popsign-label-ladder-local-sanity/model_state.pt), if still present
   - [`output/m3ff-popsign-label-ladder-local-sanity/training-provenance.json`](../../output/m3ff-popsign-label-ladder-local-sanity/training-provenance.json), if still present
5. M3FJ diagnosis:
   - [`docs/validation/return-to-form-m3fj-popsign-label-ladder-result-diagnosis-no-training-v1.json`](../validation/return-to-form-m3fj-popsign-label-ladder-result-diagnosis-no-training-v1.json)
6. Current PopSign label-ladder manifests under
   [`data/manifests/diagnostics/popsign-label-ladder/`](../../data/manifests/diagnostics/popsign-label-ladder/).
7. Evaluation/training code paths:
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
8. Fail-closed claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Current Evidence

M3FK executor commit `fc5d94e` changed only
`scripts/evaluate_rawframe_model.py::validate_finality`. Missing
`vocabulary_review` remains a hard error for generic final, lesson,
reduced-real-data, region-grid, PopSign fresh5, and controlled-clip-heldout
evaluation modes. For `--popsign-label-ladder-training-smoke` only, the same
missing evidence is recorded as a diagnostic/non-final limitation reason.

M3FK proved the repair without a full evaluator run by direct `validate_finality`
guard probing. M3FI's earlier single local evaluator command failed before
report generation at:

```text
Evaluation failed: current manifest train is missing vocabulary_review evidence
```

The existing M3FI checkpoint/provenance artifacts were previously verified:

- `output/m3ff-popsign-label-ladder-local-sanity/model_state.pt`
  hash `7fd2946ff527dfb47f50eba39e0601cec28ab5bae617fb88e1b7e1452a1c6b5f`
- `output/m3ff-popsign-label-ladder-local-sanity/training-provenance.json`
  hash `999aa26ed56799156eca03042be94d1ecbac39a5e103f1044daa419c3659cd95`

The M3FI one-epoch fitting metrics remain weak diagnostic signal only:
train accuracy `0.015625`, validation accuracy `0.0`, and no current basis for
promotion, browser activation, or readiness claims.

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
.venv/bin/python -m json.tool docs/validation/return-to-form-m3fk-popsign-label-ladder-evaluation-manifest-evidence-contract-repair-no-training-v1.json >/dev/null
.venv/bin/python -m json.tool docs/validation/return-to-form-m3fj-popsign-label-ladder-result-diagnosis-no-training-v1.json >/dev/null
.venv/bin/python -m json.tool docs/validation/return-to-form-m3fi-popsign-label-ladder-local-fitting-sanity-after-approval-v1.json >/dev/null
.venv/bin/python -m json.tool docs/validation/popsign-label-ladder-manifests.json >/dev/null
.venv/bin/python -m json.tool web/public/model/model-card.json >/dev/null
.venv/bin/python -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
git diff --check
```

Also run:

- a structured source-register/finality/vocabulary-review check over all 15
  PopSign label-ladder manifests;
- a preflight check that the existing M3FI checkpoint and training provenance
  are present and match the M3FI/M3FJ hashes;
- a preflight check that the intended `validation-report.json` and
  `calibrated-provenance.json` paths are absent before the probe, or record the
  exact blocker and do not overwrite them;
- `brev ls --json` read-only default-off evidence.

## Allowed Probe

Run at most one local evaluator command, with a timeout, against the existing
M3FI artifacts:

```sh
PYTHONDONTWRITEBYTECODE=1 /opt/homebrew/bin/gtimeout 1200s .venv/bin/python scripts/evaluate_rawframe_model.py \
  --checkpoint output/m3ff-popsign-label-ladder-local-sanity/model_state.pt \
  --training-provenance output/m3ff-popsign-label-ladder-local-sanity/training-provenance.json \
  --train-manifest data/manifests/diagnostics/popsign-label-ladder/095-labels/train.json \
  --validation-manifest data/manifests/diagnostics/popsign-label-ladder/095-labels/validation.json \
  --test-manifest data/manifests/diagnostics/popsign-label-ladder/095-labels/test.json \
  --output-report output/m3ff-popsign-label-ladder-local-sanity/validation-report.json \
  --calibrated-provenance output/m3ff-popsign-label-ladder-local-sanity/calibrated-provenance.json \
  --batch-size 4 \
  --num-workers 0 \
  --popsign-label-ladder-training-smoke
```

If the exact command shape is now invalid, record the exact local blocker
instead of inventing a broader run. Do not retry a completed evaluator command,
do not run a second evaluator attempt with changed semantics, and do not run
training/fitting.

If the evaluator succeeds and writes the two scoped ignored outputs, hash them
and summarize the metrics as diagnostic/non-final only. Do not track binary
artifacts or promote any output artifact. If the evaluator fails, record the
exact failure message, exit code, and whether it passed the previous
`vocabulary_review` gate.

## Hard Boundaries

- No training, fitting, optimizer construction for fitting, backward pass,
  checkpoint creation, sweep, second local fitting attempt, second evaluator
  attempt, threshold tuning, export, promotion, browser recognition activation,
  model-card promotion, active-vocabulary promotion, final-gate weakening,
  final-readiness claim, product-readiness claim, trainability claim, or ASL
  correctness claim.
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

`docs/validation/return-to-form-m3fl-popsign-label-ladder-post-repair-evaluation-probe-no-training-v1.json`

The receipt must record:

- current commit and active prompt;
- M3FK repair hash, changed source symbol, and selected next action;
- exact preflight status for checkpoint/provenance hashes and report/provenance
  output path absence;
- exact evaluator command, exit status, duration, stdout/stderr hashes, and
  whether it passed the previous `vocabulary_review` gate;
- validation-report and calibrated-provenance hashes and metric summary if
  created, or exact blocker if not created;
- explicit classification of any metrics as diagnostic, non-final, non-browser,
  non-product, non-promotion, and not readiness evidence;
- structured source-register/finality/vocabulary-review check across all 15
  label-ladder manifests;
- read-only Brev default-off state;
- fail-closed claim-surface status before/after;
- proof that no training, fitting, second evaluator attempt, Brev lifecycle/
  spend, source/manifest/tensor/vocabulary mutation, export, browser
  activation, promotion, push, or unsupported claim occurred;
- exactly one next action.

Allowed next actions:

- `continue_popsign_label_ladder_post_repair_evaluation_probe_no_training`
- `continue_popsign_label_ladder_metric_triage_no_training`
- `continue_popsign_label_ladder_source_manifest_review_no_training`
- `continue_detector0_crop_normalization_integration_review_no_training`
- `continue_fail_closed_product_polish_no_recognition`
- `escalate_popsign_label_ladder_training_strategy_research_with_local_evidence`
- `stop_for_human_training_strategy_review`
- `stop_for_human_dataset_scope_review`
- `stop_for_human_brev_spend_approval`

## Session Log

Write:

`docs/session-logs/581-mission-3fl-popsign-label-ladder-post-repair-evaluation-probe-no-training.md`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3FL prompt and names Mission 3FL.
2. Required local audits, JSON validations, py-compile checks,
   source-register/finality/vocabulary-review checks, checkpoint/provenance
   hash checks, read-only Brev default-off check, and fail-closed
   claim-surface checks pass or record exact blockers.
3. A tracked receipt exists at
   `docs/validation/return-to-form-m3fl-popsign-label-ladder-post-repair-evaluation-probe-no-training-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt records either the one allowed local evaluator probe result or
   the exact local blocker that prevented the probe.
5. Any generated evaluation report/provenance artifacts are scoped to
   `output/m3ff-popsign-label-ladder-local-sanity/`, hashed in the receipt,
   and classified as diagnostic/non-final/non-product evidence only.
6. `web/public/model/model-card.json` remains `status: "not_trained"` and
   `docs/model/active-vocabulary-claim.json` keeps `activeLabels: []`.
7. No training/fitting/second evaluator attempt/checkpoint creation/Brev
   lifecycle/exec/sync/copy/spend/source/manifest/tensor/vocabulary mutation/
   export/browser activation/model-card promotion/final-gate action occurs.
8. A numbered session log records evidence, blockers, changed files,
   validations, and exactly one next action.

## Observer Guidance

- CONTINUE if the probe/blocker is bounded, no-training/no-spend, evidence-
  backed, preserves fail-closed claims, uses at most one evaluator command, and
  selects one allowed next action.
- NUDGE if the receipt lacks command/result hashes, report/provenance hash
  status, metric classification, forbidden-action proof, Brev default-off
  evidence, fail-closed claim proof, or exactly one next action.
- REDIRECT if the executor trains, fits, runs a second evaluator attempt,
  mutates manifests/tensors/source approvals, runs Brev lifecycle/remote work,
  exports, activates browser recognition, promotes claim surfaces, changes
  final gates, pushes, amends, or bypasses hooks.
- ESCALATE if the result proposes another training-style, compute,
  architecture, input-representation, or budget step after the repeated weak
  learning evidence without a current research diagnostic tied to local
  evidence.
- STOP if the next meaningful action requires human Brev spend, source, rights,
  annotation, label, crop, tensor, code-path, training-strategy, or final-claim
  approval.
