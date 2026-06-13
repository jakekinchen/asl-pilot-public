import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pipeline } from "node:stream/promises";

const root = path.resolve(import.meta.dirname, "..");
const defaultCandidatePath = path.join(
  root,
  "docs",
  "research",
  "cira-negative-challenge-candidates.json",
);
const defaultDownloadPath = path.join(
  root,
  "docs",
  "research",
  "cira-negative-challenge-downloads.json",
);
const sourceId = "cira-satellite-library-negative-challenge-videos";
const candidateSchemaVersion = "asl-pilot-cira-negative-challenge-candidates/v1";
const downloadSchemaVersion = "asl-pilot-cira-negative-challenge-downloads/v1";
const requiredTypes = ["empty_camera", "low_light", "off_center"];
const minCandidatesPerType = 5;
const sourceLicenseShortName = "CIRA/NOAA imagery credit required";
const sourceAuthor = "CIRA Staff";
const sourceCredit = "CSU/CIRA & NOAA; see https://satlib.cira.colostate.edu/credit-media/";
const userAgent = "asl-pilot-cira-negative-challenge-exporter/1.0";

const sourcePages = [
  {
    slug: "ground-snow-and-lake-effect-snow-at-night",
    title: "Ground Snow and Lake Effect Snow at Night",
    url: "https://satlib.cira.colostate.edu/weather_media/ground-snow-and-lake-effect-snow-at-night/",
    lowLightRationale: "Nighttime day/night-band satellite footage with no people or signing; candidate low-light reject clip after visual review.",
    offCenterRationale: "Portrait satellite render with no people or signing; candidate off-center/framing reject clip after visual review.",
  },
  {
    slug: "fog-spreads-through-californias-central-valley-at-night",
    title: "Fog Spreads Through California's Central Valley at Night",
    url: "https://satlib.cira.colostate.edu/weather_media/fog-spreads-through-californias-central-valley-at-night/",
    lowLightRationale: "Moonlit nighttime satellite footage with no people or signing; candidate low-light reject clip after visual review.",
    offCenterRationale: "Portrait nighttime satellite render with no people or signing; candidate off-center/framing reject clip after visual review.",
  },
  {
    slug: "tropical-cyclone-narelle-seen-intensifying-at-night",
    title: "Tropical Cyclone Narelle Seen Intensifying at Night",
    url: "https://satlib.cira.colostate.edu/weather_media/tropical-cyclone-narelle-seen-intensifying-at-night/",
    lowLightRationale: "Nighttime tropical cyclone satellite footage with no people or signing; candidate low-light reject clip after visual review.",
    offCenterRationale: "Portrait nighttime storm render with no people or signing; candidate off-center/framing reject clip after visual review.",
  },
  {
    slug: "lightning-flashes-from-line-of-thunderstorms-at-night",
    title: "Lightning Flashes From Line of Thunderstorms at Night",
    url: "https://satlib.cira.colostate.edu/weather_media/lightning-flashes-from-line-of-thunderstorms-at-night/",
    lowLightRationale: "Nighttime lightning satellite footage with no people or signing; candidate low-light reject clip after visual review.",
    offCenterRationale: "Portrait nighttime thunderstorm render with no people or signing; candidate off-center/framing reject clip after visual review.",
  },
  {
    slug: "brush-fire-at-night-in-south-florida",
    title: "Brush Fire at Night in South Florida",
    url: "https://satlib.cira.colostate.edu/weather_media/brush-fire-at-night-in-south-florida/",
    lowLightRationale: "Nighttime fire satellite footage with no people or signing; candidate low-light reject clip after visual review.",
    offCenterRationale: "Portrait nighttime fire render with no people or signing; candidate off-center/framing reject clip after visual review.",
  },
];

