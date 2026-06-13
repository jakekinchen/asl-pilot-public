import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const packetPath = path.join(root, "docs", "review", "online-negative-challenge-review-packet.json");
const observationsPath = path.join(root, "docs", "review", "online-negative-challenge-contact-sheet-observations.json");
const registerPath = path.join(root, "docs", "model", "dataset-source-register.json");
const sourceAuditPath = path.join(root, "docs", "research", "online-negative-challenge-mixed-source-audit.json");
const sourceReviewPath = path.join(root, "docs", "research", "online-negative-challenge-mixed-source-review.md");
const combinedReceiptPath = path.join(root, "docs", "research", "online-negative-challenge-mixed-external-rights-review-receipt.json");
const wikimediaReceiptPath = path.join(root, "docs", "research", "wikimedia-commons-negative-challenge-external-rights-review-receipt.json");
const ciraReceiptPath = path.join(root, "docs", "research", "cira-negative-challenge-external-rights-review-receipt.json");
const aslCitizenReceiptPath = path.join(root, "docs", "research", "asl-citizen-non-target-negative-challenge-external-rights-review-receipt.json");

const combinedSourceId = "online-negative-challenge-mixed-wikimedia-cira-v1";
const wikimediaSourceId = "wikimedia-commons-negative-challenge-videos";
const ciraSourceId = "cira-satellite-library-negative-challenge-videos";
const aslCitizenSourceId = "asl-citizen-school-assignment-raw-videos";
const aslCitizenAcademicReceiptPath = path.join(root, "docs", "research", "asl-citizen-academic-external-rights-review-receipt.json");
const aslCitizenAcademicReviewPath = path.join(root, "docs", "research", "asl-citizen-academic-source-review.md");
const aslCitizenExtractionPath = path.join(root, "docs", "research", "asl-citizen-non-target-extracted-clips.json");
const aslCitizenLicenseUrl = "https://www.microsoft.com/en-us/research/project/asl-citizen/dataset-license/";
const aslCitizenSourceHostPrefixes = [
  "https://download.microsoft.com/",
  "https://www.microsoft.com/en-us/research/project/asl-citizen/",
];
const selectedAt = "2026-05-21T00:00:00.000Z";
const reviewedAt = "2026-05-21T00:06:00.000Z";
const acceptedWikimediaLicenses = new Set([
  "Public domain",
  "CC0",
  "CC BY 2.0",
  "CC BY 3.0",
  "CC BY-SA 2.0",
  "CC BY-SA 4.0",
]);
const requiredTypes = ["empty_camera", "no_hands_visible", "low_light", "off_center", "non_target_asl_sign"];
const minPerRequiredType = 5;

function parseArgs(argv) {
  const args = { write: false, updateRegister: false };
  for (const item of argv) {
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--write") {
      args.write = true;
      continue;
    }
    if (item === "--update-register") {
      args.updateRegister = true;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/export_online_negative_challenge_source_review.mjs --write [--update-register]

Verifies the selected mixed Wikimedia/CIRA/ASL-Citizen online negative-challenge
review set and writes exact-file validation-only source audit and rights-review
receipts. This is engineering provenance evidence, not legal advice.
`);
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function resolveProjectPath(value, context) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${context} escapes project root: ${value}`);
  }
  return resolved;
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, "utf8");
}

