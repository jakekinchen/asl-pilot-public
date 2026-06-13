# Return-To-Form M3GM Metric Triage Dataset Vocabulary Model Input Strategy No Brev Goal Loop Prompt

Mission 3GM prompt for the Codex executor after M3GL completed the bounded
Brev provider recovery and high-signal region-grid TCN route, but metrics
regressed and promotion gates failed.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Create one local/no-remote/no-training M3GM receipt that explains what the
M3GL/M3GJ/M3GB evidence says about metric regression, dataset/vocabulary
choice, and model-input strategy before any further training-style spend.

This mission is analysis and strategy only. It must not start or exec Brev, run
training, rerun evaluation, run an evaluator, inspect raw videos, generate
tensors/crops, mutate manifests/tensors/vocabulary/source approvals, change
model/runtime code, export, promote, activate browser recognition, change claim
surfaces, or push.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3GL Brev recovery and regressed metric evidence:
   - [`docs/validation/return-to-form-m3gl-brev-provider-recovery-and-completion-route-v1.json`](../validation/return-to-form-m3gl-brev-provider-recovery-and-completion-route-v1.json)
   - [`docs/session-logs/638-mission-3gl-brev-provider-recovery-and-completion-route.md`](../session-logs/638-mission-3gl-brev-provider-recovery-and-completion-route.md)
   - `output/m3gl-high-signal-region-grid-tcn-brev-seed20260530/training-provenance.json`, if present locally
   - `output/m3gl-high-signal-region-grid-tcn-brev-seed20260530/validation-report.json`, if present locally
   - `output/m3gl-high-signal-region-grid-tcn-brev-seed20260530/prediction-sidecar.json`, if present locally
5. M3GJ and M3GB baseline evidence:
   - [`docs/validation/return-to-form-m3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility-v1.json`](../validation/return-to-form-m3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility-v1.json)
   - [`docs/session-logs/633-mission-3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility.md`](../session-logs/633-mission-3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility.md)
   - [`docs/validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json`](../validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json)
   - [`docs/session-logs/613-mission-3gb-human-approved-bounded-brev-composable-training.md`](../session-logs/613-mission-3gb-human-approved-bounded-brev-composable-training.md)
   - `output/m3gb-high-signal-region-grid-tcn-brev/training-provenance.json`, if present locally
   - `output/m3gb-high-signal-region-grid-tcn-brev/validation-report.json`, if present locally
   - `output/m3gb-high-signal-region-grid-tcn-brev/prediction-sidecar.json`, if present locally
