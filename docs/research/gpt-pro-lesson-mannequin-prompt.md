# GPT Pro Prompt: 3D Robot Lesson Page For ASL Pilot

Use this as a self-contained GPT Pro research and architecture prompt. GPT Pro does not have access to the local codebase, so all relevant repo context is included below. Do not assume you can inspect files. If you need more exact code, say which file or function should be pasted, but first produce the best plan you can from this prompt.

The human preference is important: do not default to a flat 2D puppet. The target experience is a credible 3D robot mannequin/avatar that visually mirrors the learner's movement once Detector 0 exists. Be honest about current technical limits, but start from a 3D-first plan and only recommend 2D if you can defend why 3D is materially wrong for this repo.

---

You are advising on `asl-pilot`, a browser-first ASL 1 isolated-vocabulary practice pilot. We need a new lesson-focused page where a learner sees an ASL prompt, sees themselves on camera, and sees a robot mannequin/avatar that mirrors the learner's detected movement or recognition trace on screen.

Please research the web where useful and cite sources, especially around browser 3D avatars, sign-language avatar limitations, motion feedback, camera privacy, and ASL learning UX. Then reconcile your recommendations against the local repo constraints and implementation context below.

## Required Output

Structure your answer as:

1. Executive recommendation
2. Current-system truth audit
3. UX spec for the lesson-only page
4. 3D robot avatar rendering recommendation
5. Detector/recognizer/avatar contracts
6. File-by-file implementation plan
7. Validation plan and commands
8. Risks and blockers
9. Explicit "do not do this" list
10. Open questions for the human

Be opinionated. The best answer will distinguish:

- what we can truthfully ship now while the model is not trained;
- what scaffolding prepares the UI for a real 3D robot avatar;
- what must wait until Detector 0 and the recognizer are trained, exported, and promoted.

## Product Goal

Build a new lesson-focused ASL page. The current `/` page is a full practice workspace with auth, prompt selection, live camera, submit attempt, result, and progress ledger. We want a page that "just shows the lesson part with ASL": less ledger/admin clutter, more camera plus lesson plus avatar.

The desired first-viewport experience:

- ASL prompt and lesson cue are visible immediately.
- The learner camera is visible.
- A robot mannequin/avatar is visible beside or over/near the learner view.
- While the model is not trained, the robot must not pretend to track hands. It can idle, show sample timing, replay authored demonstration motion, or show "tracking not active yet" state.
- After Detector 0 exists in browser, the robot should be driven by model outputs.
- After the recognizer is promoted, the page can show prediction/confidence, but pass/fail must still come from the existing `PassFailDecision` contract.

The page should feel like the existing ASL Pilot design: calm, editorial, studio/camera-like, not gamified.

## Hard Repo Constraints

Project root: `/Users/kelly/Developer/asl-pilot`.

This is a noncommercial academic/school project under deadline pressure. Scope is isolated beginner ASL vocabulary practice, not sentence translation or open-vocabulary recognition.

Hard constraints:

- No pretrained CV/sign/landmark/model dependencies in the promoted recognition path.
- Do not use MediaPipe, OpenPose, YOLO, RTMPose, pretrained hand/body/face landmarks, pretrained detector outputs, pretrained-generated labels, pretrained backbones, embeddings, or model-zoo weights in the promoted lane.
- Normal practice must not upload raw learner video. Camera frames stay in the browser. Persistence stores attempt/progress metadata only.
- Browser inference is the target runtime for normal practice.
- Model/card promotion is gated by training evidence, signer-disjoint validation, calibrated thresholds, and existing promotion scripts. Do not suggest hand-editing model cards.
- Broad 75/95-label rawframe training is paused because it produced weak learning signal. Current work is the narrow return-to-form path.
- Detector 0 is allowed only as a scratch-trained box/center detector/cropper, not a pretrained landmark stack.

Architecture anchors from `ARCHITECTURE.md`:

- `#arch-product-scope`: browser app for login, prompted beginner ASL vocabulary, camera, pass/fail feedback, targeted hints, retries, saved progress.
- `#arch-active-module`: 100 content vocabulary items exist, but recognition is enabled only for labels in the active validated model module.
- `#arch-no-pretrained`: promoted recognition path uses team-trained architecture and weights only.
- `#arch-camera-privacy`: camera frames stay in browser during normal practice.
- `#arch-learner-flow`: login -> prompt -> camera -> capture -> evaluation -> result/hint -> retry/next -> progress saved.
- `#arch-inference-contract`: UI consumes an inference engine output and pass/fail decision, not raw model internals.
- `#arch-handboxnet`: scratch detector/cropper outputs boxes and quality signals, not detailed pretrained landmarks.
- `#arch-crop-pipeline`: fixed crops are baseline; detector crops are promoted only after ablation evidence.
- `#arch-downscope-ladder`: avatar/canonical playback can be downscoped to static sign tips and camera overlays if needed, but for this request the human wants a serious 3D avatar plan.

## Current Tech Stack

The web app is under `web/`.

`web/package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "test": "npm run typecheck"
  },
  "dependencies": {
    "@supabase/ssr": "^0.10.3",
    "@supabase/supabase-js": "^2.106.1",
    "next": "16.2.6",
    "onnxruntime-web": "^1.26.0",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.6",
    "playwright": "^1.60.0",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

There is no Three.js dependency today. If you recommend 3D, decide whether to use:

- `three` directly;
- `@react-three/fiber`;
- `@react-three/drei`;
- a procedural CSS/Canvas/WebGL approach;
- a local GLTF asset;
- or a procedural robot built from primitives.

Do not introduce any pretrained CV dependency. A rendering library is fine if it does not become recognition logic.

## Current Routes And UI

`web/src/app/page.tsx` currently renders:

```ts
import { PracticeApp } from "@/components/PracticeApp";

export default function Home() {
  return <PracticeApp />;
}
```

Important existing route/API surfaces:

- `/` -> `PracticeApp`
- `/validation` -> reviewer validation page
- `/smoke/browser-onnx` -> browser ONNX smoke page
- `/api/me`
- `/api/progress`
- `/api/attempts`
- `/api/model/active-vocabulary-claim`
- `/api/ort/[file]` for ONNX Runtime Web WASM assets
- dataset collection APIs exist but are behind `NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true` and are not the main route for this task.

Authenticated `PracticeApp` has:

- top bar with ASL Pilot masthead, attempted/mastered/catalog counters, validation link, logout;
- left prompt panel with vocabulary select, category, prompt text, coaching hint, active/content-only badge, and model status;
- center camera panel with live video, REC indicator, camera controls, submit attempt, next prompt, stop, status strip, and attempt result;
- right progress ledger;
- optional dataset collection panel behind a build-time flag.

Unauthenticated `PracticeApp` shows an auth shell with register/login form.

The new lesson page should probably reuse camera/model/vocabulary logic, but reduce ledger/auth clutter in the core lesson viewport. Evaluate whether it should require auth or allow a guest local-only mode. If guest mode is risky or too much change, say so.

Candidate route options:

- `/lesson`
- `/lesson/[vocabularyId]`
- `/practice/lesson`
- later split current `/` into dashboard/marketing and move current practice to `/practice`

Recommend one route and explain migration impact.

## Current Visual Design

Current CSS in `web/src/app/globals.css` uses dark editorial studio styling:

- ink backgrounds: `--ink-0` through `--ink-5`
- ivory text: `--ivory-1` through `--ivory-5`
- signal green: `--signal: #5be9b9`
- ember/amber for warnings
- mono labels, camera REC styling, hairline dividers
- square editorial panels, not rounded playful cards
- camera frame with corner brackets and REC indicator

Design reference in `docs/research/ui-design-reference.md` describes "studio / cinema verite": camera as cinematographer tool, editorial type, calm pedagogy, not gamified. No points, streaks, emoji, or celebration effects. Failure copy should be supportive and descriptive.

## Current Vocabulary

`web/src/lib/vocabulary.ts` contains 100 `VocabularyItem` records. Shape:

```ts
export type HintKind =
  | "handshape"
  | "movement"
  | "location"
  | "orientation"
  | "timing"
  | "framing";

export type VocabularyItem = {
  id: string;
  label: string;
  category: string;
  prompt: string;
  coachingHint: string;
  hintKind: HintKind;
  reviewStatus: "source_curated" | "reviewed";
};
```

Relevant current Tier 0 labels:

- `please`: "Sign PLEASE." hint: "Keep the open hand on the chest area and make the movement smooth."
- `table`: "Sign TABLE." hint: "Keep both hands visible and make the flat surface shape clear."
- `dad`: "Sign DAD." hint: "Place the open hand near the forehead area and keep thumb contact visible."
- `grandpa`: "Sign GRANDPA." hint: "Start near the forehead and keep the outward movement visible."
- `hat`: "Sign HAT." hint: "Keep the head-side hand placement visible and hold the finish briefly."

