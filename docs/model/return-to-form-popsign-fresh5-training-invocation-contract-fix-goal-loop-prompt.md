# Return-To-Form PopSign Fresh5 Training Invocation Contract Fix Goal Loop Prompt

Mission 3CG prompt for the Codex executor after Mission 3CF selected
`continue_training_invocation_contract_fix_no_training`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one bounded local/no-spend, no-training invocation-contract
fix for the PopSign fresh5 repaired-manifest path using the M3CE scaffold, or
precisely block it.

The goal is to make the intended PopSign fresh5 `--dry-run --check-files`
compatibility path reviewable for
`scratch_region_temporal_late_fusion_tcn_contract_v1` without launching
training. This mission may edit the training invocation guard surface if needed,
but it must not run fitting, construct an optimizer for fitting, call backward,
write checkpoints, spend Brev, export, promote, or change final claims.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3CF compute receipt and session log:
   - [`docs/validation/return-to-form-popsign-fresh5-training-compute-receipt-v1.json`](../validation/return-to-form-popsign-fresh5-training-compute-receipt-v1.json)
   - [`docs/session-logs/399-mission-3cf-popsign-fresh5-training-compute-receipt.md`](../session-logs/399-mission-3cf-popsign-fresh5-training-compute-receipt.md)
4. M3CE scaffold contract:
   - [`docs/validation/return-to-form-popsign-fresh5-architecture-scaffold-contract-v1.json`](../validation/return-to-form-popsign-fresh5-architecture-scaffold-contract-v1.json)
5. Existing training and evaluation code:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
6. Repaired manifest package:
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json)
7. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3CF wrote a no-training compute receipt and proved that the intended PopSign
fresh5 preserved-region dry-run is blocked before any fitting:

```text
Manifest validation failed: region-grid TCN training smoke requires --architecture true_temporal_convnet_region_grid
```

The receipt found:

- `scratch_region_temporal_late_fusion_tcn_contract_v1` is present in
  `ALLOWED_MODEL_ARCHITECTURES`;
- it is not present in `FINAL_MODEL_ARCHITECTURES`;
- `--region-grid-tcn-training-smoke` accepts only
  `true_temporal_convnet_region_grid`;
- that mode is still hard-coded to the older
  `data/manifests/lesson/high-signal-region-grid/*.json` manifests and
  `output/m3aw-region-grid-tcn-local-smoke` output path;
- the rejected dry-run exited before manifest validation completed, before
  `run_training`, before optimizer construction for fitting, before backward,
  and before checkpoint creation.

M3CF selected exactly one next action:
`continue_training_invocation_contract_fix_no_training`.

## Required Slice

Complete exactly one smallest useful no-training invocation-contract fix, or
record the exact blocker.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-training-compute-receipt-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-architecture-scaffold-contract-v1.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/audit_popsign_fresh5_model_input_training_loop.py scripts/run_popsign_fresh5_learnability_isolation_probe.py scripts/decode_raw_videos.py scripts/materialize_popsign_fresh5_region_grid.py scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py scripts/materialize_popsign_fresh5_repaired_manifest.py
```

2. Inspect the M3CF blocker in `scripts/train_rawframe_model.py`. Fix only the
   invocation contract needed for PopSign fresh5 repaired manifests and
   `scratch_region_temporal_late_fusion_tcn_contract_v1`, or record why that
   cannot be done safely in one slice.

Preferred properties for a fix:

- keep final, lesson, reduced, and controlled broad training guards strict;
- do not blindly add the M3CE scaffold to global final-training approval;
- add or adapt a bounded PopSign fresh5 preserved-region dry-run/training-smoke
  contract that can accept the M3CE scaffold only with the repaired PopSign
  fresh5 manifests, explicit output path, source/manifest checks, and existing
  no-pretrained boundaries;
- preserve `rgb_regions` / `rgb_regions_grid_v1` as `B,T,R,C,H,W`;
- preserve `--dry-run --check-files` as a no-side-effect compatibility proof;
- avoid creating output directories or checkpoints during dry-run;
- keep the later fitting path blocked behind a future compute receipt refresh
  and current approval.

3. After the fix or blocker, write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-training-invocation-contract-fix-v1.json`

