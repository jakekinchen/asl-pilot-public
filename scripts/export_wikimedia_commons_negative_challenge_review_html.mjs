import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const defaultPacketPath = path.join(
  root,
  "docs",
  "review",
  "wikimedia-commons-negative-challenge-review-packet.json",
);
const defaultOutputPath = path.join(
  root,
  "docs",
  "review",
  "wikimedia-commons-negative-challenge-review.html",
);
const requiredTypes = ["empty_camera", "no_hands_visible", "low_light", "off_center"];

function parseArgs(argv) {
  const args = {
    packet: defaultPacketPath,
    output: defaultOutputPath,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help") {
      args.help = true;
      continue;
    }
    if (item === "--packet" || item === "--output") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${item}`);
      args[item.slice(2)] = resolveProjectPath(value, item);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function usage() {
  console.log(`Usage:
  node scripts/export_wikimedia_commons_negative_challenge_review_html.mjs [--packet docs/review/wikimedia-commons-negative-challenge-review-packet.json] [--output docs/review/wikimedia-commons-negative-challenge-review.html]

Exports a static human-review page for Wikimedia Commons negative challenge
candidates. The page is review input only; it is not source approval, manifest
approval, or final model evidence.
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function hrefFromOutput(outputPath, projectPath) {
  const absolute = resolveProjectPath(projectPath, "local_video_path");
  return path.relative(path.dirname(outputPath), absolute).split(path.sep).join("/");
}

function countsByType(clips, predicate) {
  const counts = Object.fromEntries(requiredTypes.map((type) => [type, 0]));
  for (const clip of clips) {
    if (requiredTypes.includes(clip.challenge_type) && predicate(clip)) {
      counts[clip.challenge_type] += 1;
    }
  }
  return counts;
}

function renderStatusTable(counts, approvedTarget) {
  return requiredTypes.map((type) => `
          <tr>
            <th scope="row">${escapeHtml(type)}</th>
            <td>${counts.downloaded[type]}</td>
            <td>${approvedTarget}</td>
            <td>${counts.downloaded[type] >= approvedTarget ? "ready for review" : "download incomplete"}</td>
          </tr>`).join("");
}

function renderClip(clip, outputPath) {
  const videoHref = clip.downloaded ? hrefFromOutput(outputPath, clip.local_video_path) : "";
  const sourceMetadata = clip.source_file_metadata ?? {};
  return `
        <section class="clip" data-challenge-type="${escapeHtml(clip.challenge_type)}">
          <div class="clip-media">
            ${clip.downloaded ? `
              <video controls preload="metadata" src="${escapeHtml(videoHref)}"></video>
            ` : `
              <div class="missing-video">not downloaded</div>
            `}
          </div>
          <div class="clip-detail">
            <div class="clip-eyebrow">${escapeHtml(clip.challenge_type)} · ${escapeHtml(clip.candidate_id)}</div>
            <h2>${escapeHtml(clip.source_file_page_title)}</h2>
            <dl>
              <div><dt>Expected</dt><dd>${escapeHtml(clip.expected_outcome)}</dd></div>
              <div><dt>License</dt><dd>${escapeHtml(clip.source_license_short_name)}</dd></div>
              <div><dt>Author</dt><dd>${escapeHtml(clip.source_author)}</dd></div>
              <div><dt>SHA-256</dt><dd>${escapeHtml(clip.downloaded_sha256 ?? "missing")}</dd></div>
              <div><dt>MIME</dt><dd>${escapeHtml(sourceMetadata.mime ?? "unknown")}</dd></div>
              <div><dt>Bytes</dt><dd>${escapeHtml(sourceMetadata.size_bytes ?? "unknown")}</dd></div>
            </dl>
            <p class="rationale">${escapeHtml(clip.selection_rationale)}</p>
            <div class="links">
              <a href="${escapeHtml(clip.source_page_url)}">Commons page</a>
              <a href="${escapeHtml(clip.source_file_url)}">Original file</a>
              ${clip.downloaded ? `<a href="${escapeHtml(videoHref)}">Local file</a>` : ""}
            </div>
            <div class="review-checks">
              <label><input type="checkbox" disabled> challenge type matches video</label>
              <label><input type="checkbox" disabled> no prompted ASL sign present</label>
              <label><input type="checkbox" disabled> expected reject outcome confirmed</label>
              <label><input type="checkbox" disabled> source metadata acceptable</label>
            </div>
          </div>
        </section>`;
}

function renderHtml(packet, args) {
  const clips = Array.isArray(packet.clips) ? packet.clips : [];
  const downloadedCounts = countsByType(clips, (clip) => clip.downloaded === true);
  const approvedTarget = packet.required_counts?.min_approved_per_type ?? 5;
  const counts = { downloaded: downloadedCounts };
  const packetSha256 = sha256File(args.packet);
  const generatedAt = new Date().toISOString();
  const blockers = Array.isArray(packet.blockers) ? packet.blockers : [];

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ASL Pilot Negative Challenge Review</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #1f2933;
        --muted: #52606d;
        --line: #d9e2ec;
        --bg: #f6f8fa;
        --panel: #ffffff;
        --accent: #0b7285;
        --warn: #9f580a;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--ink);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.45;
      }
      header, main {
        width: min(1180px, calc(100vw - 32px));
        margin: 0 auto;
      }
      header {
        padding: 28px 0 16px;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 28px;
        letter-spacing: 0;
      }
      h2 {
        margin: 4px 0 14px;
        font-size: 18px;
        letter-spacing: 0;
      }
      p { margin: 0; }
      .meta {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        margin-top: 16px;
      }
      .meta div, .blockers, .status {
        border: 1px solid var(--line);
        background: var(--panel);
        border-radius: 6px;
        padding: 12px;
      }
      .label {
        color: var(--muted);
        display: block;
        font-size: 12px;
        text-transform: uppercase;
      }
      .value {
        overflow-wrap: anywhere;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        border-bottom: 1px solid var(--line);
        padding: 8px;
        text-align: left;
      }
      th {
        color: var(--muted);
        font-weight: 600;
      }
      .blockers, .status {
        margin: 16px 0;
      }
      .blockers strong {
        color: var(--warn);
      }
      .clip {
        display: grid;
        grid-template-columns: minmax(300px, 44%) minmax(0, 1fr);
        gap: 18px;
        margin: 16px 0;
        padding: 14px;
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 6px;
      }
      video, .missing-video {
        width: 100%;
        aspect-ratio: 16 / 9;
        display: block;
        background: #111827;
        border-radius: 4px;
      }
      .missing-video {
        color: #ffffff;
        display: grid;
        place-items: center;
        font-size: 14px;
        text-transform: uppercase;
      }
      .clip-eyebrow {
        color: var(--accent);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
      }
      dl {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px 16px;
        margin: 0;
      }
      dl div {
        min-width: 0;
      }
      dt {
        color: var(--muted);
        font-size: 12px;
      }
      dd {
        margin: 0;
        overflow-wrap: anywhere;
      }
      .rationale {
        color: var(--muted);
        margin-top: 12px;
      }
      .links, .review-checks {
        display: flex;
        flex-wrap: wrap;
        gap: 10px 14px;
        margin-top: 12px;
      }
      a {
        color: var(--accent);
      }
      label {
        color: var(--muted);
        font-size: 13px;
      }
      @media (max-width: 820px) {
        .meta, .clip, dl {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>ASL Pilot Negative Challenge Review</h1>
      <p>This page is review input only. It is not source-register approval, manifest approval, or final model evidence.</p>
      <div class="meta">
        <div><span class="label">Generated</span><span class="value">${escapeHtml(generatedAt)}</span></div>
        <div><span class="label">Packet</span><span class="value">${escapeHtml(projectRelative(args.packet))}</span></div>
        <div><span class="label">Packet SHA-256</span><span class="value">${escapeHtml(packetSha256)}</span></div>
      </div>
    </header>
    <main>
      <section class="status">
        <h2>Download Coverage</h2>
        <table>
          <thead>
            <tr><th>Challenge type</th><th>Downloaded</th><th>Needed</th><th>Status</th></tr>
          </thead>
          <tbody>${renderStatusTable(counts, approvedTarget)}
          </tbody>
        </table>
      </section>
      <section class="blockers">
        <h2>Current Blockers</h2>
        ${blockers.length > 0 ? `<p><strong>${blockers.length} blocker(s):</strong> ${escapeHtml(blockers.join("; "))}</p>` : "<p>No packet blockers recorded.</p>"}
      </section>
      ${clips.map((clip) => renderClip(clip, args.output)).join("")}
    </main>
  </body>
</html>
`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return 0;
  }
  if (!fs.existsSync(args.packet)) {
    throw new Error(`Review packet does not exist: ${projectRelative(args.packet)}`);
  }
  const packet = readJson(args.packet);
  const html = renderHtml(packet, args);
  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, html, "utf8");
  console.log(JSON.stringify({
    status: "exported",
    output: projectRelative(args.output),
    packet: {
      path: projectRelative(args.packet),
      sha256: sha256File(args.packet),
    },
    finality: "review_input_only_not_final_model_evidence",
  }, null, 2));
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Wikimedia Commons review HTML export failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 2;
}
