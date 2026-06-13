# Return-To-Form M3GX Reduced4 Manifest Metadata Or Sidecar Diagnostic Repair No Training Goal Loop Prompt

Mission 3GX prompt for the Codex executor after M3GW selected
`continue_m3gx_reduced4_manifest_metadata_or_sidecar_diagnostic_repair_no_training`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Implement one smallest useful local/no-remote/no-Brev/no-training diagnostic
contract repair that makes the next reduced4 compute attempt falsifiable instead
of another opaque accuracy number. Prefer sidecar/report instrumentation if a
single scoped edit can add the missing diagnostic fields for future evaluation;
otherwise add a manifest/session-metadata diagnostic helper that records exactly
which source, signer, session, crop, tensor, and sidecar fields are available or
missing.

This mission may edit diagnostic/evaluation/reporting code, helper scripts,
docs, and receipts. It must not train, fit, rerun evaluation, regenerate output
artifacts, mutate manifests/tensors/vocabulary/source-register rights, inspect
raw media, run Brev lifecycle/remote/sync/copy/exec commands, export, promote,
activate browser recognition, broaden labels, or expand claims.

This is the final no-training contract-repair slice before the loop must choose
between a bounded no-training diagnostic eval rerun, strategy escalation, or a
human approval stop.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3GW evidence:
   - [`docs/validation/return-to-form-m3gw-reduced4-data-split-zero-recall-diagnosis-no-training-v1.json`](../validation/return-to-form-m3gw-reduced4-data-split-zero-recall-diagnosis-no-training-v1.json)
   - [`docs/session-logs/661-mission-3gw-reduced4-data-split-zero-recall-diagnosis-no-training.md`](../session-logs/661-mission-3gw-reduced4-data-split-zero-recall-diagnosis-no-training.md)
5. M3GU/M3GV evidence:
   - [`docs/validation/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-v1.json`](../validation/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-v1.json)
   - [`docs/validation/return-to-form-m3gv-reduced4-smoke-metric-triage-no-brev-v1.json`](../validation/return-to-form-m3gv-reduced4-smoke-metric-triage-no-brev-v1.json)
   - ignored `output/m3gu-reduced4-local-training-smoke/training-provenance.json`, if present locally
   - ignored `output/m3gu-reduced4-local-training-smoke/validation-report.json`, if present locally
   - ignored `output/m3gu-reduced4-local-training-smoke/prediction-sidecar.json`, if present locally
6. M3GQ reduced4 manifests:
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/train.json`
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/validation.json`
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/test.json`
7. Evaluator, training, and audit contract surfaces:
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - relevant `scripts/audit_*.mjs` or `scripts/audit_*.py` surfaces when they validate sidecars or receipts
8. Fail-closed claim and source surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Required Slice

Complete exactly one diagnostic-contract repair.

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3gw-reduced4-data-split-zero-recall-diagnosis-no-training-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-v1.json >/dev/null
python3 -m json.tool data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/train.json >/dev/null
python3 -m json.tool data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/validation.json >/dev/null
python3 -m json.tool data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/test.json >/dev/null
brev ls --json
git diff --check
```

2. Inspect the existing train/evaluate/report scripts that produced the M3GU
   sidecar/report. Choose the smallest repair that makes the next run answer at
   least one currently unknown failure mode:

   - per-example logits or richer probability-distribution diagnostics;
   - top-k labels, score margin, entropy, true-label probability, and confidence calibration fields;
   - manifest row linkage for source record, signer, split, tensor hash, crop
     config, crop regions, and any session/capture field if present;
   - summary diagnostics for prediction collapse, no-predicted-label classes,
     zero-recall classes, and low-margin/near-uniform predictions;
   - crop/frame-quality or region-stat hooks when already available from tensors
     or manifest metadata without raw media inspection;
   - a manifest diagnostic helper that records missing `session_id` /
     `source_session` fields and prevents future receipts from treating session
     drift as proven when metadata is absent.

3. Keep the repair future-facing. You may add tests, fixtures, schema docs, and
   dry-run/compile checks, but do not regenerate M3GU outputs or run the
   evaluator on existing checkpoints.

4. Write the tracked receipt:

`docs/validation/return-to-form-m3gx-reduced4-manifest-metadata-or-sidecar-diagnostic-repair-no-training-v1.json`

The receipt must include:

