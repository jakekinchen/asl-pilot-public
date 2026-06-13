"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useCameraCapture } from "@/lib/use-camera-capture";
import {
  LABELS,
  FEAT,
  KEYPOINTS,
  type OrtModule,
  type OrtSession,
  type Hand,
  drawScratchOverlay,
  frameFeature,
  softmax,
} from "@/lib/scratch-pipeline";
import {
  type SimccSessions,
  type SimccFrameDebug,
  loadSimccSessions,
  runSimccFrame,
} from "@/lib/simcc-pipeline";
import {
  PRACTICE_CATALOG,
  PRACTICE_UNITS,
  vocabularyIdForLabel,
  type PracticeCatalogItem,
} from "@/lib/practice-catalog";
import {
  hintDimensionLabel,
  resolvePracticeHint,
  type PracticeHint,
} from "@/lib/practice-hints";

// ---- learner accounts + saved progress (same API as PracticeApp.tsx) -------
// Attempts persist metadata only — the payload shape is allow-listed
// server-side and any frame-like key is rejected (see api/attempts/route.ts).
type User = { id: string; email: string; name: string };
type ProgressItem = {
  vocabularyId: string;
  label: string;
  attempts: number;
  passes: number;
  fails: number;
  status: "not_started" | "in_progress" | "mastered";
  lastAttemptAt: string | null;
};
type RecentAttempt = {
  id: string;
  vocabularyId: string;
  passed: boolean;
  confidence: number;
  createdAt: string;
};

const LABEL_BY_VOCABULARY_ID = new Map(
  PRACTICE_CATALOG.map((item) => [item.vocabularyId, item.labelId]),
);
const CATALOG_INDEX_BY_VOCABULARY_ID = new Map(
  PRACTICE_CATALOG.map((item, index) => [item.vocabularyId, index]),
);
// Recorded on every saved attempt so the practice ledger names the exact
// grading model (the run10 all-scratch SimCC-w48 recognizer).
const RECOGNIZER_MODEL_ID = "recognizer-simccw48-run10";

// First-run "how it works" intro — dismissed once per browser.
const INTRO_SEEN_KEY = "asl_pilot_practice_intro_v1";

// "Signed well" practice feedback lives on this device, scoped per account.
// The server ledger stays fail-closed (no certified passes until a trained
// model card is promoted), so the demo recognizer's accepts are recorded
// locally: labelId -> accept count (>=2 counts as practice mastery).
const SIGNED_WELL_KEY_PREFIX = "asl_pilot_signed_well_v1:";

function readSignedWellRecord(scope: string): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(`${SIGNED_WELL_KEY_PREFIX}${scope}`);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const record: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const count = Number(value);
      if (Number.isFinite(count) && count > 0) record[key] = Math.floor(count);
    }
    return record;
  } catch {
    return {};
  }
}

function writeSignedWellRecord(scope: string, record: Record<string, number>) {
  try {
    window.localStorage.setItem(
      `${SIGNED_WELL_KEY_PREFIX}${scope}`,
      JSON.stringify(record),
    );
  } catch {
    /* storage unavailable — feedback stays session-only */
  }
}

function displayLabelForVocabularyId(vocabularyId: string): string {
  const index = CATALOG_INDEX_BY_VOCABULARY_ID.get(vocabularyId);
  return index === undefined ? vocabularyId : PRACTICE_CATALOG[index].label;
}

// ---------------------------------------------------------------------------
// /practice — the ALL-SCRATCH pipeline (M3JB run10, session 962). Live preview
// overlay, capture features, and the recognizer all run the from-scratch
// SimCC-w48 path (src/lib/simcc-pipeline.ts): region grid -> signing crop ->
// hands2 -> 256px hand crops -> SimCC w48 landmark student -> 90-dim per-frame
// feature -> recognizer-simccw48.onnx. No pretrained models anywhere at
// runtime (RTMPose was used offline for labels only).
//
// Fully on-device: each camera frame is processed in the browser, and a short
// feature sequence is graded against the target word.
//
// This file does not modify /tracking, /pilot, or the pre-existing
// PracticeApp.tsx (the legacy pass/fail flow).
// ---------------------------------------------------------------------------

// LABELS, FEAT, and the feature/recognition helpers come from
// @/lib/scratch-pipeline (shared verbatim with /analyze and /pilot) so the
// landmark "dialect" fed to the recognizer matches training.

// The full graded catalog: every sign the run10 recognizer can grade (95
// beginner words), joined with study metadata and a required shipped reference
// signer clip in @/lib/practice-catalog.

// Live capture is two-phase (see capture()): phase 1 grabs raw video frames
// fast over a fixed real-time window so the dense sign motion is sampled at
// camera rate; phase 2 runs the slow per-frame landmark pipeline on RECOG_FRAMES
// evenly sampled across that window. Running the pipeline INSIDE the grab loop
// throttled grabbing to ~2-3 fps, so a ~1.5s sign yielded only a few frames vs
// the 32 dense frames the recognizer trained on — that mismatch made correct
// signs rank low. Decoupling grab from inference matches training and /analyze.
const RAW_CAPTURE_MS = 2400;
const RAW_GRAB_INTERVAL_MS = 55;
const RECOG_FRAMES = 32;
// Downscale grabbed frames to bound getImageData/memory cost during the grab
// window (the pipeline resizes to small fixed inputs internally, so this does
// not change detection meaningfully).
const CAPTURE_MAX_W = 720;
const PREVIEW_FPS = 12;

// Accept rule: target must rank in the top-5 AND clear a per-class probability
// threshold. The per-class thresholds are the FAR10 operating point measured on
// the run10 SimCC-w48 cache's signer-disjoint test split: for each word, the
// softmax score over NEGATIVE clips (other-word test clips scored against this
// word) such that 10% of negatives score at or above it (same semantics as
// verification.py recall_at_far_details; mean test recall@FAR10 0.9209). They
// ship in the sidecar JSON below, generated by
// web/scripts/compute-simccw48-thresholds.py — regenerate when the recognizer
// changes. Measured honestly: run10's negatives score so low that all 95 FAR10
// thresholds sit BELOW the flat 0.003 floor, so the floor currently dominates;
// the per-class machinery stays wired for future recognizers. The floor is
// also the graceful fallback when the sidecar is missing or lacks the word.
const ACCEPT_TOPK = 5;
const ACCEPT_FLOOR = 0.003;
const THRESHOLDS_URL = "/practice/recognizer-simccw48-thresholds.json";

const ORT_WASM_PATH = "/api/ort/"; // matches client-model.ts / live-tracker.ts
// run10 SimCC-w48 transformer (M3JB, session 962 — the all-scratch gate pass):
// test recall@FAR10 0.9209 / top-1 0.5428 / top-5 0.8261, trained on features
// from the from-scratch SimCC w48 landmark student (no pretrained models at
// runtime). Identical [B,T,90]+lengths->[B,95] contract and verbatim LABELS
// order (verified at export; see recognizer-simccw48.provenance.json). To roll
// back to the RTMPose recognizer, swap this to "/analyze/recognizer-rtmpose.onnx",
// THRESHOLDS_URL to "/practice/recognizer-rtmpose-thresholds.json", and the
// pipeline imports back to rtmpose-pipeline.
const RECOGNIZER_URL = "/practice/recognizer-simccw48.onnx";

type Guess = { label: string; probability: number };
type Verdict = {
  accepted: boolean;
  targetProbability: number;
  rank: number;
  topK: Guess[];
  /** Targeted coaching hint, present on rejected attempts. */
  hint: PracticeHint | null;
};

// Overlay-only dedup: the hand detector (mirror pass) sometimes double-detects a
// single hand, so the capture overlay can draw two skeletons on one hand. Drop
// the lower-confidence twin for DISPLAY when both wrists sit on top of each other.
// (Features keep both slots to match the recognizer's training distribution.)
// Detection gate is presence > 0: the SimCC decode-score presence is ~0.01 for
// detected hands and exactly 0.0 for absent slots.
function displayHands(hands: Hand[]): Hand[] {
  if (hands.length < 2) return hands;
  const [a, b] = hands;
  const aw = a.landmarks?.[0];
  const bw = b.landmarks?.[0];
  if (
    a.probability > 0 && b.probability > 0 &&
    a.landmarks?.length === KEYPOINTS && b.landmarks?.length === KEYPOINTS && aw && bw &&
    Math.hypot(aw[0] - bw[0], aw[1] - bw[1]) < 0.18
  ) {
    return [a.probability >= b.probability ? a : b];
  }
  return hands;
}

// Hands with presence > 0 are detections in the SimCC dialect; draw them all.
// (Absent slots carry presence exactly 0.0 and all-zero landmarks — the
// epsilon keeps them off the overlay.)
const DRAW_MIN_PROBABILITY = 1e-6;

// ---- localhost debug capture ------------------------------------------------
// When the page runs on localhost (or with ?debug in the URL), each "Sign"
// attempt keeps the recognizer-fed frames with the skeleton overlay, hands2
// detector boxes/scores, and per-slot presence baked in, so phantom-hand
// detections ("hands" on empty frames, a second hand when only one is up) can
// be inspected frame by frame. Everything stays on-device; the only way frames
// leave the page is the explicit "Download bundle" button.
type DebugFrame = {
  url: string; // composited JPEG data URL (raw frame + overlay), "" on timeout
  index: number; // recognizer sequence position (0..RECOG_FRAMES-1)
  rawIndex: number; // which grabbed raw frame it came from
  presence: number[]; // per-slot SimCC presence (exactly 0 = empty slot)
  detections: { box: number[]; score: number }[]; // hands2 dets (sc-norm)
  slotDetection: number[]; // slot -> detection index (-1 = empty)
  feature: number[]; // the exact 90-dim feature row fed to the recognizer
  timedOut: boolean; // per-frame pipeline timeout -> zero feature row
};

function isDebugHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    new URLSearchParams(window.location.search).has("debug")
  );
}

