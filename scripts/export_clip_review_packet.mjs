import fs from "node:fs";
import {
  clipFileReference,
  clipReviewStatus,
  collectionPlanAssignmentReference,
  captureConditionReference,
  defaultClipReviewPacketPath,
  defaultStorePath,
  projectRelative,
  readStore,
  resolveProjectPath,
  sha256File,
  writeJson,
} from "./clip_review_utils.mjs";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--store" || item === "--output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      args[item.slice(2)] = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/export_clip_review_packet.mjs [--store data/asl-pilot-store.json] [--output data/clip-review/asl-pilot-clip-review.json]

Exports collected dataset clips for source-curated/operator QA. The QA reviewer
should mark each clip approved only if the raw video matches the prompted ASL
label under the controlled pilot capture conditions. External reviewer evidence
is optional stronger evidence, not required for source-aligned completion.
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const storePath = args.store ? resolveProjectPath(args.store, "--store") : defaultStorePath;
  const outputPath = args.output ? resolveProjectPath(args.output, "--output") : defaultClipReviewPacketPath;
  const store = readStore(storePath);
  const storeExists = fs.existsSync(storePath);
  if (!storeExists) throw new Error(`store does not exist: ${projectRelative(storePath)}`);
  if (store.datasetClips.length === 0) throw new Error("no dataset clips found to review");
  const clips = store.datasetClips.map((clip) => ({
    clip_id: clip.id,
    signer_alias: clip.signerAlias,
    vocabulary_id: clip.vocabularyId,
    consent_record_id: clip.consentRecordId,
    collection_plan: collectionPlanAssignmentReference(clip),
    capture_condition: captureConditionReference(clip),
    relative_video_path: clip.relativeVideoPath,
    video: clipFileReference(clip),
    duration_ms: clip.durationMs,
    current_review_status: clipReviewStatus(clip),
    approved: false,
    corrected_vocabulary_id: clip.vocabularyId,
    rejection_reason: "",
    notes: "",
  }));
  const packet = {
    schema_version: "asl-pilot-clip-review/v1",
    status: "needs_qa",
    evidence_mode: "source_curated_operator_qa",
    external_review: {
      claimed: false,
      claim: "No external Deaf educator, ASL instructor, or reviewer approval is claimed by this source-curated/operator QA packet.",
    },
    exported_at: new Date().toISOString(),
    store: {
      path: projectRelative(storePath),
      exists: storeExists,
      sha256: storeExists ? sha256File(storePath) : null,
    },
    reviewer: {
      name: "",
      role: "",
      qualification: "",
      affiliation_or_context: "",
      contact_or_signed_evidence: "",
      is_project_operator: true,
      reviewed_at: "",
    },
    optional_external_review: {
      status: "not_required_for_source_aligned_completion",
      claim: "If a qualified external reviewer is used later, set status to reviewed and provide the existing signed receipt and reviewer authority evidence.",
    },
    clip_count: clips.length,
    clips,
  };
  writeJson(outputPath, packet);
  console.log(
    JSON.stringify(
      {
        status: "exported",
        output: projectRelative(outputPath),
        clip_count: clips.length,
      },
      null,
      2,
    ),
  );
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Clip review export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