6. Local post-M3GB triage and accounting evidence:
   - [`docs/validation/return-to-form-m3gc-m3gb-metric-triage-no-remote-v1.json`](../validation/return-to-form-m3gc-m3gb-metric-triage-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3gd-m3gb-error-pattern-analysis-no-remote-v1.json`](../validation/return-to-form-m3gd-m3gb-error-pattern-analysis-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3ge-m3gb-source-split-metadata-contract-no-remote-v1.json`](../validation/return-to-form-m3ge-m3gb-source-split-metadata-contract-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3gf-m3gb-source-split-manifest-accounting-repair-no-remote-v1.json`](../validation/return-to-form-m3gf-m3gb-source-split-manifest-accounting-repair-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3gg-m3gb-report-sidecar-contract-gap-patch-plan-no-remote-v1.json`](../validation/return-to-form-m3gg-m3gb-report-sidecar-contract-gap-patch-plan-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3gh-m3gb-evaluator-sidecar-contract-repair-no-remote-v1.json`](../validation/return-to-form-m3gh-m3gb-evaluator-sidecar-contract-repair-no-remote-v1.json)
7. Current strategy memos:
   - [`artifacts/research/observer-547-m3ew-post-tcn-strategy/response.md`](../../artifacts/research/observer-547-m3ew-post-tcn-strategy/response.md)
   - [`artifacts/research/observer-584-m3fm-popsign-label-ladder-strategy/response.md`](../../artifacts/research/observer-584-m3fm-popsign-label-ladder-strategy/response.md)
   - [`artifacts/research/observer-597-m3fs-detector0-strict-gate-strategy/response.md`](../../artifacts/research/observer-597-m3fs-detector0-strict-gate-strategy/response.md)
8. Dataset/source, manifests, and fail-closed claim surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - `data/manifests/lesson/high-signal-region-grid/train.json`
   - `data/manifests/lesson/high-signal-region-grid/validation.json`
   - `data/manifests/lesson/high-signal-region-grid/test.json`
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Required Slice

Complete one local/no-remote/no-training strategy slice:

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
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

2. Triage M3GL against M3GJ and M3GB from existing evidence only. Include:

   - selected epoch, train/validation movement, validation/test top-1,
     macro-F1, threshold, false-pass, negative-challenge, and failed gates;
   - metric deltas from M3GB/M3GJ and whether the change is regression, noise,
     or evidence of a deeper issue;
   - per-label/per-example patterns visible in existing sidecars and reports,
     especially labels that were weak across M3GB and M3GL;
   - whether the current input contract (`rgb_regions_grid_v1`) appears
     aligned with the vocabulary and signer/source split evidence;
   - which failure explanations are supported, weakly suggested, or still
     unproven: dataset/source/split, vocabulary composition, signer coverage,
     input/crop/coverage, temporal/motion signal, architecture/objective,
     threshold/calibration, evaluation contract, or training budget.

3. Compare current evidence to the existing strategy memos. Record whether
   those memos still cover the M3GL failure mode. If the next useful move would
   change architecture, input representation, target schema, source scope,
   vocabulary, training budget, compute, runtime behavior, privacy posture, or
   claim surfaces beyond what the current memos cover, select a research or
   human-approval next action instead of performing the change.

4. Produce a concrete no-spend strategy. It should name the smallest next
   non-training artifact that would reduce uncertainty, such as a local
   dataset/vocabulary/model-input contract, approval receipt, or research
   diagnostic. It must not mutate the source register, manifests, tensors,
   vocabulary, claim surfaces, or runtime.

5. Write the tracked receipt:

`docs/validation/return-to-form-m3gm-metric-triage-dataset-vocab-model-input-strategy-no-brev-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run;
- read-only Brev default-off state;
- M3GL, M3GJ, and M3GB receipt/session paths and summaries;
- copied-back output-file presence and hashes if available;
- metric comparison table;
- dataset/vocabulary/model-input findings and uncertainties;
- strategy memo coverage assessment;
- rejected actions and why;
- approval/escalation gates;
- claim-surface status;
- explicit forbidden-action proof;
- `pretrained_components: []`;
- changed files;
- exactly one next action.

6. Select exactly one next action:

- `continue_m3gn_dataset_vocab_model_input_contract_no_brev`
- `continue_openai_or_gpt_pro_research_with_m3gl_evidence`
- `prepare_followup_compute_receipt_for_human_approval`
- `continue_fail_closed_interactive_product_hardening_no_model_promotion`
- `stop_for_human_dataset_vocab_model_input_strategy_choice`

Do not select another Brev lifecycle/training/evaluation action directly. A
future compute step must be only a receipt proposal requiring fresh human
approval before any lifecycle, remote, training, copyback, export, promotion,
or activation command.

## Session Log

Write:

`docs/session-logs/640-mission-3gm-metric-triage-dataset-vocab-model-input-strategy-no-brev.md`

The session log must record commands, evidence inspected, metric-triage
summary, dataset/vocabulary/model-input strategy, Brev default-off status,
claim surfaces, changed files, and exactly one next action.

## Boundaries

- Local/no-remote/no-training strategy only.
- No Brev start/stop/reset/exec/sync/copy, remote dry-run, remote training,
  remote evaluation, package install, duplicate worker, or GPU/cloud spend.
- No second M3GL/M3GB training attempt, evaluator rerun, broad 75/80/95-label
  run, label expansion, architecture search, hyperparameter sweep, Detector 0
  training, source/media import, source-register mutation, manifest/tensor/
  vocabulary/packet mutation, raw learner video upload, dependency-file
  mutation, generated labels, pseudo-labels, or crop/input implementation
  change.
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

1. `GOAL.md` points at this prompt and names Mission 3GM.
2. Required local checks pass or record exact blockers.
3. The M3GL receipt/session log, M3GJ receipt/session log, M3GB receipt/session
   log, current strategy memos, and available copied-back output JSON files are
   inspected.
4. A tracked M3GM receipt exists or the exact blocker preventing it is
   recorded.
5. The receipt includes metric comparison, dataset/vocabulary/model-input
   findings, strategy memo coverage assessment, rejected actions,
   approval/escalation gates, claim-surface status, and forbidden-action proof.
6. Brev remains stopped/default-off and no lifecycle or remote command occurs.
7. Claim surfaces remain fail-closed.
8. No forbidden training, evaluator rerun, Brev, source, data, crop/input
   implementation, export, promotion, browser activation, or unsupported claim
   work occurs.
9. A numbered session log exists and selects exactly one next action.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-remote/no-training,
  preserves fail-closed claims, produces the scoped strategy receipt/log or
  records an exact blocker, and selects one allowed next action.
- NUDGE if it misses M3GL/M3GJ/M3GB accounting, copied-output hash accounting,
  metric comparison, dataset/vocabulary/model-input findings, strategy-memo
  coverage, approval/escalation gates, forbidden-action proof, changed-file
  accounting, or exactly one next action.
- REDIRECT if it drifts into Brev lifecycle, remote work, training/evaluation
  reruns, raw-video inspection, source/data/crop/input mutation, export,
  promotion, browser activation, or claim expansion.
- ESCALATE if the selected next action changes architecture, input
  representation, target schema, source scope, vocabulary, training budget, or
  compute and no current strategy memo covers the exact M3GL evidence.
- STOP if the selected next action requires human source, compute, privacy,
  claim, strategy, or final-submission approval.