// Composite one debug frame: raw video frame, then the RAW hand slots (no
// display dedup — the phantom twin must stay visible), the hands2 detector
// boxes with raw objectness scores, and a caption strip with per-slot presence.
function renderDebugFrame(
  base: HTMLCanvasElement,
  overlay: HTMLCanvasElement,
  frame: ImageData,
  res: { hands: Hand[]; cropBox: number[]; debug: SimccFrameDebug },
  label: string,
): string {
  const w = frame.width;
  const h = frame.height;
  base.width = w;
  base.height = h;
  overlay.width = w;
  overlay.height = h;
  const bctx = base.getContext("2d");
  const octx = overlay.getContext("2d");
  if (!bctx || !octx) return "";
  bctx.putImageData(frame, 0, 0);
  drawScratchOverlay(octx, w, h, res.hands, res.cropBox, DRAW_MIN_PROBABILITY);
  // Detector boxes live in signing-crop [0,1] space — map to frame coords the
  // same way the skeleton landmarks are mapped. Dashed red so they read apart
  // from the green/gold slot skeletons.
  const [cx1, cy1, cx2, cy2] = res.cropBox;
  const sx = (v: number) => (cx1 + v * (cx2 - cx1)) * w;
  const sy = (v: number) => (cy1 + v * (cy2 - cy1)) * h;
  octx.save();
  octx.setLineDash([6, 4]);
  octx.lineWidth = 2;
  octx.strokeStyle = "rgba(255,86,86,0.9)";
  octx.fillStyle = "rgba(255,86,86,0.95)";
  octx.font = `${Math.max(12, Math.round(h / 40))}px monospace`;
  res.debug.detections.forEach((d, i) => {
    const x0 = sx(d.box[0]);
    const y0 = sy(d.box[1]);
    octx.strokeRect(x0, y0, sx(d.box[2]) - x0, sy(d.box[3]) - y0);
    octx.fillText(`det${i} ${d.score.toFixed(2)}`, x0 + 3, Math.max(12, y0 - 4));
  });
  octx.restore();
  const slots = res.hands.map((hd, s) => {
    const src = res.debug.slotDetection[s];
    return `s${s}${src >= 0 ? `←det${src}` : "∅"} p=${hd.probability.toFixed(3)}`;
  });
  octx.save();
  const lh = Math.max(18, Math.round(h / 28));
  octx.fillStyle = "rgba(0,0,0,0.55)";
  octx.fillRect(0, 0, w, lh + 6);
  octx.fillStyle = "#fff";
  octx.font = `${Math.max(13, Math.round(h / 36))}px monospace`;
  octx.fillText(`${label}  ${slots.join("  ")}`, 6, lh - 2);
  octx.restore();
  bctx.drawImage(overlay, 0, 0);
  return base.toDataURL("image/jpeg", 0.85);
}

