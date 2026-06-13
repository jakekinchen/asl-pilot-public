# ASL Citizen license and source-register draft

Date: 2026-05-31

## Verdict

For the ASL Pilot source gate, **do not distribute trained browser/runtime model
weights derived from ASL Citizen without written Microsoft confirmation**.

The ASL Citizen Microsoft Research terms clearly allow use of the Materials only
for non-commercial, non-revenue-generating research. They allow data use and
modification, but prohibit distribution of the data and modifications to the
data. They also bar sharing, publishing, distributing, or lending the Materials
to third parties. The terms allow publication of research results only when no
material or substantial portion of the Materials is included.

The license does **not** explicitly say whether trained model weights are a
"modification to the data", "derivative", or merely a research result. Because
the dataset is human video data, the personal-data clause is strict, and a
browser deployment artifact is itself a redistributed artifact, the project
should treat ASL Citizen-derived trained weights as **non-distributable until
Microsoft says otherwise in writing**.

Operational decision: ASL Citizen can remain a local, noncommercial academic
training/validation source only where the project already has that approval.
It should not be a source for any public or third-party browser weight artifact.

## Evidence read

- Local package terms: `data/external/asl-citizen/ASL_Citizen.zip!ASL_Citizen/use.txt`
  - SHA-256 of the extracted `use.txt` stream:
    `5f712014b70142ef06d0bac3d47cb8ff210da0671ce555a6bdc3a7b3f3538d64`
  - The extracted `data/external/asl-citizen/ASL_Citizen/` tree in this worktree
    does not contain a separate README or LICENSE file; the terms are inside
    the zip.
- Local provenance manifest:
  `data/external/asl-citizen/asl_citizen_manifest.json`
  - SHA-256:
    `baa54be222a4aff65f73f30dd164adbf19e632e510586688568dbd87b5521425`
- Live register schema reference, read only:
  `/Users/kelly/Developer/asl-pilot/docs/model/dataset-source-register.json`
- Current public Microsoft Research license page:
  <https://www.microsoft.com/en-us/research/project/asl-citizen/dataset-license/>
- Current ASL Citizen project page, including commercial-contact instruction:
  <https://www.microsoft.com/en-us/research/project/asl-citizen/>

## Reasoning

The license categories are "source code", "object code", and "data", together
called "Materials". The ASL Citizen download is data. The data clause permits
use and modification for noncommercial research, subject to the original consent,
but does not permit distribution of the data or modifications to the data.

Weights trained from data are not named in the terms. There are two possible
interpretations:

- **Permissive interpretation:** trained weights are research results, not a copy
  or modification of the dataset, and Section 5 allows publishing results as
  long as no material or substantial portion of the Materials is included.
- **Conservative interpretation:** trained weights are a derived artifact from
  licensed data, may encode dataset-specific or personal-data-bearing signals,
  and are not expressly granted for distribution. A browser artifact distributes
  the artifact to third parties, so it should be blocked unless Microsoft
  confirms permission.

The conservative interpretation is the right project gate. The terms reserve all
rights not granted, and the grant is narrow. They expressly discuss distribution
of modifications only back to Microsoft, while third-party redistribution is
restricted. That is not enough authority to ship weights in a browser artifact.

## What to confirm with Microsoft

Contact: `ASL_Citizen@microsoft.com`

Ask for written confirmation on these exact points:

1. Whether trained model weights produced from ASL Citizen videos, labels, or
   offline-derived labels are considered "modifications", "derivatives", or
   otherwise restricted artifacts under the ASL Citizen Microsoft Research
   license.
2. Whether a noncommercial academic project may distribute those trained weights
   to third parties as a browser deployment artifact, demo bundle, school
   assignment submission, GitHub release, or static web asset.
3. Whether permission changes if the weights are trained from scratch, contain no
   raw videos, no frames, no crops, no landmarks, no feature caches, and no
   substantial dataset excerpts.
4. Whether model-card attribution, license notice inclusion, noncommercial-only
   labeling, or recipient-side ASL Citizen license acceptance is required.
5. Whether the answer differs for local classroom/evaluator submission versus
   public web distribution.
6. Whether any destruction or retention requirements apply to trained weights
   after the research period, given the license's Personal Data clause.
7. Whether commercial or revenue-generating use of the resulting weights requires
   a separate agreement, and what permission text Microsoft wants the project to
   preserve.

## Draft source-register entry

This is a draft only. It was not written to the live register. It is shaped to
match the current `dataset-source-register.json` entries and encodes a
fail-closed policy for browser/runtime weight distribution.

