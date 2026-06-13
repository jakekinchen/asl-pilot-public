"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CameraViewport } from "./CameraViewport";
import { DatasetCollectionPanel } from "./DatasetCollectionPanel";
import {
  type ActiveVocabularyClaim,
  expectedFrameCount,
  expectedImageSize,
  loadActiveVocabularyClaim,
  loadModelCard,
  ModelCard,
} from "@/lib/client-model";
import { browserInferenceEngine, type InferenceResult } from "@/lib/inference-engine";
import {
  decide,
  type PassFailDecisionOutput,
  type PassFailReason,
} from "@/lib/pass-fail-decision";
import { useCameraCapture } from "@/lib/use-camera-capture";
import {
  getNextVocabularyItem,
  getVocabularyItem,
  VOCABULARY,
  VOCABULARY_COUNT,
  VocabularyItem,
} from "@/lib/vocabulary";

type DecisionResult = PassFailDecisionOutput & {
  modelId: string;
  modelStatus: "not_trained" | "trained";
  expectedId: string;
};

const REASON_COPY: Record<PassFailReason, string> = {
  model_not_trained: "Automatic checking is not ready yet.",
  insufficient_frames: "Not enough camera frames were sampled.",
  low_luma: "The camera image is too dark.",
  low_contrast: "The camera image is low contrast.",
  inactive_label: "This sign is not in the active recognition module.",
  class_mismatch: "The model predicted a different sign.",
  confidence_below_threshold: "Confidence was below the calibrated threshold.",
  inference_error: "The browser model could not run.",
};

/**
 * Active labels are derived from the active-vocabulary-claim file (canonical
 * source per ARCHITECTURE.md#arch-active-module). The model card's
 * label_to_index is used only as a fallback when the claim file or its fetch
 * is unavailable. While modelVersion is "rawframe-not-trained" the claim is
 * required to expose an empty array, so the UI defaults to fail-closed
 * (everything content-only) until a trained model card is promoted.
 */
function deriveActiveLabels(
  claim: ActiveVocabularyClaim | null,
  modelCard: ModelCard | null,
): string[] {
  if (claim?.modelVersion === "rawframe-not-trained") return [];
  if (Array.isArray(claim?.activeLabels)) return claim.activeLabels;
  if (!modelCard || modelCard.status !== "trained") return [];
  const mapping = modelCard.model?.label_to_index;
  if (!mapping) return [];
  return Object.keys(mapping);
}

function formatPersistedReason(decision: PassFailDecisionOutput): string {
  if (decision.reasons.length === 0) {
    return `prompted class was top prediction and met threshold ${decision.threshold.toFixed(3)}`;
  }
  return decision.reasons.join(",");
}

const DATASET_COLLECTION_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_DATASET_COLLECTION === "true";

type User = {
  id: string;
  email: string;
  name: string;
};

type ProgressItem = {
  vocabularyId: string;
  label: string;
  attempts: number;
  passes: number;
  fails: number;
  status: "not_started" | "in_progress" | "mastered";
  lastAttemptAt: string | null;
};

type StoredAttempt = {
  id: string;
  vocabularyId: string;
  passed: boolean;
  confidence: number;
  predictedId: string | null;
  modelId: string;
  modelStatus: "not_trained" | "trained";
  hint: string;
  reason: string;
  durationMs: number | null;
  frameCount: number | null;
  createdAt: string;
};

type AuthMode = "login" | "register";
type AttemptStatus = "idle" | "sampling" | "saving" | "saved" | "error";

