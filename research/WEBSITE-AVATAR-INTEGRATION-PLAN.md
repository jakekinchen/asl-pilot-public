# Website Avatar Integration Plan

Status: set in stone for the website/avatar planning lane. This document
authorizes no builds, no installs, no training, no model promotion, no Brev
spend, and no source import by itself.

## 0. Goals & Purpose

### Purpose

Build a web practice experience where a 3D avatar performs the target ASL sign
as the reference demonstration, shown alongside the user's live webcam with the
user's tracked skeleton overlaid from our from-scratch browser models. The
learner flow is:

```text
watch the avatar -> copy it on camera -> get verified against the prompted sign
```

The avatar is the "here's how" reference. The user's webcam panel is the "try it"
surface. The recognizer is the "did you get it?" verifier.

### Goal

Ship this into the existing Next.js web app for the 95 beginner PopSign words
covered by the current detector/landmark/recognizer research stack. The shipped
experience is guided target verification, not open-vocabulary ASL recognition
and not sentence translation.

### Binding Constraints

- Runtime user tracking uses only our from-scratch models through
  `onnxruntime-web`, honoring `#arch-no-pretrained`.
- Runtime/browser code must not call MediaPipe, OpenPose, YOLO, MMPose, RTMW,
  pretrained backbones, pretrained embeddings, or any pretrained landmark/sign
  model.
- The avatar's reference animations are offline-authored lesson content. It is
  acceptable to author those animations offline from reference clips, including
  by using MediaPipe Holistic during content production, because the shipped
  browser runtime does not depend on that model and does not use it to track the
  learner.
- Normal learner practice uploads no raw learner video or raw frames. Camera
  frames stay in the browser. `/api/attempts` receives metadata only.
- The product claim stays narrow: guided beginner practice for isolated ASL
  vocabulary signs.

## 1. Grounded Website And Model Stack

The implementation target is the existing `web/` app, not a parallel prototype.

Verified website stack:

- `web/package.json` is Next.js `16.2.6`, React `19.2.4`, TypeScript,
  Tailwind 4, `three` `^0.184.0`, and `onnxruntime-web` `^1.26.0`.
- The app routes are App Router pages:
  - `/` -> `web/src/components/PracticeApp.tsx`.
  - `/lesson` -> `web/src/components/LessonApp.tsx`.
  - `/smoke/browser-onnx` -> browser ONNX smoke route.
- Camera UI already exists in `web/src/components/CameraViewport.tsx` and
  `web/src/lib/use-camera-capture.ts`.
- Practice, pass/fail, and persistence already exist in:
  - `web/src/components/PracticeApp.tsx`.
  - `web/src/lib/inference-engine.ts`.
  - `web/src/lib/pass-fail-decision.ts`.
  - `web/src/app/api/attempts/route.ts`.
- Same-origin ONNX Runtime WASM serving already exists at
  `web/src/app/api/ort/[file]/route.ts`, and `client-model.ts` already points
  `onnxruntime-web` at `/api/ort/`.
- Static model cards and bundles are already under `web/public/model/`,
  including `browser-model-bundle.json`.
- The current lesson route already has a fail-closed 3D scaffold:
  - `web/src/components/RobotMannequin3D.tsx`.
  - `web/src/lib/avatar-motion.ts`.
  - `web/src/lib/detector0-engine.ts`.
  - `web/src/lib/detector0-types.ts`.
- `web/vercel.json` already targets Vercel with `npm ci` and `npm run build`.

Verified research/runtime model stack:

- `research/PILOT-SUMMARY.md` defines the current academic stack:
  region detector -> signing-space crop -> scratch hand landmarks -> scratch
  BiGRU recognizer -> guided target verification over 95 beginner PopSign words.
- The current best guided product metric is target verification, not top-1
  classification. The locked summary reports the distilled recognizer at
  `0.715` recall@FAR10 and `0.569` recall@FAR5.
