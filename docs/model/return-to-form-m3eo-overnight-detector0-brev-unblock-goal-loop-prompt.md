# Return-To-Form M3EO Overnight Detector 0/Brev Unblock Goal Loop Prompt

Mission 3EO prompt for the Codex executor after the user explicitly
superseded the M3EN STOP and authorized the overnight completion push.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete one bounded **overnight unblock packet** that converts the human
approval into executable next work without jumping into an unsupported model
run.

The mission has two parts:

1. Reconcile the latest M3EN objectness blocker with the older expanded /
   union Detector 0 packet lineage, and decide the next supportable Detector 0
   target path.
2. Perform at most one tightly capped Brev preflight on the existing stopped
   `asl-pilot-m3eh-l40s-001` worker so the next executor can use compute only
   if the local evidence supports it.

This is not recognizer training, Detector 0 training, architecture search,
export, promotion, browser activation, product-runtime mutation, or final
readiness proof.

## Current Evidence

- M3EN executor commit `99550d0` wrote
  `docs/validation/return-to-form-m3en-detector0-source-region-receipts-v1.json`
  and selected `stop_for_human_detector0_annotation_budget`.
- Observer commit `85be500` parked the loop because continuing would have
  required human annotation/target-scope approval. The latest user instruction
  now supplies that approval for bounded overnight work, but no-pretrained,
  source/provenance, raw learner video, fail-closed claim, and final-promotion
  gates remain binding.
- Browser recognition remains fail-closed: `web/public/model/model-card.json`
  is `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has `activeLabels: []`.
- M3EM proved Tiny2 train sanity but failed held-out signal: train accuracy
  `1.0`, held-out accuracy `0.5`, all held-out predictions `hello`, and
  `table` zero recall.
- M3EN's inspected objectness packet remains label-confounded:
  target presence is equivalent to `label_id == table`.
- The repo also has an expanded Detector 0 packet lineage:
  `data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`
  currently reports 32 reviewed rows and a
  `table_two_hand_union_or_contact_region` target with train/validation/test
  table support. M3EO must verify that lineage from current files and decide
  whether it is the honest next Detector 0 path, a stale side path, or only
  diagnostic evidence.
- Brev currently has the retained `asl-pilot-m3eh-l40s-001` L40S worker
  stopped. M3EH proved sync and dry-run plumbing, but CUDA compatibility needed
  repair; M3EO may spend a tiny amount only to prove current CUDA/Torch status
  and then default the worker off.

## Required Slice

Start with read-only local checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/validation/return-to-form-m3en-detector0-source-region-receipts-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
brev ls --json
```

Then inspect, without mutating, at least:

- M3EK/M3EL/M3EM/M3EN receipts;
- Detector 0 objectness/support/class-invariant/fixed-geometry receipts;
- expanded/union Detector 0 packet receipts under
  `docs/validation/return-to-form-tier0-detector0-*`;
- `data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`;
- source register and relevant PopSign / ASL Citizen manifest metadata;
- model-card and active-vocabulary claim surfaces;
- existing Brev receipts for M3EH/M3EH-R if present.

Build one tracked receipt:

`docs/validation/return-to-form-m3eo-overnight-detector0-brev-unblock-v1.json`

The receipt must answer:

- exactly what the M3EN objectness blocker still blocks;
- whether the expanded/union Detector 0 packet is current, source-approved,
  reviewed, and supportable enough for the next **local** scratch Detector 0
  smoke;
- whether any immediate packet mutation is still needed before a local smoke;
- whether recognizer Brev compute remains blocked by Tiny2 held-out collapse;
- whether the next compute-producing route should be Detector 0 local smoke,
  Detector 0 Brev smoke, TCN Brev smoke, fail-closed product work, or research;
- what Brev state and CUDA/Torch status are now.

## Bounded Brev Preflight

The latest user instruction authorizes bounded Brev usage for the overnight
completion push. For M3EO only, this means:

- Maximum runtime: 20 minutes.
- Maximum expected spend: 3 USD.
- Worker: existing `asl-pilot-m3eh-l40s-001` only.
- Duplicate worker creation: forbidden.
- Worker delete/reset: forbidden.
- Remote training: forbidden.
- Sync/copy: forbidden unless a remote command proves the checkout is missing
  the repo, in which case select `continue_brev_sync_preflight_no_training`
  instead of improvising.
- Kill condition: any unexpected worker name/id, any existing training/GPU
  process, CUDA/Torch failure that cannot be fixed by an already-installed
  environment selection, elapsed time over 20 minutes, or any prompt conflict.
