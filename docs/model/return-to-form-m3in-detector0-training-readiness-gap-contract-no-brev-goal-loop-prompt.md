# Return-To-Form M3IN Detector0 Training Readiness Gap Contract No Brev Goal Loop Prompt

Mission 3IN prompt after M3IM reviewed the Detector 0 first-party negative
capture packet plan and selected
`continue_m3in_detector0_training_readiness_gap_contract_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 training-readiness gap contract slice.

The goal is to reconcile current Detector 0 training blockers after M3IM:
positive packet authority exists, first-party negative slots are still
future-only, M3IH negatives are validation-only, M3II/M3IJ do not yet include
materialized first-party negatives in real evaluation, and the fixed-baseline
beat-it gate remains binding. This is a contract/gap slice only. It must not
capture raw learner video, import media, create authoritative rows, author
labels, generate tensors, train, evaluate, start Brev, export, promote,
activate browser recognition, change final gates, or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3IM packet-plan review evidence:
   - [`docs/model/return-to-form-detector0-first-party-negative-capture-packet-plan-review-v1.json`](return-to-form-detector0-first-party-negative-capture-packet-plan-review-v1.json)
   - [`docs/validation/return-to-form-m3im-detector0-first-party-negative-capture-packet-review-no-brev-v1.json`](../validation/return-to-form-m3im-detector0-first-party-negative-capture-packet-review-no-brev-v1.json)
   - [`docs/session-logs/800-mission-3im-detector0-first-party-negative-capture-packet-review-no-brev.md`](../session-logs/800-mission-3im-detector0-first-party-negative-capture-packet-review-no-brev.md)
5. M3IL/M3IK first-party negative planning and contract evidence:
   - [`docs/model/return-to-form-detector0-first-party-negative-capture-packet-plan-v1.json`](return-to-form-detector0-first-party-negative-capture-packet-plan-v1.json)
   - [`docs/model/return-to-form-detector0-first-party-negative-capture-contract-v1.json`](return-to-form-detector0-first-party-negative-capture-contract-v1.json)
6. M3II/M3IJ negative evaluation evidence:
   - [`docs/model/return-to-form-detector0-negative-evaluation-metric-contract-v1.json`](return-to-form-detector0-negative-evaluation-metric-contract-v1.json)
   - [`scripts/evaluate_detector0_negative_metrics.mjs`](../../scripts/evaluate_detector0_negative_metrics.mjs)
   - [`docs/validation/return-to-form-m3ij-detector0-negative-evaluation-harness-no-brev-v1.json`](../validation/return-to-form-m3ij-detector0-negative-evaluation-harness-no-brev-v1.json)
7. Detector 0 packet, hard-negative, and gate evidence:
   - [`data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json`](../../data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json)
   - [`data/annotations/detector0/return-to-form-detector0-hard-negative-validation-manifest-v1.json`](../../data/annotations/detector0/return-to-form-detector0-hard-negative-validation-manifest-v1.json)
   - [`docs/model/return-to-form-detector0-fixed-baseline-gate-contract-v1.json`](return-to-form-detector0-fixed-baseline-gate-contract-v1.json)
   - [`docs/validation/return-to-form-detector0-fullvshortcut-bakeoff-v1.json`](../validation/return-to-form-detector0-fullvshortcut-bakeoff-v1.json)
8. Source, privacy, and claim surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/privacy/dataset-consent-form.md`](../privacy/dataset-consent-form.md)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Current Detector 0 State

- Detector 0 is not trained, accurate, exported, promoted, or spec-fit today.
- M3ID has a 49-row positive combined packet.
- M3IH has 25 validation-only negative rows, including 20 strict no-hand rows,
  and none are training-capable.
- M3IL has 20 first-party negative planned slots, all
  `planned_not_captured`, with zero authoritative rows.
- M3IM accepted the M3IL plan only as future-only planning evidence and
  recorded capture approval and training readiness as still blocked.
- M3II/M3IJ define current negative metric/harness surfaces, but do not yet
  include materialized first-party negatives in real evaluation.
- Brev is not needed for this contract slice.

## Required Slice

