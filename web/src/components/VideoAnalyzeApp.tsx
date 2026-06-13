"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LABELS,
  FEAT,
  type Hand,
  type OrtModule,
  type OrtSession,
  drawScratchOverlay,
  frameFeature,
  softmax,
} from "@/lib/scratch-pipeline";
import {
  loadRtmposeSessions,
  runRtmposeFrame,
} from "@/lib/rtmpose-pipeline";
import {
  type SimccFrameDebug,
  loadSimccSessions,
  runSimccFrame,
} from "@/lib/simcc-pipeline";

// ---------------------------------------------------------------------------
// /analyze — feed a *video file* (not the webcam) through the RTMPose
// recognition pipeline (src/lib/rtmpose-pipeline.ts). Region detector -> signing
// crop -> hand detector -> RTMPose hand landmarks -> 90-dim per-frame feature ->
// the RTMPose recognizer (proven JS<->Python parity with the feasibility that
// lifted test top-1 0.337 -> 0.632). Frames are decoded and analyzed entirely in
// the browser by seeking through the clip; nothing is uploaded.
// ---------------------------------------------------------------------------

const RECOGNIZER_URL = "/analyze/recognizer-rtmpose.onnx"; // RTMPose recognizer
// ?simcc swaps in the ALL-SCRATCH pipeline (same models /practice runs): SimCC
// w48 landmarks + the run10 recognizer (test recall@FAR10 0.9209, top-1 0.5428).
const SIMCC_RECOGNIZER_URL = "/practice/recognizer-simccw48.onnx";
const SAMPLE_FRAMES = 32; // evenly spaced across the clip (matches T=32 training)

// Bundled, rights-clean one-click samples (PopSign · CC BY 4.0, served at /pilot/clips).
const SAMPLES = ["man", "please", "frog", "grandpa", "happy", "hello", "table", "bad"].map(
  (word) => ({ word, src: `/pilot/clips/${word}.mp4` }),
);

type Guess = { label: string; probability: number };
type Result = { top: Guess[]; expected: string | null; matchRank: number | null };

function inferExpected(name: string): string | null {
  const base = name.replace(/\.[^.]+$/, "").toLowerCase();
  const tail = (base.split(/[-_/]/).pop() ?? "").replace(/[^a-z]/g, "");
  const direct = LABELS.find((l) => l === tail);
  if (direct) return direct;
  return [...LABELS].filter((l) => base.includes(l)).sort((a, b) => b.length - a.length)[0] ?? null;
}

function seekTo(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      video.removeEventListener("seeked", finish);
      resolve();
    };
    video.addEventListener("seeked", finish);
    video.currentTime = t;
    setTimeout(finish, 800);
  });
}

