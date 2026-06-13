# Return-To-Form M3EW M3EV Metric Triage No-Remote Goal Loop Prompt

Mission 3EW prompt for the Codex executor after Mission 3EV completed one
bounded Brev TCN training smoke and produced weak, non-promotable metrics.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Perform one local/no-remote/no-training metric triage over the M3EV copied
artifacts, receipt, and prior return-to-form evidence. This is an evidence and
decision packet only. It must decide whether the M3EV failure is explained by
artifact/accounting issues, a local contract bug, source/split/representation
limits, or repeated weak learnability that should route to research, product
hardening, claim reduction, or human strategy review.

This prompt does not authorize another Brev start, remote command, training
run, evaluation rerun, architecture search, source/data mutation, export,
promotion, browser activation, final-readiness claim, or ASL-correctness claim.

## Starting Evidence

- M3EV executor commit `4bffeb8` wrote
  [`docs/validation/return-to-form-m3ev-bounded-brev-tcn-training-smoke-after-m3eu-command-fix-v1.json`](../validation/return-to-form-m3ev-bounded-brev-tcn-training-smoke-after-m3eu-command-fix-v1.json)
  and
  [`docs/session-logs/544-mission-3ev-bounded-brev-tcn-training-smoke-after-m3eu-command-fix.md`](../session-logs/544-mission-3ev-bounded-brev-tcn-training-smoke-after-m3eu-command-fix.md).
- M3EV passed local audits, verified current listed `l40s-48gb.1x` price at
  `1.74 USD/hour`, started only `asl-pilot-m3eh-l40s-001` / `3d58wpy9o`,
  verified the L40S/CUDA surface, synced once, matched remote hashes, passed
  the remote dry-run with `--dry-run --require-input-contract
  rgb_regions_grid_v1`, and ran exactly one timed non-dry-run command without
  `--require-input-contract`.
- Training completed on CUDA and wrote checkpoint/provenance artifacts. The
  selected epoch was `3`, selected validation accuracy was
  `0.2222222222222222`, and final train accuracy was
  `0.42857142857142855`.
- M3EV evaluation ran once and exited failed-targets after writing reports:
  validation top-1 `0.2222222222222222`, validation macro-F1
  `0.13796992481203008`, test top-1 `0.17857142857142858`, and test macro-F1
  `0.11591836734693879`.
- Prediction concentration is material evidence: validation predictions were
  concentrated on `white=15` and test predictions on `white=21`; validation
  zero-recall labels were `black`, `please`, `sad`, and `table`; test
  zero-recall labels were `black`, `hello`, `please`, and `table`.
- M3EV copied back the scoped output directory under ignored local path
  `output/m3er-high-signal-region-grid-tcn-brev/` and did not commit model
  artifacts.
- The final retained-worker state was verified as `STOPPED` / `COMPLETED` /
  `NOT READY` / `HEALTHY`.
