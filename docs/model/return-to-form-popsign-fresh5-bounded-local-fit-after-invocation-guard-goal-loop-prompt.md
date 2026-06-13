# Return-To-Form PopSign Fresh5 Bounded Local Fit After Invocation Guard Goal Loop Prompt

Mission 3DD prompt for the Codex executor after Mission 3DC selected
`draft_bounded_local_fit_after_invocation_guard_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run or precisely block exactly one bounded local/no-spend PopSign fresh5 fit
attempt for the M3DA scratch motion-region token temporal scaffold after the
M3DC invocation/output guard fix.

This mission may train locally only through the single bounded command below.
Do not run Brev, sweep, retry, switch datasets, mutate source/manifests/tensors,
export, activate the browser model, promote labels, change claim surfaces,
weaken final gates, or push.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. Mission 3DC guard-fix evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-invocation-output-guard-fix-v1.json`](../validation/return-to-form-popsign-fresh5-invocation-output-guard-fix-v1.json)
   - [`docs/session-logs/446-mission-3dc-popsign-fresh5-invocation-output-guard-fix.md`](../session-logs/446-mission-3dc-popsign-fresh5-invocation-output-guard-fix.md)
4. Mission 3DB fit-readiness evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-bounded-local-fit-readiness-review-v1.json`](../validation/return-to-form-popsign-fresh5-bounded-local-fit-readiness-review-v1.json)
   - [`docs/session-logs/444-mission-3db-popsign-fresh5-fit-readiness-review.md`](../session-logs/444-mission-3db-popsign-fresh5-fit-readiness-review.md)
5. Mission 3DA scaffold evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-scaffold-v1.json`](../validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-scaffold-v1.json)
6. M3CR/M3CJ local failure baselines and M3CS-M3CV collapse diagnostics.
7. Current train/eval code and fail-closed claim surfaces:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
8. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3DA proved the scaffold compiles and passes B=1/B=2 no-grad shape,
diagnostic-key, parameter-budget, old-path, and fail-closed checks. M3DB found
the only fit-readiness blocker was the PopSign fresh5 smoke invocation surface.
M3DC fixed that blocker: the required `--dry-run --check-files` preflight now
accepts `scratch_motion_region_token_temporal_contract_v1` and the fresh
ignored M3DC output directory, while the old M3CF dry-run path still works and
`FINAL_MODEL_ARCHITECTURES` remains unchanged.

Earlier M3CJ/M3CR local fits are baselines, not success evidence. They reached
test top-1 `0.2`, macro F1 `0.06666666666666668`, flat chance validation
accuracy, and single-class `morning` collapse. This mission tests exactly one
predeclared scaffold-fit hypothesis against those baselines.

## Required Slice

Complete exactly one bounded local fit slice.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-invocation-output-guard-fix-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-bounded-local-fit-readiness-review-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-scaffold-v1.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
```

2. Confirm the output directory does not already exist:

`output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit`

Do not delete or overwrite an existing output directory. If it already exists,
record the exact blocker in the receipt and select
`continue_bounded_local_fit_after_invocation_guard_no_brev`.

3. Predeclare this single hypothesis before fitting:

The M3DA motion-region token temporal scaffold may improve over the M3CJ/M3CR
late-fusion TCN collapse by exposing derived temporal-difference channels to
region-token interactions before temporal modeling, while keeping the same
repaired PopSign fresh5 manifests, no augmentation, AdamW, `best_validation`
checkpoint selection, and the same full split batch caps.

4. Run at most one local training command:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py \
  --train-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json \
  --validation-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json \
  --test-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json \
  --output-dir output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit \
  --model-id asl-pilot-popsign-fresh5-m3dc-local-fit-motion-region-token-temporal \
  --architecture scratch_motion_region_token_temporal_contract_v1 \
  --popsign-fresh5-training-smoke \
  --check-files \
  --frame-count 16 \
  --image-size 96 \
  --epochs 12 \
  --batch-size 4 \
  --learning-rate 0.001 \
  --optimizer adamw \
  --weight-decay 0.0 \
  --training-augmentation none \
  --checkpoint-selection best_validation \
  --max-train-batches 32 \
  --max-validation-batches 32 \
  --num-workers 0
```

5. If the training command succeeds, run exactly one local evaluation command:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/evaluate_rawframe_model.py \
  --checkpoint output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/model_state.pt \
  --training-provenance output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/training-provenance.json \
  --train-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json \
  --validation-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json \
  --test-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json \
  --output-report output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/validation-report.json \
  --calibrated-provenance output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/calibrated-provenance.json \
  --prediction-sidecar output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit/prediction-sidecar.json \
  --batch-size 4 \
  --num-workers 0 \
  --popsign-fresh5-training-smoke
```

If evaluation rejects the new scaffold path, record the exact blocker and select
`continue_evaluation_invocation_guard_review_no_training`. Do not rerun fitting.

6. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-bounded-local-fit-after-invocation-guard-v1.json`

The receipt must include:

