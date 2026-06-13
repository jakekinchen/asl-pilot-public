# Return-To-Form M3EY Overnight Brev Lesson Model Completion Goal Loop Prompt

Mission 3EY prompt for the Codex executor after the supervising user explicitly
redirected the loop from the M3EX docs-only downscope into an overnight
completion push with bounded Brev/GPU use.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Push the project toward the requested end state: an interactive browser-first
ASL learning app with the best honest scratch-trained model path we can produce
overnight. This mission is allowed to use the retained Brev L40S worker for a
bounded train/evaluate/copyback attempt when local dry-runs and cost controls
pass.

The first model lane is the 25-label ASL Citizen lesson milestone, not the
failed seven-label high-signal region-grid TCN. A local supervisor preflight on
2026-05-28 proved the exact 25-label lesson dry-run/check-files command passes:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 scripts/train_rawframe_model.py \
  --train-manifest data/manifests/lesson/rawframe-milestone/train.json \
  --validation-manifest data/manifests/lesson/rawframe-milestone/validation.json \
  --test-manifest data/manifests/lesson/rawframe-milestone/test.json \
  --output-dir artifacts/rawframe-lesson-milestone \
  --model-id probe-lesson-25-dry-run \
  --dry-run --check-files --lesson-milestone \
  --architecture motion_2d_temporal_cnn \
  --epochs 1 --batch-size 8 --learning-rate 0.001
```

PopSign 25/50/95 remains a useful diagnostic scale ladder, but it is not the
first overnight training target because the current PopSign label-ladder
manifests fail local dry-run with a stale `source_register.sha256` mismatch
against `docs/model/dataset-source-register.json`. Repairing that is a future
local receipt/pivot, not something to paper over during training.

## Current Human Approval And Budget

The latest supervising-user instruction in this thread authorizes overnight
completion work, Brev usage, intentional dataset/vocabulary pivots, research,
testing, and backtracking when approaches fail.

This authorization is bounded:

- Window: until 2026-05-29 04:00 America/Chicago unless a hard blocker appears
  earlier.
- Budget: do not exceed $250 total Brev spend from this point. Use far less
  when possible.
- Preferred worker: the retained stoppable L40S worker
  `asl-pilot-m3eh-l40s-001` / `3d58wpy9o`, currently known to be
  `STOPPED / COMPLETED / NOT READY / HEALTHY`.
- Observed retained-worker price: `l40s-48gb.1x` at `$1.74/hr`; if current
  provider state contradicts this, record the new price and stop for human
  review before using a worker above `$5/hr`.
- No duplicate GPU worker. Do not create a new worker unless the retained
  worker is unavailable and the observer explicitly records a bounded
  replacement decision.
- Stop/default-off after every train/evaluate/copyback slice, after a failed
  remote preflight, after any command timeout, or whenever no useful remote work
  remains queued.

## Source Of Truth

1. Latest supervising-user instruction.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. This prompt.
4. M3EW metric triage:
   [`docs/validation/return-to-form-m3ew-m3ev-metric-triage-no-remote-v1.json`](../validation/return-to-form-m3ew-m3ev-metric-triage-no-remote-v1.json).
5. Observer 547 API memo:
   [`artifacts/research/observer-547-m3ew-post-tcn-strategy/response.md`](../../artifacts/research/observer-547-m3ew-post-tcn-strategy/response.md).
6. Lesson milestone manifests:
   - [`data/manifests/lesson/rawframe-milestone/train.json`](../../data/manifests/lesson/rawframe-milestone/train.json)
   - [`data/manifests/lesson/rawframe-milestone/validation.json`](../../data/manifests/lesson/rawframe-milestone/validation.json)
   - [`data/manifests/lesson/rawframe-milestone/test.json`](../../data/manifests/lesson/rawframe-milestone/test.json)
   - [`data/manifests/negative-challenge.json`](../../data/manifests/negative-challenge.json)
7. Training/evaluation/export code:
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/evaluate_rawframe_model.py`](../../scripts/evaluate_rawframe_model.py)
   - [`scripts/export_onnx_model.py`](../../scripts/export_onnx_model.py)
   - [`scripts/promote_trained_model_card.mjs`](../../scripts/promote_trained_model_card.mjs)
8. Detector 0 side-worktree evidence, only as diagnostic context unless it is
   deliberately ported with review:
   `/Users/kelly/Developer/asl-pilot-detector0-win`.

