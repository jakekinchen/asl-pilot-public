# Raw-Frame Model Goal Progress

Checked at: 2026-05-25T17:30:00Z

## Current State

Mission 3T closed the immediate Codex training-quality recovery slice after the
Brev execution lane succeeded but three no-pretrained PopSign rawframe variants
failed to generalize. The retained recovery diagnostic is
`docs/validation/rawframe-training-quality-recovery-diagnostic.json`. It records
all three Brev runs: compact 3D 5-epoch probe at best validation `0.00968421052631579`,
motion 2D 35-epoch probe at best validation `0.0648421052631579` with final
train `0.9953684210526316`, and clipnorm 3D 50-epoch candidate at best
validation `0.06989473684210526` with final train `0.9103157894736842`.
Smoke evaluation for the current clipnorm checkpoint remains non-promotable:
validation top-1 `0.06989473684210526`, validation macro-F1
`0.06234419828999084`, test top-1 `0.06814404432132964`, and test macro-F1
`0.05540080788433053`.

The current failure is now classified as a data/split generalization problem,
not a gross tensor-path issue. The refreshed tensor visual diagnostic
`docs/validation/rawframe-tensor-visual-diagnostic.json` reports
`passed_no_gross_tensor_issue` with 72 sampled clips, 12 inspected labels, and
no blockers or warnings. The refreshed split-shift diagnostic
`docs/validation/rawframe-split-shift-diagnostic.json` reports
`low_level_train_label_centroids_do_not_generalize_to_heldout_splits`, with
validation nearest-train-label-centroid accuracy `0.008771929824561403` and
test nearest-train-label-centroid accuracy `0.015789473684210527`.

The next action is data remediation before more training, not another blind
Brev run. The retained remediation plan
`docs/validation/rawframe-data-remediation-plan.json` is
`remediation_plan_ready_not_training_data` and the committed collection queue
`docs/validation/rawframe-remediation-collection-queue.json` is
`queue_ready_not_training_data` with 1,585 assignments across 100 labels, 80
priority labels, and 85 negative-challenge assignments. Its audit
`docs/validation/rawframe-remediation-collection-queue-audit.json` passes with
no findings. The queue is retained as planning evidence only after the
2026-05-25 user correction: the active route is not new browser-capture
collection. The remaining data-source blocker is explicit: approved PopSign-only
evidence failed to generalize, while NVIDIA ASL is not metadata-ready for
source-register review because the accepted access receipt and metadata-only
staging directory are absent.

The negative challenge path remains real and audited. The approved PopSign v1
train/validation/test route now uses all locally available approved PopSign
train and validation clips plus the uniform test floor: 25 clips per label for
train, 25 clips per label for validation, and 19 clips per label for test. That
gives 2,375 train clips, 2,375 validation clips, and 1,805 test clips across
the same 95-label vocabulary. The expanded manifests have decoded, hash-pinned
raw-frame tensors and pass full FFmpeg decode-provenance replay.

The remaining blocker is still model quality, not ingestion or source
provenance. The current files in `artifacts/rawframe-model/` reflect a
motion-temporal 2D CNN rerun with model-internal per-clip RGB standardization,
model-internal raw RGB frame deltas, basic augmentation, label smoothing, and
`best_validation` checkpoint selection. This is now the strongest held-out
top-1 candidate observed in the current family, with test top-1
`0.08919667590027701` and test macro-F1 `0.08252574184488487`, but it still
fails the final target gates by a wide margin. Its negative challenge
false-pass rate regressed to `0.3`, above the `< 0.05` target.

A stronger factorized 3D CNN path was added and verified, but the first uncapped
factorized candidate underperformed the compact model family. The compact mild
augmentation best-validation rerun also failed to beat the compact/basic family.
The final artifact contracts now allow the supported final raw-frame families,
`compact_3d_cnn_spatiotemporal`,
`compact_3d_cnn_spatiotemporal_clip_norm`,
`factorized_3d_cnn_spatiotemporal`, and `motion_2d_temporal_cnn`, while
preserving the no-pretrained and final-metric gates.

A materially different motion-temporal 2D CNN path is now implemented,
smoke-verified, and run as a non-smoke final-path candidate. It remains
from-scratch and raw-frame-only: per-clip/channel standardization and RGB frame
deltas are computed inside the model from the raw RGB tensor, then appearance
and motion frame encoders feed a temporal Conv1d head. The capped MPS smoke
train and smoke ONNX export under
`artifacts/rawframe-model-diagnostics/motion-temporal-smoke/` proved wiring
only. The non-smoke 50-epoch MPS run selected epoch 19 by validation accuracy
and overwrote the final artifact path with a real but failing candidate.

The canonical evaluation command has been rerun against the current
motion-temporal checkpoint, manifests, negative challenge manifest, and local ML
environment. It refreshed `artifacts/rawframe-model/validation-report.json` but
still failed all model quality targets, so no fresh calibrated provenance was
written and ONNX export correctly refuses to produce a final browser artifact
from stale/nonpassing calibration evidence.

A retained tensor visual diagnostic now checks the current train/validation/test
raw-frame tensor path. It sampled 72 hash-pinned tensors across 12 labels,
including zero-recall labels `apple`, `before`, `red`, and `water`, ran the same
`prepare_frames` preprocessing used by training/evaluation, and wrote retained
contact sheets. The diagnostic reports `passed_no_gross_tensor_issue` with no
blockers or warnings, so the current failure is not explained by a sampled
gross tensor-path, crop, blank-frame, or value-range issue.

A retained split-shift diagnostic now samples 1,710 hash-pinned tensors across
all 95 labels and train/validation/test splits, runs the same `prepare_frames`
preprocessing, and computes low-level raw RGB statistics without training a
model. It reports that nearest train-label centroids built from these low-level
features score `0.010526315789473684` on validation samples and
`0.014035087719298246` on test samples. The retained signal is
`low_level_train_label_centroids_do_not_generalize_to_heldout_splits`, so the
current blocker is not explained by a simple low-level RGB-statistics remedy.

A diagnostic PopSign label-ladder exporter is now retained. It writes
reduced-label diagnostic manifests for 5, 10, 25, 50, and 95 labels under
`data/manifests/diagnostics/popsign-label-ladder/`, selected from the current
failed 95-label validation report by validation/test recall and F1. The
diagnostic manifests preserve PopSign split boundaries and source evidence,
but intentionally remain smoke-only because reduced label sets do not carry the
full 95-label vocabulary-review evidence.

The first label-ladder training point has been run for the favorable 5-label
subset `table`, `dad`, `grandpa`, `please`, and `hat`. It is not final model
evidence. It reached validation top-1 `0.632`, validation macro-F1
`0.6291843475673263`, test top-1 `0.5157894736842106`, test macro-F1
`0.5134946403031508`, test false-pass rate `0.15789473684210525`, and
negative challenge false-pass rate `0.4` at selected threshold `0.72`. This
supports the reduced-scope diagnosis, but the 5-label upper-bound diagnostic
still fails the 70 percent validation and fail-closed rejection targets.

The second label-ladder training point has been run for the favorable 10-label
subset `table`, `dad`, `grandpa`, `please`, `hat`, `grandma`, `like`, `all`,
`bed`, and `say`. It is also non-final smoke evidence. It selected epoch 41 by
validation accuracy and reached validation top-1 `0.372`, validation macro-F1
`0.3627334036466333`, test top-1 `0.3736842105263158`, test macro-F1
`0.3711727362158396`, test false-pass rate `0.11578947368421053`, and
negative challenge false-pass rate `0.35` at selected threshold `0.75`. The
learning curve drops sharply from 5 labels to 10 labels, so the current
PopSign-only reduced-scope path does not look like a viable substitute for new
real browser-domain or approved external data.

The third label-ladder training point has been run for the favorable 25-label
subset. It remains non-final smoke evidence. It selected epoch 36 by validation
accuracy and reached validation top-1 `0.2048`, validation macro-F1
`0.19535746569735288`, test top-1 `0.2294736842105263`, test macro-F1
`0.22402026598808006`, test false-pass rate `0.12210526315789473`, and
negative challenge false-pass rate `0.25` at selected threshold `0.63`. This
extends the reduced-scope learning curve and reinforces that the PopSign-only
path is not closing the model-quality gap.

The fourth label-ladder training point has been run for the favorable 50-label
subset. It remains non-final smoke evidence. It selected epoch 23 by validation
accuracy and reached validation top-1 `0.1312`, validation macro-F1
`0.1180972168354442`, test top-1 `0.15052631578947367`, test macro-F1
`0.14255597925682625`, test false-pass rate `0.11473684210526315`, and
negative challenge false-pass rate `0.15` at selected threshold `0.53`. The
diagnostic curve is now complete through 50 labels and shows the same
same-family PopSign-only failure mode: strong train fit with weak held-out
signer generalization.

The final raw-frame pipeline preflight now has a diagnostic
`--skip-decode-replay` mode for blocker summaries. This does not weaken final
acceptance: the full FFmpeg decode-provenance replay is still required for a
final preflight pass, the full replay has a 45-minute timeout, and completion
readiness does not count a skip-decode diagnostic as final evidence.

The latest read-only completion summary reports 46 passed checks and 8 failed
checks without a live local production server. Guardrail negative fixtures pass
again, the retained post-collection operator-readiness report is current, the
practice-camera behavior smoke passes against the current 95-label prompt
order, and the final privacy smoke has retained static plus live HTTP evidence
from the last short-lived server run but is not reproducible without a running
server. The final raw-frame preflight and top-level completion audit recognize
that the active train/validation/test and negative-challenge manifests use the
approved external-source route, so first-party collection store/review packet
gates no longer block the current PopSign/online-negative manifest route. The
summary still fails closed on real final blockers, led by nonpassing
validation/calibration evidence, stale ONNX export provenance, a fail-closed
`not_trained` model card, missing final browser ONNX/compatibility evidence,
and intentionally incomplete final docs.

A retained failure analysis now quantifies the current PopSign-only model
failure. The selected motion-temporal checkpoint has a
`0.9094736842105263` final-train versus selected-validation accuracy gap, 33
zero-recall labels on validation, and 38 zero-recall labels on test. The
canonical evaluation report still retains per-signer held-out metrics:
validation has 8 held-out signers, with the lowest signer at 19/354 correct
(`0.05367231638418079` accuracy). This supports the current decision not to
continue small PopSign-only hyperparameter reruns by default.

A retained data-remediation plan now maps that failure analysis onto the current
95-label source-evidence problem and the retained split-shift diagnostic. It
keeps all 95 labels in scope, does not approve any source, and prioritizes
future approved raw-video evidence for 77 labels, including 18 labels with zero
recall on both validation and test. The operational collection queue remains
non-final planning evidence only; it must not drive the active route unless the
user later reauthorizes browser-capture data.

The online data-strategy pass is retained in
`docs/research/online-training-dataset-strategy.md`. It still approves no new
online training source. It first identified MS-ASL for focused review, and the
latest refresh retains a candidate-only NVIDIA ASL / ASL 1000 source-rights
review, access request packet, and external-rights receipt for human submission.
The current public-source evidence now includes the NVIDIA access page, AWS Open
Data Registry ASL 1000 controlled-access S3 entry, NVIDIA license/terms, and
public Trustworthy-AI ASL developer-pipeline docs. Only MS-ASL metadata and
public NVIDIA source/license/registry/pipeline pages were downloaded and
scanned; no MS-ASL or protected NVIDIA videos or metadata were imported into
training evidence.

The public source-research receipt has been expanded and refreshed with current
checks for 12 online ASL dataset pages/cards. It passes
`node scripts/audit_dataset_source_research.mjs` and keeps the source decision
unchanged: no new online training source is approved; NVIDIA / ASL 1000 remains
the best candidate-only access path; Purdue RVL-SLLL ASL remains
signed-license-required candidate-only; PopSign v2 remains unreleased; and ASL
Citizen, ASLLVD, How2Sign, OpenASL, WLASL, ASL-LEX, and the Hugging Face
`ZahidYasinMittha` dataset remain blocked or not approved for the current
raw-frame final model scope. The receipt is research evidence only and does not
authorize media import.

The source-register chain is current after that receipt refresh. The source
register now pins the refreshed public-source receipt and has SHA-256
`692bda5f3f891462ab066539c4bcb8a0cc55a6358ed03972299b8742c6515b1f`.
The active PopSign train/validation/test manifests and the external
negative-challenge manifest were refreshed to bind that current source-register
hash, and the strict final manifest audit passes again. Current manifest hashes
are:

| Manifest | SHA-256 |
| --- | --- |
| `data/manifests/train.json` | `1bf6e6a0b915f993e6a15a1512135b89fbf5548c922dd4c928383a9b9e0f47d3` |
| `data/manifests/validation.json` | `46954ae540315fbbd4b0be1f07a488c79f32a5b317765188044bf6a314680e75` |
| `data/manifests/test.json` | `c64ba5a067896a8dad84eeaa23dcd1c513820cb2ac6bfd729c3c3b420672228d` |
| `data/manifests/negative-challenge.json` | `29eb39735ceb85c82fa60b89bde9f9745dd8aa4c7783dfc45e2308f390b5eac7` |

The current training provenance and validation report have now been refreshed
against those manifest/source-register hashes. The retained calibrated
provenance is still stale/nonfinal because the refreshed evaluation failed final
quality gates, so final preflight still stops at the evaluation stage.

The focused MS-ASL review is now retained in
`docs/research/ms-asl-source-rights-review.md`, with a sampled URL probe at
`docs/research/ms-asl-availability-probe.json`. MS-ASL remains
`candidate_not_approved_for_training`. A full oEmbed availability probe of the
50-label candidate found 1,842 public rows out of 2,606 total rows, but only 14
labels still meet the 20 train / 5 validation / 5 test public-row floor. The
derived 14-label candidate is retained, but it is too small for the current
95-label final-model goal unless the project explicitly accepts a reduced pilot.

The first-party collection path was audited from the repository's own
collection-planning scripts. The planner can generate a source-curated
95-label capture plan with 20 signer aliases, 1,425 vocabulary assignments, and
20 negative-challenge assignments, but the local collection store does not
exist. Therefore first-party collection is a viable future data source only
after real consented browser recordings, signer registry records, and final clip
review evidence exist; it cannot improve the current model artifacts today.

The next data-path decision is now retained in
`docs/research/rawframe-data-decision.md`. It keeps the final model fail-closed,
refreshes the stale first-party collection plan for the current 95-label
vocabulary, and identifies controlled-access NVIDIA ASL / ASL 1000 as the
strongest newly identified online raw-video candidate for access and
source-rights review. No protected NVIDIA data was downloaded or imported. The
metadata-only audit gate now records the retained public-source evidence and
still fails closed because no accepted access receipt or metadata staging
directory exists. The NVIDIA metadata gate now also rejects copied templates or
unproven acceptance records by requiring `status: accepted_access_retained`,
hash-pinned license/terms references, operator/request fields, and at least one
hash-pinned accepted-access evidence attachment before any post-access metadata
can become source-register review input. A human-fillable NVIDIA access receipt
template is retained, but it is explicitly not accepted access evidence.
The next durable goal prompt for that path is now retained in
`docs/model/rawframe-nvidia-access-goal-loop-prompt.md`, authored with the
goal-builder skill structure. It keeps the future loop focused on human access
submission, accepted-access evidence, metadata-only staging, metadata audit, and
source-register readiness without allowing NVIDIA media or derived artifacts
into training before approval.

## Completed

- Confirmed that several obvious alternate ASL video sources remain weaker than
  the approved PopSign v1 route for this pilot:
  - How2Sign provides large raw RGB ASL video, but its project page says it is
    research-only / CC BY-NC 4.0 and it is continuous sentence data rather than
    isolated 95-label vocabulary clips.
  - OpenASL has raw-video download tooling, but its repository license is
    CC BY-NC-ND 4.0.
  - ASLLVD has ASL video data but its terms require permission for commercial
    uses and stronger source-rights review before this project can treat it as
    approved.
  - ASL Citizen remains blocked by the existing Microsoft Research license
    decision already retained in the source register.
  - PopSign ASL v2.0 appears in Georgia Tech repository records as a thesis/text
    artifact; no approved v2 raw-video dataset release was identified.
- Attempted a 25 clips per label per split PopSign expansion. The source could
  not satisfy that uniform count because `test/dog` topped out at 19 available
  videos after stream attempts.
- Added bounded stream retry support to `scripts/import_popsign_v1_raw_videos.py`
  so transient official-source archive timeouts can be retried without changing
  source policy.
- Wrote train/validation/test manifests at 19 clips per label per split:
  1,805 clips per split, 95 labels, source split boundaries preserved.