- current HEAD and changed files;
- source-supported observations separated from inference;
- predeclared hypothesis;
- exact training and evaluation commands, exit codes, device/backend, seed,
  optimizer settings, checkpoint-selection policy, and output directory state;
- artifact hashes for model state, training provenance, validation report,
  prediction sidecar, and calibrated provenance if present;
- train/validation/test metrics, training history, confusion/prediction
  distribution, per-label recall, threshold metrics, and pass/fail status;
- comparison against M3CJ/M3CR baselines: test top-1 `0.2`, macro F1
  `0.06666666666666668`, flat chance validation accuracy, single-class
  prediction collapse, and zero-recall selected labels;
- whether local signal is strong enough to justify a later compute/export
  readiness review, or whether only no-training diagnosis/product downscope is
  justified;
- proof that no Brev/source/manifest/tensor mutation/export/browser activation/
  model-card promotion/active-label promotion/final-gate change/unsupported
  claim/push action occurred;
- proof that browser recognition remains fail-closed;
- exactly one selected next action.

7. Select exactly one next action:

- `continue_bounded_local_fit_after_invocation_guard_no_brev`: if the run,
  evaluation, or receipt is incomplete or blocked before metrics.
- `continue_evaluation_invocation_guard_review_no_training`: if the training
  command succeeds but evaluation rejects the new scaffold path.
- `continue_no_training_local_fit_result_diagnosis_after_scaffold`: if the run
  completes but fails, collapses, or needs no-training diagnosis before any
  more fitting.
- `prepare_compute_receipt_or_export_readiness_review_after_scaffold_local_signal`:
  if the run shows clear local signal above M3CJ/M3CR and avoids collapse, but
  still needs a separate receipt before Brev, export, activation, or promotion.
- `draft_product_downscope_reduced_claim_plan_no_recognition`: if the run
  supports continuing product work only with recognition fail-closed.
- `stop_for_human_training_scope_budget_or_code_path_decision`: if the next
  meaningful action requires human approval.
- `stop_scratch_recognizer_lane`: if no defensible no-pretrained, no-upload,
  browser-viable scratch route remains.

## Hard Boundaries

- At most one bounded local/no-spend fit command and one evaluation command; no
  sweep, broad retry, second local retry, fresh10 training, or 75/95-label
  training.
- No Brev training, spend, worker lifecycle change, sync, remote command,
  teardown, file copy, or remote planning beyond optional read-only visibility.
- No tensor regeneration, manifest mutation, source-register mutation,
  vocabulary/label-set mutation, source import, media download, generated
  pseudo-label, source approval edit, or split mutation.
- No pretrained detector, landmark, backbone, embedding, model dependency,
  generated-label dependency, or pretrained-assisted data labeling.
- No ONNX export, browser model activation, active-label promotion,
  model-card promotion, final-readiness claim, final-gate weakening, product
  fallback that implies live ASL recognition, ASL correctness claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3DD prompt and names Mission 3DD.
2. The M3DC, M3DB, and M3DA receipts exist and parse.
3. The single fit command is run, or the receipt/session log records the exact
   blocker that prevented it.
4. If fit succeeds, the single evaluation command is run, or the receipt records
   the exact evaluation blocker.
5. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-bounded-local-fit-after-invocation-guard-v1.json`
   or the session log records the exact blocker that prevented it.
6. The receipt compares metrics against M3CJ/M3CR baselines and directly states
   whether compute/export review, no-training diagnosis, product downscope,
   STOP/human decision, or lane stop is justified.
7. The receipt does not approve Brev, export, promotion, source/data/tensor
   mutation, final-gate change, or browser recognition claims.
8. Browser model claims remain fail-closed.
9. Required audits, py_compile, receipt JSON validation, relevant command
   checks, and `git diff --check` exit `0` or record exact blockers.
10. A numbered session log records commands, evidence, blockers, changed files,
    and exactly one next action.

## Observer Guidance

- CONTINUE if the local fit/evaluation is bounded, evidence-backed, no-Brev,
  fail-closed, and selects exactly one bounded next action.
- NUDGE if the receipt lacks source-vs-inference separation, predeclared
  hypothesis, exact command output, artifact hashes, M3CJ/M3CR comparison,
  fail-closed proof, no-Brev/export/promotion proof, or exactly one next action.
- REDIRECT if the executor trains more than once, sweeps, runs Brev, mutates
  manifests/tensors/source approvals, switches datasets, promotes a model, edits
  claim surfaces, or broadens beyond this local fit.
- STOP if the selected next action requires human budget, source, rights,
  annotation, crop, tensor, label, architecture/input, code-path, scope, or
  final-claim approval, or if the receipt selects `stop_scratch_recognizer_lane`.
- ESCALATE only if a high-cost strategy decision remains unclear after this
  local fit and cannot be reduced locally without repeating prior analysis.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3DD PopSign fresh5 bounded local fit after invocation guard.
Completed:            <fit/eval result or blocker and receipt>.
Evidence:             <receipt, changed files, commands, artifact hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
