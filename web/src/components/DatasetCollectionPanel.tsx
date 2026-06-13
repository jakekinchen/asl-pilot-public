"use client";

import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { VocabularyItem } from "@/lib/vocabulary";
import type { NegativeChallengeType } from "@/lib/server-store";

type ConsentState = {
  ageEligible: boolean;
  allowModelTraining: boolean;
  allowValidation: boolean;
  allowPilotUse: boolean;
  allowDerivedArtifactRetention: boolean;
  allowDeidentifiedMetadataRetention: boolean;
  retentionAcknowledged: boolean;
  withdrawalAcknowledged: boolean;
};

type CaptureConditionState = {
  frontLightingConfirmed: boolean;
  upperTorsoAndHandsVisibleConfirmed: boolean;
  cameraDistanceWithinPilotRangeConfirmed: boolean;
  isolatedPromptSignConfirmed: boolean;
  emptyCameraConfirmed: boolean;
  noHandsVisibleConfirmed: boolean;
  lowLightConfirmed: boolean;
  offCenterConfirmed: boolean;
  hardNegativeConditionConfirmed: boolean;
  expectedRejectOutcomeConfirmed: boolean;
};

type SplitName = "train" | "validation" | "test";
type CaptureMode = "vocabulary" | "negative_challenge";
type VocabularyPlanAssignment = {
  split: SplitName;
  signer_alias: string;
  label_id: string;
  display_text: string;
  capture_count_for_label_split: number;
};
type ChallengePlanAssignment = {
  split: "negative_challenge";
  signer_alias: string;
  challenge_type: NegativeChallengeType;
  expected_outcome: "reject";
  capture_count_for_type: number;
};

type CollectionPlan = {
  schema_version: "asl-pilot-dataset-collection-plan/v1";
  targets: {
    vocabulary_labels: number;
    target_signers: number;
    signers_by_split: Record<SplitName, number>;
    clips_per_label_per_split: number;
    negative_challenge: {
      required_types: NegativeChallengeType[];
      clips_per_type: number;
      signer_count: number;
      signer_disjoint_from_vocabulary: boolean;
    };
  };
  planned_signer_counts: Record<SplitName, number>;
  assignment_count: number;
  negative_challenge_assignment_count: number;
  warnings: string[];
  assignments: VocabularyPlanAssignment[];
  negative_challenge_assignments: ChallengePlanAssignment[];
};

type CollectionPlanReviewGate = {
  status?: string;
  blockers?: unknown;
};

type RemediationQueueRow = {
  queue_index: number;
  assignment_key: string;
  assignment_type: "vocabulary_capture" | "negative_challenge_capture";
  priority_bucket: string;
  priority_score: number;
  split: SplitName | "negative_challenge";
  signer_alias: string;
  label_id: string | null;
  display_text: string | null;
  challenge_type: NegativeChallengeType | null;
  expected_outcome: "reject" | null;
};

type RemediationQueue = {
  status: "queue_ready_not_training_data";
  queue_summary: {
    assignment_count: number;
    priority_label_count: number;
  } | null;
  queue: RemediationQueueRow[];
};

type CollectionPlanResponse = {
  plan?: CollectionPlan;
  remediationQueue?: RemediationQueue | null;
  error?: string;
  reviewGate?: CollectionPlanReviewGate | null;
};

type CoverageState = {
  targets: {
    targetSigners: number;
    signersBySplit: Record<SplitName, number>;
    clipsPerLabelPerSplit: number;
    vocabularyLabels: number;
    negativeChallengeTypes: NegativeChallengeType[];
    negativeChallengeClipsPerType: number;
  };
  signerAlias: string | null;
  signerSplit: SplitName | null;
  totalClips: number;
  consentedClips: number;
  exportableClips: number;
  totalChallengeClips: number;
  consentedChallengeClips: number;
  exportableChallengeClips: number;
  consentedChallengeCountsByType: Record<NegativeChallengeType, number>;
  exportableChallengeCountsByType: Record<NegativeChallengeType, number>;
  consentedChallengeSignerCount: number;
  exportableChallengeSignerCount: number;
  missingExportableChallengeTypes: NegativeChallengeType[];
  consentedSignerCountsBySplit: Record<SplitName, number>;
  exportableSignerCountsBySplit: Record<SplitName, number>;
  consentedCoveredLabelsBySplit: Record<SplitName, number>;
  exportableCoveredLabelsBySplit: Record<SplitName, number>;
  missingExportableLabelsBySplit: Record<SplitName, string[]>;
  selectedLabelCoverage: Record<SplitName, number> | null;
  selectedLabelExportableCoverage: Record<SplitName, number> | null;
  reviewPendingClips: number;
  reviewPendingChallengeClips: number;
  blockedPlanAssignmentKeys: string[];
  blockedVocabularyPlanAssignmentKeys: string[];
  blockedChallengePlanAssignmentKeys: string[];
  reviewContract: string;
};

