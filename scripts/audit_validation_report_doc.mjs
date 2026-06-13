import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { validateFinalValidationEvidence } from "./final_evidence_contract.mjs";

const root = path.resolve(import.meta.dirname, "..");
const defaultMarkdownPath = path.join(root, "docs", "validation", "validation-report.md");
const defaultValidationReport = path.join(root, "artifacts", "rawframe-model", "validation-report.json");
const defaultCalibratedProvenance = path.join(root, "artifacts", "rawframe-model", "calibrated-provenance.json");
const marker = "<!-- asl-pilot-validation-report:v1 -->";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--allow-noncanonical") {
      args.allowNoncanonical = true;
      continue;
    }
    if (["--report", "--validation-report", "--calibrated-provenance"].includes(item)) {
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
  node scripts/audit_validation_report_doc.mjs \\
    [--report docs/validation/validation-report.md] \\
    [--validation-report artifacts/rawframe-model/validation-report.json] \\
    [--calibrated-provenance artifacts/rawframe-model/calibrated-provenance.json] \\
    [--allow-noncanonical]

Fails until the human-readable validation report is generated from final
signer-disjoint validation JSON and calibrated provenance.
`);
}

function resolveProjectPath(value, context) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${context} escapes project root: ${value}`);
  }
  return resolved;
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function requireContains(markdown, value, context, blockers) {
  if (!markdown.includes(value)) blockers.push(`validation-report.md must include ${context}: ${value}`);
}

function promoterArgs(markdownPath, validationPath, calibratedPath, generatedAt, dryRun) {
  return [
    "scripts/promote_validation_report_doc.mjs",
    ...(dryRun ? ["--dry-run"] : []),
    "--validation-report",
    relative(validationPath),
    "--calibrated-provenance",
    relative(calibratedPath),
    "--output",
    relative(markdownPath),
    "--generated-at",
    generatedAt,
  ];
}

function runPromoterDryRun(markdownPath, validationPath, calibratedPath, generatedAt, blockers) {
  const result = spawnSync("node", [
    ...promoterArgs(markdownPath, validationPath, calibratedPath, generatedAt, true),
  ], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    blockers.push(
      `validation-report promoter dry-run failed: ${result.stderr.trim() || result.stdout.trim()}`,
    );
  }
}

function generatedAtFromMarkdown(markdown, blockers) {
  const match = markdown.match(/^Generated:\s*(.+)$/m);
  if (!match) {
    blockers.push("validation-report.md must include a Generated: ISO timestamp line from the promoter");
    return null;
  }
  const generatedAt = match[1].trim();
  if (!Number.isNaN(Date.parse(generatedAt)) && !generatedAt.includes("YYYY")) return generatedAt;
  blockers.push("validation-report.md Generated line must contain a real ISO-compatible timestamp");
  return null;
}