- Added split-specific PopSign import counts to
  `scripts/import_popsign_v1_raw_videos.py` so train, validation, and test can
  use different approved clip floors without weakening source/split policy.
- Wrote train/validation/test manifests at 25 train clips per label, 25
  validation clips per label, and 19 test clips per label: 2,375 train clips,
  2,375 validation clips, and 1,805 test clips across 95 labels.
- Decoded all expanded PopSign train/validation/test clips to raw RGB frame
  tensors and wrote tensor hashes plus FFmpeg decode provenance back into the
  manifests.
- Verified decode provenance replay for all 6,555 expanded PopSign clips.
- Ran the final manifest audit with train/validation/test plus negative
  challenge; status is `passed`.
- Added optional raw RGB train-time augmentation to
  `scripts/train_rawframe_model.py`: shared spatial jitter,
  brightness/contrast jitter, and small pixel noise. Validation/test/evaluation
  data remain unaugmented.
- Added `--label-smoothing` provenance support and a
  `factorized_3d_cnn_spatiotemporal` from-scratch raw-frame architecture that
  uses Conv3D/BatchNorm3D/ReLU operators and remains loadable by the existing
  evaluator/export path.
- Added `compact_3d_cnn_spatiotemporal_clip_norm`, a from-scratch compact 3D
  CNN variant that performs per-clip/channel RGB standardization inside the
  model before the Conv3D stack without adding manifest-level derived features.
- Added `--checkpoint-selection best_validation` support so future long runs can
  save the epoch with the strongest validation accuracy instead of always saving
  the terminal epoch. The selected epoch and selected validation metrics are
  retained in training provenance and checkpoint metadata.
- Dry-ran the factorized final invocation against the expanded manifests.
- Ran a capped smoke diagnostic for the factorized model into
  `artifacts/rawframe-model-diagnostics/factorized-smoke/`; it proved MPS
  execution and smoke provenance without touching final artifacts.
- Ran a capped checkpoint-selection smoke diagnostic into
  `artifacts/rawframe-model-diagnostics/checkpoint-selection-smoke/`; it proved
  `checkpoint_selection: best_validation`, `selected_epoch`, and selected
  validation metrics are written to both checkpoint and provenance.
- Trained and evaluated an uncapped 15-epoch factorized candidate on MPS. It
  failed final target gates and underperformed the prior compact candidate.
- Trained and evaluated an uncapped 50-epoch compact 3D candidate with mild raw
  RGB augmentation and `--checkpoint-selection best_validation`. It selected
  epoch 48, restored the final artifact path to the compact model family, but
  still failed final target gates.
- Trained and evaluated an uncapped 50-epoch compact 3D candidate with basic raw
  RGB augmentation and `--checkpoint-selection best_validation`. It selected
  epoch 49 and improved held-out test top-1 slightly, but still failed final
  target gates and regressed negative challenge false-pass behavior.
- Preserved the previous compact/basic candidate under
  `artifacts/rawframe-model-diagnostics/baseline-before-clip-norm-20260521T092915Z/`
  before overwriting the final artifact directory with the clip-normalized
  candidate.
- Trained and evaluated an uncapped 50-epoch compact clip-normalized 3D
  candidate with basic raw RGB augmentation, label smoothing `0.05`, and
  `--checkpoint-selection best_validation`. It selected epoch 43 and produced
  the strongest held-out top-1 in the current family, but still failed all final
  model-quality target gates.
- Confirmed ONNX export fails closed because calibrated provenance is missing or
  stale and does not prove `candidate_final_validation_passed`.
- Created the online dataset strategy prompt
  `docs/model/rawframe-online-dataset-strategy-goal-loop-prompt.md`.
- Researched current online ASL raw-video candidates and wrote
  `docs/research/online-training-dataset-strategy.md`.
- Downloaded only the official MS-ASL metadata ZIP into
  `artifacts/dataset-research/ms-asl/`, extracted it, and scanned label overlap
  with the current ASL Pilot vocabulary.
- Extracted the local C-UDA v0.1 PDF text with macOS PDFKit and recorded the
  relevant computational-use, output, and no-rights-warranty implications.
- Probed 15 sampled MS-ASL metadata URLs with `yt-dlp --simulate
  --skip-download`; 11 were public, 2 private, and 2 unavailable. No video bytes
  were downloaded.
- Added `scripts/export_msasl_pruned_vocabulary_candidate.mjs` and used it to
  write `docs/research/ms-asl-pruned-vocabulary-candidate.json`, a
  research-only 50-label candidate for the next full availability probe.
- Added `scripts/probe_msasl_candidate_availability.mjs` and used it to write
  `docs/research/ms-asl-pruned-vocabulary-availability-probe.json`, a
  research-only full oEmbed availability probe over the 50-label candidate.
- Added `scripts/export_msasl_availability_filtered_candidate.mjs` and used it
  to write `docs/research/ms-asl-availability-filtered-candidate.json`, a
  research-only 14-label candidate that retains only labels meeting the 20/5/5
  public-row floor.
- Ran the first-party collection planner in summary mode. It passed without
  writing a collection plan file and confirmed the current reviewed vocabulary
  gate is `source_curated`.
- Ran the first-party clip review, negative challenge review, and collection
  readiness audits. They fail closed because no local first-party collection
  store or final post-collection review evidence exists.
- Regenerated `data/dataset/collection-plan.json` for the current 95-label
  source-curated vocabulary. The previous local plan was stale for an 83-label
  vocabulary.
- Wrote `docs/research/rawframe-data-decision.md`, a retained decision matrix
  comparing first-party collection, NVIDIA ASL, MS-ASL reduced scope, PopSign
  v2, reduced pilot scope, and generated/synthetic media.
- Refreshed `docs/research/online-training-dataset-strategy.md` so NVIDIA is
  tracked as a candidate-only online source and MS-ASL is no longer the default
  next online path at the current 95-label scope.
- Expanded `scripts/refresh_dataset_source_research.mjs` and
  `scripts/audit_dataset_source_research.mjs` so the retained public
  source-research receipt covers 12 current online source pages/cards,
  including NVIDIA / ASL 1000, PopSign v2, ASL Citizen, ASLLVD, How2Sign,
  OpenASL, Purdue RVL-SLLL ASL, the Hugging Face `ZahidYasinMittha` dataset,
  WLASL, and ASL-LEX.
- Regenerated `docs/research/dataset-source-research-receipts.json`; it passes
  `node scripts/audit_dataset_source_research.mjs` with SHA-256
  `9cf6c7211b96eb5e8f06b6ccd3856424519cf2c5bd1edd05de43f8208731b42f`.
- Updated the source-register research-receipt hash binding and refreshed the
  PopSign import plan, active train/validation/test source-register pins,
  external negative-challenge manifest, negative-challenge tensors, final
  manifest audit, and post-collection status report to remove stale hash
  blockers introduced by the receipt refresh.
- Downloaded and hash-pinned public NVIDIA source/license pages under
  `artifacts/dataset-research/nvidia-asl/`; no NVIDIA dataset data, metadata,
  raw videos, derived images, landmarks, pose files, face-mesh files, or model
  artifacts were downloaded.
- Refreshed the NVIDIA source evidence with the current AWS Open Data Registry
  `ASL 1000` entry and public NVIDIA Trustworthy-AI ASL developer-pipeline docs.
  The AWS registry confirms the S3 resource is controlled access; the public
  developer docs confirm S3 video plus MediaPipe/SuperAnnotate derived outputs,
  so the raw-video-only boundary remains necessary.
- Wrote `docs/research/nvidia-asl-source-rights-review.md`, a candidate-only
  source-rights review that keeps NVIDIA out of manifests and training until
  access, accepted terms, metadata audit, and source-register approval exist.
- Wrote `docs/research/nvidia-asl-access-request-packet.md`, an operator packet
  for a human-submitted access request that preserves ASL Pilot's raw-video-only
  and no-pretrained constraints.
- Wrote `docs/research/nvidia-asl-external-rights-review-receipt.json`, a
  machine-readable candidate receipt with `candidate_not_approved_for_training`
  status.
- Wrote `docs/research/nvidia-asl-access-receipt.template.json`, a
  human-fillable receipt shape for the post-access metadata gate. The template
  keeps required commitments false/blank and does not satisfy the gate.
- Refined `docs/model/rawframe-data-decision-goal-loop-prompt.md` with the
  goal-builder skill structure so the next data loop treats NVIDIA evidence,
  decision status, acceptance criteria, and progress-ledger updates as
  first-class source-of-truth material.
- Refreshed `docs/model/rawframe-data-decision-goal-loop-prompt.md`,
  `docs/model/rawframe-model-quality-goal-loop-prompt.md`, and
  `docs/research/rawframe-data-decision.md` with the latest 25 train /
  25 validation / 19 test PopSign run evidence. The prompts no longer default
  to stale PopSign expansion advice and now point future work at first-party
  collection or NVIDIA access/source review unless a materially new
  generalization hypothesis appears.
- Added `scripts/audit_nvidia_asl_access_metadata.mjs`, a fail-closed
  post-access metadata audit for NVIDIA ASL. It checks for a human-retained
  access/license receipt, metadata-only staging, current vocabulary overlap,
  signer/split fields, raw-video path candidates, and disallowed derived/media
  files before any source-register approval work.
- Ran `node scripts/audit_nvidia_asl_access_metadata.mjs --write`; it wrote
  `docs/research/nvidia-asl-metadata-audit.json` with `blocked` status because
  `docs/research/nvidia-asl-access-receipt.json` and
  `artifacts/dataset-research/nvidia-asl/metadata/` are absent.
- Updated `scripts/audit_nvidia_asl_access_metadata.mjs` so the retained
  public-source evidence inventory is included in the audit output before any
  access-approved metadata or media staging can be considered.
- Hardened `scripts/audit_nvidia_asl_access_metadata.mjs` so a copied NVIDIA
  access receipt template cannot satisfy the post-access gate. The audit now
  requires receipt schema/source/status checks, access request and operator
  fields, hash-pinned license/terms references, and at least one hash-pinned
  accepted-access evidence attachment.
- Updated `docs/research/nvidia-asl-access-receipt.template.json`,
  `docs/research/nvidia-asl-access-request-packet.md`,
  `docs/research/nvidia-asl-source-rights-review.md`, and the online/data
  decision notes to preserve the stricter accepted-access receipt requirements.
- Regenerated `docs/research/nvidia-asl-metadata-audit.json`; it remains
  `blocked` because `docs/research/nvidia-asl-access-receipt.json` and
  `artifacts/dataset-research/nvidia-asl/metadata/` are still absent.
- Added diagnostic `--skip-decode-replay` support to
  `scripts/audit_final_rawframe_pipeline_preflight.mjs` so read-only blocker
  summaries can avoid the expensive full FFmpeg replay while marking the run
  ineligible for final acceptance. The normal final path still runs the replay
  and now has a 45-minute timeout instead of running indefinitely.
- Updated `scripts/audit_completion_readiness.mjs` so `--summary-only` calls
  the preflight with `--skip-decode-replay`, but never treats that diagnostic
  skip as a final preflight pass.
- Refreshed the canonical vocabulary review packet and reviewer workbook for
  the current 95-label vocabulary, preserving `needs_review` status for the
  optional external-review packet while keeping the source-curated final
  vocabulary evidence as the active gate.
- Updated `scripts/audit_guardrail_negative_fixtures.mjs` so collection-plan
  fixture probes also isolate the remediation queue, preventing the real
  nonfinal queue from masking draft bundle behavior. The old frame-mean
  architecture rejection fixture now accepts the current stricter
  final-training error text while still proving the old 2D baseline is rejected
  for final training.
- Updated `scripts/audit_guardrail_negative_fixtures.mjs` so the retained
  NVIDIA access receipt template rejection is part of the durable negative
  fixture suite, not only a one-off manual command.
- Added `docs/model/rawframe-nvidia-access-goal-loop-prompt.md` using the
  goal-builder skill structure. It is the durable next-loop prompt for NVIDIA
  access, accepted-access receipt retention, metadata-only staging, metadata
  audit, and source-register readiness after the PopSign-only model-quality
  route failed.
- Refreshed `docs/validation/post-collection-evidence-status.json`; it now
  passes its audit and reports `blocked_missing_collection_store` as the current
  nonfinal operator-readiness state.
- Refreshed `docs/review/operator-handoff.md` so its artifact hashes match the
  current 95-label vocabulary evidence, current collection plan, current smoke
  reports, and refreshed post-collection status.
- Updated the practice camera behavior smoke and audit so the next-prompt check
  proves that the visible prompt advanced to a different ASL prompt, instead of
  assuming the old second prompt was `Sign GOODBYE.`.
- Refreshed `docs/validation/practice-camera-behavior-smoke.json`; it now
  passes for the current prompt order with Playwright Chromium fake-media
  evidence and an isolated temporary store.
- Refreshed `docs/privacy/final-privacy-smoke.json` against a short-lived
  production server on `http://127.0.0.1:3025` with dataset collection disabled;
  static raw-upload checks and live HTTP checks passed.
- Updated `scripts/audit_final_rawframe_pipeline_preflight.mjs` so the
  `collection_store_and_returned_packets` stage is source-mode aware. It remains
  required for first-party manifests, but it is marked not required when all
  active final manifests use `approved_external_raw_video_source` with
  `external_dataset_import` evidence.
- Updated `scripts/audit_completion_readiness.mjs` so first-party dataset
  collection, clip review, and negative-challenge review checks do not fail the
  approved external-manifest route after strict manifest validation passes.
- Reran the canonical final evaluation command from the raw-frame preflight.
  It refreshed `artifacts/rawframe-model/validation-report.json` with
  `candidate_final_validation_failed`, test top-1 `0.06315789473684211`,
  test macro-F1 `0.059664305525834974`, test false-pass rate
  `0.1772853185595568`, negative challenge false-pass rate `0.35`, and
  `calibrated_provenance: null`.
- Reran `node scripts/analyze_rawframe_model_failure.mjs --write` and
  `node scripts/plan_rawframe_data_remediation.mjs --write` so retained
  diagnosis/remediation evidence points at the refreshed validation report.
- Updated `scripts/final_evidence_contract.mjs`,
  `scripts/audit_model_artifacts.mjs`, and
  `scripts/promote_trained_model_card.mjs` so final evidence gates accept either
  `compact_3d_cnn_spatiotemporal`,
  `compact_3d_cnn_spatiotemporal_clip_norm`, or
  `factorized_3d_cnn_spatiotemporal` as a final raw-frame architecture while
  still rejecting stale or nonpassing calibration evidence.
- Added `motion_2d_temporal_cnn`, a from-scratch raw-frame model family with
  model-internal per-clip/channel standardization, raw RGB frame-delta motion
  inputs, dual 2D frame encoders, and a temporal Conv1d head. The final
  evidence contract, model artifact audit, and model-card promotion gate now
  recognize it while preserving the no-pretrained and final target gates.
- Ran a capped MPS smoke train and smoke ONNX export for the motion-temporal
  architecture under
  `artifacts/rawframe-model-diagnostics/motion-temporal-smoke/`. The smoke
  artifacts prove wiring and provenance only; they are not final validation,
  calibration, or browser evidence.
- Preserved the previous compact clip-normalized candidate under
  `artifacts/rawframe-model-diagnostics/clip-norm-before-motion-temporal-20260521T105752Z/`
  before overwriting the final artifact directory with the motion-temporal
  candidate.
- Trained and evaluated an uncapped 50-epoch motion-temporal 2D CNN candidate
  on MPS with basic raw RGB augmentation, label smoothing `0.05`, and
  `--checkpoint-selection best_validation`. It selected epoch 19 and produced
  the strongest held-out top-1 and macro-F1 result in the current family, but
  still failed all final model-quality target gates and regressed negative
  challenge false-pass behavior.
- Confirmed ONNX export still fails closed because calibrated provenance is
  stale/nonpassing and does not match the current motion-temporal checkpoint.
- Added `scripts/analyze_rawframe_model_failure.mjs`, a retained diagnostic
  report generator that reads the current validation report, training
  provenance, and manifests without rerunning training or evaluation.
- Ran `node scripts/analyze_rawframe_model_failure.mjs --write`; it wrote
  `docs/validation/rawframe-model-failure-analysis.json` with
  `candidate_failed_analyzed` status.
- Added `scripts/plan_rawframe_data_remediation.mjs`, a planning tool that
  combines the failure analysis, first-party collection plan, and NVIDIA
  metadata-audit status into a retained data-remediation overlay without
  changing manifests, approving sources, or narrowing the 95-label scope.
- Ran `node scripts/plan_rawframe_data_remediation.mjs --write`; it wrote
  `docs/validation/rawframe-data-remediation-plan.json` with
  `remediation_plan_ready_not_training_data` status.
