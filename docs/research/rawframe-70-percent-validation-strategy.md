# Raw-Frame 70 Percent Validation Strategy

Checked at: 2026-05-21

This note captures an independent research synthesis for getting ASL Pilot's
raw-frame recognition path to the current final validation target. It does not
depend on the pending ChatGPT Pro result; compare that result against this plan
when it returns.

Updated after additional external strategy memos: 2026-05-21.

## Target And Current Gap

The target validation gate is:

- Top-1 signer-disjoint validation accuracy: at least 70 percent.
- Macro F1: at least 0.65.
- Incorrect prompted-sign false-pass rate: below 10 percent.
- Negative challenge false-pass rate: below 5 percent for empty camera, no
  hands visible, low light, and off-center clips.

The current local artifact is not close to passing:

- Status: `candidate_final_validation_failed`.
- Validation top-1: `0.07789473684210527`.
- Validation macro-F1: `0.06776494164679056`.
- Test top-1: `0.08919667590027701`.
- Test macro-F1: `0.08252574184488487`.
- Negative challenge false-pass rate: `0.3`.
- Negative challenge max confidence: `0.8036872744560242`.

The practical gap is roughly 62 validation top-1 percentage points, plus a
large fail-closed calibration gap.

## Diagnosis

The bottleneck is signer-disjoint generalization from raw RGB video, not the GUI
or a display/screen state issue.

Current repo evidence points to this failure mode:

- The model can fit train clips, but held-out signer validation and test remain
  near chance.
- Tensor visual diagnostics did not find a sampled gross decode, crop,
  blank-frame, or value-range problem.
- Split-shift diagnostics argue against low-level RGB statistics generalizing
  across held-out splits.
- Current external-source work has not approved a new training source beyond
  the current PopSign path.
- First-party collection is prepared operationally, but no consented local
  collection store exists yet.
- NVIDIA ASL 1000 has high upside, but access and source-register approval are
  still blocked.

## Hard Constraints

The final recognition path must stay inside these constraints:

- Browser-based ASL learning app.
- Isolated beginner ASL vocabulary, 75-100 labels.
- Camera frames stay local during normal practice.
- No pretrained sign classifiers.
- No pretrained hand, pose, or face landmark detectors.
- No pretrained feature extractors or general-purpose CV backbones.
- Architecture and recognition weights must be trained by the team.
- Final validation and test evidence must be real signer-disjoint raw video.

Synthetic/generated media can be useful only after explicit policy work, and
should be train-only unless the project scope is changed.

## What Changed After The Additional Memos

The added memos change the ranking in four ways:

1. Lesson-level `classify_or_reject` should be treated as a top product
   strategy, not just a later UX detail. A 25-sign lesson set plus hard
   negatives is a better near-term milestone than global 95-way closed-set
   recognition.
2. First-party browser-domain data should be split out from external real data
   and ranked above NVIDIA for immediate action, because it directly matches
   the deployment camera, lighting, framing, beginner attempts, and rejection
   cases.
3. Open-set rejection/calibration should move above synthetic sign generation.
   The false-pass target is not solved by closed-set top-1.
4. GPT-image-2 remains useful, but the best-ranked synthetic uses are hard
   negatives and nuisance variation. Class-labeled synthetic ASL signs should
   be lower priority and must be reviewed and ablated against real
   signer-disjoint validation.

## Ranked Strategy

