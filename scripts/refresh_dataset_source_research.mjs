import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultOutputPath = path.join(root, "docs", "research", "dataset-source-research-receipts.json");
const schemaVersion = "asl-pilot-dataset-source-research-receipts/v1";

const sourceChecks = [
  {
    source_id: "nvidia-asl-1000-access",
    display_name: "NVIDIA ASL / ASL 1000 access page",
    url: "https://www.nvidia.com/en-us/gated-resources/trustworthy-ai-american-sign-language/dataset/",
    decision: "candidate_controlled_access_not_approved",
    matched_constraints: [
      {
        id: "raw_video_access_claim",
        pattern: /Users will get access to raw video data/i,
        summary: "Accepted users are told they receive raw video data.",
      },
      {
        id: "license_and_use_case_gate",
        pattern: /Access will be granted based on acceptance of the NVIDIA Dataset License and use case/i,
        summary: "Access is gated by license acceptance and use case.",
      },
      {
        id: "derived_artifacts_documented",
        pattern: /hand landmarks,\s*body poses,\s*and facial meshes/i,
        summary: "The source also offers derived artifacts disallowed for recognition.",
      },
    ],
  },
  {
    source_id: "nvidia-asl-1000-aws",
    display_name: "ASL 1000 AWS Open Data Registry",
    url: "https://registry.opendata.aws/asl_1000/",
    decision: "candidate_controlled_access_not_approved",
    matched_constraints: [
      {
        id: "controlled_access_s3",
        pattern: /S3 Bucket[\s\S]{0,200}Controlled Access/i,
        summary: "AWS lists the dataset resource as controlled access.",
      },
      {
        id: "license_reference",
        pattern: /NVIDIA Dataset License/i,
        summary: "AWS defers license review to NVIDIA terms.",
      },
      {
        id: "video_dataset_claim",
        pattern: /American Sign Language \(ASL\) videos/i,
        summary: "AWS describes the resource as ASL videos.",
      },
    ],
  },
  {
    source_id: "popsign-v2",
    display_name: "PopSign ASL v2",
    url: "https://signdata.cc.gatech.edu/view/datasets/popsign_v2/index.html",
    decision: "blocked_unreleased_underlying_videos_unavailable",
    matched_constraints: [
      {
        id: "dataset_not_released",
        pattern: /This dataset has not been released/i,
        summary: "The official page says the dataset is unreleased.",
      },
      {
        id: "underlying_videos_unavailable",
        pattern: /underlying videos for this dataset are currently unavailable/i,
        summary: "The official page says underlying videos are unavailable.",
      },
    ],
  },
  {
    source_id: "asl-citizen",
    display_name: "ASL Citizen",
    url: "https://www.microsoft.com/en-us/research/project/asl-citizen/dataset-license/",
    decision: "blocked_noncommercial_research_only",
    matched_constraints: [
      {
        id: "noncommercial_research_only",
        pattern: /non-commercial,\s*non-revenue generating,\s*research purposes/i,
        summary: "License scope is limited to non-commercial, non-revenue-generating research.",
      },
      {
        id: "data_distribution_barred",
        pattern: /may not distribute the data or your modifications to the data/i,
        summary: "Data and modified data may not be distributed.",
      },
      {
        id: "personal_data_restricted",
        pattern: /Personal Data[\s\S]{0,500}strict confidence/i,
        summary: "Personal data must remain limited to the original authorized purpose.",
      },
    ],
  },
  {
    source_id: "asllvd",
    display_name: "ASLLVD / ASLLRP DAI",
    url: "https://www.bu.edu/asllrp/av/dai-asllvd.html",
    decision: "blocked_permission_required_commercial_redistribution",
    matched_constraints: [
      {
        id: "research_education_only",
        pattern: /can be used for research and education purposes/i,
        summary: "Terms limit use to research and education purposes.",
      },
      {
        id: "redistribution_permission_required",
        pattern: /cannot be redistributed without permission/i,
        summary: "Redistribution requires permission.",
      },
      {
        id: "commercial_permission_required",
        pattern: /Commercial use,\s*without explicit permission,\s*is not allowed/i,
        summary: "Commercial use requires explicit permission.",
      },
    ],
  },
  {
    source_id: "how2sign",
    display_name: "How2Sign",
    url: "https://how2sign.github.io/",
    decision: "blocked_noncommercial_continuous_sentence_data",
    matched_constraints: [
      {
        id: "continuous_asl_dataset",
        pattern: /continuous American Sign Language \(ASL\) dataset/i,
        summary: "Dataset is continuous ASL rather than isolated vocabulary clips.",
      },
      {
        id: "research_only",
        pattern: /publicly available for research purposes only/i,
        summary: "Project page says the dataset is research-only.",
      },
      {
        id: "noncommercial_license",
        pattern: /Creative Commons Attribution-NonCommercial 4\.0 International License/i,
        summary: "Project page applies a non-commercial Creative Commons license.",
      },
    ],
  },
  {
    source_id: "openasl",
    display_name: "OpenASL",
    url: "https://raw.githubusercontent.com/chevalierNoir/OpenASL/main/README.md",
    decision: "blocked_noncommercial_noderivatives_web_video",
    matched_constraints: [
      {
        id: "open_domain_translation",
        pattern: /Open-Domain Sign Language Translation/i,
        summary: "Dataset is an open-domain translation corpus.",
      },
      {
        id: "web_video_availability_risk",
        pattern: /Some videos may no longer be publicly available/i,
        summary: "Upstream web videos can become unavailable.",
      },
      {
        id: "cc_by_nc_nd_license",
        pattern: /Creative Commons BY-NC-ND 4\.0 License/i,
        summary: "Dataset is licensed under CC BY-NC-ND 4.0.",
      },
    ],
  },
  {
    source_id: "purdue-rvl-slll-asl",
    display_name: "Purdue RVL-SLLL ASL",
    url: "https://engineering.purdue.edu/RVL/Database/ASL/asl-database-front.htm.bk.htm",
    decision: "candidate_signed_license_required",
    matched_constraints: [
      {
        id: "image_video_database",
        pattern: /database of images and videos/i,
        summary: "The official page describes images and videos.",
      },
      {
        id: "username_password_required",
        pattern: /asked to enter a user name and a password/i,
        summary: "Access requires credentials.",
      },
      {
        id: "signed_license_required",
        pattern: /download the[\s\S]{0,120}license agreement[\s\S]{0,120}signed copy/i,
        summary: "Access requires a signed license agreement.",
      },
    ],
  },
  {
    source_id: "huggingface-zahid-asl",
    display_name: "Hugging Face ZahidYasinMittha ASL Dataset",
    url: "https://huggingface.co/datasets/ZahidYasinMittha/American-Sign-Language-Dataset/raw/main/README.md",
    decision: "blocked_scraped_multi_source_provenance_missing",
    matched_constraints: [
      {
        id: "large_raw_video_claim",
        pattern: /108,618 videos/i,
        summary: "Dataset card claims a large video corpus.",
      },
      {
        id: "scraped_multi_source",
        pattern: /scraped,\s*collected from multiple sources/i,
        summary: "Dataset card says videos were scraped from multiple sources.",
      },
      {
        id: "research_education_scope",
        pattern: /research and educational purposes/i,
        summary: "Dataset card presents a research and education use scope.",
      },
    ],
  },
  {
    source_id: "wlasl",
    display_name: "WLASL",
    url: "https://github.com/dxli94/WLASL",
    decision: "blocked_academic_computational_only",
    matched_constraints: [
      {
        id: "c_uda_license",
        pattern: /Computational Use of Data Agreement/i,
        summary: "Dataset is governed by the C-UDA terms.",
      },
      {
        id: "academic_computational_only",
        pattern: /academic and computational use only/i,
        summary: "Dataset is presented as academic and computational use only.",
      },
      {
        id: "commercial_usage_not_allowed",
        pattern: /No commercial usage is allowed/i,
        summary: "Commercial usage is not allowed by the project documentation.",
      },
    ],
  },
  {
    source_id: "wlasl",
    display_name: "WLASL pipeline boundary",
    url: "https://raw.githubusercontent.com/dxli94/WLASL/master/README.md",
    decision: "blocked_external_cv_artifact_boundary",
    matched_constraints: [
      {
        id: "pretrained_weights_documented",
        pattern: /pre-trained Kinetics/i,
        summary: "Reference training instructions include external pre-trained weights.",
      },
      {
        id: "derived_pose_artifacts_documented",
        pattern: /body keypoints/i,
        summary: "Reference pipeline documents derived pose artifacts.",
      },
      {
        id: "bounding_box_metadata_documented",
        pattern: /bbox/i,
        summary: "Reference metadata includes bounding-box fields.",
      },
    ],
  },
  {
    source_id: "asl-lex",
    display_name: "ASL-LEX",
    url: "https://asl-lex.org/download.html",
    decision: "blocked_video_permission_required",
    matched_constraints: [
      {
        id: "noncommercial_database_license",
        pattern: /Creative Commons Attribution-NonCommercial 4\.0 International License/i,
        summary: "Database and visualization are non-commercial.",
      },
      {
        id: "reference_videos_excluded",
        pattern: /excluding sign reference videos/i,
        summary: "Sign reference videos are excluded from the database license.",
      },
      {
        id: "reference_videos_permission_required",
        pattern: /may not be saved, displayed, or otherwise used[\s\S]{0,120}without explicit permission/i,
        summary: "Reference videos require explicit permission for other uses.",
      },
      {
        id: "commercial_use_prohibited",
        pattern: /commercial purposes is expressly prohibited/i,
        summary: "Commercial use is expressly prohibited.",
      },
    ],
  },
];