const EMPTY_CONSENT: ConsentState = {
  ageEligible: false,
  allowModelTraining: false,
  allowValidation: false,
  allowPilotUse: false,
  allowDerivedArtifactRetention: false,
  allowDeidentifiedMetadataRetention: false,
  retentionAcknowledged: false,
  withdrawalAcknowledged: false,
};
const EMPTY_CAPTURE_CONDITION: CaptureConditionState = {
  frontLightingConfirmed: false,
  upperTorsoAndHandsVisibleConfirmed: false,
  cameraDistanceWithinPilotRangeConfirmed: false,
  isolatedPromptSignConfirmed: false,
  emptyCameraConfirmed: false,
  noHandsVisibleConfirmed: false,
  lowLightConfirmed: false,
  offCenterConfirmed: false,
  hardNegativeConditionConfirmed: false,
  expectedRejectOutcomeConfirmed: false,
};
const CAPTURE_CONDITION_SCHEMA_VERSION = "asl-pilot-capture-conditions/v1";
const RECORDING_DURATION_MS = 3200;
const CHALLENGE_TYPE_OPTIONS: { value: NegativeChallengeType; label: string }[] = [
  { value: "idle_hands", label: "Idle hands" },
  { value: "empty_camera", label: "Empty camera" },
  { value: "no_hands_visible", label: "No hands visible" },
  { value: "low_light", label: "Low light" },
  { value: "off_center", label: "Off center" },
  { value: "hands_cropped_out", label: "Hands cropped out" },
  { value: "waving", label: "Waving" },
  { value: "thumbs_up", label: "Thumbs up" },
  { value: "counting", label: "Counting" },
  { value: "fingerspelling_like_motion", label: "Fingerspelling-like motion" },
  { value: "wrong_location", label: "Wrong location" },
  { value: "wrong_palm_orientation", label: "Wrong palm orientation" },
  { value: "partial_sign", label: "Partial sign" },
  { value: "non_target_asl_sign", label: "Non-target ASL sign" },
  { value: "casual_non_asl_gesture", label: "Casual non-ASL gesture" },
  { value: "mouth_touch", label: "Mouth touch" },
  { value: "hand_clap", label: "Hand clap" },
];