The receipt must include:

- current commit and active prompt;
- exact files/symbols inspected and changed;
- M3CF blocker summary and receipt hash;
- exact command that failed in M3CF;
- exact new or adapted dry-run command;
- dry-run/check-files compatibility result, including exit code and whether any
  output directory, checkpoint, tensor, or manifest artifact was created;
- whether the fix changes `FINAL_MODEL_ARCHITECTURES`, final/lesson/reduced/
  controlled training guards, `--region-grid-tcn-training-smoke`, or a new
  PopSign-specific mode;
- proof that the fix is scoped to PopSign fresh5 repaired manifests and the
  M3CE architecture, or exact blocker explaining why not;
- proof that no training/fitting/backward/optimizer/checkpoint/Brev spend/
  source mutation/manifest mutation/tensor mutation/export/browser activation/
  model-card promotion/final-gate action occurred;
- exactly one next action.

4. Select exactly one next action:

- `continue_training_invocation_contract_fix_no_training`: if the contract fix
  is partial or the dry-run still rejects the intended path with a concrete
  source-level blocker.
- `continue_compute_receipt_refresh_after_invocation_contract_fix`: if the
  dry-run/check-files path now accepts the PopSign fresh5 repaired manifests and
  M3CE architecture without side effects, so M3CF's compute receipt must be
  refreshed with the compatible command before any fitting.
- `continue_local_no_spend_train_sanity_receipt_preflight`: only if the
  invocation contract is fixed and a separate no-training preflight remains
  necessary before refreshing compute.
- `continue_data_split_label_distribution_audit_no_mutation`: only if the
  invocation contract is fixed but existing evidence makes data/split/label
  quality the next honest no-training blocker.
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

1. `GOAL.md` points at this M3CG prompt and names Mission 3CG.
2. The M3CF receipt exists, is valid JSON, selects
   `continue_training_invocation_contract_fix_no_training`, and records the
   rejected dry-run guard.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-training-invocation-contract-fix-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt records exact files/symbols inspected and changed, or a precise
   no-change blocker.
5. If code changes occur, the no-side-effect dry-run/check-files compatibility
   command for PopSign fresh5 repaired manifests and the M3CE architecture
   exits 0, or the receipt records the exact remaining rejection.
6. The receipt proves the fix does not globally loosen final/lesson/reduced/
   controlled training guards and does not authorize fitting, Brev, export, or
   promotion.
7. The receipt proves no training/fitting/backward/optimizer/checkpoint/Brev
   spend/source mutation/manifest mutation/tensor mutation/export/browser
   activation/model-card promotion/final-gate action occurred.
8. The receipt selects exactly one next action from this prompt.
9. Required audits, JSON validation, relevant py-compile checks, and
   `git diff --check` exit 0 or record exact blockers.
10. A numbered session log records commands, evidence, blockers, and exactly
    one next action.

## Observer Guidance

- CONTINUE only if the invocation-contract fix remains bounded, no-training/
  no-spend, and selects one bounded next action without approving a fitting run.
- NUDGE if the receipt lacks exact source guard evidence, dry-run proof,
  side-effect proof, guard-scope proof, or exactly one next action.
- REDIRECT if the executor runs fitting/training, Brev exec/sync/lifecycle,
  source or tensor mutation, label expansion, export, browser activation,
  model-card promotion, final-gate changes, unsupported claim edits, or push.
- STOP if the fix proves no non-wasteful autonomous next step remains without
  human budget, source, training, or scope approval.
- ESCALATE only if the fix uncovers a new high-cost strategy decision not
  covered by observer-391, M3CC, M3CD, M3CE, or M3CF.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3CG PopSign fresh5 training invocation contract fix.
Completed:            <invocation contract fix or exact blocker>.
Evidence:             <receipt, M3CF receipt, commands, source evidence>.
Remaining:            <single next action>.
Blockers:             <none or exact guard/manifest/output/human blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
