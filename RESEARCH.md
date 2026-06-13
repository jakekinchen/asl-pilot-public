# RESEARCH

Status: discovery artifact from provided materials. This file summarizes the attached project write-up, Cody workflow notes, and ASL compound execution packet. It does not claim independent web verification.

## Product facts from project write-up

- The pilot is a browser-based ASL learning application for college ASL 1 learners.
- The app prompts a beginner vocabulary concept, asks the learner to sign with the camera, evaluates via computer vision, and returns pass/fail feedback plus targeted hints.
- The pilot is controlled production pilot quality, not research-grade assessment or public-scale deployment.
- Required scope includes ASL-only support, isolated beginner vocabulary, 75-100 beginner items, browser app, camera access, browser-first inference, engineer-owned dataset/model training, no pretrained models, controlled validation, learner accounts, saved progress, privacy-conscious video handling, and documentation.

## Workflow facts from Cody agentic coding notes

- The workflow is five stages: discovery, refinement, scaffolding, tasks, execution.
- Durable files replace chat memory.
- `ARCHITECTURE.md` becomes the contract with stable anchors.
- `MVP_TASKS.md` is the source of truth for current state.
- Slash commands encode the discipline.
- Every implementation slice should cite architecture anchors, pass `/preflight`, prove `/wired`, run `/check-arch`, and produce its own commit.
- Briefs should be authored just-in-time by the orchestrator, not fully prewritten long before implementation.

## Execution packet facts from ASL compound plan v4

- Local disk should not download all datasets.
- Expected local working set: 180-450 GB.
- Stop/prune if project data exceeds 650 GB or local free space drops below 250 GB.
- PopSign should be pulled by selected sign/category/split, not as a full dataset.
- HaGRID should use 512px or bounded box-only subset, not full native dataset.
- HaGRID clean lane may use box/label/user/split fields; it must quarantine hand landmarks and demographic metadata.
- Brev workers are the intended GPU execution path.
- Small-batch rules: 2-epoch smoke, then 5/10-sign sanity, then full 10-sign, then 20-sign only after gates pass.
- Parallel 48-hour shape: H0-H3 local gates, H3-H6 Brev launch/smoke, H6-H24 three GPU jobs, H24-H32 collect/choose, H32-H40 post-processing, H40-H46 export/browser, H46-H48 final audit/shutdown.

## Findings incorporated into the plan

1. The plan needs two tracks: product completion and model honesty.
2. Recognition coverage must be represented explicitly by `active-sign-modules.json`; the app may display more content than the model can honestly recognize.
3. A browser inference contract is required so UI and ML can progress in parallel.
4. A no-pretrained audit file is required at every model milestone.
5. Camera/video privacy must be asserted in code and docs, not merely promised.
6. The detector is an improvement lane, not a blocker.
7. The slice workflow must be installed before the agents start coding.

## Research-required items before final submission

- Dataset license and redistribution terms for all sources actually used.
- Exact active vocabulary data support by sign and split.
- True model metrics from held-out signer/session validation.
- Browser runtime compatibility on target devices.
- Deployment target and account provider configuration.
- Final model artifact size and latency.
