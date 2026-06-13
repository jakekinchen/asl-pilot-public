# Codex Loop Progress

## 2026-05-31 - M1 FreiHAND/RHD Hand Manifest Builder

Completed one M1 hand-pipeline slice: added a CPU-safe manifest builder for
FreiHAND and RHD that reads the already-downloaded local archives, normalizes
both sources to one per-hand 21-keypoint crop-space schema, and records a tiny
real-archive smoke receipt.

Files:

- `scripts/build_m1_hand_public_manifest.py`
- `tests/test_m1_hand_public_manifest.py`
- `data/receipts/m1-hand-public-manifest-smoke-v1.json`

What changed:

- FreiHAND loader projects `training_xyz.json` through `training_K.json`,
  expands each unique sample across the four provided RGB background replicas,
  assigns a deterministic train/validation split, and emits right-hand crop
  records.
- RHD loader reads `anno_training.pickle` and `anno_evaluation.pickle`, splits
  the 42 keypoints into 21 left and 21 right hand records when visible, and
  preserves visibility masks.
- The canonical record contains source/archive provenance, normalized hand and
  crop boxes, 21 `(x, y, visibility)` crop keypoints, root-relative normalized
  depth, presence, handedness, and the local-training-only distribution gate.
- A tiny real-archive smoke wrote the ignored local manifest
  `data/manifests/m1-hand-public-smoke-v1.jsonl` and committed only the summary
  receipt, not source images or caches.

Commands run:

- `python3 -m unittest tests.test_m1_hand_public_manifest`
- `python3 -m py_compile scripts/build_m1_hand_public_manifest.py tests/test_m1_hand_public_manifest.py`
- `.labelvenv/bin/python3 scripts/build_m1_hand_public_manifest.py --sources freihand,rhd --max-freihand-unique 3 --max-rhd-per-split 3 --out data/manifests/m1-hand-public-smoke-v1.jsonl --summary-out data/receipts/m1-hand-public-manifest-smoke-v1.json`

Commands intentionally not run:

- No dataset downloads.
- No full FreiHAND/RHD image extraction beyond reading archive members.
- No COCO2017 train image extraction.
- No trainer, optimizer, backward pass, GPU/CUDA, MPS, Brev, export, or
  promotion command.

Next:

Add `HandLandmarkNetV2` trainer support on top of this manifest, then run only
the requested tiny CPU smoke with `--device cpu` and `--max-train`.

## 2026-05-31 - M1 Hand Source/License Receipts

Completed one buildable M1 slice: wrote source/license receipts for FreiHAND,
RHD, and COCO-WholeBody before any dataset download or training.

Files:

- `data/receipts/m1-hand-public-sources-v1.json`
- `research/m1-hand-source-license-receipts.md`
- `.gitignore`

What changed:

- Recorded primary source URLs, planned local roots, use gates, distribution
  gates, expected archive sizes where published or available from HTTP headers,
  and citation requirements for FreiHAND, RHD, and COCO-WholeBody.
- Recorded a fail-closed COCO-WholeBody license stance: the current primary
  README says research/non-commercial only and links to BY-NC legalcode, while
  COCO images remain governed by Flickr terms.
- Added `.gitignore` safeguards for the planned external dataset roots:
  `data/external/freihand/`, `data/external/rhd/`,
  `data/external/coco2017/`, and `data/external/coco-wholebody/`.

Commands run:

- `git status --short --branch`
- `git log --oneline -15`
- `sed -n '1,260p' research/BUILD-PLAN-landmark-pose-stack.md`
- `curl`/`rg` checks against Freiburg FreiHAND and RHD pages, COCO-WholeBody
  README, COCO download page, COCO terms page, and direct archive HTTP headers
- `git check-ignore -v ... || true`

Commands intentionally not run:

- No dataset downloads.
- No trainer, optimizer, backward pass, GPU/CUDA, MPS, Brev, export, or
  promotion command.
- No raw learner video or private data access.

Next:

Download the approved public source archives into the ignored `data/external/`
paths, record SHA256 checksums after download, and stop if storage pressure
approaches the 150GB target.
