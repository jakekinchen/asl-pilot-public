# Lesson 3D Robot Avatar Secondary Goal Loop Prompt

Status: **active secondary task** while [`GOAL.md`](../../GOAL.md) points here.

Activation rule: the user explicitly activated this secondary task on
2026-05-26 after the current Detector 0 executor/observer cycle completed.
While [`GOAL.md`](../../GOAL.md) points here, this prompt is the executor's
active plan.

Reviewer/observer boundary: the entire plan for this secondary task lives in
this prompt. The reviewer/observer must not move this task into a new
milestone prompt or rewrite [`GOAL.md`](../../GOAL.md) to another plan. If the
executor needs steering, the reviewer/observer should use NUDGE, STOP, or
ESCALATE with citations to this prompt.

## Mission

Add a focused `/lesson` route for ASL Pilot that presents a learner-facing
lesson studio: selected ASL prompt, local camera preview, and a credible 3D
robot mannequin scaffold. The route must remain honest while the browser model
is `not_trained`: the robot may idle, show timing/demo scaffolding, or replay
clearly labeled authored motion, but it must not claim hand/body tracking or
ASL correctness until a promoted browser Detector 0 artifact actually runs.

This is a browser UI and contract-scaffolding mission. It is not a Detector 0
training run, recognizer training run, model-card promotion, final-readiness
claim, source import, or active return-to-form redirect.

## Source Of Truth

Read in this order:

1. Latest explicit user instruction in the current thread.
2. This prompt's activation and reviewer/observer boundary. The user has
   explicitly switched the active loop to this secondary task.
3. GPT Pro advisory result pasted by the user in chat, summarized in this
   prompt.
4. Research prompt:
   [`docs/research/gpt-pro-lesson-mannequin-prompt.md`](../research/gpt-pro-lesson-mannequin-prompt.md).
5. [`ARCHITECTURE.md`](../../ARCHITECTURE.md), especially:
   - `#arch-product-scope`
   - `#arch-active-module`
   - `#arch-no-pretrained`
   - `#arch-camera-privacy`
   - `#arch-learner-flow`
   - `#arch-inference-contract`
   - `#arch-handboxnet`
   - `#arch-crop-pipeline`
   - `#arch-downscope-ladder`
6. Current browser implementation:
   - [`web/src/app/page.tsx`](../../web/src/app/page.tsx)
   - [`web/src/components/PracticeApp.tsx`](../../web/src/components/PracticeApp.tsx)
   - [`web/src/lib/client-model.ts`](../../web/src/lib/client-model.ts)
   - [`web/src/lib/inference-engine.ts`](../../web/src/lib/inference-engine.ts)
   - [`web/src/lib/pass-fail-decision.ts`](../../web/src/lib/pass-fail-decision.ts)
   - [`web/src/lib/vocabulary.ts`](../../web/src/lib/vocabulary.ts)
   - [`web/src/app/globals.css`](../../web/src/app/globals.css)
7. Current model claim surfaces:
   - [`web/public/model/model-card.json`](../../web/public/model/model-card.json)
   - [`docs/model/active-vocabulary-claim.json`](active-vocabulary-claim.json)
8. Detector 0 schema and return-to-form artifacts:
   - [`data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`](../../data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json)
   - [`docs/validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json`](../validation/return-to-form-tier0-detector0-crop-normalization-bootstrap.json)
   - [`docs/model/return-to-form-plan.md`](return-to-form-plan.md)
9. Design reference:
   [`docs/research/ui-design-reference.md`](../research/ui-design-reference.md).

## Current Truth

- `/` currently renders `PracticeApp`, a full authenticated practice workspace
  with auth, prompt selection, live camera, submit attempt, result panel, and
  progress ledger.
- `web/public/model/model-card.json` is `status: "not_trained"`.
- `docs/model/active-vocabulary-claim.json` has
  `modelVersion: "rawframe-not-trained"` and `activeLabels: []`.
- Browser frame sampling currently produces center-cropped RGB samples plus
  luma, contrast, dimensions, and timestamps. It does not produce hand boxes,
  head boxes, torso boxes, landmarks, skeletons, palm orientation, finger
  joints, or facial-expression signals.
- `PassFailDecisionOutput` remains the only pass/fail authority. Avatar state
  must not become a correctness lane.
- Detector 0 is a future scratch-trained box/center detector/cropper. It
  outputs coarse targets for `left_or_first_hand`, `right_or_second_hand`,
  `head_or_face`, and `upper_body_or_signing_space`. It is not a promoted
  browser runtime yet and cannot support finger-level ASL feedback.
- The Tier 0 lesson/default label set should be `please`, `table`, `dad`,
  `grandpa`, and `hat`.

