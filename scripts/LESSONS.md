# Scripts Lessons

Stable numeric lesson ids. Never reorder or reuse ids.

## template

```md
# 1. <lesson title>

date: YYYY-MM-DD
source slice: <brief/session>
source task: `MVP_TASKS.md#task-XXX`
anchors:
- `ARCHITECTURE.md#arch-...`

## context

## gotcha / pattern

## rule

## examples

## linked files
```

# 1. Avoid long-lived tail pipelines for rotating log watchers

date: 2026-05-24
source slice: M3d-fix + later singleton-loop cleanup
source task: interim mission 3d
anchors:
- `ARCHITECTURE.md#arch-principles`

## context

`scripts/watch_observer.sh` first ran `tail -n 0 -f "$file" | sed -u '...' &` and later wrapped that pipeline in a subshell. The first form hung on rotation; the subshell form fixed the hang but still allowed orphaned `tail -f` children to accumulate in real operator sessions.

## gotcha / pattern

For a watcher that rotates between files, a persistent `tail -f` process is harder to own than it looks: pipeline PIDs, subshell wrappers, process groups, and quiet logs can all leave child processes behind. The robust pattern here is polling file size and streaming only newly appended bytes.

## rule

Prefer a single-process polling loop for small rotating log files. Track the current byte offset, print `tail -c +"$((offset + 1))"` when the file grows, and reset the offset on rotation or truncation. This avoids persistent child processes entirely.

```bash
size="$(wc -c < "$file" | tr -d '[:space:]')"
if [ "$size" -gt "$offset" ]; then
  tail -c +"$((offset + 1))" "$file"
  offset="$size"
fi
```

## examples

`scripts/watch_observer.sh`; synthetic rotation proof in `docs/session-logs/020-mission-3d-rotation-fix.md`.

## linked files

- [`scripts/watch_observer.sh`](watch_observer.sh)
- [`docs/session-logs/020-mission-3d-rotation-fix.md`](../docs/session-logs/020-mission-3d-rotation-fix.md)


# 2. Re-run promote_source_curated_vocabulary after any vocabulary.ts edit

date: 2026-05-24
source slice: M2 slice 2 (SignHintMetadata schema) + M3 readiness slice
source task: `MVP_TASKS.md#task-018`, `MVP_TASKS.md#task-005`
anchors:
- `ARCHITECTURE.md#arch-active-module`
- `ARCHITECTURE.md#arch-data-provenance`
- `ARCHITECTURE.md#arch-vocab-hints`

## context

[`docs/review/final-vocabulary-review.json`](../docs/review/final-vocabulary-review.json) contains `vocabulary_source.sha256` — the SHA-256 of `web/src/lib/vocabulary.ts` at the moment of evidence generation. The downstream provenance audit chain (manifest export, decode replay, training, evaluation, ONNX export, model-card promotion, model-artifact audit, downstream provenance) all hash-verify against this evidence packet.

## gotcha / pattern

If `vocabulary.ts` changes (a new item, a typed import, a reformatted seed row) without re-running `scripts/promote_source_curated_vocabulary.mjs --write`, the next `audit_downstream_vocabulary_provenance.mjs` invocation fails with `vocabulary_review.evidence.sha256 mismatch`. The cascade is fast: every downstream artifact that embeds the evidence hash also goes stale.

## rule

After ANY edit to `web/src/lib/vocabulary.ts` — even if the change is non-semantic (an `import` line, a comment, an export keyword) — run:

```sh
node scripts/promote_source_curated_vocabulary.mjs --write
node scripts/audit_vocabulary_review.mjs
node scripts/audit_hint_pedagogy_review.mjs
node scripts/audit_downstream_vocabulary_provenance.mjs
```

Adding a new item also needs the structured-hint-metadata file refreshed if you want >= 10 populated entries.

## examples

M2 slice 2 (`docs/session-logs/006-mission-2-task-006-brev-scripts.md` "slice 2") had to chase this through the audit chain after adding `import SIGN_HINT_METADATA_JSON from "./sign-hint-metadata.json"` — the import alone changed the SHA.

## linked files

- [`scripts/promote_source_curated_vocabulary.mjs`](promote_source_curated_vocabulary.mjs)
- [`scripts/vocabulary_review_utils.mjs`](vocabulary_review_utils.mjs)
- [`web/src/lib/vocabulary.ts`](../web/src/lib/vocabulary.ts)
- [`docs/review/final-vocabulary-review.json`](../docs/review/final-vocabulary-review.json)


