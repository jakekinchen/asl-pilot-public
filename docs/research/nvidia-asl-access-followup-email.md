# NVIDIA ASL 1000 Access Follow-Up Email

Status: draft_not_sent

This draft is for follow-up after submitting the NVIDIA gated access form. It
has not been sent and does not transmit any personal or project data. Refreshed
2026-05-25 to match the current raw-frame-only model-quality blocker.

```text
hi nvidia trustworthy ai team,

i'm requesting access to the asl 1000 dataset for a small asl recognition prototype focused on accessibility-oriented isolated-sign practice. the project uses a from-scratch raw RGB video model path only: no landmarks, pose files, face meshes, pretrained detectors, pretrained backbones, or model-zoo weights in the recognition path. i reviewed the aws marketplace page, the open data registry yaml, and the nvidia dataset license.

i attempted anonymous access to the listed s3 bucket, s3://trustworthyaiproduct/, using the documented aws cli command, but the bucket currently returns accessdenied/403. i noticed the open data registry now marks the dataset as controlledaccess and points to the nvidia gated access page, so i assume direct anonymous s3 access is no longer the correct path.

could you confirm the current access mechanism after approval? specifically, should i expect access through an aws account entitlement, aws data exchange, presigned download links, or another gated repository?

for clarity, i have not downloaded, imported, trained on, redistributed, or otherwise used any nvidia asl 1000 data. my intended use is accessibility-focused asl recognition research/prototyping, not identity recognition, biometric processing, sensitive-attribute inference, or reidentification. the first step after access would be metadata-only review for label overlap, signer/split structure, raw-video availability, and license compatibility before any media import.

thanks,
jake kinchen
```
