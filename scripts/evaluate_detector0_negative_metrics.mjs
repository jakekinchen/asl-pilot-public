#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

const DEFAULTS = {
  contract: "docs/model/return-to-form-detector0-negative-evaluation-metric-contract-v1.json",
  positivePacket: "data/annotations/detector0/return-to-form-detector0-combined-training-packet-v1.json",
  negativeManifest:
    "data/annotations/detector0/return-to-form-detector0-hard-negative-validation-manifest-v1.json",
};

const learnedTargetIds = ["left_or_first_hand", "right_or_second_hand"];
const strictNoHandCategories = ["empty_camera", "no_hands_visible", "low_light", "off_center"];
const nonTargetCategory = "non_target_asl_sign";
const coordinateSpace = "normalized_full_frame_top_left_xyxy";

class HarnessError extends Error {}

function usage() {
  return `
Usage:
  node scripts/evaluate_detector0_negative_metrics.mjs --predictions <path> [--output <path>] [--allow-synthetic-smoke]
  node scripts/evaluate_detector0_negative_metrics.mjs --write-synthetic-smoke-fixture <path>

Options:
  --contract <path>            Override the M3II metric contract path.
  --positive-packet <path>     Override the M3ID positive packet path.
  --negative-manifest <path>   Override the M3IH negative manifest path.
`.trim();
}

function parseArgs(argv) {
  const args = {
    contract: DEFAULTS.contract,
    positivePacket: DEFAULTS.positivePacket,
    negativeManifest: DEFAULTS.negativeManifest,
    allowSyntheticSmoke: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") {
      args.help = true;
    } else if (token === "--allow-synthetic-smoke") {
      args.allowSyntheticSmoke = true;
    } else if (token === "--predictions") {
      args.predictions = requireArg(argv, (index += 1), token);
    } else if (token === "--output") {
      args.output = requireArg(argv, (index += 1), token);
    } else if (token === "--contract") {
      args.contract = requireArg(argv, (index += 1), token);
    } else if (token === "--positive-packet") {
      args.positivePacket = requireArg(argv, (index += 1), token);
    } else if (token === "--negative-manifest") {
      args.negativeManifest = requireArg(argv, (index += 1), token);
    } else if (token === "--write-synthetic-smoke-fixture") {
      args.writeSyntheticSmokeFixture = requireArg(argv, (index += 1), token);
    } else {
      throw new HarnessError(`Unknown argument: ${token}`);
    }
  }
  return args;
}

function requireArg(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new HarnessError(`${flag} requires a value`);
  }
  return value;
}

function absolute(relativePath) {
  return path.isAbsolute(relativePath) ? relativePath : path.join(root, relativePath);
}

function projectRelative(filePath) {
  return path.relative(root, absolute(filePath)).split(path.sep).join("/");
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(absolute(relativePath), "utf8"));
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256File(relativePath) {
  return sha256Buffer(fs.readFileSync(absolute(relativePath)));
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

function stableStringify(value) {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function writeJson(relativePath, value) {
  fs.mkdirSync(path.dirname(absolute(relativePath)), { recursive: true });
  fs.writeFileSync(absolute(relativePath), stableStringify(value));
}

function requireCondition(condition, message) {
  if (!condition) throw new HarnessError(message);
}

function requireObject(value, message) {
  requireCondition(value && typeof value === "object" && !Array.isArray(value), message);
  return value;
}

function requireArray(value, message) {
  requireCondition(Array.isArray(value), message);
  return value;
}

function isSha256(value) {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}

function finiteUnitNumber(value) {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function validBox(box) {
  return (
    Array.isArray(box)
    && box.length === 4
    && box.every(finiteUnitNumber)
    && box[0] < box[2]
    && box[1] < box[3]
  );
}

function boxesEqual(left, right) {
  if (left === null || right === null) return left === right;
  return Array.isArray(left)
    && Array.isArray(right)
    && left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function iou(boxA, boxB) {
  if (!validBox(boxA) || !validBox(boxB)) return 0;
  const x1 = Math.max(boxA[0], boxB[0]);
  const y1 = Math.max(boxA[1], boxB[1]);
  const x2 = Math.min(boxA[2], boxB[2]);
  const y2 = Math.min(boxA[3], boxB[3]);
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1]);
  const areaB = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1]);
  const union = areaA + areaB - intersection;
  return union > 0 ? intersection / union : 0;
}

function rowHash(row) {
  const copy = structuredClone(row);
  delete copy.prediction_artifact_row_sha256;
  return sha256Text(stableStringify(copy));
}

function indexBy(rows, key, label) {
  const map = new Map();
  for (const row of rows) {
    const id = row[key];
    requireCondition(typeof id === "string" && id.length > 0, `${label} row missing ${key}`);
    requireCondition(!map.has(id), `${label} duplicate row id: ${id}`);
    map.set(id, row);
  }
  return map;
}

function countBy(rows, key) {
  const counts = {};
  for (const row of rows) counts[row[key]] = (counts[row[key]] ?? 0) + 1;
  return counts;
}