export function PracticeApp() {
  const camera = useCameraCapture({
    screenName: "practice screen",
    readyMessage: "Camera ready. Frames are sampled locally in this browser.",
  });

  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState(VOCABULARY[0].id);
  const [attemptStatus, setAttemptStatus] = useState<AttemptStatus>("idle");
  const [attemptError, setAttemptError] = useState<string | null>(null);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [modelCard, setModelCard] = useState<ModelCard | null>(null);
  const [activeVocabularyClaim, setActiveVocabularyClaim] =
    useState<ActiveVocabularyClaim | null>(null);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<StoredAttempt[]>([]);

  const selectedItem = useMemo(
    () => getVocabularyItem(selectedId) ?? VOCABULARY[0],
    [selectedId],
  );

  const practiceStats = useMemo(() => {
    const mastered = progress.filter((item) => item.status === "mastered").length;
    const attempted = progress.filter((item) => item.attempts > 0).length;
    const savedAttempts = progress.reduce((total, item) => total + item.attempts, 0);
    return { mastered, attempted, savedAttempts };
  }, [progress]);

  useEffect(() => {
    void refreshUser();
    void loadModelCard().then(setModelCard);
    void loadActiveVocabularyClaim().then(setActiveVocabularyClaim);
  }, []);

  const activeLabels = useMemo(
    () => deriveActiveLabels(activeVocabularyClaim, modelCard),
    [activeVocabularyClaim, modelCard],
  );
  const selectedIsActive = useMemo(
    () => activeLabels.includes(selectedId),
    [activeLabels, selectedId],
  );
  const checkerActive = modelCard?.status === "trained" && activeLabels.length > 0;
  const readyActionLabel = checkerActive ? "Check attempt" : "Save practice";

  useEffect(() => {
    if (user) void refreshProgress();
  }, [user]);

  async function refreshUser() {
    const response = await fetch("/api/me", { cache: "no-store" });
    const data = (await response.json()) as { user: User | null };
    setUser(data.user);
  }

  async function refreshProgress() {
    const response = await fetch("/api/progress", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as {
      progress: ProgressItem[];
      recentAttempts: StoredAttempt[];
    };
    setProgress(data.progress);
    setRecentAttempts(data.recentAttempts);
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(null);
    setAuthNotice(null);
    const endpoint = authMode === "register" ? "/api/auth/register" : "/api/auth/login";
    const payload =
      authMode === "register"
        ? { email, name, password }
        : { email, password };

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
      setPassword("");
      return;
    }
    if (!response.ok || !data.user) {
      setAuthError(data.error ?? "Unable to continue.");
      return;
    }
    setUser(data.user);
    setPassword("");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setProgress([]);
    setRecentAttempts([]);
    setResult(null);
    camera.stopCamera();
  }

  async function submitAttempt() {
    if (!user) return;
    if (camera.status !== "ready") {
      setAttemptError(
        checkerActive
          ? "Start the camera before checking an attempt."
          : "Start the camera before saving practice.",
      );
      return;
    }

    setAttemptStatus("sampling");
    setAttemptError(null);
    setResult(null);
    const frameCount = expectedFrameCount(modelCard);
    const imageSize = expectedImageSize(modelCard);
    let samples;
    try {
      samples = await camera.sampleFrames({
        frameCount,
        imageSize,
        intervalMs: 80,
      });
    } catch (error) {
      setAttemptError(error instanceof Error ? error.message : "Camera sampling failed.");
      setAttemptStatus("error");
      return;
    }
    const frames = samples.frames;
    const durationMs = samples.durationMs;

    const card: ModelCard = modelCard ?? {
      model_id: "asl-pilot-rawframe-v0",
      status: "not_trained",
    };
    let inference: InferenceResult | null = null;
    let inferenceError: unknown;
    if (card.status === "trained") {
      try {
        const loaded = await browserInferenceEngine.load(card);
        inference = await browserInferenceEngine.predict(loaded, frames);
      } catch (error) {
        inferenceError = error;
      }
    }
    const decision = decide({
      expected: selectedItem,
      frames,
      modelCard: card,
      activeLabels,
      inference,
      inferenceError,
    });
    const decisionResult: DecisionResult = {
      ...decision,
      expectedId: selectedItem.id,
      modelId: card.model_id,
      modelStatus: card.status,
    };
    setResult(decisionResult);
    setAttemptStatus("saving");

    const response = await fetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vocabularyId: decisionResult.expectedId,
        passed: decisionResult.passed,
        confidence: decisionResult.confidence,
        predictedId: decisionResult.predictedId,
        modelId: decisionResult.modelId,
        modelStatus: decisionResult.modelStatus,
        hint: decisionResult.hint,
        reason: formatPersistedReason(decisionResult),
        durationMs,
        frameCount: frames.length,
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setAttemptError(data.error ?? "Attempt could not be saved.");
      setAttemptStatus("error");
      return;
    }

    setAttemptStatus("saved");
    await refreshProgress();
  }

  function nextPrompt() {
    const next = getNextVocabularyItem(selectedItem.id);
    setSelectedId(next.id);
    setResult(null);
    setAttemptError(null);
    setAttemptStatus("idle");
  }

  if (!user) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <div className="auth-panel-top">
            <div className="masthead">
              <div className="masthead-name">
                ASL <em>Pilot</em>
              </div>
              <div className="masthead-meta">№ 001 / EDITION 26</div>
            </div>
            <div className="brand-mark">Learn-only · in browser</div>
          </div>

          <div className="auth-panel-body">
            <h1>
              <span className="nonital">Practice</span>{" "}
              <span className="accent">signing</span>,
              <br />
              one prompt
              <br />
              at a time.
            </h1>
            <p className="auth-lede">
              Beginner ASL practice for ASL-only, isolated beginner vocabulary
              and ASL 1 items. Frames are sampled locally, attempts are kept
              private to your account, and the prompt catalog is curated for
              beginners.
            </p>
          </div>

          <div className="auth-panel-footer">
            <div className="scope-grid">
              <span>{VOCABULARY_COUNT} prompt catalog</span>
              <span>Browser camera</span>
              <span>Local frame sampling</span>
              <span>Persistent history</span>
            </div>
          </div>
        </section>

        <div className="auth-form-side">
          <form className="auth-form" onSubmit={submitAuth}>
            <div className="auth-form-heading">
              <span className="eyebrow">Access</span>
              <h2>
                {authMode === "register" ? "Open a studio" : "Return to studio"}
              </h2>
            </div>

            <div className="segmented-control" aria-label="Account mode">
              <button
                type="button"
                className={authMode === "register" ? "active" : ""}
                onClick={() => setAuthMode("register")}
              >
                Create
              </button>
              <button
                type="button"
                className={authMode === "login" ? "active" : ""}
                onClick={() => setAuthMode("login")}
              >
                Log in
              </button>
            </div>
            {authMode === "register" ? (
              <label>
                Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                />
              </label>
            ) : null}
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@studio.com"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
              />
            </label>
            {authError ? <p className="form-error">{authError}</p> : null}
            {authNotice ? <p className="form-notice">{authNotice}</p> : null}
            <button className="primary-button" type="submit">
              {authMode === "register" ? "Open studio" : "Enter studio"}
            </button>
          <Link className="ghost-button centered-link" href="/validation">
            Validation status
          </Link>
          <Link className="ghost-button centered-link" href="/lesson">
            Lesson studio
          </Link>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="practice-shell">
      <header className="topbar">
        <div className="topbar-left">
          <div className="masthead">
            <div className="masthead-name">
              ASL <em>Pilot</em>
            </div>
            <div className="masthead-meta">Studio · {user.name}</div>
          </div>
          <div className="topbar-meta">
            <span>
              Attempted <strong>{practiceStats.attempted}</strong>
            </span>
            <span className="divider" aria-hidden="true" />
            <span>
              {checkerActive ? "Mastered" : "Saved"}{" "}
              <strong>{checkerActive ? practiceStats.mastered : practiceStats.savedAttempts}</strong>
            </span>
            <span className="divider" aria-hidden="true" />
            <span>
              Catalog <strong>{VOCABULARY_COUNT}</strong>
            </span>
          </div>
        </div>
        <div className="topbar-right">
          <span className="brand-mark">Learn-only session</span>
          <Link className="ghost-button centered-link" href="/lesson">
            Lesson
          </Link>
          <Link className="ghost-button centered-link" href="/validation">
            Validation
          </Link>
          <button className="ghost-button" onClick={logout} type="button">
            Log out
          </button>
        </div>
      </header>

      <section className="workspace">
        <aside className="prompt-panel">
          <div className="panel-heading">
            <span>Prompt</span>
            <strong>{VOCABULARY_COUNT} prompt catalog</strong>
          </div>
          <label className="select-label">
            Vocabulary
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {VOCABULARY.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <div className="prompt-box">
            <span>{selectedItem.category}</span>
            <h1>{selectedItem.prompt}</h1>
            <p>{selectedItem.coachingHint}</p>
            <span
              className={`active-claim-badge ${selectedIsActive ? "active" : "content-only"}`}
              data-active={selectedIsActive ? "true" : "false"}
            >
              {selectedIsActive
                ? "Gradeable by the active module."
                : "Content-only — practice freely; the model does not grade this prompt yet."}
            </span>
          </div>
          <ModelStatus modelCard={modelCard} />
        </aside>

        <section className="camera-panel">
          <div className="panel-heading">
            <span>Viewport</span>
            <strong>
              {camera.status === "ready" ? "Local" : camera.status.toUpperCase()}
            </strong>
          </div>
          <CameraViewport
            canvasRef={camera.canvasRef}
            emptyMessage={camera.message}
            readyLabel="REC · LOCAL"
            status={camera.status}
            videoRef={camera.videoRef}
          />
          <div className="camera-controls">
            <button
              className="primary-button"
              onClick={
                camera.status === "ready"
                  ? submitAttempt
                  : () => {
                      setAttemptError(null);
                      void camera.startCamera();
                    }
              }
              type="button"
              disabled={camera.status === "starting" || attemptStatus === "sampling" || attemptStatus === "saving"}
            >
              {camera.status === "ready" ? readyActionLabel : "Start camera"}
            </button>
            <button className="secondary-button" onClick={nextPrompt} type="button">
              Next prompt
            </button>
            <button className="ghost-button" onClick={camera.stopCamera} type="button">
              Stop
            </button>
          </div>
          <StatusStrip
            cameraMessage={camera.message}
            attemptStatus={attemptStatus}
            attemptError={attemptError}
          />
          {result ? <AttemptResult result={result} selectedItem={selectedItem} /> : null}
        </section>

        <aside className="progress-panel">
          <div className="panel-heading">
            <span>History</span>
            <strong>{recentAttempts.length} recent</strong>
          </div>
          <p className="progress-note">
            {checkerActive
              ? "Active-card prompts can show pass counts; other prompts stay fail-closed."
              : "Automatic checking is inactive; rows below are saved practice history only."}
          </p>
          <div className="progress-list">
            {progress
              .filter((item) => item.attempts > 0)
              .slice(0, 10)
              .map((item) => (
                <div className="progress-row" key={item.vocabularyId}>
                  <span>{item.label}</span>
                  <strong>
                    {checkerActive ? `${item.passes}/${item.attempts}` : `${item.attempts} saved`}
                  </strong>
                </div>
              ))}
            {progress.every((item) => item.attempts === 0) ? (
              <p className="empty-copy">
                No saved attempts yet — start the camera to add practice history.
              </p>
            ) : null}
          </div>
        </aside>
      </section>
      {DATASET_COLLECTION_ENABLED ? (
        <DatasetCollectionPanel
          activeStream={camera.activeStream}
          cameraSettings={camera.settings}
          onSelectVocabulary={setSelectedId}
          selectedItem={selectedItem}
        />
      ) : null}
    </main>
  );
}