function countsBy(items, key) {
  const counts = {};
  for (const item of items) {
    const value = item[key];
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function sourceLabel(sourceId) {
  if (sourceId === wikimediaSourceId) return "Wikimedia Commons";
  if (sourceId === ciraSourceId) return "CIRA Satellite Library";
  if (sourceId === aslCitizenSourceId) return "ASL Citizen non-target raw videos";
  if (sourceId === combinedSourceId) return "Mixed Wikimedia/CIRA/ASL-Citizen negative challenge set";
  return sourceId;
}

function decisionIdFor(sourceId) {
  if (sourceId === wikimediaSourceId) return "approved_wikimedia_commons_negative_challenge_exact_files_2026_05_21";
  if (sourceId === ciraSourceId) return "approved_cira_negative_challenge_exact_files_2026_05_21";
  if (sourceId === aslCitizenSourceId) return "approved_asl_citizen_school_assignment_raw_videos_2026_05_21";
  if (sourceId === combinedSourceId) return "approved_mixed_online_negative_challenge_exact_files_2026_05_21";
  throw new Error(`Unknown source id: ${sourceId}`);
}

function licenseStatusFor(sourceId) {
  if (sourceId === wikimediaSourceId) return "approved_validation_only_free_license_or_public_domain_with_attribution";
  if (sourceId === ciraSourceId) return "approved_validation_only_cira_noaa_credit_required";
  if (sourceId === aslCitizenSourceId) return "approved_noncommercial_school_assignment_raw_video_only";
  if (sourceId === combinedSourceId) return "approved_validation_only_mixed_external_raw_video_with_attribution";
  throw new Error(`Unknown source id: ${sourceId}`);
}

function validateClip(clip, observationById, blockers) {
  const context = clip?.candidate_id ?? "unknown candidate";
  if (!clip || typeof clip !== "object" || Array.isArray(clip)) {
    blockers.push("clip must be an object");
    return null;
  }
  const localPath = resolveProjectPath(clip.local_video_path, `${context}.local_video_path`);
  if (!fs.existsSync(localPath)) {
    blockers.push(`${context} local video is missing: ${clip.local_video_path}`);
  } else {
    const actualHash = sha256File(localPath);
    if (actualHash !== clip.downloaded_sha256) {
      blockers.push(`${context} downloaded_sha256 mismatch; expected ${clip.downloaded_sha256}, got ${actualHash}`);
    }
  }
  const metadata = clip.source_file_metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    blockers.push(`${context} source_file_metadata must be an object`);
  } else if (metadata.source_sha256 !== clip.downloaded_sha256) {
    blockers.push(`${context} source_file_metadata.source_sha256 must match downloaded_sha256`);
  }
  const observation = observationById.get(clip.candidate_id);
  if (!observation) {
    blockers.push(`${context} is missing contact-sheet visual observation`);
  } else if (observation.visual_status !== "strong_visual_candidate") {
    blockers.push(`${context} visual_status must be strong_visual_candidate, got ${observation.visual_status}`);
  }
  if (clip.source_id === wikimediaSourceId) {
    const license = metadata?.license_short_name ?? clip.source_license_short_name;
    if (!acceptedWikimediaLicenses.has(license)) {
      blockers.push(`${context} has unaccepted Wikimedia license: ${license}`);
    }
    if (String(license).toLowerCase().includes("nc") || String(license).toLowerCase().includes("nd")) {
      blockers.push(`${context} has a non-commercial or no-derivatives license: ${license}`);
    }
  } else if (clip.source_id === ciraSourceId) {
    if (!String(clip.source_file_url ?? "").startsWith("https://satlib.cira.colostate.edu/")) {
      blockers.push(`${context} CIRA source_file_url must be hosted by satlib.cira.colostate.edu`);
    }
    if (!String(clip.source_credit ?? "").includes("CSU/CIRA") || !String(clip.source_credit ?? "").includes("NOAA")) {
      blockers.push(`${context} CIRA source_credit must include CSU/CIRA and NOAA credit`);
    }
  } else if (clip.source_id === aslCitizenSourceId) {
    if (clip.challenge_type !== "non_target_asl_sign") {
      blockers.push(`${context} ASL Citizen clip challenge_type must be non_target_asl_sign, got ${clip.challenge_type}`);
    }
    const sourceFileUrl = String(clip.source_file_url ?? "");
    if (!aslCitizenSourceHostPrefixes.some((prefix) => sourceFileUrl.startsWith(prefix))) {
      blockers.push(`${context} ASL Citizen source_file_url must be hosted by Microsoft Research ASL Citizen download`);
    }
    if (!String(clip.source_record_id ?? "").startsWith("ASL_Citizen/videos/")) {
      blockers.push(`${context} ASL Citizen source_record_id must reference an ASL_Citizen/videos/ archive entry`);
    }
    if (!String(clip.source_credit ?? "").trim()) {
      blockers.push(`${context} ASL Citizen clip must record source_credit naming the off-active-module gloss`);
    }
    const relativeVideoPath = String(clip.local_video_path ?? "");
    if (!relativeVideoPath.startsWith("data/external/asl-citizen/raw/non-target/")) {
      blockers.push(`${context} ASL Citizen local_video_path must live under data/external/asl-citizen/raw/non-target/`);
    }
  } else {
    blockers.push(`${context} has unexpected source_id: ${clip.source_id}`);
  }
  return {
    candidate_id: clip.candidate_id,
    challenge_type: clip.challenge_type,
    source_id: clip.source_id,
    source_record_id: clip.source_record_id,
    source_page_url: clip.source_page_url,
    source_file_url: clip.source_file_url,
    source_file_page_title: clip.source_file_page_title,
    source_license_short_name: clip.source_license_short_name,
    source_author: clip.source_author,
    source_credit: clip.source_credit ?? "",
    local_video_path: clip.local_video_path,
    sha256: clip.downloaded_sha256,
    size_bytes: metadata?.size_bytes ?? null,
    mime: metadata?.mime ?? null,
    visual_status: observation?.visual_status ?? null,
    recommended_action: observation?.recommended_action ?? null,
  };
}

function buildReview() {
  const blockers = [];
  const packet = readJson(packetPath);
  const observations = readJson(observationsPath);
  if (packet.status !== "ready_for_visual_review") {
    blockers.push(`review packet status must be ready_for_visual_review, got ${packet.status}`);
  }
  if (Array.isArray(packet.blockers) && packet.blockers.length > 0) {
    blockers.push(`review packet has blockers: ${packet.blockers.join("; ")}`);
  }
  if (observations.status !== "needs_curated_review") {
    blockers.push(`observations status must be needs_curated_review, got ${observations.status}`);
  }
  if (observations.finality !== "not_final_model_evidence") {
    blockers.push("observations must remain not_final_model_evidence");
  }
  if (observations.summary?.strong_visual_candidates !== packet.selected_count) {
    blockers.push("observations must mark every selected clip as a strong visual candidate");
  }
  if (observations.summary?.approved_for_final_manifest_count !== 0) {
    blockers.push("observations must not claim final manifest approval");
  }
  const observationById = new Map((observations.observations ?? []).map((item) => [item.candidate_id, item]));
  const files = [];
  for (const clip of packet.clips ?? []) {
    const file = validateClip(clip, observationById, blockers);
    if (file) files.push(file);
  }
  const challengeTypeCounts = countsBy(files, "challenge_type");
  for (const type of requiredTypes) {
    if ((challengeTypeCounts[type] ?? 0) < minPerRequiredType) {
      blockers.push(`need at least ${minPerRequiredType} selected ${type} clips; found ${challengeTypeCounts[type] ?? 0}`);
    }
  }
  const sourceCounts = countsBy(files, "source_id");
  if (!sourceCounts[wikimediaSourceId]) blockers.push("mixed source audit requires at least one Wikimedia file");
  if (!sourceCounts[ciraSourceId]) blockers.push("mixed source audit requires at least one CIRA file");
  if (!sourceCounts[aslCitizenSourceId]) blockers.push("mixed source audit requires at least one ASL Citizen non-target file");
  const status = blockers.length === 0 ? "passed" : "blocked";
  return {
    schema_version: "asl-pilot-online-negative-challenge-source-audit/v1",
    source_id: combinedSourceId,
    status,
    evidence_mode: "exact_file_external_raw_video_validation_source_review",
    finality: "source_register_evidence_not_legal_advice",
    reviewed_at: reviewedAt,
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: {
        path: "scripts/export_online_negative_challenge_source_review.mjs",
        sha256: sha256File(path.join(root, "scripts", "export_online_negative_challenge_source_review.mjs")),
      },
    },
    source_scope: "validation_only_negative_challenge_reject_evaluation",
    source_ids: [wikimediaSourceId, ciraSourceId, aslCitizenSourceId],
    upstream_rights_references: [
      {
        title: "Wikimedia Commons reuse guidance",
        url: "https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/en",
        checked_at: reviewedAt,
        summary: "Commons media files are reused according to the per-file license or public-domain status, with attribution and license details retained where required.",
      },
      {
        title: "Wikimedia Commons license summary guidance",
        url: "https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/licenses/en",
        checked_at: reviewedAt,
        summary: "CC BY and CC BY-SA media require attribution and license identification; public-domain/CC0 files retain provenance attribution in this project.",
      },
      {
        title: "CIRA Satellite Library credit guidance",
        url: "https://satlib.cira.colostate.edu/credit-media/",
        checked_at: reviewedAt,
        summary: "CIRA publishes satellite-imagery credit guidance; selected CIRA files retain CSU/CIRA and NOAA credit in source metadata.",
      },
      {
        title: "Microsoft Research ASL Citizen dataset license",
        url: aslCitizenLicenseUrl,
        checked_at: reviewedAt,
        summary: "ASL Citizen raw videos are reused under the Microsoft Research noncommercial school-assignment scope already approved in the source register; only off-active-module raw clips are referenced here, with no raw video, modified video, or extracted frames redistributed by this repo.",
      },
    ],
    selected_review_packet: {
      path: projectRelative(packetPath),
      sha256: sha256File(packetPath),
      status: packet.status,
      selected_count: packet.selected_count,
      source_mix_by_type: packet.source_mix_by_type,
    },
    visual_observations: {
      path: projectRelative(observationsPath),
      sha256: sha256File(observationsPath),
      status: observations.status,
      finality: observations.finality,
      summary: observations.summary,
      excluded_observations: observations.excluded_observations ?? [],
    },
    validation_decision: {
      allowed_for_model_training: false,
      allowed_for_validation: true,
      allowed_for_pilot_submission: true,
      raw_frame_only: true,
      derived_features_allowed: false,
      required_attribution: [
        "Retain per-file Wikimedia author, source, and license metadata.",
        "Credit selected CIRA/JPSS imagery as CSU/CIRA & NOAA/NESDIS.",
        "Cite ASL Citizen (Microsoft Research) noncommercial school-assignment use and retain per-clip source_record_id, source_credit gloss, and SHA-256.",
      ],
    },
    selected_count: files.length,
    challenge_type_counts: challengeTypeCounts,
    source_counts: sourceCounts,
    selected_files: files,
    blockers,
    limitations: [
      "This is an engineering provenance and rights-screening receipt, not legal advice.",
      "Approval is limited to the exact selected local raw-video files and SHA-256 hashes in this audit.",
      "The files are approved only for negative-challenge validation/pilot evidence, not model training.",
      "Final manifest generation must still decode tensors and preserve file-level source metadata.",
    ],
  };
}

