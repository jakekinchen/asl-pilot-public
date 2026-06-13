# Return-To-Form M3GI M3GB Evaluator Output Regeneration Receipt For Human Approval Goal Loop Prompt

Mission 3GI prompt for the Codex executor after M3GH completed the local
evaluator sidecar contract repair and selected an output-regeneration approval
receipt as the next action.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Create a local/no-remote/no-training approval receipt for a future M3GB
evaluator output regeneration/rerun. This mission is paperwork and evidence
accounting only. It must define exactly what a future human-approved evaluator
rerun would do, what files it would read and write, how it would be verified,
and what remains forbidden until the human approves.

This mission must not execute the future rerun. Do not run
`scripts/evaluate_rawframe_model.py`, load a checkpoint to produce outputs,
rewrite or regenerate copied-back M3GB output JSON, copy back artifacts, start
or exec Brev, run training, run browser/product smoke, export, promote,
activate browser recognition, change claim surfaces, or push.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3GH repair evidence:
   - [`docs/validation/return-to-form-m3gh-m3gb-evaluator-sidecar-contract-repair-no-remote-v1.json`](../validation/return-to-form-m3gh-m3gb-evaluator-sidecar-contract-repair-no-remote-v1.json)
   - [`docs/session-logs/626-mission-3gh-m3gb-evaluator-sidecar-contract-repair-no-remote.md`](../session-logs/626-mission-3gh-m3gb-evaluator-sidecar-contract-repair-no-remote.md)
   - [`docs/session-logs/628-mission-3gh-negative-challenge-tensor-path-repair.md`](../session-logs/628-mission-3gh-negative-challenge-tensor-path-repair.md)
