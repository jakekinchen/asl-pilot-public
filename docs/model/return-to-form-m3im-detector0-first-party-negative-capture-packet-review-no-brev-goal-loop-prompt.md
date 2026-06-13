# Return-To-Form M3IM Detector0 First-Party Negative Capture Packet Review No Brev Goal Loop Prompt

Mission 3IM prompt after M3IL wrote the Detector 0 first-party negative
capture packet plan and selected
`continue_m3im_detector0_first_party_negative_capture_packet_review_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 first-party negative capture packet review slice.

The goal is to review the M3IL packet plan against the M3IK contract and
current project boundaries before any capture or row materialization can be
considered. This is a review slice only. It must not capture raw learner video,
import media, create authoritative rows, author labels, generate tensors,
train, evaluate, start Brev, export, promote, activate browser recognition,
change final gates, or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3IL first-party negative packet-plan evidence:
   - [`docs/model/return-to-form-detector0-first-party-negative-capture-packet-plan-v1.json`](return-to-form-detector0-first-party-negative-capture-packet-plan-v1.json)
   - [`docs/validation/return-to-form-m3il-detector0-first-party-negative-capture-packet-plan-no-brev-v1.json`](../validation/return-to-form-m3il-detector0-first-party-negative-capture-packet-plan-no-brev-v1.json)
   - [`docs/session-logs/798-mission-3il-detector0-first-party-negative-capture-packet-plan-no-brev.md`](../session-logs/798-mission-3il-detector0-first-party-negative-capture-packet-plan-no-brev.md)
5. M3IK first-party negative capture contract evidence:
   - [`docs/model/return-to-form-detector0-first-party-negative-capture-contract-v1.json`](return-to-form-detector0-first-party-negative-capture-contract-v1.json)
   - [`docs/validation/return-to-form-m3ik-detector0-first-party-negative-capture-contract-no-brev-v1.json`](../validation/return-to-form-m3ik-detector0-first-party-negative-capture-contract-no-brev-v1.json)
6. M3II/M3IJ negative evaluation evidence:
   - [`docs/model/return-to-form-detector0-negative-evaluation-metric-contract-v1.json`](return-to-form-detector0-negative-evaluation-metric-contract-v1.json)
   - [`scripts/evaluate_detector0_negative_metrics.mjs`](../../scripts/evaluate_detector0_negative_metrics.mjs)
   - [`docs/validation/return-to-form-m3ij-detector0-negative-evaluation-harness-no-brev-v1.json`](../validation/return-to-form-m3ij-detector0-negative-evaluation-harness-no-brev-v1.json)
7. M3IH validation-only negative manifest:
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
- M3IL wrote 20 future first-party negative planned slots, all
  `planned_not_captured`, with zero authoritative rows.
- Explicit human approval is still absent for any first-party capture session.
- M3IH negatives remain validation-only and are not training-capable.
- M3II/M3IJ do not yet include materialized first-party negatives in a real
  evaluation contract or harness run.
- Brev is not needed for this review slice.

## Required Slice

Complete one local/no-remote/no-Brev/no-training first-party negative capture
packet review slice.

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
python3 -m json.tool docs/model/return-to-form-detector0-first-party-negative-capture-packet-plan-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3il-detector0-first-party-negative-capture-packet-plan-no-brev-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-first-party-negative-capture-contract-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-negative-evaluation-metric-contract-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-detector0-hard-negative-validation-manifest-v1.json >/dev/null
brev ls --json
git diff --check
```

Read-only `brev ls --json` is allowed only to prove no unexpected paid worker
is running. Do not start, stop, sync, exec, or copy from Brev in this mission.

2. Write one scoped packet-plan review artifact:

`docs/model/return-to-form-detector0-first-party-negative-capture-packet-plan-review-v1.json`

The review must check:

- packet plan path/hash/schema and M3IK contract path/hash/schema;
- planned slot count, category counts, split counts, and slot status;
- that every slot remains non-authoritative and `planned_not_captured`;
- that future-only fields remain null where required: consent, signer, raw
  clip path/hash, capture-condition evidence, review status, reviewer,
  reviewed-at, split proof, and withdrawal acknowledgement;
