import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { isVocabularyGateStatus, vocabularyReviewGate } from "./vocabulary_review_utils.mjs";

const root = path.resolve(import.meta.dirname, "..");
const defaultStorePath = path.join(root, "data", "asl-pilot-store.json");
const vocabularyPath = path.join(root, "web", "src", "lib", "vocabulary.ts");
const consentFormPath = path.join(root, "docs", "privacy", "dataset-consent-form.md");
const CONSENT_VERSION = "asl-pilot-dataset-consent-v1";
const CONSENT_FORM_SHA256 = sha256File(consentFormPath);

const DEFAULT_TARGET_SIGNERS = 20;
const DEFAULT_SIGNERS_BY_SPLIT = {
  train: 12,
  validation: 4,
  test: 4,
};
const DEFAULT_CLIPS_PER_LABEL_PER_SPLIT = 5;
const NEGATIVE_CHALLENGE_TYPES = [
  "idle_hands",
  "empty_camera",
  "no_hands_visible",
  "low_light",
  "off_center",
  "hands_cropped_out",
  "waving",
  "thumbs_up",
  "counting",
  "fingerspelling_like_motion",
  "wrong_location",
  "wrong_palm_orientation",
  "partial_sign",
  "non_target_asl_sign",
  "casual_non_asl_gesture",
  "mouth_touch",
  "hand_clap",
];
const DEFAULT_NEGATIVE_CHALLENGE_CLIPS_PER_TYPE = 5;
const DEFAULT_NEGATIVE_CHALLENGE_SIGNERS = 4;
const REQUIRED_CONSENT_FIELDS = [
  "ageEligible",
  "allowModelTraining",
  "allowValidation",
  "allowPilotUse",
  "allowDerivedArtifactRetention",
  "allowDeidentifiedMetadataRetention",
  "retentionAcknowledged",
  "withdrawalAcknowledged",
];

