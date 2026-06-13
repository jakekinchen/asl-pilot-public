# Return-To-Form M3EX Fail-Closed Product Downscope Contract Goal Loop Prompt

Mission 3EX prompt for the Codex executor after Mission 3EW completed local
metric triage and observer 547 API research recommended no-training product
downscope.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Write a local/no-remote/no-training fail-closed product downscope contract that
turns the M3EV/M3EW weak-learnability evidence and observer 547 API memo into a
durable project steering surface. This is a documentation and evidence packet
only. It should define what the app may safely offer while recognition remains
not trained, and what ML/product claims remain blocked.

This prompt does not authorize implementation-code changes, product-runtime
mutation, Brev/GPU work, training, evaluation rerun, source/data mutation,
export, promotion, browser recognition activation, or final-readiness claims.

## Starting Evidence

- M3EW executor commit `78b82a9` wrote
  [`docs/validation/return-to-form-m3ew-m3ev-metric-triage-no-remote-v1.json`](../validation/return-to-form-m3ew-m3ev-metric-triage-no-remote-v1.json)
  and
  [`docs/session-logs/546-mission-3ew-m3ev-metric-triage-no-remote.md`](../session-logs/546-mission-3ew-m3ev-metric-triage-no-remote.md).
- M3EW found no artifact-accounting, copyback, evaluation-report, source-code,
  evaluation-contract, or input-contract repair. It classified the blocker as
  repeated weak learnability with source/split/label separability,
  region-grid representation, and architecture/training-budget limitations.
- M3EV/M3EW metrics remain non-promotable: validation top-1
  `0.2222222222222222`, validation macro-F1 `0.13796992481203008`, test top-1
  `0.17857142857142858`, test macro-F1 `0.11591836734693879`, threshold
  coverage `0`, prediction concentration on `white`, and multiple zero-recall
  labels.
- Browser recognition remains fail-closed:
  `web/public/model/model-card.json` is `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has no active labels.
- Observer 547 API research artifact:
  [`artifacts/research/observer-547-m3ew-post-tcn-strategy/response.md`](../../artifacts/research/observer-547-m3ew-post-tcn-strategy/response.md)
  recommends `redirect_to_no_training_strategy_downscope` and a
  fail-closed product downscope contract before more ML work.

## Authorization

M3EX is local/no-remote/no-spend/no-training and documentation-only.

Allowed:

- Read current docs, receipts, claim surfaces, and existing product/README
  claim text.
- Run existing non-mutating local audits and JSON validation commands.
- Write one durable downscope contract under `docs/`.
- Write the tracked M3EX receipt and numbered session log.
- Commit only scoped docs/receipt/session-log artifacts.

Not allowed:

- Brev start/exec/sync/copy, remote dry-run, remote training, package install,
  worker lifecycle command except stopping the retained worker if read-only
  state unexpectedly reports it running.
- Local or remote training, fitting, backward pass, optimizer work, epoch
  training, checkpoint creation, evaluation rerun, threshold tuning, export,
  model-card promotion, active-vocabulary promotion, browser recognition
  activation, product-runtime mutation, final-readiness claim, or ASL-correctness
  claim.
- Implementation-code changes, UI/runtime changes, package/dependency changes,
  source/media import, source-register mutation, manifest/tensor/vocabulary/
  packet mutation, label expansion, generated labels, pseudo-labels, or
  pretrained detector/landmark/backbone/embedding/teacher path.
- Staging or committing ignored model artifacts under `output/`.
- Push, amend, no-verify, duplicate worker, worker delete, or worker reset.

## Source Of Truth

1. Latest supervising-user instruction.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3EW receipt:
   [`docs/validation/return-to-form-m3ew-m3ev-metric-triage-no-remote-v1.json`](../validation/return-to-form-m3ew-m3ev-metric-triage-no-remote-v1.json).
4. M3EW session log:
   [`docs/session-logs/546-mission-3ew-m3ev-metric-triage-no-remote.md`](../session-logs/546-mission-3ew-m3ev-metric-triage-no-remote.md).
5. Observer 547 API memo:
   [`artifacts/research/observer-547-m3ew-post-tcn-strategy/response.md`](../../artifacts/research/observer-547-m3ew-post-tcn-strategy/response.md).
6. Model claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
7. Current README, architecture, task, and strategy docs if they contain
   recognition/product readiness claims.

## Required Slice

Complete one local downscope-contract pass:

1. Verify local state, active prompt, local audits, M3EW receipt, observer 547
   API memo, fail-closed claim surfaces, and Brev default-off visibility.
2. Inspect existing product/project docs and relevant web source files for
   recognition-readiness, active-vocabulary, upload, or fail-open wording. Do
   not edit implementation/runtime files in M3EX.
3. Write a concise downscope contract under:
   `docs/model/fail-closed-product-downscope-contract.md`.
4. The contract must define:
   - safe near-term product lane while recognition is not trained;
   - blocked ML, Brev, export, promotion, source/data, runtime, and claim work;
   - what copied M3EV artifacts mean and do not mean;
   - what human approval or new evidence would be required to resume ML work;
   - acceptance gates for any future fail-closed product-hardening mission.
5. Write the tracked M3EX receipt and numbered session log.
6. Commit only scoped documentation, receipt, and session-log artifacts.

Required local checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3ew-m3ev-metric-triage-no-remote-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
python3 -m json.tool artifacts/research/observer-547-m3ew-post-tcn-strategy/raw.json >/dev/null
brev ls --json
git diff --check
```

Recommended inspection commands:

```sh
rg -n "trained|not_trained|recognition|recognizer|activeLabels|pass/fail|upload|ready|model-card|Brev|ONNX|promotion" README.md ARCHITECTURE.md MVP_TASKS.md docs web/src web/public/model
```

## Receipt

Write:

`docs/validation/return-to-form-m3ex-fail-closed-product-downscope-contract-v1.json`

The receipt must include:

- M3EW and observer 547 API memo summary;
- local checks and fail-closed claim-surface status;
- read-only Brev provider state and any default-off stop action if needed;
- inspected claim surfaces/docs/source paths;
- downscope contract path and summary;
- explicit statement that no implementation/runtime/product files were mutated;
- explicit statement that no training, evaluation rerun, Brev command, export,
  promotion, browser activation, source/data/dependency mutation, or final
  readiness claim occurred;
- `pretrained_components: []`;
- all negative authorizations from this prompt;
- changed files;
- exactly one next action.

Allowed next actions:

- `continue_fail_closed_interactive_product_hardening` if the contract gives a
  safe local product slice that can improve learner value without recognition
  claims or runtime ML activation.
- `continue_claim_surface_reduction_no_training` if existing docs/UI copy must
  be tightened before product hardening.
- `continue_openai_or_gpt_pro_research` if the contract exposes a new strategy
  question not answered by observer 547.
- `stop_for_human_model_strategy_review` if more ML, source/data mutation,
  product-scope expansion, or claim expansion requires human approval.

## Session Log

Write:

`docs/session-logs/548-mission-3ex-fail-closed-product-downscope-contract.md`

The session log must record commands, evidence inspected, claim-surface
findings, downscope contract summary, Brev default-off status, changed files,
and exactly one next action.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3EX.
2. Required local checks pass or exact blockers are recorded.
3. A downscope contract exists at
   `docs/model/fail-closed-product-downscope-contract.md`.
4. Fail-closed claim surfaces remain unchanged.
5. No forbidden implementation, runtime, training, remote, source/data/
   dependency, product promotion, broad-label, worker, or pretrained/generated
   action occurs.
6. The tracked M3EX receipt and numbered session log exist and select exactly
   one next action.