function parseArgs(argv) {
  const args = { write: false, output: defaultOutputPath };
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
    if (item === "--output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --output");
      args.output = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/refresh_dataset_source_research.mjs [--write] [--output docs/research/dataset-source-research-receipts.json]

Fetches current public ASL dataset/license pages, verifies the deny-by-default
research constraints used by the source register, and writes a small retained
receipt with URL, HTTP status, content hash, and matched decision checks.
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

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function fileReference(relativePath) {
  const file = path.join(root, relativePath);
  return {
    path: relativePath,
    sha256: fs.existsSync(file)
      ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")
      : null,
  };
}

function currentCommand() {
  return [process.execPath, ...process.argv.slice(1)];
}

function normalizeBody(body) {
  return body.replace(/\s+/g, " ").trim();
}

function excerptForMatch(matchText) {
  const normalized = matchText
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, "\"")
    .replace(/\s+/g, " ")
    .trim();
  return normalized.split(" ").slice(0, 8).join(" ");
}

async function fetchSource(config) {
  const response = await fetch(config.url, {
    redirect: "follow",
    headers: {
      "user-agent": "asl-pilot-source-research-audit/1.0",
    },
  });
  const body = await response.text();
  const normalizedBody = normalizeBody(body);
  const matched = config.matched_constraints.map((constraint) => {
    const match = normalizedBody.match(constraint.pattern);
    const matchedTextExcerpt = match ? excerptForMatch(match[0]) : null;
    return {
      id: constraint.id,
      status: match ? "matched" : "missing",
      summary: constraint.summary,
      matched_text_excerpt: matchedTextExcerpt,
      matched_text_excerpt_sha256: matchedTextExcerpt ? sha256Text(matchedTextExcerpt) : null,
    };
  });
  return {
    source_id: config.source_id,
    display_name: config.display_name,
    url: config.url,
    checked_at: new Date().toISOString(),
    http_status: response.status,
    final_url: response.url,
    content_sha256: sha256Text(body),
    normalized_text_sha256: sha256Text(normalizedBody),
    content_length_bytes: Buffer.byteLength(body),
    decision: {
      license_review_status: config.decision,
      allowed_for_model_training: false,
      allowed_for_validation: false,
      allowed_for_pilot_submission: false,
      finality: "research_reference_only",
    },
    matched_constraints: matched,
    blockers: [
      response.ok ? null : `HTTP status was ${response.status}`,
      ...matched
        .filter((item) => item.status !== "matched")
        .map((item) => `Missing expected constraint: ${item.id}`),
    ].filter(Boolean),
  };
}

async function buildReceipt(outputPath) {
  const receipts = [];
  for (const source of sourceChecks) receipts.push(await fetchSource(source));
  const blockers = receipts.flatMap((receipt) => (
    receipt.blockers.map((blocker) => `${receipt.source_id} ${receipt.url}: ${blocker}`)
  ));
  return {
    schema_version: schemaVersion,
    status: blockers.length === 0 ? "passed" : "failed",
    evidence_mode: "research",
    finality: "not_training_data",
    generated_at: new Date().toISOString(),
    runner: {
      tool: "node-fetch",
      command: currentCommand(),
      script: fileReference("scripts/refresh_dataset_source_research.mjs"),
    },
    output: projectRelative(outputPath),
    source_count: receipts.length,
    sources: receipts,
    blockers,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const outputPath = resolveProjectPath(args.output, "--output");
  const receipt = await buildReceipt(outputPath);
  if (args.write) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: receipt.status,
    output: args.write ? projectRelative(outputPath) : null,
    source_count: receipt.source_count,
    blockers: receipt.blockers,
  }, null, 2));
  return receipt.status === "passed" ? 0 : 1;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(`Dataset source research refresh failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  });
