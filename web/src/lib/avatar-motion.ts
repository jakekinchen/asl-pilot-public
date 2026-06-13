export const AVATAR_CLIP_SCHEMA_VERSION = "asl-pilot-reference-avatar-clip/v1";

export type AvatarPoint3 = [number, number, number];

export const AVATAR_BODY23_JOINT_IDS = [
  "chest",
  "head",
  "nose",
  "left_ear",
  "right_ear",
  "left_shoulder",
  "right_shoulder",
  "left_elbow",
  "right_elbow",
  "left_wrist",
  "right_wrist",
  "left_hip",
  "right_hip",
  "neck",
  "spine",
  "left_eye",
  "right_eye",
  "mouth",
  "left_hand_anchor",
  "right_hand_anchor",
  "left_index_anchor",
  "right_index_anchor",
  "pelvis",
] as const;

export type AvatarBody23JointId = (typeof AVATAR_BODY23_JOINT_IDS)[number];

export const AVATAR_BODY_EDGES: Array<[number, number]> = [
  [0, 13],
  [13, 1],
  [5, 6],
  [5, 7],
  [7, 9],
  [6, 8],
  [8, 10],
  [5, 11],
  [6, 12],
  [11, 12],
  [11, 22],
  [12, 22],
  [2, 15],
  [2, 16],
  [15, 3],
  [16, 4],
];

export const AVATAR_HAND_EDGES: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [5, 9],
  [9, 13],
  [13, 17],
];

export type AvatarHeadTrackFrame = {
  center: AvatarPoint3;
  lookAt: AvatarPoint3;
  up: AvatarPoint3;
};

export type AvatarReferenceClip = {
  schemaVersion: typeof AVATAR_CLIP_SCHEMA_VERSION;
  clipId: string;
  vocabularyId: string;
  modelLabelId: string;
  fps: number;
  durationMs: number;
  source: {
    dataset: "PopSign" | "ASL Citizen" | string;
    sourceClipId: string;
    authoringExtractor: string;
    runtimeModelDependency: false;
  };
  review: {
    reviewedAsAslDemonstration: boolean;
    reviewer: string;
    notes: string;
  };
  coordinateSpace: {
    root: "chest";
    x: "viewer_right";
    y: "up";
    z: "toward_camera";
    bodyScale: "shoulder_width";
    fps: 15;
  };
  quality?: {
    sampledFrameCount: number;
    poseDetectedFrames: number;
    leftHandDetectedFrames: number;
    rightHandDetectedFrames: number;
    synthesizedNeutralHands?: string[];
  };
  tracks: {
    body23: AvatarPoint3[][];
    head: AvatarHeadTrackFrame[];
    leftHand21: AvatarPoint3[][];
    rightHand21: AvatarPoint3[][];
  };
  loop: {
    leadInMs: number;
    loopStartMs: number;
    loopEndMs: number;
    holdEndMs: number;
  };
};

export type AvatarReferencePose = {
  timeMs: number;
  body23: AvatarPoint3[];
  head: AvatarHeadTrackFrame;
  leftHand21: AvatarPoint3[];
  rightHand21: AvatarPoint3[];
};

export type AvatarClipLoadStatus = "idle" | "loading" | "ready" | "missing" | "error";

export const DEFAULT_BODY23: AvatarPoint3[] = [
  [0, 0, 0],
  [0, 1.18, 0],
  [0, 1.25, 0.08],
  [-0.18, 1.18, 0],
  [0.18, 1.18, 0],
  [-0.5, 0.48, 0],
  [0.5, 0.48, 0],
  [-0.78, -0.02, 0],
  [0.78, -0.02, 0],
  [-0.78, -0.56, 0],
  [0.78, -0.56, 0],
  [-0.38, -0.82, 0],
  [0.38, -0.82, 0],
  [0, 0.72, 0],
  [0, -0.36, 0],
  [-0.08, 1.26, 0.1],
  [0.08, 1.26, 0.1],
  [0, 1.08, 0.12],
  [-0.78, -0.56, 0],
  [0.78, -0.56, 0],
  [-0.68, -0.54, 0.04],
  [0.68, -0.54, 0.04],
  [0, -0.9, 0],
];

const DEFAULT_HEAD: AvatarHeadTrackFrame = {
  center: [0, 1.18, 0],
  lookAt: [0, 1.18, 0.45],
  up: [0, 1.48, 0],
};

export function createNeutralHand21(side: "left" | "right"): AvatarPoint3[] {
  const sign = side === "left" ? -1 : 1;
  const wrist: AvatarPoint3 = [sign * 0.78, -0.56, 0.04];
  const fingerBases = [-0.12, -0.04, 0.04, 0.12];
  const points: AvatarPoint3[] = [wrist];
  points.push(
    [wrist[0] + sign * -0.11, wrist[1] + 0.05, 0.05],
    [wrist[0] + sign * -0.17, wrist[1] + 0.1, 0.06],
    [wrist[0] + sign * -0.2, wrist[1] + 0.14, 0.07],
    [wrist[0] + sign * -0.22, wrist[1] + 0.18, 0.08],
  );
  for (const base of fingerBases) {
    for (let joint = 0; joint < 4; joint += 1) {
      points.push([
        wrist[0] + sign * (base + joint * 0.012),
        wrist[1] + 0.1 + joint * 0.08,
        0.05 + joint * 0.012,
      ]);
    }
  }
  return points.slice(0, 21);
}