# 3. Refresh inherited root hash bindings when deriving manifests

date: 2026-05-25
source slice: docs/session-logs/185-return-to-form-decode-dataloader.md
source task: `MVP_TASKS.md#task-010`
anchors:
- `ARCHITECTURE.md#arch-data-provenance`
- `ARCHITECTURE.md#arch-crop-pipeline`
- `ARCHITECTURE.md#arch-training-pipeline`

## context

Mission 3AD derived return-to-form Tier 0 manifests from the existing PopSign
5-label diagnostic seed manifests.

## gotcha / pattern

Copying a manifest can preserve stale top-level hash references even when new
mission-specific bindings are current. The first M3AD generator pass refreshed
the `return_to_form_tier0.source_register` binding but left the inherited root
`source_register.sha256` unchanged, so the existing manifest validator failed
against the current register hash.

## rule

When deriving a manifest, update both the new mission binding and every
validator-owned root binding (`source_register`, source audit references,
vocabulary review references, crop config references) before running check-files
or dataloader validation.

## examples

`scripts/run_return_to_form_tier0_decode_dataloader.py` rewrites the root
`source_register` field and the M3AD binding before writing
`data/manifests/return-to-form-tier0/*.json`.

## linked files

- [`scripts/run_return_to_form_tier0_decode_dataloader.py`](run_return_to_form_tier0_decode_dataloader.py)
- [`docs/validation/return-to-form-tier0-decode-dataloader.json`](../docs/validation/return-to-form-tier0-decode-dataloader.json)

# 4. Read retained receipts by their committed schema, not by CLI summaries

date: 2026-05-25
source slice: docs/session-logs/187-return-to-form-tier0-learnability-smoke.md
source task: `MVP_TASKS.md#task-010`
anchors:
- `ARCHITECTURE.md#arch-data-provenance`
- `ARCHITECTURE.md#arch-training-pipeline`

## context

Mission 3AE consumed the retained M3AD decode/dataloader receipt while writing
the Tier 0 learnability smoke report.

## gotcha / pattern

The M3AD CLI summary prints `dataloader_batch_shapes`, but the committed
receipt stores those shapes under `manifests.<split>.dataloader_batch.regions_shape`.
Reporter scripts must read the retained JSON schema instead of assuming the CLI
summary shape is identical.

## rule

When a report depends on an earlier receipt, inspect the committed receipt keys
and support the retained schema directly. CLI summaries are convenience output,
not the artifact contract.

## linked files

- [`scripts/report_return_to_form_tier0_learnability.py`](report_return_to_form_tier0_learnability.py)
- [`docs/validation/return-to-form-tier0-learnability-smoke.json`](../docs/validation/return-to-form-tier0-learnability-smoke.json)

# 5. Tensor payload diagnostics must record the consumed key, not just tensor presence

date: 2026-05-25
source slice: docs/session-logs/188-return-to-form-tier0-remediation-diagnostic.md
source task: `MVP_TASKS.md#task-010`
anchors:
- `ARCHITECTURE.md#arch-crop-pipeline`
- `ARCHITECTURE.md#arch-training-pipeline`

## context

Mission 3AE-R diagnosed a failed 5-sign fixed-crop learnability smoke. The
M3AD tensors contained `rgb_regions` fixed-crop stacks and a `rgb_frames`
compatibility slice.

## gotcha / pattern

A tensor file can contain the intended payload and still feed the trainer a
different key. In the M3AE-R failure, `RawFrameClipDataset` delegated to a
loader that checked `frames`, `tensor`, then `rgb_frames`; it did not consume
`rgb_regions`.

## rule

Any tensor visual or remediation diagnostic must record both payload presence
and the exact key consumed by the training/evaluation loader. If `rgb_regions`
is present but not consumed, classify the next action as a tensor/preprocessing
contract fix before blaming model architecture or running another smoke.

## linked files

- [`scripts/analyze_rawframe_tensor_visuals.py`](analyze_rawframe_tensor_visuals.py)
- [`docs/validation/return-to-form-tier0-remediation-diagnostic.json`](../docs/validation/return-to-form-tier0-remediation-diagnostic.json)

# 6. Keep region-stack fixes compatible with existing RGB model inputs

date: 2026-05-25
source slice: docs/session-logs/190-return-to-form-tier0-tensor-contract.md
source task: `MVP_TASKS.md#task-010`
anchors:
- `ARCHITECTURE.md#arch-crop-pipeline`
- `ARCHITECTURE.md#arch-training-pipeline`

