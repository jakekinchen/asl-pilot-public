# Return-To-Form M3GP Human Strategy Packet No Brev Goal Loop Prompt

Mission 3GP prompt for the Codex executor after M3GO completed the read-only
contract-gap inventory and selected a local human strategy packet.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Create one local/no-remote/no-training M3GP human strategy packet that turns
the M3GL/M3GM/M3GN/M3GO evidence into a concise decision surface for the
human reviewer. The packet must separate observed facts from inference,
identify closed questions, list open choices, name approval gates, and make
clear which future paths are available without spending or mutation and which
require human approval.

This mission is packet-only. It must not start or exec Brev, run training,
rerun evaluation, run an evaluator, call research APIs, inspect raw videos,
generate tensors/crops, mutate manifests/tensors/vocabulary/source approvals,
change model/runtime code, export, promote, activate browser recognition,
change claim surfaces, or push.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3GO inventory evidence:
   - [`docs/validation/return-to-form-m3go-read-only-contract-gap-inventory-no-brev-v1.json`](../validation/return-to-form-m3go-read-only-contract-gap-inventory-no-brev-v1.json)
   - [`docs/session-logs/644-mission-3go-read-only-contract-gap-inventory-no-brev.md`](../session-logs/644-mission-3go-read-only-contract-gap-inventory-no-brev.md)
5. M3GN contract evidence:
   - [`docs/validation/return-to-form-m3gn-dataset-vocab-model-input-contract-no-brev-v1.json`](../validation/return-to-form-m3gn-dataset-vocab-model-input-contract-no-brev-v1.json)
   - [`docs/session-logs/642-mission-3gn-dataset-vocab-model-input-contract-no-brev.md`](../session-logs/642-mission-3gn-dataset-vocab-model-input-contract-no-brev.md)
6. M3GM strategy evidence:
   - [`docs/validation/return-to-form-m3gm-metric-triage-dataset-vocab-model-input-strategy-no-brev-v1.json`](../validation/return-to-form-m3gm-metric-triage-dataset-vocab-model-input-strategy-no-brev-v1.json)
   - [`docs/session-logs/640-mission-3gm-metric-triage-dataset-vocab-model-input-strategy-no-brev.md`](../session-logs/640-mission-3gm-metric-triage-dataset-vocab-model-input-strategy-no-brev.md)
7. M3GL, M3GJ, and M3GB diagnostic evidence:
   - [`docs/validation/return-to-form-m3gl-brev-provider-recovery-and-completion-route-v1.json`](../validation/return-to-form-m3gl-brev-provider-recovery-and-completion-route-v1.json)
   - [`docs/session-logs/638-mission-3gl-brev-provider-recovery-and-completion-route.md`](../session-logs/638-mission-3gl-brev-provider-recovery-and-completion-route.md)
   - [`docs/validation/return-to-form-m3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility-v1.json`](../validation/return-to-form-m3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility-v1.json)
   - [`docs/session-logs/633-mission-3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility.md`](../session-logs/633-mission-3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility.md)
   - [`docs/validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json`](../validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json)
   - [`docs/session-logs/613-mission-3gb-human-approved-bounded-brev-composable-training.md`](../session-logs/613-mission-3gb-human-approved-bounded-brev-composable-training.md)