function rate(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : null;
}

function emptyCounter() {
  return { numerator: 0, denominator: 0, rate: null };
}

function incrementBreakdown(target, keys, numeratorIncrement, denominatorIncrement = 1) {
  let cursor = target;
  for (const key of keys) {
    cursor[key] ??= {};
    cursor = cursor[key];
  }
  cursor.numerator = (cursor.numerator ?? 0) + numeratorIncrement;
  cursor.denominator = (cursor.denominator ?? 0) + denominatorIncrement;
  cursor.rate = rate(cursor.numerator, cursor.denominator);
}

function predictedHit(predictedTarget, threshold, expectedBox, iouThreshold) {
  return (
    predictedTarget?.predicted_present === true
    && Number(predictedTarget.confidence) >= threshold
    && iou(predictedTarget.box_xyxy_normalized_full_frame, expectedBox) >= iouThreshold
  );
}

function predictedPresentAboveThreshold(predictedTarget, threshold) {
  return predictedTarget?.predicted_present === true && Number(predictedTarget.confidence) >= threshold;
}

function validateSourceHashes(contract, prediction, paths) {
  const positiveSha = sha256File(paths.positivePacket);
  const negativeSha = sha256File(paths.negativeManifest);

  requireCondition(
    contract.row_accounting?.positive_packet?.path === projectRelative(paths.positivePacket),
    "contract positive packet path does not match evaluator input",
  );
  requireCondition(
    contract.row_accounting?.positive_packet?.sha256 === positiveSha,
    "contract positive packet sha256 does not match file",
  );
  requireCondition(
    contract.row_accounting?.negative_manifest?.path === projectRelative(paths.negativeManifest),
    "contract negative manifest path does not match evaluator input",
  );
  requireCondition(
    contract.row_accounting?.negative_manifest?.sha256 === negativeSha,
    "contract negative manifest sha256 does not match file",
  );
  requireCondition(
    prediction.source_positive_packet_path === projectRelative(paths.positivePacket),
    "prediction source_positive_packet_path mismatch",
  );
  requireCondition(
    prediction.source_positive_packet_sha256 === positiveSha,
    "prediction source_positive_packet_sha256 mismatch",
  );
  requireCondition(
    prediction.source_negative_manifest_path === projectRelative(paths.negativeManifest),
    "prediction source_negative_manifest_path mismatch",
  );
  requireCondition(
    prediction.source_negative_manifest_sha256 === negativeSha,
    "prediction source_negative_manifest_sha256 mismatch",
  );

  return {
    [projectRelative(paths.positivePacket)]: { sha256: positiveSha },
    [projectRelative(paths.negativeManifest)]: { sha256: negativeSha },
  };
}

function validateThresholdProfile(contract, profile) {
  requireObject(profile, "threshold_profile must be an object");
  for (const field of contract.future_prediction_artifact_schema.threshold_profile_required_fields) {
    requireCondition(profile[field] !== undefined, `threshold_profile missing ${field}`);
  }
  requireCondition(typeof profile.profile_id === "string" && profile.profile_id.length > 0, "threshold profile_id missing");
  requireCondition(
    finiteUnitNumber(profile.hand_presence_confidence_threshold),
    "hand_presence_confidence_threshold must be within [0, 1]",
  );
  requireCondition(profile.box_coordinate_space === coordinateSpace, "threshold box_coordinate_space mismatch");
  requireCondition(profile.frozen === true, "threshold_profile.frozen must be true");
  requireCondition(
    profile.frozen_before_metric_computation === true,
    "threshold_profile must be frozen before metric computation",
  );

  const requiredIouThresholds = contract.positive_row_metric_semantics.hand_recall_at_iou.iou_thresholds;
  for (const threshold of requiredIouThresholds) {
    requireCondition(
      profile.iou_thresholds_reported.includes(threshold),
      `threshold_profile missing IoU threshold ${threshold}`,
    );
  }
  return {
    profile_id: profile.profile_id,
    hand_presence_confidence_threshold: profile.hand_presence_confidence_threshold,
    iou_thresholds_reported: profile.iou_thresholds_reported,
  };
}

function validateAttestation(attestation) {
  requireObject(attestation, "no_pretrained_no_generated_label_attestation must be an object");
  const requiredTrue = [
    "detector0_model_is_scratch_trained",
    "no_pretrained_detector_outputs_used",
    "no_pretrained_landmark_outputs_used",
    "no_pretrained_feature_or_embedding_outputs_used",
    "no_pretrained_backbone_used",
    "no_teacher_model_outputs_used",
    "no_generated_labels_used",
    "no_pseudo_labels_used",
    "expected_labels_from_tracked_human_or_project_authored_sources_only",
  ];
  for (const field of requiredTrue) {
    requireCondition(attestation[field] === true, `attestation ${field} must be true`);
  }
  requireCondition(
    Array.isArray(attestation.pretrained_components) && attestation.pretrained_components.length === 0,
    "attestation pretrained_components must be empty",
  );
}

