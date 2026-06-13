"use client";

import type { RefObject } from "react";
import type { CameraStatus } from "@/lib/use-camera-capture";

type CameraViewportProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  className?: string;
  emptyMessage: string;
  readyLabel: string;
  status: CameraStatus;
  videoRef: RefObject<HTMLVideoElement | null>;
  videoTestId?: string;
  overlayCanvasRef?: RefObject<HTMLCanvasElement | null>;
};

export function CameraViewport({
  canvasRef,
  className = "",
  emptyMessage,
  readyLabel,
  status,
  videoRef,
  videoTestId,
  overlayCanvasRef,
}: CameraViewportProps) {
  const frameClassName = ["camera-frame", className].filter(Boolean).join(" ");

  return (
    <>
      <div className={frameClassName} data-status={status} data-testid="camera-viewport">
        <span className="corner-tr" aria-hidden="true" />
        <span className="corner-bl" aria-hidden="true" />
        <video ref={videoRef} playsInline muted data-testid={videoTestId} />
        {overlayCanvasRef ? (
          <canvas ref={overlayCanvasRef} className="camera-track-overlay" aria-hidden="true" />
        ) : null}
        {status === "ready" ? (
          <div className="camera-rec" aria-hidden="true">
            {readyLabel}
          </div>
        ) : null}
        {status !== "ready" ? (
          <div className="camera-empty">
            <span>{emptyMessage}</span>
          </div>
        ) : null}
      </div>
      <canvas ref={canvasRef} className="hidden-canvas" aria-hidden="true" />
    </>
  );
}
