# Return-To-Form Tier 0 Learnability Rerun Goal Loop Prompt

Mission 3AE-G prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Rerun the bounded Tier 0 learnability smoke after the M3AE-F tensor-contract
fix. The goal is to test whether the selected 5-sign fixed-crop set learns when
training/evaluation consumes `rgb_regions` through the explicit
`rgb_regions_grid_v1` input path.

The selected labels remain `please`, `table`, `dad`, `grandpa`, and `hat`.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-G.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-G in the Milestone Ladder and the Mutable Tactical Overlay.
4. [`docs/validation/return-to-form-tier0-tensor-contract.json`](../validation/return-to-form-tier0-tensor-contract.json).
5. Prior failed M3AE report:
   [`docs/validation/return-to-form-tier0-learnability-smoke.json`](../validation/return-to-form-tier0-learnability-smoke.json).
6. [`docs/validation/return-to-form-tier0-gates.json`](../validation/return-to-form-tier0-gates.json).
7. [`docs/validation/return-to-form-tier0-decode-dataloader.json`](../validation/return-to-form-tier0-decode-dataloader.json).
8. The three M3AD manifests under `data/manifests/return-to-form-tier0/`.

## First Reviewable Slice

Start with read-only checks:

```sh
git status --short --branch
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_loop_premise.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
jq empty docs/research/return-to-form-tier0-source-coverage.json \
  docs/model/return-to-form-fixed-crop-config.json \
  docs/validation/return-to-form-tier0-gates.json \
  docs/validation/return-to-form-tier0-decode-dataloader.json \
  docs/validation/return-to-form-tier0-learnability-smoke.json \
  docs/validation/return-to-form-tier0-remediation-diagnostic.json \
  docs/validation/return-to-form-tier0-tensor-contract.json \
  data/manifests/return-to-form-tier0/train.json \
  data/manifests/return-to-form-tier0/validation.json \
  data/manifests/return-to-form-tier0/test.json
./.venv/bin/python scripts/run_return_to_form_tier0_decode_dataloader.py
./.venv/bin/python scripts/audit_return_to_form_tier0_tensor_contract.py
git diff --check
brev ls --json
```

The user said not to stop `asl-pilot-rawframe-001`; record `brev stop
asl-pilot-rawframe-001` as the manual stop command, but do not run it. Do not
create a duplicate worker.

Then complete one bounded learnability rerun:

1. Run one short from-scratch training smoke against only the M3AD manifests and
   tensors. Use `scripts/train_rawframe_model.py` with `--allow-small-label-set`
   and the bounded smoke budget already established for M3AE.
2. Confirm the run uses the corrected `rgb_regions_grid_v1` path from
   [`docs/validation/return-to-form-tier0-tensor-contract.json`](../validation/return-to-form-tier0-tensor-contract.json).
3. Keep random initialization and `pretrained_components: []`. Do not add or
   use pretrained detectors, landmarks, feature extractors, backbones, or model
   weights.
4. Preserve the prior failed M3AE report. Write the rerun report to a new
   tracked path:
   [`docs/validation/return-to-form-tier0-learnability-smoke-rerun.json`](../validation/return-to-form-tier0-learnability-smoke-rerun.json).
5. Record the model artifact hash, training-provenance hash, loss movement,
   train/validation/test top-1, macro recall if available, per-label confusion
   or recall evidence, the corrected input contract, and comparison against
   random chance (`0.2` top-1).
6. Evaluate rejection behavior against an approved reviewed negative-challenge
   manifest or clearly mark the exact blocker if the existing tooling cannot
   produce a Tier 0 hard-negative false-accept rate without new reviewed data.
7. Update the Mutable Tactical Overlay with the rerun report link and exactly
   one next action: queue M3AF only if Tier 0 passes, return to remediation if
   the report proves a concrete fixable blocker, queue rejection/calibration
   work only if learnability passes but rejection is blocked, or STOP with a
   reduced-claim recommendation.
8. Write a numbered session log.

If existing tooling cannot produce one required metric, do not invent a broad
pipeline. Record the exact missing command, file, schema, or reviewed-negative
blocker in the M3AE-G report and session log, then stop after the smallest
committed evidence slice.

## Hard Boundaries

- Do not expand labels.
- Do not evaluate the controlled clip-heldout checkpoint.
- Do not import or approve sources.
- Do not export ONNX, promote a model card, or claim final readiness.
- Do not weaken final gates.
- Do not stop Brev, create a duplicate worker, push, or start a broad-run
  redirect.
- Do not make HandBoxNet active in this slice.
- Do not add augmentation, more epochs, or a larger model unless the rerun
  report first proves the bounded smoke passes its prewritten gates.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AE-G.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. M3AC/M3AD/M3AE/M3AE-R/M3AE-F artifacts are still valid JSON, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` through
   `rgb_regions_grid_v1` with no `rgb_frames` fallback for the sampled Tier 0
   payloads.
5. The training smoke uses only the M3AD manifests, selected labels, approved
   source id `popsign-v1-original-videos`, random initialization,
   `pretrained_components: []`, and the corrected `rgb_regions_grid_v1` input
   path.
6. [`docs/validation/return-to-form-tier0-learnability-smoke-rerun.json`](../validation/return-to-form-tier0-learnability-smoke-rerun.json)
   records training loss movement, train and validation top-1, train and
   validation macro recall or per-label recall, test metrics as report-only,
   confusion/failure classes, hard-negative false-accept rate or exact blocker,
   no-zero-accepted true-class status, random-chance comparison, input contract,
   and gate pass/fail/blocker classification.
7. The Mutable Tactical Overlay links to the rerun report and records exactly
   one next action.
8. A numbered session log records commands, selected signs, manifest/source/
   crop/gate hashes, tensor-contract proof status, training/evaluation
   evidence, Brev worker status, the separate final-promotion
   negative-challenge blocker, and the next action.
9. No label expansion, controlled clip-heldout evaluation, source approval,
   unapproved media import, ONNX export, model-card promotion,
   final-readiness claim, broad-run redirect, Brev stop, duplicate Brev worker,
   final-gate weakening, or push occurs.

When all nine are true, continue the goal loop according to the rerun report's
single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-G Tier 0 learnability smoke rerun.
Completed:            <training/evaluation evidence or exact blocker>.
Evidence:             <artifact paths, metrics, hashes, and audit statuses>.
Remaining:            <M3AF, remediation, rejection/calibration, or STOP recommendation>.
Blockers:             <none, or exact metric/tooling/data blocker>.
Next step:            <single next action from the rerun report>.
Checkpoint commit:    <commit hash>.
```
