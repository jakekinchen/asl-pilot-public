# Return-To-Form Tier 0 Label/Split Remediation Goal Loop Prompt

Mission 3AE-K prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Diagnose why the M3AE-J crop-identity-preserving smoke fits the full Tier 0
train split cleanly but fails validation/test signal. The M3AE-J report proves
that train sanity is no longer the immediate blocker: `train_top1=1.0` and
`train_macro_recall=1.0`. Validation remains near random at
`validation_top1=0.216`, `validation_macro_recall=0.216`, with zero validation
recall for `grandpa`.

This mission is a label/split/source-distribution diagnostic. It is not another
training run and cannot expand labels, import/approve sources, promote a model,
export ONNX, claim readiness, or weaken final gates.

The selected labels remain `please`, `table`, `dad`, `grandpa`, and `hat`.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-K.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-K in the Milestone Ladder and the Mutable Tactical Overlay.
4. M3AE-J smoke report:
   [`docs/validation/return-to-form-tier0-microprobe-config-smoke.json`](../validation/return-to-form-tier0-microprobe-config-smoke.json).
5. M3AE-I microprobe report:
   [`docs/validation/return-to-form-tier0-model-architecture-microprobe.json`](../validation/return-to-form-tier0-model-architecture-microprobe.json).
6. M3AE-H triage report:
   [`docs/validation/return-to-form-tier0-failure-remediation-triage.json`](../validation/return-to-form-tier0-failure-remediation-triage.json).
7. M3AE-F tensor-contract receipt:
   [`docs/validation/return-to-form-tier0-tensor-contract.json`](../validation/return-to-form-tier0-tensor-contract.json).
8. M3AC/M3AD fixed-crop, gate, source, manifest, and dataloader artifacts.

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
  docs/validation/return-to-form-tier0-failure-remediation-triage.json \
  docs/validation/return-to-form-tier0-model-architecture-microprobe.json \
  docs/validation/return-to-form-tier0-microprobe-config-smoke.json \
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

Then complete exactly one diagnostic slice:

1. Do not run a training job.
2. Inspect the Tier 0 train/validation/test manifests, source record ids,
   signer identity hashes, source splits, tensor paths, crop config, and
   M3AE-J per-label confusion/recall evidence.
3. Determine whether the failed validation signal is best explained by split
   construction, signer/source distribution, label-specific ambiguity, crop
   evidence, input representation leakage/loss, or an unknown blocker.
4. If an existing audit/helper can produce the evidence, use it. A small
   purpose-built diagnostic script is acceptable only if it writes a transparent
   tracked report and does not train or mutate source data.
5. Write the tracked report
   [`docs/validation/return-to-form-tier0-label-split-remediation.json`](../validation/return-to-form-tier0-label-split-remediation.json).
6. Update the Mutable Tactical Overlay with the report link and exactly one
   next action.
7. Write a numbered session log.

## Report Requirements

The report must record:

- source triage report, API strategy memo, M3AE-I microprobe report, M3AE-J
  smoke report, and baseline artifact hashes;
- exact command and any diagnostic script/configuration used;
- selected labels and per-split counts;
- per-label M3AE-J train/validation/test recall and confusion summary;
- split overlap checks for clip ids, source record ids, signer identity hashes,
  tensor paths, and source ids;
- source/signer distribution summary by label and split;
- crop/contact-sheet or crop-config observations if existing artifacts make
  them available without new capture/import;
- classification of the most likely blocker;
- hard-negative/calibration blockers kept separate;
- exactly one next action.

## Next-Action Choices

Choose exactly one next action in the report:

- `split_manifest_remediation`: use if manifest construction, leakage,
  duplicated identities, missing split separation, or source-record overlap is
  the concrete blocker.
- `label_set_remediation`: use if specific labels such as `grandpa`, `dad`,
  `hat`, `please`, or `table` are unsuitable for the first fixed-crop proof
  without adding new source approvals.
- `source_distribution_remediation`: use if source/signer distribution prevents
  a fair Tier 0 validation signal under the current PopSign-only set.
- `input_adapter_remediation`: use only if the M3AE-J failure still points back
  to representation/crop identity rather than labels or splits.
- `stop_reduced_claim`: use when no further bounded no-new-source diagnostic is
  justified without human sign/data review, new source approval, or a changed
  product claim.

## Hard Boundaries

- Do not run a training job.
- Do not run another microprobe or smoke job.
- Do not expand labels.
- Do not evaluate the controlled clip-heldout checkpoint.
- Do not import or approve sources.
- Do not export ONNX, promote a model card, or claim final readiness.
- Do not weaken final gates.
- Do not stop Brev, create a duplicate worker, push, or start a broad-run
  redirect.
- Do not make HandBoxNet active in this slice.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AE-K.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. M3AC/M3AD/M3AE/M3AE-R/M3AE-F/M3AE-G/M3AE-H/M3AE-I/M3AE-J artifacts are
   still valid JSON, and `scripts/run_return_to_form_tier0_decode_dataloader.py`
   still reports `status=passed`, `missing_file_count=0`, and one dataloader
   batch shape per split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. No training job, second smoke, second microprobe, source/media/label
   expansion, broad checkpoint evaluation, export, promotion, or readiness
   claim occurs.
6. [`docs/validation/return-to-form-tier0-label-split-remediation.json`](../validation/return-to-form-tier0-label-split-remediation.json)
   records the M3AE-J failure evidence, per-label train/validation/test
   confusion summary, split/source/signer overlap checks, source distribution,
   blocker classification, hard-negative/calibration separation, and exactly
   one next action from this prompt.
7. The Mutable Tactical Overlay links to the remediation report and records
   exactly one next action.
8. A numbered session log records commands, selected signs, manifest/source/
   crop/gate hashes, M3AE-J smoke metrics, split/source/signer evidence, Brev
   worker status, the separate final-promotion negative-challenge blocker,
   manual stop command `brev stop asl-pilot-rawframe-001`, and the next action.
9. No label expansion, controlled clip-heldout evaluation, source approval,
   unapproved media import, ONNX export, model-card promotion,
   final-readiness claim, broad-run redirect, Brev stop, duplicate Brev worker,
   final-gate weakening, or push occurs.

When all nine are true, continue the goal loop according to the remediation
report's single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-K Tier 0 label/split remediation.
Completed:            <diagnostic evidence or exact blocker>.
Evidence:             <artifact paths, hashes, split findings, and audit statuses>.
Remaining:            <single next action from the remediation report>.
Blockers:             <none, or exact evidence/tooling/data blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
