# Privacy and Video Handling

## default behavior

Raw learner video must not be uploaded during normal practice. Camera frames are processed locally in the browser and discarded after inference unless a future separate consented collection flow is built.

## allowed persistence

`PracticeAttempt` may store:

- learner id;
- session id;
- vocabulary item id/gloss;
- pass/fail/abstain decision;
- confidence summary and threshold version;
- model version;
- hint id shown;
- capture quality flags;
- timestamps;
- attempt number.

## forbidden persistence by default

- raw video files;
- image/frame blobs;
- base64 frame strings;
- remote video URLs;
- biometric templates not required for progress;
- hidden debug frame uploads.

## UI requirements

- Camera permission prompt is clear.
- Denied/unavailable/unsupported states are handled.
- Learner sees retry/next actions.
- Privacy copy says video is processed locally for normal practice.

## verification

Final privacy smoke report should include:

- browser network inspection during practice;
- persistence payload sample with no video/frame fields;
- code search for upload/fetch paths involving camera frames;
- note that future data collection requires explicit separate consent.
