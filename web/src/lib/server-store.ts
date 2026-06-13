import "server-only";

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import { readFileSync, promises as fs } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { getVocabularyItem, VOCABULARY } from "./vocabulary";

const SESSION_COOKIE = "asl_pilot_session";
const PROJECT_ROOT = path.resolve(process.cwd(), "..");
const STORE_PATH = process.env.ASL_PILOT_STORE_PATH
  ? path.resolve(process.env.ASL_PILOT_STORE_PATH)
  : path.resolve(process.cwd(), "..", "data", "asl-pilot-store.json");
const DATASET_CLIP_ROOT = process.env.ASL_PILOT_DATASET_CLIP_ROOT
  ? path.resolve(process.env.ASL_PILOT_DATASET_CLIP_ROOT)
  : path.resolve(process.cwd(), "..", "data", "dataset", "clips");
const COLLECTION_PLAN_PATH = process.env.ASL_PILOT_COLLECTION_PLAN_PATH
  ? path.resolve(process.env.ASL_PILOT_COLLECTION_PLAN_PATH)
  : path.resolve(process.cwd(), "..", "data", "dataset", "collection-plan.json");
const MODEL_CARD_PATH = path.resolve(process.cwd(), "public", "model", "model-card.json");
const CANONICAL_VOCABULARY_SOURCE_PATH = path.resolve(process.cwd(), "src", "lib", "vocabulary.ts");
const CANONICAL_VOCABULARY_REVIEW_EVIDENCE_PATH = path.resolve(
  process.cwd(),
  "..",
  "docs",
  "review",
  "final-vocabulary-review.json",
);
const VOCABULARY_SOURCE_PATH = process.env.ASL_PILOT_VOCABULARY_SOURCE_PATH
  ? path.resolve(process.env.ASL_PILOT_VOCABULARY_SOURCE_PATH)
  : CANONICAL_VOCABULARY_SOURCE_PATH;
const DATASET_CONSENT_FORM_PATH = path.resolve(process.cwd(), "..", "docs", "privacy", "dataset-consent-form.md");
const VOCABULARY_REVIEW_EVIDENCE_PATH = process.env.ASL_PILOT_VOCABULARY_REVIEW_EVIDENCE_PATH
  ? path.resolve(process.env.ASL_PILOT_VOCABULARY_REVIEW_EVIDENCE_PATH)
  : CANONICAL_VOCABULARY_REVIEW_EVIDENCE_PATH;
const ALLOW_SMOKE_REVIEW_FIXTURES = process.env.ASL_PILOT_ALLOW_SMOKE_REVIEW_FIXTURES === "true";
const DEFAULT_MODEL_ID = "asl-pilot-rawframe-v0";
const DEFAULT_CONFIDENCE_THRESHOLD = 0.72;
const MAX_DATASET_CLIP_BYTES = 25 * 1024 * 1024;
const MIN_DATASET_CLIP_DURATION_MS = 500;
const MAX_DATASET_CLIP_DURATION_MS = 10_000;
const DATASET_CONSENT_VERSION = "asl-pilot-dataset-consent-v1";
const DATASET_CLIPS_PER_LABEL_PER_SPLIT = 5;
const DATASET_CONSENT_FORM_SHA256 = readDatasetConsentFormSha256();
const DATASET_TARGET_SIGNERS_BY_SPLIT = {
  train: 12,
  validation: 4,
  test: 4,
} as const;
export const NEGATIVE_CHALLENGE_TYPES = [
  "idle_hands",
  "empty_camera",
  "no_hands_visible",
  "low_light",
  "off_center",
  "hands_cropped_out",
  "waving",
  "thumbs_up",
  "counting",
  "fingerspelling_like_motion",
  "wrong_location",
  "wrong_palm_orientation",
  "partial_sign",
  "non_target_asl_sign",
  "casual_non_asl_gesture",
  "mouth_touch",
  "hand_clap",
] as const;
const NEGATIVE_CHALLENGE_CLIPS_PER_TYPE = 5;
const COLLECTION_PLAN_RELATIVE_PATH = "data/dataset/collection-plan.json";
const CAPTURE_CONDITION_SCHEMA_VERSION = "asl-pilot-capture-conditions/v1";
const ACCEPTED_VOCABULARY_GATE_STATUSES = new Set(["reviewed", "source_curated"]);
type AcceptedVocabularyGateStatus = "reviewed" | "source_curated";