| Rank | Strategy | Expected Gain | Likelihood | First Experiment |
| ---: | --- | --- | --- | --- |
| 1 | Lesson-level `classify_or_reject` milestone | Highest near-term product gain; changes the task from global closed-set recognition to the actual practice flow | High | Evaluate 25 lesson signs plus 10 near-confusable signs and hard negatives; report top-1, macro-F1, coverage, and false-pass separately |
| 2 | First-party browser-domain real data | Highest full-target gain; directly attacks signer, camera, lighting, beginner-attempt, and rejection mismatch | High if enough signers can be recruited | Collect 3k-8k pilot clips over 25 signs, 10 near-confusables, and 500-1,500 hard negatives with signer-disjoint splits |
| 3 | Open-set rejection and calibrated thresholds | High for false-pass targets and product trust | High | Add explicit reject class/score, temporal stability, per-class thresholds, and threshold selection constrained by negative false-pass targets |
| 4 | PopSign v1 reduced-label curves and approved-real pretraining | High diagnostic value; may produce an honest scoped pilot | High | Train 5, 10, 25, 50, and 95 label signer-disjoint curves; use PopSign raw video for from-scratch SSL only if it improves real holdout |
| 5 | NVIDIA ASL 1000 real-data access | Medium-high to high if access, label overlap, and license scope are favorable | Medium because gated | Submit access request; stage metadata only; import raw video only after legal/source-register approval |
| 6 | Strong regularized temporal modeling from scratch | Medium; important once real data/rejection protocol is in place | Medium | Add signer-balanced batches, temporal jitter, random windows, mixup or VideoMix after ablation, random erasing/crop/color, dropout/drop-path, cosine LR, warmup, and 3-seed reporting |
| 7 | Self-supervised pretraining on approved real train clips only | Medium after data scale improves | Medium-low now | Masked-frame reconstruction, temporal order prediction, or contrastive clip consistency using only approved train clips |
| 8 | GPT-image-2 synthetic negatives and nuisance variation | Medium for reject robustness and domain nuisance invariance | Medium | Generate invalid gestures, off-center/low-light/no-hands cases, and background/lighting/clothing variants; keep synthetic capped and evaluate on real validation only |
| 9 | GPT-image-2 reviewed sign keyframes | Low-medium; useful only as a tightly controlled auxiliary | Medium-low | Use consented real reference frames where possible; generate start/apex/end variants; cap synthetic at 10-20 percent; require ASL review and real-only validation gains |
| 10 | ASL Citizen, MS-ASL, WLASL, How2Sign, OpenASL | Secondary or external-hardening value | Low-medium for final target | Keep quarantined until license/source-register approval; use for research only by default |
| 11 | Synthetic-only training, synthetic validation/test, or GPT-image-2 text-to-sign as ground truth | Not acceptable for final evidence and likely harmful | Low | Use only as a canary for domain gap or qualitative red-team tests |

## Product Target Reframe

The final assignment still expects 75-100 beginner vocabulary items, but the
next useful milestone should be lesson-level recognition:

- 25 lesson signs.
- 10 near-confusable signs selected from current confusion and ASL review.
- Hard negatives and imperfect beginner attempts.
- A `not_sure_try_again` outcome as a first-class result.

The practice UX does not need to ask a raw model to choose among every supported
sign for every attempt. It can constrain the candidate set to the current
lesson, then require an explicit accept decision. This turns the near-term
target into:

> For 25 lesson signs plus hard negatives, trained from scratch on approved
> PopSign plus first-party browser data, achieve signer-disjoint top-1 at or
> above 70 percent, macro-F1 at or above 0.65, test false-pass below 10 percent,
> and negative challenge false-pass below 5 percent, with synthetic data
> excluded from validation and test.

If this works, scale lesson by lesson. If it fails, the project learns whether
the blocker is real-data volume, candidate-set ambiguity, rejection calibration,
or the raw-RGB/no-pretrained constraint itself.

## Data Strategy Details

### First-party collection

The existing plan is ready for operator capture, but the current 12/4/4 split
is probably underpowered for 95-label raw RGB training from scratch. Start with
a two-week browser-domain pilot:

- 25 target lesson signs.
- 10 near-confusable signs.
- 40-80 contributors.
- 2-4 attempts per prompt.
- 3k-8k real browser clips.
- 500-1,500 hard negatives.
- Strict signer-disjoint train/validation/test splits.