Complete one local/no-remote/no-Brev/no-training Detector 0
training-readiness gap contract slice.

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
python3 -m json.tool docs/model/return-to-form-detector0-first-party-negative-capture-packet-plan-review-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3im-detector0-first-party-negative-capture-packet-review-no-brev-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-first-party-negative-capture-packet-plan-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-first-party-negative-capture-contract-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-negative-evaluation-metric-contract-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-detector0-hard-negative-validation-manifest-v1.json >/dev/null
brev ls --json
git diff --check
```

Read-only `brev ls --json` is allowed only to prove no unexpected paid worker
is running. Do not start, stop, sync, exec, or copy from Brev in this mission.

2. Write one scoped training-readiness gap contract:

`docs/model/return-to-form-detector0-training-readiness-gap-contract-v1.json`

The contract must define:

- artifact identities and hashes for M3IM, M3IL, M3IK, M3II/M3IJ, M3ID,
  M3IH, and fixed-baseline gate evidence;
- a current readiness matrix for positive rows, validation-only negatives,
  future first-party negative slots, metric/harness integration, fixed-baseline
  beat-it gates, claim surfaces, and Brev/compute status;
- the exact blockers before any training, real evaluation, Brev training,
  export, promotion, browser activation, final-gate change, or claim expansion;
- what counts as training-ready evidence for first-party negative rows:
  explicit human capture approval, consent records, local raw clip hashes,
  human/project-reviewed absence labels, no-pretrained attestations, split
  proof, withdrawal handling, and authoritative row review;
- what counts as metric/evaluation-ready evidence before real Detector 0
  evaluation: prediction artifact schema compatibility, row-source coverage,
  validation-only vs training-capable separation, strict no-hand scoring, and
  fixed-baseline comparison reporting;
- allowed next local paths and their dependencies, without authorizing capture,
  training, or Brev spend.

The contract may recommend the next planning/contract slice. It must not
repair or mutate M3IM/M3IL/M3IK/M3II/M3IJ artifacts, create rows, capture
media, extend the harness, or authorize training.

3. Write the tracked receipt:

`docs/validation/return-to-form-m3in-detector0-training-readiness-gap-contract-no-brev-v1.json`

The receipt must include command statuses, Brev read-only inventory, changed
files, contract summary, readiness matrix summary, blocker proof,
first-party-negative-row proof, validation-only separation proof,
metric/harness integration proof, fixed-baseline gate proof, claim-surface
proof, forbidden-action proof, and exactly one next action.

4. Verify:

```sh
python3 -m json.tool docs/model/return-to-form-detector0-training-readiness-gap-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3in-detector0-training-readiness-gap-contract-no-brev-v1.json >/dev/null
git diff --check
```

5. Write:

`docs/session-logs/802-mission-3in-detector0-training-readiness-gap-contract-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3io_detector0_metric_harness_extension_contract_no_brev`
- `continue_m3io_detector0_training_packet_gap_closure_plan_no_brev`
- `continue_m3io_detector0_first_party_capture_authorization_request_no_brev`
- `escalate_detector0_training_readiness_gap_contract_with_local_evidence`
- `stop_for_human_first_party_negative_capture_approval`

Do not select direct capture, raw learner video upload, Brev fitting, Detector
0 training, real evaluation, export, promotion, browser activation,
final-gate change, or claim expansion from M3IN.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-training only.
- No raw learner video capture or upload.
- No source/media import, source authority addition, authoritative manifest row
  creation, label authoring, generated labels, pseudo-labels, pretrained
  detector, landmark, feature, backbone, or label outputs.
- No mutation of M3IM/M3IL/M3IK/M3II/M3IJ artifacts, M3ID packet, M3IH
  manifest, source register, source manifests, tensors, vocabulary, model
  cards, runtime code, final gates, claim surfaces, or side-worktree files.
- No harness implementation changes, training, real evaluation run,
  trained-detector invocation, export, ONNX, promotion, browser recognition
  activation, push, amend, or no-verify.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and does not park on an older completed
   Detector 0 slice.
2. M3IM review evidence and receipt parse and are referenced.
3. A Detector 0 training-readiness gap contract exists or an exact blocker is
   recorded.
4. The contract explicitly classifies positive-row readiness, validation-only
   negative status, first-party negative planned-vs-authoritative status,
   metric/harness gaps, fixed-baseline gate dependencies, and claim surfaces.
5. The contract records whether Detector 0 training is currently allowed and
   what blockers must clear before any training, real evaluation, Brev spend,
   export, promotion, browser activation, final-gate change, or claim
   expansion.
6. Claim surfaces remain fail-closed.
7. No raw learner video capture/upload, Brev lifecycle, remote, training, real
   evaluation run, trained-detector invocation, source/media import, source
   authority addition, label authoring, export, promotion, browser activation,
   final-gate, or claim-expansion work occurs.
8. The receipt and numbered session log exist and select exactly one allowed
   next action.
9. The change is committed with a message beginning `mission-3in:`.

## Observer Guidance

- CONTINUE if the executor writes a scoped contract or exact blocker,
  preserves all no-capture/no-training/no-Brev boundaries, records current
  training readiness honestly, keeps first-party future negatives separate from
  validation-only negatives, keeps claims fail-closed, records exact proofs,
  and selects one allowed next action.
- NUDGE if it misses row-family readiness, null authoritative-row proof,
  metric/harness gap proof, fixed-baseline gate proof, changed-file
  accounting, forbidden-action proof, or exactly one next action.
- REDIRECT if it captures or imports media, creates authoritative rows, authors
  labels, mutates packet or manifest rows, starts Brev/remote/training, runs
  real detector evaluation, extends the harness, uses pretrained or generated
  labels, or expands claims.
- STOP if the next meaningful Detector 0 readiness step requires human
  first-party capture approval before any local contract work can proceed.
