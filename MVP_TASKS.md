# MVP_TASKS

status: **annotated against repo state** on 2026-05-23.
architecture source: [`ARCHITECTURE.md`](ARCHITECTURE.md)
gap audit: [`docs/session-logs/001-gap-audit.md`](docs/session-logs/001-gap-audit.md)
last orchestrator round: 001 — initial plan amendment + Stage A vestige removal brief.

## universal acceptance (applies to every task)

Every task — in addition to its own acceptance criteria — must also:

1. Run the task's `validation` command and record `pass | fail | partial`.
2. Update its row in this file (status + file pointers) before close.
3. Append a one-line entry to the relevant area `LESSONS.md` if a reusable lesson was learned.
4. Append a slice entry to the current `docs/session-logs/NNN-*.md`.
5. **Commit locally** following the heredoc template in [`docs/autonomous-orchestrator-protocol.md`](docs/autonomous-orchestrator-protocol.md). One slice = one commit (unless the task's brief explicitly groups multiple slices into one commit). Never `--no-verify`, never `--amend`, never `git add -A`, never push without human go.

The orchestrator's `/orchestrate-end` enforces all five.

## reading guide

Each task's `repo state` row is one of:

- **DONE** — implemented in the repo; cited files reachable now. May still need a small refactor to the typed interface.
- **PARTIAL** — most of it works; specific deltas are noted.
- **MISSING** — no equivalent exists; this is real new work.
- **BLOCKED** — depends on another task (typically Stage A removal, or first-party data collection).
- **DEFERRED** — explicitly out of scope this round.

`validation` rows reference existing `node scripts/audit_*.mjs` / `python scripts/*.py` commands wherever possible (the repo already has 200+ such scripts; we do not introduce a parallel system per the harmonization decision).

## current state

> 2026-06-03 active-loop note: Session 923 completed
> `m3jb_recognizer_transformer_run3_research_guided_tuning_no_brev` with no
> Brev, training, checkpoint, browser promotion, raw upload, pretrained runtime
> dependency, final-gate change, or push. ChatGPT Pro/browser was attempted but
> no session-owned `iab` backend was available, so the prompt-authorized
> `openai-api-research` / `gpt-5.5` fallback saved artifacts under
> `artifacts/research/m3jb-recognizer-transformer-run3-tuning-923/` and the
> receipt at
> `docs/validation/return-to-form-m3jb-recognizer-transformer-run3-research-tuning-v1.json`.
> The memo treats run3 as an optimizer/update-density success that is likely now
> representation/generalization-limited; selected next action is
> `m3jb_recognizer_transformer_t32_cache_loader_preflight_no_brev`: implement and
> locally validate T=32 recognizer cache/loader support before any paid run4.
> A future run4, if the preflight passes, keeps run3 hyperparameters fixed and
> changes only the audited sequence length/cache from T=20 to T=32.
>
> 2026-06-03 active-loop note: Session 922 completed
> `m3jb_recognizer_transformer_run3_scheduler_fulltrain_brev_ok` under the
> recorded recognizer Brev approval. The full-data scheduler run used train
> `7011`, monitor `955`, test `2369`, epochs `240`, batch `128`, lr `5e-4`,
> warmup `500`, cosine min lr `5e-5`, expected optimizer steps `13200`, and no
> `--limit-*` flags. Metrics improved the recognizer running best but remain
> fail-closed below the primary gate: test top-1 `0.2984`, top-5 `0.6036`,
> verification recall@FAR10 `0.7316`, best monitor top-1 `0.378` at epoch
> `184`, target `>=0.85`. Artifacts were copied back to the ignored annotator
> output path and hash-verified; final Brev state is `STOPPED` / `NOT READY` /
> `HEALTHY`. Receipt:
> `docs/validation/return-to-form-m3jb-recognizer-transformer-fulltrain-run3-scheduler-brev-v1.json`.
> Current next action is
> `m3jb_recognizer_transformer_run3_research_guided_tuning_no_brev`: research
> the run3 result and record a run4 recipe before any further paid run.
>
> 2026-06-03 active-loop note: Session 921 completed
> `m3jb_recognizer_transformer_lr_schedule_preflight_no_brev` with no Brev,
> remote sync, or checkpoint output. Side-worktree commit `8a780ae` added
> fixed-default scheduler flags and receipt LR trace fields; trainer sha256
> `bfa4ed698da20561e3b3005f56467edec42161f0269e3fc57535c7701b392898`.
> Local no-save tiny overfit reached history-best train top-1 `1.000`; the
> full-data no-save smoke used no `--limit-*` flags and recorded train `7011`,
> monitor `955`, test `2369`, plus the run3 expected optimizer steps `13200`.
> Receipt:
> `docs/validation/return-to-form-m3jb-recognizer-transformer-lr-schedule-preflight-v1.json`.
> Current next action is
> `m3jb_recognizer_transformer_run3_scheduler_fulltrain_brev_ok`: read-only
> Brev visibility, remote process/CUDA preflight, sync/hash-verify the scheduler
> trainer, then run the full-data scheduler recipe only if the preflight matches.
>
> 2026-06-03 active-loop note: Session 920 completed the no-Brev run2
> research-guided tuning pass. ChatGPT Pro/browser was attempted but no
> session-owned `iab` backend was available, so the prompt-authorized
> `openai-api-research` / `gpt-5.5` fallback saved artifacts under
> `artifacts/research/m3jb-recognizer-transformer-run2-tuning-920/` and the
> receipt at
> `docs/validation/return-to-form-m3jb-recognizer-transformer-run2-research-tuning-v1.json`.
> Selected run3 recipe is Transformer d256/l6/h8, batch `128`, epochs `240`,
> lr `5e-4`, warmup `500` steps, cosine decay to min lr `5e-5`, dropout `0.0`,
> alpha `0.55`, temperature `3.0`, jitter `0.02`, frame-drop `0.10`, full data
> with no `--limit-*`, expected `13200` optimizer steps. Current trainer lacks
> scheduler/warmup flags, so the current next action is
> `m3jb_recognizer_transformer_lr_schedule_preflight_no_brev`, not a Brev run3
> launch.
>
> 2026-06-03 active-loop note: Session 919 completed the approved low-LR
> recognizer Transformer fulltrain run2 on recovered retained worker
> `asl-pilot-m3eh-l40s-001` / `3d58wpy9o`. The run used full data, no
> `--limit-*` flags, `200` epochs, batch `256`, `d_model=256`, `n_layers=6`,
> `n_heads=8`, dropout `0.0`, and lr `5e-4`. It learned instead of collapsing
> at chance, but remains fail-closed: test top-1 `0.2609`, top-5 `0.5635`,
> verification recall@FAR10 `0.686` versus target `>=0.85` and GRU recall
> baseline about `0.7`. Artifacts were copied back to the annotator worktree;
> browser/runtime promotion and final-gate changes remain forbidden. The
> worker was stopped; final state `STOPPED` / `NOT READY` / `HEALTHY`. Current
> next action is
> `m3jb_recognizer_transformer_run2_research_guided_tuning_no_brev`.
>
> 2026-06-03 active-loop note: Session 918 completed a read-only Brev worker
> health refresh for the approved low-LR recognizer Transformer fulltrain. No
> existing NVIDIA worker was usable: retained worker `asl-pilot-m3eh-l40s-001`
> / `3d58wpy9o` listed `UNHEALTHY` / `READY` / `UNHEALTHY`, and
> `asl-pilot-m3jb-pairrank-l40s-001` / `h15cj91es` listed `STOPPED` /
> `NOT READY` / `UNHEALTHY`. No Brev lifecycle/control action, sync, training,
> checkpoint, or copyback occurred. Current next action is
> `m3jb_recognizer_transformer_low_lr_fulltrain_wait_for_healthy_brev_worker_or_infra_approval`:
> retry only when an already existing NVIDIA worker is healthy and SSH/CUDA
> preflight succeeds, or get explicit human approval before Brev infra
> creation, deletion, reset, or repair.
>
> 2026-06-03 active-loop note: Session 917 attempted the approved low-LR
> recognizer Transformer fulltrain Brev slice but stopped at preflight. The
> retained worker `asl-pilot-m3eh-l40s-001` / `3d58wpy9o` initially listed
> `STOPPED` / `NOT READY` / `HEALTHY`, but SSH/CUDA preflight never connected
> after start and the worker degraded to `UNHEALTHY`. Stop by name, id, and
> `--all` left final state `STOPPED` / `NOT READY` / `UNHEALTHY`. No sync,
> training, checkpoint, or copyback occurred. Current next action is
> `m3jb_recognizer_transformer_low_lr_fulltrain_brev_retry_after_worker_health_ok`.
>
> 2026-06-03 active-loop note: Session 916 completed the local no-Brev
> Transformer tiny-failure debug. The existing `SeqTransformer` self-test
> passed, a small CLS Transformer overfit the 32-clip hard-label/no-aug split
> (`4.5943 -> 0.0071`, history-best train top-1 `1.000`), and the run1-sized
> Transformer also overfit once lr was lowered to `5e-4` (`4.5488 -> 0.0068`,
> history-best train top-1 `1.000`). The current next action is
> `m3jb_recognizer_transformer_low_lr_fulltrain_brev_ok`: one full-scope CUDA
> run with run1 shape and lr `5e-4`, then copy back artifacts and stop the
> worker.
>
> 2026-06-03 active-loop note: Session 915 completed local no-save recognizer
> overfit diagnostics. Side-worktree commit `3f9d3f0` added diagnostic receipt
> support. The GRU control overfit `32` hard-label/no-augmentation clips
> (`4.5801 -> 0.0103`, history-best train top-1 `1.000`), but the run1
> Transformer shape did not (`4.5442 -> 2.6501`, history-best train top-1
> `0.250`, final train predictions used only `2` classes). Current next action
> is `m3jb_recognizer_transformer_tiny_failure_debug_no_brev`; do not launch a
> second recognizer Brev run until the Transformer-specific tiny failure is
> debugged locally.
>
> 2026-06-03 active-loop note: Session 914 completed no-Brev research triage
> after recognizer Transformer run1 collapsed. The ChatGPT Pro/browser route was
> unavailable from the current callable tool set, so the prompt-authorized
> `openai-api-research` / `gpt-5.5` fallback saved artifacts under
> `artifacts/research/m3jb-recognizer-transformer-run1-triage-914/`. The
> selected next action is
> `m3jb_recognizer_transformer_local_overfit_diagnostics_no_brev`: add/use local
> train-subset and gradient/logit diagnostics, compare tiny hard-label/no-aug
> GRU and Transformer overfit checks, and do not launch a second recognizer Brev
> run until the Transformer proves it can learn locally.
>
> 2026-06-03 active-loop note: Session 913 completed the first full-scope M3JB
> recognizer Transformer Brev run and rejected it fail-closed. The run used full
> data with no `--limit-*` flags (`160` epochs, batch `256`, `d_model=256`,
> `n_layers=6`, `n_heads=8`, lr `1e-3`) and copied `.json` + `.pt` artifacts back
> to the annotator worktree. Metrics collapsed below the GRU baseline: test
> top-1 `0.008`, top-5 `0.0502`, verification recall@FAR10 `0.1124` versus
> baseline top-1 `0.232`, top-5 `0.567`, recall@FAR10 about `0.7`. Final Brev
> state for `asl-pilot-m3eh-l40s-001` / `3d58wpy9o` was `STOPPED` /
> `NOT READY` / `HEALTHY` after `brev stop` by name, id, and `--all`. Next
> action is
> `m3jb_recognizer_transformer_research_guided_tuning_after_run1_no_brev`.
>
> 2026-06-03 active-loop note: Session 912 completed the active M3JB recognizer
> Transformer preflight + sync slice under the approval recorded in `GOAL.md`
> and the active prompt. The retained worker `asl-pilot-m3eh-l40s-001` /
> `3d58wpy9o` is `RUNNING` / `READY` / `HEALTHY`; no training process is active;
> the recognizer code, teacher checkpoint, GRU baseline artifacts, and caches
> `.cache/recog-seq-w64-merged` plus `.cache/handcrop-lm2` are synced and
> hash-verified on the worker. Next action is
> `m3jb_recognizer_transformer_fulltrain_brev`: full-scope CUDA Transformer
> distillation with no `--limit-*` flags, at least `120` epochs, and reporting
> test top-1, top-5, and `verification_recall_at_far10`.
>
> 2026-06-02 active-loop note: `GOAL.md` and
> `docs/model/return-to-form-m3jb-hierarchical-hand-state-tracker-goal-loop-prompt.md`
> supersede the older task-graph narrative below. Session 855 recorded the
> M3JB top-2 objectness + NMS heuristic baseline locally/no-Brev:
> `coverage=0.964286`, `distinct_assigned_coverage=0.428571`,
> `decoded_two_distinct=1.000000`, `collapse_rate=0.000000`. Next action is
> deterministic local post-filters plus the human gate-reframe question for
> whether distinct L/R assignment is truly a recognizer requirement. Session
> 856 recorded the named failure-mode post-filter ceiling from the existing
> candidate-selection audit: `coverage=0.988095`,
> `distinct_assigned_coverage=0.976190`, `collapse_rate=0.000000`,
> `unrecovered_distinct_failure_rows=2`. The named filters pass the coverage
> proxy but remain just below the current `>=0.98` distinct-assignment gate.
> Session 857 answered the product gate question from current `asl-pilot-web`
> code: active practice pass/fail is raw-frame/model-card based and fail-closed,
> live tracking is preview-only with anonymous `hand_0`/`hand_1` display tracks,
> and anatomical distinct L/R assignment is not a current recognizer requirement.
> Session 858 split the current product proxy from the future slot contract in
> the canonical M3JB receipt: current two-box product proxy is
> `passed_current_product_proxy`, while future stable slot/L/R identity remains
> `open_future_slot_identity_gate`.
> Session 859 recorded the landmark/heatmap baseline now that the two-hand box
> stage is demo-complete: the best current heatmap-head candidate is
> `PCK@0.10=0.801000`, `PCK@0.05=0.465600`, still below the `0.90` / `0.75`
> landmark gate, and source-preserved crop quality shows edge/OOB/high-error
> crops as the next local bottleneck. Session 860 recorded the fixed
> source-preserved crop/relabel backlog for that bottleneck: 512 test
> candidates and 1024 train candidates, both dominated by
> `rebuild_crop_with_more_context_or_mask_oob_keypoints`; next action is a
> local/no-Brev crop-context or OOB-keypoint-mask policy probe before longer
> heatmap landmark training. Session 861 recorded that OOB/visible-keypoint
> masking is helpful but insufficient: OOB visible-PCK deltas are `+0.129200`
> test and `+0.084000` train, but `0/512` test and `0/1024` train backlog
> candidates reach visible `PCK@0.10 >= 0.90`; next action is a local
> crop-context rebuild proof for the edge/OOB backlog. Session 862 recorded
> the crop-context geometry ceiling: targeted-relabel default source expansion
> resolves only `2/369` test and `22/823` train teacher-edge rows, while
> full-frame relabel-crop ceilings are nearly identical; next action is
> targeted offline relabel or clearer-source review for true frame-edge OOB
> rows. Session 863 recorded that the targeted relabel queue is locally
> runnable: `367` test and `801` train true frame-edge/OOB candidates have raw
> source videos available with `0` missing videos, and the top-32 train/test
> manifest prefixes are all frame-edge rows; next action is a bounded local
> targeted relabel smoke before rebuilding landmark caches or spending on
> longer heatmap training. Session 864 ran that bounded local smoke from the
> annotator worktree root so source-cache paths resolved correctly: train top32
> processed `32/32`, selected `22`, and wrote `1` strict accepted row; diagnostic
> test top32 processed `32/32`, selected `30`, and wrote `0` strict accepted rows.
> Strict acceptance is low-yield, so next action is acceptance-threshold,
> clearer-source, or true-frame-edge exclusion policy review before cache rebuild
> or longer landmark heatmap training. Session 865 ran the selected-only
> acceptance diagnostic: train selected-only wrote `22/32`, but median visible
> fraction was `0.190476` with median `17` OOB points and only `1` row passed
> visible `>=0.50` with `<=4` OOB points; diagnostic test selected-only wrote
> `30/32`, but max visible fraction was `0.619048`, median OOB points was `13`,
> and `0` rows passed the moderate threshold. Simple acceptance relaxation is not
> a safe cache-rebuild path; next action is true-frame-edge exclusion or
> clearer-source policy before landmark cache rebuild. Session 866 recorded the
> frame-edge cache policy decision: after requiring visible fraction `>=0.50`,
> OOB points `<=4`, selected-center distance `<=0.35`, and requested-hand-key
> match, `0/52` selected-only rows are cache-rebuild-eligible. `51/52` remain
> severe frame-edge/OOB exclusions, with `4` hand-key mismatch exclusions and
> `1` center-distance exclusion. Next action is to materialize a frame-edge
> exclusion or clearer-source review manifest before landmark cache rebuild.
> Session 867 materialized the full frame-edge disposition manifest at
> `docs/validation/return-to-form-m3jb-frame-edge-disposition-manifest-v1.json`:
> it covers `801` train and `367` test true-frame-edge/OOB rows, authorizes
> `0` rows for cache rebuild, excludes the `52` selected-only probe rows, and
> leaves `1116` unprobed frame-edge rows requiring clearer-source review before
> any landmark cache rebuild. Session 868 committed the selected-only exclusion
> seed at
> `docs/validation/return-to-form-m3jb-frame-edge-exclusion-seed-v1.json`: all
> `52` probed selected-only rows are blocked from landmark cache rebuild (`22`
> train, `30` diagnostic test), while the remaining `1116` unprobed rows still
> need a clearer-source review subset before any landmark heatmap cache rebuild.
> Session 869 selected that bounded review subset at
> `docs/validation/return-to-form-m3jb-clearer-source-review-subset-v1.json`:
> `64` source-linked rows (`32` train, `32` diagnostic test) across `42` labels,
> with `0` missing raw-video paths and `0` rows authorized for cache rebuild.
> Session 870 initialized the fail-closed review outcome ledger at
> `docs/validation/return-to-form-m3jb-clearer-source-review-outcomes-v1.json`:
> all `64` subset rows are pending manual source review with `0` cache-safe
> replacements, `0` explicit exclusions, and `0` cache rebuild authorizations.
> Session 871 added preservation/validation guards for that ledger and wrote the
> first metadata-only review packet at
> `docs/review/return-to-form-m3jb-clearer-source-review-packet-v1.json`:
> `16` pending rows (`8` train, `8` diagnostic test), `16` locally available
> source videos, `0` embedded raw frames, and `0` cache rebuild authorizations.
> Session 872 visually reviewed the first train/test packet rows and recorded
> `2` explicit frame-edge/OOB exclusions (`train:12717`, `test:8672`) in the
> outcome ledger. The ledger now has `62` pending rows, `0` cache-safe
> replacements, `2` explicit exclusions, and `0` cache rebuild authorizations;
> the metadata-only packet rolled forward to the next pending rows.
> Session 873 visually reviewed `train:24708` and recorded it as a third
> explicit frame-edge/OOB exclusion. The ledger now has `61` pending rows,
> `0` cache-safe replacements, `3` explicit exclusions, and `0` cache rebuild
> authorizations; the metadata-only packet rolled forward to `train:12958` as
> the first pending train row.
> Session 874 visually reviewed `train:12958` and `test:7324`, then recorded
> both as explicit frame-edge/OOB exclusions. The ledger now has `59` pending
> rows, `0` cache-safe replacements, `5` explicit exclusions, and `0` cache
> rebuild authorizations; the metadata-only packet rolled forward to
> `train:14925` and `test:8513` as the first pending rows.
> Session 875 visually reviewed `train:14925` and `test:8513`, then recorded
> both as explicit frame-edge/OOB exclusions. The ledger now has `57` pending
> rows, `0` cache-safe replacements, `7` explicit exclusions, and `0` cache
> rebuild authorizations; the metadata-only packet rolled forward to
> `train:22221` and `test:10188` as the first pending rows.
> Session 876 visually reviewed `train:22221` and `test:10188`, then recorded
> both as explicit frame-edge/OOB exclusions. The ledger now has `55` pending
> rows, `0` cache-safe replacements, `9` explicit exclusions, and `0` cache
> rebuild authorizations; the metadata-only packet rolled forward to
> `train:25560` and `test:10729` as the first pending rows.
> Session 877 visually reviewed `test:10729` and recorded it as a tenth
> explicit frame-edge/OOB exclusion. The ledger now has `54` pending rows,
> `0` cache-safe replacements, `10` explicit exclusions, and `0` cache rebuild
> authorizations; the metadata-only packet rolled forward to `test:9990` as
> the first pending diagnostic test row while `train:25560` remains first train.
> Session 878 visually reviewed `test:9990` and recorded it as an eleventh
> explicit frame-edge/OOB exclusion. The ledger now has `53` pending rows,
> `0` cache-safe replacements, `11` explicit exclusions, and `0` cache rebuild
> authorizations; the metadata-only packet rolled forward to `test:8416` as
> the first pending diagnostic test row while `train:25560` remains first train.
> Session 879 visually reviewed `test:8416` and recorded it as a twelfth
> explicit frame-edge/OOB exclusion. The ledger now has `52` pending rows,
> `0` cache-safe replacements, `12` explicit exclusions, and `0` cache rebuild
> authorizations; the metadata-only packet rolled forward to `test:10021` as
> the first pending diagnostic test row while `train:25560` remains first train.
> Session 880 visually reviewed `test:10021` and recorded it as a thirteenth
> explicit frame-edge/OOB exclusion. The ledger now has `51` pending rows,
> `0` cache-safe replacements, `13` explicit exclusions, and `0` cache rebuild
> authorizations; the metadata-only packet rolled forward to `test:10480` as
> the first pending diagnostic test row while `train:25560` remains first train.
> Session 881 visually reviewed `test:10480` and recorded it as a fourteenth
> explicit frame-edge/OOB exclusion. The ledger now has `50` pending rows,
> `0` cache-safe replacements, `14` explicit exclusions, and `0` cache rebuild
> authorizations; the metadata-only packet rolled forward to `test:8270` as
> the first pending diagnostic test row while `train:25560` remains first train.
> Session 882 visually reviewed `test:8270` and recorded it as a fifteenth
> explicit frame-edge/OOB exclusion. The ledger now has `49` pending rows,
> `0` cache-safe replacements, `15` explicit exclusions, and `0` cache rebuild
> authorizations; the metadata-only packet rolled forward to `test:9777` as
> the first pending diagnostic test row while `train:25560` remains first train.
> Session 883 visually reviewed `test:9777` and recorded it as a sixteenth
> explicit frame-edge/OOB exclusion. The ledger now has `48` pending rows,
> `0` cache-safe replacements, `16` explicit exclusions, and `0` cache rebuild
> authorizations; the metadata-only packet rolled forward to `test:7479` as
> the first pending diagnostic test row while `train:25560` remains first train.
> Session 884 visually reviewed `test:7479` and recorded it as a seventeenth
> explicit frame-edge/OOB exclusion. The ledger now has `47` pending rows,
> `0` cache-safe replacements, `17` explicit exclusions, and `0` cache rebuild
> authorizations; the metadata-only packet rolled forward to `test:7349` as
> the first pending diagnostic test row while `train:25560` remains first train.
> Session 885 visually reviewed `test:7349` and recorded it as an eighteenth
> explicit frame-edge/OOB exclusion. The ledger now has `46` pending rows,
> `0` cache-safe replacements, `18` explicit exclusions, and `0` cache rebuild
> authorizations; the metadata-only packet rolled forward to `test:9586` as
> the first pending diagnostic test row while `train:25560` remains first train.
> Session 886 visually reviewed `test:9586` and recorded it as a nineteenth
> explicit frame-edge/OOB exclusion. The ledger now has `45` pending rows,
> `0` cache-safe replacements, `19` explicit exclusions, and `0` cache rebuild
> authorizations; the metadata-only packet rolled forward to `test:11668` as
> the first pending diagnostic test row while `train:25560` remains first train.
> Session 887 visually reviewed `test:11668` and recorded it as a twentieth
> explicit frame-edge/OOB exclusion. The ledger now has `44` pending rows,
> `0` cache-safe replacements, `20` explicit exclusions, and `0` cache rebuild
> authorizations; the metadata-only packet rolled forward to `test:7360` as
> the first pending diagnostic test row while `train:25560` remains first train.
> Session 888 visually reviewed `test:7360` and recorded it as a twenty-first
> explicit frame-edge/OOB exclusion. The ledger now has `43` pending rows,
> `0` cache-safe replacements, `21` explicit exclusions, and `0` cache rebuild
> authorizations; the metadata-only packet rolled forward to `test:8406` as
> the first pending diagnostic test row while `train:25560` remains first train.
> Session 889 visually reviewed `test:8406` and recorded it as a twenty-second
> explicit frame-edge/OOB exclusion. The ledger now has `42` pending rows,
> `0` cache-safe replacements, `22` explicit exclusions, and `0` cache rebuild
> authorizations; the metadata-only packet rolled forward to `test:11228` as
> the first pending diagnostic test row while `train:25560` remains first train.
> Session 890 visually reviewed `test:11228` and recorded it as a twenty-third
> explicit frame-edge/OOB exclusion. The ledger now has `41` pending rows,
> `0` cache-safe replacements, `23` explicit exclusions, and `0` cache rebuild
> authorizations; the metadata-only packet rolled forward to `test:10569` as
> the first pending diagnostic test row while `train:25560` remains first train.
> Session 891 visually reviewed `test:10569` and recorded it as a twenty-fourth
> explicit frame-edge/OOB exclusion. The ledger now has `40` pending rows,
> `0` cache-safe replacements, `24` explicit exclusions, and `0` cache rebuild
> authorizations; the metadata-only packet rolled forward to `test:10866` as
> the first pending diagnostic test row while `train:25560` remains first train.
> Session 892 visually reviewed `test:10866` and recorded it as a twenty-fifth
> explicit frame-edge/OOB exclusion. The ledger now has `39` pending rows,
> `0` cache-safe replacements, `25` explicit exclusions, and `0` cache rebuild
> authorizations; the metadata-only packet rolled forward to `test:11590` as
> the first pending diagnostic test row while `train:25560` remains first train.
> Session 893 started with `test:11590`, then honored the anti-grind redirect
> by batch-finishing the remaining clearer-source subset in one slice. The
> ledger now has `0` pending rows, `0` cache-safe replacements, `64` explicit
> exclusions, and `0` cache rebuild authorizations; the metadata-only review
> packet is empty. Next action is to rebuild the per-hand crop cache from this
> policy, retrain the scratch landmark student, and re-measure held-out
> PCK@0.10 / PCK@0.05 against baseline rather than deleting more rows.
> Session 894 aligned the completed clearer-source outcome ledger with that
> current anti-grind next action and answered the heatmap question in the
> canonical M3JB receipt. The heatmap/soft-argmax head is the right scratch
> landmark-student lane after crop-cache rebuild, not a post-hoc filter and not
> solved: best recorded heatmap PCK remains `0.801000` / `0.465600` vs the
> `0.90` / `0.75` gate. No training, checkpoint, browser export, Brev launch,
> raw learner upload, or cache tensor write is claimed or committed by this
> slice; next proof remains crop cache rebuild plus heatmap landmark retrain
> plus held-out PCK re-measurement.
> Session 895 adopted the local cache-rebuild eval-only receipt into the
> canonical M3JB tracker. The rebuilt cache contains `30120` crops after the
> `64` ledger exclusions; evaluating the existing scratch checkpoint on that
> rebuilt cache gives held-out PCK@0.10 `0.663300` (`+0.004600`) and PCK@0.05
> `0.372200` (`+0.002600`). This is metric movement from removing bad crops,
> not a trained-model improvement and not gate-passing. No Brev, optimizer,
> checkpoint write, browser export, or raw upload is claimed. Next action is to
> retrain the scratch landmark student on the rebuilt cache and re-measure PCK
> after explicit Brev spend approval.
> Session 896 recorded the approval-gated Brev launch plan at
> `docs/validation/return-to-form-m3jb-landmark-retrain-brev-plan-v1.json`.
> The plan targets the rebuilt `30120`-crop cache with
> `train_perhand_landmarks_heatmap.py`, no warm start, no train-row cap, CUDA
> full-cache training, eval-only PCK@0.10/PCK@0.05 remeasurement, copyback,
> duplicate-worker guardrails, and max runtime/spend limits. A read-only
> `brev ls --json` refresh showed `asl-pilot-m3eh-l40s-001` as `RUNNING` /
> `READY` / `HEALTHY`, but this slice did not run `brev exec`, sync, copyback,
> training, checkpoint write, browser export, or raw upload. Next action is
> explicit current-thread Brev/GPU spend approval before launching the plan.
> Session 897 aligned `GOAL.md` and the active M3JB prompt with that same
> approval gate. The current durable next action is now
> `await_explicit_brev_spend_approval_then_launch_landmark_retrain_brev_plan`;
> the broader batch-review/cache-rebuild/retrain directive is recorded as
> prepared through the committed plan, not as an implicit launch authorization.
> `scripts/audit_m3jb_hand_state_tracker.mjs` now fails if either prompt stops
> naming the plan receipt, `blocked_pending_explicit_brev_approval`, and the
> stale-context `brev exec` launch prohibition. The same slice recorded
> `docs/validation/return-to-form-m3jb-codex-supervisor-dry-run-v1.json`: the
> supervisor launch path dry-runs with `CODEX_PROFILE=asl-pilot-local-skills`,
> but actual loop launch is `not_run` while Brev approval remains pending.
> Session 898 recorded
> `docs/validation/return-to-form-m3jb-codex-both-dry-run-v1.json` for the
> legacy/debug `--role both` launch path named by stale objective payloads. The
> dry-run passed with output SHA-256
> `f4516acf4c5ca0d69706c27cb1df2c53c67ed8653ab317908662b6eea1ee2c2c`; both
> generated executor and observer loops use `CODEX_PROFILE=asl-pilot-local-skills`.
> Actual `bash scripts/start_codex_goal_loop.sh --role both` remains `not_run`:
> it would start persistent loops while the next substantive action is still
> explicit current-thread Brev/GPU spend approval for the recorded landmark
> retrain plan.
> The same control-plane slice also recorded
> `docs/validation/return-to-form-m3jb-landmark-retrain-local-preflight-v1.json`:
> the side-worktree trainer parses, required planned CLI flags are present, the
> helper and rebuilt-cache metadata hashes match the launch plan, `frames.npy`
> and `kpts.npy` have aligned `30120`-row shapes, and all planned retrain/eval
> output artifacts remain absent. This preflight is local-only and still does
> not approve or launch Brev, sync remote files, train, eval PCK, write
> checkpoints, or change browser runtime behavior.
> Session 899 refreshed read-only Brev workspace visibility at
> `docs/validation/return-to-form-m3jb-brev-readiness-refresh-v1.json`. The
> intended retained worker `asl-pilot-m3eh-l40s-001` / `3d58wpy9o` is still
> `RUNNING` / `READY` / `HEALTHY` on `l40s-48gb.1x`; the older
> `asl-pilot-m3jb-pairrank-l40s-001` worker remains `STOPPED` / `NOT READY` /
> `UNHEALTHY`. This was `brev ls --json` visibility only: no `brev exec`,
> sync/copy, lifecycle action, worker creation, SSH/rsync, remote mutation,
> training, eval-only PCK, checkpoint, browser export, raw upload, or runtime
> dependency change occurred. Launch remains blocked until explicit
> current-thread Brev/GPU spend approval.
> Session 900 recorded the human approval request at
> `docs/validation/return-to-form-m3jb-brev-approval-request-v1.json`. The
> receipt names the exact approval text required in the current thread, the
> retained worker, max spend `$40`, max outer runtime `21600s`, authorized
> sync/copy + remote CUDA scratch retrain + eval-only PCK + copyback envelope,
> and actions still excluded without separate approval. The receipt explicitly
> does not record approval; actual launch remains `not_run` and no Brev command,
> remote mutation, training, eval, checkpoint, browser export, raw upload, or
> runtime dependency change occurred.
> Session 901 recorded the repeated approval blocker at
> `docs/validation/return-to-form-m3jb-brev-approval-blocker-v1.json`: sessions
> 897-900 already aligned the prompt, dry-ran the local loop command, refreshed
> worker visibility, and made the approval request exact, but no exact
> current-thread Brev/GPU spend approval has been provided. Actual launch
> remains `not_run`, and no Brev command, sync/copy, remote mutation, training,
> eval, checkpoint, browser export, raw upload, autonomous loop launch, or
> runtime dependency change occurred.
> Session 902 recorded the current-thread human approval surfaces after commit
> `f761dc5`: `GOAL.md`, the active M3JB prompt, the Brev plan receipt, the
> approval-request receipt, and the approval-blocker receipt now agree that the
> bounded `M3JB landmark retrain plan v1` is approved for retained worker
> `asl-pilot-m3eh-l40s-001` / `3d58wpy9o`, max spend `$40`, and max outer
> runtime `21600s`. The canonical tracker next action is now
> `launch_approved_landmark_retrain_brev_plan_v1`. This was an approval
> alignment slice only: actual launch remains `not_run`, and no Brev command,
> sync/copy, remote mutation, training, eval, checkpoint, browser export, raw
> upload, autonomous loop launch, or runtime dependency change occurred.
> Session 903 consumed that exact current-thread approval and ran the bounded
> landmark retrain envelope once on retained worker
> `asl-pilot-m3eh-l40s-001` / `3d58wpy9o`: remote preflight passed, the
> approved trainer/helper/cache files were synced and hash-verified, the
> scratch CUDA retrain completed, eval-only PCK@0.10/PCK@0.05 completed, the
> four planned artifacts were copied back, and the worker was stopped. The
> result is rejected fail-closed because eval-only PCK regressed to
> `0.648400` / `0.365100` versus rebuilt-cache baseline `0.663300` /
> `0.372200` and remains below the `0.90` / `0.75` landmark gates. The
> consumed approval must not be reused; next action is local/no-Brev pivot
> analysis:
> `analyze_m3jb_landmark_retrain_regression_and_select_pivot_no_brev`.
> Session 904 completed that local pivot analysis at
> `docs/validation/return-to-form-m3jb-landmark-retrain-regression-pivot-v1.json`.
> The analysis rejects same-envelope relaunch, more frame-edge row deletion,
> selector training, browser promotion, and final-gate changes. The selected
> lever is higher input resolution / capacity preflight because the existing
> checkpoint improved only slightly after cache exclusions, while the approved
> w64/heatmap32 scratch retrain regressed broadly: only `2/21` keypoints
> improved at PCK@0.10, the train filter removed `6553/22202` crops, and
> validation PCK dropped from `0.660300` / `0.363000` to `0.599800` /
> `0.300000`. This historical local/no-Brev/no-training next action was:
> `m3jb_landmark_resolution_capacity_preflight_no_brev`.
> Session 905 followed the newer research-guided campaign redirect in
> `GOAL.md`: ChatGPT Pro web escalation was attempted but blocked because the
> in-app browser backend was unavailable, so the prompt-authorized
> `openai-api-research` / `gpt-5.5` fallback was saved under
> `artifacts/research/m3jb-landmark-pck-campaign-905/`. The resulting campaign
> plan at
> `docs/validation/return-to-form-m3jb-landmark-pck-campaign-research-plan-v1.json`
> selects the first supported experiment as full-scope scratch
> `PerHandHeatmapNet` with width `96`, heatmap grid `48`, sigma `2.0`, epochs
> `100`, batch `256`, eval batch `1024`, lr `5e-4`, CUDA, and no destructive
> train-quality filter. This setup slice did not run Brev, train, write
> checkpoints, promote browser artifacts, upload raw learner video, add
> pretrained runtime dependencies, or change final gates. The historical next action from that setup slice was:
> `m3jb_landmark_pck_run1_w96_g48_fulltrain_brev_ok`.
> Session 906 completed that first research-guided Brev campaign run at
> `docs/validation/return-to-form-m3jb-landmark-pck-campaign-run1-w96-g48-fulltrain-brev-v1.json`:
> after patching the scratch trainer's non-power-of-two heatmap-grid support,
> the retained `asl-pilot-m3eh-l40s-001` / `3d58wpy9o` worker ran the
> full-scope w96/heatmap48 experiment, copied back the planned artifacts, and
> was stopped. Held-out PCK improved to `0.739200` / `0.453300` versus the
> running-best `0.663300` / `0.372200`, but remains below the `0.90` /
> `0.75` landmark gates and no browser/runtime artifact is promoted. The
> historical next action from that run was:
> `m3jb_landmark_pck_run2_w128_g64_fulltrain_brev_ok`.
> Session 907 completed that second research-guided Brev campaign run at
> `docs/validation/return-to-form-m3jb-landmark-pck-campaign-run2-w128-g64-fulltrain-brev-v1.json`:
> the retained `asl-pilot-m3eh-l40s-001` / `3d58wpy9o` worker ran the
> full-scope w128/heatmap64 experiment, copied back the planned artifacts, and
> was stopped. Held-out PCK improved to `0.749600` / `0.486700` versus the
> run1 running-best `0.739200` / `0.453300`, but remains below the `0.90` /
> `0.75` landmark gates and no browser/runtime artifact is promoted. Current
> next action is the next bounded campaign experiment:
> `m3jb_landmark_pck_run3_w128_g64_hardgeom_aug_fulltrain_brev_ok`.
> Session 908 completed that third research-guided Brev campaign run at
> `docs/validation/return-to-form-m3jb-landmark-pck-campaign-run3-w128-g64-hardgeomaug-fulltrain-brev-v1.json`:
> the retained `asl-pilot-m3eh-l40s-001` / `3d58wpy9o` worker ran the
> full-scope w128/heatmap64 hard-geometry oversampling plus mild-augmentation
> experiment, copied back the planned artifacts, and was stopped. Held-out PCK
> regressed to `0.734000` / `0.450600` versus the run2 running-best
> `0.749600` / `0.486700`, so run3 is recorded as a no-clear-win while still
> below the `0.90` / `0.75` landmark gates and no browser/runtime artifact is
> promoted. Current next action is a no-Brev research refresh before another
> paid experiment:
> `m3jb_landmark_pck_research_refresh_after_run3_no_brev`.
> Session 909 completed that no-Brev post-run3 research refresh at
> `docs/validation/return-to-form-m3jb-landmark-pck-research-refresh-after-run3-v1.json`:
> the ChatGPT Pro web route was attempted but blocked by unavailable in-app
> browser backend, so the prompt-authorized `openai-api-research` / `gpt-5.5`
> fallback saved artifacts under `artifacts/research/m3jb-landmark-pck-refresh-909/`.
> The advisory next highest-impact lever is a scratch residual U-Net /
> lightweight hourglass heatmap architecture at the same 128 input / 64 heatmap
> operating point, preserving the existing heatmap/soft-argmax lane. Current
> next action is local-only and no-Brev:
> `m3jb_landmark_pck_resunet_architecture_preflight_no_brev`.
> Session 910 completed that local no-Brev ResUNet/hourglass architecture
> preflight at
> `docs/validation/return-to-form-m3jb-landmark-pck-resunet-architecture-preflight-v1.json`:
> side-worktree trainer commit `712ab989d9451e92894ee72fc73e757a21f6d1ea`
> added `perhand_resunet_heatmap`, the CPU no-training smoke proved
> `(2, 21, 64, 64)` heatmaps and `(2, 21, 2)` decode with `15,358,485`
> parameters, and no optimizer/backward/checkpoint/Brev/training occurred.
> Current next action is the bounded campaign run4 envelope:
> `m3jb_landmark_pck_run4_resunet_g64_fulltrain_brev_ok`.
> Session 911 honored the newer `GOAL.md` redirect at commit `9eea8e7`: the
> active mission is now the recognizer Transformer distill campaign
> `m3jb_recognizer_transformer_distill_campaign_brev`, and the landmark-PCK
> campaign is historical/paused. The active prompt now mirrors that recognizer
> directive and Brev approval at
> `docs/validation/return-to-form-m3jb-recognizer-transformer-prompt-alignment-v1.json`.
> The leftover landmark worker state was checked: no `train_perhand_landmarks_heatmap.py`
> process was running, all planned run4 ResUNet outputs were absent, and
> `asl-pilot-m3eh-l40s-001` was stopped and verified `STOPPED` / `NOT READY` /
> `HEALTHY`. No recognizer sync, recognizer training, eval, copyback, browser
> promotion, raw upload, pretrained runtime dependency, or final-gate change
> occurred. Current next action is recognizer preflight + sync:
> `m3jb_recognizer_transformer_distill_campaign_brev`.

### currently in progress

Mission 3AE-H — Codex Tier 0 failure remediation triage. The active worker is
Codex, not Claude. Broad 75/95-label rawframe runs are paused because the
recent controlled clip-heldout route did not show useful learning. The active
steering artifact is
[`docs/model/return-to-form-plan.md`](docs/model/return-to-form-plan.md):
preserve the original fixed-crop / source-reviewed / downscope-ladder plan
spine, then prove each small rung before any expansion.

Session 183 selected the Tier 0 proof set (`please`, `table`, `dad`,
`grandpa`, `hat`) and wrote the source coverage, fixed crop config, and
pre-training gates. Session 185 refreshed ignored local Tier 0 manifests and
fixed-crop tensors under `data/manifests/return-to-form-tier0/` and
`data/tensors/return-to-form-tier0/`, then wrote
[`docs/validation/return-to-form-tier0-decode-dataloader.json`](docs/validation/return-to-form-tier0-decode-dataloader.json)
with 345 tensors, zero missing files, and dataloader batch shape
`[4, 16, 5, 96, 96, 3]` for train, validation, and test. Session 187 ran one
bounded random-init Tier 0 learnability smoke and wrote
[`docs/validation/return-to-form-tier0-learnability-smoke.json`](docs/validation/return-to-form-tier0-learnability-smoke.json).
The smoke failed train sanity (`train_top1=0.376`,
`train_macro_recall=0.376`, `loss_drop=0.171`, zero train recall for `dad`
and `grandpa`), so the single next action is M3AC/M3AD remediation before any
label expansion. Session 188 wrote
[`docs/validation/return-to-form-tier0-remediation-diagnostic.json`](docs/validation/return-to-form-tier0-remediation-diagnostic.json)
and contact sheets for the five Tier 0 labels. The diagnostic classified the
first concrete failure as `tensor_payload_preprocessing`: all 45 sampled
payloads contained `rgb_regions`, but `RawFrameClipDataset` consumed only the
`rgb_frames` compatibility tensor mapped to `upper_body_signing_space`. The
single next action is to fix the training/evaluation tensor contract before any
additional smoke training. Session 190 wrote
[`docs/validation/return-to-form-tier0-tensor-contract.json`](docs/validation/return-to-form-tier0-tensor-contract.json).
The receipt passed on 45 sampled payloads: consumed tensor key `rgb_regions`,
derived input `rgb_regions_grid_v1`, region order
`viewer_left_hand_context`, `viewer_right_hand_context`,
`upper_body_signing_space`, `head_context`, `full_frame_reference`,
train/validation/test batch shape `[4, 16, 3, 96, 96]`, and
`fallback_to_rgb_frames_count=0`. The single next action is a bounded Tier 0
learnability smoke rerun using the corrected input path. Session 192 wrote
[`docs/validation/return-to-form-tier0-learnability-smoke-rerun.json`](docs/validation/return-to-form-tier0-learnability-smoke-rerun.json).
The corrected-input rerun still failed Tier 0 learnability:
`train_top1=0.312`, `train_macro_recall=0.312`, `loss_drop=0.156`,
`validation_top1=0.224`, `validation_macro_recall=0.224`, and
`test_top1=0.200`, with zero train recall still present for `dad` and
`grandpa`. The single next action is M3AC/M3AD remediation: inspect fixed-crop
contact sheets, region selection, tensor payload compatibility, and model
architecture before any label expansion. Session 194 wrote
[`docs/validation/return-to-form-tier0-failure-remediation-triage.json`](docs/validation/return-to-form-tier0-failure-remediation-triage.json).
The triage did not find a concrete crop cut-off in the retained sampled contact
sheets and confirmed the tensor contract remains closed evidence. It classified
the active blocker as a model/input-adapter/training-budget fit bottleneck and
selected exactly one next action: `model_architecture_microprobe`.

### just completed

- `task-000` Repo intake — discharged by [`docs/session-logs/001-gap-audit.md`](docs/session-logs/001-gap-audit.md).
- `task-001` Architecture gap audit — discharged by the same doc; architecture finalized for round 1 in [`ARCHITECTURE.md`](ARCHITECTURE.md).
- `task-002` Slash command + area scaffold — `.claude/commands/` and area `CLAUDE.md` + `LESSONS.md` files installed this round.
- `task-026` Stage A / MediaPipe vestige removal — landed in 7 commits + 1 validation-pass commit on branch `task-026-stage-a-removal`. See [`docs/session-logs/002-stage-a-vestige-removal.md`](docs/session-logs/002-stage-a-vestige-removal.md) for actuals vs brief.

### ready after task-026

- `task-003` Project readiness harness (mostly partial; needs naming alignment + storage script + Brev scripts)
- `task-006` Storage guardrails and Brev helpers (storage script + 3 Brev shell scripts to author)
- `task-017` Browser inference worker refactor to typed `InferenceEngine`
- `task-018` Hint engine + sign metadata (true gap; vocabulary lacks phonological metadata)
- `task-022` Final validation + model card + no-pretrained audit (naming alignment + tighter no-pretrained audit)

### deferred this round

- `task-024` — 75–100 recognition expansion (gated on rawframe model training producing signer-disjoint passing metrics).

## task index

| id | title | area | anchors | repo state | next-action |
|---|---|---|---|---|---|
| task-000 | Repo intake and plan bootstrap | orchestration | `#arch-principles` | **DONE** (see [`docs/session-logs/001-gap-audit.md`](docs/session-logs/001-gap-audit.md)) | — |
| task-001 | Architecture gap audit and finalization | orchestration | `#arch-principles`, `#arch-cross-doc-invariants` | **DONE** (see [`ARCHITECTURE.md`](ARCHITECTURE.md), [`docs/session-logs/001-gap-audit.md`](docs/session-logs/001-gap-audit.md)) | — |
| task-002 | Install slash command and area scaffold | orchestration | `#arch-principles` | **DONE** (`.claude/commands/` 13 files, `*/CLAUDE.md`, `*/LESSONS.md`) | — |
| task-003 | Project readiness harness | infra | `#arch-training-pipeline`, `#arch-no-pretrained` | **PARTIAL** (existing [`scripts/audit_completion_readiness.mjs`](scripts/audit_completion_readiness.mjs) + dozens of `audit_*_readiness.mjs`; missing: storage budget script, Brev scripts, run-manifest start/end pair, milestone-status JSON) | wire after `task-026`; do not duplicate existing audits |
| task-004 | Source rights, provenance, and vocabulary inventory | data | `#arch-data-provenance`, `#arch-active-module`, `#arch-no-pretrained` | **DONE** (deeper than plan: [`docs/model/dataset-source-register.json`](docs/model/dataset-source-register.json), [`docs/research/`](docs/research/) 51 files, Ed25519 reviewer authority chain, [`web/src/lib/vocabulary.ts`](web/src/lib/vocabulary.ts) 100 items, [`docs/review/final-vocabulary-review.json`](docs/review/final-vocabulary-review.json)) | — |
| task-005 | Active sign modules and 100-item content vocabulary | product | `#arch-asl-vocabulary-scope`, `#arch-active-module`, `#arch-vocab-hints` | **DONE (M2 scope)** — [`docs/model/active-vocabulary-claim.json`](docs/model/active-vocabulary-claim.json) created with `modelVersion="rawframe-not-trained"`, `lane="rawframe"`, `activeLabels=[]`, `evidenceArtifacts=[]`, full claim disclaimer. [`configs/active-sign-modules.example.json`](configs/active-sign-modules.example.json) rewritten to drop Stage A vestige labels and reference only labels present in current [`web/src/lib/vocabulary.ts`](web/src/lib/vocabulary.ts); both `smoke_10` and `core_20` modules marked `candidate`. [`scripts/audit_downstream_vocabulary_provenance.mjs`](scripts/audit_downstream_vocabulary_provenance.mjs) extended with two new checks (`active_vocabulary_claim_present`, `active_sign_modules_example_present`) requiring schema version, lane=rawframe, modelVersion match, and empty-arrays-while-not-trained invariant. **Closes mission 2 exit-condition #3.** | post-M3: scripts/promote_trained_model_card.mjs writes the trained `activeLabels[]` and `evidenceArtifacts[]` into the claim file |
| task-006 | Storage guardrails and Brev helpers | infra | `#arch-storage-policy`, `#arch-training-pipeline`, `#arch-gpu-execution` | **PARTIAL** — four shell scripts authored ([`scripts/storage_budget_check.sh`](scripts/storage_budget_check.sh), [`scripts/brev_create_48h.sh`](scripts/brev_create_48h.sh), [`scripts/brev_sync_repo.sh`](scripts/brev_sync_repo.sh), [`scripts/brev_stop_all_training.sh`](scripts/brev_stop_all_training.sh)); all pass `bash -n`; storage check runs green against current repo (free=505GiB, project=48GiB). `brev_sync_repo.sh` keeps the broad repo `data/` exclusion, then syncs the required PopSign training-data allowlist (`data/manifests`, `data/tensors`, `data/external/popsign-v1/raw`). Local-env receipt at [`docs/validation/local-ml-environment.json`](docs/validation/local-ml-environment.json). Brev operator handoff: [`docs/runbooks/brev-rawframe-training-handoff.md`](docs/runbooks/brev-rawframe-training-handoff.md). | exercise Brev scripts against a real worker only after a human approves paid provisioning; no autonomous-loop spend |
| task-007 | Dataset pulls and shard builder | data | `#arch-data-provenance`, `#arch-storage-policy`, `#arch-first-party-data`, `#arch-crop-pipeline` | **DONE (collection-runtime-smoke; future first-party lane)** — first-party collection runtime proves end-to-end through the smoke: [`scripts/run_dataset_collection_runtime_smoke.mjs --write`](scripts/run_dataset_collection_runtime_smoke.mjs) builds an isolated `output/dataset-collection-runtime-smoke/` fixture (reviewed-vocabulary copy + collection-plan + signer-disjoint vocab/challenge assignments), spins up `next start` with `ENABLE_DATASET_COLLECTION=true` + `NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true`, registers a session, posts a vocabulary clip and a negative-challenge clip, verifies duplicate-assignment rejection, and asserts coverage keeps both clips as `pending`/non-exportable. [`scripts/audit_dataset_collection_runtime_smoke.mjs`](scripts/audit_dataset_collection_runtime_smoke.mjs) confirms the retained report at [`docs/validation/dataset-collection-runtime-smoke.json`](docs/validation/dataset-collection-runtime-smoke.json) is honest and excluded from final evidence. **Closes mission 2 exit-condition #2.** Return-to-form work must choose a small 5-10 sign source set before more training; first-party collection remains a future data lane unless explicitly selected. | future first-party collection follows [`docs/runbooks/first-party-collection.md`](docs/runbooks/first-party-collection.md); Brev handoff remains [`docs/runbooks/brev-rawframe-training-handoff.md`](docs/runbooks/brev-rawframe-training-handoff.md) |
| task-008 | Frame decode and crop pipeline | data | `#arch-crop-pipeline`, `#arch-camera-privacy` | **PARTIAL** (existing: [`scripts/decode_raw_videos.py`](scripts/decode_raw_videos.py), [`scripts/export_dataset_manifests.mjs`](scripts/export_dataset_manifests.mjs); FFmpeg replay gates enforced per `strategy-confidence-audit.md`; missing: deterministic crop-config-hash binding to rawframe runs) | extend existing decode/export with crop-config-hash field after `task-026` |
| task-009 | Scratch HandBoxNet detector lane | models | `#arch-handboxnet`, `#arch-no-pretrained`, `#arch-crop-pipeline` | **MISSING / DEFERRED** — valuable robustness lane, but not a blocker for the return-to-form fixed-crop proof | build only after a 5-10 sign fixed-crop proof exists or a crop-quality-bounded failure is recorded |
| task-010 | Baseline recognizer smoke and sanity | models | `#arch-training-pipeline`, `#arch-no-pretrained`, `#arch-guidedcrop-signnet` | **PARTIAL / TRIAGE SELECTED MICROPROBE** — [`scripts/train_rawframe_model.py`](scripts/train_rawframe_model.py) exists; M3AD proved Tier 0 tensors/dataloader, M3AE-R identified the `rgb_frames` fallback, M3AE-F receipt [`docs/validation/return-to-form-tier0-tensor-contract.json`](docs/validation/return-to-form-tier0-tensor-contract.json) proves the loader now consumes `rgb_regions` through `rgb_regions_grid_v1`, M3AE-G receipt [`docs/validation/return-to-form-tier0-learnability-smoke-rerun.json`](docs/validation/return-to-form-tier0-learnability-smoke-rerun.json) shows the corrected-input 5-sign smoke still fails train sanity and validation signal, and M3AE-H triage [`docs/validation/return-to-form-tier0-failure-remediation-triage.json`](docs/validation/return-to-form-tier0-failure-remediation-triage.json) selects `model_architecture_microprobe` | run a bounded no-label-expansion microprobe on the same Tier 0 manifests/tensors; no broad training, source approval, export, or product claim |
| task-011 | GuidedCropSignNet train/evaluate | models | `#arch-guidedcrop-signnet`, `#arch-training-pipeline`, `#arch-no-pretrained`, `#arch-gpu-execution` | **PARTIAL / REDIRECTED** (aliased to rawframe pipeline; model card status `not_trained`) | train/evaluate only after task-010 proves learning on the small fixed-crop module; promotion via [`scripts/promote_trained_model_card.mjs`](scripts/promote_trained_model_card.mjs) remains gated |
| task-012 | Abstention thresholds and hard negatives | models | `#arch-passfail-thresholds`, `#arch-postprocess`, `#arch-active-module` | **PARTIAL** for Stage A (vestige); MISSING for rawframe lane | reuse [`scripts/analyze_controlled_pilot_thresholds.mjs`](scripts/analyze_controlled_pilot_thresholds.mjs), [`scripts/analyze_controlled_pilot_reject_score_grid.mjs`](scripts/analyze_controlled_pilot_reject_score_grid.mjs), [`data/guardrail-negative-fixtures/`](data/guardrail-negative-fixtures/) once rawframe is trained |
| task-013 | Browser model export and manifest | browser | `#arch-browser-export`, `#arch-inference-contract`, `#arch-active-module` | **DONE** (export script, parity fixture, hash check, smoke harness, ORT WASM same-origin route — see [`scripts/export_onnx_model.py`](scripts/export_onnx_model.py), [`scripts/run_final_browser_onnx_smoke.mjs`](scripts/run_final_browser_onnx_smoke.mjs), [`web/src/app/api/ort/[file]/route.ts`](web/src/app/api/ort/), [`web/public/model/asl-pilot-rawframe-v0.onnx`](web/public/model/)) | re-run after `task-011` produces a trained model |
| task-014 | Web app shell and routes | web | `#arch-product-scope`, `#arch-learner-flow` | **DONE** ([`web/src/components/PracticeApp.tsx`](web/src/components/PracticeApp.tsx) single-component; routes: `/`, `/auth/*`, `/api/*`, `/validation`, `/smoke/browser-onnx`, `/review/asl-citizen-primarymath-roi`) | — |
| task-015 | Learner auth and progress persistence | web | `#arch-accounts-progress`, `#arch-persistence`, `#arch-camera-privacy` | **DONE** (Supabase auth + RLS, attempts API, progress API, attempt_progress view; no raw video fields) | optional: refactor to typed `AuthRepository` / `ProgressRepository` interfaces (low priority) |
| task-015a | Promote vocabulary_items from TS to DB table | web | `#arch-persistence`, `#arch-active-module` | **MISSING** (vocab is currently TS-only) | author migration; preserve current TS as seed |
| task-015b | Add practice_sessions table | web | `#arch-persistence`, `#arch-accounts-progress` | **MISSING** (currently each attempt is standalone) | optional; only if session-level analytics is needed for pilot demo |
| task-016 | Camera capture and permission states | web | `#arch-camera-privacy`, `#arch-learner-flow` | **DONE (evidence current)** — `cameraStatus` state machine in [`web/src/components/PracticeApp.tsx`](web/src/components/PracticeApp.tsx); Playwright camera-state evidence retained at [`docs/validation/practice-camera-behavior-smoke.json`](docs/validation/practice-camera-behavior-smoke.json) with `status: "passed"` and 7 checks (authenticated_practice_ui, camera_success_attempt_result_and_progress, next_prompt_action, camera_denied, camera_missing, camera_unsupported, camera_generic_error). Audit at [`scripts/audit_practice_camera_behavior_smoke.mjs`](scripts/audit_practice_camera_behavior_smoke.mjs) green. **Closes interim mission 3b.** | — |
| task-017 | Browser inference worker and pass/fail evaluator | browser | `#arch-inference-contract`, `#arch-passfail-thresholds`, `#arch-postprocess`, `#arch-vocab-hints` | **DONE (engine + UI)** — interim missions 3a + 3c. New typed `InferenceEngine` interface at [`web/src/lib/inference-engine.ts`](web/src/lib/inference-engine.ts) + `PassFailDecision` module at [`web/src/lib/pass-fail-decision.ts`](web/src/lib/pass-fail-decision.ts). [`web/src/components/PracticeApp.tsx`](web/src/components/PracticeApp.tsx) now composes `browserInferenceEngine` + `decide()` directly, stores `DecisionResult` (PassFailDecisionOutput + modelId/modelStatus/expectedId), and renders structured `reasons[]` + optional `hintDimension` badge in `AttemptResult`. `/api/attempts` payload remains compatible (`formatPersistedReason` adapts). `evaluateLocalAttempt` still exported in `client-model.ts` for any future callers but no longer used by the practice UI. Full validation chain green. | — |
| task-018 | Hint engine and sign metadata | product | `#arch-vocab-hints`, `#arch-passfail-thresholds` | **DONE (schema + engine + UI)** — `SignHintMetadata` type + per-dimension cues for 12 signs at [`web/src/lib/sign-hint-metadata.json`](web/src/lib/sign-hint-metadata.json); imported/re-exported via [`web/src/lib/vocabulary.ts`](web/src/lib/vocabulary.ts); reviewer-authority chain refreshed via [`scripts/promote_source_curated_vocabulary.mjs`](scripts/promote_source_curated_vocabulary.mjs); [`scripts/audit_hint_pedagogy_review.mjs`](scripts/audit_hint_pedagogy_review.mjs) extended to require ≥10 populated entries, dimension-name allowlist, no diagnostic-language patterns. Wired into `decide()` ([`web/src/lib/pass-fail-decision.ts`](web/src/lib/pass-fail-decision.ts)): `framing` cue for low_luma/low_contrast, `timing` cue for insufficient_frames, with `hintDimension` surfaced to the UI badge in `AttemptResult`. Coaching-hint fallback for class_mismatch/confidence_below_threshold. **Closes mission 2 exit-condition #4** and **mission 3c exit conditions #2 + #6**. | broader hint-dimension coverage (handshape/movement/location/orientation) will be unblocked once a trained model produces dimension-specific signals |
| task-019 | Practice flow integration | web | `#arch-learner-flow`, `#arch-accounts-progress`, `#arch-camera-privacy` | **DONE (re-verified post-task-017/018)** — end-to-end in [`web/src/components/PracticeApp.tsx`](web/src/components/PracticeApp.tsx) using the typed `PassFailDecisionOutput` from `decide()`; persists via [`web/src/app/api/attempts/route.ts`](web/src/app/api/attempts/) with stable payload shape; result panel exposes structured reasons + optional hint-dimension badge. Retained smoke evidence at [`docs/validation/practice-progress-smoke.json`](docs/validation/practice-progress-smoke.json) and [`docs/validation/practice-camera-behavior-smoke.json`](docs/validation/practice-camera-behavior-smoke.json) both `status: "passed"` post-migration. | — |
| task-020 | Progress history and mastery UI | web | `#arch-accounts-progress` | **DONE** (progress tab in PracticeApp; backed by `attempt_progress` view + `/api/progress`) | — |
| task-021 | Privacy documentation and proof | docs | `#arch-camera-privacy`, `#arch-persistence` | **DONE** (far deeper than plan: [`docs/privacy/`](docs/privacy/), consent form, Ed25519 signer-identity, [`scripts/audit_no_raw_video_upload.mjs`](scripts/audit_no_raw_video_upload.mjs), [`scripts/audit_final_privacy_smoke.mjs`](scripts/audit_final_privacy_smoke.mjs)) | — |
| task-022 | Final validation, model card, and no-pretrained audit | docs | `#arch-no-pretrained`, `#arch-guidedcrop-signnet`, `#arch-postprocess`, `#arch-browser-export` | **PARTIAL** ([`docs/validation/final-claim-matrix.json`](docs/validation/final-claim-matrix.json) exists; model card is `not_trained`; `docs/validation/no-pretrained-lane-audit.json` does not exist by that name) | after `task-026`: produce `no-pretrained-lane-audit.json`; after `task-011`: promote trained model card via [`scripts/promote_trained_model_card.mjs`](scripts/promote_trained_model_card.mjs) |
| task-023 | Final pilot demo and deployment package | infra | `#arch-product-scope`, `#arch-browser-export`, `#arch-downscope-ladder`, `#arch-gpu-execution` | **PARTIAL** (Vercel-target Next.js build works; Brev shutdown N/A until Brev is wired in `task-006`) | last-window: `npm --prefix web run build`, Brev shutdown, artifact bundle |
| task-024 | 75–100 recognition expansion | models | `#arch-active-module`, `#arch-downscope-ladder` | **DEFERRED** (gated on rawframe model passing signer-disjoint metrics for the smaller active module first) | — |
| task-025 | Continuous lessons and session logs | orchestration | `#arch-principles` | **PARTIAL** (session logs 001–006 written; `*/LESSONS.md` files seeded; no carry-forward yet) | run `/session-end` + `/orchestrate-end` at end of each round |
| **mission-2** | First-party collection runbook | docs | `#arch-first-party-data`, `#arch-camera-privacy`, `#arch-data-provenance` | **DONE** — [`docs/runbooks/first-party-collection.md`](docs/runbooks/first-party-collection.md) authored end-to-end (preconditions, plan → bundle → signer registration → collection-mode build → in-app capture → process+audit → consent receipts + review → manifest export). Cites the slice-5 dataset-collection-runtime-smoke run as live evidence of steps 4–5; the smoke fixture is the runbook's smoke fixture. Bail-out clause documented for incomplete signer roster. **Closes mission 2 exit-condition #5; all five exit conditions now met.** | mission 3 (first Brev training round) is queued for the observer to roll forward |
| **task-026** | **Stage A / MediaPipe vestige removal** | **infra / web / models / docs** | `#arch-no-pretrained` (`Stage A vestige` subsection), `#arch-forbidden-shortcuts` | **DONE** (2026-05-23) — 7 commits + 1 validation pass on `task-026-stage-a-removal`. Brief actuals: [`docs/session-logs/002-stage-a-vestige-removal.md`](docs/session-logs/002-stage-a-vestige-removal.md). | unblocks `task-005`, `task-006`, `task-017`, `task-018`, `task-022`. |
| **task-027** | **Push-blocker cleanup: rewrite history + push to origin** | **infra / repo hygiene** | `#arch-principles`, `#arch-storage-policy` | **HUMAN-DRIVEN** — outside autonomous loop. Session log: [`docs/session-logs/004-push-blocker-large-files.md`](docs/session-logs/004-push-blocker-large-files.md). Recommended path: `git filter-repo --invert-paths` to delete 4 pre-existing >100 MB blobs (1× Stage A `supervision.jsonl`, 3× `primarymath-classroom-asl-118/*.hdf5`); then refresh hard-coded SHAs in durable files; force-push compound-plan-m0 + main. | human triggers; orchestrator must NOT run this from `/orchestrate-start` without explicit go |

## execution order (post-amendment)

| window | priority | tasks |
|---|---|---|
| now | unblock no-pretrained invariant | `task-026` (Stage A removal) |
| after `task-026` | rebuild promoted-lane prerequisites | `task-005` rawframe active module declaration, `task-018` hint metadata schema, `task-017` typed inference interface |
| infra hardening | storage + Brev | `task-006` storage + Brev shell scripts |
| GPU work (Brev) | model training | first `task-010` 5-10 sign fixed-crop learnability proof; then `task-009` HandBoxNet only if crop-quality evidence justifies it; then `task-011` GuidedCropSignNet |
| post-training | calibration + claims | `task-012` abstention/hard negatives, `task-013` re-export, `task-022` model card + no-pretrained audit + final claim matrix |
| close-out | demo + lessons | `task-023` final pilot demo + Brev shutdown, `task-025` lessons/session log |

## task details

### task-000 — Repo intake and plan bootstrap

**status: DONE**
**discharged by:** [`docs/session-logs/001-gap-audit.md`](docs/session-logs/001-gap-audit.md)

Repo facts recorded: Next.js 16.2.6 App Router, React 19, TypeScript, Tailwind v4; npm (`web/package-lock.json`); Supabase Auth + Postgres (migrations in [`supabase/migrations/`](supabase/migrations/)); ONNX Runtime Web (same-origin via `/api/ort/[file]`); Python 3.14.5 + PyTorch 2.12.0 (Apple MPS); 213 scripts; 254 validation artifacts; 95+ hard gates documented in [`docs/strategy-confidence-audit.md`](docs/strategy-confidence-audit.md).

---

### task-001 — Architecture gap audit and finalization

**status: DONE**
**discharged by:** [`docs/session-logs/001-gap-audit.md`](docs/session-logs/001-gap-audit.md) + amended [`ARCHITECTURE.md`](ARCHITECTURE.md).

Four decisions locked in [`DECISIONS.md`](DECISIONS.md):

1. Strict no-pretrained; Stage A treated as vestige.
2. Brev for heavy GPU training; local MPS for light work.
3. Harmonize with existing `scripts/audit_*.mjs` chain; no parallel system.
4. Plan files merged into repo this round.

---

### task-002 — Install slash command and area scaffold

**status: DONE**

Installed:

- `.claude/commands/` — 13 commands: `check-arch.md`, `model-audit.md`, `orchestrate-end.md`, `orchestrate-start.md`, `preflight.md`, `route-flags.md`, `run-tests.md`, `session-end.md`, `session-start.md`, `tdd.md`, `team-start.md`, `wired.md`, `write-brief.md`
- Area files: `web/CLAUDE.md` + `web/LESSONS.md`, `scripts/CLAUDE.md` + `scripts/LESSONS.md`, `data/CLAUDE.md` + `data/LESSONS.md`, `docs/CLAUDE.md` + `docs/LESSONS.md`, `infra/CLAUDE.md` + `infra/LESSONS.md`, `models/CLAUDE.md` + `models/LESSONS.md`, `product/CLAUDE.md` + `product/LESSONS.md`
- Root [`CLAUDE.md`](CLAUDE.md) read-order pointer.
- `configs/` seeded with 8 example/config files including [`configs/vocabulary_seed_100.csv`](configs/vocabulary_seed_100.csv), [`configs/active-sign-modules.example.json`](configs/active-sign-modules.example.json), [`configs/sign-hints.example.json`](configs/sign-hints.example.json), [`configs/model-manifest.example.json`](configs/model-manifest.example.json), [`configs/storage-budget.json`](configs/storage-budget.json), [`configs/thresholds.example.json`](configs/thresholds.example.json), [`configs/capture-protocol.example.json`](configs/capture-protocol.example.json).

---

### task-003 — Project readiness harness

**status: PARTIAL**

Existing functional equivalents (do not duplicate):

- [`scripts/audit_completion_readiness.mjs`](scripts/audit_completion_readiness.mjs) — completion readiness
- [`scripts/audit_collection_plan_contract.mjs`](scripts/audit_collection_plan_contract.mjs) + [`scripts/audit_dataset_collection_readiness.mjs`](scripts/audit_dataset_collection_readiness.mjs) — collection readiness
- [`scripts/audit_local_ml_environment.py`](scripts/audit_local_ml_environment.py) → [`docs/validation/local-ml-environment.json`](docs/validation/local-ml-environment.json) — env receipt
- ~60 other `scripts/audit_*_readiness.mjs` / `scripts/audit_*_contract.mjs`

Missing pieces:

- `scripts/storage_budget_check.sh` (to be authored in `task-006`)
- `scripts/brev_*.sh` (to be authored in `task-006`)
- run-manifest start/end Python pair → can wrap existing training-run hashing instead

**validation:** `node scripts/audit_completion_readiness.mjs`

---

### task-004 — Source rights, provenance, and vocabulary inventory

**status: DONE (deeper than plan expects)**

Existing artifacts:

- [`docs/model/dataset-source-register.json`](docs/model/dataset-source-register.json) (hash-bound)
- [`docs/model/dataset-source-register.md`](docs/model/dataset-source-register.md)
- 51 files in [`docs/research/`](docs/research/) covering ASL Citizen, WLASL, MS-ASL, NVIDIA ASL, PopSign, HaGRID rights review
- [`web/src/lib/vocabulary.ts`](web/src/lib/vocabulary.ts) — 100 ASL beginner items
- [`docs/review/final-vocabulary-review.json`](docs/review/final-vocabulary-review.json) — reviewer-authority-bound vocabulary review
- Ed25519 reviewer authority chain under `data/vocabulary-review/evidence/`
- [`scripts/audit_source_register.mjs`](scripts/audit_source_register.mjs), [`scripts/audit_dataset_source_research.mjs`](scripts/audit_dataset_source_research.mjs), [`scripts/refresh_dataset_source_research.mjs`](scripts/refresh_dataset_source_research.mjs)

**validation:** `node scripts/audit_source_register.mjs && node scripts/audit_dataset_source_research.mjs && node scripts/audit_vocabulary_review.mjs && node scripts/audit_downstream_vocabulary_provenance.mjs`

---

### task-005 — Active sign modules and 100-item content vocabulary

**status: PARTIAL**

Done:

- 100 content items at [`web/src/lib/vocabulary.ts`](web/src/lib/vocabulary.ts) — passes [`scripts/audit_vocabulary_review.mjs`](scripts/audit_vocabulary_review.mjs).

Missing (in promoted lane):

- Active module declaration for the rawframe lane. The Stage A active modules (`docs/model/stage_a_smoke_*_vocab_*.json`) are bound to the vestige and removed in `task-026`.
- [`configs/active-sign-modules.example.json`](configs/active-sign-modules.example.json) seed exists but is not yet bound to a real rawframe-trained model.
- `docs/model/active-vocabulary-claim.json` not yet present.

**next:** after `task-026` and after rawframe training produces signer-disjoint metrics, declare the rawframe active module with `{labels[], thresholds[], modelVersion, evidenceArtifacts[]}`.

**validation:** `node scripts/audit_downstream_vocabulary_provenance.mjs && node scripts/audit_vocabulary_review_bundle.mjs`

---

### task-006 — Storage guardrails and Brev helpers

**status: PARTIAL** — helper scripts and the no-spend handoff runbook exist; live Brev exercise waits for explicit human approval.

Implemented:

- `scripts/storage_budget_check.sh` — exits non-zero if local free < 250 GB or project data > 650 GB. Reads thresholds from [`configs/storage-budget.json`](configs/storage-budget.json) (seeded by plan).
- `scripts/brev_create_48h.sh` — provisions a 48-hour Brev instance for the rawframe training role (HandBoxNet / baseline / GuidedCropSignNet).
- `scripts/brev_sync_repo.sh` — rsyncs repo to Brev worker while excluding broad local/generated paths, then syncs the required training-data allowlist: `data/manifests`, `data/tensors`, and `data/external/popsign-v1/raw`.
- `scripts/brev_stop_all_training.sh` — stops every Brev instance tagged with this project's tag.
- [`docs/runbooks/brev-rawframe-training-handoff.md`](docs/runbooks/brev-rawframe-training-handoff.md) — exact human-approved create/sync/train/copy-back/stop sequence.

Anchored to `#arch-storage-policy`, `#arch-gpu-execution`. Heavy GPU training goes to Brev; smoke/eval/export stays on local MPS per the GPU execution policy.

**validation:** `bash scripts/storage_budget_check.sh && bash -n scripts/brev_create_48h.sh && bash -n scripts/brev_sync_repo.sh && bash -n scripts/brev_stop_all_training.sh`

---

### task-007 — Dataset pulls and shard builder

**status: PARTIAL — collection lane complete for smoke; return-to-form proof must reselect a small source set**

The plan assumed PopSign / ASL Citizen / HaGRID subset pulls. The repo policy (per `strategy-confidence-audit.md` hard gate "First-party or cleared training data") keeps **first-party consented collection** as the default policy, with external sources permitted only after exact rights review. PopSign-v1 raw videos are explicitly cleared by [`docs/model/dataset-source-register.json`](docs/model/dataset-source-register.json), but the return-to-form path must choose a 5-10 sign source set before more training.

Existing:

- First-party collection scaffolding: [`scripts/audit_collection_plan_contract.mjs`](scripts/audit_collection_plan_contract.mjs), [`scripts/audit_reviewed_vocabulary_collection_gate.mjs`](scripts/audit_reviewed_vocabulary_collection_gate.mjs), [`scripts/run_dataset_collection_runtime_smoke.mjs`](scripts/run_dataset_collection_runtime_smoke.mjs)
- Disabled by default behind `ENABLE_DATASET_COLLECTION=true` + `NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true`
- [`scripts/export_dataset_manifests.mjs`](scripts/export_dataset_manifests.mjs) — shard manifest exporter
- [`scripts/decode_raw_videos.py`](scripts/decode_raw_videos.py) — clip decode with FFmpeg-replay binding (per hard gate "Raw-frame decode replay gap")

After `task-026`, all PopSign-cached landmark shards remain invalid because they came from a pretrained extractor. Usable training evidence must come from original raw videos plus local rawframe tensor provenance, while first-party collection remains the future data lane documented in [`docs/runbooks/first-party-collection.md`](docs/runbooks/first-party-collection.md).

**validation:** `node scripts/audit_dataset_collection_readiness.mjs && node scripts/audit_collection_plan_freshness.mjs`

---

### task-008 — Frame decode and crop pipeline

**status: PARTIAL**

Existing: [`scripts/decode_raw_videos.py`](scripts/decode_raw_videos.py) writes per-clip `frame_tensor_provenance` (FFmpeg binary hash + version pinning) per `strategy-confidence-audit.md` hard gate. [`scripts/audit_final_manifests.py`](scripts/audit_final_manifests.py) verifies tensor hashes.

Missing: explicit `crop_config_hash` binding into the training manifest so detector-crop vs fixed-crop ablations are reproducible.

**validation:** `python scripts/decode_raw_videos.py --smoke || true`

---

### task-009 — Scratch HandBoxNet detector lane

**status: MISSING / DEFERRED until fixed-crop proof or crop-quality failure justifies it**

Architecture allows the fixed-crop proof to ship without HandBoxNet. Only build HandBoxNet (from scratch, no pretrained anything) after a 5-10 sign fixed-crop proof exists or if that proof records crop quality as the blocker.

When built: train on Brev (heavy GPU); evaluation/audit on local MPS.

**validation:** `python scripts/train_handboxnet.py --smoke || true` (script to be authored)

---

### task-010 — Baseline recognizer smoke and sanity

**status: PARTIAL**

Existing: [`scripts/train_rawframe_model.py`](scripts/train_rawframe_model.py) with hard-gate `--test-manifest` + `--check-files` requirements; smoke runs blocked from writing to `artifacts/rawframe-model/`.

Missing: a committed 5-10 sign source/coverage artifact, fixed crop config, and pre-training gate set. Do not relaunch the current 95-label PopSign/WLASL branch as the next proof.

**validation:** `python scripts/train_rawframe_model.py --smoke --no-write || true`

---

### task-011 — GuidedCropSignNet train/evaluate

**status: PARTIAL** — aliased to rawframe pipeline

Heavy training runs on Brev. Promotion via [`scripts/promote_trained_model_card.mjs`](scripts/promote_trained_model_card.mjs) (hard gate "Hand-edited trained model card"). Final audit via `node scripts/audit_model_artifacts.mjs --require-trained`.

**validation:** `node scripts/audit_model_artifacts.mjs --require-trained` (currently fails because card is `not_trained`)

---

### task-012 — Abstention thresholds and hard negatives

**status: PARTIAL for vestige; MISSING for rawframe lane**

After Stage A removal:

- Threshold calibration via existing [`scripts/analyze_controlled_pilot_thresholds.mjs`](scripts/analyze_controlled_pilot_thresholds.mjs) reused for rawframe logits.
- Hard-negative coverage via [`data/guardrail-negative-fixtures/`](data/guardrail-negative-fixtures/) + [`scripts/audit_guardrail_negative_fixtures.mjs`](scripts/audit_guardrail_negative_fixtures.mjs).
- Target: false-pass rate < 0.05 at calibrated threshold (hard gate "Negative challenge rejection").

**validation:** `node scripts/analyze_controlled_pilot_reject_score_grid.mjs && node scripts/audit_guardrail_negative_fixtures.mjs`

---

### task-013 — Browser model export and manifest

**status: DONE (export wired); needs trained model**

Existing chain:

- [`scripts/export_onnx_model.py`](scripts/export_onnx_model.py) — ONNX export with parity fixture
- [`web/public/model/asl-pilot-rawframe-v0.onnx`](web/public/model/) + `.onnx.data` (current: untrained)
- [`web/public/model/model-card.json`](web/public/model/model-card.json) — plays the role of `model-manifest.json`
- [`web/public/model/asl-pilot-rawframe-v0-export-provenance.json`](web/public/model/)
- [`scripts/run_browser_onnx_wiring_smoke.mjs`](scripts/run_browser_onnx_wiring_smoke.mjs) + [`scripts/audit_browser_onnx_wiring_smoke.mjs`](scripts/audit_browser_onnx_wiring_smoke.mjs)
- [`scripts/run_final_browser_onnx_smoke.mjs`](scripts/run_final_browser_onnx_smoke.mjs) — exercises real client path through [`web/src/lib/client-model.ts`](web/src/lib/client-model.ts)
- ORT WASM served same-origin via [`web/src/app/api/ort/[file]/route.ts`](web/src/app/api/ort/)

**validation:** `node scripts/run_browser_onnx_wiring_smoke.mjs --write && node scripts/audit_browser_onnx_wiring_smoke.mjs`

---

### task-014 — Web app shell and routes

**status: DONE**

Single-component shell at [`web/src/components/PracticeApp.tsx`](web/src/components/PracticeApp.tsx) handles login + practice + progress tabs. Adjacent routes for `/validation`, `/smoke/browser-onnx`, `/review/asl-citizen-primarymath-roi`, `/auth/callback`, `/api/auth/*`, `/api/attempts`, `/api/progress`.

**validation:** `npm --prefix web run lint && npm --prefix web run typecheck && npm --prefix web run build`

---

### task-015 — Learner auth and progress persistence

**status: DONE**

Supabase Auth + Postgres with RLS. Auth wired at [`web/src/lib/supabase-server.ts`](web/src/lib/supabase-server.ts), [`web/src/lib/supabase-store.ts`](web/src/lib/supabase-store.ts), API routes at [`web/src/app/api/auth/{login,logout,register}/route.ts`](web/src/app/api/auth/). Attempts API at [`web/src/app/api/attempts/route.ts`](web/src/app/api/attempts/). Progress API at [`web/src/app/api/progress/route.ts`](web/src/app/api/progress/). Schema in [`supabase/migrations/20260521204656_attempt_progress_security_invoker.sql`](supabase/migrations/) defines `profiles` + `attempts` + `attempt_progress` view with RLS.

**validation:** `node scripts/audit_attempt_integrity.mjs && node scripts/audit_progress_contract.mjs && node scripts/run_practice_progress_smoke.mjs --write`

---

### task-015a — Promote vocabulary_items from TS to DB table

**status: MISSING** (new sub-task)

Promote [`web/src/lib/vocabulary.ts`](web/src/lib/vocabulary.ts) to a Supabase `vocabulary_items` table so per-vocab recognition status (`active`/`content_only`/`disabled`), per-vocab hint metadata, and active-module membership can be edited without a deploy.

Migration file: `supabase/migrations/NNNNNN_vocabulary_items.sql`. Seed from current TS module.

**validation:** new migration applied; `npm --prefix web run typecheck` passes; existing audits still pass.

---

### task-015b — Add practice_sessions table

**status: MISSING / OPTIONAL**

Only add if session-level analytics is needed for the pilot demo. Otherwise keep attempts as the source of truth.

---

### task-016 — Camera capture and permission states

**status: DONE; Playwright evidence current**

The `cameraStatus` state machine in [`web/src/components/PracticeApp.tsx`](web/src/components/PracticeApp.tsx) covers `idle → starting → ready | denied | unsupported | error`. The hard gate "Runtime camera UI drift" in [`docs/strategy-confidence-audit.md`](docs/strategy-confidence-audit.md) is satisfied by the Playwright-driven runtime smoke at [`scripts/run_practice_camera_behavior_smoke.mjs`](scripts/run_practice_camera_behavior_smoke.mjs), which writes the retained report at [`docs/validation/practice-camera-behavior-smoke.json`](docs/validation/practice-camera-behavior-smoke.json) (`status: "passed"`, 7 checks, `browser.automation: "playwright"`). The retained-evidence audit at [`scripts/audit_practice_camera_behavior_smoke.mjs`](scripts/audit_practice_camera_behavior_smoke.mjs) validates source-file hashes + Playwright metadata + exact camera-state copy.

Smoke run + audit chain (this slice):

```sh
NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=false ENABLE_DATASET_COLLECTION=false npm --prefix web run build
node scripts/run_practice_camera_behavior_smoke.mjs --write    # status passed
node scripts/audit_practice_camera_behavior_smoke.mjs          # status passed
node scripts/audit_browser_compatibility.mjs                   # passed
node scripts/audit_practice_screen_contract.mjs                # passed
```

**validation:** `node scripts/audit_practice_camera_behavior_smoke.mjs && node scripts/audit_browser_compatibility.mjs && node scripts/audit_practice_screen_contract.mjs`

---

### task-017 — Browser inference worker and pass/fail evaluator

**status: PARTIAL — refactor target**

Current: procedural chain at [`web/src/lib/client-model.ts`](web/src/lib/client-model.ts):

- `loadModelCard()`
- `sampleVideoFrame()`
- `evaluateLocalAttempt()` returns `{ passed, predictedId, confidence, hint, reason }`
- Stage A path at [`web/src/asl/stageARecognizer.ts`](web/src/asl/) (**deleted by `task-026`**)

Refactor target:

```ts
interface InferenceEngine {
  load(manifest: ModelManifest): Promise<void>;
  predict(input: FrameWindow, promptGloss: string): Promise<InferenceResult>;
}
```

Plus a separate `PassFailDecision` module consuming `InferenceResult` + `ThresholdConfig` + `ActiveSignModule` + `HardNegativeReport`. Pass/fail must return reasons usable by the hint engine (`task-018`).

**validation:** boundary unit tests via Vitest *or* an extension to [`scripts/run_browser_onnx_wiring_smoke.mjs`](scripts/run_browser_onnx_wiring_smoke.mjs) (recommendation: extend the existing smoke script; do not add a parallel runner).

---

### task-018 — Hint engine and sign metadata

**status: REAL GAP**

Vocabulary today: `{id, label, gloss, notes}`. Plan requires phonological hint metadata: handshape / movement / location / orientation / timing / framing.

Author:

- Extend [`web/src/lib/vocabulary.ts`](web/src/lib/vocabulary.ts) (or new `vocabulary_items` table from `task-015a`) with `SignHintMetadata`.
- Map failure reasons (from `PassFailDecision.reasons[]`) to targeted hints — never fake phonology diagnosis (hard gate "Honest targeted hints").
- Seed from [`configs/sign-hints.example.json`](configs/sign-hints.example.json) (plan-seeded).
- Wire to existing reviewer authority chain so hint copy passes [`scripts/audit_hint_pedagogy_review.mjs`](scripts/audit_hint_pedagogy_review.mjs) (hard gate "Hint pedagogy review ambiguity").

**validation:** `node scripts/audit_hint_pedagogy_review.mjs && node scripts/audit_practice_screen_contract.mjs`

---

### task-019 — Practice flow integration

**status: DONE; re-verify after `task-017` + `task-018`**

End-to-end loop in [`web/src/components/PracticeApp.tsx`](web/src/components/PracticeApp.tsx) wires prompt → camera → frame capture → inference → pass/fail → hint → retry/next → persisted attempt → progress refresh.

**validation:** `node scripts/run_practice_progress_smoke.mjs --write && node scripts/audit_practice_progress_smoke.mjs && node scripts/audit_practice_screen_contract.mjs`

---

### task-020 — Progress history and mastery UI

**status: DONE**

Backed by `attempt_progress` view + [`web/src/app/api/progress/route.ts`](web/src/app/api/progress/) + progress tab in PracticeApp.

**validation:** `node scripts/audit_progress_contract.mjs`

---

### task-021 — Privacy documentation and proof

**status: DONE (far deeper than plan expects)**

Existing: [`docs/privacy/`](docs/privacy/), [`docs/privacy/dataset-consent-form.md`](docs/privacy/dataset-consent-form.md), Ed25519 signer-identity at [`data/signer-identity/`](data/signer-identity/), [`scripts/audit_no_raw_video_upload.mjs`](scripts/audit_no_raw_video_upload.mjs), [`scripts/audit_final_privacy_smoke.mjs`](scripts/audit_final_privacy_smoke.mjs), [`scripts/run_practice_progress_smoke.mjs`](scripts/run_practice_progress_smoke.mjs).

Plan's [`docs/privacy-video-handling.md`](docs/privacy-video-handling.md) was copied into the repo this round; it complements (not replaces) the existing `docs/privacy/` chain.

**validation:** `node scripts/audit_no_raw_video_upload.mjs && node scripts/audit_final_privacy_smoke.mjs`

---

### task-022 — Final validation, model card, and no-pretrained audit

**status: PARTIAL**

Existing:

- [`docs/validation/final-claim-matrix.json`](docs/validation/final-claim-matrix.json) — auditable via [`scripts/audit_final_claim_matrix.mjs`](scripts/audit_final_claim_matrix.mjs)
- [`web/public/model/model-card.json`](web/public/model/model-card.json) — currently `not_trained`
- [`scripts/audit_no_pretrained_deps.mjs`](scripts/audit_no_pretrained_deps.mjs), [`scripts/audit_no_pretrained_artifact_json.mjs`](scripts/audit_no_pretrained_artifact_json.mjs)

To produce post-`task-026`:

- `docs/validation/no-pretrained-lane-audit.json` — JSON receipt summarizing both no-pretrained audits + asserting no `extractor` field references any pretrained model in any active manifest.
- Trained model card (after `task-011`) via [`scripts/promote_trained_model_card.mjs`](scripts/promote_trained_model_card.mjs).
- Final claim matrix matches implemented behavior.

**validation:** `node scripts/audit_no_pretrained_deps.mjs && node scripts/audit_no_pretrained_artifact_json.mjs && node scripts/audit_final_claim_matrix.mjs && node scripts/audit_model_artifacts.mjs --require-trained`

---

### task-023 — Final pilot demo and deployment package

**status: PARTIAL**

- `npm --prefix web run build` — passes today
- Vercel deployment — wired by default
- Brev shutdown — N/A until Brev is provisioned in `task-006`; afterwards run `bash scripts/brev_stop_all_training.sh`

**validation:** `npm --prefix web run build && bash scripts/brev_stop_all_training.sh || true`

---

### task-024 — 75–100 recognition expansion

**status: DEFERRED**

Gated on rawframe model passing signer-disjoint metrics for the smaller active module first (10-sign, then 20-sign). Per [`#arch-downscope-ladder`](ARCHITECTURE.md#arch-downscope-ladder) and `decision: 75-100 content items vs active recognition module` in [`DECISIONS.md`](DECISIONS.md).

---

### task-025 — Continuous lessons and session logs

**status: PARTIAL**

This very document is part of round 001. [`docs/session-logs/001-gap-audit.md`](docs/session-logs/001-gap-audit.md) is the first log. Area `LESSONS.md` files seeded but empty.

Run `/session-end` + `/orchestrate-end` at end of each round to add a numbered log and triage carry-forward.

---

### task-026 — Stage A / MediaPipe vestige removal

**status: DONE** (round 001, 2026-05-23)

Brief: [`docs/briefs/001-stage-a-vestige-removal.md`](docs/briefs/001-stage-a-vestige-removal.md).
Session log: [`docs/session-logs/002-stage-a-vestige-removal.md`](docs/session-logs/002-stage-a-vestige-removal.md).

Landed in 8 commits on branch `task-026-stage-a-removal` (worktree at `../asl-pilot-task-026`):

1. `Bootstrap round-001 plan-merge` — committed the round-001 amended plan files into git so the worktree had the brief and durable docs.
2. `§A: remove MediaPipe / Stage A from web/` — 33 files (8 source deletes, 12 verifier JSONs, 8 mediapipe runtime assets, 4 edits, regenerated lockfile without `@mediapipe/tasks-vision`).
3. `§B: delete Stage A / primarymath / hand-only vestige scripts` — 41 script deletions.
4. `§C: tighten no-pretrained audit; reframe claim matrix; drop Stage A UI` — extends [`scripts/audit_no_pretrained_artifact_json.mjs`](scripts/audit_no_pretrained_artifact_json.mjs) to reject `extractor.name = mediapipe_*` and `extractor.tasks_vision_version`; rewrites [`scripts/audit_final_claim_matrix.mjs`](scripts/audit_final_claim_matrix.mjs) to a rawframe-only minimal matrix; rewrites [`web/src/app/validation/page.tsx`](web/src/app/validation/page.tsx); removes Stage A test paths from [`scripts/run_practice_progress_smoke.mjs`](scripts/run_practice_progress_smoke.mjs); deletes the Stage A surface auditors `run_app_validation_surface_smoke.mjs` and `audit_goal_loop_prompt_tasks.mjs`.
5. `§D: delete Stage A docs vestige; reframe doc set` — 313 doc files (305 deletes + 7 reframes + 1 restore).
6. `§E: untrack artifacts/stage_a + stage_b; add to .gitignore` — 1514 artifact files untracked.
7. `§H: produce no-pretrained-lane-audit.json receipt; bind into matrix` — new [`scripts/build_no_pretrained_lane_audit.mjs`](scripts/build_no_pretrained_lane_audit.mjs) + new [`docs/validation/no-pretrained-lane-audit.json`](docs/validation/no-pretrained-lane-audit.json) receipt + bound into both claim matrices by SHA-256.
8. `validation: drop stale Stage A source-file ref; regenerate smokes` — final validation-chain pass.

Unblocks: `task-005`, `task-006`, `task-017`, `task-018`, `task-022`.

**validation (full chain, all passed):** `node scripts/audit_no_pretrained_deps.mjs && node scripts/audit_no_pretrained_artifact_json.mjs && npm --prefix web run lint && npm --prefix web run typecheck && npm --prefix web run build && node scripts/run_browser_onnx_wiring_smoke.mjs --write && node scripts/audit_browser_onnx_wiring_smoke.mjs && node scripts/run_practice_progress_smoke.mjs --write && node scripts/audit_practice_progress_smoke.mjs`
