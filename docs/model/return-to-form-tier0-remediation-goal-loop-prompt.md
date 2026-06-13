# Return-To-Form Tier 0 Remediation Goal Loop Prompt

Mission 3AE-R prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Diagnose why the selected 5-sign fixed-crop Tier 0 learnability smoke failed
before any additional training. The goal is not to make the metrics look
better; it is to identify the next smallest evidence-backed remediation.

The selected labels are `please`, `table`, `dad`, `grandpa`, and `hat`.
Prioritize `dad` and `grandpa`, because both had zero train recall in the
bounded M3AE smoke.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-R.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-R in the Milestone Ladder and the Mutable Tactical Overlay.
4. [`docs/validation/return-to-form-tier0-learnability-smoke.json`](../validation/return-to-form-tier0-learnability-smoke.json).
5. [`docs/research/return-to-form-tier0-remediation-api-synthesis.md`](../research/return-to-form-tier0-remediation-api-synthesis.md)
   as advisory synthesis, not proof.
6. [`docs/validation/return-to-form-tier0-decode-dataloader.json`](../validation/return-to-form-tier0-decode-dataloader.json).
7. [`docs/model/return-to-form-fixed-crop-config.json`](return-to-form-fixed-crop-config.json).
8. The three M3AD manifests under `data/manifests/return-to-form-tier0/`.
9. Current rawframe tensor visual/contact-sheet tooling.

## Failure Hypotheses To Test

Test these in order and stop on the first concrete failure:

1. Tensor payload mismatch. M3AE reported that `RawFrameClipDataset` reads
   `rgb_frames` while `rgb_regions` remains hash-bound region proof. Verify
   whether the M3AE training/evaluation path consumed the intended fixed-crop
   region stack or only a compatibility slice.
2. Crop quality or region selection. Review contact sheets for `dad`,
   `grandpa`, `please`, `hat`, and `table`; if more than 15 percent of reviewed
   crops per label miss or misalign sign-relevant content, stop for crop/config
   remediation.
3. Architecture fit. Consider a microprobe only after crop quality and region
   tensor consumption both pass.

Do not proceed to detector, HandBoxNet, augmentation, label expansion, or broad
training until fixed-crop quality and payload flow are validated.

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

Then complete the smallest remediation diagnostic:

1. Verify the tensor contract before treating the model as the failure. Inspect
   `docs/validation/return-to-form-tier0-learnability-smoke.json`,
   `scripts/train_rawframe_model.py`, `RawFrameClipDataset`, and the M3AD tensor
   payload schema. The diagnostic must state whether training consumed
   `rgb_regions`, `rgb_frames`, or both, and which region `rgb_frames` maps to
   when present.
2. Use existing tensor/contact-sheet tooling before writing new code. A suitable
   starting command is:

   ```sh
   ./.venv/bin/python scripts/analyze_rawframe_tensor_visuals.py \
     --train-manifest data/manifests/return-to-form-tier0/train.json \
     --validation-manifest data/manifests/return-to-form-tier0/validation.json \
     --test-manifest data/manifests/return-to-form-tier0/test.json \
     --failure-analysis docs/validation/return-to-form-tier0-learnability-smoke.json \
     --output docs/validation/return-to-form-tier0-remediation-diagnostic.json \
     --sheet-dir docs/validation/return-to-form-tier0-remediation-contact-sheets \
     --label dad \
     --label grandpa \
     --label please \
     --label hat \
     --label table \
     --samples-per-label-split 3 \
     --write
   ```

3. If that command does not fit the M3AE report schema, adapt the smallest
   invocation or wrapper needed to inspect the same labels and write the
   diagnostic. Do not broaden the task into a new training pipeline.
4. The diagnostic must classify the most likely failure surface:
   crop/region coverage, tensor payload/preprocessing, model architecture fit,
   source/split limitation, or inconclusive.
5. Update the Mutable Tactical Overlay in
   [`docs/model/return-to-form-plan.md`](return-to-form-plan.md) with the
   diagnostic link and exactly one next action.

## Hard Boundaries

- Do not run another training smoke in this remediation slice.
- Do not expand labels.
- Do not evaluate the controlled clip-heldout checkpoint.
- Do not import or approve sources.
- Do not export ONNX, promote a model card, or claim final readiness.
- Do not weaken final gates.
- Do not stop Brev, create a duplicate worker, push, or start a broad-run
  redirect.
- Do not make HandBoxNet active unless the diagnostic records a concrete
  crop-quality-bounded failure.
- Do not add augmentation, more epochs, or a larger model unless the diagnostic
  shows that crop quality and region tensor consumption both pass.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AE-R.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. M3AC/M3AD/M3AE artifacts are still valid JSON, and
   `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. [`docs/validation/return-to-form-tier0-remediation-diagnostic.json`](../validation/return-to-form-tier0-remediation-diagnostic.json)
   exists and records selected labels, manifest/source/crop hashes, contact
   sheet paths and hashes when written, tensor statistics, per-label failure
   observations, `rgb_frames` versus `rgb_regions` consumption, likely failure
   class, and confidence.
5. The Mutable Tactical Overlay links to the diagnostic and records exactly one
   next action consistent with the stop rules: crop/config remediation if crop
   errors exceed 15 percent per reviewed label, tensor/preprocessing fix if
   `rgb_regions` is unused or malformed, architecture-bounded microprobe only
   if crops and payload flow pass, HandBoxNet only after a crop-quality-bounded
   failure, or STOP/reduced claim.
6. A numbered session log records commands, selected signs, M3AE failure
   metrics, diagnostic evidence, Brev worker status, the separate
   final-promotion negative-challenge blocker, and the next action.
7. No training, label expansion, controlled clip-heldout evaluation, source
   approval, unapproved media import, ONNX export, model-card promotion,
   final-readiness claim, broad-run redirect, Brev stop, duplicate Brev worker,
   or push occurs.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-R Tier 0 remediation diagnosis.
Completed:            <diagnostic evidence or exact blocker>.
Evidence:             <artifact paths, hashes, and audit statuses>.
Remaining:            <single next action from the diagnostic>.
Blockers:             <none, or exact crop/tensor/model/source blocker>.
Next step:            <single next action from the diagnostic>.
Checkpoint commit:    <commit hash>.
```
