# Return-To-Form Region-Grid TCN M3DQ Metric Triage No Remote Goal Loop Prompt

Mission 3DV prompt for the Codex executor after Mission 3DU completed the
approved bounded M3DQ Brev smoke, produced weak metric evidence, and selected
`continue_m3dq_metric_triage_no_remote`.

This prompt is active only while `GOAL.md` points at it. Read `GOAL.md` first,
then `docs/model/return-to-form-plan.md`.

## Mission

Complete one local/no-spend, no-training metric triage over the copied M3DU
artifacts and tracked M3DU receipt. The purpose is to classify what the weak
M3DQ result proves, what it does not prove, and which single next action is
honest before any more training, Brev spend, export, product activation, or
claim change.

M3DU evidence to preserve:

- training completed on CUDA for 12 epochs with random initialization;
- checkpoint and training provenance were written remotely and copied back;
- evaluation wrote `validation-report.json` and `prediction-sidecar.json`, then
  exited non-zero because target gates did not pass;
- validation top-1 was `0.2593`, validation macro-F1 was `0.1536`, test top-1
  was `0.1786`, test macro-F1 was `0.0978`, selected threshold was `0.28`, and
  test false-pass rate was `0.0357`;
- browser product status remains fail-closed and not trained;
- Brev default-off commands returned, but `brev ls --json` still reports the
  existing worker `asl-pilot-rawframe-001` / `2hl1hytty` as `RUNNING`, `READY`,
  and `HEALTHY`.

## Inputs

Use these as source evidence:

1. Mission 3DU receipt:
   [`docs/validation/return-to-form-region-grid-tcn-m3dq-brev-smoke-after-input-contract-fix-v1.json`](../validation/return-to-form-region-grid-tcn-m3dq-brev-smoke-after-input-contract-fix-v1.json).
2. Mission 3DU session log:
   [`docs/session-logs/482-mission-3du-region-grid-tcn-m3dq-brev-smoke-after-input-contract-fix.md`](../session-logs/482-mission-3du-region-grid-tcn-m3dq-brev-smoke-after-input-contract-fix.md).
3. Copied ignored output artifacts, if present:
   - `output/m3dq-high-signal-region-grid-tcn-brev/training-provenance.json`
   - `output/m3dq-high-signal-region-grid-tcn-brev/validation-report.json`
   - `output/m3dq-high-signal-region-grid-tcn-brev/prediction-sidecar.json`
   - `output/m3dq-high-signal-region-grid-tcn-brev/model_state.pt`
4. Current high-signal region-grid manifests:
   - [`data/manifests/lesson/high-signal-region-grid/train.json`](../../data/manifests/lesson/high-signal-region-grid/train.json)
   - [`data/manifests/lesson/high-signal-region-grid/validation.json`](../../data/manifests/lesson/high-signal-region-grid/validation.json)
   - [`data/manifests/lesson/high-signal-region-grid/test.json`](../../data/manifests/lesson/high-signal-region-grid/test.json)

## Required Slice

Run one local triage pass:

1. Verify repo state and no-pretrained/source boundaries.
2. Validate the M3DU receipt and any copied JSON artifacts that exist.
3. Record the copied artifact paths and hashes without force-adding ignored
   `output/` files.
4. Parse the M3DU training/evaluation summaries, including per-label or
   confusion evidence when available in the copied reports.
5. Compare metrics to target gates, chance/constant baselines if available in
   existing artifacts, and the previous M3AW/M3AX/M3AH/M3DU evidence.
6. Classify the failure as specifically as the evidence supports, separating:
   train movement, held-out generalization, negative/false-pass behavior,
   input-contract validity, data/split/source concerns, and product readiness.
7. Decide whether the next useful action is local artifact/error analysis,
   local data/input repair, strategy escalation, reduced-claim/product
   packaging, a future Brev approval gate, or human cost-control review.
8. Write the tracked receipt and numbered session log.
9. Commit only scoped receipt/session-log/plan documentation if changed. Do not
   push.

Required local checks:

```sh
git status --short --branch
git log -10 --oneline
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-region-grid-tcn-m3dq-brev-smoke-after-input-contract-fix-v1.json >/dev/null
python3 -m json.tool output/m3dq-high-signal-region-grid-tcn-brev/training-provenance.json >/dev/null
python3 -m json.tool output/m3dq-high-signal-region-grid-tcn-brev/validation-report.json >/dev/null
python3 -m json.tool output/m3dq-high-signal-region-grid-tcn-brev/prediction-sidecar.json >/dev/null
git diff --check
```

If any copied output JSON is missing, record the missing artifact and continue
from the tracked M3DU receipt instead of rerunning Brev copyback or evaluation.

Read-only Brev status check:

```sh
brev ls --json
```

Do not run `brev exec`, `brev start`, `brev stop`, `brev stop --all`,
`brev copy`, `bash scripts/brev_sync_repo.sh`, or any remote lifecycle command
in this mission. M3DU already attempted default-off and recorded the provider
as still `RUNNING`; if that cost-control state blocks safe continuation, select
`stop_for_human_cost_control_review`.

## Boundaries

- No Brev spend, remote exec, sync, copyback, start, stop, reset, delete, or
  duplicate worker action.
- No training, fitting, backward pass, optimizer step, checkpoint creation,
  evaluation rerun, export, model-card promotion, browser trained activation,
  threshold promotion, final readiness claim, or positive ASL-correctness claim.
- No broad labels, source-register change, source import, manifest/tensor/
  vocabulary mutation, crop-config mutation, pseudo-label generation,
  pretrained detector, landmark, backbone, embedding, or model dependency.
- No raw learner video upload, final-gate weakening, push, amend, or no-verify.
- Do not hand-edit promoted browser model cards or claim matrices.

## Receipt

Write:

`docs/validation/return-to-form-region-grid-tcn-m3dq-metric-triage-no-remote-v1.json`

The receipt must include local checks, artifact presence/hashes, M3DU metric
summary, per-label/error evidence inspected, gate comparison, failure
classification, Brev read-only provider state, `pretrained_components: []`,
negative authorizations, claim boundary, changed files, blockers, and exactly
one next action.

Allowed next actions:

- `continue_m3dq_local_error_analysis_no_remote` if the copied reports expose a
  concrete local artifact/error-analysis slice that does not require training.
- `continue_m3dq_data_or_input_contract_repair_no_remote` if a specific
  local data/input contract issue is evident and can be repaired without
  training or Brev.
- `escalate_strategy_research_after_m3dq_weak_metrics` if the triage would
  otherwise change architecture, input representation, training budget, or
  training strategy after repeated weak learning evidence.
- `request_brev_training_approval_after_m3dq_metric_triage` only if a future
  remote command is justified and needs fresh human approval before execution.
- `continue_product_or_reduced_claim_after_m3dq_metric_triage` if the evidence
  says this recognizer route is not promising enough for another immediate
  technical repair and product/reduced-claim work is the honest next slice.
- `stop_for_human_cost_control_review` if the Brev provider/cost-control state
  blocks safe continuation.

## Session Log

Write:

`docs/session-logs/484-mission-3dv-region-grid-tcn-m3dq-metric-triage-no-remote.md`

The log must include commands, evidence inspected, artifact locations/hashes,
metric classification, Brev read-only state, blockers, changed files, and
exactly one next action.
