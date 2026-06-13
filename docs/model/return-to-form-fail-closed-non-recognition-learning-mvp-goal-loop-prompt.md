# Return-To-Form Fail-Closed Non-Recognition Learning MVP Goal Loop Prompt

Mission 3DJ prompt for the Codex executor after Mission 3DI selected
`redirect_to_fail_closed_non_recognition_learning_mvp`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training, no-implementation
fail-closed product MVP redirect packet.

The goal is to convert the M3DI strategy/downscope decision into a concrete,
reviewable product lane that preserves ASL Pilot's useful learning experience
without live ASL recognition, automatic correctness grading, active trained
labels, model promotion, or final-readiness claims.

This mission must not implement product code yet. It must inspect existing
routes, claim surfaces, receipts, and smoke/audit scripts; classify what the
fail-closed non-recognition MVP should include; identify the first bounded
product slice; and write a tracked receipt.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3DI strategy/downscope decision:
   - [`docs/validation/return-to-form-popsign-fresh5-post-scaffold-strategy-downscope-decision-v1.json`](../validation/return-to-form-popsign-fresh5-post-scaffold-strategy-downscope-decision-v1.json)
   - [`docs/session-logs/458-mission-3di-popsign-fresh5-post-scaffold-strategy-downscope.md`](../session-logs/458-mission-3di-popsign-fresh5-post-scaffold-strategy-downscope.md)
4. Observer 459 redirect log, once present:
   - [`docs/session-logs/459-observer-redirect-fail-closed-non-recognition-mvp.md`](../session-logs/459-observer-redirect-fail-closed-non-recognition-mvp.md)
5. Existing fail-closed product evidence:
   - [`docs/validation/return-to-form-final-readiness-gap-audit-no-promotion-v1.json`](../validation/return-to-form-final-readiness-gap-audit-no-promotion-v1.json)
   - [`docs/session-logs/348-mission-3bi-final-readiness-gap-audit-no-promotion.md`](../session-logs/348-mission-3bi-final-readiness-gap-audit-no-promotion.md)
   - [`docs/validation/return-to-form-reduced-product-claim-v1.md`](../validation/return-to-form-reduced-product-claim-v1.md)
   - [`docs/validation/return-to-form-human-demo-review-v1.md`](../validation/return-to-form-human-demo-review-v1.md)
6. Current claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
7. Existing product routes and tests, read-only:
   - [`web/src/components/PracticeApp.tsx`](../../web/src/components/PracticeApp.tsx)
   - [`web/src/components/LessonApp.tsx`](../../web/src/components/LessonApp.tsx)
   - [`web/src/components/RobotMannequin3D.tsx`](../../web/src/components/RobotMannequin3D.tsx)
   - [`web/src/app/lesson/page.tsx`](../../web/src/app/lesson/page.tsx)
   - existing `scripts/audit_*` and smoke scripts.
8. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3DI completed at commit `89af775` and created
`docs/validation/return-to-form-popsign-fresh5-post-scaffold-strategy-downscope-decision-v1.json`
with hash `3227a923e1a2a7cfc5fb4295e3d1854e0224b532ca51cd9a990558be1d6b1297`.

M3DI selected exactly one next action:
`redirect_to_fail_closed_non_recognition_learning_mvp`.

The selected rationale is that the current recognizer lane exhausted the useful
no-training local diagnostic/design loop, the prior strategy/design chain
produced a scaffold that still collapsed before the classifier, and no prompt
authorizes training, Brev, source/data mutation, implementation, export,
promotion, or recognition claims. Recognition remains parked until explicit
human approval or materially new approved evidence exists.

Browser claim surfaces remain fail-closed:

- `web/public/model/model-card.json` remains `status: "not_trained"`;
- `docs/model/active-vocabulary-claim.json` remains
  `modelVersion: "rawframe-not-trained"`, `activeLabels: []`, and
  `evidenceArtifacts: []`.

Brev cost-control state from observer 459:

- `brev exec asl-pilot-rawframe-001 "ps ..."` found no training/screen/tmux
  process, only system Python and Jupyter.
- `brev stop asl-pilot-rawframe-001`, `brev stop 2hl1hytty`, and
  `brev stop --all` all returned, but repeated `brev ls --json` verification
  still reported `asl-pilot-rawframe-001` / `2hl1hytty` as `RUNNING`,
  `READY`, and `HEALTHY`.
- Treat this as a human-visible cost-control blocker. Do not run Brev commands
  in M3DJ beyond read-only status if required by the observer/runbook.

## Required Slice

