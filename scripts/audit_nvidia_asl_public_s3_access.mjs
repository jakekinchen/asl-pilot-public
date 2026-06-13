import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const inventoryDir = path.join(root, "artifacts", "dataset-research", "nvidia-asl", "s3-inventory");
const defaultOutputPath = path.join(root, "docs", "research", "nvidia-asl-public-s3-access-audit.json");
const schemaVersion = "asl-pilot-nvidia-asl-public-s3-access-audit/v1";

const evidenceFiles = {
  awsVersion: "aws-version.txt",
  topLevelLsError: "top-level-ls-error.txt",
  topLevelLsUsEast1: "top-level-ls-us-east-1.txt",
  recursiveLsHumanSummarize: "recursive-ls-human-summarize.txt",
  s3apiListObjects: "s3api-list-objects-error.txt",
  s3apiListObjectsUsEast1: "s3api-list-objects-us-east-1.txt",
  s3apiHeadBucket: "s3api-head-bucket.txt",
  syncRootError: "sync-root-error.txt",
  httpsBucketRootGlobalHeaders: "https-bucket-root-global.headers",
  httpsBucketRootGlobalXml: "https-bucket-root-global.xml",
  httpsBucketRootRegionalHeaders: "https-bucket-root.headers",
  httpsBucketRootRegionalXml: "https-bucket-root.xml",
  openDataRegistryYaml: "asl_1000.yaml",
  githubLicensePdf: "NVIDIA-Data-License-ASL-GitHub.pdf",
};

function parseArgs(argv) {
  const args = { write: false, output: defaultOutputPath };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") args.help = true;
    else if (item === "--write") args.write = true;
    else if (item === "--output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --output");
      args.output = resolveProjectPath(value, item);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${item}`);
    }
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/audit_nvidia_asl_public_s3_access.mjs [--write]

Audits retained evidence for anonymous ASL 1000 S3 access. This does not
approve NVIDIA data for training, does not import media, and does not modify
manifests.
`);
}

