# GOAL.md - historical mission archive

Moved out of [`GOAL.md`](../GOAL.md) on 2026-06-02 to keep the active Codex goal-loop prompt focused on the current mission and the evergreen operating contract. **Nothing in this file is an active instruction.** These are closed, superseded, stopped, or historical mission blocks plus their exit conditions, preserved verbatim for provenance. For the live mission and operating contract, read [`GOAL.md`](../GOAL.md).

---

## (retired) Lesson 3D Robot Avatar Secondary Task

## historical: Lesson 3D Robot Avatar Secondary Task

The active autonomous worker is **Codex executor**, observed by a separate
**Codex observer**. The user explicitly switched the active loop to the lesson
studio secondary task after the Detector 0 schema executor and observer turns
completed. Do not start or resume Claude/Happy as the project orchestrator.

**Historical per-milestone prompt:** [`docs/model/lesson-3d-robot-avatar-secondary-goal-loop-prompt.md`](docs/model/lesson-3d-robot-avatar-secondary-goal-loop-prompt.md).

**Observer stop:** commit `47acd11` completed the scoped `/lesson` route,
fail-closed detector/avatar scaffolding, retained smoke evidence, and prompt
acceptance checks for the active secondary task. The remaining next step is a
human UX/scope decision: review `/lesson` and decide whether to extract shared
camera logic or add reviewed authored lesson motions. Do not continue the
autonomous loop until that decision is explicit.

**Reviewer/observer boundary:** the entire plan for this secondary task lives
in the active per-milestone prompt above. The observer must not move this task
to a new milestone prompt and must not rewrite `GOAL.md` to a different plan.
If the executor needs steering, the observer should use NUDGE, STOP, or
ESCALATE while citing the active prompt.

**Historical project truth for lesson 3D robot task:**

- The current browser model remains fail-closed: `web/public/model/model-card.json`
  is `status: "not_trained"`, and
  `docs/model/active-vocabulary-claim.json` has `activeLabels: []`.
- `/` remains the existing full practice workspace. This mission adds `/lesson`
  beside it; it does not replace the existing route.
- The desired learner-facing page is a calm lesson studio with selected ASL
  prompt, local camera preview, and a credible 3D robot mannequin scaffold.
- The robot is not a correctness evaluator. It may idle, show timing/demo
  scaffolding, or replay clearly labeled authored motion, but it must not claim
  live tracking or ASL correctness unless a promoted browser Detector 0 artifact
  is actually running.
- Use a 3D-first plan with a procedural robot in vanilla `three` unless repo
  inspection proves a different lightweight 3D approach is materially better.
  Do not downgrade the primary plan to a 2D puppet.
- Detector 0 remains a future scratch-trained coarse box/center detector. This
  mission may scaffold detector/avatar contracts and fail-closed cards, but it
  must not run Detector 0 training, recognizer training, crop-normalization
  ablations, model-card promotion, Brev compute, or source import.
- Camera privacy and no-pretrained boundaries remain binding: no raw learner
  video/frame upload and no MediaPipe/OpenPose/YOLO/pretrained landmark,
  detector, backbone, embedding, or generated-label dependency.

**Historical completed slice:** followed
[`docs/model/lesson-3d-robot-avatar-secondary-goal-loop-prompt.md`](docs/model/lesson-3d-robot-avatar-secondary-goal-loop-prompt.md).
It started by inspecting `git status --short --branch`, the current `PracticeApp`
camera/auth flow, the model claim surfaces, and the existing web test/audit
patterns, then implemented the smallest useful `/lesson` slice that preserves
fail-closed behavior, local-only camera semantics, and the 3D robot mannequin
plan. It validated with the checks named in the historical prompt, wrote a
numbered session log, committed only scoped files, and stopped.

**Historical exit condition:** the acceptance criteria in the historical
per-milestone prompt were satisfied, or the executor recorded a concrete
blocker that requires human review, Detector 0 promotion, source review, or a
scope decision. Observer steering must remain within the active prompt.


---

## recent completed mission (Mission 3HG - bounded PopSign 25 compute receipt no training)

Mission 3HF completed at commit `a367b08` and selected
`continue_m3hg_bounded_popsign25_compute_receipt_no_training`. It created the
local/no-remote/no-Brev/no-training PopSign 25 input/training-contract
preflight from existing M3HC/M3HD/M3HE evidence. It found no concrete input,
command, class-index, sampler, threshold, tensor-rank, report, or sidecar
contract gap that plausibly explains the all-`uncle` collapse. The strongest
local limitation remains capped exposure: M3HC trained only `64/625` train
examples for one epoch with batch size `4` and `max_train_batches: 16`.

Mission 3HG created the tracked bounded compute receipt and session log from
existing evidence, local command surfaces, fail-closed claim surfaces, and
read-only Brev inventory/search. It records the future compute attempt as
bounded, priced, and kill-conditioned, but not command-valid today because the
current PopSign label-ladder training-smoke guardrails repeat the `16`-batch
M3HC cap and lack a fresh M3HH output namespace.

## recent completed mission (Mission 3HF - PopSign 25 input or training contract preflight no remote)

Mission 3HE completed at commit `fba887e` and selected
`continue_m3hf_popsign25_input_or_training_contract_preflight_no_remote`.
It created the local/no-remote/no-Brev/no-training PopSign 25 split/label/
sampler diagnosis from existing M3HC/M3HD evidence. The manifests are balanced
by label, class-index evidence is internally consistent, `uncle` is only the
normal `0.04` true share, and no split/path/signer duplication was detected
without raw-media inspection.

Mission 3HF created the tracked input/training-contract preflight receipt and
session log from existing M3HC/M3HD/M3HE evidence, local contract surfaces,
ignored copied M3HC output JSON, and fail-closed claim surfaces. It concluded
that no concrete input, command, class-index, sampler, report, or sidecar
contract gap plausibly explains the all-`uncle` collapse. The remaining local
limitation is the capped M3HC exposure, which can explain weak near-uniform
behavior but does not support readiness or promotion.

## recent completed mission (Mission 3HE - PopSign 25 data split label or sampler diagnosis no training)

Mission 3HD completed at commit `31bb785` and selected
`continue_m3he_popsign25_data_split_label_or_sampler_diagnosis_no_training`.
It created the local/no-remote/no-Brev/no-training PopSign 25 metric triage
receipt from M3HC evidence and confirmed the M3HC result is negative diagnostic
raw-frame evidence: validation/test top-1 exactly `0.04` chance, validation/
test macro-F1 `0.003076923076923077`, every validation/test prediction
collapsed to `uncle`, entropy near `ln(25)`, tiny probability margins, and zero
accepted examples at threshold `1.0`.

Mission 3HE created the tracked data split, label-accounting, and
sampler/batch-exposure diagnosis from existing tracked PopSign 25 manifests,
M3HC/M3HD receipts and logs, claim surfaces, and already-present ignored copied
M3HC output JSON. It concluded that split balance, label mapping, class-index
consistency, true/predicted label accounting, sampler exposure, and train/eval
distribution do not fully explain the all-`uncle` collapse.

## recent completed mission (Mission 3HD - PopSign 25 metric triage no remote)

Mission 3HC completed at commit `69d1dca` and selected
`continue_m3hd_popsign25_metric_triage_no_remote`. It executed the approved
bounded PopSign 25-label Brev training/evaluation attempt, copied back exactly
one output directory, and verified the retained L40S worker stopped/default-off.
The result is negative diagnostic raw-frame evidence: validation top-1 `0.04`,
validation macro-F1 `0.003076923076923077`, test top-1 `0.04`, test macro-F1
`0.003076923076923077`, with predictions collapsed to `uncle` across
validation and test.

Mission 3HD created the tracked metric-triage receipt and session log from the
M3HC receipt, session log, claim surfaces, and already-present ignored copied
outputs. It interpreted the weak PopSign 25 metrics, single-label collapse,
chance-level top-1, entropy/margin signal, compute-envelope compliance, and
fail-closed claim state without rerunning training/evaluation or starting
remote work.

## recent completed mission (Mission 3HC - bounded PopSign Brev training or eval)

Mission 3HB completed at commit `70c1b0e` and selected
`continue_m3hc_bounded_popsign_brev_training_or_eval`. It repaired the PopSign
25-label training-smoke output namespace, proved the exact local dry-run with no
Brev spend, and confirmed the retained L40S worker was stopped.

Mission 3HC then executed exactly one bounded PopSign 25-label Brev training/
evaluation attempt under the active compute envelope. It started the retained
worker, proved SSH/CUDA readiness on an L40S, synced the repo and allowed
rawframe data, ran one remote dry-run, one non-dry-run training command, one
evaluator command, copied back one output directory, and verified final
stop/default-off state.

M3HC preserved fail-closed claim surfaces. Its output is diagnostic raw-frame
evidence only, not Detector 0/crop-normalized evidence and not browser
recognition authority.

## recent redirected mission (Mission 3HA - human-reviewed fail-closed demo finish)

The active autonomous worker is **Codex executor**, observed by a separate
**Codex observer**. Do not start or resume Claude/Happy as the project
orchestrator. The abandoned Claude Internet Archive contact-sheet work remains
reversibly quarantined in a git stash named `quarantine abandoned Claude IA
contact-sheet slice before Codex takeover`; it is not active evidence and must
not be promoted without a deliberate recovery decision.

**Active per-milestone prompt:** [`docs/model/return-to-form-m3ha-human-reviewed-fail-closed-demo-finish-goal-loop-prompt.md`](docs/model/return-to-form-m3ha-human-reviewed-fail-closed-demo-finish-goal-loop-prompt.md).

**Human model-strategy review decision:** The user explicitly authorized this
thread to perform the human review required by observer STOP commit `13d6795`.
That review accepts the M3GZ conclusion: the reduced4 recognizer evidence is
negative for the current no-pretrained raw-frame/region-grid route. M3GR proved
only local input wiring and same-subset train-fit. M3GU and M3GY reproduced
held-out failure: validation top-1 `0.26666666666666666`, validation macro-F1
`0.11111111111111112`, test top-1 `0.25`, and test macro-F1
`0.1678321678321678`. M3GY/M3GZ showed prediction collapse to `sad`/`uncle`,
`hello` and `white` not predicted in validation/test, tiny logit margins, and
entropy near `ln(4)`, so the result is weak near-uniform separation rather
than a threshold-only or missing-sidecar-field problem.

The reviewed decision is: **do not run more autonomous model/data/input/
architecture/compute work for the deadline path.** Recognition remains
fail-closed. The next useful work is one local/no-spend/no-training deadline
demo/product slice that verifies or improves the fail-closed browser learning
experience and claim surfaces.

M3HA may inspect product routes, claim surfaces, existing smoke/audit scripts,
M3GQ-M3GZ receipts/logs, the saved strategy escalation artifacts, and already
present ignored diagnostic outputs read-only. It may run local product/status
audits, typecheck/lint where available, and fix at most one bounded
fail-closed product or claim-hygiene blocker. It may write a tracked M3HA
receipt and numbered session log.

M3HA must not train, fit, micro-overfit, rerun evaluation, regenerate ignored
ML outputs, use Brev lifecycle/remote/sync/copy/exec commands, inspect raw
media, import source/media, mutate source-register rights, mutate manifests/
tensors/vocabulary, export, promote, activate browser recognition, change
final gates, expand recognition claims, broaden labels, or use pretrained
shortcuts. Claim surfaces must remain fail-closed. Brev remains default-off;
the retained `asl-pilot-m3eh-l40s-001` / `3d58wpy9o` worker was observed
`STOPPED` / `COMPLETED` / `NOT READY` / `HEALTHY`.

**Human review artifact:** [`docs/validation/return-to-form-m3ha-human-review-decision-v1.json`](docs/validation/return-to-form-m3ha-human-review-decision-v1.json).

## recent stopped mission (Mission 3GZ - reduced4 logits sidecar result triage no training no Brev)

The active autonomous worker is **Codex executor**, observed by a separate
**Codex observer**. Do not start or resume Claude/Happy as the project
orchestrator. The abandoned Claude Internet Archive contact-sheet work remains
reversibly quarantined in a git stash named `quarantine abandoned Claude IA
contact-sheet slice before Codex takeover`; it is not active evidence and must
not be promoted without a deliberate recovery decision.

**Active per-milestone prompt:** [`docs/model/return-to-form-m3gz-reduced4-logit-collapse-triage-no-training-no-brev-goal-loop-prompt.md`](docs/model/return-to-form-m3gz-reduced4-logit-collapse-triage-no-training-no-brev-goal-loop-prompt.md).

**Observer handoff:** M3GY completed one bounded local/no-Brev/no-training
diagnostic evaluator rerun against the existing ignored M3GU reduced4
checkpoint/provenance and M3GQ reduced4 manifests, then selected
`continue_m3gz_reduced4_logit_collapse_triage_no_training_no_brev`.
Mission 3GZ must inspect the M3GY receipt/log and ignored M3GY report/sidecar
read-only, interpret the failed metrics and raw-logit evidence, record the
`top2_logit_label` sidecar-contract metadata gap if still present, and choose
one next action that prevents another training-style attempt without a concrete
strategy or contract reason.

The purpose is triage and steering, not model improvement. M3GZ must summarize
validation/test accuracy, macro-F1, zero-recall classes, no-predicted-label
classes, predicted-label collapse, logit-margin ranges, entropy ranges, and the
near-uniform weak-separation signal. It must explicitly state that the M3GY
result is diagnostic failure evidence only and does not justify export,
promotion, browser activation, or claim expansion.

M3GZ may read existing tracked receipts/logs/manifests/claim surfaces and
already-present ignored M3GY output JSON. It may write a tracked M3GZ receipt
and numbered session log. It must not train, fit, micro-overfit, rerun
evaluation, overwrite/regenerate/delete ignored outputs, use Brev lifecycle/
remote/sync/copy/exec commands, inspect raw media, import source/media, mutate
source-register rights, mutate manifests/tensors/vocabulary, export, promote,
activate browser recognition, change final gates, expand claims, broaden
labels, or use pretrained shortcuts. Claim surfaces remain fail-closed. Brev
remains default-off; the retained `asl-pilot-m3eh-l40s-001` / `3d58wpy9o`
worker was observed `STOPPED` / `COMPLETED` / `NOT READY` / `HEALTHY`.

**M3GY result:** M3GY created
[`docs/validation/return-to-form-m3gy-reduced4-diagnostic-eval-rerun-no-training-no-brev-v1.json`](docs/validation/return-to-form-m3gy-reduced4-diagnostic-eval-rerun-no-training-no-brev-v1.json)
and session log
[`docs/session-logs/665-mission-3gy-reduced4-diagnostic-eval-rerun-no-training-no-brev.md`](docs/session-logs/665-mission-3gy-reduced4-diagnostic-eval-rerun-no-training-no-brev.md).
It allowed the explicit M3GY diagnostic output namespace, preserved no-overwrite
guards, and produced fresh ignored report/sidecar outputs under
`output/m3gy-reduced4-diagnostic-eval-rerun-no-brev/`. The rerun failed targets:
validation top-1 `0.26666666666666666`, validation macro-F1
`0.11111111111111112`, test top-1 `0.25`, and test macro-F1
`0.1678321678321678`. Predictions collapsed to `sad`/`uncle`; `hello` and
`white` were not predicted in validation/test; logits/probabilities were
near-uniform with tiny margins and high entropy. Example rows contain the M3GX
raw-logit fields, but `sidecar_contract.score_fields` still omits
`top2_logit_label`. M3GY kept claims fail-closed, ran no training/Brev/export/
promotion/browser activation, and selected
`continue_m3gz_reduced4_logit_collapse_triage_no_training_no_brev`.

**M3GX result:** M3GX created
[`docs/validation/return-to-form-m3gx-reduced4-manifest-metadata-or-sidecar-diagnostic-repair-no-training-v1.json`](docs/validation/return-to-form-m3gx-reduced4-manifest-metadata-or-sidecar-diagnostic-repair-no-training-v1.json)
and session log
[`docs/session-logs/663-mission-3gx-reduced4-manifest-metadata-or-sidecar-diagnostic-repair-no-training.md`](docs/session-logs/663-mission-3gx-reduced4-manifest-metadata-or-sidecar-diagnostic-repair-no-training.md).
It added future-sidecar raw-logit diagnostics to
[`scripts/evaluate_rawframe_model.py`](scripts/evaluate_rawframe_model.py):
`logits_by_label`, predicted/true-label logits, top-2 logit, top-2 logit label,
and logit margin for validation/test and negative-challenge rows. M3GX did not
train, rerun evaluation, regenerate outputs, inspect raw media, use Brev,
export, promote, activate browser recognition, change gates, or expand claims.
It selected
`continue_m3gy_reduced4_diagnostic_eval_rerun_no_training_no_brev`.

**M3GW result:** M3GW created
[`docs/validation/return-to-form-m3gw-reduced4-data-split-zero-recall-diagnosis-no-training-v1.json`](docs/validation/return-to-form-m3gw-reduced4-data-split-zero-recall-diagnosis-no-training-v1.json)
and session log
[`docs/session-logs/661-mission-3gw-reduced4-data-split-zero-recall-diagnosis-no-training.md`](docs/session-logs/661-mission-3gw-reduced4-data-split-zero-recall-diagnosis-no-training.md).
It found that visible reduced4 train/validation/test counts are balanced or
near-balanced and all zero-recall labels have rows in each split, so missing
label coverage is not the primary explanation. It confirmed source id is
consistent, source-record and signer overlap across splits is empty, predictions
collapsed to `sad`/`uncle`, `hello` and `white` were never predicted in
validation/test, session/capture metadata is absent, no reduced4 negative-
challenge evidence exists, sidecars lack logits/embeddings/region/crop/frame
diagnostics, claim surfaces stayed fail-closed, Brev stayed read-only/default-
off, and selected
`continue_m3gx_reduced4_manifest_metadata_or_sidecar_diagnostic_repair_no_training`.

**M3GV result:** M3GV created
[`docs/validation/return-to-form-m3gv-reduced4-smoke-metric-triage-no-brev-v1.json`](docs/validation/return-to-form-m3gv-reduced4-smoke-metric-triage-no-brev-v1.json)
and session log
[`docs/session-logs/659-mission-3gv-reduced4-smoke-metric-triage-no-brev.md`](docs/session-logs/659-mission-3gv-reduced4-smoke-metric-triage-no-brev.md).
It interpreted the existing M3GU artifacts without training, evaluator reruns,
implementation changes, output regeneration, Brev lifecycle/remote work, export,
promotion, browser activation, source/media work, research calls, final-gate
changes, or claim expansion. It recorded that M3GU proves guard/input plumbing
and one local diagnostic smoke only; held-out quality, threshold readiness,
negative-challenge behavior, product readiness, export, and claims remain
unproven. The dominant unresolved signal is validation/test zero recall plus
prediction collapse, so M3GV selected
`continue_m3gw_reduced4_data_split_zero_recall_diagnosis_no_training`.

**M3GU result:** M3GU created
[`docs/validation/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-v1.json`](docs/validation/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-v1.json)
and session log
[`docs/session-logs/657-mission-3gu-reduced4-local-training-smoke-no-brev.md`](docs/session-logs/657-mission-3gu-reduced4-local-training-smoke-no-brev.md).
It proved the reduced4 guard before fitting: the route consumed `rgb_regions`,
preserved the `B,T,R,C,H,W` region axis, rejected `rgb_frames` fallback, and
recorded `pretrained_components: []`. It then ran exactly one capped local
training smoke and one local diagnostic evaluation/report. The evaluation
reported `passes_targets: false` and exited `1` as a target failure, not as
readiness evidence. Validation top-1 was `0.26666666666666666` with macro-F1
`0.11111111111111112`; test top-1 was `0.25` with macro-F1
`0.1678321678321678`; zero-recall labels remained on validation/test, and no
reduced4 negative-challenge evidence exists. Claim surfaces stayed fail-closed,
Brev stayed read-only/default-off, and M3GU selected
`continue_m3gv_reduced4_smoke_metric_triage_no_brev`.

**M3GT result:** M3GT created
[`docs/validation/return-to-form-m3gt-reduced4-local-training-smoke-receipt-no-brev-v1.json`](docs/validation/return-to-form-m3gt-reduced4-local-training-smoke-receipt-no-brev-v1.json)
and session log
[`docs/session-logs/655-mission-3gt-reduced4-local-training-smoke-receipt-no-brev.md`](docs/session-logs/655-mission-3gt-reduced4-local-training-smoke-receipt-no-brev.md).
It recorded the future reduced4 smoke command contract, caps, output namespace,
guards, kill conditions, and interpretation rules without running training,
evaluation, Brev lifecycle/remote work, export, browser activation, source/
media work, research, final-gate changes, or claim changes. It found that the
generic small-label smoke path is not acceptable because it does not preserve
`rgb_regions` authority, and selected
`continue_m3gu_reduced4_local_training_smoke_no_brev`.

**M3GS result:** M3GS created
[`docs/validation/return-to-form-m3gs-reduced4-trainability-result-triage-no-brev-v1.json`](docs/validation/return-to-form-m3gs-reduced4-trainability-result-triage-no-brev-v1.json)
and session log
[`docs/session-logs/653-mission-3gs-reduced4-trainability-result-triage-no-brev.md`](docs/session-logs/653-mission-3gs-reduced4-trainability-result-triage-no-brev.md).
It interpreted M3GR's reduced4 result without overclaiming it: local input
wiring and tiny same-subset train-fit are proven, but validation/test quality,
threshold readiness, export, promotion, browser activation, final readiness,
and broad training viability remain unproven. M3GS kept Brev read-only/
default-off, preserved fail-closed claim surfaces, ran no training/fitting/
evaluation, and selected
`continue_m3gt_reduced4_local_training_smoke_receipt_no_brev`.

**M3GR result:** M3GR created
[`docs/validation/return-to-form-m3gr-local-dataloader-or-micro-overfit-preflight-no-brev-v1.json`](docs/validation/return-to-form-m3gr-local-dataloader-or-micro-overfit-preflight-no-brev-v1.json),
session log
[`docs/session-logs/651-mission-3gr-local-dataloader-or-micro-overfit-preflight-no-brev.md`](docs/session-logs/651-mission-3gr-local-dataloader-or-micro-overfit-preflight-no-brev.md),
and scoped helper
[`scripts/run_m3gr_reduced4_micro_overfit_preflight.py`](scripts/run_m3gr_reduced4_micro_overfit_preflight.py).
It verified the M3GQ reduced4 manifests, observed `rgb_regions_grid_v1` for
all 79 selected rows, preserved the region axis through the local model input,
then ran exactly one bounded local from-scratch micro-overfit on a deterministic
four-clip train subset. Same-subset accuracy reached `1.0` with zero-recall
labels `[]`. This is train-fit evidence only, not held-out quality, export,
promotion, browser activation, final readiness, or authorization for broad
training. Brev stayed read-only/default-off and claim surfaces stayed
fail-closed. M3GR selected
`continue_m3gs_reduced4_trainability_result_triage_no_brev`.

**M3GQ result:** M3GQ created
[`docs/validation/return-to-form-m3gq-source-vocab-input-repair-no-brev-v1.json`](docs/validation/return-to-form-m3gq-source-vocab-input-repair-no-brev-v1.json),
session log
[`docs/session-logs/649-mission-3gq-source-vocab-input-repair-no-brev.md`](docs/session-logs/649-mission-3gq-source-vocab-input-repair-no-brev.md),
and scoped reduced4 manifests under
[`data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/`](data/manifests/lesson/high-signal-region-grid-reduced4-m3gq/).
It selected `reduced_existing_vocab_contract` from existing approved ASL
Citizen high-signal region-grid rows for `hello`, `uncle`, `white`, and
`sad`; preserved the parent seven-label contract; kept Brev read-only/default-
off; preserved fail-closed claim surfaces; ran no training/fitting; and
selected `continue_m3gr_local_dataloader_or_micro_overfit_preflight_no_brev`.

**M3GP result:** M3GP created
[`docs/validation/return-to-form-m3gp-human-strategy-packet-no-brev-v1.json`](docs/validation/return-to-form-m3gp-human-strategy-packet-no-brev-v1.json)
and session log
[`docs/session-logs/646-mission-3gp-human-strategy-packet-no-brev.md`](docs/session-logs/646-mission-3gp-human-strategy-packet-no-brev.md).
It separated observed facts from inference, recorded closed questions and open
human choices, evaluated the strategy options, preserved fail-closed claim
surfaces, kept Brev read-only/default-off, and selected
`stop_for_human_dataset_vocab_model_input_strategy_choice`.

**M3GO result:** M3GO created
[`docs/validation/return-to-form-m3go-read-only-contract-gap-inventory-no-brev-v1.json`](docs/validation/return-to-form-m3go-read-only-contract-gap-inventory-no-brev-v1.json)
and session log
[`docs/session-logs/644-mission-3go-read-only-contract-gap-inventory-no-brev.md`](docs/session-logs/644-mission-3go-read-only-contract-gap-inventory-no-brev.md).
It mapped every M3GN candidate hypothesis to existing evidence, missing
fields, approval-gated checks, answered steering questions, and cheapest safe
next evidence steps. It kept Brev read-only/default-off, preserved
fail-closed claim surfaces, rejected another compute-only retry, and selected
`continue_m3gp_human_strategy_packet_no_brev`.

**M3GN result:** M3GN created
[`docs/validation/return-to-form-m3gn-dataset-vocab-model-input-contract-no-brev-v1.json`](docs/validation/return-to-form-m3gn-dataset-vocab-model-input-contract-no-brev-v1.json)
and session log
[`docs/session-logs/642-mission-3gn-dataset-vocab-model-input-contract-no-brev.md`](docs/session-logs/642-mission-3gn-dataset-vocab-model-input-contract-no-brev.md).
It recorded the current 7-label ASL Citizen high-signal region-grid contract
(`black`, `hello`, `please`, `sad`, `table`, `uncle`, `white`), ranked
candidate hypotheses, separated autonomous-safe read-only fields from
approval-gated checks, kept Brev read-only/default-off, preserved fail-closed
claim surfaces, and selected
`continue_m3go_read_only_contract_gap_inventory_no_brev`.

**M3GM result:** M3GM created
[`docs/validation/return-to-form-m3gm-metric-triage-dataset-vocab-model-input-strategy-no-brev-v1.json`](docs/validation/return-to-form-m3gm-metric-triage-dataset-vocab-model-input-strategy-no-brev-v1.json)
and session log
[`docs/session-logs/640-mission-3gm-metric-triage-dataset-vocab-model-input-strategy-no-brev.md`](docs/session-logs/640-mission-3gm-metric-triage-dataset-vocab-model-input-strategy-no-brev.md).
It inspected M3GL/M3GJ/M3GB receipts and copied-back diagnostic JSON already
present locally, kept Brev read-only/default-off, and kept claim surfaces
fail-closed. It classified M3GL as a regression against M3GB/M3GJ, identified
unstable class-boundary/generalization under the current 7-label
`rgb_regions_grid_v1` setup, and recommended the next no-spend artifact:
`M3GN dataset/vocabulary/model-input contract`. Selected next action:
`continue_m3gn_dataset_vocab_model_input_contract_no_brev`.

**M3GL result:** M3GL created
[`docs/validation/return-to-form-m3gl-brev-provider-recovery-and-completion-route-v1.json`](docs/validation/return-to-form-m3gl-brev-provider-recovery-and-completion-route-v1.json)
and session log
[`docs/session-logs/638-mission-3gl-brev-provider-recovery-and-completion-route.md`](docs/session-logs/638-mission-3gl-brev-provider-recovery-and-completion-route.md).
It observed retained worker `asl-pilot-m3eh-l40s-001` / `3d58wpy9o` recovered
as `RUNNING` / `COMPLETED` / `READY` / `HEALTHY`, so no reset or replacement
worker was used. It passed local and remote dry-run/check-files guards, ran
exactly one timed CUDA training command and one evaluator command, copied back
ignored diagnostic outputs, then stopped/default-off verified the worker as
`STOPPED` / `COMPLETED` / `NOT READY` / `HEALTHY`. The route stayed
diagnostic-only: test top-1 regressed to `0.14285714285714285`, test macro-F1
regressed to `0.09206349206349207`, target gates failed, and claim surfaces
remained fail-closed. Selected next action:
`continue_m3gm_metric_triage_and_dataset_vocab_strategy_no_brev`.

**M3GK result:** M3GK created
[`docs/validation/return-to-form-m3gk-bounded-brev-completion-route-after-regenerated-evidence-v1.json`](docs/validation/return-to-form-m3gk-bounded-brev-completion-route-after-regenerated-evidence-v1.json)
and session log
[`docs/session-logs/635-mission-3gk-bounded-brev-completion-route-after-regenerated-evidence.md`](docs/session-logs/635-mission-3gk-bounded-brev-completion-route-after-regenerated-evidence.md).
It patched the M3GK smoke output namespace guard, passed local dry-run/
check-files for all 139 high-signal region-grid clips, refreshed L40S price
evidence at `$1.74/hour`, started the retained worker, then stopped before
sync/training because `timeout 300s brev exec ...` timed out waiting for SSH.
No remote sync, remote dry-run, timed training, evaluation, copyback, export,
promotion, browser activation, or claim expansion occurred. Observer session
[`docs/session-logs/636-observer-stop-m3gk-brev-provider-safety-review.md`](docs/session-logs/636-observer-stop-m3gk-brev-provider-safety-review.md)
parked the loop for provider/budget review with the worker finally observed
`STOPPED` / `COMPLETED` / `NOT READY` / `UNHEALTHY`.

