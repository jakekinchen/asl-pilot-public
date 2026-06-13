# Return-To-Form M3IO Detector0 Training Packet Gap Closure Plan No Brev Goal Loop Prompt

Mission 3IO prompt after M3IN recorded the Detector 0 training-readiness gap
contract and selected
`continue_m3io_detector0_training_packet_gap_closure_plan_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-training
Detector 0 training-packet gap closure plan slice.

The goal is to turn the M3IN readiness contract into a concrete closure plan
for the missing training-packet prerequisites before training can be considered:
first-party negative authority, consent/capture authorization, authoritative
row materialization prerequisites, metric/harness integration dependencies,
fixed-baseline beat-it evidence, and fail-closed claim boundaries. This is a
planning/contract slice only. It must not capture raw learner video, import
media, create authoritative rows, author labels, generate tensors, mutate the
harness, train, evaluate, start Brev, export, promote, activate browser
recognition, change final gates, or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3IN training-readiness gap evidence:
   - [`docs/model/return-to-form-detector0-training-readiness-gap-contract-v1.json`](return-to-form-detector0-training-readiness-gap-contract-v1.json)
   - [`docs/validation/return-to-form-m3in-detector0-training-readiness-gap-contract-no-brev-v1.json`](../validation/return-to-form-m3in-detector0-training-readiness-gap-contract-no-brev-v1.json)
   - [`docs/session-logs/802-mission-3in-detector0-training-readiness-gap-contract-no-brev.md`](../session-logs/802-mission-3in-detector0-training-readiness-gap-contract-no-brev.md)
5. First-party negative planning and review evidence:
   - [`docs/model/return-to-form-detector0-first-party-negative-capture-packet-plan-review-v1.json`](return-to-form-detector0-first-party-negative-capture-packet-plan-review-v1.json)
   - [`docs/model/return-to-form-detector0-first-party-negative-capture-packet-plan-v1.json`](return-to-form-detector0-first-party-negative-capture-packet-plan-v1.json)
   - [`docs/model/return-to-form-detector0-first-party-negative-capture-contract-v1.json`](return-to-form-detector0-first-party-negative-capture-contract-v1.json)
6. Metric and harness evidence:
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
- M3ID has 49 positive combined-packet rows.
- M3IH has 25 validation-only negative rows, including 20 strict no-hand rows;
  all remain `allowed_for_training: false`.
- M3IL/M3IM have 20 future first-party negative planned slots, all
  `planned_not_captured`, with zero authoritative rows, raw clips, labels, or
  tensors.
- M3IN records that training, real evaluation, Brev training, export,
  promotion, browser activation, final-gate change, and claim expansion are
  all blocked.
- Brev is not needed for this closure-plan slice.

## Required Slice

Complete one local/no-remote/no-Brev/no-training Detector 0 training-packet gap
closure plan slice.

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
python3 -m json.tool docs/model/return-to-form-detector0-training-readiness-gap-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3in-detector0-training-readiness-gap-contract-no-brev-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-first-party-negative-capture-packet-plan-review-v1.json >/dev/null
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

2. Write one scoped gap closure plan:

`docs/model/return-to-form-detector0-training-packet-gap-closure-plan-v1.json`

The plan must define:

- artifact identities and hashes for M3IN, M3IM, M3IL, M3IK, M3II/M3IJ,
  M3ID, M3IH, fixed-baseline gate, source/privacy, and claim-surface evidence;
- a blocker-to-next-artifact mapping for first-party negative approval,
  consent/capture readiness, row materialization prerequisites,
  metric/harness readiness, fixed-baseline beat-it evidence, and claim-surface
  fail-closed boundaries;
- the exact evidence required before any future row can become
  authoritative: explicit human capture approval, consent records, local raw
  clip hashes, human/project-reviewed absence labels, no-pretrained and
  no-generated-label attestations, split proof, withdrawal handling, and
  authoritative review receipt;
- the merge sequence for any future training packet and the conditions that
  keep M3IH validation-only negatives separate from training-capable negatives;
- metric/evaluation readiness dependencies before any real Detector 0
  evaluation: prediction artifact schema compatibility, first-party negative
  coverage, strict no-hand scoring, validation-only separation, and
  fixed-baseline comparison reporting;
- the fixed-baseline beat-it evidence route and stop conditions before export,
  promotion, browser activation, final-gate changes, or claim expansion;
- allowed next local paths and their dependencies, without authorizing
  capture, row materialization, training, evaluation, or Brev spend.

The plan may recommend the next planning/contract slice. It must not repair or
mutate M3IN/M3IM/M3IL/M3IK/M3II/M3IJ artifacts, create rows, capture media,
author labels, generate tensors, extend the harness, or authorize training.

3. Write the tracked receipt:

`docs/validation/return-to-form-m3io-detector0-training-packet-gap-closure-plan-no-brev-v1.json`

The receipt must include command statuses, Brev read-only inventory, changed
files, plan summary, blocker mapping summary, future-authority evidence
requirements, validation-only separation proof, metric/harness dependency
proof, fixed-baseline gate proof, claim-surface proof, forbidden-action proof,
and exactly one next action.

4. Verify:

```sh
python3 -m json.tool docs/model/return-to-form-detector0-training-packet-gap-closure-plan-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3io-detector0-training-packet-gap-closure-plan-no-brev-v1.json >/dev/null
git diff --check
```

5. Write:

`docs/session-logs/804-mission-3io-detector0-training-packet-gap-closure-plan-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `continue_m3ip_detector0_metric_harness_extension_contract_no_brev`
- `continue_m3ip_detector0_first_party_capture_authorization_request_no_brev`
- `continue_m3ip_detector0_training_packet_materialization_contract_no_brev`
- `escalate_detector0_training_packet_gap_closure_plan_with_local_evidence`
- `stop_for_human_first_party_negative_capture_approval`

