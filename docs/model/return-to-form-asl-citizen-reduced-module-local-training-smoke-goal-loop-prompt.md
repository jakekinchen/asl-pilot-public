# Return-To-Form ASL Citizen Reduced Module Local Training Smoke Goal Loop Prompt

Mission 3AQ prompt for the Codex executor after Mission 3AP. Read
[`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run the first honest model-learning slice for the seven-label ASL Citizen
high-signal module without misusing synthetic-small-label flags or paid Brev
compute. Add the smallest explicit training-smoke contract needed to train the
approved reduced module from random initialization on the repo-local MPS
environment, record metrics, and choose exactly one next action.

This is not a promotion mission. It is a learnability probe for the reduced
module. The browser model remains fail-closed unless later validation gates
justify promotion.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   the Original Plan Spine and M3AN-M3AP evidence.
4. Reduced module evidence:
   - [`docs/validation/return-to-form-asl-citizen-high-signal-module-selection-v1.json`](../validation/return-to-form-asl-citizen-high-signal-module-selection-v1.json)
   - [`docs/validation/return-to-form-asl-citizen-high-signal-module-manifest-gates-v1.json`](../validation/return-to-form-asl-citizen-high-signal-module-manifest-gates-v1.json)
   - [`docs/validation/return-to-form-asl-citizen-reduced-real-data-contract-v1.json`](../validation/return-to-form-asl-citizen-reduced-real-data-contract-v1.json)
5. Reduced manifests:
   - [`data/manifests/lesson/high-signal-module/train.json`](../../data/manifests/lesson/high-signal-module/train.json)
   - [`data/manifests/lesson/high-signal-module/validation.json`](../../data/manifests/lesson/high-signal-module/validation.json)
   - [`data/manifests/lesson/high-signal-module/test.json`](../../data/manifests/lesson/high-signal-module/test.json)
6. Script contracts:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
7. Pair runbooks:
   - [`docs/runbooks/codex-goal-loop.md`](../runbooks/codex-goal-loop.md)
   - [`docs/runbooks/observer-runbook-codex.md`](../runbooks/observer-runbook-codex.md)

## Current Evidence

Mission 3AP added `--reduced-real-data-module` as a no-training
`--dry-run --check-files` validation mode. It passed on the high-signal module
and correctly rejects non-dry-run use. The selected next action was
`stop_for_reduced_module_training_scope_decision`.

The current local repo environment can import PyTorch from `.venv/bin/python`
and sees MPS:

```text
torch 2.12.0
cuda available False
mps available True
```

Brev is not currently usable from this shell because `brev ls --json` exits at
the login prompt with EOF. Do not start paid compute in this mission. Record
the auth blocker only if you check it.

## Required First Slice

Complete one local training-smoke slice.

1. Run quick state checks:

```sh
git status --short --branch
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
.venv/bin/python - <<'PY'
import torch
print(torch.__version__)
print(torch.cuda.is_available())
print(torch.backends.mps.is_available())
PY
python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
```

2. Inspect `scripts/train_rawframe_model.py` and
   `scripts/evaluate_rawframe_model.py`.

3. Add the smallest explicit reduced-module training-smoke mode needed for
   this real ASL Citizen module. Recommended flag name:
   `--reduced-real-data-training-smoke`.

The mode must:

- be distinct from `--allow-small-label-set`,
  `--reduced-real-data-module`, `--lesson-milestone`, and final evidence;
- accept only the exact high-signal train/validation/test manifests;
- require `--check-files`;
- keep source-register, external-source, signer-disjoint, tensor-hash, decode
  provenance, and no-pretrained validation;
- allow a local non-dry-run training smoke from random initialization;
- write binary model artifacts only under ignored `output/`, not tracked
  `artifacts/`;
- record `pretrained_components: []` and random-initialization digest evidence;
- reject final-readiness, lesson-milestone, ONNX export, model-card promotion,
  threshold promotion, and browser activation claims.

4. Run a no-training dry-run with the new mode.

5. If the dry-run passes and `.venv/bin/python` sees MPS, run one bounded local
   MPS smoke against all reduced-module clips. Use a small command such as:

```sh
.venv/bin/python scripts/train_rawframe_model.py \
  --train-manifest data/manifests/lesson/high-signal-module/train.json \
  --validation-manifest data/manifests/lesson/high-signal-module/validation.json \
  --test-manifest data/manifests/lesson/high-signal-module/test.json \
  --output-dir output/m3aq-reduced-module-local-smoke \
  --model-id asl-pilot-asl-citizen-high-signal-local-smoke-v1 \
  --architecture motion_2d_temporal_cnn \
  --check-files \
  --epochs 3 \
  --batch-size 8 \
  --frame-count 12 \
  --image-size 96 \
  --learning-rate 0.001 \
  --training-augmentation mild \
  --checkpoint-selection best_validation \
  --num-workers 0 \
  --reduced-real-data-training-smoke
```

You may lower epochs or batch size if local runtime or MPS memory requires it.
Do not run an unbounded sweep.

6. If a model artifact is written, run the narrowest relevant evaluation
   available through existing scripts. If evaluation needs a small script
   contract extension for the same reduced-module mode, add it narrowly. Do
   not implement a parallel evaluator.

7. Write a tracked receipt under `docs/validation/` that records:

- commands and exit codes;
- environment/device;
- manifest hashes and label list;
- training history and selected checkpoint metrics;
- test metrics if evaluation ran, or a precise no-eval reason;
- binary artifact path under `output/` and why it is intentionally ignored;
- no-pretrained evidence;
- Brev auth state if checked;
- exactly one next action.

8. Update [`docs/model/return-to-form-plan.md`](return-to-form-plan.md) with
   the M3AQ result and exactly one next action.

9. Write a numbered session log and commit only scoped script/evidence/doc
   files.

## Hard Boundaries

- No Brev sync, exec, training, spend, stop spam, worker delete/reset, or
  duplicate worker creation in this mission.
- Do not use `--allow-small-label-set` for real ASL Citizen data.
- Do not train Detector 0, import sources, generate pseudo-labels, or use
  pretrained detectors, landmarks, backbones, embeddings, or generated-label
  dependencies.
- Do not write binary checkpoints under tracked `artifacts/`.
- Do not export ONNX, promote thresholds, update the browser model card to
  trained, activate browser recognition, push, or claim final readiness.
- Do not broaden to 25, 75, 80, or 95 labels.

## Acceptance Criteria

This milestone can close when:

1. The reduced-module training-smoke contract exists and is distinct from all
   synthetic/final/lesson evidence modes.
2. The high-signal manifests pass the new dry-run/check-files path.
3. A bounded local MPS training smoke either completes with tracked metrics or
   records a precise environment/script blocker.
4. Test/evaluation either runs through existing evaluator contracts or records
   the exact missing contract as the next action.
5. A tracked receipt records commands, metrics, hashes, boundaries, blockers,
   and exactly one next action.
6. The tactical overlay names the receipt and exactly one next action.
7. Required local audits and `git diff --check` pass.
8. A numbered session log records commands, evidence, blockers, and next step.

## Observer Guidance

- CONTINUE only if the training-smoke receipt is incomplete and the next step
  remains local/no-spend.
- NUDGE if the executor uses `--allow-small-label-set`, writes binary model
  artifacts into tracked paths, skips source/decode/no-pretrained gates, or
  overclaims product readiness.
- STOP if the selected next action requires Brev/provider auth, paid compute,
  source approval, final-gate changes, or a user decision.
- ESCALATE before approving repeated speculative training retries if the
  training smoke fails to learn after data/tensor audits pass.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        ASL Citizen reduced module local training smoke.
Completed:            <training-smoke contract and/or bounded local run>.
Evidence:             <receipt, command output, metrics, artifact paths>.
Remaining:            <single next action>.
Blockers:             <none or exact script/env/provider blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
