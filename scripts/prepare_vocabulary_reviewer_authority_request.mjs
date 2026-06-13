import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  defaultReviewerAuthorityPath,
  projectRelative,
  root,
  sha256File,
  validateVocabularyReviewerPreReviewAuthorityFile,
  writeJson,
} from "./vocabulary_review_utils.mjs";

const defaultOutputPath = path.join(root, "output", "review-handoff", "reviewer-authority-request");
const authorityTemplatePath = path.join(root, "docs", "review", "vocabulary-reviewer-authority.template.json");
const authorityIntakeTemplatePath = path.join(root, "docs", "review", "vocabulary-reviewer-authority-intake.template.json");
const reviewProtocolPath = path.join(root, "docs", "review", "vocabulary-review-protocol.md");
const operatorHandoffPath = path.join(root, "docs", "review", "operator-handoff.md");
const requirementsMatrixPath = path.join(root, "docs", "source-materials", "requirements-matrix.md");
const stageAuthorityEvidenceScriptPath = path.join(root, "scripts", "stage_vocabulary_reviewer_authority_evidence.mjs");
const prepareAuthorityScriptPath = path.join(root, "scripts", "prepare_vocabulary_reviewer_authority.mjs");
const prepareAuthorityFromIntakeScriptPath = path.join(root, "scripts", "prepare_vocabulary_reviewer_authority_from_intake.mjs");
const authorityStatusScriptPath = path.join(root, "scripts", "report_vocabulary_reviewer_authority_status.mjs");
const fingerprintScriptPath = path.join(root, "scripts", "compute_ed25519_public_key_fingerprint.mjs");
const authorityRequestName = "REVIEWER_AUTHORITY_REQUEST.md";
const authorityFieldsName = "AUTHORITY_FIELDS.md";
const authorityIntakeName = "AUTHORITY_INTAKE.md";
const keyFingerprintInstructionsName = "KEY_FINGERPRINT_INSTRUCTIONS.md";

const filesToBundle = [
  {
    path: authorityTemplatePath,
    bundleName: "vocabulary-reviewer-authority.template.json",
    purpose: "Trusted reviewer key authority record template.",
  },
  {
    path: authorityIntakeTemplatePath,
    bundleName: "vocabulary-reviewer-authority-intake.template.json",
    purpose: "Machine-readable intake template for real reviewer authority inputs and operator verification flags.",
  },
  {
    path: reviewProtocolPath,
    bundleName: "vocabulary-review-protocol.md",
    purpose: "Vocabulary review protocol and evidence boundaries.",
  },
  {
    path: operatorHandoffPath,
    bundleName: "operator-handoff.md",
    purpose: "Current operator sequence and downstream blockers.",
  },
  {
    path: requirementsMatrixPath,
    bundleName: "requirements-matrix.md",
    purpose: "Extracted source-PDF requirements for reviewer context.",
  },
  {
    path: stageAuthorityEvidenceScriptPath,
    bundleName: "stage_vocabulary_reviewer_authority_evidence.mjs",
    purpose: "Reference copy of the project-root operator helper that safely copies real reviewer authority evidence into the ignored evidence root.",
    referenceOnly: true,
  },
  {
    path: prepareAuthorityScriptPath,
    bundleName: "prepare_vocabulary_reviewer_authority.mjs",
    purpose: "Reference copy of the project-root operator helper that builds and validates a candidate authority record.",
    referenceOnly: true,
  },
  {
    path: prepareAuthorityFromIntakeScriptPath,
    bundleName: "prepare_vocabulary_reviewer_authority_from_intake.mjs",
    purpose: "Reference copy of the project-root operator helper that turns a completed JSON intake into a validated candidate authority record.",
    referenceOnly: true,
  },
  {
    path: authorityStatusScriptPath,
    bundleName: "report_vocabulary_reviewer_authority_status.mjs",
    purpose: "Reference copy of the project-root read-only status helper for the pre-review reviewer authority gate.",
    referenceOnly: true,
  },
  {
    path: fingerprintScriptPath,
    bundleName: "compute_ed25519_public_key_fingerprint.mjs",
    purpose: "Reference copy of the project-root helper that computes Ed25519 SPKI public-key fingerprints.",
    referenceOnly: true,
  },
];

