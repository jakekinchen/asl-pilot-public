# Return-To-Form M3GE M3GB Source Split Metadata Contract No Remote Goal Loop Prompt

Mission 3GE prompt for the Codex executor after M3GD completed local M3GB
error-pattern analysis and selected a source/split/metadata contract.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Create one local/no-remote/no-training source/split/metadata contract from
existing M3GD/M3GC/M3GB evidence. The contract should inventory what signer,
source-record, split, label, tensor-path, sidecar, and report fields already
exist, classify missing fields that block root-cause attribution, and define
which future checks are autonomous-safe versus approval-gated.

This mission is contract-only. It must not start or exec Brev, run training,
rerun evaluation, run an evaluator, inspect raw videos, generate tensors or
crops, mutate source registers/manifests/tensors/vocabulary, create model
artifacts, change crop/input code, export, promote, activate browser
recognition, change claim surfaces, or push.

If the contract concludes that the next useful move would change architecture,
input representation, target schema, source scope, training budget, compute,
runtime behavior, privacy posture, or claim surfaces, record the required
approval/escalation as the next action instead of performing the change.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3GD error-pattern analysis:
   - [`docs/validation/return-to-form-m3gd-m3gb-error-pattern-analysis-no-remote-v1.json`](../validation/return-to-form-m3gd-m3gb-error-pattern-analysis-no-remote-v1.json)
   - [`docs/session-logs/618-mission-3gd-m3gb-error-pattern-analysis-no-remote.md`](../session-logs/618-mission-3gd-m3gb-error-pattern-analysis-no-remote.md)
5. M3GC metric triage:
   - [`docs/validation/return-to-form-m3gc-m3gb-metric-triage-no-remote-v1.json`](../validation/return-to-form-m3gc-m3gb-metric-triage-no-remote-v1.json)
   - [`docs/session-logs/615-mission-3gc-m3gb-metric-triage-no-remote.md`](../session-logs/615-mission-3gc-m3gb-metric-triage-no-remote.md)
6. M3GB evidence:
   - [`docs/validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json`](../validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json)
   - [`docs/session-logs/613-mission-3gb-human-approved-bounded-brev-composable-training.md`](../session-logs/613-mission-3gb-human-approved-bounded-brev-composable-training.md)
   - `output/m3gb-high-signal-region-grid-tcn-brev/training-provenance.json`, if present locally
   - `output/m3gb-high-signal-region-grid-tcn-brev/validation-report.json`, if present locally
   - `output/m3gb-high-signal-region-grid-tcn-brev/prediction-sidecar.json`, if present locally
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

Complete one local/no-remote/no-training contract slice:

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
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

2. Inventory existing metadata fields from tracked receipts, manifests, and
   copied-back JSON only. Record:

   - signer fields, signer counts, and signer/label coverage by split;
   - source record fields, source family, source-record uniqueness, and any
     current source-register evidence;
   - split construction fields, label distribution, tensor-path fields, and
     whether rows can be joined across report/sidecar/manifest files;
   - sidecar/report fields that support confidence, top-2, threshold, entropy,
     per-class, confusion, and signer metrics;
   - missing fields that block discriminating signer/source/split/crop/
     temporal/model explanations, such as full probability vectors, crop
     quality, region coverage, motion descriptors, frame-level visual quality,
     source capture condition, or reviewed human label quality;
   - which checks are autonomous-safe read-only accounting versus which require
     human approval, source/privacy review, artifact mutation, compute, or
     research escalation.

3. Do not open raw videos, upload learner media, generate crops, write derived
   tensors, relabel data, edit source approvals, or run model/evaluator/smoke
   commands. Missing fields should be recorded as limitations or future
   approval-gated checks, not created in this mission.

4. Write the tracked contract receipt:

`docs/validation/return-to-form-m3ge-m3gb-source-split-metadata-contract-no-remote-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run;
- read-only Brev default-off state;
- M3GD/M3GC/M3GB receipt and session paths;
- copied-back output-file presence and hashes if available;
- metadata inventory by artifact and split;
- signer/source/split/label/tensor/sidecar/report field coverage;
- missing-field classification;
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

- `continue_m3gb_local_contract_repair_no_remote`
- `continue_m3gb_source_split_manifest_accounting_repair_no_remote`
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

`docs/session-logs/620-mission-3ge-m3gb-source-split-metadata-contract-no-remote.md`

The session log must record commands, evidence inspected, metadata-contract
summary, Brev default-off status, claim surfaces, changed files, and exactly
one next action.

## Boundaries

- Local/no-remote/no-training source/split/metadata contract only.
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

1. `GOAL.md` points at this prompt and names Mission 3GE.
2. Required local checks pass or record exact blockers.
3. The M3GD, M3GC, and M3GB receipts/session logs and available copied-back
   output JSON files are inspected.
4. A tracked M3GE receipt exists or the exact blocker preventing it is
   recorded.
5. The receipt inventories existing signer/source/split/label/tensor/sidecar/
   report fields from existing evidence only and classifies missing fields.
6. The receipt separates autonomous-safe read-only checks from approval-gated
   future checks and selects exactly one allowed next action.
7. Brev remains stopped/default-off and no remote command occurs.
8. Claim surfaces remain fail-closed.
9. No forbidden training, rerun, Brev, source, data, crop/input
   implementation, export, promotion, browser activation, or unsupported claim
   work occurs.
10. A numbered session log exists and selects exactly one next action.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-remote/no-training,
  preserves fail-closed claims, produces the scoped contract receipt/log or
  records an exact blocker, and selects one allowed next action.
- NUDGE if it misses M3GD/M3GC/M3GB accounting, copied-output hash accounting,
  signer/source/split/tensor/sidecar/report field inventory, missing-field
  classification, approval/escalation gates, forbidden-action proof,
  changed-file accounting, or exactly one next action.
- REDIRECT if it drifts into Brev lifecycle, remote work, training/evaluation
  reruns, raw-video inspection, source/data/crop/input mutation, export,
  promotion, browser activation, or claim expansion.
- ESCALATE if the selected next action changes architecture, input
  representation, target schema, training budget, or compute and no current
  strategy memo covers the exact M3GB evidence.
- STOP if the selected next action requires human source, compute, privacy,
  claim, strategy, or final-submission approval.
