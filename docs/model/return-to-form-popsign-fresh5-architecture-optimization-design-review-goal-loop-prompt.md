# Return-To-Form PopSign Fresh5 Architecture/Optimization Design Review Goal Loop Prompt

Mission 3CD prompt for the Codex executor after Mission 3CC selected
`propose_architecture_optimization_design_review_no_training`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one bounded local/no-spend, no-training PopSign fresh5
architecture/optimization design review from the M3CC research packet, or
precisely block it.

The goal is to turn the ranked M3CC hypotheses into one concrete reviewed
from-scratch proposal and validation contract, without implementing training,
running fitting, using Brev, mutating data, exporting, or activating browser
recognition.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3CC architecture/optimization research:
   - [`docs/validation/return-to-form-popsign-fresh5-architecture-optimization-research-v1.json`](../validation/return-to-form-popsign-fresh5-architecture-optimization-research-v1.json)
   - [`docs/session-logs/392-mission-3cc-popsign-fresh5-architecture-optimization-research.md`](../session-logs/392-mission-3cc-popsign-fresh5-architecture-optimization-research.md)
4. Observer-391 API memo:
   - [`artifacts/research/observer-391-popsign-fresh5-architecture-strategy-api-response.md`](../../artifacts/research/observer-391-popsign-fresh5-architecture-strategy-api-response.md)
5. M3CB/M3CA/M3BV/M3BU comparison evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-model-input-training-loop-remediation-v1.json`](../validation/return-to-form-popsign-fresh5-model-input-training-loop-remediation-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json`](../validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json`](../validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json`](../validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json)
6. Existing model/input code, for inspection only:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
7. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3CC ranked the top remaining hypotheses as optimization schedule or
regularization mismatch, capacity or inductive-bias mismatch, temporal modeling
weakness, region/crop target insufficiency, signer-disjoint data scarcity,
class-specific `pen` / `thank_you` failures, and browser deployment
constraints. It selected exactly one next action:
`propose_architecture_optimization_design_review_no_training`.

M3CC explicitly did not authorize training, Brev, export, browser activation,
source expansion, pseudo-labeling, crop implementation, data mutation, model
promotion, or final-gate changes.

## Required Slice

Complete exactly one smallest useful no-training design review.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-architecture-optimization-research-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-model-input-training-loop-remediation-v1.json >/dev/null
python3 -m json.tool artifacts/research/observer-391-popsign-fresh5-architecture-strategy-api-request.json >/dev/null
python3 -m json.tool artifacts/research/observer-391-popsign-fresh5-architecture-strategy-api-raw.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/audit_popsign_fresh5_model_input_training_loop.py scripts/run_popsign_fresh5_learnability_isolation_probe.py scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/decode_raw_videos.py scripts/materialize_popsign_fresh5_region_grid.py scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py scripts/materialize_popsign_fresh5_repaired_manifest.py
```

Do not run Brev commands in this mission except read-only `brev ls --json` if
needed for state visibility. Do not stop, start, sync, or execute remote
commands from this prompt.

2. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-architecture-optimization-design-review-v1.json`

The receipt must include:

- exact input artifacts and hashes;
- exact commands;
- current commit and active prompt;
- the chosen design proposal, or the precise blocker preventing one;
- comparison against at least three M3CC alternatives;
- from-scratch/no-pretrained dependency statement;
- browser-size and browser-runtime constraints;
- input contract and tensor shape assumptions;
- expected train-sanity, relaxed/signer-overlap, signer-disjoint, and
  class-specific `pen` / `thank_you` validation criteria for a future separate
  run;
- early stop/kill conditions for any future fitting attempt;
- a separate future compute/validation receipt requirement before training or
  Brev;
- rejected options and why they remain blocked;
- explicit no-training/no-Brev/no-export/no-browser/no-promotion language;
- exactly one next action.