**M3GJ result:** M3GJ created
[`docs/validation/return-to-form-m3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility-v1.json`](docs/validation/return-to-form-m3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility-v1.json)
and session log
[`docs/session-logs/633-mission-3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility.md`](docs/session-logs/633-mission-3gj-human-approved-evaluator-regeneration-v2-consumer-compatibility.md).
The regenerated sidecar is v2 and includes sidecar contract v2 fields,
probability vectors, true-label probabilities, manifest path/hash/row-index
fields, and tensor path/hash fields. Metrics remain diagnostic-only and fail
promotion gates: test top-1 `0.25`, test macro-F1 `0.15634920634920638`, and
`passes_targets: false`.

**M3GI activation:** M3GH executor commit `f7830e9` completed the first
local/no-remote/no-training M3GB evaluator sidecar contract repair. Observer
commit `c4b36cd` then found one remaining negative-challenge tensor-path
serialization gap, and executor commit `cf9bf2c` fixed it without rerunning
the evaluator or regenerating copied-back outputs. The M3GH receipt is
[`docs/validation/return-to-form-m3gh-m3gb-evaluator-sidecar-contract-repair-no-remote-v1.json`](docs/validation/return-to-form-m3gh-m3gb-evaluator-sidecar-contract-repair-no-remote-v1.json)
with session logs
[`docs/session-logs/626-mission-3gh-m3gb-evaluator-sidecar-contract-repair-no-remote.md`](docs/session-logs/626-mission-3gh-m3gb-evaluator-sidecar-contract-repair-no-remote.md)
and
[`docs/session-logs/628-mission-3gh-negative-challenge-tensor-path-repair.md`](docs/session-logs/628-mission-3gh-negative-challenge-tensor-path-repair.md).
M3GH selected exactly one next action:
`continue_m3gb_evaluator_output_regeneration_receipt_for_human_approval`.
M3GI must create only a local/no-remote/no-training approval receipt for a
future M3GB evaluator output regeneration/rerun. It must not run the
evaluator, load a checkpoint for generated outputs, regenerate or rewrite
copied-back outputs, copy back artifacts, start or exec Brev, run training,
run browser/product smoke, inspect raw video, generate tensors/crops, mutate
source/manifest/tensor/vocabulary artifacts, export, promote, activate browser
recognition, change product runtime, or expand claims. If the receipt is
created successfully, the expected next action is
`stop_for_human_m3gb_evaluator_output_regeneration_approval`.

**M3GH activation:** M3GG executor commit `f195f69` completed the local/
no-remote/no-training M3GB report/sidecar contract-gap patch plan slice and
selected exactly one next action:
`continue_m3gb_evaluator_sidecar_contract_repair_no_remote`. It created the
tracked receipt
[`docs/validation/return-to-form-m3gg-m3gb-report-sidecar-contract-gap-patch-plan-no-remote-v1.json`](docs/validation/return-to-form-m3gg-m3gb-report-sidecar-contract-gap-patch-plan-no-remote-v1.json)
and session log
[`docs/session-logs/624-mission-3gg-m3gb-report-sidecar-contract-gap-patch-plan-no-remote.md`](docs/session-logs/624-mission-3gg-m3gb-report-sidecar-contract-gap-patch-plan-no-remote.md).
M3GH must perform one local/no-remote/no-training evaluator sidecar contract
repair from existing evidence and code inspection only. It may edit local
evaluator/report contract surfaces enough to make future sidecar rows
self-contained for root-cause analysis, but must not run an evaluator,
training, browser/product smoke, Brev lifecycle/remote command, raw-video
inspection, tensor/crop generation, source/manifest/tensor/vocabulary
mutation, copied-output rewrite or regeneration, export, promotion, browser
activation, product-runtime change, or claim expansion.

**M3GG activation:** M3GF executor commit `b42e0cf` completed the local/
no-remote/no-training M3GB source/split/manifest accounting repair slice and
selected exactly one next action:
`continue_m3gb_report_sidecar_contract_gap_patch_plan_no_remote`. It created
the tracked receipt
[`docs/validation/return-to-form-m3gf-m3gb-source-split-manifest-accounting-repair-no-remote-v1.json`](docs/validation/return-to-form-m3gf-m3gb-source-split-manifest-accounting-repair-no-remote-v1.json)
and session log
[`docs/session-logs/622-mission-3gf-m3gb-source-split-manifest-accounting-repair-no-remote.md`](docs/session-logs/622-mission-3gf-m3gb-source-split-manifest-accounting-repair-no-remote.md).
M3GG must create a local/no-remote/no-training report/sidecar contract-gap
patch plan from existing evidence only, keep Brev default-off, and must not run
any remote command, training, evaluator rerun, evaluator code repair, raw-video
inspection, tensor/crop generation, source/manifest/tensor/vocabulary
mutation, copied-output rewrite, export, promotion, browser activation,
product-runtime change, or claim expansion.

**M3GF activation:** M3GE executor commit `5e7076e` completed the local/
no-remote/no-training M3GB source/split/metadata contract slice and selected
exactly one next action:
`continue_m3gb_source_split_manifest_accounting_repair_no_remote`. It created
the tracked receipt
[`docs/validation/return-to-form-m3ge-m3gb-source-split-metadata-contract-no-remote-v1.json`](docs/validation/return-to-form-m3ge-m3gb-source-split-metadata-contract-no-remote-v1.json)
and session log
[`docs/session-logs/620-mission-3ge-m3gb-source-split-metadata-contract-no-remote.md`](docs/session-logs/620-mission-3ge-m3gb-source-split-metadata-contract-no-remote.md).
M3GF must repair local source/split/manifest accounting by joining existing
M3GB sidecar rows to existing validation/test manifests by `clip_id`, keep
Brev default-off, and must not run any remote command, training, evaluator
rerun, raw-video inspection, tensor/crop generation, source/manifest/tensor/
vocabulary mutation, copied-output rewrite, export, promotion, browser
activation, product-runtime change, or claim expansion.

**M3GE activation:** M3GD executor commit `280b005` completed the local/
no-remote/no-training M3GB error-pattern analysis slice and selected exactly
one next action: `continue_m3gb_source_split_or_metadata_contract_no_remote`.
It created the tracked receipt
[`docs/validation/return-to-form-m3gd-m3gb-error-pattern-analysis-no-remote-v1.json`](docs/validation/return-to-form-m3gd-m3gb-error-pattern-analysis-no-remote-v1.json)
and session log
[`docs/session-logs/618-mission-3gd-m3gb-error-pattern-analysis-no-remote.md`](docs/session-logs/618-mission-3gd-m3gb-error-pattern-analysis-no-remote.md).
M3GE must turn that analysis into one local/no-remote/no-training source/
split/metadata contract from existing evidence only, keep Brev default-off,
and must not run any remote command, training, evaluator rerun, raw-video
inspection, tensor/crop generation, source/manifest/tensor/vocabulary
mutation, export, promotion, browser activation, product-runtime change, or
claim expansion.

**M3GD activation:** M3GC executor commit `623988a` completed the local/
no-remote/no-training M3GB metric-triage slice and selected exactly one next
action: `continue_m3gb_error_pattern_analysis_no_remote`. It created the
tracked receipt
[`docs/validation/return-to-form-m3gc-m3gb-metric-triage-no-remote-v1.json`](docs/validation/return-to-form-m3gc-m3gb-metric-triage-no-remote-v1.json)
and session log
[`docs/session-logs/615-mission-3gc-m3gb-metric-triage-no-remote.md`](docs/session-logs/615-mission-3gc-m3gb-metric-triage-no-remote.md).
M3GD must analyze existing M3GB prediction-sidecar/report error patterns
locally, keep Brev default-off, and must not run any remote command, training,
evaluator rerun, raw-video inspection, tensor/crop generation, export,
promotion, browser activation, product-runtime change, or claim expansion.

**M3GC activation:** M3GB executor commit `1c86487` completed the bounded
retained-worker Brev training/evaluation/copyback slice and selected
`continue_m3gb_metric_triage_no_remote`. It created the tracked receipt
[`docs/validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json`](docs/validation/return-to-form-m3gb-human-approved-bounded-brev-composable-training-v1.json)
and session log
[`docs/session-logs/613-mission-3gb-human-approved-bounded-brev-composable-training.md`](docs/session-logs/613-mission-3gb-human-approved-bounded-brev-composable-training.md).
M3GC must triage the completed M3GB metrics locally, keep Brev default-off, and
must not run any remote command, training, evaluator rerun, export, promotion,
browser activation, product-runtime change, or claim expansion.

**M3GB activation:** M3FZ executor commit `a4d4598` completed the local/
no-spend/no-training fixed region-grid error-pattern contract slice and
observer commit `d4dfe8e` queued M3GA metadata-gap paperwork. The latest
supervising-user instruction supersedes that no-spend paperwork path: get the
pair going again, continue the work needed to make the datasets/training
succeed, and unblock Brev under oversight. M3GB therefore authorizes exactly
one retained-worker, bounded, human-approved region-grid TCN training/
evaluation/copyback attempt with explicit cost controls, process safety,
teardown, and fail-closed claim boundaries. It must not create a worker, run a
broad 75/80/95-label sweep, train Detector 0, import sources, promote/export,
activate browser recognition, or claim ASL correctness.

**M3GA parked:** the M3GA no-spend metadata-gap prompt remains a valid fallback
if Brev/provider safety blocks compute, but it is no longer the active route.

**M3FZ activation:** M3FY executor commit `59e2084` completed the local/
no-spend/no-training fixed region-grid error-analysis slice and selected
`continue_fixed_region_grid_error_pattern_contract_no_spend`. It created the
tracked receipt
[`docs/validation/return-to-form-m3fy-fixed-region-grid-error-analysis-no-spend-v1.json`](docs/validation/return-to-form-m3fy-fixed-region-grid-error-analysis-no-spend-v1.json)
and session log
[`docs/session-logs/608-mission-3fy-fixed-region-grid-error-analysis-no-spend.md`](docs/session-logs/608-mission-3fy-fixed-region-grid-error-analysis-no-spend.md).
M3FZ must turn the M3FY error pattern into one no-spend/no-training contract
for what evidence would discriminate signer/source/crop/temporal/model-bias
explanations. It must not perform the discriminating experiment, train, rerun
M3FW, inspect raw video, generate tensors, mutate artifacts, run Brev, export,
promote, activate browser recognition, or change claims.

**M3FY activation:** M3FX executor commit `2f79034` completed the local/
no-spend/no-training crop/input schema review slice and selected
`continue_fixed_region_grid_error_analysis_no_spend`. It created the tracked
receipt
[`docs/validation/return-to-form-m3fx-crop-input-schema-review-no-spend-v1.json`](docs/validation/return-to-form-m3fx-crop-input-schema-review-no-spend-v1.json)
and session log
[`docs/session-logs/606-mission-3fx-crop-input-schema-review-no-spend.md`](docs/session-logs/606-mission-3fx-crop-input-schema-review-no-spend.md).
M3FY must use existing M3FW per-example predictions and fixed
`rgb_regions_grid_v1` metadata only. It must not rerun training/evaluation,
rerun M3FW, mutate crops/inputs/manifests/tensors/vocabulary/source approvals,
change runtime or claim surfaces, run Brev, export, promote, or activate
browser recognition.

**M3FX activation:** M3FW executor commit `8b2fa04` completed the local/
no-spend architecture/objective sanity slice and selected
`continue_crop_or_input_schema_review_no_spend`. It created the scoped runner
[`scripts/run_m3fw_tiny2_tiny3_architecture_objective_sanity.py`](scripts/run_m3fw_tiny2_tiny3_architecture_objective_sanity.py),
the tracked receipt
[`docs/validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json`](docs/validation/return-to-form-m3fw-tiny2-tiny3-architecture-objective-sanity-v1.json),
and session log
[`docs/session-logs/604-mission-3fw-tiny2-tiny3-architecture-objective-sanity.md`](docs/session-logs/604-mission-3fw-tiny2-tiny3-architecture-objective-sanity.md).
M3FX converts that failed Tiny2 noncollapse proof into one local/no-spend/
no-training crop/input schema review packet. It must not mutate crops, inputs,
manifests, tensors, vocabulary, sources, runtime code, browser assets, or claim
surfaces.

**M3FW activation:** M3FV executor commit `22b0e1a` completed the local/
no-spend/no-training composable ML strategy slice and selected
`continue_architecture_objective_sanity_contract_no_spend`. It created the
tracked contract
[`docs/model/return-to-form-m3fv-tiny2-tiny3-architecture-objective-sanity-contract-v1.json`](docs/model/return-to-form-m3fv-tiny2-tiny3-architecture-objective-sanity-contract-v1.json),
the receipt
[`docs/validation/return-to-form-m3fv-composable-ml-strategy-no-spend-v1.json`](docs/validation/return-to-form-m3fv-composable-ml-strategy-no-spend-v1.json),
and session log
[`docs/session-logs/602-mission-3fv-composable-ml-strategy-no-spend.md`](docs/session-logs/602-mission-3fv-composable-ml-strategy-no-spend.md).
M3FW implements that contract as exactly one local/no-spend Tiny2/Tiny3
architecture/objective sanity proof or records the exact blocker.

**M3FV predecessor activation:** M3FU executor commit `343d539` completed the local/no-spend/
no-training dataset/training root-cause review and selected
`stop_for_human_dataset_or_compute_strategy_review`. Observer commit `f59cdd7`
parked the loop for that strategy decision. The latest human direction is to
keep going on the ML problem, not substitute product polish for ML strategy.
Supervisor activation resolves the human strategy choice by selecting a
composable, falsifiable recovery path: no more broad blind recognizer retries;
the next executor must decide which subproblem should be tested next before
spending GPU.

**M3FO stop resolved by human redirect:** M3FO executor commit `9502a76`
completed the final fail-closed demo evidence package, and observer commit
`d60b4d4` parked the loop for human review. The latest human instruction is the
explicit approval to resume with this M3FP prompt. The M3FO package remains
valid fail-closed evidence; it is not a recognition-readiness claim.

**M3FP result:** the copied ignored Fresh5 artifacts are accounting evidence
only. Validation/test top-1 were both `0.2`, macro-F1 was
`0.06666666666666668`, and validation/test zero-recall labels were `morning`,
`pen`, `thank_you`, and `who`. Browser/model claim surfaces remain
fail-closed.

**M3FQ result:** the static contract
[`docs/model/return-to-form-detector0-strict-gate-crop-normalization-contract.json`](docs/model/return-to-form-detector0-strict-gate-crop-normalization-contract.json)
is diagnostic-only. It pins `manifest_validation_fp05_contact_gate`, contact
threshold `0.20632459223270416`, a 5% validation-frame false-positive cap,
learned right-hand crop use `0.06068840579710145`, isolated-smoke validation
top-1 `0.256`, test top-1 `0.3263157894736842`, and no validation/test
zero-recall labels. This is not Detector 0 product/runtime authority.

**M3FR result:** the tracked local smoke receipt
[`docs/validation/return-to-form-m3fr-detector0-strict-gate-local-smoke-no-brev-v1.json`](docs/validation/return-to-form-m3fr-detector0-strict-gate-local-smoke-no-brev-v1.json)
is diagnostic-only. At the M3FQ contract threshold, validation packet-frame
false positives stayed `0`, true positives were `1/7`, F1 was `0.25`, and
learned right-crop row rate was `0.09090909090909091`. The local packet-frame
microprobe fit train rows but did not create a model artifact, detector tensor
output, recognizer smoke, export, promotion, browser activation, or runtime
Detector 0 authority.

**M3FS result:** the tracked metric-triage receipt
[`docs/validation/return-to-form-m3fs-detector0-strict-gate-metric-triage-no-brev-v1.json`](docs/validation/return-to-form-m3fs-detector0-strict-gate-metric-triage-no-brev-v1.json)
records no artifact/accounting issue, no strict-gate contract or threshold
accounting bug, and no local no-training repair. It classifies packet-frame
sample-size limits, target-schema limits, crop/input representation limits,
model/architecture/training-budget limits, and weak diagnostic evidence without
browser/runtime authority. It selected `continue_openai_or_gpt_pro_research`.

**Observer 597 research result:** the OpenAI API memo
[`artifacts/research/observer-597-m3fs-detector0-strict-gate-strategy/response.md`](artifacts/research/observer-597-m3fs-detector0-strict-gate-strategy/response.md)
recommends `redirect_to_fail_closed_product_polish_no_recognition`: the safest
autonomous next step is fail-closed app/claim hygiene while keeping Detector 0
evidence diagnostic only.

**M3FT parked safety fallback:** M3FT remains a valid fail-closed product/claim
hygiene prompt if the user chooses to prioritize submission polish. It is not
active for this executor turn.

**M3FU result:** the tracked M3FU receipt
[`docs/validation/return-to-form-m3fu-dataset-training-root-cause-no-spend-v1.json`](docs/validation/return-to-form-m3fu-dataset-training-root-cause-no-spend-v1.json)
records `no_single_local_repair_found`. Source, split, tensor, and command
contract issues are not the common failing point. The repeated pattern is weak
held-out transfer or prediction collapse across PopSign, ASL Citizen, Fresh5
region-grid/TCN, and Detector 0 strict-gate evidence.

**M3FV result:** the tracked M3FV contract selects the
`architecture_objective_sanity` lane for ASL Citizen high-signal region-grid
Tiny2 `table`/`hello`, with Tiny3 `black` allowed only after Tiny2 passes. It
requires class-collapse failure controls, signer-disjoint held-out gates, and
one future local/no-spend proof before any broader model decision.

**M3FW result:** the tracked M3FW proof fit the Tiny2 train split but failed
the held-out noncollapse contract. Train accuracy was `1.0`, held-out top-1
was `0.75`, held-out macro-F1 was `0.7333333333333334`, held-out zero-recall
labels were `[]`, and dominant predicted class share was `0.75`, above the
`0.70` limit. The label-shuffle false-progress control did not suspiciously
pass. This is diagnostic only and does not authorize Tiny3, broad training,
promotion, export, browser recognition, Detector 0 runtime authority, or ASL
correctness claims.

**M3FX result:** the tracked M3FX review compared fixed region-grid error
analysis, union/contact-region schema review, full-frame or motion-context
review, first-party/human-label protocol review, and a bounded compute
proposal. It selected `continue_fixed_region_grid_error_analysis_no_spend`
because that next slice can use existing M3FW per-example predictions,
confidence, signer/source records, and tensor paths without source, manifest,
tensor, crop/input code, model, runtime, Brev, or claim-surface mutation.
M3FX rejected schema/input mutation, Detector 0 reruns, Brev, training, and
promotion for the immediate next slice.

**M3FY result:** the tracked M3FY analysis found a confident asymmetric
fixed-grid error pattern: held-out `hello` recall was `1.0`, held-out `table`
recall was `0.5`, and both `table` false negatives were high-confidence
`hello` predictions from signers `P26` and `P39`. Correct `table` rows came
from signers `P21` and `P12`; all held-out signers also had correct `hello`
rows. No repeated source-record or tensor-path cluster was visible, and all
rows shared the same fixed region-grid shape. The receipt classifies signer/
row-order/crop-quality explanations as underpowered or missing evidence rather
than proven causes, and it selected
`continue_fixed_region_grid_error_pattern_contract_no_spend`.

**M3FZ result:** the tracked M3FZ contract records seven plausible explanations
for the fixed-grid residual: signer-conditioned `table` weakness, row-order or
split artifact, fixed-region crop/coverage blind spot, temporal or motion
ambiguity, model/objective confidence pathology, source/label/protocol quality
gap, and insufficient metadata. It keeps all claim surfaces fail-closed,
records approval gates, rejects immediate schema/input/source/compute changes,
and selects `continue_fixed_region_grid_metadata_gap_receipt_no_spend`.

**M3GB result:** the bounded retained-worker Brev slice ran exactly one timed
region-grid TCN training command on CUDA, evaluated the checkpoint, copied back
the output directory, and stopped the worker. Metrics remained weak:
validation top-1 was `0.37037037037037035`, validation macro-F1 was
`0.33209647495361777`, validation zero-recall labels were `black` and
`table`, test top-1 was `0.25`, test macro-F1 was `0.15634920634920638`, and
test zero-recall labels were `black`, `please`, `table`, and `white`. The
evaluator failed top-1, macro-F1, and negative-challenge gates. The final Brev
state was `STOPPED` / `COMPLETED` / `NOT READY` / `HEALTHY`, and all claim
surfaces stayed fail-closed.

**M3GC result:** the tracked M3GC triage receipt records that M3GB remains
diagnostic-only: validation/test top-1, macro-F1, and negative-challenge gates
failed; validation zero-recall labels were `black` and `table`; test
zero-recall labels were `black`, `please`, `table`, and `white`; threshold
calibration provides too little useful coverage; and another remote run or
compute receipt is premature before local per-example accounting. It selected
`continue_m3gb_error_pattern_analysis_no_remote`.

**M3GD result:** the tracked M3GD error-pattern analysis records that M3GB
errors cluster by label, split, and some signer groups without proving a
single root cause. `table` and `black` stayed zero-recall on validation and
test; `please` and `white` fell to zero recall on test; validation errors
overpredicted `uncle` and `hello`; test errors overpredicted `sad`; and
source/split/signer metadata remains underpowered for attribution. It selected
`continue_m3gb_source_split_or_metadata_contract_no_remote`.

**M3GE result:** the tracked M3GE metadata contract records that existing M3GB
validation/test sidecar rows join cleanly to the high-signal region-grid
manifests by `clip_id`, but the sidecar/report are not self-contained for
tensor paths, tensor hashes, full probability vectors, crop or region quality,
motion descriptors, capture-condition metadata, or human label-quality fields.
It classifies sidecar tensor path/hash as a local accounting gap and keeps the
other missing fields approval-gated. It selected
`continue_m3gb_source_split_manifest_accounting_repair_no_remote`.

**M3GF result:** the tracked M3GF manifest accounting repair records that all
55 validation/test M3GB prediction-sidecar rows join to existing manifests by
`clip_id`, with missing joins `0`, extra manifest rows `0`, duplicate
clip/source-record keys `0`, and split/label/signer/source mismatches `0`. The
repair makes existing manifest signer/source/split/license/tensor/crop fields
self-contained for review, while full probability vectors/logits, crop
quality, motion descriptors, source capture conditions, and independent human
label-quality fields remain missing or approval-gated. It selected
`continue_m3gb_report_sidecar_contract_gap_patch_plan_no_remote`.

**M3GG result:** the tracked M3GG report/sidecar contract-gap patch plan
inventories the current M3GB `validation-report.json` and
`prediction-sidecar.json`, confirms copied-back output hashes, records that all
55 validation/test sidecar rows already join to existing manifests by
`clip_id`, and identifies the smallest future repair as an evaluator-sidecar
contract change centered on `scripts/evaluate_rawframe_model.py`. It did not
perform that repair or regenerate outputs. It selected
`continue_m3gb_evaluator_sidecar_contract_repair_no_remote`.

**M3GH envelope:** route is local Mac only and max additional spend is `$0`.
The next executor must implement one local/no-remote/no-training evaluator
sidecar contract repair from existing M3GG/M3GF/M3GE/M3GD/M3GC/M3GB evidence
and select exactly one allowed next action. It may edit only local
evaluator/report contract surfaces needed for future sidecar rows to carry
stable row IDs, manifest/tensor path/hash references, full probability
diagnostics already available from evaluator outputs, true-label probability,
and report-to-sidecar references. It must validate statically and must not run
Brev lifecycle/remote commands, rerun training/evaluation, run an evaluator,
run browser/product smoke, inspect raw video, generate tensors/crops, mutate
source/manifest/tensor/vocabulary artifacts, rewrite or regenerate copied-back
output sidecars/reports, export, promote, activate browser recognition, mutate
product runtime, or expand claims. Any future compute, evaluator rerun, output
regeneration, export, promotion, or activation proposal must be only a receipt
proposal requiring fresh human approval before lifecycle commands.

**Previous observer stop:** Observer 584 saved the research memo under
[`artifacts/research/observer-584-m3fm-popsign-label-ladder-strategy/`](artifacts/research/observer-584-m3fm-popsign-label-ladder-strategy/).
The API memo recommended `stop_for_human_model_strategy_review` for ML work:
current local model evidence does not justify more autonomous training-style,
compute, source, manifest, crop, architecture, evaluator-rerun, export,
promotion, browser activation, or claim-expansion work. M3FN does not override
that ML stop; it redirects to deadline fail-closed product success.

**Current project truth:**

- Browser recognition currently remains fail-closed: `web/public/model/model-card.json`
  is `status: "not_trained"` and
  `docs/model/active-vocabulary-claim.json` has no active labels. This must
  stay true unless a later slice passes the predeclared model gates and runs the
  existing export/promote/audit chain.
- M3EM proved the Tiny2 `table`/`hello` train split can be fit but held-out
  validation collapsed to `hello` at chance. That blocks thresholding the
  collapsed Tiny2 recognizer and argues against blind TCN retries.
- M3EN's inspected objectness packet remains table-confounded for general
  objectness. M3EO reconciled that blocker with the expanded/union lineage:
  independent-hand/general objectness is not supportable now; fixed-region
  evidence is diagnostic accounting only; the current supportable Detector 0
  path is target-specific `table_two_hand_union_or_contact_region`, still not a
  browser/product/final claim.
- M3EQ proved the retained L40S worker is usable for a bounded training smoke
  after one sync, but it did not run training, write a checkpoint, evaluate,
  export, promote, activate browser recognition, or change product runtime.
- M3ER proved the remote CUDA/sync surface again, then stopped at a local
  output-dir contract mismatch before any timed training command. M3ER wrote no
  checkpoint, evaluation, copyback, export, promotion, browser activation, or
  product-runtime change.
- M3ES repaired that local output-dir contract and proved the intended M3ER
  dry-run locally without Brev spend, remote execution, output artifact,
  checkpoint, evaluation, promotion, browser activation, or product-runtime
  change.
- M3ET proved the retained-worker CUDA/sync/remote dry-run surface after M3ES,
  but did not train. The exact blocker is
  `timed_training_command_includes_dry_run_only_input_contract_flag`: the
  dry-run command correctly used `--require-input-contract`, while the timed
  training command incorrectly included that dry-run-only audit flag.
- M3EU proved the local command fix: future dry-run/check-files audits keep
  `--dry-run --require-input-contract rgb_regions_grid_v1`, while future
  non-dry-run timed training commands omit `--require-input-contract`.
- M3EV proved the remote command path can train and evaluate once on the
  retained L40S worker, but the resulting artifact is not promotable and is not
  browser/product/final evidence. The copied files under
  `output/m3er-high-signal-region-grid-tcn-brev/` are local ignored artifacts
  for accounting only.
- M3EW verified those copied artifacts and hashes, confirmed fail-closed claim
  surfaces stayed unchanged, and found no local no-training contract repair for
  the seven-label region-grid TCN path.
- A supervisor preflight on 2026-05-28 proved the 25-label ASL Citizen lesson
  milestone dry-run/check-files command passes with
  `--lesson-milestone --architecture motion_2d_temporal_cnn`.
- M3EY executor commit `fa55035` ran exactly one bounded retained-worker ASL
  Citizen 25-label lesson-model train/evaluate/copyback slice after supervisor
  commit `0bbfba6` repaired the output-dir contract. It did not export,
  promote, activate browser recognition, change product runtime, import
  sources, weaken gates, push, or use pretrained/generated-label paths. Final
  worker state was verified `STOPPED` / `COMPLETED` / `NOT READY` / `HEALTHY`.
- M3EY metrics failed promotion gates: validation top-1
  `0.19148936170212766`, validation macro-F1 `0.1723174603174603`, test top-1
  `0.17`, test macro-F1 `0.15166666666666667`, diagnostic negative
  false-pass rate `0.4`, and 15 zero-recall labels on validation and test.
  M3EY selected `continue_fail_closed_interactive_product_hardening`.
- M3EY artifact-status cleanup commit `9f8d656` tracked the copied
  `validation-report.json` and `prediction-sidecar.json` as small JSON
  evidence artifacts and cleared `unstaged_copied_artifacts`. The binary
  checkpoint remains ignored by `.gitignore`.
- M3EZ executor commit `153ef3f` changed the practice UI no-model ready action
  from a generic submission phrase to `Save practice`, kept the trained-checker
  path as `Check attempt`, wrote the M3EZ receipt/session log, and preserved
  `not_trained` / empty-active-vocabulary claim surfaces.
- M3FA executor commit `1db4938` updated the existing Playwright camera smoke
  and audit to validate the fail-closed browser flow: `Save practice` visible,
  stale `Submit attempt` absent, `Check attempt` absent while no trained
  checker exists, fail-closed hint visible, and practice history updated.
  It selected `continue_popsign_source_register_manifest_repair`.
- M3FB executor commit `eadfe34` refreshed the PopSign diagnostic
  label-ladder manifest/source-register binding. The tracked receipt
  [`docs/validation/return-to-form-m3fb-popsign-source-register-manifest-repair-v1.json`](docs/validation/return-to-form-m3fb-popsign-source-register-manifest-repair-v1.json)
  records that all 15 local diagnostic label-ladder manifests now bind to the
  current source-register hash
  `b02c73fce978b348166df54080541851612445ecd9d01e83bed0a9538620b8e8`, with
  stale hash matches reduced to zero. It did not train, evaluate, export,
  promote, activate browser recognition, edit the source register, import
  source/media, mutate tensors/vocabulary, run Brev, push, or claim readiness.
