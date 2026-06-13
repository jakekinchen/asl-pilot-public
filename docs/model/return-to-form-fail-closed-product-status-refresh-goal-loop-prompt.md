# Return-To-Form Fail-Closed Product Status Refresh Goal Loop Prompt

Mission 3DK prompt for the Codex executor after Mission 3DJ selected
`continue_fail_closed_product_status_refresh`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training fail-closed product status
refresh for the non-recognition MVP lane.

The goal is to update the public/tracked claim-status surfaces that `/validation`
reads so they describe the current M3DI/M3DJ fail-closed non-recognition
redirect and observer 459 Brev stop-verification blocker, while preserving the
not-trained browser model truth.

This mission may edit only the smallest status generator, generated claim
matrices, and tracked receipt/session-log surfaces needed for that status
refresh. It must not implement product UI/features, reactivate recognition, run
training, run Brev, promote model claims, or hand-edit
`web/public/model/model-card.json`.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3DJ product redirect packet:
   - [`docs/validation/return-to-form-fail-closed-non-recognition-learning-mvp-plan-v1.json`](../validation/return-to-form-fail-closed-non-recognition-learning-mvp-plan-v1.json)
   - [`docs/session-logs/460-mission-3dj-fail-closed-non-recognition-learning-mvp.md`](../session-logs/460-mission-3dj-fail-closed-non-recognition-learning-mvp.md)
4. M3DI strategy/downscope decision:
   - [`docs/validation/return-to-form-popsign-fresh5-post-scaffold-strategy-downscope-decision-v1.json`](../validation/return-to-form-popsign-fresh5-post-scaffold-strategy-downscope-decision-v1.json)
5. Observer 459 redirect/cost-control record:
   - [`docs/session-logs/459-observer-redirect-fail-closed-non-recognition-mvp.md`](../session-logs/459-observer-redirect-fail-closed-non-recognition-mvp.md)
6. Status generator and status surfaces:
   - [`scripts/audit_final_claim_matrix.mjs`](../../scripts/audit_final_claim_matrix.mjs)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)
   - [`web/src/app/validation/page.tsx`](../../web/src/app/validation/page.tsx), read-only unless the matrix cannot express the status correctly.
7. Fail-closed claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json), read-only only; do not hand-edit.
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json), read-only unless a future prompt authorizes claim-surface mutation.
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json), read-only unless a future prompt authorizes claim-surface mutation.
8. Existing smoke/audit scripts, as needed:
   - `node scripts/audit_final_claim_matrix.mjs`
   - `node scripts/audit_validation_page_smoke.mjs`
   - `node scripts/audit_lesson_fail_closed.mjs`
   - `node scripts/audit_avatar_no_recognition_claims.mjs`
   - `node scripts/audit_practice_screen_contract.mjs`
9. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3DJ completed at commit `ece4466` and created
`docs/validation/return-to-form-fail-closed-non-recognition-learning-mvp-plan-v1.json`
with hash `e43478028fa83408706575bf87cdf5908ec564bd10e997ded9a0807057b3fdbc`.

M3DJ found the route behavior and primary claim booleans remain honest and
fail-closed, but the public claim/status ledger read by `/validation` is stale:

- `web/public/model/claim-matrix.json` and
  `docs/validation/final-claim-matrix.json` still label the progress ledger as
  Mission 3AR.
- The matrix blocker text still refers to older Brev login/2FA state, not the
  current observer 459 stop-verification failure.
- `/validation` reads that matrix, so its top claim remains honest but its
  current-state/status panel is stale for M3DJ.
- `scripts/audit_final_claim_matrix.mjs` still generates the older Mission 3AR
  status context.
- `web/public/model/model-card.json` has stale provenance-note wording, but
  this mission must not hand-edit the model card. If no existing generator owns
  that note, record it as a remaining blocker while keeping the fail-closed
  model-card status unchanged.

M3DJ selected exactly one next action:
`continue_fail_closed_product_status_refresh`.

Brev cost-control remains a human-visible blocker: observer 459 stop commands
returned, but `brev ls --json` still reported `asl-pilot-rawframe-001` /
`2hl1hytty` as `RUNNING`, `READY`, and `HEALTHY`. M3DJ did not run Brev
commands. Do not use Brev for M3DK.

## Required Slice

