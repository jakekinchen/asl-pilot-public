# Raw-Frame Data Decision

Checked at: 2026-05-25T17:30:00Z

This note records the current data-path decision for the ASL Pilot raw-frame
model goal. It is not legal advice, source-register approval, manifest approval,
or model evidence.

## Decision

No data path is ready for immediate final model training beyond the current weak
expanded PopSign v1 baseline. The latest approved PopSign run now uses 2,375
train clips, 2,375 validation clips, and 1,805 test clips, but still fails all
final model-quality gates.

The next practical path is non-first-party source evidence. Treat NVIDIA ASL /
ASL 1000 as the highest-leverage online candidate for an access request, because
the official access page says accepted users receive raw video data and the AWS
Open Data Registry now lists ASL 1000 as a controlled-access S3 dataset. A
candidate-only source-rights review and access packet are retained, but NVIDIA
remains blocked until access is granted, the exact license/use-case scope is
accepted, labels and split metadata are audited, and the source register
approves a raw-video-only import.

First-party collection remains a dormant, human-authorized route only. The
2026-05-25 user correction says not to route the active plan into new
browser-capture data.

Do not import NVIDIA, MS-ASL, generated imagery, synthetic media, or any other
new source into `data/manifests/`, `data/external/`, or `data/tensors/` until
the source register approves that exact source and import method.

## Decision Matrix

| Path | Current evidence | Upside | Blocking condition | Current action |
| --- | --- | --- | --- | --- |
| First-party collection | Source register allows first-party browser recordings after consent/review; retained queue and bundle artifacts prove planning readiness only. | Highest control over consent, capture environment, vocabulary, signer split, and negative challenge clips. | Latest user correction excludes new browser-capture data from the active plan. | Dormant; do not select unless explicitly reauthorized. |
| NVIDIA ASL / ASL 1000 | Official page says accepted users receive raw video, extracted images, and JSON for landmarks/pose/face meshes; AWS registry lists ASL 1000 as controlled-access S3 data. Candidate-only source-rights review, receipt, and access packet are retained. | Potentially the best current online raw-video fit if labels, signer diversity, split metadata, and license scope align. | Controlled/gated access; use-case approval required; no local protected metadata, no local media hashes, no label-overlap audit, no source-register entry. | Candidate for human-submitted access request; not approved for import. |
| MS-ASL reduced candidate | Local metadata and oEmbed probe are retained; 50-label metadata candidate falls to 14 labels after public-row filtering. | Useful reduced-scope experiment if a 14-label pilot is explicitly accepted. | YouTube-derived data, C-UDA no-rights-warranty posture, availability attrition, and current 95-label scope mismatch. | Do not continue by default. |
| PopSign v2 | Current official dataset page says it has not been released and underlying videos are unavailable. | Best future fit if released, because it extends the already-approved PopSign family. | No underlying videos available now. | Wait-only; re-check before investing. |
| Reduced pilot scope | Could make a cleaner smaller model feasible. | Faster path to an honest narrow demo if product accepts reduced claims. | Requires explicit scope approval and updated vocabulary/claims before training. | Decision needed before any reduced-scope manifests. |
| Generated/synthetic imagery | User noted image-generation quality as possibly helpful; current docs allow planning/UI/reviewer aids only. | Could help illustration, prompt exploration, or a future synthetic-data policy. | No synthetic-data policy, no validators, and no proof it represents signer-disjoint ASL recognition data. | Keep out of train/validation/test/negative-challenge evidence. |

## Current PopSign Model Evidence

The current final artifact path contains a non-smoke, from-scratch
motion-temporal 2D CNN trained against the expanded approved PopSign manifests.
It improves held-out metrics only modestly and is not final-ready.

