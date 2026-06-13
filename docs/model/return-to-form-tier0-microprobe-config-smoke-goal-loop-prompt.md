# Return-To-Form Tier 0 Microprobe-Config Smoke Goal Loop Prompt

Mission 3AE-J prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run one bounded Tier 0 learnability smoke using the crop-identity-preserving
configuration proven by the M3AE-I microprobe. The tiny overfit probe passed
train fit when it loaded `rgb_regions` directly, kept crop identity explicit,
used random initialization, and avoided `rgb_regions_grid_v1`, `rgb_frames`,
and pretrained features.

This mission asks whether that configuration is useful beyond the 10-example
tiny subset. It is still diagnostic only. It cannot promote a model card, export
ONNX, claim product readiness, or weaken final gates.

The selected labels remain `please`, `table`, `dad`, `grandpa`, and `hat`.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-J.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-J in the Milestone Ladder and the Mutable Tactical Overlay.
4. M3AE-I microprobe report:
   [`docs/validation/return-to-form-tier0-model-architecture-microprobe.json`](../validation/return-to-form-tier0-model-architecture-microprobe.json).
5. M3AE-H triage report:
   [`docs/validation/return-to-form-tier0-failure-remediation-triage.json`](../validation/return-to-form-tier0-failure-remediation-triage.json).
6. Failed M3AE-G rerun report:
   [`docs/validation/return-to-form-tier0-learnability-smoke-rerun.json`](../validation/return-to-form-tier0-learnability-smoke-rerun.json).
7. M3AE-F tensor-contract receipt:
   [`docs/validation/return-to-form-tier0-tensor-contract.json`](../validation/return-to-form-tier0-tensor-contract.json).
8. M3AC/M3AD fixed-crop, gate, source, and dataloader artifacts.
9. `scripts/run_return_to_form_tier0_model_architecture_microprobe.py`,
   `scripts/train_rawframe_model.py`, and
   `scripts/report_return_to_form_tier0_learnability.py`.

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

Then complete exactly one bounded smoke:

1. Use only the selected Tier 0 manifests and approved PopSign tensors.
2. Keep random initialization and `pretrained_components: []`.
3. Preserve crop identity and scale in the input. The baseline configuration is
   the M3AE-I `region_identity_mlp_v1` path: load `rgb_regions` directly,
   keep the region axis explicit, resize each crop independently, and flatten
   only after crop identity has been preserved.
4. Do not use only the compressed `rgb_regions_grid_v1` 96px mosaic as the
   representation under test.
5. Run exactly one training/evaluation job. The smoke should cover the M3AD
   train manifest and report validation/test metrics if the split evaluation
   path is available. If adapting the microprobe configuration to full-split
   evaluation is not possible in one reviewable slice, write a blocker report
   instead of running an off-scope fallback.
6. Prefer local Mac MPS. Do not start a new paid worker or duplicate Brev run.
7. Write the tracked report
   [`docs/validation/return-to-form-tier0-microprobe-config-smoke.json`](../validation/return-to-form-tier0-microprobe-config-smoke.json).
8. Update the Mutable Tactical Overlay with the report link and exactly one
   next action.
9. Write a numbered session log.

The smoke is judged on train sanity first and validation signal second.
Validation/test metrics cannot authorize product promotion in this slice.

## Report Requirements

The report must record:

- source triage report, API strategy memo, M3AE-I microprobe report, and M3AE-G
  baseline report hashes;
- exact command, output directory, model id, device, seed, and configuration;
- selected labels, manifest/source/crop/gate hashes, and per-split sample
  counts;
- whether the input preserves crop identity/scale, and how;
- input-contract evidence from M3AE-F;
- training loss movement;
- train top-1 and macro recall;
- validation/test metrics when computed, or the exact blocker when not
  computed;
- per-label recall or confusion evidence;
- comparison against M3AE-G train sanity and random top-1 chance `0.2`;
- train-sanity and validation-signal gate classifications;
- hard-negative/calibration blockers kept separate;
- exactly one next action.

## Next-Action Choices

Choose exactly one next action in the smoke report:

- `tier1_reserve_selection`: use only if train sanity passes and validation
  signal is meaningfully above random without violating source, no-pretrained,
  or final-gate constraints.
- `microprobe_config_remediation`: use if train sanity fails or the
  crop-identity configuration cannot be applied cleanly to the full Tier 0
  split.
- `label_or_split_remediation`: use if train sanity passes but validation/test
  signal points to label quality, split, signer, or source distribution.
- `rejection_calibration_before_promotion`: use if train and validation signal
  are good enough for a reduced Tier 0 claim but hard-negative or calibration
  evidence is the immediate blocker.
- `stop_reduced_claim`: use when no further bounded no-new-source diagnostic is
  justified without human sign/data review, new source approval, or a changed
  product claim.

## Hard Boundaries

- Do not run more than one smoke training job.
- Do not run a second tiny microprobe.
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

1. `GOAL.md` points at this prompt and names Mission 3AE-J.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. M3AC/M3AD/M3AE/M3AE-R/M3AE-F/M3AE-G/M3AE-H/M3AE-I artifacts are still valid
   JSON, and `scripts/run_return_to_form_tier0_decode_dataloader.py` still
   reports `status=passed`, `missing_file_count=0`, and one dataloader batch
   shape per split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. Exactly one bounded smoke uses only the selected labels, M3AD manifests,
   approved source id `popsign-v1-original-videos`, random initialization,
   `pretrained_components: []`, crop-identity-preserving input derived from
   the M3AE-I microprobe configuration, and no new source/media/label inputs.
6. [`docs/validation/return-to-form-tier0-microprobe-config-smoke.json`](../validation/return-to-form-tier0-microprobe-config-smoke.json)
   records the source triage report, API strategy memo, M3AE-I report,
   command/configuration, split sample counts, baseline comparison, loss
   movement, train and validation/test metrics or exact blockers, per-label
   recall or confusion evidence, input contract, crop-identity-preservation
   method, random-chance comparison, gate classifications, and exactly one next
   action from this prompt.
7. The Mutable Tactical Overlay links to the smoke report and records exactly
   one next action.
8. A numbered session log records commands, selected signs, manifest/source/
   crop/gate hashes, M3AE-G failure metrics, M3AE-I microprobe evidence, Brev
   worker status, the separate final-promotion negative-challenge blocker,
   manual stop command `brev stop asl-pilot-rawframe-001`, and the next action.
9. No label expansion, controlled clip-heldout evaluation, source approval,
   unapproved media import, ONNX export, model-card promotion,
   final-readiness claim, broad-run redirect, Brev stop, duplicate Brev worker,
   final-gate weakening, or push occurs.

When all nine are true, continue the goal loop according to the smoke report's
single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-J Tier 0 microprobe-config smoke.
Completed:            <smoke evidence or exact blocker>.
Evidence:             <artifact paths, hashes, metrics, and audit statuses>.
Remaining:            <single next action from the smoke report>.
Blockers:             <none, or exact evidence/tooling/data blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
