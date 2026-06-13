#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const sourceRegisterPath = path.join(root, "docs", "model", "dataset-source-register.json");
const popsignImportPlanPath = path.join(root, "docs", "research", "popsign-v1-import-plan.json");
const vocabularyPath = path.join(root, "web", "src", "lib", "vocabulary.ts");
const popsignRoot = path.join(root, "data", "external", "popsign-v1", "raw", "popsign_v1_0", "game");
const wlaslRoot = path.join(root, "data", "external", "wlasl", "raw");
const outputPath = path.join(root, "docs", "validation", "return-to-form-supported-raw-source-candidates-v1.json");
const schemaVersion = "asl-pilot-supported-raw-source-candidates/v1";

const splitNames = ["train", "validation", "test"];
const popsignSourceSplits = { train: "train", validation: "val", test: "test" };
const failedExactRoutes = {
  popsign_tier0_exact: ["please", "table", "dad", "grandpa", "hat"],
  asl_citizen_high_signal_current: ["black", "hello", "please", "sad", "table", "uncle", "white"],
  hand_only_popsign_diagnostic_existing: [
    "book",
    "table",
    "go",
    "blue",
    "yellow",
    "green",
    "read",
    "pencil",
    "fine",
    "milk",
  ],
};

function usage() {
  console.log(`Usage:
  node scripts/audit_supported_raw_source_candidates.mjs [--write]

Inspects approved local raw-video sources without mutating manifests or tensors.
Writes a candidate audit to ${path.relative(root, outputPath)} only with --write.
`);
}

function parseArgs(argv) {
  const args = { write: false };
  for (const item of argv) {
    if (item === "--help" || item === "-h") {
      args.help = true;
    } else if (item === "--write") {
      args.write = true;
    } else {
      throw new Error(`Unknown argument: ${item}`);
    }
  }
  return args;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function projectRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(dir, entry.name));
}

function isVideo(file) {
  return [".mp4", ".mov", ".m4v", ".webm", ".avi", ".mkv"].includes(path.extname(file).toLowerCase());
}

function readVocabulary() {
  const text = fs.readFileSync(vocabularyPath, "utf8");
  return [...text.matchAll(/^\s*\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)"/gm)].map((match, index) => ({
    label_id: match[1],
    display_text: match[2],
    category: match[3],
    order: index,
  }));
}

function labelToPopSignSlug(labelId) {
  if (labelId === "thank_you") return "thankyou";
  if (labelId === "call_on_phone") return "callonphone";
  if (labelId === "tv") return "TV";
  return labelId;
}

function popSignSlugToLabel(slug) {
  if (slug === "thankyou") return "thank_you";
  if (slug === "callonphone") return "call_on_phone";
  if (slug === "TV") return "tv";
  return slug;
}

function signerAliasFromPopSignFile(file) {
  const base = path.basename(file);
  const firstDash = base.indexOf("-");
  return firstDash === -1 ? base : base.slice(0, firstDash);
}

function sourceDecision(register, sourceId) {
  return (register.sources ?? []).find((source) => source?.source_id === sourceId) ?? null;
}

function summarizePopSignLabel(vocabItem) {
  const slug = labelToPopSignSlug(vocabItem.label_id);
  const splits = {};
  for (const [manifestSplit, sourceSplit] of Object.entries(popsignSourceSplits)) {
    const dir = path.join(popsignRoot, sourceSplit, slug);
    const files = listFiles(dir).filter(isVideo);
    const signerAliases = new Set(files.map(signerAliasFromPopSignFile));
    splits[manifestSplit] = {
      source_split: sourceSplit,
      raw_video_count: files.length,
      signer_alias_count: signerAliases.size,
      path: projectRelative(dir),
      sample_files: files.slice(0, 3).map(projectRelative),
    };
  }
  const minRawVideosPerSplit = Math.min(...splitNames.map((split) => splits[split].raw_video_count));
  const minSignerAliasesPerSplit = Math.min(...splitNames.map((split) => splits[split].signer_alias_count));
  return {
    label_id: vocabItem.label_id,
    display_text: vocabItem.display_text,
    category: vocabItem.category,
    popsign_slug: slug,
    source_id: "popsign-v1-original-videos",
    splits,
    min_raw_videos_per_split: minRawVideosPerSplit,
    min_signer_aliases_per_split: minSignerAliasesPerSplit,
    supported_by_raw_source: splitNames.every((split) => splits[split].raw_video_count >= 5),
  };
}