5. M3GG/M3GF/M3GE/M3GD/M3GC/M3GB evidence:
   - [`docs/validation/return-to-form-m3gg-m3gb-report-sidecar-contract-gap-patch-plan-no-remote-v1.json`](../validation/return-to-form-m3gg-m3gb-report-sidecar-contract-gap-patch-plan-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3gf-m3gb-source-split-manifest-accounting-repair-no-remote-v1.json`](../validation/return-to-form-m3gf-m3gb-source-split-manifest-accounting-repair-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3ge-m3gb-source-split-metadata-contract-no-remote-v1.json`](../validation/return-to-form-m3ge-m3gb-source-split-metadata-contract-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3gd-m3gb-error-pattern-analysis-no-remote-v1.json`](../validation/return-to-form-m3gd-m3gb-error-pattern-analysis-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3gc-m3gb-metric-triage-no-remote-v1.json`](../validation/return-to-form-m3gc-m3gb-metric-triage-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json`](../validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json)
   - [`docs/session-logs/624-mission-3gg-m3gb-report-sidecar-contract-gap-patch-plan-no-remote.md`](../session-logs/624-mission-3gg-m3gb-report-sidecar-contract-gap-patch-plan-no-remote.md)
   - [`docs/session-logs/622-mission-3gf-m3gb-source-split-manifest-accounting-repair-no-remote.md`](../session-logs/622-mission-3gf-m3gb-source-split-manifest-accounting-repair-no-remote.md)
   - [`docs/session-logs/620-mission-3ge-m3gb-source-split-metadata-contract-no-remote.md`](../session-logs/620-mission-3ge-m3gb-source-split-metadata-contract-no-remote.md)
   - [`docs/session-logs/618-mission-3gd-m3gb-error-pattern-analysis-no-remote.md`](../session-logs/618-mission-3gd-m3gb-error-pattern-analysis-no-remote.md)
   - [`docs/session-logs/615-mission-3gc-m3gb-metric-triage-no-remote.md`](../session-logs/615-mission-3gc-m3gb-metric-triage-no-remote.md)
   - [`docs/session-logs/613-mission-3gb-human-approved-bounded-brev-composable-training.md`](../session-logs/613-mission-3gb-human-approved-bounded-brev-composable-training.md)
6. Copied-back M3GB output JSON, if present locally:
   - `output/m3gb-high-signal-region-grid-tcn-brev/training-provenance.json`
   - `output/m3gb-high-signal-region-grid-tcn-brev/validation-report.json`
   - `output/m3gb-high-signal-region-grid-tcn-brev/prediction-sidecar.json`
7. Existing high-signal region-grid manifests, read-only:
   - `data/manifests/lesson/high-signal-region-grid/train.json`
   - `data/manifests/lesson/high-signal-region-grid/validation.json`
   - `data/manifests/lesson/high-signal-region-grid/test.json`
8. Dataset/source and fail-closed claim surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Required Slice

Complete one local/no-remote/no-training approval-receipt slice:

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3gh-m3gb-evaluator-sidecar-contract-repair-no-remote-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gg-m3gb-report-sidecar-contract-gap-patch-plan-no-remote-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gf-m3gb-source-split-manifest-accounting-repair-no-remote-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ge-m3gb-source-split-metadata-contract-no-remote-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gd-m3gb-error-pattern-analysis-no-remote-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gc-m3gb-metric-triage-no-remote-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
git diff --check
```

If copied-back ignored M3GB output JSON files exist locally, validate them with
`python3 -m json.tool` and record their hashes. Do not require ignored output
files to be tracked.

2. Inspect only existing evidence and local command surfaces needed to write a
   future approval plan. The receipt may quote exact future commands, expected
   output paths, inputs, hashes, and verification steps, but it must label them
   `not_executed`.

   Include a static downstream-consumer compatibility check for the future
   `prediction-sidecar` v2 contract before proposing regenerated outputs as
   usable evidence. At minimum, inspect local consumers that parse raw-frame
   prediction sidecars, including
   `scripts/analyze_rawframe_lesson_open_set.mjs` and
   `scripts/analyze_controlled_pilot_thresholds.mjs`, and record whether each
   currently accepts v2, must be updated in a later local compatibility slice,
   or should remain limited to v1 diagnostics. Do not edit those consumers in
   M3GI unless the active prompt is explicitly redirected; this mission is only
   the approval receipt.

3. Write the tracked approval receipt:

`docs/validation/return-to-form-m3gi-m3gb-evaluator-output-regeneration-receipt-for-human-approval-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run in this receipt-only mission;
- read-only Brev default-off state;
- M3GH/M3GG/M3GF/M3GE/M3GD/M3GC/M3GB receipt and session paths;
- copied-back M3GB output-file presence, tracked/ignored status, and hashes if available;
- current evaluator/checkpoint/input/output evidence paths inspected;
- exact future evaluator command or commands proposed but not run;
- exact future output paths that would be created or overwritten;
- downstream `prediction-sidecar` v2 consumer compatibility status, including
  whether generated v2 sidecars can be consumed by local analysis scripts now
  or require a separate compatibility patch before use;
- copyback, rollback, and hash-recording boundaries;
- preflight requirements before approval can be used;
- max local/remote scope and explicit cost/spend state;
- what the human approval would authorize;
- what remains forbidden even after this receipt is written;
- expected verification after approval, including receipt/log updates;
- claim-surface status and fail-closed proof;
- explicit forbidden-action proof for this mission;
- `pretrained_components: []`;
- changed files;
- exactly one next action.

4. Select exactly one next action:

- `stop_for_human_m3gb_evaluator_output_regeneration_approval`
- `continue_m3gb_sidecar_contract_static_validation_no_remote`
- `continue_openai_or_gpt_pro_research_with_m3gb_evidence`
- `continue_detector0_or_crop_proxy_contract_after_m3gb`
- `continue_fail_closed_interactive_product_hardening`
- `stop_for_human_ml_strategy_choice`

If the approval receipt is complete, select
`stop_for_human_m3gb_evaluator_output_regeneration_approval`. Do not select an
action that directly authorizes evaluator execution, output regeneration,
copyback, Brev lifecycle, training, export, promotion, browser activation, or
claim expansion.

## Session Log

Write:

`docs/session-logs/630-mission-3gi-m3gb-evaluator-output-regeneration-receipt-for-human-approval.md`

The session log must record commands, evidence inspected, copied-back output
hashes if present, the future command plan marked not executed, Brev
default-off status, claim surfaces, changed files, forbidden-action proof, and
exactly one next action.

## Boundaries

- Local/no-remote/no-training approval receipt only.
- No evaluator rerun, checkpoint load for generated outputs, output
  regeneration, copied-output rewrite, copyback, training/fitting,
  browser/product smoke, Brev start/exec/sync/copy/stop, remote dry-run,
  package install, duplicate worker, remote training, remote evaluation, or GPU
  spend.
- No broad 75/80/95-label run, second M3GB training attempt, architecture
  search, hyperparameter sweep, label expansion, Detector 0 training,
  source/media import, source-register mutation, manifest/tensor/vocabulary/
  packet mutation, raw-video inspection/upload, crop thumbnail generation,
  generated labels, pseudo-labels, or crop/input implementation change.
- No pretrained detector, landmark model, backbone, embedding, feature
  extractor, teacher logits, MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP,
  `from_pretrained`, `pretrained=True`, or model-weight shortcut in the
  promoted lane.
- No model-card promotion, ONNX export, browser recognition activation,
  threshold promotion, final-readiness claim, positive ASL-correctness claim,
  product-runtime mutation, push, amend, or `--no-verify`.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3GI.
2. Required local checks pass or record exact blockers.
3. The M3GH, M3GG, M3GF, M3GE, M3GD, M3GC, and M3GB receipts/session logs and
   available copied-back output JSON files are inspected.
4. A tracked M3GI approval receipt exists or the exact blocker preventing it
   is recorded.
5. The receipt records the future evaluator/output-regeneration command plan
   as not executed, exact input/output paths, downstream sidecar v2 consumer
   compatibility status, rollback/copyback boundaries, approval scope,
   forbidden-action proof, changed files, and exactly one next action.
6. The retained worker remains stopped/default-off and no remote command
   occurs.
7. Claim surfaces remain fail-closed.
8. No forbidden evaluator rerun, output rewrite/regeneration, checkpoint load
   for generated outputs, training, browser smoke, Brev, source/data/crop/input
   mutation, export, promotion, browser activation, or unsupported claim work
   occurs.
9. A numbered session log exists and selects exactly one next action.

## Observer Guidance

- CONTINUE if the executor writes the approval receipt only, keeps all future
  evaluator/output-regeneration commands marked not executed, validates
  locally, preserves fail-closed claims, records forbidden-action proof, and
  selects exactly one allowed next action.
- NUDGE if it misses copied-output hashes, exact future command/path details,
  downstream `prediction-sidecar` v2 consumer compatibility status,
  rollback/copyback boundaries, approval scope, claim-surface proof,
  forbidden-action proof, changed-file accounting, or exactly one next action.
- REDIRECT if it drifts into evaluator execution, checkpoint loading for
  generated outputs, output rewrite/regeneration, copyback, Brev lifecycle,
  training/evaluation, browser/product smoke, raw-video inspection, source/
  data/crop/input mutation, export, promotion, browser activation, or claim
  expansion.
- ESCALATE if the proposed approval changes architecture, input
  representation, target schema, training budget, compute strategy, source
  policy, privacy posture, or claim policy and no current strategy memo covers
  the exact M3GB evidence.
- STOP if the receipt is complete and the selected next action is human
  approval, or if the next action cannot proceed without human compute,
  privacy, claim, strategy, output-regeneration, evaluator-rerun, or
  final-submission approval.
