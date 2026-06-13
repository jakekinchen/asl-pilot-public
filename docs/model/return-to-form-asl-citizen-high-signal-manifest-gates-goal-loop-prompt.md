# Return-To-Form ASL Citizen High-Signal Manifest Gates Goal Loop Prompt

Mission prompt for the Codex executor after Mission 3AN. Read
[`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Materialize the selected high-signal ASL Citizen module into reduced
train/validation/test manifests and gate receipts before any reduced-module
training command is allowed.

This is a local/no-spend pretraining slice. It must only filter existing
approved ASL Citizen lesson manifests and preserve their source, tensor, signer,
and decode provenance. It must not run classifier training, Detector 0
training, Brev commands, source import, export, promotion, or browser
activation.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. Mission 3AN selection:
   [`docs/validation/return-to-form-asl-citizen-high-signal-module-selection-v1.json`](../validation/return-to-form-asl-citizen-high-signal-module-selection-v1.json).
5. Existing strict ASL Citizen lesson manifests:
   - [`data/manifests/lesson/rawframe-milestone/train.json`](../../data/manifests/lesson/rawframe-milestone/train.json)
   - [`data/manifests/lesson/rawframe-milestone/validation.json`](../../data/manifests/lesson/rawframe-milestone/validation.json)
   - [`data/manifests/lesson/rawframe-milestone/test.json`](../../data/manifests/lesson/rawframe-milestone/test.json)
6. Training/evaluation script contracts:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
7. Pair runbooks:
   - [`docs/runbooks/codex-goal-loop.md`](../runbooks/codex-goal-loop.md)
   - [`docs/runbooks/observer-runbook-codex.md`](../runbooks/observer-runbook-codex.md)

## Current Evidence

Mission 3AN selected seven labels:

```text
table, please, black, hello, uncle, white, sad
```

The selection is evidence-backed but weak: only `table` is strong, and the
remaining six labels have nonzero but low validation/test recall. The selected
next action is:

```text
materialize_high_signal_module_manifests_and_gates
```

## Required First Slice

Complete one local/no-spend manifest/gate slice.

1. Run quick state checks:

```sh
git status --short --branch
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
```

2. Generate reduced manifests by filtering the existing strict ASL Citizen
   lesson manifests to the selected labels only. Suggested target directory:

```text
data/manifests/lesson/high-signal-module/
```

3. Preserve source and tensor provenance from the parent manifests. Do not
   rewrite clip ids, signer ids, source ids, tensor paths, tensor hashes, or
   decode provenance except for manifest-level metadata that must identify the
   reduced module.

4. Write
   `docs/validation/return-to-form-asl-citizen-high-signal-module-manifest-gates-v1.json`
   with:

- selected labels and parent selection artifact hash;
- train/validation/test clip counts and signer counts;
- per-label support by split;
- parent manifest hashes and reduced manifest hashes;
- proof that all reduced clips come from approved ASL Citizen raw-video
  manifests;
- script-contract status for later reduced-module training;
- local smoke gates copied or refined from the M3AN selection artifact;
- hard boundaries.

5. If `scripts/train_rawframe_model.py` cannot honestly dry-run a real
   reduced ASL Citizen module without misusing a synthetic-only flag, record
   that as a script-contract blocker in the receipt and select exactly one
   no-training next action. Do not loosen `--lesson-milestone` or use
   `--allow-small-label-set` as a shortcut unless the receipt proves that path
   is semantically valid for this reduced real-data module.

6. Update the tactical overlay in
   [`docs/model/return-to-form-plan.md`](return-to-form-plan.md) with the
   reduced manifest receipt and exactly one next action.

7. Write a numbered session log and commit only scoped evidence/manifest/doc
   files.

## Hard Boundaries

- No Brev sync, exec, training, stop spam, worker delete, worker reset,
  duplicate worker creation, or paid compute.
- Do not run classifier or Detector 0 training.
- Do not import sources, generate pseudo-labels, or use pretrained detectors,
  landmarks, backbones, embeddings, or generated-label dependencies.
- Do not export ONNX, promote thresholds, update the model card to trained,
  activate browser recognition, or claim final readiness.
- Do not weaken the full 17-type hard-negative gate.
- Do not silently reinterpret `--lesson-milestone` as reduced-module final
  evidence; this reduced module is learnability evidence only.

## Acceptance Criteria

This milestone can close when:

1. Reduced manifests exist only for the selected M3AN labels and only from
   existing approved ASL Citizen lesson manifest clips.
2. A tracked manifest/gate receipt records hashes, counts, provenance, script
   contract status, gates, boundaries, and exactly one next action.
3. The tactical overlay names the reduced manifest receipt and exactly one next
   action.
4. Required local audits and `git diff --check` pass.
5. A numbered session log records commands, evidence, blockers, and next step.

## Observer Guidance

- CONTINUE only if the manifest/gate receipt is incomplete and the next step
  remains local/no-spend.
- NUDGE if the executor rewrites provenance, pads labels, or treats the
  reduced module as final evidence.
- STOP if the selected next action requires Brev/provider auth, paid compute,
  source approval, human data collection, final-gate changes, or a user
  decision.
- REDIRECT only if the user explicitly changes the plan.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        ASL Citizen high-signal manifest gates.
Completed:            <manifest/gate materialization completed>.
Evidence:             <manifest/gate receipt and reduced manifest paths>.
Remaining:            <single next action>.
Blockers:             <none or exact data/source/script/provider blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