const emptyCameraSourcePages = [
  {
    slug: "snow-and-lake-ice-at-night-in-the-upper-midwest",
    title: "Snow and Lake Ice at Night in the Upper Midwest",
    url: "https://satlib.cira.colostate.edu/weather_media/snow-and-lake-ice-at-night-in-the-upper-midwest/",
    emptyCameraRationale: "No-human satellite imagery with no hands or signing; candidate empty-camera/no-signer reject clip after visual review.",
  },
  {
    slug: "trail-of-snow-streaks-across-the-central-us",
    title: "Trail of Snow Streaks Across the Central US",
    url: "https://satlib.cira.colostate.edu/weather_media/trail-of-snow-streaks-across-the-central-us/",
    emptyCameraRationale: "No-human satellite imagery with no hands or signing; candidate empty-camera/no-signer reject clip after visual review.",
  },
  {
    slug: "changes-in-the-permian-basin-oil-field-over-the-years",
    title: "Changes in the Permian Basin Oil Field Over the Years",
    url: "https://satlib.cira.colostate.edu/weather_media/changes-in-the-permian-basin-oil-field-over-the-years/",
    emptyCameraRationale: "No-human satellite imagery with no hands or signing; candidate empty-camera/no-signer reject clip after visual review.",
  },
  {
    slug: "mount-erebus-hotspot-seen-from-polar-orbiting-satellites",
    title: "Mount Erebus Hotspot Seen from Polar-Orbiting Satellites",
    url: "https://satlib.cira.colostate.edu/weather_media/mount-erebus-hotspot-seen-from-polar-orbiting-satellites/",
    emptyCameraRationale: "No-human satellite imagery with no hands or signing; candidate empty-camera/no-signer reject clip after visual review.",
  },
  {
    slug: "abundant-lightning-strikes-across-the-plains",
    title: "Abundant Lightning Strikes Across the Plains",
    url: "https://satlib.cira.colostate.edu/weather_media/abundant-lightning-strikes-across-the-plains/",
    emptyCameraRationale: "No-human satellite imagery with no hands or signing; candidate empty-camera/no-signer reject clip after visual review.",
  },
];

function parseArgs(argv) {
  const args = {
    output: defaultCandidatePath,
    downloads: defaultDownloadPath,
    write: false,
    download: false,
    delayMs: 500,
    maxDownloads: null,
  };
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
    if (item === "--download") {
      args.download = true;
      continue;
    }
    if (item === "--output" || item === "--downloads") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      args[item.slice(2)] = resolveProjectPath(value, item);
      index += 1;
      continue;
    }
    if (item === "--delay-ms" || item === "--max-downloads") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`${item} must be a non-negative integer`);
      if (item === "--delay-ms") args.delayMs = parsed;
      if (item === "--max-downloads") args.maxDownloads = parsed;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/export_cira_negative_challenge_candidates.mjs --write [--download] [--max-downloads 3]

Exports CIRA Satellite Library file-level candidates for the missing low_light
and off_center negative challenge buckets. With --download it also downloads
the direct MP4 files into ignored local raw-video storage and writes SHA-256
download evidence. This is candidate/review evidence only; it is not
source-register approval or final model evidence.
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

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeLabel(value) {
  return String(value ?? "").toLowerCase().replaceAll(/\s+/g, " ").trim();
}

function extractMp4Links(html) {
  const links = [];
  const pattern = /<a[^>]+href="([^"]+\.mp4)"[^>]*>([^<]+)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    links.push({
      href: match[1],
      label: match[2].trim(),
      normalizedLabel: normalizeLabel(match[2]),
    });
  }
  return links;
}

function chooseLink(links, preferredLabels, pageUrl) {
  const normalizedPreferred = preferredLabels.map(normalizeLabel);
  for (const label of normalizedPreferred) {
    const match = links.find((link) => link.normalizedLabel === label);
    if (match) return match;
  }
  throw new Error(`Missing preferred MP4 link on ${pageUrl}: ${preferredLabels.join(", ")}`);
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": userAgent } });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.text();
}

