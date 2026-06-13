import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const contractPath = "docs/model/return-to-form-detector0-strict-gate-crop-normalization-contract.json";
const m3fpReceiptPath = "docs/validation/return-to-form-m3fp-overnight-brev-detector-tcn-completion-v1.json";
const modelCardPath = "web/public/model/model-card.json";
const detectorCardPath = "web/public/model/detector0-card.json";
const activeVocabularyPath = "docs/model/active-vocabulary-claim.json";

const blockers = [];
const checks = [];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function addCheck(id, label, passed, evidence = {}, blocker = `${label} failed`) {
  checks.push({
    id,
    label,
    status: passed ? "passed" : "failed",
    evidence,
  });
  if (!passed) blockers.push(blocker);
}

function sameArray(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && actual.every((value, index) => value === expected[index]);
}

function closeEnough(actual, expected) {
  return typeof actual === "number" && Math.abs(actual - expected) < 1e-12;
}

const contract = readJson(contractPath);
const m3fpReceipt = readJson(m3fpReceiptPath);
const modelCard = readJson(modelCardPath);
const detectorCard = readJson(detectorCardPath);
const activeVocabulary = readJson(activeVocabularyPath);

addCheck(
  "schema_and_status",
  "Strict-gate contract is diagnostic-only and bound to M3FQ",
  contract.schema_version === "asl-pilot-detector0-strict-gate-crop-normalization-contract/v1"
    && contract.status === "diagnostic_contract_only"
    && contract.active_prompt === "docs/model/return-to-form-m3fq-detector0-crop-normalized-recognizer-integration-goal-loop-prompt.md",
  {
    schema_version: contract.schema_version,
    status: contract.status,
    active_prompt: contract.active_prompt,
  },
);

addCheck(
  "m3fp_boundary",
  "M3FP receipt remains failed-gate accounting evidence only",
  m3fpReceipt.status === "completed_not_promotable"
    && m3fpReceipt.next_action === "continue_detector0_integration_for_crop_normalized_recognizer"
    && contract.m3fp_boundary?.copied_artifacts_are_accounting_only === true
    && closeEnough(contract.m3fp_boundary?.summary?.validation_top1, 0.2)
    && closeEnough(contract.m3fp_boundary?.summary?.test_top1, 0.2),
  {
    m3fp_status: m3fpReceipt.status,
    m3fp_next_action: m3fpReceipt.next_action,
    contract_boundary: contract.m3fp_boundary,
  },
);

const policy = contract.strict_gate_policy ?? {};
addCheck(
  "strict_gate_identity",
  "Contract pins the reviewed strict contact/right-hand gate identity",
  policy.variant_id === "manifest_validation_fp05_contact_gate"
    && policy.classification === "stricter_gate_supported_not_product_ready"
    && policy.learned_region === "right_or_second_hand"
    && policy.learned_region_id === "viewer_right_hand_context"
    && policy.contact_gate_target === "table_two_hand_union_or_contact_region",
  {
    variant_id: policy.variant_id,
    classification: policy.classification,
    learned_region: policy.learned_region,
    learned_region_id: policy.learned_region_id,
    contact_gate_target: policy.contact_gate_target,
  },
);

addCheck(
  "strict_gate_target_sets",
  "Contract preserves fixed, learned, and diagnostic target sets",
  sameArray(policy.fixed_geometry_targets, [
    "left_or_first_hand",
    "head_or_face",
    "upper_body_or_signing_space",
  ])
    && sameArray(policy.learned_runtime_targets, ["right_or_second_hand"])
    && sameArray(policy.diagnostic_targets, ["table_two_hand_union_or_contact_region"]),
  {
    fixed_geometry_targets: policy.fixed_geometry_targets,
    learned_runtime_targets: policy.learned_runtime_targets,
    diagnostic_targets: policy.diagnostic_targets,
  },
);

