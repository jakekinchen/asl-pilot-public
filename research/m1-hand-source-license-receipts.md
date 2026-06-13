# M1 Hand Source and License Receipts

Date: 2026-05-31

Scope: Milestone M1 source/license gate for FreiHAND, RHD, and
COCO-WholeBody before any dataset download, trainer work, GPU run, Brev spend,
or model promotion.

Machine-readable receipt:
`data/receipts/m1-hand-public-sources-v1.json`

## Claim Boundary

- Local academic/research training preparation is allowed after this receipt.
- Public model weight distribution is still blocked pending explicit license
  review or permission for every contributing dataset.
- Raw images, archives, crops, annotations, tensors, and caches must stay out of
  git. `.gitignore` now covers the planned M1 external roots.
- No pretrained CV/sign/landmark/model output is approved as supervision.

## FreiHAND

Primary source:
https://lmb.informatik.uni-freiburg.de/resources/datasets/FreihandDataset.en.html

Planned local root: `data/external/freihand/`

Use gate: `local_training_only`

Distribution gate: `distribution_pending`

The Freiburg source page describes FreiHAND v2 as 130,240 training samples and
3,960 evaluation samples with 21 3D hand keypoints, masks, camera intrinsics,
and hand scale. The terms on the source page restrict use to research, disclaim
warranty, prohibit commercial use, and require citing the FreiHAND ICCV 2019
paper.

Download artifacts checked:

- Train: `https://lmb.informatik.uni-freiburg.de/data/freihand/FreiHAND_pub_v2.zip`
  - Page size: 3.7GB
  - `Content-Length`: 3,881,833,583
  - `Last-Modified`: Mon, 21 Oct 2019 16:12:03 GMT
  - `ETag`: `"e760146f-5956df1c048bb"`
- Evaluation with annotations:
  `https://lmb.informatik.uni-freiburg.de/data/freihand/FreiHAND_pub_v2_eval.zip`
  - Page size: 724MB
  - `Content-Length`: 758,382,230
  - `Last-Modified`: Fri, 21 Jan 2022 06:48:32 GMT
  - `ETag`: `"2d33fe96-5d61201dd5e58"`

## RHD

Primary source:
https://lmb.informatik.uni-freiburg.de/resources/datasets/RenderedHandposeDataset.en.html

Planned local root: `data/external/rhd/`

Use gate: `local_training_only`

Distribution gate: `distribution_pending`

The Freiburg source page describes RHD as 41,258 training and 2,728 test samples
with RGB, depth, segmentation masks, 21 hand keypoints with image-frame uv,
world xyz, visibility, and camera intrinsics. The terms restrict use to
research, disclaim warranty, prohibit commercial use, and require citing the
Zimmermann/Brox 2017 paper.

Download artifact checked:

- Train/test archive:
  `https://lmb.informatik.uni-freiburg.de/data/RenderedHandpose/RHD_v1-1.zip`
  - Page size: 7.1GB
  - `Content-Length`: 7,080,690,299
  - `Last-Modified`: Fri, 13 Oct 2017 11:44:30 GMT
  - `ETag`: `"1a60ac27b-55b6c2e05b52e"`

## COCO-WholeBody

Primary source:
https://github.com/jin-s13/COCO-WholeBody

Raw README checked:
https://raw.githubusercontent.com/jin-s13/COCO-WholeBody/master/README.md

COCO source:
https://cocodataset.org/#download

Planned local roots:

- `data/external/coco-wholebody/`
- `data/external/coco2017/`

Use gate: `local_training_only`

Distribution gate: `distribution_pending`

The COCO-WholeBody README describes annotations over the COCO 2017 train/val
split, with person, face, left-hand, and right-hand boxes plus 133 keypoints per
person: 17 body, 6 feet, 68 face, and 42 hands. The README terms are
fail-closed for this project: research/non-commercial only, annotations owned by
SenseTime Research, and the linked Creative Commons legal code currently points
to BY-NC 4.0. Commercial use requires contacting the listed maintainers.

The COCO image layer remains separate. COCO's own terms put annotations and the
website under CC BY 4.0, while image copyright remains with the image owners and
image use must follow Flickr terms.

COCO-WholeBody annotation artifacts from the primary README:

- Train annotations:
  `https://drive.google.com/file/d/1thErEToRbmM9uLNi1JXXfOsaS5VK2FXf/view?usp=sharing`
- Validation annotations:
  `https://drive.google.com/file/d/1N6VgwKnj8DeyGXCvp1eYgNbRmw6jdfrb/view?usp=sharing`
- OneDrive alternates are recorded in the JSON receipt.
- The primary README does not publish annotation archive sizes or checksums; the
  download slice must record post-download sizes and hashes.

COCO 2017 artifacts checked:

- Train images:
  `http://images.cocodataset.org/zips/train2017.zip`
  - Page size: 2017 Train images [118K/18GB]
  - `Content-Length`: 19,336,861,798
  - `Last-Modified`: Wed, 11 Jul 2018 05:02:03 GMT
  - `ETag`: `"62ff7d7fbcc7e0c0604cbb0f9047ce77-2306"`
- Validation images:
  `http://images.cocodataset.org/zips/val2017.zip`
  - Page size: 2017 Val images [5K/1GB]
  - `Content-Length`: 815,585,330
  - `Last-Modified`: Wed, 11 Jul 2018 05:08:47 GMT
  - `ETag`: `"d366be60d3dc737327160d62453e3973-98"`
- COCO train/val annotations:
  `http://images.cocodataset.org/annotations/annotations_trainval2017.zip`
  - Page size: 2017 Train/Val annotations [241MB]
  - `Content-Length`: 252,907,541
  - `Last-Modified`: Tue, 10 Jul 2018 17:58:17 GMT
  - `ETag`: `"f4bbac642086de4f52a3fdda2de5fa2c"`

## Commands Run

```sh
curl -Ls https://lmb.informatik.uni-freiburg.de/resources/datasets/FreihandDataset.en.html | rg -n "Download|Terms|research|commercial|href|3\\.7|724"
curl -Ls https://lmb.informatik.uni-freiburg.de/resources/datasets/RenderedHandposeDataset.en.html | rg -n "Download|Terms|research|commercial|href|7\\.1|41258|2728"
curl -Ls https://raw.githubusercontent.com/jin-s13/COCO-WholeBody/master/README.md | rg -n "COCO-WholeBody|Download|Images|Google Drive|OneDrive|Terms|research|non-commercial|Creative Commons|Flickr|133|hand|box"
curl -Ls https://raw.githubusercontent.com/cocodataset/cocodataset.github.io/master/dataset/download.htm | rg -n "train2017|val2017|annotations_trainval2017|images.cocodataset.org|Terms|Flickr|creative"
curl -Ls https://raw.githubusercontent.com/cocodataset/cocodataset.github.io/master/dataset/termsofuse.htm | sed -n '1,180p'
curl -LsI <dataset archive urls> | rg -i 'HTTP/|content-length|last-modified|etag|content-type'
```

## Commands Intentionally Not Run

- No dataset download was started in this receipt slice.
- No trainer, optimizer, backward pass, GPU/CUDA, MPS, Brev, export, or
  promotion command was run.
- No raw learner video or private data access was performed.

## Next Action

Download the approved public source archives into the ignored `data/external/`
paths, record post-download SHA256 checksums, and stop if storage pressure
approaches the 150GB target.
