# Return-To-Form Resumed Brev TCN Microexperiment Goal Loop Prompt

Mission 3DM prompt for the Codex executor after the M3DL product-smoke STOP was
superseded by the user's renewed full-project completion objective.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one bounded Brev-backed ML slice that moves the project toward
the original composable, no-pretrained ASL recognizer objective without
pretending current evidence is a promoted browser model.

The authorized slice is a full-split high-signal true-TCN smoke on the existing
A100 worker. It should test whether the existing region-axis-preserving
TemporalConvNet path can learn the source-reviewed high-signal module better
than the prior capped local M3AW smoke and the PopSign Tier 0 M3AH motion-CNN
smoke.

This is not final training, not model-card promotion, not ONNX export, and not
browser activation.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. The overnight completion prompt and receipts:
   - [`docs/model/return-to-form-overnight-completion-goal-loop-prompt.md`](return-to-form-overnight-completion-goal-loop-prompt.md)
   - [`docs/validation/return-to-form-overnight-brev-readiness-v1.json`](../validation/return-to-form-overnight-brev-readiness-v1.json)
   - [`docs/validation/return-to-form-overnight-cuda-smoke-v1.json`](../validation/return-to-form-overnight-cuda-smoke-v1.json)
4. Current TCN/high-signal evidence:
   - [`docs/validation/return-to-form-true-tcn-architecture-scaffold-v1.json`](../validation/return-to-form-true-tcn-architecture-scaffold-v1.json)
   - [`docs/validation/return-to-form-region-grid-tcn-local-smoke-v1.json`](../validation/return-to-form-region-grid-tcn-local-smoke-v1.json)
   - [`docs/validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json`](../validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json)
5. Current PopSign/Tier 0 CUDA smoke evidence:
   - [`output/m3ah-tier0-cuda-full-split-recognizer/training-provenance.json`](../../output/m3ah-tier0-cuda-full-split-recognizer/training-provenance.json)
   - [`output/m3ah-tier0-cuda-full-split-recognizer/validation-report.json`](../../output/m3ah-tier0-cuda-full-split-recognizer/validation-report.json)
6. Current manifests/tensors:
   - [`data/manifests/lesson/high-signal-region-grid/train.json`](../../data/manifests/lesson/high-signal-region-grid/train.json)
   - [`data/manifests/lesson/high-signal-region-grid/validation.json`](../../data/manifests/lesson/high-signal-region-grid/validation.json)
   - [`data/manifests/lesson/high-signal-region-grid/test.json`](../../data/manifests/lesson/high-signal-region-grid/test.json)
   - [`data/tensors/asl-citizen-high-signal-region-grid/`](../../data/tensors/asl-citizen-high-signal-region-grid/)
7. Current fail-closed claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Current Evidence

M3DL refreshed fail-closed product smoke evidence and stopped for human
product/cost review. The latest user instruction supersedes that stop and
explicitly requests continued Brev use and ML progress.

The existing worker is usable:

```text
workspace: asl-pilot-rawframe-001
id: 2hl1hytty
gpu: NVIDIA A100-SXM4-80GB
project python: /home/shadeform/asl-pilot/.venv/bin/python
torch: 2.12.0+cu130
```

Fresh local inspection before this prompt found no active training process and
`nvidia-smi` reported `0 MiB` GPU memory used. Use this existing worker first.
Do not create a duplicate worker.

M3AW proved the `true_temporal_convnet_region_grid` path preserves
`B,T,R,C,H,W` inputs and writes reports, but its capped local smoke failed
metrics. M3AX proved the same path can memorize a deterministic tiny subset.
M3AH proved the A100 training path works on PopSign Tier 0 but the motion-CNN
smoke was not promotable. The next useful evidence is one bounded full-split
true-TCN smoke on the high-signal region-grid module.

## Required Slice

Complete exactly one smallest useful bounded Brev/TCN microexperiment.