- Browser recognition remains fail-closed:
  `web/public/model/model-card.json` is `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has no active labels.

## Authorization

No fresh Brev spend, remote execution, or model training is authorized by this
prompt.

Do not run `brev start`, `brev exec`, `bash scripts/brev_sync_repo.sh`,
`brev copy`, remote dry-run, remote training, package install, or any Brev
lifecycle command in M3EW. A read-only `brev ls --json` is required for
default-off visibility. If read-only state unexpectedly reports the retained
worker as `RUNNING`, stop only that existing worker as a cost-control action,
verify stopped state, record the blocker, and do not continue into remote work.

Do not run a local or remote training command. Do not run fitting, backward,
optimizer, epoch training, checkpoint creation, evaluation from checkpoint,
threshold tuning for promotion, ONNX export, model-card promotion, browser
trained activation, or final-readiness claim.

## Source Of Truth

1. Latest supervising-user instruction.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3EV receipt:
   [`docs/validation/return-to-form-m3ev-bounded-brev-tcn-training-smoke-after-m3eu-command-fix-v1.json`](../validation/return-to-form-m3ev-bounded-brev-tcn-training-smoke-after-m3eu-command-fix-v1.json).
4. M3EV session log:
   [`docs/session-logs/544-mission-3ev-bounded-brev-tcn-training-smoke-after-m3eu-command-fix.md`](../session-logs/544-mission-3ev-bounded-brev-tcn-training-smoke-after-m3eu-command-fix.md).
5. Local copied M3EV artifacts, if present:
   - [`output/m3er-high-signal-region-grid-tcn-brev/training-provenance.json`](../../output/m3er-high-signal-region-grid-tcn-brev/training-provenance.json)
   - [`output/m3er-high-signal-region-grid-tcn-brev/validation-report.json`](../../output/m3er-high-signal-region-grid-tcn-brev/validation-report.json)
   - [`output/m3er-high-signal-region-grid-tcn-brev/prediction-sidecar.json`](../../output/m3er-high-signal-region-grid-tcn-brev/prediction-sidecar.json)
   - [`output/m3er-high-signal-region-grid-tcn-brev/model_state.pt`](../../output/m3er-high-signal-region-grid-tcn-brev/model_state.pt)
6. M3EM Tiny2 held-out noncollapse receipt:
   [`docs/validation/return-to-form-m3em-tiny2-heldout-noncollapse-probe-v1.json`](../validation/return-to-form-m3em-tiny2-heldout-noncollapse-probe-v1.json).
7. M3EN Detector 0/source-region receipt:
   [`docs/validation/return-to-form-m3en-detector0-source-region-receipts-v1.json`](../validation/return-to-form-m3en-detector0-source-region-receipts-v1.json).
8. M3EO target reconciliation receipt:
   [`docs/validation/return-to-form-m3eo-overnight-detector0-brev-unblock-v1.json`](../validation/return-to-form-m3eo-overnight-detector0-brev-unblock-v1.json).
9. Current model-card and active-claim surfaces.

## Required Slice

Complete one local metric-triage pass:

1. Verify local state, active prompt, local audits, M3EV receipt JSON, M3EV
   session log, fail-closed claim surfaces, and Brev default-off visibility.
2. Verify whether the ignored copied output directory exists locally. If it
   exists, list and hash only the scoped M3EV files. If it is absent, use the
   M3EV receipt summaries and record that local artifact files were unavailable;
   do not run Brev copyback.
3. Inspect `training-provenance.json`, `validation-report.json`, and
   `prediction-sidecar.json` if present. Do not load the checkpoint for
   inference and do not run evaluation.
4. Compare M3EV train history, selected epoch, validation/test metrics,
   predicted-label concentration, per-label zero recall, and threshold coverage
   against M3EM Tiny2 collapse and the Detector 0/source-region receipts.
5. Classify the likely blocker or blockers. At minimum distinguish:
   - artifact/accounting or copyback inconsistency;
   - evaluation/report contract issue;
   - source/split/label separability limitation;
   - region-grid representation limitation;
   - architecture/training-budget limitation;
   - repeated weak learnability without clear local repair.
6. State whether any local no-training contract repair is evident. If the
   failure is just weak metrics, do not invent a source-code repair.
7. State whether the copied artifacts justify any browser/product/model claim.
   The expected answer is no unless the evidence proves otherwise.
8. Apply the observer progress-quality boundary: do not select another
   training-style next action unless this packet identifies a concrete local
   contract bug or routes first to OpenAI/GPT research or human approval.
9. Write the tracked M3EW receipt and numbered session log.
10. Commit only scoped receipt and session-log artifacts.

Required local checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3ev-bounded-brev-tcn-training-smoke-after-m3eu-command-fix-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
bash -n scripts/brev_sync_repo.sh
brev ls --json
git diff --check
```

Optional local artifact checks, only if the copied directory exists:

