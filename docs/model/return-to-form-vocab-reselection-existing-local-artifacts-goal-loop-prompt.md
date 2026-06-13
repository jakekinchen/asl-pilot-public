# Return-To-Form Vocabulary Reselection From Existing Local Artifacts Goal Loop Prompt

Mission 3BR prompt for the Codex executor after Mission 3BQ selected
`prepare_vocab_reselection_packet_from_existing_local_artifacts`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training vocabulary reselection packet
from already-approved local artifacts. The packet should decide whether the
repo contains a better 2+ label candidate subset than the current seven-label
ASL Citizen high-signal set, without importing sources, mutating manifests or
tensors, approving new sources, generating pseudo-labels, or running training.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3BQ evidence:
   - [`docs/validation/return-to-form-label-split-tensor-drift-diagnosis-v1.json`](../validation/return-to-form-label-split-tensor-drift-diagnosis-v1.json)
   - [`docs/session-logs/365-mission-3bq-label-split-tensor-drift-diagnosis.md`](../session-logs/365-mission-3bq-label-split-tensor-drift-diagnosis.md)
4. Prior local artifact and source evidence:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/validation/return-to-form-dataset-training-root-cause-v1.json`](../validation/return-to-form-dataset-training-root-cause-v1.json)
   - [`docs/validation/return-to-form-asl-citizen-high-signal-module-selection-v1.json`](../validation/return-to-form-asl-citizen-high-signal-module-selection-v1.json)
   - [`docs/validation/return-to-form-asl-citizen-high-signal-module-vocabulary-review-evidence-v1.json`](../validation/return-to-form-asl-citizen-high-signal-module-vocabulary-review-evidence-v1.json)
   - [`docs/validation/return-to-form-asl-citizen-high-signal-module-manifest-gates-v1.json`](../validation/return-to-form-asl-citizen-high-signal-module-manifest-gates-v1.json)
   - [`docs/validation/return-to-form-high-signal-region-grid-materialization-v1.json`](../validation/return-to-form-high-signal-region-grid-materialization-v1.json)
   - [`docs/validation/return-to-form-vocab-subset-contract-v1.json`](../validation/return-to-form-vocab-subset-contract-v1.json)
   - [`docs/validation/return-to-form-data-quality-contract-v1.json`](../validation/return-to-form-data-quality-contract-v1.json)
5. Existing local manifests/tensors only, such as:
   - `data/manifests/`
   - `data/tensors/`
   - `artifacts/`
   - `output/`

## Current Evidence

M3BQ cleared class-index mapping and tensor availability for the seven scoped
ASL Citizen high-signal labels. It found no training-worthy retained labels.
The current labels are blocked by split/stat drift, source-quality suspicion,
insufficient held-out support, or prior zero-recall / never-predicted gates
rather than by class-index mapping or tensor availability.

M3BQ selected exactly one next action:
`prepare_vocab_reselection_packet_from_existing_local_artifacts`.

## Required Slice

Complete one local/no-spend, no-training reselection packet.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-label-split-tensor-drift-diagnosis-v1.json >/dev/null
```

Do not run Brev commands.

2. Inventory already-approved local artifacts only. Use the source register and
tracked receipts to distinguish:

- approved local training/evaluation artifacts;
- local evidence useful only for research/reference;
- blocked sources such as SemLex / ASL-LEX media;
- stale or superseded artifacts that must not drive a claim.

3. Evaluate candidate labels or small label groups from existing local
artifacts. The packet must fail closed unless evidence is already local,
source-approved for the intended use, and reviewable.

4. Produce:

`docs/validation/return-to-form-vocab-reselection-existing-local-artifacts-v1.json`

The JSON must include:

- source-register snapshot and artifact inventory;
- candidate label table with source, manifest/tensor availability, split
  support, signer/support counts when present, local quality status, prior
  failure evidence, and source approval status;
- explicit exclusions for the current seven-label ASL Citizen high-signal set,
  SemLex/ASL-LEX media, unsupported public datasets, stale product-only
  artifacts, and any artifact lacking local evidence;
