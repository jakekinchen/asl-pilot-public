export type BrowserModelBundle = {
  schema_version: "asl-pilot-browser-model-bundle/v1";
  bundle_id: string;
  generated_at: string;
  recognition: {
    enabled: boolean;
    model_status: "not_trained" | "trained";
    model_card_path: "/model/model-card.json";
  };
  detector0_tracking: {
    enabled: boolean;
    promotion_state: "research_only" | "candidate" | "promoted";
    detector_card_path: "/model/detector0-card.json";
    browser_artifact: null | {
      path: string;
      sha256: string;
    };
  };
  box_driven_avatar: {
    enabled: boolean;
    requires_detector0_tracking: true;
  };
  authored_avatar_demos: {
    enabled: boolean;
    reviewed_clip_count: number;
    manifest_path?: "/avatar/manifest.json";
  };
};

export const DEFAULT_BROWSER_MODEL_BUNDLE: BrowserModelBundle = {
  schema_version: "asl-pilot-browser-model-bundle/v1",
  bundle_id: "asl-pilot-browser-bundle-not-trained-v0",
  generated_at: "2026-05-26",
  recognition: {
    enabled: false,
    model_status: "not_trained",
    model_card_path: "/model/model-card.json",
  },
  detector0_tracking: {
    enabled: false,
    promotion_state: "research_only",
    detector_card_path: "/model/detector0-card.json",
    browser_artifact: null,
  },
  box_driven_avatar: {
    enabled: false,
    requires_detector0_tracking: true,
  },
  authored_avatar_demos: {
    enabled: false,
    reviewed_clip_count: 0,
  },
};

export async function loadBrowserModelBundle(): Promise<BrowserModelBundle> {
  try {
    const response = await fetch("/model/browser-model-bundle.json", {
      cache: "no-store",
    });
    if (!response.ok) return DEFAULT_BROWSER_MODEL_BUNDLE;
    const data = (await response.json()) as Partial<BrowserModelBundle>;
    return {
      ...DEFAULT_BROWSER_MODEL_BUNDLE,
      ...data,
      recognition: {
        ...DEFAULT_BROWSER_MODEL_BUNDLE.recognition,
        ...data.recognition,
      },
      detector0_tracking: {
        ...DEFAULT_BROWSER_MODEL_BUNDLE.detector0_tracking,
        ...data.detector0_tracking,
      },
      box_driven_avatar: {
        ...DEFAULT_BROWSER_MODEL_BUNDLE.box_driven_avatar,
        ...data.box_driven_avatar,
      },
      authored_avatar_demos: {
        ...DEFAULT_BROWSER_MODEL_BUNDLE.authored_avatar_demos,
        ...data.authored_avatar_demos,
      },
    };
  } catch {
    return DEFAULT_BROWSER_MODEL_BUNDLE;
  }
}
