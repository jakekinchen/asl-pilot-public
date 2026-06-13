# 48-Hour Execution Playbook

## mission

Produce the strongest honest controlled pilot in 48 hours: working browser product shell, learner accounts/progress, camera capture, browser inference path, active model module, pass/fail thresholds, targeted hints, validation/audit docs, and final claim matrix.

## execution windows

### H0-H3: local gates

- Install/merge plan folder.
- Run Stage 1 gap audit.
- Verify repo stack and commands.
- Run storage guardrail.
- Confirm source-access plan.
- Select first active sign module.
- Prepare first Brev shards.

Exit gate:

- `source-access-verification.json` draft exists.
- `active-sign-modules.json` draft exists.
- local free space >= 250 GB.
- no full dataset downloads started.

### H3-H6: Brev launch and smoke data

- Create standard workers: `asl-m3-handboxnet`, `asl-m4-baselines`, `asl-m5-guidedcrop`.
- Sync repo without large data.
- Sync compact smoke shards only.
- Run import/dataloader smoke on each worker.

Exit gate:

- workers reachable;
- run manifests started;
- dataloader smoke passes;
- training loss decreases in 2-epoch smoke or failure documented.

### H6-H24: three parallel jobs

- M3: HandBoxNet scratch detector lane.
- M4: baseline upper-body/fixed-crop recognizers.
- M5: GuidedCropSignNet fixed-crop primary candidate.
- Parallel web team builds app shell, auth/progress, camera states with mock inference.

Exit gate:

- baseline report exists;
- guided crop report exists or failure report exists;
- detector report or kill-switch decision exists;
- web shell reachable with mock inference.

### H24-H32: collect and choose runtime path

- Collect Brev artifacts.
- Compare fixed vs detector crop path.
- Promote fixed crop if detector evidence is weak.
- Update active vocabulary claim.

Exit gate:

- `promoted-artifact-selection.json` exists;
- active labels locked for demo;
- model manifest draft exists.

### H32-H40: post-processing and hints

- Calibrate thresholds.
- Evaluate hard negatives.
- Implement active-module top-k/pass-fail rule.
- Implement hint engine and sign metadata.

Exit gate:

- `abstention-calibration.json` exists;
- hard-negative report exists;
- pass/fail boundary tests pass;
- every active sign has hints.

### H40-H46: export and browser smoke

- Export ONNX/browser artifact.
- Load model in browser runtime.
- Connect real inference or stable mock fallback with honest claim.
- Test full learner flow.

Exit gate:

- browser smoke report exists;
- practice session saves progress;
- camera privacy proof captured.

### H46-H48: final audit and shutdown

- Fill model card.
- Fill validation report.
- Fill no-pretrained audit.
- Fill privacy documentation.
- Fill final claim matrix.
- Collect artifacts.
- Stop Brev instances.

Exit gate:

- final demo works;
- claim matrix honest;
- workers stopped;
- all required deliverables represented.

## small batch first rules

1. 2-epoch smoke on 10 clips/class.
2. 5-sign or 10-sign fixed-crop sanity run.
3. Full 10-sign run.
4. 20-sign expansion only after 10-sign gates pass.
5. Detector-crop ablation only if detector is useful.
6. Phonology reranker only after abstention/hard-negative gates pass.

## no-big-run gate

No large run until:

- `source-access-verification.json` exists;
- `active-sign-modules.json` exists;
- storage free >= 250 GB;
- dataloader smoke passes;
- training loss decreases in smoke;
- GPU run manifest exists.

## downscope triggers

- Detector late or weak -> fixed crops primary.
- 20-sign weak -> 10-sign active module.
- ONNX export late -> mock inference demo plus exported artifact failure report, only if honest.
- Auth provider blocked -> local account fallback is not final; escalate immediately.
- Model weak -> content-only prompt demo with clearly marked active recognition subset.
