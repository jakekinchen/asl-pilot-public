# Vocabulary Reviewer-Chain Runbook

Operator-facing runbook for the canonical-source → source-curated evidence → optional external Ed25519-signed reviewer-authority chain that backs `web/src/lib/vocabulary.ts`. Anchored to [`#arch-active-module`](../../ARCHITECTURE.md#arch-active-module), [`#arch-vocab-hints`](../../ARCHITECTURE.md#arch-vocab-hints), and [`#arch-data-provenance`](../../ARCHITECTURE.md#arch-data-provenance).

## Chain at a glance

```text
                       (TypeScript source)
                                |
                                v
              web/src/lib/vocabulary.ts   ──── 100 items, each:
              { id, label, category, prompt,        id (snake_case)
                coachingHint, hintKind,             label (display text)
                reviewStatus }                       coachingHint (>= 24 chars,
                                |                    non-diagnostic)
                                v
              web/src/lib/sign-hint-metadata.json   structured per-dimension cues
              ($schema_version v1, items{id: …})    for the hint engine (>= 10 signs)
                                |
                                v   scripts/promote_source_curated_vocabulary.mjs --write
                                |
                                v
              docs/review/final-vocabulary-review.json
              (status = "source_curated", evidence_mode =
               "source_curated_no_external_review")
                                |
                                v
              audit_vocabulary_review.mjs              ── source-curated gate
              audit_hint_pedagogy_review.mjs           ── per-item hint + dimension + REASON_COPY gate
              audit_downstream_vocabulary_provenance   ── eight downstream contracts gate
              audit_source_register.mjs                ── source-materials hash gate

                       (optional, post-pilot)
                                |
                                v
              data/vocabulary-review/asl-pilot-vocabulary-review.json   external review packet
              data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json   Ed25519-signed receipt
              data/vocabulary-review/asl-pilot-reviewer-authority.json          trusted-key record
                                |
                                v
              scripts/import_vocabulary_review.mjs --write
                                |
                                v
              docs/review/final-vocabulary-review.json
              (status = "reviewed", evidence_mode embedded in the signed packet)
```

The current pilot operates in the **source_curated** path. External Ed25519 review is set up but not yet exercised — that's an explicit downscope acknowledged in `final-vocabulary-review.json` under `external_review.required_for_source_aligned_pilot: false`.

## Operator workflow 1 — Add or edit a vocabulary item

1. **Edit `web/src/lib/vocabulary.ts`.** Append a row to the `VOCABULARY_SEEDS` array following the existing tuple shape: `["id", "Label", "category", "Sign LABEL.", "Coaching hint sentence (>= 24 chars).", "hintKind"]`. The parser regex in [`scripts/vocabulary_review_utils.mjs`](../../scripts/vocabulary_review_utils.mjs) is strict — 6 quoted strings exactly, in that order.

2. **Optionally add structured hint metadata.** Edit [`web/src/lib/sign-hint-metadata.json`](../../web/src/lib/sign-hint-metadata.json) and add a new entry under `items` keyed by the new id. Each dimension (`handshape`, `movement`, `location`, `orientation`, `timing`, `framing`) is optional but at least one must be populated and >= 10 chars to count toward the audit's 10-entry minimum.

3. **Regenerate the source-curated evidence.**
   ```sh
   node scripts/promote_source_curated_vocabulary.mjs --write
   ```
   This re-parses vocabulary.ts, recomputes `vocabulary_source.sha256`, rebuilds the items array in `docs/review/final-vocabulary-review.json`, and writes the new evidence packet. The promote script will refuse if vocabulary.ts contains the `needs_deaf_educator_review` marker — items must read `reviewStatus: "source_curated"` for the pilot path.

4. **Run the gating audits.**
   ```sh
   node scripts/audit_vocabulary_review.mjs              # source-curated gate
   node scripts/audit_hint_pedagogy_review.mjs           # 100 items + >=10 metadata + REASON_COPY
   node scripts/audit_downstream_vocabulary_provenance.mjs   # 9 downstream contracts
   node scripts/audit_source_register.mjs                # source-materials hash gate
   ```
   All four must exit 0.

5. **Run the no-regression chain that consumes the vocabulary.**
   ```sh
   npm --prefix web run lint
   npm --prefix web run typecheck
   npm --prefix web run build
   node scripts/run_browser_onnx_wiring_smoke.mjs --write && node scripts/audit_browser_onnx_wiring_smoke.mjs
   node scripts/run_practice_progress_smoke.mjs --write && node scripts/audit_practice_progress_smoke.mjs
   node scripts/run_practice_camera_behavior_smoke.mjs --write && node scripts/audit_practice_camera_behavior_smoke.mjs
   ```

6. **Commit.** Stage `web/src/lib/vocabulary.ts`, `web/src/lib/sign-hint-metadata.json` (if changed), `docs/review/final-vocabulary-review.json`, and the refreshed smoke artifacts. Standard heredoc template per [`docs/autonomous-orchestrator-protocol.md`](../autonomous-orchestrator-protocol.md).

## Operator workflow 2 — Commission external review

External review is the stronger evidence path. The reviewer must be a Deaf educator OR a qualified ASL instructor (per [`scripts/vocabulary_review_utils.mjs`](../../scripts/vocabulary_review_utils.mjs) `validateReviewer`'s `requireAslQualification` flag), and the chain is bound by Ed25519 signatures.

1. **Generate the review packet.** The operator builds a packet at `data/vocabulary-review/asl-pilot-vocabulary-review.json` capturing the reviewer's identity, qualification, contact/credential evidence, reviewed_at timestamp, the canonical vocabulary source-of-truth path + sha256, and a per-item record (approved, hint review booleans, notes).

2. **Pre-review authority record.** Before the reviewer signs, write `data/vocabulary-review/asl-pilot-reviewer-authority.json` with `status: trusted_reviewer_key`, the reviewer's Ed25519 public key (PEM), the SHA-256 fingerprint of that public key, identity fields matching the packet, `trusted_by` block (a project operator distinct from the reviewer), credential + key-binding evidence file references (hash-pinned, stored under `data/vocabulary-review/evidence/`), and `pre_review_key_binding_confirmed: true`. The Ed25519 binding must be confirmed BEFORE the reviewer signs — this is the project's defense against post-hoc key substitution.

3. **Reviewer signs.** Out-of-band the reviewer signs the canonical packet payload (see `canonicalVocabularyReviewerReceiptPayload` in `vocabulary_review_utils.mjs` — the payload is JSON-canonicalized via `stableJson`). The receipt at `data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json` contains the signed payload + `signature_evidence` block (algorithm, public_key_pem, signer_key_fingerprint_sha256, signature_b64).

4. **Import the signed receipt.**
   ```sh
   node scripts/import_vocabulary_review.mjs --write
   ```
   This validates the Ed25519 signature, cross-checks the receipt against the packet (item ids, hint-review fields, vocabulary_source.sha256 all match), validates the authority record (key fingerprint matches both receipt and authority, reviewer identity matches across packet+receipt+authority, etc.), and writes the consolidated `docs/review/final-vocabulary-review.json` with `status: reviewed`, embedded `source_packet`/`reviewer_signed_receipt`/`reviewer_authority` hash-pinned references.

5. **Run the same gating audits as workflow 1 step 4.** The audit chain auto-detects whether the evidence is `source_curated` or `reviewed` and validates accordingly.

## Audit chain — what each script enforces

| audit | gates | rejects |
|---|---|---|
| [`scripts/audit_vocabulary_review.mjs`](../../scripts/audit_vocabulary_review.mjs) | source-curated or reviewed evidence | stale `vocabulary_source.sha256`, missing `needs_deaf_educator_review` cleanup, fewer than 75 items |
| [`scripts/audit_hint_pedagogy_review.mjs`](../../scripts/audit_hint_pedagogy_review.mjs) | per-item `coachingHint`/`hintKind`/`hintReview` + structured `sign-hint-metadata.json` (>=10 entries, allowed dimensions, no diagnostic language) + `REASON_COPY` in `PracticeApp.tsx` (8 typed reasons, no diagnostic language) | "wrong", "incorrect", "you did X", "your handshape was Y", etc. |
| [`scripts/audit_downstream_vocabulary_provenance.mjs`](../../scripts/audit_downstream_vocabulary_provenance.mjs) | 9 downstream contracts: export_dataset_manifests, decode_raw_videos, train_rawframe_model, evaluate_rawframe_model, export_onnx_model, promote_trained_model_card, audit_model_artifacts, active_vocabulary_claim, active_sign_modules_example all bind to vocabulary review evidence | rawframe lane drift from vocabulary review chain; lane != rawframe; stale modelVersion |
| [`scripts/audit_source_register.mjs`](../../scripts/audit_source_register.mjs) | `docs/source-materials/*` source-rights provenance | unhashed source files |

## Failure modes (from past observer + slice findings)

| symptom | root cause | fix |
|---|---|---|
| `vocabulary_review.evidence.sha256 mismatch` from `audit_downstream_vocabulary_provenance.mjs` | vocabulary.ts was edited but `promote_source_curated_vocabulary.mjs --write` was not re-run (or downstream manifests were not refreshed against the new evidence hash) | re-run promote, then refresh downstream manifests (see [`docs/session-logs/006-mission-2-task-006-brev-scripts.md`](../session-logs/006-mission-2-task-006-brev-scripts.md) slice 5 for the same situation in collection-plan freshness) |
| `Hint pedagogy review audit failed: items[N].coachingHint must be targeted, not only generic incorrect feedback` | coaching hint contains "incorrect" / "wrong" / "try again" / similar diagnostic markers | rewrite the hint descriptively — what the canonical sign looks like, not what the learner did wrong (see [`docs/session-logs/022-mission-3f-reason-copy-audit.md`](../session-logs/022-mission-3f-reason-copy-audit.md) for the same pattern applied to `REASON_COPY`) |
| `Structured hint metadata must populate >= 10 vocabulary entries` | `sign-hint-metadata.json` has fewer than 10 items with at least one populated dimension | add more entries OR raise individual dimension cues to >= 10 chars |
| `REASON_COPY is missing required PassFailReason key 'X'` | A new `PassFailReason` enum value was added to `pass-fail-decision.ts` but `REASON_COPY` in `PracticeApp.tsx` wasn't updated | add a non-diagnostic user-facing string for the new reason |
| `Reviewer authority record .pre_review_key_binding_confirmed must be true` | external reviewer's key was bound AFTER the review packet was signed (substitution risk) | re-bind key before re-signing; never accept a key bound post-hoc |

## Coverage gap report

Get a per-category breakdown of which vocabulary items still lack structured `SIGN_HINT_METADATA`:

```sh
node scripts/list_hint_metadata_gaps.mjs           # human-readable
node scripts/list_hint_metadata_gaps.mjs --json    # machine-readable
```

At HEAD: 19 / 100 covered (19%). Letter-handshape signs are all done (B/G/Y colors, A/U relatives, W water); the remaining 81 items need ASL-reviewer-grade canonical form judgement and are NOT auto-generated.

## What this runbook is NOT

- Not a substitute for actual qualified ASL review when external review becomes available.
- Not a path for hand-editing `docs/review/final-vocabulary-review.json` — always re-promote.
- Not a runbook for the `web/public/model/model-card.json` chain — see [`scripts/promote_trained_model_card.mjs`](../../scripts/promote_trained_model_card.mjs) and the relevant ARCHITECTURE.md anchors instead.
- Not a runbook for first-party clip collection — that's [`docs/runbooks/first-party-collection.md`](first-party-collection.md).
