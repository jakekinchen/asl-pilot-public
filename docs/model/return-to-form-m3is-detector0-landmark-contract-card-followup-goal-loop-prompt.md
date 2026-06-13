# Return-To-Form M3IS Detector 0 Landmark Contract Card Followup Goal Loop Prompt

Mission 3IS prompt for the Codex executor after M3IR defined the static
region + hand-landmark Detector 0 target contract and selected
`continue_m3is_detector0_landmark_contract_or_card_followup`.

Read [`GOAL.md`](../../GOAL.md) first, then this prompt.

## Mission

Complete exactly one local/no-remote/no-Brev/no-paid-compute/no-labeling/
no-training/no-promotion followup that integrates the M3IR target contract with
fail-closed Detector 0 card and claim governance.

Choose one smallest useful slice:

1. Update `web/public/model/detector0-card.json` provenance/notes to cite the
   M3IR region + hand-landmark target contract and the M3IQ offline-label
   policy while preserving `status: "not_trained"`,
   `promotion_state: "research_only"`, and `browser_artifact: null`.
2. If `detector0-card.json` already fully covers the contract and provenance
   boundary, create a narrow card/contract consistency receipt that cites the
   exact existing card fields and explains why no card mutation is needed.

## Source Of Truth

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3IR target-contract evidence:
   - [`docs/model/return-to-form-detector0-region-hand-landmark-target-contract-v1.json`](return-to-form-detector0-region-hand-landmark-target-contract-v1.json)
   - [`docs/validation/return-to-form-m3ir-detector0-landmark-contract-or-card-integration-v1.json`](../validation/return-to-form-m3ir-detector0-landmark-contract-or-card-integration-v1.json)
   - [`docs/session-logs/811-mission-3ir-detector0-region-hand-landmark-target-contract.md`](../session-logs/811-mission-3ir-detector0-region-hand-landmark-target-contract.md)
4. M3IQ policy decision evidence:
   - [`DECISIONS.md`](../../DECISIONS.md)
   - [`docs/validation/return-to-form-m3iq-detector0-landmark-integration-v1.json`](../validation/return-to-form-m3iq-detector0-landmark-integration-v1.json)
   - [`docs/session-logs/809-mission-3iq-detector0-offline-label-policy-decision-record.md`](../session-logs/809-mission-3iq-detector0-offline-label-policy-decision-record.md)
5. Claim surfaces:
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Required Boundaries

- Do not run MediaPipe, import MediaPipe, or add MediaPipe to loop-branch code
  or dependencies.
- Do not re-run supervisor side-worktree labeling, training, evaluation, or
  export work.
- Do not mutate side-worktree files.
- Do not create or import source/media authority.
- Do not generate labels, tensors, model checkpoints, ONNX, browser bundles, or
  promoted artifacts.
- Do not start, stop, sync, exec, or copy from Brev; read-only
  `brev ls --json` is allowed only to prove no unexpected paid worker is
  running.
- Keep runtime/deps/browser bans in force. Offline provenance disclosures must
  use the M3IQ co-located runtime-scratch attestation:
  "targets offline-derived via MediaPipe Holistic; runtime uses only our
  scratch-trained model and is not a runtime dependency."
- Keep all claim surfaces fail-closed. This mission must not grant Detector 0
  runtime authority, browser recognition authority, ASL correctness authority,
  or model-readiness authority.

## Required Outputs

- One scoped detector-card update or card/contract consistency artifact.
- A validation receipt:
  `docs/validation/return-to-form-m3is-detector0-landmark-contract-card-followup-v1.json`.
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
python3 -m json.tool docs/validation/return-to-form-m3is-detector0-landmark-contract-card-followup-v1.json >/dev/null
jq '{status, promotion_state, browser_artifact}' web/public/model/detector0-card.json
jq '{activeLabels}' docs/model/active-vocabulary-claim.json
brev ls --json
git diff --check
```

## Allowed Next Actions

Select exactly one:

- `continue_m3it_recognizer_landmark_sequence_plan`
- `continue_m3it_detector0_landmark_card_contract_followup`
- `stop_for_human_review`

## Acceptance Criteria

1. `GOAL.md` points at this prompt and names Mission 3IS.
2. The chosen detector-card or card/contract consistency slice exists, is
   scoped, and cites the M3IR contract/receipt/log and M3IQ decision evidence
   by exact path.
3. If `web/public/model/detector0-card.json` changes, it preserves
   `status: "not_trained"`, `promotion_state: "research_only"`, and
   `browser_artifact: null`.
4. Any offline-label provenance disclosure uses the M3IQ co-located
   runtime-scratch attestation.
5. No MediaPipe/labeling/training/export/promotion/browser activation occurs in
   the loop lane, and Brev is read-only inventory at most.
6. Claim surfaces remain fail-closed and active recognition labels remain empty.
7. The receipt and numbered session log exist, parse where applicable, and
   select exactly one allowed next action.
8. The change is committed with a message beginning `mission-3is:`.
