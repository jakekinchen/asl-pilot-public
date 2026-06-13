# Return-To-Form Overnight Recovery And Brev Unblock Goal Loop Prompt

Mission 3AR prompt for the Codex executor after Mission 3AQ. Read
[`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Recover the overnight path toward the full ASL Pilot project goal without
pretending weak model evidence is ready. Unblock Brev if the current NVIDIA
login challenge is completed, preserve cost controls, run useful product QA,
and write an evidence-backed next-build decision that can choose between a
bounded GPU run, a product-first fail-closed demo, a composable recognizer
contract, or a new source/annotation step.

This is an orchestration and recovery mission, not a final-promotion mission.
The browser model remains fail-closed unless a later mission satisfies the
existing promotion gates.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   the Original Plan Spine and Mutable Tactical Overlay.
4. Recent ASL Citizen evidence:
   - [`docs/validation/return-to-form-asl-citizen-reduced-module-local-training-smoke-v1.json`](../validation/return-to-form-asl-citizen-reduced-module-local-training-smoke-v1.json)
   - [`docs/validation/return-to-form-asl-citizen-generalization-diagnosis-v1.json`](../validation/return-to-form-asl-citizen-generalization-diagnosis-v1.json)
   - [`docs/validation/return-to-form-asl-citizen-high-signal-module-selection-v1.json`](../validation/return-to-form-asl-citizen-high-signal-module-selection-v1.json)
5. Prior detector/crop-normalization evidence:
   - [`docs/validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json`](../validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json)
   - [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json)
   - [`artifacts/research/observer-201-localization-strategy-api-response.md`](../../artifacts/research/observer-201-localization-strategy-api-response.md)
   - [`artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md`](../../artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md)
6. Product and model honesty surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)
   - [`web/package.json`](../../web/package.json)
7. Brev and pair runbooks:
   - [`docs/runbooks/brev-rawframe-training-handoff.md`](../runbooks/brev-rawframe-training-handoff.md)
   - [`docs/runbooks/codex-goal-loop.md`](../runbooks/codex-goal-loop.md)
   - [`docs/runbooks/observer-runbook-codex.md`](../runbooks/observer-runbook-codex.md)

## Current Evidence

Mission 3AQ completed a real seven-label ASL Citizen local MPS training smoke
from random initialization. It is useful evidence, but not readiness evidence:

- train accuracy: `0.4642857142857143`
- validation accuracy: `0.25925925925925924`
- validation macro-F1: `0.19480519480519481`
- test top-1: `0.21428571428571427`
- test macro-F1: `0.12558869701726846`
- no negative challenge, no calibrated provenance, no ONNX export, no browser
  activation, and no model-card promotion

Brev is currently blocked on NVIDIA login. A `brev login --skip-browser`
attempt opened a browser security challenge that requires a human 2FA code.
Until that completes, `brev ls --json` still exits at auth.

The prior Detector 0 branch is not automatically revived. The retained
detector evidence says coarse localization/crop normalization is architecturally
valuable, but the current no-new-source union-target path did not justify
more detector training without a new data/target decision.

## Required First Slice

Complete one bounded recovery slice. Do not drift into a broad training retry.

1. Run quick state checks:

```sh
git status --short --branch
git log -8 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
```

2. Check Brev auth and cost-control state:

```sh
brev ls --json
```

If still logged out, record the exact auth blocker and continue local work. Do
not loop login attempts. Do not delete, reset, create a duplicate worker, or
start paid compute while auth is blocked.

If auth is restored, inspect the current worker state before any training:

```sh
brev ls --json
brev exec asl-pilot-rawframe-001 "ps -eo pid,etime,pcpu,pmem,args | egrep 'python|torch|train|screen|tmux' | grep -v egrep || true"
```

Use the existing worker if it exists. Do not create a duplicate worker while a
usable one exists. If a worker is running idle and no bounded run is selected,
stop it and verify it no longer reports `RUNNING`.

3. Write a tracked decision receipt at
`docs/validation/return-to-form-overnight-recovery-decision-v1.json`.

The receipt must compare these routes with evidence:

- **ASL Citizen reduced-module continuation:** whether a longer or different
  local/Brev run is justified after M3AQ's weak seven-label metrics.
- **PopSign/Tier-0 continuation:** whether retained PopSign evidence and
  source rights make it a better no-pretrained recognizer target before 4am.
- **Composable fixed-crop CNN+TCN contract:** whether the next useful build is
  a multi-stream crop encoder plus temporal model contract over existing
  tensors, without claiming trained readiness.
- **Detector 0 / landmark decomposition:** whether current detector evidence
  supports new training, or whether it needs new manual annotations/source
  review before more detector work.
- **SemLex / phonology support:** whether SemLex/ASL-LEX should be used now as
  vocabulary/phonology/reranking research only, or whether source-register
  work is required first.
- **Product-first interactive finish:** what browser/product work can produce
  a strong honest demo even while the recognizer remains fail-closed.

The receipt must select exactly one next action and explicitly say whether a
new milestone prompt was created or is needed.

4. Run product QA on the current interactive app:

```sh
cd web
npm run typecheck
npm run build
```

Then start a local dev server on an available port and smoke at least `/`,
`/lesson`, and `/validation` with a real browser or Playwright. Capture
screenshot paths or command evidence in the receipt/session log. Fix only
high-impact, scoped product bugs discovered during this QA.

5. If Brev auth is restored and the decision receipt selects a bounded GPU
run, the run must be:

- a single command or tmux/screen job with a clear output directory;
- scoped to one selected dataset/vocabulary/architecture route;
- compatible with the no-pretrained audits;
- capped by the user's overnight compute intent: existing Brev balance plus up
  to about `$150` additional, approximately `$250` total;
- followed by artifact copyback, validation/evaluation, and stop verification.

If those conditions are not all true, do not launch the run. Create the next
prompt or STOP with a concrete blocker.

## Hard Boundaries

- No pretrained CV/sign/landmark/backbone/embedding/generated-label dependency
  in the promoted lane.
- No raw learner video upload.
- No final-readiness, browser-trained, threshold-promotion, or model-card
  claims unless existing promotion gates pass with evidence.
- No broad 75/80/95-label retry unless the decision receipt proves the smaller
  route is learning and the user-approved route/gates are explicit.
- No duplicate Brev worker, worker delete, worker reset, or unattended idle GPU.
- No source import, SemLex training use, or generated pseudo-labels without
  source-register review.
- No detector/landmark training unless the current detector evidence supports
  the selected target or a new manual/source annotation path is approved.
- No push.

## Acceptance Criteria

This milestone can close when:

1. Brev auth/cost-control state is checked and classified with evidence.
2. The M3AQ weak-metric result is compared against the retained PopSign,
   Detector 0, ASL Citizen, SemLex/phonology, and product-first routes.
3. A tracked overnight recovery decision receipt exists and selects exactly
   one next action.
4. Product QA runs on `web` and records typecheck/build/browser evidence, or a
   precise local blocker.
5. Any scoped product fixes are committed with validation.
6. If Brev is used, the job is bounded, logged, copied back, evaluated, and the
   worker stop state is verified.
7. The tactical overlay in
   [`docs/model/return-to-form-plan.md`](return-to-form-plan.md) names the
   receipt and exactly one next action.
8. Required local audits and `git diff --check` pass.
9. A numbered session log records commands, evidence, blockers, and next step.

## Observer Guidance

- CONTINUE if the selected next action is a local/no-spend product QA,
  script-contract, prompt, or evidence-remediation slice already bounded by
  this prompt.
- REDIRECT if the decision receipt proves a different milestone is now the
  best path.
- STOP if the next action requires human 2FA, new source approval, final-gate
  changes, unbounded paid compute, or manual data/annotation collection.
- ESCALATE with `openai-api-research` or `gpt-pro-research` before approving
  another speculative training-style retry when recent audited learning
  failures are not explained by a new, testable hypothesis.
- NUDGE if the executor treats weak learnability evidence as promotion
  evidence, skips product QA, skips Brev cost-control, or tries to revive
  Detector 0 without the retained blocker context.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Overnight recovery and Brev unblock.
Completed:            <Brev state, decision receipt, product QA/fixes>.
Evidence:             <receipt, commands, screenshots, logs, hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact auth/provider/source/data blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
