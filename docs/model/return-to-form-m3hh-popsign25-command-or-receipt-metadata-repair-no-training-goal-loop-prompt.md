# Return-To-Form M3HH PopSign25 Command Or Receipt Metadata Repair No Training Goal Loop Prompt

Mission 3HH prompt for the Codex executor after M3HG completed the bounded
PopSign 25 compute receipt and selected
`continue_m3hh_popsign25_command_or_receipt_metadata_repair_no_training`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Implement or document one smallest useful local/no-remote/no-Brev/no-training
command or metadata repair that makes the future PopSign 25 full-exposure
compute attempt falsifiable and non-overwriting.

M3HG found that the future compute envelope is bounded, priced, and
kill-conditioned, but not command-valid today. The current
`--popsign-label-ladder-training-smoke` surface is capped at `16` train batches,
which repeats the M3HC `64/625` exposure limit, and it does not allow a fresh
`output/m3hh-popsign25-full-exposure-bounded-brev-contract` namespace.

This mission may edit training/evaluation command guardrails, metadata capture,
receipt/audit helpers, docs, and the M3HH receipt/session log only as needed to
make the future full-exposure command reviewable. It must not train, fit, rerun
evaluation, start/stop Brev, execute remote commands, sync or copy remote files,
regenerate or rewrite ignored outputs, inspect raw media, mutate manifests/
tensors/vocabulary/source rights, export, promote, activate browser recognition,
change final gates, expand claims, or add pretrained dependencies.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3HG evidence:
   - [`docs/validation/return-to-form-m3hg-bounded-popsign25-compute-receipt-no-training-v1.json`](../validation/return-to-form-m3hg-bounded-popsign25-compute-receipt-no-training-v1.json)
   - [`docs/session-logs/681-mission-3hg-bounded-popsign25-compute-receipt-no-training.md`](../session-logs/681-mission-3hg-bounded-popsign25-compute-receipt-no-training.md)