## context

Mission 3AE-F needed the rawframe trainer to consume the M3AD `rgb_regions`
stack without running a new training smoke or changing final gates.

## gotcha / pattern

The existing rawframe architectures expect 3-channel frame tensors after
`prepare_frames`, while the fixed-crop proof stores a 5D region stack
`T,R,H,W,C`. A direct loader switch to the 5D tensor would break the current
models; silently keeping `rgb_frames` would ignore the fixed-crop proof.

## rule

When adapting a region-stack payload to an existing RGB model input, make the
derivation named and auditable. `rgb_regions_grid_v1` consumes the ordered
`rgb_regions` stack, tiles regions into a deterministic RGB grid, and records
the region order and fallback behavior in
`docs/validation/return-to-form-tier0-tensor-contract.json`.

## linked files

- [`scripts/train_rawframe_model.py`](train_rawframe_model.py)
- [`scripts/audit_return_to_form_tier0_tensor_contract.py`](audit_return_to_form_tier0_tensor_contract.py)
- [`docs/validation/return-to-form-tier0-tensor-contract.json`](../docs/validation/return-to-form-tier0-tensor-contract.json)

# 7. A corrected tensor contract is necessary evidence, not a learnability proof

date: 2026-05-25
source slice: docs/session-logs/192-return-to-form-tier0-learnability-rerun.md
source task: `MVP_TASKS.md#task-010`
anchors:
- `ARCHITECTURE.md#arch-crop-pipeline`
- `ARCHITECTURE.md#arch-training-pipeline`

## context

Mission 3AE-G reran the bounded five-label Tier 0 smoke after the trainer began
consuming `rgb_regions` through `rgb_regions_grid_v1`.

## gotcha / pattern

Fixing the consumed tensor key removed the `rgb_frames` compatibility-slice
blocker, but the model still did not fit the small approved-source set:
`dad` and `grandpa` stayed at zero train recall, and validation stayed close to
random chance.

## rule

After a tensor-contract remediation, rerun the same bounded learnability smoke
before changing architecture, labels, crops, or calibration. If the corrected
path still fails train sanity, preserve the tensor-contract receipt as closed
evidence and return to crop/region/model remediation instead of expanding the
label set.

## linked files

- [`docs/validation/return-to-form-tier0-learnability-smoke-rerun.json`](../docs/validation/return-to-form-tier0-learnability-smoke-rerun.json)
- [`docs/validation/return-to-form-tier0-tensor-contract.json`](../docs/validation/return-to-form-tier0-tensor-contract.json)
- [`docs/model/return-to-form-plan.md`](../docs/model/return-to-form-plan.md)

# 8. Distinguish crop visibility from region-grid capacity

date: 2026-05-25
source slice: docs/session-logs/194-return-to-form-tier0-failure-remediation-triage.md
source task: `MVP_TASKS.md#task-010`
anchors:
- `ARCHITECTURE.md#arch-crop-pipeline`
- `ARCHITECTURE.md#arch-training-pipeline`

## context

Mission 3AE-H triaged the failed corrected-input Tier 0 smoke before another
training run.

## gotcha / pattern

Visible contact sheets can rule out obvious hand/head truncation without proving
that the model receives a learnable representation. `rgb_regions_grid_v1` tiles
five 96px regions into a 192x288 image that is then resized to 96x96; the
compact 3D model sees that as one ordinary RGB frame, not as named regions.

## rule

When crops are visibly coherent and the tensor contract is closed but train
sanity still fails, classify the next move as a bounded model/input-adapter
microprobe instead of more crop remediation or label expansion.

## linked files

- [`docs/validation/return-to-form-tier0-failure-remediation-triage.json`](../docs/validation/return-to-form-tier0-failure-remediation-triage.json)
- [`scripts/train_rawframe_model.py`](train_rawframe_model.py)
- [`docs/model/return-to-form-plan.md`](../docs/model/return-to-form-plan.md)

# 9. Shape-smoke configurable model heads before remote training

