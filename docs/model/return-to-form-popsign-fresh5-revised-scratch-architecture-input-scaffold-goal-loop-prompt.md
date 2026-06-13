# Return-To-Form PopSign Fresh5 Revised Scratch Architecture Input Scaffold Goal Loop Prompt

Mission 3DA prompt for the Codex executor after Mission 3CZ selected
`draft_revised_scratch_architecture_input_scaffold_no_training`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training revised scratch
architecture/input scaffold slice for PopSign fresh5.

Use the M3CZ contract to add the smallest reviewable scaffold for
`scratch_motion_region_token_temporal_contract_v1` and
`popsign_fresh5_rgb_regions_plus_derived_motion_tokens_v1`, with no fitting,
no optimizer/backward/checkpoint, no Brev, no export, no browser activation,
and no claim changes. The scaffold should be enough to verify shape,
parameter-count, no-pretrained, fail-closed, and representation-diagnostic
wiring before any later fitting decision.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. Mission 3CZ contract packet:
   - [`docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-contract-v1.json`](../validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-contract-v1.json)
   - [`docs/session-logs/440-mission-3cz-popsign-fresh5-contract-packet.md`](../session-logs/440-mission-3cz-popsign-fresh5-contract-packet.md)
4. Mission 3CY design review:
   - [`docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-design-review-v1.json`](../validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-design-review-v1.json)
   - [`docs/session-logs/438-mission-3cy-popsign-fresh5-revised-design-review.md`](../session-logs/438-mission-3cy-popsign-fresh5-revised-design-review.md)
5. Mission 3CX strategy/downscope packet and observer 435 API artifacts:
   - [`docs/validation/return-to-form-popsign-fresh5-strategy-downscope-decision-v1.json`](../validation/return-to-form-popsign-fresh5-strategy-downscope-decision-v1.json)
   - [`artifacts/research/observer-435-popsign-fresh5-post-collapse-strategy-api-response.md`](../../artifacts/research/observer-435-popsign-fresh5-post-collapse-strategy-api-response.md)
   - [`artifacts/research/observer-435-popsign-fresh5-post-collapse-strategy-api-request.json`](../../artifacts/research/observer-435-popsign-fresh5-post-collapse-strategy-api-request.json)
   - [`artifacts/research/observer-435-popsign-fresh5-post-collapse-strategy-api-raw.json`](../../artifacts/research/observer-435-popsign-fresh5-post-collapse-strategy-api-raw.json)
6. M3CW and M3CR-M3CV collapse evidence, especially the old-path collapse and
   representation diagnostics.
7. Current model/train/eval code paths:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
8. Current fail-closed claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
9. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Current Evidence

M3CZ binds `architecture_id:
scratch_motion_region_token_temporal_contract_v1` and `input_contract_id:
popsign_fresh5_rgb_regions_plus_derived_motion_tokens_v1`. The stored input is
existing approved PopSign fresh5 `rgb_regions` tensors with shape
`16x5x96x96x3`, dtype `torch.uint8`, and axis order `T,R,H,W,C`. Any motion
channels must be derived on the fly from approved tensors, without tensor
regeneration or manifest/source mutation.

The contract forbids early temporal pooling, preserves time-region identity
through temporal and cross-region interaction before final pooling, and
requires representation diagnostics and browser budget gates before any future
fitting. M3CZ does not authorize training, Brev, export, promotion, or browser
recognition claims.

## Required Slice

Complete exactly one smallest useful no-training scaffold slice.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-design-review-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-strategy-downscope-decision-v1.json >/dev/null
python3 -m json.tool artifacts/research/observer-435-popsign-fresh5-post-collapse-strategy-api-request.json >/dev/null
python3 -m json.tool artifacts/research/observer-435-popsign-fresh5-post-collapse-strategy-api-raw.json >/dev/null
```

2. Implement only the smallest scaffold needed to register or instantiate the
   revised no-pretrained architecture/input contract locally. Prefer extending
   existing model/input helper patterns over adding a parallel framework.

3. The scaffold must preserve existing behavior for the old
   `scratch_region_temporal_late_fusion_tcn_contract_v1` path unless a local
   test proves the change is intentionally isolated.

4. Run no-training verification only. Allowed checks include import/compile,
   unit-style no-grad shape smoke, deterministic random/input fixture forward
   pass, parameter count, and diagnostic key presence. Disallowed checks include
   fitting, optimizer construction for fitting, backward pass, checkpoint
   writing, model export, browser activation, or claim promotion.

5. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-scaffold-v1.json`

The receipt must include:

- current HEAD and changed files;
- source-supported observations separated from inference;
- implemented `architecture_id` and `input_contract_id`;
- exact tensor/motion-channel shape behavior verified by no-grad checks;
- parameter count and browser budget comparison against the M3CZ contract;
- representation diagnostic hook names or output keys added or verified;
- proof that old-path behavior is preserved or the exact blocker if it cannot
  be verified in this slice;
- negative authorization proof for training/fitting, Brev, checkpoint
  creation, tensor/manifest/source mutation, pretrained dependencies, export,
  browser activation, model-card promotion, final-gate weakening, unsupported
  claims, and push;
- proof that browser recognition remains fail-closed;
- exactly one selected next action.

6. Select exactly one next action:

- `continue_revised_scratch_architecture_input_scaffold_no_training`: if the
  scaffold is incomplete or blocked.
- `continue_no_training_shape_budget_diagnostic`: if the scaffold is present
  but shape, parameter, diagnostic, or old-path compatibility evidence needs a
  separate no-training packet.
- `draft_bounded_local_fit_readiness_review_no_training`: if scaffold and
  no-grad evidence pass and the next useful slice is a no-training review of
  whether one bounded local fit can be authorized.
- `draft_product_downscope_reduced_claim_plan_no_recognition`: if scaffold
  evidence fails to support a defensible recognizer route but product work
  should continue with recognition fail-closed.
- `stop_for_human_architecture_input_scope_decision`: if the next meaningful
  step requires human approval on architecture complexity, code path, source,
  tensor, crop, budget, or final claims.
- `stop_scratch_recognizer_lane`: if no defensible no-pretrained,
  no-upload, browser-viable scratch route remains.

## Hard Boundaries

- No training, fitting, optimizer construction for fitting, backward pass,
  checkpoint creation, sweep, second local retry, fresh10 training, 75/95-label
  training, or learned auxiliary diagnostic model.
- No Brev training, spend, worker lifecycle change, sync, remote command,
  teardown, file copy, or remote planning beyond optional read-only visibility.
- No tensor regeneration, manifest mutation, source-register mutation,
  vocabulary/label-set mutation, source import, media download, generated
  pseudo-label, source approval edit, or split mutation.
- No pretrained detector, landmark, backbone, embedding, model dependency,
  generated-label dependency, or pretrained-assisted data labeling.
- No ONNX export, browser model activation, active-label promotion,
  model-card promotion, final-readiness claim, final-gate weakening, product
  fallback that implies live ASL recognition, ASL correctness claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3DA prompt and names Mission 3DA.
2. The M3CZ receipt exists and parses, or the session log records the exact
   missing-artifact blocker.
3. A minimal scaffold exists or the session log records the exact blocker that
   prevented it.
4. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-scaffold-v1.json`
   or the session log records the exact blocker that prevented it.
5. The receipt separates source-supported observations from inference.
6. The receipt proves no-training shape, parameter-count, diagnostic-key, and
   fail-closed behavior for the scaffold, or records exact blockers.
7. The receipt does not approve fitting, Brev, export, promotion,
   source/data/tensor mutation, final-gate change, or browser recognition
   claims.
8. The receipt selects exactly one next action from this prompt.
9. Browser model claims remain fail-closed.
10. Required audits, receipt JSON validation, relevant compile/test/no-grad
    shape-smoke checks, and `git diff --check` exit `0` or record exact
    blockers.
11. A numbered session log records commands, evidence, blockers, changed files,
    and exactly one next action.

## Observer Guidance

- CONTINUE if the scaffold slice is bounded, local/no-spend, no-training,
  evidence-backed, no-Brev, fail-closed, and selects one bounded next action.
- NUDGE if the receipt lacks source-vs-inference separation, shape/parameter/
  diagnostic evidence, old-path compatibility proof, no-training/Brev/export/
  promotion proof, fail-closed claim proof, or exactly one next action.
- REDIRECT if the executor trains, fits, mutates manifests/tensors/source
  approvals, switches datasets, promotes a model, edits claim surfaces, runs a
  sweep, performs another local fitting attempt, or writes broad/unrelated
  implementation beyond the scaffold.
- STOP if the selected next action requires human budget, source, rights,
  annotation, crop, tensor, label, architecture/input, code-path, scope, or
  final-claim approval, or if the receipt selects `stop_scratch_recognizer_lane`.
- ESCALATE only if a new high-cost decision remains unclear after this scaffold
  slice and cannot be reduced locally without repeating prior analysis.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3DA PopSign fresh5 revised scratch architecture/input scaffold.
Completed:            <scaffold result and receipt>.
Evidence:             <receipt, changed files, commands>.
Remaining:            <single next action>.
Blockers:             <none or exact blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
