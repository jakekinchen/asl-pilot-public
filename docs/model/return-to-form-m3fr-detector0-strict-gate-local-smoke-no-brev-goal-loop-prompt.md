# Return-To-Form M3FR Detector 0 Strict-Gate Local Smoke Goal Loop Prompt

Mission 3FR prompt for the Codex executor after M3FQ ported the strict
Detector 0 crop-normalization contract and selected
`continue_detector0_crop_normalized_local_smoke_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Perform one local/no-spend strict-gate crop-normalization smoke slice. The goal
is to prove whether the M3FQ static contract can drive a main-branch local
diagnostic smoke without promoting Detector 0 or browser recognition.

This is not a Brev run, not a product-runtime slice, and not a model-promotion
slice.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3FQ contract, receipt, and session log:
   - [`docs/model/return-to-form-detector0-strict-gate-crop-normalization-contract.json`](return-to-form-detector0-strict-gate-crop-normalization-contract.json)
   - [`docs/validation/return-to-form-m3fq-detector0-crop-normalized-recognizer-integration-v1.json`](../validation/return-to-form-m3fq-detector0-crop-normalized-recognizer-integration-v1.json)
   - [`docs/session-logs/592-mission-3fq-detector0-crop-normalized-recognizer-integration.md`](../session-logs/592-mission-3fq-detector0-crop-normalized-recognizer-integration.md)
4. Existing main-branch local smoke patterns:
   - [`scripts/run_return_to_form_tier0_crop_norm_ablation_smoke.py`](../../scripts/run_return_to_form_tier0_crop_norm_ablation_smoke.py)
   - [`scripts/run_return_to_form_tier0_policy_aware_crop_norm_ablation_smoke.py`](../../scripts/run_return_to_form_tier0_policy_aware_crop_norm_ablation_smoke.py)
   - [`scripts/audit_detector0_strict_gate_crop_contract.mjs`](../../scripts/audit_detector0_strict_gate_crop_contract.mjs)
5. Current fail-closed claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Required Slice

Complete exactly one smallest useful local smoke step:

1. Run baseline checks:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_detector0_strict_gate_crop_contract.mjs
python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
python3 -m json.tool docs/model/return-to-form-detector0-strict-gate-crop-normalization-contract.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3fq-detector0-crop-normalized-recognizer-integration-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
git diff --check
```

2. Inspect the M3FQ static contract and existing local crop-normalization smoke
   patterns. Do not wholesale merge side-worktree code.

3. Either:

   - create the smallest reviewed main-branch smoke target named by the M3FQ
     contract,
     `scripts/run_return_to_form_tier0_detector0_strict_gate_crop_normalization_smoke.py`,
     and run at most one local diagnostic command that writes a tracked receipt;
     or
   - if the smoke cannot be made safe in one slice, write the exact blocker and
     the smallest next file/function/test target.

The local smoke may produce diagnostic metrics or accounting evidence only. It
must not create a promoted artifact, update browser/model claim surfaces, or
claim recognizer/Detector 0 readiness.

## Receipt

Write:

`docs/validation/return-to-form-m3fr-detector0-strict-gate-local-smoke-no-brev-v1.json`

The receipt must include:

- current HEAD and active prompt;
- M3FQ contract hash and strict-gate values used;
- exact main-branch files inspected and changed;
- whether the named smoke script was created and run, or exact blocker;
- local smoke command, runtime bound, output paths, and metrics if run;
- claim-surface proof for model card, Detector 0 card, and active vocabulary;
- Brev read-only default-off state;
- forbidden actions not run;
- changed files;
- exactly one next action.

Allowed next actions:

- `continue_detector0_strict_gate_metric_triage_no_brev` if the local smoke ran
  and produced diagnostic metrics needing interpretation.
- `continue_detector0_strict_gate_contract_repair_no_brev` if the smoke exposed
  a local contract bug that can be repaired without Brev or promotion work.
- `continue_fail_closed_interactive_product_hardening` if Detector 0 local smoke
  is blocked or not useful enough for the deadline.
- `continue_openai_or_gpt_pro_research` if the next Detector 0/model move would
  be speculative without outside strategy review.
- `stop_for_human_budget_or_claim_review` if claims, spend, source scope, or
  final-gate changes require human review.

## Session Log

Write:

`docs/session-logs/594-mission-3fr-detector0-strict-gate-local-smoke-no-brev.md`

## Hard Boundaries

- Local Mac only; max spend `$0`; read-only `brev ls --json` is allowed.
- No Brev start/exec/sync/copy/stop, remote command, package install, duplicate
  worker, or GPU/cloud spend.
- No export, model-card promotion, active-vocabulary promotion, browser
  recognition activation, runtime Detector 0 authority, final-gate weakening,
  or product/model readiness claim.
- No source-register edit, source/media import, manifest/tensor/packet/
  vocabulary mutation except a tracked diagnostic receipt created by the local
  smoke.
- No pretrained detector, landmark model, backbone, embedding, teacher logits,
  MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP, `from_pretrained`,
  `pretrained=True`, pseudo-labels, generated labels, or machine-generated
  landmarks in the promoted lane.
- No raw learner video/frame upload.
- No wholesale merge from `/Users/kelly/Developer/asl-pilot-detector0-win`.
- No fake recognizer output, fake detector boxes, Detector 0 tracking authority
  claim, ASL correctness claim, model-readiness claim, product-readiness
  overclaim, push, amend, destructive reset, or no-verify commit.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3FR.
2. Required local checks pass or record exact blockers.
3. The M3FQ strict-gate contract is consumed as the source of truth.
4. The named local smoke script is created and run once with diagnostic output,
   or the receipt records the exact blocker and next file/function/test target.
5. Claim surfaces remain fail-closed.
6. No forbidden Brev, source, export, promotion, browser activation, or
   unsupported claim work occurred.
7. A tracked receipt and numbered session log exist and select exactly one next
   action.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-spend, makes a bounded
  smoke or exact-blocker step, preserves fail-closed claims, and selects one
  allowed next action.
- NUDGE if it misses contract hash/values, smoke runtime/output accounting,
  changed-file accounting, forbidden-action proof, or exactly one next action.
- REDIRECT if it attempts Brev work, export/promotion, browser activation,
  source import, wholesale side-tree merge, or claim expansion.
- ESCALATE if the next Detector 0/model move would be speculative after this
  local smoke.
- STOP if the next meaningful step requires human budget, source, or claim
  approval.
