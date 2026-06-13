"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveTracker } from "@/lib/use-live-tracker";
import { type AvatarClipLoadStatus } from "@/lib/avatar-motion";
import {
  type ActiveVocabularyClaim,
  expectedFrameCount,
  expectedImageSize,
  loadActiveVocabularyClaim,
  loadModelCard,
  type ModelCard,
} from "@/lib/client-model";
import {
  DEFAULT_BROWSER_MODEL_BUNDLE,
  loadBrowserModelBundle,
  type BrowserModelBundle,
} from "@/lib/model-bundle";
import { useCameraCapture, type CameraQualitySnapshot } from "@/lib/use-camera-capture";
import {
  getSignHintMetadata,
  getVocabularyItem,
  VOCABULARY,
  type VocabularyItem,
} from "@/lib/vocabulary";
import {
  getCatalogItemForVocabularyId,
  PRACTICE_CATALOG,
  groupVocabularyIntoUnits,
} from "@/lib/practice-catalog";

export const TIER0_LESSON_IDS = ["please", "table", "dad", "grandpa", "hat"] as const;

// Study-card rows shown in the Study step (descriptive canonical-form cues).
const LESSON_STUDY_DIMENSIONS = [
  ["handshape", "Handshape"],
  ["location", "Location"],
  ["movement", "Movement"],
  ["orientation", "Orientation"],
  ["timing", "Timing"],
] as const;

type User = {
  id: string;
  email: string;
  name: string;
};

type SampleStatus = "idle" | "sampling" | "saving" | "saved" | "previewed" | "error";
type AuthStatus = "loading" | "authenticated" | "unauthenticated";
type StudyStepId = "study" | "preview" | "sample";

const LESSON_STUDY_STEPS: Array<{
  id: StudyStepId;
  label: string;
  title: string;
  copy: string;
}> = [
  {
    id: "study",
    label: "Watch",
    title: "Watch the signer",
    copy: "Use the video as the primary reference; written form notes are optional.",
  },
  {
    id: "preview",
    label: "Preview",
    title: "Frame locally",
    copy: "Start the camera when ready; framing feedback stays in this browser.",
  },
  {
    id: "sample",
    label: "Sample",
    title: "Save history only",
    copy: "Save one metadata-only sample when useful. No automatic grade is produced.",
  },
];

const DEV_LESSON_PREVIEW_USER: User = {
  id: "dev-lesson-preview",
  email: "lesson-preview@local.dev",
  name: "Lesson preview",
};

function deriveActiveLabels(
  claim: ActiveVocabularyClaim | null,
  modelCard: ModelCard | null,
): string[] {
  if (claim?.modelVersion === "rawframe-not-trained") return [];
  if (Array.isArray(claim?.activeLabels)) return claim.activeLabels;
  if (!modelCard || modelCard.status !== "trained") return [];
  const mapping = modelCard.model?.label_to_index;
  return mapping ? Object.keys(mapping) : [];
}

function readInitialVocabularyId() {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("vocabulary");
  return value && getVocabularyItem(value) && getCatalogItemForVocabularyId(value)
    ? value
    : null;
}

function readDevLessonAuthBypass() {
  if (process.env.NODE_ENV !== "development" || typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("auth") === "dev";
}

function setLessonQueryVocabulary(id: string) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("vocabulary", id);
  window.history.replaceState(null, "", `${url.pathname}?${url.searchParams.toString()}`);
}