function validateModelHashes(prediction, allowSyntheticSmoke) {
  requireCondition(isSha256(prediction.detector0_model_artifact_sha256), "model artifact sha256 is invalid");
  requireCondition(isSha256(prediction.detector0_training_receipt_sha256), "training receipt sha256 is invalid");
  if (prediction.synthetic_fixture?.is_synthetic === true) {
    requireCondition(allowSyntheticSmoke, "synthetic smoke fixture requires --allow-synthetic-smoke");
    requireCondition(
      String(prediction.detector0_model_artifact_path).startsWith("synthetic://"),
      "synthetic fixture model path must use synthetic://",
    );
    requireCondition(
      String(prediction.detector0_training_receipt_path).startsWith("synthetic://"),
      "synthetic fixture training receipt path must use synthetic://",
    );
    return;
  }

  requireCondition(fs.existsSync(absolute(prediction.detector0_model_artifact_path)), "model artifact path missing");
  requireCondition(
    sha256File(prediction.detector0_model_artifact_path) === prediction.detector0_model_artifact_sha256,
    "model artifact sha256 mismatch",
  );
  requireCondition(fs.existsSync(absolute(prediction.detector0_training_receipt_path)), "training receipt path missing");
  requireCondition(
    sha256File(prediction.detector0_training_receipt_path) === prediction.detector0_training_receipt_sha256,
    "training receipt sha256 mismatch",
  );
}

function expectedPositiveTarget(row, targetId) {
  const source = row.target_payloads?.[targetId];
  requireObject(source, `${row.packet_row_id} missing target ${targetId}`);
  return {
    presence: source.presence === true,
    box: source.presence === true ? source.box_xyxy_norm : null,
  };
}

function expectedNegativeTarget(row, targetId) {
  const field = targetId === "left_or_first_hand"
    ? "expected_left_or_first_hand_presence"
    : "expected_right_or_second_hand_presence";
  return { presence: row[field], box: null };
}

function validateExpectedTarget(actual, expected, rowId, targetId) {
  requireObject(actual, `${rowId} expected_targets.${targetId} missing`);
  requireCondition(actual.presence === expected.presence, `${rowId} ${targetId} expected presence mismatch`);
  if (expected.presence === true) {
    requireCondition(
      boxesEqual(actual.box_xyxy_normalized_full_frame, expected.box),
      `${rowId} ${targetId} expected box mismatch`,
    );
  } else {
    requireCondition(
      actual.box_xyxy_normalized_full_frame === null,
      `${rowId} ${targetId} absent expected target must have null box`,
    );
  }
}

function validatePredictedTarget(target, rowId, targetId) {
  requireObject(target, `${rowId} predicted_targets.${targetId} missing`);
  requireCondition(typeof target.predicted_present === "boolean", `${rowId} ${targetId} predicted_present must be boolean`);
  requireCondition(finiteUnitNumber(target.confidence), `${rowId} ${targetId} confidence must be within [0, 1]`);
  requireCondition(typeof target.box_source === "string" && target.box_source.length > 0, `${rowId} ${targetId} box_source missing`);
  requireCondition(
    typeof target.raw_model_output_ref === "string" && target.raw_model_output_ref.length > 0,
    `${rowId} ${targetId} raw_model_output_ref missing`,
  );
  if (target.predicted_present) {
    requireCondition(
      validBox(target.box_xyxy_normalized_full_frame),
      `${rowId} ${targetId} predicted-present target requires a valid normalized box`,
    );
  } else {
    requireCondition(
      target.box_xyxy_normalized_full_frame === null,
      `${rowId} ${targetId} predicted-absent target must have null box`,
    );
  }
}

