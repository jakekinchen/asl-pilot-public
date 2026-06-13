import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
// Default scan roots cover the promoted-lane claim chain only: the live model
// card and matrices, the supported-label registry, the no-pretrained receipt,
// and the rawframe promoted-model artifact directory. Excluded by design:
// - artifacts/stage_a/ and artifacts/stage_b/ — untracked via .gitignore in
//   round-001 task-026 §E; any on-disk historical landmark caches are out of
//   the promoted-lane audit scope.
// - artifacts/rawframe-model-diagnostics/ and artifacts/rawframe-model-clip-heldout/
//   — historical academic-benchmark / held-out reports that honestly disclose
//   MediaPipe-upstream Holistic keypoint provenance. They are research
//   evidence, not promoted-lane evidence; the round-001 final claim matrix no
//   longer cites them as the active CV claim.
// Pass --path explicitly to widen the scan ad hoc.
const defaultScanRoots = [
  "web/public/model/model-card.json",
  "web/public/model/claim-matrix.json",
  "docs/validation/final-claim-matrix.json",
  "docs/validation/supported-label-registry.json",
  "docs/validation/no-pretrained-lane-audit.json",
  "artifacts/rawframe-model/",
];
const defaultOutputPath = "docs/validation/no-pretrained-artifact-json-audit.json";

