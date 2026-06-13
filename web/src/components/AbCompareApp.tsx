"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LABELS,
  FEAT,
  type OrtModule,
  type OrtSession,
  drawScratchOverlay,
  frameFeature,
  softmax,
} from "@/lib/scratch-pipeline";
import {
  type RtmposeSessions,
  loadRtmposeSessions,
  runRtmposeFrame,
} from "@/lib/rtmpose-pipeline";

// ---------------------------------------------------------------------------
// /compare — run ONE video through BOTH RTMPose variants at once (fp16/WebGPU
// and int8/wasm) and show predictions + per-variant extraction time side by
// side. A measurement tool: it loads both hand models (heavier), so it is not
// the demo surface — it answers "which variant should we ship?" empirically.
// ---------------------------------------------------------------------------

const RECOGNIZER_URL = "/analyze/recognizer-rtmpose.onnx";
const SAMPLE_FRAMES = 32;
const SAMPLES = ["man", "please", "frog", "grandpa", "happy", "hello", "table", "bad"].map(
  (word) => ({ word, src: `/pilot/clips/${word}.mp4` }),
);

type Guess = { label: string; probability: number };
type Side = { top: Guess[]; matchRank: number | null; extractMs: number };
type Result = { expected: string | null; fp16: Side; int8: Side };

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

