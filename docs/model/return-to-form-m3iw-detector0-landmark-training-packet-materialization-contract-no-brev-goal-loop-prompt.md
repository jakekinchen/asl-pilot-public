# Return-To-Form M3IW Detector 0 Landmark Training Packet Materialization Contract No Brev Goal Loop Prompt

Mission 3IW prompt for the Codex executor after M3IV reviewed source/label
authority, the observer stopped for human review, and supervisor commit
`1a96a12` reconciled the PopSign offline-derived-label authority record.

Read [`GOAL.md`](../../GOAL.md) first, then this prompt.

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-labeling/
no-training/no-promotion materialization-contract slice for a future Detector 0
region + hand-landmark training packet.

The goal is to turn M3IU readiness gaps, M3IV authority review, the
`1a96a12` PopSign source-register amendment, M3IR target contract, and M3IT
recognizer-sequence assumptions into a concrete contract for what a later
packet materialization step must prove. This mission must not materialize the
packet or create labels/tensors. It is a contract and validation-planning slice
only.

## Source Of Truth

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. Supervisor M3IV resolution:
   - [`docs/session-logs/822-supervisor-resolve-m3iv-source-label-authority.md`](../session-logs/822-supervisor-resolve-m3iv-source-label-authority.md)
   - commit `1a96a12 supervisor: reconcile PopSign source-register authority for offline-derived labels (resolves M3IV STOP)`
4. M3IV authority review:
   - [`docs/model/return-to-form-detector0-landmark-training-packet-authority-gap-review-v1.json`](return-to-form-detector0-landmark-training-packet-authority-gap-review-v1.json)
   - [`docs/validation/return-to-form-m3iv-detector0-landmark-training-packet-authority-gap-review-v1.json`](../validation/return-to-form-m3iv-detector0-landmark-training-packet-authority-gap-review-v1.json)
   - [`docs/session-logs/819-mission-3iv-detector0-landmark-training-packet-authority-gap-review.md`](../session-logs/819-mission-3iv-detector0-landmark-training-packet-authority-gap-review.md)
   - [`docs/session-logs/820-observer-stop-m3iv-source-label-authority-review.md`](../session-logs/820-observer-stop-m3iv-source-label-authority-review.md)
5. M3IU readiness-plan evidence:
   - [`docs/model/return-to-form-detector0-landmark-training-packet-readiness-plan-v1.json`](return-to-form-detector0-landmark-training-packet-readiness-plan-v1.json)
   - [`docs/validation/return-to-form-m3iu-detector0-landmark-training-packet-readiness-plan-v1.json`](../validation/return-to-form-m3iu-detector0-landmark-training-packet-readiness-plan-v1.json)
   - [`docs/session-logs/817-mission-3iu-detector0-landmark-training-packet-readiness-plan.md`](../session-logs/817-mission-3iu-detector0-landmark-training-packet-readiness-plan.md)
6. Authority and policy evidence:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`DECISIONS.md`](../../DECISIONS.md)
   - [`docs/validation/return-to-form-m3iq-detector0-landmark-integration-v1.json`](../validation/return-to-form-m3iq-detector0-landmark-integration-v1.json)
7. Upstream target/sequence evidence:
   - [`docs/model/return-to-form-detector0-region-hand-landmark-target-contract-v1.json`](return-to-form-detector0-region-hand-landmark-target-contract-v1.json)
   - [`docs/model/return-to-form-recognizer-landmark-sequence-plan-v1.json`](return-to-form-recognizer-landmark-sequence-plan-v1.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
8. Claim surfaces:
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
- Do not materialize a packet, create packet rows, copy raw clips, or create
  frame/label/tensor files.
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

- One scoped materialization-contract artifact:
  `docs/model/return-to-form-detector0-landmark-training-packet-materialization-contract-v1.json`.
- A validation receipt:
  `docs/validation/return-to-form-m3iw-detector0-landmark-training-packet-materialization-contract-v1.json`.
- A numbered session log.

## Required Contract Content

The materialization contract must define:

- exact artifact identities and hashes for M3IU, M3IV, the `1a96a12`
  source-register amendment, M3IQ, M3IR, M3IT, claim surfaces, and any
  side-worktree evidence cited by path only;
- the exact source scope that is eligible today, including PopSign
  offline-derived region/landmark/pose supervision authority and any sources
  that remain candidate-only, raw-video-only, validation-only, or insufficient;
- required packet inputs before materialization: source ids, split ids,
  signer ids, clip ids, frame references, checksums, and allowed label target
  schema;
- required offline-label sidecar fields: labeler method, version/config hash,
  run id, source clip/frame binding, coordinate frame, confidence/visibility
  handling, manual-review state, and provenance wording;
- compatibility checks against the M3IR four-region + 21-hand-landmark target
  contract and M3IT recognizer sequence plan;
- split/leakage constraints, signer-disjoint proof, duplicate-frame handling,
  negative/no-hand accounting, two-hand/contact cases, absence/missing-hand
  encoding, and human-review sample requirements;
- validation prerequisites before any later packet materialization can be
  treated as authoritative;
- what must remain fail-closed before training, evaluation, Brev spend, export,
  promotion, browser activation, final-gate change, recognizer work, or claim
  expansion.

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
python3 -m json.tool docs/model/return-to-form-detector0-landmark-training-packet-authority-gap-review-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-region-hand-landmark-target-contract-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-recognizer-landmark-sequence-plan-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-landmark-training-packet-materialization-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3iw-detector0-landmark-training-packet-materialization-contract-v1.json >/dev/null
jq '{status, promotion_state, browser_artifact}' web/public/model/detector0-card.json
jq '{activeLabels}' docs/model/active-vocabulary-claim.json
brev ls --json
git diff --check
```

## Allowed Next Actions

Select exactly one:

- `continue_m3ix_detector0_landmark_packet_source_manifest_contract_no_brev`
- `continue_m3ix_detector0_landmark_label_sidecar_contract_no_brev`
- `continue_m3ix_detector0_landmark_packet_validation_receipt_no_brev`
- `escalate_detector0_landmark_packet_materialization_strategy_with_local_evidence`
- `stop_for_packet_materialization_authority_or_evidence_gap`

Do not select direct source import, raw learner video upload, MediaPipe
labeling, packet materialization, Brev fitting, Detector 0 training, recognizer
training, real evaluation, export, promotion, browser activation, final-gate
change, or claim expansion from M3IW.

## Acceptance Criteria

1. `GOAL.md` points at this prompt and names Mission 3IW.
2. M3IU, M3IV, M3IQ, M3IR, M3IT, supervisor-resolution, and source-register
   evidence parse where applicable and are referenced by exact path.
3. The materialization contract exists, is scoped, and records eligible source
   scope, packet input requirements, sidecar/provenance requirements,
   compatibility checks, split/leakage constraints, review requirements,
   runtime/deps boundary, validation prerequisites, and claim boundaries
   without materializing packets or implementing runtime/training code.
4. No MediaPipe/labeling/training/evaluation/export/promotion/browser
   activation occurs in the loop lane, and Brev is read-only inventory at most.
5. Claim surfaces remain fail-closed and active recognition labels remain
   empty.
6. The receipt and numbered session log exist, parse where applicable, and
   select exactly one allowed next action.
7. The change is committed with a message beginning `mission-3iw:`.
