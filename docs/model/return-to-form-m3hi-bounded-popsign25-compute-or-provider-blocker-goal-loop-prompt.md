# Return-To-Form M3HI Bounded PopSign25 Compute Or Provider Blocker Goal Loop Prompt

Mission 3HI prompt for the Codex executor after M3HH repaired the PopSign 25
full-exposure command contract and selected
`continue_m3hi_bounded_popsign25_compute_or_stop_with_provider_blocker`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run exactly one bounded PopSign 25 full-exposure Brev compute attempt under the
M3HG envelope and M3HH command contract, or stop with a concrete provider/
pre-start blocker before spend. This mission tests whether M3HC's capped
`64/625` train-row exposure was the next limiting factor. It is diagnostic
raw-frame evidence only, not Detector 0 authority, crop-normalized evidence,
browser recognition, export eligibility, product readiness, final-gate
evidence, or an ASL correctness claim.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3HH command-contract evidence:
   - [`docs/validation/return-to-form-m3hh-popsign25-command-or-receipt-metadata-repair-no-training-v1.json`](../validation/return-to-form-m3hh-popsign25-command-or-receipt-metadata-repair-no-training-v1.json)
   - [`docs/session-logs/683-mission-3hh-popsign25-command-or-receipt-metadata-repair-no-training.md`](../session-logs/683-mission-3hh-popsign25-command-or-receipt-metadata-repair-no-training.md)
5. M3HG bounded compute receipt:
   - [`docs/validation/return-to-form-m3hg-bounded-popsign25-compute-receipt-no-training-v1.json`](../validation/return-to-form-m3hg-bounded-popsign25-compute-receipt-no-training-v1.json)
   - [`docs/session-logs/681-mission-3hg-bounded-popsign25-compute-receipt-no-training.md`](../session-logs/681-mission-3hg-bounded-popsign25-compute-receipt-no-training.md)
6. M3HF/M3HE/M3HD/M3HC evidence:
   - [`docs/validation/return-to-form-m3hf-popsign25-input-training-contract-preflight-no-remote-v1.json`](../validation/return-to-form-m3hf-popsign25-input-training-contract-preflight-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3he-popsign25-data-split-label-sampler-diagnosis-no-training-v1.json`](../validation/return-to-form-m3he-popsign25-data-split-label-sampler-diagnosis-no-training-v1.json)
   - [`docs/validation/return-to-form-m3hd-popsign25-metric-triage-no-remote-v1.json`](../validation/return-to-form-m3hd-popsign25-metric-triage-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3hc-bounded-popsign-brev-training-or-eval-v1.json`](../validation/return-to-form-m3hc-bounded-popsign-brev-training-or-eval-v1.json)
7. PopSign 25 manifests:
   - `data/manifests/diagnostics/popsign-label-ladder/025-labels/train.json`
   - `data/manifests/diagnostics/popsign-label-ladder/025-labels/validation.json`
   - `data/manifests/diagnostics/popsign-label-ladder/025-labels/test.json`
8. Local command and remote-sync surfaces:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - [`scripts/brev_sync_repo.sh`](../../scripts/brev_sync_repo.sh)
   - [`scripts/audit_m3hh_popsign25_command_contract.mjs`](../../scripts/audit_m3hh_popsign25_command_contract.mjs)
9. Fail-closed claim surfaces:
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Authorization And Compute Envelope

The supervising user already approved unblocking Brev usage and using compute
intentionally. This prompt carries that approval only for the exact bounded
M3HI route below:

- retained worker: `asl-pilot-m3eh-l40s-001` / `3d58wpy9o`;
- GPU type: L40S, `l40s-48gb.1x`;
- price guard: do not start if the cheapest eligible stoppable >=40GB GPU is
  above `2.00` USD/hour or cannot be verified read-only;
- max wall-clock from start to verified stop: `60` minutes;
- expected upper-bound spend at the last recorded price: `1.74` USD;
- hard spend cap: `2.00` USD;
- allowed remote work: one start of the retained worker, one repo/data sync,
  one remote output-absence/process check, one remote dry-run, one non-dry-run
  training command, one evaluator command, one output-directory copyback, and
  teardown/default-off verification;
- replacement workers: `0`;
- exports/promotions/browser activation: `0`.

If any pre-start or provider condition fails, do not start or continue paid
work. Write the M3HI receipt/log with the exact blocker and select a stop
action.

## Required Slice

Complete exactly one bounded compute-or-provider-blocker slice.

