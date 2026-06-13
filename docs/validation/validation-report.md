# Validation Report

<!-- asl-pilot-validation-report:v1 -->

## Status

Controlled-pilot validation has run against the current 95-label approved
PopSign v1 raw-frame manifests and the current core negative-challenge manifest.
The current from-scratch model candidate is not ready for submission.

The current implementation validates the application scaffold, account/progress
persistence, camera permission handling, privacy guards, model interface wiring,
no-pretrained artifact JSON guardrails, approved external raw-video manifests,
and a current-manifest from-scratch retrain. It does not yet prove shippable ASL
recognition. The latest controlled-pilot candidate fails the configured accuracy,
false-pass, and core negative-challenge gates.

The separate academic online-dataset lane has a scoped 10-label research-only
keypoint benchmark that passes its lowered Tier 1 metric gate, retained
supporting 21-label LSTM/template evidence, and an active 22-label
high-support PrimaryMath DTW verifier that passes the configured top-1, macro,
and per-class gates. This is not a browser model-card promotion and must not be
described as raw RGB, browser-webcam, product-domain, or first-party
browser-domain evidence. The Tier 1 labels are `book`, `table`, `go`, `blue`,
`yellow`, `green`, `read`, `pencil`, `finish`, and `help`; the latest active
scoped benchmark is the high-support 22-label DTW keypoint tier documented
below.

The same keypoint ladder has also been probed at 20 labels. The first
plan-order source-covered Tier 2 attempt is not passed: both the LSTM and k=1
template baseline miss the per-class recall floor for low-support labels. A
documented high-support strict hand-only 20-label replacement tier has now
passed with both the trained LSTM and the same-split template baseline. This
replacement is still research-only keypoint evidence and does not claim exact
plan-order coverage, raw RGB evidence, or browser-domain model-card promotion.

Class-balanced Tier 2 retraining improved the trained keypoint LSTM but did not
clear the gate. The best remediated LSTM now reaches top-1 `0.7722308892`,
macro recall `0.7118940218`, and macro F1 `0.7112322482`, but still misses
the per-class recall floor for `stop` and `small`.

The high-support replacement Tier 2 LSTM reaches held-out top-1
`0.8077436582`, macro recall `0.7948966934`, and macro F1 `0.7985971252` with
no class below the `0.45` recall floor. Its same-split k=1 template baseline
also passes, with top-1 `0.8344459279`, macro recall `0.8213242619`, and macro
F1 `0.8252768869`.

A 21-label high-support intermediate tier remains retained supporting
PrimaryMath keypoint evidence. It starts from the passing 20-label replacement
and adds `answer`, the only added high-support 25-label item that passed
label-specific checks under the trained/template checks. The class-balanced
LSTM reaches held-out top-1
`0.7905759162`, macro recall `0.7776785564`, and macro F1 `0.7756291133` with
no class below the recall floor. The same-split k=1 template baseline also
passes, with top-1 `0.8311518325`, macro recall `0.8117187181`, and macro F1
`0.8145915024`.

The next 22-label high-support step adds `first`. Its trained/template checks
do not pass: the class-balanced LSTM reaches top-1 `0.8187660668`, macro
recall `0.7886715314`, and macro F1 `0.7900099704`, but `first` recall is only
`0.3571428571`. The same-split template baseline reaches top-1 `0.8239074550`,
macro recall
`0.7943029322`, and macro F1 `0.7986663643`, but `first` recall is
`0.4285714286`, still below the floor. A new prefiltered k=1 DTW verifier over
the same keypoint manifests does pass this 22-label tier, reaching top-1
`0.8213367609`, macro recall `0.7932041116`, and macro F1 `0.7992118151` with
no low-recall classes. This is now the active scoped academic keypoint claim.
The 21-label LSTM and template reports remain supporting evidence, not the
largest active claim, and browser/raw-RGB model-card status remains
`not_trained`.

PrimaryMath cannot source-cover the planned 35-label Tier 3. It contains only
31 of the 44 strict hand-only labels through Tier 4. A 25-label high-support
intermediate tier is a near miss: the best trained class-balanced LSTM reaches
top-1 `0.7570207570`, macro recall `0.7061631485`, and macro F1
`0.7054902873`, but still misses the per-class recall floor for `small`,
`stop`, and `wait`. The same-split template baseline reaches top-1
`0.7924297924`, macro recall `0.7231719636`, and macro F1 `0.7256021390`,
but misses the floor for `first`, `small`, `stop`, and `wait`.
The same prefiltered k=1 DTW verifier does not rescue the 25-label tier: it
reaches top-1 `0.7924297924`, macro recall `0.7254146545`, and macro F1
`0.7286596520`, but still misses the recall floor for `small`, `wait`, and
`stop`.

A bounded post-22 metric-frontier check tested the failed 25-label blockers one
at a time. The 23-label `+small`, `+wait`, and `+stop` DTW candidates all
failed the same per-class recall floor on the added label, so none were
promoted and no 24-label follow-up from that single-blocker family is justified
without a materially different remediation tactic. The active claim remains the
22-label DTW keypoint verifier.

## Academic Claim Metric Comparison

| Lane | Role | Status | Labels | Top-1 | Macro recall | Macro F1 | Low-recall labels |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| 21-label LSTM | Supporting trained keypoint evidence | `passed_targets` | 21 | 0.7905759162 | 0.7776785564 | 0.7756291133 | none below floor; lowest `answer` at 0.5333333333 |
| 21-label template | Supporting same-split keypoint baseline | `passed` | 21 | 0.8311518325 | 0.8117187181 | 0.8145915024 | none below floor; lowest `answer` at 0.6 |
| 22-label DTW | Active academic keypoint verifier claim | `passed` | 22 | 0.8213367609 | 0.7932041116 | 0.7992118151 | none below floor; lowest `first` at 0.5 |
| 25-label DTW | Failed scaling evidence, not promoted | `failed_targets` | 25 | 0.7924297924 | 0.7254146545 | 0.7286596520 | `small` 0.2; `wait` 0.4; `stop` 0.0909090909 |

| Frontier candidate | Role | Status | Labels | Top-1 | Macro recall | Macro F1 | Low-recall labels |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| 23-label DTW + `small` | Failed post-22 single-blocker frontier | `failed_targets` | 23 | 0.8146279950 | 0.7788124200 | 0.7848330377 | `small` 0.4 |
| 23-label DTW + `wait` | Failed post-22 single-blocker frontier | `failed_targets` | 23 | 0.8133669609 | 0.7759138693 | 0.7827118967 | `wait` 0.3333333333 |
| 23-label DTW + `stop` | Failed post-22 single-blocker frontier | `failed_targets` | 23 | 0.8124207858 | 0.7653736848 | 0.7708401809 | `stop` 0.0909090909 |

The sparse-label remediation queue is now explicit. `small`, `stop`, and `wait`
are hard blockers because they fail both the best trained 25-label LSTM and the
same-split template baseline. `first` remains a watchlist label because it
clears the best trained LSTM recall floor but fails the unbalanced LSTM/template
checks. `answer` is the only added 25-label item that currently passes these
label-specific checks.

A blocker-excluding 25-label PrimaryMath replacement has also been measured. It
starts from the passing high-support 20-label replacement and adds `answer`,
`gray`, `equal`, `group`, and `next`, excluding the current `small`/`stop`/`wait`
hard blockers and the `first` watchlist label. It still fails the per-class
floor: the class-balanced LSTM reaches top-1 `0.7743142145`, macro recall
`0.6819602137`, and macro F1 `0.6805399708`, but `gray`, `equal`, `group`, and
`next` are low recall. Its same-split template baseline reaches top-1
`0.7917705736`, macro recall `0.6871892796`, and macro F1 `0.6831111361`, but
fails the same four labels. This means PrimaryMath-only 25-label reshuffling is
not a clean promotion path without more source coverage or explicit sparse-label
remediation.

A targeted ASL Citizen selected raw-video import now
covers all five affected labels without downloading the full archive: `small`
has `16/3/10` train/validation/test clips, `stop` has `16/3/10`, `wait` has
`13/4/10`, `first` has `14/4/10`, and `answer` has `16/3/10`. Source-bound raw
RGB manifests are written and full-frame tensors are decoded for this
remediation lane. The first full-frame raw RGB same-split diagnostics fail:
the project-owned CNN+LSTM reaches test top-1 `0.20`, macro recall `0.20`, and
macro F1 `0.1812030075`; the k=1 template baseline reaches test top-1 `0.30`,
macro recall `0.30`, and macro F1 `0.2863048927`. Three project-owned ROI
passes also fail. Fused chest/saliency ROI reaches top-1 `0.22`, macro recall
`0.22`, and macro F1 `0.1679120879` with CNN+LSTM, while its k=1 template
baseline reaches top-1 `0.26`, macro recall `0.26`, and macro F1
`0.2556390977`. Fixed-chest ROI reaches top-1 `0.20`, macro recall `0.20`,
and macro F1 `0.1898786181` with CNN+LSTM, while its k=1 template baseline
reaches top-1 `0.26`, macro recall `0.26`, and macro F1 `0.2439550787`.
Heuristic motion/skin ROI reaches top-1 `0.20`, macro recall `0.20`, and macro
F1 `0.1532967033` with CNN+LSTM, while its k=1 template baseline reaches
top-1 `0.34`, macro recall `0.34`, and macro F1 `0.3365596963`.
A higher-resolution heuristic ROI pass using 24-frame 128px tensors from 256px
decodes also fails: CNN+LSTM reaches top-1 `0.20`, macro recall `0.20`, and
macro F1 `0.1799267399`, while its k=1 template baseline improves to top-1
`0.42`, macro recall `0.42`, and macro F1 `0.4100713012`, but still misses the
per-class recall floor for `first` and `wait`. A retained contact-sheet
diagnostic for this tensor set reports `passed_no_gross_tensor_issue` across 30
sampled clips; this is visual-review input only, not label approval or model
evidence. A ROI/keypoint review packet was exported from those contact sheets,
along with a static reviewer HTML handoff, local reviewer UI, review protocol,
editable return templates, ignored reviewer handoff bundle, and handoff audit.
The local approve-all return has now been staged as visual ROI/crop review only,
not ASL correctness or fluency attestation. The review status gate reports
`reviewed_roi_packet_ready_for_manifest_export`, and the reviewed-manifest
exporter reports `reviewed_roi_manifests_written` for `answer`, `first`,
`small`, `stop`, and `wait`. Rerunning the same-split gates on those reviewed
ROI manifests still fails: the CNN+LSTM reaches top-1 `0.20`, macro recall
`0.20`, and macro F1 `0.12`, with low recall for `answer`, `first`, `stop`, and
`wait`; the k=1 template baseline reaches top-1 `0.42`, macro recall `0.42`,
and macro F1 `0.4100713012`, with low recall for `first` and `wait`. These
reviewed ROI artifacts are retained diagnostic evidence only and do not support
browser model-card promotion.

