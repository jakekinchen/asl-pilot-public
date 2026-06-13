const DEFAULT_REDIRECT_PATH = "/";

export function safeRedirectPath(value: string | null | undefined, fallback = DEFAULT_REDIRECT_PATH) {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;

  try {
    const parsed = new URL(value, "https://asl-pilot.local");
    if (parsed.origin !== "https://asl-pilot.local") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function isSafeRedirectPath(value: string | null | undefined) {
  return safeRedirectPath(value, "") === value;
}
