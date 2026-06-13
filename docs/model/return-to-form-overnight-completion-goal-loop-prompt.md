# Return-To-Form Overnight Completion Goal Loop Prompt

Mission 3AH prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Push the project toward the real final state overnight: a browser-first ASL
learning app with the strongest honest interactive demo, a scratch-trained
no-pretrained model path pursued on Brev when evidence supports it, and clear
fallback claims when evidence does not. The user explicitly reauthorized remote
compute for this mission; use it intentionally, with receipts and teardown.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AH.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   the Original Plan Spine, Milestone Ladder, and M3AE-AP/M3AF/M3AG evidence.
4. Current Brev receipt:
   [`docs/validation/return-to-form-overnight-brev-readiness-v1.json`](../validation/return-to-form-overnight-brev-readiness-v1.json).
5. Current ML evidence:
   - [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json)
   - [`docs/validation/return-to-form-tier0-microprobe-config-smoke.json`](../validation/return-to-form-tier0-microprobe-config-smoke.json)
   - [`artifacts/research/observer-201-localization-strategy-api-response.md`](../../artifacts/research/observer-201-localization-strategy-api-response.md)
   - [`artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md`](../../artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md)
6. Current product evidence:
   - [`docs/validation/return-to-form-reduced-product-claim-v1.md`](../validation/return-to-form-reduced-product-claim-v1.md)
   - [`docs/validation/return-to-form-human-demo-review-v1.md`](../validation/return-to-form-human-demo-review-v1.md)
   - [`web/src/components/PracticeApp.tsx`](../../web/src/components/PracticeApp.tsx)
   - [`web/src/components/LessonApp.tsx`](../../web/src/components/LessonApp.tsx)
   - [`web/src/components/RobotMannequin3D.tsx`](../../web/src/components/RobotMannequin3D.tsx)
   - [`web/src/app/validation/page.tsx`](../../web/src/app/validation/page.tsx)
7. Model claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
8. Existing scripts under [`scripts/`](../../scripts/). Prefer extending or
   reusing existing audits/training scripts over inventing a parallel system.

## Intended Outcome

The finished project should be as close as current evidence and time allow to:

- an interactive `/` and `/lesson` experience that feels demo-ready;
- `/validation` that truthfully explains the active model/product claim;
- a no-pretrained, scratch-trained Detector 0 / crop / temporal-recognizer
  path tested with PopSign Tier 0 data first;
- a browser artifact only if validation gates honestly support it;
- otherwise a clearly documented reduced claim with model evidence and next
  data/source steps.

Do not turn weak ML evidence into a product claim. Do not keep polishing docs
if the next measurable blocker is a runnable training or validation experiment.

## User-Approved Compute Envelope

The latest user instruction explicitly authorizes Brev usage for this mission.
Use the existing worker first:

```text
workspace: asl-pilot-rawframe-001
id: 2hl1hytty
gpu: NVIDIA A100-SXM4-80GB
budget ceiling for this push: up to 250 USD total, including the existing 100
  USD balance and up to 150 USD additional pay-as-you-go if required
deadline window: overnight through 2026-05-27 04:00 America/Chicago
```

Rules:

- This approval satisfies the supervised loop's generic "do not spend Brev
  money without explicit user approval" guardrail. Do not reinterpret that
  generic guardrail as a ban while Mission 3AH remains active.
- Do not create a duplicate worker unless the existing worker is proven
  unusable and the session log records why.
- Before each remote run, record `brev ls --json`, planned command, expected
  signal, max runtime, max spend, and kill condition.
- Use `/home/shadeform/asl-pilot/.venv/bin/python` on Brev; it has
  `torch 2.12.0+cu130`, CUDA available, and an A100 tensor smoke passed in the
  M3AH activation receipt.
- Sync the repo before remote work. `scripts/brev_sync_repo.sh` now includes
  `data/annotations`; if sync fails, fix sync before training.
- Monitor long jobs. Kill a run if it is hung, using CPU only accidentally, or
  clearly cannot produce the expected signal.
- Copy back artifacts before teardown. Stop the worker and verify stopped state
  after the remote work is complete or no longer useful. If Brev still reports
  `RUNNING`, log it as a provider/cost-control blocker; do not delete/reset
  without explicit approval.

## Dataset And Vocabulary Policy

Start with the existing return-to-form Tier 0 PopSign set:

```text
please, table, dad, grandpa, hat
```

PopSign v1 raw videos are the current approved source for this pilot. SemLex /
ASL-LEX phonology remains candidate-only until source-register evidence and a
vocabulary-overlap artifact exist. ASL Citizen and WLASL remain narrow
school-assignment sources only where already registered. Do not use
MediaPipe/OpenPose/YOLO/pretrained-generated labels in the promoted lane.

If the Tier 0 signs are not learnable under signer-disjoint validation, do not
expand blindly. First write a data/vocabulary decision artifact that explains
whether to:

- reselect a cleaner 5-sign PopSign Tier 0 set;
- add source-reviewed phonology/reranking support;
- collect first-party clips;
- stop with the reduced claim.

