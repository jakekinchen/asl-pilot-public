# Return-To-Form M3FP Overnight Brev Detector/TCN Completion Goal Loop Prompt

Mission 3FP prompt for the Codex executor after the supervising user explicitly
reopened the parked M3FO loop and approved bounded overnight Brev/model work.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Push the project toward the requested end state: the strongest honest
browser-first ASL learning product we can produce overnight, using the existing
repo audit chain, scratch-trained model code, Brev GPU compute, and the best
dataset/vocabulary evidence currently available.

This mission is not a permission slip to relabel prior weak models as ready.
Current evidence says:

- M3EY already ran the 25-label ASL Citizen lesson model on the retained L40S
  worker and failed promotion gates.
- M3FM already triaged the PopSign 95-label diagnostic ladder and found weak
  near-chance metrics.
- `/Users/kelly/Developer/asl-pilot-detector0-win` has useful Detector 0 /
  crop-normalization evidence, especially a stricter right-hand gate, but it
  is not yet main-branch runtime authority.
- The local supervisor proved the PopSign Fresh5 repaired manifest can dry-run
  with the scratch motion-region-token temporal architecture and the scoped
  Brev output path:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py \
  --popsign-fresh5-training-smoke \
  --train-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json \
  --validation-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json \
  --test-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json \
  --output-dir output/m3eh-popsign-fresh5-motion-region-token-temporal-brev-fit \
  --model-id m3fp-popsign-fresh5-motion-region-token-brev \
  --dry-run --check-files \
  --architecture scratch_motion_region_token_temporal_contract_v1 \
  --frame-count 16 --image-size 96 \
  --epochs 20 --batch-size 4 \
  --max-train-batches 32 --max-validation-batches 32 \
  --num-workers 0 --training-augmentation none \
  --checkpoint-selection best_validation
```

## Human Approval And Budget

The latest supervising-user instruction authorizes overnight completion work,
Brev usage, intentional dataset/vocabulary pivots, research, testing,
backtracking, and help from the supervisor.

This authorization is bounded:

- Window: until 2026-05-29 04:00 America/Chicago unless a hard blocker appears
  earlier.
- Budget ceiling: do not exceed `$150` additional Brev spend from this
  reopened mission, and do not knowingly exceed `$250` total project Brev
  spend; prefer the cheapest useful path.
- Worker: prefer retained `asl-pilot-m3eh-l40s-001` / `3d58wpy9o`.
- Price guard: if current Brev state reports a worker above `$5/hour`, stop
  for human review before using it.
- No duplicate GPU worker unless the retained worker cannot be started and the
  observer records a bounded replacement decision.
- Stop/default-off after every train/evaluate/copyback slice, after a failed
  remote preflight, after a timeout, or whenever no useful remote work remains
  queued.

## Source Of Truth

1. Latest supervising-user instruction.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. This prompt.
4. M3FO final fail-closed package:
   [`docs/validation/return-to-form-m3fo-final-fail-closed-demo-evidence-v1.json`](../validation/return-to-form-m3fo-final-fail-closed-demo-evidence-v1.json).
5. M3EY Brev lesson model receipt:
   [`docs/validation/return-to-form-m3ey-overnight-brev-lesson-model-completion-v1.json`](../validation/return-to-form-m3ey-overnight-brev-lesson-model-completion-v1.json).
6. M3FM PopSign label-ladder metric triage:
   [`docs/validation/return-to-form-m3fm-popsign-label-ladder-metric-triage-no-training-v1.json`](../validation/return-to-form-m3fm-popsign-label-ladder-metric-triage-no-training-v1.json).
7. Detector 0 side-worktree evidence:
   `/Users/kelly/Developer/asl-pilot-detector0-win`.
8. PopSign Fresh5 repaired manifests:
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json)
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json)
   - [`data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json`](../../data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json)
9. Existing training/evaluation/export code:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - [`scripts/export_onnx_model.py`](../../scripts/export_onnx_model.py)
   - [`scripts/promote_trained_model_card.mjs`](../../scripts/promote_trained_model_card.mjs)

## Required First Slice: M3FP-A

Run one reviewable Brev-backed model attempt or record the exact preflight
blocker before training.

Required local checks:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/export_onnx_model.py
python3 -m json.tool docs/validation/return-to-form-m3fo-final-fail-closed-demo-evidence-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ey-overnight-brev-lesson-model-completion-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3fm-popsign-label-ladder-metric-triage-no-training-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
git -C /Users/kelly/Developer/asl-pilot-detector0-win status --short --branch
git -C /Users/kelly/Developer/asl-pilot-detector0-win log -4 --oneline --decorate
git diff --check
```

Required local dry-run:

```sh
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py \
  --popsign-fresh5-training-smoke \
  --train-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json \
  --validation-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json \
  --test-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json \
  --output-dir output/m3eh-popsign-fresh5-motion-region-token-temporal-brev-fit \
  --model-id m3fp-popsign-fresh5-motion-region-token-brev \
  --dry-run --check-files \
  --architecture scratch_motion_region_token_temporal_contract_v1 \
  --frame-count 16 --image-size 96 \
  --epochs 20 --batch-size 4 \
  --max-train-batches 32 --max-validation-batches 32 \
  --num-workers 0 --training-augmentation none \
  --checkpoint-selection best_validation
```

Allowed Brev commands for M3FP-A, in order:

```sh
brev start asl-pilot-m3eh-l40s-001
timeout 300s brev exec asl-pilot-m3eh-l40s-001 "<remote cuda/process inspection>"
bash scripts/brev_sync_repo.sh asl-pilot-m3eh-l40s-001
timeout 600s brev exec asl-pilot-m3eh-l40s-001 "<remote dry-run/check-files command>"
timeout 5400s brev exec asl-pilot-m3eh-l40s-001 "<remote timed PopSign Fresh5 train command>"
timeout 2400s brev exec asl-pilot-m3eh-l40s-001 "<remote evaluation command>"
brev copy asl-pilot-m3eh-l40s-001:/home/ubuntu/asl-pilot/output/m3eh-popsign-fresh5-motion-region-token-temporal-brev-fit output/
brev stop asl-pilot-m3eh-l40s-001
```

Remote train command shape:

```sh
cd /home/ubuntu/asl-pilot && timeout 5100 .venv/bin/python scripts/train_rawframe_model.py \
  --popsign-fresh5-training-smoke \
  --train-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json \
  --validation-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json \
  --test-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json \
  --output-dir output/m3eh-popsign-fresh5-motion-region-token-temporal-brev-fit \
  --model-id m3fp-popsign-fresh5-motion-region-token-brev \
  --check-files \
  --architecture scratch_motion_region_token_temporal_contract_v1 \
  --frame-count 16 --image-size 96 \
  --epochs 20 --batch-size 4 \
  --max-train-batches 32 --max-validation-batches 32 \
  --num-workers 0 --training-augmentation none \
  --checkpoint-selection best_validation
```

Remote evaluation command shape:

```sh
cd /home/ubuntu/asl-pilot && .venv/bin/python scripts/evaluate_rawframe_model.py \
  --checkpoint output/m3eh-popsign-fresh5-motion-region-token-temporal-brev-fit/model_state.pt \
  --training-provenance output/m3eh-popsign-fresh5-motion-region-token-temporal-brev-fit/training-provenance.json \
  --train-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/train.json \
  --validation-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/validation.json \
  --test-manifest data/manifests/return-to-form-popsign-fresh5-repaired-v1/test.json \
  --output-report output/m3eh-popsign-fresh5-motion-region-token-temporal-brev-fit/validation-report.json \
  --calibrated-provenance output/m3eh-popsign-fresh5-motion-region-token-temporal-brev-fit/calibrated-provenance.json \
  --prediction-sidecar output/m3eh-popsign-fresh5-motion-region-token-temporal-brev-fit/prediction-sidecar.json \
  --batch-size 4 --num-workers 0 --popsign-fresh5-training-smoke
```

If the retained worker uses `/home/shadeform/asl-pilot` instead of
`/home/ubuntu/asl-pilot`, use the actual `$HOME/asl-pilot` path reported by
the worker. If the remote `.venv` is missing, install dependencies only if the
installed prompt and current time leave enough room for a train/evaluate pass;
otherwise record the blocker and stop the worker.

## Promotion Gates

Do not export, promote, or activate browser recognition unless evidence meets
all of:

- validation top-1 >= `0.75`;
- validation macro-F1 >= `0.70`;
- test top-1 >= `0.75`;
- no zero-recall labels on validation or test;
- no pretrained/generated-label components;
- existing no-pretrained, source-register, model-card, claim-matrix, browser
  smoke, typecheck, and lint audits pass.

Failing these gates is still useful evidence, but it is not product/model
readiness and must not activate browser recognition.

## Receipt

Write:

`docs/validation/return-to-form-m3fp-overnight-brev-detector-tcn-completion-v1.json`

The receipt must include:

- current user approval, time window, budget/price state, and worker identity;
- local checks and local dry-run result;
- every Brev command actually run, with timeout/outcome;
- remote CUDA/process/venv evidence;
- detector0-win evidence reviewed and why it was or was not integrated;
- train command, output path, copied artifact hashes, and checkpoint ignore
  status;
- evaluation metrics and gate pass/fail table;
- stop/default-off verification;
- `pretrained_components: []`;
- fail-closed claim boundary and changed files;
- exactly one next action.

Allowed next actions:

- `continue_export_browser_promotion` only if all gates pass.
- `continue_detector0_integration_for_crop_normalized_recognizer` if model
  quality is still limited but Detector 0 evidence is the best next lever.
- `continue_fail_closed_interactive_product_hardening` if model gates fail and
  product value can improve without recognition claims.
- `continue_openai_or_gpt_pro_research` if the next ML move would otherwise be
  speculative.
- `stop_for_human_budget_or_claim_review` if spend, claims, source scope, or
  final-gate changes require human review.

## Session Log

Write:

`docs/session-logs/590-mission-3fp-overnight-brev-detector-tcn-completion.md`

## Hard Boundaries

- No pretrained detector, landmark model, backbone, embedding, teacher logits,
  MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP, `from_pretrained`,
  `pretrained=True`, pseudo-labels, generated labels, or machine-generated
  landmarks in the promoted lane.
- No raw learner video/frame upload.
- No unreviewed source import or source-register approval changes.
- No wholesale merge from `/Users/kelly/Developer/asl-pilot-detector0-win`;
  port only reviewed, scoped evidence/code in a later explicit slice.
- No duplicate worker, non-stoppable worker, worker delete/reset, unbounded
  sweep, hyperparameter search, or final-gate weakening.
- No export, model-card promotion, browser activation, product-readiness
  claim, or ASL-correctness claim unless the gates above pass and the relevant
  existing audit/promote scripts pass.
- No push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3FP.
2. Required local checks and dry-run pass or record exact blockers.
3. The retained L40S worker is started only if safe, used only inside the
   bounded envelope, and stopped/default-off afterward.
4. Exactly one remote PopSign Fresh5 motion-region-token train/evaluate attempt
   is run, or the exact preflight blocker is recorded before training.
5. Scoped artifacts are copied back under ignored `output/` if they exist.
6. The tracked receipt and numbered session log exist and select exactly one
   next action.
7. Claim surfaces remain honest unless and until all gates pass and promotion
   scripts run in a later authorized slice.
