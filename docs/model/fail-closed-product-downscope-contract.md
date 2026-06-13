# Fail-Closed Product Downscope Contract

Mission: M3EX - Fail-closed product downscope contract
Date: 2026-05-28

## Purpose

This contract converts the M3EV/M3EW weak-learnability result and observer 547
API memo into product steering rules. It applies while browser recognition is
not trained and until a later human-approved prompt replaces it.

The current app may be treated as a fail-closed ASL learning prototype. It must
not be treated as an active sign recognizer, an evaluated ASL correctness
system, a trained model demo, or a final-ready ML product.

## Current Evidence

- `web/public/model/model-card.json` is `status: "not_trained"`.
- `docs/model/active-vocabulary-claim.json` has `activeLabels: []` and
  `evidenceArtifacts: []`.
- `web/public/model/browser-model-bundle.json` has browser recognition,
  Detector 0 tracking, and box-driven avatar support disabled.
- M3EV completed one corrected retained-worker TCN training/evaluation smoke,
  but validation top-1 was `0.2222222222222222`, validation macro-F1 was
  `0.13796992481203008`, test top-1 was `0.17857142857142858`, test macro-F1
  was `0.11591836734693879`, threshold coverage was `0`, predictions
  concentrated on `white`, and several labels had zero recall.
- M3EW verified copied artifact accounting and found no local source-code,
  evaluation-contract, input-contract, copyback, or report repair.
- Observer 547 API research recommended
  `redirect_to_no_training_strategy_downscope` before any further ML work.

## Safe Near-Term Product Lane

Allowed fail-closed product value is limited to learner workflows that do not
claim machine recognition:

- browse and select ASL 1 isolated vocabulary prompts;
- read source-curated prompt text and non-diagnostic coaching hints;
- use camera framing locally in the browser;
- save practice attempts as metadata/history only;
- show manual learning progress such as attempts saved, prompts visited, and
  content-only study state;
- use `/lesson` as a study/framing/timing scaffold, with the robot treated only
  as a visual aid unless a promoted detector artifact exists;
- use `/validation` to expose current claim status and non-readiness evidence.

Any displayed pass/fail language must remain tied to fail-closed bookkeeping or
manual practice history while the model card is `not_trained`. It must not imply
that the app recognized a sign correctly.

## Blocked Work

The following remain blocked by default:

- Brev start/exec/sync/copy, paid GPU work, remote dry-run, remote training, or
  worker lifecycle changes except explicit cost-control stop when required by a
  prompt;
- local or remote training, fitting, optimizer/backward work, checkpoint
  creation, evaluation rerun, threshold tuning, architecture search,
  hyperparameter sweep, or Detector 0 training;
- ONNX export, model-card promotion, active-vocabulary promotion, browser
  recognition activation, runtime ML activation, product-runtime mutation that
  expands recognition claims, or final-readiness claims;
- source/media import, source-register mutation, manifest/tensor/vocabulary/
  packet mutation, label expansion, generated labels, pseudo-labels, or raw
  learner video upload during normal practice;
- pretrained detector, landmark, backbone, embedding, teacher, feature
  extractor, MediaPipe, OpenPose, YOLO, SAM, DINO, CLIP, `from_pretrained`,
  `pretrained=True`, or equivalent shortcut in the promoted lane;
- treating copied M3EV output files under
  `output/m3er-high-signal-region-grid-tcn-brev/` as browser artifacts,
  source-of-truth model assets, or product-readiness evidence.

## Meaning Of M3EV Artifacts

The M3EV copied artifacts are diagnostic accounting evidence only. They prove
that a corrected retained-worker command path can train, evaluate, write
reports, copy scoped files back, and stop the worker. They do not prove a useful
recognizer, do not support browser activation, do not expand active vocabulary,
do not justify threshold promotion, and do not authorize a final product claim.

The artifact directory remains ignored and must not be staged or committed
unless a future prompt explicitly changes artifact retention policy.

## Requirements To Resume ML Work

Any future ML, Brev, source/data, export, or recognition-activation mission must
arrive through a new explicit prompt or human approval and must include:

- the precise hypothesis not already falsified by M3EM/M3EN/M3EO/M3EV/M3EW;
- the exact data/source/label/representation or architecture change proposed;
- a bounded local diagnostic first, unless the prompt records why local
  diagnosis cannot answer the question;
- for Brev, a compute receipt with worker identity, current price or approved
  spend envelope, max runtime, max spend, kill condition, teardown/default-off
  rule, and copyback/artifact policy;
- promotion gates for signer-disjoint metrics, negative challenges,
  thresholding, no-pretrained provenance, browser parity, privacy, and final
  claim review;
- an explicit statement that copied M3EV artifacts are not being promoted by
  reuse.

## Acceptance Gates For Product Hardening

A future fail-closed product-hardening mission is acceptable only if it keeps
recognition disabled and satisfies these gates:

- model card remains `not_trained`;
- active vocabulary claim remains empty;
- browser model bundle keeps recognition and detector tracking disabled;
- no implementation copy claims ASL correctness, trained recognition, model
  readiness, active vocabulary coverage, or final readiness;
- normal practice does not upload raw learner video or frames;
- any dataset-collection upload path remains behind explicit separate consent
  and is not part of normal practice;
- persisted attempts contain metadata only;
- progress UI is framed as saved practice/history unless a trained promoted
  model exists;
- validation/claim surfaces stay available and current;
- required repo audits and JSON validations pass.

## Immediate Claim-Surface Follow-Up

The first follow-up should reduce stale or ambiguous claim wording before
additional product hardening. In particular, README-level current-state and
pass/fail language should be reconciled with the current M3EX state: the app is
not trained, automatic checking is inactive, and learner value is currently
manual/fail-closed practice history.
