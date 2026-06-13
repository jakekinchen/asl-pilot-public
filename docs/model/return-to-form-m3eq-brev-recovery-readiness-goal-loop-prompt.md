# Return-To-Form M3EQ Brev Recovery Readiness Goal Loop Prompt

Mission 3EQ prompt for the Codex executor after M3EP stopped on Brev
provider/SSH instability and the user explicitly reauthorized the overnight
completion push.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Recover the retained Brev worker as a usable training surface, or prove exactly
why it is still not usable. This is an infrastructure unblock mission, not a
model-quality claim.

The executor must complete one bounded recovery/readiness packet:

1. verify the local repo/audit/claim surfaces;
2. start only the retained `asl-pilot-m3eh-l40s-001` worker if safe;
3. prove a remote shell path by `brev exec` or the Brev SSH host alias;
4. reconcile `/home/ubuntu/asl-pilot` versus `/home/shadeform/asl-pilot`;
5. sync the repo/data allowlist with the existing helper if the checkout is
   absent or stale;
6. repair only the project Python/CUDA environment if it is absent or broken;
7. run one no-training remote dry-run/readiness command if the environment is
   usable;
8. stop the worker and verify default-off;
9. write a tracked receipt and numbered session log with exactly one next
   action.

Do not claim recognizer readiness, Detector 0 readiness, browser recognition,
or final project completion from M3EQ. This mission exists to unblock the next
real model/product slice.

## Starting Evidence

- M3EP executor commit `a41624a` wrote
  [`docs/validation/return-to-form-m3ep-brev-sync-preflight-no-training-v1.json`](../validation/return-to-form-m3ep-brev-sync-preflight-no-training-v1.json)
  and selected `stop_for_provider_or_budget_blocker`.
- Observer commit `911f75a` verified the retained worker was default-off after
  the provider state briefly changed underneath the STOP decision.
- Current read-only state before this prompt showed the retained worker as
  `STOPPED / COMPLETED / NOT READY / HEALTHY`.
- The supervising user then explicitly renewed the overnight objective: keep
  the pair moving, unblock Brev usage, build toward the detector/TCN product,
  research/backtrack when evidence demands it, and be intentional about
  dataset/vocabulary decisions. That approval does not relax no-pretrained,
  source/provenance, raw learner video, fail-closed claim, promotion, or
  final-readiness gates.
- Browser recognition remains fail-closed: `web/public/model/model-card.json`
  is `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has no active labels.

## Compute Envelope

Current status: `authorized_for_brev_recovery_readiness_no_training`.

Use only the retained worker unless this mission records a STOP and asks for a
separate replacement-worker decision:

```text
workspace: asl-pilot-m3eh-l40s-001
expected id: 3d58wpy9o
expected type: l40s-48gb.1x
M3EQ max wall time after first start: 35 minutes
M3EQ max expected spend: 7 USD
timed training commands: 0
new workers: 0
worker delete/reset: 0
package install commands: at most 1 project-environment repair block
```

Allowed Brev/SSH commands in this mission:

```sh
brev ls --json
brev start asl-pilot-m3eh-l40s-001
timeout 180s brev exec asl-pilot-m3eh-l40s-001 "<bounded inspection/probe command>"
ssh -o BatchMode=yes -o ConnectTimeout=20 asl-pilot-m3eh-l40s-001 "<bounded inspection/probe command>"
bash scripts/brev_sync_repo.sh asl-pilot-m3eh-l40s-001
brev stop asl-pilot-m3eh-l40s-001
ps -axo pid=,ppid=,pgid=,command=
kill -TERM <local-stuck-brev-exec-pid>
```

The direct `ssh` command is allowed only as a fallback when `brev exec` cannot
reach the remote shell after the worker is otherwise reported ready. It must use
the Brev host alias for the same retained worker and must run bounded
inspection/probe commands only.

Allowed remote environment repair, only after a synced/current checkout exists
and only if `.venv/bin/python` is absent, non-executable, or cannot import
CUDA-enabled torch:

```sh
cd <verified-remote-checkout> &&
python3 -m venv .venv &&
.venv/bin/python -m pip install --upgrade pip &&
.venv/bin/python -m pip install torch==2.12.0 --index-url https://download.pytorch.org/whl/cu130
```

Do not install unrelated packages. Do not change `requirements.txt`,
dependency lock files, source files, manifests, tensors, datasets, or browser
runtime to make the environment repair pass.

## Required Slice

Start with local read-only checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3ep-brev-sync-preflight-no-training-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
bash -n scripts/brev_sync_repo.sh
brev ls --json
```

Then complete exactly one remote recovery/readiness pass:

1. Confirm `brev ls --json` lists only the retained ASL Pilot L40S worker for
   this mission and that it is safe to start.
2. Start only that worker. If it does not become ready/healthy inside the
   envelope, stop it and record the exact provider state.
3. Try one bounded `brev exec` remote inspection. If it waits on SSH or fails
   before reaching a remote shell, terminate only the local stuck `brev exec`
   process if needed and try the direct `ssh` fallback once.
4. Remote inspection must record:
   - `$HOME`, `pwd`, and `whoami`;
   - `nvidia-smi` summary and process list;
   - whether `/home/ubuntu/asl-pilot` exists;
   - whether `/home/shadeform/asl-pilot` exists;
   - whether `GOAL.md`, this M3EQ prompt, the M3EP receipt, and
     `scripts/train_rawframe_model.py` are present at the selected checkout;
   - whether `.venv/bin/python` exists and can import torch/CUDA.
5. If the remote checkout is absent or stale, run the existing sync helper once:

```sh
bash scripts/brev_sync_repo.sh asl-pilot-m3eh-l40s-001
```

