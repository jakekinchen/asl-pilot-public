import { NextRequest, NextResponse } from "next/server";
import { saveAttempt } from "@/lib/server-store";
import { checkRateLimit, clientRateLimitKey } from "@/lib/rate-limit";
import { isSupabaseAuthEnabled } from "@/lib/supabase-server";
import { saveSupabaseAttempt } from "@/lib/supabase-store";

const BANNED_PAYLOAD_KEYS = [
  "frame",
  "frames",
  "image",
  "images",
  "video",
  "blob",
  "dataurl",
  "data_url",
  "pixels",
  "imageData",
  "raw",
];
const BANNED_PAYLOAD_KEY_SET = new Set(
  BANNED_PAYLOAD_KEYS.map((key) => key.toLowerCase().replace(/[-_]/g, "")),
);

const MAX_ATTEMPT_BODY_BYTES = 4096;
const MAX_SHORT_TEXT_LENGTH = 128;
const MAX_LONG_TEXT_LENGTH = 600;
const MAX_DURATION_MS = 30_000;
const MAX_FRAME_COUNT = 256;
const ALLOWED_ATTEMPT_KEYS = new Set([
  "vocabularyId",
  "passed",
  "confidence",
  "predictedId",
  "predictedLabel",
  "predicted_label",
  "modelId",
  "modelStatus",
  "hint",
  "reason",
  "durationMs",
  "duration_ms",
  "frameCount",
  "frame_count",
]);

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit(clientRateLimitKey(request, "attempts"), {
      limit: 30,
      windowMs: 60_000,
    });
    if (!rateLimit.ok) {
      return NextResponse.json(
        { error: "Too many practice attempts. Try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter) },
        },
      );
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_ATTEMPT_BODY_BYTES) {
      return NextResponse.json({ error: "Attempt payload is too large." }, { status: 413 });
    }

    const body = await readJsonObject(request);
    const bannedKey = findBannedCameraPayloadKey(body);
    if (bannedKey) {
      return NextResponse.json(
        { error: `Practice attempts may not upload raw camera data: ${bannedKey}` },
        { status: 400 },
      );
    }
    const attemptInput = parseAttemptInput(body);
    if (isSupabaseAuthEnabled()) {
      return await saveSupabaseAttempt(request, attemptInput);
    }

    const attempt = await saveAttempt({
      vocabularyId: attemptInput.vocabularyId,
      passed: attemptInput.passed,
      confidence: attemptInput.confidence,
      predictedId: attemptInput.predictedId,
      modelId: attemptInput.modelId,
      modelStatus: attemptInput.modelStatus,
      hint: attemptInput.hint,
      reason: attemptInput.reason,
      durationMs: attemptInput.durationMs,
      frameCount: attemptInput.frameCount,
    });
    return NextResponse.json({ attempt });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save attempt." },
      { status: 400 },
    );
  }
}

async function readJsonObject(request: Request) {
  const body = (await request.json()) as unknown;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Attempt payload must be a JSON object.");
  }
  return body as Record<string, unknown>;
}

function parseAttemptInput(body: Record<string, unknown>) {
  for (const key of Object.keys(body)) {
    if (!ALLOWED_ATTEMPT_KEYS.has(key)) {
      throw new Error(`Unsupported attempt field: ${key}.`);
    }
  }

  const confidence = Number(body.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new Error("Attempt confidence must be between 0 and 1.");
  }
  validateOptionalPredictedLabel(body.predictedLabel ?? body.predicted_label);

  return {
    vocabularyId: requiredString(body.vocabularyId, "vocabularyId", MAX_SHORT_TEXT_LENGTH),
    passed: body.passed === true,
    confidence,
    predictedId:
      body.predictedId === null || body.predictedId === undefined
        ? null
        : requiredString(body.predictedId, "predictedId", MAX_SHORT_TEXT_LENGTH),
    predictedLabel: optionalString(
      body.predictedLabel ?? body.predicted_label,
      "predictedLabel",
      MAX_SHORT_TEXT_LENGTH,
    ),
    modelId: requiredString(body.modelId ?? "unknown", "modelId", MAX_SHORT_TEXT_LENGTH),
    modelStatus: body.modelStatus === "trained" ? "trained" as const : "not_trained" as const,
    hint: boundedString(body.hint ?? "", "hint", MAX_LONG_TEXT_LENGTH),
    reason: boundedString(body.reason ?? "", "reason", MAX_LONG_TEXT_LENGTH),
    durationMs: optionalBoundedInteger(
      body.durationMs ?? body.duration_ms,
      "durationMs",
      0,
      MAX_DURATION_MS,
    ),
    frameCount: optionalBoundedInteger(
      body.frameCount ?? body.frame_count,
      "frameCount",
      1,
      MAX_FRAME_COUNT,
    ),
  };
}

function validateOptionalPredictedLabel(value: unknown) {
  optionalString(value, "predictedLabel", MAX_SHORT_TEXT_LENGTH);
}

function optionalString(value: unknown, field: string, maxLength: number) {
  if (value === null || value === undefined) return null;
  return boundedString(value, field, maxLength);
}

function requiredString(value: unknown, field: string, maxLength: number) {
  const stringValue = boundedString(value, field, maxLength).trim();
  if (!stringValue) throw new Error(`${field} is required.`);
  return stringValue;
}

function boundedString(value: unknown, field: string, maxLength: number) {
  if (typeof value !== "string") {
    throw new Error(`${field} must be a string.`);
  }
  if (value.length > maxLength) {
    throw new Error(`${field} must be ${maxLength} characters or fewer.`);
  }
  return value;
}

function optionalBoundedInteger(
  value: unknown,
  field: string,
  min: number,
  max: number,
) {
  if (value === null || value === undefined) return null;
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue < min || numberValue > max) {
    throw new Error(`${field} must be an integer between ${min} and ${max}.`);
  }
  return numberValue;
}

function findBannedCameraPayloadKey(value: unknown, path = "$"): string | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    if (value.length > 100) return path;
    for (let index = 0; index < value.length; index += 1) {
      const nested = findBannedCameraPayloadKey(value[index], `${path}[${index}]`);
      if (nested) return nested;
    }
    return null;
  }
  for (const [key, nestedValue] of Object.entries(value)) {
    const normalized = key.toLowerCase().replace(/[-_]/g, "");
    if (BANNED_PAYLOAD_KEY_SET.has(normalized)) {
      return `${path}.${key}`;
    }
    if (typeof nestedValue === "string" && nestedValue.startsWith("data:")) {
      return `${path}.${key}`;
    }
    const nested = findBannedCameraPayloadKey(nestedValue, `${path}.${key}`);
    if (nested) return nested;
  }
  return null;
}
