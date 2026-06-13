# Return-To-Form M3GF M3GB Source Split Manifest Accounting Repair No Remote Goal Loop Prompt

Mission 3GF prompt for the Codex executor after M3GE completed the local M3GB
source/split/metadata contract and selected a manifest-accounting repair.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Create one local/no-remote/no-training source/split/manifest accounting repair
receipt from existing M3GE/M3GD/M3GC/M3GB evidence. The repair should make the
validation/test M3GB prediction sidecar review self-contained enough for future
local analysis by joining existing sidecar rows to existing manifests by
`clip_id` and recording the source/split/signer/tensor-path/hash fields that
are already available.

This mission is accounting-only. It may write a tracked receipt and a numbered
session log, but it must not rewrite copied-back M3GB outputs, source
registers, manifests, tensors, vocabulary, crop artifacts, model artifacts,
runtime code, claim surfaces, or product UI.

It must not start or exec Brev, run training, rerun evaluation, run an
evaluator, inspect raw videos, generate tensors or crops, import sources,
export, promote, activate browser recognition, change claim surfaces, or push.

If the repair concludes that the next useful move requires an evaluator
contract change, output regeneration, crop/input work, source/privacy review,
human label review, compute, architecture/input-budget pivot, runtime behavior
change, or claim-surface change, record the required approval/escalation as the
next action instead of performing the change.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3GE metadata contract:
   - [`docs/validation/return-to-form-m3ge-m3gb-source-split-metadata-contract-no-remote-v1.json`](../validation/return-to-form-m3ge-m3gb-source-split-metadata-contract-no-remote-v1.json)
   - [`docs/session-logs/620-mission-3ge-m3gb-source-split-metadata-contract-no-remote.md`](../session-logs/620-mission-3ge-m3gb-source-split-metadata-contract-no-remote.md)
5. M3GD/M3GC/M3GB evidence:
   - [`docs/validation/return-to-form-m3gd-m3gb-error-pattern-analysis-no-remote-v1.json`](../validation/return-to-form-m3gd-m3gb-error-pattern-analysis-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3gc-m3gb-metric-triage-no-remote-v1.json`](../validation/return-to-form-m3gc-m3gb-metric-triage-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json`](../validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json)
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

Complete one local/no-remote/no-training accounting repair slice:

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
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

2. Build a read-only accounting repair from existing JSON only:

   - join validation/test `prediction-sidecar.json` rows to the matching
     validation/test manifest rows by `clip_id`;
   - record join totals, missing joins, duplicate `clip_id` or source-record
     keys, and split mismatches;
   - carry through existing manifest fields needed for review:
     `signer_id`, `signer_identity_hash`, `source_id`, `source_category`,
     `source_record_id`, `source_video_path`, `source_split`, source license
     status/decision/evidence fields, `relative_frame_tensor_path`,
     `frame_tensor_sha256`, `frame_tensor_provenance`, `crop_config`, and
     `crop_regions`;
   - record sidecar fields already present for each row: true/predicted label,
     confidence, top-2 label/confidence, margin, entropy, and correctness;
   - summarize per-split and per-label accounting coverage without rerunning
     an evaluator or recalculating model outputs;
   - explicitly keep any full probability vectors, logits, crop quality,
     motion descriptors, source capture conditions, and human label-quality
     fields classified as missing or approval-gated unless they already exist
     in tracked/copied JSON.

3. Do not open raw videos, upload learner media, generate crops, write derived
   tensors, relabel data, edit source approvals, mutate manifests, or run
   model/evaluator/smoke commands. Missing fields should be recorded as
   limitations or future approval-gated checks, not created in this mission.

4. Write the tracked accounting repair receipt:

`docs/validation/return-to-form-m3gf-m3gb-source-split-manifest-accounting-repair-no-remote-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run;
- read-only Brev default-off state;
- M3GE/M3GD/M3GC/M3GB receipt and session paths;
- copied-back output-file presence and hashes if available;
- manifest hashes and validation/test row counts;
- sidecar-to-manifest join summary by split;
- missing join, duplicate key, split mismatch, and source-record accounting;
- joined field coverage for signer/source/split/label/tensor/sidecar fields;
- per-label and per-split accounting summary;
- limitations that remain missing or approval-gated;
- autonomous-safe future checks;
- approval-gated future checks;
- rejected actions and why;
- approval/escalation gates;
- claim-surface status;
- explicit forbidden-action proof;
- `pretrained_components: []`;
- changed files;
- exactly one next action.

5. Select exactly one next action:

- `continue_m3gb_report_sidecar_contract_gap_patch_plan_no_remote`
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

`docs/session-logs/622-mission-3gf-m3gb-source-split-manifest-accounting-repair-no-remote.md`

The session log must record commands, evidence inspected, accounting repair
summary, Brev default-off status, claim surfaces, changed files, and exactly
one next action.

## Boundaries

- Local/no-remote/no-training source/split/manifest accounting repair only.
- No Brev start/exec/sync/copy/stop, remote dry-run, remote training, remote
  evaluation, package install, duplicate worker, or GPU/cloud spend.
- No second M3GB training attempt, evaluator rerun, broad 75/80/95-label run,
  label expansion, architecture search, hyperparameter sweep, Detector 0
  training, source/media import, source-register mutation, manifest/tensor/
  vocabulary/packet mutation, raw learner video upload, dependency-file
  mutation, generated labels, pseudo-labels, output sidecar/report rewrite, or
  crop/input implementation change.
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

1. `GOAL.md` points at this prompt and names Mission 3GF.
2. Required local checks pass or record exact blockers.
3. The M3GE, M3GD, M3GC, and M3GB receipts/session logs and available
   copied-back output JSON files are inspected.
4. A tracked M3GF receipt exists or the exact blocker preventing it is
   recorded.
5. The receipt records validation/test sidecar-to-manifest join accounting by
   `clip_id`, including missing joins, duplicate keys, split mismatches, and
   source-record/tensor-path/hash coverage.
6. The receipt separates existing fields from missing or approval-gated fields
   and selects exactly one allowed next action.
7. Brev remains stopped/default-off and no remote command occurs.
8. Claim surfaces remain fail-closed.
9. No forbidden training, rerun, Brev, source, data, crop/input
   implementation, output-artifact rewrite, export, promotion, browser
   activation, or unsupported claim work occurs.
10. A numbered session log exists and selects exactly one next action.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-remote/no-training,
  preserves fail-closed claims, produces the scoped accounting repair receipt/
  log or records an exact blocker, and selects one allowed next action.
- NUDGE if it misses copied-output hash accounting, manifest hash accounting,
  sidecar-to-manifest join totals, missing/duplicate/split mismatch accounting,
  signer/source/split/tensor field coverage, approval/escalation gates,
  forbidden-action proof, changed-file accounting, or exactly one next action.
- REDIRECT if it drifts into Brev lifecycle, remote work, training/evaluation
  reruns, raw-video inspection, source/data/crop/input mutation, copied-output
  rewrite, export, promotion, browser activation, or claim expansion.
- ESCALATE if the selected next action changes architecture, input
  representation, target schema, training budget, or compute and no current
  strategy memo covers the exact M3GB evidence.
- STOP if the selected next action requires human source, compute, privacy,
  claim, strategy, or final-submission approval.