function requireExactPromoterOutput(markdown, markdownPath, validationPath, calibratedPath, generatedAt, blockers) {
  if (!generatedAt) return;
  const tempRoot = path.join(root, "output");
  fs.mkdirSync(tempRoot, { recursive: true });
  const tempDir = fs.mkdtempSync(path.join(tempRoot, "validation-report-audit-"));
  try {
    const tempOutput = path.join(tempDir, "validation-report.md");
    const result = spawnSync("node", promoterArgs(tempOutput, validationPath, calibratedPath, generatedAt, false), {
      cwd: root,
      encoding: "utf8",
    });
    if (result.status !== 0) {
      blockers.push(
        `validation-report promoter exact-output generation failed: ${result.stderr.trim() || result.stdout.trim()}`,
      );
      return;
    }
    const expected = fs.readFileSync(tempOutput, "utf8");
    if (markdown !== expected) {
      blockers.push("validation-report.md must match scripts/promote_validation_report_doc.mjs output byte-for-byte");
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function validate(markdownPath, validationPath, calibratedPath, allowNoncanonical) {
  const blockers = [];
  if (!allowNoncanonical) {
    for (const [context, actual, expected] of [
      ["--report", relative(markdownPath), "docs/validation/validation-report.md"],
      ["--validation-report", relative(validationPath), "artifacts/rawframe-model/validation-report.json"],
      ["--calibrated-provenance", relative(calibratedPath), "artifacts/rawframe-model/calibrated-provenance.json"],
    ]) {
      if (actual !== expected) {
        blockers.push(`${context} must use canonical final path ${expected}; pass --allow-noncanonical only for nonfinal local checks`);
      }
    }
  }
  if (!fs.existsSync(markdownPath)) blockers.push(`Validation report markdown is missing: ${relative(markdownPath)}`);
  if (!fs.existsSync(validationPath)) blockers.push(`Validation report JSON is missing: ${relative(validationPath)}`);
  if (!fs.existsSync(calibratedPath)) blockers.push(`Calibrated provenance JSON is missing: ${relative(calibratedPath)}`);
  if (blockers.length > 0) return blockers;

  const markdown = fs.readFileSync(markdownPath, "utf8");
  const validation = readJson(validationPath);
  const calibrated = readJson(calibratedPath);
  blockers.push(...validateFinalValidationEvidence({
    validation,
    calibrated,
    validationPath,
    calibratedPath,
    requireCanonicalPaths: !allowNoncanonical,
  }));
  const generatedAt = generatedAtFromMarkdown(markdown, blockers);
  if (generatedAt) runPromoterDryRun(markdownPath, validationPath, calibratedPath, generatedAt, blockers);
  if (!markdown.includes(marker)) blockers.push(`validation-report.md must include marker ${marker}`);
  if (markdown.includes("Validation is not complete")) {
    blockers.push("validation-report.md still contains incomplete-template language");
  }
  if (validation.status !== "candidate_final_validation_passed") {
    blockers.push(`validation report JSON status must be candidate_final_validation_passed; found ${validation.status}`);
  }
  if (!validation.pass_status || !Object.values(validation.pass_status).every((value) => value === true)) {
    blockers.push("validation report JSON pass_status must all be true");
  }
  if (calibrated.validation_report?.path !== relative(validationPath)) {
    blockers.push("calibrated provenance validation_report.path must match validation report JSON");
  }
  if (calibrated.validation_report?.sha256 !== sha256File(validationPath)) {
    blockers.push("calibrated provenance validation_report.sha256 must match validation report JSON");
  }
  if (calibrated.threshold_policy?.type !== "fail_closed") {
    blockers.push("calibrated provenance threshold_policy.type must be fail_closed");
  }
  if (!Array.isArray(validation.manifests)) {
    blockers.push("validation report JSON manifests must be an array");
  } else {
    const splits = validation.manifests.map((manifest) => manifest?.split);
    for (const split of ["train", "validation", "test"]) {
      if (!splits.includes(split)) blockers.push(`validation report JSON manifests must include ${split}`);
    }
    if (splits.length !== 3 || new Set(splits).size !== 3) {
      blockers.push("validation report JSON manifests must contain exactly train, validation, and test");
    }
  }
  for (const [context, value] of [
    ["validation report JSON path", relative(validationPath)],
    ["validation report JSON hash", sha256File(validationPath)],
    ["calibrated provenance path", relative(calibratedPath)],
    ["calibrated provenance hash", sha256File(calibratedPath)],
    ["checkpoint path", validation.model?.checkpoint?.path],
    ["checkpoint hash", validation.model?.checkpoint?.sha256],
    ["negative challenge manifest path", validation.negative_challenge?.manifest?.path],
    ["negative challenge manifest hash", validation.negative_challenge?.manifest?.sha256],
  ]) {
    if (typeof value === "string" && value.trim()) requireContains(markdown, value, context, blockers);
  }
  for (const manifest of validation.manifests ?? []) {
    requireContains(markdown, manifest.path, `manifest ${manifest.split} path`, blockers);
    requireContains(markdown, manifest.sha256, `manifest ${manifest.split} hash`, blockers);
  }
  requireExactPromoterOutput(markdown, markdownPath, validationPath, calibratedPath, generatedAt, blockers);
  return blockers;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const markdownPath = args.report ? resolveProjectPath(args.report, "--report") : defaultMarkdownPath;
  const validationPath = args["validation-report"]
    ? resolveProjectPath(args["validation-report"], "--validation-report")
    : defaultValidationReport;
  const calibratedPath = args["calibrated-provenance"]
    ? resolveProjectPath(args["calibrated-provenance"], "--calibrated-provenance")
    : defaultCalibratedProvenance;
  const blockers = validate(markdownPath, validationPath, calibratedPath, Boolean(args.allowNoncanonical));
  const summary = {
    status: blockers.length === 0 ? "passed" : "incomplete",
    checked_at: new Date().toISOString(),
    report: {
      path: relative(markdownPath),
      exists: fs.existsSync(markdownPath),
      sha256: fs.existsSync(markdownPath) ? sha256File(markdownPath) : null,
    },
    validation_report: {
      path: relative(validationPath),
      exists: fs.existsSync(validationPath),
      sha256: fs.existsSync(validationPath) ? sha256File(validationPath) : null,
    },
    calibrated_provenance: {
      path: relative(calibratedPath),
      exists: fs.existsSync(calibratedPath),
      sha256: fs.existsSync(calibratedPath) ? sha256File(calibratedPath) : null,
    },
    blockers,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (blockers.length > 0) {
    console.error("Validation report doc audit failed:");
    for (const blocker of blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Validation report doc audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