date: 2026-06-03
source slice: docs/session-logs/906-mission-3jb-landmark-pck-run1-brev.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-gpu-execution`

## context

The M3JB per-hand landmark trainer exposed `--heatmap-g`, but the first
w96/g48 Brev launch failed because the upsample stack overshot to a 64x64
feature map and the decoder reshaped it as 48x48.

## gotcha / pattern

Option parsing and py-compile are not enough for model-shape configuration.
When a CLI flag controls tensor geometry, run a minimal forward pass with the
exact intended dimensions before spending remote training time.

## rule

For heatmap, SimCC, region-stack, or adapter experiments, add a shape smoke to
the preflight evidence: instantiate the configured model, feed a zero batch with
the expected input geometry, and assert the emitted tensor dimensions match the
downstream decoder contract.

## linked files

- [`docs/validation/return-to-form-m3jb-landmark-pck-campaign-run1-w96-g48-fulltrain-brev-v1.json`](../docs/validation/return-to-form-m3jb-landmark-pck-campaign-run1-w96-g48-fulltrain-brev-v1.json)
- [`scripts/audit_m3jb_hand_state_tracker.mjs`](audit_m3jb_hand_state_tracker.mjs)

# 10. Hash actual remote cache filenames, not remembered names

date: 2026-06-03
source slice: docs/session-logs/907-mission-3jb-landmark-pck-run2-brev.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-gpu-execution`

## context

Run2 preflight initially checked `split.json` from memory, but the rebuilt
per-hand cache actually uses `splits.json`.

## gotcha / pattern

Remote preflight can fail for bookkeeping reasons even when the cache itself is
correct. Treat cache file names as current filesystem facts and list the cache
directory before asserting hashes.

## rule

For remote training preflight, capture a cache directory listing, then hash the
actual row/split artifacts by their observed filenames. Record the corrected
hash evidence in the receipt.

## linked files

- [`docs/validation/return-to-form-m3jb-landmark-pck-campaign-run2-w128-g64-fulltrain-brev-v1.json`](../docs/validation/return-to-form-m3jb-landmark-pck-campaign-run2-w128-g64-fulltrain-brev-v1.json)
- [`scripts/audit_m3jb_hand_state_tracker.mjs`](audit_m3jb_hand_state_tracker.mjs)

# 11. Compare augmentation runs against both running-best PCK thresholds

date: 2026-06-03
source slice: docs/session-logs/908-mission-3jb-landmark-pck-run3-brev.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-gpu-execution`

## context

Run3 added hard-geometry oversampling and mild affine/blur/noise augmentation
to the same w128/heatmap64 scratch landmark recipe that had improved in run2.

## gotcha / pattern

Validation can remain plausible while held-out eval-only PCK regresses. Run3's
best validation PCK@0.10 was `0.695100`, but eval-only held-out PCK regressed
to `0.734000` / `0.450600` versus run2's `0.749600` / `0.486700`.

## rule

For campaign runs, require both eval-only PCK@0.10 and PCK@0.05 to beat the
running best before labeling the run a win or queueing a nearby paid variant.
When both regress, record a no-clear-win receipt and refresh research guidance
before more Brev spend.

## linked files

- [`docs/validation/return-to-form-m3jb-landmark-pck-campaign-run3-w128-g64-hardgeomaug-fulltrain-brev-v1.json`](../docs/validation/return-to-form-m3jb-landmark-pck-campaign-run3-w128-g64-hardgeomaug-fulltrain-brev-v1.json)
- [`scripts/audit_m3jb_hand_state_tracker.mjs`](audit_m3jb_hand_state_tracker.mjs)

# 12. Audit research refreshes as hard next-action redirects

date: 2026-06-03
source slice: docs/session-logs/909-mission-3jb-post-run3-research-refresh.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-gpu-execution`

## context

The post-run3 research refresh selected local scratch residual heatmap
architecture work before another Brev run.

## gotcha / pattern

If the audit keeps pointing at the research-refresh token, the next executor can
repeat research or infer that a paid run is ready. The audit must record the
research artifacts and move `next_action` to the local preflight token.

## rule

When a research artifact selects a code preflight, add a first-class audit check
for the research receipt and update generated receipt state to the local action.
Keep the candidate Brev token separate until exact launch details are recorded.

## linked files

- [`docs/validation/return-to-form-m3jb-landmark-pck-research-refresh-after-run3-v1.json`](../docs/validation/return-to-form-m3jb-landmark-pck-research-refresh-after-run3-v1.json)
- [`scripts/audit_m3jb_hand_state_tracker.mjs`](audit_m3jb_hand_state_tracker.mjs)

# 13. Audit side-worktree architecture preflights by hash

date: 2026-06-03
source slice: docs/session-logs/910-mission-3jb-resunet-architecture-preflight.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-handboxnet`
- `ARCHITECTURE.md#arch-gpu-execution`

## context

The ResUNet architecture preflight added code in the annotator side-worktree,
while the canonical M3JB audit receipt lives in the main repo.

