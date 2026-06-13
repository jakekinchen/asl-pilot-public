# Return-To-Form M3FU Dataset Training Root-Cause No-Spend Goal Loop Prompt

Mission 3FU prompt for the Codex executor after M3FS/M3FT established that
Detector 0 evidence is diagnostic-only, while the latest human direction
explicitly asks to keep investigating why the available datasets and training
paths are not producing a successful recognizer attempt.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Perform one local/no-spend/no-training root-cause review of the current
dataset-to-training pipeline. The goal is to identify the highest-leverage
reason PopSign, ASL Citizen, SemLex, Detector 0, and crop/region-grid attempts
are not yet yielding a credible training attempt, then choose exactly one
bounded next action.

This is a strategy and evidence slice only. It does not authorize a training
run, fitting, smoke rerun, Brev lifecycle/spend, source/media import,
manifest/tensor/vocabulary mutation, export, promotion, browser activation,
runtime Detector 0 authority, model-card promotion, active-vocabulary
promotion, final-readiness claim, trainability claim, ASL correctness claim, or
push.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   the original spine, mutable overlay, milestone ladder, and M3EM-M3FT results.
4. Dataset/source and vocabulary surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/model/dataset-and-training-plan.md`](dataset-and-training-plan.md)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - manifests under [`data/manifests/`](../../data/manifests/)
5. Recent ML receipts and session logs, at minimum:
   - M3FM PopSign label-ladder triage:
     [`docs/validation/return-to-form-m3fm-popsign-label-ladder-metric-triage-no-training-v1.json`](../validation/return-to-form-m3fm-popsign-label-ladder-metric-triage-no-training-v1.json)
   - Observer 584 strategy memo:
     [`artifacts/research/observer-584-m3fm-popsign-label-ladder-strategy/response.md`](../../artifacts/research/observer-584-m3fm-popsign-label-ladder-strategy/response.md)
   - M3EY ASL Citizen 25-label training/eval receipt:
     [`docs/validation/return-to-form-m3ey-asl-citizen-25-label-lesson-model-brev-v1.json`](../validation/return-to-form-m3ey-asl-citizen-25-label-lesson-model-brev-v1.json)
   - M3FP Fresh5/Detector TCN completion receipt:
     [`docs/validation/return-to-form-m3fp-overnight-brev-detector-tcn-completion-v1.json`](../validation/return-to-form-m3fp-overnight-brev-detector-tcn-completion-v1.json)
   - M3FQ/M3FR/M3FS Detector 0 strict-gate receipts:
     [`docs/validation/return-to-form-m3fq-detector0-crop-normalized-recognizer-integration-v1.json`](../validation/return-to-form-m3fq-detector0-crop-normalized-recognizer-integration-v1.json),
     [`docs/validation/return-to-form-m3fr-detector0-strict-gate-local-smoke-no-brev-v1.json`](../validation/return-to-form-m3fr-detector0-strict-gate-local-smoke-no-brev-v1.json),
     [`docs/validation/return-to-form-m3fs-detector0-strict-gate-metric-triage-no-brev-v1.json`](../validation/return-to-form-m3fs-detector0-strict-gate-metric-triage-no-brev-v1.json)
6. Training, evaluation, tensor, and audit scripts under [`scripts/`](../../scripts/).
7. Current fail-closed claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Starting Evidence

- M3FM found PopSign label-ladder diagnostic metrics were extremely weak and
  prediction-concentrated, after evaluator contract repair.
- Observer 584 recommended human model strategy review before more autonomous
  training-style retries.
- M3EY ran one bounded ASL Citizen 25-label lesson-model Brev slice; metrics
  failed promotion gates and diagnostic negative false-pass rate was high.
- M3FP Fresh5/Detector TCN completion remained non-promotable.
- M3FQ/M3FR/M3FS Detector 0 strict-gate evidence is diagnostic-only; M3FS found
  no local no-training contract repair and no browser/runtime authority.
- M3FT was activated as a safety/product fallback, but the latest human
  direction is to keep investigating the dataset/training issue. This M3FU
  prompt is the separate human-approved strategy slice required by M3FT.
- Browser/model claim surfaces must remain fail-closed.

## Required Slice

Complete one local root-cause review:

1. Verify live state and run baseline no-spend checks:

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
git diff --check
```

