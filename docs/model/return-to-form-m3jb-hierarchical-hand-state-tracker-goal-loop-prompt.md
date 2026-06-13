# M3JB - Hierarchical Hand State Tracker Goal Loop

## UPDATE (2026-06-11 current) - pipeline finalization active: run10 assignment demo

This update mirrors `GOAL.md` and supersedes the older recognizer-transformer
campaign text below, session-962's run10 promotion-track next-action token, and
the earlier 2026-06-11 run12 pipeline-finalization decision recorded in session
963 / commit `989381d2`.

Current active decision: **ship / preserve run10 for the assignment demo**,
retain run12 only as the rights-clean fallback / ablation, do not commission
Option B, and keep the product framed as a demo-only practice-feedback surface.

Operational consequences:

1. Run10 is the chosen assignment-demo recognizer over the scratch graph
   (region grid -> hands2 -> SimCC w48 -> 90-dim features). Receipts:
   `docs/validation/return-to-form-m3jb-recognizer-transformer-run10-simccw48-fulltrain-v1.json`,
   `docs/validation/return-to-form-m3jb-run10-trust-audit-v1.json`,
   `docs/validation/return-to-form-m3jb-run10-heldout-nearlive-eval-v1.json`,
   and `docs/validation/return-to-form-m3jb-run10-prod-deploy-v1.json`.
2. Do **not** swap the demo to run12 unless a new owner directive makes public
   weight-distribution constraints binding. Run12 remains useful evidence:
   `docs/validation/return-to-form-m3jb-run12-popsignonly-v1.json`.
3. Do **not** launch recognizer training, landmark training, Option B, or any
   Brev spend without a new human directive.
4. The demo stays fail-closed: no model-card promotion, no new claim lane,
   `activeLabels: []`, and user copy says "practice feedback", never "grading"
   or "assessment".
5. Remaining local slices: preserve / verify the run10 browser ONNX and
   threshold sidecar, ensure thresholds are monitor/validation-fit from run10,
   run JS<->Python parity if artifacts are touched, and record repeated-use
   `/practice` lifecycle proof.

## UPDATE (2026-06-03 current) — recognizer transformer distill campaign active

This update mirrors `GOAL.md` commit `9eea8e7` and supersedes the landmark-PCK
campaign below. The old landmark work is paused as historical context; its
quality still matters as the recognizer's long-term ceiling, but the active
executor mission is now:
`m3jb_recognizer_transformer_distill_campaign_brev`.

Current next action after session 958:
`m3jb_recognizer_transformer_run9_retention_enabled_wait_for_human_brev_login_confirmation`.

Goal: train a from-scratch Transformer sign recognizer, using a distilled
landmark-sequence student, for the MVP "given-a-word, did you sign it
correctly" verification flow. Baseline to beat is the GRU student
`output/recognizer-distill.json`: test top-1 `0.232`, top-5 `0.567`, and about
recall@FAR10 `0.7`. Primary metric is verification recall@FAR10; top-1/top-5
are secondary.

The training code is already built, tested, and smoke-passing in the annotator
worktree plan `docs/superpowers/plans/2026-06-03-transformer-sign-recognizer.md`:
`seq_transformer.py`, `verification.py`, and `train_recognizer_distill.py
--student-arch transformer`, which reports `verification_recall_at_far10` in
its receipt. Local MPS smoke ran end-to-end; MPS needs
`PYTORCH_ENABLE_MPS_FALLBACK=1`, while CUDA does not.

Bounded-by-current-mission Brev approval is recorded in `GOAL.md` and mirrored
here for the active prompt: user 2026-06-03 said "we have infinite Brev compute,
don't artificially handicap yourself if more compute would help." For this
recognizer campaign, use full data with no artificial `--limit-*` caps, generous
epochs (`>=120`), and larger Transformer settings when they help. The old
landmark-PCK `$50` cap does not apply to this recognizer campaign. Run on
retained worker `asl-pilot-m3eh-l40s-001` / `3d58wpy9o` or any healthy NVIDIA
worker. Stop the worker whenever no run is active.

Smallest useful slice order:

1. Preflight + sync. Stop any leftover landmark training on the worker. Ensure
   the recognizer code (`seq_transformer.py`, `verification.py`, updated
   `train_recognizer_distill.py`) and feature caches `.cache/recog-seq-w64-merged`
   (215M) plus `.cache/handcrop-lm2` (1.3G) are on the worker, or precompute
   teacher logits locally and sync only the student cache plus logits. Record the
   sync in the receipt.
2. Train full-scope on CUDA:
   `train_recognizer_distill.py --student-arch transformer --device cuda` with
   full data, `>=120` epochs, selected d_model/n_layers/n_heads/dropout/lr, and
   no `--limit-*`.
3. Eval + report test top-1, top-5, and `verification_recall_at_far10`; compare
   to the running best, copy back `.pt` plus receipt, and stop the worker when no
   run is active.
4. Use the research escalation (`gpt-pro-research`; fallback
   `openai-api-research` / `gpt-5.5`) to pick the next levers
   (d_model/n_layers/n_heads, dropout, lr/schedule, sequence length,
   jitter/frame-drop/landmark-noise augmentation, distill alpha + temperature).
   Save request/response under `artifacts/research/` and iterate.

Stop and report to the human when verification recall@FAR10 clears `>= 0.85`,
or when it plateaus across 3 consecutive research-guided runs with no
running-best improvement. Boundaries remain unchanged: scratch-trained
recognizer only, MediaPipe offline teacher only, browser/runtime promotion
fail-closed until gates pass, and no pretrained runtime dependency.

Session 912 completed the Preflight + sync slice and recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-preflight-sync-v1.json`.
The retained worker `asl-pilot-m3eh-l40s-001` / `3d58wpy9o` was started under
the recognizer approval, no leftover landmark or recognizer training process was
found, CUDA was visible (`NVIDIA L40S`, PyTorch `2.12.0+cu126`), and the scoped
recognizer runnable set from annotator commit `03b2d1b` was synced and
hash-verified: `seq_transformer.py`, `verification.py`,
`train_recognizer_distill.py`, `test_verification.py`,
`output/recognizer-v1.pt`, `output/recognizer-distill.{json,pt}`,
`.cache/recog-seq-w64-merged` (`206683` rows), and `.cache/handcrop-lm2`
(`27286` rows, frames `(27286,128,128,3)`). Remote verification tests,
`SeqTransformer` self-test, and a no-save zero-epoch CUDA trainer load check
passed. No full-scope training or checkpoint write occurred. The worker is
`RUNNING` / `READY` / `HEALTHY` for the next approved full-train slice.

Session 913 completed the first full-scope CUDA Transformer run and recorded it
at
`docs/validation/return-to-form-m3jb-recognizer-transformer-fulltrain-run1-v1.json`.
The run used full data with no `--limit-*` flags (`160` epochs, batch `256`,
`d_model=256`, `n_layers=6`, `n_heads=8`, lr `1e-3`) and copied back `.json`
plus `.pt` artifacts to the annotator worktree. Metrics collapsed below the GRU
baseline: test top-1 `0.008`, top-5 `0.0502`, verification recall@FAR10
`0.1124` versus baseline top-1 `0.232`, top-5 `0.567`, recall@FAR10 about
`0.7`. Monitor top-1 stayed near `0.019` for all 160 epochs. This is rejected
fail-closed, with no browser promotion or final-gate change. Teardown attempted
`brev stop` by name, id, and `--all`; final Brev state for
`asl-pilot-m3eh-l40s-001` / `3d58wpy9o` was `STOPPED` / `NOT READY` /
`HEALTHY`. Do research-guided metric triage/tuning before any second recognizer
Brev run.

Session 914 completed that no-Brev research triage and recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-run1-research-triage-v1.json`.
The ChatGPT Pro/browser route was unavailable in the current callable tool set,
so the prompt-authorized `openai-api-research` / `gpt-5.5` fallback saved
request/response artifacts under
`artifacts/research/m3jb-recognizer-transformer-run1-triage-914/`. The memo
treats run1's flat loss as a Transformer training-path/optimization failure
before a scaling question: GRU loss fell from about `8.5` to `1.1`, while
Transformer loss stayed around `8.55`. Do not launch another blind full-scope
Brev run. Next action is local no-save overfit diagnostics: capture trainer
help, add/use train-subset and gradient/logit diagnostics, compare tiny
hard-label/no-augmentation GRU and Transformer overfit checks, and only then
select a second full-scope recipe if the Transformer proves it can learn locally.

Session 915 completed those local no-save diagnostics and recorded them at
`docs/validation/return-to-form-m3jb-recognizer-local-overfit-diagnostics-v1.json`.
Side-worktree commit `3f9d3f0` added opt-in diagnostic receipt support to
`train_recognizer_distill.py` plus a helper test. The GRU control overfit the
same `32` hard-label/no-augmentation clips (`4.5801 -> 0.0103`, history-best
train top-1 `1.000`), proving the diagnostic setup can learn. The run1
Transformer shape (`d_model=256`, `n_layers=6`, `n_heads=8`, dropout `0`) did
not overfit (`4.5442 -> 2.6501`, history-best train top-1 `0.250`, final train
predictions used only `2` classes). Do not launch a second Brev run. Next action
is local Transformer-specific debugging before any full-scope compute: isolate
CLS/pooling behavior, model size, optimizer/schedule, or trainer wiring.

Session 916 completed that no-Brev local debugging and recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-tiny-failure-debug-v1.json`.
The existing `SeqTransformer` self-test passed. A smaller CLS Transformer
(`d_model=64`, `n_layers=2`, `n_heads=4`, lr `2e-3`) overfit the same 32
hard-label/no-augmentation clips (`4.5943 -> 0.0071`, history-best train top-1
`1.000`). The run1-sized Transformer (`d_model=256`, `n_layers=6`,
`n_heads=8`, dropout `0`) also overfit when lr was reduced from `1e-3` to
`5e-4` (`4.5488 -> 0.0068`, history-best train top-1 `1.000`). This isolates
the session-915 tiny failure to the run1 learning-rate/optimization setting,
not CLS/pooling, trainer wiring, or model size.

Next action: `m3jb_recognizer_transformer_low_lr_fulltrain_brev_ok`. Do one
full-scope CUDA run on the retained NVIDIA worker using the run1 shape with lr
`5e-4`: full data, no `--limit-*`, `--student-arch transformer`, `--device cuda`,
`--epochs 200`, `--batch 256`, `--d-model 256`, `--n-layers 6`, `--n-heads 8`,
`--dropout 0.0`, default distillation mix unless a current receipt says
otherwise. Copy back `.json` and `.pt`, report top-1/top-5 and
`verification_recall_at_far10` against the GRU baseline, then stop the worker
and verify it is stopped.

Session 917 attempted that approved Brev fulltrain slice but stopped at remote
preflight before any sync or training. It is recorded at
`docs/validation/return-to-form-m3jb-recognizer-low-lr-fulltrain-brev-preflight-blocker-v1.json`.
The retained worker `asl-pilot-m3eh-l40s-001` / `3d58wpy9o` initially listed
`STOPPED` / `NOT READY` / `HEALTHY`, but after `brev start` the SSH/CUDA
preflight could not connect and the worker degraded to `UNHEALTHY`. Stop by
name, stop by id, and `brev stop --all` were used; final state is `STOPPED` /
`NOT READY` / `UNHEALTHY`. No code sync, remote command, training, checkpoint,
copyback, browser promotion, raw upload, pretrained runtime dependency, or
final-gate change occurred.

Session 917 next action was
`m3jb_recognizer_transformer_low_lr_fulltrain_brev_retry_after_worker_health_ok`.
That retry first required `brev ls --json`. Launch the low-LR full-scope command
only if a worker is healthy and SSH/CUDA preflight succeeds. If the retained
worker remains unhealthy, use an already healthy equivalent NVIDIA worker under
the recorded recognizer approval; do not delete/reset infrastructure or create a
new worker without explicit human approval.

Session 918 completed that read-only Brev health refresh and recorded it at
`docs/validation/return-to-form-m3jb-recognizer-brev-worker-health-refresh-v1.json`.
Both existing NVIDIA workers were unavailable for launch: retained worker
`asl-pilot-m3eh-l40s-001` / `3d58wpy9o` listed `UNHEALTHY` / `READY` /
`UNHEALTHY`, and `asl-pilot-m3jb-pairrank-l40s-001` / `h15cj91es` listed
`STOPPED` / `NOT READY` / `UNHEALTHY`. No `brev start`, `brev exec`, sync,
training, checkpoint, copyback, browser promotion, raw upload, pretrained
runtime dependency, or final-gate change occurred.

Session 918 next action:
`m3jb_recognizer_transformer_low_lr_fulltrain_wait_for_healthy_brev_worker_or_infra_approval`.
Retry the same low-LR full-scope CUDA run only if an already existing NVIDIA
worker is healthy and SSH/CUDA/process preflight succeeds. Otherwise get
explicit human approval before creating, deleting, resetting, or repairing Brev
infrastructure.

Session 919 completed the low-LR full-scope run2 Brev slice and recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-fulltrain-run2-lowlr-brev-v1.json`.
A fresh read-only `brev ls --json` showed retained worker
`asl-pilot-m3eh-l40s-001` / `3d58wpy9o` recovered to `RUNNING` / `READY` /
`HEALTHY`, so the approved run proceeded. SSH/CUDA preflight passed on
`NVIDIA L40S`; no active training process was found. The remote trainer was
updated from stale hash
`ef0ea703c1ae219725960069cfdbde92afa0b21a98b033ffb2076b989d40f974` to current
annotator hash
`92890d4f2ab650b4455deee7f3988138011099ae58eb72a087955fce223d9a4d`; the other
recognizer files already matched. The run used full data with no `--limit-*`
flags (`200` epochs, batch `256`, `d_model=256`, `n_layers=6`, `n_heads=8`,
dropout `0.0`, lr `5e-4`) and copied back `.json` plus `.pt` artifacts to the
annotator worktree. Metrics: test top-1 `0.2609`, top-5 `0.5635`,
verification recall@FAR10 `0.686`; monitor best top-1 `0.3497`, top-5 `0.6335`
at epoch `199`; final loss `0.2224`. This learns, but remains fail-closed
below the primary verification target `>=0.85` and slightly below the GRU
verification baseline of about `0.7`. Browser/runtime promotion and final-gate
changes remain forbidden. Teardown used `brev stop` by name, then by id after
the name stop still showed `RUNNING`; final state was `STOPPED` / `NOT READY` /
`HEALTHY`.

