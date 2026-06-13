# Return-To-Form M3GD M3GB Error Pattern Analysis No Remote Goal Loop Prompt

Mission 3GD prompt for the Codex executor after M3GC completed local M3GB
metric triage and selected a local error-pattern analysis.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Create one local/no-remote/no-training M3GB error-pattern analysis receipt from
existing M3GB prediction and report evidence. The receipt should explain which
labels, signers, sources, splits, confidence bands, threshold outcomes, and
confusion patterns are visible from the copied-back M3GB JSON files, and which
smallest non-remote next action is justified.

This mission is analysis-only. It must not start or exec Brev, run training,
rerun evaluation, run an evaluator, inspect raw videos, generate tensors or
crops, mutate manifests/tensors/vocabulary/source approvals, create model
artifacts, change crop/input code, export, promote, activate browser
recognition, change claim surfaces, or push.

If the analysis concludes that the next useful move would change architecture,
input representation, target schema, source scope, training budget, compute,
runtime behavior, privacy posture, or claim surfaces, record the required
approval/escalation as the next action instead of performing the change.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3GC metric triage:
   - [`docs/validation/return-to-form-m3gc-m3gb-metric-triage-no-remote-v1.json`](../validation/return-to-form-m3gc-m3gb-metric-triage-no-remote-v1.json)
   - [`docs/session-logs/615-mission-3gc-m3gb-metric-triage-no-remote.md`](../session-logs/615-mission-3gc-m3gb-metric-triage-no-remote.md)
5. M3GB evidence:
   - [`docs/validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json`](../validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json)
   - [`docs/session-logs/613-mission-3gb-human-approved-bounded-brev-composable-training.md`](../session-logs/613-mission-3gb-human-approved-bounded-brev-composable-training.md)
   - `output/m3gb-high-signal-region-grid-tcn-brev/training-provenance.json`, if present locally
   - `output/m3gb-high-signal-region-grid-tcn-brev/validation-report.json`, if present locally
   - `output/m3gb-high-signal-region-grid-tcn-brev/prediction-sidecar.json`, if present locally
6. Recent fixed region-grid evidence:
   - [`docs/validation/return-to-form-m3fz-fixed-region-grid-error-pattern-contract-no-spend-v1.json`](../validation/return-to-form-m3fz-fixed-region-grid-error-pattern-contract-no-spend-v1.json)
   - [`docs/validation/return-to-form-m3fy-fixed-region-grid-error-analysis-no-spend-v1.json`](../validation/return-to-form-m3fy-fixed-region-grid-error-analysis-no-spend-v1.json)
   - [`docs/validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json`](../validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json)
7. Dataset/source and fail-closed claim surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)
8. Existing high-signal region-grid manifests, read-only:
   - `data/manifests/lesson/high-signal-region-grid/train.json`
   - `data/manifests/lesson/high-signal-region-grid/validation.json`
   - `data/manifests/lesson/high-signal-region-grid/test.json`

## Required Slice

Complete one local/no-remote/no-training analysis slice:

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3gc-m3gb-metric-triage-no-remote-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3fz-fixed-region-grid-error-pattern-contract-no-spend-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3fy-fixed-region-grid-error-analysis-no-spend-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
git diff --check
```

If copied-back ignored M3GB output JSON files exist locally, validate them with
`python3 -m json.tool` and record their hashes. Do not require ignored output
files to be tracked.

2. Analyze existing M3GB validation/test prediction evidence only. Record:

   - prediction-sidecar and validation-report shape;
   - per-label confusion, recall, precision/F1 where available, and zero-recall
     labels;
   - all incorrect `table`, `black`, `please`, and `white` rows visible in the
     M3GB sidecar/report, plus correct examples for contrast;
   - signer, source, split, tensor-path, confidence, true-label confidence,
     predicted-label confidence, and threshold-pass patterns where those fields
     already exist;
   - whether errors cluster by signer, source record, tensor path, label pair,
     confidence band, split, threshold outcome, or another existing metadata
     field;
   - comparison to M3FY's earlier `table` weakness and M3GC's metric triage;
   - whether the evidence ranks data/source/split, input/crop/coverage,
     temporal/motion, architecture/objective, threshold/calibration,
     evaluation-contract, or training-budget explanations.

3. Do not open raw videos, upload learner media, generate crops, write derived
   tensors, or run model/evaluator/smoke commands. If a useful metadata field
   is absent from existing receipts, reports, sidecars, or manifests, record
   that absence as a blocker or uncertainty instead of creating a new data
   product.

4. Write the tracked receipt:

`docs/validation/return-to-form-m3gd-m3gb-error-pattern-analysis-no-remote-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run;
- read-only Brev default-off state;
- M3GC and M3GB receipt/session paths and summaries;
- copied-back output-file presence and hashes if available;
- prediction-sidecar/report shape;
- per-label and per-example error-pattern summaries;
- signer/source/split/tensor-path/confidence/threshold pattern findings or
  uncertainties;
