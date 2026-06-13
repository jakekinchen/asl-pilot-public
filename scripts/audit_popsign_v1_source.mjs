import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const vocabularyPath = path.join(root, "web", "src", "lib", "vocabulary.ts");
const defaultOutputPath = path.join(root, "docs", "research", "popsign-v1-source-audit.json");
const schemaVersion = "asl-pilot-popsign-v1-source-audit/v1";
const sourceId = "popsign-v1-original-videos";
const dataCardUrl = "https://signdata.cc.gatech.edu/view/datasets/popsign_v1_0/";
const downloadGuideUrl = "https://signdata.cc.gatech.edu/view/guides/downloading_popsign/index.html";
const paperAbstractUrl = "https://papers.nips.cc/paper_files/paper/2023/hash/00dada608b8db212ea7d9d92b24c68de-Abstract-Datasets_and_Benchmarks.html";
const representativeSignSlug = "after";
const splits = ["train", "val", "test"];
const explicitSlugByLabelId = new Map([
  ["call_on_phone", "callonphone"],
  ["thank_you", "thankyou"],
  ["tv", "TV"],
]);

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
      args.output = resolveProjectPath(value, "--output");
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/audit_popsign_v1_source.mjs [--write] [--output docs/research/popsign-v1-source-audit.json]

Verifies that PopSign ASL v1.0 is usable as an approved external raw-video
source for the current canonical vocabulary: source license, consent/provenance
signals, raw-video download API, signer-disjoint split evidence, and per-label
game-category sign coverage.
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

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function normalizeText(text) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

function vocabularySlugFor(item) {
  return explicitSlugByLabelId.get(item.label_id) ?? item.label_id.replaceAll("_", "");
}

function readVocabularyLabels() {
  const text = fs.readFileSync(vocabularyPath, "utf8");
  return [...text.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)"/gm)].map((match) => ({
    label_id: match[1],
    display_text: match[2],
    popsign_sign_slug: vocabularySlugFor({ label_id: match[1] }),
  }));
}

function extractGameSigns(dataCardHtml) {
  const signs = new Map();
  const pattern = /\/view\/datasets\/popsign_v1_0\/game\/([^/]+)\/index\.html[^>]*>\s*([^<]+)</g;
  for (const match of dataCardHtml.matchAll(pattern)) {
    signs.set(match[1], match[2].trim());
  }
  return signs;
}

function archiveUrl({ split, signSlug }) {
  return `https://signdata.cc.gatech.edu/data/popsign_v1_0/game/${split}/${signSlug}.tar`;
}

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": "asl-pilot-popsign-source-audit/1.0",
    },
  });
  const body = await response.text();
  return {
    url,
    final_url: response.url,
    http_status: response.status,
    content_sha256: sha256Text(body),
    normalized_text_sha256: sha256Text(normalizeText(body)),
    content_length_bytes: Buffer.byteLength(body),
    body,
    normalized: normalizeText(body),
  };
}

async function headArchive(split) {
  const url = archiveUrl({ split, signSlug: representativeSignSlug });
  return headArchiveUrl({ split, signSlug: representativeSignSlug, labelId: null });
}

