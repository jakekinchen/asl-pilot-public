# Return-To-Form M3EP Brev Sync Preflight No Training Goal Loop Prompt

Mission 3EP prompt for the Codex executor after M3EO selected
`continue_brev_sync_preflight_no_training`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete one bounded Brev checkout/sync preflight on the existing stopped
`asl-pilot-m3eh-l40s-001` worker. The goal is to reconcile the worker's real
remote path, current repo/data-sync state, and existing Python/CUDA environment
without running training, installing packages, exporting, promoting, or changing
product runtime.

This is not recognizer training, Detector 0 training, architecture search,
package installation, export, browser activation, product-runtime mutation, or
final readiness proof.

## Starting Evidence

- M3EO executor commit `deb5517` wrote
  [`docs/validation/return-to-form-m3eo-overnight-detector0-brev-unblock-v1.json`](../validation/return-to-form-m3eo-overnight-detector0-brev-unblock-v1.json)
  and selected `continue_brev_sync_preflight_no_training`.
- M3EO reconciled the Detector 0 target path: independent-hand/general
  objectness is not supportable now; fixed-region evidence is diagnostic
  accounting only; the only current Detector 0 target path is target-specific
  `table_two_hand_union_or_contact_region`, and held-out behavior remains
  failing design/remediation evidence.
- M3EO Brev preflight used only `asl-pilot-m3eh-l40s-001`, observed an idle
  NVIDIA L40S with driver `565.57.01` and CUDA `12.7`, then stopped the worker.
- The M3EO remote shell reported `pwd` as `/home/ubuntu`; the approved probe
  only checked `/home/shadeform/asl-pilot/.venv/bin/python`, which was absent
  or non-executable. Earlier M3EH/M3EH-R evidence used `/home/ubuntu/asl-pilot`.
  M3EP must verify current files from the worker instead of assuming either
  path.
- Browser recognition remains fail-closed: `web/public/model/model-card.json`
  is `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has no active labels.

## Compute Envelope

Current status: `authorized_for_brev_sync_preflight_no_training`.

Use only the retained worker:

```text
workspace: asl-pilot-m3eh-l40s-001
expected id: 3d58wpy9o
expected type: l40s-48gb.1x
M3EP max wall time after start: 20 minutes
M3EP max expected spend: 3 USD
timed training commands: 0
new workers: 0
package install commands: 0
```

Allowed Brev commands in this mission:

```sh
brev ls --json
brev start asl-pilot-m3eh-l40s-001
brev exec asl-pilot-m3eh-l40s-001 "<bounded inspection/probe command>"
bash scripts/brev_sync_repo.sh asl-pilot-m3eh-l40s-001
brev stop asl-pilot-m3eh-l40s-001
```

Do not create, delete, reset, or replace a worker. If the worker is not the only
listed ASL Pilot L40S worker, if it cannot be started safely, if a GPU/training
process is running, or if stop verification fails, record the exact blocker and
select a stop action.

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
python3 -m json.tool docs/validation/return-to-form-m3eo-overnight-detector0-brev-unblock-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
bash -n scripts/brev_sync_repo.sh
brev ls --json
```

Then complete exactly one remote preflight:

1. Confirm `brev ls --json` lists only the expected
   `asl-pilot-m3eh-l40s-001` worker for this mission and that it is safe to
   start.
2. Start only that worker.
3. Inspect remote state before syncing. Record:
   - `$HOME`, `pwd`, and `whoami`;
   - `nvidia-smi` summary and running GPU/process state;
   - whether `/home/ubuntu/asl-pilot` exists;
   - whether `/home/shadeform/asl-pilot` exists;
   - whether the current M3EO receipt and M3EP prompt are present on the
     remote checkout;
   - whether `.venv/bin/python` is executable at each candidate path.
4. If the remote checkout is absent or stale, run the existing sync helper once:

```sh
bash scripts/brev_sync_repo.sh asl-pilot-m3eh-l40s-001
```

The helper may copy the repo and its existing approved training-data allowlist
to the worker. That is a remote sync of already-approved local artifacts only:
do not download media, import sources, edit the source register, mutate
manifests/tensors/vocabulary/packets, or manually improvise rsync paths if the
helper fails.

