"use client";

import { useEffect, useRef, useState } from "react";
import { CameraViewport } from "./CameraViewport";
import { useCameraCapture } from "@/lib/use-camera-capture";
import { HandPoseTracker } from "@/lib/live-tracker";

// Consistent profiling: capture a few seconds of frames in-browser (nothing
// leaves the device), then replay the SAME frames through the pipeline so
// before/after optimization deltas are measurable instead of webcam noise.

type Stat = { avg: number; p50: number; min: number; max: number };
type Bench = { n: number; stages: Record<string, Stat>; fps: number };
const STAGES = ["cap", "resize", "infer", "decode", "total"] as const;
const STAGE_LABEL: Record<string, string> = {
  cap: "capture (drawImage+getImageData)",
  resize: "crop+resize (pure-JS resampler)",
  infer: "inference (region+coarse+2×RTMPose)",
  decode: "simcc decode",
  total: "TOTAL",
};

function stat(xs: number[]): Stat {
  const s = [...xs].sort((a, b) => a - b);
  const avg = xs.reduce((a, b) => a + b, 0) / xs.length;
  return { avg, p50: s[Math.floor(s.length / 2)], min: s[0], max: s[s.length - 1] };
}

export function BenchmarkApp() {
  const camera = useCameraCapture({
    screenName: "benchmark",
    readyMessage: "Camera ready. Capture stays in your browser.",
  });
  const trackerRef = useRef<HandPoseTracker | null>(null);
  const framesRef = useRef<ImageBitmap[]>([]);
  const [phase, setPhase] = useState<"loading" | "ready" | "capturing" | "running" | "done" | "error">("loading");
  const [frameCount, setFrameCount] = useState(0);
  const [bench, setBench] = useState<Bench | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const t = new HandPoseTracker();
        trackerRef.current = t;
        await t.load();
        if (!cancelled) setPhase("ready");
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : String(e));
          setPhase("error");
        }
      }
    })();
    return () => {
      cancelled = true;
      trackerRef.current?.dispose();
      trackerRef.current = null;
      framesRef.current.forEach((b) => b.close?.());
      framesRef.current = [];
    };
  }, []);

  async function capture(seconds = 6) {
    const video = camera.videoRef.current;
    if (!video || video.readyState < 2) {
      setErr("Start the camera first, then capture.");
      return;
    }
    framesRef.current.forEach((b) => b.close?.());
    framesRef.current = [];
    setBench(null);
    setErr(null);
    setPhase("capturing");
    const end = performance.now() + seconds * 1000;
    while (performance.now() < end) {
      framesRef.current.push(await createImageBitmap(video));
      setFrameCount(framesRef.current.length);
      await new Promise((r) => setTimeout(r, 80)); // ~12 fps capture
    }
    setPhase("ready");
  }

  async function run(passes = 5) {
    const t = trackerRef.current;
    const frames = framesRef.current;
    if (!t || !t.ready) {
      setErr("Models still loading.");
      return;
    }
    if (frames.length === 0) {
      setErr("Capture a few seconds first.");
      return;
    }
    setPhase("running");
    setErr(null);
    const acc: Record<string, number[]> = { cap: [], resize: [], infer: [], decode: [], total: [] };
    for (let p = 0; p < passes; p += 1) {
      for (const f of frames) {
        await t.process(f);
        for (const s of STAGES) acc[s].push(t.lastFrame[s]);
      }
    }
    const stages = Object.fromEntries(STAGES.map((s) => [s, stat(acc[s])]));
    setBench({ n: acc.total.length, stages, fps: stages.total.avg > 0 ? 1000 / stages.total.avg : 0 });
    setPhase("done");
  }

  const busy = phase === "capturing" || phase === "running" || phase === "loading";

  return (
    <main className="track-shell">
      <header className="track-head">
        <span className="brand-mark">ASL Pilot</span>
        <h1>Tracking benchmark</h1>
        <p>
          Capture a few seconds in-browser, then replay the same frames through the
          tracking pipeline to get stable, comparable timings. Nothing leaves this
          device.
        </p>
      </header>
      <div className="track-stage">
        <CameraViewport
          canvasRef={camera.canvasRef}
          className="track-camera-frame"
          emptyMessage={camera.message}
          readyLabel="CAM"
          status={camera.status}
          videoRef={camera.videoRef}
          videoTestId="bench-video"
        />
        <div className="track-controls">
          <button
            className="primary-button"
            disabled={busy}
            onClick={camera.status === "ready" ? () => void capture(6) : () => void camera.startCamera()}
            type="button"
          >
            {camera.status === "ready" ? "Capture 6s" : "Start camera"}
          </button>
          <button className="secondary-button" disabled={busy || frameCount === 0} onClick={() => void run(5)} type="button">
            Run benchmark (5×)
          </button>
          <span className="track-status" data-state={phase === "error" ? "error" : phase}>
            {phase === "loading"
              ? "Loading models…"
              : phase === "capturing"
                ? `Capturing… ${frameCount} frames`
                : phase === "running"
                  ? "Running benchmark…"
                  : phase === "error"
                    ? `Error: ${err ?? "unknown"}`
                    : `${frameCount} frames captured${bench ? " · benchmark done" : ""}`}
          </span>
        </div>
        {err && phase !== "error" ? <p className="track-note">{err}</p> : null}
        {bench ? (
          <pre
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: "0.82rem",
              lineHeight: 1.6,
              opacity: 0.9,
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {[
              `replayed ${bench.n} frames · ~${bench.fps.toFixed(1)} fps (by total avg)`,
              `stage                                  avg    p50    min    max   (ms)`,
              ...STAGES.map(
                (s) =>
                  `${STAGE_LABEL[s].padEnd(38)}${bench.stages[s].avg.toFixed(1).padStart(5)}` +
                  `${bench.stages[s].p50.toFixed(1).padStart(7)}${bench.stages[s].min.toFixed(1).padStart(7)}` +
                  `${bench.stages[s].max.toFixed(1).padStart(7)}`,
              ),
            ].join("\n")}
          </pre>
        ) : null}
      </div>
    </main>
  );
}
