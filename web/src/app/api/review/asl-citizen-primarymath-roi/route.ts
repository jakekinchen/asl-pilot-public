import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import type {
  LabelVisibilityStatus,
  RoiCropStatus,
  RoiReviewIntake,
  RoiReviewPacketStatus,
} from "@/lib/roi-review-types";

const PROJECT_ROOT = path.resolve(process.cwd(), "..");
const PACKET_PATH = path.join(PROJECT_ROOT, "docs", "review", "asl-citizen-primarymath-remediation-roi-review-packet.json");
const REVIEW_STATUS_PATH = path.join(PROJECT_ROOT, "docs", "validation", "asl-citizen-primarymath-remediation-roi-review-status.json");
const REVIEWED_MANIFESTS_PATH = path.join(PROJECT_ROOT, "docs", "validation", "asl-citizen-primarymath-remediation-roi-reviewed-manifests.json");
const HANDOFF_PACKAGE_PATH = path.join(PROJECT_ROOT, "docs", "validation", "asl-citizen-primarymath-remediation-roi-review-handoff-package.json");
const STAGED_RETURN_PATH = path.join(PROJECT_ROOT, "data", "asl-citizen-primarymath-roi-review", "returned-roi-review.json");
const WEBAPP_DRAFT_PATH = path.join(PROJECT_ROOT, "data", "asl-citizen-primarymath-roi-review", "returned-roi-review.webapp-draft.json");

const ROI_STATUSES: RoiCropStatus[] = [
  "approved_for_next_extraction",
  "needs_manual_roi",
  "needs_keypoints",
  "reject_crop",
];
const VISIBILITY_STATUSES: LabelVisibilityStatus[] = ["visible", "ambiguous", "not_visible"];
const PACKET_STATUSES: RoiReviewPacketStatus[] = [
  "reviewed_roi_keypoint_packet_ready_for_manifest_export",
  "reviewed_roi_keypoint_packet_rejected",
];

type PacketLabel = {
  label_id: string;
  review_priority?: string;
  sampled_clip_count?: number;
  low_recall_evidence?: { source?: string; recall?: number; support?: number }[];
  contact_sheet?: { path?: string; sha256?: string };
};

type ReviewPacket = {
  schema_version: string;
  status: string;
  label_count?: number;
  sampled_clip_count?: number;
  labels: PacketLabel[];
  reviewer?: unknown;
};

type ApiRequest = {
  action?: "draft" | "stage_audit_export";
  intake?: RoiReviewIntake;
};

export const runtime = "nodejs";

