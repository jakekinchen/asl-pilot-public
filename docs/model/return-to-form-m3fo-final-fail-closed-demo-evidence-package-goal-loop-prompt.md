# Return-To-Form M3FO Final Fail-Closed Demo Evidence Package Goal Loop Prompt

Mission 3FO prompt for the Codex executor after M3FN refreshed fail-closed
practice, lesson, and validation evidence and observer `a6c6315` selected
`draft_final_fail_closed_demo_evidence_package`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Draft the final fail-closed demo evidence package for the deadline submission.
This is a local/no-spend packaging slice: consolidate the current passing
M3FN evidence, claim surfaces, and remaining honest limitations into one
reviewable receipt. Do not rerun training, rerun browser smokes unless a JSON
report is missing or invalid, change product runtime, or expand claims.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3FN executor and observer handoff:
   - [`docs/session-logs/586-mission-3fn-deadline-fail-closed-demo-finish.md`](../session-logs/586-mission-3fn-deadline-fail-closed-demo-finish.md)
   - [`docs/validation/return-to-form-m3fn-deadline-fail-closed-demo-finish-v1.json`](../validation/return-to-form-m3fn-deadline-fail-closed-demo-finish-v1.json)
   - latest `CONTINUE - Mission 3FN selected final fail-closed demo evidence package` entry in [`docs/observer-messages/observer-log.md`](../observer-messages/observer-log.md)
4. Current claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)
5. Current smoke/audit reports:
   - [`docs/validation/practice-progress-smoke.json`](../validation/practice-progress-smoke.json)
   - [`docs/validation/practice-camera-behavior-smoke.json`](../validation/practice-camera-behavior-smoke.json)
   - [`docs/validation/lesson-page-smoke.json`](../validation/lesson-page-smoke.json)
   - [`docs/validation/validation-page-smoke.json`](../validation/validation-page-smoke.json)
6. Historical final package precedent:
   - [`docs/validation/return-to-form-reduced-demo-final-evidence-v1.json`](../validation/return-to-form-reduced-demo-final-evidence-v1.json)

## Required Slice

Complete exactly one final evidence-package slice.

1. Run baseline checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-m3fn-deadline-fail-closed-demo-finish-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
```

2. Validate current evidence without rewriting it unless a report is missing
   or invalid:

```sh
python3 -m json.tool docs/validation/practice-progress-smoke.json >/dev/null
python3 -m json.tool docs/validation/practice-camera-behavior-smoke.json >/dev/null
python3 -m json.tool docs/validation/lesson-page-smoke.json >/dev/null
python3 -m json.tool docs/validation/validation-page-smoke.json >/dev/null
node scripts/audit_practice_screen_contract.mjs
node scripts/audit_practice_progress_smoke.mjs
node scripts/audit_practice_camera_behavior_smoke.mjs
node scripts/audit_lesson_page_smoke.mjs
node scripts/audit_lesson_fail_closed.mjs
node scripts/audit_avatar_no_recognition_claims.mjs
node scripts/audit_validation_page_smoke.mjs
node scripts/audit_final_claim_matrix.mjs
node scripts/audit_no_raw_video_upload.mjs
npm --prefix web run typecheck
npm --prefix web run lint
git diff --check
```

3. Write the final package:

`docs/validation/return-to-form-m3fo-final-fail-closed-demo-evidence-v1.json`

The package must include:

- current HEAD and active prompt;
- inspected paths and SHA-256 hashes;
- smoke/audit statuses for `/`, `/lesson`, and `/validation`;
- explicit fail-closed claim state:
  - model card `status: "not_trained"`;
  - active labels `[]`;
  - recognition, Detector 0 tracking, and box-driven avatar authority disabled;
- honest claims the app can make for the deadline demo;
- unsupported claims the app cannot make;
- M3FM/M3FN model evidence boundary: diagnostic model outputs remain ignored,
  unpromoted, and not browser/product/final evidence;
- Brev default-off state from read-only `brev ls --json`, if available without
  lifecycle/spend;
- commands run for this package;
- forbidden actions not run;
- next human choices.

4. Write a numbered session log:

`docs/session-logs/588-mission-3fo-final-fail-closed-demo-evidence-package.md`

5. Commit only the package, session log, and any purely package-supporting
   doc/validation updates. Do not modify product runtime in this mission.

## Hard Boundaries

- No product runtime change unless required only to fix a package-blocking
  broken claim surface, and then stop after recording the blocker instead of
  broadening scope.
- No recognizer training, fitting, evaluator rerun, checkpoint creation,
  architecture search, threshold tuning, export, model-card promotion,
  active-vocabulary promotion, or browser recognition activation.
- No Brev start/exec/sync/copy/lifecycle mutation and no GPU/cloud spend.
  Read-only `brev ls --json` is allowed.
- No source-register edit, source/media import, manifest/tensor/vocabulary/
  packet mutation, generated labels, pseudo-labels, or pretrained path.
- No fake recognizer output, fake detector boxes, ASL correctness claim,
  Detector 0 tracking authority, final-readiness overclaim, push, amend,
  destructive reset, or no-verify commit.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this M3FO prompt and no stop sentinel is present.
2. Required evidence validations pass or record exact blockers.
3. The final package exists at
   `docs/validation/return-to-form-m3fo-final-fail-closed-demo-evidence-v1.json`
   and parses as JSON.
4. The package clearly separates supported fail-closed demo claims from
   unsupported recognition/model claims.
5. Model and active-vocabulary claim surfaces remain locked.
6. No forbidden ML, Brev lifecycle/spend, source, export, promotion, browser
   activation, or unsupported-claim work occurred.
7. The session log exists and selects exactly one next action:
   `stop_for_human_demo_acceptance_review` unless it records a precise
   package-blocking issue.

## Observer Guidance

- STOP if the final package is complete and no technical blocker remains; the
  next decision is human demo acceptance or submission.
- NUDGE if the package lacks hashes, command evidence, claim boundaries, or
  explicit forbidden-action proof.
- REDIRECT if the executor drifts into product runtime, ML, Brev, source,
  export, promotion, or claim expansion.
- ESCALATE only for a high-risk claim/privacy/scope decision not already
  covered by the fail-closed product boundary.

## Progress Ledger

```text
Current state:        Mission 3FO final fail-closed demo evidence package.
Completed:            <package written or blocker recorded>.
Evidence:             <commands, artifacts, hashes>.
Remaining:            <human acceptance/submission or exact blocker>.
Blockers:             <none, or exact package blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
