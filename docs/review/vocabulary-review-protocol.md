# Vocabulary Review Protocol

The 83 ASL 1 prompts and coaching hints are not final until a qualified ASL instructor or Deaf educator reviews them.

## Export A Review Packet

```sh
node scripts/export_vocabulary_review_packet.mjs
```

The packet is written to `data/vocabulary-review/asl-pilot-vocabulary-review.json` by default. It includes every vocabulary item, coaching hint, hint category, and blank reviewer fields.

For a reviewer-friendly reading copy, generate the workbook:

```sh
node scripts/export_vocabulary_review_workbook.mjs
```

The workbook is written to `docs/review/vocabulary-review-workbook.md`. It is
not final evidence by itself; reviewer corrections and approvals must still be
entered into the canonical JSON packet before import.

## Prepare A Reviewer Bundle

```sh
node scripts/prepare_vocabulary_review_bundle.mjs
```

The bundle is written to
`output/review-handoff/vocabulary-review-bundle/`. It contains the canonical
JSON packet, reviewer receipt template, reviewer authority template, workbook,
protocol, source context, `REVIEW_REQUEST.md`, reviewer README,
`REVIEW_STATUS.json`, and hash manifest. The reviewer should edit and return
`asl-pilot-vocabulary-review.json` plus a matching signed receipt saved as
`asl-pilot-vocabulary-reviewer-receipt.json`; the generated bundle is a handoff aid, not
final review evidence. It is send-ready only when `MANIFEST.json` status is
`ready_for_external_reviewer`; if the trusted reviewer authority record is
missing or invalid, the bundle is draft-only and must not be sent.
`node scripts/audit_vocabulary_review_bundle.mjs --allow-draft` can check draft
freshness, but the default audit intentionally fails for
`draft_missing_reviewer_authority` and is the send-ready gate.
`REVIEW_STATUS.json` is a read-only snapshot of the current packet blockers at
bundle-generation time.

## Reviewer Instructions

The reviewer should:

- confirm each item is appropriate for beginner ASL 1 practice;
- correct the display label, prompt, coaching hint, category, or hint kind when needed;
- set `reviewStatus` to `reviewed`;
- set `approved` to `true`;
- set every `hintReview` checkbox to `true` only after checking that the coaching hint is beginner-appropriate, ASL-appropriate, aligned with `hintKind`, and free of unmeasured attempt-diagnosis claims;
- fill `reviewer.name`, `reviewer.role`, `reviewer.qualification`, `reviewer.affiliation_or_context`, `reviewer.contact_or_signed_evidence`, `reviewer.is_project_operator: false`, and `reviewer.reviewed_at` as a full non-future ISO timestamp with timezone;
- sign and return `asl-pilot-vocabulary-reviewer-receipt.json` with Ed25519 `signature_evidence` that binds the reviewer, reviewed packet hash, vocabulary source hash, approved item IDs, and hint-review fields;
- leave notes for regional variation, questionable signs, or signs that should be replaced before collection.

## Draft Or Sign The Reviewer Receipt

After the reviewer completes the canonical JSON packet, generate the receipt
payload from the project root only if the reviewer needs an unsigned payload to
sign:

```sh
node scripts/draft_vocabulary_reviewer_receipt.mjs \
  --input data/vocabulary-review/asl-pilot-vocabulary-review.json \
  --output data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json \
  --write
```

This fills the reviewed packet hash, vocabulary hash, approved item IDs,
hint-review fields, and canonical payload SHA-256 without importing evidence.
Without a private key it is an unsigned draft for reviewer signature only; do
not run final `--apply` import from this draft.
If the reviewer signs locally, keep the private key outside the repository and
run:

```sh
node scripts/draft_vocabulary_reviewer_receipt.mjs \
  --input data/vocabulary-review/asl-pilot-vocabulary-review.json \
  --output data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json \
  --private-key /path/to/reviewer-ed25519-private-key.pem \
  --write \
  --force \
  --verify
```

If the reviewer cannot run repo-local scripts, stage the returned completed
packet at `data/vocabulary-review/asl-pilot-vocabulary-review.json` and run:

```sh
node scripts/prepare_vocabulary_review_signature_request.mjs
```

