---
name: asl-pilot-ml-receipt
description: Use when planning, auditing, refreshing, or executing ASL Pilot ML training, evaluation, export, Brev, Hugging Face, or receipt work in /Users/kelly/Developer/asl-pilot.
---

# ASL Pilot ML Receipt

Use this skill for ML/data/model slices in `/Users/kelly/Developer/asl-pilot`,
especially return-to-form, PopSign fresh5, local dry-run, Brev, evaluation
contract, export, and promotion receipt work.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current thread.
2. `GOAL.md`.
3. The active per-milestone prompt named in `GOAL.md`.
4. `docs/model/return-to-form-plan.md`.
5. Relevant receipts under `docs/validation/`.
6. Relevant session logs under `docs/session-logs/`.
7. `CLAUDE.md`, `DECISIONS.md`, and `ARCHITECTURE.md`.
8. The actual code under `scripts/`, `data/manifests/`, `web/public/model/`,
   and `web/src/`.

Current files beat old session logs. Active prompt boundaries beat generic ML
skill guidance.

## Hard Boundaries

- Do not run training, fitting, optimizer construction, `backward`, sweeps,
  checkpoint writes, export, browser activation, model-card promotion, Brev
  exec/sync/lifecycle commands, source-register approval changes, manifest
  mutation, tensor mutation, source import, media download, or label expansion
  unless the active prompt and latest user instruction explicitly allow that
  exact action.
- No pretrained detector, landmark, backbone, embedding, feature extractor,
  generated pseudo-label, `from_pretrained`, YOLO, MediaPipe, OpenPose, CLIP,
  SAM, DINO, `timm` pretrained weights, or similar shortcut in the promoted
  lane.
- Do not upload raw learner video or frames.
- Do not replace the repo audit chain with a parallel tracker or benchmark
  system. Add evidence to existing receipts, reports, scripts, and logs.

## Workflow

1. Verify repo state:

```sh
git status --short --branch
git log -10 --oneline --decorate
```

2. Read `GOAL.md` and the active prompt. Classify the slice as one of:
   no-training receipt refresh, local dry-run/check-files, local fitting,
   Brev fitting, evaluation contract, export/promotion, data/source audit, or
   UI claim work.

3. For no-training receipt work, prefer side-effect-free checks:

```sh
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
git diff --check
```

Use `PYTHONDONTWRITEBYTECODE=1 .venv/bin/python` for prompt-specified Python
dry-runs and py-compile checks.

4. Record exact commands in the receipt, split into:
   commands run, commands intentionally not run, and commands blocked.

5. Any future train/eval route must have:
   exact command, exact output path, expected metrics, max runtime, max spend,
   kill condition, artifacts, copyback/default-off plan, duplicate-worker
   avoidance, current approval state, and exactly one next action.

6. If evaluation cannot read the same evidence mode or preserve the same tensor
   axis used by training, choose an evaluation-contract-fix next action before
   any fitting route.

## Brev Handling

- `brev ls --json` is read-only visibility.
- `brev exec`, `brev sync`, `brev stop`, worker creation, and lifecycle changes
  are spend/control actions unless the active prompt explicitly authorizes them.
- When checking remote Python/Torch, run from the project virtualenv on the
  remote checkout, not the default shell Python.

## Hugging Face Handling

Hugging Face skills are helpers, not policy.

- `huggingface-datasets` is appropriate for read-only public dataset metadata
  or explicitly approved source review.
- `hf-cli` is appropriate for explicit Hub, cache, repo, job, or artifact tasks.
- `huggingface-trackio` may supplement future training telemetry, but JSON
  receipts and repo audit scripts remain required.
- Do not upload raw learner video, private traces, or project artifacts unless
  the user explicitly authorizes the exact target and privacy posture.

## Output

When reporting, include the receipt path, commands run, important blockers,
claim boundary, and exact next action. Do not describe a dry-run, receipt, or
milestone as model readiness.
