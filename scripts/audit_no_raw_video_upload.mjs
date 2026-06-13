import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const sourceRoot = path.join(root, "web", "src");

const bannedPayloadFields = [
  "rawVideo",
  "video",
  "videoBlob",
  "videoFile",
  "videoData",
  "videoBase64",
  "frame",
  "frames",
  "frameData",
  "image",
  "imageBlob",
  "imageData",
  "imageBase64",
  "blob",
  "base64",
  "dataUrl",
  "dataURL",
  "recording",
  "clip",
  "media",
  "file",
];

const binaryPayloadPatterns = [
  /\bnew\s+FormData\s*\(/,
  /\bFormData\s*\(/,
  /\bnew\s+Blob\s*\(/,
  /\bBlob\s*\(/,
  /\bnew\s+File\s*\(/,
  /\bFile\s*\(/,
  /\bFileReader\s*\(/,
  /\.toDataURL\s*\(/,
  /\.toBlob\s*\(/,
  /\bgetImageData\s*\(/,
  /\bMediaRecorder\s*\(/,
  /\bArrayBuffer\s*\(/,
  /\bUint8Array\s*\(/,
];

const findings = [];

const explicitCollectionFiles = [
  path.join(sourceRoot, "app", "api", "dataset", "clips", "route.ts"),
  path.join(sourceRoot, "components", "DatasetCollectionPanel.tsx"),
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    if (entry.name === "node_modules" || entry.name === ".next") return [];
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return [fullPath];
  });
}

function lineNumber(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function balancedCallSource(text, startIndex) {
  const openIndex = text.indexOf("(", startIndex);
  if (openIndex === -1) return null;

  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = openIndex; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
    } else if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(startIndex, index + 1);
      }
    }
  }

  return null;
}

function record(file, index, reason) {
  findings.push({
    file: path.relative(root, file),
    line: lineNumber(fs.readFileSync(file, "utf8"), index),
    reason,
  });
}

function hasBannedPayloadField(source) {
  for (const field of bannedPayloadFields) {
    const pattern = new RegExp(`(?:["']${field}["']|\\b${field}\\b)\\s*:`);
    if (pattern.test(source)) return field;
  }
  return null;
}

function hasBannedBodyValue(source) {
  for (const field of bannedPayloadFields) {
    const pattern = new RegExp(`\\bbody\\s*:\\s*[^,}\\n]*\\b${field}\\b`);
    if (pattern.test(source)) return field;
  }
  return null;
}

function scanNetworkCalls(file, text) {
  const networkPattern = /\bfetch\s*\(|\baxios\.(?:post|put|patch)\s*\(|\bnavigator\.sendBeacon\s*\(/g;
  for (const match of text.matchAll(networkPattern)) {
    const callSource = balancedCallSource(text, match.index);
    if (!callSource) continue;

    const field = hasBannedPayloadField(callSource);
    if (field) {
      record(file, match.index, `network payload contains raw media field "${field}"`);
    }

    const bodyValue = hasBannedBodyValue(callSource);
    if (bodyValue) {
      record(file, match.index, `network body references raw media value "${bodyValue}"`);
    }

    for (const pattern of binaryPayloadPatterns) {
      if (pattern.test(callSource)) {
        record(file, match.index, `network call includes binary/camera payload API ${pattern}`);
      }
    }
  }
}

function scanFormDataAppends(file, text) {
  const appendPattern = /\.append\s*\(\s*["']([^"']+)["']/g;
  for (const match of text.matchAll(appendPattern)) {
    if (bannedPayloadFields.includes(match[1])) {
      record(file, match.index, `FormData append uses raw media field "${match[1]}"`);
    }
  }
}

function scanRoutePayloads(file, text) {
  const requestJsonPattern = /(?:const|let)\s+\{([^}]+)\}\s*=\s*await\s+[^;]*\.json\s*\(\s*\)/g;
  for (const match of text.matchAll(requestJsonPattern)) {
    const fields = match[1].split(",").map((field) => field.trim().split(/[:=\s]/)[0]);
    for (const field of fields) {
      if (bannedPayloadFields.includes(field)) {
        record(file, match.index, `API request body destructures raw media field "${field}"`);
      }
    }
  }
}

for (const file of walk(sourceRoot)) {
  if (!/\.[cm]?[jt]sx?$/.test(file)) continue;
  const text = fs.readFileSync(file, "utf8");
  if (explicitCollectionFiles.includes(file)) {
    if (!text.includes("EXPLICIT_DATASET_COLLECTION_")) {
      record(file, 0, "explicit dataset collection file is missing audit marker");
    }
    continue;
  }
  scanNetworkCalls(file, text);
  scanFormDataAppends(file, text);
  scanRoutePayloads(file, text);
}

if (findings.length > 0) {
  console.error("Potential raw video/frame upload paths found:");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line}: ${finding.reason}`);
  }
  process.exit(1);
}

console.log("No raw video/frame upload payloads found in web/src network or API code.");