- M3FC executor commit `3905e5c` ran one local/no-Brev/no-training
  dry-run/check-files attempt against the refreshed 095-label PopSign
  diagnostic ladder. The receipt
  [`docs/validation/return-to-form-m3fc-popsign-label-ladder-local-dry-run-no-training-v1.json`](docs/validation/return-to-form-m3fc-popsign-label-ladder-local-dry-run-no-training-v1.json)
  records exit `0`, `training_status: "dry_run_only"`, no output directory,
  unchanged fail-closed claim surfaces, and that the prior stale-hash blocker
  is cleared from the local dry-run path. It also records a remaining blocker:
  the only current no-training path loads the ladder with
  `--allow-small-label-set`, which is diagnostic-only and not product-grade or
  compute/training authorization.
- M3FD executor commit `f01feb0` repaired that local/no-training contract by
  adding `--popsign-label-ladder-diagnostic` to
  `scripts/train_rawframe_model.py`. The receipt
  [`docs/validation/return-to-form-m3fd-popsign-label-ladder-training-mode-contract-repair-no-training-v1.json`](docs/validation/return-to-form-m3fd-popsign-label-ladder-training-mode-contract-repair-no-training-v1.json)
  records that the 095-label PopSign ladder now validates with
  `--dry-run --check-files --popsign-label-ladder-diagnostic` and without
  `--allow-small-label-set`, creates no output directory, keeps
  `pretrained_components: []`, and rejects combining the new flag with
  `--allow-small-label-set`. No Brev command, training, evaluation rerun,
  export, promotion, browser activation, source/data/manifest/tensor/
  vocabulary mutation, push, readiness claim, ASL correctness claim, or
  pretrained/generated-label path occurred.
- M3FE executor commit `9a1cda8` wrote the local/no-spend/no-training compute
  receipt
  [`docs/validation/return-to-form-m3fe-popsign-label-ladder-compute-receipt-no-training-v1.json`](docs/validation/return-to-form-m3fe-popsign-label-ladder-compute-receipt-no-training-v1.json).
  It records read-only Brev state `STOPPED` / `COMPLETED` / `NOT READY` /
  `HEALTHY`, listed `l40s-48gb.1x` price `$1.74/hour`, a fresh 095-label
  diagnostic dry-run, and a blocker: no future fitting route is compatible
  today because `--popsign-label-ladder-diagnostic` requires `--dry-run` and
  `scripts/evaluate_rawframe_model.py` has no matching PopSign label-ladder
  evidence mode. It selected
  `continue_popsign_label_ladder_command_contract_fix_no_training`.
- M3FF executor commit `bb99378` repaired the local/no-Brev/no-training
  PopSign label-ladder command contract. The receipt
  [`docs/validation/return-to-form-m3ff-popsign-label-ladder-command-contract-fix-no-training-v1.json`](docs/validation/return-to-form-m3ff-popsign-label-ladder-command-contract-fix-no-training-v1.json)
  records that `--popsign-label-ladder-training-smoke` validates the 095-label
  PopSign ladder with `--dry-run --check-files`, emits evidence mode
  `popsign_label_ladder_training_smoke`, creates no output directory, rejects
  `--allow-small-label-set`, rejects combining with
  `--popsign-label-ladder-diagnostic`, and supports only `025-labels`,
  `050-labels`, and `095-labels`. It did not train, evaluate, export,
  promote, activate browser recognition, run Brev, mutate source/data/
  manifest/tensor/vocabulary, push, or claim readiness. It selected
  `continue_popsign_label_ladder_evaluation_contract_fix_no_training`.
- M3FG executor commit `8323825` repaired the local/no-Brev/no-training
  PopSign label-ladder evaluation contract. The receipt
  [`docs/validation/return-to-form-m3fg-popsign-label-ladder-evaluation-contract-fix-no-training-v1.json`](docs/validation/return-to-form-m3fg-popsign-label-ladder-evaluation-contract-fix-no-training-v1.json)
  records that `scripts/evaluate_rawframe_model.py` now lists
  `--popsign-label-ladder-training-smoke`, maps it to evidence mode
  `popsign_label_ladder_training_smoke`, validates the 025/050/095 label
  ladder without `--allow-smoke-eval`, and records future report finality as
  non-final/non-lesson/non-product/non-browser/non-promotion evidence. The
  095-label no-checkpoint evaluator probe exits `2` at the expected missing
  checkpoint and creates no `validation-report.json` or
  `calibrated-provenance.json`. It did not train, run completed checkpoint
  evaluation, export, promote, activate browser recognition, run Brev, mutate
  source/data/manifest/tensor/vocabulary, push, or claim readiness. It selected
  `continue_popsign_label_ladder_compute_receipt_refresh_after_evaluation_contract_fix_no_training`.
- M3FH executor commit `c10467b` completed the local/read-only/no-spend/
  no-training compute receipt refresh. The receipt
  [`docs/validation/return-to-form-m3fh-popsign-label-ladder-compute-receipt-refresh-after-evaluation-contract-fix-no-training-v1.json`](docs/validation/return-to-form-m3fh-popsign-label-ladder-compute-receipt-refresh-after-evaluation-contract-fix-no-training-v1.json)
  records command/evaluator compatibility for a future bounded 095-label
  PopSign label-ladder fitting attempt, current Brev state and price, budget
  caps, kill conditions, expected metric signal, output/copyback/default-off
  plan, duplicate-worker avoidance, and unchanged fail-closed claim surfaces.
  It explicitly records that no current human approval exists for non-dry-run
  fitting or Brev spend, that the receipt alone is not run authorization, and
  selected `stop_for_human_training_budget_approval`.
- M3FI executor commit `da52ecd` completed one local/no-spend bounded fitting
  sanity attempt under the human-authorized envelope. The receipt
  [`docs/validation/return-to-form-m3fi-popsign-label-ladder-local-fitting-sanity-after-approval-v1.json`](docs/validation/return-to-form-m3fi-popsign-label-ladder-local-fitting-sanity-after-approval-v1.json)
  records that the fitting command ran once, completed in 892 seconds, wrote
  the expected checkpoint and training provenance, and preserved fail-closed
  claim surfaces. The one allowed evaluator command ran once and failed before
  report generation because the current 095-label train manifest is missing
  `vocabulary_review` evidence. No Brev lifecycle/spend, remote command,
  export, promotion, browser activation, source/data/manifest/tensor/
  vocabulary mutation, raw learner upload, push, or pretrained/generated-label
  path occurred.
- M3FJ executor commit `ec8e412` completed one local/no-spend/no-training
  diagnosis of the M3FI result. The receipt
  [`docs/validation/return-to-form-m3fj-popsign-label-ladder-result-diagnosis-no-training-v1.json`](docs/validation/return-to-form-m3fj-popsign-label-ladder-result-diagnosis-no-training-v1.json)
  records that the M3FI artifacts still match their receipt hashes, all 15
  PopSign label-ladder manifests pass source-register/finality checks while
  lacking `vocabulary_review`, and the evaluator failure comes from a
  post-checkpoint provenance/current-manifest evidence gate that is stricter
  than the training-side label-ladder diagnostic manifest policy. The one-epoch
  M3FI metrics remain weak diagnostic signal only: train accuracy `0.015625`
  and validation accuracy `0.0`, with no held-out top-1/macro-F1 report because
  the evaluator failed before report generation. M3FJ did not train, fit, rerun
  evaluation, mutate manifests or tensors, run Brev, export, promote, activate
  browser recognition, push, or claim readiness.
- M3FK executor commit `fc5d94e` completed one local/no-spend/no-training
  evaluator evidence-contract repair. The receipt
  [`docs/validation/return-to-form-m3fk-popsign-label-ladder-evaluation-manifest-evidence-contract-repair-no-training-v1.json`](docs/validation/return-to-form-m3fk-popsign-label-ladder-evaluation-manifest-evidence-contract-repair-no-training-v1.json)
  records that only `scripts/evaluate_rawframe_model.py::validate_finality`
  changed. Missing `vocabulary_review` remains a hard error for final, lesson,
  reduced-real-data, region-grid, PopSign fresh5, and controlled-clip-heldout
  modes; for `--popsign-label-ladder-training-smoke` only, it becomes a
  diagnostic/non-final limitation reason. M3FK proved this with a direct
  no-report guard probe and did not train, fit, rerun evaluation, write reports,
  run Brev, mutate manifests or tensors, export, promote, activate browser
  recognition, push, or claim readiness.
- M3FL executor commit `4cecedd` completed one local/no-spend/no-training
  post-repair evaluator probe. The receipt
  [`docs/validation/return-to-form-m3fl-popsign-label-ladder-post-repair-evaluation-probe-no-training-v1.json`](docs/validation/return-to-form-m3fl-popsign-label-ladder-post-repair-evaluation-probe-no-training-v1.json)
  records that the existing M3FI checkpoint/provenance hashes matched
  expectations, the output report path was absent before the run, the one
  allowed evaluator probe passed the previous `vocabulary_review` gate, and
  `validation-report.json` was created under the scoped ignored output path.
  The direct evaluator exit status was not captured because a zsh metadata
  wrapper assigned to read-only `status` after report/stdout creation, and the
  evaluator was not rerun. Metrics are diagnostic-only and weak: validation
  top-1 `0.010105263157894737`, validation macro-F1
  `0.0006163321188634017`, test top-1 `0.012742382271468145`, test macro-F1
  `0.0017700006858916142`, with 92 validation and 91 test zero-recall labels.
  Claim surfaces stayed fail-closed.
- PopSign 25/50/95 has better scale than the earlier failed Tiny/Tier-0 lanes,
  and it now has a first-class label-ladder diagnostic no-training validation
  path, a first-class bounded training/sanity command contract, and a
  first-class evaluator invocation contract. The refreshed compute receipt is
  complete, M3FI proved the bounded local fitting command can write artifacts,
  M3FJ identified the evaluator provenance/current-manifest evidence-contract
  blocker, and M3FK repaired that blocker for label-ladder diagnostic evidence
  only.
- `/Users/kelly/Developer/asl-pilot-detector0-win` contains useful Detector 0
  diagnostic evidence, but it is not yet main-branch runtime/product authority.

**First reviewable slice:**

Follow the active M3GU prompt. First prove the reduced4-specific
region-preserving train/eval guard. If and only if that guard passes, run
exactly one capped local/no-Brev diagnostic reduced4 smoke and at most one
local diagnostic evaluation/report. Required rhythm: local audits and
claim-surface checks, read-only `brev ls` default-off verification, JSON
validation of M3GT/M3GS/M3GR/M3GQ receipts and reduced4 manifests, optional
hash validation of already-present ignored M3GR output JSON, minimal scoped
guard/command-surface/test changes if needed, guard preflight proof, ignored
output namespace guard, tracked receipt, numbered session log, and a scoped
commit. Do not run Brev lifecycle/remote commands, a second training run,
second seed, another micro-overfit, evaluator reruns beyond the one diagnostic
report, browser/product smoke, raw-video inspection, source import,
source-rights mutation, research calls, export, promotion, browser activation,
push, or claim readiness.

## exit condition for Mission 3GU

All applicable items must be true before this mission can close:

1. `GOAL.md` points at
   [`docs/model/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-goal-loop-prompt.md`](docs/model/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-goal-loop-prompt.md)
   and names Mission 3GU.
2. Required audits, local JSON validations, read-only Brev default-off
   verification, and fail-closed claim-surface checks pass or record exact
   blockers.
3. A tracked receipt exists at
   `docs/validation/return-to-form-m3gu-reduced4-local-training-smoke-no-brev-v1.json`
   or the session log records the exact blocker that prevented it.
4. The receipt records the reduced4 guard proof before fitting, or the exact
   guard blocker if no fitting occurred. If fitting occurs, it records exactly
   one local/no-Brev smoke command, caps, seed, runtime, output namespace,
   training metrics, at most one diagnostic evaluation/report, unsupported-
   claim proof, forbidden-action proof, and exactly one next action.
5. A numbered executor session log exists at
   `docs/session-logs/657-mission-3gu-reduced4-local-training-smoke-no-brev.md`
   or the session log records the exact blocker that prevented it.
6. The retained worker remains stopped/default-off; no Brev lifecycle or remote
   command is run.
7. `web/public/model/model-card.json` remains `status: "not_trained"` and
   `docs/model/active-vocabulary-claim.json` keeps `activeLabels: []`; the
   Detector 0 card remains `status: "not_trained"`, has promotion state
   `research_only`, and has `browser_artifact: null`.
8. No Brev lifecycle or remote command, fitting without the reduced4 guard,
   second seed, rerun-for-metrics, another micro-overfit, evaluator rerun
   beyond the single diagnostic report, browser/product smoke, duplicate
   worker, broad Fresh5/25/75/95-label run, Detector 0 training, source import,
   source-approval mutation, raw-video inspection, raw learner upload, source/
   manifest/tensor/vocabulary mutation beyond the scoped guard route, copied-
   output rewrite or regeneration, research API call, final-gate weakening,
   export, promotion, browser activation, push, or pretrained/generated-label
   path occurs.
9. A numbered session log records commands, evidence inspected, changed files,
   validations, reduced4 guard proof, smoke/eval findings or exact blockers,
   Brev default-off state, and exactly one next action.

## recent completed mission (Mission 3FL - PopSign label-ladder post-repair evaluation probe no training)

M3FL executor commit `4cecedd` completed one local/no-spend/no-training
post-repair evaluator probe and wrote
[`docs/validation/return-to-form-m3fl-popsign-label-ladder-post-repair-evaluation-probe-no-training-v1.json`](docs/validation/return-to-form-m3fl-popsign-label-ladder-post-repair-evaluation-probe-no-training-v1.json).
The single allowed evaluator probe passed the prior `vocabulary_review` gate,
wrote scoped ignored `validation-report.json`, did not write
`calibrated-provenance.json`, and recorded weak diagnostic-only metrics. The
receipt also records the direct evaluator exit-status capture caveat caused by
a zsh wrapper assigning to read-only `status` after report/stdout creation; the
evaluator was not rerun. Claim surfaces stayed `not_trained` / empty active
vocabulary, and no training/fitting/second evaluator attempt/Brev lifecycle or
spend/source or manifest mutation/export/promotion/browser activation/push/
readiness claim occurred. It selected
`continue_popsign_label_ladder_metric_triage_no_training`.

## recent completed mission (Mission 3FK - PopSign label-ladder evaluation manifest evidence contract repair no training)

M3FK executor commit `fc5d94e` completed one local/no-spend/no-training
source-contract repair and wrote
[`docs/validation/return-to-form-m3fk-popsign-label-ladder-evaluation-manifest-evidence-contract-repair-no-training-v1.json`](docs/validation/return-to-form-m3fk-popsign-label-ladder-evaluation-manifest-evidence-contract-repair-no-training-v1.json).
The repair changed only `scripts/evaluate_rawframe_model.py::validate_finality`:
missing `vocabulary_review` remains a hard error for final, lesson,
reduced-real-data, region-grid, PopSign fresh5, and controlled-clip-heldout
modes, while `--popsign-label-ladder-training-smoke` records the same missing
evidence as a diagnostic/non-final limitation reason. M3FK proved this with a
direct no-report guard probe, preserved fail-closed claim surfaces, and
selected `continue_popsign_label_ladder_post_repair_evaluation_probe_no_training`.

## recent completed mission (Mission 3FJ - PopSign label-ladder result diagnosis no training)

M3FJ executor commit `ec8e412` completed one local/no-spend/no-training
diagnosis of the M3FI PopSign label-ladder fitting/evaluation result and wrote
[`docs/validation/return-to-form-m3fj-popsign-label-ladder-result-diagnosis-no-training-v1.json`](docs/validation/return-to-form-m3fj-popsign-label-ladder-result-diagnosis-no-training-v1.json).
The diagnosis verified the ignored M3FI checkpoint and provenance hashes,
proved all 15 label-ladder manifests lack `vocabulary_review` while still
passing source-register/finality checks, and classified the evaluator failure
as an evidence-contract mismatch between the training-side diagnostic manifest
policy and the evaluator's later provenance/current-manifest gate. The
one-epoch fitting metrics remain weak diagnostic signal only and do not justify
another fitting run, Brev compute, export, promotion, browser activation, or
readiness claims. It selected
`continue_popsign_label_ladder_evaluation_manifest_evidence_contract_repair_no_training`.

## recent completed mission (Mission 3FI - PopSign label-ladder local fitting sanity after approval)

M3FI executor commit `da52ecd` completed the single approved local Mac `$0`
fitting sanity attempt and wrote
[`docs/validation/return-to-form-m3fi-popsign-label-ladder-local-fitting-sanity-after-approval-v1.json`](docs/validation/return-to-form-m3fi-popsign-label-ladder-local-fitting-sanity-after-approval-v1.json).
The bounded fitting command ran once, completed in 892 seconds, and wrote the
ignored checkpoint and training-provenance artifacts under
`output/m3ff-popsign-label-ladder-local-sanity/`. The matching local evaluator
ran once and failed before report generation because the current 095-label
train manifest lacks `vocabulary_review` evidence. Claim surfaces remained
fail-closed, and no Brev lifecycle/spend, remote command, source/data/
manifest/tensor/vocabulary mutation, export, promotion, browser activation,
push, readiness claim, ASL correctness claim, or pretrained/generated-label
path occurred.

## recent completed mission (Mission 3FC - PopSign label-ladder local dry-run no training)

This is historical context for the current M3FD PopSign label-ladder contract
repair mission.

**Historical per-milestone prompt:** [`docs/model/return-to-form-m3fc-popsign-label-ladder-local-dry-run-no-training-goal-loop-prompt.md`](docs/model/return-to-form-m3fc-popsign-label-ladder-local-dry-run-no-training-goal-loop-prompt.md).

**Completion:** M3FC executor commit `3905e5c` completed one local/no-Brev/
no-training dry-run/check-files slice against the refreshed 095-label PopSign
diagnostic ladder. The receipt:
[`docs/validation/return-to-form-m3fc-popsign-label-ladder-local-dry-run-no-training-v1.json`](docs/validation/return-to-form-m3fc-popsign-label-ladder-local-dry-run-no-training-v1.json)
records current source-register hash
`b02c73fce978b348166df54080541851612445ecd9d01e83bed0a9538620b8e8`,
15 label-ladder manifests matching that hash, zero stale-hash matches, a
single dry-run/check-files attempt with exit `0`, `training_status:
"dry_run_only"`, `pretrained_components: []`, and no output directory created.
It also records that the dry-run depended on `--allow-small-label-set`, whose
help text limits it to diagnostic/synthetic wiring tests, so the next action is
`continue_popsign_label_ladder_training_mode_contract_repair_no_training`.
Fail-closed claim surfaces stayed `not_trained` / empty active vocabulary. No
Brev command, training, local fitting, evaluation rerun, threshold tuning,
export, promotion, browser recognition activation, source-register edit,
source/media import, manifest write/mutation, tensor/vocabulary/packet
mutation, package/dependency mutation, raw learner upload, worker action, push,
or pretrained/generated-label path occurred.

## recent completed mission (Mission 3FB - PopSign source-register manifest repair)

This is historical context for the current M3FD PopSign label-ladder contract
mission.

**Historical per-milestone prompt:** [`docs/model/return-to-form-m3fb-popsign-source-register-manifest-repair-goal-loop-prompt.md`](docs/model/return-to-form-m3fb-popsign-source-register-manifest-repair-goal-loop-prompt.md).

**Completion:** M3FB executor commit `eadfe34` completed one local/no-Brev/
no-training source-register manifest repair slice. The receipt:
[`docs/validation/return-to-form-m3fb-popsign-source-register-manifest-repair-v1.json`](docs/validation/return-to-form-m3fb-popsign-source-register-manifest-repair-v1.json)
records current source-register hash
`b02c73fce978b348166df54080541851612445ecd9d01e83bed0a9538620b8e8`,
stale manifest hash
`692bda5f3f891462ab066539c4bcb8a0cc55a6358ed03972299b8742c6515b1f`,
15 refreshed diagnostic label-ladder manifests matching the current hash, and
zero stale-hash matches after repair. Fail-closed claim surfaces stayed
`not_trained` / empty active vocabulary, and the session selected
`continue_popsign_label_ladder_local_dry_run_no_training`. No Brev command,
training, evaluation rerun, threshold tuning, export, promotion, browser
recognition activation, source-register edit, source/media import, tensor/
vocabulary/packet mutation, raw learner upload, push, or pretrained/generated-
label path occurred.

## recent completed mission (Mission 3FA - Product browser validation no recognition)

This is historical context for the current M3FC PopSign label-ladder dry-run
mission.

**Historical per-milestone prompt:** [`docs/model/return-to-form-m3fa-product-browser-validation-no-recognition-goal-loop-prompt.md`](docs/model/return-to-form-m3fa-product-browser-validation-no-recognition-goal-loop-prompt.md).

**Completion:** M3FA executor commit `1db4938` completed one local/no-Brev
browser-validation slice. The updated existing Playwright camera smoke proved
the no-model practice flow: `Save practice` visible, stale `Submit attempt`
absent, `Check attempt` absent while no trained checker exists, fail-closed
hint visible, and practice history updated. The receipt:
[`docs/validation/return-to-form-m3fa-product-browser-validation-no-recognition-v1.json`](docs/validation/return-to-form-m3fa-product-browser-validation-no-recognition-v1.json)
records unchanged fail-closed claim surfaces and selected
`continue_popsign_source_register_manifest_repair`. No Brev command, training,
evaluation rerun, export, promotion, browser recognition activation,
source/data mutation, raw learner upload, push, or pretrained/generated-label
path occurred.

## recent completed mission (Mission 3EZ - Fail-closed interactive product hardening)

This is historical context for the current M3FB PopSign manifest-repair
mission.

**Historical per-milestone prompt:** [`docs/model/return-to-form-m3ez-fail-closed-interactive-product-hardening-goal-loop-prompt.md`](docs/model/return-to-form-m3ez-fail-closed-interactive-product-hardening-goal-loop-prompt.md).

**Completion:** M3EZ executor commit `153ef3f` completed one local/no-Brev
practice UI hardening slice. The camera-ready no-model action now says
`Save practice` rather than a generic submission phrase, while a future trained
active checker path says `Check attempt`. The receipt:
[`docs/validation/return-to-form-m3ez-fail-closed-interactive-product-hardening-v1.json`](docs/validation/return-to-form-m3ez-fail-closed-interactive-product-hardening-v1.json)
records unchanged fail-closed claim surfaces and selected
`continue_product_browser_validation_no_recognition`. No Brev command,
training, evaluation rerun, export, promotion, browser recognition activation,
source/data mutation, raw learner upload, push, or pretrained/generated-label
path occurred.

## recent completed mission (Mission 3EY - Overnight Brev lesson model completion)

This is historical context for the current M3FA browser-validation mission.

**Historical per-milestone prompt:** [`docs/model/return-to-form-m3ey-overnight-brev-lesson-model-completion-goal-loop-prompt.md`](docs/model/return-to-form-m3ey-overnight-brev-lesson-model-completion-goal-loop-prompt.md).

**Completion:** M3EY executor commit `fa55035` completed one bounded retained
L40S train/evaluate/copyback slice after supervisor commit `0bbfba6` repaired
the output-dir command contract. The trained model failed all promotion gates
except nonzero threshold coverage and no-pretrained/claim-surface checks:
validation top-1 `0.19148936170212766`, validation macro-F1
`0.1723174603174603`, test top-1 `0.17`, test macro-F1
`0.15166666666666667`, diagnostic negative false-pass rate `0.4`, and 15
zero-recall labels on validation and test. M3EY cleanup commit `9f8d656`
tracked copied JSON sidecars and cleared the dirty artifact state. Browser
recognition remains fail-closed; no export, promotion, browser activation,
product-readiness claim, source/data mutation, push, or pretrained/generated
label path occurred.

## recent completed mission (Mission 3EW - M3EV metric triage no remote)

This is historical context for the current M3EX downscope-contract mission.

**Historical per-milestone prompt:** [`docs/model/return-to-form-m3ew-m3ev-metric-triage-no-remote-goal-loop-prompt.md`](docs/model/return-to-form-m3ew-m3ev-metric-triage-no-remote-goal-loop-prompt.md).

**Completion:** M3EW executor commit `78b82a9` wrote
`docs/validation/return-to-form-m3ew-m3ev-metric-triage-no-remote-v1.json`
and selected `continue_openai_or_gpt_pro_research`. It verified the ignored
M3EV copied artifacts and hashes, preserved fail-closed claim surfaces, and
classified the blocker as repeated weak learnability without a local contract
repair. It found no source-code, evaluation-contract, or input-contract repair
and explicitly judged another training-style slice unjustified without research
or human strategy review. No Brev command, training, evaluation rerun, export,
promotion, browser activation, product runtime mutation, source/data/dependency
mutation, worker action, push, or pretrained/generated-label path occurred.

## recent completed mission (Mission 3EV - Bounded Brev TCN training smoke after M3EU command fix)

This is historical context for the current M3EX downscope-contract mission.

**Historical per-milestone prompt:** [`docs/model/return-to-form-m3ev-bounded-brev-tcn-training-smoke-after-m3eu-command-fix-goal-loop-prompt.md`](docs/model/return-to-form-m3ev-bounded-brev-tcn-training-smoke-after-m3eu-command-fix-goal-loop-prompt.md).

**Completion:** M3EV executor commit `4bffeb8` wrote
`docs/validation/return-to-form-m3ev-bounded-brev-tcn-training-smoke-after-m3eu-command-fix-v1.json`
and selected `continue_m3ev_metric_triage_no_remote`. It started only the
retained `asl-pilot-m3eh-l40s-001` worker, proved the L40S/CUDA surface, synced
once, verified remote hashes, passed the remote dry-run with
`--dry-run --require-input-contract rgb_regions_grid_v1`, ran exactly one timed
training command without `--require-input-contract`, evaluated once, copied back
the scoped output directory, and verified final worker state as `STOPPED` /
`COMPLETED` / `NOT READY` / `HEALTHY`. The model failed gates and is not
promotable: validation top-1 `0.2222222222222222`, validation macro-F1
`0.13796992481203008`, test top-1 `0.17857142857142858`, test macro-F1
`0.11591836734693879`, prediction concentration on `white`, and multiple
zero-recall labels. No second training command, source/data/dependency
mutation, export, promotion, browser activation, product runtime mutation,
worker creation/delete/reset, push, or pretrained/generated-label path occurred.

## recent completed mission (Mission 3EU - Local TCN training-command contract diagnosis)

This is historical context for the current M3EX downscope-contract mission.

**Historical per-milestone prompt:** [`docs/model/return-to-form-m3eu-local-tcn-training-command-contract-diagnosis-goal-loop-prompt.md`](docs/model/return-to-form-m3eu-local-tcn-training-command-contract-diagnosis-goal-loop-prompt.md).

**Completion:** M3EU executor commit `ea6ba11` wrote
`docs/validation/return-to-form-m3eu-local-tcn-training-command-contract-diagnosis-v1.json`
and selected `continue_bounded_brev_tcn_training_smoke_after_m3eu_command_fix`.
It inspected `--require-input-contract`, confirmed the source guard is
correctly dry-run/check-files-only, proved the M3ET dry-run shape with the
input-contract audit flag, proved the timed-command shape without that flag in
dry-run form, preserved fail-closed claim surfaces, and verified the retained
worker read-only state as `STOPPED` / `COMPLETED` / `NOT READY` / `HEALTHY`.
No Brev start/exec/sync/copy, remote work, non-dry-run local training,
checkpoint, evaluation, copyback, source/data/dependency mutation, export,
promotion, browser activation, product runtime mutation, push, worker
creation/delete/reset, or pretrained/generated-label path occurred.

## recent completed/blocked mission (Mission 3ET - Bounded Brev TCN training smoke after M3ES contract fix)

This is historical context for the current M3EX downscope-contract mission.

**Historical per-milestone prompt:** [`docs/model/return-to-form-m3et-bounded-brev-tcn-training-smoke-after-m3es-contract-fix-goal-loop-prompt.md`](docs/model/return-to-form-m3et-bounded-brev-tcn-training-smoke-after-m3es-contract-fix-goal-loop-prompt.md).

**Completion/blocker:** M3ET executor commit `45775cf` wrote
`docs/validation/return-to-form-m3et-bounded-brev-tcn-training-smoke-after-m3es-contract-fix-v1.json`
and selected `continue_local_tcn_failure_diagnosis_after_m3et`. It started only
the retained `asl-pilot-m3eh-l40s-001` worker, proved the L40S/CUDA surface,
synced once, verified remote hashes, and ran the required remote dry-run once.
The dry-run passed for the intended M3ER output namespace and
`rgb_regions_grid_v1`. The single timed training command then failed before
training because it included `--require-input-contract`, which is a no-training
dry-run audit flag and requires `--dry-run`. No second training command,
retry, checkpoint, evaluation, copyback, source/data/dependency mutation,
export, promotion, browser activation, product runtime mutation, push, worker
creation/delete/reset, or pretrained/generated-label path occurred. The worker
was stopped and verified `STOPPED` / `COMPLETED` / `NOT READY` / `HEALTHY`.

## recent completed mission (Mission 3ES - Local TCN output-dir contract diagnosis)

This is historical context for the current M3EX downscope-contract mission.

**Historical per-milestone prompt:** [`docs/model/return-to-form-m3es-local-tcn-output-dir-contract-diagnosis-goal-loop-prompt.md`](docs/model/return-to-form-m3es-local-tcn-output-dir-contract-diagnosis-goal-loop-prompt.md).