function parseArgs(argv) {
  const args = { output: defaultOutputPath };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --output");
      args.output = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/prepare_vocabulary_reviewer_authority_request.mjs [--output output/review-handoff/reviewer-authority-request]

Writes an ignored pre-review authority-request bundle for gathering the real
qualified reviewer identity, credential evidence, key-binding evidence, and
operator trust-attestation evidence needed before the vocabulary review bundle
can be send-ready.
`);
}

function resolveOutputPath(value) {
  const resolved = path.isAbsolute(value) ? value : path.resolve(root, value);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`--output escapes project root: ${value}`);
  }
  const relative = projectRelative(resolved);
  const defaultRelative = projectRelative(defaultOutputPath);
  if (relative !== defaultRelative && !relative.startsWith(`${defaultRelative}/`)) {
    throw new Error(`--output must be ${defaultRelative} or a child path under it`);
  }
  return resolved;
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function removeAndCreateDir(directory) {
  fs.rmSync(directory, { recursive: true, force: true });
  fs.mkdirSync(directory, { recursive: true });
}

function copyBundleFile(file, outputPath) {
  const destination = path.join(outputPath, file.bundleName);
  fs.copyFileSync(file.path, destination);
  return {
    source_path: projectRelative(file.path),
    bundle_path: projectRelative(destination),
    sha256: sha256File(file.path),
    purpose: file.purpose,
    request_material_only: true,
    reference_only: file.referenceOnly === true,
  };
}

function requestMarkdown(manifest) {
  return `# ASL Pilot Reviewer Authority Request

Before we can send the ASL Pilot vocabulary review packet, we need to pre-vet
the reviewer identity and bind it to the Ed25519 key that will later sign the
review receipt.

## What To Return

Return the following reviewer authority inputs to the project operator:

- reviewer name
- reviewer role
- actual Deaf educator or qualified ASL instructor qualification
- affiliation or independent-review context
- reviewer contact or signed credential evidence reference
- credential evidence showing the reviewer is qualified for ASL pedagogy review
- Ed25519 public key PEM
- evidence that the Ed25519 public key belongs to this reviewer
- operator trust attestation evidence showing who checked the reviewer identity and key binding
- credential evidence file(s), copied into \`data/vocabulary-review/evidence/\`
- key-binding evidence file(s), copied into \`data/vocabulary-review/evidence/\`
- operator trust-attestation evidence file(s), copied into \`data/vocabulary-review/evidence/\`

Do not send any private key. Do not use a placeholder credential, generic role
text, or project-operator identity.
The quoted values in the operator command are examples only; copied example
text is rejected by validation.

## Operator Commands

Run these commands from the repository root after receiving real reviewer/key
evidence:

\`\`\`sh
node scripts/compute_ed25519_public_key_fingerprint.mjs \\
  --public-key /path/to/reviewer-ed25519-public-key.pem \\
  --format trusted-key

cp docs/review/vocabulary-reviewer-authority-intake.template.json \\
  data/vocabulary-review/evidence/reviewer-authority-intake.json
# Fill data/vocabulary-review/evidence/reviewer-authority-intake.json from real reviewer inputs.
node scripts/prepare_vocabulary_reviewer_authority_from_intake.mjs \\
  --input data/vocabulary-review/evidence/reviewer-authority-intake.json \\
  --canonical \\
  --write

node scripts/report_vocabulary_reviewer_authority_status.mjs

node scripts/stage_vocabulary_reviewer_authority_evidence.mjs \\
  --credential-evidence-file /path/to/reviewer-credential.pdf \\
  --key-binding-evidence-file /path/to/reviewer-key-binding.txt \\
  --trusted-by-evidence-file /path/to/operator-trust-attestation.txt

node scripts/prepare_vocabulary_reviewer_authority.mjs \\
  --public-key /path/to/reviewer-ed25519-public-key.pem \\
  --reviewer-name "Reviewer Name" \\
  --reviewer-role "Qualified ASL instructor" \\
  --reviewer-qualification "Actual ASL qualification" \\
  --reviewer-affiliation-or-context "School, program, or independent context" \\
  --reviewer-contact-or-signed-evidence "contact or credential reference" \\
  --credential-evidence "credential evidence summary" \\
  --credential-evidence-file data/vocabulary-review/evidence/reviewer-credential.txt \\
  --key-binding-evidence "key-binding evidence summary" \\
  --key-binding-evidence-file data/vocabulary-review/evidence/reviewer-key-binding.txt \\
  --trusted-by-evidence "operator trust attestation summary" \\
  --trusted-by-evidence-file data/vocabulary-review/evidence/operator-trust-attestation.txt \\
  --trusted-by-name "Operator Name" \\
  --trusted-by-role "Operator role" \\
  --trusted-by-contact-or-signed-evidence "operator contact or signature reference" \\
  --canonical \\
  --write

node scripts/prepare_vocabulary_review_bundle.mjs
node scripts/audit_vocabulary_review_bundle.mjs
\`\`\`

The final audit must pass before sending the vocabulary review bundle. Until
then, the review bundle remains \`draft_missing_reviewer_authority\`.

## Current Target Authority State

- Target authority path: \`${manifest.target_authority.path}\`
- Target authority exists: \`${manifest.target_authority.exists}\`
- Target authority valid for pre-review: \`${manifest.target_authority.valid_for_pre_review}\`
- First authority findings: \`${manifest.target_authority.first_findings.join(" | ") || "none"}\`

## Included Context

This bundle includes:

- \`vocabulary-reviewer-authority.template.json\`
- \`vocabulary-reviewer-authority-intake.template.json\`
- \`AUTHORITY_INTAKE.md\`
- \`vocabulary-review-protocol.md\`
- \`operator-handoff.md\`
- \`requirements-matrix.md\`
- \`stage_vocabulary_reviewer_authority_evidence.mjs\`
- \`prepare_vocabulary_reviewer_authority.mjs\`
- \`prepare_vocabulary_reviewer_authority_from_intake.mjs\`
- \`report_vocabulary_reviewer_authority_status.mjs\`
- \`compute_ed25519_public_key_fingerprint.mjs\`

These files are context and helper references. They are request material only,
not reviewer authority evidence and not review evidence.
The bundled \`.mjs\` files are reference copies only. Do not execute the copied
helper scripts from inside \`output/review-handoff/reviewer-authority-request/\`;
use the canonical \`node scripts/...\` commands from the repository root.
`;
}

