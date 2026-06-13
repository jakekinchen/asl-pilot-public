# Return-To-Form M3GR Local Dataloader Or Micro-Overfit Preflight No Brev Goal Loop Prompt

Mission 3GR prompt for the Codex executor after M3GQ created the reduced4
candidate manifest contract from existing approved ASL Citizen high-signal
region-grid rows.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Verify whether the M3GQ reduced4 contract is actually usable by the local
training path before any Brev, export, promotion, browser activation, or claim
work. Complete one local/no-remote/no-Brev preflight slice: prove the
dataloader/input contract, then either stop with a precise blocker or run at
most one tightly bounded local tiny micro-overfit sanity probe from scratch.

This mission is diagnostic only. A passing micro-overfit is not readiness,
promotion, browser activation, or authorization for broad training.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3GQ repair evidence:
   - [`docs/validation/return-to-form-m3gq-source-vocab-input-repair-no-brev-v1.json`](../validation/return-to-form-m3gq-source-vocab-input-repair-no-brev-v1.json)
   - [`docs/session-logs/649-mission-3gq-source-vocab-input-repair-no-brev.md`](../session-logs/649-mission-3gq-source-vocab-input-repair-no-brev.md)
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/train.json`
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/validation.json`
   - `data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/test.json`
5. M3GP/M3GO/M3GN/M3GM/M3GL/M3GJ/M3GB evidence named by M3GQ.
6. Current local model/input surfaces:
   - `scripts/train_rawframe_model.py`
   - `scripts/evaluate_rawframe_model.py`
   - existing tiny-overfit helpers under `scripts/`, if reused narrowly.
7. Fail-closed claim surfaces:
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Required Slice

Complete exactly one local/no-Brev preflight slice.

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3gq-source-vocab-input-repair-no-brev-v1.json >/dev/null
python3 -m json.tool data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/train.json >/dev/null
python3 -m json.tool data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/validation.json >/dev/null
python3 -m json.tool data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/test.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
git diff --check
```

2. Prove the reduced4 dataloader/input contract locally before any fitting:

   - validate the reduced4 train/validation/test manifests and tensor hashes;
   - run a no-training `--dry-run --check-files` path that requires
     `rgb_regions_grid_v1`;
   - record sample payload keys, raw `rgb_regions` shape, prepared model-input
     shape, region axis/order, and label mapping;
   - verify the parent M3GQ manifest hashes still match the M3GQ receipt.

3. Choose exactly one local route:

   - `dataloader_preflight_only`: choose this if dry-run, tensor/hash,
     environment, label mapping, or model-input proof fails. Write the
     receipt/log with the exact blocker and no fitting.
   - `tiny_local_micro_overfit_preflight`: choose this only after the
     dataloader/input proof passes. Run exactly one bounded local tiny
     from-scratch memorization probe on a deterministic subset from the M3GQ
     reduced4 train split. The probe must be local, ignored-output only,
     scratch initialized, and capped before running.

4. If running the tiny micro-overfit route, enforce these caps before the run:

   - no Brev lifecycle, remote, sync, copy, exec, or spend command;
   - no validation/test evaluation as readiness evidence;
   - no broad/full train split run, no second run, no sweep, no retry after
     seeing metrics;
   - use at most 1-2 clips per selected label for train-fit sanity;
   - output only under a scoped ignored path such as
     `output/m3gr-reduced4-local-micro-overfit-preflight`;
   - tracked receipt only under
     `docs/validation/return-to-form-m3gr-local-dataloader-or-micro-overfit-preflight-no-brev-v1.json`;
   - predeclare success as near-perfect memorization on the tiny selected
     subset with no zero-recall selected label. This does not count as held-out
     quality.

5. Write the tracked receipt:

`docs/validation/return-to-form-m3gr-local-dataloader-or-micro-overfit-preflight-no-brev-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run;
- Brev read-only/default-off state;
- M3GQ reduced4 manifest paths and hashes;
- dataloader/input-contract proof;
- selected local route and rejected route;
- micro-overfit subset, caps, runtime/device, and metrics if a probe ran;
- exact blocker if no probe ran;
- local ignored outputs written, if any;
- claim-surface status proving fail-closed state is unchanged;
- forbidden-action proof;
- `pretrained_components: []`;
- changed files;
- exactly one next action.

6. Write the session log:

`docs/session-logs/651-mission-3gr-local-dataloader-or-micro-overfit-preflight-no-brev.md`

7. Select exactly one next action:

- `continue_m3gs_reduced4_trainability_result_triage_no_brev`
- `continue_m3gr_followup_dataloader_contract_repair_no_brev`
- `escalate_openai_or_gpt_pro_strategy_with_m3gp_m3gq_m3gr_evidence`
- `stop_for_human_training_budget_source_or_claim_review`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3GR.
2. Required baseline checks pass or exact blockers are recorded.
3. The M3GQ reduced4 manifest hashes, tensor coverage, label mapping, and
   `rgb_regions_grid_v1` input contract are verified or an exact blocker is
   recorded.
4. Exactly one local route is selected.
5. If a micro-overfit probe runs, exactly one bounded local tiny probe runs and
   records the predeclared success threshold before interpreting metrics.
6. A tracked M3GR receipt and numbered session log exist.
7. Claim surfaces remain fail-closed and unpromoted.
8. No Brev lifecycle/remote/spend, broad training, evaluator rerun, validation/
   test readiness claim, export, promotion, browser activation, new source
   import, source-register rights mutation, final-gate change, or pretrained
   shortcut occurs.
9. Exactly one next action is selected.

## Boundaries

- Local/no-remote/no-Brev diagnostic preflight only.
- Existing approved local M3GQ reduced4 artifacts only.
- Do not import new datasets, broaden labels, mutate source-register rights, or
  inspect raw learner media.
- Do not run validation/test evaluation as product-quality evidence.
- Do not export ONNX, promote a model card, activate browser recognition, or
  claim final readiness.
- Do not push, amend, use `--no-verify`, or `git add -A`.

## Observer Guidance

- CONTINUE if the executor proves the local reduced4 input contract and records
  either a bounded tiny train-fit result or an exact dataloader blocker, with
  fail-closed claims and Brev default-off preserved.
- NUDGE if the receipt misses manifest hashes, label mapping, input-shape proof,
  caps, ignored-output accounting, forbidden-action proof, or exactly one next
  action.
- REDIRECT if the executor drifts into Brev, remote commands, broad training,
  evaluator reruns, validation/test readiness claims, source/media mutation,
  export, promotion, browser activation, or claim expansion.
- STOP if the selected next action requires human training budget, source,
  privacy, claim, promotion, or final-submission approval.
- ESCALATE if the result changes architecture/input strategy after failure and
  no current strategy memo covers that decision.

## Progress Ledger

Current state: M3GQ created the reduced4 trainable contract from approved local
ASL Citizen high-signal region-grid rows.

Completed: M3GQ reduced4 manifests and receipt exist.

Evidence: M3GQ receipt, session log 649, reduced4 manifests, claim surfaces,
and read-only Brev state.

Remaining: prove or precisely block the local dataloader/train-fit path for
the reduced4 contract without Brev or promotion.

Blockers: stop if the work requires Brev, broad training, source import,
source-rights mutation, raw media inspection, pretrained shortcuts, export,
browser activation, or claim expansion.

Next step: run the M3GR local dataloader or tiny micro-overfit preflight.