1. Run local state and policy checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py
python3 -m json.tool docs/validation/return-to-form-overnight-brev-readiness-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-overnight-cuda-smoke-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-region-grid-tcn-local-smoke-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-region-grid-tcn-tiny-overfit-v1.json >/dev/null
```

2. Record Brev pre-run state:

```sh
brev ls --json
brev exec asl-pilot-rawframe-001 "cd /home/shadeform/asl-pilot && git rev-parse --short HEAD && git status --short && /home/shadeform/asl-pilot/.venv/bin/python - <<'PY'
import torch
print(torch.__version__)
print(torch.cuda.is_available())
print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'no-cuda')
PY
nvidia-smi --query-gpu=name,memory.total,memory.used,utilization.gpu --format=csv,noheader
ps -eo pid,etime,pcpu,pmem,args | egrep 'python|torch|train|screen|tmux|jupyter' | grep -v egrep || true"
```

3. Sync the current repo and required data to the existing worker:

```sh
bash scripts/brev_sync_repo.sh
```

If sync fails, fix sync rather than training against stale files.

4. Run the remote dry-run input-contract check:

```sh
brev exec asl-pilot-rawframe-001 "cd /home/shadeform/asl-pilot && /home/shadeform/asl-pilot/.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3dm-high-signal-region-grid-tcn-brev --model-id m3dm-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke --dry-run --require-input-contract rgb_regions_grid_v1"
```

5. Run exactly one bounded remote training command:

```sh
brev exec asl-pilot-rawframe-001 "cd /home/shadeform/asl-pilot && timeout 2700 /home/shadeform/asl-pilot/.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-dir output/m3dm-high-signal-region-grid-tcn-brev --model-id m3dm-high-signal-region-grid-tcn-brev --architecture true_temporal_convnet_region_grid --check-files --frame-count 16 --image-size 96 --num-workers 2 --epochs 12 --batch-size 8 --learning-rate 0.001 --training-augmentation mild --checkpoint-selection best_validation --region-grid-tcn-training-smoke"
```

Compute receipt for this command:

- expected signal: training loss movement plus uncapped validation and test
  reports on the high-signal region-grid module;
- max runtime: 45 minutes via `timeout 2700`;
- max spend for this slice: 20 USD;
- kill condition: timeout, CPU-only training, CUDA unavailable, duplicate
  training process, or no metric output after startup;
- artifact plan: copy back
  `output/m3dm-high-signal-region-grid-tcn-brev/`;
- cleanup: do not stop the worker until copied artifacts and receipt are
  committed, unless the run is hung or unsafe.

6. Run remote evaluation. If metrics fail gates but report files are written,
classify that as a model-result failure, not a command failure:

```sh
brev exec asl-pilot-rawframe-001 "cd /home/shadeform/asl-pilot && /home/shadeform/asl-pilot/.venv/bin/python scripts/evaluate_rawframe_model.py --checkpoint output/m3dm-high-signal-region-grid-tcn-brev/model_state.pt --training-provenance output/m3dm-high-signal-region-grid-tcn-brev/training-provenance.json --train-manifest data/manifests/lesson/high-signal-region-grid/train.json --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json --test-manifest data/manifests/lesson/high-signal-region-grid/test.json --output-report output/m3dm-high-signal-region-grid-tcn-brev/validation-report.json --calibrated-provenance output/m3dm-high-signal-region-grid-tcn-brev/calibrated-provenance.json --prediction-sidecar output/m3dm-high-signal-region-grid-tcn-brev/prediction-sidecar.json --batch-size 8 --num-workers 2 --region-grid-tcn-training-smoke"
```

7. Copy back artifacts:

```sh
brev copy asl-pilot-rawframe-001:/home/shadeform/asl-pilot/output/m3dm-high-signal-region-grid-tcn-brev output/
```

8. Write a tracked receipt:

`docs/validation/return-to-form-resumed-brev-tcn-microexperiment-v1.json`

The receipt must include:

- local HEAD, active prompt, and command evidence;
- Brev workspace state, process list, CUDA probe, and sync status;
- exact dry-run, training, evaluation, and copyback commands;
- training history and selected epoch;
- validation/test metrics, per-label recall/confusion if available, and
  comparison to M3AW and M3AH;
- `pretrained_components: []` and random-initialization proof from provenance;
- no model-card promotion, no export, no browser activation, no final claim,
  no raw learner upload, no source import, and no push;
- whether this result justifies a follow-up training adjustment, detector/crop
  repair, data/vocabulary pivot, product fallback, or strategy escalation;
- exactly one next action.

9. Write numbered session log `docs/session-logs/466-mission-3dm-resumed-brev-tcn-microexperiment.md`
and commit only scoped files.

## Next Action Choices

Select exactly one:

- `continue_bounded_tcn_adjustment`: only if the run shows plausible learning
  and one bounded hyperparameter/input adjustment is justified.
- `continue_detector_or_crop_repair`: if metrics point to crop/ROI/region
  failure before further recognizer training.
- `continue_data_vocabulary_pivot`: if split/source/vocabulary limitations
  dominate and a smaller or cleaner source-reviewed set is needed.
- `continue_product_fallback_evidence_package`: if ML evidence is not
  promotable and the product should close as a fail-closed interactive demo.
- `escalate_strategy_research`: if the result is ambiguous and another
  speculative training retry would not be justified without API/GPT research.
- `stop_for_human_cost_or_scope_decision`: if Brev/provider state, budget,
  source rights, or product scope requires human action before further work.

## Hard Boundaries

- No pretrained detector, landmark, backbone, embedding, pseudo-label, or
  generated-label dependency in the promoted lane.
- No broad 75/80/95-label training.
- No duplicate Brev worker.
- No worker delete/reset without explicit human approval.
- No model-card hand promotion, ONNX export, browser trained activation,
  threshold promotion, final-readiness claim, or positive ASL correctness
  claim from this smoke.
- No raw learner video upload.
- No source import, source-register approval change, manifest mutation, tensor
  mutation, or vocabulary expansion.
- No push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3DM.
2. Required local audits and JSON validations pass or record exact blockers.
3. Brev state, sync state, CUDA readiness, and process state are recorded.
4. The dry-run input-contract check passes before training.
5. Exactly one bounded remote training command runs, or the exact blocker is
   recorded before paid work.
6. Evaluation report/provenance/sidecar artifacts are copied back or the
   no-artifact reason is recorded.
7. The receipt compares the result to M3AW and M3AH and selects exactly one
   next action.
8. No promotion/export/browser/final-claim/source/push boundary is violated.
9. A numbered session log records commands, evidence, metrics, blockers, Brev
   state, and next action.

## Observer Guidance

- CONTINUE if the executor completes this bounded run and selects one
  evidence-backed next ML/product action.
- NUDGE if copyback, metrics, random-initialization proof, Brev state, or
  exactly-one-next-action is missing.
- REDIRECT if the executor trains broad labels, skips the dry-run, uses stale
  remote files, creates a duplicate worker, or makes promotion claims.
- ESCALATE before approving another speculative training retry if this run does
  not explain the bottleneck.
- STOP only for real cost/provider/source/product decisions, not merely
  because the model result is weak.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3DM resumed Brev TCN microexperiment.
Completed:            <run, receipt, blocker, or copyback result>.
Evidence:             <receipt, commands, artifact hashes, metrics, Brev state>.
Remaining:            <single next action>.
Blockers:             <none or exact technical/source/cost/product blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
