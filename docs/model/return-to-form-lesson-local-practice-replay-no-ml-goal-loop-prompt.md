# Return-To-Form Lesson Local Practice Replay No-ML Goal Loop Prompt

Mission 3BM prompt for the Codex executor after Mission 3BL selected
`escalate_strategy_research` and the observer API strategy memo recommended a
bounded no-compute product slice.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Complete exactly one local/no-spend, no-ML `/lesson` product slice: a
browser-local practice/replay loop that lets a learner record a short bounded
in-session practice clip, replay it locally, retake it, and clear it.

The clip is for self-review or human/teacher review only. This mission must not
upload, persist, export, download, share, analyze, recognize, track, score, or
validate raw learner video. It must not run Brev, train, fit, mutate
manifests/tensors, import or approve sources, activate browser recognition,
enable Detector 0 tracking, change claim surfaces, promote final validation, or
claim ASL correctness.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. Observer strategy escalation:
   - [`artifacts/research/observer-357-post-semlex-strategy-api-response.md`](../../artifacts/research/observer-357-post-semlex-strategy-api-response.md)
   - [`docs/session-logs/357-observer-escalate-post-semlex-strategy.md`](../session-logs/357-observer-escalate-post-semlex-strategy.md)
4. M3BL source-register candidate evidence:
   - [`docs/research/semlex-source-register-candidate-no-import-v1.json`](../research/semlex-source-register-candidate-no-import-v1.json)
   - [`docs/session-logs/356-mission-3bl-semlex-source-register-candidate.md`](../session-logs/356-mission-3bl-semlex-source-register-candidate.md)
