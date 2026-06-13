# Return-To-Form M3FY Fixed Region-Grid Error Analysis No Spend Goal Loop Prompt

Mission 3FY prompt for the Codex executor after M3FX selected a no-training
fixed `rgb_regions_grid_v1` error-analysis continuation from existing M3FW
evidence.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Create one local/no-spend/no-training fixed region-grid error-analysis packet
from existing M3FW Tiny2 prediction evidence and metadata. The packet should
explain what the `table` false negatives and `hello` prediction concentration
show, whether any signer/source/tensor-path metadata pattern is visible, and
what the smallest safe next action is before any schema, source, architecture,
training-budget, compute, runtime, or claim-surface decision.

This mission is analysis-only. It must not train, fit, rerun M3FW, rerun
Detector 0 smoke/evaluation, run an evaluator, generate tensors, mutate
manifests/tensors/vocabulary/source approvals, create model artifacts, change
crop/input code, export, promote, activate browser recognition, change claim
surfaces, run Brev, or push.

If the analysis concludes that the next useful move would actually change
architecture, input representation, target schema, source scope, training
budget, compute, runtime behavior, or claim surfaces, record the needed
approval/escalation as the next action instead of performing the change.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   the mutable tactical overlay and M3FW/M3FX results.
4. M3FX review evidence:
   - [`docs/validation/return-to-form-m3fx-crop-input-schema-review-no-spend-v1.json`](../validation/return-to-form-m3fx-crop-input-schema-review-no-spend-v1.json)
   - [`docs/session-logs/606-mission-3fx-crop-input-schema-review-no-spend.md`](../session-logs/606-mission-3fx-crop-input-schema-review-no-spend.md)
5. M3FW proof evidence:
   - [`docs/validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json`](../validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json)
   - [`docs/session-logs/604-mission-3fw-tiny2-tiny3-architecture-objective-sanity.md`](../session-logs/604-mission-3fw-tiny2-tiny3-architecture-objective-sanity.md)
   - [`scripts/run_m3fw_tiny2_tiny3_architecture_objective_sanity.py`](../../scripts/run_m3fw_tiny2_tiny3_architecture_objective_sanity.py)
6. M3FV contract and prior Tiny2 comparison:
   - [`docs/model/return-to-form-m3fv-tiny2-tiny3-architecture-objective-sanity-contract-v1.json`](return-to-form-m3fv-tiny2-tiny3-architecture-objective-sanity-contract-v1.json)
   - [`docs/validation/return-to-form-m3em-tiny2-heldout-noncollapse-probe-v1.json`](../validation/return-to-form-m3em-tiny2-heldout-noncollapse-probe-v1.json)
7. Dataset/source and fail-closed claim surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)
8. Existing fixed region-grid manifests, read-only:
   - `data/manifests/lesson/high-signal-region-grid/train.json`
   - `data/manifests/lesson/high-signal-region-grid/validation.json`
   - `data/manifests/lesson/high-signal-region-grid/test.json`

## Required Slice

Complete one local/no-spend/no-training analysis slice:

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3fx-crop-input-schema-review-no-spend-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-m3fv-tiny2-tiny3-architecture-objective-sanity-contract-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
git diff --check
```

2. Analyze existing M3FW Tiny2 validation predictions only. Record:

   - per-label confusion and recall summary;
   - all held-out `table` false negatives and correct `table` examples;
   - `hello` examples and whether confidence/prediction concentration differs
     from the misclassified `table` rows;
   - available signer/source/video/tensor-path metadata for each held-out row;
   - whether errors cluster by signer, source record, tensor path, confidence,
     label, or another existing metadata field;
   - comparison to M3EM's all-`hello` collapse, without claiming model
     readiness.

3. Do not open raw videos, upload learner media, generate crops, write derived
   tensors, or run model/evaluator/smoke commands. If a useful metadata field
   is absent from the existing receipts/manifests, record that absence as a
   blocker or uncertainty rather than creating a new data product.

4. Write the tracked receipt:

`docs/validation/return-to-form-m3fy-fixed-region-grid-error-analysis-no-spend-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run;
- read-only Brev default-off state;
- M3FW and M3FX receipt paths and summaries;
- evidence inspected;
- fixed region-grid error-analysis tables or summaries;
- metadata-pattern findings and uncertainties;
- rejected actions and why;
- claim-surface status;
- explicit forbidden-action proof;
- `pretrained_components: []`;
- changed files;
- exactly one next action.

