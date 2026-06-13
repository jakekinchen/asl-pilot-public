import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultInputs = [
  path.join(root, "docs", "review", "wikimedia-commons-negative-challenge-review-packet.json"),
  path.join(root, "docs", "review", "cira-negative-challenge-review-packet.json"),
  path.join(root, "docs", "review", "asl-citizen-non-target-negative-challenge-review-packet.json"),
  path.join(root, "docs", "review", "internet-archive-negative-challenge-review-packet.json"),
];
const defaultOutputPath = path.join(root, "docs", "review", "online-negative-challenge-review-packet.json");
const defaultObservationsPath = path.join(
  root,
  "docs",
  "review",
  "online-negative-challenge-contact-sheet-observations.json",
);
const schemaVersion = "asl-pilot-online-negative-challenge-review-packet/v1";
const requiredTypes = [
  "empty_camera",
  "no_hands_visible",
  "low_light",
  "off_center",
  "non_target_asl_sign",
  "waving",
  "hand_clap",
  "hands_cropped_out",
];
const minDownloadedPerType = 5;

function parseArgs(argv) {
  const args = {
    inputs: [...defaultInputs],
    output: defaultOutputPath,
    observations: defaultObservationsPath,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--input") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --input");
      args.inputs.push(resolveProjectPath(value, "--input"));
      index += 1;
      continue;
    }
    if (item === "--replace-default-inputs") {
      args.inputs = [];
      continue;
    }
    if (item === "--output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --output");
      args.output = resolveProjectPath(value, "--output");
      index += 1;
      continue;
    }
    if (item === "--observations") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --observations");
      args.observations = resolveProjectPath(value, "--observations");
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/export_online_negative_challenge_review_packet.mjs [--output docs/review/online-negative-challenge-review-packet.json]

Combines downloaded external-source review packets into one 20-clip online
negative challenge review packet. When prior contact-sheet observations exist,
they are used as non-final selection evidence to avoid known weak candidates.
The output is review input only; it is not source-register approval, final
manifest approval, or model evidence.
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

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function sourceIdForPacket(packetPath, clip) {
  if (projectRelative(packetPath).includes("wikimedia-commons")) {
    return "wikimedia-commons-negative-challenge-videos";
  }
  if (projectRelative(packetPath).includes("cira-negative-challenge")) {
    return "cira-satellite-library-negative-challenge-videos";
  }
  if (projectRelative(packetPath).includes("asl-citizen-non-target")) {
    return "asl-citizen-school-assignment-raw-videos";
  }
  if (projectRelative(packetPath).includes("internet-archive")) {
    return "internet-archive-negative-challenge-videos";
  }
  return clip.source_id ?? "unknown-external-source";
}

function countsByType(clips) {
  const counts = Object.fromEntries(requiredTypes.map((type) => [type, 0]));
  for (const clip of clips) {
    if (requiredTypes.includes(clip.challenge_type)) counts[clip.challenge_type] += 1;
  }
  return counts;
}

