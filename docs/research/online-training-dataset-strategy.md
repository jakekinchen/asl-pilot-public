# Online Training Dataset Strategy

Checked at: 2026-05-21T11:50:54Z

This note records the current source-research pass for moving beyond the weak
PopSign-only raw-frame model. It is not a legal approval memo, source-register
approval, manifest approval, or model evidence.

## Decision

No new online source is approved for ASL Pilot model training yet.

The best newly identified online candidate for deeper review is NVIDIA ASL /
ASL 1000, because the official access page says accepted users receive raw video
data, and the AWS Open Data Registry now lists ASL 1000 as an NVIDIA-managed
controlled-access S3 dataset. For ASL Pilot, only raw video could be eligible.
A candidate-only source-rights review, access request packet, and
external-rights receipt are retained. NVIDIA is still not training data for
this repo until access is granted, the accepted license/use-case scope and
hash-pinned access evidence are retained, labels/splits are audited locally, and
the source register approves the exact raw-video import method.

The focused MS-ASL review now lives at
`docs/research/ms-asl-source-rights-review.md`. It keeps MS-ASL in
`candidate_not_approved_for_training` status because the metadata points to
upstream YouTube videos, the C-UDA text has no rights warranty for the data, and
a small URL probe found private/unavailable source videos. A full oEmbed probe
of the 50-label candidate found enough currently public rows for only 14 labels
to keep the 20 train / 5 validation / 5 test floor. The derived 14-label
candidate is retained, but it is too small for the current 95-label final-model
goal without explicit scope approval.

The data-path decision that supersedes this ranking for next action lives at
`docs/research/rawframe-data-decision.md`.

Generated imagery from ChatGPT, image tools, or similar systems should remain
limited to planning, visual review aids, UI illustration, or prompt exploration
unless the project adds a separate synthetic-data policy plus validators. It is
not a substitute for approved raw-video train/validation/test evidence.

The current public-source receipt now rechecks 12 online ASL dataset pages or
cards through `scripts/refresh_dataset_source_research.mjs`. It approves no new
training data. It keeps NVIDIA / ASL 1000 as candidate-only, keeps Purdue
RVL-SLLL ASL as signed-license-required candidate-only, confirms PopSign v2 is
still unreleased, and keeps ASL Citizen, ASLLVD, How2Sign, OpenASL, WLASL,
ASL-LEX, and the Hugging Face `ZahidYasinMittha` dataset blocked or
not-approved for the current raw-frame final model scope.

## Current Source-Research Receipt

| Item | Value |
| --- | --- |
| Receipt path | `docs/research/dataset-source-research-receipts.json` |
| Receipt SHA-256 | `9cf6c7211b96eb5e8f06b6ccd3856424519cf2c5bd1edd05de43f8208731b42f` |
| Generated at | `2026-05-21T11:50:51.221Z` |
| Source count | 12 |
| Refresh script SHA-256 | `179a2635bd3877a685ea253dc43656782300a5e67e644821f06bc5dc761336cd` |
| Audit script SHA-256 | `2178d46c8fae558c6277c5d1a02e79cc8ab15319c72a5c84de0b6af2cf113fc6` |
| Audit command | `node scripts/audit_dataset_source_research.mjs` |
| Audit status | `passed` |

Receipt decisions:

| Source receipt | Decision |
| --- | --- |
| `nvidia-asl-1000-access` | `candidate_controlled_access_not_approved` |
| `nvidia-asl-1000-aws` | `candidate_controlled_access_not_approved` |
| `popsign-v2` | `blocked_unreleased_underlying_videos_unavailable` |
| `asl-citizen` | `blocked_noncommercial_research_only` |
| `asllvd` | `blocked_permission_required_commercial_redistribution` |
| `how2sign` | `blocked_noncommercial_continuous_sentence_data` |
| `openasl` | `blocked_noncommercial_noderivatives_web_video` |
| `purdue-rvl-slll-asl` | `candidate_signed_license_required` |
| `huggingface-zahid-asl` | `blocked_scraped_multi_source_provenance_missing` |
| `wlasl` | `blocked_academic_computational_only` and `blocked_external_cv_artifact_boundary` |
| `asl-lex` | `blocked_video_permission_required` |

## Candidate Ranking