Hard negatives should include idle hands, waving, thumbs up, counting,
fingerspelling-like motion, partial signs, wrong location, wrong palm
orientation, non-target ASL signs, off-center framing, and low-light clips.

For a serious 75-100 label target, expand toward:

- 20-30 train signers.
- 5-10 validation signers.
- 5-10 test signers.
- 3-5 accepted takes per label per signer.
- 20k-40k first-party browser clips.
- Negative clips treated as first-class data, not an afterthought.

This is the most controllable route for browser-domain footage, consent, signer
metadata, lighting, framing, and negative challenge coverage.

### NVIDIA ASL 1000

NVIDIA ASL 1000 is the highest-upside external path if access and license scope
work. The AWS registry lists ASL 1000 as a controlled-access S3 dataset with ASL
videos and reviewed 2D annotations. The recognition path should import raw video
only and reject landmarks, meshes, feature caches, pretrained models, and
derived recognizer inputs.

Immediate request questions:

- Current raw video count by label.
- Whether the initial learner vocabulary or a 75-100-label subset is available.
- Signer IDs and signer-disjoint split metadata.
- License permission for educational pilot/demo model training.
- Redistribution and model-artifact restrictions.
- Whether metadata can be staged before media download.

### PopSign v1

PopSign v1 remains the best immediate open source. It is CC BY 4.0, has 250
signs, 47 signers, and about 165k game videos. Its published high baseline is
not the ASL Pilot baseline because that result used landmark features rather
than raw RGB from scratch. PopSign is still valuable as an approved seed and
benchmark, but the next PopSign work should be diagnostic rather than another
small rerun:

- Pick high-count, cleanly mapped beginner labels.
- Preserve signer-disjoint splits.
- Run 5/10/25/50/95 label learning curves.
- Report per-label confusion and per-signer accuracy.
- Mine near-confusable signs for lesson-level challenge sets.
- Use raw videos for from-scratch self-supervised pretraining only if it
  improves real signer-disjoint validation.
- Stop treating PopSign-only architecture tweaks as the main path if 25-label
  and 50-label curves remain near chance.

### PopSign label-ladder evidence

The first diagnostic ladder pass is now retained in
`docs/validation/popsign-label-ladder-manifests.json`. It generated 5, 10, 25,
50, and 95-label diagnostic manifests under
`data/manifests/diagnostics/popsign-label-ladder/`, ranked by the current
validation/test recall and F1 from the failed 95-label run. All five ladder
sizes passed the training manifest validator with `--check-files` and
`--allow-small-label-set`.

The first trained curve point is a 5-label upper-bound diagnostic on `please`,
`table`, `dad`, `grandpa`, and `hat`. It is smoke-only because it uses reduced
manifests without full 95-label vocabulary-review evidence:

- Validation top-1: `0.632`.
- Validation macro-F1: `0.6291843475673263`.
- Test top-1: `0.5157894736842106`.
- Test macro-F1: `0.5134946403031508`.
- Test false-pass rate at threshold `0.72`: `0.15789473684210525`.
- Negative challenge false-pass rate at threshold `0.72`: `0.4`.

The second trained curve point is a 10-label upper-bound diagnostic on
`table`, `dad`, `grandpa`, `please`, `hat`, `grandma`, `like`, `all`, `bed`,
and `say`. It is also smoke-only:

- Validation top-1: `0.372`.
- Validation macro-F1: `0.3627334036466333`.
- Test top-1: `0.3736842105263158`.
- Test macro-F1: `0.3711727362158396`.
- Test false-pass rate at threshold `0.75`: `0.11578947368421053`.
- Negative challenge false-pass rate at threshold `0.75`: `0.35`.

The third trained curve point is a 25-label upper-bound diagnostic. It is also
smoke-only:

- Validation top-1: `0.2048`.
- Validation macro-F1: `0.19535746569735288`.
- Test top-1: `0.2294736842105263`.
- Test macro-F1: `0.22402026598808006`.
- Test false-pass rate at threshold `0.63`: `0.12210526315789473`.
- Negative challenge false-pass rate at threshold `0.63`: `0.25`.