**Completion:** M3ES executor commit `a9e5eba` wrote
`docs/validation/return-to-form-m3es-local-tcn-output-dir-contract-diagnosis-v1.json`
and selected `continue_bounded_brev_tcn_training_smoke_after_m3es_contract_fix`.
It added explicit local policy for `output/m3er-high-signal-region-grid-tcn-brev`
without weakening M3AW/M3DM/M3DQ/M3EH constraints, proved M3AW/M3DM/M3DQ/M3EH
and M3ER local dry-runs, preserved fail-closed claim surfaces, and verified
the retained worker read-only state as `STOPPED` / `COMPLETED` / `NOT READY` /
`HEALTHY`. No Brev start/exec/sync/copy, remote dry-run, remote training,
fitting/backward/optimizer work, checkpoint, evaluation, export, promotion,
browser activation, product runtime mutation, source/data/dependency mutation,
push, worker creation/delete/reset, or pretrained/generated-label path
occurred.

## recent completed/blocked mission (Mission 3ER - Bounded Brev TCN training smoke)

This is historical context for the current M3EX downscope-contract mission.

**Historical per-milestone prompt:** [`docs/model/return-to-form-m3er-bounded-brev-tcn-training-smoke-goal-loop-prompt.md`](docs/model/return-to-form-m3er-bounded-brev-tcn-training-smoke-goal-loop-prompt.md).

**Completion/blocker:** M3ER executor commit `32f731c` wrote
`docs/validation/return-to-form-m3er-bounded-brev-tcn-training-smoke-v1.json`
and selected `continue_local_tcn_failure_diagnosis_after_m3er`. It started
only the retained `asl-pilot-m3eh-l40s-001` worker, proved the L40S/CUDA
surface, synced once, verified remote hashes, and ran the required dry-run
once. The dry-run failed before training because
`output/m3er-high-signal-region-grid-tcn-brev` was not in the then-current
region-grid TCN smoke output-dir allowlist. No timed training command ran. No
checkpoint, evaluation, copyback, source/data/dependency mutation, export,
promotion, browser activation, product runtime mutation, push, worker
creation/delete/reset, or pretrained/generated-label path occurred. The worker
was stopped and verified `STOPPED` / `COMPLETED` / `NOT READY` / `HEALTHY`.

## recent completed mission (Mission 3EQ - Brev recovery readiness no training)

This is historical context for the current M3EX downscope-contract mission.

**Historical per-milestone prompt:** [`docs/model/return-to-form-m3eq-brev-recovery-readiness-goal-loop-prompt.md`](docs/model/return-to-form-m3eq-brev-recovery-readiness-goal-loop-prompt.md).

**Completion:** M3EQ executor commit `a9afe8b` wrote
`docs/validation/return-to-form-m3eq-brev-recovery-readiness-v1.json`.
It started only `asl-pilot-m3eh-l40s-001`, reached a remote shell at
`/home/ubuntu`, selected `/home/ubuntu/asl-pilot`, synced the stale checkout
once, proved CUDA torch `2.12.0+cu126` on one `NVIDIA L40S`, ran the single
allowed no-training dry-run/check-files command over 139 high-signal
`rgb_regions_grid_v1` clips, stopped the worker, verified final
`STOPPED/COMPLETED/NOT READY/HEALTHY`, and selected
`continue_bounded_brev_tcn_training_smoke`.

## recent stopped mission (Mission 3EP - Brev sync preflight no training)

This is historical context for the current M3EX downscope-contract mission.

**Historical per-milestone prompt:** [`docs/model/return-to-form-m3ep-brev-sync-preflight-no-training-goal-loop-prompt.md`](docs/model/return-to-form-m3ep-brev-sync-preflight-no-training-goal-loop-prompt.md).

**Completion:** M3EP executor commit `a41624a` wrote
`docs/validation/return-to-form-m3ep-brev-sync-preflight-no-training-v1.json`.
It started the retained L40S worker but the remote inspection never reached SSH,
the worker reported `UNHEALTHY`, no sync/Python/CUDA probe occurred, and the
executor selected `stop_for_provider_or_budget_blocker`.

**Observer stop:** Observer commits `bf5f3e7` and `911f75a` added the stop
sentinel and verified default-off provider state. The final external Brev state
after the STOP correction was `STOPPED/COMPLETED/NOT READY/HEALTHY`; later M3EQ
recovered the worker and selected the bounded M3ER/M3ET training-smoke route.

## recent completed mission (Mission 3EO - Overnight Detector 0/Brev unblock)

This is historical context for the current M3EX downscope-contract mission.

**Historical per-milestone prompt:** [`docs/model/return-to-form-m3eo-overnight-detector0-brev-unblock-goal-loop-prompt.md`](docs/model/return-to-form-m3eo-overnight-detector0-brev-unblock-goal-loop-prompt.md).

**Completion:** M3EO executor commit `deb5517` completed one bounded unblock
packet and wrote
`docs/validation/return-to-form-m3eo-overnight-detector0-brev-unblock-v1.json`.
It preserved fail-closed claim surfaces, reconciled the M3EN blocker against
the expanded/union Detector 0 lineage, ran the capped Brev preflight on only
`asl-pilot-m3eh-l40s-001`, verified the worker stopped, and selected
`continue_brev_sync_preflight_no_training`.

**Historical result:** The Detector 0 target path is target-specific
`table_two_hand_union_or_contact_region` diagnostic work only. The Brev worker
was controllable and idle, but the M3EO probe checked the stale
`/home/shadeform/asl-pilot` Python path while the shell home was
`/home/ubuntu`, so the next bounded action is remote checkout/path/sync
preflight only.

## recent stopped mission (Mission 3EN - Detector 0 source-region receipts)

This is historical context for the current M3EX downscope-contract mission.

**Historical per-milestone prompt:** [`docs/model/return-to-form-m3en-detector0-source-region-receipts-goal-loop-prompt.md`](docs/model/return-to-form-m3en-detector0-source-region-receipts-goal-loop-prompt.md).

**Activation:** Mission 3EM completed one local/no-Brev Tiny2 held-out
noncollapse probe at commit `e9497b5`. The scratch model fit the train split
(`train_accuracy: 1.0`), but held-out validation stayed at chance (`0.5`),
collapsed all 8 predictions to `hello`, and produced zero recall for `table`.
M3EM selected `continue_detector0_source_region_receipts_no_brev`; Mission 3EN
builds that bounded no-training source-region evidence packet.

**Current project truth:**

- The browser product remains fail-closed: model card status is `not_trained`,
  active labels are empty, browser recognition is inactive, and current product
  smoke evidence remains valid but not trained-model evidence.
- M3EK selected exactly two labels for the first proof: `table` and `hello`.
  It uses source `asl-citizen-school-assignment-raw-videos`, manifest family
  `data/manifests/lesson/high-signal-region-grid`, and input contract
  `rgb_regions_grid_v1`.
- M3EL proved the scratch `true_temporal_convnet_region_grid` path can memorize
  a deterministic `table`/`hello` one-batch slice, but the shuffle-control
  result remains same-batch capacity evidence only and does not authorize Brev,
  export, promotion, browser activation, product claims, or label expansion.
- M3EM then proved train sanity but not held-out signal: train accuracy was
  `1.0`, held-out accuracy was exactly the `0.5` two-class chance baseline,
  held-out macro-F1 was `0.3333333333333333`, predictions collapsed to
  `hello`, and `table` had zero recall. This blocks a no-Brev open-set
  threshold probe.
- Existing Detector 0 evidence is diagnostic and constrained: objectness
  receipts found the current packet label-confounded, packet-support receipts
  found candidate clips exist but future packet-row mutation needs human
  annotation/scope approval, fixed-geometry receipts were reduced to accounting
  evidence, and M3EF did not justify another training-style retry.
- M3EJ completed the durable steering update: fail-closed MVP remains the
  deadline product, M3EH/M3EH-R are infrastructure-only, Tiny2/Tiny3 proof gates
  are required before recognizer Brev spend, and Detector 0/source/region
  receipts remain the durable representation path.
- M3DU completed one bounded CUDA training/evaluation path but produced weak,
  non-promotable metrics: validation top-1 `0.2593`, validation macro-F1
  `0.1536`, test top-1 `0.1786`, test macro-F1 `0.0978`, selected threshold
  `0.28`, and test false-pass rate `0.0357`.
- M3EF compared materialized upper-body/head input against full-frame reference
  on the same five labels, splits, seed, and cap. Materialized train top-1 was
  `0.216`, full-frame train top-1 was `0.208`, chance was `0.2`, neither arm
  passed train sanity, and predictions collapsed.
- M3EG blocked another autonomous training-style retry pending human strategy
  approval or new evidence. The GPT Pro result now supplies a strategy
  direction, not permission for ungated compute.
- M3EH/M3EH-R are infrastructure-only. They may record worker/CUDA/sync/dry-run
  proof and teardown state, but they do not authorize timed training or model
  claims.
- The previous M3EI PopSign Fresh5 bounded fit prompt is demoted. It must not
  be used as permission for a broad five-label fit. Any future M3EI-style run
  must be rewritten as a Tiny2/Tiny3 gated signal proof with explicit entry and
  abort gates.
- The successful path is now staged: preserve the fail-closed non-recognition
  MVP for the deadline; select a tiny label set using source/licensing and
  separability receipts; prove one-batch overfit, label-shuffle negative
  control, non-collapsed predictions, signer-held-out evaluation, open-set
  negatives, and browser/Python parity before any further Brev spend; build
  Detector 0 / deterministic region evidence as the durable representation
  unlock.

**First reviewable slice:**

Follow the active M3EN prompt. Complete one local/no-Brev/no-training Detector
0/source-region receipt packet from existing approved artifacts only: verify
current repo, claim surfaces, and source boundaries; inspect M3EM/M3EL/M3EK
tiny-proof receipts, Detector 0 objectness/support/class-invariant/fixed-
geometry receipts, fixed/materialized region receipts, source register, and
`table`/`hello` manifest metadata; connect the M3EM held-out `table` collapse
to source/region/Detector 0 evidence; preserve fail-closed product claims;
write the tracked M3EN receipt and session log; and commit only scoped
read-only helper/receipt/log files.

Do not run Brev, train/fit/evaluate the recognizer, train Detector 0, broaden
labels, mutate sources/manifests/tensors/vocabulary/packet rows, create or
start a worker, save a checkpoint or model artifact, export, promote, activate
browser recognition, alter product runtime, claim final readiness,
approve/import/download new source media, or use pretrained detectors,
landmarks, backbones, embeddings, teacher logits, generated labels, MediaPipe,
OpenPose, YOLO, or pseudo-labels in Mission 3EN.

## exit condition for Mission 3EN

All applicable items must be true before this mission can close:

1. `GOAL.md` points at
   [`docs/model/return-to-form-m3en-detector0-source-region-receipts-goal-loop-prompt.md`](docs/model/return-to-form-m3en-detector0-source-region-receipts-goal-loop-prompt.md)
   and names Mission 3EN.
2. Required audits and local JSON validations from the prompt pass or record
   exact blockers.
3. A tracked receipt exists at
   `docs/validation/return-to-form-m3en-detector0-source-region-receipts-v1.json`.
4. The receipt records commands run, files inspected, receipt or artifact
   hashes where practical, M3EM failure summary, Detector 0 support summary,
   source/register posture, region/crop claim boundaries, negative
   authorizations, changed files, and exactly one next action.
5. The receipt separates "candidate source/region evidence exists" from "the
   Detector 0 target schema is supportable now."
6. The packet uses existing approved artifacts only and does not revive broad
   Fresh5 training or threshold a collapsed Tiny2 recognizer.
7. Browser recognition remains inactive and fail-closed claim surfaces remain
   unchanged.
8. No Brev/lifecycle command, broad labels, source/manifest/tensor/vocabulary/
   packet mutation, recognizer training/fitting/evaluation rerun, Detector 0
   training, checkpoint/model artifact, export, promotion, browser activation,
   product runtime mutation, unsupported claim, or push occurs.
9. A numbered session log records commands, evidence inspected, changed files,
   blockers, and exactly one next action.

When these are satisfied, the observer should CONTINUE only to a bounded next
action that preserves the M3EJ strategy. It must REDIRECT or STOP any attempt
to treat old Fresh5/Brev prompts as permission for broad training or compute.

## recent completed mission (Mission 3EM - Tiny2 held-out noncollapse probe)

Mission 3EM completed at commit `e9497b5` with receipt
`docs/validation/return-to-form-m3em-tiny2-heldout-noncollapse-probe-v1.json`
and session log
`docs/session-logs/523-mission-3em-tiny2-heldout-noncollapse-probe.md`.
It built deterministic `table`/`hello` train and official-validation held-out
batches from approved ASL Citizen high-signal region-grid manifests. The local
random-init scratch model fit the train split (`train_accuracy: 1.0`) but
failed held-out validation: accuracy `0.5`, macro recall `0.5`, macro-F1
`0.3333333333333333`, prediction counts `{"hello": 8, "table": 0}`, zero
recall for `table`, and dominant predicted-class fraction `1.0`. It selected
`continue_detector0_source_region_receipts_no_brev`. No Brev command, broad
label run, source/media/manifest/tensor/vocabulary/packet mutation, Detector 0
training, checkpoint/model artifact, export, promotion, browser activation,
product runtime change, unsupported claim, push, worker creation, worker
deletion, or worker reset occurred.

## recent completed mission (Mission 3EL - Tiny2 one-batch overfit and shuffle control)

Mission 3EL completed at commit `72a22c3` with receipt
`docs/validation/return-to-form-m3el-tiny2-one-batch-overfit-shuffle-control-v1.json`
and session log
`docs/session-logs/521-mission-3el-tiny2-one-batch-overfit-shuffle-control.md`.
It built a deterministic `table`/`hello` batch, reached real-label one-batch
accuracy `1.0` with no class collapse, and showed that the inverted-label
shuffle control also memorized the same batch. It selected
`continue_tiny2_heldout_noncollapse_probe_no_brev`. No Brev command, broad
label run, source/media mutation, checkpoint/model artifact, export, promotion,
browser activation, product runtime change, unsupported claim, push, worker
creation, worker deletion, or worker reset occurred.

## recent completed mission (Mission 3EK - Tiny2/Tiny3 gated proof preparation)

Mission 3EK completed at commit `a33014f` with receipt
`docs/validation/return-to-form-m3ek-tiny2-tiny3-gated-proof-preparation-v1.json`
and session log `docs/session-logs/519-mission-3ek-tiny-proof-preparation.md`.
It selected `table` and `hello` as the first Tiny2 proof, reserved `black` as a
gated Tiny3 extension, defined source/licensing, split, one-batch overfit,
label-shuffle, class-collapse, open-set, browser-parity, abort, and promotion
gates, and selected `continue_tiny2_one_batch_overfit_and_shuffle_control_no_brev`.
No Brev command, training/fitting/evaluation, source/media mutation,
checkpoint/model artifact, export, promotion, browser activation, product
runtime change, unsupported claim, push, worker creation, worker deletion, or
worker reset occurred.

## recent completed mission (Mission 3EJ - Pro strategy steering and gated tiny proof plan)

Mission 3EJ completed at commit `296b5eb` with receipt
`docs/validation/return-to-form-m3ej-pro-strategy-steering-v1.json` and session
logs `docs/session-logs/516-supervisor-activate-pro-strategy-steering.md` and
`docs/session-logs/517-observer-redirect-m3eh-r-to-pro-strategy.md`. It
demoted the broad M3EI Fresh5 fit prompt, preserved M3EH/M3EH-R as
infrastructure-only evidence, recorded fail-closed MVP priority, added the
M3EK Tiny2/Tiny3 gated proof prompt, and blocked additional recognizer Brev
spend until tiny-proof entry gates show learnable signal. No Brev command,
training/fitting/evaluation, source/media mutation, Detector 0 training,
export, promotion, browser activation, product runtime change, unsupported
claim, push, worker creation, worker deletion, or worker reset occurred.

## recent completed mission (Mission 3EH-R - Remote CUDA environment repair)

Mission 3EH-R completed at commit `0963bc8` with receipt
`docs/validation/return-to-form-m3eh-remote-cuda-environment-repair-v1.json`
and session log
`docs/session-logs/515-mission-3eh-r-remote-cuda-environment-repair.md`. It
repaired remote CUDA compatibility on the existing L40S worker using
`torch==2.12.0+cu126`, proved CUDA availability, ran only the approved remote
dry-runs, and stopped the worker. It remains infrastructure proof only, not
recognizer quality evidence or compute authorization.

## recent completed mission (Mission 3EH - Bounded Brev relaunch preflight)

Mission 3EH completed at commit `76e6635` with receipt
`docs/validation/return-to-form-m3eh-bounded-brev-relaunch-preflight-v1.json`
and session log
`docs/session-logs/512-mission-3eh-bounded-brev-relaunch-preflight.md`.
It selected `continue_remote_environment_repair_no_training`; local audits and
both local dry-runs passed, one stoppable L40S worker was created and synced,
but CUDA proof failed after installing repo-pinned `torch==2.12.0+cu130`
against driver `565.57.01`. Remote dry-runs were intentionally not run. The
worker was stopped and later observed as `STOPPED`/`UNHEALTHY`. No timed
training/fitting, source mutation, model artifact, export, promotion, product
runtime change, browser activation, ASL-correctness, final-readiness claim, or
push occurred.

## recent completed mission (Mission 3EG - Post-M3EF model-input strategy downscope)

Mission 3EG completed at commit `71e857e` with receipt
`docs/validation/return-to-form-post-m3ef-model-input-strategy-downscope-v1.json`
and session log
`docs/session-logs/509-mission-3eg-post-m3ef-model-input-strategy-downscope.md`.
Observer commit `4013cc2` stopped for human model-input strategy review. The
latest user instruction now supersedes that stop by approving supervised
bounded Brev/completion work, but M3EG's evidence boundary remains binding:
weak training evidence is not product readiness.

## recent completed mission (Mission 3EF - Fixed-geometry materialized-region model-input diagnostic)

Mission 3EF completed at commit `4b0fd84` with receipt
`docs/validation/return-to-form-fixed-geometry-materialized-region-model-input-diagnostic-v1.json`
and session log
`docs/session-logs/507-mission-3ef-fixed-geometry-materialized-region-model-input-diagnostic.md`.
It selected `escalate_model_input_strategy_research`; the materialized
upper-body/head arm was not materially worse than full-frame, but neither arm
passed train sanity, predictions remained collapsed, and the result did not
justify another autonomous training-style retry without strategy review. No
Brev spend, source import, data/source mutation, checkpoint/model artifact,
export, promotion, product runtime change, browser activation,
ASL-correctness, or final-readiness claim occurred.

## recent completed mission (Mission 3EE - Fixed-geometry materialized-region follow-up)

Mission 3EE completed at commit `453cdba` with receipt
`docs/validation/return-to-form-fixed-geometry-materialized-region-followup-v1.json`
and session log
`docs/session-logs/505-mission-3ee-fixed-geometry-materialized-region-followup.md`.
It selected `materialized_region_model_input_diagnostic_no_brev`; the receipt
verified all 345 approved manifest tensors, found consistent materialized
upper-body/head/full-frame inputs with nonblank/distinct statistics, preserved
M3ED's reduced exact-ROI claim, and justified one separate bounded local
random-init no-artifact model-input diagnostic. No Brev spend, source import,
training/fitting, classifier/model-input diagnostic comparison, checkpoint/
model artifact, product runtime change, browser activation, ASL-correctness,
or final-readiness claim occurred.

## recent completed mission (Mission 3ED - Fixed-geometric claim reduction)

Mission 3ED completed at commit `9719b9a` with receipt
`docs/validation/return-to-form-fixed-geometric-claim-reduction-v1.json`
and session log
`docs/session-logs/503-mission-3ed-fixed-geometric-claim-reduction.md`.
It selected `fixed_geometry_materialized_region_followup_no_brev`; the receipt
reduced exact M3EB ROI to deterministic diagnostic/accounting evidence only and
allowed one bounded local/no-Brev follow-up for existing materialized
upper-body/head inputs. No Brev spend, source import, crop-smoke rerun,
training/fitting, classifier comparison, checkpoint/model artifact, product
runtime change, browser activation, ASL-correctness, or final-readiness claim
occurred.

## recent completed mission (Mission 3EC - Fixed-geometric crop-normalization smoke)

Mission 3EC completed at commit `3e254c4` with receipt
`docs/validation/return-to-form-fixed-geometric-crop-normalization-smoke-v1.json`
and session log
`docs/session-logs/500-mission-3ec-fixed-geometric-crop-normalization-smoke.md`.
It selected `fixed_geometry_claim_reduction`; the receipt found exact M3EB
geometry can be applied consistently from full-frame tensor references, but is
too narrow for unqualified interaction-preservation claims. No training,
classifier fitting, Brev spend, source import, tensor/manifest/packet mutation,
product runtime change, browser activation, ASL-correctness, or final readiness
claim occurred.

## recent completed mission (Mission 3EB - Detector 0 fixed-geometric fallback)

Mission 3EB completed at commit `d9b4106` with receipt
`docs/validation/return-to-form-detector0-fixed-geometric-fallback-v1.json`
and session log
`docs/session-logs/498-mission-3eb-detector0-fixed-geometric-fallback.md`.
It selected `prepare_fixed_geometric_crop_normalization_smoke_no_brev`; the
receipt found the fixed upper-body/signing-space fallback is stable enough for a
transparent local crop-normalization smoke, while explicitly not creating a
Detector 0 runtime objectness, browser activation, ASL-correctness, or final
readiness claim.

## recent completed mission (Mission 3EA - Detector 0 class-invariant target probe)

Mission 3EA completed at commit `d4b262d` with receipt
`docs/validation/return-to-form-detector0-class-invariant-target-probe-v1.json`
and session log
`docs/session-logs/496-mission-3ea-detector0-class-invariant-target-probe.md`.
It selected `prepare_detector0_fixed_geometric_fallback_no_brev`; the receipt
found the current class-invariant targets are all-present and support fixed
geometry more than runtime objectness.

## recent stopped mission (Mission 3DZ - Detector 0 packet support diagnosis)

Mission 3DZ completed at commit `0d94323` with receipt
`docs/validation/return-to-form-detector0-packet-support-diagnosis-v1.json`
and session log
`docs/session-logs/493-mission-3dz-detector0-packet-support-diagnosis.md`.
It selected `stop_for_human_detector0_annotation_budget`; observer commit
`00cc5b1` parked the loop. The latest user instruction now supersedes that
STOP for bounded local no-Brev backtracking, but it does not authorize source
import, packet mutation, Brev spend, product promotion, or browser activation.

## recent completed mission (Mission 3DY - Detector 0 objectness repair)

Mission 3DY completed at commit `c3a6d99` with receipt
`docs/validation/return-to-form-detector0-objectness-repair-v1.json` and
session log
`docs/session-logs/491-mission-3dy-detector0-objectness-repair.md`.
It added a scoped local diagnostic runner, preserved fail-closed/no-Brev/
no-source-import boundaries, separated presence from box quality, and selected
`continue_detector0_annotation_or_packet_support_no_brev`.

## recent stopped mission (Mission 3DX - Hand landmark detector source feasibility)

The active autonomous worker is **Codex executor**, observed by a separate
**Codex observer**. Do not start or resume Claude/Happy as the project
orchestrator. The abandoned Claude Internet Archive contact-sheet work remains
reversibly quarantined in a git stash named `quarantine abandoned Claude IA
contact-sheet slice before Codex takeover`; it is not active evidence and must
not be promoted without a deliberate recovery decision.

**Active per-milestone prompt:** [`docs/model/return-to-form-hand-landmark-source-feasibility-goal-loop-prompt.md`](docs/model/return-to-form-hand-landmark-source-feasibility-goal-loop-prompt.md).

**Activation:** The latest user instruction asks whether a scratch-trained hand
landmark detector is actually hard, notes that human-annotated datasets should
exist, and directs the supervisor to get a goal-loop pair session focused on
that question. This redirects the active loop away from the previous M3DW
Brev-unblock route and into one local/no-spend source-feasibility slice.

Mission 3DX must answer whether public human-annotated hand landmark datasets
can legally and technically support a repo-compliant scratch Detector 0 /
crop-normalization path. It must not train, download media, mutate source
registers, or spend Brev. Public dataset existence is not approval.

**Current project truth:**

- The browser product remains fail-closed: model card status is `not_trained`,
  active labels are empty, browser recognition is inactive, and current
  product smoke evidence remains valid but not trained-model evidence.
- M3DU proved the corrected command reaches CUDA training and evaluation, but
  its held-out metrics are weak and not promotable.
- M3DV proved the latest weak result is not a product artifact and does not
  justify another blind M3DQ training attempt.
- Detector 0 is not properly trained or promoted. The latest parallel Detector
  0 held-out recall receipt selected
  `fix_detector0_presence_objectness_formulation_no_brev`.
- Existing root-cause evidence identifies coarse ROI/crop localization and
  crop-inclusion evidence as the current blocker. Full hand/posture/face
  landmarks are candidate future robustness work unless this mission proves a
  source-approved scratch route is feasible.
- Candidate public hand-keypoint datasets may exist, but each candidate must be
  classified by source rights, annotation provenance, accessibility, and
  whether it uses manual/human-in-loop labels versus generated labels.
- MediaPipe/OpenPose/YOLO/pretrained landmark outputs and generated
  pseudo-labels were not approved for M3DX. The later policy clarification
  allows MediaPipe-generated labels only as an explicitly approved offline
  weak-supervision fallback if manual/human-in-loop sources are documented as
  insufficient; MediaPipe remains forbidden in browser/runtime paths.
- Pre-existing untracked Brev-delete artifacts may exist in the working tree
  from a superseded route. Mission 3DX must not depend on them and must not run
  any Brev command.

**First reviewable slice:**

Follow the active M3DX prompt. Complete one local/no-spend hand-landmark source
feasibility packet: verify repo/pair state, validate current local model and
Detector 0 evidence, inspect public source metadata for candidate
human-annotated hand landmark datasets, classify source/annotation/license
viability, and write the tracked receipt and session log with exactly one next
action.

Do not train, fit, create checkpoints, export, promote, activate browser
recognition, run any Brev command, download media, import sources, mutate
source-register/manifests/tensors/vocabulary, broaden labels, or use pretrained
detectors, landmarks, backbones, embeddings, teacher logits, generated labels,
MediaPipe, OpenPose, YOLO, or pseudo-labels in this source-feasibility slice.

## exit condition for Mission 3DX

All applicable items must be true before this mission can close:

1. `GOAL.md` points at
   [`docs/model/return-to-form-hand-landmark-source-feasibility-goal-loop-prompt.md`](docs/model/return-to-form-hand-landmark-source-feasibility-goal-loop-prompt.md)
   and names Mission 3DX.
2. Required local audits and JSON validations from the prompt pass or record
   exact blockers.
3. Local evidence files for M3DV, Detector 0 held-out recall, root cause,
   model-card state, and active-vocabulary state are validated or exact missing
   paths are recorded.
4. The receipt classifies at least CMU Panoptic HandDB, Voxel51/hand-keypoints,
   FreiHAND, InterHand2.6M, and a MediaPipe-generated negative example by
   annotation provenance, label availability, source/license posture, and
   promoted-lane viability.
5. The receipt separates manual/human-in-loop labels from bootstrapped,
   synthetic, generated, or unknown labels.
6. The receipt states whether scratch hand-landmark work should supersede,
   complement, or remain separate from the current Detector 0 objectness/crop
   repair route.
7. No training/fitting/checkpoint/export/promotion/browser activation/Brev
   command/media import/source mutation/manifest mutation/tensor mutation/
   pretrained dependency/generated-label path occurs.
8. A tracked receipt exists at
   `docs/validation/return-to-form-hand-landmark-source-feasibility-v1.json`.
9. The receipt proves source checks, annotation classification,
   `pretrained_components: []`, negative authorizations, claim boundary,
   blockers, and exactly one next action from the active prompt.
10. A numbered session log records commands, evidence inspected, sources,
    blockers, changed files, and exactly one next action.

When these are satisfied, the observer should CONTINUE, NUDGE, REDIRECT, STOP,
or ESCALATE based on the evidence-backed next action in the receipt. Do not
approve another training-style slice unless the active prompt, receipt, and any
required strategy escalation justify it, source approval is explicit, and fresh
human approval covers any future data import, training, or Brev spend.

## superseded mission (Mission 3DL - Fail-closed product smoke refresh)

Mission 3DL completed at commit `ddc4edc`, and observer STOP was recorded at
commit `6e8990b`. Its product evidence remains useful reduced-claim evidence,
but it is no longer the active prompt after the user's renewed full-project
completion instruction.

**Activation:** Mission 3DK completed the local/no-spend, no-training
fail-closed product status refresh at commit `c243503`. Its receipt
[`docs/validation/return-to-form-fail-closed-product-status-refresh-v1.json`](docs/validation/return-to-form-fail-closed-product-status-refresh-v1.json)
selects exactly one next action:
`continue_fail_closed_product_smoke_refresh`.

Mission 3DL therefore authorizes one bounded local/no-spend, no-training
fail-closed product smoke refresh. It may run and record existing local
smoke/static checks for `/`, `/lesson`, and `/validation`, inspect product
routes and claim surfaces read-only, and write one tracked receipt plus one
numbered session log. It must not implement product features, reactivate
recognition, run Brev, run training, promote model claims, mutate
source/data/model artifacts, or hand-edit `web/public/model/model-card.json`.

**Current project truth:**

- The browser model remains fail-closed: `web/public/model/model-card.json` is
  not trained, and `docs/model/active-vocabulary-claim.json` has
  `activeLabels: []` and no active trained-browser evidence.
- The recognizer lane is parked by evidence, not process drift. M3DI redirected
  to a fail-closed non-recognition learning MVP, M3DJ selected status refresh,
  and M3DK refreshed the status generator and generated claim matrices.
