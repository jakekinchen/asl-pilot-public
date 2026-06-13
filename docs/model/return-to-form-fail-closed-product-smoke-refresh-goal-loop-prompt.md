# Return-To-Form Fail-Closed Product Smoke Refresh Goal Loop Prompt

Mission 3DL prompt for the Codex executor after Mission 3DK selected
`continue_fail_closed_product_smoke_refresh`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training fail-closed product smoke
refresh for the non-recognition MVP lane.

The goal is to refresh the evidence for `/`, `/lesson`, and `/validation`
against the current M3DK claim-status surfaces, while preserving the not-trained
browser model truth and the no-raw-upload/no-pretrained boundaries.

This mission may run and record existing local smoke/static checks, inspect the
routes read-only, and write one tracked receipt plus one numbered session log.
It must not implement product features, reactivate recognition, run Brev, run
training, promote model claims, mutate source/data/model artifacts, or hand-edit
`web/public/model/model-card.json`.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3DK status refresh receipt and session log:
   - [`docs/validation/return-to-form-fail-closed-product-status-refresh-v1.json`](../validation/return-to-form-fail-closed-product-status-refresh-v1.json)
   - [`docs/session-logs/462-mission-3dk-fail-closed-product-status-refresh.md`](../session-logs/462-mission-3dk-fail-closed-product-status-refresh.md)
4. M3DJ product redirect packet:
   - [`docs/validation/return-to-form-fail-closed-non-recognition-learning-mvp-plan-v1.json`](../validation/return-to-form-fail-closed-non-recognition-learning-mvp-plan-v1.json)
   - [`docs/session-logs/460-mission-3dj-fail-closed-non-recognition-learning-mvp.md`](../session-logs/460-mission-3dj-fail-closed-non-recognition-learning-mvp.md)
5. Current status generator and claim surfaces:
   - [`scripts/audit_final_claim_matrix.mjs`](../../scripts/audit_final_claim_matrix.mjs)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)
6. Product route and smoke surfaces:
   - [`web/src/app/page.tsx`](../../web/src/app/page.tsx)
   - [`web/src/app/lesson/page.tsx`](../../web/src/app/lesson/page.tsx)
   - [`web/src/app/validation/page.tsx`](../../web/src/app/validation/page.tsx)
   - `node scripts/audit_validation_page_smoke.mjs`
   - `node scripts/audit_lesson_fail_closed.mjs`
   - `node scripts/audit_avatar_no_recognition_claims.mjs`
   - `node scripts/audit_practice_screen_contract.mjs`
7. Fail-closed claim surfaces, read-only unless a future prompt explicitly
   authorizes mutation:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
8. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3DK completed at commit `c243503` and created
`docs/validation/return-to-form-fail-closed-product-status-refresh-v1.json`.

M3DK updated `scripts/audit_final_claim_matrix.mjs` and regenerated both claim
matrices through the existing write mode so `/validation` sees:

- Mission 3DK status, not stale Mission 3AR status.
- M3DI `redirect_to_fail_closed_non_recognition_learning_mvp`.
- M3DJ `continue_fail_closed_product_status_refresh`.
- Observer 459 Brev stop-verification failure as the current cost-control
  blocker.
- Browser claims remain fail-closed: `status=no_active_claim_rawframe_not_trained`,
  `active_cv_claim=null`, `cv_supported_count=0`, and `learn_only_count=100`.

M3DK preserved `web/public/model/model-card.json`; its `status` remains
`not_trained`, and the stale provenance note remains a recorded blocker because
M3DK forbade model-card hand edits and no generator path safely owned it.

Brev cost-control remains a human-visible blocker: observer 459 stop commands
returned, but `brev ls --json` still reported `asl-pilot-rawframe-001` /
`2hl1hytty` as `RUNNING`, `READY`, and `HEALTHY`. Do not use Brev for M3DL.

M3DK selected exactly one next action:
`continue_fail_closed_product_smoke_refresh`.

## Required Slice