- `research/BUILD-PLAN-landmark-pose-stack.md` defines the next from-scratch
  tracker:
  `GridDetectorV2`, `HandLandmarkNetV2`, `BodyPoseNetV1`, `FaceHeadNetV1`, and
  a retrained guided-practice recognizer.
- `tools/detector0-annotator/web-pilot/pipeline.js` is the browser prototype
  to port. It already implements:
  - full-frame `96x96x5` coordconv preprocessing,
  - region decode over the `12x12` detector grid,
  - signing-space crop expansion,
  - `128x128x5` landmark crop preprocessing,
  - JS soft-argmax over hand heatmaps,
  - wrist-relative 90-D recognizer features,
  - `sequence` + `lengths` recognizer ONNX inputs,
  - target `tau` accept/reject.

## 2. Avatar Decision

### Set-In-Stone Path

Ship in two avatar layers:

1. **MVP avatar:** a Three.js landmark/skeleton avatar for hands, arms, torso,
   and head, driven directly by authored reference landmark/pose sequences.
2. **Target avatar:** a rigged upper-body glTF humanoid with articulated hands,
   driven by retargeted versions of the same authored reference sequences.

The MVP must ship first. The target rig replaces the renderer, not the lesson
content schema or product flow.

### Why This Path

ASL fidelity depends most on handshape, wrist orientation, hand location, and
timing. A landmark/skeleton avatar exposes those signals directly and can be
reviewed quickly for each word. A rigged humanoid is better for polish, but hand
retargeting is the hardest part and can consume the whole project if it becomes
the first milestone.

The existing repo already has raw `three` in production dependencies and a
vanilla Three.js `RobotMannequin3D` component. Do not add
`@react-three/fiber` for the MVP. Raw Three keeps the first integration small,
fits the current component style, and avoids a new rendering dependency while
the app is still fail-closed.

### MVP Renderer

Replace the current timing-only mannequin with a reference-driven component:

```text
web/src/components/ReferenceAvatar3D.tsx
web/src/lib/avatar-motion.ts
web/public/avatar/clips/*.json
web/public/avatar/manifest.json
```

`ReferenceAvatar3D` uses raw `three` and renders:

- head center and face/head orientation proxy,
- torso/chest and shoulder line,
- left/right shoulder, elbow, wrist,
- 21 left-hand landmarks and 21 right-hand landmarks,
- finger bones using the standard hand landmark edge list already mirrored in
  `web-pilot/pipeline.js`,
- optional ghost trail for recent wrist motion when slow motion is enabled.

It should reuse the disposal, resize, WebGL-support fallback, and dynamic import
patterns from `RobotMannequin3D.tsx`.

### Target Rig

The target rig format is binary glTF (`.glb`) loaded with Three.js `GLTFLoader`
from the `three/examples` package already available with `three`.

Authoritative rig source decision:

- Default source: a small in-repo Blender-authored upper-body-and-hands rig with
  a project-owned or CC0 license receipt. This avoids marketplace ambiguity and
  lets the finger skeleton match our landmark chains.
- External fallback: a CC0 or otherwise permissive rigged upper-body/hand model
  only after a source receipt records the primary license page, allowed use,
  attribution requirements, modification rights, redistribution rights, and
  trained/content-derivative implications.

The rig must have:

- wrist, elbow, shoulder, chest, neck, and head bones,
- five fingers per hand with at least MCP/PIP/DIP-ish articulation,
- neutral A-pose or T-pose calibration,
- mirrored left/right hand bone names,
- no facial identity requirements.

The target rig lives under:

```text
web/public/avatar/rigs/asl-pilot-upperbody-v1.glb
web/public/avatar/rigs/asl-pilot-upperbody-v1.license.json
```

Finger joints are the priority. If the rig's body is polished but the hands are
weak, reject it for ASL demonstration.

## 3. Reference Animation Authoring Pipeline

### Authoring Rule

Reference animations are lesson content, not runtime recognition models.
Offline MediaPipe Holistic is allowed for extracting reference pose/hand tracks
from clean source clips, but only in an authoring script or content-review
environment. No MediaPipe code, model, or output generator ships in the browser.