function validateRows({ contract, prediction, positivePacket, negativeManifest }) {
  const requiredRowFields = contract.future_prediction_artifact_schema.required_row_fields;
  const rows = requireArray(prediction.rows, "prediction rows must be an array");
  const positiveRows = requireArray(positivePacket.included_rows, "positive packet included_rows missing");
  const negativeRows = requireArray(negativeManifest.rows, "negative manifest rows missing");
  const positiveById = indexBy(positiveRows, "packet_row_id", "positive packet");
  const negativeById = indexBy(negativeRows, "manifest_row_id", "negative manifest");
  const expectedRowCount = positiveRows.length + negativeRows.length;
  requireCondition(rows.length === expectedRowCount, `prediction rows must contain ${expectedRowCount} rows`);

  const seenPredictionIds = new Set();
  const seenPositive = new Set();
  const seenNegative = new Set();
  const evaluatedRows = [];

  for (const row of rows) {
    for (const field of requiredRowFields) {
      requireCondition(row[field] !== undefined, `${row.source_row_id ?? "(missing row)"} missing ${field}`);
    }
    requireCondition(!seenPredictionIds.has(row.prediction_row_id), `duplicate prediction_row_id ${row.prediction_row_id}`);
    seenPredictionIds.add(row.prediction_row_id);
    requireCondition(row.prediction_artifact_row_sha256 === rowHash(row), `${row.source_row_id} row hash mismatch`);
    requireCondition(typeof row.row_no_hand_decision === "boolean", `${row.source_row_id} row_no_hand_decision must be boolean`);
    requireObject(row.row_confidence_summary, `${row.source_row_id} row_confidence_summary missing`);
    for (const targetId of learnedTargetIds) {
      validatePredictedTarget(row.predicted_targets?.[targetId], row.source_row_id, targetId);
    }

    if (row.row_source === "m3id_positive_packet") {
      const source = positiveById.get(row.source_row_id);
      requireCondition(source, `unknown positive source_row_id ${row.source_row_id}`);
      requireCondition(!seenPositive.has(row.source_row_id), `duplicate positive source_row_id ${row.source_row_id}`);
      seenPositive.add(row.source_row_id);
      requireCondition(row.metric_family === "positive_hand_recall_and_false_no_hand", `${row.source_row_id} wrong metric_family`);
      requireCondition(row.split === source.split, `${row.source_row_id} split mismatch`);
      requireCondition(row.label_id === source.label_id, `${row.source_row_id} label_id mismatch`);
      requireCondition(row.source_artifact === source.source_artifact, `${row.source_row_id} source_artifact mismatch`);
      requireCondition(row.expected_outcome === "positive_hand_target", `${row.source_row_id} expected_outcome mismatch`);
      for (const targetId of learnedTargetIds) {
        validateExpectedTarget(row.expected_targets?.[targetId], expectedPositiveTarget(source, targetId), row.source_row_id, targetId);
      }
      evaluatedRows.push({ kind: "positive", row, source });
    } else if (row.row_source === "m3ih_negative_manifest") {
      const source = negativeById.get(row.source_row_id);
      requireCondition(source, `unknown negative source_row_id ${row.source_row_id}`);
      requireCondition(!seenNegative.has(row.source_row_id), `duplicate negative source_row_id ${row.source_row_id}`);
      seenNegative.add(row.source_row_id);
      requireCondition(row.split === source.split, `${row.source_row_id} split mismatch`);
      requireCondition(row.negative_category === source.challenge_type, `${row.source_row_id} negative_category mismatch`);
      requireCondition(row.source_id === source.source_id, `${row.source_row_id} source_id mismatch`);
      requireCondition(row.source_scope_for_this_row === source.source_scope_for_this_row, `${row.source_row_id} scope mismatch`);
      requireCondition(source.allowed_for_training === false, `${row.source_row_id} negative row must remain validation-only`);

      const strict = source.strict_no_hand_absence_category === true;
      const expectedFamily = strict ? "strict_no_hand_absence_false_trigger" : "non_target_asl_sign_context_report";
      const expectedOutcome = strict ? "strict_no_hand_absence" : "non_target_asl_sign_context";
      requireCondition(row.metric_family === expectedFamily, `${row.source_row_id} wrong metric_family`);
      requireCondition(row.expected_outcome === expectedOutcome, `${row.source_row_id} expected_outcome mismatch`);
      for (const targetId of learnedTargetIds) {
        validateExpectedTarget(row.expected_targets?.[targetId], expectedNegativeTarget(source, targetId), row.source_row_id, targetId);
      }
      evaluatedRows.push({ kind: strict ? "strict_negative" : "non_target_context", row, source });
    } else {
      throw new HarnessError(`${row.source_row_id} has unsupported row_source ${row.row_source}`);
    }
  }

  requireCondition(seenPositive.size === positiveRows.length, "prediction artifact missing positive rows");
  requireCondition(seenNegative.size === negativeRows.length, "prediction artifact missing negative rows");
  return evaluatedRows;
}