export const DEFAULT_REFERENCE_POSE: AvatarReferencePose = {
  timeMs: 0,
  body23: DEFAULT_BODY23,
  head: DEFAULT_HEAD,
  leftHand21: createNeutralHand21("left"),
  rightHand21: createNeutralHand21("right"),
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export async function loadAvatarReferenceClip(
  path: string,
  fetchImpl: FetchLike = fetch,
): Promise<AvatarReferenceClip> {
  const response = await fetchImpl(path, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Avatar clip request failed: ${response.status}`);
  }
  const data = (await response.json()) as unknown;
  return assertAvatarReferenceClip(data);
}

export function assertAvatarReferenceClip(data: unknown): AvatarReferenceClip {
  if (!isRecord(data)) {
    throw new Error("Avatar clip must be a JSON object.");
  }
  if (data.schemaVersion !== AVATAR_CLIP_SCHEMA_VERSION) {
    throw new Error("Unsupported avatar clip schema.");
  }
  if (typeof data.clipId !== "string" || typeof data.vocabularyId !== "string") {
    throw new Error("Avatar clip is missing ids.");
  }
  if (typeof data.modelLabelId !== "string") {
    throw new Error("Avatar clip is missing modelLabelId.");
  }
  if (typeof data.fps !== "number" || data.fps <= 0) {
    throw new Error("Avatar clip fps must be positive.");
  }
  if (typeof data.durationMs !== "number" || data.durationMs <= 0) {
    throw new Error("Avatar clip durationMs must be positive.");
  }
  const tracks = data.tracks;
  if (!isRecord(tracks)) {
    throw new Error("Avatar clip is missing tracks.");
  }
  assertPointTrack(tracks.body23, 23, "body23");
  assertHeadTrack(tracks.head);
  assertPointTrack(tracks.leftHand21, 21, "leftHand21");
  assertPointTrack(tracks.rightHand21, 21, "rightHand21");
  const frameCount = (tracks.body23 as unknown[]).length;
  if (
    (tracks.head as unknown[]).length !== frameCount ||
    (tracks.leftHand21 as unknown[]).length !== frameCount ||
    (tracks.rightHand21 as unknown[]).length !== frameCount
  ) {
    throw new Error("Avatar clip tracks must have matching frame counts.");
  }
  return data as AvatarReferenceClip;
}

export function avatarClipPathForVocabulary(vocabularyId: string) {
  return `/avatar/clips/${vocabularyId}.v1.json`;
}

export function resolveAvatarPlaybackTime(
  clip: AvatarReferenceClip,
  elapsedMs: number,
  loop: boolean,
): number {
  const durationMs = Math.max(0, clip.durationMs);
  if (!loop) return clampNumber(elapsedMs, 0, durationMs);
  const loopStartMs = clampNumber(clip.loop.loopStartMs, 0, durationMs);
  const loopEndMs = clampNumber(clip.loop.loopEndMs, loopStartMs, durationMs);
  const loopSpanMs = Math.max(1, loopEndMs - loopStartMs);
  if (elapsedMs <= loopEndMs) return clampNumber(elapsedMs, 0, durationMs);
  return loopStartMs + ((elapsedMs - loopStartMs) % loopSpanMs);
}

export function sampleAvatarReferenceClip(
  clip: AvatarReferenceClip | null,
  timeMs: number,
): AvatarReferencePose {
  if (!clip) return clonePose(DEFAULT_REFERENCE_POSE);
  const frameTime = clampNumber((timeMs / 1000) * clip.fps, 0, clip.tracks.body23.length - 1);
  return {
    timeMs,
    body23: samplePointTrack(clip.tracks.body23, frameTime, DEFAULT_BODY23),
    head: sampleHeadTrack(clip.tracks.head, frameTime, DEFAULT_HEAD),
    leftHand21: samplePointTrack(
      clip.tracks.leftHand21,
      frameTime,
      DEFAULT_REFERENCE_POSE.leftHand21,
    ),
    rightHand21: samplePointTrack(
      clip.tracks.rightHand21,
      frameTime,
      DEFAULT_REFERENCE_POSE.rightHand21,
    ),
  };
}

function samplePointTrack(
  track: AvatarPoint3[][],
  frameTime: number,
  fallback: AvatarPoint3[],
): AvatarPoint3[] {
  if (!track.length) return clonePoints(fallback);
  const lower = Math.floor(clampNumber(frameTime, 0, track.length - 1));
  const upper = Math.min(track.length - 1, lower + 1);
  const alpha = frameTime - lower;
  if (upper === lower) return clonePoints(track[lower]);
  return track[lower].map((point, index) =>
    interpolatePoint(point, track[upper][index] ?? point, alpha),
  );
}

function sampleHeadTrack(
  track: AvatarHeadTrackFrame[],
  frameTime: number,
  fallback: AvatarHeadTrackFrame,
): AvatarHeadTrackFrame {
  if (!track.length) return cloneHead(fallback);
  const lower = Math.floor(clampNumber(frameTime, 0, track.length - 1));
  const upper = Math.min(track.length - 1, lower + 1);
  const alpha = frameTime - lower;
  if (upper === lower) return cloneHead(track[lower]);
  return {
    center: interpolatePoint(track[lower].center, track[upper].center, alpha),
    lookAt: interpolatePoint(track[lower].lookAt, track[upper].lookAt, alpha),
    up: interpolatePoint(track[lower].up, track[upper].up, alpha),
  };
}

function interpolatePoint(a: AvatarPoint3, b: AvatarPoint3, alpha: number): AvatarPoint3 {
  return [
    a[0] + (b[0] - a[0]) * alpha,
    a[1] + (b[1] - a[1]) * alpha,
    a[2] + (b[2] - a[2]) * alpha,
  ];
}

function clonePose(pose: AvatarReferencePose): AvatarReferencePose {
  return {
    timeMs: pose.timeMs,
    body23: clonePoints(pose.body23),
    head: cloneHead(pose.head),
    leftHand21: clonePoints(pose.leftHand21),
    rightHand21: clonePoints(pose.rightHand21),
  };
}

function cloneHead(head: AvatarHeadTrackFrame): AvatarHeadTrackFrame {
  return {
    center: [...head.center],
    lookAt: [...head.lookAt],
    up: [...head.up],
  };
}

function clonePoints(points: AvatarPoint3[]): AvatarPoint3[] {
  return points.map((point) => [...point]);
}

function assertPointTrack(value: unknown, pointCount: number, name: string) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Avatar clip ${name} track must be a non-empty array.`);
  }
  for (const frame of value) {
    if (!Array.isArray(frame) || frame.length !== pointCount) {
      throw new Error(`Avatar clip ${name} frames must contain ${pointCount} points.`);
    }
    if (!frame.every(isPoint3)) {
      throw new Error(`Avatar clip ${name} contains an invalid point.`);
    }
  }
}

