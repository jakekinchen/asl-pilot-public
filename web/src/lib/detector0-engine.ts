import type { FrameSample } from "./client-model";
import type { Detector0FrameOutput } from "./detector0-types";

export type Detector0EngineStatus = {
  schemaVersion: "asl-pilot-detector0-engine-status/v1";
  detectorId: string;
  modelStatus: "not_trained" | "trained";
  promotionState: "research_only" | "candidate" | "promoted";
  canRunInBrowser: boolean;
  canDriveAvatar: boolean;
};

export interface Detector0Engine {
  status(): Detector0EngineStatus;
  predict(sample: FrameSample): Promise<Detector0FrameOutput>;
}

export const failClosedDetector0Engine: Detector0Engine = {
  status() {
    return {
      schemaVersion: "asl-pilot-detector0-engine-status/v1",
      detectorId: "asl-pilot-detector0-not-trained-v0",
      modelStatus: "not_trained",
      promotionState: "research_only",
      canRunInBrowser: false,
      canDriveAvatar: false,
    };
  },
  async predict() {
    throw new Error("Detector 0 has no promoted browser artifact.");
  },
};
