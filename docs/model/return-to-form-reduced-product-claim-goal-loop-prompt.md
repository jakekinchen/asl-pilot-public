# Return-To-Form Reduced Product Claim Goal Loop Prompt

Mission 3AF prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Turn the stopped M3AE-AP evidence into the smallest honest product path: a
fail-closed, learn-only lesson/practice surface with explicit reduced claims.
This mission packages what is true now; it does not try to rescue the current
Detector 0 or recognizer lane with another training run.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AF.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-AP evidence and M3AF.
4. M3AE-AP receipt:
   [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json`](../validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json).
5. Lesson/product surfaces:
   - [`web/src/app/lesson/page.tsx`](../../web/src/app/lesson/page.tsx)
   - [`web/src/components/LessonApp.tsx`](../../web/src/components/LessonApp.tsx)
   - [`web/src/components/PracticeApp.tsx`](../../web/src/components/PracticeApp.tsx)
   - [`web/src/app/globals.css`](../../web/src/app/globals.css)
6. Model claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json), if present.
7. Audit scripts under [`scripts/audit_*.mjs`](../../scripts/), especially
   no-pretrained, source-register, loop-premise, and return-to-form audits.

## Intended Outcome

The repo has a clear reduced claim for the deadline:

- the browser app stays honest that no trained recognizer or promoted Detector
  0 is active;
- `/lesson` and `/` do not imply ASL correctness, live tracking, or pass/fail
  model readiness;
- the current model-card / active-vocabulary truth surfaces remain fail-closed;
- a validation artifact records what the app can honestly demonstrate now and
  what remains blocked;
- Brev/GPU stays unused except for stop/verification attempts.

## First Reviewable Slice

Start with read-only checks:

```sh
git status --short --branch
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_loop_premise.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
cd web && npm run typecheck
cd ..
brev ls --json
```

If no human-approved remote training job is queued or running, apply the Brev
default-off policy from `GOAL.md`: inspect for active training when possible,
run `brev stop asl-pilot-rawframe-001`, verify with `brev ls --json`, retry by
workspace id and `brev stop --all` if needed, and log any failed stop
verification. Do not delete or reset the workspace without explicit user
approval.

Then complete exactly one smallest useful packaging slice:

1. Inspect the current `/lesson` and `/` claim/copy/state surfaces from code.
2. Verify that model-card and active-vocabulary claims remain fail-closed.
3. Make only scoped product/doc changes needed to remove misleading readiness,
   auth, tracking, or correctness implications.
4. Write
   [`docs/validation/return-to-form-reduced-product-claim-v1.md`](../validation/return-to-form-reduced-product-claim-v1.md)
   with:
   - current model/tracker readiness truth;
   - supported demo path;
   - explicit unsupported claims;
   - commands run;
   - Brev status/stop-verification result;
   - remaining blockers;
   - exactly one next action.
5. Write a numbered session log and commit only scoped files.

## Allowed Changes

- Product copy, small UI state, route affordances, or docs that make the
  reduced claim clearer.
- Validation/report artifacts that separate "learn-only demo" from
  "trained recognition".
- Local browser smoke or typecheck/lint fixes needed to support the reduced
  claim.

## Hard Boundaries

- Do not run Detector 0 training, recognizer training, crop-normalization
  ablation, generic microprobe retry, controlled clip-heldout evaluation, or a
  broad training route.
- Do not use Brev for sync, SSH compute, remote training, or paid model work.
- Do not create a duplicate Brev worker.
- Do not import or approve new sources.
- Do not use MediaPipe, OpenPose, RTMPose, YOLO, pretrained landmarks,
  pretrained detector outputs, pretrained backbones, pretrained embeddings, or
  pretrained-generated labels in the promoted lane.
- Do not export ONNX, promote a model card, select product thresholds, weaken
  final gates, or claim final readiness.
- Do not push.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AF.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. The reduced-claim validation artifact exists at
   [`docs/validation/return-to-form-reduced-product-claim-v1.md`](../validation/return-to-form-reduced-product-claim-v1.md).
4. The artifact records the active model/tracker claim, demo path, unsupported
   claims, commands run, Brev status, and exactly one next action.
5. Any product copy or code edits preserve fail-closed behavior and local-only
   camera semantics.
6. No training, export, source approval, final-readiness claim, product
   threshold promotion, Brev compute, duplicate worker, or push occurs.
7. A numbered session log records the slice and the checkpoint commit.

## Next-Action Choices

Choose exactly one:

- `continue_reduced_product_packaging`: if the current slice clarified one
  reduced-claim surface and another bounded packaging surface remains.
- `stop_human_demo_review`: if the app is ready for a human demo review and
  further choices are UX/content decisions.
- `new_data_or_source_review_required`: if useful ML progress requires new
  consented data, source approval, or a changed research budget.
- `escalate_strategy_research`: if the reduced claim exposes a deeper plan
  conflict that needs API/GPT research before another milestone.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AF reduced product claim.
Completed:            <artifact/code/doc slice>.
Evidence:             <validation artifact, commands, Brev status>.
Remaining:            <single next action>.
Blockers:             <none, or exact human/source/compute blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
