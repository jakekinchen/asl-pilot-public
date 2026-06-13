# Return-To-Form Tier 0 Detector 0 Crop-Normalization Bootstrap Goal Loop Prompt

Mission 3AE-L prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Bootstrap the scratch localization/crop-normalization lane after M3AE-I/J/K
showed that fixed-crop inputs can be memorized but do not generalize under the
current signer-disjoint PopSign validation/test splits. This is the composable
problem split: define Detector 0 and crop normalization before another
classifier retry.

This first slice is a planning, provenance, and gate artifact only. Do not
train Detector 0 or the recognizer in this slice.

The selected labels remain `please`, `table`, `dad`, `grandpa`, and `hat`.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AE-L.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   M3AE-L in the Milestone Ladder and the Mutable Tactical Overlay.
4. M3AE-K label/split remediation:
   [`docs/validation/return-to-form-tier0-label-split-remediation.json`](../validation/return-to-form-tier0-label-split-remediation.json).
5. M3AE-J smoke report:
   [`docs/validation/return-to-form-tier0-microprobe-config-smoke.json`](../validation/return-to-form-tier0-microprobe-config-smoke.json).
6. Observer localization strategy memo:
   [`artifacts/research/observer-201-localization-strategy-api-response.md`](../../artifacts/research/observer-201-localization-strategy-api-response.md).
7. M3AC/M3AD fixed-crop, gate, source, manifest, and dataloader artifacts.
8. Source register:
   [`docs/model/dataset-source-register.json`](dataset-source-register.json).

## First Reviewable Slice

Start with read-only checks:

```sh
git status --short --branch
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_loop_premise.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
jq empty docs/research/return-to-form-tier0-source-coverage.json \
  docs/model/return-to-form-fixed-crop-config.json \
  docs/validation/return-to-form-tier0-gates.json \
  docs/validation/return-to-form-tier0-decode-dataloader.json \
  docs/validation/return-to-form-tier0-learnability-smoke.json \
  docs/validation/return-to-form-tier0-remediation-diagnostic.json \
  docs/validation/return-to-form-tier0-tensor-contract.json \
  docs/validation/return-to-form-tier0-learnability-smoke-rerun.json \
  docs/validation/return-to-form-tier0-failure-remediation-triage.json \
  docs/validation/return-to-form-tier0-model-architecture-microprobe.json \
  docs/validation/return-to-form-tier0-microprobe-config-smoke.json \
  docs/validation/return-to-form-tier0-label-split-remediation.json \
  data/manifests/return-to-form-tier0/train.json \
  data/manifests/return-to-form-tier0/validation.json \
  data/manifests/return-to-form-tier0/test.json
./.venv/bin/python scripts/run_return_to_form_tier0_decode_dataloader.py
./.venv/bin/python scripts/audit_return_to_form_tier0_tensor_contract.py
git diff --check
brev ls --json
```

The user said not to stop `asl-pilot-rawframe-001`; record `brev stop
asl-pilot-rawframe-001` as the manual stop command, but do not run it. Do not
create a duplicate worker.

Then complete exactly one bootstrap slice:

1. Do not run detector training or recognizer training.
2. Define the minimal Detector 0 target schema:
   - left/first hand center and box;
   - right/second hand center and box;
   - head or face center and box;
   - upper-body or signing-space box;
   - per-target presence/confidence;
   - optional truncation or occlusion flag.
3. Keep full landmarks out of the core bootstrap. They are a later auxiliary
   lane after box/center localization and crop normalization are working.
4. Identify clean annotation/provenance paths from project-owned manual labels,
   manual-verified labels, existing fixed-crop protocol evidence, PopSign frame
   tensors, and retained contact sheets. Do not use pretrained-generated
   MediaPipe, OpenPose, YOLO, RTMPose, or unknown labels in the promoted lane.
5. Define the first annotation packet path(s), required fields, review status,
   and source-register/provenance checks.
6. Define Detector 0 and crop-normalization validation gates before training:
   held-out visible-hand/head localization, no-pretrained provenance,
   temporal stability, visual overlay review, and fixed-vs-detector crop
   ablation criteria.
7. Write the tracked bootstrap report
   [`docs/validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json`](../validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json).
8. Update the Mutable Tactical Overlay with the report link and exactly one
   next action.
9. Write a numbered session log.

## Report Requirements

The report must record:

- source artifacts, including M3AE-J, M3AE-K, and the observer localization API
  memo, with hashes;
- selected labels and manifest counts;
- M3AE-J/K train-fit, validation/test, split-overlap, and
  `source_signer_distribution_gap` evidence;
- minimal Detector 0 target schema and field names;
- annotation provenance taxonomy for this slice, including allowed and
  disallowed label sources;
- first annotation packet path(s), required fields, and review status;
- no-pretrained constraints and banned pretrained-generated labels;
- Detector 0 validation gates and crop-normalization ablation design;
- stop conditions for detector failure, annotation insufficiency, and
  unchanged recognizer generalization after normalized crops;
- hard-negative/calibration blockers kept separate;
- exactly one next action.

## Next-Action Choices

Choose exactly one next action in the report:

- `detector0_annotation_packet`: use when the next slice should create or
  populate the manual/manual-verified localization label packet.
- `detector0_training_smoke`: use only if a clean annotation packet already
  exists and the next slice can train a tiny scratch Detector 0 smoke.
- `crop_normalization_ablation_design`: use when the annotation path is clear
  but the crop-normalization transform and fixed-vs-detector comparison need
  implementation before training.
- `source_distribution_before_detector`: use only if the report proves the
  current data cannot support even a localization annotation packet without
  source/signer distribution remediation.
- `stop_reduced_claim`: use when no bounded no-new-source detector bootstrap is
  justified without human sign/data review, new source approval, or a changed
  product claim.

## Hard Boundaries

- Do not run detector training.
- Do not run recognizer training.
- Do not run another microprobe or smoke job.
- Do not expand labels.
- Do not evaluate the controlled clip-heldout checkpoint.
- Do not import or approve sources.
- Do not use MediaPipe, OpenPose, RTMPose, YOLO, pretrained landmarks, or
  pretrained-generated labels in the promoted lane.
- Do not export ONNX, promote a model card, or claim final readiness.
- Do not weaken final gates.
- Do not stop Brev, create a duplicate worker, push, or start a broad-run
  redirect.

## Acceptance Criteria

All must be true before this mission closes:

1. `GOAL.md` points at this prompt and names Mission 3AE-L.
2. `node scripts/audit_return_to_form_plan.mjs --json` and
   `node scripts/audit_loop_premise.mjs --json` exit 0.
3. M3AC/M3AD/M3AE/M3AE-R/M3AE-F/M3AE-G/M3AE-H/M3AE-I/M3AE-J/M3AE-K artifacts
   remain valid JSON, and `scripts/run_return_to_form_tier0_decode_dataloader.py`
   still reports `status=passed`, `missing_file_count=0`, and one dataloader
   batch shape per split.
4. `scripts/audit_return_to_form_tier0_tensor_contract.py` exits 0 and proves
   the corrected input path consumes `rgb_regions` with no `rgb_frames`
   fallback for the sampled Tier 0 payloads.
5. No detector training, recognizer training, second smoke, second microprobe,
   source/media/label expansion, broad checkpoint evaluation, export,
   promotion, or readiness claim occurs.
6. [`docs/validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json`](../validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json)
   records the M3AE-J/K evidence, API memo path/hash, minimal Detector 0 target
   schema, annotation/provenance plan, validation gates, ablation design, stop
   conditions, and exactly one next action from this prompt.
7. The Mutable Tactical Overlay links to the bootstrap report and records
   exactly one next action.
8. A numbered session log records commands, selected signs, manifest/source/
   crop/gate hashes, M3AE-J/K metrics, split/source/signer evidence, API memo
   hash, Detector 0 target summary, Brev worker status, the separate
   final-promotion negative-challenge blocker, manual stop command
   `brev stop asl-pilot-rawframe-001`, and the next action.
9. No label expansion, controlled clip-heldout evaluation, source approval,
   unapproved media import, ONNX export, model-card promotion,
   final-readiness claim, broad-run redirect, Brev stop, duplicate Brev worker,
   final-gate weakening, pretrained detector/landmark use, or push occurs.

When all nine are true, continue the goal loop according to the bootstrap
report's single next action.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AE-L Detector 0 crop-normalization bootstrap.
Completed:            <bootstrap evidence or exact blocker>.
Evidence:             <artifact paths, hashes, target schema, gates, and audit statuses>.
Remaining:            <single next action from the bootstrap report>.
Blockers:             <none, or exact evidence/tooling/data blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
