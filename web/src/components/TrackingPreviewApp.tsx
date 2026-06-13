"use client";

import { useRef } from "react";
import { CameraViewport } from "./CameraViewport";
import { useCameraCapture } from "@/lib/use-camera-capture";
import { useLiveTracker } from "@/lib/use-live-tracker";

// Standalone, auth-free live-tracking preview. Runs our from-scratch hand +
// region ONNX models fully in-browser; no video leaves the device, no backend
// or sign-in required. Demonstration only.
export function TrackingPreviewApp() {
  const camera = useCameraCapture({
    screenName: "tracking preview",
    readyMessage: "Camera ready — tracking runs entirely in your browser.",
  });
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const tracking = useLiveTracker({
    videoRef: camera.videoRef,
    overlayRef,
    enabled: camera.status === "ready",
  });

  const statusCopy =
    tracking.status === "loading"
      ? "Loading tracking models…"
      : tracking.status === "error"
        ? `Tracking unavailable: ${tracking.error ?? "model load failed"}`
        : tracking.status === "running"
          ? "Live — from-scratch hand + region models running in-browser."
          : "Start the camera to begin live tracking.";

  return (
    <main className="track-shell">
      <header className="track-head">
        <span className="brand-mark">ASL Pilot</span>
        <h1>Live tracking preview</h1>
        <p>
          From-scratch hand-landmark and region models running fully in your
          browser. No video leaves this device and no pretrained model ships at
          runtime. Experimental preview — not a pass/fail gate.
        </p>
      </header>
      <div className="track-stage">
        <CameraViewport
          canvasRef={camera.canvasRef}
          className="track-camera-frame"
          emptyMessage={camera.message}
          readyLabel="LIVE"
          status={camera.status}
          videoRef={camera.videoRef}
          videoTestId="tracking-video"
          overlayCanvasRef={overlayRef}
        />
        <div className="track-controls">
          <button
            className="primary-button"
            onClick={
              camera.status === "ready"
                ? camera.stopCamera
                : () => void camera.startCamera()
            }
            type="button"
          >
            {camera.status === "ready" ? "Stop camera" : "Start camera"}
          </button>
          <span className="track-status" data-state={tracking.status}>
            {statusCopy}
          </span>
        </div>
        <p className="track-note">{camera.message}</p>
        {tracking.profile && tracking.profile.total > 0 ? (
          <pre
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: "0.8rem",
              lineHeight: 1.5,
              opacity: 0.85,
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {[
              `── profiler (rolling avg, ms / frame) ──`,
              `capture  (drawImage+getImageData): ${tracking.profile.cap.toFixed(1)}`,
              `crop+resize (pure-JS resampler):   ${tracking.profile.resize.toFixed(1)}`,
              `inference (region+body+RTMPose):   ${tracking.profile.infer.toFixed(1)}`,
              `simcc decode:                      ${tracking.profile.decode.toFixed(1)}`,
              `TOTAL: ${tracking.profile.total.toFixed(1)} ms  (~${tracking.profile.fps.toFixed(0)} fps)`,
            ].join("\n")}
          </pre>
        ) : null}
      </div>
    </main>
  );
}
