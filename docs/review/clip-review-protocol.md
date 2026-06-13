# Clip QA Protocol

Every collected training clip must pass QA before manifest export. This is
separate from vocabulary-list source curation: the QA reviewer is checking that
the raw video actually matches the prompted ASL vocabulary label under the
controlled pilot capture conditions. The source-aligned completion path does not
claim external reviewer approval.

## Workflow

Export a packet from the current local collection store:

```sh
node scripts/export_clip_review_packet.mjs
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
- every clip either `approved: true` or `approved: false` with a non-empty
  `rejection_reason`
- every clip `corrected_vocabulary_id` matching the current `vocabulary_id`

If a clip is mislabeled, unclear, badly framed, or otherwise unsuitable, do not
approve it. Set `approved: false`, record a concrete `rejection_reason`, and
recapture that signer/label assignment instead of correcting the label in place.
Each clip row includes the collection-plan assignment key and hash-pinned
assignment snapshot plus the server-captured `capture_condition` record. Do not
edit those fields; if the assignment or controlled-condition attestation is
wrong, reject the row and recapture from the reviewed plan.
Rejected clips remain in local provenance but are excluded from dataset
readiness counts and final manifest export.

Optional stronger external review remains available: use `status: "reviewed"`
only when a real external reviewer completed the packet, then stage the signed
reviewer receipt and trusted reviewer authority before import.

Validate without writing:

```sh
node scripts/import_clip_review.mjs --input data/clip-review/asl-pilot-clip-review.json --dry-run
```

Import the completed review:

```sh
node scripts/import_clip_review.mjs --input data/clip-review/asl-pilot-clip-review.json
```

Audit current review state:

```sh
node scripts/audit_clip_review.mjs
```

The dataset readiness audit and manifest exporter fail until every collected
clip is either approved or explicitly rejected. Only approved clips count toward
the final coverage targets and exported manifests.
