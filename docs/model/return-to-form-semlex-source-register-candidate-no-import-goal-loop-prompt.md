# Return-To-Form SemLex Source Register Candidate No-Import Goal Loop Prompt

Mission 3BL prompt for the Codex executor after Mission 3BK selected
`continue_semlex_source_register_candidate_no_import`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-import SemLex / ASL-LEX source-register
candidate proposal. The goal is to turn the M3BK source/overlap evidence gap
into a reviewable candidate boundary for metadata or phonology research,
without editing the source register, approving media, importing source data, or
creating training readiness by implication.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3BK source/overlap evidence:
   - [`docs/research/semlex-asl-lex-overlap-source-review-v1.json`](../research/semlex-asl-lex-overlap-source-review-v1.json)
   - [`docs/session-logs/354-mission-3bk-semlex-overlap-source-review.md`](../session-logs/354-mission-3bk-semlex-overlap-source-review.md)
4. Source policy surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/model/dataset-and-training-plan.md`](dataset-and-training-plan.md)
   - [`docs/validation/supported-label-registry.json`](../validation/supported-label-registry.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Required Slice

Complete exactly one candidate source-register proposal and write:

`docs/research/semlex-source-register-candidate-no-import-v1.json`

The artifact must include:

- M3BK review status and selected next action;
- current ASL-LEX register status and the exact video/training blocker;
- current SemLex source-register status;
- a candidate-only SemLex or ASL-LEX metadata/phonology boundary, if one can be
  proposed from repo-local evidence;
- explicit allowed and prohibited uses;
- whether the proposal requires human source/legal approval before any
  register edit, media import, training use, validation use, or pilot claim;
- explicit non-promotion language;
- exactly one next action.

Do not browse unless a repo-local source artifact explicitly requires URL
freshness. Do not edit `docs/model/dataset-source-register.json`; proposed
entries or wording may appear only inside the review artifact.

Completion bias for this mission: this is the final SemLex / ASL-LEX paperwork
loop unless it identifies a concrete repo-local, non-media metadata or
phonology surface that exists now and can be used without source approval edits,
media import, validation use, or training use. If the candidate proposal cannot
name that concrete local surface, do not select another SemLex continuation;
route the next action to Detector 0/schema repair, vocabulary/data repair, or
strategy escalation based on the evidence.

## Validation

Run:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/research/semlex-asl-lex-overlap-source-review-v1.json
python3 -m json.tool docs/research/semlex-source-register-candidate-no-import-v1.json
git diff --check
```

## Next Actions

Select exactly one:

- `continue_semlex_metadata_vocab_artifact_no_import`: if the candidate
  proposal supports a bounded local metadata/phonology vocabulary artifact
  without media import, source approval edits, validation use, or training use,
  and the required repo-local non-media metadata/phonology surface already
  exists.
- `continue_vocab_data_repair_no_training`: if the candidate source route does
  not help and the next useful local step is non-source vocabulary/data repair.
- `continue_detector0_annotation_or_schema_repair_no_brev`: if the source
  route remains blocked and Detector 0/schema repair is the next no-spend route.
- `escalate_strategy_research`: if choosing among source/vocabulary/model
  routes remains ambiguous and the cost of being wrong is high.
- `stop_for_human_source_approval`: if useful progress requires a source/legal
  approval decision, permission request, account access, media use, or manual
  legal review.
- `stop_for_semlex_source_register_candidate_blocker`: if no safe candidate
  can be proposed within no-import/no-approval boundaries.

## Hard Boundaries

- No source import, source approval change, source-register edit, media
  download, generated pseudo-labels, or SemLex/ASL-LEX training use.
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

1. The active prompt is this M3BL prompt and `GOAL.md` names Mission 3BL.
2. The candidate artifact exists under `docs/research/` and records source
   status, candidate-only boundaries, allowed/prohibited uses, human-approval
   needs, non-promotion language, and exactly one next action.
3. `docs/model/dataset-source-register.json` is unchanged unless a later human
   approval explicitly authorizes an edit.
4. Claim surfaces remain fail-closed and unchanged.
5. No source import/approval change, media download, pseudo-label generation,
   Brev action, training/fitting/checkpoint/export, browser activation, final
   validation promotion, final-gate change, or push occurs.
6. Required audits and JSON validation pass or record exact blockers.
7. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE or REDIRECT if the artifact selects exactly one bounded local
  no-import/no-training source, vocabulary, Detector 0, or research follow-up.
- REDIRECT away from SemLex if the artifact does not identify a concrete
  existing repo-local non-media metadata/phonology surface; do not permit a
  chain of source-candidate paperwork loops.
- STOP if the next step requires human source approval, legal review, account
  credentials, media import, validation/training use, Brev spend, export/browser
  activation, final validation promotion, final-gate changes, or source/legal
  decisions.
- ESCALATE if source/vocabulary/model route selection remains ambiguous after
  the artifact.
- NUDGE if the executor edits the source register, treats a candidate proposal
  as approval, or skips the non-promotion/source-blocker language.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3BL SemLex source-register candidate no-import.
Completed:            <one candidate proposal or blocker>.
Evidence:             <docs/research artifact, commands, source-register hashes>.
Remaining:            <single next action>.
Blockers:             <none or exact source/vocabulary/human blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