function computeMetrics(contract, thresholdProfile, evaluatedRows) {
  const threshold = thresholdProfile.hand_presence_confidence_threshold;
  const iouThresholds = contract.positive_row_metric_semantics.hand_recall_at_iou.iou_thresholds;
  const recallCounters = Object.fromEntries(iouThresholds.map((value) => [String(value), emptyCounter()]));
  const recallBreakdowns = Object.fromEntries(iouThresholds.map((value) => [String(value), { by_split: {}, by_target_id: {}, by_label_id: {} }]));
  const falseNoHand = { ...emptyCounter(), by_split: {}, by_label_id: {}, by_target_id: {} };
  const heldOutIou = Object.fromEntries(learnedTargetIds.map((targetId) => [targetId, { sum: 0, count: 0, mean_iou: null }]));

  const strictFalseTrigger = { ...emptyCounter(), by_challenge_type: {}, by_source_id: {}, by_source_scope_for_this_row: {} };
  const categoryCounts = {};
  for (const category of [...strictNoHandCategories, nonTargetCategory]) {
    categoryCounts[category] = {
      row_count: 0,
      false_trigger_count: 0,
      false_trigger_rate: null,
      threshold_profile_id: thresholdProfile.profile_id,
    };
  }
  const nonTargetContext = {
    row_count: 0,
    no_hand_decision_count: 0,
    hand_prediction_count: 0,
    notes_on_detector_behavior: "reported separately from strict no-hand false-trigger gate",
  };

  for (const item of evaluatedRows) {
    if (item.kind === "positive") {
      const presentTargets = learnedTargetIds.filter((targetId) => item.source.target_payloads[targetId]?.presence === true);
      const presentAboveThreshold = presentTargets.filter((targetId) =>
        predictedPresentAboveThreshold(item.row.predicted_targets[targetId], threshold)
      );
      const rowFalseNoHand = item.row.row_no_hand_decision === true || presentAboveThreshold.length === 0;
      falseNoHand.denominator += 1;
      if (rowFalseNoHand) falseNoHand.numerator += 1;
      incrementBreakdown(falseNoHand.by_split, [item.source.split], rowFalseNoHand ? 1 : 0);
      incrementBreakdown(falseNoHand.by_label_id, [item.source.label_id], rowFalseNoHand ? 1 : 0);

      for (const targetId of presentTargets) {
        const expectedBox = item.source.target_payloads[targetId].box_xyxy_norm;
        const targetMissed = !predictedPresentAboveThreshold(item.row.predicted_targets[targetId], threshold);
        incrementBreakdown(falseNoHand.by_target_id, [targetId], targetMissed ? 1 : 0);

        for (const iouThresholdValue of iouThresholds) {
          const key = String(iouThresholdValue);
          const hit = predictedHit(item.row.predicted_targets[targetId], threshold, expectedBox, iouThresholdValue);
          recallCounters[key].denominator += 1;
          if (hit) recallCounters[key].numerator += 1;
          incrementBreakdown(recallBreakdowns[key].by_split, [item.source.split], hit ? 1 : 0);
          incrementBreakdown(recallBreakdowns[key].by_target_id, [targetId], hit ? 1 : 0);
          incrementBreakdown(recallBreakdowns[key].by_label_id, [item.source.label_id], hit ? 1 : 0);
        }

        if (item.source.split === contract.positive_row_metric_semantics.fixed_baseline_beat_it_comparison.held_out_split) {
          heldOutIou[targetId].sum += iou(item.row.predicted_targets[targetId].box_xyxy_normalized_full_frame, expectedBox);
          heldOutIou[targetId].count += 1;
        }
      }
    } else {
      const category = item.source.challenge_type;
      const handPredictionCount = learnedTargetIds.filter((targetId) =>
        predictedPresentAboveThreshold(item.row.predicted_targets[targetId], threshold)
      ).length;
      const falseTrigger = handPredictionCount > 0 || item.row.row_no_hand_decision === false;
      categoryCounts[category].row_count += 1;
      if (falseTrigger) categoryCounts[category].false_trigger_count += 1;

      if (item.kind === "strict_negative") {
        strictFalseTrigger.denominator += 1;
        if (falseTrigger) strictFalseTrigger.numerator += 1;
        incrementBreakdown(strictFalseTrigger.by_challenge_type, [category], falseTrigger ? 1 : 0);
        incrementBreakdown(strictFalseTrigger.by_source_id, [item.source.source_id], falseTrigger ? 1 : 0);
        incrementBreakdown(strictFalseTrigger.by_source_scope_for_this_row, [item.source.source_scope_for_this_row], falseTrigger ? 1 : 0);
      } else {
        nonTargetContext.row_count += 1;
        if (item.row.row_no_hand_decision === true) nonTargetContext.no_hand_decision_count += 1;
        if (handPredictionCount > 0) nonTargetContext.hand_prediction_count += 1;
      }
    }
  }

  falseNoHand.rate = rate(falseNoHand.numerator, falseNoHand.denominator);
  for (const counter of Object.values(recallCounters)) counter.rate = rate(counter.numerator, counter.denominator);
  for (const target of Object.values(heldOutIou)) target.mean_iou = rate(target.sum, target.count);
  strictFalseTrigger.rate = rate(strictFalseTrigger.numerator, strictFalseTrigger.denominator);
  for (const category of Object.values(categoryCounts)) {
    category.false_trigger_rate = rate(category.false_trigger_count, category.row_count);
  }

  const baseline = contract.positive_row_metric_semantics.fixed_baseline_beat_it_comparison.learned_detector_must_strictly_exceed;
  const fixedBaselineBeatIt = {};
  for (const targetId of learnedTargetIds) {
    fixedBaselineBeatIt[targetId] = {
      held_out_mean_iou: heldOutIou[targetId].mean_iou,
      fixed_baseline_iou: baseline[targetId],
      strictly_exceeds_fixed_baseline: heldOutIou[targetId].mean_iou !== null
        ? heldOutIou[targetId].mean_iou > baseline[targetId]
        : false,
    };
  }

  return {
    positive: {
      row_count: falseNoHand.denominator,
      false_no_hand: falseNoHand,
      hand_recall_at_iou: Object.fromEntries(
        Object.entries(recallCounters).map(([thresholdKey, counter]) => [
          `iou_${thresholdKey.replace(".", "_")}`,
          {
            ...counter,
            threshold: Number(thresholdKey),
            breakdowns: recallBreakdowns[thresholdKey],
          },
        ]),
      ),
      held_out_hand_iou_vs_fixed_baseline: fixedBaselineBeatIt,
    },
    strict_no_hand_negative: {
      row_count: strictFalseTrigger.denominator,
      false_trigger: strictFalseTrigger,
      category_level_false_trigger_counts: categoryCounts,
    },
    non_target_asl_sign_context: nonTargetContext,
  };
}