Session 919 next action was:
`m3jb_recognizer_transformer_run2_research_guided_tuning_no_brev`.
Do not launch run3 blindly. Use the research escalation (`gpt-pro-research`;
fallback `openai-api-research` / `gpt-5.5`) to select the next levers from the
run2 receipt: sequence length/window, LR schedule/warmup, distillation
alpha/temperature, augmentation strength, and model regularization/capacity.
Save request/response under `artifacts/research/`, record a run3 recipe, and
keep browser/runtime fail-closed.

Session 920 completed that no-Brev research-guided tuning slice and recorded it
at
`docs/validation/return-to-form-m3jb-recognizer-transformer-run2-research-tuning-v1.json`.
The ChatGPT Pro/browser route was attempted through the Browser plugin setup,
but no session-owned `iab` backend was available, so the prompt-authorized
`openai-api-research` / `gpt-5.5` fallback saved request/response artifacts
under `artifacts/research/m3jb-recognizer-transformer-run2-tuning-920/`. The
complete memo recommends treating run2 as under-optimized rather than
architecture-broken: monitor top-1 was best at epoch `199`, run2 used only
`5600` optimizer steps versus the GRU's approximate `8760`, and the fixed LR
path likely limited verification-margin refinement. Selected run3 recipe is
Transformer d256/l6/h8, batch `128`, epochs `240`, lr `5e-4`, warmup `500`
steps, cosine decay to min lr `5e-5`, dropout `0.0`, alpha `0.55`,
temperature `3.0`, jitter `0.02`, frame-drop `0.10`, full data with no
`--limit-*`, expected `13200` optimizer steps. Current trainer lacks
scheduler/warmup flags, so do not launch Brev run3 yet.

Session 921 completed that local/no-Brev scheduler preflight and recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-lr-schedule-preflight-v1.json`.
Completed `m3jb_recognizer_transformer_lr_schedule_preflight_no_brev` without
Brev, remote sync, or checkpoint output. Side-worktree commit `8a780ae` added
fixed-default scheduler flags (`--lr-scheduler`, `--warmup-steps`, `--min-lr`)
and receipt fields for expected steps, scheduler config, and per-epoch LR
trace; trainer sha256
`bfa4ed698da20561e3b3005f56467edec42161f0269e3fc57535c7701b392898`.
Fixed-LR defaults and zero-epoch load checks are preserved. Local no-save tiny
overfit with cosine warmup/decay reached history-best train top-1 `1.000` and
final train top-1 `1.000` with no checkpoint. The full-data no-save smoke used
no `--limit-*` flags and recorded train `7011`, monitor `955`, test `2369`,
`55` expected optimizer steps for one epoch, and scheduler decay from `0.0005`
to `0.00005`.

Current next action:
`m3jb_recognizer_transformer_run3_scheduler_fulltrain_brev_ok`.
After read-only `brev ls --json` and remote SSH/CUDA/process preflight on a
healthy NVIDIA worker, sync/hash-verify the scheduler trainer, run the full-data
CUDA recipe (epochs `240`, batch `128`, lr `5e-4`, warmup `500`, cosine min lr
`5e-5`, expected optimizer steps `13200`, no `--limit-*`), copy back `.json` /
`.pt`, and stop the worker. Kill before or during run3 on wrong counts, wrong
scheduler trace, accidental limit flags, NaNs, broken eval, near-chance monitor
at about 40 epochs, clearly behind run2 at run2-equivalent steps, or flat below
about `0.70` verification signal after about 160 epochs.

Session 922 completed that approved run3 scheduler fulltrain slice and recorded
it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-fulltrain-run3-scheduler-brev-v1.json`.
The retained worker `asl-pilot-m3eh-l40s-001` / `3d58wpy9o` started from
`STOPPED` / `NOT READY` / `HEALTHY`; SSH/CUDA/process preflight passed on
`NVIDIA L40S`, and the scheduler trainer/support files were synced and
hash-verified. The run used full data with no `--limit-*` flags: train `7011`,
monitor `955`, test `2369`, classes `95`, epochs `240`, batch `128`, lr
`5e-4`, warmup `500`, cosine min lr `5e-5`, expected optimizer steps `13200`,
d256/l6/h8, dropout `0.0`, alpha `0.55`, temperature `3.0`, jitter `0.02`, and
frame-drop `0.10`. It improved the recognizer running best but still missed the
MVP verification gate: test top-1 `0.2984`, top-5 `0.6036`, verification recall@FAR10 `0.7316`, best monitor top-1 `0.378` at epoch `184`, versus run2
recall `0.686`, GRU recall baseline about `0.7`, and target `>=0.85`. Copied
artifacts are ignored in the annotator worktree and verified by hash: JSON
`bbdd8a16f2e0142b388dbcf5303db05c329ddbbf9ae9ddfea3b1181b4e7deca3`, checkpoint
`aaecd21c5bde0123d5aee84e65bc40ddbccc65c05ade75887569b92bb431d329`, and log
`3e8fb213a2899c1376e0cdeb9b56942a8ad7785824db83c430543244555dd0a9`. This is
rejected fail-closed: no browser/runtime promotion, raw upload, pretrained
runtime dependency, final-gate change, or push occurred. Teardown used
`brev stop` by name, by id after `STOPPING` persisted, then `brev stop --all`;
final state was `STOPPED` / `NOT READY` / `HEALTHY`.

Session 923 completed the no-Brev
`m3jb_recognizer_transformer_run3_research_guided_tuning_no_brev` slice and
recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-run3-research-tuning-v1.json`.
The required ChatGPT Pro/browser route was attempted, but no session-owned
`iab` backend was available, so the prompt-authorized `openai-api-research` /
`gpt-5.5` fallback saved request/response artifacts under
`artifacts/research/m3jb-recognizer-transformer-run3-tuning-923/`. The complete
memo treats run3 as an optimizer/update-density success that is now likely
representation/generalization-limited: train loss reached `0.0754`, late
monitor top-1 hovered near `0.35`-`0.37`, and verification recall@FAR10 remains
`0.7316` versus target `>=0.85`. Selected next action is
`m3jb_recognizer_transformer_t32_cache_loader_preflight_no_brev`: implement and
locally validate T=32 recognizer cache/loader support before any paid run4. The
future run4 recipe, if preflight passes, keeps run3 hyperparameters fixed
(d256/l6/h8, batch `128`, epochs `240`, lr `5e-4`, warmup `500`, cosine min lr
`5e-5`, alpha `0.55`, temperature `3.0`, jitter `0.02`, frame-drop `0.10`) and
changes only the audited sequence length/cache from T=20 to T=32. This slice
did not launch Brev, train, checkpoint, promote browser artifacts, upload raw
video, add pretrained runtime dependencies, change final gates, or push.

Session 924 completed the local/no-Brev
`m3jb_recognizer_transformer_t32_cache_loader_preflight_no_brev` slice and
recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-t32-cache-loader-preflight-v1.json`.
Side-worktree commit `46cd3dd` added recognizer trainer support for
`--seq-len` and `--dry-run-forward`; trainer sha256
`a45f3294a7d227beacf069638bf0589c66c3d960ad87d1b912ced17ceeec1186`.
The current `.cache/recog-seq-w64-merged` cache is still T=20, so the negative
guard correctly failed with `expected sequence length 32 but loaded T 20`.
The focused dry-run receipt
`docs/validation/m3jb-recognizer-t32-loader-preflight-dryrun-current-t20-v1.json`
proves the new loader path can run one no-grad Transformer batch on the current
cache with logits `[4, 95]`, optimizer steps `0`, expected optimizer steps `0`,
and `weights` null / no checkpoint. This slice did not launch Brev, train,
call optimizer/backward, checkpoint, promote browser artifacts, upload raw
video, add pretrained runtime dependencies, change final gates, or push.

Session 924 selected next action:
`m3jb_recognizer_transformer_t32_cache_materialize_validate_no_brev`.
Materialize a local T=32 student cache, run
`train_recognizer_distill.py --student-data <T32 cache> --seq-len 32
--dry-run-forward` against it, record cache path/count/hash evidence and a
zero-step dry-run receipt, then only consider the paid run4 recipe if that
local preflight passes.

Session 925 completed the local/no-Brev
`m3jb_recognizer_transformer_t32_cache_materialize_validate_no_brev` slice and
recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-t32-cache-smoke-validate-v1.json`.
The side cache `.cache/recog-seq-w64-t32-cpw1-v1/rows.json` was materialized
with `--clips-per-word 1 --frames-per-clip 32`, producing `9120` rows, `285`
clips, all `95` labels, split counts `95/95/95`, frame count `32` for every
clip, and rows sha256
`4a5b90792362a8ffa8498aa0eed6632cf7bb76afa0d8b1d9f61a3c9e3bd51116`.
The focused dry-run receipt
`docs/validation/m3jb-recognizer-t32-cache-smoke-dryrun-cpw1-v1.json` proves
`train_recognizer_distill.py --student-data .cache/recog-seq-w64-t32-cpw1-v1
--seq-len 32 --dry-run-forward` loads the T=32 cache with logits `[8, 95]`,
optimizer steps `0`, expected optimizer steps `0`, and `weights` null / no
checkpoint. This is an all-label smoke cache, not the full run4 cache. This
slice did not launch Brev, train, call optimizer/backward, checkpoint, promote
browser artifacts, upload raw video, add pretrained runtime dependencies,
change final gates, or push.

Current next action:
`m3jb_recognizer_transformer_t32_full_cache_materialize_validate_no_brev`.
Materialize and validate the full T=32 student cache locally before any paid
run4.

Session 926 completed that local/no-Brev
`m3jb_recognizer_transformer_t32_full_cache_materialize_validate_no_brev` slice
and recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-t32-full-cache-validate-v1.json`.
The side cache `.cache/recog-seq-w64-t32-merged-v1/rows.json` was materialized
directly from PopSign plus ASL Citizen with `frames_per_clip 32`,
`detector0-grid-big2.pt`, and `detector0-hand-landmarks-merged-w64.pt`,
producing `330309` rows, `10335` clips, all `95` labels, split counts train
`5591` / validation `2375` / test `2369`, source clips PopSign `7119` plus
ASL Citizen `3216`, length range `15..32`, and rows sha256
`4dc3f61018a0faf7dccdc7f3653075650683b741bf7d6f7ebde2be878dd9eb9f`.
The focused dry-run receipt
`docs/validation/m3jb-recognizer-t32-full-cache-dryrun-v1.json` proves
`train_recognizer_distill.py --student-data .cache/recog-seq-w64-t32-merged-v1
--seq-len 32 --dry-run-forward` loads the full T=32 cache with logits `[128, 95]`,
optimizer steps `0`, expected optimizer steps `0`, planned optimizer steps `13200`,
and `weights` null / no checkpoint. This slice did
not launch Brev, train, call optimizer/backward, checkpoint, promote browser
artifacts, upload raw video, add pretrained runtime dependencies, change final
gates, or push.

Selected run4 action:
`m3jb_recognizer_transformer_run4_t32_fulltrain_brev_ok`.
After read-only `brev ls --json` and SSH/CUDA/process preflight on a healthy
approved NVIDIA worker, sync/hash-verify the full T=32 cache plus current
recognizer trainer/support files, run the full-data CUDA run4 recipe with no
`--limit-*` flags (same run3 hyperparameters, `--seq-len 32`, expected `13200`
optimizer steps), copy back `.json` / `.pt` / log artifacts, and stop the
worker. Kill before or during run4 on wrong cache hash/counts/T/classes,
accidental limit flags, wrong scheduler trace, CUDA/process preflight failure,
NaNs, broken eval, near-chance monitor around epoch 40, or clearly behind run3
at comparable update density.

Session 927 attempted that approved Brev run4 preflight and recorded the blocker
at
`docs/validation/return-to-form-m3jb-recognizer-transformer-run4-t32-brev-preflight-blocker-v1.json`.
Initial `brev ls --json` showed retained `asl-pilot-m3eh-l40s-001` /
`3d58wpy9o` as `STOPPED` / `NOT READY` / `HEALTHY` and the other L40S as
`STOPPED` / `NOT READY` / `UNHEALTHY`. After `brev start`, the retained worker
reached `RUNNING` / `READY` / `UNAVAILABLE`, but the 300-second remote
SSH/CUDA/process preflight timed out with repeated "waiting for SSH connection
to be available" after an SSH port-22 timeout. Local hash inventory passed for
the scoped recognizer files, teacher artifacts, `.cache/handcrop-lm2`, and full
T=32 cache (`rows.json` sha256
`4dc3f61018a0faf7dccdc7f3653075650683b741bf7d6f7ebde2be878dd9eb9f`). No remote
sync, training, checkpoint, artifact copyback, browser promotion, raw upload,
pretrained runtime dependency, final-gate change, or push occurred. Teardown
used `brev stop` by name, by id, and `brev stop --all`; final `brev ls --json`
shows both existing L40S workers stopped, with retained final state `STOPPED` /
`NOT READY` / `UNHEALTHY`.

Session 928 completed the read-only Brev health refresh and recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-run4-t32-brev-health-refresh-v1.json`.
The initial read-only Brev inventory found both existing L40S workspaces were still
`STOPPED` / `NOT READY` / `UNHEALTHY`: retained
`asl-pilot-m3eh-l40s-001` / `3d58wpy9o` and
`asl-pilot-m3jb-pairrank-l40s-001` / `h15cj91es`. Final read-only validation later showed retained `asl-pilot-m3eh-l40s-001` / `3d58wpy9o` recovered to
`RUNNING` / `READY` / `HEALTHY` without any lifecycle command from this slice.
No Brev lifecycle, remote exec, sync, training, checkpoint, artifact copyback,
browser promotion, raw upload, pretrained runtime dependency, final-gate
change, or push occurred. The recovered retained worker was not stopped merely because it is `RUNNING` while approved run4 work remains queued. The next action remains
`m3jb_recognizer_transformer_run4_t32_wait_for_healthy_brev_worker_or_infra_approval`:
start the next slice with SSH/CUDA/process preflight on the recovered retained
worker, proceed with the same T=32 run4 recipe only if that preflight succeeds,
or get explicit human approval before creating, deleting, resetting, or repairing Brev infrastructure.

Session 929 completed the approved run4 T=32 fulltrain and recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-fulltrain-run4-t32-brev-v1.json`.
The next-slice SSH/CUDA/process preflight passed on retained
`asl-pilot-m3eh-l40s-001` / `3d58wpy9o` (`NVIDIA L40S`, PyTorch
`2.12.0+cu126`, no conflicting training process), the current trainer and full
T=32 cache were synced and hash-verified, and the CUDA dry-run loaded
`10335` clips / `95` classes / T=32 with logits `[128, 95]` and zero optimizer
steps. The full run used no `--limit-*` flags and completed the same run3
recipe with only the audited T=32 cache/`--seq-len 32` changed: epochs `240`,
batch `128`, lr `5e-4`, warmup `500`, cosine min lr `5e-5`, d256/l6/h8,
alpha `0.55`, temperature `3.0`, jitter `0.02`, frame-drop `0.10`, and
expected/actual optimizer steps `13200`. It improves the recognizer running
best but remains fail-closed below the MVP gate: verification recall@FAR10
`0.7626` versus run3 `0.7316` and target `>=0.85`, test top-1 `0.3132`, test
top-5 `0.6214`, and best monitor top-1 `0.3927` at epoch `226`. Copied
artifacts are ignored in the annotator worktree and verified by hash: JSON `7ac36c2517d3448526944a21386bee45957e659904bd2d9e6430690f0b71f279`,
checkpoint `8ffc6fa5ccc01361a3b466a3c65c1f058ab125db1e9fb8cfc977474ef8ab2dc4`,
log `5598205d6fe70bd3c3890c9bbae2db92666916477235281619df4c18312f342e`, and
pretrain dry-run receipt
`47cb4aafc8d72d92136b3ebb2ca2db36c2a1d56c457722b5e84201e5d243213a`. No browser/runtime promotion, raw upload, pretrained runtime dependency,
final-gate change, or push occurred. The worker was stopped after copyback;
final Brev state was `STOPPED` / `NOT READY` / `HEALTHY`.

