# 001 — Stage A / MediaPipe vestige removal

Task: [`task-026`](../../MVP_TASKS.md#task-026)
Anchors: [`#arch-no-pretrained` (`Stage A vestige` subsection)](../../ARCHITECTURE.md#arch-no-pretrained), [`#arch-forbidden-shortcuts`](../../ARCHITECTURE.md#arch-forbidden-shortcuts)
Decision basis: [`DECISIONS.md` round-001 "strict no-pretrained promoted lane; Stage A is vestige"](../../DECISIONS.md)
Author: orchestrator round 001 (2026-05-23)
Recommended execution: spawn into a separate session/worktree so the diff is reviewable in isolation.

## goal

Remove every MediaPipe-bound code path, runtime asset, manifest, artifact, and disclosure doc from the repo so the `#arch-no-pretrained` invariant can pass on the *promoted* lane by **artifact-provenance scan**, not just by import-scan.

After this brief is executed, the *only* recognition path in the repo is the rawframe DNN (random-init, `not_trained` today, to be trained on Brev with first-party data in a subsequent round).

## scope summary

| dimension | quantity | notes |
|---|---|---|
| web/ source files to delete | 3 | `web/src/asl/stageARecognizer.ts`, `web/src/asl/extract/mediapipeHandExtractor.ts`, `web/src/asl/features/types.ts` (if MediaPipe-typed) |
| web/ runtime assets to delete | ~10 | `web/public/models/mediapipe/` tree (~12MB hand_landmarker.task + WASM blobs) |
| web/public/model/ Stage A verifier JSONs to delete | 12 | `stage-a-smoke-*.verifier.json`, `stage-a-target-verifier-status.json`, `stage-a-teacher-*.verifier.json` |
| npm dependency to drop | 1 | `@mediapipe/tasks-vision@0.10.35` from `web/package.json` |
| artifacts/stage_a/ to archive out of tree | ~2.6 GB | all teacher-frontier + smoke + feature_cache_v0 |
| artifacts/stage_b/ to archive out of tree | ~349 MB | supervision manifests reference MediaPipe extractor |
| scripts/ to delete or archive | ~35 | every `*stage_a*`, `*primarymath_keypoint*`, `*landmark*`, `*mediapipe*`, `*hand_only*`, `*hand_roi*`, `*teacher*` script |
| docs/ to delete or reframe | ~25 | `docs/model/mediapipe_tasks_vision_disclosure.md`, `docs/research/*mediapipe*`, `docs/research/*hand-only*`, etc. |
| audit script to tighten | 1 | `scripts/audit_no_pretrained_artifact_json.mjs` must reject any `extractor: { name: "mediapipe_*" }` after this round |
| validation artifact to produce | 1 | `docs/validation/no-pretrained-lane-audit.json` |

## detailed file inventory

> All paths are repo-root-relative. **Do not delete anything not on this list without flagging it first.** When in doubt about a file the brief did not anticipate, mark it for review rather than `git rm`.

### A) Web app changes

1. `web/package.json` — remove `@mediapipe/tasks-vision` from `dependencies`; run `npm install --prefix web` to regenerate `web/package-lock.json`.
2. `web/src/asl/extract/mediapipeHandExtractor.ts` — `git rm`.
3. `web/src/asl/stageARecognizer.ts` — `git rm`.
4. `web/src/asl/features/types.ts` — read first; delete only if it is MediaPipe-typed. If it has unrelated types, keep and excise MediaPipe imports.
5. Any remaining file under `web/src/asl/` that imports from `@mediapipe/tasks-vision` or from the deleted files — adjust imports.
6. `web/src/lib/client-model.ts` — read carefully. The function `evaluateLocalAttempt` currently calls into `stageARecognizer.evaluateStageAAttempt` (via `hasStageALane`). Rewrite to:
   - Remove the Stage A code path entirely (no `hasStageALane`, no `evaluateStageAAttempt`).
   - Until rawframe is `trained`, `evaluateLocalAttempt` returns the existing fail-closed result `{ passed: false, hint: <stable copy>, reason: "model_not_trained" }`.
   - Preserve `loadModelCard`, `sampleVideoFrame`, `expectedFrameCount`, `expectedImageSize` — they are reused by the rawframe path.
7. `web/src/components/PracticeApp.tsx` — read. If it references Stage A by name (it likely does for hint/result copy), update to the fail-closed copy from `model-card.json`.
8. `web/public/models/mediapipe/` — `git rm -r` the entire tree (hand_landmarker + tasks-vision-wasm + manifest.json).
9. `web/public/model/stage-a-*.verifier.json` (12 files) — `git rm`.
10. `web/public/model/stage-a-target-verifier-status.json` — `git rm`.

### B) Scripts to delete or archive

`git rm` every script whose subject is Stage A teacher frontier, primarymath keypoint lane, MediaPipe landmark extraction, hand-only tier-1 manifests, or hand ROI decoding. Exact list (sorted; verify before deletion):

```
scripts/analyze_asl_mediapipe_label_overlap.py
scripts/analyze_stage_a_teacher_75_frontier.py
scripts/audit_academic_benchmark_summary.mjs
scripts/audit_academic_delivery_package.mjs
scripts/audit_asl_citizen_primarymath_roi_review_handoff.mjs
scripts/audit_asl_citizen_primarymath_roi_review_packet.mjs
scripts/audit_canonical_verifier_collection_readiness.mjs
scripts/audit_primarymath_keypoint_tier_ladder.mjs
scripts/audit_primarymath_sparse_label_remediation_queue.mjs
scripts/audit_stage_a_*.mjs  # all of them
scripts/classify_hand_only_overlap_subset.py
scripts/decode_hand_roi_tensors.py
scripts/evaluate_primarymath_keypoint_dtw_baseline.py
scripts/evaluate_primarymath_keypoint_template_baseline.py
scripts/export_asl_citizen_hand_only_tier1_manifests.mjs
scripts/export_popsign_hand_only_tier1_manifests.mjs
scripts/export_primarymath_keypoint_tier1_manifests.py
scripts/export_stage_a_relaxed_lane_scaffold.mjs
scripts/extract_manifest_helper_features.py
scripts/package_stage_a_*.mjs  # all of them
scripts/run_stage_a_extractor_smoke.mjs
scripts/search_stage_a_cached_label_frontier.mjs
scripts/train_manifest_helper_lstm_sequence_classifier.py
scripts/train_manifest_keypoint_lstm_sequence_classifier.py
scripts/audit_primarymath_frontier_23_dtw_summary.mjs
```

Run `git status` after `git rm` and `ls scripts/ | grep -iE 'stage_a|primarymath|keypoint|teacher|landmark|mediapipe|hand_only|hand_roi'` should return empty.

### C) Scripts to tighten (do NOT delete)

1. `scripts/audit_no_pretrained_artifact_json.mjs` — extend the scanner so it rejects any `extractor: { name: "mediapipe_*" }` or `extractor.tasks_vision_version` field anywhere under `artifacts/`, `web/public/model/`, `docs/validation/`. Today this passes because the disclosed boundary was tolerated; after vestige removal, any reappearance is a regression.
2. `scripts/audit_no_pretrained_deps.mjs` — verify it still scans `web/package.json`. After step A1, this should be green.
3. `scripts/audit_guardrail_negative_fixtures.mjs` — read first; if it references Stage A verifier shapes, update to rawframe shape. Keep the negative-fixture chain.
4. `scripts/audit_model_artifacts.mjs` — read; ensure `--require-trained` mode does not depend on Stage A verifier JSONs.
5. `scripts/audit_final_claim_matrix.mjs` — read; the final claim matrix today references `primarymath-high-support-22-keypoint-dtw`. Reframe to point at the rawframe lane's `not_trained` state until training completes.
6. `scripts/run_browser_onnx_wiring_smoke.mjs` — read; if it imports from `stageARecognizer` or anything in the deleted asl/ tree, fix imports.

### D) docs/ changes

Delete (vestige disclosure / Stage A specific):

- `docs/model/goal.md` — Stage-A-era master goal; superseded by [`GOAL.md`](../../GOAL.md) at repo root. Confirm via `diff GOAL.md docs/model/goal.md` that nothing useful was lost before deleting.
- `docs/model/mediapipe_tasks_vision_disclosure.md`
- `docs/research/asl-mediapipe-hand-only-127-subset.md`
- `docs/research/asl-mediapipe-label-overlap.md`
- `docs/research/hand-only-scale-up-plan.md`
- `docs/research/popsign-v1-source-review.md` (read first — keep if still relevant as a research reference; delete if it claims PopSign for training)

Reframe (still relevant, but Stage A references must be removed):

- `docs/strategy-confidence-audit.md` — find every Stage A / MediaPipe mention; replace with "vestige removed in round 001 task-026" or delete the obsolete gate rows.
- `docs/execution-plan.md` — reframe the current-validated-claim language; the rawframe lane is now the only lane.
- `docs/acceptance-checklist.md` — same treatment.
- `docs/no-pretrained-audit.md` — update to reflect that the audit is now both deps-level + artifact-JSON-level + the new `docs/validation/no-pretrained-lane-audit.json` receipt.
- `docs/model/dataset-and-training-plan.md` — rewrite to remove Stage A trajectories.
- `docs/model/dataset-source-register.md` and `dataset-source-register.json` — remove any source entry that was admitted only for the MediaPipe-bound lane; preserve first-party + cleared sources.
- `docs/model/landmark_feature_schema_v1.json` — delete.
- `docs/model/stage_b_signal_schema_v1.json` — delete (was MediaPipe-bound).
- `docs/model/rawframe-*.md` — read; should be safe to keep, but verify no Stage A cross-refs.
- `docs/review/operator-handoff.md` — find Stage A references and remove.
- `docs/validation/academic-benchmark-summary.json` — delete or move to a clearly-marked deprecated subdir.

### E) artifacts/ changes

These are large (2.6 GB + 349 MB). Do **not** `git rm -r` blindly — instead:

1. `git rm -r --cached artifacts/stage_a/` — removes from tracking but leaves on disk in case the user wants to archive externally.
2. `git rm -r --cached artifacts/stage_b/` — same.
3. Add to `.gitignore`:
   ```
   artifacts/stage_a/
   artifacts/stage_b/
   ```
4. Leave `artifacts/rawframe-model/`, `artifacts/rawframe-model-clip-heldout/`, `artifacts/rawframe-model-diagnostics/` alone — those are the promoted lane.
5. Tell the user: 1398 currently-untracked `.landmarks.json` files in `artifacts/stage_a/feature_cache_v0/` are now correctly ignored after this change. They can be deleted from disk separately (`rm -rf artifacts/stage_a/ artifacts/stage_b/`) if storage is needed, or kept locally as historical record outside git.

### F) data/ changes

- `data/external/popsign-v1/raw/` — already gitignored; can stay on disk or be deleted by the user separately (37 GB total across `data/external/`). Not part of this brief.
- `data/manifests/` — read. If any manifest references the MediaPipe extractor (`grep -l mediapipe data/manifests/`), delete those manifests.
- `data/guardrail-negative-fixtures/` — keep; reusable by the rawframe lane.
- `data/asl-pilot-store.json` — already gitignored; this is the dev fallback store.

### G) configs/ changes

The plan-seeded `configs/` files (`active-sign-modules.example.json`, `model-manifest.example.json`, etc.) are templates for the rawframe lane. They do not reference MediaPipe; leave them alone. They will be bound to a real trained model after Brev training completes.

### H) New artifact to produce

After all of A–G are committed, generate `docs/validation/no-pretrained-lane-audit.json` by:

1. Running `node scripts/audit_no_pretrained_deps.mjs` and capturing its output.
2. Running `node scripts/audit_no_pretrained_artifact_json.mjs` (now tightened) and capturing its output.
3. Combining into a JSON receipt with shape:
   ```json
   {
     "audit": "no-pretrained-lane",
     "round": "001-task-026",
     "generated_at": "<iso8601>",
     "deps_audit": { "script": "scripts/audit_no_pretrained_deps.mjs", "passed": true, "evidence_hash": "<sha256-of-output>" },
     "artifact_json_audit": { "script": "scripts/audit_no_pretrained_artifact_json.mjs", "passed": true, "evidence_hash": "<sha256-of-output>" },
     "removed_vestige_summary": {
       "web_dependencies_dropped": ["@mediapipe/tasks-vision"],
       "web_assets_removed_tree": ["web/public/models/mediapipe/"],
       "web_verifier_jsons_removed": 12,
       "scripts_removed": "<list>",
       "artifact_dirs_untracked": ["artifacts/stage_a/", "artifacts/stage_b/"]
     }
   }
   ```
4. Bind into [`docs/validation/final-claim-matrix.json`](../../docs/validation/final-claim-matrix.json) by adding a `no_pretrained_lane_audit` field with the new receipt's SHA-256.

## execution order (recommended)

1. Open a new git worktree off the current branch: `git worktree add ../asl-pilot-task-026 -b task-026-stage-a-removal`
2. In that worktree, do steps A → G in this order, **committing between major groups** so the diff is reviewable. Use the heredoc commit-message template from [`docs/autonomous-orchestrator-protocol.md`](../autonomous-orchestrator-protocol.md):
   - commit 1: section A (web/ source + assets + package.json + lock)
   - commit 2: section B (script deletions)
   - commit 3: section C (tightened audits)
   - commit 4: section D (doc reframe)
   - commit 5: section E (artifacts untrack + gitignore)
   - commit 6: section F (manifest cleanup)
   - commit 7: section H (no-pretrained-lane-audit.json receipt)
3. After commit 7, run the full validation chain (next section). Any failure means a step was missed.
4. When green, PR back to `compound-plan-m0`. Leave the worktree until the PR is merged.

**Commit rules** (per [`docs/autonomous-orchestrator-protocol.md`](../autonomous-orchestrator-protocol.md)):
- `git add <specific paths only>` — never `git add -A` or `git add .` (would sweep in 1398 untracked Stage A cache files).
- Every commit message names `task: task-026`, `brief: docs/briefs/001-stage-a-vestige-removal.md`, anchors touched, and the validation result.
- Never `--no-verify`, never `--amend`. If a hook fails, fix and re-commit.
- Push only with explicit human go.

## acceptance criteria

- [ ] No `@mediapipe/*` dependency in `web/package.json` or `web/package-lock.json`.
- [ ] No file under `web/src/` imports from `@mediapipe/tasks-vision` or from any removed file.
- [ ] No file under `web/public/models/mediapipe/` exists.
- [ ] No `stage-a-*.verifier.json` under `web/public/model/`.
- [ ] No `extractor: { name: "mediapipe_*" }` field anywhere under `artifacts/` or `docs/validation/` (find via grep).
- [ ] `node scripts/audit_no_pretrained_deps.mjs` passes.
- [ ] `node scripts/audit_no_pretrained_artifact_json.mjs` (tightened) passes.
- [ ] `npm --prefix web run lint` passes.
- [ ] `npm --prefix web run typecheck` passes.
- [ ] `npm --prefix web run build` passes.
- [ ] `node scripts/audit_browser_onnx_wiring_smoke.mjs` passes (the runtime path no longer touches Stage A; rawframe ONNX still loads).
- [ ] `node scripts/run_practice_progress_smoke.mjs --write && node scripts/audit_practice_progress_smoke.mjs` pass — the fail-closed copy still saves attempts correctly when model is `not_trained`.
- [ ] `docs/validation/no-pretrained-lane-audit.json` exists, valid JSON, bound by SHA-256 into `docs/validation/final-claim-matrix.json`.
- [ ] `git status` is clean (no orphaned imports, no left-behind tracked Stage A files).

## landmines and known risks

1. **1321 already-tracked landmark cache files** under `artifacts/stage_a/feature_cache_v0/`. `git rm -r --cached artifacts/stage_a/` will produce a deletion diff of ~2.6 GB worth of file references. The actual files stay on disk until the user deletes them. This is the right behaviour but produces a large PR. Note this in the PR description.
2. **PracticeApp.tsx UI copy.** The hint and result copy on Stage A failures is more specific than the fail-closed `not_trained` copy will be. The product will visibly say "model not yet trained" until the rawframe Brev round completes. This is the honest state; preserve it.
3. **`scripts/audit_final_claim_matrix.mjs` may need new fixtures.** The current claim matrix asserts the `primarymath-high-support-22-keypoint-dtw` claim. After vestige removal that claim is invalid. Update the claim matrix to reflect the `not_trained` rawframe lane as the current honest state.
4. **`docs/strategy-confidence-audit.md`** is the most cross-referenced doc in the repo; edits ripple through other docs. Audit references with `grep -rn "strategy-confidence-audit" docs/` after editing.
5. **Do not accidentally delete `scripts/audit_no_raw_video_upload.mjs`, `scripts/audit_attempt_integrity.mjs`, `scripts/run_practice_progress_smoke.mjs`** or any privacy/auth scripts. They are lane-agnostic.
6. **Brev is not yet wired** ([`task-006`](../../MVP_TASKS.md#task-006)). This brief does not require Brev. Heavy training happens later.

## handoff to next round

After `task-026` lands:

- Mark `task-026` as DONE in [`MVP_TASKS.md`](../../MVP_TASKS.md).
- Update [`STAGE_GATE_STATUS.md`](../../STAGE_GATE_STATUS.md): close the Stage 2 bootstrap-commit checkbox and Stage 4 unblock note.
- Write [`docs/session-logs/002-stage-a-vestige-removal.md`](../../docs/session-logs/) summarizing actuals vs this brief, including any files that surprised you.
- The next ready task by priority: `task-005` (rawframe-lane active module) → `task-018` (hint metadata) → `task-006` (storage + Brev scripts) → `task-017` (typed inference interface).

— end brief 001 —