- Current status surfaces are no longer on stale Mission 3AR wording:
  `web/public/model/claim-matrix.json`, `docs/validation/final-claim-matrix.json`,
  and `scripts/audit_final_claim_matrix.mjs` now represent Mission 3DK,
  M3DI/M3DJ non-recognition redirect, and observer 459 Brev stop-verification
  failure while preserving `status=no_active_claim_rawframe_not_trained`.
- `web/public/model/model-card.json` has stale provenance-note wording, but the
  observer hard rule forbids hand-editing it. M3DL may only record this as a
  blocker unless a future prompt authorizes a generator-owned model-card update.
- Brev cost-control remains unresolved: observer 459 stop commands returned,
  but `brev ls --json` still reported `asl-pilot-rawframe-001` / `2hl1hytty` as
  `RUNNING`, `READY`, and `HEALTHY`. Do not run Brev for M3DL.

**First reviewable slice:**

Follow the active M3DL prompt. Complete one local/no-spend, no-training
fail-closed product smoke refresh. Run and record the existing route/status
smoke/static checks for `/`, `/lesson`, and `/validation`; inspect route and
claim surfaces read-only; confirm product surfaces remain fail-closed and read
the M3DK status matrices; write the M3DL receipt and choose exactly one next
action from the active M3DL prompt.

Do not run training, fit again, tune, create or update checkpoints, run new
train/eval/extraction, hand-edit model-card, reactivate recognition, run Brev,
mutate source/manifests/tensors/labels, import datasets, generate pseudo-labels,
export, activate browser recognition, promote labels, promote a model card,
weaken final gates, make unsupported claims, or push.

## exit condition for Mission 3DL

All applicable items must be true before this mission can close:

1. `GOAL.md` points at
   [`docs/model/return-to-form-fail-closed-product-smoke-refresh-goal-loop-prompt.md`](docs/model/return-to-form-fail-closed-product-smoke-refresh-goal-loop-prompt.md)
   and names Mission 3DL.
2. The M3DK receipt exists and parses.
3. The claim-matrix audit passes and `/validation` status source is current to
   M3DK, or the session log records the exact blocker.
4. A tracked fail-closed product smoke refresh receipt exists at
   `docs/validation/return-to-form-fail-closed-product-smoke-refresh-v1.json`,
   or the session log records the exact blocker that prevented it.
5. The receipt confirms `/`, `/lesson`, and `/validation` remain fail-closed.
6. The receipt proves browser recognition remains inactive and model claims
   remain not-trained.
7. The receipt proves `web/public/model/model-card.json` was not hand-edited.
8. The receipt proves no training, fitting, checkpoint creation/update, Brev
   remote work, source mutation, manifest mutation, tensor mutation, product
   feature implementation, export, browser activation, model-card promotion,
   active-label promotion, final-gate action, unsupported claim, or push
   occurred.
9. `node scripts/audit_return_to_form_plan.mjs --json`,
   `node scripts/audit_loop_premise.mjs --json`,
   `node scripts/audit_no_pretrained_deps.mjs`,
   `node scripts/audit_no_pretrained_artifact_json.mjs`,
   `node scripts/audit_source_register.mjs`, M3DK receipt JSON validation,
   M3DL receipt JSON validation, claim-matrix audit, relevant smoke/static
   checks, and
   `git diff --check` exit 0 or record exact blockers.
10. The receipt selects exactly one next action from the active M3DL prompt.
11. A numbered session log records commands, evidence, blockers, changed files,
    and exactly one next action.

When these are satisfied, the observer should CONTINUE, NUDGE, REDIRECT, STOP,
or ESCALATE based on the evidence-backed next action in the receipt. Do not
execute Brev training or product work remotely; Brev remains a cost-control
blocker until a human or provider-level action resolves the stopped-state
verification gap.

## historical mission (Mission 3DA - PopSign fresh5 revised scratch architecture/input scaffold)

Mission 3DA was activated after Mission 3CZ selected
`draft_revised_scratch_architecture_input_scaffold_no_training`. It completed
one local/no-spend, no-training revised scratch architecture/input scaffold and
wrote
[`docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-scaffold-v1.json`](docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-scaffold-v1.json).

M3DA completed at `0e74b9b` without training/fitting/optimizer/backward/
checkpoint creation, sweep, auxiliary diagnostic model, Brev command/spend/
lifecycle, source/register mutation, manifest mutation, tensor mutation,
pretrained dependency, export, browser activation, model-card promotion,
active-label promotion, final-gate change, product recognition claim,
unsupported claim, or push. It registered and instantiated
`scratch_motion_region_token_temporal_contract_v1`, derived motion evidence on
the fly for `popsign_fresh5_rgb_regions_plus_derived_motion_tokens_v1`, proved
B=1/B=2 no-grad shape, parameter and retained-diagnostic budgets, diagnostic
keys, old-path compatibility, and fail-closed browser claims, and named
`draft_bounded_local_fit_readiness_review_no_training` as the single next
action.

## historical mission (Mission 3CZ - PopSign fresh5 revised scratch architecture/input contract packet)

Mission 3CZ was activated after Mission 3CY selected
`draft_revised_scratch_architecture_input_contract_packet_no_training`. It
completed one local/no-spend, no-training, no-implementation revised scratch
architecture/input contract packet and wrote
[`docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-contract-v1.json`](docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-contract-v1.json).

M3CZ completed at `b5e4c7e` without training/fitting/optimizer/backward/
checkpoint creation, sweep, auxiliary diagnostic model, Brev command/spend/
lifecycle, source/register mutation, manifest mutation, tensor mutation,
pretrained dependency, helper script, implementation-code change,
architecture/input prototype, export, browser activation, model-card
promotion, active-label promotion, final-gate change, unsupported claim,
product recognition claim, or push. It bound
`scratch_motion_region_token_temporal_contract_v1` and
`popsign_fresh5_rgb_regions_plus_derived_motion_tokens_v1`, preserved
fail-closed browser claims, and named
`draft_revised_scratch_architecture_input_scaffold_no_training` as the single
next action.

## historical mission (Mission 3CY - PopSign fresh5 revised scratch architecture/input design review)

Mission 3CY was activated after Mission 3CX selected
`draft_revised_scratch_architecture_input_design_review_no_training`. It
completed one local/no-spend, no-training, no-implementation revised scratch
architecture/input design review and wrote
[`docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-design-review-v1.json`](docs/validation/return-to-form-popsign-fresh5-revised-scratch-architecture-input-design-review-v1.json).

M3CY completed at `a936101` without training/fitting/optimizer/backward/
checkpoint creation, sweep, auxiliary diagnostic model, Brev command/spend/
lifecycle, source/register mutation, manifest mutation, tensor mutation,
pretrained dependency, helper script, implementation-code change,
architecture/input prototype, export, browser activation, model-card
promotion, active-label promotion, final-gate change, unsupported claim, or
push. It selected `scratch_motion_region_token_temporal_contract` as the
preferred no-pretrained future design direction and named
`draft_revised_scratch_architecture_input_contract_packet_no_training` as the
single next action.

## historical mission (Mission 3CX - PopSign fresh5 strategy/downscope decision packet)

Mission 3CX was activated after Mission 3CW selected
`escalate_strategy_research_with_local_evidence` and observer 435 reduced that
escalation to exactly one local/no-spend, no-training/no-implementation
strategy/downscope decision packet. It completed that packet and wrote
[`docs/validation/return-to-form-popsign-fresh5-strategy-downscope-decision-v1.json`](docs/validation/return-to-form-popsign-fresh5-strategy-downscope-decision-v1.json).

M3CX completed at `61594d6` without training/fitting/optimizer/backward/
checkpoint creation, optimized auxiliary classifier fitting, Brev command/
spend/lifecycle, source/register mutation, manifest mutation, tensor mutation,
pretrained dependency, implementation-code change, architecture/input
prototype, export, browser activation, model-card promotion, active-label
promotion, final-gate change, unsupported claim, or push. It evaluated exactly
the three prompt-authorized options, selected
`revise_scratch_architecture_input_design_no_training`, and named
`draft_revised_scratch_architecture_input_design_review_no_training` as the
single next action.

## historical mission (Mission 3CW - PopSign fresh5 architecture/data generalization failure packet)

Mission 3CW was activated after Mission 3CV selected
`continue_no_training_architecture_data_generalization_failure_packet`. It
completed one local/no-spend, no-training architecture/data generalization
failure packet and wrote
[`docs/validation/return-to-form-popsign-fresh5-architecture-data-generalization-failure-v1.json`](docs/validation/return-to-form-popsign-fresh5-architecture-data-generalization-failure-v1.json).

M3CW completed at `edcb712` without training/fitting/optimizer/backward/
checkpoint creation, optimized auxiliary classifier fitting, Brev command/
spend/lifecycle, source/register mutation, manifest mutation, tensor mutation,
pretrained dependency, implementation-code change, export, browser activation,
model-card promotion, final-gate change, unsupported claim, or push. It
classified the strongest current explanation as a scratch architecture/
optimization/generalization failure under the existing input/data envelope,
found prior strategy artifacts stale for the M3CR-M3CV evidence, and selected
`escalate_strategy_research_with_local_evidence`.

## historical mission (Mission 3CV - PopSign fresh5 feature-collapse representation packet)

Mission 3CV was activated after Mission 3CU selected
`continue_no_training_feature_collapse_representation_packet`. It completed one
local/no-spend, no-training feature-collapse / representation packet and wrote
[`docs/validation/return-to-form-popsign-fresh5-feature-collapse-representation-v1.json`](docs/validation/return-to-form-popsign-fresh5-feature-collapse-representation-v1.json).

M3CV completed at `6c793ab` without training/fitting/optimizer/backward/
checkpoint creation, optimized auxiliary classifier fitting, Brev command/
spend/lifecycle, source/register mutation, manifest mutation, tensor mutation,
pretrained dependency, export, browser activation, model-card promotion,
final-gate change, unsupported claim, implementation-code change, or push. It
reused the M3CU diagnostic output, found collapse already visible at fused head
input, ruled out a last-layer-only or readout-boundary-only explanation, and
selected `continue_no_training_architecture_data_generalization_failure_packet`.

## historical mission (Mission 3CU - PopSign fresh5 train-split logit/feature separability packet)

Mission 3CU was activated after Mission 3CT selected
`continue_no_training_train_split_logit_or_feature_separability_packet`. It
completed one local/no-spend, no-training, inference-only train-split logit /
feature separability packet and wrote
[`docs/validation/return-to-form-popsign-fresh5-train-split-logit-feature-separability-v1.json`](docs/validation/return-to-form-popsign-fresh5-train-split-logit-feature-separability-v1.json).

M3CU completed at `91d5df2` without training/fitting/optimizer/backward/
checkpoint creation, optimized auxiliary classifier fitting, Brev command/
spend/lifecycle, source/register mutation, manifest mutation, tensor mutation,
pretrained dependency, export, browser activation, model-card promotion,
final-gate change, unsupported claim, or push. It added a scoped
inference-only diagnostic helper, generated ignored local feature-separability
output, found train features nonseparable/collapsed before the classifier head,
classified the strongest evidence as feature collapse/nonseparability, and
selected `continue_no_training_feature_collapse_representation_packet`.

## historical mission (Mission 3CT - PopSign fresh5 prediction confidence/logit distribution packet)

Mission 3CT was activated after Mission 3CS selected
`continue_no_training_prediction_confidence_logit_distribution_packet`. It
completed one local/no-spend, no-training, inference-only prediction
confidence/logit distribution packet and wrote
[`docs/validation/return-to-form-popsign-fresh5-prediction-confidence-logit-distribution-v1.json`](docs/validation/return-to-form-popsign-fresh5-prediction-confidence-logit-distribution-v1.json).

M3CT completed at `2d5ca51` without training/fitting/optimizer/backward/
checkpoint creation, Brev command/spend/lifecycle, source/register mutation,
manifest mutation, tensor mutation, pretrained dependency, export, browser
activation, model-card promotion, final-gate change, unsupported claim, or
push. It added a scoped inference-only diagnostic helper, generated ignored
local logit-distribution output, found identical train/validation/test collapse
to `morning: 125` top-1 and `thank_you: 125` top-2, classified the strongest
evidence as a stable tiny class-wise logit offset, and selected
`continue_no_training_train_split_logit_or_feature_separability_packet`.

## historical mission (Mission 3CS - PopSign fresh5 local train-all result diagnosis)

Mission 3CS was activated after Mission 3CR selected
`continue_no_training_local_train_all_result_diagnosis`. It completed one
local/no-spend, no-training, no-mutation diagnosis of the M3CR train-all result
and wrote
[`docs/validation/return-to-form-popsign-fresh5-local-train-all-result-diagnosis-v1.json`](docs/validation/return-to-form-popsign-fresh5-local-train-all-result-diagnosis-v1.json).

M3CS completed at `f4b069d` without training/fitting/optimizer/backward/
checkpoint creation, Brev command/spend/lifecycle, source/register mutation,
manifest mutation, tensor mutation, pretrained dependency, export, browser
activation, model-card promotion, final-gate change, unsupported claim, or
push. It found artifact/command/checkpoint consistency, validation accuracy
flat at `0.2`, validation/test collapse to `morning: 125`, near-uniform
low-margin probability outputs, threshold behavior downstream of top-1
collapse, and selected
`continue_no_training_prediction_confidence_logit_distribution_packet`.

## historical mission (Mission 3CR - PopSign fresh5 bounded local train-all after optimizer/loss packet)

Mission 3CR was activated after Mission 3CQ selected
`prepare_bounded_local_train_all_after_optimizer_loss_packet`. It completed one
bounded local/no-spend PopSign fresh5 train-all after the local training-smoke
contract was unblocked, and wrote
[`docs/validation/return-to-form-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-v1.json`](docs/validation/return-to-form-popsign-fresh5-bounded-local-train-all-after-optimizer-loss-v1.json).

M3CR completed at `5983c54` without Brev command/spend/lifecycle, remote
command, source/register mutation, manifest mutation, tensor mutation,
pretrained dependency, export, browser activation, model-card promotion,
final-gate change, unsupported claim, or push. It ran the predeclared
post-contract local train-all and evaluation, found no improvement over M3CJ,
kept compute/export readiness unjustified, and selected
`continue_no_training_local_train_all_result_diagnosis`.

## historical mission (Mission 3CQ - PopSign fresh5 optimizer/loss/regularization packet)

Mission 3CQ was activated after Mission 3CP selected
`continue_no_training_optimizer_loss_or_regularization_packet_after_sampler_packet`.
It completed one bounded local/no-spend, no-training, no-mutation optimizer/
loss/regularization packet and wrote
[`docs/validation/return-to-form-popsign-fresh5-optimizer-loss-regularization-packet-v1.json`](docs/validation/return-to-form-popsign-fresh5-optimizer-loss-regularization-packet-v1.json).

M3CQ completed at `8d5e31f` without training, fitting, optimizer construction
for fitting, optimizer/backward passes, checkpoint creation, sweep, Brev
command/spend/lifecycle, source/register mutation, source import, manifest/
tensor mutation, label expansion, pseudo-labeling, pretrained dependency,
export, browser activation, model-card promotion, final-gate changes,
unsupported claims, or push. It found no visible optimizer/loss/
regularization wiring defect, reconciled the M3CP checkpoint/reporting caveat,
kept Brev compute unjustified, and selected
`prepare_bounded_local_train_all_after_optimizer_loss_packet`.

## historical mission (Mission 3CP - PopSign fresh5 training distribution/sampler packet)

Mission 3CP was activated after Mission 3CO selected
`continue_no_training_training_distribution_or_sampler_packet_after_tensor_input_quality`.
It completed one bounded local/no-spend, no-training, no-mutation training
distribution/sampler packet and wrote
[`docs/validation/return-to-form-popsign-fresh5-training-distribution-sampler-packet-v1.json`](docs/validation/return-to-form-popsign-fresh5-training-distribution-sampler-packet-v1.json).

M3CP completed at `c1a2437` without training, fitting, optimizer/backward
passes, checkpoint creation, Brev command/spend/lifecycle, source/register
mutation, source import, manifest/tensor mutation, label expansion,
pseudo-labeling, pretrained dependency, export, browser activation, model-card
promotion, final-gate changes, unsupported claims, or push. It found no
distribution/sampler blocker: all splits are balanced, train batch caps cover
the full split each epoch, `pen` is not over/underexposed, and train/eval target
mapping is consistent. It kept local train-all and Brev compute unjustified,
carried a reporting/provenance caveat for M3CJ/current ignored output artifacts,
and selected
`continue_no_training_optimizer_loss_or_regularization_packet_after_sampler_packet`.

## historical mission (Mission 3CO - PopSign fresh5 tensor/input quality packet)

Mission 3CO was activated after Mission 3CN selected
`continue_no_training_tensor_or_input_quality_packet_after_label_review`. It
completed one bounded local/no-spend, no-training, no-mutation tensor/input
quality packet and wrote
[`docs/validation/return-to-form-popsign-fresh5-tensor-input-quality-packet-v1.json`](docs/validation/return-to-form-popsign-fresh5-tensor-input-quality-packet-v1.json).

M3CO completed at `070ba3d` without training, fitting, optimizer/backward
passes, checkpoint creation, Brev command/spend/lifecycle, source/register
mutation, source import, manifest/tensor mutation, label expansion,
pseudo-labeling, pretrained dependency, export, browser activation, model-card
promotion, final-gate changes, unsupported claims, or push. It scanned all
`375` repaired PopSign fresh5 tensors, found no visible tensor/input blocker,
kept local train-all and Brev compute unjustified, and selected
`continue_no_training_training_distribution_or_sampler_packet_after_tensor_input_quality`.

## historical mission (Mission 3CN - PopSign fresh5 label/source quality review packet)

Mission 3CN was activated after Mission 3CM selected
`continue_label_quality_review_packet_no_mutation`. It completed one bounded
local/no-spend, no-training, no-mutation label/source-quality review packet and
wrote
[`docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json`](docs/validation/return-to-form-popsign-fresh5-label-source-quality-review-packet-v1.json).

M3CN completed at `2a1f5e4` without training, fitting, optimizer/backward
passes, checkpoint creation, Brev command/spend/lifecycle, source/register
mutation, source import, manifest/tensor mutation, label expansion,
pseudo-labeling, pretrained dependency, export, browser activation, model-card
promotion, final-gate changes, unsupported claims, or push. It cleared
mechanical source-label ambiguity for the repaired manifests, did not claim
external ASL educator correctness, kept local train-all and Brev compute
unjustified, and selected
`continue_no_training_tensor_or_input_quality_packet_after_label_review`.

## historical mission (Mission 3CM - PopSign fresh5 split/source quality contract)

Mission 3CM was activated after Mission 3CL selected
`continue_split_source_quality_contract_no_mutation`. It completed one bounded
local/no-spend, no-training, no-mutation split/source/signer quality contract
and wrote
[`docs/validation/return-to-form-popsign-fresh5-split-source-quality-contract-v1.json`](docs/validation/return-to-form-popsign-fresh5-split-source-quality-contract-v1.json).

M3CM completed at `5a53e35` without training, fitting, optimizer/backward
passes, checkpoint creation, Brev command/spend/lifecycle, source/register
mutation, source import, manifest/tensor mutation, label expansion,
pseudo-labeling, pretrained dependency, export, browser activation, model-card
promotion, final-gate changes, unsupported claims, or push. It cleared the
split/source/signer/tensor gates, kept local train-all and Brev compute
unjustified, and selected `continue_label_quality_review_packet_no_mutation`
with `pen` and `thank_you` as priority review risks.

## historical mission (Mission 3CL - PopSign fresh5 data/split/label distribution audit)

Mission 3CL was activated after Mission 3CK selected
`continue_data_split_label_distribution_audit_no_mutation`. It completed one
bounded local/no-spend, no-training, no-mutation data/split/label distribution
audit and wrote
[`docs/validation/return-to-form-popsign-fresh5-data-split-label-distribution-audit-v1.json`](docs/validation/return-to-form-popsign-fresh5-data-split-label-distribution-audit-v1.json).

M3CL completed at `669b559` without training, fitting, optimizer/backward
passes, checkpoint creation, Brev command/spend/lifecycle, source/register
mutation, source import, manifest/tensor mutation, label expansion,
pseudo-labeling, pretrained dependency, export, browser activation, model-card
promotion, final-gate changes, unsupported claims, or push. It proved the
repaired manifests are balanced, tensor-complete, and cross-split-leakage-clean,
and selected `continue_split_source_quality_contract_no_mutation`.

## historical mission (Mission 3CK - PopSign fresh5 architecture/input microprobe)

Mission 3CK was activated after Mission 3CJ selected
`continue_architecture_or_input_contract_microprobe_no_brev`. It completed one
bounded local/no-spend, no-Brev architecture/input microprobe and wrote
[`docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json`](docs/validation/return-to-form-popsign-fresh5-architecture-input-microprobe-v1.json).

M3CK completed at `4a4a9f8` without Brev training, Brev lifecycle change,
source/register mutation, manifest/tensor mutation, pretrained dependency,
export, browser activation, model-card promotion, final-gate changes,
unsupported claims, or push. It proved
`scratch_region_temporal_late_fusion_tcn_contract_v1` can train-fit one
deterministic balanced PopSign fresh5 clip per label with `1.0` accuracy and
selected `continue_data_split_label_distribution_audit_no_mutation`.

## historical mission (Mission 3CJ - PopSign fresh5 learnability run contract)

Mission 3CJ was activated after M3CI and completed by supervisor recovery while
the external Codex CLI pair was blocked by a usage limit. It expanded the local
PopSign fresh5 smoke caps to five epochs and full train/validation split
coverage, ran bounded local MPS train/eval sanity, and wrote
[`docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json`](docs/validation/return-to-form-popsign-fresh5-local-train-eval-sanity-v1.json).

M3CJ proved the repaired PopSign fresh5 data reaches training and evaluation
correctly, but train-all runs remained near random and collapsed to one class.
It selected `continue_architecture_or_input_contract_microprobe_no_brev`.

## historical mission (Mission 3CI - PopSign fresh5 evaluation invocation contract fix)

Mission 3CI was activated after Mission 3CH selected
`continue_evaluation_invocation_contract_fix_no_training`. It completed one
bounded local/no-spend, no-training evaluation invocation-contract fix and wrote
[`docs/validation/return-to-form-popsign-fresh5-evaluation-invocation-contract-fix-v1.json`](docs/validation/return-to-form-popsign-fresh5-evaluation-invocation-contract-fix-v1.json).

M3CI completed at `3307465` without fitting, Brev spend, source or tensor
mutation, export, browser activation, model-card promotion, final-gate changes,
unsupported claims, or push. It added `--popsign-fresh5-training-smoke` to
evaluation, preserved the region axis, and proved the command now reaches the
expected missing-checkpoint blocker instead of argparse, manifest, challenge, or
decode-provenance blockers.

## historical mission (Mission 3CH - PopSign fresh5 training compute receipt refresh)

Mission 3CH was activated after Mission 3CG selected
`continue_compute_receipt_refresh_after_invocation_contract_fix`. It completed
one bounded local/no-spend, no-training compute receipt refresh and wrote
[`docs/validation/return-to-form-popsign-fresh5-training-compute-receipt-refresh-v1.json`](docs/validation/return-to-form-popsign-fresh5-training-compute-receipt-refresh-v1.json).

M3CH completed at `8e8fd90` without training, fitting, optimizer/backward
passes, checkpoint creation, Brev exec/sync/lifecycle commands, source-register
changes, source import, manifest/tensor mutation, label expansion,
pseudo-labeling, pretrained dependencies, export, browser activation,
model-card promotion, final-gate changes, unsupported claims, or push. It
proved the training dry-run/check-files command accepts
`scratch_region_temporal_late_fusion_tcn_contract_v1` with
`--popsign-fresh5-training-smoke` and preserves the region axis, but evaluation
rejects the same evidence mode at argparse. It selected
`continue_evaluation_invocation_contract_fix_no_training`.

## historical mission (Mission 3CG - PopSign fresh5 training invocation contract fix)

Mission 3CG was activated after Mission 3CF selected
`continue_training_invocation_contract_fix_no_training`. It completed one
bounded local/no-spend, no-training invocation-contract fix and wrote
[`docs/validation/return-to-form-popsign-fresh5-training-invocation-contract-fix-v1.json`](docs/validation/return-to-form-popsign-fresh5-training-invocation-contract-fix-v1.json).

M3CG completed at `210942f` without fitting, optimizer/backward passes,
checkpoint creation, Brev exec/sync/lifecycle commands, source-register
changes, source import, manifest/tensor mutation, label expansion,
pseudo-labeling, pretrained dependencies, export, browser activation,
model-card promotion, final-gate changes, unsupported claims, or push. It added
a dedicated PopSign fresh5 repaired-manifest training-smoke invocation contract
for `scratch_region_temporal_late_fusion_tcn_contract_v1`, proved the
no-side-effect dry-run/check-files command exits `0` and creates no output
directory, kept the old region-grid and final-training guards strict, and
selected `continue_compute_receipt_refresh_after_invocation_contract_fix`.

## historical mission (Mission 3CF - PopSign fresh5 training compute receipt)

Mission 3CF was activated after Mission 3CE selected
`prepare_separate_training_compute_receipt_after_scaffold_passes`. It completed
one bounded local/no-spend, no-training compute receipt and wrote
[`docs/validation/return-to-form-popsign-fresh5-training-compute-receipt-v1.json`](docs/validation/return-to-form-popsign-fresh5-training-compute-receipt-v1.json).

M3CF completed at `c248dc1` without training, fitting, optimizer/backward
passes, checkpoint creation, Brev exec/sync/lifecycle commands, source-register
changes, source import, manifest/tensor mutation, label expansion,
pseudo-labeling, pretrained dependencies, export, browser activation,
model-card promotion, final-gate changes, unsupported claims, or push. It ran
one no-side-effect dry-run/check-files command, confirmed that
`scratch_region_temporal_late_fusion_tcn_contract_v1` is build-selectable but
rejected by the current `--region-grid-tcn-training-smoke` guard, recorded the
older M3AW manifest/output hard-coding, and selected
`continue_training_invocation_contract_fix_no_training`.

## historical mission (Mission 3CE - PopSign fresh5 architecture scaffold contract)

Mission 3CE was activated after Mission 3CD selected
`continue_no_training_architecture_scaffold_contract`. It completed one
bounded local/no-spend, no-training architecture scaffold contract for
`scratch_region_temporal_late_fusion_tcn_contract_v1` and wrote
[`docs/validation/return-to-form-popsign-fresh5-architecture-scaffold-contract-v1.json`](docs/validation/return-to-form-popsign-fresh5-architecture-scaffold-contract-v1.json).

M3CE completed at `df6e719` without training, fitting, optimizer/backward
passes, checkpoint creation, Brev commands, source-register changes, source
import, manifest/tensor mutation, label expansion, pseudo-labeling, pretrained
dependencies, export, browser activation, model-card promotion, final-gate
changes, unsupported claims, or push. It added the architecture scaffold to
`scripts/train_rawframe_model.py`, verified no-grad `B,T,R,C,H,W` input to
`B,5` logits, counted `781918` parameters, avoided BatchNorm, Dropout, and
running-stat layers, recorded PopSign/SemLex/ASL-LEX/ASL Citizen compatibility,
and selected `prepare_separate_training_compute_receipt_after_scaffold_passes`.

## historical mission (Mission 3CD - PopSign fresh5 architecture/optimization design review)

Mission 3CD was activated after Mission 3CC selected
`propose_architecture_optimization_design_review_no_training`. It completed one
local/no-spend, no-training architecture/optimization design review from the
M3CC research packet and wrote
[`docs/validation/return-to-form-popsign-fresh5-architecture-optimization-design-review-v1.json`](docs/validation/return-to-form-popsign-fresh5-architecture-optimization-design-review-v1.json).

M3CD completed at `eca7cb9` without training, fitting, optimizer/backward
passes, checkpoint creation, Brev commands, source-register changes, source
import, manifest/tensor mutation, label expansion, pseudo-labeling, pretrained
dependencies, export, browser activation, model-card promotion, final-gate
changes, unsupported claims, or push. It selected
`scratch_region_temporal_late_fusion_tcn_contract_v1`, compared it against five
M3CC alternatives, recorded browser-size/runtime constraints, future validation
criteria, and early stop conditions, and selected
`continue_no_training_architecture_scaffold_contract`.

## historical mission (Mission 3CC - PopSign fresh5 architecture/optimization research packet)

Mission 3CC was activated after Mission 3CB selected
`continue_no_training_architecture_or_optimization_research` and the observer
completed current API strategy escalation. It completed one local/no-spend,
no-training architecture/optimization research packet from existing M3CA/M3CB/
M3BV/M3BU evidence and wrote
[`docs/validation/return-to-form-popsign-fresh5-architecture-optimization-research-v1.json`](docs/validation/return-to-form-popsign-fresh5-architecture-optimization-research-v1.json).

M3CC completed at `212734a` without training, fitting, optimizer/backward
passes, checkpoint creation, Brev commands, source-register changes, source
import, manifest/tensor mutation, label expansion, pseudo-labeling, pretrained
dependencies, export, browser activation, model-card promotion, final-gate
changes, unsupported claims, or push. It ranked seven plausible hypotheses,
rejected eight unsupported action classes, kept browser/Brev/source/export/
promotion gates closed, and selected
`propose_architecture_optimization_design_review_no_training`.

## historical mission (Mission 3CB - PopSign fresh5 model/input training-loop remediation audit)

