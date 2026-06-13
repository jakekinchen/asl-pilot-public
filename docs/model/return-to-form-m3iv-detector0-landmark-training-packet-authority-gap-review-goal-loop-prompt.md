# Return-To-Form M3IV Detector 0 Landmark Training Packet Authority Gap Review Goal Loop Prompt

Mission 3IV prompt for the Codex executor after M3IU created the static
Detector 0 landmark training-packet readiness plan and selected
`continue_m3iv_detector0_landmark_training_packet_authority_gap_review`.

Read [`GOAL.md`](../../GOAL.md) first, then this prompt.

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-labeling/
no-training/no-promotion authority-gap review for a future Detector 0 region +
hand-landmark training packet.

The goal is to bind the M3IU readiness gaps to current local authority
evidence: source-register records, the M3IQ offline-label policy decision,
M3IR/M3IS/M3IT/M3IU planning artifacts, and claim surfaces. This mission must
answer what authority is missing before any future packet can include
offline-derived region/hand-landmark labels. It must not import sources,
approve sources, generate labels, materialize packets, build tensors, train,
evaluate, start Brev, export, promote, activate browser recognition, alter
final gates, or expand claims.

## Source Of Truth

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3IU readiness-plan evidence:
   - [`docs/model/return-to-form-detector0-landmark-training-packet-readiness-plan-v1.json`](return-to-form-detector0-landmark-training-packet-readiness-plan-v1.json)
   - [`docs/validation/return-to-form-m3iu-detector0-landmark-training-packet-readiness-plan-v1.json`](../validation/return-to-form-m3iu-detector0-landmark-training-packet-readiness-plan-v1.json)
   - [`docs/session-logs/817-mission-3iu-detector0-landmark-training-packet-readiness-plan.md`](../session-logs/817-mission-3iu-detector0-landmark-training-packet-readiness-plan.md)
4. Authority and policy evidence:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`DECISIONS.md`](../../DECISIONS.md)
   - [`docs/validation/return-to-form-m3iq-detector0-landmark-integration-v1.json`](../validation/return-to-form-m3iq-detector0-landmark-integration-v1.json)
5. Upstream target/sequence evidence:
   - [`docs/model/return-to-form-detector0-region-hand-landmark-target-contract-v1.json`](return-to-form-detector0-region-hand-landmark-target-contract-v1.json)
   - [`docs/model/return-to-form-recognizer-landmark-sequence-plan-v1.json`](return-to-form-recognizer-landmark-sequence-plan-v1.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
6. Advisory observer strategy memos:
   - [`artifacts/research/observer-508-m3ef-model-input-strategy/response.md`](../../artifacts/research/observer-508-m3ef-model-input-strategy/response.md)
   - [`artifacts/research/observer-597-m3fs-detector0-strict-gate-strategy/response.md`](../../artifacts/research/observer-597-m3fs-detector0-strict-gate-strategy/response.md)
7. Claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Required Boundaries

- Do not import, download, copy, approve, or mutate source/media authority.
- Do not run MediaPipe, labeling, fitting, training, evaluation, ablation, or
  side-worktree pipelines.
- Do not author authoritative labels, generated labels, tensors, checkpoints,
  ONNX, browser bundles, promoted artifacts, active vocabulary claims, or
  source-register changes.
- Do not implement training-packet builders, tensor builders, model code,
  recognizer runtime code, TypeScript interfaces, exports, or browser bundles.
- Do not start, stop, reset, sync, exec, or copy from Brev; read-only
  `brev ls --json` is allowed only to prove no unexpected paid worker is
  running.
- Keep runtime/deps/browser bans in force. Offline label provenance remains
  training/evaluation supervision only, and offline labelers are never runtime
  dependencies.
- Keep all claim surfaces fail-closed.

## Required Outputs

- One scoped authority-gap review artifact:
  `docs/model/return-to-form-detector0-landmark-training-packet-authority-gap-review-v1.json`.
- A validation receipt:
  `docs/validation/return-to-form-m3iv-detector0-landmark-training-packet-authority-gap-review-v1.json`.
- A numbered session log.

## Required Review Content

The authority-gap review must define:

- exact artifact identities and hashes for M3IU, M3IQ, source-register,
  M3IR/M3IT target/sequence contracts, claim surfaces, and advisory observer
  memos;
- which current source-register records, if any, explicitly allow
  offline-derived region boxes and hand landmarks for training/evaluation
  supervision;
- which current records are raw-video-only, candidate-only, unknown, or
  insufficient for derived labels;
- the exact missing human/source decisions before any future packet
  materialization, offline labeling run, tensor generation, training,
  evaluation, Brev spend, export, promotion, browser activation, or claim
  expansion;
- what wording must accompany any future approved offline-derived labels;
- whether another local contract/review slice remains useful or whether the
  loop should stop for human source/label authority review.

## Allowed Checks

```sh
git status --short --branch
git log -14 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/model/dataset-source-register.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-landmark-training-packet-readiness-plan-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3iu-detector0-landmark-training-packet-readiness-plan-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-landmark-training-packet-authority-gap-review-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3iv-detector0-landmark-training-packet-authority-gap-review-v1.json >/dev/null
jq '{status, promotion_state, browser_artifact}' web/public/model/detector0-card.json
jq '{activeLabels}' docs/model/active-vocabulary-claim.json
brev ls --json
git diff --check
```

## Allowed Next Actions

Select exactly one:

- `continue_m3iw_detector0_landmark_training_packet_materialization_contract_no_brev`
- `continue_m3iw_detector0_landmark_source_candidate_review_no_import`
- `continue_m3iw_recognizer_sequence_tensor_contract_no_brev`
- `escalate_detector0_landmark_authority_strategy_with_local_evidence`
- `stop_for_human_source_or_label_authority_review`

Do not select direct source import, raw learner video upload, MediaPipe
labeling, packet materialization, Brev fitting, Detector 0 training, recognizer
training, real evaluation, export, promotion, browser activation, final-gate
change, or claim expansion from M3IV.

## Acceptance Criteria

1. `GOAL.md` points at this prompt and names Mission 3IV.
2. M3IU readiness evidence, dataset source register, and M3IQ policy evidence
   parse and are referenced by exact path.
3. The authority-gap review exists, is scoped, and records current authority
   status, missing decisions, runtime/deps boundary, and claim boundaries
   without importing sources, generating labels, or implementing runtime or
   training code.
4. No MediaPipe/labeling/training/evaluation/export/promotion/browser
   activation occurs in the loop lane, and Brev is read-only inventory at most.
5. Claim surfaces remain fail-closed and active recognition labels remain
   empty.
6. The receipt and numbered session log exist, parse where applicable, and
   select exactly one allowed next action.
7. The change is committed with a message beginning `mission-3iv:`.