An optional companion Markdown design note may be written under `docs/model/`
if it summarizes the JSON receipt, but the JSON receipt is the binding artifact.

3. Select exactly one next action:

- `continue_no_training_architecture_scaffold_contract`: only if the design
  review names a concrete from-scratch architecture/input contract that can be
  scaffolded or compile-checked later without fitting.
- `continue_crop_region_target_contract_audit_no_training`: only if the design
  review concludes crop/region-target adequacy must be audited before
  architecture work.
- `continue_data_split_label_distribution_audit_no_mutation`: only if split,
  signer/source distribution, or class-specific label quality must be audited
  before architecture work.
- `prepare_separate_training_compute_receipt_after_reviewed_change`: only if a
  concrete reviewed change is fully specified and any training remains for a
  separate future receipt with command, caps, kill conditions, artifact
  copyback, cleanup, and current human approval as applicable.
- `stop_for_human_architecture_budget_or_scope_decision`: if the design review
  cannot select a non-wasteful local next step without human architecture,
  budget, crop, source, label, or product-scope approval.

## Hard Boundaries

- No training/fitting run, optimizer step, backward pass, sweep, checkpoint
  creation, broad retry, fresh10 training, 75/95-label training, or compute
  receipt execution.
- No Brev training, spend, worker lifecycle change, sync, remote command, or
  teardown from this prompt beyond optional read-only `brev ls --json`.
- No source-register approval change, source import, media download, generated
  pseudo-labels, label expansion, manifest mutation, tensor write/rewrite, or
  overwrite of existing artifacts.
- No pretrained detector, landmark, backbone, embedding, or model path.
- No ONNX export, browser model activation, active-label promotion,
  model-card promotion, final-readiness claim, final-gate weakening, product
  fallback detour, ASL correctness claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3CD prompt and names Mission 3CD.
2. The M3CC receipt exists, is valid JSON, and selects
   `propose_architecture_optimization_design_review_no_training`.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-architecture-optimization-design-review-v1.json`
   or the session log records the exact blocker that prevented it.
4. The design review names one concrete proposal or records a precise blocker.
5. The receipt compares that proposal against at least three rejected
   alternatives from M3CC.
6. The receipt records browser-size/runtime constraints, input-contract
   assumptions, train-sanity criteria, held-out criteria, class-specific
   criteria, and early stop conditions for any future separate fitting attempt.
7. The receipt rejects pretrained/public-dataset/pseudo-label/Brev/export/
   browser-promotion shortcuts.
8. The receipt selects exactly one next action from this prompt.
9. No training/fitting/backward/optimizer/checkpoint/Brev spend/source
   mutation/manifest mutation/tensor mutation/export/browser activation/
   model-card promotion/final-gate action occurs.
10. Required audits, JSON validation, relevant py-compile checks, and
    `git diff --check` exit 0 or record exact blockers.
11. A numbered session log records commands, evidence, blockers, and exactly
    one next action.

## Observer Guidance

- CONTINUE only if the design review is bounded, local/no-spend, no-training,
  and selects one bounded next action without approving a training run.
- NUDGE if the receipt lacks a concrete proposal, alternative comparison,
  browser/input constraints, future validation criteria, rejected-action
  guardrails, or exactly one next action.
- REDIRECT if the executor runs fitting/training, Brev, source or tensor
  mutation, label expansion, export, browser activation, model-card promotion,
  final-gate changes, unsupported claim edits, or push.
- STOP if the review cannot identify any non-wasteful autonomous local step
  without human source, annotation, crop, label, architecture, budget, or scope
  approval.
- ESCALATE only if the design review raises a new high-cost strategy decision
  not covered by observer-391 or M3CC.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3CD PopSign fresh5 architecture/optimization design review.
Completed:            <design review, receipt, optional companion memo>.
Evidence:             <receipt, M3CC receipt, API memo, commands, source evidence>.
Remaining:            <single next action>.
Blockers:             <none or exact architecture/data/crop/research/human blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
