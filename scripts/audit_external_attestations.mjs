import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  validateVocabularyReviewerReceiptFile,
} from "./vocabulary_review_utils.mjs";

const root = path.resolve(import.meta.dirname, "..");
const defaultEvidencePath = path.join(root, "docs", "review", "final-external-attestations.json");
const consentFormRelativePath = "docs/privacy/dataset-consent-form.md";
const consentVersion = "asl-pilot-dataset-consent-v1";
const minClipsPerLabelPerSplit = 5;
const captureConditionSchemaVersion = "asl-pilot-capture-conditions/v1";
const signedAttestationReceiptSchemaVersion = "asl-pilot-signed-attestation-receipt/v1";
const signedAttestationSignatureAlgorithm = "ed25519";
const signedAttestationReceiptFields = new Set([
  "schema_version",
  "status",
  "attestation_id",
  "attestation_snapshot",
  "evidence_digest",
  "signed_at",
  "signed_by",
  "reviewed_evidence_files",
  "signature_evidence",
]);
const signedEvidenceFileFields = new Set(["path", "sha256", "purpose", "signed_at"]);
const evidenceFileFields = new Set(["path", "sha256", "purpose"]);

const requiredAttestations = [
  "vocabulary_deaf_educator_review",
  "dataset_consent_and_signer_identity",
  "signer_disjoint_split",
  "negative_challenge_review",
  "privacy_static_http_smoke",
  "browser_onnx_smoke",
  "model_training_provenance",
];
const requiredEvidenceByAttestation = {
  vocabulary_deaf_educator_review: [
    "docs/review/final-vocabulary-review.json",
    "data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json",
  ],
  dataset_consent_and_signer_identity: [
    "docs/privacy/dataset-consent-form.md",
    "data/asl-pilot-store.json",
    "docs/review/final-clip-review.json",
  ],
  signer_disjoint_split: [
    "docs/validation/final-manifest-audit.json",
    "data/manifests/train.json",
    "data/manifests/validation.json",
    "data/manifests/test.json",
  ],
  negative_challenge_review: [
    "docs/validation/final-manifest-audit.json",
    "docs/review/final-negative-challenge-review.json",
    "data/manifests/negative-challenge.json",
    "artifacts/rawframe-model/validation-report.json",
  ],
  privacy_static_http_smoke: [
    "docs/privacy/video-handling.md",
    "docs/privacy/final-privacy-smoke.json",
  ],
  browser_onnx_smoke: [
    "web/public/model/model-card.json",
    "web/public/model/asl-pilot-rawframe-v0-export-provenance.json",
    "docs/validation/final-browser-onnx-smoke.json",
    "docs/validation/final-browser-compatibility.json",
  ],
  model_training_provenance: [
    "artifacts/rawframe-model/calibrated-provenance.json",
    "artifacts/rawframe-model/validation-report.json",
    "web/public/model/asl-pilot-rawframe-v0-export-provenance.json",
    "docs/validation/final-browser-onnx-smoke.json",
  ],
};

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

function parseArgs(argv) {
  const args = { prerequisiteStatus: false, allowNoncanonical: false };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--prerequisite-status" || item === "--prereq-status") {
      args.prerequisiteStatus = true;
      continue;
    }
    if (item === "--allow-noncanonical") {
      args.allowNoncanonical = true;
      continue;
    }
    if (item === "--evidence") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --evidence");
      args.evidence = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function hasCaptureConditionEvidence(clip, kind) {
  const evidence = clip?.capture?.capture_condition_evidence;
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) return false;
  if (evidence.schemaVersion !== captureConditionSchemaVersion || evidence.operatorAttestation !== true) return false;
  if (typeof evidence.operatorAttestedAt !== "string" || Number.isNaN(Date.parse(evidence.operatorAttestedAt))) return false;
  if (kind === "vocabulary") {
    return (
      evidence.captureEnvironment === "controlled_vocabulary" &&
      evidence.frontLightingConfirmed === true &&
      evidence.upperTorsoAndHandsVisibleConfirmed === true &&
      evidence.cameraDistanceWithinPilotRangeConfirmed === true &&
      evidence.isolatedPromptSignConfirmed === true &&
      evidence.challengeType === null &&
      evidence.emptyCameraConfirmed === false &&
      evidence.noHandsVisibleConfirmed === false &&
      evidence.lowLightConfirmed === false &&
      evidence.offCenterConfirmed === false &&
      evidence.hardNegativeConditionConfirmed !== true &&
      evidence.expectedRejectOutcomeConfirmed === false
    );
  }
  const extendedHardNegativeTypes = [
    "idle_hands",
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
  ];
  const fieldByType = {
    empty_camera: "emptyCameraConfirmed",
    no_hands_visible: "noHandsVisibleConfirmed",
    low_light: "lowLightConfirmed",
    off_center: "offCenterConfirmed",
  };
  const field = fieldByType[clip.challenge_type];
  const isExtendedHardNegative = extendedHardNegativeTypes.includes(clip.challenge_type);
  return Boolean(
    (field || isExtendedHardNegative) &&
    evidence.captureEnvironment === "negative_challenge" &&
    evidence.challengeType === clip.challenge_type &&
    evidence.expectedRejectOutcomeConfirmed === true &&
    evidence.frontLightingConfirmed === false &&
    evidence.upperTorsoAndHandsVisibleConfirmed === false &&
    evidence.cameraDistanceWithinPilotRangeConfirmed === false &&
    evidence.isolatedPromptSignConfirmed === false &&
    (field
      ? evidence.hardNegativeConditionConfirmed !== true &&
        Object.entries(fieldByType).every(([type, key]) => evidence[key] === (type === clip.challenge_type))
      : evidence.hardNegativeConditionConfirmed === true &&
        Object.values(fieldByType).every((key) => evidence[key] === false))
  );
}