Do not select direct capture, raw learner video upload, Brev fitting, Detector
0 training, real evaluation, export, promotion, browser activation,
final-gate change, or claim expansion from M3IO.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-training only.
- No raw learner video capture or upload.
- No source/media import, source authority addition, authoritative manifest row
  creation, label authoring, generated labels, pseudo-labels, pretrained
  detector, landmark, feature, backbone, or label outputs.
- No mutation of M3IN/M3IM/M3IL/M3IK/M3II/M3IJ artifacts, M3ID packet, M3IH
  manifest, source register, source manifests, tensors, vocabulary, model
  cards, runtime code, final gates, claim surfaces, or side-worktree files.
- No harness implementation changes, training, real evaluation run,
  trained-detector invocation, export, ONNX, promotion, browser recognition
  activation, push, amend, or no-verify.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and does not park on an older completed
   Detector 0 slice.
2. M3IN contract and receipt parse and are referenced.
3. A Detector 0 training-packet gap closure plan exists or an exact blocker is
   recorded.
4. The plan maps every M3IN blocker to the next required local artifact,
   evidence requirement, dependency, and forbidden shortcut.
5. The plan preserves validation-only vs training-capable negative separation
   and records what must happen before any future row materialization,
   training packet merge, metric/harness update, real evaluation, Brev spend,
   export, promotion, browser activation, final-gate change, or claim
   expansion.
6. Claim surfaces remain fail-closed.
7. No raw learner video capture/upload, Brev lifecycle, remote, training, real
   evaluation run, trained-detector invocation, source/media import, source
   authority addition, row materialization, label authoring, tensor generation,
   export, promotion, browser activation, final-gate, or claim-expansion work
   occurs.
8. The receipt and numbered session log exist and select exactly one allowed
   next action.
9. The change is committed with a message beginning `mission-3io:`.

## Observer Guidance

- CONTINUE if the executor writes a scoped closure plan or exact blocker,
  preserves all no-capture/no-training/no-Brev boundaries, maps current
  blockers to concrete next artifacts, keeps first-party future negatives
  separate from validation-only negatives, keeps claims fail-closed, records
  exact proofs, and selects one allowed next action.
- NUDGE if it misses artifact hashes, blocker mapping, future-authority
  evidence requirements, validation-only separation, metric/harness dependency
  proof, fixed-baseline gate proof, changed-file accounting,
  forbidden-action proof, or exactly one next action.
- REDIRECT if it captures or imports media, creates authoritative rows,
  authors labels, generates tensors, mutates packet or manifest rows, starts
  Brev/remote/training, runs real detector evaluation, extends the harness,
  uses pretrained or generated labels, or expands claims.
- STOP if the next meaningful Detector 0 readiness step requires human
  first-party capture approval before any local contract/planning work can
  proceed.
