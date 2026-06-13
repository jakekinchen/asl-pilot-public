# Return-To-Form PopSign Fresh5 Evaluation Invocation Contract Fix Goal Loop Prompt

Mission 3CI prompt for the Codex executor after Mission 3CH selected
`continue_evaluation_invocation_contract_fix_no_training`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one bounded local/no-spend, no-training evaluation
invocation-contract fix for the PopSign fresh5 repaired-manifest path, or
precisely block it.

The immediate goal is to make `scripts/evaluate_rawframe_model.py` understand
the same PopSign fresh5 evidence mode that `scripts/train_rawframe_model.py`
already accepts: `--popsign-fresh5-training-smoke` with
`scratch_region_temporal_late_fusion_tcn_contract_v1`, repaired PopSign fresh5
manifests, and preserved `B,T,R,C,H,W` region tensors. This mission may edit
evaluation code and write proof artifacts. It must not run fitting, construct
an optimizer for fitting, call backward, write checkpoints, spend Brev, export,
promote, activate browser recognition, or change final claims.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3CH compute receipt refresh:
   - [`docs/validation/return-to-form-popsign-fresh5-training-compute-receipt-refresh-v1.json`](../validation/return-to-form-popsign-fresh5-training-compute-receipt-refresh-v1.json)
   - [`docs/session-logs/404-mission-3ch-popsign-fresh5-training-compute-receipt-refresh.md`](../session-logs/404-mission-3ch-popsign-fresh5-training-compute-receipt-refresh.md)
4. M3CG invocation-contract fix:
   - [`docs/validation/return-to-form-popsign-fresh5-training-invocation-contract-fix-v1.json`](../validation/return-to-form-popsign-fresh5-training-invocation-contract-fix-v1.json)
   - [`docs/session-logs/401-mission-3cg-popsign-fresh5-training-invocation-contract-fix.md`](../session-logs/401-mission-3cg-popsign-fresh5-training-invocation-contract-fix.md)
5. M3CE scaffold contract:
   - [`docs/validation/return-to-form-popsign-fresh5-architecture-scaffold-contract-v1.json`](../validation/return-to-form-popsign-fresh5-architecture-scaffold-contract-v1.json)
6. Existing training and evaluation code:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
7. Repaired manifest package:
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json)
8. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3CH proved the training side is now compatible:

- the no-side-effect training dry-run exits `0`;
- evidence mode is `popsign_fresh5_training_smoke`;
- architecture is `scratch_region_temporal_late_fusion_tcn_contract_v1`;
- `preserve_region_axis` is `true`;
- train, validation, and test manifests load with 125 clips and five labels;
- no output directory, checkpoint, tensor, or manifest artifact is created.

M3CH also proved the evaluation side is currently incompatible:

```text
evaluate_rawframe_model.py: error: unrecognized arguments: --popsign-fresh5-training-smoke
```

The M3CH receipt identified these evaluation gaps:

- `parse_args` has no PopSign fresh5 evaluation flag;
- `evaluation_evidence_mode` has no `popsign_fresh5_training_smoke` mode;
- challenge-manifest omission is scoped only to smoke, reduced real-data, and
  region-grid modes;
- manifest validation has no PopSign fresh5 branch;
- `require_decode_provenance` and `preserve_region_axis` only special-case
  `--region-grid-tcn-training-smoke`;
- report finality/status has no PopSign fresh5 not-final evidence class.

Do not run local or Brev fitting until the same evidence mode can be evaluated
and preserve the same region axis.

## Required Slice

