# Return-To-Form M3GQ Source/Vocabulary/Input Repair No Brev Goal Loop Prompt

Mission 3GQ prompt for the Codex executor after M3GP stopped for the human
dataset/vocabulary/model-input strategy choice.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Use the latest supervising-user instruction as approval to resume the loop on
the conservative dataset/vocabulary/model-input lane. Create one local,
no-remote, no-Brev source/vocabulary/input repair artifact that turns the weak
7-label high-signal region-grid evidence into the next trainable contract.

This mission is allowed to mutate scoped local source/vocabulary/input
artifacts only when the mutation is justified by existing approved local
evidence and recorded in a receipt. It must not train, evaluate a checkpoint,
touch Brev beyond read-only status, export, promote, activate browser
recognition, or change final claim surfaces.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3GP decision packet:
   - [`docs/validation/return-to-form-m3gp-human-strategy-packet-no-brev-v1.json`](../validation/return-to-form-m3gp-human-strategy-packet-no-brev-v1.json)
   - [`docs/session-logs/646-mission-3gp-human-strategy-packet-no-brev.md`](../session-logs/646-mission-3gp-human-strategy-packet-no-brev.md)
5. M3GO/M3GN/M3GM/M3GL/M3GJ/M3GB evidence named by M3GP.
6. Current approved source and manifest surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - `data/manifests/lesson/high-signal-region-grid/train.json`
   - `data/manifests/lesson/high-signal-region-grid/validation.json`
   - `data/manifests/lesson/high-signal-region-grid/test.json`
7. Existing tensor/crop/input code and contracts:
   - `scripts/train_rawframe_model.py`
   - `scripts/evaluate_rawframe_model.py`
   - any existing high-signal region-grid tensor/manifests receipts cited by
     M3GN/M3GO/M3GP
8. Fail-closed claim surfaces:
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)

## Human Strategy Choice Now In Force

The user has approved continuing the work needed to make the datasets and
training path function. Treat that as approval for this bounded local lane:

- inspect existing approved local dataset/manifests/tensors/crops/input
  contracts;
- inspect approved local media metadata and file existence when needed;
- generate local diagnostic summaries/contact-sheet-style evidence only from
  already-approved local project artifacts when needed to choose a
  source/vocabulary/input repair;
- create or update scoped local manifest/config/receipt artifacts for the next
  trainable contract.

This does not approve:

- Brev start/stop/reset/exec/sync/copy or remote spend;
- model training, evaluator rerun, checkpoint generation, or hyperparameter
  search;
- import of new datasets or source-register approval shortcuts;
- raw learner video upload;
- pretrained detector/landmark/backbone/feature/model dependencies;
- model-card promotion, browser activation, final-gate weakening, or
  positive ASL-correctness claims.

## Required Slice

Complete exactly one reviewable local/no-Brev repair slice:

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3gp-human-strategy-packet-no-brev-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3go-read-only-contract-gap-inventory-no-brev-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3gn-dataset-vocab-model-input-contract-no-brev-v1.json >/dev/null
python3 -m json.tool docs/model/dataset-source-register.json >/dev/null
python3 -m json.tool data/manifests/lesson/high-signal-region-grid/train.json >/dev/null
python3 -m json.tool data/manifests/lesson/high-signal-region-grid/validation.json >/dev/null
python3 -m json.tool data/manifests/lesson/high-signal-region-grid/test.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
git diff --check
```

2. Build a compact evidence table for the current 7-label contract:

   - train/validation/test counts by label and signer;
   - source ids and license review status;
   - tensor file presence/hash coverage;
   - input payload keys and shapes for sampled train/validation/test rows;
   - crop/region metadata available without new source import;
   - per-label failure pattern from M3GJ/M3GL sidecars when available.

3. Choose exactly one local repair route and perform it:

   - `reduced_existing_vocab_contract`: create/update a scoped reduced
     candidate manifest/config from existing approved local artifacts when the
     current 7-label set appears too noisy or weakly separable.
   - `input_contract_repair`: patch a scoped dataloader/input-contract issue
     if inspection proves the training path is not consuming the intended
     `rgb_regions_grid_v1` data.
   - `crop_or_region_contract_repair`: create/update a scoped crop/input
     config or diagnostic contract when evidence shows the current independent
     hand/head/full-frame regions are losing the decisive signal.

   Prefer the smallest route that creates a concrete next trainable contract.
   Do not perform more than one route in this mission.

4. Write the tracked receipt:

`docs/validation/return-to-form-m3gq-source-vocab-input-repair-no-brev-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run;
- Brev read-only/default-off state;
- source and license status consulted;
- current 7-label evidence table;
- selected route and rejected routes with reasons;
- changed files and hashes;
- claim-surface status proving fail-closed state is unchanged;
- forbidden-action proof;
- `pretrained_components: []`;
- exactly one next action.

5. Write the session log:

`docs/session-logs/649-mission-3gq-source-vocab-input-repair-no-brev.md`

6. Select exactly one next action:

- `continue_m3gr_local_dataloader_or_micro_overfit_preflight_no_brev`
- `continue_m3gq_followup_source_vocab_input_repair_no_brev`
- `escalate_openai_or_gpt_pro_dataset_model_strategy_with_m3gp_m3gq_evidence`
- `stop_for_human_source_privacy_or_claim_review`

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3GQ.
2. Required baseline checks pass or exact blockers are recorded.
3. The current 7-label contract has a concrete evidence table.
4. Exactly one local repair route is selected and performed, or a blocker
   explains why no scoped repair can be performed safely.
5. A tracked M3GQ receipt and session log exist.
6. Claim surfaces remain fail-closed and unpromoted.
7. No Brev lifecycle/remote/spend, training, evaluator rerun, export,
   promotion, browser activation, new source import, or pretrained shortcut
   occurred.
8. Exactly one next action is selected.

## Boundaries

- Local/no-remote/no-Brev repair only.
- Existing approved local artifacts only.
- Do not import new datasets, broaden labels, or mutate source-register rights
  without a separate prompt.
- Do not train or evaluate a checkpoint in this mission.
- Do not push, amend, use `--no-verify`, or `git add -A`.
- Do not weaken final gates or claim model/product readiness.

## Progress Ledger

Current state: M3GP stopped after proving the current evidence cannot promote
and that another seed-only compute retry is not justified.

Completed: M3GL/M3GM/M3GN/M3GO/M3GP evidence exists and Brev is default-off.

Remaining: produce one concrete local trainable contract repair so the next
mission can test learnability without guessing.

Blockers: stop if the repair requires unapproved source import, raw learner
video upload, Brev spend, pretrained dependencies, or claim expansion.

Next step: inspect the current 7-label contract and perform exactly one scoped
source/vocabulary/input repair.