export function LessonApp() {
  const camera = useCameraCapture({
    screenName: "lesson screen",
    readyMessage: "Camera ready. Sampling stays local in this browser.",
  });

  const trackingOverlayRef = useRef<HTMLCanvasElement | null>(null);
  const [trackingPreview, setTrackingPreview] = useState(false);
  const tracking = useLiveTracker({
    videoRef: camera.videoRef,
    overlayRef: trackingOverlayRef,
    enabled: trackingPreview && camera.status === "ready",
  });

  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [authPreview, setAuthPreview] = useState(false);
  const [selectedId, setSelectedId] = useState<(typeof TIER0_LESSON_IDS)[number] | string>(
    TIER0_LESSON_IDS[0],
  );
  const [sampleStatus, setSampleStatus] = useState<SampleStatus>("idle");
  const [sampleError, setSampleError] = useState<string | null>(null);
  const [studyStep, setStudyStep] = useState<StudyStepId>("study");
  const [quality, setQuality] = useState<CameraQualitySnapshot | null>(null);
  const lessonVideoRef = useRef<HTMLVideoElement | null>(null);
  const [avatarClipStatus, setAvatarClipStatus] = useState<AvatarClipLoadStatus>("idle");
  const [avatarIsPlaying, setAvatarIsPlaying] = useState(false);
  const [avatarLoop, setAvatarLoop] = useState(true);
  const [avatarSpeed, setAvatarSpeed] = useState<0.5 | 1>(1);
  const [avatarMirrored, setAvatarMirrored] = useState(false);
  const [modelCard, setModelCard] = useState<ModelCard | null>(null);
  const [activeVocabularyClaim, setActiveVocabularyClaim] =
    useState<ActiveVocabularyClaim | null>(null);
  const [browserBundle, setBrowserBundle] = useState<BrowserModelBundle>(
    DEFAULT_BROWSER_MODEL_BUNDLE,
  );

  useEffect(() => {
    let ignore = false;
    async function boot() {
      const initialVocabularyId = readInitialVocabularyId();
      const devAuthBypass = readDevLessonAuthBypass();
      const meDataPromise: Promise<{ user: User | null }> = devAuthBypass
        ? Promise.resolve({ user: DEV_LESSON_PREVIEW_USER })
        : fetch("/api/me", { cache: "no-store" }).then(
            (response) => response.json() as Promise<{ user: User | null }>,
          );
      const [meData, loadedModelCard, loadedClaim, loadedBundle] = await Promise.all([
        meDataPromise,
        loadModelCard(),
        loadActiveVocabularyClaim(),
        loadBrowserModelBundle(),
      ]);
      if (ignore) return;
      if (initialVocabularyId) setSelectedId(initialVocabularyId);
      setUser(meData.user);
      setAuthPreview(devAuthBypass);
      setAuthStatus(meData.user ? "authenticated" : "unauthenticated");
      setModelCard(loadedModelCard);
      setActiveVocabularyClaim(loadedClaim);
      setBrowserBundle(loadedBundle);
    }
    void boot();
    return () => {
      ignore = true;
    };
  }, []);

  // Browse the video-backed graded vocabulary. The five learn-only extras do
  // not have reviewed source clips, so they stay out of the normal lesson picker
  // until a reference video exists.
  const lessonVocabulary = useMemo(
    () =>
      PRACTICE_CATALOG.map((item) => getVocabularyItem(item.vocabularyId)).filter(
        (item): item is VocabularyItem => Boolean(item),
      ),
    [],
  );
  const units = useMemo(() => groupVocabularyIntoUnits(lessonVocabulary), [lessonVocabulary]);
  const selectedItem = useMemo(
    () =>
      lessonVocabulary.find((item) => item.id === selectedId) ??
      lessonVocabulary[0] ??
      VOCABULARY[0],
    [lessonVocabulary, selectedId],
  );
  const selectedUnit = useMemo(
    () =>
      units.find((unit) => unit.category === selectedItem.category) ?? units[0],
    [units, selectedItem.category],
  );
  const selectedCatalogItem = getCatalogItemForVocabularyId(selectedItem.id);
  const selectedStudy = getSignHintMetadata(selectedItem.id);
  const selectedClipUrl = selectedCatalogItem?.clipUrl ?? `/pilot/clips/${selectedItem.id}.mp4`;
  const activeLabels = useMemo(
    () => deriveActiveLabels(activeVocabularyClaim, modelCard),
    [activeVocabularyClaim, modelCard],
  );
  const selectedIsActive =
    modelCard?.status === "trained" &&
    browserBundle.recognition.enabled &&
    activeLabels.includes(selectedItem.id);
  // Keep the reference video's loop + playback rate in sync with the controls.
  useEffect(() => {
    const v = lessonVideoRef.current;
    if (v) {
      v.loop = avatarLoop;
      v.playbackRate = avatarSpeed;
    }
  }, [avatarLoop, avatarSpeed, avatarClipStatus]);
  const activeStudyStep =
    LESSON_STUDY_STEPS.find((step) => step.id === studyStep) ?? LESSON_STUDY_STEPS[0];
  const modelStatusCopy = selectedIsActive
    ? "Recognition check available for this word."
    : "Learn-only — practice freely, nothing is graded.";
  const avatarStatusCopy = avatarClipStatus === "ready"
    ? "Video ready"
    : avatarClipStatus === "loading"
      ? "Loading video…"
      : avatarClipStatus === "missing"
        ? "Video unavailable"
        : avatarClipStatus === "error"
          ? "Video unavailable"
          : "Video pending";
  const promptIndex = Math.max(
    0,
    selectedUnit.items.findIndex((item) => item.id === selectedItem.id),
  );
  const cameraReady = camera.status === "ready";
  const cameraBusy = sampleStatus === "sampling" || sampleStatus === "saving";

  // The reference is a required real signer video; reset to "loading" on word
  // change and let the <video> element's load/error events drive the status.
  useEffect(() => {
    setAvatarClipStatus("loading");
    setAvatarIsPlaying(true);
  }, [selectedItem.id]);

  function selectVocabulary(id: string) {
    setSelectedId(id);
    setSampleStatus("idle");
    setSampleError(null);
    setQuality(null);
    setStudyStep("study");
    setLessonQueryVocabulary(id);
  }

  async function capturePracticeSample() {
    if (!user) {
      setSampleError(
        "Sign in on the Practice page to save samples — studying and the framing preview work without an account.",
      );
      setSampleStatus("error");
      return;
    }
    if (camera.status !== "ready") {
      setSampleError("Start the camera before saving a practice sample.");
      setSampleStatus("error");
      return;
    }

    setSampleStatus("sampling");
    setSampleError(null);
    const sampleCount = expectedFrameCount(modelCard);
    const imageSize = expectedImageSize(modelCard);
    let samples;
    try {
      samples = await camera.sampleFrames({
        frameCount: sampleCount,
        imageSize,
        intervalMs: 72,
      });
    } catch (error) {
      setSampleError(error instanceof Error ? error.message : "Camera sampling failed.");
      setSampleStatus("error");
      return;
    }
    setQuality(samples.quality);

    if (authPreview) {
      setSampleStatus("previewed");
      camera.setMessage("Preview mode: sample metrics stayed local and were not saved.");
      return;
    }

    setSampleStatus("saving");
    const card: ModelCard = modelCard ?? {
      model_id: "asl-pilot-rawframe-v0",
      status: "not_trained",
    };
    const response = await fetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vocabularyId: selectedItem.id,
        passed: false,
        confidence: 0,
        predictedId: null,
        modelId: card.model_id,
        modelStatus: card.status,
        hint: selectedItem.coachingHint,
        reason: "lesson_sample_model_or_detector_inactive",
        durationMs: samples.durationMs,
        frameCount: samples.frames.length,
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setSampleError(data.error ?? "Practice sample could not be saved.");
      setSampleStatus("error");
      return;
    }

    setSampleStatus("saved");
    camera.setMessage("Practice sample saved as metadata only. No camera image was uploaded.");
  }

  function restartAvatarDemo() {
    const v = lessonVideoRef.current;
    if (!v) return;
    v.currentTime = 0;
    void v.play();
    setAvatarIsPlaying(true);
  }

  function nextPrompt() {
    const items = selectedUnit.items;
    const currentIndex = items.findIndex((item) => item.id === selectedItem.id);
    const nextItem = items[(currentIndex + 1 + items.length) % items.length];
    if (nextItem) selectVocabulary(nextItem.id);
  }

  if (authStatus === "loading") {
    return (
      <main className="ls-wrap ls-gate">
        <section className="ls-gate-card">
          <span className="ls-gate-eyebrow">ASL Pilot · Lessons</span>
          <h1>Opening your lesson studio</h1>
          <p>Just checking your account before the camera controls appear.</p>
        </section>
      </main>
    );
  }

  // Guests can browse every lesson (study cards, reference clips, framing
  // preview are all read-only/local); only saving a practice sample needs an
  // account, and that action explains itself below.
  return (
    <main className="ls-wrap">
      <header className="ls-head">
        <div className="ls-brand">
          <div className="ls-mark">A</div>
          <div>
            <b>ASL&nbsp;Pilot</b>
            <span>Lessons</span>
          </div>
        </div>
        <div className="ls-head-right">
          <span className="ls-pill">
            <span className={`ls-dot ${selectedIsActive ? "on" : ""}`} />
            <span>{modelStatusCopy}</span>
          </span>
          <Link className="ls-nav" href="/practice">
            Practice
          </Link>
          <Link className="ls-nav" href="/validation">
            Validation
          </Link>
        </div>
      </header>

      <section className="ls-hero" style={{ animationDelay: "40ms" }}>
        <div className="ls-eyebrow">
          <span>Learn this word</span>
          <span className="ls-unit-name">{selectedUnit.title}</span>
          <span className="ls-count">
            {String(promptIndex + 1).padStart(2, "0")}
            <i>/</i>
            {String(selectedUnit.items.length).padStart(2, "0")}
          </span>
        </div>
        <h1 className="ls-word">{selectedItem.label}</h1>
        <p className="ls-hint">
          Watch the reference video first. Open form notes only when you want
          the written cues.
        </p>
        <div className="ls-units" aria-label="Curriculum units">
          {units.map((unit) => (
            <button
              key={unit.category}
              type="button"
              className={`ls-unit ${unit.category === selectedUnit.category ? "on" : ""}`}
              onClick={() => selectVocabulary(unit.items[0].id)}
            >
              {unit.title}
            </button>
          ))}
        </div>
        <div className="ls-picker" aria-label="Choose a word to learn">
          {selectedUnit.items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ls-chip ${item.id === selectedItem.id ? "on" : ""}`}
              onClick={() => selectVocabulary(item.id)}
            >
              {item.label}
              <i className="ls-chip-tag">video</i>
            </button>
          ))}
        </div>
      </section>

      <main className="ls-stages">
        {/* Left stage — the reference signer clip */}
        <section className="ls-stage" style={{ animationDelay: "120ms" }}>
          <div className="ls-stage-head">
            <span className="ls-stage-label">
              <span className={`ls-dot ${avatarClipStatus === "ready" ? "on" : ""}`} />
              Reference video
            </span>
            <button
              type="button"
              className={`ls-toggle ${avatarMirrored ? "on" : ""}`}
              disabled={avatarClipStatus !== "ready"}
              onClick={() => setAvatarMirrored((mirrored) => !mirrored)}
              title={avatarMirrored ? "Mirrored — tap for a front view" : "Front view — tap to mirror"}
            >
              ⇄ {avatarMirrored ? "Mirrored" : "Front view"}
            </button>
          </div>
          <div className="ls-screen" data-ref-status={avatarClipStatus}>
            <video
              key={selectedItem.id}
              ref={lessonVideoRef}
              className="ls-refvid"
              src={selectedClipUrl}
              autoPlay
              loop={avatarLoop}
              muted
              playsInline
              style={{ transform: avatarMirrored ? "scaleX(-1)" : undefined }}
              onLoadedData={(e) => {
                const v = e.currentTarget;
                v.playbackRate = avatarSpeed;
                setAvatarClipStatus("ready");
                setAvatarIsPlaying(!v.paused);
              }}
              onError={() => setAvatarClipStatus("missing")}
              onPlay={() => setAvatarIsPlaying(true)}
              onPause={() => setAvatarIsPlaying(false)}
              onEnded={() => setAvatarIsPlaying(false)}
            />
            {avatarClipStatus !== "ready" ? (
              <div className="ls-screen-empty" aria-live="polite">
                <span>{avatarStatusCopy}</span>
                {avatarClipStatus === "missing" || avatarClipStatus === "error" ? (
                  <small>
                    This word is missing its packaged reference video.
                  </small>
                ) : (
                  <small>One moment…</small>
                )}
              </div>
            ) : null}
            <span className="ls-credit">PopSign · CC BY 4.0</span>
          </div>
          <div className="ls-stage-controls" aria-label="Reference playback controls">
            <button
              className="ls-mini"
              type="button"
              disabled={avatarClipStatus !== "ready"}
              onClick={() => {
                const v = lessonVideoRef.current;
                if (!v) return;
                if (v.paused) void v.play();
                else v.pause();
              }}
            >
              {avatarIsPlaying ? "Pause" : "Play"}
            </button>
            <button
              className="ls-mini"
              type="button"
              disabled={avatarClipStatus !== "ready"}
              onClick={restartAvatarDemo}
            >
              Restart
            </button>
            <button
              className={`ls-mini ${avatarLoop ? "on" : ""}`}
              type="button"
              disabled={avatarClipStatus !== "ready"}
              onClick={() => setAvatarLoop((loop) => !loop)}
            >
              Loop
            </button>
            <button
              className={`ls-mini ${avatarSpeed === 0.5 ? "on" : ""}`}
              type="button"
              disabled={avatarClipStatus !== "ready"}
              onClick={() => setAvatarSpeed((speed) => (speed === 1 ? 0.5 : 1))}
            >
              {avatarSpeed === 1 ? "1× speed" : "½× speed"}
            </button>
          </div>
        </section>

        {/* Right stage — your camera */}
        <section className="ls-stage" style={{ animationDelay: "200ms" }}>
          <div className="ls-stage-head">
            <span className="ls-stage-label">
              <span className={`ls-dot ${cameraReady ? "on" : ""}`} />
              Your camera
            </span>
            {cameraReady ? (
              <button className="ls-toggle" type="button" onClick={camera.stopCamera}>
                ⏻ Stop
              </button>
            ) : (
              <span className="ls-stage-hint">on-device</span>
            )}
          </div>
          <div className="ls-screen ls-screen-cam" data-status={camera.status}>
            <video ref={camera.videoRef} playsInline muted data-testid="lesson-video" />
            {trackingPreview ? (
              <canvas ref={trackingOverlayRef} className="ls-overlay" aria-hidden="true" />
            ) : null}
            <canvas ref={camera.canvasRef} className="ls-hidden-canvas" aria-hidden="true" />
            <div className="ls-scrim" />
            {cameraReady ? (
              <span className="ls-rec" aria-hidden="true">
                REC · local
              </span>
            ) : (
              <button
                className="ls-cam-empty"
                type="button"
                disabled={camera.status === "starting"}
                onClick={() => {
                  setSampleError(null);
                  void camera.startCamera();
                }}
              >
                <span className="ls-cam-empty-content">
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
                  <span className="ls-cam-empty-copy">
                    <span className="ls-cta">
                      {camera.status === "starting" ? "Starting…" : "Enable camera"}
                    </span>
                    <small>Video never leaves your device</small>
                  </span>
                </span>
              </button>
            )}
          </div>
          <div className="ls-stage-controls" aria-label="Camera controls">
            <button
              className={`ls-mini ${trackingPreview ? "on" : ""}`}
              type="button"
              disabled={!cameraReady}
              onClick={() => setTrackingPreview((on) => !on)}
            >
              {trackingPreview ? "Hide tracking" : "Show tracking"}
            </button>
            <button className="ls-mini" type="button" onClick={nextPrompt}>
              Next word
            </button>
          </div>
          {trackingPreview ? (
            <p className="ls-tracking-note" data-state={tracking.status}>
              {tracking.status === "loading"
                ? "Loading the tracking preview…"
                : tracking.status === "error"
                  ? `Tracking unavailable: ${tracking.error ?? "model load failed"}`
                  : "Live skeleton preview — a demonstration, not a pass/fail check."}
            </p>
          ) : null}
        </section>
      </main>

      <div className="ls-action" style={{ animationDelay: "280ms" }}>
        <div className="ls-steps" data-testid="lesson-study-flow">
          {LESSON_STUDY_STEPS.map((step, i) => (
            <button
              key={step.id}
              type="button"
              className={`ls-step ${studyStep === step.id ? "on" : ""}`}
              onClick={() => setStudyStep(step.id)}
            >
              <i>{String(i + 1).padStart(2, "0")}</i>
              {step.label}
            </button>
          ))}
        </div>
        <button
          className="ls-primary"
          type="button"
          disabled={camera.status === "starting" || cameraBusy}
          onClick={
            cameraReady
              ? capturePracticeSample
              : () => {
                  setSampleError(null);
                  void camera.startCamera();
                }
          }
        >
          {cameraBusy ? (
            "Sampling…"
          ) : cameraReady ? (
            <>
              Sample <span className="ls-lower">{selectedItem.id}</span>
            </>
          ) : (
            "Enable camera"
          )}
        </button>
        <span className="ls-action-meta">
          <span className="ls-progress-dots" aria-hidden="true">
            {selectedUnit.items.map((item, i) => (
              <i key={item.id} className={i <= promptIndex ? "on" : ""} />
            ))}
          </span>
          {String(promptIndex + 1).padStart(2, "0")} of{" "}
          {String(selectedUnit.items.length).padStart(2, "0")} in {selectedUnit.title}
        </span>
        {selectedCatalogItem ? (
          <Link
            className="ls-practice-link"
            href={`/practice?word=${selectedCatalogItem.labelId}`}
            data-testid="lesson-practice-link"
          >
            Practice this word →
          </Link>
        ) : null}
      </div>

      <div className="ls-study">
        <span className="ls-study-eyebrow">
          {activeStudyStep.label} · step {LESSON_STUDY_STEPS.findIndex((s) => s.id === studyStep) + 1}
        </span>
        <strong>{activeStudyStep.title}</strong>
        <p>{activeStudyStep.copy}</p>
        {studyStep === "study" && selectedStudy ? (
          <details className="ls-study-disclosure" data-testid="lesson-study-card">
            <summary>Open written form notes</summary>
            <p className="ls-study-lead">{selectedItem.coachingHint}</p>
            <dl className="ls-study-card">
              {LESSON_STUDY_DIMENSIONS.map(([dimension, label]) =>
                selectedStudy[dimension] ? (
                  <div key={dimension} className="ls-study-row">
                    <dt>{label}</dt>
                    <dd>{selectedStudy[dimension]}</dd>
                  </div>
                ) : null,
              )}
            </dl>
          </details>
        ) : null}
        <span className="ls-study-foot">
          Recognition and tracking stay off until promoted artifacts exist — for now
          this lesson is learn-only, and samples are saved as metadata only.
        </span>
      </div>

      <LessonStatusStrip
        cameraMessage={camera.message}
        quality={quality}
        sampleError={sampleError}
        sampleStatus={sampleStatus}
      />
    </main>
  );
}

function LessonStatusStrip({
  cameraMessage,
  quality,
  sampleError,
  sampleStatus,
}: {
  cameraMessage: string;
  quality: CameraQualitySnapshot | null;
  sampleError: string | null;
  sampleStatus: SampleStatus;
}) {
  const sampleCopy: Record<SampleStatus, string> = {
    idle: "Ready when you are",
    sampling: "Reading your sign…",
    saving: "Saving your sample",
    saved: "Sample saved",
    previewed: "Preview only — not saved",
    error: "Sample not saved",
  };
  const sampleDone = sampleStatus === "saved" || sampleStatus === "previewed";

  return (
    <div
      className="ls-strip"
      data-testid="lesson-quality-strip"
      data-state={sampleError ? "error" : sampleDone ? "done" : "idle"}
    >
      <span className="ls-strip-main">
        <span className={`ls-dot ${sampleError ? "warn" : sampleDone ? "on" : ""}`} />
        {sampleError ?? cameraMessage}
      </span>
      <span className="ls-strip-status">{sampleError ? "Try again" : sampleCopy[sampleStatus]}</span>
      <span className="ls-strip-metric">
        <i>Light</i>
        {quality ? Math.round(quality.meanLuma) : "—"}
      </span>
      <span className="ls-strip-metric">
        <i>Contrast</i>
        {quality ? Math.round(quality.contrast) : "—"}
      </span>
      <span className="ls-strip-metric">
        <i>Frames</i>
        {quality ? quality.frameCount : "—"}
      </span>
    </div>
  );
}
