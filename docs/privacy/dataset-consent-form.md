# Dataset Consent Form

Version: `asl-pilot-dataset-consent-v1`

This form is used only for explicit dataset collection sessions. It does not
apply to normal learner practice.

## Consent Statements

The signer or their authorized representative must confirm:

- Signer is eligible to consent for this pilot.
- Clip may be used for from-scratch model training.
- Clip may be used for validation or test splits.
- Clip may be used for this pilot submission.
- Derived trained artifacts may be retained after collection.
- Retention and deletion process has been explained.
- Withdrawal limits for already-trained artifacts have been explained.
- De-identified metadata may be retained for provenance and audit.
- Raw clips are stored locally and are not redistributed without separate written permission.

## Storage And Access

Raw clips are stored under `data/dataset/clips` in the local project workspace.
Access is limited to the local operator/developer environment used for this
pilot unless separate written permission is obtained.

## Withdrawal Handling

Before training, withdrawal removes the signer account records, consent
records, signer registry record, clip metadata, and local raw clip files.

After training, withdrawal removes raw clips and collection metadata from the
local store, but already-derived model artifacts may be retained only if the
signer explicitly acknowledged derived artifact retention before collection.
