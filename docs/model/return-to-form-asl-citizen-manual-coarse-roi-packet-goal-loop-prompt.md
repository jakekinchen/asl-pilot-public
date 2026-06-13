# Return-To-Form ASL Citizen Manual Coarse ROI Packet Goal Loop Prompt

Mission 3BP prompt for the Codex executor after Mission 3BO selected
`continue_manual_coarse_roi_packet`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training manifest-bound manual coarse
ROI packet for the ASL Citizen high-signal drift rows identified in M3BO.

The output should decide, from existing local evidence only, whether active
signing motion and signer upper-body/hand context remain inside the fixed
five-region crop for the target rows, or whether the repo needs human review,
manual annotation, source approval, or a crop-config repair before any training
receipt is justified.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3BO evidence:
   - [`docs/validation/return-to-form-asl-citizen-high-signal-crop-roi-contract-v1.json`](../validation/return-to-form-asl-citizen-high-signal-crop-roi-contract-v1.json)
   - [`docs/session-logs/361-mission-3bo-asl-citizen-high-signal-crop-roi-contract.md`](../session-logs/361-mission-3bo-asl-citizen-high-signal-crop-roi-contract.md)
4. Prior root-cause and crop evidence:
   - [`docs/validation/return-to-form-dataset-training-root-cause-v1.json`](../validation/return-to-form-dataset-training-root-cause-v1.json)
   - [`docs/validation/return-to-form-crop-region-contract-v1.json`](../validation/return-to-form-crop-region-contract-v1.json)
   - [`docs/validation/return-to-form-vocab-crop-separability-diagnosis-v1.json`](../validation/return-to-form-vocab-crop-separability-diagnosis-v1.json)
   - [`docs/validation/return-to-form-vocab-subset-contract-v1.json`](../validation/return-to-form-vocab-subset-contract-v1.json)
   - [`docs/validation/return-to-form-data-quality-contract-v1.json`](../validation/return-to-form-data-quality-contract-v1.json)
5. ASL Citizen high-signal region-grid artifacts:
   - `data/manifests/lesson/high-signal-region-grid/train.json`
   - `data/manifests/lesson/high-signal-region-grid/validation.json`
   - `data/manifests/lesson/high-signal-region-grid/test.json`
   - `data/tensors/asl-citizen-high-signal-region-grid/`

## Current Evidence

M3BO completed a no-training crop/ROI contract and selected exactly one next
action: `continue_manual_coarse_roi_packet`.

The target drift rows are:

- `validation:table`
- `validation:please`
- `validation:hello`
- `validation:white`
- `validation:sad`
- `test:please`
- `test:black`
- `test:hello`
- `test:uncle`
- `test:sad`

M3BO found that existing fixed-region tensors are present and loadable, but no
label currently clears crop/ROI and data-quality gates into a training-worthy
subset. Brev and recognizer training remain unjustified.

## Required Slice

Complete one local/no-spend, no-training packet.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-asl-citizen-high-signal-crop-roi-contract-v1.json >/dev/null
```

Do not run Brev commands.

2. Inspect existing local artifacts only. Prefer structured JSON/tensor metadata
or already-materialized manifest-bound frame references. If no viewable local
evidence exists for a target row, record that as a blocker instead of importing,
downloading, generating pseudo-labels, or mutating data.

3. Produce:

`docs/validation/return-to-form-asl-citizen-manual-coarse-roi-packet-v1.json`

The JSON must include:

- target row list and source evidence paths;
- per-row support and available local evidence;
- review rubric for active signing motion and upper-body/hand context inside
  the fixed five-region crop;
- per-row coarse ROI status: `cleared`, `held`, `requires_human_review`,
  `requires_crop_config_repair`, or `blocked_no_viewable_evidence`;
- a label-level rollup showing whether any labels can be retained;
- whether a nonempty retained subset exists before training;
- exact gates required before any local or Brev training receipt;
- Brev usefulness now and missing receipt fields before remote execution;
- explicit no-pretrained/no-pseudo-label/no-training/non-promotion language;
- commands run, files changed, blockers, and exactly one next action.

4. Add or update only analysis-only helpers if needed. Any helper must be
read-only against existing local artifacts and must not train, fit, mutate,
download, export, activate the browser model, or change final gates.

5. Select exactly one next action:

- `continue_crop_config_repair_contract`: the packet identifies a bounded
  crop-config repair that can be specified without media import, tensor
  mutation, training, or pseudo-labels.
- `continue_bounded_local_training_receipt`: the packet yields a nonempty
  retained subset and the next slice should write a no-spend local training
  receipt before any run.
- `continue_bounded_brev_training_receipt`: the packet yields a nonempty
  retained subset and remote training may be justified only after a separate
  Brev compute receipt records worker state, listed price, command, max
  runtime, max spend, kill condition, expected signal, copyback, cleanup, and
  current human approval.
- `escalate_strategy_research_with_local_evidence`: local ROI evidence is still
  ambiguous and another repair/training turn would be low-confidence.
- `stop_for_human_roi_review`: the next meaningful unblock requires a human to
  review local frames or consented source material.
- `stop_for_human_annotation_or_source_approval`: the next meaningful unblock
  requires annotation, source/rights approval, or manual data collection.
- `stop_until_crop_roi_repair_evidence_exists`: no current route can support a
  repair or training receipt, and the exact missing evidence is recorded.

## Hard Boundaries

- No broad 75/95/100-label training or evaluation.
- No recognizer training, tiny-overfit rerun, Detector 0 training, model
  fitting, optimizer/backward pass, checkpoint creation, sweep, calibration, or
  threshold promotion.
- No Brev sync, exec, training, spend, stop/start/create/delete/reset, or
  duplicate worker action.
- No source import, source-register approval, dataset download, manifest/tensor
  mutation, generated pseudo-labels, or use of blocked SemLex/ASL-LEX media.
- No pretrained detector, landmark, backbone, embedding, generated-label, or
  assisted-label path in the promoted lane.
- No ONNX export, browser model activation, model-card promotion, final
  readiness claim, final-gate weakening, product fallback implementation, or
  push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3BP.
2. The tracked manual coarse ROI packet JSON exists and is valid JSON.
3. The packet covers all ten M3BO target drift rows or records exact blockers.
4. The packet uses existing local artifacts only and records evidence paths.
5. The packet makes per-row and label-level coarse ROI decisions, including
   whether a nonempty retained subset exists before training.
6. No source import, source-register approval, manifest/tensor mutation,
   training, Detector 0 training, Brev command, export, browser activation,
   model-card promotion, final-gate change, unsupported claim, or push occurs.
7. Required audits and `git diff --check` pass or record exact blockers.
8. A numbered session log records commands, evidence, blockers, and exactly one
   next action.

## Observer Guidance

- CONTINUE only if the packet covers the target rows and selects one bounded
  repair, receipt, escalation, or human-stop lane.
- NUDGE if the packet lacks per-row ROI decisions, evidence paths, retained
  subset decision, Brev assessment, or exactly one next action.
- REDIRECT if the executor drifts into training, source shortcuts, pretrained
  pseudo-labeling, Brev action, or unsupported promotion.
- ESCALATE before another training-style retry if local ROI evidence still
  cannot distinguish the technical blocker.
- STOP when the next meaningful action truly requires human ROI review, source,
  rights, annotation, budget, or credential approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3BP ASL Citizen manual coarse ROI packet.
Completed:            <packet receipt, blocker, optional analysis-only helper>.
Evidence:             <receipt, commands, input artifact hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact artifact/scope blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