## Intended Outcome

A dormant or activated implementation of `/lesson` provides a first-viewport
lesson studio:

- prompt rail with selected Tier 0 ASL vocabulary, coaching hint, model/tracking
  status, and learn-only badge when appropriate;
- local learner camera panel with existing permission/error semantics,
  camera brackets, local-only copy, and quality/timing strip;
- 3D robot mannequin panel rendered with a credible procedural robot;
- controls for start camera, capture/save practice sample in not-trained state,
  replay demo/timing scaffold, and next prompt;
- fail-closed model behavior preserved;
- no raw video or frame upload;
- no pretrained CV/sign/landmark/model dependency;
- no claim that the robot is tracking the learner until a trained/promoted
  Detector 0 browser artifact is present and gated on.

## Confirmed Requirements

- Add a new route beside the existing workspace; do not replace `/`.
- Prefer `/lesson` for v1. Use query state such as
  `/lesson?vocabulary=please`; defer `/lesson/[vocabularyId]` until source
  reviewed lesson content or shareable deep links justify it.
- Require auth in v1 unless the user explicitly authorizes a guest mode.
- Use a 3D-first plan. Do not default to a flat 2D puppet. A 2D/static fallback
  is acceptable only for WebGL failure or severe deadline fallback.
- Use a procedural robot made from primitives for v1. Avoid GLTF unless a
  reviewed local asset exists.
- Use vanilla `three` for v1 unless inspection proves `@react-three/fiber` is
  materially better for this repo.
- Keep the robot as a movement/location mirror scaffold, not a Deaf signer
  surrogate or ASL correctness judge.
- Keep `PassFailDecisionOutput` as the pass/fail authority.

## Recommended Defaults

- Runtime dependency: `three`.
- Dev dependency: `@types/three` only if TypeScript requires it.
- 3D component: client-only, dynamic `import("three")`, orthographic
  front-facing camera, no orbit controls, no physics, no GLTF loader, no
  user picking.
- Robot visual language: torso/head/shoulder/arm/hand primitive geometry,
  simple mitten or plate hands, signal-accent joints, dark graphite material,
  subtle idle motion, and constrained demo motion.
- Avatar motion contract is UI-only and separate from recognizer inference.
- Detector 0 contract lives beside the recognizer contract, not inside
  `PassFailDecisionOutput`.
- Detector 0 should later have its own card plus a browser bundle manifest so
  detector tracking can be gated separately from recognizer pass/fail.

## Open Questions

- Should `/lesson` eventually support local-only guest practice?
- Should authored robot demos ship for all five Tier 0 labels, or should v1
  include only idle/timing scaffold plus static hints until ASL review?
- Should the camera preview be mirrored like a selfie, and should the avatar
  mirror display coordinates to match?
- Should the robot remain beside the camera, or should a future translucent
  overlay mode be planned after Detector 0 is promoted?
- What is the minimum target device: school laptops only, tablets, or phones?

## Suggested Implementation Plan

### 1. Add the route shell

- Add [`web/src/app/lesson/page.tsx`](../../web/src/app/lesson/page.tsx) that
  renders `LessonApp`.
- Add [`web/src/components/LessonApp.tsx`](../../web/src/components/LessonApp.tsx)
  as a client component.
- Keep `/` and `PracticeApp` active.
- Add a small link from the existing top bar to `/lesson` only if it does not
  expand the scope of the current active mission.

### 2. Extract shared camera behavior narrowly

- Extract camera start/stop, permission state, `videoRef`, cleanup, and local
  frame sampling from `PracticeApp` into a small hook such as
  `web/src/lib/use-camera-capture.ts`.
- Add a reusable `CameraViewport` component only if it reduces duplication
  without rewriting the entire practice workflow.
- Preserve normal-practice privacy: no raw frames/video in request bodies or
  persistence.

### 3. Add avatar and detector contracts

- Add `web/src/lib/avatar-motion.ts` with:
  - `AvatarJointId`
  - `AvatarJointPose`
  - `AvatarPoseFrame`
  - `AvatarMotionClip`
  - `AvatarDriverState`
  - helpers for inactive, idle, demo, and future detector-trace states.
- Add `web/src/lib/detector0-types.ts` with:
  - `Detector0TargetId`
  - `Detector0Target`
  - `Detector0FrameOutput`
  - `Detector0Trace`.
- Add `web/src/lib/detector0-engine.ts` only as a typed interface/stub. Do not
  fake live hand boxes in product UI.

### 4. Add 3D robot renderer

