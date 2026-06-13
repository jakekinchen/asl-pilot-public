import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  defaultReviewPacketPath,
  defaultReviewReceiptPath,
  defaultReviewerAuthorityPath,
  projectRelative,
  readJson,
  resolveProjectPath,
  root,
} from "./vocabulary_review_utils.mjs";

const defaultPlanOutputPath = path.join(root, "data", "dataset", "collection-plan.json");
const defaultBundleOutputPath = path.join(root, "output", "collection-handoff", "collection-session-bundle");

function parseArgs(argv) {
  const args = {
    input: defaultReviewPacketPath,
    planOutput: defaultPlanOutputPath,
    bundleOutput: defaultBundleOutputPath,
    apply: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--apply") {
      args.apply = true;
      continue;
    }
    if (item === "--input" || item === "--reviewer-receipt" || item === "--plan-output" || item === "--bundle-output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      if (item === "--input") args.input = value;
      if (item === "--reviewer-receipt") args.reviewerReceipt = value;
      if (item === "--plan-output") args.planOutput = value;
      if (item === "--bundle-output") args.bundleOutput = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/process_returned_vocabulary_review.mjs \\
    --input data/vocabulary-review/asl-pilot-vocabulary-review.json

  node scripts/process_returned_vocabulary_review.mjs \\
    --input data/vocabulary-review/asl-pilot-vocabulary-review.json \\
    --apply

  node scripts/process_returned_vocabulary_review.mjs \\
    --input data/vocabulary-review/asl-pilot-vocabulary-review.json \\
    --reviewer-receipt /path/to/returned/asl-pilot-vocabulary-reviewer-receipt.json

  node scripts/process_returned_vocabulary_review.mjs \\
    --input data/vocabulary-review/asl-pilot-vocabulary-review.json \\
    --plan-output data/dataset/collection-plan.json \\
    --bundle-output output/collection-handoff/collection-session-bundle \\
    --apply

Validates a returned reviewer JSON packet and matching signed reviewer receipt.
Without --apply, this only dry-runs the import. --reviewer-receipt is for
read-only dry-run triage only. Before --apply, stage the returned signed receipt
at ${projectRelative(defaultReviewReceiptPath)} and the trusted reviewer key
record at ${projectRelative(defaultReviewerAuthorityPath)}. With --apply, it imports final
vocabulary review evidence, regenerates the reviewed collection plan, writes the
operator collection bundle, and runs the collection launch gates.
`);
}

function runStep(id, command, args, options = {}) {
  const commandArgv = [command, ...args];
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
  });
  const output = {
    id,
    command: commandArgv.join(" "),
    command_argv: commandArgv,
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
  if (result.status !== 0 && !options.allowFailure) {
    const error = new Error(`${id} failed`);
    error.step = output;
    throw error;
  }
  return output;
}

function normalizeStep(step) {
  return {
    id: step.id,
    command: step.command,
    command_argv: Array.isArray(step.command_argv) ? step.command_argv : null,
    status: step.status,
    stdout: summarizeText(step.stdout),
    stderr: summarizeText(step.stderr),
  };
}

function summarizeText(text) {
  if (!text) return "";
  if (text.length <= 4000) return text;
  return `${text.slice(0, 4000)}\n...truncated...`;
}

function readPlanSummary(planOutputPath) {
  if (!fs.existsSync(planOutputPath)) return null;
  const plan = readJson(planOutputPath);
  return {
    path: projectRelative(planOutputPath),
    review_gate_status: plan.review_gate?.status ?? null,
    vocabulary_labels: plan.targets?.vocabulary_labels ?? null,
    assignment_count: plan.assignment_count ?? null,
    negative_challenge_assignment_count: plan.negative_challenge_assignment_count ?? null,
    warnings: Array.isArray(plan.warnings) ? plan.warnings : [],
  };
}

function readBundleSummary(bundleOutputPath) {
  const manifestPath = path.join(bundleOutputPath, "MANIFEST.json");
  if (!fs.existsSync(manifestPath)) return null;
  const manifest = readJson(manifestPath);
  return {
    path: projectRelative(bundleOutputPath),
    status: manifest.status ?? null,
    manifest_path: projectRelative(manifestPath),
    manifest_sha256: fs.existsSync(manifestPath)
      ? crypto.createHash("sha256").update(fs.readFileSync(manifestPath)).digest("hex")
      : null,
    signer_sheets: Array.isArray(manifest.files)
      ? manifest.files.filter((file) => String(file.path ?? "").includes("/signer-sheets/")).length
      : null,
    files: Array.isArray(manifest.files) ? manifest.files.length + 2 : null,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }

  const inputPath = resolveProjectPath(args.input, "--input");
  const reviewerReceiptPath = args.reviewerReceipt
    ? resolveProjectPath(args.reviewerReceipt, "--reviewer-receipt")
    : null;
  if (args.apply && reviewerReceiptPath) {
    throw new Error("Final vocabulary review import requires the canonical reviewer receipt path; copy the signed receipt to data/vocabulary-review/asl-pilot-vocabulary-reviewer-receipt.json before --apply");
  }
  const planOutputPath = resolveProjectPath(args.planOutput, "--plan-output");
  const bundleOutputPath = resolveProjectPath(args.bundleOutput, "--bundle-output");
  const inputRelativePath = projectRelative(inputPath);
  const reviewerReceiptRelativePath = reviewerReceiptPath
    ? projectRelative(reviewerReceiptPath)
    : projectRelative(defaultReviewReceiptPath);
  const reviewerReceiptArgs = reviewerReceiptPath
    ? ["--reviewer-receipt", reviewerReceiptRelativePath]
    : [];
  const planOutputRelativePath = projectRelative(planOutputPath);
  const bundleOutputRelativePath = projectRelative(bundleOutputPath);
  const steps = [];

  try {
    steps.push(runStep("review_import_dry_run", "node", [
      "scripts/import_vocabulary_review.mjs",
      "--input",
      inputRelativePath,
      ...reviewerReceiptArgs,
      "--dry-run",
    ]));

    if (!args.apply) {
      const applyCommandArgv = [
        "node",
        "scripts/process_returned_vocabulary_review.mjs",
        "--input",
        inputRelativePath,
        "--apply",
      ];
      const applyCommand = applyCommandArgv.join(" ");
      console.log(JSON.stringify({
        status: "dry_run_valid",
        input: inputRelativePath,
        reviewer_receipt: reviewerReceiptRelativePath,
        apply_required_for_next_state: true,
        canonical_reviewer_receipt: projectRelative(defaultReviewReceiptPath),
        canonical_reviewer_authority: projectRelative(defaultReviewerAuthorityPath),
        next_required_action: reviewerReceiptPath
          ? `Copy the signed reviewer receipt to ${projectRelative(defaultReviewReceiptPath)} and stage ${projectRelative(defaultReviewerAuthorityPath)} before running --apply.`
          : `Run the apply command after confirming the canonical signed reviewer receipt and ${projectRelative(defaultReviewerAuthorityPath)} are staged.`,
        next_command: applyCommand,
        next_command_argv: applyCommandArgv,
        steps: steps.map(normalizeStep),
      }, null, 2));
      return 0;
    }

    steps.push(runStep("review_import_apply", "node", [
      "scripts/import_vocabulary_review.mjs",
      "--input",
      inputRelativePath,
      ...reviewerReceiptArgs,
    ]));
    steps.push(runStep("vocabulary_review_audit", "node", ["scripts/audit_vocabulary_review.mjs"]));
    steps.push(runStep("hint_pedagogy_review_audit", "node", ["scripts/audit_hint_pedagogy_review.mjs"]));
    steps.push(runStep("reviewed_collection_plan", "node", [
      "scripts/plan_dataset_collection.mjs",
      "--output",
      planOutputRelativePath,
    ]));
    steps.push(runStep("reviewed_vocabulary_collection_gate", "node", [
      "scripts/audit_reviewed_vocabulary_collection_gate.mjs",
    ]));
    steps.push(runStep("collection_plan_freshness", "node", [
      "scripts/audit_collection_plan_freshness.mjs",
    ]));
    steps.push(runStep("collection_plan_contract", "node", [
      "scripts/audit_collection_plan_contract.mjs",
    ]));
    steps.push(runStep("collection_session_bundle", "node", [
      "scripts/prepare_collection_session_bundle.mjs",
      "--plan",
      planOutputRelativePath,
      "--output",
      bundleOutputRelativePath,
    ]));
    steps.push(runStep("collection_session_bundle_audit", "node", [
      "scripts/audit_collection_session_bundle.mjs",
      "--require-ready",
      "--plan",
      planOutputRelativePath,
      "--bundle",
      bundleOutputRelativePath,
    ]));

    console.log(JSON.stringify({
      status: "ready_for_collection_capture",
      input: inputRelativePath,
      reviewer_receipt: reviewerReceiptRelativePath,
      plan: readPlanSummary(planOutputPath),
      collection_bundle: readBundleSummary(bundleOutputPath),
      collection_mode_command: [
        "cd web",
        "ENABLE_DATASET_COLLECTION=true NEXT_PUBLIC_ENABLE_DATASET_COLLECTION=true npm run dev -- --hostname 127.0.0.1 --port 3025",
      ],
      next_required_human_step: "Run supervised consented collection sessions from the reviewed collection plan.",
      steps: steps.map(normalizeStep),
    }, null, 2));
    return 0;
  } catch (error) {
    if (error?.step) steps.push(error.step);
    console.log(JSON.stringify({
      status: "blocked",
      input: inputRelativePath,
      reviewer_receipt: reviewerReceiptRelativePath,
      apply_requested: args.apply,
      blocker: error instanceof Error ? error.message : String(error),
      steps: steps.map(normalizeStep),
    }, null, 2));
    console.error(`Returned vocabulary review processing failed: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Returned vocabulary review processing failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
