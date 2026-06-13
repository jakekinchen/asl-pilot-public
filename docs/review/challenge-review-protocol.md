# Negative Challenge QA Protocol

Reject-only challenge clips are separate from labeled ASL vocabulary clips. They
represent conditions that should not pass for any prompted sign, such as empty
camera, no hands visible, low light, or off-center framing.

Export a packet from the current local collection store:

```sh
node scripts/export_challenge_review_packet.mjs
```

The QA reviewer fills:

- `status: "qa_completed"`
- `evidence_mode: "source_curated_operator_qa"`
- `external_review.claimed: false`
- `reviewer.name`
- `reviewer.role`
- `reviewer.qualification`
- `reviewer.affiliation_or_context`
- `reviewer.contact_or_signed_evidence`
- `reviewer.is_project_operator`
- `reviewer.reviewed_at`
- each clip either `approved: true` or `approved: false` with a non-empty
  `rejection_reason`

Approve a challenge clip only when the raw video matches the recorded
`challenge_type`, should be rejected by prompted-sign evaluation, and came from
the documented explicit-consent challenge capture flow.
If the clip does not meet that bar, set `approved: false`, record a concrete
`rejection_reason`, and recapture the challenge assignment. Rejected challenge
rows preserve the collection-plan assignment evidence but are excluded from final
manifest counts. Do not edit the assignment key or snapshot in the review packet;
if the assignment or `capture_condition` challenge-type attestation does not
match the video, reject and recapture it.
Rejected clips remain in local provenance but are excluded from dataset readiness
counts and final manifest export.

Optional stronger external review remains available: use `status: "reviewed"`
only when a real external reviewer completed the packet, then stage the signed
reviewer receipt and trusted reviewer authority before import.

Dry-run the import:

```sh
node scripts/import_challenge_review.mjs --input data/clip-review/asl-pilot-negative-challenge-review.json --dry-run
```

Import the completed review:

```sh
node scripts/import_challenge_review.mjs --input data/clip-review/asl-pilot-negative-challenge-review.json
```

Audit current review state:

```sh
node scripts/audit_challenge_review.mjs
```

The dataset readiness audit and manifest exporter fail until every collected
negative challenge clip is either approved or explicitly rejected. Only approved
challenge clips count toward the requirement for at least five valid clips per
required challenge type.