- current commit and active prompt;
- files changed;
- commands run and exact exit status;
- the diagnostic gap selected from M3GW;
- the code/helper/doc changes made;
- tests or dry-run checks proving the new contract path is syntactically valid;
- Brev read-only/default-off state;
- claim-surface proof that fail-closed state is unchanged;
- forbidden-action proof;
- exactly one next action.

5. Write the session log:

`docs/session-logs/663-mission-3gx-reduced4-manifest-metadata-or-sidecar-diagnostic-repair-no-training.md`

6. Select exactly one next action:

- `continue_m3gy_reduced4_diagnostic_eval_rerun_no_training_no_brev`
- `escalate_openai_or_gpt_pro_strategy_with_m3gq_to_m3gx_evidence`
- `stop_for_human_source_media_compute_or_claim_review`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3GX.
2. Baseline checks pass or exact blockers are recorded.
3. Exactly one diagnostic-contract repair is implemented and scoped to future
   metadata/sidecar/report evidence.
4. The repair directly addresses an M3GW limitation: absent session/capture
   metadata, insufficient sidecar logits/probabilities/margins/entropy, weak
   manifest linkage, or missing collapse diagnostics.
5. No training/fitting, evaluator rerun, output regeneration, Brev lifecycle/
   remote/sync/copy/exec/spend, raw media inspection, source import, source
   rights mutation, manifest/tensor/vocabulary mutation, export, promotion,
   browser activation, final-gate change, claim expansion, or pretrained
   shortcut occurs.
6. A tracked M3GX receipt and numbered session log exist.
7. Claim surfaces remain fail-closed and unpromoted.
8. Exactly one next action is selected.

## Boundaries

- Local/no-remote/no-Brev/no-training only.
- Implementation changes are allowed only for diagnostic contract repair.
- Existing ignored output JSON may be read but not regenerated, rewritten,
  moved, copied, exported, or promoted.
- Do not inspect raw learner media, import new datasets, broaden labels, mutate
  source-register rights, or change product/browser claim surfaces.
- Do not push, amend, use `--no-verify`, or `git add -A`.

## Observer Guidance

- CONTINUE if the executor implements one scoped diagnostic-contract repair,
  validates it without training/evaluation regeneration, writes the receipt/log,
  keeps claims fail-closed, keeps Brev read-only/default-off, and selects one
  bounded next action.
- NUDGE if the repair is too vague to make the next compute attempt falsifiable,
  misses M3GW's limitations, lacks validation, omits forbidden-action proof, or
  omits exactly one next action.
- REDIRECT if the executor trains, reruns evaluation, regenerates ignored
  outputs, mutates manifests/tensors/vocabulary/source rights, inspects raw
  media, uses Brev lifecycle/remote commands, exports, promotes, activates
  browser recognition, expands claims, or implements unrelated model/product
  changes.
- STOP if the next action requires human budget/source/privacy/claim approval
  and the prompt does not contain explicit bounded authorization.
- ESCALATE if the executor proposes another training-style retry after the
  repair without a current strategy memo or without a concrete compute packet.
  Also ESCALATE if M3GX proves local diagnostic-contract repair is exhausted
  but the next proposal changes architecture, input strategy, detector strategy,
  or training approach.

## Progress Ledger

Current state: M3GW found balanced visible reduced4 counts and split-disjoint
signers/source records, but predictions collapsed to `sad`/`uncle`; the sidecar
has per-label probabilities but lacks logits, stronger probability-distribution
summaries, region/crop/frame-quality diagnostics, and session/capture fields.

Completed: M3GQ reduced4 manifests; M3GR local input/train-fit preflight; M3GS
triage; M3GT smoke contract; M3GU guarded local smoke/eval; M3GV metric triage;
M3GW zero-recall/data-split diagnosis.

Evidence: M3GW receipt/log, M3GU/M3GV receipts, M3GQ manifests, existing ignored
M3GU output JSON if present, fail-closed claim surfaces, source register, and
read-only Brev state.

Remaining: repair the diagnostic evidence path so the next no-training
diagnostic eval rerun has a concrete output contract and kill/route conditions.

Blockers: do not continue to Brev, broad training, source/media, export,
promotion, or claims until a later prompt records a bounded approved route.

Next step: implement one M3GX diagnostic-contract repair, validate it locally,
write the receipt/session log, and choose one next action.
