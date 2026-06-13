# Return-To-Form M3GY Reduced4 Diagnostic Eval Rerun No Training No Brev Goal Loop Prompt

Mission 3GY prompt for the Codex executor after M3GX selected
`continue_m3gy_reduced4_diagnostic_eval_rerun_no_training_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run exactly one local/no-Brev/no-training reduced4 diagnostic evaluator rerun
that exercises the M3GX sidecar logits contract, without overwriting M3GU's
existing ignored outputs. If the evaluator still hard-codes the old M3GU output
namespace and rejects a new diagnostic output directory, repair only that output
namespace guard first, preserving the old no-overwrite protection.

This mission must not train, fit, micro-overfit, run Brev lifecycle/remote/sync/
copy/exec commands, import source/media, inspect raw media, mutate manifests,
mutate tensors, broaden vocabulary, export, promote, activate browser
recognition, change final gates, or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3GX evidence:
   - [`docs/validation/return-to-form-m3gx-reduced4-manifest-metadata-or-sidecar-diagnostic-repair-no-training-v1.json`](../validation/return-to-form-m3gx-reduced4-manifest-metadata-or-sidecar-diagnostic-repair-no-training-v1.json)
   - [`docs/session-logs/663-mission-3gx-reduced4-manifest-metadata-or-sidecar-diagnostic-repair-no-training.md`](../session-logs/663-mission-3gx-reduced4-manifest-metadata-or-sidecar-diagnostic-repair-no-training.md)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
5. M3GU/M3GW evidence:
   - [`docs/validation/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-v1.json`](../validation/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-v1.json)
   - [`docs/session-logs/657-mission-3gu-reduced4-local-training-smoke-no-brev.md`](../session-logs/657-mission-3gu-reduced4-local-training-smoke-no-brev.md)
   - [`docs/validation/return-to-form-m3gw-reduced4-data-split-zero-recall-diagnosis-no-training-v1.json`](../validation/return-to-form-m3gw-reduced4-data-split-zero-recall-diagnosis-no-training-v1.json)
6. Existing ignored M3GU artifacts, read-only:
   - `output/m3gu-reduced4-local-training-smoke/model_state.pt`
   - `output/m3gu-reduced4-local-training-smoke/training-provenance.json`
   - `output/m3gu-reduced4-local-training-smoke/validation-report.json`
   - `output/m3gu-reduced4-local-training-smoke/prediction-sidecar.json`
7. M3GQ reduced4 manifests:
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/train.json`
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/validation.json`
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/test.json`
8. Fail-closed claim and source surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Required Slice

Complete exactly one bounded diagnostic evaluator rerun slice.

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3gx-reduced4-manifest-metadata-or-sidecar-diagnostic-repair-no-training-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-v1.json >/dev/null
python3 -m json.tool data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/train.json >/dev/null
python3 -m json.tool data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/validation.json >/dev/null
python3 -m json.tool data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/test.json >/dev/null
brev ls --json
git diff --check
```

2. Define the output namespace:

`output/m3gy-reduced4-diagnostic-eval-rerun-no-brev/`

The mission may create or overwrite files only inside that namespace. It must
not rewrite, delete, move, or promote any existing M3GU output.

3. Preflight the evaluator command. The intended rerun uses the existing M3GU
   checkpoint/provenance and the M3GQ reduced4 manifests:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/evaluate_rawframe_model.py \
  --checkpoint output/m3gu-reduced4-local-training-smoke/model_state.pt \
  --training-provenance output/m3gu-reduced4-local-training-smoke/training-provenance.json \
  --train-manifest data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/train.json \
  --validation-manifest data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/validation.json \
  --test-manifest data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/test.json \
  --output-report output/m3gy-reduced4-diagnostic-eval-rerun-no-brev/validation-report.json \
  --calibrated-provenance output/m3gy-reduced4-diagnostic-eval-rerun-no-brev/calibrated-provenance.json \
  --prediction-sidecar output/m3gy-reduced4-diagnostic-eval-rerun-no-brev/prediction-sidecar.json \
  --batch-size 4 \
  --num-workers 0 \
  --m3gu-reduced4-training-smoke
```

4. If the preflight or first execution attempt is blocked only because
   `scripts/evaluate_rawframe_model.py` requires M3GU reduced4 outputs under the
   old `output/m3gu-reduced4-local-training-smoke/` namespace, make the smallest
   evaluator repair that allows this explicit M3GY diagnostic namespace while
   keeping the old no-overwrite guard for M3GU. Do not loosen final, lesson,
   product, calibration, challenge, no-pretrained, decode, source, or signer
   gates.

5. Run exactly one diagnostic evaluator rerun after the namespace contract is
   valid. Capture the exit status. An exit status of `1` due failed target
   metrics is acceptable diagnostic evidence if the report/sidecar are produced;
   any schema, source, tensor, missing-file, pretrained, or output-namespace
   error is a blocker to record.

