# Return-To-Form M3IL Detector0 First-Party Negative Capture Packet Plan No Brev Goal Loop Prompt

Mission 3IL prompt after M3IK wrote the Detector 0 first-party negative
capture contract and selected
`continue_m3il_detector0_first_party_negative_capture_packet_plan_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 first-party negative capture packet-plan slice.

The goal is to turn the M3IK contract into a reviewable future packet plan for
first-party, consented, training-capable hard-negative/no-hand rows. This is a
planning slice only. It must not capture raw learner video, import media,
create authoritative rows, author labels, generate tensors, train, evaluate,
start Brev, export, promote, activate browser recognition, change final gates,
or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3IK first-party negative capture contract evidence:
   - [`docs/model/return-to-form-detector0-first-party-negative-capture-contract-v1.json`](return-to-form-detector0-first-party-negative-capture-contract-v1.json)
   - [`docs/validation/return-to-form-m3ik-detector0-first-party-negative-capture-contract-no-brev-v1.json`](../validation/return-to-form-m3ik-detector0-first-party-negative-capture-contract-no-brev-v1.json)
   - [`docs/session-logs/796-mission-3ik-detector0-first-party-negative-capture-contract-no-brev.md`](../session-logs/796-mission-3ik-detector0-first-party-negative-capture-contract-no-brev.md)
5. M3IJ harness evidence:
   - [`scripts/evaluate_detector0_negative_metrics.mjs`](../../scripts/evaluate_detector0_negative_metrics.mjs)
   - [`docs/validation/return-to-form-m3ij-detector0-negative-evaluation-harness-no-brev-v1.json`](../validation/return-to-form-m3ij-detector0-negative-evaluation-harness-no-brev-v1.json)
6. M3II metric-contract evidence:
   - [`docs/model/return-to-form-detector0-negative-evaluation-metric-contract-v1.json`](return-to-form-detector0-negative-evaluation-metric-contract-v1.json)
7. M3IH validation-only negative manifest evidence:
   - [`data/annotations/detector0/return-to-form-detector0-hard-negative-validation-manifest-v1.json`](../../data/annotations/detector0/return-to-form-detector0-hard-negative-validation-manifest-v1.json)
8. Positive packet and consent/source evidence:
   - [`data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json`](../../data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json)
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/privacy/dataset-consent-form.md`](../privacy/dataset-consent-form.md)
   - [`docs/model/negative-challenge-manifest-schema.md`](negative-challenge-manifest-schema.md)
9. Claim surfaces:
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Current Detector 0 State

- Detector 0 is not trained, accurate, exported, promoted, or spec-fit today.
- M3IK wrote the first-party negative capture contract, but no first-party
  negative media, rows, labels, tensors, or packet entries exist.
- M3IH hard negatives remain validation-only and are not training-capable.
- M3II/M3IJ can define and validate future negative evaluation artifacts, but
  no real detector prediction artifact exists.
- Brev is not needed for this packet-plan slice.

## Required Slice

