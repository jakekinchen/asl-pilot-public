# Web Avatar Progress

## 2026-05-31

- Slice: P1 one-word reference-avatar playback in `/lesson`.
- Added raw Three.js `ReferenceAvatar3D` with dynamic `three` import, WebGL fallback, resize handling, scene disposal, clip interpolation, mirrored playback, and slow-motion wrist ghost trails.
- Replaced the lesson robot timing scaffold with reference-avatar loading and controls for play/pause, restart, loop, 1x/0.5x speed, and mirror.
- Authored `please` as the first static `asl-pilot-reference-avatar-clip/v1` JSON clip from the read-only PopSign source clip using offline MediaPipe Holistic through the annotator virtualenv. The shipped browser runtime uses only static JSON and does not import MediaPipe.
- Added a one-clip avatar manifest as the P2 seed: `clipCount` is 1, total avatar clip JSON is 52,536 bytes, and all-95 P2 authoring remains incomplete.
- Verification: `cd web && npm install` because `node_modules` was missing, then `npm run typecheck` passed. A JSON schema smoke check also passed for the authored `please` clip.
- Next slice: run/extend the authoring pipeline for all 95 vocabulary words, complete label-id normalization for research/web id differences, flag weak or ambiguous signs, and replace the seed manifest with the full reviewed manifest.

## 2026-05-31 P2 content-authoring slice

- Slice: P2 offline reference-avatar content scale-out for the 95 source-backed PopSign vocabulary labels.
- Extended `scripts/build_avatar_clip.py` from one-clip output to a batch authoring pipeline that reads the web vocabulary, normalizes web ids to research/source labels (`thank_you` -> `thankyou`, `tv` -> `TV`, `call_on_phone` -> `callonphone`), scores two deterministic source candidates per word with offline MediaPipe Holistic, writes `asl-pilot-reference-avatar-clip/v1` JSON, and fails if the avatar content exceeds 8 MiB.
- Generated 95 clip JSON files under `web/public/avatar/clips/` from the read-only PopSign source tree. Total uncompressed clip JSON is 5,140,220 bytes, under the 8,388,608 byte content budget.
- Replaced `web/public/avatar/manifest.json` with a full manifest: `clipCount` 95, `webVocabularyCount` 100, `sourceBackedVocabularyCount` 95, excluded web-only ids `help`, `stop`, `finish`, `school`, and `plus`, and 21 weak/ambiguous clips flagged for follow-up content review.
- Updated the browser model bundle authored-avatar demo gate to point to `/avatar/manifest.json` with `reviewed_clip_count` 95 while leaving recognition, Detector 0 tracking, and box-driven avatar authority disabled.
- Verification: batch authoring command completed; Node schema/track/byte-count validation passed with 95 clips and 5,140,220 bytes; `/Users/kelly/Developer/asl-pilot-annotator/.labelvenv/bin/python -m py_compile scripts/build_avatar_clip.py` passed; `cd web && npm run typecheck` passed.
- Next slice: P3 split-view live tracking overlay after the runtime tracking models are authorized/available; before final ship, prioritize human ASL content review of the manifest's `weakOrAmbiguousSigns`.

## 2026-05-31 P3 live tracking overlay slice

- Slice: P3 live hand/head/body skeleton overlay on the `/lesson` camera, beside the demonstrating avatar — the "skeleton that follows my hands" goal.
- Ported the verified web-pilot inference (`tools/detector0-annotator/web-pilot/pipeline.js`) to TypeScript in `web/src/lib/live-tracker.ts` (`HandPoseTracker` + `drawTracking`): reuses the region detector (`detector0-grid-big2`) + hand-landmark model (`detector0-hand-landmarks-merged-w64`), the cv2.INTER_AREA-parity area resample, the 5-channel CoordConv input tensor, and soft-argmax decode. Added EMA smoothing (alpha 0.4) on landmarks + region boxes to cut per-frame jitter.
- `web/src/lib/use-live-tracker.ts`: throttled requestAnimationFrame loop (~12 fps), single-flight (no overlapping inference), loads models on enable, clears+resets on disable, disposes sessions on unmount.
- `CameraViewport` gained an optional `overlayCanvasRef`; `globals.css` `.camera-track-overlay` shares the video's `object-fit:cover` + `transform:scaleX(-1)` so the skeleton aligns with the mirrored, cover-cropped frame (canvas bitmap sized to the video's intrinsic resolution).
- `LessonApp`: "Show tracking" toggle (enabled only when the camera is ready) + preview status note. Models served from `web/public/tracking/` (NOT the promoted `public/model/` lane); visual preview only — does not touch the model-card or recognition pass/fail gate. #arch-no-pretrained runtime preserved (only our trained ONNX runs in-browser).
- Verification: `cd web && npm run typecheck` passed, `npx eslint` clean on the changed files, `npm run build` succeeded with `/lesson` prerendering. NOT validated against a live webcam — alignment/accuracy need in-person testing.
- Next slice: in-person webcam testing to tune presence threshold / smoothing / crop; then optionally P4 (compare user landmarks vs the avatar reference for feedback). Live tracking accuracy is bounded by the ~0.76 landmark model + region-crop quality + domain shift (see annotator `CODEX-LOOP-PROGRESS.md` M1 decision).