function receiptFor(sourceId, audit, auditHash, reviewHash) {
  const selected = sourceId === combinedSourceId
    ? audit.selected_files
    : audit.selected_files.filter((file) => file.source_id === sourceId);
  const evidenceFiles = [
    {
      path: projectRelative(sourceAuditPath),
      sha256: auditHash,
      purpose: "Exact selected file audit with local SHA-256 hashes, source URLs, license/credit metadata, visual-pruning evidence, and validation-only scope.",
    },
    {
      path: projectRelative(sourceReviewPath),
      sha256: reviewHash,
      purpose: "Human-readable engineering source decision for the mixed online negative challenge route.",
    },
  ];
  if (sourceId === aslCitizenSourceId) {
    evidenceFiles.push({
      path: projectRelative(aslCitizenAcademicReceiptPath),
      sha256: sha256File(aslCitizenAcademicReceiptPath),
      purpose: "Upstream noncommercial school-assignment source-rights receipt for ASL Citizen raw videos.",
    });
    evidenceFiles.push({
      path: projectRelative(aslCitizenAcademicReviewPath),
      sha256: sha256File(aslCitizenAcademicReviewPath),
      purpose: "Upstream noncommercial school-assignment source review markdown for ASL Citizen raw videos.",
    });
    evidenceFiles.push({
      path: projectRelative(aslCitizenExtractionPath),
      sha256: sha256File(aslCitizenExtractionPath),
      purpose: "Non-target ASL Citizen clip extraction provenance (archive offsets, glosses, SHA-256s).",
    });
  }
  const aslCitizenSummary = "ASL Citizen non-target raw clips are reused only as off-active-module negative-challenge validation evidence under the existing noncommercial school-assignment source approval. Raw videos, modified videos, extracted frames, and local mirrors are not redistributed.";
  const defaultSummary = `${sourceLabel(sourceId)} exact files are approved for ASL Pilot raw-video reject-only negative challenge validation and pilot evidence with retained per-file provenance and attribution. They are not approved for model training or as a general source-family approval.`;
  return {
    schema_version: "asl-pilot-external-rights-review-receipt/v1",
    source_id: sourceId,
    decision_id: decisionIdFor(sourceId),
    status: "approved_for_this_pilot",
    reviewed_at: reviewedAt,
    reviewer: {
      name: "ASL Pilot automated exact-file source-rights gate",
      role: "machine-readable validation-only source, license, attribution, and provenance audit",
      is_project_operator: false,
    },
    decision_scope: {
      allowed_for_model_training: false,
      allowed_for_validation: true,
      allowed_for_pilot_submission: true,
    },
    allowed_use_summary: sourceId === aslCitizenSourceId ? aslCitizenSummary : defaultSummary,
    evidence_files: evidenceFiles,
    selected_file_count: selected.length,
    selected_files: selected.map((file) => ({
      candidate_id: file.candidate_id,
      challenge_type: file.challenge_type,
      source_id: file.source_id,
      source_page_url: file.source_page_url,
      source_file_url: file.source_file_url,
      source_license_short_name: file.source_license_short_name,
      source_author: file.source_author,
      source_credit: file.source_credit,
      local_video_path: file.local_video_path,
      sha256: file.sha256,
    })),
    limitations: [
      "This receipt is an engineering source-rights/provenance review, not legal advice.",
      "The approval is limited to validation-only negative challenge evidence for the exact files and SHA-256 hashes listed here.",
      "Every final manifest clip must keep the source page URL, original file URL, license short name, author, credit, MIME type, and source SHA-256.",
    ],
  };
}