The all-available
31-label strict-hand source-ceiling probe fails. The best trained remediation,
class-balanced loss, reaches top-1 `0.7105263158`, macro recall
`0.5850386967`, and macro F1 `0.5886960563`; the unbalanced LSTM reached
top-1 `0.7276887872`, macro recall `0.5759423901`, and macro F1
`0.5744503945`. The template baseline reaches top-1 `0.7459954233`, macro recall
`0.5957631276`, and macro F1 `0.5944616849`. Both miss macro gates and
per-class recall floors on sparse labels.

The online extension audit finds no verified local path beyond the PrimaryMath
22-label DTW keypoint tier. ASL Citizen and WLASL are approved only for this
noncommercial academic raw-video scope, PopSign remains the approved raw-video
source, and MS-ASL remains excluded. Current local raw/ROI diagnostics do not
pass a 10-label gate: ASL Citizen's best retained raw/ROI result is top-1
`0.39`, PopSign strict-hand raw/ROI is top-1 `0.2052631579`, and WLASL is
smoke-only with min clips per label `1`.

The post-`e0c01cd` checkpoints add a reviewer-facing final claim matrix, public
app route at `/validation`, and retained 23-label metric-frontier failure
summary. The route is backed by `web/public/model/claim-matrix.json` and repeats
the same fail-closed boundary: the active claim is the offline 22-label
academic keypoint verifier, while browser/raw-RGB/webcam recognition remains
`not_trained`.

After the relaxed-lane direction change, the primary deadline path is now Stage
A: disclosed browser-local pretrained landmark/ROI extraction plus a
team-owned target-conditioned verifier. The current Stage A checkpoint promotes
a selected 75-label target-known DTW/template verifier after replacing the
held-out zero-accept labels `read` and `all` with `please` and `grandma` from
the approved replacement pool. The validation split passes with macro recall
`0.7822222222` and hard-negative false accept rate `0.0908108108`; the held-out
controlled clip split passes with macro recall `0.7244444444` and hard-negative
false accept rate `0.0983783784`, with no zero-accepted labels. The browser
artifact is
`web/public/model/stage-a-teacher-selected75-replace-read-all-please-grandma-16train-r1p27-k40-v0.verifier.json`.

This Stage A claim is still bounded: it is browser-local MediaPipe hand-landmark
extraction plus team-owned target-known template/threshold scoring. It is not
strict no-pretrained compliance, not signer-disjoint proof, not open-vocabulary
ASL recognition, not sentence recognition, and not a raw-frame student runtime.
Stage B supervision has been exported from the promoted Stage A run at
`docs/validation/stage-b-supervision-75label-teacher-replace-read-all-please-grandma-v0.json`
with `106875` target/wrong-prompt records; the Stage B student remains
deferred and unpromoted.

The final academic handoff for the school-project story is
`docs/review/academic-school-project-handoff.md`, backed by
`docs/validation/academic-delivery-package.json`. It packages the active
22-label academic claim, failed 23-label frontier evidence, `/validation` route
smoke, no-pretrained artifact scan, and explicit non-claims.

## Artifact Bindings

This document summarizes current machine-readable artifacts. It must not be
used to promote the model card until the machine-readable artifacts pass and are
hash-pinned into a trained browser model card.