Mission 3CB was activated after Mission 3CA selected
`continue_model_input_or_training_loop_remediation`. It completed one
local/no-spend, no-training model/input/training-loop remediation audit from
existing M3CA/M3BV/M3BU evidence and wrote
[`docs/validation/return-to-form-popsign-fresh5-model-input-training-loop-remediation-v1.json`](docs/validation/return-to-form-popsign-fresh5-model-input-training-loop-remediation-v1.json).

M3CB completed at `bf8fef5` without training, fitting, optimizer/backward
passes, checkpoint creation, Brev commands, source-register changes, source
import, manifest/tensor mutation, label expansion, pseudo-labeling, pretrained
dependencies, export, browser activation, model-card promotion, final-gate
changes, unsupported claims, or push. It found no concrete local label/index,
tensor shape/order, normalization, loss, device/dtype, or optimizer-loop
defect, classified the blocker as `architecture_or_optimization_research`, and
selected `continue_no_training_architecture_or_optimization_research`.

## historical mission (Mission 3CA - PopSign fresh5 learnability isolation probe)

Mission 3CA was activated after Mission 3BZ selected
`continue_bounded_fresh5_learnability_isolation_probe`. It completed one
bounded local/no-spend PopSign fresh5 learnability-isolation probe from the
repaired manifest package and wrote
[`docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json`](docs/validation/return-to-form-popsign-fresh5-learnability-isolation-probe-v1.json).

M3CA completed at `c58ff44` without Brev commands, remote training,
source-register changes, source import, manifest/tensor mutation, label
expansion, pseudo-labeling, pretrained dependencies, export, browser
activation, model-card promotion, final-gate changes, unsupported claims, or
push. It preserved the `true_temporal_convnet_region_grid` region-axis input,
but train-all accuracy reached only `0.464`, relaxed signer-overlap accuracy
`0.32`, signer-disjoint validation/test accuracy `0.256` / `0.328`, and `pen`
test recall remained `0.04`. It kept compute, export, promotion, and browser
activation unjustified, classified the blocker as `model_input_or_training_loop`,
and selected `continue_model_input_or_training_loop_remediation`.

## historical mission (Mission 3BZ - PopSign fresh5 repaired manifest materialization)

Mission 3BZ was activated after Mission 3BY selected
`continue_fresh5_repaired_manifest_materialization`. It completed one
local/no-spend, no-training PopSign fresh5 repaired manifest materialization
from existing verified tensor artifacts and wrote
[`docs/validation/return-to-form-popsign-fresh5-repaired-manifest-materialization-v1.json`](docs/validation/return-to-form-popsign-fresh5-repaired-manifest-materialization-v1.json).

M3BZ completed at `002cd90` without training, fitting, optimizer/backward
passes, Brev commands, tensor writes, source-register changes, source import,
label expansion, pseudo-labeling, pretrained dependencies, export, browser
activation, model-card promotion, final-gate changes, unsupported claims, or
push. It created the tracked package
[`data/manifests/return-to-form-popsign-fresh5-repaired-v1/`](data/manifests/return-to-form-popsign-fresh5-repaired-v1/)
with train/validation/test manifests and `manifest-contract.json`, verified all
materialization gates, kept Brev/fresh10/Detector 0/crop/export/promotion/
browser activation unjustified, and selected
`continue_bounded_fresh5_learnability_isolation_probe`.

## historical mission (Mission 3BY - PopSign fresh5 repaired manifest contract)

Mission 3BY was activated after Mission 3BX selected
`continue_fresh5_repaired_manifest_contract`. It completed one local/no-spend,
no-training PopSign fresh5 repaired manifest/split/source-quality contract
verification from existing artifacts and wrote
[`docs/validation/return-to-form-popsign-fresh5-repaired-manifest-contract-v1.json`](docs/validation/return-to-form-popsign-fresh5-repaired-manifest-contract-v1.json).

M3BY completed at `b1b5438` without training, fitting, checkpoint creation,
Brev commands, source-register changes, source import, label expansion,
manifest/tensor mutation, pseudo-labeling, pretrained dependencies, Detector 0
training, export, browser activation, model-card promotion, final-gate changes,
unsupported claims, or push. It verified all materialization contract gates,
kept Brev/fresh10/Detector 0/crop/export/promotion/browser activation
unjustified, and selected `continue_fresh5_repaired_manifest_materialization`.

## historical mission (Mission 3BX - PopSign fresh5 vocabulary/split remediation design)

Mission 3BX was activated after Mission 3BW selected
`continue_fresh5_vocab_split_remediation_packet`. It completed one
local/no-spend, no-training PopSign fresh5 vocabulary/split/source-quality
remediation design packet from existing artifacts and wrote
[`docs/validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json`](docs/validation/return-to-form-popsign-fresh5-vocab-split-remediation-v1.json).

M3BX completed at `99e301a` without training, fitting, checkpoint creation,
Brev commands, source-register changes, source import, manifest/tensor
mutation, pseudo-labeling, pretrained dependencies, export, browser activation,
model-card promotion, final-gate changes, unsupported claims, or push. It
classified the blocker as `fresh5_manifest_split_source_quality_contract_needed`,
kept Brev/fresh10/Detector 0/crop/export/promotion/browser activation
unjustified, and selected `continue_fresh5_repaired_manifest_contract`.

## historical mission (Mission 3BW - PopSign fresh5 data/vocabulary separability packet)

Mission 3BW was activated after Mission 3BV selected
`continue_data_vocabulary_separability_packet`. It completed one
local/no-spend, no-training PopSign fresh5 separability diagnosis from existing
receipts, manifests, tensors, prediction/report artifacts, and source metadata,
and wrote
[`docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json`](docs/validation/return-to-form-popsign-fresh5-data-vocabulary-separability-v1.json).

M3BW completed at `a13dc9a` without training, fitting, checkpoint creation,
Brev commands, source-register changes, source import, pseudo-labeling,
pretrained dependencies, export, browser activation, model-card promotion,
final-gate changes, unsupported claims, or push. It classified the blocker as
`data_vocabulary_split_source_distribution`, found that `thank_you` absorbed
`0.568` of test predictions while `pen` recall stayed `0.04`, found zero
train/validation/test signer overlap, found no decisive empty hand-region
failure, and selected `continue_fresh5_vocab_split_remediation_packet`.

## historical mission (Mission 3BV - PopSign fresh5 model/data design ablation)

Mission 3BV was activated after Mission 3BU selected
`continue_local_model_data_design_ablation`. It ran one bounded local/no-spend
preserved-region PopSign fresh5 tiny-overfit/input-contract probe against the
M3BT generated `rgb_regions_grid_v1` manifests and tensors and wrote
[`docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json`](docs/validation/return-to-form-popsign-fresh5-model-data-design-ablation-v1.json).

M3BV completed at `c7b0771` without Brev commands, remote training, fresh10
training, broad training, source-register changes, pretrained dependencies,
pseudo-labeling, export, browser activation, model-card promotion, final-gate
changes, unsupported claims, or push. It proved the intended region-aware
model/input path can memorize the deterministic PopSign fresh5 tiny subset, but
because M3BU held-out signal remains weak, it classified the blocker as
`data_vocabulary_split_or_crop_generalization` and selected
`continue_data_vocabulary_separability_packet`.

## historical mission (Mission 3BU - PopSign fresh5 region-grid local smoke)

Mission 3BU was activated after Mission 3BT selected
`continue_capped_local_fresh5_region_grid_smoke`. It ran one capped local
classifier smoke against the M3BT generated `rgb_regions_grid_v1` manifests and
tensors and wrote
[`docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json`](docs/validation/return-to-form-popsign-fresh5-region-grid-local-smoke-v1.json).

M3BU completed at `19dfdfe` without Brev commands, remote training, fresh10
training, broad training, source-register changes, pretrained dependencies,
export, browser activation, model-card promotion, final-gate changes, or push.
It improved the M3BS full-frame baseline but remained weak enough that Brev
and promotion are unjustified, and selected
`continue_local_model_data_design_ablation`.

## historical mission (Mission 3BT - PopSign fresh5 region-grid materialization)

Mission 3BT was activated after Mission 3BS selected
`continue_region_grid_or_detector0_tensor_materialization`. It materialized
PopSign fresh5 `rgb_regions_grid_v1` manifests and tensors from existing
approved local raw videos and wrote
[`docs/validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json`](docs/validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json).

M3BT completed at `9081174` without local classifier training, Brev commands,
browser activation, export, model-card promotion, final-gate changes, or push.
Its dry-run/check-files validation observed `rgb_regions_grid_v1` for all 375
clips and selected `continue_capped_local_fresh5_region_grid_smoke`.

## historical mission (Mission 3BS - PopSign fresh5 materialization local smoke)

Mission 3BS was activated after the user explicitly restarted the overnight
ML/product completion push. It materialized the `popsign_fresh_5_v1` candidate
from approved local PopSign raw videos, validated manifests, decoded full-frame
tensors, ran a capped local smoke, and wrote
[`docs/validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json`](docs/validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json).

M3BS completed at `6c49aae` without Brev commands, browser activation, export,
model-card promotion, final-gate changes, or push. Its full-frame smoke was
too weak for a Brev compute receipt and selected
`continue_region_grid_or_detector0_tensor_materialization`.

## historical mission (Mission 3BR - vocabulary reselection from existing local artifacts)

The active autonomous worker is **Codex executor**, observed by a separate
**Codex observer**. Do not start or resume Claude/Happy as the project
orchestrator. The abandoned Claude Internet Archive contact-sheet work remains
reversibly quarantined in a git stash named `quarantine abandoned Claude IA
contact-sheet slice before Codex takeover`; it is not active evidence and must
not be promoted without a deliberate recovery decision.

**Active per-milestone prompt:** [`docs/model/return-to-form-vocab-reselection-existing-local-artifacts-goal-loop-prompt.md`](docs/model/return-to-form-vocab-reselection-existing-local-artifacts-goal-loop-prompt.md).

**Activation:** Mission 3BQ completed the authorized local/no-spend, no-training
label/split/tensor drift diagnosis at `8531e99`. The receipt at
[`docs/validation/return-to-form-label-split-tensor-drift-diagnosis-v1.json`](docs/validation/return-to-form-label-split-tensor-drift-diagnosis-v1.json)
cleared class-index mapping and tensor availability for the seven scoped ASL
Citizen high-signal labels, but found the retained training-worthy label list
empty and the at-least-two label gate failed. It selected exactly one next
action: `prepare_vocab_reselection_packet_from_existing_local_artifacts`.

**Observer stop:** Mission 3BR completed at `480c1f7`. The receipt at
[`docs/validation/return-to-form-vocab-reselection-existing-local-artifacts-v1.json`](docs/validation/return-to-form-vocab-reselection-existing-local-artifacts-v1.json)
found no existing local approved artifact that supports a two-or-more-label
training-worthy subset before training and selected exactly one next action:
`stop_until_supported_training_data_exists`. The autonomous loop is stopped
until the human supplies or approves supported training data, source/rights
strategy, annotation/quality repair, or another explicit route that can produce
a reviewable two-or-more-label training subset. Do not continue with local
training, Brev training, manifest/tensor materialization, source import,
source-register approval, pseudo-labeling, browser activation, model promotion,
or final-gate changes from the current evidence.

**Current project truth:**

- The browser model remains fail-closed: `web/public/model/model-card.json`
  is not trained, and no final readiness or trained-browser claim is active.
- Brev CLI auth is now unblocked by the human Safari login. `brev ls --json`
  works for the active org and shows `asl-pilot-rawframe-001` / `2hl1hytty`.
  Cost control remains active: repeated `brev stop` attempts by name, id, and
  `--all` return cleanly or print the workspace name, but fresh verification on
  2026-05-27 still reports the workspace `RUNNING` with
  `instance_kind=gpu`, `gpu="A100"`, and
  `instance_type="massedcompute_A100_sxm4_80G_DGX"`. Treat this as a live
  provider/cost-control blocker until a later `brev ls --json` proves the GPU
  is detached or stopped. Do not delete/reset the workspace without explicit
  human approval. Mission 3BR must not run Brev commands. Any future Brev
  training prompt must still record worker state, listed price, command, max
  runtime/spend, kill condition, expected signal, artifact copyback, and
  cleanup/default-off verification before remote execution.
- User compute intent for the overnight push is approximately the existing
  `$100` Brev balance plus up to another `$150`, about `$250` total. This is
  approval to use paid compute only after a route is supported by evidence,
  route/cost are logged, duplicate workers are avoided, and idle workers are
  stopped.
- M3BL and observer escalation are now historical evidence, not the active
  destination. Their no-ML recommendation explains why the loop drifted to
  product fallback; it does not override the latest user instruction to isolate
  dataset/training blockers.
- M3AU materialized ASL Citizen high-signal region-grid manifests and tensors
  under `data/manifests/lesson/high-signal-region-grid/` and
  `data/tensors/asl-citizen-high-signal-region-grid/`.
- M3AU proved those generated manifests expose `rgb_regions_grid_v1` for
  `139/139` selected clips: train `84`, validation `27`, and test `28`.
- M3AV added `true_temporal_convnet_region_grid`, a random-initialized residual
  causal dilated TemporalConvNet architecture with no pretrained components.
- M3AW local smoke failed held-out signal, but M3AX proved the same path can
  memorize a seven-clip subset. Treat this as evidence that the root issue may
  be data, split, crop/ROI, label mapping, or generalization, not necessarily a
  completely dead training loop.
- M3AY found held-out prediction collapse, empty train-to-held-out signer
  overlap, and crop-stat drift. M3BA/M3BB/M3BC/M3BD then concluded the current
  high-signal ASL Citizen subset is not training-worthy. M3BN explained the
  cause as unresolved crop/ROI and label-level held-out support drift, not a
  dead dataloader, pure compute failure, or missing full-landmark stack.
- PopSign remains a locally evidenced approved video route with prior Tier 0
  diagnostic training and Detector 0/crop-normalization receipts. It has not
  yet produced a promoted signer-disjoint recognizer.
- SemLex / ASL-LEX remains part of the original plan as a possible phonology
  source, but current M3BK/M3BL evidence says ASL-LEX video use is blocked,
  SemLex is absent from the source register, and no repo-local SemLex/ASL-LEX
  phonology surface is available.
- M3BN explicitly classified missing full hand/posture/face landmarks as future
  robustness work, not the current required blocker. M3BO narrowed the current
  repair to a manifest-bound manual coarse ROI packet for ten ASL Citizen
  high-signal held-out drift rows.
- M3BP found all ten M3BO drift rows viewable and cleared coarse ROI inclusion
  for the existing five-region tensor package. It found zero rows requiring
  crop-config repair and zero rows blocked by missing viewable evidence.
- M3BP still found no training-worthy retained subset. `hello` is the only
  plausible ROI-visibility candidate, but one label is insufficient and
  held-out zero-recall / never-predicted gates plus crop-stat drift remain
  unresolved for the current seven-label set.
- M3BQ cleared class-index mapping and tensor validity for the current
  seven-label set but found no retained training-worthy labels. The current
  labels are blocked by split/stat drift, source-quality suspicion,
  insufficient held-out support, or prior zero-recall / never-predicted gates
  rather than by class-index mapping or tensor availability.

**First reviewable slice:**

Follow the active M3BR prompt. Complete exactly one local/no-spend, no-training
vocabulary reselection packet and write
`docs/validation/return-to-form-vocab-reselection-existing-local-artifacts-v1.json`.
The packet must inventory already-approved local artifacts, explicitly exclude
blocked/stale/unsupported/nonlocal sources, decide whether a better 2+ label
candidate subset exists before training, record exact evidence paths and
remaining gates, preserve no-pretrained and fail-closed boundaries, and choose
exactly one next action.

Completion bias: M3BR is reselection diagnosis only. It is not training, not
source import, not source approval, not pseudo-labeling, not Detector 0 or
schema repair, not crop-config mutation, not Brev, and not product fallback. If
existing local approved artifacts cannot support a 2+ label candidate subset,
record the exact human source/annotation/strategy blocker instead of guessing.

## exit condition for Mission 3BR

All applicable items must be true before this mission can close:

1. `GOAL.md` points at
   [`docs/model/return-to-form-vocab-reselection-existing-local-artifacts-goal-loop-prompt.md`](docs/model/return-to-form-vocab-reselection-existing-local-artifacts-goal-loop-prompt.md)
   and names Mission 3BR.
2. A tracked JSON receipt exists at
   `docs/validation/return-to-form-vocab-reselection-existing-local-artifacts-v1.json`.
3. The packet inventories already-approved local artifacts and records evidence
   paths.
4. The packet explicitly excludes blocked, stale, unsupported, or nonlocal
   sources.
5. The packet decides whether a 2+ label candidate subset exists before
   training.
6. The packet records the next required gates for any candidate subset.
7. The packet preserves the M3BQ finding that mapping and tensor validity are
   clear for the failed seven-label set but that the retained-label gate failed.
8. No source import, source-register approval, manifest/tensor mutation,
   crop-config mutation, recognizer training, Detector 0 training, Brev
   command, export, browser activation, model-card promotion, final-gate
   change, unsupported claim, or push occurs.
9. `node scripts/audit_return_to_form_plan.mjs --json`,
   `node scripts/audit_loop_premise.mjs --json`,
   `node scripts/audit_no_pretrained_deps.mjs`,
   `node scripts/audit_no_pretrained_artifact_json.mjs`, receipt JSON
   validation, and `git diff --check` exit 0 or record exact blockers.
10. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

When these are satisfied, the observer should CONTINUE, REDIRECT, ESCALATE, or
STOP based on the evidence-backed next action in the receipt. The observer must
not allow another training-style retry until the reselection packet yields at
least two training-worthy labels and a separate training receipt records gates
and compute boundaries.

## historical mission (Mission 3BM - Lesson local practice replay no-ML)

The active autonomous worker is **Codex executor**, observed by a separate
**Codex observer**. Do not start or resume Claude/Happy as the project
orchestrator. The abandoned Claude Internet Archive contact-sheet work is
reversibly quarantined in a git stash named `quarantine abandoned Claude IA
contact-sheet slice before Codex takeover`; it is not active evidence and must
not be promoted without a deliberate recovery decision.

**Historical per-milestone prompt:** [`docs/model/return-to-form-lesson-local-practice-replay-no-ml-goal-loop-prompt.md`](docs/model/return-to-form-lesson-local-practice-replay-no-ml-goal-loop-prompt.md).

**Historical activation:** Mission 3BL completed at `7311c93` with a local/no-spend,
no-import SemLex / ASL-LEX source-register candidate proposal. The proposal
found no repo-local non-media SemLex/ASL-LEX metadata or phonology surface,
made no source-register edit, preserved all fail-closed claim surfaces, and
selected `escalate_strategy_research`. The Codex observer ran the required
OpenAI API strategy escalation and saved
[`artifacts/research/observer-357-post-semlex-strategy-api-response.md`](artifacts/research/observer-357-post-semlex-strategy-api-response.md).
That advisory memo rejects Brev, training, source work, Detector 0 repair,
vocabulary/data repair, SemLex/ASL-LEX continuation, and browser recognition
activation for that now-superseded moment, and recommended exactly one
no-compute fail-closed product slice: a local-only `/lesson` practice/replay
loop for self/human review.

**Historical project truth at M3BM activation:**

- The browser model remains fail-closed: `web/public/model/model-card.json`
  is not trained, and no final readiness or trained-browser claim is active.
- Brev CLI auth is now unblocked by the human Safari login. `brev ls --json`
  works for the active org and shows `asl-pilot-rawframe-001` / `2hl1hytty`.
  Cost control remains active: repeated `brev stop` attempts by name, id, and
  `--all` return cleanly or print the workspace name, but fresh verification on
  2026-05-27 still reports the workspace `RUNNING` with
  `instance_kind=gpu`, `gpu="A100"`, and
  `instance_type="massedcompute_A100_sxm4_80G_DGX"`. Treat this as a live
  provider/cost-control blocker until a later `brev ls --json` proves the GPU
  is detached or stopped. Do not delete/reset the workspace without explicit
  human approval. Mission 3BM did not run Brev commands. Any future Brev
  training prompt must still record worker state, listed price, command, max
  runtime/spend, kill condition, expected signal, artifact copyback, and
  cleanup/default-off verification before remote execution.
- User compute intent for the overnight push is approximately the existing
  `$100` Brev balance plus up to another `$150`, about `$250` total. This is
  approval to use paid compute only after Brev auth works, route/cost are
  logged, duplicate workers are avoided, and idle workers are stopped.
- Latest objective, renewed on 2026-05-27: keep driving the supervised pair
  toward the full interactive product, including bounded Brev usage,
  scratch-trained Detector 0 / crop-normalization, TCN-style recognizer work,
  intentional vocabulary/source choices, product interactivity, exhaustive
  testing, and research/backtracking when evidence shows an approach is not
  moving. This objective does not authorize broad training without a contract,
  pretrained promoted-lane components, source shortcuts, or final-readiness
  claims without validation evidence.
- The training CLI now has a no-training `--require-input-contract` guard that
  distinguishes `rgb_frames_fallback` from `rgb_regions_grid_v1`.
- M3AU materialized ignored high-signal ASL Citizen region-grid manifests and
  tensors under `data/manifests/lesson/high-signal-region-grid/` and
  `data/tensors/asl-citizen-high-signal-region-grid/`.
- M3AU proved those generated manifests expose `rgb_regions_grid_v1` for
  `139/139` selected clips: train `84`, validation `27`, and test `28`.
- M3AV added `true_temporal_convnet_region_grid`, a random-initialized residual
  causal dilated TemporalConvNet architecture with no pretrained components.
- M3AW added the region-axis-preserving dataset/model path and one local smoke
  contract. The smoke is non-promotional diagnostic evidence only.
- M3AX added a narrow tiny-overfit helper and proved the current
  `true_temporal_convnet_region_grid` path can memorize a seven-clip subset.
- M3AY found that M3AW held-out predictions collapsed to three predicted labels
  on validation and test; `please`, `sad`, `table`, and `white` were never
  predicted on both held-out splits; train/validation and train/test signer
  overlap were both `[]`; and descriptive crop-stat centroids showed same-label
  held-out drift losing to another train label for ten split-label rows.
- M3AZ ranked remediation lanes as `split_signer_contract`,
  `crop_region_contract`, `vocab_subset_contract`, `data_quality_contract`,
  and `product_fallback_scope`, and selected the split/signer contract because
  empty train-to-held-out signer overlap plus prediction collapse must be
  resolved before another training prompt.
- M3BA verified `139` manifest-bound tensors, selected
  `signer_disjoint` as diagnostic-only until crop/region and label-level gates
  pass, kept train/validation/test signer overlap empty, and held `please`,
  `sad`, `table`, and `white` for repair before any next training prompt.
- M3BD proved no current training-worthy subset exists and no paid Brev
  micro-experiment is supported by existing evidence.
- M3BE proved one bounded fail-closed product implementation slice can improve
  the learner experience while preserving `not_trained` claims.
- M3BF completed the practice surface and left lesson as the next bounded
  learner-facing surface.
- M3BG completed the lesson surface and left validation transparency as the
  remaining bounded product surface before any no-promotion final-gap audit.
- M3BH completed the validation transparency surface and selected a local
  no-promotion final-readiness gap audit.
- M3BI completed the no-promotion final gap audit. `/`, `/lesson`, and
  `/validation` are adequate for fail-closed human product review, but all
  trained-recognition surfaces remain `not_trained` / inactive.
- M3BJ completed post-review route recovery. Its receipt recorded Brev auth as
  blocked, but a later human Safari login restored CLI auth. Later verification
  showed `asl-pilot-rawframe-001` still reporting `RUNNING` on an A100 after
  repeated stop attempts. Treat this as the current cost-control truth unless a
  fresh `brev ls --json` proves the worker is stopped or detached. No paid
  training ran in M3BJ, no source import or claim change occurred, and
  SemLex/ASL-LEX source plus vocabulary-overlap review was the selected local
  no-training handoff.
- M3BK completed the SemLex / ASL-LEX source and vocabulary-overlap review. It
  wrote
  `docs/research/semlex-asl-lex-overlap-source-review-v1.json`, confirmed
  ASL-LEX video use is blocked, confirmed SemLex is absent from the source
  register, found no repo-local SemLex/ASL-LEX/phonology artifact, matched
  `0/100` content vocabulary items because no local external term surface
  exists, and selected
  `continue_semlex_source_register_candidate_no_import`.
- M3BL completed the SemLex / ASL-LEX source-register candidate proposal. It
  wrote
  `docs/research/semlex-source-register-candidate-no-import-v1.json`,
  recorded ASL-LEX as blocked for video/training use, recorded SemLex as absent
  from the source register, found no usable repo-local non-media
  metadata/phonology surface, made no source-register edit, and selected
  `escalate_strategy_research`.
- Observer escalation artifact
  `artifacts/research/observer-357-post-semlex-strategy-api-response.md`
  recommended a no-ML `/lesson` local practice/replay slice and rejected Brev,
  training, source work, Detector 0, vocabulary/data repair, and browser
  recognition activation for the now-superseded M3BM mission.

**Historical first reviewable slice:**

M3BM would have completed exactly one local/no-spend, no-ML product slice on
`/lesson`: let a learner use the browser camera to record a short bounded
in-session practice clip, replay it locally, retake it, and clear it. This
slice is not active after the 2026-05-27 dataset/training redirect.

Historical completion bias: M3BM was product interactivity only. If completing the slice
requires ML gates, model-card/claim edits, video upload, persistence, export,
download/share, source approval, source import, Brev, training, validation use,
Detector 0 tracking, box-driven avatar authority, browser activation, final
validation promotion, final-gate changes, or an ASL correctness claim, record
the precise blocker instead of continuing.

## historical exit condition for Mission 3BM

All applicable items must be true before this mission can close:

1. `GOAL.md` points at
   [`docs/model/return-to-form-lesson-local-practice-replay-no-ml-goal-loop-prompt.md`](docs/model/return-to-form-lesson-local-practice-replay-no-ml-goal-loop-prompt.md)
   and names Mission 3BM.
2. Exactly one `/lesson` local-only practice/replay slice is completed, or a
   precise blocker is recorded.
3. A tracked receipt exists at
   `docs/validation/return-to-form-lesson-local-practice-replay-no-ml-v1.json`
   and records changed files, no-compute status, no-upload/no-persistence/
   no-export proof, unchanged fail-closed ML gates, tests/audits run,
   non-promotion language, blockers, and exactly one next action.
4. Raw learner video remains browser-local and ephemeral: no server upload,
   API submission, WebSocket/video streaming, `fetch`/XHR carrying video/blob
   data, localStorage/IndexedDB/Cache API/filesystem persistence, download,
   share, or export path is added.
5. Model-card, claim-matrix, active-vocabulary, browser-bundle, Detector 0,
   and final-claim surfaces remain fail-closed and unchanged.
6. No source import, source approval expansion, source-register edit,
   SemLex/ASL-LEX validation or training use, generated pseudo-labels,
   manifest/tensor mutation, Brev action, training, fitting, checkpoint,
   export, browser activation, final-gate change, final validation promotion,
   Detector 0 tracking, box-driven avatar authority, positive recognition/
   pass/fail outcome, ASL correctness claim, or push occurs.
7. The tactical overlay in
   [`docs/model/return-to-form-plan.md`](docs/model/return-to-form-plan.md)
   names the M3BM prompt, expected receipt, prior evidence, and exactly one
   next action choice set.
8. `node scripts/audit_return_to_form_plan.mjs --json`,
   `node scripts/audit_loop_premise.mjs --json`,
   `node scripts/audit_no_pretrained_deps.mjs`,
   `node scripts/audit_no_pretrained_artifact_json.mjs`,
   `node scripts/audit_final_claim_matrix.mjs`, relevant lesson/privacy/web
   validation commands, receipt JSON validation, and `git diff --check` exit 0
   or record exact blockers.
9. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

When these are satisfied, the observer should CONTINUE or REDIRECT only if the
receipt selects exactly one bounded fail-closed no-ML product follow-up. It
should STOP if the next action truly requires human content/product review,
source approval, manual annotation/data collection, Brev password/2FA or paid
compute, training, manifest/tensor mutation, final-gate changes, export/browser
activation, product overclaims, source-register approval, or another human-only
decision.

## historical mission (Mission 3AQ - ASL Citizen reduced module local training smoke)

The active autonomous worker is **Codex executor**, observed by a separate
**Codex observer**. Do not start or resume Claude/Happy as the project
orchestrator. The abandoned Claude Internet Archive contact-sheet work is
reversibly quarantined in a git stash named `quarantine abandoned Claude IA
contact-sheet slice before Codex takeover`; it is not active evidence and must
not be promoted without a deliberate recovery decision.

**Active per-milestone prompt:** [`docs/model/return-to-form-asl-citizen-reduced-module-local-training-smoke-goal-loop-prompt.md`](docs/model/return-to-form-asl-citizen-reduced-module-local-training-smoke-goal-loop-prompt.md).

**Activation:** Mission 3AP completed the local/no-spend reduced real-data
script contract at `e656d7f`, and the observer recorded STOP at `e35d642`
because the next action required a training/Brev scope decision. The user has
now authorized continued progress toward the full overnight objective. The next
loop is authorized to add and run exactly one bounded local MPS training-smoke
contract for the seven-label real ASL Citizen reduced module. It is not
authorized for Brev spend, Detector 0 training, source import, export,
promotion, broad label expansion, or browser activation.

**Current project truth:**

- Mission 3AI remains the strongest honest reduced-demo package: `/`,
  `/lesson`, and `/validation` have refreshed evidence and the browser model
  remains fail-closed.