- whether a 2+ label candidate subset exists before training;
- for any candidate subset, exact evidence paths and remaining gates before any
  manifest/tensor materialization, local training receipt, or Brev compute
  receipt;
- Brev usefulness now and missing receipt fields before remote execution;
- explicit no-pretrained/no-pseudo-label/no-training/non-promotion language;
- commands run, files changed, blockers, and exactly one next action.

5. Add or update only analysis-only helpers if needed. Any helper must be
read-only against existing local artifacts and must not train, fit, mutate,
download, export, activate the browser model, or change final gates.

6. Select exactly one next action:

- `continue_reselected_subset_manifest_contract`: a 2+ label candidate subset
  exists and needs a no-training manifest/tensor/gate contract before any
  training receipt.
- `continue_bounded_local_training_receipt`: a 2+ label candidate subset
  already has local manifests/tensors and gates strong enough to write a
  no-spend local training receipt before any run.
- `continue_bounded_brev_training_receipt`: a 2+ label candidate subset already
  has strong enough local evidence to justify a separate Brev compute receipt
  for human approval. This does not authorize running Brev.
- `escalate_strategy_research_with_local_evidence`: local reselection evidence
  is ambiguous and another no-training repair turn would be low-confidence.
- `stop_for_human_source_or_annotation_approval`: the next meaningful unblock
  requires source/rights approval, annotation, or human data collection.
- `stop_until_supported_training_data_exists`: no existing local approved
  artifact can support a 2+ label training-worthy subset.

## Hard Boundaries

- No broad 75/95/100-label training or evaluation.
- No recognizer training, tiny-overfit rerun, Detector 0 training, model
  fitting, optimizer/backward pass, checkpoint creation, sweep, calibration, or
  threshold promotion.
- No Brev sync, exec, training, spend, stop/start/create/delete/reset, or
  duplicate worker action.
- No source import, source-register approval, dataset download, manifest/tensor
  mutation, crop-config mutation, generated pseudo-labels, or use of blocked
  SemLex/ASL-LEX media.
- No pretrained detector, landmark, backbone, embedding, generated-label, or
  assisted-label path in the promoted lane.
- No ONNX export, browser model activation, active-label promotion, model-card
  promotion, final readiness claim, final-gate weakening, product fallback
  implementation, ASL correctness claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3BR.
2. The tracked reselection JSON exists and is valid JSON.
3. The packet inventories already-approved local artifacts and records evidence
   paths.
4. The packet explicitly excludes blocked, stale, unsupported, or nonlocal
   sources.
5. The packet decides whether a 2+ label candidate subset exists before
   training.
6. The packet records the next required gates for any candidate subset.
7. No source import, source-register approval, manifest/tensor mutation,
   crop-config mutation, training, Detector 0 training, Brev command, export,
   browser activation, model-card promotion, final-gate change, unsupported
   claim, or push occurs.
8. `node scripts/audit_return_to_form_plan.mjs --json`,
   `node scripts/audit_loop_premise.mjs --json`,
   `node scripts/audit_no_pretrained_deps.mjs`,
   `node scripts/audit_no_pretrained_artifact_json.mjs`, receipt JSON
   validation, and `git diff --check` exit 0 or record exact blockers.
9. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE only if the packet inventories local approved artifacts, excludes
  unsupported sources, decides the 2+ label candidate gate, and selects one
  bounded next action.
- NUDGE if the packet lacks source/register evidence, explicit exclusions,
  candidate subset decision, Brev assessment, or exactly one next action.
- REDIRECT if the executor drifts into source import, source approval,
  pseudo-labeling, Brev action, training, crop/schema mutation, product
  activation, or unsupported promotion.
- ESCALATE if local reselection cannot distinguish a viable path and another
  repair turn would be low-confidence.
- STOP when the next meaningful action requires human strategy, source, rights,
  annotation, budget, or credential approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3BR vocabulary reselection from existing local artifacts.
Completed:            <reselection receipt, blocker, optional analysis-only helper>.
Evidence:             <receipt, commands, input artifact hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact artifact/scope blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