| Artifact | Path | Status |
| --- | --- | --- |
| Active browser model card | `web/public/model/model-card.json` | `not_trained` raw-frame model card with promoted Stage A browser verifier metadata; the active browser checking path is disclosed MediaPipe extraction plus team-owned 75-label target-known DTW/template scoring, not a raw-frame student |
| Stage A 75-label candidate vocabulary | `docs/model/vocab_75_v1.json` and `docs/model/stage_a_teacher_selected75_replace_read_all_please_grandma_16train_r1p27_k40_v0.json` | Original relaxed-lane vocabulary plus selected promoted 75-label verifier vocabulary; the promoted set replaces `read`/`all` with `please`/`grandma` |
| Stage A target verifier status | `docs/validation/stage-a-target-verifier-status.json` and `web/public/model/stage-a-target-verifier-status.json` | `stage_a_75label_target_verifier_promoted`; records pinned disclosed browser-local MediaPipe extractor assets, browser-packaged 75-label target verifier, validation/held-out pass metrics, and Stage B saved-supervision deferment |
| Stage A extractor smoke | `docs/validation/stage-a-extractor-smoke.json` and `artifacts/stage_a/extractor_smoke_v0/popsign-v1-test-hello-000015.landmarks.json` | `passed`; Chromium loaded local MediaPipe assets, sampled one controlled-pilot HELLO clip, detected hands in 1/8 sampled frames, and saved landmarks; extractor smoke only, not verifier training or promotion |
| Stage A 5-label verifier smoke | `docs/validation/stage-a-smoke-5label-v0-status.json` and `artifacts/stage_a/smoke_5label_v0/` | `passed_smoke_gate_not_promoted`; labels `bye`, `yes`, `no`, `read`, `pen`; 20 train and 15 validation feature records; macro recall 0.80, accepted coverage 0.80, wrong-prompt false accept rate 0.05; not a 75-label verifier promotion |
| Stage A 10-label verifier smoke | `docs/validation/stage-a-smoke-10label-v0-status.json` and `artifacts/stage_a/smoke_10label_v0/` | `passed_smoke_gate_not_promoted`; labels `hello`, `bye`, `thank_you`, `please`, `yes`, `no`, `like`, `read`, `have`, `can`; 40 train and 30 validation feature records; macro recall 0.80, accepted coverage 0.80, wrong-prompt false accept rate 0.0222222222; not a 75-label verifier promotion |
| Stage A 12-label verifier smoke | `docs/validation/stage-a-smoke-12label-v0-status.json` and `artifacts/stage_a/smoke_12label_v0/` | `passed_smoke_gate_not_promoted`; labels `bye`, `thank_you`, `please`, `yes`, `no`, `like`, `have`, `can`, `book`, `pen`, `read`, `table`; 48 train and 36 validation feature records; macro recall 0.75, accepted coverage 0.75, wrong-prompt false accept rate 0.0227272727; not a 75-label verifier promotion |
| Stage A 14-label verifier smoke | `docs/validation/stage-a-smoke-14label-v0-status.json` and `artifacts/stage_a/smoke_14label_v0/` | `passed_smoke_gate_not_promoted`; labels `bye`, `thank_you`, `please`, `yes`, `no`, `like`, `have`, `can`, `book`, `pen`, `read`, `table`, `home`, `bed`; 56 train and 42 validation feature records; macro recall 0.7380952381, accepted coverage 0.7380952381, wrong-prompt false accept rate 0.0183150183; not a 75-label verifier promotion |
| Stage A 16-label verifier smoke | `docs/validation/stage-a-smoke-16label-v0-status.json`, `docs/validation/stage-a-browser-16label-package-v0.json`, and `artifacts/stage_a/smoke_16label_v0/` | `passed_smoke_gate_not_promoted`; labels `bye`, `thank_you`, `please`, `yes`, `no`, `like`, `have`, `read`, `table`, `bed`, `where`, `morning`, `night`, `tomorrow`, `yesterday`, `now`; 64 train and 48 validation feature records; macro recall 0.7083333333, accepted coverage 0.7083333333, wrong-prompt false accept rate 0.0180555556; browser-packaged as smoke only, not a 75-label verifier promotion |
| Stage A 19-label verifier smoke | `docs/validation/stage-a-smoke-19label-v0-status.json`, `docs/validation/stage-a-browser-19label-package-v0.json`, and `artifacts/stage_a/smoke_19label_v0/` | `passed_smoke_gate_not_promoted`; labels `bye`, `thank_you`, `please`, `yes`, `no`, `like`, `have`, `read`, `table`, `bed`, `morning`, `night`, `tomorrow`, `now`, `later`, `dad`, `aunt`, `uncle`, `boy`; 76 train and 57 validation feature records; macro recall 0.7017543860, accepted coverage 0.7017543860, wrong-prompt false accept rate 0.0155945419; browser-packaged as smoke only, not a 75-label verifier promotion |
| Stage A 20-label verifier smoke | `docs/validation/stage-a-smoke-20label-v0-status.json`, `docs/validation/stage-a-browser-20label-package-v0.json`, and `artifacts/stage_a/smoke_20label_v0/` | `passed_smoke_gate_not_promoted`; labels `bye`, `thank_you`, `please`, `yes`, `no`, `like`, `have`, `book`, `read`, `home`, `bed`, `night`, `tomorrow`, `now`, `later`, `dad`, `aunt`, `uncle`, `boy`, `sick`; 80 train and 60 validation feature records; macro recall 0.7166666667, accepted coverage 0.7166666667, wrong-prompt false accept rate 0.0122807018; browser-packaged as smoke only, not a 75-label verifier promotion |
| Stage A 20-label ratio-gated verifier smoke | `docs/validation/stage-a-smoke-20label-ratio-v0-status.json`, `docs/validation/stage-a-browser-20label-ratio-package-v0.json`, and `artifacts/stage_a/smoke_20label_ratio_v0/` | Retained previous `passed_smoke_gate_not_promoted` package; same 20 labels as the prior 20-label smoke; scoring mode `target-ratio` with `max_distance_ratio` 1.15 and `max_target_rank` 20; 80 train and 60 validation feature records; macro recall 0.8333333333, accepted coverage 0.8333333333, macro precision 0.4824458874, wrong-prompt false accept rate 0.0684210526; retained as prior 82% evidence, not a 75-label verifier promotion |
| Stage A 21-label ratio-gated verifier smoke | `docs/validation/stage-a-smoke-21label-ratio-v0-status.json`, `docs/validation/stage-a-browser-21label-ratio-package-v0.json`, and `artifacts/stage_a/smoke_21label_ratio_v0/` | Retained previous `passed_smoke_gate_not_promoted` package; adds `yesterday` to the retained 20-label ratio set; scoring mode `target-ratio` with `max_distance_ratio` 1.15 and `max_target_rank` 20; 84 train and 63 validation feature records; macro recall 0.8253968254, accepted coverage 0.8253968254, macro precision 0.4711502783, wrong-prompt false accept rate 0.0674603175; retained as prior 82% evidence, not a 75-label verifier promotion |
| Stage A 21-label five-template verifier smoke | `docs/validation/stage-a-smoke-21label-5train-v0-status.json` and `artifacts/stage_a/smoke_21label_5train_v0/` | `passed_smoke_gate_not_promoted`; labels add `yesterday` to the retained 20-label set; 105 train and 63 validation feature records; macro recall 0.7142857143, accepted coverage 0.7142857143, wrong-prompt false accept rate 0.0119047619; retained as scale-up evidence, not browser-packaged |
| Stage A 22-label ratio-gated verifier materialization | `docs/validation/stage-a-smoke-22label-ratio-v0-status.json` and `artifacts/stage_a/smoke_22label_ratio_v0/` | `passed_smoke_gate_not_promoted`; adds `hello` and `table` to the retained 20-label ratio set; scoring mode `target-ratio` with `max_distance_ratio` 1.15 and `max_target_rank` 20; 88 train and 66 validation feature records; macro recall 0.8181818182, accepted coverage 0.8181818182, macro precision 0.4358404222, wrong-prompt false accept rate 0.0707070707; passes the loose smoke gate but misses the current 82% package target, so it is retained as scale-up evidence and not browser-packaged |
| Stage A 22-label add-one ratio frontier | `docs/validation/stage-a-cached-add-one-22label-ratio-frontier-v0.json` | `cached_add_one_no_package_target_candidate`; cache-backed target-ratio search from the packaged 21-label subset checked 29 one-label expansions across 50 cache-eligible labels with no MediaPipe extraction; zero candidates cleared the 0.82 macro-recall package target. Top near misses were `table`, `girl`, and `hello` at macro recall 0.8181818182; retained as scale-up evidence only, not browser-packaged |
| Stage A 22-label swap-add ratio frontier | `docs/validation/stage-a-cached-swap-add-22label-ratio-frontier-v0.json` | `cached_swap_add_found_package_target_candidate`; targeted cache-backed search removed weak labels `home`/`aunt` and tried pairs from top add-one candidates; the best candidate removed `aunt`, added `hello` and `sad`, and cleared the 0.82 package target with macro recall 0.8333333333 and wrong-prompt false accept rate 0.0793650794; no MediaPipe extraction was run by the frontier search |
| Stage A 22-label swap ratio-gated verifier smoke | `docs/validation/stage-a-smoke-22label-swap-ratio-v0-status.json`, `docs/validation/stage-a-browser-22label-swap-ratio-package-v0.json`, and `artifacts/stage_a/smoke_22label_swap_ratio_v0/` | Retained previous `passed_smoke_gate_not_promoted` package; removes `aunt` from the 21-label ratio package and adds `hello` plus `sad`; scoring mode `target-ratio` with `max_distance_ratio` 1.15 and `max_target_rank` 20; 88 train and 66 validation feature records; macro recall 0.8333333333, accepted coverage 0.8333333333, macro precision 0.3873015873, wrong-prompt false accept rate 0.0793650794; retained as prior 82% evidence, not a 75-label verifier promotion |
| Stage A 23-label swap-add ratio frontier | `docs/validation/stage-a-cached-swap-add-23label-ratio-frontier-v0.json` | `cached_swap_add_found_package_target_candidate`; targeted cache-backed search removed weak label `home` from the 22-label swap package and added `table` plus `girl`; the candidate cleared the 0.82 package target with macro recall 0.8405797101 and wrong-prompt false accept rate 0.0889328063; no MediaPipe extraction was run by the frontier search |
| Stage A 23-label swap ratio-gated verifier smoke | `docs/validation/stage-a-smoke-23label-swap-ratio-v0-status.json`, `docs/validation/stage-a-browser-23label-swap-ratio-package-v0.json`, and `artifacts/stage_a/smoke_23label_swap_ratio_v0/` | `passed_smoke_gate_not_promoted`; removes `home` from the 22-label swap package and adds `table` plus `girl`; scoring mode `target-ratio` with `max_distance_ratio` 1.15 and `max_target_rank` 20; 92 train and 69 validation feature records; macro recall 0.8405797101, accepted coverage 0.8405797101, macro precision 0.3283815219, wrong-prompt false accept rate 0.0889328063; browser-packaged as the current 82% smoke only, not a 75-label verifier promotion |
| Stage A promoted 75-label selected target verifier | `docs/validation/stage-a-teacher-selected75-replace-read-all-please-grandma-16train-r1p27-k40-v0-status.json`, `docs/validation/stage-a-teacher-selected75-replace-read-all-please-grandma-16train-r1p27-k40-test-v0-status.json`, `docs/validation/stage-a-browser-75label-teacher-replace-read-all-please-grandma-package-v0.json`, and `web/public/model/stage-a-teacher-selected75-replace-read-all-please-grandma-16train-r1p27-k40-v0.verifier.json` | `promoted_stage_a_75label_target_verifier`; selected 75-label target-ratio verifier with 16 train clips per label, `max_distance_ratio` 1.27, `max_target_rank` 40, and 1185 templates. Validation passes at macro recall 0.7822222222 and wrong-prompt false accept rate 0.0908108108; held-out controlled clip test passes at macro recall 0.7244444444 and wrong-prompt false accept rate 0.0983783784, with no zero-accepted labels. Boundary: controlled clip-heldout target verification only, not signer-disjoint/open-vocabulary/sentence/raw-frame-student recognition |
| Stage A 75-label teacher sweep and held-out per-label gate test | `docs/validation/stage-a-teacher-75label-sweep-v0.json`, `docs/validation/stage-a-teacher-75label-frontier-summary-v0.json`, `docs/validation/stage-a-teacher-75label-perlabel-gates-test-v0-status.json`, and `docs/validation/stage-a-teacher-75label-target-distance-slack2p0-v0-status.json` | `failed_75label_teacher_sweep_not_promoted`; 12 full-75 target-verifier artifacts are recorded and none were promoted. The validation-only per-label calibration ceiling reached macro recall 0.8622222222 at wrong-prompt false accept rate 0.0991591592, but the held-out test materialization fell to macro recall 0.5777777778 with wrong-prompt false accept rate 0.0950150150 and zero accepted true examples for `book`, `read`, `room`, `where`, `tomorrow`, `after`, `happy`, `sad`, and `food`. The best macro-recall candidate remains `stage-a-teacher-75label-target-distance-slack2p0-v0` at macro recall 0.9777777778 but wrong-prompt false accept rate 0.9604804805. No 75-label verifier was promoted or browser-packaged |
| Stage A 95-label replacement-pool probe | `docs/validation/stage-a-teacher-95label-ratio-8train-r1p25-k40-v0-status.json` | `failed_smoke_gate_not_promoted`; adds 20 replacement-candidate signs to the 75-label pool and evaluates target-ratio scoring with 760 train and 285 validation feature records. Macro recall was 0.5578947368, accepted coverage 0.5578947368, macro precision 0.0835006316, and wrong-prompt false accept rate 0.0775289287. Zero-accepted true labels included `not`, `go`, `after`, `before`, `mom`, `fine`, `hungry`, `thirsty`, `give`, `look`, and `talk`; not promoted |
| Stage A selected-75 12-train frontier | `docs/validation/stage-a-teacher-selected75-ratio-12train-r1p25-k40-v0-status.json`, `docs/validation/stage-a-teacher-selected75-ratio-12train-r1p25-k40-test-v0-status.json`, `docs/validation/stage-a-teacher-selected75-ratio-12train-r1p30-k40-v0-status.json`, and `docs/validation/stage-a-teacher-selected75-ratio-12train-r1p35-k40-v0-status.json` | `selected75_12train_frontier_recorded_not_promoted`; the ratio 1.25 validation candidate passed with macro recall 0.7422222222 and wrong-prompt false accept rate 0.0798798799, but the held-out test missed the promotion floor at macro recall 0.6755555556 and false accept rate 0.0887087087 with zero accepted held-out examples for `book`, `read`, and `child`. Looser validation ratios reached macro recall 0.7911111111 and 0.8177777778, but failed the hard-negative gate at false accept rates 0.1051651652 and 0.1283483483; no selected-75 12-train artifact was promoted |
| Stage A 95-label 12-train and selected-75-from95 frontier | `docs/validation/stage-a-teacher-95label-ratio-12train-r1p25-k40-v0-status.json`, `docs/validation/stage-a-teacher-selected75-from95-12train-r1p25-k40-v0-status.json`, and `docs/validation/stage-a-teacher-selected75-from95-12train-r1p25-k40-test-v0-status.json` | `from95_12train_frontier_recorded_not_promoted`; the 95-label pool improved to macro recall 0.6280701754 with wrong-prompt false accept rate 0.0698021650 but still failed. The selected-75-from95 validation candidate passed with macro recall 0.7555555556 and false accept rate 0.0774174174, but the held-out test failed at macro recall 0.6577777778 with false accept rate 0.0809009009 and zero accepted held-out examples for `book`, `all`, `read`, and `child`; not promoted |
| Stage A selected-75 16-train frontier | `docs/validation/stage-a-teacher-selected75-ratio-16train-r1p25-k40-v0-status.json`, `docs/validation/stage-a-teacher-selected75-swap-hungry-16train-r1p27-k40-test-v0-status.json`, and the promoted replacement artifacts above | `selected75_16train_frontier_promoted_after_replacement`; replacing `pencil` with `hungry` fixed the validation zero-label blocker but left held-out zero accepts for `read` and `all`. Replacing `read`/`all` with `please`/`grandma` produced the promoted 75-label verifier above |
| Stage B 75-label selected target-verifier supervision export | `docs/validation/stage-b-supervision-75label-teacher-replace-read-all-please-grandma-v0.json` and `artifacts/stage_b/supervision_75label_teacher_replace_read_all_please_grandma_v0/supervision.jsonl` | `passed_stage_b_supervision_export_stage_b_deferred`; exports 106875 target-known records from 1425 promoted Stage A source clips. Stage B raw-frame student training/runtime remains deferred and unpromoted |
| Stage B 23-label swap ratio supervision export | `docs/validation/stage-b-supervision-23label-swap-ratio-v0.json` and `artifacts/stage_b/supervision_23label_swap_ratio_v0/supervision.jsonl` | Retained previous `passed_stage_b_supervision_export_stage_b_deferred`; superseded by the 75-label supervision export for the current Stage A package |
| Stage B 22-label swap ratio supervision export | `docs/validation/stage-b-supervision-22label-swap-ratio-v0.json` and `artifacts/stage_b/supervision_22label_swap_ratio_v0/supervision.jsonl` | Retained previous `passed_stage_b_supervision_export_stage_b_deferred` export for the 22-label swap ratio smoke; current packaged verifier uses the 23-label swap ratio-gated supervision export |
| Stage B 21-label ratio supervision export | `docs/validation/stage-b-supervision-21label-ratio-v0.json` and `artifacts/stage_b/supervision_21label_ratio_v0/supervision.jsonl` | Retained previous `passed_stage_b_supervision_export_stage_b_deferred` export for the 21-label ratio smoke; current packaged verifier uses the 23-label swap ratio-gated supervision export |
| Stage B 20-label ratio supervision export | `docs/validation/stage-b-supervision-20label-ratio-v0.json` and `artifacts/stage_b/supervision_20label_ratio_v0/supervision.jsonl` | Retained previous `passed_stage_b_supervision_export_stage_b_deferred` export for the 20-label ratio smoke; current packaged verifier uses the 23-label swap ratio-gated supervision export |
| Stage B 20-label global-nearest supervision export | `docs/validation/stage-b-supervision-20label-v0.json` and `artifacts/stage_b/supervision_20label_v0/supervision.jsonl` | Retained previous `passed_stage_b_supervision_export_stage_b_deferred` export for the global-nearest 20-label smoke; current packaged verifier uses the 23-label swap ratio-gated supervision export |
| Stage A cached label frontier | `docs/validation/stage-a-cached-label-frontier-v0.json` | `cached_frontier_found_passing_subset`; beam searched 50 cached-eligible labels and now retains ranked passing candidates; the top materialized candidate is the retained 20-label smoke, while a prior 21-label cached candidate failed the normal materialization runner just below the smoke gate; no MediaPipe extraction was run by the search itself and no 75-label verifier was promoted |
| Stage A feature cache | `docs/validation/stage-a-feature-cache-v0-status.json` and `artifacts/stage_a/feature_cache_v0/` | `passed`; 371 unique cached extractor outputs retained from 2037 smoke/probe manifest records, including the retained 20-label ratio smoke, 21-label ratio smoke, 22-label ratio materialization, 21-label five-template smoke, failed 21-label materialization, and failed 50-label probe; cache boundary is scale-up acceleration only, not verifier promotion evidence |
| Stage A 15-label verifier probe | `docs/validation/stage-a-smoke-15label-v0-probe.json` | `failed_smoke_gate_not_promoted`; no-write diagnostic probe; 60 train and 45 validation records processed; macro recall 0.5555555556, accepted coverage 0.5555555556, wrong-prompt false accept rate 0.0301587302; `go`, `book`, `pencil`, and `chair` had zero accepted true validation examples; not promoted |
| Stage A 30-label verifier probe | `docs/validation/stage-a-smoke-30label-v0-probe.json` and `artifacts/stage_a/probe_30label_v0/` | `failed_smoke_gate_not_promoted`; 120 train and 90 validation feature records processed; macro recall 0.4555555556, accepted coverage 0.4555555556, wrong-prompt false accept rate 0.0176245211; `not`, `go`, `book`, `pencil`, `chair`, and `after` had zero accepted true validation examples; not promoted |
| Stage A 40-label verifier probe | `docs/validation/stage-a-smoke-40label-v0-probe.json` and `artifacts/stage_a/probe_40label_v0/` | `failed_smoke_gate_not_promoted`; 160 train and 120 validation feature records processed; macro recall 0.3500000000, accepted coverage 0.3500000000, wrong-prompt false accept rate 0.0155982906; `hello`, `not`, `go`, `book`, `pencil`, `chair`, `tomorrow`, `after`, `before`, `later`, `mom`, `dad`, `grandma`, and `grandpa` had zero accepted true validation examples; not promoted |
| Stage A 21-label verifier materialization | `docs/validation/stage-a-smoke-21label-v0-status.json` and `artifacts/stage_a/smoke_21label_v0/` | `failed_smoke_gate_not_promoted`; 84 train and 63 validation feature records processed from the best 50-label cached-frontier candidate; macro recall 0.6984126984, accepted coverage 0.6984126984, wrong-prompt false accept rate 0.0126984127; failed just below the 70% macro-recall gate and was not browser-packaged |
| Stage A 50-label verifier probe | `docs/validation/stage-a-smoke-50label-v0-probe.json` and `artifacts/stage_a/probe_50label_v0/` | `failed_smoke_gate_not_promoted`; 200 train and 150 validation feature records processed; macro recall 0.2666666667, accepted coverage 0.2666666667, wrong-prompt false accept rate 0.0142857143; many labels had zero accepted true validation examples; not promoted |
| Stage A MediaPipe asset audit | `docs/validation/stage-a-mediapipe-assets-audit.json` | `passed`; verifies exact `@mediapipe/tasks-vision` package pin, local Hand Landmarker task asset, local WASM files, SHA-256 digests, and disclosure boundary; does not promote verifier accuracy |
| Stage A MediaPipe asset manifest | `web/public/models/mediapipe/manifest.json` and `docs/model/mediapipe_tasks_vision_disclosure.md` | Pinned local `@mediapipe/tasks-vision` browser WASM plus Hand Landmarker task asset; disclosed as pretrained extraction only, not a sign classifier or promoted verifier |
| Final claim matrix | `docs/validation/final-claim-matrix.json` and `web/public/model/claim-matrix.json` | Reviewer-facing matrix for `/validation`; separates active CV claim, supporting evidence, failed expansions, learn-only labels, and not-validated lanes |
| Academic delivery package | `docs/validation/academic-delivery-package.json` and `docs/review/academic-school-project-handoff.md` | `academic_delivery_package_ready`; final school-project handoff for the scoped academic keypoint benchmark and explicit non-claims |
| App validation surface smoke | `docs/validation/app-validation-surface-smoke.json` | Browser smoke for `/validation`; verifies the page renders the active 22-label claim, `not_trained` browser model status, failed labels, learn-only boundary, and public JSON agreement |
| Academic benchmark summary | `docs/validation/academic-benchmark-summary.json` | `passed_academic_keypoint_benchmark`; audited by `scripts/audit_academic_benchmark_summary.mjs` against the active PrimaryMath high-support 22-label DTW report, retained 21-label LSTM/template supporting reports, supported-label registry, online-extension status, and fail-closed browser model-card boundary |
| PrimaryMath 23-label DTW metric-frontier summary | `docs/validation/primarymath-frontier-23-dtw-summary.json` | `all_23_single_blocker_dtw_candidates_failed_not_promoted`; 23+`small`, 23+`wait`, and 23+`stop` each fail on the added label and are retained as non-promoted evidence |
| Supported-label registry | `docs/validation/supported-label-registry.json` | Separates the 22 DTW-supported CV labels, broader learn-only app labels, and failed CV expansion labels including `small`, `wait`, and `stop` |
| No-pretrained artifact JSON audit | `docs/validation/no-pretrained-artifact-json-audit.json` | `passed`; scans the current promoted/model-card JSON artifacts and supporting evidence reports for pretrained components or disallowed promoted derived CV artifacts |
| Goal-loop prompt task progress audit | `docs/validation/goal-loop-prompt-task-progress.json` | `current_goal_prompt_tasks_audited_22_dtw_active_metric_frontier_recorded`; checkpoint 3 records failed 23-label single-blocker DTW frontier evidence, then leaves final delivery or materially different remediation work as the next step |
| Academic online Tier 1 status JSON | `docs/validation/hand-only-tier1-online-dataset-status.json` | `passed_tier1_gate`; scoped PrimaryMath keypoint benchmark only |
| PrimaryMath keypoint tier ladder status | `docs/validation/hand-only-primarymath-keypoint-tier-ladder-status.json` | `active_tier3_high_support_22_dtw_passed_25_failed`; retained LSTM/template gate still stops at 21 labels, but the accepted DTW verifier passes the high-support 22-label tier; 25-label, blocker-excluding 25-label, and all-available 31-label probes remain failed |
| PrimaryMath keypoint manifest summary | `docs/validation/hand-only-tier1-primarymath-keypoint-manifests.json` | 10-label HDF5-backed MediaPipe Holistic keypoint manifests |
| PrimaryMath keypoint LSTM diagnostic | `artifacts/rawframe-model-diagnostics/hand-only-tier1-primarymath-keypoints-lstm-e40/validation-report.json` | `passed_targets`; top-1 0.8635235732, macro recall 0.8546761812, macro F1 0.8571554427 |
| PrimaryMath keypoint template baseline | `artifacts/rawframe-model-diagnostics/template-verifier-hand-only-tier1-primarymath-keypoints-f32-k1/validation-report.json` | `passed`; top-1 0.8883374690, macro recall 0.8790094195, macro F1 0.8814103742 |
| PrimaryMath source-covered 20-label manifest summary | `docs/validation/hand-only-tier2-primarymath-plan-order-keypoint-manifests.json` | Source-covered plan-order 20 labels; exact hand-only first 20 cannot be covered by PrimaryMath |
| PrimaryMath source-covered 20-label LSTM diagnostic | `artifacts/rawframe-model-diagnostics/hand-only-tier2-primarymath-plan-order-keypoints-lstm-e40/validation-report.json` | `failed_targets`; top-1 0.7472698908, macro recall 0.6632851072, macro F1 0.6695667387, but `stop`, `plus`, `small`, and `wait` fail recall floor |
| PrimaryMath source-covered 20-label class-loss LSTM remediation | `artifacts/rawframe-model-diagnostics/hand-only-tier2-primarymath-plan-order-keypoints-lstm-classloss-e60/validation-report.json` | `failed_targets`; top-1 0.7722308892, macro recall 0.7118940218, macro F1 0.7112322482, but `stop` and `small` fail recall floor |
| PrimaryMath source-covered 20-label weighted-sampler LSTM remediation | `artifacts/rawframe-model-diagnostics/hand-only-tier2-primarymath-plan-order-keypoints-lstm-balanced-e60/validation-report.json` | `failed_targets`; top-1 0.7129485179, macro recall 0.6583454521, macro F1 0.6505299400 |
| PrimaryMath source-covered 20-label template baseline | `artifacts/rawframe-model-diagnostics/template-verifier-hand-only-tier2-primarymath-plan-order-keypoints-f32-k1/validation-report.json` | `failed_targets`; top-1 0.7847113885, macro recall 0.7021244685, macro F1 0.7023101383, but `plus`, `small`, `stop`, and `wait` fail recall floor |
| PrimaryMath high-support 20-label replacement manifest summary | `docs/validation/hand-only-tier2-primarymath-high-support-keypoint-manifests.json` | Documented source-covered replacement using 20 highest-support strict hand-only PrimaryMath labels; not exact plan-order Tier 2 |
| PrimaryMath high-support 20-label replacement LSTM diagnostic | `artifacts/rawframe-model-diagnostics/hand-only-tier2-primarymath-high-support-keypoints-lstm-e60/validation-report.json` | `passed_targets`; top-1 0.8077436582, macro recall 0.7948966934, macro F1 0.7985971252, no low-recall classes |
| PrimaryMath high-support 20-label replacement template baseline | `artifacts/rawframe-model-diagnostics/template-verifier-hand-only-tier2-primarymath-high-support-keypoints-f32-k1/validation-report.json` | `passed`; top-1 0.8344459279, macro recall 0.8213242619, macro F1 0.8252768869, no low-recall classes |
| PrimaryMath high-support 21-label manifest summary | `docs/validation/hand-only-tier3-primarymath-high-support-21-keypoint-manifests.json` | 21-label intermediate tier; starts from the passed 20-label replacement and adds `answer` |
| PrimaryMath high-support 21-label LSTM diagnostic | `artifacts/rawframe-model-diagnostics/hand-only-tier3-primarymath-high-support-21-keypoints-lstm-classloss-e80/validation-report.json` | `passed_targets`; top-1 0.7905759162, macro recall 0.7776785564, macro F1 0.7756291133, no low-recall classes |
| PrimaryMath high-support 21-label template baseline | `artifacts/rawframe-model-diagnostics/template-verifier-hand-only-tier3-primarymath-high-support-21-keypoints-f32-k1/validation-report.json` | `passed`; top-1 0.8311518325, macro recall 0.8117187181, macro F1 0.8145915024, no low-recall classes |
| PrimaryMath high-support 22-label manifest summary | `docs/validation/hand-only-tier3-primarymath-high-support-22-keypoint-manifests.json` | 22-label intermediate tier; starts from the passed 21-label tier and adds `first` |
| PrimaryMath high-support 22-label LSTM diagnostic | `artifacts/rawframe-model-diagnostics/hand-only-tier3-primarymath-high-support-22-keypoints-lstm-classloss-e80/validation-report.json` | `failed_targets`; top-1 0.8187660668, macro recall 0.7886715314, macro F1 0.7900099704, but `first` fails recall floor |
| PrimaryMath high-support 22-label template baseline | `artifacts/rawframe-model-diagnostics/template-verifier-hand-only-tier3-primarymath-high-support-22-keypoints-f32-k1/validation-report.json` | `failed_targets`; top-1 0.8239074550, macro recall 0.7943029322, macro F1 0.7986663643, but `first` fails recall floor |
| PrimaryMath high-support 22-label DTW verifier | `artifacts/rawframe-model-diagnostics/dtw-verifier-hand-only-tier3-primarymath-high-support-22-keypoints-f32-prefilter-k1-c12/validation-report.json` | `passed`; active scoped academic keypoint claim; prefiltered k=1 DTW reaches top-1 0.8213367609, macro recall 0.7932041116, macro F1 0.7992118151, no low-recall classes |
| PrimaryMath high-support 25-label manifest summary | `docs/validation/hand-only-tier3-primarymath-high-support-25-keypoint-manifests.json` | 25-label intermediate tier; starts from the passed 20-label replacement and adds `small`, `answer`, `wait`, `first`, and `stop` |
| PrimaryMath high-support 25-label LSTM diagnostic | `artifacts/rawframe-model-diagnostics/hand-only-tier3-primarymath-high-support-25-keypoints-lstm-e70/validation-report.json` | `failed_targets`; top-1 0.7814407814, macro recall 0.7203160912, macro F1 0.7242029673, but `first`, `small`, `stop`, and `wait` fail recall floor |
| PrimaryMath high-support 25-label class-loss LSTM remediation | `artifacts/rawframe-model-diagnostics/hand-only-tier3-primarymath-high-support-25-keypoints-lstm-classloss-e80/validation-report.json` | `failed_targets`; top-1 0.7570207570, macro recall 0.7061631485, macro F1 0.7054902873, but `small`, `stop`, and `wait` fail recall floor |
| PrimaryMath high-support 25-label template baseline | `artifacts/rawframe-model-diagnostics/template-verifier-hand-only-tier3-primarymath-high-support-25-keypoints-f32-k1/validation-report.json` | `failed_targets`; top-1 0.7924297924, macro recall 0.7231719636, macro F1 0.7256021390, but `first`, `small`, `stop`, and `wait` fail recall floor |
| PrimaryMath high-support 25-label DTW verifier candidate | `artifacts/rawframe-model-diagnostics/dtw-verifier-hand-only-tier3-primarymath-high-support-25-keypoints-f32-prefilter-k1-c12/validation-report.json` | `failed_targets`; top-1 0.7924297924, macro recall 0.7254146545, macro F1 0.7286596520, but `small`, `wait`, and `stop` fail recall floor |
| PrimaryMath blocker-excluding 25-label replacement manifest summary | `docs/validation/hand-only-tier3-primarymath-blocker-excluding-25-keypoint-manifests.json` | 25-label replacement excluding `small`, `stop`, `wait`, and `first`; adds `answer`, `gray`, `equal`, `group`, and `next` |
| PrimaryMath blocker-excluding 25-label replacement LSTM diagnostic | `artifacts/rawframe-model-diagnostics/hand-only-tier3-primarymath-blocker-excluding-25-keypoints-lstm-classloss-e80/validation-report.json` | `failed_targets`; top-1 0.7743142145, macro recall 0.6819602137, macro F1 0.6805399708, but `gray`, `equal`, `group`, and `next` fail recall floor |
| PrimaryMath blocker-excluding 25-label replacement template baseline | `artifacts/rawframe-model-diagnostics/template-verifier-hand-only-tier3-primarymath-blocker-excluding-25-keypoints-f32-k1/validation-report.json` | `failed_targets`; top-1 0.7917705736, macro recall 0.6871892796, macro F1 0.6831111361, but `equal`, `gray`, `group`, and `next` fail recall floor |
| PrimaryMath sparse-label remediation queue | `docs/validation/hand-only-primarymath-sparse-label-remediation-queue.json` | `in_progress_primarymath_25_sparse_labels_need_remediation`; hard blockers `wait`, `stop`, and `small`, watchlist `first`, passed added-label check `answer`; ASL Citizen remediation import/manifests now cover all five affected labels |
| ASL Citizen PrimaryMath remediation ZIP probe labels | `docs/validation/hand-only-primarymath-remediation-asl-citizen-probe-labels.json` | Probe selection for `small`, `wait`, `stop`, `first`, and `answer` |
| ASL Citizen PrimaryMath remediation ZIP index probe | `docs/research/asl-citizen-primarymath-remediation-zip-index-probe.json` | `range_index_probe_completed`; official ZIP index has matches for all five remediation labels without full-archive download |
| ASL Citizen PrimaryMath remediation selected raw import | `docs/research/asl-citizen-primarymath-remediation-raw-clip-import.json` | `selected_raw_clips_imported`; 142 selected raw RGB clips, 74.6 MB, no missing official split |
| ASL Citizen PrimaryMath remediation manifests | `docs/validation/asl-citizen-primarymath-remediation-manifests.json` | `written`; source-bound raw RGB train/validation/test manifests for `answer`, `first`, `small`, `stop`, and `wait`; full-frame and three ROI tensor variants decoded |
| ASL Citizen PrimaryMath remediation CNN+LSTM diagnostic | `artifacts/rawframe-model-diagnostics/asl-citizen-primarymath-remediation-raw-cnn-lstm-e30/validation-report.json` | `failed_targets`; top-1 0.2000, macro recall 0.2000, macro F1 0.1812 |
| ASL Citizen PrimaryMath remediation raw RGB template baseline | `artifacts/rawframe-model-diagnostics/template-verifier-asl-citizen-primarymath-remediation-raw-f32-k1/validation-report.json` | `failed_targets`; top-1 0.3000, macro recall 0.3000, macro F1 0.2863 |
| ASL Citizen PrimaryMath remediation fused ROI decode | `docs/validation/asl-citizen-primarymath-remediation-roi-fused-chest-saliency-decode.json` | `verified`; project-owned FFmpeg plus NumPy fused chest/saliency ROI tensors, no MediaPipe/OpenCV/detectors/landmarks |
| ASL Citizen PrimaryMath remediation fused ROI CNN+LSTM diagnostic | `artifacts/rawframe-model-diagnostics/asl-citizen-primarymath-remediation-roi-fused-chest-saliency-cnn-lstm-e30/validation-report.json` | `failed_targets`; top-1 0.2200, macro recall 0.2200, macro F1 0.1679 |
| ASL Citizen PrimaryMath remediation fused ROI template baseline | `artifacts/rawframe-model-diagnostics/template-verifier-asl-citizen-primarymath-remediation-roi-fused-chest-saliency-f32-k1/validation-report.json` | `failed_targets`; top-1 0.2600, macro recall 0.2600, macro F1 0.2556 |
| ASL Citizen PrimaryMath remediation fixed-chest ROI decode | `docs/validation/asl-citizen-primarymath-remediation-roi-fixed-chest-decode.json` | `decoded`; project-owned FFmpeg plus NumPy fixed-chest ROI tensors, no MediaPipe/OpenCV/detectors/landmarks |
| ASL Citizen PrimaryMath remediation fixed-chest ROI CNN+LSTM diagnostic | `artifacts/rawframe-model-diagnostics/asl-citizen-primarymath-remediation-roi-fixed-chest-cnn-lstm-e30/validation-report.json` | `failed_targets`; top-1 0.2000, macro recall 0.2000, macro F1 0.1899 |
| ASL Citizen PrimaryMath remediation fixed-chest ROI template baseline | `artifacts/rawframe-model-diagnostics/template-verifier-asl-citizen-primarymath-remediation-roi-fixed-chest-f32-k1/validation-report.json` | `failed_targets`; top-1 0.2600, macro recall 0.2600, macro F1 0.2440 |
| ASL Citizen PrimaryMath remediation heuristic ROI decode | `docs/validation/asl-citizen-primarymath-remediation-roi-heuristic-decode.json` | `decoded`; project-owned FFmpeg plus NumPy heuristic motion/skin ROI tensors, no MediaPipe/OpenCV/detectors/landmarks |
| ASL Citizen PrimaryMath remediation heuristic ROI CNN+LSTM diagnostic | `artifacts/rawframe-model-diagnostics/asl-citizen-primarymath-remediation-roi-heuristic-cnn-lstm-e30/validation-report.json` | `failed_targets`; top-1 0.2000, macro recall 0.2000, macro F1 0.1533 |
| ASL Citizen PrimaryMath remediation heuristic ROI template baseline | `artifacts/rawframe-model-diagnostics/template-verifier-asl-citizen-primarymath-remediation-roi-heuristic-f32-k1/validation-report.json` | `failed_targets`; top-1 0.3400, macro recall 0.3400, macro F1 0.3366 |
| ASL Citizen PrimaryMath remediation high-resolution heuristic ROI decode | `docs/validation/asl-citizen-primarymath-remediation-roi-heuristic-128-f24-decode.json` | `verified`; project-owned FFmpeg plus NumPy heuristic motion/skin ROI tensors at 24 frames and 128px crops, no MediaPipe/OpenCV/detectors/landmarks |
| ASL Citizen PrimaryMath remediation high-resolution heuristic ROI contact sheets | `docs/validation/asl-citizen-primarymath-remediation-roi-heuristic-128-f24-visual-diagnostic.json` | `passed_no_gross_tensor_issue`; 30 sampled clips across `answer`, `first`, `small`, `stop`, and `wait`; visual-review input only |
| ASL Citizen PrimaryMath remediation ROI/keypoint review packet | `docs/review/asl-citizen-primarymath-remediation-roi-review-packet.json` | `needs_roi_keypoint_review_not_training_data`; 5 labels, 30 sampled clips, priority labels `first`, `small`, `stop`, and `wait` |
| ASL Citizen PrimaryMath remediation ROI/keypoint review HTML | `docs/review/asl-citizen-primarymath-remediation-roi-review.html` | Static reviewer handoff page generated from the review packet and contact sheets |
| ASL Citizen PrimaryMath remediation ROI/keypoint review protocol | `docs/review/asl-citizen-primarymath-roi-review-protocol.md` | Reviewer instructions, allowed return statuses, and validation commands for the returned packet |
| ASL Citizen PrimaryMath remediation ROI/keypoint review return template | `docs/review/asl-citizen-primarymath-remediation-roi-review-return.template.json` | Editable reviewer return JSON with deliberate `TODO_ONE_OF` placeholders; not a reviewed packet until audited after real reviewer decisions |
| ASL Citizen PrimaryMath remediation ROI/keypoint compact intake template | `docs/review/asl-citizen-primarymath-remediation-roi-review-return.intake.template.json` | Compact reviewer intake JSON for the five per-label ROI/visibility decisions; expands to the full returned packet through `scripts/draft_asl_citizen_primarymath_roi_review_return_from_intake.mjs` |
| ASL Citizen PrimaryMath remediation ROI/keypoint local review UI | `web/src/app/review/asl-citizen-primarymath-roi/page.tsx` | Local reviewer web app that displays contact sheets, collects allowed reviewer decisions, drafts returned JSON, and can stage/audit/export through the existing scripts from localhost |
| ASL Citizen PrimaryMath remediation ROI/keypoint returned-review staging helper | `scripts/stage_asl_citizen_primarymath_roi_review_return.mjs` | Copies a returned review JSON into ignored `data/asl-citizen-primarymath-roi-review/` before audit/export; rejects symlinks, wrong schema, and `TODO` placeholders |
| ASL Citizen PrimaryMath remediation ROI/keypoint returned-review pipeline smoke | `docs/validation/asl-citizen-primarymath-remediation-roi-return-pipeline-smoke.json` | `passed`; smoke-only synthetic returned packet proves staging, audit, and reviewed-manifest export plumbing under `output/`, not review evidence |
| ASL Citizen PrimaryMath remediation ROI/keypoint review handoff | `docs/validation/asl-citizen-primarymath-remediation-roi-review-handoff.json` | `request_ready_pending_reviewer_return`; ignored bundle at `output/review-handoff/asl-citizen-primarymath-roi-review` contains packet, HTML, protocol, return template, status snapshots, visual diagnostic, staging helper, and five contact sheets |
| ASL Citizen PrimaryMath remediation ROI/keypoint review handoff audit | `docs/validation/asl-citizen-primarymath-remediation-roi-review-handoff-audit.json` | `roi_review_handoff_request_ready`; validates ignored bundle hashes, request-material boundaries, and contact-sheet hash pins |
| ASL Citizen PrimaryMath remediation ROI/keypoint review handoff package | `docs/validation/asl-citizen-primarymath-remediation-roi-review-handoff-package.json` | `handoff_package_ready_for_reviewer_delivery`; sendable zip archive at `output/review-handoff/asl-citizen-primarymath-roi-review.zip` contains all 18 handoff files, delivery note is at `output/review-handoff/asl-citizen-primarymath-roi-review-delivery-message.md`, and both are request material only |
| ASL Citizen PrimaryMath remediation ROI/keypoint review status | `docs/validation/asl-citizen-primarymath-remediation-roi-review-status.json` | `reviewed_roi_packet_ready_for_manifest_export`; visual approve-all ROI/crop review processed for `answer`, `first`, `small`, `stop`, and `wait`; not ASL correctness or fluency attestation |
| ASL Citizen PrimaryMath remediation reviewed ROI manifest export | `docs/validation/asl-citizen-primarymath-remediation-roi-reviewed-manifests.json` | `reviewed_roi_manifests_written`; reviewed ROI train/validation/test manifests written for 75/17/50 clips across five labels |
| ASL Citizen PrimaryMath remediation reviewed ROI CNN+LSTM diagnostic | `artifacts/rawframe-model-diagnostics/asl-citizen-primarymath-remediation-roi-reviewed-cnn-lstm-e40/validation-report.json` | `failed_targets`; top-1 0.2000, macro recall 0.2000, macro F1 0.1200; `answer`, `first`, `stop`, and `wait` fail recall floor |
| ASL Citizen PrimaryMath remediation reviewed ROI template baseline | `artifacts/rawframe-model-diagnostics/template-verifier-asl-citizen-primarymath-remediation-roi-reviewed-f40-k1/validation-report.json` | `failed_targets`; top-1 0.4200, macro recall 0.4200, macro F1 0.4101; `first` and `wait` fail recall floor |
| ASL Citizen PrimaryMath remediation high-resolution heuristic ROI CNN+LSTM diagnostic | `artifacts/rawframe-model-diagnostics/asl-citizen-primarymath-remediation-roi-heuristic-128-f24-cnn-lstm-e40/validation-report.json` | `failed_targets`; top-1 0.2000, macro recall 0.2000, macro F1 0.1799 |
| ASL Citizen PrimaryMath remediation high-resolution heuristic ROI template baseline | `artifacts/rawframe-model-diagnostics/template-verifier-asl-citizen-primarymath-remediation-roi-heuristic-128-f24-f40-k1/validation-report.json` | `failed_targets`; top-1 0.4200, macro recall 0.4200, macro F1 0.4101, but `first` and `wait` fail recall floor |
| PrimaryMath all-available strict-hand source-ceiling manifest summary | `docs/validation/hand-only-tier3-primarymath-all-available-strict-keypoint-manifests.json` | 31 labels; PrimaryMath cannot source-cover the planned 35-label Tier 3 |
| PrimaryMath all-available strict-hand source-ceiling LSTM diagnostic | `artifacts/rawframe-model-diagnostics/hand-only-tier3-primarymath-all-available-strict-keypoints-lstm-e60/validation-report.json` | `failed_targets`; top-1 0.7276887872, macro recall 0.5759423901, macro F1 0.5744503945, 11 sparse labels fail recall floor |
| PrimaryMath all-available strict-hand source-ceiling class-loss LSTM remediation | `artifacts/rawframe-model-diagnostics/hand-only-tier3-primarymath-all-available-strict-keypoints-lstm-classloss-e80/validation-report.json` | `failed_targets`; top-1 0.7105263158, macro recall 0.5850386967, macro F1 0.5886960563, 9 sparse labels fail recall floor |
| PrimaryMath all-available strict-hand source-ceiling template baseline | `artifacts/rawframe-model-diagnostics/template-verifier-hand-only-tier3-primarymath-all-available-strict-keypoints-f32-k1/validation-report.json` | `failed_targets`; top-1 0.7459954233, macro recall 0.5957631276, macro F1 0.5944616849, sparse labels fail recall floor |
| PrimaryMath source-covered 20-label remediation plan | `docs/validation/hand-only-tier2-primarymath-remediation-plan.json` | `primarymath_high_support_25_failed`; plan-order Tier 2 remains failed, high-support replacement passes, 25-label near-miss fails on `small`, `stop`, and `wait` |
| Online hand-only extension status | `docs/validation/hand-only-online-extension-status.json` | `in_progress_no_verified_extension_beyond_primarymath_22_dtw`; no current ASL Citizen, WLASL, PopSign, or MS-ASL lane verifies extension beyond the 22-label PrimaryMath DTW keypoint tier |
| Controlled-pilot model strategy triage | `docs/validation/controlled-pilot-model-strategy-triage.json` | `blocked_model_only_lanes_exhausted_waiting_for_approved_source_evidence`; 12 retained trained/template/hybrid/threshold candidates reviewed, 0 promotable |
| Controlled-pilot validation report JSON | `artifacts/rawframe-model/controlled-pilot-validation-report.json` | `controlled_pilot_validation_failed` |
| Controlled-pilot prediction sidecar | `artifacts/rawframe-model/controlled-pilot-prediction-sidecar.json` | Present for diagnostics and threshold analysis |
| Controlled-pilot browser quality-gate diagnostic | `docs/validation/controlled-pilot-browser-quality-gate-diagnostic.json` | Diagnostic only; raw RGB luma/contrast precheck reduces but does not clear negative false-pass |
| Controlled-pilot reject-score grid diagnostic | `docs/validation/controlled-pilot-reject-score-grid-diagnostic.json` | Diagnostic only; confidence/margin/entropy gates clear negatives only at near-zero coverage |
| Per-label threshold diagnostic | `docs/validation/controlled-pilot-per-label-threshold-diagnostic.json` | `incomplete_per_label_thresholds_from_controlled_pilot_evidence` |
| Controlled-pilot reduced-label ladder manifests | `docs/validation/controlled-pilot-label-ladder-manifests.json` | Diagnostic only; generated from current failed controlled-pilot report |
| 5-label reduced-scope diagnostic report | `artifacts/rawframe-model-diagnostics/controlled-pilot-label-ladder-005-motion-20260521T183940Z/validation-report.json` | `smoke_only`; not promotable |
| 10-label reduced-scope diagnostic report | `artifacts/rawframe-model-diagnostics/controlled-pilot-label-ladder-010-motion-20260521T184020Z/validation-report.json` | `smoke_only`; not promotable |
| 10-label strong-augmentation diagnostic report | `artifacts/rawframe-model-diagnostics/controlled-pilot-label-ladder-010-motion-strong-20260521T190500Z/validation-report.json` | `smoke_only`; stronger augmentation did not improve the reduced-label result |
| 10-label compact 3D clip-normalized diagnostic report | `artifacts/rawframe-model-diagnostics/controlled-pilot-label-ladder-010-compact-clipnorm-basic-20260521T190900Z/validation-report.json` | `smoke_only`; lower test accuracy than motion baseline |
| 10-label factorized 3D diagnostic report | `artifacts/rawframe-model-diagnostics/controlled-pilot-label-ladder-010-factorized-basic-20260521T191100Z/validation-report.json` | `smoke_only`; best reduced-label architecture so far but still failed gates |
| 10-label factorized failure analysis | `docs/validation/controlled-pilot-label-ladder-010-factorized-failure-analysis.json` | Diagnostic label/signer/confusion analysis for the best reduced-label run |
| 10-label factorized split-shift diagnostic | `docs/validation/controlled-pilot-label-ladder-010-factorized-split-shift-diagnostic.json` | Diagnostic low-level raw-frame split/source signal check |
| 10-label factorized remediation plan | `docs/validation/controlled-pilot-label-ladder-010-factorized-remediation-plan.json` | Data-side remediation priorities; not training data and not source approval |
| 10-label factorized remediation collection queue | `data/dataset/controlled-pilot-label-ladder-010-factorized-remediation-collection-queue.json` | Non-final collection queue; does not change manifests or training data |
| 10-label factorized remediation collection queue audit | `docs/validation/controlled-pilot-label-ladder-010-factorized-remediation-collection-queue-audit.json` | `passed_nonfinal_queue_audit`; no findings, but collection/source blockers remain |
| Controlled-pilot clip-heldout manifests | `docs/validation/controlled-pilot-clip-heldout-manifests.json` | `clip_heldout_manifests_ready_not_signer_disjoint_evidence`; 95-label fallback split, explicitly not signer-disjoint |
| Controlled-pilot clip-heldout factorized candidate | `artifacts/rawframe-model-clip-heldout/validation-report.json` | `controlled_clip_heldout_validation_failed`; does not support promotion |
| Collection plan contract audit | `scripts/audit_collection_plan_contract.mjs` | `passed`; plan API exposes the current matching remediation queue and the collection panel orders by it |
| Tier-1 hand-only collection packet | `docs/validation/canonical-verifier-collection-packet.json` | `canonical_collection_packet_ready_not_training_data`; active first-party queue target is `book`, `car`, `milk`, `help`, `stop`, `finish`, `school`, `chair`, `airplane`, and `plus` |
| Tier-1 hand-only active collection queue | `data/dataset/canonical-verifier-010-collection-queue.json` | `queue_ready_not_training_data`; 235 focused assignments, 150 vocabulary captures plus 85 hard-negative captures, first row `vocabulary:1056` / `book` |
| Controlled-pilot remediation queue API smoke | `docs/validation/controlled-pilot-remediation-queue-api-smoke.json` | `passed`; authenticated default collection API returns the active Tier-1 hand-only queue starting at `vocabulary:1056` / `book` |
| Dataset collection UI queue smoke | `docs/validation/dataset-collection-ui-queue-smoke.json` | `passed`; authenticated operator UI auto-loads `#1 · vocabulary:1056 · Test · signer-001 · Book` from the active queue |
| Canonical verifier collection readiness | `docs/validation/canonical-verifier-collection-readiness.json` | `blocked_waiting_for_canonical_first_party_collection`; store absent, 150 vocabulary clips and 85 hard-negative clips required, 0 approved |
| Canonical verifier first-party manifest export | `docs/validation/canonical-verifier-first-party-manifest-export.json` | `blocked_canonical_collection_not_export_ready`; no first-party manifests written while readiness is blocked |
| Controlled-pilot source remediation status | `docs/validation/controlled-pilot-source-remediation-status.json` | `blocked_waiting_for_training_or_validation`; browser model card remains `not_trained` and controlled-pilot validation has not passed |
| Practice scope copy smoke | `docs/validation/practice-scope-copy-smoke.json` | `passed`; isolated rendered auth/practice UI uses prompt-catalog wording and discloses not-trained checker scope without claiming full-catalog CV support or mutating the canonical store |
| Collection session handoff bundle | `output/collection-handoff/collection-session-bundle/MANIFEST.json` | `ready_for_capture`; operator queue now references the active Tier-1 hand-only collection queue |
| First-party store preflight | `docs/validation/first-party-store-preflight.json` | `store_absent_runtime_can_initialize_empty_schema`; non-mutating, confirms the canonical ignored store path and empty-schema runtime initialization |
| Raw-frame template verifier diagnostic script | `scripts/evaluate_rawframe_template_verifier.py` | Prompt-conditioned kNN/template diagnostic only |
| 95-label template verifier diagnostic report | `artifacts/rawframe-model-diagnostics/template-verifier-controlled-95-20260521T190000Z/validation-report.json` | `diagnostic_failed`; conservative but inaccurate |
| 95-label template verifier nearest-neighbor report | `artifacts/rawframe-model-diagnostics/template-verifier-controlled-95-f24-k1-20260521T190000Z/validation-report.json` | `diagnostic_failed`; conservative but inaccurate |
| 95-label template verifier relaxed-threshold report | `artifacts/rawframe-model-diagnostics/template-verifier-controlled-95-f16-k3-relaxed-20260521T190000Z/validation-report.json` | `diagnostic_failed`; safer false-pass tradeoff with low true acceptance |
| Hybrid CNN/template strict diagnostic | `docs/validation/hybrid-cnn-template-verifier-diagnostic.json` | `diagnostic_failed`; strict validation thresholds do not transfer |
| Hybrid CNN/template relaxed diagnostic | `docs/validation/hybrid-cnn-template-verifier-relaxed-diagnostic.json` | `diagnostic_failed`; low false-pass but too little true acceptance |
| Final research-grade validation report JSON | `artifacts/rawframe-model/validation-report.json` | Still failed and retained as hardening evidence |
| Calibrated provenance JSON | `artifacts/rawframe-model/calibrated-provenance.json` | Not promoted for the current failed controlled candidate |
| Negative challenge manifest | `data/manifests/negative-challenge.json` | Core controlled-pilot taxonomy present; expanded hard-negative taxonomy remains hardening |

