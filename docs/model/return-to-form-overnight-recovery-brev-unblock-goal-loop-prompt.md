# Return-To-Form Overnight Recovery Brev Unblock Goal Loop Prompt

Mission 3DW prompt for the Codex executor after Mission 3DV proved the latest
ASL Citizen high-signal region-grid TCN route can run on CUDA but does not
generalize enough for promotion, and after the supervisor deleted the
non-stoppable stale Brev worker to remove the cost-control blocker.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Produce one post-unblock overnight recovery packet that chooses the next
evidence-backed project move without starting another blind training loop.

Current truth:

- The user explicitly asked to continue the overnight completion push and to
  unblock Brev usage.
- Mission 3DV completed at commit `85fe13b` and classified the M3DQ route as
  operational on CUDA but weak and non-promotable.
- The stale worker `asl-pilot-rawframe-001` / `2hl1hytty` used
  `massedcompute_A100_sxm4_80G_DGX`, which is not listed as stoppable by
  `brev search --gpu-name A100 --stoppable --wide`.
- Before deletion, remote process checks found no active GPU/training process,
  local copies already existed for the remote output directories, and
  `nvidia-smi` reported `0 MiB` GPU memory and `0%` GPU utilization.
- The supervisor ran `brev delete asl-pilot-rawframe-001`; follow-up
  `brev ls --json` returned `"workspaces": null`.
- No new worker has been created. Future Brev work should prefer a stoppable
  instance type and must have a fresh exact compute envelope.

The first useful slice is a no-training recovery packet that reconciles the
post-delete Brev state, summarizes what M3DV proves, compares the credible
next routes, and selects one next action for the executor/observer pair.

## Required Slice

Complete exactly one local/no-spend packet:

1. Verify current repo and pair state:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
```

2. Validate the current evidence inputs:

```sh
python3 -m json.tool docs/validation/return-to-form-brev-nonstoppable-worker-delete-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-region-grid-tcn-m3dq-metric-triage-no-remote-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-region-grid-tcn-m3dq-brev-smoke-after-input-contract-fix-v1.json >/dev/null
```

3. Reconcile Brev state:

- run `brev ls --json`;
- verify no workspace is currently running;
- do not create, start, reset, delete, or exec into a worker in this mission;
- use `brev search --gpu-name A100 --stoppable --wide` only as read-only
  evidence for future compute planning.

Allowed Brev commands in this mission:

```sh
brev ls --json
brev search --gpu-name A100 --stoppable --wide
```

4. Produce the recovery packet:

`docs/validation/return-to-form-overnight-recovery-brev-unblock-v1.json`

The packet must include:

- current user approval scope and explicit negative authorizations;
- post-delete Brev state, deletion receipt evidence, and future duplicate-worker
  avoidance;
- summary of M3DV metrics and why another blind M3DQ run is rejected;
- route comparison across ASL Citizen high-signal, PopSign fresh5, SemLex /
  ASL-LEX research-only metadata, Detector 0/crop-normalization, and
  fail-closed product polish;
- whether missing full hand/posture/face landmarks are current blockers or
  future robustness work;
- the single best next milestone for the pair;
- if the next milestone proposes Brev, the exact future compute envelope:
  instance family preference, command shape, output path, max runtime, max
  spend, kill condition, expected metric signal, copyback plan,
  teardown/default-off plan, and gates;
- if no Brev run is justified, the exact local product, detector, crop, data,
  or strategy repair that should happen first;
- files changed, commands run, blockers, and exactly one next action.

5. Write a numbered session log:

`docs/session-logs/487-mission-3dw-overnight-recovery-brev-unblock.md`

6. Commit only scoped prompt/receipt/session-log/plan evidence. Do not push.

## Allowed Next Actions

Select exactly one:

- `continue_product_interactive_fail_closed_polish_parallel`
- `continue_local_detector_crop_contract_repair_no_remote`
- `continue_bounded_brev_detector_or_crop_repair_after_unblock`
- `continue_bounded_brev_recognizer_probe_with_repaired_input_after_unblock`
- `escalate_current_strategy_research_with_m3dv_evidence`
- `stop_for_human_source_or_scope_decision`

## Hard Boundaries

- No broad 75/95/100-label training or evaluation.
- No new Brev worker, Brev exec, Brev sync, Brev start, Brev stop, Brev
  delete/reset, fitting, optimizer construction, backward, checkpoint writing,
  export, promotion, or browser recognition activation in this mission.
- No source-register approval change, source import, media download, manifest
  mutation, tensor mutation, vocabulary mutation, generated pseudo-labels, or
  SemLex/ASL-LEX media use.
- No pretrained detector, landmark, backbone, embedding, feature extractor,
  generated-label, teacher-logit, YOLO, MediaPipe, OpenPose, CLIP, SAM, DINO,
  `from_pretrained`, `pretrained=True`, or similar shortcut in the promoted
  lane.
- No raw learner video upload, final-gate weakening, unsupported product claim,
  amend, no-verify, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3DW.
2. Required audits and JSON validations pass or exact blockers are recorded.
3. Brev is verified as no running workspace, or a contradictory provider state
   is recorded.
4. The tracked recovery packet exists and includes current evidence, route
   comparison, future Brev envelope or local repair, negative authorizations,
   blockers, and exactly one next action.
5. No training/fitting/checkpoint/export/promotion/browser activation/source
   mutation/pretrained dependency/new worker/delete/reset occurs.
6. A numbered session log records commands, evidence, changed files, blockers,
   and exactly one next action.

## Observer Guidance

- CONTINUE only if the executor produces the packet and selects a bounded next
  milestone with enough command/gate/spend detail to act on.
- NUDGE if the receipt lacks post-delete Brev state, M3DV interpretation, route
  comparison, approval boundary, or exactly one next action.
- REDIRECT if the executor proposes another blind training run, broad labels,
  pretrained shortcuts, source/tensor/manifest mutation, or promotion.
- ESCALATE with `openai-api-research` or `gpt-pro-research` before approving a
  new training-style retry if the packet cannot distinguish the technical
  blocker from current local evidence.
- STOP only for source/rights/manual annotation approval, a new destructive
  Brev action, or a project-scope decision that truly cannot proceed
  autonomously.
