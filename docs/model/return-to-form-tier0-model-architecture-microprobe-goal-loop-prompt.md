# Return-To-Form Tier 0 Model Architecture Microprobe Goal Loop Prompt

Mission 3AE-I prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run one bounded no-label-expansion tiny overfit microprobe on the selected Tier
0 fixed-crop set. The M3AE-H triage selected `model_architecture_microprobe`
because crops are visibly coherent, the tensor contract is closed, but the
current compact `rgb_regions_grid_v1` smoke still cannot fit all five training
labels.

An observer API strategy pass reviewed the drafted M3AE-I prompt and said not to
run the proposed "same grid input, remove batch caps, 12 epochs" probe. The
microprobe must directly test whether preserving crop identity/scale makes a
tiny selected subset learnable.

This is a diagnostic only. It is not a product-readiness run and cannot promote
a model card or ONNX artifact.

The selected labels remain `please`, `table`, `dad`, `grandpa`, and `hat`.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-I.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-I in the Milestone Ladder and the Mutable Tactical Overlay.
4. M3AE-H triage report:
   [`docs/validation/return-to-form-tier0-failure-remediation-triage.json`](../validation/return-to-form-tier0-failure-remediation-triage.json).
5. Failed M3AE-G rerun report:
   [`docs/validation/return-to-form-tier0-learnability-smoke-rerun.json`](../validation/return-to-form-tier0-learnability-smoke-rerun.json).
6. M3AE-F tensor-contract receipt:
   [`docs/validation/return-to-form-tier0-tensor-contract.json`](../validation/return-to-form-tier0-tensor-contract.json).
7. M3AC/M3AD fixed-crop and dataloader artifacts.
8. Observer API strategy memo:
   [`artifacts/research/observer-195-tier0-strategy-api-response.md`](../../artifacts/research/observer-195-tier0-strategy-api-response.md).
9. `scripts/train_rawframe_model.py` and
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

Then complete exactly one microprobe run:

1. Use only the selected Tier 0 manifests and approved PopSign tensors.
2. Keep random initialization and `pretrained_components: []`.
3. Do not run the drafted same-grid, no-batch-cap, 12-epoch full-train-set
   probe. It does not answer the highest-priority question from the API memo.
4. Preserve crop identity/scale in the probe input. Acceptable forms include
   separate crop streams, an explicit region dimension, crop-id embeddings, or
   another declared region-aware derivative. Do not use only the compressed
   `rgb_regions_grid_v1` 96px image as the representation under test.
5. Use a tiny sampled subset, ideally 5-10 clips with at least one example per
   selected label. The goal is train-fit/overfit evidence, not validation
   performance.
6. Use the smallest diagnostic model or wrapper that can answer the question.
   Existing training/reporting code is preferred only if it can preserve crop
   identity. A small purpose-built diagnostic script is acceptable; a broad
   training-pipeline refactor is not.
7. Prefer local Mac MPS. Do not start a new paid worker or duplicate Brev run.
8. Run exactly one microprobe job. If the identity-preserving path is
   impossible, write a blocker report instead of falling back to the compressed
   grid probe.
9. Write the tracked report
   [`docs/validation/return-to-form-tier0-model-architecture-microprobe.json`](../validation/return-to-form-tier0-model-architecture-microprobe.json).
10. Update the Mutable Tactical Overlay with the report link and exactly one
   next action.
11. Write a numbered session log.

The microprobe is judged first on train fit. Validation/test metrics are useful
diagnostics but do not authorize model promotion.

## Report Requirements

The report must record:

- source triage report, API strategy memo, and baseline M3AE-G report hashes;
- exact command, output directory, model id, device, seed, and configuration;
- tiny subset selection and per-label sample counts;
- whether the probe preserved crop identity/scale, and how;
- input-contract evidence from M3AE-F;
- training loss movement;
- tiny-subset train top-1 and macro recall;
- validation/test metrics only if computed incidentally; they are not required
  for this tiny overfit probe;
- per-label recall or confusion evidence;
- comparison against M3AE-G train sanity and random top-1 chance `0.2`;
- train-fit gate classification;
- hard-negative/calibration blockers kept separate;
- exactly one next action.

## Next-Action Choices

Choose exactly one next action in the microprobe report:

- `rerun_tier0_smoke_with_microprobe_config`: use only if train sanity passes
  on the tiny identity-preserving probe and the configuration remains compliant
  enough to test as the next bounded Tier 0 smoke.
- `input_adapter_remediation`: use if train sanity still fails and evidence
  points to input representation, crop identity, or scale loss.
- `architecture_code_probe`: use if existing CLI architectures/options cannot
  isolate train fit without a small code-level model/input change.
- `label_or_split_remediation`: use if train sanity passes but validation
  remains poor in a way that points to label quality, split, or signer/source
  distribution.
- `stop_reduced_claim`: use when no further bounded no-new-source diagnostic is
  justified without human sign/data review, new source approval, or a changed
  product claim.

## Hard Boundaries

- Do not run more than one microprobe training job.
- Do not run the drafted same-grid, no-batch-cap, 12-epoch full-train-set
  parameter tweak.
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

1. `GOAL.md` points at this prompt and names Mission 3AE-I.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. M3AC/M3AD/M3AE/M3AE-R/M3AE-F/M3AE-G/M3AE-H artifacts are still valid JSON,
   and `scripts/run_return_to_form_tier0_decode_dataloader.py` still reports
   `status=passed`, `missing_file_count=0`, and one dataloader batch shape per
   split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` through
   `rgb_regions_grid_v1` with no `rgb_frames` fallback for the sampled Tier 0
   payloads.
5. Exactly one tiny overfit microprobe uses only the selected labels, M3AD
   manifests, approved source id `popsign-v1-original-videos`, random
   initialization, `pretrained_components: []`, crop-identity-preserving input,
   and no new source/media/label inputs.
6. [`docs/validation/return-to-form-tier0-model-architecture-microprobe.json`](../validation/return-to-form-tier0-model-architecture-microprobe.json)
   records the source triage report, API strategy memo, command/configuration,
   tiny subset selection, baseline comparison, loss movement, tiny-subset
   train-fit metrics, per-label recall or confusion evidence, input contract,
   crop-identity-preservation method, random-chance comparison, train-fit gate
   classification, and exactly one next action from this prompt.
7. The Mutable Tactical Overlay links to the microprobe report and records
   exactly one next action.
8. A numbered session log records commands, selected signs, manifest/source/
   crop/gate hashes, M3AE-G failure metrics, M3AE-H triage findings,
   microprobe evidence, Brev worker status, the separate final-promotion
   negative-challenge blocker, and the next action.
9. No label expansion, controlled clip-heldout evaluation, source approval,
   unapproved media import, ONNX export, model-card promotion,
   final-readiness claim, broad-run redirect, Brev stop, duplicate Brev worker,
   final-gate weakening, or push occurs.

When all nine are true, continue the goal loop according to the microprobe
report's single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-I Tier 0 model architecture microprobe.
Completed:            <microprobe evidence or exact blocker>.
Evidence:             <artifact paths, hashes, metrics, and audit statuses>.
Remaining:            <single next action from the microprobe report>.
Blockers:             <none, or exact evidence/tooling/data blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
