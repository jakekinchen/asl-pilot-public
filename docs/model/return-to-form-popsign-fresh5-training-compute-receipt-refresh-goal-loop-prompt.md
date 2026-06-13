# Return-To-Form PopSign Fresh5 Training Compute Receipt Refresh Goal Loop Prompt

Mission 3CH prompt for the Codex executor after Mission 3CG selected
`continue_compute_receipt_refresh_after_invocation_contract_fix`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one bounded local/no-spend, no-training compute receipt
refresh for a future PopSign fresh5 fitting attempt using the M3CE scaffold and
the M3CG invocation contract, or precisely block that refresh.

This mission updates the M3CF compute envelope now that the
`--popsign-fresh5-training-smoke` dry-run/check-files path accepts
`scratch_region_temporal_late_fusion_tcn_contract_v1`. It must not execute the
non-dry-run fitting command. It must not run Brev exec/sync/lifecycle commands
or spend remote compute.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3CG invocation-contract fix:
   - [`docs/validation/return-to-form-popsign-fresh5-training-invocation-contract-fix-v1.json`](../validation/return-to-form-popsign-fresh5-training-invocation-contract-fix-v1.json)
   - [`docs/session-logs/401-mission-3cg-popsign-fresh5-training-invocation-contract-fix.md`](../session-logs/401-mission-3cg-popsign-fresh5-training-invocation-contract-fix.md)
4. M3CF compute receipt and session log:
   - [`docs/validation/return-to-form-popsign-fresh5-training-compute-receipt-v1.json`](../validation/return-to-form-popsign-fresh5-training-compute-receipt-v1.json)
   - [`docs/session-logs/399-mission-3cf-popsign-fresh5-training-compute-receipt.md`](../session-logs/399-mission-3cf-popsign-fresh5-training-compute-receipt.md)
5. M3CE scaffold contract:
   - [`docs/validation/return-to-form-popsign-fresh5-architecture-scaffold-contract-v1.json`](../validation/return-to-form-popsign-fresh5-architecture-scaffold-contract-v1.json)