function loadSelectionObservations(observationsPath, blockers) {
  if (!fs.existsSync(observationsPath)) {
    return {
      reference: {
        path: projectRelative(observationsPath),
        exists: false,
        status: null,
      },
      byCandidate: new Map(),
    };
  }
  try {
    const observations = readJson(observationsPath);
    return {
      reference: {
        path: projectRelative(observationsPath),
        exists: true,
        status: observations.status ?? null,
        finality: observations.finality ?? null,
      },
      byCandidate: new Map(
        [
          ...(observations.observations ?? []),
          ...(observations.excluded_observations ?? []),
        ].map((observation) => [observation.candidate_id, observation]),
      ),
    };
  } catch (error) {
    blockers.push(`selection observations are not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return {
      reference: {
        path: projectRelative(observationsPath),
        exists: true,
        status: "invalid",
      },
      byCandidate: new Map(),
    };
  }
}

function visualRank(clip) {
  const status = clip.selection_evidence.visual_status;
  if (status === "strong_visual_candidate") return 0;
  if (status === "not_observed_in_prior_contact_sheet") return 1;
  if (status === "needs_human_review") return 2;
  if (status === "replace_before_final_manifest") return 3;
  return 1;
}

function buildPacket(args) {
  const blockers = [];
  const selectionObservations = loadSelectionObservations(args.observations, blockers);
  const sourcePackets = [];
  const candidatePool = [];
  let sourceIndex = 0;
  for (const input of args.inputs) {
    if (!fs.existsSync(input)) {
      blockers.push(`input review packet is missing: ${projectRelative(input)}`);
      continue;
    }
    const packet = readJson(input);
    sourcePackets.push({
      path: projectRelative(input),
      sha256: sha256File(input),
      schema_version: packet.schema_version ?? null,
      status: packet.status ?? null,
      finality: packet.finality ?? null,
    });
    for (const clip of packet.clips ?? []) {
      if (!requiredTypes.includes(clip.challenge_type)) continue;
      if (clip.downloaded !== true) continue;
      const observation = selectionObservations.byCandidate.get(clip.candidate_id) ?? null;
      candidatePool.push({
        ...clip,
        source_id: sourceIdForPacket(input, clip),
        selection_evidence: observation
          ? {
            visual_status: observation.visual_status,
            reason: observation.reason,
            recommended_action: observation.recommended_action,
          }
          : {
            visual_status: "not_observed_in_prior_contact_sheet",
            reason: "Candidate was not present in the prior mixed contact-sheet observation file.",
            recommended_action: "Review visually before any final manifest use.",
          },
        upstream_review_packet: {
          path: projectRelative(input),
          sha256: sha256File(input),
        },
        selection_source_index: sourceIndex,
      });
      sourceIndex += 1;
    }
  }

  const selected = [];
  const excludedCandidates = [];
  for (const type of requiredTypes) {
    const matches = candidatePool.filter((clip) => clip.challenge_type === type);
    const ranked = matches
      .filter((clip) => clip.selection_evidence.visual_status !== "replace_before_final_manifest")
      .sort((left, right) => {
        const rankDelta = visualRank(left) - visualRank(right);
        if (rankDelta !== 0) return rankDelta;
        return left.selection_source_index - right.selection_source_index;
      });
    const selectedForType = ranked.slice(0, minDownloadedPerType);
    const selectedIds = new Set(selectedForType.map((clip) => clip.candidate_id));
    selected.push(...selectedForType);
    for (const clip of matches) {
      if (selectedIds.has(clip.candidate_id)) continue;
      const status = clip.selection_evidence.visual_status;
      excludedCandidates.push({
        candidate_id: clip.candidate_id,
        challenge_type: clip.challenge_type,
        source_id: clip.source_id,
        visual_status: status,
        reason: status === "replace_before_final_manifest"
          ? "Excluded because prior contact-sheet observations recommended replacement."
          : "Not selected because stronger or newer candidates filled the required count.",
      });
    }
    if (ranked.length < minDownloadedPerType) {
      blockers.push(`combined packet needs ${minDownloadedPerType} selectable downloaded ${type} clips; found ${ranked.length}`);
    }
  }

  const counts = countsByType(selected);
  const sourceMix = {};
  for (const clip of selected) {
    const sourceCounts = sourceMix[clip.challenge_type] ?? {};
    sourceCounts[clip.source_id] = (sourceCounts[clip.source_id] ?? 0) + 1;
    sourceMix[clip.challenge_type] = sourceCounts;
  }

  return {
    schema_version: schemaVersion,
    status: blockers.length === 0 ? "ready_for_visual_review" : "blocked",
    evidence_mode: "mixed_external_source_candidate_visual_review",
    finality: "not_final_model_evidence",
    exported_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: {
        path: "scripts/export_online_negative_challenge_review_packet.mjs",
        sha256: sha256File(path.join(root, "scripts", "export_online_negative_challenge_review_packet.mjs")),
      },
    },
    selection_policy: {
      rule: "Use prior non-final contact-sheet observations when present; exclude replace_before_final_manifest; rank strong_visual_candidate before not_observed_in_prior_contact_sheet before needs_human_review; preserve source packet order within equal rank.",
      visual_observations: selectionObservations.reference,
    },
    source_packets: sourcePackets,
    reviewer: {
      name: "",
      role: "",
      qualification: "",
      affiliation_or_context: "",
      contact_or_signed_evidence: "",
      is_project_operator: true,
      reviewed_at: "",
    },
    review_instructions: [
      "Approve a clip only if the downloaded raw video matches the assigned challenge_type.",
      "Approve a clip only if no prompted ASL sign is present and the expected outcome should be reject.",
      "Reject clips with visible prompt-like signing, ambiguous challenge type, unavailable local video, or unacceptable source metadata.",
      "Do not use this packet as final source-register approval; exact-file rights review and final manifest generation are separate gates.",
      "If this mixed-source route is used, both source IDs must receive exact-file source-register approval before manifest generation.",
    ],
    required_counts: {
      min_downloaded_per_type: minDownloadedPerType,
      required_types: requiredTypes,
    },
    selected_count: selected.length,
    downloaded_counts_by_type: counts,
    source_mix_by_type: sourceMix,
    excluded_candidates: excludedCandidates,
    clips: selected,
    blockers,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const packet = buildPacket(args);
  writeJson(args.output, packet);
  console.log(JSON.stringify({
    status: packet.status,
    output: projectRelative(args.output),
    selected_count: packet.selected_count,
    downloaded_counts_by_type: packet.downloaded_counts_by_type,
    source_mix_by_type: packet.source_mix_by_type,
    blockers: packet.blockers,
  }, null, 2));
  return packet.status === "ready_for_visual_review" ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Online negative challenge review packet export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
