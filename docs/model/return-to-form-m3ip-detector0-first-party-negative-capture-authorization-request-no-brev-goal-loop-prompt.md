# Return-To-Form M3IP Detector0 First-Party Negative Capture Authorization Request No Brev Goal Loop Prompt

Mission 3IP prompt after M3IO wrote the Detector 0 training-packet gap closure
plan and selected
`continue_m3ip_detector0_first_party_capture_authorization_request_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-capture/
no-training Detector 0 first-party negative capture authorization-request
slice.

The goal is to prepare a clear, bounded human approval request for the
already-planned first-party no-hand negative capture packet. This mission must
not treat the request as approval. It must not capture raw learner video,
import media, create authoritative rows, author labels, generate tensors,
mutate the harness, train, evaluate, start Brev, export, promote, activate
browser recognition, change final gates, or expand claims.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. [`docs/model/return-to-form-plan.md`](return-to-form-plan.md).
4. M3IO gap closure plan evidence:
   - [`docs/model/return-to-form-detector0-training-packet-gap-closure-plan-v1.json`](return-to-form-detector0-training-packet-gap-closure-plan-v1.json)
   - [`docs/validation/return-to-form-m3io-detector0-training-packet-gap-closure-plan-no-brev-v1.json`](../validation/return-to-form-m3io-detector0-training-packet-gap-closure-plan-no-brev-v1.json)
   - [`docs/session-logs/804-mission-3io-detector0-training-packet-gap-closure-plan-no-brev.md`](../session-logs/804-mission-3io-detector0-training-packet-gap-closure-plan-no-brev.md)
5. M3IN readiness contract evidence:
   - [`docs/model/return-to-form-detector0-training-readiness-gap-contract-v1.json`](return-to-form-detector0-training-readiness-gap-contract-v1.json)
   - [`docs/validation/return-to-form-m3in-detector0-training-readiness-gap-contract-no-brev-v1.json`](../validation/return-to-form-m3in-detector0-training-readiness-gap-contract-no-brev-v1.json)
6. First-party negative planning and review evidence:
   - [`docs/model/return-to-form-detector0-first-party-negative-capture-packet-plan-review-v1.json`](return-to-form-detector0-first-party-negative-capture-packet-plan-review-v1.json)
   - [`docs/model/return-to-form-detector0-first-party-negative-capture-packet-plan-v1.json`](return-to-form-detector0-first-party-negative-capture-packet-plan-v1.json)
   - [`docs/model/return-to-form-detector0-first-party-negative-capture-contract-v1.json`](return-to-form-detector0-first-party-negative-capture-contract-v1.json)
7. Source, consent, privacy, and claim surfaces:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/privacy/dataset-consent-form.md`](../privacy/dataset-consent-form.md)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Current Detector 0 State

- Detector 0 is not trained, accurate, exported, promoted, or spec-fit today.
- The M3IL/M3IM first-party negative packet remains a future plan only:
  20 planned slots, all `planned_not_captured`, with zero authoritative rows,
  raw clips, labels, or tensors.
- M3IO recorded the next required local artifact as
  `docs/model/return-to-form-detector0-first-party-negative-capture-authorization-request-v1.json`.
- Explicit human capture approval is absent.
- Existing M3IH negatives remain validation-only and cannot become training
  negatives.
- Brev is not needed for this authorization-request slice.

## Required Slice