function assertHeadTrack(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Avatar clip head track must be a non-empty array.");
  }
  for (const frame of value) {
    if (
      !isRecord(frame) ||
      !isPoint3(frame.center) ||
      !isPoint3(frame.lookAt) ||
      !isPoint3(frame.up)
    ) {
      throw new Error("Avatar clip head track contains an invalid frame.");
    }
  }
}

function isPoint3(value: unknown): value is AvatarPoint3 {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export const AVATAR_JOINT_IDS = [
  "head",
  "torso",
  "left_shoulder",
  "left_elbow",
  "left_hand",
  "right_shoulder",
  "right_elbow",
  "right_hand",
] as const;

export type AvatarJointId = (typeof AVATAR_JOINT_IDS)[number];

export type AvatarJointPose = {
  jointId: AvatarJointId;
  position: [number, number, number];
  rotationEuler: [number, number, number];
  confidence: number;
  source: "inactive" | "idle" | "timing_scaffold" | "detector0_trace";
};

export type AvatarPoseFrame = {
  schemaVersion: "asl-pilot-avatar-pose-frame/v1";
  sampledAtMs: number;
  labelId: string;
  joints: AvatarJointPose[];
};

export type AvatarMotionClip = {
  schemaVersion: "asl-pilot-avatar-motion-clip/v1";
  clipId: string;
  labelId: string;
  source: "timing_scaffold" | "detector0_trace";
  reviewedAsAslDemonstration: false;
  frames: AvatarPoseFrame[];
};

export type AvatarDriverMode = "inactive" | "idle" | "demo" | "detector0_trace";

export type AvatarDriverState = {
  schemaVersion: "asl-pilot-avatar-driver-state/v1";
  mode: AvatarDriverMode;
  labelId: string;
  statusCopy: string;
  source: "ui_idle" | "ui_timing_scaffold" | "future_detector0";
  recognitionAuthority: false;
  clip: AvatarMotionClip | null;
  detectorTraceId: string | null;
};

export function inactiveAvatarState(labelId: string): AvatarDriverState {
  return {
    schemaVersion: "asl-pilot-avatar-driver-state/v1",
    mode: "inactive",
    labelId,
    statusCopy: "Detector feed unavailable. Robot is idling as a lesson scaffold.",
    source: "ui_idle",
    recognitionAuthority: false,
    clip: null,
    detectorTraceId: null,
  };
}

export function demoAvatarState(labelId: string): AvatarDriverState {
  return {
    schemaVersion: "asl-pilot-avatar-driver-state/v1",
    mode: "demo",
    labelId,
    statusCopy: "Timing scaffold replay. This is not learner tracking.",
    source: "ui_timing_scaffold",
    recognitionAuthority: false,
    clip: {
      schemaVersion: "asl-pilot-avatar-motion-clip/v1",
      clipId: `timing-scaffold-${labelId}`,
      labelId,
      source: "timing_scaffold",
      reviewedAsAslDemonstration: false,
      frames: [],
    },
    detectorTraceId: null,
  };
}