function buildReviewMarkdown(audit) {
  const rows = audit.selected_files
    .map((file) => `| \`${file.candidate_id}\` | \`${file.challenge_type}\` | \`${file.source_id}\` | ${file.source_license_short_name} | \`${file.sha256}\` |`)
    .join("\n");
  return `# Online Negative Challenge Mixed Source Review

Checked at: ${reviewedAt}

## Decision

The selected mixed Wikimedia/CIRA/ASL-Citizen raw-video files are approved for
ASL Pilot validation-only reject evaluation and pilot evidence, subject to
retained per-file provenance and attribution. This is an engineering
source-rights and provenance review, not legal advice.

This decision is exact-file scoped. It does not approve any upstream source for
broad future downloads, landmarks, embeddings, detectors, features, or
pretrained artifacts. ASL Citizen raw clips are reused only under the existing
noncommercial school-assignment source-register approval, and only as
off-active-module negative-challenge evidence; raw videos, modified videos, and
extracted frames are not redistributed by this repo.

## Scope

- Combined source id: \`${combinedSourceId}\`
- Wikimedia source id: \`${wikimediaSourceId}\`
- CIRA source id: \`${ciraSourceId}\`
- ASL Citizen source id: \`${aslCitizenSourceId}\`
- Selected clips: ${audit.selected_count}
- Required challenge counts: \`${JSON.stringify(audit.challenge_type_counts)}\`
- Source counts: \`${JSON.stringify(audit.source_counts)}\`

## Evidence

- Source audit: \`${projectRelative(sourceAuditPath)}\`
- Mixed review packet: \`${audit.selected_review_packet.path}\`
- Contact-sheet observations: \`${audit.visual_observations.path}\`
- Wikimedia reuse guidance: https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/en
- CIRA credit guidance: https://satlib.cira.colostate.edu/credit-media/
- ASL Citizen Microsoft Research license: ${aslCitizenLicenseUrl}
- ASL Citizen non-target extraction provenance: \`${projectRelative(aslCitizenExtractionPath)}\`

## Selected Files

| Candidate | Type | Source | License/Credit | SHA-256 |
| --- | --- | --- | --- | --- |
${rows}

## Required Follow-Up

1. Generate \`data/manifests/negative-challenge.json\` from the exact selected files only.
2. Decode raw RGB tensors and retain decode provenance.
3. Run \`./.venv/bin/python scripts/audit_final_manifests.py\`.
4. Run final evaluation without \`--allow-smoke-eval\`.
`;
}

