# Return-To-Form Decode/Dataloader Goal Loop Prompt

Mission 3AD prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Prove the selected 5-sign Tier 0 set and fixed crop config produce reproducible
manifests, tensors, and dataloader batches before any model training.

The selected labels are `please`, `table`, `dad`, `grandpa`, and `hat`.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AD.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AD in the Milestone Ladder and the Mutable Tactical Overlay.
4. [`docs/research/return-to-form-tier0-source-coverage.json`](../research/return-to-form-tier0-source-coverage.json).
5. [`docs/model/return-to-form-fixed-crop-config.json`](return-to-form-fixed-crop-config.json).
6. [`docs/validation/return-to-form-tier0-gates.json`](../validation/return-to-form-tier0-gates.json).
7. Current manifest/tensor tooling and existing PopSign diagnostic manifests.

## First Reviewable Slice

Start with read-only checks:

```sh
git status --short --branch
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_loop_premise.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
jq empty docs/research/return-to-form-tier0-source-coverage.json docs/model/return-to-form-fixed-crop-config.json docs/validation/return-to-form-tier0-gates.json
git diff --check
brev ls --json
```

Run an SSH health check for `asl-pilot-rawframe-001` if the worker is reachable.
The user said not to stop that worker; record `brev stop
asl-pilot-rawframe-001` as the manual stop command, but do not run it.

Then complete the smallest decode/dataloader proof:

1. Generate or refresh Tier 0 train/validation/test manifests under
   `data/manifests/return-to-form-tier0/` from approved PopSign v1 source clips
   only.
2. Bind the source-register hash, fixed crop-config hash, vocabulary/source
   evidence, and decode/FFmpeg provenance in those manifests or a validation
   receipt.
3. Produce or verify tensors for the selected manifests using the committed
   fixed crop config.
4. Run the repo's available check-files and dataloader smoke path over the Tier
   0 manifests/tensors.
5. Write `docs/validation/return-to-form-tier0-decode-dataloader.json` with
   manifest paths, tensor counts, missing-file count, crop-config hash, source
   ids, split limitations, command output summaries, and at least one batch
   shape per split.
6. Update the Mutable Tactical Overlay in
   [`docs/model/return-to-form-plan.md`](return-to-form-plan.md) with links to
   the M3AD manifests/receipt and M3AE as the next milestone only if the proof
   passes.

If existing tooling cannot complete one of these steps, do not invent a broad
new pipeline. Record the exact missing command, file, or schema blocker in the
session log and stop after the smallest committed evidence slice.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AD.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. Tier 0 train/validation/test manifests exist under
   `data/manifests/return-to-form-tier0/`, include only `please`, `table`,
   `dad`, `grandpa`, and `hat`, and bind approved source id
   `popsign-v1-original-videos`.
4. The manifest or receipt binds the source-register hash and fixed
   crop-config hash.
5. `docs/validation/return-to-form-tier0-decode-dataloader.json` records tensor
   counts, missing-file count, crop-config hash, decode/FFmpeg provenance,
   source ids, split limitations, and at least one dataloader batch shape per
   split.
6. The Mutable Tactical Overlay links to the M3AD manifest/receipt evidence and
   says M3AE Tier 0 learnability smoke is next.
7. A numbered session log records commands, selected signs, manifest/tensor
   evidence, Brev worker status, the separate final-promotion
   negative-challenge blocker, and the next action.
8. No training, controlled clip-heldout evaluation, source approval,
   unapproved media import, ONNX export, model-card promotion,
   final-readiness claim, broad-run redirect, Brev stop, or push occurs.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AD decode and dataloader proof.
Completed:            <manifest/tensor/dataloader evidence or exact blocker>.
Evidence:             <artifact paths and audit statuses>.
Remaining:            M3AE Tier 0 learnability smoke if proof passed.
Blockers:             <none, or exact manifest/tensor/dataloader blocker>.
Next step:            Run Tier 0 learnability smoke against pre-written gates, or fix the recorded M3AD blocker.
Checkpoint commit:    <commit hash>.
```
