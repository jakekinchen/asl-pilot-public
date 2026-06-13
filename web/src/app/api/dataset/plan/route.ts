import { promises as fs } from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  assertCollectionPlanReviewGateFresh,
  getCurrentUser,
} from "@/lib/server-store";

const DEFAULT_COLLECTION_PLAN_PATH = path.resolve(
  process.cwd(),
  "..",
  "data",
  "dataset",
  "collection-plan.json",
);
const COLLECTION_PLAN_PATH = process.env.ASL_PILOT_COLLECTION_PLAN_PATH
  ? path.resolve(process.env.ASL_PILOT_COLLECTION_PLAN_PATH)
  : DEFAULT_COLLECTION_PLAN_PATH;
const CANONICAL_VERIFIER_QUEUE_PATH = path.resolve(
  process.cwd(),
  "..",
  "data",
  "dataset",
  "canonical-verifier-010-collection-queue.json",
);
const FOCUSED_REMEDIATION_QUEUE_PATH = path.resolve(
  process.cwd(),
  "..",
  "data",
  "dataset",
  "controlled-pilot-label-ladder-010-factorized-remediation-collection-queue.json",
);
const DEFAULT_REMEDIATION_QUEUE_PATH = path.resolve(
  process.cwd(),
  "..",
  "data",
  "dataset",
  "rawframe-remediation-collection-queue.json",
);
const ACCEPTED_VOCABULARY_GATE_STATUSES = new Set(["reviewed", "source_curated"]);
type RemediationQueueFileRow = Record<string, unknown>;

export async function GET() {
  try {
    assertDatasetCollectionEnabled();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to view the collection plan." },
        { status: 401 },
      );
    }
    const raw = await fs.readFile(COLLECTION_PLAN_PATH, "utf8");
    const plan = JSON.parse(raw);
    if (!ACCEPTED_VOCABULARY_GATE_STATUSES.has(String(plan?.review_gate?.status ?? ""))) {
      return NextResponse.json(
        {
          error: "Vocabulary evidence must pass before the collection plan can be used for capture.",
          reviewGate: plan?.review_gate ?? null,
        },
        { status: 409 },
      );
    }
    await assertCollectionPlanReviewGateFresh(plan);
    const remediationQueue = await readRemediationQueue(COLLECTION_PLAN_PATH);
    return NextResponse.json({ plan, remediationQueue });
  } catch (error) {
    const status = datasetCollectionEnabled() ? 404 : 403;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load collection plan." },
      { status },
    );
  }
}

async function readRemediationQueue(collectionPlanPath: string) {
  const queueCandidates = resolveRemediationQueueCandidates(collectionPlanPath);
  if (queueCandidates.length === 0) return null;

  for (const queuePath of queueCandidates) {
    const result = await readRemediationQueueCandidate(collectionPlanPath, queuePath);
    if (result) return result;
  }

  return null;
}

function resolveRemediationQueueCandidates(collectionPlanPath: string) {
  if (process.env.ASL_PILOT_REMEDIATION_QUEUE_PATH) {
    return [path.resolve(process.env.ASL_PILOT_REMEDIATION_QUEUE_PATH)];
  }
  if (collectionPlanPath !== DEFAULT_COLLECTION_PLAN_PATH) return [];
  return [CANONICAL_VERIFIER_QUEUE_PATH, FOCUSED_REMEDIATION_QUEUE_PATH, DEFAULT_REMEDIATION_QUEUE_PATH];
}

async function readRemediationQueueCandidate(
  collectionPlanPath: string,
  queuePath: string,
) {
  let raw: string;
  try {
    raw = await fs.readFile(queuePath, "utf8");
  } catch {
    return null;
  }
  const queue = JSON.parse(raw);
  if (queue?.schema_version !== "asl-pilot-rawframe-remediation-collection-queue/v1") {
    throw new Error("Remediation collection queue schema_version is invalid.");
  }
  if (queue?.status !== "queue_ready_not_training_data") {
    throw new Error("Remediation collection queue must be ready before it can order capture.");
  }
  const planRaw = await fs.readFile(collectionPlanPath, "utf8");
  const planSha256 = crypto.createHash("sha256").update(planRaw).digest("hex");
  const planPath = path
    .relative(path.resolve(process.cwd(), ".."), collectionPlanPath)
    .split(path.sep)
    .join("/");
  if (
    queue.inputs?.collection_plan?.path !== planPath ||
    queue.inputs?.collection_plan?.sha256 !== planSha256
  ) {
    throw new Error(
      `Remediation collection queue ${path.basename(queuePath)} must reference the current collection plan.`,
    );
  }
  const rows: RemediationQueueFileRow[] = Array.isArray(queue.queue) ? queue.queue : [];
  return {
    status: queue.status,
    queue_summary: queue.queue_summary ?? null,
    queue: rows.map((row) => ({
      queue_index: row.queue_index,
      assignment_key: row.assignment_key,
      assignment_type: row.assignment_type,
      priority_bucket: row.priority_bucket,
      priority_score: row.priority_score,
      split: row.split,
      signer_alias: row.signer_alias,
      label_id: row.label_id ?? null,
      display_text: row.display_text ?? null,
      challenge_type: row.challenge_type ?? null,
      expected_outcome: row.expected_outcome ?? null,
    })),
  };
}

function assertDatasetCollectionEnabled() {
  if (!datasetCollectionEnabled()) {
    throw new Error(
      "Dataset collection is disabled by default. Set both ENABLE_DATASET_COLLECTION=true and NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true only for explicit-consent collection sessions.",
    );
  }
}

function datasetCollectionEnabled() {
  const PRIVATE_DATASET_COLLECTION_ENABLED =
    process.env["ENABLE_DATASET_COLLECTION"] === "true";
  const PUBLIC_DATASET_COLLECTION_ENABLED =
    process.env["NEXT_PUBLIC_ENABLE_DATASET_COLLECTION"] === "true";
  return PRIVATE_DATASET_COLLECTION_ENABLED && PUBLIC_DATASET_COLLECTION_ENABLED;
}