- Added `scripts/analyze_rawframe_tensor_visuals.py`, a retained diagnostic that
  samples manifest tensor paths, verifies tensor hashes, runs the same
  preprocessing as training/evaluation, and writes contact sheets without
  changing model artifacts.
- Ran `./.venv/bin/python scripts/analyze_rawframe_tensor_visuals.py --write`;
  it wrote `docs/validation/rawframe-tensor-visual-diagnostic.json` plus
  per-label contact sheets under
  `docs/validation/rawframe-tensor-visual-contact-sheets/` with
  `passed_no_gross_tensor_issue`, 12 labels inspected, 72 samples, no blockers,
  and no warnings.
- Added `scripts/analyze_rawframe_split_shift.py`, a retained diagnostic that
  samples approved raw-frame tensors across all labels and splits, verifies
  tensor hashes, runs the training/evaluation frame preparation path, and
  summarizes low-level RGB split/label shift without training or exporting a
  model.
- Ran `./.venv/bin/python scripts/analyze_rawframe_split_shift.py --write`; it
  wrote `docs/validation/rawframe-split-shift-diagnostic.json` with
  `split_shift_diagnostic_ready_not_training_data`, 1,710 sampled tensors,
  95 labels, 570 samples per split, validation nearest train-label centroid
  accuracy `0.010526315789473684`, and test nearest train-label centroid
  accuracy `0.014035087719298246`.
- Updated `scripts/plan_rawframe_data_remediation.mjs` so the retained
  remediation plan references the split-shift diagnostic and carries its
  low-level held-out generalization signal into the recommended sequence.
- Added `scripts/export_rawframe_remediation_collection_queue.mjs`, a queue
  exporter that sorts the existing first-party collection assignments by the
  retained remediation priorities while preserving all 95 labels and the
  planned signer-disjoint split layout.
- Ran `node scripts/export_rawframe_remediation_collection_queue.mjs --write`;
  it wrote `data/dataset/rawframe-remediation-collection-queue.json` with
  `queue_ready_not_training_data` status.
- Added `scripts/audit_rawframe_remediation_collection_queue.mjs`, a retained
  audit that checks the remediation queue against the current collection plan
  and data-remediation plan without creating clips, changing manifests, or
  approving sources.
- Ran `node scripts/audit_rawframe_remediation_collection_queue.mjs --write`;
  it wrote `docs/validation/rawframe-remediation-collection-queue-audit.json`
  with `passed_nonfinal_queue_audit` status and no findings.
- Updated the remediation queue exporter and audit so every queue row carries
  the collection-plan assignment key used by the browser capture UI.
- Updated the collection-session bundle generator and audit so the current
  remediation queue is hash-bound into the operator bundle as
  `remediation-collection-queue.csv`.
- Refreshed the remediation collection queue from the latest expanded
  train/validation motion-temporal failure analysis. It now prioritizes
  77 labels and keeps zero-recall labels first in capture ordering.
- Ran `node scripts/prepare_collection_session_bundle.mjs`; it refreshed
  `output/collection-handoff/collection-session-bundle` with `ready_for_capture`
  status for the current 95-label plan and priority queue.
- Ran `node scripts/audit_collection_session_bundle.mjs --require-ready`; it
  passed with no blockers.
- Updated `web/src/app/api/dataset/plan/route.ts` so explicit dataset
  collection mode returns the current remediation queue only when it is
  hash-bound to the active collection plan.
- Updated `web/src/components/DatasetCollectionPanel.tsx` so the browser
  assignment picker follows remediation queue order, loads the queue's first
  assignment by default, and keeps capture submissions bound to the original
  `vocabulary:N` / `negative_challenge:N` assignment keys.
- Updated `scripts/audit_collection_plan_contract.mjs` to assert the plan route
  exposes the remediation queue and the collection panel uses queue ordering.
- Rebuilt the web app and reran the dataset collection runtime smoke; the
  retained smoke report remains `smoke_only` and is not final dataset evidence.
- Added `scripts/export_popsign_label_ladder_manifests.mjs`, a diagnostic
  exporter for PopSign 5/10/25/50/95 label-ladder manifests selected from the
  current failed validation report. The exporter rebases raw video and tensor
  paths for the deeper diagnostic manifest directories and marks the outputs
  `diagnostic_not_final_model_evidence`.
- Ran `node scripts/export_popsign_label_ladder_manifests.mjs --write`; it
  wrote `docs/validation/popsign-label-ladder-manifests.json` and diagnostic
  manifests under `data/manifests/diagnostics/popsign-label-ladder/`.
- Verified all five diagnostic ladder sizes with
  `scripts/train_rawframe_model.py --dry-run --check-files
  --allow-small-label-set`, proving manifest contracts, split consistency, raw
  video existence, and raw video SHA-256 checks.
- Updated `scripts/evaluate_rawframe_model.py` so `--allow-smoke-eval` permits
  missing full-vocabulary review evidence only as a recorded smoke-only
  finality reason. Final evaluation still fails closed on missing
  `vocabulary_review`.
- Trained and evaluated the 5-label PopSign ladder diagnostic under
  `artifacts/rawframe-model-diagnostics/popsign-label-ladder/005-labels-motion-temporal/`.
  The run is smoke-only and failed target gates, with validation top-1 `0.632`,
  validation macro-F1 `0.6291843475673263`, test top-1
  `0.5157894736842106`, test macro-F1 `0.5134946403031508`, test false-pass
  rate `0.15789473684210525`, and negative challenge false-pass rate `0.4`.
- Trained and evaluated the 10-label PopSign ladder diagnostic under
  `artifacts/rawframe-model-diagnostics/popsign-label-ladder/010-labels-motion-temporal/`.
  The run is smoke-only and failed target gates, with validation top-1 `0.372`,
  validation macro-F1 `0.3627334036466333`, test top-1
  `0.3736842105263158`, test macro-F1 `0.3711727362158396`, test false-pass
  rate `0.11578947368421053`, and negative challenge false-pass rate `0.35`.
- Trained and evaluated the 25-label PopSign ladder diagnostic under
  `artifacts/rawframe-model-diagnostics/popsign-label-ladder/025-labels-motion-temporal/`.
  The run is smoke-only and failed target gates, with validation top-1
  `0.2048`, validation macro-F1 `0.19535746569735288`, test top-1
  `0.2294736842105263`, test macro-F1 `0.22402026598808006`, test false-pass
  rate `0.12210526315789473`, and negative challenge false-pass rate `0.25`.
- Trained and evaluated the 50-label PopSign ladder diagnostic under
  `artifacts/rawframe-model-diagnostics/popsign-label-ladder/050-labels-motion-temporal/`.
  The run is smoke-only and failed target gates, with validation top-1
  `0.1312`, validation macro-F1 `0.1180972168354442`, test top-1
  `0.15052631578947367`, test macro-F1 `0.14255597925682625`, test false-pass
  rate `0.11473684210526315`, and negative challenge false-pass rate `0.15`.

## Evidence

Manifest summaries:

| Split | Labels | Clips | SHA-256 | Source mode |
| --- | ---: | ---: | --- | --- |
| train | 95 | 2,375 | `1bf6e6a0b915f993e6a15a1512135b89fbf5548c922dd4c928383a9b9e0f47d3` | `approved_external_raw_video_source` |
| validation | 95 | 2,375 | `46954ae540315fbbd4b0be1f07a488c79f32a5b317765188044bf6a314680e75` | `approved_external_raw_video_source` |
| test | 95 | 1,805 | `c64ba5a067896a8dad84eeaa23dcd1c513820cb2ac6bfd729c3c3b420672228d` | `approved_external_raw_video_source` |
| negative_challenge | 95 | 20 | `29eb39735ceb85c82fa60b89bde9f9745dd8aa4c7783dfc45e2308f390b5eac7` | `approved_external_raw_video_source` |

Diagnostic PopSign label-ladder manifest summaries:

| Labels | Train clips | Validation clips | Test clips | Train SHA-256 | Validation SHA-256 | Test SHA-256 |
| ---: | ---: | ---: | ---: | --- | --- | --- |
| 5 | 125 | 125 | 95 | `33cce59de9ec362612e26fc8ec1a961189fbba57a80d399c04b6034c6668efa0` | `2adc34a22718536411528d6391529abca3afd7f8c193043976f5747a22c5c0cd` | `58a0d66dd0bb47a4f9fc9e80227374a27429be834224ea57b3303dc25d15d2be` |
| 10 | 250 | 250 | 190 | `67e52bc07c7cba7826f71b2c9e51d5ec0bf9dd4d3c9ae2b883699ed507de2988` | `a83db12cb0aaf3362875937f9fd7dbc7c87c83a7afef772a02399468010fa969` | `aef2292496da4e118c5dab88698363b3d9fe2e66fb260d126113b9e0cfffb4d6` |
| 25 | 625 | 625 | 475 | `67e2f7d4737e96f5703f5e9727a1fe7ba46937bdeb75427476a6171027673a5c` | `288a9e5438c07485984c338510ce1b0e2f2fc00ab1edbdb609d870c860fc3c40` | `50d9582901b40306bfce95c1b65b5b04e6b19eaf9b5c8a12bda4a4bfc6c384c0` |
| 50 | 1,250 | 1,250 | 950 | `a589fad97e2af2a864897c70bdc707b334e869cd17a40276fb00a73ccdccb02d` | `77762b6be9970f2336464f4933e890e31d62bb559302d74638f1c0d74977577c` | `8261968b704b77572ef274a193cc7ef01dc3b936e2f0c5e49a5adef4c862928f` |
| 95 | 2,375 | 2,375 | 1,805 | `ca419c4f95a195757887639f0f138b01596de3626768ed2def0048737d345261` | `b7c26be664c6b59ac3d8460cd54d34a8d5301a277c9985be3ffcb5ff702994e0` | `f026b6d14858b050a635772aa50feb30666a4fdd502e3fc16e3bbc2c2ac895d7` |

Current artifact hashes:

| Artifact | Path | SHA-256 |
| --- | --- | --- |
| Training script | `scripts/train_rawframe_model.py` | `0f08b479024ebbd9a3d9096397fbd144c53920c4c857479583c94d96fd0323fa` |
| Dataset/training plan | `docs/model/dataset-and-training-plan.md` | `261896a1470b619d07f2d2878359beb9f2caf1131caa0ca6d28b1e163ca9f825` |
| Rawframe manifest schema | `docs/model/rawframe-manifest-schema.md` | `b2baeb2187656221c4f22ed7d3c2077c5128c8e8e01a4f41c427bb98d894722f` |
| PopSign import script | `scripts/import_popsign_v1_raw_videos.py` | `c49ee23c1445acc5977c1583ff9438c1bb7b1c457097431cd84726c4a6f9b050` |
| Final manifest audit | `docs/validation/final-manifest-audit.json` | `3338bbb096edd9448f3575d7b7ef2acac4ed9d9695c3da74d802fe247850df10` |
| Final evidence contract | `scripts/final_evidence_contract.mjs` | `6b090d17fc02b08da377c8fc3a01442f6d55fc1b3cea61326ab21e503a8560c9` |
| Model artifact audit | `scripts/audit_model_artifacts.mjs` | `d03ab725085ad1a569a9a8160f260715a156a99c92b8a4cfb9b3803680875d8b` |
| Model-card promotion gate | `scripts/promote_trained_model_card.mjs` | `7a4048a0298dda230b7ddaabc5f9545085ff1233f75426df235419b6efe84d5d` |
| Local ML environment report | `docs/validation/local-ml-environment.json` | `cbf7656bf3dab074c94184fd899b14e4023545dc18e323e124ce37bf377ff0cd` |
| Final raw-frame pipeline preflight audit | `scripts/audit_final_rawframe_pipeline_preflight.mjs` | `8ad2d84aa243acd641a49c1176a4960c4901c10b3a7d33e23435e283443e177d` |
| Completion readiness audit | `scripts/audit_completion_readiness.mjs` | `5086c7477b8e56c2b6024528fe794c27772eeb93dcb97b78d3d1927659bee6fd` |
| Practice camera behavior smoke runner | `scripts/run_practice_camera_behavior_smoke.mjs` | `2b3e21b48cb7ab3068964a325bf8c40f03ee9c8dbcb2d36ca785a8b96cae7f59` |
| Practice camera behavior smoke audit | `scripts/audit_practice_camera_behavior_smoke.mjs` | `f20eaa9f1acace2ebce47ac5f268f0e01cabffb22ac8c81d878d8ca571aaa403` |
| Practice camera behavior smoke report | `docs/validation/practice-camera-behavior-smoke.json` | `add68ed11fb860260f745b00aaf31608e0475905ab971dcac5457f1a021042be` |
| Final privacy smoke report | `docs/privacy/final-privacy-smoke.json` | `3494cf077556265b1f011b2a4cb3c0dd13826ec2da5179a2a0d0fd15f52f1766` |
| Guardrail negative fixture audit | `scripts/audit_guardrail_negative_fixtures.mjs` | `2fccf9ea7b0dff7e05ee6e1378377508ab4651729020a3ee6979a691a006befd` |
| Vocabulary review workbook | `docs/review/vocabulary-review-workbook.md` | `f494f91ed413bca8373fe2d6370e39fd6b46f90215cf31d3aa222d3a28171162` |
| Post-collection evidence status | `docs/validation/post-collection-evidence-status.json` | `9ef29a2a562b49f65e62888a892a2ad3aa040f27ebaa088df5da1c218242e505` |
| Source-curated operator handoff | `docs/review/operator-handoff.md` | `7055ad770e4d59fb24cea3c25856d86365b1cfbaa2b400182ee18bc687b3f412` |
| Current checkpoint | `artifacts/rawframe-model/model_state.pt` | `b67ea1768323c5d868115877c595b53a764ce428cf951d88d7a984717082a68a` |
| Current training provenance | `artifacts/rawframe-model/training-provenance.json` | `f62e08f6443a999e36a16eaac1cdfd69ab91662d95834a8b51336676fe978ea9` |
| Current validation report | `artifacts/rawframe-model/validation-report.json` | `8ff8417201ae0fb3266b3adc105c2ce514380fb2422388f0fcc602d080d02ce9` |
| Current stale calibrated provenance | `artifacts/rawframe-model/calibrated-provenance.json` | `d411ec24a14ee189701b2d2c6ab7029160aaef98dbdb3709919109f89d2ab6d6` |
| PopSign label-ladder exporter | `scripts/export_popsign_label_ladder_manifests.mjs` | `91c3608512f22566b945cb1546fe560b3a14b716678215af8b43db748141ca46` |
| PopSign label-ladder manifest summary | `docs/validation/popsign-label-ladder-manifests.json` | `a7d9205465795c378a29ef0a0cdbeb8f69f0cb34ed67bf4d3ce9b7795493bb4a` |
| 5-label ladder diagnostic checkpoint | `artifacts/rawframe-model-diagnostics/popsign-label-ladder/005-labels-motion-temporal/model_state.pt` | `7482aa798ba11752ad9e402b5cc885bbd78eaf3232ce03b2ca6a9217ef31c80b` |
| 5-label ladder diagnostic training provenance | `artifacts/rawframe-model-diagnostics/popsign-label-ladder/005-labels-motion-temporal/training-provenance.json` | `c4b3dbc694396e8b6471bc6a2b04ff49aac503275327100d5099a353d63fb03b` |
| 5-label ladder diagnostic validation report | `artifacts/rawframe-model-diagnostics/popsign-label-ladder/005-labels-motion-temporal/validation-report.json` | `95b7e1dabe5faf74dc10c3eaa8da877f47296568f3deb5ceb0531d21ca277449` |
| 5-label ladder diagnostic calibrated provenance | `artifacts/rawframe-model-diagnostics/popsign-label-ladder/005-labels-motion-temporal/calibrated-provenance.json` | `d8593f5d46fc4cfc0f7d8d891ccde9d0a091c595cf1c15153b0198615015ebb7` |
| 10-label ladder diagnostic checkpoint | `artifacts/rawframe-model-diagnostics/popsign-label-ladder/010-labels-motion-temporal/model_state.pt` | `be10aa38ff52b604bac551c5a24816a36a7819445fe347bf41f4358cb1438a20` |
| 10-label ladder diagnostic training provenance | `artifacts/rawframe-model-diagnostics/popsign-label-ladder/010-labels-motion-temporal/training-provenance.json` | `c15d54d6ceeb4bc7df98b930aee7e3e0f272217313bc93d4ae7b59d43b016aec` |
| 10-label ladder diagnostic validation report | `artifacts/rawframe-model-diagnostics/popsign-label-ladder/010-labels-motion-temporal/validation-report.json` | `7b30ec4e2f8a25a336836a9c75a6e2967b32ac3c6af27489154163db3047ec2c` |
| 10-label ladder diagnostic calibrated provenance | `artifacts/rawframe-model-diagnostics/popsign-label-ladder/010-labels-motion-temporal/calibrated-provenance.json` | `d64216e1eb6efeb212628095fc1389a314cc111d902140bae9f8ca6937a456e2` |
| 25-label ladder diagnostic checkpoint | `artifacts/rawframe-model-diagnostics/popsign-label-ladder/025-labels-motion-temporal/model_state.pt` | `c2cd2e25d1aa5e9c428df70544c9884d8c2705db1890d41d073ec631302cd493` |
| 25-label ladder diagnostic training provenance | `artifacts/rawframe-model-diagnostics/popsign-label-ladder/025-labels-motion-temporal/training-provenance.json` | `7a344b8765e5616d3d1c1556f60b04c53d60d080ad492f639c5778a43b26b788` |
| 25-label ladder diagnostic validation report | `artifacts/rawframe-model-diagnostics/popsign-label-ladder/025-labels-motion-temporal/validation-report.json` | `4034df461da11502ea025abf5851e48fe7c1ca75c9210be341ad0668a1c87dec` |
| 25-label ladder diagnostic calibrated provenance | `artifacts/rawframe-model-diagnostics/popsign-label-ladder/025-labels-motion-temporal/calibrated-provenance.json` | `2b4a7aa8969483f6a51252039a18c86f90632b69b5f53d969f120a5a836ae2b1` |
| 50-label ladder diagnostic checkpoint | `artifacts/rawframe-model-diagnostics/popsign-label-ladder/050-labels-motion-temporal/model_state.pt` | `ebb0d9a8c2917efc9f58f5d5819e9d17ec1305cde1c2a27688db8cd6d65539a2` |
| 50-label ladder diagnostic training provenance | `artifacts/rawframe-model-diagnostics/popsign-label-ladder/050-labels-motion-temporal/training-provenance.json` | `426d5b7fea73e2bf1e4d3ed3951d297ddc0f62dd3e4f5f84970dbea89808d785` |
| 50-label ladder diagnostic validation report | `artifacts/rawframe-model-diagnostics/popsign-label-ladder/050-labels-motion-temporal/validation-report.json` | `22d6415264a7e6c0509eb385c0943701a9e5993662f44912e2cc3be8b33dd0a3` |
| 50-label ladder diagnostic calibrated provenance | `artifacts/rawframe-model-diagnostics/popsign-label-ladder/050-labels-motion-temporal/calibrated-provenance.json` | `4fa39b9b164844cf1c3c7763628f6377e286d58af68b2e2abb0474ae323f0e27` |
| Preserved pre-source-register-refresh candidate checkpoint | `artifacts/rawframe-model-diagnostics/pre-current-source-register-retrain-20260521T120209Z/model_state.pt` | `61b9c61e16605d4d2326c5a03da86bb9503a9760e756ccbd73e7beb11c8d3ac3` |
| Preserved pre-source-register-refresh candidate training provenance | `artifacts/rawframe-model-diagnostics/pre-current-source-register-retrain-20260521T120209Z/training-provenance.json` | `52537243135f2524d8bb75629097bc7e18cdc89b2d2ca509aa17212b86d2348c` |
| Preserved pre-source-register-refresh candidate validation report | `artifacts/rawframe-model-diagnostics/pre-current-source-register-retrain-20260521T120209Z/validation-report.json` | `b2d4efecd9bab852c1855a8f591650cc2406f372a5afff125947b513ede197d0` |
| Preserved clip-normalized checkpoint before motion-temporal run | `artifacts/rawframe-model-diagnostics/clip-norm-before-motion-temporal-20260521T105752Z/model_state.pt` | `a70173f7b6aed06e72d99f1d3bb920c168478125c652f22eeb116acf0755550a` |
| Preserved clip-normalized training provenance before motion-temporal run | `artifacts/rawframe-model-diagnostics/clip-norm-before-motion-temporal-20260521T105752Z/training-provenance.json` | `6b1c09ff0ad92eb48b0d56c7603281ae6b0c113d6c62684891b97d5e6b923cdf` |
| Preserved clip-normalized validation report before motion-temporal run | `artifacts/rawframe-model-diagnostics/clip-norm-before-motion-temporal-20260521T105752Z/validation-report.json` | `d17c7aa5bca52c6d0234e612528d1c60dbc3b26ba485c9254be83a68dca4b1a7` |
| Preserved clip-normalized calibrated provenance before motion-temporal run | `artifacts/rawframe-model-diagnostics/clip-norm-before-motion-temporal-20260521T105752Z/calibrated-provenance.json` | `d411ec24a14ee189701b2d2c6ab7029160aaef98dbdb3709919109f89d2ab6d6` |
| Preserved clip-normalized browser parity fixture before motion-temporal run | `artifacts/rawframe-model-diagnostics/clip-norm-before-motion-temporal-20260521T105752Z/browser-parity-fixture.json` | `52d1438516cb6f0e3363b1d38aca537738aa2cb999b53da7cfe1f6e45bdc2004` |
| Motion-temporal smoke checkpoint | `artifacts/rawframe-model-diagnostics/motion-temporal-smoke/model_state.pt` | `ae442076f02865ea3952987fed6e8067d80e98cf2399356fefca00693dc373da` |
| Motion-temporal smoke training provenance | `artifacts/rawframe-model-diagnostics/motion-temporal-smoke/training-provenance.json` | `6ebf052fac08de24bc310f0a3449c009a935175f63fe7d6549873260525e3afe` |
| Motion-temporal smoke ONNX | `artifacts/rawframe-model-diagnostics/motion-temporal-smoke/asl-pilot-motion-temporal-smoke.onnx` | `4135c2d762671d4b00c617dad3c4bc5b31f766609d0d3027ffde69d7d0a89f05` |
| Motion-temporal smoke export provenance | `artifacts/rawframe-model-diagnostics/motion-temporal-smoke/export-provenance.json` | `c221075af400663f1245b28cca3295c4b2619d9b30c6466ac5826130bc70a588` |
| Motion-temporal smoke parity fixture | `artifacts/rawframe-model-diagnostics/motion-temporal-smoke/parity-fixture.json` | `d450a5ff1372c58b72714bfa315ec2aa7c48a6c07bd1ccaf151e4bd81809e822` |
| Preserved pre-clip-normalization checkpoint | `artifacts/rawframe-model-diagnostics/baseline-before-clip-norm-20260521T092915Z/model_state.pt` | `b664cd919800e9acb322c47c94b8e645db32f31cb2a471e82cf3a4ef80caf7c4` |
| Preserved pre-clip-normalization training provenance | `artifacts/rawframe-model-diagnostics/baseline-before-clip-norm-20260521T092915Z/training-provenance.json` | `d6481ac1df730e6e874e44f0523e7d391811ad602a9c3bf0d05574281305921b` |
| Preserved pre-clip-normalization validation report | `artifacts/rawframe-model-diagnostics/baseline-before-clip-norm-20260521T092915Z/validation-report.json` | `719c8f3432fefca6e4cf09634863c847fc4f095270b1e2baece478010d8a539a` |
| Preserved pre-clip-normalization calibrated provenance | `artifacts/rawframe-model-diagnostics/baseline-before-clip-norm-20260521T092915Z/calibrated-provenance.json` | `d411ec24a14ee189701b2d2c6ab7029160aaef98dbdb3709919109f89d2ab6d6` |
| Evaluation script | `scripts/evaluate_rawframe_model.py` | `c241c82b12f737c7d3b310adbf216ec42987b45b70f91d2b1ad017e41524597c` |
| ONNX export script | `scripts/export_onnx_model.py` | `9872e96db565aa0b8bd51841eb5216395c61c30f1bd380e11d74cfc48499fa25` |
| Raw-frame failure analysis script | `scripts/analyze_rawframe_model_failure.mjs` | `2adea91e3f7ff3c29254b28a61b0ae3435f54ee8ca60beb4c50b086ec6c55d39` |
| Raw-frame failure analysis | `docs/validation/rawframe-model-failure-analysis.json` | `f2c0473d186a39ea5a45c2f1cf3349861def3398fd1c313bd9f393f9b1fd17f1` |
| Raw-frame data remediation planner | `scripts/plan_rawframe_data_remediation.mjs` | `d729200c492314ec318d75495ebb1f341149cef19d59c90984a8b8f32ded4ad2` |
| Raw-frame data remediation plan | `docs/validation/rawframe-data-remediation-plan.json` | `550b5a33ef31fe7873bf134505cc4aabcd0eea998131735d8467a16397976a72` |
| Raw-frame tensor visual diagnostic script | `scripts/analyze_rawframe_tensor_visuals.py` | `e67349069cc44879ab42956541ce01b443c1ef64dd41c8f9e50ef9c0ca57e2df` |
| Raw-frame tensor visual diagnostic | `docs/validation/rawframe-tensor-visual-diagnostic.json` | `045803f5284a041715533f6b2941f18e77bcab9b1a052eeb4a5149b68f6bcdda` |
| Raw-frame split-shift diagnostic script | `scripts/analyze_rawframe_split_shift.py` | `66c0d3eb8284104cb4c38a6da2da2483919a60f395ba39c1ad1e51d1649834eb` |
| Raw-frame split-shift diagnostic | `docs/validation/rawframe-split-shift-diagnostic.json` | `be5a13042bd275e7732084a9e0200c377df8cd06b9a44783ac9a25cd1788b2f8` |
| Raw-frame remediation collection queue exporter | `scripts/export_rawframe_remediation_collection_queue.mjs` | `530dac4d60d5a174197470670295086a547715ede02489d0f92d33a7a8a966aa` |
| Raw-frame remediation collection queue | `data/dataset/rawframe-remediation-collection-queue.json` | `eaaab49ca5750a4df9830c4a6471274e0ec28ac3c6a0a8dc9860814c9fe96d32` |
| Raw-frame remediation collection queue audit script | `scripts/audit_rawframe_remediation_collection_queue.mjs` | `69f34a5c29e277c69ce5d933c89a91ad8d04ad829ca38825f0b344d59c908d47` |
| Raw-frame remediation collection queue audit | `docs/validation/rawframe-remediation-collection-queue-audit.json` | `25113fa796b6483e316c511c655fd346a04d4297bacc19416a8bb5b7cc07e191` |
| Collection-session bundle generator | `scripts/prepare_collection_session_bundle.mjs` | `1ed2d8afe51b610225b905c96c1f3962f1e261e482a469a436a45c84ce7244b6` |
| Collection-session bundle audit | `scripts/audit_collection_session_bundle.mjs` | `80e97ecde0497803b8b61808531094a1fe1737007db7b6ca9cd22ced4c67e1b9` |
| Current collection-session bundle manifest | `output/collection-handoff/collection-session-bundle/MANIFEST.json` | `3f5231c09509ccce727d9d705b6ecba6a9b5b569d0f6d09a815160443cfb6550` |
| Current remediation queue CSV | `output/collection-handoff/collection-session-bundle/remediation-collection-queue.csv` | `09049dec1d2fc32cb8b4615e7f3adbba88b0169ba81ad4230013a91fd465b9b2` |
| Collection plan API route | `web/src/app/api/dataset/plan/route.ts` | `8343bad02cbaaea4002e78e31b420d20413c5f5ea0f2bb71a2f090f3e6220f2f` |
| Dataset collection panel | `web/src/components/DatasetCollectionPanel.tsx` | `1d00d80d7383fe95d5d02f178fb16febebbfd6a4983398c3483e1ecc8a268970` |
| Collection plan contract audit | `scripts/audit_collection_plan_contract.mjs` | `4043e0ea99a5b7ec3e215973876131e4d8f44603c7cbe0fb7124bed8c169e94b` |
| Dataset collection runtime smoke report | `docs/validation/dataset-collection-runtime-smoke.json` | `74cec3aa6fbb7ef022322279b654114eb447e054459f57ff630201a54e3197ba` |
| Online training dataset strategy | `docs/research/online-training-dataset-strategy.md` | `3ce02247c3262519b20cbed1a23f432903c8ebd01d98050db2389d0cd3dff727` |
| Raw-frame data decision prompt | `docs/model/rawframe-data-decision-goal-loop-prompt.md` | `1b4297b8de0129f1b8704d3d1cd4dfd82f3c0c008100c9c5c45da78db0bcdd69` |
| Raw-frame model quality prompt | `docs/model/rawframe-model-quality-goal-loop-prompt.md` | `2371f73baf6a0d9c6896f56d56a1c84442f2f9a4fae0a5cc4f3d6d67634795d5` |
| Raw-frame NVIDIA access prompt | `docs/model/rawframe-nvidia-access-goal-loop-prompt.md` | `9053ed22142be8ca6c1be67f2a6dec3c2110663e6ad475e6f51a42b5d730709f` |
| MS-ASL source-rights review | `docs/research/ms-asl-source-rights-review.md` | `8193ee1b44ca55701f8c6ec70b2d5dafc5d99e2b0d505acc806a70672cc8ec0c` |
| MS-ASL availability probe | `docs/research/ms-asl-availability-probe.json` | `118ac38e51108aecb59030fd2e103f06e69f81fe60ae87c5ff2fa30ffbf24661` |
| MS-ASL pruned vocabulary candidate | `docs/research/ms-asl-pruned-vocabulary-candidate.json` | `65132bb3fc9c1576091c51953bded43f750c38762f4a13a6f03fd349438ed308` |
| MS-ASL candidate export script | `scripts/export_msasl_pruned_vocabulary_candidate.mjs` | `80d4ae86819fc0dcc45170b973ff758a42ff9950470aa0ec21351c151ef13e99` |
| MS-ASL pruned vocabulary availability probe | `docs/research/ms-asl-pruned-vocabulary-availability-probe.json` | `e92afd7ae302be7a7fa8495a709ba29ac07d77ba93384053e7fcc016cb880dfb` |
| MS-ASL availability probe script | `scripts/probe_msasl_candidate_availability.mjs` | `f1d6b144b29e7dd0d418d252a46261eddf59a5b8a2dceac7d3732d5d46e31006` |
| MS-ASL availability-filtered candidate | `docs/research/ms-asl-availability-filtered-candidate.json` | `4c193c2692a9d1dd623ee7cccd6bd380b5d2ce76513b9b905736f31e69b12038` |
| MS-ASL availability-filtered export script | `scripts/export_msasl_availability_filtered_candidate.mjs` | `5e42ea71af051899990743c7060c8688757f9f29142aa4be905cd1edb3a16277` |
| MS-ASL metadata ZIP | `artifacts/dataset-research/ms-asl/MS-ASL.zip` | `a8562008309eea4129e1bc0ed7f654a314fee195227222859657e307b6434c34` |
| NVIDIA ASL source-rights review | `docs/research/nvidia-asl-source-rights-review.md` | `0393d9b9e539910e7566a49d7de0b03f869f3d011affd695e5a636b9af9bbb66` |
| NVIDIA ASL access request packet | `docs/research/nvidia-asl-access-request-packet.md` | `b686a8eb2dedf64f8dc028704e4c12ad7b939bd4cbc33225427e4492ade35351` |
| NVIDIA ASL access receipt template | `docs/research/nvidia-asl-access-receipt.template.json` | `df653542c6281c664edcb0e527e92c343460385400f2584e689f26fb2cbd02d4` |
| NVIDIA ASL external-rights receipt | `docs/research/nvidia-asl-external-rights-review-receipt.json` | `5e4d1be32bbe402a2145310567a3ef0d1a4034efb04b94a1a41ff6719bdddce4` |
| NVIDIA ASL metadata audit script | `scripts/audit_nvidia_asl_access_metadata.mjs` | `40af347e8009916b47127c96d3d1773920012b0f6ffa99285053c046b75a7667` |
| NVIDIA ASL metadata audit | `docs/research/nvidia-asl-metadata-audit.json` | `c21733ad2c82db5a1b0e1c3f13f79485c40ec5f733e852ed451d54056978dc76` |
| NVIDIA ASL access page local copy | `artifacts/dataset-research/nvidia-asl/access-page.html` | `bd69fee6e0e87fcfab199ce911549fe800c97d5924b3e858b06d81605a1814cc` |
| NVIDIA ASL dataset license local copy | `artifacts/dataset-research/nvidia-asl/NVIDIA-Data-License-for-ASL-Project-2025-02-04.pdf` | `c9c5f349ae47e02405da092a7e841be585754214d3e4d737ffaebc3ea3aa62e1` |
| NVIDIA Trustworthy AI terms local copy | `artifacts/dataset-research/nvidia-asl/trustworthy-ai-terms.html` | `e8a37e48495b2fb76f07cfb03c695a19873b47622f9bd3060e1412ff0242fdef` |
| NVIDIA ASL 1000 AWS registry local copy | `artifacts/dataset-research/nvidia-asl/aws-open-data-registry-asl-1000.html` | `ee9fd4bb28fc5dd5732569665ecf76212918d815b3805ba23b203c7383467b4a` |
| NVIDIA Trustworthy-AI ASL developer README | `artifacts/dataset-research/nvidia-asl/trustworthy-ai-asl-developer-community-readme.md` | `ebf00757493d00693aeebdbb4092bfb06747d2ffa99355a5c0d594964e54f4dd` |
| NVIDIA Trustworthy-AI ASL data directory JSON | `artifacts/dataset-research/nvidia-asl/trustworthy-ai-asl-data-directory.json` | `a19277466c6aca1755103a0887590ff29c06fa075304abd22188a8a3137a6db7` |
| NVIDIA / SuperAnnotate onboarding note | `artifacts/dataset-research/nvidia-asl/trustworthy-ai-asl-superannotate-onboarding.md` | `3ecc1ec78216df5054edfc17b4ebfcb66d621ac8ec9bc6c4c0e776a64f71528b` |
| Raw-frame data decision | `docs/research/rawframe-data-decision.md` | `be06f93418c014d45c034c9e452cae245d5c74de26786b5bfd57a229428ba774` |
| Current collection plan | `data/dataset/collection-plan.json` | `4f599cf8b49ce66178ad9693a5cb2abcafe5abb417f2ce66c97f20719840555e` |