Current next action:
`m3jb_recognizer_transformer_run4_research_guided_tuning_no_brev`.
Use the prompt-authorized research escalation (`gpt-pro-research`; fallback
`openai-api-research` / `gpt-5.5`) to choose the next recognizer levers from
run4's improved-but-below-gate result before any further paid Brev run. Keep
browser/runtime promotion fail-closed.

Session 930 completed that no-Brev
`m3jb_recognizer_transformer_run4_research_guided_tuning_no_brev` slice and
recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-run4-research-tuning-v1.json`.
The required ChatGPT Pro/browser route was checked, but no browser-control/iab
tool was exposed in the current callable tool set, so the prompt-authorized
`openai-api-research` / `gpt-5.5` fallback saved request/response artifacts
under `artifacts/research/m3jb-recognizer-transformer-run4-tuning-930/`. The
memo recommends that T=40 should wait because T=32 gained only `+0.0310`
recall@FAR10 while the remaining gate gap is `0.0874`, so the next bottleneck
is likely embedding separation/calibration for verification. Selected next
action:
`m3jb_recognizer_transformer_run5_supcon_aux_loss_preflight_no_brev`.
Implement disabled-by-default training-only supervised contrastive support
(`--supcon-weight`, `--supcon-temperature`) on the existing T=32 Transformer
path. The preflight must prove `--supcon-weight 0.0` preserves the run4 CE/KD
path, run a local dry-run-forward with zero optimizer steps and no checkpoint,
and record finite CE/KD plus supervised contrastive diagnostics before any paid
run5. No Brev lifecycle occurred. No training run occurred. No remote mutation,
optimizer/backward step, checkpoint, browser promotion, raw learner upload,
pretrained runtime dependency, final-gate change, or push occurred.

Session 931 completed that local/no-Brev
`m3jb_recognizer_transformer_run5_supcon_aux_loss_preflight_no_brev` slice and
recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-run5-supcon-preflight-v1.json`.
Side-worktree commit `896d5fb` adds disabled-by-default training-only
supervised contrastive support (`--supcon-weight`, `--supcon-temperature`) and
optional normalized Transformer CLS embeddings without changing the default
logits-only runtime inference path. The zero-weight focused dry-run
`docs/validation/m3jb-recognizer-run5-supcon-preflight-zero-weight-dryrun-v1.json`
loaded the full T=32 cache with `10335` clips, train/monitor/test
`7011/955/2369`, logits `[128, 95]`, CE/KD base loss `7.84514`, total loss
`7.84514`, optimizer steps `0`, expected dry-run steps `0`, planned paid steps
`13200`, and `weights` null. The weighted dry-run
`docs/validation/m3jb-recognizer-run5-supcon-preflight-weight005-dryrun-v1.json`
kept the same CE/KD base loss `7.84514`, added finite supervised-contrastive
loss `4.918027` with weighted loss `0.245901`, `89` positive anchors, `200`
positive pairs, embedding dim `256`, logits `[128, 95]`, optimizer steps `0`,
expected dry-run steps `0`, planned paid steps `13200`, and `weights` null.
Read-only `brev ls --json` showed retained `asl-pilot-m3eh-l40s-001` /
`3d58wpy9o` as `STOPPED` / `NOT READY` / `HEALTHY`. No Brev lifecycle,
remote sync, training run, optimizer/backward step, checkpoint, browser
promotion, raw learner upload, pretrained runtime dependency, final-gate
change, or push occurred.

Session 932 completed the approved Brev
`m3jb_recognizer_transformer_run5_supcon_fulltrain_brev_ok` slice and recorded it
at
`docs/validation/return-to-form-m3jb-recognizer-transformer-fulltrain-run5-supcon-brev-v1.json`.
The retained worker `asl-pilot-m3eh-l40s-001` / `3d58wpy9o` started from
`STOPPED` / `NOT READY` / `HEALTHY`, passed SSH/CUDA/process preflight on
`NVIDIA L40S`, and only the run5-scoped side commit `896d5fb` recognizer files
were synced. Remote hashes matched the side commit and existing T=32/teacher
artifacts. The CUDA pretrain dry-run
`tools/detector0-annotator/output/m3jb-recognizer-transformer-run5-supcon-pretrain-dryrun-v1.json`
loaded `10335` clips / `95` classes / T=32 with logits `[128, 95]`, finite
CE/KD/SupCon, `96` positive anchors, optimizer steps `0`, expected dry-run
steps `0`, planned paid steps `13200`, and no checkpoint.

The full run used no `--limit-*` flags and completed the T=32 run5 recipe:
epochs `240`, batch `128`, lr `5e-4`, warmup `500`, cosine min lr `5e-5`,
d256/l6/h8, dropout `0.0`, alpha `0.55`, temperature `3.0`, jitter `0.02`,
frame-drop `0.10`, `--supcon-weight 0.05`, `--supcon-temperature 0.10`, and
expected/actual optimizer steps `13200`. SupCon stayed nonzero in training
(best-monitor epoch loss `0.73004`, weighted loss `0.036502`, positive anchors
`5193`). The result is rejected fail-closed below the MVP gate: verification
recall@FAR10 `0.7601` versus run4 `0.7626` and target `>=0.85`, test top-1
`0.3369`, test top-5 `0.6235`, and best monitor top-1 `0.4073` at epoch `178`.
Copied artifacts are ignored in the annotator worktree and verified by hash:
JSON `17cd25882093b750c45b58b434f0ea9717cb51564739177fb8eb2c6ae5523158`,
checkpoint `7c685a856c1b054b22b53a09cb9a1a4edc51b1c9a41a70b030e2d05aced8ab58`,
log `bef427391cc33db8af8e18b5fb679496d7c39b44f14f482290b7230fc6ec7b61`, and
pretrain dry-run receipt `b7f7b1a7f307af6a492d52b4931c4809dea48c85d73e50277e390b031ba47af2`. No
browser/runtime promotion, raw upload, pretrained runtime dependency,
final-gate change, or push occurred. The worker was stopped after copyback;
final Brev state was `STOPPED` / `NOT READY` / `HEALTHY`.

Current next action:
`m3jb_recognizer_transformer_run5_research_guided_tuning_no_brev`.
Use the prompt-authorized research escalation (`gpt-pro-research`; fallback
`openai-api-research` / `gpt-5.5`) before any paid run6. Focus on why SupCon
improved top-1/top-5 and monitor accuracy but did not improve primary
recall@FAR10 over run4; keep browser/runtime promotion fail-closed.

Session 933 completed that no-Brev
`m3jb_recognizer_transformer_run5_research_guided_tuning_no_brev` slice and
recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-run5-research-tuning-v1.json`.
The required ChatGPT Pro/browser route was checked, but no browser-control/iab
tool was exposed in the current callable tool set, so the prompt-authorized
`openai-api-research` / `gpt-5.5` fallback saved request/response artifacts
under `artifacts/research/m3jb-recognizer-transformer-run5-tuning-933/`. The
memo diagnoses run5 as a metric-alignment problem: SupCon was active and
improved class ranking/top-1, but verification recall@FAR10 depends on
per-class softmax score tails and thresholds, and run5 did not beat run4's
primary recall (`0.7601` vs `0.7626`). Read-only `brev ls --json` showed
retained `asl-pilot-m3eh-l40s-001` / `3d58wpy9o` as `STOPPED` / `NOT READY` /
`HEALTHY`. No Brev lifecycle, remote mutation, training run,
optimizer/backward step, checkpoint, browser promotion, raw upload, pretrained
runtime dependency, final-gate change, or push occurred.

Session 934 completed that local/no-Brev
`m3jb_recognizer_transformer_run6_verification_margin_and_selection_preflight_no_brev`
slice and recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-run6-verification-margin-preflight-v1.json`.
Side-worktree commit `0f54967` added detailed verification-margin diagnostics
plus trainer support for `--eval-verification`, `--eval-verification-every`,
`--checkpoint-metric monitor_verification_recall_far10`, and
`--save-best-checkpoint` without changing runtime inference. The no-training
diagnostic
`docs/validation/m3jb-recognizer-run6-verification-margin-diagnostic-v1.json`
reproduced reported test verification recall within abs `<=0.002` for run4
(`0.762615` vs `0.7626`) and run5 (`0.760931` vs `0.7601`), recorded full T=32
counts (`10335` clips, train/monitor/test `7011/955/2369`, `95` classes,
feature dim `90`), and emitted per-class FAR10 thresholds, positive/negative
quantiles, and top failure words. It showed run5 beats run4 on monitor
verification (`0.791417` vs `0.787897`) but run4 remains the held-out test
verification running best (`0.762615` vs `0.760931`). The trainer dry-run
`docs/validation/m3jb-recognizer-run6-verifselect-dryrun-v1.json` loaded the
full T=32 cache, computed `monitor_verification_recall_far10`, recorded planned
optimizer steps `13200`, and wrote no checkpoint (`weights: null`, optimizer
steps `0`). Read-only `brev ls --json` showed retained
`asl-pilot-m3eh-l40s-001` / `3d58wpy9o` as `STOPPED` / `NOT READY` / `HEALTHY`.
No Brev lifecycle, remote mutation, training run, optimizer/backward step,
checkpoint, browser promotion, raw upload, pretrained runtime dependency,
final-gate change, or push occurred; do not tune SupCon harder or run T=40 from
this preflight.

Current next action:
`m3jb_recognizer_transformer_run6_t32_verifselect_fulltrain_brev_ok`.
Under the recorded recognizer campaign Brev approval, after read-only Brev
visibility and SSH/CUDA/process preflight on a healthy existing NVIDIA worker,
sync/hash-verify side commit `0f54967`, run the full T=32 run6 recipe with run4
model/data/optimizer settings and best-checkpoint selection by
`monitor_verification_recall_far10`, copy back `.json` / `.pt` / log evidence,
stop the worker, and reject fail-closed unless test verification recall@FAR10
reaches `>=0.85`.

session 935 attempted that approved run6 fulltrain preflight and recorded the
preflight-deferred receipt at
`docs/validation/return-to-form-m3jb-recognizer-transformer-run6-t32-brev-preflight-blocker-v1.json`.
Initial `brev ls --json` showed retained `asl-pilot-m3eh-l40s-001` /
`3d58wpy9o` as `STOPPED` / `NOT READY` / `HEALTHY`, so the worker was started
under the recorded recognizer campaign approval. The runbook SSH retry loop for
SSH/CUDA/process preflight exited `124` before any remote sync, hash
verification, dry-run, trainer command, optimizer/backward step, checkpoint,
copyback, browser promotion, raw upload, pretrained runtime dependency,
final-gate change, or push. During/after preflight the retained worker reported
`UNHEALTHY` / `READY` / `UNHEALTHY`; teardown used `brev stop` by name, `brev
stop` by id, and `brev stop --all`, then an initial final 60-second wait showed
retained `STOPPED` / `NOT READY` / `UNHEALTHY`. A later validation `brev ls --json`
showed the retained worker had recovered to `RUNNING` / `READY` / `HEALTHY`;
it was stopped for cost control, and final Brev state is retained `STOPPED` /
`NOT READY` / `HEALTHY`, pairrank `STOPPED` / `NOT READY` / `UNHEALTHY`.
No destructive infrastructure action was taken.

At that point, current next action was:
`m3jb_recognizer_transformer_run6_t32_verifselect_fulltrain_brev_ok`.
Retry the same run6 recipe under the recorded recognizer approval from the
stopped healthy retained worker, after a fresh read-only Brev check and
SSH/CUDA/process preflight. Get explicit human approval before creating,
deleting, resetting, or repairing Brev infrastructure.

session 936 completed that approved
`m3jb_recognizer_transformer_run6_t32_verifselect_fulltrain_brev_ok` slice and
recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-fulltrain-run6-verifselect-brev-v1.json`.
The retained worker started from `STOPPED` / `NOT READY` / `HEALTHY`, passed
SSH/CUDA/process preflight on `NVIDIA L40S`, and the run6-scoped side commit
`0f54967` recognizer files were synced and hash-verified. The CUDA dry-run
loaded `10335` clips / train-monitor-test `7011/955/2369` / `95` classes /
T=32 with logits `[128, 95]`, optimizer steps `0`, and `weights` null. The
full run used no `--limit-*` flags and completed the run4 model/data/optimizer
recipe with monitor-verification checkpoint selection: epochs `240`, batch
`128`, lr `5e-4`, warmup `500`, cosine min lr `5e-5`, d256/l6/h8, dropout
`0.0`, alpha `0.55`, temperature `3.0`, jitter `0.02`, frame-drop `0.10`,
`--checkpoint-metric monitor_verification_recall_far10`,
`--save-best-checkpoint`, and expected/actual optimizer steps `13200`. Best
monitor verification was `0.8169` at epoch `14`; held-out test verification
recall@FAR10 improved to `0.8039` versus run4 `0.7626`, with test top-1
`0.287` and top-5 `0.6399`, but remains below the MVP gate `>=0.85`, so it is
rejected fail-closed with no browser/runtime promotion. Copied artifacts are
ignored in the annotator worktree and verified by hash: JSON
`7e77ebdd847827ebbf36df6b20c4f19ede5789df96dbf81fb144b19ec6cb5ae9`,
checkpoint `889fd3220960c8a6fd33bd9b44c34bb47a356588498a060386db04f1b7767ba3`,
log `32fada574f90758a2d72c170553ba819a9434bd3ca0bb5fc1b2b30d18f845e19`, and
dry-run receipt `049ea995878fcd7c6b98f52729d434b854f6d8503086df09a2b13997cc42b9f8`.
The worker was stopped after copyback; final Brev state was retained
`STOPPED` / `NOT READY` / `HEALTHY`, pairrank `STOPPED` / `NOT READY` /
`UNHEALTHY`. No raw upload, pretrained runtime dependency, final-gate change,
or push occurred.

Current next action:
`m3jb_recognizer_transformer_run6_research_guided_tuning_no_brev`.
Use the prompt-authorized research escalation (`gpt-pro-research`; fallback
`openai-api-research` / `gpt-5.5`) before any paid run7, focusing on the
remaining FAR10 failure words and score-tail behavior that keep run6 below the
`0.85` gate. Keep browser/runtime promotion fail-closed.

Session 937 completed that no-Brev (session 937)
`m3jb_recognizer_transformer_run6_research_guided_tuning_no_brev` slice and
recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-run6-research-tuning-v1.json`.
The research packet is saved under
`artifacts/research/m3jb-recognizer-transformer-run6-tuning-937/`. The
ChatGPT Pro/browser route was checked, but no Browser/iab control tool was
exposed in this session, so the prompt-authorized `openai-api-research`
fallback used `gpt-5.5` and completed as response
`resp_0ded03e26cd18905006a21042a4e5081949efd9c2f60c581af`
(`gpt-5.5-2026-04-23`, `8857` total tokens, `3106` reasoning tokens). The
memo diagnoses run6 as a real checkpoint-selection win (`0.8169` monitor
verification at epoch `14`, `0.8039` held-out recall) that still leaves a
per-class score-tail/objective problem, with weak words such as `give`, `milk`,
`airplane`, `food`, and `dog`; it treats class/teacher-coverage imbalance as
plausible but unproven. No Brev lifecycle, remote mutation, training run,
optimizer/backward step, checkpoint, export, raw upload, pretrained runtime
dependency, final-gate change, or push occurred; read-only `brev ls --json`
showed both L40S workspaces stopped.