Send the generated
`output/review-handoff/vocabulary-review-signature-request/` folder back to the
reviewer. It contains the computed unsigned receipt and canonical payload text
to sign; it still is not final evidence until the reviewer returns the signed
receipt.

Before sending the external review request, stage a trusted reviewer key record at
`data/vocabulary-review/asl-pilot-reviewer-authority.json` using
`docs/review/vocabulary-reviewer-authority.template.json`. Its reviewer identity
and Ed25519 key fingerprint must later match the returned packet and signed
receipt. `scripts/prepare_vocabulary_review_signature_request.mjs` also refuses
to produce a signing request until that authority record validates.
Use `docs/review/vocabulary-reviewer-authority-intake.template.json` with
`node scripts/prepare_vocabulary_reviewer_authority_from_intake.mjs --help` to
build and validate a candidate authority record from the real reviewer identity,
hash-pinned credential evidence files, hash-pinned key-binding evidence files,
hash-pinned operator trust-attestation evidence files, and Ed25519 key before
canonical staging. Copy those evidence files into ignored
`data/vocabulary-review/evidence/` first.
Compute the exact `trusted_key` fields from the reviewer's Ed25519 public key
with:

```sh
node scripts/compute_ed25519_public_key_fingerprint.mjs \
  --public-key /path/to/reviewer-ed25519-public-key.pem \
  --format trusted-key
```

## Import A Completed Review

Use the preferred wrapper path first:

```sh
cp /path/to/returned/asl-pilot-vocabulary-review.json \
  data/vocabulary-review/asl-pilot-vocabulary-review.json

cp /path/to/returned/asl-pilot-vocabulary-reviewer-receipt.json \
  data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json

node scripts/report_vocabulary_review_status.mjs \
  --input data/vocabulary-review/asl-pilot-vocabulary-review.json

node scripts/process_returned_vocabulary_review.mjs \
  --input data/vocabulary-review/asl-pilot-vocabulary-review.json

node scripts/process_returned_vocabulary_review.mjs \
  --input data/vocabulary-review/asl-pilot-vocabulary-review.json \
  --apply
```

The wrapper dry-runs the same import validation, then, with `--apply`, imports
final review evidence, regenerates `data/dataset/collection-plan.json`, writes
`output/collection-handoff/collection-session-bundle/`, and runs the reviewed
collection-plan launch gates.
For read-only status checks, `--reviewer-receipt` may point at a candidate file
and `--reviewer-authority` may point at a candidate trusted reviewer key record.
For final import, copy the returned packet and signed receipt to
`data/vocabulary-review/asl-pilot-vocabulary-review.json` and
`data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json`, and stage
the trusted reviewer key record at
`data/vocabulary-review/asl-pilot-reviewer-authority.json`; final evidence is
not accepted from noncanonical paths.

For focused debugging, the lower-level import commands are:

```sh

node scripts/import_vocabulary_review.mjs \
  --input data/vocabulary-review/asl-pilot-vocabulary-review.json \
  --dry-run

node scripts/import_vocabulary_review.mjs \
  --input data/vocabulary-review/asl-pilot-vocabulary-review.json
```

The import validates that all 75-100 items are approved, the item IDs still match the source order, the reviewer is a qualified ASL instructor or Deaf educator, reviewer identity/contact/independence fields are filled, `reviewer.reviewed_at` is a full non-future ISO timestamp with timezone, and `data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json` contains machine-verifiable Ed25519 `signature_evidence` binding the reviewer to the returned packet. A non-dry-run import updates `web/src/lib/vocabulary.ts` and writes `docs/review/final-vocabulary-review.json`.
The final evidence must retain the importer receipt plus the returned packet's
path and SHA-256; hand-authored final evidence is not accepted by the audit.

For the final post-import audits, run:

```sh
node scripts/audit_vocabulary_review.mjs
node scripts/audit_hint_pedagogy_review.mjs
```

## Audit

```sh
node scripts/audit_vocabulary_review.mjs
```

This audit fails until the source no longer contains `needs_deaf_educator_review`, the final review evidence hash matches the current vocabulary source, and the evidence reopens the hash-pinned returned packet plus importer receipt.
