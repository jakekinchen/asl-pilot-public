# Return-To-Form M3FQ Detector 0 Crop-Normalized Recognizer Integration Goal Loop Prompt

Mission 3FQ prompt for the Codex executor after M3FP completed the bounded
retained-worker Fresh5 attempt and selected
`continue_detector0_integration_for_crop_normalized_recognizer`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Perform one local/no-spend Detector 0 crop-normalized recognizer integration
contract slice. The goal is to move the useful isolated Detector 0 strict-gate
crop evidence toward the main ASL Pilot recognizer pipeline without promoting
it to browser/runtime authority.

This mission is not another Brev run and not a model-promotion slice.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3FP receipt and session log:
   - [`docs/validation/return-to-form-m3fp-overnight-brev-detector-tcn-completion-v1.json`](../validation/return-to-form-m3fp-overnight-brev-detector-tcn-completion-v1.json)
   - [`docs/session-logs/590-mission-3fp-overnight-brev-detector-tcn-completion.md`](../session-logs/590-mission-3fp-overnight-brev-detector-tcn-completion.md)
4. Detector 0 side-worktree evidence, read-only:
   - `/Users/kelly/Developer/asl-pilot-detector0-win`
   - `/Users/kelly/Developer/asl-pilot-detector0-win/docs/session-logs/416-detector0-hybrid-crop-normalization-ablation.md`
   - `/Users/kelly/Developer/asl-pilot-detector0-win/docs/session-logs/417-detector0-hybrid-gate-ablation.md`
   - `/Users/kelly/Developer/asl-pilot-detector0-win/docs/validation/return-to-form-tier0-detector0-hybrid-crop-normalization-ablation-v1.json`
   - `/Users/kelly/Developer/asl-pilot-detector0-win/docs/validation/return-to-form-tier0-detector0-hybrid-gate-ablation-v1.json`
5. Main-branch model and crop-related code:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - existing Detector 0 / crop-normalization scripts under [`scripts/`](../../scripts/)
   - current fail-closed claim surfaces:
     [`web/public/model/model-card.json`](../../web/public/model/model-card.json),
     [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Required Slice

Complete exactly one smallest useful local integration step:

1. Run baseline checks:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
python3 -m json.tool docs/validation/return-to-form-m3fp-overnight-brev-detector-tcn-completion-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
git -C /Users/kelly/Developer/asl-pilot-detector0-win status --short --branch
git -C /Users/kelly/Developer/asl-pilot-detector0-win log -4 --oneline --decorate
brev ls --json
git diff --check
```

2. Inspect the side-worktree strict-gate evidence as read-only. Confirm the
   exact files, functions, receipts, and metrics that would need to move into
   main. Do not wholesale merge the side worktree.

3. Either:

   - port one minimal, reviewed, scratch-only Detector 0 crop-normalization
     integration contract into main and prove it with local dry-run/static
     checks only; or
   - if the port is not safe in one slice, write the exact integration blocker
     and the smallest next file/function/test target.

The preferred successful local outcome is a main-branch contract that can later
support crop-normalized recognizer training/evaluation with the strict
`manifest_validation_fp05_contact_gate`, while still making no product/runtime
authority claim.

## Receipt

Write:

`docs/validation/return-to-form-m3fq-detector0-crop-normalized-recognizer-integration-v1.json`

The receipt must include:

- current HEAD and active prompt;
- M3FP failed-gate summary and copied-artifact boundary;
- side-worktree commit, status, receipts inspected, and strict-gate metrics;
- exact main-branch files inspected and changed, if any;
- whether a minimal integration contract was ported or the exact blocker;
- local checks and dry-run/static proof;
- Brev read-only default-off state;
- fail-closed claim boundary;
- forbidden actions not run;
- changed files;
- exactly one next action.

Allowed next actions:

- `continue_detector0_crop_normalized_local_smoke_no_brev` if the contract is
  in main and the next step is a local no-Brev smoke/ablation.
- `continue_bounded_detector0_crop_normalized_brev_smoke` if local checks prove
  the contract and a bounded remote train/evaluate receipt is the next useful
  slice under the existing overnight approval.
- `continue_fail_closed_interactive_product_hardening` if Detector 0
  integration is blocked or not useful enough for the deadline.
- `continue_openai_or_gpt_pro_research` if the next Detector 0/model move would
  be speculative without outside strategy review.
- `stop_for_human_budget_or_claim_review` if claims, spend, source scope, or
  final-gate changes require human review.

## Session Log

Write:

`docs/session-logs/592-mission-3fq-detector0-crop-normalized-recognizer-integration.md`

## Hard Boundaries

- Local Mac only; max spend `$0`; read-only `brev ls --json` is allowed.
- No Brev start/exec/sync/copy/stop, remote command, package install, duplicate
  worker, or GPU/cloud spend.
- No recognizer training/fitting, completed checkpoint evaluation, architecture
  sweep, export, model-card promotion, active-vocabulary promotion, browser
  recognition activation, or final-gate weakening.
- No source-register edit, source/media import, manifest/tensor/vocabulary/
  packet mutation unless the mutation is the explicitly scoped main-branch
  integration contract and is backed by a receipt.
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

1. `GOAL.md` points at this prompt and names Mission 3FQ.
2. Required local checks pass or record exact blockers.
3. Side-worktree Detector 0 strict-gate evidence is inspected read-only.
4. One minimal main-branch integration contract is ported and locally checked,
   or the receipt records the exact blocker and next file/function/test target.
5. Claim surfaces remain fail-closed.
6. No forbidden ML, Brev, source, export, promotion, browser activation, or
   unsupported claim work occurred.
7. A tracked receipt and numbered session log exist and select exactly one next
   action.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-spend, makes a bounded
  integration-contract step, preserves fail-closed claims, and selects one
  allowed next action.
- NUDGE if it misses side-worktree provenance, strict-gate metrics, changed-file
  accounting, forbidden-action proof, or exactly one next action.
- REDIRECT if it attempts a wholesale side-worktree merge, Brev work, training,
  export/promotion, browser activation, source import, or claim expansion.
- ESCALATE if the next ML/Detector 0 move would be speculative after this
  integration contract.
- STOP if the next meaningful step requires human budget, source, or claim
  approval.
