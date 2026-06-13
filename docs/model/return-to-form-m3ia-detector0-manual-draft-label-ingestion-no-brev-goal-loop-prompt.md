# Return-To-Form M3IA Detector0 Manual Draft Label Ingestion No Brev Goal Loop Prompt

Mission 3IA prompt for the Codex executor after M3HZ defined the Detector 0
manual-label ingestion contract and selected
`continue_m3ia_detector0_manual_draft_label_ingestion_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 manual draft-label ingestion slice. The goal is to apply the M3HZ
contract to local workbench draft exports and either create one reviewed
authoritative supplemental label artifact or record the exact blocker that
prevents ingestion.

This is an ingestion-validation slice, not a labeling, training, source import,
or promotion slice. It must not author new boxes by hand, fabricate review
metadata, mutate existing label packets, source manifests, source register,
tensors, vocabulary, model cards, runtime code, final gates, claim surfaces, or
side-worktree files.

If no reviewed local draft export exists, or if any required provenance,
human-review, source, tensor, coordinate, target-applicability, absence, or
no-pretrained proof is missing, do not create an empty authoritative artifact.
Write the receipt and session log with the blocker and select exactly one
allowed next action.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3HZ ingestion contract evidence:
   - [`docs/model/return-to-form-detector0-manual-label-ingestion-contract-v1.json`](return-to-form-detector0-manual-label-ingestion-contract-v1.json)
   - [`docs/validation/return-to-form-m3hz-detector0-manual-label-ingestion-contract-no-brev-v1.json`](../validation/return-to-form-m3hz-detector0-manual-label-ingestion-contract-no-brev-v1.json)
   - [`docs/session-logs/717-mission-3hz-detector0-manual-label-ingestion-contract-no-brev.md`](../session-logs/717-mission-3hz-detector0-manual-label-ingestion-contract-no-brev.md)
5. M3HY/M3HX workbench evidence:
   - [`docs/model/return-to-form-detector0-annotation-workbench-review-v1.json`](return-to-form-detector0-annotation-workbench-review-v1.json)
   - [`docs/validation/return-to-form-m3hy-detector0-annotation-workbench-review-no-brev-v1.json`](../validation/return-to-form-m3hy-detector0-annotation-workbench-review-no-brev-v1.json)
   - [`docs/validation/return-to-form-m3hx-detector0-annotation-workbench-no-brev-v1.json`](../validation/return-to-form-m3hx-detector0-annotation-workbench-no-brev-v1.json)
   - [`tools/detector0-annotator/prepare.py`](../../tools/detector0-annotator/prepare.py)
   - [`tools/detector0-annotator/app.html`](../../tools/detector0-annotator/app.html)
   - [`tools/detector0-annotator/README.md`](../../tools/detector0-annotator/README.md)
   - [`tools/detector0-annotator/.gitignore`](../../tools/detector0-annotator/.gitignore)
6. Manual-overlay and packet evidence:
   - [`data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlays-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlays-v1.json)
   - [`data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlay-gap-repair-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlay-gap-repair-v1.json)
   - [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json)
   - [`docs/model/return-to-form-detector0-fixed-baseline-gate-contract-v1.json`](return-to-form-detector0-fixed-baseline-gate-contract-v1.json)
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
7. Claim surfaces:
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Current Detector 0 State

- Detector 0 is not trained, accurate, or spec-fit today.
- The M3HX workbench exports local draft JSON with
  `schema_version: "asl-pilot-detector0-annotator-draft/v1"` and
  `status: "draft_unreviewed_not_authoritative_labels"`.
- M3HZ defined the contract for promoting reviewed workbench drafts, but did
  not ingest draft labels or create authoritative rows.
- Draft exports alone are not authority. Promotion requires human-review proof,
  reviewer identity or approval artifact, source/license/provenance proof,
  tensor/row identity validation, no-pretrained attestation, and contract-clean
  absence/target-applicability handling.
- The fixed-baseline beat-it gate remains current: any learned hand detector
  must beat held-out fixed baselines left `0.4073` and right `0.6476` before
  improvement, export, promotion, activation, or claim language.
- Human-authored or explicitly source-approved landmark, box, mask, or region
  annotations are allowed as offline supervision targets only when rights and
  provenance are recorded. Pretrained landmark/detector/runtime dependencies
  and generated pseudo-labels remain forbidden in the promoted/browser lane.

## Required Slice

Complete one local/no-remote/no-Brev/no-training manual draft-label ingestion
slice.

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_detector0_manifest_contract.mjs
python3 -m json.tool docs/model/return-to-form-detector0-manual-label-ingestion-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hz-detector0-manual-label-ingestion-contract-no-brev-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-annotation-workbench-review-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hy-detector0-annotation-workbench-review-no-brev-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlays-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlay-gap-repair-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json >/dev/null
python3 -m json.tool docs/model/dataset-source-register.json >/dev/null
python3 -m py_compile tools/detector0-annotator/prepare.py
git status --short --ignored tools/detector0-annotator .playwright-cli
brev ls --json
git diff --check
```

If `.venv`, torch, Pillow, a local browser, or local draft exports are
unavailable, record the exact blocker in the receipt. Do not work around missing
reviewed draft inputs by authoring labels in this mission.

2. Discover candidate local draft exports without using network or remote
   storage:

- inspect `tools/detector0-annotator/exports/` if it exists;
- inspect no other external source unless `GOAL.md` or the active prompt names
  an explicit local file path;
- accept only local JSON files that parse and declare the M3HX draft schema and
  draft-only status;
- reject files from remote URLs, cloud sync submissions, generated labels,
  pretrained outputs, raw learner media, or unapproved source media;
- record absent export directories, absent draft files, parse failures, schema
  mismatches, or missing review metadata as blockers.

3. Validate each candidate draft against the M3HZ contract before promotion:

- top-level schema/status/boundary fields;
- row id uniqueness and one-to-one mapping to tracked frame/index/source
  evidence;
- split, label, clip, frame, tensor path, tensor hash, and coordinate-space
  consistency;
- accepted target ids and target applicability;
- normalized box bounds and `x1 < x2`, `y1 < y2`;
- explicit absence semantics for missing or non-present targets;
- human-review status, reviewer identity or approval artifact, reviewed time,
  method, and evidence reference;
- source/license/provenance and no-pretrained/no-generated-label attestation;
- duplicate/conflict handling against existing authoritative rows;
- fail-closed claim surfaces unchanged.

4. If and only if every relevant contract check passes, create exactly one
   authoritative supplemental artifact:

`data/annotations/detector0/return-to-form-targeted-annotation-workbench-ingestion-v1.json`

The artifact must include:

- source draft file path/hash references;
- current commit and active prompt;
- contract artifact hash;
- source files inspected and changed files;
- promoted reviewed rows only;
- row/source/tensor/coordinate/target validation proof;
- human-review proof;
- source/license/provenance/no-pretrained proof;
- duplicate/conflict and absence handling;
- fixed-baseline gate context;
- claim-surface proof;
- readiness classification that keeps authoritative supplemental labels separate
  from Detector 0 training/evaluation, browser promotion, final gates, or claim
  expansion.

Do not create a zero-row authoritative artifact. If no rows pass, write only the
receipt and session log with the blocker.

5. Write the tracked receipt:

`docs/validation/return-to-form-m3ia-detector0-manual-draft-label-ingestion-no-brev-v1.json`

The receipt must include command statuses, Brev default-off read-only
inventory, draft discovery results, per-contract validation results, files
inspected and changed, artifact hash if created, source/provenance/no-pretrained
proof, claim-surface proof, forbidden-action proof, readiness classification,
blockers if any, and exactly one next action.

6. Verify:

```sh
python3 -m json.tool docs/validation/return-to-form-m3ia-detector0-manual-draft-label-ingestion-no-brev-v1.json >/dev/null
test ! -f data/annotations/detector0/return-to-form-targeted-annotation-workbench-ingestion-v1.json || python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-workbench-ingestion-v1.json >/dev/null
git diff --check
```

7. Write:

`docs/session-logs/719-mission-3ia-detector0-manual-draft-label-ingestion-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3ib_detector0_manual_draft_label_ingestion_review_no_brev`
- `continue_m3ib_detector0_annotation_workbench_review_metadata_gap_repair_no_brev`
- `continue_m3ib_detector0_source_or_hard_negative_review_no_brev`
- `stop_for_human_detector0_reviewed_draft_export`
- `escalate_detector0_annotation_strategy_with_local_evidence`

Do not select direct training, Brev lifecycle, export, promotion, browser
activation, final-gate change, or claim expansion from M3IA.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-training only.
- Read-only `brev ls --json` is allowed to prove no unexpected paid work is
  running. If it reports a running worker, record that as a cost-control
  blocker for observer handling; do not run Brev lifecycle or remote commands
  from this executor slice.
- No hand-authored label creation, no label guessing, no extrapolation from
  contact sheets, and no fabrication of reviewer identity or approval evidence.
- No mutation of existing label packets, source manifests, source register,
  tensors, vocabulary, model cards, runtime code, final gates, claim surfaces,
  side-worktree files, or browser artifacts.
- No source/media import, raw learner media inspection, raw learner upload,
  generated labels, pseudo-labels, pretrained detector/landmark/feature/backbone
  outputs, export, ONNX, promotion, browser recognition activation, push, amend,
  or no-verify.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3IA.
2. Required local checks pass, or exact blockers are recorded.
3. Local draft exports are discovered or their absence is recorded.
4. Candidate drafts are validated against the M3HZ contract, or exact validation
   blockers are recorded.
5. No zero-row authoritative artifact is created.
6. If rows are ingested, the new authoritative supplemental artifact contains
   only reviewed rows that pass the contract and keeps readiness separate from
   Detector 0 training/evaluation, browser promotion, final gates, and claim
   expansion.
7. If rows are not ingested, the receipt states why and selects an allowed next
   action without mutating label packets or claims.
8. Brev remains default-off and no lifecycle, remote, training, source/media
   import, tensor work, export, promotion, browser activation, final-gate, or
   unsupported claim work occurs.
9. The receipt and numbered session log exist and select exactly one next
   action.
10. The change is committed with a message beginning `mission-3ia:`.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-remote/no-Brev/no-training,
  follows the M3HZ contract, either writes a reviewed non-empty supplemental
  ingestion artifact or records a concrete blocker, preserves fail-closed
  claims, and selects one allowed next action.
- NUDGE if it misses draft-discovery proof, contract-validation proof,
  source/provenance/no-pretrained proof, human-review proof, fail-closed claim
  proof, changed-file accounting, forbidden-action proof, or exactly one next
  action.
- REDIRECT if it authors labels by hand, creates a zero-row authoritative
  artifact, mutates existing packets/source/manifests/tensors/claims, starts
  Brev/remote/training, imports media, uses pretrained/generated labels, or
  expands claims.
- STOP if no reviewed draft export or approval artifact exists and the executor
  truthfully selects `stop_for_human_detector0_reviewed_draft_export`.