The fourth trained curve point is a 50-label upper-bound diagnostic. It is also
smoke-only:

- Validation top-1: `0.1312`.
- Validation macro-F1: `0.1180972168354442`.
- Test top-1: `0.15052631578947367`.
- Test macro-F1: `0.14255597925682625`.
- Test false-pass rate at threshold `0.53`: `0.11473684210526315`.
- Negative challenge false-pass rate at threshold `0.53`: `0.15`.

This confirms the 95-way task is a major part of the failure, but it also shows
that PopSign-only reduced scope is not enough by itself. The intentionally
favorable 5-label subset misses the 70 percent validation target and
false-pass targets, the 10-label subset falls sharply while still overfitting
train clips, the 25-label subset is far below the required metrics, and the
50-label subset is close to the failed 95-label behavior. Do not treat any of
these ladder artifacts as final model evidence.

## Rejection And False-Pass Strategy

The false-pass target is an open-set recognition problem. A closed-set
classifier that always emits one of the supported signs cannot satisfy the
product requirement on its own.

Use a two-stage decision:

1. Class prediction: which lesson sign is most likely?
2. Acceptance decision: is the evidence strong enough to pass?

Acceptance should combine:

- max probability or logit margin;
- entropy or energy score;
- temporal stability across overlapping windows;
- per-class thresholds;
- explicit negative-class training;
- a `not_sure_try_again` output when confidence is insufficient.

Report these metrics separately:

- closed-set top-1 on real target signs;
- macro-F1 on real target signs;
- coverage or acceptance rate;
- top-1 among accepted clips;
- false-pass on wrong prompted signs;
- false-pass on hard negative challenge;
- per-class false-pass;
- calibration error.

Threshold selection should prioritize:

1. negative challenge false-pass below 5 percent;
2. test false-pass below 10 percent;
3. maximize accepted target top-1 and macro-F1 subject to those constraints.

Lower coverage is acceptable for the pilot when the alternative is confidently
passing wrong signs.

## GPT-image-2 Strategy

GPT-image-2 is worth a controlled experiment. Official OpenAI docs identify
`gpt-image-2` as the current state-of-the-art image generation and editing
model, with flexible sizing and high-fidelity image inputs. That makes it
credible for reviewed raw-pixel augmentation, especially for handshape,
location, framing, lighting, skin tone, clothing, background, and camera-domain
diversity.

It should not be treated as final validation evidence. GPT-image-2 is an image
generation/editing model, so any video-like strategy must be assembled from
still frames or keyframes outside the model. Prompt text is not ASL ground
truth, and generated signer IDs do not create real signer-disjoint validation.

After the added memos, the synthetic ranking is:

1. Hard negative generation.
2. Nuisance variation using real consented reference frames where possible.
3. Synthetic stress tests for overconfidence.
4. Reviewed sign keyframes only after the first three show value.
5. Text-to-sign synthetic ground truth and synthetic validation/test remain
   out of scope.

### Required synthetic policy

Add a source policy before any generated media enters training:

- `source_mode: synthetic_train_only`.
- OpenAI model ID and snapshot.
- Prompt text and prompt hash.
- Output file hash.
- Label source and label-review hash.
- Human ASL review status.
- Synthetic generation timestamp.
- Exact split ban: no synthetic media in validation, test, final negative
  challenge, or final held-out evidence.
- Consent check if real signer frames are used as references.

### First GPT-image-2 experiment

Use a 15-label ablation, but keep synthetic lower priority than real data and
rejection:

- 10 static or handshape-heavy labels.
- 5 motion-heavy or confusable labels.
- Prefer consented real reference frames for start/apex/end keyframes.
- 20-60 reviewed generated or edited images per label for the first pass.
- Start, mid, and end phase prompts where applicable.
- Quality setting chosen by cost/fidelity pilot, with exact parameters logged.
- Convert approved keyframes into short raw-frame clips using repeated frames,
  mild camera jitter, crop jitter, brightness jitter, and temporal interpolation.