function resolveProjectPath(value, context) {
  const resolved = path.resolve(root, value);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${context} escapes project root: ${value}`);
  }
  return resolved;
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readTextIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function fileReference(relativePath) {
  const file = path.join(root, relativePath);
  return {
    path: relativePath,
    exists: fs.existsSync(file),
    sha256: fs.existsSync(file) ? sha256File(file) : null,
    bytes: fs.existsSync(file) ? fs.statSync(file).size : null,
  };
}

function inventoryReference(fileName) {
  return fileReference(path.join("artifacts", "dataset-research", "nvidia-asl", "s3-inventory", fileName));
}

function listFilesIfDirectory(dir) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return [];
  const files = [];
  function visit(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) visit(fullPath);
      else if (entry.isFile()) files.push(fullPath);
    }
  }
  visit(dir);
  return files;
}

function containsAny(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

function buildAudit() {
  const blockers = [];
  const awsVersionText = readTextIfExists(path.join(inventoryDir, evidenceFiles.awsVersion)).trim();
  const topLevelText = readTextIfExists(path.join(inventoryDir, evidenceFiles.topLevelLsError));
  const recursiveText = readTextIfExists(path.join(inventoryDir, evidenceFiles.recursiveLsHumanSummarize));
  const syncText = readTextIfExists(path.join(inventoryDir, evidenceFiles.syncRootError));
  const headBucketText = readTextIfExists(path.join(inventoryDir, evidenceFiles.s3apiHeadBucket));
  const globalRootXml = readTextIfExists(path.join(inventoryDir, evidenceFiles.httpsBucketRootGlobalXml));
  const regionalRootXml = readTextIfExists(path.join(inventoryDir, evidenceFiles.httpsBucketRootRegionalXml));
  const registryYaml = readTextIfExists(path.join(inventoryDir, evidenceFiles.openDataRegistryYaml));
  const localDatasetFiles = listFilesIfDirectory(path.join(root, "asl-1000"));
  const hasAccessDenied = containsAny(
    [topLevelText, recursiveText, syncText, headBucketText, globalRootXml].join("\n"),
    ["AccessDenied", "Access Denied", "403", "Forbidden"],
  );
  const regionalRedirected = regionalRootXml.includes("PermanentRedirect") &&
    regionalRootXml.includes("<Endpoint>s3.amazonaws.com</Endpoint>");
  const registryNamesControlledAccess = /ControlledAccess:/i.test(registryYaml);
  const registrySaysUsEast2 = /Region:\s*us-east-2/i.test(registryYaml);

  if (!awsVersionText.includes("aws-cli/")) blockers.push("AWS CLI version evidence is missing or invalid.");
  if (!registryYaml.includes("arn:aws:s3:::trustworthyaiproduct")) {
    blockers.push("Open Data Registry YAML evidence does not mention arn:aws:s3:::trustworthyaiproduct.");
  }
  if (!hasAccessDenied) blockers.push("No retained anonymous S3 AccessDenied/403 evidence was found.");
  if (localDatasetFiles.length > 0) blockers.push("Local ./asl-1000 contains files, so this audit is no longer metadata-only.");

  return {
    schema_version: schemaVersion,
    status: blockers.length === 0
      ? "blocked_public_s3_access_denied_no_dataset_downloaded"
      : "incomplete_public_s3_access_evidence",
    checked_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: {
        path: "scripts/audit_nvidia_asl_public_s3_access.mjs",
        sha256: sha256File(path.join(root, "scripts", "audit_nvidia_asl_public_s3_access.mjs")),
      },
    },
    decision_boundary: {
      approves_training_use: false,
      downloads_dataset_media: false,
      imports_media_to_manifests: false,
      changes_source_register: false,
      trains_or_promotes_model: false,
    },
    commands_attempted: [
      "brew install awscli",
      "aws --version",
      "aws s3 ls --no-sign-request s3://trustworthyaiproduct/ --region us-east-2",
      "aws s3 ls --no-sign-request s3://trustworthyaiproduct/ --recursive --human-readable --summarize --region us-east-2",
      "aws s3api list-objects-v2 --no-sign-request --bucket trustworthyaiproduct --region us-east-2 --max-keys 20",
      "aws s3api head-bucket --no-sign-request --bucket trustworthyaiproduct --region us-east-2",
      "aws s3 sync --no-sign-request s3://trustworthyaiproduct/ ./asl-1000 --region us-east-2",
      "aws s3 ls --no-sign-request s3://trustworthyaiproduct/ --region us-east-1",
      "aws s3api list-objects-v2 --no-sign-request --bucket trustworthyaiproduct --region us-east-1 --max-keys 20",
    ],
    environment: {
      aws_version: awsVersionText || null,
      aws_cli_runtime_note:
        "Homebrew awscli initially required expat repair on this machine because pyexpat loaded the system libexpat and failed before startup; pyexpat was relinked to Homebrew expat and ad-hoc re-signed so plain aws now runs.",
    },
    registry_evidence: {
      open_data_registry_yaml: inventoryReference(evidenceFiles.openDataRegistryYaml),
      github_license_pdf: inventoryReference(evidenceFiles.githubLicensePdf),
      bucket_arn: registryYaml.includes("arn:aws:s3:::trustworthyaiproduct")
        ? "arn:aws:s3:::trustworthyaiproduct"
        : null,
      registry_region: registrySaysUsEast2 ? "us-east-2" : null,
      registry_names_controlled_access: registryNamesControlledAccess,
    },
    s3_access_evidence: {
      top_level_ls_us_east_2: inventoryReference(evidenceFiles.topLevelLsError),
      recursive_ls_us_east_2: inventoryReference(evidenceFiles.recursiveLsHumanSummarize),
      s3api_list_objects_us_east_2: inventoryReference(evidenceFiles.s3apiListObjects),
      s3api_head_bucket_us_east_2: inventoryReference(evidenceFiles.s3apiHeadBucket),
      sync_root_us_east_2: inventoryReference(evidenceFiles.syncRootError),
      top_level_ls_us_east_1: inventoryReference(evidenceFiles.topLevelLsUsEast1),
      s3api_list_objects_us_east_1: inventoryReference(evidenceFiles.s3apiListObjectsUsEast1),
      https_bucket_root_regional: {
        headers: inventoryReference(evidenceFiles.httpsBucketRootRegionalHeaders),
        body: inventoryReference(evidenceFiles.httpsBucketRootRegionalXml),
        permanent_redirect_to_global_endpoint: regionalRedirected,
      },
      https_bucket_root_global: {
        headers: inventoryReference(evidenceFiles.httpsBucketRootGlobalHeaders),
        body: inventoryReference(evidenceFiles.httpsBucketRootGlobalXml),
        access_denied: globalRootXml.includes("AccessDenied"),
      },
      observed_bucket_region_from_s3: /x-amz-bucket-region:\s*us-east-1/i.test(
        readTextIfExists(path.join(inventoryDir, evidenceFiles.httpsBucketRootGlobalHeaders)),
      )
        ? "us-east-1"
        : null,
    },
    local_dataset_target: {
      path: "asl-1000",
      exists: fs.existsSync(path.join(root, "asl-1000")),
      file_count: localDatasetFiles.length,
      files: localDatasetFiles.slice(0, 25).map(projectRelative),
    },
    project_state: {
      nvidia_asl_1000_status: "blocked_pending_nvidia_controlled_access",
      anonymous_s3_status: "expected_403_after_registry_controlledaccess_review",
      training_use: "none",
      import_use: "none",
      next_action: "submit_nvidia_access_request_and_request_current_delivery_method",
    },
    blockers,
    conclusion: {
      access_result:
        "Anonymous S3 access is currently denied for list/head/sync from this machine even though Marketplace/registry evidence names the bucket.",
      training_status: "not_approved_not_downloaded_not_imported",
      recommended_next_action:
        "Contact trustworthyaiprojects@nvidia.com or AWS Marketplace/Open Data support with the retained AccessDenied request evidence, then retry anonymous list/sync only after the bucket policy is fixed or exact authorized object keys are provided.",
    },
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const audit = buildAudit();
  if (args.write) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, stableJson(audit), "utf8");
  }
  console.log(stableJson({
    status: audit.status,
    output: args.write ? projectRelative(args.output) : null,
    aws_version: audit.environment.aws_version,
    local_dataset_file_count: audit.local_dataset_target.file_count,
    observed_bucket_region_from_s3: audit.s3_access_evidence.observed_bucket_region_from_s3,
    registry_region: audit.registry_evidence.registry_region,
    registry_names_controlled_access: audit.registry_evidence.registry_names_controlled_access,
    blocker_count: audit.blockers.length,
    recommended_next_action: audit.conclusion.recommended_next_action,
  }));
  return audit.status === "blocked_public_s3_access_denied_no_dataset_downloaded" ? 1 : 2;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`NVIDIA ASL public S3 access audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
