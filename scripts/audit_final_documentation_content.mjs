import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");

const docs = [
  {
    path: "README.md",
    required: [
      "node scripts/audit_completion_readiness.mjs",
      "node scripts/run_final_privacy_smoke.mjs",
      "node scripts/run_final_browser_onnx_smoke.mjs",
      "node scripts/audit_final_browser_compatibility.mjs",
      "node scripts/audit_vocabulary_review.mjs",
    ],
    blocked: [
      /live model card is still `not_trained`/i,
      /pending Deaf educator or qualified ASL instructor review/i,
      /project is not complete until/i,
    ],
  },
  {
    path: "docs/validation/validation-report.md",
    required: [
      "<!-- asl-pilot-validation-report:v1 -->",
      "Validation report JSON",
      "Calibrated provenance JSON",
      "Negative challenge manifest",
    ],
    blocked: [
      /Validation is not complete/i,
      /does not yet prove final ASL recognition accuracy/i,
      /Final accuracy still requires/i,
      /Final accuracy is unproven/i,
    ],
  },
  {
    path: "docs/acceptance-checklist.md",
    required: [
      "Completion readiness audit",
      "Final browser ONNX runtime proof",
      "Source-curated vocabulary evidence",
      "Local ML/GPU environment",
    ],
    blocked: [
      /\|\s*[^|\n]+\s*\|\s*[^|\n]+\s*\|\s*[^|\n]+\s*\|\s*Partial\s*\|/i,
      /\|\s*[^|\n]+\s*\|\s*[^|\n]+\s*\|\s*[^|\n]+\s*\|\s*Missing\s*\|/i,
      /currently fails/i,
      /pending real/i,
      /metrics pending/i,
      /unproven with a real trained ASL artifact/i,
    ],
  },
  {
    path: "docs/model/dataset-and-training-plan.md",
    required: [
      "node scripts/promote_source_curated_vocabulary.mjs --write",
      "docs/review/final-vocabulary-review.json",
      "source-curated",
      "node scripts/audit_reviewed_vocabulary_collection_gate.mjs",
      "cd web",
      "./.venv/bin/python scripts/audit_local_ml_environment.py",
      "./.venv/bin/python scripts/audit_final_manifests.py",
    ],
    blocked: [
      /artifacts are not complete yet/i,
      /Do not claim final pilot model quality until/i,
    ],
  },
];

const evidenceAudits = [
  {
    id: "reviewed_vocabulary_evidence",
    label: "Final docs are backed by source-curated or reviewed vocabulary evidence",
    command: "node",
    args: ["scripts/audit_vocabulary_review.mjs"],
  },
  {
    id: "dataset_collection_evidence",
    label: "Final docs are backed by ready consented dataset collection",
    command: "node",
    args: ["scripts/audit_dataset_collection_readiness.mjs"],
  },
  {
    id: "clip_review_evidence",
    label: "Final docs are backed by resolved clip review",
    command: "node",
    args: ["scripts/audit_clip_review.mjs"],
  },
  {
    id: "negative_challenge_review_evidence",
    label: "Final docs are backed by resolved negative challenge review",
    command: "node",
    args: ["scripts/audit_challenge_review.mjs"],
  },
  {
    id: "final_manifest_evidence",
    label: "Final docs are backed by strict final manifest validation",
    command: "./.venv/bin/python",
    args: ["scripts/audit_final_manifests.py"],
  },
  {
    id: "validation_report_evidence",
    label: "Final docs are backed by promoted validation report evidence",
    command: "node",
    args: ["scripts/audit_validation_report_doc.mjs"],
  },
  {
    id: "trained_model_promotion_evidence",
    label: "Final docs are backed by trained model-card promotion evidence",
    command: "node",
    args: ["scripts/promote_trained_model_card.mjs", "--dry-run"],
  },
  {
    id: "browser_onnx_evidence",
    label: "Final docs are backed by retained browser ONNX runtime evidence",
    command: "node",
    args: ["scripts/audit_final_browser_onnx_smoke.mjs"],
  },
  {
    id: "browser_compatibility_evidence",
    label: "Final docs are backed by retained cross-browser evidence",
    command: "node",
    args: ["scripts/audit_final_browser_compatibility.mjs"],
  },
];

function projectPath(relativePath) {
  return path.join(root, relativePath);
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function conciseOutput(result) {
  const text = (result.stderr.trim() || result.stdout.trim()).split("\n");
  const lines = text.slice(0, 10);
  if (text.length > lines.length) lines.push(`... ${text.length - lines.length} more line(s)`);
  return lines.join("\n");
}

function main() {
  const checks = [];
  const blockers = [];
  for (const doc of docs) {
    const file = projectPath(doc.path);
    if (!fs.existsSync(file)) {
      blockers.push(`${doc.path} is missing`);
      checks.push({ path: doc.path, status: "missing", blockers: [`${doc.path} is missing`] });
      continue;
    }
    const text = fs.readFileSync(file, "utf8");
    const docBlockers = [];
    for (const snippet of doc.required) {
      if (!text.includes(snippet)) docBlockers.push(`missing required final-doc snippet: ${snippet}`);
    }
    for (const pattern of doc.blocked) {
      if (pattern.test(text)) docBlockers.push(`contains incomplete/final-blocking language matching ${pattern}`);
    }
    blockers.push(...docBlockers.map((blocker) => `${doc.path}: ${blocker}`));
    checks.push({
      path: doc.path,
      status: docBlockers.length === 0 ? "passed" : "failed",
      sha256: sha256File(file),
      blockers: docBlockers,
    });
  }
  for (const audit of evidenceAudits) {
    const result = spawnSync(audit.command, audit.args, {
      cwd: root,
      encoding: "utf8",
    });
    const auditBlockers = result.status === 0
      ? []
      : [`${audit.label} failed: ${conciseOutput(result)}`];
    blockers.push(...auditBlockers.map((blocker) => `${audit.id}: ${blocker}`));
    checks.push({
      id: audit.id,
      label: audit.label,
      command: [audit.command, ...audit.args].join(" "),
      status: auditBlockers.length === 0 ? "passed" : "failed",
      blockers: auditBlockers,
    });
  }
  const summary = {
    status: blockers.length === 0 ? "passed" : "incomplete",
    checked_at: new Date().toISOString(),
    checks,
    blockers,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (blockers.length > 0) {
    console.error("Final documentation content audit failed:");
    for (const blocker of blockers) console.error(`- ${blocker}`);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Final documentation content audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
