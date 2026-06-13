# Return-To-Form M3IT Recognizer Landmark Sequence Plan Goal Loop Prompt

Mission 3IT prompt for the Codex executor after M3IS updated the fail-closed
Detector 0 card with M3IR target-contract and M3IQ offline-label policy
provenance, then selected `continue_m3it_recognizer_landmark_sequence_plan`.

Read [`GOAL.md`](../../GOAL.md) first, then this prompt.

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-labeling/
no-training/no-promotion planning slice for a future scratch-trained recognizer
that consumes the M3IR region + hand-landmark target sequence. This is a static
contract/planning mission only, not recognizer implementation.

Choose one smallest useful slice:

1. Create a static recognizer landmark-sequence plan that defines the future
   input sequence shape, coordinate/masking rules, temporal window assumptions,
   provenance requirements, validation prerequisites, and fail-closed claim
   boundaries for using M3IR Detector 0 outputs.
2. If an equivalent plan already exists, create a narrow review receipt that
   cites the existing plan fields and records any exact gaps as future work.

## Source Of Truth

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3IS card-policy evidence:
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`docs/validation/return-to-form-m3is-detector0-landmark-contract-card-followup-v1.json`](../validation/return-to-form-m3is-detector0-landmark-contract-card-followup-v1.json)
   - [`docs/session-logs/813-mission-3is-detector0-card-contract-policy-followup.md`](../session-logs/813-mission-3is-detector0-card-contract-policy-followup.md)
4. M3IR target-contract evidence:
   - [`docs/model/return-to-form-detector0-region-hand-landmark-target-contract-v1.json`](return-to-form-detector0-region-hand-landmark-target-contract-v1.json)
   - [`docs/validation/return-to-form-m3ir-detector0-landmark-contract-or-card-integration-v1.json`](../validation/return-to-form-m3ir-detector0-landmark-contract-or-card-integration-v1.json)
   - [`docs/session-logs/811-mission-3ir-detector0-region-hand-landmark-target-contract.md`](../session-logs/811-mission-3ir-detector0-region-hand-landmark-target-contract.md)
5. M3IQ policy decision evidence:
   - [`DECISIONS.md`](../../DECISIONS.md)
   - [`docs/validation/return-to-form-m3iq-detector0-landmark-integration-v1.json`](../validation/return-to-form-m3iq-detector0-landmark-integration-v1.json)
   - [`docs/session-logs/809-mission-3iq-detector0-offline-label-policy-decision-record.md`](../session-logs/809-mission-3iq-detector0-offline-label-policy-decision-record.md)
6. Prior observer strategy memos, advisory only:
   - [`artifacts/research/observer-508-m3ef-model-input-strategy/response.md`](../../artifacts/research/observer-508-m3ef-model-input-strategy/response.md)
   - [`artifacts/research/observer-597-m3fs-detector0-strict-gate-strategy/response.md`](../../artifacts/research/observer-597-m3fs-detector0-strict-gate-strategy/response.md)
7. Claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Required Boundaries

- Do not implement recognizer runtime code, TypeScript interfaces, training
  scripts, tensor builders, model code, exports, browser bundles, or UI
  activation.
- Do not run training, fitting, evaluation, ablation, labeling, MediaPipe, or
  side-worktree pipelines.
- Do not mutate side-worktree files.
- Do not create or import source/media authority.
- Do not generate labels, tensors, model checkpoints, ONNX, browser bundles, or
  promoted artifacts.
- Do not start, stop, sync, exec, or copy from Brev; read-only
  `brev ls --json` is allowed only to prove no unexpected paid worker is
  running.
- Keep runtime/deps/browser bans in force. Offline label provenance remains
  training/evaluation supervision only, and offline labelers are never runtime
  dependencies.
- Keep all claim surfaces fail-closed. This mission must not grant recognizer,
  Detector 0, browser recognition, ASL correctness, or model-readiness
  authority.

## Required Outputs

- One scoped recognizer landmark-sequence plan or plan-review artifact:
  `docs/model/return-to-form-recognizer-landmark-sequence-plan-v1.json`.
- A validation receipt:
  `docs/validation/return-to-form-m3it-recognizer-landmark-sequence-plan-v1.json`.
- A numbered session log.

## Allowed Checks

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/model/return-to-form-recognizer-landmark-sequence-plan-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3it-recognizer-landmark-sequence-plan-v1.json >/dev/null
jq '{status, promotion_state, browser_artifact}' web/public/model/detector0-card.json
jq '{activeLabels}' docs/model/active-vocabulary-claim.json
brev ls --json
git diff --check
```

## Allowed Next Actions

Select exactly one:

- `continue_m3iu_recognizer_landmark_sequence_plan_followup`
- `continue_m3iu_detector0_landmark_training_packet_readiness_plan`
- `stop_for_human_review`

## Acceptance Criteria

1. `GOAL.md` points at this prompt and names Mission 3IT.
2. The recognizer landmark-sequence plan exists, is scoped, and cites M3IS,
   M3IR, M3IQ, and relevant observer strategy memo evidence by exact path.
3. The plan defines future input shape, coordinate space, temporal window,
   missingness/masking, provenance, validation prerequisites, and claim
   boundaries without implementing runtime or training code.
4. No MediaPipe/labeling/training/evaluation/export/promotion/browser
   activation occurs in the loop lane, and Brev is read-only inventory at most.
5. Claim surfaces remain fail-closed and active recognition labels remain empty.
6. The receipt and numbered session log exist, parse where applicable, and
   select exactly one allowed next action.
7. The change is committed with a message beginning `mission-3it:`.