export function VideoAnalyzeApp() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const fullCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ortRef = useRef<OrtModule | null>(null);
  // Pipeline abstraction so ?simcc can swap the per-frame landmark path
  // (RTMPose by default; the all-scratch SimCC w48 pipeline when toggled).
  const pipelineRef = useRef<{
    run: (
      img: ImageData,
    ) => Promise<{ hands: Hand[]; cropBox: number[]; debug?: SimccFrameDebug }>;
    release: () => void;
    drawMin: number;
  } | null>(null);
  const recognizerRef = useRef<OrtSession | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const analyzingRef = useRef(false);

  const [modelsReady, setModelsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [variant, setVariant] = useState("");

  // --- load the scratch detector/landmark + recognizer models once. ---------
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const ort = await import("onnxruntime-web/webgpu");
        ort.env.wasm.wasmPaths = "/api/ort/";
        ort.env.wasm.numThreads = 1;
        const params = new URLSearchParams(window.location.search);
        // ?simcc swaps the whole path to the all-scratch SimCC w48 pipeline +
        // run10 recognizer (the exact /practice configuration).
        const simccMode = params.has("simcc");
        // Sequential creation (WebGPU EP forbids concurrent). Recognizer stays on
        // wasm (validated parity; runs once per clip so EP speed is irrelevant);
        // the heavy per-frame models pick WebGPU when available.
        const recognizer = await ort.InferenceSession.create(
          simccMode ? SIMCC_RECOGNIZER_URL : RECOGNIZER_URL,
          {
            executionProviders: ["wasm"],
            graphOptimizationLevel: "all" as const,
          },
        );
        let pipeline: NonNullable<typeof pipelineRef.current>;
        if (simccMode) {
          setVariant("all-scratch SimCC w48");
          const sessions = await loadSimccSessions(ort);
          pipeline = {
            run: (img) => runSimccFrame(ort, sessions, img),
            release: () => {
              void sessions.region.release?.();
              void sessions.hands.release?.();
              void sessions.simcc.release?.();
            },
            // SimCC decode-score presence is ~0.01 for detected hands, 0.0 for
            // absent slots — draw anything detected.
            drawMin: 1e-6,
          };
        } else {
          // ?int8 toggles the quantized (13.9MB int8, wasm) RTMPose hand model so
          // both variants can be A/B-tested on the same route.
          const quantized = params.has("int8");
          setVariant(quantized ? "int8 · wasm" : "fp16 · WebGPU");
          const sessions = await loadRtmposeSessions(ort, { quantized });
          pipeline = {
            run: (img) => runRtmposeFrame(ort, sessions, img),
            release: () => {
              void sessions.region.release?.();
              void sessions.hands.release?.();
              void sessions.rtmpose.release?.();
            },
            drawMin: 0.4,
          };
        }
        if (cancelled) {
          pipeline.release();
          void recognizer.release?.();
          return;
        }
        ortRef.current = ort;
        pipelineRef.current = pipeline;
        recognizerRef.current = recognizer;
        fullCanvasRef.current = document.createElement("canvas");
        setModelsReady(true);
      } catch (caught) {
        if (!cancelled) setLoadError(caught instanceof Error ? caught.message : String(caught));
      }
    })();
    return () => {
      cancelled = true;
      pipelineRef.current?.release();
      void recognizerRef.current?.release?.();
      pipelineRef.current = null;
      recognizerRef.current = null;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const loadSource = useCallback((src: string, name: string) => {
    const video = videoRef.current;
    if (!video) return;
    setResult(null);
    setVideoLoaded(false);
    setProgress(0);
    setSourceName(name);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (src.startsWith("blob:")) objectUrlRef.current = src;
    video.src = src;
    video.load();
  }, []);

  const onFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      loadSource(URL.createObjectURL(file), file.name);
    },
    [loadSource],
  );

  const analyze = useCallback(async () => {
    const ort = ortRef.current;
    const pipeline = pipelineRef.current;
    const recognizer = recognizerRef.current;
    const video = videoRef.current;
    const full = fullCanvasRef.current;
    if (analyzingRef.current || !ort || !pipeline || !recognizer || !video || !full) return;
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;

    analyzingRef.current = true;
    setAnalyzing(true);
    setResult(null);
    setProgress(0);

    const w = video.videoWidth;
    const h = video.videoHeight;
    full.width = w;
    full.height = h;
    const overlay = overlayRef.current;
    if (overlay && (overlay.width !== w || overlay.height !== h)) {
      overlay.width = w;
      overlay.height = h;
    }
    const octx = overlay?.getContext("2d") ?? null;
    const fctx = full.getContext("2d", { willReadFrequently: true })!;

    const sequence: number[][] = [];
    // Per-frame pipeline internals for the headless eval hook below (detector
    // boxes/scores + slot presence) — populated by the SimCC path's `debug`.
    const frameDebug: {
      detections: { box: number[]; score: number }[];
      presence: number[];
    }[] = [];
    try {
      for (let i = 0; i < SAMPLE_FRAMES; i += 1) {
        await seekTo(video, (duration * (i + 0.5)) / SAMPLE_FRAMES);
        fctx.drawImage(video, 0, 0, w, h);
        const sourceImage = fctx.getImageData(0, 0, w, h);
        const { hands, cropBox, debug } = await pipeline.run(sourceImage);
        if (octx && overlay) drawScratchOverlay(octx, overlay.width, overlay.height, hands, cropBox, pipeline.drawMin);
        sequence.push(frameFeature(hands));
        frameDebug.push({
          detections: debug?.detections ?? [],
          presence: hands.map((hd) => hd.probability),
        });
        setProgress((i + 1) / SAMPLE_FRAMES);
      }

      const t = sequence.length;
      const seq = new Float32Array(t * FEAT);
      sequence.forEach((feat, row) => seq.set(feat, row * FEAT));
      const out = await recognizer.run({
        sequence: new ort.Tensor("float32", seq, [1, t, FEAT]),
        lengths: new ort.Tensor("int64", BigInt64Array.from([BigInt(t)]), [1]),
      });
      const probs = softmax(Array.from(out.logits.data as Float32Array, (v) => Number(v)));
      const top: Guess[] = probs
        .map((probability, index) => ({ label: LABELS[index], probability }))
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 5);
      const expected = sourceName ? inferExpected(sourceName) : null;
      let matchRank: number | null = null;
      if (expected) {
        const idx = LABELS.indexOf(expected as (typeof LABELS)[number]);
        const pE = idx >= 0 ? probs[idx] : 0;
        matchRank = probs.reduce((r, p) => (p > pE ? r + 1 : r), 0);
      }
      setResult({ top, expected, matchRank });
      // Eval hook: full-precision result + per-frame detector internals for the
      // headless harnesses (scripts/simcc-heldout-nearlive-eval.mjs and the
      // detector-score collectors). Read-only window stash; harmless in prod.
      (window as unknown as {
        __simccLastResult?: {
          stamp: number;
          sourceName: string | null;
          top: Guess[];
          probs: Guess[];
          frames: typeof frameDebug;
        };
      }).__simccLastResult = {
        stamp: Date.now(),
        sourceName,
        top,
        probs: probs.map((probability, index) => ({ label: LABELS[index], probability })),
        frames: frameDebug,
      };
    } catch (caught) {
      setLoadError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      analyzingRef.current = false;
      setAnalyzing(false);
    }
  }, [sourceName]);

  const status = loadError
    ? `Load error: ${loadError}`
    : !modelsReady
      ? "Loading RTMPose detector + recognizer…"
      : !videoLoaded
        ? "Pick a video or a sample to analyze."
        : analyzing
          ? `Analyzing frames… ${Math.round(progress * 100)}%`
          : "Ready — press Analyze.";

  const predicted = result?.top[0];
  const correct = result?.matchRank != null && result.matchRank < 5;

  return (
    <div className="an-wrap">
      <header className="an-head">
        <div className="an-brand">
          <div className="an-mark">A</div>
          <div>
            <b>ASL&nbsp;Pilot</b>
            <span>Video Analysis</span>
          </div>
        </div>
        <div className="an-pill">
          <span className={`an-dot ${modelsReady ? "on" : loadError ? "warn" : ""}`} />
          <span>{status}</span>
        </div>
      </header>

      <main className="an-main">
        <section className="an-side">
          <div className="an-eyebrow">Analyze a video</div>
          <p className="an-lead">
            Feed any signing clip through the RTMPose tracker + recognizer. Frames
            are decoded and analyzed on your device — nothing is uploaded.
          </p>

          <label className="an-file">
            <input type="file" accept="video/*" onChange={onFile} disabled={analyzing} />
            <span className="an-file-cta">⤴ Choose a video file</span>
            <small>{sourceName ?? "mp4 / mov / webm — stays on your device"}</small>
          </label>

          <div className="an-eyebrow an-mt">Or try a sample</div>
          <div className="an-samples">
            {SAMPLES.map((s) => (
              <button
                key={s.word}
                type="button"
                className="an-sample"
                disabled={analyzing}
                onClick={() => loadSource(s.src, `${s.word}.mp4`)}
              >
                {s.word}
              </button>
            ))}
          </div>
          <span className="an-credit">Samples: PopSign · CC BY 4.0</span>
        </section>

        <section className="an-stage">
          <div className="an-frame">
            <video
              ref={videoRef}
              className="an-video"
              playsInline
              muted
              preload="auto"
              data-testid="analyze-video"
              onLoadedData={() => setVideoLoaded(true)}
            />
            <canvas ref={overlayRef} className="an-overlay" aria-hidden="true" />
            {!videoLoaded ? (
              <div className="an-empty">
                <span>No video loaded</span>
              </div>
            ) : null}
            {analyzing ? (
              <div className="an-bar" aria-hidden="true">
                <span style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            ) : null}
          </div>

          <div className="an-controls">
            <button
              type="button"
              className="an-go"
              disabled={!modelsReady || !videoLoaded || analyzing}
              onClick={() => void analyze()}
            >
              {analyzing ? "Analyzing…" : "Analyze video"}
            </button>
          </div>

          {result && predicted ? (
            <div className={`an-result ${result.expected ? (correct ? "ok" : "miss") : ""}`}>
              <div className="an-result-top">
                <div>
                  <div className="an-rlabel">Model sees</div>
                  <div className="an-pred">{predicted.label}</div>
                </div>
                <div className="an-conf">{(predicted.probability * 100).toFixed(1)}%</div>
              </div>
              {result.expected ? (
                <div className="an-verdict">
                  {correct ? "✓" : "✗"} Expected <b>{result.expected}</b>
                  {result.matchRank != null
                    ? correct
                      ? ` — found at rank #${result.matchRank + 1}`
                      : " — not in top-5"
                    : ""}
                </div>
              ) : null}
              <ul className="an-topk">
                {result.top.map((g, i) => (
                  <li key={g.label} className={i === 0 ? "lead" : ""}>
                    {g.label}
                    <strong>{(g.probability * 100).toFixed(0)}%</strong>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </main>

      <footer className="an-foot">
        <span className="an-tag">
          <span className="an-dot on" /> Decoded &amp; analyzed on-device — no upload
        </span>
        <span>RTMPose landmarks + transformer recognizer{variant ? ` · ${variant}` : ""}</span>
      </footer>

      <style jsx>{`
        .an-wrap {
          --ink-2: #1d1812;
          --card: #241d15;
          --line: rgba(245, 228, 200, 0.12);
          --paper: #f3e9d8;
          --muted: #b6a98f;
          --faint: #8a7d65;
          --honey: #eab44d;
          --honey-2: #f6c869;
          --green: #56d39a;
          --green-deep: #2fae7d;
          --coral: #eb9166;
          --shadow: 0 30px 70px -30px rgba(0, 0, 0, 0.7);
          --r: 22px;
          max-width: 1180px;
          margin: 0 auto;
          padding: 26px 26px 36px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          color: var(--paper);
          font-family: "Manrope", system-ui, sans-serif;
          background-image: radial-gradient(1100px 700px at 80% -12%, rgba(234, 180, 77, 0.16), transparent 60%),
            radial-gradient(900px 600px at 2% 112%, rgba(86, 211, 154, 0.1), transparent 55%);
        }
        .an-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .an-brand {
          display: flex;
          align-items: center;
          gap: 13px;
        }
        .an-mark {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: linear-gradient(150deg, var(--honey-2), var(--honey));
          color: #2a1d07;
          font-family: "Fraunces", "Manrope", serif;
          font-weight: 700;
          font-size: 23px;
        }
        .an-brand b {
          font-family: "Fraunces", "Manrope", serif;
          font-weight: 600;
          font-size: 21px;
          display: block;
          line-height: 1;
        }
        .an-brand span {
          color: var(--faint);
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          display: block;
          margin-top: 4px;
        }
        .an-pill {
          font-size: 13px;
          color: var(--muted);
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          gap: 9px;
          background: rgba(255, 255, 255, 0.02);
          max-width: 380px;
        }
        .an-pill span:last-child {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .an-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--faint);
          flex: none;
        }
        .an-dot.on {
          background: var(--green);
        }
        .an-dot.warn {
          background: var(--honey);
        }
        .an-main {
          flex: 1;
          display: grid;
          grid-template-columns: 0.85fr 1.15fr;
          gap: 30px;
          margin-top: 32px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .an-main {
            grid-template-columns: 1fr;
            gap: 22px;
          }
        }
        .an-side {
          background: linear-gradient(170deg, var(--card), var(--ink-2));
          border: 1px solid var(--line);
          border-radius: var(--r);
          padding: 30px 28px;
          box-shadow: var(--shadow);
        }
        .an-eyebrow {
          font-size: 12.5px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--honey);
          font-weight: 600;
        }
        .an-mt {
          margin-top: 26px;
        }
        .an-lead {
          color: var(--muted);
          font-size: 14.5px;
          margin: 12px 0 22px;
          line-height: 1.5;
        }
        .an-file {
          display: block;
          border: 1px dashed rgba(245, 228, 200, 0.28);
          border-radius: 14px;
          padding: 18px 16px;
          text-align: center;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.02);
          transition: 0.18s;
        }
        .an-file:hover {
          border-color: var(--honey);
          background: rgba(234, 180, 77, 0.06);
        }
        .an-file input {
          display: none;
        }
        .an-file-cta {
          display: block;
          font-family: "Fraunces", "Manrope", serif;
          font-weight: 600;
          font-size: 17px;
          color: var(--paper);
        }
        .an-file small {
          display: block;
          margin-top: 6px;
          color: var(--faint);
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .an-samples {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }
        .an-sample {
          appearance: none;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--line);
          color: var(--paper);
          font: inherit;
          font-weight: 600;
          font-size: 14px;
          text-transform: lowercase;
          padding: 9px 15px;
          border-radius: 999px;
          font-family: "Fraunces", "Manrope", serif;
          transition: 0.16s;
        }
        .an-sample:hover:not(:disabled) {
          border-color: rgba(234, 180, 77, 0.45);
          background: rgba(234, 180, 77, 0.1);
        }
        .an-sample:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .an-credit {
          display: block;
          margin-top: 12px;
          color: var(--faint);
          font-size: 11px;
        }
        .an-stage {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .an-frame {
          position: relative;
          border-radius: var(--r);
          overflow: hidden;
          background: #0c0a07;
          border: 1px solid var(--line);
          aspect-ratio: 4 / 3;
          box-shadow: var(--shadow);
        }
        .an-video,
        .an-overlay {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .an-overlay {
          pointer-events: none;
        }
        .an-empty {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: var(--faint);
          font-size: 14px;
        }
        .an-bar {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 5px;
          background: rgba(12, 10, 7, 0.5);
          z-index: 4;
        }
        .an-bar span {
          display: block;
          height: 100%;
          background: linear-gradient(90deg, var(--honey-2), var(--honey));
          transition: width 0.08s linear;
        }
        .an-controls {
          display: flex;
        }
        .an-go {
          flex: 1;
          appearance: none;
          cursor: pointer;
          border: none;
          font: inherit;
          font-weight: 700;
          font-size: 18px;
          color: #241704;
          background: linear-gradient(150deg, var(--honey-2), var(--honey));
          padding: 17px 22px;
          border-radius: 16px;
          box-shadow: 0 16px 34px -14px rgba(234, 180, 77, 0.65);
          transition: 0.16s;
        }
        .an-go:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        .an-go:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
          filter: saturate(0.55);
        }
        .an-result {
          border: 1px solid var(--line);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.02);
          padding: 20px 22px;
        }
        .an-result.ok {
          border-color: rgba(86, 211, 154, 0.4);
          background: rgba(86, 211, 154, 0.06);
        }
        .an-result.miss {
          border-color: rgba(235, 145, 102, 0.4);
          background: rgba(235, 145, 102, 0.06);
        }
        .an-result-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }
        .an-rlabel {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .an-pred {
          font-family: "Fraunces", "Manrope", serif;
          font-weight: 600;
          font-size: 40px;
          line-height: 1.04;
          text-transform: lowercase;
          background: linear-gradient(180deg, #fbf3e4, #e6d2ad);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .an-conf {
          font-size: 26px;
          font-weight: 700;
          color: var(--honey);
          font-variant-numeric: tabular-nums;
        }
        .an-verdict {
          margin-top: 12px;
          font-size: 14px;
          color: var(--muted);
        }
        .an-verdict b {
          color: var(--paper);
          text-transform: lowercase;
        }
        .an-topk {
          list-style: none;
          margin: 16px 0 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .an-topk li {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 6px 13px;
          font-size: 14px;
          font-family: "Fraunces", "Manrope", serif;
          font-weight: 500;
          text-transform: lowercase;
        }
        .an-topk li.lead {
          border-color: rgba(234, 180, 77, 0.4);
          background: rgba(234, 180, 77, 0.08);
        }
        .an-topk li strong {
          font-family: "Manrope", sans-serif;
          font-weight: 700;
          color: var(--honey);
          font-size: 11px;
          font-variant-numeric: tabular-nums;
          text-transform: none;
        }
        .an-foot {
          margin-top: 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          color: var(--faint);
          font-size: 12.5px;
          border-top: 1px solid var(--line);
          padding-top: 18px;
        }
        .an-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