function buildGateSummary(contract, metrics, synthetic) {
  const falseNoHandGate = contract.positive_row_metric_semantics.false_no_hand_rate.target_gate_from_fixed_baseline_contract;
  const recallGate030 = contract.positive_row_metric_semantics.hand_recall_at_iou.recall_at_iou_0_30_gate;
  const recallGate050 = contract.positive_row_metric_semantics.hand_recall_at_iou.recall_at_iou_0_50_gate;
  const falseTriggerGate = contract.negative_row_metric_semantics.strict_no_hand_false_trigger_rate.target_gate_from_fixed_baseline_contract;
  const beatIt = metrics.positive.held_out_hand_iou_vs_fixed_baseline;

  return {
    status: synthetic ? "not_model_performance_synthetic_harness_validation_only" : "computed_model_gate_comparison",
    model_performance_claimed: false,
    checks: {
      positive_false_no_hand_rate_lte_0_02: metrics.positive.false_no_hand.rate <= falseNoHandGate,
      positive_recall_at_iou_0_30_gte_0_98: metrics.positive.hand_recall_at_iou.iou_0_3.rate >= recallGate030,
      positive_recall_at_iou_0_50_gte_0_90: metrics.positive.hand_recall_at_iou.iou_0_5.rate >= recallGate050,
      strict_no_hand_false_trigger_rate_lte_0_05: metrics.strict_no_hand_negative.false_trigger.rate <= falseTriggerGate,
      held_out_left_hand_iou_strictly_exceeds_fixed: beatIt.left_or_first_hand.strictly_exceeds_fixed_baseline,
      held_out_right_hand_iou_strictly_exceeds_fixed: beatIt.right_or_second_hand.strictly_exceeds_fixed_baseline,
      non_target_asl_sign_excluded_from_strict_no_hand_gate: true,
    },
  };
}

export function evaluateDetector0NegativeMetrics({
  predictionsPath,
  contractPath = DEFAULTS.contract,
  positivePacketPath = DEFAULTS.positivePacket,
  negativeManifestPath = DEFAULTS.negativeManifest,
  allowSyntheticSmoke = false,
}) {
  const contract = readJson(contractPath);
  const positivePacket = readJson(positivePacketPath);
  const negativeManifest = readJson(negativeManifestPath);
  const prediction = readJson(predictionsPath);
  const synthetic = prediction.synthetic_fixture?.is_synthetic === true;

  requireCondition(
    contract.schema_version === "asl-pilot-detector0-negative-evaluation-metric-contract/v1",
    "unsupported metric contract schema_version",
  );
  requireCondition(
    prediction.schema_version === contract.future_prediction_artifact_schema.schema_version,
    "prediction artifact schema_version mismatch",
  );
  for (const field of contract.future_prediction_artifact_schema.required_top_level_fields) {
    requireCondition(prediction[field] !== undefined, `prediction artifact missing ${field}`);
  }

  const contractSha = sha256File(contractPath);
  if (prediction.metric_contract_path !== undefined) {
    requireCondition(prediction.metric_contract_path === projectRelative(contractPath), "metric_contract_path mismatch");
  }
  if (prediction.metric_contract_sha256 !== undefined) {
    requireCondition(prediction.metric_contract_sha256 === contractSha, "metric_contract_sha256 mismatch");
  }

  validateModelHashes(prediction, allowSyntheticSmoke);
  validateAttestation(prediction.no_pretrained_no_generated_label_attestation);
  const thresholdProfile = validateThresholdProfile(contract, prediction.threshold_profile);
  const sourceArtifacts = validateSourceHashes(contract, prediction, {
    positivePacket: positivePacketPath,
    negativeManifest: negativeManifestPath,
  });
  const evaluatedRows = validateRows({ contract, prediction, positivePacket, negativeManifest });
  const metrics = computeMetrics(contract, thresholdProfile, evaluatedRows);
  const gateSummary = buildGateSummary(contract, metrics, synthetic);
  const predictionSha = sha256File(predictionsPath);

  return {
    schema_version: "asl-pilot-detector0-negative-evaluation-harness-result/v1",
    evaluated_at: new Date().toISOString(),
    status: synthetic
      ? "passed_synthetic_harness_validation_not_model_performance"
      : "completed_negative_evaluation_metrics",
    evaluation_kind: synthetic ? "synthetic_harness_smoke" : "future_scratch_detector_prediction_artifact",
    model_performance_claimed: false,
    active_contract: {
      path: projectRelative(contractPath),
      sha256: contractSha,
      schema_version: contract.schema_version,
    },
    prediction_artifact: {
      path: projectRelative(predictionsPath),
      sha256: predictionSha,
      prediction_artifact_id: prediction.prediction_artifact_id,
      synthetic_fixture: prediction.synthetic_fixture ?? null,
    },
    source_artifacts: {
      [projectRelative(contractPath)]: { sha256: contractSha },
      ...sourceArtifacts,
    },
    validation: {
      prediction_schema_valid: true,
      row_ids_match_contract_sources: true,
      positive_rows_validated: evaluatedRows.filter((row) => row.kind === "positive").length,
      strict_no_hand_negative_rows_validated: evaluatedRows.filter((row) => row.kind === "strict_negative").length,
      non_target_context_rows_validated: evaluatedRows.filter((row) => row.kind === "non_target_context").length,
      threshold_profile_frozen: true,
      no_pretrained_no_generated_label_attestation_valid: true,
      prediction_row_hashes_valid: true,
      source_artifact_hashes_valid: true,
      row_metric_family_separation_valid: true,
    },
    metrics,
    gate_summary: gateSummary,
    synthetic_smoke_disclaimer: synthetic
      ? {
          synthetic_fixture_output: true,
          detector_output: false,
          trained_detector_invoked: false,
          model_performance_evidence: false,
          purpose: "Exercise harness schema validation, row-family separation, IoU math, and negative false-trigger accounting only.",
        }
      : null,
  };
}

