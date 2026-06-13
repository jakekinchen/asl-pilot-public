import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { validateFinalValidationEvidence } from "./final_evidence_contract.mjs";

const root = path.resolve(import.meta.dirname, "..");
const defaultValidationReport = path.join(root, "artifacts", "rawframe-model", "validation-report.json");
const defaultCalibratedProvenance = path.join(root, "artifacts", "rawframe-model", "calibrated-provenance.json");
const defaultOutput = path.join(root, "docs", "validation", "validation-report.md");
const targetNegativeChallengeFalsePassRate = 0.05;

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (["--validation-report", "--calibrated-provenance", "--output", "--generated-at"].includes(item)) {
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
  node scripts/promote_validation_report_doc.mjs \\
    [--validation-report artifacts/rawframe-model/validation-report.json] \\
    [--calibrated-provenance artifacts/rawframe-model/calibrated-provenance.json] \\
    [--output docs/validation/validation-report.md] [--generated-at ISO_DATE] [--dry-run]

Generates the human-readable final validation report from final signer-disjoint
validation JSON and calibrated provenance. Smoke reports are rejected.
`);
}

function resolveProjectPath(value, context, mustExist = true) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${context} escapes project root: ${value}`);
  }
  if (mustExist && !fs.existsSync(resolved)) {
    throw new Error(`${context} does not exist: ${relative(resolved)}`);
  }
  return resolved;
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function percent(value) {
  return `${(Number(value) * 100).toFixed(2)}%`;
}

function metric(value) {
  return Number(value).toFixed(4);
}

function isIsoDate(value) {
  return typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}

function verifyReference(reference, context, findings) {
  if (!reference || typeof reference !== "object" || Array.isArray(reference)) {
    findings.push(`${context} must be an object`);
    return;
  }
  if (typeof reference.path !== "string" || reference.path.trim().length === 0) {
    findings.push(`${context}.path must be a non-empty string`);
    return;
  }
  if (typeof reference.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(reference.sha256)) {
    findings.push(`${context}.sha256 must be a lowercase SHA-256 digest`);
    return;
  }
  const file = resolveProjectPath(reference.path, `${context}.path`);
  const actual = sha256File(file);
  if (actual !== reference.sha256) {
    findings.push(`${context}.sha256 mismatch for ${reference.path}; expected ${reference.sha256}, got ${actual}`);
  }
}

function validateInputs(validation, calibrated, paths) {
  const findings = [];
  findings.push(...validateFinalValidationEvidence({
    validation,
    calibrated,
    validationPath: paths.validationPath,
    calibratedPath: paths.calibratedPath,
  }));
  if (validation.status !== "candidate_final_validation_passed") {
    findings.push(`validation report status must be candidate_final_validation_passed; found ${validation.status}`);
  }
  if (Array.isArray(validation.smoke_reasons) && validation.smoke_reasons.length > 0) {
    findings.push("validation report smoke_reasons must be empty for final markdown");
  }
  if (!validation.pass_status || !Object.values(validation.pass_status).every((value) => value === true)) {
    findings.push("validation report pass_status must all be true");
  }
  if (!Array.isArray(validation.manifests)) {
    findings.push("validation report manifests must be an array");
  } else {
    const splits = validation.manifests.map((manifest) => manifest?.split);
    const requiredSplits = ["train", "validation", "test"];
    for (const split of requiredSplits) {
      if (!splits.includes(split)) findings.push(`validation report manifests must include ${split}`);
    }
    if (splits.length !== requiredSplits.length || new Set(splits).size !== requiredSplits.length) {
      findings.push("validation report manifests must contain exactly train, validation, and test");
    }
  }
  verifyReference(validation.model?.checkpoint, "validation.model.checkpoint", findings);
  verifyReference(validation.model?.training_provenance, "validation.model.training_provenance", findings);
  for (const manifest of validation.manifests ?? []) {
    verifyReference({ path: manifest.path, sha256: manifest.sha256 }, `validation manifest ${manifest.split}`, findings);
  }
  if (!validation.negative_challenge || typeof validation.negative_challenge !== "object") {
    findings.push("validation report must include negative_challenge evidence");
  } else {
    verifyReference(validation.negative_challenge.manifest, "validation.negative_challenge.manifest", findings);
    const falsePassRate = validation.negative_challenge.metrics?.false_pass_rate;
    if (typeof falsePassRate !== "number" || falsePassRate >= targetNegativeChallengeFalsePassRate) {
      findings.push(`negative challenge false_pass_rate must be below ${targetNegativeChallengeFalsePassRate}`);
    }
    for (const requiredType of ["empty_camera", "no_hands_visible", "low_light", "off_center"]) {
      if ((validation.negative_challenge.metrics?.by_type?.[requiredType]?.examples ?? 0) < 5) {
        findings.push(`negative challenge type ${requiredType} must include at least 5 examples`);
      }
    }
  }
  if (calibrated.validation_report?.path !== relative(paths.validationPath)) {
    findings.push("calibrated provenance validation_report.path must match validation report");
  }
  if (calibrated.validation_report?.sha256 !== sha256File(paths.validationPath)) {
    findings.push("calibrated provenance validation_report.sha256 must match validation report");
  }
  if (calibrated.threshold_policy?.type !== "fail_closed") {
    findings.push("calibrated provenance threshold_policy.type must be fail_closed");
  }
  if (typeof calibrated.threshold_policy?.selected_threshold !== "number") {
    findings.push("calibrated provenance selected_threshold must be numeric");
  }
  if (findings.length > 0) {
    throw new Error(findings.join("; "));
  }
}

