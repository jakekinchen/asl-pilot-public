# Return-To-Form Post-Review Brev And ML Route Recovery Goal Loop Prompt

Mission 3BJ prompt for the Codex executor after Mission 3BI stopped for human
product review and the user explicitly renewed the broader full-project
objective.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one bounded post-review recovery slice that moves the project
toward the full trained browser recognizer objective without pretending the
current fail-closed product package is trained recognition.

The slice has two jobs:

1. classify the current Brev/NVIDIA auth and compute state with fresh command
   evidence; and
2. if Brev is still blocked by password/2FA, still advance the local ML/data
   route by choosing the next no-pretrained source, vocabulary, Detector 0, or
   TCN handoff from current evidence.

This prompt does not authorize broad 75/80/95-label training, pretrained
detectors or landmarks, pseudo-labels, source shortcuts, model-card promotion,
browser activation, final-readiness claims, unbounded paid compute, duplicate
Brev workers, password/2FA handling by the agent, or pushes.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3BI product-review stop evidence:
   - [`docs/validation/return-to-form-final-readiness-gap-audit-no-promotion-v1.json`](../validation/return-to-form-final-readiness-gap-audit-no-promotion-v1.json)
   - [`docs/session-logs/348-mission-3bi-final-readiness-gap-audit-no-promotion.md`](../session-logs/348-mission-3bi-final-readiness-gap-audit-no-promotion.md)
   - [`docs/session-logs/349-observer-stop-human-product-review.md`](../session-logs/349-observer-stop-human-product-review.md)
4. Current data/model blockers:
   - [`docs/validation/return-to-form-data-quality-contract-v1.json`](../validation/return-to-form-data-quality-contract-v1.json)
   - [`docs/validation/return-to-form-vocab-subset-contract-v1.json`](../validation/return-to-form-vocab-subset-contract-v1.json)
   - [`docs/validation/return-to-form-crop-region-contract-v1.json`](../validation/return-to-form-crop-region-contract-v1.json)
   - [`docs/validation/return-to-form-vocab-crop-separability-diagnosis-v1.json`](../validation/return-to-form-vocab-crop-separability-diagnosis-v1.json)
5. Retained Detector 0 and TCN evidence:
   - [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json)
   - [`docs/validation/return-to-form-region-grid-tcn-local-smoke-v1.json`](../validation/return-to-form-region-grid-tcn-local-smoke-v1.json)
   - [`docs/validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json`](../validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json)