export function SignPracticeApp() {
  const camera = useCameraCapture({
    screenName: "sign practice",
    readyMessage: "Camera ready — tracking runs entirely in your browser.",
  });

  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  const recognizerRef = useRef<OrtSession | null>(null);
  const ortRef = useRef<OrtModule | null>(null);
  // The single all-scratch SimCC session set powers BOTH the live preview
  // overlay and the capture features — the same landmark dialect the
  // recognizer was trained on, and no RTMPose anywhere at runtime.
  const simccRef = useRef<SimccSessions | null>(null);
  // Per-class FAR10 accept thresholds (label -> softmax threshold), fetched once
  // alongside the recognizer. null = sidecar unavailable -> flat-floor fallback.
  const acceptThresholdsRef = useRef<Record<string, number> | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // True while the preview tracker has an inference in flight, so capture can
  // wait for it to finish before starting (no concurrent WebGPU runs).
  const previewBusyRef = useRef(false);

  const [trackerStatus, setTrackerStatus] = useState<
    "idle" | "loading" | "running" | "error"
  >("idle");
  const [trackerError, setTrackerError] = useState<string | null>(null);
  const [recognizerReady, setRecognizerReady] = useState(false);

  const [wordIndex, setWordIndex] = useState(0);
  const targetItem: PracticeCatalogItem = PRACTICE_CATALOG[wordIndex];
  const targetWord = targetItem.labelId;
  // Deep link from the lesson surface: /practice?word=<labelId|vocabularyId>.
  // Applied after mount (deferred) so server and first client render match.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("word");
    if (!param) return;
    const index = PRACTICE_CATALOG.findIndex(
      (item) => item.labelId === param || item.vocabularyId === param,
    );
    if (index < 0) return;
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) setWordIndex(index);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const unitTitle =
    PRACTICE_UNITS.find((unit) => unit.category === targetItem.category)
      ?.title ?? targetItem.category;
  // Browse-all-signs picker.
  const [pickerOpen, setPickerOpen] = useState(false);
  // Consecutive misses per word — drives hint escalation (a second cue on the
  // second miss, extra reference-video coaching from the third).
  const failStreaksRef = useRef<Map<string, number>>(new Map());
  // Demo-feedback accepts per word (labelId -> count), persisted on-device per
  // account scope. Drives the progress meter and "New word" steering. The
  // server ledger stays fail-closed, so this is explicitly practice feedback,
  // not certified mastery.
  const [demoCounts, setDemoCounts] = useState<Record<string, number>>({});

  // ---- learner account + saved progress ------------------------------------
  // Practice works as a guest; signing in saves every graded attempt
  // (metadata only) and restores mastery across sessions.
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);
  const [progressOpen, setProgressOpen] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  // First-run intro: shown until dismissed once (per browser). Opens after
  // mount (deferred, so the flip never lands synchronously in the effect) to
  // keep server and first client render identical.
  const [introOpen, setIntroOpen] = useState(false);
  useEffect(() => {
    let dismissedBefore = true;
    try {
      dismissedBefore = window.localStorage.getItem(INTRO_SEEN_KEY) === "1";
    } catch {
      /* storage unavailable — keep the intro closed */
    }
    if (dismissedBefore) return;
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) setIntroOpen(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const dismissIntro = useCallback(() => {
    setIntroOpen(false);
    try {
      window.localStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      /* storage unavailable — the intro just reappears next visit */
    }
  }, []);

  const refreshProgress = useCallback(async () => {
    const response = await fetch("/api/progress", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as {
      progress: ProgressItem[];
      recentAttempts: RecentAttempt[];
    };
    setProgress(data.progress);
    setRecentAttempts(data.recentAttempts);
  }, []);

  // Load the on-device "signed well" record for the current scope — guest on
  // mount, the account record after sign-in, back to guest after sign-out.
  useEffect(() => {
    const scope = user?.id ?? "guest";
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) setDemoCounts(readSignedWellRecord(scope));
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const recordDemoPass = useCallback(
    (labelId: string) => {
      const scope = user?.id ?? "guest";
      const current = readSignedWellRecord(scope);
      const next = { ...current, [labelId]: (current[labelId] ?? 0) + 1 };
      writeSignedWellRecord(scope, next);
      setDemoCounts(next);
    },
    [user],
  );

  // Progress rollups: the demo-feedback record (on-device) plus any certified
  // server passes (none until a trained model card is promoted — fail-closed).
  const nailed = useMemo(() => {
    const set = new Set<string>(
      Object.keys(demoCounts).filter((labelId) => demoCounts[labelId] > 0),
    );
    for (const item of progress) {
      if (item.passes > 0) {
        const labelId = LABEL_BY_VOCABULARY_ID.get(item.vocabularyId);
        if (labelId) set.add(labelId);
      }
    }
    return set;
  }, [demoCounts, progress]);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        const data = (await response.json()) as { user: User | null };
        setUser(data.user);
        if (data.user) void refreshProgress();
      } catch {
        /* account service unreachable — practice still works as a guest */
      }
    })();
  }, [refreshProgress]);

  const submitAuth = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setAuthError(null);
      setAuthNotice(null);
      setAuthBusy(true);
      try {
        const endpoint =
          authMode === "register" ? "/api/auth/register" : "/api/auth/login";
        const payload =
          authMode === "register"
            ? { email: authEmail, name: authName, password: authPassword }
            : { email: authEmail, password: authPassword };
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await response.json()) as {
          user?: User | null;
          pendingEmailVerification?: boolean;
          error?: string;
        };
        if (response.ok && data.pendingEmailVerification) {
          setAuthNotice("Check your inbox to finish creating your account.");
          setAuthPassword("");
          return;
        }
        if (!response.ok || !data.user) {
          setAuthError(data.error ?? "Unable to continue.");
          return;
        }
        setUser(data.user);
        setAuthPassword("");
        setAuthOpen(false);
        void refreshProgress();
      } catch {
        setAuthError("Unable to reach the account service.");
      } finally {
        setAuthBusy(false);
      }
    },
    [authMode, authEmail, authName, authPassword, refreshProgress],
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setProgress([]);
    setRecentAttempts([]);
    setProgressOpen(false);
    setSaveState("idle");
  }, []);

  // Persist one graded attempt (metadata only — never frames; the server
  // rejects any frame-like key). Fire-and-forget from capture().
  const persistAttempt = useCallback(
    async (input: {
      item: PracticeCatalogItem;
      accepted: boolean;
      targetProbability: number;
      predictedLabelId: string | null;
      hint: PracticeHint | null;
      frameCount: number;
    }) => {
      if (!user) return;
      setSaveState("saving");
      try {
        const response = await fetch("/api/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vocabularyId: input.item.vocabularyId,
            passed: input.accepted,
            confidence: Math.min(1, Math.max(0, input.targetProbability)),
            predictedId: input.predictedLabelId
              ? vocabularyIdForLabel(input.predictedLabelId)
              : null,
            modelId: RECOGNIZER_MODEL_ID,
            modelStatus: "trained",
            hint: input.hint
              ? `${input.hint.headline} ${input.hint.cues[0] ?? ""}`.trim().slice(0, 600)
              : "",
            reason: input.accepted ? "accepted_far10_topk" : input.hint?.reason ?? "rejected",
            durationMs: RAW_CAPTURE_MS,
            frameCount: input.frameCount,
          }),
        });
        if (!response.ok) throw new Error("save failed");
        setSaveState("saved");
        void refreshProgress();
      } catch {
        setSaveState("error");
      }
    },
    [user, refreshProgress],
  );

  const [capturing, setCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  // "ready" runs a brief get-ready countdown, "sign" grabs frames at camera rate
  // (the user signs NOW), "check" runs the landmark+recognizer pipeline.
  const [capturePhase, setCapturePhase] = useState<
    "idle" | "ready" | "sign" | "check"
  >("idle");
  const [captureCount, setCaptureCount] = useState(0);
  const [variant, setVariant] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  // The raw p / rank is debug detail, hidden behind a toggle so the learner
  // sees encouragement, not a clinical readout.
  const [showDetails, setShowDetails] = useState(false);
  const refVideoRef = useRef<HTMLVideoElement | null>(null);
  const capturingRef = useRef(false);
  // True only during phase-2 recognition, when capture needs exclusive session
  // access. The live preview pauses on THIS (not capturingRef) so the skeleton
  // keeps tracking during the phase-1 grab window.
  const recognizingRef = useRef(false);

  // Front-facing by default (cleanest read of the reference); toggle to mirror it
  // to match the selfie camera preview.
  const [refMirror, setRefMirror] = useState(false);

  // Localhost-only debug capture (see DebugFrame above). The host check runs
  // inside capture() (an event handler), so SSR never touches window; the
  // panel renders purely off debugFrames, which only fill in debug mode.
  const [debugFrames, setDebugFrames] = useState<DebugFrame[]>([]);
  const [debugZoom, setDebugZoom] = useState<number | null>(null);

  const cameraReady = camera.status === "ready";

  // --- Load the recognizer ONNX once. ---------------------------------------
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        // Fetch the per-class FAR10 threshold sidecar once, before the heavy
        // model loads. Any failure (missing file, bad JSON) just leaves the
        // flat ACCEPT_FLOOR fallback in place — never blocks the recognizer.
        try {
          const res = await fetch(THRESHOLDS_URL);
          if (res.ok) {
            const sidecar: unknown = await res.json();
            const far10 = (sidecar as { far?: { far10?: unknown } })?.far?.far10;
            if (far10 && typeof far10 === "object") {
              acceptThresholdsRef.current = far10 as Record<string, number>;
            }
          }
        } catch {
          /* sidecar unavailable — keep the flat-floor fallback */
        }
        const ort = await import("onnxruntime-web/webgpu");
        ort.env.wasm.wasmPaths = ORT_WASM_PATH;
        ort.env.wasm.numThreads = 1;
        // Quiet ORT's benign "VerifyEachNodeIsAssignedToAnEp" warning (some ops
        // fall back from WebGPU to WASM — expected, the models still run). It was
        // showing up as a scary Next.js dev "Console Error" card.
        ort.env.logLevel = "error";
        // Sequential creation (WebGPU EP forbids concurrent). Recognizer stays on
        // wasm (validated parity); the heavy per-frame models pick WebGPU when
        // available.
        const session = await ort.InferenceSession.create(RECOGNIZER_URL, {
          executionProviders: ["wasm"],
          graphOptimizationLevel: "all" as const,
          logSeverityLevel: 3,
        });
        setVariant("scratch SimCC w48");
        const simcc = await loadSimccSessions(ort);
        if (cancelled) {
          void session.release?.();
          void simcc.region.release?.();
          void simcc.hands.release?.();
          void simcc.simcc.release?.();
          return;
        }
        ortRef.current = ort;
        recognizerRef.current = session;
        simccRef.current = simcc;
        captureCanvasRef.current = document.createElement("canvas");
        setRecognizerReady(true);
      } catch (caught) {
        if (!cancelled) {
          setTrackerError(
            caught instanceof Error ? caught.message : String(caught),
          );
          setTrackerStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
      void recognizerRef.current?.release?.();
      void simccRef.current?.region.release?.();
      void simccRef.current?.hands.release?.();
      void simccRef.current?.simcc.release?.();
      recognizerRef.current = null;
      simccRef.current = null;
    };
  }, []);

  // --- Live preview loop: run the all-scratch SimCC pipeline against the
  // camera <video> and draw the skeleton overlay. Mirrors useLiveTracker's
  // single-flight, throttled RAF pattern. Uses the SAME sessions as capture
  // (single-flight via previewBusyRef keeps WebGPU runs serialized). ---------
  useEffect(() => {
    // Wait for the simcc+recognizer sessions to finish creating before running
    // the preview — WebGPU forbids concurrent session creation/runs.
    if (!cameraReady || !recognizerReady) return;
    const overlayCanvas = overlayRef.current;
    const videoRef = camera.videoRef;
    const frameCanvas = document.createElement("canvas");
    let cancelled = false;
    let raf = 0;
    let busy = false;
    let last = 0;
    const minInterval = 1000 / PREVIEW_FPS;

    function loop() {
      raf = requestAnimationFrame((t) => {
        if (cancelled) return;
        const video = videoRef.current;
        const canvas = overlayRef.current;
        const ort = ortRef.current;
        const simcc = simccRef.current;
        const fresh = t - last >= minInterval;
        // Pause the preview loop only during phase-2 recognition (recognizingRef),
        // so the skeleton keeps tracking through the phase-1 grab window.
        if (
          !recognizingRef.current &&
          video &&
          canvas &&
          ort &&
          simcc &&
          !busy &&
          video.readyState >= 2 &&
          fresh
        ) {
          busy = true;
          previewBusyRef.current = true;
          last = t;
          const w = video.videoWidth;
          const h = video.videoHeight;
          if (w && h) {
            if (canvas.width !== w || canvas.height !== h) {
              canvas.width = w;
              canvas.height = h;
            }
            if (frameCanvas.width !== w || frameCanvas.height !== h) {
              frameCanvas.width = w;
              frameCanvas.height = h;
            }
            const fctx = frameCanvas.getContext("2d", { willReadFrequently: true });
            if (!fctx) {
              busy = false;
              previewBusyRef.current = false;
            } else {
              fctx.drawImage(video, 0, 0, w, h);
              const sourceImage = fctx.getImageData(0, 0, w, h);
              runSimccFrame(ort, simcc, sourceImage)
                .then((result) => {
                  if (cancelled || !result) return;
                  const ctx = canvas.getContext("2d");
                  if (ctx) {
                    drawScratchOverlay(ctx, w, h, displayHands(result.hands), result.cropBox, DRAW_MIN_PROBABILITY);
                  }
                })
                .catch(() => {
                  /* transient per-frame error; keep looping */
                })
                .finally(() => {
                  busy = false;
                  previewBusyRef.current = false;
                });
            }
          } else {
            busy = false;
            previewBusyRef.current = false;
          }
        }
        if (!cancelled) loop();
      });
    }

    // Sessions are already created (recognizerReady gates this effect), so the
    // preview can run immediately. Deferred so the status flip never lands
    // synchronously inside the effect body.
    void Promise.resolve().then(() => {
      if (cancelled) return;
      setTrackerStatus("running");
      setTrackerError(null);
    });
    loop();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      const ctx = overlayCanvas?.getContext("2d");
      if (overlayCanvas && ctx)
        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    };
  }, [cameraReady, camera.videoRef, recognizerReady]);


  const newWord = useCallback(() => {
    if (capturingRef.current) return;
    setVerdict(null);
    setShowDetails(false);
    setWordIndex((prev) => {
      if (PRACTICE_CATALOG.length <= 1) return prev;
      // Steer toward signs not yet nailed, so the set feels like a journey.
      const indices = PRACTICE_CATALOG.map((_, i) => i).filter((i) => i !== prev);
      const fresh = indices.filter(
        (i) => !nailed.has(PRACTICE_CATALOG[i].labelId),
      );
      const pool = fresh.length ? fresh : indices;
      return pool[Math.floor(Math.random() * pool.length)];
    });
  }, [nailed]);

  // Direct selection from the browse-all-signs picker.
  const selectWord = useCallback((index: number) => {
    if (capturingRef.current) return;
    setVerdict(null);
    setShowDetails(false);
    setPickerOpen(false);
    setWordIndex(index);
  }, []);

  // Replay the reference clip ("Watch reference" after a miss).
  const watchAgain = useCallback(() => {
    const v = refVideoRef.current;
    if (v) {
      v.currentTime = 0;
      void v.play();
    }
  }, []);

  const runRecognizer = useCallback(
    async (sequence: number[][]): Promise<number[]> => {
      const ort = ortRef.current;
      const session = recognizerRef.current;
      if (!ort || !session) throw new Error("Recognizer not ready.");
      const t = sequence.length;
      const seq = new Float32Array(t * FEAT);
      sequence.forEach((feat, row) => {
        seq.set(feat, row * FEAT);
      });
      const inputs: Record<string, InstanceType<OrtModule["Tensor"]>> = {
        sequence: new ort.Tensor("float32", seq, [1, t, FEAT]),
        lengths: new ort.Tensor("int64", BigInt64Array.from([BigInt(t)]), [1]),
      };
      const out = await session.run(inputs);
      const data = out.logits.data as Float32Array;
      const logits = Array.from(data, (v) => Number(v));
      return softmax(logits);
    },
    [],
  );

  const capture = useCallback(async () => {
    const debugMode = isDebugHost();
    const ort = ortRef.current;
    const simcc = simccRef.current;
    const video = camera.videoRef.current;
    const full = captureCanvasRef.current;
    if (
      capturingRef.current ||
      !ort ||
      !simcc ||
      !recognizerReady ||
      !video ||
      !full ||
      video.readyState < 2
    ) {
      return;
    }
    capturingRef.current = true;
    setCapturing(true);
    setVerdict(null);
    setShowDetails(false);
    setSaveState("idle");
    setCaptureProgress(0);
    if (debugMode) {
      setDebugFrames([]);
      setDebugZoom(null);
    }
    // Get-ready countdown so the learner is set and their sign lands inside the
    // grab window (also helps the recognizer — it trained on trimmed signs).
    setCapturePhase("ready");
    for (let n = 3; n >= 1; n -= 1) {
      setCaptureCount(n);
      await new Promise((r) => setTimeout(r, 560));
    }
    setCapturePhase("sign");
    // Phase 1 keeps the live preview skeleton running (it does the only inference
    // while we just grab raw frames), so the tracker no longer freezes during the
    // sign. Exclusive session access is taken for phase-2 recognition below.

    const overlay = overlayRef.current;
    const octx = overlay?.getContext("2d") ?? null;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (overlay && w && h && (overlay.width !== w || overlay.height !== h)) {
      overlay.width = w;
      overlay.height = h;
    }
    // Capture canvas is downscaled; the overlay stays at full res for the skeleton.
    const scale = w ? Math.min(1, CAPTURE_MAX_W / w) : 1;
    const cw = Math.max(1, Math.round(w * scale));
    const ch = Math.max(1, Math.round(h * scale));
    full.width = cw;
    full.height = ch;
    const fctx = full.getContext("2d", { willReadFrequently: true });

    const sequence: number[][] = [];
    try {
      // Phase 1: grab raw frames at camera rate over a fixed real-time window.
      // Cheap (drawImage + getImageData only) and the preview keeps tracking, so
      // the sign is densely sampled without freezing the skeleton.
      const rawFrames: ImageData[] = [];
      if (fctx && cw && ch) {
        const grabStart = performance.now();
        let lastProgress = 0;
        while (performance.now() - grabStart < RAW_CAPTURE_MS) {
          fctx.drawImage(video, 0, 0, cw, ch);
          rawFrames.push(fctx.getImageData(0, 0, cw, ch));
          const p = 0.6 * Math.min(1, (performance.now() - grabStart) / RAW_CAPTURE_MS);
          if (p - lastProgress >= 0.05) {
            setCaptureProgress(p);
            lastProgress = p;
          }
          await new Promise((r) => setTimeout(r, RAW_GRAB_INTERVAL_MS));
        }
      }

      // Evenly sample up to RECOG_FRAMES across the window (like /analyze), so
      // the fed sequence matches the recognizer's training distribution.
      const picks =
        rawFrames.length <= RECOG_FRAMES
          ? rawFrames.map((_, i) => i)
          : Array.from({ length: RECOG_FRAMES }, (_, k) =>
              Math.round((k * (rawFrames.length - 1)) / (RECOG_FRAMES - 1)),
            );

      // Phase 2: take exclusive session access — pause the preview and let any
      // in-flight preview inference finish — then run the all-scratch SimCC
      // pipeline (region crop -> hands2 -> SimCC w48 landmarks, the dialect run10
      // trained on) + recognizer on the sampled frames.
      setCapturePhase("check");
      recognizingRef.current = true;
      for (let s = 0; s < 50 && previewBusyRef.current; s += 1) {
        await new Promise((r) => setTimeout(r, 20));
      }
      const dbgItems: DebugFrame[] = [];
      const dbgBase = debugMode ? document.createElement("canvas") : null;
      const dbgOverlay = debugMode ? document.createElement("canvas") : null;
      // Frames where the pipeline saw at least one hand — drives the
      // hands-not-visible hint (a read over mostly-empty frames is noise).
      let framesWithHands = 0;
      for (let j = 0; j < picks.length; j += 1) {
        const sourceImage = rawFrames[picks[j]];
        // Per-frame timeout: a stalled run can never freeze the whole capture.
        const res = await Promise.race([
          runSimccFrame(ort, simcc, sourceImage),
          new Promise<null>((r) => setTimeout(() => r(null), 4000)),
        ]);
        if (res) {
          if (res.hands.some((hd) => hd.probability > 0)) framesWithHands += 1;
          const feat = frameFeature(res.hands);
          sequence.push(feat);
          if (octx && overlay) {
            drawScratchOverlay(octx, overlay.width, overlay.height, displayHands(res.hands), res.cropBox, DRAW_MIN_PROBABILITY);
          }
          if (dbgBase && dbgOverlay) {
            dbgItems.push({
              url: renderDebugFrame(dbgBase, dbgOverlay, sourceImage, res, `#${j}`),
              index: j,
              rawIndex: picks[j],
              presence: res.hands.map((hd) => hd.probability),
              detections: res.debug.detections,
              slotDetection: res.debug.slotDetection,
              feature: feat,
              timedOut: false,
            });
          }
        } else {
          sequence.push(new Array(FEAT).fill(0));
          if (debugMode) {
            dbgItems.push({
              url: "",
              index: j,
              rawIndex: picks[j],
              presence: [],
              detections: [],
              slotDetection: [],
              feature: new Array(FEAT).fill(0),
              timedOut: true,
            });
          }
        }
        setCaptureProgress(0.6 + 0.4 * ((j + 1) / picks.length));
      }
      // Keep the debug frames even if the recognizer call below throws.
      if (debugMode) setDebugFrames(dbgItems);

      const probs = await runRecognizer(sequence);
      const targetIndex = (LABELS as readonly string[]).indexOf(targetWord);
      const pT = targetIndex >= 0 ? probs[targetIndex] : 0;
      let rank = 0;
      for (const p of probs) if (p > pT) rank += 1;
      // Per-class FAR10 threshold (floored at the old 0.003) when the sidecar
      // is loaded and knows this word; otherwise the legacy flat floor.
      const far10 = acceptThresholdsRef.current?.[targetWord];
      const accepted =
        rank < ACCEPT_TOPK &&
        (typeof far10 === "number"
          ? pT >= Math.max(far10, ACCEPT_FLOOR)
          : pT > ACCEPT_FLOOR);
      const topK: Guess[] = probs
        .map((probability, index) => ({ label: LABELS[index], probability }))
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 5);
      let hint: PracticeHint | null = null;
      if (accepted) {
        failStreaksRef.current.delete(targetWord);
        recordDemoPass(targetWord);
      } else {
        const failStreak = (failStreaksRef.current.get(targetWord) ?? 0) + 1;
        failStreaksRef.current.set(targetWord, failStreak);
        hint = resolvePracticeHint({
          item: targetItem,
          rank,
          acceptTopK: ACCEPT_TOPK,
          handCoverage: picks.length ? framesWithHands / picks.length : 0,
          failStreak,
        });
      }
      setVerdict({ accepted, targetProbability: pT, rank, topK, hint });
      void persistAttempt({
        item: targetItem,
        accepted,
        targetProbability: pT,
        predictedLabelId: topK[0]?.label ?? null,
        hint,
        frameCount: picks.length,
      });
    } catch (caught) {
      setTrackerError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      capturingRef.current = false;
      recognizingRef.current = false;
      setCapturing(false);
      setCaptureProgress(0);
      setCapturePhase("idle");
    }
  }, [camera.videoRef, recognizerReady, runRecognizer, targetWord, targetItem, persistAttempt, recordDemoPass]);

  // Bundle the kept frames + metadata into a single JSON download (data-URL
  // images inside), so a bad attempt can be archived/diffed offline. Local
  // file save only — nothing uploads.
  const downloadDebugBundle = useCallback(() => {
    if (!debugFrames.length) return;
    const bundle = {
      capturedAt: new Date().toISOString(),
      word: targetWord,
      verdict,
      captureMs: RAW_CAPTURE_MS,
      recogFrames: RECOG_FRAMES,
      frames: debugFrames.map(({ url, feature, ...meta }) => ({
        ...meta,
        feature: feature.map((v) => Number(v.toFixed(5))),
        image: url,
      })),
    };
    const blob = new Blob([JSON.stringify(bundle)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sign-debug-${targetWord}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [debugFrames, targetWord, verdict]);

  const tracking = trackerStatus === "running";
  const ready = cameraReady && tracking && recognizerReady;

  // Saved-progress rollups for the progress panel and review steering.
  // Attempt counts come from the durable account ledger; "signed well" and
  // practice mastery come from the on-device demo-feedback record (the server
  // keeps passes fail-closed until a trained model card is promoted).
  const attemptedCount = progress.filter((p) => p.attempts > 0).length;
  const masteredCount = Math.max(
    progress.filter((p) => p.status === "mastered").length,
    Object.values(demoCounts).filter((count) => count >= 2).length,
  );
  const reviewQueue = progress
    .filter((p) => p.attempts > 0)
    .flatMap((p) => {
      const index = CATALOG_INDEX_BY_VOCABULARY_ID.get(p.vocabularyId);
      if (index === undefined) return [];
      const item = PRACTICE_CATALOG[index];
      return nailed.has(item.labelId) ? [] : [{ item, index, fails: p.fails }];
    })
    .sort((a, b) => b.fails - a.fails)
    .slice(0, 6);

  const cameraFailed =
    camera.status === "denied" ||
    camera.status === "unsupported" ||
    camera.status === "error";
  const statusCopy = !cameraReady
    ? cameraFailed
      ? camera.message
      : "Enable your camera to begin."
    : trackerStatus === "loading"
      ? "Loading tracking models…"
      : trackerStatus === "error"
        ? `Tracking unavailable: ${trackerError ?? "model load failed"}`
        : !recognizerReady
          ? "Loading recognizer…"
          : "Live — hand tracking + recognizer running in-browser.";

  return (
    <div className="pr-wrap">
      <header className="pr-head">
        <Link className="pr-brand" href="/" title="ASL Pilot home">
          <div className="pr-mark">A</div>
          <div>
            <b>ASL&nbsp;Pilot</b>
            <span>Sign Practice</span>
          </div>
        </Link>
        <div className="pr-head-right">
          <Link className="pr-nav" href="/lesson">
            Lessons
          </Link>
          <div className="pr-pill">
            <span
              className={`pr-dot ${
                ready ? "on" : trackerStatus === "error" ? "warn" : ""
              }`}
            />
            <span>{statusCopy}</span>
          </div>
          {user ? (
            <button
              className={`pr-account ${progressOpen ? "on" : ""}`}
              type="button"
              onClick={() => setProgressOpen((o) => !o)}
              title="Your saved practice history"
              data-testid="practice-account"
            >
              {user.name.trim().split(/\s+/)[0] || user.email}{" "}
              {progressOpen ? "▴" : "▾"}
            </button>
          ) : (
            <button
              className={`pr-account ${authOpen ? "on" : ""}`}
              type="button"
              onClick={() => setAuthOpen((o) => !o)}
              data-testid="practice-signin"
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      {introOpen ? (
        <section className="pr-panel pr-intro" data-testid="practice-intro">
          <div className="pr-panel-head">
            <b>Welcome — here&apos;s how practice works</b>
          </div>
          <ol className="pr-intro-steps">
            <li>
              <b>See the sign.</b> Watch the reference video first; open notes
              only when you want written form cues.
            </li>
            <li>
              <b>Sign it on camera.</b> Press <i>Sign</i>, wait for the 3-2-1
              countdown, then perform the sign once, clearly.
            </li>
            <li>
              <b>Get feedback.</b> A clear pass — or a targeted tip on what to
              adjust. Retry as often as you like; missing is part of learning.
            </li>
          </ol>
          <p className="pr-intro-privacy">
            Recognition runs entirely in your browser — camera video never
            leaves your device. Create a free account if you&apos;d like your
            progress saved between visits.
          </p>
          <div className="pr-result-actions">
            <button className="pr-mini primary" type="button" onClick={dismissIntro}>
              Got it — let&apos;s sign
            </button>
          </div>
        </section>
      ) : null}

      {authOpen && !user ? (
        <section className="pr-panel" data-testid="practice-auth-panel">
          <div className="pr-panel-head">
            <b>
              {authMode === "register"
                ? "Create your free account"
                : "Welcome back"}
            </b>
            <span>
              An account saves your practice history and mastery across
              sessions. It stores attempt results only — your camera video
              never leaves this browser.
            </span>
          </div>
          <form className="pr-auth-form" onSubmit={(e) => void submitAuth(e)}>
            <input
              type="email"
              required
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
            />
            {authMode === "register" ? (
              <input
                type="text"
                required
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                placeholder="Name"
                autoComplete="name"
              />
            ) : null}
            <input
              type="password"
              required
              minLength={8}
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Password (8+ characters)"
              autoComplete={
                authMode === "register" ? "new-password" : "current-password"
              }
            />
            <button className="pr-mini primary" type="submit" disabled={authBusy}>
              {authBusy
                ? "One moment…"
                : authMode === "register"
                  ? "Create account"
                  : "Sign in"}
            </button>
            <button
              className="pr-mini ghost"
              type="button"
              onClick={() => {
                setAuthMode((m) => (m === "register" ? "login" : "register"));
                setAuthError(null);
                setAuthNotice(null);
              }}
            >
              {authMode === "register"
                ? "I already have an account"
                : "New here? Create one"}
            </button>
          </form>
          {authError ? <p className="pr-auth-msg err">{authError}</p> : null}
          {authNotice ? <p className="pr-auth-msg">{authNotice}</p> : null}
        </section>
      ) : null}

      {progressOpen && user ? (
        <section className="pr-panel" data-testid="practice-progress-panel">
          <div className="pr-panel-head">
            <b>Your progress</b>
            <span>
              Signed in as {user.email} — attempts save to your account
              automatically; pass feedback is computed in your browser.
            </span>
          </div>
          <div className="pr-prog-stats">
            <span>
              <b>{attemptedCount}</b> attempted
            </span>
            <span>
              <b>{nailed.size}</b> signed well
            </span>
            <span>
              <b>{masteredCount}</b> mastered
            </span>
            <span>
              <b>{PRACTICE_CATALOG.length}</b> in the catalog
            </span>
          </div>
          {reviewQueue.length ? (
            <div className="pr-prog-review">
              <span className="pr-picker-title">Worth another try</span>
              <div className="pr-picker-words">
                {reviewQueue.map(({ item, index, fails }) => (
                  <button
                    key={item.labelId}
                    type="button"
                    className="pr-pick"
                    onClick={() => {
                      setProgressOpen(false);
                      selectWord(index);
                    }}
                  >
                    ↻ {item.label}
                    <i>
                      {fails} miss{fails === 1 ? "" : "es"}
                    </i>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {recentAttempts.length ? (
            <div className="pr-prog-recent">
              <span className="pr-picker-title">Saved practice history</span>
              <ul>
                {recentAttempts.slice(0, 8).map((attempt) => (
                  <li key={attempt.id}>
                    <i className={attempt.passed ? "ok" : ""}>
                      {attempt.passed ? "✓" : "↻"}
                    </i>
                    <span>{displayLabelForVocabularyId(attempt.vocabularyId)}</span>
                    <time>
                      {new Date(attempt.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </li>
                ))}
              </ul>
              <span className="pr-prog-note">
                Pass marks come from the on-device practice recognizer —
                helpful feedback for self-checking, not a certified assessment.
              </span>
            </div>
          ) : (
            <p className="pr-prog-empty">
              No saved attempts yet — sign a word below and it lands here.
            </p>
          )}
          <button
            className="pr-mini ghost"
            type="button"
            onClick={() => void logout()}
          >
            Sign out
          </button>
        </section>
      ) : null}

      <section className="pr-hero" style={{ animationDelay: "40ms" }}>
        <div className="pr-eyebrow">
          <span>Sign this word</span>
          <span className="pr-unit">{unitTitle}</span>
          <span className="pr-count">
            {String(wordIndex + 1).padStart(2, "0")}
            <i>/</i>
            {String(PRACTICE_CATALOG.length).padStart(2, "0")}
          </span>
        </div>
        <h1 className="pr-word">{targetItem.label}</h1>
        <p className="pr-hint">
          Watch the reference video, then perform the sign once — clearly, with
          your hand(s) in frame.
        </p>
        <button
          className="pr-browse"
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          disabled={capturing}
          aria-expanded={pickerOpen}
        >
          {pickerOpen
            ? "▴ Close the sign list"
            : `▾ Browse all ${PRACTICE_CATALOG.length} signs`}
        </button>
        {pickerOpen ? (
          <nav className="pr-picker" aria-label="All practice signs">
            {PRACTICE_UNITS.map((unit) => (
              <div key={unit.category} className="pr-picker-unit">
                <span className="pr-picker-title">
                  {unit.title}
                  <i>
                    {unit.items.filter((item) => nailed.has(item.labelId)).length}
                    /{unit.items.length}
                  </i>
                </span>
                <div className="pr-picker-words">
                  {unit.items.map((item) => {
                    const index = PRACTICE_CATALOG.indexOf(item);
                    return (
                      <button
                        key={item.labelId}
                        type="button"
                        className={`pr-pick ${index === wordIndex ? "current" : ""} ${
                          nailed.has(item.labelId) ? "done" : ""
                        }`}
                        onClick={() => selectWord(index)}
                      >
                        {nailed.has(item.labelId) ? "✓ " : ""}
                        {item.label}
                        <i title="Has a reference video" aria-label="has a reference video">
                          ▸
                        </i>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        ) : null}
      </section>

      <main className="pr-stages">
        {/* Left stage — the reference signer (real PopSign clip, CC BY 4.0). */}
        <section className="pr-stage" id="pr-reference" style={{ animationDelay: "120ms" }}>
          <div className="pr-stage-head">
            <span className="pr-stage-label">
              <span className="pr-dot on" />{" "}
              Reference video
            </span>
            <div className="pr-stage-tools">
              <button
                type="button"
                className={`pr-mirror ${refMirror ? "on" : ""}`}
                onClick={() => setRefMirror((m) => !m)}
                title={refMirror ? "Mirrored — tap for a front view" : "Front view — tap to mirror"}
              >
                ⇄ {refMirror ? "Mirrored" : "Front view"}
              </button>
            </div>
          </div>
          <div className="pr-screen">
            <video
              key={targetWord}
              ref={refVideoRef}
              className="pr-refvid"
              src={targetItem.clipUrl}
              autoPlay
              loop
              muted
              playsInline
              style={{ transform: refMirror ? "scaleX(-1)" : undefined }}
            />
            <span className="pr-credit">PopSign · CC BY 4.0</span>
          </div>
        </section>

        {/* Right stage — your camera */}
        <section className="pr-stage" style={{ animationDelay: "200ms" }}>
          <div className="pr-stage-head">
            <span className="pr-stage-label">
              <span className={`pr-dot ${cameraReady ? "on" : ""}`} />
              {cameraReady ? "Your camera" : "Your camera"}
            </span>
            {cameraReady ? (
              <button className="pr-mirror" type="button" onClick={camera.stopCamera}>
                ⏻ Stop
              </button>
            ) : (
              <span className="pr-stage-hint">on-device</span>
            )}
          </div>
          <div className="pr-screen pr-screen-cam" data-status={camera.status}>
            <video ref={camera.videoRef} playsInline muted data-testid="practice-video" />
            <canvas ref={overlayRef} className="pr-overlay" aria-hidden="true" />
            <div className="pr-scrim" />
            {!cameraReady ? (
              <button
                className="pr-cam-empty"
                type="button"
                onClick={() => void camera.startCamera()}
              >
                <span className="pr-cam-empty-content">
                  <svg
                    width="42"
                    height="42"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    aria-hidden="true"
                  >
                    <path d="M15 10l4.55-2.27A1 1 0 0121 8.62v6.76a1 1 0 01-1.45.89L15 14M5 6h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
                  </svg>
                  <span className="pr-cam-empty-copy">
                    <span className="pr-cta">
                      {cameraFailed ? "Camera unavailable — retry" : "Enable camera"}
                    </span>
                    <small>
                      {cameraFailed ? camera.message : "Video never leaves your device"}
                    </small>
                  </span>
                </span>
              </button>
            ) : null}
            {capturing && capturePhase === "ready" ? (
              <div className="pr-countdown" aria-hidden="true">
                <span key={captureCount}>{captureCount}</span>
              </div>
            ) : null}
            {capturing && capturePhase !== "ready" ? (
              <div className="pr-capture-overlay">
                <div
                  className={`pr-capture-cue ${capturePhase === "sign" ? "go" : ""}`}
                >
                  {capturePhase === "sign" ? "Sign now" : "Reading your sign…"}
                </div>
                <div className="pr-capture-bar" aria-hidden="true">
                  <span style={{ width: `${Math.round(captureProgress * 100)}%` }} />
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <div className="pr-action" style={{ animationDelay: "280ms" }}>
        <button
          className="pr-ghost"
          type="button"
          onClick={newWord}
          disabled={capturing}
        >
          ↻ New word
        </button>
        <button
          id="pr-capture"
          className="pr-sign"
          type="button"
          disabled={!ready || capturing}
          onClick={() => void capture()}
        >
          {capturing ? (
            capturePhase === "ready" ? (
              "Get ready…"
            ) : capturePhase === "check" ? (
              "Reading…"
            ) : (
              "Signing…"
            )
          ) : (
            <>
              Sign <span className="pr-lower">{targetItem.label}</span>
            </>
          )}
        </button>
        <span
          className="pr-action-meta"
          title={`${nailed.size} of ${PRACTICE_CATALOG.length} signed well`}
        >
          <span className="pr-progress-track" aria-hidden="true">
            <i
              style={{
                width: `${Math.round((nailed.size / PRACTICE_CATALOG.length) * 100)}%`,
              }}
            />
          </span>
          {nailed.size === PRACTICE_CATALOG.length
            ? "all signs nailed"
            : `${nailed.size} of ${PRACTICE_CATALOG.length} nailed`}
        </span>
      </div>

      <div
        className={`pr-result ${
          verdict ? (verdict.accepted ? "show accept" : "show reject") : ""
        }`}
      >
        {verdict ? (
          <div className="pr-result-inner">
            <div className="pr-badge">{verdict.accepted ? "✓" : "↻"}</div>
            <div className="pr-result-body">
              <div className="pr-verdict-line">
                {verdict.accepted ? "Nailed it" : "Not quite"}
              </div>
              <div className="pr-result-sub">
                {verdict.accepted
                  ? "That read clearly. Ready for the next one?"
                  : verdict.hint?.headline ??
                    "Almost — keep both hands in frame and give it another go."}
              </div>
              {!verdict.accepted && verdict.hint ? (
                <div className="pr-result-hint" data-testid="practice-hint">
                  <span className="pr-hint-dim">
                    Tip · {hintDimensionLabel(verdict.hint.dimension)}
                  </span>
                  {verdict.hint.cues.map((cue) => (
                    <p key={cue}>{cue}</p>
                  ))}
                  {verdict.hint.suggestReferenceReview ? (
                    <p className="pr-hint-study">
                      Watch the reference video once more, then try again.
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div className="pr-result-actions">
                {verdict.accepted ? (
                  <button className="pr-mini primary" type="button" onClick={newWord}>
                    Next word →
                  </button>
                ) : (
                  <>
                    <button
                      className="pr-mini primary"
                      type="button"
                      disabled={!ready || capturing}
                      onClick={() => void capture()}
                    >
                      Try again
                    </button>
                    <button className="pr-mini" type="button" onClick={watchAgain}>
                      Watch reference
                    </button>
                    <button className="pr-mini" type="button" onClick={newWord}>
                      Skip
                    </button>
                  </>
                )}
                <button
                  className="pr-mini ghost"
                  type="button"
                  onClick={() => setShowDetails((s) => !s)}
                >
                  {showDetails ? "Hide details" : "Details"}
                </button>
              </div>
              {user ? (
                saveState === "idle" ? null : (
                  <div
                    className="pr-save-line"
                    data-testid="practice-save-line"
                  >
                    <span className={`pr-save-status ${saveState}`}>
                      <span className="pr-save-dot" aria-hidden="true" />
                      {saveState === "saving"
                        ? "Saving to your history…"
                        : saveState === "saved"
                          ? "Saved to your practice history"
                          : "Couldn’t save this attempt — practice continues"}
                    </span>
                  </div>
                )
              ) : (
                <div className="pr-save-line" data-testid="practice-save-line">
                  <span className="pr-save-prompt">
                    Practicing as a guest — sign in to save your progress.
                  </span>
                  <button
                    type="button"
                    className="pr-save-cta"
                    onClick={() => {
                      setAuthOpen(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Sign in
                  </button>
                </div>
              )}
              {showDetails ? (
                <div className="pr-result-details">
                  <code>
                    confidence p={verdict.targetProbability.toFixed(3)} · rank #
                    {verdict.rank + 1} of {LABELS.length}
                  </code>
                  <span>
                    Practice feedback to help you self-check — not a validated
                    grade or an official assessment.
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {debugFrames.length > 0 ? (
        <section className="pr-debug">
          <div className="pr-debug-head">
            <span className="pr-debug-title">
              Debug capture · {debugFrames.length} frames · localhost only
            </span>
            <div className="pr-debug-actions">
              <button className="pr-mini" type="button" onClick={downloadDebugBundle}>
                ⬇ Download bundle
              </button>
              <button
                className="pr-mini ghost"
                type="button"
                onClick={() => {
                  setDebugFrames([]);
                  setDebugZoom(null);
                }}
              >
                Clear
              </button>
            </div>
          </div>
          <p className="pr-debug-note">
            Frames shown un-mirrored (the model&apos;s view), with RAW hand slots —
            no display dedup, so a phantom second hand stays visible. Red dashed
            boxes = hands2 detections with raw objectness scores (the pick gate
            is score &gt; 0); green/gold skeletons = SimCC slots with presence p.
            Click a frame to enlarge. Nothing uploads — the bundle saves locally.
          </p>
          {debugZoom != null && debugFrames[debugZoom] ? (
            <div className="pr-debug-zoom" onClick={() => setDebugZoom(null)}>
              {debugFrames[debugZoom].url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={debugFrames[debugZoom].url} alt={`debug frame ${debugZoom}`} />
              ) : (
                <span>frame timed out — zero feature row was fed</span>
              )}
              <code>
                frame #{debugFrames[debugZoom].index} · raw grab{" "}
                {debugFrames[debugZoom].rawIndex} · presence [
                {debugFrames[debugZoom].presence.map((p) => p.toFixed(3)).join(", ")}] ·
                det scores [
                {debugFrames[debugZoom].detections.map((d) => d.score.toFixed(2)).join(", ")}]
              </code>
            </div>
          ) : null}
          <div className="pr-debug-strip">
            {debugFrames.map((f, i) => (
              <button
                key={i}
                type="button"
                className={`pr-debug-cell ${debugZoom === i ? "on" : ""}`}
                onClick={() => setDebugZoom(debugZoom === i ? null : i)}
              >
                {f.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt={`debug frame ${i}`} loading="lazy" />
                ) : (
                  <span className="pr-debug-missing">⏱</span>
                )}
                <code>
                  #{i} ·{" "}
                  {f.timedOut
                    ? "timeout"
                    : f.detections.length === 0
                      ? "no det"
                      : f.detections.map((d) => d.score.toFixed(2)).join(" / ")}
                </code>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="pr-foot">
        <span className="pr-tag">
          <span className="pr-dot on" /> Runs entirely on-device — no video leaves
          your browser
        </span>
        <button
          className="pr-foot-link"
          type="button"
          onClick={() => setIntroOpen(true)}
        >
          How it works
        </button>
        <span>All-scratch tracking + recognizer{variant ? ` · ${variant}` : ""} · no pretrained models</span>
      </footer>

      <style jsx>{`
        .pr-wrap {
          --ink: #15120e;
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
          background-image: radial-gradient(
              1100px 700px at 80% -12%,
              rgba(234, 180, 77, 0.16),
              transparent 60%
            ),
            radial-gradient(
              900px 600px at 2% 112%,
              rgba(86, 211, 154, 0.1),
              transparent 55%
            );
        }
        .pr-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .pr-brand {
          display: flex;
          align-items: center;
          gap: 13px;
          text-decoration: none;
          color: inherit;
        }
        .pr-nav {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
          text-decoration: none;
          padding: 8px 4px;
          transition: color 0.2s ease;
        }
        .pr-nav:hover {
          color: var(--honey-2);
        }
        .pr-mark {
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
          box-shadow: 0 8px 22px -8px rgba(234, 180, 77, 0.6);
        }
        .pr-brand b {
          font-family: "Fraunces", "Manrope", serif;
          font-weight: 600;
          font-size: 21px;
          letter-spacing: 0.2px;
          display: block;
          line-height: 1;
        }
        .pr-brand span {
          color: var(--faint);
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          display: block;
          margin-top: 4px;
        }
        .pr-pill {
          font-size: 13px;
          color: var(--muted);
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          gap: 9px;
          background: rgba(255, 255, 255, 0.02);
          max-width: 340px;
        }
        .pr-pill span:last-child {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pr-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--faint);
          flex: none;
          transition: 0.3s;
        }
        .pr-dot.on {
          background: var(--green);
          animation: pr-pulse 2.2s infinite;
        }
        .pr-dot.warn {
          background: var(--honey);
        }
        @keyframes pr-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(86, 211, 154, 0.45);
          }
          70% {
            box-shadow: 0 0 0 7px rgba(86, 211, 154, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(86, 211, 154, 0);
          }
        }
        .pr-main {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          align-items: start;
          margin-top: 32px;
        }
        @media (max-width: 900px) {
          .pr-main {
            grid-template-columns: 1fr;
            gap: 22px;
          }
        }
        .pr-prompt {
          background: linear-gradient(170deg, var(--card), var(--ink-2));
          border: 1px solid var(--line);
          border-radius: var(--r);
          padding: 38px 36px;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow);
          position: relative;
          overflow: hidden;
        }
        .pr-prompt::before {
          content: "";
          position: absolute;
          right: -70px;
          top: -70px;
          width: 240px;
          height: 240px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(234, 180, 77, 0.18),
            transparent 70%
          );
        }
        .pr-eyebrow {
          font-size: 12.5px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--honey);
          font-weight: 600;
        }
        .pr-word {
          font-family: "Fraunces", "Manrope", serif;
          font-weight: 600;
          font-size: clamp(56px, 8.5vw, 104px);
          line-height: 0.94;
          margin: 16px 0 8px;
          letter-spacing: -0.01em;
          background: linear-gradient(180deg, #fbf3e4, #e6d2ad);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-transform: lowercase;
          word-break: break-word;
        }
        .pr-hint {
          color: var(--muted);
          font-size: 15px;
          max-width: 33ch;
        }
        .pr-hint b {
          color: var(--paper);
          font-weight: 600;
        }
        .pr-prompt-foot {
          margin-top: auto;
          padding-top: 28px;
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .pr-ghost {
          appearance: none;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--line);
          color: var(--paper);
          font: inherit;
          font-weight: 600;
          font-size: 14px;
          padding: 11px 16px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          transition: 0.18s;
        }
        .pr-ghost:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(245, 228, 200, 0.25);
        }
        .pr-ghost:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .pr-progress {
          margin-left: auto;
          font-size: 13px;
          color: var(--faint);
        }
        .pr-progress b {
          color: var(--honey);
          font-variant-numeric: tabular-nums;
        }
        .pr-ref {
          margin: 20px 0 4px;
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--line);
          background: #0c0a07;
          box-shadow: 0 18px 40px -24px rgba(0, 0, 0, 0.8);
        }
        .pr-ref video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .pr-reflabel {
          position: absolute;
          left: 12px;
          bottom: 11px;
          font-size: 10.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--paper);
          background: rgba(12, 10, 7, 0.55);
          backdrop-filter: blur(6px);
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 5px 11px;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .pr-reflabel .pr-dot {
          width: 6px;
          height: 6px;
        }
        .pr-mirror {
          position: absolute;
          right: 12px;
          bottom: 11px;
          appearance: none;
          cursor: pointer;
          font: inherit;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: var(--paper);
          background: rgba(12, 10, 7, 0.55);
          backdrop-filter: blur(6px);
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 5px 11px;
          transition: 0.16s;
        }
        .pr-mirror:hover {
          border-color: rgba(245, 228, 200, 0.28);
        }
        .pr-mirror.on {
          color: var(--honey);
          border-color: rgba(234, 180, 77, 0.4);
        }
        .pr-stage {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .pr-frame {
          position: relative;
          border-radius: var(--r);
          overflow: hidden;
          background: #0c0a07;
          border: 1px solid var(--line);
          aspect-ratio: 3 / 4;
          box-shadow: var(--shadow);
        }
        .pr-frame video,
        .pr-overlay {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1);
        }
        .pr-overlay {
          pointer-events: none;
        }
        .pr-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            transparent 60%,
            rgba(10, 8, 5, 0.5)
          );
          pointer-events: none;
        }
        .pr-chip {
          position: absolute;
          left: 14px;
          top: 14px;
          z-index: 3;
          font-size: 12.5px;
          color: var(--paper);
          background: rgba(12, 10, 7, 0.55);
          backdrop-filter: blur(8px);
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 7px 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pr-cam-empty {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          text-align: center;
          padding: 30px;
          color: var(--muted);
          cursor: pointer;
          z-index: 4;
          border: none;
          font: inherit;
          background: radial-gradient(
            circle at 50% 45%,
            rgba(36, 29, 21, 0.4),
            rgba(12, 10, 7, 0.85)
          );
          transition: 0.2s;
        }
        .pr-cam-empty:hover {
          color: var(--paper);
        }
        .pr-cam-empty-content {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          max-width: min(260px, 86%);
        }
        .pr-cam-empty svg {
          flex: 0 0 auto;
          opacity: 0.55;
        }
        .pr-cam-empty-copy {
          display: grid;
          gap: 4px;
          text-align: left;
        }
        .pr-cta {
          display: block;
          font-family: "Fraunces", "Manrope", serif;
          font-weight: 600;
          font-size: 19px;
          color: var(--paper);
        }
        .pr-cam-empty small {
          display: block;
          margin-top: 6px;
          color: var(--faint);
        }
        .pr-capture-bar {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 5px;
          background: rgba(12, 10, 7, 0.5);
          z-index: 4;
        }
        .pr-capture-bar span {
          display: block;
          height: 100%;
          background: linear-gradient(90deg, var(--honey-2), var(--honey));
          transition: width 0.1s linear;
        }
        .pr-controls {
          display: flex;
          gap: 14px;
        }
        #pr-capture {
          flex: 1;
          appearance: none;
          cursor: pointer;
          border: none;
          font: inherit;
          font-weight: 700;
          font-size: 18px;
          color: #241704;
          background: linear-gradient(150deg, var(--honey-2), var(--honey));
          padding: 18px 22px;
          border-radius: 16px;
          box-shadow: 0 16px 34px -14px rgba(234, 180, 77, 0.65);
          transition: 0.16s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 11px;
        }
        #pr-capture:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 22px 42px -14px rgba(234, 180, 77, 0.72);
        }
        #pr-capture:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
          filter: saturate(0.55);
        }
        .pr-lower {
          text-transform: lowercase;
          font-family: "Fraunces", "Manrope", serif;
          font-weight: 600;
        }
        .pr-result {
          border: 1px solid var(--line);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.02);
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transition: max-height 0.45s cubic-bezier(0.2, 0.9, 0.2, 1),
            opacity 0.35s;
        }
        .pr-result.show {
          max-height: 160px;
          opacity: 1;
        }
        .pr-result-inner {
          padding: 18px 22px;
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .pr-badge {
          width: 58px;
          height: 58px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          flex: none;
          font-size: 28px;
          font-weight: 800;
          transform: scale(0.5);
          transition: transform 0.42s cubic-bezier(0.2, 1.6, 0.4, 1);
          background: rgba(255, 255, 255, 0.06);
          color: var(--muted);
        }
        .pr-result.show .pr-badge {
          transform: scale(1);
        }
        .pr-verdict-line {
          font-family: "Fraunces", "Manrope", serif;
          font-weight: 600;
          font-size: 24px;
          line-height: 1.05;
        }
        .pr-result-sub {
          color: var(--muted);
          font-size: 13.5px;
          margin-top: 3px;
          font-variant-numeric: tabular-nums;
        }
        .pr-capture-cue {
          text-align: center;
          font-weight: 600;
          font-size: 15px;
          letter-spacing: 0.01em;
          color: var(--muted);
          margin-bottom: 6px;
        }
        .pr-capture-cue.go {
          color: var(--green, #4ade80);
        }
        .pr-result-note {
          color: var(--muted);
          font-size: 11.5px;
          line-height: 1.3;
          margin-top: 8px;
          opacity: 0.8;
          max-width: 34ch;
        }
        .pr-result.accept .pr-badge {
          background: linear-gradient(150deg, var(--green), var(--green-deep));
          color: #04261a;
          box-shadow: 0 12px 30px -10px rgba(86, 211, 154, 0.6);
        }
        .pr-result.accept .pr-verdict-line {
          color: #aef0d2;
        }
        .pr-result.reject .pr-badge {
          background: linear-gradient(150deg, #f0b48f, var(--coral));
          color: #3a1c0c;
        }
        .pr-result.reject .pr-verdict-line {
          color: #f4c8ad;
        }
        .pr-guesses {
          margin-top: 2px;
        }
        .pr-lbl {
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--faint);
          margin-bottom: 10px;
        }
        .pr-topk {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pr-topk li {
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
        .pr-topk li strong {
          font-family: "Manrope", sans-serif;
          font-weight: 700;
          color: var(--honey);
          font-size: 11px;
          font-variant-numeric: tabular-nums;
          text-transform: none;
        }
        .pr-topk li:first-child:not(.pr-empty) {
          border-color: rgba(234, 180, 77, 0.4);
          background: rgba(234, 180, 77, 0.08);
        }
        .pr-topk li.pr-empty {
          color: var(--faint);
          font-size: 13.5px;
          background: none;
          border: none;
          font-family: "Manrope", sans-serif;
          text-transform: none;
          padding: 0;
        }
        .pr-foot {
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
        .pr-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .pr-foot-link {
          font-family: inherit;
          font-size: 12.5px;
          color: var(--faint);
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
          text-decoration-color: rgba(245, 228, 200, 0.25);
          transition: color 0.18s ease;
        }
        .pr-foot-link:hover {
          color: var(--muted);
        }

        /* ============================================================
           Elite layout pass — editorial header, twin stages, action.
           Appended last so it wins over the legacy rules by source order.
           ============================================================ */
        @keyframes pr-rise {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        @media (prefers-reduced-motion: no-preference) {
          .pr-hero,
          .pr-stages > .pr-stage,
          .pr-action {
            animation: pr-rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
          }
        }

        /* subtle film grain over the whole canvas */
        .pr-wrap::after {
          content: "";
          position: fixed;
          inset: 0;
          z-index: 60;
          pointer-events: none;
          opacity: 0.045;
          mix-blend-mode: soft-light;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 160px 160px;
        }

        /* ---- editorial header band ---- */
        .pr-hero {
          margin-top: 30px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pr-hero .pr-eyebrow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin: 0;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 11.5px;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .pr-hero .pr-count {
          letter-spacing: 0.18em;
          color: var(--muted);
        }
        .pr-hero .pr-count i {
          font-style: normal;
          margin: 0 4px;
          color: var(--faint);
        }
        .pr-hero .pr-word {
          margin: 0;
          font-family: var(--font-display, serif);
          font-weight: 500;
          font-size: clamp(56px, 9vw, 112px);
          line-height: 0.92;
          letter-spacing: -0.02em;
          color: var(--paper);
          text-transform: lowercase;
        }
        .pr-hero .pr-hint {
          margin: 2px 0 0;
          max-width: 52ch;
          font-size: 15px;
          line-height: 1.5;
          color: var(--muted);
        }

        /* ---- twin stages ---- */
        .pr-stages {
          flex: 0 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 22px;
          margin-top: 26px;
          align-items: start;
        }
        .pr-stage {
          display: flex;
          flex-direction: column;
          gap: 11px;
          min-width: 0;
        }
        .pr-stage-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 0 2px;
          min-height: 30px;
        }
        .pr-stage-label {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 11px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .pr-stage-hint {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 10.5px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .pr-screen {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid var(--line);
          background: #0c0a07;
          box-shadow:
            0 26px 60px -34px rgba(0, 0, 0, 0.9),
            inset 0 0 0 1px rgba(255, 240, 214, 0.02);
          isolation: isolate;
        }
        .pr-screen .pr-refvid,
        .pr-screen-cam video,
        .pr-screen-cam .pr-overlay {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .pr-screen-cam video,
        .pr-screen-cam .pr-overlay {
          transform: scaleX(-1);
        }
        .pr-screen-cam .pr-overlay {
          pointer-events: none;
          z-index: 2;
        }
        .pr-screen .pr-credit {
          position: absolute;
          left: 12px;
          bottom: 12px;
          z-index: 3;
          margin: 0;
          font-size: 10.5px;
          letter-spacing: 0.04em;
          color: rgba(243, 233, 216, 0.82);
          background: rgba(12, 10, 7, 0.5);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(245, 228, 200, 0.12);
          border-radius: 999px;
          padding: 5px 11px;
        }

        /* capture cue overlay (bottom of the camera screen) */
        .pr-capture-overlay {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 4;
          padding: 14px 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 9px;
          background: linear-gradient(transparent, rgba(8, 6, 4, 0.72));
        }
        .pr-capture-overlay .pr-capture-cue {
          margin: 0;
          text-align: center;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 12.5px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .pr-capture-overlay .pr-capture-cue.go {
          color: var(--honey-2);
          text-shadow: 0 0 22px rgba(246, 200, 105, 0.45);
        }
        .pr-capture-overlay .pr-capture-bar {
          height: 4px;
          border-radius: 999px;
          background: rgba(245, 228, 200, 0.16);
          overflow: hidden;
        }
        .pr-capture-overlay .pr-capture-bar span {
          display: block;
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, var(--honey), var(--honey-2));
          transition: width 0.12s linear;
        }

        /* mirror / stop toggles in the stage head */
        .pr-stage-head .pr-mirror {
          position: static;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 10.5px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
          background: transparent;
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 6px 12px;
          cursor: pointer;
          transition:
            color 0.18s ease,
            border-color 0.18s ease,
            background 0.18s ease;
        }
        .pr-stage-head .pr-mirror:hover {
          color: var(--paper);
          border-color: rgba(245, 228, 200, 0.3);
        }
        .pr-stage-head .pr-mirror.on {
          color: var(--ink);
          background: var(--paper);
          border-color: var(--paper);
        }

        /* ---- action row ---- */
        .pr-action {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 18px;
          margin-top: 26px;
        }
        .pr-action .pr-ghost {
          justify-self: start;
        }
        .pr-action .pr-action-meta {
          justify-self: end;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--faint);
        }
        .pr-action .pr-action-meta b {
          color: var(--muted);
        }
        .pr-sign {
          justify-self: center;
          min-width: 250px;
          padding: 17px 40px;
          border: none;
          border-radius: 16px;
          font-family: var(--font-body, sans-serif);
          font-size: 17px;
          font-weight: 650;
          letter-spacing: 0.01em;
          color: #2a1d08;
          background: linear-gradient(160deg, var(--honey-2), var(--honey));
          box-shadow:
            0 14px 34px -12px rgba(234, 180, 77, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
          cursor: pointer;
          transition:
            transform 0.16s cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 0.2s ease,
            filter 0.2s ease;
        }
        .pr-sign .pr-lower {
          font-family: var(--font-display, serif);
          font-style: italic;
          font-weight: 500;
        }
        .pr-sign:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow:
            0 20px 44px -12px rgba(234, 180, 77, 0.68),
            inset 0 1px 0 rgba(255, 255, 255, 0.45);
        }
        .pr-sign:active:not(:disabled) {
          transform: translateY(0) scale(0.99);
        }
        .pr-sign:disabled {
          cursor: not-allowed;
          filter: saturate(0.35) brightness(0.7);
          box-shadow: none;
        }

        /* ---- result (full width, centered) ---- */
        .pr-result {
          margin: 18px auto 0;
          max-width: 560px;
          width: 100%;
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition:
            max-height 0.5s cubic-bezier(0.16, 1, 0.3, 1),
            opacity 0.4s ease;
        }
        .pr-result.show {
          max-height: 360px;
          opacity: 1;
        }
        .pr-result .pr-result-inner {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 18px 22px;
          border-radius: 18px;
          border: 1px solid var(--line);
          background: linear-gradient(160deg, var(--card), var(--ink-2));
        }
        .pr-result.accept .pr-result-inner {
          border-color: rgba(86, 211, 154, 0.4);
          box-shadow: 0 0 50px -18px rgba(86, 211, 154, 0.5);
        }
        .pr-result.reject .pr-result-inner {
          border-color: rgba(235, 145, 102, 0.34);
        }
        .pr-result .pr-badge {
          flex: 0 0 auto;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 22px;
          font-weight: 700;
        }
        .pr-result.accept .pr-badge {
          color: #06281c;
          background: linear-gradient(150deg, var(--green), var(--green-deep));
        }
        .pr-result.reject .pr-badge {
          color: var(--paper);
          background: rgba(235, 145, 102, 0.16);
          border: 1px solid rgba(235, 145, 102, 0.4);
        }
        .pr-result .pr-verdict-line {
          font-family: var(--font-display, serif);
          font-size: 22px;
          font-weight: 500;
          line-height: 1.05;
          color: var(--paper);
        }
        .pr-result .pr-result-sub {
          margin-top: 3px;
          font-size: 13px;
          color: var(--muted);
          font-variant-numeric: tabular-nums;
        }
        .pr-result .pr-result-note {
          margin-top: 7px;
          font-size: 11px;
          line-height: 1.35;
          color: var(--faint);
          max-width: 44ch;
        }

        /* get-ready countdown */
        .pr-countdown {
          position: absolute;
          inset: 0;
          z-index: 5;
          display: grid;
          place-items: center;
          background: rgba(8, 6, 4, 0.4);
          backdrop-filter: blur(2px);
        }
        .pr-countdown span {
          font-family: var(--font-display, serif);
          font-size: 124px;
          font-weight: 500;
          line-height: 1;
          color: var(--paper);
          animation: pr-count 0.56s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes pr-count {
          from {
            opacity: 0;
            transform: scale(1.55);
          }
          55% {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0.12;
            transform: scale(0.88);
          }
        }

        /* verdict actions + details */
        .pr-result-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-top: 13px;
        }
        .pr-mini {
          font-family: var(--font-body, sans-serif);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.01em;
          padding: 8px 15px;
          border-radius: 11px;
          border: 1px solid var(--line);
          background: transparent;
          color: var(--paper);
          cursor: pointer;
          transition:
            transform 0.14s ease,
            background 0.18s ease,
            border-color 0.18s ease,
            color 0.18s ease;
        }
        .pr-mini:hover:not(:disabled) {
          border-color: rgba(245, 228, 200, 0.3);
          transform: translateY(-1px);
        }
        .pr-mini.primary {
          border: none;
          color: #2a1d08;
          background: linear-gradient(160deg, var(--honey-2), var(--honey));
        }
        .pr-result.accept .pr-mini.primary {
          color: #06281c;
          background: linear-gradient(150deg, var(--green), var(--green-deep));
        }
        .pr-mini.ghost {
          color: var(--faint);
          border-color: transparent;
          margin-left: auto;
          padding: 8px 10px;
        }
        .pr-mini.ghost:hover {
          color: var(--muted);
          transform: none;
        }
        .pr-mini:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .pr-result-details {
          margin-top: 11px;
          padding-top: 11px;
          border-top: 1px solid var(--line);
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .pr-result-details code {
          font-family: var(--font-mono, monospace);
          font-size: 11.5px;
          color: var(--muted);
        }
        .pr-result-details span {
          font-size: 10.5px;
          line-height: 1.35;
          color: var(--faint);
        }

        /* progress meter in the action meta */
        .pr-action .pr-action-meta {
          display: inline-flex;
          align-items: center;
          gap: 9px;
        }
        .pr-progress-track {
          display: inline-block;
          width: 110px;
          height: 5px;
          border-radius: 999px;
          background: rgba(245, 228, 200, 0.14);
          overflow: hidden;
        }
        .pr-progress-track i {
          display: block;
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, var(--green-deep), var(--green));
          box-shadow: 0 0 10px rgba(86, 211, 154, 0.5);
          transition: width 0.5s ease;
        }

        /* unit chip in the hero eyebrow */
        .pr-unit {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 10.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--honey);
          border: 1px solid rgba(234, 180, 77, 0.35);
          border-radius: 999px;
          padding: 3px 10px;
        }

        /* browse-all-signs picker */
        .pr-browse {
          margin-top: 14px;
          background: none;
          border: none;
          padding: 0;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 11.5px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .pr-browse:hover:not(:disabled) {
          color: var(--honey-2);
        }
        .pr-browse:disabled {
          opacity: 0.4;
          cursor: default;
        }
        .pr-picker {
          margin-top: 14px;
          padding: 16px 18px;
          border: 1px solid var(--line);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.02);
          max-height: 320px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .pr-picker-unit {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .pr-picker-title {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 10.5px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--faint);
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .pr-picker-title i {
          font-style: normal;
          color: var(--green);
        }
        .pr-picker-words {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .pr-pick {
          border: 1px solid var(--line);
          border-radius: 999px;
          background: none;
          color: var(--paper);
          font-family: "Manrope", system-ui, sans-serif;
          font-size: 13px;
          padding: 5px 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition:
            border-color 0.2s ease,
            background 0.2s ease;
        }
        .pr-pick:hover {
          border-color: rgba(234, 180, 77, 0.5);
        }
        .pr-pick.current {
          border-color: var(--honey);
          background: rgba(234, 180, 77, 0.12);
        }
        .pr-pick.done {
          color: var(--green);
        }
        .pr-pick i {
          font-style: normal;
          font-size: 10px;
          color: var(--faint);
        }

        .pr-stage-tools {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        /* first-run intro */
        .pr-intro {
          border-color: rgba(234, 180, 77, 0.35);
        }
        .pr-intro-steps {
          margin: 0;
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 14px;
          line-height: 1.55;
          color: var(--muted);
        }
        .pr-intro-steps b {
          color: var(--paper);
          font-weight: 600;
        }
        .pr-intro-steps i {
          color: var(--honey);
          font-style: normal;
          font-weight: 600;
        }
        .pr-intro-privacy {
          margin: 0;
          font-size: 13px;
          line-height: 1.55;
          color: var(--faint);
          max-width: 70ch;
        }

        /* account + auth/progress panels */
        .pr-head-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .pr-account {
          border: 1px solid var(--line);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.02);
          color: var(--paper);
          font-family: "Manrope", system-ui, sans-serif;
          font-size: 13px;
          padding: 8px 14px;
          cursor: pointer;
          white-space: nowrap;
          transition:
            border-color 0.2s ease,
            background 0.2s ease;
        }
        .pr-account:hover,
        .pr-account.on {
          border-color: rgba(234, 180, 77, 0.5);
          background: rgba(234, 180, 77, 0.08);
        }
        .pr-panel {
          margin-top: 16px;
          padding: 18px 20px;
          border: 1px solid var(--line);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.02);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .pr-panel-head b {
          display: block;
          font-family: "Fraunces", "Manrope", serif;
          font-weight: 600;
          font-size: 17px;
        }
        .pr-panel-head span {
          display: block;
          margin-top: 4px;
          font-size: 13px;
          line-height: 1.5;
          color: var(--muted);
          max-width: 64ch;
        }
        .pr-auth-form {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .pr-auth-form input {
          flex: 1 1 180px;
          min-width: 160px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.25);
          color: var(--paper);
          font-family: "Manrope", system-ui, sans-serif;
          font-size: 14px;
          padding: 9px 13px;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .pr-auth-form input:focus {
          border-color: rgba(234, 180, 77, 0.55);
        }
        .pr-auth-msg {
          margin: 0;
          font-size: 13px;
          color: var(--green);
        }
        .pr-auth-msg.err {
          color: var(--coral);
        }
        .pr-prog-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          font-size: 13px;
          color: var(--muted);
        }
        .pr-prog-stats b {
          font-family: "Fraunces", "Manrope", serif;
          font-size: 18px;
          color: var(--paper);
          margin-right: 5px;
        }
        .pr-prog-review,
        .pr-prog-recent {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .pr-prog-recent ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .pr-prog-recent li {
          display: flex;
          align-items: baseline;
          gap: 9px;
          font-size: 13.5px;
          color: var(--paper);
        }
        .pr-prog-recent li i {
          font-style: normal;
          color: var(--coral);
          width: 14px;
        }
        .pr-prog-recent li i.ok {
          color: var(--green);
        }
        .pr-prog-recent li time {
          margin-left: auto;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 11px;
          color: var(--faint);
        }
        .pr-prog-empty {
          margin: 0;
          font-size: 13px;
          color: var(--faint);
        }
        .pr-prog-note {
          font-size: 11.5px;
          line-height: 1.45;
          color: var(--faint);
        }
        .pr-panel > .pr-mini.ghost {
          align-self: flex-start;
        }
        .pr-save-line {
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid var(--line);
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 20px;
        }
        .pr-save-prompt {
          font-size: 12.5px;
          line-height: 1.4;
          color: var(--faint);
        }
        .pr-save-cta {
          margin-left: auto;
          flex: none;
          font-family: var(--font-body, "Manrope", sans-serif);
          font-size: 12.5px;
          font-weight: 600;
          letter-spacing: 0.01em;
          padding: 6px 16px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: transparent;
          color: var(--paper);
          cursor: pointer;
          transition:
            background 0.18s ease,
            border-color 0.18s ease,
            transform 0.14s ease;
        }
        .pr-save-cta:hover {
          border-color: rgba(245, 228, 200, 0.32);
          background: rgba(245, 228, 200, 0.05);
          transform: translateY(-1px);
        }
        .pr-save-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: var(--muted);
        }
        .pr-save-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--faint);
          flex: none;
        }
        .pr-save-status.saving .pr-save-dot {
          background: var(--honey);
          animation: pr-pulse 1.4s infinite;
        }
        .pr-save-status.saved .pr-save-dot {
          background: var(--green);
        }
        .pr-save-status.error .pr-save-dot {
          background: var(--coral);
        }

        /* targeted hint inside the result card */
        .pr-result-hint {
          margin-top: 10px;
          padding: 10px 14px;
          border-left: 2px solid var(--honey);
          background: rgba(234, 180, 77, 0.07);
          border-radius: 0 12px 12px 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .pr-hint-dim {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--honey);
        }
        .pr-result-hint p {
          margin: 0;
          font-size: 13.5px;
          line-height: 1.5;
          color: var(--paper);
        }
        .pr-result-hint .pr-hint-study {
          color: var(--muted);
          font-size: 12.5px;
        }

        /* ---- localhost debug capture panel ---- */
        .pr-debug {
          margin-top: 18px;
          border: 1px dashed rgba(255, 120, 120, 0.35);
          border-radius: 16px;
          padding: 14px 16px;
          background: rgba(255, 80, 80, 0.04);
        }
        .pr-debug-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .pr-debug-title {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 11.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #f0a0a0;
        }
        .pr-debug-actions {
          display: flex;
          gap: 8px;
        }
        .pr-debug-note {
          margin: 8px 0 10px;
          font-size: 11.5px;
          line-height: 1.45;
          color: var(--faint);
          max-width: 86ch;
        }
        .pr-debug-strip {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 6px;
        }
        .pr-debug-cell {
          flex: 0 0 auto;
          width: 138px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font: inherit;
          background: none;
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 4px;
          cursor: zoom-in;
        }
        .pr-debug-cell.on {
          border-color: rgba(255, 120, 120, 0.6);
        }
        .pr-debug-cell img {
          width: 100%;
          border-radius: 7px;
          display: block;
        }
        .pr-debug-cell code {
          font-size: 9.5px;
          color: var(--faint);
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pr-debug-missing {
          display: grid;
          place-items: center;
          aspect-ratio: 3 / 4;
          color: var(--faint);
          font-size: 22px;
        }
        .pr-debug-zoom {
          margin: 6px 0 12px;
          cursor: zoom-out;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .pr-debug-zoom img {
          width: 100%;
          max-width: 620px;
          border-radius: 12px;
          border: 1px solid var(--line);
        }
        .pr-debug-zoom code,
        .pr-debug-zoom span {
          font-size: 11px;
          color: var(--muted);
        }

        @media (max-width: 820px) {
          .pr-stages {
            grid-template-columns: 1fr;
            gap: 18px;
          }
          .pr-action {
            grid-template-columns: 1fr;
            gap: 12px;
            justify-items: center;
          }
          .pr-action .pr-ghost,
          .pr-action .pr-action-meta {
            justify-self: center;
          }
          .pr-sign {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