Complete exactly one smallest useful fail-closed product smoke refresh.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-fail-closed-product-status-refresh-v1.json >/dev/null
node scripts/audit_final_claim_matrix.mjs
```

2. Refresh local smoke/static proof for `/`, `/lesson`, and `/validation`:

```sh
node scripts/audit_validation_page_smoke.mjs
node scripts/audit_lesson_fail_closed.mjs
node scripts/audit_avatar_no_recognition_claims.mjs
node scripts/audit_practice_screen_contract.mjs
```

If a repo-supported browser smoke command already exists and can run locally
without credentials, remote services, Brev, raw upload, or product mutation,
run the smallest relevant one for `/`, `/lesson`, and `/validation`. If no such
browser smoke exists or local runtime setup is unavailable, record that exact
blocker and rely on the existing static/audit checks for this slice.

3. Inspect the product route files and claim surfaces read-only. Confirm:

- `/` remains a fail-closed practice surface and does not claim live ASL
  correctness.
- `/lesson` remains fail-closed and does not claim live detector/tracking,
  correctness grading, or box-driven avatar behavior.
- `/validation` reads the refreshed M3DK matrices and does not claim an active
  trained browser model.
- Raw learner video is not uploaded during normal practice.
- No pretrained CV/sign/landmark/model dependency is introduced in the promoted
  lane.

4. Write a tracked receipt:

`docs/validation/return-to-form-fail-closed-product-smoke-refresh-v1.json`

The receipt must include:

- current HEAD and active prompt;
- exact files and routes inspected;
- exact smoke/static/browser commands run, with pass/fail/blocker status;
- confirmation that `/`, `/lesson`, and `/validation` remain fail-closed;
- confirmation that browser recognition remains inactive and claims remain
  not-trained;
- confirmation that M3DK claim matrices are the current `/validation` status
  source;
- model-card handling, including proof that it was not hand-edited;
- Brev status handling, including proof that no Brev command was run in M3DL;
- negative authorizations for training/fitting, Brev, source/data mutation,
  product feature implementation, export, browser activation, model-card
  promotion, active-label promotion, final-gate weakening, recognition claims,
  unsupported claims, and push;
- exactly one selected next action.

5. Select exactly one next action:

- `continue_fail_closed_product_smoke_refresh`: if smoke evidence is incomplete
  or blocked.
- `continue_single_fail_closed_product_blocker_fix`: if one small
  fail-closed product/status blocker is found and should be fixed next.
- `draft_final_fail_closed_demo_evidence_package`: if `/`, `/lesson`, and
  `/validation` smoke/status evidence is adequate for a final reduced-claim
  demo packet.
- `stop_for_human_product_or_cost_control_review`: if the remaining blocker is
  human UX/content acceptance, unresolved model-card wording policy, or
  unresolved Brev/provider cost-control action.

## Hard Boundaries

- No recognizer training, fitting, tuning, optimizer/backward pass, checkpoint
  creation/update, sweep, retry, new train/eval/extraction, or model route
  reactivation.
- No product feature implementation in this smoke-refresh slice.
- No hand-edit of `web/public/model/model-card.json`.
- No fake recognizer output, fake detector boxes, model-confidence numbers,
  automatic correctness grading, ASL correctness claim, live tracking claim, or
  active trained-label claim.
- No Brev command, spend, sync, remote work, lifecycle, delete, reset,
  teardown, file copy, or remote planning.
- No source-register, source import, dataset approval, manifest, tensor, label,
  vocabulary, pseudo-label, pretrained dependency, browser model artifact,
  active-label, final-gate, export, or recognition-claim mutation.
- No ONNX export, browser model activation, model-card promotion,
  final-readiness claim, final-gate weakening, unsupported claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3DL prompt and names Mission 3DL.
2. The M3DK receipt exists and parses.
3. Claim-matrix audit passes and `/validation` status source is current to
   M3DK, or the session log records the exact blocker.
4. A tracked JSON receipt exists at
   `docs/validation/return-to-form-fail-closed-product-smoke-refresh-v1.json`
   or the session log records the exact blocker that prevented it.
5. The receipt confirms `/`, `/lesson`, and `/validation` remain fail-closed.
6. The receipt proves browser recognition remains inactive and model claims
   remain not-trained.
7. The receipt proves `web/public/model/model-card.json` was not hand-edited.
8. The receipt proves no training/fitting/checkpoint/Brev/source mutation/
   manifest mutation/tensor mutation/product feature implementation/export/
   browser activation/model-card promotion/final-gate action/unsupported claim/
   push occurred.
9. Required audits, receipt JSON validation, relevant smoke/static/browser
   checks, and `git diff --check` exit `0` or record exact blockers.
10. The receipt names exactly one next action from this prompt.
11. A numbered session log records commands, evidence, blockers, and exactly
    one next action.

## Observer Guidance

- CONTINUE if the smoke refresh is scoped, fail-closed, no-Brev, no-training,
  status/product-smoke only, and selects one bounded next product action.
- NUDGE if the receipt lacks route coverage, command status, model-card
  handling, Brev handling, fail-closed proof, negative authorization proof, or
  exactly one next action.
- REDIRECT if the executor trains, runs Brev, edits model-card by hand,
  reactivates recognition, edits product features, or mutates source/data/model
  artifacts.
- STOP if the receipt selects `stop_for_human_product_or_cost_control_review`
  or if continuing requires human cost-control/product acceptance.
- ESCALATE only for a concrete product-claim decision whose wrong answer would
  materially change the app's honesty or user-facing scope.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3DL fail-closed product smoke refresh.
Completed:            <smoke refresh result and receipt>.
Evidence:             <receipt path and local audit/browser commands>.
Remaining:            <exact next action>.
Blockers:             <none or exact product/cost-control blocker>.
Next step:            <exactly one next action from this prompt>.
Checkpoint commit:    <commit hash or pending>.
```