### Source Clip Selection

For each of the 95 words:

1. Select one clean source clip from PopSign or ASL Citizen that matches the
   vocabulary label.
2. Prefer clips with:
   - full hands visible,
   - little motion blur,
   - one signer,
   - frontal or near-frontal signing,
   - complete sign start and finish,
   - no occluding captions over hands.
3. Record source id, dataset, signer/clip metadata if available, license
   posture, and reviewer status in the avatar manifest.
4. Normalize label ids between the research prototype and web app before
   shipping. The prototype uses labels such as `TV`, `thankyou`, and
   `callonphone`; the web vocabulary uses ids such as `tv`, `thank_you`, and
   `call_on_phone`. The manifest must carry both `vocabularyId` and
   `modelLabelId` when they differ.

### Extraction And Cleanup

Offline authoring steps:

1. Run the source clip through an offline pose/hand extractor for content
   authoring.
2. Extract body/head anchors and both 21-point hand tracks.
3. Convert coordinates into a canonical avatar space:
   - chest root at `(0, 0, 0)`,
   - signer-facing coordinate convention recorded explicitly,
   - wrist-relative hand landmarks retained,
   - body scale normalized by shoulder width,
   - time normalized to `15 FPS` for MVP clips.
4. Smooth tracks with a small temporal filter that preserves handshape changes.
5. Trim idle frames to a reviewed start/end.
6. Add loop metadata:
   - `leadInMs`,
   - `loopStartMs`,
   - `loopEndMs`,
   - `holdEndMs`.
7. Human-review the resulting avatar playback for recognizable sign shape,
   timing, location, and hand visibility.

### MVP Clip Format

The MVP clip format is JSON, static under `web/public/avatar/clips/`.

```json
{
  "schemaVersion": "asl-pilot-reference-avatar-clip/v1",
  "clipId": "avatar-please-v1",
  "vocabularyId": "please",
  "modelLabelId": "please",
  "fps": 15,
  "durationMs": 2200,
  "source": {
    "dataset": "PopSign|ASL Citizen",
    "sourceClipId": "...",
    "authoringExtractor": "offline_content_authoring",
    "runtimeModelDependency": false
  },
  "review": {
    "reviewedAsAslDemonstration": true,
    "reviewer": "human",
    "notes": ""
  },
  "tracks": {
    "body23": "quantized_float_array_or_plain_keyframes",
    "head": "quantized_float_array_or_plain_keyframes",
    "leftHand21": "quantized_float_array_or_plain_keyframes",
    "rightHand21": "quantized_float_array_or_plain_keyframes"
  },
  "loop": {
    "leadInMs": 250,
    "loopStartMs": 250,
    "loopEndMs": 1900,
    "holdEndMs": 300
  }
}
```

Use plain JSON arrays for P1 and P2 authoring speed. If size becomes a problem,
switch the `tracks` payload to quantized `Int16Array` data encoded as base64
with per-track scale/offset. Do not switch schemas silently; add
`schemaVersion: "asl-pilot-reference-avatar-clip/v2"`.

### Static Storage

Static content layout:

```text
web/public/avatar/manifest.json
web/public/avatar/clips/please.v1.json
web/public/avatar/clips/table.v1.json
web/public/avatar/clips/...
web/public/avatar/rigs/asl-pilot-upperbody-v1.glb
web/public/avatar/rigs/asl-pilot-upperbody-v1.license.json
```

Size budgets:

- MVP one-word clip: <= `100 KiB` uncompressed JSON.
- MVP all 95 clips: <= `8 MiB` uncompressed JSON, target <= `2 MiB`
  transferred with Vercel compression.
- Target rig: <= `5 MiB` for the base `.glb`.
- Target rig animation content: <= `30 MiB` total before compression.
- Website model payload budget remains separate from avatar content:
  final tracking/recognizer FP32 ONNX <= `30 MiB`, target quantized <= `12 MiB`
  per `BUILD-PLAN-landmark-pose-stack.md`.

### Retargeting For The Target Rig

