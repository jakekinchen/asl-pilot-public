# Return-To-Form PopSign Fresh5 Materialization Local Smoke Goal Loop Prompt

Mission 3BS prompt for the Codex executor after the user explicitly restarted
the overnight ML/product completion push and M3BR stopped on missing supported
training data from existing materialized artifacts.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Materialize the fresh PopSign 5-label raw-source candidate selected by
[`docs/validation/return-to-form-supported-raw-source-candidates-v1.json`](../validation/return-to-form-supported-raw-source-candidates-v1.json),
then run the smallest local validation and smoke evidence that can decide
whether this route is worth a Brev training receipt. This is a data-first ML
unblock: do not promote a browser model, but do create real manifests/tensors
and a bounded local signal if the gates pass.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. Candidate audit:
   - [`docs/validation/return-to-form-supported-raw-source-candidates-v1.json`](../validation/return-to-form-supported-raw-source-candidates-v1.json)
   - [`scripts/audit_supported_raw_source_candidates.mjs`](../../scripts/audit_supported_raw_source_candidates.mjs)
4. M3BR stop evidence:
   - [`docs/validation/return-to-form-vocab-reselection-existing-local-artifacts-v1.json`](../validation/return-to-form-vocab-reselection-existing-local-artifacts-v1.json)
   - [`docs/session-logs/367-mission-3br-vocab-reselection-existing-local-artifacts.md`](../session-logs/367-mission-3br-vocab-reselection-existing-local-artifacts.md)
   - [`docs/session-logs/368-observer-stop-supported-training-data.md`](../session-logs/368-observer-stop-supported-training-data.md)
5. PopSign source and import tooling:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/research/popsign-v1-import-plan.json`](../research/popsign-v1-import-plan.json)
   - [`scripts/export_popsign_v1_import_plan.mjs`](../../scripts/export_popsign_v1_import_plan.mjs)
   - [`scripts/import_popsign_v1_raw_videos.py`](../../scripts/import_popsign_v1_raw_videos.py)
   - [`scripts/decode_raw_videos.py`](../../scripts/decode_raw_videos.py)
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
6. No-pretrained and fail-closed claim surfaces:
   - [`ARCHITECTURE.md`](../../ARCHITECTURE.md)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Current Evidence

M3BR correctly stopped because existing materialized artifacts did not contain a
2+ label training-worthy subset. The new candidate audit changes the next
action: approved local raw PopSign source files are present for 95 labels, and
the fresh packet `popsign_fresh_5_v1` avoids the exact failed M3BR/Tier0 and
hand-only diagnostic label sets where possible.

Candidate labels:

```text
thank_you
pen
home
who
morning
```

The PopSign import plan source-register hash has been refreshed. If it drifts
again, refresh it with:

```sh
node scripts/export_popsign_v1_import_plan.mjs --write
```

## Required Slice

Complete one bounded local data/materialization/smoke slice.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-supported-raw-source-candidates-v1.json >/dev/null
node scripts/audit_supported_raw_source_candidates.mjs
```

2. Refresh the PopSign import plan if and only if the candidate audit says its
source-register hash is stale.

3. Export source-bound fresh5 manifests:

```sh
.venv/bin/python scripts/import_popsign_v1_raw_videos.py \
  --manifest-dir data/manifests/return-to-form-popsign-fresh5 \
  --label thank_you \
  --label pen \
  --label home \
  --label who \
  --label morning \
  --train-clips-per-label 25 \
  --validation-clips-per-label 25 \
  --test-clips-per-label 25 \
  --allow-partial \
  --write
```

4. Validate the new manifests before decoding:

```sh
.venv/bin/python scripts/train_rawframe_model.py \
  --train-manifest data/manifests/return-to-form-popsign-fresh5/train.json \
  --validation-manifest data/manifests/return-to-form-popsign-fresh5/validation.json \
  --test-manifest data/manifests/return-to-form-popsign-fresh5/test.json \
  --output-dir output/return-to-form-popsign-fresh5-dry-run \
  --model-id asl-pilot-popsign-fresh5-dry-run-v1 \
  --allow-small-label-set \
  --check-files \
  --dry-run
```

5. Decode tensors only after manifest validation passes:

```sh
.venv/bin/python scripts/decode_raw_videos.py \
  --manifest data/manifests/return-to-form-popsign-fresh5/train.json \
  --manifest data/manifests/return-to-form-popsign-fresh5/validation.json \
  --manifest data/manifests/return-to-form-popsign-fresh5/test.json \
  --tensor-root data/tensors/return-to-form-popsign-fresh5 \
  --frame-count 16 \
  --image-size 96 \
  --allow-small-label-set
```

6. Re-run the dry-run/check-files command after decoding. If it passes and
runtime is reasonable, run one capped local smoke:

```sh
.venv/bin/python scripts/train_rawframe_model.py \
  --train-manifest data/manifests/return-to-form-popsign-fresh5/train.json \
  --validation-manifest data/manifests/return-to-form-popsign-fresh5/validation.json \
  --test-manifest data/manifests/return-to-form-popsign-fresh5/test.json \
  --output-dir output/return-to-form-popsign-fresh5-local-smoke \
  --model-id asl-pilot-popsign-fresh5-local-smoke-v1 \
  --allow-small-label-set \
  --check-files \
  --epochs 6 \
  --batch-size 8 \
  --learning-rate 0.001 \
  --architecture motion_2d_temporal_cnn \
  --training-augmentation mild \
  --checkpoint-selection best_validation \
  --max-train-batches 8 \
  --max-validation-batches 4
```

7. Produce:

`docs/validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json`

The receipt must include:

- selected labels and why they differ from the failed exact M3BR/Tier0 sets;
- source-register and PopSign import-plan hashes;
- manifest paths, SHA-256 hashes, label counts, clip counts, split counts,
  signer-alias counts, and tensor counts/hashes;
- whether decode wrote tensors and whether every manifest clip has
  `relative_frame_tensor_path` and `frame_tensor_sha256`;
- local dry-run result;
- local smoke command/result if run, including train/validation/test metrics;
- Brev status from `brev ls --json` only if already available in the current
  shell; do not run remote training in this mission;
- exact blocker if local smoke is skipped or fails;
- exactly one next action.

8. Select exactly one next action:

- `continue_region_grid_or_detector0_tensor_materialization`: manifests/tensors
  are valid but full-frame/local smoke is weak, so the next move is region-grid
  or detector/crop tensor materialization before more classifier training.
- `continue_brev_training_receipt_for_fresh5`: local gates pass strongly enough
  to write a separate Brev compute receipt for a real remote training run.
- `continue_fresh10_materialization`: fresh5 local evidence is strong enough to
  expand to `popsign_fresh_10_v1` before Brev.
- `continue_local_model_data_design_ablation`: manifests/tensors are valid but
  the local model/input contract needs one bounded ablation before Brev.
- `stop_for_human_source_or_annotation_approval`: source/rights/annotation
  review is the next real blocker.
- `stop_until_supported_training_data_exists`: the new raw-source route also
  fails to produce reviewable supported training data.

## Hard Boundaries

- No broad 75/95/100-label training or evaluation.
- No Brev training/spend in this mission. `brev ls --json` is allowed only for
  state/cost visibility; any remote command beyond a lightweight CUDA
  readiness check must be written into a separate compute receipt first.
- No source-register approval change, unreviewed source import, generated
  pseudo-labels, pretrained detector/landmark/backbone/embedding/model, or
  assisted-label path in the promoted lane.
- No ONNX export, browser model activation, active-label promotion, model-card
  promotion, final-readiness claim, final-gate weakening, product fallback
  detour, ASL correctness claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3BS.
2. The candidate audit exists, is valid JSON, and selects
   `materialize_popsign_fresh_5_candidate`.
3. Source-bound fresh5 manifests are either written and validated, or a precise
   blocker is recorded.
4. If manifests are written, every split records the five expected labels and
   at least 25 selected clips per label unless a blocker explains otherwise.
5. If decode runs, every manifest clip has a tensor path and tensor SHA-256
   after decoding.
6. A local dry-run/check-files result is recorded after manifest/tensor work.
7. A capped local smoke is either run and summarized, or skipped with a precise
   evidence-backed reason.
8. The no-pretrained audits, source-register audit, return-to-form plan audit,
   loop premise audit, receipt JSON validation, and `git diff --check` pass or
   record exact blockers.
9. No remote training, browser promotion, final claim, or push occurs.
10. A numbered session log records commands, evidence, blockers, and exactly
    one next action.

## Observer Guidance

- CONTINUE if manifests/tensors/local evidence are in scope and the receipt
  selects one bounded next action.
- NUDGE if the receipt lacks hashes, split counts, tensor counts, metric
  summaries, or a Brev boundary.
- REDIRECT if the executor repeats a known failed exact label set, skips
  manifest/tensor validation, runs broad training, or tries to promote a model.
- ESCALATE if fresh5 fails in a way that suggests the architecture/input
  strategy needs outside review before another training-style retry.
- STOP only when the next meaningful action genuinely requires human
  source/rights/annotation/budget approval or no supported training data remains.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3BS PopSign fresh5 materialization/local smoke.
Completed:            <manifests/tensors/smoke receipt or blocker>.
Evidence:             <receipt, commands, hashes, metrics>.
Remaining:            <single next action>.
Blockers:             <none or exact artifact/scope blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