| Rank | Source | Fit | Current decision |
| ---: | --- | --- | --- |
| 1 | NVIDIA ASL / ASL 1000 | Official access page says accepted users receive raw video data; AWS registry lists controlled-access S3 data; intended purpose is ASL accessibility technology. | Candidate only. Gated access, license/use-case approval, local metadata audit, and source-register approval are required before import. |
| 2 | MS-ASL | Strong metadata fit: isolated ASL, 1,000 classes, signer-independent splits, 25,513 metadata rows, and 78 exact-normalized overlaps with current labels. | Candidate only. Availability filtering leaves only 14 labels meeting the 20/5/5 public-row floor; not viable for the current 95-label goal without explicit scope reduction. |
| 3 | PopSign ASL v2.0 | Best likely future fit because it extends the already-approved PopSign family and reports many more isolated ASL videos. | Blocked now. Official dataset page says the underlying videos are unavailable because the dataset has not been released. |
| 4 | ASL Citizen | Excellent task fit: consented, webcam-style isolated ASL, about 84k videos and 2.7k signs. | Blocked unless separately licensed. Current Microsoft license limits use to non-commercial, non-revenue-generating research and bars data distribution. |
| 5 | ASL-100-RGBD / Databrary | Strong signer-quality signal and raw RGB video availability, but smaller and access-controlled. | Candidate only for authorized-access review. Not currently available to this repo as approved training data. |
| 6 | Purdue RVL-SLLL ASL | Studio ASL videos from fluent Deaf signers and includes lighting variation. | Candidate only. Access requires a signed license agreement; not currently approved. |
| 7 | ASLLVD / ASLLRP DAI | Large isolated citation-form lexicon with annotations. | Blocked without permission. Existing terms prohibit commercial use without explicit permission and restrict redistribution. |
| 8 | Hugging Face `ZahidYasinMittha/American-Sign-Language-Dataset` | Large raw-video claim and MIT license claim. | Blocked pending provenance. The card says videos were scraped/collected from multiple sources and does not provide clip-level source, consent, or license evidence. |
| 9 | WLASL / Voxel51 WLASL | Isolated ASL videos and a convenient raw-video mirror. | Already blocked by source register: academic/computational use only and no commercial usage. |
| 10 | How2Sign / YouTube-ASL | Large ASL video corpora. | Poor current fit for this goal: continuous data and non-commercial or web-video provenance constraints. |

## NVIDIA ASL Dataset Access Candidate

No NVIDIA data was downloaded or imported.

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
- External-rights receipt:
  `docs/research/nvidia-asl-external-rights-review-receipt.json`
- Metadata audit:
  `docs/research/nvidia-asl-metadata-audit.json`
- Current status: candidate only.
- Useful signals: accepted users get raw video data; ASL 1000 now has a
  documented controlled-access S3 resource; the public developer pipeline
  confirms the surrounding NVIDIA workflow uses S3 video plus derived
  MediaPipe/SuperAnnotate artifacts.
- Required before import: dataset access, accepted license/use-case evidence,
  hash-pinned access attachment, local metadata/hash audit, label-overlap audit,
  source-register entry, and a raw-video-only import plan that rejects extracted
  images, landmarks, pose, face meshes, pretrained models, or feature caches.

Hash-pinned NVIDIA source evidence:

| File | SHA-256 |
| --- | --- |
| `artifacts/dataset-research/nvidia-asl/access-page.html` | `bd69fee6e0e87fcfab199ce911549fe800c97d5924b3e858b06d81605a1814cc` |
| `artifacts/dataset-research/nvidia-asl/NVIDIA-Data-License-for-ASL-Project-2025-02-04.pdf` | `c9c5f349ae47e02405da092a7e841be585754214d3e4d737ffaebc3ea3aa62e1` |
| `artifacts/dataset-research/nvidia-asl/trustworthy-ai-terms.html` | `e8a37e48495b2fb76f07cfb03c695a19873b47622f9bd3060e1412ff0242fdef` |
| `artifacts/dataset-research/nvidia-asl/aws-open-data-registry-asl-1000.html` | `ee9fd4bb28fc5dd5732569665ecf76212918d815b3805ba23b203c7383467b4a` |
| `artifacts/dataset-research/nvidia-asl/trustworthy-ai-asl-developer-community-readme.md` | `ebf00757493d00693aeebdbb4092bfb06747d2ffa99355a5c0d594964e54f4dd` |
| `artifacts/dataset-research/nvidia-asl/trustworthy-ai-asl-data-directory.json` | `a19277466c6aca1755103a0887590ff29c06fa075304abd22188a8a3137a6db7` |
| `artifacts/dataset-research/nvidia-asl/trustworthy-ai-asl-superannotate-onboarding.md` | `3ecc1ec78216df5054edfc17b4ebfcb66d621ac8ec9bc6c4c0e776a64f71528b` |
| `docs/research/nvidia-asl-source-rights-review.md` | `0393d9b9e539910e7566a49d7de0b03f869f3d011affd695e5a636b9af9bbb66` |
| `docs/research/nvidia-asl-access-request-packet.md` | `b686a8eb2dedf64f8dc028704e4c12ad7b939bd4cbc33225427e4492ade35351` |
| `docs/research/nvidia-asl-access-receipt.template.json` | `df653542c6281c664edcb0e527e92c343460385400f2584e689f26fb2cbd02d4` |
| `docs/research/nvidia-asl-external-rights-review-receipt.json` | `5e4d1be32bbe402a2145310567a3ef0d1a4034efb04b94a1a41ff6719bdddce4` |
| `scripts/audit_nvidia_asl_access_metadata.mjs` | `40af347e8009916b47127c96d3d1773920012b0f6ffa99285053c046b75a7667` |
| `docs/research/nvidia-asl-metadata-audit.json` | `c21733ad2c82db5a1b0e1c3f13f79485c40ec5f733e852ed451d54056978dc76` |