function authorityFieldsMarkdown() {
  return `# Reviewer Authority Fields

The canonical authority record is \`data/vocabulary-review/asl-pilot-reviewer-authority.json\`.
It must be prepared only from real reviewer identity, qualification, credential,
and key-binding evidence.

## Required Reviewer Fields

- \`reviewer.name\`
- \`reviewer.role\`
- \`reviewer.qualification\`
- \`reviewer.affiliation_or_context\`
- \`reviewer.contact_or_signed_evidence\`
- \`reviewer.is_project_operator: false\`

## Required Authority Fields

- \`trusted_at\`: full non-future ISO timestamp with timezone
- \`pre_review_key_binding_confirmed: true\`
- \`credential_evidence.summary\`: non-placeholder reviewer qualification evidence summary
- \`credential_evidence.files[]\`: hash-pinned evidence files under \`data/vocabulary-review/evidence/\`
- \`key_binding_evidence.summary\`: non-placeholder evidence summary that the public key belongs to the reviewer
- \`key_binding_evidence.files[]\`: hash-pinned evidence files under \`data/vocabulary-review/evidence/\`
- \`trusted_by.name\`
- \`trusted_by.role\`
- \`trusted_by.contact_or_signed_evidence\`
- \`trusted_by.evidence.summary\`: non-placeholder operator trust-attestation summary
- \`trusted_by.evidence.files[]\`: hash-pinned evidence files under \`data/vocabulary-review/evidence/\`

## Trusted Key Requirements

- \`trusted_key.algorithm: "ed25519"\`
- \`trusted_key.public_key_pem\`: Ed25519 SPKI public key PEM
- \`trusted_key.signer_key_fingerprint_sha256\`: SHA-256 of the SPKI public key bytes

Placeholders, generic credential prompts, project-operator reviewer identity,
and private keys are not valid authority evidence.
`;
}