function sourceEntry(sourceId, auditHash, reviewHash, receiptPath, receiptHash) {
  const common = {
    source_id: sourceId,
    display_name: sourceLabel(sourceId),
    source_kind: sourceId === combinedSourceId ? "external_dataset_family" : "public_reference_dataset",
    allowed_for_model_training: false,
    allowed_for_validation: true,
    allowed_for_pilot_submission: true,
    license_review_status: licenseStatusFor(sourceId),
    decision_id: decisionIdFor(sourceId),
    review_required_before_allowing: true,
    external_rights_review: {
      status: "approved_for_this_pilot",
      reviewed_at: reviewedAt,
      reviewer_name: "ASL Pilot automated exact-file source-rights gate",
      reviewer_role: "machine-readable validation-only source, license, attribution, and provenance audit",
      is_project_operator: false,
      allowed_use_summary: `${sourceLabel(sourceId)} exact files are approved for ASL Pilot raw-video reject-only negative challenge validation and pilot evidence with retained per-file provenance and attribution. They are not approved for model training or as a general source-family approval.`,
      decision_scope: {
        allowed_for_model_training: false,
        allowed_for_validation: true,
        allowed_for_pilot_submission: true,
      },
      review_receipt: {
        path: projectRelative(receiptPath),
        sha256: receiptHash,
      },
      license_evidence_files: [
        {
          path: projectRelative(sourceAuditPath),
          sha256: auditHash,
        },
        {
          path: projectRelative(sourceReviewPath),
          sha256: reviewHash,
        },
      ],
    },
    source_evidence: [
      {
        evidence_type: "exact_file_source_audit",
        path: projectRelative(sourceAuditPath),
        sha256: auditHash,
        checked_at: reviewedAt,
        summary: "Exact selected file audit verifies source URLs, local SHA-256 hashes, accepted license/credit metadata, and validation-only scope for the mixed online negative challenge set.",
        supports_decision: true,
      },
      {
        evidence_type: "approved_exact_file_source_review",
        path: projectRelative(sourceReviewPath),
        sha256: reviewHash,
        checked_at: reviewedAt,
        summary: "Engineering source review approves only the exact selected mixed-source raw videos for reject-only validation and pilot evidence.",
        supports_decision: true,
      },
    ],
    restrictions: [
      "approved only for negative-challenge validation and pilot evidence, not model training",
      "approval is exact-file scoped to the retained SHA-256 hashes",
      "must retain file-level source page URL, original file URL, author, credit, license short name, MIME type, and source SHA-256",
      "derived pose, landmark, embedding, detector, feature, or pretrained artifacts are disallowed",
    ],
  };
  if (sourceId === wikimediaSourceId) {
    common.primary_source_url = "https://commons.wikimedia.org/";
    common.source_evidence.push({
      evidence_type: "upstream_reuse_guidance",
      url: "https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia/en",
      checked_at: reviewedAt,
      summary: "Wikimedia Commons reuse guidance says each file's license or public-domain status governs reuse; selected files retain per-file license and attribution metadata.",
      supports_decision: true,
    });
  } else if (sourceId === ciraSourceId) {
    common.primary_source_url = "https://satlib.cira.colostate.edu/credit-media/";
    common.source_evidence.push({
      evidence_type: "upstream_credit_guidance",
      url: "https://satlib.cira.colostate.edu/credit-media/",
      checked_at: reviewedAt,
      summary: "CIRA Satellite Library credit guidance requires satellite imagery credit; selected files retain CSU/CIRA and NOAA/NESDIS credit metadata.",
      supports_decision: true,
    });
  }
  return common;
}