async function headMetadata(url) {
  const response = await fetch(url, {
    method: "HEAD",
    headers: { "user-agent": userAgent },
  });
  if (!response.ok) return rangedMetadata(url, response.status);
  const sizeHeader = response.headers.get("content-length");
  const sizeBytes = Number(sizeHeader);
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    throw new Error(`Missing positive content-length for ${url}`);
  }
  return {
    mime: "video/mp4",
    http_content_type: response.headers.get("content-type") ?? "",
    size_bytes: sizeBytes,
    etag: response.headers.get("etag") ?? "",
    last_modified: response.headers.get("last-modified") ?? "",
    source_sha256: null,
  };
}

async function rangedMetadata(url, headStatus) {
  const response = await fetch(url, {
    headers: {
      "user-agent": userAgent,
      range: "bytes=0-0",
    },
  });
  if (!response.ok) throw new Error(`HTTP ${headStatus} for ${url}; ranged GET returned HTTP ${response.status}`);
  const contentRange = response.headers.get("content-range") ?? "";
  const match = contentRange.match(/\/(\d+)$/);
  if (!match) throw new Error(`HTTP ${headStatus} for ${url}; ranged GET missing total content length`);
  const sizeBytes = Number(match[1]);
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    throw new Error(`HTTP ${headStatus} for ${url}; ranged GET returned invalid content length`);
  }
  await response.arrayBuffer();
  return {
    mime: "video/mp4",
    http_content_type: response.headers.get("content-type") ?? "",
    size_bytes: sizeBytes,
    etag: response.headers.get("etag") ?? "",
    last_modified: response.headers.get("last-modified") ?? "",
    source_sha256: null,
    metadata_fallback: {
      head_status: headStatus,
      method: "GET",
      range: "bytes=0-0",
      content_range: contentRange,
    },
  };
}

function localPathFor(page, challengeType) {
  return `data/external/cira-negative-challenge-videos/raw/${page.slug}-${challengeType}.mp4`;
}

function nextCandidateId(candidates, challengeType) {
  const prefix = challengeType.replaceAll("_", "-");
  const count = candidates.filter((item) => item.challenge_type === challengeType).length + 1;
  return `cira-${prefix}-${String(count).padStart(2, "0")}`;
}

