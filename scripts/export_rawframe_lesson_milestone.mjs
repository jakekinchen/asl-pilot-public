import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultTrainManifest = path.join(root, "data", "manifests", "train.json");
const defaultValidationReport = path.join(root, "artifacts", "rawframe-model", "validation-report.json");
const defaultOutput = path.join(root, "docs", "validation", "rawframe-lesson-milestone.json");
const targetLessonCount = 25;
const nearConfusableCount = 10;

const hardNegativeTaxonomy = [
  "idle_hands",
  "no_hands_visible",
  "empty_camera",
  "low_light",
  "off_center_signer",
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

function usage() {
  return `
Usage:
  node scripts/export_rawframe_lesson_milestone.mjs [--write]

Options:
  --train-manifest <path>       Default: data/manifests/train.json
  --validation-report <path>    Default: artifacts/rawframe-model/validation-report.json
  --output <path>               Default: docs/validation/rawframe-lesson-milestone.json
  --write                       Write the milestone artifact. Without --write, print it.
`;
}

function resolveProjectPath(value, flag) {
  const resolved = path.resolve(root, value);
  if (!resolved.startsWith(`${root}${path.sep}`) && resolved !== root) {
    throw new Error(`${flag} escapes project root: ${value}`);
  }
  return resolved;
}

function parseArgs(argv) {
  const args = {
    trainManifest: defaultTrainManifest,
    validationReport: defaultValidationReport,
    output: defaultOutput,
    write: false,
  };
  for (let index = 2; index < argv.length; index += 1) {
    const item = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${item} requires a value`);
      return argv[index];
    };
    if (item === "--write") {
      args.write = true;
    } else if (item === "--train-manifest") {
      args.trainManifest = resolveProjectPath(next(), item);
    } else if (item === "--validation-report") {
      args.validationReport = resolveProjectPath(next(), item);
    } else if (item === "--output") {
      args.output = resolveProjectPath(next(), item);
    } else if (item === "--help" || item === "-h") {
      console.log(usage().trim());
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${item}\n${usage()}`);
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

function metricFor(report, split, labelId) {
  const metrics = report?.[split]?.per_class?.[labelId];
  if (!metrics || typeof metrics !== "object") {
    return { precision: 0, recall: 0, f1: 0, support: 0 };
  }
  return {
    precision: Number(metrics.precision) || 0,
    recall: Number(metrics.recall) || 0,
    f1: Number(metrics.f1) || 0,
    support: Number(metrics.support) || 0,
  };
}

function matrixCount(report, split, trueLabel, predictedLabel) {
  const matrix = report?.[split]?.confusion_matrix;
  const labels = matrix?.labels;
  const rows = matrix?.rows_true_columns_predicted;
  if (!Array.isArray(labels) || !Array.isArray(rows)) return 0;
  const trueIndex = labels.indexOf(trueLabel);
  const predictedIndex = labels.indexOf(predictedLabel);
  if (trueIndex < 0 || predictedIndex < 0) return 0;
  return Number(rows[trueIndex]?.[predictedIndex]) || 0;
}

function labelRecord(label, originalIndex, report) {
  return {
    label_id: label.label_id,
    display_text: label.display_text,
    original_vocabulary_index: originalIndex,
    validation_metrics: metricFor(report, "validation", label.label_id),
    test_metrics: metricFor(report, "test", label.label_id),
  };
}

function confusionScore(report, targetSet, candidateLabel) {
  const links = [];
  for (const targetLabel of targetSet) {
    const validationTargetToCandidate = matrixCount(report, "validation", targetLabel, candidateLabel);
    const validationCandidateToTarget = matrixCount(report, "validation", candidateLabel, targetLabel);
    const testTargetToCandidate = matrixCount(report, "test", targetLabel, candidateLabel);
    const testCandidateToTarget = matrixCount(report, "test", candidateLabel, targetLabel);
    const total =
      validationTargetToCandidate +
      validationCandidateToTarget +
      testTargetToCandidate +
      testCandidateToTarget;
    if (total > 0) {
      links.push({
        target_label_id: targetLabel,
        total_confusions: total,
        validation_target_as_candidate: validationTargetToCandidate,
        validation_candidate_as_target: validationCandidateToTarget,
        test_target_as_candidate: testTargetToCandidate,
        test_candidate_as_target: testCandidateToTarget,
      });
    }
  }
  links.sort((left, right) => {
    if (right.total_confusions !== left.total_confusions) return right.total_confusions - left.total_confusions;
    return left.target_label_id.localeCompare(right.target_label_id);
  });
  return {
    total_confusions: links.reduce((sum, link) => sum + link.total_confusions, 0),
    top_target_links: links.slice(0, 5),
  };
}

function buildMilestone({ trainManifestPath, validationReportPath }) {
  const trainManifest = readJson(trainManifestPath);
  const validationReport = readJson(validationReportPath);
  if (!Array.isArray(trainManifest.labels) || trainManifest.labels.length < targetLessonCount) {
    throw new Error(`train manifest must contain at least ${targetLessonCount} labels`);
  }

  const labels = trainManifest.labels.map((label, index) => ({
    label_id: String(label.label_id),
    display_text: String(label.display_text ?? label.label_id),
    original_vocabulary_index: index,
  }));
  const targetLabels = labels.slice(0, targetLessonCount);
  const targetSet = new Set(targetLabels.map((label) => label.label_id));
  const nearConfusableCandidates = labels
    .filter((label) => !targetSet.has(label.label_id))
    .map((label) => ({
      ...label,
      confusion_evidence: confusionScore(validationReport, targetSet, label.label_id),
      validation_metrics: metricFor(validationReport, "validation", label.label_id),
      test_metrics: metricFor(validationReport, "test", label.label_id),
    }))
    .sort((left, right) => {
      if (right.confusion_evidence.total_confusions !== left.confusion_evidence.total_confusions) {
        return right.confusion_evidence.total_confusions - left.confusion_evidence.total_confusions;
      }
      return left.original_vocabulary_index - right.original_vocabulary_index;
    });

  const nearConfusableSigns = nearConfusableCandidates.slice(0, nearConfusableCount);

  return {
    schema_version: "asl-pilot-rawframe-lesson-milestone/v1",
    status: "defined_not_trained",
    generated_at: new Date().toISOString(),
    generated_by: {
      script: {
        path: "scripts/export_rawframe_lesson_milestone.mjs",
        sha256: sha256File(new URL(import.meta.url)),
      },
      command: process.argv,
    },
    finality: "milestone_definition_not_model_evidence",
    inputs: {
      train_manifest: {
        path: projectRelative(trainManifestPath),
        sha256: sha256File(trainManifestPath),
      },
      validation_report: {
        path: projectRelative(validationReportPath),
        sha256: sha256File(validationReportPath),
        status: validationReport.status,
      },
    },
    selection_method: {
      lesson_signs:
        "First 25 labels from the current source-curated vocabulary order embedded in the active train manifest; this preserves the product prompt order rather than selecting only easy diagnostic labels.",
      near_confusables:
        "Top 10 non-target labels ranked by bidirectional confusion counts with the 25 target labels across current validation and test confusion matrices. These remain ASL-review-needed before final lesson launch.",
    },
    lesson: {
      lesson_id: "source_curated_intro_lesson_001",
      mode: "classify_or_reject",
      target_signs: targetLabels.map((label) => labelRecord(label, label.original_vocabulary_index, validationReport)),
      near_confusable_signs: nearConfusableSigns,
      hard_negative_taxonomy: hardNegativeTaxonomy,
      current_negative_challenge_coverage:
        validationReport.negative_challenge?.manifest?.challenge_type_counts ?? {},
    },
    evaluation_contract: {
      split_policy: "signer_disjoint_train_validation_test",
      synthetic_policy: "synthetic_media_banned_from_validation_test_final_negative_challenge_and_final_held_out_evidence",
      threshold_policy:
        "Select reject thresholds on validation evidence only; report held-out test and negative-challenge false-pass separately.",
      product_outputs: {
        accepted_label: "one_of_target_signs_when_prompt_matches_and_thresholds_pass",
        reject_label: "not_sure_try_again",
      },
      required_metrics: [
        "closed_set_top1_on_target_signs",
        "accepted_clip_top1",
        "macro_f1",
        "coverage_acceptance_rate",
        "wrong_prompt_false_pass",
        "hard_negative_false_pass",
        "per_class_false_pass",
        "per_signer_metrics",
        "validation_selected_thresholds",
      ],
      success_targets: {
        signer_disjoint_target_top1_at_least: 0.7,
        macro_f1_at_least: 0.65,
        test_false_pass_below: 0.1,
        negative_challenge_false_pass_below: 0.05,
      },
    },
    current_baseline_metrics: {
      status: validationReport.status,
      validation_top1: validationReport.validation?.top1_accuracy,
      validation_macro_f1: validationReport.validation?.macro_f1,
      test_top1: validationReport.test?.top1_accuracy,
      test_macro_f1: validationReport.test?.macro_f1,
      selected_threshold: validationReport.threshold_calibration?.selected_threshold,
      validation_false_pass_rate:
        validationReport.threshold_calibration?.selected_metrics?.false_pass_rate,
      test_false_pass_rate: validationReport.test?.threshold_metrics?.false_pass_rate,
      negative_challenge_false_pass_rate:
        validationReport.negative_challenge?.metrics?.false_pass_rate,
    },
    blockers: [
      "This artifact defines the milestone only; it does not create lesson-level train/validation/test manifests.",
      "Near-confusable choices are mined from weak current model confusion and require ASL/product review before final lesson launch.",
      "No first-party browser-domain clips or additional approved external training data are introduced by this artifact.",
    ],
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const milestone = buildMilestone({
    trainManifestPath: args.trainManifest,
    validationReportPath: args.validationReport,
  });
  const serialized = `${JSON.stringify(milestone, null, 2)}\n`;
  if (args.write) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, serialized);
    console.log(
      JSON.stringify(
        {
          status: "written",
          output: projectRelative(args.output),
          sha256: sha256File(args.output),
          target_sign_count: milestone.lesson.target_signs.length,
          near_confusable_count: milestone.lesson.near_confusable_signs.length,
          hard_negative_type_count: milestone.lesson.hard_negative_taxonomy.length,
        },
        null,
        2,
      ),
    );
  } else {
    process.stdout.write(serialized);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