6. If the synced/current checkout lacks a usable CUDA torch environment, run
   the single allowed environment repair block above. Record exact stdout,
   stderr summary, version, CUDA availability, and device name.
7. If repo/data/env are usable, run exactly one no-training remote dry-run:

```sh
cd <verified-remote-checkout> &&
PYTHONDONTWRITEBYTECODE=1 .venv/bin/python scripts/train_rawframe_model.py \
  --train-manifest data/manifests/lesson/high-signal-region-grid/train.json \
  --validation-manifest data/manifests/lesson/high-signal-region-grid/validation.json \
  --test-manifest data/manifests/lesson/high-signal-region-grid/test.json \
  --output-dir output/m3dm-high-signal-region-grid-tcn-brev \
  --model-id m3eq-high-signal-region-grid-tcn-readiness \
  --architecture true_temporal_convnet_region_grid \
  --check-files \
  --frame-count 16 \
  --image-size 96 \
  --num-workers 2 \
  --epochs 12 \
  --batch-size 8 \
  --learning-rate 0.001 \
  --training-augmentation mild \
  --checkpoint-selection best_validation \
  --region-grid-tcn-training-smoke \
  --dry-run \
  --require-input-contract rgb_regions_grid_v1
```

This command is a dry-run/check-files readiness proof only. It must not train,
write a checkpoint, export, evaluate, promote, or activate browser recognition.

8. Stop the worker and verify `brev ls --json` reports it as `STOPPED`.
9. Write the receipt:

`docs/validation/return-to-form-m3eq-brev-recovery-readiness-v1.json`

The receipt must include local checks, worker identity/state transitions,
exec/SSH recovery path, remote path inspection, sync decision/result, file
freshness evidence, environment repair result or reason skipped, dry-run result
or blocker, default-off verification, negative authorizations, changed files,
and exactly one next action.

10. Write a numbered session log and commit only the receipt/session-log files,
unless this prompt itself required a tiny documented correction discovered
during the slice.

## Allowed Next Actions

Select exactly one:

- `continue_bounded_brev_tcn_training_smoke`: use only if worker control,
  checkout freshness, CUDA torch, data allowlist, and the remote dry-run all
  pass.
- `continue_brev_environment_repair_retry`: use only if the worker is
  controllable and synced but the single allowed environment repair did not
  produce CUDA torch.
- `continue_brev_provider_replacement_decision`: use if the retained worker
  cannot provide a stable shell despite bounded recovery attempts and a
  replacement worker needs an explicit compute-envelope prompt.
- `continue_detector0_union_target_local_smoke_no_brev`: use if remote compute
  is unnecessary and the best next evidence step is local Detector 0
  union/contact target work.
- `continue_fail_closed_interactive_product_hardening`: use if ML routes are
  blocked enough that product interactivity is the best next deadline slice.
- `continue_openai_or_gpt_pro_research`: use if evidence leaves a high-cost
  strategy choice unclear.
- `stop_for_provider_or_budget_blocker`: use if the worker cannot be safely
  stopped, cost/control state is unclear, or the executor would need to exceed
  this mission envelope.

## Hard Boundaries

- No recognizer training/fitting/evaluation rerun.
- No Detector 0 training.
- No architecture search, hyperparameter sweep, repeated retry, timed training
  command, backward/optimizer loop, checkpoint, model artifact, export, or
  promotion.
- No dependency-file mutation, source/media download, source-register mutation,
  manifest/tensor/vocabulary/packet mutation, label expansion, generated
  labels, pseudo-labels, or raw learner video upload.
- No pretrained detector, landmark model, backbone, embedding, feature
  extractor, teacher logits, MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP,
  `from_pretrained`, `pretrained=True`, or model-weight shortcut in the
  promoted lane.
- No browser recognition activation, ASL-correctness claim, product-runtime
  mutation, final-readiness claim, duplicate worker, worker delete/reset, broad
  remote run, push, amend, or `--no-verify`.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3EQ.
2. Required local audits and JSON validations pass or exact blockers are
   recorded.
3. The retained worker either has a proven bounded shell path or the receipt
   records exact provider failure evidence after the allowed recovery attempts.
4. Remote checkout path, sync decision, repo/data freshness, Python/CUDA status,
   environment repair result or skip reason, and dry-run result or blocker are
   recorded.
5. Any Brev start stays within the 35 minute / 7 USD envelope and is followed
   by stopped-state verification unless the receipt records an exact
   safe-control blocker.
6. The M3EQ receipt exists at
   `docs/validation/return-to-form-m3eq-brev-recovery-readiness-v1.json`.
7. No training, source import, export, promotion, browser activation, product
   runtime mutation, broad labels, pretrained/generated-label path, raw learner
   upload, duplicate worker, worker delete/reset, push, or unsupported claim
   occurs.
8. A numbered session log records commands, evidence, changed files, blockers,
   Brev status, and exactly one next action.

## Observer Guidance

- CONTINUE if M3EQ preserves the readiness/no-training boundary, verifies
  default-off Brev state, and selects a bounded next action.
- NUDGE if the receipt misses worker identity, exec/SSH path evidence, sync
  decision, Python/CUDA proof or blocker, dry-run proof or blocker, claim
  surfaces, default-off proof, or exactly one next action.
- REDIRECT if the executor runs training, Detector 0 training, source mutation,
  browser activation, promotion, duplicate worker creation, or unbounded Brev
  work.
- STOP if Brev cannot be controlled safely, budget/provider state is unclear,
  or the next action needs a new human/provider decision beyond this prompt.
- ESCALATE if local and remote evidence leave a high-cost strategy choice
  unclear after bounded recovery.