5. Select exactly one next action:

- `continue_fixed_region_grid_error_pattern_contract_no_spend`
- `continue_union_contact_region_schema_contract_no_spend`
- `continue_full_frame_or_motion_context_contract_no_spend`
- `continue_first_party_or_human_label_protocol_no_spend`
- `prepare_bounded_composable_brev_microexperiment_receipt_for_human_approval`
- `escalate_crop_input_strategy_research_with_local_evidence`
- `stop_for_human_ml_strategy_choice`

Do not select a training-style, Brev, source-mutation, input-implementation, or
promotion action unless the selected action is only a future proposal or
escalation and explicitly requires human approval before any lifecycle,
training, mutation, export, or activation command.

## Session Log

Write:

`docs/session-logs/608-mission-3fy-fixed-region-grid-error-analysis-no-spend.md`

The session log must record commands, evidence inspected, error-analysis
summary, metadata-pattern findings, Brev default-off status, claim surfaces,
changed files, and exactly one next action.

## Boundaries

- Local/no-spend/no-training only.
- No M3FW proof rerun, Tiny3 run, Fresh5/25/75/95-label run, broad recognizer
  training/evaluation, architecture sweep, objective sweep, Detector 0 smoke
  rerun, evaluator rerun, threshold tuning, export, model-card promotion,
  active-vocabulary promotion, browser recognition activation, product-runtime
  recognition mutation, runtime Detector 0 authority, final-readiness claim,
  trainability claim, or positive ASL correctness claim.
- No raw-video inspection or upload, crop/input implementation change,
  source-register edit, source/media import, manifest/tensor/packet/vocabulary
  mutation, push, amend, destructive reset, or no-verify commit.
- No Brev start/exec/sync/copy/stop, remote dry-run, remote training, package
  install, duplicate worker, or GPU/cloud spend.
- No pretrained detector, landmark model, backbone, embedding, teacher logits,
  MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP, `from_pretrained`,
  `pretrained=True`, pseudo-labels, generated labels, or machine-generated
  landmarks in the promoted lane.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3FY.
2. Required local checks pass or record exact blockers.
3. The M3FW and M3FX receipts/logs are inspected.
4. A tracked M3FY receipt exists or the exact blocker preventing it is
   recorded.
5. The receipt includes fixed region-grid Tiny2 error-analysis summaries from
   existing evidence only and records metadata-pattern findings or uncertainties.
6. Claim surfaces remain fail-closed.
7. No forbidden training, rerun, Brev, source, data, crop/input
   implementation, export, promotion, browser activation, runtime Detector 0
   authority, or unsupported claim work occurs.
8. A numbered session log exists and selects exactly one next action.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-spend/no-training, preserves
  fail-closed claims, produces the scoped analysis receipt/log or records an
  exact blocker, and selects one allowed next action.
- NUDGE if it misses M3FW/M3FX accounting, per-example/per-label error
  accounting, metadata-pattern findings, forbidden-action proof, changed-file
  accounting, or exactly one next action.
- REDIRECT if it drifts into training, proof reruns, Brev lifecycle/spend,
  raw-video inspection/upload, source/data/crop/input mutation, export,
  promotion, browser activation, or claim expansion.
- ESCALATE if the selected next action would actually change architecture,
  input representation, target schema, training budget, or compute and no
  current strategy memo covers the exact decision.
- STOP if the selected next action requires human source, compute, privacy,
  claim, strategy, or final-submission approval.
