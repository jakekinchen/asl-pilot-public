# Return-To-Form PopSign Fresh5 Architecture/Input Microprobe Goal Loop Prompt

Mission 3CK prompt for the Codex executor after local PopSign fresh5 train/eval
sanity selected `continue_architecture_or_input_contract_microprobe_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one bounded local/no-spend, no-Brev architecture/input
microprobe for the PopSign fresh5 repaired-manifest path, or precisely block it.

The goal is to determine why
`scratch_region_temporal_late_fusion_tcn_contract_v1` can run end to end but
does not train-fit the five-label PopSign fresh5 split. This mission may add or
adapt a small diagnostic script and write a receipt. It must not run Brev,
expand labels, import sources, export, promote, activate browser recognition,
or change final claims.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3CI evaluation contract fix:
   - [`docs/validation/return-to-form-popsign-fresh5-evaluation-invocation-contract-fix-v1.json`](../validation/return-to-form-popsign-fresh5-evaluation-invocation-contract-fix-v1.json)
   - [`docs/session-logs/406-mission-3ci-popsign-fresh5-evaluation-invocation-contract-fix.md`](../session-logs/406-mission-3ci-popsign-fresh5-evaluation-invocation-contract-fix.md)
4. Local train/eval sanity:
   - [`docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json`](../validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json)
   - [`docs/session-logs/407-supervisor-popsign-fresh5-local-train-eval-sanity.md`](../session-logs/407-supervisor-popsign-fresh5-local-train-eval-sanity.md)
5. Existing PopSign fresh5 architecture evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-architecture-scaffold-contract-v1.json`](../validation/return-to-form-popsign-fresh5-architecture-scaffold-contract-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json`](../validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json`](../validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json)
6. Existing scripts:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - [`scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py`](../../scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py)
7. Repaired manifest package:
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json)
8. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3CI resolved the evaluation compatibility blocker: evaluation now accepts
`--popsign-fresh5-training-smoke`, validates the repaired PopSign fresh5
manifests, omits inappropriate challenge/final gates for this not-final smoke,
and preserves `B,T,R,C,H,W`.

The follow-up local sanity runs proved plumbing but not learning:

- one-batch sanity completed but was only plumbing;
- full train-all lr `0.001`, 5 epochs, 32 train batches and 32 validation
  batches stayed near chance;
- full train-all lr `0.003` also stayed near chance;
- best observed train accuracy was `0.264`;
- held-out top-1 stayed `0.2`, macro F1 stayed `0.06666666666666668`;
- predictions collapsed to one class.

Therefore the next question is not "can PopSign/SemLex manifests load?" They
can. The next question is whether the current M3CE architecture/input/training
loop can train-fit a controlled balanced subset at all.

## Required Slice

Complete exactly one smallest useful local no-Brev microprobe.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-evaluation-invocation-contract-fix-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py
```

2. Run one diagnostic that directly tests train-fit.

Preferred diagnostic:

- select a deterministic balanced tiny subset from the repaired train split
  (for example one to five clips per label);
- feed the same `rgb_regions_grid_v1` / `B,T,R,C,H,W` input to
  `scratch_region_temporal_late_fusion_tcn_contract_v1`;
- train locally only, from random initialization, no pretrained components;
- record train accuracy/loss, gradient norm or parameter-change evidence,
  label order, prediction distribution, and whether the model can overfit.

Optional comparison if cheap and scoped:

- compare the same tiny subset against the earlier region-grid TCN family that
  already has tiny-overfit evidence, or record why that comparison is not
  necessary for this slice.

3. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json`

The receipt must include:

- exact files/symbols inspected and changed;
- commands run and outputs;
- tiny subset selection rules and label counts;
- whether the M3CE architecture train-fits the tiny subset;
- gradient/logit/parameter-change sanity evidence;
- comparison to previous M3BV/M3CA evidence;
- no-Brev/no-pretrained/no-export/no-promotion proof;
- exactly one next action.

4. Select exactly one next action:

- `continue_architecture_or_input_contract_microprobe_no_brev`: if the
  microprobe is incomplete or inconclusive.
- `fix_m3ce_architecture_or_input_adapter_no_brev`: if the M3CE architecture
  cannot train-fit a tiny balanced subset.
- `prepare_bounded_local_or_brev_train_all_after_train_fit_proof`: if the M3CE
  architecture can train-fit and a meaningful train-all run is now justified.
- `fallback_to_prior_train_fitting_region_grid_tcn_family`: if the M3CE
  architecture fails but earlier region-grid TCN evidence remains the better
  path.
- `continue_data_split_label_distribution_audit_no_mutation`: if tiny train-fit
  passes but train-all/generalization remains blocked by data/split/label
  quality.
- `stop_for_human_training_budget_or_scope_decision`: if no non-wasteful next
  step can proceed without human input.

## Hard Boundaries

- No Brev training, spend, worker lifecycle change, sync, remote command,
  teardown, or file copy.
- No broad 75/95-label training, label expansion, source-register approval
  change, source import, generated pseudo-labels, or pretrained dependency.
- No ONNX export, browser model activation, active-label promotion,
  model-card promotion, final-readiness claim, final-gate weakening, product
  fallback detour, ASL correctness claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3CK prompt and names Mission 3CK.
2. The M3CI and local train/eval sanity receipts exist and parse.
3. A tracked microprobe receipt exists or the session log records the exact
   blocker.
4. The receipt directly answers whether the M3CE architecture/input can
   train-fit a balanced tiny PopSign fresh5 subset.
5. The receipt records train-fit metrics, gradient/logit/parameter-change
   sanity, label distribution, and prediction distribution.
6. No Brev/pretrained/export/promotion/final claim action occurred.
7. Required audits, JSON validation, relevant py-compile checks, and
   `git diff --check` exit `0` or record exact blockers.
8. A numbered session log records evidence, blockers, and exactly one next
   action.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3CK PopSign fresh5 architecture/input microprobe.
Completed:            <microprobe result or exact blocker>.
Evidence:             <receipt, commands, metrics>.
Remaining:            <single next action>.
Blockers:             <none or exact train-fit/input/architecture blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