## Controlled Pilot Conditions

- Browser: modern desktop browser with camera support.
- Camera: built-in or external webcam.
- Lighting: even front lighting; avoid backlighting.
- Framing: upper torso and hands visible; hands remain inside the camera frame.
- Distance: approximately 0.8-1.5 meters from the camera.
- Signing: isolated vocabulary sign only, one prompt at a time.

## Accuracy Targets

Current controlled-pilot candidate targets:

- Top-1 validation accuracy: 70 percent or higher under controlled conditions.
- Macro F1: 0.65 or higher across the approved 75-100 labels.
- False-pass rate on incorrect prompted signs: below 10 percent.
- Negative challenge false-pass rate for empty-camera/no-hands/low-light/off-center clips: below 5 percent.
- Unknown/uncertain attempts should fail closed when confidence is below threshold.

Latest controlled-pilot result:

- Validation top-1 accuracy: 0.0353684211.
- Validation macro F1: 0.0164546077.
- Test top-1 accuracy: 0.0526315789.
- Test macro F1: 0.0283110504.
- Global threshold selected from validation: 0.1.
- Test false-pass rate at the global threshold: 0.1185595568.
- Core negative-challenge false-pass rate at the global threshold: 0.3.
- Per-label threshold diagnostic selected thresholds for 4 of 95 labels; 91 labels remain fail-closed at threshold 1.0.
- Held-out test accepted precision under the diagnostic per-label thresholds: 0.1111111111.
- The best global fail-closed diagnostic threshold that satisfies validation
  precision and core negative-challenge constraints is 0.335521. At that
  threshold, held-out test accepted precision is 1.0, but coverage is only
  0.0016620499, with 3 accepted correct examples out of 1805.