MS-ASL metadata-only scan:

| Check | Value |
| --- | ---: |
| MS-ASL classes | 1,000 |
| MS-ASL train rows | 16,054 |
| MS-ASL validation rows | 5,287 |
| MS-ASL test rows | 4,172 |
| Exact-normalized overlap with current 95 ASL Pilot labels | 78 |
| Overlaps with at least 20 train, 5 validation, and 5 test metadata rows | 50 |
| Candidate selected labels | 50 |
| Candidate selected metadata rows | 1,710 train / 529 validation / 367 test |
| Candidate overlapping labels below count threshold | 28 |
| Candidate current labels without exact MS-ASL match | 17 |
| Sampled MS-ASL metadata URLs probed | 15 |
| Sampled URLs currently public | 11 |
| Sampled URLs private | 2 |
| Sampled URLs unavailable | 2 |
| Full candidate rows probed by oEmbed | 2,606 |
| Full candidate unique YouTube video IDs | 1,002 |
| Full candidate public oEmbed video IDs | 671 |
| Full candidate not-public/unavailable video IDs | 331 |
| Full candidate public rows | 1,842 |
| Full candidate public-row rate | `0.7068303914044513` |
| Labels still meeting 20/5/5 public-row floor | 14 |
| Availability-filtered candidate labels | 14 |
| Availability-filtered candidate public rows | 368 train / 113 validation / 92 test |
| Availability-filtered candidate unique public video IDs | 291 |

First-party collection planning snapshot:

| Check | Value |
| --- | ---: |
| Planner command | `node scripts/plan_dataset_collection.mjs --summary-only` |
| Planner exit status | `0` |
| Written plan command | `node scripts/plan_dataset_collection.mjs --output data/dataset/collection-plan.json` |
| Written plan SHA-256 | `4f599cf8b49ce66178ad9693a5cb2abcafe5abb417f2ce66c97f20719840555e` |
| Reviewed vocabulary gate | `source_curated` |
| Vocabulary labels | 95 |
| Store path | `data/asl-pilot-store.json` |
| Store exists | `false` |
| Planned signers | 20 |
| Planned train signers | 12 |
| Planned validation signers | 4 |
| Planned test signers | 4 |
| Planned vocabulary assignments | 1,425 |
| Planned assignments per split | 475 train / 475 validation / 475 test |
| Planned negative challenge signers | 4 |
| Planned negative challenge assignments | 20 |
| Planned challenge coverage | 5 each for `empty_camera`, `no_hands_visible`, `low_light`, and `off_center` |
| Collection-session bundle status | `ready_for_capture` |
| Collection-session bundle signer sheets | 24 |
| Collection-session bundle files | 30 |
| Collection-session bundle manifest SHA-256 | `3f5231c09509ccce727d9d705b6ecba6a9b5b569d0f6d09a815160443cfb6550` |
| Priority queue CSV SHA-256 | `09049dec1d2fc32cb8b4615e7f3adbba88b0169ba81ad4230013a91fd465b9b2` |
| Collection UI priority source | `data/dataset/rawframe-remediation-collection-queue.json` |
| Collection UI default first assignment | `vocabulary:348` |

First-party collection audit snapshot:

| Audit | Exit status | Key blockers |
| --- | ---: | --- |
| `node scripts/audit_clip_review.mjs` | 1 | Store missing; no dataset clips; `docs/review/final-clip-review.json` missing. |
| `node scripts/audit_challenge_review.mjs` | 1 | Store missing; no negative challenge clips; `docs/review/final-negative-challenge-review.json` missing. |
| `node scripts/audit_dataset_collection_readiness.mjs` | 1 | Store missing; 0 valid clips; 0 signers; all 95 labels underfilled in train, validation, and test; all four negative challenge types underfilled. |

Current uncapped motion-temporal training run:

- Command: `./.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/train.json --validation-manifest data/manifests/validation.json --test-manifest data/manifests/test.json --output-dir artifacts/rawframe-model --architecture motion_2d_temporal_cnn --check-files --epochs 50 --batch-size 16 --training-augmentation basic --label-smoothing 0.05 --checkpoint-selection best_validation`
- Device: `mps`
- Optimizer: `adamw`
- Weight decay: `0.01`
- Training augmentation: `basic`
- Label smoothing: `0.05`
- Checkpoint selection: `best_validation`
- Selected epoch: `19`
- Selected validation accuracy: `0.07789473684210527`
- Terminal epoch 50 train accuracy: `0.9873684210526316`
- Terminal epoch 50 validation accuracy: `0.06273684210526316`
- Parameter count: `1,159,658`
- Final checkpoint SHA-256:
  `b67ea1768323c5d868115877c595b53a764ce428cf951d88d7a984717082a68a`

Current formal evaluation:

| Metric | Value | Target |
| --- | ---: | ---: |
| Validation top-1 | `0.07789473684210527` | n/a |
| Validation macro-F1 | `0.06776494164679056` | n/a |
| Test top-1 | `0.08919667590027701` | `0.70` |
| Test macro-F1 | `0.08252574184488487` | `0.65` |
| Selected threshold | `0.35` | `0 < threshold < 1` |
| Test false-pass rate | `0.14293628808864267` | `< 0.10` |
| Negative challenge false-pass rate | `0.3` | `< 0.05` |

Negative challenge max confidence by type at threshold `0.35`:

| Challenge type | False-pass rate | False-pass count | Max confidence |
| --- | ---: | ---: | ---: |
| `empty_camera` | `0.4` | 2/5 | `0.3852052092552185` |
| `low_light` | `0.2` | 1/5 | `0.3528396189212799` |
| `no_hands_visible` | `0.4` | 2/5 | `0.8036872744560242` |
| `off_center` | `0.2` | 1/5 | `0.6790016293525696` |

Best observed current-family result for comparison:

| Candidate | Validation top-1 | Test top-1 | Test macro-F1 | Negative false-pass |
| --- | ---: | ---: | ---: | ---: |
| Motion-temporal 2D CNN, 25 train/validation + 19 test PopSign, basic raw RGB augmentation, label smoothing, best-validation selection, 50 epochs | `0.07789473684210527` | `0.08919667590027701` | `0.08252574184488487` | `0.3` |
| Compact 3D clip-normalized, expanded PopSign, basic raw RGB augmentation, label smoothing, best-validation selection, 50 epochs | `0.06537396121883657` | `0.06869806094182826` | `0.06335914957604623` | `0.2` |
| Compact 3D, expanded PopSign, basic raw RGB augmentation, best-validation selection, 50 epochs | `0.060941828254847646` | `0.06315789473684211` | `0.059664305525834974` | `0.35` |
| Compact 3D, expanded PopSign, basic raw RGB augmentation, terminal epoch, 50 epochs | `0.058725761772853186` | `0.06204986149584488` | `0.059133805764928445` | `0.15` |
| Compact 3D, expanded PopSign, mild raw RGB augmentation, best-validation selection, 50 epochs | `0.0592797783933518` | `0.058725761772853186` | `0.057247594296658814` | `0.4` |
| Factorized 3D, expanded PopSign, mild raw RGB augmentation, 15 epochs | `0.021052631578947368` | `0.018836565096952907` | `0.01017201341190055` | `0.55` |

Current failure-analysis snapshot:

| Check | Value |
| --- | ---: |
| Report status | `candidate_failed_analyzed` |
| Failed target gates | `false_pass_rate`, `macro_f1`, `negative_challenge_false_pass_rate`, `top1_accuracy` |
| Final train accuracy minus selected validation accuracy | `0.9094736842105263` |
| Validation labels with zero recall | 33 / 95 |
| Test labels with zero recall | 38 / 95 |
| Train signer count | 29 |
| Validation signer count | 8 |
| Test signer count | 8 |
| Train/validation signer overlap | 0 |
| Train/test signer overlap | 0 |
| Validation/test signer overlap | 0 |

Current data-remediation snapshot:

| Check | Value |
| --- | ---: |
| Report status | `remediation_plan_ready_not_training_data` |
| Labels in scope | 95 |
| Priority labels with nonzero score | 77 |
| Zero recall on validation and test | 18 |
| Zero recall on validation only | 15 |
| Zero recall on test only | 20 |
| Labels appearing as true label in top confusions | 24 |
| First-party store exists | `false` |
| NVIDIA metadata audit status | `blocked` |
| Split-shift diagnostic signal | `low_level_train_label_centroids_do_not_generalize_to_heldout_splits` |
| Validation low-level train-label centroid accuracy | `0.010526315789473684` |
| Test low-level train-label centroid accuracy | `0.014035087719298246` |

Current remediation collection queue snapshot:

| Check | Value |
| --- | ---: |
| Report status | `queue_ready_not_training_data` |
| Total queue assignments | 1,445 |
| Vocabulary capture assignments | 1,425 |
| Negative challenge assignments | 20 |
| Priority labels | 77 |
| Assignments for labels with zero recall on validation and test | 270 |
| Train assignments | 475 |
| Validation assignments | 475 |
| Test assignments | 475 |

Current remediation collection queue audit snapshot:

| Check | Value |
| --- | ---: |
| Report status | `passed_nonfinal_queue_audit` |
| Findings | 0 |
| Collection assignments present | `true` |
| Extra queue assignments | `false` |
| Queue index continuous | `true` |
| Queue order valid | `true` |
| Assignment keys valid | `true` |
| Store exists | `false` |

## Verification

- `python3 -m py_compile scripts/import_popsign_v1_raw_videos.py`: passed
  after adding split-specific PopSign import counts.
- `./.venv/bin/python scripts/import_popsign_v1_raw_videos.py --train-clips-per-label 25 --validation-clips-per-label 25 --test-clips-per-label 19`:
  passed in dry-run mode with train 2,375, validation 2,375, test 1,805, and
  no blockers.
- `./.venv/bin/python scripts/import_popsign_v1_raw_videos.py --train-clips-per-label 25 --validation-clips-per-label 25 --test-clips-per-label 19 --write`:
  passed and rewrote the active train/validation/test manifests with the
  approved split-specific counts.
- `./.venv/bin/python scripts/decode_raw_videos.py --manifest data/manifests/train.json --manifest data/manifests/validation.json --manifest data/manifests/test.json`:
  passed and decoded 2,375 train clips, 2,375 validation clips, and 1,805 test
  clips.
- `./.venv/bin/python scripts/decode_raw_videos.py --manifest data/manifests/train.json --manifest data/manifests/validation.json --manifest data/manifests/test.json --verify-only`:
  passed decode-provenance replay for all 6,555 active PopSign clips.
- `python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/export_onnx_model.py scripts/import_popsign_v1_raw_videos.py`:
  passed after the factorized architecture, label-smoothing, and
  checkpoint-selection changes.
- `./.venv/bin/python scripts/train_rawframe_model.py ... --architecture factorized_3d_cnn_spatiotemporal --dry-run`:
  passed against the expanded manifests and final output path policy.
- `./.venv/bin/python scripts/train_rawframe_model.py ... --output-dir artifacts/rawframe-model-diagnostics/factorized-smoke --max-train-batches 20 --max-validation-batches 20`:
  passed and wrote smoke-only diagnostic artifacts outside the final artifact
  directory.
- `./.venv/bin/python scripts/train_rawframe_model.py ... --output-dir artifacts/rawframe-model-diagnostics/checkpoint-selection-smoke --checkpoint-selection best_validation --max-train-batches 3 --max-validation-batches 3`:
  passed and wrote `checkpoint_selection.policy: best_validation`,
  `selected_epoch: 2`, and selected validation metrics in smoke provenance.
- `./.venv/bin/python scripts/train_rawframe_model.py ... --architecture factorized_3d_cnn_spatiotemporal --epochs 15 --batch-size 8 --training-augmentation mild`:
  passed and wrote the current checkpoint plus training provenance.
- `./.venv/bin/python scripts/train_rawframe_model.py ... --architecture compact_3d_cnn_spatiotemporal --epochs 50 --batch-size 16 --training-augmentation mild --checkpoint-selection best_validation`:
  passed, selected epoch 48 by validation accuracy, and failed final target
  gates.
- `./.venv/bin/python scripts/train_rawframe_model.py ... --architecture compact_3d_cnn_spatiotemporal --epochs 50 --batch-size 16 --training-augmentation basic --checkpoint-selection best_validation`:
  passed, selected epoch 49 by validation accuracy, and wrote the current
  checkpoint plus training provenance.
- `./.venv/bin/python scripts/evaluate_rawframe_model.py ... --challenge-manifest data/manifests/negative-challenge.json`:
  failed final target gates as expected and wrote the current
  `artifacts/rawframe-model/validation-report.json`.
- `./.venv/bin/python scripts/export_onnx_model.py ...`:
  failed closed because calibrated provenance is missing/stale and lacks
  passing negative challenge evidence.
- `node scripts/audit_source_register.mjs`: passed.
- `node scripts/audit_dataset_source_research.mjs`: passed.
- `node scripts/audit_model_artifacts.mjs`: passed for the current fail-closed
  model-card status.
- `node scripts/audit_model_artifacts.mjs --require-trained`: failed as
  expected because the model-card status is still `not_trained`.
- `node scripts/audit_no_pretrained_artifact_json.mjs`: passed.
- `git diff --check`: passed.
- `pgrep -fl 'train_rawframe_model.py|evaluate_rawframe_model.py|decode_raw_videos.py|import_popsign_v1_raw_videos.py|export_onnx_model.py|probe_msasl_candidate_availability.mjs|plan_dataset_collection.mjs'`:
  returned no running jobs.
- `curl -L --fail ... MS-ASL.zip`:
  passed for the official metadata ZIP after resolving the current Microsoft
  download URL from the download page.
- `unzip -l artifacts/dataset-research/ms-asl/MS-ASL.zip`:
  confirmed the package contains train/test/validation JSON, class/synonym JSON,
  README, and a C-UDA license discussion PDF, not raw video files.
- `swift -e 'import Foundation; import PDFKit; ...'`:
  extracted the local MS-ASL C-UDA v0.1 PDF text for review.
- `uvx --from yt-dlp yt-dlp --simulate --skip-download --no-playlist ...`:
  probed 15 sampled MS-ASL metadata URLs without downloading video bytes.
- `node scripts/export_msasl_pruned_vocabulary_candidate.mjs --write`:
  passed and wrote a research-only 50-label MS-ASL candidate with 1,710 train,
  529 validation, and 367 test metadata rows.
- `node scripts/probe_msasl_candidate_availability.mjs --write --concurrency 12 --timeout-ms 15000`:
  passed and wrote a research-only full oEmbed probe with 1,842 public rows out
  of 2,606 candidate rows, no video downloads, and only 14 labels still meeting
  the 20/5/5 public-row floor.
- `node scripts/export_msasl_availability_filtered_candidate.mjs --write`:
  passed and wrote a research-only 14-label candidate with 368 train, 113
  validation, and 92 test public rows across 291 unique public video IDs.
- Current external source refresh:
  checked the NVIDIA ASL dataset access page and license PDF, the official
  PopSign v2 page, the MS-ASL Download Center page, and the ASL Citizen license
  page. This found NVIDIA as a gated raw-video candidate only, confirmed
  PopSign v2 videos remain unavailable, kept MS-ASL reduced-scope-only, and kept
  ASL Citizen blocked without separate licensing.
- `node scripts/refresh_dataset_source_research.mjs --write`: passed and wrote
  a 12-source current public-source receipt at
  `docs/research/dataset-source-research-receipts.json`.