Complete one local/no-remote/no-Brev/no-training first-party negative capture
packet-plan slice.

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
python3 -m json.tool docs/model/return-to-form-detector0-first-party-negative-capture-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ik-detector0-first-party-negative-capture-contract-no-brev-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ij-detector0-negative-evaluation-harness-no-brev-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-negative-evaluation-metric-contract-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-detector0-hard-negative-validation-manifest-v1.json >/dev/null
brev ls --json
git diff --check
```

Read-only `brev ls --json` is allowed only to prove no unexpected paid worker
is running. Do not start, stop, sync, exec, or copy from Brev in this mission.

2. Write one scoped first-party negative capture packet plan:

`docs/model/return-to-form-detector0-first-party-negative-capture-packet-plan-v1.json`

The plan must define:

- the future packet plan id, source id, consent version, and source-register
  decision it depends on;
- planned capture categories and minimum counts from M3IK, with at least 20
  planned future slots across train/validation/test;
- planned slot metadata only, clearly marked `planned_not_captured` or an
  equivalent non-authoritative status;
- per-slot required consent, signer, raw-clip hash, capture-condition,
  absence-label, no-pretrained, review, split, and withdrawal fields that must
  be filled by a later approved capture/materialization slice;
- a local-only storage and privacy plan for future raw clips, without creating
  or referencing actual raw media;
- review and fail-closed rules for blocking ambiguous, visible-hand,
  unconsented, generated-label, pseudo-label, pretrained-output, or split-
  violating rows;
- explicit separation from M3IH validation-only negatives;
- integration notes for the M3II metric contract and M3IJ harness;
- blockers and human approval required before any actual capture.

The plan may contain future slot templates or assignments. It must not create
authoritative rows, raw media paths with real files, source manifests, label
artifacts, tensors, model artifacts, or claim-surface changes.

3. Write the tracked receipt:

`docs/validation/return-to-form-m3il-detector0-first-party-negative-capture-packet-plan-no-brev-v1.json`

The receipt must include command statuses, Brev read-only inventory, changed
files, plan summary, planned-vs-authoritative-row proof, privacy proof,
training-capable-vs-validation-only separation proof, no-pretrained/
no-generated-label proof, claim-surface proof, forbidden-action proof, blockers
if any, and exactly one next action.

4. Verify:

```sh
python3 -m json.tool docs/model/return-to-form-detector0-first-party-negative-capture-packet-plan-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3il-detector0-first-party-negative-capture-packet-plan-no-brev-v1.json >/dev/null
git diff --check
```

5. Write:

`docs/session-logs/798-mission-3il-detector0-first-party-negative-capture-packet-plan-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3im_detector0_first_party_negative_capture_packet_review_no_brev`
- `continue_m3im_detector0_training_readiness_gap_contract_no_brev`
- `escalate_detector0_first_party_negative_capture_packet_strategy_with_local_evidence`
- `stop_for_human_first_party_negative_capture_approval`
- `stop_for_human_first_party_negative_capture_plan_review`

Do not select direct capture, raw learner video upload, Brev fitting, Detector
0 training, real evaluation, export, promotion, browser activation,
final-gate change, or claim expansion from M3IL.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-training only.
- No raw learner video capture or upload.
- No source/media import, source authority addition, authoritative manifest row
  creation, label authoring, generated labels, pseudo-labels, pretrained
  detector, landmark, feature, backbone, or label outputs.
- No mutation of the M3IK contract, M3II metric contract, M3IH manifest, M3ID
  packet, M3IJ harness, source register, source manifests, tensors,
  vocabulary, model cards, runtime code, final gates, claim surfaces, or
  side-worktree files.
- No training, real evaluation run, trained-detector invocation, export, ONNX,
  promotion, browser recognition activation, push, amend, or no-verify.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and does not park on an older completed
   Detector 0 slice.
2. M3IK contract evidence and receipt parse and are referenced.
3. A first-party negative capture packet plan exists or an exact blocker is
   recorded.
4. The packet plan defines future planned slots/counts without creating
   authoritative rows, raw media, labels, tensors, model artifacts, source
   authority, or claim changes.
5. The plan encodes consent/provenance, privacy, absence-label,
   no-pretrained/no-generated-label, split, review, withdrawal, and fail-closed
   requirements before any future row can become authoritative.
6. The plan separates future first-party training-capable negatives from
   existing M3IH validation-only negatives.
7. Claim surfaces remain fail-closed.
8. No raw learner video capture/upload, Brev lifecycle, remote, training, real
   evaluation run, trained-detector invocation, source/media import, source
   authority addition, label authoring, export, promotion, browser activation,
   final-gate, or claim-expansion work occurs.
9. The receipt and numbered session log exist and select exactly one allowed
   next action.
10. The change is committed with a message beginning `mission-3il:`.

## Observer Guidance

- CONTINUE if the executor writes a scoped packet plan or exact blocker, keeps
  all slots planned/non-authoritative, preserves privacy and no-pretrained
  boundaries, separates first-party future training-capable negatives from
  validation-only negatives, keeps claims fail-closed, records exact proofs,
  and selects one allowed next action.
- NUDGE if it misses planned-vs-authoritative separation, consent/provenance,
  privacy, absence-label requirements, split accounting, changed-file
  accounting, forbidden-action proof, or exactly one next action.
- REDIRECT if it captures or imports media, creates authoritative rows, authors
  labels, mutates packet or manifest rows, starts Brev/remote/training, runs
  real detector evaluation, uses pretrained or generated labels, or expands
  claims.
- STOP if first-party negative capture packet planning cannot continue without
  a human approval decision.