Reduced-label diagnostic results:

- The controlled-pilot label ladder was generated from the current failed
  controlled-pilot report and is marked diagnostic only.
- 5-label motion-temporal diagnostic: validation top-1 0.36, validation macro
  F1 0.3549579105, test top-1 0.4631578947, test macro F1 0.4499400459,
  selected threshold 0.81, test false-pass rate 0.0842105263, and core
  negative-challenge false-pass rate 0.25.
- 10-label motion-temporal diagnostic: validation top-1 0.28, validation macro
  F1 0.2571014086, test top-1 0.3052631579, test macro F1 0.2621692644,
  selected threshold 0.44, test false-pass rate 0.2052631579, and core
  negative-challenge false-pass rate 0.4.
- 10-label strong-augmentation motion-temporal diagnostic: best validation
  top-1 0.288 at epoch 12, final train accuracy 0.752, test top-1
  0.2578947368, test macro F1 0.2270088631, selected threshold 0.65, test
  false-pass rate 0.1684210526, and core negative-challenge false-pass rate
  0.3. Strong augmentation reduced memorization and false passes, but it also
  reduced held-out test accuracy versus the basic 10-label diagnostic.
- 10-label compact 3D clip-normalized diagnostic: best validation top-1 0.288
  at epoch 18, final train accuracy 0.924, test top-1 0.1736842105, test macro
  F1 0.1543302776, selected threshold 0.55, test false-pass rate
  0.1631578947, and core negative-challenge false-pass rate 0.35.
