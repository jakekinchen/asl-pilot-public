import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const defaultPacketPath = path.join(root, "docs", "review", "online-negative-challenge-review-packet.json");
const defaultOutputDir = path.join(root, "docs", "review", "online-negative-challenge-contact-sheets");
const schemaVersion = "asl-pilot-online-negative-challenge-contact-sheets/v1";
const defaultSampleFractions = [0.2, 0.5, 0.8];
const denseSampleFractions = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 0.95];
const denseSampledTypes = new Set(["waving", "hand_clap", "hands_cropped_out"]);
const requiredTypes = [
  "empty_camera",
  "no_hands_visible",
  "low_light",
  "off_center",
  "non_target_asl_sign",
  "waving",
  "hand_clap",
  "hands_cropped_out",
];

function sampleFractionsForType(challengeType) {
  return denseSampledTypes.has(challengeType) ? denseSampleFractions : defaultSampleFractions;
}

function parseArgs(argv) {
  const args = {
    packet: defaultPacketPath,
    outputDir: defaultOutputDir,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--packet") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --packet");
      args.packet = resolveProjectPath(value, "--packet");
      index += 1;
      continue;
    }
    if (item === "--output-dir") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --output-dir");
      args.outputDir = resolveProjectPath(value, "--output-dir");
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/export_online_negative_challenge_contact_sheets.mjs [--packet docs/review/online-negative-challenge-review-packet.json] [--output-dir docs/review/online-negative-challenge-contact-sheets]

Exports labeled contact sheets for the combined online negative challenge
review packet. This is visual-review input only; it is not source-register
approval, final manifest approval, or model evidence.
`);
}

function resolveProjectPath(value, context) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${context} escapes project root: ${value}`);
  }
  return resolved;
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function run(command, args, context) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(`${context} failed: ${result.stderr || result.stdout || `${command} exited ${result.status}`}`);
  }
  return result.stdout;
}

function probeDuration(videoPath) {
  const stdout = run(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      videoPath,
    ],
    `ffprobe ${videoPath}`,
  );
  const duration = Number(stdout.trim());
  return Number.isFinite(duration) && duration > 0 ? duration : 1;
}

function safeLabel(value) {
  return String(value).replaceAll(/[^a-zA-Z0-9_-]+/g, "-").replaceAll(/^-|-$/g, "");
}

function extractFrame(videoPath, timestamp, outputPath) {
  run(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-ss",
      timestamp.toFixed(3),
      "-i",
      videoPath,
      "-frames:v",
      "1",
      "-vf",
      "scale=320:180:force_original_aspect_ratio=decrease,pad=320:180:(ow-iw)/2:(oh-ih)/2:white",
      outputPath,
    ],
    `ffmpeg frame extract ${videoPath}`,
  );
}

function buildSheet(images, outputPath, columnsPerRow = 3) {
  if (images.length === 0) return;
  const inputDir = path.join(
    path.dirname(outputPath),
    "sheet-inputs",
    path.basename(outputPath, path.extname(outputPath)),
  );
  fs.rmSync(inputDir, { recursive: true, force: true });
  fs.mkdirSync(inputDir, { recursive: true });
  images.forEach((image, index) => {
    fs.copyFileSync(image, path.join(inputDir, `${String(index + 1).padStart(3, "0")}.jpg`));
  });
  const rowCount = Math.ceil(images.length / columnsPerRow);
  run(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-framerate",
      "1",
      "-i",
      path.join(inputDir, "%03d.jpg"),
      "-vf",
      `tile=${columnsPerRow}x${rowCount}:padding=8:margin=8:color=white`,
      "-frames:v",
      "1",
      outputPath,
    ],
    `ffmpeg contact sheet ${outputPath}`,
  );
  fs.rmSync(inputDir, { recursive: true, force: true });
}