function authorityIntakeMarkdown() {
  return `# Reviewer Authority Intake Form

Use this form to collect real reviewer authority inputs before sending the
vocabulary review bundle. This form is request material only; it is not reviewer authority evidence
and not review evidence.

The preferred operator path is the machine-readable intake template:

\`\`\`sh
cp docs/review/vocabulary-reviewer-authority-intake.template.json \\
  data/vocabulary-review/evidence/reviewer-authority-intake.json
# Fill data/vocabulary-review/evidence/reviewer-authority-intake.json from real reviewer inputs.
node scripts/prepare_vocabulary_reviewer_authority_from_intake.mjs \\
  --input data/vocabulary-review/evidence/reviewer-authority-intake.json \\
  --canonical \\
  --write
node scripts/report_vocabulary_reviewer_authority_status.mjs
\`\`\`

## Reviewer Returns To Operator

- Reviewer legal/preferred name:
- Reviewer role:
- Actual ASL qualification or Deaf educator qualification:
- Affiliation or independent-review context:
- Reviewer contact or signed credential evidence reference:
- Ed25519 public key PEM file:
- Credential evidence file(s) showing ASL pedagogy qualification:
- Key-binding evidence file(s) showing the Ed25519 public key belongs to the reviewer:

Do not return a private key. Do not use placeholders, generic credential text,
or a project-operator identity.

## Operator Verification Before Canonical Staging

- Operator who checked reviewer identity:
- Operator role:
- Operator contact or signed attestation reference:
- Operator trust-attestation evidence file(s):
- Verified reviewer is not the project operator:
- Verified Ed25519 public key fingerprint matches the reviewer key:
- Verified credential evidence supports qualified ASL pedagogy review:
- Evidence files copied into \`data/vocabulary-review/evidence/\`:

## Evidence File Checklist

Copy only real, non-empty evidence files into ignored
\`data/vocabulary-review/evidence/\` before running the authority helper:

- \`data/vocabulary-review/evidence/reviewer-credential.<ext>\`
- \`data/vocabulary-review/evidence/reviewer-key-binding.<ext>\`
- \`data/vocabulary-review/evidence/operator-trust-attestation.<ext>\`

After the files are copied, run:

\`\`\`sh
node scripts/prepare_vocabulary_reviewer_authority_from_intake.mjs --help
node scripts/stage_vocabulary_reviewer_authority_evidence.mjs --help
node scripts/report_vocabulary_reviewer_authority_status.mjs
node scripts/prepare_vocabulary_reviewer_authority.mjs --help
\`\`\`

The staging helper rejects symlinks, symlinked output directories, empty files,
private keys, and destinations outside the ignored evidence root. The authority
helper hash-pins the copied evidence files and writes
\`data/vocabulary-review/asl-pilot-reviewer-authority.json\` only when the real
reviewer identity, Ed25519 public key, credential evidence, key-binding
evidence, and operator trust attestation are present.

Run those helper commands from the repository root. Any \`.mjs\` files included
inside the ignored request bundle are reference copies only, not standalone
runnable helpers.
`;
}

function keyFingerprintInstructionsMarkdown() {
  return `# Ed25519 Key Fingerprint Instructions

The project needs only the reviewer's Ed25519 public key. Never request or store
the reviewer's private key.

Compute the trusted-key fields from a public key:

\`\`\`sh
node scripts/compute_ed25519_public_key_fingerprint.mjs \\
  --public-key /path/to/reviewer-ed25519-public-key.pem \\
  --format trusted-key
\`\`\`

If the reviewer computes this locally from a private key, the private key stays
outside the repository and the helper derives the public key in memory:

\`\`\`sh
node scripts/compute_ed25519_public_key_fingerprint.mjs \\
  --private-key /path/to/reviewer-ed25519-private-key.pem \\
  --format trusted-key
\`\`\`

The returned public key fingerprint must later match the signed reviewer receipt.
`;
}

