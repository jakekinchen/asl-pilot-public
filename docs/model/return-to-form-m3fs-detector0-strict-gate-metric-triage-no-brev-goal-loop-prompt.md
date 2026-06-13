# Return-To-Form M3FS Detector 0 Strict-Gate Metric Triage No Brev Goal Loop Prompt

Mission 3FS prompt for the Codex executor after Mission 3FR created and ran
one local/no-spend Detector 0 strict-gate crop-normalization smoke.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Perform one local/no-spend/no-training metric triage over the M3FR strict-gate
smoke evidence. This is an evidence and decision packet only. It must classify
what the M3FR packet-frame metrics mean, whether any no-training local contract
or accounting issue remains, and which bounded next action is honest.

This prompt does not authorize rerunning the smoke, training/fitting, evaluator
rerun, checkpoint creation, Brev lifecycle/spend, remote execution,
source/media import, source-register mutation, manifest/tensor/packet/
vocabulary mutation, export, promotion, browser activation, runtime Detector 0
authority, model-card promotion, active-vocabulary promotion, final-readiness
claim, product-readiness claim, trainability claim, ASL correctness claim, or
push.

## Source Of Truth

Read in this order:

1. Latest supervising-user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3FR receipt:
   [`docs/validation/return-to-form-m3fr-detector0-strict-gate-local-smoke-no-brev-v1.json`](../validation/return-to-form-m3fr-detector0-strict-gate-local-smoke-no-brev-v1.json).
4. M3FR session log:
   [`docs/session-logs/594-mission-3fr-detector0-strict-gate-local-smoke-no-brev.md`](../session-logs/594-mission-3fr-detector0-strict-gate-local-smoke-no-brev.md).
5. M3FR smoke script, as read-only implementation evidence:
   [`scripts/run_return_to_form_tier0_detector0_strict_gate_crop_normalization_smoke.py`](../../scripts/run_return_to_form_tier0_detector0_strict_gate_crop_normalization_smoke.py).
6. M3FQ strict-gate contract and receipt:
   - [`docs/model/return-to-form-detector0-strict-gate-crop-normalization-contract.json`](return-to-form-detector0-strict-gate-crop-normalization-contract.json)
   - [`docs/validation/return-to-form-m3fq-detector0-crop-normalized-recognizer-integration-v1.json`](../validation/return-to-form-m3fq-detector0-crop-normalized-recognizer-integration-v1.json)
7. Current fail-closed claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)

## Starting Evidence

- M3FR executor commit `aa41147` created
  `scripts/run_return_to_form_tier0_detector0_strict_gate_crop_normalization_smoke.py`
  and ran it once locally on CPU with `--max-epochs 120`.
- The smoke wrote
  `docs/validation/return-to-form-m3fr-detector0-strict-gate-local-smoke-no-brev-v1.json`
  and selected `continue_detector0_strict_gate_metric_triage_no_brev`.
- The smoke consumed the M3FQ static contract, including
  `manifest_validation_fp05_contact_gate` and contact threshold
  `0.20632459223270416`.
- At the contract threshold on validation packet-frame rows, false positives
  were `0`, true positives were `1`, false negatives were `6`, true negatives
  were `4`, false-positive rate was `0.0`, recall was
  `0.14285714285714285`, F1 was `0.25`, and learned right-crop row rate was
  `0.09090909090909091`.
- The local diagnostic FP05 threshold from local packet-frame scores was
  `0.12074794620275497`, still diagnostic-only and not promoted; validation
  recall rose only to `0.2857142857142857`.
- The microprobe fit train packet-frame rows but did not create a saved model
  artifact, generated tensor directory, recognizer smoke, export, promotion,
  browser activation, runtime Detector 0 authority, or ASL correctness claim.
- Fail-closed claim surfaces remained unchanged:
  `web/public/model/model-card.json` is `status: "not_trained"`,
  `web/public/model/detector0-card.json` is `status: "not_trained"` with
  `promotion_state: "research_only"` and `browser_artifact: null`, and
  `docs/model/active-vocabulary-claim.json` has `activeLabels: []`.
- Read-only Brev state remains default-off:
  `asl-pilot-m3eh-l40s-001` / `3d58wpy9o` is `STOPPED` / `COMPLETED` /
  `NOT READY` / `HEALTHY`.

## Required Slice

Complete one local metric-triage pass:

1. Verify live state, active prompt, latest commit, git status, loop premise,
   return-to-form plan audit, source register, no-pretrained audits, and Brev
   read-only default-off state.
2. Validate the M3FR receipt/session log, M3FQ contract/receipt, model card,
   Detector 0 card, and active-vocabulary JSON files.
3. Inspect the M3FR smoke script as read-only evidence. Do not rerun the smoke.
4. Summarize the M3FR train/validation/test packet-frame metrics, strict-gate
   threshold accounting, learned right-crop row rate, local diagnostic FP05
   threshold, and artifact/output boundaries.
5. Compare M3FR packet-frame results against the M3FQ side-contract metrics and
   the Detector 0/crop-normalization context recorded in `GOAL.md`.
6. Classify blockers. At minimum distinguish:
   - artifact/accounting or report availability issue;
   - strict-gate contract or threshold-accounting issue;
   - packet-frame sample-size limitation;
   - target-schema limitation;
   - crop/input representation limitation;
   - model/architecture/training-budget limitation;
   - weak diagnostic evidence without browser/runtime authority.
7. State whether any no-training local contract repair is evident. Do not
   invent a code repair if the evidence is simply weak diagnostic metrics.