function buildReport(validation, calibrated, paths, generatedAt) {
  const threshold = calibrated.threshold_policy.selected_threshold;
  const falsePassRate = validation.test.threshold_metrics.false_pass_rate;
  const negativeFalsePassRate = validation.negative_challenge.metrics.false_pass_rate;
  const manifestRows = validation.manifests.map((manifest) => (
    `| ${manifest.split} | ${manifest.dataset_id} | ${manifest.label_count} | ${manifest.clip_count} | \`${manifest.path}\` | \`${manifest.sha256}\` |`
  )).join("\n");
  const challengeRows = Object.entries(validation.negative_challenge.metrics.by_type)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([challengeType, row]) => (
      `| ${challengeType} | ${row.examples} | ${row.false_pass_count} | ${percent(row.false_pass_rate)} | ${metric(row.max_confidence)} |`
    ))
    .join("\n");

  return `# Validation Report

<!-- asl-pilot-validation-report:v1 -->

Generated: ${generatedAt}

## Status

Final signer-disjoint validation passed for the trained ASL pilot model under the controlled pilot conditions below.

## Artifact Bindings

| Artifact | Path | SHA-256 |
| --- | --- | --- |
| Validation report JSON | \`${relative(paths.validationPath)}\` | \`${sha256File(paths.validationPath)}\` |
| Calibrated provenance JSON | \`${relative(paths.calibratedPath)}\` | \`${sha256File(paths.calibratedPath)}\` |
| Checkpoint | \`${validation.model.checkpoint.path}\` | \`${validation.model.checkpoint.sha256}\` |
| Training provenance | \`${validation.model.training_provenance.path}\` | \`${validation.model.training_provenance.sha256}\` |
| Negative challenge manifest | \`${validation.negative_challenge.manifest.path}\` | \`${validation.negative_challenge.manifest.sha256}\` |

## Controlled Pilot Conditions

- Browser: modern desktop browser with camera support.
- Camera: built-in or external webcam.
- Lighting: even front lighting; avoid backlighting.
- Framing: upper torso and hands visible; hands remain inside the camera frame.
- Distance: approximately 0.8-1.5 meters from the camera.
- Signing: isolated vocabulary sign only, one prompt at a time.

## Accuracy Targets And Results

| Measure | Target | Result | Pass |
| --- | --- | --- | --- |
| Test top-1 accuracy | ${percent(validation.targets.top1_accuracy)} or higher | ${percent(validation.test.top1_accuracy)} | ${validation.pass_status.top1_accuracy ? "yes" : "no"} |
| Test macro F1 | ${metric(validation.targets.macro_f1)} or higher | ${metric(validation.test.macro_f1)} | ${validation.pass_status.macro_f1 ? "yes" : "no"} |
| Test false-pass rate | below ${percent(validation.targets.false_pass_rate_below)} | ${percent(falsePassRate)} | ${validation.pass_status.false_pass_rate ? "yes" : "no"} |
| Negative challenge false-pass rate | below ${percent(validation.targets.negative_challenge_false_pass_rate_below)} | ${percent(negativeFalsePassRate)} | ${validation.pass_status.negative_challenge_false_pass_rate ? "yes" : "no"} |

## Confidence Threshold

The calibrated fail-closed threshold is \`${metric(threshold)}\`.

- Selection rule: ${calibrated.threshold_policy.selection_rule}
- Validation false-pass rate at selected threshold: ${percent(calibrated.threshold_policy.validation_false_pass_rate)}
- Negative challenge false-pass rate at selected threshold: ${percent(negativeFalsePassRate)}

## Split Manifests

| Split | Dataset ID | Labels | Clips | Path | SHA-256 |
| --- | --- | ---: | ---: | --- | --- |
${manifestRows}

## Negative Challenge Results

| Challenge Type | Examples | False Passes | False-Pass Rate | Max Confidence |
| --- | ---: | ---: | ---: | ---: |
${challengeRows}

## Known Limitations

${(validation.known_limitations ?? []).map((item) => `- ${item}`).join("\n")}
`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const validationPath = args["validation-report"]
    ? resolveProjectPath(args["validation-report"], "--validation-report")
    : defaultValidationReport;
  const calibratedPath = args["calibrated-provenance"]
    ? resolveProjectPath(args["calibrated-provenance"], "--calibrated-provenance")
    : defaultCalibratedProvenance;
  const outputPath = args.output ? resolveProjectPath(args.output, "--output", false) : defaultOutput;
  const validation = readJson(validationPath);
  const calibrated = readJson(calibratedPath);
  const generatedAt = args["generated-at"] ?? new Date().toISOString();
  if (!isIsoDate(generatedAt)) {
    throw new Error("--generated-at must be an ISO-compatible date string");
  }
  validateInputs(validation, calibrated, { validationPath, calibratedPath });
  const markdown = buildReport(validation, calibrated, { validationPath, calibratedPath }, generatedAt);
  if (!args.dryRun) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, markdown, "utf8");
  }
  console.log(JSON.stringify({
    status: args.dryRun ? "dry_run_valid" : "promoted",
    output: relative(outputPath),
    validation_report_sha256: sha256File(validationPath),
    calibrated_provenance_sha256: sha256File(calibratedPath),
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Validation report doc promotion failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