```sh
find output/m3er-high-signal-region-grid-tcn-brev -maxdepth 1 -type f -print | sort
shasum -a 256 output/m3er-high-signal-region-grid-tcn-brev/model_state.pt output/m3er-high-signal-region-grid-tcn-brev/training-provenance.json output/m3er-high-signal-region-grid-tcn-brev/validation-report.json output/m3er-high-signal-region-grid-tcn-brev/prediction-sidecar.json
python3 -m json.tool output/m3er-high-signal-region-grid-tcn-brev/training-provenance.json >/dev/null
python3 -m json.tool output/m3er-high-signal-region-grid-tcn-brev/validation-report.json >/dev/null
python3 -m json.tool output/m3er-high-signal-region-grid-tcn-brev/prediction-sidecar.json >/dev/null
```

## Receipt

Write:

`docs/validation/return-to-form-m3ew-m3ev-metric-triage-no-remote-v1.json`

The receipt must include:

- M3EV receipt/session-log summary;
- local checks and fail-closed claim-surface status;
- read-only Brev provider state and any default-off stop action if needed;
- copied artifact availability and hashes, or exact no-local-artifact reason;
- train history summary, selected epoch, and overfit/generalization assessment;
- validation/test top-1, macro-F1, threshold coverage, prediction
  concentration, and zero-recall labels;
- comparison to M3EM/M3EN/M3EO evidence;
- blocker classification;
- explicit statement that no training, evaluation rerun, Brev command, export,
  promotion, browser activation, product-runtime mutation, source/data/
  dependency mutation, or final-readiness claim occurred;
- `pretrained_components: []`;
- all negative authorizations from this prompt;
- changed files;
- exactly one next action.

Allowed next actions:

- `continue_local_artifact_accounting_no_remote` if the copied artifact state
  or hashes are inconsistent and need a local accounting-only follow-up.
- `continue_local_tcn_contract_diagnosis_no_training` if a specific local
  evaluation/report/input contract bug is evident without rerunning training.
- `continue_local_claim_surface_reduction_no_remote` if docs/UI claim surfaces
  need tightening after the weak metrics.
- `continue_fail_closed_interactive_product_hardening` if no immediate ML
  repair is justified and deadline value should move to fail-closed learner
  interaction.
- `continue_openai_or_gpt_pro_research` if the next ML move would change
  architecture, input representation, training budget, source strategy, or
  another training-style slice after repeated weak learnability.
- `stop_for_human_model_strategy_review` if human approval is required before
  more ML spend, source/data mutation, or training-style work.

## Session Log

Write:

`docs/session-logs/546-mission-3ew-m3ev-metric-triage-no-remote.md`

The session log must record commands, evidence inspected, artifact availability
and hashes, metric triage, blocker classification, Brev default-off status,
changed files, and exactly one next action.

## Boundaries

- Local/no-remote/no-spend only.
- No Brev start/exec/sync/copy, remote dry-run, remote training, package
  install, or worker lifecycle command except stopping the existing worker if
  read-only state unexpectedly shows it running.
- No local or remote training command, fitting, backward, optimizer, epoch
  training, checkpoint creation, evaluation rerun, threshold promotion, export,
  model-card promotion, browser recognition activation, product-runtime
  mutation, final-readiness claim, or positive ASL-correctness claim.
- No broad 75/80/95-label work, label expansion, architecture search,
  hyperparameter sweep, Detector 0 training, source/media import,
  source-register mutation, manifest/tensor/vocabulary/packet mutation, or
  dependency-file mutation.
- No pretrained detector, landmark model, backbone, embedding, feature
  extractor, teacher logits, MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP,
  `from_pretrained`, `pretrained=True`, pseudo-labels, or generated-label path.
- Do not stage or commit ignored model artifacts under `output/`.
- No push, amend, no-verify, duplicate worker, worker delete, or worker reset.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3EW.
2. Required local checks pass or exact blockers are recorded.
3. M3EV copied artifact availability and hashes are recorded, or absence is
   explicitly classified without remote copyback.
4. M3EV metrics are triaged against prior return-to-form evidence and a
   concrete blocker classification is recorded.
5. Fail-closed claim surfaces remain unchanged.
6. No forbidden training, remote, source/data/dependency, product, promotion,
   broad-label, worker, or pretrained/generated-label action occurs.
7. The tracked M3EW receipt and numbered session log exist and select exactly
   one next action.