6. SemLex / ASL-LEX and source-register surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/model/dataset-and-training-plan.md`](dataset-and-training-plan.md)
   - any existing `docs/research/*semlex*` or `docs/research/*asl-lex*`
     artifacts.
7. Prior Brev and overnight evidence:
   - [`docs/validation/return-to-form-overnight-brev-readiness-v1.json`](../validation/return-to-form-overnight-brev-readiness-v1.json)
   - [`docs/validation/return-to-form-overnight-cuda-smoke-v1.json`](../validation/return-to-form-overnight-cuda-smoke-v1.json)
   - [`docs/validation/return-to-form-asl-citizen-brev-training-v1.json`](../validation/return-to-form-asl-citizen-brev-training-v1.json)
8. Runbook and sync helpers:
   - [`docs/runbooks/brev-rawframe-training-handoff.md`](../runbooks/brev-rawframe-training-handoff.md)
   - [`scripts/brev_sync_repo.sh`](../../scripts/brev_sync_repo.sh)

## Current Evidence

Mission 3BI says the current `/`, `/lesson`, and `/validation` package is
adequate for fail-closed human review only. It also preserves:

- model card status: `not_trained`;
- active labels: `[]`;
- active CV claim: `null`;
- browser recognition enabled: `false`;
- Detector 0 tracking enabled: `false`;
- box-driven avatar enabled: `false`.

The latest live Brev probe still blocks before worker inspection:

- `brev ls --json` prompts for NVIDIA/Brev login and exits with EOF.
- `brev login --skip-browser`, with the existing email accepted, opens the
  NVIDIA password screen for `jakekinchen@gmail.com`.
- The agent must not type, request, persist, or handle the account password or
  2FA code. If the browser remains at the password/2FA screen, record that as
  the auth blocker and continue local no-spend route recovery.

M3BD says no current seven-label ASL Citizen subset is training-worthy. M3AX
proves the region-grid true TCN can memorize a tiny subset, while M3AW/M3AY
show held-out collapse and split/label/crop drift. M3AE-AP proves the latest
scratch Detector 0 union-target microprobe fits train but repeats held-out
failure. The next useful ML step must therefore be a route decision or a
narrow repair handoff, not another broad training retry.

## Required Slice

Complete exactly one smallest useful post-review recovery slice.

1. Run local state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/compile_true_tcn_architecture.py scripts/run_region_grid_tcn_tiny_overfit.py scripts/run_return_to_form_tier0_detector0_union_target_architecture_microprobe_v2.py
python3 -m json.tool docs/validation/return-to-form-final-readiness-gap-audit-no-promotion-v1.json
```

2. Establish Brev state without creating a duplicate worker:

```sh
brev ls --json
```

If already authenticated, also run:

```sh
brev search --gpu-name A100 --json
brev exec asl-pilot-rawframe-001 "ps -eo pid,etime,pcpu,pmem,args | egrep 'python|torch|train|screen|tmux' | grep -v egrep || true"
```

If logged out, a single login probe is allowed only to classify the blocker:

```sh
brev login --skip-browser
```

Accept the existing email if prompted. Do not type a password, ask for a
password, solve 2FA, persist a live login URL, or loop login attempts. If the
browser is at NVIDIA password/2FA, classify Brev as `human_password_or_2fa`.

3. Write a tracked receipt:

`docs/validation/return-to-form-post-review-ml-route-recovery-v1.json`

The receipt must include:

- command evidence for Brev auth state, with live login tokens redacted or
  omitted;
- whether any worker state, price, process list, or compute budget was
  inspectable;
- M3BI product-review boundary and the user continuation override;
- current fail-closed claim values;
- comparison of these routes:
  - **SemLex / ASL-LEX source and phonology overlap:** whether the next move is
    source-register and vocabulary-overlap work before training use.
  - **PopSign/Tier-0 repair:** whether retained PopSign/Tier-0 evidence can
    support a smaller training-worthy subset or needs new data/annotation.
  - **Scratch Detector 0 / crop-normalization:** whether M3AE-AP supports a
    new annotation/schema repair handoff before more detector training.
  - **Region-grid true TCN recognizer:** whether M3AW/M3AX/M3AY support a
    bounded local probe, or only data/vocab repair.
  - **Brev compute:** whether a paid micro-experiment is legal/safe now, and
    if so the exact run candidate and cost cap.
  - **Product-only work:** why it should not be the next default unless all
    ML/data/compute routes are blocked.
- exactly one next action.

4. If Brev is authenticated and the receipt selects remote compute, write the
compute section before any paid work. It must include worker id/name/status,
candidate price, exact command, max runtime, max spend, kill condition,
expected signal, copied-back artifact plan, and default-off cleanup plan.

Do not run remote training unless the receipt proves both:

- Brev auth/worker state is inspectable; and
- the selected route is training-worthy under current evidence.

5. If Brev is blocked, still complete the local route recovery receipt and
choose the next bounded local action. Preferred next-action order:

1. `continue_semlex_overlap_and_source_review_no_training`
2. `continue_detector0_annotation_or_schema_repair_no_brev`
3. `continue_vocab_data_repair_no_training`
4. `continue_bounded_local_model_probe_no_brev`
5. `escalate_strategy_research`
6. `stop_for_brev_password_or_2fa_required`
7. `stop_for_human_source_or_annotation_required`

Choose `stop_for_brev_password_or_2fa_required` only if no useful local
source/vocabulary/Detector 0/TCN handoff can be made without the login.

## Hard Boundaries

- No broad 75/80/95-label training.
- No pretrained detector, landmark, sign-recognition, pose, backbone,
  pseudo-label, or machine-generated promoted-lane dependency.
- No source import, source approval shortcut, SemLex training use, generated
  pseudo-labels, or new public-data training route without source-register
  evidence.
- No raw learner video upload.
- No duplicate Brev worker while an existing usable worker might exist.
- No paid run without a current compute receipt.
- No password, OTP, or 2FA handling by the agent.
- No model-card promotion, browser trained activation, threshold promotion,
  final-readiness claim, final-gate weakening, or positive ASL correctness
  claim unless a later validation gate explicitly authorizes the narrower
  action.
- No push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3BJ.
2. Brev auth state is proven by command output, or the precise human
   password/2FA blocker is recorded.
3. The route recovery receipt exists and compares SemLex/ASL-LEX, PopSign,
   Detector 0, region-grid true TCN, Brev compute, and product-only routes.
4. Exactly one next action is selected.
5. If remote compute runs, a compute receipt exists before the paid command,
   artifacts are copied back and hashed, and default-off handling is recorded.
6. If Brev is blocked, a local no-spend source/vocabulary/Detector 0/TCN
   handoff is selected unless the receipt proves that no local handoff is
   possible.
7. Required audits and JSON validation pass or record exact blockers.
8. A numbered session log records commands, evidence, budget/worker state,
   blockers, and exactly one next action.

## Observer Guidance

- CONTINUE or REDIRECT if the receipt selects one bounded local
  source/vocabulary/Detector 0/TCN handoff.
- CONTINUE only for paid compute if the receipt proves Brev auth/worker state,
  price, run command, cap, artifact plan, and cleanup/default-off handling
  before the run.
- STOP on unresolved password/2FA only if the executor also proves no local
  no-spend ML/data handoff is possible.
- STOP on unsafe duplicate workers, missing compute receipt, budget
  uncertainty, source approval needs, manual annotation/data needs, or
  final-gate/promotion claims.
- ESCALATE to API/GPT research before approving another speculative
  training-style retry when recent audited failures are not explained by a new,
  testable hypothesis.
- NUDGE if the executor treats product review readiness as trained model
  readiness, skips Brev auth classification, skips the local route comparison,
  or chooses product-only polish while ML/data routes remain available.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3BJ post-review Brev and ML route recovery.
Completed:            <auth proof, route receipt, compute receipt/run, or blocker>.
Evidence:             <receipt, commands, artifact hashes, budget/worker state>.
Remaining:            <single next action>.
Blockers:             <none or exact auth/provider/data/model/source blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