Retargeting is an offline build step:

1. Load the reviewed MVP landmark sequence.
2. Solve shoulder/elbow/wrist joint rotations from body/wrist tracks.
3. Solve finger curl/spread from the 21-hand landmark chains.
4. Apply rig-specific bone constraints and neutral-pose offsets.
5. Export either:
   - a `.glb` animation clip per sign, or
   - a compact JSON bone-keyframe track consumed by the same runtime.
6. Run reviewer playback against the MVP skeleton and source clip.

The reviewed MVP landmark sequence remains the source of truth. The rigged
animation is a presentation layer derived from it.

## 4. Runtime User Tracking Side

### Port The Pilot Pipeline Into The Next App

Create a first-class browser tracking module by porting
`tools/detector0-annotator/web-pilot/pipeline.js` into TypeScript instead of
copying ad hoc code into components.

Authoritative module split:

```text
web/src/lib/asl-tracking-pipeline.ts
web/src/lib/asl-tracking-types.ts
web/src/lib/use-asl-tracking.ts
web/src/components/UserSkeletonOverlay.tsx
```

`asl-tracking-pipeline.ts` owns:

- `cropResizeRgbaArea`,
- `tensorDataFromRgba`,
- detector box decode,
- crop expansion,
- current soft-argmax compatibility path,
- hand feature construction,
- sequence buffer construction,
- recognizer invocation,
- target probability lookup.

`use-asl-tracking.ts` owns:

- camera frame loop,
- ONNX session loading,
- throttling and cadence,
- cleanup on camera stop/unmount,
- model-bundle fail-closed state,
- live status for UI.

`UserSkeletonOverlay` owns:

- drawing detector boxes,
- drawing the signing-space crop,
- drawing body/head landmarks when the new stack lands,
- drawing hand skeletons,
- mirroring display coordinates consistently with the camera preview.

### Current Stack Compatibility

Until the next build-plan models land, the Next app may use the current
Detector 0 / hand-landmark / recognizer ONNX family exactly like `web-pilot/`:

```text
detector0-grid-big2.onnx
detector0-hand-landmarks-merged-w64.onnx
recognizer-distill.onnx
```

This is an integration scaffold only. It must load through manifest/model-bundle
fields and stay fail-closed unless the active model card and active vocabulary
claim authorize recognition.

The final stack from `BUILD-PLAN-landmark-pose-stack.md` changes the browser
pipeline:

- `HandLandmarkNetV2` should export regression outputs for browser inference.
- Final browser JavaScript should not soft-argmax large heatmaps.
- Body/head outputs join the overlay and recognizer feature schema through a
  versioned adapter.
- Old `FEAT=90` recognizer features remain a compatibility mode only.

### Target Verification

The website should verify the prompted target, not surface open-vocabulary
argmax as authority.

Runtime decision:

```text
targetProbability = softmax(logits)[modelLabelId]
passed = targetProbability >= tau AND all quality/active-label gates pass
```

Use the same principles as `pass-fail-decision.ts`:

- inactive labels cannot pass,
- poor camera quality cannot pass,
- model-not-trained cannot pass,
- wrong class or low confidence cannot pass,
- threshold `tau` must come from the model card or calibration manifest, not
  from hard-coded UI copy.

For the current v4 report, the reference FAR10 `tau` is `0.00043080`.
For the final distilled/promoted recognizer, record the model-specific `tau`
next to the model card before enabling pass/fail.

## 5. UX And Learner Flow

### Primary Route Decision

`/lesson` becomes the avatar-guided practice route. `/` remains the account,
practice history, and broader workspace route. This respects the current app
instead of replacing the established practice shell.

The final learner route is:

```text
/lesson
  prompt/word selector
  avatar reference panel
  user camera + skeleton overlay panel
  attempt/verify controls
  result and progress feedback
```

### Layout

Use a two-surface practice layout:

```text
reference avatar panel | user camera + skeleton overlay panel
```

