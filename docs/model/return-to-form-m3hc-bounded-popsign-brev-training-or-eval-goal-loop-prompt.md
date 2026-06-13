# Return-To-Form M3HC Bounded PopSign Brev Training Or Eval Goal Loop Prompt

Mission 3HC prompt for the Codex executor after M3HB repaired the PopSign
25-label training-smoke output namespace and proved a local no-spend dry-run.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Execute exactly one bounded PopSign 25-label Brev training/evaluation attempt,
or stop with a concrete provider/contract blocker before paid training if the
guarded preflight fails. This is diagnostic model work only. It must not promote
the browser model, activate recognition, expand active vocabulary claims, or
weaken final gates.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in this thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3HB result:
   - [`docs/validation/return-to-form-m3hb-human-reopened-model-completion-bounded-brev-v1.json`](../validation/return-to-form-m3hb-human-reopened-model-completion-bounded-brev-v1.json)
   - [`docs/session-logs/671-mission-3hb-human-reopened-model-completion-bounded-brev.md`](../session-logs/671-mission-3hb-human-reopened-model-completion-bounded-brev.md)
5. Landmark-annotation steering clarification:
   - [`docs/session-logs/672-supervisor-landmark-annotation-steering-clarification.md`](../session-logs/672-supervisor-landmark-annotation-steering-clarification.md)
6. Current implementation and data:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - [`scripts/brev_sync_repo.sh`](../../scripts/brev_sync_repo.sh)
   - `data/manifests/diagnostics/popsign-label-ladder/025-labels/*.json`
7. Claim surfaces that must remain fail-closed:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Compute Envelope

Human approval exists for this bounded route only:

- budget context: approximately `$250` total project compute budget;
- this mission expected additional spend cap: `$25`;
- price guard: do not use a worker above `$5/hour`;
- preferred worker: `asl-pilot-m3eh-l40s-001` / `3d58wpy9o`;
- replacement worker limit: one, only if the retained worker cannot become
  SSH/CUDA-ready and `brev search` shows an eligible option;
- non-dry-run training command limit: one;
- evaluator command limit: one;
- copyback command limit: one output directory;
- required output directory: `output/m3hb-popsign25-bounded-brev-contract`;
- final `brev stop`/default-off proof is required before exit unless the
  remote command is still actively running with explicit process evidence.

## Landmark-Annotation Boundary

Human-authored or explicitly source-approved landmarks, boxes, masks, or region
labels may be used as offline supervision targets for scratch-trained project
models when rights/provenance are recorded. This does not allow pretrained
landmark/detector runtimes, pretrained landmark feature caches, or per-source
rights shortcuts in the promoted/browser lane.

This M3HC route is PopSign raw-video training/evaluation. Do not import or
approve a landmark-annotation source in this slice unless the PopSign route is
blocked and the executor stops for human/source review instead of broadening
the mission.

## Required Sequence

1. Verify local state:

```sh
git status --short --branch
git log -8 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3hb-human-reopened-model-completion-bounded-brev-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
bash -n scripts/brev_sync_repo.sh
brev ls --json
brev search --stoppable --min-vram 40 --sort price --json
git diff --check
```

2. Re-run the exact local dry-run from M3HB before starting paid work:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py \
  --train-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/train.json \
  --validation-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/validation.json \
  --test-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/test.json \
  --output-dir output/m3hb-popsign25-bounded-brev-contract \
  --model-id m3hb-popsign25-bounded-brev-contract \
  --seed 20260529 \
  --architecture true_temporal_convnet_region_grid \
  --check-files \
  --frame-count 16 \
  --image-size 96 \
  --num-workers 0 \
  --epochs 1 \
  --batch-size 4 \
  --learning-rate 0.001 \
  --training-augmentation none \
  --checkpoint-selection best_validation \
  --max-train-batches 16 \
  --max-validation-batches 16 \
  --popsign-label-ladder-training-smoke \
  --dry-run
