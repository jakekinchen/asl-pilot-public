# Collection-Day Checklist

Printable one-pager for the operator running a first-party signer-collection session. Full step-by-step commands live in [`docs/runbooks/first-party-collection.md`](../runbooks/first-party-collection.md); this is the at-the-bench tickbox version.

```
Date: ____________     Operator: ____________     Session ID: ____________
```

## Pre-session (yesterday or morning-of)

- [ ] Repo is at a known-green commit: `bash scripts/preflight.sh` → 15/15 OK.
- [ ] Storage budget OK: `bash scripts/storage_budget_check.sh` exits 0.
- [ ] Local ML environment receipt fresh: `./.venv/bin/python scripts/audit_local_ml_environment.py --write-report docs/validation/local-ml-environment.json --report docs/validation/local-ml-environment.json` exits 0.
- [ ] Collection plan regenerated against current vocabulary: `node scripts/plan_dataset_collection.mjs --output data/dataset/collection-plan.json` + `node scripts/audit_collection_plan_contract.mjs` + `node scripts/audit_collection_plan_freshness.mjs` all exit 0.
- [ ] Session bundle prepared: `node scripts/prepare_collection_session_bundle.mjs` exits 0.
- [ ] Signed paper consent forms printed (`docs/privacy/dataset-consent-form.md` → one signed copy per signer).
- [ ] Reviewer-authority chain warm: ID `docs/review/final-vocabulary-review.json` is `source_curated` (or `reviewed` if external-review path is live).
- [ ] Camera + tripod + lighting at the recording station.
- [ ] Backup storage for raw clips: external SSD or equivalent, NOT cloud-synced.

## Build the app in collection mode (once per device per session day)

```sh
NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true \
ENABLE_DATASET_COLLECTION=true \
  npm --prefix web run build
```

- [ ] Build exits 0.
- [ ] Note for end-of-day: a plain `npm --prefix web run build` restores the safe-posture artifact.

## Per signer

```
Signer alias: ____________   (must match an alias in the collection plan)
Signed consent on file? (Y/N): ____   Identity evidence file path: ____________
```

- [ ] `node scripts/import_signer_identity_evidence.mjs --input data/signer-identity/<signer>-identity-evidence.json --write` exits 0.
- [ ] App opened with collection-mode env vars: `ASL_PILOT_AUTH_PROVIDER=local ASL_PILOT_STORE_PATH=data/asl-pilot-store.json ASL_PILOT_DATASET_CLIP_ROOT=data/dataset/clips ASL_PILOT_COLLECTION_PLAN_PATH=data/dataset/collection-plan.json ENABLE_DATASET_COLLECTION=true NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true npm --prefix web start`.
- [ ] Operator signed in (operator account, not the signer's).
- [ ] Signer selected from the plan picker.
- [ ] Each prompt × split assignment captured.
- [ ] Each negative-challenge assignment captured.
- [ ] All clips show `pending` review status — none auto-approved.

```
Vocabulary clips captured:    ____ / planned ____    Skipped: ____
Negative-challenge captured:  ____ / planned ____    Skipped: ____
Failures (alias + reason):    ____________
```

## After each signer (or end of day)

- [ ] Process the in-flight bundle: `node scripts/process_collected_dataset_evidence.mjs --write` exits 0.
- [ ] Bundle audit: `node scripts/audit_collection_session_bundle.mjs` exits 0.
- [ ] Coverage audit: `node scripts/audit_dataset_coverage_contract.mjs` exits 0.

## Consent receipts + clip review

```
Per signer:
  Signed consent receipt drafted?  (Y/N): ____    Path: data/dataset/consent-receipts/____.json
  Post-collection review receipt?  (Y/N): ____    Path: data/dataset/review-receipts/____.json
```

- [ ] `node scripts/draft_signed_consent_receipt.mjs --signer <alias> --output ...` exits 0 per signer.
- [ ] Reviewer marks each clip approved/rejected (in-app review surface or local store edits).
- [ ] `node scripts/draft_post_collection_review_receipt.mjs --signer <alias> --output ...` exits 0.
- [ ] `node scripts/audit_post_collection_evidence_status.mjs` exits 0.

## Bail-out — incomplete signer

If a signer can't complete (technical, withdrew, unavailable, identity-fail):

- [ ] Append to `data/dataset/signer-failures.log` (gitignored): `<iso> | <alias> | <reason> | <recovery_plan>`.
- [ ] Continue with remaining signers. Do NOT block the roster.
- [ ] If gate threshold (>=12 train / >=4 validation / >=4 test signers) drops below limit, re-plan after the session.

## Export approved-only manifests (post-session)

```
Date: ____________
```

- [ ] `node scripts/export_dataset_manifests.mjs --output data/manifests` exits 0.
- [ ] Final manifests audit: `./.venv/bin/python scripts/audit_final_manifests.py --write-report docs/validation/final-manifest-audit.json` exits 0.
- [ ] Decode replay verifies: `./.venv/bin/python scripts/decode_raw_videos.py --manifest data/manifests/train.json --manifest data/manifests/validation.json --manifest data/manifests/test.json --manifest data/manifests/negative-challenge.json --tensor-root data/tensors --verify-only` exits 0.
- [ ] **Mission 3 acceptance #2 met.** Ready to launch Brev training (mission 3 acceptance #3).

## Restore safe-posture build (end of session)

- [ ] `npm --prefix web run build` (no flags) exits 0. The default-safe artifact replaces the collection-mode one.

## End-of-day commit

- [ ] `bash scripts/preflight.sh` exits 0.
- [ ] Commit any changes to durable docs (manifests, audit reports, session log). Raw signer clips, identity evidence, and consent receipts stay UNCOMMITTED (gitignored).
- [ ] `git status` shows no surprises.
- [ ] Notify next-shift operator OR write a session-log entry under `docs/session-logs/` for autonomous-loop resumption.

```
Signed off by: ____________   Time: ____________
```
