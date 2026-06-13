# Return-To-Form Approved Source Vocabulary Unblock Goal Loop Prompt

Mission 3AJ prompt for the Codex executor. Read [`GOAL.md`](../../GOAL.md)
first, then [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Unpark the ML lane by making the next source/vocabulary step executable and
auditable, without starting paid compute or model training. The immediate goal
is to turn the approved ASL Citizen school-assignment raw-video subset into
strict lesson-milestone manifests, refresh stale diagnostic manifests, and make
`scripts/train_rawframe_model.py --lesson-milestone --dry-run` accept that
approved source provenance.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), especially Mission 3AJ.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md), especially
   the Original Plan Spine and Mutable Tactical Overlay.
4. Mission 3AH failed-promotion evidence:
   - [`docs/validation/return-to-form-overnight-tier0-cuda-recognizer-v1.json`](../validation/return-to-form-overnight-tier0-cuda-recognizer-v1.json)
   - [`docs/validation/return-to-form-overnight-tier0-data-vocabulary-decision-v1.json`](../validation/return-to-form-overnight-tier0-data-vocabulary-decision-v1.json)
5. Mission 3AI reduced-demo evidence:
   - [`docs/validation/return-to-form-reduced-demo-final-evidence-v1.json`](../validation/return-to-form-reduced-demo-final-evidence-v1.json)
   - [`docs/session-logs/283-observer-stop-reduced-demo-final-evidence.md`](../session-logs/283-observer-stop-reduced-demo-final-evidence.md)
6. Source and import evidence:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/research/asl-citizen-academic-source-review.md`](../research/asl-citizen-academic-source-review.md)
   - [`docs/research/asl-citizen-selected-raw-clip-import.json`](../research/asl-citizen-selected-raw-clip-import.json)
   - [`docs/validation/asl-citizen-selected-manifests.json`](../validation/asl-citizen-selected-manifests.json)
7. Manifest/training scripts:
   - [`scripts/export_asl_citizen_selected_manifests.mjs`](../../scripts/export_asl_citizen_selected_manifests.mjs)
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)

## Current Decision

The next useful ML step is source/vocabulary plumbing, not another model run.

- PopSign-only Tier 0 training fit the train split but failed promotion on
  validation/test and did not evaluate the negative challenge.
- WLASL selected evidence is useful as auxiliary diagnostics but is too sparse
  for the next primary lesson milestone.
- ASL Citizen selected raw clips have the best immediate approved-source shape:
  25 labels, 494 clips, official ASL Citizen train/validation/test splits, and
  a source-register entry scoped to noncommercial school-assignment raw-video
  use.
- Existing ASL Citizen diagnostic manifests may be stale against the current
  source-register hash. Refresh them before deriving strict lesson manifests.
- Do not train, export ONNX, promote a model card, select thresholds, push, or
  spend Brev money in this mission until the strict dry-run passes and a later
  prompt explicitly authorizes a bounded compute envelope.

## Milestone Path

Follow these milestones in order. Do not invent a new milestone on the fly.

### 3AJ-A Refresh ASL Citizen Diagnostic Manifests

Run the existing exporter with `--write` so
`data/manifests/diagnostics/asl-citizen-selected/{train,validation,test}.json`
and `docs/validation/asl-citizen-selected-manifests.json` bind to the current
source-register hash.

Record:

- label count;
- clip count by split;
- participant count by split;
- minimum clips per label by split;
- source-register hash;
- selected import hash;
- source review hash.

### 3AJ-B Export Strict Lesson-Milestone Manifests

Create or extend tooling so the same approved ASL Citizen selected clips can be
written to:

```text
data/manifests/lesson/rawframe-milestone/train.json
data/manifests/lesson/rawframe-milestone/validation.json
data/manifests/lesson/rawframe-milestone/test.json
```

The lesson manifests must keep correct manifest-relative `relative_video_path`
values. Do not copy the diagnostic manifest files by hand unless the paths are
programmatically rewritten and validated.

The lesson manifests must use:

- `schema_version: "asl-pilot-rawframe-manifest/v1"`;
- 25 labels from the selected ASL Citizen import;
- `dataset_source_mode: "approved_external_raw_video_source"`;
- source id `asl-citizen-school-assignment-raw-videos`;
- official ASL Citizen train/validation/test split membership;
- current source-register/source-review/selected-import hashes;
- no derived features and no pretrained-generated annotation fields.

Write a summary receipt under `docs/validation/`, preferably
`docs/validation/return-to-form-asl-citizen-lesson-milestone-manifests-v1.json`.

### 3AJ-C Accept ASL Citizen Provenance In The Strict Dry-Run

Patch `scripts/train_rawframe_model.py` provenance validation so
`source_id == "asl-citizen-school-assignment-raw-videos"` is accepted only when
the clip records the reviewed ASL Citizen raw-video fields already emitted by
the selected exporter:

- `source_category: "asl_citizen_official_zip_range_selected_raw_video"`;
- `source_file_url` exactly
  `https://download.microsoft.com/download/b/8/8/b88c0bae-e6c1-43e1-8726-98cf5af36ca4/ASL_Citizen.zip`;
