import { NextResponse } from "next/server";
import {
  getDatasetChallengeClipsForCurrentUser,
  getDatasetClipsForCurrentUser,
  saveDatasetClip,
} from "@/lib/server-store";
import type { NegativeChallengeType } from "@/lib/server-store";

const PRIVATE_DATASET_COLLECTION_ENABLED =
  process.env.ENABLE_DATASET_COLLECTION === "true";
const PUBLIC_DATASET_COLLECTION_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_DATASET_COLLECTION === "true";
const DATASET_COLLECTION_ENABLED =
  PRIVATE_DATASET_COLLECTION_ENABLED && PUBLIC_DATASET_COLLECTION_ENABLED;

export async function GET() {
  try {
    assertDatasetCollectionEnabled();
    const [clips, challengeClips] = await Promise.all([
      getDatasetClipsForCurrentUser(),
      getDatasetChallengeClipsForCurrentUser(),
    ]);
    return NextResponse.json({ clips, challengeClips });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load dataset clips." },
      { status: DATASET_COLLECTION_ENABLED ? 401 : 403 },
    );
  }
}

export async function POST(request: Request) {
  // EXPLICIT_DATASET_COLLECTION_ROUTE: this route is separate from normal practice.
  try {
    assertDatasetCollectionEnabled();
    const formData = await request.formData();
    const clip = formData.get("clip");
    if (!(clip instanceof File)) throw new Error("A consented clip file is required.");
    const mediaStreamTrackSettingsRaw = String(
      formData.get("mediaStreamTrackSettings") ?? "{}",
    );
    const mediaStreamTrackSettings = JSON.parse(mediaStreamTrackSettingsRaw) as Record<
      string,
      unknown
    >;
    const captureConditionEvidenceRaw = String(
      formData.get("captureConditionEvidence") ?? "{}",
    );
    const captureConditionEvidence = JSON.parse(captureConditionEvidenceRaw) as Record<
      string,
      unknown
    >;
    const arrayBuffer = await clip.arrayBuffer();
    const saved = await saveDatasetClip({
      clipKind: formData.get("clipKind") === "negative_challenge" ? "negative_challenge" : "vocabulary",
      signerAlias: String(formData.get("signerAlias") ?? ""),
      planAssignmentKey: String(formData.get("planAssignmentKey") ?? ""),
      vocabularyId: String(formData.get("vocabularyId") ?? ""),
      challengeType: String(formData.get("challengeType") ?? "") as NegativeChallengeType,
      clipBytes: Buffer.from(arrayBuffer),
      mimeType: clip.type || "video/webm",
      durationMs: Number(formData.get("durationMs") ?? 0),
      mediaStreamTrackSettings,
      captureConditionEvidence,
      consent: {
        ageEligible: formData.get("ageEligible") === "true",
        allowModelTraining: formData.get("allowModelTraining") === "true",
        allowValidation: formData.get("allowValidation") === "true",
        allowPilotUse: formData.get("allowPilotUse") === "true",
        allowDerivedArtifactRetention:
          formData.get("allowDerivedArtifactRetention") === "true",
        allowDeidentifiedMetadataRetention:
          formData.get("allowDeidentifiedMetadataRetention") === "true",
        retentionAcknowledged: formData.get("retentionAcknowledged") === "true",
        withdrawalAcknowledged: formData.get("withdrawalAcknowledged") === "true",
      },
    });
    return NextResponse.json({ clip: saved });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save dataset clip." },
      { status: DATASET_COLLECTION_ENABLED ? 400 : 403 },
    );
  }
}

function assertDatasetCollectionEnabled() {
  if (!DATASET_COLLECTION_ENABLED) {
    throw new Error(
      "Dataset collection is disabled by default. Set both ENABLE_DATASET_COLLECTION=true and NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true only for explicit-consent collection sessions.",
    );
  }
}