Complete exactly one smallest useful no-training evaluation invocation-contract
fix, or record the exact blocker.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-training-compute-receipt-refresh-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-training-invocation-contract-fix-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-architecture-scaffold-contract-v1.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/audit_popsign_fresh5_model_input_training_loop.py scripts/run_popsign_fresh5_learnability_isolation_probe.py scripts/decode_raw_videos.py scripts/materialize_popsign_fresh5_region_grid.py scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py scripts/materialize_popsign_fresh5_repaired_manifest.py
```

2. Inspect and fix only the evaluation invocation surface required for PopSign
   fresh5.

Preferred properties for a fix:

- add `--popsign-fresh5-training-smoke` to `scripts/evaluate_rawframe_model.py`;
- extend `evaluation_evidence_mode` and `generated_by` to emit
  `popsign_fresh5_training_smoke`;
- allow challenge-manifest omission for this bounded evidence mode;
- validate train/validation/test manifests via the existing PopSign fresh5
  repaired-manifest branch in `validate_manifest(..., allow_popsign_fresh5_label_set=True)`;
- preserve `rgb_regions` / `rgb_regions_grid_v1` as `B,T,R,C,H,W` during
  validation and test evaluation;
- keep final, lesson, reduced, region-grid, controlled-pilot, and controlled
  clip-heldout evaluation guards strict;
- require training provenance evidence mode `popsign_fresh5_training_smoke`
  for real PopSign fresh5 checkpoint evaluation;
- treat five labels, capped train/validation batches, and no challenge manifest
  as not-final PopSign fresh5 smoke evidence, not as final/lesson evidence;
- keep random initialization and `pretrained_components: []` checks strict;
- do not weaken final validation or calibrated-provenance gates.

3. Prove parser and contract compatibility without a checkpoint.

Run the intended PopSign fresh5 evaluation command against the planned output
paths and repaired manifests. Because no checkpoint should exist yet, an
acceptable probe result is either:

- `checkpoint does not exist: .../model_state.pt`; or
- an equivalent checkpoint/provenance missing error after the new flag is
  parsed.

An unacceptable result is:

- `unrecognized arguments: --popsign-fresh5-training-smoke`;
- rejection because challenge manifest is required;
- rejection because the repaired PopSign fresh5 label set is too small;
- rejection because decode provenance is required for this smoke;
- any path that would collapse region tensors instead of setting
  `preserve_region_axis` for evaluation.

The intended probe command is:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/evaluate_rawframe_model.py --checkpoint output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity/model_state.pt --training-provenance output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity/training-provenance.json --train-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json --validation-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json --test-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json --output-report output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity/validation-report.json --calibrated-provenance output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity/calibrated-provenance.json --batch-size 4 --num-workers 0 --popsign-fresh5-training-smoke
```