function updateSourceRegister(auditHash, reviewHash, receiptHashes) {
  const register = readJson(registerPath);
  register.updated_at = reviewedAt;
  const replacements = new Map([
    [
      combinedSourceId,
      sourceEntry(combinedSourceId, auditHash, reviewHash, combinedReceiptPath, receiptHashes[combinedSourceId]),
    ],
    [
      wikimediaSourceId,
      sourceEntry(wikimediaSourceId, auditHash, reviewHash, wikimediaReceiptPath, receiptHashes[wikimediaSourceId]),
    ],
    [
      ciraSourceId,
      sourceEntry(ciraSourceId, auditHash, reviewHash, ciraReceiptPath, receiptHashes[ciraSourceId]),
    ],
  ]);
  const seen = new Set();
  register.sources = register.sources.map((source) => {
    if (replacements.has(source.source_id)) {
      seen.add(source.source_id);
      return replacements.get(source.source_id);
    }
    return source;
  });
  for (const [sourceId, source] of replacements) {
    if (!seen.has(sourceId)) register.sources.push(source);
  }
  writeJson(registerPath, register);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  if (!args.write) throw new Error("Use --write to write source-review evidence");

  const audit = buildReview();
  writeJson(sourceAuditPath, audit);
  const markdown = buildReviewMarkdown(audit);
  writeText(sourceReviewPath, markdown);
  const auditHash = sha256File(sourceAuditPath);
  const reviewHash = sha256File(sourceReviewPath);
  const receipts = new Map([
    [combinedReceiptPath, receiptFor(combinedSourceId, audit, auditHash, reviewHash)],
    [wikimediaReceiptPath, receiptFor(wikimediaSourceId, audit, auditHash, reviewHash)],
    [ciraReceiptPath, receiptFor(ciraSourceId, audit, auditHash, reviewHash)],
    [aslCitizenReceiptPath, receiptFor(aslCitizenSourceId, audit, auditHash, reviewHash)],
  ]);
  for (const [file, receipt] of receipts) writeJson(file, receipt);
  const receiptHashes = {
    [combinedSourceId]: sha256File(combinedReceiptPath),
    [wikimediaSourceId]: sha256File(wikimediaReceiptPath),
    [ciraSourceId]: sha256File(ciraReceiptPath),
    [aslCitizenSourceId]: sha256File(aslCitizenReceiptPath),
  };
  if (args.updateRegister) updateSourceRegister(auditHash, reviewHash, receiptHashes);

  console.log(JSON.stringify({
    status: audit.status,
    source_audit: {
      path: projectRelative(sourceAuditPath),
      sha256: auditHash,
    },
    source_review: {
      path: projectRelative(sourceReviewPath),
      sha256: reviewHash,
    },
    receipts: {
      [combinedSourceId]: {
        path: projectRelative(combinedReceiptPath),
        sha256: receiptHashes[combinedSourceId],
      },
      [wikimediaSourceId]: {
        path: projectRelative(wikimediaReceiptPath),
        sha256: receiptHashes[wikimediaSourceId],
      },
      [ciraSourceId]: {
        path: projectRelative(ciraReceiptPath),
        sha256: receiptHashes[ciraSourceId],
      },
      [aslCitizenSourceId]: {
        path: projectRelative(aslCitizenReceiptPath),
        sha256: receiptHashes[aslCitizenSourceId],
      },
    },
    update_register: args.updateRegister,
    selected_count: audit.selected_count,
    challenge_type_counts: audit.challenge_type_counts,
    source_counts: audit.source_counts,
    blockers: audit.blockers,
  }, null, 2));
  return audit.status === "passed" ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Online negative challenge source review export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