- that the plan does not reference real raw media, create source authority,
  author labels, generate tensors, or mutate claim surfaces;
- privacy and withdrawal handling;
- no-pretrained/no-generated-label requirements;
- separation from M3IH validation-only negatives;
- current M3II/M3IJ integration gaps before real evaluation;
- blockers before any capture or row materialization.

The review may recommend a next local planning or review step. It must not
repair or mutate the M3IL packet plan, create rows, capture media, or authorize
capture.

3. Write the tracked receipt:

`docs/validation/return-to-form-m3im-detector0-first-party-negative-capture-packet-review-no-brev-v1.json`

The receipt must include command statuses, Brev read-only inventory, changed
files, review summary, pass/fail findings, planned-vs-authoritative-row proof,
privacy proof, training-capable-vs-validation-only separation proof,
no-pretrained/no-generated-label proof, claim-surface proof, forbidden-action
proof, blockers if any, and exactly one next action.

4. Verify:

```sh
python3 -m json.tool docs/model/return-to-form-detector0-first-party-negative-capture-packet-plan-review-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3im-detector0-first-party-negative-capture-packet-review-no-brev-v1.json >/dev/null
git diff --check
```

5. Write:

`docs/session-logs/800-mission-3im-detector0-first-party-negative-capture-packet-review-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3in_detector0_training_readiness_gap_contract_no_brev`
- `continue_m3in_detector0_metric_harness_extension_contract_no_brev`
- `continue_m3in_detector0_first_party_capture_authorization_request_no_brev`
- `escalate_detector0_first_party_negative_capture_review_with_local_evidence`
- `stop_for_human_first_party_negative_capture_approval`

Do not select direct capture, raw learner video upload, Brev fitting, Detector
0 training, real evaluation, export, promotion, browser activation,
final-gate change, or claim expansion from M3IM.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-training only.
- No raw learner video capture or upload.
- No source/media import, source authority addition, authoritative manifest row
  creation, label authoring, generated labels, pseudo-labels, pretrained
  detector, landmark, feature, backbone, or label outputs.
- No mutation of the M3IL packet plan, M3IK contract, M3II metric contract,
  M3IH manifest, M3ID packet, M3IJ harness, source register, source manifests,
  tensors, vocabulary, model cards, runtime code, final gates, claim surfaces,
  or side-worktree files.
- No training, real evaluation run, trained-detector invocation, export, ONNX,
  promotion, browser recognition activation, push, amend, or no-verify.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and does not park on an older completed
   Detector 0 slice.
2. M3IL packet-plan evidence and receipt parse and are referenced.
3. A first-party negative capture packet-plan review exists or an exact
   blocker is recorded.
4. The review explicitly classifies planned slots, null future fields,
   category/split counts, source/consent dependencies, privacy, no-pretrained
   rules, and validation-only separation.
5. The review records whether the packet plan is internally acceptable as a
   future-only plan and what blockers remain before any capture.
6. Claim surfaces remain fail-closed.
7. No raw learner video capture/upload, Brev lifecycle, remote, training, real
   evaluation run, trained-detector invocation, source/media import, source
   authority addition, label authoring, export, promotion, browser activation,
   final-gate, or claim-expansion work occurs.
8. The receipt and numbered session log exist and select exactly one allowed
   next action.
9. The change is committed with a message beginning `mission-3im:`.

## Observer Guidance

- CONTINUE if the executor writes a scoped review or exact blocker, checks the
  planned/non-authoritative packet properties, preserves privacy and
  no-pretrained boundaries, separates first-party future training-capable
  negatives from validation-only negatives, keeps claims fail-closed, records
  exact proofs, and selects one allowed next action.
- NUDGE if it misses slot/count validation, null-field proof, consent/privacy
  proof, no-pretrained proof, separation from M3IH, changed-file accounting,
  forbidden-action proof, or exactly one next action.
- REDIRECT if it captures or imports media, creates authoritative rows, authors
  labels, mutates packet or manifest rows, starts Brev/remote/training, runs
  real detector evaluation, uses pretrained or generated labels, or expands
  claims.
- STOP if first-party negative capture packet review cannot continue without a
  human approval decision.
