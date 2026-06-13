# NVIDIA ASL Source Rights Review

Checked at: 2026-05-21T21:01:37Z

This review is an engineering source-rights and access-readiness note for the
ASL Pilot raw-frame model goal. It is not legal advice, source-register
approval, manifest approval, or model evidence.

## Decision

NVIDIA ASL / ASL 1000 is a promising candidate only. Do not import NVIDIA files
into `data/manifests/`, `data/external/`, or `data/tensors/` yet.

Current repo interpretation:

```json
{
  "nvidia_asl_1000_status": "blocked_pending_nvidia_controlled_access",
  "anonymous_s3_status": "expected_403_after_registry_controlledaccess_review",
  "training_use": "none",
  "import_use": "none",
  "next_action": "submit_nvidia_access_request_and_request_current_delivery_method"
}
```

The official access page says approved users get raw video data along with
derived images and JSON for hands/body/face. The AWS Marketplace page labels
`ASL 1000` as open data and shows CLI access for `s3://trustworthyaiproduct/`,
but the AWS Open Data Registry YAML still marks the resource with
`ControlledAccess`, and current anonymous S3 attempts from this machine return
`AccessDenied`/`403`. For ASL Pilot, only raw video could be eligible. Extracted
images, hand landmarks, body poses, face meshes, pretrained models, detectors,
and feature caches must stay outside the recognition path unless the project
deliberately changes its no-pretrained, raw-frame-only constraints.

NVIDIA remains blocked for training until access works, the accepted
license/use-case receipt is retained if NVIDIA requires one, local metadata is
audited, label/signer split compatibility is proven, and the source register
approves an exact raw-video-only import scope.

## Local Evidence

Only public source pages, registry entries, license text, public developer
pipeline documentation, and anonymous S3 access-error evidence were downloaded.
No NVIDIA protected dataset data, dataset metadata package, raw videos, images,
landmarks, pose files, face-mesh files, or model artifacts were downloaded.

| Item | Value |
| --- | --- |
| Access page URL | `https://www.nvidia.com/en-us/gated-resources/trustworthy-ai-american-sign-language/dataset/` |
| Access page local copy | `artifacts/dataset-research/nvidia-asl/access-page.html` |
| Access page SHA-256 | `bd69fee6e0e87fcfab199ce911549fe800c97d5924b3e858b06d81605a1814cc` |
| Dataset license URL | `https://www.nvidia.com/content/dam/en-zz/Solutions/events/NVIDIA-Data-License-for-ASL-Project-%284Feb2025%29.pdf` |
| Dataset license local copy | `artifacts/dataset-research/nvidia-asl/NVIDIA-Data-License-for-ASL-Project-2025-02-04.pdf` |
| Dataset license SHA-256 | `c9c5f349ae47e02405da092a7e841be585754214d3e4d737ffaebc3ea3aa62e1` |
| Trustworthy AI terms URL | `https://www.nvidia.com/en-us/agreements/trustworthy-ai/terms/` |
| Trustworthy AI terms local copy | `artifacts/dataset-research/nvidia-asl/trustworthy-ai-terms.html` |
| Trustworthy AI terms SHA-256 | `e8a37e48495b2fb76f07cfb03c695a19873b47622f9bd3060e1412ff0242fdef` |
| AWS Open Data Registry URL | `https://registry.opendata.aws/asl_1000/` |
| AWS Open Data Registry local copy | `artifacts/dataset-research/nvidia-asl/aws-open-data-registry-asl-1000.html` |
| AWS Open Data Registry SHA-256 | `ee9fd4bb28fc5dd5732569665ecf76212918d815b3805ba23b203c7383467b4a` |
| Open Data Registry YAML copy | `artifacts/dataset-research/nvidia-asl/s3-inventory/asl_1000.yaml` |
| Open Data Registry YAML SHA-256 | `9c4080ac243b0cfada8bf6cadfdd00065a8b84cfbb807eb5668dd2e8caf3f69b` |
| GitHub license PDF copy | `artifacts/dataset-research/nvidia-asl/s3-inventory/NVIDIA-Data-License-ASL-GitHub.pdf` |
| GitHub license PDF SHA-256 | `173f7955e1cb04f7da34effaac0d90078633a8759faca001a55faa4c9c2da1f1` |
| AWS CLI version evidence | `artifacts/dataset-research/nvidia-asl/s3-inventory/aws-version.txt` |
| Current public S3 access audit | `docs/research/nvidia-asl-public-s3-access-audit.json` |
| Current public S3 access audit status | `blocked_public_s3_access_denied_no_dataset_downloaded` |
| NVIDIA Trustworthy-AI ASL developer README | `artifacts/dataset-research/nvidia-asl/trustworthy-ai-asl-developer-community-readme.md` |
| NVIDIA Trustworthy-AI ASL developer README SHA-256 | `ebf00757493d00693aeebdbb4092bfb06747d2ffa99355a5c0d594964e54f4dd` |
| NVIDIA Trustworthy-AI ASL data directory JSON | `artifacts/dataset-research/nvidia-asl/trustworthy-ai-asl-data-directory.json` |
| NVIDIA Trustworthy-AI ASL data directory JSON SHA-256 | `a19277466c6aca1755103a0887590ff29c06fa075304abd22188a8a3137a6db7` |
| NVIDIA / SuperAnnotate onboarding note | `artifacts/dataset-research/nvidia-asl/trustworthy-ai-asl-superannotate-onboarding.md` |
| NVIDIA / SuperAnnotate onboarding note SHA-256 | `3ecc1ec78216df5054edfc17b4ebfcb66d621ac8ec9bc6c4c0e776a64f71528b` |
| Metadata audit script | `scripts/audit_nvidia_asl_access_metadata.mjs` |
| Metadata audit script SHA-256 | `40af347e8009916b47127c96d3d1773920012b0f6ffa99285053c046b75a7667` |
| Current metadata audit | `docs/research/nvidia-asl-metadata-audit.json` |
| Current metadata audit status | `blocked` until accepted access receipt and metadata staging exist |

