"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  sampleVideoFrame,
  type FrameSample,
} from "@/lib/client-model";

export type CameraStatus =
  | "idle"
  | "starting"
  | "ready"
  | "denied"
  | "unsupported"
  | "error";

export type CameraQualitySnapshot = {
  meanLuma: number;
  contrast: number;
  frameCount: number;
  durationMs: number;
  sampledAt: number;
};

export type CameraSampleResult = {
  frames: FrameSample[];
  durationMs: number;
  quality: CameraQualitySnapshot;
};

type UseCameraCaptureOptions = {
  screenName: string;
  readyMessage: string;
  idleMessage?: string;
};

type SampleFramesOptions = {
  frameCount: number;
  imageSize: number;
  intervalMs: number;
};

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function useCameraCapture({
  screenName,
  readyMessage,
  idleMessage = "Camera has not started.",
}: UseCameraCaptureOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<CameraStatus>("idle");
  const [message, setMessage] = useState(idleMessage);
  const [settings, setSettings] = useState<MediaTrackSettings | null>(null);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [latestQuality, setLatestQuality] =
    useState<CameraQualitySnapshot | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setActiveStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
    setMessage(idleMessage);
    setSettings(null);
  }, [idleMessage]);

  useEffect(() => stopCamera, [stopCamera]);

  const startCamera = useCallback(async () => {
    setStatus("starting");
    setMessage("Requesting camera access.");

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      setMessage(`This browser does not expose camera access for the ${screenName}.`);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { ideal: 960 },
          height: { ideal: 540 },
          facingMode: "user",
        },
      });
      streamRef.current = stream;
      setActiveStream(stream);
      const [track] = stream.getVideoTracks();
      setSettings(track?.getSettings() ?? null);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("ready");
      setMessage(readyMessage);
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "CameraError";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setStatus("denied");
        setMessage(`Camera permission was denied. Enable camera access to use the ${screenName}.`);
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setStatus("unsupported");
        setMessage("No camera was found on this device.");
      } else {
        setStatus("error");
        setMessage("Camera could not start under the current browser/device settings.");
      }
    }
  }, [readyMessage, screenName]);

  const sampleFrames = useCallback(
    async ({
      frameCount,
      imageSize,
      intervalMs,
    }: SampleFramesOptions): Promise<CameraSampleResult> => {
      if (!videoRef.current || !canvasRef.current || status !== "ready") {
        throw new Error("Camera is not ready for local sampling.");
      }

      const frames: FrameSample[] = [];
      const startedAt = performance.now();
      for (let index = 0; index < frameCount; index += 1) {
        frames.push(sampleVideoFrame(videoRef.current, canvasRef.current, imageSize));
        if (index < frameCount - 1) await delay(intervalMs);
      }
      const durationMs = Math.round(performance.now() - startedAt);
      const quality = {
        meanLuma: average(frames.map((sample) => sample.meanLuma)),
        contrast: average(frames.map((sample) => sample.contrast)),
        frameCount: frames.length,
        durationMs,
        sampledAt: Date.now(),
      };
      setLatestQuality(quality);
      return { frames, durationMs, quality };
    },
    [status],
  );

  return {
    activeStream,
    canvasRef,
    latestQuality,
    message,
    sampleFrames,
    settings,
    setMessage,
    startCamera,
    status,
    stopCamera,
    videoRef,
  };
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
