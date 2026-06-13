# Return-To-Form M3IK Detector0 First-Party Negative Capture Contract No Brev Goal Loop Prompt

Mission 3IK prompt after M3IJ wrote the Detector 0 negative-evaluation
harness and selected
`continue_m3ik_detector0_first_party_negative_capture_contract_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 first-party negative capture contract slice.

The goal is to define the smallest reviewable contract for future
first-party, consented, training-capable hard-negative/no-hand rows that can
eventually complement the M3IH validation-only hard-negative manifest. This
slice is a planning/contract slice only. It must not capture learner video,
import media, author labels, create training rows, train, evaluate, start Brev,
export, promote, activate browser recognition, change final gates, or expand
claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3IJ harness evidence:
   - [`scripts/evaluate_detector0_negative_metrics.mjs`](../../scripts/evaluate_detector0_negative_metrics.mjs)
   - [`docs/validation/return-to-form-m3ij-detector0-negative-evaluation-harness-no-brev-v1.json`](../validation/return-to-form-m3ij-detector0-negative-evaluation-harness-no-brev-v1.json)
   - [`docs/session-logs/794-mission-3ij-detector0-negative-evaluation-harness-no-brev.md`](../session-logs/794-mission-3ij-detector0-negative-evaluation-harness-no-brev.md)
5. M3II metric-contract evidence:
   - [`docs/model/return-to-form-detector0-negative-evaluation-metric-contract-v1.json`](return-to-form-detector0-negative-evaluation-metric-contract-v1.json)
   - [`docs/validation/return-to-form-m3ii-detector0-negative-evaluation-metric-contract-no-brev-v1.json`](../validation/return-to-form-m3ii-detector0-negative-evaluation-metric-contract-no-brev-v1.json)
6. M3IH validation-only negative manifest evidence:
   - [`data/annotations/detector0/return-to-form-detector0-hard-negative-validation-manifest-v1.json`](../../data/annotations/detector0/return-to-form-detector0-hard-negative-validation-manifest-v1.json)
   - [`docs/validation/return-to-form-m3ih-detector0-hard-negative-manifest-materialization-no-brev-v1.json`](../validation/return-to-form-m3ih-detector0-hard-negative-manifest-materialization-no-brev-v1.json)
7. Positive packet and gate evidence:
   - [`data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json`](../../data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json)
   - [`docs/model/return-to-form-detector0-fixed-baseline-gate-contract-v1.json`](return-to-form-detector0-fixed-baseline-gate-contract-v1.json)
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
8. Claim surfaces:
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Current Detector 0 State

- Detector 0 is not trained, accurate, exported, promoted, or spec-fit today.
- M3IJ added a local harness that can validate and score future prediction
  artifacts, but only synthetic harness smoke has run.
- M3IH hard negatives are validation-only and are not training-capable.
- First-party training-capable hard-negative/no-hand rows are still absent.
- Brev is not needed for this contract slice.

## Required Slice

Complete one local/no-remote/no-Brev/no-training first-party negative capture
contract slice.

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
python3 -m json.tool docs/validation/return-to-form-m3ij-detector0-negative-evaluation-harness-no-brev-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-negative-evaluation-metric-contract-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-detector0-hard-negative-validation-manifest-v1.json >/dev/null
python3 -m json.tool data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json >/dev/null
brev ls --json
git diff --check
```

Read-only `brev ls --json` is allowed only to prove no unexpected paid worker
is running. Do not start, stop, sync, exec, or copy from Brev in this mission.

2. Write one scoped first-party negative capture contract:

`docs/model/return-to-form-detector0-first-party-negative-capture-contract-v1.json`

The contract must define:

- consent/provenance requirements for first-party negative capture;
- allowed capture categories for training-capable hard negatives, at minimum
  no-hand/empty-camera, low-light no-hand, off-center no-hand, and normal
  environment no-hand coverage;
- explicit separation between training-capable first-party negatives and the
  existing M3IH external validation-only negatives;