8. Local accounting receipts:
   - [`docs/validation/return-to-form-m3gc-m3gb-metric-triage-no-remote-v1.json`](../validation/return-to-form-m3gc-m3gb-metric-triage-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3gd-m3gb-error-pattern-analysis-no-remote-v1.json`](../validation/return-to-form-m3gd-m3gb-error-pattern-analysis-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3ge-m3gb-source-split-metadata-contract-no-remote-v1.json`](../validation/return-to-form-m3ge-m3gb-source-split-metadata-contract-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3gf-m3gb-source-split-manifest-accounting-repair-no-remote-v1.json`](../validation/return-to-form-m3gf-m3gb-source-split-manifest-accounting-repair-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3gg-m3gb-report-sidecar-contract-gap-patch-plan-no-remote-v1.json`](../validation/return-to-form-m3gg-m3gb-report-sidecar-contract-gap-patch-plan-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3gh-m3gb-evaluator-sidecar-contract-repair-no-remote-v1.json`](../validation/return-to-form-m3gh-m3gb-evaluator-sidecar-contract-repair-no-remote-v1.json)
9. Current strategy memos:
   - [`artifacts/research/observer-547-m3ew-post-tcn-strategy/response.md`](../../artifacts/research/observer-547-m3ew-post-tcn-strategy/response.md)
   - [`artifacts/research/observer-584-m3fm-popsign-label-ladder-strategy/response.md`](../../artifacts/research/observer-584-m3fm-popsign-label-ladder-strategy/response.md)
   - [`artifacts/research/observer-597-m3fs-detector0-strict-gate-strategy/response.md`](../../artifacts/research/observer-597-m3fs-detector0-strict-gate-strategy/response.md)
10. Dataset/source, manifests, ignored copied-back JSON if already local, and
    fail-closed claim surfaces:
    - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
    - `data/manifests/lesson/high-signal-region-grid/train.json`
    - `data/manifests/lesson/high-signal-region-grid/validation.json`
    - `data/manifests/lesson/high-signal-region-grid/test.json`
    - `output/m3gl-high-signal-region-grid-tcn-brev-seed20260530/training-provenance.json`, if present locally
    - `output/m3gl-high-signal-region-grid-tcn-brev-seed20260530/validation-report.json`, if present locally
    - `output/m3gl-high-signal-region-grid-tcn-brev-seed20260530/prediction-sidecar.json`, if present locally
    - `output/m3gb-high-signal-region-grid-tcn-brev/training-provenance.json`, if present locally
    - `output/m3gb-high-signal-region-grid-tcn-brev/validation-report.json`, if present locally
    - `output/m3gb-high-signal-region-grid-tcn-brev/prediction-sidecar.json`, if present locally
    - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
    - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
    - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
    - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
    - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Required Slice

Complete one local/no-remote/no-training strategy-packet slice:

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3go-read-only-contract-gap-inventory-no-brev-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gn-dataset-vocab-model-input-contract-no-brev-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gm-metric-triage-dataset-vocab-model-input-strategy-no-brev-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gl-brev-provider-recovery-and-completion-route-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json >/dev/null
python3 -m json.tool docs/model/dataset-source-register.json >/dev/null
python3 -m json.tool data/manifests/lesson/high-signal-region-grid/train.json >/dev/null
python3 -m json.tool data/manifests/lesson/high-signal-region-grid/validation.json >/dev/null
python3 -m json.tool data/manifests/lesson/high-signal-region-grid/test.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
python3 -m json.tool web/public/model/claim-matrix.json >/dev/null
python3 -m json.tool docs/validation/final-claim-matrix.json >/dev/null
brev ls --json
git diff --check
```

If copied-back ignored M3GL/M3GJ/M3GB output JSON files exist locally, validate
them with `python3 -m json.tool` and record their hashes. Do not require ignored
output files to be tracked.

2. Write a human-facing strategy packet from existing evidence only. Include:

   - observed facts versus inference;
   - closed questions that should not consume more loop work now;
   - open human choices;
   - approval-gated paths and the approval required for each;
   - a short risk/tradeoff summary for each path;
   - paths explicitly rejected by M3GO evidence;
   - the recommended default if the human does not authorize new spend,
     source/media work, research, runtime change, or claim change.

3. Evaluate these strategy options without performing them:

   - `human_review_dataset_vocab_input_strategy`: stop for the human to choose
     source/vocabulary/input/research/compute/product direction;
   - `external_research_diagnostic`: ask whether to authorize OpenAI/GPT-Pro
     research using M3GL/M3GM/M3GN/M3GO evidence;
   - `fail_closed_product_hardening`: continue product work only while keeping
     recognizer/browser claims fail-closed and unpromoted;
   - `compute_receipt_only`: prepare a future compute receipt only if the
     packet identifies a specific expected metric signal and kill condition;
   - `source_vocab_input_change`: require human approval before any source,
     vocabulary, split, manifest, tensor, crop, input, or media work.

4. Do not perform any future check, research call, compute preparation,
   product work, source/media work, or mutation identified by the packet. The
   deliverable is the packet and only the packet.

5. Write the tracked receipt:

`docs/validation/return-to-form-m3gp-human-strategy-packet-no-brev-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run;
- read-only Brev default-off state;
- source receipts/logs inspected;
- copied-back output-file presence and hashes if available;
- source-supported observations separated from inference;
- closed questions;
- open human choices;
- evaluated strategy options and tradeoffs;
- recommended default;
- approval gates and stop/escalation rules;
- rejected actions and why;
- claim-surface status;
- explicit forbidden-action proof;
- `pretrained_components: []`;
- changed files;
- exactly one next action.

6. Select exactly one next action:

- `stop_for_human_dataset_vocab_model_input_strategy_choice`
- `continue_openai_or_gpt_pro_research_with_m3gl_m3gm_m3gn_m3go_m3gp_evidence`
- `continue_fail_closed_interactive_product_hardening_no_model_promotion`
- `prepare_followup_compute_receipt_for_human_approval`

The expected next action for a complete human strategy packet is usually
`stop_for_human_dataset_vocab_model_input_strategy_choice`. Do not select
training/evaluation, Brev lifecycle, source/media mutation, input/architecture
implementation, export, promotion, browser activation, or claim expansion
directly.

## Session Log

Write:

`docs/session-logs/646-mission-3gp-human-strategy-packet-no-brev.md`

The session log must record commands, evidence inspected, strategy packet
summary, Brev default-off status, claim surfaces, changed files, and exactly
one next action.

## Boundaries

- Local/no-remote/no-training packet only.
- No Brev start/stop/reset/exec/sync/copy, remote dry-run, remote training,
  remote evaluation, package install, duplicate worker, or GPU/cloud spend.
- No research API call or ChatGPT/GPT-Pro browser research inside M3GP.
- No training attempt, evaluator rerun, broad 75/80/95-label run, label
  expansion, architecture search, hyperparameter sweep, Detector 0 training,
  source/media import, source-register mutation, manifest/tensor/vocabulary/
  packet mutation, raw learner video upload, dependency-file mutation,
  generated labels, pseudo-labels, or crop/input implementation change.
- No raw-video inspection, crop thumbnail generation, manual relabeling, source
  approval shortcut, or model-card/runtime edit.
- No pretrained detector, landmark model, backbone, embedding, feature
  extractor, teacher logits, MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP,
  `from_pretrained`, `pretrained=True`, or model-weight shortcut in the
  promoted lane.
- No ONNX export, browser recognition activation, threshold promotion,
  final-readiness claim, positive ASL-correctness claim, product-runtime
  mutation, push, amend, or `--no-verify`.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3GP.
2. Required local checks pass or record exact blockers.
3. The M3GO/M3GN/M3GM/M3GL/M3GJ/M3GB evidence, local accounting receipts,
   current strategy memos, manifests, claim surfaces, and available copied-back
   output JSON files are inspected.
4. A tracked M3GP strategy-packet receipt exists or the exact blocker
   preventing it is recorded.
5. The receipt separates observed facts from inference, lists closed
   questions, lists open human choices, evaluates the strategy options, names
   approval gates, records rejected actions, and selects exactly one next
   action.
6. Brev remains stopped/default-off and no lifecycle or remote command occurs.
7. Claim surfaces remain fail-closed.
8. No forbidden training, evaluator rerun, Brev, source, data, crop/input
   implementation, export, promotion, browser activation, research API call,
   or unsupported claim work occurs.
9. A numbered session log exists and selects exactly one next action.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-remote/no-training,
  preserves fail-closed claims, produces the scoped strategy packet receipt/log
  or records an exact blocker, and selects one allowed next action.
- NUDGE if it misses observed-fact versus inference separation, closed
  questions, open human choices, strategy option tradeoffs, approval gates,
  rejected actions, forbidden-action proof, changed-file accounting, or exactly
  one next action.
- REDIRECT if it drifts into Brev lifecycle, remote work, training/evaluation
  reruns, raw-video inspection, source/data/crop/input mutation, product
  runtime work, export, promotion, browser activation, research API calls, or
  claim expansion.
- ESCALATE if the strategy choice remains unclear and the cost of choosing
  wrong is high enough to justify OpenAI/GPT-Pro research before further
  steering.
- STOP if the selected next action requires human source, compute, privacy,
  claim, strategy, research, scope, or final-submission approval.