Keep the prompt selector and progress/status controls compact around those two
surfaces. The current three-column `/lesson` scaffold can collapse into this
layout by merging the prompt card into a top/side control strip and upgrading
the robot panel into the reference panel.

Required controls:

- word selector for all 95 supported vocabulary ids,
- play/pause avatar,
- loop avatar,
- slow motion `0.5x`,
- normal speed `1x`,
- mirror avatar toggle,
- restart demo,
- start/stop camera,
- capture/verify attempt,
- next word,
- retry same word.

### Camera Permission States

All states from `use-camera-capture.ts` must remain explicit:

- `idle`: show camera start action.
- `starting`: show request-in-progress state.
- `ready`: show live video with local skeleton overlay.
- `denied`: tell the learner to enable browser camera permission.
- `unsupported`: explain that camera access is unavailable on this device.
- `error`: provide retry and stop/reset paths.

No camera state may imply tracking, grading, or recording unless that specific
state is active.

### Feedback

Beginner-facing feedback stays bounded:

- "Camera ready."
- "Keep both hands in frame."
- "Move into the signing space."
- "Hold the sign a little longer."
- "Attempt accepted."
- "Try again."
- "Automatic checking is not ready for this word yet."

Do not claim detailed phonology diagnosis unless the runtime signal directly
supports it. Hints can use the existing `sign-hint-metadata.json` and
`VocabularyItem.coachingHint`, but they should remain descriptive rather than
pretending to know exactly what the learner did wrong.

## 6. Website Integration

### Components

Add or evolve these components:

```text
web/src/components/AvatarReferencePanel.tsx
web/src/components/ReferenceAvatar3D.tsx
web/src/components/UserPracticePanel.tsx
web/src/components/UserSkeletonOverlay.tsx
web/src/components/GuidedPracticeControls.tsx
```

Existing components to reuse:

- `CameraViewport` for video and local capture.
- `LessonApp` for the `/lesson` route and auth/dev-preview behavior.
- `PracticeApp` for account/progress patterns and metadata-only attempt save.
- `RobotMannequin3D` as the disposable P1 base, then replace or rename it when
  it becomes reference-driven.

### State

Create one guided-practice state machine in `LessonApp` or a local hook:

```text
selecting
  -> avatar_ready
  -> camera_ready
  -> attempting
  -> verifying
  -> accepted | retry | saved_ungraded | error
```

State fields:

- `vocabularyId`,
- `modelLabelId`,
- `avatarClipStatus`,
- `cameraStatus`,
- `trackingStatus`,
- `recognitionStatus`,
- `attemptStatus`,
- `targetProbability`,
- `tau`,
- `decisionReasons`,
- `progressSaveStatus`.

### Static Content Manifest

`web/public/avatar/manifest.json` is the content contract:

```json
{
  "schemaVersion": "asl-pilot-avatar-content-manifest/v1",
  "generatedAt": "2026-05-31T00:00:00Z",
  "clipCount": 95,
  "clips": [
    {
      "vocabularyId": "please",
      "modelLabelId": "please",
      "clipPath": "/avatar/clips/please.v1.json",
      "reviewedAsAslDemonstration": true,
      "durationMs": 2200
    }
  ]
}
```

`web/src/lib/model-bundle.ts` already has `authored_avatar_demos`. Extend that
field to point to the manifest and reviewed clip count:

```ts
authored_avatar_demos: {
  enabled: boolean;
  reviewed_clip_count: number;
  manifest_path?: "/avatar/manifest.json";
}
```

### Model Bundle Integration

Extend `browser-model-bundle.json` rather than inventing a second feature flag.

The final bundle should express:

- recognition enabled/trained/promoted,
- detector/tracker artifact status,
- authored avatar demo manifest status,
- whether live skeleton overlay is enabled,
- whether avatar reference is enabled.

Recognition and live tracking can remain disabled while authored avatar demos
are enabled. That lets the lesson content ship in parallel with the model work.

### API Routes

Use existing routes:

- `/api/ort/[file]` for ONNX Runtime WASM.
- Static `/model/*` paths for model cards and ONNX artifacts.
- Static `/avatar/*` paths for avatar content.
- `/api/attempts` for metadata-only attempt saves.
- `/api/progress` for history.