- `node scripts/audit_dataset_source_research.mjs`: passed with receipt
  SHA-256 `9cf6c7211b96eb5e8f06b6ccd3856424519cf2c5bd1edd05de43f8208731b42f`.
- `node scripts/audit_source_register.mjs`: passed with source-register
  SHA-256 `692bda5f3f891462ab066539c4bcb8a0cc55a6358ed03972299b8742c6515b1f`.
- `node scripts/export_popsign_v1_import_plan.mjs --write`: passed and
  refreshed `docs/research/popsign-v1-import-plan.json` with SHA-256
  `66c69381b0f31b122e6c3fe0964e1f0be10de934554fef0b8500b718b8198d86`.
- `node scripts/export_online_negative_challenge_manifest.mjs --write --refresh-existing-manifests`:
  passed, refreshed `data/manifests/negative-challenge.json`, and updated the
  active train/validation/test manifest source-register pins.
- NVIDIA source evidence refresh:
  downloaded only public source/license/registry/developer pages to
  `artifacts/dataset-research/nvidia-asl/`, hash-pinned the access page, AWS
  ASL 1000 registry entry, dataset license PDF, Trustworthy AI terms, and public
  Trustworthy-AI ASL developer docs. The receipt remains
  `candidate_not_approved_for_training`.
- `node --check scripts/audit_nvidia_asl_access_metadata.mjs`: passed.
- `node scripts/audit_nvidia_asl_access_metadata.mjs --write`: failed closed as
  expected and wrote `docs/research/nvidia-asl-metadata-audit.json`; blockers
  are missing `docs/research/nvidia-asl-access-receipt.json` and missing
  `artifacts/dataset-research/nvidia-asl/metadata/`.
- `node --check scripts/audit_nvidia_asl_access_metadata.mjs`: passed after
  hardening accepted-access receipt validation.
- `node scripts/audit_nvidia_asl_access_metadata.mjs --write`: failed closed as
  expected after the receipt-gate hardening and rewrote
  `docs/research/nvidia-asl-metadata-audit.json`; blockers remain missing
  `docs/research/nvidia-asl-access-receipt.json` and missing
  `artifacts/dataset-research/nvidia-asl/metadata/`, while any future receipt
  must now prove `accepted_access_retained` plus hash-pinned acceptance
  attachments.
- `node scripts/audit_nvidia_asl_access_metadata.mjs --access-receipt docs/research/nvidia-asl-access-receipt.template.json`:
  failed closed as expected without rewriting artifacts and proved the retained
  template cannot satisfy the post-access gate; blockers included missing
  `accepted_access_retained`, required true commitments, operator/request
  fields, specific use case, and hash-pinned evidence attachments.
- `node scripts/audit_nvidia_asl_access_metadata.mjs`: failed closed as
  expected without rewriting artifacts; blockers remain missing
  `docs/research/nvidia-asl-access-receipt.json` and missing
  `artifacts/dataset-research/nvidia-asl/metadata/`.
- `node scripts/audit_nvidia_asl_access_metadata.mjs`: failed closed as
  expected after adding the NVIDIA access goal prompt; blockers remain missing
  `docs/research/nvidia-asl-access-receipt.json` and missing
  `artifacts/dataset-research/nvidia-asl/metadata/`.
- `node scripts/audit_nvidia_asl_access_metadata.mjs --access-receipt docs/research/nvidia-asl-access-receipt.template.json`:
  failed closed as expected after adding the NVIDIA access goal prompt; the
  retained template still cannot satisfy accepted-access evidence because its
  status, commitment booleans, operator/request fields, specific use case, and
  hash-pinned accepted-access attachments are absent.
- `./.venv/bin/python scripts/audit_local_ml_environment.py --write-report`:
  passed and refreshed `docs/validation/local-ml-environment.json` for the
  current venv, Torch `2.12.0`, ONNX `1.21.0`, ONNXScript `0.7.0`, and MPS
  smoke path.
- `./.venv/bin/python scripts/decode_raw_videos.py --manifest data/manifests/negative-challenge.json --tensor-root data/tensors`:
  passed after the negative-challenge manifest refresh and decoded 20
  hash-pinned clips.
- `./.venv/bin/python scripts/decode_raw_videos.py --manifest data/manifests/negative-challenge.json --tensor-root data/tensors --verify-only`:
  passed for all 20 negative-challenge clips after the refresh.
- `./.venv/bin/python scripts/audit_final_manifests.py --train-manifest data/manifests/train.json --validation-manifest data/manifests/validation.json --test-manifest data/manifests/test.json --negative-challenge-manifest data/manifests/negative-challenge.json --write-report docs/validation/final-manifest-audit.json`:
  passed with 2,375 train clips, 2,375 validation clips, 1,805 test clips, and
  20 negative-challenge clips; report SHA-256
  `3338bbb096edd9448f3575d7b7ef2acac4ed9d9695c3da74d802fe247850df10`.
- `node scripts/report_post_collection_evidence_status.mjs --write` and
  `node scripts/audit_post_collection_evidence_status.mjs`: passed after the
  manifest hash refresh; report SHA-256
  `9ef29a2a562b49f65e62888a892a2ad3aa040f27ebaa088df5da1c218242e505`.
- `node scripts/audit_final_rawframe_pipeline_preflight.mjs --skip-completion-readiness --skip-decode-replay`:
  failed closed as expected at `evaluate_rawframe_model`; blockers remain
  nonpassing validation report status plus nonfinal calibrated provenance.
- `node scripts/audit_completion_readiness.mjs --read-only --summary-only`:
  failed closed as expected with 46 passed checks, 8 failed checks, and next
  raw-frame stage `evaluate_rawframe_model`.
- `node --check scripts/analyze_rawframe_model_failure.mjs`: passed.
- `node scripts/analyze_rawframe_model_failure.mjs`: passed without rewriting
  artifacts and reproduced the failure summary.
- `node scripts/analyze_rawframe_model_failure.mjs --write`: passed and wrote
  `docs/validation/rawframe-model-failure-analysis.json`.
- `node scripts/plan_rawframe_data_remediation.mjs --write`: passed and wrote
  `docs/validation/rawframe-data-remediation-plan.json`; the plan keeps
  manifests unchanged and reports blockers for missing first-party store plus
  blocked NVIDIA metadata review.
- `node scripts/export_rawframe_remediation_collection_queue.mjs --write`:
  passed and wrote `data/dataset/rawframe-remediation-collection-queue.json`.
- `node --check scripts/export_rawframe_remediation_collection_queue.mjs`:
  passed.
- `node scripts/export_rawframe_remediation_collection_queue.mjs`: passed
  without rewriting artifacts and reproduced the queue summary.
- `node --check scripts/audit_rawframe_remediation_collection_queue.mjs`:
  passed.
- `node scripts/audit_rawframe_remediation_collection_queue.mjs`: passed
  without rewriting artifacts and reproduced `passed_nonfinal_queue_audit` with
  no findings.
- `node scripts/audit_rawframe_remediation_collection_queue.mjs --write`:
  passed and wrote
  `docs/validation/rawframe-remediation-collection-queue-audit.json`.
- `node --check scripts/prepare_collection_session_bundle.mjs` and
  `node --check scripts/audit_collection_session_bundle.mjs`: passed.
- `node scripts/prepare_collection_session_bundle.mjs`: passed and refreshed
  `output/collection-handoff/collection-session-bundle` with
  `ready_for_capture` status, 24 signer sheets, and the priority queue CSV.
- `node scripts/audit_collection_session_bundle.mjs --require-ready`: passed.
- Pre-capture bundle commands passed:
  `node scripts/audit_vocabulary_review.mjs`,
  `node scripts/audit_hint_pedagogy_review.mjs`,
  `node scripts/audit_reviewed_vocabulary_collection_gate.mjs`,
  `node scripts/audit_collection_plan_freshness.mjs`,
  `node scripts/audit_collection_plan_contract.mjs`, and
  `node scripts/audit_collection_session_bundle.mjs --require-ready`.
- `npm --prefix web run lint -- src/app/api/dataset/plan/route.ts src/components/DatasetCollectionPanel.tsx`:
  passed.
- `npm --prefix web run build`: passed.
- `node scripts/run_dataset_collection_runtime_smoke.mjs --write`: passed and
  refreshed `docs/validation/dataset-collection-runtime-smoke.json`.
- `node scripts/audit_dataset_collection_runtime_smoke.mjs`: passed.
- Playwright fallback UI check against `http://127.0.0.1:3038` with explicit
  dataset collection env and an isolated store: passed. The dataset capture
  panel loaded `1445/1445` open assignments, displayed `Queue #1` with
  `zero_recall_validation_and_test`, selected
  `#1 · vocabulary:150 · Train · signer-013 · Before`, and showed the priority
  queue summary as `77 labels`.
- JSON parse check for `data/dataset/rawframe-remediation-collection-queue.json`
  and `docs/validation/rawframe-data-remediation-plan.json`: passed.
- `node scripts/plan_dataset_collection.mjs --output data/dataset/collection-plan.json`:
  passed and wrote the current 95-label first-party operator collection plan.
- `node scripts/plan_dataset_collection.mjs --summary-only`: passed with
  `source_curated` vocabulary evidence, planned 1,425 vocabulary captures across
  20 signer aliases, and planned 20 disjoint negative challenge captures.
- `node scripts/audit_clip_review.mjs`: failed as expected because
  `data/asl-pilot-store.json` and `docs/review/final-clip-review.json` are
  absent and no dataset clips exist.
- `node scripts/audit_challenge_review.mjs`: failed as expected because
  `data/asl-pilot-store.json` and
  `docs/review/final-negative-challenge-review.json` are absent and no negative
  challenge clips exist.
- `node scripts/audit_dataset_collection_readiness.mjs`: failed as expected
  because the first-party store is absent, there are 0 valid clips/signers, all
  95 labels are missing 5 approved clips in each split, and all required
  negative challenge types are underfilled.
- `node scripts/audit_completion_readiness.mjs`: stopped after its child
  `node scripts/audit_final_rawframe_pipeline_preflight.mjs --skip-completion-readiness`
  ran silently for more than ten minutes; the orphaned full decode verify was
  also stopped. This was not counted as completion evidence; use the read-only
  summary command below for non-mutating blocker summaries.
- `node --check scripts/audit_final_rawframe_pipeline_preflight.mjs`: passed.
- `node --check scripts/audit_completion_readiness.mjs`: passed.
- `node scripts/audit_final_rawframe_pipeline_preflight.mjs --skip-completion-readiness --skip-decode-replay`:
  failed closed as expected with `status: blocked`, `skip_decode_replay: true`,
  and `final_acceptance_eligible: false`. The next stage remains
  `collection_store_and_returned_packets`, blocked by
  `blocked_missing_collection_store`.
- `node scripts/audit_completion_readiness.mjs --read-only --summary-only`:
  failed closed as expected with `mode: read_only`, `status: incomplete`,
  `passed: 40`, `failed: 14`, and `blocker_count: 14`. The final raw-frame
  next stage remains `collection_store_and_returned_packets`; major blockers
  include missing first-party store/review packets, missing final browser ONNX
  and browser compatibility evidence, stale/nonfinal validation provenance, a
  `not_trained` model card, and missing final raw-frame preflight acceptance.
- `node scripts/export_vocabulary_review_packet.mjs`: passed and refreshed
  `data/vocabulary-review/asl-pilot-vocabulary-review.json` for 95 items.
- `node scripts/export_vocabulary_review_workbook.mjs`: passed and refreshed
  `docs/review/vocabulary-review-workbook.md` with the current packet hash.
- `node --check scripts/audit_guardrail_negative_fixtures.mjs`: passed.
- `node scripts/audit_guardrail_negative_fixtures.mjs`: passed, including the
  draft vocabulary-review bundle, draft collection-session bundle, stale
  collection-session generator, and final-training old-architecture rejection
  negative fixtures.
- `node --check scripts/audit_guardrail_negative_fixtures.mjs`: passed after
  adding the NVIDIA access-receipt template rejection fixture.
- `node scripts/audit_guardrail_negative_fixtures.mjs`: passed with the new
  `nvidia_access_receipt_template_fails` case, proving the retained
  `docs/research/nvidia-asl-access-receipt.template.json` cannot be treated as
  accepted NVIDIA access evidence.
- `node scripts/report_post_collection_evidence_status.mjs --write`: passed and
  wrote `docs/validation/post-collection-evidence-status.json` with
  `blocked_missing_collection_store`.
- `node scripts/audit_post_collection_evidence_status.mjs`: passed.
- `node scripts/audit_operator_handoff.mjs`: passed after refreshing the
  handoff artifact hashes for the current 95-label source-curated state.
- `node --check scripts/run_practice_camera_behavior_smoke.mjs`: passed.
- `node --check scripts/audit_practice_camera_behavior_smoke.mjs`: passed.
- `node scripts/run_practice_camera_behavior_smoke.mjs --write`: passed and
  wrote `docs/validation/practice-camera-behavior-smoke.json`.
- `node scripts/audit_practice_camera_behavior_smoke.mjs`: passed.
- `node scripts/run_final_privacy_smoke.mjs --app-url http://127.0.0.1:3025 --write`:
  passed against a short-lived local production server and wrote
  `docs/privacy/final-privacy-smoke.json`.
- `node scripts/run_final_privacy_smoke.mjs --app-url http://127.0.0.1:3025`:
  passed without rewriting, proving the retained privacy smoke was reproducible
  while the local server was available.
- `node scripts/audit_final_privacy_smoke.mjs`: passed.
- `node --check scripts/audit_final_rawframe_pipeline_preflight.mjs`: passed.
- `node --check scripts/audit_completion_readiness.mjs`: passed.
- `node scripts/audit_final_rawframe_pipeline_preflight.mjs --skip-completion-readiness --skip-decode-replay`:
  failed closed as expected with next stage `evaluate_rawframe_model`, not
  first-party collection intake. The blockers are the nonpassing validation
  report plus stale/smoke calibrated provenance.
- `node scripts/audit_completion_readiness.mjs --read-only --summary-only`
  without a local server: failed closed with `mode: read_only`,
  `status: incomplete`, `passed: 46`, `failed: 8`, and `blocker_count: 8`.
- Latest read-only completion summary with the short-lived privacy server
  available: failed closed as expected with `mode: read_only`,
  `status: incomplete`, `passed: 47`, `failed: 7`, and `blocker_count: 7`.
  The final raw-frame next stage is `evaluate_rawframe_model`, blocked by
  `artifacts/rawframe-model/validation-report.json` not being
  `candidate_final_validation_passed` and `artifacts/rawframe-model/calibrated-provenance.json`
  still not being final passing calibration evidence.
- `./.venv/bin/python scripts/evaluate_rawframe_model.py --checkpoint artifacts/rawframe-model/model_state.pt --training-provenance artifacts/rawframe-model/training-provenance.json --train-manifest data/manifests/train.json --validation-manifest data/manifests/validation.json --test-manifest data/manifests/test.json --challenge-manifest data/manifests/negative-challenge.json --output-report artifacts/rawframe-model/validation-report.json --calibrated-provenance artifacts/rawframe-model/calibrated-provenance.json`:
  exited nonzero as expected with `status: candidate_final_validation_failed`,
  `output_report_sha256: 719c8f3432fefca6e4cf09634863c847fc4f095270b1e2baece478010d8a539a`,
  `passes_targets: false`, and `calibrated_provenance: null`. The report now
  includes per-signer held-out metrics in `validation.signer_metrics` and
  `test.signer_metrics`.
- `node scripts/analyze_rawframe_model_failure.mjs --write`: passed and wrote
  refreshed `docs/validation/rawframe-model-failure-analysis.json`, including
  a retained `signer_generalization` summary.
- `node scripts/plan_rawframe_data_remediation.mjs --write`: passed and
  refreshed `docs/validation/rawframe-data-remediation-plan.json`, still
  blocked on absent first-party collection store or approved NVIDIA
  metadata/access evidence.
- `node --check scripts/final_evidence_contract.mjs`: passed.
- `node --check scripts/audit_model_artifacts.mjs`: passed.
- `node --check scripts/promote_trained_model_card.mjs`: passed.
- `node scripts/audit_model_artifacts.mjs`: passed for the current fail-closed
  `not_trained` model card state.
- `node scripts/promote_trained_model_card.mjs --dry-run --dry-run-output /tmp/asl-pilot-promoted-model-card.json`:
  exited nonzero as expected because current validation/calibration evidence is
  still nonpassing or stale; the failure is no longer caused by disallowing the
  factorized final raw-frame architecture.
