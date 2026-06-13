# Return-To-Form M3HK Detector0 Training Data Manifest Or Label Audit No Brev Goal Loop Prompt

Mission 3HK prompt for the Codex executor after M3HJ proved that Detector 0 is
not trained, accurate, or spec-fit today and selected
`continue_m3hk_detector0_training_data_manifest_or_label_audit_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute Detector 0
training data manifest or label audit. The goal is to determine whether the
existing tracked manifest, annotation, source, and target evidence is complete
enough to support a future scratch-trained Detector 0 training/evaluation
route, and if not, record the exact gap and next bounded milestone.

This mission is an audit/receipt slice, not a training or data-mutation slice.
It must not start Brev, run remote commands, train/evaluate a recognizer, train
Detector 0, import sources, inspect raw learner media, mutate labels/manifests,
export, promote, activate browser recognition, or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3HJ evidence:
   - [`docs/validation/return-to-form-m3hj-detector0-training-accuracy-spec-fit-v1.json`](../validation/return-to-form-m3hj-detector0-training-accuracy-spec-fit-v1.json)
   - [`docs/session-logs/686-mission-3hj-detector0-training-accuracy-spec-fit.md`](../session-logs/686-mission-3hj-detector0-training-accuracy-spec-fit.md)
5. Detector 0 claim, target, and strict-gate surfaces:
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/src/lib/detector0-types.ts`](../../web/src/lib/detector0-types.ts)
   - [`docs/model/return-to-form-detector0-strict-gate-crop-normalization-contract.json`](return-to-form-detector0-strict-gate-crop-normalization-contract.json)
   - [`docs/validation/return-to-form-m3fp-overnight-brev-detector-tcn-completion-v1.json`](../validation/return-to-form-m3fp-overnight-brev-detector-tcn-completion-v1.json)
   - [`docs/validation/return-to-form-m3fq-detector0-crop-normalized-recognizer-integration-v1.json`](../validation/return-to-form-m3fq-detector0-crop-normalized-recognizer-integration-v1.json)
   - [`docs/validation/return-to-form-m3fr-detector0-strict-gate-local-smoke-no-brev-v1.json`](../validation/return-to-form-m3fr-detector0-strict-gate-local-smoke-no-brev-v1.json)
   - [`docs/validation/return-to-form-m3fs-detector0-strict-gate-metric-triage-no-brev-v1.json`](../validation/return-to-form-m3fs-detector0-strict-gate-metric-triage-no-brev-v1.json)
6. Existing Detector 0 manifest/annotation/source evidence:
   - [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json)
   - [`data/manifests/return-to-form-tier0/train.json`](../../data/manifests/return-to-form-tier0/train.json)
   - [`data/manifests/return-to-form-tier0/validation.json`](../../data/manifests/return-to-form-tier0/validation.json)
   - [`data/manifests/return-to-form-tier0/test.json`](../../data/manifests/return-to-form-tier0/test.json)
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/validation/return-to-form-tier0-detector0-annotation-packet-v0-review.md`](../validation/return-to-form-tier0-detector0-annotation-packet-v0-review.md)
   - [`docs/validation/return-to-form-tier0-detector0-annotation-review-v1.md`](../validation/return-to-form-tier0-detector0-annotation-review-v1.md)
   - [`docs/validation/return-to-form-tier0-detector0-annotation-followup-v1.md`](../validation/return-to-form-tier0-detector0-annotation-followup-v1.md)
7. Existing Detector 0 target/schema evolution receipts:
   - [`docs/validation/return-to-form-tier0-detector0-data-target-remediation-v1.json`](../validation/return-to-form-tier0-detector0-data-target-remediation-v1.json)
   - [`docs/validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json`](../validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json)
   - [`docs/validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md`](../validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md)
   - [`docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json)
   - [`docs/validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md`](../validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md)
   - [`docs/validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json`](../validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json)
   - [`docs/validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json`](../validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json)
8. Audits:
   - [`scripts/audit_source_register.mjs`](../../scripts/audit_source_register.mjs)
   - [`scripts/audit_no_pretrained_deps.mjs`](../../scripts/audit_no_pretrained_deps.mjs)
   - [`scripts/audit_no_pretrained_artifact_json.mjs`](../../scripts/audit_no_pretrained_artifact_json.mjs)
   - [`scripts/audit_detector0_manifest_contract.mjs`](../../scripts/audit_detector0_manifest_contract.mjs)
   - [`scripts/audit_detector0_strict_gate_crop_contract.mjs`](../../scripts/audit_detector0_strict_gate_crop_contract.mjs)

## Current Detector 0 State

Treat these facts as current unless live tracked evidence proves otherwise:

- M3HJ found Detector 0 is not trained, accurate, or spec-fit today.
- `web/public/model/detector0-card.json` remains `status: "not_trained"`,
  `promotion_state: "research_only"`, with `browser_artifact: null`.
- Current strict-gate evidence is diagnostic only and fails the intended recall
  and coverage gates: validation-frame recall `0.0575` at the 5 percent FPR
  threshold, precision `0.22549`, F1 `0.0916`, and learned right-hand crop
  usage around `6.07%`.
- M3HJ identified a concrete blocker: main has no trained browser artifact and
  no complete approved Detector 0 training/evaluation manifest with target
  coverage and required IoU recall, false no-hand, hard-negative, temporal
  jitter, and latency metrics.

## Required Slice

Complete one local/no-remote/no-Brev/no-training audit slice:

1. Verify live state and baseline checks:

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_detector0_manifest_contract.mjs
node scripts/audit_detector0_strict_gate_crop_contract.mjs --json
python3 -m json.tool docs/validation/return-to-form-m3hj-detector0-training-accuracy-spec-fit-v1.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-strict-gate-crop-normalization-contract.json >/dev/null
python3 -m json.tool docs/model/dataset-source-register.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-tier0/train.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-tier0/validation.json >/dev/null
python3 -m json.tool data/manifests/return-to-form-tier0/test.json >/dev/null
brev ls --json
git diff --check
```

2. Audit existing tracked evidence only. Include:

   - manifest split paths, row counts, source ids, label/sign vocabulary, signer
     or clip grouping metadata when available, and train/validation/test
     separation;
   - annotation packet rows, target ids, box/region/visibility fields,
     optional/required target coverage, missing target counts, and source ids;
   - whether every target needed by
     `left_or_first_hand`, `right_or_second_hand`, `head_or_face`, and
     `upper_body_or_signing_space` has enough approved training and validation
     labels for a real Detector 0 run;
   - whether labels are human-authored or explicitly source-approved offline
     supervision, and whether any source approval is still raw-video-only;
   - whether hard negatives, no-hand/empty/low-light negatives, temporal
     sequences, IoU `0.30`/`0.50` evaluation rows, false no-hand accounting, and
     browser latency prerequisites are present or missing;
   - whether current evidence separates "candidate rows exist" from "the target
     schema is appropriate enough for training";
   - whether any side-worktree file should be ported in a later local
     integration mission rather than merged wholesale now.

3. Do not mutate the manifest, annotation packet, source register, labels,
   tensors, vocabulary, model cards, claim surfaces, runtime code, or side
   worktree. A read-only helper is allowed only if it writes the receipt below
   and a session log.

4. Write the tracked receipt:

`docs/validation/return-to-form-m3hk-detector0-training-data-manifest-or-label-audit-no-brev-v1.json`

The receipt must include:

- current commit and active prompt;
- commands run with exit statuses;
- read-only Brev default-off state;
- files inspected and changed files;
- manifest split accounting and hashes;
- annotation/target/label coverage accounting;
- source/provenance and no-pretrained status;
- target-spec readiness by target id and by metric prerequisite;
- exact gaps blocking a Detector 0 training/evaluation run;
- forbidden-action proof;
- claim-surface proof;
- exactly one next action.

5. Write:

`docs/session-logs/688-mission-3hk-detector0-training-data-manifest-or-label-audit-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3hl_detector0_manifest_or_label_contract_repair_no_brev`
- `continue_m3hl_detector0_sideworktree_integration_no_brev`
- `continue_m3hl_detector0_bounded_brev_training_receipt_no_training`
- `continue_m3hl_detector0_source_or_label_review_packet_no_brev`
- `stop_for_human_detector0_source_or_label_approval`
- `stop_for_human_detector0_compute_approval`
- `escalate_detector0_training_data_strategy_with_local_evidence`

Do not select a direct training, Brev lifecycle, export, promotion, browser
activation, or claim-expansion action from M3HK. Future compute must be
separate, receipt-backed, capped, and explicitly approved before any lifecycle
or remote command runs.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-training only.
- Read-only `brev ls --json` is allowed to prove no unexpected paid work is
  running; no `brev start`, `brev stop`, `brev exec`, `brev sync`, copy, reset,
  delete, shell, or port-forward.
- No recognizer training/evaluation, Detector 0 training, evaluator rerun,
  threshold tuning, source/media import, raw learner media inspection, manifest
  mutation, annotation mutation, target-schema mutation, tensor/materialization
  mutation, vocabulary mutation, model-card mutation, runtime claim-surface
  mutation, export, ONNX, browser artifact promotion, browser recognition
  activation, final gate weakening, push, amend, or no-verify.
- No pretrained detector, landmark model, feature extractor, backbone, teacher
  model, embedding, MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP,
  `from_pretrained`, `pretrained=True`, generated labels, pseudo-labels, or
  pretrained feature caches in the promoted lane.
- Human-authored or explicitly source-approved landmark, box, mask, or region
  annotations may be counted as offline supervision targets only when rights
  and provenance are recorded.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3HK.
2. Required local checks pass, or exact blockers are recorded.
3. The M3HJ receipt/log and current Detector 0 claim surfaces are inspected.
4. Existing tracked manifest, annotation, source, target, and strict-gate
   evidence is audited without mutating data.
5. The receipt says whether current training/evaluation manifests and labels
   are complete enough for a real Detector 0 run, with target-by-target and
   metric-prerequisite evidence.
6. If not ready, the exact data/label/source/schema/metric gaps are recorded.
7. Claim surfaces remain fail-closed and unpromoted.
8. Brev remains default-off and no lifecycle, remote, training, source,
   manifest/label/tensor, export, promotion, browser activation, or unsupported
   claim work occurs.
9. A tracked receipt and numbered session log exist and select exactly one next
   action.
10. The change is committed with a message beginning `mission-3hk:`.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-remote/no-Brev/no-training,
  preserves fail-closed claims, produces the scoped audit receipt/log or records
  an exact blocker, and selects one allowed next action.
- NUDGE if it misses M3HJ accounting, manifest split accounting, annotation
  target coverage, provenance/source-rights separation, metric-prerequisite
  gaps, forbidden-action proof, changed-file accounting, or exactly one next
  action.
- REDIRECT if it drifts into Brev lifecycle/remote work, training/evaluation,
  source/media import, manifest/annotation/tensor/schema mutation, side-worktree
  wholesale merge, export, promotion, browser activation, or claim expansion.
- ESCALATE if the selected next action changes architecture, input
  representation, target schema, source scope, training budget, or compute and
  no current strategy memo covers the exact Detector 0 data evidence.
- STOP if the selected next action requires human source, label, annotation,
  compute, privacy, claim, strategy, or final-submission approval.
