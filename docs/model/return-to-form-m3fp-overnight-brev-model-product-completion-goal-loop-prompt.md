# Return-To-Form M3FP Overnight Brev Model/Product Completion Goal Loop Prompt

## Status

Superseded before activation by the more concrete M3FP detector/TCN prompt:
[`docs/model/return-to-form-m3fp-overnight-brev-detector-tcn-completion-goal-loop-prompt.md`](return-to-form-m3fp-overnight-brev-detector-tcn-completion-goal-loop-prompt.md).

This file is retained as a broad activation draft only. `GOAL.md` must not
point here while the detector/TCN prompt exists, because the active prompt has
the exact PopSign Fresh5 motion-region-token command, Detector0-win review
requirement, copyback path, promotion gates, and stop/default-off contract.

Mission 3FP prompt for the Codex executor after M3FO parked the loop for human
demo acceptance, and the human explicitly redirected the project back to
overnight ML/product completion work.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Run one smallest useful overnight completion slice that moves ASL Pilot from a
fail-closed demo toward the best honest trained browser recognizer/product
claim available before **2026-05-29 04:00 CDT**.

This mission is no longer a no-spend packaging task. The human has explicitly
authorized bounded Brev use to unblock training/detector/model work. Use that
approval carefully: start from the smallest falsifiable local or remote action,
write receipts, stop compute when not actively needed, and do not promote any
model or product claim unless the existing gates pass.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread, including the explicit
   request to restart the pair, oversee them, unblock Brev usage, and push the
   project through overnight.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   `Original Plan Spine`, `Mutable Tactical Overlay`, `Milestone Ladder`, and
   `Observer Transition Rules`.
4. M3FO fail-closed package and stop:
   - [`docs/session-logs/588-mission-3fo-final-fail-closed-demo-evidence-package.md`](../session-logs/588-mission-3fo-final-fail-closed-demo-evidence-package.md)
   - [`docs/session-logs/589-observer-stop-m3fo-human-demo-acceptance-review.md`](../session-logs/589-observer-stop-m3fo-human-demo-acceptance-review.md)
   - [`docs/validation/return-to-form-m3fo-final-fail-closed-demo-evidence-v1.json`](../validation/return-to-form-m3fo-final-fail-closed-demo-evidence-v1.json)
5. M3FM/M3FN model/product evidence boundary:
   - [`docs/session-logs/583-mission-3fm-popsign-label-ladder-metric-triage-no-training.md`](../session-logs/583-mission-3fm-popsign-label-ladder-metric-triage-no-training.md)
   - [`docs/validation/return-to-form-m3fm-popsign-label-ladder-metric-triage-no-training-v1.json`](../validation/return-to-form-m3fm-popsign-label-ladder-metric-triage-no-training-v1.json)
   - [`docs/session-logs/586-mission-3fn-deadline-fail-closed-demo-finish.md`](../session-logs/586-mission-3fn-deadline-fail-closed-demo-finish.md)
   - [`docs/validation/return-to-form-m3fn-deadline-fail-closed-demo-finish-v1.json`](../validation/return-to-form-m3fn-deadline-fail-closed-demo-finish-v1.json)
6. Current claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)
7. Existing dataset/model scripts, manifests, and receipts under
   [`scripts/`](../../scripts/), [`data/manifests/`](../../data/manifests/),
   [`docs/validation/`](../validation/), and [`output/`](../../output/).
8. Fresh Brev state from read-only `brev ls --json` and, if useful, current
   price/availability from `brev search --stoppable --min-vram 40 --sort price --json`.

## Human Approval And Compute Envelope

The active prompt records current human approval for bounded remote compute.
This satisfies the repo's Brev guardrail for the envelope below only.

- Deadline: stop overnight work at **2026-05-29 04:00 CDT** unless a later
  human instruction extends it.
- Budget: do not exceed **$150 additional Brev spend** from this activation,
  and do not knowingly exceed **$250 total project Brev spend**. If exact
  account spend is not visible, estimate conservatively from instance hourly
  price and wall-clock runtime and stop early.
- Preferred worker: reuse retained `asl-pilot-m3eh-l40s-001` / `3d58wpy9o`
  if it starts cleanly. Current observed state before activation was
  `STOPPED`, `NOT READY`, `HEALTHY`, `l40s-48gb.1x`.
- Price guard: current read-only search showed `l40s-48gb.1x` as the cheapest
  stoppable >=40GB VRAM option at about `$1.74/hr`. Prefer that class unless
  unavailable or technically insufficient.
- Allowed lifecycle actions inside this prompt: `brev start`, `brev shell` or
  `brev exec`, file sync/copyback needed for the run, and `brev stop`.
- Do not create a new paid worker unless the retained worker is unusable and
  the executor records why a cheaper/current stoppable alternative is needed.
- Stop/default-off rule: stop the worker when no active remote command is
  running or queued. Leaving it running is allowed only while a command is
  actively training/evaluating/syncing and the session log names the command,
  expected max runtime, and next teardown check.
- Kill conditions: stop the run if setup fails twice with the same blocker,
  if a bounded experiment exceeds its stated max runtime, if validation/test
  metrics collapse near chance or into a single-label predictor again, or if
  the next step would require a new source/import/pretrained dependency not
  approved in this prompt.

## Strategy

Do not blindly repeat the failed broad 95-label PopSign ladder. M3FM showed
near-chance top-1, very low macro-F1, many zero-recall labels, and dominant
`boy` predictions. Treat that as diagnostic evidence that the next ML step must
reduce uncertainty before spending larger compute.

Work as composable subproblems:

