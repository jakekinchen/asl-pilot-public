import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

const bannedPackages = [
  /(^|\/)@mediapipe(\/|$)/i,
  /(^|\/)mediapipe/i,
  /(^|\/)openpose/i,
  /(^|\/)posenet/i,
  /(^|\/)bodypix/i,
  /(^|\/)handpose/i,
  /(^|\/)face-api\.js$/i,
  /(^|\/)ml5$/i,
  /(^|\/)coco-ssd$/i,
  /(^|\/)mobilenet$/i,
  /(^|\/)ultralytics/i,
  /(^|\/)yolo/i,
  /(^|\/)@tensorflow-models(\/|$)/i,
  /(^|\/)tensorflow-models/i,
  /(^|\/)@tensorflow\/tfjs/i,
  /(^|\/)tfjs/i,
  /(^|\/)opencv\.js$/i,
  /(^|\/)torchvision$/i,
  /(^|\/)timm$/i,
  /(^|\/)transformers$/i,
  /(^|\/)keras-cv$/i,
  /(^|\/)keras[_-]?applications$/i,
  /(^|\/)resnet/i,
  /(^|\/)efficientnet/i,
  /(^|\/)vision-transformer/i,
  /(^|\/)vit$/i,
  /(^|\/)clip$/i,
];

const manifestFiles = [
  "web/package.json",
  "web/package-lock.json",
  "package.json",
  "package-lock.json",
  "pyproject.toml",
  "requirements.txt",
].map((file) => path.join(root, file));

const findings = [];
const selfPath = path.join(root, "scripts", "audit_no_pretrained_deps.mjs");
const pretrainedGuardrailScriptPaths = new Set([
  selfPath,
  path.join(root, "scripts", "audit_no_pretrained_artifact_json.mjs"),
  path.join(root, "scripts", "audit_guardrail_negative_fixtures.mjs"),
]);

const bannedSourcePatterns = [
  {
    pattern: /\bfrom_pretrained\s*\(/i,
    reason: "loads pretrained model weights through from_pretrained()",
  },
  {
    pattern: /\bhf_hub_download\s*\(/i,
    reason: "downloads model artifacts from Hugging Face Hub",
  },
  {
    pattern: /\bsnapshot_download\s*\(/i,
    reason: "downloads model snapshots from a model hub",
  },
  {
    pattern: /\btorch\.hub\.load\s*\(/i,
    reason: "loads model code or weights through torch.hub",
  },
  {
    pattern: /\bload_state_dict_from_url\s*\(/i,
    reason: "loads pretrained weights from a URL",
  },
  {
    pattern: /\bmodel_zoo\.load_url\s*\(/i,
    reason: "loads pretrained weights from a model zoo URL",
  },
  {
    pattern: /\bpretrained\s*=\s*True\b/,
    reason: "enables pretrained weights through a Python flag",
  },
  {
    pattern: /\bpretrained\s*:\s*true\b/i,
    reason: "enables pretrained weights through a JavaScript option",
  },
  {
    pattern: /\bweights\s*=\s*["'][^"']*(?:DEFAULT|IMAGENET|KINETICS|PRETRAINED)[^"']*["']/i,
    reason: "selects named pretrained weights",
  },
  {
    pattern: /\bweights\s*=\s*[A-Za-z0-9_.]+Weights\.DEFAULT\b/,
    reason: "selects default pretrained torchvision weights",
  },
];

function addFinding(file, value, source) {
  if (bannedPackages.some((pattern) => pattern.test(value))) {
    findings.push({ file: path.relative(root, file), value, source });
  }
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    findings.push({
      file: path.relative(root, file),
      value: error.message,
      source: "invalid JSON",
    });
    return null;
  }
}

function checkPackageJson(file) {
  const pkg = readJson(file);
  if (!pkg) return;
  for (const section of [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
  ]) {
    for (const name of Object.keys(pkg[section] ?? {})) {
      addFinding(file, name, section);
    }
  }
}

function checkPackageLock(file) {
  const lock = readJson(file);
  if (!lock) return;
  for (const [packagePath, details] of Object.entries(lock.packages ?? {})) {
    if (packagePath === "") {
      for (const section of ["dependencies", "devDependencies", "optionalDependencies"]) {
        for (const name of Object.keys(details[section] ?? {})) {
          addFinding(file, name, `lockfile root ${section}`);
        }
      }
      continue;
    }

    const packageName = packagePath.replace(/^node_modules\//, "");
    addFinding(file, details.name ?? packageName, "lockfile package");
  }
}

function checkTextManifest(file) {
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const candidate = line.trim().split(/[<>=~!;\s]/)[0];
    if (candidate) addFinding(file, candidate, "manifest line");
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    if (entry.name === "node_modules" || entry.name === ".next") return [];
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return [fullPath];
  });
}

function checkSourceImports(file) {
  const text = fs.readFileSync(file, "utf8");
  const jsImportPattern =
    /(?:import\s+(?:[^'"]+\s+from\s+)?|export\s+[^'"]+\s+from\s+|require\()\s*['"]([^'"]+)['"]/g;
  for (const match of text.matchAll(jsImportPattern)) {
    addFinding(file, match[1], "source import");
  }
  const pyImportPattern =
    /^\s*(?:from\s+([A-Za-z0-9_.-]+)\s+import|import\s+([A-Za-z0-9_.-]+))/gm;
  for (const match of text.matchAll(pyImportPattern)) {
    addFinding(file, match[1] ?? match[2], "python import");
  }
}

function checkSourcePretrainedLoaders(file) {
  if (pretrainedGuardrailScriptPaths.has(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const banned of bannedSourcePatterns) {
    if (banned.pattern.test(text)) {
      findings.push({
        file: path.relative(root, file),
        value: banned.reason,
        source: "source pretrained-loader pattern",
      });
    }
  }
}

for (const file of manifestFiles) {
  if (!fs.existsSync(file)) continue;
  if (file.endsWith("package.json")) {
    checkPackageJson(file);
  } else if (file.endsWith("package-lock.json")) {
    checkPackageLock(file);
  } else {
    checkTextManifest(file);
  }
}

for (const sourceDir of [path.join(root, "web", "src"), path.join(root, "scripts")]) {
  for (const file of walk(sourceDir)) {
    if (/\.[cm]?[jt]sx?$/.test(file) || /\.py$/.test(file)) {
      checkSourceImports(file);
      checkSourcePretrainedLoaders(file);
    }
  }
}

if (findings.length > 0) {
  console.error("Banned pretrained-CV dependency/imports found:");
  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.value} (${finding.source})`);
  }
  process.exit(1);
}

console.log("No banned pretrained-CV dependencies or source imports found.");