Complete one local/no-remote/no-Brev/no-capture/no-training authorization
request slice.

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
python3 -m json.tool docs/model/return-to-form-detector0-training-packet-gap-closure-plan-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3io-detector0-training-packet-gap-closure-plan-no-brev-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-training-readiness-gap-contract-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-first-party-negative-capture-packet-plan-review-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-first-party-negative-capture-packet-plan-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-first-party-negative-capture-contract-v1.json >/dev/null
brev ls --json
git diff --check
```

Read-only `brev ls --json` is allowed only to prove no unexpected paid worker
is running. Do not start, stop, sync, exec, or copy from Brev in this mission.

2. Write one scoped authorization request artifact:

`docs/model/return-to-form-detector0-first-party-negative-capture-authorization-request-v1.json`

The request must define:

- artifact identities and hashes for M3IO, M3IN, M3IM, M3IL, M3IK, consent,
  source/privacy, and claim-surface evidence;
- request status as `request_only_not_approved_no_capture_no_rows`;
- the exact approval question for the human, with a yes/no approval boundary;
- the bounded capture envelope: 20 future first-party no-hand negative slots,
  5 each for `empty_camera_no_person_no_hands`,
  `normal_environment_no_hands_visible`, `low_light_no_hands_visible`, and
  `off_center_no_hands_visible`, split 12 train / 4 validation / 4 test;
- local-only storage and no raw learner practice-video reuse rules;
- consent requirements, signed consent evidence, withdrawal handling, raw clip
  path/hash requirements, and signer-disjoint split requirements;
- human/project-reviewed absence-label requirements and no-pretrained /
  no-generated-label attestations;
- explicit proof that existing M3IH validation-only negatives remain excluded
  from training and are not reclassified;
- explicit proof that claim surfaces remain fail-closed;
- forbidden actions and next allowed outcomes.

This artifact may prepare the approval request; it must not record approval,
begin capture, create rows, author labels, generate tensors, or authorize
training.

3. Write the tracked receipt:

`docs/validation/return-to-form-m3ip-detector0-first-party-negative-capture-authorization-request-no-brev-v1.json`

The receipt must include command statuses, Brev read-only inventory, changed
files, request summary, approval-not-granted proof, capture-envelope proof,
consent/privacy proof, validation-only separation proof, claim-surface proof,
forbidden-action proof, and exactly one next action.

4. Verify:

```sh
python3 -m json.tool docs/model/return-to-form-detector0-first-party-negative-capture-authorization-request-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ip-detector0-first-party-negative-capture-authorization-request-no-brev-v1.json >/dev/null
git diff --check
```

5. Write:

`docs/session-logs/806-mission-3ip-detector0-first-party-negative-capture-authorization-request-no-brev.md`

## Allowed Next Actions

Select exactly one:

- `stop_for_human_first_party_negative_capture_approval`
- `continue_m3iq_detector0_capture_approval_response_record_no_brev`
- `escalate_detector0_first_party_capture_authorization_request_with_local_evidence`

Do not select direct capture, raw learner video upload, row materialization,
label authoring, tensor generation, Brev fitting, Detector 0 training, real
evaluation, export, promotion, browser activation, final-gate change, or claim
expansion from M3IP. Select
`continue_m3iq_detector0_capture_approval_response_record_no_brev` only if
the current thread contains explicit human approval for the exact bounded
capture envelope. Otherwise select
`stop_for_human_first_party_negative_capture_approval`.

## Boundaries

- Local/no-remote/no-Brev/no-paid-compute/no-capture/no-training only.
- No raw learner video capture or upload.
- No source/media import, source authority addition, authoritative manifest row
  creation, label authoring, generated labels, pseudo-labels, pretrained
  detector, landmark, feature, backbone, or label outputs.
- No mutation of M3IO/M3IN/M3IM/M3IL/M3IK artifacts, M3ID packet, M3IH
  manifest, source register, source manifests, tensors, vocabulary, model
  cards, runtime code, final gates, claim surfaces, or side-worktree files.
- No harness implementation changes, training, real evaluation run,
  trained-detector invocation, export, ONNX, promotion, browser recognition
  activation, push, amend, or no-verify.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and does not park on an older completed
   Detector 0 slice.
2. M3IO plan and receipt parse and are referenced.
3. A Detector 0 first-party negative capture authorization request artifact
   exists or an exact blocker is recorded.
4. The artifact clearly separates "request prepared" from "approval granted".
5. The artifact records the bounded capture envelope, consent/privacy
   requirements, local-only storage rules, no-pretrained/no-generated-label
   requirements, validation-only separation, and fail-closed claim surfaces.
6. No capture, row materialization, label authoring, tensor generation,
   training, real evaluation, Brev lifecycle, export, promotion, browser
   activation, final-gate change, or claim-expansion work occurs.
7. The receipt and numbered session log exist and select exactly one allowed
   next action.
8. The change is committed with a message beginning `mission-3ip:`.

## Observer Guidance

- CONTINUE only if the executor writes the scoped request, current thread
  contains explicit human approval for the exact bounded envelope, and the next
  action is a response-recording slice. Without explicit human approval, STOP
  is normally the correct next observer decision after M3IP completes.
- NUDGE if the request misses approval-boundary language, capture-envelope
  counts, consent/privacy requirements, no-pretrained/no-generated-label
  rules, validation-only separation, claim-surface proof, forbidden-action
  proof, or exactly one next action.
- REDIRECT if it captures media, creates rows, authors labels, generates
  tensors, mutates packet or manifest rows, starts Brev/remote/training, runs
  real detector evaluation, uses pretrained or generated labels, or expands
  claims.
- STOP if the request is complete and the next meaningful step requires human
  first-party negative capture approval.
