# Return-To-Form Tier 0 Learnability Goal Loop Prompt

Mission 3AE prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run the smallest training proof that can answer whether the selected 5-sign
fixed-crop Tier 0 set learns at all. Judge the result against the pre-written
gates before expanding labels, exporting a model, or making any product claim.

The selected labels are `please`, `table`, `dad`, `grandpa`, and `hat`.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE in the Milestone Ladder and the Mutable Tactical Overlay.
4. [`docs/validation/return-to-form-tier0-gates.json`](../validation/return-to-form-tier0-gates.json).
5. [`docs/validation/return-to-form-tier0-decode-dataloader.json`](../validation/return-to-form-tier0-decode-dataloader.json).
6. The three M3AD manifests under `data/manifests/return-to-form-tier0/`.
7. Current rawframe training/evaluation tooling.

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
  data/manifests/return-to-form-tier0/train.json \
  data/manifests/return-to-form-tier0/validation.json \
  data/manifests/return-to-form-tier0/test.json
./.venv/bin/python scripts/run_return_to_form_tier0_decode_dataloader.py
git diff --check
brev ls --json
```

Run an SSH health check for `asl-pilot-rawframe-001` if the worker is
reachable. The user said not to stop that worker; record `brev stop
asl-pilot-rawframe-001` as the manual stop command, but do not run it. Do not
create a duplicate worker.

Then complete the smallest learnability proof:

1. Run one short from-scratch training smoke against only the M3AD manifests and
   tensors. Use `scripts/train_rawframe_model.py` with `--allow-small-label-set`
   and a bounded smoke budget before considering any longer run.
2. Keep random initialization and `pretrained_components: []`. Do not add or
   use pretrained detectors, landmarks, feature extractors, backbones, or model
   weights.
3. Record the model artifact hash, training-provenance hash, loss movement,
   train/validation/test top-1, macro recall if available, per-label confusion
   or recall evidence, and comparison against random chance (`0.2` top-1).
4. Evaluate rejection behavior against an approved reviewed negative-challenge
   manifest or clearly mark the exact blocker if the existing tooling cannot
   produce a Tier 0 hard-negative false-accept rate without new data.
5. Write
   [`docs/validation/return-to-form-tier0-learnability-smoke.json`](../validation/return-to-form-tier0-learnability-smoke.json)
   with pass/fail/blocker status against every gate in
   [`docs/validation/return-to-form-tier0-gates.json`](../validation/return-to-form-tier0-gates.json).
6. Update the Mutable Tactical Overlay in
   [`docs/model/return-to-form-plan.md`](return-to-form-plan.md) with the M3AE
   report link and exactly one next action: queue M3AF, return to M3AC/M3AD
   remediation, queue rejection/calibration work, or STOP with a reduced-claim
   recommendation.

If existing tooling cannot produce one required metric, do not invent a broad
pipeline. Record the exact missing command, file, schema, or reviewed-negative
blocker in the M3AE report and session log, then stop after the smallest
committed evidence slice.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AE.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. The training smoke uses only the M3AD manifests, selected labels, approved
   source id `popsign-v1-original-videos`, and random initialization.
5. The learnability report records training loss movement, train and validation
   top-1, train and validation macro recall or per-label recall, test metrics
   as report-only, confusion/failure classes, hard-negative false-accept rate
   or exact blocker, no-zero-accepted true-class status, random-chance
   comparison, and gate pass/fail/blocker classification.
6. The Mutable Tactical Overlay links to the M3AE report and records exactly
   one next action.
7. A numbered session log records commands, selected signs, manifest/source/
   crop/gate hashes, tensor proof status, training/evaluation evidence, Brev
   worker status, the separate final-promotion negative-challenge blocker, and
   the next action.
8. No label expansion, controlled clip-heldout evaluation, source approval,
   unapproved media import, ONNX export, model-card promotion,
   final-readiness claim, broad-run redirect, Brev stop, duplicate Brev worker,
   or push occurs.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE Tier 0 learnability smoke.
Completed:            <training/evaluation evidence or exact blocker>.
Evidence:             <artifact paths, metrics, hashes, and audit statuses>.
Remaining:            <M3AF, remediation, rejection/calibration, or STOP recommendation>.
Blockers:             <none, or exact metric/tooling/data blocker>.
Next step:            <single next action from the report>.
Checkpoint commit:    <commit hash>.
```