## Overnight Mission Ladder

Do one smallest useful reviewable slice per executor turn. Do not skip
receipts, logs, audits, or fail-closed boundaries.

1. **M3EY-A: Brev lesson-model train/evaluate/copyback.**
   Reconfirm local dry-run, start only the retained L40S worker, sync once,
   prove remote `.venv` CUDA/Torch, run remote dry-run/check-files, run exactly
   one timed non-dry-run lesson-milestone training command, evaluate once,
   copy scoped artifacts back under ignored `output/`, stop the worker, write a
   receipt and session log, and commit only tracked receipt/log/prompt/doc
   artifacts.
2. **M3EY-B: Export/promotion only if gates pass.**
   If the M3EY-A model passes predeclared gates, run export/browser promotion
   through existing scripts and model-card flow. If it does not pass, do not
   promote or activate browser recognition.
3. **M3EY-C: Product interaction hardening.**
   Improve the interactive fail-closed learner experience, lesson flow,
   camera/local-only behavior, and browser tests without claiming recognition
   when no promoted artifact exists.
4. **M3EY-D: Dataset/architecture pivot.**
   If ASL Citizen 25-label training fails, use evidence to choose exactly one
   pivot: PopSign source-register/manifest repair and diagnostic label-ladder,
   Detector 0 worktree integration review, TCN architecture fix, or product-only
   hardening. Research with `openai-api-research` or `gpt-pro-research` before
   another speculative training-style run.

## Required First Slice

Complete M3EY-A unless a required preflight fails.

Required local checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/export_onnx_model.py
python3 -m json.tool docs/validation/return-to-form-m3ew-m3ev-metric-triage-no-remote-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
git diff --check
```

Required local dry-run:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 scripts/train_rawframe_model.py \
  --train-manifest data/manifests/lesson/rawframe-milestone/train.json \
  --validation-manifest data/manifests/lesson/rawframe-milestone/validation.json \
  --test-manifest data/manifests/lesson/rawframe-milestone/test.json \
  --output-dir artifacts/rawframe-lesson-milestone \
  --model-id m3ey-lesson25-motion2d-brev \
  --dry-run --check-files --lesson-milestone \
  --architecture motion_2d_temporal_cnn \
  --epochs 24 --batch-size 8 --learning-rate 0.001 \
  --training-augmentation mild --checkpoint-selection best_validation
```

Allowed Brev commands for M3EY-A, in order:

```sh
brev start asl-pilot-m3eh-l40s-001
timeout 300s brev exec asl-pilot-m3eh-l40s-001 "<remote cuda/process inspection>"
bash scripts/brev_sync_repo.sh asl-pilot-m3eh-l40s-001
timeout 600s brev exec asl-pilot-m3eh-l40s-001 "<remote lesson dry-run/check-files>"
timeout 5400s brev exec asl-pilot-m3eh-l40s-001 "<remote timed lesson training>"
timeout 2400s brev exec asl-pilot-m3eh-l40s-001 "<remote evaluation>"
brev copy asl-pilot-m3eh-l40s-001:/home/ubuntu/asl-pilot/artifacts/rawframe-lesson-milestone artifacts/
brev stop asl-pilot-m3eh-l40s-001
```

Remote train command shape:

```sh
cd /home/ubuntu/asl-pilot && timeout 5100 .venv/bin/python scripts/train_rawframe_model.py \
  --train-manifest data/manifests/lesson/rawframe-milestone/train.json \
  --validation-manifest data/manifests/lesson/rawframe-milestone/validation.json \
  --test-manifest data/manifests/lesson/rawframe-milestone/test.json \
  --output-dir artifacts/rawframe-lesson-milestone \
  --model-id m3ey-lesson25-motion2d-brev \
  --architecture motion_2d_temporal_cnn \
  --check-files --lesson-milestone \
  --frame-count 16 --image-size 96 --num-workers 2 \
  --epochs 24 --batch-size 8 --learning-rate 0.001 \
  --training-augmentation mild --checkpoint-selection best_validation
```

Remote evaluation command shape:

