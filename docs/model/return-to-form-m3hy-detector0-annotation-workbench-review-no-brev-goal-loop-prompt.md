# Return-To-Form M3HY Detector0 Annotation Workbench Review No Brev Goal Loop Prompt

Mission 3HY prompt for the Codex executor after M3HX created the local Detector
0 annotation workbench and selected
`continue_m3hy_detector0_annotation_workbench_review_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 annotation workbench review slice. The goal is to decide whether the
M3HX workbench is internally consistent and safe enough to support a future
manual-label ingestion contract, workbench gap repair, or source/hard-negative
review decision.

Keep the review separate from authoring authoritative labels, ingesting draft
exports, training/evaluation, browser promotion, final gates, or claim
expansion.

This mission may create one review artifact, one validation receipt, and one
numbered session log. It must not mutate the M3HX workbench implementation,
write new label artifacts, ingest draft labels, mutate label packets, source
manifests, source register, tensors, vocabulary, model cards, runtime code,
final gates, claim surfaces, or side-worktree files. It must not inspect raw
learner media, import media, start or stop Brev, run remote commands,
train/evaluate a recognizer, train Detector 0, export, promote, activate
browser recognition, or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3HX evidence:
   - [`tools/detector0-annotator/prepare.py`](../../tools/detector0-annotator/prepare.py)
   - [`tools/detector0-annotator/app.html`](../../tools/detector0-annotator/app.html)
   - [`tools/detector0-annotator/README.md`](../../tools/detector0-annotator/README.md)
   - [`tools/detector0-annotator/.gitignore`](../../tools/detector0-annotator/.gitignore)
   - [`docs/validation/return-to-form-m3hx-detector0-annotation-workbench-no-brev-v1.json`](../validation/return-to-form-m3hx-detector0-annotation-workbench-no-brev-v1.json)
   - [`docs/session-logs/713-mission-3hx-detector0-annotation-workbench-no-brev.md`](../session-logs/713-mission-3hx-detector0-annotation-workbench-no-brev.md)
5. M3HW and M3HV manual-overlay evidence:
   - [`data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlay-gap-repair-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlay-gap-repair-v1.json)
   - [`docs/validation/return-to-form-m3hw-detector0-manual-overlay-gap-repair-no-brev-v1.json`](../validation/return-to-form-m3hw-detector0-manual-overlay-gap-repair-no-brev-v1.json)
   - [`data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlays-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlays-v1.json)
   - [`docs/validation/return-to-form-m3hv-detector0-manual-contact-sheet-overlay-packet-no-brev-v1.json`](../validation/return-to-form-m3hv-detector0-manual-contact-sheet-overlay-packet-no-brev-v1.json)
6. Fixed-baseline and packet evidence:
   - [`docs/model/return-to-form-detector0-fixed-baseline-gate-contract-v1.json`](return-to-form-detector0-fixed-baseline-gate-contract-v1.json)
   - [`docs/model/return-to-form-detector0-fixed-baseline-gate-contract-review-v1.json`](return-to-form-detector0-fixed-baseline-gate-contract-review-v1.json)
   - [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json)
   - [`data/manifests/return-to-form-tier0/train.json`](../../data/manifests/return-to-form-tier0/train.json)
   - [`data/manifests/return-to-form-tier0/validation.json`](../../data/manifests/return-to-form-tier0/validation.json)
   - [`data/manifests/return-to-form-tier0/test.json`](../../data/manifests/return-to-form-tier0/test.json)
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
7. Claim surfaces:
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Current Detector 0 State

- Detector 0 is not trained, accurate, or spec-fit today.
- M3HX added a local-only annotation workbench under
  `tools/detector0-annotator/` that renders ignored frame caches from tracked
  tensors and exports draft local JSON from a static browser page.
- The M3HX workbench output is draft-only. It is not authoritative label
  evidence, training readiness, evaluation readiness, browser promotion
  readiness, final-gate evidence, or claim evidence.
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

Complete one local/no-remote/no-Brev/no-training annotation-workbench review:

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
python3 -m json.tool docs/validation/return-to-form-m3hx-detector0-annotation-workbench-no-brev-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlay-gap-repair-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlays-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json >/dev/null
python3 -m json.tool docs/model/dataset-source-register.json >/dev/null
python3 -m py_compile tools/detector0-annotator/prepare.py
.venv/bin/python tools/detector0-annotator/prepare.py --include-existing-only --max-frames 4
python3 -m json.tool tools/detector0-annotator/.cache/index.json >/dev/null
git status --short --ignored tools/detector0-annotator .playwright-cli
brev ls --json
git diff --check
```

If `.venv`, torch, Pillow, or a local browser check is unavailable, record the
exact blocker in the receipt and still review the static files and prior M3HX
receipt evidence.

2. Review the M3HX workbench without mutating it:

- verify `prepare.py` uses tracked Tier 0 tensor payloads only and does not
  decode/import source media, upload raw learner video, run inference, or
  auto-label;
- verify the ignored cache index records row/split/label/clip/frame metadata,
  tensor hashes, existing V0 target summaries, manifest/source status, and
  coordinate-space metadata;
- verify `.gitignore` ignores cache images, indexes, and local exported drafts
  by default;
- verify `app.html` is static/local, takes a local index file input, draws
  normalized top-left `xyxy` boxes, and exports draft JSON without network
  calls, pretrained inference, generated labels, or authoritative-label
  language;
- verify `README.md` documents exact usage, boundaries, ignored outputs, and
  draft-only status clearly enough for a later ingestion-contract slice;
- verify fail-closed claim surfaces remain unchanged;
- classify any gap as workbench-gap repair, manual-label ingestion contract,
  source/hard-negative review, human labeling decision, or research
  escalation.

3. Do not mutate the M3HX workbench implementation, exported draft labels,
   label packets, source manifests, source register, tensors, vocabulary, model
   cards, runtime code, final gates, claim surfaces, or side-worktree files.
   The ignored cache may be refreshed only by the prepare-smoke command above;
   do not hand-edit or commit cache images/index files. Do not inspect raw
   learner media or import media.

4. Write the tracked review artifact:

`docs/model/return-to-form-detector0-annotation-workbench-review-v1.json`

The artifact must include:

- current commit and active prompt;
- source files inspected and changed files;
- M3HX workbench file path/hash references;
- M3HX receipt and session-log path/hash references;
- prepare-cache smoke result and ignored-output proof;
- static app/local-export proof;
- source/provenance/no-pretrained proof;
- README/boundary review;
- claim-surface proof;
- forbidden-action proof;
- remaining gaps before label ingestion, source/hard-negative review,
  training/evaluation, browser promotion, final gates, or claim expansion;
- exactly one recommended next action.

5. Write the tracked receipt:

`docs/validation/return-to-form-m3hy-detector0-annotation-workbench-review-no-brev-v1.json`

The receipt must include command statuses, Brev default-off read-only
inventory, files inspected and changed, review artifact hash, smoke result,
ignored-output proof, source/provenance/no-pretrained proof, claim-surface
proof, forbidden-action proof, readiness classification, and exactly one next
action.

6. Verify:

```sh
python3 -m json.tool docs/model/return-to-form-detector0-annotation-workbench-review-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3hy-detector0-annotation-workbench-review-no-brev-v1.json >/dev/null
git diff --check
```

7. Write:

`docs/session-logs/715-mission-3hy-detector0-annotation-workbench-review-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3hz_detector0_manual_label_ingestion_contract_no_brev`
- `continue_m3hz_detector0_annotation_workbench_gap_repair_no_brev`
- `continue_m3hz_detector0_source_or_hard_negative_review_no_brev`
- `stop_for_human_detector0_annotation_labeling_decision`
- `escalate_detector0_annotation_strategy_with_local_evidence`

Do not select direct training, Brev lifecycle, export, promotion, browser
activation, final-gate change, or claim expansion from M3HY.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-training only.
- Read-only `brev ls --json` is allowed to prove no unexpected paid work is
  running. If it reports a running worker, record that as a cost-control
  blocker for observer handling; do not run Brev lifecycle or remote commands
  from this executor slice.
- No recognizer training/evaluation, Detector 0 training, evaluator rerun,
  threshold tuning, source/media import, raw learner media inspection,
  source-register mutation, packet mutation, overlay mutation, workbench code
  mutation, tensor/materialization mutation, vocabulary mutation, model-card
  mutation, runtime claim-surface mutation, export, ONNX, browser artifact
  promotion, browser recognition activation, final-gate weakening, push,
  amend, or no-verify.
- No pretrained detector, landmark model, feature extractor, backbone, teacher
  model, embedding, MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP,
  `from_pretrained`, `pretrained=True`, generated labels, pseudo-labels, or
  pretrained feature caches in the promoted lane.
- Human-authored or explicitly source-approved landmark, box, mask, or region
  annotations may be counted as offline supervision targets only when rights
  and provenance are recorded.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3HY.
2. Required local checks pass, or exact blockers are recorded.
3. M3HX workbench files, receipt, session log, ignored-output proof, source/
   provenance/no-pretrained proof, and claim-surface proof are inspected.
4. A tracked review artifact is written without mutating the workbench
   implementation, label packets, source/manifest/tensor/model-card/runtime/
   final-gate surfaces, or claim surfaces.
5. The review classifies prepare-cache behavior, ignored outputs, static
   app/local-export behavior, README boundaries, draft-only status, and any
   ingestion-contract or repair gaps.
6. The receipt keeps workbench-review status separate from authoritative labels,
   Detector 0 training/evaluation, browser promotion, final gates, or claim
   expansion.
7. Brev remains default-off and no lifecycle, remote, training, source/media
   import, label/packet mutation, tensor work, export, promotion, browser
   activation, or unsupported claim work occurs.
8. A tracked review artifact, receipt, and numbered session log exist and
   select exactly one next action.
9. The change is committed with a message beginning `mission-3hy:`.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-remote/no-Brev/no-training,
  preserves fail-closed claims, writes the scoped review artifact, receipt, and
  log, and selects one allowed next action.
- NUDGE if it misses smoke/ignored-output proof, static-local app proof,
  README boundary review, no-pretrained/source proof, fail-closed claim proof,
  changed-file accounting, or exactly one next action.
- REDIRECT if it mutates workbench implementation or label artifacts, starts
  Brev/remote/training, imports media, uses pretrained/generated labels, or
  expands claims.
