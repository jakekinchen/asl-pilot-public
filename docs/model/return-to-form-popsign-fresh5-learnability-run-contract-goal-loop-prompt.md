# Return-To-Form PopSign Fresh5 Learnability Run Contract Goal Loop Prompt

Mission 3CJ prompt for the Codex executor after Mission 3CI fixed evaluation
compatibility and the supervisor recorded local PopSign fresh5 train/eval sanity
evidence.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one bounded PopSign fresh5 learnability-run contract slice, or
precisely block it.

The current PopSign fresh5 repaired-manifest path now trains and evaluates end
to end, but the only strict mode is `--popsign-fresh5-training-smoke`, which is
intentionally capped too tightly to test learnability. Do not switch datasets
again for this slice. Add or precisely specify a separate non-final
learnability-run contract that can make a meaningful 5-label attempt while
preserving the existing clean-lane guards.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3CI evaluation contract receipt:
   - [`docs/validation/return-to-form-popsign-fresh5-evaluation-invocation-contract-fix-v1.json`](../validation/return-to-form-popsign-fresh5-evaluation-invocation-contract-fix-v1.json)
   - [`docs/session-logs/406-mission-3ci-popsign-fresh5-evaluation-invocation-contract-fix.md`](../session-logs/406-mission-3ci-popsign-fresh5-evaluation-invocation-contract-fix.md)
4. Local train/eval sanity receipt:
   - [`docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json`](../validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json)
   - [`docs/session-logs/407-supervisor-popsign-fresh5-local-train-eval-sanity.md`](../session-logs/407-supervisor-popsign-fresh5-local-train-eval-sanity.md)
5. Existing training and evaluation code:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
6. Repaired manifest package:
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/manifest-contract.json)

## Current Evidence

Resolved:

- PopSign fresh5 repaired manifests validate.
- Region-grid tensors load into the scratch region-temporal model with
  `B,T,R,C,H,W` preserved.
- Local MPS training writes a random-init checkpoint and provenance.
- Evaluation accepts `--popsign-fresh5-training-smoke` and writes a non-final
  report.

Not resolved:

- The bounded smoke artifact is near random: test top-1 `0.2`, macro F1
  `0.06666666666666668`, passes targets `false`.
- Current smoke caps prevent a meaningful learning attempt: output dir is fixed,
  epochs are capped to `2`, batch size to `4`, train batches to `12`, validation
  batches to `8`.
- Codex CLI pair reactivation hit a usage limit. Continue from filesystem truth
  if the pair is unavailable.

## Required Slice

Complete one of these, in order of preference:

1. Add a separate PopSign fresh5 learnability mode to training and evaluation,
   for example `--popsign-fresh5-learnability-smoke`, with:
   - same repaired train/validation/test manifests;
   - same scratch region-temporal architecture;
   - random initialization only;
   - no pretrained components;
   - region-axis preservation required;
   - a separate output directory under `output/`;
   - caps large enough to test learning, such as 10-20 epochs and full train/
     validation pass or explicit max batches covering all 125 clips;
   - non-final evidence mode and non-final report finality;
   - final/lesson/controlled/reduced/region-grid gates unchanged.
2. If code changes are too risky for one slice, write a precise contract design
   receipt that names the exact flags, caps, output paths, kill conditions,
   local/Brev route, and copyback/default-off rules for the next executor.
3. If even the contract is blocked, record the exact blocker and stop.

After adding a code contract, run local no-spend verification first:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
```

Then run the new command only if the prompt and code explicitly bound it. Do not
run Brev until the local command, max runtime, max spend, kill condition,
copyback, duplicate-worker check, and default-off cleanup are recorded.

## Hard Boundaries

- No final/lesson/browser/model-card promotion.
- No pretrained detector, landmark, backbone, embedding, or model path.
- No source-register approval change, source import, media download,
  pseudo-label generation, manifest mutation, tensor mutation, or label
  expansion.
- No broad sweep. One bounded local learnability run is allowed only if the new
  contract caps it explicitly.
- No Brev spend unless a future prompt or this prompt records exact current
  approval, max spend, max runtime, kill condition, copyback, duplicate-worker
  avoidance, and default-off cleanup. If in doubt, stay local/no-spend.
- No push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3CJ prompt and names Mission 3CJ.
2. M3CI and local train/eval sanity receipts are valid JSON.
3. The executor either adds a bounded learnability-run contract or writes a
   precise blocker explaining why it cannot.
4. Existing PopSign fresh5 smoke, final, lesson, reduced, region-grid,
   controlled-pilot, and controlled-clip-heldout guards remain distinct.
5. If code changes occur, relevant help output lists the new flag and
   py-compile passes.
6. If a local learnability run occurs, the receipt records exact command,
   artifact hashes, train/validation/test metrics, runtime device, and whether
   learning rose above random.
7. The receipt proves no Brev spend, source mutation, manifest mutation, tensor
   mutation, pretrained dependency, export, browser activation, model-card
   promotion, final-gate action, unsupported claim, or push occurred.
8. The receipt selects exactly one next action.
9. Required audits, JSON validation, relevant py-compile checks, and
   `git diff --check` exit `0` or record exact blockers.
10. A numbered session log records commands, evidence, blockers, and exactly
    one next action.

## Next Action Choices

- `run_bounded_local_popsign_fresh5_learnability_after_contract`
- `prepare_bounded_brev_popsign_fresh5_learnability_after_local_signal`
- `continue_learnability_contract_fix_no_training`
- `continue_data_or_split_diagnosis_after_learnability_failure`
- `stop_for_human_budget_scope_or_codex_usage_limit`

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3CJ PopSign fresh5 learnability run contract.
Completed:            <contract, run, or exact blocker>.
Evidence:             <receipt, commands, metrics, artifacts>.
Remaining:            <single next action>.
Blockers:             <none or exact blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
