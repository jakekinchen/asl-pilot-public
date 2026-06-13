export const DETECTOR0_TARGET_IDS = [
  "left_or_first_hand",
  "right_or_second_hand",
  "head_or_face",
  "upper_body_or_signing_space",
] as const;

export type Detector0TargetId = (typeof DETECTOR0_TARGET_IDS)[number];

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

export type Detector0Trace = {
  schemaVersion: "asl-pilot-detector0-trace/v1";
  detectorId: string;
  modelStatus: "not_trained" | "trained";
  promotionState: "research_only" | "candidate" | "promoted";
  frames: Detector0FrameOutput[];
};