function buildManifest(outputPath, bundledFiles) {
  const authorityResult = validateVocabularyReviewerPreReviewAuthorityFile(defaultReviewerAuthorityPath);
  const authorityExists = fs.existsSync(defaultReviewerAuthorityPath);
  return {
    schema_version: "asl-pilot-reviewer-authority-request-bundle/v1",
    status: "request_ready",
    generated_at: new Date().toISOString(),
    bundle_root: projectRelative(outputPath),
    request: null,
    authority_fields: null,
    authority_intake: null,
    key_fingerprint_instructions: null,
    target_authority: {
      path: projectRelative(defaultReviewerAuthorityPath),
      exists: authorityExists,
      sha256: authorityExists ? sha256File(defaultReviewerAuthorityPath) : null,
      valid_for_pre_review: authorityResult.findings.length === 0,
      first_findings: authorityResult.findings.slice(0, 10),
    },
    authority_template: {
      path: projectRelative(authorityTemplatePath),
      sha256: sha256File(authorityTemplatePath),
    },
    authority_intake_template: {
      path: projectRelative(authorityIntakeTemplatePath),
      sha256: sha256File(authorityIntakeTemplatePath),
    },
    bundled_files: bundledFiles,
    required_reviewer_fields: {
      name: true,
      role: true,
      qualification: true,
      affiliation_or_context: true,
      contact_or_signed_evidence: true,
      is_project_operator: false,
    },
    required_authority_fields: [
      "trusted_at",
      "pre_review_key_binding_confirmed",
      "trusted_key",
      "credential_evidence.summary",
      "credential_evidence.files",
      "key_binding_evidence.summary",
      "key_binding_evidence.files",
      "trusted_by",
      "trusted_by.evidence.summary",
      "trusted_by.evidence.files",
    ],
    trusted_key_requirements: {
      algorithm: "ed25519",
      public_key_pem: true,
      signer_key_fingerprint_sha256: true,
    },
    non_fabrication_notice: "This request bundle is not review evidence. Placeholders, fake credentials, private keys, and project-operator reviewer identity are invalid.",
    commands: [
      "node scripts/prepare_vocabulary_reviewer_authority_from_intake.mjs --help",
      "node scripts/stage_vocabulary_reviewer_authority_evidence.mjs --help",
      "node scripts/report_vocabulary_reviewer_authority_status.mjs",
      "node scripts/prepare_vocabulary_reviewer_authority.mjs --help",
      "node scripts/compute_ed25519_public_key_fingerprint.mjs --public-key /path/to/reviewer-ed25519-public-key.pem --format trusted-key",
      "node scripts/prepare_vocabulary_review_bundle.mjs",
      "node scripts/audit_vocabulary_review_bundle.mjs",
    ],
  };
}

function validateRequiredFiles() {
  const missing = filesToBundle.filter((file) => !fs.existsSync(file.path));
  if (missing.length > 0) {
    throw new Error(`Required authority-request source file(s) missing: ${missing.map((file) => projectRelative(file.path)).join(", ")}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const outputPath = resolveOutputPath(args.output);
  validateRequiredFiles();
  removeAndCreateDir(outputPath);
  const bundledFiles = filesToBundle.map((file) => copyBundleFile(file, outputPath));
  const manifest = buildManifest(outputPath, bundledFiles);
  const requestPath = path.join(outputPath, authorityRequestName);
  const requestText = requestMarkdown(manifest);
  const authorityFieldsPath = path.join(outputPath, authorityFieldsName);
  const authorityFieldsText = authorityFieldsMarkdown();
  const authorityIntakePath = path.join(outputPath, authorityIntakeName);
  const authorityIntakeText = authorityIntakeMarkdown();
  const keyInstructionsPath = path.join(outputPath, keyFingerprintInstructionsName);
  const keyInstructionsText = keyFingerprintInstructionsMarkdown();
  manifest.request = {
    path: projectRelative(requestPath),
    sha256: sha256Text(requestText),
    purpose: "Pre-review request for qualified reviewer identity, credential evidence, key-binding evidence, operator trust-attestation evidence, and Ed25519 public key.",
    request_material_only: true,
  };
  manifest.authority_fields = {
    path: projectRelative(authorityFieldsPath),
    sha256: sha256Text(authorityFieldsText),
    purpose: "Checklist for the authority fields required before send-ready vocabulary review.",
    request_material_only: true,
  };
  manifest.authority_intake = {
    path: projectRelative(authorityIntakePath),
    sha256: sha256Text(authorityIntakeText),
    purpose: "Fillable reviewer/operator intake form for real pre-review authority evidence.",
    request_material_only: true,
  };
  manifest.key_fingerprint_instructions = {
    path: projectRelative(keyInstructionsPath),
    sha256: sha256Text(keyInstructionsText),
    purpose: "Instructions for computing Ed25519 trusted-key fingerprint fields without private-key disclosure.",
    request_material_only: true,
  };
  fs.writeFileSync(requestPath, requestText, "utf8");
  fs.writeFileSync(authorityFieldsPath, authorityFieldsText, "utf8");
  fs.writeFileSync(authorityIntakePath, authorityIntakeText, "utf8");
  fs.writeFileSync(keyInstructionsPath, keyInstructionsText, "utf8");
  writeJson(path.join(outputPath, "MANIFEST.json"), manifest);
  console.log(JSON.stringify({
    status: manifest.status,
    output: projectRelative(outputPath),
    request: projectRelative(requestPath),
    target_authority: manifest.target_authority,
    files: bundledFiles.length + 5,
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Vocabulary reviewer authority request preparation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
