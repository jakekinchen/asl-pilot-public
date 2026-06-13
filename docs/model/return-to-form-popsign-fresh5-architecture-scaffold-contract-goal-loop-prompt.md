# Return-To-Form PopSign Fresh5 Architecture Scaffold Contract Goal Loop Prompt

Mission 3CE prompt for the Codex executor after Mission 3CD selected
`continue_no_training_architecture_scaffold_contract`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one bounded local/no-spend, no-training architecture scaffold
contract for the M3CD proposal
`scratch_region_temporal_late_fusion_tcn_contract_v1`, or precisely block it.

The goal is to turn the reviewed design contract into a compile/no-grad source
scaffold that can be inspected before any training, fitting, optimizer,
checkpoint, Brev, export, browser activation, or promotion work.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3CD design review:
   - [`docs/validation/return-to-form-popsign-fresh5-architecture-optimization-design-review-v1.json`](../validation/return-to-form-popsign-fresh5-architecture-optimization-design-review-v1.json)
   - [`docs/session-logs/394-mission-3cd-popsign-fresh5-architecture-optimization-design-review.md`](../session-logs/394-mission-3cd-popsign-fresh5-architecture-optimization-design-review.md)
4. M3CC architecture/optimization research:
   - [`docs/validation/return-to-form-popsign-fresh5-architecture-optimization-research-v1.json`](../validation/return-to-form-popsign-fresh5-architecture-optimization-research-v1.json)
5. Existing model/input code:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
6. Prior comparison evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-model-input-training-loop-remediation-v1.json`](../validation/return-to-form-popsign-fresh5-model-input-training-loop-remediation-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json`](../validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json`](../validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json`](../validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json)
7. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3CD selected one from-scratch browser-compatible architecture/input contract:
preserve `rgb_regions` as `B,T,R,C,H,W`, encode each region/frame with a
shared scratch 2D encoder, apply temporal modeling per region before region
fusion, then fuse region streams with a lightweight learned-from-scratch
attention or late-fusion head.

M3CD requires the next slice to be scaffold/compile/no-grad/parameter-count
only. It explicitly does not authorize training, fitting, optimizer/backward
passes, checkpoints, Brev, source/data mutation, manifest/tensor mutation,
export, browser activation, model-card promotion, final-gate changes, or push.

Steering correction: the next scaffold must not hide the actual
dataset-to-training blocker behind another architecture-only step. The M3CC and
M3CD receipts did not explicitly address the M3CA train-mode versus eval-mode
gap (`0.664` peak train-mode accuracy, `0.56` final train-mode accuracy,
`0.464` eval train-all accuracy), nor did they explicitly discuss BatchNorm /
Dropout train/eval behavior. They also did not restate source roles clearly:
PopSign is the current local approved raw-video/tensor route; SemLex / ASL-LEX
is not an approved training source in this repo state and remains only a
candidate phonology/vocabulary-support route until source-register evidence and
a local overlap/phonology artifact exist. M3CE must record those facts in the
receipt even if the scaffold itself remains compile-only.

## Required Slice

Complete exactly one smallest useful architecture scaffold contract.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-architecture-optimization-design-review-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-architecture-optimization-research-v1.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/audit_popsign_fresh5_model_input_training_loop.py scripts/run_popsign_fresh5_learnability_isolation_probe.py scripts/decode_raw_videos.py scripts/materialize_popsign_fresh5_region_grid.py scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py scripts/materialize_popsign_fresh5_repaired_manifest.py
```

2. Inspect the existing architecture registry/build path in
   `scripts/train_rawframe_model.py`. If the smallest honest scaffold requires
   a helper script or focused compile-only check, keep it narrowly scoped and
   name it from the M3CE contract. Do not add a parallel training or audit
   system.

3. Add or precisely block the compile-only scaffold for
   `scratch_region_temporal_late_fusion_tcn_contract_v1`.

The scaffold must satisfy all applicable contract points:

- random initialization only;
- no pretrained detector, landmark, backbone, embedding, or sign model;
- named architecture id is selectable through the existing model-build surface
  or a deliberately narrow compile-only scaffold surface;
- accepts `rgb_regions` / region-grid input as `B,T,R,C,H,W`;
- does not fall back to `rgb_frames`;
- returns logits shaped `B,5` for the fresh5 vocabulary;
- reports parameter count and compares it with the M3CB `1290470` baseline,
  the M3CD target ceiling `2000000`, and hard ceiling `2500000`;
- performs at least one no-grad forward or equivalent compile-only shape check;
- constructs no optimizer, calls no backward pass, runs no fitting loop, and
  writes no checkpoint/model/tensor/manifest/export/browser/model-card artifact.
- records whether the new scaffold uses BatchNorm, Dropout, stochastic depth,
  data-dependent running statistics, or any other train/eval-sensitive layer;
  if it does, the receipt must explain the train/eval risk and require a future
  fitting receipt to log both train-mode and eval-mode train-all metrics. If it
  avoids those layers, the receipt must say so and name the normalization or
  regularization choices used instead.
- records the dataset-to-training compatibility state: PopSign fresh5 tensors
  are the scoped input, SemLex/ASL-LEX is not a training source for this slice,
  ASL Citizen/public sources cannot be substituted without their own source and
  manifest contract, and no source expansion is authorized.

4. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-architecture-scaffold-contract-v1.json`

The receipt must include:

- current commit and active prompt;
- exact files/symbols inspected and changed;
- exact commands;
- M3CD proposal id and selected next action;
- architecture id and from-scratch/no-pretrained dependency statement;
- input contract and shape assumptions;
- no-grad/compile-only forward result or exact blocker;
- parameter count, baseline comparison, and browser-size/runtime implications;
- train/eval-sensitive layer inventory covering BatchNorm, Dropout, running
  statistics, stochastic behavior, and how the scaffold avoids or contains the
  M3CA train-mode/eval-mode gap risk;
- dataset-to-training compatibility statement covering PopSign, SemLex/ASL-LEX,
  ASL Citizen/public data, and why none of those source roles authorize a blind
  training retry in this slice;
- proof that no optimizer/backward/training/checkpoint/export/browser/promotion
  action occurred;
- training/Brev/export/source/data/promotion authorization fields, all false;
- future receipt requirement before any fitting or Brev use;
- exactly one next action.

5. Select exactly one next action:

- `continue_no_training_architecture_scaffold_fix`: only if the scaffold is
  partially implemented but a concrete compile/shape/parameter-count blocker
  remains.
- `continue_no_training_parameter_or_shape_contract_review`: only if the
  scaffold compiles but parameter count, shape handling, or build-surface
  semantics need one more no-training review before any compute receipt.
- `prepare_separate_training_compute_receipt_after_scaffold_passes`: only if
  the scaffold passes compile/no-grad/parameter-count gates and any future
  fitting is still blocked behind a separate receipt with command, caps, kill
  conditions, artifact copyback, cleanup/default-off verification,
  duplicate-worker avoidance, and current human approval as applicable.
- `continue_data_split_label_distribution_audit_no_mutation`: only if scaffold
  work shows architecture shape is sound and data/split/label quality is now
  the more honest next no-training blocker.
- `continue_train_eval_normalization_contract_no_training`: only if the
  scaffold or existing true TCN evidence leaves BatchNorm, Dropout,
  train/eval mode, or running-stat behavior as the clearest unresolved
  no-training blocker before any fitting receipt.
- `continue_dataset_training_compatibility_audit_no_mutation`: only if the
  scaffold is shape-sound but source roles, PopSign/SemLex/ASL Citizen
  compatibility, label support, or manifest-to-training semantics are now the
  clearest blocker.
- `stop_for_human_architecture_budget_or_scope_decision`: if no non-wasteful
  local next step remains without human architecture, budget, data, source,
  label, or product-scope approval.

## Hard Boundaries

- No training/fitting run, optimizer step, backward pass, sweep, checkpoint
  creation, broad retry, fresh10 training, 75/95-label training, or compute
  receipt execution.
- No Brev training, spend, worker lifecycle change, sync, remote command, or
  teardown from this prompt beyond optional read-only `brev ls --json` for
  state visibility.
- No source-register approval change, source import, media download, generated
  pseudo-labels, label expansion, manifest mutation, tensor write/rewrite, or
  overwrite of existing artifacts.
- No pretrained detector, landmark, backbone, embedding, or model path.
- No ONNX export, browser model activation, active-label promotion,
  model-card promotion, final-readiness claim, final-gate weakening, product
  fallback detour, ASL correctness claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3CE prompt and names Mission 3CE.
2. The M3CD receipt exists, is valid JSON, selects
   `continue_no_training_architecture_scaffold_contract`, and names
   `scratch_region_temporal_late_fusion_tcn_contract_v1`.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-architecture-scaffold-contract-v1.json`
   or the session log records the exact blocker that prevented it.
4. The scaffold exists and is compile/no-grad/parameter-count checked, or a
   precise source-level blocker is recorded.
5. The receipt records architecture id, input contract, logits shape, parameter
   count or blocker, browser-size/runtime implications, and no-pretrained/
   from-scratch proof.
6. The receipt records the train/eval-sensitive layer inventory and explicitly
   addresses the M3CA train-mode/eval-mode gap, including BatchNorm and
   Dropout/running-stat risk or an explicit statement that the scaffold avoids
   those mechanisms.
7. The receipt records dataset-to-training compatibility for PopSign,
   SemLex/ASL-LEX, ASL Citizen/public sources, and confirms no source role
   change or blind training retry is authorized.
8. The receipt proves no training/fitting/backward/optimizer/checkpoint/Brev
   spend/source mutation/manifest mutation/tensor mutation/export/browser
   activation/model-card promotion/final-gate action occurred.
9. The receipt selects exactly one next action from this prompt.
10. Required audits, JSON validation, relevant py-compile checks, and
   `git diff --check` exit 0 or record exact blockers.
11. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE only if the scaffold contract is bounded, local/no-spend, no-training,
  and selects one bounded next action without approving a training run.
- NUDGE if the receipt lacks shape evidence, parameter-count evidence,
  from-scratch/no-pretrained proof, train/eval-sensitive layer inventory,
  BatchNorm/Dropout/running-stat discussion, dataset-to-training compatibility
  statement, guardrails, or exactly one next action.
- REDIRECT if the executor runs fitting/training, Brev, source or tensor
  mutation, label expansion, export, browser activation, model-card promotion,
  final-gate changes, unsupported claim edits, or push.
- STOP if the scaffold cannot identify any non-wasteful autonomous local step
  without human source, architecture, budget, label, or scope approval.
- ESCALATE only if the scaffold uncovers a new high-cost strategy decision not
  covered by observer-391, M3CC, or M3CD.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3CE PopSign fresh5 architecture scaffold contract.
Completed:            <scaffold contract, receipt, compile/no-grad proof>.
Evidence:             <receipt, M3CD receipt, commands, source evidence>.
Remaining:            <single next action>.
Blockers:             <none or exact architecture/shape/parameter/research/human blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
