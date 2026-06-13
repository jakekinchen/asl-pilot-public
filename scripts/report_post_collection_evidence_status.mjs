import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  defaultChallengeReviewEvidencePath,
  defaultChallengeReviewPacketPath,
  defaultChallengeReviewerAuthorityPath,
  defaultChallengeReviewReceiptPath,
  defaultClipReviewEvidencePath,
  defaultClipReviewPacketPath,
  defaultClipReviewerAuthorityPath,
  defaultClipReviewReceiptPath,
  defaultStorePath,
  projectRelative,
  readStore,
  resolveProjectPath,
  root,
} from "./clip_review_utils.mjs";

const defaultSignerIdentityPath = path.join(root, "data", "signer-identity", "signer-identity-evidence.json");
const defaultOutputPath = path.join(root, "docs", "validation", "post-collection-evidence-status.json");
const manifestPaths = [
  path.join(root, "data", "manifests", "train.json"),
  path.join(root, "data", "manifests", "validation.json"),
  path.join(root, "data", "manifests", "test.json"),
  path.join(root, "data", "manifests", "negative-challenge.json"),
];
const sourceFiles = [
  "scripts/report_post_collection_evidence_status.mjs",
  "scripts/audit_post_collection_evidence_status.mjs",
  "scripts/process_collected_dataset_evidence.mjs",
  "scripts/clip_review_utils.mjs",
  "scripts/export_clip_review_packet.mjs",
  "scripts/export_challenge_review_packet.mjs",
  "scripts/draft_post_collection_review_receipt.mjs",
  "scripts/import_clip_review.mjs",
  "scripts/import_challenge_review.mjs",
  "scripts/import_signer_identity_evidence.mjs",
  "scripts/audit_dataset_collection_readiness.mjs",
  "scripts/signed_receipt_utils.mjs",
  "scripts/export_dataset_manifests.mjs",
  "scripts/audit_final_manifests.py",
];

