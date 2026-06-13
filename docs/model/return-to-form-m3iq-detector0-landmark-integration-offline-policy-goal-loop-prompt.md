# Return-To-Form M3IQ Detector 0 Landmark Integration (Offline-Label Policy) Goal Loop Prompt

Mission 3IQ prompt for the Codex executor after the supervising user authorized
an offline-label policy relaxation and directed the pair onto the from-scratch
**region + hand-landmark** detector path that the supervisor (Claude) has
already built and proven in a side worktree.

Read [`GOAL.md`](../../GOAL.md) first, then this prompt.

## Authorized policy change (record and honor)

The supervising user authorized (2026-05-30): **training/evaluation labels may be
derived offline by any tool (including MediaPipe), as long as the deployed
browser RUNTIME uses only our own scratch-trained model.** Offline labelers are
never a runtime dependency.

`scripts/audit_no_pretrained_artifact_json.mjs` was updated to permit a single
string that BOTH discloses offline-label provenance AND attests runtime is our
scratch model (see `isDisclosedOfflineLabelProvenance`). The deps ban
(`audit_no_pretrained_deps.mjs`), the `pretrained_components`/`extractor`/
`tasks_vision_version` key bans, and the browser-artifact bans REMAIN in force.
When any project artifact discloses label provenance, it MUST use co-located
phrasing like: *"targets offline-derived via MediaPipe Holistic; runtime uses
only our scratch-trained model and is not a runtime dependency."* A bare
pretrained mention without that attestation still fails the audit.

## Supervisor-built foundation (reference, do not re-run)

The supervisor owns the heavy ML lane in side worktree
`/Users/kelly/Developer/asl-pilot-annotator` (branch `annotator-tool`). Read it
read-only for evidence; do NOT run MediaPipe labeling or training in the loop
lane (MediaPipe must not enter the loop branch's code/deps):

- Findings: `research/detector0-hand-push-findings.md`,
  `research/detector0-trained-evidence.md`,
  `research/detector0-data-strategy.md`.
- Pipeline: `tools/detector0-annotator/{autolabel,crop_relabel,train_detector,
  train_detector_grid,train_hands_landmarks}.py`.
- Trained scratch artifacts + receipts:
  `tools/detector0-annotator/output/detector0-grid-final.{pt,json}` (region
  detector) and `detector0-hand-landmarks.{pt,json}` (hand-landmark baseline).

Proven results (held-out PopSign test, MediaPipe-offline labels, 18,189 frames /
95 words): region detector head/face recall@IoU0.30 `0.984` and signing-space
`0.999` (meet spec); hands `~0.88`/`0.78` recall@0.30, `~0.51` IoU, 2x the
fixed-box baseline (box precision is MediaPipe-label-noise-capped at ~0.55 IoU).
First scratch hand-landmark model is a weak baseline (PCK@0.1 `~0.30`); the next
ML lever (heatmap landmark head) stays in the supervisor lane.

## Mission (one reviewable slice)

Integrate this approach into the PROJECT, fail-closed, under the new policy.
Choose the single most useful next slice:

1. Record the authorized offline-label policy + the audit change in the project
   decision/lessons record, with the human authorization and the runtime
   boundary, using the disclosed-provenance phrasing.
2. Define/update the Detector 0 target contract for **4 coarse regions + 21
   hand landmarks per hand** (the recognizer-facing handshape signal), citing
   the supervisor's coordinate space and metrics as diagnostic evidence.
3. Update `web/public/model/detector0-card.json` provenance/notes to reflect the
   scratch region+landmark approach and disclosed offline-label provenance, kept
   `status: not_trained` / `promotion_state: research_only` / `browser_artifact:
   null` (fail-closed; no promotion).
4. Plan the recognizer phase (isolated-sign model on hand-landmark sequences),
   recording the design and the data path.

## Forbidden / out of scope for the loop lane

Do not: run MediaPipe or add it to loop-branch code/deps; re-run the supervisor's
labeling/training; promote artifacts, mutate cards to `trained`, export ONNX, or
activate browser recognition; weaken the runtime/deps/browser bans; claim ASL
correctness or spec pass; start Brev (the models are tiny, no GPU needed).

## Division of labor

- Supervisor (Claude, side worktree): MediaPipe labeling + ML iteration
  (heatmap landmark head, data expansion, human eval). Hands the loop datasets,
  models, and metrics.
- Loop (this lane): project integration, the target contract, fail-closed
  governance, audits, decision/lessons records, and recognizer planning.

## Required outputs

- One scoped project artifact/doc for the chosen slice.
- A validation receipt `docs/validation/return-to-form-m3iq-detector0-landmark-integration-v1.json`.
- A numbered session log.

## Allowed checks

`node scripts/audit_loop_premise.mjs --json`,
`node scripts/audit_return_to_form_plan.mjs --json`,
`node scripts/audit_no_pretrained_deps.mjs`,
`node scripts/audit_no_pretrained_artifact_json.mjs`,
`node scripts/audit_detector0_strict_gate_crop_contract.mjs --json`, JSON
validation, `git diff --check`. Brev inventory read-only only.

## Next actions (select one)

- `continue_m3ir_detector0_landmark_contract_or_card_integration`
- `continue_m3ir_detector0_offline_policy_decision_record`
- `continue_m3ir_recognizer_landmark_sequence_plan`
- `stop_for_human_review`

## Acceptance criteria

1. GOAL.md points at this prompt and names Mission 3IQ; no stop marker.
2. No MediaPipe/labeling/training in the loop lane; no promotion; claim surfaces
   remain fail-closed.
3. The chosen artifact + receipt + session log exist, valid and tracked.
4. All baseline audits pass (the no-pretrained artifact audit passes because any
   provenance disclosure uses the co-located runtime-scratch attestation).
5. The slice cites the supervisor's worktree evidence by exact path.