- Mission 3AH produced real but non-promotable PopSign-only Tier 0 evidence:
  `train_accuracy_epoch_8=0.904`, `best_validation_accuracy=0.376`, and
  `test_top1=0.47368421052631576`; negative challenge was not evaluated and
  promotion was not justified.
- Mission 3AJ is complete at `a131a96`: refreshed ASL Citizen diagnostic
  manifests, strict lesson-milestone manifests, ASL Citizen provenance
  validation, and the no-training `--lesson-milestone --check-files
  --dry-run` gate all passed.
- Mission 3AK is complete at `39cedd0` with observer STOP `e284e01`: all 494
  ASL Citizen lesson tensors were materialized, one local MPS epoch completed
  from random initialization with `pretrained_components: []`, and local smoke
  metrics were `train_accuracy=0.03` and
  `validation_accuracy=0.09574468085106383`.
- The approved source for this mission is
  `asl-citizen-school-assignment-raw-videos`, with strict manifests at
  `data/manifests/lesson/rawframe-milestone/{train,validation,test}.json`.
- Mission 3AL is complete at `106e091` with observer STOP `cc637bd`: the A100
  run reached `final_train_accuracy=0.9966666666666667`,
  `best_validation_accuracy=0.20212765957446807`, and copied artifacts back
  without promotion/export/browser activation.
- Mission 3AM is complete at `4f2ad7c`: the tracked generalization diagnosis
  classified the failure as `data_split_support`, with secondary
  `architecture_capacity_or_regularization` and `source_domain` hypotheses,
  and selected `reduce_to_high_signal_5_10_sign_module`.
- M3AM diagnostic metrics: `validation_top1_accuracy=0.20212765957446807`,
  `test_top1_accuracy=0.21`, `test_macro_f1=0.16913707345286294`,
  `core_negative_false_pass_rate=0.04`, selected threshold `0.99`, and no
  calibrated provenance written.
- Mission 3AN is complete at `a26a860`: the tracked module-selection artifact
  selected `table`, `please`, `black`, `hello`, `uncle`, `white`, and `sad`,
  rejected the other 18 labels, and selected
  `materialize_high_signal_module_manifests_and_gates`.
- Mission 3AN selection:
  [`docs/validation/return-to-form-asl-citizen-high-signal-module-selection-v1.json`](docs/validation/return-to-form-asl-citizen-high-signal-module-selection-v1.json).
- Mission 3AN selection is evidence-backed but weak: only `table` is strong;
  the other six labels have nonzero but low signer-disjoint validation/test
  recall. Treat this as a reduced learnability module, not a promotion claim.
- Mission 3AO is complete at `35969f8`: reduced high-signal manifests exist at
  `data/manifests/lesson/high-signal-module/{train,validation,test}.json`,
  with 84 train clips / 19 signers, 27 validation clips / 5 signers, and 28
  test clips / 7 signers. The manifest/gate receipt records preserved
  provenance, signer-disjoint splits, and selected
  `add_reduced_real_data_manifest_contract`.
- Mission 3AO receipt:
  [`docs/validation/return-to-form-asl-citizen-high-signal-module-manifest-gates-v1.json`](docs/validation/return-to-form-asl-citizen-high-signal-module-manifest-gates-v1.json).
- Mission 3AP is complete at `e656d7f`: `scripts/train_rawframe_model.py` now
  has an honest `--reduced-real-data-module --check-files --dry-run` contract
  for the high-signal manifests, and it rejects non-dry-run training and
  `--allow-small-label-set`.
- Mission 3AP receipt:
  [`docs/validation/return-to-form-asl-citizen-reduced-real-data-contract-v1.json`](docs/validation/return-to-form-asl-citizen-reduced-real-data-contract-v1.json).
- The repo-local `.venv/bin/python` imports `torch 2.12.0` and sees MPS
  available. Use that environment for this local no-spend slice.
- Brev provider state remains a human/provider blocker because CLI auth
  currently fails at `brev ls --json` with a login EOF. No Brev command, stop
  spam, worker delete/reset, duplicate worker, or remote training is authorized
  in Mission 3AQ.
- This mission must add the smallest explicit reduced-module training-smoke
  mode needed to run one bounded local MPS training smoke on the seven-label ASL
  Citizen reduced module without weakening final, lesson-milestone,
  no-pretrained, source, decode-provenance, or hard-negative gates. It must not
  export ONNX, promote a model card, activate browser recognition, push,
  delete/reset the worker, or claim final readiness.

**First reviewable slice:**

Follow the active prompt's local/no-spend training-smoke slice. Inspect
`scripts/train_rawframe_model.py` and `scripts/evaluate_rawframe_model.py`, add
a distinct reduced-module training-smoke mode for the seven-label ASL Citizen
manifests, prove the dry-run path, run one bounded local MPS smoke if the
environment supports it, write/update a tracked receipt with metrics or exact
blocker, update the tactical overlay with exactly one next action, validate
locally, log, and commit scoped script/evidence/doc files.

## exit condition for Mission 3AQ

All applicable items must be true before this mission can close:

1. `GOAL.md` points at
   [`docs/model/return-to-form-asl-citizen-reduced-module-local-training-smoke-goal-loop-prompt.md`](docs/model/return-to-form-asl-citizen-reduced-module-local-training-smoke-goal-loop-prompt.md)
   and names Mission 3AQ.
2. The executor uses the M3AN-M3AP receipts and reduced ASL Citizen manifests
   instead of importing sources or broadening labels.
3. A reduced-module training-smoke mode exists and is distinct from
   `--allow-small-label-set`, `--reduced-real-data-module`,
   `--lesson-milestone`, and final evidence modes.
4. A dry-run/check-files command validates the high-signal manifests through
   the new training-smoke contract or records a precise local blocker.
5. A bounded local MPS training smoke completes with tracked metrics, or the
   receipt records the exact environment/script blocker.
6. A tracked receipt under `docs/validation/` records command output, metrics
   or blocker, hashes, boundaries, and exactly one next action.
7. The tactical overlay in
   [`docs/model/return-to-form-plan.md`](docs/model/return-to-form-plan.md)
   names the contract receipt and exactly one next action.
8. If the selected next action needs a new milestone, a bounded
   `docs/model/return-to-form-*-goal-loop-prompt.md` exists with acceptance
   criteria and hard stops.
9. `node scripts/audit_return_to_form_plan.mjs --json`,
   `node scripts/audit_loop_premise.mjs --json`,
   `node scripts/audit_source_register.mjs`,
   `node scripts/audit_no_pretrained_deps.mjs`,
   `node scripts/audit_no_pretrained_artifact_json.mjs`,
   `python3 -m py_compile scripts/train_rawframe_model.py scripts/evaluate_rawframe_model.py`,
   and `git diff --check` exit 0.
10. No Brev sync/exec/training/spend, Detector 0 training, source import,
    generated pseudo-label, pretrained component, ONNX export, model-card
    promotion, threshold promotion, browser activation, final-readiness
    overclaim, destructive reset, worker delete/reset, duplicate worker
    creation, amend, or push occurs.
11. A numbered session log records commands, evidence, blockers, and exactly one
   next action.

When these are satisfied, the observer should STOP if the selected next action
requires Brev/provider auth, paid compute, human data collection, source
approval, final-gate changes, or a user decision. It may CONTINUE only for
another local/no-spend script-contract/remediation subtask already specified in the
active prompt.

## historical mission (Mission 3AI - Reduced product final QA)

The active autonomous worker is **Codex executor**, observed by a separate **Codex observer**. Do not start or resume Claude/Happy as the project orchestrator. The abandoned Claude Internet Archive contact-sheet work is reversibly quarantined in a git stash named `quarantine abandoned Claude IA contact-sheet slice before Codex takeover`; it is not active evidence and must not be promoted without a deliberate recovery decision.

**Active per-milestone prompt:** [`docs/model/return-to-form-reduced-product-final-qa-goal-loop-prompt.md`](docs/model/return-to-form-reduced-product-final-qa-goal-loop-prompt.md).

**User activation:** after the Mission 3AH data/vocabulary STOP, the user asked
for the pair to be pushed forward and kept on track. This mission resumes the
loop only for reduced product, validation, claim, smoke, and handoff work. The
M3AH data/source decision remains binding for ML: do not run more recognizer or
Detector 0 training, source import, ONNX export, model-card promotion, or Brev
training unless the user explicitly selects a new data/source scope.

**Current project truth:**

- [`docs/model/return-to-form-plan.md`](docs/model/return-to-form-plan.md) is
  still the active steering artifact. Keep its Original Plan Spine, Milestone
  Ladder, Observer Transition Rules, and Mutable Tactical Overlay authoritative
  unless the user explicitly changes the project premise.
- Mission 3AH produced real but non-promotable ML evidence. The full-split
  Tier 0 CUDA recognizer ran from random initialization and reached
  `train_accuracy_epoch_8=0.904`, `best_validation_accuracy=0.376`, and
  `test_top1=0.47368421052631576`; negative challenge was not evaluated and
  promotion was not justified.
- [`docs/validation/return-to-form-overnight-tier0-data-vocabulary-decision-v1.json`](docs/validation/return-to-form-overnight-tier0-data-vocabulary-decision-v1.json)
  selected `stop_with_reduced_claim` /
  `stop_for_human_data_source_scope_decision`. The product may continue as a
  learn-only demo, but the ML promotion lane is parked until a later explicit
  data/source decision.
- The Tier 0 vocabulary remains:
  `please`, `table`, `dad`, `grandpa`, `hat`. PopSign v1 raw videos remain the
  current approved source for this pilot, but the current Tier 0 set is reduced
  demo lesson vocabulary, not promotable recognizer evidence.
- The active browser model remains fail-closed:
  `web/public/model/model-card.json` is `status: "not_trained"`,
  `docs/model/active-vocabulary-claim.json` has `activeLabels: []`, browser
  recognition is disabled, Detector 0 tracking is disabled, and
  box-driven-avatar tracking is disabled.
- `/`, `/lesson`, and `/validation` are the reduced product surfaces. Mission
  3AI should refresh these surfaces and their evidence so a reviewer sees the
  current truth after M3AH, not stale M3AG wording.
- Brev remains a cost-control blocker, not an active compute plan. The worker
  `asl-pilot-rawframe-001` / `2hl1hytty` still reports `RUNNING` after
  stop-by-name, stop-by-id, and `--all`; no active training process was found.
  Do not delete/reset the worker without explicit human approval, and do not
  repeat stop attempts every loop only to rediscover the same provider state.

**First reviewable slice:**

Follow the active prompt's 3AI-A Validation Status Refresh. Inspect the
claim-matrix generator, `/validation`, and current claim matrices, then update
only the smallest surface needed so `/validation` reflects Mission 3AH's
failed-promotion evidence and Mission 3AI's reduced product QA state while
preserving `not_trained` model truth.

## exit condition for Mission 3AI

All applicable items must be true before this mission can close:

1. `GOAL.md` points at
   [`docs/model/return-to-form-reduced-product-final-qa-goal-loop-prompt.md`](docs/model/return-to-form-reduced-product-final-qa-goal-loop-prompt.md)
   and names Mission 3AI.
2. `node scripts/audit_return_to_form_plan.mjs --json`,
   `node scripts/audit_loop_premise.mjs --json`,
   `node scripts/audit_source_register.mjs`,
   `node scripts/audit_no_pretrained_deps.mjs`, and
   `node scripts/audit_no_pretrained_artifact_json.mjs` exit 0.
3. `/validation` and both claim matrices reflect M3AH's failed-promotion
   evidence and Mission 3AI's reduced-product QA state.
4. The active browser model remains fail-closed:
   `model-card.status=not_trained`, browser recognition disabled, Detector 0
   tracking disabled, and active CV labels empty.
5. `/`, `/lesson`, and `/validation` have current smoke/static evidence or a
   precise recorded runtime blocker.
6. Any product changes preserve local-only camera semantics and do not upload
   raw learner video.
7. No pretrained CV/sign/landmark/model dependency, raw learner video upload,
   final-readiness overclaim, source approval shortcut, duplicate Brev worker,
   destructive reset, push, hand-edited model-card promotion, source import,
   recognizer training, Detector 0 training, ONNX export, threshold promotion,
   or Brev spend occurs.
8. Brev's sticky `RUNNING` status is recorded as a human cost-control blocker
   unless the user explicitly approves provider-level action.
9. A final reduced-demo evidence package exists or the observer records the
   exact remaining product blocker.

When these are satisfied, the observer should queue the next listed product QA
milestone from the active prompt, stop with a truthful final evidence package,
or escalate only a concrete product/claim technical blocker.

## historical mission (Mission 3AG - Human demo review)

The active autonomous worker is **Codex executor**, observed by a separate **Codex observer**. Do not start or resume Claude/Happy as the project orchestrator. The abandoned Claude Internet Archive contact-sheet work is reversibly quarantined in a git stash named `quarantine abandoned Claude IA contact-sheet slice before Codex takeover`; it is not active evidence and must not be promoted without a deliberate recovery decision.

**Active per-milestone prompt:** [`docs/model/return-to-form-human-demo-review-goal-loop-prompt.md`](docs/model/return-to-form-human-demo-review-goal-loop-prompt.md).

**User activation:** the user explicitly asked to push forward from the
Mission 3AF `stop_human_demo_review` state and get the pair back on track, with
GPT Pro research reserved for real technical blockers. Mission 3AG is the
selected scope: human demo review and polish for the reduced learn-only app.
M3AF remains the current claim source, and M3AE-AP remains the current ML
evidence source. This mission still blocks Detector 0/recognizer training,
export, source approval, product-threshold promotion, final readiness claims,
and Brev compute.

**Prior observer stop:** Mission 3AF closed at `1ca9590` with
`next_action=stop_human_demo_review`; observer commit `9700cbf` parked the loop
until a human selected a follow-up. The user has now selected the follow-up:
review and polish the reduced human demo path. Do not continue into ML or
source work unless a later explicit user instruction changes scope.

**Observer stop:** Mission 3AG closed at `7d24f07` with
`next_action=stop_for_live_demo`. The loop is halted because the reduced
learn-only `/`, `/lesson`, and `/validation` demo path has been reviewed and
the two bounded demo blockers found so far were removed. Do not remove the
stop sentinel or continue the autonomous loop until a human live-reviews the
demo path or explicitly selects new content/UX, data/source, cost-control, or
research scope.

**Current project truth:**

