import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const sourceManifests = {
  train: path.join(root, "data", "manifests", "controlled-pilot-clip-heldout", "train.json"),
  validation: path.join(root, "data", "manifests", "controlled-pilot-clip-heldout", "validation.json"),
  test: path.join(root, "data", "manifests", "controlled-pilot-clip-heldout", "test.json"),
};
const subsetPath = path.join(root, "docs", "validation", "prompt-verifier-subset-manifests.json");
const outputRoot = path.join(root, "data", "manifests", "diagnostics", "prompt-verifier-reject-ood");
const summaryPath = path.join(root, "docs", "validation", "prompt-verifier-reject-manifests.json");

function parseArgs(argv) {
  const args = { write: false, maxClipsPerSplit: 500 };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") args.help = true;
    else if (item === "--write") args.write = true;
    else if (item === "--max-clips-per-split") {
      args.maxClipsPerSplit = Number.parseInt(argv[++index], 10);
      if (!Number.isFinite(args.maxClipsPerSplit) || args.maxClipsPerSplit <= 0) {
        throw new Error("--max-clips-per-split must be a positive integer");
      }
    } else {
      throw new Error(`Unknown argument: ${item}`);
    }
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/export_prompt_verifier_reject_manifests.mjs [--write]

Exports approved raw-video hard-negative manifests for the scoped 25-label
prompt verifier. Clips are selected from controlled-pilot labels outside the
current verifier subset, so they should be rejected by the scoped verifier.
`);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function fileReference(file) {
  return {
    path: projectRelative(file),
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
  };
}

function manifestRelative(outputManifestPath, sourceManifestPath, relativePath) {
  const absolute = path.resolve(path.dirname(sourceManifestPath), relativePath);
  return path.relative(path.dirname(outputManifestPath), absolute).split(path.sep).join("/") || ".";
}

function stableSortKey(clip) {
  return crypto.createHash("sha256").update([
    clip.label_id,
    clip.clip_id,
    clip.sha256,
    clip.signer_identity_hash,
  ].map((value) => String(value ?? "")).join("\t")).digest("hex");
}

function rewriteClip(clip, split, sourceManifestPath, outputManifestPath) {
  const next = structuredClone(clip);
  next.split = split;
  next.reject_training = {
    expected_outcome: "reject_for_scoped_prompt_verifier",
    reason: "label_outside_validated_25_label_prompt_subset",
    original_label_id: clip.label_id,
  };
  next.relative_video_path = manifestRelative(outputManifestPath, sourceManifestPath, clip.relative_video_path);
  if (clip.relative_frame_tensor_path) {
    next.relative_frame_tensor_path = manifestRelative(outputManifestPath, sourceManifestPath, clip.relative_frame_tensor_path);
  }
  if (next.frame_tensor_provenance?.source_video?.relative_video_path) {
    next.frame_tensor_provenance.source_video.relative_video_path = next.relative_video_path;
  }
  return next;
}

function buildManifest(sourceManifest, split, sourceManifestPath, outputManifestPath, subsetIds, maxClips) {
  const clips = sourceManifest.clips
    .filter((clip) => !subsetIds.has(clip.label_id))
    .sort((left, right) => stableSortKey(left).localeCompare(stableSortKey(right)))
    .slice(0, maxClips)
    .map((clip) => rewriteClip(clip, split, sourceManifestPath, outputManifestPath));
  return {
    schema_version: "asl-pilot-rawframe-manifest/v1",
    dataset_id: "asl-pilot-prompt-verifier-reject-ood-v0",
    dataset_source_mode: sourceManifest.dataset_source_mode,
    split,
    created_at: new Date().toISOString(),
    provenance_owner: "asl-pilot team",
    source_register: sourceManifest.source_register,
    supplemental_external_dataset_imports: sourceManifest.supplemental_external_dataset_imports,
    external_dataset_import: sourceManifest.external_dataset_import,
    preprocessing: sourceManifest.preprocessing,
    diagnostic_evidence: {
      schema_version: "asl-pilot-prompt-verifier-reject-manifests/v1",
      finality: "hard_negative_reject_training_not_final_model_evidence",
      source: "controlled_clip_heldout_labels_outside_current_prompt_verifier_subset",
      subset_manifest: fileReference(subsetPath),
    },
    labels: [
      {
        label_id: "__reject__",
        display_text: "Reject",
      },
    ],
    clips,
  };
}

function countBy(clips, key) {
  const counts = {};
  for (const clip of clips) {
    const value = clip[key] ?? null;
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function build(args) {
  const subset = readJson(subsetPath);
  const subsetIds = new Set(subset.selection.selected_label_ids);
  const manifests = {};
  for (const [split, sourcePath] of Object.entries(sourceManifests)) {
    const source = readJson(sourcePath);
    const outputPath = path.join(outputRoot, `${split}.json`);
    manifests[split] = buildManifest(source, split, sourcePath, outputPath, subsetIds, args.maxClipsPerSplit);
  }
  const summary = {
    schema_version: "asl-pilot-prompt-verifier-reject-manifests/v1",
    status: "written",
    finality: "hard_negative_reject_training_not_final_model_evidence",
    generated_at: new Date().toISOString(),
    generated_by: {
      script: fileReference(path.join(root, "scripts", "export_prompt_verifier_reject_manifests.mjs")),
      command: process.argv,
    },
    inputs: {
      subset: fileReference(subsetPath),
      source_manifests: Object.fromEntries(Object.entries(sourceManifests).map(([split, file]) => [split, fileReference(file)])),
    },
    excluded_subset_label_ids: [...subsetIds],
    max_clips_per_split: args.maxClipsPerSplit,
    output_manifests: Object.fromEntries(Object.entries(manifests).map(([split, manifest]) => {
      const outputPath = path.join(outputRoot, `${split}.json`);
      return [split, {
        path: projectRelative(outputPath),
        exists: fs.existsSync(outputPath),
        sha256: fs.existsSync(outputPath) ? sha256File(outputPath) : null,
        clip_count: manifest.clips.length,
        original_label_count: Object.keys(countBy(manifest.clips, "label_id")).length,
        source_id_counts: countBy(manifest.clips, "source_id"),
      }];
    })),
  };
  return { manifests, summary };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }
  const { manifests } = build(args);
  if (args.write) {
    for (const [split, manifest] of Object.entries(manifests)) {
      writeJson(path.join(outputRoot, `${split}.json`), manifest);
    }
    const { summary } = build(args);
    writeJson(summaryPath, summary);
    console.log(JSON.stringify({
      status: summary.status,
      summary: projectRelative(summaryPath),
      output_manifests: summary.output_manifests,
    }, null, 2));
  } else {
    const { summary } = build(args);
    console.log(JSON.stringify(summary, null, 2));
  }
}

main();