6. Prior train-signal evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json`](../validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-model-input-training-loop-remediation-v1.json`](../validation/return-to-form-popsign-fresh5-model-input-training-loop-remediation-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json`](../validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json)
7. Existing training and evaluation code, for inspection only except for
   no-side-effect dry-runs:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
8. Source and manifest contracts:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json)
9. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3CG added a dedicated `--popsign-fresh5-training-smoke` invocation contract.
The accepted no-side-effect command was:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json --validation-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json --test-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json --output-dir output/m3cf-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-local-sanity --model-id asl-pilot-popsign-fresh5-scratch-region-temporal-late-fusion-tcn-v1 --architecture scratch_region_temporal_late_fusion_tcn_contract_v1 --popsign-fresh5-training-smoke --dry-run --check-files --frame-count 16 --image-size 96 --epochs 1 --batch-size 4 --learning-rate 0.001 --optimizer adamw --weight-decay 0.0 --training-augmentation none --max-train-batches 1 --max-validation-batches 1 --num-workers 0
```

It exited `0`, reported `training_status: dry_run_only`, preserved the
`rgb_regions` region axis, loaded the repaired train/validation/test manifests
with 125 clips and five labels each, and created no output directory,
checkpoint, tensor, or manifest artifact.

M3CG also proved that the old M3CF `--region-grid-tcn-training-smoke` command
still rejects the M3CE architecture, and that final-mode training still rejects
the M3CE architecture because it is not listed in `FINAL_MODEL_ARCHITECTURES`.

`brev ls --json` during observer review reported `asl-pilot-rawframe-001` /
`2hl1hytty` still `RUNNING`, `READY`, and `HEALTHY` on an A100. This mission
may refresh that read-only state for a compute receipt. It must not start,
stop, sync, exec, or otherwise change Brev worker state.

## Required Slice

Complete exactly one smallest useful compute receipt refresh without training.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-training-invocation-contract-fix-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-training-compute-receipt-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-architecture-scaffold-contract-v1.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/audit_popsign_fresh5_model_input_training_loop.py scripts/run_popsign_fresh5_learnability_isolation_probe.py scripts/decode_raw_videos.py scripts/materialize_popsign_fresh5_region_grid.py scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py scripts/materialize_popsign_fresh5_repaired_manifest.py
```

2. Refresh command compatibility from M3CF using the M3CG flag.

The receipt should rerun or cite a fresh no-side-effect
`--dry-run --check-files` command using `--popsign-fresh5-training-smoke`.
It may inspect `--help` and the source guards. It must not execute the same
command without `--dry-run`, and must not execute any command that constructs
an optimizer for fitting, calls backward, starts a fitting epoch, writes a
checkpoint, mutates tensors/manifests, or starts remote work.

Before selecting any future fitting route, explicitly inspect evaluation
compatibility too. A future checkpoint is not useful unless
`scripts/evaluate_rawframe_model.py` can evaluate the same evidence mode and
preserve the same `B,T,R,C,H,W` region axis. If evaluation currently lacks a
PopSign fresh5 mode or would collapse region tensors back to flat frames, the
receipt must choose the evaluation-contract-fix next action rather than a
local or Brev training action.

3. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-training-compute-receipt-refresh-v1.json`

The receipt must include:

- current commit and active prompt;
- exact files/symbols inspected;
- exact commands run and exact commands intentionally not run;
- M3CG invocation-contract receipt hash and M3CF compute receipt hash;
- exact compatible dry-run command and result;
- exact planned local fitting command, explicitly marked not run;
- exact planned Brev command only if a remote route is fully selected; otherwise
  record that no Brev command is selected;
- command-compatibility result for
  `scratch_region_temporal_late_fusion_tcn_contract_v1` using
  `--popsign-fresh5-training-smoke`;
- evaluation-compatibility result for the same architecture/provenance mode,
  including whether `scripts/evaluate_rawframe_model.py` can accept
  `popsign_fresh5_training_smoke`, skip inappropriate final/negative gates,
  and preserve `B,T,R,C,H,W` during validation/test evaluation;
- exact planned evaluation command, explicitly marked not run, or a precise
  blocker selecting an evaluation invocation-contract fix before training;
- route selection: local no-spend sanity, Brev training, blocked pending human
  approval, or blocked pending another no-training preflight;
- current `brev ls --json` state, instance type, GPU, shell/health status, and
  duplicate-worker avoidance plan;
- current listed price or a precise blocker if price cannot be obtained inside
  this prompt's read-only Brev boundary;
- max runtime, max spend, kill condition, and expected metric signal for any
  future local or remote fitting route;
- expected artifacts, output directory, copyback paths, and cleanup/default-off
  verification steps for any future route;
- current human approval status and whether this receipt alone is sufficient
  to let a future prompt run the planned route;
- metrics gates carried forward from M3CD/M3CE/M3CA:
  tiny one-clip-per-label sanity near `0.99` accuracy / `0.05` loss,
  fresh5 train-all at least `0.8` accuracy and `0.75` macro F1, signer-disjoint
  validation/test at least `0.5` top-1 and `0.4` macro F1, `pen` and
  `thank_you` recall tracked explicitly, train-mode and eval-mode train-all
  metrics logged, and early stops for metric collapse or class-specific
  failure;
- proof that this mission did not run training/fitting/backward/optimizer/
  checkpoint/Brev spend/source mutation/manifest mutation/tensor mutation/
  export/browser activation/model-card promotion/final-gate action;
- exactly one next action.

4. Select exactly one next action:

- `continue_compute_receipt_refresh_after_invocation_contract_fix`: if the
  refreshed receipt is partial or a required no-training field remains missing.
- `continue_local_no_spend_train_sanity_receipt_preflight`: if the exact local
  no-spend sanity command is compatible but still needs one more no-training
  preflight before any fitting.
- `continue_evaluation_invocation_contract_fix_no_training`: if training
  invocation is compatible but evaluation cannot yet accept the PopSign fresh5
  evidence mode or cannot preserve the region axis for the M3CE architecture.
- `prepare_bounded_local_train_sanity_run_after_current_approval`: if the
  receipt fully specifies a local fitting run, both training and evaluation
  commands are compatible, all no-spend/no-remote boundaries are clear, and
  current approval status permits a future prompt to run it.
- `prepare_bounded_brev_training_run_after_current_approval_and_default_off_plan`:
  if the receipt fully specifies a Brev route, both training and evaluation
  commands are compatible, current approval status permits a future prompt to
  run it, duplicate workers are avoided, and default-off / cleanup verification
  is explicit.
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
  teardown, or file copy. Only read-only `brev ls --json` is allowed for state
  visibility.
- No source-register approval change, source import, media download, generated
  pseudo-labels, label expansion, manifest mutation, tensor write/rewrite, or
  overwrite of existing artifacts.
- No pretrained detector, landmark, backbone, embedding, or model path.
- No ONNX export, browser model activation, active-label promotion,
  model-card promotion, final-readiness claim, final-gate weakening, product
  fallback detour, ASL correctness claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3CH prompt and names Mission 3CH.
2. The M3CG receipt exists, is valid JSON, selects
   `continue_compute_receipt_refresh_after_invocation_contract_fix`, and
   records an accepted no-side-effect `--popsign-fresh5-training-smoke`
   dry-run/check-files command.
3. The M3CF receipt exists, is valid JSON, and records the pre-fix rejected
   `--region-grid-tcn-training-smoke` command.
4. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-training-compute-receipt-refresh-v1.json`
   or the session log records the exact blocker that prevented it.
5. The receipt records exact planned command(s), local vs Brev route, Brev
   state, instance type/GPU, price or price blocker, max runtime/spend, kill
   condition, expected metric signal, artifacts, copyback, cleanup/default-off
   verification, duplicate-worker avoidance, and current human approval status.
6. The receipt verifies that the planned no-side-effect command accepts
   `scratch_region_temporal_late_fusion_tcn_contract_v1` with
   `--popsign-fresh5-training-smoke`, and records the non-dry-run fitting
   command as intentionally not run.
7. The receipt verifies whether the planned evaluation path can accept the
   PopSign fresh5 evidence mode and preserve the region axis, and must not
   select a future fitting action if evaluation still requires a no-training
   invocation-contract fix.
8. The receipt carries forward the M3CD/M3CE/M3CA metric gates, including
   train-mode/eval-mode train-all metrics and `pen` / `thank_you` recall.
9. The receipt proves no training/fitting/backward/optimizer/checkpoint/Brev
   spend/source mutation/manifest mutation/tensor mutation/export/browser
   activation/model-card promotion/final-gate action occurred.
10. The receipt selects exactly one next action from this prompt.
11. Required audits, JSON validation, relevant py-compile checks, and
    `git diff --check` exit 0 or record exact blockers.
12. A numbered session log records commands, evidence, blockers, and exactly
    one next action.

## Observer Guidance

- CONTINUE only if the receipt refresh is bounded, no-training/no-spend, and
  selects one bounded next action without itself executing a training run.
- NUDGE if the receipt lacks exact commands, compatibility proof, Brev state,
  evaluation-compatibility proof, price/cost/caps/kill conditions, artifact/
  copyback/cleanup fields, duplicate-worker avoidance, approval status, metric
  gates, or exactly one next action.
- REDIRECT if the executor runs fitting/training, Brev exec/sync/lifecycle,
  source or tensor mutation, label expansion, export, browser activation,
  model-card promotion, final-gate changes, unsupported claim edits, or push.
- STOP if the receipt proves no non-wasteful autonomous next step remains
  without human budget, source, training, or scope approval.
- ESCALATE only if the refresh uncovers a new high-cost strategy decision not
  covered by observer-391, M3CC, M3CD, M3CE, M3CF, or M3CG.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3CH PopSign fresh5 training compute receipt refresh.
Completed:            <compute receipt refresh or exact blocker>.
Evidence:             <receipt, M3CG receipt, M3CF receipt, commands, Brev state>.
Remaining:            <single next action>.
Blockers:             <none or exact command/Brev/price/budget/human blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