2. Build a root-cause matrix from existing receipts, manifests, scripts, and
   docs. Cover at least these subproblems:
   - source rights/provenance and source-register readiness;
   - vocabulary overlap and label taxonomy binding;
   - signer-disjoint split support and class balance;
   - tensor/media availability and decode/input-contract status;
   - crop/region representation and Detector 0 dependency status;
   - model objective and architecture fit for the available data;
   - evaluation/calibration/hard-negative readiness;
   - compute readiness and Brev spend boundary.

3. Classify the current leading blocker. Use this taxonomy:
   - `dataset_rights_or_source_register_blocker`
   - `vocabulary_overlap_or_label_binding_blocker`
   - `split_or_class_balance_blocker`
   - `tensor_or_input_contract_blocker`
   - `crop_or_detector_dependency_blocker`
   - `model_objective_or_architecture_blocker`
   - `evaluation_or_calibration_blocker`
   - `compute_or_budget_blocker`
   - `no_single_local_repair_found`

4. Select exactly one next action. Prefer the smallest local repair if one is
   evident. Do not select Brev/training unless the receipt writes a complete
   future compute plan and marks it as requiring human approval before launch.

Allowed next actions:

- `continue_dataset_manifest_contract_repair_no_spend`
- `continue_vocabulary_overlap_label_binding_review_no_spend`
- `continue_tensor_input_contract_repair_no_spend`
- `continue_crop_representation_contract_review_no_spend`
- `prepare_bounded_training_receipt_for_human_approval`
- `stop_for_human_dataset_or_compute_strategy_review`

## Receipt

Write:

`docs/validation/return-to-form-m3fu-dataset-training-root-cause-no-spend-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run;
- read-only Brev default-off state;
- claim-surface status;
- receipts/logs/docs inspected;
- root-cause matrix with evidence and confidence for each subproblem;
- leading blocker classification;
- why the selected next action is the smallest useful next move;
- explicit statement that no training, fitting, evaluator rerun, smoke rerun,
  checkpoint creation, Brev lifecycle/exec/sync/copy/spend, source/media
  import, source/manifest/tensor/packet/vocabulary mutation, export,
  promotion, browser activation, model-card or active-vocabulary promotion,
  push, or unsupported claim occurred;
- `pretrained_components: []`;
- changed files;
- exactly one next action.

## Session Log

Write:

`docs/session-logs/599-mission-3fu-dataset-training-root-cause-no-spend.md`

The session log must record commands, evidence inspected, root-cause matrix,
leading blocker, Brev default-off status, changed files, and exactly one next
action.

## Boundaries

- Local/no-spend/no-training only.
- No Detector 0 smoke rerun, recognizer smoke, evaluator run, local or remote
  training command, fitting, backward pass, optimizer step, checkpoint creation,
  architecture search, threshold tuning for promotion, export, model-card
  promotion, active-vocabulary promotion, browser recognition activation,
  product-runtime recognition mutation, runtime Detector 0 authority,
  final-readiness claim, trainability claim, or positive ASL correctness claim.
- No Brev start/exec/sync/copy/stop, remote dry-run, remote training, package
  install, duplicate worker, or GPU/cloud spend.
- No source-register edit, source/media import, manifest/tensor/packet/
  vocabulary mutation, raw learner video/frame upload, push, amend,
  destructive reset, or no-verify commit.
- No pretrained detector, landmark model, backbone, embedding, teacher logits,
  MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP, `from_pretrained`,
  `pretrained=True`, pseudo-labels, generated labels, or machine-generated
  landmarks in the promoted lane.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3FU.
2. Required local checks pass or record exact blockers.
3. Existing receipts and scripts are used to produce a concrete root-cause
   matrix over source, labels, splits, tensors, crops, model objective,
   evaluation, and compute.
4. The receipt identifies one leading blocker or explicitly states that no
   single local repair is supported.
5. Claim surfaces remain fail-closed.
6. No forbidden ML, Brev, source, export, promotion, browser activation,
   runtime Detector 0 authority, or unsupported claim work occurred.
7. A tracked receipt and numbered session log exist and select exactly one next
   action.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-spend/no-training, produces
  a useful root-cause matrix, preserves fail-closed claims, and selects one
  allowed next action.
- NUDGE if it misses evidence for a major subproblem, leading blocker
  classification, forbidden-action proof, changed-file accounting, or exactly
  one next action.
- REDIRECT if it performs training/evaluation/Brev/export/promotion/browser
  activation/source import, weakens gates, mutates data contracts without
  authority, or expands claims.
- ESCALATE if it finds that the next training/data move is still speculative
  and no local contract repair is evident.
- STOP if the next meaningful step requires human source, compute, privacy,
  claim, or final-submission approval.