- ranked failure explanations and what remains unproven;
- rejected actions and why;
- approval/escalation gates;
- claim-surface status;
- explicit forbidden-action proof;
- `pretrained_components: []`;
- changed files;
- exactly one next action.

5. Select exactly one next action:

- `continue_m3gb_local_contract_repair_no_remote`
- `continue_m3gb_source_split_or_metadata_contract_no_remote`
- `continue_detector0_or_crop_proxy_contract_after_m3gb`
- `continue_openai_or_gpt_pro_research_with_m3gb_evidence`
- `prepare_followup_compute_receipt_for_human_approval`
- `continue_fail_closed_interactive_product_hardening`
- `stop_for_human_ml_strategy_choice`

Do not select another Brev lifecycle/training/evaluation action directly. A
future compute step must be only a receipt proposal requiring fresh human
approval before any lifecycle, remote, training, copy, export, or activation
command.

## Session Log

Write:

`docs/session-logs/618-mission-3gd-m3gb-error-pattern-analysis-no-remote.md`

The session log must record commands, evidence inspected, error-pattern
summary, Brev default-off status, claim surfaces, changed files, and exactly
one next action.

## Boundaries

- Local/no-remote/no-training error-pattern analysis only.
- No Brev start/exec/sync/copy/stop, remote dry-run, remote training, remote
  evaluation, package install, duplicate worker, or GPU/cloud spend.
- No second M3GB training attempt, evaluator rerun, broad 75/80/95-label run,
  label expansion, architecture search, hyperparameter sweep, Detector 0
  training, source/media import, source-register mutation, manifest/tensor/
  vocabulary/packet mutation, raw learner video upload, dependency-file
  mutation, generated labels, pseudo-labels, or crop/input implementation
  change.
- No raw-video inspection, crop thumbnail generation, manual relabeling, or
  source approval shortcut.
- No pretrained detector, landmark model, backbone, embedding, feature
  extractor, teacher logits, MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP,
  `from_pretrained`, `pretrained=True`, or model-weight shortcut in the
  promoted lane.
- No model-card promotion, ONNX export, browser recognition activation,
  threshold promotion, final-readiness claim, positive ASL-correctness claim,
  product-runtime mutation, push, amend, or `--no-verify`.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3GD.
2. Required local checks pass or record exact blockers.
3. The M3GC receipt/session log, M3GB receipt/session log, and available
   copied-back output JSON files are inspected.
4. A tracked M3GD receipt exists or the exact blocker preventing it is
   recorded.
5. The receipt includes per-label/per-example error-pattern summaries from
   existing evidence only and records signer/source/split/tensor-path/
   confidence/threshold pattern findings or uncertainties.
6. Brev remains stopped/default-off and no remote command occurs.
7. Claim surfaces remain fail-closed.
8. No forbidden training, rerun, Brev, source, data, crop/input
   implementation, export, promotion, browser activation, or unsupported claim
   work occurs.
9. A numbered session log exists and selects exactly one next action.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-remote/no-training,
  preserves fail-closed claims, produces the scoped analysis receipt/log or
  records an exact blocker, and selects one allowed next action.
- NUDGE if it misses M3GC/M3GB accounting, copied-output hash accounting,
  per-label/per-example error accounting, metadata-pattern findings,
  approval/escalation gates, forbidden-action proof, changed-file accounting,
  or exactly one next action.
- REDIRECT if it drifts into Brev lifecycle, remote work, training/evaluation
  reruns, raw-video inspection, source/data/crop/input mutation, export,
  promotion, browser activation, or claim expansion.
- ESCALATE if the selected next action changes architecture, input
  representation, target schema, training budget, or compute and no current
  strategy memo covers the exact M3GB evidence.
- STOP if the selected next action requires human source, compute, privacy,
  claim, strategy, or final-submission approval.
