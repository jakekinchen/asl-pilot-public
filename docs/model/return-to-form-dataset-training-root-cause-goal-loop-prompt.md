# Return-To-Form Dataset Training Root-Cause Goal Loop Prompt

Mission 3BN prompt for the Codex executor after the user explicitly redirected
the loop back to figuring out why the available dataset routes are not feeding
a successful scratch-trained ASL recognizer attempt.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Diagnose, with repo-local evidence, what is preventing the current SemLex /
ASL-LEX, PopSign, ASL Citizen, Detector 0, and region-grid training paths from
becoming a justified successful training attempt. The output is not another
product fallback and not another broad training retry. The output is a ranked
root-cause matrix plus the smallest evidence-backed repair or training
experiment that should happen next.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. Dataset/source policy:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/model/dataset-source-register.md`](dataset-source-register.md)
   - [`docs/model/dataset-and-training-plan.md`](dataset-and-training-plan.md)
5. Existing training/data artifacts:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - `data/manifests/return-to-form-tier0/`
   - `data/manifests/lesson/high-signal-region-grid/`
   - `data/tensors/asl-citizen-high-signal-region-grid/`
   - `data/manifests/diagnostics/asl-citizen-selected/`
   - `data/manifests/lesson/rawframe-milestone/`
6. Recent failure/diagnostic receipts:
   - [`docs/validation/return-to-form-region-grid-tcn-local-smoke-v1.json`](../validation/return-to-form-region-grid-tcn-local-smoke-v1.json)
   - [`docs/validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json`](../validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json)
   - [`docs/validation/return-to-form-vocab-subset-contract-v1.json`](../validation/return-to-form-vocab-subset-contract-v1.json)
   - [`docs/validation/return-to-form-data-quality-contract-v1.json`](../validation/return-to-form-data-quality-contract-v1.json)
   - [`docs/research/semlex-asl-lex-overlap-source-review-v1.json`](../research/semlex-asl-lex-overlap-source-review-v1.json)
   - [`docs/research/semlex-source-register-candidate-no-import-v1.json`](../research/semlex-source-register-candidate-no-import-v1.json)
7. Detector 0 / crop-normalization receipts around M3AE-AJ through M3AE-AP
   when assessing whether missing detectors or landmarks are the present
   blocker.

## Current Evidence

The M3BM no-ML lesson replay direction was a temporary observer recommendation
after SemLex/ASL-LEX source work stalled. The latest user instruction
supersedes that product-only direction. Treat M3BM as historical context, not
the current destination.

Known facts to reconcile:

- ASL Citizen high-signal region-grid data exists locally: 139 clips, split as
  train 84, validation 27, test 28, with `rgb_regions_grid_v1`.
- The current TCN path can tiny-overfit a seven-clip subset, so the training
  stack is not obviously dead.
- Held-out ASL Citizen high-signal predictions collapsed to a few labels, with
  multiple never-predicted labels and crop-stat drift.
- Prior contracts concluded no current high-signal ASL Citizen subset was
  training-worthy, but those conclusions are evidence to explain, not a reason
  to abandon the ML path without root-cause isolation.
- PopSign remains a locally evidenced approved video route with prior Tier 0
  diagnostic training evidence, but it has not yielded a promotable
  signer-disjoint recognizer.
- SemLex/ASL-LEX remains a useful original-plan idea for phonology, but current
  repo evidence says no approved local SemLex media or non-media phonology
  surface is available.
- Scratch Detector 0 / crop normalization may be a real composable blocker, but
  do not assume full hand/posture/face landmarks are required until the
  evidence distinguishes crop/ROI failure from source, split, label, or model
  contract failure.

## Required Slice

Complete one local/no-spend diagnostic slice.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
```

2. Build a dataset-route inventory for every relevant current route:

- PopSign / Tier 0 fixed-crop and Detector 0 receipts.
- ASL Citizen rawframe lesson manifests.
- ASL Citizen high-signal module and high-signal region-grid tensors.
- SemLex / ASL-LEX source and phonology route.
- Any other already-tracked route that appears in the current receipts.

For each route, record rights/source status, local asset availability,
manifest/tensor availability, vocabulary overlap, split/signer support, input
format, crop/ROI assumptions, known metrics, and the exact blocker before a
successful attempt.

3. Classify root causes. The diagnosis must explicitly distinguish:

- source/provenance/rights blocker;
- missing local media or metadata;
- manifest/schema/label-mapping blocker;
- signer split or per-label support blocker;
- crop/ROI/region drift blocker;
- model input/architecture/training-loop blocker;
- compute/environment blocker;
- missing Detector 0, hand, posture, or face landmark supervision;
- unsupported claim or audit blocker.

4. Run only cheap local probes that materially separate hypotheses. Examples:

- JSON/manifest/tensor inventory checks;
- dataloader contract checks;
- label and signer distribution summaries;
- tensor shape/hash/sample metadata checks;
- crop-stat separability summaries;
- class-prior or no-training baselines;
- single-batch label-path sanity checks.

Do not run a broad recognizer training job, Brev command, source import, or
claim-changing workflow in this diagnostic slice. A tiny local no-spend probe is
acceptable only if it is bounded, recorded, and needed to decide between two
root-cause hypotheses.

5. Produce:

`docs/validation/return-to-form-dataset-training-root-cause-v1.json`

The JSON must include:

- route inventory;
- root-cause matrix with evidence paths;
- assessment of whether missing hand/posture/face/landmark detectors are
  current blockers or future robustness work;
- smallest supported next training attempt, if one exists;
- exact repair needed if no training attempt is currently justified;
- whether Brev is useful now, and the missing receipt fields before any remote
  run;
- commands run;
- files changed;
- blockers;
- exactly one next action.

6. Select exactly one next action:

- `continue_dataset_training_contract_repair`: a local contract/schema/label
  repair is clearly the smallest next step.
- `continue_manual_or_source_repair_packet`: the blocker is missing reviewed
  source, manual annotation, or source-register evidence.
- `continue_detector_or_crop_contract_repair`: the blocker is coarse ROI/crop
  localization, not full recognizer training.
- `continue_bounded_local_training_probe`: a tiny no-spend local training probe
  is now justified by a nonempty supported subset and explicit gates.
- `continue_bounded_brev_training_receipt`: a remote run is justified and the
  next slice should write the max-runtime/max-spend/kill/copyback receipt
  before executing it.
- `escalate_strategy_research_with_local_evidence`: the evidence is still
  ambiguous after local diagnosis and needs OpenAI API or GPT Pro research tied
  to the repo artifacts.
- `stop_for_human_source_or_annotation_approval`: human source/rights/manual
  annotation approval is the only meaningful unblock.
- `stop_until_supported_training_data_exists`: no current route can support a
  training attempt and the exact missing data is recorded.

## Hard Boundaries

- No broad 75/95/100-label training or evaluation.
- No Brev sync, exec, training, spend, stop/start/create/delete/reset, or
  duplicate worker action.
- No source import, source-register approval, dataset download, manifest/tensor
  mutation, generated pseudo-labels, or use of blocked SemLex/ASL-LEX media.
- No pretrained detector, landmark, backbone, embedding, generated-label, or
  assisted-label path in the promoted lane.
- No ONNX export, browser model activation, threshold promotion, model-card
  promotion, final-readiness claim, final-gate weakening, or push.
- No product fallback implementation in this slice.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3BN.
2. The tracked root-cause JSON exists and is valid JSON.
3. The JSON inventories PopSign, ASL Citizen, SemLex/ASL-LEX, and Detector 0 /
   crop-normalization relevance.
4. The root-cause matrix separates source, data, split, crop, architecture,
   training-loop, compute, and detector/landmark hypotheses with evidence.
5. The diagnosis does not merely repeat "no training-worthy subset" without
   explaining what specific blocker produced that state and what repair would
   change it.
6. Any recommended training attempt names labels, manifests/tensors, gates,
   command shape, spend/runtime boundary, and stop condition; if no attempt is
   supported, the exact missing repair is named.
7. Required audits and `git diff --check` pass or exact blockers are recorded.
8. A numbered session log records commands, evidence, blockers, and exactly one
   next action.

## Observer Guidance

- CONTINUE only if the executor produced a concrete root-cause artifact and the
  next action is a bounded repair, bounded local probe, bounded Brev receipt, or
  evidence-tied strategy escalation.
- REDIRECT if the executor drifts back to no-ML product fallback, broad
  training, source shortcuts, or unsupported promotion without diagnosing the
  dataset/training blocker.
- NUDGE if the artifact lacks route inventory, root-cause categories,
  detector/landmark assessment, evidence paths, or exactly one next action.
- ESCALATE with `openai-api-research` or `gpt-pro-research` before another
  training-style retry if local evidence still cannot distinguish the technical
  blocker.
- STOP only when the next meaningful action truly requires human source,
  rights, annotation, budget, or credential approval.