8. State whether the evidence justifies export, promotion, browser activation,
   runtime Detector 0 authority, product/model/final/readiness claim,
   trainability claim, or ASL correctness claim. The expected answer is no
   unless the evidence proves otherwise.
9. Apply the observer progress-quality boundary: do not select another
   training-style, compute, architecture, input-representation, or budget step
   unless the next action is first routed to research or human review.
10. Write the tracked M3FS receipt and numbered session log.
11. Commit only scoped receipt/session-log artifacts.

Required local checks:

```sh
git status --short --branch
git log -12 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_detector0_strict_gate_crop_contract.mjs
python3 -m json.tool docs/validation/return-to-form-m3fr-detector0-strict-gate-local-smoke-no-brev-v1.json >/dev/null
python3 -m json.tool docs/model/return-to-form-detector0-strict-gate-crop-normalization-contract.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-m3fq-detector0-crop-normalized-recognizer-integration-v1.json >/dev/null
python3 -m json.tool web/public/model/model-card.json >/dev/null
python3 -m json.tool web/public/model/detector0-card.json >/dev/null
python3 -m json.tool docs/model/active-vocabulary-claim.json >/dev/null
PYTHONDONTWRITEBYTECODE=1 python3 -m py_compile scripts/run_return_to_form_tier0_detector0_strict_gate_crop_normalization_smoke.py
brev ls --json
git diff --check
```

## Receipt

Write:

`docs/validation/return-to-form-m3fs-detector0-strict-gate-metric-triage-no-brev-v1.json`

The receipt must include:

- current commit and active prompt;
- M3FR receipt/session-log summary;
- local checks and fail-closed claim-surface status;
- read-only Brev default-off state;
- M3FR smoke metric summary and diagnostic/non-final/non-product
  classification;
- strict-gate threshold, validation false-positive accounting, validation
  recall/F1, learned right-crop row rate, and local diagnostic FP05 threshold;
- comparison to M3FQ side-contract recognizer-smoke metrics and strict-gate
  transform evidence;
- blocker classification;
- explicit statement that no smoke rerun, training, fitting, evaluator rerun,
  checkpoint creation, Brev lifecycle/exec/sync/copy/spend, source/media
  import, source/manifest/tensor/packet/vocabulary mutation, export,
  promotion, browser activation, model-card or active-vocabulary promotion,
  push, or unsupported claim occurred;
- `pretrained_components: []`;
- changed files;
- exactly one next action.

Allowed next actions:

- `continue_detector0_strict_gate_contract_repair_no_brev` if the best next
  step is a local/no-spend/no-training repair to a concrete contract,
  threshold-accounting, or receipt issue found during triage.
- `continue_fail_closed_interactive_product_hardening` if Detector 0 local
  smoke evidence is not useful enough for the deadline and no immediate ML
  repair is justified.
- `continue_openai_or_gpt_pro_research` if the next Detector 0/model move would
  change architecture, input representation, training budget, source strategy,
  crop strategy, or another speculative ML direction after weak diagnostic
  evidence.
- `stop_for_human_budget_or_claim_review` if claims, spend, source scope,
  final-gate changes, or Detector 0/browser authority require human review.

## Session Log

Write:

`docs/session-logs/596-mission-3fs-detector0-strict-gate-metric-triage-no-brev.md`

The session log must record commands, evidence inspected, metric triage,
blocker classification, Brev default-off status, changed files, and exactly one
next action.

## Boundaries

- Local/no-spend/no-training only.
- No rerun of the M3FR smoke, recognizer smoke, evaluator run, local or remote
  training command, fitting, backward pass, optimizer step, checkpoint creation,
  threshold tuning for promotion, export, model-card promotion,
  active-vocabulary promotion, browser recognition activation, product-runtime
  mutation, runtime Detector 0 authority, final-readiness claim, trainability
  claim, or positive ASL correctness claim.
- No Brev start/exec/sync/copy/stop, remote dry-run, remote training, package
  install, duplicate worker, or GPU/cloud spend.
- No source-register edit, source/media import, manifest/tensor/packet/
  vocabulary mutation, raw learner video/frame upload, push, amend,
  destructive reset, or no-verify commit.
- No pretrained detector, landmark model, backbone, embedding, teacher logits,
  MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP, `from_pretrained`,
  `pretrained=True`, pseudo-labels, generated labels, or machine-generated
  landmarks in the promoted lane.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3FS.
2. Required local checks pass or record exact blockers.
3. The M3FR receipt/session log and M3FQ contract are consumed as source
   evidence without rerunning the smoke.
4. The triage classifies strict-gate metrics, threshold accounting, local
   diagnostic FP05 threshold, blocker categories, claim boundaries, and whether
   any no-training local contract repair exists.
5. Claim surfaces remain fail-closed.
6. No forbidden Brev, source, training, evaluator, export, promotion, browser
   activation, or unsupported claim work occurred.
7. A tracked receipt and numbered session log exist and select exactly one next
   action.

## Observer Guidance

- CONTINUE if the executor keeps the work local/no-spend/no-training, produces
  a bounded metric triage with clear blocker classification, preserves
  fail-closed claims, and selects one allowed next action.
- NUDGE if it misses strict-gate metric accounting, comparison to M3FQ, blocker
  classification, forbidden-action proof, changed-file accounting, or exactly
  one next action.
- REDIRECT if it reruns the smoke, attempts training/evaluation/Brev/export/
  promotion/browser activation/source import, weakens gates, or expands claims.
- ESCALATE if the next Detector 0/model move would be speculative after this
  weak local smoke and no current research memo covers it.
- STOP if the next meaningful step requires human budget, source, claim, or
  Detector 0/browser authority approval.