addCheck(
  "strict_gate_threshold",
  "Contract pins the 5 percent validation-frame false-positive gate",
  closeEnough(policy.contact_threshold, 0.20632459223270416)
    && closeEnough(policy.validation_frame_false_positive_rate_limit, 0.05)
    && policy.validation_frame_threshold_metrics?.false_positive_count === 79
    && policy.validation_frame_threshold_metrics?.true_negative_count === 1521
    && closeEnough(policy.validation_frame_threshold_metrics?.recall, 0.0575),
  {
    contact_threshold: policy.contact_threshold,
    validation_frame_false_positive_rate_limit: policy.validation_frame_false_positive_rate_limit,
    validation_frame_threshold_metrics: policy.validation_frame_threshold_metrics,
  },
);

addCheck(
  "strict_gate_transform_and_metrics",
  "Contract preserves strict-gate transform and recognizer-smoke metrics without promoting them",
  closeEnough(policy.transform_summary?.used_learned_right_crop_rate, 0.06068840579710145)
    && closeEnough(policy.transform_summary?.fallback_right_crop_rate, 0.9393115942028986)
    && closeEnough(policy.recognizer_smoke_metrics?.validation_top1, 0.256)
    && closeEnough(policy.recognizer_smoke_metrics?.test_top1, 0.3263157894736842)
    && sameArray(policy.recognizer_smoke_metrics?.validation_zero_recall_labels, [])
    && sameArray(policy.recognizer_smoke_metrics?.test_zero_recall_labels, []),
  {
    transform_summary: policy.transform_summary,
    recognizer_smoke_metrics: policy.recognizer_smoke_metrics,
  },
);

const integration = contract.main_branch_integration_contract ?? {};
addCheck(
  "future_smoke_contract",
  "Contract names the next local smoke target and forbids training/spend in this slice",
  integration.contract_kind === "static_policy_for_future_local_smoke"
    && integration.future_target_script === "scripts/run_return_to_form_tier0_detector0_strict_gate_crop_normalization_smoke.py"
    && integration.future_target_test_or_audit === "scripts/audit_detector0_strict_gate_crop_contract.mjs"
    && Array.isArray(integration.forbidden_this_slice)
    && integration.forbidden_this_slice.includes("brev_lifecycle_or_remote_command")
    && integration.forbidden_this_slice.includes("recognizer_training_or_fitting")
    && integration.forbidden_this_slice.includes("export_or_promotion"),
  {
    contract_kind: integration.contract_kind,
    future_target_script: integration.future_target_script,
    forbidden_this_slice: integration.forbidden_this_slice,
  },
);

addCheck(
  "fail_closed_claim_surfaces",
  "Browser and Detector 0 claim surfaces remain fail-closed",
  modelCard.status === "not_trained"
    && Array.isArray(activeVocabulary.activeLabels)
    && activeVocabulary.activeLabels.length === 0
    && detectorCard.status === "not_trained"
    && detectorCard.promotion_state === "research_only"
    && detectorCard.browser_artifact === null,
  {
    model_card_status: modelCard.status,
    active_label_count: Array.isArray(activeVocabulary.activeLabels) ? activeVocabulary.activeLabels.length : null,
    detector0_status: detectorCard.status,
    detector0_promotion_state: detectorCard.promotion_state,
    detector0_browser_artifact: detectorCard.browser_artifact,
  },
);

addCheck(
  "claim_boundary",
  "Contract does not grant Detector 0, browser, ASL correctness, or readiness authority",
  contract.claim_boundary?.detector0_product_authority === false
    && contract.claim_boundary?.browser_recognition_authority === false
    && contract.claim_boundary?.asl_correctness_authority === false
    && contract.claim_boundary?.model_readiness_claim === false
    && Array.isArray(contract.claim_boundary?.pretrained_components)
    && contract.claim_boundary.pretrained_components.length === 0,
  contract.claim_boundary,
);

addCheck(
  "next_action",
  "Contract selects exactly one allowed M3FQ next action",
  contract.next_action === "continue_detector0_crop_normalized_local_smoke_no_brev",
  { next_action: contract.next_action },
);

const summary = {
  schema_version: "asl-pilot-detector0-strict-gate-crop-contract-audit/v1",
  status: blockers.length === 0 ? "passed" : "failed",
  checked_at: new Date().toISOString(),
  contract: contractPath,
  checks,
  blockers,
};

console.log(JSON.stringify(summary, null, 2));

if (blockers.length > 0) {
  process.exit(1);
}