5. Current fail-closed product claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`web/public/model/claim-matrix.json`](../../web/public/model/claim-matrix.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
   - [`docs/validation/final-claim-matrix.json`](../validation/final-claim-matrix.json)
   - [`web/public/model/browser-model-bundle.json`](../../web/public/model/browser-model-bundle.json)
   - [`web/public/model/detector0-card.json`](../../web/public/model/detector0-card.json)
6. Existing lesson fail-closed audits:
   - `scripts/audit_lesson_fail_closed.mjs`
   - `scripts/audit_lesson_page_smoke.mjs`
   - `scripts/audit_avatar_no_recognition_claims.mjs`

## Current Evidence

M3BL closed the SemLex / ASL-LEX route for now. It found no usable repo-local
non-media metadata or phonology surface, kept ASL-LEX video use blocked,
confirmed SemLex is absent from the source register, made no source-register
edit, and selected `escalate_strategy_research`.

The observer escalation memo says the next non-wasteful mission is not Brev,
training, source approval/import, Detector 0/schema repair, vocabulary/data
repair, SemLex/ASL-LEX continuation, browser recognition activation, or STOP.
It recommends exactly one local-only fail-closed `/lesson` practice/replay
workflow that improves product usefulness without unsupported ML/source claims.

The browser model remains fail-closed: model card `not_trained`,
`activeLabels: []`, browser recognition disabled, Detector 0 `not_trained`,
Detector 0 tracking disabled, and box-driven avatar disabled.

## Required Slice

Complete the smallest useful local-only practice/replay loop on `/lesson`.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
python3 -m json.tool docs/research/semlex-source-register-candidate-no-import-v1.json
```

Do not run Brev commands in this mission.

2. Inspect the current `/lesson` route and existing camera/fail-closed
patterns before editing.

3. Implement exactly one bounded `/lesson` interaction:

- start or reuse the local browser camera preview;
- record a short bounded in-session practice clip;
- replay that clip locally in the browser;
- retake and clear the clip;
- degrade safely if camera or `MediaRecorder` is unavailable.

4. Keep learner video local and ephemeral:

- no server upload or API submission;
- no WebSocket/video streaming;
- no `fetch`/XHR carrying video/blob data;
- no persistence to `localStorage`, `IndexedDB`, Cache API, filesystem, or
  download/export/share path;
- no model inference, recognition, tracking, scoring, validation, or
  correctness judgment over the clip.

5. UI copy must be explicit and localized to the affected lesson surface:

- recognition is not running;
- tracking is not running;
- the app does not judge ASL correctness;
- the recording is for self-review or human/teacher review only.

Do not add broad marketing copy, source claims, or final-readiness language.

6. Produce a receipt:

`docs/validation/return-to-form-lesson-local-practice-replay-no-ml-v1.json`

The receipt must include:

- selected product scope and why it is one reviewable slice;
- files changed;
- claim-surface hashes before/after or verified unchanged hashes;
- privacy proof for no upload, no persistence, no export/share/download;
- fail-closed proof for recognition/tracking/correctness;
- browser QA evidence for `/lesson`;
- tests/audits run and results;
- explicit non-promotion language;
- blockers, if any;
- exactly one next action.

7. Run validation appropriate to the touched surface. Minimum after any web
runtime change:

```sh
node scripts/audit_final_claim_matrix.mjs
node scripts/audit_lesson_fail_closed.mjs
node scripts/audit_avatar_no_recognition_claims.mjs
npm --prefix web run typecheck
npm --prefix web run build
```

Also add or update a focused test/static audit proving the recording path does
not upload, persist, export/share/download, or run recognition/tracking/scoring.
Refresh or audit the relevant `/lesson` smoke, and use browser verification for
the visible workflow when practical.

8. Select exactly one next action:

- `continue_no_ml_product_interactivity`: only if the local practice/replay
  loop is implemented, tested, and all fail-closed gates remain intact.
- `repair_privacy_or_fail_closed_regression`: if the implementation exposes
  upload, persistence, export/share/download, recognition, tracking, scoring,
  or gate weakening.
- `escalate_human_content_strategy`: if the product now needs teacher-provided
  lesson content or human review workflow decisions, without claiming dataset
  or source approval.
- `stop_until_supported_training_data_exists`: if no further product movement
  is possible without validated data/source/training evidence.
- `stop_for_lesson_local_practice_replay_blocker`: if the slice cannot be
  completed safely within no-ML local-only boundaries.

## Hard Boundaries

- No Brev login, worker inspection, worker stop/start/create/delete/reset, or
  paid compute.
- No training run, model fitting, optimizer/backward pass, checkpoint creation,
  sweep, calibration, threshold promotion, export, or paid retry.
- No manifest/tensor mutation, source import, source-register edit, source
  approval expansion, SemLex/ASL-LEX validation or training use, generated
  pseudo-labels, public dataset expansion, Detector 0/landmark revival, broad
  label run, ONNX export, model-card promotion, browser trained activation,
  final-readiness claim, threshold promotion, or final-gate weakening.
- No edits to `web/public/model/model-card.json`,
  `web/public/model/claim-matrix.json`,
  `docs/model/active-vocabulary-claim.json`,
  `docs/validation/final-claim-matrix.json`,
  `web/public/model/browser-model-bundle.json`, or
  `web/public/model/detector0-card.json`.
- No positive recognition/pass/fail outcome while the model remains
  `not_trained`.
- No raw learner video/frame upload, persistence, export, share, download, or
  correctness analysis.
- No push.

## Acceptance Criteria

This mission can close when:

1. The active prompt is this M3BM prompt and `GOAL.md` names Mission 3BM.
2. Exactly one `/lesson` local practice/replay interaction is implemented, or
   the receipt records a precise blocker.
3. Learner video remains local and ephemeral: no upload, API submission,
   WebSocket streaming, blob-bearing fetch/XHR, localStorage/IndexedDB/Cache
   API/filesystem persistence, download, export, or share path.
4. Recognition, tracking, scoring, validation, pass/fail, and ASL correctness
   remain unavailable and explicitly fail-closed in the UI.
5. Claim surfaces remain fail-closed and unchanged.
6. No training/fitting/checkpoint/Brev/source/export/browser-activation/final
   gate action occurs.
7. A tracked receipt under `docs/validation/` records implementation scope,
   changed files, claim-surface hashes, privacy/fail-closed proof, validation,
   non-promotion language, stop conditions, and exactly one next action.
8. Required audits, web validation, focused privacy/no-ML checks, browser QA
   when applicable, and `git diff --check` pass or record exact blockers.
9. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE only to another bounded fail-closed no-ML product interactivity
  slice or a human-content strategy escalation.
- STOP if the next action requires source approval, manual annotation/data
  collection, unsafe video upload/persistence/export, Brev, training, export,
  browser activation, product overclaims, final-gate changes, paid compute, or
  human-only product/content decisions.
- REDIRECT if the executor changes model-card/claim surfaces, implements
  positive recognition outcomes, enables Detector 0/box-driven avatar
  authority, persists/uploads learner recordings, or combines unrelated
  product surfaces into one broad slice.
- NUDGE if the implementation is in scope but lacks a receipt, focused
  privacy/no-ML check, relevant audit, browser evidence for visible changes, or
  exactly one next action.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3BM lesson local practice replay no-ML.
Completed:            <one local-only practice/replay slice or blocker>.
Evidence:             <receipt, commands, browser/audit evidence>.
Remaining:            <single next action>.
Blockers:             <none or exact product/privacy/model blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