```sh
cd /home/ubuntu/asl-pilot && .venv/bin/python scripts/evaluate_rawframe_model.py \
  --checkpoint artifacts/rawframe-lesson-milestone/model_state.pt \
  --training-provenance artifacts/rawframe-lesson-milestone/training-provenance.json \
  --train-manifest data/manifests/lesson/rawframe-milestone/train.json \
  --validation-manifest data/manifests/lesson/rawframe-milestone/validation.json \
  --test-manifest data/manifests/lesson/rawframe-milestone/test.json \
  --challenge-manifest data/manifests/negative-challenge.json \
  --output-report artifacts/rawframe-lesson-milestone/validation-report.json \
  --calibrated-provenance artifacts/rawframe-lesson-milestone/calibrated-provenance.json \
  --prediction-sidecar artifacts/rawframe-lesson-milestone/prediction-sidecar.json \
  --batch-size 8 --num-workers 2 --lesson-milestone
```

If the evaluation fails only because the current negative-challenge manifest is
core-taxonomy diagnostic rather than the full lesson milestone hard-negative
taxonomy, rerun evaluation once with `--lesson-core-negative-diagnostic` and
record that the result is diagnostic-only and not promotable.

## Gates

Do not export, promote, or activate browser recognition unless M3EY-A evidence
meets all of:

- validation top-1 >= `0.70`;
- validation macro-F1 >= `0.65`;
- test top-1 >= `0.70`;
- no zero-recall active labels on validation or test;
- hard-negative false accept rate <= `0.05`;
- calibrated threshold has nonzero true-positive coverage;
- no pretrained/generated-label components;
- claim surfaces and audits pass.

Failing these gates is still useful evidence, but it is not product readiness.

## Receipt

Write:

`docs/validation/return-to-form-m3ey-overnight-brev-lesson-model-completion-v1.json`

The receipt must include:

- current user approval, time window, price/budget state, and worker identity;
- local dry-run and audit results;
- every Brev command actually run, with timeout and outcome;
- remote CUDA/process/venv evidence;
- train command, output path, copied artifact hashes, and checkpoint ignore
  status;
- evaluation metrics and gate pass/fail table;
- stop/default-off verification;
- `pretrained_components: []`;
- claim boundary and changed files;
- exactly one next action.

Allowed next actions:

- `continue_export_browser_promotion` only if all gates pass.
- `continue_fail_closed_interactive_product_hardening` if model gates fail but
  product value can improve without recognition claims.
- `continue_popsign_source_register_manifest_repair` if ASL Citizen 25 fails
  and the next best evidence path is PopSign scale-ladder diagnostics.
- `continue_detector0_worktree_integration_review` if recognizer failure points
  back to crop/detector localization and the detector0-win worktree has
  portable evidence.
- `continue_openai_or_gpt_pro_research` if the next ML move would otherwise be
  speculative.
- `stop_for_human_budget_or_claim_review` if spend, claims, source scope, or
  final-gate changes require human review.

## Session Log

Write:

`docs/session-logs/549-mission-3ey-overnight-brev-lesson-model-completion.md`

## Hard Boundaries

- No pretrained detector, landmark model, backbone, embedding, teacher logits,
  MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP, `from_pretrained`,
  `pretrained=True`, pseudo-labels, or generated labels in the promoted lane.
- No raw learner video/frame upload.
- No unreviewed source import or source-register approval changes during the
  train/evaluate slice.
- No PopSign training until its stale source-register hash/claim boundary is
  repaired in a tracked local receipt.
- No duplicate worker, non-stoppable worker, worker delete/reset, broad
  unbounded sweep, hyperparameter search, or final-gate weakening.
- No export, model-card promotion, browser activation, product-readiness claim,
  or ASL-correctness claim unless the gates above pass and the relevant
  existing audit/promote scripts pass.
- No push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3EY.
2. Required local checks and dry-run pass or record exact blockers.
3. The retained L40S worker is started only if safe, used only inside the
   bounded envelope, and stopped/default-off afterward.
4. Exactly one remote lesson-milestone train/evaluate attempt is run, or the
   exact preflight blocker is recorded before training.
5. Scoped artifacts are copied back under `artifacts/rawframe-lesson-milestone`
   if they exist; `artifacts/rawframe-lesson-milestone/model_state.pt` remains
   ignored by `.gitignore`.
6. The tracked receipt and numbered session log exist and select exactly one
   next action.
7. Claim surfaces remain honest unless and until all gates pass and promotion
   scripts run in a later authorized slice.
