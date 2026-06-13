# Return-To-Form PopSign Fresh5 Training Compute Receipt Goal Loop Prompt

Mission 3CF prompt for the Codex executor after Mission 3CE selected
`prepare_separate_training_compute_receipt_after_scaffold_passes`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one bounded local/no-spend, no-training compute receipt for a
future PopSign fresh5 fitting attempt using the M3CE scaffold, or precisely
block that receipt.

This mission prepares the contract that would make a later training run
reviewable. It must not execute the run. If the intended command is rejected by
the current training invocation guards, record that source-level blocker and
select the contract-fix next action instead of training.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3CE scaffold contract:
   - [`docs/validation/return-to-form-popsign-fresh5-architecture-scaffold-contract-v1.json`](../validation/return-to-form-popsign-fresh5-architecture-scaffold-contract-v1.json)
   - [`docs/session-logs/397-mission-3ce-popsign-fresh5-architecture-scaffold-contract.md`](../session-logs/397-mission-3ce-popsign-fresh5-architecture-scaffold-contract.md)
4. M3CD design review:
   - [`docs/validation/return-to-form-popsign-fresh5-architecture-optimization-design-review-v1.json`](../validation/return-to-form-popsign-fresh5-architecture-optimization-design-review-v1.json)
5. Prior train-signal evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json`](../validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-model-input-training-loop-remediation-v1.json`](../validation/return-to-form-popsign-fresh5-model-input-training-loop-remediation-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json`](../validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json)
6. Existing training and evaluation code, for inspection only:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
7. Source and manifest contracts:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json)
8. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3CE added
`scratch_region_temporal_late_fusion_tcn_contract_v1` to the existing
`build_model` surface and proved one compile-only/no-grad forward over
`B,T,R,C,H,W` input:

- checked input shape: `[2, 16, 5, 3, 96, 96]`;
- checked logits shape: `[2, 5]`;
- parameter count: `781918`, under the M3CD `2000000` target and `2500000`
  hard ceiling;
- train/eval-sensitive layer inventory: `0` BatchNorm modules, `0` Dropout
  modules, `0` running-stat modules, `10` GroupNorm modules, and `1`
  LayerNorm module;
- no optimizer, backward pass, fitting loop, checkpoint, Brev command, source
  mutation, manifest/tensor mutation, export, browser activation, model-card
  promotion, final-gate change, unsupported claim, or push occurred.

Important compatibility caution: the new scaffold is currently in
`ALLOWED_MODEL_ARCHITECTURES`, but not in `FINAL_MODEL_ARCHITECTURES`. The
future command must verify whether the intended training mode accepts
`scratch_region_temporal_late_fusion_tcn_contract_v1`. If final, lesson,
reduced, or controlled training guards reject it, this mission must record the
exact guard and select `continue_training_invocation_contract_fix_no_training`.

`brev ls --json` during the observer pass reported `asl-pilot-rawframe-001` /
`2hl1hytty` still `RUNNING`, `READY`, and `HEALTHY` on an A100. This mission
may refresh that read-only state for a compute receipt. It must not start,
stop, sync, exec, or otherwise change Brev worker state.

## Required Slice

Complete exactly one smallest useful compute receipt without training.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-architecture-scaffold-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-architecture-optimization-design-review-v1.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/audit_popsign_fresh5_model_input_training_loop.py scripts/run_popsign_fresh5_learnability_isolation_probe.py scripts/decode_raw_videos.py scripts/materialize_popsign_fresh5_region_grid.py scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py scripts/materialize_popsign_fresh5_repaired_manifest.py
```

2. Inspect, but do not run, the training invocation surface in
   `scripts/train_rawframe_model.py`.

The receipt must verify the exact planned command path for the M3CE
architecture. Prefer source inspection, `--help`, JSON validation, and
no-side-effect dry-run/check-files surfaces. Do not execute any command that
constructs an optimizer, calls backward, starts a fitting epoch, writes a
checkpoint, mutates tensors/manifests, or starts remote work. If there is no
safe command-compatibility check, say so and record the blocker.

3. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-training-compute-receipt-v1.json`

The receipt must include:

- current commit and active prompt;
- exact files/symbols inspected;
- exact commands run and exact commands intentionally not run;
- M3CE scaffold id and receipt hash;
- exact planned local sanity command and, if applicable, exact planned Brev
  command;
- command-compatibility result for
  `scratch_region_temporal_late_fusion_tcn_contract_v1`, including whether the
  current training mode accepts or rejects it;
- route selection: local no-spend sanity, Brev training, or blocked;
- current `brev ls --json` state, instance type, GPU, shell/health status, and
  duplicate-worker avoidance plan if any remote route is proposed;
- current listed price or a precise blocker if price cannot be obtained;
- max runtime, max spend, kill condition, and expected metric signal for any
  future remote route;
- expected artifacts, output directory, copyback paths, and cleanup/default-off
  verification steps for any future remote route;
- current human approval status and whether the receipt alone is sufficient to
  let a future prompt run the planned route;
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

- `continue_training_invocation_contract_fix_no_training`: if the intended
  command is rejected by `FINAL_MODEL_ARCHITECTURES` or another training guard,
  or if command compatibility cannot be verified without side effects.
- `continue_local_no_spend_train_sanity_receipt_preflight`: if the exact local
  no-spend sanity command is compatible but still needs one more no-training
  preflight before any fitting.
- `prepare_bounded_local_train_sanity_run_after_current_approval`: if the
  receipt fully specifies a local fitting run, the command is compatible, all
  no-spend/no-remote boundaries are clear, and current approval status permits
  a future prompt to run it.
- `prepare_bounded_brev_training_run_after_current_approval_and_default_off_plan`:
  if the receipt fully specifies a Brev route, current approval status permits
  a future prompt to run it, duplicate workers are avoided, and default-off /
  cleanup verification is explicit.
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

1. `GOAL.md` points at this M3CF prompt and names Mission 3CF.
2. The M3CE receipt exists, is valid JSON, selects
   `prepare_separate_training_compute_receipt_after_scaffold_passes`, and
   names `scratch_region_temporal_late_fusion_tcn_contract_v1`.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-training-compute-receipt-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt records exact planned command(s), local vs Brev route, Brev
   state if applicable, instance type/GPU, price or price blocker, max
   runtime/spend, kill condition, expected metric signal, artifacts, copyback,
   cleanup/default-off verification, duplicate-worker avoidance, and current
   human approval status.
5. The receipt verifies whether the planned training mode accepts
   `scratch_region_temporal_late_fusion_tcn_contract_v1`. If it is rejected by
   `FINAL_MODEL_ARCHITECTURES` or another guard, the receipt selects the
   no-training contract-fix next action rather than training.
6. The receipt carries forward the M3CD/M3CE/M3CA metric gates, including
   train-mode/eval-mode train-all metrics and `pen` / `thank_you` recall.
7. The receipt proves no training/fitting/backward/optimizer/checkpoint/Brev
   spend/source mutation/manifest mutation/tensor mutation/export/browser
   activation/model-card promotion/final-gate action occurred.
8. The receipt selects exactly one next action from this prompt.
9. Required audits, JSON validation, relevant py-compile checks, and
   `git diff --check` exit 0 or record exact blockers.
10. A numbered session log records commands, evidence, blockers, and exactly
    one next action.

## Observer Guidance

- CONTINUE only if the compute receipt is bounded, no-training/no-spend, and
  selects one bounded next action without itself executing a training run.
- NUDGE if the receipt lacks exact commands, compatibility proof, Brev state,
  price/cost/caps/kill conditions, artifact/copyback/cleanup fields,
  duplicate-worker avoidance, approval status, metric gates, or exactly one
  next action.
- REDIRECT if the executor runs fitting/training, Brev exec/sync/lifecycle,
  source or tensor mutation, label expansion, export, browser activation,
  model-card promotion, final-gate changes, unsupported claim edits, or push.
- STOP if the receipt proves no non-wasteful autonomous next step remains
  without human budget, source, training, or scope approval.
- ESCALATE only if the receipt uncovers a new high-cost strategy decision not
  covered by observer-391, M3CC, M3CD, or M3CE.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3CF PopSign fresh5 training compute receipt.
Completed:            <compute receipt or exact blocker>.
Evidence:             <receipt, M3CE receipt, commands, source evidence>.
Remaining:            <single next action>.
Blockers:             <none or exact command/guard/Brev/budget/human blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
