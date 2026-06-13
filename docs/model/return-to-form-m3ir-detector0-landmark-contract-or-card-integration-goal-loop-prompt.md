# Return-To-Form M3IR Detector 0 Landmark Contract Or Card Integration Goal Loop Prompt

Mission 3IR prompt for the Codex executor after M3IQ recorded the
human-authorized offline-label policy decision and selected
`continue_m3ir_detector0_landmark_contract_or_card_integration`.

Read [`GOAL.md`](../../GOAL.md) first, then this prompt.

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-labeling/
no-training/no-promotion project-integration slice for the scratch
region + hand-landmark Detector 0 path.

Choose one smallest useful slice:

1. Define/update the Detector 0 target contract for four coarse regions plus
   21 hand landmarks per hand, citing the supervisor side-worktree coordinate
   space, evidence files, and metrics as diagnostic evidence only.
2. Update `web/public/model/detector0-card.json` provenance/notes to reflect
   the scratch region+landmark approach and disclosed offline-label provenance
   while keeping `status: "not_trained"`,
   `promotion_state: "research_only"`, and `browser_artifact: null`.

## Source Of Truth

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3IQ policy decision evidence:
   - [`DECISIONS.md`](../../DECISIONS.md)
   - [`docs/validation/return-to-form-m3iq-detector0-landmark-integration-v1.json`](../validation/return-to-form-m3iq-detector0-landmark-integration-v1.json)
   - [`docs/session-logs/809-mission-3iq-detector0-offline-label-policy-decision-record.md`](../session-logs/809-mission-3iq-detector0-offline-label-policy-decision-record.md)
4. Supervisor side-worktree evidence, read-only:
   - `/Users/kelly/Developer/asl-pilot-annotator/research/detector0-trained-evidence.md`
   - `/Users/kelly/Developer/asl-pilot-annotator/research/detector0-hand-push-findings.md`
   - `/Users/kelly/Developer/asl-pilot-annotator/research/detector0-data-strategy.md`
   - `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/detector0-grid-final.json`
   - `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/detector0-spec-eval.json`
   - `/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/detector0-hand-landmarks.json`
5. Claim surfaces:
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Required Boundaries

- Do not run MediaPipe, import MediaPipe, or add MediaPipe to loop-branch code
  or dependencies.
- Do not re-run the supervisor side-worktree labeling, training, evaluation, or
  export pipeline.
- Do not mutate side-worktree files.
- Do not create or import source/media authority.
- Do not generate labels, tensors, model checkpoints, ONNX, browser bundles, or
  promoted artifacts.
- Do not start, stop, sync, exec, or copy from Brev; read-only
  `brev ls --json` is allowed only to prove no unexpected paid worker is
  running.
- Keep runtime/deps/browser bans in force. Offline provenance disclosures must
  use the co-located runtime-scratch attestation from M3IQ.
- Keep claim surfaces fail-closed. Detector 0 remains research-only until a
  later explicit promotion receipt.

## Required Outputs

- One scoped target-contract or detector-card integration artifact/change.
- A validation receipt:
  `docs/validation/return-to-form-m3ir-detector0-landmark-contract-or-card-integration-v1.json`.
- A numbered session log.

## Allowed Checks

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_detector0_strict_gate_crop_contract.mjs --json
python3 -m json.tool docs/validation/return-to-form-m3ir-detector0-landmark-contract-or-card-integration-v1.json >/dev/null
brev ls --json
git diff --check
```

## Allowed Next Actions

Select exactly one:

- `continue_m3is_detector0_landmark_contract_or_card_followup`
- `continue_m3is_recognizer_landmark_sequence_plan`
- `stop_for_human_review`

## Acceptance Criteria

1. `GOAL.md` points at this prompt and names Mission 3IR.
2. The chosen target-contract or detector-card slice exists, is scoped, and
   cites the M3IQ/supervisor evidence by exact path.
3. Any offline-label provenance disclosure uses the M3IQ co-located
   runtime-scratch attestation.
4. No MediaPipe/labeling/training/export/promotion/browser activation occurs in
   the loop lane.
5. Claim surfaces remain fail-closed.
6. The receipt and numbered session log exist, parse where applicable, and
   select exactly one allowed next action.
7. The change is committed with a message beginning `mission-3ir:`.