| Item | Value |
| --- | --- |
| Train manifest | 95 labels, 2,375 clips, SHA-256 `1bf6e6a0b915f993e6a15a1512135b89fbf5548c922dd4c928383a9b9e0f47d3` |
| Validation manifest | 95 labels, 2,375 clips, SHA-256 `46954ae540315fbbd4b0be1f07a488c79f32a5b317765188044bf6a314680e75` |
| Test manifest | 95 labels, 1,805 clips, SHA-256 `c64ba5a067896a8dad84eeaa23dcd1c513820cb2ac6bfd729c3c3b420672228d` |
| Negative challenge manifest | 20 clips, SHA-256 `29eb39735ceb85c82fa60b89bde9f9745dd8aa4c7783dfc45e2308f390b5eac7` |
| Checkpoint | `artifacts/rawframe-model/model_state.pt`, SHA-256 `b67ea1768323c5d868115877c595b53a764ce428cf951d88d7a984717082a68a` |
| Training provenance | `artifacts/rawframe-model/training-provenance.json`, SHA-256 `f62e08f6443a999e36a16eaac1cdfd69ab91662d95834a8b51336676fe978ea9` |
| Validation report | `artifacts/rawframe-model/validation-report.json`, SHA-256 `242ecc04bc474117c042cc9171521aa51158d8c93821bd1dd9e58f5055fa1698` |
| Selected epoch | 19 by validation accuracy |
| Test top-1 / macro-F1 | `0.08919667590027701` / `0.08252574184488487` |
| Test false-pass rate | `0.14293628808864267` at threshold `0.35` |
| Negative challenge false-pass rate | `0.3` |
| Final status | `candidate_final_validation_failed`; calibrated provenance remains stale/nonfinal |

## First-Party Plan Evidence

`node scripts/plan_dataset_collection.mjs --output data/dataset/collection-plan.json`
regenerated the operator plan for the current vocabulary.

| Item | Value |
| --- | --- |
| Plan path | `data/dataset/collection-plan.json` |
| Plan SHA-256 | `4f599cf8b49ce66178ad9693a5cb2abcafe5abb417f2ce66c97f20719840555e` |
| Generated at | `2026-05-21T06:50:07.969Z` |
| Vocabulary labels | 95 |
| Vocabulary source hash | `75aad8379fffbe1dc526f17cba83f62d69e34f72df727bb4613a7ed72b413ce8` |
| Vocabulary review hash | `16e207fbcaa00ba5bdfeef883501a680f064b520f0a8ecab4cc64244fac293f8` |
| Store path | `data/asl-pilot-store.json` |
| Store exists | `false` |
| Planned signers | 12 train / 4 validation / 4 test |
| Planned vocabulary captures | 475 train / 475 validation / 475 test |
| Planned negative challenge captures | 20 total; 5 each for `empty_camera`, `no_hands_visible`, `low_light`, and `off_center` |
| Planner warnings | none |
| Collection-session bundle | `output/collection-handoff/collection-session-bundle` |
| Collection-session bundle status | `ready_for_capture` |
| Bundle manifest SHA-256 | `3f5231c09509ccce727d9d705b6ecba6a9b5b569d0f6d09a815160443cfb6550` |
| Remediation queue JSON SHA-256 | `eaaab49ca5750a4df9830c4a6471274e0ec28ac3c6a0a8dc9860814c9fe96d32` |
| Remediation queue CSV SHA-256 | `09049dec1d2fc32cb8b4615e7f3adbba88b0169ba81ad4230013a91fd465b9b2` |
| Collection plan API SHA-256 | `8343bad02cbaaea4002e78e31b420d20413c5f5ea0f2bb71a2f090f3e6220f2f` |
| Collection panel SHA-256 | `1d00d80d7383fe95d5d02f178fb16febebbfd6a4983398c3483e1ecc8a268970` |
| Runtime smoke report SHA-256 | `74cec3aa6fbb7ef022322279b654114eb447e054459f57ff630201a54e3197ba` |

The plan is useful only for collection. It does not prove any training clips,
consent records, or review evidence exist.

## Refreshed External Source Evidence

Current public-source receipt:

- Receipt path: `docs/research/dataset-source-research-receipts.json`
- Receipt SHA-256:
  `9cf6c7211b96eb5e8f06b6ccd3856424519cf2c5bd1edd05de43f8208731b42f`
- Generated at: `2026-05-21T11:50:51.221Z`
- Audit command: `node scripts/audit_dataset_source_research.mjs`
- Audit status: `passed`
- Current source-register SHA-256:
  `692bda5f3f891462ab066539c4bcb8a0cc55a6358ed03972299b8742c6515b1f`
- Current status: no new online training source approved.
- Useful signals: the receipt rechecked 12 current online source pages/cards.
  NVIDIA / ASL 1000 remains the highest-leverage online candidate because it
  has raw-video and controlled-access evidence, Purdue RVL-SLLL ASL remains
  candidate-only behind a signed-license flow, PopSign v2 remains unreleased,
  and ASL Citizen, ASLLVD, How2Sign, OpenASL, WLASL, ASL-LEX, and the
  Hugging Face `ZahidYasinMittha` dataset remain blocked or not approved for
  the current final raw-frame model scope.

NVIDIA ASL / ASL 1000:

- Access page:
  `https://www.nvidia.com/en-us/gated-resources/trustworthy-ai-american-sign-language/dataset/`