## MS-ASL Metadata Scan

Downloaded only the official metadata ZIP; no MS-ASL videos were downloaded or
used for training.

- Download page:
  `https://www.microsoft.com/en-us/download/details.aspx?id=100121`
- Metadata ZIP:
  `artifacts/dataset-research/ms-asl/MS-ASL.zip`
- Metadata ZIP SHA-256:
  `a8562008309eea4129e1bc0ed7f654a314fee195227222859657e307b6434c34`

Extracted file hashes:

| File | SHA-256 |
| --- | --- |
| `artifacts/dataset-research/ms-asl/extracted/MS-ASL/README.md` | `dc0d5adc98f24b4c5a13d8ead15d19e9531e68d48a6145b222e5791cf3565322` |
| `artifacts/dataset-research/ms-asl/extracted/MS-ASL/MSASL_classes.json` | `49b0d5238aec3727d6184215ac20fecd5e0fd376df1d5825adce57bebb46d1f8` |
| `artifacts/dataset-research/ms-asl/extracted/MS-ASL/MSASL_train.json` | `dfd75a9f3087e57b105123d3553445a9e1d2fbd0c25ee6b3767a14dee68a8c02` |
| `artifacts/dataset-research/ms-asl/extracted/MS-ASL/MSASL_val.json` | `c698b0ce4b2be749bede18c423d32cb8d6440c23bb52a6b7beb802bbc27e44be` |
| `artifacts/dataset-research/ms-asl/extracted/MS-ASL/MSASL_test.json` | `aa0f78ef40d03696ce7effc0d087ba6a8fe83dbd1e777a027b20a79a1514df8f` |
| `artifacts/dataset-research/ms-asl/extracted/MS-ASL/C-UDA-0.1_annotated_discussion.pdf` | `88aadb29e93a1799f1d0b4db39bfd0ae5bc4b5fe222acd8e9d231c8dbf7939e3` |
| `docs/research/ms-asl-source-rights-review.md` | `59e6b92accb8c06542b370f781e0504486025c97455c270ea1c229d8825d4d40` |
| `docs/research/ms-asl-availability-probe.json` | `118ac38e51108aecb59030fd2e103f06e69f81fe60ae87c5ff2fa30ffbf24661` |
| `docs/research/ms-asl-pruned-vocabulary-candidate.json` | `65132bb3fc9c1576091c51953bded43f750c38762f4a13a6f03fd349438ed308` |
| `scripts/export_msasl_pruned_vocabulary_candidate.mjs` | `80d4ae86819fc0dcc45170b973ff758a42ff9950470aa0ec21351c151ef13e99` |
| `docs/research/ms-asl-pruned-vocabulary-availability-probe.json` | `e92afd7ae302be7a7fa8495a709ba29ac07d77ba93384053e7fcc016cb880dfb` |
| `scripts/probe_msasl_candidate_availability.mjs` | `f1d6b144b29e7dd0d418d252a46261eddf59a5b8a2dceac7d3732d5d46e31006` |
| `docs/research/ms-asl-availability-filtered-candidate.json` | `4c193c2692a9d1dd623ee7cccd6bd380b5d2ce76513b9b905736f31e69b12038` |
| `scripts/export_msasl_availability_filtered_candidate.mjs` | `5e42ea71af051899990743c7060c8688757f9f29142aa4be905cd1edb3a16277` |

MS-ASL metadata counts:

| Split | Rows |
| --- | ---: |
| train | 16,054 |
| validation | 5,287 |
| test | 4,172 |
| classes | 1,000 |

ASL Pilot overlap using lowercase alphanumeric normalization:

| Check | Count |
| --- | ---: |
| Current ASL Pilot labels | 95 |
| MS-ASL classes | 1,000 |
| Exact-normalized label overlaps | 78 |
| Overlaps with at least 20 train, 5 validation, and 5 test metadata rows | 50 |
| Selected candidate metadata rows | 1,710 train / 529 validation / 367 test |
| Unique YouTube video IDs in 50-label candidate | 1,002 |
| Public oEmbed video IDs | 671 |
| Not-public or unavailable video IDs | 331 |
| Public candidate rows | 1,842 / 2,606 |
| Labels still meeting 20/5/5 public-row floor | 14 |
| Availability-filtered candidate public rows | 368 train / 113 validation / 92 test |
| Availability-filtered candidate public video IDs | 291 |

The 50-overlap subset is the first useful pruning target if MS-ASL receives a
source-register approval. Examples include `hello`, `no`, `happy`, `like`,
`orange`, `bird`, `fish`, `sad`, `table`, `where`, `milk`, `brother`, `book`,
`girl`, `fine`, `black`, `boy`, `please`, `water`, `yellow`, `hungry`, `man`,
`red`, `sick`, `blue`, `green`, `who`, `now`, `brown`, `pencil`, `bad`, `read`,
`go`, `night`, `dog`, `have`, `time`, `home`, `cat`, `tomorrow`, `all`, `hot`,
`why`, `horse`, `yesterday`, `mad`, `car`, `bed`, `see`, and `morning`.

Availability sample:

| Sample | Count |
| --- | ---: |
| Metadata clips probed | 15 |
| Public via `yt-dlp --simulate --skip-download` | 11 |
| Private | 2 |
| Unavailable | 2 |
| Video bytes downloaded | 0 |

## Source Evidence Summary

- MS-ASL official download page publishes the metadata ZIP and describes it as
  the MS-ASL American Sign Language Dataset.
- The MS-ASL README says the package contains train/test/validation JSON, 1,000
  gloss classes, synonym mapping, and a C-UDA license discussion PDF.
- The MS-ASL paper describes 25,513 video samples, just over 24 hours of video,
  222 distinct signers, and signer-independent train/validation/test splits.
- The local C-UDA v0.1 PDF permits computational use and treats AI models as
  output if they contain no more than a de minimis portion of the data, but it
  also says the data provider does not warrant rights in the data.
- A 15-clip URL sample found mixed availability: some metadata URLs are currently
  public, while others are private or unavailable.
- A full oEmbed probe over the deterministic 50-label candidate found 70.7%
  public-row coverage but only 14 labels still meet the original 20/5/5 split
  floor after public-availability filtering.
- The 14-label availability-filtered candidate is not a substitute for the
  current final model scope. It is only worth stronger media-format probing if
  the project deliberately accepts a reduced 14-label pilot.
- NVIDIA / ASL 1000 is a stronger online candidate to pursue next than
  continuing MS-ASL by default, but it is controlled access and cannot enter
  manifests until access, metadata audit, accepted-term retention, and
  source-register approval exist.
- PopSign v2 is not currently usable: the official page says the dataset has not
  been released and the underlying videos are unavailable.
- ASL Citizen is blocked for current project training use by Microsoft license
  terms limiting use to non-commercial, non-revenue-generating research and
  prohibiting distribution of data or modifications.
- ASL-100-RGBD is promising but access-controlled through Databrary and includes
  continuous sequences of 100 requested signs rather than already-isolated clip
  files.
- ASLLVD has strong ASL lexicon coverage but its published terms require
  explicit permission for commercial use and disallow further redistribution.

## Required Before Any MS-ASL Training Import

1. Add a source-register entry only after exact source-rights review approves
   the MS-ASL data scope for this pilot.
2. Decide whether C-UDA plus the official metadata package is sufficient for the
   project scope, including trained model artifacts, browser deployment, and any
   demo/submission use.
3. Audit raw-video availability from the metadata URLs without committing those
   videos to training manifests.
4. Build a deterministic pruned vocabulary plan from the 50 overlap labels or a
   stricter subset, with signer-disjoint split preservation.
5. Import only approved raw videos, decode to raw RGB tensors, and bind manifests
   to the current source register hash.
6. Train and evaluate from random initialization through the existing raw-frame
   pipeline; do not use MS-ASL pretrained models, extracted features, landmarks,
   detectors, or feature caches.

## Next Step

For the current goal, treat MS-ASL as not viable at the current scope unless the
project explicitly accepts a 14-label reduced pilot. Do not run a full
media-format probe or source-register approval path for MS-ASL by default. The
next useful online-source step is NVIDIA access and source-rights review, or an
equivalent source-register-safe raw-video route. The 2026-05-25 user correction
excludes first-party browser-capture data from the active plan.
