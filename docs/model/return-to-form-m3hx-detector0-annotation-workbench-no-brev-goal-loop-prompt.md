# Return-To-Form M3HX Detector0 Annotation Workbench No Brev Goal Loop Prompt

Mission 3HX prompt for the Codex executor after M3HW preserved the single
manual-overlay gap blocker and the supervising repair redirected the next slice
to the real current bottleneck: more trusted manual hand-box supervision.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 annotation workbench slice. The goal is to create a small local-only
frame-prep and manual box-review workbench from already approved tracked Tier 0
tensors/manifests so a human or later executor can author more trusted
hand-box labels without pretrained models, source imports, raw learner media
upload, or automatic labels.

This mission may create scoped files under `tools/detector0-annotator/`, one
validation receipt, and one numbered session log. It must not write new label
artifacts, mutate existing label packets, mutate source manifests/registers,
train/evaluate Detector 0 or the recognizer, start/stop/use Brev, export,
promote, activate browser recognition, change final gates, or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3HW gap-repair evidence:
   - [`data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlay-gap-repair-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlay-gap-repair-v1.json)
   - [`docs/validation/return-to-form-m3hw-detector0-manual-overlay-gap-repair-no-brev-v1.json`](../validation/return-to-form-m3hw-detector0-manual-overlay-gap-repair-no-brev-v1.json)
   - [`docs/session-logs/710-mission-3hw-detector0-manual-overlay-gap-repair-no-brev.md`](../session-logs/710-mission-3hw-detector0-manual-overlay-gap-repair-no-brev.md)
5. M3HV manual overlay evidence:
   - [`data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlays-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlays-v1.json)
   - [`docs/validation/return-to-form-m3hv-detector0-manual-contact-sheet-overlay-packet-no-brev-v1.json`](../validation/return-to-form-m3hv-detector0-manual-contact-sheet-overlay-packet-no-brev-v1.json)
6. Packet/source/tensor evidence:
   - [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json)
   - [`data/annotations/detector0/return-to-form-targeted-annotation-packet-expansion-v1.json`](../../data/annotations/detector0/return-to-form-targeted-annotation-packet-expansion-v1.json)
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
- M3HV added 17 new manual hand-box rows from the 18 source-bound table
  temporal-neighbor candidates.
- M3HW preserved the remaining row,
  `det0-exp1-validation-table-000376-f004`, as explicit
  `insufficient_visual_evidence`.
- The fixed-baseline beat-it gate is still current: any learned hand detector
  must beat held-out fixed baselines left `0.4073` and right `0.6476` before
  improvement, export, promotion, activation, or claim language.
- Learn `left_or_first_hand` and `right_or_second_hand`; keep `head_or_face`
  and `upper_body_or_signing_space` as fixed anchors; keep
  `table_two_hand_union_or_contact_region` diagnostic-only.

## Required Slice

Build a small local annotation workbench that helps produce future manual
labels, but does not itself create authoritative labels.

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
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlay-gap-repair-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlays-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json >/dev/null
python3 -m json.tool docs/model/dataset-source-register.json >/dev/null
brev ls --json
git diff --check
```

2. Create a minimal workbench under `tools/detector0-annotator/`:

- `prepare.py`: renders `full_frame_reference` frames from existing tracked
  `data/tensors/return-to-form-tier0/{split}/*-regions.pt` tensors into a
  local ignored cache, and writes an ignored `index.json` containing provenance,
  split/label/clip/frame metadata, tensor hashes, and any existing V0 targets.
  Use `.venv/bin/python` when torch is needed.
- `app.html`: a static local browser page for manually drawing normalized
  top-left `xyxy` boxes over cached PNGs and exporting draft JSON to the local
  machine. It must not upload anything, call a network API, auto-label, or use
  pretrained inference.
- `README.md`: documents exact usage, boundaries, output status, and the fact
  that exported boxes are draft/human-review artifacts until a later committed
  label-ingestion slice reviews and promotes them.
- `.gitignore`: ignores cache/images/exported drafts by default.

3. Keep outputs and claims clean:

- Do not commit rendered frame PNGs, cache JSON, exported draft labels, or raw
  media.
- Do not create or mutate committed label packets in this mission.
- Do not import new media or decode source videos; use already tracked tensor
  payloads only.
- Do not use MediaPipe/OpenPose/YOLO/SAM/DINO/CLIP, generated labels,
  pseudo-labels, `from_pretrained`, or pretrained weights.

4. Validate the workbench with a tiny local smoke:

```sh
.venv/bin/python tools/detector0-annotator/prepare.py --include-existing-only --max-frames 4
python3 -m json.tool tools/detector0-annotator/.cache/index.json >/dev/null
git status --short --ignored tools/detector0-annotator
git diff --check
```

The smoke should prove cache files are ignored and the workbench can render a
few existing reviewed frames. If `.venv` or torch is unavailable, record the
exact blocker in the receipt and still commit only useful static/docs pieces.

5. Write:

`docs/validation/return-to-form-m3hx-detector0-annotation-workbench-no-brev-v1.json`

The receipt must include command statuses, Brev default-off read-only
inventory, files inspected/changed, smoke result, ignored-output proof,
source/provenance/no-pretrained proof, claim-surface proof, forbidden-action
proof, readiness classification, and exactly one next action.

6. Write:

`docs/session-logs/713-mission-3hx-detector0-annotation-workbench-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3hy_detector0_annotation_workbench_review_no_brev`
- `continue_m3hy_detector0_manual_label_ingestion_contract_no_brev`
- `continue_m3hy_detector0_source_or_hard_negative_review_no_brev`
- `stop_for_human_detector0_annotation_labeling_decision`
- `escalate_detector0_data_strategy_with_local_evidence`

Do not select direct training, Brev lifecycle, export, promotion, browser
activation, final-gate change, or claim expansion from M3HX.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-training only.
- No committed label artifacts or label-packet mutation.
- No raw learner media inspection or upload.
- No source/media import, source-register mutation, manifest mutation, tensor
  mutation, vocabulary mutation, model-card or claim-surface mutation, final
  gate change, export, promotion, browser activation, push, amend, or no-verify.
- No pretrained detector, landmark model, feature extractor, backbone, teacher
  model, embedding, generated labels, pseudo-labels, or pretrained feature
  caches in the promoted lane.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3HX.
2. Required local checks pass, or exact blockers are recorded.
3. A scoped local workbench exists under `tools/detector0-annotator/`.
4. The workbench can prepare a tiny ignored cache from tracked tensors, or
   records an exact environment blocker.
5. No cache/images/exported draft labels are committed.
6. No label packets, source manifests/registers, tensors, claim surfaces, final
   gates, runtime model cards, or browser recognition surfaces are mutated.
7. Brev remains default-off and no lifecycle/remote/training/export/promotion
   action occurs.
8. A tracked receipt and numbered session log exist and select exactly one next
   action.
9. The change is committed with a message beginning `mission-3hx:`.

## Observer Guidance

- CONTINUE if the executor creates only the local workbench, records boundaries,
  validates ignored outputs, preserves claims, and selects one allowed next
  action.
- NUDGE if it misses ignored-output proof, no-pretrained/source proof,
  fail-closed claim proof, smoke evidence, or exactly one next action.
- REDIRECT if it mutates label artifacts, starts Brev/remote/training, imports
  media, uses pretrained/generated labels, or expands claims.
