# Return-To-Form M3IU Detector 0 Landmark Training Packet Readiness Plan Goal Loop Prompt

Mission 3IU prompt for the Codex executor after M3IT created the static
recognizer landmark-sequence plan and selected
`continue_m3iu_detector0_landmark_training_packet_readiness_plan`.

Read [`GOAL.md`](../../GOAL.md) first, then this prompt.

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-labeling/
no-training/no-promotion planning slice for a future Detector 0 region +
hand-landmark training packet.

The goal is to turn the M3IQ offline-label policy, M3IR region+landmark target
contract, M3IS fail-closed Detector 0 card provenance, and M3IT recognizer
sequence plan into a concrete readiness plan for the packet evidence that must
exist before any future Detector 0 region+hand-landmark training, evaluation,
export, promotion, browser activation, or recognizer work can be considered.
This is a static planning mission only.

## Source Of Truth

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3IT recognizer planning evidence:
   - [`docs/model/return-to-form-recognizer-landmark-sequence-plan-v1.json`](return-to-form-recognizer-landmark-sequence-plan-v1.json)
   - [`docs/validation/return-to-form-m3it-recognizer-landmark-sequence-plan-v1.json`](../validation/return-to-form-m3it-recognizer-landmark-sequence-plan-v1.json)
   - [`docs/session-logs/815-mission-3it-recognizer-landmark-sequence-plan.md`](../session-logs/815-mission-3it-recognizer-landmark-sequence-plan.md)
4. M3IS card-policy evidence:
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`docs/validation/return-to-form-m3is-detector0-landmark-contract-card-followup-v1.json`](../validation/return-to-form-m3is-detector0-landmark-contract-card-followup-v1.json)
   - [`docs/session-logs/813-mission-3is-detector0-card-contract-policy-followup.md`](../session-logs/813-mission-3is-detector0-card-contract-policy-followup.md)
5. M3IR target-contract evidence:
   - [`docs/model/return-to-form-detector0-region-hand-landmark-target-contract-v1.json`](return-to-form-detector0-region-hand-landmark-target-contract-v1.json)
   - [`docs/validation/return-to-form-m3ir-detector0-landmark-contract-or-card-integration-v1.json`](../validation/return-to-form-m3ir-detector0-landmark-contract-or-card-integration-v1.json)
   - [`docs/session-logs/811-mission-3ir-detector0-region-hand-landmark-target-contract.md`](../session-logs/811-mission-3ir-detector0-region-hand-landmark-target-contract.md)
6. M3IQ policy decision evidence:
   - [`DECISIONS.md`](../../DECISIONS.md)
   - [`docs/validation/return-to-form-m3iq-detector0-landmark-integration-v1.json`](../validation/return-to-form-m3iq-detector0-landmark-integration-v1.json)
   - [`docs/session-logs/809-mission-3iq-detector0-offline-label-policy-decision-record.md`](../session-logs/809-mission-3iq-detector0-offline-label-policy-decision-record.md)
7. Advisory observer strategy memos:
   - [`artifacts/research/observer-508-m3ef-model-input-strategy/response.md`](../../artifacts/research/observer-508-m3ef-model-input-strategy/response.md)
   - [`artifacts/research/observer-597-m3fs-detector0-strict-gate-strategy/response.md`](../../artifacts/research/observer-597-m3fs-detector0-strict-gate-strategy/response.md)
8. Claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Required Boundaries

- Do not implement training-packet builders, tensor builders, model code,
  recognizer runtime code, TypeScript interfaces, exports, or browser bundles.
- Do not run MediaPipe, labeling, fitting, training, evaluation, ablation, or
  side-worktree pipelines.
- Do not mutate side-worktree files.
- Do not create or import source/media authority.
- Do not author authoritative labels, generated labels, tensors, checkpoints,
  ONNX, browser bundles, promoted artifacts, or active vocabulary claims.
- Do not start, stop, reset, sync, exec, or copy from Brev; read-only
  `brev ls --json` is allowed only to prove no unexpected paid worker is
  running.
- Keep runtime/deps/browser bans in force. Offline label provenance remains
  training/evaluation supervision only, and offline labelers are never runtime
  dependencies.
- Keep all claim surfaces fail-closed. This mission must not grant Detector 0,
  recognizer, browser recognition, ASL correctness, or model-readiness
  authority.

## Required Outputs

- One scoped readiness-plan artifact:
  `docs/model/return-to-form-detector0-landmark-training-packet-readiness-plan-v1.json`.
- A validation receipt:
  `docs/validation/return-to-form-m3iu-detector0-landmark-training-packet-readiness-plan-v1.json`.
- A numbered session log.

## Required Plan Content

The readiness plan must define:

- exact artifact identities and hashes for M3IQ, M3IR, M3IS, M3IT, claim
  surfaces, and the advisory observer strategy memos;
- a packet-readiness matrix for source rights, derived-label authority, raw
  clip/frame references, labeler method/version/config sidecars, coordinate
  contract compatibility, split/leakage proof, checksum coverage,
  human-review/manual-review sample requirements, negative/no-hand accounting,
  and claim-surface status;
- what evidence is still missing before any Detector 0 region+landmark
  training packet can be called training-ready;
- what must stay separate between offline supervision provenance and browser
  runtime dependencies;
- validation prerequisites before any future training, real evaluation, Brev
  spend, export, promotion, browser activation, final-gate change, recognizer
  work, or claim expansion;
- allowed next local paths and their dependencies, without authorizing source
  import, labeling, packet materialization, training, evaluation, or Brev
  lifecycle.

## Allowed Checks

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/model/return-to-form-recognizer-landmark-sequence-plan-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3it-recognizer-landmark-sequence-plan-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-region-hand-landmark-target-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3is-detector0-landmark-contract-card-followup-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-landmark-training-packet-readiness-plan-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3iu-detector0-landmark-training-packet-readiness-plan-v1.json >/dev/null
jq '{status, promotion_state, browser_artifact}' web/public/model/detector0-card.json
jq '{activeLabels}' docs/model/active-vocabulary-claim.json
brev ls --json
git diff --check
```

## Allowed Next Actions

Select exactly one:

- `continue_m3iv_detector0_landmark_training_packet_authority_gap_review`
- `continue_m3iv_detector0_landmark_training_packet_materialization_contract_no_brev`
- `continue_m3iv_recognizer_sequence_tensor_contract_no_brev`
- `escalate_detector0_landmark_packet_strategy_with_local_evidence`
- `stop_for_human_source_or_label_authority_review`

Do not select direct source import, raw learner video upload, MediaPipe
labeling, packet materialization, Brev fitting, Detector 0 training, recognizer
training, real evaluation, export, promotion, browser activation, final-gate
change, or claim expansion from M3IU.

## Acceptance Criteria

1. `GOAL.md` points at this prompt and names Mission 3IU.
2. M3IT, M3IS, M3IR, and M3IQ evidence parse where applicable and are
   referenced by exact path.
3. The readiness plan exists, is scoped, and records the packet-readiness
   matrix, missing evidence, runtime/deps boundary, validation prerequisites,
   and claim boundaries without implementing runtime or training code.
4. No MediaPipe/labeling/training/evaluation/export/promotion/browser
   activation occurs in the loop lane, and Brev is read-only inventory at most.
5. Claim surfaces remain fail-closed and active recognition labels remain
   empty.
6. The receipt and numbered session log exist, parse where applicable, and
   select exactly one allowed next action.
7. The change is committed with a message beginning `mission-3iu:`.
