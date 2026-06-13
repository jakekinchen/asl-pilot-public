#!/usr/bin/env node
import { execSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_PATH);
const DEFAULT_ROOT = path.resolve(SCRIPT_DIR, "..");

const PATHS = {
  manualOverlay:
    "data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlays-v1.json",
  gapRepair:
    "data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlay-gap-repair-v1.json",
  expansion:
    "data/annotations/detector0/return-to-form-targeted-annotation-packet-expansion-v1.json",
  basePacket:
    "data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json",
  contract: "docs/model/return-to-form-detector0-manual-label-ingestion-contract-v1.json",
  fixedGate: "docs/model/return-to-form-detector0-fixed-baseline-gate-contract-v1.json",
  sourceRegister: "docs/model/dataset-source-register.json",
  detectorCard: "web/public/model/detector0-card.json",
  browserBundle: "web/public/model/browser-model-bundle.json",
  modelCard: "web/public/model/model-card.json",
  activeVocabulary: "docs/model/active-vocabulary-claim.json",
  artifact:
    "data/annotations/detector0/return-to-form-targeted-annotation-workbench-ingestion-v1.json",
  receipt:
    "docs/validation/return-to-form-m3ib-detector0-reviewed-manual-overlay-ingestion-no-brev-v1.json",
};

const PROMOTED_HAND_TARGETS = ["left_or_first_hand", "right_or_second_hand"];
const COORDINATE_SPACE = "normalized_full_frame_top_left_xyxy";

class IngestionError extends Error {}

function absolute(root, relativePath) {
  return path.join(root, relativePath);
}

function readText(root, relativePath) {
  return fs.readFileSync(absolute(root, relativePath), "utf8");
}

function readJson(root, relativePath) {
  return JSON.parse(readText(root, relativePath));
}

function sha256File(root, relativePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(absolute(root, relativePath)));
  return hash.digest("hex");
}