- `python3 -m py_compile scripts/analyze_rawframe_tensor_visuals.py`: passed.
- `./.venv/bin/python scripts/analyze_rawframe_tensor_visuals.py --write`:
  passed and wrote
  `docs/validation/rawframe-tensor-visual-diagnostic.json` with
  `passed_no_gross_tensor_issue`, 12 labels inspected, 72 samples, no blockers,
  and no warnings. It also wrote retained contact sheets under
  `docs/validation/rawframe-tensor-visual-contact-sheets/`; hashes are embedded
  in the diagnostic JSON.
- `python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/analyze_rawframe_tensor_visuals.py`:
  passed after adding signer metadata to dataset records and signer metrics to
  evaluation outputs.
- `./.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/train.json --validation-manifest data/manifests/validation.json --test-manifest data/manifests/test.json --dry-run --check-files --output-dir artifacts/rawframe-model --architecture compact_3d_cnn_spatiotemporal`:
  passed manifest and tensor-file validation without training.
- `node scripts/audit_final_rawframe_pipeline_preflight.mjs --skip-completion-readiness --skip-decode-replay`:
  failed closed as expected with `status: blocked`,
  `final_acceptance_eligible: false`, `next_stage.id: evaluate_rawframe_model`,
  and 12 retained blockers. The first blockers remain the nonpassing validation
  report and stale nonfinal calibrated provenance.
- `python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/analyze_rawframe_tensor_visuals.py`:
  passed after adding the clip-normalized compact architecture.
- `node --check scripts/final_evidence_contract.mjs`,
  `node --check scripts/audit_model_artifacts.mjs`, and
  `node --check scripts/promote_trained_model_card.mjs`: passed after adding
  the clip-normalized compact architecture to the final evidence contracts.
- `python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py scripts/export_onnx_model.py`:
  passed after adding the motion-temporal architecture.
- `node --check scripts/final_evidence_contract.mjs`,
  `node --check scripts/audit_model_artifacts.mjs`,
  `node --check scripts/promote_trained_model_card.mjs`, and
  `node --check scripts/audit_guardrail_negative_fixtures.mjs`: passed after
  registering the motion-temporal architecture in the final evidence contracts
  and downstream gates.
- `./.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/train.json --validation-manifest data/manifests/validation.json --test-manifest data/manifests/test.json --dry-run --check-files --output-dir artifacts/rawframe-model --architecture motion_2d_temporal_cnn`:
  passed manifest and tensor-file validation without training.
- `./.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/train.json --validation-manifest data/manifests/validation.json --test-manifest data/manifests/test.json --output-dir artifacts/rawframe-model-diagnostics/motion-temporal-smoke --architecture motion_2d_temporal_cnn --check-files --epochs 1 --batch-size 4 --training-augmentation basic --checkpoint-selection best_validation --max-train-batches 2 --max-validation-batches 2`:
  passed as a capped MPS smoke run with evidence mode `smoke`, selected epoch
  `1`, parameter count `1,159,658`, and validation accuracy `0` over 8 smoke
  examples.
- `./.venv/bin/python scripts/export_onnx_model.py --checkpoint artifacts/rawframe-model-diagnostics/motion-temporal-smoke/model_state.pt --training-provenance artifacts/rawframe-model-diagnostics/motion-temporal-smoke/training-provenance.json --output artifacts/rawframe-model-diagnostics/motion-temporal-smoke/asl-pilot-motion-temporal-smoke.onnx --export-report artifacts/rawframe-model-diagnostics/motion-temporal-smoke/export-provenance.json --parity-fixture artifacts/rawframe-model-diagnostics/motion-temporal-smoke/parity-fixture.json --allow-smoke-export`:
  passed and wrote smoke-only ONNX export provenance plus a parity fixture.
- `node scripts/audit_no_pretrained_artifact_json.mjs --path artifacts/rawframe-model-diagnostics/motion-temporal-smoke/training-provenance.json`
  and `node scripts/audit_no_pretrained_artifact_json.mjs --path artifacts/rawframe-model-diagnostics/motion-temporal-smoke/export-provenance.json`:
  passed for the motion-temporal smoke artifacts.
- `node scripts/audit_model_artifacts.mjs`: passed for the current fail-closed
  `not_trained` model-card status after registering the motion-temporal
  architecture.
- `node scripts/promote_trained_model_card.mjs --dry-run --dry-run-output /tmp/asl-pilot-promoted-model-card.json`:
  exited nonzero as expected because current final validation/calibration
  evidence is still nonpassing or stale; the failure is not caused by rejecting
  the motion-temporal architecture.
- `node scripts/audit_guardrail_negative_fixtures.mjs`: passed after the
  motion-temporal architecture changes.
- `node scripts/audit_final_rawframe_pipeline_preflight.mjs --skip-completion-readiness --skip-decode-replay`:
  failed closed as expected after the motion-temporal architecture changes with
  `status: blocked`, `final_acceptance_eligible: false`, and
  `next_stage.id: evaluate_rawframe_model`; blockers remain the nonpassing
  validation report and stale/nonfinal calibrated provenance.
- `./.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/train.json --validation-manifest data/manifests/validation.json --test-manifest data/manifests/test.json --output-dir artifacts/rawframe-model --architecture motion_2d_temporal_cnn --check-files --epochs 50 --batch-size 16 --training-augmentation basic --label-smoothing 0.05 --checkpoint-selection best_validation`:
  passed on MPS, selected epoch 19 by validation accuracy, and wrote the
  current checkpoint plus training provenance.
- `./.venv/bin/python scripts/evaluate_rawframe_model.py --checkpoint artifacts/rawframe-model/model_state.pt --training-provenance artifacts/rawframe-model/training-provenance.json --train-manifest data/manifests/train.json --validation-manifest data/manifests/validation.json --test-manifest data/manifests/test.json --challenge-manifest data/manifests/negative-challenge.json --output-report artifacts/rawframe-model/validation-report.json --calibrated-provenance artifacts/rawframe-model/calibrated-provenance.json`:
  exited nonzero as expected with `status: candidate_final_validation_failed`,
  `output_report_sha256: 8ff8417201ae0fb3266b3adc105c2ce514380fb2422388f0fcc602d080d02ce9`,
  `passes_targets: false`, `calibrated_provenance: null`, test top-1
  `0.08919667590027701`, test macro-F1 `0.08252574184488487`, test
  false-pass `0.14293628808864267`, and negative challenge false-pass `0.3`.
- `node scripts/audit_no_pretrained_artifact_json.mjs --path artifacts/rawframe-model/training-provenance.json`
  and `node scripts/audit_no_pretrained_artifact_json.mjs --path artifacts/rawframe-model/validation-report.json`:
  passed for the current motion-temporal candidate.
- `./.venv/bin/python scripts/export_onnx_model.py --checkpoint artifacts/rawframe-model/model_state.pt --training-provenance artifacts/rawframe-model/calibrated-provenance.json --output web/public/model/asl-pilot-rawframe-v0.onnx`:
  exited `2` as expected with `ONNX export failed: training provenance architecture must match checkpoint architecture`, because the retained calibrated
  provenance is stale and no final passing calibration evidence was written for
  the current candidate.
- `node scripts/analyze_rawframe_model_failure.mjs --write`: passed and wrote
  refreshed `docs/validation/rawframe-model-failure-analysis.json` for the
  motion-temporal candidate.
- `node scripts/plan_rawframe_data_remediation.mjs --write`: passed and
  refreshed `docs/validation/rawframe-data-remediation-plan.json` with 77
  priority labels and 18 labels with zero recall on validation and test.
- `node scripts/export_rawframe_remediation_collection_queue.mjs --write`:
  passed and refreshed
  `data/dataset/rawframe-remediation-collection-queue.json` with
  `priority_label_count: 77` and 1,445 total assignments.
- `node scripts/audit_rawframe_remediation_collection_queue.mjs --write`:
  passed after rerunning sequentially behind the queue exporter and refreshed
  `docs/validation/rawframe-remediation-collection-queue-audit.json` with
  `passed_nonfinal_queue_audit`, 95 labels, 77 priority labels, 1,445
  assignments, and no findings.
- `node scripts/prepare_collection_session_bundle.mjs`: passed and refreshed
  `output/collection-handoff/collection-session-bundle/MANIFEST.json` with
  `ready_for_capture` status and remediation queue hash
  `eaaab49ca5750a4df9830c4a6471274e0ec28ac3c6a0a8dc9860814c9fe96d32`.
- `node scripts/audit_collection_session_bundle.mjs --require-ready`,
  `node scripts/audit_collection_plan_contract.mjs`, and
  `node scripts/audit_operator_handoff.mjs`: passed after the latest queue,
  bundle, and handoff hash refresh.
- `node scripts/audit_model_artifacts.mjs`: passed for the current fail-closed
  `not_trained` model-card status after the motion-temporal run.
- `node scripts/promote_trained_model_card.mjs --dry-run --dry-run-output /tmp/asl-pilot-promoted-model-card.json`:
  exited nonzero as expected because current validation/calibration evidence is
  still nonpassing or stale.
- `node scripts/audit_final_rawframe_pipeline_preflight.mjs --skip-completion-readiness --skip-decode-replay`:
  failed closed as expected after the motion-temporal run with `status:
  blocked`, `final_acceptance_eligible: false`, and `next_stage.id:
  evaluate_rawframe_model`; blockers remain the nonpassing validation report
  and stale/nonfinal calibrated provenance.
- `node --check scripts/audit_completion_readiness.mjs`: passed after adding
  the untracked NVIDIA access-audit guardrail inputs to the read-only temporary
  worktree copy list.
- `node scripts/audit_guardrail_negative_fixtures.mjs`: passed with the
  `nvidia_access_receipt_template_fails` case in the current worktree.
- `node scripts/audit_completion_readiness.mjs --read-only --summary-only`:
  failed closed as expected with `mode: read_only`, `status: incomplete`,
  `passed: 46`, `failed: 8`, and `blocker_count: 8`. The final raw-frame next
  stage remains `evaluate_rawframe_model`, blocked by the nonpassing validation
  report and stale/nonfinal calibrated provenance; other blockers include the
  absent final browser ONNX/compatibility reports, fail-closed `not_trained`
  model card, missing live privacy server for reproducibility, and final docs
  still carrying explicit incomplete-status language.
- `./.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/train.json --validation-manifest data/manifests/validation.json --test-manifest data/manifests/test.json --dry-run --check-files --output-dir artifacts/rawframe-model --architecture compact_3d_cnn_spatiotemporal_clip_norm`:
  passed manifest and tensor-file validation without training.
- `./.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/train.json --validation-manifest data/manifests/validation.json --test-manifest data/manifests/test.json --output-dir artifacts/rawframe-model-diagnostics/clip-norm-smoke --architecture compact_3d_cnn_spatiotemporal_clip_norm --check-files --epochs 1 --batch-size 8 --training-augmentation basic --checkpoint-selection best_validation --max-train-batches 2 --max-validation-batches 2`:
  passed as a capped MPS smoke run outside the final artifact directory.
- `./.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/train.json --validation-manifest data/manifests/validation.json --test-manifest data/manifests/test.json --output-dir artifacts/rawframe-model --architecture compact_3d_cnn_spatiotemporal_clip_norm --check-files --epochs 50 --batch-size 16 --training-augmentation basic --label-smoothing 0.05 --checkpoint-selection best_validation`:
  passed on MPS, selected epoch 43 by validation accuracy, and wrote the
  current checkpoint plus training provenance.
- `./.venv/bin/python scripts/evaluate_rawframe_model.py --checkpoint artifacts/rawframe-model/model_state.pt --training-provenance artifacts/rawframe-model/training-provenance.json --train-manifest data/manifests/train.json --validation-manifest data/manifests/validation.json --test-manifest data/manifests/test.json --challenge-manifest data/manifests/negative-challenge.json --output-report artifacts/rawframe-model/validation-report.json --calibrated-provenance artifacts/rawframe-model/calibrated-provenance.json`:
  exited nonzero as expected with `status: candidate_final_validation_failed`,
  `output_report_sha256: d17c7aa5bca52c6d0234e612528d1c60dbc3b26ba485c9254be83a68dca4b1a7`,
  `passes_targets: false`, `calibrated_provenance: null`, test top-1
  `0.06869806094182826`, test macro-F1 `0.06335914957604623`, test
  false-pass `0.14293628808864267`, and negative challenge false-pass `0.2`.
- `./.venv/bin/python scripts/export_onnx_model.py --checkpoint artifacts/rawframe-model/model_state.pt --training-provenance artifacts/rawframe-model/calibrated-provenance.json --output web/public/model/asl-pilot-rawframe-v0.onnx`:
  exited `2` as expected with `ONNX export failed: training provenance architecture must match checkpoint architecture`, because the retained calibrated
  provenance is stale and no final passing calibration evidence was written for
  the new candidate.
- `node scripts/analyze_rawframe_model_failure.mjs --write`,
  `node scripts/plan_rawframe_data_remediation.mjs --write`, and
  `./.venv/bin/python scripts/analyze_rawframe_tensor_visuals.py --write`:
  passed after the clip-normalized evaluation and refreshed retained failure,
  remediation, and tensor visual diagnostics.
- `node scripts/audit_final_rawframe_pipeline_preflight.mjs --skip-completion-readiness --skip-decode-replay`:
  failed closed as expected with `status: blocked`,
  `final_acceptance_eligible: false`, `next_stage.id: evaluate_rawframe_model`,
  and blockers for the nonpassing validation report plus stale/nonfinal
  calibrated provenance. Downstream export, model-card, and browser evidence
  also remain invalid because they cannot be promoted from the failing
  calibration state.
- `node scripts/audit_completion_readiness.mjs --read-only --summary-only`:
  failed closed as expected with `mode: read_only`, `status: incomplete`,
  `passed: 47`, `failed: 7`, and `blocker_count: 7` when the local production
  server was available. The final raw-frame next stage remains
  `evaluate_rawframe_model`, blocked by the nonpassing validation report and
  stale/nonfinal calibrated provenance.
- `node scripts/audit_model_artifacts.mjs`: passed for the current fail-closed
  `not_trained` model-card status after the clip-normalized run.
- `npm --prefix web run build`: passed before refreshing the final privacy
  smoke.
- `env ASL_PILOT_STORE_PATH=data/asl-pilot-store.json ENABLE_DATASET_COLLECTION=false NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=false npm --prefix web run start -- --hostname 127.0.0.1 --port 3025`:
  started a short-lived local production server for live privacy evidence.
- `node scripts/run_final_privacy_smoke.mjs --app-url http://127.0.0.1:3025 --write`:
  passed and refreshed `docs/privacy/final-privacy-smoke.json` with root page
  status `200`, normal practice raw camera payload rejection status `400`,
  dataset clip/coverage endpoint statuses `403`, and no analytics/session-replay
  hosts found.
- `node scripts/run_final_privacy_smoke.mjs --app-url http://127.0.0.1:3025`:
  passed without rewriting while the short-lived local server was available.
- `node scripts/audit_final_privacy_smoke.mjs`: passed with report hash
  `3494cf077556265b1f011b2a4cb3c0dd13826ec2da5179a2a0d0fd15f52f1766`.
- `python3 -m py_compile scripts/analyze_rawframe_split_shift.py`: passed.
- `./.venv/bin/python scripts/analyze_rawframe_split_shift.py --write`:
  passed and wrote `docs/validation/rawframe-split-shift-diagnostic.json` with
  1,710 sampled tensors, 95 sampled labels, 570 samples per split, mean nearest
  own-split rate `0.46140350877192987`, validation nearest train-label centroid
  accuracy `0.010526315789473684`, test nearest train-label centroid accuracy
  `0.014035087719298246`, and the retained signal
  `low_level_train_label_centroids_do_not_generalize_to_heldout_splits`.
- `./.venv/bin/python scripts/analyze_rawframe_split_shift.py`: passed without
  rewriting and reproduced the retained split-shift summary.
- `node --check scripts/plan_rawframe_data_remediation.mjs`: passed after
  adding split-shift diagnostic input support.
- `node scripts/plan_rawframe_data_remediation.mjs --write`: passed and
  refreshed `docs/validation/rawframe-data-remediation-plan.json` with the
  split-shift diagnostic reference plus the current 77 priority labels and 18
  zero-recall-on-validation-and-test labels.
- `node scripts/export_rawframe_remediation_collection_queue.mjs --write`:
  passed and refreshed
  `data/dataset/rawframe-remediation-collection-queue.json` with
  `priority_label_count: 77`, 1,445 total assignments, and the current
  blockers for absent first-party store plus blocked NVIDIA metadata review.
- `node scripts/audit_rawframe_remediation_collection_queue.mjs --write`:
  passed and refreshed
  `docs/validation/rawframe-remediation-collection-queue-audit.json` with
  `passed_nonfinal_queue_audit`, 95 labels, 77 priority labels, 1,445
  assignments, and no findings.