function topFrom(probs: number[], expected: string | null): Side {
  const top: Guess[] = probs
    .map((probability, index) => ({ label: LABELS[index], probability }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5);
  let matchRank: number | null = null;
  if (expected) {
    const idx = LABELS.indexOf(expected as (typeof LABELS)[number]);
    const pE = idx >= 0 ? probs[idx] : 0;
    matchRank = probs.reduce((r, p) => (p > pE ? r + 1 : r), 0);
  }
  return { top, matchRank, extractMs: 0 };
}

export function AbCompareApp() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const fullCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ortRef = useRef<OrtModule | null>(null);
  const fp16Ref = useRef<RtmposeSessions | null>(null);
  const int8Ref = useRef<RtmposeSessions | null>(null);
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

  // --- load recognizer + BOTH rtmpose variants once. ------------------------
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const ort = await import("onnxruntime-web/webgpu");
        ort.env.wasm.wasmPaths = "/api/ort/";
        ort.env.wasm.numThreads = 1;
        // Sequential (WebGPU forbids concurrent session creation).
        const recognizer = await ort.InferenceSession.create(RECOGNIZER_URL, {
          executionProviders: ["wasm"],
          graphOptimizationLevel: "all" as const,
        });
        const fp16 = await loadRtmposeSessions(ort, { quantized: false });
        const int8 = await loadRtmposeSessions(ort, { quantized: true });
        if (cancelled) {
          void recognizer.release?.();
          for (const s of [fp16, int8]) {
            void s.region.release?.();
            void s.hands.release?.();
            void s.rtmpose.release?.();
          }
          return;
        }
        ortRef.current = ort;
        recognizerRef.current = recognizer;
        fp16Ref.current = fp16;
        int8Ref.current = int8;
        fullCanvasRef.current = document.createElement("canvas");
        setModelsReady(true);
      } catch (caught) {
        if (!cancelled) setLoadError(caught instanceof Error ? caught.message : String(caught));
      }
    })();
    return () => {
      cancelled = true;
      void recognizerRef.current?.release?.();
      for (const s of [fp16Ref.current, int8Ref.current]) {
        void s?.region.release?.();
        void s?.hands.release?.();
        void s?.rtmpose.release?.();
      }
      recognizerRef.current = null;
      fp16Ref.current = null;
      int8Ref.current = null;
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

  const recognize = useCallback(async (sequence: number[][]): Promise<number[]> => {
    const ort = ortRef.current!;
    const recognizer = recognizerRef.current!;
    const t = sequence.length;
    const seq = new Float32Array(t * FEAT);
    sequence.forEach((feat, row) => seq.set(feat, row * FEAT));
    const out = await recognizer.run({
      sequence: new ort.Tensor("float32", seq, [1, t, FEAT]),
      lengths: new ort.Tensor("int64", BigInt64Array.from([BigInt(t)]), [1]),
    });
    return softmax(Array.from(out.logits.data as Float32Array, (v) => Number(v)));
  }, []);

  const analyze = useCallback(async () => {
    const ort = ortRef.current;
    const fp16 = fp16Ref.current;
    const int8 = int8Ref.current;
    const video = videoRef.current;
    const full = fullCanvasRef.current;
    if (analyzingRef.current || !ort || !fp16 || !int8 || !video || !full) return;
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

    const seqFp16: number[][] = [];
    const seqInt8: number[][] = [];
    let msFp16 = 0;
    let msInt8 = 0;
    try {
      for (let i = 0; i < SAMPLE_FRAMES; i += 1) {
        await seekTo(video, (duration * (i + 0.5)) / SAMPLE_FRAMES);
        fctx.drawImage(video, 0, 0, w, h);
        const sourceImage = fctx.getImageData(0, 0, w, h);

        const a0 = performance.now();
        const r16 = await runRtmposeFrame(ort, fp16, sourceImage);
        msFp16 += performance.now() - a0;
        seqFp16.push(frameFeature(r16.hands));

        const b0 = performance.now();
        const r8 = await runRtmposeFrame(ort, int8, sourceImage);
        msInt8 += performance.now() - b0;
        seqInt8.push(frameFeature(r8.hands));

        if (octx && overlay) drawScratchOverlay(octx, overlay.width, overlay.height, r16.hands, r16.cropBox);
        setProgress((i + 1) / SAMPLE_FRAMES);
      }

      const expected = sourceName ? inferExpected(sourceName) : null;
      const [pFp16, pInt8] = await Promise.all([recognize(seqFp16), recognize(seqInt8)]);
      const fp16Side = { ...topFrom(pFp16, expected), extractMs: msFp16 };
      const int8Side = { ...topFrom(pInt8, expected), extractMs: msInt8 };
      setResult({ expected, fp16: fp16Side, int8: int8Side });
    } catch (caught) {
      setLoadError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      analyzingRef.current = false;
      setAnalyzing(false);
    }
  }, [recognize, sourceName]);

  const status = loadError
    ? `Load error: ${loadError}`
    : !modelsReady
      ? "Loading both variants (fp16 + int8)…"
      : !videoLoaded
        ? "Pick a video or a sample to compare."
        : analyzing
          ? `Analyzing both… ${Math.round(progress * 100)}%`
          : "Ready — press Compare.";

  function card(label: string, sub: string, side: Side | undefined, expected: string | null, other?: Side) {
    const predicted = side?.top[0];
    const correct = side?.matchRank != null && side.matchRank < 5;
    const faster = side && other ? side.extractMs <= other.extractMs : false;
    return (
      <div className={`cm-card ${side ? (expected ? (correct ? "ok" : "miss") : "") : ""}`}>
        <div className="cm-card-head">
          <span className="cm-variant">{label}</span>
          <span className="cm-sub">{sub}</span>
        </div>
        {side && predicted ? (
          <>
            <div className="cm-pred-row">
              <div className="cm-pred">{predicted.label}</div>
              <div className="cm-conf">{(predicted.probability * 100).toFixed(1)}%</div>
            </div>
            {expected ? (
              <div className="cm-verdict">
                {correct ? "✓" : "✗"} expected <b>{expected}</b>
                {side.matchRank != null ? (correct ? ` (rank #${side.matchRank + 1})` : " — not in top-5") : ""}
              </div>
            ) : null}
            <ul className="cm-topk">
              {side.top.map((g, i) => (
                <li key={g.label} className={i === 0 ? "lead" : ""}>
                  {g.label}
                  <strong>{(g.probability * 100).toFixed(0)}%</strong>
                </li>
              ))}
            </ul>
            <div className={`cm-time ${faster ? "win" : ""}`}>
              {(side.extractMs / 1000).toFixed(2)}s extraction
              {faster ? " · faster" : ""}
            </div>
          </>
        ) : (
          <div className="cm-empty-card">—</div>
        )}
      </div>
    );
  }

  return (
    <div className="cm-wrap">
      <header className="cm-head">
        <div className="cm-brand">
          <div className="cm-mark">A</div>
          <div>
            <b>ASL&nbsp;Pilot</b>
            <span>fp16 vs int8 · side by side</span>
          </div>
        </div>
        <div className="cm-pill">
          <span className={`cm-dot ${modelsReady ? "on" : loadError ? "warn" : ""}`} />
          <span>{status}</span>
        </div>
      </header>

      <main className="cm-main">
        <section className="cm-stage">
          <div className="cm-controls-row">
            <label className="cm-file">
              <input type="file" accept="video/*" onChange={onFile} disabled={analyzing} />
              <span>⤴ Choose a video</span>
            </label>
            <div className="cm-samples">
              {SAMPLES.map((s) => (
                <button
                  key={s.word}
                  type="button"
                  className="cm-sample"
                  disabled={analyzing}
                  onClick={() => loadSource(s.src, `${s.word}.mp4`)}
                >
                  {s.word}
                </button>
              ))}
            </div>
          </div>

          <div className="cm-frame">
            <video
              ref={videoRef}
              className="cm-video"
              playsInline
              muted
              preload="auto"
              data-testid="compare-video"
              onLoadedData={() => setVideoLoaded(true)}
            />
            <canvas ref={overlayRef} className="cm-overlay" aria-hidden="true" />
            {!videoLoaded ? <div className="cm-empty"><span>No video loaded</span></div> : null}
            {analyzing ? (
              <div className="cm-bar" aria-hidden="true">
                <span style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="cm-go"
            disabled={!modelsReady || !videoLoaded || analyzing}
            onClick={() => void analyze()}
          >
            {analyzing ? "Analyzing both…" : "Compare both variants"}
          </button>
          {sourceName ? <div className="cm-source">{sourceName}</div> : null}
        </section>

        <section className="cm-results">
          {card("fp16", "WebGPU (default)", result?.fp16, result?.expected ?? null, result?.int8)}
          {card("int8", "wasm (quantized)", result?.int8, result?.expected ?? null, result?.fp16)}
        </section>
      </main>

      <footer className="cm-foot">
        <span>Same frames through both RTMPose variants · recognizer on wasm for both</span>
        <span>Loads both hand models — heavier than the demo routes</span>
      </footer>

      <style jsx>{`
        .cm-wrap {
          --line: rgba(245, 228, 200, 0.12);
          --paper: #f3e9d8;
          --muted: #b6a98f;
          --faint: #8a7d65;
          --honey: #eab44d;
          --honey-2: #f6c869;
          --green: #56d39a;
          --green-deep: #2fae7d;
          --coral: #eb9166;
          --r: 20px;
          max-width: 1180px;
          margin: 0 auto;
          padding: 26px 26px 36px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          color: var(--paper);
          font-family: "Manrope", system-ui, sans-serif;
          background-image: radial-gradient(1100px 700px at 80% -12%, rgba(234, 180, 77, 0.15), transparent 60%),
            radial-gradient(900px 600px at 2% 112%, rgba(86, 211, 154, 0.1), transparent 55%);
        }
        .cm-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .cm-brand { display: flex; align-items: center; gap: 13px; }
        .cm-mark {
          width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center;
          background: linear-gradient(150deg, var(--honey-2), var(--honey)); color: #2a1d07;
          font-family: "Fraunces", "Manrope", serif; font-weight: 700; font-size: 23px;
        }
        .cm-brand b { font-family: "Fraunces", "Manrope", serif; font-weight: 600; font-size: 21px; display: block; line-height: 1; }
        .cm-brand span { color: var(--faint); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; display: block; margin-top: 4px; }
        .cm-pill {
          font-size: 13px; color: var(--muted); border: 1px solid var(--line); border-radius: 999px;
          padding: 8px 14px; display: flex; align-items: center; gap: 9px; background: rgba(255,255,255,0.02); max-width: 360px;
        }
        .cm-pill span:last-child { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cm-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--faint); flex: none; }
        .cm-dot.on { background: var(--green); }
        .cm-dot.warn { background: var(--honey); }
        .cm-main { flex: 1; display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 26px; margin-top: 30px; align-items: start; }
        @media (max-width: 920px) { .cm-main { grid-template-columns: 1fr; } }
        .cm-stage { display: flex; flex-direction: column; gap: 14px; }
        .cm-controls-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
        .cm-file {
          border: 1px dashed rgba(245,228,200,0.28); border-radius: 12px; padding: 10px 14px; cursor: pointer;
          font-family: "Fraunces","Manrope",serif; font-weight: 600; font-size: 14px; background: rgba(255,255,255,0.02);
        }
        .cm-file:hover { border-color: var(--honey); }
        .cm-file input { display: none; }
        .cm-samples { display: flex; flex-wrap: wrap; gap: 7px; }
        .cm-sample {
          appearance: none; cursor: pointer; background: rgba(255,255,255,0.04); border: 1px solid var(--line);
          color: var(--paper); font: inherit; font-weight: 600; font-size: 13px; text-transform: lowercase;
          padding: 7px 12px; border-radius: 999px; font-family: "Fraunces","Manrope",serif;
        }
        .cm-sample:hover:not(:disabled) { border-color: rgba(234,180,77,0.45); background: rgba(234,180,77,0.1); }
        .cm-sample:disabled { opacity: 0.4; cursor: not-allowed; }
        .cm-frame {
          position: relative; border-radius: var(--r); overflow: hidden; background: #0c0a07;
          border: 1px solid var(--line); aspect-ratio: 4/3; box-shadow: 0 30px 70px -30px rgba(0,0,0,0.7);
        }
        .cm-video, .cm-overlay { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
        .cm-overlay { pointer-events: none; }
        .cm-empty { position: absolute; inset: 0; display: grid; place-items: center; color: var(--faint); font-size: 14px; }
        .cm-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 5px; background: rgba(12,10,7,0.5); }
        .cm-bar span { display: block; height: 100%; background: linear-gradient(90deg, var(--honey-2), var(--honey)); transition: width 0.08s linear; }
        .cm-go {
          appearance: none; cursor: pointer; border: none; font: inherit; font-weight: 700; font-size: 17px;
          color: #241704; background: linear-gradient(150deg, var(--honey-2), var(--honey)); padding: 15px 20px;
          border-radius: 14px; box-shadow: 0 16px 34px -14px rgba(234,180,77,0.6);
        }
        .cm-go:hover:not(:disabled) { transform: translateY(-2px); }
        .cm-go:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; filter: saturate(0.55); }
        .cm-source { color: var(--faint); font-size: 12px; }
        .cm-results { display: flex; flex-direction: column; gap: 16px; }
        .cm-card { border: 1px solid var(--line); border-radius: 18px; background: rgba(255,255,255,0.02); padding: 18px 20px; }
        .cm-card.ok { border-color: rgba(86,211,154,0.4); background: rgba(86,211,154,0.06); }
        .cm-card.miss { border-color: rgba(235,145,102,0.4); background: rgba(235,145,102,0.06); }
        .cm-card-head { display: flex; align-items: baseline; gap: 10px; }
        .cm-variant {
          font-family: "Fraunces","Manrope",serif; font-weight: 600; font-size: 20px; color: var(--honey);
        }
        .cm-card.miss .cm-variant { color: var(--coral); }
        .cm-sub { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--faint); }
        .cm-pred-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 10px; }
        .cm-pred {
          font-family: "Fraunces","Manrope",serif; font-weight: 600; font-size: 34px; line-height: 1.04;
          text-transform: lowercase; background: linear-gradient(180deg, #fbf3e4, #e6d2ad);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .cm-conf { font-size: 22px; font-weight: 700; color: var(--honey); font-variant-numeric: tabular-nums; }
        .cm-verdict { margin-top: 8px; font-size: 13px; color: var(--muted); }
        .cm-verdict b { color: var(--paper); text-transform: lowercase; }
        .cm-topk { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 7px; }
        .cm-topk li {
          display: flex; align-items: center; gap: 7px; background: rgba(255,255,255,0.03); border: 1px solid var(--line);
          border-radius: 999px; padding: 5px 11px; font-size: 13px; font-family: "Fraunces","Manrope",serif; font-weight: 500; text-transform: lowercase;
        }
        .cm-topk li.lead { border-color: rgba(234,180,77,0.4); background: rgba(234,180,77,0.08); }
        .cm-topk li strong { font-family: "Manrope",sans-serif; font-weight: 700; color: var(--honey); font-size: 10.5px; font-variant-numeric: tabular-nums; text-transform: none; }
        .cm-time { margin-top: 12px; font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; }
        .cm-time.win { color: var(--green); font-weight: 600; }
        .cm-empty-card { color: var(--faint); font-size: 28px; padding: 12px 0; }
        .cm-foot {
          margin-top: 24px; display: flex; justify-content: space-between; gap: 14px; flex-wrap: wrap;
          color: var(--faint); font-size: 12px; border-top: 1px solid var(--line); padding-top: 16px;
        }
      `}</style>
    </div>
  );
}