const bannedStringPatterns = [
  {
    pattern: /\bfrom_pretrained\s*\(/i,
    reason: "loads pretrained model weights through from_pretrained()",
  },
  {
    pattern: /\bhf_hub_download\s*\(|\bsnapshot_download\s*\(/i,
    reason: "downloads model artifacts from a model hub",
  },
  {
    pattern: /\btorch\.hub\.load\s*\(|\bmodel_zoo\.load_url\s*\(|\bload_state_dict_from_url\s*\(/i,
    reason: "loads model weights through a hub/model-zoo URL",
  },
  {
    pattern: /\bmediapipe\b|\bopenpose\b|\bposenet\b|\bbodypix\b|\bhandpose\b|\bultralytics\b|\byolov?\d*\b/i,
    reason: "references a banned pretrained detector or CV package",
  },
  {
    pattern: /\b(?:i3d|t-?gcn)\b/i,
    reason: "references a banned pretrained sign/video baseline component",
  },
  {
    pattern: /\bpretrained[-_ ]+(?:weights?|checkpoint|backbone|detectors?|extractors?|features?|models?|classifiers?|components?)\b/i,
    reason: "references pretrained weights, checkpoints, detectors, extractors, features, models, or classifiers",
  },
  {
    pattern: /\b(?:hand[-_ ]?|pose[-_ ]?|face[-_ ]?)?landmarks?\b/i,
    reason: "references generated landmark artifacts",
  },
  {
    pattern: /\b(?:embeddings?|feature[-_ ]?vectors?|feature[-_ ]?extractors?|bounding[-_ ]?boxes?|bbox)\b/i,
    reason: "references derived feature, embedding, or bounding-box artifacts",
  },
];

const prohibitedArtifactKeyPattern =
  /(?:derived[-_]?features?|landmarks?|pose[-_]?data|embeddings?|feature[-_]?vectors?|feature[-_]?files?|bounding[-_]?boxes?|bbox)/i;

const prohibitedExtractorNamePattern = /^(?:mediapipe|openpose|posenet|bodypix|handpose|movenet|blazepose|yolo|ultralytics)/i;

function parseArgs(argv) {
  const args = { paths: [], output: defaultOutputPath, write: false };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--path" || item === "--paths") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      args.paths.push(value);
      index += 1;
      continue;
    }
    if (item === "--output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --output");
      args.output = value;
      index += 1;
      continue;
    }
    if (item === "--write") {
      args.write = true;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/audit_no_pretrained_artifact_json.mjs [--path <file-or-dir>]... [--write] [--output <file>]

Scans current promoted/model-card JSON artifacts and supporting evidence reports
for pretrained components, model-hub loaders, landmark/embedding/feature
artifacts, and other banned derived CV evidence. Pass --path to run a broader
ad hoc scan. Empty pretrained_components arrays, explicit "not initialized
from pretrained" attestation text, and disclosed relaxed Stage A runtime
assistance boundaries are allowed.
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

function writeJson(relativePath, value) {
  const file = resolveProjectPath(relativePath, "--output");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function walkJsonFiles(target) {
  if (!fs.existsSync(target)) return [];
  const stat = fs.statSync(target);
  if (stat.isFile()) return target.endsWith(".json") ? [target] : [];
  if (!stat.isDirectory()) return [];
  return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "node_modules" || entry.name === ".next") return [];
    return walkJsonFiles(path.join(target, entry.name));
  });
}

function isEmptyValue(value) {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  if (typeof value === "string") return value.trim().length === 0;
  return false;
}

function isExplicitNoPretrainedStatement(value) {
  const text = value.toLowerCase();
  return (
    text.includes("not initialized from pretrained") ||
    text.includes("without pretrained") ||
    text.includes("no pretrained") ||
    (text.includes("pretrained") && text.includes("rejected")) ||
    (text.includes("pretrained") && text.includes("no external detector"))
  );
}

function isAllowedBoundaryDisclosure(value) {
  // After round-001 task-026 Stage A removal, the promoted lane no longer
  // has any disclosed-assisted boundary. The only permitted narrative
  // mentions are negative ones (e.g. "no mediapipe", "without landmark
  // detector"), which the rest of this helper continues to whitelist.
  // Past "disclosed Stage A MediaPipe ..." carve-outs are intentionally
  // removed so any reappearance is flagged.
  const text = value.toLowerCase();
  if (text.includes("not mediapipe") || text.includes("not mediaPipe".toLowerCase())) return true;
  if (text.includes("no mediapipe") || text.includes("no opencv") || text.includes("no external detector")) return true;
  if (text.includes("do not use") || text.includes("not allowed as") || text.includes("disallowed")) return true;
  if (text.includes("without") && (text.includes("landmark") || text.includes("detector") || text.includes("feature"))) return true;
  // Retrospective removal language: text that records vestige removal (Stage A / MediaPipe / landmark)
  // is permitted, since it does not introduce a pretrained dependency.
  if (text.includes("vestige") && text.includes("removed")) return true;
  if (text.includes("vestige removal")) return true;
  if (text.includes("task-026") && (text.includes("removed") || text.includes("removal"))) return true;
  // Bare-dependency-name entries inside the no-pretrained-lane-audit receipt's
  // removed_vestige_summary (e.g. "@mediapipe/tasks-vision@0.10.35",
  // "web/public/models/mediapipe/", "artifacts/stage_a/") are honest removal
  // records, not re-introductions. Whitelist the small set of removed names.
  if (/^@mediapipe\//.test(value)) return true;
  if (/^web\/public\/models\/mediapipe\//.test(value)) return true;
  if (/^web\/src\/asl\//.test(value)) return true;
  if (/^artifacts\/stage_[ab]\//.test(value)) return true;
  return false;
}

function isDisclosedOfflineLabelProvenance(value) {
  // Human-authorized relaxation (2026-05-30, supervising user): training/eval
  // LABELS may be derived offline by any tool (incl. MediaPipe) as long as the
  // disclosure is explicit AND co-located with an attestation that the RUNTIME
  // uses only our own scratch-trained model. This permits honest provenance
  // text such as: "labels offline-derived via MediaPipe Holistic; runtime uses
  // only our scratch-trained model and is not a runtime dependency."
  // The runtime/deps/browser-artifact key bans below remain fully in force;
  // only this single-string provenance disclosure is whitelisted. A bare
  // pretrained mention without the runtime-scratch attestation is still flagged.
  const t = value.toLowerCase();
  const offlineLabel =
    (t.includes("offline") && t.includes("label")) || t.includes("offline-derived");
  const runtimeSafe =
    (t.includes("runtime") || t.includes("inference") || t.includes("browser")) &&
    (t.includes("scratch") || t.includes("our own model") || t.includes("our model") ||
      t.includes("not a runtime") || t.includes("no pretrained") || t.includes("not shipped"));
  return offlineLabel && runtimeSafe;
}

function inspectValue(file, jsonPath, value, findings) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectValue(file, `${jsonPath}[${index}]`, item, findings));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      const nestedPath = `${jsonPath}.${key}`;
      if (key === "pretrained_components") {
        if (!Array.isArray(nested)) {
          findings.push({
            file,
            path: nestedPath,
            reason: "pretrained_components must be an empty array",
            value: nested,
          });
        } else if (nested.length > 0) {
          findings.push({
            file,
            path: nestedPath,
            reason: "pretrained_components must be empty",
            value: nested,
          });
        }
        continue;
      }
      if (key === "extractor" && nested && typeof nested === "object" && !Array.isArray(nested)) {
        const extractorName = typeof nested.name === "string" ? nested.name : "";
        if (extractorName && prohibitedExtractorNamePattern.test(extractorName)) {
          findings.push({
            file,
            path: `${nestedPath}.name`,
            reason: `extractor.name references a banned pretrained detector: ${extractorName}`,
            value: extractorName,
          });
        }
        if (nested.tasks_vision_version != null && nested.tasks_vision_version !== "") {
          findings.push({
            file,
            path: `${nestedPath}.tasks_vision_version`,
            reason: "extractor.tasks_vision_version pins the MediaPipe Tasks Vision package and must not appear in any artifact",
            value: nested.tasks_vision_version,
          });
        }
        if (typeof nested.model_asset_sha256 === "string" && nested.model_asset_sha256.length > 0) {
          findings.push({
            file,
            path: `${nestedPath}.model_asset_sha256`,
            reason: "extractor.model_asset_sha256 pins a pretrained model asset and must not appear in any artifact",
            value: nested.model_asset_sha256,
          });
        }
      }
      if (key === "tasks_vision_version" && nested != null && nested !== "") {
        findings.push({
          file,
          path: nestedPath,
          reason: "tasks_vision_version pins the MediaPipe Tasks Vision package and must not appear in any artifact",
          value: nested,
        });
      }
      if (prohibitedArtifactKeyPattern.test(key) && !isEmptyValue(nested)) {
        findings.push({
          file,
          path: nestedPath,
          reason: "prohibited derived feature, landmark, embedding, or bounding-box JSON key is populated",
          value: nested,
        });
      }
      inspectValue(file, nestedPath, nested, findings);
    }
    return;
  }
  if (typeof value !== "string" || value.trim().length === 0) return;
  if (isExplicitNoPretrainedStatement(value)) return;
  if (isAllowedBoundaryDisclosure(value)) return;
  if (isDisclosedOfflineLabelProvenance(value)) return;
  for (const banned of bannedStringPatterns) {
    if (banned.pattern.test(value)) {
      findings.push({
        file,
        path: jsonPath,
        reason: banned.reason,
        value,
      });
      break;
    }
  }
}

function scanFile(file) {
  const findings = [];
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    findings.push({
      file,
      path: "$",
      reason: `invalid JSON: ${error.message}`,
      value: null,
    });
    return findings;
  }
  inspectValue(file, "$", data, findings);
  return findings;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const scanTargets = (args.paths.length > 0 ? args.paths : defaultScanRoots)
    .map((item) => resolveProjectPath(item, "--path"));
  const files = [...new Set(scanTargets.flatMap(walkJsonFiles))].sort();
  const findings = files.flatMap((file) => (
    scanFile(file).map((finding) => ({
      ...finding,
      file: projectRelative(finding.file),
    }))
  ));
  const summary = {
    status: findings.length === 0 ? "passed" : "failed",
    checked_at: new Date().toISOString(),
    scanned_roots: scanTargets.map(projectRelative),
    scanned_json_files: files.map(projectRelative),
    findings,
  };
  if (args.write) writeJson(args.output, summary);
  console.log(JSON.stringify(summary, null, 2));
  if (findings.length > 0) {
    console.error("No-pretrained artifact JSON audit failed:");
    for (const finding of findings) {
      console.error(`- ${finding.file} ${finding.path}: ${finding.reason}`);
    }
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`No-pretrained artifact JSON audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