function parseArgs(argv) {
  const args = {
    store: defaultStorePath,
    clipReview: defaultClipReviewPacketPath,
    clipReviewerReceipt: defaultClipReviewReceiptPath,
    clipReviewerAuthority: defaultClipReviewerAuthorityPath,
    challengeReview: defaultChallengeReviewPacketPath,
    challengeReviewerReceipt: defaultChallengeReviewReceiptPath,
    challengeReviewerAuthority: defaultChallengeReviewerAuthorityPath,
    signerIdentity: defaultSignerIdentityPath,
    output: defaultOutputPath,
    write: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--write") {
      args.write = true;
      continue;
    }
    if (
      item === "--store" ||
      item === "--clip-review" ||
      item === "--clip-reviewer-receipt" ||
      item === "--clip-reviewer-authority" ||
      item === "--challenge-review" ||
      item === "--challenge-reviewer-receipt" ||
      item === "--challenge-reviewer-authority" ||
      item === "--signer-identity" ||
      item === "--output"
    ) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      if (item === "--store") args.store = value;
      if (item === "--clip-review") args.clipReview = value;
      if (item === "--clip-reviewer-receipt") args.clipReviewerReceipt = value;
      if (item === "--clip-reviewer-authority") args.clipReviewerAuthority = value;
      if (item === "--challenge-review") args.challengeReview = value;
      if (item === "--challenge-reviewer-receipt") args.challengeReviewerReceipt = value;
      if (item === "--challenge-reviewer-authority") args.challengeReviewerAuthority = value;
      if (item === "--signer-identity") args.signerIdentity = value;
      if (item === "--output") args.output = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/report_post_collection_evidence_status.mjs [--write]

Reports the current post-collection evidence intake status without importing QA
packets, signer identity packets, or final manifests. The report is an operator-
readiness artifact only and is not final dataset evidence.
`);
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function fileReference(file) {
  return {
    path: projectRelative(file),
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function projectFileReference(relativePath) {
  return fileReference(path.join(root, relativePath));
}

function countBy(values) {
  const counts = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}

function statusFromState({ store, paths, dryRun }) {
  if (!paths.store.exists) return "blocked_missing_collection_store";
  if (store.datasetClips.length === 0 || store.datasetChallengeClips.length === 0) {
    return "blocked_missing_collected_clips";
  }
  if (
    !paths.clip_review_packet.exists ||
    !paths.challenge_review_packet.exists ||
    !paths.signer_identity_packet.exists
  ) {
    return "blocked_missing_returned_packets";
  }
  if (dryRun.status !== "passed") return "blocked_invalid_returned_packets";
  return "dry_run_valid_awaiting_apply";
}

function nextStepsForStatus(status) {
  if (status === "blocked_missing_collection_store") {
    return [
      "Promote accepted vocabulary evidence and regenerate a source-curated collection plan.",
      "Run explicit consent collection sessions until data/asl-pilot-store.json exists with collected vocabulary and challenge clips.",
    ];
  }
  if (status === "blocked_missing_collected_clips") {
    return [
      "Continue explicit consent collection until both vocabulary clips and negative challenge clips exist.",
      "Re-export review packets only after the local collection store contains clips for review.",
    ];
  }
  if (status === "blocked_missing_returned_packets") {
    return [
      "Export clip and challenge QA packets after collection.",
      "Complete source-curated/operator QA packets with status qa_completed and an explicit no-external-review claim.",
      "If using optional stronger external review instead, complete status reviewed packets and stage signed reviewer receipts plus trusted reviewer authority records.",
      "Prepare signer identity evidence with signed consent receipts.",
      "Place completed QA packets and signer identity evidence at the default data paths, then rerun this status report.",
    ];
  }
  if (status === "blocked_invalid_returned_packets") {
    return [
      "Fix stale or invalid returned review, challenge, or signer identity packets.",
      "Run node scripts/process_collected_dataset_evidence.mjs without --apply until its dry run passes.",
    ];
  }
  return [
    "Run node scripts/process_collected_dataset_evidence.mjs --apply to import QA evidence, verify readiness, export manifests, and run the strict manifest audit.",
  ];
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
  });
  return {
    command: [command, ...args],
    status_code: result.status,
    status: result.status === 0 ? "passed" : "failed",
    stdout: result.stdout.trim().slice(0, 6000),
    stderr: result.stderr.trim().slice(0, 3000),
  };
}

function dryRunWrapper(paths) {
  if (
    !paths.clip_review_packet.exists ||
    !paths.challenge_review_packet.exists ||
    !paths.signer_identity_packet.exists
  ) {
    return {
      status: "skipped_missing_inputs",
      command: [
        "node",
        "scripts/process_collected_dataset_evidence.mjs",
        "--clip-review",
        paths.clip_review_packet.path,
        "--challenge-review",
        paths.challenge_review_packet.path,
        "--signer-identity",
        paths.signer_identity_packet.path,
      ],
      status_code: null,
      stdout: "",
      stderr: "",
    };
  }
  return run("node", [
    "scripts/process_collected_dataset_evidence.mjs",
    "--clip-review",
    paths.clip_review_packet.path,
    "--challenge-review",
    paths.challenge_review_packet.path,
    "--signer-identity",
    paths.signer_identity_packet.path,
  ]);
}

function buildReport(args) {
  const storePath = resolveProjectPath(args.store, "--store");
  const clipReviewPath = resolveProjectPath(args.clipReview, "--clip-review");
  const clipReviewerReceiptPath = resolveProjectPath(args.clipReviewerReceipt, "--clip-reviewer-receipt");
  const clipReviewerAuthorityPath = resolveProjectPath(args.clipReviewerAuthority, "--clip-reviewer-authority");
  const challengeReviewPath = resolveProjectPath(args.challengeReview, "--challenge-review");
  const challengeReviewerReceiptPath = resolveProjectPath(args.challengeReviewerReceipt, "--challenge-reviewer-receipt");
  const challengeReviewerAuthorityPath = resolveProjectPath(args.challengeReviewerAuthority, "--challenge-reviewer-authority");
  const signerIdentityPath = resolveProjectPath(args.signerIdentity, "--signer-identity");
  const paths = {
    store: fileReference(storePath),
    clip_review_packet: fileReference(clipReviewPath),
    clip_reviewer_receipt: fileReference(clipReviewerReceiptPath),
    clip_reviewer_authority: fileReference(clipReviewerAuthorityPath),
    challenge_review_packet: fileReference(challengeReviewPath),
    challenge_reviewer_receipt: fileReference(challengeReviewerReceiptPath),
    challenge_reviewer_authority: fileReference(challengeReviewerAuthorityPath),
    signer_identity_packet: fileReference(signerIdentityPath),
    clip_review_evidence: fileReference(defaultClipReviewEvidencePath),
    challenge_review_evidence: fileReference(defaultChallengeReviewEvidencePath),
    manifests: manifestPaths.map(fileReference),
  };
  const store = readStore(storePath);
  const dryRun = dryRunWrapper(paths);
  const status = statusFromState({ store, paths, dryRun });
  const readinessAudit = run("node", ["scripts/audit_dataset_collection_readiness.mjs"]);
  return {
    schema_version: "asl-pilot-post-collection-evidence-status/v1",
    status,
    evidence_mode: "operator_readiness",
    finality: "not_final_dataset_evidence",
    generated_at: new Date().toISOString(),
    runner: {
      command: [...process.argv],
      script: projectFileReference("scripts/report_post_collection_evidence_status.mjs"),
    },
    paths,
    collection_store_summary: {
      exists: paths.store.exists,
      dataset_clip_count: store.datasetClips.length,
      challenge_clip_count: store.datasetChallengeClips.length,
      consent_record_count: store.consentRecords.length,
      signer_count: store.datasetSigners.length,
      vocabulary_review_status_counts: countBy(store.datasetClips.map((clip) => clip.labelReviewStatus ?? "missing")),
      challenge_review_status_counts: countBy(store.datasetChallengeClips.map((clip) => clip.challengeReviewStatus ?? "missing")),
    },
    packet_readiness: {
      clip_review_packet_exportable: paths.store.exists && store.datasetClips.length > 0,
      challenge_review_packet_exportable: paths.store.exists && store.datasetChallengeClips.length > 0,
      signer_identity_packet_required: paths.store.exists && store.datasetSigners.length > 0,
      all_returned_inputs_present:
        paths.clip_review_packet.exists &&
        paths.challenge_review_packet.exists &&
        paths.signer_identity_packet.exists,
      dry_run: dryRun,
    },
    final_readiness: {
      dataset_collection_readiness: readinessAudit,
      manifests_exist: paths.manifests.every((item) => item.exists),
    },
    next_required_steps: nextStepsForStatus(status),
    final_evidence_exclusion: {
      excluded_from_completion: true,
      reason: "This report describes missing or dry-run post-collection evidence only. It does not review ASL clips, verify signer identity, export final manifests, train a model, or prove final readiness.",
    },
    evidence: {
      source_files: sourceFiles.map(projectFileReference),
    },
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const outputPath = resolveProjectPath(args.output, "--output");
  const report = buildReport(args);
  if (args.write) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: report.status,
    output: args.write ? projectRelative(outputPath) : null,
    next_required_steps: report.next_required_steps,
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Post-collection evidence status failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
