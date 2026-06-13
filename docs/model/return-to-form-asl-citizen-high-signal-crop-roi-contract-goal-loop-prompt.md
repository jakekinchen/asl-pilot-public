# Return-To-Form ASL Citizen High-Signal Crop/ROI Contract Goal Loop Prompt

Mission 3BO prompt for the Codex executor after Mission 3BN diagnosed the
dataset/training root cause and selected
`continue_detector_or_crop_contract_repair`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training crop/ROI repair contract for
the ASL Citizen high-signal region-grid route.

The goal is to decide whether existing manifest-bound full-frame/reference and
fixed-region evidence can support a nonempty retained subset after crop/ROI
repair, or whether the next useful step requires a reviewed coarse-ROI packet,
manual/source approval, strategy escalation, or STOP. This mission must not
train a recognizer or Detector 0 model.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. Mission 3BN evidence:
   - [`docs/validation/return-to-form-dataset-training-root-cause-v1.json`](../validation/return-to-form-dataset-training-root-cause-v1.json)
   - [`docs/session-logs/359-mission-3bn-dataset-training-root-cause.md`](../session-logs/359-mission-3bn-dataset-training-root-cause.md)
4. ASL Citizen high-signal region-grid artifacts:
   - `data/manifests/lesson/high-signal-region-grid/train.json`
   - `data/manifests/lesson/high-signal-region-grid/validation.json`
   - `data/manifests/lesson/high-signal-region-grid/test.json`
   - `data/tensors/asl-citizen-high-signal-region-grid/`
5. Earlier ASL Citizen contracts and diagnostics:
   - [`docs/validation/return-to-form-crop-region-contract-v1.json`](../validation/return-to-form-crop-region-contract-v1.json)
   - [`docs/validation/return-to-form-vocab-subset-contract-v1.json`](../validation/return-to-form-vocab-subset-contract-v1.json)
   - [`docs/validation/return-to-form-data-quality-contract-v1.json`](../validation/return-to-form-data-quality-contract-v1.json)
   - [`docs/validation/return-to-form-region-grid-tcn-local-smoke-v1.json`](../validation/return-to-form-region-grid-tcn-local-smoke-v1.json)
   - [`docs/validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json`](../validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json)
6. Detector 0 / crop-normalization receipts:
   - [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json)
   - related M3AE-AJ through M3AE-AP receipts when needed.

## Current Evidence

Mission 3BN closed with a valid root-cause receipt and selected exactly one
next action: `continue_detector_or_crop_contract_repair`.

Known facts to preserve:

- ASL Citizen high-signal has approved local school-assignment raw-video status,
  139 region-grid clips, seven labels, and signer-disjoint train/validation/test
  splits.
- The current TCN path can tiny-overfit one clip per label, so the data loader
  and model/input path are not obviously dead.
- Held-out predictions still collapse, no label currently clears all
  training-worthy gates, and the root-cause receipt points to crop/ROI and
  label-level held-out support drift.
- Missing full hand/posture/face landmarks are not the current required
  blocker. Full-landmark-style supervision remains future robustness work only
  if created under approved no-pretrained/manual or first-party rules.
- Brev is not useful now. No local or remote training attempt is justified
  until a crop/ROI contract yields a nonempty retained subset and a separate
  training receipt records gates, runtime, spend, stop condition, copyback, and
  cleanup/default-off requirements.

## Required Slice