function expectedTargetForFixture(sourceRow, targetId) {
  const target = sourceRow.target_payloads[targetId];
  const presence = target.presence === true;
  return {
    presence,
    box_xyxy_normalized_full_frame: presence ? target.box_xyxy_norm : null,
    label_source: sourceRow.review?.label_source ?? sourceRow.review?.annotation_source ?? "tracked_manual_review",
    review_status: sourceRow.review?.review_status ?? "tracked_manual_review",
    source_artifact_path: sourceRow.source_artifact_path,
    source_artifact_sha256: sha256File(sourceRow.source_artifact_path),
  };
}

function syntheticPredictedTarget({ present, box, confidence, targetId, sourceRowId }) {
  return {
    predicted_present: present,
    confidence,
    box_xyxy_normalized_full_frame: present ? box : null,
    raw_model_output_ref: `synthetic://m3ij-harness-smoke/${sourceRowId}/${targetId}`,
    box_source: present ? "synthetic_harness_smoke_expected_box_copy" : "synthetic_harness_smoke_absent_target",
  };
}

function attachRowHash(row) {
  return { ...row, prediction_artifact_row_sha256: rowHash(row) };
}

export function buildSyntheticSmokeFixture({
  contractPath = DEFAULTS.contract,
  positivePacketPath = DEFAULTS.positivePacket,
  negativeManifestPath = DEFAULTS.negativeManifest,
  checkedAt = new Date().toISOString(),
} = {}) {
  const contract = readJson(contractPath);
  const positivePacket = readJson(positivePacketPath);
  const negativeManifest = readJson(negativeManifestPath);
  const positiveSha = sha256File(positivePacketPath);
  const negativeSha = sha256File(negativeManifestPath);
  const contractSha = sha256File(contractPath);
  const modelHash = sha256Text("m3ij synthetic harness smoke has no detector model artifact");
  const trainingHash = sha256Text("m3ij synthetic harness smoke has no training receipt");
  const thresholdProfile = {
    profile_id: "m3ij-synthetic-smoke-thresholds-v1",
    hand_presence_confidence_threshold: 0.5,
    no_hand_decision_rule: "row_no_hand_decision_true_when_no_learned_hand_confidence_at_or_above_threshold",
    box_coordinate_space: coordinateSpace,
    iou_thresholds_reported: contract.positive_row_metric_semantics.hand_recall_at_iou.iou_thresholds,
    frozen: true,
    frozen_at: checkedAt,
    frozen_before_metric_computation: true,
  };

  const rows = [];
  for (const sourceRow of positivePacket.included_rows) {
    const predictedTargets = {};
    const expectedTargets = {};
    for (const targetId of learnedTargetIds) {
      expectedTargets[targetId] = expectedTargetForFixture(sourceRow, targetId);
      predictedTargets[targetId] = syntheticPredictedTarget({
        present: expectedTargets[targetId].presence === true,
        box: expectedTargets[targetId].box_xyxy_normalized_full_frame,
        confidence: expectedTargets[targetId].presence === true ? 0.95 : 0.05,
        targetId,
        sourceRowId: sourceRow.packet_row_id,
      });
    }
    rows.push(attachRowHash({
      prediction_row_id: `synthetic-positive-${sourceRow.packet_row_id}`,
      source_row_id: sourceRow.packet_row_id,
      row_source: "m3id_positive_packet",
      metric_family: "positive_hand_recall_and_false_no_hand",
      split: sourceRow.split,
      source_artifact: sourceRow.source_artifact,
      label_id: sourceRow.label_id,
      expected_outcome: "positive_hand_target",
      expected_targets: expectedTargets,
      predicted_targets: predictedTargets,
      row_no_hand_decision: false,
      row_confidence_summary: {
        threshold_profile_id: thresholdProfile.profile_id,
        max_hand_confidence: 0.95,
      },
    }));
  }

  for (const sourceRow of negativeManifest.rows) {
    const strict = sourceRow.strict_no_hand_absence_category === true;
    const expectedTargets = {};
    const predictedTargets = {};
    for (const targetId of learnedTargetIds) {
      const expected = expectedNegativeTarget(sourceRow, targetId);
      expectedTargets[targetId] = {
        presence: expected.presence,
        box_xyxy_normalized_full_frame: null,
        label_source: sourceRow.no_pretrained_no_generated_label_attestation.label_or_expected_outcome_source,
        review_status: sourceRow.review_status,
        source_artifact_path: sourceRow.source_fixture_path,
        source_artifact_sha256: sourceRow.source_fixture_sha256,
      };
      const contextHandPrediction = !strict && targetId === "left_or_first_hand";
      predictedTargets[targetId] = syntheticPredictedTarget({
        present: contextHandPrediction,
        box: contextHandPrediction ? [0.2, 0.2, 0.42, 0.46] : null,
        confidence: contextHandPrediction ? 0.8 : 0.04,
        targetId,
        sourceRowId: sourceRow.manifest_row_id,
      });
    }
    rows.push(attachRowHash({
      prediction_row_id: `synthetic-negative-${sourceRow.manifest_row_id}`,
      source_row_id: sourceRow.manifest_row_id,
      row_source: "m3ih_negative_manifest",
      metric_family: strict ? "strict_no_hand_absence_false_trigger" : "non_target_asl_sign_context_report",
      split: sourceRow.split,
      negative_category: sourceRow.challenge_type,
      source_id: sourceRow.source_id,
      source_scope_for_this_row: sourceRow.source_scope_for_this_row,
      expected_outcome: strict ? "strict_no_hand_absence" : "non_target_asl_sign_context",
      expected_targets: expectedTargets,
      predicted_targets: predictedTargets,
      row_no_hand_decision: strict,
      row_confidence_summary: {
        threshold_profile_id: thresholdProfile.profile_id,
        max_hand_confidence: strict ? 0.04 : 0.8,
      },
    }));
  }

  return {
    schema_version: contract.future_prediction_artifact_schema.schema_version,
    prediction_artifact_id: "m3ij-synthetic-negative-evaluation-harness-smoke-v1",
    created_at: checkedAt,
    metric_contract_path: projectRelative(contractPath),
    metric_contract_sha256: contractSha,
    detector0_model_artifact_path: "synthetic://m3ij-harness-smoke/no-detector-model",
    detector0_model_artifact_sha256: modelHash,
    detector0_training_receipt_path: "synthetic://m3ij-harness-smoke/no-training-receipt",
    detector0_training_receipt_sha256: trainingHash,
    source_positive_packet_path: projectRelative(positivePacketPath),
    source_positive_packet_sha256: positiveSha,
    source_negative_manifest_path: projectRelative(negativeManifestPath),
    source_negative_manifest_sha256: negativeSha,
    threshold_profile: thresholdProfile,
    no_pretrained_no_generated_label_attestation: {
      detector0_model_is_scratch_trained: true,
      no_pretrained_detector_outputs_used: true,
      no_pretrained_landmark_outputs_used: true,
      no_pretrained_feature_or_embedding_outputs_used: true,
      no_pretrained_backbone_used: true,
      no_teacher_model_outputs_used: true,
      no_generated_labels_used: true,
      no_pseudo_labels_used: true,
      expected_labels_from_tracked_human_or_project_authored_sources_only: true,
      pretrained_components: [],
      synthetic_fixture: true,
      attestation_note: "Synthetic predictions exercise the harness only and are not detector output, generated labels, pseudo-labels, or model performance evidence.",
    },
    synthetic_fixture: {
      is_synthetic: true,
      detector_output: false,
      trained_detector_invoked: false,
      generated_labels_or_pseudo_labels: false,
      derived_from_pretrained_outputs: false,
      model_performance_evidence: false,
      generation_policy: "Programmatically copies existing expected-target metadata only to exercise harness math; predicted boxes are synthetic smoke values.",
    },
    rows,
  };
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      console.log(usage());
      return;
    }
    if (args.writeSyntheticSmokeFixture) {
      const fixture = buildSyntheticSmokeFixture({
        contractPath: args.contract,
        positivePacketPath: args.positivePacket,
        negativeManifestPath: args.negativeManifest,
      });
      writeJson(args.writeSyntheticSmokeFixture, fixture);
      return;
    }
    if (!args.predictions) {
      throw new HarnessError("--predictions is required unless --write-synthetic-smoke-fixture is used");
    }

    const result = evaluateDetector0NegativeMetrics({
      predictionsPath: args.predictions,
      contractPath: args.contract,
      positivePacketPath: args.positivePacket,
      negativeManifestPath: args.negativeManifest,
      allowSyntheticSmoke: args.allowSyntheticSmoke,
    });

    if (args.output) {
      writeJson(args.output, result);
    } else {
      process.stdout.write(stableStringify(result));
    }
  } catch (error) {
    console.error(`Detector 0 negative metric harness failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