- 10-label factorized 3D diagnostic: best validation top-1 0.336 at epoch 16,
  final train accuracy 0.804, test top-1 0.3368421053, test macro F1
  0.2899669340, selected threshold 0.4, test false-pass rate 0.1894736842,
  and core negative-challenge false-pass rate 0.25. This is the strongest
  reduced-label architecture result so far, but it still misses the controlled
  pilot gates even on 10 labels.
- Factorized 3D failure analysis: train/validation/test signer overlap remains
  0, so the reduced ladder is still signer-disjoint. The run has 30 train
  signers, 8 validation signers, and 7 test signers. Final train accuracy minus
  selected validation accuracy is 0.468. Test has one zero-correct signer and
  one zero-recall label, `white`.
- Factorized 3D confusion analysis: validation over-predicts `mad`, `table`,
  and `please`; test over-predicts `mad` with 77 predictions out of 190 clips.
  Top test confusions include `pencil` to `mad` 14 times, `person` to `mad` 12
  times, `say` to `mad` 9 times, `morning` to `mad` 8 times, and `white` to
  `please` 8 times / `table` 7 times.
- Factorized 3D split-shift diagnostic: 180 sampled clips show mean nearest
  own-split rate 0.5222222222, validation nearest-train-label-centroid accuracy
  0.05, and test nearest-train-label-centroid accuracy 0.1666666667. Low-level
  RGB centroids do not explain enough of the held-out problem to be a remedy.