function parseArgs(argv) {
  const args = {
    targetSigners: DEFAULT_TARGET_SIGNERS,
    clipsPerLabelPerSplit: DEFAULT_CLIPS_PER_LABEL_PER_SPLIT,
    signersBySplit: { ...DEFAULT_SIGNERS_BY_SPLIT },
    negativeChallengeSignerCount: DEFAULT_NEGATIVE_CHALLENGE_SIGNERS,
    negativeChallengeClipsPerType: DEFAULT_NEGATIVE_CHALLENGE_CLIPS_PER_TYPE,
    summaryOnly: false,
    allowDraftUnreviewedVocabulary: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--store") {
      args.store = readValue(argv, index, item);
      index += 1;
      continue;
    }
    if (item === "--output") {
      args.output = readValue(argv, index, item);
      index += 1;
      continue;
    }
    if (item === "--signers") {
      args.signers = readValue(argv, index, item)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      index += 1;
      continue;
    }
    if (item === "--target-signers") {
      args.targetSigners = readPositiveInteger(readValue(argv, index, item), item);
      index += 1;
      continue;
    }
    if (item === "--clips-per-label-per-split") {
      args.clipsPerLabelPerSplit = readPositiveInteger(readValue(argv, index, item), item);
      index += 1;
      continue;
    }
    if (item === "--negative-challenge-signers") {
      args.negativeChallengeSigners = readValue(argv, index, item)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      index += 1;
      continue;
    }
    if (item === "--negative-challenge-signer-count") {
      args.negativeChallengeSignerCount = readPositiveInteger(readValue(argv, index, item), item);
      index += 1;
      continue;
    }
    if (item === "--negative-challenge-clips-per-type") {
      args.negativeChallengeClipsPerType = readPositiveInteger(readValue(argv, index, item), item);
      index += 1;
      continue;
    }
    if (item === "--min-train-signers") {
      args.signersBySplit.train = readPositiveInteger(readValue(argv, index, item), item);
      index += 1;
      continue;
    }
    if (item === "--min-validation-signers") {
      args.signersBySplit.validation = readPositiveInteger(readValue(argv, index, item), item);
      index += 1;
      continue;
    }
    if (item === "--min-test-signers") {
      args.signersBySplit.test = readPositiveInteger(readValue(argv, index, item), item);
      index += 1;
      continue;
    }
    if (item === "--summary-only") {
      args.summaryOnly = true;
      continue;
    }
    if (item === "--allow-draft-unreviewed-vocabulary") {
      args.allowDraftUnreviewedVocabulary = true;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function readValue(argv, index, flag) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${flag}`);
  return value;
}

function readPositiveInteger(value, flag) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return parsed;
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function usage() {
  console.log(`Usage:
  node scripts/plan_dataset_collection.mjs [--summary-only]
  node scripts/plan_dataset_collection.mjs --output data/dataset/collection-plan.json
  node scripts/plan_dataset_collection.mjs --signers signer-001,signer-002
  node scripts/plan_dataset_collection.mjs --negative-challenge-signers challenge-001,challenge-002

Builds an operator collection plan from the current vocabulary and optional
local collection store. The generated signer aliases are chosen to satisfy the
same deterministic signer-disjoint train/validation/test split used by manifest
export. The plan also includes signer-disjoint negative challenge assignments
for the retained lesson hard-negative taxonomy, including the core empty-camera,
no-hands-visible, low-light, and off-center reject-only clips.

By default this fails until docs/review/final-vocabulary-review.json proves the
current vocabulary is source-curated for the source-aligned pilot or covered by
stronger external review evidence. Use --allow-draft-unreviewed-vocabulary only
to generate a pre-evidence planning artifact; the app refuses draft plans for
capture.
  `);
}

function resolveProjectPath(value, context) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`${context} escapes project root: ${value}`);
  }
  return resolved;
}

function readVocabularyLabels() {
  const text = fs.readFileSync(vocabularyPath, "utf8");
  const labels = [];
  const rowPattern = /^\s*\["([^"]+)",\s*"([^"]+)"/gm;
  for (const match of text.matchAll(rowPattern)) {
    labels.push({
      label_id: match[1],
      display_text: match[2],
    });
  }
  return labels;
}

function readStore(storePath) {
  if (!fs.existsSync(storePath)) {
    return {
      exists: false,
      datasetClips: [],
      datasetChallengeClips: [],
      datasetSigners: [],
      consentRecords: [],
    };
  }
  const raw = JSON.parse(fs.readFileSync(storePath, "utf8"));
  return {
    exists: true,
    datasetClips: Array.isArray(raw.datasetClips) ? raw.datasetClips : [],
    datasetChallengeClips: Array.isArray(raw.datasetChallengeClips) ? raw.datasetChallengeClips : [],
    datasetSigners: Array.isArray(raw.datasetSigners) ? raw.datasetSigners : [],
    consentRecords: Array.isArray(raw.consentRecords) ? raw.consentRecords : [],
  };
}

function signerBucket(signerAlias) {
  const digest = crypto.createHash("sha256").update(String(signerAlias)).digest();
  return digest[0] % 5;
}

function splitForSigner(signerAlias) {
  const bucket = signerBucket(signerAlias);
  if (bucket === 0) return "validation";
  if (bucket === 1) return "test";
  return "train";
}

function generatedSigners(targetSigners, targetsBySplit) {
  const requiredTotal = Object.values(targetsBySplit).reduce((total, value) => total + value, 0);
  const finalTarget = Math.max(targetSigners, requiredTotal);
  const signers = [];
  const counts = { train: 0, validation: 0, test: 0 };
  for (let index = 1; signers.length < finalTarget; index += 1) {
    const alias = `signer-${String(index).padStart(3, "0")}`;
    const split = splitForSigner(alias);
    if (counts[split] < targetsBySplit[split] || needsExtraSigner(counts, targetsBySplit, signers.length, finalTarget, split)) {
      signers.push(alias);
      counts[split] += 1;
    }
  }
  return signers;
}

function generatedChallengeSigners(count, reservedAliases) {
  const signers = [];
  for (let index = 1; signers.length < count; index += 1) {
    const alias = `challenge-signer-${String(index).padStart(3, "0")}`;
    if (!reservedAliases.has(alias)) signers.push(alias);
  }
  return signers;
}

function needsExtraSigner(counts, targetsBySplit, currentTotal, finalTarget, split) {
  if (Object.entries(targetsBySplit).some(([key, target]) => counts[key] < target)) return false;
  if (currentTotal >= finalTarget) return false;
  const ratios = Object.fromEntries(
    Object.entries(counts).map(([key, count]) => [key, count / targetsBySplit[key]]),
  );
  return ratios[split] <= Math.min(...Object.values(ratios));
}

function validCollectedClips(store, labelIds) {
  const consentById = new Map(store.consentRecords.map((record) => [record.id, record]));
  const signerByAlias = new Map(store.datasetSigners.map((record) => [record.signerAlias, record]));
  return store.datasetClips.filter((clip) => {
    if (clip.labelReviewStatus !== "approved") return false;
    if (!labelIds.has(clip.vocabularyId) || !clip.signerAlias) return false;
    const consent = consentById.get(clip.consentRecordId);
    const signer = signerByAlias.get(clip.signerAlias);
    if (!consent) return false;
    if (!signer || signer.split !== splitForSigner(clip.signerAlias)) return false;
    if (consent.consentVersion !== CONSENT_VERSION || consent.consentFormSha256 !== CONSENT_FORM_SHA256) {
      return false;
    }
    if (signer.consentVersion !== CONSENT_VERSION || signer.consentFormSha256 !== CONSENT_FORM_SHA256) {
      return false;
    }
    return REQUIRED_CONSENT_FIELDS.every((field) => consent[field] === true);
  });
}

function validCollectedChallengeClips(store, reservedVocabularySigners) {
  const consentById = new Map(store.consentRecords.map((record) => [record.id, record]));
  const signerByAlias = new Map(store.datasetSigners.map((record) => [record.signerAlias, record]));
  return store.datasetChallengeClips.filter((clip) => {
    if (clip.challengeReviewStatus !== "approved") return false;
    if (!NEGATIVE_CHALLENGE_TYPES.includes(clip.challengeType) || !clip.signerAlias) return false;
    if (reservedVocabularySigners.has(clip.signerAlias)) return false;
    const consent = consentById.get(clip.consentRecordId);
    if (!consent) return false;
    const signer = signerByAlias.get(clip.signerAlias);
    if (!signer || signer.split !== splitForSigner(clip.signerAlias)) return false;
    if (consent.consentVersion !== CONSENT_VERSION || consent.consentFormSha256 !== CONSENT_FORM_SHA256) {
      return false;
    }
    if (signer.consentVersion !== CONSENT_VERSION || signer.consentFormSha256 !== CONSENT_FORM_SHA256) {
      return false;
    }
    return [
      "ageEligible",
      "allowValidation",
      "allowPilotUse",
      "allowDerivedArtifactRetention",
      "allowDeidentifiedMetadataRetention",
      "retentionAcknowledged",
      "withdrawalAcknowledged",
    ].every((field) => consent[field] === true);
  });
}

function countsBySplitAndLabel(clips, labels) {
  const counts = Object.fromEntries(
    ["train", "validation", "test"].map((split) => [
      split,
      new Map(labels.map((label) => [label.label_id, 0])),
    ]),
  );
  for (const clip of clips) {
    const split = splitForSigner(clip.signerAlias);
    const splitCounts = counts[split];
    if (splitCounts?.has(clip.vocabularyId)) {
      splitCounts.set(clip.vocabularyId, splitCounts.get(clip.vocabularyId) + 1);
    }
  }
  return counts;
}

function signerSummary(signers) {
  const bySplit = { train: [], validation: [], test: [] };
  for (const signerAlias of signers) bySplit[splitForSigner(signerAlias)].push(signerAlias);
  return bySplit;
}

function buildAssignments({ labels, counts, signersBySplit, clipsPerLabelPerSplit }) {
  const assignments = [];
  const splitOffsets = { train: 0, validation: 0, test: 0 };
  for (const split of ["train", "validation", "test"]) {
    const splitSigners = signersBySplit[split];
    if (splitSigners.length === 0) continue;
    for (const label of labels) {
      const existingCount = counts[split].get(label.label_id) ?? 0;
      const needed = Math.max(0, clipsPerLabelPerSplit - existingCount);
      for (let index = 0; index < needed; index += 1) {
        const signerAlias = splitSigners[splitOffsets[split] % splitSigners.length];
        splitOffsets[split] += 1;
        assignments.push({
          split,
          signer_alias: signerAlias,
          label_id: label.label_id,
          display_text: label.display_text,
          capture_count_for_label_split: existingCount + index + 1,
        });
      }
    }
  }
  return assignments;
}

function buildChallengeAssignments({
  countedChallengeClips,
  challengeSigners,
  clipsPerType,
}) {
  const countsByType = Object.fromEntries(NEGATIVE_CHALLENGE_TYPES.map((type) => [type, 0]));
  for (const clip of countedChallengeClips) {
    countsByType[clip.challengeType] += 1;
  }
  const assignments = [];
  let signerOffset = 0;
  for (const challengeType of NEGATIVE_CHALLENGE_TYPES) {
    const existingCount = countsByType[challengeType] ?? 0;
    const needed = Math.max(0, clipsPerType - existingCount);
    for (let index = 0; index < needed; index += 1) {
      const signerAlias = challengeSigners[signerOffset % challengeSigners.length];
      signerOffset += 1;
      assignments.push({
        split: "negative_challenge",
        signer_alias: signerAlias,
        challenge_type: challengeType,
        expected_outcome: "reject",
        capture_count_for_type: existingCount + index + 1,
      });
    }
  }
  return { assignments, countsByType };
}

function splitCountMap(assignments) {
  return Object.fromEntries(
    ["train", "validation", "test"].map((split) => [
      split,
      assignments.filter((assignment) => assignment.split === split).length,
    ]),
  );
}

function challengeTypeCountMap(assignments) {
  return Object.fromEntries(
    NEGATIVE_CHALLENGE_TYPES.map((challengeType) => [
      challengeType,
      assignments.filter((assignment) => assignment.challenge_type === challengeType).length,
    ]),
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const storePath = args.store ? resolveProjectPath(args.store, "--store") : defaultStorePath;
  const labels = readVocabularyLabels();
  const reviewGate = vocabularyReviewGate();
  if (!isVocabularyGateStatus(reviewGate.status) && !args.allowDraftUnreviewedVocabulary) {
    throw new Error(
      `Vocabulary evidence gate must pass before collection planning. Run scripts/audit_vocabulary_review.mjs or pass --allow-draft-unreviewed-vocabulary for a non-capturable draft plan.`,
    );
  }
  const labelIds = new Set(labels.map((label) => label.label_id));
  const signers = args.signers?.length
    ? [...new Set(args.signers)]
    : generatedSigners(args.targetSigners, args.signersBySplit);
  const reservedVocabularySigners = new Set(signers);
  const challengeSigners = args.negativeChallengeSigners?.length
    ? [...new Set(args.negativeChallengeSigners)]
    : generatedChallengeSigners(args.negativeChallengeSignerCount, reservedVocabularySigners);
  const signersBySplit = signerSummary(signers);
  const store = readStore(storePath);
  const countedClips = validCollectedClips(store, labelIds);
  const countedChallengeClips = validCollectedChallengeClips(store, reservedVocabularySigners);
  const counts = countsBySplitAndLabel(countedClips, labels);
  const assignments = buildAssignments({
    labels,
    counts,
    signersBySplit,
    clipsPerLabelPerSplit: args.clipsPerLabelPerSplit,
  });
  const challengePlan = buildChallengeAssignments({
    countedChallengeClips,
    challengeSigners,
    clipsPerType: args.negativeChallengeClipsPerType,
  });
  const splitSignerCounts = Object.fromEntries(
    Object.entries(signersBySplit).map(([split, values]) => [split, values.length]),
  );
  const warnings = [];
  for (const [split, target] of Object.entries(args.signersBySplit)) {
    if (splitSignerCounts[split] < target) {
      warnings.push(`${split} split has ${splitSignerCounts[split]} planned signer(s); target is ${target}`);
    }
  }
  if (signers.length < args.targetSigners) {
    warnings.push(`Only ${signers.length} planned signer(s); target is ${args.targetSigners}`);
  }
  if (challengeSigners.length < 1) {
    warnings.push("At least one negative challenge signer is required");
  }
  const challengeOverlap = challengeSigners.filter((signerAlias) => reservedVocabularySigners.has(signerAlias));
  if (challengeOverlap.length > 0) {
    warnings.push(`Negative challenge signers must be disjoint from vocabulary signers: ${challengeOverlap.join(", ")}`);
  }
  const plan = {
    schema_version: "asl-pilot-dataset-collection-plan/v1",
    generated_at: new Date().toISOString(),
    review_gate: reviewGate,
    targets: {
      vocabulary_labels: labels.length,
      target_signers: Math.max(
        args.targetSigners,
        Object.values(args.signersBySplit).reduce((total, value) => total + value, 0),
      ),
      signers_by_split: args.signersBySplit,
      clips_per_label_per_split: args.clipsPerLabelPerSplit,
      negative_challenge: {
        required_types: NEGATIVE_CHALLENGE_TYPES,
        clips_per_type: args.negativeChallengeClipsPerType,
        signer_count: challengeSigners.length,
        signer_disjoint_from_vocabulary: true,
      },
    },
    store: {
      path: path.relative(root, storePath),
      exists: store.exists,
      counted_clips: countedClips.length,
      counted_negative_challenge_clips: countedChallengeClips.length,
    },
    planned_signers: signersBySplit,
    planned_negative_challenge_signers: challengeSigners,
    planned_signer_counts: splitSignerCounts,
    assignment_counts_by_split: splitCountMap(assignments),
    assignment_count: assignments.length,
    negative_challenge_existing_counts_by_type: challengePlan.countsByType,
    negative_challenge_assignment_counts_by_type: challengeTypeCountMap(challengePlan.assignments),
    negative_challenge_assignment_count: challengePlan.assignments.length,
    warnings,
    assignments,
    negative_challenge_assignments: challengePlan.assignments,
  };

  const output = args.summaryOnly
    ? { ...plan, assignments: undefined, negative_challenge_assignments: undefined }
    : plan;
  if (args.output) {
    const outputPath = resolveProjectPath(args.output, "--output");
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify(output, null, 2));
  return warnings.length > 0 ? 1 : 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Dataset collection planning failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
