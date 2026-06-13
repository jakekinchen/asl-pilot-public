# Return-To-Form SemLex Overlap Source Review No-Training Goal Loop Prompt

Mission 3BK prompt for the Codex executor after Mission 3BJ selected
`continue_semlex_overlap_and_source_review_no_training`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-training SemLex/ASL-LEX source and
vocabulary-overlap review. The goal is to determine whether a candidate
phonology-backed route is worth a later source-register or vocabulary handoff,
without importing media, approving sources, training, or changing product
claims.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3BJ route recovery evidence:
   - [`docs/validation/return-to-form-post-review-ml-route-recovery-v1.json`](../validation/return-to-form-post-review-ml-route-recovery-v1.json)
   - [`docs/session-logs/351-mission-3bj-post-review-ml-route-recovery.md`](../session-logs/351-mission-3bj-post-review-ml-route-recovery.md)
4. Source and vocabulary surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/model/dataset-and-training-plan.md`](dataset-and-training-plan.md)
   - [`docs/validation/supported-label-registry.json`](../validation/supported-label-registry.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - existing `docs/research/*semlex*`, `docs/research/*asl-lex*`, or
     `docs/research/*phonolog*` artifacts, if any.

## Required Slice

Complete exactly one source/vocabulary overlap review and write:

`docs/research/semlex-asl-lex-overlap-source-review-v1.json`

The artifact must include:

- source-register status for ASL-LEX and any SemLex source entries;
- whether ASL-LEX video use is currently allowed for model training;
- whether SemLex is present in the source register;
- exact vocabulary-overlap method and source vocabulary surfaces used;
- overlap results between current ASL Pilot vocabulary surfaces and any local
  SemLex/ASL-LEX/phonology artifacts already in the repo;
- candidate-only source notes and blockers;
- explicit statement that this is not source approval, media import, training
  readiness, browser readiness, or a claim promotion;
- exactly one next action.

Do not browse for new source terms unless a repo-local artifact explicitly
requires URL freshness. Do not add or edit source-register approvals in this
mission; proposed source-register changes may be listed only as candidate
follow-up text inside the review artifact.

## Validation

Run:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-post-review-ml-route-recovery-v1.json
python3 -m json.tool docs/research/semlex-asl-lex-overlap-source-review-v1.json
git diff --check
```

## Next Actions

Select exactly one:

- `continue_semlex_source_register_candidate_no_import`: if source/overlap
  evidence supports a bounded candidate source-register proposal without media
  import or training use.
- `continue_vocab_data_repair_no_training`: if the overlap review shows the
  useful next local step is vocabulary or data repair outside SemLex.
- `continue_detector0_annotation_or_schema_repair_no_brev`: if the source
  route remains blocked and Detector 0/schema repair is the next no-spend
  route.
- `continue_bounded_local_model_probe_no_brev`: only if the review identifies
  a concrete no-training route that justifies one later bounded local probe.
- `escalate_strategy_research`: if choosing among source/vocabulary/model
  routes is unclear and the cost of being wrong is high.
- `stop_for_human_source_approval`: if useful progress requires human source
  approval, account access, permission requests, or legal review.
- `stop_for_semlex_overlap_review_blocker`: if the review cannot be completed
  safely within no-training boundaries.

## Hard Boundaries

- No source import, source approval change, media download, generated
  pseudo-labels, or SemLex/ASL-LEX training use.
- No Brev login, worker inspection, worker lifecycle change, or paid compute.
- No training run, fitting, optimizer/backward pass, checkpoint, sweep, export,
  browser activation, final validation promotion, or final-gate change.
- No edits to model-card, claim-matrix, active-vocabulary, browser-bundle,
  Detector 0, or final-claim surfaces.
- No pretrained promoted-lane dependency.
- No raw learner video upload.
- No push.

## Acceptance Criteria

This mission can close when:

1. The active prompt is this M3BK prompt and `GOAL.md` names Mission 3BK.
2. The review artifact exists under `docs/research/` and records source status,
   overlap method/results, candidate-only notes, blockers, non-promotion
   language, and exactly one next action.
3. Claim surfaces remain fail-closed and unchanged.
4. No source import/approval change, media download, pseudo-label generation,
   Brev action, training/fitting/checkpoint/export, browser activation, final
   validation promotion, final-gate change, or push occurs.
5. Required audits and JSON validation pass or record exact blockers.
6. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE or REDIRECT if the artifact selects exactly one bounded local
  no-training source/vocabulary/Detector 0/TCN follow-up.
- STOP if the next step requires human source approval, manual data/labels,
  account credentials, Brev auth/spend, training, source import, media import,
  export/browser activation, final validation promotion, final-gate changes, or
  source/legal decisions.
- ESCALATE if source/vocabulary/model route selection remains ambiguous after
  the artifact.
- NUDGE if the executor skips the artifact, skips the source-register/overlap
  evidence, or treats candidate overlap as training approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3BK SemLex overlap and source review no-training.
Completed:            <one source/overlap review or blocker>.
Evidence:             <docs/research artifact, commands, source-register hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact source/vocabulary/human blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