Do not create an upload route for learner frames. If a future explicit-consent
collection mode is needed, it remains behind the existing dataset-collection
feature flags and outside normal practice.

### Deployment

Vercel remains the deploy target. The plan must preserve:

- static assets in `web/public/`,
- browser-only camera/tracking components marked `"use client"`,
- no server dependency on WebGL,
- no native addon dependency,
- `onnxruntime-web` WASM served from `/api/ort/`.

## 7. Phases, Deliverables, And Gates

### P1: One Hardcoded Avatar Sign

Deliverables:

- `ReferenceAvatar3D` renders a landmark/skeleton avatar in the `/lesson`
  reference panel.
- One hardcoded reviewed clip, use `please` or `table` because both are Tier 0
  and currently prominent in the lesson scaffold.
- Play, pause, restart, loop, slow motion, and mirror controls.
- WebGL fallback copy.

Gate:

- The avatar plays a recognizable target sign without camera or model runtime.
- First frame renders reliably.
- No raw learner video path exists.

### P2: Authoring Pipeline And All 95 Reference Clips

Deliverables:

- Offline authoring script or notebook that converts source clips into
  `asl-pilot-reference-avatar-clip/v1`.
- `web/public/avatar/manifest.json`.
- 95 reviewed clip JSON files under `web/public/avatar/clips/`.
- Label-id normalization table for research labels vs web vocabulary ids.
- Human review receipt for recognizability and obvious source/rights posture.

Gate:

- Every one of the 95 vocabulary items has exactly one reviewed avatar clip.
- Total MVP avatar content stays <= `8 MiB` uncompressed.
- Weak or ambiguous signs are flagged in the manifest rather than hidden.

### P3: Split View With Live User Tracking Overlay

Deliverables:

- `useAslTracking` hook loads model sessions through `onnxruntime-web`.
- TypeScript port of the `web-pilot/pipeline.js` preprocessing/postprocessing.
- Camera panel shows user video plus detector boxes and hand skeleton overlay.
- Tracking status stays fail-closed when model bundle disables detector0
  tracking.

Gate:

- Live overlay runs alongside avatar playback at >= `10 FPS` for the tracking
  update loop on the target Mac.
- Browser parity fixture passes against Python/prototype outputs before the
  overlay is trusted.
- No raw frames are persisted or posted.

### P4: Recognizer Feedback Loop At Calibrated Tau

Deliverables:

- Sequence buffer feeds the recognizer ONNX.
- Prompted target probability is computed by `modelLabelId`.
- `pass-fail-decision.ts` or its guided-practice equivalent consumes the
  recognizer result.
- Attempt metadata saves through `/api/attempts`.
- Result panel shows accepted/retry/saved-ungraded with reasons.

Gate:

- "Watch -> attempt -> verify -> save progress" works end-to-end for at least
  `20` reviewed words before pilot alpha.
- The final ship gate is the same loop for all `95` words with per-word weak
  status recorded.
- Pass/fail is disabled for unsupported or inactive model labels.

### P5: Full Site Integration, Content, Polish, And Performance

Deliverables:

- `/lesson` is the avatar-guided practice route for all 95 words.
- `/` links to `/lesson` and continues to show account/progress workspace.
- Model bundle gates recognition, tracking, and avatar demos separately.
- Avatar content is compressed/static-cache friendly.
- Mobile/tablet responsive split view.
- Performance report: FPS, model load time, avatar asset load time, recognizer
  latency, dropped-frame behavior.

Gate:

- The app runs the avatar and live tracking together at >= `10 FPS`.
- The final browser model payload stays <= `30 MiB` FP32 and targets <= `12 MiB`
  quantized.
- Avatar content remains within the content budget.
- The product copy stays beginner-friendly and scope-honest.

### Parallel Work vs Integration Convergence

Can proceed in parallel with the model build plan:

- P1 avatar renderer.
- P2 reference animation authoring pipeline.
- 95-word content manifest and review flow.
- `/lesson` UX and state machine.
- Static asset loading, controls, slow motion, mirror mode.
- Tracking UI against stub data or the current research ONNX path.

Must converge with the model build before final promotion:

- Final `GridDetectorV2` / hand / body / face ONNX artifacts.
- Final recognizer feature schema.
- Final calibrated `tau` thresholds.
- Active vocabulary claim and model-card promotion.
- Browser parity fixtures.
- Real-webcam tracking and no-hallucination gates.

This separation is important: avatar/content/UX work does not need to wait for
final model weights, but pass/fail authority does.

## 8. Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Avatar realism consumes the schedule | Ship landmark/skeleton MVP first. Treat rigged glTF as renderer upgrade only. |
| Retargeted ASL loses fidelity | Human-review every clip. Keep the reviewed landmark sequence as source of truth. Reject rig animations with weak fingers even if the body looks polished. |
| Fingers are not expressive enough | Prioritize 21-point hand rendering and finger-bone rig constraints before body polish. |
| Browser runs avatar + tracking too slowly | Throttle tracking to `10-15 FPS`, render avatar on `requestAnimationFrame`, use WASM first, add WebGPU only after parity passes. |
| Label ids diverge between research and web | Manifest carries both `vocabularyId` and `modelLabelId`; add a normalization table before any content build. |
| Runtime accidentally reintroduces pretrained dependencies | Keep MediaPipe/offline authoring scripts outside `web/`; audit imports and artifacts under the existing no-pretrained audit chain. |
| Asset licensing blocks deployment | Prefer project-authored CC0 rig. Require source receipt for any external rig or animation source. |
| 95-word authoring scale is underestimated | P2 uses a manifest-driven pipeline, per-word review status, and size budgets; do not hand-place clips directly in component code. |
| Product overclaims recognition | UI stays target-verification-only and fail-closed through model bundle, active claim, and pass/fail thresholds. |
| Privacy creep | Normal practice has no raw video upload route; `/api/attempts` remains metadata-only and already rejects frame/video-like payloads. |

## 9. Explicit Success Criteria

The website/avatar integration is successful only when all of these are true:

1. `/lesson` shows the target prompt, a playable reference avatar, and the
   user's live camera panel side by side.
2. The avatar plays a recognizable reviewed target sign for at least `20` words
   by pilot alpha and all `95` words for final ship.
3. The live user overlay is driven by from-scratch ONNX models through
   `onnxruntime-web`; no runtime pretrained tracking dependency exists.
4. Avatar playback and live tracking run together at >= `10 FPS` on the target
   Mac.
5. The "watch -> attempt -> verify -> save progress" loop works end-to-end for
   at least `20` words by pilot alpha and all `95` words for final ship.
6. Target verification uses calibrated `tau` from the model card/calibration
   manifest and fails closed for inactive labels, untrained models, poor camera
   quality, or inference errors.
7. No raw learner video or raw frames are uploaded during normal practice.
8. MVP avatar clips stay <= `8 MiB` uncompressed for all 95 words, with target
   transfer <= `2 MiB` after static compression.
9. Runtime model payload stays <= `30 MiB` FP32 and targets <= `12 MiB`
   quantized.
10. Beginner-facing copy describes practice, reference demonstration, local
    tracking, and bounded verification without claiming general ASL fluency or
    open-ended translation.

## SUMMARY

File written: `research/WEBSITE-AVATAR-INTEGRATION-PLAN.md`.
Recommended avatar path: ship a raw Three.js landmark/skeleton reference avatar first, then upgrade to a reviewed glTF upper-body-and-hands rig.
Phase list: P1 one sign, P2 all 95 authored clips, P3 live tracking overlay, P4 calibrated recognizer feedback, P5 full site polish and perf.
Parallel work: avatar rendering, authoring, content manifests, and `/lesson` UX can proceed before final tracking models land.
Top risk: ASL fidelity in the hands and fingers, especially when retargeting reviewed landmark clips onto a polished rig.