function ModelStatus({ modelCard }: { modelCard: ModelCard | null }) {
  const trainedLabelCount = modelLabelCount(modelCard);
  let trainedScope = "the model-card labels";
  if (trainedLabelCount === 1) {
    trainedScope = "1 model-card label";
  } else if (trainedLabelCount > 1) {
    trainedScope = `${trainedLabelCount} model-card labels`;
  }

  return (
    <div className="model-status">
      <span>Checker</span>
      <strong>{modelCard?.status === "trained" ? "Trained card" : "Practice ledger"}</strong>
      <p>
        {modelCard?.status === "trained"
          ? `Automatic sign checking is limited to ${trainedScope}; other prompts stay fail-closed.`
          : "Automatic sign checking is not trained; attempts save as practice history only."}
      </p>
    </div>
  );
}

function modelLabelCount(modelCard: ModelCard | null) {
  const labelMap = modelCard?.model?.label_to_index;
  return labelMap ? Object.keys(labelMap).length : 0;
}

function StatusStrip({
  cameraMessage,
  attemptStatus,
  attemptError,
}: {
  cameraMessage: string;
  attemptStatus: AttemptStatus;
  attemptError: string | null;
}) {
  const attemptCopy: Record<AttemptStatus, string> = {
    idle: "Ready for next attempt",
    sampling: "Sampling local camera frames.",
    saving: "Saving your practice history.",
    saved: "Saved to your practice history.",
    error: "Attempt failed to save",
  };

  return (
    <div className="status-strip">
      <span>{cameraMessage}</span>
      <span>{attemptCopy[attemptStatus]}</span>
      {attemptError ? <strong>{attemptError}</strong> : null}
    </div>
  );
}