- Factorized 3D remediation overlay: priority labels from the existing
  collection plan are `white`, `say`, `pencil`, `morning`, `person`,
  `thirsty`, `horse`, `please`, and `table`. Blockers remain the absent
  first-party collection store (`data/asl-pilot-store.json`) and lack of NVIDIA
  metadata readiness/source-register approval.
- Controlled clip-heldout fallback: deterministic 95-label manifests now exist
  under `data/manifests/controlled-pilot-clip-heldout/`, with 3895 train clips,
  1235 validation clips, and 1425 test clips. The split intentionally pools
  approved PopSign train/validation/test clips by label and repartitions at the
  clip level, so it is not signer-disjoint and must be described as a controlled
  limitation.
- Controlled clip-heldout factorized candidate: a 15-epoch from-scratch MPS run
  in `artifacts/rawframe-model-clip-heldout/` failed validation. Validation
  top-1 was 0.0388663968, validation macro F1 was 0.0186632010, held-out test
  top-1 was 0.0315789474, held-out test macro F1 was 0.0150384631, test
  false-pass at threshold 0.07 was 0.0905263158, and core negative-challenge
  false-pass was 0.1. The false-pass target passed on the test split, but top-1,
  macro F1, and negative-challenge targets failed.
- Factorized 3D focused collection queue: 1500 non-final assignments were
  generated from the remediation plan, with 1425 vocabulary assignments and 75
  negative-challenge assignments across 95 labels. The queue prioritizes 9
  remediation labels, with buckets `zero_recall_test` 15,
  `top_confusion_true_label` 120, `standard` 1290, and
  `negative_challenge_required` 75. The queue audit passed with no findings, but
  its decision boundary remains false for store changes, manifest changes,
  source approval, and final evidence.
- The dataset collection plan API now prefers the focused controlled-pilot
  remediation queue for the default collection plan, falls back to the broader
  remediation queue when the focused file is absent, and rejects any present
  queue that does not reference the current collection-plan path and SHA-256.
  The collection panel uses the returned queue to sort assignments and start at
  the first priority item.
- The controlled-pilot remediation queue API smoke starts the built app in
  explicit collection mode with the real default collection plan and real
  focused queue, creates only a temporary operator account under `output/`, and
  verifies that authenticated `/api/dataset/plan` returns 1425 vocabulary
  assignments, 75 negative-challenge assignments, a 1500-row remediation queue,
  and first queue row `vocabulary:325` / `white` / `zero_recall_test` matching
  the real collection-plan assignment.
- The controlled-pilot source remediation status audit now separates planning
  readiness from route selection. It records `first_party_planning_ready: true`
  but `first_party_route_selected: false`, and its recommended next action is
  `scale_approved_raw_video_data_or_change_compliant_model_strategy_before_next_controlled_training`.
  It also reports that NVIDIA ASL 1000 is not registered or metadata-ready
  because the accepted access receipt and metadata staging directory are absent.
- The collection session bundle has been regenerated against the same focused
  queue used by the app and source-remediation audit. Its
  `remediation-collection-queue.csv` starts at `vocabulary:325` / `white`,
  and `scripts/audit_collection_session_bundle.mjs --require-ready` passes.
- The first-party store preflight remains non-mutating planning evidence. It
  confirms `data/asl-pilot-store.json` is the gitignored canonical store path
  and that the server runtime can initialize the empty schema on first read, but
  it is not the active route after the 2026-05-25 correction.