async function buildCandidates() {
  const blockers = [];
  const candidates = [];
  const htmlByUrl = new Map();
  for (const page of sourcePages) {
    try {
      const html = htmlByUrl.get(page.url) ?? await fetchText(page.url);
      htmlByUrl.set(page.url, html);
      const links = extractMp4Links(html);
      const lowLightLink = chooseLink(links, ["mp4 (no labels)"], page.url);
      const offCenterLink = chooseLink(
        links,
        ["mp4 (portrait no labels)", "mp4 (portrait w/out labels)", "mp4 (portrait)"],
        page.url,
      );
      const specs = [
        {
          candidate_id: nextCandidateId(candidates, "low_light"),
          challenge_type: "low_light",
          link: lowLightLink,
          rationale: page.lowLightRationale,
          local_video_path: localPathFor(page, "low-light"),
        },
        {
          candidate_id: nextCandidateId(candidates, "off_center"),
          challenge_type: "off_center",
          link: offCenterLink,
          rationale: page.offCenterRationale,
          local_video_path: localPathFor(page, "off-center"),
        },
      ];
      for (const spec of specs) {
        const metadata = await headMetadata(spec.link.href);
        candidates.push({
          candidate_id: spec.candidate_id,
          challenge_type: spec.challenge_type,
          expected_outcome: "reject",
          review_status: "needs_visual_review",
          rights_review_status: "candidate_metadata_collected",
          final_manifest_eligible: false,
          source_record_id: `${page.title} - ${spec.link.label}`,
          source_page_url: page.url,
          source_file_url: spec.link.href,
          source_file_page_title: page.title,
          source_download_label: spec.link.label,
          source_license_short_name: sourceLicenseShortName,
          source_author: sourceAuthor,
          source_credit: sourceCredit,
          source_file_metadata: {
            license_short_name: sourceLicenseShortName,
            ...metadata,
          },
          selection_rationale: spec.rationale,
          suggested_local_video_path: spec.local_video_path,
          below_preferred_size_limit: metadata.size_bytes <= 100 * 1024 * 1024,
        });
      }
    } catch (error) {
      blockers.push(`${page.title}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  for (const page of emptyCameraSourcePages) {
    try {
      const html = htmlByUrl.get(page.url) ?? await fetchText(page.url);
      htmlByUrl.set(page.url, html);
      const links = extractMp4Links(html);
      const link = chooseLink(links, ["mp4 (no labels)"], page.url);
      const metadata = await headMetadata(link.href);
      candidates.push({
        candidate_id: nextCandidateId(candidates, "empty_camera"),
        challenge_type: "empty_camera",
        expected_outcome: "reject",
        review_status: "needs_visual_review",
        rights_review_status: "candidate_metadata_collected",
        final_manifest_eligible: false,
        source_record_id: `${page.title} - ${link.label}`,
        source_page_url: page.url,
        source_file_url: link.href,
        source_file_page_title: page.title,
        source_download_label: link.label,
        source_license_short_name: sourceLicenseShortName,
        source_author: sourceAuthor,
        source_credit: sourceCredit,
        source_file_metadata: {
          license_short_name: sourceLicenseShortName,
          ...metadata,
        },
        selection_rationale: page.emptyCameraRationale,
        suggested_local_video_path: localPathFor(page, "empty-camera"),
        below_preferred_size_limit: metadata.size_bytes <= 100 * 1024 * 1024,
      });
    } catch (error) {
      blockers.push(`${page.title}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  const countsByType = Object.fromEntries(requiredTypes.map((type) => [type, 0]));
  for (const candidate of candidates) {
    if (requiredTypes.includes(candidate.challenge_type)) countsByType[candidate.challenge_type] += 1;
    if (candidate.below_preferred_size_limit !== true) {
      blockers.push(`${candidate.candidate_id} exceeds the preferred 100 MB size limit`);
    }
  }
  for (const type of requiredTypes) {
    if (countsByType[type] < minCandidatesPerType) {
      blockers.push(`need at least ${minCandidatesPerType} ${type} candidates; found ${countsByType[type]}`);
    }
  }
  return {
    schema_version: candidateSchemaVersion,
    status: blockers.length === 0 ? "ready_for_visual_review" : "blocked",
    evidence_mode: "source_discovery_file_level",
    finality: "not_final_model_evidence",
    source_id: sourceId,
    source_scope: "negative_challenge_validation_candidates_only",
    exported_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: {
        path: "scripts/export_cira_negative_challenge_candidates.mjs",
        sha256: sha256File(path.join(root, "scripts", "export_cira_negative_challenge_candidates.mjs")),
      },
    },
    upstream_references: [
      {
        title: "CIRA Satellite Library credit guidance",
        url: "https://satlib.cira.colostate.edu/credit-media/",
      },
      ...sourcePages.map((page) => ({ title: page.title, url: page.url })),
    ],
    candidate_requirements: {
      required_challenge_types: requiredTypes,
      min_candidates_per_required_type: minCandidatesPerType,
      note: "CIRA candidates include fallback empty_camera replacements plus the low_light and off_center buckets missing from the current Wikimedia download evidence.",
    },
    candidate_count: candidates.length,
    counts_by_type: countsByType,
    candidates,
    blockers,
    next_steps: [
      "Visually review each downloaded CIRA candidate for the assigned challenge type.",
      "Reject or replace weak candidates before source-register approval.",
      "Create an exact-file source-rights review receipt before using CIRA files in any final manifest.",
      "Do not generate data/manifests/negative-challenge.json from this candidate file alone.",
    ],
  };
}

async function downloadFile(url, destination) {
  const response = await fetch(url, { headers: { "user-agent": userAgent } });
  if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const tempPath = `${destination}.tmp`;
  try {
    await pipeline(response.body, fs.createWriteStream(tempPath));
    fs.renameSync(tempPath, destination);
  } catch (error) {
    if (fs.existsSync(tempPath)) fs.rmSync(tempPath, { force: true });
    throw error;
  }
}

async function buildDownloadEvidence(candidateData, args) {
  const blockers = [];
  const downloads = [];
  let downloadAttempts = 0;
  for (const candidate of candidateData.candidates) {
    const localPath = resolveProjectPath(candidate.suggested_local_video_path, "suggested_local_video_path");
    try {
      const existedBefore = fs.existsSync(localPath);
      const shouldDownload =
        args.download
        && !existedBefore
        && (
          args.maxDownloads === null
          || downloadAttempts < args.maxDownloads
        );
      if (shouldDownload) {
        downloadAttempts += 1;
        await downloadFile(candidate.source_file_url, localPath);
        if (args.delayMs > 0) await sleep(args.delayMs);
      }
      const exists = fs.existsSync(localPath);
      const sizeBytes = exists ? fs.statSync(localPath).size : null;
      const sha256 = exists ? sha256File(localPath) : null;
      if (!exists) {
        blockers.push(`${candidate.candidate_id} was not downloaded`);
      } else if (sizeBytes !== candidate.source_file_metadata.size_bytes) {
        blockers.push(`${candidate.candidate_id} downloaded size mismatch; expected ${candidate.source_file_metadata.size_bytes}, got ${sizeBytes}`);
      }
      downloads.push({
        candidate_id: candidate.candidate_id,
        challenge_type: candidate.challenge_type,
        expected_outcome: candidate.expected_outcome,
        review_status: candidate.review_status,
        final_manifest_eligible: false,
        source_record_id: candidate.source_record_id,
        source_page_url: candidate.source_page_url,
        source_file_url: candidate.source_file_url,
        source_file_page_title: candidate.source_file_page_title,
        source_download_label: candidate.source_download_label,
        source_license_short_name: candidate.source_license_short_name,
        source_author: candidate.source_author,
        source_credit: candidate.source_credit,
        local_video_path: projectRelative(localPath),
        exists,
        size_bytes: sizeBytes,
        sha256,
        source_file_metadata: {
          ...candidate.source_file_metadata,
          source_sha256: sha256,
        },
      });
    } catch (error) {
      blockers.push(`${candidate.candidate_id} download failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return {
    schema_version: downloadSchemaVersion,
    status: blockers.length === 0 ? "downloaded" : "blocked",
    evidence_mode: "source_download_hashes",
    finality: "not_final_model_evidence",
    downloaded_at: new Date().toISOString(),
    generated_by: {
      tool: "node",
      command: [process.execPath, ...process.argv.slice(1)],
      script: {
        path: "scripts/export_cira_negative_challenge_candidates.mjs",
        sha256: sha256File(path.join(root, "scripts", "export_cira_negative_challenge_candidates.mjs")),
      },
    },
    candidate_pool: {
      path: projectRelative(args.output),
      sha256: fs.existsSync(args.output) ? sha256File(args.output) : null,
    },
    source_id: sourceId,
    source_scope: "negative_challenge_validation_candidates_only",
    downloaded_count: downloads.filter((item) => item.exists).length,
    downloads,
    blockers,
    next_steps: candidateData.next_steps,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  if (!args.write) {
    throw new Error("Use --write to write candidate evidence");
  }
  const candidates = await buildCandidates();
  writeJson(args.output, candidates);
  let downloads = null;
  if (args.download) {
    downloads = await buildDownloadEvidence(candidates, args);
    writeJson(args.downloads, downloads);
  }
  console.log(JSON.stringify({
    status: candidates.status,
    output: projectRelative(args.output),
    candidate_count: candidates.candidate_count,
    counts_by_type: candidates.counts_by_type,
    downloaded_count: downloads?.downloaded_count ?? null,
    downloads_output: downloads ? projectRelative(args.downloads) : null,
    blockers: [...candidates.blockers, ...(downloads?.blockers ?? [])],
  }, null, 2));
  return candidates.status === "ready_for_visual_review" && (!downloads || downloads.status === "downloaded") ? 0 : 1;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(`CIRA negative challenge candidate export failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  });