export async function GET() {
  try {
    const [packet, reviewStatus, reviewedManifests, handoffPackage] = await Promise.all([
      readJson<ReviewPacket>(PACKET_PATH),
      readJson<Record<string, unknown>>(REVIEW_STATUS_PATH),
      readJson<Record<string, unknown>>(REVIEWED_MANIFESTS_PATH),
      readJson<Record<string, unknown>>(HANDOFF_PACKAGE_PATH),
    ]);
    return NextResponse.json(
      {
        schema_version: "asl-pilot-asl-citizen-primarymath-roi-review-webapp/v1",
        packet_status: packet.status,
        label_count: packet.label_count ?? packet.labels.length,
        sampled_clip_count: packet.sampled_clip_count ?? 0,
        labels: packet.labels.map((label) => ({
          label_id: label.label_id,
          review_priority: label.review_priority ?? "",
          sampled_clip_count: label.sampled_clip_count ?? 0,
          low_recall_evidence: (label.low_recall_evidence ?? []).map((item) => ({
            source: item.source ?? "",
            recall: Number(item.recall ?? 0),
            support: Number(item.support ?? 0),
          })),
          contact_sheet: {
            path: label.contact_sheet?.path ?? "",
            sha256: label.contact_sheet?.sha256 ?? "",
            url: `/api/review/asl-citizen-primarymath-roi/contact-sheet/${encodeURIComponent(label.label_id)}`,
          },
        })),
        allowed: {
          roi_crop_statuses: ROI_STATUSES,
          label_visibility_statuses: VISIBILITY_STATUSES,
          packet_statuses: PACKET_STATUSES,
        },
        current_gate: {
          review_status: String(reviewStatus.status ?? "unknown"),
          reviewed_manifest_status: String(reviewedManifests.status ?? "unknown"),
          handoff_package_status: String(handoffPackage.status ?? "unknown"),
          archive_path: String((handoffPackage.archive as { path?: unknown } | undefined)?.path ?? ""),
          archive_sha256: String((handoffPackage.archive as { sha256?: unknown } | undefined)?.sha256 ?? ""),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load ROI review packet." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    assertLocalRequest(request);
    const body = (await request.json()) as ApiRequest;
    const action = body.action ?? "draft";
    if (!body.intake) throw new Error("intake is required.");
    const packet = await readJson<ReviewPacket>(PACKET_PATH);
    const blockers = validateIntake(body.intake, packet);
    if (blockers.length > 0) {
      return NextResponse.json(
        {
          status: "blocked_invalid_roi_review_intake",
          blockers,
          next_action: "Complete reviewer metadata and every per-label decision before drafting or staging.",
        },
        { status: 400 },
      );
    }

    const returnedPacket = buildReturnedPacket(packet, body.intake);
    if (action === "draft") {
      return NextResponse.json({
        status: "returned_roi_review_draft_ready",
        returned_packet: returnedPacket,
        next_action: "Download or stage this returned packet, then audit before reviewed manifest export.",
      });
    }

    await writeJson(WEBAPP_DRAFT_PATH, returnedPacket);
    const stageRun = runNode([
      "scripts/stage_asl_citizen_primarymath_roi_review_return.mjs",
      "--input",
      projectRelative(WEBAPP_DRAFT_PATH),
      "--write",
    ]);
    const auditRun = runNode([
      "scripts/audit_asl_citizen_primarymath_roi_review_packet.mjs",
      "--packet",
      projectRelative(STAGED_RETURN_PATH),
      "--write",
    ]);
    const exportRun = runNode([
      "scripts/export_asl_citizen_primarymath_reviewed_roi_manifests.mjs",
      "--packet",
      projectRelative(STAGED_RETURN_PATH),
      "--write",
    ]);

    return NextResponse.json({
      status: exportRun.exit_code === 0
        ? "reviewed_roi_manifest_export_attempt_completed"
        : "reviewed_roi_manifest_export_not_ready",
      returned_packet: returnedPacket,
      staged_packet: projectRelative(STAGED_RETURN_PATH),
      runs: {
        stage: stageRun,
        audit: auditRun,
        export: exportRun,
      },
      next_action: exportRun.exit_code === 0
        ? "Run the trained model and same-split template gates on the reviewed ROI manifests."
        : "Resolve audit/export blockers before using reviewed ROI manifests.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to process ROI review." },
      { status: 400 },
    );
  }
}

async function readJson<T>(file: string) {
  return JSON.parse(await fs.readFile(file, "utf8")) as T;
}

async function writeJson(file: string, value: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function projectRelative(file: string) {
  return path.relative(PROJECT_ROOT, file).split(path.sep).join("/");
}

function assertLocalRequest(request: Request) {
  const rawHost = request.headers.get("host") ?? "";
  const host = rawHost.startsWith("[")
    ? rawHost.slice(0, rawHost.indexOf("]") + 1)
    : rawHost.split(":")[0];
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(host)) {
    throw new Error("ROI review writes are only available from localhost.");
  }
}

function nonEmpty(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 && !value.includes("TODO");
}

function validIso(value: unknown) {
  if (!nonEmpty(value)) return false;
  const timestamp = Date.parse(String(value));
  return Number.isFinite(timestamp) && String(value).includes("T");
}

function validateIntake(intake: RoiReviewIntake, packet: ReviewPacket) {
  const blockers: string[] = [];
  if (intake.schema_version !== "asl-pilot-asl-citizen-primarymath-roi-review-intake/v1") {
    blockers.push("Unexpected intake schema_version.");
  }
  if (!PACKET_STATUSES.includes(intake.status)) blockers.push("Packet status is invalid.");
  for (const field of ["name", "role", "qualification", "affiliation_or_context", "contact_or_signed_evidence"] as const) {
    if (!nonEmpty(intake.reviewer?.[field])) blockers.push(`reviewer.${field} is required.`);
  }
  if (!validIso(intake.reviewer?.reviewed_at)) blockers.push("reviewer.reviewed_at must be an ISO timestamp.");

  const expectedLabels = packet.labels.map((label) => label.label_id);
  for (const labelId of expectedLabels) {
    const decision = intake.decisions?.[labelId];
    if (!decision) {
      blockers.push(`${labelId} decision is required.`);
      continue;
    }
    if (!ROI_STATUSES.includes(decision.roi_crop_status)) blockers.push(`${labelId}.roi_crop_status is invalid.`);
    if (!VISIBILITY_STATUSES.includes(decision.label_visibility_status)) blockers.push(`${labelId}.label_visibility_status is invalid.`);
    if (!nonEmpty(decision.recommended_next_step)) blockers.push(`${labelId}.recommended_next_step is required.`);
    if (!nonEmpty(decision.notes)) blockers.push(`${labelId}.notes is required.`);
    if (
      intake.status === "reviewed_roi_keypoint_packet_ready_for_manifest_export" &&
      (decision.roi_crop_status !== "approved_for_next_extraction" || decision.label_visibility_status !== "visible")
    ) {
      blockers.push(`${labelId} must be approved and visible for manifest export status.`);
    }
  }
  for (const labelId of Object.keys(intake.decisions ?? {})) {
    if (!expectedLabels.includes(labelId)) blockers.push(`Unexpected decision label: ${labelId}.`);
  }
  return blockers;
}

function buildReturnedPacket(packet: ReviewPacket, intake: RoiReviewIntake) {
  return {
    ...packet,
    status: intake.status,
    returned_from_review_webapp: {
      schema_version: intake.schema_version,
      generated_at: new Date().toISOString(),
      source_note: "Generated by the local ROI review web app; audit before reviewed manifest export.",
    },
    reviewer: intake.reviewer,
    labels: packet.labels.map((label) => ({
      ...label,
      reviewer_fields: intake.decisions[label.label_id],
    })),
  };
}

function runNode(args: string[]) {
  const result = spawnSync(process.execPath, args, {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
  });
  return {
    command: ["node", ...args],
    exit_code: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}