- License PDF:
  `https://www.nvidia.com/content/dam/en-zz/Solutions/events/NVIDIA-Data-License-for-ASL-Project-%284Feb2025%29.pdf`
- Trustworthy AI terms:
  `https://www.nvidia.com/en-us/agreements/trustworthy-ai/terms/`
- AWS Open Data Registry:
  `https://registry.opendata.aws/asl_1000/`
- Public developer pipeline:
  `https://github.com/NVIDIA/Trustworthy-AI/tree/main/ASL%20Developer%20Community`
- Source-rights review:
  `docs/research/nvidia-asl-source-rights-review.md`
- Access request packet:
  `docs/research/nvidia-asl-access-request-packet.md`
- Candidate receipt:
  `docs/research/nvidia-asl-external-rights-review-receipt.json`
- Metadata audit:
  `docs/research/nvidia-asl-metadata-audit.json`
- Current status: candidate only.
- Useful signals: official access page says the dataset is broadly available to
  partners/customers after use-case and license acceptance; accepted users get
  raw video data; AWS lists ASL 1000 as a controlled-access S3 bucket; the public
  developer pipeline confirms the surrounding NVIDIA workflow expects S3 video
  inputs and derived annotation outputs.
- Constraints to review: license purpose limitation, no data redistribution,
  no identity/profiling/biometric use, no open-source-license contamination,
  controlled/gated access, public-statement restrictions, and no local protected
  metadata yet.
- Local public source-page, AWS registry, and developer-pipeline evidence is
  hash-pinned under `artifacts/dataset-research/nvidia-asl/`; no protected
  NVIDIA dataset data was downloaded.
- The metadata audit currently fails closed because no accepted access receipt
  or metadata staging directory exists.

PopSign v2:

- Official dataset page:
  `https://signdata.cc.gatech.edu/view/datasets/popsign_v2/index.html`
- Current status: wait-only.
- The page still says the dataset has not been released and the underlying
  videos are unavailable.

MS-ASL:

- Official download page:
  `https://www.microsoft.com/en-us/download/details.aspx?id=100121`
- Current local review: `docs/research/ms-asl-source-rights-review.md`.
- Current status: reduced-scope candidate only.
- Do not proceed unless the project explicitly accepts a 14-label reduced pilot
  and the source-register review approves the exact C-UDA/YouTube-derived
  import scope.

ASL Citizen:

- License page:
  `https://www.microsoft.com/en-us/research/project/asl-citizen/dataset-license/`
- Current status: blocked unless separately licensed.
- The license remains limited to non-commercial, non-revenue-generating research
  and bars distributing data/modifications.

## Required Next Evidence

For dormant first-party collection:

1. Do not execute this path unless the user explicitly reauthorizes
   browser-capture data.
2. If reauthorized later, use `data/dataset/collection-plan.json` to collect real browser-recorded
   clips. The refreshed operator bundle at
   `output/collection-handoff/collection-session-bundle` is the current
   capture handoff; use `remediation-collection-queue.csv` for priority order
   and its assignment keys in the collection UI. When the web app is running
   against the default collection plan, the assignment picker also follows the
   same remediation queue order.
3. Populate `data/asl-pilot-store.json` with signer registry, consent, clip, and
   negative challenge records.
4. Run and pass `node scripts/audit_clip_review.mjs`,
   `node scripts/audit_challenge_review.mjs`, and
   `node scripts/audit_dataset_collection_readiness.mjs`.
5. Export manifests only after those gates pass.

For NVIDIA:

1. Have a human operator submit an access request using the retained packet and
   the ASL 1000 AWS registry reference if the project wants to pursue this path.
2. Retain the accepted license text or receipt, set
   `status: accepted_access_retained`, and include at least one hash-pinned
   accepted-access evidence attachment.
3. Stage metadata only and run
   `node scripts/audit_nvidia_asl_access_metadata.mjs --write` for label
   vocabulary, signer/split fields, raw-video paths, and
   redistribution/model-output restrictions.
4. Add a source-register entry only if the external-rights review approves the
   exact raw-video-only import scope.
5. Import only raw video; reject extracted images, landmarks, pose, face meshes,
   pretrained models, or feature caches for the recognition path.

## Next Step

Do not rerun the current compact/factorized PopSign-only training path. The next
meaningful work is source-register-safe online/external raw-video evidence:
NVIDIA access followed by metadata-only review if accepted evidence appears, an
equivalent approved raw-video source, or an explicit reduced-scope pilot
decision. Until one of those produces approved raw video evidence, the final
model goal remains fail-closed.