Complete one local/no-spend diagnostic contract.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-dataset-training-root-cause-v1.json >/dev/null
```

Do not run Brev commands.

2. Inspect existing artifacts only. At minimum, use:

- the M3BN root-cause receipt;
- the M3BB crop/region contract;
- the M3BC vocabulary subset contract;
- the M3BD data-quality contract;
- M3AW/M3AX region-grid TCN smoke and tiny-overfit receipts;
- ASL Citizen high-signal region-grid manifests and tensor metadata;
- Detector 0 / crop-normalization receipts only as prior relevance evidence,
  not as authorization to train or mutate detector artifacts.

3. Produce:

`docs/validation/return-to-form-asl-citizen-high-signal-crop-roi-contract-v1.json`

The JSON must include:

- input artifacts and hashes or mtimes;
- route and source/provenance summary;
- per-label and per-split support summary;
- fixed-crop inclusion or drift classification from manifest-bound evidence;
- frame/tensor evidence paths used for each decision;
- whether a small reviewed coarse-ROI packet, crop-config repair, or no current
  repair is required;
- whether the contract yields a nonempty retained subset before training;
- gates required before any local or Brev training receipt;
- Brev usefulness now and missing receipt fields before remote execution;
- explicit assessment that full hand/posture/face landmarks are not the current
  required blocker unless the evidence contradicts M3BN;
- commands run, files changed, blockers, and exactly one next action.

4. Add or update only analysis-only helpers if needed. Any helper must be
read-only against manifests/tensors/receipts and must not train, fit, mutate,
download, export, activate the browser model, or change final gates.

5. Select exactly one next action:

- `continue_manual_coarse_roi_packet`: existing evidence shows a small reviewed
  coarse-ROI annotation packet is the smallest unblock.
- `continue_crop_config_repair_contract`: existing evidence supports a bounded
  local crop-config/contract repair without new source import, media download,
  manifest/tensor mutation, or training.
- `continue_bounded_local_training_receipt`: the contract yields a nonempty
  retained subset and the next slice should write a no-spend local training
  receipt before any run.
- `continue_bounded_brev_training_receipt`: the contract yields a nonempty
  retained subset and remote training may be justified only after a separate
  Brev compute receipt records worker state, listed price, command, max
  runtime, max spend, kill condition, expected signal, copyback, cleanup, and
  current human approval.
- `escalate_strategy_research_with_local_evidence`: local crop/ROI evidence is
  still ambiguous and the cost of another repair/training turn is high.
- `stop_for_human_annotation_or_source_approval`: the next meaningful unblock
  requires human-reviewed annotation, source/rights approval, or manual data
  collection.
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

1. `GOAL.md` points at this prompt and names Mission 3BO.
2. The tracked crop/ROI contract JSON exists and is valid JSON.
3. The JSON references M3BN plus the relevant ASL Citizen high-signal
   manifests/tensors and earlier crop/vocabulary/data-quality receipts.
4. The JSON classifies per-label/per-split support and crop/ROI inclusion or
   drift from existing local evidence.
5. The JSON decides whether a nonempty retained subset exists before training,
   or names the exact repair required before any training receipt.
6. No source import, source-register approval, manifest/tensor mutation,
   training, Detector 0 training, Brev command, export, browser activation,
   model-card promotion, final-gate change, unsupported claim, or push occurs.
7. Required audits and `git diff --check` pass or record exact blockers.
8. A numbered session log records commands, evidence, blockers, and exactly one
   next action.

## Observer Guidance

- CONTINUE only if the executor produces the crop/ROI contract and the next
  action is one bounded repair, receipt, escalation, or human-stop lane.
- REDIRECT if the executor drifts back to no-ML product fallback, broad
  training, source shortcuts, Detector 0 training, Brev action, or unsupported
  promotion.
- NUDGE if the artifact lacks per-label crop/ROI decisions, evidence paths,
  retained-subset decision, Brev assessment, landmark assessment, or exactly
  one next action.
- ESCALATE before another training-style retry if local crop/ROI evidence still
  cannot distinguish the technical blocker.
- STOP when the next meaningful action truly requires human source, rights,
  annotation, budget, or credential approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3BO ASL Citizen high-signal crop/ROI contract.
Completed:            <contract receipt, blocker, optional analysis-only helper>.
Evidence:             <receipt, commands, input artifact hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact artifact/scope blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