- `source_archive_path`;
- `source_archive_crc32`;
- `source_archive_local_header_offset`;
- `source_sign_slug`;
- `source_video_path`;
- `source_subject_rights_evidence`;
- manifest split aligned with source split.

Do not loosen PopSign or WLASL checks while adding ASL Citizen.

### 3AJ-D Strict Local Dry-Run

Run the strict no-training dry-run:

```sh
python3 scripts/train_rawframe_model.py \
  --train-manifest data/manifests/lesson/rawframe-milestone/train.json \
  --validation-manifest data/manifests/lesson/rawframe-milestone/validation.json \
  --test-manifest data/manifests/lesson/rawframe-milestone/test.json \
  --output-dir artifacts/rawframe-lesson-milestone \
  --architecture motion_2d_temporal_cnn \
  --lesson-milestone \
  --check-files \
  --dry-run
```

This is the mission's key gate. If it fails, fix the manifest/provenance issue
or write the exact blocker. Do not replace it with `--allow-small-label-set`.

### 3AJ-E Evidence Package

Write a numbered session log and update the plan overlay with:

- diagnostic manifest refresh status;
- lesson-milestone manifest paths and hashes;
- ASL Citizen provenance dry-run status;
- exact commands run;
- no-training/no-Brev/no-promotion boundaries;
- next action: local smoke planning or bounded Brev training proposal, only
  after the strict dry-run passes.

## First Reviewable Slice

Complete 3AJ-A through 3AJ-D if they fit in one clean slice. If that is too
large, stop after 3AJ-A plus a precise implementation plan for 3AJ-B/C. The
preferred slice is:

1. Refresh ASL Citizen selected diagnostic manifests with `--write`.
2. Add the smallest reusable exporter change or new script needed for
   `data/manifests/lesson/rawframe-milestone/*`.
3. Add ASL Citizen provenance validation to `scripts/train_rawframe_model.py`.
4. Run the strict `--lesson-milestone --check-files --dry-run` command above.
5. Run the audit commands listed below.
6. Write a numbered session log.
7. Commit only scoped files.

## Acceptance Criteria

Mission 3AJ is complete only when:

1. `GOAL.md` points at this prompt and names Mission 3AJ.
2. ASL Citizen selected diagnostic manifests bind to the current source
   register hash.
3. Lesson milestone manifests exist at the exact paths required by
   `scripts/train_rawframe_model.py --lesson-milestone`.
4. The strict lesson-milestone dry-run passes with `--check-files`.
5. `scripts/train_rawframe_model.py` accepts ASL Citizen only through the
   reviewed school-assignment raw-video provenance fields.
6. No training, Brev spend, model-card promotion, ONNX export, threshold
   promotion, generated pseudo-labels, source approval shortcut, push,
   destructive reset, or broad 75/95-label rerun occurs.
7. The evidence package records what is now ready and what still requires a
   later compute/training decision.

## Required Validation

Run from repo root unless noted:

```sh
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m py_compile scripts/train_rawframe_model.py
git diff --check
```

Also run the strict dry-run command from 3AJ-D.

## Observer Guidance

The observer should judge progress against the milestone path above.

- CONTINUE when the executor advances the next listed manifest/provenance gate.
- NUDGE if a required audit, hash, or source/provenance field is missing.
- REDIRECT if the executor tries to train, spend Brev, promote a model, or
  bypass the strict lesson-milestone dry-run.
- STOP only when the strict dry-run passes and the next action is a human
  compute/training decision, or when a real source/provenance blocker requires
  human approval.
- ESCALATE only for a technical blocker that may require changing the source
  route, model architecture, or compute plan.

Do not ask the observer to invent the next milestone. The next milestone is the
first incomplete item in the Milestone Path.

## Progress Ledger Template

Each executor session log should end with:

```text
Current state:        Mission 3AJ approved source vocabulary unblock.
Completed:            <smallest useful slice>.
Evidence:             <commands, artifacts, hashes, dry-run/audit outcomes>.
Remaining:            <next milestone item>.
Blockers:             <none, or exact source/provenance/manifest blocker>.
Next step:            <single next action from the Milestone Path>.
Checkpoint commit:    <commit hash>.
```