- [`docs/model/return-to-form-plan.md`](docs/model/return-to-form-plan.md) is the active steering artifact. It has a stable **Original Plan Spine**, a **Milestone Ladder**, observer transition rules, and a mutable **Tactical Overlay**.
- Mission 3AB closed at `2d77eaf`: the repo was redirected away from broad rawframe retries and into the return-to-form plan.
- Mission 3AC closed at `ffb7dd1`: the selected Tier 0 proof labels are `please`, `table`, `dad`, `grandpa`, and `hat`; source coverage, fixed crop protocol, and pre-training gates are now committed before training.
- Mission 3AD closed at `a6babe7`: Tier 0 manifests, fixed-crop tensors, and dataloader batches are proven for the selected PopSign-only 5-sign set. The receipt is [`docs/validation/return-to-form-tier0-decode-dataloader.json`](docs/validation/return-to-form-tier0-decode-dataloader.json).
- Mission 3AE closed at `2805692`: the bounded Tier 0 learnability smoke failed train sanity and validation signal. [`docs/validation/return-to-form-tier0-learnability-smoke.json`](docs/validation/return-to-form-tier0-learnability-smoke.json) records `train_top1=0.376`, `train_macro_recall=0.376`, `validation_top1=0.256`, and `validation_macro_recall=0.256`; `dad` and `grandpa` had zero train recall. The same report records that `RawFrameClipDataset` read the `rgb_frames` compatibility tensor while `rgb_regions` remained hash-bound region proof, which M3AE-R verified as a real input-contract mismatch.
- Mission 3AE-R closed at `48c68b7`: [`docs/validation/return-to-form-tier0-remediation-diagnostic.json`](docs/validation/return-to-form-tier0-remediation-diagnostic.json) classified the first concrete failure as `tensor_payload_preprocessing`. All 45 sampled payloads contained `rgb_regions`, but `RawFrameClipDataset` consumed only the `rgb_frames` compatibility tensor, which matched the `upper_body_signing_space` region slice.
- Mission 3AE-F closed at `bd3d98f`: [`docs/validation/return-to-form-tier0-tensor-contract.json`](docs/validation/return-to-form-tier0-tensor-contract.json) passed on 45 sampled train/validation/test payloads. The training/evaluation path now consumes `rgb_regions` and derives `rgb_regions_grid_v1`, with recorded region order and `fallback_to_rgb_frames_count=0`.
- Mission 3AE-G closed at `62ff3dd`: [`docs/validation/return-to-form-tier0-learnability-smoke-rerun.json`](docs/validation/return-to-form-tier0-learnability-smoke-rerun.json) reran the bounded Tier 0 smoke on the corrected `rgb_regions_grid_v1` input path and failed. It records `train_top1=0.312`, `train_macro_recall=0.312`, `validation_top1=0.224`, `validation_macro_recall=0.224`, `test_top1=0.200`, `test_macro_recall=0.200`, zero train recall for `dad` and `grandpa`, and `next_action=m3ac_m3ad_remediation`.
- Mission 3AE-H closed at `e239d34`: [`docs/validation/return-to-form-tier0-failure-remediation-triage.json`](docs/validation/return-to-form-tier0-failure-remediation-triage.json) found no concrete systematic crop cut-off in retained contact sheets, kept the M3AE-F tensor contract closed, and selected `model_architecture_microprobe` as the next action. The triage classified the active blocker as a model/input-adapter/training-budget fit bottleneck, including `rgb_regions_grid_v1` tile compression into a resized 96x96 input, compact global-pooled 3D architecture, capped train batches, no augmentation, and best-validation checkpoint selection.
- [`artifacts/research/observer-195-tier0-strategy-api-response.md`](artifacts/research/observer-195-tier0-strategy-api-response.md) is the retained advisory API strategy memo for M3AE-I. It says not to run the drafted "same grid input, remove batch caps, 12 epochs" microprobe. The microprobe instead preserved crop identity/scale and tested tiny-subset overfit before any full train-set run.
- Mission 3AE-I closed at `6e1b47b`: [`docs/validation/return-to-form-tier0-model-architecture-microprobe.json`](docs/validation/return-to-form-tier0-model-architecture-microprobe.json) passed the bounded tiny identity-preserving train-fit probe. It loaded `rgb_regions` directly, kept the crop axis explicit, avoided `rgb_regions_grid_v1`, `rgb_frames`, pretrained features, label expansion, source approval, export, and product-readiness claims, and recorded `train_top1=1.0`, `train_macro_recall=1.0`, all five labels at `recall=1.0`, and `next_action=rerun_tier0_smoke_with_microprobe_config`.
- Mission 3AE-J closed at `70f6b52`: [`docs/validation/return-to-form-tier0-microprobe-config-smoke.json`](docs/validation/return-to-form-tier0-microprobe-config-smoke.json) ran one full-split crop-identity-preserving smoke. Train sanity passed (`train_top1=1.0`, `train_macro_recall=1.0`), but validation/test signal stayed near random (`validation_top1=0.216`, `validation_macro_recall=0.216`, `test_top1=0.2736842105263158`), validation `grandpa` recall was zero, and the report selected `next_action=label_or_split_remediation`.
- Mission 3AE-K closed at `bef1ec1`: [`docs/validation/return-to-form-tier0-label-split-remediation.json`](docs/validation/return-to-form-tier0-label-split-remediation.json) found no clip, source-record, signer-hash, or tensor-path overlap across train and validation/test, while preserving the M3AE-J train-fit versus validation/test failure. It classified the blocker as `source_signer_distribution_gap`, with the current PopSign-only preserved split still near random under signer-disjoint validation/test.
- Mission 3AE-L closed at `c7f3818`: [`docs/validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json`](docs/validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json) defined the scratch Detector 0 target schema, manual/manual-verified annotation provenance rules, detector/crop-normalization gates, stop conditions, Brev status, and exactly one next action: `detector0_annotation_packet`.
- Mission 3AE-M closed at `6b237cb`: [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json) created 15 provenance-bound contact-sheet seed rows covering the five Tier 0 labels across train/validation/test, and [`docs/validation/return-to-form-tier0-detector0-annotation-packet-v0-review.md`](docs/validation/return-to-form-tier0-detector0-annotation-packet-v0-review.md) classified all rows as `needs_manual_verification` with exactly one next action: `detector0_annotation_review`.
- Mission 3AE-N closed at `b6df8e0`: [`docs/validation/return-to-form-tier0-detector0-annotation-review-v1.md`](docs/validation/return-to-form-tier0-detector0-annotation-review-v1.md) records a full 15-row packet review: 6 rows `manual_verified`, 8 rows `manual_corrected`, and `det0-v0-test-hat-001502-f005` `rejected_for_insufficient_visual_evidence`. The packet remains `not_ready_for_detector0_training`, with exactly one next action: `detector0_annotation_review_continue`.
- Mission 3AE-O closed at `204e708`: [`docs/validation/return-to-form-tier0-detector0-annotation-followup-v1.md`](docs/validation/return-to-form-tier0-detector0-annotation-followup-v1.md) replaced the rejected held-out `hat` row with approved PopSign test row `det0-v0-test-hat-001503-f010`. The packet now has 15 manual-verified or manual-corrected rows, zero rejected rows, and exactly one next action: `detector0_training_smoke`.
- Mission 3AE-P closed at `c0b05b9`: [`docs/validation/return-to-form-tier0-detector0-training-smoke-v1.json`](docs/validation/return-to-form-tier0-detector0-training-smoke-v1.json) ran a local CPU scratch Detector 0 smoke against the 15-row packet, checked 15 tensor hashes, proved packet/tensor/target/loss/metric wiring, kept Brev no-spend boundaries intact, and selected exactly one next action: `crop_normalization_ablation_design`.
- Mission 3AE-Q closed at `74c3294`: [`docs/validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md`](docs/validation/return-to-form-tier0-crop-normalization-ablation-design-v1.md) defined the bounded fixed-crop versus detector-normalized comparison, preserved no-pretrained/source/Brev boundaries, kept final-promotion blockers separate, and selected exactly one next action: `crop_normalization_ablation_smoke`.
- Mission 3AE-S closed at `fb20a06`: [`docs/validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json`](docs/validation/return-to-form-tier0-crop-normalization-ablation-smoke-v1.json) ran one local MPS no-spend crop-normalization ablation smoke. Detector localization sanity, transform integrity, candidate train sanity, and validation comparison passed, but `fallback_rate_gate` failed because `right_or_second_hand` fallback was `0.8110507246376811` against the `0.60` per-target cap. The receipt selected exactly one next action: `detector0_data_or_target_remediation`.
- Mission 3AE-T closed at `74e87d5`: [`docs/validation/return-to-form-tier0-detector0-data-target-remediation-v1.json`](docs/validation/return-to-form-tier0-detector0-data-target-remediation-v1.json) classified the M3AE-S failure as `optional_second_hand_target_policy_mismatch`, not a transform/source/pretrained issue. The verified packet marks `right_or_second_hand` present in only 3 of 15 rows, all for `table`, so its verified absent rate is `0.8`, already above the M3AE-Q `0.60` per-target fallback cap. The receipt selected exactly one next action: `crop_normalization_optional_target_policy_revision`.
- Mission 3AE-U closed at `b0b794b`: [`docs/validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md`](docs/validation/return-to-form-tier0-crop-normalization-optional-target-policy-v1.md) defines the optional-target fallback policy. Verified absent optional `right_or_second_hand` fallback is report-only, missed present optional fallback remains gate-affecting, required-target fallback gates remain unchanged, and sparse positive support for `table` is retained as a caveat. The artifact selected exactly one next action: `crop_normalization_policy_aware_ablation_smoke`.
- Mission 3AE-V closed at `4ffa8e2`: [`docs/validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json`](docs/validation/return-to-form-tier0-policy-aware-crop-normalization-ablation-smoke-v1.json) applied the M3AE-U policy to the retained M3AE-S ablation evidence. Overall policy-aware fallback narrowed to `0.05253623188405797`, but expected-present `table` right/second-hand missed-present fallback remained `0.8405797101449275`, above the unchanged `0.60` per-target cap. The receipt selected exactly one next action: `detector0_optional_target_support_remediation`.
- Mission 3AE-W closed at `c95e965`: [`docs/validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json`](docs/validation/return-to-form-tier0-detector0-optional-target-support-remediation-v1.json) classified the remaining `table` right/second-hand blocker as `packet_positive_support_scarcity`, with only three reviewed positive rows against 1104 expected-present frame decisions. The receipt selected exactly one next action: `detector0_table_second_hand_packet_expansion_design`.
- Mission 3AE-X closed at `2f737d0`: [`docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md`](docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-expansion-design-v1.md) defined a bounded candidate-selection and review design for additional approved Tier 0 PopSign `table` right/second-hand support. It preserved the approved packet, kept candidates non-approved, targeted up to six new candidates per split with at least five total reviewed positives per split before any retrain or ablation rerun, and selected exactly one next action: `detector0_table_second_hand_candidate_packet_review`.
- Mission 3AE-Y closed at `179e81d`: [`docs/validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md`](docs/validation/return-to-form-tier0-detector0-table-second-hand-candidate-packet-review-v1.md) reviewed 17 candidate-scoped `table` right/second-hand rows from approved Tier 0 PopSign manifests, kept the approved packet unchanged at `ecbd0a53d46cdcc302cbc6c2cb5bb2c7f2049abda0e24328fe82c68118c48f34`, met the M3AE-X target with 7 train, 7 validation, and 6 test candidate-or-existing reviewed positives, and selected exactly one next action: `detector0_table_second_hand_packet_mutation`.
- Mission 3AE-Z closed at `59c99e4`: [`docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json`](docs/validation/return-to-form-tier0-detector0-table-second-hand-packet-mutation-v1.json) added 17 accepted M3AE-Y `table` right/second-hand rows to the approved Detector 0 packet, raising packet rows from 15 to 32 and table right/second-hand support to train 7, validation 7, and test 6. The receipt separates candidate sufficiency from independent-box target-schema risk, records `target_schema_assessment.status=bounded_smoke_usable`, keeps schema revision as the fallback if the smoke fails, and selects exactly one next action: `detector0_expanded_packet_training_smoke`.
- Mission 3AE-AA closed at `8cf1049`: [`docs/validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json`](docs/validation/return-to-form-tier0-detector0-expanded-packet-training-smoke-v1.json) ran a local CPU scratch Detector 0 smoke on the expanded 32-row packet. Train-path sanity passed, but held-out `table` right/second-hand behavior failed (`validation presence=0.2857142984867096`, `test presence=0.3333333432674408`), so the receipt classified the independent left/right target as `needs_two_hand_union_or_contact_region_schema_revision` and selected exactly one next action: `detector0_two_hand_union_schema_revision`.
- Mission 3AE-AB closed at `580122f`: [`docs/validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md`](docs/validation/return-to-form-tier0-detector0-two-hand-union-schema-v1.md) defined `table_two_hand_union_or_contact_region` as a derived union/contact remediation target for `table` rows, using reviewed left/right boxes as evidence only. It preserved no-training/no-Brev boundaries, reserved packet mutation for a later bounded slice, and selected exactly one next action: `detector0_two_hand_union_packet_mutation`.
- Mission 3AE-AC closed at `334e7b1`: [`docs/validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json`](docs/validation/return-to-form-tier0-detector0-two-hand-union-packet-mutation-v1.json) added `table_two_hand_union_or_contact_region` target objects to all 32 existing packet rows without adding rows. It derived 19 present `table` union/contact targets (train 6, validation 7, test 6), marked 12 non-table rows absent, and left `det0-v0-train-table-000376-f010` unresolved because the required 0.02-margin union width is `0.88`, above the M3AE-AB `0.85` threshold. The receipt selected exactly one next action: `detector0_data_or_target_remediation`.
- Mission 3AE-AD closed at `b7e1836`: [`docs/validation/return-to-form-tier0-detector0-union-target-remediation-v1.json`](docs/validation/return-to-form-tier0-detector0-union-target-remediation-v1.json) classified the unresolved row as `schema_threshold_margin_policy_issue`: the raw union width is `0.84`, but the fixed 0.02 context margin expands it to `0.88`, above the M3AE-AB `0.85` cap. No packet correction was made, and the receipt selected exactly one next action: `detector0_two_hand_union_schema_revision`.
- Mission 3AE-AE closed at `3294ce6`: [`docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-v1.md`](docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-schema-revision-v1.md) selected `bounded_adaptive_context_margin`, resolving the `det0-v0-train-table-000376-f010` margin edge case by reducing context to `effective_margin_x=0.005` while preserving raw-union caps. The read-only derivation projected zero unresolved `table` rows and present support train 7 / validation 7 / test 6 after a later packet mutation, with exactly one next action: `detector0_two_hand_union_packet_mutation_continue`.
- Mission 3AE-AF closed at `054a193`: [`docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-packet-mutation-v1.json`](docs/validation/return-to-form-tier0-detector0-two-hand-union-margin-packet-mutation-v1.json) applied the bounded adaptive context-margin semantics to the approved Detector 0 packet without adding rows. It changed one existing `table_two_hand_union_or_contact_region` target, resolved `det0-v0-train-table-000376-f010`, raised union/contact support to train 7 / validation 7 / test 6, left zero unresolved table rows, and selected exactly one next action: `detector0_two_hand_union_training_smoke`.
- Mission 3AE-AG closed at `96310db`: [`docs/validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json`](docs/validation/return-to-form-tier0-detector0-two-hand-union-training-smoke-v1.json) ran one local CPU scratch Detector 0 smoke against `table_two_hand_union_or_contact_region`. The train path fit presence (`1.0`) but failed the box-MAE sanity cap (`0.18746726214885712` > `0.15`), held-out table union/contact presence stayed weak (validation `0.2857142984867096`, test `0.3333333432674408`), and the receipt selected exactly one next action: `detector0_union_target_data_or_schema_remediation`.
- Mission 3AE-AH closed at `35eab66`: [`docs/validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json`](docs/validation/return-to-form-tier0-detector0-union-target-data-schema-remediation-v1.json) found zero packet target-derivation mismatches, zero tensor hash mismatches, and zero M3AE-AG smoke-row alignment mismatches. A train-split median constant-box baseline reached MAE `0.04107142857142857`, below the `0.15` cap, while M3AE-AG smoke train box MAE was `0.18746726214885712`; the diagnostic classified the failure as `smoke_implementation_instrumentation_issue` and selected exactly one next action: `detector0_union_target_training_smoke_continue`.
- Mission 3AE-AI closed at `ebe1398`: [`docs/validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json`](docs/validation/return-to-form-tier0-detector0-union-target-training-smoke-continue-v1.json) completed the row-level instrumentation repair and ran exactly one local CPU smoke rerun. The run again fit train presence (`1.0`) but failed train box sanity (`train_present_box_mae=0.18746726214885712`) and remained far worse than the train median constant-box baseline (`0.04107142239809036`). The receipt classified the result as `instrumentation_complete_training_path_still_unrepaired` and selected `detector0_union_target_training_smoke_continue`, but the observer escalation rule now blocks another training-style continuation until a current API/GPT diagnostic is bound to local evidence.
- [`artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md`](artifacts/research/observer-249-union-target-smoke-diagnostic-api-response.md) is the current advisory API diagnostic for the M3AE-AG/AH/AI union-target failure. It says another generic scratch Detector 0 training retry is not justified because the instrumented model cannot beat a no-training median box even on train rows; the next slice should establish a standalone target-local median-box baseline report before any further model or crop-normalization work.
- Mission 3AE-AJ closed at `4418284`: [`docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json`](docs/validation/return-to-form-tier0-detector0-union-target-median-baseline-diagnostic-v1.json) reproduced the no-training train-derived median/mean constant-box baseline. The median baseline reached train MAE `0.04107142239809036`, validation MAE `0.02607143111526966`, and test MAE `0.03791666775941849`, beating both M3AE-AG and M3AE-AI trainable smokes on every split. It selected exactly one next action: `detector0_union_target_architecture_reformulation_design`.
- Mission 3AE-AK closed at `1634cc1`: [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md`](docs/validation/return-to-form-tier0-detector0-union-target-architecture-reformulation-design-v1.md) selected `anchor_residual_coordconv_union_target_microprobe_v1` as the only bounded future trainable formulation. It rejects the failed MLP-over-downsampled-full-frame path, anchors residual box prediction at the M3AE-AJ median box, and requires any future microprobe to beat train MAE `0.04107142239809036`, train presence accuracy `1.0`, and train mean IoU `0.6165503859519958` before any held-out behavior check, crop-normalization ablation, recognizer training, export, promotion, or product claim. It selected exactly one next action: `detector0_union_target_architecture_microprobe`.
- Mission 3AE-AL closed at `403c8ee`: [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json`](docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v1.json) ran exactly one local CPU microprobe for `anchor_residual_coordconv_union_target_microprobe_v1`. The train gate passed with presence accuracy `1.0`, present-box MAE `0.02091207727789879` below the M3AE-AJ train median-box MAE `0.04107142239809036`, and present-box mean IoU `0.7846036553382874` above `0.6165503859519958`. Held-out metrics are weak/report-only: validation presence accuracy `0.27272728085517883`, validation present-box MAE `0.08475374430418015`, test presence accuracy `0.4000000059604645`, and test present-box MAE `0.09988119453191757`. It selected exactly one next action: `detector0_union_target_heldout_behavior_check_design`.
- Mission 3AE-AM closed at `e202fde`: [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md`](docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-design-v1.md) defined the next receipt-only held-out behavior check. The design artifact hash is `dba98cd16905f1f768e1849555ded477c5a0a6811668ee9cdae5805b1698d1da`; it binds the future check to existing M3AE-AL row-level predictions, fixed-threshold false-positive/false-negative accounting, validation/test median-baseline comparisons, diagnostic threshold-sweep reporting without threshold selection, and routes the next action to `detector0_union_target_heldout_behavior_check`.
- Mission 3AE-AN closed at `06300a1`: [`docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json`](docs/validation/return-to-form-tier0-detector0-union-target-heldout-behavior-check-v1.json) ran the receipt-only held-out behavior check over existing M3AE-AL predictions. The receipt hash is `7816f5fc69ffabceb63ffa0eb30e26202b36c6a156f464084e0b1c93e5890e87`; fixed-threshold validation was `3` TP, `0` TN, `4` FP, `4` FN, test was `2` TP, `2` TN, `2` FP, `4` FN, validation/test MAE and IoU lost to the M3AE-AJ median baseline, no threshold was selected or promoted, no data/schema invalidation was found, and the exact next action is `detector0_union_target_architecture_remediation`.
- Mission 3AE-AO closed at `9b5ea5d`: [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-remediation-v1.md`](docs/validation/return-to-form-tier0-detector0-union-target-architecture-remediation-v1.md) wrote the design-only architecture remediation artifact. The artifact hash is `57163e841f23abe00382c68d1a8f8b3f0c01d86497dce17bfa6f744d122eeaaf`; it preserved the M3AE-AN held-out failure classification, rejected threshold/product-claim workarounds and immediate ablation/recognizer/export routes, selected `spatial_objectness_anchor_residual_union_target_microprobe_v2`, and set the exact next action to `detector0_union_target_architecture_microprobe_v2`.
- Mission 3AE-AP closed at `075afef`: [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json`](docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json) ran exactly one local CPU no-spend `spatial_objectness_anchor_residual_union_target_microprobe_v2`. The receipt hash is `a6de1a2e8537802927878e5a5810e9e83bbc19263b5d48d72c7b72a7d51ee039`; train gates passed (`presence_accuracy=1.0`, `present_box_mae=0.0015357083175331354`, `present_box_mean_iou=0.9822187423706055`), but held-out presence gates failed (`validation_presence_accuracy=0.3636363744735718`, `validation_false_negative_count=7`, `test_presence_accuracy=0.4000000059604645`, `test_false_negative_count=6`) with no concrete packet/tensor/source/schema invalidation. The exact next action is `stop_reduced_claim`.
- [`artifacts/research/observer-201-localization-strategy-api-response.md`](artifacts/research/observer-201-localization-strategy-api-response.md) is the current advisory API strategy memo after the GPT Pro browser path was unavailable. It recommends splitting the problem into composable localization/crop-normalization and recognition stages, prioritizing a scratch-trained Detector 0 / crop-normalization bootstrap before any further classifier tuning or input tiling work.
- [`docs/research/return-to-form-tier0-remediation-api-synthesis.md`](docs/research/return-to-form-tier0-remediation-api-synthesis.md) records an advisory OpenAI API synthesis for the M3AE failure. Its highest-priority hypothesis is tensor payload mismatch (`rgb_frames` compatibility slice versus `rgb_regions` fixed-crop stack); it is not proof by itself, but it defines the remediation stop rules.
- The broad 75/95-label rawframe route is paused. PopSign-only and PopSign-plus-WLASL controlled clip-heldout runs improved provenance/tensor plumbing but did not show useful learning.
- The latest controlled clip-heldout checkpoint from `76b834b` is retained evidence, not the active next objective. Its training provenance shows validation accuracy near chance for a 95-label problem, so evaluating or retraining that broad route is lower leverage than returning to a small proof.
- Mission 3AG is the active autonomous objective. It may make scoped product,
  copy, validation, documentation, and smoke/audit changes that support human
  demo review of the reduced learn-only app. It must not continue Detector 0
  microprobes, generic training smokes, crop-normalization ablations,
  recognizer training, export, model-card promotion, product-readiness claims,
  threshold promotion, Brev compute, source approval/import, generated labels,
  label expansion, or a broad run.
- Current useful next actions are human-demo review tasks, not autonomous
  training:
  1. inspect `/`, `/lesson`, and `/validation` or their current smoke
     equivalents for demo blockers;
  2. remove one bounded misleading copy, route, layout, camera-state, or
     validation-status blocker if found;
  3. write a human-demo review artifact with inspected paths, commands,
     smoke/browser evidence, Brev status, blockers, and one next action.
- PopSign v1 raw videos remain explicitly cleared for this pilot in [`docs/model/dataset-source-register.json`](docs/model/dataset-source-register.json) under `approved_popsign_v1_original_videos_2026_05_20`.
- Narrow school-assignment source IDs for ASL Citizen and WLASL remain source-register decisions for this noncommercial school project. Broad `asl-citizen` and `wlasl` source ids remain disallowed.
- SemLex / ASL-LEX phonology remains a candidate route from the original plan, not an approved training source. Before any SemLex-backed model work, add or update source-register evidence and write a vocabulary-overlap artifact.
- HandBoxNet / Detector 0 is now the active composable-problem milestone because M3AE-I/J/K show that fixed crops can be memorized but do not generalize under signer-disjoint PopSign validation/test. Detector work must remain scratch-trained and no-pretrained; do not use MediaPipe, OpenPose, YOLO, pretrained landmarks, or pretrained-generated labels in the promoted lane.
- Mission 3T closed the immediate training-quality diagnosis: [`docs/validation/rawframe-training-quality-recovery-diagnostic.json`](docs/validation/rawframe-training-quality-recovery-diagnostic.json) classifies the likely failure as split/source/signer generalization failure with training memorization, not gross tensor corruption.
- Mission 3V corrected the plan-integration error from `5d38ab7`: browser-capture collection is **not** the selected active data route. [`docs/session-logs/169-mission-3v-non-first-party-route-status.md`](docs/session-logs/169-mission-3v-non-first-party-route-status.md) records the correction slice at `34def80`.
- Existing collection-queue/API/UI artifacts are retained as planning evidence only. They do not select collection, do not create clips, do not satisfy source evidence, and must not become the next active slice unless the user explicitly reauthorizes that route later.
- Mission 3Z closed at `76b834b`: WLASL selected diagnostic manifests were decoded and replay-verified, controlled clip-heldout manifests now have zero WLASL clips missing tensor fields, and the controlled clip-heldout training relaunch completed on CUDA. Retained artifacts remain useful for postmortem evidence only.
- `./.venv/bin/python scripts/audit_final_manifests.py` still fails on 12 underfilled final-promotion negative-challenge types. The full 17-type negative-challenge gate remains a final-promotion requirement unless the user explicitly changes it.
- **Brev default-off policy.** The latest user instruction supersedes the older
  "do not stop it" note: if no human-approved remote training job is queued or
  running, stop `asl-pilot-rawframe-001` and verify the stopped state with
  `brev ls --json`. Before stopping, check for active training processes when
  possible. If `brev stop` returns but the workspace remains `RUNNING`, record
  that failed stop verification as a human cost-control blocker; do not delete
  or reset the workspace without explicit user approval.

**No further model/training executor slice should run from M3AE-AP.** The
completed M3AE-AP slice already wrote
[`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json`](docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json)
and selected `stop_reduced_claim`. Mission 3AG may run only the human-demo
review and polish work named in the active prompt.

## exit condition for Mission 3AG

All must be true:

1. `GOAL.md` points at
   [`docs/model/return-to-form-human-demo-review-goal-loop-prompt.md`](docs/model/return-to-form-human-demo-review-goal-loop-prompt.md)
   and records that Mission 3AG is a human-demo review mission after M3AF
   selected `stop_human_demo_review`.
2. [`docs/model/return-to-form-plan.md`](docs/model/return-to-form-plan.md) contains the Original Plan Spine, Milestone Ladder, Observer Transition Rules, and Mutable Tactical Overlay, with M3AE-AO closed and the M3AE-AP receipt plus `stop_reduced_claim` recorded.
3. `node scripts/audit_return_to_form_plan.mjs --json`, `node scripts/audit_loop_premise.mjs --json`, `node scripts/audit_source_register.mjs`, `node scripts/audit_no_pretrained_deps.mjs`, and `node scripts/audit_no_pretrained_artifact_json.mjs` exit 0.
4. Required JSON artifacts remain valid, including source coverage, fixed-crop config, gates, decode/dataloader, remediation diagnostic, tensor contract, Detector 0 bootstrap/training smoke, crop-normalization ablation receipts, optional-target receipts, table second-hand mutation, expanded-packet smoke, the M3AE-AC union mutation receipt, the current Detector 0 packet, and the three `data/manifests/return-to-form-tier0/*.json` manifests.
5. The M3AE-AO remediation design, M3AE-AN held-out behavior receipt, M3AE-AL architecture-microprobe receipt, M3AE-AJ median-baseline receipt, current Detector 0 packet, and Tier 0 manifests remain valid and are used as the comparison source of truth.
6. The microprobe loads only the current approved Detector 0 packet's approved local tensor payloads needed for the run, including `rgb_regions`, frame `frame_index`, and `full_frame_reference`; it must not import unapproved media, mutate packet rows or targets, add rows, approve sources, or use generated/pretrained labels or detectors.
7. A tracked architecture microprobe v2 receipt exists at [`docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json`](docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json) and records the selected formulation, command, device, seed, input representation, architecture/loss summary, row-level train/validation/test predictions, per-split metrics, M3AE-AJ median-baseline comparison, train and held-out gates, no-pretrained/source boundaries, Brev no-spend status, final-promotion blocker separation, and `next_action=stop_reduced_claim`.
8. A tracked reduced-claim validation artifact exists at
   [`docs/validation/return-to-form-reduced-product-claim-v1.md`](docs/validation/return-to-form-reduced-product-claim-v1.md)
   and records current model/tracker readiness, supported demo path,
   unsupported claims, commands run, Brev status, remaining blockers, and
   exactly one next action.
9. A tracked human-demo review artifact exists at
   [`docs/validation/return-to-form-human-demo-review-v1.md`](docs/validation/return-to-form-human-demo-review-v1.md)
   and records inspected paths, commands, smoke/browser evidence, remaining
   blockers, Brev status, and exactly one next action.
10. Brev worker status, stop attempt, and stopped-state verification remain
   explicit. No duplicate worker is created, no repo/data sync or remote
   training is run, and no delete/reset is attempted without explicit user
   approval.
11. The numbered session log records commands, selected signs,
source/manifest/crop/gate/bootstrap/packet/smoke/remediation/schema/mutation
hashes, M3AE-AJ receipt hash, M3AE-AK design artifact path/hash, M3AE-AL
microprobe receipt path/hash, M3AE-AN held-out behavior receipt path/hash,
M3AE-AO remediation design artifact path/hash, observer-249 API memo path/hash,
microprobe v2 receipt path/hash, Brev no-spend boundary, Brev stop attempts
or stopped-state verification, final-promotion negative-challenge blocker
separation, and one concrete next action.
12. No generic Detector 0 training-smoke retry, packet mutation, row addition,
crop-normalization ablation rerun, recognizer training, label expansion,
controlled clip-heldout evaluation, source approval, unapproved media import,
ONNX export, model-card promotion, final-readiness claim, final-gate weakening,
collection capture, synthetic clips, duplicate Brev worker, Brev sync/training,
push, product-runtime code edit, pretrained detector/landmark use, generated
pseudo-label use, product threshold promotion, or broad-run redirect occurs
after the M3AE-AP `stop_reduced_claim` selection. Brev stop attempts are
allowed only as cost-control teardown and must be verified/logged.

When all twelve are true, the observer should choose the next action from the
Mission 3AG prompt: continue human-demo review, stop for live demo,
route to content/UX scope, route to new data/source review, or escalate
strategy research.

## historical: interim missions 3l-3t (closed at `50aa5c5`)

After M3k, the stop hook re-fired repeatedly because the session-scoped user directive asked for "entire project done" even though the remaining project work requires human first-party clip collection. The orchestrator produced additional durable handoff and repo-hygiene artifacts rather than training on non-first-party data: `docs/handoff/RESUME.md`, aunt/uncle hint entries, hint coverage reporting, area lessons, shared vocabulary parser usage, coverage-percent audit output, `scripts/pre-commit.sample`, `docs/handoff/CHECKLIST.md`, and root `LICENSE.md`. See session logs [`030`](docs/session-logs/030-mission-3l-handoff-resume.md) through [`038`](docs/session-logs/038-mission-3t-license.md).

## historical: mission 3k (closed at fbe9973)

5 new structured hint metadata entries (blue/green/yellow/red/black); total now 17/10 required. See [`docs/session-logs/028-mission-3k-color-hints.md`](docs/session-logs/028-mission-3k-color-hints.md).

Mission 3j closed at `901d61e`. The hint metadata at [`web/src/lib/sign-hint-metadata.json`](web/src/lib/sign-hint-metadata.json) currently covers 12 signs. Expanding to all 100 would require ASL reviewer expertise I don't have. But the **letter-handshape color signs** (blue=B handshape, green=G handshape, yellow=Y handshape) plus two universally-documented beginner color signs (red=index-finger-at-lips, black=index-across-forehead) have canonical forms that are reviewer-safe to author from existing source-curated `coachingHint` text. Adding those 5 entries brings coverage to 17 and exercises the hint engine on a coherent semantic group (colors).

This mission is **content expansion** in the structured hint metadata only. No code change, no schema change, no audit change.

**Active per-milestone prompt:** [`docs/model/expand-hint-metadata-colors-goal-loop-prompt.md`](docs/model/expand-hint-metadata-colors-goal-loop-prompt.md).

## exit condition for this mission (3k)

All three must be true:

1. **`web/src/lib/sign-hint-metadata.json` `items` includes 5 new entries**: `blue`, `green`, `yellow`, `red`, `black`. Each must include at least `handshape`, `movement`, `location`, and `orientation` dimensions; `timing` and `framing` only when salient. Each dimension >= 10 chars. Copy must remain descriptive of canonical sign form (no diagnostic language).
2. **`audit_hint_pedagogy_review.mjs` reports populated_entries >= 17**.
3. **No regression**: `bash scripts/preflight.sh` exits 0; full chain green.

When all three are true, FINAL halt. The autonomous backlog is now provably empty without ASL reviewer expertise or human signer collection.

Mission 3i closed at `197bd08`. The stop hook re-fired after the M3i → final-halt cycle: the user's directive ("don't stop until the entire project is done") is structurally impossible to satisfy without human first-party clip collection, but the hook still requires forward motion until a genuinely empty backlog is proven. This mission produces one more high-leverage durable artifact and then re-attempts halt.

This mission authors [`scripts/preflight.sh`](scripts/preflight.sh): a single command that runs the essential no-regression audit chain (no-pretrained x2, no-raw-video, vocabulary/hint/downstream chain, storage check, web lint+typecheck+build, then three retained smoke+audit pairs). Output is a pass/fail summary so a human operator (or an observer) can verify repo state in one invocation rather than chaining 15+ commands by hand. README is updated to point at it.

**Active per-milestone prompt:** [`docs/model/preflight-helper-goal-loop-prompt.md`](docs/model/preflight-helper-goal-loop-prompt.md).

## exit condition for this mission (3j)

All three must be true:

1. **`scripts/preflight.sh` exists**, is `chmod +x`, passes `bash -n`, runs the essential audit chain end-to-end (exits non-zero on first failure with a clear message; exits zero with a green summary table otherwise), and writes a one-line entry to `docs/validation/preflight-runs.log` (gitignored if not already) recording the run timestamp + exit code per run.
2. **`README.md` "Verify the lane" section points at `bash scripts/preflight.sh` as the recommended entry point** with the full enumerated list still available below for reference.
3. **No regression**: `audit_no_pretrained_deps`, `audit_no_pretrained_artifact_json`, `audit_no_raw_video_upload`, `audit_hint_pedagogy_review`, `audit_vocabulary_review`, `audit_downstream_vocabulary_provenance` all pass; and `bash scripts/preflight.sh` itself exits 0.

When all three are true, the autonomous fallback queue is genuinely exhausted (no remaining non-training work that's not low-value busywork). Final halt: set `<stop-orchestrator/>` and write the comprehensive close log.

Mission 3h closed at `c8b47ea`. The fallback queue is technically exhausted, but the root [`README.md`](README.md) is significantly stale — it still references the DTW lane (deleted in M1/task-026), the `audit_academic_benchmark_summary.mjs` / `audit_primarymath_frontier_23_dtw_summary.mjs` / `run_app_validation_surface_smoke.mjs` scripts (deleted), and the `docs/review/academic-school-project-handoff.md` / `docs/validation/academic-benchmark-summary.json` / `docs/validation/primarymath-frontier-23-dtw-summary.json` artifacts (deleted). For a school-project handoff the README is the first thing a reviewer reads; correcting it is high value.

This mission rewrites `README.md` to reflect the current post-`c8b47ea` state. No code change.

**Active per-milestone prompt:** [`docs/model/readme-refresh-goal-loop-prompt.md`](docs/model/readme-refresh-goal-loop-prompt.md).

## exit condition for this mission (3i)

All three must be true:

1. **`README.md` no longer references deleted artifacts.** Specifically the literal strings `audit_academic_benchmark_summary`, `audit_primarymath_frontier_23_dtw_summary`, `run_app_validation_surface_smoke`, `academic-school-project-handoff`, `academic-benchmark-summary.json`, `primarymath-frontier-23-dtw-summary.json`, `academic-delivery-package`, `audit_academic_delivery_package`, `primarymath-high-support-22-keypoint-dtw`, `21-label LSTM`, `Stage A` (except in historical/migration context), `MediaPipe`, `DTW gate` all gone or contextualised as removed.
2. **`README.md` reflects post-M3h state**: rawframe-only no-pretrained lane, model card still `not_trained`, 100 source-curated vocabulary items with structured hint metadata for 12, first-party collection runbook, vocabulary reviewer-chain runbook, observer-monitoring helper, mission 3 paused on human collection. Pointer to ARCHITECTURE.md / MVP_TASKS.md / GOAL.md for deeper detail.
3. **No regression**: `audit_no_pretrained_deps`, `audit_no_pretrained_artifact_json`, `audit_no_raw_video_upload`, `audit_hint_pedagogy_review`, `audit_vocabulary_review`, `audit_downstream_vocabulary_provenance` all pass.

When all three are true, halt for real: write the final halt session log naming mission 3's human-action blocker, set `<stop-orchestrator/>`, and exit.

Mission 3g closed at `e26fe92`. The autonomous-loop fallback queue has one more non-training mission before honestly halting on the human-collection blocker.

This mission authors [`docs/runbooks/vocabulary-reviewer-chain.md`](docs/runbooks/vocabulary-reviewer-chain.md), an operator-facing runbook that documents the flow from `web/src/lib/vocabulary.ts` (canonical TypeScript vocabulary) through the source-curated evidence (`docs/review/final-vocabulary-review.json`) to the optional external Ed25519-signed reviewer-authority chain (`data/vocabulary-review/*.json`) — and the existing audit chain that validates each link. The reader's goal is: "I want to add a vocabulary item; what do I do?" OR "I want to commission external review; what's the workflow?"

This mission is **operator documentation**. No code change.

**Active per-milestone prompt:** [`docs/model/vocabulary-reviewer-chain-doc-goal-loop-prompt.md`](docs/model/vocabulary-reviewer-chain-doc-goal-loop-prompt.md).

## exit condition for this mission (3h)

All three must be true:

1. **[`docs/runbooks/vocabulary-reviewer-chain.md`](docs/runbooks/vocabulary-reviewer-chain.md) exists** and covers: (a) the canonical-source → source-curated → external-review chain in diagram or table form, (b) operator commands for adding a vocabulary item (edit `vocabulary.ts` → re-run `promote_source_curated_vocabulary.mjs --write`), (c) operator commands for commissioning external review (the Ed25519 packet → reviewer signs → import_vocabulary_review.mjs), (d) the audit chain that gates each step (`audit_vocabulary_review.mjs`, `audit_hint_pedagogy_review.mjs`, `audit_downstream_vocabulary_provenance.mjs`, `audit_source_register.mjs`), and (e) a failure-modes table sourced from past observer findings.
2. **Cross-references intact**: the new runbook links to the source-of-truth files (vocabulary.ts, final-vocabulary-review.json, sign-hint-metadata.json) and to the relevant ARCHITECTURE.md anchors (`#arch-active-module`, `#arch-vocab-hints`, `#arch-data-provenance`).
3. **No regression**: `audit_no_pretrained_deps`, `audit_no_pretrained_artifact_json`, `audit_no_raw_video_upload`, `audit_hint_pedagogy_review`, `audit_vocabulary_review`, `audit_downstream_vocabulary_provenance` all pass.

When all three are true, the autonomous fallback queue is exhausted. Transition to **stop-no-next-milestone** with `<stop-orchestrator/>` and a final halt log naming mission 3's human-action blocker as the unresolved gate.

## stale removed: interim mission 3g (closed at e26fe92)

(Block intentionally removed for brevity after consolidation; see [`docs/session-logs/023-mission-3g-stale-sha-cleanup.md`](docs/session-logs/023-mission-3g-stale-sha-cleanup.md).)


## interim-mission queue (autonomous-loop fallback)

While mission 3 remains gated on human collection, work the following queue in order. Each completed mission gets its own session log + GOAL.md `current mission` update.

- **3e** ✅ closed at `216a091`: Active-vocabulary-claim UI plumbing.
- **3f** ✅ closed at `b4c3543`: REASON_COPY audit binding.
- **3g** (this one): Stale SHA cleanup in older session logs per session-log 005's deferred work.
- **3h**: Documentation page tying `web/src/lib/vocabulary.ts` → reviewer authority chain (operator-facing).

If all four are exhausted and mission 3 still cannot proceed, the autonomous loop honestly records the human-action blocker and halts.

## previously closed interim missions

- **3a**: Browser inference refactor — typed `InferenceEngine` + `PassFailDecision` ([`docs/session-logs/012-mission-3a-task-017-close.md`](docs/session-logs/012-mission-3a-task-017-close.md)).
- **3b**: Practice camera-behavior Playwright evidence refresh ([`docs/session-logs/014-mission-3b-task-016-close.md`](docs/session-logs/014-mission-3b-task-016-close.md)).
- **3c**: PracticeApp `PassFailDecisionOutput` UI migration ([`docs/session-logs/016-mission-3c-practice-decision-ui-close.md`](docs/session-logs/016-mission-3c-practice-decision-ui-close.md)).
- **3d**: Observer-monitoring ergonomics — `scripts/watch_observer.sh` + runbook + rotation fix ([`docs/session-logs/019-mission-3d-observer-monitoring-close.md`](docs/session-logs/019-mission-3d-observer-monitoring-close.md) + [`docs/session-logs/020-mission-3d-rotation-fix.md`](docs/session-logs/020-mission-3d-rotation-fix.md)).
- **3e**: Active-vocabulary-claim UI plumbing ([`docs/session-logs/021-mission-3e-active-vocab-ui.md`](docs/session-logs/021-mission-3e-active-vocab-ui.md)).
- **3f**: REASON_COPY audit binding ([`docs/session-logs/022-mission-3f-reason-copy-audit.md`](docs/session-logs/022-mission-3f-reason-copy-audit.md)).

## previously completed missions

- **Mission 1: Stage A / MediaPipe vestige removal (DONE 2026-05-23).** Branch `task-026-stage-a-removal`, 8 commits, merged into `compound-plan-m0` as `b25e463`. See [`docs/session-logs/001-gap-audit.md`](docs/session-logs/001-gap-audit.md) and [`docs/session-logs/002-stage-a-vestige-removal.md`](docs/session-logs/002-stage-a-vestige-removal.md). Result: no MediaPipe in any active code path; `docs/validation/no-pretrained-lane-audit.json` receipt produced; both no-pretrained audits clean; web build green; browser ONNX smoke green; practice progress smoke green.
- **Mission 2: Rawframe trainability (DONE 2026-05-24).** Closed at `d5cc85f` across six orchestrator commits plus observer continue `4547dcc`; loop-exit summary at [`docs/session-logs/007-loop-exit-exit-condition-met.md`](docs/session-logs/007-loop-exit-exit-condition-met.md). Result: storage guardrail and Brev scripts; first-party collection runtime smoke + audit; rawframe `active-vocabulary-claim.json` and `active-sign-modules.example.json` with `modelVersion="rawframe-not-trained"`; `SignHintMetadata` for 12 signs; first-party collection runbook at [`docs/runbooks/first-party-collection.md`](docs/runbooks/first-party-collection.md). Observer reran the key audits during mission rollover: storage guardrail, shell syntax, downstream vocabulary provenance, hint pedagogy, dataset collection runtime smoke audit, and no-pretrained artifact checks.
- **Interim mission 3a: Browser inference refactor (DONE 2026-05-24).** Closed at `f5c99b3`; see [`docs/session-logs/012-mission-3a-task-017-close.md`](docs/session-logs/012-mission-3a-task-017-close.md). Result: typed `InferenceEngine`, `PassFailDecision`, structured reasons, `hintDimension`, and backward-compatible `evaluateLocalAttempt()` wrapper.
- **Interim mission 3b: Practice camera behavior evidence (DONE 2026-05-24).** Closed at `d6655c2`; see [`docs/session-logs/014-mission-3b-task-016-close.md`](docs/session-logs/014-mission-3b-task-016-close.md). Result: retained Playwright camera behavior smoke at `docs/validation/practice-camera-behavior-smoke.json` now passes with 7 checks and audit green.

---