1. **Dataset/vocabulary decision:** choose the smallest evidence-backed target
   vocabulary that can plausibly train overnight. Prefer 5/10/20/25 high-signal
   modules or existing fresh/region-grid manifests over broad 75/95-label runs.
2. **Crop/input normalization:** use existing fixed crops, region-grid, hand
   union/contact packets, or scratch Detector 0 evidence where available.
   Full hand/posture/face landmark detectors are not required before a useful
   recognizer attempt; landmarks remain auxiliary unless a scratch-trained
   source is already proven.
3. **Recognizer:** train/evaluate the smallest raw-frame temporal recognizer
   that can answer the chosen target claim. TCN/compact 3D CNN paths are valid
   if their manifests and command contracts are ready.
4. **Validation:** require signer/clip-disjoint evaluation where available,
   hard-negative FAR evidence, no zero-accepted-true classes for a promoted
   module, and calibrated threshold/provenance receipts before any activation.
5. **Product integration:** only export/promote/browser-activate if the model
   clears the existing promotion gates. Otherwise keep fail-closed product
   surfaces honest and package the best diagnostic evidence.

If local inspection finds that all ready training paths are still structurally
bad, the useful slice is to repair the exact contract, manifest, or source
decision that blocks the smallest viable experiment. Do not spend compute on a
known-bad command just to show activity.

## Required Slice

Complete exactly one reviewable slice. It must do at least one of the
following:

- run one bounded remote Brev training/evaluation experiment and copy back a
  receipt, checkpoint/report, or exact failure artifact;
- repair the specific local/remote contract that prevents the next bounded
  Brev experiment, then prove the repaired dry-run or preflight;
- select and document the next overnight dataset/vocabulary/architecture
  target from existing manifests using concrete evidence, then hand the
  executor to the exact command to run next;
- harden product/browser integration only if a trained/promotable artifact
  already exists and the promotion gates are in reach.

Do not end with planning-only prose unless the slice records a concrete blocker
that makes execution unsafe or impossible.

Start with:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
brev ls --json
```

Then inspect the smallest relevant manifests/scripts/receipts before choosing
the action. Useful starting surfaces include:

```sh
rg --files data/manifests docs/validation output scripts | rg 'fresh5|label-ladder|region-grid|lesson|high-signal|detector|rawframe|train_rawframe|evaluate_rawframe'
python3 -m json.tool docs/validation/return-to-form-m3fm-popsign-label-ladder-metric-triage-no-training-v1.json >/dev/null
```

Write a numbered session log:

`docs/session-logs/590-mission-3fp-overnight-brev-model-product-completion.md`

If the slice runs or prepares Brev work, also write a JSON receipt under
`docs/validation/` with:

- command(s), start/end timestamps, worker id/name/type, price estimate, and
  estimated spend;
- source/manifests/tensors/scripts inspected or used;
- stdout/stderr/log/report/checkpoint paths and hashes for copied artifacts;
- validation metrics or exact setup/training failure;
- kill-condition and teardown/default-off result;
- claim-surface state after the slice.

Commit only scoped prompt/session/receipt/code/data-manifest changes. Do not
push.

## Hard Boundaries

- No pretrained CV/sign/landmark/model dependencies in the promoted lane.
- No raw learner video upload during normal practice.
- No new dataset import or source approval without source-register evidence.
- No generated-label or weak-supervision source in the promoted lane unless a
  later prompt explicitly approves it and records provenance/disclosure.
- No broad 75/95-label training retry unless a smaller evidence-backed module
  has already cleared its sanity gates or the run is explicitly diagnostic and
  capped.
- No model export, model-card promotion, active-vocabulary promotion, browser
  recognition activation, or ASL correctness claim unless the existing
  evaluation/promotion/audit chain passes.
- No fake recognizer output, fake detector boxes, fake avatar tracking,
  final-readiness overclaim, push, amend, destructive reset, or no-verify
  commit.
- If Brev is started, stop it before ending unless an active approved command
  is still running and the session log records the next teardown check.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3FP prompt and no stop sentinel is present.
2. The slice produces a concrete artifact: a bounded run result, repaired
   command contract, evidence-backed next training target, or gated product
   integration result.
3. Any remote compute use stays inside the deadline/budget envelope and has a
   teardown/default-off record.
4. Claim surfaces remain honest: fail-closed unless promotion gates pass.
5. Existing audits relevant to the slice pass or blockers are recorded exactly.
6. The session log exists and selects exactly one next action:
   `continue_overnight_brev_training_experiment`,
   `continue_dataset_vocab_decision`,
   `continue_detector_crop_model_repair`,
   `continue_product_interactivity_hardening`,
   `escalate_strategy_research`,
   `promote_model_if_gates_passed`, or
   `stop_for_human_compute_or_claim_review`.

## Observer Guidance

- CONTINUE if the executor made concrete progress and selected a bounded next
  action inside this prompt.
- NUDGE if the executor is doing useful work but lacks command hashes, spend
  accounting, teardown/default-off evidence, or claim-surface proof.
- REDIRECT if the executor drifts into broad blind training, unapproved source
  import, pretrained dependencies, product overclaiming, or unbounded compute.
- ESCALATE to GPT Pro/OpenAI API research only for a technical ML strategy
  blocker that local evidence cannot resolve, and include the exact local
  metrics/manifests/scripts in the research prompt.
- STOP only when the deadline/budget envelope is exhausted, a human claim
  decision is required, or the project reaches a packageable honest endpoint.

## Progress Ledger

```text
Current state:        Mission 3FP overnight bounded Brev/model/product completion.
Completed:            <bounded run, repair, target decision, integration result, or blocker>.
Evidence:             <commands, artifacts, hashes, metrics, spend, teardown>.
Remaining:            <next bounded action or human decision>.
Blockers:             <none, or exact blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
