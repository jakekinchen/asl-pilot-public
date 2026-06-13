# Return-To-Form M3HZ Detector0 Manual Label Ingestion Contract No Brev Goal Loop Prompt

Mission 3HZ prompt for the Codex executor after M3HY reviewed the local
Detector 0 annotation workbench and selected
`continue_m3hz_detector0_manual_label_ingestion_contract_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 manual-label ingestion contract slice. The goal is to define the
tracked contract that a later executor or human reviewer must satisfy before
any local workbench draft export can become an authoritative Detector 0 label
artifact.

This mission may create one contract artifact, one validation receipt, and one
numbered session log. It must not ingest draft labels, write new authoritative
label rows, mutate existing label packets, source manifests, source register,
tensors, vocabulary, model cards, runtime code, final gates, claim surfaces, or
side-worktree files. It must not inspect raw learner media, import media,
start/stop/use Brev, run remote commands, train/evaluate a recognizer, train
Detector 0, export, promote, activate browser recognition, or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3HY workbench-review evidence:
   - [`docs/model/return-to-form-detector0-annotation-workbench-review-v1.json`](return-to-form-detector0-annotation-workbench-review-v1.json)
   - [`docs/validation/return-to-form-m3hy-detector0-annotation-workbench-review-no-brev-v1.json`](../validation/return-to-form-m3hy-detector0-annotation-workbench-review-no-brev-v1.json)
   - [`docs/session-logs/715-mission-3hy-detector0-annotation-workbench-review-no-brev.md`](../session-logs/715-mission-3hy-detector0-annotation-workbench-review-no-brev.md)
5. M3HX workbench files:
   - [`tools/detector0-annotator/prepare.py`](../../tools/detector0-annotator/prepare.py)
   - [`tools/detector0-annotator/app.html`](../../tools/detector0-annotator/app.html)
   - [`tools/detector0-annotator/README.md`](../../tools/detector0-annotator/README.md)
   - [`tools/detector0-annotator/.gitignore`](../../tools/detector0-annotator/.gitignore)
   - [`docs/validation/return-to-form-m3hx-detector0-annotation-workbench-no-brev-v1.json`](../validation/return-to-form-m3hx-detector0-annotation-workbench-no-brev-v1.json)
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
- The M3HX workbench is local draft tooling only. Browser exports use
  `schema_version: "asl-pilot-detector0-annotator-draft/v1"` and
  `status: "draft_unreviewed_not_authoritative_labels"`.
- M3HY found the workbench internally consistent and safe for a future local
  draft annotation workflow, but not authoritative labels, training/evaluation
  readiness, browser promotion readiness, final-gate evidence, or claim
  expansion evidence.
- The fixed-baseline beat-it gate remains current: any learned hand detector
  must beat held-out fixed baselines left `0.4073` and right `0.6476` before
  improvement, export, promotion, activation, or claim language.
- Learn `left_or_first_hand` and `right_or_second_hand`; keep `head_or_face`
  and `upper_body_or_signing_space` as fixed anchors; keep
  `table_two_hand_union_or_contact_region` diagnostic-only.
- Human-authored or explicitly source-approved landmark, box, mask, or region
  annotations are allowed as offline supervision targets only when rights and
  provenance are recorded. Pretrained landmark/detector/runtime dependencies
  and generated pseudo-labels remain forbidden in the promoted/browser lane.

## Required Slice

Complete one local/no-remote/no-Brev/no-training manual-label ingestion
contract. This is a contract slice, not an ingestion slice.

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
python3 -m json.tool docs/model/return-to-form-detector0-annotation-workbench-review-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hy-detector0-annotation-workbench-review-no-brev-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hx-detector0-annotation-workbench-no-brev-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlays-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlay-gap-repair-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json >/dev/null
python3 -m json.tool docs/model/dataset-source-register.json >/dev/null
python3 -m py_compile tools/detector0-annotator/prepare.py
brev ls --json
git diff --check
```

If `.venv`, torch, Pillow, or the ignored workbench cache is unavailable,
record the exact blocker in the receipt and still review the static workbench
files, M3HY review, and existing label/source evidence.

2. Review the draft-export shape without creating authoritative labels:

- inspect `tools/detector0-annotator/app.html` and README for the local draft
  export schema, including `row_id`, split/label/clip/frame metadata,
  `coordinate_space`, per-target `presence`, `box_xyxy_norm`, and draft-only
  status fields;
- verify the export remains local-only, network-free, inference-free,
  generated-label-free, and non-authoritative;
- map draft rows back to existing indexed frame rows and tracked source
  evidence requirements;
- identify the minimum validation needed before a later ingestion slice may
  promote any draft into a tracked authoritative label artifact.