1. Verify live state and baseline checks before any Brev lifecycle command:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3hh-popsign25-command-or-receipt-metadata-repair-no-training-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hg-bounded-popsign25-compute-receipt-no-training-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hf-popsign25-input-training-contract-preflight-no-remote-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3he-popsign25-data-split-label-sampler-diagnosis-no-training-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hd-popsign25-metric-triage-no-remote-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hc-bounded-popsign-brev-training-or-eval-v1.json >/dev/null
python3 -m json.tool data/manifests/diagnostics/popsign-label-ladder/025-labels/train.json >/dev/null
python3 -m json.tool data/manifests/diagnostics/popsign-label-ladder/025-labels/validation.json >/dev/null
python3 -m json.tool data/manifests/diagnostics/popsign-label-ladder/025-labels/test.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
python3 -m json.tool web/public/model/claim-matrix.json >/dev/null
python3 -m json.tool docs/validation/final-claim-matrix.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
bash -n scripts/brev_sync_repo.sh
node scripts/audit_m3hh_popsign25_command_contract.mjs
test ! -e output/m3hh-popsign25-full-exposure-bounded-brev-contract
brev ls --json
brev search --stoppable --min-vram 40 --sort price --json
git diff --check
```

2. Reconcile the pre-start state with the receipts:

   - M3HH local dry-run proof must still pass.
   - The future local output namespace must be absent.
   - The retained worker must be `STOPPED` or otherwise safe to start; if it is
     `RUNNING`, inspect only for active training/process state and stop with a
     blocker unless the state is clearly from this M3HI attempt.
   - The price guard must be under `2.00` USD/hour.
   - Claim surfaces must still be fail-closed and unchanged.

3. If pre-start checks pass, run only this bounded remote sequence:

```sh
brev start asl-pilot-m3eh-l40s-001
bash scripts/brev_sync_repo.sh asl-pilot-m3eh-l40s-001
timeout 300s brev exec asl-pilot-m3eh-l40s-001 "cd $HOME/asl-pilot && test ! -e output/m3hh-popsign25-full-exposure-bounded-brev-contract && echo output_absent"
timeout 300s brev exec asl-pilot-m3eh-l40s-001 "ps -eo pid,etime,pcpu,pmem,args | egrep 'python|torch|train|screen|tmux' | grep -v egrep || true"
timeout 900s brev exec asl-pilot-m3eh-l40s-001 "cd $HOME/asl-pilot && PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/train.json --validation-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/validation.json --test-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/test.json --output-dir output/m3hh-popsign25-full-exposure-bounded-brev-contract --model-id m3hh-popsign25-full-exposure-bounded-brev-contract --seed 20260529 --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 0 --epochs 1 --batch-size 4 --learning-rate 0.001 --training-augmentation none --checkpoint-selection best_validation --max-train-batches 157 --max-validation-batches 157 --popsign-label-ladder-training-smoke --dry-run"
timeout 3600s brev exec asl-pilot-m3eh-l40s-001 "cd $HOME/asl-pilot && timeout 2700s .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/train.json --validation-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/validation.json --test-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/test.json --output-dir output/m3hh-popsign25-full-exposure-bounded-brev-contract --model-id m3hh-popsign25-full-exposure-bounded-brev-contract --seed 20260529 --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 0 --epochs 1 --batch-size 4 --learning-rate 0.001 --training-augmentation none --checkpoint-selection best_validation --max-train-batches 157 --max-validation-batches 157 --popsign-label-ladder-training-smoke"
timeout 1800s brev exec asl-pilot-m3eh-l40s-001 "cd $HOME/asl-pilot && .venv/bin/python scripts/evaluate_rawframe_model.py --checkpoint output/m3hh-popsign25-full-exposure-bounded-brev-contract/model_state.pt --training-provenance output/m3hh-popsign25-full-exposure-bounded-brev-contract/training-provenance.json --train-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/train.json --validation-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/validation.json --test-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/test.json --output-report output/m3hh-popsign25-full-exposure-bounded-brev-contract/validation-report.json --calibrated-provenance output/m3hh-popsign25-full-exposure-bounded-brev-contract/calibrated-provenance.json --prediction-sidecar output/m3hh-popsign25-full-exposure-bounded-brev-contract/prediction-sidecar.json --batch-size 4 --num-workers 0 --popsign-label-ladder-training-smoke"
brev copy asl-pilot-m3eh-l40s-001:/home/ubuntu/asl-pilot/output/m3hh-popsign25-full-exposure-bounded-brev-contract output/
brev stop asl-pilot-m3eh-l40s-001
sleep 20
brev ls --json
```

If any step fails after start, stop the worker, verify default-off state, and
record the failure in the receipt/log. Do not retry the non-dry-run training
command, do not run a second evaluator command, and do not create or use a
replacement worker.

4. After copyback or blocker, validate and interpret:

```sh
python3 -m json.tool output/m3hh-popsign25-full-exposure-bounded-brev-contract/training-provenance.json >/dev/null
python3 -m json.tool output/m3hh-popsign25-full-exposure-bounded-brev-contract/validation-report.json >/dev/null
python3 -m json.tool output/m3hh-popsign25-full-exposure-bounded-brev-contract/prediction-sidecar.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
python3 -m json.tool web/public/model/claim-matrix.json >/dev/null
python3 -m json.tool docs/validation/final-claim-matrix.json >/dev/null
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
git diff --check
```

If no output was copied because of a pre-start/provider blocker, validate the
tracked receipt/log and claim surfaces instead.

5. Write the tracked receipt:

`docs/validation/return-to-form-m3hi-bounded-popsign25-compute-or-provider-blocker-v1.json`

The receipt must include:

- current commit and active prompt;
- files changed;
- commands run with exact exit statuses;
- pre-start state, price guard result, and approval/cap proof;
- remote start/sync/dry-run/training/evaluation/copyback/teardown proof, or
  exact provider/pre-start blocker;
- wall-clock estimate and whether the `60` minute / `2.00` USD caps were
  respected;
- hashes for copied output files when copyback succeeds;
- training provenance `data_loading_contract` proof that all `625` train row
  indexes were visited under the cap;
- validation/test metrics, predicted-label distribution, threshold, entropy/
  margin fields when available, and comparison to M3HC;
- Brev final default-off proof;
- fail-closed claim-surface proof;
- forbidden-action proof;
- exactly one next action.

6. Write the session log:

`docs/session-logs/685-mission-3hi-bounded-popsign25-compute-or-provider-blocker.md`

7. Select exactly one next action:

- `continue_m3hj_popsign25_full_exposure_metric_triage_no_remote`
- `continue_m3hj_research_guided_strategy_adjustment`
- `continue_m3hj_detector0_crop_normalized_contract`
- `continue_m3hj_interactive_fail_closed_product_hardening`
- `stop_for_provider_blocker`
- `stop_for_human_review`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3HI.
2. Baseline checks pass or exact pre-start/provider blockers are recorded.
3. The M3HG/M3HH compute envelope is followed exactly, including retained
   worker, price guard, runtime/spend caps, command caps, copyback cap, and
   default-off proof.
4. Either one remote dry-run, one non-dry-run training command, one evaluator
   command, and one copyback complete, or the mission stops before/after start
   with a concrete blocker and verified default-off state.
5. Copied M3HI output, if present, is exactly
   `output/m3hh-popsign25-full-exposure-bounded-brev-contract`.
6. The receipt records whether full train-row exposure changed the M3HC
   all-`uncle`/chance-level result, without claiming readiness.
7. Claim surfaces remain fail-closed and unpromoted.
8. No extra Brev worker, extra training run, evaluator rerun, ignored-output
   rewrite outside the single output namespace, raw-media inspection, source/
   manifest/tensor/vocabulary mutation, export, browser activation, final-gate
   change, claim expansion, push, amend, or pretrained shortcut occurs.
9. A tracked M3HI receipt and numbered session log exist.
10. Exactly one next action is selected.

## Boundaries

- Brev lifecycle, sync, exec, copy, and stop are allowed only for the exact
  bounded M3HI sequence above.
- Do not use `git add -A`, `git push`, `git commit --amend`, or `--no-verify`.
- Do not inspect raw learner media, import new datasets, broaden labels, mutate
  source-register rights, modify manifests/tensors/vocabulary, export, promote,
  activate browser recognition, or edit model-card/claim surfaces.
- Do not continue training-style retries if full exposure still collapses.
  Choose no-remote triage, research-guided strategy adjustment, Detector 0/
  crop-normalized contract work, product hardening, or stop.

## Observer Guidance

- CONTINUE if the executor runs the exact bounded compute sequence or records a
  provider blocker, verifies default-off state, writes the receipt/log, keeps
  claims fail-closed, and selects one bounded next action.
- NUDGE if evidence is incomplete but the command sequence and boundaries were
  otherwise respected.
- REDIRECT if the executor changes implementation, mutates source/manifests/
  tensors/vocabulary, exceeds command caps, uses a replacement worker, skips
  default-off verification, promotes/exports/activates browser recognition, or
  treats diagnostic raw-frame metrics as readiness.
- STOP if spend/control state cannot be verified, a worker remains running
  after stop attempts, or the next action requires human budget/source/privacy/
  claim/promotion/final-submission approval.
- ESCALATE if the executor proposes architecture, input strategy, target schema,
  source scope, vocabulary, or training budget changes beyond this bounded
  exposure test without a current strategy memo.

## Progress Ledger

Current state: M3HH repaired the command contract. The local M3HH dry-run is
valid, `output/m3hh-popsign25-full-exposure-bounded-brev-contract` remains
absent, and the retained L40S worker is stopped/default-off.

Completed: M3HB PopSign 25 command/output contract; M3HC bounded Brev run,
copyback, receipt/log, and default-off proof; M3HD metric triage; M3HE split/
label/sampler diagnosis; M3HF input/training-contract preflight; M3HG bounded
compute receipt; M3HH command/metadata repair.

Evidence: M3HH receipt/log, M3HG receipt/log, M3HF/M3HE/M3HD/M3HC receipts/logs,
PopSign 25 manifests, local M3HH command audit, fail-closed claim surfaces, and
read-only Brev inventory/search.

Remaining: perform the exact bounded full-exposure compute attempt or stop with
a provider/pre-start blocker, then classify the result without promotion.

Blockers: no replacement worker, no extra spend, no second training run, no
promotion, no browser activation, no source/media work, no claim expansion.

Next step: run M3HI baseline/pre-start checks and either execute the bounded
remote sequence once or write a provider-blocker receipt/log.
