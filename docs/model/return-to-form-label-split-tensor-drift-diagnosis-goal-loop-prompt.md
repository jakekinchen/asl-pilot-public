# Return-To-Form Label/Split/Tensor Drift Diagnosis Goal Loop Prompt

Mission 3BQ prompt for the Codex executor after Mission 3BP selected
`escalate_strategy_research_with_local_evidence` and the observer API memo
recommended one local label/split/tensor drift diagnosis.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training diagnosis packet that decides
whether the remaining ASL Citizen high-signal failure after ROI clearance is
best explained by label/class-index mapping inconsistency, split/domain drift,
source or video quality weakness, vocabulary choice or insufficient retained
labels, or a model/data design limitation.

This mission must use existing local artifacts only. It must not mutate
training data, manifests, tensors, crops, source approvals, model state,
browser state, product claims, or final gates.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. Observer escalation evidence:
   - [`artifacts/research/observer-364-post-roi-strategy-api-response.md`](../../artifacts/research/observer-364-post-roi-strategy-api-response.md)
   - [`docs/session-logs/364-observer-escalate-post-roi-strategy.md`](../session-logs/364-observer-escalate-post-roi-strategy.md)
4. M3BP evidence:
   - [`docs/validation/return-to-form-asl-citizen-manual-coarse-roi-packet-v1.json`](../validation/return-to-form-asl-citizen-manual-coarse-roi-packet-v1.json)
   - [`docs/session-logs/363-mission-3bp-asl-citizen-manual-coarse-roi-packet.md`](../session-logs/363-mission-3bp-asl-citizen-manual-coarse-roi-packet.md)
5. M3BO and M3BN evidence:
   - [`docs/validation/return-to-form-asl-citizen-high-signal-crop-roi-contract-v1.json`](../validation/return-to-form-asl-citizen-high-signal-crop-roi-contract-v1.json)
   - [`docs/validation/return-to-form-dataset-training-root-cause-v1.json`](../validation/return-to-form-dataset-training-root-cause-v1.json)
6. ASL Citizen high-signal region-grid artifacts:
   - `data/manifests/lesson/high-signal-region-grid/train.json`
   - `data/manifests/lesson/high-signal-region-grid/validation.json`
   - `data/manifests/lesson/high-signal-region-grid/test.json`
   - `data/tensors/asl-citizen-high-signal-region-grid/`

## Current Evidence

M3BP found that all ten target drift rows have viewable local evidence and
manually clear coarse ROI inclusion in the existing five-region tensor package.
No target row requires crop-config repair, and no target row is blocked by
missing viewable evidence.

M3BP still found no training-worthy retained subset:

- `table`, `please`, `white`, and `sad` remain held by prior zero-recall /
  never-predicted held-out gates.
- `black` remains deferred by validation zero-recall and targeted repair gates.
- `uncle` remains repair-required by prior validation/test zero-recall and
  repair gates.
- `hello` is the only plausible ROI-visibility candidate, but one label is not
  enough to form a training-worthy subset and crop-stat drift remains
  unexplained.

