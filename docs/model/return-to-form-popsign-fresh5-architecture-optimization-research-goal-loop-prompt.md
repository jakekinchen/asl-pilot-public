# Return-To-Form PopSign Fresh5 Architecture/Optimization Research Goal Loop Prompt

Mission 3CC prompt for the Codex executor after Mission 3CB selected
`continue_no_training_architecture_or_optimization_research` and the observer
escalated with current API strategy research.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one bounded local/no-spend, no-training PopSign fresh5
architecture/optimization research packet from existing M3CA/M3CB/M3BV/M3BU
evidence, or precisely block it.

This is a review-only planning mission. It must convert the M3CB result into a
source-grounded strategy packet that explains which from-scratch,
browser-compatible architecture, optimization, input-family, crop/region-target,
or data-distribution hypotheses remain plausible. It is not a fitting mission,
not a compute planning mission, not source expansion, and not browser
activation.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. Observer escalation memo:
   - [`artifacts/research/observer-391-popsign-fresh5-architecture-strategy-api-response.md`](../../artifacts/research/observer-391-popsign-fresh5-architecture-strategy-api-response.md)
   - [`artifacts/research/observer-391-popsign-fresh5-architecture-strategy-api-prompt.md`](../../artifacts/research/observer-391-popsign-fresh5-architecture-strategy-api-prompt.md)
4. M3CB model/input/training-loop remediation audit:
   - [`docs/validation/return-to-form-popsign-fresh5-model-input-training-loop-remediation-v1.json`](../validation/return-to-form-popsign-fresh5-model-input-training-loop-remediation-v1.json)
   - [`docs/session-logs/390-mission-3cb-popsign-fresh5-model-input-remediation-audit.md`](../session-logs/390-mission-3cb-popsign-fresh5-model-input-remediation-audit.md)
   - [`scripts/audit_popsign_fresh5_model_input_training_loop.py`](../../scripts/audit_popsign_fresh5_model_input_training_loop.py)
5. M3CA/M3BV/M3BU comparison evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json`](../validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json`](../validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json)
   - [`docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json`](../validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json)
6. Existing model/input code, only for inspection:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - related helpers only as needed.
7. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3CB ruled out the concrete local defects requested by the prior prompt at the
current evidence level:

- repaired train/validation/test manifests use the same five labels;
- train split is balanced at 25 clips per label;
- `RawFrameClipDataset(... preserve_region_axis=True)` consumes `rgb_regions`;
- prepared model input is `B,T,R,C,H,W`, shape `[5,16,5,3,96,96]`;
- dtype is `torch.float32` and values are in `[0,1]`;
- no `rgb_frames` fallback occurred;
- `true_temporal_convnet_region_grid` built for five classes;
- logits shape is `[5,5]`;
- `CrossEntropyLoss` received int64 targets `0..4`;
- no concrete label-target, dtype, shape, no-grad, normalization,
  device/dtype, loss-shape, or optimizer omission defect was found.

M3BV proved the same preserved-region family can memorize one deterministic
clip per label. M3CA expanded to the 125-clip repaired train split and failed
train sanity under the local cap: train-all accuracy `0.464`, train-all macro
F1 `0.4548505303760849`, signer-disjoint validation/test accuracy `0.256` /
`0.328`, `pen` test recall `0.04`, and `thank_you` test prediction fraction
`0.048`. M3CA train loss still fell from `1.8743968796730042` to
`0.9130748319625854`, so the path is learning something but not enough under
the current architecture/cap.

The observer API memo recommends one local/no-spend, no-training
architecture/optimization research packet. It does not authorize training,
Brev, export, browser activation, source expansion, data mutation,
pseudo-labeling, or promotion.

## Required Slice

Complete exactly one smallest useful no-training architecture/optimization
research packet.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-model-input-training-loop-remediation-v1.json >/dev/null
python3 -m json.tool artifacts/research/observer-391-popsign-fresh5-architecture-strategy-api-request.json >/dev/null
python3 -m json.tool artifacts/research/observer-391-popsign-fresh5-architecture-strategy-api-raw.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/audit_popsign_fresh5_model_input_training_loop.py scripts/run_popsign_fresh5_learnability_isolation_probe.py scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/decode_raw_videos.py scripts/materialize_popsign_fresh5_region_grid.py scripts/run_popsign_fresh5_region_grid_tcn_tiny_overfit.py scripts/materialize_popsign_fresh5_repaired_manifest.py
```

Do not run Brev commands in this mission except read-only `brev ls --json` if
needed for state visibility. Do not stop, start, sync, or execute remote
commands from this prompt.

2. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-architecture-optimization-research-v1.json`

