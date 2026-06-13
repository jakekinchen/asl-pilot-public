# Return-To-Form M3HG Bounded PopSign25 Compute Receipt No Training Goal Loop Prompt

Mission 3HG prompt for the Codex executor after M3HF completed the PopSign 25
input/training-contract preflight and selected
`continue_m3hg_bounded_popsign25_compute_receipt_no_training`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Create one local/no-remote/no-Brev/no-training compute receipt that turns the
M3HF contract preflight into a precise, reviewable future PopSign 25 compute
plan. This mission must not train, fit, evaluate, rerun, start/stop Brev,
execute remote commands, sync or copy remote files, export, promote, activate
browser recognition, change implementation code, mutate manifests/tensors/
vocabulary, inspect raw media, import source/media, or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3HF evidence:
   - [`docs/validation/return-to-form-m3hf-popsign25-input-training-contract-preflight-no-remote-v1.json`](../validation/return-to-form-m3hf-popsign25-input-training-contract-preflight-no-remote-v1.json)
   - [`docs/session-logs/679-mission-3hf-popsign25-input-training-contract-preflight-no-remote.md`](../session-logs/679-mission-3hf-popsign25-input-training-contract-preflight-no-remote.md)
5. M3HE/M3HD/M3HC evidence:
   - [`docs/validation/return-to-form-m3he-popsign25-data-split-label-sampler-diagnosis-no-training-v1.json`](../validation/return-to-form-m3he-popsign25-data-split-label-sampler-diagnosis-no-training-v1.json)
   - [`docs/validation/return-to-form-m3hd-popsign25-metric-triage-no-remote-v1.json`](../validation/return-to-form-m3hd-popsign25-metric-triage-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3hc-bounded-popsign-brev-training-or-eval-v1.json`](../validation/return-to-form-m3hc-bounded-popsign-brev-training-or-eval-v1.json)
   - [`docs/session-logs/677-mission-3he-popsign25-data-split-label-sampler-diagnosis-no-training.md`](../session-logs/677-mission-3he-popsign25-data-split-label-sampler-diagnosis-no-training.md)
   - [`docs/session-logs/675-mission-3hd-popsign25-metric-triage-no-remote.md`](../session-logs/675-mission-3hd-popsign25-metric-triage-no-remote.md)
   - [`docs/session-logs/673-mission-3hc-bounded-popsign-brev-training-or-eval.md`](../session-logs/673-mission-3hc-bounded-popsign-brev-training-or-eval.md)
6. Existing ignored M3HC copied output JSON only if present locally:
   - `output/m3hb-popsign25-bounded-brev-contract/training-provenance.json`
   - `output/m3hb-popsign25-bounded-brev-contract/validation-report.json`
   - `output/m3hb-popsign25-bounded-brev-contract/prediction-sidecar.json`
7. PopSign 25 manifests:
   - `data/manifests/diagnostics/popsign-label-ladder/025-labels/train.json`
   - `data/manifests/diagnostics/popsign-label-ladder/025-labels/validation.json`
   - `data/manifests/diagnostics/popsign-label-ladder/025-labels/test.json`
8. Local training/evaluation contract surfaces needed to draft exact future
   commands, output namespace, command caps, metadata requirements, and
   teardown checks. Inspect read-only; do not patch implementation code.
9. Fail-closed claim surfaces:
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Required Slice

Complete exactly one no-training bounded compute receipt slice.

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
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
brev ls --json
brev search --stoppable --min-vram 40 --sort price --json
git diff --check
```

If `brev search` is unavailable or fails without spend, record the exact
failure and use the last successful `brev ls --json` plus the known worker
state only. Do not start a worker to answer a pricing question.

2. Re-read the M3HF receipt and existing copied M3HC JSON. Confirm the copied
   output directory is still ignored by Git. Do not regenerate, rewrite, move,
   promote, export, or delete any model artifact.

3. Draft a future compute receipt table covering:

   - exact hypothesis: capped raw-frame PopSign 25 exposure is the next
     testable limitation, while M3HC remains diagnostic failure evidence;
   - exact future output namespace, which must not overwrite M3HC output;
   - proposed future local dry-run, remote dry-run, training, evaluation,
     copyback, and teardown commands, but do not run them in M3HG;
   - command caps: maximum one remote dry-run, maximum one non-dry-run training
     command, maximum one evaluator command, and maximum one copied output
     directory unless the receipt selects a stop/research route instead;
   - worker choice, current read-only listed state, current listed price if
     available, maximum runtime, expected upper-bound spend, price guard,
     kill condition, and required default-off proof;
   - required pre-start checks: local dry-run, JSON receipt validity, claim
     surfaces unchanged, ignored output namespace absent or intentionally new,
     and no active training processes on the worker after start;
   - required command metadata: shuffle, sampler, `drop_last`, batch size,
     epochs, max batches or full exposure target, exact row exposure target,
     seed, threshold, architecture, input key, `preserve_region_axis` status,
     and train/validation/test manifest hashes;
   - expected metric signal that would distinguish "still unlearned
     near-uniform" from "exposure was the bottleneck";
   - artifact copyback, hash, receipt/log, and claim-surface proof expected
     from the future compute mission.

4. Interpret the compute receipt:

   - If the exact future command cannot be bounded, priced, killed, copied
     back, or default-off verified, select a stop or no-training repair route.
   - If the next useful step would change input strategy, architecture, target
     schema, source scope, vocabulary, or training budget beyond a bounded
     PopSign 25 exposure test, select research-guided strategy adjustment
     unless a current strategy memo already covers this exact PopSign 25
     evidence.
   - If the compute receipt is adequate but still needs explicit human budget
     approval for the exact future command, select
     `stop_for_human_compute_approval`.
   - If the compute receipt is adequate and current human approval plus the
     receipt's caps are sufficient under `GOAL.md`, select the future bounded
     compute route. Do not run compute in M3HG.
   - In all cases, state that M3HC remains diagnostic raw-frame evidence only,
     not held-out quality, Detector 0 authority, crop-normalized evidence,
     browser activation, export eligibility, product readiness, final-gate
     evidence, or a user-facing ASL correctness claim.

5. Write the tracked receipt:

`docs/validation/return-to-form-m3hg-bounded-popsign25-compute-receipt-no-training-v1.json`

The receipt must include:

- current commit and active prompt;
- files changed;
- commands run and exact exit status;
- Brev read-only/default-off inventory/search result;
- M3HF/M3HE/M3HD/M3HC evidence summary;
- proposed future command table and command caps;
- worker, price, runtime, spend cap, and kill-condition table;
- local dry-run, remote preflight, copyback, and teardown/default-off
  requirements for the future mission;
- expected metric signal and stop criteria;
- claim-surface proof that fail-closed state is unchanged;
- forbidden-action proof;
- exact approval status for any later Brev lifecycle/spend;
- exactly one next action.

6. Write the session log:

`docs/session-logs/681-mission-3hg-bounded-popsign25-compute-receipt-no-training.md`

7. Select exactly one next action:

- `continue_m3hh_bounded_popsign25_compute_or_stop_with_provider_blocker`
- `continue_m3hh_popsign25_command_or_receipt_metadata_repair_no_training`
- `continue_m3hh_research_guided_strategy_adjustment`
- `continue_m3hh_detector0_crop_normalized_contract`
- `continue_m3hh_interactive_fail_closed_product_hardening`
- `stop_for_human_compute_approval`
- `stop_for_human_review`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3HG.
2. Required baseline checks pass or exact blockers are recorded.
3. Existing M3HF/M3HE/M3HD/M3HC evidence is interpreted without rerunning
   training or evaluation.
4. The receipt records exact future command caps, worker/price state, max
   runtime, spend cap, kill condition, copyback plan, default-off proof, and
   metadata requirements.
5. The receipt states whether the future bounded compute plan is adequately
   bounded, requires no-training repair/research first, or requires human
   compute approval before execution.
6. A tracked M3HG receipt and numbered session log exist.
7. Claim surfaces remain fail-closed and unpromoted.
8. No Brev lifecycle/remote/spend, training/fitting, evaluator rerun, export,
   browser activation, source/media work, final-gate change, implementation
   change, manifest/tensor/vocabulary mutation, claim expansion, or pretrained
   shortcut occurs.
9. Exactly one next action is selected.

## Boundaries

- Local/no-remote/no-Brev/no-training only.
- Existing approved local evidence only.
- Brev read-only inventory/search only; no `brev start`, `brev exec`,
  `brev copy`, `brev stop`, or remote sync unless the observer later chooses
  STOP and must apply cost-control policy.
- Do not inspect raw learner media, import new datasets, broaden labels, mutate
  source-register rights, patch implementation code, or change product/browser
  claim surfaces.
- Do not push, amend, use `--no-verify`, or `git add -A`.

## Observer Guidance

- CONTINUE if the executor creates the no-training compute receipt/log, keeps
  claims fail-closed, keeps Brev read-only/default-off, and selects one bounded
  next action.
- NUDGE if the receipt misses exact command caps, worker/price evidence,
  runtime/spend/kill-condition accounting, copyback/default-off plan,
  metadata requirements, approval status, forbidden-action proof,
  claim-surface proof, or exactly one next action.
- REDIRECT if the executor trains, reruns evaluation, changes implementation,
  mutates manifests/tensors/vocabulary, uses Brev lifecycle/remote commands,
  exports, promotes, activates browser recognition, imports source/media,
  expands claims, or treats M3HC/M3HG evidence as readiness.
- STOP if the selected next action requires exact human budget, source/privacy,
  claim, promotion, final-submission, Brev, or broad-scope approval.
- ESCALATE if the next proposal changes architecture, input strategy, target
  schema, source scope, vocabulary, training budget, or compute beyond the
  bounded PopSign 25 exposure-test receipt without a current strategy memo.

## Progress Ledger

Current state: M3HF completed input/training-contract preflight for the failed
M3HC PopSign 25 Brev run and selected this no-training compute receipt route.

Completed: M3HB PopSign 25 command/output contract; M3HC bounded Brev run,
copyback, receipt/log, and default-off proof; M3HD metric triage; M3HE split,
label, class-index, true/predicted, sampler, and train/eval distribution
diagnosis; M3HF input, command, sampler, report, and sidecar contract
preflight.

Evidence: M3HF receipt/log, M3HE/M3HD/M3HC receipts/logs, ignored copied M3HC
output JSON if present, PopSign 25 manifests, local training/evaluation
contract surfaces, fail-closed claim surfaces, and read-only Brev state/search.

Remaining: decide whether a future PopSign 25 compute attempt is adequately
bounded and approval-ready, or whether repair, research, Detector 0 contract,
fail-closed product hardening, human compute approval, or human review is the
next honest action.

Blockers: do not run Brev lifecycle, training, or evaluation in M3HG. Do not
continue to paid compute unless a later prompt includes an exact compute
receipt, max-spend/kill-condition envelope, approval status, and teardown proof.

Next step: write the M3HG bounded PopSign 25 compute receipt and session log.