- Default-off: stop the worker after preflight and verify `brev ls --json`
  reports `STOPPED`, unless the receipt proves an immediate follow-on prompt is
  committed and the user is still actively supervising.

Allowed Brev commands in M3EO:

```sh
brev ls --json
brev start asl-pilot-m3eh-l40s-001
brev exec asl-pilot-m3eh-l40s-001 "pwd; nvidia-smi; test -x /home/shadeform/asl-pilot/.venv/bin/python && /home/shadeform/asl-pilot/.venv/bin/python - <<'PY'
import json
import torch
print(json.dumps({
  'torch': torch.__version__,
  'cuda_available': torch.cuda.is_available(),
  'cuda_version': torch.version.cuda,
  'device_count': torch.cuda.device_count(),
  'device_name': torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
}, sort_keys=True))
PY"
brev stop asl-pilot-m3eh-l40s-001
brev ls --json
```

If `brev start` or `brev exec` fails, record the exact failure and select a
repair next action. Do not install packages, sync, train, reset, delete, or
create another worker in M3EO.

## Allowed Next Actions

Select exactly one:

- `continue_detector0_union_target_local_smoke_no_brev`: use if the expanded /
  union packet is current and supportable enough for one local scratch Detector
  0 smoke before any remote compute.
- `continue_detector0_packet_target_repair_no_brev`: use if the packet or
  target schema still needs a bounded local mutation/review before smoke.
- `continue_brev_cuda_environment_repair_no_training`: use if the worker starts
  but CUDA/Torch is not usable.
- `continue_brev_sync_preflight_no_training`: use only if the worker is usable
  but remote checkout/data state is missing or stale.
- `continue_fail_closed_interactive_product_hardening`: use if model routes are
  currently nonproductive but product interactivity can move the deadline demo.
- `continue_openai_or_gpt_pro_research`: use if the evidence leaves a high-cost
  strategy choice unclear.
- `stop_for_provider_or_budget_blocker`: use if Brev cannot be controlled
  safely inside the budget envelope.

## Hard Boundaries

- No recognizer training/fitting/evaluation rerun.
- No Detector 0 training.
- No architecture search, hyperparameter sweep, or repeated retry.
- No source import, media download, source-register mutation, manifest/tensor/
  vocabulary mutation, label expansion, generated labels, pseudo-labels, or
  raw learner video upload.
- No pretrained detector, landmark model, backbone, embedding, feature
  extractor, teacher logits, MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP,
  `from_pretrained`, `pretrained=True`, or model-weight shortcut in the
  promoted lane.
- No model artifact, checkpoint, ONNX export, browser recognition activation,
  model-card promotion, active-label promotion, ASL-correctness claim, final
  readiness claim, or product-runtime mutation.
- No duplicate Brev worker, worker delete, worker reset, broad remote run, or
  Brev spend beyond the explicit M3EO preflight envelope.
- No push, amend, or `--no-verify`.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3EO.
2. Required local audits and JSON validations pass or exact blockers are
   recorded.
3. The M3EO receipt exists at
   `docs/validation/return-to-form-m3eo-overnight-detector0-brev-unblock-v1.json`.
4. The receipt records commands run, files inspected, artifact hashes, M3EN
   blocker interpretation, expanded/union packet interpretation, source/
   register posture, fail-closed claim surfaces, Brev state, compute envelope,
   negative authorizations, changed files, and exactly one next action.
5. Any Brev preflight stays within the 20 minute / 3 USD envelope and is
   followed by stopped-state verification unless the receipt records an exact
   safe-control blocker.
6. No training, packet mutation, source import, export, promotion, browser
   activation, product runtime mutation, broad labels, pretrained/generated
   label path, raw learner upload, duplicate worker, worker delete/reset, push,
   or unsupported claim occurs.
7. A numbered session log records commands, evidence, changed files, blockers,
   Brev status, and exactly one next action.

## Observer Guidance

- CONTINUE if M3EO produces a bounded next action and preserves the no-
  pretrained/fail-closed/source/Brev-control boundaries.
- NUDGE if the receipt misses artifact hashes, Brev envelope fields, M3EN
  interpretation, expanded/union packet interpretation, claim-surface proof,
  or exactly one next action.
- REDIRECT if the executor tries broad training, source mutation, packet
  mutation, product activation, promotion, or unbounded Brev work.
- STOP if Brev cannot be controlled safely, budget/provider state is unclear,
  or the next action needs a new human approval beyond this prompt.
- ESCALATE if local evidence leaves a high-cost strategy choice unclear.