function cleanOutputDir(outputDir) {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(outputDir, "frames"), { recursive: true });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  if (!fs.existsSync(args.packet)) {
    throw new Error(`Review packet does not exist: ${projectRelative(args.packet)}`);
  }
  const packet = readJson(args.packet);
  if (!Array.isArray(packet.clips) || packet.clips.length === 0) {
    throw new Error("Review packet clips must be a non-empty array");
  }

  cleanOutputDir(args.outputDir);
  const framesDir = path.join(args.outputDir, "frames");
  const clips = [];
  for (const [clipIndex, clip] of packet.clips.entries()) {
    const videoPath = resolveProjectPath(clip.local_video_path, `clips[${clipIndex}].local_video_path`);
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Local video is missing for ${clip.candidate_id}: ${clip.local_video_path}`);
    }
    const duration = probeDuration(videoPath);
    const sampleFractions = sampleFractionsForType(clip.challenge_type);
    const framePaths = [];
    for (const [sampleIndex, fraction] of sampleFractions.entries()) {
      const timestamp = Math.max(0, Math.min(duration - 0.001, duration * fraction));
      const frameName = [
        String(clipIndex + 1).padStart(2, "0"),
        safeLabel(clip.challenge_type),
        safeLabel(clip.candidate_id),
        `sample-${sampleIndex + 1}`,
      ].join("__");
      const framePath = path.join(framesDir, `${frameName}.jpg`);
      extractFrame(videoPath, timestamp, framePath);
      framePaths.push(framePath);
    }
    clips.push({
      candidate_id: clip.candidate_id,
      challenge_type: clip.challenge_type,
      source_id: clip.source_id,
      local_video_path: clip.local_video_path,
      downloaded_sha256: clip.downloaded_sha256,
      duration_seconds: duration,
      sample_fractions: sampleFractions,
      frames: framePaths.map((framePath) => ({
        path: projectRelative(framePath),
        sha256: sha256File(framePath),
      })),
    });
  }

  const sheets = [];
  for (const type of requiredTypes) {
    const typeClips = clips.filter((clip) => clip.challenge_type === type);
    const images = typeClips.flatMap((clip) => clip.frames.map((frame) => path.join(root, frame.path)));
    const outputPath = path.join(args.outputDir, `${type}.jpg`);
    const columnsPerRow = sampleFractionsForType(type).length;
    buildSheet(images, outputPath, columnsPerRow);
    sheets.push({
      challenge_type: type,
      clip_count: typeClips.length,
      sample_fractions: sampleFractionsForType(type),
      path: projectRelative(outputPath),
      sha256: fs.existsSync(outputPath) ? sha256File(outputPath) : null,
      layout: `rows are clips in packet order; columns are ${columnsPerRow} samples at ${sampleFractionsForType(type).map((f) => `${Math.round(f * 100)}%`).join(", ")} of clip duration; labels live in manifest.json`,
    });
  }

  const manifest = {
    schema_version: schemaVersion,
    status: "ready_for_visual_review",
    evidence_mode: "contact_sheet_visual_review_input",
    finality: "not_final_model_evidence",
    generated_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: {
      path: "scripts/export_online_negative_challenge_contact_sheets.mjs",
      sha256: sha256File(path.join(root, "scripts", "export_online_negative_challenge_contact_sheets.mjs")),
      },
      ffmpeg: run("ffmpeg", ["-version"], "ffmpeg -version").split("\n")[0],
    },
    review_packet: {
      path: projectRelative(args.packet),
      sha256: sha256File(args.packet),
    },
    sample_fractions_by_type: Object.fromEntries(
      requiredTypes.map((type) => [type, sampleFractionsForType(type)]),
    ),
    sheets,
    clips,
    review_limitations: [
      "Contact sheets sample 3 frames per video for static challenge types and 7 frames for motion-based types (waving, hand_clap, hands_cropped_out); neither replaces full-motion review.",
      "This artifact supports visual pruning only; it is not source-register approval, final manifest approval, or model evidence.",
    ],
  };
  const manifestPath = path.join(args.outputDir, "manifest.json");
  writeJson(manifestPath, manifest);
  console.log(JSON.stringify({
    status: manifest.status,
    output_dir: projectRelative(args.outputDir),
    manifest: {
      path: projectRelative(manifestPath),
      sha256: sha256File(manifestPath),
    },
    sheets: manifest.sheets,
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Online negative challenge contact sheet export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
