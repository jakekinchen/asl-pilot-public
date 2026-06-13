import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultOutputPath = path.join(
  root,
  "docs",
  "research",
  "wikimedia-commons-negative-challenge-candidates.json",
);
const schemaVersion = "asl-pilot-wikimedia-commons-negative-challenge-candidates/v1";
const sourceId = "wikimedia-commons-negative-challenge-videos";
const commonsApiEndpoint = "https://commons.wikimedia.org/w/api.php";
const commonsApiDocsUrl = "https://commons.wikimedia.org/wiki/Commons:API";
const commonsVideoDocsUrl = "https://commons.wikimedia.org/wiki/Commons:Video?uselang=en-gb";
const allowedMimeTypes = new Set(["video/webm", "application/ogg", "video/ogg"]);
const requiredTypes = [
  "empty_camera",
  "no_hands_visible",
  "low_light",
  "off_center",
  "waving",
  "hand_clap",
  "hands_cropped_out",
];
const minCandidatesPerType = 5;
const maxPreferredBytes = 100 * 1024 * 1024;

const selectedCandidates = [
  {
    challenge_type: "empty_camera",
    title: "File:USVI MVI 5231 - Dark blue sofas with white pillows face a wooden bookshelf filled with shells and sculptures in a cozy living room.webm",
    selection_rationale: "Indoor room scene with no visible signer; needs final visual review for empty-camera suitability.",
  },
  {
    challenge_type: "empty_camera",
    title: "File:Infinity Dots Mirrored Room at the Mattress Factory.webm",
    selection_rationale: "Room/environment footage with no prompt-sign content; needs final visual review.",
  },
  {
    challenge_type: "empty_camera",
    title: "File:Marsrover Perseverance Navcam Sol 738 (52788862763).webm",
    selection_rationale: "No-human scene suitable as a no-signer negative candidate after final review.",
  },
  {
    challenge_type: "empty_camera",
    title: "File:Video - Pre - Sunrise on Mars a few hours ago NASA's Perseverance Rover SOL 738 (52757034776).webm",
    selection_rationale: "No-human low-motion scene suitable as a no-signer negative candidate after final review.",
  },
  {
    challenge_type: "empty_camera",
    title: "File:Porto Velho Landscape Changes (51217296231).webm",
    selection_rationale: "Landscape/change visualization with no signer; needs final visual review.",
  },
  {
    challenge_type: "no_hands_visible",
    title: "File:Earth at Night 2012 (SVS30028).webm",
    selection_rationale: "No visible hands or signer; needs final visual review for no-hands challenge use.",
  },
  {
    challenge_type: "no_hands_visible",
    title: "File:HoloGlobe- Earth at Night (SVS1320).webm",
    selection_rationale: "No visible hands or signer; small WebM candidate.",
  },
  {
    challenge_type: "no_hands_visible",
    title: "File:Ocean Moon Glint and City Night Lights in 4K.webm",
    selection_rationale: "No visible hands or signer; needs final visual review.",
  },
  {
    challenge_type: "no_hands_visible",
    title: "File:Change in Night Lights between 2012 and 2023 (SVS5276 - nightlights flat series stills 2160p3 h265).webm",
    selection_rationale: "No visible hands or signer; small WebM candidate.",
  },
  {
    challenge_type: "no_hands_visible",
    title: "File:Raindrops against the window in the night city, Las Palmas.webm",
    selection_rationale: "No visible hands or signer; low-light window scene candidate.",
  },
  {
    challenge_type: "low_light",
    title: "File:Night view of Chicago.webm",
    selection_rationale: "Night scene candidate for low-light rejection after visual review.",
  },
  {
    challenge_type: "low_light",
    title: "File:City at night.webm",
    selection_rationale: "Night city scene candidate for low-light rejection after visual review.",
  },
  {
    challenge_type: "low_light",
    title: "File:Night landscape of Bhopal city.webm",
    selection_rationale: "Night landscape scene candidate for low-light rejection after visual review.",
  },
  {
    challenge_type: "low_light",
    title: "File:Beni Mellal city at night.webm",
    selection_rationale: "Night city scene candidate for low-light rejection after visual review.",
  },
  {
    challenge_type: "low_light",
    title: "File:Park Fire Explodes During the Night (CIRA 2024-07-25 - nolabels).webm",
    selection_rationale: "Dark/night visualization candidate without signer content.",
  },
  {
    challenge_type: "off_center",
    title: "File:Center of Bomb Cyclone Swirling Over Pacific Ocean (CIRA 2024-11-20 - portrait).webm",
    selection_rationale: "Portrait/atypical framing candidate for off-center review.",
  },
  {
    challenge_type: "off_center",
    title: "File:Park Fire Explodes During the Night (CIRA 2024-07-25 - labels portrait).webm",
    selection_rationale: "Portrait/atypical framing candidate; labels must be considered during final review.",
  },
  {
    challenge_type: "off_center",
    title: "File:Park Fire Explodes During the Night (CIRA 2024-07-25 - nolabels portrait).webm",
    selection_rationale: "Portrait/atypical framing candidate without labels.",
  },
  {
    challenge_type: "off_center",
    title: "File:Revealing Circulation of Tropical Storm Juliette (CIRA 2025-08-27 - nolabels portrait).webm",
    selection_rationale: "Portrait/atypical framing candidate without labels.",
  },
  {
    challenge_type: "off_center",
    title: "File:The Alaska Range Casts Long Shadows in Winter Light (CIRA 2025-12-08 - nolabels portrait).webm",
    selection_rationale: "Portrait/atypical framing candidate without labels.",
  },
  {
    challenge_type: "waving",
    title: "File:HandWaveExample.webm",
    selection_rationale: "Explicit single-hand wave example clip; small WebM. Needs final visual review to confirm hand wave is sustained throughout the clip.",
  },
  {
    challenge_type: "waving",
    title: "File:Amrita Vidyalayam children waving.webm",
    selection_rationale: "Children waving at the camera; small WebM. Needs final visual review for sustained wave motion.",
  },
  {
    challenge_type: "waving",
    title: "File:Vertrek van Sylvain Poons-514962.ogv",
    selection_rationale: "Historical Dutch newsreel of a departure scene with waving farewells. Needs final visual review for sustained wave motion across the clip.",
  },
  {
    challenge_type: "waving",
    title: "File:De haringvloot kiest weer zee-509145.ogv",
    selection_rationale: "Historical Dutch newsreel of a sailing departure with waving. Needs final visual review for sustained wave motion across the clip.",
  },
  {
    challenge_type: "waving",
    title: "File:Afscheid van dr. Jac. Thijsse Weeknummer 30-27 - Open Beelden - 29704.ogv",
    selection_rationale: "Historical Dutch newsreel farewell scene with waving. Needs final visual review for sustained wave motion across the clip.",
  },
  {
    challenge_type: "hand_clap",
    title: "File:Applaudissements à la Wikiconvention Francophone 2022.webm",
    selection_rationale: "Audience applause/clapping at a Wikimedia event; small WebM. Needs final visual review for sustained hand clapping.",
  },
  {
    challenge_type: "hand_clap",
    title: "File:Clap for NHS Thousands clap hands together in round of applause for NHS workers Metro.webm",
    selection_rationale: "Reportage clip of people clapping. Needs final visual review for sustained hand clapping across the clip.",
  },
  {
    challenge_type: "hand_clap",
    title: "File:Pro-Yoon protestors clap to music.webm",
    selection_rationale: "Protest crowd clapping to music. Needs final visual review for sustained hand clapping.",
  },
  {
    challenge_type: "hand_clap",
    title: "File:Clapping for the nhs.webm",
    selection_rationale: "Outdoor clapping for the NHS. Needs final visual review for sustained hand clapping.",
  },
  {
    challenge_type: "hand_clap",
    title: "File:Clap The Carers 2nd April 2020.webm",
    selection_rationale: "Documentary-style clapping clip. Needs final visual review for sustained hand clapping.",
  },
  {
    challenge_type: "hands_cropped_out",
    title: "File:NASA Interview Opportunity- Celebrate our Dynamic Planet with a NASA Expert this Earth Day (SVS14327 - John Bolten 2023 EarthDay Interview).webm",
    selection_rationale: "NASA studio-interview B-roll with head-and-shoulders framing; hands expected outside frame in seated talking-head shot. Needs final visual review for sustained hands-out-of-frame across clip.",
  },
  {
    challenge_type: "hands_cropped_out",
    title: "File:NASA Interview Opportunity- Celebrate our Dynamic Planet with a NASA Expert this Earth Day (SVS14327 - Lesley Ott 2023EarthDay Interview).webm",
    selection_rationale: "NASA studio-interview B-roll with head-and-shoulders framing; hands expected outside frame in seated talking-head shot. Needs final visual review for sustained hands-out-of-frame across clip.",
  },
  {
    challenge_type: "hands_cropped_out",
    title: "File:NASA Interview Opportunity- Summer Solstice Leads to an Exciting Year for Our Sun Live Shots (SVS14348 - Alex Young Canned Summer Solstice).webm",
    selection_rationale: "NASA studio-interview B-roll with head-and-shoulders framing; hands expected outside frame in seated talking-head shot. Needs final visual review for sustained hands-out-of-frame across clip.",
  },
  {
    challenge_type: "hands_cropped_out",
    title: "File:NASA Interview Opportunity- Celebrate our Dynamic Planet with a NASA Expert this Earth Day (SVS14327 - john bolten graphics).webm",
    selection_rationale: "NASA studio-interview B-roll (graphics overlay variant) with head-and-shoulders framing; hands expected outside frame. Needs final visual review.",
  },
  {
    challenge_type: "hands_cropped_out",
    title: "File:NASA Interview Opportunity- Celebrate our Dynamic Planet with a NASA Expert this Earth Day (SVS14327 - john bolten no graphics).webm",
    selection_rationale: "NASA studio-interview B-roll (no-graphics variant) with head-and-shoulders framing; hands expected outside frame. Needs final visual review.",
  },
  {
    challenge_type: "hands_cropped_out",
    title: "File:NASA Interview Opportunity- Celebrate our Dynamic Planet with a NASA Expert this Earth Day (SVS14327 - leslie ott graphics).webm",
    selection_rationale: "NASA studio-interview B-roll (graphics overlay variant) with head-and-shoulders framing; hands expected outside frame. Needs final visual review.",
  },
  {
    challenge_type: "hands_cropped_out",
    title: "File:NASA Interview Opportunity- Celebrate our Dynamic Planet with a NASA Expert this Earth Day (SVS14327 - 2023-EarthDay V8).webm",
    selection_rationale: "NASA studio-interview B-roll variant with head-and-shoulders framing; hands expected outside frame. Needs final visual review.",
  },
  {
    challenge_type: "hands_cropped_out",
    title: "File:NASA Interview Opportunity- Celebrate our Dynamic Planet with a NASA Expert this Earth Day (SVS14327 - leslie ott no graphics).webm",
    selection_rationale: "NASA studio-interview B-roll (no-graphics variant) with head-and-shoulders framing; hands expected outside frame. Needs final visual review.",
  },
  {
    challenge_type: "hands_cropped_out",
    title: "File:NASA Interview Opportunity- Summer Solstice Leads to an Exciting Year for Our Sun Live Shots (SVS14348 - 14348 SummerSolsticeLiveShot Broll-HQ).webm",
    selection_rationale: "NASA studio-interview B-roll (Summer Solstice live-shot package) with head-and-shoulders framing; hands expected outside frame. Needs final visual review.",
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
  node scripts/export_wikimedia_commons_negative_challenge_candidates.mjs [--write] [--output docs/research/wikimedia-commons-negative-challenge-candidates.json]

Fetches current Wikimedia Commons metadata for a curated, file-level candidate
pool for reject-only negative challenge clips. This is not final model evidence;
it is a source-rights and visual-review input.
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

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function stripHtml(value) {
  if (typeof value !== "string") return null;
  const text = value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, "\"")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0 ? text : null;
}

function extValue(metadata, key) {
  return stripHtml(metadata?.[key]?.value);
}

function candidateId(challengeType, index) {
  return `wikimedia-${challengeType.replaceAll("_", "-")}-${String(index + 1).padStart(2, "0")}`;
}

async function fetchCommonsMetadata(titles) {
  const url = new URL(commonsApiEndpoint);
  url.searchParams.set("action", "query");
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("titles", titles.join("|"));
  url.searchParams.set("iiprop", "url|mime|size|sha1|extmetadata");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  const response = await fetch(url, {
    headers: {
      "user-agent": "asl-pilot-wikimedia-negative-challenge-candidates/1.0",
    },
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Commons API request failed with HTTP ${response.status}: ${body.slice(0, 200)}`);
  }
  return {
    url: url.toString(),
    status: response.status,
    body_sha256: sha256Text(body),
    json: JSON.parse(body),
  };
}

function titleMetadataMap(apiJson) {
  const pages = Array.isArray(apiJson.query?.pages) ? apiJson.query.pages : [];
  const byTitle = new Map();
  for (const page of pages) {
    if (typeof page?.title === "string") byTitle.set(page.title, page);
  }
  return byTitle;
}

function buildCandidate(selection, page, indexByType) {
  const imageInfo = Array.isArray(page?.imageinfo) ? page.imageinfo[0] : null;
  const extmetadata = imageInfo?.extmetadata ?? {};
  const challengeType = selection.challenge_type;
  const sourcePageUrl = imageInfo?.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(selection.title.replaceAll(" ", "_"))}`;
  const sourceFileUrl = imageInfo?.url ?? null;
  const licenseShortName = extValue(extmetadata, "LicenseShortName");
  const author = extValue(extmetadata, "Artist") ?? extValue(extmetadata, "Author") ?? extValue(extmetadata, "Credit");
  const credit = extValue(extmetadata, "Credit");
  return {
    candidate_id: candidateId(challengeType, indexByType),
    challenge_type: challengeType,
    expected_outcome: "reject",
    review_status: "needs_visual_review",
    rights_review_status: "candidate_metadata_collected",
    final_manifest_eligible: false,
    source_record_id: selection.title,
    source_file_page_title: selection.title,
    source_page_url: sourcePageUrl,
    source_file_url: sourceFileUrl,
    source_license_short_name: licenseShortName,
    source_author: author,
    source_credit: credit,
    source_file_metadata: {
      license_short_name: licenseShortName,
      mime: imageInfo?.mime ?? null,
      size_bytes: imageInfo?.size ?? null,
      commons_sha1: imageInfo?.sha1 ?? null,
      source_sha256: null,
    },
    selection_rationale: selection.selection_rationale,
    preferred_size_limit_bytes: maxPreferredBytes,
    below_preferred_size_limit: Number.isFinite(imageInfo?.size) ? imageInfo.size <= maxPreferredBytes : false,
    suggested_local_video_path: `data/external/${sourceId}/raw/${selection.title.replace(/^File:/, "").replace(/[^A-Za-z0-9._-]+/g, "_")}`,
  };
}

function summarizeCounts(candidates) {
  const counts = Object.fromEntries(requiredTypes.map((type) => [type, 0]));
  for (const candidate of candidates) {
    if (candidate.challenge_type in counts) counts[candidate.challenge_type] += 1;
  }
  return counts;
}

function validateCandidates(candidates, missingTitles) {
  const blockers = [];
  if (missingTitles.length > 0) {
    blockers.push(`Commons API did not return metadata for: ${missingTitles.join(", ")}`);
  }
  const seenTitles = new Set();
  for (const [index, candidate] of candidates.entries()) {
    const context = `candidates[${index}]`;
    if (seenTitles.has(candidate.source_file_page_title)) {
      blockers.push(`${context} duplicates ${candidate.source_file_page_title}`);
    }
    seenTitles.add(candidate.source_file_page_title);
    if (!requiredTypes.includes(candidate.challenge_type)) {
      blockers.push(`${context}.challenge_type is not required: ${candidate.challenge_type}`);
    }
    if (candidate.expected_outcome !== "reject") {
      blockers.push(`${context}.expected_outcome must be reject`);
    }
    if (candidate.final_manifest_eligible !== false) {
      blockers.push(`${context}.final_manifest_eligible must remain false before review/import`);
    }
    if (!candidate.source_page_url?.startsWith("https://commons.wikimedia.org/wiki/")) {
      blockers.push(`${context}.source_page_url must be a Commons file page URL`);
    }
    if (!candidate.source_file_url?.startsWith("https://upload.wikimedia.org/")) {
      blockers.push(`${context}.source_file_url must be a Wikimedia upload URL`);
    }
    if (!allowedMimeTypes.has(candidate.source_file_metadata?.mime)) {
      blockers.push(`${context}.source_file_metadata.mime must be WebM/Ogg`);
    }
    if (!candidate.source_license_short_name) {
      blockers.push(`${context}.source_license_short_name is missing`);
    }
    if (!candidate.source_author) {
      blockers.push(`${context}.source_author is missing`);
    }
    if (!Number.isFinite(candidate.source_file_metadata?.size_bytes) || candidate.source_file_metadata.size_bytes <= 0) {
      blockers.push(`${context}.source_file_metadata.size_bytes must be positive`);
    }
    if (!candidate.below_preferred_size_limit) {
      blockers.push(`${context} exceeds preferred size limit: ${candidate.source_file_metadata?.size_bytes}`);
    }
  }
  const counts = summarizeCounts(candidates);
  for (const type of requiredTypes) {
    if (counts[type] < minCandidatesPerType) {
      blockers.push(`candidate pool needs at least ${minCandidatesPerType} ${type} candidates; found ${counts[type]}`);
    }
  }
  return blockers;
}

async function buildCandidateFile(outputPath) {
  const titles = selectedCandidates.map((candidate) => candidate.title);
  const apiReceipt = await fetchCommonsMetadata(titles);
  const byTitle = titleMetadataMap(apiReceipt.json);
  const missingTitles = titles.filter((title) => !byTitle.has(title));
  const indexByType = Object.fromEntries(requiredTypes.map((type) => [type, 0]));
  const candidates = [];
  for (const selection of selectedCandidates) {
    const page = byTitle.get(selection.title);
    if (!page) continue;
    const index = indexByType[selection.challenge_type];
    indexByType[selection.challenge_type] += 1;
    candidates.push(buildCandidate(selection, page, index));
  }
  const blockers = validateCandidates(candidates, missingTitles);
  return {
    schema_version: schemaVersion,
    status: blockers.length === 0 ? "ready_for_visual_review" : "blocked",
    evidence_mode: "source_discovery_file_level",
    finality: "not_final_model_evidence",
    generated_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: {
        path: "scripts/export_wikimedia_commons_negative_challenge_candidates.mjs",
        sha256: sha256File(path.join(root, "scripts", "export_wikimedia_commons_negative_challenge_candidates.mjs")),
      },
    },
    output: projectRelative(outputPath),
    source_id: sourceId,
    source_kind: "public_reference_dataset",
    source_scope: "negative_challenge_validation_candidates_only",
    source_references: [
      {
        label: "Wikimedia Commons API",
        url: commonsApiDocsUrl,
      },
      {
        label: "Wikimedia Commons video format guidance",
        url: commonsVideoDocsUrl,
      },
      {
        label: "Wikimedia Commons API metadata request",
        url: apiReceipt.url,
        http_status: apiReceipt.status,
        response_sha256: apiReceipt.body_sha256,
      },
    ],
    candidate_requirements: {
      required_challenge_types: requiredTypes,
      min_candidates_per_required_type: minCandidatesPerType,
      allowed_mime_types: [...allowedMimeTypes],
      preferred_max_size_bytes: maxPreferredBytes,
      expected_outcome: "reject",
      final_manifest_eligible_before_review: false,
    },
    candidate_count: candidates.length,
    counts_by_type: summarizeCounts(candidates),
    candidates,
    blockers,
    next_steps: [
      "Visually review every candidate against its assigned challenge_type.",
      "Download only approved raw video files and record SHA-256 hashes.",
      "Create a source-rights review receipt for the exact approved files.",
      "Add a source-register entry only after exact-file source review passes.",
      "Generate and decode data/manifests/negative-challenge.json.",
    ],
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  const candidateFile = await buildCandidateFile(args.output);
  if (args.write) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, `${JSON.stringify(candidateFile, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: candidateFile.status,
    wrote: args.write,
    output: projectRelative(args.output),
    source_id: candidateFile.source_id,
    candidate_count: candidateFile.candidate_count,
    counts_by_type: candidateFile.counts_by_type,
    blockers: candidateFile.blockers,
  }, null, 2));
  return candidateFile.status === "ready_for_visual_review" ? 0 : 1;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(`Wikimedia Commons candidate export failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  });