function AttemptResult({
  result,
  selectedItem,
}: {
  result: DecisionResult;
  selectedItem: VocabularyItem;
}) {
  const dimensionLabel = result.hintDimension
    ? result.hintDimension.charAt(0).toUpperCase() + result.hintDimension.slice(1)
    : null;
  const trainedModelActive = result.modelStatus === "trained";
  return (
    <div className={`attempt-result ${result.passed ? "pass" : "fail"}`}>
      <span>{result.passed ? "Passed" : trainedModelActive ? "Try again" : "Practice saved"}</span>
      <h2>{selectedItem.label}</h2>
      {dimensionLabel ? (
        <p className="attempt-result-dimension">
          <strong>Tip · {dimensionLabel}.</strong> {result.hint}
        </p>
      ) : (
        <p>{result.hint}</p>
      )}
      {result.reasons.length > 0 ? (
        <ul className="attempt-result-reasons">
          {result.reasons.map((reason) => (
            <li key={reason}>{REASON_COPY[reason]}</li>
          ))}
        </ul>
      ) : null}
      <dl>
        <div>
          <dt>Confidence</dt>
          <dd>{trainedModelActive ? `${Math.round((result.confidence ?? 0) * 100)}%` : "--"}</dd>
        </div>
        <div>
          <dt>Threshold</dt>
          <dd>{trainedModelActive ? `${Math.round((result.threshold ?? 0) * 100)}%` : "Not active"}</dd>
        </div>
        <div>
          <dt>Model</dt>
          <dd>{result.modelStatus === "trained" ? "Trained" : "Practice"}</dd>
        </div>
      </dl>
    </div>
  );
}