These five labels are the current return-to-form proof set. The lesson page may default to these before full 100-label recognition exists.

## Current Browser Model State

`web/public/model/model-card.json` is currently not trained:

```json
{
  "model_id": "asl-pilot-rawframe-v0",
  "status": "not_trained",
  "confidence_thresholds": {
    "default": 0.72
  },
  "architecture": {
    "family": "raw_frame_compact_3d_cnn",
    "summary": "compact_3d_cnn_spatiotemporal_placeholder_not_promoted",
    "pretrained_components": []
  },
  "limitations": [
    "The rawframe browser model is not_trained; every automatic sign check is server-side fail-closed and attempts are saved as practice history only.",
    "All prompt-catalog labels are learn-only until a trained rawframe model card is promoted via scripts/promote_trained_model_card.mjs.",
    "No first-party browser-webcam/raw-RGB model has been trained, validated, exported, or promoted."
  ]
}
```

`docs/model/active-vocabulary-claim.json` currently says:

```json
{
  "$schema_version": "asl-pilot-active-vocabulary-claim/v1",
  "modelVersion": "rawframe-not-trained",
  "lane": "rawframe",
  "activeLabels": [],
  "evidenceArtifacts": [],
  "claim_disclaimer": "No labels are currently active for recognition..."
}
```

Implication: today the UI must fail closed. It cannot claim the learner matched a sign. It can show prompt content, local camera state, sample timing, luma/contrast, descriptive hints, and a 3D robot in neutral/demo/scaffold states.

## Current Client Model And Inference Logic

`web/src/lib/client-model.ts` defines:

```ts
export type FrameSample = {
  width: number;
  height: number;
  meanLuma: number;
  contrast: number;
  sampledAt: number;
  rgb: Float32Array;
};

export type ModelCard = {
  model_id: string;
  status: "not_trained" | "trained";
  export_format?: "onnx";
  browser_artifact?: {
    path?: string;
    sha256?: string;
  };
  model?: {
    frame_count?: number;
    image_size?: number;
    input_name?: string;
    output_name?: string;
    label_to_index?: Record<string, number>;
  };
  confidence_thresholds?: {
    default?: number;
    per_label?: Record<string, number>;
  };
};
```

`sampleVideoFrame(video, canvas, imageSize)`:

- sets canvas to `imageSize` square, default 96;
- center-crops the live video square;
- draws to canvas;
- reads pixels;
- creates channel-first RGB float data in `[0, 1]`;
- computes `meanLuma` and `contrast`;
- returns `FrameSample`;
- does not compute boxes, landmarks, hands, head, or torso.

`expectedFrameCount(modelCard)` defaults to 16. `expectedImageSize(modelCard)` defaults to 96.

`PracticeApp.submitAttempt()`:

- requires logged-in user and camera ready;
- samples `frameCount` frames locally;
- waits about 80 ms between frames;
- if `modelCard.status === "trained"`, loads ONNX via `browserInferenceEngine`;
- calls `decide()` from `pass-fail-decision.ts`;
- persists metadata to `/api/attempts`;
- does not upload raw frames/video.

`web/src/lib/inference-engine.ts` defines:

```ts
export type InferenceResult = {
  modelId: string;
  modelStatus: "not_trained" | "trained";
  logits: Float32Array | null;
  predictedId: string | null;
  confidence: number;
  predictedTopK: Array<{ labelId: string; confidence: number }>;
  inputShape: number[];
  latencyMs: number;
};

export interface InferenceEngine {
  load(modelCard: ModelCard): Promise<LoadedModel>;
  predict(
    loaded: LoadedModel,
    frames: FrameSample[],
    options?: { topK?: number },
  ): Promise<InferenceResult>;
}
```

Currently this inference result has no localization trace. A future detector/avatar contract should extend or sit beside this.

`web/src/lib/pass-fail-decision.ts` defines reasons:

```ts
export type PassFailReason =
  | "model_not_trained"
  | "insufficient_frames"
  | "low_luma"
  | "low_contrast"
  | "inactive_label"
  | "class_mismatch"
  | "confidence_below_threshold"
  | "inference_error";
```

Decision output:

```ts
export type PassFailDecisionOutput = {
  passed: boolean;
  reasons: PassFailReason[];
  threshold: number;
  hint: string;
  hintDimension: HintKind | null;
  quality: {
    sampleCount: number;
    averageLuma: number;
    averageContrast: number;
  };
  predictedId: string | null;
  confidence: number;
};
```

Hints are intentionally descriptive, not diagnostic. Do not tell learners "your hand was wrong" unless the model actually supports that claim and the product has a reviewed copy path for it.

## Current Detector 0 / Return-To-Form State

The current active ML lane is narrow return-to-form, not broad 95-label training.

Current Tier 0 labels:

- `please`
- `table`
- `dad`
- `grandpa`
- `hat`

The previous evidence:

- fixed crops can memorize train data;
- validation/test stayed near random under signer-disjoint PopSign splits;
- no split leakage was found;
- likely issue is alignment, source/signer distribution, crop normalization, or data quality;
- plan moved to scratch Detector 0 / crop normalization before more recognizer tuning.

Detector 0 is a scratch localization/crop-normalization stage. It is not a pretrained landmark stack. It outputs boxes/centers, not fingers.

Detector 0 target schema from the repo:

```ts
type Detector0TargetId =
  | "left_or_first_hand"
  | "right_or_second_hand"
  | "head_or_face"
  | "upper_body_or_signing_space";

type Detector0Target = {
  presence: boolean;
  center_xy_norm: [number, number] | null;
  box_xyxy_norm: [number, number, number, number] | null;
  visibility_confidence: number;
  occlusion_flag: boolean;
  truncation_flag: boolean;
};
```

Coordinate space:

- normalized full-frame `xyxy`;
- top-left origin;
- values in `[0, 1]`.

Current packet: `data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json`

- schema: `asl-pilot-detector0-localization-packet/v1`
- status: `expanded_packet_ready_for_detector0_smoke`
- mission: `M3AE-Z`
- row count: 32
- labels: `please`, `table`, `dad`, `grandpa`, `hat`
- split counts: train 11, validation 11, test 10
- target presence counts:
  - `left_or_first_hand`: 32
  - `right_or_second_hand`: 20
  - `head_or_face`: 32
  - `upper_body_or_signing_space`: 32
- ready for detector training: true
- no rejected rows

Current crop-normalization design maps Detector 0 outputs into five recognizer regions:

- `viewer_left_hand_context`
- `viewer_right_hand_context`
- `upper_body_signing_space`
- `head_context`
- `full_frame_reference`

Current region tensor contract:

- layout: `T,R,H,W,C`
- temporal sample count: 16
- region size: `96x96`

Future avatar implication:

- Detector 0 boxes can drive a 3D robot at a coarse level:
  - head box -> head position/scale;
  - upper-body/signing-space box -> torso anchor/scale;
  - left/right hand centers -> hand target positions;
  - hand boxes -> hand size/confidence/visibility;
  - confidence/occlusion/truncation -> opacity/warning/fallback.
- Detector 0 boxes cannot drive finger articulation or exact handshape.
- A 3D robot must therefore be framed as a movement/location mirror, not an ASL correctness judge.

## The 3D Avatar Preference

The human does not agree with a recommendation that defaults to a 2D puppet. Please take this seriously.

We want to know how to build a real 3D robot mannequin in a way that fits the current evidence. Possible acceptable first version:

- a procedural Three.js robot made of simple primitives;
- orthographic camera, front-facing, no user-controlled orbit;
- torso, head, shoulders, upper arms, forearms, simple mitten/plate hands;
- simple IK or endpoint interpolation from normalized hand/head/torso targets;
- idle/demo state while tracking is unavailable;
- "tracking inactive" state when model card is not trained;
- confidence/fallback visualization once Detector 0 exists;
- no finger-level claims.

If you recommend `@react-three/fiber`, explain why it is worth the added dependency. If you recommend vanilla `three`, explain how it fits Next.js/React lifecycle. If you recommend GLTF, explain asset source/licensing and how to avoid bloating the repo. If you recommend procedural geometry, explain how to make it feel polished enough.

Do not tell us "2D is easier" as the main answer. We know it is easier. The question is how to make 3D credible and honest within the constraints.

## What The First Version May Truthfully Do

Before Detector 0 browser promotion, the lesson page can truthfully:

- show the selected ASL vocabulary prompt;
- show the existing coaching hint;
- show local camera preview;
- sample frames locally and display sample timing/quality summaries;
- show a 3D robot in neutral/idle state;
- show a 3D robot replaying manually authored canonical/demo keyframes if those are clearly labeled as demonstration, not recognition;
- show future tracking placeholders and inactive state copy;
- persist no raw video;
- keep all recognition fail-closed.

It must not:

- claim it is tracking hands/body if no detector is running;
- claim ASL correctness from luma/contrast or raw center crop;
- use MediaPipe or any pretrained landmark library just to drive the avatar;
- make the avatar's motion look like a pass/fail decision when the model is not trained.

## Questions To Answer Concretely

1. Which route should we add for the lesson page, and why?
2. Should it require auth in v1, or can it be a local-only guest lesson page?
3. How should the first viewport be laid out for camera plus 3D robot plus prompt?
4. Which 3D implementation should we use in this Next.js 16 / React 19 app?
5. Should the robot be procedural geometry, GLTF, or another asset strategy?
6. How should normalized Detector 0 boxes map into robot joints or IK targets?
7. What minimal avatar motion schema should exist today even before Detector 0?
8. What future browser Detector 0 output schema should be added?
9. Should Detector 0 have its own model card/manifest, or be a staged bundle with the recognizer? Propose exact JSON.
10. How should the avatar communicate confidence, occlusion, fallback, and inactive model state?
11. How do we avoid misleading learners about handshape/finger correctness?
12. What should be extracted from `PracticeApp.tsx` versus built as new components?
13. What CSS/layout additions are needed?
14. What audits/tests should be added for privacy, no-pretrained, fail-closed behavior, and nonblank 3D rendering?
15. What implementation should be deferred until Detector 0 and recognizer are trained/promoted?

## Preferred Implementation Shape To Evaluate

Please evaluate this likely architecture and improve it:

- Add `web/src/app/lesson/page.tsx`.
- Add `web/src/components/LessonApp.tsx`.
- Extract reusable camera logic from `PracticeApp` into a hook such as `web/src/lib/use-camera-capture.ts` or component such as `CameraViewport`.
- Add a 3D avatar component, likely `web/src/components/RobotMannequin3D.tsx`.
- Add a typed avatar motion contract under `web/src/lib/avatar-motion.ts`.
- Add a future Detector 0 browser contract under `web/src/lib/detector0-types.ts` or extend `inference-engine.ts` carefully.
- Keep recognizer pass/fail in `pass-fail-decision.ts`; do not let avatar state become pass/fail.
- Add CSS classes to `globals.css` or colocated component styling consistent with current studio design.
- Add tests/audits:
  - no raw video upload still passes;
  - no pretrained deps/artifacts still pass;
  - typecheck/lint/build pass;
  - Playwright smoke confirms `/lesson` renders, camera permission states appear, and the 3D canvas is nonblank once loaded;
  - model-not-trained state cannot show `passed=true` or "tracking active".

If you think a different implementation shape is better, say so and explain.

## Validation Commands Available In Repo

Existing commands from the repo README:

```sh
bash scripts/preflight.sh
bash scripts/preflight.sh --fast

node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_no_raw_video_upload.mjs
node scripts/audit_practice_screen_contract.mjs
node scripts/audit_browser_compatibility.mjs

npm --prefix web run lint
npm --prefix web run typecheck
npm --prefix web run build

node scripts/run_browser_onnx_wiring_smoke.mjs --write
node scripts/audit_browser_onnx_wiring_smoke.mjs
node scripts/run_practice_progress_smoke.mjs --write
node scripts/audit_practice_progress_smoke.mjs
node scripts/run_practice_camera_behavior_smoke.mjs --write
node scripts/audit_practice_camera_behavior_smoke.mjs
```

Recommend any new smoke/audit script names and what they should assert.

## Special Attention Areas

Please focus on these tradeoffs:

- 3D robot as motivational mirror versus misleading ASL evaluator.
- Coarse box-driven motion versus true skeletal/finger tracking.
- How to make 3D useful before Detector 0 is browser-promoted.
- Avoiding a dependency that creates audit friction or bundle bloat.
- Designing a future contract that can be backed by scratch Detector 0 outputs.
- Whether canonical lesson demonstrations should be manually authored keyframes for the five Tier 0 labels, source-reviewed short clips, static hint panels, or deferred.
- How to keep the route small enough to implement without derailing the current Detector 0 training mission.

Remember: no local repo access. Base your answer on this prompt. If you need exact code, ask for specific snippets, but still provide a concrete plan first.