```

If this fails, stop with a receipt; do not start Brev.

3. Start and verify the selected worker:

```sh
brev start asl-pilot-m3eh-l40s-001
brev ls --json
timeout 300s brev exec asl-pilot-m3eh-l40s-001 "printf 'remote_home=%s\n' \"\$HOME\" && nvidia-smi --query-gpu=name,memory.total,memory.used,utilization.gpu --format=csv,noheader && ps -eo pid,etime,pcpu,pmem,args | egrep 'python|torch|train|screen|tmux|jupyter' | grep -v egrep || true"
bash scripts/brev_sync_repo.sh asl-pilot-m3eh-l40s-001
timeout 300s brev exec asl-pilot-m3eh-l40s-001 "cd \$HOME/asl-pilot && test ! -e output/m3hb-popsign25-bounded-brev-contract && echo output_absent"
```

If SSH/CUDA/sync/output-preexistence fails, stop the worker if it is running,
write the receipt/session log, and select the provider/cost-control blocker.

4. Run at most one remote dry-run and at most one paid training command:

```sh
timeout 420s brev exec asl-pilot-m3eh-l40s-001 "cd \$HOME/asl-pilot && PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/train.json --validation-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/validation.json --test-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/test.json --output-dir output/m3hb-popsign25-bounded-brev-contract --model-id m3hb-popsign25-bounded-brev-contract --seed 20260529 --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 0 --epochs 1 --batch-size 4 --learning-rate 0.001 --training-augmentation none --checkpoint-selection best_validation --max-train-batches 16 --max-validation-batches 16 --popsign-label-ladder-training-smoke --dry-run"
timeout 2400s brev exec asl-pilot-m3eh-l40s-001 "cd \$HOME/asl-pilot && timeout 1800 .venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/train.json --validation-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/validation.json --test-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/test.json --output-dir output/m3hb-popsign25-bounded-brev-contract --model-id m3hb-popsign25-bounded-brev-contract --seed 20260529 --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 0 --epochs 1 --batch-size 4 --learning-rate 0.001 --training-augmentation none --checkpoint-selection best_validation --max-train-batches 16 --max-validation-batches 16 --popsign-label-ladder-training-smoke"
```

5. If training writes `model_state.pt` and `training-provenance.json`, run at
most one evaluator command:

```sh
timeout 1200s brev exec asl-pilot-m3eh-l40s-001 "cd \$HOME/asl-pilot && .venv/bin/python scripts/evaluate_rawframe_model.py --checkpoint output/m3hb-popsign25-bounded-brev-contract/model_state.pt --training-provenance output/m3hb-popsign25-bounded-brev-contract/training-provenance.json --train-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/train.json --validation-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/validation.json --test-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/test.json --output-report output/m3hb-popsign25-bounded-brev-contract/validation-report.json --calibrated-provenance output/m3hb-popsign25-bounded-brev-contract/calibrated-provenance.json --prediction-sidecar output/m3hb-popsign25-bounded-brev-contract/prediction-sidecar.json --batch-size 4 --num-workers 0 --popsign-label-ladder-training-smoke"
```

6. Copy back the one output directory if it exists, hash tracked/ignored
artifacts locally, and stop the worker:

```sh
brev copy asl-pilot-m3eh-l40s-001:/home/ubuntu/asl-pilot/output/m3hb-popsign25-bounded-brev-contract output/
brev stop asl-pilot-m3eh-l40s-001
brev ls --json
```

If the preflight prints a `remote_home` other than `/home/ubuntu`, use that
exact absolute path for copyback and record the substituted command in the
receipt.

## Receipt And Log

Write:

- `docs/validation/return-to-form-m3hc-bounded-popsign-brev-training-or-eval-v1.json`
- `docs/session-logs/673-mission-3hc-bounded-popsign-brev-training-or-eval.md`

The receipt must include commands, exit codes, durations, important output,
worker price/state, spend estimate, CUDA/process proof, sync proof, exact remote
commands, copied artifact paths and hashes, metrics if evaluation ran, final
stop/default-off proof, claim-surface proof, `pretrained_components: []`, and
exactly one next action.

## Interpretation Rules

- Passing training/evaluation here is diagnostic only. Do not promote or
activate recognition.
- PopSign 25 manifests currently bind raw-frame tensors, not
  `rgb_regions_grid_v1`. Do not describe this as Detector 0 or crop-normalized
  evidence.
- If metrics are weak or collapse, do not keep retrying seeds. Route to
  metric/data/input triage, Detector 0/crop-normalized contract work, or
  research-guided strategy.
- If the run fails because of Brev auth/provider/SSH/CUDA/sync, record that as
  provider recovery, stop the worker if needed, and do not mutate model code.

## Next Action

Select exactly one:

- `continue_m3hd_popsign25_metric_triage_no_remote`
- `continue_m3hd_detector0_crop_normalized_contract`
- `continue_m3hd_research_guided_strategy_adjustment`
- `continue_m3hd_interactive_fail_closed_product_hardening`
- `stop_for_brev_provider_auth_or_cost_control`
- `stop_for_human_review`
