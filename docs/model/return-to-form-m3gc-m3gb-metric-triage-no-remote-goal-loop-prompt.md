# Return-To-Form M3GC M3GB Metric Triage No Remote Goal Loop Prompt

Mission 3GC prompt for the Codex executor after M3GB completed one bounded
retained-worker Brev training/evaluation/copyback slice and selected a local
metric triage.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Create one local/no-remote/no-training M3GB metric-triage receipt that explains
what the completed M3GB run does and does not prove, why the gates failed, and
which non-remote next step is justified.

This mission is triage-only. It must not start or exec Brev, run training,
rerun evaluation, run an evaluator, inspect raw videos, generate tensors or
crops, mutate manifests/tensors/vocabulary/source approvals, create model
artifacts, change crop/input code, export, promote, activate browser
recognition, change claim surfaces, or push.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3GB evidence:
   - [`docs/validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json`](../validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json)
   - [`docs/session-logs/613-mission-3gb-human-approved-bounded-brev-composable-training.md`](../session-logs/613-mission-3gb-human-approved-bounded-brev-composable-training.md)
   - `output/m3gb-high-signal-region-grid-tcn-brev/training-provenance.json`, if present locally
   - `output/m3gb-high-signal-region-grid-tcn-brev/validation-report.json`, if present locally
   - `output/m3gb-high-signal-region-grid-tcn-brev/prediction-sidecar.json`, if present locally
5. Recent lead-in evidence:
   - [`docs/validation/return-to-form-m3fz-fixed-region-grid-error-pattern-contract-no-spend-v1.json`](../validation/return-to-form-m3fz-fixed-region-grid-error-pattern-contract-no-spend-v1.json)
   - [`docs/validation/return-to-form-m3fy-fixed-region-grid-error-analysis-no-spend-v1.json`](../validation/return-to-form-m3fy-fixed-region-grid-error-analysis-no-spend-v1.json)
   - [`docs/validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json`](../validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json)
6. Dataset/source and fail-closed claim surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Required Slice

Complete one local/no-remote/no-training triage slice:

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3fz-fixed-region-grid-error-pattern-contract-no-spend-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3fy-fixed-region-grid-error-analysis-no-spend-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
git diff --check
```

If copied-back ignored M3GB output JSON files exist locally, validate them with
`python3 -m json.tool`. Do not require those ignored files to be tracked; the
tracked receipt remains the durable accounting surface.

2. Triage the completed M3GB run from existing evidence only. Include:

   - training loss and accuracy movement from first, best-validation, and last
     epoch;
   - validation/test top-1, macro-F1, zero-recall labels, threshold metrics,
     and failed gates;
   - comparison to M3FW/M3FY fixed-grid evidence, especially the recurring
     `table` weakness;
   - whether this looks like data/source/split, input/crop/coverage,
     architecture/objective, training-budget/compute, threshold/calibration, or
     evaluation-contract trouble;
   - whether another remote run is justified now. The default answer should be
     no unless the receipt proves a precise non-compute blocker.

3. Record fail-closed claim boundaries. The M3GB checkpoint and ignored output
   files are diagnostic only and must not become model-card, browser,
   threshold-promotion, final-readiness, or ASL-correctness authority.

4. Write the tracked receipt:

`docs/validation/return-to-form-m3gc-m3gb-metric-triage-no-remote-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run;
- read-only Brev default-off state;
- M3GB receipt/session paths and summaries;
- copied-back output-file presence and hashes if available;
- metric triage table;
- failure classification;
- rejected actions and why;
- approval/escalation gates;
- claim-surface status;
- explicit forbidden-action proof;
- `pretrained_components: []`;
- changed files;
- exactly one next action.

5. Select exactly one next action:

- `continue_m3gb_error_pattern_analysis_no_remote`
- `continue_m3gb_local_contract_repair_no_remote`
- `continue_detector0_or_crop_proxy_contract_after_m3gb`
- `continue_fail_closed_interactive_product_hardening`
- `continue_openai_or_gpt_pro_research_with_m3gb_evidence`
- `prepare_followup_compute_receipt_for_human_approval`
- `stop_for_human_ml_strategy_choice`

Do not select another Brev lifecycle/training/evaluation action directly. A
future compute step must be only a receipt proposal requiring fresh human
approval before any lifecycle, remote, training, copy, export, or activation
command.

## Session Log

Write:

`docs/session-logs/615-mission-3gc-m3gb-metric-triage-no-remote.md`

The session log must record commands, evidence inspected, metric-triage
summary, Brev default-off status, claim surfaces, changed files, and exactly
one next action.

## Boundaries

- Local/no-remote/no-training metric triage only.
- No Brev start/exec/sync/copy/stop, remote dry-run, remote training, remote
  evaluation, package install, duplicate worker, or GPU/cloud spend.
- No second M3GB training attempt, evaluator rerun, broad 75/80/95-label run,
  label expansion, architecture search, hyperparameter sweep, Detector 0
  training, source/media import, source-register mutation, manifest/tensor/
  vocabulary/packet mutation, raw learner video upload, dependency-file
  mutation, generated labels, pseudo-labels, or crop/input implementation
  change.
- No pretrained detector, landmark model, backbone, embedding, feature
  extractor, teacher logits, MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP,
  `from_pretrained`, `pretrained=True`, or model-weight shortcut in the
  promoted lane.
- No model-card promotion, ONNX export, browser recognition activation,
  threshold promotion, final-readiness claim, positive ASL-correctness claim,
  product-runtime mutation, push, amend, or `--no-verify`.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3GC.
2. Required local checks pass or record exact blockers.
3. The M3GB receipt/session log and available copied-back output JSON files are
   inspected.
4. A tracked M3GC receipt exists or the exact blocker preventing it is
   recorded.
5. The receipt includes metric triage, failure classification, rejected
   actions, approval/escalation gates, claim-surface status, and forbidden
   action proof.
6. Brev remains stopped/default-off and no remote command occurs.
7. Claim surfaces remain fail-closed.
8. A numbered session log exists and selects exactly one next action.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-remote/no-training,
  preserves fail-closed claims, produces the scoped triage receipt/log or
  records an exact blocker, and selects one allowed next action.
- NUDGE if it misses M3GB accounting, output-file hash accounting, failure
  classification, rejected actions, approval/escalation gates, forbidden-action
  proof, changed-file accounting, or exactly one next action.
- REDIRECT if it drifts into Brev lifecycle, remote work, training/evaluation
  reruns, source/data/crop/input mutation, export, promotion, browser
  activation, or claim expansion.
- ESCALATE if the selected next action changes architecture, input
  representation, target schema, training budget, or compute and no current
  strategy memo covers the exact M3GB evidence.
- STOP if the selected next action requires human source, compute, privacy,
  claim, strategy, or final-submission approval.
