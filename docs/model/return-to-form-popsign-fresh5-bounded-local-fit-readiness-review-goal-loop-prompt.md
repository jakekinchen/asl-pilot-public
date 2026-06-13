# Return-To-Form PopSign Fresh5 Bounded Local Fit Readiness Review Goal Loop Prompt

Mission 3DB prompt for the Codex executor after Mission 3DA selected
`draft_bounded_local_fit_readiness_review_no_training`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training readiness review for whether
the M3DA revised scratch architecture/input scaffold is ready to authorize one
future bounded local fit attempt.

This mission is a gate review only. Do not fit, train, construct an optimizer
for fitting, run backward, create checkpoints, run Brev, export, activate the
browser model, promote labels, change claim surfaces, mutate source/manifests/
tensors, or weaken final gates.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. Mission 3DA scaffold evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-scaffold-v1.json`](../validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-scaffold-v1.json)
   - [`docs/session-logs/442-mission-3da-popsign-fresh5-scaffold.md`](../session-logs/442-mission-3da-popsign-fresh5-scaffold.md)
4. Mission 3CZ contract packet:
   - [`docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-contract-v1.json`](../validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-contract-v1.json)
   - [`docs/session-logs/440-mission-3cz-popsign-fresh5-contract-packet.md`](../session-logs/440-mission-3cz-popsign-fresh5-contract-packet.md)
5. Mission 3CY design review and Mission 3CX strategy/downscope packet.
6. M3CR-M3CV collapse evidence and observer 435 strategy memo.
7. Current train/eval code and fail-closed claim surfaces:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
8. The return-to-form spine and tactical overlay:
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)

## Required Slice

Complete exactly one no-training readiness review.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-scaffold-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-design-review-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-strategy-downscope-decision-v1.json >/dev/null
python3 -m json.tool artifacts/research/observer-435-popsign-fresh5-post-collapse-strategy-api-request.json >/dev/null
python3 -m json.tool artifacts/research/observer-435-popsign-fresh5-post-collapse-strategy-api-raw.json >/dev/null
```

2. Inspect the M3DA scaffold receipt, current train/eval code, and fail-closed
   claim surfaces. Re-run only no-training checks if needed: import/compile,
   no-grad shape smoke, diagnostic-key assertions, parameter count, old-path
   compatibility, and JSON validation.

3. Decide whether a future bounded local fit prompt is justified. The review
   must require enough local evidence before any fitting prompt:

- scaffold registered and instantiates;
- B=1/B=2 no-grad shape smoke over RGB and derived-motion input passes;
- diagnostic keys needed for collapse localization exist;
- parameter count and retained diagnostic bytes fit the M3CZ scaffold budget;
- old-path compatibility remains intact;
- browser claims remain fail-closed;
- no source/manifest/tensor mutation or pretrained dependency was introduced;
- the proposed future fit has a single command envelope, strict local/no-spend
  scope, ignored output directory, max epoch/batch caps, metric success gates,
  collapse stop gates, artifact list, and no Brev/export/promotion/claim
  changes.

4. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-bounded-local-fit-readiness-review-v1.json`

The receipt must include:

- current HEAD and changed files;
- source-supported observations separated from inference;
- M3DA scaffold evidence reviewed;
- exact future local fit envelope if justified, or exact blockers if not;
- required success gates and stop gates for any future fit;
- proof that no training/fitting/optimizer/backward/checkpoint, Brev,
  source/manifest/tensor mutation, pretrained dependency, export, browser
  activation, model-card promotion, final-gate weakening, unsupported claim, or
  push occurred in this review;
- proof that browser recognition remains fail-closed;
- exactly one selected next action.

5. Select exactly one next action:

- `continue_bounded_local_fit_readiness_review_no_training`: if the review is
  incomplete or blocked.
- `continue_no_training_shape_budget_diagnostic`: if more no-training scaffold
  evidence is needed before a fit prompt can be defensibly written.
- `draft_bounded_local_fit_after_scaffold_no_brev`: if the review proves one
  bounded local/no-spend fit prompt is justified.
- `draft_product_downscope_reduced_claim_plan_no_recognition`: if the scaffold
  evidence does not support a defensible recognizer route but product work
  should continue with recognition fail-closed.
- `stop_for_human_architecture_input_scope_decision`: if the next meaningful
  step requires human approval on architecture complexity, code path, source,
  tensor, crop, budget, or final claims.
- `stop_scratch_recognizer_lane`: if no defensible no-pretrained, no-upload,
  browser-viable scratch route remains.

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

1. `GOAL.md` points at this M3DB prompt and names Mission 3DB.
2. The M3DA receipt exists and parses, or the session log records the exact
   missing-artifact blocker.
3. A tracked JSON receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-bounded-local-fit-readiness-review-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt separates source-supported observations from inference.
5. The receipt either proves one bounded local/no-spend fit prompt is justified
   with an exact future command envelope and gates, or records exact blockers.
6. The receipt does not approve Brev, export, promotion, source/data/tensor
   mutation, final-gate change, or browser recognition claims.
7. The receipt selects exactly one next action from this prompt.
8. Browser model claims remain fail-closed.
9. Required audits, receipt JSON validation, relevant no-training checks, and
   `git diff --check` exit `0` or record exact blockers.
10. A numbered session log records commands, evidence, blockers, changed
    files, and exactly one next action.

## Observer Guidance

- CONTINUE if the readiness review is bounded, local/no-spend, no-training,
  evidence-backed, no-Brev, fail-closed, and selects one bounded next action.
- NUDGE if the receipt lacks source-vs-inference separation, exact future fit
  envelope or blockers, no-training/Brev/export/promotion proof, fail-closed
  claim proof, or exactly one next action.
- REDIRECT if the executor trains, fits, mutates manifests/tensors/source
  approvals, switches datasets, promotes a model, edits claim surfaces, runs a
  sweep, runs Brev, or writes broad/unrelated implementation.
- STOP if the selected next action requires human budget, source, rights,
  annotation, crop, tensor, label, architecture/input, code-path, scope, or
  final-claim approval, or if the receipt selects `stop_scratch_recognizer_lane`.
- ESCALATE only if a new high-cost decision remains unclear after this
  no-training review and cannot be reduced locally without repeating prior
  analysis.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3DB PopSign fresh5 bounded local fit readiness review.
Completed:            <review result and receipt>.
Evidence:             <receipt, changed files, commands>.
Remaining:            <single next action>.
Blockers:             <none or exact blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