function readDatasetConsentFormSha256(): string | null {
  try {
    return crypto
      .createHash("sha256")
      .update(readFileSync(DATASET_CONSENT_FORM_PATH))
      .digest("hex");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function requireDatasetConsentFormSha256(): string {
  if (DATASET_CONSENT_FORM_SHA256) return DATASET_CONSENT_FORM_SHA256;
  throw new Error(
    "Dataset collection is unavailable because the canonical consent form is not packaged in this deployment.",
  );
}

type CollectionPlanReviewGate = {
  status?: unknown;
  vocabulary_source?: {
    path?: unknown;
    sha256?: unknown;
    item_count?: unknown;
  };
  evidence?: {
    path?: unknown;
    exists?: unknown;
    sha256?: unknown;
  };
};

type VocabularyPlanAssignmentSnapshot = {
  assignment_key: string;
  split: "train" | "validation" | "test";
  signer_alias: string;
  label_id: string;
  display_text: string;
  capture_count_for_label_split: number;
};

type NegativeChallengePlanAssignmentSnapshot = {
  assignment_key: string;
  split: "negative_challenge";
  signer_alias: string;
  challenge_type: NegativeChallengeType;
  expected_outcome: "reject";
  capture_count_for_type: number;
};

type CollectionPlanAssignmentSnapshot =
  | VocabularyPlanAssignmentSnapshot
  | NegativeChallengePlanAssignmentSnapshot;

type ValidatedCollectionPlanAssignment = {
  planAssignmentKey: string;
  collectionPlanPath: string;
  collectionPlanSha256: string;
  collectionPlanGeneratedAt: string;
  collectionPlanReviewGateStatus: AcceptedVocabularyGateStatus;
  planAssignmentSnapshot: CollectionPlanAssignmentSnapshot;
};

export type DatasetCaptureConditionEvidence = {
  schemaVersion: typeof CAPTURE_CONDITION_SCHEMA_VERSION;
  captureEnvironment: "controlled_vocabulary" | "negative_challenge";
  operatorAttestation: true;
  operatorAttestedAt: string;
  frontLightingConfirmed: boolean;
  upperTorsoAndHandsVisibleConfirmed: boolean;
  cameraDistanceWithinPilotRangeConfirmed: boolean;
  isolatedPromptSignConfirmed: boolean;
  challengeType: NegativeChallengeType | null;
  emptyCameraConfirmed: boolean;
  noHandsVisibleConfirmed: boolean;
  lowLightConfirmed: boolean;
  offCenterConfirmed: boolean;
  hardNegativeConditionConfirmed: boolean;
  expectedRejectOutcomeConfirmed: boolean;
};

export type PublicUser = {
  id: string;
  email: string;
  name: string;
};

type StoredUser = PublicUser & {
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
};

type StoredSession = {
  id: string;
  userId: string;
  createdAt: string;
};

type PracticeModelPolicy = {
  modelId: string;
  status: "not_trained" | "trained";
  threshold: number;
  perLabelThresholds: Record<string, number>;
};

export type StoredAttempt = {
  id: string;
  userId: string;
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

export type DatasetConsentRecord = {
  id: string;
  userId: string;
  signerAlias: string;
  operatorUserId: string;
  consentVersion: string;
  consentFormSha256: string;
  signedAt: string;
  rawClipStorageLocation: string;
  rawClipAccess: string;
  retentionPeriod: string;
  ageEligible: boolean;
  allowModelTraining: boolean;
  allowValidation: boolean;
  allowPilotUse: boolean;
  allowDerivedArtifactRetention: boolean;
  allowRawClipRedistribution: boolean;
  allowDeidentifiedMetadataRetention: boolean;
  retentionAcknowledged: boolean;
  withdrawalAcknowledged: boolean;
  signerIdentityHash?: string | null;
  signedConsentEvidence?: {
    path: string;
    sha256: string;
    purpose?: string;
  } | null;
  createdAt: string;
};

export type DatasetSignerRecord = {
  id: string;
  userId: string;
  signerAlias: string;
  split: "train" | "validation" | "test";
  identityAttestation: "operator_alias_issued" | "signed_identity_verified";
  signerIdentityHash?: string | null;
  signedConsentEvidence?: {
    path: string;
    sha256: string;
    purpose?: string;
  } | null;
  operatorUserId: string;
  consentVersion: string;
  consentFormSha256: string;
  createdAt: string;
  updatedAt: string;
};

export type NegativeChallengeType = (typeof NEGATIVE_CHALLENGE_TYPES)[number];

export type DatasetClipRecord = {
  id: string;
  userId: string;
  consentRecordId: string;
  signerAlias: string;
  vocabularyId: string;
  planAssignmentKey: string;
  collectionPlanPath: string;
  collectionPlanSha256: string;
  collectionPlanGeneratedAt: string;
  collectionPlanReviewGateStatus: AcceptedVocabularyGateStatus;
  planAssignmentSnapshot: VocabularyPlanAssignmentSnapshot;
  relativeVideoPath: string;
  sha256: string;
  mimeType: string;
  sizeBytes: number;
  durationMs: number;
  mediaStreamTrackSettings: Record<string, unknown>;
  captureConditionEvidence: DatasetCaptureConditionEvidence;
  labelReviewStatus: "needs_qa" | "approved" | "rejected";
  labelReviewer: string | null;
  labelReviewedAt: string | null;
  labelRejectionReason?: string | null;
  labelReviewNotes?: string | null;
  createdAt: string;
};

export type DatasetChallengeClipRecord = {
  id: string;
  userId: string;
  consentRecordId: string;
  signerAlias: string;
  challengeType: NegativeChallengeType;
  planAssignmentKey: string;
  collectionPlanPath: string;
  collectionPlanSha256: string;
  collectionPlanGeneratedAt: string;
  collectionPlanReviewGateStatus: AcceptedVocabularyGateStatus;
  planAssignmentSnapshot: NegativeChallengePlanAssignmentSnapshot;
  relativeVideoPath: string;
  sha256: string;
  mimeType: string;
  sizeBytes: number;
  durationMs: number;
  mediaStreamTrackSettings: Record<string, unknown>;
  captureConditionEvidence: DatasetCaptureConditionEvidence;
  challengeReviewStatus: "needs_review" | "approved" | "rejected";
  challengeReviewer: string | null;
  challengeReviewedAt: string | null;
  challengeRejectionReason?: string | null;
  challengeReviewNotes?: string | null;
  createdAt: string;
};

type StoreShape = {
  users: StoredUser[];
  sessions: StoredSession[];
  attempts: StoredAttempt[];
  datasetSigners: DatasetSignerRecord[];
  consentRecords: DatasetConsentRecord[];
  datasetClips: DatasetClipRecord[];
  datasetChallengeClips: DatasetChallengeClipRecord[];
};

export type ProgressItem = {
  vocabularyId: string;
  label: string;
  attempts: number;
  passes: number;
  fails: number;
  status: "not_started" | "in_progress" | "mastered";
  lastAttemptAt: string | null;
};

const EMPTY_STORE: StoreShape = {
  users: [],
  sessions: [],
  attempts: [],
  datasetSigners: [],
  consentRecords: [],
  datasetClips: [],
  datasetChallengeClips: [],
};

export async function createUserSession(input: {
  email: string;
  name: string;
  password: string;
}): Promise<PublicUser> {
  const email = normalizeEmail(input.email);
  if (!email || input.password.length < 8 || input.name.trim().length < 1) {
    throw new Error("Enter a name, a valid email, and a password of at least 8 characters.");
  }

  const store = await readStore();
  if (store.users.some((user) => user.email === email)) {
    throw new Error("An account already exists for that email.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const user: StoredUser = {
    id: crypto.randomUUID(),
    email,
    name: input.name.trim(),
    passwordHash: hashPassword(input.password, salt),
    passwordSalt: salt,
    createdAt: new Date().toISOString(),
  };
  store.users.push(user);
  const session = createSessionForUser(user.id);
  store.sessions.push(session);
  await writeStore(store);
  await setSessionCookie(session.id);
  return publicUser(user);
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<PublicUser> {
  const email = normalizeEmail(input.email);
  const store = await readStore();
  const user = store.users.find((candidate) => candidate.email === email);
  if (!user || hashPassword(input.password, user.passwordSalt) !== user.passwordHash) {
    throw new Error("Invalid email or password.");
  }
  const session = createSessionForUser(user.id);
  store.sessions.push(session);
  await writeStore(store);
  await setSessionCookie(session.id);
  return publicUser(user);
}

export async function logoutUser(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    const store = await readStore();
    store.sessions = store.sessions.filter((session) => session.id !== sessionId);
    await writeStore(store);
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const user = await getCurrentStoredUser();
  return user ? publicUser(user) : null;
}

export async function saveAttempt(input: {
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
}): Promise<StoredAttempt> {
  const user = await getCurrentStoredUser();
  if (!user) throw new Error("You must be logged in to save practice.");
  const expectedItem = getVocabularyItem(input.vocabularyId);
  if (!expectedItem) {
    throw new Error("Unknown vocabulary item.");
  }
  const modelPolicy = await readPracticeModelPolicy();
  const confidence = clamp(Number(input.confidence), 0, 1);
  const predictedId =
    typeof input.predictedId === "string" && getVocabularyItem(input.predictedId)
      ? input.predictedId
      : null;
  const clientMatchesActiveModel =
    input.modelStatus === modelPolicy.status && input.modelId === modelPolicy.modelId;
  const threshold = thresholdForVocabulary(modelPolicy, expectedItem.id);
  const passed =
    modelPolicy.status === "trained" &&
    clientMatchesActiveModel &&
    Boolean(input.passed) &&
    predictedId === expectedItem.id &&
    confidence >= threshold;
  const attempt: StoredAttempt = {
    id: crypto.randomUUID(),
    userId: user.id,
    vocabularyId: input.vocabularyId,
    passed,
    confidence,
    predictedId,
    modelId: modelPolicy.modelId,
    modelStatus: modelPolicy.status,
    hint: normalizeAttemptHint(input, modelPolicy).slice(0, 600),
    reason: normalizeAttemptReason(input, modelPolicy, clientMatchesActiveModel).slice(0, 600),
    durationMs: input.durationMs,
    frameCount: input.frameCount,
    createdAt: new Date().toISOString(),
  };
  const store = await readStore();
  store.attempts.push(attempt);
  await writeStore(store);
  return attempt;
}

async function readPracticeModelPolicy(): Promise<PracticeModelPolicy> {
  try {
    const raw = await fs.readFile(MODEL_CARD_PATH, "utf8");
    const data = JSON.parse(raw) as {
      model_id?: unknown;
      status?: unknown;
      confidence_thresholds?: {
        default?: unknown;
        per_label?: unknown;
      };
    };
    const status = data.status === "trained" ? "trained" : "not_trained";
    const threshold = clamp(Number(data.confidence_thresholds?.default), 0, 1);
    return {
      modelId: typeof data.model_id === "string" && data.model_id ? data.model_id : DEFAULT_MODEL_ID,
      status,
      threshold: Number.isFinite(threshold) && threshold > 0 ? threshold : DEFAULT_CONFIDENCE_THRESHOLD,
      perLabelThresholds: normalizePerLabelThresholds(data.confidence_thresholds?.per_label),
    };
  } catch {
    return {
      modelId: DEFAULT_MODEL_ID,
      status: "not_trained",
      threshold: DEFAULT_CONFIDENCE_THRESHOLD,
      perLabelThresholds: {},
    };
  }
}

function thresholdForVocabulary(modelPolicy: PracticeModelPolicy, vocabularyId: string) {
  return modelPolicy.perLabelThresholds[vocabularyId] ?? modelPolicy.threshold;
}

function normalizePerLabelThresholds(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const thresholds: Record<string, number> = {};
  for (const [labelId, rawThreshold] of Object.entries(value)) {
    if (!getVocabularyItem(labelId)) continue;
    const threshold = clamp(Number(rawThreshold), 0, 1);
    if (Number.isFinite(threshold) && threshold > 0) thresholds[labelId] = threshold;
  }
  return thresholds;
}

function normalizeAttemptHint(
  input: {
    hint: string;
  },
  modelPolicy: PracticeModelPolicy,
) {
  if (modelPolicy.status !== "trained") {
    return "Automatic sign checking is not ready for this pilot yet. Your attempt was saved as practice history only.";
  }
  return input.hint;
}

function normalizeAttemptReason(
  input: {
    reason: string;
  },
  modelPolicy: PracticeModelPolicy,
  clientMatchesActiveModel: boolean,
) {
  if (modelPolicy.status !== "trained") {
    return "server fail-closed because active model card is not_trained";
  }
  if (!clientMatchesActiveModel) {
    return "server fail-closed because attempt metadata did not match active model card";
  }
  return input.reason;
}

export async function getProgressForCurrentUser(): Promise<{
  progress: ProgressItem[];
  recentAttempts: StoredAttempt[];
}> {
  const user = await getCurrentStoredUser();
  if (!user) throw new Error("You must be logged in to view progress.");
  const store = await readStore();
  const attempts = store.attempts
    .filter((attempt) => attempt.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const progress = VOCABULARY.map((item) => {
    const itemAttempts = attempts.filter((attempt) => attempt.vocabularyId === item.id);
    const passes = itemAttempts.filter((attempt) => attempt.passed).length;
    const fails = itemAttempts.length - passes;
    return {
      vocabularyId: item.id,
      label: item.label,
      attempts: itemAttempts.length,
      passes,
      fails,
      status: passes >= 2 ? "mastered" : itemAttempts.length > 0 ? "in_progress" : "not_started",
      lastAttemptAt: itemAttempts[0]?.createdAt ?? null,
    } satisfies ProgressItem;
  });

  return {
    progress,
    recentAttempts: attempts.slice(0, 12),
  };
}

export async function saveDatasetClip(input: {
  signerAlias: string;
  planAssignmentKey?: string;
  clipKind?: "vocabulary" | "negative_challenge";
  vocabularyId?: string;
  challengeType?: NegativeChallengeType;
  clipBytes: Buffer;
  mimeType: string;
  durationMs: number;
  mediaStreamTrackSettings: Record<string, unknown>;
  captureConditionEvidence: Record<string, unknown>;
  consent: {
    ageEligible: boolean;
    allowModelTraining: boolean;
    allowValidation: boolean;
    allowPilotUse: boolean;
    allowDerivedArtifactRetention: boolean;
    allowDeidentifiedMetadataRetention: boolean;
    retentionAcknowledged: boolean;
    withdrawalAcknowledged: boolean;
  };
}): Promise<DatasetClipRecord | DatasetChallengeClipRecord> {
  const user = await getCurrentStoredUser();
  if (!user) throw new Error("You must be logged in to collect dataset clips.");
  await assertVocabularyReviewedForDatasetCollection();
  const clipKind = input.clipKind ?? "vocabulary";
  if (clipKind === "vocabulary" && !getVocabularyItem(input.vocabularyId ?? "")) {
    throw new Error("Unknown vocabulary item.");
  }
  if (clipKind === "negative_challenge" && !isNegativeChallengeType(input.challengeType)) {
    throw new Error("Unknown negative challenge type.");
  }
  if (!input.signerAlias.trim()) throw new Error("Signer alias is required.");
  const planAssignment = await assertCaptureMatchesCollectionPlan({
    clipKind,
    signerAlias: input.signerAlias.trim(),
    planAssignmentKey: input.planAssignmentKey ?? "",
    vocabularyId: input.vocabularyId ?? "",
    challengeType: input.challengeType,
  });
  if (input.clipBytes.byteLength < 1024) throw new Error("Clip is too small to store.");
  if (input.clipBytes.byteLength > MAX_DATASET_CLIP_BYTES) {
    throw new Error("Clip exceeds the 25 MB pilot capture limit.");
  }
  if (!isAllowedDatasetMimeType(input.mimeType)) {
    throw new Error("Dataset collection accepts browser-recorded WebM video only.");
  }
  if (
    !Number.isFinite(input.durationMs) ||
    input.durationMs < MIN_DATASET_CLIP_DURATION_MS ||
    input.durationMs > MAX_DATASET_CLIP_DURATION_MS
  ) {
    throw new Error("Dataset clip duration must be between 0.5 and 10 seconds.");
  }
  for (const [key, value] of Object.entries(input.consent)) {
    if (value !== true) throw new Error(`Consent field is required: ${key}`);
  }

  const now = new Date().toISOString();
  const captureConditionEvidence = validateCaptureConditionEvidence(input.captureConditionEvidence, {
    clipKind,
    challengeType: input.challengeType,
    now,
  });
  const consentRecord: DatasetConsentRecord = {
    id: crypto.randomUUID(),
    userId: user.id,
    signerAlias: input.signerAlias.trim(),
    operatorUserId: user.id,
    consentVersion: DATASET_CONSENT_VERSION,
    consentFormSha256: requireDatasetConsentFormSha256(),
    signedAt: now,
    rawClipStorageLocation: "data/dataset/clips",
    rawClipAccess: "local_operator_only",
    retentionPeriod: "pilot_period_or_until_deletion_request",
    ...input.consent,
    allowRawClipRedistribution: false,
    createdAt: now,
  };
  const clipId = crypto.randomUUID();
  const hash = crypto.createHash("sha256").update(input.clipBytes).digest("hex");
  const relativeVideoPath = path.join("dataset", "clips", `${clipId}.webm`);
  const absolutePath = path.join(DATASET_CLIP_ROOT, `${clipId}.webm`);
  const store = await readStore();
  assertPlanAssignmentAvailableForCapture(store, {
    clipKind,
    planAssignmentKey: planAssignment.planAssignmentKey,
    collectionPlanSha256: planAssignment.collectionPlanSha256,
  });
  const commonClip = {
    id: clipId,
    userId: user.id,
    consentRecordId: consentRecord.id,
    signerAlias: consentRecord.signerAlias,
    planAssignmentKey: planAssignment.planAssignmentKey,
    collectionPlanPath: planAssignment.collectionPlanPath,
    collectionPlanSha256: planAssignment.collectionPlanSha256,
    collectionPlanGeneratedAt: planAssignment.collectionPlanGeneratedAt,
    collectionPlanReviewGateStatus: planAssignment.collectionPlanReviewGateStatus,
    planAssignmentSnapshot: planAssignment.planAssignmentSnapshot,
    relativeVideoPath,
    sha256: hash,
    mimeType: input.mimeType,
    sizeBytes: input.clipBytes.byteLength,
    durationMs: input.durationMs,
    mediaStreamTrackSettings: sanitizeMediaStreamTrackSettings(input.mediaStreamTrackSettings),
    captureConditionEvidence,
    createdAt: now,
  };
	  const clip: DatasetClipRecord | DatasetChallengeClipRecord = clipKind === "negative_challenge" ? {
	    ...commonClip,
	    planAssignmentSnapshot: planAssignment.planAssignmentSnapshot as NegativeChallengePlanAssignmentSnapshot,
	    challengeType: input.challengeType as NegativeChallengeType,
	    challengeReviewStatus: "needs_review",
    challengeReviewer: null,
    challengeReviewedAt: null,
    challengeRejectionReason: null,
    challengeReviewNotes: null,
	  } : {
	    ...commonClip,
	    planAssignmentSnapshot: planAssignment.planAssignmentSnapshot as VocabularyPlanAssignmentSnapshot,
	    vocabularyId: input.vocabularyId ?? "",
	    labelReviewStatus: "needs_qa",
    labelReviewer: null,
    labelReviewedAt: null,
    labelRejectionReason: null,
    labelReviewNotes: null,
  };

  upsertDatasetSigner(store, {
    userId: user.id,
    signerAlias: consentRecord.signerAlias,
    operatorUserId: user.id,
    now,
  });
  store.consentRecords.push(consentRecord);
  if (clipKind === "negative_challenge") {
    store.datasetChallengeClips.push(clip as DatasetChallengeClipRecord);
  } else {
    store.datasetClips.push(clip as DatasetClipRecord);
  }
  await fs.mkdir(DATASET_CLIP_ROOT, { recursive: true });
  await fs.writeFile(absolutePath, input.clipBytes);
  await writeStore(store);
  return clip;
}

function assertPlanAssignmentAvailableForCapture(
  store: StoreShape,
  input: {
    clipKind: "vocabulary" | "negative_challenge";
    planAssignmentKey: string;
    collectionPlanSha256: string;
  },
) {
  if (input.clipKind === "negative_challenge") {
    const duplicate = store.datasetChallengeClips.find((clip) => (
      clip.planAssignmentKey === input.planAssignmentKey &&
      clip.collectionPlanSha256 === input.collectionPlanSha256 &&
      clip.challengeReviewStatus !== "rejected"
    ));
    if (duplicate) {
      throw new Error(
        "This collection plan challenge assignment already has a pending or approved clip. Reject the earlier clip before recapturing it.",
      );
    }
    return;
  }
  const duplicate = store.datasetClips.find((clip) => (
    clip.planAssignmentKey === input.planAssignmentKey &&
    clip.collectionPlanSha256 === input.collectionPlanSha256 &&
    clip.labelReviewStatus !== "rejected"
  ));
  if (duplicate) {
    throw new Error(
      "This collection plan vocabulary assignment already has a pending or approved clip. Reject the earlier clip before recapturing it.",
    );
  }
}

export async function getDatasetClipsForCurrentUser(): Promise<DatasetClipRecord[]> {
  const user = await getCurrentStoredUser();
  if (!user) throw new Error("You must be logged in to view dataset clips.");
  const store = await readStore();
  return store.datasetClips
    .filter((clip) => clip.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getDatasetChallengeClipsForCurrentUser(): Promise<DatasetChallengeClipRecord[]> {
  const user = await getCurrentStoredUser();
  if (!user) throw new Error("You must be logged in to view dataset clips.");
  const store = await readStore();
  return store.datasetChallengeClips
    .filter((clip) => clip.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getDatasetCoverageForCurrentUser(input: {
  signerAlias?: string;
  vocabularyId?: string;
} = {}) {
  const user = await getCurrentStoredUser();
  if (!user) throw new Error("You must be logged in to view dataset coverage.");
  const store = await readStore();
  const currentCollectionPlanSha256 = await currentReviewedCollectionPlanSha256();
  const blockedVocabularyPlanAssignmentKeys = currentCollectionPlanSha256
    ? store.datasetClips
      .filter((clip) => (
        clip.collectionPlanSha256 === currentCollectionPlanSha256 &&
        clip.labelReviewStatus !== "rejected"
      ))
      .map((clip) => clip.planAssignmentKey)
    : [];
  const blockedChallengePlanAssignmentKeys = currentCollectionPlanSha256
    ? store.datasetChallengeClips
      .filter((clip) => (
        clip.collectionPlanSha256 === currentCollectionPlanSha256 &&
        clip.challengeReviewStatus !== "rejected"
      ))
      .map((clip) => clip.planAssignmentKey)
    : [];
  const consentById = new Map(store.consentRecords.map((record) => [record.id, record]));
  const consentedClips = store.datasetClips.filter((clip) => {
    if (clip.userId !== user.id) return false;
    return isClipConsentedForCoverage(clip, consentById.get(clip.consentRecordId));
  });
  const exportableClips = consentedClips.filter((clip) => clip.labelReviewStatus === "approved");
  const rejectedClips = consentedClips.filter((clip) => clip.labelReviewStatus === "rejected");
  const reviewPendingClips = consentedClips.filter(
    (clip) => clip.labelReviewStatus !== "approved" && clip.labelReviewStatus !== "rejected",
  );
  const consentedSplitCounts = emptySplitCounts();
  const exportableSplitCounts = emptySplitCounts();
  const consentedChallengeClips = store.datasetChallengeClips.filter((clip) => {
    if (clip.userId !== user.id) return false;
    return isChallengeClipConsentedForCoverage(clip, consentById.get(clip.consentRecordId));
  });
  const exportableChallengeClips = consentedChallengeClips.filter(
    (clip) => clip.challengeReviewStatus === "approved",
  );
  const rejectedChallengeClips = consentedChallengeClips.filter(
    (clip) => clip.challengeReviewStatus === "rejected",
  );
  const reviewPendingChallengeClips = consentedChallengeClips.filter(
    (clip) => clip.challengeReviewStatus !== "approved" && clip.challengeReviewStatus !== "rejected",
  );
  const consentedChallengeCounts = Object.fromEntries(
    NEGATIVE_CHALLENGE_TYPES.map((challengeType) => [
      challengeType,
      consentedChallengeClips.filter((clip) => clip.challengeType === challengeType).length,
    ]),
  ) as Record<NegativeChallengeType, number>;
  const exportableChallengeCounts = Object.fromEntries(
    NEGATIVE_CHALLENGE_TYPES.map((challengeType) => [
      challengeType,
      exportableChallengeClips.filter((clip) => clip.challengeType === challengeType).length,
    ]),
  ) as Record<NegativeChallengeType, number>;
  const consentedChallengeSigners = new Set(
    consentedChallengeClips.map((clip) => clip.signerAlias).filter(Boolean),
  );
  const exportableChallengeSigners = new Set(
    exportableChallengeClips.map((clip) => clip.signerAlias).filter(Boolean),
  );
  const consentedSignersBySplit = {
    train: new Set<string>(),
    validation: new Set<string>(),
    test: new Set<string>(),
  };
  const exportableSignersBySplit = {
    train: new Set<string>(),
    validation: new Set<string>(),
    test: new Set<string>(),
  };
  for (const clip of consentedClips) {
    const split = splitForSigner(clip.signerAlias);
    consentedSignersBySplit[split].add(clip.signerAlias);
    consentedSplitCounts[split].set(
      clip.vocabularyId,
      (consentedSplitCounts[split].get(clip.vocabularyId) ?? 0) + 1,
    );
  }
  for (const clip of exportableClips) {
    const split = splitForSigner(clip.signerAlias);
    exportableSignersBySplit[split].add(clip.signerAlias);
    exportableSplitCounts[split].set(
      clip.vocabularyId,
      (exportableSplitCounts[split].get(clip.vocabularyId) ?? 0) + 1,
    );
  }
  const selectedLabelId = input.vocabularyId && getVocabularyItem(input.vocabularyId)
    ? input.vocabularyId
    : null;
  const selectedLabelCoverage = selectedLabelId ? selectedCoverage(consentedSplitCounts, selectedLabelId) : null;
  const selectedLabelExportableCoverage = selectedLabelId
    ? selectedCoverage(exportableSplitCounts, selectedLabelId)
    : null;

  return {
    targets: {
      targetSigners: 20,
      signersBySplit: DATASET_TARGET_SIGNERS_BY_SPLIT,
      clipsPerLabelPerSplit: DATASET_CLIPS_PER_LABEL_PER_SPLIT,
      vocabularyLabels: VOCABULARY.length,
      negativeChallengeTypes: NEGATIVE_CHALLENGE_TYPES,
      negativeChallengeClipsPerType: NEGATIVE_CHALLENGE_CLIPS_PER_TYPE,
    },
    signerAlias: input.signerAlias?.trim() || null,
    signerSplit: input.signerAlias?.trim() ? splitForSigner(input.signerAlias.trim()) : null,
    totalClips: store.datasetClips.filter((clip) => clip.userId === user.id).length,
    consentedClips: consentedClips.length,
    exportableClips: exportableClips.length,
    rejectedClips: rejectedClips.length,
    totalChallengeClips: store.datasetChallengeClips.filter((clip) => clip.userId === user.id).length,
    consentedChallengeClips: consentedChallengeClips.length,
    exportableChallengeClips: exportableChallengeClips.length,
    rejectedChallengeClips: rejectedChallengeClips.length,
    consentedChallengeCountsByType: consentedChallengeCounts,
    exportableChallengeCountsByType: exportableChallengeCounts,
    consentedChallengeSignerCount: consentedChallengeSigners.size,
    exportableChallengeSignerCount: exportableChallengeSigners.size,
    missingExportableChallengeTypes: NEGATIVE_CHALLENGE_TYPES.filter(
      (challengeType) => exportableChallengeCounts[challengeType] < NEGATIVE_CHALLENGE_CLIPS_PER_TYPE,
    ),
    consentedSignerCountsBySplit: Object.fromEntries(
      Object.entries(consentedSignersBySplit).map(([split, signers]) => [split, signers.size]),
    ),
    exportableSignerCountsBySplit: Object.fromEntries(
      Object.entries(exportableSignersBySplit).map(([split, signers]) => [split, signers.size]),
    ),
    consentedCoveredLabelsBySplit: coveredLabelsBySplit(
      consentedSplitCounts,
      DATASET_CLIPS_PER_LABEL_PER_SPLIT,
    ),
    exportableCoveredLabelsBySplit: coveredLabelsBySplit(
      exportableSplitCounts,
      DATASET_CLIPS_PER_LABEL_PER_SPLIT,
    ),
    missingExportableLabelsBySplit: missingLabelsBySplit(
      exportableSplitCounts,
      DATASET_CLIPS_PER_LABEL_PER_SPLIT,
    ),
    reviewPendingClips: reviewPendingClips.length,
    reviewPendingChallengeClips: reviewPendingChallengeClips.length,
    blockedPlanAssignmentKeys: [
      ...new Set([...blockedVocabularyPlanAssignmentKeys, ...blockedChallengePlanAssignmentKeys]),
    ].sort(),
    blockedVocabularyPlanAssignmentKeys: [...new Set(blockedVocabularyPlanAssignmentKeys)].sort(),
    blockedChallengePlanAssignmentKeys: [...new Set(blockedChallengePlanAssignmentKeys)].sort(),
    reviewContract: "coverage separates consented collection from reviewed exportable clips",
    deprecatedCoverageFields: [],
    signerCountsBySplit: Object.fromEntries(
      Object.entries(consentedSignersBySplit).map(([split, signers]) => [split, signers.size]),
    ),
    coveredLabelsBySplit: coveredLabelsBySplit(consentedSplitCounts, DATASET_CLIPS_PER_LABEL_PER_SPLIT),
    selectedLabelExportableCoverage,
    selectedLabelId,
    selectedLabelCoverage,
  };
}

async function currentReviewedCollectionPlanSha256(): Promise<string | null> {
  try {
    const planText = await fs.readFile(COLLECTION_PLAN_PATH, "utf8");
    const plan = JSON.parse(planText) as {
      schema_version?: unknown;
      review_gate?: { status?: unknown };
      warnings?: unknown;
    };
    if (
      plan.schema_version !== "asl-pilot-dataset-collection-plan/v1" ||
      !ACCEPTED_VOCABULARY_GATE_STATUSES.has(String(plan.review_gate?.status ?? "")) ||
      (Array.isArray(plan.warnings) && plan.warnings.length > 0)
    ) {
      return null;
    }
    await assertCollectionPlanReviewGateFresh(plan);
    return crypto.createHash("sha256").update(planText).digest("hex");
  } catch {
    return null;
  }
}

async function getCurrentStoredUser(): Promise<StoredUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  const store = await readStore();
  const session = store.sessions.find((candidate) => candidate.id === sessionId);
  if (!session) return null;
  return store.users.find((user) => user.id === session.userId) ?? null;
}

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const data = JSON.parse(raw) as Partial<StoreShape>;
    return {
      users: Array.isArray(data.users) ? data.users : [],
      sessions: Array.isArray(data.sessions) ? data.sessions : [],
      attempts: Array.isArray(data.attempts) ? data.attempts : [],
      datasetSigners: Array.isArray(data.datasetSigners) ? data.datasetSigners : [],
      consentRecords: Array.isArray(data.consentRecords) ? data.consentRecords : [],
      datasetClips: Array.isArray(data.datasetClips) ? data.datasetClips : [],
      datasetChallengeClips: Array.isArray(data.datasetChallengeClips) ? data.datasetChallengeClips : [],
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
    await writeStore(EMPTY_STORE);
    return { ...EMPTY_STORE };
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function projectRelativePath(file: string): string {
  return path.relative(PROJECT_ROOT, file).split(path.sep).join("/");
}

function projectLocalRelativePath(file: string, context: string): string {
  const relativePath = projectRelativePath(file);
  if (relativePath === "" || relativePath.startsWith("../") || path.isAbsolute(relativePath)) {
    throw new Error(`${context} must stay inside the project root.`);
  }
  return relativePath;
}

function assertOutputFixturePath(file: string, context: string): string {
  const relativePath = projectLocalRelativePath(file, context);
  if (!relativePath.startsWith("output/")) {
    throw new Error(`${context} must be project-local output/... when ASL_PILOT_ALLOW_SMOKE_REVIEW_FIXTURES=true.`);
  }
  return relativePath;
}

function createSessionForUser(userId: string): StoredSession {
  return {
    id: crypto.randomBytes(32).toString("hex"),
    userId,
    createdAt: new Date().toISOString(),
  };
}

function isAllowedDatasetMimeType(mimeType: string): boolean {
  const normalized = mimeType.trim().toLowerCase();
  return normalized === "video/webm" || normalized.startsWith("video/webm;");
}

function assertStrictVocabularyReviewAuditPassed(): void {
  const usesCanonicalReviewPaths =
    VOCABULARY_SOURCE_PATH === CANONICAL_VOCABULARY_SOURCE_PATH &&
    VOCABULARY_REVIEW_EVIDENCE_PATH === CANONICAL_VOCABULARY_REVIEW_EVIDENCE_PATH;
  if (ALLOW_SMOKE_REVIEW_FIXTURES) {
    assertOutputFixturePath(STORE_PATH, "ASL_PILOT_STORE_PATH");
    assertOutputFixturePath(DATASET_CLIP_ROOT, "ASL_PILOT_DATASET_CLIP_ROOT");
    assertOutputFixturePath(COLLECTION_PLAN_PATH, "ASL_PILOT_COLLECTION_PLAN_PATH");
    assertOutputFixturePath(VOCABULARY_SOURCE_PATH, "ASL_PILOT_VOCABULARY_SOURCE_PATH");
    assertOutputFixturePath(VOCABULARY_REVIEW_EVIDENCE_PATH, "ASL_PILOT_VOCABULARY_REVIEW_EVIDENCE_PATH");
    const evidence = JSON.parse(readFileSync(VOCABULARY_REVIEW_EVIDENCE_PATH, "utf8"));
    if (evidence?.evidence_mode === "smoke" && evidence?.finality === "smoke_only") {
      return;
    }
    throw new Error("Smoke review fixture bypass requires smoke-only review evidence under output/.");
  }
  if (!usesCanonicalReviewPaths) {
    const sourceRelativePath = path.relative(PROJECT_ROOT, VOCABULARY_SOURCE_PATH).split(path.sep).join("/");
    const evidenceRelativePath = path.relative(PROJECT_ROOT, VOCABULARY_REVIEW_EVIDENCE_PATH).split(path.sep).join("/");
    throw new Error(
      `Custom vocabulary review paths are only allowed for isolated smoke-only fixtures under output/. Production dataset collection must use canonical strict review evidence. Got source=${sourceRelativePath} evidence=${evidenceRelativePath}.`,
    );
  }
  const result = spawnSync(process.execPath, ["scripts/audit_vocabulary_review.mjs"], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    const detail = [result.stderr, result.stdout].filter(Boolean).join("\n").trim();
    throw new Error(
      [
        "Strict vocabulary review audit must pass before dataset collection can start.",
        detail,
      ].filter(Boolean).join("\n"),
    );
  }
}

async function assertVocabularyReviewedForDatasetCollection(): Promise<void> {
  assertStrictVocabularyReviewAuditPassed();
  const source = await fs.readFile(VOCABULARY_SOURCE_PATH, "utf8");
  if (source.includes("needs_deaf_educator_review")) {
    throw new Error("Vocabulary evidence must pass before dataset collection can start.");
  }
  const evidence = JSON.parse(await fs.readFile(VOCABULARY_REVIEW_EVIDENCE_PATH, "utf8")) as {
    schema_version?: unknown;
    status?: unknown;
    vocabulary_source?: {
      sha256?: unknown;
    };
    approved_item_ids?: unknown;
  };
  const currentSourceHash = crypto.createHash("sha256").update(source).digest("hex");
  const currentVocabularyIds = VOCABULARY.map((item) => item.id);
  const approvedItemIds = Array.isArray(evidence.approved_item_ids)
    ? evidence.approved_item_ids
    : [];
  if (
    evidence.schema_version !== "asl-pilot-vocabulary-review-evidence/v1" ||
    !ACCEPTED_VOCABULARY_GATE_STATUSES.has(String(evidence.status ?? "")) ||
    evidence.vocabulary_source?.sha256 !== currentSourceHash ||
    approvedItemIds.join("\n") !== currentVocabularyIds.join("\n")
  ) {
    throw new Error("Vocabulary evidence must match the current vocabulary before dataset collection can start.");
  }
}

export async function assertCollectionPlanReviewGateFresh(plan: {
  review_gate?: CollectionPlanReviewGate;
}): Promise<void> {
  await assertVocabularyReviewedForDatasetCollection();
  const source = await fs.readFile(VOCABULARY_SOURCE_PATH, "utf8");
  const evidenceText = await fs.readFile(VOCABULARY_REVIEW_EVIDENCE_PATH, "utf8");
  const currentSourceHash = crypto.createHash("sha256").update(source).digest("hex");
  const currentEvidenceHash = crypto.createHash("sha256").update(evidenceText).digest("hex");
  const gate = plan.review_gate;
  if (!gate || typeof gate !== "object") {
    throw new Error("Collection plan review_gate must be present before dataset capture.");
  }
  if (!ACCEPTED_VOCABULARY_GATE_STATUSES.has(String(gate.status ?? ""))) {
    throw new Error("Collection plan review_gate.status must match the current accepted vocabulary evidence state.");
  }
  if (
    gate.vocabulary_source?.path !== projectRelativePath(VOCABULARY_SOURCE_PATH) ||
    gate.vocabulary_source?.sha256 !== currentSourceHash ||
    gate.vocabulary_source?.item_count !== VOCABULARY.length
  ) {
    throw new Error("Collection plan review_gate.vocabulary_source must match the current vocabulary before dataset capture.");
  }
  if (
    gate.evidence?.path !== projectRelativePath(VOCABULARY_REVIEW_EVIDENCE_PATH) ||
    gate.evidence?.exists !== true ||
    gate.evidence?.sha256 !== currentEvidenceHash
  ) {
    throw new Error("Collection plan review_gate.evidence must match the current vocabulary evidence before dataset capture.");
  }
}

async function assertCaptureMatchesCollectionPlan(input: {
  clipKind: "vocabulary" | "negative_challenge";
  signerAlias: string;
  planAssignmentKey: string;
  vocabularyId: string;
  challengeType?: NegativeChallengeType;
}): Promise<ValidatedCollectionPlanAssignment> {
  if (!input.planAssignmentKey.trim()) {
    throw new Error("A current collection plan assignment is required before dataset capture.");
  }
  const collectionPlanRelativePath = projectLocalRelativePath(COLLECTION_PLAN_PATH, "ASL_PILOT_COLLECTION_PLAN_PATH");
  if (!ALLOW_SMOKE_REVIEW_FIXTURES && collectionPlanRelativePath !== COLLECTION_PLAN_RELATIVE_PATH) {
    throw new Error(`Production dataset collection must use the canonical collection plan: ${COLLECTION_PLAN_RELATIVE_PATH}`);
  }
  let planText: string;
  let plan: {
    schema_version?: unknown;
    generated_at?: unknown;
    review_gate?: { status?: unknown };
    warnings?: unknown;
    assignments?: unknown;
    negative_challenge_assignments?: unknown;
  };
  try {
    planText = await fs.readFile(COLLECTION_PLAN_PATH, "utf8");
    plan = JSON.parse(planText);
  } catch (error) {
    throw new Error("A reviewed collection plan must exist before dataset capture.", { cause: error });
  }
  if (plan.schema_version !== "asl-pilot-dataset-collection-plan/v1") {
    throw new Error("Collection plan schema_version is invalid.");
  }
  if (!ACCEPTED_VOCABULARY_GATE_STATUSES.has(String(plan.review_gate?.status ?? ""))) {
    throw new Error("Collection plan must be generated after final vocabulary evidence before dataset capture.");
  }
  const collectionPlanReviewGateStatus = String(plan.review_gate?.status) as AcceptedVocabularyGateStatus;
  await assertCollectionPlanReviewGateFresh(plan);
  if (Array.isArray(plan.warnings) && plan.warnings.length > 0) {
    throw new Error("Collection plan warnings must be resolved before dataset capture.");
  }
  if (typeof plan.generated_at !== "string" || Number.isNaN(Date.parse(plan.generated_at))) {
    throw new Error("Collection plan generated_at must be an ISO-compatible date before dataset capture.");
  }
  const collectionPlanSha256 = crypto.createHash("sha256").update(planText).digest("hex");

  const [assignmentKind, assignmentIndexRaw] = input.planAssignmentKey.split(":");
  const assignmentIndex = Number(assignmentIndexRaw);
  if (!Number.isInteger(assignmentIndex) || assignmentIndex < 0) {
    throw new Error("Collection plan assignment key is invalid.");
  }
  if (input.clipKind === "vocabulary") {
    if (assignmentKind !== "vocabulary") {
      throw new Error("Vocabulary capture must use a vocabulary collection plan assignment.");
    }
    const assignments = Array.isArray(plan.assignments) ? plan.assignments : [];
    const assignment = assignments[assignmentIndex];
    if (!assignment || typeof assignment !== "object" || Array.isArray(assignment)) {
      throw new Error("Collection plan assignment was not found.");
    }
    if (
      (assignment as { signer_alias?: unknown }).signer_alias !== input.signerAlias ||
      (assignment as { label_id?: unknown }).label_id !== input.vocabularyId ||
      (assignment as { split?: unknown }).split !== splitForSigner(input.signerAlias)
    ) {
      throw new Error("Submitted vocabulary capture does not match the selected collection plan assignment.");
    }
    return {
      planAssignmentKey: input.planAssignmentKey,
      collectionPlanPath: collectionPlanRelativePath,
      collectionPlanSha256,
      collectionPlanGeneratedAt: plan.generated_at,
      collectionPlanReviewGateStatus,
      planAssignmentSnapshot: {
        assignment_key: input.planAssignmentKey,
        split: (assignment as { split: "train" | "validation" | "test" }).split,
        signer_alias: input.signerAlias,
        label_id: input.vocabularyId,
        display_text: String((assignment as { display_text?: unknown }).display_text ?? ""),
        capture_count_for_label_split: Number(
          (assignment as { capture_count_for_label_split?: unknown }).capture_count_for_label_split,
        ),
      },
    };
  }

  if (assignmentKind !== "negative_challenge") {
    throw new Error("Negative challenge capture must use a negative challenge collection plan assignment.");
  }
  const assignments = Array.isArray(plan.negative_challenge_assignments)
    ? plan.negative_challenge_assignments
    : [];
  const assignment = assignments[assignmentIndex];
  if (!assignment || typeof assignment !== "object" || Array.isArray(assignment)) {
    throw new Error("Collection plan challenge assignment was not found.");
  }
  if (
    (assignment as { signer_alias?: unknown }).signer_alias !== input.signerAlias ||
    (assignment as { challenge_type?: unknown }).challenge_type !== input.challengeType ||
    (assignment as { expected_outcome?: unknown }).expected_outcome !== "reject"
  ) {
    throw new Error("Submitted challenge capture does not match the selected collection plan assignment.");
  }
  return {
    planAssignmentKey: input.planAssignmentKey,
    collectionPlanPath: collectionPlanRelativePath,
    collectionPlanSha256,
    collectionPlanGeneratedAt: plan.generated_at,
    collectionPlanReviewGateStatus,
    planAssignmentSnapshot: {
      assignment_key: input.planAssignmentKey,
      split: "negative_challenge",
      signer_alias: input.signerAlias,
      challenge_type: input.challengeType as NegativeChallengeType,
      expected_outcome: "reject",
      capture_count_for_type: Number(
        (assignment as { capture_count_for_type?: unknown }).capture_count_for_type,
      ),
    },
  };
}

function sanitizeMediaStreamTrackSettings(
  settings: Record<string, unknown>,
): Record<string, unknown> {
  const allowedKeys = [
    "aspectRatio",
    "facingMode",
    "frameRate",
    "height",
    "resizeMode",
    "width",
  ];
  return Object.fromEntries(
    allowedKeys
      .filter((key) => settings[key] !== undefined)
      .map((key) => [key, settings[key]]),
  );
}

function validateCaptureConditionEvidence(
  evidence: Record<string, unknown>,
  input: {
    clipKind: "vocabulary" | "negative_challenge";
    challengeType?: NegativeChallengeType;
    now: string;
  },
): DatasetCaptureConditionEvidence {
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    throw new Error("Capture-condition evidence is required before dataset capture.");
  }
  if (evidence.schemaVersion !== CAPTURE_CONDITION_SCHEMA_VERSION) {
    throw new Error(`Capture-condition evidence schemaVersion must be ${CAPTURE_CONDITION_SCHEMA_VERSION}.`);
  }
  if (evidence.operatorAttestation !== true) {
    throw new Error("Operator must attest the capture conditions before recording.");
  }
  const normalized: DatasetCaptureConditionEvidence = {
    schemaVersion: CAPTURE_CONDITION_SCHEMA_VERSION,
    captureEnvironment: input.clipKind === "negative_challenge" ? "negative_challenge" : "controlled_vocabulary",
    operatorAttestation: true,
    operatorAttestedAt: input.now,
    frontLightingConfirmed: evidence.frontLightingConfirmed === true,
    upperTorsoAndHandsVisibleConfirmed: evidence.upperTorsoAndHandsVisibleConfirmed === true,
    cameraDistanceWithinPilotRangeConfirmed: evidence.cameraDistanceWithinPilotRangeConfirmed === true,
    isolatedPromptSignConfirmed: evidence.isolatedPromptSignConfirmed === true,
    challengeType: input.clipKind === "negative_challenge" ? input.challengeType ?? null : null,
    emptyCameraConfirmed: evidence.emptyCameraConfirmed === true,
    noHandsVisibleConfirmed: evidence.noHandsVisibleConfirmed === true,
    lowLightConfirmed: evidence.lowLightConfirmed === true,
    offCenterConfirmed: evidence.offCenterConfirmed === true,
    hardNegativeConditionConfirmed: evidence.hardNegativeConditionConfirmed === true,
    expectedRejectOutcomeConfirmed: evidence.expectedRejectOutcomeConfirmed === true,
  };

  if (input.clipKind === "vocabulary") {
    if (evidence.captureEnvironment !== "controlled_vocabulary") {
      throw new Error("Vocabulary clips must use controlled vocabulary capture-condition evidence.");
    }
    if (
      !normalized.frontLightingConfirmed ||
      !normalized.upperTorsoAndHandsVisibleConfirmed ||
      !normalized.cameraDistanceWithinPilotRangeConfirmed ||
      !normalized.isolatedPromptSignConfirmed
    ) {
      throw new Error("Vocabulary clips require front lighting, upper-torso/hands framing, pilot-range distance, and isolated-prompt-sign condition confirmation.");
    }
    if (
      normalized.challengeType !== null ||
      normalized.emptyCameraConfirmed ||
      normalized.noHandsVisibleConfirmed ||
      normalized.lowLightConfirmed ||
      normalized.offCenterConfirmed ||
      normalized.hardNegativeConditionConfirmed ||
      normalized.expectedRejectOutcomeConfirmed
    ) {
      throw new Error("Vocabulary clips cannot carry negative-challenge capture-condition flags.");
    }
    return normalized;
  }

  if (evidence.captureEnvironment !== "negative_challenge") {
    throw new Error("Negative challenge clips must use negative-challenge capture-condition evidence.");
  }
  if (!isNegativeChallengeType(input.challengeType)) {
    throw new Error("Negative challenge capture-condition evidence requires a valid challenge type.");
  }
  if (evidence.challengeType !== input.challengeType) {
    throw new Error("Capture-condition challengeType must match the selected challenge type.");
  }
  if (!normalized.expectedRejectOutcomeConfirmed) {
    throw new Error("Negative challenge clips must confirm the expected reject-only outcome.");
  }
  const challengeFlags = {
    empty_camera: normalized.emptyCameraConfirmed,
    no_hands_visible: normalized.noHandsVisibleConfirmed,
    low_light: normalized.lowLightConfirmed,
    off_center: normalized.offCenterConfirmed,
  } satisfies Partial<Record<NegativeChallengeType, boolean>>;
  if (Object.prototype.hasOwnProperty.call(challengeFlags, input.challengeType)) {
    const coreChallengeType = input.challengeType as keyof typeof challengeFlags;
    if (!challengeFlags[coreChallengeType]) {
      throw new Error(`Negative challenge clips must confirm the ${input.challengeType} condition.`);
    }
    if (normalized.hardNegativeConditionConfirmed) {
      throw new Error("Core negative challenge clips cannot use the generic hard-negative condition flag.");
    }
    for (const [challengeType, confirmed] of Object.entries(challengeFlags)) {
      if (challengeType !== input.challengeType && confirmed) {
        throw new Error("Negative challenge capture-condition evidence may confirm only the selected challenge type.");
      }
    }
    return normalized;
  }
  if (!normalized.hardNegativeConditionConfirmed) {
    throw new Error(`Negative challenge clips must confirm the ${input.challengeType} condition.`);
  }
  for (const confirmed of Object.values(challengeFlags)) {
    if (confirmed) {
      throw new Error("Extended hard-negative clips cannot carry core negative-challenge condition flags.");
    }
  }
  return normalized;
}

export function splitForSigner(signerAlias: string): "train" | "validation" | "test" {
  const digest = crypto.createHash("sha256").update(String(signerAlias)).digest();
  const bucket = digest[0] % 5;
  if (bucket === 0) return "validation";
  if (bucket === 1) return "test";
  return "train";
}

function upsertDatasetSigner(
  store: StoreShape,
  input: {
    userId: string;
    signerAlias: string;
    operatorUserId: string;
    now: string;
  },
) {
  const existing = store.datasetSigners.find(
    (signer) => signer.userId === input.userId && signer.signerAlias === input.signerAlias,
  );
  if (existing) {
    existing.updatedAt = input.now;
    existing.split = splitForSigner(input.signerAlias);
    existing.consentVersion = DATASET_CONSENT_VERSION;
    existing.consentFormSha256 = requireDatasetConsentFormSha256();
    return;
  }
  store.datasetSigners.push({
    id: crypto.randomUUID(),
    userId: input.userId,
    signerAlias: input.signerAlias,
    split: splitForSigner(input.signerAlias),
    identityAttestation: "operator_alias_issued",
    operatorUserId: input.operatorUserId,
    consentVersion: DATASET_CONSENT_VERSION,
    consentFormSha256: requireDatasetConsentFormSha256(),
    createdAt: input.now,
    updatedAt: input.now,
  });
}

function selectedCoverage(
  splitCounts: ReturnType<typeof emptySplitCounts>,
  selectedLabelId: string,
) {
  return Object.fromEntries(
    Object.entries(splitCounts).map(([split, counts]) => [
      split,
      counts.get(selectedLabelId) ?? 0,
    ]),
  );
}

function coveredLabelsBySplit(
  splitCounts: ReturnType<typeof emptySplitCounts>,
  minimumCount: number = 1,
) {
  return Object.fromEntries(
    Object.entries(splitCounts).map(([split, counts]) => [
      split,
      [...counts.values()].filter((count) => count >= minimumCount).length,
    ]),
  );
}

function missingLabelsBySplit(
  splitCounts: ReturnType<typeof emptySplitCounts>,
  minimumCount: number = 1,
) {
  return Object.fromEntries(
    Object.entries(splitCounts).map(([split, counts]) => [
      split,
      [...counts.entries()]
        .filter(([, count]) => count < minimumCount)
        .map(([labelId]) => labelId),
    ]),
  );
}

function isClipConsentedForCoverage(
  clip: DatasetClipRecord,
  consent: DatasetConsentRecord | undefined,
) {
  if (!getVocabularyItem(clip.vocabularyId) || !clip.signerAlias || !consent) return false;
  if (consent.signerAlias !== clip.signerAlias || consent.userId !== clip.userId) return false;
  return [
    consent.ageEligible,
    consent.allowModelTraining,
    consent.allowValidation,
    consent.allowPilotUse,
    consent.allowDerivedArtifactRetention,
    consent.allowDeidentifiedMetadataRetention,
    consent.retentionAcknowledged,
    consent.withdrawalAcknowledged,
    consent.consentVersion === DATASET_CONSENT_VERSION,
    DATASET_CONSENT_FORM_SHA256 != null,
    consent.consentFormSha256 === DATASET_CONSENT_FORM_SHA256,
  ].every(Boolean);
}

function isChallengeClipConsentedForCoverage(
  clip: DatasetChallengeClipRecord,
  consent: DatasetConsentRecord | undefined,
) {
  if (!isNegativeChallengeType(clip.challengeType) || !clip.signerAlias || !consent) return false;
  if (consent.signerAlias !== clip.signerAlias || consent.userId !== clip.userId) return false;
  return [
    consent.ageEligible,
    consent.allowValidation,
    consent.allowPilotUse,
    consent.allowDerivedArtifactRetention,
    consent.allowDeidentifiedMetadataRetention,
    consent.retentionAcknowledged,
    consent.withdrawalAcknowledged,
    consent.consentVersion === DATASET_CONSENT_VERSION,
    DATASET_CONSENT_FORM_SHA256 != null,
    consent.consentFormSha256 === DATASET_CONSENT_FORM_SHA256,
  ].every(Boolean);
}

function isNegativeChallengeType(value: unknown): value is NegativeChallengeType {
  return typeof value === "string" && NEGATIVE_CHALLENGE_TYPES.includes(value as NegativeChallengeType);
}

function emptySplitCounts() {
  return {
    train: new Map(VOCABULARY.map((item) => [item.id, 0])),
    validation: new Map(VOCABULARY.map((item) => [item.id, 0])),
    test: new Map(VOCABULARY.map((item) => [item.id, 0])),
  };
}

async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

function publicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