- `node scripts/prepare_collection_session_bundle.mjs`: passed and refreshed
  `output/collection-handoff/collection-session-bundle/MANIFEST.json` with
  `ready_for_capture` status and remediation queue hash
  `eaaab49ca5750a4df9830c4a6471274e0ec28ac3c6a0a8dc9860814c9fe96d32`.
- `node scripts/audit_collection_session_bundle.mjs --require-ready`: passed
  with no blockers after the latest queue and bundle refresh.
- `node scripts/audit_collection_plan_contract.mjs`: passed, including the
  checks that the plan API exposes a current remediation queue and the
  collection panel orders assignments by queue while preserving assignment keys.
- `node scripts/audit_operator_handoff.mjs`: passed after the bundle refresh;
  the handoff artifact hashes still match current required files.
- `node scripts/audit_dataset_source_research.mjs`: passed after the planning
  prompt refresh; the public-source receipt remains SHA-256
  `9cf6c7211b96eb5e8f06b6ccd3856424519cf2c5bd1edd05de43f8208731b42f`.
- `node scripts/audit_collection_plan_contract.mjs`: passed after the planning
  prompt refresh; the API and collection panel still expose and preserve the
  current remediation queue ordering.
- `node scripts/audit_operator_handoff.mjs`: passed after the planning prompt
  refresh; handoff hashes still match current required source-curated files.
- `node scripts/audit_nvidia_asl_access_metadata.mjs`: failed closed as
  expected without writing because `docs/research/nvidia-asl-access-receipt.json`
  and `artifacts/dataset-research/nvidia-asl/metadata/` are absent.
- `node scripts/export_popsign_label_ladder_manifests.mjs --write`: passed and
  wrote the diagnostic 5/10/25/50/95 label-ladder manifest family plus
  `docs/validation/popsign-label-ladder-manifests.json`.
- `./.venv/bin/python scripts/train_rawframe_model.py ... --dry-run
  --check-files --allow-small-label-set`: passed for the 5, 10, 25, 50, and 95
  diagnostic ladder sizes.
- `./.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/diagnostics/popsign-label-ladder/005-labels/train.json --validation-manifest data/manifests/diagnostics/popsign-label-ladder/005-labels/validation.json --test-manifest data/manifests/diagnostics/popsign-label-ladder/005-labels/test.json --output-dir artifacts/rawframe-model-diagnostics/popsign-label-ladder/005-labels-motion-temporal --architecture motion_2d_temporal_cnn --check-files --epochs 50 --batch-size 16 --training-augmentation basic --label-smoothing 0.05 --checkpoint-selection best_validation --allow-small-label-set`:
  passed on MPS and wrote smoke-only diagnostic checkpoint/provenance artifacts.
- `./.venv/bin/python scripts/evaluate_rawframe_model.py --checkpoint artifacts/rawframe-model-diagnostics/popsign-label-ladder/005-labels-motion-temporal/model_state.pt --training-provenance artifacts/rawframe-model-diagnostics/popsign-label-ladder/005-labels-motion-temporal/training-provenance.json --train-manifest data/manifests/diagnostics/popsign-label-ladder/005-labels/train.json --validation-manifest data/manifests/diagnostics/popsign-label-ladder/005-labels/validation.json --test-manifest data/manifests/diagnostics/popsign-label-ladder/005-labels/test.json --challenge-manifest data/manifests/negative-challenge.json --output-report artifacts/rawframe-model-diagnostics/popsign-label-ladder/005-labels-motion-temporal/validation-report.json --calibrated-provenance artifacts/rawframe-model-diagnostics/popsign-label-ladder/005-labels-motion-temporal/calibrated-provenance.json --allow-smoke-eval`:
  passed as smoke-only evaluation with `status: smoke_only`,
  `passes_targets: false`, validation top-1 `0.632`, test top-1
  `0.5157894736842106`, and negative challenge false-pass `0.4`.
- `./.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/diagnostics/popsign-label-ladder/010-labels/train.json --validation-manifest data/manifests/diagnostics/popsign-label-ladder/010-labels/validation.json --test-manifest data/manifests/diagnostics/popsign-label-ladder/010-labels/test.json --output-dir artifacts/rawframe-model-diagnostics/popsign-label-ladder/010-labels-motion-temporal --architecture motion_2d_temporal_cnn --check-files --epochs 50 --batch-size 16 --training-augmentation basic --label-smoothing 0.05 --checkpoint-selection best_validation --allow-small-label-set`:
  passed on MPS, selected epoch 41 by validation accuracy, and wrote smoke-only
  diagnostic checkpoint/provenance artifacts.
- `./.venv/bin/python scripts/evaluate_rawframe_model.py --checkpoint artifacts/rawframe-model-diagnostics/popsign-label-ladder/010-labels-motion-temporal/model_state.pt --training-provenance artifacts/rawframe-model-diagnostics/popsign-label-ladder/010-labels-motion-temporal/training-provenance.json --train-manifest data/manifests/diagnostics/popsign-label-ladder/010-labels/train.json --validation-manifest data/manifests/diagnostics/popsign-label-ladder/010-labels/validation.json --test-manifest data/manifests/diagnostics/popsign-label-ladder/010-labels/test.json --challenge-manifest data/manifests/negative-challenge.json --output-report artifacts/rawframe-model-diagnostics/popsign-label-ladder/010-labels-motion-temporal/validation-report.json --calibrated-provenance artifacts/rawframe-model-diagnostics/popsign-label-ladder/010-labels-motion-temporal/calibrated-provenance.json --allow-smoke-eval`:
  passed as smoke-only evaluation with `status: smoke_only`,
  `passes_targets: false`, validation top-1 `0.372`, test top-1
  `0.3736842105263158`, and negative challenge false-pass `0.35`.
- `./.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/train.json --validation-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/validation.json --test-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/test.json --output-dir artifacts/rawframe-model-diagnostics/popsign-label-ladder/025-labels-motion-temporal --architecture motion_2d_temporal_cnn --check-files --epochs 50 --batch-size 16 --training-augmentation basic --label-smoothing 0.05 --checkpoint-selection best_validation --allow-small-label-set`:
  passed on MPS, selected epoch 36 by validation accuracy, and wrote smoke-only
  diagnostic checkpoint/provenance artifacts.
- `./.venv/bin/python scripts/evaluate_rawframe_model.py --checkpoint artifacts/rawframe-model-diagnostics/popsign-label-ladder/025-labels-motion-temporal/model_state.pt --training-provenance artifacts/rawframe-model-diagnostics/popsign-label-ladder/025-labels-motion-temporal/training-provenance.json --train-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/train.json --validation-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/validation.json --test-manifest data/manifests/diagnostics/popsign-label-ladder/025-labels/test.json --challenge-manifest data/manifests/negative-challenge.json --output-report artifacts/rawframe-model-diagnostics/popsign-label-ladder/025-labels-motion-temporal/validation-report.json --calibrated-provenance artifacts/rawframe-model-diagnostics/popsign-label-ladder/025-labels-motion-temporal/calibrated-provenance.json --allow-smoke-eval`:
  passed as smoke-only evaluation with `status: smoke_only`,
  `passes_targets: false`, validation top-1 `0.2048`, test top-1
  `0.2294736842105263`, and negative challenge false-pass `0.25`.
- `./.venv/bin/python scripts/train_rawframe_model.py --train-manifest data/manifests/diagnostics/popsign-label-ladder/050-labels/train.json --validation-manifest data/manifests/diagnostics/popsign-label-ladder/050-labels/validation.json --test-manifest data/manifests/diagnostics/popsign-label-ladder/050-labels/test.json --output-dir artifacts/rawframe-model-diagnostics/popsign-label-ladder/050-labels-motion-temporal --architecture motion_2d_temporal_cnn --check-files --epochs 50 --batch-size 16 --training-augmentation basic --label-smoothing 0.05 --checkpoint-selection best_validation --allow-small-label-set`:
  passed on MPS, selected epoch 23 by validation accuracy, and wrote smoke-only
  diagnostic checkpoint/provenance artifacts.
- `./.venv/bin/python scripts/evaluate_rawframe_model.py --checkpoint artifacts/rawframe-model-diagnostics/popsign-label-ladder/050-labels-motion-temporal/model_state.pt --training-provenance artifacts/rawframe-model-diagnostics/popsign-label-ladder/050-labels-motion-temporal/training-provenance.json --train-manifest data/manifests/diagnostics/popsign-label-ladder/050-labels/train.json --validation-manifest data/manifests/diagnostics/popsign-label-ladder/050-labels/validation.json --test-manifest data/manifests/diagnostics/popsign-label-ladder/050-labels/test.json --challenge-manifest data/manifests/negative-challenge.json --output-report artifacts/rawframe-model-diagnostics/popsign-label-ladder/050-labels-motion-temporal/validation-report.json --calibrated-provenance artifacts/rawframe-model-diagnostics/popsign-label-ladder/050-labels-motion-temporal/calibrated-provenance.json --allow-smoke-eval`:
  passed as smoke-only evaluation with `status: smoke_only`,
  `passes_targets: false`, validation top-1 `0.1312`, test top-1
  `0.15052631578947367`, and negative challenge false-pass `0.15`.
- `./.venv/bin/python scripts/evaluate_rawframe_model.py --checkpoint artifacts/rawframe-model/model_state.pt --training-provenance artifacts/rawframe-model/training-provenance.json --train-manifest data/manifests/train.json --validation-manifest data/manifests/validation.json --test-manifest data/manifests/test.json --challenge-manifest data/manifests/negative-challenge.json --output-report artifacts/rawframe-model/validation-report.json --calibrated-provenance artifacts/rawframe-model/calibrated-provenance.json`:
  exited nonzero as expected after the evaluator smoke-policy patch, refreshed
  the canonical failing final report, and wrote
  `output_report_sha256: 8ff8417201ae0fb3266b3adc105c2ce514380fb2422388f0fcc602d080d02ce9`.
- `node --check scripts/export_popsign_label_ladder_manifests.mjs`: passed.
- `./.venv/bin/python -m py_compile scripts/evaluate_rawframe_model.py`:
  passed.
- `node scripts/audit_completion_readiness.mjs --read-only --summary-only`:
  failed closed as expected at `2026-05-21T15:25:27.193Z` with
  `status: incomplete`, 46 passed checks, 8 failed checks, and
  `next_stage.id: evaluate_rawframe_model`.
- `git diff --check`: passed after the progress-ledger refresh.
- `rg -n '[[:blank:]]$' ...`: returned no trailing whitespace in the touched
  training, evaluation, final-evidence, diagnostic, and progress-ledger files.
- `ps ax -o pid=,command= | rg ... | rg -v ...`:
  returned no running jobs.

## Remaining

- Produce a model candidate that generalizes across held-out PopSign
  validation/test splits while staying raw-frame-only and from scratch.
- Complete source-rights review and raw-video availability probing before any
  MS-ASL or other online source enters manifests or training.
- Continue source-rights review and raw-video availability work for online or
  external sources. If NVIDIA is selected, obtain accepted access evidence and
  metadata-only staging before source-register review.
- If the available online/external evidence cannot support the current
  vocabulary, record an explicit reduced-scope pilot decision before more
  training.
- Write fresh `artifacts/rawframe-model/calibrated-provenance.json` only after
  evaluation status becomes `candidate_final_validation_passed`.
- Export ONNX and browser parity only from passing calibrated provenance.
- Keep the active browser model card fail-closed until final model artifacts
  pass the current audits.
- Run the full final audit suite after a passing candidate exists.

## Blockers

- Expanding PopSign from 950 train/validation clips to 2,375 train clips and
  2,375 validation clips improved held-out accuracy only modestly, while the
  test split remains capped at 1,805 clips by the approved source's `dog`
  availability.
- The first factorized 3D architecture attempt did not improve the result; it
  underfit in the 15-epoch run and produced worse false-pass behavior.
- The compact/basic best-validation rerun improved held-out test top-1 only
  slightly and regressed negative challenge false-pass behavior.
- The compact clip-normalized best-validation rerun improved held-out top-1 and
  negative challenge behavior slightly versus the prior best-validation compact
  checkpoint, but still remained near chance and failed every model-quality
  target gate.
- The latest motion-temporal architecture improved held-out test top-1 and
  macro-F1 versus earlier candidates, but it regressed negative challenge
  false-pass behavior and still remained near chance.
- The 5-label PopSign label-ladder diagnostic shows a favorable reduced
  candidate set can learn substantially better than the 95-way task, but it
  still only reaches validation top-1 `0.632`, test top-1
  `0.5157894736842106`, test false-pass `0.15789473684210525`, and negative
  challenge false-pass `0.4`. This is not close enough to make reduced PopSign
  scope a final-evidence substitute.
- The 10-label PopSign label-ladder diagnostic drops to validation top-1
  `0.372` and test top-1 `0.3736842105263158`, with negative challenge
  false-pass still `0.35`. This reinforces that the current PopSign-only
  route is not on a plausible path to the 75-100 label final target without
  new approved data or a materially different evidence-backed approach.
- The 25-label PopSign label-ladder diagnostic drops again to validation top-1
  `0.2048` and test top-1 `0.2294736842105263`, with negative challenge
  false-pass still `0.25`. This makes the learning-curve evidence strong
  enough that another same-family PopSign-only rerun is not the default next
  move.
- The 50-label PopSign label-ladder diagnostic lands at validation top-1
  `0.1312` and test top-1 `0.15052631578947367`, with negative challenge
  false-pass still `0.15`. The curve is now enough to close out the current
  PopSign-only ladder: the same model family can fit train clips but does not
  generalize to held-out signers as label scope grows.
- The retained tensor visual diagnostic did not find a sampled gross
  tensor-path, crop, blank-frame, or value-range issue across 72 inspected
  train/validation/test tensors, so there is no current evidence that a simple
  decode/preprocessing fix will explain the model-quality gap.
- The retained split-shift diagnostic shows low-level train-label centroids do
  not generalize to held-out splits: validation accuracy is
  `0.010526315789473684` and test accuracy is `0.014035087719298246` on sampled
  raw-frame RGB statistics. This argues against treating low-level
  color/brightness/statistics normalization as the next remedy.
- The canonical evaluation report now shows the failure is broadly held-out
  signer related: validation accuracy is low across all 8 validation signers,
  and the lowest test signer is still only 17/294 correct.
- Current online candidate research did not approve a new training source.
  MS-ASL has useful metadata and label overlap, but it needs source-register
  approval before import. The focused MS-ASL review leaves it in candidate-only
  status because the data points to upstream YouTube videos, C-UDA carries no
  rights warranty for the data, and availability attrition reduces the 50-label
  candidate to 14 labels that still meet the 20/5/5 public-row floor. That
  14-label scope is too small for the current 95-label final-model goal without
  explicit scope approval. PopSign v2 is still unreleased; ASL Citizen, WLASL,
  ASL-LEX, ASLLVD, and generic scraped datasets remain blocked or permission
  dependent for this project.
- First-party collection is not the active route after the 2026-05-25 user
  correction. Existing queue/session-bundle artifacts are planning evidence
  only and do not select browser-capture data for this plan.
- NVIDIA / ASL 1000 cannot be used as current training evidence because access
  has not been granted, the AWS S3 resource is controlled access, no protected
  local metadata or video hashes exist, and there is no source-register entry
  approving the exact raw-video-only import scope. The metadata audit now makes
  the missing access receipt and metadata staging directory explicit while
  retaining the public-source inventory, and any future receipt must carry
  `status: accepted_access_retained` plus hash-pinned accepted-access evidence
  before metadata review can proceed.
- Existing ONNX files under `web/public/model/` are not current final evidence;
  final export is intentionally refused until calibrated provenance passes.

## Next Step

Do not continue the factorized architecture exactly as configured, do not keep
rerunning compact 3D variants with small normalization or augmentation changes,
and do not repeat the same motion-temporal run without a materially new
generalization hypothesis. The motion-temporal family is now proven as a real
final-path candidate and is the best current-family result, but the gap to the
target gates is still too large for another small PopSign-only rerun to be the
default next step.

The sampled raw-frame tensor path now also looks sane, so a blind decode/crop
patch is not supported by the retained evidence. The 5, 10, 25, and 50-label
label-ladder diagnostics are also not strong enough to justify treating PopSign
reduced scope as a final substitute, and the curve degrades sharply as labels
are added. The next useful step is the data route: use the durable prompt
`docs/model/rawframe-non-first-party-data-route-goal-loop-prompt.md`; the
meaningful data steps are source-register-safe online/external raw-video
evidence, NVIDIA dataset access/source-rights review if accepted evidence
appears, or explicit reduced-scope approval. For the current goal, treat MS-ASL
as not viable at the current scope unless the project explicitly accepts a
14-label reduced pilot.
