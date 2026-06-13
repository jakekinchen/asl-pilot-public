# Privacy Documentation

## Default Practice Behavior

Raw camera video is processed locally in the browser during normal practice. The application uses `getUserMedia()` to show a live camera preview and samples frames into an in-browser model runner. Raw frames, still images, and video clips are not uploaded to the server by the normal practice flow.

## Data Sent To The Server

The app sends only attempt metadata:

- vocabulary item ID
- pass/fail outcome
- model confidence
- predicted label ID
- targeted hint text
- timestamp

The server stores learner account records, session records, and progress/attempt history.

## Retention And Deletion

Learner account and attempt metadata should be retained only for the pilot period unless the learner explicitly agrees to longer retention. The pilot must include an operator process for exporting or deleting a learner's account and attempt metadata on request.

The practice page must not include analytics, session replay, remote logging of camera frames, or third-party scripts that can observe camera-derived frame data.

Final privacy smoke evidence is generated and audited with:

```sh
node scripts/run_final_privacy_smoke.mjs --app-url http://127.0.0.1:3025 --write
node scripts/audit_final_privacy_smoke.mjs
```

The final smoke report records the static raw-upload audit, live HTTP checks
for the normal practice page, a live `/api/attempts` raw-camera-payload
rejection, default-disabled dataset collection routes, common
analytics/session-replay host scan results, and hashes of the privacy-relevant
source files.

## Learner Export And Deletion Process

The local pilot includes an operator CLI for learner data requests:

```sh
node scripts/learner_data_admin.mjs export --email learner@example.com
node scripts/learner_data_admin.mjs delete --email learner@example.com --dry-run
node scripts/learner_data_admin.mjs delete --email learner@example.com --confirm-delete
```

Exports omit password hashes and session tokens. They include account metadata,
attempt history, consent records, and dataset clip metadata tied to the learner.
Deletion removes the learner account, sessions, attempts, consent records,
dataset clip records, and locally stored dataset clip files. Export/delete
actions append an operator audit record to `data/privacy-audit-log.jsonl`.

## Explicit Consent Boundary

Any future dataset collection mode must be separate from default practice and must require explicit learner consent before recording or uploading camera data. That mode must document:

- what is collected
- why it is collected
- where it is stored
- who can access it
- how long it is retained
- how the learner can withdraw or request deletion

The prototype now includes a separate dataset-capture panel, but both the panel and `/api/dataset/clips` are disabled by default. They should be enabled only during explicit-consent collection sessions with `ENABLE_DATASET_COLLECTION=true` and `NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true`. The marked flow uploads raw clips only after every consent field is checked. This is not the normal practice path, and the normal `/api/attempts` route continues to reject raw camera payloads.

The normal practice route stores metadata-only attempt history. It derives the active model id/status/threshold from `web/public/model/model-card.json` on the server side, so the current `not_trained` model card cannot be bypassed by a client that posts `passed: true` or `modelStatus: "trained"`.

Stored collection metadata must not retain persistent camera identifiers. The local store keeps coarse camera settings only: width, height, frame rate, facing mode, aspect ratio, and resize mode.

The explicit dataset-capture API requires:

- signer alias
- operator-issued signer registry entry
- consent form version and consent form hash
- age/eligibility confirmation
- permission for model training
- permission for validation/testing
- permission for pilot submission/use
- derived artifact retention acknowledgement
- de-identified metadata retention acknowledgement
- retention acknowledgement
- withdrawal acknowledgement

The consent text is versioned in `docs/privacy/dataset-consent-form.md`.

## Non-Goals

- No raw learner video upload by default.
- No server-side video inference as the default recognition path.
- No teacher dashboard, classroom roster, or SSO integration in this pilot.