Current next action:
`m3jb_recognizer_transformer_run7_verification_tail_audit_no_brev`.
Implement and run a no-training, no-checkpoint, no-Brev run6 verification-tail
audit joined with train/monitor/test class counts, teacher-covered counts/rates,
positive/negative score quantiles, high-scoring negative labels, hard-negative
pairs, and per-class contribution to the `0.85` gap, reproducing run6 test
recall@FAR10 within abs `<=0.002` of `0.8039`. Only if that audit proves the
weak classes are materially count/coverage constrained should a future paid
`m3jb_recognizer_transformer_run7_class_balanced_ce_fulltrain_brev_ok` be
considered: run6 unchanged except capped class-balanced CE (`beta 0.999`,
mean-normalized, max weight `4.0`) plus the same
`monitor_verification_recall_far10` checkpoint selection. Do not launch run7,
tune SupCon harder, run T=40, increase capacity, promote browser/runtime
artifacts, change final gates, add pretrained runtime dependencies, upload raw
learner video, or spend Brev in the next slice.

session 938 completed that local/no-Brev
`m3jb_recognizer_transformer_run7_verification_tail_audit_no_brev` slice and
recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-run7-verification-tail-audit-v1.json`;
the detailed audit is
`docs/validation/m3jb-recognizer-run7-verification-tail-audit-v1.json`.
Side-worktree commit `885477c` added the no-training tail audit joins and
focused helper test. The local audit reproduced run6 held-out verification
recall@FAR10 at `0.8038559556786704` versus reported `0.8039` (abs diff
`0.000044`, within `<=0.002`), with full counts `10335` clips,
train/monitor/test `7011/955/2369`, `95` classes, T=32, feature dim `90`, and
teacher coverage train/monitor/test `2671/369/1520`. The count/teacher-coverage
constraint is `not_proven`: only 5 of the top 10 target-gap classes were count
or coverage constrained. Top gap words include `give`, `airplane`, `milk`,
`food`, and `dog`; top hard-negative score-tail pairs include `hungry / please`,
`please / hungry`, `uncle / horse`, `thirsty / red`, and `say / red`. Therefore
the prompt condition for paid class-balanced CE was not satisfied. Do not launch class-balanced CE run7, T=40, SupCon retuning, capacity increases,
browser/runtime promotion, final-gate changes, raw learner video upload,
pretrained runtime dependencies, or Brev spend from this result.

Session 939 completed that no-Brev
`m3jb_recognizer_transformer_run7_hard_negative_objective_research_no_brev`
slice and recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-run7-hard-negative-objective-research-v1.json`.
The research packet is saved under
`artifacts/research/m3jb-recognizer-transformer-run7-hard-negative-objective-939/`.
The ChatGPT Pro/browser route was checked, but no Browser/iab control tool was
exposed in this session, so the prompt-authorized `openai-api-research`
fallback used `gpt-5.5` and completed as response
`resp_01ecb85353047dea006a210c8ca0cc8197804703931d228b1d`
(`gpt-5.5-2026-04-23`, `11645` total tokens, `4422` reasoning tokens). The
memo selects a default-off batch-local one-vs-rest BCE hard-negative auxiliary
objective preflight: add local-only support for `--ovr-bce-weight` (default
`0.0`, future paid value `0.03`), `--ovr-bce-hard-k 8`,
`--ovr-bce-negative-source batch-labels`, and `--ovr-bce-include-positive`;
prove default-off parity, finite active OVR-BCE loss, valid in-batch negatives,
and `uses_test_mined_pairs_for_training: false` with zero optimizer/backward
steps and no checkpoint/export/browser artifact. It rejects class-balanced CE
from the tail audit, fixed held-out test-mined pairs as training supervision,
more SupCon, T=40, and capacity increases as the immediate next move. Read-only
`brev ls --json` showed both L40S workspaces stopped. No Brev lifecycle, remote
mutation, training run, optimizer/backward step, checkpoint, export, browser
promotion, raw learner video upload, pretrained runtime dependency, final-gate
change, or push occurred.

Session 940 completed that local/no-Brev
`m3jb_recognizer_transformer_run7_ovr_bce_hardneg_preflight_no_brev` slice and
recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-run7-ovr-bce-hardneg-preflight-v1.json`.
The two trainer dry-run receipts are
`docs/validation/m3jb-recognizer-run7-ovr-bce-hardneg-preflight-zero-weight-dryrun-v1.json`
and
`docs/validation/m3jb-recognizer-run7-ovr-bce-hardneg-preflight-weight003-dryrun-v1.json`.
Side-worktree commit `828f5cf5` added default-off batch-local OVR-BCE
hard-negative support to the trainer and focused tests. The zero-weight dry-run
proved default-off parity: total loss and base CE/KD loss both stayed `7.84514`.
The active `--ovr-bce-weight 0.03` dry-run kept the base loss unchanged,
recorded finite OVR-BCE loss `1.569024` and weighted contribution `0.047071`,
selected `1024` batch-local hard negatives with
`selected_negative_matches_true_label: 0`, and recorded
`uses_test_mined_pairs_for_training: false`. Both dry-runs had logits
`[128,95]`, zero optimizer/backward steps, no checkpoint, no export, no browser
promotion, no raw learner upload, no pretrained runtime dependency, no final-gate
change, no push, and no Brev lifecycle/spend. Read-only `brev ls --json` showed
both L40S workspaces stopped.

Current next action after session 940:
`m3jb_recognizer_transformer_run7_ovr_bce_hardneg_fulltrain_brev_ok`.
Use the recorded recognizer campaign Brev approval only after read-only
visibility plus SSH/CUDA/process preflight on a healthy existing NVIDIA worker;
sync side commit `828f5cf5`, run the full T=32 run7 recipe with
`--ovr-bce-weight 0.03 --ovr-bce-hard-k 8 --ovr-bce-negative-source batch-labels --ovr-bce-include-positive`,
copy back JSON/PT/log evidence, stop the worker,
and reject fail-closed unless test verification recall@FAR10 reaches `>= 0.85`.

Session 941 completed that approved run7 OVR-BCE hard-negative fulltrain slice
(session 941 in the audit chain)
and recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-fulltrain-run7-ovr-bce-hardneg-brev-v1.json`.
The retained L40S worker started from `STOPPED` / `NOT READY` / `HEALTHY`, hit
the known SSH startup race twice, then passed SSH/CUDA/process preflight on
attempt 3; a fresh `brev ls --json` showed `RUNNING` / `READY` / `HEALTHY`.
Side commit `828f5cf5` was synced and hash-verified. The CUDA dry-run wrote
JSON `654a9b856c07aca8f8c65e11688709797e88f623f588c05ca2873a6868f7d8ad`,
with logits `[128,95]`, finite OVR-BCE loss,
`selected_negative_matches_true_label: 0`,
`uses_test_mined_pairs_for_training: false`, and optimizer steps `0`.
The accepted full run used full T=32 data with no `--limit-*` flags:
train/monitor/test `7011/955/2369`, `95` classes, epochs `240`, batch `128`,
cosine warmup/min-lr schedule, expected/actual optimizer steps `13200`,
monitor-verification checkpoint selection, and OVR-BCE hard negatives at weight
`0.03`. Best monitor verification was `0.8276` at epoch `24`, but held-out test
verification recall@FAR10 was only `0.7759`, with top-1 `0.2913` and top-5
`0.6167`, regressing versus run6's running-best recall `0.8039` and remaining
below the `>=0.85` gate. Copied artifacts are in the annotator worktree and
verified by hash: JSON
`96284551566c67c40ed05eedb0861fd5b3a9136259cdd60e094bfa28835123dd`,
checkpoint `7efd0ed90870ddfcd6ad84cf04a59910dd67a19374b7833a34b18eaa710330d0`,
log `246ca258aa5d3820509a45c18149360d2471d389b3c959c5c2cb74fcd98dc534`, and
dry-run receipt `654a9b856c07aca8f8c65e11688709797e88f623f588c05ca2873a6868f7d8ad`.
A brief malformed wrapper launched an epoch-0 trainer with an empty `--out`;
it was killed before the accepted run and is recorded in the receipt. The
worker was stopped after copyback; final Brev state was retained `STOPPED` /
`NOT READY` / `HEALTHY`, pairrank `STOPPED` / `NOT READY` / `UNHEALTHY`. No
browser/runtime promotion, runtime export, raw learner upload, pretrained
runtime dependency, final-gate change, or push occurred.

Session 942 completed that no-Brev research/postmortem
`m3jb_recognizer_transformer_run7_ovr_bce_research_guided_tuning_no_brev`
slice and recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-run7-ovr-bce-research-tuning-v1.json`.
The research artifacts are under
`artifacts/research/m3jb-recognizer-transformer-run7-ovr-bce-postmortem-942/`.
The required GPT-Pro/browser route was checked, but no Browser/iab control tool
was exposed in this session, so the prompt-authorized `openai-api-research`
fallback used `gpt-5.5` and completed as response
`resp_077b7bdd7c4483eb006a211f48d0ec81979b381333045daf88`
(`gpt-5.5-2026-04-23`, `9375` total tokens, `3841` reasoning tokens). The
memo diagnoses run7 as likely split-specific calibration / positive-margin
damage: OVR-BCE raised best monitor verification to `0.8276` while held-out
verification regressed to `0.7759` versus run6 `0.8039`, with top-1 slightly up
and top-5 down. It selects a no-Brev paired calibration audit before any paid
run8 and records a gated OVR-BCE weight 0.01 recipe only if that audit passes.
No Brev lifecycle, remote mutation, training run, optimizer/backward step,
checkpoint, export, browser promotion, raw learner upload, pretrained runtime
dependency, final-gate change, or push occurred.

Session 943 completed
`m3jb_recognizer_transformer_run6_vs_run7_paired_verification_calibration_audit_no_brev`
and recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-run6-vs-run7-paired-calibration-audit-v1.json`;
the detailed audit is
`docs/validation/m3jb-recognizer-run6-vs-run7-paired-calibration-audit-v1.json`.
Side-worktree commit `bfd1e783` added the paired calibration diagnostic and
focused tests. The audit used run-specific monitor seeds (`run6=0`,
`run7=1337`), reproduced run6 test recall `0.8038559556786704`, run6 monitor
best `0.8169265323599687`, and run7 monitor best `0.8275977981037635` within
`+/-0.0005`. It confirmed the calibration-damage pattern: run7-vs-run6 monitor
verification delta `+0.010671265743794844`, same held-out test delta
`-0.028786703601108243`, `33` test classes regressed by more than `0.05`, and
`32/33` regressed classes lost positive p25 or p50 margin. However, local
CPU/MPS recomputation of run7 held-out test recall was `0.7750692520775622`,
which is `0.0008307479224378689` away from the prompt target `0.7759`,
exceeding `+/-0.0005`. The audit therefore did **not** pass, even though it
reached a calibration-damage determination, and it does **not** authorize paid
run8.

Current next action after session 943:
`m3jb_recognizer_transformer_run7_test_recall_reproduction_discrepancy_audit_no_brev`.
Resolve the run7 local-vs-recorded CUDA test-recall discrepancy before any paid
run8 or prompt target change. Stay no-Brev/no-training unless a future prompt
explicitly records human approval for a bounded CUDA verification run. Do not
launch paid run8, spend Brev, train, write checkpoints, export runtime
artifacts, promote browser artifacts, upload raw learner video, add pretrained
runtime dependencies, or change final gates in the next slice.

