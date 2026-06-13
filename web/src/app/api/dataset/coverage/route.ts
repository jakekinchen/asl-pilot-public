import { NextResponse } from "next/server";
import { getDatasetCoverageForCurrentUser } from "@/lib/server-store";

const PRIVATE_DATASET_COLLECTION_ENABLED =
  process.env.ENABLE_DATASET_COLLECTION === "true";
const PUBLIC_DATASET_COLLECTION_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_DATASET_COLLECTION === "true";
const DATASET_COLLECTION_ENABLED =
  PRIVATE_DATASET_COLLECTION_ENABLED && PUBLIC_DATASET_COLLECTION_ENABLED;

export async function GET(request: Request) {
  try {
    assertDatasetCollectionEnabled();
    const { searchParams } = new URL(request.url);
    const coverage = await getDatasetCoverageForCurrentUser({
      signerAlias: searchParams.get("signerAlias") ?? undefined,
      vocabularyId: searchParams.get("vocabularyId") ?? undefined,
    });
    return NextResponse.json({ coverage });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load dataset coverage." },
      { status: DATASET_COLLECTION_ENABLED ? 401 : 403 },
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
