# Return-To-Form PopSign Fresh5 Invocation Output Guard Fix Goal Loop Prompt

Mission 3DC prompt for the Codex executor after Mission 3DB selected
`continue_bounded_local_fit_readiness_review_no_training` because the no-training
PopSign fresh5 smoke invocation surface rejects the new scaffold architecture
and fresh output directory.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training invocation/output guard fix so
the PopSign fresh5 `--popsign-fresh5-training-smoke --dry-run --check-files`
surface can preflight the M3DA scratch scaffold architecture against a fresh
ignored output directory.

This is a narrow command-surface repair. Do not fit, train, run backward,
construct a fitting optimizer, create checkpoints, run Brev, export, activate
the browser model, promote labels, change claim surfaces, mutate source/
manifests/tensors, weaken final gates, or push.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. Mission 3DB blocker evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-bounded-local-fit-readiness-review-v1.json`](../validation/return-to-form-popsign-fresh5-bounded-local-fit-readiness-review-v1.json)
   - [`docs/session-logs/444-mission-3db-popsign-fresh5-fit-readiness-review.md`](../session-logs/444-mission-3db-popsign-fresh5-fit-readiness-review.md)
4. Mission 3DA scaffold evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-scaffold-v1.json`](../validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-scaffold-v1.json)
   - [`docs/session-logs/442-mission-3da-popsign-fresh5-scaffold.md`](../session-logs/442-mission-3da-popsign-fresh5-scaffold.md)
5. Mission 3CZ contract packet and Mission 3CY design review.
6. Current train/eval code and fail-closed claim surfaces:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
7. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Required Slice

Complete exactly one bounded guard repair.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-bounded-local-fit-readiness-review-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-scaffold-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-contract-v1.json >/dev/null
```

2. Inspect the M3DB receipt and current guard code. The exact blockers to
   resolve or precisely preserve are:

- `--architecture scratch_motion_region_token_temporal_contract_v1` is rejected
  by `--popsign-fresh5-training-smoke`;
- `--output-dir output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit`
  is rejected by the PopSign fresh5 smoke output allowlist.

3. Make the smallest source change needed, probably in
   [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py).
   The preferred repair is:

- allow `scratch_motion_region_token_temporal_contract_v1` for the PopSign
  fresh5 training-smoke mode;
- add the fresh ignored output directory
  `output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit`
  to the PopSign fresh5 training-smoke output policy;
- preserve existing repaired-manifest path, frame-count, image-size, batch,
  epoch, max-batch, num-workers, augmentation, and `--check-files` guards;
- preserve old `scratch_region_temporal_late_fusion_tcn_contract_v1` dry-run
  compatibility for the existing M3CF/M3CR output directories;
- do not add the new scaffold architecture to `FINAL_MODEL_ARCHITECTURES`
  unless the session log gives a source-supported reason. Final/promoted
  training guards must remain stricter than this research smoke mode.

4. Prove the fix with no-training checks only. The new preflight must exit `0`:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py \
  --train-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json \
  --validation-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json \
  --test-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json \
  --output-dir output/m3dc-popsign-fresh5-scratch-motion-region-token-temporal-local-fit \
  --model-id asl-pilot-popsign-fresh5-m3dc-local-fit-motion-region-token-temporal \
  --architecture scratch_motion_region_token_temporal_contract_v1 \
  --popsign-fresh5-training-smoke \
  --check-files \
  --dry-run \
  --frame-count 16 \
  --image-size 96 \
  --epochs 12 \
  --batch-size 4 \
  --learning-rate 0.001 \
  --optimizer adamw \
  --weight-decay 0.0 \
  --training-augmentation none \
  --checkpoint-selection best_validation \
  --max-train-batches 32 \
  --max-validation-batches 32 \
  --num-workers 0
```

5. Also prove retained compatibility with at least one old PopSign fresh5 smoke
   dry-run using `scratch_region_temporal_late_fusion_tcn_contract_v1` and an
   existing allowed M3CF or M3CR output directory.

6. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-invocation-output-guard-fix-v1.json`

The receipt must include:

- current HEAD and changed files;
- source-supported observations separated from inference;
- exact guard/code changes;
- the M3DB blockers and their resolved/remaining status;
- the new dry-run command result;
- old-path compatibility result;
- proof that no training/fitting/backward/fitting optimizer/checkpoint, Brev,
  source/manifest/tensor mutation, pretrained dependency, export, browser
  activation, model-card promotion, active-label promotion, final-gate
  weakening, unsupported claim, or push occurred;
- proof that browser recognition remains fail-closed;
- exactly one selected next action.

7. Select exactly one next action:

- `draft_bounded_local_fit_after_invocation_guard_no_brev`: if the new dry-run
  preflight and old-path compatibility pass and one bounded local/no-spend fit
  prompt is now justified.
- `continue_invocation_output_guard_fix_no_training`: if the guard repair is
  incomplete or blocked.
- `continue_evaluation_invocation_guard_review_no_training`: if the training
  preflight is fixed but a no-training evaluation invocation blocker must be
  resolved before drafting the fit prompt.
- `stop_for_human_training_scope_or_code_path_decision`: if the next meaningful
  change requires human approval.
- `stop_scratch_recognizer_lane`: if no defensible no-pretrained,
  browser-viable scratch route remains.

## Hard Boundaries

- No training, fitting, optimizer construction for fitting, backward pass,
  checkpoint creation, sweep, second local retry, fresh10 training, 75/95-label
  training, or learned auxiliary diagnostic model.
- No Brev training, spend, worker lifecycle change, sync, remote command,
  teardown, file copy, or remote planning beyond optional read-only visibility.
- No tensor regeneration, manifest mutation, source-register mutation,
  vocabulary/label-set mutation, source import, media download, generated
  pseudo-label, source approval edit, or split mutation.
- No pretrained detector, landmark, backbone, embedding, model dependency,
  generated-label dependency, or pretrained-assisted data labeling.
- No ONNX export, browser model activation, active-label promotion,
  model-card promotion, final-readiness claim, final-gate weakening, product
  fallback that implies live ASL recognition, ASL correctness claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3DC prompt and names Mission 3DC.
2. The M3DB receipt exists, parses, and its invocation/output blockers are
   reviewed.
3. The guard repair is implemented or precisely blocked.
4. The new M3DC dry-run/check-files command exits `0`, or the receipt records
   the exact remaining blocker.
5. At least one old PopSign fresh5 dry-run path remains accepted, or the
   receipt records the exact compatibility blocker.
6. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-invocation-output-guard-fix-v1.json`
   or the session log records the exact blocker that prevented it.
7. The receipt does not approve Brev, export, promotion, source/data/tensor
   mutation, final-gate change, or browser recognition claims.
8. Browser model claims remain fail-closed.
9. Required audits, py_compile, receipt JSON validation, relevant no-training
   dry-runs, and `git diff --check` exit `0` or record exact blockers.
10. A numbered session log records commands, evidence, blockers, changed files,
    and exactly one next action.

## Observer Guidance

- CONTINUE if the executor resolves the invocation/output guard in scope,
  proves the no-training dry-runs, preserves fail-closed claims, writes the
  receipt/log, and selects exactly one bounded next action.
- NUDGE if the receipt lacks source-vs-inference separation, exact command
  output, old-path compatibility evidence, no-training proof, fail-closed proof,
  or exactly one next action.
- REDIRECT if the executor trains, fits, mutates manifests/tensors/source
  approvals, switches datasets, promotes a model, edits claim surfaces, runs a
  sweep, runs Brev, or broadens the guard repair.
- STOP if the selected next action requires human budget, source, rights,
  annotation, crop, tensor, label, architecture/input, code-path, scope, or
  final-claim approval, or if the receipt selects `stop_scratch_recognizer_lane`.
- ESCALATE only if a high-cost strategy decision remains unclear after this
  local guard repair and cannot be reduced locally without repeating prior
  analysis.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3DC PopSign fresh5 invocation/output guard fix.
Completed:            <guard repair result and receipt>.
Evidence:             <receipt, changed files, commands>.
Remaining:            <single next action>.
Blockers:             <none or exact blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