- Add `web/src/components/RobotMannequin3D.tsx`.
- Use a client-only Three.js lifecycle with cleanup:
  - dynamic import of `three`;
  - scene, orthographic camera, renderer;
  - resize observer;
  - `requestAnimationFrame` loop;
  - primitive robot meshes;
  - disposal of renderer/geometries/materials;
  - `data-testid="robot-viewport"`;
  - `data-avatar-ready="true"` after first rendered frame;
  - `data-avatar-mode` reflecting `inactive`, `demo`, or future
    `detector0_trace`.
- If WebGL is unavailable, render a non-3D fallback that still says tracking is
  inactive.

### 5. Add conservative model bundle scaffolding

- Add `web/public/model/detector0-card.json` as `not_trained` /
  `research_only`, with target IDs, no pretrained components, no browser
  artifact path/hash, and limitations that boxes/centers are not ASL
  correctness.
- Add `web/public/model/browser-model-bundle.json` to gate:
  - `recognition: false`;
  - `detector0_tracking: false`;
  - `box_driven_avatar: false`;
  - `authored_avatar_demos: false` unless reviewed demo clips exist.
- Add `web/src/lib/model-bundle.ts` if it keeps gating logic centralized.
- Do not hand-edit promoted model-card truth. These are not-trained skeletons;
  later promotion must remain script/evidence-driven.

### 6. Add lesson UI styling

- Extend [`web/src/app/globals.css`](../../web/src/app/globals.css) with
  lesson-specific classes consistent with the current studio language:
  `lesson-shell`, `lesson-topline`, `lesson-grid`, `lesson-prompt-panel`,
  `lesson-camera-panel`, `lesson-avatar-panel`, `avatar-frame`,
  `tracking-badge`, `quality-strip`, and `lesson-controls`.
- Keep square editorial panels, hairline borders, dark ink backgrounds, ivory
  type, mono labels, and restrained signal/amber accents.
- Do not add gamified points, streaks, emoji reactions, confetti, or
  celebratory pass effects.

## Avatar And Detector Contract Sketch

The future detector trace should be separate from recognizer inference:

```ts
export type Detector0TargetId =
  | "left_or_first_hand"
  | "right_or_second_hand"
  | "head_or_face"
  | "upper_body_or_signing_space";

export type Detector0Target = {
  presence: boolean;
  center_xy_norm: [number, number] | null;
  box_xyxy_norm: [number, number, number, number] | null;
  visibility_confidence: number;
  occlusion_flag: boolean;
  truncation_flag: boolean;
};

export type Detector0FrameOutput = {
  schemaVersion: "asl-pilot-detector0-output/v1";
  detectorId: string;
  modelStatus: "not_trained" | "trained";
  promotionState: "research_only" | "candidate" | "promoted";
  coordinateSpace: "normalized_full_frame_top_left_xyxy";
  frame: {
    width: number;
    height: number;
    sampledAt: number;
    mirroredForDisplay: boolean;
  };
  targets: Record<Detector0TargetId, Detector0Target>;
  quality: {
    meanLuma: number;
    contrast: number;
  };
  latencyMs: number;
  rawFramePersisted: false;
};
```

Robot mapping rules:

- `head_or_face.center_xy_norm` drives head position/scale.
- `upper_body_or_signing_space.box_xyxy_norm` drives torso anchor and shoulder
  width scale.
- `left_or_first_hand.center_xy_norm` and
  `right_or_second_hand.center_xy_norm` drive hand endpoint targets.
- Hand boxes may drive visual size/confidence only; they must not imply
  handshape or palm orientation.
- Elbows are solved procedurally with a simple two-segment limb and stable bend
  bias.
- Low confidence freezes/eases toward the last valid target.
- `occlusion_flag` dims the limb.
- `truncation_flag` shows a frame-edge warning.
- No Detector 0 output produces `passed: true`.

## Acceptance Criteria

All criteria must be true before this secondary mission is considered complete:

1. The work was explicitly activated by the user or run as a deliberate
   one-off; the active return-to-form `GOAL.md` mission was not silently
   redirected.
2. `/lesson` exists and renders a focused lesson studio for authenticated users,
   without replacing `/`.
3. In the current `not_trained` state, `/lesson` displays tracking/model
   inactive copy and cannot show "tracking active", "you passed", "correct", or
   equivalent recognition claims.
4. The lesson route defaults or filters toward Tier 0 labels: `please`,
   `table`, `dad`, `grandpa`, and `hat`, while preserving content-only
   semantics for unsupported labels.
5. The camera preview stays local. No raw video, RGB frame arrays, screenshots,
   blobs, base64 frames, `.webm`, or `.mp4` payloads are uploaded during normal
   lesson practice.
6. A 3D robot mannequin component renders with Three.js or an explicitly
   justified equivalent, has deterministic cleanup, and exposes stable test
   attributes proving the canvas/viewport rendered.