3. Write the tracked contract artifact:

`docs/model/return-to-form-detector0-manual-label-ingestion-contract-v1.json`

The artifact must include:

- current commit and active prompt;
- source files inspected and changed files;
- M3HY review artifact, receipt, and session-log path/hash references;
- M3HX workbench file and draft-export schema references;
- allowed input draft schema and required fields;
- required row-id, split, label, clip, frame, tensor, coordinate-space, and
  target-id validation;
- required source/license/provenance/no-pretrained attestation checks;
- required human-review status, reviewer identity or approval reference,
  absence semantics, and `target_applicability` rules before promotion;
- duplicate, conflict, coordinate-bounds, missing-target, and
  insufficient-visual-evidence handling;
- the exact future authoritative artifact(s) that a later ingestion slice may
  propose to create or update, without mutating them in M3HZ;
- forbidden input proof for generated labels, pretrained outputs, raw learner
  media, network exports, and source-unapproved media;
- claim-surface proof;
- readiness classification that keeps contract-readiness separate from
  authoritative labels, Detector 0 training/evaluation, browser promotion,
  final gates, or claim expansion;
- exactly one recommended next action.

4. Write the tracked receipt:

`docs/validation/return-to-form-m3hz-detector0-manual-label-ingestion-contract-no-brev-v1.json`

The receipt must include command statuses, Brev default-off read-only
inventory, files inspected and changed, contract artifact hash, draft-schema
review, source/provenance/no-pretrained proof, claim-surface proof,
forbidden-action proof, readiness classification, and exactly one next action.

5. Verify:

```sh
python3 -m json.tool docs/model/return-to-form-detector0-manual-label-ingestion-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hz-detector0-manual-label-ingestion-contract-no-brev-v1.json >/dev/null
git diff --check
```

6. Write:

`docs/session-logs/717-mission-3hz-detector0-manual-label-ingestion-contract-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3ia_detector0_manual_draft_label_ingestion_no_brev`
- `continue_m3ia_detector0_annotation_workbench_gap_repair_no_brev`
- `continue_m3ia_detector0_source_or_hard_negative_review_no_brev`
- `stop_for_human_detector0_annotation_labeling_decision`
- `escalate_detector0_annotation_strategy_with_local_evidence`

Do not select direct training, Brev lifecycle, export, promotion, browser
activation, final-gate change, or claim expansion from M3HZ.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-training only.
- Read-only `brev ls --json` is allowed to prove no unexpected paid work is
  running. If it reports a running worker, record that as a cost-control
  blocker for observer handling; do not run Brev lifecycle or remote commands
  from this executor slice.
- No committed draft-export ingestion, authoritative label artifact creation,
  or label-packet mutation.
- No source/media import, source-register mutation, manifest mutation, tensor
  mutation, vocabulary mutation, model-card or claim-surface mutation, final
  gate change, export, ONNX, browser artifact promotion, browser recognition
  activation, push, amend, or no-verify.
- No raw learner media inspection or upload.
- No pretrained detector, landmark model, feature extractor, backbone, teacher
  model, embedding, MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP,
  `from_pretrained`, `pretrained=True`, generated labels, pseudo-labels, or
  pretrained feature caches in the promoted lane.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3HZ.
2. Required local checks pass, or exact blockers are recorded.
3. M3HY review evidence and M3HX workbench draft-export behavior are inspected.
4. A tracked manual-label ingestion contract artifact is written without
   ingesting drafts or mutating label/source/manifest/tensor/model-card/runtime/
   final-gate/claim surfaces.
5. The contract defines validation, provenance, human-review, conflict,
   absence, target-applicability, and forbidden-input rules for a future
   ingestion slice.
6. The receipt keeps contract-readiness separate from authoritative labels,
   Detector 0 training/evaluation, browser promotion, final gates, or claim
   expansion.
7. Brev remains default-off and no lifecycle, remote, training, source/media
   import, label/packet mutation, tensor work, export, promotion, browser
   activation, or unsupported claim work occurs.
8. A tracked contract artifact, receipt, and numbered session log exist and
   select exactly one next action.
9. The change is committed with a message beginning `mission-3hz:`.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-remote/no-Brev/no-training,
  preserves fail-closed claims, writes the scoped contract artifact, receipt,
  and log, does not ingest labels, and selects one allowed next action.
- NUDGE if it misses draft-schema proof, source/provenance/no-pretrained proof,
  fail-closed claim proof, changed-file accounting, forbidden-action proof, or
  exactly one next action.
- REDIRECT if it mutates label artifacts, ingests drafts, starts Brev/remote/
  training, imports media, uses pretrained/generated labels, or expands claims.