async function headArchiveUrl({ split, signSlug, labelId }) {
  const url = archiveUrl({ split, signSlug });
  const response = await fetch(url, {
    method: "HEAD",
    redirect: "follow",
    headers: {
      "user-agent": "asl-pilot-popsign-source-audit/1.0",
    },
  });
  return {
    label_id: labelId,
    split,
    category: "game",
    sign_slug: signSlug,
    url,
    http_status: response.status,
    content_type: response.headers.get("content-type"),
    content_length_bytes: Number(response.headers.get("content-length")),
    last_modified: response.headers.get("last-modified"),
    etag: response.headers.get("etag"),
  };
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

async function headMappedArchives(mappings) {
  const items = mappings
    .filter((mapping) => mapping.status === "mapped")
    .flatMap((mapping) => splits.map((split) => ({
      label_id: mapping.label_id,
      split,
      sign_slug: mapping.popsign_sign_slug,
    })));
  return mapWithConcurrency(items, 12, (item) => headArchiveUrl({
    split: item.split,
    signSlug: item.sign_slug,
    labelId: item.label_id,
  }));
}

function matchedCheck(id, source, pattern, summary) {
  const match = source.normalized.match(pattern);
  return {
    id,
    status: match ? "matched" : "missing",
    summary,
    evidence_url: source.url,
    matched_text_excerpt_sha256: match ? sha256Text(match[0].split(/\s+/).slice(0, 8).join(" ")) : null,
  };
}

async function buildAudit(outputPath) {
  const [dataCard, downloadGuide, paperAbstract] = await Promise.all([
    fetchText(dataCardUrl),
    fetchText(downloadGuideUrl),
    fetchText(paperAbstractUrl),
  ]);
  const representativeArchives = await Promise.all(splits.map((split) => headArchive(split)));
  const signs = extractGameSigns(dataCard.body);
  const labels = readVocabularyLabels();
  const mappings = labels.map((label) => {
    const displayName = signs.get(label.popsign_sign_slug) ?? signs.get(label.popsign_sign_slug.toLowerCase()) ?? null;
    return {
      ...label,
      popsign_dataset: "popsign_v1_0",
      popsign_category: "game",
      popsign_display_name: displayName,
      archive_urls: Object.fromEntries(splits.map((split) => [split, archiveUrl({ split, signSlug: label.popsign_sign_slug })])),
      status: displayName ? "mapped" : "missing",
    };
  });
  const mappedArchiveChecks = await headMappedArchives(mappings);
  const checks = [
    matchedCheck("cc_by_4_license", dataCard, /licensed under CC BY 4\.0/i, "Official data card declares CC BY 4.0."),
    matchedCheck("video_modality", dataCard, /Primary Data Modality\s+Video Data/i, "Official data card declares video data as the primary modality."),
    matchedCheck("sign_count", dataCard, /Total Number of Signs\s+250/i, "Official data card declares 250 signs."),
    matchedCheck("signer_count", dataCard, /Total Number of Signers\s+47/i, "Official data card declares 47 signers."),
    matchedCheck("public_use_consent", dataCard, /participants sign consent forms acknowledging that they are creating a dataset intended for public use/i, "Official data card documents public-use consent framing."),
    matchedCheck("raw_video_download_api", downloadGuide, /Please consider downloading the orginal videos in the dataset/i, "Download guide directs users to original videos rather than preview videos."),
    matchedCheck("train_val_test_api", downloadGuide, /train dataset, a val .*validation.* dataset and a test dataset/i, "Download guide documents train, validation, and test split downloads."),
    matchedCheck("consenting_deaf_signers", paperAbstract, /47 consenting Deaf adult signers/i, "NeurIPS abstract documents consenting Deaf adult signers."),
    matchedCheck("signer_disjoint_splits", paperAbstract, /training setof 31 signers, a validation set of eight signers, and a test set of eight signers/i, "NeurIPS abstract documents signer-disjoint split sizes."),
  ];
  const blockers = [
    ...checks.filter((check) => check.status !== "matched").map((check) => `missing source check: ${check.id}`),
    signs.size === 250 ? null : `expected 250 game signs, found ${signs.size}`,
    labels.length >= 75 && labels.length <= 100 ? null : `canonical vocabulary must be 75-100 labels, found ${labels.length}`,
    ...mappings.filter((mapping) => mapping.status !== "mapped").map((mapping) => `missing PopSign game sign for ${mapping.label_id}: ${mapping.popsign_sign_slug}`),
    ...representativeArchives
      .filter((archive) => archive.http_status < 200 || archive.http_status >= 400)
      .map((archive) => `representative archive ${archive.split} returned HTTP ${archive.http_status}`),
    ...representativeArchives
      .filter((archive) => String(archive.content_type ?? "").toLowerCase() !== "application/x-tar")
      .map((archive) => `representative archive ${archive.split} content type is ${archive.content_type}`),
    ...representativeArchives
      .filter((archive) => !Number.isFinite(archive.content_length_bytes) || archive.content_length_bytes <= 0)
      .map((archive) => `representative archive ${archive.split} has no positive content length`),
    ...mappedArchiveChecks
      .filter((archive) => archive.http_status < 200 || archive.http_status >= 400)
      .map((archive) => `mapped archive ${archive.split}/${archive.label_id} returned HTTP ${archive.http_status}: ${archive.url}`),
    ...mappedArchiveChecks
      .filter((archive) => String(archive.content_type ?? "").toLowerCase() !== "application/x-tar")
      .map((archive) => `mapped archive ${archive.split}/${archive.label_id} content type is ${archive.content_type}`),
    ...mappedArchiveChecks
      .filter((archive) => !Number.isFinite(archive.content_length_bytes) || archive.content_length_bytes <= 0)
      .map((archive) => `mapped archive ${archive.split}/${archive.label_id} has no positive content length`),
  ].filter(Boolean);
  return {
    schema_version: schemaVersion,
    status: blockers.length === 0 ? "passed" : "failed",
    generated_at: new Date().toISOString(),
    generated_by: {
      tool: "node-fetch",
      command: [process.execPath, ...process.argv.slice(1)],
      script: {
        path: "scripts/audit_popsign_v1_source.mjs",
        sha256: sha256File(path.join(root, "scripts", "audit_popsign_v1_source.mjs")),
      },
    },
    output: projectRelative(outputPath),
    source_id: sourceId,
    dataset: {
      dataset_id: "popsign_v1_0",
      display_name: "PopSign ASL v1.0 original game videos",
      source_url: dataCardUrl,
      download_guide_url: downloadGuideUrl,
      paper_abstract_url: paperAbstractUrl,
      source_category: "game",
      splits,
      raw_video_policy: {
        use_original_archives_only: true,
        preview_videos_disallowed: true,
        derived_pose_or_landmark_artifacts_disallowed: true,
      },
    },
    source_evidence: [
      dataCard,
      downloadGuide,
      paperAbstract,
    ].map(({ body, normalized, ...source }) => source),
    matched_checks: checks,
    representative_archives: representativeArchives,
    mapped_archive_checks: mappedArchiveChecks,
    vocabulary_source: {
      path: projectRelative(vocabularyPath),
      sha256: sha256File(vocabularyPath),
      item_count: labels.length,
    },
    current_vocabulary_mapping: mappings,
    blockers,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const outputPath = args.output;
  const audit = await buildAudit(outputPath);
  if (args.write) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: audit.status,
    wrote: args.write,
    output: projectRelative(outputPath),
    source_id: audit.source_id,
    vocabulary_item_count: audit.vocabulary_source.item_count,
    mapped_item_count: audit.current_vocabulary_mapping.filter((item) => item.status === "mapped").length,
    representative_archives: audit.representative_archives.map((archive) => ({
      split: archive.split,
      http_status: archive.http_status,
      content_type: archive.content_type,
      content_length_bytes: archive.content_length_bytes,
    })),
    blockers: audit.blockers,
  }, null, 2));
  return audit.status === "passed" ? 0 : 1;
}

try {
  process.exitCode = await main();
} catch (error) {
  console.error(`PopSign v1 source audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
