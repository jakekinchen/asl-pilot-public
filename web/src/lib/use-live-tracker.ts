"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { HandPoseTracker, drawTracking } from "./live-tracker";

export type LiveTrackerStatus = "idle" | "loading" | "running" | "error";
export type TrackerProfile = { cap: number; resize: number; infer: number; decode: number; total: number; fps: number };

// Drives a HandPoseTracker against a <video>, drawing the skeleton overlay to a
// canvas. Throttled to targetFps, single-flight (no overlapping inference), and
// fully torn down when disabled/unmounted. Preview/demonstration only.
export function useLiveTracker({
  videoRef,
  overlayRef,
  enabled,
  targetFps = 12,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  overlayRef: RefObject<HTMLCanvasElement | null>;
  enabled: boolean;
  targetFps?: number;
}): { status: LiveTrackerStatus; error: string | null; profile: TrackerProfile | null } {
  const [status, setStatus] = useState<LiveTrackerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<TrackerProfile | null>(null);
  const trackerRef = useRef<HandPoseTracker | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const overlayCanvas = overlayRef.current;
    let cancelled = false;
    let raf = 0;
    let busy = false;
    let last = 0;
    const minInterval = 1000 / targetFps;

    function loop() {
      raf = requestAnimationFrame((t) => {
        if (cancelled) return;
        const video = videoRef.current;
        const canvas = overlayRef.current;
        const tracker = trackerRef.current;
        const fresh = t - last >= minInterval;
        if (video && canvas && tracker?.ready && !busy && video.readyState >= 2 && fresh) {
          busy = true;
          last = t;
          const w = video.videoWidth;
          const h = video.videoHeight;
          if (w && h) {
            if (canvas.width !== w || canvas.height !== h) {
              canvas.width = w;
              canvas.height = h;
            }
            tracker
              .process(video)
              .then((result) => {
                if (cancelled || !result) return;
                const ctx = canvas.getContext("2d");
                if (ctx) drawTracking(ctx, result, w, h);
              })
              .catch(() => {
                /* transient per-frame error; keep looping */
              })
              .finally(() => {
                busy = false;
              });
          } else {
            busy = false;
          }
        }
        if (!cancelled) loop();
      });
    }

    async function boot() {
      setStatus("loading");
      setError(null);
      try {
        const tracker = trackerRef.current ?? new HandPoseTracker();
        trackerRef.current = tracker;
        await tracker.load();
        if (cancelled) return;
        setStatus("running");
        loop();
      } catch (caught) {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : String(caught));
        setStatus("error");
      }
    }

    void boot();

    const statsTimer = setInterval(() => {
      const p = trackerRef.current?.profile;
      if (!cancelled && p) setProfile({ ...p });
    }, 400);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearInterval(statsTimer);
      const ctx = overlayCanvas?.getContext("2d");
      if (overlayCanvas && ctx) ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      trackerRef.current?.reset();
    };
  }, [enabled, videoRef, overlayRef, targetFps]);

  useEffect(
    () => () => {
      trackerRef.current?.dispose();
      trackerRef.current = null;
    },
    [],
  );

  return { status, error, profile };
}
