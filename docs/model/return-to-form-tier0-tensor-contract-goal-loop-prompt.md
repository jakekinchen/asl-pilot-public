# Return-To-Form Tier 0 Tensor Contract Goal Loop Prompt

Mission 3AE-F prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Fix the Tier 0 training/evaluation tensor input contract before any additional
learnability smoke. M3AE-R proved that the selected 5-sign payloads contain the
intended `rgb_regions` fixed-crop stack, but `RawFrameClipDataset` consumed only
the `rgb_frames` compatibility tensor mapped to `upper_body_signing_space`.

The selected labels remain `please`, `table`, `dad`, `grandpa`, and `hat`.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-F.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-F in the Milestone Ladder and the Mutable Tactical Overlay.
4. [`docs/validation/return-to-form-tier0-remediation-diagnostic.json`](../validation/return-to-form-tier0-remediation-diagnostic.json).
5. [`docs/validation/return-to-form-tier0-learnability-smoke.json`](../validation/return-to-form-tier0-learnability-smoke.json).
6. [`docs/validation/return-to-form-tier0-decode-dataloader.json`](../validation/return-to-form-tier0-decode-dataloader.json).
7. [`docs/model/return-to-form-fixed-crop-config.json`](return-to-form-fixed-crop-config.json).
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
  data/manifests/return-to-form-tier0/train.json \
  data/manifests/return-to-form-tier0/validation.json \
  data/manifests/return-to-form-tier0/test.json
./.venv/bin/python scripts/run_return_to_form_tier0_decode_dataloader.py
git diff --check
brev ls --json
```

The user said not to stop `asl-pilot-rawframe-001`; record `brev stop
asl-pilot-rawframe-001` as the manual stop command, but do not run it. Do not
create a duplicate worker.

Then complete the smallest tensor-contract fix:

1. Inspect `scripts/train_rawframe_model.py::load_tensor_file`,
   `RawFrameClipDataset`, and the M3AE training/evaluation path.
2. Make the Tier 0 training/evaluation path consume the intended
   `rgb_regions` fixed-crop stack, or an explicit region-aware derived input
   whose region order is recorded. Do not silently treat the `rgb_frames`
   compatibility slice as the fixed-region proof when `rgb_regions` exists.
3. Preserve no-pretrained constraints and source-register boundaries.
4. Add or refresh a local validation artifact under `docs/validation/` that
   proves the corrected path consumes `rgb_regions` or the declared
   region-aware derivative for sampled train/validation/test payloads.
5. Re-run the existing decode/dataloader and tensor diagnostic checks in
   non-training mode. Do not run a new learnability smoke in this fix slice.
6. Update the Mutable Tactical Overlay with the fix receipt and exactly one next
   action.
7. Write a numbered session log.

## Hard Boundaries

- Do not run another Tier 0 training smoke in this tensor-contract fix slice.
- Do not expand labels.
- Do not evaluate the controlled clip-heldout checkpoint.
- Do not import or approve sources.
- Do not export ONNX, promote a model card, or claim final readiness.
- Do not weaken final gates.
- Do not stop Brev, create a duplicate worker, push, or start a broad-run
  redirect.
- Do not make HandBoxNet active in this slice.
- Do not add augmentation, more epochs, or a larger model.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AE-F.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. M3AC/M3AD/M3AE/M3AE-R artifacts are still valid JSON, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. The training/evaluation tensor loader path records or proves that it consumes
   `rgb_regions` or an explicitly region-aware derived input for the Tier 0
   payloads when `rgb_regions` exists.
5. A tracked receipt under `docs/validation/` records sampled payload counts,
   consumed tensor key or derived input name, region order, batch shape, source
   and crop hashes, and whether the path still falls back to `rgb_frames`.
6. The Mutable Tactical Overlay links to the fix receipt and records exactly one
   next action: rerun the bounded Tier 0 learnability smoke only if the tensor
   contract is verified, otherwise STOP with the exact unresolved tensor
   blocker.
7. A numbered session log records commands, selected signs, M3AE failure
   metrics, M3AE-R diagnostic finding, fix evidence, Brev worker status, the
   separate final-promotion negative-challenge blocker, and the next action.
8. No training, label expansion, controlled clip-heldout evaluation, source
   approval, unapproved media import, ONNX export, model-card promotion,
   final-readiness claim, broad-run redirect, Brev stop, duplicate Brev worker,
   or push occurs.

When all eight are true, continue the goal loop according to the fix receipt's
single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-F Tier 0 tensor contract fix.
Completed:            <tensor-contract fix evidence or exact blocker>.
Evidence:             <artifact paths, hashes, and audit statuses>.
Remaining:            <single next action from the fix receipt>.
Blockers:             <none, or exact tensor/model/source blocker>.
Next step:            <single next action from the fix receipt>.
Checkpoint commit:    <commit hash>.
```