Complete exactly one smallest useful fail-closed product status refresh.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-fail-closed-non-recognition-learning-mvp-plan-v1.json >/dev/null
```

2. Inspect `scripts/audit_final_claim_matrix.mjs`,
   `web/public/model/claim-matrix.json`,
   `docs/validation/final-claim-matrix.json`, `/validation` status rendering,
   and fail-closed claim surfaces.

3. Update only the smallest status surfaces needed:

- Prefer updating `scripts/audit_final_claim_matrix.mjs` so it generates the
  current M3DI/M3DJ non-recognition redirect, fail-closed product status, and
  observer 459 Brev stop-verification blocker.
- Regenerate `web/public/model/claim-matrix.json` and
  `docs/validation/final-claim-matrix.json` through the existing script if the
  script supports write mode.
- Do not hand-edit `web/public/model/model-card.json`. If that stale
  provenance note cannot be generator-updated safely, record it as a remaining
  blocker and leave `status: "not_trained"` unchanged.
- Do not edit product UI/components unless `/validation` cannot render the
  refreshed matrix truth without a tiny status-only adjustment. If such an
  adjustment is required, keep it strictly limited to status rendering and
  record the reason.

4. Write a tracked receipt:

`docs/validation/return-to-form-fail-closed-product-status-refresh-v1.json`

The receipt must include:

- current HEAD and active prompt;
- exact files inspected and changed, with hashes where practical;
- before/after status summary for claim matrices and any generator update;
- confirmation that M3DI/M3DJ non-recognition redirect and observer 459 Brev
  stop-verification blocker are represented;
- confirmation that browser recognition remains fail-closed;
- model-card handling, including proof that it was not hand-edited or a precise
  blocker if the stale provenance note remains;
- negative authorizations for training/fitting, Brev, implementation beyond
  status refresh, source/data mutation, export, browser activation, model-card
  promotion, active-label promotion, final-gate weakening, recognition claims,
  unsupported claims, and push;
- exactly one selected next action.

5. Select exactly one next action:

- `continue_fail_closed_product_status_refresh`: if the status refresh is
  incomplete or blocked.
- `continue_fail_closed_product_smoke_refresh`: if status surfaces are current
  and the next useful step is smoke/audit refresh for `/`, `/lesson`, and
  `/validation`.
- `continue_single_fail_closed_product_blocker_fix`: if the status refresh
  reveals one small product/status blocker that should be fixed next.
- `draft_final_fail_closed_demo_evidence_package`: if current status and smoke
  evidence are already adequate.
- `stop_for_human_product_or_cost_control_review`: if the remaining blocker is
  human UX/content acceptance or unresolved Brev/provider cost-control action.

## Hard Boundaries

- No recognizer training, fitting, tuning, optimizer/backward pass, checkpoint
  creation/update, sweep, retry, new train/eval/extraction, or model route
  reactivation.
- No product feature implementation beyond the narrow status/generator/surface
  refresh described above.
- No hand-edit of `web/public/model/model-card.json`.
- No fake recognizer output, fake detector boxes, model-confidence numbers,
  automatic correctness grading, ASL correctness claim, live tracking claim, or
  active trained-label claim.
- No Brev command, spend, sync, remote work, lifecycle, delete, reset, teardown,
  file copy, or remote planning.
- No source-register, source import, dataset approval, manifest, tensor, label,
  vocabulary, pseudo-label, pretrained dependency, browser model artifact,
  active-label, final-gate, export, or recognition-claim mutation.
- No ONNX export, browser model activation, model-card promotion,
  final-readiness claim, final-gate weakening, unsupported claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3DK prompt and names Mission 3DK.
2. The M3DJ receipt exists and parses.
3. The claim-matrix generator and generated matrices either reflect the M3DI/M3DJ
   fail-closed product redirect and observer 459 Brev stop-verification blocker,
   or the session log records the exact blocker.
4. A tracked JSON receipt exists at
   `docs/validation/return-to-form-fail-closed-product-status-refresh-v1.json`
   or the session log records the exact blocker that prevented it.
5. The receipt proves browser recognition remains fail-closed.
6. The receipt proves `web/public/model/model-card.json` was not hand-edited,
   or records a prompt-authorized generator path if one exists.
7. The receipt proves no training/fitting/checkpoint/Brev/source mutation/
   manifest mutation/tensor mutation/unsupported product implementation/export/
   browser activation/model-card promotion/final-gate action/unsupported claim/
   push occurred.
8. Required audits, receipt JSON validation, claim-matrix audit, relevant
   status smoke/static checks, and `git diff --check` exit `0` or record exact
   blockers.
9. The receipt names exactly one next action from this prompt.
10. A numbered session log records commands, evidence, blockers, and exactly
    one next action.

## Observer Guidance

- CONTINUE if the status refresh is scoped, fail-closed, no-Brev, no-training,
  status-only, and selects one bounded next product action.
- NUDGE if the receipt lacks before/after status proof, model-card handling,
  Brev blocker wording, fail-closed proof, negative authorization proof, or
  exactly one next action.
- REDIRECT if the executor trains, runs Brev, edits model-card by hand,
  reactivates recognition, edits product features beyond status refresh, or
  mutates data/source/model artifacts.
- STOP if the receipt selects `stop_for_human_product_or_cost_control_review`
  or if continuing requires human cost-control/product acceptance.
- ESCALATE only for a concrete product-claim decision whose wrong answer would
  materially change the app's honesty or user-facing scope.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3DK fail-closed product status refresh.
Completed:            <status refresh result and receipt>.
Evidence:             <receipt path and local audit commands>.
Remaining:            <exact next action>.
Blockers:             <none or exact product/cost-control blocker>.
Next step:            <exactly one next action from this prompt>.
Checkpoint commit:    <commit hash or pending>.
```