## gotcha / pattern

A main-repo receipt can drift from side-worktree code if the audit only checks
that a JSON file exists. This is especially risky before a paid Brev run because
the remote command may train code different from the reviewed preflight.

## rule

When a main audit depends on side-worktree model code, validate the side file
hash, the side smoke hash, the model architecture token, and the no-training
runtime boundary before advancing `next_action`.

## linked files

- [`docs/validation/return-to-form-m3jb-landmark-pck-resunet-architecture-preflight-v1.json`](../docs/validation/return-to-form-m3jb-landmark-pck-resunet-architecture-preflight-v1.json)
- [`scripts/audit_m3jb_hand_state_tracker.mjs`](audit_m3jb_hand_state_tracker.mjs)

# 14. Scheduler recipes need a no-Brev receipt preflight before paid training

date: 2026-06-03
source slice: docs/session-logs/920-mission-3jb-recognizer-transformer-run2-research-tuning.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-training-pipeline`

## context

The run2 recognizer Transformer learned but missed the verification gate, and
the research pass selected a run3 recipe that depends on warmup plus cosine
decay. The current trainer only has fixed-LR flags.

## gotcha / pattern

A scheduler choice is part of the training contract, not just a command-line
detail. If the trainer does not serialize scheduler config, LR trace, and
expected optimizer steps, the paid receipt cannot prove the intended recipe ran.

## rule

Before launching a paid scheduler-based training run, add fixed-default
scheduler flags and receipt fields locally, then run no-save checks that verify
dataset counts, no-limit command shape, LR trace, and expected step count.

## linked files

- [`docs/validation/return-to-form-m3jb-recognizer-transformer-run2-research-tuning-v1.json`](../docs/validation/return-to-form-m3jb-recognizer-transformer-run2-research-tuning-v1.json)
- [`artifacts/research/m3jb-recognizer-transformer-run2-tuning-920/response.md`](../artifacts/research/m3jb-recognizer-transformer-run2-tuning-920/response.md)

# 15. Preserve zero-epoch trainer preflights when adding validation

date: 2026-06-03
source slice: docs/session-logs/921-mission-3jb-recognizer-transformer-lr-schedule-preflight.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-gpu-execution`
- `ARCHITECTURE.md#arch-training-pipeline`

## context

The recognizer scheduler preflight added warmup/cosine CLI validation to
`train_recognizer_distill.py`.

## gotcha / pattern

Remote CUDA preflights may intentionally run `--epochs 0 --no-save` to prove
cache/model load, device visibility, eval, and receipt boundaries before paid
training. A generic positive-epochs validation would break that preflight path
even though real training still uses positive epochs.

## rule

Reject negative epochs, but keep zero epochs valid for explicit no-save
preflight/load checks. Validate the preservation with a tiny `--epochs 0
--no-save` command after adding trainer argument checks.

## linked files

- [`docs/validation/return-to-form-m3jb-recognizer-transformer-lr-schedule-preflight-v1.json`](../docs/validation/return-to-form-m3jb-recognizer-transformer-lr-schedule-preflight-v1.json)
- [`scripts/audit_m3jb_hand_state_tracker.mjs`](audit_m3jb_hand_state_tracker.mjs)

# 16. Treat running-best recognizer gains below gate as research inputs

date: 2026-06-03
source slice: docs/session-logs/922-mission-3jb-recognizer-transformer-fulltrain-run3-scheduler.md
source task: `GOAL.md` Mission 3JB
anchors:
- `ARCHITECTURE.md#arch-no-pretrained`
- `ARCHITECTURE.md#arch-gpu-execution`

## context

Recognizer run3 improved verification recall@FAR10 versus run2 and the GRU
baseline, but still missed the `>=0.85` MVP gate.

## gotcha / pattern

An improved metric is not a promotion signal when the primary gate is still
missed. It is evidence for the next tuning decision.

## rule

Keep browser/runtime promotion fail-closed until the primary verification gate
passes. For running-best-but-below-gate training runs, record hashes/teardown and
route the next slice through research-guided tuning before spending on another
full run.

## linked files

- [`docs/validation/return-to-form-m3jb-recognizer-transformer-fulltrain-run3-scheduler-brev-v1.json`](../docs/validation/return-to-form-m3jb-recognizer-transformer-fulltrain-run3-scheduler-brev-v1.json)
- [`scripts/audit_m3jb_hand_state_tracker.mjs`](audit_m3jb_hand_state_tracker.mjs)