## Source Findings

- The access page frames the dataset as broadly available to partners and
  customers for applications that bridge communication barriers for the Deaf and
  hearing communities.
- Access is gated by a request form with a use-case field and license
  acceptance.
- The access page says access is granted based on license acceptance and use
  case.
- The page says accepted users get raw video data, extracted images, and
  consolidated JSON for hand landmarks, body poses, and facial meshes.
- The AWS Open Data Registry lists `ASL 1000` as an NVIDIA-managed machine
  learning video dataset and points the S3 bucket resource to NVIDIA controlled
  access, not an openly downloadable public bucket.
- The AWS Marketplace page currently says the open data resource is available
  with or without an AWS account and shows `aws s3 ls --no-sign-request
  s3://trustworthyaiproduct/`, but the same anonymous command currently returns
  `AccessDenied` from this machine.
- Anonymous `head-bucket`, `list-objects-v2`, recursive listing, and root sync
  attempts against `s3://trustworthyaiproduct/` failed before any object could
  be downloaded. The HTTPS bucket probe reports `x-amz-bucket-region:
  us-east-1`, while the registry YAML says `us-east-2`; both AWS CLI regions
  still returned `AccessDenied` for listing.
- The public NVIDIA Trustworthy-AI developer README describes a pipeline that
  processes S3 video files into keyframes, hand landmarks, pose landmarks, and
  SuperAnnotate conversion outputs. Those derived steps are useful source
  context, but they are not allowed ASL Pilot recognition inputs.
- The public GitHub data directory currently exposes only high-level
  `external`, `processed`, and `raw` directories for the developer pipeline repo;
  it is not a local ASL 1000 metadata package and does not prove label, signer,
  split, or raw-video inventory.
- The SuperAnnotate onboarding note says the dataset includes high-fidelity
  video paired with MediaPipe-generated annotations. The video signal is
  relevant; the MediaPipe annotations remain disallowed for this model path.
- The license grants a limited, revocable, non-transferable, non-sublicensable
  data license for advancing access technology for the Deaf community.