6. Validate the new sidecar/report:

   - JSON parses for validation report, calibrated provenance, and prediction
     sidecar;
   - prediction sidecar schema remains v2 and contract version remains v2 unless
     a receipt explains a stronger reason;
   - validation and test examples include `logits_by_label`,
     `predicted_label_logit`, `true_label_logit`, `top2_logit`,
     `top2_logit_label`, and `logit_margin`;
   - existing M3GU ignored outputs are unchanged by hash;
   - claim surfaces remain fail-closed.

7. Write the tracked receipt:

`docs/validation/return-to-form-m3gy-reduced4-diagnostic-eval-rerun-no-training-no-brev-v1.json`

The receipt must include:

- current commit and active prompt;
- files changed;
- exact command, exit status, and output paths;
- whether an output-namespace guard repair was needed;
- hashes for old M3GU outputs before/after and new M3GY outputs;
- logit-field validation results;
- metrics interpretation without overclaiming readiness;
- Brev read-only/default-off state;
- claim-surface proof;
- forbidden-action proof;
- exactly one next action.

8. Write the session log:

`docs/session-logs/665-mission-3gy-reduced4-diagnostic-eval-rerun-no-training-no-brev.md`

9. Select exactly one next action:

- `continue_m3gz_reduced4_logit_collapse_triage_no_training_no_brev`
- `escalate_openai_or_gpt_pro_strategy_with_m3gq_to_m3gy_evidence`
- `stop_for_human_compute_source_or_claim_review`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3GY.
2. Baseline checks pass or exact blockers are recorded.
3. Existing M3GU output artifacts are not rewritten, moved, deleted, copied to
   tracked files, exported, or promoted.
4. Exactly one local/no-Brev/no-training diagnostic evaluator rerun is attempted
   under `output/m3gy-reduced4-diagnostic-eval-rerun-no-brev/`, or the exact
   output-namespace blocker is recorded after one scoped repair attempt.
5. New sidecar/report JSON, when produced, is validated for the M3GX raw-logit
   fields.
6. No training/fitting, Brev lifecycle/remote/sync/copy/exec/spend, raw media
   inspection, source import, source rights mutation, manifest/tensor/vocabulary
   mutation, export, promotion, browser activation, final-gate change, claim
   expansion, broad-label run, or pretrained shortcut occurs.
7. A tracked M3GY receipt and numbered session log exist.
8. Claim surfaces remain fail-closed and unpromoted.
9. Exactly one next action is selected.

## Boundaries

- Local/no-remote/no-Brev/no-training only.
- Any evaluator code edit must be limited to explicit M3GY diagnostic output
  namespace support or direct logit-sidecar validation support.
- Do not use `git add -A`; stage only scoped files.
- Do not push, amend, use `--no-verify`, delete ignored output artifacts, or
  weaken any final-readiness gate.

## Observer Guidance

- CONTINUE if the executor produces a new M3GY diagnostic sidecar/report with
  validated raw-logit fields, preserves old M3GU output hashes, keeps claims
  fail-closed, keeps Brev read-only/default-off, and selects one bounded next
  action.
- NUDGE if the receipt omits output hashes, exit status nuance, logit-field
  validation, claim-surface proof, forbidden-action proof, or exactly one next
  action.
- REDIRECT if the executor trains, reruns fitting, overwrites old M3GU outputs,
  mutates manifests/tensors/vocabulary/source rights, inspects raw media, uses
  Brev lifecycle/remote commands, exports, promotes, activates browser
  recognition, broadens labels, or expands claims.
- STOP if the next action requires Brev spend, source/media review, claim
  changes, promotion, or human budget approval.
- ESCALATE if the rerun still leaves the failure mode ambiguous and the next
  proposal is another training-style attempt without strategy review.

## Progress Ledger

Current state: M3GX repaired the future sidecar contract so evaluator outputs
can include raw logits, true/predicted logits, top-2 logits, and logit margin.
M3GU outputs must remain preserved as historical evidence.

Completed: M3GQ reduced4 manifests; M3GR local input/train-fit preflight; M3GS
triage; M3GT smoke contract; M3GU guarded local smoke/eval; M3GV metric triage;
M3GW zero-recall/data-split diagnosis; M3GX sidecar logit contract repair.

Evidence: M3GX receipt/log, M3GU output hashes, M3GQ manifests, fail-closed
claim surfaces, source register, and read-only Brev state.

Remaining: produce one no-training diagnostic sidecar/report with the M3GX logit
fields, then decide whether logits explain collapse, require strategy
escalation, or justify a later bounded compute route.

Blockers: do not run Brev, train, broaden labels, inspect raw media, promote, or
claim readiness from this diagnostic rerun.

Next step: execute or unblock exactly one M3GY local diagnostic evaluator rerun
under the new output namespace and record the evidence.