- required absence labels and target-applicability fields for no-hand rows;
- split policy and minimum per-split row accounting needed before those rows
  can be merged into a future Detector 0 training/evaluation packet;
- privacy boundaries: no raw learner video upload during normal practice and
  no durable raw learner video capture without explicit future approval;
- no-pretrained/no-generated-label attestation requirements;
- review requirements before any negative row becomes authoritative;
- integration points for the M3II metric contract and M3IJ harness;
- blockers that remain before any training, evaluation, export, promotion, or
  browser activation.

The contract may describe a future capture workflow, but it must not create raw
media, source manifests, label rows, packet rows, tensors, model artifacts, or
claim-surface changes.

3. Write the tracked receipt:

`docs/validation/return-to-form-m3ik-detector0-first-party-negative-capture-contract-no-brev-v1.json`

The receipt must include command statuses, Brev read-only inventory, changed
files, contract summary, training-capable-vs-validation-only separation proof,
privacy proof, no-pretrained/no-generated-label proof, claim-surface proof,
forbidden-action proof, blockers if any, and exactly one next action.

4. Verify:

```sh
python3 -m json.tool docs/model/return-to-form-detector0-first-party-negative-capture-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ik-detector0-first-party-negative-capture-contract-no-brev-v1.json >/dev/null
git diff --check
```

5. Write:

`docs/session-logs/796-mission-3ik-detector0-first-party-negative-capture-contract-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3il_detector0_first_party_negative_capture_packet_plan_no_brev`
- `continue_m3il_detector0_training_readiness_gap_contract_no_brev`
- `continue_m3il_detector0_local_training_smoke_compute_receipt_no_brev`
- `escalate_detector0_first_party_negative_capture_strategy_with_local_evidence`
- `stop_for_human_first_party_negative_capture_review`

Do not select direct Brev fitting, Detector 0 training, export, promotion,
browser activation, final-gate change, raw learner video upload, or claim
expansion from M3IK.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-training only.
- No raw learner video capture or upload.
- No source/media import, source authority addition, manifest row creation,
  label authoring, generated labels, pseudo-labels, pretrained detector,
  landmark, feature, backbone, or label outputs.
- No mutation of the M3II metric contract, M3IH manifest, M3ID packet, M3IJ
  harness, source register, source manifests, tensors, vocabulary, model
  cards, runtime code, final gates, claim surfaces, or side-worktree files.
- No training, real evaluation run, trained-detector invocation, export, ONNX,
  promotion, browser recognition activation, push, amend, or no-verify.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and does not park on an older completed
   Detector 0 slice.
2. M3IJ harness evidence and receipt parse and are referenced.
3. A first-party negative capture contract exists or an exact blocker is
   recorded.
4. The contract separates future training-capable first-party negative rows
   from existing validation-only hard negatives.
5. The contract defines consent/provenance, privacy, absence-label,
   no-pretrained/no-generated-label, split, and review requirements before any
   row can become authoritative.
6. Claim surfaces remain fail-closed.
7. No raw learner video capture/upload, Brev lifecycle, remote, training, real
   evaluation run, trained-detector invocation, source/media import, source
   authority addition, label authoring, export, promotion, browser activation,
   final-gate, or claim-expansion work occurs.
8. The receipt and numbered session log exist and select exactly one allowed
   next action.
9. The change is committed with a message beginning `mission-3ik:`.

## Observer Guidance

- CONTINUE if the executor writes a scoped contract or exact blocker, clearly
  separates first-party training-capable negatives from validation-only
  negatives, preserves privacy and no-pretrained boundaries, keeps claims
  fail-closed, records exact proofs, and selects one allowed next action.
- NUDGE if it misses consent/provenance, privacy, row-family separation,
  absence-label requirements, changed-file accounting, forbidden-action proof,
  or exactly one next action.
- REDIRECT if it captures or imports media, authors labels, mutates packet or
  manifest rows, starts Brev/remote/training, runs real detector evaluation,
  uses pretrained or generated labels, or expands claims.
- STOP if first-party negative capture requirements cannot be specified without
  a human project decision.