- The license restricts data use to that purpose, bars making the data available
  to others outside authorized users, and requires traceability of data copies.
- The license prohibits identifying/profiling individuals in the data, sensitive
  attribute labeling, biometric processing, and identity-recognition technology.
- The license prohibits using the data in a way that would make it subject to an
  open source software license.
- The license requires cooperation with NVIDIA on data subject deletion or
  correction requests and says NVIDIA may request deletion/cessation of use.
- The license permits attribution to data use, but otherwise restricts public
  statements about the agreement without NVIDIA approval.
- The license points use of the data at NVIDIA Trustworthy AI terms; those terms
  prohibit illegal surveillance, illegal biometric processing without required
  consent, harassment/abuse/threatening/bullying, and intentional deception.
- NVIDIA disclaims warranties including title and noninfringement. This is a
  materially different risk posture than PopSign v1's already-approved CC BY 4.0
  source decision.

## ASL Pilot Fit

Positive signals:

- The dataset may include raw video, which fits ASL Pilot's raw-frame-only
  recognition path if access and source-register approval are obtained.
- The AWS registry gives a concrete controlled-access S3 target for a later
  access-approved metadata audit.
- The stated purpose appears closer to ASL accessibility technology than many
  academic-only datasets.
- The request form allows the project to describe a narrow raw-video-only,
  no-identity, no-redistribution, browser-inference use case before access.

Blocking gaps:

- No access has been granted.
- The AWS registry resource is explicitly controlled access, and the current
  anonymous public S3 attempt failed with `AccessDenied`, so the bucket is not
  currently usable as a public-data shortcut around NVIDIA's access/license
  gate.
- No local dataset metadata, label list, signer IDs, split policy, clip counts,
  or raw-video hashes exist.
- The repository has no source-register entry approving NVIDIA.
- The accepted license receipt and any final access terms are not retained.
- It is not yet known whether ASL Pilot's browser ONNX model artifacts, pilot
  submission, model-card publication, or repository docs are compatible with
  NVIDIA's license and no-publicity constraints.
- The derived assets named by the access page are disallowed by the current
  raw-frame/no-pretrained-components policy.
- The retained metadata audit currently fails closed because
  `docs/research/nvidia-asl-access-receipt.json` and
  `artifacts/dataset-research/nvidia-asl/metadata/` are absent.
- The public S3 access audit currently fails closed because no bucket listing or
  sync succeeded and `./asl-1000` contains 0 files.

## Required Before Approval

1. Submit an access request only with an accurate ASL Pilot use case, using the
   NVIDIA access page and ASL 1000 AWS registry as source references.
2. Retain the accepted license/access receipt, set
   `status: accepted_access_retained`, and hash-pin at least one accepted-access
   evidence attachment or final-term record returned by NVIDIA.
3. Download only metadata first into
   `artifacts/dataset-research/nvidia-asl/metadata/`, not training media, and
   hash-pin the local metadata package.
4. Audit labels against the 95-label ASL Pilot vocabulary and any reduced-scope
   option.
5. Audit signer metadata and train/validation/test split policy for leakage.
6. Confirm whether derived model artifacts, ONNX browser artifacts, public model
   cards, and pilot submission materials are allowed.
7. Run `node scripts/audit_nvidia_asl_access_metadata.mjs --write` and keep it
   blocked unless the access receipt status, hash-pinned accepted-access
   attachment, metadata, label overlap, signer fields, split fields, and
   raw-video path candidates are present.
8. Add a source-register entry only if the exact raw-video-only import is
   approved.
9. Import only raw video after approval; reject extracted images, hand
   landmarks, body poses, face meshes, detectors, pretrained models, and feature
   caches.

## Next Step

Contact `trustworthyaiprojects@nvidia.com` or AWS Marketplace/Open Data support
with the retained `AccessDenied` request evidence. If NVIDIA fixes anonymous
bucket access or provides exact authorized object keys, retry inventory first,
stage metadata before media, retain the license/access evidence, and run the
metadata-only audit before any raw video import or source-register edit. Until
access and source-register approval exist, first-party collection remains the
only currently approved path for new training data.