4. After the fix or blocker, write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-evaluation-invocation-contract-fix-v1.json`

The receipt must include:

- current commit and active prompt;
- exact files/symbols inspected and changed;
- M3CH evaluation blocker summary and receipt hash;
- exact pre-fix command and rejection;
- exact new or adapted evaluation probe command;
- `--help` proof that the new flag is present;
- parser/manifest/challenge/decode-provenance/region-axis compatibility result;
- whether the probe reaches checkpoint/provenance missing rather than argparse
  or manifest rejection;
- proof that final/lesson/reduced/region-grid/controlled evaluation guards were
  not globally loosened;
- proof that no training/fitting/backward/optimizer/checkpoint/Brev spend/
  source mutation/manifest mutation/tensor mutation/export/browser activation/
  model-card promotion/final-gate action occurred;
- exactly one next action.

5. Select exactly one next action:

- `continue_evaluation_invocation_contract_fix_no_training`: if the fix is
  partial or the probe still rejects the intended path with a concrete
  source-level blocker.
- `continue_compute_receipt_refresh_after_evaluation_contract_fix`: if the
  evaluation invocation contract now accepts the PopSign fresh5 evidence mode,
  preserves the region axis, and reaches only the expected missing-checkpoint
  blocker, so the compute receipt can be refreshed before any fitting.
- `continue_local_no_spend_train_sanity_receipt_preflight`: only if both
  training and evaluation command paths are compatible but another no-training
  local preflight is needed before fitting.
- `prepare_bounded_local_train_sanity_run_after_current_approval`: only if both
  command paths are compatible and a future prompt has an exact local fitting
  route with approval, caps, kill conditions, and artifact paths.
- `prepare_bounded_brev_training_run_after_current_approval_and_default_off_plan`:
  only if both command paths are compatible and a future prompt has an exact
  Brev route with approval, max spend/runtime, kill condition, duplicate-worker
  avoidance, copyback, and verified default-off cleanup.
- `continue_data_split_label_distribution_audit_no_mutation`: if command
  compatibility is sound but existing evidence makes data/split/label quality
  the next honest no-training blocker.
- `stop_for_human_training_budget_or_scope_decision`: if no non-wasteful next
  step can proceed without human budget, source, data, training, or scope
  approval.

## Hard Boundaries

- No training/fitting run, optimizer construction for fitting, optimizer step,
  backward pass, sweep, checkpoint creation, broad retry, fresh10 training,
  75/95-label training, or compute receipt execution.
- No Brev training, spend, worker lifecycle change, sync, remote command,
  teardown, or file copy. Read-only `brev ls --json` is allowed only if needed
  for state visibility.
- No source-register approval change, source import, media download, generated
  pseudo-labels, label expansion, manifest mutation, tensor write/rewrite, or
  overwrite of existing data artifacts.
- No pretrained detector, landmark, backbone, embedding, or model path.
- No ONNX export, browser model activation, active-label promotion,
  model-card promotion, final-readiness claim, final-gate weakening, product
  fallback detour, ASL correctness claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3CI prompt and names Mission 3CI.
2. The M3CH receipt exists, is valid JSON, selects
   `continue_evaluation_invocation_contract_fix_no_training`, and records the
   rejected evaluation parser probe.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-evaluation-invocation-contract-fix-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt records exact files/symbols inspected and changed, or a precise
   no-change blocker.
5. If code changes occur, `scripts/evaluate_rawframe_model.py --help` lists
   `--popsign-fresh5-training-smoke`.
6. The intended PopSign fresh5 evaluation probe no longer fails at argparse and
   does not require a challenge manifest, full final label count, final decode
   provenance, or flattened tensors for this smoke mode.
7. The receipt proves the evaluation mode preserves `B,T,R,C,H,W` region input
   for validation/test and records the expected not-final evidence status.
8. The receipt proves final/lesson/reduced/region-grid/controlled evaluation
   guards remain strict and no final claim was authorized.
9. The receipt proves no training/fitting/backward/optimizer/checkpoint/Brev
   spend/source mutation/manifest mutation/tensor mutation/export/browser
   activation/model-card promotion/final-gate action occurred.
10. The receipt selects exactly one next action from this prompt.
11. Required audits, JSON validation, relevant py-compile checks, and
    `git diff --check` exit `0` or record exact blockers.
12. A numbered session log records commands, evidence, blockers, and exactly
    one next action.

## Observer Guidance

- CONTINUE only if the evaluation-contract fix remains bounded, no-training/
  no-spend, and selects one bounded next action without approving a fitting run.
- NUDGE if the receipt lacks exact source guard evidence, help/probe proof,
  side-effect proof, guard-scope proof, region-axis proof, or exactly one next
  action.
- REDIRECT if the executor runs fitting/training, Brev exec/sync/lifecycle,
  source or tensor mutation, label expansion, export, browser activation,
  model-card promotion, final-gate changes, unsupported claim edits, or push.
- STOP if the fix proves no non-wasteful autonomous next step remains without
  human budget, source, training, or scope approval.
- ESCALATE only if the fix uncovers a new high-cost strategy decision not
  covered by observer-391, M3CC, M3CD, M3CE, M3CF, M3CG, or M3CH.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3CI PopSign fresh5 evaluation invocation contract fix.
Completed:            <evaluation contract fix or exact blocker>.
Evidence:             <receipt, M3CH receipt, commands, source evidence>.
Remaining:            <single next action>.
Blockers:             <none or exact parser/manifest/challenge/decode/region-axis blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