export function DatasetCollectionPanel({
  activeStream,
  selectedItem,
  cameraSettings,
  onSelectVocabulary,
}: {
  activeStream: MediaStream | null;
  selectedItem: VocabularyItem;
  cameraSettings: MediaTrackSettings | null;
  onSelectVocabulary: (vocabularyId: string) => void;
}) {
  // EXPLICIT_DATASET_COLLECTION_UI: uploads are allowed only from this consent panel.
  const chunksRef = useRef<Blob[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const autoLoadedInitialPlanKeyRef = useRef<string | null>(null);
  const [signerAlias, setSignerAlias] = useState("");
  const [captureMode, setCaptureMode] = useState<CaptureMode>("vocabulary");
  const [challengeType, setChallengeType] = useState<NegativeChallengeType>("empty_camera");
  const [consent, setConsent] = useState<ConsentState>(EMPTY_CONSENT);
  const [captureCondition, setCaptureCondition] = useState<CaptureConditionState>(EMPTY_CAPTURE_CONDITION);
  const [status, setStatus] = useState<"idle" | "recording" | "uploading" | "saved" | "error">("idle");
  const [message, setMessage] = useState("Start the camera, confirm consent, then record a short training clip.");
  const [coverage, setCoverage] = useState<CoverageState | null>(null);
  const [collectionPlan, setCollectionPlan] = useState<CollectionPlan | null>(null);
  const [remediationQueue, setRemediationQueue] = useState<RemediationQueue | null>(null);
  const [planStatus, setPlanStatus] = useState<"idle" | "loaded" | "missing">("idle");
  const [planError, setPlanError] = useState<string | null>(null);
  const [planBlockers, setPlanBlockers] = useState<string[]>([]);
  const [selectedPlanKey, setSelectedPlanKey] = useState("");

  const refreshCoverage = useCallback(async (): Promise<CoverageState | null> => {
    const params = new URLSearchParams({ vocabularyId: selectedItem.id });
    if (signerAlias.trim()) params.set("signerAlias", signerAlias.trim());
    const response = await fetch(`/api/dataset/coverage?${params}`, { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as { coverage?: CoverageState };
    if (data.coverage) {
      setCoverage(data.coverage);
      return data.coverage;
    }
    return null;
  }, [selectedItem.id, signerAlias]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void refreshCoverage();
    }, 0);
    return () => window.clearTimeout(handle);
  }, [refreshCoverage]);

  useEffect(() => {
    void refreshCollectionPlan();
  }, []);

  const priorityByAssignmentKey = useMemo(() => {
    const rows = remediationQueue?.queue ?? [];
    return new Map(rows.map((row) => [row.assignment_key, row]));
  }, [remediationQueue]);

  const planAssignments = useMemo(() => {
    const vocabularyAssignments = collectionPlan?.assignments.map((assignment, index) => ({
      key: `vocabulary:${index}`,
      label: assignmentLabel({
        key: `vocabulary:${index}`,
        split: splitLabel(assignment.split),
        signerAlias: assignment.signer_alias,
        displayText: assignment.display_text,
        priority: priorityByAssignmentKey.get(`vocabulary:${index}`),
      }),
      assignment,
      captureMode: "vocabulary" as const,
      priority: priorityByAssignmentKey.get(`vocabulary:${index}`) ?? null,
    })) ?? [];
    const challengeAssignments = collectionPlan?.negative_challenge_assignments.map((assignment, index) => ({
      key: `negative_challenge:${index}`,
      label: assignmentLabel({
        key: `negative_challenge:${index}`,
        split: "Challenge",
        signerAlias: assignment.signer_alias,
        displayText: challengeLabel(assignment.challenge_type),
        priority: priorityByAssignmentKey.get(`negative_challenge:${index}`),
      }),
      assignment,
      captureMode: "negative_challenge" as const,
      priority: priorityByAssignmentKey.get(`negative_challenge:${index}`) ?? null,
    })) ?? [];
    return [...vocabularyAssignments, ...challengeAssignments].sort(comparePlanAssignments);
  }, [collectionPlan, priorityByAssignmentKey]);
  const blockedPlanAssignmentKeys = useMemo(
    () => new Set(coverage?.blockedPlanAssignmentKeys ?? []),
    [coverage],
  );
  const openPlanAssignments = useMemo(
    () => planAssignments.filter((assignment) => !blockedPlanAssignmentKeys.has(assignment.key)),
    [blockedPlanAssignmentKeys, planAssignments],
  );
  const availablePlanAssignments = coverage ? openPlanAssignments : planAssignments;
  const selectablePlanAssignments = useMemo(() => {
    if (!remediationQueue) return availablePlanAssignments;
    return availablePlanAssignments.filter((assignment) => assignment.priority !== null);
  }, [availablePlanAssignments, remediationQueue]);
  const effectiveSelectedPlanKey = useMemo(() => {
    if (
      selectedPlanKey &&
      selectablePlanAssignments.some((assignment) => assignment.key === selectedPlanKey) &&
      (!coverage || !blockedPlanAssignmentKeys.has(selectedPlanKey))
    ) {
      return selectedPlanKey;
    }
    return selectablePlanAssignments[0]?.key ?? "";
  }, [blockedPlanAssignmentKeys, coverage, selectablePlanAssignments, selectedPlanKey]);
  const selectedPlanAssignment = useMemo(
    () => planAssignments.find((assignment) => assignment.key === effectiveSelectedPlanKey) ?? null,
    [effectiveSelectedPlanKey, planAssignments],
  );
  const planAssignmentMatchesCapture = useMemo(() => {
    if (!selectedPlanAssignment) return false;
    if (blockedPlanAssignmentKeys.has(selectedPlanAssignment.key)) return false;
    if (selectedPlanAssignment.captureMode !== captureMode) return false;
    if (selectedPlanAssignment.assignment.signer_alias !== signerAlias.trim()) return false;
    if (captureMode === "negative_challenge") {
      return (
        "challenge_type" in selectedPlanAssignment.assignment &&
        selectedPlanAssignment.assignment.challenge_type === challengeType
      );
    }
    return (
      "label_id" in selectedPlanAssignment.assignment &&
      selectedPlanAssignment.assignment.label_id === selectedItem.id
    );
  }, [blockedPlanAssignmentKeys, captureMode, challengeType, selectedItem.id, selectedPlanAssignment, signerAlias]);
  const captureConditionMatchesCapture = useMemo(
    () => conditionMatchesCapture(captureCondition, captureMode, challengeType),
    [captureCondition, captureMode, challengeType],
  );

  const canRecord = useMemo(
    () =>
      Boolean(activeStream) &&
      signerAlias.trim().length > 0 &&
      planAssignmentMatchesCapture &&
      captureConditionMatchesCapture &&
      Object.values(consent).every(Boolean) &&
      typeof MediaRecorder !== "undefined",
    [activeStream, captureConditionMatchesCapture, consent, planAssignmentMatchesCapture, signerAlias],
  );

  async function refreshCollectionPlan() {
    setPlanStatus("idle");
    setPlanError(null);
    setPlanBlockers([]);
    const response = await fetch("/api/dataset/plan", { cache: "no-store" });
    const data = await readCollectionPlanResponse(response);
    if (!response.ok) {
      setCollectionPlan(null);
      setRemediationQueue(null);
      setSelectedPlanKey("");
      setPlanStatus("missing");
      setPlanError(data.error ?? "Unable to load collection plan.");
      setPlanBlockers(reviewGateBlockers(data.reviewGate));
      return;
    }
    if (!data.plan) {
      setCollectionPlan(null);
      setRemediationQueue(null);
      setSelectedPlanKey("");
      setPlanStatus("missing");
      setPlanError(data.error ?? "Collection plan response did not include a plan.");
      setPlanBlockers(reviewGateBlockers(data.reviewGate));
      return;
    }
    setCollectionPlan(data.plan);
    setRemediationQueue(data.remediationQueue ?? null);
    setSelectedPlanKey((current) => current || firstResponseAssignmentKey(data));
    setPlanStatus("loaded");
  }

  const applyPlanAssignment = useCallback((key = effectiveSelectedPlanKey) => {
    const selected = planAssignments.find((assignment) => assignment.key === key);
    if (!selected) return;
    setSelectedPlanKey(selected.key);
    setSignerAlias(selected.assignment.signer_alias);
    setCaptureMode(selected.captureMode);
    setCaptureCondition(EMPTY_CAPTURE_CONDITION);
    if (selected.captureMode === "negative_challenge") {
      setChallengeType(selected.assignment.challenge_type);
    } else {
      onSelectVocabulary(selected.assignment.label_id);
    }
    setStatus("idle");
    setMessage(
      selected.captureMode === "negative_challenge"
        ? `Loaded ${selected.key}: ${challengeLabel(selected.assignment.challenge_type)} challenge for ${selected.assignment.signer_alias}.`
        : `Loaded ${selected.key}: ${selected.assignment.display_text} for ${selected.assignment.signer_alias}.`,
    );
  }, [effectiveSelectedPlanKey, onSelectVocabulary, planAssignments]);

  useEffect(() => {
    if (planStatus !== "loaded" || !effectiveSelectedPlanKey || signerAlias.trim()) return;
    if (autoLoadedInitialPlanKeyRef.current === effectiveSelectedPlanKey) return;
    const selected = planAssignments.find((assignment) => assignment.key === effectiveSelectedPlanKey);
    if (!selected) return;
    autoLoadedInitialPlanKeyRef.current = selected.key;
    const timer = window.setTimeout(() => applyPlanAssignment(selected.key), 0);
    return () => window.clearTimeout(timer);
  }, [applyPlanAssignment, effectiveSelectedPlanKey, planAssignments, planStatus, signerAlias]);

  async function recordClip() {
    if (!activeStream || !canRecord) {
      setStatus("error");
      setMessage("Camera, a loaded plan assignment, and every consent field are required before collection.");
      return;
    }

    chunksRef.current = [];
    const mimeType = chooseMimeType();
    const recorder = new MediaRecorder(
      activeStream,
      mimeType ? { mimeType } : undefined,
    );
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onerror = () => {
      setStatus("error");
      setMessage("Recording failed. Try again with the camera still active.");
    };
    recorder.onstop = () => {
      void uploadClip(recorder.mimeType || "video/webm");
    };

    setStatus("recording");
    setMessage(
      captureMode === "negative_challenge"
        ? `Recording ${challengeLabel(challengeType)} challenge. Keep the challenge condition steady.`
        : `Recording ${selectedItem.label}. Hold the isolated sign in frame.`,
    );
    recorder.start();
    window.setTimeout(() => recorder.stop(), RECORDING_DURATION_MS);
  }

  async function uploadClip(mimeType: string) {
    setStatus("uploading");
    const clipBlob = new Blob(chunksRef.current, { type: mimeType || "video/webm" });
    const formData = new FormData();
    const clipStem = captureMode === "negative_challenge" ? challengeType : selectedItem.id;
    formData.set("clip", clipBlob, `${clipStem}-${Date.now()}.webm`);
    formData.set("clipKind", captureMode);
    formData.set("planAssignmentKey", effectiveSelectedPlanKey);
    if (captureMode === "negative_challenge") {
      formData.set("challengeType", challengeType);
    } else {
      formData.set("vocabularyId", selectedItem.id);
    }
    formData.set("signerAlias", signerAlias.trim());
    formData.set("durationMs", String(RECORDING_DURATION_MS));
    formData.set("mediaStreamTrackSettings", JSON.stringify(cameraSettings ?? {}));
    formData.set(
      "captureConditionEvidence",
      JSON.stringify(captureConditionPayload(captureCondition, captureMode, challengeType)),
    );
    for (const [key, value] of Object.entries(consent)) {
      formData.set(key, String(value));
    }

    const response = await fetch("/api/dataset/clips", {
      method: "POST",
      body: formData,
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus("error");
      setMessage(data.error ?? "Dataset clip upload failed.");
      return;
    }
    setStatus("saved");
    const refreshedCoverage = await refreshCoverage();
    const nextBlockedKeys = new Set(refreshedCoverage?.blockedPlanAssignmentKeys ?? coverage?.blockedPlanAssignmentKeys ?? []);
    nextBlockedKeys.add(effectiveSelectedPlanKey);
    const nextAssignment = nextOpenPlanAssignmentAfter(effectiveSelectedPlanKey, selectablePlanAssignments, nextBlockedKeys);
    if (nextAssignment) {
      applyPlanAssignment(nextAssignment.key);
      setMessage(
        captureMode === "negative_challenge"
          ? `Consented challenge clip saved locally. Loaded next open assignment for ${nextAssignment.assignment.signer_alias}.`
          : `Consented dataset clip saved locally. Loaded next open assignment for ${nextAssignment.assignment.signer_alias}.`,
      );
    } else {
      setSelectedPlanKey("");
      setMessage(
        captureMode === "negative_challenge"
          ? "Consented challenge clip saved locally. No open collection-plan assignments remain."
          : "Consented dataset clip saved locally. No open collection-plan assignments remain.",
      );
    }
  }

  function toggleConsent(key: keyof ConsentState) {
    setConsent((current) => ({ ...current, [key]: !current[key] }));
  }

  function toggleCaptureCondition(key: keyof CaptureConditionState) {
    setCaptureCondition((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <section className="collection-panel">
      <div className="panel-heading">
        <span>Dataset capture · consented</span>
        <strong>
          {coverage?.exportableClips ?? 0}/{coverage?.consentedClips ?? 0} reviewed clips
        </strong>
      </div>
      <p>
        Capture is separate from practice. A raw clip is recorded and stored
        only after every consent field is checked. Clips stay local and are
        not redistributed without separate written permission.
      </p>
      <PlanPicker
        assignments={selectablePlanAssignments}
        blockedAssignmentCount={coverage?.blockedPlanAssignmentKeys.length ?? 0}
        fullOpenAssignmentCount={availablePlanAssignments.length}
        plan={collectionPlan}
        planBlockers={planBlockers}
        planError={planError}
        planStatus={planStatus}
        priorityQueue={remediationQueue}
        selectedPlanKey={effectiveSelectedPlanKey}
        totalAssignmentCount={planAssignments.length}
        onApply={applyPlanAssignment}
        onRefresh={() => void refreshCollectionPlan()}
        onSelect={setSelectedPlanKey}
      />
      <div className="segmented-control" aria-label="Dataset capture mode">
        <button
          className={captureMode === "vocabulary" ? "active" : ""}
          onClick={() => {
            setCaptureMode("vocabulary");
            setCaptureCondition(EMPTY_CAPTURE_CONDITION);
          }}
          type="button"
        >
          Sign clip
        </button>
        <button
          className={captureMode === "negative_challenge" ? "active" : ""}
          onClick={() => {
            setCaptureMode("negative_challenge");
            setCaptureCondition(EMPTY_CAPTURE_CONDITION);
          }}
          type="button"
        >
          Challenge
        </button>
      </div>
      <label>
        Signer alias
        <input
          value={signerAlias}
          onChange={(event) => setSignerAlias(event.target.value)}
          placeholder="signer-001"
        />
      </label>
      {captureMode === "negative_challenge" ? (
        <label>
          Challenge type
          <select
            value={challengeType}
            onChange={(event) => {
              setChallengeType(event.target.value as NegativeChallengeType);
              setCaptureCondition(EMPTY_CAPTURE_CONDITION);
            }}
          >
            {CHALLENGE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="consent-grid">
        {captureMode === "vocabulary" ? (
          <>
            <ConsentCheckbox
              checked={captureCondition.frontLightingConfirmed}
              label="Front lighting is even and the camera image is not backlit."
              onChange={() => toggleCaptureCondition("frontLightingConfirmed")}
            />
            <ConsentCheckbox
              checked={captureCondition.upperTorsoAndHandsVisibleConfirmed}
              label="Upper torso and both hands stay visible in frame."
              onChange={() => toggleCaptureCondition("upperTorsoAndHandsVisibleConfirmed")}
            />
            <ConsentCheckbox
              checked={captureCondition.cameraDistanceWithinPilotRangeConfirmed}
              label="Camera distance is within the 0.8-1.5 meter pilot range."
              onChange={() => toggleCaptureCondition("cameraDistanceWithinPilotRangeConfirmed")}
            />
            <ConsentCheckbox
              checked={captureCondition.isolatedPromptSignConfirmed}
              label="Clip contains one isolated prompted sign attempt."
              onChange={() => toggleCaptureCondition("isolatedPromptSignConfirmed")}
            />
          </>
        ) : (
          <>
            <ConsentCheckbox
              checked={challengeConditionConfirmed(captureCondition, challengeType)}
              label={`The ${challengeLabel(challengeType).toLowerCase()} challenge condition is visible for the full clip.`}
              onChange={() => toggleExclusiveChallengeCondition(challengeType, setCaptureCondition)}
            />
            <ConsentCheckbox
              checked={captureCondition.expectedRejectOutcomeConfirmed}
              label="This challenge clip is reject-only and must not be counted as correct."
              onChange={() => toggleCaptureCondition("expectedRejectOutcomeConfirmed")}
            />
          </>
        )}
      </div>
      <CoverageCockpit coverage={coverage} selectedItem={selectedItem} />
      <div className="consent-grid">
        <ConsentCheckbox
          checked={consent.ageEligible}
          label="Signer is eligible to consent for this pilot."
          onChange={() => toggleConsent("ageEligible")}
        />
        <ConsentCheckbox
          checked={consent.allowModelTraining}
          label="Clip may be used for from-scratch model training."
          onChange={() => toggleConsent("allowModelTraining")}
        />
        <ConsentCheckbox
          checked={consent.allowValidation}
          label="Clip may be used for validation or test splits."
          onChange={() => toggleConsent("allowValidation")}
        />
        <ConsentCheckbox
          checked={consent.allowPilotUse}
          label="Clip may be used for this pilot submission."
          onChange={() => toggleConsent("allowPilotUse")}
        />
        <ConsentCheckbox
          checked={consent.allowDerivedArtifactRetention}
          label="Derived trained artifacts may be retained after collection."
          onChange={() => toggleConsent("allowDerivedArtifactRetention")}
        />
        <ConsentCheckbox
          checked={consent.allowDeidentifiedMetadataRetention}
          label="De-identified metadata may be retained for provenance and audit."
          onChange={() => toggleConsent("allowDeidentifiedMetadataRetention")}
        />
        <ConsentCheckbox
          checked={consent.retentionAcknowledged}
          label="Retention and deletion process has been explained."
          onChange={() => toggleConsent("retentionAcknowledged")}
        />
        <ConsentCheckbox
          checked={consent.withdrawalAcknowledged}
          label="Withdrawal limits for already-trained artifacts have been explained."
          onChange={() => toggleConsent("withdrawalAcknowledged")}
        />
      </div>
      <div className="collection-actions">
        <button
          className="secondary-button"
          disabled={!canRecord || status === "recording" || status === "uploading"}
          onClick={recordClip}
          type="button"
        >
          Record {captureMode === "negative_challenge" ? challengeLabel(challengeType) : selectedItem.label}
        </button>
        <span className={status === "error" ? "collection-error" : ""}>{message}</span>
      </div>
    </section>
  );
}

function PlanPicker({
  assignments,
  blockedAssignmentCount,
  fullOpenAssignmentCount,
  plan,
  planBlockers,
  planError,
  planStatus,
  priorityQueue,
  selectedPlanKey,
  totalAssignmentCount,
  onApply,
  onRefresh,
  onSelect,
}: {
  assignments: Array<{
    key: string;
    label: string;
    assignment: VocabularyPlanAssignment | ChallengePlanAssignment;
    captureMode: CaptureMode;
    priority: RemediationQueueRow | null;
  }>;
  blockedAssignmentCount: number;
  fullOpenAssignmentCount: number;
  plan: CollectionPlan | null;
  planBlockers: string[];
  planError: string | null;
  planStatus: "idle" | "loaded" | "missing";
  priorityQueue: RemediationQueue | null;
  selectedPlanKey: string;
  totalAssignmentCount: number;
  onApply: (key?: string) => void;
  onRefresh: () => void;
  onSelect: (key: string) => void;
}) {
  const selectedAssignment = assignments.find((assignment) => assignment.key === selectedPlanKey);
  const queuedAssignmentCount = priorityQueue?.queue_summary?.assignment_count ?? priorityQueue?.queue.length ?? 0;
  const openQueuedAssignmentCount = priorityQueue
    ? assignments.filter((assignment) => assignment.priority !== null).length
    : 0;
  return (
    <div className="plan-picker">
      <div className="coverage-row">
        <span>{priorityQueue ? "Active queue" : "Collection plan"}</span>
        <strong>
          {plan
            ? priorityQueue
              ? `${openQueuedAssignmentCount}/${queuedAssignmentCount} queued`
              : `${assignments.length}/${totalAssignmentCount} open`
            : planStatus === "missing"
              ? "No plan loaded"
              : "Loading"}
        </strong>
      </div>
      {priorityQueue && plan ? (
        <div className="coverage-row">
          <span>Collection plan</span>
          <strong>{`${fullOpenAssignmentCount}/${totalAssignmentCount} open`}</strong>
        </div>
      ) : null}
      {selectedAssignment ? (
        <div className="coverage-row">
          <span>{selectedAssignment.priority ? `Queue #${selectedAssignment.priority.queue_index}` : "Assignment key"}</span>
          <strong>{selectedAssignment.priority ? selectedAssignment.priority.priority_bucket : selectedAssignment.key}</strong>
        </div>
      ) : null}
      {priorityQueue ? (
        <div className="coverage-row">
          <span>Priority queue</span>
          <strong>{priorityQueue.queue_summary?.priority_label_count ?? 0} labels</strong>
        </div>
      ) : null}
      {assignments.length > 0 ? (
        <div className="plan-controls">
          <select
            aria-label="Collection assignment"
            value={selectedPlanKey}
            onChange={(event) => onSelect(event.target.value)}
          >
            {assignments.map((assignment) => (
              <option key={assignment.key} value={assignment.key}>
                {assignment.label}
              </option>
            ))}
          </select>
          <button className="secondary-button" type="button" onClick={() => onApply()}>
            Load assignment
          </button>
        </div>
      ) : (
        <div className="plan-controls">
          <button className="secondary-button" type="button" onClick={onRefresh}>
            Reload plan
          </button>
          {blockedAssignmentCount > 0 ? (
            <span>{blockedAssignmentCount} captured</span>
          ) : null}
        </div>
      )}
      {plan?.warnings.length ? (
        <p className="collection-error">{plan.warnings.join(" ")}</p>
      ) : null}
      {planError ? (
        <div className="collection-error" role="status" aria-live="polite">
          <p>{planError}</p>
          {planBlockers.length > 0 ? (
            <ul>
              {planBlockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

async function readCollectionPlanResponse(response: Response): Promise<CollectionPlanResponse> {
  try {
    return (await response.json()) as CollectionPlanResponse;
  } catch {
    return {};
  }
}

function nextOpenPlanAssignmentAfter(
  currentKey: string,
  assignments: Array<{
    key: string;
    label: string;
    assignment: VocabularyPlanAssignment | ChallengePlanAssignment;
    captureMode: CaptureMode;
    priority: RemediationQueueRow | null;
  }>,
  blockedKeys: Set<string>,
) {
  if (assignments.length === 0) return null;
  const currentIndex = assignments.findIndex((assignment) => assignment.key === currentKey);
  const startIndex = currentIndex >= 0 ? currentIndex + 1 : 0;
  for (let offset = 0; offset < assignments.length; offset += 1) {
    const candidate = assignments[(startIndex + offset) % assignments.length];
    if (!blockedKeys.has(candidate.key)) return candidate;
  }
  return null;
}

function assignmentLabel({
  key,
  split,
  signerAlias,
  displayText,
  priority,
}: {
  key: string;
  split: string;
  signerAlias: string;
  displayText: string;
  priority?: RemediationQueueRow;
}) {
  const prefix = priority ? `#${priority.queue_index} · ${key}` : key;
  return `${prefix} · ${split} · ${signerAlias} · ${displayText}`;
}

function comparePlanAssignments(
  left: {
    key: string;
    priority: RemediationQueueRow | null;
  },
  right: {
    key: string;
    priority: RemediationQueueRow | null;
  },
) {
  if (left.priority && right.priority) return left.priority.queue_index - right.priority.queue_index;
  if (left.priority) return -1;
  if (right.priority) return 1;
  return naturalAssignmentIndex(left.key) - naturalAssignmentIndex(right.key);
}

function naturalAssignmentIndex(key: string) {
  const [kind, rawIndex] = key.split(":");
  const index = Number(rawIndex);
  const kindOffset = kind === "negative_challenge" ? 1_000_000 : 0;
  return kindOffset + (Number.isInteger(index) ? index : Number.MAX_SAFE_INTEGER);
}

function firstResponseAssignmentKey(data: CollectionPlanResponse) {
  const queuedKey = data.remediationQueue?.queue?.[0]?.assignment_key;
  if (queuedKey) return queuedKey;
  if (data.plan?.assignments[0]) return "vocabulary:0";
  if (data.plan?.negative_challenge_assignments[0]) return "negative_challenge:0";
  return "";
}

function reviewGateBlockers(reviewGate: CollectionPlanReviewGate | null | undefined): string[] {
  if (!Array.isArray(reviewGate?.blockers)) return [];
  return reviewGate.blockers.filter((blocker): blocker is string => typeof blocker === "string" && blocker.length > 0);
}

function CoverageCockpit({
  coverage,
  selectedItem,
}: {
  coverage: CoverageState | null;
  selectedItem: VocabularyItem;
}) {
  const selectedCoverage = coverage?.selectedLabelCoverage;
  const selectedExportableCoverage = coverage?.selectedLabelExportableCoverage;
  return (
    <div className="coverage-cockpit">
      <div className="coverage-row">
        <span>Signer split</span>
        <strong>{coverage?.signerSplit ? splitLabel(coverage.signerSplit) : "Enter alias"}</strong>
      </div>
      <div className="coverage-grid">
        {(["train", "validation", "test"] as SplitName[]).map((split) => (
          <div className="coverage-card" key={split}>
            <span>{splitLabel(split)}</span>
            <strong>
              {coverage?.exportableSignerCountsBySplit[split] ?? 0}/
              {coverage?.targets.signersBySplit[split] ?? 0} reviewed signers
            </strong>
            <small>
              {coverage?.consentedSignerCountsBySplit[split] ?? 0} consented signer(s)
            </small>
            <small>
              {coverage?.exportableCoveredLabelsBySplit[split] ?? 0}/
              {coverage?.targets.vocabularyLabels ?? 0} reviewed labels
            </small>
            <small>
              {selectedExportableCoverage?.[split] ?? 0} reviewed /
              {" "}{selectedCoverage?.[split] ?? 0} consented for {selectedItem.label}
            </small>
          </div>
        ))}
      </div>
      <div className="challenge-coverage">
        <div className="coverage-row">
          <span>Challenge clips</span>
          <strong>
            {coverage?.exportableChallengeClips ?? 0}/{(coverage?.targets.negativeChallengeTypes.length ?? 4) * (coverage?.targets.negativeChallengeClipsPerType ?? 5)} reviewed
          </strong>
        </div>
        <small>{coverage?.consentedChallengeClips ?? 0} consented challenge clip(s)</small>
        <div className="coverage-grid">
          {CHALLENGE_TYPE_OPTIONS.map((option) => (
            <div className="coverage-card" key={option.value}>
              <span>{option.label}</span>
              <strong>
                {coverage?.exportableChallengeCountsByType[option.value] ?? 0}/
                {coverage?.targets.negativeChallengeClipsPerType ?? 5} reviewed
              </strong>
              <small>{coverage?.consentedChallengeCountsByType[option.value] ?? 0} consented clip(s)</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConsentCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="consent-checkbox">
      <input checked={checked} onChange={onChange} type="checkbox" />
      <span>{label}</span>
    </label>
  );
}

function conditionMatchesCapture(
  condition: CaptureConditionState,
  captureMode: CaptureMode,
  challengeType: NegativeChallengeType,
) {
  if (captureMode === "vocabulary") {
    return (
      condition.frontLightingConfirmed &&
      condition.upperTorsoAndHandsVisibleConfirmed &&
      condition.cameraDistanceWithinPilotRangeConfirmed &&
      condition.isolatedPromptSignConfirmed &&
      !condition.emptyCameraConfirmed &&
      !condition.noHandsVisibleConfirmed &&
      !condition.lowLightConfirmed &&
      !condition.offCenterConfirmed &&
      !condition.hardNegativeConditionConfirmed &&
      !condition.expectedRejectOutcomeConfirmed
    );
  }
  return (
    challengeConditionConfirmed(condition, challengeType) &&
    condition.expectedRejectOutcomeConfirmed &&
    !condition.frontLightingConfirmed &&
    !condition.upperTorsoAndHandsVisibleConfirmed &&
    !condition.cameraDistanceWithinPilotRangeConfirmed &&
    !condition.isolatedPromptSignConfirmed
  );
}

function captureConditionPayload(
  condition: CaptureConditionState,
  captureMode: CaptureMode,
  challengeType: NegativeChallengeType,
) {
  return {
    schemaVersion: CAPTURE_CONDITION_SCHEMA_VERSION,
    captureEnvironment: captureMode === "negative_challenge" ? "negative_challenge" : "controlled_vocabulary",
    operatorAttestation: conditionMatchesCapture(condition, captureMode, challengeType),
    frontLightingConfirmed: condition.frontLightingConfirmed,
    upperTorsoAndHandsVisibleConfirmed: condition.upperTorsoAndHandsVisibleConfirmed,
    cameraDistanceWithinPilotRangeConfirmed: condition.cameraDistanceWithinPilotRangeConfirmed,
    isolatedPromptSignConfirmed: condition.isolatedPromptSignConfirmed,
    challengeType: captureMode === "negative_challenge" ? challengeType : null,
    emptyCameraConfirmed: condition.emptyCameraConfirmed,
    noHandsVisibleConfirmed: condition.noHandsVisibleConfirmed,
    lowLightConfirmed: condition.lowLightConfirmed,
    offCenterConfirmed: condition.offCenterConfirmed,
    hardNegativeConditionConfirmed: condition.hardNegativeConditionConfirmed,
    expectedRejectOutcomeConfirmed: condition.expectedRejectOutcomeConfirmed,
  };
}

function challengeConditionConfirmed(
  condition: CaptureConditionState,
  challengeType: NegativeChallengeType,
) {
  if (challengeType === "empty_camera") return condition.emptyCameraConfirmed;
  if (challengeType === "no_hands_visible") return condition.noHandsVisibleConfirmed;
  if (challengeType === "low_light") return condition.lowLightConfirmed;
  if (challengeType === "off_center") return condition.offCenterConfirmed;
  return condition.hardNegativeConditionConfirmed;
}

function toggleExclusiveChallengeCondition(
  challengeType: NegativeChallengeType,
  setCaptureCondition: Dispatch<SetStateAction<CaptureConditionState>>,
) {
  setCaptureCondition((current) => {
    const currentlyConfirmed = challengeConditionConfirmed(current, challengeType);
    return {
      ...current,
      emptyCameraConfirmed: challengeType === "empty_camera" ? !currentlyConfirmed : false,
      noHandsVisibleConfirmed: challengeType === "no_hands_visible" ? !currentlyConfirmed : false,
      lowLightConfirmed: challengeType === "low_light" ? !currentlyConfirmed : false,
      offCenterConfirmed: challengeType === "off_center" ? !currentlyConfirmed : false,
      hardNegativeConditionConfirmed: isCoreChallengeType(challengeType) ? false : !currentlyConfirmed,
      frontLightingConfirmed: false,
      upperTorsoAndHandsVisibleConfirmed: false,
      cameraDistanceWithinPilotRangeConfirmed: false,
      isolatedPromptSignConfirmed: false,
    };
  });
}

function isCoreChallengeType(challengeType: NegativeChallengeType) {
  return (
    challengeType === "empty_camera" ||
    challengeType === "no_hands_visible" ||
    challengeType === "low_light" ||
    challengeType === "off_center"
  );
}

function chooseMimeType() {
  const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
}

function splitLabel(split: SplitName) {
  if (split === "validation") return "Validation";
  if (split === "test") return "Test";
  return "Train";
}

function challengeLabel(challengeType: NegativeChallengeType) {
  return CHALLENGE_TYPE_OPTIONS.find((option) => option.value === challengeType)?.label ?? "Challenge";
}