The observer API memo for M3BP rejected Brev, recognizer training, source work,
Detector 0/schema repair, crop-config repair, product-only work, and STOP now.
It authorized one local/no-spend diagnosis packet to isolate whether the
remaining blocker is label mapping, split/domain drift, source quality,
vocabulary choice, or model/data design.

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
python3 -m json.tool docs/validation/return-to-form-asl-citizen-manual-coarse-roi-packet-v1.json >/dev/null
```

Do not run Brev commands.

2. Inspect only existing local manifests, tensors, configs, receipts, and
already-materialized evidence. Do not download, import, annotate, train, fit,
mutate, or generate pseudo-labels.

3. Scope the diagnosis to the M3BP label set:

- `table`
- `please`
- `black`
- `hello`
- `uncle`
- `white`
- `sad`

4. Produce:

`docs/validation/return-to-form-label-split-tensor-drift-diagnosis-v1.json`

The JSON must include, for each scoped label:

- label mapping check:
  - canonical gloss string;
  - class index / label id as represented in existing manifests, tensors, or
    configs;
  - train/validation/test consistency;
  - case, alias, whitespace, or duplicate-label risks;
  - status: `cleared`, `suspect`, or `blocked`.
- split support check:
  - train/validation/test counts from existing manifests;
  - whether held-out rows have corresponding train support;
  - signer/session/source/camera/domain metadata if already present locally;
  - whether validation/test rows appear domain-shifted relative to train rows;
  - status: `cleared`, `drift_suspect`, `insufficient_support`, or `blocked`.
- tensor/stat check:
  - five-region tensor availability;
  - tensor shape consistency;
  - frame count / duration summary if available;
  - missing/zero/invalid region-rate summary if available;
  - crop/stat drift versus train split where measurable;
  - status: `cleared`, `drift_suspect`, `invalid`, or `blocked`.
- local evidence quality check:
  - only local viewability, articulation visibility, and framing quality;
  - no ASL correctness claims;
  - no pseudo-labels;
  - status: `cleared`, `quality_suspect`, or `blocked`.
- label-level diagnosis, exactly one of:
  - `mapping_suspect`
  - `split_domain_drift_suspect`
  - `source_quality_suspect`
  - `insufficient_training_support`
  - `vocabulary_not_training_worthy`
  - `candidate_for_model_data_design_ablation`
  - `blocked_inconclusive`

The receipt must also include:

- retained-label list, possibly empty;
- whether the at-least-two training-worthy labels gate is met;
- exact gates required before any local or Brev training receipt;
- Brev usefulness now and missing receipt fields before remote execution;
- explicit no-pretrained/no-pseudo-label/no-training/non-promotion language;
- commands run, files changed, blockers, and exactly one next action.

5. Add or update only analysis-only helpers if needed. Any helper must be
read-only against existing local artifacts and must not train, fit, mutate,
download, export, activate the browser model, or change final gates.

6. Select exactly one next action:

- `prepare_label_mapping_defect_repair_packet`: concrete local evidence shows
  manifest/config/tensor class mapping inconsistency.
- `prepare_vocab_reselection_packet_from_existing_local_artifacts`: current
  labels are not training-worthy because of split/support/source drift, but
  existing approved local artifacts may contain better candidates.
- `prepare_model_data_design_ablation_packet`: label mapping, split support,
  evidence quality, and tensor validity are cleared for at least two labels,
  but zero-recall remains unexplained.
- `prepare_bounded_training_compute_receipt_for_human_approval`: at least two
  labels are training-worthy and the receipt defines the exact future command,
  runtime/spend cap, kill condition, expected signal, artifact copyback, and
  cleanup/default-off plan. This does not authorize running it.
- `stop_for_human_strategy_decision`: local evidence cannot distinguish the
  blocker without prohibited source work, unsupported ML claims, or paid
  compute.

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
- No schema repair unless selected as a future action in the receipt.
- No pretrained detector, landmark, backbone, embedding, generated-label, or
  assisted-label path in the promoted lane.
- No ONNX export, browser model activation, active-label promotion, model-card
  promotion, final readiness claim, final-gate weakening, product fallback
  implementation, ASL correctness claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3BQ.
2. The tracked diagnosis JSON exists and is valid JSON.
3. The packet covers the seven M3BP labels or records exact blockers.
4. The packet uses existing local artifacts only and records evidence paths.
5. The packet records label mapping, split/domain support, tensor/stat drift,
   and local evidence quality findings for each scoped label.
6. The packet assigns exactly one label-level diagnosis to each scoped label.
7. The packet decides whether at least two labels are training-worthy before
   any training receipt.
8. No source import, source-register approval, manifest/tensor mutation,
   crop-config mutation, training, Detector 0 training, Brev command, export,
   browser activation, model-card promotion, final-gate change, unsupported
   claim, or push occurs.
9. `node scripts/audit_return_to_form_plan.mjs --json`,
   `node scripts/audit_loop_premise.mjs --json`,
   `node scripts/audit_no_pretrained_deps.mjs`,
   `node scripts/audit_no_pretrained_artifact_json.mjs`, receipt JSON
   validation, and `git diff --check` exit 0 or record exact blockers.
10. A numbered session log records commands, evidence, blockers, and exactly
    one next action.

## Observer Guidance

- CONTINUE only if the packet covers the scoped labels, separates mapping,
  split/domain, tensor/stat, and evidence-quality findings, decides the
  retained-label gate, and selects one bounded next action.
- NUDGE if the packet lacks label-level diagnosis, evidence paths,
  retained-label decision, Brev assessment, or exactly one next action.
- REDIRECT if the executor drifts into training, source shortcuts,
  pseudo-labeling, Brev action, crop/schema mutation, product activation, or
  unsupported promotion.
- ESCALATE only if the packet cannot distinguish the blocker and another local
  diagnosis or repair turn would be low-confidence.
- STOP when the next meaningful action truly requires human strategy, source,
  rights, annotation, budget, or credential approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3BQ label/split/tensor drift diagnosis.
Completed:            <diagnosis receipt, blocker, optional analysis-only helper>.
Evidence:             <receipt, commands, input artifact hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact artifact/scope blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