5. After sync or verified freshness, probe only the existing remote Python
environment. Do not install packages in M3EP. If `.venv/bin/python` is
executable, record the torch/CUDA/device result. If it is absent,
non-executable, or cannot import CUDA torch, record the exact failure and
select an environment-repair next action.
6. Stop the worker and verify `brev ls --json` reports it as `STOPPED`.
7. Write the receipt:

`docs/validation/return-to-form-m3ep-brev-sync-preflight-no-training-v1.json`

The receipt must include local checks, worker identity/state, remote path
inspection, sync decision, sync command result if run, file/hash freshness
evidence, Python/CUDA probe result or blocker, default-off verification,
negative authorizations, changed files, and exactly one next action.

8. Write a numbered session log and commit only the receipt/session-log files.

## Allowed Next Actions

Select exactly one:

- `continue_brev_cuda_environment_repair_no_training`: use if the repo/data
  checkout is present/current but the remote Python/Torch/CUDA environment is
  absent, non-executable, or broken.
- `continue_brev_remote_dry_run_preflight_no_training`: use only if repo/data
  checkout, Python, and CUDA proof are current and the next step is still
  dry-run/preflight only.
- `continue_detector0_union_target_local_smoke_no_brev`: use if remote compute
  is unnecessary and the honest next evidence step is local Detector 0
  union/contact smoke work.
- `continue_fail_closed_interactive_product_hardening`: use if model routes are
  not productive enough for the deadline and product interactivity is the best
  fail-closed next slice.
- `continue_openai_or_gpt_pro_research`: use if the evidence leaves a
  high-cost strategy choice unclear.
- `stop_for_provider_or_budget_blocker`: use if Brev cannot be controlled
  safely inside the envelope.

## Hard Boundaries

- No recognizer training/fitting/evaluation rerun.
- No Detector 0 training.
- No architecture search, hyperparameter sweep, repeated retry, timed training
  command, backward/optimizer loop, checkpoint, or model artifact.
- No package installation, dependency-file mutation, source/media download,
  source-register mutation, manifest/tensor/vocabulary/packet mutation, label
  expansion, generated labels, pseudo-labels, or raw learner video upload.
- No pretrained detector, landmark model, backbone, embedding, feature
  extractor, teacher logits, MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP,
  `from_pretrained`, `pretrained=True`, or model-weight shortcut in the
  promoted lane.
- No export, model-card promotion, active-label promotion, browser recognition
  activation, ASL-correctness claim, product-runtime mutation, final-readiness
  claim, duplicate worker, worker delete, worker reset, broad remote run, push,
  amend, or `--no-verify`.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3EP.
2. Required local audits and JSON validations pass or exact blockers are
   recorded.
3. The M3EP receipt exists at
   `docs/validation/return-to-form-m3ep-brev-sync-preflight-no-training-v1.json`.
4. The receipt records commands run, current worker state, remote path
   inspection, sync decision/result, file freshness evidence, Python/CUDA
   probe result or blocker, fail-closed claim surfaces, negative
   authorizations, changed files, and exactly one next action.
5. Any Brev start stays within the 20 minute / 3 USD envelope and is followed
   by stopped-state verification unless the receipt records an exact
   safe-control blocker.
6. No training, package install, source import, export, promotion, browser
   activation, product runtime mutation, broad labels, pretrained/generated
   label path, raw learner upload, duplicate worker, worker delete/reset, push,
   or unsupported claim occurs.
7. A numbered session log records commands, evidence, changed files, blockers,
   Brev status, and exactly one next action.

## Observer Guidance

- CONTINUE if M3EP preserves the sync-only/no-training boundary, verifies
  default-off Brev state, and selects a bounded next action.
- NUDGE if the receipt misses remote path evidence, sync decision, worker
  identity, Python/CUDA proof or blocker, claim surfaces, default-off proof, or
  exactly one next action.
- REDIRECT if the executor runs training, package install, source mutation,
  product activation, promotion, duplicate worker creation, or unbounded Brev
  work.
- STOP if Brev cannot be controlled safely, budget/provider state is unclear,
  or the next action needs new human approval beyond this prompt.
- ESCALATE if local and remote evidence leave a high-cost strategy choice
  unclear.