function stableStringify(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function requireCondition(condition, message) {
  if (!condition) throw new IngestionError(message);
}

function currentGitCommit(root) {
  return execSync("git rev-parse HEAD", {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

function hashEntries(root, relativePaths) {
  return Object.fromEntries(
    relativePaths.map((relativePath) => [
      relativePath,
      {
        path: relativePath,
        sha256: sha256File(root, relativePath),
      },
    ]),
  );
}

function finiteBox(box) {
  return (
    Array.isArray(box)
    && box.length === 4
    && box.every((value) => Number.isFinite(value))
    && box[0] >= 0
    && box[1] >= 0
    && box[2] <= 1
    && box[3] <= 1
    && box[0] < box[2]
    && box[1] < box[3]
  );
}

function cloneTarget(target) {
  return {
    presence: target.presence,
    center_xy_norm: target.center_xy_norm ?? null,
    box_xyxy_norm: target.box_xyxy_norm ?? null,
    visibility_confidence: target.visibility_confidence ?? null,
    occlusion_flag: target.occlusion_flag ?? null,
    truncation_flag: target.truncation_flag ?? null,
    coordinate_space: target.coordinate_space,
    target_applicability: target.target_applicability,
    insufficient_visual_evidence: Boolean(target.insufficient_visual_evidence),
    annotation_source: target.annotation_source,
    provenance: target.provenance,
    target_payload_sha256: target.target_payload_sha256,
  };
}

function identityFields(row) {
  return {
    row_id: row.row_id,
    split: row.split,
    label_id: row.label_id,
    clip_id: row.clip_id,
    source_record_id: row.source_record_id,
    source_video_sha256: row.source_video_sha256,
    frame_index: row.frame_index,
    timestamp_sec: row.timestamp_sec,
    frame_tensor_sha256: row.frame_tensor_sha256,
    tensor_digest_sha256: row.tensor_digest_sha256,
    related_existing_v0_row_id: row.related_existing_v0_row_id,
  };
}

function validateIdentity(row, expansionRow) {
  const rowIdentity = identityFields(row);
  const expansionIdentity = identityFields(expansionRow);
  for (const [field, value] of Object.entries(rowIdentity)) {
    requireCondition(
      value === expansionIdentity[field],
      `${row.row_id} ${field} does not match expansion candidate`,
    );
  }
}

function validateRowProvenance(row) {
  requireCondition(typeof row.reviewer === "string" && row.reviewer.length > 0, `${row.row_id} missing reviewer`);
  requireCondition(typeof row.reviewed_at === "string" && row.reviewed_at.length > 0, `${row.row_id} missing reviewed_at`);
  requireCondition(
    typeof row.review_method === "string" && row.review_method.length > 0,
    `${row.row_id} missing review_method`,
  );
  requireCondition(
    row.source_license_overlay?.source_license_review_status?.startsWith("approved_"),
    `${row.row_id} source license status is not approved`,
  );
  requireCondition(
    row.source_license_overlay?.allowed_for_model_training === true,
    `${row.row_id} source is not approved for model training`,
  );
  requireCondition(
    row.source_license_overlay?.allowed_label_annotation_scope?.includes("manual boxes"),
    `${row.row_id} source annotation scope does not include manual boxes`,
  );
  requireCondition(
    row.no_pretrained_overlay?.pretrained_or_generated_label_use === false,
    `${row.row_id} indicates pretrained or generated label use`,
  );
  requireCondition(
    row.no_pretrained_overlay?.raw_learner_video_upload_used === false,
    `${row.row_id} indicates raw learner video upload`,
  );
}

function promotedRow(row) {
  const targets = {};
  for (const targetId of PROMOTED_HAND_TARGETS) {
    const target = row.targets?.[targetId];
    requireCondition(target, `${row.row_id} missing ${targetId}`);
    requireCondition(target.presence === true, `${row.row_id} ${targetId} is not present`);
    requireCondition(target.coordinate_space === COORDINATE_SPACE, `${row.row_id} ${targetId} coordinate space mismatch`);
    requireCondition(finiteBox(target.box_xyxy_norm), `${row.row_id} ${targetId} invalid normalized box`);
    requireCondition(
      target.provenance?.pretrained_or_generated_label_use === false,
      `${row.row_id} ${targetId} target indicates pretrained/generated label use`,
    );
    targets[targetId] = cloneTarget(target);
  }

  const diagnostic = row.targets?.table_two_hand_union_or_contact_region;
  if (diagnostic) {
    requireCondition(
      diagnostic.diagnostic_only === true && diagnostic.promoted_detector0_target_id === false,
      `${row.row_id} diagnostic union target is not marked diagnostic-only`,
    );
    targets.table_two_hand_union_or_contact_region = {
      presence: diagnostic.presence,
      center_xy_norm: diagnostic.center_xy_norm ?? null,
      box_xyxy_norm: diagnostic.box_xyxy_norm ?? null,
      visibility_confidence: diagnostic.visibility_confidence ?? null,
      occlusion_flag: diagnostic.occlusion_flag ?? null,
      truncation_flag: diagnostic.truncation_flag ?? null,
      coordinate_space: diagnostic.coordinate_space,
      target_applicability: diagnostic.target_applicability,
      diagnostic_only: true,
      promoted_detector0_target_id: false,
      derived_only_from_manual_hand_boxes: Boolean(diagnostic.derived_only_from_manual_hand_boxes),
      derivation_policy: diagnostic.derivation_policy,
      insufficient_visual_evidence: Boolean(diagnostic.insufficient_visual_evidence),
      target_payload_sha256: diagnostic.target_payload_sha256,
    };
  }

  return {
    row_id: row.row_id,
    split: row.split,
    label_id: row.label_id,
    clip_id: row.clip_id,
    frame_index: row.frame_index,
    timestamp_sec: row.timestamp_sec,
    source: {
      source_id: row.source_id,
      source_split: row.source_split,
      source_record_id: row.source_record_id,
      source_video_sha256: row.source_video_sha256,
      signer_identity_hash: row.signer_identity_hash,
      frame_tensor_path: row.frame_tensor_path,
      frame_tensor_sha256: row.frame_tensor_sha256,
      tensor_digest_sha256: row.tensor_digest_sha256,
      related_existing_v0_row_id: row.related_existing_v0_row_id,
    },
    review: {
      review_status: row.review_status,
      reviewer: row.reviewer,
      reviewed_at: row.reviewed_at,
      review_method: row.review_method,
      review_evidence_reference:
        "data/annotations/detector0/return-to-form-targeted-annotation-manual-contact-sheet-overlays-v1.json",
      annotation_source: "manual_contact_sheet_overlay_review_from_retained_tensor_full_frame_reference",
      label_source: "project_authored_manual_contact_sheet_overlay",
      source_rights_attestation: row.source_license_overlay,
      no_pretrained_attestation: row.no_pretrained_overlay,
    },
    targets,
    notes: row.notes,
  };
}

function blockedRow(row) {
  return {
    row_id: row.row_id,
    split: row.split,
    label_id: row.label_id,
    clip_id: row.clip_id,
    frame_index: row.frame_index,
    review_status: row.review_status,
    reviewer: row.reviewer,
    reviewed_at: row.reviewed_at,
    reason: "insufficient_visual_evidence",
    detail:
      row.targets?.left_or_first_hand?.blocker_detail
      ?? row.notes
      ?? "Manual overlay review recorded insufficient visual evidence.",
    targets: {
      left_or_first_hand: cloneTarget(row.targets.left_or_first_hand),
      right_or_second_hand: cloneTarget(row.targets.right_or_second_hand),
      table_two_hand_union_or_contact_region: {
        ...cloneTarget(row.targets.table_two_hand_union_or_contact_region),
        diagnostic_only: true,
        promoted_detector0_target_id: false,
      },
    },
  };
}

function claimSurfaceProof(root) {
  const detectorCard = readJson(root, PATHS.detectorCard);
  const browserBundle = readJson(root, PATHS.browserBundle);
  const modelCard = readJson(root, PATHS.modelCard);
  const activeVocabulary = readJson(root, PATHS.activeVocabulary);

  requireCondition(detectorCard.status === "not_trained", "detector0 card is not fail-closed");
  requireCondition(detectorCard.promotion_state === "research_only", "detector0 card promotion state changed");
  requireCondition(detectorCard.browser_artifact === null, "detector0 browser artifact is not null");
  requireCondition(browserBundle.recognition?.enabled === false, "recognition is enabled");
  requireCondition(browserBundle.detector0_tracking?.enabled === false, "detector0 tracking is enabled");
  requireCondition(browserBundle.box_driven_avatar?.enabled === false, "box-driven avatar is enabled");
  requireCondition(modelCard.status === "not_trained", "model card is not fail-closed");
  requireCondition(Array.isArray(activeVocabulary.activeLabels) && activeVocabulary.activeLabels.length === 0, "active labels are not empty");

  return {
    claim_surfaces_mutated: false,
    [PATHS.detectorCard]: {
      sha256: sha256File(root, PATHS.detectorCard),
      status: detectorCard.status,
      promotion_state: detectorCard.promotion_state,
      browser_artifact: detectorCard.browser_artifact,
    },
    [PATHS.browserBundle]: {
      sha256: sha256File(root, PATHS.browserBundle),
      recognition_enabled: browserBundle.recognition?.enabled,
      detector0_tracking_enabled: browserBundle.detector0_tracking?.enabled,
      box_driven_avatar_enabled: browserBundle.box_driven_avatar?.enabled,
    },
    [PATHS.modelCard]: {
      sha256: sha256File(root, PATHS.modelCard),
      status: modelCard.status,
    },
    [PATHS.activeVocabulary]: {
      sha256: sha256File(root, PATHS.activeVocabulary),
      activeLabels: activeVocabulary.activeLabels,
    },
  };
}

export function buildReviewedManualOverlayIngestion({
  root = DEFAULT_ROOT,
  checkedAt = new Date().toISOString(),
  currentCommit = currentGitCommit(root),
} = {}) {
  const manualOverlay = readJson(root, PATHS.manualOverlay);
  const expansion = readJson(root, PATHS.expansion);
  const contract = readJson(root, PATHS.contract);
  const fixedGate = readJson(root, PATHS.fixedGate);

  requireCondition(
    manualOverlay.schema_version === "asl-pilot-detector0-manual-contact-sheet-overlays/v1",
    "manual overlay schema mismatch",
  );
  requireCondition(
    manualOverlay.status === "manual_overlay_packet_reviewed_not_training_ready",
    "manual overlay status mismatch",
  );
  requireCondition(Array.isArray(manualOverlay.rows), "manual overlay rows missing");
  requireCondition(Array.isArray(expansion.selected_candidate_rows), "expansion selected rows missing");
  requireCondition(
    contract.schema_version === "asl-pilot-detector0-manual-label-ingestion-contract/v1",
    "manual label ingestion contract schema mismatch",
  );

  const expansionRows = new Map(expansion.selected_candidate_rows.map((row) => [row.row_id, row]));
  const seen = new Set();
  const rows = [];
  const blockedRows = [];
  const rejectedRows = [];

  for (const row of manualOverlay.rows) {
    requireCondition(!seen.has(row.row_id), `duplicate row_id ${row.row_id}`);
    seen.add(row.row_id);
    requireCondition(expansionRows.has(row.row_id), `${row.row_id} missing from M3HS expansion rows`);
    validateIdentity(row, expansionRows.get(row.row_id));
    validateRowProvenance(row);

    if (row.review_status === "manual_contact_sheet_overlay_authored") {
      rows.push(promotedRow(row));
    } else if (row.review_status === "blocked_insufficient_visual_evidence") {
      blockedRows.push(blockedRow(row));
    } else {
      rejectedRows.push({
        row_id: row.row_id,
        review_status: row.review_status,
        reason: "unsupported_review_status",
      });
    }
  }

  const promotedTargets = Object.fromEntries(PROMOTED_HAND_TARGETS.map((targetId) => [targetId, rows.length]));
  const sourceArtifacts = hashEntries(root, [
    PATHS.manualOverlay,
    PATHS.gapRepair,
    PATHS.expansion,
    PATHS.basePacket,
    PATHS.contract,
    PATHS.fixedGate,
    PATHS.sourceRegister,
    PATHS.detectorCard,
    PATHS.browserBundle,
    PATHS.modelCard,
    PATHS.activeVocabulary,
  ]);

  const artifact = {
    schema_version: "asl-pilot-detector0-reviewed-manual-overlay-ingestion/v1",
    status: "reviewed_manual_overlay_ingested_not_training_ready",
    mission: "M3IB - Detector 0 reviewed manual overlay ingestion no Brev",
    created_at: checkedAt,
    current_commit: currentCommit,
    active_prompt: "direct_user_repair_fix_it_all_2026-05-29",
    purpose:
      "Materialize existing tracked reviewed manual contact-sheet overlay rows into one supplemental Detector 0 label artifact, without authoring new boxes, training, exporting, promoting, or changing claim surfaces.",
    source_input_kind:
      "tracked_reviewed_manual_contact_sheet_overlay_packet_not_local_browser_draft_export",
    latest_user_instruction: "fix it all",
    source_artifacts: sourceArtifacts,
    validation_summary: {
      source_candidate_row_count: manualOverlay.rows.length,
      promoted_row_count: rows.length,
      blocked_row_count: blockedRows.length,
      rejected_row_count: rejectedRows.length,
      promoted_targets: promotedTargets,
      accepted_review_status: "manual_contact_sheet_overlay_authored",
      preserved_blocked_status: "blocked_insufficient_visual_evidence",
      coordinate_space: COORDINATE_SPACE,
    },
    contract_context: {
      path: PATHS.contract,
      sha256: sourceArtifacts[PATHS.contract].sha256,
      note:
        "The M3HZ workbench-draft contract remained the validation baseline; this artifact uses the stronger tracked M3HV reviewed overlay packet because no local browser draft export existed.",
    },
    source_rights_and_no_pretrained_proof: manualOverlay.source_rights_and_no_pretrained_attestation,
    review_method: manualOverlay.review_method,
    fixed_baseline_gate_context: {
      path: PATHS.fixedGate,
      sha256: sourceArtifacts[PATHS.fixedGate].sha256,
      learned_targets: fixedGate.design_decision?.learned_targets ?? PROMOTED_HAND_TARGETS,
      fixed_anchor_targets: fixedGate.design_decision?.fixed_anchor_targets ?? [
        "head_or_face",
        "upper_body_or_signing_space",
      ],
      diagnostic_only_targets: fixedGate.design_decision?.diagnostic_only_targets ?? [
        "table_two_hand_union_or_contact_region",
      ],
      held_out_fixed_box_iou_baselines_to_beat:
        fixedGate.success_gate?.beat_fixed_baseline_test
        ?? fixedGate.held_out_fixed_box_iou_baselines_to_beat
        ?? {
          left_or_first_hand_iou_above: 0.4073,
          right_or_second_hand_iou_above: 0.6476,
        },
      promotion_language_allowed_by_this_artifact: false,
    },
    claim_surface_proof: claimSurfaceProof(root),
    rows,
    blocked_rows: blockedRows,
    rejected_rows: rejectedRows,
    readiness_classification: {
      authoritative_supplemental_labels_created: rows.length > 0,
      promoted_reviewed_row_count: rows.length,
      blocked_row_count: blockedRows.length,
      detector0_training_ready: false,
      detector0_evaluation_ready: false,
      browser_promotion_ready: false,
      final_gate_ready: false,
      claim_expansion_ready: false,
      claim_surfaces_remain_fail_closed: true,
      reason:
        "This artifact adds reviewed supplemental hand boxes, but it is not by itself a full training/evaluation manifest, hard-negative packet, browser artifact, or fixed-baseline gate win.",
    },
    forbidden_action_proof: {
      author_new_boxes: false,
      fabricate_review_metadata: false,
      source_or_media_import: false,
      raw_learner_media_inspection: false,
      raw_learner_video_upload: false,
      pretrained_or_generated_label_dependency: false,
      training_or_evaluation_run: false,
      brev_lifecycle_or_remote_command: false,
      paid_compute_started: false,
      model_card_or_claim_surface_mutation: false,
      final_gate_change: false,
      export_promotion_or_browser_activation: false,
    },
    exactly_one_next_action: "continue_m3ic_detector0_combined_packet_training_contract_no_brev",
  };

  const receipt = {
    schema_version: "asl-pilot-return-to-form-m3ib-detector0-reviewed-manual-overlay-ingestion-no-brev/v1",
    mission: artifact.mission,
    created_at: checkedAt,
    current_commit: currentCommit,
    status: "completed_supplemental_ingestion_artifact_created_not_training_ready",
    purpose: artifact.purpose,
    source_files_inspected: Object.keys(sourceArtifacts),
    changed_files_for_this_slice: [PATHS.artifact, PATHS.receipt],
    artifact: {
      path: PATHS.artifact,
      created: true,
      promoted_row_count: rows.length,
      blocked_row_count: blockedRows.length,
      rejected_row_count: rejectedRows.length,
    },
    validation_summary: artifact.validation_summary,
    claim_surface_proof: artifact.claim_surface_proof,
    source_rights_and_no_pretrained_proof: artifact.source_rights_and_no_pretrained_proof,
    fixed_baseline_gate_context: artifact.fixed_baseline_gate_context,
    readiness_classification: artifact.readiness_classification,
    forbidden_action_proof: artifact.forbidden_action_proof,
    command_statuses: [
      {
        command: "node scripts/ingest_detector0_reviewed_manual_overlays.mjs --write",
        status: "passed",
        summary:
          "Materialized 17 reviewed manual overlay rows and preserved 1 insufficient-visual-evidence blocker.",
      },
    ],
    exactly_one_next_action: artifact.exactly_one_next_action,
  };

  return { artifact, receipt, paths: PATHS };
}

export function writeReviewedManualOverlayIngestion({
  root = DEFAULT_ROOT,
  checkedAt = new Date().toISOString(),
  currentCommit = currentGitCommit(root),
} = {}) {
  const result = buildReviewedManualOverlayIngestion({ root, checkedAt, currentCommit });
  fs.mkdirSync(path.dirname(absolute(root, PATHS.artifact)), { recursive: true });
  fs.mkdirSync(path.dirname(absolute(root, PATHS.receipt)), { recursive: true });
  fs.writeFileSync(absolute(root, PATHS.artifact), stableStringify(result.artifact), "utf8");
  const artifactHash = sha256File(root, PATHS.artifact);
  result.receipt.artifact.sha256 = artifactHash;
  result.receipt.changed_files_for_this_slice = [PATHS.artifact, PATHS.receipt];
  fs.writeFileSync(absolute(root, PATHS.receipt), stableStringify(result.receipt), "utf8");
  return { ...result, artifactHash };
}

function main() {
  const args = new Set(process.argv.slice(2));
  const shouldWrite = args.has("--write");
  const result = shouldWrite
    ? writeReviewedManualOverlayIngestion()
    : buildReviewedManualOverlayIngestion();
  const summary = {
    status: shouldWrite ? "written" : "checked",
    artifact_path: PATHS.artifact,
    receipt_path: PATHS.receipt,
    artifact_sha256: result.artifactHash ?? null,
    promoted_row_count: result.artifact.validation_summary.promoted_row_count,
    blocked_row_count: result.artifact.validation_summary.blocked_row_count,
    next_action: result.artifact.exactly_one_next_action,
  };
  console.log(JSON.stringify(summary, null, 2));
}

if (process.argv[1] === SCRIPT_PATH) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
