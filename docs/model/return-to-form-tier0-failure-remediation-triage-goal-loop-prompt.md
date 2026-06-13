# Return-To-Form Tier 0 Failure Remediation Triage Goal Loop Prompt

Mission 3AE-H prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Triage the failed M3AE-G bounded Tier 0 learnability rerun before any further
training. The corrected `rgb_regions_grid_v1` input path is verified, but the
5-sign proof still fails train sanity and validation signal. Determine the next
single remediation action from existing evidence.

The selected labels remain `please`, `table`, `dad`, `grandpa`, and `hat`.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-H.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-H in the Milestone Ladder and the Mutable Tactical Overlay.
4. Failed M3AE-G rerun report:
   [`docs/validation/return-to-form-tier0-learnability-smoke-rerun.json`](../validation/return-to-form-tier0-learnability-smoke-rerun.json).
5. M3AE-R diagnostic and contact sheets:
   [`docs/validation/return-to-form-tier0-remediation-diagnostic.json`](../validation/return-to-form-tier0-remediation-diagnostic.json)
   and
   [`docs/validation/return-to-form-tier0-remediation-contact-sheets/`](../validation/return-to-form-tier0-remediation-contact-sheets/).
6. M3AE-F tensor-contract receipt:
   [`docs/validation/return-to-form-tier0-tensor-contract.json`](../validation/return-to-form-tier0-tensor-contract.json).
7. M3AC/M3AD fixed-crop and dataloader artifacts.
8. `scripts/train_rawframe_model.py`, only to inspect the architecture,
   transforms, initialization, split/evaluation path, and training budget used
   by the smoke.

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
  docs/validation/return-to-form-tier0-learnability-smoke-rerun.json \
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

Then complete one bounded remediation triage:

1. Compare the M3AE and M3AE-G failure patterns, especially zero-recall labels
   and whether predictions collapse toward `please` and `hat`.
2. Inspect the M3AE-R contact sheets and fixed-crop config for visible
   label-specific crop failures, especially head-contact signs `dad`,
   `grandpa`, and `hat`.
3. Verify the tensor contract is no longer the active first failure, using the
   M3AE-F receipt and the dataloader/tensor-contract commands above.
4. Inspect the model architecture and training configuration in
   `scripts/train_rawframe_model.py` for a plausible small-proof bottleneck
   such as temporal pooling, region flattening, augmentation absence, train
   budget, split assumptions, or evaluation mismatch.
5. Write a tracked JSON report at
   [`docs/validation/return-to-form-tier0-failure-remediation-triage.json`](../validation/return-to-form-tier0-failure-remediation-triage.json).
6. Update the Mutable Tactical Overlay with the report link and exactly one
   next action.
7. Write a numbered session log.

If the evidence is inconclusive, do not invent another training run. Record the
specific missing evidence and choose the smallest diagnostic next action that
would resolve it.

## Next-Action Choices

Choose exactly one next action in the triage report:

- `crop_region_remediation`: use when contact sheets or fixed-crop config show
  a concrete crop/region failure to repair before training.
- `model_architecture_microprobe`: use when crops and tensor contract look
  coherent, but the current architecture/training budget cannot fit the small
  training set.
- `label_or_split_remediation`: use when the selected label set, source split,
  signer distribution, or per-label clip quality is the concrete blocker.
- `handboxnet_ablation_planning`: use only if the triage records a
  crop-quality-bounded failure that the fixed-crop protocol cannot remediate.
- `stop_reduced_claim`: use when the available evidence supports no further
  autonomous ML work without human sign/data review, new source approval, or a
  changed product claim.

## Hard Boundaries

- Do not run training in this slice.
- Do not expand labels.
- Do not evaluate the controlled clip-heldout checkpoint.
- Do not import or approve sources.
- Do not export ONNX, promote a model card, or claim final readiness.
- Do not weaken final gates.
- Do not stop Brev, create a duplicate worker, push, or start a broad-run
  redirect.
- Do not make HandBoxNet active unless the triage report records a
  crop-quality-bounded fixed-crop failure.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AE-H.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. M3AC/M3AD/M3AE/M3AE-R/M3AE-F/M3AE-G artifacts are still valid JSON, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` through
   `rgb_regions_grid_v1` with no `rgb_frames` fallback for the sampled Tier 0
   payloads.
5. No training run is started.
6. [`docs/validation/return-to-form-tier0-failure-remediation-triage.json`](../validation/return-to-form-tier0-failure-remediation-triage.json)
   records M3AE-G failure metrics, per-label failure pattern, contact-sheet and
   crop observations, tensor-contract status, model architecture/training
   configuration assessment, blocker classification, and exactly one next
   action from this prompt.
7. The Mutable Tactical Overlay links to the triage report and records exactly
   one next action.
8. A numbered session log records commands, selected signs, manifest/source/
   crop/gate hashes, M3AE-G failure metrics, M3AE-F tensor-contract evidence,
   remediation-triage findings, Brev worker status, the separate
   final-promotion negative-challenge blocker, and the next action.
9. No label expansion, controlled clip-heldout evaluation, source approval,
   unapproved media import, ONNX export, model-card promotion,
   final-readiness claim, broad-run redirect, Brev stop, duplicate Brev worker,
   final-gate weakening, or push occurs.

When all nine are true, continue the goal loop according to the triage report's
single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-H Tier 0 failure remediation triage.
Completed:            <triage evidence or exact blocker>.
Evidence:             <artifact paths, hashes, metrics, and audit statuses>.
Remaining:            <single next action from the triage report>.
Blockers:             <none, or exact evidence/tooling/data blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