The receipt must include:

- exact input artifacts and hashes;
- exact commands;
- current commit and active prompt;
- source-supported observations from M3CA/M3CB/M3BV/M3BU;
- a separate inference/hypothesis section;
- rejected actions and why each is currently blocked;
- a ranked hypothesis table covering at least:
  - optimization schedule or regularization mismatch;
  - model capacity or inductive-bias mismatch;
  - temporal modeling weakness;
  - region-grid/crop target insufficiency;
  - signer-disjoint generalization or data scarcity;
  - class-specific failures, especially `pen` and `thank_you`;
  - browser deployment constraints;
- a ranked option table of allowed from-scratch directions, such as:
  - improved small raw-RGB temporal CNN/TCN family;
  - region-fusion alternatives;
  - stricter augmentation/regularization plan for later review;
  - curriculum or diagnostic-first training plan for later approval;
  - crop/region contract audit as a later local diagnostic;
- a rejected-option table explicitly excluding:
  - pretrained CV/sign/landmark/model dependencies;
  - public dataset training without legal/source review;
  - pseudo-labeling;
  - media import or source expansion;
  - blind training retries;
  - browser activation, export, or model-card promotion;
- explicit no-training/no-Brev/no-export/no-browser/no-promotion language;
- exactly one next action.

An optional companion Markdown packet may be written under `docs/model/` if it
summarizes the JSON receipt, but the JSON receipt is the binding artifact.

3. Select exactly one next action:

- `propose_local_crop_region_target_contract_audit_no_training`: only if the
  research packet concludes crop/region-target adequacy is the most likely
  next local blocker and can be audited without mutating data.
- `propose_local_data_split_label_distribution_audit_no_mutation`: only if the
  packet concludes split/generalization, label distribution, or signer/source
  distribution remains the clearest local blocker.
- `propose_architecture_optimization_design_review_no_training`: only if the
  packet concludes a more detailed no-training design review is needed before
  selecting any implementation or compute step.
- `request_separate_training_receipt_after_specific_reviewed_change`: only if
  the packet identifies a concrete reviewed change and still leaves any
  training for a separate future compute/validation receipt with human approval
  as applicable. This prompt does not authorize running that training.
- `stop_no_nonwasteful_next_action`: if the packet cannot identify a useful
  local/no-spend next step without human source, annotation, architecture,
  budget, or product-scope approval.

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

1. `GOAL.md` points at this M3CC prompt and names Mission 3CC.
2. The M3CB receipt exists, is valid JSON, and selects
   `continue_no_training_architecture_or_optimization_research`.
3. The observer-391 API request, raw response, and response memo exist and are
   valid where applicable.
4. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-architecture-optimization-research-v1.json`
   or the session log records the exact blocker that prevented it.
5. The packet separates source-supported observations, inference/hypotheses,
   rejected actions, allowed local/no-spend options, and browser/Brev/source
   guardrails.
6. The receipt identifies at least three plausible
   architecture/optimization/input-family hypotheses still consistent with the
   evidence, or records why that is impossible.
7. The receipt rejects pretrained/landmark/public-dataset/pseudo-label/browser
   promotion shortcuts.
8. The receipt selects exactly one next action from this prompt.
9. No training/fitting/backward/optimizer/checkpoint/Brev spend/source
   mutation/manifest mutation/tensor mutation/export/browser activation/
   model-card promotion/final-gate action occurs.
10. Required audits, JSON validation, relevant py-compile checks, and
    `git diff --check` exit 0 or record exact blockers.
11. A numbered session log records commands, evidence, blockers, and exactly
    one next action.

## Observer Guidance

- CONTINUE only if the packet is bounded, local/no-spend, no-training, and
  selects one bounded next action without approving a training run.
- NUDGE if the receipt lacks source-supported observations, inference
  separation, ranked hypotheses, rejected-action guardrails, or exactly one
  next action.
- REDIRECT if the executor runs fitting/training, Brev, source or tensor
  mutation, label expansion, export, browser activation, model-card promotion,
  final-gate changes, unsupported claim edits, or push.
- STOP if the packet cannot identify any non-wasteful autonomous local step
  without human source, annotation, crop, label, architecture, budget, or scope
  approval.
- ESCALATE only if the packet raises a new high-cost strategy decision not
  covered by the observer-391 memo.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3CC PopSign fresh5 architecture/optimization research packet.
Completed:            <research packet, receipt, optional companion memo>.
Evidence:             <receipt, API memo, commands, file/source evidence>.
Remaining:            <single next action>.
Blockers:             <none or exact architecture/data/crop/research/human blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