- Train real-only, real plus 10 percent synthetic, and real plus 20 percent
  synthetic.
- Evaluate only on real signer-disjoint validation and test.

Success criteria:

- At least +2 macro-F1 points on real signer-disjoint validation.
- No increase in incorrect prompted-sign false-pass rate.
- No increase in real negative challenge false-pass rate.
- Per-label gains on low-data or high-confusion signs without broad regression.

### Prompt template

```text
Photorealistic 1280x720 webcam frame, upper torso centered, adult signer,
both hands visible, neutral indoor background, front-facing laptop camera.
ASL isolated vocabulary sign: {label}.
Phase: {start|mid|end}.
Handshape: {reviewed_handshape}.
Palm orientation: {orientation}.
Location: {location}.
Movement cue visible in posture: {movement_phase}.
Accurate ASL handshape, anatomically plausible hands, no extra fingers,
no captions, no text, no watermark.
```

### Synthetic negatives

Synthetic negatives are lower semantic risk and should be tested early:

- Empty camera.
- No hands visible.
- Off-center signer.
- Hands cropped out.
- Low light.
- Backlit signer.
- Background motion.
- Non-ASL casual gestures.
- Extra objects or clutter.

The goal is not to improve top-1 directly; it is to lower false passes while
preserving real vocabulary accuracy.

## Modeling Strategy

Do not jump straight to a large transformer. The current data regime is small
for raw RGB from scratch, and the model already overfits. The next model work
should prioritize controlled regularization and temporal representation:

1. Run lesson-level and reduced-label curves first.
2. Add strong regularized ERM:
   - signer-balanced batches;
   - temporal random windows and temporal jitter;
   - random crop, color, brightness, and erasing;
   - mixup or VideoMix only after verifying it does not damage handshape
     learning;
   - label smoothing;
   - dropout/drop-path;
   - cosine learning rate with warmup;
   - early stopping by signer-disjoint validation;
   - three seeds for every serious claim.
3. Add efficient temporal modeling:
   - deeper temporal Conv1d/TCN over raw RGB features;
   - temporal shift modules;
   - small R(2+1)D-style residual blocks;
   - tiny SlowFast only after the simpler temporal baselines are measured.
4. Add self-supervised pretraining only on approved train clips if real data
   volume grows enough.
5. Add leakage canaries:
   - signer/background prediction from cropped or masked clips;
   - frame-count, duration, compression, and file-size class prediction;
   - background-only classification;
   - train-signer leave-one-out checks.

Expected modeling-only gains are probably not enough to move from 7.8 percent
to 70 percent. Modeling becomes high-leverage after the data path improves.

## Secondary Dataset Position

ASL Citizen is useful for external research and hardening, but its Microsoft
Research license is non-commercial, non-revenue-generating research-only and
restricts redistribution and personal-data handling. It should not be assumed
valid for final product training without separate permission.

MS-ASL and WLASL have useful scale but weaker provenance/licensing fit and
download attrition risk. WLASL is academic/computational only and no commercial
use. MS-ASL is YouTube-derived and needs source-register review.

How2Sign and OpenASL are continuous ASL corpora. They are valuable research
assets but poor immediate fits for an isolated 75-100 beginner-vocabulary
classifier because segmentation and label alignment become major work.

## Seven-Day Execution Plan

1. Freeze the current failure artifact as the baseline.
2. Define the 25-sign lesson-level milestone plus 10 near-confusables and hard
   negatives.