```json
{
  "source_id": "asl-citizen-local-noncommercial-raw-videos-weight-distribution-pending",
  "display_name": "ASL Citizen local noncommercial raw videos - weight distribution pending",
  "source_kind": "public_reference_dataset",
  "allowed_for_model_training": true,
  "allowed_for_validation": true,
  "allowed_for_pilot_submission": false,
  "license_review_status": "approved_local_noncommercial_training_blocked_weight_distribution_pending_ms_confirmation",
  "decision_id": "blocked_asl_citizen_weight_distribution_pending_ms_confirmation_2026_05_31",
  "primary_source_url": "https://www.microsoft.com/en-us/research/project/asl-citizen/dataset-license/",
  "review_required_before_allowing": true,
  "offline_derived_label_amendment": {
    "decision_id": "local_only_asl_citizen_offline_derived_labels_2026_05_31",
    "authorized_by": "pending Microsoft written confirmation for any distributed ASL Citizen-derived weights",
    "basis": "The Microsoft Research terms permit noncommercial research use and local modification of data, but prohibit distributing data or data modifications and do not expressly grant distribution rights for trained model weights. ASL Pilot therefore treats ASL Citizen-derived labels as local-only supervision and treats ASL Citizen-derived weights as non-distributable until Microsoft confirms otherwise.",
    "scope": "Offline-derived labels, landmarks, crops, features, manifests, and training supervision may be generated only for local noncommercial academic training and validation. No ASL Citizen raw video, modified video, extracted frame, crop, landmark, feature cache, manifest excerpt, or model weight trained wholly or partly on ASL Citizen may be distributed in a browser/runtime artifact without written Microsoft permission.",
    "decision_record": "research/asl-citizen-license-and-register.md"
  },
  "external_rights_review": {
    "status": "blocked_for_weight_distribution_pending_microsoft_confirmation",
    "reviewed_at": "2026-05-31T00:00:00.000Z",
    "reviewer_name": "ASL Pilot automated source-rights gate",
    "reviewer_role": "machine-readable source, license, and provenance audit",
    "is_project_operator": false,
    "allowed_use_summary": "ASL Citizen may be used only for local noncommercial academic raw-video training and validation if the existing school-assignment approval remains in force. Distribution of browser/runtime model weights trained wholly or partly on ASL Citizen remains blocked pending written Microsoft confirmation.",
    "decision_scope": {
      "allowed_for_model_training": true,
      "allowed_for_validation": true,
      "allowed_for_pilot_submission": false
    },
    "review_receipt": {
      "path": "research/asl-citizen-license-and-register.md",
      "sha256": "TODO_COMPUTE_IF_THIS_DRAFT_IS_PROMOTED"
    },
    "license_evidence_files": [
      {
        "path": "data/external/asl-citizen/ASL_Citizen.zip!ASL_Citizen/use.txt",
        "sha256": "5f712014b70142ef06d0bac3d47cb8ff210da0671ce555a6bdc3a7b3f3538d64"
      },
      {
        "path": "data/external/asl-citizen/asl_citizen_manifest.json",
        "sha256": "baa54be222a4aff65f73f30dd164adbf19e632e510586688568dbd87b5521425"
      }
    ]
  },
  "source_evidence": [
    {
      "evidence_type": "license_terms",
      "url": "https://www.microsoft.com/en-us/research/project/asl-citizen/dataset-license/",
      "checked_at": "2026-05-31T00:00:00.000Z",
      "summary": "Microsoft Research terms limit Materials to noncommercial, non-revenue-generating research; permit local data use and modification; prohibit distributing data or data modifications; restrict third-party sharing of Materials; and allow publication of results only without a material or substantial portion of the Materials.",
      "supports_decision": true
    },
    {
      "evidence_type": "local_license_terms",
      "path": "data/external/asl-citizen/ASL_Citizen.zip!ASL_Citizen/use.txt",
      "sha256": "5f712014b70142ef06d0bac3d47cb8ff210da0671ce555a6bdc3a7b3f3538d64",
      "checked_at": "2026-05-31T00:00:00.000Z",
      "summary": "The local ASL Citizen zip contains the same Microsoft Research license text used for the rights decision.",
      "supports_decision": true
    },
    {
      "evidence_type": "offline_derived_label_provenance",
      "path": "data/external/asl-citizen/asl_citizen_manifest.json",
      "sha256": "baa54be222a4aff65f73f30dd164adbf19e632e510586688568dbd87b5521425",
      "checked_at": "2026-05-31T00:00:00.000Z",
      "summary": "Local manifest maps official ASL Citizen video filenames to normalized labels and source splits for offline local training/validation provenance. It is treated as non-redistributable dataset-derived metadata.",
      "supports_decision": true
    },
    {
      "evidence_type": "runtime_scratch_attestation",
      "checked_at": "2026-05-31T00:00:00.000Z",
      "summary": "ASL Pilot runtime artifacts must use project-trained scratch models only and must not bundle ASL Citizen raw media, extracted frames, crops, landmarks, feature caches, pretrained ASL/CV/landmark models, or source-derived supervision artifacts.",
      "supports_decision": true
    },
    {
      "evidence_type": "commercial_contact_instruction",
      "url": "https://www.microsoft.com/en-us/research/project/asl-citizen/",
      "checked_at": "2026-05-31T00:00:00.000Z",
      "summary": "The ASL Citizen project page directs commercial-use inquiries to ASL_Citizen@microsoft.com; the same address should be used to confirm whether noncommercial academic weight distribution is permitted.",
      "supports_decision": true
    }
  ],
  "restrictions": [
    "use is limited to noncommercial, non-revenue-generating academic research unless Microsoft grants broader rights in writing",
    "raw videos, modified videos, extracted frames, crops, local mirrors, substantial dataset excerpts, and dataset-derived metadata must not be redistributed",
    "offline-derived labels, landmarks, features, and manifests are local-only supervision/provenance artifacts and must not be bundled into browser/runtime artifacts",
    "trained weights that use ASL Citizen videos, labels, or offline-derived labels are blocked from browser/runtime distribution until Microsoft confirms permission in writing",
    "runtime/pilot artifacts must be trained from project code from scratch and must not include pretrained ASL Citizen baselines or third-party pose, landmark, feature, or recognition models",
    "personal-data-bearing local files must remain confidential and be destroyed when the approved research period ends unless a fresh written review authorizes retention",
    "commercial or revenue-generating use requires contacting ASL_Citizen@microsoft.com and receiving separate authorization"
  ]
}
```