Session 944 completed
`m3jb_recognizer_transformer_run7_test_recall_reproduction_discrepancy_audit_no_brev`
and recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-run7-test-recall-reproduction-discrepancy-audit-v1.json`.
The original run7 CUDA JSON stores exact held-out test verification recall
`0.7759113573407201` and top-level rounded `0.7759`; the terminal log printed
`0.776`. The local CPU paired-audit replay from the copied checkpoint computed
`0.7750692520775622`, but the entire `0.0008421052631579` exact-vs-local mean
gap is explained by two single-positive threshold-boundary flips: class `not`
(`0.64 -> 0.60`, local threshold higher by `0.0000085987267084428`) and class
`see` (`0.96 -> 0.92`, local threshold higher by
`0.00000127781677292615`). The other `93/95` class recalls match,
split/counts/checkpoint hashes match, and the monitor selected-checkpoint score
matches exactly at `0.8275977981037635`. Determination: the prior mismatch is
CPU-vs-original-CUDA numerical boundary sensitivity, not split, checkpoint,
evaluator, or provenance error; the original CUDA receipt remains authoritative
for run7.

Calibration damage remains confirmed, but session 944 did not launch or
authorize paid run8, did not train, did not write checkpoints, and did not
change final gates or prompt targets.

Current next action after session 944:
`m3jb_recognizer_transformer_run8_ovr_bce_w001_preflight_no_brev`.
Before any paid run8 launch, record and validate a no-Brev preflight for the
OVR-BCE weight `0.01` recipe. Do not spend Brev, train, write checkpoints,
export runtime artifacts, promote browser artifacts, upload raw learner video,
add pretrained runtime dependencies, or change final gates in the next slice.

Session 945 completed
`m3jb_recognizer_transformer_run8_ovr_bce_w001_preflight_no_brev` and recorded
it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-run8-ovr-bce-w001-preflight-v1.json`;
the accepted dry-run receipt is
`docs/validation/m3jb-recognizer-run8-ovr-bce-w001-preflight-dryrun-v1.json`.
The accepted local MPS dry-run used the run7-compatible T32 cache/teacher/seed
command shape plus monitor-verification checkpoint-selection flags and changed
only OVR-BCE weight to `0.01`. It loaded `10335` clips / `95` classes / T=32
with train-monitor-test `7011/955/2369`, wrote logits `[128,95]`, preserved the
run7 preflight base loss `7.84514`, recorded OVR-BCE loss `1.569024` with
weighted contribution `0.01569` and total loss `7.86083`, selected `1024`
batch-local hard negatives with `selected_negative_matches_true_label: 0`, and
recorded `uses_test_mined_pairs_for_training: false`. Planned paid steps remain
`13200`; dry-run optimizer/backward steps were `0`, weights were null, and
checkpoint writing was skipped. Read-only `brev ls --json` showed both L40S
workers stopped; no Brev lifecycle/exec, training run, checkpoint, export,
browser promotion, raw learner upload, pretrained runtime dependency,
final-gate change, or push occurred.

At that point, next action after session 945 was:
`m3jb_recognizer_transformer_run8_ovr_bce_w001_fulltrain_brev_ok`.
Use only the bounded fulltrain envelope recorded in the session 945 receipt,
after fresh read-only Brev visibility plus SSH/CUDA/process preflight on an
existing healthy NVIDIA worker. Copy back JSON/PT/log/dry-run artifacts, stop
the worker, and reject fail-closed unless held-out verification recall@FAR10
reaches `>=0.85` and beats run6.

Session 946 attempted that bounded fulltrain Brev slice and recorded the
preflight blocker at
`docs/validation/return-to-form-m3jb-recognizer-transformer-run8-ovr-bce-w001-brev-preflight-blocker-v1.json`.
The bounded run8 fulltrain slice was attempted under the recorded recognizer
campaign approval, but no model training started. Fresh Brev visibility showed
retained worker `asl-pilot-m3eh-l40s-001` / `3d58wpy9o` initially `STOPPED` /
`NOT READY` / `HEALTHY`; after `brev start`, SSH preflight never became
reachable and the worker degraded to `UNHEALTHY`. CUDA/process preflight,
sync/hash verification, remote dry-run, fulltrain command, optimizer/backward
steps, checkpoint write, artifact copyback, browser/runtime promotion, raw
learner upload, pretrained runtime dependency, final-gate change, and push did
not occur. Teardown used stop by name, stop by id, and `brev stop --all`; final
Brev state was initially retained `STOPPED` / `NOT READY` / `UNHEALTHY`,
pairrank `STOPPED` / `NOT READY` / `UNHEALTHY`. A later read-only final
inventory found retained `3d58wpy9o` recovered to `RUNNING` / `READY` /
`HEALTHY`, so it was not stopped merely because approved run8 work remains
queued.

Current next action after session 946:
`m3jb_recognizer_transformer_run8_ovr_bce_w001_fulltrain_brev_ok`.
Retry the bounded run8 OVR-BCE weight `0.01` fulltrain envelope on the recovered
existing NVIDIA worker only after fresh SSH/CUDA/process preflight passes. Do
not create, delete, reset, or repair Brev infrastructure without explicit human
approval.