5. M3HF/M3HE/M3HD/M3HC evidence:
   - [`docs/validation/return-to-form-m3hf-popsign25-input-training-contract-preflight-no-remote-v1.json`](../validation/return-to-form-m3hf-popsign25-input-training-contract-preflight-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3he-popsign25-data-split-label-sampler-diagnosis-no-training-v1.json`](../validation/return-to-form-m3he-popsign25-data-split-label-sampler-diagnosis-no-training-v1.json)
   - [`docs/validation/return-to-form-m3hd-popsign25-metric-triage-no-remote-v1.json`](../validation/return-to-form-m3hd-popsign25-metric-triage-no-remote-v1.json)
   - [`docs/validation/return-to-form-m3hc-bounded-popsign-brev-training-or-eval-v1.json`](../validation/return-to-form-m3hc-bounded-popsign-brev-training-or-eval-v1.json)
6. Existing ignored M3HC copied output JSON only if present locally:
   - `output/m3hb-popsign25-bounded-brev-contract/training-provenance.json`
   - `output/m3hb-popsign25-bounded-brev-contract/validation-report.json`
   - `output/m3hb-popsign25-bounded-brev-contract/prediction-sidecar.json`
7. PopSign 25 manifests:
   - `data/manifests/diagnostics/popsign-label-ladder/025-labels/train.json`
   - `data/manifests/diagnostics/popsign-label-ladder/025-labels/validation.json`
   - `data/manifests/diagnostics/popsign-label-ladder/025-labels/test.json`
8. Local command/metadata surfaces:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - relevant `scripts/audit_*.mjs` or `scripts/audit_*.py` surfaces when they
     validate receipts, model-card JSON, or no-pretrained artifacts.
9. Fail-closed claim surfaces:
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Required Slice

Complete exactly one no-training command or metadata repair.

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
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
brev ls --json
git diff --check
```

2. Re-read the M3HG receipt and identify the smallest repair that answers the
   command-validity blocker without running training. Prefer a narrow change
   over a broad rewrite. The repair should address at least one of:

   - allowing a fresh M3HH output namespace without permitting overwrite of
     `output/m3hb-popsign25-bounded-brev-contract`;
   - allowing the predeclared PopSign 25 exposure-test cap of `157` train
     batches at batch size `4`, one epoch, `drop_last=false`, and `625` train
     row visits without weakening unrelated smoke guardrails;
   - recording metadata required by M3HG but missing from the current command
     surface, such as shuffle/sampler/drop_last, exact consumed train row
     indexes or row-visit counts, manifest hashes, input key, architecture,
     seed, threshold, and preserve-region-axis status;
   - documenting, with command proof, that a code change is unnecessary because
     the future command can already pass a local dry-run and record the required
     metadata.

3. Keep the repair future-facing. You may run local dry-run or compile checks
   that do not train, fit, evaluate, decode raw media, create model artifacts,
   or mutate ignored outputs. If a local dry-run is used, it must be the future
   M3HH command with `--dry-run` and the fresh M3HH output namespace. Do not run
   the non-dry-run training command or evaluator.

4. Preserve the compute envelope from M3HG. Do not change worker choice,
   maximum runtime, max spend, price guard, command caps, copyback/default-off
   requirements, or approval status unless the repair proves one of those fields
   invalid and records the exact blocker.

5. Write the tracked receipt:

`docs/validation/return-to-form-m3hh-popsign25-command-or-receipt-metadata-repair-no-training-v1.json`

The receipt must include:

- current commit and active prompt;
- files changed;
- commands run and exact exit status;
- M3HG command-validity blockers reviewed;
- exact repair implemented or documented;
- local no-training proof, preferably compile plus dry-run/contract proof when
  available;
- Brev read-only/default-off state;
- future M3HI command validity status and remaining pre-start requirements;
- claim-surface proof that fail-closed state is unchanged;
- forbidden-action proof;
- exactly one next action.

6. Write the session log:

`docs/session-logs/683-mission-3hh-popsign25-command-or-receipt-metadata-repair-no-training.md`

7. Select exactly one next action:

- `continue_m3hi_bounded_popsign25_compute_or_stop_with_provider_blocker`
- `continue_m3hi_research_guided_strategy_adjustment`
- `continue_m3hi_detector0_crop_normalized_contract`
- `continue_m3hi_interactive_fail_closed_product_hardening`
- `stop_for_human_compute_approval`
- `stop_for_human_review`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3HH.
2. Required baseline checks pass or exact blockers are recorded.
3. The M3HG receipt is interpreted without training, evaluator rerun, Brev
   lifecycle, or remote work.
4. Exactly one command or metadata repair is implemented or documented.
5. The repair directly addresses the M3HG blocker: the `16`-batch cap, missing
   fresh output namespace, or missing future-command metadata needed to make the
   full-exposure test reviewable.
6. A local no-training proof exists for the repaired contract, or a concrete
   blocker explains why it cannot be proven.
7. A tracked M3HH receipt and numbered session log exist.
8. Claim surfaces remain fail-closed and unpromoted.
9. No Brev lifecycle/remote/spend, training/fitting, evaluator rerun, export,
   browser activation, source/media work, final-gate change, manifest/tensor/
   vocabulary mutation, claim expansion, output regeneration, or pretrained
   shortcut occurs.
10. Exactly one next action is selected.

## Boundaries

- Local/no-remote/no-Brev/no-training only.
- Implementation changes are allowed only for command guardrails, metadata
  capture, local validation helpers, docs, receipts, and session logs needed by
  this M3HH repair.
- Existing ignored output JSON may be read but not regenerated, rewritten,
  moved, copied, exported, or promoted.
- Do not inspect raw learner media, import new datasets, broaden labels, mutate
  source-register rights, or change product/browser claim surfaces.
- Do not push, amend, use `--no-verify`, or `git add -A`.

## Observer Guidance

- CONTINUE if the executor completes one scoped command/metadata repair,
  validates it without training/evaluation regeneration, writes the receipt/log,
  keeps claims fail-closed, keeps Brev read-only/default-off, and selects one
  bounded next action.
- NUDGE if the repair is too vague to make the future compute command
  reviewable, misses the M3HG blockers, lacks local proof, omits
  forbidden-action proof, or omits exactly one next action.
- REDIRECT if the executor trains, reruns evaluation, starts/stops Brev, uses
  remote/sync/copy/exec commands, rewrites ignored outputs, mutates manifests/
  tensors/vocabulary/source rights, inspects raw media, exports, promotes,
  activates browser recognition, expands claims, or implements unrelated model/
  product changes.
- STOP if the next action requires human budget/source/privacy/claim/promotion
  approval and the durable prompt does not contain explicit bounded
  authorization.
- ESCALATE if M3HH changes architecture, input strategy, target schema, source
  scope, vocabulary, or training budget beyond the bounded PopSign 25
  exposure-test command repair without a current strategy memo.

## Progress Ledger

Current state: M3HG created the no-training bounded compute receipt. It found
the future PopSign 25 compute envelope bounded, priced, and kill-conditioned,
but not execution-ready because current command guardrails repeat the M3HC
`64/625` exposure cap and lack a fresh M3HH output namespace.

Completed: M3HB PopSign 25 command/output contract; M3HC bounded Brev run,
copyback, receipt/log, and default-off proof; M3HD metric triage; M3HE split,
label, class-index, true/predicted, sampler, and train/eval distribution
diagnosis; M3HF input/training contract preflight; M3HG compute receipt.

Evidence: M3HG receipt/log, M3HF/M3HE/M3HD/M3HC receipts/logs, ignored copied
M3HC output JSON if present, PopSign 25 manifests, local train/eval command
surfaces, fail-closed claim surfaces, and read-only Brev state.

Remaining: repair or prove the PopSign 25 command/metadata contract so a later
M3HI prompt can either run the bounded full-exposure compute attempt under the
recorded envelope or stop with a concrete provider/contract blocker.

Blockers: do not continue to Brev lifecycle, paid compute, non-dry-run
training, evaluator rerun, source/media, export, promotion, or claims until a
later prompt records a bounded approved route and teardown proof.

Next step: complete one M3HH command or receipt metadata repair, validate it
locally without training, write the receipt/session log, and choose one next
action.