- These runs show the pipeline can learn some signal on a reduced label set,
  but even the easiest controlled subset remains below the controlled-pilot
  accuracy and negative-challenge gates. They do not support browser model-card
  promotion.

Prompt-conditioned template verifier diagnostic results:

- `scripts/evaluate_rawframe_template_verifier.py` evaluates a no-pretrained,
  raw-frame-only kNN/template verifier with per-label thresholds selected from
  validation. It is diagnostic-only and does not export a browser model.
- 5-label template diagnostic: validation top-1 0.32, test top-1 0.4, test
  macro F1 0.3960213008, test wrong-prompt false-pass rate 0.0026315789, and
  negative-challenge false-pass rate 0.0.
- 10-label template diagnostic: validation top-1 0.208, test top-1 0.2, test
  macro F1 0.2027495754, test wrong-prompt false-pass rate
  0.0011695906, and negative-challenge false-pass rate 0.0.
- 95-label template diagnostic with feature size 16 and 3-neighbor averaging:
  validation top-1 0.0341052632, test top-1 0.0371191136, test macro F1
  0.0310064704, test wrong-prompt false-pass rate 0.0000648317, and
  negative-challenge false-pass rate 0.0.
- 95-label template diagnostic with feature size 24 and 1-nearest-neighbor:
  validation top-1 0.024, test top-1 0.0365650970, test macro F1
  0.0344389607, test wrong-prompt false-pass rate 0.0000058938, and
  negative-challenge false-pass rate 0.0.
- 95-label relaxed-threshold template diagnostic with feature size 16 and
  3-neighbor averaging: validation true-prompt accept rate 0.1709473684,
  validation wrong-prompt false-pass rate 0.0751982083, test true-prompt
  accept rate 0.0498614958, test wrong-prompt false-pass rate 0.0240466788,
  and negative-challenge false-pass rate 0.0.
- The template route improves fail-closed reject behavior, but true recognition
  and accepted true-prompt coverage remain far too low for the controlled pilot.

Hybrid CNN/template verifier diagnostic results:

- `scripts/analyze_hybrid_cnn_template_verifier.mjs` combines the current CNN
  controlled-pilot prediction sidecar with the raw-frame template sidecar. For
  prompted label L, it passes only when the CNN top prediction is L, CNN
  confidence meets the per-label CNN threshold, and the template score for L
  meets the per-label template threshold. Thresholds are selected on validation.
- Strict hybrid diagnostic (`min_accepted_precision` 0.9): validation true
  accept rate 0.0054736842 with zero wrong-prompt false accepts; held-out test
  true accept rate 0.0022160665, accepted precision 0.0930232558,
  wrong-prompt false-pass rate 0.0002298580, and negative-challenge false-pass
  rate 0.1.
- Relaxed hybrid diagnostic (`min_accepted_precision` 0): validation true
  accept rate 0.0155789474, validation wrong-prompt false-pass rate
  0.0004658455; held-out test true accept rate 0.0094182825, accepted
  precision 0.1545454545, wrong-prompt false-pass rate 0.0005481228, and
  negative-challenge false-pass rate 0.05.
- Hybrid gating reduces wrong-prompt false passes compared with the CNN global
  threshold, but it does not provide enough true prompted accepts and does not
  clear the core negative-challenge gate.

Browser quality-gate diagnostic results:

- `scripts/analyze_controlled_pilot_browser_quality_gate.py` simulates the
  browser `evaluateLocalAttempt()` raw RGB quality precheck over the retained
  controlled-pilot prediction sidecar. It uses only luma and contrast from the
  decoded raw frames, not landmarks, detectors, or pretrained features.
- At the current controlled-pilot threshold `0.1`, the browser quality gate
  rejects 0 of 2375 validation clips and 38 of 1805 test clips. Test accepted
  coverage after the quality gate is `0.1296398892`, and accepted precision is
  `0.1410256410`.
- On the 20 core negative-challenge clips, the quality gate rejects 7 clips and
  reduces model false-pass from 6/20 (`0.3`) to 3/20 (`0.15`). It clears the
  low-light false passes but still leaves no-hands-visible and off-center false
  passes.
- This diagnostic is useful product-parity evidence for fail-closed prechecks,
  but it does not change weights, thresholds, model-card status, or final
  evidence. The candidate still fails the negative-challenge target.

Reject-score grid diagnostic results:

- `scripts/analyze_controlled_pilot_reject_score_grid.mjs` searches
  validation-selected fail-closed gates over confidence, top-1 probability
  margin, and entropy from the controlled-pilot prediction sidecar. It does not
  use negative-challenge outcomes for the deployable validation-selected gate.
- The validation-selected confidence/margin/entropy gate accepts 253 of 2375
  validation clips, with validation accepted precision `0.1264822134` and
  validation false-pass rate `0.0930526316`. On held-out test it accepts 280 of
  1805 clips, with accepted precision `0.1142857143` and false-pass rate
  `0.1373961219`. It worsens core negative-challenge false-pass to `0.35`.
- A separate negative-challenge oracle grid point can reduce core
  negative-challenge false-pass to `0.0`, but it accepts only 1 validation clip
  and 1 test clip. That proves confidence/margin/entropy thresholds can clear
  negatives only by collapsing useful coverage for the current checkpoint.
- This closes the current reject-score tuning lane for this candidate. Better
  controlled-pilot evidence requires improved model/data generalization, not a
  more elaborate threshold policy over the same scores.

Controlled-pilot model strategy triage:

- `scripts/audit_controlled_pilot_model_strategy.mjs` summarizes retained
  trained-model, template-verifier, hybrid-verifier, quality-gate, and
  reject-score diagnostics without training, importing media, changing
  manifests, creating the first-party store, or promoting the browser model.
- The triage status is
  `blocked_model_only_lanes_exhausted_waiting_for_approved_source_evidence`.
  It reviewed 12 retained candidates and found 0 promotable candidates.
- Best retained 75-95 label test top-1 remains the final signer-disjoint motion
  CNN at `0.0891966759`. Best retained prompt true-accept rate is the relaxed
  95-label template verifier at `0.0498614958`.
- The retained evidence now supports the narrower blocker: current approved
  PopSign-only model/verifier/threshold lanes are exhausted for the controlled
  pilot, and the active route still needs source-register-safe raw-video
  evidence or an explicit reduced-scope decision.
- The first-party collection store absence is not the active plan's next action
  after the 2026-05-25 user correction. Collection queue/UI readiness is
  retained as planning evidence only; it does not select browser-capture data for
  this route.

## Confidence Threshold

The app uses a fail-closed policy:

- Pass only when the prompted sign is the top prediction and expected-class confidence meets the model-version threshold.
- Fail when confidence is below threshold, even if the expected class is top ranked.
- Fail when the top prediction is a different vocabulary item.

The active model card still uses a fail-closed `not_trained` status. A future
candidate may use `confidence_thresholds.per_label`, but the current per-label
diagnostic is too weak to justify promotion.

`scripts/evaluate_rawframe_model.py` is the machine-readable validation gate for
a trained checkpoint. It now supports `--controlled-pilot` for the Superbuilders
controlled-pilot target. That mode:

- verifies the checkpoint, training provenance, and train/validation/test manifest hashes still match;
- rejects synthetic, smoke, small-label, and capped artifacts as final evidence;
- evaluates validation and test splits with signer-disjoint manifests;
- calibrates a positive fail-closed confidence threshold from validation curves;
- evaluates `data/manifests/negative-challenge.json` at the calibrated threshold and fails controlled-pilot validation when the core negative-challenge false-pass rate is 0.05 or higher;
- writes `validation-report.json` for every evaluated candidate and writes `calibrated-provenance.json` only for smoke runs or real candidates that pass all gates;
- exits non-zero for real candidate artifacts that miss the target gates.

`scripts/analyze_controlled_pilot_thresholds.mjs` derives optional
prompt-conditioned per-label thresholds from a retained prediction sidecar. It
does not promote a model and marks labels without eligible thresholds as
fail-closed.

Synthetic or tiny smoke artifacts may be evaluated only with `--allow-smoke-eval`, and those reports must remain labeled `smoke_only`.

## Required Validation Tests

- Signer-disjoint top-1 accuracy, macro F1, and per-class confusion matrix.
- False-pass tests using wrong signs and near-neighbor signs from labeled validation/test manifests.
- Negative challenge tests using reject-only empty camera, no hands visible, low light, and off-center clips.
- Browser latency test for inference warmup and per-attempt evaluation.
- Final browser ONNX smoke network audit showing the browser fetched the exact final ONNX artifact by hash and loaded same-origin ONNX Runtime WASM assets.
- Smoke-only browser wiring test showing the app's own `evaluateLocalAttempt()` path can load ONNX Runtime Web WASM and a deterministic ONNX fixture; this does not count as final trained evidence.
- Smoke-only collection runtime test showing explicit collection APIs can load isolated reviewed fixtures, save pending consented vocabulary/challenge clips, reject duplicate plan assignments, and keep smoke clips out of exportable coverage; this does not count as final dataset evidence.
- Post-collection status audit showing whether returned source-curated/operator QA packets, signer identity evidence, wrapper dry-run readiness, and final manifest files are present before any state-mutating import; this status is operator readiness only and does not count as final dataset evidence.
- Runtime account/progress smoke showing registration, `/api/me`, logout/login persistence, metadata-only fail-closed attempt saving, rejected raw camera payloads, and default-disabled dataset collection routes.
- Network privacy test showing raw frames/images/blobs are not uploaded during normal practice.
- Dependency/provenance audit showing no pretrained CV/sign/landmark/feature model entered training or browser inference.
- Local ML/GPU environment audit showing exact open-source package versions, a successful MPS tensor smoke, PyTorch build hash, Python/Node/npm/FFmpeg binary hashes, sanitized Apple Silicon CPU/memory/GPU resource evidence, and project-volume storage headroom against the 40 GiB minimum.
- Model-card/artifact audit showing a trained browser artifact is hash-pinned to random-initialization provenance and calibrated thresholds.
- Evaluation script output showing calibrated provenance and a passing validation report over the final signer-disjoint manifests.
- Source-rights audit showing every training/validation clip is either covered by first-party signed consent or by the approved PopSign v1 source review, with source split preservation, attribution, and raw-video-only provenance.
- Negative challenge source-rights audit showing each reject-only clip is either covered by first-party consent/collection-plan evidence or by an approved external raw-video source review with file-level URL, license, author, and SHA-256 provenance.
- Hint pedagogy audit showing every vocabulary item has source-curated evidence, or optional stronger external review evidence, that the coaching hint is beginner-appropriate, ASL-appropriate, aligned with its hint kind, and avoids unmeasured attempt-diagnosis claims.

## Known Limitations

- A compliant model cannot rely on pretrained hand landmarks, so data needs are higher than a landmark-based demo.
- ASL signs may depend on movement, location, palm orientation, timing, facial grammar, and context. This pilot is limited to isolated beginner vocabulary.
- Real validation must be signer-disjoint. Random clip splits can overstate performance.
- The model boundary is not sufficient evidence by itself. Final accuracy is unproven until data collection, training, and held-out validation are complete.