function summarizeWlaslRaw() {
  if (!fs.existsSync(wlaslRoot)) return [];
  return fs.readdirSync(wlaslRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const labelId = popSignSlugToLabel(entry.name.toLowerCase());
      const dir = path.join(wlaslRoot, entry.name);
      const files = listFiles(dir).filter(isVideo);
      return {
        label_id: labelId,
        source_slug: entry.name,
        source_id: "wlasl-school-assignment-raw-videos",
        raw_video_count: files.length,
        path: projectRelative(dir),
        sample_files: files.slice(0, 3).map(projectRelative),
      };
    })
    .filter((item) => item.raw_video_count > 0)
    .sort((left, right) => right.raw_video_count - left.raw_video_count || left.label_id.localeCompare(right.label_id));
}

function failedRouteMembership(labelId) {
  return Object.fromEntries(Object.entries(failedExactRoutes).map(([name, labels]) => [name, labels.includes(labelId)]));
}

function candidateScore(item, vocabOrder) {
  const membership = failedRouteMembership(item.label_id);
  const failedPenalty = Object.values(membership).some(Boolean) ? 1000 : 0;
  const support = item.min_raw_videos_per_split * 10 + item.min_signer_aliases_per_split;
  const earlyVocabBonus = Math.max(0, 120 - vocabOrder);
  return support + earlyVocabBonus - failedPenalty;
}

function diversify(labels, size) {
  const selected = [];
  const byCategory = new Map();
  const remaining = [...labels];
  while (selected.length < size && remaining.length > 0) {
    remaining.sort((left, right) => {
      const leftCategoryCount = byCategory.get(left.category) ?? 0;
      const rightCategoryCount = byCategory.get(right.category) ?? 0;
      if (leftCategoryCount !== rightCategoryCount) return leftCategoryCount - rightCategoryCount;
      return right.score - left.score || left.vocabulary_order - right.vocabulary_order;
    });
    const next = remaining.shift();
    selected.push(next);
    byCategory.set(next.category, (byCategory.get(next.category) ?? 0) + 1);
  }
  return selected;
}