7. Avatar state is separated from pass/fail state. No avatar module imports or
   mutates `PassFailDecisionOutput` as a correctness source.
8. Detector 0 types and model-card/bundle scaffolding are fail-closed while no
   promoted detector artifact exists.
9. No MediaPipe, OpenPose, YOLO, RTMPose, pretrained landmarks, pretrained
   detector outputs, pretrained backbones, pretrained embeddings, or
   pretrained-generated labels are introduced.
10. Existing checks pass:
    ```sh
    npm --prefix web run lint
    npm --prefix web run typecheck
    npm --prefix web run build
    node scripts/audit_no_pretrained_deps.mjs
    node scripts/audit_no_pretrained_artifact_json.mjs
    node scripts/audit_no_raw_video_upload.mjs
    node scripts/audit_practice_screen_contract.mjs
    node scripts/audit_browser_compatibility.mjs
    ```
11. New lesson/avatar checks exist and pass, or the session log records why a
    narrower initial smoke was chosen:
    ```sh
    node scripts/run_lesson_page_smoke.mjs --write
    node scripts/audit_lesson_page_smoke.mjs
    node scripts/audit_lesson_fail_closed.mjs
    node scripts/audit_avatar_no_recognition_claims.mjs
    node scripts/audit_detector0_manifest_contract.mjs
    ```
12. A numbered session log records changed files, commands, output artifact
    paths/hashes, remaining limitations, and the next action.

## Suggested New Audits

- `scripts/run_lesson_page_smoke.mjs --write`: Playwright smoke for `/lesson`
  with fake media where appropriate. Record prompt visibility, camera panel,
  robot panel, `data-avatar-ready`, nonblank canvas/viewport proof, tracking
  inactive copy, and absence of pass/tracking-active claims while not trained.
- `scripts/audit_lesson_page_smoke.mjs`: validate the retained smoke JSON.
- `scripts/audit_lesson_fail_closed.mjs`: assert current model/claim surfaces
  cannot render pass/tracking-active states on `/lesson`.
- `scripts/audit_avatar_no_recognition_claims.mjs`: scan lesson/avatar code for
  banned unsupported copy and guard future detector-active wording.
- `scripts/audit_detector0_manifest_contract.mjs`: validate
  `detector0-card.json` and `browser-model-bundle.json` schema, fail-closed
  gates, target IDs, no-pretrained declarations, and limitations.

## Hard Boundaries

- Do not move this plan to a different milestone prompt. Keep the full lesson
  plan in this prompt and steer against it.
- Do not resume or advance the return-to-form Detector 0 goal loop while
  `GOAL.md` points here.
- Do not run Detector 0 training.
- Do not run recognizer training.
- Do not run crop-normalization ablation.
- Do not export ONNX.
- Do not promote any model card.
- Do not claim final readiness.
- Do not import or approve sources.
- Do not use Brev compute, stop Brev, sync Brev, or create a duplicate worker.
- Do not upload learner raw video or frames.
- Do not use pretrained CV/sign/landmark/model dependencies.
- Do not fake live tracking from random or invented hand boxes.
- Do not make the avatar a pass/fail evaluator.
- Do not add GLTF internet assets without license, size, source, and review
  documentation.
- Do not gamify the learner page.

## Evidence Standard

Before claiming completion, report:

- whether this secondary prompt was activated or only authored;
- changed files;
- exact route and components added;
- model/card/bundle fail-closed state;
- privacy/no-pretrained audit results;
- lint/typecheck/build results;
- lesson smoke artifact path and key assertions;
- screenshot or nonblank canvas evidence if available;
- remaining blockers, especially Detector 0 not yet promoted and no
  finger/handshape feedback.

## Execution Rhythm

1. Confirm the user explicitly wants to run this secondary task now, or only
   author/stage it.
2. Inspect active `GOAL.md`, `git status --short --branch`, and current model
   claim surfaces.
3. Choose the smallest route/component slice that preserves active mission
   boundaries.
4. Implement the route and contracts before adding detector behavior.
5. Run static checks, privacy/no-pretrained audits, and lesson smoke.
6. Record evidence and compare against acceptance criteria.
7. Stop with a clear blocker if meeting the criteria would require Detector 0
   training, recognizer promotion, source review, or changing active mission
   scope.

## Progress Ledger Template

Each session log for this secondary task should end with:

```text
Current state:        Secondary /lesson 3D robot avatar task.
Activation:           <staged only | explicitly activated by user>.
Completed:            <route/contracts/avatar/audits completed this slice>.
Evidence:             <changed files, commands, smoke paths, screenshots, hashes>.
Remaining:            <single next action>.
Blockers:             <none, or exact model/detector/source/review blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash, if committed>.
```
