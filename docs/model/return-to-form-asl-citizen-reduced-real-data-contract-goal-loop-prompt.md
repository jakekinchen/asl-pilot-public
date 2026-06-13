# Return-To-Form ASL Citizen Reduced Real-Data Contract Goal Loop Prompt

Mission prompt for the Codex executor after Mission 3AO. Read
[`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Add an explicit no-training script contract for the seven-label real ASL
Citizen reduced module so future dry-runs do not misuse
`--allow-small-label-set`, and so the reduced module is never confused with
strict 25-label lesson-milestone evidence or final 75-100 label evidence.

This is a local/no-spend script-contract slice. It may change validation or
dry-run code paths and receipts. It must not run classifier training, Detector
0 training, Brev commands, source import, export, promotion, or browser
activation.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. Mission 3AO receipt:
   [`docs/validation/return-to-form-asl-citizen-high-signal-module-manifest-gates-v1.json`](../validation/return-to-form-asl-citizen-high-signal-module-manifest-gates-v1.json).
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

Mission 3AO materialized the seven-label reduced manifests and verified their
provenance. The train script dry-run without reduced-module support exits with:

```text
Manifest validation failed: final training requires --train-manifest data/manifests/train.json
```

Do not solve this by using `--allow-small-label-set`; that flag is documented
for synthetic wiring tests and is not an honest contract for this real
external-source module.

## Required First Slice

Complete one local/no-spend script-contract slice.

1. Run quick state checks:

```sh
git status --short --branch
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
```

2. Inspect the manifest validation contract in `scripts/train_rawframe_model.py`
   and any shared evaluation checks in `scripts/evaluate_rawframe_model.py`.

3. Add the smallest explicit reduced-real-data mode needed to validate the
   reduced ASL Citizen manifests for dry-run/check-files without weakening
   final or lesson-milestone gates. The mode must:

- accept only a bounded 5-10 label real-data module;
- keep strict source-register, external-source, signer-disjoint, tensor, and
  decode-provenance validation;
- reject final-readiness or lesson-milestone promotion claims;
- keep `--allow-small-label-set` synthetic-only.

4. Run only no-training validation/dry-run commands. Do not run a training
   epoch.

5. Write or update a tracked receipt under `docs/validation/` that records the
   script contract, command, output, hashes, hard boundaries, and exactly one
   next action.

6. Update the tactical overlay in
   [`docs/model/return-to-form-plan.md`](return-to-form-plan.md) with the
   contract receipt and exactly one next action.

7. Write a numbered session log and commit only scoped script/evidence/doc
   files.

## Hard Boundaries

- No Brev sync, exec, training, stop spam, worker delete, worker reset,
  duplicate worker creation, or paid compute.
- Do not run classifier or Detector 0 training.
- Do not import sources, generate pseudo-labels, or use pretrained detectors,
  landmarks, backbones, embeddings, or generated-label dependencies.
- Do not export ONNX, promote thresholds, update the model card to trained,
  activate browser recognition, or claim final readiness.
- Do not weaken final 75-100 gates, strict 25-label lesson-milestone gates, or
  the full 17-type hard-negative gate.

## Acceptance Criteria

This milestone can close when:

1. The reduced real-data script contract exists and is distinct from
   `--allow-small-label-set`, `--lesson-milestone`, and final evidence modes.
2. A no-training dry-run/check-files command validates the high-signal manifests
   or records a precise remaining local blocker.
3. A tracked receipt records command output, hashes, boundaries, and exactly
   one next action.
4. The tactical overlay names the receipt and exactly one next action.
5. Required local audits and `git diff --check` pass.
6. A numbered session log records commands, evidence, blockers, and next step.

## Observer Guidance

- CONTINUE only if the script-contract receipt is incomplete and the next step
  remains local/no-spend.
- NUDGE if the executor uses `--allow-small-label-set` as a shortcut for real
  ASL Citizen data or weakens final/lesson gates.
- STOP if the selected next action requires Brev/provider auth, paid compute,
  source approval, human data collection, final-gate changes, or a user
  decision.
- REDIRECT only if the user explicitly changes the plan.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        ASL Citizen reduced real-data script contract.
Completed:            <script contract completed>.
Evidence:             <contract receipt and command output>.
Remaining:            <single next action>.
Blockers:             <none or exact script/data/provider blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
