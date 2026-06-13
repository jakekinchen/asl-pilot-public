"use client";

import { useEffect, useState } from "react";
import {
  evaluateLocalAttempt,
  expectedFrameCount,
  expectedImageSize,
  runBrowserModelParityProbe,
  BrowserModelInferenceProbe,
  BrowserModelParityFixture,
  FrameSample,
  LocalInferenceResult,
  ModelCard,
} from "@/lib/client-model";
import type { VocabularyItem } from "@/lib/vocabulary";

const SMOKE_MODEL_CARD_URL = "/model/browser-onnx-wiring-smoke/model-card.json";
const FINAL_MODEL_CARD_URL = "/model/model-card.json";
const APP_ROUTE = "/smoke/browser-onnx";
const SMOKE_EXPECTED: VocabularyItem = {
  id: "hello",
  label: "Hello",
  category: "smoke",
  prompt: "Smoke-test browser ONNX wiring.",
  coachingHint: "Smoke-only route for browser inference wiring.",
  hintKind: "framing",
  reviewStatus: "reviewed",
};

type SmokeMode = "smoke_fixture" | "final_artifact";

type SmokeState = {
  status: "running" | "passed" | "failed";
  mode: SmokeMode | null;
  model_card_url: string;
  result: LocalInferenceResult | null;
  diagnostics: (BrowserModelInferenceProbe & { app_route: string; mode: SmokeMode }) | null;
  frame_count: number | null;
  image_size: number | null;
  error: string | null;
};

declare global {
  interface Window {
    __ASL_FINAL_PARITY_FIXTURE__?: BrowserModelParityFixture;
    __ASL_FINAL_PARITY_FIXTURE_SHA256__?: string;
  }
}

export default function BrowserOnnxSmokePage() {
  const [state, setState] = useState<SmokeState>({
    status: "running",
    mode: null,
    model_card_url: "",
    result: null,
    diagnostics: null,
    frame_count: null,
    image_size: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function runSmoke() {
      try {
        const mode: SmokeMode =
          new URLSearchParams(window.location.search).get("mode") === "final"
            ? "final_artifact"
            : "smoke_fixture";
        const modelCardUrl = mode === "final_artifact" ? FINAL_MODEL_CARD_URL : SMOKE_MODEL_CARD_URL;
        const response = await fetch(modelCardUrl, { cache: "no-store" });
        if (!response.ok) throw new Error(`Model card fetch failed with HTTP ${response.status}`);
        const modelCard = (await response.json()) as ModelCard;
        const frameCount = expectedFrameCount(modelCard);
        const imageSize = expectedImageSize(modelCard);
        if (mode === "final_artifact") {
          const fixture = window.__ASL_FINAL_PARITY_FIXTURE__;
          const fixtureSha256 = window.__ASL_FINAL_PARITY_FIXTURE_SHA256__;
          if (!fixture || !fixtureSha256) {
            throw new Error("Final browser ONNX smoke requires an injected PyTorch parity fixture.");
          }
          const diagnostics = await runBrowserModelParityProbe(modelCard, fixture, fixtureSha256);
          if (cancelled) return;
          setState({
            status: "passed",
            mode,
            model_card_url: modelCardUrl,
            result: null,
            diagnostics: {
              ...diagnostics,
              app_route: `${APP_ROUTE}?mode=final`,
              mode,
            },
            frame_count: diagnostics.frame_count,
            image_size: diagnostics.image_size,
            error: null,
          });
          return;
        }
        const frames = buildSmokeFrames(frameCount, imageSize);
        const result = await evaluateLocalAttempt(
          SMOKE_EXPECTED,
          frames,
          modelCard,
        );
        if (cancelled) return;
        setState({
          status: result.passed ? "passed" : "failed",
          mode,
          model_card_url: modelCardUrl,
          result,
          diagnostics: null,
          frame_count: frameCount,
          image_size: imageSize,
          error: result.passed ? null : result.reason,
        });
      } catch (error) {
        if (cancelled) return;
        setState((current) => ({
          ...current,
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        }));
      }
    }

    void runSmoke();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main>
      <h1>Browser ONNX wiring smoke</h1>
      <pre data-testid="browser-onnx-smoke-result">
        {JSON.stringify(state, null, 2)}
      </pre>
    </main>
  );
}

function buildSmokeFrames(frameCount: number, imageSize: number): FrameSample[] {
  return Array.from({ length: frameCount }, (_, frameIndex) => ({
    width: imageSize,
    height: imageSize,
    meanLuma: 128,
    contrast: 48,
    sampledAt: Date.now() + frameIndex,
    rgb: buildSmokeRgb(imageSize, frameIndex),
  }));
}

function buildSmokeRgb(imageSize: number, frameIndex: number) {
  const pixelCount = imageSize * imageSize;
  const rgb = new Float32Array(3 * pixelCount);
  for (let index = 0; index < pixelCount; index += 1) {
    const checker = (index + frameIndex) % 2 === 0 ? 0.9 : 0.35;
    rgb[index] = checker;
    rgb[pixelCount + index] = 0.7;
    rgb[2 * pixelCount + index] = 0.45;
  }
  return rgb;
}