## Execution Priority

Work in this order unless current evidence proves a different next step is
higher leverage:

1. **Brev readiness and sync.** Prove remote repo, data allowlist, annotation
   packets, `.venv`, CUDA, and the exact first runnable ML command.
2. **Detector 0 decision.** Use current M3AE-AP evidence. If a bounded remote
   run can test a concrete detector improvement, run it. If the evidence says
   detector data/targets are too weak, do not burn GPU; write the data/vocab
   decision artifact instead.
3. **Recognizer proof.** Only after the crop/input path is coherent, run a
   small from-scratch temporal recognizer proof on Tier 0. Prefer crop-identity
   inputs and a TCN-style temporal head if the repo already supports or can
   narrowly support it. Do not train broad 75/95-label models first.
4. **Browser/product integration.** If a trained artifact clears gates, export
   through existing ONNX/model-card scripts and verify browser inference. If it
   does not clear gates, improve the interactive reduced demo and make
   `/validation` explain the honest state.
5. **Evidence closeout.** Write validation/session artifacts with metrics,
   hashes, commands, Brev cost state, and next action. Do not push.

## First Reviewable Slice

Do this first:

1. Re-run local premise and source audits.
2. Sync the current repo and required data to Brev.
3. On Brev, prove:
   - current repo prompt files are present;
   - `data/annotations`, `data/manifests`, `data/tensors`, and PopSign raw
     paths exist;
   - `.venv/bin/python` imports torch and sees CUDA;
   - the exact candidate Detector 0 or recognizer command can pass a dry-run,
     `--help`, or smallest no-training/preflight mode.
4. Write/update the Brev readiness receipt with commands, outputs, and exactly
   one next action.
5. Write a numbered session log and commit only scoped files.

If this slice is already proven by the activation commit or
[`docs/validation/return-to-form-overnight-cuda-smoke-v1.json`](../validation/return-to-form-overnight-cuda-smoke-v1.json),
proceed to the next smallest ML or product slice and cite the receipt.

After the CUDA smoke receipt, prefer one of these next actions:

1. a better-defined Tier 0 CUDA recognizer experiment with uncapped validation
   and test metrics;
2. a narrow code slice adding CUDA support to the bounded Detector 0 scripts if
   detector work is the best next step;
3. a data/vocabulary decision artifact if the smoke confirms split/source
   limits are dominating;
4. product interaction polish only when there is no runnable ML experiment with
   a clear signal.

## Acceptance Criteria

The full mission is complete only when all applicable items are true:

1. `GOAL.md` points at this prompt and names Mission 3AH.
2. Return-to-form, loop-premise, source-register, no-pretrained, and relevant
   product/model audits pass.
3. Brev remote readiness is proven or the exact provider blocker is recorded.
4. Dataset/vocabulary choices are deliberate and source-register-compatible.
5. Any Detector 0/recognizer training is from random initialization with
   `pretrained_components: []`.
6. Any promoted model has signer-disjoint validation, hard-negative evaluation,
   thresholds, model card, ONNX export, and browser smoke evidence.
7. If promotion is not achieved, the reduced interactive demo remains honest,
   useful, and fail-closed, with `/validation` explaining why.
8. Every remote run has a receipt, max runtime/spend, copied-back artifacts or
   explicit no-artifact reason, and teardown verification.
9. The observer confirms progress is real ML/product progress, not just prompt
   churn, and escalates to API/GPT research before repeated speculative
   training retries.

## Allowed Changes

- Prompt/docs/audit updates that keep the loop aligned with this mission.
- Brev sync/environment/runbook fixes needed for remote training.
- Data/vocabulary decision artifacts and source-overlap artifacts.
- Scoped training/evaluation/export code changes that preserve no-pretrained
  and source boundaries.
- Product UI, route, lesson, camera, validation, and smoke-test improvements
  that make the demo more interactive and truthful.

## Hard Boundaries

- No pretrained detectors, landmarks, backbones, embeddings, pseudo-labels, or
  pretrained-generated annotations in the promoted lane.
- No raw learner video upload in normal browser practice.
- No hand-edited model-card promotion.
- No final-readiness claim unless all gates pass.
- No broad 75/95-label training before the small Tier 0 path is coherent.
- No source import or approval without source-register evidence.
- No `git push`, `--amend`, `--no-verify`, destructive reset, worker delete, or
  worker reset without explicit user approval.

## Technical Blocker Escalation

Use `openai-api-research` or `gpt-pro-research` when a concrete technical
blocker could change the architecture, data choice, training budget, or product
claim. Save the artifact under `artifacts/research/`, bind it to local evidence,
and reduce it to exactly one next action. Do not use research as a substitute
for running an already-defined local or Brev proof.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AH overnight completion.
Completed:            <smallest useful slice>.
Evidence:             <commands, artifacts, hashes, metrics, Brev state>.
Remaining:            <single next action>.
Blockers:             <none, or exact technical/source/cost/product blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