function usage() {
  console.log(`Usage:
  node scripts/audit_external_attestations.mjs [--prerequisite-status] [--evidence docs/review/final-external-attestations.json] [--allow-noncanonical]

Fails until final human/external evidence is present for facts that automation
cannot prove by itself: Deaf educator review, consent legitimacy, signer
identity/split separation, privacy browser smoke, and model provenance.
With --prerequisite-status, reports the missing/invalid evidence files needed
before the final human signatures can be collected.
Use --allow-noncanonical only for negative fixtures or nonfinal local debugging.
`);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function sha256Bytes(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  if (value === undefined) return "null";
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function canonicalSignedReceiptPayload(receipt) {
  const reviewedEvidenceFiles = Array.isArray(receipt.reviewed_evidence_files)
    ? receipt.reviewed_evidence_files
      .map((item) => ({
        path: item?.path,
        sha256: item?.sha256,
      }))
      .sort((left, right) => String(left.path ?? "").localeCompare(String(right.path ?? "")))
    : [];
  const payload = {
    schema_version: receipt.schema_version,
    status: receipt.status,
    attestation_id: receipt.attestation_id,
    attestation_snapshot: normalizedAttestationSnapshot(receipt.attestation_snapshot),
    evidence_digest: receipt.evidence_digest,
    signed_at: receipt.signed_at,
    signed_by: receipt.signed_by,
    reviewed_evidence_files: reviewedEvidenceFiles,
  };
  return stableJson(payload);
}

function normalizedAttestationSnapshot(attestation) {
  if (!attestation || typeof attestation !== "object" || Array.isArray(attestation)) return null;
  const evidenceFiles = Array.isArray(attestation.evidence_files)
    ? attestation.evidence_files
      .map((item) => ({
        path: item?.path,
        sha256: item?.sha256,
        purpose: item?.purpose,
      }))
      .sort((left, right) => String(left.path ?? "").localeCompare(String(right.path ?? "")))
    : [];
  const attestedBy = attestation.attested_by && typeof attestation.attested_by === "object" && !Array.isArray(attestation.attested_by)
    ? {
        name: attestation.attested_by.name,
        role: attestation.attested_by.role,
        affiliation_or_context: attestation.attested_by.affiliation_or_context,
        credential_or_authority: attestation.attested_by.credential_or_authority,
        contact_or_signed_evidence: attestation.attested_by.contact_or_signed_evidence,
        is_project_operator: attestation.attested_by.is_project_operator,
      }
    : null;
  return {
    id: attestation.id,
    statement: attestation.statement,
    attested_at: attestation.attested_at,
    attested_by: attestedBy,
    evidence_digest: attestation.evidence_digest,
    evidence_files: evidenceFiles,
  };
}

function isIsoDate(value) {
  return typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function validateConsentFormReference(reference, context) {
  const findings = [];
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    findings.push(`${context} must include consent_form evidence`);
    return findings;
  }
  if (reference.path !== consentFormRelativePath) {
    findings.push(`${context}.path must be ${consentFormRelativePath}`);
  }
  if (reference.consent_version !== consentVersion) {
    findings.push(`${context}.consent_version must be ${consentVersion}`);
  }
  const consentFormPath = resolveProjectPath(consentFormRelativePath, `${context}.path`);
  if (!fs.existsSync(consentFormPath)) {
    findings.push(`${context}.path does not exist: ${consentFormRelativePath}`);
  } else if (reference.sha256 !== sha256File(consentFormPath)) {
    findings.push(`${context}.sha256 must match ${consentFormRelativePath}`);
  }
  return findings;
}

function validateActor(actor, context, attestationId) {
  const findings = [];
  if (!actor || typeof actor !== "object" || Array.isArray(actor)) {
    return [`${context}.attested_by must be an object`];
  }
  for (const key of [
    "name",
    "role",
    "affiliation_or_context",
    "credential_or_authority",
    "contact_or_signed_evidence",
  ]) {
    if (typeof actor[key] !== "string" || actor[key].trim().length === 0 || /\b(replace|placeholder|todo|tbd|yyyy)\b/i.test(actor[key])) {
      findings.push(`${context}.attested_by.${key} must be a non-placeholder string`);
    }
  }
  if (actor.is_project_operator !== false) {
    findings.push(`${context}.attested_by.is_project_operator must be false`);
  }
  if (attestationId === "vocabulary_deaf_educator_review") {
    const role = String(actor.role ?? "").toLowerCase();
    const credential = String(actor.credential_or_authority ?? "").toLowerCase();
    const allowed = [
      "deaf educator",
      "asl instructor",
      "qualified asl instructor",
      "certified asl instructor",
      "asl teacher",
    ];
    if (!allowed.some((item) => role.includes(item) || credential.includes(item))) {
      findings.push(
        `${context}.attested_by.role or credential_or_authority must identify a Deaf educator or qualified ASL instructor`,
      );
    }
  }
  return findings;
}

function validateStructuredEvidence(file, relativePath, context) {
  const findings = [];
  if (!relativePath.endsWith(".json")) return findings;
  let data;
  try {
    data = readJson(file);
  } catch (error) {
    return [`${context} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`];
  }
  if (relativePath === "docs/privacy/final-privacy-smoke.json") {
    if (data.schema_version !== "asl-pilot-final-privacy-smoke/v1") {
      findings.push(`${context} privacy smoke schema_version is invalid`);
    }
    if (data.status !== "passed") findings.push(`${context} privacy smoke status must be passed`);
    const normal = data.normal_practice_findings;
    for (const key of [
      "raw_video_uploads_observed",
      "raw_frame_uploads_observed",
      "image_or_blob_payloads_observed",
      "analytics_or_session_replay_observed",
    ]) {
      if (normal?.[key] !== false) findings.push(`${context} privacy smoke ${key} must be false`);
    }
    if (data.evidence?.live_http?.normal_practice_raw_payload_rejected !== true) {
      findings.push(`${context} privacy smoke must prove the live normal practice attempt route rejects raw camera payloads`);
    }
  }
  if (relativePath === "docs/review/final-vocabulary-review.json") {
    if (data.schema_version !== "asl-pilot-vocabulary-review-evidence/v1") {
      findings.push(`${context} vocabulary review schema_version is invalid`);
    }
    if (data.status !== "reviewed") findings.push(`${context} vocabulary review status must be reviewed`);
  }
  if (relativePath === "data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json") {
    const packetPath = resolveProjectPath("data/vocabulary-review/asl-pilot-vocabulary-review.json", "vocabulary review packet");
    if (!fs.existsSync(packetPath)) {
      findings.push(`${context} requires returned packet data/vocabulary-review/asl-pilot-vocabulary-review.json`);
    } else {
      try {
        const packet = readJson(packetPath);
        findings.push(...validateVocabularyReviewerReceiptFile(file, packet, packetPath).findings);
      } catch (error) {
        findings.push(`${context} returned packet is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  if (relativePath === "docs/validation/final-manifest-audit.json") {
    if (data.schema_version !== "asl-pilot-final-manifest-audit/v1") {
      findings.push(`${context} final manifest audit schema_version is invalid`);
    }
    if (data.status !== "passed") findings.push(`${context} final manifest audit status must be passed`);
    if (data.signer_disjoint !== true) findings.push(`${context} final manifest audit signer_disjoint must be true`);
    if (data.label_sets_match !== true) findings.push(`${context} final manifest audit label_sets_match must be true`);
    const expectedManifestPaths = [
      "data/manifests/train.json",
      "data/manifests/validation.json",
      "data/manifests/test.json",
    ];
    const manifestRecords = Array.isArray(data.manifests) ? data.manifests : [];
    for (const expectedPath of expectedManifestPaths) {
      const record = manifestRecords.find((item) => item?.path === expectedPath);
      if (!record) {
        findings.push(`${context} final manifest audit must include ${expectedPath}`);
        continue;
      }
      const manifestPath = resolveProjectPath(expectedPath, "final manifest audit manifest path");
      if (!fs.existsSync(manifestPath)) {
        findings.push(`${context} referenced manifest is missing: ${expectedPath}`);
      } else if (record.sha256 !== sha256File(manifestPath)) {
        findings.push(`${context} final manifest audit hash is stale for ${expectedPath}`);
      }
    }
    const challengeRecord = data.negative_challenge;
    const challengePath = "data/manifests/negative-challenge.json";
    if (challengeRecord?.path !== challengePath) {
      findings.push(`${context} final manifest audit must include ${challengePath}`);
    } else {
      const manifestPath = resolveProjectPath(challengePath, "final manifest audit negative challenge path");
      if (!fs.existsSync(manifestPath)) {
        findings.push(`${context} referenced manifest is missing: ${challengePath}`);
      } else if (challengeRecord.sha256 !== sha256File(manifestPath)) {
        findings.push(`${context} final manifest audit hash is stale for ${challengePath}`);
      }
    }
  }
  if (relativePath === "docs/review/final-clip-review.json") {
    if (data.schema_version !== "asl-pilot-clip-review-evidence/v1") {
      findings.push(`${context} clip review schema_version is invalid`);
    }
    if (data.status !== "reviewed") findings.push(`${context} clip review status must be reviewed`);
  }
  if (relativePath === "docs/review/final-negative-challenge-review.json") {
    if (data.schema_version !== "asl-pilot-negative-challenge-review-evidence/v1") {
      findings.push(`${context} negative challenge review schema_version is invalid`);
    }
    if (data.status !== "reviewed") findings.push(`${context} negative challenge review status must be reviewed`);
  }
  if (relativePath.startsWith("data/manifests/")) {
    if (relativePath === "data/manifests/negative-challenge.json") {
      if (data.schema_version !== "asl-pilot-negative-challenge-manifest/v1") {
        findings.push(`${context} negative challenge schema_version is invalid`);
      }
      if (data.split !== "negative_challenge") {
        findings.push(`${context} negative challenge split is invalid`);
      }
	      if (!data.source_register || typeof data.source_register !== "object") {
	        findings.push(`${context} negative challenge must include source_register evidence`);
	      }
	      if (!data.collection_plan || typeof data.collection_plan !== "object") {
	        findings.push(`${context} negative challenge must include collection_plan evidence`);
	      }
	      findings.push(...validateConsentFormReference(data.consent_form, `${context} negative challenge consent_form`));
      const clips = Array.isArray(data.clips) ? data.clips : [];
      const counts = new Map();
      for (const clip of clips) {
        if (clip?.expected_outcome !== "reject") {
          findings.push(`${context} negative challenge clips must have expected_outcome reject`);
          break;
        }
	        if (clip?.allowed_for_validation !== true) {
	          findings.push(`${context} negative challenge clips must be allowed_for_validation`);
	          break;
	        }
	        if (!clip?.collection_plan_assignment || typeof clip.collection_plan_assignment !== "object") {
	          findings.push(`${context} negative challenge clips must include collection_plan_assignment`);
	          break;
	        }
	        if (!hasCaptureConditionEvidence(clip, "negative_challenge")) {
	          findings.push(`${context} negative challenge clips must include challenge capture-condition evidence`);
	          break;
	        }
	        counts.set(clip.challenge_type, (counts.get(clip.challenge_type) ?? 0) + 1);
      }
      for (const requiredType of ["empty_camera", "no_hands_visible", "low_light", "off_center"]) {
        if ((counts.get(requiredType) ?? 0) < 5) {
          findings.push(`${context} negative challenge must include at least 5 ${requiredType} clips`);
        }
      }
    } else if (data.schema_version !== "asl-pilot-rawframe-manifest/v1") {
      findings.push(`${context} manifest schema_version is invalid`);
    } else if (!["train", "validation", "test"].includes(data.split)) {
      findings.push(`${context} manifest split is invalid`);
	    } else if (!data.source_register || typeof data.source_register !== "object") {
	      findings.push(`${context} manifest must include source_register evidence`);
	    } else if (!data.collection_plan || typeof data.collection_plan !== "object") {
	      findings.push(`${context} manifest must include collection_plan evidence`);
	    } else {
      findings.push(...validateConsentFormReference(data.consent_form, `${context} manifest consent_form`));
      const labels = Array.isArray(data.labels) ? data.labels : [];
      const counts = new Map(labels.map((label) => [label.label_id, 0]));
	      for (const clip of data.clips ?? []) {
	        if (!clip?.collection_plan_assignment || typeof clip.collection_plan_assignment !== "object") {
	          findings.push(`${context} manifest clips must include collection_plan_assignment`);
	          break;
	        }
	        if (!hasCaptureConditionEvidence(clip, "vocabulary")) {
	          findings.push(`${context} manifest clips must include controlled capture-condition evidence`);
	          break;
	        }
	        if (counts.has(clip.label_id)) counts.set(clip.label_id, counts.get(clip.label_id) + 1);
      }
      const underfilled = [...counts.entries()]
        .filter(([, count]) => count < minClipsPerLabelPerSplit)
        .map(([labelId]) => labelId);
      if (underfilled.length > 0) {
        findings.push(`${context} manifest must include at least ${minClipsPerLabelPerSplit} clips per label`);
      }
    }
  }
  if (relativePath === "artifacts/rawframe-model/validation-report.json") {
    if (data.status !== "candidate_final_validation_passed") {
      findings.push(`${context} validation report status must be candidate_final_validation_passed`);
    }
    if (data.pass_status?.negative_challenge_false_pass_rate !== true) {
      findings.push(`${context} validation report must pass negative challenge false-pass gate`);
    }
    const negativeFalsePass = data.negative_challenge?.metrics?.false_pass_rate;
    if (typeof negativeFalsePass !== "number" || negativeFalsePass >= 0.05) {
      findings.push(`${context} validation report negative challenge false-pass rate must be below 0.05`);
    }
  }
  if (relativePath === "artifacts/rawframe-model/calibrated-provenance.json") {
    if (data.initialization !== "random") findings.push(`${context} calibrated provenance initialization must be random`);
    if (data.threshold_policy?.type !== "fail_closed") {
      findings.push(`${context} calibrated provenance threshold_policy.type must be fail_closed`);
    }
  }
  if (relativePath === "web/public/model/asl-pilot-rawframe-v0-export-provenance.json") {
    if (data.status !== "exported") findings.push(`${context} ONNX export status must be exported`);
    if (data.finality !== "candidate_final_artifact") {
      findings.push(`${context} ONNX export finality must be candidate_final_artifact`);
    }
  }
  if (relativePath === "web/public/model/model-card.json") {
    if (data.status !== "trained") findings.push(`${context} model-card status must be trained`);
    if (!data.browser_artifact || typeof data.browser_artifact !== "object") {
      findings.push(`${context} model-card must include browser_artifact`);
    }
  }
  if (relativePath === "docs/validation/final-browser-onnx-smoke.json") {
    if (data.schema_version !== "asl-pilot-final-browser-onnx-smoke/v1") {
      findings.push(`${context} browser ONNX smoke schema_version is invalid`);
    }
    if (data.status !== "passed") findings.push(`${context} browser ONNX smoke status must be passed`);
    if (data.inference?.ran_browser_inference !== true) {
      findings.push(`${context} browser ONNX smoke must run browser inference`);
    }
    if (data.runtime?.execution_provider !== "wasm") {
      findings.push(`${context} browser ONNX smoke runtime.execution_provider must be wasm`);
    }
    findings.push(...runDeepEvidenceAudit(
      "node",
      ["scripts/audit_final_browser_onnx_smoke.mjs", "--report", relativePath],
      `${context} final browser ONNX smoke deep audit`,
    ));
  }
  if (relativePath === "docs/validation/final-browser-compatibility.json") {
    if (data.schema_version !== "asl-pilot-final-browser-compatibility/v1") {
      findings.push(`${context} browser compatibility schema_version is invalid`);
    }
    if (data.status !== "passed") findings.push(`${context} browser compatibility status must be passed`);
    if (!data.observations_source || typeof data.observations_source !== "object") {
      findings.push(`${context} browser compatibility must include observations_source`);
    }
    findings.push(...runDeepEvidenceAudit(
      "node",
      ["scripts/audit_final_browser_compatibility.mjs", "--report", relativePath],
      `${context} final browser compatibility deep audit`,
    ));
    const requiredBrowsers = new Set(["chrome_desktop", "edge_desktop", "safari_desktop", "firefox_desktop"]);
    const rows = Array.isArray(data.browsers) ? data.browsers : [];
    for (const row of rows) {
      if (requiredBrowsers.has(row?.browser_id)) requiredBrowsers.delete(row.browser_id);
      if (row?.wasm_inference_checked !== true) {
        findings.push(`${context} browser compatibility rows must check WASM inference`);
        break;
      }
      if (row?.normal_practice_raw_media_uploads_observed !== false) {
        findings.push(`${context} browser compatibility rows must not observe normal-practice raw media uploads`);
        break;
      }
    }
    for (const missing of requiredBrowsers) {
      findings.push(`${context} browser compatibility missing browser row: ${missing}`);
    }
  }
  if (relativePath === "data/asl-pilot-store.json") {
    if (!Array.isArray(data.datasetSigners)) findings.push(`${context} store datasetSigners must be an array`);
    if (!Array.isArray(data.consentRecords)) findings.push(`${context} store consentRecords must be an array`);
    if (!Array.isArray(data.datasetClips)) findings.push(`${context} store datasetClips must be an array`);
    const identityHashes = new Map();
    for (const [index, signer] of (data.datasetSigners ?? []).entries()) {
      if (signer.identityAttestation !== "signed_identity_verified") {
        findings.push(`${context} datasetSigners[${index}].identityAttestation must be signed_identity_verified`);
      }
      if (!isSha256(signer.signerIdentityHash)) {
        findings.push(`${context} datasetSigners[${index}].signerIdentityHash must be a lowercase SHA-256 digest`);
      } else {
        const aliases = identityHashes.get(signer.signerIdentityHash) ?? [];
        aliases.push(signer.signerAlias);
        identityHashes.set(signer.signerIdentityHash, aliases);
      }
      if (!signer.signedConsentEvidence || typeof signer.signedConsentEvidence !== "object") {
        findings.push(`${context} datasetSigners[${index}].signedConsentEvidence is required`);
      }
    }
    for (const [identityHash, aliases] of identityHashes.entries()) {
      if (new Set(aliases).size > 1) {
        findings.push(`${context} signer identity hash ${identityHash} appears under multiple aliases`);
      }
    }
    for (const [index, consent] of (data.consentRecords ?? []).entries()) {
      if (!isSha256(consent.signerIdentityHash)) {
        findings.push(`${context} consentRecords[${index}].signerIdentityHash must be a lowercase SHA-256 digest`);
      }
      if (!consent.signedConsentEvidence || typeof consent.signedConsentEvidence !== "object") {
        findings.push(`${context} consentRecords[${index}].signedConsentEvidence is required`);
      }
    }
  }
  return findings;
}

function runDeepEvidenceAudit(command, args, context) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status === 0) return [];
  const text = [result.stderr, result.stdout].filter(Boolean).join("\n").trim();
  return [`${context} failed: ${text || `${command} ${args.join(" ")} exited ${result.status}`}`];
}

function evidenceDigest(evidenceFiles) {
  const payload = evidenceFiles
    .map((item) => ({ path: item.path, sha256: item.sha256 }))
    .sort((left, right) => left.path.localeCompare(right.path));
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function evidencePrerequisiteStatus() {
  return requiredAttestations.map((attestationId) => {
    const requiredPaths = requiredEvidenceByAttestation[attestationId] ?? [];
    const evidenceFiles = requiredPaths.map((relativePath) => {
      const file = resolveProjectPath(relativePath, `required evidence ${attestationId}`);
      const exists = fs.existsSync(file);
      const blockers = exists
        ? validateStructuredEvidence(file, relativePath, `${attestationId} required evidence ${relativePath}`)
        : [`missing required evidence: ${relativePath}`];
      return {
        path: relativePath,
        exists,
        sha256: exists ? sha256File(file) : null,
        status: exists && blockers.length === 0
          ? "present_valid"
          : exists
            ? "present_invalid"
            : "missing",
        blockers,
      };
    });
    const missing = evidenceFiles.filter((item) => item.status === "missing").map((item) => item.path);
    const invalid = evidenceFiles.filter((item) => item.status === "present_invalid").map((item) => item.path);
    return {
      attestation_id: attestationId,
      status: missing.length === 0 && invalid.length === 0
        ? "ready_for_human_attestation"
        : "blocked_missing_or_invalid_evidence",
      missing_count: missing.length,
      invalid_count: invalid.length,
      missing,
      invalid,
      evidence_files: evidenceFiles,
    };
  });
}

function prerequisiteBlockers(statuses) {
  return statuses
    .filter((item) => item.status !== "ready_for_human_attestation")
    .map((item) => {
      const parts = [];
      if (item.missing.length > 0) parts.push(`missing ${item.missing.join(", ")}`);
      if (item.invalid.length > 0) parts.push(`invalid ${item.invalid.join(", ")}`);
      return `${item.attestation_id}: ${parts.join("; ")}`;
    });
}

function validateReceiptSigner(signer, context) {
  const findings = [];
  if (!signer || typeof signer !== "object" || Array.isArray(signer)) {
    findings.push(`${context}.signed_by must be an object`);
    return findings;
  }
  for (const key of ["name", "role", "affiliation_or_context", "contact_or_signature_reference"]) {
    const value = signer[key];
    if (typeof value !== "string" || value.trim().length === 0 || /\b(replace|placeholder|todo|tbd|yyyy)\b/i.test(value)) {
      findings.push(`${context}.signed_by.${key} must be a non-placeholder string`);
    }
  }
  if (signer.is_project_operator !== false) {
    findings.push(`${context}.signed_by.is_project_operator must be false`);
  }
  return findings;
}

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateReceiptSignerMatchesAttester(signer, attestedBy, context) {
  const findings = [];
  if (!signer || typeof signer !== "object" || !attestedBy || typeof attestedBy !== "object") return findings;
  const comparisons = [
    ["name", "name"],
    ["role", "role"],
    ["affiliation_or_context", "affiliation_or_context"],
    ["contact_or_signature_reference", "contact_or_signed_evidence"],
  ];
  for (const [signerKey, attesterKey] of comparisons) {
    if (trimString(signer[signerKey]) !== trimString(attestedBy[attesterKey])) {
      findings.push(`${context}.signed_by.${signerKey} must match attested_by.${attesterKey}`);
    }
  }
  return findings;
}

function validateReceiptSignature(signed, context) {
  const findings = [];
  const signature = signed.signature_evidence;
  if (!signature || typeof signature !== "object" || Array.isArray(signature)) {
    findings.push(`${context}.signature_evidence must be an object`);
    return findings;
  }
  if (signature.algorithm !== signedAttestationSignatureAlgorithm) {
    findings.push(`${context}.signature_evidence.algorithm must be ${signedAttestationSignatureAlgorithm}`);
  }
  const publicKeyPem = typeof signature.public_key_pem === "string" ? signature.public_key_pem.trim() : "";
  let publicKey = null;
  if (!publicKeyPem || !publicKeyPem.includes("BEGIN PUBLIC KEY")) {
    findings.push(`${context}.signature_evidence.public_key_pem must be a PEM public key`);
  } else {
    try {
      publicKey = crypto.createPublicKey(publicKeyPem);
    } catch (error) {
      findings.push(`${context}.signature_evidence.public_key_pem is invalid: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  const signatureBase64 = typeof signature.signature_base64 === "string" ? signature.signature_base64.trim() : "";
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(signatureBase64)) {
    findings.push(`${context}.signature_evidence.signature_base64 must be base64`);
  }
  const payload = canonicalSignedReceiptPayload(signed);
  const payloadDigest = sha256Text(payload);
  if (signature.signed_payload_sha256 !== payloadDigest) {
    findings.push(`${context}.signature_evidence.signed_payload_sha256 must match the canonical signed receipt payload`);
  }
  if (publicKey) {
    const keyFingerprint = sha256Bytes(publicKey.export({ type: "spki", format: "der" }));
    if (signature.signer_key_fingerprint_sha256 !== keyFingerprint) {
      findings.push(`${context}.signature_evidence.signer_key_fingerprint_sha256 must match public_key_pem`);
    }
  }
  if (
    publicKey
    && signature.algorithm === signedAttestationSignatureAlgorithm
    && /^[A-Za-z0-9+/]+={0,2}$/.test(signatureBase64)
  ) {
    try {
      const verified = crypto.verify(
        null,
        Buffer.from(payload, "utf8"),
        publicKey,
        Buffer.from(signatureBase64, "base64"),
      );
      if (!verified) {
        findings.push(`${context}.signature_evidence signature verification failed`);
      }
    } catch (error) {
      findings.push(`${context}.signature_evidence could not be verified: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return findings;
}

function validateSignedEvidenceFiles(files, context, attestation, expectedEvidenceDigest) {
  const findings = [];
  const attestationId = attestation?.id;
  const attestedBy = attestation?.attested_by;
  if (!Array.isArray(files) || files.length === 0) {
    findings.push(`${context}.signed_evidence_files must include at least one hash-pinned signed receipt or reviewer packet`);
    return findings;
  }
  const seen = new Set();
  let jsonReceiptCount = 0;
  for (const [index, evidence] of files.entries()) {
    const evidenceContext = `${context}.signed_evidence_files[${index}]`;
    if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
      findings.push(`${evidenceContext} must be an object`);
      continue;
    }
    for (const key of Object.keys(evidence)) {
      if (!signedEvidenceFileFields.has(key)) {
        findings.push(`${evidenceContext} contains unexpected unsigned field: ${key}`);
      }
    }
    if (typeof evidence.path !== "string" || evidence.path.trim().length === 0) {
      findings.push(`${evidenceContext}.path must be a non-empty string`);
      continue;
    }
    if (typeof evidence.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(evidence.sha256)) {
      findings.push(`${evidenceContext}.sha256 must be a lowercase SHA-256 digest`);
    }
    if (typeof evidence.purpose !== "string" || evidence.purpose.trim().length < 20) {
      findings.push(`${evidenceContext}.purpose must describe the signed evidence`);
    }
    if (!isIsoDate(evidence.signed_at)) {
      findings.push(`${evidenceContext}.signed_at must be an ISO-compatible date string`);
    }
    const resolved = resolveProjectPath(evidence.path, `${evidenceContext}.path`);
    if (!fs.existsSync(resolved)) {
      findings.push(`${evidenceContext}.path missing file: ${projectRelative(resolved)}`);
      continue;
    }
    const relativePath = projectRelative(resolved);
    if (seen.has(relativePath)) {
      findings.push(`${evidenceContext}.path duplicates an earlier signed evidence path: ${relativePath}`);
    }
    seen.add(relativePath);
    const actualSha256 = sha256File(resolved);
    if (evidence.sha256 !== actualSha256) {
      findings.push(`${evidenceContext}.sha256 mismatch for ${evidence.path}; expected ${evidence.sha256}, got ${actualSha256}`);
    }
    if (relativePath.endsWith(".json")) {
      jsonReceiptCount += 1;
      try {
        const signed = readJson(resolved);
        for (const key of Object.keys(signed)) {
          if (!signedAttestationReceiptFields.has(key)) {
            findings.push(`${evidenceContext} contains unexpected unsigned field: ${key}`);
          }
        }
        if (signed.schema_version !== signedAttestationReceiptSchemaVersion) {
          findings.push(`${evidenceContext} schema_version must be ${signedAttestationReceiptSchemaVersion}`);
        }
        if (signed.status !== "signed") {
          findings.push(`${evidenceContext} status must be signed`);
        }
        if (signed.attestation_id !== attestationId) {
          findings.push(`${evidenceContext} attestation_id must be ${attestationId}`);
        }
        if (signed.evidence_digest !== expectedEvidenceDigest) {
          findings.push(`${evidenceContext} evidence_digest must match the attestation evidence digest`);
        }
        if (!signed.attestation_snapshot || typeof signed.attestation_snapshot !== "object" || Array.isArray(signed.attestation_snapshot)) {
          findings.push(`${evidenceContext}.attestation_snapshot must bind the signed receipt to the full attestation row`);
        } else if (
          stableJson(normalizedAttestationSnapshot(signed.attestation_snapshot))
          !== stableJson(normalizedAttestationSnapshot(attestation))
        ) {
          findings.push(`${evidenceContext}.attestation_snapshot must match the current attestation statement, attester, timestamp, and evidence files`);
        }
        if (!isIsoDate(signed.signed_at)) {
          findings.push(`${evidenceContext} signed_at must be an ISO-compatible date string`);
        }
        findings.push(...validateReceiptSigner(signed.signed_by, evidenceContext));
        findings.push(...validateReceiptSignerMatchesAttester(signed.signed_by, attestedBy, evidenceContext));
        findings.push(...validateReceiptSignature(signed, evidenceContext));
        const reviewedEvidenceFiles = Array.isArray(signed.reviewed_evidence_files) ? signed.reviewed_evidence_files : [];
        const reviewedFilesAreWellFormed = reviewedEvidenceFiles.every((item) => (
          item
          && typeof item === "object"
          && !Array.isArray(item)
          && typeof item.path === "string"
          && isSha256(item.sha256)
        ));
        if (!reviewedFilesAreWellFormed) {
          findings.push(`${evidenceContext}.reviewed_evidence_files must include path and SHA-256 for every reviewed file`);
        }
        const reviewedDigest = reviewedFilesAreWellFormed ? evidenceDigest(reviewedEvidenceFiles) : null;
        if (reviewedEvidenceFiles.length === 0 || reviewedDigest !== expectedEvidenceDigest) {
          findings.push(`${evidenceContext}.reviewed_evidence_files must match the attested evidence files and digest`);
        }
      } catch (error) {
        findings.push(`${evidenceContext} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  if (jsonReceiptCount === 0) {
    findings.push(`${context}.signed_evidence_files must include at least one machine-readable JSON signed receipt`);
  }
  return findings;
}

function validateAttestation(attestation, index) {
  const findings = [];
  const context = `attestations[${index}]`;
  if (!attestation || typeof attestation !== "object" || Array.isArray(attestation)) {
    return [`${context} must be an object`];
  }
  if (!requiredAttestations.includes(attestation.id)) {
    findings.push(`${context}.id must be one of ${requiredAttestations.join(", ")}`);
  }
  if (attestation.status !== "attested") {
    findings.push(`${context}.status must be attested`);
  }
  if (typeof attestation.statement !== "string" || attestation.statement.trim().length < 40) {
    findings.push(`${context}.statement must explain the attested fact`);
  }
  if (!isIsoDate(attestation.attested_at)) {
    findings.push(`${context}.attested_at must be an ISO-compatible date string`);
  } else if (String(attestation.attested_at).includes("YYYY")) {
    findings.push(`${context}.attested_at must not be a placeholder`);
  }

  findings.push(...validateActor(attestation.attested_by, context, attestation.id));

  const evidenceFiles = attestation.evidence_files;
  let expectedEvidenceDigest = null;
  if (!Array.isArray(evidenceFiles) || evidenceFiles.length === 0) {
    findings.push(`${context}.evidence_files must list hash-pinned project evidence files`);
  } else {
    const seenPaths = new Set();
    for (const [evidenceIndex, evidence] of evidenceFiles.entries()) {
      const evidenceContext = `${context}.evidence_files[${evidenceIndex}]`;
      if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
        findings.push(`${evidenceContext} must be an object`);
        continue;
      }
      for (const key of Object.keys(evidence)) {
        if (!evidenceFileFields.has(key)) {
          findings.push(`${evidenceContext} contains unexpected field: ${key}`);
        }
      }
      if (typeof evidence.path !== "string" || evidence.path.trim().length === 0) {
        findings.push(`${evidenceContext}.path must be a non-empty string`);
        continue;
      }
      if (typeof evidence.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(evidence.sha256)) {
        findings.push(`${evidenceContext}.sha256 must be a lowercase SHA-256 digest`);
      }
      if (typeof evidence.purpose !== "string" || evidence.purpose.trim().length === 0) {
        findings.push(`${evidenceContext}.purpose must be a non-empty string`);
      }
      const resolved = resolveProjectPath(evidence.path, `${evidenceContext}.path`);
      if (!fs.existsSync(resolved)) {
        findings.push(`${evidenceContext}.path missing file: ${projectRelative(resolved)}`);
        continue;
      }
      const actualSha256 = sha256File(resolved);
      if (evidence.sha256 !== actualSha256) {
        findings.push(
          `${evidenceContext}.sha256 mismatch for ${evidence.path}; expected ${evidence.sha256}, got ${actualSha256}`,
        );
      }
      const relativePath = projectRelative(resolved);
      if (seenPaths.has(relativePath)) {
        findings.push(`${evidenceContext}.path duplicates an earlier evidence path: ${relativePath}`);
      }
      findings.push(...validateStructuredEvidence(resolved, relativePath, evidenceContext));
      seenPaths.add(relativePath);
    }
    for (const requiredPath of requiredEvidenceByAttestation[attestation.id] ?? []) {
      if (!seenPaths.has(requiredPath)) {
        findings.push(`${context}.evidence_files must include required path: ${requiredPath}`);
      }
    }
    expectedEvidenceDigest = evidenceDigest(evidenceFiles);
    if (attestation.evidence_digest !== expectedEvidenceDigest) {
      findings.push(`${context}.evidence_digest must equal SHA-256 digest over evidence_files paths and hashes`);
    }
  }
  if (expectedEvidenceDigest) {
    findings.push(...validateSignedEvidenceFiles(
      attestation.signed_evidence_files,
      context,
      attestation,
      expectedEvidenceDigest,
    ));
  }

  return findings;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }

  const evidencePath = args.evidence
    ? resolveProjectPath(args.evidence, "--evidence")
    : defaultEvidencePath;
  if (
    !args.prerequisiteStatus &&
    !args.allowNoncanonical &&
    projectRelative(evidencePath) !== projectRelative(defaultEvidencePath)
  ) {
    throw new Error(`Final external attestation audit must use ${projectRelative(defaultEvidencePath)}; pass --allow-noncanonical only for negative fixtures or nonfinal local debugging`);
  }
  const evidencePrerequisites = evidencePrerequisiteStatus();
  const prerequisiteFindings = prerequisiteBlockers(evidencePrerequisites);
  if (args.prerequisiteStatus) {
    const summary = {
      status: prerequisiteFindings.length === 0
        ? "ready_for_human_attestation"
        : "blocked_missing_or_invalid_evidence",
      checked_at: new Date().toISOString(),
      evidence: {
        path: projectRelative(evidencePath),
        exists: fs.existsSync(evidencePath),
      },
      required_attestations: requiredAttestations,
      evidence_prerequisites: evidencePrerequisites,
      blockers: prerequisiteFindings,
    };
    console.log(JSON.stringify(summary, null, 2));
    if (prerequisiteFindings.length > 0) {
      console.error("External attestation prerequisite status failed:");
      for (const blocker of prerequisiteFindings) console.error(`- ${blocker}`);
      return 1;
    }
    return 0;
  }
  const blockers = [];
  let evidence = null;
  if (!fs.existsSync(evidencePath)) {
    blockers.push(`External attestation evidence is missing: ${projectRelative(evidencePath)}`);
    blockers.push(...prerequisiteFindings);
  } else {
    evidence = readJson(evidencePath);
    if (evidence.schema_version !== "asl-pilot-external-attestations/v1") {
      blockers.push("External attestation schema_version is invalid");
    }
    if (evidence.status !== "verified") {
      blockers.push("External attestation status must be verified");
    }
    if (!isIsoDate(evidence.generated_at) || String(evidence.generated_at).includes("YYYY")) {
      blockers.push("External attestation generated_at must be a real ISO-compatible date string");
    }
    if (!Array.isArray(evidence.attestations)) {
      blockers.push("External attestation file must include attestations array");
    } else {
      const seen = new Set();
      evidence.attestations.forEach((attestation, index) => {
        blockers.push(...validateAttestation(attestation, index));
        if (attestation?.id) {
          if (seen.has(attestation.id)) {
            blockers.push(`Duplicate attestation id: ${attestation.id}`);
          }
          seen.add(attestation.id);
        }
      });
      for (const required of requiredAttestations) {
        if (!seen.has(required)) blockers.push(`Missing required attestation: ${required}`);
      }
    }
  }

  const summary = {
    status: blockers.length === 0 ? "verified" : "incomplete",
    checked_at: new Date().toISOString(),
    evidence: {
      path: projectRelative(evidencePath),
      exists: fs.existsSync(evidencePath),
    },
    required_attestations: requiredAttestations,
    evidence_prerequisites: evidencePrerequisites,
    blockers,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (blockers.length > 0) {
    console.error("External attestation audit failed:");
    for (const blocker of blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`External attestation audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