RUN8 OVR-BCE W0.01 FULLTRAIN RESULT: session 947 completed that bounded
fulltrain slice and recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-fulltrain-run8-ovr-bce-w001-brev-v1.json`.
The recovered retained L40S worker passed fresh SSH/CUDA/process preflight
(`NVIDIA L40S`, PyTorch `2.12.0+cu126`, no active training process), and the
scoped recognizer code/cache/model hashes already matched side commit
`bfd1e783`. The remote CUDA dry-run loaded `10335` clips / `95` classes / T=32,
wrote logits `[128,95]`, used OVR-BCE weight `0.01`, selected zero true-label
negatives, recorded `uses_test_mined_pairs_for_training: false`, and took zero
optimizer/checkpoint steps. The full run used no `--limit-*` flags and
completed epochs `240`, batch `128`, d256/l6/h8, lr `5e-4`, warmup `500`,
cosine min lr `5e-5`, alpha `0.55`, temperature `3.0`, jitter `0.02`,
frame-drop `0.10`, OVR-BCE weight `0.01`, and expected/actual optimizer steps
`13200`. It regressed versus the run6 running best and remains fail-closed:
verification recall@FAR10 `0.7571`, top-1 `0.3081`, top-5 `0.6079`, versus
run6 recall `0.8038559556786704` and gate `>=0.85`. The best monitor-verification checkpoint was epoch `83` with best score `0.8252875272322179`; final monitor verification was about `0.810`. Copied
artifacts are ignored in the annotator worktree and verified by hash: JSON
`8f764717ffa55ed700483dec37ded11c5839b38fa85802d077c0e9a15e63ebeb`,
checkpoint `0dbc02706dc5615c41edac1d1d128ded50910876b0201f930f59893a5118c5a2`,
log `aa563bc176ac18d336b1ba5a619041300e298a30458e14ac0e58eb2eb3ea464a`, and
dry-run `086211bc501843d9f0520faa3c766acca47de0e1c9c0b7878ce0df8222a6f66f`.
Brev API auth became unavailable during copyback/teardown, so direct SSH `scp`
was used for copyback and `sudo shutdown -h now` was sent for cost control; SSH was unreachable after OS shutdown, but final `brev ls --json` could not be
verified until Brev auth is recovered. No browser/runtime promotion, raw learner
upload, pretrained runtime dependency, final-gate change, infrastructure
create/delete/reset/repair, push, or gate relaxation occurred.

RUN8 OVR-BCE W0.01 RESEARCH/POSTMORTEM RESULT: session 948 completed
`m3jb_recognizer_transformer_run8_ovr_bce_w001_research_guided_tuning_no_brev`
and recorded it at
`docs/validation/return-to-form-m3jb-recognizer-transformer-run8-ovr-bce-w001-research-tuning-v1.json`.
The research packet is saved under
`artifacts/research/m3jb-recognizer-transformer-run8-ovr-bce-w001-postmortem-948/`.
The ChatGPT Pro/browser route was checked, but no Browser/iab control tool was
exposed in this session, so the prompt-authorized `openai-api-research` fallback
used `gpt-5.5` and completed as response
`resp_0585ce963c8da7af006a213dace9d8819491ed3d584b3cb9a7`
(`gpt-5.5-2026-04-23`, `5527` total tokens, `516` reasoning tokens). The memo
says reducing OVR-BCE from `0.03` to `0.01` did not fix the held-out regression,
so the failure is likely objective/checkpoint-selection mismatch rather than
simple auxiliary-loss magnitude. It recommends: stop OVR-BCE for now; keep run6
as the running-best base; choose no paid recipe yet; and next run one local
no-Brev run6/run7/run8 verification calibration-tail and checkpoint-selection
audit. Do not launch another paid run blindly. Brev auth recovery and a
successful `brev ls --json` are prerequisites before any future
lifecycle/compute slice. No Brev lifecycle, remote mutation, training run,
optimizer/backward step, checkpoint, export, browser promotion, raw learner
upload, pretrained runtime dependency, final-gate change, or push occurred.

Current next action after session 948:
`m3jb_recognizer_transformer_run6_run7_run8_calibration_tail_audit_no_brev`.
Implement or reuse a local no-training audit comparing run6, run7, and run8 on
monitor and held-out test: verification recall, class thresholds, positive
margin quantiles, negative score quantiles, per-class deltas, monitor-vs-test
transfer, best-checkpoint epoch behavior, and top failure words. Do not spend
Brev, train, write checkpoints, export runtime artifacts, promote browser
artifacts, upload raw learner video, add pretrained runtime dependencies,
change final gates, or select a paid recipe in this next slice.

RUN6/RUN7/RUN8 CALIBRATION-TAIL AUDIT RESULT: session 949 completed
`m3jb_recognizer_transformer_run6_run7_run8_calibration_tail_audit_no_brev`
with no Brev. The summary receipt is
`docs/validation/return-to-form-m3jb-recognizer-transformer-run6-run7-run8-calibration-tail-audit-v1.json`;
the detailed audit is
`docs/validation/m3jb-recognizer-run6-run7-run8-calibration-tail-audit-v1.json`.
Side-worktree commit `ad16b00d` added the three-run diagnostic. The no-training
CPU audit reproduced run6/run7/run8 held-out recalls within tolerance: run6
`0.8038559556786704`, run7 local `0.7750692520775622` under the previously
resolved CPU/CUDA boundary sensitivity, and run8 `0.7571191135734074`. It shows
run7 is best by monitor while run6 is best by held-out test; run8 selected a
later checkpoint than run7 (epoch `83` vs `24`) with worse test transfer.
Diagnosis: run8 versus run6 is broader positive-margin damage, while run8
versus run7 is localized positive-margin damage with changed affected words
rather than safe threshold improvement. Top run8 failures include `give`,
`airplane`, `child`, `look`, and `night`. No paid recipe was selected, OVR-BCE
remains stopped for now, and there was no Brev lifecycle, training,
optimizer/backward step, checkpoint write, export, browser promotion, raw
upload, pretrained runtime dependency, final-gate change, or push.

Current next action after session 949:
`m3jb_recognizer_transformer_post_ovr_bce_calibration_safe_research_no_brev`.
Use the three-run calibration-tail audit as input to a no-Brev research/tuning
pass that selects the next calibration-safe local preflight from the run6 base.
Do not launch Brev, train, write checkpoints, export runtime artifacts, promote
browser artifacts, upload raw learner video, add pretrained runtime
dependencies, change final gates, or select a paid fulltrain recipe in this
next slice. Brev auth recovery and a successful `brev ls --json` remain
prerequisites before any future lifecycle/compute slice.

POST-OVR-BCE CALIBRATION-SAFE RESEARCH RESULT: session 950 completed
`m3jb_recognizer_transformer_post_ovr_bce_calibration_safe_research_no_brev`
with no Brev. The receipt is
`docs/validation/return-to-form-m3jb-recognizer-transformer-post-ovr-bce-calibration-safe-research-v1.json`.
The research packet is saved under
`artifacts/research/m3jb-recognizer-transformer-post-ovr-bce-calibration-safe-950/`.
The ChatGPT Pro/browser route was checked, but no Browser/iab control tool was
exposed in this session, so the prompt-authorized `openai-api-research` fallback
used `gpt-5.5` and completed as response
`resp_0701b4689f25eb29006a214576dcac8197b1f838ad45dbf2b5`
(`gpt-5.5-2026-04-23`, `5912` total tokens, `2031` reasoning tokens). The memo
treats the immediate failure as monitor-to-held-out transfer rather than
insufficient objective pressure: run7/run8 looked strong on monitor verification
but transferred worse than run6. It keeps no paid recipe yet and selects a
local run6 monitor/checkpoint-selection stability preflight using existing run6
artifacts only. No Brev lifecycle, remote mutation, training run,
optimizer/backward step, checkpoint write, export, browser promotion, raw
learner upload, pretrained runtime dependency, final-gate change, future paid
recipe selection, or push occurred.

RUN6 MONITOR-SELECTION STABILITY PREFLIGHT RESULT: session 951 completed
`m3jb_recognizer_transformer_run6_monitor_selection_stability_preflight_no_brev`
as a fail-closed no-Brev artifact audit. The receipt is
`docs/validation/return-to-form-m3jb-recognizer-transformer-run6-monitor-selection-stability-preflight-v1.json`;
detailed audit:
`docs/validation/m3jb-recognizer-run6-monitor-selection-stability-preflight-v1.json`.
Side-worktree commit `4b9c9325602f` added the artifact-only diagnostic and
focused test. The preflight reconstructed run6's current monitor-verification
checkpoint selection from scalar history: best monitor verification `0.8169` at
epoch `14`, final monitor verification `0.7835` at epoch `239`, and held-out
test verification recall@FAR10 `0.8039` for the selected checkpoint.
Pre-registered robust monitor-only selectors found unique candidate epochs `14`
and `31`; epoch `31` is selected by trailing mean/median rules, but the copied
run6 artifacts retain only the selected epoch-14 checkpoint and no per-epoch
logits (`alternate_epoch_checkpoint_count: 0`, `per_epoch_logits_count: 0`).
Therefore alternate selector test transfer is not evaluable from existing
artifacts, no paid recipe is selected, and browser/runtime promotion remains
fail-closed. No Brev lifecycle, remote mutation, training run,
optimizer/backward step, checkpoint write, export, browser promotion, raw
learner upload, pretrained runtime dependency, final-gate change, raw
test-mined supervision, or push occurred.

Current next action after session 951:
`m3jb_recognizer_transformer_candidate_checkpoint_retention_preflight_no_brev`.
Implement or locally preflight retained candidate-checkpoint/logit support
before any future paid run relies on robust monitor-only checkpoint selection.
Required boundaries: no Brev, no training, no optimizer/backward steps, no
checkpoint writes outside explicit local dry-run/no-save validation, no runtime
export, no browser promotion, no raw learner upload, no pretrained runtime
dependency, no final-gate change, no raw test-mined supervision, and no paid
recipe selection in this next slice. Brev auth recovery and a successful
`brev ls --json` remain prerequisites before any future lifecycle/compute slice.

CANDIDATE CHECKPOINT RETENTION PREFLIGHT RESULT: session 952 completed
`m3jb_recognizer_transformer_candidate_checkpoint_retention_preflight_no_brev`
without Brev. Receipt:
`docs/validation/return-to-form-m3jb-recognizer-transformer-candidate-checkpoint-retention-preflight-v1.json`;
dry-run receipt:
`docs/validation/m3jb-recognizer-candidate-checkpoint-retention-preflight-dryrun-v1.json`.
Side-worktree commit `8e90c24d` added default-off candidate checkpoint
retention support to `train_recognizer_distill.py` with focused tests:
`--retain-candidate-checkpoints`, `--candidate-checkpoint-epsilon`, and
`--candidate-checkpoint-window`. The full T=32 CPU dry-run used train `7011`,
monitor `955`, test `2369`, logits `[128,95]`, planned optimizer steps
`13200`, actual/expected optimizer steps `0`, `weights` null, retention
selectors `argmax`, earliest/latest within epsilon, trailing mean, and trailing
median, checkpoint_write_blocker: `dry_run_forward`, and
`retained_checkpoint_count: 0`; no candidate `.pt` files were produced. The
candidate checkpoint retention contract is preflighted for future training runs,
but no paid recipe is selected. No Brev lifecycle, remote mutation, training
run, optimizer/backward step, checkpoint write, export, browser promotion, raw
learner upload, pretrained runtime dependency, final-gate change, raw
test-mined supervision, or push occurred. Brev auth recovery and a successful
`brev ls --json` remain prerequisites before any future lifecycle/compute slice.

Current next action after session 952:
`m3jb_recognizer_transformer_retention_enabled_research_guided_tuning_no_brev`.

Use no-Brev research/tuning to choose whether any future paid recipe should run
now that candidate-checkpoint retention exists. Do not spend Brev, train, write
checkpoints, export runtime artifacts, promote browser artifacts, upload raw
learner video, add pretrained runtime dependencies, change final gates, use raw
test-mined supervision, or select a paid recipe without a new recorded
preflight/recipe receipt.

RETENTION-ENABLED RESEARCH TUNING RESULT: session 953 completed
`m3jb_recognizer_transformer_retention_enabled_research_guided_tuning_no_brev`
with no Brev. Receipt:
`docs/validation/return-to-form-m3jb-recognizer-transformer-retention-enabled-research-tuning-v1.json`.
Research packet:
`artifacts/research/m3jb-recognizer-transformer-retention-enabled-tuning-953/`.
The ChatGPT Pro/browser route was checked, but no Browser/iab control tool was
exposed in this session, so the prompt-authorized `openai-api-research`
fallback used `gpt-5.5` and completed as response
`resp_0c05446d4cf7fa7b006a214fd83d4881969db35a0dcba78d49`
(`gpt-5.5-2026-04-23`, `4651` total tokens, `516` reasoning tokens). The
research memo's exact suggested token was
`record_run9_retention_enabled_run6_recipe`; this prompt normalizes it to the
project action token
`m3jb_recognizer_transformer_run9_retention_enabled_run6_recipe_preflight_no_brev`.
It recommends exactly one next no-Brev run9 recipe/preflight receipt based on
the run6 objective/envelope: OVR-BCE disabled, SupCon disabled, full T=32 counts
`7011/955/2369`, planned future optimizer steps `13200`,
`monitor_verification_recall_far10` checkpoint selection, and candidate
checkpoint retention enabled with explicit epsilon/window settings. No paid
fulltrain is authorized or selected by session 953; no paid fulltrain is
authorized by this research slice. Any future paid run remains
gated behind that no-Brev recipe/preflight plus Brev auth recovery and a
successful `brev ls --json`. No Brev lifecycle, remote mutation, training run,
optimizer/backward step, checkpoint write, export, browser promotion, raw
learner video upload, pretrained runtime dependency, raw test-mined
supervision, final-gate change, or push occurred.

RUN9 RETENTION-ENABLED RUN6 RECIPE PREFLIGHT RESULT: session 954 completed
`m3jb_recognizer_transformer_run9_retention_enabled_run6_recipe_preflight_no_brev`
with no Brev. Summary receipt:
`docs/validation/return-to-form-m3jb-recognizer-transformer-run9-retention-enabled-run6-recipe-preflight-v1.json`.
Dry-run receipt:
`docs/validation/m3jb-recognizer-run9-retention-enabled-run6-recipe-preflight-dryrun-v1.json`.
The full T=32 dry-run/no-save validation used train/monitor/test
`7011/955/2369`, classes `95`, logits `[128,95]`, OVR-BCE disabled, SupCon
disabled, planned future optimizer steps `13200`, actual/expected optimizer
steps `0/0`, `monitor_verification_recall_far10` checkpoint selection, and
candidate checkpoint retention enabled with epsilon `0.005` / window `5`. It
wrote no checkpoint and created no `.pt` files. The receipt records the future compute envelope and kill criteria, including future fulltrain token
`m3jb_recognizer_transformer_run9_retention_enabled_run6_fulltrain_brev_ok_after_auth`,
but paid compute remains blocked until Brev auth is recovered and a successful
`brev ls --json` verifies worker visibility. No Brev lifecycle, remote
mutation, training run, optimizer/backward step, checkpoint write, export,
browser promotion, raw learner video upload, pretrained runtime dependency,
raw test-mined supervision, final-gate change, or push occurred.

RUN9 BREV AUTH VISIBILITY REFRESH RESULT: session 955 completed
`m3jb_recognizer_transformer_run9_retention_enabled_brev_auth_visibility_refresh_no_spend`
as a blocked no-spend read-only visibility refresh. Receipt:
`docs/validation/return-to-form-m3jb-recognizer-transformer-run9-brev-auth-visibility-refresh-v1.json`.
`brev ls --json` exited with exit `1`; stdout was
`You are currently logged out, would you like to log in? [Y/n]:`, and stderr
included `PromptForLogin`, `shouldLogin`, and `EOF`. No JSON inventory was
available, retained worker state is `unknown_auth_blocked`, and future run9 fulltrain remains blocked. No Brev spend, lifecycle start/stop, exec, sync,
remote mutation, training run, optimizer/backward step, checkpoint write,
export, browser promotion, raw learner video upload, pretrained runtime
dependency, raw test-mined supervision, final-gate change, infrastructure
create/delete/reset/repair, push, or gate relaxation occurred.

RUN9 BREV AUTH VISIBILITY RETRY RESULT: session 956 completed
`m3jb_recognizer_transformer_run9_retention_enabled_await_brev_login_then_visibility_refresh_no_spend`
as a still blocked no-spend read-only visibility retry. Receipt:
`docs/validation/return-to-form-m3jb-recognizer-transformer-run9-brev-auth-visibility-retry-v1.json`.
The prior blocker receipt remains
`docs/validation/return-to-form-m3jb-recognizer-transformer-run9-brev-auth-visibility-refresh-v1.json`.
`brev ls --json` still logged out and exited with exit `1`; stdout was
`You are currently logged out, would you like to log in? [Y/n]:`, and stderr
included `PromptForLogin`, `shouldLogin`, and `EOF`. No JSON inventory was
available, retained worker state is `unknown_auth_blocked`, and future run9 fulltrain remains blocked. No Brev spend, lifecycle start/stop, exec, sync,
remote mutation, training run, optimizer/backward step, checkpoint write,
export, browser promotion, raw learner video upload, pretrained runtime
dependency, raw test-mined supervision, final-gate change, infrastructure
create/delete/reset/repair, push, or gate relaxation occurred.

RUN9 BREV AUTH VISIBILITY RETRY RESULT: session 957 completed
`m3jb_recognizer_transformer_run9_retention_enabled_await_brev_login_then_visibility_refresh_no_spend`
as a still blocked no-spend read-only visibility retry. Receipt:
`docs/validation/return-to-form-m3jb-recognizer-transformer-run9-brev-auth-visibility-retry-957-v1.json`.
The prior retry receipt remains
`docs/validation/return-to-form-m3jb-recognizer-transformer-run9-brev-auth-visibility-retry-v1.json`.
`brev ls --json` still logged out and exited with exit `1`; stdout was
`You are currently logged out, would you like to log in? [Y/n]:`, and stderr
included `PromptForLogin`, `shouldLogin`, and `EOF`. No JSON inventory was
available, retained worker state is `unknown_auth_blocked`, and future run9 fulltrain remains blocked. No Brev spend, lifecycle start/stop, exec, sync,
remote mutation, training run, optimizer/backward step, checkpoint write,
export, browser promotion, raw learner video upload, pretrained runtime
dependency, raw test-mined supervision, final-gate change, infrastructure
create/delete/reset/repair, push, or gate relaxation occurred.

RUN9 BREV AUTH HUMAN-LOGIN BOUNDARY RESULT: session 958 completed
`m3jb_recognizer_transformer_run9_retention_enabled_await_brev_login_then_visibility_refresh_no_spend`
as a blocked no-spend read-only final probe before parking automated retries.
Receipt:
`docs/validation/return-to-form-m3jb-recognizer-transformer-run9-brev-auth-human-login-boundary-v1.json`.
The prior retry receipt remains
`docs/validation/return-to-form-m3jb-recognizer-transformer-run9-brev-auth-visibility-retry-v1.json`.
`brev ls --json` still exited with exit `1`; stdout was
`You are currently logged out, would you like to log in? [Y/n]:`, and stderr
included `PromptForLogin`, `shouldLogin`, and `EOF`. Sessions 955, 956, 957,
and 958 all show the same logged-out/EOF blocker, so there must be no further automated Brev CLI visibility retries until a human explicitly confirms Brev CLI
login/auth is restored. No JSON inventory was available, retained worker state
is `unknown_auth_blocked`, and future run9 fulltrain remains blocked. No Brev
spend, lifecycle start/stop, exec, sync, remote mutation, training run,
optimizer/backward step, checkpoint write, export, browser promotion, raw
learner video upload, pretrained runtime dependency, raw test-mined
supervision, final-gate change, infrastructure create/delete/reset/repair,
push, or gate relaxation occurred.

Current next action after session 958:
`m3jb_recognizer_transformer_run9_retention_enabled_wait_for_human_brev_login_confirmation`.

A human must restore Brev CLI login/auth and explicitly confirm it before the
executor may rerun
`m3jb_recognizer_transformer_run9_retention_enabled_await_brev_login_then_visibility_refresh_no_spend`.
After that confirmation, rerun only the same no-spend read-only
`brev ls --json` visibility refresh before any future run9 fulltrain can become
launchable. Do not create, delete, reset, repair, start, sync to, exec on, or
stop Brev infrastructure until `brev ls --json` succeeds or this prompt is
explicitly updated or a live human approves it; do not stop a RUNNING worker
merely because it is RUNNING while approved work remains queued and the recorded
runtime/spend/kill/teardown rules still apply.

## SUPERSEDED (2026-06-03) — research-guided PCK campaign paused; local ResUNet preflight completed

This update supersedes the older standalone no-Brev resolution/capacity
preflight below. The current user-directed campaign is:
`m3jb_research_guided_landmark_pck_exploration_campaign_brev_ok`.
Completed first-run token: `m3jb_landmark_pck_run1_w96_g48_fulltrain_brev_ok`;
completed second-run token: `m3jb_landmark_pck_run2_w128_g64_fulltrain_brev_ok`;
completed third-run token: `m3jb_landmark_pck_run3_w128_g64_hardgeom_aug_fulltrain_brev_ok`;
completed research-refresh token: `m3jb_landmark_pck_research_refresh_after_run3_no_brev`;
completed architecture-preflight token: `m3jb_landmark_pck_resunet_architecture_preflight_no_brev`;
next action token: `m3jb_landmark_pck_run4_resunet_g64_fulltrain_brev_ok`;
cap `$50`; completed widths `96` and `128`; completed heatmap grids `48` and
`64`; run3 stayed w128/g64 and added hard-geometry oversampling plus
mild augmentation; no destructive train-quality filter was used; stop the worker
after active experiment work.
Audit mirror terms retained: run1 width `96`, heatmap grid `48`; run2 width `128`,
heatmap grid `64`.

Bounded Brev campaign approval is recorded in `GOAL.md` and mirrored here for
this active prompt: the user approved landmark-PCK exploration on Brev up to a
total cap of `$50` on retained worker `asl-pilot-m3eh-l40s-001` /
`3d58wpy9o` or an equivalent healthy NVIDIA worker. Within that cap, executor
turns may run successive full-scope experiments without stopping for per-run
human approval, provided every run records exact command / instance / metrics /
copyback / teardown in the receipt chain and stops the worker whenever no
experiment is actively running. Stop and report when PCK clears both gates, the
`$50` cap is reached, or 3 consecutive research-guided experiments fail to beat
the running-best PCK.

Session 905 completed the required research escalation before the first batch.
The ChatGPT Pro web route was attempted but blocked because the in-app browser
backend was unavailable (`iab` unavailable), so the prompt-authorized
`openai-api-research` / `gpt-5.5` fallback was used. Artifacts are saved under
`artifacts/research/m3jb-landmark-pck-campaign-905/`, and the plan receipt is
`docs/validation/return-to-form-m3jb-landmark-pck-campaign-research-plan-v1.json`.

Run1 completed in session 906 and is recorded at
`docs/validation/return-to-form-m3jb-landmark-pck-campaign-run1-w96-g48-fulltrain-brev-v1.json`.
The retained worker `asl-pilot-m3eh-l40s-001` / `3d58wpy9o` was used and then
stopped. The first launch exposed a trainer support bug where `--heatmap-g 48`
was accepted but the head emitted 64x64 heatmaps; the executor patched the
scratch trainer to resize the feature map to the requested grid before the
heatmap head, verified remote shape `(2, 21, 48, 48)`, then reran the same
approved experiment. Held-out test PCK improved to `0.739200` / `0.453300`
versus the previous running-best `0.663300` / `0.372200`, but remains below the
`0.90` / `0.75` landmark gates. Browser/runtime promotion remains forbidden and
fail-closed.

Run2 completed in session 907 and is recorded at
`docs/validation/return-to-form-m3jb-landmark-pck-campaign-run2-w128-g64-fulltrain-brev-v1.json`.
The retained worker `asl-pilot-m3eh-l40s-001` / `3d58wpy9o` was used and then
stopped. Remote preflight verified the patched trainer hash and w128/g64 shape
smoke `(2, 21, 64, 64)`. Held-out test PCK improved to `0.749600` /
`0.486700` versus the run1 running-best `0.739200` / `0.453300`, but remains
below the `0.90` / `0.75` landmark gates. Browser/runtime promotion remains
forbidden and fail-closed; final Brev state was `STOPPED` / `NOT READY` /
`HEALTHY`.

Run3 completed in session 908 and is recorded at
`docs/validation/return-to-form-m3jb-landmark-pck-campaign-run3-w128-g64-hardgeomaug-fulltrain-brev-v1.json`.
The retained worker `asl-pilot-m3eh-l40s-001` / `3d58wpy9o` was used and then
stopped. Remote preflight verified the patched trainer hash and w128/g64 shape
smoke `(2, 21, 64, 64)`. Held-out test PCK regressed to `0.734000` /
`0.450600` versus the run2 running-best `0.749600` / `0.486700`, so this is a
no-clear-win experiment and remains below the `0.90` / `0.75` landmark gates.
Browser/runtime promotion remains forbidden and fail-closed; final Brev state
was `STOPPED` / `NOT READY` / `HEALTHY`. This is `1` consecutive
research-guided no-clear-win since the last running-best improvement, not the
3-failure campaign stop condition.

Session 909 completed the no-Brev research refresh after run3 and recorded it
at
`docs/validation/return-to-form-m3jb-landmark-pck-research-refresh-after-run3-v1.json`.
The ChatGPT Pro web route was attempted but blocked because the in-app browser
backend was unavailable (`iab` unavailable), so the prompt-authorized
`openai-api-research` / `gpt-5.5` fallback was used. Artifacts are saved under
`artifacts/research/m3jb-landmark-pck-refresh-909/`. The advisory
recommendation is to implement a scratch residual U-Net / lightweight hourglass
heatmap architecture at the same 128 input / 64 heatmap operating point,
preserving the existing 5-channel input, 21x64x64 heatmap output, soft-argmax
decode, and browser-compatible primitive ops. This requires local code/smoke
and audit work before another paid Brev launch.
Historical preflight instruction retained for audit continuity:
`m3jb_landmark_pck_resunet_architecture_preflight_no_brev` meant keep Brev stopped until local code/smoke evidence and the run4 envelope were durably
recorded.

Session 910 completed the local no-Brev architecture preflight and recorded it
at
`docs/validation/return-to-form-m3jb-landmark-pck-resunet-architecture-preflight-v1.json`.
The side-worktree trainer code is committed at
`712ab989d9451e92894ee72fc73e757a21f6d1ea` with trainer sha256
`295941330493c99ef9d985520e738499e895ca18637449f6933f56037bfed3c1`. The new
`perhand_resunet_heatmap` option preserves the 5-channel crop input, 21x64x64
heatmap output, soft-argmax decode, and browser-compatible primitive ops; the
default `perhand_heatmap` path remains unchanged. The CPU no-training smoke
produced heatmap shape `(2, 21, 64, 64)`, decode shape `(2, 21, 2)`, finite
loss, and parameter count `15,358,485`, with smoke sha256
`c39d5a2f877af6c994e9e9f6a0bf9e17ce099c8055cd89d1a4d505310c26688a`. It did
not run optimizer/backward, write a checkpoint, use Brev, train, promote browser
artifacts, upload raw learner video, add pretrained runtime dependencies, or
change final gates.

The single next action is
`m3jb_landmark_pck_run4_resunet_g64_fulltrain_brev_ok`: the local preflight is
complete, and the bounded campaign approval above applies to this run4 envelope.
Before launch, do a read-only `brev ls --json` visibility check and verify no
active conflicting training process is running. Exact training command:
`timeout 21600s brev exec asl-pilot-m3eh-l40s-001 "cd /home/ubuntu/asl-pilot && timeout 20000 env PYTHONDONTWRITEBYTECODE=1 .venv/bin/python tools/detector0-annotator/train_perhand_landmarks_heatmap.py --data tools/detector0-annotator/.cache/m3jb-perhand-rows-ledger-excluded-c35-v1 --model-arch perhand_resunet_heatmap --epochs 100 --batch 128 --eval-batch 512 --lr 5e-4 --device cuda --seed 0 --pck 0.10 --sigma 2.0 --heatmap-g 64 --width 128 --heatmap-ce-weight 0.05 --oversample-hard-geometry 0 --affine-aug-prob 0 --blur-prob 0 --noise-std 0 --eval-every 5 --out tools/detector0-annotator/output/m3jb-perhand-pckcampaign-resunet-w128-g64-fulltrain-e100-lr5e4-brev-v1.json"`.
Exact eval commands:
`timeout 3600s brev exec asl-pilot-m3eh-l40s-001 "cd /home/ubuntu/asl-pilot && env PYTHONDONTWRITEBYTECODE=1 .venv/bin/python tools/detector0-annotator/train_perhand_landmarks_heatmap.py --eval-only --data tools/detector0-annotator/.cache/m3jb-perhand-rows-ledger-excluded-c35-v1 --weights tools/detector0-annotator/output/m3jb-perhand-pckcampaign-resunet-w128-g64-fulltrain-e100-lr5e4-brev-v1.pt --out tools/detector0-annotator/output/m3jb-perhand-pckcampaign-resunet-w128-g64-fulltrain-e100-lr5e4-brev-v1-eval-pck010.json --pck 0.10 --device cuda --eval-batch 512"`
and
`timeout 3600s brev exec asl-pilot-m3eh-l40s-001 "cd /home/ubuntu/asl-pilot && env PYTHONDONTWRITEBYTECODE=1 .venv/bin/python tools/detector0-annotator/train_perhand_landmarks_heatmap.py --eval-only --data tools/detector0-annotator/.cache/m3jb-perhand-rows-ledger-excluded-c35-v1 --weights tools/detector0-annotator/output/m3jb-perhand-pckcampaign-resunet-w128-g64-fulltrain-e100-lr5e4-brev-v1.pt --out tools/detector0-annotator/output/m3jb-perhand-pckcampaign-resunet-w128-g64-fulltrain-e100-lr5e4-brev-v1-eval-pck005.json --pck 0.05 --device cuda --eval-batch 512"`.
Success signal: held-out test PCK@0.10 > `0.749600` and PCK@0.05 >
`0.486700`. Kill condition: if validation PCK@0.10 has never matched run2 validation PCK@0.10 `0.709800` by about epoch 70, save best logs/checkpoint and
do not launch any follow-up experiment. After copyback or crash evidence
capture, stop the worker and verify `STOPPED` / `NOT READY` in `brev ls --json`.
Do not run DSNT/alternate-head code, per-keypoint weighting, another
augmentation-first run, browser promotion, raw upload, pretrained runtime
dependencies, or final-gate changes.

## REVIEWER REDIRECT (Claude, 2026-06-02) — highest priority; supersedes the "Next step" below

STOP pursuing more learned-selector training and uncapped Brev runs for the
two-hand distinct-assignment gate. This mission's own receipts show the candidate
SET already supports the gate (oracle distinct-assignment 0.96-1.00, collapse 0),
but every trained selector has plateaued at 0.43-0.69 selected across 8+ variants
(subproposal / crop-pose / candidate-head / pair-rank / pair-margin / direct-pair /
assignment-head), including multiple full-scope Brev runs. The gap is selector
objective/calibration — NOT detection, data, or compute. More uncapped Brev
selector training is the lowest-leverage next step and is NOT the authorized next
action.

Do this instead, all LOCAL / no-Brev, in order:
1. Establish the simple TOP-2 objectness + NMS heuristic selection as the baseline
   (no training). The asl-pilot-web detector already runs this decoupled approach
   at ~92.9% both-hands-matched / 0% collapse in production; the wider-candidate
   oracle here is 0.96. Measure its distinct-assignment on the 84 real two-hand rows.
2. Close the remaining gap with DETERMINISTIC post-filters targeting the audited
   failure modes (candidate-selection-failure-audit): a min-box-size floor
   (selected_subbox_too_small=29), spatial-separation / same-GT-slot rejection
   (same_gt_slot_selected=27), and a quality/hard-negative threshold
   (quality_false_positive=43, selected_hard_negative=15). Free; targets the exact
   oracle->selected gap.
3. Surface the PRODUCT question in the receipt: does M3JB actually require distinct
   L/R ASSIGNMENT >= 0.98, or is "two non-collapsed boxes" (already achieved,
   collapse 0) sufficient for the recognizer? If L/R identity is not a recognizer
   requirement, the shipped decoupled detector effectively passes and the 0.98
   distinct-ASSIGNMENT gate is over-specified — flag for human gate-reframe rather
   than more compute.

Only AFTER the heuristic baseline + post-filter ceiling is measured and recorded
may a learned selector be revisited — and then as a bipartite/Hungarian
set-prediction assignment loss (joint pair optimization), as ONE bounded run, not
more independent-scoring epochs. Do not start Brev for selector training before
steps 1-2 are done and recorded.

## UPDATE (2026-06-02) — redirect above is DONE; gate-reframe RESOLVED

Steps 1-2 are complete (session logs 855-856): local TOP-2 objectness + NMS gives
collapse 0.000 / two distinct boxes 1.000 / coverage 0.964; DETERMINISTIC
post-filters lift coverage to 0.988 and distinct-assignment to 0.976 — no
training, no Brev. Step 3's product question is answered: the current active
recognizer / practice path does not consume L/R identity, and the user decided
(2026-06-02, locked in `DECISIONS.md`) that handedness / distinct anatomical L/R
identity is NOT a demo requirement. The binding two-hand gate is "two
non-collapsed boxes," which is MET. STOP chasing the residual 1-2
distinct-assignment rows; do NOT resume Brev selector training for it. Advance
down the hierarchy to the next demo-visible bottleneck (landmark/crop quality ->
temporal track stability -> end-to-end browser parity), per the Work To Complete
list below and GOAL.md's current ACTIVE DIRECTIVE.

ANTI-GRIND REDIRECT (2026-06-02 evening): the loop fell into hand-reviewing the
clearer-source crop packet ONE row per commit (~30 commits, 39 still pending, 0
cache rebuilds, 0 retrains, PCK unchanged). Stop that. In ONE slice batch-finish
the remaining row reviews (one commit, not per-row), THEN rebuild the per-hand
crop cache and RETRAIN the scratch 21-landmark student (Brev for the full fit —
this stage is compute-bound) and RE-MEASURE held-out PCK@0.10 / PCK@0.05 vs the
baseline. PCK movement is the gate. If exclusions do not move PCK, pivot the
lever (more/better crop data, higher input resolution, or architecture) rather
than deleting more rows. Execution guard: every slice must change the model or
its measured metrics, not just a ledger row; no one-row-per-commit; escalate
after two no-movement slices.

## UPDATE (2026-06-03 historical) — regression pivot selected; superseded by campaign run1

Session 904 completed
`analyze_m3jb_landmark_retrain_regression_and_select_pivot_no_brev` and wrote
`docs/validation/return-to-form-m3jb-landmark-retrain-regression-pivot-v1.json`.
The local no-Brev analysis rejects same-envelope relaunch, more frame-edge row
deletion, selector training, browser promotion, and final-gate changes. The
selected lever is higher input resolution / capacity preflight because cache
exclusions helped the existing checkpoint only slightly, while the approved
w64/heatmap32 quality-filtered scratch retrain regressed broadly: only `2/21`
keypoints improved at PCK@0.10, train filtering removed `6553/22202` crops
(`29.5154%`), and validation PCK dropped from `0.660300` / `0.363000` to
`0.599800` / `0.300000`.

The historical local preflight token was
`m3jb_landmark_resolution_capacity_preflight_no_brev`. That local preflight next
action is now historical: session 905 completed the research-guided campaign
setup, and session 906 completed the first higher-resolution/capacity Brev run.
The current next action is the run2 token at the top of this prompt.

## UPDATE (2026-06-03 later) — approved Brev retrain completed; rejected fail-closed

Session 903 consumed the current-thread Brev approval for the bounded
`M3JB landmark retrain plan v1`. The retained worker
`asl-pilot-m3eh-l40s-001` / `3d58wpy9o` passed duplicate-worker and
CUDA/process preflight, received only the approved trainer/helper/cache files,
ran the recorded scratch CUDA retrain, ran eval-only PCK@0.10 and PCK@0.05,
copied back the planned artifacts, and was stopped.

The result is rejected fail-closed because it regressed below the rebuilt-cache
baseline and remains far below the landmark gates:

- PCK@0.10 `0.648400` vs rebuilt-cache baseline `0.663300` and gate `0.90`
- PCK@0.05 `0.365100` vs rebuilt-cache baseline `0.372200` and gate `0.75`

Do not relaunch this consumed approval, do not reuse it for another Brev run,
and do not promote browser/runtime artifacts from this checkpoint. The previous
local pivot action is now complete; any future Brev run needs a new receipt and
explicit approval.

## UPDATE (2026-06-03) — current-thread Brev approval granted and consumed

Sessions 893-896 completed the anti-grind prerequisites through the approval
handoff: the clearer-source ledger is batch-finished with `64` explicit
frame-edge/OOB exclusions, the rebuilt per-hand cache has `30120` crops, and
eval-only measurement on the existing scratch checkpoint is recorded
(PCK@0.10 `0.663300`, PCK@0.05 `0.372200`). The full scratch per-hand landmark
retrain route is recorded at
`docs/validation/return-to-form-m3jb-landmark-retrain-brev-plan-v1.json`.

**HUMAN BREV SPEND APPROVAL GRANTED (2026-06-02, current thread; consumed
2026-06-03).** Verbatim approval:

> I approve current-thread Brev/GPU spend for M3JB landmark retrain plan v1: use retained worker asl-pilot-m3eh-l40s-001 / 3d58wpy9o, max spend $40, max outer runtime 21600s, sync/copy only the files needed for docs/validation/return-to-form-m3jb-landmark-retrain-brev-plan-v1.json, run the recorded CUDA scratch landmark retrain, run eval-only PCK@0.10 and PCK@0.05, copy back the planned artifacts, and stop/cleanup according to the recorded kill conditions.

The `await_explicit_brev_spend_approval_then_launch_landmark_retrain_brev_plan`
gate was satisfied and is now consumed by the completed run. Do not launch
`brev exec`, sync, copyback, remote eval, or training from stale context or
outside a newly approved envelope.

## Mission

Build ASL Pilot's owned hand tracker as an explicit hierarchy: pixels -> hand
proposals -> crops -> 21 landmarks -> normalized hand state -> temporal tracks
-> sign-sequence features. Fix the live failure where both tracks collapse onto
one physical hand, boxes are loose or stale, and landmarks are not yet a trusted
recognizer bottleneck.

## Source Of Truth

1. Latest user instruction, then `GOAL.md`, then the active M3JA/M3JB prompt.
2. M3JA validation receipt and Detector0 region/landmark target contract.
3. Side-worktree receipts in `/Users/kelly/Developer/asl-pilot-annotator`.
4. Browser truth from `/Users/kelly/Developer/asl-pilot-web` and user failure frames.

## Hard Boundaries

No pretrained CV/sign/landmark/model dependency may ship in runtime. MediaPipe
is offline teacher/evaluator only. No raw learner video upload. Browser
artifacts stay default-off until gates pass.

## Compute Policy

The user explicitly authorizes effectively unconstrained Brev/NVIDIA GPU compute
through the CLI for M3JB training and evaluation work that is needed to reach
the hand-state gates. Do not downsize batches, cap rows, sample, shorten final
schedules, or choose a smaller training/evaluation dataset merely to make a run
finish in a reasonable time on the local Mac; small local runs only as smoke tests
for code, dataloaders, receipts, or loss movement. They are not a
substitute for full-scope evidence.

When a stage needs heavy training, large batches, full datasets, hard-negative
mining, ablations, or multi-epoch promoted-candidate fitting, route it to Brev
through the CLI and record the exact command, instance/run identity, artifacts,
copyback path, metrics, and stop/cleanup outcome in the existing receipt chain.
Compute is not the limiting constraint for this model lane; do not let local
device runtime steer model quality downward. Correctness, source/provenance
boundaries, no-pretrained runtime, and browser gates are the constraints.
Heavy Brev launches still require explicit human approval before spend.

## Required Decomposition

Define a canonical `HandState` bottleneck:

`HandProposal { box, score, crop, quality }`
`HandInstance { box, landmarks21, visibility, handness_or_slot, confidence }`
`HandTrack { id, landmarks, velocity, occlusion_state, stale_state }`

Normalize before ranking or temporal modeling: crop xy, full-frame xy,
wrist/palm-relative xy, scale, optional rotation, mirrored hand-canonical pose,
visibility masks, uncertainty, box quality, and velocity.

## Work To Complete

1. Repair proposal selection so two visible hands produce two distinct boxes.
   Report old coverage and `distinct_assigned_coverage`.
2. Add handness and box-quality targets for candidate ranking, including hard
   negatives where one broad box covers both hands.
3. Improve crop policy for edge, OOB, tiny, low-texture, and overlapping hands;
   preserve source row metadata and label provenance.
4. Improve the scratch 21-landmark student until landmarks are a usable
   structured representation.
5. Add temporal identity modeling: swaps, continuity, missing-hand recovery,
   stale-box decay, jitter control, and confidence-aware smoothing.
6. Build end-to-end eval from frame -> proposals -> instances -> tracks with
   receipts, failure contact sheets, and browser parity.
7. Do not resume sign/language modeling until hand-state gates pass or the lane
   is explicitly experimental.

## Acceptance Criteria

- Boxes: recall@IoU0.30 >= 0.98, recall@IoU0.50 >= 0.90, false no-hand <=
  0.02, hard-negative false trigger <= 0.05, duplicate/collapse <= 0.02, and two
  distinct non-collapsed boxes when two hands are visible. (Anatomical L/R
  identity assignment is descoped for the demo per DECISIONS.md 2026-06-02; the
  old distinct-assignment >= 0.98 gate is not a demo requirement.)
- Landmarks: 21 points per visible hand, PCK@0.10 >= 0.90, PCK@0.05 >= 0.75,
  no persistent topology flips, browser mapping proven.
- Tracking: swap rate <= 0.02, no dual-track collapse to one hand, no confident
  stale boxes, acceptable latency or documented every-N-frame policy.
- Runtime: live `/tracking` and user failure frames pass without pretrained runtime deps.

## Evidence And Rhythm

Inspect state, choose the smallest blocking stage, make one scoped change, run
stage and end-to-end checks, record commands/artifacts/metrics in the existing
receipt chain, compare against gates, and continue. If a gate fails, say so and
keep fail-closed. Browser truth beats offline metrics.

Progress ledger:
Current state: fail-closed and not gate-passing. Focused-sliver subproposals
now prove a perfect real two-hand candidate oracle at `src8/aug64`:
coverage/distinct/collapse `1.000000 / 1.000000 / 0.000000`. Trained selectors
still remain far below gate, so the active blocker has moved from candidate
coverage/tiny-hand ceiling to selector scoring/calibration/supervision.
Completed: geometry-only pairwise subproposal ranker rejected, crop/pose
pairwise subproposal ranker rejected, candidate-level crop/pose subproposal
head rejected, candidate-selection failure audit completed, and pair-rank
candidate-head objective repair implemented, smoke-proven, and run uncapped on
Brev; pair-margin selector repair implemented, smoke-proven, run uncapped on
Brev, and rejected; direct pair-scorer local smoke passed, the provider SSH
blocker was recovered, and the uncapped full-scope Brev direct pair-scorer run
completed and was rejected; overlap-aware assignment-head repair implemented,
smoke-proven, run uncapped on Brev in score+loss and loss-only variants, and
rejected; focused-sliver candidate generation implemented, oracle-proven, run
through an uncapped aug64 direct-pair Brev selector, and rejected; pair-ranker
calibration audit implemented and run eval-only over that rejected selector.
Evidence: canonical receipt
`docs/validation/return-to-form-m3jb-hierarchical-hand-state-tracker-v1.json`;
candidate failure receipt
`tools/detector0-annotator/output/m3jb-hand-candidate-selection-failure-audit-croppose-top40-src8-aug24-v1.json`;
pair-rank smoke/Brev receipt
`docs/validation/return-to-form-m3jb-pairrank-selector-objective-smoke-and-brev-provider-v1.json`;
pair-margin repair receipt
`docs/validation/return-to-form-m3jb-pairmargin-selector-repair-brev-v1.json`;
direct pair-scorer smoke/provider receipt
`docs/validation/return-to-form-m3jb-direct-pair-scorer-smoke-and-brev-provider-blocker-v1.json`;
assignment-head repair receipt
`docs/validation/return-to-form-m3jb-overlap-aware-assignment-head-repair-brev-v1.json`;
focused-sliver repair receipt
`docs/validation/return-to-form-m3jb-focused-sliver-subproposal-repair-brev-v1.json`;
pair-ranker calibration audit receipt
`docs/validation/return-to-form-m3jb-pair-ranker-calibration-audit-v1.json`.
Failure diagnosis: `52/84` real two-hand rows fail selected assignment while
the oracle fails `1/84`; dominant tags are `selected_low_target_candidate`,
`quality_false_positive`, `selected_subbox_too_small`,
`same_gt_slot_selected`, and `selected_hard_negative_candidate`.
Pair-rank repair: the candidate head now supports an optional listwise pair
ranking loss over the final pair-selection score. Local train32 smoke passed
and wrote
`tools/detector0-annotator/output/m3jb-hand-candidate-head-pairrank-croppose-top40-src4-aug16-train32-e1-smoke-v1.json`,
but it is not gate evidence. The full-scope Brev run used `--max-train-rows 0`
on retained worker `asl-pilot-m3eh-l40s-001` / `3d58wpy9o`, trained on all
`2535` train groups / `60840` candidates, and wrote
`tools/detector0-annotator/output/m3jb-hand-candidate-head-pairrank-croppose-top40-src8-aug24-fulltrain-e36-brev-v1.json`
and `.pt`. It selected validation epoch `2`; real two-hand selected
coverage/distinct/collapse was `0.892857 / 0.464286 / 0.059524`, while the
same candidate set oracle remained `0.988095 / 0.988095 / 0.0`.
Pair-margin follow-up: candidate-head scoring now also supports an optional
hard-negative pair-margin loss. The uncapped Brev run used `--max-train-rows 0`
on all `2535` train groups / `60840` candidates and wrote
`tools/detector0-annotator/output/m3jb-hand-candidate-head-pairmargin-croppose-top40-src8-aug24-fulltrain-e36-brev-v1.json`
and `.pt`. It selected validation epoch `2`; real two-hand selected
coverage/distinct/collapse was `0.904762 / 0.464286 / 0.047619`, while the
same candidate set oracle remained `0.988095 / 0.988095 / 0.0`. This slightly
improves coverage/collapse but does not improve distinct assignment, so the
pair-margin candidate-head repair is rejected.
Direct pair-scorer follow-up: the existing direct `PairRanker` path was
smoke-tested locally with `--max-train-rows 32`, source topk `4`, aug max topk
`16`, and `1` epoch. This is diagnostic only, not gate evidence. It wrote
`tools/detector0-annotator/output/m3jb-hand-pair-ranker-directpair-croppose-top40-src4-aug16-train32-e1-smoke-v1.json`
and `.pt`; real two-hand selected coverage/distinct/collapse was
`0.750000 / 0.452381 / 0.095238`, while the same candidate set oracle remained
`0.988095 / 0.988095 / 0.0`. The recovered uncapped Brev run kept
`--max-train-rows 0`, source topk `8`, aug max topk `24`, `36` epochs, and
CUDA. It trained on all `2535` train groups / `699660` pairs and wrote
`tools/detector0-annotator/output/m3jb-hand-pair-ranker-directpair-croppose-top40-src8-aug24-fulltrain-e36-brev-v1.json`
and `.pt`. It selected validation epoch `35`; real two-hand selected
coverage/distinct/collapse improved to `0.928571 / 0.690476 / 0.011905`,
while the same candidate set oracle remained `0.988095 / 0.988095 / 0.0`.
This is materially better than the rejected candidate-head repairs but still
below the `>= 0.98` distinct-assignment gate, so the direct pair scorer is
rejected and fail-closed. Both observed L40S workers ended `STOPPED`; the failed
fresh Nebius worker created during provider recovery was deleted.
Direct-pair failure audit: the retained fulltrain receipt has `26` sampled
distinct-assignment failures and `6` coverage failures. A lightweight taxonomy
shows `23/26` distinct-assignment failures have high-overlap GT hand pairs,
only `1/26` has high selected-pair overlap, `5/26` have selected low IoU to GT,
and `1/26` includes tiny GT hand row `12692`. The remaining problem is now more
overlap/slot-assignment behavior than simple selected-pair collapse.
Overlap-aware assignment-head follow-up: the pair ranker now supports an
optional three-class assignment head (`none`, `direct`, `swapped`) with
positive and high-overlap-GT weighting, plus optional assignment-head evidence
added to pair scores. Local self-test, py_compile, and train32 smoke passed.
Two uncapped Brev/CUDA fulltrain variants used `--max-train-rows 0`, source
topk `8`, aug max topk `24`, `36` epochs, all `2535` train groups, and
`699660` train pairs on retained worker `asl-pilot-m3eh-l40s-001` /
`3d58wpy9o`. The score+loss variant wrote
`tools/detector0-annotator/output/m3jb-hand-pair-ranker-assignmenthead-croppose-top40-src8-aug24-fulltrain-e36-brev-v1.json`
and `.pt`; real two-hand selected coverage/distinct/collapse was
`0.869048 / 0.642857 / 0.023810`. The loss-only variant wrote
`tools/detector0-annotator/output/m3jb-hand-pair-ranker-assignmenthead-lossonly-croppose-top40-src8-aug24-fulltrain-e36-brev-v1.json`
and `.pt`; real two-hand selected coverage/distinct/collapse was
`0.916667 / 0.678571 / 0.023810`. The same candidate set oracle remained
`0.988095 / 0.988095 / 0.0`. Both assignment-head variants regress from the
direct pair scorer's `0.928571 / 0.690476 / 0.011905`, so they are rejected and
fail-closed. The retained Brev worker was stopped after copyback.
Focused-sliver follow-up: candidate origin diagnostics and focused tiny/edge
sliver boxes were added. The aug64 focused-sliver oracle recovers rows `12328`,
`12329`, and tiny-hand row `12692`, with no regressions, and reaches real
two-hand coverage/distinct/collapse `1.000000 / 1.000000 / 0.000000`. The
uncapped Brev/CUDA direct-pair fit used `--max-train-rows 0`, all `2535` train
groups, `5110560` train pairs, source topk `8`, aug max topk `64`, `36`
epochs, and batch groups `512`. It wrote
`tools/detector0-annotator/output/m3jb-hand-pair-ranker-focusedsliver-directpair-croppose-top40-src8-aug64-fulltrain-e36-brev-v1.json`
and `.pt`. It selected validation epoch `35`; real two-hand selected
coverage/distinct/collapse regressed to `0.880952 / 0.523810 / 0.059524`,
while the same candidate set oracle was `1.000000 / 1.000000 / 0.000000`. This
checkpoint is rejected and fail-closed. Brev API copyback/final status was
blocked by a stale login prompt after the run; direct SSH/SCP copyback and
remote hash verification succeeded, no trainer process remained, and direct
SSH shutdown was issued with follow-up SSH timeout.
Pair-ranker calibration audit follow-up: an eval-only audit of the rejected
focused-sliver aug64 pair-ranker now writes
`tools/detector0-annotator/output/m3jb-hand-pair-ranker-focusedsliver-directpair-calibration-audit-top40-src8-aug64-fulltrain-e36-v1.json`
and contact sheet `.png`. It confirms all `45/84` audit failures have an
oracle-compatible pair available but under-ranked. Failure rows have mean
selected-minus-oracle logit `4.258158`, mean oracle logit rank `113.355556`,
median oracle rank `26`, max oracle rank `1633`, mean selected target
`-0.368260`, and mean oracle target `0.799851`. Dominant tags are
`oracle_pair_under_scored`, `selected_low_distinct_pair`,
`selected_low_target_pair`, `oracle_pair_outside_top10_logits`,
`same_gt_slot_selected`, and `selected_hard_negative_pair`.
Direct pair-margin objective follow-up: the direct `PairRanker` path now has
an optional hard-negative margin objective via `--pair-ranker-margin-weight`,
`--pair-ranker-margin`, and `--pair-ranker-margin-positive-threshold`.
`py_compile`, `--self-test`, and a train32/src4/aug16/1-epoch local smoke
passed and wrote
`tools/detector0-annotator/output/m3jb-hand-pair-ranker-pairmargin-focusedsliver-src4-aug16-train32-e1-smoke-v1.json`
and `.pt`. This is diagnostic only, not gate evidence. The uncapped Brev run
has not started because `brev ls --json` currently reports the CLI is logged
out and exits after the login prompt; an explicit `brev login` attempt started
login for the stored email but waited on browser completion and was interrupted
so no background auth process remained. After Brev auth is refreshed, run the
full-scope `src8/aug64`, `--max-train-rows 0` direct pair-margin fit on
Brev/NVIDIA compute, record copyback/hashes in the existing receipt chain, and
do not substitute smaller local batches, row caps, shortened schedules, or a
smaller final dataset.
Remaining gates: boxes need distinct two-hand assignment `>= 0.98`, landmarks
need PCK@0.10 `>= 0.90` and PCK@0.05 `>= 0.75`, temporal HandTrack gates are
not evaluated, and browser `/tracking` remains default-off.
Blockers: selector objective/calibration is still wrong. Focused-sliver aug64
removes the candidate-ceiling blocker, but the trained selector chooses wrong,
collapsed, or low-target pairs even when a perfect oracle pair exists, and the
calibration audit proves the oracle pairs are often far below the selected pair
in logit rank.
Next step: `m3jb_heuristic_top2nms_baseline_then_deterministic_postfilters_local_no_brev` — see the REVIEWER REDIRECT at the top of this file, which supersedes the prior `refresh_brev_auth_then_run_uncapped...` next step. Do not start Brev for selector training until the heuristic baseline + post-filter ceiling is measured and recorded.
Use the calibration audit before judging the next full-scope fit. Do not
increase or shrink candidate budgets as a runtime convenience unless the
evidence says the model needs it; `aug64` is the current smallest checked
perfect-oracle budget. Do not promote the smoke checkpoint, do not resume sign
modeling, and do not replace future full-scope evidence with capped local
training, smaller batches, shortened schedules, or a smaller final dataset; use
local runs only for smoke/debug and route serious candidate fitting back to
Brev.