function buildAudit() {
  const register = readJson(sourceRegisterPath);
  const sourceRegisterSha256 = sha256File(sourceRegisterPath);
  const popsignImportPlan = fs.existsSync(popsignImportPlanPath) ? readJson(popsignImportPlanPath) : null;
  const vocabulary = readVocabulary();
  const vocabularyById = new Map(vocabulary.map((item) => [item.label_id, item]));
  const popsign = vocabulary.map(summarizePopSignLabel).map((item) => ({
    ...item,
    vocabulary_order: vocabularyById.get(item.label_id)?.order ?? 9999,
    failed_route_membership: failedRouteMembership(item.label_id),
  }));
  const wlasl = summarizeWlaslRaw();
  const wlaslByLabel = new Map(wlasl.map((item) => [item.label_id, item]));
  const scoredPopSign = popsign
    .filter((item) => item.supported_by_raw_source)
    .map((item) => ({
      ...item,
      wlasl_raw_video_count: wlaslByLabel.get(item.label_id)?.raw_video_count ?? 0,
      score: candidateScore(item, item.vocabulary_order),
    }))
    .sort((left, right) => right.score - left.score || left.vocabulary_order - right.vocabulary_order);
  const freshPopSign = scoredPopSign.filter(
    (item) => !Object.values(item.failed_route_membership).some(Boolean),
  );
  const recommended5 = diversify(freshPopSign, 5);
  const recommended10 = diversify(freshPopSign, 10);
  const sourceApprovals = ["popsign-v1-original-videos", "wlasl-school-assignment-raw-videos", "asl-citizen-school-assignment-raw-videos"]
    .map((sourceId) => {
      const source = sourceDecision(register, sourceId);
      return {
        source_id: sourceId,
        present: Boolean(source),
        allowed_for_model_training: source?.allowed_for_model_training ?? false,
        allowed_for_validation: source?.allowed_for_validation ?? false,
        license_review_status: source?.license_review_status ?? null,
        decision_id: source?.decision_id ?? null,
      };
    });

  return {
    schema_version: schemaVersion,
    status: recommended5.length >= 2 ? "candidate_raw_source_available" : "no_candidate_raw_source_available",
    generated_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    generated_by: "scripts/audit_supported_raw_source_candidates.mjs",
    scope: {
      local_only: true,
      no_source_import: true,
      no_manifest_or_tensor_mutation: true,
      no_training: true,
      no_brev_commands: true,
      no_pretrained_components: true,
    },
    source_register: {
      path: projectRelative(sourceRegisterPath),
      sha256: sourceRegisterSha256,
    },
    popsign_import_plan: {
      path: projectRelative(popsignImportPlanPath),
      exists: Boolean(popsignImportPlan),
      status: popsignImportPlan?.status ?? null,
      source_register_sha256: popsignImportPlan?.source_register?.sha256 ?? null,
      source_register_sha256_matches_current: popsignImportPlan?.source_register?.sha256 === sourceRegisterSha256,
      refresh_command: "node scripts/export_popsign_v1_import_plan.mjs --write",
    },
    vocabulary: {
      path: projectRelative(vocabularyPath),
      sha256: sha256File(vocabularyPath),
      item_count: vocabulary.length,
    },
    source_approvals: sourceApprovals,
    prior_failed_exact_routes: failedExactRoutes,
    raw_source_inventory: {
      popsign_label_count_with_at_least_five_per_split: scoredPopSign.length,
      popsign_top_candidates: scoredPopSign.slice(0, 30).map((item) => ({
        label_id: item.label_id,
        display_text: item.display_text,
        category: item.category,
        score: item.score,
        min_raw_videos_per_split: item.min_raw_videos_per_split,
        min_signer_aliases_per_split: item.min_signer_aliases_per_split,
        wlasl_raw_video_count: item.wlasl_raw_video_count,
        failed_route_membership: item.failed_route_membership,
      })),
      wlasl_top_raw_counts: wlasl.slice(0, 40),
    },
    recommended_packets: [
      {
        packet_id: "popsign_fresh_5_v1",
        source_id: "popsign-v1-original-videos",
        label_ids: recommended5.map((item) => item.label_id),
        purpose: "smallest fresh 5-label PopSign raw-source materialization and local smoke candidate",
        rationale: "Use labels with full local PopSign train/val/test raw support while avoiding the exact failed Tier 0 and hand-only diagnostic label sets where possible.",
        required_next_gates: [
          "refresh docs/research/popsign-v1-import-plan.json if its source-register hash is stale",
          "export source-bound manifests under a new return-to-form path",
          "decode hash-pinned raw RGB or region-grid tensors",
          "verify split counts, signer aliases, tensor hashes, and no-pretrained provenance",
          "run local tiny-overfit sanity before any Brev training",
          "run local short held-out smoke and record per-class recall before any browser claim",
        ],
      },
      {
        packet_id: "popsign_fresh_10_v1",
        source_id: "popsign-v1-original-videos",
        label_ids: recommended10.map((item) => item.label_id),
        purpose: "larger fresh PopSign candidate if the 5-label packet clears local gates",
        rationale: "A 10-label packet is useful only after the 5-label packet proves train sanity and nonzero held-out signal.",
        required_next_gates: [
          "same manifest/tensor/local-smoke gates as popsign_fresh_5_v1",
          "do not spend Brev unless the 5-label result justifies expansion",
        ],
      },
    ],
    next_action: recommended5.length >= 2
      ? (popsignImportPlan?.source_register?.sha256 === sourceRegisterSha256
          ? "materialize_popsign_fresh_5_candidate"
          : "refresh_popsign_import_plan_then_materialize_popsign_fresh_5_candidate")
      : "collect_or_approve_new_training_data",
  };
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    process.exit(0);
  }
  const audit = buildAudit();
  if (args.write) writeJson(outputPath, audit);
  console.log(JSON.stringify({
    status: audit.status,
    wrote: args.write,
    output: projectRelative(outputPath),
    popsign_label_count_with_at_least_five_per_split: audit.raw_source_inventory.popsign_label_count_with_at_least_five_per_split,
    recommended_packets: audit.recommended_packets.map((packet) => ({
      packet_id: packet.packet_id,
      label_ids: packet.label_ids,
    })),
    next_action: audit.next_action,
  }, null, 2));
  process.exitCode = audit.status === "candidate_raw_source_available" ? 0 : 1;
} catch (error) {
  console.error(`supported raw source candidate audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