Complete exactly one smallest useful fail-closed product MVP redirect packet.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-post-scaffold-strategy-downscope-decision-v1.json >/dev/null
```

2. Inspect existing product routes, claim surfaces, fail-closed receipts, and
   smoke/audit scripts read-only. Do not write implementation code in this
   mission.

3. Write a tracked receipt:

`docs/validation/return-to-form-fail-closed-non-recognition-learning-mvp-plan-v1.json`

The receipt must include:

- current HEAD and active prompt;
- exact artifacts inspected and hashes where practical;
- source-supported observations from M3DI and existing fail-closed product
  evidence;
- current product surfaces that can support a non-recognition learning MVP;
- product surfaces that are stale, misleading, missing, or need smoke refresh;
- explicit allowed product claims, such as vocabulary practice, guided
  self-practice, lesson prompts, local camera self-view, manual/self-assessment
  review, progress history, and teacher/human review handoff;
- explicit forbidden claims, including live ASL recognition, automatic
  correctness grading, trained browser labels, Detector 0 tracking, box-driven
  avatar authority, final readiness, and ASL correctness evaluation;
- privacy constraints, including no raw learner video upload during normal
  practice;
- Brev cost-control status and the failed stop-verification blocker;
- browser fail-closed confirmation from claim surfaces;
- negative authorizations for training/fitting, Brev spend or remote work,
  source/data mutation, implementation code, export, browser activation,
  model-card promotion, active-label promotion, final-gate weakening,
  recognition claims, unsupported claims, and push;
- exactly one selected next action.

4. Select exactly one next action:

- `continue_fail_closed_product_status_refresh`: if claim/status surfaces need
  a bounded non-recognition status refresh before product smoke.
- `continue_fail_closed_product_smoke_refresh`: if current surfaces are honest
  and the next useful step is smoke/audit refresh for `/`, `/lesson`, and
  `/validation`.
- `continue_single_fail_closed_product_blocker_fix`: if read-only inspection
  finds one small product blocker that should be fixed in the next executor
  slice.
- `draft_final_fail_closed_demo_evidence_package`: if the current product is
  already adequate and only a final evidence package remains.
- `stop_for_human_product_review`: if the next meaningful decision is human
  UX/content acceptance, scope review, or cost-control action.

## Hard Boundaries

- No recognizer training, fitting, tuning, optimizer/backward pass, checkpoint
  creation/update, sweep, retry, new train/eval/extraction, or model route
  reactivation.
- No product implementation code change in M3DJ; this mission is the redirect
  planning packet only.
- No fake recognizer output, fake detector boxes, model-confidence numbers,
  automatic correctness grading, ASL correctness claim, live tracking claim, or
  active trained-label claim.
- No Brev training, spend, sync, remote command, teardown, file copy, or remote
  planning. The failed stop verification is a cost-control blocker to record,
  not a reason to run product work remotely.
- No source-register, source import, dataset approval, manifest, tensor, label,
  vocabulary, pseudo-label, pretrained dependency, browser model, active-label,
  final-gate, export, or claim-surface mutation unless a future prompt
  explicitly authorizes a bounded product/claim update.
- No ONNX export, browser model activation, model-card promotion,
  final-readiness claim, final-gate weakening, unsupported claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3DJ prompt and names Mission 3DJ.
2. The M3DI receipt exists and parses.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-fail-closed-non-recognition-learning-mvp-plan-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt separates source-supported observations from inference and
   unsupported claims.
5. The receipt defines allowed and forbidden fail-closed product claims.
6. The receipt inventories current product/claim surfaces enough to choose one
   next product slice.
7. The receipt records the Brev stop-verification blocker and confirms M3DJ did
   not use Brev for product work.
8. The receipt proves browser recognition remains fail-closed.
9. The receipt proves no training/fitting/checkpoint/Brev remote work/source
   mutation/manifest mutation/tensor mutation/implementation/export/browser
   activation/model-card promotion/final-gate action/unsupported claim/push
   occurred.
10. The receipt names exactly one next action from this prompt.
11. Required audits, receipt JSON validation, and `git diff --check` exit `0`
    or record exact blockers.
12. A numbered session log records commands, evidence, blockers, and exactly
    one next action.

## Observer Guidance

- CONTINUE if the packet is bounded, local/no-spend, no-training,
  no-implementation, fail-closed, evidence-backed, and selects one bounded next
  product action.
- NUDGE if the receipt lacks allowed/forbidden claims, product-surface
  inventory, Brev cost-control status, fail-closed proof, negative
  authorization proof, or exactly one next action.
- REDIRECT if the executor drifts back into ML/data/source/Brev/export/model
  promotion work, or if it attempts implementation code in this planning
  packet.
- STOP if the receipt selects `stop_for_human_product_review` or if the
  remaining blocker is human cost-control/product acceptance.
- ESCALATE only for a concrete product-claim or architecture decision whose
  wrong answer would materially change the app's honesty or user-facing scope.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3DJ fail-closed non-recognition learning MVP redirect packet.
Completed:            <plan result and receipt>.
Evidence:             <receipt path and local audit commands>.
Remaining:            <exact next action>.
Blockers:             <none or exact product/cost-control blocker>.
Next step:            <exactly one next action from this prompt>.
Checkpoint commit:    <commit hash or pending>.
```
