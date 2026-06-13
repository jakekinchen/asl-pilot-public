# Return-To-Form M3IX Detector 0 Landmark Packet Source Manifest Contract No Brev Goal Loop Prompt

Mission 3IX prompt for the Codex executor after M3IW defined the static
Detector 0 landmark training-packet materialization contract and selected
`continue_m3ix_detector0_landmark_packet_source_manifest_contract_no_brev`.

Read [`GOAL.md`](../../GOAL.md) first, then this prompt.

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-labeling/
no-training/no-promotion source-manifest contract slice for a future Detector 0
region + hand-landmark training packet.

The goal is to turn the M3IW materialization contract into a precise future
source-manifest contract: what source rows, split boundaries, signer/clip/frame
references, checksums, attribution, and provenance fields must exist before any
later packet source manifest can be materialized. This mission must not import
sources, copy raw media, materialize a manifest, create labels, create tensors,
train, evaluate, export, promote, or activate browser recognition.

## Source Of Truth

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3IW materialization-contract evidence:
   - [`docs/model/return-to-form-detector0-landmark-training-packet-materialization-contract-v1.json`](return-to-form-detector0-landmark-training-packet-materialization-contract-v1.json)
   - [`docs/validation/return-to-form-m3iw-detector0-landmark-training-packet-materialization-contract-v1.json`](../validation/return-to-form-m3iw-detector0-landmark-training-packet-materialization-contract-v1.json)
   - [`docs/session-logs/824-mission-3iw-detector0-landmark-training-packet-materialization-contract.md`](../session-logs/824-mission-3iw-detector0-landmark-training-packet-materialization-contract.md)
4. Supervisor M3IV resolution:
   - [`docs/session-logs/822-supervisor-resolve-m3iv-source-label-authority.md`](../session-logs/822-supervisor-resolve-m3iv-source-label-authority.md)
   - commit `1a96a12 supervisor: reconcile PopSign source-register authority for offline-derived labels (resolves M3IV STOP)`
5. Source and policy evidence:
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`DECISIONS.md`](../../DECISIONS.md)
   - [`docs/validation/return-to-form-m3iq-detector0-landmark-integration-v1.json`](../validation/return-to-form-m3iq-detector0-landmark-integration-v1.json)
6. Upstream target/sequence evidence:
   - [`docs/model/return-to-form-detector0-region-hand-landmark-target-contract-v1.json`](return-to-form-detector0-region-hand-landmark-target-contract-v1.json)
   - [`docs/model/return-to-form-recognizer-landmark-sequence-plan-v1.json`](return-to-form-recognizer-landmark-sequence-plan-v1.json)
7. Claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Required Boundaries

- Do not import, download, copy, approve, or mutate source/media authority.
- Do not materialize a source manifest, packet manifest, packet rows, raw
  clips, extracted frames, labels, tensors, checkpoints, ONNX files, browser
  bundles, or promoted artifacts.
- Do not run MediaPipe, labeling, fitting, training, evaluation, ablation, or
  side-worktree pipelines.
- Do not author authoritative labels or generated labels.
- Do not implement source-manifest builders, training-packet builders, tensor
  builders, model code, recognizer runtime code, TypeScript interfaces,
  exports, or browser bundles.
- Do not start, stop, reset, sync, exec, or copy from Brev; read-only
  `brev ls --json` is allowed only to prove no unexpected paid worker is
  running.
- Keep runtime/deps/browser bans in force. Offline label provenance remains
  training/evaluation supervision only, and offline labelers are never runtime
  dependencies.
- Keep all claim surfaces fail-closed.

## Required Outputs

- One scoped source-manifest contract artifact:
  `docs/model/return-to-form-detector0-landmark-packet-source-manifest-contract-v1.json`.
- A validation receipt:
  `docs/validation/return-to-form-m3ix-detector0-landmark-packet-source-manifest-contract-v1.json`.
- A numbered session log.

## Required Contract Content

The source-manifest contract must define:

- exact artifact identities and hashes for M3IW, the current source register,
  M3IQ, M3IR, M3IT, claim surfaces, and any cited supervisor evidence;
- the eligible source scope for a future manifest, including PopSign v1
  original videos plus its offline-derived-label amendment, and the sources
  that remain candidate-only, raw-video-only, validation-only, blocked, or
  insufficient;
- source-manifest row schema: source id, source decision id, offline-derived
  label amendment id when applicable, license/attribution, canonical label id,
  source split, project split, signer id or pseudonymous signer group, clip id,
  raw clip reference, raw clip checksum, frame count, duration, frame sampling
  policy, frame reference ids, and future extracted-frame checksum slots;
- split and leakage contract: source split boundaries, signer-disjoint proof,
  duplicate clip/frame grouping, train/validation/test separation, label
  coverage accounting, and rejection rules for ambiguous or missing source
  identity;
- provenance and privacy constraints: no raw learner video upload, no raw media
  commit requirement, pseudonymous signer ids, attribution retention, and
  co-located offline-label provenance wording for later label sidecars;
- validation prerequisites before a future source manifest can become
  materialized evidence;
- what must remain fail-closed before label sidecars, packet materialization,
  tensor generation, training, evaluation, Brev spend, export, promotion,
  browser activation, final-gate change, recognizer work, or claim expansion.

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
python3 -m json.tool docs/model/return-to-form-detector0-landmark-training-packet-materialization-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3iw-detector0-landmark-training-packet-materialization-contract-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-landmark-packet-source-manifest-contract-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3ix-detector0-landmark-packet-source-manifest-contract-v1.json >/dev/null
jq '{status, promotion_state, browser_artifact}' web/public/model/detector0-card.json
jq '{activeLabels}' docs/model/active-vocabulary-claim.json
brev ls --json
git diff --check
```

## Allowed Next Actions

Select exactly one:

- `continue_m3iy_detector0_landmark_label_sidecar_contract_no_brev`
- `continue_m3iy_detector0_landmark_source_manifest_validation_contract_no_brev`
- `continue_m3iy_detector0_landmark_packet_validation_receipt_no_brev`
- `escalate_detector0_landmark_source_manifest_strategy_with_local_evidence`
- `stop_for_source_manifest_authority_or_schema_gap`

Do not select direct source import, raw learner video upload, MediaPipe
labeling, source-manifest materialization, packet materialization, Brev fitting,
Detector 0 training, recognizer training, real evaluation, export, promotion,
browser activation, final-gate change, or claim expansion from M3IX.

## Acceptance Criteria

1. `GOAL.md` points at this prompt and names Mission 3IX.
2. M3IW, source-register, M3IQ, M3IR, M3IT, supervisor-resolution, and claim
   evidence parse where applicable and are referenced by exact path.
3. The source-manifest contract exists, is scoped, and records source scope,
   row schema, split/leakage requirements, provenance/privacy constraints,
   validation prerequisites, and fail-closed boundaries without materializing a
   source manifest, packet, labels, tensors, or runtime/training code.
4. No MediaPipe/labeling/training/evaluation/export/promotion/browser
   activation occurs in the loop lane, and Brev is read-only inventory at most.
5. Claim surfaces remain fail-closed and active recognition labels remain
   empty.
6. The receipt and numbered session log exist, parse where applicable, and
   select exactly one allowed next action.
7. The change is committed with a message beginning `mission-3ix:`.