3. Build PopSign label-ladder manifests for 5/10/25/50/95 labels.
4. Add leakage canaries for signer/background/frame-count artifacts.
5. Implement explicit reject metrics and threshold selection.
6. Train a regularized baseline on each ladder with identical reporting.
7. Submit NVIDIA ASL 1000 access and retain request evidence.
8. Draft the synthetic train-only policy and validators.
9. Start the first-party browser-domain pilot plan and consent/review flow.
10. Run synthetic negative augmentation before sign-labeled GPT-image-2
    keyframes.
11. Decide from evidence:
   - If 25 labels can approach 70 percent, scale data and modeling.
   - If 25 labels stay near chance, prioritize first-party/NVIDIA data before
     more architecture work.
   - If synthetic helps only negatives, keep it for reject robustness and do not
     spend it on sign labels.

## Mac Studio Unified Memory Target

The local machine reports 96 GiB of unified memory. For efficient MPS training,
decoding, evaluation, and browser smoke work, aim to start serious long runs
with:

- Ideal available/reclaimable unified memory: 60-70 GiB.
- Practical target: at least 64 GiB available/reclaimable.
- Hard floor before starting full training: 48 GiB available/reclaimable.
- Swap target: 0 swapouts during the run.

Because macOS uses inactive memory as file cache, `unused` memory can look low
even when pressure is healthy. Use `memory_pressure`, compressor growth, and
swapouts as the practical signals. Close large browser tab sets, Photoshop,
video tools, and unrelated local dev servers before full MPS jobs. Keep roughly
20-25 GiB for macOS, Codex, Safari, and filesystem cache, leaving about 50-70
GiB for PyTorch/MPS unified-memory allocation and decode/evaluation buffers.

For the current 96 GiB machine, the operational rule is:

> Free enough apps and background work that macOS reports at least 64 GiB
> available/reclaimable and no active swap before launching final candidate
> training or large decode jobs.

## Source Links

- Local target and constraints: `docs/validation/validation-report.md`,
  `docs/source-materials/requirements-matrix.md`,
  `docs/research/rawframe-data-decision.md`,
  `docs/model/dataset-and-training-plan.md`.
- Current metrics: `artifacts/rawframe-model/validation-report.json`.
- OpenAI GPT-image-2 model page:
  https://developers.openai.com/api/docs/models/gpt-image-2
- OpenAI image generation guide:
  https://developers.openai.com/api/docs/guides/image-generation
- OpenAI GPT Image prompting guide:
  https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide
- PopSign v1:
  https://signdata.cc.gatech.edu/view/datasets/popsign_v1_0/index.html
- NVIDIA ASL 1000 AWS registry:
  https://registry.opendata.aws/asl_1000/
- NVIDIA ASL dataset access:
  https://www.nvidia.com/en-us/gated-resources/trustworthy-ai-american-sign-language/dataset/
- ASL Citizen:
  https://www.microsoft.com/en-us/research/project/asl-citizen/
- ASL Citizen license:
  https://www.microsoft.com/en-us/research/project/asl-citizen/dataset-license/
- WLASL:
  https://dxli94.github.io/WLASL/
- How2Sign:
  https://how2sign.github.io/
- OpenASL:
  https://arxiv.org/abs/2205.12870
- TSM:
  https://arxiv.org/abs/1811.08383
- R(2+1)D:
  https://arxiv.org/abs/1711.11248
- SlowFast:
  https://arxiv.org/abs/1812.03982
- VideoMAE:
  https://arxiv.org/abs/2203.12602
- mixup:
  https://arxiv.org/abs/1710.09412
- DomainBed:
  https://arxiv.org/abs/2007.01434
- Open-set recognition:
  https://openaccess.thecvf.com/content_cvpr_2016/papers/Bendale_Towards_Open_Set_CVPR_2016_paper.pdf
- SynSLaG:
  https://pure.nitech.ac.jp/en/publications/synslag-synthetic-sign-language-generator/
- SynthSL:
  https://www.dfki.de/web/forschung/projekte-publikationen/publikation/14793
- Sign-language augmentation evidence:
  https://link.springer.com/article/10.1007/s10209-024-01133-y
